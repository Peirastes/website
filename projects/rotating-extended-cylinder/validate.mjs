// =====================================================================
// validate.mjs  —  analytical limiting-case validation of physicsCore
// ---------------------------------------------------------------------
// Run:  node validate.mjs
//
// The simulator is "not wrong" only if it reproduces results that can be
// derived independently. These checks tie the contact/integration model
// to closed-form facts about the edge-pivot pendulum:
//
//   1. Geometry    — φc, a_tip, a_slip match their formulas.
//   2. Separatrix  — released at rest below φc it recovers; above φc it
//                    topples. Validates the SIGN of the net torque across
//                    the unstable equilibrium (the term most affected by
//                    the pseudo-force sign fix).
//   3. Energy barrier — from upright, the minimum tilt-rate to just reach
//                    φc is φ̇_crit = √(2 m g (d−h/2) / I_edge). The sim must
//                    recover below it and topple above it, bracketing the
//                    analytic barrier.
//
// Exit code is non-zero if any check fails (CI-friendly).
// =====================================================================

import { geometry, makeTipState, simulateRun } from "./physicsCore.mjs";

const DEFAULT = {
  m: 0.35, r: 0.033, h: 0.16, x0: 0.30, mu: 0.5,
  peakTau: 0,            // forcing OFF for all validation runs
  pulseWidth: 0.08, iDoor: 0.15, doorDamping: 0.05,
};

let failures = 0;
const pass = (name, ok, detail) => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  —  " + detail : ""}`);
  if (!ok) failures++;
};
const approx = (a, b, tol) => Math.abs(a - b) <= tol;

// ---------------------------------------------------------------------
console.log("\n[1] Geometry / threshold formulas");
{
  const g = geometry(DEFAULT);
  const phiCdeg = g.phiC * 180 / Math.PI;
  pass("φc = arctan(2r/h)", approx(phiCdeg, 22.38, 0.05),
    `φc = ${phiCdeg.toFixed(2)}° (expected 22.38°)`);
  pass("a_tip = 2gr/h", approx(g.aTip, 4.047, 1e-3),
    `a_tip = ${g.aTip.toFixed(3)} m/s²`);
  pass("a_slip = μg", approx(g.aSlip, 4.905, 1e-3),
    `a_slip = ${g.aSlip.toFixed(3)} m/s²`);
  pass("tall/slender ⇒ a_tip < a_slip (tips before sliding)", g.aTip < g.aSlip,
    `${g.aTip.toFixed(2)} < ${g.aSlip.toFixed(2)}`);
}

// ---------------------------------------------------------------------
console.log("\n[2] Separatrix: released at rest, recover below φc / topple above");
{
  const g = geometry(DEFAULT);
  const below = simulateRun(DEFAULT, {
    initial: makeTipState(DEFAULT, 0.85 * g.phiC, 0), maxT: 4,
  });
  const above = simulateRun(DEFAULT, {
    initial: makeTipState(DEFAULT, 1.10 * g.phiC, 0), maxT: 4,
  });
  pass("released at 0.85·φc recovers (does not topple)", !below.toppled,
    `regime=${below.regime}, φmax=${below.phiMaxDeg.toFixed(1)}°`);
  pass("released at 1.10·φc topples", above.toppled,
    `regime=${above.regime}, φmax=${above.phiMaxDeg.toFixed(1)}°`);
}

// ---------------------------------------------------------------------
console.log("\n[3] Energy barrier: φ̇_crit from upright brackets recover/topple");
{
  const g = geometry(DEFAULT);
  const slow = simulateRun(DEFAULT, {
    initial: makeTipState(DEFAULT, 0.5 * Math.PI / 180, 0.80 * g.phiDotCrit), maxT: 4,
  });
  const fast = simulateRun(DEFAULT, {
    initial: makeTipState(DEFAULT, 0.5 * Math.PI / 180, 1.20 * g.phiDotCrit), maxT: 4,
  });
  console.log(`     φ̇_crit (analytic) = ${g.phiDotCrit.toFixed(3)} rad/s`);
  pass("kick at 0.80·φ̇_crit recovers", !slow.toppled,
    `regime=${slow.regime}, φmax=${slow.phiMaxDeg.toFixed(1)}°`);
  pass("kick at 1.20·φ̇_crit topples", fast.toppled,
    `regime=${fast.regime}, φmax=${fast.phiMaxDeg.toFixed(1)}°`);
}

// ---------------------------------------------------------------------
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : failures + " CHECK(S) FAILED"}\n`);
process.exit(failures === 0 ? 0 : 1);
