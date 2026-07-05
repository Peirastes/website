// test_physics.js — Phase A acceptance tests for the Aeropendulum Lab
//
// Strategy: write tests that try to FALSIFY the physics, not merely confirm it.
// Each test has an explicit analytical expectation (or a documented tolerance)
// and bails loudly if the sim disagrees. This is the SOP 2 validation step:
// "Simulation reproduces analytical solutions within acceptable tolerance."
//
// Run with:
//   cd Website/projects/aeropendulum-lab && node test_physics.js

import {
  DEFAULT_CONFIG,
  Motor,
  Aeropendulum,
  StaticController,
  equilibriumAngle,
  hangingPeriod,
  RAD2DEG,
  DEG2RAD,
} from './physics.js';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures = [];

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
    failures.push(label);
  }
}

function approxEqual(a, b, tol) {
  return Math.abs(a - b) <= tol;
}

function section(title) {
  console.log(`\n── ${title}`);
}

// ---------------------------------------------------------------------------
// 1. Motor model — edge cases + monotonicity
// ---------------------------------------------------------------------------

section('Motor thrust model');
{
  const m = new Motor(); // defaults: T_max=0.60, pwm_dead=0.08
  const pwm_dead_raw = 0.08 * 255; // ≈ 20.4

  ok('thrust(0) = 0',
    m.thrust(0) === 0);

  ok('thrust below deadband = 0',
    m.thrust(pwm_dead_raw - 1) === 0);

  ok('thrust(255) = T_max (0.60 N)',
    approxEqual(m.thrust(255), 0.60, 1e-9));

  // Monotonic in operating range
  let prev = -Infinity;
  let monotonic = true;
  for (let p = 0; p <= 255; p += 1) {
    const t = m.thrust(p);
    if (t < prev - 1e-12) { monotonic = false; break; }
    prev = t;
  }
  ok('thrust is monotonically non-decreasing over [0, 255]', monotonic);

  // Clamping behavior
  ok('thrust above 255 clamps to T_max',
    approxEqual(m.thrust(300), 0.60, 1e-9));
  ok('thrust below 0 clamps to 0',
    m.thrust(-10) === 0);
}

// ---------------------------------------------------------------------------
// 2. Analytical small-angle natural period
//
// For the default meter-stick geometry (m_arm=0.1, L=1.0, m_motor=0.005),
// the hanging-equilibrium period should be ≈ 1.68 s.
// ---------------------------------------------------------------------------

section('Hanging-equilibrium natural period (analytical + numerical)');
{
  const T_analytical = hangingPeriod();
  console.log(`       T_analytical = ${T_analytical.toFixed(4)} s`);

  ok('analytical period in expected range 1.6–1.8 s',
    T_analytical > 1.6 && T_analytical < 1.8,
    `got ${T_analytical.toFixed(4)}`);

  // Numerical: start just off hanging (−π/2 + 0.5°), no friction, no thrust,
  // integrate for several periods, measure zero crossings of the angular
  // velocity (peaks of angle), compute period.
  const pend = new Aeropendulum({
    b: 0,                       // no friction
    theta_0: -Math.PI / 2 + 0.5 * DEG2RAD,
    omega_0: 0,
  });

  const dt = 1e-4;              // 10 kHz — high rate for clean period measurement
  const nSteps = Math.round(5 * T_analytical / dt);
  const peakTimes = [];
  let omegaPrev = 0;

  for (let i = 0; i < nSteps; i++) {
    pend.step(dt, 0);
    // Detect omega zero crossings (from + to −) = angle peaks
    if (omegaPrev > 0 && pend.omega <= 0) {
      peakTimes.push(i * dt);
    }
    omegaPrev = pend.omega;
  }

  if (peakTimes.length >= 2) {
    const intervals = [];
    for (let k = 1; k < peakTimes.length; k++) {
      intervals.push(peakTimes[k] - peakTimes[k - 1]);
    }
    const T_numerical =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;
    console.log(`       T_numerical  = ${T_numerical.toFixed(4)} s  (${peakTimes.length} peaks)`);

    ok('numerical period matches analytical within 1%',
      approxEqual(T_numerical, T_analytical, 0.01 * T_analytical),
      `Δ = ${((T_numerical - T_analytical) / T_analytical * 100).toFixed(3)}%`);
  } else {
    ok('detected ≥2 period peaks in 5× nominal duration',
      false,
      `only ${peakTimes.length} peaks found`);
  }
}

// ---------------------------------------------------------------------------
// 3. Energy conservation (no friction, no thrust)
// ---------------------------------------------------------------------------

section('Energy conservation in the frictionless case');
{
  const pend = new Aeropendulum({
    b: 0,
    theta_0: -Math.PI / 2 + 10 * DEG2RAD,  // 10° above hanging
    omega_0: 0,
  });

  const E0 = pend.energy();
  const dt = 1e-4;
  const T = hangingPeriod();
  const nSteps = Math.round(3 * T / dt);

  let E_max = E0;
  let E_min = E0;
  for (let i = 0; i < nSteps; i++) {
    pend.step(dt, 0);
    const E = pend.energy();
    if (E > E_max) E_max = E;
    if (E < E_min) E_min = E;
  }

  const drift = Math.max(Math.abs(E_max - E0), Math.abs(E_min - E0));
  const relative_drift = drift / E0;
  console.log(`       E0 = ${E0.toFixed(6)} J, drift = ${drift.toExponential(3)} J (${(relative_drift * 100).toFixed(3)}%)`);

  ok('energy drift < 2% over 3 periods (semi-implicit Euler tolerance)',
    relative_drift < 0.02,
    `drift was ${(relative_drift * 100).toFixed(3)}%`);
}

// ---------------------------------------------------------------------------
// 4. Damping decay — amplitude should shrink with friction on
// ---------------------------------------------------------------------------

section('Damped oscillation (friction present)');
{
  const pend = new Aeropendulum({
    b: 0.02,                                  // noticeable friction
    theta_0: -Math.PI / 2 + 20 * DEG2RAD,    // 20° above hanging
    omega_0: 0,
  });

  const dt = 1e-4;
  const T = hangingPeriod();
  const nSteps = Math.round(6 * T / dt);

  let maxAbsDelta_firstPeriod = 0;
  let maxAbsDelta_lastPeriod  = 0;
  const stepsPerPeriod = Math.round(T / dt);

  for (let i = 0; i < nSteps; i++) {
    pend.step(dt, 0);
    const delta = Math.abs(pend.theta + Math.PI / 2); // |θ − (−π/2)|
    if (i < stepsPerPeriod && delta > maxAbsDelta_firstPeriod) {
      maxAbsDelta_firstPeriod = delta;
    }
    if (i > nSteps - stepsPerPeriod && delta > maxAbsDelta_lastPeriod) {
      maxAbsDelta_lastPeriod = delta;
    }
  }

  console.log(`       peak δ first period: ${(maxAbsDelta_firstPeriod * RAD2DEG).toFixed(3)}°`);
  console.log(`       peak δ last  period: ${(maxAbsDelta_lastPeriod  * RAD2DEG).toFixed(3)}°`);

  ok('amplitude decays (last period peak < first period peak)',
    maxAbsDelta_lastPeriod < maxAbsDelta_firstPeriod);

  ok('amplitude doesn\'t explode (last < 21°)',
    maxAbsDelta_lastPeriod * RAD2DEG < 21);
}

// ---------------------------------------------------------------------------
// 5. Analytical equilibrium solver + numerical cross-check
// ---------------------------------------------------------------------------

section('Static equilibrium solver');
{
  // With F = 0 and default M_eff, equilibria should be at ±90°
  const eq0 = equilibriumAngle(0);
  ok('F=0 stable equilibrium at −90° (hanging)',
    approxEqual(eq0.stable_deg, -90, 1e-9));
  ok('F=0 unstable equilibrium at +90° (inverted)',
    approxEqual(eq0.unstable_deg, 90, 1e-9));

  // With F exactly gM_eff, both equilibria at 0° (horizontal)
  const M_eff = DEFAULT_CONFIG.m_arm / 2 + DEFAULT_CONFIG.m_motor;
  const F_horizontal = DEFAULT_CONFIG.g * M_eff;
  const eq_h = equilibriumAngle(F_horizontal);
  ok('F=g·M_eff stable equilibrium at 0°',
    approxEqual(eq_h.stable_deg,   0, 1e-6));
  ok('F=g·M_eff unstable equilibrium at 0°',
    approxEqual(eq_h.unstable_deg, 0, 1e-6));

  // F > gM_eff should return null (no equilibrium)
  ok('F > g·M_eff returns null',
    equilibriumAngle(F_horizontal * 1.5) === null);

  // Cross-check: for an intermediate F, the analytical equilibrium should
  // produce zero angular acceleration when plugged into the physics.
  const F_test = 0.3;
  const eq_test = equilibriumAngle(F_test);
  console.log(`       F=${F_test} N → stable=${eq_test.stable_deg.toFixed(3)}°, unstable=${eq_test.unstable_deg.toFixed(3)}°`);

  const pend_stable = new Aeropendulum({
    b: 0,
    theta_0: eq_test.stable_deg * DEG2RAD,
    omega_0: 0,
  });
  const alpha_stable = pend_stable.accel(pend_stable.theta, 0, F_test);
  ok('stable-branch angular accel at equilibrium ≈ 0',
    Math.abs(alpha_stable) < 1e-10,
    `|α| = ${Math.abs(alpha_stable).toExponential(3)}`);

  const pend_unstable = new Aeropendulum({
    b: 0,
    theta_0: eq_test.unstable_deg * DEG2RAD,
    omega_0: 0,
  });
  const alpha_unstable = pend_unstable.accel(pend_unstable.theta, 0, F_test);
  ok('unstable-branch angular accel at equilibrium ≈ 0',
    Math.abs(alpha_unstable) < 1e-10,
    `|α| = ${Math.abs(alpha_unstable).toExponential(3)}`);
}

// ---------------------------------------------------------------------------
// 6. StaticController — PD math matches firmware hand-computation
// ---------------------------------------------------------------------------

section('StaticController PD law');
{
  const ctrl = new StaticController();
  ctrl.pwmPrev = 100;   // start with some prior PWM so we can see slew effects

  // Hand calculation with default gains (Kp=50, Kd=5.0, DUTY_BASE=120,
  // theta_ref_deg=5.0, E_DEADBAND_deg=5.0):
  //
  // At theta=−1°, omega=0: e = 5−(−1) = 6° (> 5° deadband)
  //   uP = 50·6 = 300
  //   uD = −5·0 = 0
  //   u  = 120 + 300 + 0 = 420 → clamp to 255
  //   slew: from pwmPrev=100, delta = 255−100 = 155 → clamp to ±3 → 103
  const out1 = ctrl.update(-1, 0, 1 / 200);
  ok('slew-limited output = 103 on first call',
    out1 === 103,
    `got ${out1}`);

  ctrl.reset();
  ctrl.pwmPrev = 120;

  // Test deadband: theta=4°, omega=0, theta_ref=5 → e = 1° (< 5° deadband, zeroed)
  //   uP = 0
  //   uD = 0
  //   u  = 120 + 0 + 0 = 120
  //   slew: from pwmPrev=120, delta = 0 → pwm = 120
  const out2 = ctrl.update(4, 0, 1 / 200);
  ok('deadband zeroes error → output = DUTY_BASE',
    out2 === 120,
    `got ${out2}`);

  ctrl.reset();
  ctrl.pwmPrev = 120;

  // Test derivative term: theta=5° (e=0), omega=+10 dps
  //   uP = 0
  //   uD = −5·10 = −50
  //   u  = 120 + 0 − 50 = 70
  //   slew: delta = 70−120 = −50 → clamp to −3 → 117
  const out3 = ctrl.update(5, 10, 1 / 200);
  ok('derivative term opposes motion (slew-limited)',
    out3 === 117,
    `got ${out3}`);

  // Test integral action (enableIntegral on)
  const ctrlI = new StaticController({ enableIntegral: true });
  ctrlI.pwmPrev = 120;
  // theta=−10° (e=15°), omega=0, dt=0.005 s
  //   I += 0.2 · 15 · 0.005 = 0.015 (not yet clamped)
  //   uP = 50·15 = 750
  //   uD = 0
  //   u  = 120 + 750 + 0 + 0.015 = 870.015 → clamp to 255
  //   slew: → 123
  const outI1 = ctrlI.update(-10, 0, 0.005);
  ok('enableIntegral accumulates I term without crashing',
    outI1 === 123 && ctrlI.Iterm > 0,
    `pwm=${outI1}, Iterm=${ctrlI.Iterm}`);

  // Deadband leak: small error with integral on
  const ctrlLeak = new StaticController({ enableIntegral: true });
  ctrlLeak.Iterm = 10;
  ctrlLeak.pwmPrev = 120;
  // theta=5° (e=0, in deadband), omega=0 → Iterm leaks: 10 · 0.98 = 9.8
  ctrlLeak.update(5, 0, 0.005);
  ok('integral leaks in deadband (10 → 9.8)',
    approxEqual(ctrlLeak.Iterm, 9.8, 1e-9),
    `Iterm=${ctrlLeak.Iterm}`);
}

// ---------------------------------------------------------------------------
// 7. Closed-loop structural smoke test
//
// This validates that the sim RUNS without crashing when driven by the
// controller for a realistic duration. It does NOT assert convergence to the
// setpoint — whether the firmware gains stabilize the UNSTABLE +5° equilibrium
// in simulation depends on parameters (especially T_max, m_arm, b) that need
// bench calibration. Convergence is a Phase D concern, not Phase A.
//
// What Phase A WILL catch:
//   • NaN / Infinity propagation
//   • PWM escaping its [0, 255] range
//   • State becoming a non-number
// ---------------------------------------------------------------------------

section('Closed-loop structural smoke test');
{
  const pend = new Aeropendulum({
    theta_0: 0,     // cold start from horizontal (hardest case)
    omega_0: 0,
  });
  const motor = new Motor();
  const ctrl  = new StaticController();

  const f_phys = 1000;                // 1 kHz physics
  const f_ctrl = 200;                 // 200 Hz controller (matches firmware)
  const dt_phys = 1 / f_phys;
  const dt_ctrl = 1 / f_ctrl;
  const phys_per_ctrl = f_phys / f_ctrl;

  const duration_s = 10;
  const nCtrl = duration_s * f_ctrl;

  let pwm = 0;
  let minPwm = Infinity, maxPwm = -Infinity;
  let anyNaN = false;

  for (let i = 0; i < nCtrl; i++) {
    pwm = ctrl.update(pend.theta_deg, pend.omega_dps, dt_ctrl);
    const F = motor.thrust(pwm);

    for (let k = 0; k < phys_per_ctrl; k++) {
      pend.step(dt_phys, F);
    }

    if (!Number.isFinite(pend.theta) || !Number.isFinite(pend.omega)) {
      anyNaN = true;
      break;
    }
    if (pwm < minPwm) minPwm = pwm;
    if (pwm > maxPwm) maxPwm = pwm;
  }

  console.log(`       PWM range: ${minPwm} to ${maxPwm}`);
  console.log(`       final θ = ${pend.theta_deg.toFixed(3)}°, final ω = ${pend.omega_dps.toFixed(3)} dps`);

  ok('no NaN over 10 seconds of closed-loop sim',
    !anyNaN);
  ok('PWM stays within [0, 255]',
    minPwm >= 0 && maxPwm <= 255);
  ok('final state is finite',
    Number.isFinite(pend.theta) && Number.isFinite(pend.omega));
}

// ---------------------------------------------------------------------------
// 7b. Open-loop constant-thrust test — swing toward the analytical stable
// equilibrium with NO controller.
//
// This is the cleanest end-to-end physics validation:
//   • Hang at θ = −π/2, apply constant thrust F for several seconds
//   • Friction damps the transient
//   • The arm should settle near the analytical stable equilibrium
//     θ_eq = −arccos(F / (g·M_eff))
//
// No controller, no gain tuning, no assumptions about the upper branch.
// Just Newton's 2nd law + the equilibrium solver, cross-checked.
// ---------------------------------------------------------------------------

section('Open-loop constant-thrust → stable equilibrium');
{
  const F_const = 0.25;                 // N, well within gM_eff = 0.5396
  const eq = equilibriumAngle(F_const);
  console.log(`       analytical stable eq for F=${F_const} N: ${eq.stable_deg.toFixed(3)}°`);

  const pend = new Aeropendulum({
    b: 0.030,                           // realistic bearing friction; ζ ≈ 0.11
    theta_0: -Math.PI / 2,              // start hanging
    omega_0: 0,
  });

  const dt = 1e-4;                      // 10 kHz
  const duration_s = 20;                // ≥ 10/(ζω_n) ≈ 13 s to reach 1%
  const nSteps = Math.round(duration_s / dt);

  // Track the final second for settling assessment
  const finalSecondStart = (duration_s - 1) / dt;
  let finalThetaMin =  Infinity, finalThetaMax = -Infinity;

  for (let i = 0; i < nSteps; i++) {
    pend.step(dt, F_const);
    if (i >= finalSecondStart) {
      if (pend.theta_deg < finalThetaMin) finalThetaMin = pend.theta_deg;
      if (pend.theta_deg > finalThetaMax) finalThetaMax = pend.theta_deg;
    }
  }

  const finalMid = (finalThetaMin + finalThetaMax) / 2;
  const finalSpread = finalThetaMax - finalThetaMin;
  console.log(`       final second: θ ∈ [${finalThetaMin.toFixed(3)}°, ${finalThetaMax.toFixed(3)}°]`);
  console.log(`       midpoint = ${finalMid.toFixed(3)}°, spread = ${finalSpread.toFixed(4)}°`);

  ok('final midpoint within 2° of analytical stable equilibrium',
    Math.abs(finalMid - eq.stable_deg) < 2.0,
    `|${finalMid.toFixed(2)} − ${eq.stable_deg.toFixed(2)}| = ${Math.abs(finalMid - eq.stable_deg).toFixed(3)}°`);
  ok('final oscillation has settled (<1° spread)',
    finalSpread < 1.0,
    `spread = ${finalSpread.toFixed(3)}°`);
}

// ---------------------------------------------------------------------------
// 8. Free-pendulum release from -30° (below hanging ref) — PM WBS sanity case
//
// Per the WBS, this should produce a damped oscillation. We verify that:
//   - state remains bounded
//   - the arm passes through hanging (−90°) at least twice (= half period + more)
// ---------------------------------------------------------------------------

section('Free pendulum release from -30°');
{
  // "−30°" in the WBS sense means 30° above the hanging position.
  // In our convention, that is θ = −π/2 + 30° = −60°.
  const pend = new Aeropendulum({
    theta_0: -60 * DEG2RAD,
    omega_0: 0,
  });

  const dt = 1e-4;
  const duration = 5;
  const nSteps = Math.round(duration / dt);

  let zeroCrossings = 0;
  let prevDelta = pend.theta + Math.PI / 2;  // signed δ from hanging

  for (let i = 0; i < nSteps; i++) {
    pend.step(dt, 0);
    const delta = pend.theta + Math.PI / 2;
    if ((prevDelta > 0 && delta <= 0) || (prevDelta < 0 && delta >= 0)) {
      zeroCrossings++;
    }
    prevDelta = delta;
  }

  console.log(`       zero crossings in 5 s: ${zeroCrossings}`);

  ok('arm oscillates through hanging position (≥2 zero crossings)',
    zeroCrossings >= 2);
  ok('state stays finite',
    Number.isFinite(pend.theta) && Number.isFinite(pend.omega));
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  Phase A acceptance: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════════════════════');

if (failed > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  • ${f}`));
  process.exit(1);
}

console.log('\n  All tests pass. Physics core is ready for Phase B (UI shell).');
process.exit(0);
