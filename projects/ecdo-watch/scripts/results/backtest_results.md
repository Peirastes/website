```
ECDO Watch Threshold Backtesting Results
Run: 2026-02-28 17:11 UTC

======================================================================
PHASE 1: EOP-ONLY BACKTESTING (10-YEAR BASELINE)
======================================================================

Total days with valid EOP composite: 3604
Date range: 2016-04-08 to 2026-02-18
Quiet days (Kp <= 4.0): 2997 (83.2%)

  EOP Composite (quiet days) Distribution (N=2997):
    Mean:  1.120
    Std:   0.672
    Min:   0.031
    p50:   0.997
    p75:   1.429
    p90:   1.993
    p95:   2.426
    p99:   3.278
    Max:   4.790

  EOP signal (divisor=2.0):
    Signal mean: 0.5311, p95: 1.0000, p99: 1.0000
    Score contrib (x0.6x100) mean: 31.87, p95: 60.00, p99: 60.00
    Days where EOP contrib >= 35: 1161 (38.74%)
    Days where EOP contrib >= 65: 0 (0.00%)

  EOP signal (divisor=2.5):
    Signal mean: 0.4386, p95: 0.9703, p99: 1.0000
    Score contrib (x0.6x100) mean: 26.32, p95: 58.22, p99: 60.00
    Days where EOP contrib >= 35: 720 (24.02%)
    Days where EOP contrib >= 65: 0 (0.00%)

  EOP signal (divisor=3.0):
    Signal mean: 0.3705, p95: 0.8086, p99: 1.0000
    Score contrib (x0.6x100) mean: 22.23, p95: 48.51, p99: 60.00
    Days where EOP contrib >= 35: 469 (15.65%)
    Days where EOP contrib >= 65: 0 (0.00%)

  EOP signal (divisor=3.5):
    Signal mean: 0.3192, p95: 0.6931, p99: 0.9366
    Score contrib (x0.6x100) mean: 19.15, p95: 41.58, p99: 56.19
    Days where EOP contrib >= 35: 282 (9.41%)
    Days where EOP contrib >= 65: 0 (0.00%)

  EOP Score Contribution Histogram (D=3.0, current):
     0.6 -    3.6 | ########## (67)
     3.6 -    6.6 | ###################### (144)
     6.6 -    9.5 | ################################# (218)
     9.5 -   12.5 | ########################################## (276)
    12.5 -   15.5 | ################################################ (318)
    15.5 -   18.4 | ################################################## (326)
    18.4 -   21.4 | ############################################## (304)
    21.4 -   24.4 | ########################################### (286)
    24.4 -   27.3 | #################################### (236)
    27.3 -   30.3 | ####################### (152)
    30.3 -   33.3 | ##################### (139)
    33.3 -   36.2 | ################ (109)
    36.2 -   39.2 | ############## (97)
    39.2 -   42.2 | ########### (73)
    42.2 -   45.2 | ######## (53)
    45.2 -   48.1 | ###### (44)
    48.1 -   51.1 | ##### (33)
    51.1 -   54.1 | #### (28)
    54.1 -   57.0 | ### (23)
    57.0 -   60.0 | ########## (71)

  EOP-only watch score (MAG=0) on quiet days:
    This represents the MINIMUM watch score — the floor that EOP alone produces.
      EOP-only floor Distribution (N=2997):
    Mean:  22.228
    Std:   12.826
    Min:   0.624
    p50:   19.935
    p75:   28.573
    p90:   39.869
    p95:   48.514
    p99:   60.000
    Max:   60.000

======================================================================
PHASE 2: COMBINED SCORE VALIDATION (~84-DAY MAG WINDOW)
======================================================================

Mag data range: 2025-12-07 to 2026-02-28 (84 days)
Merged EOP+MAG days: 35
Quiet days in window: 19

  MAG Composite (quiet days) Distribution (N=19):
    Mean:  1.145
    Std:   0.659
    Min:   0.481
    p50:   0.866
    p75:   1.296
    p90:   2.001
    p95:   2.329
    p99:   2.973
    Max:   3.134

  Combined Watch Score (quiet days) Distribution (N=19):
    Mean:  30.873
    Std:   12.104
    Min:   12.831
    p50:   29.953
    p75:   36.010
    p90:   42.492
    p95:   48.748
    p99:   63.321
    Max:   66.964

  Watch Score Histogram (combined, quiet days):
    12.8 -   16.4 | ################################# (2)
    16.4 -   20.0 |  (0)
    20.0 -   23.7 | ################################################## (3)
    23.7 -   27.3 | ################################################## (3)
    27.3 -   30.9 | ################################# (2)
    30.9 -   34.5 | ################################################## (3)
    34.5 -   38.1 | ################################################## (3)
    38.1 -   41.7 | ################ (1)
    41.7 -   45.3 |  (0)
    45.3 -   48.9 | ################ (1)
    48.9 -   52.5 |  (0)
    52.5 -   56.1 |  (0)
    56.1 -   59.7 |  (0)
    59.7 -   63.4 |  (0)
    63.4 -   67.0 | ################ (1)

  At current thresholds (35/65):
    Days >= 35 (YELLOW): 6 of 19 (31.6%)
    Days >= 65 (ORANGE): 1 of 19 (5.3%)

  EOP-only vs Combined (same window, quiet days):
    EOP-only mean: 15.69, Combined mean: 30.87
    MAG adds on average: 15.18 points to the watch score
    EOP-MAG signal correlation: 0.325
    (Low correlation = MAG adds independent information; High = redundant)

======================================================================
PHASE 3: THRESHOLD RECOMMENDATION
======================================================================

  Estimated full watch score distribution (10-year EOP + MAG Monte Carlo):
    Estimated Full Score Distribution (N=2997):
    Mean:  26.391
    Std:   20.157
    Min:   0.000
    p50:   25.308
    p75:   40.438
    p90:   53.731
    p95:   61.131
    p99:   76.976
    Max:   90.730

  RECOMMENDED THRESHOLDS:
  -------------------------------------------------------
  GREEN/YELLOW boundary: 53.7  (p90 — 10% false positive rate)
  YELLOW/ORANGE boundary: 77.0  (p99 — 1% false positive rate)
  -------------------------------------------------------
  Alternative (stricter):
  GREEN/YELLOW boundary: 61.1  (p95 — 5% false positive rate)
  -------------------------------------------------------

  Current vs Recommended:
    Boundary                  Current  Recommended (p90/p99)  Alt (p95/p99)
    GREEN/YELLOW                   35                   53.7           61.1
    YELLOW/ORANGE                  65                   77.0           77.0

  False Positive Rates (% of quiet days triggering):
    Threshold               Current (35/65)    Recommended
    YELLOW trigger                    33.7%          10.0%
    ORANGE trigger                     3.7%           1.0%

  Normalization Divisor Assessment (D=3.0):
    EOP composite values >= 3.0 sigma: 1.90% of quiet days
    (Values above D are clipped to signal=1.0)
    Assessment: D=3.0 clips 1.9% — acceptable but consider D=3.5 if false positives are too high.

  LIMITATIONS:
    - MAG component validated on only ~84 days (USGS cache). Full combined
      backtesting requires longer mag history (e.g., ESA Swarm — see RA P4).
    - Monte Carlo MAG estimation is approximate. Re-run this script when
      longer mag data is available for proper combined validation.
    - Quiet-day gating uses Kp only (no Dst). Dst data availability is
      inconsistent in the historical record.
```
