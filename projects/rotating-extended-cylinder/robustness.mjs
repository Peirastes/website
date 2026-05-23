// =====================================================================
// robustness.mjs  —  N2 robustness sweep over geometry (r, h) and friction μ
// ---------------------------------------------------------------------
// Brief §5.4 deliverable 2 / null hypothesis N2: does the tip-recover
// basin persist with nonzero area as the cylinder geometry and friction
// vary, or does it vanish / fragment? If it survives a robust range, the
// phenomenon is generic, not fine-tuned.
//
// For each (r, h, μ) we run a 2-D (τ, pulse) basin sweep and report the
// tip-recover AREA FRACTION. To make areas comparable across geometry,
// the τ-axis is normalised by each geometry's natural torque scale
//     τ_ref = a_tip · I_door / x      (a_tip = 2 g r / h),
// the peak door torque whose peak shelf acceleration just reaches a_tip.
// τ is swept over [0.5, 3.0]·τ_ref; pulse over [40, 300] ms (a time, so
// left in physical units). Geometry is varied one parameter at a time.
//
// Usage:  node robustness.mjs [--nt 16] [--np 10]
// =====================================================================

import { simulateRun, geometry, GRAVITY } from "./physicsCore.mjs";

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const NT = parseInt(getArg("--nt", "16"), 10);
const NP = parseInt(getArg("--np", "10"), 10);

const BASE = {
  m: 0.35, r: 0.033, h: 0.16, x0: 0.30, mu: 0.5,
  peakTau: 0, pulseWidth: 0.08, iDoor: 0.15, doorDamping: 0.05,
};
const PW_MIN = 0.04, PW_MAX = 0.30;
const TAU_LO_FRAC = 0.5, TAU_HI_FRAC = 3.0;

// Run a 2-D basin sweep at a given geometry; return regime fractions and the
// τ/τ_ref band edges at the default 80 ms pulse.
function basinAt(params) {
  const g = geometry(params);
  const tauRef = g.aTip * params.iDoor / params.x0;
  const tauLo = TAU_LO_FRAC * tauRef, tauHi = TAU_HI_FRAC * tauRef;
  const counts = { 'static': 0, 'slide': 0, 'tip-recover': 0, 'topple': 0 };
  let total = 0;
  for (let j = 0; j < NP; j++) {
    const pulse = PW_MIN + (PW_MAX - PW_MIN) * j / (NP - 1);
    for (let i = 0; i < NT; i++) {
      const tau = tauLo + (tauHi - tauLo) * i / (NT - 1);
      counts[simulateRun({ ...params, peakTau: tau, pulseWidth: pulse }).regime]++;
      total++;
    }
  }
  // Band edges (in τ/τ_ref) at the default pulse, finely sampled.
  let lo = null, hi = null;
  for (let k = 0; k <= 60; k++) {
    const f = TAU_LO_FRAC + (TAU_HI_FRAC - TAU_LO_FRAC) * k / 60;
    const reg = simulateRun({ ...params, peakTau: f * tauRef, pulseWidth: BASE.pulseWidth }).regime;
    if (reg === 'tip-recover') { if (lo === null) lo = f; hi = f; }
  }
  return {
    phiC: g.phiC * 180 / Math.PI,
    aTip: g.aTip, aSlip: g.aSlip, tipsFirst: g.aTip < g.aSlip,
    tauRef,
    fracTip: counts['tip-recover'] / total,
    fracSlide: counts['slide'] / total,
    fracTopple: counts['topple'] / total,
    fracStatic: counts['static'] / total,
    band: lo === null ? null : [lo, hi],
  };
}

function reportRow(label, params) {
  const b = basinAt(params);
  const bandStr = b.band ? `[${b.band[0].toFixed(2)},${b.band[1].toFixed(2)}]·τref` : "—none—";
  console.log(
    `  ${label.padEnd(14)} φc=${b.phiC.toFixed(1).padStart(4)}°  ` +
    `aTip/aSlip=${(b.aTip / b.aSlip).toFixed(2)}${b.tipsFirst ? " (tips 1st)" : " (SLIDES 1st)"}  ` +
    `tip-area=${(100 * b.fracTip).toFixed(1).padStart(4)}%  slide=${(100 * b.fracSlide).toFixed(0).padStart(3)}%  ` +
    `band@80ms=${bandStr}`
  );
  return b;
}

console.log(`\nN2 robustness sweep — inner grid ${NT}×${NP} per geometry, τ∈[${TAU_LO_FRAC},${TAU_HI_FRAC}]·τ_ref`);
console.log(`base: m=${BASE.m} r=${BASE.r} h=${BASE.h} μ=${BASE.mu} x=${BASE.x0} I_door=${BASE.iDoor}\n`);
const t0 = Date.now();

console.log("[A] vary radius r (h, μ fixed):");
for (const r of [0.025, 0.029, 0.033, 0.040, 0.050])
  reportRow(`r=${(r * 100).toFixed(1)}cm`, { ...BASE, r });

console.log("\n[B] vary height h (r, μ fixed):");
for (const h of [0.10, 0.13, 0.16, 0.20, 0.24])
  reportRow(`h=${(h * 100).toFixed(0)}cm`, { ...BASE, h });

console.log("\n[C] vary friction μ (r, h fixed):");
for (const mu of [0.20, 0.35, 0.50, 0.70, 1.00])
  reportRow(`μ=${mu.toFixed(2)}`, { ...BASE, mu });

console.log("\n[D] aspect ratio h/r at fixed slenderness extremes (μ=0.5):");
for (const [r, h] of [[0.050, 0.10], [0.040, 0.16], [0.033, 0.16], [0.029, 0.20], [0.025, 0.24]])
  reportRow(`r${(r*100).toFixed(1)}/h${(h*100).toFixed(0)} (h/r=${(h/r).toFixed(1)})`, { ...BASE, r, h });

console.log(`\nelapsed ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log("note: 'SLIDES 1st' (a_tip>a_slip ⇒ μ<2r/h) is where the tip basin is expected to shrink/fragment.\n");
