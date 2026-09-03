# Canonical research source — Financial News Dashboard landscape

Status: **complete for the 2026-09-03 decision snapshot**

Repository: `Titus-Z/financial-news-dashboard-mvp`

Public MVP commit known before this research: `849cb7f`

This document records evidence; the user-facing synthesis is [`financial-news-product-landscape-2026-09-03.md`](financial-news-product-landscape-2026-09-03.md).

## 1. Research protocol

### Research question

Which commercial products and open-source implementations contain functions or architectural patterns that can improve Signal Desk, and what should be built next without violating evidence, licensing, data-rights, or product-scope boundaries?

### Operational coverage rule

An internet-exhaustive product list is not falsifiable because private systems and newly created/retired products are unobservable. Coverage is accepted when all six product families contain multiple representatives and every included candidate has a primary product page or inspectable repository:

1. institutional terminals;
2. AI search and event intelligence;
3. low-latency trader news;
4. retail workstations, social and alternative data;
5. general intelligence/RSS readers;
6. open-source implementations.

### Inclusion rules

- Current official product/help/developer page, or public source repository.
- Direct relevance to at least one of: acquisition, normalization, story grouping, entity/event intelligence, search/filtering, context, alerts, research workflow, governance.
- Product marketing claims are recorded as vendor-stated capabilities unless code or an accessible API confirms them.
- GitHub stars are discovery/popularity signals only.

### Exclusion/de-emphasis rules

- Generic trading platforms with no differentiated news workflow.
- Abandoned tutorial repositories that add no unique pattern.
- SEO listicles and affiliate comparison pages.
- Claims whose only evidence is a screenshot or third-party review.
- Source code without a license is inspectable but treated as unavailable for copying.

### Evidence grades

| Grade | Standard |
|---|---|
| A | Current official/API documentation or inspected code at recorded commit |
| B | Current official feature/help page; no hands-on paid account |
| C | Marketing surface, limited public detail, old material, or unclear current status |

### Verification gaps

- No commercial subscriptions were purchased.
- No vendor latency/coverage bake-off was run.
- No per-publisher terms-of-service or copyright opinion was completed.
- No production-cost quote was obtained for enterprise vendors.
- No labeled Signal Desk story/entity dataset exists yet; model and heuristic accuracy cannot be claimed.

## 2. Current MVP evidence

Primary file: `app/api/news/route.ts`.

Observed implementation:

- four fixed Google News search RSS queries;
- concurrent `Promise.allSettled` fetches with eight-second per-request timeout;
- RSS `<item>` parsing by regular expression;
- title, link, source, publication time extraction;
- fixed alias registry for 11 tickers;
- six keyword event categories;
- one priority score combining recency, event terms, ticker count and source-name boost;
- normalized exact-title deduplication;
- 80-item limit;
- explicit sample mode only when zero live items remain;
- CDN cache header with 10-minute shared cache and five-minute stale revalidation.

Known missing contracts:

- no source registry or provider adapter;
- no persistent event or story storage;
- no canonical URL or origin-publisher resolution;
- no cross-headline story clustering;
- no source-health history or last-good per source;
- no read/save/dismiss state;
- no separate relevance, novelty, importance and credibility fields;
- no official filing/IR source;
- no quality dataset or measured precision/recall;
- no alert or evidence-grounded AI layer.

## 3. Open-source repository snapshot

Metadata retrieved from GitHub on 2026-09-03. Stars are volatile and have no quality weighting.

| Repository | Commit inspected | Stars | Primary language | License observed |
|---|---|---:|---|---|
| [OpenBB-finance/OpenBB](https://github.com/OpenBB-finance/OpenBB) | `3e071fcc2cd9f891cac6040ae60296dba76dab46` | 72,628 | Python | repository `LICENSE`: AGPL-3.0; package metadata AGPL-3.0-only |
| [Fincept-Corporation/FinceptTerminal](https://github.com/Fincept-Corporation/FinceptTerminal) | `73e192986aa6133d69ec306ebbd4eb9befbe43ac` | 30,908 | C++ | `LICENSE` states AGPL-3.0 plus additional commercial/trade-dress terms; high-risk reference only |
| [koala73/worldmonitor](https://github.com/koala73/worldmonitor) | `14ded4b6b07360c6f3b22924e642079238e88175` | 85,425 | TypeScript | AGPL-3.0 |
| [stxkxs/mkt](https://github.com/stxkxs/mkt) | `66f1419fef3f01deed9301554b71f07beac62ac8` | 4 | Go | MIT |
| [tduic/macro-dashboard](https://github.com/tduic/macro-dashboard) | `16d34b045369df7b95b8bf36b92a47c34ed97c81` | 0 | TypeScript/Python | no license found |
| [ShaonINT/breaking_news_market_sentiment](https://github.com/ShaonINT/breaking_news_market_sentiment) | `b60cc672009f12f66027678c816df0e3932f776b` | 4 | Python | MIT |
| [sarsiz/Financial-Market-Dashboard](https://github.com/sarsiz/Financial-Market-Dashboard) | `1d7a812be44ed411013c90963e8b8b7acf33b10c` | 0 | Python | MIT |
| [makeev/alphai-tui](https://github.com/makeev/alphai-tui) | `bfe8c34e6ce098ed44317916a9e162de13d1d265` | 28 | Rust | MIT |
| [feremabraz/bloomberg-terminal](https://github.com/feremabraz/bloomberg-terminal) | `d53714efca546ed90bf4396383d1459cc962de69` | 1,527 | TypeScript | no license found by repository/API inspection |
| [AI4Finance-Foundation/FinRobot](https://github.com/AI4Finance-Foundation/FinRobot) | `d221910096de87579b02f8f0674652bf1a175f51` | 7,902 | Notebooks/Python | Apache-2.0 |
| [AI4Finance-Foundation/FinGPT](https://github.com/AI4Finance-Foundation/FinGPT) | `bc346d5c88d21615591a1e9a18160b1fb11ee0c5` | 21,201 | Notebooks/Python | MIT |
| [ProsusAI/finBERT](https://github.com/ProsusAI/finBERT) | `44995e0c5870c4ab37a189d756550654ae87cdf0` | 2,219 | Notebooks/Python | Apache-2.0 |
| [glanceapp/glance](https://github.com/glanceapp/glance) | `454e585ecd126e18c911a116a91e9834f1093e7d` | 36,802 | Go | AGPL-3.0 |
| [miniflux/v2](https://github.com/miniflux/v2) | `a84533db6ca0a2ff9a47800fbf0326be6d9b3170` | 9,646 | Go | Apache-2.0 |
| [DIYgod/RSSHub](https://github.com/DIYgod/RSSHub) | `cca82db4d10dc03b4caf2f100dea919223c9f617` | 45,993 | TypeScript | AGPL-3.0 |
| [RSSNext/Folo](https://github.com/RSSNext/Folo) | `465b997e89bde007fcac32257baec6a2ded73164` | 38,901 | TypeScript | AGPL-3.0 plus icon exception |
| [Yang1Bai/finance-daily-site](https://github.com/Yang1Bai/finance-daily-site) | `14c94b4b65d48a037f0e5df5e524213a3ba7e426` | 1 | HTML/Python | no LICENSE file; README says MIT |

## 4. Code evidence ledger

### O01 — OpenBB provider abstraction

Files:

- `openbb_platform/core/openbb_core/provider/abstract/fetcher.py`
- `openbb_platform/core/openbb_core/provider/abstract/provider.py`
- `openbb_platform/core/openbb_core/provider/registry.py`
- `openbb_platform/core/openbb_core/provider/standard_models/company_news.py`
- `examples/streamlit/news.py`

Evidence:

- Fetchers follow typed query transformation, extraction and result transformation stages.
- Provider registry loads extensions and isolates some extension-load failures.
- `CompanyNews` supplies a common query/data contract while Benzinga, FMP, Intrinio, Tiingo, TMX and yfinance implement provider-specific adapters.
- The example can switch providers while keeping a common surface, with provider-specific filters available where supported.

Decision: independently implement a small TypeScript provider contract and capability map. Do not copy AGPL source into the MIT application.

### O02 — WorldMonitor story identity and credibility

Files:

- `shared/story-identity.js`
- `server/worldmonitor/news/v1/dedup.mjs`
- `shared/news-clustering-core.js`
- `shared/entity-extraction-core.js`
- `shared/news-credibility.js`
- `server/worldmonitor/news/v1/_feeds.ts`
- `scripts/validate-rss-feeds.mjs`
- `docs/methodology/news-digest-and-briefing.mdx`
- `docs/methodology/news-credibility.mdx`

Evidence:

- Story identity uses normalized lexical features with token, bigram and character n-gram views, an inverted index and union-find clustering.
- It adds entity-shaped and numeric boosts, a containment rescue for truncated headlines, hot-token bucket caps, and exact-duplicate pre-union.
- Canonical ID uses the earliest cluster member, then consults persistent alias/first-seen state to prevent later wording changes or backdated publisher timestamps from stealing a live identity.
- Corroboration counts publisher families, not feed labels.
- Cluster primary story uses source tier then recency; first/last seen and top sources are retained.
- Credibility and importance remain separate. Unknown source risk fails closed; high-risk sources are capped.
- Feed validator checks HTTPS/allowlist behavior in CI, redirect hops, RSS/Atom/RDF dates, stale/dead/empty states, concurrency and persistent consecutive failures.
- LLM outputs are bounded and have deterministic fallback; publisher, URL and time originate from structured feed data.

Decision: this is the strongest conceptual reference. Reimplement a simpler, independently authored version with a manually labeled finance headline set. AGPL applies to source reuse.

### O03 — Miniflux feed reliability and user state

Files:

- `internal/model/feed.go`
- `internal/model/entry.go`
- `internal/reader/handler/handler.go`
- `internal/reader/filter/filter.go`
- `internal/storage/feed.go`
- `internal/storage/entry.go`
- `internal/worker/worker.go`

Evidence:

- Feed state includes ETag, Last-Modified, parsing error message/count, keep/block rules, user agent, proxy and HTTP-cache controls.
- Next check can adapt to entry frequency and also respects RSS TTL, Retry-After, Cache-Control and Expires inputs.
- Refresh uses conditional headers unless forced and handles rate limiting separately.
- Entry persistence has status, hash, published/created/changed times, content, tags, language, reading time and starred state.
- Tombstones prevent deleted entries from reappearing as unread during later refreshes.
- Storage supports full-text document vectors and read/unread counters.

Decision: best permissively licensed reference for feed infrastructure. Borrow only small, attributed patterns when independent implementation would add no value.

### O04 — alphai-tui request-budgeted interaction

Files:

- `src/source/registry.rs`
- `src/poller.rs`
- `src/app/feeds.rs`

Evidence:

- One source registry drives provider construction, credentials, CLI help and settings.
- Per-ticker work is concurrent.
- Only the visible feed is fetched to respect provider request budgets.
- Head, page and delta fetches have distinct TTL/cadence behavior.
- Publish order and ingest order are both retained.
- Cache keys separate market, ticker and trending feeds; cursor pagination is supported.
- Fetch failure does not drop the previously visible list.
- Syndication clusters are displayed as one story with a multiplier and new/unread markers.

Decision: borrow interaction and budget behavior. MIT permits reuse with license/attribution, though an independent TypeScript implementation is small enough to prefer.

### O05 — mkt bounded multi-source ingestion

Files:

- `internal/news/rss.go`
- `internal/news/edgar.go`

Evidence:

- Typed `Headline` and source `Feed` structures.
- Concurrent per-feed fetch with an eight-second timeout and failure isolation.
- SEC EDGAR Atom results are merged into the same headline model with filing form as category.
- URL-level dedup and bounded newest-first result.

Decision: adopt the small-source failure-isolation pattern and filings-as-events. Improve dedup beyond URL.

### O06 — Macro Dashboard status and cache separation

Files:

- `backend/data/news.py`
- `backend/cache.py`
- `frontend/src/components/NewsFeed.tsx`

Evidence:

- Editable `(url, label, category)` source registry.
- Dead feeds are skipped instead of failing the endpoint.
- Market, FRED, news and calendar buckets use materially different TTLs.
- UI includes topic tabs, count badges and explicit loading/error/empty states.
- Product connects headlines to daily movers, macro regimes and event overlays.

Decision: use the state design and per-data-class caching. No license means no code copying.

### O07 — Financial-Market-Dashboard event envelope

Files:

- `server.py`

Evidence:

- SQLite `market_events` stores stable id, title, URL, source, category, symbols, published/fetched time, relevance, significance and payload.
- Indexes and upsert preserve event history.
- Feed fetch is concurrent and sources merge into a common object.
- Relevance/significance combine heuristics, freshness and source weights; optional local LLM exists.

Decision: use the schema lesson, not the implementation. Monolithic structure, hard-coded fallbacks and unvalidated weights make it unsuitable as a base.

### O08 — Breaking News Market Sentiment taxonomy experiment

Files:

- `news_extractor.py`
- `news_filter.py`
- `sentiment_analyzer.py`

Evidence:

- Around 30 configured RSS sources, explicit timeouts and normalized titles.
- Dedup key includes normalized title plus source, so cross-source syndication remains.
- Fetch loop is sequential.
- Regex rules provide a multi-label event taxonomy and preferred-source/editorial boosts.
- VADER aggregates title/summary sentiment and compares source/time series.
- README feed count and code feed count have drifted.

Decision: preserve taxonomy/benchmark concepts. Reject global average sentiment and arbitrary source boosts.

### O09 — Fincept persistent news workspace

Files:

- `fincept-qt/src/services/news/NewsService.h`
- `fincept-qt/src/services/news/NewsService_Feeds.cpp`
- `fincept-qt/src/services/news/NewsService_Parsing.cpp`
- `fincept-qt/src/services/news/NewsClusterService.cpp`
- `fincept-qt/src/services/news/NewsMonitorService.h`
- `fincept-qt/src/storage/sqlite/migrations/v013_news_articles.cpp`
- `fincept-qt/src/storage/repositories/NewsArticleRepository.h`
- `fincept-qt/src/screens/news/NewsScreen.cpp`

Evidence:

- Common article structure includes source, region, category, priority, sentiment, impact, tickers, tier, language and threat fields.
- SQLite stores articles, indexes core fields and maintains FTS5 search.
- Read and saved state persist; analysis results cache by URL.
- UI offers category/time/sort/view/search, wire/cluster views, feed/detail/side panes, live status, auto-refresh, new-item animation and scroll-based seen tracking.
- User can add/update/disable feeds and monitors.
- Progressive fetch publishes accumulated lists.
- Clustering is greedy Jaccard with low threshold and random cluster IDs; this is less stable than WorldMonitor.

Decision: learn the feature decomposition. Repository license text adds commercial and trade-dress restrictions on top of an AGPL statement; treat all code and distinctive UI as reference-only unless legal clearance is obtained.

### O10 — Glance configuration-driven dashboard

Files:

- `internal/glance/widget.go`
- `internal/glance/widget-container.go`
- `internal/glance/widget-rss.go`
- `docs/configuration.md`

Evidence:

- YAML maps pages, columns and typed widgets.
- Widgets own cache duration and update state; containers update due widgets concurrently.
- Invalid hot-reloaded configuration leaves the prior valid configuration running.
- RSS supports multiple visual styles and per-feed limits.

Decision: independently reimplement a small widget/layout config after the core workflow stabilizes. AGPL source reuse is incompatible with retaining a simple MIT-only combined work.

### O11 — RSSHub route and cache architecture

Files:

- `lib/middleware/cache.ts`
- `lib/routes/10jqka/realtimenews.ts`
- `lib/routes/21caijing/channel.ts`

Evidence:

- Route definitions declare path, name, URL, maintainer, parameters, category and capabilities.
- Shared cache derives compact keys and uses a control key/claim to avoid duplicate concurrent upstream work.
- Finance routes can adapt JSON APIs, HTML parsing, encoding and item detail fetches into a feed contract.

Decision: use as an optional isolated source bridge only. AGPL and per-source access/redistribution rules require separate review. Metadata-only routes are safer than copying full article content.

### O12 — Folo three-level AI preference

Files:

- `apps/desktop/layer/renderer/src/atoms/ai-summary.ts`
- `apps/desktop/layer/renderer/src/atoms/ai-translation.ts`

Evidence:

- Summary and translation can be enabled globally, by an action/rule, or once from the toolbar.
- Translation has separate list-view and entry-view behavior.

Decision: adopt the preference hierarchy for future summary/translation. Reimplement independently because Folo is AGPL.

### O13 — FinRobot evidence boundary

Files:

- `finrobot_equity/core/src/modules/news_integrator.py`
- `finrobot_equity/core/src/modules/catalyst_analyzer.py`

Evidence:

- Typed news and catalyst structures, taxonomy, relevance and report workflows.
- Project direction separates deterministic calculations from narrative and emphasizes traceable outputs.
- Some importance/probability defaults are heuristic or hard-coded.

Decision: keep deterministic facts outside LLM prose. Defer multi-agent research and uncalibrated catalyst probabilities.

### O14 — FinGPT and FinBERT as benchmarks

FinGPT files:

- `README.md`
- `fingpt/FinGPT_Benchmark/readme.md`

FinBERT files:

- `README.md`
- `scripts/predict.py`

Evidence:

- FinGPT supplies financial sentiment, relation extraction, headline and NER task datasets/models and an evaluation harness.
- FinGPT documentation explicitly warns that limited task/data diversity can cause out-of-scope failures.
- Much of the published benchmark/model stack is based on 2023-era base models and notebooks.
- FinBERT returns negative/neutral/positive probabilities and a positive-minus-negative score; its repository documents older library migration debt.

Decision: use both only in a benchmark after an in-domain labeled set exists. Sentiment cannot substitute for materiality or credibility.

### O15 — UI-only Bloomberg clone

Files inspected include the news view, watchlist and project README.

Evidence:

- Dense terminal layout, dark palette, keyboard-oriented navigation and search.
- Some market data is explicitly simulated/static; news relies on a provider API.
- No repository license file was detected even though README text mentions MIT.

Decision: generic density/split-pane ideas only. No source or branding reuse.

### O16 — Financial Daily automation and security failure

Files:

- `scripts/fetch_content.py`
- `scripts/send_briefing.py`
- `.github/workflows/update.yml`

Evidence:

- Scheduled web-search-driven daily JSON/HTML generation, archive, RSS and messaging distribution.
- One prompt asks the model to obtain prices, news, macro, earnings, technicals and recommendations in a single generation, making provenance and failure isolation weak.
- Repository has no LICENSE file despite a README assertion.
- A messaging script contains hard-coded credentials/recipient identifiers. Values are deliberately omitted from this report.

Decision: retain scheduled artifact/archive idea. Reject the acquisition architecture, trading recommendations and secret handling.

## 5. Primary commercial-product source ledger

| Family | Product | Primary source | Verified capability used in synthesis |
|---|---|---|---|
| Institutional | Bloomberg Terminal | https://professional.bloomberg.com/products/bloomberg-terminal/ | customizable market/news workspace, alerts, mobile |
| Institutional | LSEG Workspace | https://www.lseg.com/en/data-analytics/products/workspace | integrated data, Reuters/news, analytics, desktop/web/mobile |
| Institutional | LSEG Portfolio Manager | https://www.lseg.com/content/dam/data-analytics/en_us/documents/fact-sheets/final_re1570059_ws_ia_rpm_factsheet_portfolio_manager_a4_v6_web.pdf | watchlist pulse, filings/events/news, alerts, digest |
| Institutional | LSEG AI Search | https://www.lseg.com/en/data-analytics/products/workspace/updates/act-with-the-same-confidence-at-a-new-speed-introducing-lseg-workspace-ai-search | natural-language follow-up, tables/charts, citations |
| Institutional | FactSet | https://insight.factset.com/hubfs/Resources%20Section/Brochures/solutions-for-portfolio-managers-brochure.pdf | StreetAccount, watchlist alerts, scheduled summaries, internal research |
| Institutional | FactSet Developer | https://developer.factset.com/ | programmatic data/news access surface |
| Institutional | S&P Capital IQ Pro News | https://www.spglobal.com/market-intelligence/en/solutions/news-and-insights | personalized homepage, alerts, sentiment, chart explainer |
| Institutional | Morningstar Direct | https://www.morningstar.com/business/products/direct | unified data/research/portfolio/reporting workflow |
| Institutional/broker | IBKR TWS | https://www.interactivebrokers.com/en/trading/tws.php | linkable Mosaic workspace with watchlist, quotes, charts, news, portfolio |
| AI | AlphaSense | https://www.alpha-sense.com/solutions/market-intelligence-platform/ | multi-corpus search, cited snippets, dashboards, notebooks, monitoring |
| AI | AlphaSense April 2026 update | https://help.alpha-sense.com/hc/en-us/articles/51403579155731-AlphaSense-Product-Updates-April-2026 | daily/weekly alert summaries; document vs executive brief |
| AI | AlphaSense June 2026 update | https://help.alpha-sense.com/hc/en-us/articles/53055793440787-AlphaSense-Product-Updates-June-2026 | central alert/search management, sharing, PDF summaries, export |
| AI/event | RavenPack Edge | https://www.ravenpack.com/products/edge | entity/event metadata, indicators, archive/API |
| AI/event | RavenPack factors | https://marketing-prod.ravenpack.com/products/edge/factors/company-news | relevance, novelty, event, media attention, sentiment |
| AI/event | Dataminr | https://www.dataminr.com/use-cases/financial-services/ | early public-event detection and metadata |
| AI/retrieval | Bigdata.com | https://bigdata.com/developers | search/retrieval/rerank, finance embeddings, knowledge graph, citations |
| AI/retrieval | Bigdata MCP | https://docs.bigdata.com/mcp-reference/introduction | news/filings/transcripts and categorized briefs with inline sources |
| AI/fundamental | Fiscal.ai API | https://docs.fiscal.ai/docs/introduction | typed company news, earnings events, IR/transcripts, fund letters |
| AI/fundamental | Fiscal.ai skills | https://docs.fiscal.ai/docs/guides/mcp-skills | filing-backed numbers and news/event workflows |
| Primary documents | Quartr | https://quartr.com/features | calls, transcripts, events, watchlists, alerts, recaps, slide history |
| AI/retrieval | Perplexity Finance | https://www.perplexity.ai/gen/enterprise/finance | cited answers from filings, calls, databases, web/internal sources |
| Trader | Benzinga Pro Newsfeed | https://www.benzinga.com/pro/feature/newsfeed/ | granular filters and Why Is It Moving |
| Trader | Benzinga Pro Alerts | https://www.benzinga.com/pro/feature/alerts | browser/email/sound and tool/workspace controls |
| Trader | Newsquawk | https://portal.newsquawk.com/features.html | analyst-filtered audio/text, search, chat, calendar |
| Trader | The Fly | https://www.thefly.com/ | real-time breaking and portfolio-personalized feed |
| Trader | MT Newswires | https://www.mtnewswires.com/web-solutions | ticker/category coding and API/FTP/RSS delivery |
| Trader | TradeTheNews | https://www.tradethenews.com/ | analyst audio/text, calendars, history |
| Retail | Koyfin Alerts | https://www.koyfin.com/features/alerts/ | price/valuation/technical/news/filing alerts |
| Retail | Koyfin Watchlist News | https://www.koyfin.com/help/watchlist-news-feature/ | source, filing type and topic filters |
| Retail | Koyfin Dashboards | https://www.koyfin.com/help/mydashboards-myd/ | resizable linked widgets |
| Retail | TradingView News filters | https://www.tradingview.com/support/solutions/43000732560-news-flow-s-filters-overview/ | instrument/market/sector/event/country/provider filters |
| Retail | TradingView Alerts | https://www.tradingview.com/support/solutions/43000520149-introduction-to-tradingview-alerts/ | app/email/webhook/sound channels |
| Retail | Finviz | https://finviz.com/help/screener | fundamentals/technical/news/event screening |
| Retail | Seeking Alpha | https://help.seekingalpha.com/what-are-the-key-features-of-seeking-alphas-portfolio-tracker | portfolio/watchlist alerts and portfolio context |
| Retail | Yahoo Finance | https://finance.yahoo.com/subscriptions/ | portfolio/watchlist, research, risk and alerts |
| Retail | Investing.com | https://www.investing.com/mobile/?screen=markets | multi-asset quotes, calendar, breaking news, portfolio and mobile alerts |
| Social | Stocktwits | https://help.stocktwits.com/c/navigating/articles/new-symbol-page | symbol stream, bullish/bearish voting, attention/watchers |
| Retail | TipRanks Smart Portfolio | https://www.tipranks.com/news/labs/tipranks-ups-your-smart-portfolio-experience-with-two-new-features | catalyst/possible price-move explanation and portfolio context |
| Alternative | Unusual Whales API | https://unusualwhales.com/public-api | endpoints/streaming/MCP for news, options and related data |
| Alternative | Quiver Quantitative | https://www.quiverquant.com/ | Congress, insider, contracts, lobbying, patents, alerts/backtests |
| Intelligence | Feedly AI Feeds | https://docs.feedly.com/article/699-guide-to-ai-feeds-market-intel | source bundles, AI models, Boolean queries, boards, automation |
| Intelligence | Feedly natural-language filters | https://feedly.com/new-features/posts/fine-tune-your-feedly-ai-feeds-with-natural-language-filters | numeric, directional and relationship filters |
| Intelligence | Inoreader | https://www.inoreader.com/pricing/feature/subscriptions | RSS/newsletter/social/web feeds, search, monitoring, push, API |
| Intelligence | Inoreader rules | https://us.inoreader.com/blog/2023/06/streamline-content-discovery-with-filters-and-rules.html | filtering, tagging and routing rules |
| Reader | Readwise Reader | https://readwise.io/read | unified reading, highlights, notes, search, TTS and exports |

## 6. Focused gap matrix

| Question | Evidence found | Confidence | Remaining gap | Decision effect |
|---|---|---|---|---|
| Do leading products personalize around holdings/watchlists? | Bloomberg/LSEG/FactSet/IBKR/Koyfin/Seeking Alpha/Yahoo official material | High | no paid-product usability test | Make watchlist a global context in P0 |
| Is story clustering a real differentiator? | LSEG duplicate clustering; WorldMonitor and alphai-tui code; many retail feeds omit it | High | no Signal Desk labeled pair set | Make stable clustering the P0 core and label data first |
| Should credibility equal priority? | WorldMonitor explicit separation; RavenPack independent metadata fields | High | source-tier policy needs finance-specific review | Store/display separate components |
| Can free RSS support true low latency? | trader products sell proprietary wire/audio; current Google News feed uncontrolled | High | no empirical latency test | Do not market Signal Desk as real time; log latency |
| Should AI summarize first? | AlphaSense/Fiscal/Bigdata tie output to sources; WorldMonitor bounds/fallbacks; weak OSS examples let model source facts | High | no citation-factuality benchmark | Defer AI until event/source contracts and labeled sample exist |
| What ingestion implementation is reusable? | Miniflux Apache reliability; mkt MIT bounded fetch; OpenBB/WorldMonitor/RSSHub AGPL concepts | High | target deployment/storage decision | Implement small adapter layer; consider attributed Miniflux patterns |
| Can full text be stored? | varies by vendor/source; RSSHub includes full-content scraping routes | Low/legal | per-source terms and license agreements | Metadata/link default; source-specific rights field required |
| What external notification channel wins? | products support many channels; no Titus usage evidence in this product | Medium | user decision and false-positive baseline | Product-internal digest first; external alerts P2 |
| Is sentiment useful? | RavenPack uses it as one factor; FinBERT/FinGPT offer classifiers; naive project averages it | Medium | no in-domain labels or downstream decision metric | Keep out of P0 ranking; benchmark later |
| Is team collaboration required? | FactSet/AlphaSense support it; original project context suggests small group but unconfirmed | Medium | user group not frozen | Keep schema multi-user-ready, defer team UI |
| What is the budget? | enterprise pricing often sales-led; no approved budget | Low | user decision | P0 uses public/native sources and local SQLite |
| Is global multi-asset scope required now? | many products cover it; current MVP is US tech watchlist | Low | product objective not frozen | Preserve extensible schema; keep P0 narrow |

## 7. Claim-to-source ledger

| Claim ID | Claim used in final report | Direct evidence | Boundary |
|---|---|---|---|
| C01 | Institutional products connect news to customizable workspaces and portfolios | Bloomberg product page; LSEG Workspace/Portfolio Manager; FactSet brochure; IBKR TWS | vendor-stated capabilities, not usability benchmark |
| C02 | Modern AI research products compete on cited multi-corpus retrieval | AlphaSense; Bigdata developer/MCP docs; Fiscal skills; Perplexity Finance | citation presence does not prove every generated claim is correct |
| C03 | Event intelligence separates relevance, novelty, event, sentiment and risk | RavenPack Edge/factors | proprietary scoring not observable |
| C04 | Low-latency trader news depends on wire/human/audio infrastructure | Benzinga Pro; Newsquawk; MT Newswires; TradeTheNews | no measured latency comparison |
| C05 | Retail workflow centers on watchlists, filters, chart/event context and alerts | Koyfin; TradingView; Seeking Alpha; Yahoo; Investing.com | feature availability may vary by plan/region |
| C06 | RSS/intelligence workflow centers on rules, mute, read/save and export | Feedly; Inoreader; Readwise; Miniflux; Folo | user value requires future usage study |
| C07 | Provider adapters should return a canonical schema | OpenBB files at recorded commit | AGPL source cannot be copied into MIT-only combined work without license consequences |
| C08 | URL/exact-title dedup is insufficient for evolving stories | WorldMonitor story-identity/dedup implementation and documentation | threshold must be retuned on finance sample |
| C09 | Stable cluster identity is required for lifecycle/read/alert continuity | WorldMonitor canonical adoption code; alphai-tui state model | implementation should be independently authored |
| C10 | Source health must persist failure streaks and expose stale/empty states | WorldMonitor validator; Miniflux parsing errors/schedule; Macro Dashboard UI | proposed P0 metric targets are not current results |
| C11 | Importance and credibility answer different questions | WorldMonitor credibility methodology; RavenPack metadata split | source-tier/propaganda schema needs finance-specific redesign |
| C12 | LLM prose must not create provenance fields | WorldMonitor methodology and deterministic fallback; Fiscal source links; weak Financial Daily counterexample | exact grounding test remains to be built |
| C13 | SEC filings can be a first-class free official source | SEC EDGAR API and Developer Resources | must follow current fair-access guidance and identify client |
| C14 | Sentiment alone cannot rank financial news | task scope of FinBERT/FinGPT plus broader fields in RavenPack | requires in-domain evaluation before any production use |
| C15 | Several high-star references are license-incompatible with casual MIT copying | actual repository LICENSE files for WorldMonitor, OpenBB, Glance, RSSHub, Folo and Fincept | this is an engineering risk statement, not legal advice |
| C16 | The next phase should focus on story triage before alerts/AI | synthesis of current MVP gaps plus C01–C15 | recommendation, not external fact |

## 8. Recommended evidence to collect before P1/P2

1. A hand-labeled set of at least 100 recent headlines with:
   - same-story pairs/clusters;
   - correct ticker/entity links;
   - material event type;
   - user decision: open, save, dismiss;
   - source/publisher family.
2. Seven days of source-run logs:
   - request start/end;
   - status/error class;
   - item count;
   - newest publication time;
   - cache hit/miss;
   - source latency;
   - last successful result.
3. A rights registry for every enabled source:
   - official feed/API URL;
   - permitted stored fields;
   - full-text permission;
   - redistribution permission;
   - retention rule;
   - required attribution;
   - last review date.
4. A decision log for the eight product questions in the user-facing report.

## 9. Acceptance state for this research

- 48 candidate products recorded: yes.
- Six required product families covered: yes.
- 17 open-source repositories inspected at fixed commits: yes.
- Current MVP compared against capability model: yes.
- Licensing and data-rights risks separated from technical desirability: yes.
- Recommended next phase and exclusions specified: yes.
- Commercial hands-on tests: no.
- Per-source legal review: no.
- Product code changed: no; research documents only.
- GitHub push: not performed in this research task.
