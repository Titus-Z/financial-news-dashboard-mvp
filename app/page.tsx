'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

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

type NewsResponse = {
  items: NewsItem[];
  fetchedAt: string;
  mode: 'live' | 'sample';
  feedCount: number;
  warning?: string;
};

const WATCHLIST = [
  ['AAPL', 'Apple'],
  ['MSFT', 'Microsoft'],
  ['NVDA', 'Nvidia'],
  ['AMD', 'AMD'],
  ['GOOGL', 'Alphabet'],
  ['META', 'Meta'],
  ['AMZN', 'Amazon'],
  ['TSLA', 'Tesla'],
  ['AVGO', 'Broadcom'],
  ['CRM', 'Salesforce'],
  ['ORCL', 'Oracle'],
] as const;

const CATEGORIES: Array<'All' | Category> = [
  'All',
  'Earnings',
  'Product',
  'Regulation',
  'M&A',
  'Macro',
  'Market',
];

function relativeTime(isoDate: string) {
  const elapsedMinutes = Math.max(
    0,
    Math.round((Date.now() - new Date(isoDate).getTime()) / 60_000),
  );
  if (elapsedMinutes < 60) return `${elapsedMinutes || 1}m ago`;
  const hours = Math.round(elapsedMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function dateTime(isoDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

function priorityLabel(score: number) {
  if (score >= 75) return 'High';
  if (score >= 58) return 'Medium';
  return 'Normal';
}

export default function Home() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [ticker, setTicker] = useState('ALL');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [sort, setSort] = useState<'priority' | 'recent'>('priority');

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/news', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Feed request failed (${response.status})`);
      setData((await response.json()) as NewsResponse);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Feed request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...(data?.items ?? [])]
      .filter((item) => ticker === 'ALL' || item.tickers.includes(ticker))
      .filter((item) => category === 'All' || item.category === category)
      .filter(
        (item) =>
          !search ||
          item.title.toLowerCase().includes(search) ||
          item.source.toLowerCase().includes(search) ||
          item.tickers.some((symbol) => symbol.toLowerCase().includes(search)),
      )
      .sort((a, b) =>
        sort === 'priority'
          ? b.priority - a.priority || Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
          : Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
      );
  }, [category, data, query, sort, ticker]);

  const sourceCount = new Set(data?.items.map((item) => item.source)).size;
  const highPriorityCount = data?.items.filter((item) => item.priority >= 75).length ?? 0;
  const tickerCounts = useMemo(
    () =>
      Object.fromEntries(
        WATCHLIST.map(([symbol]) => [
          symbol,
          data?.items.filter((item) => item.tickers.includes(symbol)).length ?? 0,
        ]),
      ),
    [data],
  );
  const topStories = (data?.items ?? []).filter((item) => item.priority >= 75).slice(0, 3);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Signal Desk home">
          <span className="brand-mark">SD</span>
          <span>
            <strong>Signal Desk</strong>
            <small>Financial news triage</small>
          </span>
        </a>
        <div className="topbar-actions">
          <span className={`feed-status ${data?.mode === 'live' ? 'is-live' : ''}`}>
            <span className="status-dot" />
            {loading ? 'Connecting' : data?.mode === 'live' ? 'Live RSS' : 'Demo fallback'}
          </span>
          <button className="refresh-button" type="button" onClick={loadNews} disabled={loading}>
            <span aria-hidden="true">↻</span>
            {loading ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">US TECHNOLOGY · NEWS INTELLIGENCE</p>
          <h1>What deserves attention now?</h1>
          <p className="hero-copy">
            One screen for fresh headlines, company exposure, event type, and a transparent
            triage score.
          </p>
        </div>
        <div className="hero-time">
          <span>LAST INGEST</span>
          <strong>{data ? dateTime(data.fetchedAt) : '—'}</strong>
          <small>{data ? `${data.feedCount} feeds queried` : 'Waiting for feed'}</small>
        </div>
      </section>

      {data?.mode === 'sample' && (
        <div className="notice" role="status">
          <strong>Offline demo mode.</strong> Live feeds could not be reached, so clearly labeled
          sample stories are shown. No sample item represents a real event.
        </div>
      )}
      {error && (
        <div className="notice is-error" role="alert">
          <strong>Dashboard request failed.</strong> {error}. Try refresh.
        </div>
      )}

      <section className="metrics" aria-label="News overview">
        <article>
          <span>Headlines</span>
          <strong>{data?.items.length ?? '—'}</strong>
          <small>after deduplication</small>
        </article>
        <article>
          <span>High priority</span>
          <strong>{data ? highPriorityCount : '—'}</strong>
          <small>score ≥ 75</small>
        </article>
        <article>
          <span>Publishers</span>
          <strong>{data ? sourceCount : '—'}</strong>
          <small>distinct sources</small>
        </article>
        <article>
          <span>Universe</span>
          <strong>11</strong>
          <small>US technology names</small>
        </article>
      </section>

      <section className="workspace">
        <aside className="watchlist panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">UNIVERSE</p>
              <h2>Watchlist</h2>
            </div>
            <span>11</span>
          </div>
          <button
            className={`watch-row ${ticker === 'ALL' ? 'is-selected' : ''}`}
            type="button"
            onClick={() => setTicker('ALL')}
          >
            <span><b>ALL</b><small>Full feed</small></span>
            <em>{data?.items.length ?? 0}</em>
          </button>
          {WATCHLIST.map(([symbol, name]) => (
            <button
              className={`watch-row ${ticker === symbol ? 'is-selected' : ''}`}
              key={symbol}
              type="button"
              onClick={() => setTicker(symbol)}
            >
              <span><b>{symbol}</b><small>{name}</small></span>
              <em>{tickerCounts[symbol]}</em>
            </button>
          ))}
        </aside>

        <section className="feed panel" aria-label="News feed">
          <div className="feed-controls">
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search headline, ticker, source"
                aria-label="Search news"
              />
            </label>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="priority">Priority first</option>
              <option value="recent">Newest first</option>
            </select>
          </div>

          <div className="category-tabs" aria-label="Filter by event type">
            {CATEGORIES.map((item) => (
              <button
                className={category === item ? 'is-active' : ''}
                key={item}
                type="button"
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="feed-title-row">
            <div>
              <p className="section-label">NEWS STREAM</p>
              <h2>{ticker === 'ALL' ? 'All monitored stories' : `${ticker} stories`}</h2>
            </div>
            <span>{filteredItems.length} results</span>
          </div>

          <div className="story-list" aria-live="polite">
            {loading && !data && (
              <div className="empty-state">
                <span className="loading-ring" />
                <h3>Reading public feeds</h3>
                <p>Collecting and deduplicating recent headlines.</p>
              </div>
            )}
            {!loading && filteredItems.length === 0 && (
              <div className="empty-state">
                <span>∅</span>
                <h3>No matching stories</h3>
                <p>Clear a filter or search another term.</p>
              </div>
            )}
            {filteredItems.map((item) => (
              <article className="story" key={item.id}>
                <div className="priority-block" data-level={priorityLabel(item.priority)}>
                  <strong>{item.priority}</strong>
                  <small>{priorityLabel(item.priority)}</small>
                </div>
                <div className="story-content">
                  <div className="story-meta">
                    <span className={`category-pill category-${item.category.toLowerCase().replace('&', 'a')}`}>
                      {item.category}
                    </span>
                    <span>{item.source}</span>
                    <span title={dateTime(item.publishedAt)}>{relativeTime(item.publishedAt)}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <div className="story-footer">
                    <div className="ticker-pills">
                      {item.tickers.length ? (
                        item.tickers.map((symbol) => <span key={symbol}>{symbol}</span>)
                      ) : (
                        <span>MARKET</span>
                      )}
                    </div>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        Open source <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <span className="sample-label">SAMPLE ONLY</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="radar">
          <section className="panel radar-panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">RADAR</p>
                <h2>High priority</h2>
              </div>
              <span>{highPriorityCount}</span>
            </div>
            <div className="radar-list">
              {topStories.length ? topStories.map((item, index) => (
                <a key={item.id} href={item.url || '#'} target={item.url ? '_blank' : undefined} rel="noreferrer">
                  <b>0{index + 1}</b>
                  <span>{item.title}</span>
                </a>
              )) : <p>High-priority stories will appear here.</p>}
            </div>
          </section>

          <section className="panel method-panel">
            <p className="section-label">HOW IT WORKS</p>
            <h2>Transparent triage</h2>
            <ol>
              <li><b>01</b><span>Query four public RSS feeds.</span></li>
              <li><b>02</b><span>Match entities and remove duplicate titles.</span></li>
              <li><b>03</b><span>Score recency, event words, exposure, and source.</span></li>
            </ol>
            <p className="disclaimer">Priority is a reading-order heuristic. It is not an investment signal.</p>
          </section>
        </aside>
      </section>

      <footer>
        <span>Signal Desk · MVP</span>
        <span>Public headlines only · Source links preserved</span>
      </footer>
    </main>
  );
}
