# Changelog

## 0.2.0 — 2026-09-03

### Added

- Persistent Cloudflare D1 schema for sources, ingestion runs, events, story clusters, cluster membership, and user workflow state.
- Typed provider registry with Google News RSS and SEC EDGAR Atom adapters.
- Conditional fetch metadata, source cadence, timeouts, retry-after state, failure streaks, and last-good behavior.
- Stable lexical story clustering with entity, event-type, and numeric safeguards.
- Separate relevance, importance, credibility, and freshness scores with plain-language ranking reasons.
- My Watchlist, Market, and Trending views; grouped-story and raw-wire modes.
- Read, unread, save, dismiss, and restore actions persisted through the API.
- Evidence detail pane, source-health strip, explicit live/cached/partial/sample states, responsive layout, and social preview metadata.
- Product landscape, 48-item inventory, fixed-commit code audit, release contract, and schema migration documentation.

### Changed

- Replaced the stateless headline response with a persistent story-inbox API contract.
- Reframed the public project from a minimal RSS dashboard to an evidence-first financial-news research system.

### Preserved boundaries

- No article-body scraping, LLM summary, return prediction, recommendation, alert delivery, brokerage connection, or automated trading.
