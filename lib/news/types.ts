export type ProviderKind = 'rss' | 'sec-atom';

export type EventType =
  | 'Earnings'
  | 'Guidance'
  | 'M&A'
  | 'Regulation'
  | 'Legal'
  | 'Product'
  | 'Macro'
  | 'Filing'
  | 'Market';

export type InboxState = 'new' | 'unread' | 'read' | 'dismissed';

export type SourceConfig = {
  id: string;
  name: string;
  provider: ProviderKind;
  url: string;
  query?: string;
  language: string;
  sourceTier: number;
  publisherFamily: string;
  pollMinutes: number;
  rightsNote: string;
  enabled: boolean;
};

export type SourceRecord = SourceConfig & {
  etag: string | null;
  lastModified: string | null;
  retryAfterAt: string | null;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastStatus: string;
  lastError: string | null;
  lastItemCount: number;
  lastLatencyMs: number | null;
  consecutiveFailures: number;
};

export type RawFeedItem = {
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  updatedAt?: string;
};

export type ProviderResult = {
  status: 'success' | 'empty' | 'not_modified';
  items: RawFeedItem[];
  etag: string | null;
  lastModified: string | null;
};

export type NormalizedEvent = {
  id: string;
  title: string;
  url: string;
  canonicalUrl: string;
  sourceId: string;
  sourceName: string;
  publisherFamily: string;
  sourceTier: number;
  publishedAt: string;
  updatedAt: string;
  ingestedAt: string;
  tickers: string[];
  eventTypes: EventType[];
  relevance: number;
  importance: number;
  credibility: number;
  freshness: number;
  clusterId?: string;
  isSample?: boolean;
};

export type ClusterCandidate = {
  eventId: string;
  clusterId: string;
  title: string;
  tickers: string[];
  eventTypes: EventType[];
  publishedAt: string;
};

export type EvidenceItem = {
  eventId: string;
  title: string;
  url: string;
  source: string;
  publisherFamily: string;
  sourceTier: number;
  publishedAt: string;
};

export type Story = {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  updatedAt: string;
  firstSeenAt: string;
  lastSeenAt: string;
  tickers: string[];
  eventTypes: EventType[];
  relevance: number;
  importance: number;
  credibility: number;
  freshness: number;
  priority: number;
  trendScore: number;
  reasons: string[];
  sourceCount: number;
  eventCount: number;
  evidence: EvidenceItem[];
  state: InboxState;
  saved: boolean;
  isSample: boolean;
};

export type WireItem = EvidenceItem & {
  clusterId: string;
  tickers: string[];
  eventTypes: EventType[];
  relevance: number;
  importance: number;
  credibility: number;
  freshness: number;
  priority: number;
  state: InboxState;
  saved: boolean;
  isSample: boolean;
};

export type SourceHealth = {
  id: string;
  name: string;
  provider: ProviderKind;
  status: 'healthy' | 'empty' | 'stale' | 'error' | 'backoff' | 'pending';
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  itemCount: number;
  latencyMs: number | null;
  consecutiveFailures: number;
  detail: string;
};

export type NewsResponse = {
  stories: Story[];
  wireItems: WireItem[];
  sources: SourceHealth[];
  fetchedAt: string;
  mode: 'live' | 'cached' | 'partial' | 'sample';
  warning?: string;
  metrics: {
    storyCount: number;
    rawEventCount: number;
    compressionRate: number;
    healthySourceCount: number;
    totalSourceCount: number;
    watchlistStoryCount: number;
  };
};

export type UserStateRecord = {
  clusterId: string;
  readState: InboxState;
  saved: boolean;
};
