#!/usr/bin/env python3
"""
ECDO Watch Data Quality Metrics
Tracks data source health, completeness, and performance trends
"""

import json
import sys
import statistics
from pathlib import Path
from datetime import datetime, timezone

# ===== CONFIG =====
PROJECT_ROOT = Path(__file__).parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
LOGS_DIR = PROJECT_ROOT / "logs"

# ===== HELPERS =====
def utcnow():
    return datetime.now(timezone.utc)

def print_section(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def print_metric(label, value, unit=""):
    print(f"{label:.<40} {value:>15} {unit}")

# ===== DATA COMPLETENESS =====

def analyze_json_completeness(filepath, description):
    """Analyze data completeness in a JSON file."""
    try:
        with open(filepath) as f:
            data = json.load(f)

        values = data.get("data", [])
        total = len(values)

        if total == 0:
            return None

        # Count valid values (not None, not null)
        valid = [v for v in values if v is not None and not (isinstance(v, float) and (v != v))]  # NaN check
        valid_count = len(valid)
        completeness = (valid_count / total * 100) if total > 0 else 0

        # Statistics on valid values
        if valid:
            if all(isinstance(v, (int, float)) for v in valid):
                stats = {
                    "count": valid_count,
                    "completeness": completeness,
                    "min": min(valid),
                    "max": max(valid),
                    "mean": statistics.mean(valid),
                    "median": statistics.median(valid),
                }
                if len(valid) > 1:
                    stats["stdev"] = statistics.stdev(valid)
                else:
                    stats["stdev"] = 0
                return stats

        return {"count": valid_count, "completeness": completeness}

    except Exception as e:
        print(f"Error analyzing {filepath}: {e}")
        return None

# ===== PERFORMANCE METRICS =====

def analyze_log_performance():
    """Extract performance metrics from recent logs."""
    if not LOGS_DIR.exists():
        return None

    log_files = sorted(LOGS_DIR.glob("ecdo_watch_*.log"), reverse=True)

    if not log_files:
        return None

    durations = []
    errors = 0
    warnings = 0

    for log_file in log_files[:7]:  # Last 7 days
        try:
            with open(log_file) as f:
                content = f.read()

            # Extract duration
            for line in content.split('\n'):
                if "SUCCESSFUL" in line and "(" in line:
                    try:
                        duration_str = line.split("(")[1].split("s")[0]
                        durations.append(float(duration_str))
                    except:
                        pass

            errors += content.count("ERROR")
            warnings += content.count("WARNING")
        except:
            pass

    if durations:
        return {
            "avg_duration_s": statistics.mean(durations),
            "min_duration_s": min(durations),
            "max_duration_s": max(durations),
            "last_7days_errors": errors,
            "last_7days_warnings": warnings,
            "success_rate": (len(durations) / 7 * 100),
        }

    return None

# ===== API SOURCE ANALYSIS =====

def analyze_api_sources():
    """Analyze which data sources succeeded/failed."""
    if not LOGS_DIR.exists():
        return None

    latest_log = sorted(LOGS_DIR.glob("ecdo_watch_*.log"), reverse=True)[0] if list(LOGS_DIR.glob("ecdo_watch_*.log")) else None

    if not latest_log:
        return None

    sources = {
        "NOAA SWPC Kp": {"found": False, "success": False},
        "IERS EOP": {"found": False, "success": False},
        "GFZ Kp": {"found": False, "success": False},
        "USGS Magnetometer": {"found": False, "success": False},
    }

    try:
        with open(latest_log) as f:
            content = f.read()

        # Parse log for source mentions
        if "NOAA" in content or "Kp" in content:
            sources["NOAA SWPC Kp"]["found"] = True
            sources["NOAA SWPC Kp"]["success"] = "kp_data.json" in content or "Kp history" in content

        if "IERS" in content or "EOP" in content:
            sources["IERS EOP"]["found"] = True
            sources["IERS EOP"]["success"] = "lod_data.json" in content or "Fetching EOP" in content

        if "GFZ" in content or "gfz" in content.lower():
            sources["GFZ Kp"]["found"] = True
            sources["GFZ Kp"]["success"] = "Kp history" in content

        if "USGS" in content or "magnetometer" in content:
            sources["USGS Magnetometer"]["found"] = True
            sources["USGS Magnetometer"]["success"] = "mag_data.json" in content

        return sources
    except:
        return None

# ===== TREND ANALYSIS =====

def analyze_trends():
    """Analyze trends in performance over time."""
    if not LOGS_DIR.exists():
        return None

    log_files = sorted(LOGS_DIR.glob("ecdo_watch_*.log"), reverse=True)[:30]  # Last 30 days

    if not log_files:
        return None

    daily_durations = []
    daily_errors = []

    for log_file in log_files:
        try:
            with open(log_file) as f:
                content = f.read()

            # Get date from filename
            filename = log_file.stem  # e.g., "ecdo_watch_20260126_060015"
            date_part = filename.split("_")[2]  # "20260126"

            # Extract duration
            duration = None
            for line in content.split('\n'):
                if "SUCCESSFUL" in line and "(" in line:
                    try:
                        duration = float(line.split("(")[1].split("s")[0])
                    except:
                        pass

            errors = content.count("ERROR")

            if duration:
                daily_durations.append((date_part, duration))
            if errors:
                daily_errors.append((date_part, errors))
        except:
            pass

    trends = {}

    if daily_durations:
        durations = [d for _, d in daily_durations]
        trends["duration_trend"] = {
            "earliest_avg": statistics.mean(durations[-7:]) if len(durations) >= 7 else durations[0],
            "latest_avg": statistics.mean(durations[:7]) if len(durations) >= 7 else durations[0],
            "overall_avg": statistics.mean(durations),
        }

        # Calculate trend direction
        if len(durations) >= 7:
            early = statistics.mean(durations[-7:])
            late = statistics.mean(durations[:7])
            trend_pct = ((late - early) / early * 100) if early != 0 else 0
            trends["duration_trend"]["trend_direction"] = "increasing" if trend_pct > 5 else "decreasing" if trend_pct < -5 else "stable"
            trends["duration_trend"]["change_pct"] = trend_pct

    if daily_errors:
        errors = [e for _, e in daily_errors]
        trends["error_trend"] = {
            "total_errors_30d": sum(errors),
            "error_days": len(errors),
            "avg_errors_per_fail": sum(errors) / len(errors) if errors else 0,
        }

    return trends

# ===== MAIN =====

def main():
    print("\n" + "="*70)
    print(f"  ECDO Watch Data Quality Metrics — {utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("="*70)

    # Data Completeness
    print_section("Data Completeness")

    files_to_check = [
        (ASSETS_DIR / "kp_data.json", "Kp Index"),
        (ASSETS_DIR / "lod_data.json", "Length of Day (LOD)"),
        (ASSETS_DIR / "mag_data.json", "Magnetometer Composite"),
    ]

    completeness_data = {}
    for filepath, description in files_to_check:
        if filepath.exists():
            metrics = analyze_json_completeness(filepath, description)
            if metrics:
                completeness_data[description] = metrics
                print_metric(f"{description} Completeness", f"{metrics.get('completeness', 0):.1f}%")
                print_metric(f"  Valid Points", f"{metrics.get('count', 0)}")
                if "mean" in metrics:
                    print_metric(f"  Mean", f"{metrics['mean']:.2f}")
                if "min" in metrics and "max" in metrics:
                    print_metric(f"  Range", f"{metrics['min']:.2f} to {metrics['max']:.2f}")

    # Performance Metrics
    print_section("Performance Metrics (Last 7 Days)")

    perf = analyze_log_performance()
    if perf:
        print_metric("Average Duration", f"{perf.get('avg_duration_s', 0):.1f}", "seconds")
        print_metric("Min Duration", f"{perf.get('min_duration_s', 0):.1f}", "seconds")
        print_metric("Max Duration", f"{perf.get('max_duration_s', 0):.1f}", "seconds")
        print_metric("Success Rate", f"{perf.get('success_rate', 0):.1f}%")
        print_metric("Total Errors", f"{perf.get('last_7days_errors', 0)}")
        print_metric("Total Warnings", f"{perf.get('last_7days_warnings', 0)}")
    else:
        print("  No performance data available (not enough logs)")

    # API Sources
    print_section("Data Source Status (Latest Run)")

    sources = analyze_api_sources()
    if sources:
        for source_name, status in sources.items():
            if status["found"]:
                symbol = "✓" if status["success"] else "✗"
                result = "Success" if status["success"] else "Failed"
                print_metric(source_name, result)
            else:
                print_metric(source_name, "Not checked")
    else:
        print("  No source data available")

    # Trends
    print_section("30-Day Trends")

    trends = analyze_trends()
    if trends:
        if "duration_trend" in trends:
            dt = trends["duration_trend"]
            print_metric("Average Duration", f"{dt.get('overall_avg', 0):.1f}", "seconds")
            if "trend_direction" in dt:
                change = dt.get("change_pct", 0)
                direction = dt.get("trend_direction", "unknown")
                print_metric("Trend", f"{direction.upper()} ({change:+.1f}%)")

        if "error_trend" in trends:
            et = trends["error_trend"]
            print_metric("Errors (30 days)", f"{et.get('total_errors_30d', 0)}")
            print_metric("Failed Runs", f"{et.get('error_days', 0)}")

    # Summary
    print_section("Summary")

    if perf and perf.get('success_rate', 0) >= 95:
        print("  [OK] System is operating normally")
        print(f"    Success rate: {perf['success_rate']:.1f}%")
    elif perf:
        print("  [WARN] System has some issues")
        print(f"    Success rate: {perf['success_rate']:.1f}%")
        if perf.get('last_7days_errors', 0) > 0:
            print(f"    Errors detected: {perf['last_7days_errors']}")
    else:
        print("  [?] Insufficient data for summary")

    if completeness_data:
        all_complete = all(
            v.get('completeness', 0) >= 90 for v in completeness_data.values()
        )
        if all_complete:
            print("  [OK] Data completeness: Good (>90%)")
        else:
            print("  [WARN] Some data sources have missing values")

    print("\n" + "="*70 + "\n")

    return 0

if __name__ == "__main__":
    sys.exit(main())
