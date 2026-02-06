#!/usr/bin/env python3
"""
SPECTRUM Market Analytics Data Generator
Fetches real-time stock and cryptocurrency data from free APIs.

Data Sources:
- Stocks: Yahoo Finance via yfinance
- Crypto: CoinGecko API (free, no key required)

Output: JSON files in ../assets/ for dashboard consumption
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)-8s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

# ═══════════════════════════════════════════════════════════════════════════════
# ASSET DEFINITIONS
# ═══════════════════════════════════════════════════════════════════════════════

STOCKS = {
    # Tech Giants
    "AAPL": {"name": "Apple Inc.", "sector": "Technology"},
    "MSFT": {"name": "Microsoft Corp.", "sector": "Technology"},
    "GOOGL": {"name": "Alphabet Inc.", "sector": "Technology"},
    "META": {"name": "Meta Platforms", "sector": "Technology"},
    "AMZN": {"name": "Amazon.com Inc.", "sector": "E-Commerce / Cloud"},

    # AI & Semiconductors
    "NVDA": {"name": "NVIDIA Corp.", "sector": "Semiconductors"},
    "AMD": {"name": "Advanced Micro Devices", "sector": "Semiconductors"},
    "INTC": {"name": "Intel Corp.", "sector": "Semiconductors"},
    "AVGO": {"name": "Broadcom Inc.", "sector": "Semiconductors"},
    "TSM": {"name": "Taiwan Semiconductor", "sector": "Semiconductors"},
    "MU": {"name": "Micron Technology", "sector": "Semiconductors"},
    "MCHP": {"name": "Microchip Technology", "sector": "Semiconductors"},
    "ASML": {"name": "ASML Holding", "sector": "Semiconductors"},
    "PLTR": {"name": "Palantir Technologies", "sector": "AI / Government Tech"},
    "SMCI": {"name": "Super Micro Computer", "sector": "AI Infrastructure"},

    # Quantum Computing
    "RGTI": {"name": "Rigetti Computing", "sector": "Quantum Computing"},
    "QBTS": {"name": "D-Wave Quantum", "sector": "Quantum Computing"},
    "IONQ": {"name": "IonQ Inc.", "sector": "Quantum Computing"},

    # Space & Aerospace & Defense
    "RKLB": {"name": "Rocket Lab USA", "sector": "Aerospace / Launch"},
    "ASTS": {"name": "AST SpaceMobile", "sector": "Satellite / Telecom"},
    "LUNR": {"name": "Intuitive Machines", "sector": "Lunar / Space"},
    "RDW": {"name": "Redwire Corp.", "sector": "Space Infrastructure"},
    "KTOS": {"name": "Kratos Defense & Security", "sector": "Defense / Drones"},
    "LMT": {"name": "Lockheed Martin", "sector": "Defense / Aerospace"},
    "GE": {"name": "GE Aerospace", "sector": "Aerospace / Industrial"},

    # EV & Energy
    "TSLA": {"name": "Tesla Inc.", "sector": "EV / Energy"},
    "RIVN": {"name": "Rivian Automotive", "sector": "EV"},
    "LCID": {"name": "Lucid Group", "sector": "EV"},
    "QS": {"name": "QuantumScape", "sector": "EV Battery Tech"},
    "ARRY": {"name": "Array Technologies", "sector": "Clean Energy"},
    "ENPH": {"name": "Enphase Energy", "sector": "Solar"},

    # Fintech & Finance
    "SQ": {"name": "Block Inc.", "sector": "Fintech"},
    "COIN": {"name": "Coinbase Global", "sector": "Crypto Exchange"},
    "HOOD": {"name": "Robinhood Markets", "sector": "Fintech"},
    "SOFI": {"name": "SoFi Technologies", "sector": "Fintech"},

    # Biotech & Healthcare
    "MRNA": {"name": "Moderna Inc.", "sector": "Biotech"},
    "CRSP": {"name": "CRISPR Therapeutics", "sector": "Gene Editing"},

    # Other Growth
    "NET": {"name": "Cloudflare Inc.", "sector": "Cybersecurity / CDN"},
    "SNOW": {"name": "Snowflake Inc.", "sector": "Cloud Data"},
    "DDOG": {"name": "Datadog Inc.", "sector": "Cloud Monitoring"},

    # Entertainment & Consumer
    "DIS": {"name": "Walt Disney Co.", "sector": "Entertainment"},
    "SPOT": {"name": "Spotify Technology", "sector": "Streaming / Music"},
    "CHWY": {"name": "Chewy Inc.", "sector": "E-Commerce / Pets"},
    "AMC": {"name": "AMC Entertainment", "sector": "Entertainment / Cinema"},
    "DJT": {"name": "Trump Media & Technology", "sector": "Social Media"},

    # Retail & Restaurants
    "AEO": {"name": "American Eagle Outfitters", "sector": "Retail / Apparel"},
    "GME": {"name": "GameStop Corp.", "sector": "Retail / Gaming"},
    "CBRL": {"name": "Cracker Barrel", "sector": "Restaurant"},
    "CAVA": {"name": "Cava Group", "sector": "Restaurant"},
    "TSCO": {"name": "Tractor Supply Co.", "sector": "Retail"},
    "LULU": {"name": "Lululemon Athletica", "sector": "Retail / Apparel"},

    # Real Estate & Industrial
    "MPW": {"name": "Medical Properties Trust", "sector": "REIT / Healthcare"},
    "COMP": {"name": "Compass Inc.", "sector": "Real Estate Tech"},
    "LEG": {"name": "Leggett & Platt", "sector": "Manufacturing"},
}

# CoinGecko IDs for crypto
CRYPTO = {
    "BTC": {"name": "Bitcoin", "coingecko_id": "bitcoin"},
    "ETH": {"name": "Ethereum", "coingecko_id": "ethereum"},
    "SOL": {"name": "Solana", "coingecko_id": "solana"},
    "XRP": {"name": "XRP", "coingecko_id": "ripple"},
    "ADA": {"name": "Cardano", "coingecko_id": "cardano"},
    "DOGE": {"name": "Dogecoin", "coingecko_id": "dogecoin"},
    "AVAX": {"name": "Avalanche", "coingecko_id": "avalanche-2"},
    "LINK": {"name": "Chainlink", "coingecko_id": "chainlink"},
}

# ═══════════════════════════════════════════════════════════════════════════════
# DATA FETCHERS
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_stock_data(tickers: List[str]) -> Dict[str, Any]:
    """Fetch stock data using yfinance."""
    try:
        import yfinance as yf
    except ImportError:
        logger.error("yfinance not installed. Run: pip install yfinance")
        return {}

    results = {}
    logger.info(f"Fetching data for {len(tickers)} stocks...")

    # Batch download for efficiency
    try:
        # Get current quotes
        tickers_str = " ".join(tickers)
        data = yf.download(tickers_str, period="1d", interval="1m", progress=False, group_by='ticker')

        # Get historical data for charts (5 years)
        hist_data = yf.download(tickers_str, period="5y", interval="1d", progress=False, group_by='ticker')

        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                info = stock.info

                # Get latest price
                if len(tickers) == 1:
                    current_data = data
                    historical = hist_data
                else:
                    current_data = data[ticker] if ticker in data.columns.get_level_values(0) else None
                    historical = hist_data[ticker] if ticker in hist_data.columns.get_level_values(0) else None

                if current_data is not None and not current_data.empty:
                    latest = current_data.iloc[-1]
                    price = float(latest['Close'])
                else:
                    price = info.get('regularMarketPrice') or info.get('currentPrice') or 0

                prev_close = info.get('previousClose') or info.get('regularMarketPreviousClose') or price
                change_pct = ((price - prev_close) / prev_close * 100) if prev_close else 0

                # Build price history
                price_history = []
                if historical is not None and not historical.empty:
                    for idx, row in historical.iterrows():
                        price_history.append({
                            "date": idx.strftime("%Y-%m-%d"),
                            "price": round(float(row['Close']), 2),
                            "volume": int(row['Volume']) if not pd.isna(row['Volume']) else 0,
                        })

                results[ticker] = {
                    "ticker": ticker,
                    "price": round(price, 2),
                    "changePercent": round(change_pct, 2),
                    "previousClose": round(prev_close, 2),
                    "open": round(info.get('open') or info.get('regularMarketOpen') or price, 2),
                    "dayHigh": round(info.get('dayHigh') or info.get('regularMarketDayHigh') or price, 2),
                    "dayLow": round(info.get('dayLow') or info.get('regularMarketDayLow') or price, 2),
                    "volume": info.get('volume') or info.get('regularMarketVolume') or 0,
                    "avgVolume": info.get('averageVolume') or 0,
                    "marketCap": info.get('marketCap') or 0,
                    "peRatio": info.get('trailingPE') or info.get('forwardPE'),
                    "eps": info.get('trailingEps'),
                    "beta": info.get('beta'),
                    "fiftyTwoWeekHigh": info.get('fiftyTwoWeekHigh'),
                    "fiftyTwoWeekLow": info.get('fiftyTwoWeekLow'),
                    "dividendYield": info.get('dividendYield'),
                    "priceHistory": price_history,
                    "lastUpdated": datetime.now(timezone.utc).isoformat(),
                }
                logger.info(f"  {ticker}: ${price:.2f} ({change_pct:+.2f}%)")

            except Exception as e:
                logger.warning(f"  {ticker}: Failed - {e}")
                results[ticker] = {"ticker": ticker, "error": str(e)}

    except Exception as e:
        logger.error(f"Batch download failed: {e}")
        # Fallback to individual fetches
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(period="5y")
                info = stock.info

                if not hist.empty:
                    price = float(hist['Close'].iloc[-1])
                    prev_close = info.get('previousClose') or float(hist['Close'].iloc[-2]) if len(hist) > 1 else price
                else:
                    price = info.get('regularMarketPrice') or 0
                    prev_close = info.get('previousClose') or price

                change_pct = ((price - prev_close) / prev_close * 100) if prev_close else 0

                price_history = []
                for idx, row in hist.iterrows():
                    price_history.append({
                        "date": idx.strftime("%Y-%m-%d"),
                        "price": round(float(row['Close']), 2),
                        "volume": int(row['Volume']),
                    })

                results[ticker] = {
                    "ticker": ticker,
                    "price": round(price, 2),
                    "changePercent": round(change_pct, 2),
                    "previousClose": round(prev_close, 2),
                    "marketCap": info.get('marketCap') or 0,
                    "volume": info.get('volume') or 0,
                    "priceHistory": price_history,
                    "lastUpdated": datetime.now(timezone.utc).isoformat(),
                }
                logger.info(f"  {ticker}: ${price:.2f} ({change_pct:+.2f}%)")
                time.sleep(0.2)  # Rate limiting

            except Exception as e:
                logger.warning(f"  {ticker}: Failed - {e}")
                results[ticker] = {"ticker": ticker, "error": str(e)}

    return results


def fetch_crypto_data() -> Dict[str, Any]:
    """Fetch cryptocurrency data from CoinGecko."""
    import requests

    results = {}
    logger.info(f"Fetching data for {len(CRYPTO)} cryptocurrencies...")

    try:
        # Get all coins in one request
        ids = ",".join([c["coingecko_id"] for c in CRYPTO.values()])
        url = f"https://api.coingecko.com/api/v3/coins/markets"
        params = {
            "vs_currency": "usd",
            "ids": ids,
            "order": "market_cap_desc",
            "sparkline": "true",
            "price_change_percentage": "24h,7d"
        }

        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        coins = resp.json()

        # Map back to our tickers
        id_to_ticker = {v["coingecko_id"]: k for k, v in CRYPTO.items()}

        for coin in coins:
            ticker = id_to_ticker.get(coin["id"])
            if not ticker:
                continue

            price = coin.get("current_price") or 0
            change_pct = coin.get("price_change_percentage_24h") or 0

            results[ticker] = {
                "ticker": ticker,
                "price": round(price, 2),
                "changePercent": round(change_pct, 2),
                "marketCap": coin.get("market_cap") or 0,
                "volume": coin.get("total_volume") or 0,
                "circulatingSupply": coin.get("circulating_supply"),
                "totalSupply": coin.get("total_supply"),
                "ath": coin.get("ath"),
                "athDate": coin.get("ath_date"),
                "priceHistory": [],
                "lastUpdated": datetime.now(timezone.utc).isoformat(),
            }
            logger.info(f"  {ticker}: ${price:,.2f} ({change_pct:+.2f}%)")

        # Fetch long-term price history per coin (5 years daily)
        for ticker, config in CRYPTO.items():
            if ticker not in results or "error" in results[ticker]:
                continue
            try:
                coin_id = config["coingecko_id"]
                chart_url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
                chart_resp = requests.get(chart_url, params={"vs_currency": "usd", "days": 1825}, timeout=30)
                chart_resp.raise_for_status()
                chart_data = chart_resp.json()

                price_history = []
                seen_dates = set()
                for ts, p in chart_data.get("prices", []):
                    day = datetime.fromtimestamp(ts / 1000).strftime("%Y-%m-%d")
                    if day not in seen_dates:
                        seen_dates.add(day)
                        price_history.append({"date": day, "price": round(p, 2)})

                results[ticker]["priceHistory"] = price_history
                logger.info(f"  {ticker}: fetched {len(price_history)} days of history")
                time.sleep(1.5)  # CoinGecko rate limit (free tier)
            except Exception as e:
                logger.warning(f"  {ticker}: history fetch failed - {e}")

    except Exception as e:
        logger.error(f"CoinGecko API failed: {e}")
        # Return empty results, will use cached data

    return results


# ═══════════════════════════════════════════════════════════════════════════════
# UTILITIES
# ═══════════════════════════════════════════════════════════════════════════════

def sanitize_for_json(obj):
    """Recursively convert NaN/Inf values to None for valid JSON."""
    import math
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(item) for item in obj]
    elif isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    return obj


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    """Main entry point."""
    import pandas as pd  # Import here to check availability

    logger.info("=" * 60)
    logger.info("SPECTRUM Market Data Generator")
    logger.info("=" * 60)

    start_time = datetime.now(timezone.utc)

    # Fetch stock data
    stock_tickers = list(STOCKS.keys())
    stock_data = fetch_stock_data(stock_tickers)

    # Fetch crypto data
    crypto_data = fetch_crypto_data()

    # Combine all data
    all_data = {
        "generated": start_time.isoformat(),
        "stocks": stock_data,
        "crypto": crypto_data,
        "metadata": {
            "stockCount": len(stock_data),
            "cryptoCount": len(crypto_data),
            "sources": ["Yahoo Finance", "CoinGecko"],
        }
    }

    # Sanitize data to remove NaN/Inf values (not valid JSON)
    all_data = sanitize_for_json(all_data)

    # Write to assets
    output_file = ASSETS_DIR / "market_data.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)

    logger.info(f"\nData written to: {output_file}")

    # Also copy to dist folder for direct serving
    dist_file = PROJECT_ROOT / "dist" / "market_data.json"
    if dist_file.parent.exists():
        with open(dist_file, "w", encoding="utf-8") as f:
            json.dump(all_data, f, indent=2, ensure_ascii=False)
        logger.info(f"Data copied to: {dist_file}")

    # Also write a status file
    status = {
        "lastRun": start_time.isoformat(),
        "duration": (datetime.now(timezone.utc) - start_time).total_seconds(),
        "stocksUpdated": len([s for s in stock_data.values() if "error" not in s]),
        "stocksFailed": len([s for s in stock_data.values() if "error" in s]),
        "cryptoUpdated": len(crypto_data),
        "success": True,
    }

    status_file = ASSETS_DIR / "last_update_status.json"
    with open(status_file, "w") as f:
        json.dump(status, f, indent=2)

    elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
    logger.info(f"Completed in {elapsed:.1f}s")
    logger.info("=" * 60)

    return 0


if __name__ == "__main__":
    try:
        import pandas as pd
    except ImportError:
        logger.error("pandas not installed. Run: pip install pandas")
        sys.exit(1)

    sys.exit(main())
