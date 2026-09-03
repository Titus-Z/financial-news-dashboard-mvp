CREATE TABLE IF NOT EXISTS sources (
  source_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  url TEXT NOT NULL,
  language TEXT NOT NULL,
  source_tier INTEGER NOT NULL,
  publisher_family TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  poll_minutes INTEGER NOT NULL DEFAULT 10,
  rights_note TEXT NOT NULL,
  etag TEXT,
  last_modified TEXT,
  retry_after_at TEXT,
  last_attempt_at TEXT,
  last_success_at TEXT,
  last_status TEXT NOT NULL DEFAULT 'pending',
  last_error TEXT,
  last_item_count INTEGER NOT NULL DEFAULT 0,
  last_latency_ms INTEGER,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  run_id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  status TEXT NOT NULL,
  item_count INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL,
  error_class TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS story_clusters (
  cluster_id TEXT PRIMARY KEY,
  canonical_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  cluster_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  publisher_family TEXT NOT NULL,
  source_tier INTEGER NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  ingested_at TEXT NOT NULL,
  tickers_json TEXT NOT NULL,
  event_types_json TEXT NOT NULL,
  relevance INTEGER NOT NULL,
  importance INTEGER NOT NULL,
  credibility INTEGER NOT NULL,
  freshness INTEGER NOT NULL,
  is_sample INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cluster_members (
  cluster_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  similarity REAL,
  added_at TEXT NOT NULL,
  PRIMARY KEY (cluster_id, event_id)
);

CREATE TABLE IF NOT EXISTS user_state (
  user_id TEXT NOT NULL,
  cluster_id TEXT NOT NULL,
  read_state TEXT NOT NULL DEFAULT 'new' CHECK (read_state IN ('new', 'unread', 'read', 'dismissed')),
  saved INTEGER NOT NULL DEFAULT 0,
  first_seen_at TEXT NOT NULL,
  opened_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, cluster_id)
);

CREATE INDEX IF NOT EXISTS idx_events_published_at ON events (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_cluster_published ON events (cluster_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_source_ingested ON events (source_id, ingested_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_source_started ON ingestion_runs (source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_state_saved ON user_state (user_id, saved, updated_at DESC);

PRAGMA optimize;
