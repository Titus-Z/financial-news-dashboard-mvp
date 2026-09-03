import { stripPublisherSuffix, tagValue, attributeValue } from './text';
import type { ProviderResult, RawFeedItem, SourceConfig } from './types';

const SEC_USER_AGENT = 'SignalDesk/0.2 github.com/Titus-Z/financial-news-dashboard-mvp';

export class ProviderError extends Error {
  code: string;
  retryAfterAt: string | null;

  constructor(message: string, code: string, retryAfterAt: string | null = null) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.retryAfterAt = retryAfterAt;
  }
}

function parseDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseRetryAfter(value: string | null) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return new Date(Date.now() + seconds * 1_000).toISOString();
  return parseDate(value);
}

function parseRss(xml: string, fallbackSource: string): RawFeedItem[] {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return blocks.flatMap((block) => {
    const sourceName = tagValue(block, 'source') || fallbackSource;
    const rawTitle = tagValue(block, 'title');
    const title = stripPublisherSuffix(rawTitle, sourceName);
    const url = tagValue(block, 'link');
    const publishedAt = parseDate(tagValue(block, 'pubDate') || tagValue(block, 'published'));
    if (!title || !url || !publishedAt) return [];
    return [{ title, url, sourceName, publishedAt }];
  });
}

function parseSecAtom(xml: string): RawFeedItem[] {
  const blocks = xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? [];
  return blocks.flatMap((block) => {
    const title = tagValue(block, 'title').replace(/\s+/g, ' ').trim();
    const url = attributeValue(block, 'link', 'href');
    const updatedAt = parseDate(tagValue(block, 'updated'));
    if (!title || !url || !updatedAt) return [];
    return [{ title, url, sourceName: 'SEC EDGAR', publishedAt: updatedAt, updatedAt }];
  });
}

async function requestSource(
  source: SourceConfig,
  conditional: { etag: string | null; lastModified: string | null },
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  const headers = new Headers({
    Accept: 'application/atom+xml, application/rss+xml, application/xml, text/xml',
  });
  if (conditional.etag) headers.set('If-None-Match', conditional.etag);
  if (conditional.lastModified) headers.set('If-Modified-Since', conditional.lastModified);
  if (source.provider === 'sec-atom') headers.set('User-Agent', SEC_USER_AGENT);

  const url = new URL(source.url);
  if (source.query) {
    url.searchParams.set('q', source.query);
    url.searchParams.set('hl', 'en-US');
    url.searchParams.set('gl', 'US');
    url.searchParams.set('ceid', 'US:en');
  }

  try {
    return await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Request timed out after 8 seconds'
      : error instanceof Error
        ? error.message
        : 'Unknown network failure';
    throw new ProviderError(message, error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchProvider(
  source: SourceConfig,
  conditional: { etag: string | null; lastModified: string | null },
): Promise<ProviderResult> {
  const response = await requestSource(source, conditional);
  const etag = response.headers.get('etag');
  const lastModified = response.headers.get('last-modified');

  if (response.status === 304) {
    return { status: 'not_modified', items: [], etag, lastModified };
  }
  if (!response.ok) {
    const retryAfterAt = parseRetryAfter(response.headers.get('retry-after'));
    throw new ProviderError(
      `${source.name} returned HTTP ${response.status}`,
      response.status === 429 ? 'rate_limit' : `http_${response.status}`,
      retryAfterAt,
    );
  }

  const xml = await response.text();
  const items = source.provider === 'sec-atom' ? parseSecAtom(xml) : parseRss(xml, source.name);
  return {
    status: items.length ? 'success' : 'empty',
    items,
    etag,
    lastModified,
  };
}
