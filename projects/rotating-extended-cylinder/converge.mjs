// =====================================================================
// converge.mjs  —  N1 convergence study
// ---------------------------------------------------------------------
// Brief §5.2 (N1) / §5.4 deliverable 3: is the tip-recover band a real
// feature, or an artifact of the numerical/contact parameters chosen for
// stability rather than physics? We hold the input fixed and vary, one at
// a time, the knobs N1 names:
//     dt          integration substep
//     k_N (+ c_N) contact penalty stiffness / damping
//     seedDur     the flat→tip angular-velocity seed duration
//     hysteresis  the tilt-in / tilt-out + ω-out recovery thresholds
//
// Two observables:
//   (1) φ_max at a fixed BASIN-INTERIOR point (τ=4.0 N·m, 80 ms) — should
//       converge to a limit as dt→0, k_N→∞.
//   (2) τ_topple, the upper edge of the band at 80 ms, found by bisection
//       — the boundary whose reality N1 questions. If it converges, the
//       band is not a numerical artifact.
//
// Convergence is judged by whether successive refinements change the
// observable by less than a stated tolerance. No prediction is made about
// the limit; the measurements decide.
//
// Usage:  node converge.mjs
// =====================================================================

import { simulateRun } from "./physicsCore.mjs";

const BASE = {
  m: 0.35, r: 0.033, h: 0.16, x0: 0.30, mu: 0.5,
  peakTau: 4.0, pulseWidth: 0.08, iDoor: 0.15, doorDamping: 0.05,
};
const RUN = { maxT: 3, restAfter: 0.8 };

// φ_max (deg) at the interior point for a given knob override + dt.
function phiMaxAt(over = {}, dt = 1 / 2000) {
  return simulateRun({ ...BASE, ...over }, { ...RUN, dt }).phiMaxDeg;
}

// τ_topple at 80 ms via bisection: largest τ that still recovers.
// Assumes monotonic recover→topple across the bracket (verified by the band).
function tauTopple(over = {}, dt = 1 / 2000, lo = 3.5, hi = 6.5) {
  const topples = (tau) =>
    simulateRun({ ...BASE, ...over, peakTau: tau }, { ...RUN, dt }).toppled;
  if (!topples(hi)) return Number.NaN;   // bracket failed
  if (topples(lo)) return Number.NaN;
  for (let k = 0; k < 22; k++) {
    const mid = 0.5 * (lo + hi);
    if (topples(mid)) hi = mid; else lo = mid;
  }
  return 0.5 * (lo + hi);
}

const table = (rows) => rows.forEach(r => console.log("    " + r));
const fmt = (x, n = 3) => Number.isNaN(x) ? " n/a " : x.toFixed(n);

console.log(`\nN1 convergence study  (interior point: τ=${BASE.peakTau} N·m, ${BASE.pulseWidth*1000} ms; band edge at 80 ms)\n`);
const t0 = Date.now();

// ---------------------------------------------------------------------
console.log("[1] dt refinement   (k_N = 80000 default)");
console.log("      dt (s)      φmax(deg)    τ_topple(N·m)");
{
  let prevPhi = null, prevTau = null;
  for (const dt of [1/1000, 1/2000, 1/4000, 1/8000, 1/16000]) {
    const phi = phiMaxAt({}, dt);
    const tau = tauTopple({}, dt);
    const dPhi = prevPhi === null ? "" : `   Δφ=${(phi - prevPhi >= 0 ? "+" : "")}${(phi - prevPhi).toFixed(3)}`;
    const dTau = prevTau === null ? "" : `  Δτ=${(tau - prevTau >= 0 ? "+" : "")}${(tau - prevTau).toFixed(4)}`;
    table([`${fmt(dt,6).padStart(9)}    ${fmt(phi,3).padStart(7)}      ${fmt(tau,4).padStart(7)}${dPhi}${dTau}`]);
    prevPhi = phi; prevTau = tau;
  }
}

// ---------------------------------------------------------------------
console.log("\n[2] contact stiffness k_N   (dt = 1/4000, c_N scaled ∝ √k_N)");
console.log("      k_N (N/m)   φmax(deg)    τ_topple(N·m)");
{
  let prevPhi = null, prevTau = null;
  for (const kN of [20000, 40000, 80000, 160000, 320000]) {
    const cN = 200 * Math.sqrt(kN / 80000);   // keep damping ratio roughly fixed
    const phi = phiMaxAt({ kN, cN }, 1/4000);
    const tau = tauTopple({ kN, cN }, 1/4000);
    const dPhi = prevPhi === null ? "" : `   Δφ=${(phi - prevPhi >= 0 ? "+" : "")}${(phi - prevPhi).toFixed(3)}`;
    const dTau = prevTau === null ? "" : `  Δτ=${(tau - prevTau >= 0 ? "+" : "")}${(tau - prevTau).toFixed(4)}`;
    table([`${kN.toString().padStart(9)}    ${fmt(phi,3).padStart(7)}      ${fmt(tau,4).padStart(7)}${dPhi}${dTau}`]);
    prevPhi = phi; prevTau = tau;
  }
}

// ---------------------------------------------------------------------
console.log("\n[3] tip-seed duration seedDur   (dt = 1/4000)");
console.log("      seedDur(s)  φmax(deg)    τ_topple(N·m)");
for (const seedDur of [0.0, 0.0015, 0.003, 0.006, 0.012]) {
  table([`${fmt(seedDur,4).padStart(9)}    ${fmt(phiMaxAt({ seedDur }, 1/4000),3).padStart(7)}      ${fmt(tauTopple({ seedDur }, 1/4000),4).padStart(7)}`]);
}

// ---------------------------------------------------------------------
console.log("\n[4] hysteresis thresholds   (dt = 1/4000; in=tilt-enter, out=tilt-recover°, ωout=rad/s)");
console.log("      in°   out°   ωout    φmax(deg)   τ_topple(N·m)");
const D = Math.PI / 180;
for (const [inv, outv, wout] of [
  [0.25, 0.01, 0.025], [0.5, 0.02, 0.05], [1.0, 0.05, 0.10], [2.0, 0.10, 0.20],
]) {
  const over = { tiltFlatThresh: inv * D, tiltRecThresh: outv * D, omegaRecThresh: wout };
  table([`${inv.toFixed(2).padStart(6)} ${outv.toFixed(2).padStart(5)} ${wout.toFixed(3).padStart(6)}    ${fmt(phiMaxAt(over,1/4000),3).padStart(7)}     ${fmt(tauTopple(over,1/4000),4).padStart(7)}`]);
}

console.log(`\nelapsed ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log("N1 is REJECTED (band is robust) if φmax and τ_topple settle as dt→0 and k_N→∞,");
console.log("and shift only mildly with seedDur/hysteresis. Large drift would SUPPORT N1.\n");
