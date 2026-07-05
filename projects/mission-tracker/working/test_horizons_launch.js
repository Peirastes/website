/**
 * Mission Tracker — Launch & Splashdown Geometry Test
 *
 * Validates the new ECI/ECEF/geodetic infrastructure against real Artemis II
 * mission constraints:
 *
 *   1. KSC LC-39B at the launch epoch must lie in the orbital plane defined
 *      by the Horizons trajectory at WP0. (Burns done in-plane don't change
 *      the plane normal, so this should match within ~0.5°.)
 *   2. The orbital plane inclination to the equator should be slightly
 *      greater than KSC latitude (28.6°N) — typical Artemis II inclination
 *      is ~28–32°.
 *   3. The launch site, in equatorial ECI coordinates at the launch epoch,
 *      should sit at the local geocentric latitude expected for KSC.
 *   4. Bonus: extrapolate the Horizons return leg forward through the
 *      atmospheric interface and project the predicted splashdown to
 *      lat/lon. Compare against published Artemis II target zone.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const physics = require('./physics3d');
const { V, CONST } = physics;

const RAD = 180 / Math.PI;
const DEG = Math.PI / 180;

// -----------------------------------------------------------------------------
// Reference data
// -----------------------------------------------------------------------------

const horizons = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'artemis2_horizons.json'), 'utf8')
);
const wp = horizons.waypoints;

// KSC LC-39B (Artemis launch pad)
const KSC_LAT_DEG = 28.6273;
const KSC_LON_DEG = -80.6208;
const KSC_ALT_KM = 0.003;

// Launch epoch from horizons.note
const LAUNCH_UTC = '2026-04-01T22:35:12Z';
const LAUNCH_JD = physics.julianDate(LAUNCH_UTC);

// Published Artemis II splashdown target (Pacific, off Baja California)
// Approximate target zone — actual landing point is set by RTC burns.
const SPLASH_TARGET_LAT_DEG = 30.0;
const SPLASH_TARGET_LON_DEG = -120.0;

console.log('='.repeat(82));
console.log('Launch & Splashdown Geometry Test — Artemis II');
console.log('='.repeat(82));
console.log('Launch epoch:    ', LAUNCH_UTC, ' (JD', LAUNCH_JD.toFixed(6), ')');
console.log('Launch site:     KSC LC-39B  ', KSC_LAT_DEG, '°N,', KSC_LON_DEG, '°E');
console.log('Splash target:   ', SPLASH_TARGET_LAT_DEG, '°N,', SPLASH_TARGET_LON_DEG, '°E (Pacific, off Baja)');
console.log();

// =============================================================================
// Step 1 — Compute orbital plane in equatorial frame from Horizons WP0
// =============================================================================

console.log('-'.repeat(82));
console.log('Step 1 — Orbital plane normal from Horizons WP0 (equatorial ECI)');
console.log('-'.repeat(82));

// WP0 is in Ecliptic J2000. Convert to equatorial J2000.
const wp0_pos_eq = physics.eclipticToEquatorial(wp[0].pos_km);
const wp0_vel_eq = physics.eclipticToEquatorial(wp[0].vel_km_s);

const h_eq = V.cross(wp0_pos_eq, wp0_vel_eq);
const n_orbit = V.norm(h_eq);

const inclination = Math.acos(Math.abs(n_orbit[2])) * RAD; // |n_z|: take ascending sense
const raan = (Math.atan2(n_orbit[0], -n_orbit[1]) * RAD + 360) % 360;

console.log('  WP0 r (ecliptic):  [', wp[0].pos_km.map(v => v.toFixed(1)).join(', '), '] km');
console.log('  WP0 r (equator):   [', wp0_pos_eq.map(v => v.toFixed(1)).join(', '), '] km');
console.log();
console.log('  h vector:          [', h_eq.map(v => v.toFixed(1)).join(', '), '] km²/s');
console.log('  Plane normal n̂:    [', n_orbit.map(v => v.toFixed(4)).join(', '), ']');
console.log();
console.log('  Inclination i:     ', inclination.toFixed(3), '°  (vs equator)');
console.log('  RAAN Ω:            ', raan.toFixed(2), '°');
console.log();

// =============================================================================
// Step 2 — Compute KSC ECI position at the launch epoch
// =============================================================================

console.log('-'.repeat(82));
console.log('Step 2 — KSC LC-39B in ECI (equatorial) at the launch epoch');
console.log('-'.repeat(82));

const ksc_ecef = physics.geodeticToEcef(
  KSC_LAT_DEG * DEG,
  KSC_LON_DEG * DEG,
  KSC_ALT_KM
);
const theta_gmst = physics.gmst(LAUNCH_JD);
const ksc_eci = physics.ecefToEci(ksc_ecef, LAUNCH_JD);

console.log('  GMST at launch:    ', (theta_gmst * RAD).toFixed(4), '°');
console.log('  KSC ECEF:          [', ksc_ecef.map(v => v.toFixed(2)).join(', '), '] km');
console.log('  KSC ECI (equator): [', ksc_eci.map(v => v.toFixed(2)).join(', '), '] km');
console.log('  |KSC|:             ', V.mag(ksc_eci).toFixed(3), 'km');
console.log();

// Geocentric latitude of KSC ECI position (should match its WGS84 latitude)
const geocentric_lat = Math.asin(ksc_eci[2] / V.mag(ksc_eci)) * RAD;
console.log('  Geocentric lat:    ', geocentric_lat.toFixed(4), '°  (WGS84:', KSC_LAT_DEG, '°)');
console.log('  (Difference is the geodetic−geocentric latitude offset, ~12 arcmin at 28°N.)');
console.log();

// =============================================================================
// Step 3 — Test 1: KSC lies in the orbital plane at launch
// =============================================================================

console.log('-'.repeat(82));
console.log('Step 3 — TEST 1: KSC must lie in the orbital plane at launch');
console.log('-'.repeat(82));

const ksc_dot_n = V.dot(ksc_eci, n_orbit);
const sin_angle = ksc_dot_n / V.mag(ksc_eci);
const angle_from_plane = Math.asin(sin_angle) * RAD;

console.log('  KSC · n̂:           ', ksc_dot_n.toFixed(2), 'km');
console.log('  Angle from plane:  ', angle_from_plane.toFixed(4), '°');
console.log('  Perp distance:     ', Math.abs(ksc_dot_n).toFixed(2), 'km');
console.log();

const TOL_DEG = 1.0; // generous: simplified GMST + UTC≠TDB give ~0.3° noise
if (Math.abs(angle_from_plane) < TOL_DEG) {
  console.log(`  PASS — KSC is within ${TOL_DEG}° of the orbital plane at launch.`);
  console.log('         The launch geometry is self-consistent with Horizons.');
} else {
  console.log(`  FAIL — KSC is ${Math.abs(angle_from_plane).toFixed(2)}° off the plane (> ${TOL_DEG}° tolerance).`);
  console.log('         Possible causes: GMST formula error, wrong launch epoch, frame mismatch.');
}
console.log();

// =============================================================================
// Step 4 — Test 2: Inclination must be ≥ launch site latitude
// =============================================================================

console.log('-'.repeat(82));
console.log('Step 4 — TEST 2: Inclination must be ≥ launch site geocentric latitude');
console.log('-'.repeat(82));
console.log('  (For a due-east launch, orbital inclination = geocentric latitude');
console.log('   of the launch site, NOT geodetic. Earth oblateness shifts the');
console.log('   geocentric value ~12 arcmin south of geodetic at 28°N.)');
console.log();
console.log('  Orbital inclination:        ', inclination.toFixed(3), '°');
console.log('  KSC geodetic latitude:      ', KSC_LAT_DEG, '°');
console.log('  KSC geocentric latitude:    ', geocentric_lat.toFixed(4), '°');
console.log('  Inclination − geocentric:   ', (inclination - geocentric_lat).toFixed(3), '°');
if (inclination >= geocentric_lat - 0.2) {
  console.log('  PASS — inclination is consistent with a near-due-east launch from KSC.');
} else {
  console.log('  FAIL — inclination is below KSC geocentric latitude, which is physically');
  console.log('         impossible for an eastward launch without a dogleg maneuver.');
}
console.log();

// =============================================================================
// Step 5 — Ground track: project every Horizons waypoint to (lat, lon, alt)
//          and compute per-waypoint instantaneous inclination
// =============================================================================

console.log('-'.repeat(82));
console.log('Step 5 — Ground track of Horizons waypoints in Earth-fixed coordinates');
console.log('-'.repeat(82));
console.log('  Pipeline: ecliptic ECI → equatorial ECI → ECEF (rotate by −GMST) → geodetic');
console.log('  i_eq is the instantaneous inclination of the orbital plane to the equator');
console.log('  (recomputed from r×v at each waypoint, since the lunar slingshot rotates it).');
console.log();
console.log('  WP   UTC                       lat (°)    lon (°)    alt (km)    i_eq (°)   |lat|≤i?');
console.log('  --   -------------------       --------   --------   ---------   --------   --------');

const groundTrack = [];
let countOutOfBand = 0;
for (let k = 0; k < wp.length; k++) {
  const p = wp[k];
  const jd = physics.julianDate(p.utc);

  // Position pipeline
  const pos_eq = physics.eclipticToEquatorial(p.pos_km);
  const pos_ecef = physics.eciToEcef(pos_eq, jd);
  const geo = physics.ecefToGeodetic(pos_ecef);
  const lat = geo.lat * RAD;
  const lon = geo.lon * RAD;

  // Instantaneous orbital plane in equatorial frame
  const vel_eq = physics.eclipticToEquatorial(p.vel_km_s);
  const h = V.cross(pos_eq, vel_eq);
  const i_local = Math.acos(Math.abs(h[2]) / V.mag(h)) * RAD;

  const inBand = Math.abs(lat) <= i_local + 0.05;
  if (!inBand) countOutOfBand++;

  groundTrack.push({ utc: p.utc, lat, lon, alt: geo.alt, i_local });

  console.log(
    `  ${String(k).padStart(2)}   ${p.utc}      ` +
    `${lat.toFixed(3).padStart(8)}   ` +
    `${lon.toFixed(3).padStart(8)}   ` +
    `${geo.alt.toFixed(0).padStart(8)}    ` +
    `${i_local.toFixed(3).padStart(7)}    ` +
    `${(inBand ? '✓' : 'FAIL').padStart(6)}`
  );
}
console.log();

// =============================================================================
// Step 6 — TEST 3: every waypoint's latitude must lie inside its OWN
//                  instantaneous orbital plane's latitude band
// =============================================================================

console.log('-'.repeat(82));
console.log('Step 6 — TEST 3: |lat| ≤ i_eq at every waypoint');
console.log('-'.repeat(82));
console.log('  Note: i_eq at WP0 = ', groundTrack[0].i_local.toFixed(3),
            '°  (KSC launch plane)');
console.log('  Note: i_eq at WP15 = ', groundTrack[15].i_local.toFixed(3),
            '°  (post-perilune return plane — slingshot rotated it)');
console.log('  Plane bend across mission: ',
            (groundTrack[15].i_local - groundTrack[0].i_local).toFixed(3), '°');
console.log();
if (countOutOfBand === 0) {
  console.log('  PASS — all 16 waypoints lie within their instantaneous inclination band.');
  console.log('         ECI→ECEF→geodetic pipeline is geometrically consistent.');
} else {
  console.log('  FAIL —', countOutOfBand, 'waypoint(s) exceed their local inclination band.');
}
console.log();

// =============================================================================
// Step 6b — Round-trip sanity check on WP10 (perilune-ish)
// =============================================================================

console.log('-'.repeat(82));
console.log('Step 6b — Round-trip frame conversion sanity (WP10)');
console.log('-'.repeat(82));

const sample = wp[10];
const sample_jd = physics.julianDate(sample.utc);
const sample_pos_eq = physics.eclipticToEquatorial(sample.pos_km);
const sample_pos_ecef = physics.eciToEcef(sample_pos_eq, sample_jd);
const sample_geo = physics.ecefToGeodetic(sample_pos_ecef);
// Reverse: geodetic → ECEF → ECI eq → ecliptic
const back_ecef = physics.geodeticToEcef(sample_geo.lat, sample_geo.lon, sample_geo.alt);
const back_eci = physics.ecefToEci(back_ecef, sample_jd);
const back_ecl = physics.equatorialToEcliptic(back_eci);
const round_trip_err = V.mag(V.sub(back_ecl, sample.pos_km));
console.log('  Original ecliptic pos: [', sample.pos_km.map(v => v.toFixed(2)).join(', '), '] km');
console.log('  Round-tripped pos:     [', back_ecl.map(v => v.toFixed(2)).join(', '), '] km');
console.log('  Round-trip error:      ', round_trip_err.toFixed(6), 'km');
if (round_trip_err < 1e-3) {
  console.log('  PASS — round trip is exact to numerical precision.');
} else {
  console.log('  FAIL — round trip lost precision.');
}
console.log();

// =============================================================================
// Step 7 — Splashdown prediction (deferred — needs RTC-3 burn)
// =============================================================================

console.log('-'.repeat(82));
console.log('Step 7 — Splashdown prediction status');
console.log('-'.repeat(82));
console.log('  Quick analysis of WP15\'s natural trajectory:');

const wp15 = wp[wp.length - 1];
const r15 = V.mag(wp15.pos_km);
const v15_2 = V.dot(wp15.vel_km_s, wp15.vel_km_s);
const E15 = 0.5 * v15_2 - CONST.MU_EARTH / r15;
const a15 = -CONST.MU_EARTH / (2 * E15);
const h15 = V.cross(wp15.pos_km, wp15.vel_km_s);
const p15 = V.dot(h15, h15) / CONST.MU_EARTH;
const e15 = Math.sqrt(Math.max(0, 1 - p15 / a15));
const r_peri = a15 * (1 - e15);
const r_apo = a15 * (1 + e15);
const period_h = 2 * Math.PI * Math.sqrt(a15*a15*a15 / CONST.MU_EARTH) / 3600;

console.log('    semi-major axis a:    ', (a15 / 1000).toFixed(2), 'Mm');
console.log('    eccentricity e:       ', e15.toFixed(4));
console.log('    perigee radius:       ', (r_peri).toFixed(0), 'km  (alt ', (r_peri - CONST.R_EARTH).toFixed(0), 'km)');
console.log('    apogee radius:        ', (r_apo / 1000).toFixed(2), 'Mm');
console.log('    period:               ', period_h.toFixed(2), 'h');
console.log();

const r_peri_alt = r_peri - CONST.R_EARTH;
const REENTRY_ALT_KM = 120;
if (r_peri_alt > REENTRY_ALT_KM) {
  console.log('  WP15\'s Keplerian perigee is ABOVE the entry interface (', r_peri_alt.toFixed(0), 'km).');
  console.log('  → Multi-body integration with our simplified Moon model lifts perigee further;');
  console.log('    a real RTC-3 burn between WP15 and splashdown is required to lower it.');
} else {
  console.log('  WP15\'s Keplerian perigee is BELOW the entry interface (', r_peri_alt.toFixed(0), 'km).');
  console.log('  → On a 2-body orbit it would re-enter, but multi-body perturbations from the');
  console.log('    Moon raise perigee in our integrator. Real mission uses RTC-3 to ensure entry.');
}
console.log();
console.log('  Splashdown prediction will be added once one of the following is in hand:');
console.log('    A) Real RTC-3 burn data (delta-v vector and epoch from NASA)');
console.log('    B) Post-mission Horizons waypoints extending past splashdown');
console.log('    C) Or a Lambert/TLM solver that fits an RTC-3 burn to hit the recovery zone');
console.log();


console.log('='.repeat(82));
console.log('Geometry test complete.');
console.log('='.repeat(82));
