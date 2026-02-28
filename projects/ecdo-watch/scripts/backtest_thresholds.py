#!/usr/bin/env python3
"""
Backtest ECDO Watch coherence detection thresholds.

Runs the watch score formula over historical data to determine percentile-based
thresholds, replacing the hand-picked 35/65 cutoffs with empirically derived values.

Phase 1: EOP-only analysis over 10-year baseline (full data available)
Phase 2: Combined EOP+MAG validation over ~84-day mag window
Phase 3: Threshold recommendation with false positive rates

Usage:
    python scripts/backtest_thresholds.py

Works entirely from cached data — no network calls. Re-run when longer
magnetometer history becomes available (e.g., after ESA Swarm integration).

Validated: 2026-02-28
"""

import sys
from pathlib import Path
from datetime import timedelta, timezone

import numpy as np
import pandas as pd

# Import shared functions from the main pipeline
sys.path.insert(0, str(Path(__file__).parent))
from generate_ecdo_watch_data import (
    load_iers_eop_all_csv,
    load_gfz_kp_daily_since_1932,
    load_mag_history,
    clean_mag_history,
    robust_zscore,
    utcnow,
    BASELINE_YEARS_EOP,
    KP_QUIET_MAX,
)

SCRIPT_DIR = Path(__file__).parent
CACHE_DIR = SCRIPT_DIR.parent / "assets" / "cache"
RESULTS_DIR = SCRIPT_DIR / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def text_histogram(values, bins=20, width=50):
    """Render a simple text histogram."""
    counts, edges = np.histogram(values, bins=bins)
    max_count = max(counts) if max(counts) > 0 else 1
    lines = []
    for i, count in enumerate(counts):
        bar_len = int((count / max_count) * width)
        bar = "#" * bar_len
        lines.append(f"  {edges[i]:6.1f} - {edges[i+1]:6.1f} | {bar} ({count})")
    return "\n".join(lines)


def percentile_table(values, label=""):
    """Return a formatted percentile summary."""
    lines = [f"  {label} Distribution (N={len(values)}):"]
    lines.append(f"    Mean:  {np.mean(values):.3f}")
    lines.append(f"    Std:   {np.std(values):.3f}")
    lines.append(f"    Min:   {np.min(values):.3f}")
    lines.append(f"    p50:   {np.percentile(values, 50):.3f}")
    lines.append(f"    p75:   {np.percentile(values, 75):.3f}")
    lines.append(f"    p90:   {np.percentile(values, 90):.3f}")
    lines.append(f"    p95:   {np.percentile(values, 95):.3f}")
    lines.append(f"    p99:   {np.percentile(values, 99):.3f}")
    lines.append(f"    Max:   {np.max(values):.3f}")
    return "\n".join(lines)


def compute_eop_baseline(eop_all, kp_history):
    """Compute 10-year EOP baseline with z-scores and quiet-day flags."""
    now = utcnow()
    baseline_cutoff = now - timedelta(days=int(BASELINE_YEARS_EOP * 365.25))

    eop = eop_all[eop_all["date"] >= baseline_cutoff].copy()
    eop = eop.dropna(subset=["lod_ms"]).sort_values("date").reset_index(drop=True)

    # Polar motion speed
    if "pm_r_arcsec" not in eop.columns:
        eop["pm_r_arcsec"] = np.sqrt(eop["pm_x_arcsec"]**2 + eop["pm_y_arcsec"]**2)
    eop["pm_speed_arcsec_per_day"] = eop["pm_r_arcsec"].diff().abs()

    # Robust z-scores (matching pipeline: window=180)
    eop["z_lod"] = robust_zscore(eop["lod_ms"], window=180)
    eop["z_pm_speed"] = robust_zscore(eop["pm_speed_arcsec_per_day"], window=180)
    eop["eop_composite"] = eop[["z_lod", "z_pm_speed"]].abs().max(axis=1)

    # Merge Kp for quiet-day gating
    kp_daily = kp_history[["date", "kp_max"]].copy()
    eop["date_only"] = eop["date"].dt.normalize()
    kp_daily["date_only"] = kp_daily["date"].dt.normalize()
    eop = eop.merge(kp_daily, on="date_only", how="left", suffixes=("", "_kp"))

    # Quiet-day flag
    eop["is_quiet"] = eop["kp_max"].fillna(99) <= KP_QUIET_MAX

    return eop


def compute_mag_composite(mag_history):
    """Compute MAG composite z-scores matching the coherence pipeline (max |z|)."""
    mag = clean_mag_history(mag_history.copy())
    window = min(180, max(30, len(mag) // 3))

    z_cols = []
    for station in ["BOU", "FRD", "BRW", "HON"]:
        if station in mag.columns:
            series = pd.to_numeric(mag[station], errors="coerce")
            mag[f"z_{station}"] = robust_zscore(series, window=window)
            z_cols.append(f"z_{station}")

    if z_cols:
        mag["mag_composite"] = mag[z_cols].abs().max(axis=1)
    else:
        mag["mag_composite"] = np.nan

    return mag


def phase1_eop_only(eop):
    """Phase 1: EOP-only backtesting over 10-year baseline."""
    lines = []
    lines.append("=" * 70)
    lines.append("PHASE 1: EOP-ONLY BACKTESTING (10-YEAR BASELINE)")
    lines.append("=" * 70)

    # All days with valid z-scores
    valid = eop.dropna(subset=["eop_composite"]).copy()
    lines.append(f"\nTotal days with valid EOP composite: {len(valid)}")
    lines.append(f"Date range: {valid['date'].min().strftime('%Y-%m-%d')} to {valid['date'].max().strftime('%Y-%m-%d')}")

    # Quiet days only
    quiet = valid[valid["is_quiet"]].copy()
    lines.append(f"Quiet days (Kp <= {KP_QUIET_MAX}): {len(quiet)} ({100*len(quiet)/len(valid):.1f}%)")

    if len(quiet) < 30:
        lines.append("\nERROR: Insufficient quiet days for analysis.")
        return "\n".join(lines), None

    # EOP composite distribution on quiet days
    eop_comp = quiet["eop_composite"].values
    lines.append(f"\n{percentile_table(eop_comp, 'EOP Composite (quiet days)')}")

    # EOP signal (normalized: min(1, |composite|/D))
    for divisor in [2.0, 2.5, 3.0, 3.5]:
        eop_signal = np.minimum(1.0, np.abs(eop_comp) / divisor)
        eop_score = 100.0 * 0.6 * eop_signal  # EOP contribution to watch score
        lines.append(f"\n  EOP signal (divisor={divisor}):")
        lines.append(f"    Signal mean: {np.mean(eop_signal):.4f}, p95: {np.percentile(eop_signal, 95):.4f}, p99: {np.percentile(eop_signal, 99):.4f}")
        lines.append(f"    Score contrib (x0.6x100) mean: {np.mean(eop_score):.2f}, p95: {np.percentile(eop_score, 95):.2f}, p99: {np.percentile(eop_score, 99):.2f}")
        # At current 35/65 thresholds: what % of quiet days would the EOP component alone push past?
        lines.append(f"    Days where EOP contrib >= 35: {np.sum(eop_score >= 35)} ({100*np.mean(eop_score >= 35):.2f}%)")
        lines.append(f"    Days where EOP contrib >= 65: {np.sum(eop_score >= 65)} ({100*np.mean(eop_score >= 65):.2f}%)")

    # Primary analysis: D=3.0 (current)
    eop_signal_3 = np.minimum(1.0, np.abs(eop_comp) / 3.0)
    eop_score_3 = 100.0 * 0.6 * eop_signal_3

    lines.append(f"\n  EOP Score Contribution Histogram (D=3.0, current):")
    lines.append(text_histogram(eop_score_3, bins=20))

    # Simulate full watch score assuming MAG=0 (EOP-only floor)
    lines.append(f"\n  EOP-only watch score (MAG=0) on quiet days:")
    lines.append(f"    This represents the MINIMUM watch score — the floor that EOP alone produces.")
    lines.append(percentile_table(eop_score_3, "    EOP-only floor"))

    return "\n".join(lines), quiet


def phase2_combined(eop, mag_history, kp_history):
    """Phase 2: Combined EOP+MAG score validation over available mag window."""
    lines = []
    lines.append("\n" + "=" * 70)
    lines.append("PHASE 2: COMBINED SCORE VALIDATION (~84-DAY MAG WINDOW)")
    lines.append("=" * 70)

    mag = compute_mag_composite(mag_history)
    if len(mag) == 0 or mag["mag_composite"].isna().all():
        lines.append("\nERROR: No valid magnetometer data available.")
        return "\n".join(lines), None

    lines.append(f"\nMag data range: {mag['date'].min().strftime('%Y-%m-%d')} to {mag['date'].max().strftime('%Y-%m-%d')} ({len(mag)} days)")

    # Merge EOP + MAG on date (strip tz to avoid naive/aware mismatch)
    eop_slim = eop[["date", "eop_composite", "is_quiet"]].copy()
    eop_slim["date_only"] = eop_slim["date"].dt.tz_localize(None).dt.normalize()
    mag["date_only"] = pd.to_datetime(mag["date"]).dt.tz_localize(None).dt.normalize()

    merged = mag.merge(eop_slim, on="date_only", how="inner", suffixes=("_mag", "_eop"))
    merged = merged.dropna(subset=["eop_composite", "mag_composite"])
    lines.append(f"Merged EOP+MAG days: {len(merged)}")

    quiet = merged[merged["is_quiet"]].copy()
    lines.append(f"Quiet days in window: {len(quiet)}")

    if len(quiet) < 5:
        lines.append("\nWARNING: Very few quiet days — results are indicative only.")
        if len(quiet) == 0:
            return "\n".join(lines), None

    # MAG composite distribution
    mag_comp = quiet["mag_composite"].values
    lines.append(f"\n{percentile_table(mag_comp, 'MAG Composite (quiet days)')}")

    # Combined watch score
    eop_signal = np.minimum(1.0, np.abs(quiet["eop_composite"].values) / 3.0)
    mag_signal = np.minimum(1.0, np.abs(mag_comp) / 3.0)
    watch_score = 100.0 * (0.6 * eop_signal + 0.4 * mag_signal)
    watch_score = np.clip(watch_score, 0, 100)

    lines.append(f"\n{percentile_table(watch_score, 'Combined Watch Score (quiet days)')}")

    lines.append(f"\n  Watch Score Histogram (combined, quiet days):")
    lines.append(text_histogram(watch_score, bins=15))

    # Current thresholds
    lines.append(f"\n  At current thresholds (35/65):")
    lines.append(f"    Days >= 35 (YELLOW): {np.sum(watch_score >= 35)} of {len(watch_score)} ({100*np.mean(watch_score >= 35):.1f}%)")
    lines.append(f"    Days >= 65 (ORANGE): {np.sum(watch_score >= 65)} of {len(watch_score)} ({100*np.mean(watch_score >= 65):.1f}%)")

    # Compare EOP-only vs combined for same window
    eop_only_score = 100.0 * 0.6 * eop_signal
    lines.append(f"\n  EOP-only vs Combined (same window, quiet days):")
    lines.append(f"    EOP-only mean: {np.mean(eop_only_score):.2f}, Combined mean: {np.mean(watch_score):.2f}")
    lines.append(f"    MAG adds on average: {np.mean(watch_score - eop_only_score):.2f} points to the watch score")
    if len(quiet) >= 3:
        corr = np.corrcoef(eop_signal, mag_signal)[0, 1]
        lines.append(f"    EOP-MAG signal correlation: {corr:.3f}")
        lines.append(f"    (Low correlation = MAG adds independent information; High = redundant)")

    return "\n".join(lines), watch_score


def phase3_recommendation(eop_quiet, combined_scores):
    """Phase 3: Threshold recommendation based on Phase 1 and 2 results."""
    lines = []
    lines.append("\n" + "=" * 70)
    lines.append("PHASE 3: THRESHOLD RECOMMENDATION")
    lines.append("=" * 70)

    if eop_quiet is None:
        lines.append("\nCannot recommend — Phase 1 failed.")
        return "\n".join(lines), None, None

    # Primary basis: EOP-only 10-year baseline (largest sample)
    eop_comp = eop_quiet["eop_composite"].values
    eop_signal = np.minimum(1.0, np.abs(eop_comp) / 3.0)

    # Simulate full watch score range assuming MAG contributes proportionally
    # Use EOP-only data to set the EOP component thresholds, then scale to full score
    # If combined data exists, cross-validate
    eop_score = 100.0 * 0.6 * eop_signal  # EOP contribution only

    # To estimate full score thresholds from EOP-only data:
    # At the threshold, assume MAG signal is at its median level from Phase 2
    if combined_scores is not None and len(combined_scores) > 0:
        # We have combined data — use it directly for calibration
        primary_data = combined_scores
        basis_label = f"Combined EOP+MAG ({len(combined_scores)} quiet days, ~84-day window)"
        # But flag the limited sample
        limited_sample = True
    else:
        primary_data = None
        limited_sample = True

    # Strategy: Use the 10-year EOP-only distribution as the primary statistical basis.
    # The EOP component accounts for 60% of the score weight. On quiet days where
    # MAG is behaving normally (z ~ 0-1), the MAG contribution is small (0-13 points).
    # We set thresholds on the FULL score scale, using EOP as the primary driver.

    # Estimate full watch score distribution from EOP + typical MAG
    # Typical quiet-day MAG signal: assume mag_signal ~ uniform(0, 0.3) based on
    # the fact that |z| ~ half-normal, and /3.0 keeps most values small
    n_eop = len(eop_signal)
    np.random.seed(42)
    # Monte Carlo: sample MAG from observed distribution if available, else half-normal
    if combined_scores is not None and len(combined_scores) > 10:
        # Use observed MAG contribution
        mag_contrib_observed = combined_scores - eop_score[:len(combined_scores)]
        mag_samples = np.random.choice(mag_contrib_observed, size=n_eop, replace=True)
    else:
        # Assume MAG z ~ half-normal(0,1), signal = min(1, z/3)
        mag_z = np.abs(np.random.standard_normal(n_eop))
        mag_samples = 100.0 * 0.4 * np.minimum(1.0, mag_z / 3.0)

    estimated_full_score = eop_score + mag_samples
    estimated_full_score = np.clip(estimated_full_score, 0, 100)

    lines.append(f"\n  Estimated full watch score distribution (10-year EOP + MAG Monte Carlo):")
    lines.append(percentile_table(estimated_full_score, "  Estimated Full Score"))

    # Recommend thresholds
    p90 = np.percentile(estimated_full_score, 90)
    p95 = np.percentile(estimated_full_score, 95)
    p99 = np.percentile(estimated_full_score, 99)

    lines.append(f"\n  RECOMMENDED THRESHOLDS:")
    lines.append(f"  -------------------------------------------------------")
    lines.append(f"  GREEN/YELLOW boundary: {p90:.1f}  (p90 — 10% false positive rate)")
    lines.append(f"  YELLOW/ORANGE boundary: {p99:.1f}  (p99 — 1% false positive rate)")
    lines.append(f"  -------------------------------------------------------")
    lines.append(f"  Alternative (stricter):")
    lines.append(f"  GREEN/YELLOW boundary: {p95:.1f}  (p95 — 5% false positive rate)")
    lines.append(f"  -------------------------------------------------------")

    # Compare to current
    lines.append(f"\n  Current vs Recommended:")
    lines.append(f"    {'Boundary':<22} {'Current':>10} {'Recommended (p90/p99)':>22} {'Alt (p95/p99)':>14}")
    lines.append(f"    {'GREEN/YELLOW':<22} {'35':>10} {f'{p90:.1f}':>22} {f'{p95:.1f}':>14}")
    lines.append(f"    {'YELLOW/ORANGE':<22} {'65':>10} {f'{p99:.1f}':>22} {f'{p99:.1f}':>14}")

    # False positive rates at current thresholds
    fpr_yellow_current = 100 * np.mean(estimated_full_score >= 35)
    fpr_orange_current = 100 * np.mean(estimated_full_score >= 65)
    fpr_yellow_new = 100 * np.mean(estimated_full_score >= p90)
    fpr_orange_new = 100 * np.mean(estimated_full_score >= p99)

    lines.append(f"\n  False Positive Rates (% of quiet days triggering):")
    lines.append(f"    {'Threshold':<22} {'Current (35/65)':>16} {'Recommended':>14}")
    lines.append(f"    {'YELLOW trigger':<22} {f'{fpr_yellow_current:.1f}%':>16} {f'{fpr_yellow_new:.1f}%':>14}")
    lines.append(f"    {'ORANGE trigger':<22} {f'{fpr_orange_current:.1f}%':>16} {f'{fpr_orange_new:.1f}%':>14}")

    # Normalization divisor assessment
    lines.append(f"\n  Normalization Divisor Assessment (D=3.0):")
    pct_clipped = 100 * np.mean(np.abs(eop_comp) >= 3.0)
    lines.append(f"    EOP composite values >= 3.0 sigma: {pct_clipped:.2f}% of quiet days")
    lines.append(f"    (Values above D are clipped to signal=1.0)")
    if pct_clipped < 1.0:
        lines.append(f"    Assessment: D=3.0 clips <1% of values — reasonable. No change recommended.")
    elif pct_clipped < 5.0:
        lines.append(f"    Assessment: D=3.0 clips {pct_clipped:.1f}% — acceptable but consider D=3.5 if false positives are too high.")
    else:
        lines.append(f"    Assessment: D=3.0 clips {pct_clipped:.1f}% — may be too aggressive. Consider D=3.5 or D=4.0.")

    lines.append(f"\n  LIMITATIONS:")
    lines.append(f"    - MAG component validated on only ~84 days (USGS cache). Full combined")
    lines.append(f"      backtesting requires longer mag history (e.g., ESA Swarm — see RA P4).")
    lines.append(f"    - Monte Carlo MAG estimation is approximate. Re-run this script when")
    lines.append(f"      longer mag data is available for proper combined validation.")
    lines.append(f"    - Quiet-day gating uses Kp only (no Dst). Dst data availability is")
    lines.append(f"      inconsistent in the historical record.")

    return "\n".join(lines), p90, p99


def main():
    print("ECDO Watch Threshold Backtesting")
    print(f"Run date: {utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    print()

    # Load data from cache (no network calls)
    print("Loading cached data...")
    eop_all = load_iers_eop_all_csv(CACHE_DIR)
    kp_history = load_gfz_kp_daily_since_1932(CACHE_DIR)
    mag_history = load_mag_history(CACHE_DIR)

    print(f"  EOP records: {len(eop_all)}")
    print(f"  Kp records: {len(kp_history)}")
    print(f"  MAG records: {len(mag_history)}")
    print()

    # Phase 1: EOP-only
    eop = compute_eop_baseline(eop_all, kp_history)
    phase1_text, eop_quiet = phase1_eop_only(eop)
    print(phase1_text)

    # Phase 2: Combined
    phase2_text, combined_scores = phase2_combined(eop, mag_history, kp_history)
    print(phase2_text)

    # Phase 3: Recommendation
    phase3_text, recommended_yellow, recommended_orange = phase3_recommendation(eop_quiet, combined_scores)
    print(phase3_text)

    # Save results
    full_report = "\n".join([
        f"ECDO Watch Threshold Backtesting Results",
        f"Run: {utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        f"",
        phase1_text,
        phase2_text,
        phase3_text,
    ])

    results_file = RESULTS_DIR / "backtest_results.md"
    with open(results_file, "w") as f:
        f.write("```\n")
        f.write(full_report)
        f.write("\n```\n")

    print(f"\nResults saved to: {results_file}")

    if recommended_yellow is not None:
        print(f"\n{'='*70}")
        print(f"SUMMARY: Replace thresholds in generate_ecdo_watch_data.py lines 1420-1427")
        print(f"  GREEN/YELLOW: {recommended_yellow:.1f}  (was 35)")
        print(f"  YELLOW/ORANGE: {recommended_orange:.1f}  (was 65)")
        print(f"{'='*70}")

    return recommended_yellow, recommended_orange


if __name__ == "__main__":
    main()
