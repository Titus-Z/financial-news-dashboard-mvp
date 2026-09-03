# Signal Desk — Financial News Dashboard MVP

Signal Desk is a runnable minimum viable product for answering one question: **which recent US technology stories deserve attention first?**

It pulls public Google News RSS search feeds, extracts headline metadata, removes duplicate titles, maps stories to an 11-stock watchlist, classifies event type, and applies a transparent reading-priority heuristic. Every live headline keeps a link to its source.

![Status](https://img.shields.io/badge/status-MVP-c7f36b) ![Data](https://img.shields.io/badge/data-public%20RSS-48d7c4) ![License](https://img.shields.io/badge/license-MIT-80918e)

## MVP scope

- Live public RSS ingestion with an 8-second timeout
- Coverage for AAPL, MSFT, NVDA, AMD, GOOGL, META, AMZN, TSLA, AVGO, CRM, and ORCL
- Headline deduplication and entity matching
- Event labels: Earnings, Product, Regulation, M&A, Macro, and Market
- Priority or recency sorting, ticker filters, category filters, and text search
- Clearly labeled sample fallback when RSS is unavailable
- Responsive single-page interface

The MVP intentionally excludes article full-text scraping, paid feeds, database persistence, user accounts, alerts, LLM summaries, price prediction, and trading execution.

## Run locally

Requirements: Node.js 22.13 or later.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

For a production build:

```bash
npm run build
npm run start
```

No API key or environment variable is required.

## How priority works

The score combines four observable inputs:

1. Recency of the headline
2. Presence of high-impact event terms such as earnings, guidance, acquisition, regulation, or central-bank action
3. Number of watchlist companies matched
4. A small source-quality boost for selected established publishers

This heuristic only orders reading. It has not been validated as a return predictor and must not be interpreted as investment advice or a trading signal.

## Data boundary

- The application reads headline, publication time, publisher, and source link from public RSS results.
- Source sites own their articles. Signal Desk does not copy article bodies.
- Google News availability and result coverage are outside this project's control.
- Feed query results are a useful sample of recent coverage, not a mathematically complete set of all financial news.
- When all feeds fail, the UI switches to explicit demo data and says so on screen.

## Architecture

```text
Google News RSS (4 fixed queries)
              │
              ▼
        /api/news route
  parse → dedupe → classify → score
              │
              ▼
       React dashboard UI
 filter → sort → open original source
```

Built with Next.js-compatible Vinext, React, TypeScript, and Tailwind CSS.

## Next evidence-driven step

Before adding AI summaries or alerts, measure feed coverage, duplicate rate, entity-match precision, refresh reliability, and whether users consistently act on the top-ranked stories.

## License

[MIT](LICENSE)
