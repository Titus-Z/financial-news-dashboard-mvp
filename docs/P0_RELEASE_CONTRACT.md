# Signal Desk v0.2.0 — P0 release contract

Status: release candidate

Date: 2026-09-03

## Product outcome

Turn a noisy stream of public financial headlines into a persistent, auditable story inbox for an 11-company US technology watchlist.

The user must be able to answer five questions from one workspace:

1. Which independent stories matter now?
2. Why is each story ranked where it is?
3. Which independent publisher families corroborate it?
4. When was it published, ingested, and last updated?
5. Have I read, saved, or dismissed it?

## Included scope

- Typed source registry with ownership and rights notes.
- Provider contract with Google News RSS and SEC EDGAR Atom implementations.
- Conditional requests, polling cadence, timeouts, source-level failures, retry-after state, and last-good persistence.
- Canonical event records with published and ingested timestamps.
- Stable story identities and lexical cross-source clustering.
- Watchlist entity matching and material event classification.
- Separate relevance, importance, credibility, and freshness fields with readable ranking reasons.
- `My Watchlist`, `Market`, and `Trending` views.
- Cluster and wire modes plus a persistent story detail pane.
- Read, unread, saved, and dismissed workflow state.
- Source health and ingestion-run history.
- Explicit sample mode only when no persisted live records are available.

## Excluded scope

- Article-body scraping or paywall bypass.
- Claims of complete financial-news coverage or wire-speed latency.
- LLM summaries, sentiment-led ranking, predictions, recommendations, BUY/SELL labels, and trading execution.
- External email, mobile, webhook, or WeChat alerts.
- Authentication, team permissions, and brokerage synchronization.

## Data and schema decision

Cloudflare D1 is the durable source of truth for sources, ingestion runs, canonical events, story clusters, cluster membership, and user workflow state. The local Vinext development runtime uses its project-local D1 state. No browser storage is authoritative.

The UI receives a read model from `/api/news`; mutations go through `/api/state`. Source configuration remains code-reviewed TypeScript and is synchronized into D1.

## Compatibility decision

- Existing `/api/news` consumers are intentionally replaced by the v0.2.0 story response contract.
- The application remains a single-page Vinext/React site.
- No secrets are required. The SEC request identifies this public repository as the client.
- Existing public RSS metadata and source links remain the only article content stored.

## Acceptance stories

- One provider can fail while persisted stories and other providers remain visible.
- Similar headlines from different publisher families appear as one story with multiple evidence rows.
- A story keeps the same cluster identity across refreshes.
- Every displayed story exposes component scores and ranking reasons.
- Read/save/dismiss actions survive reloads through D1.
- Source failures, empty results, backoff, and stale data are visible.
- Demo data is visibly labeled and cannot be confused with live reporting.
- The application compiles for its production target before the GitHub push.

## Release evidence

- Production build completed on 2026-09-03.
- The root route and core API returned HTTP 200.
- A save → reload → unsave round trip confirmed D1-backed workflow persistence.
- Repository status is reviewed before commit.
- The pushed `main` revision is verified against the remote.

No broader browser QA, lint suite, vendor coverage benchmark, or paid-product test was run for this release.

## Rollback

The pre-P0 revision is `849cb7f`. Reverting the P0 commit restores the earlier stateless RSS MVP. D1 tables are additive and can remain unused after a code rollback; no destructive migration is required.
