import { WATCHLIST } from './config';
import type { EventType } from './types';

const TRACKING_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'mc_cid',
  'mc_eid',
]);

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'in', 'is',
  'it', 'its', 'of', 'on', 'or', 'says', 'the', 'to', 'with', 'after', 'amid', 'over',
]);

export function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

export function tagValue(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}

export function attributeValue(block: string, tag: string, attribute: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*\\s${attribute}=["']([^"']+)["'][^>]*>`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}

export function stableHash(value: string, prefix = 'id') {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(36)}`;
}

export function canonicalizeUrl(value: string) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_KEYS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        url.searchParams.delete(key);
      }
    }
    url.hash = '';
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return value.trim();
  }
}

export function stripPublisherSuffix(title: string, publisher: string) {
  const suffix = publisher.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return suffix
    ? title.replace(new RegExp(`\\s[-–—|]\\s${suffix}$`, 'i'), '').trim()
    : title.trim();
}

export function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(live|update|updates|breaking|exclusive|analysis)\b:?/g, ' ')
    .replace(/[^a-z0-9%$]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function titleFeatures(value: string) {
  const tokens = normalizeTitle(value)
    .split(' ')
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
  const tokenSet = new Set(tokens);
  const bigrams = new Set(tokens.slice(1).map((token, index) => `${tokens[index]} ${token}`));
  return { tokens: tokenSet, bigrams };
}

function containsAlias(text: string, alias: string) {
  const escaped = alias.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
}

export function tickersFor(value: string) {
  const text = value.toLowerCase();
  return WATCHLIST
    .filter(({ ticker, aliases, cik }) =>
      aliases.some((alias) => containsAlias(text, alias)) ||
      containsAlias(text, ticker.toLowerCase()) ||
      text.includes(cik),
    )
    .map(({ ticker }) => ticker);
}

export function eventTypesFor(value: string, provider?: string): EventType[] {
  const text = value.toLowerCase();
  const types: EventType[] = [];
  if (/(earnings|revenue|profit|quarterly results|eps|income)/.test(text)) types.push('Earnings');
  if (/(guidance|forecast|outlook|raises? estimate|cuts? estimate)/.test(text)) types.push('Guidance');
  if (/(acqui|merger|takeover|buyout|deal to buy)/.test(text)) types.push('M&A');
  if (/(antitrust|regulat|ftc|doj|eu commission|compliance|ban|tariff)/.test(text)) types.push('Regulation');
  if (/(lawsuit|court|judge|probe|investigation|settlement|appeal)/.test(text)) types.push('Legal');
  if (/(launch|unveil|release|chip|product|model|cloud|artificial intelligence|\bai\b)/.test(text)) types.push('Product');
  if (/(federal reserve|\bfed\b|inflation|interest rate|bond|yield|jobs report|gdp|cpi|payroll)/.test(text)) types.push('Macro');
  if (provider === 'sec-atom' || /(\b8-k\b|\b10-k\b|\b10-q\b|filing|form 4)/.test(text)) types.push('Filing');
  return types.length ? [...new Set(types)] : ['Market'];
}

export function numericTokens(value: string) {
  return new Set(normalizeTitle(value).split(' ').filter((token) => /\d/.test(token)));
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
