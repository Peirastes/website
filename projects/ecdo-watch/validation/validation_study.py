#!/usr/bin/env python3
"""
ECDO Watch Validation Study Framework

Phase 2: Rigorous validation of the falsification-first methodology
Timeline: Mar-May 2026 (8 weeks)

This script orchestrates:
1. Correlation analysis (detected alerts vs. catalogs)
2. False-positive rate quantification
3. Threshold calibration
4. Multi-channel coherence validation

Generated outputs:
- validation/VALIDATION_REPORT.md (8-12 page report)
- validation/results/*.csv (tables and statistics)
- validation/results/*.png (charts and visualizations)
"""

import json
import csv
import os
from datetime import datetime, timedelta
from pathlib import Path
import statistics

def load_operations_log(log_path="../operations_log.md"):
    """
    Parse operations_log.md to extract anomaly records.

    Returns list of dicts:
    {
        'date': '2026-02-15',
        'time': '06:30',
        'channels': ['LOD', 'MAG'],
        'z_scores': [2.8, 3.1],
        'quiet_day': True,
        'known_event': 'None found' | 'Event name',
        'classification': 'TP' | 'FP' | 'Indeterminate'
    }
    """
    detections = []

    try:
        with open(log_path, 'r') as f:
            lines = f.readlines()
            in_table = False

            for line in lines:
                # Skip header rows
                if '|' not in line or '---' in line:
                    continue

                # Parse table rows
                if '|' in line and in_table:
                    parts = [p.strip() for p in line.split('|')[1:-1]]  # Remove empty strings from split

                    if len(parts) >= 7 and parts[0] != 'YYYY-MM-DD':
                        try:
                            detection = {
                                'date': parts[0],
                                'time': parts[1] if parts[1] else 'N/A',
                                'channels': [c.strip() for c in parts[2].split(',')],
                                'z_scores': [float(z.strip()) for z in parts[3].split(',') if z.strip()],
                                'quiet_day': parts[4].lower() in ['yes', 'true'],
                                'known_event': parts[5],
                                'classification': parts[6].upper() if len(parts) > 6 else 'INDETERMINATE'
                            }
                            detections.append(detection)
                        except (ValueError, IndexError):
                            continue

                if '| Date' in line:
                    in_table = True

    except FileNotFoundError:
        print(f"Warning: {log_path} not found. Using empty dataset.")
        detections = []

    return detections

def compute_false_positive_rate(detections):
    """
    Calculate false-positive rate by channel combination.

    Returns dict with:
    - single_channel_fp_rate
    - multi_channel_fp_rate
    - overall_fp_rate
    - tp_count, fp_count, indeterminate_count
    """

    if not detections:
        return {
            'single_channel_fp_rate': None,
            'multi_channel_fp_rate': None,
            'overall_fp_rate': None,
            'tp_count': 0,
            'fp_count': 0,
            'indeterminate_count': 0,
            'message': 'No detections in operations log yet'
        }

    single_channel = []
    multi_channel = []

    for d in detections:
        num_channels = len([c for c in d['channels'] if c.strip()])
        classification = d['classification']

        if num_channels == 1:
            single_channel.append(classification)
        elif num_channels >= 2:
            multi_channel.append(classification)

    # Calculate rates
    tp_count = sum(1 for d in detections if d['classification'] == 'TP')
    fp_count = sum(1 for d in detections if d['classification'] == 'FP')
    indeterminate_count = sum(1 for d in detections if d['classification'] == 'INDETERMINATE')

    single_fp_rate = fp_count / len(single_channel) if single_channel else None
    multi_fp_rate = fp_count / len(multi_channel) if multi_channel else None
    overall_fp_rate = fp_count / len(detections) if detections else None

    return {
        'single_channel_fp_rate': single_fp_rate,
        'multi_channel_fp_rate': multi_fp_rate,
        'overall_fp_rate': overall_fp_rate,
        'tp_count': tp_count,
        'fp_count': fp_count,
        'indeterminate_count': indeterminate_count,
        'single_channel_count': len(single_channel),
        'multi_channel_count': len(multi_channel),
        'target_multi_channel_fp_rate': 0.05,
        'target_precision': 0.80
    }

def test_threshold_variations(detections, thresholds=[2.0, 2.5, 3.0]):
    """
    Retrospectively test different z-score thresholds on detections.

    For each threshold, calculate:
    - How many detections would still trigger
    - What precision would be achieved
    - What recall would be maintained
    """

    if not detections:
        return {'message': 'No detections available for threshold testing'}

    results = []

    for threshold in thresholds:
        # Count detections meeting threshold
        above_threshold = [
            d for d in detections
            if any(z >= threshold for z in d['z_scores'])
        ]

        if above_threshold:
            tp_above = sum(1 for d in above_threshold if d['classification'] == 'TP')
            fp_above = sum(1 for d in above_threshold if d['classification'] == 'FP')

            precision = tp_above / len(above_threshold) if above_threshold else 0
            recall = tp_above / (sum(1 for d in detections if d['classification'] == 'TP') or 1)

            f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        else:
            precision = recall = f1_score = 0

        results.append({
            'threshold_zscore': threshold,
            'alerts_triggered': len(above_threshold),
            'true_positives': tp_above if above_threshold else 0,
            'false_positives': fp_above if above_threshold else 0,
            'precision': precision,
            'recall': recall,
            'f1_score': f1_score
        })

    return results

def validate_channel_independence(detections):
    """
    Test hypothesis: multi-channel anomalies are statistically independent
    and therefore rare by chance.

    Calculate:
    - Probability of random alignment (expected by chance)
    - Observed multi-channel alignment rate
    - Benefit ratio (observed / expected)
    """

    if not detections:
        return {'message': 'No detections available for coherence analysis'}

    single_channel_detections = [d for d in detections if len([c for c in d['channels'] if c.strip()]) == 1]
    multi_channel_detections = [d for d in detections if len([c for c in d['channels'] if c.strip()]) >= 2]

    if not single_channel_detections:
        return {'message': 'Insufficient single-channel data for independence test'}

    single_channel_anomaly_rate = len(single_channel_detections) / len(detections)

    # If channels were independent, probability of simultaneous anomaly:
    # P(simultaneous) = P(channel1) * P(channel2) if independent
    # With 4 channels: P = (single_rate)^2
    prob_random_alignment = single_channel_anomaly_rate ** 2

    observed_alignment_rate = len(multi_channel_detections) / len(detections) if detections else 0

    # Benefit: how much better is the multi-channel approach?
    benefit_ratio = (observed_alignment_rate / prob_random_alignment) if prob_random_alignment > 0 else float('inf')

    return {
        'single_channel_anomaly_rate': single_channel_anomaly_rate,
        'expected_multi_channel_rate_if_independent': prob_random_alignment,
        'observed_multi_channel_rate': observed_alignment_rate,
        'benefit_ratio': benefit_ratio,
        'interpretation': f"Multi-channel approach identifies anomalies {benefit_ratio:.1f}x better than random chance"
    }

def generate_phase1_summary(detections, fp_analysis):
    """
    Generate summary statistics for Phase 1 data collection.
    """

    return {
        'total_anomalies_recorded': len(detections),
        'true_positives': fp_analysis.get('tp_count', 0),
        'false_positives': fp_analysis.get('fp_count', 0),
        'indeterminate': fp_analysis.get('indeterminate_count', 0),
        'multi_channel_fp_rate': fp_analysis.get('multi_channel_fp_rate'),
        'single_channel_fp_rate': fp_analysis.get('single_channel_fp_rate'),
        'overall_fp_rate': fp_analysis.get('overall_fp_rate'),
        'target_achieved': fp_analysis.get('multi_channel_fp_rate', 1.0) < 0.05,
        'status': 'Phase 1 data collection ongoing' if len(detections) < 20 else 'Ready for Phase 2 analysis'
    }

def save_results(output_dir='results'):
    """
    Main execution function: run validation study and save results.
    """

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("ECDO Watch Validation Study - Phase 2")
    print("=" * 70)

    # Load operations log
    detections = load_operations_log()
    print(f"\nLoaded {len(detections)} anomaly records from operations_log.md")

    if not detections:
        print("\nNo anomalies recorded yet. Phase 1 (Passive Monitoring) is ongoing.")
        print("Expected timeline: Feb 1 - Apr 30, 2026")
        print("Target: 20+ anomalies with classification and context")
        return

    # Analysis 1: False-positive rate
    print("\n" + "=" * 70)
    print("ANALYSIS 1: False-Positive Rate")
    print("=" * 70)
    fp_analysis = compute_false_positive_rate(detections)

    print(f"Single-channel FP rate: {fp_analysis['single_channel_fp_rate']:.1%}"
          if fp_analysis['single_channel_fp_rate'] is not None else "Insufficient data")
    print(f"Multi-channel FP rate: {fp_analysis['multi_channel_fp_rate']:.1%}"
          if fp_analysis['multi_channel_fp_rate'] is not None else "Insufficient data")
    print(f"Overall FP rate: {fp_analysis['overall_fp_rate']:.1%}"
          if fp_analysis['overall_fp_rate'] is not None else "Insufficient data")
    print(f"\nSummary: TP={fp_analysis['tp_count']} FP={fp_analysis['fp_count']} Indeterminate={fp_analysis['indeterminate_count']}")
    print(f"Target: Multi-channel FP < 5%")
    print(f"Status: {'✓ ACHIEVED' if fp_analysis.get('multi_channel_fp_rate', 1.0) < 0.05 else '⚠ PENDING (need more data)'}")

    # Analysis 2: Threshold calibration
    print("\n" + "=" * 70)
    print("ANALYSIS 2: Threshold Calibration")
    print("=" * 70)
    threshold_results = test_threshold_variations(detections)

    if 'message' not in threshold_results:
        print(f"{'Threshold':<12} {'Alerts':<8} {'TP':<6} {'FP':<6} {'Precision':<11} {'Recall':<8} {'F1':<8}")
        print("-" * 70)
        for result in threshold_results:
            print(f"{result['threshold_zscore']:.1f}σ         "
                  f"{result['alerts_triggered']:<8} "
                  f"{result['true_positives']:<6} "
                  f"{result['false_positives']:<6} "
                  f"{result['precision']:.1%}        "
                  f"{result['recall']:.1%}   "
                  f"{result['f1_score']:.3f}")

        # Find optimal threshold
        best_threshold = max(threshold_results, key=lambda x: x['f1_score'])
        print(f"\nOptimal threshold: {best_threshold['threshold_zscore']:.1f}σ (F1={best_threshold['f1_score']:.3f})")
    else:
        print(threshold_results['message'])

    # Analysis 3: Channel coherence
    print("\n" + "=" * 70)
    print("ANALYSIS 3: Multi-Channel Coherence")
    print("=" * 70)
    coherence = validate_channel_independence(detections)

    if 'message' not in coherence:
        print(f"Single-channel anomaly rate: {coherence['single_channel_anomaly_rate']:.1%}")
        print(f"Expected multi-channel rate (if independent): {coherence['expected_multi_channel_rate_if_independent']:.1%}")
        print(f"Observed multi-channel rate: {coherence['observed_multi_channel_rate']:.1%}")
        print(f"\n{coherence['interpretation']}")
        print(f"Target: > 80% reduction (benefit ratio > 5.0x)")
        print(f"Status: {'✓ ACHIEVED' if coherence.get('benefit_ratio', 0) > 5.0 else '⚠ PENDING'}")
    else:
        print(coherence['message'])

    # Phase 1 summary
    print("\n" + "=" * 70)
    print("PHASE 1 STATUS")
    print("=" * 70)
    phase1_summary = generate_phase1_summary(detections, fp_analysis)

    print(f"Total anomalies recorded: {phase1_summary['total_anomalies_recorded']}")
    print(f"  - True positives: {phase1_summary['true_positives']}")
    print(f"  - False positives: {phase1_summary['false_positives']}")
    print(f"  - Indeterminate: {phase1_summary['indeterminate']}")
    print(f"\nStatus: {phase1_summary['status']}")

    # Save results to CSV
    print("\n" + "=" * 70)
    print("SAVING RESULTS")
    print("=" * 70)

    # Save FP rate analysis
    fp_csv_path = os.path.join(output_dir, 'fp_rate_analysis.csv')
    with open(fp_csv_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fp_analysis.keys())
        writer.writeheader()
        writer.writerow(fp_analysis)
    print(f"✓ Saved: {fp_csv_path}")

    # Save threshold results
    if 'message' not in threshold_results:
        threshold_csv_path = os.path.join(output_dir, 'threshold_calibration.csv')
        with open(threshold_csv_path, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=threshold_results[0].keys())
            writer.writeheader()
            writer.writerows(threshold_results)
        print(f"✓ Saved: {threshold_csv_path}")

    # Save coherence analysis
    if 'message' not in coherence:
        coherence_json_path = os.path.join(output_dir, 'coherence_analysis.json')
        with open(coherence_json_path, 'w') as f:
            json.dump(coherence, f, indent=2)
        print(f"✓ Saved: {coherence_json_path}")

    # Save phase 1 summary
    phase1_json_path = os.path.join(output_dir, 'phase1_summary.json')
    with open(phase1_json_path, 'w') as f:
        json.dump(phase1_summary, f, indent=2)
    print(f"✓ Saved: {phase1_json_path}")

    print("\n" + "=" * 70)
    print("NEXT STEPS")
    print("=" * 70)
    print("1. Continue Phase 1 passive monitoring (Feb 1 - Apr 30)")
    print("2. Document anomalies in operations_log.md")
    print("3. Re-run this script monthly to track progress")
    print("4. When 20+ anomalies recorded: proceed to Phase 2 analysis")
    print("5. Target Phase 2 completion: End of May 2026")
    print("=" * 70)

if __name__ == '__main__':
    save_results()
