# Artemis II Trajectory Calibration Testbed

Standalone Node.js testbed for calibrating the Artemis II simulator's trajectory parameters against NASA's published mission control data. Produces a diff table of simulated event times vs NASA reference values, so we can iteratively tune burn times and delta-v's until the full mission timeline matches.

## Files

| File | Purpose |
|---|---|
| `trajectory.mjs` | Pure physics module extracted from `artemis2.html`. Exports `runTrajectory(params)`. No DOM deps. |
| `nasa-reference.mjs` | NASA reference data with T+ times, sources, and confidence weights for every mission event. |
| `calibrate.mjs` | CLI runner. Prints chronological diff table comparing sim to NASA. Supports parameter overrides and sweeps. |

## Quick start

```bash
cd artemis-ii/calibration
node calibrate.mjs
```

This runs the trajectory with current defaults and prints a color-coded comparison table: green = within 60 s of NASA, yellow = within 10 min, red = off by more.

## Overriding parameters

```bash
# Fire TLI at a fixed time instead of detecting it dynamically
node calibrate.mjs TLI_MODE=fixed T_TLI_BURN=90828 TLI_DV=0.388

# Tune HEO apogee to match NASA's 23.5h orbit
node calibrate.mjs HEO_APOGEE=76757

# Combine multiple overrides
node calibrate.mjs T_HEO_BURN=3900 HEO_APOGEE=76757 TLI_MODE=fixed T_TLI_BURN=90828
```

Any parameter in `DEFAULTS` (see `trajectory.mjs`) can be overridden.

## Sweep mode

Find the value of a parameter that minimizes error on downstream events:

```bash
# Sweep TLI delta-v from 0.20 to 0.40 km/s in 0.01 km/s steps
node calibrate.mjs --sweep TLI_DV 0.20 0.40 0.01

# Once you've locked earlier events, sweep with them pinned
node calibrate.mjs TLI_MODE=fixed T_TLI_BURN=90828 --sweep TLI_DV 0.30 0.45 0.005
```

The sweep table shows perilune time and offset from NASA target (432,420 s) for each parameter value. Pick the row with `Δperilune ≈ 0`.

## Calibration workflow — optical alignment order

**Critical:** tune events in chronological order, from launch forward. Each event depends on upstream physics, so if you adjust a later event before fixing an earlier mismatch, the error propagates *divergently* rather than *convergently*.

### Mirror 1 — Launch (locked)
`LAUNCH_UTC = 2026-04-01T22:35:12Z` — NASA confirmed, do not change.

### Mirror 2 — SRB separation (T+126 s)
Currently hardcoded in the ascent profile. Leave as-is unless NASA publishes a more specific figure.

### Mirror 3 — MECO (T+480 s)
Also hardcoded in ascent profile. NASA says "about 8 minutes" — 480 s is within tolerance.

### Mirror 4 — ICPS perigee raise burn (T+~3000 s)
Not currently modeled as a physics burn in the sim (only labeled in the event log). The HEO burn absorbs both burns' effects into one step at `T_HEO_BURN`.

### Mirror 5 — ICPS HEO burn → 23.5-hour orbit (T+~3900 s)
Tune `T_HEO_BURN` and `HEO_APOGEE` so the resulting orbit has a 23.5-hour period matching NASA.

For a 23.5 h orbit with 185 km perigee:
- Semi-major axis: 41,660 km
- Apogee altitude: ~76,760 km above Earth surface (not 74,000)

```bash
node calibrate.mjs HEO_APOGEE=76757
```

### Mirror 6 — TLI burn start (T+90,828 s, NASA confirmed)
This is the **most critical anchor** after launch. NASA confirmed the TLI burn fired at April 2, 23:49 UTC (7:49 PM EDT).

Switch to fixed-time TLI so we control exactly when it fires:

```bash
node calibrate.mjs TLI_MODE=fixed T_TLI_BURN=90828
```

### Mirror 7 — TLI delta-v (tunes perilune arrival time)
Once the TLI fires at the right time, tune `TLI_DV` so perilune lands at T+432,420 s (April 6, 23:02 UTC).

NASA's stated Δv is 0.388 km/s (1274 ft/s). Start there and see how close perilune gets:

```bash
node calibrate.mjs TLI_MODE=fixed T_TLI_BURN=90828 TLI_DV=0.388
```

If perilune is off, sweep:

```bash
node calibrate.mjs TLI_MODE=fixed T_TLI_BURN=90828 --sweep TLI_DV 0.36 0.42 0.002
```

Note: our two-burn architecture (HEO burn → small TLI at perigee) differs slightly from NASA's single ESM TLI burn from the 23.5h HEO orbit. If we can't hit perilune with a physically reasonable TLI Δv, the HEO burn energy needs adjustment first.

### Mirror 8 — Lunar flyby (T+432,420 s)
This is the downstream anchor for the TLI tuning above. If Mirror 7 is tuned correctly, this event falls into place automatically.

### Mirror 9 — Maximum distance from Earth (T+432,600 s, 406,700 km)
Should follow automatically from the flyby being correct, since max distance is ~3 minutes past perilune.

### Mirror 10 — Return trajectory correction burns
The sim currently synthesizes TCM-1 and TCM-2 as `perilune + 1 day` and `perilune + 2 days`. For Artemis II, the **first outbound TCM was canceled** — we should not synthesize OTC-1 at all. Return TCMs do exist and would need dedicated reference times if we want to model them.

### Mirror 11 — Splashdown (T+783,480 s)
The sim detects splashdown when the spacecraft returns within 50 km of Earth's surface. If TLI and perilune are correct, this should land near NASA's NET April 11, 00:21 UTC time. Adjust `T_MISSION_END` if integration cuts off early.

## Interpretation of output

```
Event                       NASA T+      SIM T+        Δ        Status
─────────────────────────────────────────────────────────────────────
  Launch                        0s         0s          0s       ★ confirmed
  SRB separation               126s       126s          0s       · estimated
  MECO                         480s       480s          0s       · estimated
  ICPS HEO burn               +1h 5m    +1h 30m     +25m 0s      · estimated
  TLI burn start            +1d 1h 14m  +0d 14h 0m  -11h 14m     ★ confirmed   ← RED: tune here first
  Lunar closest approach    +5d 0h 27m  +3d 22h 5m  -1d 2h 22m   ★ confirmed   ← symptom of TLI error
  ...
```

Rules:
- **Star (★)** events are the calibration anchors. Get these within 60s before moving on.
- **Diamond (◇)** events are derived from anchors — should fall into place automatically.
- **Dot (·)** events are estimated from NASA descriptions — aim for within a few minutes, but don't over-tune.
- Fix the **topmost red/yellow row first**, then re-run. Only move to the next mismatch once the earlier one is green.

## Porting calibrated values back to artemis2.html

Once `calibrate.mjs` reports a weighted mean absolute error ≤ 60 s:

1. Open `artemis-ii/artemis2.html`
2. Update the constants at lines ~534–540 (`T_MECO`, `T_SRB`, `T_PERIGEE_RAISE`, `T_HEO_BURN`, etc.)
3. Update `buildTrajectory()` internals (`tFlyby`, HEO apogee target, TLI detection mode, TLI Δv) to match the calibrated values
4. Re-test in the browser — the live mission log times should match NASA
5. Commit and push

## Adding new reference events

If you find a NASA source with more precise timing (e.g. a TCM burn time, re-entry interface time), add it to `NASA_EVENTS` in `nasa-reference.mjs` with:

```js
{
  key: 'event_key',
  label: 'Human-readable label',
  t: 123456,          // T+ seconds from launch
  status: 'confirmed', // or 'derived' / 'estimated'
  weight: 0.8,         // 0-1, how strongly it should anchor calibration
  source: 'Where you got the time from',
  notes: 'Context, exact UTC time, etc.',
}
```

Then run `calibrate.mjs` again to see how well the sim matches.
