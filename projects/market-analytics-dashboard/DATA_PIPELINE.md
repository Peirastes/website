# SPECTRUM Market Analytics - Data Pipeline

## Overview

SPECTRUM fetches real-time market data from free APIs:
- **Stocks**: Yahoo Finance via `yfinance` library
- **Crypto**: CoinGecko public API (no key required)

Data is saved to `assets/market_data.json` and loaded by the dashboard.

## Quick Start

### Manual Update
Double-click `RUN_MARKET_UPDATE.bat` to fetch fresh market data.

### Automatic Scheduled Updates
1. Right-click `SETUP_SCHEDULED_UPDATES.bat`
2. Select "Run as administrator"
3. Tasks will be created to update data automatically

## Schedule

The automatic schedule runs:
- **Hourly**: Every hour from 6 AM to 8 PM on weekdays
- **End of Day**: 6 PM on weekdays for closing prices

This covers US market hours (9:30 AM - 4:00 PM ET) plus pre/post market.

## Files

```
market-analytics-dashboard/
├── scripts/
│   ├── generate_market_data.py   # Main data fetcher
│   └── run_market_update.py      # Wrapper with logging
├── assets/
│   ├── market_data.json          # Live market data (auto-generated)
│   └── last_update_status.json   # Update status
├── logs/
│   └── market_update_*.log       # Execution logs (7-day retention)
├── RUN_MARKET_UPDATE.bat         # Manual update script
├── SETUP_SCHEDULED_UPDATES.bat   # Task Scheduler setup (run as admin)
└── DATA_PIPELINE.md              # This file
```

## Data Sources

### Stocks (54 tickers)
- Tech Giants: AAPL, MSFT, GOOGL, META, AMZN
- Semiconductors: NVDA, AMD, INTC, AVGO, MU, MCHP, ASML
- AI/Tech: PLTR, SMCI, CRWV
- Quantum: RGTI, QBTS, IONQ
- Space/Defense: RKLB, ASTS, KTOS, LMT, GE
- EV/Energy: TSLA, QS, ARRY, RIVN, LCID
- And more...

### Crypto (8 coins)
- BTC, ETH, SOL, XRP, ADA, DOGE, AVAX, LINK

## Troubleshooting

### "Simulated" showing instead of "Live Data"
- Run `RUN_MARKET_UPDATE.bat` to fetch fresh data
- Check `logs/` folder for error details
- Ensure Python and dependencies are installed

### Missing dependencies
```bash
pip install yfinance pandas requests
```

### Task Scheduler issues
1. Open Task Scheduler (taskschd.msc)
2. Look for tasks starting with "SPECTRUM_"
3. Check "History" tab for errors
4. Ensure the batch file path is correct

### API Rate Limits
- Yahoo Finance: Generally unlimited for reasonable use
- CoinGecko: 10-50 calls/minute on free tier (we use 1 call)

## Adding New Tickers

Edit `scripts/generate_market_data.py`:

```python
STOCKS = {
    # Add new stock
    "TICKER": {"name": "Company Name", "sector": "Sector"},
    ...
}

CRYPTO = {
    # Add new crypto (use CoinGecko ID)
    "SYMBOL": {"name": "Coin Name", "coingecko_id": "coingecko-id"},
    ...
}
```

Then update `src/App.jsx` to add the ticker to `ASSETS` and `stakes`/`watchlist`.

## Logs

Logs are kept for 7 days and auto-cleaned. View recent logs:
```
logs/market_update_YYYYMMDD_HHMMSS.log
```

Status file shows last run info:
```json
// logs/last_run_status.json
{
  "lastRun": "2026-02-05T23:12:15+00:00",
  "duration": 24.4,
  "success": true,
  "marketHours": true
}
```
