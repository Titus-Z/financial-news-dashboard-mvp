'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EventType, InboxState, NewsResponse, Story, WireItem } from '@/lib/news/types';

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

const EVENT_TYPES: Array<'All' | EventType> = [
  'All', 'Earnings', 'Guidance', 'M&A', 'Regulation', 'Legal', 'Product', 'Macro', 'Filing', 'Market',
];

type View = 'watchlist' | 'market' | 'trending';
type FeedMode = 'clusters' | 'wire';
type StateFilter = 'all' | 'unread' | 'saved' | 'dismissed';
type SortMode = 'priority' | 'recent' | 'credibility';

function relativeTime(isoDate: string) {
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - Date.parse(isoDate)) / 60_000));
  if (elapsedMinutes < 60) return `${elapsedMinutes || 1}m ago`;
  const hours = Math.round(elapsedMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function dateTime(isoDate: string | null) {
  if (!isoDate) return 'No successful run';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

function scoreLabel(score: number) {
  if (score >= 84) return 'High';
  if (score >= 68) return 'Focused';
  return 'Monitor';
}

function nextState(current: InboxState, action: string): InboxState {
  if (action === 'read') return 'read';
  if (action === 'unread' || action === 'restore') return 'unread';
  if (action === 'dismiss') return 'dismissed';
  return current;
}

function matchesState(state: InboxState, saved: boolean, filter: StateFilter) {
  if (filter === 'unread') return state === 'new' || state === 'unread';
  if (filter === 'saved') return saved && state !== 'dismissed';
  if (filter === 'dismissed') return state === 'dismissed';
  return state !== 'dismissed';
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-row">
      <span>{label}</span>
      <div className="score-track" aria-hidden="true"><i style={{ width: `${value}%` }} /></div>
      <b>{value}</b>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState('');
  const [view, setView] = useState<View>('watchlist');
  const [feedMode, setFeedMode] = useState<FeedMode>('clusters');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [ticker, setTicker] = useState('ALL');
  const [eventType, setEventType] = useState<(typeof EVENT_TYPES)[number]>('All');
  const [sort, setSort] = useState<SortMode>('priority');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const loadNews = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(force ? '/api/news?refresh=1' : '/api/news', { cache: 'no-store' });
      const payload = await response.json() as NewsResponse & { error?: string; detail?: string };
      if (!response.ok) throw new Error(payload.detail || payload.error || `Request failed (${response.status})`);
      setData(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The inbox could not be loaded');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  useEffect(() => {
    if (!selectedId && data?.stories[0]) setSelectedId(data.stories[0].id);
  }, [data, selectedId]);

  const applyLocalState = useCallback((clusterId: string, action: string) => {
    setData((current) => {
      if (!current) return current;
      const update = <T extends { state: InboxState; saved: boolean }>(item: T) => item.state === undefined
        ? item
        : {
            ...item,
            state: nextState(item.state, action),
            saved: action === 'save' ? true : action === 'unsave' ? false : item.saved,
          };
      return {
        ...current,
        stories: current.stories.map((story) => story.id === clusterId ? update(story) : story),
        wireItems: current.wireItems.map((item) => item.clusterId === clusterId ? update(item) : item),
      };
    });
  }, []);

  const updateState = useCallback(async (clusterId: string, action: string) => {
    setWorkingId(clusterId);
    setError('');
    applyLocalState(clusterId, action);
    try {
      const response = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clusterId, action }),
      });
      if (!response.ok) {
        const payload = await response.json() as { error?: string };
        throw new Error(payload.error || 'State update failed');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'State update failed');
      await loadNews(false);
    } finally {
      setWorkingId('');
    }
  }, [applyLocalState, loadNews]);

  const stories = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...(data?.stories ?? [])]
      .filter((story) => {
        if (view === 'watchlist' && story.tickers.length === 0) return false;
        if (view === 'trending' && story.sourceCount < 2 && story.trendScore < 78) return false;
        return true;
      })
      .filter((story) => ticker === 'ALL' || story.tickers.includes(ticker))
      .filter((story) => eventType === 'All' || story.eventTypes.includes(eventType))
      .filter((story) => matchesState(story.state, story.saved, stateFilter))
      .filter((story) => !search || [story.title, ...story.tickers, ...story.eventTypes, ...story.evidence.map((item) => item.source)]
        .some((value) => value.toLowerCase().includes(search)))
      .sort((left, right) => {
        if (sort === 'recent') return Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
        if (sort === 'credibility') return right.credibility - left.credibility || right.priority - left.priority;
        return right.priority - left.priority || Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
      });
  }, [data, eventType, query, sort, stateFilter, ticker, view]);

  const wireItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return [...(data?.wireItems ?? [])]
      .filter((item) => view !== 'watchlist' || item.tickers.length > 0)
      .filter((item) => ticker === 'ALL' || item.tickers.includes(ticker))
      .filter((item) => eventType === 'All' || item.eventTypes.includes(eventType))
      .filter((item) => matchesState(item.state, item.saved, stateFilter))
      .filter((item) => !search || [item.title, item.source, ...item.tickers, ...item.eventTypes]
        .some((value) => value.toLowerCase().includes(search)))
      .sort((left, right) => {
        if (sort === 'priority') return right.priority - left.priority;
        if (sort === 'credibility') return right.credibility - left.credibility;
        return Date.parse(right.publishedAt) - Date.parse(left.publishedAt);
      });
  }, [data, eventType, query, sort, stateFilter, ticker, view]);

  const selectedStory = data?.stories.find((story) => story.id === selectedId) ?? stories[0] ?? null;
  const tickerCounts = useMemo(() => Object.fromEntries(WATCHLIST.map(([symbol]) => [
    symbol,
    data?.stories.filter((story) => story.tickers.includes(symbol) && story.state !== 'dismissed').length ?? 0,
  ])), [data]);
  const unreadCount = data?.stories.filter((story) => story.state === 'new' || story.state === 'unread').length ?? 0;
  const savedCount = data?.stories.filter((story) => story.saved && story.state !== 'dismissed').length ?? 0;
  const dismissedCount = data?.stories.filter((story) => story.state === 'dismissed').length ?? 0;
  const displayedCount = feedMode === 'clusters' ? stories.length : wireItems.length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#workspace" aria-label="Signal Desk home">
          <span className="brand-word">SIGNAL DESK</span>
          <span className="brand-divider" />
          <span className="brand-subtitle">Evidence-first news intelligence</span>
        </a>
        <nav className="primary-nav" aria-label="Inbox views">
          {([
            ['watchlist', 'My Watchlist'],
            ['market', 'Market'],
            ['trending', 'Trending'],
          ] as const).map(([value, label]) => (
            <button key={value} className={view === value ? 'is-active' : ''} type="button" onClick={() => setView(value)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <span className={`mode-badge mode-${data?.mode ?? 'loading'}`}>
            <i aria-hidden="true" />
            {loading && !data ? 'Connecting' : data?.mode ?? 'Unavailable'}
          </span>
          <button className="refresh-button" type="button" onClick={() => void loadNews(true)} disabled={loading}>
            {loading ? 'Refreshing' : 'Refresh sources'}
          </button>
        </div>
      </header>

      <section className="briefing-band">
        <div>
          <p className="eyebrow">TRUSTWORTHY STORY INBOX · P0</p>
          <h1>Compress the noise. Keep the evidence.</h1>
          <p>Public headlines become stable stories with source lineage, material-event context, and an auditable reading workflow.</p>
        </div>
        <dl className="briefing-metrics">
          <div><dt>Stories</dt><dd>{data?.metrics.storyCount ?? '—'}</dd><small>from {data?.metrics.rawEventCount ?? '—'} records</small></div>
          <div><dt>Compression</dt><dd>{data ? `${data.metrics.compressionRate}%` : '—'}</dd><small>duplicate reduction</small></div>
          <div><dt>Sources healthy</dt><dd>{data ? `${data.metrics.healthySourceCount}/${data.metrics.totalSourceCount}` : '—'}</dd><small>last-good retained</small></div>
          <div><dt>Watchlist</dt><dd>{data?.metrics.watchlistStoryCount ?? '—'}</dd><small>relevant stories</small></div>
        </dl>
      </section>

      {(data?.warning || error) && (
        <div className={`system-notice ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>
          <strong>{error ? 'Action required' : data?.mode === 'sample' ? 'Demonstration mode' : 'Partial source coverage'}</strong>
          <span>{error || data?.warning}</span>
        </div>
      )}

      <section className="source-strip" aria-label="Source health">
        <div className="source-strip-heading">
          <span>Source health</span>
          <small>Published, ingested, and last-success state remain separate.</small>
        </div>
        <div className="source-cells">
          {(data?.sources ?? []).map((source) => (
            <article key={source.id} title={source.detail}>
              <div><i className={`health-dot health-${source.status}`} /><strong>{source.name}</strong></div>
              <span>{source.status}</span>
              <small>{source.lastSuccessAt ? `${source.itemCount} items · ${source.latencyMs ?? '—'} ms` : 'No successful run'}</small>
            </article>
          ))}
          {!data && <article className="source-skeleton"><strong>Checking source registry</strong><small>Five monitored inputs</small></article>}
        </div>
      </section>

      <section className="workspace" id="workspace">
        <aside className="sidebar panel">
          <div className="panel-title"><span>INBOX</span><small>{unreadCount} unread</small></div>
          <div className="state-nav">
            {([
              ['all', 'Active', data?.stories.filter((story) => story.state !== 'dismissed').length ?? 0],
              ['unread', 'Unread', unreadCount],
              ['saved', 'Saved', savedCount],
              ['dismissed', 'Dismissed', dismissedCount],
            ] as const).map(([value, label, count]) => (
              <button key={value} className={stateFilter === value ? 'is-selected' : ''} type="button" onClick={() => setStateFilter(value)}>
                <span>{label}</span><b>{count}</b>
              </button>
            ))}
          </div>

          <div className="panel-title watchlist-title"><span>WATCHLIST</span><small>11 names</small></div>
          <div className="watchlist-nav">
            <button className={ticker === 'ALL' ? 'is-selected' : ''} type="button" onClick={() => setTicker('ALL')}>
              <span><b>ALL</b><small>Current view</small></span><em>{data?.metrics.watchlistStoryCount ?? 0}</em>
            </button>
            {WATCHLIST.map(([symbol, company]) => (
              <button key={symbol} className={ticker === symbol ? 'is-selected' : ''} type="button" onClick={() => setTicker(symbol)}>
                <span><b>{symbol}</b><small>{company}</small></span><em>{tickerCounts[symbol]}</em>
              </button>
            ))}
          </div>
        </aside>

        <section className="inbox panel" aria-label="Story inbox">
          <div className="inbox-toolbar">
            <label className="search-field">
              <span>Search</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Headline, ticker, event, publisher" aria-label="Search stories" />
            </label>
            <label className="select-field">
              <span>Event</span>
              <select value={eventType} onChange={(event) => setEventType(event.target.value as typeof eventType)}>
                {EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label className="select-field">
              <span>Order</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                <option value="priority">Priority</option>
                <option value="recent">Most recent</option>
                <option value="credibility">Credibility</option>
              </select>
            </label>
          </div>

          <div className="inbox-heading">
            <div>
              <p className="eyebrow">{view === 'watchlist' ? 'MY WATCHLIST' : view.toUpperCase()}</p>
              <h2>{view === 'watchlist' ? 'Stories tied to your research universe' : view === 'trending' ? 'Corroborated and fast-moving stories' : 'The full monitored market stream'}</h2>
            </div>
            <div className="mode-switch" aria-label="Story display mode">
              <button className={feedMode === 'clusters' ? 'is-active' : ''} type="button" onClick={() => setFeedMode('clusters')}>Stories</button>
              <button className={feedMode === 'wire' ? 'is-active' : ''} type="button" onClick={() => setFeedMode('wire')}>Raw wire</button>
            </div>
          </div>

          <div className="result-meta"><span>{displayedCount} results</span><small>Last response {data ? relativeTime(data.fetchedAt) : 'pending'}</small></div>

          <div className="story-list" aria-live="polite">
            {loading && !data && <div className="empty-state"><b>Building the story inbox</b><span>Checking providers, stable identities, and saved state.</span></div>}
            {!loading && displayedCount === 0 && <div className="empty-state"><b>No stories match this view</b><span>Change a filter or restore a dismissed story.</span></div>}

            {feedMode === 'clusters' && stories.slice(0, 120).map((story) => (
              <article key={story.id} className={`story-card ${selectedStory?.id === story.id ? 'is-selected' : ''} state-${story.state}`}>
                <button className="story-main" type="button" onClick={() => setSelectedId(story.id)}>
                  <div className="story-score" data-level={scoreLabel(story.priority)}><strong>{story.priority}</strong><span>{scoreLabel(story.priority)}</span></div>
                  <div className="story-body">
                    <div className="story-kicker">
                      <span>{story.eventTypes[0]}</span>
                      <small>{relativeTime(story.publishedAt)}</small>
                      {story.state !== 'new' && <small>{story.state}</small>}
                    </div>
                    <h3>{story.title}</h3>
                    <div className="story-context">
                      <span>{story.sourceCount} publisher {story.sourceCount === 1 ? 'family' : 'families'}</span>
                      <span>{story.eventCount} source {story.eventCount === 1 ? 'record' : 'records'}</span>
                      <span>{story.reasons[0]}</span>
                    </div>
                    <div className="tag-row">
                      {(story.tickers.length ? story.tickers : ['MARKET']).map((symbol) => <b key={symbol}>{symbol}</b>)}
                      {story.eventTypes.slice(0, 2).map((type) => <em key={type}>{type}</em>)}
                    </div>
                  </div>
                </button>
                <div className="quick-actions">
                  {story.state === 'dismissed' ? (
                    <button type="button" onClick={() => void updateState(story.id, 'restore')} disabled={workingId === story.id}>Restore</button>
                  ) : (
                    <>
                      <button type="button" onClick={() => void updateState(story.id, story.state === 'read' ? 'unread' : 'read')} disabled={workingId === story.id}>{story.state === 'read' ? 'Unread' : 'Read'}</button>
                      <button className={story.saved ? 'is-active' : ''} type="button" onClick={() => void updateState(story.id, story.saved ? 'unsave' : 'save')} disabled={workingId === story.id}>{story.saved ? 'Saved' : 'Save'}</button>
                      <button type="button" onClick={() => void updateState(story.id, 'dismiss')} disabled={workingId === story.id}>Dismiss</button>
                    </>
                  )}
                </div>
              </article>
            ))}

            {feedMode === 'wire' && wireItems.slice(0, 160).map((item: WireItem) => (
              <article key={item.eventId} className="wire-row">
                <button type="button" onClick={() => setSelectedId(item.clusterId)}>
                  <span className="wire-time">{relativeTime(item.publishedAt)}</span>
                  <div><h3>{item.title}</h3><p>{item.source} · Tier {item.sourceTier} · {item.eventTypes.join(', ')}</p></div>
                  <strong>{item.priority}</strong>
                </button>
              </article>
            ))}
          </div>
        </section>

        <aside className="detail panel" aria-label="Selected story detail">
          {selectedStory ? (
            <>
              <div className="detail-head">
                <div><p className="eyebrow">STORY EVIDENCE</p><span className={`state-label state-${selectedStory.state}`}>{selectedStory.state}</span></div>
                <strong>{selectedStory.priority}</strong>
              </div>
              <h2>{selectedStory.title}</h2>
              <div className="detail-tags">
                {(selectedStory.tickers.length ? selectedStory.tickers : ['MARKET']).map((symbol) => <b key={symbol}>{symbol}</b>)}
                {selectedStory.eventTypes.map((type) => <span key={type}>{type}</span>)}
              </div>

              <section className="detail-section">
                <h3>Why it ranks here</h3>
                <div className="score-grid">
                  <ScoreBar label="Relevance" value={selectedStory.relevance} />
                  <ScoreBar label="Importance" value={selectedStory.importance} />
                  <ScoreBar label="Credibility" value={selectedStory.credibility} />
                  <ScoreBar label="Freshness" value={selectedStory.freshness} />
                </div>
                <ul className="reason-list">{selectedStory.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
              </section>

              <section className="detail-section">
                <div className="section-row"><h3>Evidence trail</h3><span>{selectedStory.sourceCount} families</span></div>
                <div className="evidence-list">
                  {selectedStory.evidence.map((evidence) => (
                    <article key={evidence.eventId}>
                      <div><b>{evidence.publisherFamily}</b><span>Tier {evidence.sourceTier}</span></div>
                      <p>{evidence.title}</p>
                      <footer><time>{dateTime(evidence.publishedAt)}</time>{evidence.url ? <a href={evidence.url} target="_blank" rel="noreferrer" onClick={() => void updateState(selectedStory.id, 'read')}>Open original</a> : <span>Demo evidence</span>}</footer>
                    </article>
                  ))}
                </div>
              </section>

              <section className="detail-section timeline-section">
                <h3>Story lifecycle</h3>
                <dl>
                  <div><dt>Published</dt><dd>{dateTime(selectedStory.publishedAt)}</dd></div>
                  <div><dt>First ingested</dt><dd>{dateTime(selectedStory.firstSeenAt)}</dd></div>
                  <div><dt>Last updated</dt><dd>{dateTime(selectedStory.lastSeenAt)}</dd></div>
                </dl>
              </section>

              <div className="detail-actions">
                <button type="button" onClick={() => void updateState(selectedStory.id, selectedStory.state === 'read' ? 'unread' : 'read')}>{selectedStory.state === 'read' ? 'Mark unread' : 'Mark read'}</button>
                <button className={selectedStory.saved ? 'is-primary' : ''} type="button" onClick={() => void updateState(selectedStory.id, selectedStory.saved ? 'unsave' : 'save')}>{selectedStory.saved ? 'Saved' : 'Save story'}</button>
              </div>
            </>
          ) : <div className="empty-state"><b>Select a story</b><span>Its score, sources, and lifecycle will appear here.</span></div>}
        </aside>
      </section>

      <footer className="page-footer">
        <span>Signal Desk v0.2.0 · Public metadata only</span>
        <span>Priority orders reading. It does not predict returns or recommend trades.</span>
      </footer>
    </main>
  );
}
