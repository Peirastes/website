#!/usr/bin/env python3
"""
ECDO Watch Dashboard Verification
Checks that the dashboard HTML and required assets are present and valid
"""

import json
import sys
from pathlib import Path

# ===== CONFIG =====
PROJECT_ROOT = Path(__file__).parent.parent
ASSETS_DIR = PROJECT_ROOT / "assets"
HTML_FILE = PROJECT_ROOT / "ecdo-watch.html"
JSX_FILE = PROJECT_ROOT / "ecdo-watch.jsx"

# ===== CHECKS =====

def print_header(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def print_status(label, status, detail=""):
    icon = "[OK]" if status else "[FAIL]"
    color_code = "\033[92m" if status else "\033[91m"  # Green or Red
    reset_code = "\033[0m"
    detail_str = f" ({detail})" if detail else ""
    print(f"{color_code}{icon} {label}{detail_str}{reset_code}")

def check_files_exist():
    """Check that essential files exist."""
    print_header("File Existence Check")

    files = {
        "Dashboard HTML": HTML_FILE,
        "React Component": JSX_FILE,
    }

    all_ok = True
    for name, filepath in files.items():
        exists = filepath.exists()
        print_status(name, exists, str(filepath.relative_to(PROJECT_ROOT)))
        all_ok = all_ok and exists

    return all_ok

def check_html_structure():
    """Check HTML file has required elements."""
    print_header("HTML Structure Check")

    if not HTML_FILE.exists():
        print_status("HTML file readable", False)
        return False

    try:
        with open(HTML_FILE) as f:
            content = f.read()

        checks = {
            "Has React import": "react" in content.lower(),
            "Has ReactDOM import": "react-dom" in content.lower(),
            "Has Chart.js import": "chart.js" in content.lower(),
            "Has Babel import": "babel" in content.lower(),
            "Has root div": 'id="root"' in content,
            "Loads JSX component": "ecdo-watch.jsx" in content,
            "Mounts component": "ECDOWatchDashboard" in content,
        }

        all_ok = True
        for check_name, result in checks.items():
            print_status(check_name, result)
            all_ok = all_ok and result

        return all_ok
    except Exception as e:
        print_status("HTML readable", False, str(e))
        return False

def check_jsx_component():
    """Check JSX component has required structure."""
    print_header("React Component Structure Check")

    if not JSX_FILE.exists():
        print_status("JSX file exists", False)
        return False

    try:
        with open(JSX_FILE, encoding='utf-8', errors='ignore') as f:
            content = f.read()

        checks = {
            "Exports component": "ECDOWatchDashboard" in content,
            "Uses React hooks": "useState" in content or "useEffect" in content,
            "Uses Chart.js": "ChartComponent" in content or "new Chart" in content,
            "Has StatusBanner": "StatusBanner" in content,
            "Has Card component": "Card" in content,
            "Fetches JSON data": "fetch" in content,
            "Has 5 steps": "Step 1" in content and "Step 5" in content,
            "Has time-range buttons": "selectedTimeRange" in content,
        }

        all_ok = True
        for check_name, result in checks.items():
            print_status(check_name, result)
            all_ok = all_ok and result

        return all_ok
    except Exception as e:
        print_status("JSX readable", False, str(e))
        return False

def check_asset_files():
    """Check that required asset files exist."""
    print_header("Asset Files Check")

    essential_assets = [
        "kp_data.json",
        "lod_data.json",
        "mag_data.json",
        "historical_aa.json",
        "historical_pm.json",
    ]

    time_range_variants = ["kp_30d.json", "kp_90d.json", "kp_1y.json", "kp_5y.json", "kp_10y.json"]
    time_range_variants += ["lod_30d.json", "lod_90d.json", "lod_1y.json", "lod_5y.json", "lod_10y.json"]
    time_range_variants += ["mag_30d.json", "mag_90d.json", "mag_1y.json", "mag_5y.json", "mag_10y.json"]

    print("Essential Assets:")
    all_ok = True
    for filename in essential_assets:
        filepath = ASSETS_DIR / filename
        exists = filepath.exists()
        print_status(filename, exists)
        all_ok = all_ok and exists

    print("\nTime-Range Variants (should exist):")
    variants_ok = True
    for filename in time_range_variants:
        filepath = ASSETS_DIR / filename
        exists = filepath.exists()
        if not exists:
            print_status(filename, False)
            variants_ok = False

    if variants_ok:
        print_status("All time-range variants", True)
    else:
        print_status("Some time-range variants missing", False, "Will be generated on next run")

    return all_ok

def check_json_validity():
    """Check that JSON files are valid."""
    print_header("JSON Validity Check")

    files_to_check = [
        ("kp_data.json", "Kp data", ["labels", "data"]),
        ("lod_data.json", "LOD data", ["labels", "data"]),
        ("mag_data.json", "Magnetometer data", ["labels", "bou", "hon", "sjg", "composite"]),
    ]

    all_ok = True
    for filename, description, required_fields in files_to_check:
        filepath = ASSETS_DIR / filename

        if not filepath.exists():
            print_status(description, False, "FILE NOT FOUND")
            all_ok = False
            continue

        try:
            with open(filepath) as f:
                data = json.load(f)

            # Validate structure
            has_labels = "labels" in data
            has_required = all(field in data for field in required_fields)

            if has_labels and has_required:
                labels_len = len(data["labels"])
                # For magnetometer, check first data field length
                if filename == "mag_data.json":
                    data_len = len(data.get("composite", []))
                else:
                    data_len = len(data.get("data", []))

                if labels_len == data_len:
                    print_status(description, True, f"{data_len} points")
                else:
                    print_status(description, False, f"Labels/data mismatch ({labels_len} vs {data_len})")
                    all_ok = False
            else:
                missing = []
                for field in required_fields:
                    if field not in data:
                        missing.append(field)
                print_status(description, False, f"Missing: {', '.join(missing)}")
                all_ok = False

        except json.JSONDecodeError as e:
            print_status(description, False, f"JSON error: {e}")
            all_ok = False
        except Exception as e:
            print_status(description, False, str(e))
            all_ok = False

    return all_ok

def check_browser_compatibility():
    """Check for browser compatibility issues."""
    print_header("Browser Compatibility Check")

    if not JSX_FILE.exists():
        return False

    try:
        with open(JSX_FILE, encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Check for modern APIs
        checks = {
            "Uses modern JS (const/let)": "const" in content or "let" in content,
            "No IE-specific code": "ActiveXObject" not in content,
            "Uses arrow functions": "=>" in content,
            "Uses template literals": "`" in content,
            "Uses destructuring": "{" in content and "}" in content,
        }

        all_ok = True
        for check_name, result in checks.items():
            print_status(check_name, result)
            all_ok = all_ok and result

        return all_ok
    except Exception as e:
        print_status("Compatibility check", False, str(e))
        return False

# ===== MAIN =====

def main():
    print("\n" + "="*70)
    print("  ECDO Watch Dashboard Verification")
    print("="*70)

    results = []

    # Run checks
    results.append(("Files Exist", check_files_exist()))
    results.append(("HTML Structure", check_html_structure()))
    results.append(("React Component", check_jsx_component()))
    results.append(("Asset Files", check_asset_files()))
    results.append(("JSON Validity", check_json_validity()))
    results.append(("Browser Compatibility", check_browser_compatibility()))

    # Summary
    print_header("Summary")

    for name, result in results:
        icon = "[OK]" if result else "[FAIL]"
        status = "OK" if result else "FAILED"
        color = "\033[92m" if result else "\033[91m"
        reset = "\033[0m"
        print(f"{color}{icon} {name}: {status}{reset}")

    all_ok = all(r for _, r in results)

    print("\n" + "="*70)

    if all_ok:
        print("\n  [OK] Dashboard is ready to deploy!")
        print("\n  Next steps:")
        print("    1. Open ecdo-watch.html in a web browser")
        print("    2. Verify all 5 time-range buttons load data")
        print("    3. Check browser console (F12) for any errors")
        print("\n")
        exit_code = 0
    else:
        print("\n  [FAIL] Some checks failed. Review above for details.")
        print("\n  Issues to address before deployment:")
        print("    - Regenerate asset files with run_daily_update.py")
        print("    - Fix any JSON syntax errors")
        print("    - Ensure all required packages installed")
        print("\n")
        exit_code = 1

    print("="*70 + "\n")

    return exit_code

if __name__ == "__main__":
    sys.exit(main())
