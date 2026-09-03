import { env } from 'cloudflare:workers';
import { SCHEMA_STATEMENTS } from '@/db/schema';
import { SOURCE_REGISTRY } from './config';
import type {
  ClusterCandidate,
  EventType,
  InboxState,
  NormalizedEvent,
  SourceConfig,
  SourceHealth,
  SourceRecord,
  UserStateRecord,
} from './types';

const DEFAULT_USER_ID = 'local-researcher';
let schemaPromise: Promise<void> | null = null;

type SourceRow = {
  source_id: string;
  name: string;
  provider: SourceConfig['provider'];
  url: string;
  language: string;
  source_tier: number;
  publisher_family: string;
  enabled: number;
  poll_minutes: number;
  rights_note: string;
  etag: string | null;
  last_modified: string | null;
  retry_after_at: string | null;
  last_attempt_at: string | null;
  last_success_at: string | null;
  last_status: string;
  last_error: string | null;
  last_item_count: number;
  last_latency_ms: number | null;
  consecutive_failures: number;
};

export type EventRow = {
  event_id: string;
  cluster_id: string;
  source_id: string;
  source_name: string;
  publisher_family: string;
  source_tier: number;
  title: string;
  url: string;
  canonical_url: string;
  published_at: string;
  updated_at: string;
  ingested_at: string;
  tickers_json: string;
  event_types_json: string;
  relevance: number;
  importance: number;
  credibility: number;
  freshness: number;
  is_sample: number;
  first_seen_at?: string;
  last_seen_at?: string;
};

function database() {
  if (!env.DB) throw new Error('D1 binding DB is unavailable');
  return env.DB;
}

async function runBatches(statements: D1PreparedStatement[], size = 60) {
  const db = database();
  for (let index = 0; index < statements.length; index += size) {
    await db.batch(statements.slice(index, index + size));
  }
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = database();
      await runBatches(SCHEMA_STATEMENTS.map((statement) => db.prepare(statement)));
      await db.prepare('PRAGMA optimize').run();
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  await schemaPromise;
}

async function syncSourceRegistry() {
  const db = database();
  const now = new Date().toISOString();
  await runBatches(
    SOURCE_REGISTRY.map((source) => db.prepare(
      `INSERT INTO sources (
        source_id, name, provider, url, language, source_tier, publisher_family,
        enabled, poll_minutes, rights_note, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source_id) DO UPDATE SET
        name = excluded.name,
        provider = excluded.provider,
        url = excluded.url,
        language = excluded.language,
        source_tier = excluded.source_tier,
        publisher_family = excluded.publisher_family,
        enabled = excluded.enabled,
        poll_minutes = excluded.poll_minutes,
        rights_note = excluded.rights_note,
        updated_at = excluded.updated_at`,
    ).bind(
      source.id,
      source.name,
      source.provider,
      source.url,
      source.language,
      source.sourceTier,
      source.publisherFamily,
      source.enabled ? 1 : 0,
      source.pollMinutes,
      source.rightsNote,
      now,
    )),
  );
}

export async function initializeStore() {
  await ensureSchema();
  await syncSourceRegistry();
}

function sourceConfigFor(row: SourceRow) {
  return SOURCE_REGISTRY.find((source) => source.id === row.source_id);
}

function mapSourceRow(row: SourceRow): SourceRecord {
  const config = sourceConfigFor(row);
  return {
    id: row.source_id,
    name: row.name,
    provider: row.provider,
    url: row.url,
    query: config?.query,
    language: row.language,
    sourceTier: row.source_tier,
    publisherFamily: row.publisher_family,
    pollMinutes: row.poll_minutes,
    rightsNote: row.rights_note,
    enabled: row.enabled === 1,
    etag: row.etag,
    lastModified: row.last_modified,
    retryAfterAt: row.retry_after_at,
    lastAttemptAt: row.last_attempt_at,
    lastSuccessAt: row.last_success_at,
    lastStatus: row.last_status,
    lastError: row.last_error,
    lastItemCount: row.last_item_count,
    lastLatencyMs: row.last_latency_ms,
    consecutiveFailures: row.consecutive_failures,
  };
}

export async function listSourceRecords() {
  const result = await database().prepare('SELECT * FROM sources WHERE enabled = 1 ORDER BY source_tier, name').all<SourceRow>();
  return result.results.map(mapSourceRow);
}

export function sourceIsDue(source: SourceRecord, force: boolean, now = Date.now()) {
  if (source.retryAfterAt && Date.parse(source.retryAfterAt) > now) return false;
  if (force) return true;
  if (!source.lastAttemptAt) return true;
  return now - Date.parse(source.lastAttemptAt) >= source.pollMinutes * 60_000;
}

export async function recordIngestion(input: {
  source: SourceRecord;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  status: 'success' | 'empty' | 'not_modified' | 'error';
  itemCount: number;
  etag?: string | null;
  lastModified?: string | null;
  errorClass?: string | null;
  errorMessage?: string | null;
  retryAfterAt?: string | null;
}) {
  const db = database();
  const successful = input.status !== 'error';
  const runId = crypto.randomUUID();
  await db.batch([
    db.prepare(
      `INSERT INTO ingestion_runs (
        run_id, source_id, started_at, completed_at, status, item_count,
        latency_ms, error_class, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      runId,
      input.source.id,
      input.startedAt,
      input.completedAt,
      input.status,
      input.itemCount,
      input.latencyMs,
      input.errorClass ?? null,
      input.errorMessage ?? null,
    ),
    db.prepare(
      `UPDATE sources SET
        etag = COALESCE(?, etag),
        last_modified = COALESCE(?, last_modified),
        retry_after_at = ?,
        last_attempt_at = ?,
        last_success_at = CASE WHEN ? = 1 THEN ? ELSE last_success_at END,
        last_status = ?,
        last_error = ?,
        last_item_count = CASE WHEN ? = 'not_modified' THEN last_item_count ELSE ? END,
        last_latency_ms = ?,
        consecutive_failures = CASE WHEN ? = 1 THEN 0 ELSE consecutive_failures + 1 END,
        updated_at = ?
      WHERE source_id = ?`,
    ).bind(
      input.etag ?? null,
      input.lastModified ?? null,
      input.retryAfterAt ?? null,
      input.completedAt,
      successful ? 1 : 0,
      input.completedAt,
      input.status,
      input.errorMessage ?? null,
      input.status,
      input.itemCount,
      input.latencyMs,
      successful ? 1 : 0,
      input.completedAt,
      input.source.id,
    ),
  ]);
}

function parseList<T extends string>(value: string) {
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

export async function listRecentCandidates(hours = 96): Promise<ClusterCandidate[]> {
  const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();
  const result = await database().prepare(
    `SELECT event_id, cluster_id, title, tickers_json, event_types_json, published_at
     FROM events
     WHERE published_at >= ?
     ORDER BY published_at DESC
     LIMIT 500`,
  ).bind(cutoff).all<Pick<EventRow, 'event_id' | 'cluster_id' | 'title' | 'tickers_json' | 'event_types_json' | 'published_at'>>();
  return result.results.map((row) => ({
    eventId: row.event_id,
    clusterId: row.cluster_id,
    title: row.title,
    tickers: parseList<string>(row.tickers_json),
    eventTypes: parseList<EventType>(row.event_types_json),
    publishedAt: row.published_at,
  }));
}

export async function persistEvents(events: NormalizedEvent[]) {
  if (!events.length) return;
  const db = database();
  const statements: D1PreparedStatement[] = [];

  for (const event of events) {
    if (!event.clusterId) continue;
    statements.push(
      db.prepare(
        `INSERT INTO story_clusters (
          cluster_id, canonical_event_id, title, first_seen_at, last_seen_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(cluster_id) DO UPDATE SET
          last_seen_at = CASE
            WHEN excluded.last_seen_at > story_clusters.last_seen_at THEN excluded.last_seen_at
            ELSE story_clusters.last_seen_at
          END,
          updated_at = excluded.updated_at`,
      ).bind(
        event.clusterId,
        event.id,
        event.title,
        event.ingestedAt,
        event.ingestedAt,
        event.ingestedAt,
      ),
      db.prepare(
        `INSERT INTO events (
          event_id, cluster_id, source_id, source_name, publisher_family, source_tier,
          title, url, canonical_url, published_at, updated_at, ingested_at,
          tickers_json, event_types_json, relevance, importance, credibility, freshness, is_sample
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(event_id) DO UPDATE SET
          cluster_id = excluded.cluster_id,
          title = excluded.title,
          url = excluded.url,
          canonical_url = excluded.canonical_url,
          updated_at = excluded.updated_at,
          ingested_at = excluded.ingested_at,
          tickers_json = excluded.tickers_json,
          event_types_json = excluded.event_types_json,
          relevance = excluded.relevance,
          importance = excluded.importance,
          credibility = excluded.credibility,
          freshness = excluded.freshness`,
      ).bind(
        event.id,
        event.clusterId,
        event.sourceId,
        event.sourceName,
        event.publisherFamily,
        event.sourceTier,
        event.title,
        event.url,
        event.canonicalUrl,
        event.publishedAt,
        event.updatedAt,
        event.ingestedAt,
        JSON.stringify(event.tickers),
        JSON.stringify(event.eventTypes),
        event.relevance,
        event.importance,
        event.credibility,
        event.freshness,
        event.isSample ? 1 : 0,
      ),
      db.prepare(
        `INSERT INTO cluster_members (cluster_id, event_id, similarity, added_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(cluster_id, event_id) DO NOTHING`,
      ).bind(event.clusterId, event.id, null, event.ingestedAt),
    );
  }

  await runBatches(statements);
}

export async function listRecentEvents(days = 7) {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  const result = await database().prepare(
    `SELECT e.*, c.first_seen_at, c.last_seen_at
     FROM events e
     LEFT JOIN story_clusters c ON c.cluster_id = e.cluster_id
     WHERE e.published_at >= ? OR e.ingested_at >= ?
     ORDER BY e.published_at DESC
     LIMIT 600`,
  ).bind(cutoff, cutoff).all<EventRow>();
  return result.results;
}

export async function listUserStates(): Promise<Map<string, UserStateRecord>> {
  const result = await database().prepare(
    'SELECT cluster_id, read_state, saved FROM user_state WHERE user_id = ?',
  ).bind(DEFAULT_USER_ID).all<{ cluster_id: string; read_state: InboxState; saved: number }>();
  return new Map(result.results.map((row) => [row.cluster_id, {
    clusterId: row.cluster_id,
    readState: row.read_state,
    saved: row.saved === 1,
  }]));
}

export async function mutateUserState(clusterId: string, action: string) {
  const allowed = new Set(['read', 'unread', 'save', 'unsave', 'dismiss', 'restore']);
  if (!allowed.has(action)) throw new Error('Unsupported state action');
  const now = new Date().toISOString();
  const existing = await database().prepare(
    'SELECT read_state, saved, first_seen_at FROM user_state WHERE user_id = ? AND cluster_id = ?',
  ).bind(DEFAULT_USER_ID, clusterId).first<{ read_state: InboxState; saved: number; first_seen_at: string }>();

  let readState: InboxState = existing?.read_state ?? 'new';
  let saved = existing?.saved === 1;
  if (action === 'read') readState = 'read';
  if (action === 'unread') readState = 'unread';
  if (action === 'dismiss') readState = 'dismissed';
  if (action === 'restore') readState = 'unread';
  if (action === 'save') saved = true;
  if (action === 'unsave') saved = false;

  await database().prepare(
    `INSERT INTO user_state (
      user_id, cluster_id, read_state, saved, first_seen_at, opened_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, cluster_id) DO UPDATE SET
      read_state = excluded.read_state,
      saved = excluded.saved,
      opened_at = COALESCE(excluded.opened_at, user_state.opened_at),
      updated_at = excluded.updated_at`,
  ).bind(
    DEFAULT_USER_ID,
    clusterId,
    readState,
    saved ? 1 : 0,
    existing?.first_seen_at ?? now,
    action === 'read' ? now : null,
    now,
  ).run();

  return { clusterId, readState, saved };
}

export function sourceHealth(records: SourceRecord[]): SourceHealth[] {
  const now = Date.now();
  return records.map((source) => {
    const inBackoff = Boolean(source.retryAfterAt && Date.parse(source.retryAfterAt) > now);
    const stale = !source.lastSuccessAt || now - Date.parse(source.lastSuccessAt) > source.pollMinutes * 3 * 60_000;
    let status: SourceHealth['status'] = 'pending';
    if (inBackoff) status = 'backoff';
    else if (source.lastStatus === 'error') status = source.lastSuccessAt ? 'stale' : 'error';
    else if (source.lastStatus === 'empty') status = 'empty';
    else if (stale && source.lastAttemptAt) status = 'stale';
    else if (source.lastSuccessAt) status = 'healthy';

    const detail = inBackoff
      ? `Backoff until ${source.retryAfterAt}`
      : source.lastError
        ? source.lastError
        : source.lastSuccessAt
          ? `Last success ${source.lastSuccessAt}`
          : 'Awaiting first ingestion';

    return {
      id: source.id,
      name: source.name,
      provider: source.provider,
      status,
      lastAttemptAt: source.lastAttemptAt,
      lastSuccessAt: source.lastSuccessAt,
      itemCount: source.lastItemCount,
      latencyMs: source.lastLatencyMs,
      consecutiveFailures: source.consecutiveFailures,
      detail,
    };
  });
}
