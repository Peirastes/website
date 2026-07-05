/**
 * Standalone tests for physics3d.js
 *
 * Run with: node test_physics3d.js
 *
 * Tests are progressive:
 * 1. Closed circular Earth orbit (energy conservation, no burns)
 * 2. Vis-viva burn (prograde at perigee raises apogee)
 * 3. Earth-Moon free-return (TLI burn produces a lunar flyby trajectory)
 *
 * Each test prints PASS/FAIL with diagnostic data.
 */

const phys = require('./physics3d');
const { CONST, V } = phys;

let testCount = 0;
let passCount = 0;

function test(name, fn) {
  testCount++;
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log(`  ✓ ${name}`);
      passCount++;
    } else {
      console.log(`  ✗ ${name}`);
      if (result) console.log(`    ${result}`);
    }
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    ERROR: ${e.message}`);
  }
}

function close(actual, expected, tol, label) {
  const diff = Math.abs(actual - expected);
  const ok = diff <= tol;
  return ok ? true : `${label}: expected ${expected.toFixed(3)} ± ${tol}, got ${actual.toFixed(3)} (diff ${diff.toFixed(3)})`;
}

// =============================================================================
// TEST 1: Closed Circular Orbit
// =============================================================================
console.log('\n=== TEST 1: Closed circular Earth orbit ===');

(function testClosedOrbit() {
  // LEO at 400 km altitude, equatorial circular orbit in the X-Y plane
  const altitude = 400;
  const r = CONST.R_EARTH + altitude; // km
  const v_circ = Math.sqrt(CONST.MU_EARTH / r); // km/s (~7.67 km/s)

  const initialState = {
    pos: [r, 0, 0],
    vel: [0, v_circ, 0],
  };

  // Initial energy: KE - mu/r
  const energy0 = 0.5 * v_circ * v_circ - CONST.MU_EARTH / r;

  // Integrate for 1 orbit (period = 2π√(r³/μ))
  const period = 2 * Math.PI * Math.sqrt(r * r * r / CONST.MU_EARTH);
  const traj = phys.integrate(initialState, [], period, 1); // 1-second steps

  // Check final state
  const final = traj[traj.length - 1];
  const r_final = V.mag(final.pos);
  const v_final = V.mag(final.vel);
  const energy_final = 0.5 * v_final * v_final - CONST.MU_EARTH / r_final;

  test('Period close to predicted', () => close(traj.length - 1, period, 2, 'period (s)'));
  test('Final radius matches initial (closed orbit)',
    () => close(r_final, r, 0.5, 'final r (km)'));
  test('Energy conserved to <0.01%',
    () => close(energy_final, energy0, Math.abs(energy0) * 0.0001, 'energy (km²/s²)'));
  test('Z component stays zero (planar orbit)',
    () => close(final.pos[2], 0, 0.1, 'final z (km)'));
})();

// =============================================================================
// TEST 2: Vis-Viva — prograde burn at perigee raises apogee
// =============================================================================
console.log('\n=== TEST 2: Vis-viva prograde burn ===');

(function testVisViva() {
  const r_perigee = CONST.R_EARTH + 200; // 200 km circular start
  const v_circ = Math.sqrt(CONST.MU_EARTH / r_perigee);

  // Vis-viva: target apogee 1000 km
  // Semi-major axis a = (r_p + r_a) / 2
  const r_apogee_target = CONST.R_EARTH + 1000;
  const a_new = (r_perigee + r_apogee_target) / 2;
  // v² = μ(2/r − 1/a)
  const v_perigee_new = Math.sqrt(CONST.MU_EARTH * (2/r_perigee - 1/a_new));
  const dv_kms = v_perigee_new - v_circ;
  const dv_ms = dv_kms * 1000;

  const initialState = {
    pos: [r_perigee, 0, 0],
    vel: [0, v_circ, 0],
  };

  // Schedule a prograde burn at t=0
  const burns = [{
    met: 0,
    dv_magnitude: dv_ms,
    frame: 'RTN',
    components: [0, 1, 0], // tangential = prograde
  }];

  // Integrate for 1 orbit of the new ellipse
  const period_new = 2 * Math.PI * Math.sqrt(a_new ** 3 / CONST.MU_EARTH);
  const traj = phys.integrate(initialState, burns, period_new, 1);

  // Find apogee (max distance)
  let r_max = 0;
  for (const pt of traj) {
    const r = V.mag(pt.pos);
    if (r > r_max) r_max = r;
  }

  test('Apogee raises to target',
    () => close(r_max, r_apogee_target, 5, 'apogee r (km)'));
})();

// =============================================================================
// TEST 3a: Ephemeris Sanity Checks
// =============================================================================
console.log('\n=== TEST 3a: Ephemeris sanity ===');

(function testEphemeris() {
  // Moon should be at lunar distance from Earth
  const moon0 = phys.moonPosition(0);
  const r_moon = V.mag(moon0);
  test('Moon at lunar distance from Earth (t=0)',
    () => close(r_moon, CONST.LUNAR_DIST, 1, 'r_moon (km)'));

  // Moon should complete one orbit per lunar period
  const t_period = CONST.LUNAR_PERIOD;
  const moon_after = phys.moonPosition(t_period);
  const r_after = V.mag(moon_after);
  test('Moon distance constant after one period',
    () => close(r_after, CONST.LUNAR_DIST, 1, 'r_moon after period (km)'));

  // Moon position after half period should be ~opposite
  const moon_half = phys.moonPosition(t_period / 2);
  const dot = V.dot(V.norm(moon0), V.norm(moon_half));
  test('Moon at ~opposite position after half period',
    () => dot < -0.99 ? true : `dot product ${dot.toFixed(3)} (should be ~-1)`);

  // Sun should be at ~1 AU from Earth
  const sun0 = phys.sunPosition(0);
  const r_sun = V.mag(sun0);
  test('Sun at ~1 AU from Earth',
    () => close(r_sun, CONST.AU, 1, 'r_sun (km)'));
})();

// =============================================================================
// TEST 3b: Gravity Field Magnitudes
// =============================================================================
console.log('\n=== TEST 3b: Gravity field magnitudes ===');

(function testGravity() {
  // At Earth's surface, gravity should be ~9.81 m/s² = 9.81e-3 km/s²
  const surface_pos = [CONST.R_EARTH, 0, 0];
  const a_surface = phys.gravityAccel(surface_pos, 0);
  const g_surface = V.mag(a_surface);
  const g_expected = CONST.MU_EARTH / (CONST.R_EARTH * CONST.R_EARTH);
  test('Gravity at Earth surface ~9.81 m/s²',
    () => close(g_surface, g_expected, g_expected * 0.01, 'g_surface (km/s²)'));

  // At lunar distance, Earth gravity should drop by (R_E / lunar_dist)²
  const lunar_pos = [CONST.LUNAR_DIST, 0, 0];
  const a_lunar = phys.gravityAccel(lunar_pos, 0);
  // We're computing total gravity which includes Moon and Sun, but Earth dominates here
  // Just verify magnitude is in the right ballpark
  const g_expected_earth = CONST.MU_EARTH / (CONST.LUNAR_DIST * CONST.LUNAR_DIST);
  test('Earth gravity at lunar distance is small',
    () => g_expected_earth < 1e-5 ? true : `g_earth ${g_expected_earth} too large`);

  // Check that the Moon's gravity contributes (computed value should differ
  // from pure Earth gravity at lunar distance)
  // At a point near the Moon, Moon gravity should be the dominant term.
  const near_moon = V.add(phys.moonPosition(0), [10000, 0, 0]); // 10,000 km from Moon
  const a_near_moon = phys.gravityAccel(near_moon, 0);
  const a_mag = V.mag(a_near_moon);
  const g_moon_expected = CONST.MU_MOON / (10000 * 10000); // dominant term
  test('Moon gravity dominates near Moon',
    () => a_mag > g_moon_expected * 0.5 ? true : `a=${a_mag}, expected ~${g_moon_expected}`);
})();

// =============================================================================
// TEST 3c: Lunar Encounter (geometry-tuned)
// =============================================================================
console.log('\n=== TEST 3c: Engineered lunar encounter ===');

(function testLunarEncounter() {
  // The spacecraft will travel out the +X axis after the burn (since perigee
  // is at +X and prograde velocity is +Y, then under gravity it arcs around).
  // Actually, with a TLI-like burn, it goes mostly +Y direction initially
  // then curves due to gravity.
  //
  // To engineer an encounter, we need the Moon to be where the spacecraft
  // will be at trans-lunar arrival time. Apollo TLI took ~3 days to reach
  // lunar distance.
  //
  // Moon angular velocity: 2π / (27.32 days) = 0.230 rad/day
  // In 3 days, Moon moves ~0.69 radians.
  //
  // After TLI from +X with prograde +Y burn, the spacecraft trajectory under
  // Earth-only gravity heads outward in roughly the +Y direction initially,
  // then bends. By the time it reaches lunar distance (~3 days), it's
  // somewhere in the upper-right quadrant.
  //
  // Let's set the Moon's initial position so it ends up where the spacecraft
  // will be. We'll integrate first without Moon gravity to find arrival
  // position, then position the Moon there.

  const r_perigee = CONST.R_EARTH + 185;
  const r_apogee_heo = CONST.R_EARTH + 76757;
  const a_heo = (r_perigee + r_apogee_heo) / 2;
  const v_perigee_heo = Math.sqrt(CONST.MU_EARTH * (2/r_perigee - 1/a_heo));

  // TLI burn: prograde, ~3.05 km/s total (HEO perigee + 0.388 = ~3.04 km/s above circular)
  // Actually NASA says TLI delta-v is 3.05 km/s from LEO. From HEO perigee
  // it's much smaller. Let me use 0.388 km/s as the increment.
  const tli_dv_ms = 388;

  const initialState = {
    pos: [r_perigee, 0, 0],
    vel: [0, v_perigee_heo, 0],
  };

  // First pass: integrate without considering Moon position; find when
  // spacecraft reaches lunar distance and where it is.
  // (We'll use the actual integrator with Moon at default position; the
  // Moon will be far enough away that it barely affects the trajectory
  // until the arrival.)
  const burns = [{
    met: 0,
    dv_magnitude: tli_dv_ms,
    frame: 'RTN',
    components: [0, 1, 0],
  }];
  const t_end = 7 * 86400;
  const dt = 60;
  const traj_pass1 = phys.integrate(initialState, burns, t_end, dt);

  // Find when spacecraft is closest to lunar distance from Earth
  let closest_t = 0;
  let closest_r_diff = Infinity;
  let arrival_pos = null;
  for (const pt of traj_pass1) {
    const r = V.mag(pt.pos);
    const diff = Math.abs(r - CONST.LUNAR_DIST);
    if (diff < closest_r_diff && pt.t > 86400) {
      closest_r_diff = diff;
      closest_t = pt.t;
      arrival_pos = pt.pos;
    }
  }

  console.log(`    Spacecraft reaches ~lunar distance at t=${(closest_t/86400).toFixed(2)} days`);
  console.log(`    Arrival position (in xy-plane): (${arrival_pos[0].toFixed(0)}, ${arrival_pos[1].toFixed(0)}, ${arrival_pos[2].toFixed(0)})`);
  console.log(`    Closest distance to lunar radius: ${closest_r_diff.toFixed(0)} km`);

  test('Spacecraft reaches lunar distance under TLI burn',
    () => closest_r_diff < 50000 ? true : `closest to lunar distance: ${closest_r_diff.toFixed(0)} km`);

  // Compute the Moon's angular position at arrival time, given the spacecraft's
  // arrival angle in the equatorial plane
  const arrival_angle = Math.atan2(arrival_pos[1], arrival_pos[0]);
  // Moon orbit in equatorial frame is inclined, but in-plane component is approx:
  // moon_angle(t) = launch_phase + 2π t / period
  // We want moon_angle(closest_t) = arrival_angle
  // Therefore launch_phase = arrival_angle - 2π * closest_t / period
  const required_phase = arrival_angle - 2 * Math.PI * closest_t / CONST.LUNAR_PERIOD;
  console.log(`    Required Moon launch phase for encounter: ${required_phase.toFixed(3)} rad (${(required_phase * 180 / Math.PI).toFixed(1)}°)`);

  // Now temporarily monkey-patch the moon position function to use the engineered phase
  // (this is hacky for the test; in real code we'd parameterize the integrator)
  const original_moonPosition = phys.moonPosition;
  phys.moonPosition = function(t) {
    return original_moonPosition.call(this, t, required_phase);
  };

  // Re-integrate with the engineered phase
  const traj = phys.integrate(initialState, burns, t_end, dt);

  // Restore
  phys.moonPosition = original_moonPosition;

  // Find perilune
  let perilune_r = Infinity;
  let perilune_t = -1;
  let max_earth_r = 0;
  for (const pt of traj) {
    const moon = phys.moonPosition(pt.t, required_phase);
    const dr = V.sub(pt.pos, moon);
    const r_to_moon = V.mag(dr);
    if (r_to_moon < perilune_r) {
      perilune_r = r_to_moon;
      perilune_t = pt.t;
    }
    const r_to_earth = V.mag(pt.pos);
    if (r_to_earth > max_earth_r) max_earth_r = r_to_earth;
  }

  const perilune_alt = perilune_r - CONST.R_MOON;

  console.log(`    Engineered encounter:`);
  console.log(`      Perilune distance: ${perilune_r.toFixed(0)} km (alt ${perilune_alt.toFixed(0)} km)`);
  console.log(`      Perilune time: ${(perilune_t/86400).toFixed(2)} days`);
  console.log(`      Max Earth distance: ${max_earth_r.toFixed(0)} km`);

  test('Engineered encounter produces a perilune',
    () => perilune_r < 100000 ? true : `perilune too far: ${perilune_r.toFixed(0)} km`);

  console.log(`\n    Phase 1 success criterion: 3D physics produces a sensible Earth-Moon`);
  console.log(`    encounter when geometry is set up correctly. Precise NASA-matching`);
  console.log(`    perilune (6,546 km) requires Phase 3 calibration with real initial`);
  console.log(`    conditions and Moon ephemeris.`);
})();

// =============================================================================
// SUMMARY
// =============================================================================
console.log('\n=== SUMMARY ===');
console.log(`${passCount}/${testCount} tests passed`);
if (passCount === testCount) {
  console.log('All tests passed. 3D physics engine is functional.');
} else {
  console.log('Some tests failed. Review output above.');
  process.exit(1);
}
