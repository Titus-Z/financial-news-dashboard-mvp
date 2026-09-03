type Category = 'Earnings' | 'Product' | 'Regulation' | 'M&A' | 'Macro' | 'Market';

type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  tickers: string[];
  category: Category;
  priority: number;
  isSample?: boolean;
};

const FEED_QUERIES = [
  '(Apple OR Microsoft OR Nvidia OR AMD) (stock OR earnings) when:2d',
  '(Alphabet OR Google OR Meta OR Amazon OR Tesla) (stock OR earnings) when:2d',
  '(Broadcom OR Salesforce OR Oracle) (stock OR earnings) when:2d',
  '(Federal Reserve OR inflation OR yields OR Nasdaq) technology stocks when:2d',
];

const ENTITY_ALIASES: Record<string, string[]> = {
  AAPL: ['apple', 'iphone', 'tim cook'],
  MSFT: ['microsoft', 'azure', 'satya nadella'],
  NVDA: ['nvidia', 'jensen huang', 'blackwell'],
  AMD: ['amd', 'advanced micro devices', 'lisa su'],
  GOOGL: ['alphabet', 'google', 'gemini'],
  META: ['meta platforms', 'facebook', 'instagram'],
  AMZN: ['amazon', 'aws', 'andy jassy'],
  TSLA: ['tesla', 'elon musk'],
  AVGO: ['broadcom', 'vmware'],
  CRM: ['salesforce', 'marc benioff'],
  ORCL: ['oracle', 'larry ellison'],
};

const HIGH_IMPACT_TERMS = [
  'earnings', 'guidance', 'forecast', 'acquire', 'acquisition', 'merger', 'antitrust',
  'lawsuit', 'investigation', 'ban', 'tariff', 'layoff', 'ceo', 'federal reserve',
];

function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

function tagValue(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}

function stableId(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `story-${(hash >>> 0).toString(36)}`;
}

function containsAlias(text: string, alias: string) {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(text);
}

function tickersFor(title: string) {
  return Object.entries(ENTITY_ALIASES)
    .filter(([, aliases]) => aliases.some((alias) => containsAlias(title, alias)))
    .map(([ticker]) => ticker);
}

function categoryFor(title: string): Category {
  const text = title.toLowerCase();
  if (/(earnings|revenue|profit|quarter|guidance|forecast)/.test(text)) return 'Earnings';
  if (/(acqui|merger|takeover|buyout|deal to buy)/.test(text)) return 'M&A';
  if (/(antitrust|regulat|lawsuit|court|probe|investigation|ban)/.test(text)) return 'Regulation';
  if (/(launch|unveil|release|chip|product|model|cloud|artificial intelligence|\bai\b)/.test(text)) return 'Product';
  if (/(federal reserve|\bfed\b|inflation|interest rate|bond|yield|jobs report|tariff)/.test(text)) return 'Macro';
  return 'Market';
}

function scoreFor(title: string, source: string, publishedAt: string, tickers: string[]) {
  const ageHours = Math.max(0, (Date.now() - Date.parse(publishedAt)) / 3_600_000);
  const recency = Math.max(0, 25 - Math.floor(ageHours / 2));
  const lowerTitle = title.toLowerCase();
  const eventBoost = HIGH_IMPACT_TERMS.some((term) => lowerTitle.includes(term)) ? 20 : 6;
  const exposureBoost = Math.min(12, tickers.length * 6);
  const sourceBoost = /(reuters|bloomberg|associated press|financial times|wall street journal|cnbc)/i.test(source) ? 8 : 3;
  return Math.min(99, 34 + recency + eventBoost + exposureBoost + sourceBoost);
}

function parseFeed(xml: string): NewsItem[] {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return blocks.flatMap((block) => {
    const title = tagValue(block, 'title').replace(/\s+-\s+[^-]+$/, '').trim();
    const url = tagValue(block, 'link');
    const source = tagValue(block, 'source') || 'Google News';
    const rawDate = tagValue(block, 'pubDate');
    const parsedDate = new Date(rawDate);
    if (!title || !url || Number.isNaN(parsedDate.getTime())) return [];
    const publishedAt = parsedDate.toISOString();
    const tickers = tickersFor(title);
    return [{
      id: stableId(`${title}|${source}`),
      title,
      url,
      source,
      publishedAt,
      tickers,
      category: categoryFor(title),
      priority: scoreFor(title, source, publishedAt, tickers),
    }];
  });
}

function sampleItems(): NewsItem[] {
  const now = Date.now();
  const samples = [
    ['Demo: chipmaker publishes quarterly revenue guidance', ['NVDA'], 'Earnings', 88, 24],
    ['Demo: cloud platform announces a new enterprise AI product', ['MSFT'], 'Product', 76, 68],
    ['Demo: regulator opens a review of a proposed technology deal', ['GOOGL'], 'Regulation', 72, 135],
    ['Demo: central-bank commentary moves technology shares', [], 'Macro', 64, 230],
    ['Demo: electric-vehicle maker schedules an investor update', ['TSLA'], 'Market', 57, 310],
  ] as const;
  return samples.map(([title, tickers, category, priority, minutes]) => ({
    id: stableId(title),
    title,
    url: '',
    source: 'Demo feed',
    publishedAt: new Date(now - minutes * 60_000).toISOString(),
    tickers: [...tickers],
    category,
    priority,
    isSample: true,
  }));
}

async function fetchFeed(query: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const url = new URL('https://news.google.com/rss/search');
    url.searchParams.set('q', query);
    url.searchParams.set('hl', 'en-US');
    url.searchParams.set('gl', 'US');
    url.searchParams.set('ceid', 'US:en');
    const response = await fetch(url, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`RSS ${response.status}`);
    return parseFeed(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const settled = await Promise.allSettled(FEED_QUERIES.map(fetchFeed));
  const successfulFeeds = settled.filter(
    (result): result is PromiseFulfilledResult<NewsItem[]> => result.status === 'fulfilled',
  );
  const collected = successfulFeeds.flatMap((result) => result.value);
  const seen = new Set<string>();
  const items = collected
    .filter((item) => {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.priority - a.priority || Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 80);

  const useSamples = items.length === 0;
  return Response.json(
    {
      items: useSamples ? sampleItems() : items,
      fetchedAt: new Date().toISOString(),
      mode: useSamples ? 'sample' : 'live',
      feedCount: successfulFeeds.length,
      warning: useSamples ? 'Live public RSS feeds were unavailable.' : undefined,
    },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=300' } },
  );
}
