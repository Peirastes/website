# Project Overview Document (POD)

**Project Title:** SPECTRUM Market Intelligence Dashboard
**Date:** February 6, 2026 | **Version:** 1.0
**Lead:** Cole Prather

---

## 1. Purpose

### What is this project?
A multi-dimensional market intelligence dashboard that monitors 54 stocks and 8 cryptocurrencies across five analytical dimensions: Fundamentals, Technicals, Valuation, Momentum, and Analyst sentiment. SPECTRUM fetches real-time price data, computes technical indicators client-side (RSI, MACD, Bollinger Bands, SMA alignment), normalizes all metrics to 0-100 scores, and presents actionable per-ticker intel briefs with thesis, catalyst, risk, and watchlist items.

### Why does it matter?
Free market dashboards typically offer either raw data (Yahoo Finance) or opinionated ratings without methodology transparency. SPECTRUM combines real fundamental data from yfinance with client-computed technical analysis into a unified scoring framework. Every score is derived from a visible, auditable formula. The per-ticker intel briefs provide curated analyst-level context that connects the quantitative scores to real-world catalysts and risks.

### What is the driving question?
How can real-time market data be structured into a multi-dimensional scoring system that provides actionable investment intelligence without relying on paid data feeds or opaque proprietary models?

---

## 2. Objectives & Goals

### Primary Objective
Deliver a self-hosted market monitoring dashboard with real-time data, computed technical indicators, multi-dimensional scoring, and curated analyst intelligence for a personal portfolio of 62 assets.

### Supporting Goals
1. **Replace synthetic scores with real data** — all five dimensions computed from verifiable sources
2. **Compute technical indicators client-side** — RSI, MACD, Bollinger Bands, SMA alignment, volume trends from 5-year price history
3. **Normalize all metrics to 0-100** — with inverted scoring where lower values are better (debt-to-equity, P/E)
4. **Provide per-ticker intel briefs** — thesis, recent catalyst, key risk, and items to watch for all 62 assets
5. **Automate daily data updates** — scheduled pipeline with git commit/push and 5-minute dashboard refresh
6. **Support portfolio categorization** — Stakes (owned positions) vs. Watchlist with favorites, search, and sort

---

## 3. Value & Novelty

| Dimension | Description |
|-----------|-------------|
| **Novelty** | Five-dimension scoring model (Fundamentals, Technicals, Valuation, Momentum, Analyst) where all scores are computed from auditable formulas rather than proprietary black-box ratings. Dual display of normalized score (color-coded bar) and raw value (human-readable) for every metric. |
| **Utility** | Unified view of 54 stocks and 8 cryptos with automated daily updates. Per-ticker intel briefs with thesis/risk/catalyst analysis. Auto-refresh every 5 minutes for prices, 4 hours for intel. Search, sort, favorites, collapsible sections. |
| **Gap Addressed** | Free alternatives lack multi-dimensional scoring. Paid alternatives (Bloomberg, FactSet) are prohibitively expensive for personal use. SPECTRUM provides comparable analytical depth using free APIs (yfinance, CoinGecko) with full methodology transparency. |

---

## 4. Scope & Boundaries

### In Scope
- Real-time stock data via yfinance (54 tickers: tech, semis, quantum, space, EV, fintech, biotech, retail, REIT, crypto)
- Real-time cryptocurrency data via CoinGecko (8 coins: BTC, ETH, SOL, XRP, ADA, DOGE, AVAX, LINK)
- Five-dimension scoring: Fundamentals (6 metrics), Technicals (6 metrics), Valuation (6 metrics), Momentum (6 metrics), Analyst (5 metrics)
- Client-side technical indicators: RSI-14, MACD (12/26/9), Bollinger Position, SMA alignment (20/50/200), volume trend
- Per-ticker intel briefs (thesis, recent, risk, watch) — externalized to editable JSON
- 5-year price history with interactive range selector (1W, 1M, 3M, ALL)
- Radar chart visualization of dimension scores
- Composite score with letter grade (A+ through D)
- Portfolio management: Stakes, Watchlist, Favorites, Search, Sort
- Automated daily pipeline with git commit/push
- Scheduled updates via Windows Task Scheduler

### Out of Scope
- Real-time streaming (5-minute refresh via polling)
- Options data or derivatives pricing
- Portfolio P&L tracking or trade execution
- LLM-generated intel briefs (manual curation for now)
- Mobile native app (responsive web sufficient)
- Multi-user support or authentication

### Key Assumptions
1. Yahoo Finance (yfinance) remains freely accessible
2. CoinGecko free tier provides sufficient crypto data
3. Intel briefs are manually curated and updated periodically
4. User understands financial terminology (P/E, RSI, MACD, etc.)

---

## 5. Current Status

### Phase
Active Development / Operational

### Progress Summary
SPECTRUM is **fully operational** with real data flowing through all five scoring dimensions. The data pipeline runs daily, fetching 54 stocks and 8 cryptos in ~54 seconds. All technical indicators are computed client-side from 5-year price history. Intel briefs are populated for all 62 assets. The dashboard auto-refreshes every 5 minutes for prices and every 4 hours for intel. Recent work (Feb 5-6, 2026) replaced the entire synthetic scoring system with real computed scores and added curated analyst intelligence.

### Key Achievements
- All 5 scoring dimensions populated with real data (not synthetic)
- 29 individual metrics computed per stock (fewer for crypto)
- 6 technical indicators computed client-side from price history
- 62 curated intel briefs with thesis/recent/risk/watch
- Intel externalized to JSON for editing without rebuild
- Daily automated pipeline (54 stocks + 8 crypto in ~54 seconds)
- 5-year price history with range selector
- Search, sort, favorites, responsive layout

### Open Items
- Intel briefs require manual updates (no LLM auto-generation yet)
- CoinGecko market_chart endpoint requires API key; crypto has 7-day sparkline only
- Some stocks (CRWV — CoreWeave, newly IPO'd) may have limited data availability
- Vite timestamp files accumulating in project root (cosmetic)

---

## 6. Path Forward

### Near-Term Priorities (Next 1-3 Months)

#### Phase 1: Data Quality & Reliability (Feb-Mar 2026)
- **Effort:** 5 hours
- **Deliverable:** Validated scoring accuracy across all 62 assets
- **Key Action:** Audit normalization ranges; verify edge cases (negative P/E, extreme debt ratios)
- **Success:** No anomalous scores; all metrics display meaningful values

#### Phase 2: Intel Brief Automation (Mar-Apr 2026)
- **Effort:** 10-15 hours
- **Deliverable:** Semi-automated intel brief generation
- **Options:** Claude API for brief generation, or RSS/news aggregation pipeline
- **Success:** Intel briefs refreshed weekly with minimal manual effort

#### Phase 3: Enhanced Crypto Coverage (Apr-May 2026)
- **Effort:** 5-10 hours
- **Deliverable:** Extended crypto history and on-chain metrics
- **Key Action:** Evaluate CoinGecko paid tier or alternative APIs
- **Success:** Crypto assets have 1-year+ price history; additional metrics (TVL, active addresses)

#### Phase 4: Alerting & Notifications (May-Jun 2026)
- **Effort:** 10 hours
- **Deliverable:** Score change alerts (email/webhook)
- **Key Action:** Track composite score deltas; alert on significant moves
- **Success:** Daily digest of score changes > 5 points

### Success Criteria
- All 62 assets showing real data (0 synthetic fallbacks during market hours)
- Composite scores accurately reflect multi-dimensional analysis
- Pipeline runs successfully > 95% of scheduled executions
- Intel briefs refreshed at least monthly
- Dashboard loads in < 3 seconds

### Risks & Considerations

| Risk | Impact | Notes |
|------|--------|-------|
| yfinance rate limiting or API changes | High | Core dependency; no paid alternative configured. Monitor for deprecation. |
| CoinGecko free tier limitations | Medium | Market chart requires API key; sparkline limited to 7 days. |
| Intel brief staleness | Medium | Manual curation doesn't scale; briefs become outdated within weeks. |
| Normalization range miscalibration | Low | Extreme values (negative margins, massive P/E) may skew scores. |

---

## 7. Resources & Context

### Key Resources
- **Frontend:** React 18, Recharts, Vite build system
- **Backend:** Python 3.8+ (yfinance, pandas, requests)
- **Hosting:** Static files (GitHub Pages via Dropbox sync)
- **Data Sources:** Yahoo Finance (stocks), CoinGecko (crypto)
- **Automation:** Windows Task Scheduler, git auto-push

### Dependencies
- Internet connectivity for API data fetching
- Node.js for Vite build (development only)
- Python 3.8+ with yfinance, pandas, requests
- Git for automated commit/push

### Architecture

#### Data Pipeline (Daily Execution)
```
RUN_MARKET_UPDATE.bat
    |
    v
run_market_update.py (wrapper)
    |-- Logging setup (per-run log file)
    |-- generate_market_data.py
    |   |-- yfinance: 54 stocks (batch + individual fallback)
    |   |-- CoinGecko: 8 cryptos (markets + sparkline)
    |   |-- Output: assets/market_data.json + dist/market_data.json
    |   |-- Copy: intel_briefs.json -> dist/
    |   |-- Status: assets/last_update_status.json
    |-- git add + commit + push (auto)
    |-- Log cleanup (7-day retention)
```

#### Frontend Architecture
```
src/App.jsx (2,385 lines — single-file React app)
    |
    |-- ASSETS registry (62 tickers with metadata)
    |-- INTEL_FALLBACK (inline brief data)
    |-- Technical Indicators (RSI, MACD, Bollinger, SMA, Volume, Momentum)
    |-- Normalization Layer (0-100 scoring with inversion support)
    |-- mergeWithAsset() (combines live data + computed scores)
    |-- Components:
    |   |-- SpectrumDashboard (main state + layout)
    |   |-- TickerCard (sidebar cards with expand/collapse intel)
    |   |-- DetailPanel (tabbed analysis view)
    |   |-- OverviewTab (radar chart, key metrics, price history)
    |   |-- MetricsTab (dimension breakdown with raw values)
    |   |-- ScoreRing (circular score indicator with tooltip)
    |   |-- ScoreTooltip (intel brief + dimension bars)
    |   |-- MetricBar (score bar + raw value display)
    |-- Data Loading (fetch with synthetic fallback)
    |-- Auto-refresh (5 min prices, 4 hour intel)
```

#### File Organization
```
projects/market-analytics-dashboard/
    |-- src/App.jsx                     React application (2,385 lines)
    |-- index.html                      Dev entry point
    |-- vite.config.ts                  Build configuration
    |-- package.json                    Dependencies
    |
    |-- scripts/
    |   |-- generate_market_data.py     Data pipeline (514 lines)
    |   |-- run_market_update.py        Wrapper with logging + git push
    |
    |-- assets/
    |   |-- market_data.json            Live market data (~15MB)
    |   |-- intel_briefs.json           Curated analyst briefs
    |   |-- last_update_status.json     Pipeline run status
    |
    |-- dist/                           Production build
    |   |-- index.html                  Entry point
    |   |-- assets/index-*.js           Bundled app (~646KB)
    |   |-- market_data.json            Data (copied from assets)
    |   |-- intel_briefs.json           Intel (copied from assets)
    |
    |-- logs/                           Pipeline execution logs
    |-- RUN_MARKET_UPDATE.bat           Manual/scheduled trigger
    |-- SETUP_SCHEDULED_UPDATES.bat     Task Scheduler setup
    |-- DATA_PIPELINE.md                Pipeline documentation
```

---

## Technology Stack

### Frontend
- **Framework:** React 18 with JSX
- **Charts:** Recharts (radar, area, line, bar, composed)
- **Build:** Vite 5 with esbuild minification
- **Styling:** Inline CSS (dark theme — `#06080e` background)
- **Fonts:** Space Grotesk (UI) + JetBrains Mono (data)

### Backend
- **Language:** Python 3.8+
- **Stock Data:** yfinance (Yahoo Finance wrapper)
- **Crypto Data:** CoinGecko free API
- **Libraries:** pandas, requests, json, pathlib
- **Output:** JSON (no database)

### Automation
- **Scheduler:** Windows Task Scheduler
- **Version Control:** Git auto-commit/push on each run
- **Logging:** Per-run log files with 7-day retention

---

## Scoring Model

### Five Dimensions (29 metrics total for stocks)

**Fundamentals (6 metrics):**
- Profit Margin (range: -50% to 50%)
- Revenue Growth (range: -30% to 50%)
- Debt to Equity (range: 0-300, inverted)
- Return on Equity (range: -30% to 50%)
- Earnings Growth (range: -50% to 100%)
- Free Cash Flow (range: -$5B to $50B)

**Technicals (6 metrics):**
- RSI-14 (scored by distance from 50 — overbought/oversold penalized)
- MACD Signal (12/26/9 histogram direction)
- Bollinger Band Position (0-100, position within bands)
- Volume Trend (20-day recent vs. prior ratio)
- SMA Alignment (20/50/200 ordering)
- Trend Strength (50-day price change direction)

**Valuation (6 metrics):**
- P/E Ratio (range: 0-60, inverted)
- Price to Book (range: 0-20, inverted)
- Dividend Yield (range: 0-8%)
- 52-Week Position (% of range)
- Analyst Target Upside (range: -50% to +100%)
- PEG Ratio (range: 0-5, inverted)

**Momentum (6 metrics):**
- Return: 1W, 1M, 3M, 6M, 1Y (range: -30% to +50%)
- Trend Consistency (% of up days in 90-day window)

**Analyst (5 metrics):**
- Consensus Recommendation (strong buy=95, sell=20)
- Target Price Upside
- Analyst Coverage (range: 0-40 analysts)
- Short Interest (range: 0-10 days, inverted)
- Institutional Ownership (range: 0-100%)

**Crypto gets only Technicals + Momentum** (Fundamentals, Valuation, Analyst = N/A).

### Composite Score
Arithmetic mean of available dimension averages. Graded: A+ (>80), A (>70), B+ (>60), B (>50), C (>40), D (<=40).

---

## Feature Inventory

### Data & Analysis
- Real-time stock prices (54 tickers via yfinance)
- Real-time crypto prices (8 coins via CoinGecko)
- 5-year daily price history (stocks)
- 6 client-computed technical indicators
- 29-metric normalized scoring model
- Composite score with letter grades
- Data-driven briefing line per asset
- 62 curated intel briefs (thesis/recent/risk/watch)

### User Interface
- Dark theme responsive dashboard
- Split-panel layout (ticker sidebar + detail panel)
- Collapsible section groups (Stakes, Watchlist, Crypto)
- Expandable ticker cards with inline intel
- Tabbed detail view (Overview, Fundamentals, Technicals, Valuation, Momentum, Analyst)
- Radar chart (5-dimension visualization)
- Interactive price history with range selector (1W/1M/3M/ALL)
- Metric bars with raw value display
- Score ring with hover tooltip
- Search, sort, favorites
- Compact mode for narrow screens

### Operations
- Automated daily data pipeline
- Git auto-commit/push after each update
- 5-minute auto-refresh for prices
- 4-hour auto-refresh for intel briefs
- Per-run logging with 7-day retention
- Status tracking (last_update_status.json)
- Synthetic data fallback when APIs unavailable

---

## Commit History (34 commits)

| Date | Milestone |
|------|-----------|
| Feb 5, 2026 | Project created; initial dashboard with split-panel layout |
| Feb 5-6 | Stakes/watchlist, real data pipeline, logos, search/sort, auto-refresh |
| Feb 6 | Responsive layout, favorites, price history range selector, 5-year history |
| Feb 6 | **Replace synthetic scoring with real data** (5 dimensions, 29 metrics) |
| Feb 6 | Score tooltip, per-ticker intel briefs, external intel JSON |
| Feb 6 | Move intel to TickerCard dropdown (current state) |

---

*Revision History:*

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-02-06 | Cole Prather | Initial POD — project operational with real scoring |

---

**End of Project Overview Document**
