import { publisherIdentity } from './config';
import { canonicalizeUrl, clampScore, eventTypesFor, stableHash, tickersFor } from './text';
import type { NormalizedEvent, RawFeedItem, SourceConfig } from './types';

const EVENT_IMPORTANCE: Record<string, number> = {
  Guidance: 92,
  Earnings: 88,
  'M&A': 90,
  Regulation: 84,
  Legal: 78,
  Filing: 75,
  Macro: 82,
  Product: 66,
  Market: 48,
};

export function freshnessScore(publishedAt: string, now = Date.now()) {
  const ageHours = Math.max(0, (now - Date.parse(publishedAt)) / 3_600_000);
  if (ageHours <= 1) return 100;
  if (ageHours <= 6) return clampScore(100 - ageHours * 4);
  if (ageHours <= 24) return clampScore(80 - (ageHours - 6) * 2);
  return clampScore(44 - (ageHours - 24) * 0.7);
}

export function normalizeFeedItem(
  item: RawFeedItem,
  source: SourceConfig,
  ingestedAt: string,
): NormalizedEvent {
  const canonicalUrl = canonicalizeUrl(item.url);
  const tickers = tickersFor(`${item.title} ${item.sourceName}`);
  const eventTypes = eventTypesFor(item.title, source.provider);
  const publisher = source.provider === 'sec-atom'
    ? { family: 'SEC EDGAR', tier: 1 }
    : publisherIdentity(item.sourceName);
  const relevance = clampScore(
    tickers.length > 0
      ? 74 + Math.min(18, (tickers.length - 1) * 7)
      : eventTypes.includes('Macro')
        ? 58
        : 32,
  );
  const importance = Math.max(...eventTypes.map((type) => EVENT_IMPORTANCE[type] ?? 48));
  const credibility = publisher.tier === 1 ? 90 : publisher.tier === 2 ? 76 : 62;
  const freshness = freshnessScore(item.publishedAt, Date.parse(ingestedAt));
  const identity = canonicalUrl || `${item.title}|${publisher.family}|${item.publishedAt}`;

  return {
    id: stableHash(identity, 'event'),
    title: item.title,
    url: item.url,
    canonicalUrl,
    sourceId: source.id,
    sourceName: item.sourceName,
    publisherFamily: publisher.family,
    sourceTier: publisher.tier,
    publishedAt: item.publishedAt,
    updatedAt: item.updatedAt ?? item.publishedAt,
    ingestedAt,
    tickers,
    eventTypes,
    relevance,
    importance,
    credibility,
    freshness,
  };
}

export function aggregatePriority(input: {
  relevance: number;
  importance: number;
  credibility: number;
  freshness: number;
}) {
  return clampScore(
    input.relevance * 0.34 +
    input.importance * 0.3 +
    input.credibility * 0.2 +
    input.freshness * 0.16,
  );
}

export function readableReasons(input: {
  tickers: string[];
  eventTypes: string[];
  sourceCount: number;
  publishedAt: string;
}) {
  const reasons: string[] = [];
  if (input.tickers.length) reasons.push(`${input.tickers.join(', ')} matches the watchlist`);
  if (input.eventTypes[0] && input.eventTypes[0] !== 'Market') {
    reasons.push(`${input.eventTypes[0]} is a material event type`);
  }
  if (input.sourceCount > 1) reasons.push(`${input.sourceCount} independent publisher families corroborate it`);
  const ageHours = Math.max(0, (Date.now() - Date.parse(input.publishedAt)) / 3_600_000);
  reasons.push(ageHours < 1 ? 'Published within the last hour' : `Published ${Math.round(ageHours)} hours ago`);
  return reasons.slice(0, 3);
}
