import type { SourceConfig } from './types';

export const WATCHLIST = [
  { ticker: 'AAPL', company: 'Apple', aliases: ['apple', 'apple inc', 'iphone', 'tim cook'], cik: '0000320193' },
  { ticker: 'MSFT', company: 'Microsoft', aliases: ['microsoft', 'microsoft corp', 'azure', 'satya nadella'], cik: '0000789019' },
  { ticker: 'NVDA', company: 'Nvidia', aliases: ['nvidia', 'nvidia corp', 'jensen huang', 'blackwell'], cik: '0001045810' },
  { ticker: 'AMD', company: 'AMD', aliases: ['advanced micro devices', 'amd', 'lisa su'], cik: '0000002488' },
  { ticker: 'GOOGL', company: 'Alphabet', aliases: ['alphabet', 'google', 'gemini', 'sundar pichai'], cik: '0001652044' },
  { ticker: 'META', company: 'Meta', aliases: ['meta platforms', 'facebook', 'instagram', 'mark zuckerberg'], cik: '0001326801' },
  { ticker: 'AMZN', company: 'Amazon', aliases: ['amazon', 'amazon.com', 'aws', 'andy jassy'], cik: '0001018724' },
  { ticker: 'TSLA', company: 'Tesla', aliases: ['tesla', 'elon musk'], cik: '0001318605' },
  { ticker: 'AVGO', company: 'Broadcom', aliases: ['broadcom', 'vmware'], cik: '0001730168' },
  { ticker: 'CRM', company: 'Salesforce', aliases: ['salesforce', 'marc benioff'], cik: '0001108524' },
  { ticker: 'ORCL', company: 'Oracle', aliases: ['oracle', 'larry ellison'], cik: '0001341439' },
] as const;

export const SOURCE_REGISTRY: SourceConfig[] = [
  {
    id: 'google-tech-megacap',
    name: 'US technology leaders',
    provider: 'rss',
    url: 'https://news.google.com/rss/search',
    query: '(Apple OR Microsoft OR Nvidia OR AMD) (stock OR earnings OR guidance) when:2d',
    language: 'en-US',
    sourceTier: 3,
    publisherFamily: 'Google News discovery',
    pollMinutes: 10,
    rightsNote: 'Store headline metadata and outbound links only; underlying publisher terms apply.',
    enabled: true,
  },
  {
    id: 'google-platforms',
    name: 'Platforms and internet',
    provider: 'rss',
    url: 'https://news.google.com/rss/search',
    query: '(Alphabet OR Google OR Meta OR Amazon OR Tesla) (stock OR earnings OR regulation) when:2d',
    language: 'en-US',
    sourceTier: 3,
    publisherFamily: 'Google News discovery',
    pollMinutes: 10,
    rightsNote: 'Store headline metadata and outbound links only; underlying publisher terms apply.',
    enabled: true,
  },
  {
    id: 'google-enterprise-tech',
    name: 'Enterprise technology',
    provider: 'rss',
    url: 'https://news.google.com/rss/search',
    query: '(Broadcom OR Salesforce OR Oracle) (stock OR earnings OR acquisition) when:2d',
    language: 'en-US',
    sourceTier: 3,
    publisherFamily: 'Google News discovery',
    pollMinutes: 10,
    rightsNote: 'Store headline metadata and outbound links only; underlying publisher terms apply.',
    enabled: true,
  },
  {
    id: 'google-macro-tech',
    name: 'Macro and technology',
    provider: 'rss',
    url: 'https://news.google.com/rss/search',
    query: '(Federal Reserve OR inflation OR yields OR Nasdaq) technology stocks when:2d',
    language: 'en-US',
    sourceTier: 3,
    publisherFamily: 'Google News discovery',
    pollMinutes: 10,
    rightsNote: 'Store headline metadata and outbound links only; underlying publisher terms apply.',
    enabled: true,
  },
  {
    id: 'sec-current-8k',
    name: 'SEC current 8-K filings',
    provider: 'sec-atom',
    url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&company=&dateb=&owner=include&start=0&count=100&output=atom',
    language: 'en-US',
    sourceTier: 1,
    publisherFamily: 'SEC EDGAR',
    pollMinutes: 15,
    rightsNote: 'Official filing metadata and links; automated access follows SEC fair-access guidance.',
    enabled: true,
  },
];

const TIER_ONE = [
  ['reuters', 'Reuters'],
  ['bloomberg', 'Bloomberg'],
  ['associated press', 'Associated Press'],
  ['financial times', 'Financial Times'],
  ['wall street journal', 'The Wall Street Journal'],
  ['cnbc', 'CNBC'],
  ['sec', 'SEC EDGAR'],
] as const;

const TIER_TWO = [
  ['marketwatch', 'MarketWatch'],
  ["barron's", "Barron's"],
  ['fortune', 'Fortune'],
  ['business insider', 'Business Insider'],
  ['techcrunch', 'TechCrunch'],
  ['the verge', 'The Verge'],
  ['yahoo finance', 'Yahoo Finance'],
  ['investopedia', 'Investopedia'],
  ['seeking alpha', 'Seeking Alpha'],
] as const;

export function publisherIdentity(sourceName: string) {
  const normalized = sourceName.toLowerCase().replace(/\s+/g, ' ').trim();
  const firstTier = TIER_ONE.find(([alias]) => normalized.includes(alias));
  if (firstTier) return { family: firstTier[1], tier: 1 };
  const secondTier = TIER_TWO.find(([alias]) => normalized.includes(alias));
  if (secondTier) return { family: secondTier[1], tier: 2 };
  return { family: sourceName.trim() || 'Unknown publisher', tier: 3 };
}
