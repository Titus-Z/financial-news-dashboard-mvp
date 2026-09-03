import { numericTokens, normalizeTitle, stableHash, titleFeatures } from './text';
import type { ClusterCandidate, NormalizedEvent } from './types';

function overlapScore(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const value of left) if (right.has(value)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}

function sharesValue(left: string[], right: string[]) {
  return left.some((value) => right.includes(value));
}

export function storySimilarity(
  left: Pick<NormalizedEvent, 'title' | 'tickers' | 'eventTypes'>,
  right: Pick<ClusterCandidate, 'title' | 'tickers' | 'eventTypes'>,
) {
  const leftNormalized = normalizeTitle(left.title);
  const rightNormalized = normalizeTitle(right.title);
  if (leftNormalized === rightNormalized) return 1;

  const leftFeatures = titleFeatures(left.title);
  const rightFeatures = titleFeatures(right.title);
  const tokenSimilarity = overlapScore(leftFeatures.tokens, rightFeatures.tokens);
  const bigramSimilarity = overlapScore(leftFeatures.bigrams, rightFeatures.bigrams);
  let score = tokenSimilarity * 0.72 + bigramSimilarity * 0.28;

  const leftHasTickers = left.tickers.length > 0;
  const rightHasTickers = right.tickers.length > 0;
  if (sharesValue(left.tickers, right.tickers)) score += 0.13;
  else if (leftHasTickers && rightHasTickers) score -= 0.18;
  if (sharesValue(left.eventTypes, right.eventTypes)) score += 0.05;

  const leftNumbers = numericTokens(left.title);
  const rightNumbers = numericTokens(right.title);
  if (leftNumbers.size && rightNumbers.size && overlapScore(leftNumbers, rightNumbers) === 0) {
    score -= 0.12;
  }

  return Math.max(0, Math.min(1, score));
}

export function assignStoryClusters(
  events: NormalizedEvent[],
  existing: ClusterCandidate[],
) {
  const candidates = [...existing];
  const assigned: NormalizedEvent[] = [];

  for (const event of events) {
    const knownEvent = candidates.find((candidate) => candidate.eventId === event.id);
    if (knownEvent) {
      event.clusterId = knownEvent.clusterId;
    } else {
      let best: { candidate: ClusterCandidate; score: number } | null = null;
      for (const candidate of candidates) {
        const score = storySimilarity(event, candidate);
        if (!best || score > best.score) best = { candidate, score };
      }
      event.clusterId = best && best.score >= 0.58
        ? best.candidate.clusterId
        : stableHash(normalizeTitle(event.title), 'story');
    }

    candidates.push({
      eventId: event.id,
      clusterId: event.clusterId,
      title: event.title,
      tickers: event.tickers,
      eventTypes: event.eventTypes,
      publishedAt: event.publishedAt,
    });
    assigned.push(event);
  }

  return assigned;
}
