// =====================================================================
// sweep.mjs  —  2-D basin sweep over (peak τ, pulse width)
// ---------------------------------------------------------------------
// The Stage-3 enabler from the project brief §5.4: maps the four regimes
// across input space at fixed geometry, using the OUTCOME-based classifier
// (independent of the live HUD heuristic).
//
// Usage:
//   node sweep.mjs                 # default 28×18 grid, prints ASCII map + CSV
//   node sweep.mjs --nt 40 --np 24 # custom resolution
//   node sweep.mjs --csv basin.csv # also write a CSV grid
//   node sweep.mjs --line          # 1-D τ sweep at default pulse (table check)
//
// Each cell is one full trajectory; a 28×18 grid is ~500 runs (seconds).
// =====================================================================

import { writeFileSync } from "node:fs";
import { simulateRun, geometry } from "./physicsCore.mjs";

const argv = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const hasFlag = (flag) => argv.includes(flag);

const BASE = {
  m: 0.35, r: 0.033, h: 0.16, x0: 0.30, mu: 0.5,
  peakTau: 0, pulseWidth: 0.08, iDoor: 0.15, doorDamping: 0.05,
};

const GLYPH = { 'static': '.', 'slide': '~', 'tip-recover': '+', 'topple': '#' };
const regimeOf = (tau, pulse) =>
  simulateRun({ ...BASE, peakTau: tau, pulseWidth: pulse }).regime;

// ---------------------------------------------------------------------
// 1-D τ sweep at the default pulse — direct check against brief §3.4 table
// ---------------------------------------------------------------------
if (hasFlag("--line")) {
  const g = geometry(BASE);
  console.log(`\n1-D τ sweep at pulse = ${(BASE.pulseWidth * 1000).toFixed(0)} ms `
    + `(φc = ${(g.phiC * 180 / Math.PI).toFixed(1)}°)\n`);
  console.log("  peak τ    regime        φmax");
  let lo = null, hi = null;
  for (let tau = 1.0; tau <= 7.0 + 1e-9; tau += 0.25) {
    const res = simulateRun({ ...BASE, peakTau: tau });
    if (res.regime === 'tip-recover') { if (lo === null) lo = tau; hi = tau; }
    console.log(`  ${tau.toFixed(2).padStart(5)}     ${res.regime.padEnd(12)}  ${res.phiMaxDeg.toFixed(1)}°`);
  }
  if (lo !== null) {
    console.log(`\n  tip-recover band ≈ τ ∈ [${lo.toFixed(2)}, ${hi.toFixed(2)}] N·m`);
    console.log(`  (brief §3.4 reported ≈ [2.8, 5.3] N·m)\n`);
  } else {
    console.log("\n  no tip-recover band found in this sweep\n");
  }
  process.exit(0);
}

// ---------------------------------------------------------------------
// 2-D basin map
// ---------------------------------------------------------------------
const NT = parseInt(getArg("--nt", "28"), 10);   // peak-τ samples
const NP = parseInt(getArg("--np", "18"), 10);   // pulse-width samples
const TAU_MIN = 1.0, TAU_MAX = 7.0;
const PW_MIN = 0.04, PW_MAX = 0.30;

const g = geometry(BASE);
console.log(`\n2-D basin sweep  ${NT}×${NP}  (${NT * NP} runs)`);
console.log(`geometry: m=${BASE.m} r=${BASE.r} h=${BASE.h} μ=${BASE.mu} `
  + `I_door=${BASE.iDoor} | φc=${(g.phiC * 180 / Math.PI).toFixed(1)}°\n`);

const grid = [];          // grid[pulseRow][tauCol]
const counts = { 'static': 0, 'slide': 0, 'tip-recover': 0, 'topple': 0 };
const t0 = Date.now();

for (let j = 0; j < NP; j++) {
  const pulse = PW_MIN + (PW_MAX - PW_MIN) * j / (NP - 1);
  const row = [];
  for (let i = 0; i < NT; i++) {
    const tau = TAU_MIN + (TAU_MAX - TAU_MIN) * i / (NT - 1);
    const reg = regimeOf(tau, pulse);
    counts[reg]++;
    row.push(reg);
  }
  grid.push({ pulse, row });
}

// ASCII map: pulse increases downward, τ increases rightward.
console.log(`  legend:  . static   ~ slide   + tip-recover   # topple`);
console.log(`  τ →  ${TAU_MIN.toFixed(1)} … ${TAU_MAX.toFixed(1)} N·m,   pulse ↓ ${(PW_MIN*1000).toFixed(0)} … ${(PW_MAX*1000).toFixed(0)} ms\n`);
for (let j = NP - 1; j >= 0; j--) {   // print long pulses at top
  const { pulse, row } = grid[j];
  console.log(`  ${(pulse * 1000).toFixed(0).padStart(3)}ms |` + row.map(r => GLYPH[r]).join(""));
}

const total = NT * NP;
console.log(`\n  regime fractions (${total} cells, ${((Date.now() - t0) / 1000).toFixed(1)}s):`);
for (const k of ['static', 'slide', 'tip-recover', 'topple']) {
  console.log(`    ${k.padEnd(12)} ${counts[k].toString().padStart(4)}  ${(100 * counts[k] / total).toFixed(1)}%`);
}
console.log(`\n  tip-recover basin area fraction = ${(100 * counts['tip-recover'] / total).toFixed(1)}% `
  + `→ ${counts['tip-recover'] > 0 ? "nonzero-measure 2-D band (consistent with central hypothesis)" : "EMPTY (would falsify N1)"}\n`);

const csvPath = getArg("--csv", null);
if (csvPath) {
  let csv = "pulse_s,tau_Nm,regime\n";
  for (const { pulse, row } of grid) {
    const tausWithReg = row.map((reg, i) =>
      `${pulse.toFixed(4)},${(TAU_MIN + (TAU_MAX - TAU_MIN) * i / (NT - 1)).toFixed(3)},${reg}`);
    csv += tausWithReg.join("\n") + "\n";
  }
  writeFileSync(csvPath, csv);
  console.log(`  wrote ${csvPath}\n`);
}
