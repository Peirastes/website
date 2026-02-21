#!/usr/bin/env python3
"""
Generate spectrum_summary.json — a lightweight scoring file for the
Thermofluidic Finance Lab's Asset Registry integration.

Reads market_data.json + intel_briefs.json, computes SPECTRUM scores
(5 dimensions, 29 metrics), and writes a ~40KB summary.

Scoring logic ported from src/App.jsx lines 580-1804.
"""

import json
import math
import sys
from pathlib import Path
from datetime import datetime, timezone

PROJECT_ROOT = Path(__file__).parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
MARKET_DATA = ASSETS_DIR / "market_data.json"
INTEL_BRIEFS = ASSETS_DIR / "intel_briefs.json"
OUTPUT_FILE = ASSETS_DIR / "spectrum_summary.json"


# ── helpers ──────────────────────────────────────────────────────

def safe(v):
    """Return v if it's a finite number, else None."""
    if v is None:
        return None
    try:
        f = float(v)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        return None


def normalize_metric(value, lo, hi, invert=False):
    v = safe(value)
    if v is None:
        return None
    clamped = max(lo, min(hi, v))
    score = ((clamped - lo) / (hi - lo)) * 100
    return 100 - score if invert else score


def dim_avg(scores):
    """Average of non-None values."""
    valid = [s for s in scores if s is not None]
    return round(sum(valid) / len(valid), 1) if valid else None


def fmt_cap(n):
    if n is None:
        return None
    n = float(n)
    if n >= 1e12:
        return f"${n / 1e12:.1f}T"
    if n >= 1e9:
        return f"${n / 1e9:.1f}B"
    if n >= 1e6:
        return f"${n / 1e6:.0f}M"
    return f"${n:,.0f}"


# ── technical indicators ─────────────────────────────────────────

def compute_ema(prices, period):
    if not prices or len(prices) < 1:
        return []
    k = 2.0 / (period + 1)
    ema = [prices[0]]
    for i in range(1, len(prices)):
        ema.append(prices[i] * k + ema[-1] * (1 - k))
    return ema


def compute_rsi(history, period=14):
    if not history or len(history) < period + 1:
        return None
    prices = [h["price"] for h in history]
    gains = 0.0
    losses = 0.0
    start = len(prices) - period - 1
    for i in range(1, period + 1):
        diff = prices[start + i] - prices[start + i - 1]
        if diff > 0:
            gains += diff
        else:
            losses -= diff
    avg_gain = gains / period
    avg_loss = losses / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - 100.0 / (1.0 + rs)


def compute_macd(history):
    if not history or len(history) < 35:
        return None
    prices = [h["price"] for h in history]
    ema12 = compute_ema(prices, 12)
    ema26 = compute_ema(prices, 26)
    macd_line = [ema12[i] - ema26[i] for i in range(len(prices))]
    signal_line = compute_ema(macd_line[26:], 9)
    if not signal_line:
        return None
    return {
        "macdLine": macd_line[-1],
        "signalLine": signal_line[-1],
        "histogram": macd_line[-1] - signal_line[-1],
    }


def compute_bollinger_position(history, period=20):
    if not history or len(history) < period:
        return None
    prices = [h["price"] for h in history[-period:]]
    mean = sum(prices) / len(prices)
    std = math.sqrt(sum((p - mean) ** 2 for p in prices) / len(prices))
    if std == 0:
        return 50.0
    upper = mean + 2 * std
    lower = mean - 2 * std
    current = prices[-1]
    return max(0, min(100, ((current - lower) / (upper - lower)) * 100))


def compute_sma_alignment(history):
    if not history or len(history) < 200:
        return None
    prices = [h["price"] for h in history]
    sma = lambda p: sum(prices[-p:]) / p
    sma20 = sma(20)
    sma50 = sma(50)
    sma200 = sma(200)
    current = prices[-1]
    score = 50.0
    if current > sma20:
        score += 12.5
    if sma20 > sma50:
        score += 12.5
    if sma50 > sma200:
        score += 12.5
    if current > sma200:
        score += 12.5
    if current < sma20:
        score -= 12.5
    if sma20 < sma50:
        score -= 12.5
    if sma50 < sma200:
        score -= 12.5
    if current < sma200:
        score -= 12.5
    return max(0, min(100, score))


def compute_volume_trend(history, window=20):
    if not history or len(history) < window * 2:
        return None
    recent = history[-window:]
    prior = history[-window * 2 : -window]
    avg_recent = sum(h.get("volume", 0) for h in recent) / len(recent)
    avg_prior = sum(h.get("volume", 0) for h in prior) / len(prior)
    if avg_prior == 0:
        return 50.0
    return avg_recent / avg_prior  # raw ratio


def compute_momentum_returns(history):
    if not history or len(history) < 2:
        return {}
    current = history[-1]["price"]
    out = {}
    for label, days in [("1W", 5), ("1M", 21), ("3M", 63), ("6M", 126), ("1Y", 252)]:
        idx = max(0, len(history) - 1 - days)
        past = history[idx]["price"]
        out[f"return{label}"] = ((current - past) / past) * 100 if past > 0 else None
    return out


def compute_trend_consistency(history, days=90):
    if not history or len(history) < days:
        return None
    sl = history[-days:]
    up = sum(1 for i in range(1, len(sl)) if sl[i]["price"] > sl[i - 1]["price"])
    return (up / (len(sl) - 1)) * 100


def compute_trend_strength(history):
    if not history or len(history) < 50:
        return None
    prices = [h["price"] for h in history]
    current = prices[-1]
    p50 = prices[max(0, len(prices) - 50)]
    pct = ((current - p50) / p50) * 100 if p50 > 0 else 0
    return max(0, min(100, 50 + pct * 2))


# ── custom score functions ───────────────────────────────────────

def score_rsi(rsi):
    if rsi is None:
        return None
    return max(0, 100 - abs(rsi - 50) * 2)


def score_macd(macd):
    if macd is None:
        return None
    h = macd["histogram"]
    return max(0, min(100, 50 + h * 10))


def score_volume(ratio):
    if ratio is None:
        return None
    return max(0, min(100, ratio * 50))


def normalize_return(ret):
    if ret is None:
        return None
    return max(0, min(100, ((ret + 30) / 80) * 100))


def score_recommendation(key):
    if not key:
        return None
    m = {
        "strong_buy": 95, "buy": 80, "overweight": 70, "hold": 50,
        "underweight": 35, "sell": 20, "strong_sell": 5,
    }
    return m.get(key, 50)


def normalize_upside(price, target):
    p = safe(price)
    t = safe(target)
    if p is None or t is None or p == 0:
        return None
    upside = ((t - p) / p) * 100
    return max(0, min(100, ((upside + 50) / 150) * 100))


def normalize_52wk(price, high, low):
    p, h, l = safe(price), safe(high), safe(low)
    if p is None or h is None or l is None or h == l:
        return None
    return ((p - l) / (h - l)) * 100


# ── grade / signal ───────────────────────────────────────────────

def get_grade(score):
    if score > 80:
        return "A+"
    if score > 70:
        return "A"
    if score > 60:
        return "B+"
    if score > 50:
        return "B"
    if score > 40:
        return "C"
    return "D"


def get_signal(composite):
    if composite > 65:
        return "BULLISH"
    if composite < 40:
        return "BEARISH"
    return "NEUTRAL"


# ── per-ticker scoring ───────────────────────────────────────────

def score_stock(ticker, data, intel):
    raw_history = data.get("priceHistory") or []
    history = [h for h in raw_history if h.get("price") is not None]
    price = safe(data.get("price"))

    # Technical indicators
    rsi = compute_rsi(history)
    macd = compute_macd(history)
    boll = compute_bollinger_position(history)
    sma_align = compute_sma_alignment(history)
    vol_ratio = compute_volume_trend(history)
    trend_str = compute_trend_strength(history)
    returns = compute_momentum_returns(history)
    trend_con = compute_trend_consistency(history)

    # ── Fundamentals ──
    fund_scores = [
        normalize_metric(data.get("profitMargins"), -0.5, 0.5),
        normalize_metric(data.get("revenueGrowth"), -0.3, 0.5),
        normalize_metric(data.get("debtToEquity"), 0, 300, invert=True),
        normalize_metric(data.get("returnOnEquity"), -0.3, 0.5),
        normalize_metric(data.get("earningsGrowth"), -0.5, 1.0),
        normalize_metric(data.get("freeCashflow"), -5e9, 50e9),
    ]
    fund_avg = dim_avg(fund_scores)

    # ── Technicals ──
    tech_scores = [
        score_rsi(rsi),
        score_macd(macd),
        boll,  # already 0-100
        score_volume(vol_ratio),
        sma_align,  # already 0-100
        trend_str,  # already 0-100
    ]
    tech_avg = dim_avg(tech_scores)

    # ── Valuation ──
    val_scores = [
        normalize_metric(data.get("peRatio"), 0, 60, invert=True),
        normalize_metric(data.get("priceToBook"), 0, 20, invert=True),
        normalize_metric(data.get("dividendYield"), 0, 0.08),
        normalize_52wk(price, data.get("fiftyTwoWeekHigh"), data.get("fiftyTwoWeekLow")),
        normalize_upside(price, data.get("targetMeanPrice")),
        normalize_metric(data.get("pegRatio"), 0, 5, invert=True),
    ]
    val_avg = dim_avg(val_scores)

    # ── Momentum ──
    mom_scores = [
        normalize_return(returns.get("return1W")),
        normalize_return(returns.get("return1M")),
        normalize_return(returns.get("return3M")),
        normalize_return(returns.get("return6M")),
        normalize_return(returns.get("return1Y")),
        trend_con,  # already 0-100
    ]
    mom_avg = dim_avg(mom_scores)

    # ── Analyst ──
    ana_scores = [
        score_recommendation(data.get("recommendationKey")),
        normalize_upside(price, data.get("targetMeanPrice")),
        normalize_metric(data.get("numberOfAnalystOpinions"), 0, 40),
        normalize_metric(data.get("shortRatio"), 0, 10, invert=True),
        normalize_metric(data.get("heldPercentInstitutions"), 0, 1),
    ]
    ana_avg = dim_avg(ana_scores)

    # ── Composite ──
    dims = {"F": fund_avg, "T": tech_avg, "V": val_avg, "M": mom_avg, "A": ana_avg}
    valid_dims = [v for v in dims.values() if v is not None]
    composite = round(sum(valid_dims) / len(valid_dims), 1) if valid_dims else 50.0

    # ── Briefing line ──
    parts = [f"{data.get('name', ticker)} ({data.get('sector', 'N/A')})"]
    pm = safe(data.get("profitMargins"))
    if pm is not None:
        parts.append(f"margin {pm * 100:.0f}%")
    if rsi is not None:
        rsi_label = "overbought" if rsi > 70 else ("oversold" if rsi < 30 else "neutral")
        parts.append(f"RSI {rsi:.0f} ({rsi_label})")
    target = safe(data.get("targetMeanPrice"))
    if target and price:
        up = ((target - price) / price) * 100
        parts.append(f"analyst target ${target:.0f} ({'+' if up > 0 else ''}{up:.0f}%)")
    ret1m = returns.get("return1M")
    if ret1m is not None:
        parts.append(f"1M return {'+' if ret1m >= 0 else ''}{ret1m:.1f}%")
    signal = get_signal(composite)
    briefing = " | ".join(parts) + f". Signal: {signal.lower()}."

    # ── Key metrics ──
    key_metrics = {}
    if rsi is not None:
        key_metrics["rsi"] = round(rsi)
    pe = safe(data.get("peRatio"))
    if pe is not None:
        key_metrics["pe"] = round(pe, 1)
    if pm is not None:
        key_metrics["margin"] = f"{pm * 100:.0f}%"
    if target and price:
        up = ((target - price) / price) * 100
        key_metrics["targetUpside"] = f"{'+' if up > 0 else ''}{up:.0f}%"
    mc = data.get("marketCap")
    if mc is not None:
        key_metrics["marketCap"] = fmt_cap(mc)
    sr = safe(data.get("shortRatio"))
    if sr is not None:
        key_metrics["shortRatio"] = round(sr, 2)

    # ── Intel ──
    intel_entry = None
    if intel and ticker in intel:
        b = intel[ticker]
        intel_entry = {
            "thesis": b.get("thesis", ""),
            "risk": b.get("risk", ""),
            "watch": b.get("watch", ""),
        }

    return {
        "price": round(price, 2) if price else None,
        "change1d": safe(data.get("changePercent")),
        "dimensions": dims,
        "composite": composite,
        "grade": get_grade(composite),
        "signal": signal,
        "briefing": briefing,
        "keyMetrics": key_metrics,
        "intel": intel_entry,
    }


def score_crypto(ticker, data, intel):
    raw_history = data.get("priceHistory") or []
    history = [h for h in raw_history if h.get("price") is not None]
    price = safe(data.get("price"))

    # Technical indicators (only those with enough history)
    rsi = compute_rsi(history)
    macd = compute_macd(history)
    boll = compute_bollinger_position(history)
    sma_align = compute_sma_alignment(history)
    vol_ratio = compute_volume_trend(history)
    trend_str = compute_trend_strength(history)
    returns = compute_momentum_returns(history)
    trend_con = compute_trend_consistency(history)

    # ── Technicals ──
    tech_scores = [
        score_rsi(rsi),
        score_macd(macd),
        boll,
        score_volume(vol_ratio),
        sma_align,
        trend_str,
    ]
    tech_avg = dim_avg(tech_scores)

    # ── Momentum ──
    mom_scores = [
        normalize_return(returns.get("return1W")),
        normalize_return(returns.get("return1M")),
        normalize_return(returns.get("return3M")),
        normalize_return(returns.get("return6M")),
        normalize_return(returns.get("return1Y")),
        trend_con,
    ]
    mom_avg = dim_avg(mom_scores)

    # Crypto only has T and M
    dims = {"F": None, "T": tech_avg, "V": None, "M": mom_avg, "A": None}
    valid_dims = [v for v in dims.values() if v is not None]
    composite = round(sum(valid_dims) / len(valid_dims), 1) if valid_dims else 50.0

    # Briefing
    parts = [f"{data.get('name', ticker)} (Crypto)"]
    if rsi is not None:
        rsi_label = "overbought" if rsi > 70 else ("oversold" if rsi < 30 else "neutral")
        parts.append(f"RSI {rsi:.0f} ({rsi_label})")
    ret1m = returns.get("return1M")
    if ret1m is not None:
        parts.append(f"1M return {'+' if ret1m >= 0 else ''}{ret1m:.1f}%")
    signal = get_signal(composite)
    briefing = " | ".join(parts) + f". Signal: {signal.lower()}."

    key_metrics = {}
    if rsi is not None:
        key_metrics["rsi"] = round(rsi)
    mc = data.get("marketCap")
    if mc is not None:
        key_metrics["marketCap"] = fmt_cap(mc)

    intel_entry = None
    if intel and ticker in intel:
        b = intel[ticker]
        intel_entry = {
            "thesis": b.get("thesis", ""),
            "risk": b.get("risk", ""),
            "watch": b.get("watch", ""),
        }

    return {
        "price": round(price, 2) if price else None,
        "change1d": safe(data.get("changePercent")),
        "dimensions": dims,
        "composite": composite,
        "grade": get_grade(composite),
        "signal": signal,
        "briefing": briefing,
        "keyMetrics": key_metrics,
        "intel": intel_entry,
    }


# ── main ─────────────────────────────────────────────────────────

def main():
    print("Generating SPECTRUM summary...")

    if not MARKET_DATA.exists():
        print(f"ERROR: {MARKET_DATA} not found")
        return 1

    with open(MARKET_DATA, "r", encoding="utf-8") as f:
        market = json.load(f)

    # Load intel briefs (optional)
    intel = None
    if INTEL_BRIEFS.exists():
        with open(INTEL_BRIEFS, "r", encoding="utf-8") as f:
            raw = json.load(f)
            intel = raw.get("briefs", raw)  # handle both {briefs:{...}} and flat

    tickers = {}
    stocks = market.get("stocks", {})
    crypto = market.get("crypto", {})

    for ticker, data in stocks.items():
        try:
            tickers[ticker] = score_stock(ticker, data, intel)
        except Exception as e:
            print(f"  WARN: {ticker} scoring failed: {e}")

    for ticker, data in crypto.items():
        try:
            tickers[ticker] = score_crypto(ticker, data, intel)
        except Exception as e:
            print(f"  WARN: {ticker} scoring failed: {e}")

    summary = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "tickers": tickers,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=str)

    size_kb = OUTPUT_FILE.stat().st_size / 1024
    print(f"OK: {len(tickers)} tickers scored -> {OUTPUT_FILE.name} ({size_kb:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
