#!/usr/bin/env node
// Artemis II trajectory calibration runner.
//
// Usage:
//   node calibrate.mjs                      # run with current defaults, print diff table
//   node calibrate.mjs T_HEO_BURN=3900      # override one parameter
//   node calibrate.mjs TLI_MODE=fixed T_TLI_BURN=90828 TLI_DV=0.388
//   node calibrate.mjs --sweep TLI_DV 0.20 0.40 0.02   # sweep a parameter
//
// Calibration philosophy (optical alignment):
// Tune mirrors in CHRONOLOGICAL order. Lock the first event, then the next,
// and so on. Each event depends on the preceding physics, so fixing an early
// event keeps the downstream in a convergent regime.

import { runTrajectory, DEFAULTS, LAUNCH_UTC } from './trajectory.mjs';
import { NASA_EVENTS, NASA_PARAMS, compareEvent, formatTPlus, tPlusToUtc } from './nasa-reference.mjs';

// ---- Parse CLI args ----
const args = process.argv.slice(2);
const overrides = {};
let sweepSpec = null;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--sweep') {
    sweepSpec = {
      param: args[i + 1],
      from:  parseFloat(args[i + 2]),
      to:    parseFloat(args[i + 3]),
      step:  parseFloat(args[i + 4]),
    };
    i += 4;
    continue;
  }
  const m = a.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
  if (m) {
    const key = m[1];
    const val = m[2];
    // Coerce to number if numeric, else leave as string
    overrides[key] = isNaN(+val) ? val : +val;
  }
}

// ---- Map sim events to NASA events ----
// The sim's `meta` object has these keys after runTrajectory():
//   heoBurn.t     → icps_heo_burn
//   tli.t         → tli_start
//   periluneTime  → lunar_flyby
//   maxDistTime   → max_distance
//   splashdown.t  → splashdown
// For events without a dynamic sim counterpart (srb_sep, meco, icps_perigee_raise),
// the sim uses its parameter constants directly.

function mapSimToEvents(meta, params) {
  return {
    launch:              0,
    srb_sep:             params.T_SRB,
    meco:                params.T_MECO,
    icps_perigee_raise:  params.T_HEO_BURN - 900,   // perigee raise precedes HEO burn by ~15 min
    icps_heo_burn:       meta.heoBurn?.t ?? params.T_HEO_BURN,
    tli_start:           meta.tli?.t ?? null,
    tli_end:             meta.tli ? meta.tli.t + 350 : null,  // 5m50s burn
    otc1:                null,  // canceled
    lunar_flyby:         meta.periluneTime ?? null,
    max_distance:        meta.maxDistTime ?? null,
    splashdown:          meta.splashdown?.t ?? null,
  };
}

// ---- ANSI colors for terminal output ----
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

// ---- Single run + print ----
function runAndReport(params = {}, label = null) {
  const { meta } = runTrajectory(params);
  const simEvents = mapSimToEvents(meta, meta.params);

  if (label) {
    console.log(`\n${C.bold}${C.cyan}${label}${C.reset}`);
  }

  // Overrides applied
  const overrideKeys = Object.keys(params);
  if (overrideKeys.length > 0) {
    const o = overrideKeys.map(k => `${k}=${params[k]}`).join('  ');
    console.log(`${C.dim}overrides: ${o}${C.reset}`);
  }

  // Table header
  const col = (s, w) => String(s).padEnd(w);
  const colR = (s, w) => String(s).padStart(w);
  console.log();
  console.log(
    C.bold +
    col('Event', 28) +
    colR('NASA T+', 14) +
    colR('SIM T+', 14) +
    colR('Δ', 14) +
    '  Status' +
    C.reset
  );
  console.log(C.dim + '─'.repeat(80) + C.reset);

  let totalWeightedError = 0;
  let weightSum = 0;

  for (const ev of NASA_EVENTS) {
    const simT = simEvents[ev.key];
    if (ev.status === 'canceled') {
      console.log(
        C.gray +
        col('  ' + ev.label, 28) +
        colR('CANCELED', 14) +
        colR('—', 14) +
        colR('—', 14) +
        '  ' + ev.status +
        C.reset
      );
      continue;
    }

    const nasaStr = ev.t != null ? formatTPlus(ev.t) : '—';
    const simStr  = simT  != null ? formatTPlus(simT)  : C.red + 'MISSING' + C.reset;

    let deltaStr = '—';
    let color = C.reset;
    if (simT != null && ev.t != null) {
      const cmp = compareEvent(ev, simT, 60);
      deltaStr = cmp.deltaHuman;
      const absD = Math.abs(cmp.deltaSec);
      if (absD < 60) color = C.green;
      else if (absD < 600) color = C.yellow;
      else color = C.red;
      totalWeightedError += ev.weight * absD;
      weightSum += ev.weight;
    }

    const statusMark = ev.status === 'confirmed' ? '★' : ev.status === 'derived' ? '◇' : '·';

    console.log(
      col('  ' + ev.label, 28) +
      colR(nasaStr, 14) +
      colR(simStr, 14) +
      color + colR(deltaStr, 14) + C.reset +
      `  ${statusMark} ${ev.status}`
    );
  }

  console.log(C.dim + '─'.repeat(80) + C.reset);
  const score = weightSum > 0 ? totalWeightedError / weightSum : 0;
  const scoreColor = score < 60 ? C.green : score < 600 ? C.yellow : C.red;
  console.log(
    `${C.bold}weighted mean abs error:${C.reset} ${scoreColor}${score.toFixed(0)}s${C.reset}` +
    `   ${C.dim}(lower is better; ≤60s = locked)${C.reset}`
  );

  // Extra physics diagnostics
  console.log(`\n${C.bold}trajectory diagnostics:${C.reset}`);
  console.log(`  HEO burn:       t=${formatTPlus(meta.heoBurn?.t ?? 0)}  dv=${meta.heoBurn?.dv ?? '—'} km/s  alt=${meta.heoBurn?.alt ?? '—'} km`);
  console.log(`  TLI burn:       t=${formatTPlus(meta.tli?.t ?? 0)}  dv=${meta.tli?.dv ?? '—'} km/s  v: ${meta.tli?.vBefore ?? '—'} → ${meta.tli?.vAfter ?? '—'} km/s`);
  console.log(`  perilune:       t=${formatTPlus(meta.periluneTime ?? 0)}  alt=${meta.periluneAlt ?? '—'} km  (NASA: ${NASA_PARAMS.periluneAltKm} km)`);
  console.log(`  max distance:   t=${formatTPlus(meta.maxDistTime ?? 0)}  r=${meta.maxDistFromEarth ?? '—'} km  (NASA: ${NASA_PARAMS.maxDistKm} km)`);
  console.log(`  splashdown:     t=${formatTPlus(meta.splashdown?.t ?? 0)}  (NASA: ${formatTPlus(NASA_PARAMS.splashdownMs)})`);
  console.log(`  points:         ${meta.points}`);

  return { meta, score };
}

// ---- Sweep mode ----
function sweep(spec) {
  const { param, from, to, step } = spec;
  console.log(`${C.bold}${C.cyan}SWEEP ${param} from ${from} to ${to} step ${step}${C.reset}`);
  console.log();
  console.log(
    C.bold +
    String(param).padEnd(14) +
    'perilune T+'.padEnd(18) +
    'Δperilune'.padEnd(14) +
    'peri alt'.padEnd(12) +
    'splashdown'.padEnd(18) +
    C.reset
  );
  console.log(C.dim + '─'.repeat(76) + C.reset);

  const target = 432420;
  for (let v = from; v <= to + 1e-9; v += step) {
    const rounded = Math.round(v * 1000) / 1000;
    const params = { ...overrides, [param]: rounded };
    const { meta } = runTrajectory(params);
    const periT = meta.periluneTime ?? 0;
    const delta = periT - target;
    const splashT = meta.splashdown?.t ?? 0;

    const color = Math.abs(delta) < 60 ? C.green : Math.abs(delta) < 600 ? C.yellow : C.red;
    console.log(
      String(rounded).padEnd(14) +
      formatTPlus(periT).padEnd(18) +
      color + formatTPlus(delta).padEnd(14) + C.reset +
      (meta.periluneAlt + ' km').padEnd(12) +
      (splashT ? formatTPlus(splashT) : 'fail').padEnd(18)
    );
  }
}

// ---- 2D grid search ----
// node calibrate.mjs --search
//   Searches (TLI_DV, START_ANGLE_OFFSET) space for best match to NASA
//   perilune time AND altitude simultaneously.
function search() {
  console.log(`${C.bold}${C.cyan}2D SEARCH: (TLI_DV, START_ANGLE_OFFSET) → best match to NASA flyby${C.reset}\n`);

  const targetT = 432420;    // NASA perilune time
  const targetAlt = 6546;    // NASA perilune altitude

  let best = { score: Infinity };
  const results = [];

  for (let dv = 0.30; dv <= 0.40; dv += 0.005) {
    for (let sa = 2.85; sa <= 3.25; sa += 0.01) {
      const params = { ...overrides, TLI_DV: +dv.toFixed(3), START_ANGLE_OFFSET: +sa.toFixed(3) };
      const { meta } = runTrajectory(params);
      const pt = meta.periluneTime ?? 0;
      const pa = meta.periluneAlt ?? 0;
      const sd = meta.splashdown?.t ?? 0;

      const tErr = Math.abs(pt - targetT);
      const aErr = Math.abs(pa - targetAlt);
      const sdErr = sd > 0 ? Math.abs(sd - NASA_PARAMS.splashdownMs) : 999999;

      // Normalized score: time in minutes + altitude in thousands of km + splashdown penalty
      const score = (tErr / 60) + (aErr / 1000) + (sdErr / 3600);

      if (pa > 0 && pa < 50000) {  // only keep close flybys
        results.push({ dv, sa, pt, pa, sd, score });
      }

      if (pa > 100 && pa < 50000 && score < best.score) {
        best = { dv, sa, pt, pa, sd, score };
      }
    }
  }

  // Sort and print top 10
  results.sort((a, b) => a.score - b.score);
  const top = results.slice(0, 10);

  console.log(
    C.bold +
    'TLI_DV'.padEnd(10) +
    'SAO'.padEnd(8) +
    'perilune T+'.padEnd(18) +
    'Δperi T'.padEnd(14) +
    'peri alt'.padEnd(12) +
    'splashdown'.padEnd(18) +
    'score' +
    C.reset
  );
  console.log(C.dim + '─'.repeat(86) + C.reset);

  for (const r of top) {
    const dt = r.pt - targetT;
    const tColor = Math.abs(dt) < 60 ? C.green : Math.abs(dt) < 600 ? C.yellow : C.red;
    console.log(
      String(r.dv).padEnd(10) +
      String(r.sa).padEnd(8) +
      formatTPlus(r.pt).padEnd(18) +
      tColor + formatTPlus(dt).padEnd(14) + C.reset +
      (r.pa + ' km').padEnd(12) +
      (r.sd ? formatTPlus(r.sd) : 'fail').padEnd(18) +
      r.score.toFixed(1)
    );
  }

  if (best.score < Infinity) {
    console.log(`\n${C.bold}${C.green}BEST:${C.reset} TLI_DV=${best.dv} START_ANGLE_OFFSET=${best.sa}`);
    console.log(`  perilune: ${formatTPlus(best.pt)} alt=${best.pa} km`);
    console.log(`  splashdown: ${best.sd ? formatTPlus(best.sd) : 'fail'}`);
  }
}

// ---- Main ----
if (args.includes('--search')) {
  search();
} else if (sweepSpec) {
  sweep(sweepSpec);
} else {
  runAndReport(overrides, 'ARTEMIS II CALIBRATION');
}
