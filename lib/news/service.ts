import { assignStoryClusters } from './clustering';
import { fetchProvider, ProviderError } from './providers';
import { aggregatePriority, freshnessScore, normalizeFeedItem, readableReasons } from './scoring';
import {
  initializeStore,
  listRecentCandidates,
  listRecentEvents,
  listSourceRecords,
  listUserStates,
  persistEvents,
  recordIngestion,
  sourceHealth,
  sourceIsDue,
  type EventRow,
} from './store';
import { clampScore } from './text';
import type {
  EventType,
  NewsResponse,
  NormalizedEvent,
  SourceRecord,
  Story,
  UserStateRecord,
  WireItem,
} from './types';

type IngestionSummary = {
  attempted: number;
  successful: number;
  failed: number;
};

function parseList<T extends string>(value: string) {
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

function rowToEvent(row: EventRow): NormalizedEvent & { firstSeenAt: string; lastSeenAt: string } {
  return {
    id: row.event_id,
    clusterId: row.cluster_id,
    sourceId: row.source_id,
    sourceName: row.source_name,
    publisherFamily: row.publisher_family,
    sourceTier: row.source_tier,
    title: row.title,
    url: row.url,
    canonicalUrl: row.canonical_url,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    ingestedAt: row.ingested_at,
    tickers: parseList<string>(row.tickers_json),
    eventTypes: parseList<EventType>(row.event_types_json),
    relevance: row.relevance,
    importance: row.importance,
    credibility: row.credibility,
    freshness: freshnessScore(row.published_at),
    isSample: row.is_sample === 1,
    firstSeenAt: row.first_seen_at ?? row.ingested_at,
    lastSeenAt: row.last_seen_at ?? row.ingested_at,
  };
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function buildReadModel(
  events: Array<NormalizedEvent & { firstSeenAt?: string; lastSeenAt?: string }>,
  states: Map<string, UserStateRecord>,
) {
  const grouped = new Map<string, typeof events>();
  for (const event of events) {
    if (!event.clusterId) continue;
    const members = grouped.get(event.clusterId) ?? [];
    members.push(event);
    grouped.set(event.clusterId, members);
  }

  const stories: Story[] = [...grouped.entries()].map(([clusterId, members]) => {
    const ordered = [...members].sort(
      (left, right) => left.sourceTier - right.sourceTier || Date.parse(right.publishedAt) - Date.parse(left.publishedAt),
    );
    const canonical = ordered[0];
    const tickers = unique(members.flatMap((event) => event.tickers));
    const eventTypes = unique(members.flatMap((event) => event.eventTypes));
    const publisherFamilies = unique(members.map((event) => event.publisherFamily));
    const relevance = Math.max(...members.map((event) => event.relevance));
    const importance = Math.max(...members.map((event) => event.importance));
    const freshness = Math.max(...members.map((event) => freshnessScore(event.publishedAt)));
    const credibility = clampScore(
      Math.max(...members.map((event) => event.credibility)) + Math.min(12, (publisherFamilies.length - 1) * 4),
    );
    const priority = aggregatePriority({ relevance, importance, credibility, freshness });
    const publishedAt = members.map((event) => event.publishedAt).sort().at(-1) ?? canonical.publishedAt;
    const firstSeenAt = members.map((event) => event.firstSeenAt ?? event.ingestedAt).sort()[0];
    const lastSeenAt = members.map((event) => event.lastSeenAt ?? event.ingestedAt).sort().at(-1) ?? canonical.ingestedAt;
    const state = states.get(clusterId);
    const evidence = ordered
      .filter((event, index, all) => all.findIndex((candidate) => candidate.id === event.id) === index)
      .slice(0, 8)
      .map((event) => ({
        eventId: event.id,
        title: event.title,
        url: event.url,
        source: event.sourceName,
        publisherFamily: event.publisherFamily,
        sourceTier: event.sourceTier,
        publishedAt: event.publishedAt,
      }));

    return {
      id: clusterId,
      title: canonical.title,
      url: canonical.url,
      publishedAt,
      updatedAt: members.map((event) => event.updatedAt).sort().at(-1) ?? publishedAt,
      firstSeenAt,
      lastSeenAt,
      tickers,
      eventTypes,
      relevance,
      importance,
      credibility,
      freshness,
      priority,
      trendScore: clampScore(priority * 0.65 + publisherFamilies.length * 10 + Math.min(3, members.length) * 3),
      reasons: readableReasons({ tickers, eventTypes, sourceCount: publisherFamilies.length, publishedAt }),
      sourceCount: publisherFamilies.length,
      eventCount: members.length,
      evidence,
      state: state?.readState ?? 'new',
      saved: state?.saved ?? false,
      isSample: members.every((event) => event.isSample),
    };
  });

  stories.sort((left, right) => right.priority - left.priority || Date.parse(right.publishedAt) - Date.parse(left.publishedAt));

  const wireItems: WireItem[] = events
    .filter((event) => event.clusterId)
    .map((event) => {
      const state = states.get(event.clusterId!);
      return {
        eventId: event.id,
        clusterId: event.clusterId!,
        title: event.title,
        url: event.url,
        source: event.sourceName,
        publisherFamily: event.publisherFamily,
        sourceTier: event.sourceTier,
        publishedAt: event.publishedAt,
        tickers: event.tickers,
        eventTypes: event.eventTypes,
        relevance: event.relevance,
        importance: event.importance,
        credibility: event.credibility,
        freshness: freshnessScore(event.publishedAt),
        priority: aggregatePriority({
          relevance: event.relevance,
          importance: event.importance,
          credibility: event.credibility,
          freshness: freshnessScore(event.publishedAt),
        }),
        state: state?.readState ?? 'new',
        saved: state?.saved ?? false,
        isSample: Boolean(event.isSample),
      };
    })
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));

  return { stories, wireItems };
}

function sampleEvents(): Array<NormalizedEvent & { firstSeenAt: string; lastSeenAt: string }> {
  const now = Date.now();
  const input = [
    {
      id: 'sample-nvda-a', clusterId: 'sample-story-nvda-guidance', minutes: 18,
      title: 'Demo scenario: Nvidia raises its data-center revenue outlook', sourceName: 'Sample Wire Alpha',
      family: 'Sample Wire Alpha', tickers: ['NVDA'], types: ['Guidance', 'Earnings'] as EventType[], relevance: 92, importance: 92, credibility: 82,
    },
    {
      id: 'sample-nvda-b', clusterId: 'sample-story-nvda-guidance', minutes: 24,
      title: 'Demo scenario: stronger data-center demand lifts Nvidia guidance', sourceName: 'Sample Wire Beta',
      family: 'Sample Wire Beta', tickers: ['NVDA'], types: ['Guidance'] as EventType[], relevance: 92, importance: 92, credibility: 76,
    },
    {
      id: 'sample-msft-a', clusterId: 'sample-story-msft-product', minutes: 47,
      title: 'Demo scenario: Microsoft introduces a governed enterprise AI platform', sourceName: 'Sample Technology Desk',
      family: 'Sample Technology Desk', tickers: ['MSFT'], types: ['Product'] as EventType[], relevance: 82, importance: 66, credibility: 74,
    },
    {
      id: 'sample-sec-aapl', clusterId: 'sample-story-aapl-filing', minutes: 92,
      title: 'Demo scenario: Apple files an 8-K investor update', sourceName: 'SEC EDGAR sample',
      family: 'SEC EDGAR sample', tickers: ['AAPL'], types: ['Filing'] as EventType[], relevance: 82, importance: 75, credibility: 90,
    },
    {
      id: 'sample-macro-a', clusterId: 'sample-story-macro-rates', minutes: 135,
      title: 'Demo scenario: Treasury yields rise after central-bank commentary', sourceName: 'Sample Macro Desk',
      family: 'Sample Macro Desk', tickers: [], types: ['Macro'] as EventType[], relevance: 58, importance: 82, credibility: 78,
    },
    {
      id: 'sample-googl-a', clusterId: 'sample-story-googl-regulation', minutes: 188,
      title: 'Demo scenario: regulator opens a review affecting Alphabet advertising', sourceName: 'Sample Policy Desk',
      family: 'Sample Policy Desk', tickers: ['GOOGL'], types: ['Regulation'] as EventType[], relevance: 82, importance: 84, credibility: 78,
    },
  ];

  return input.map((item) => {
    const publishedAt = new Date(now - item.minutes * 60_000).toISOString();
    const ingestedAt = new Date(now - (item.minutes - 2) * 60_000).toISOString();
    return {
      id: item.id,
      clusterId: item.clusterId,
      title: item.title,
      url: '',
      canonicalUrl: '',
      sourceId: 'sample-source',
      sourceName: item.sourceName,
      publisherFamily: item.family,
      sourceTier: 2,
      publishedAt,
      updatedAt: publishedAt,
      ingestedAt,
      tickers: item.tickers,
      eventTypes: item.types,
      relevance: item.relevance,
      importance: item.importance,
      credibility: item.credibility,
      freshness: freshnessScore(publishedAt),
      isSample: true,
      firstSeenAt: ingestedAt,
      lastSeenAt: ingestedAt,
    };
  });
}

async function ingestSources(sources: SourceRecord[], force: boolean): Promise<IngestionSummary> {
  const due = sources.filter((source) => sourceIsDue(source, force));
  if (!due.length) return { attempted: 0, successful: 0, failed: 0 };

  let successful = 0;
  let failed = 0;
  const collected: NormalizedEvent[] = [];

  await Promise.all(due.map(async (source) => {
    const started = Date.now();
    const startedAt = new Date(started).toISOString();
    try {
      const result = await fetchProvider(source, { etag: source.etag, lastModified: source.lastModified });
      const completedAt = new Date().toISOString();
      const inScopeItems = source.provider === 'sec-atom'
        ? result.items.filter((item) => /apple|microsoft|nvidia|advanced micro devices|alphabet|google|meta platforms|amazon|tesla|broadcom|salesforce|oracle/i.test(item.title))
        : result.items;
      collected.push(...inScopeItems.slice(0, 80).map((item) => normalizeFeedItem(item, source, completedAt)));
      await recordIngestion({
        source,
        startedAt,
        completedAt,
        latencyMs: Date.now() - started,
        status: result.status,
        itemCount: inScopeItems.length,
        etag: result.etag,
        lastModified: result.lastModified,
      });
      successful += 1;
    } catch (error) {
      const completedAt = new Date().toISOString();
      const providerError = error instanceof ProviderError ? error : null;
      await recordIngestion({
        source,
        startedAt,
        completedAt,
        latencyMs: Date.now() - started,
        status: 'error',
        itemCount: 0,
        errorClass: providerError?.code ?? 'unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown provider failure',
        retryAfterAt: providerError?.retryAfterAt ?? null,
      });
      failed += 1;
    }
  }));

  const uniqueEvents = [...new Map(collected.map((event) => [event.id, event])).values()];
  if (uniqueEvents.length) {
    const candidates = await listRecentCandidates();
    const clustered = assignStoryClusters(uniqueEvents, candidates);
    await persistEvents(clustered);
  }

  return { attempted: due.length, successful, failed };
}

export async function buildNewsResponse(force = false): Promise<NewsResponse> {
  await initializeStore();
  const before = await listSourceRecords();
  const ingestion = await ingestSources(before, force);
  const [rows, states, after] = await Promise.all([
    listRecentEvents(),
    listUserStates(),
    listSourceRecords(),
  ]);
  const liveEvents = rows.map(rowToEvent);
  const usingSample = liveEvents.length === 0;
  const events = usingSample ? sampleEvents() : liveEvents;
  const readModel = buildReadModel(events, states);
  const health = sourceHealth(after);
  const rawEventCount = readModel.wireItems.length;
  const storyCount = readModel.stories.length;
  const compressionRate = rawEventCount
    ? Math.max(0, Math.round((1 - storyCount / rawEventCount) * 100))
    : 0;
  const mode: NewsResponse['mode'] = usingSample
    ? 'sample'
    : ingestion.failed > 0
      ? 'partial'
      : ingestion.attempted > 0
        ? 'live'
        : 'cached';

  return {
    ...readModel,
    sources: health,
    fetchedAt: new Date().toISOString(),
    mode,
    warning: usingSample
      ? 'No persisted live records are available. Explicit demonstration scenarios are shown.'
      : ingestion.failed > 0
        ? `${ingestion.failed} source${ingestion.failed === 1 ? '' : 's'} failed; persisted last-good stories remain visible.`
        : undefined,
    metrics: {
      storyCount,
      rawEventCount,
      compressionRate,
      healthySourceCount: health.filter((source) => source.status === 'healthy').length,
      totalSourceCount: health.length,
      watchlistStoryCount: readModel.stories.filter((story) => story.tickers.length > 0).length,
    },
  };
}
