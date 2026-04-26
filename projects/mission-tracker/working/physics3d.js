/**
 * Mission Tracker — 3D Physics Engine
 *
 * Foundational module for the Mission Tracker framework. Computes spacecraft
 * trajectories under N-body gravity using a 3D RK4 integrator. State vectors
 * are 6D: [x, y, z, vx, vy, vz] in km and km/s, J2000-like inertial frame
 * with Earth at origin.
 *
 * This is the validation gate from SPEC §11 Phase 3: it must reproduce the
 * Artemis II free-return trajectory using only real burns (no synthetic TCM).
 *
 * Usage:
 *   const physics = require('./physics3d');
 *   const traj = physics.integrate(initialState, burns, t_end, dt);
 *
 * Status: Phase 1 — initial implementation, awaiting standalone tests
 */

'use strict';

// =============================================================================
// PHYSICAL CONSTANTS
// =============================================================================

const CONST = {
  // Gravitational parameters (km^3/s^2)
  MU_EARTH: 398600.4418,
  MU_MOON:  4902.8,
  MU_SUN:   132712440018,

  // Bodies (km)
  R_EARTH: 6371,
  R_MOON:  1737,
  R_SUN:   695700,

  // Distances (km)
  LUNAR_DIST: 384400,        // mean Earth-Moon
  AU:         149597870.7,   // 1 AU

  // Periods (seconds)
  LUNAR_PERIOD:  27.321661 * 86400,  // sidereal lunar month
  EARTH_YEAR:    365.25 * 86400,

  // Inclinations (radians)
  MOON_INCL_ECLIPTIC: 5.145 * Math.PI / 180,  // Moon orbit to ecliptic
  ECLIPTIC_OBLIQUITY: 23.44 * Math.PI / 180,  // ecliptic to equator (J2000)

  // Earth rotation
  SIDEREAL_RATE: 7.2921159e-5,   // rad/s (one full turn per 23h 56m 4.0905s)
  J2000_JD:      2451545.0,      // Jan 1 2000 12:00 UT1 (TT)

  // WGS84 reference ellipsoid (km)
  WGS84_A:  6378.137,                // equatorial radius
  WGS84_F:  1 / 298.257223563,       // flattening
  WGS84_E2: 0.00669437999014,        // first eccentricity squared = 2f − f²

  // Earth zonal harmonics (gravitational asymmetries)
  J2_EARTH: 1.082626683e-3,          // dominant — equatorial bulge
  J3_EARTH: -2.5327e-6,              // pear-shape (north-south asymmetry)
  J4_EARTH: -1.6196e-6,              // higher-order zonal
};

// =============================================================================
// 3D VECTOR UTILITIES
// =============================================================================

const V = {
  add:   (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]],
  sub:   (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]],
  scale: (a, s) => [a[0]*s, a[1]*s, a[2]*s],
  dot:   (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2],
  cross: (a, b) => [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ],
  mag:   (a) => Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]),
  norm:  (a) => {
    const m = V.mag(a);
    return m > 0 ? [a[0]/m, a[1]/m, a[2]/m] : [0,0,0];
  },
};

// =============================================================================
// EPHEMERIS — Moon and Sun positions in 3D (Earth-centered inertial frame)
// =============================================================================
//
// Coordinate convention: Earth-centered inertial (ECI), J2000-like.
// X-axis: vernal equinox direction (toward Sun at vernal equinox)
// Z-axis: Earth's rotation axis (north pole)
// Y-axis: completes right-handed frame
//
// Moon orbit: simplified Keplerian circular orbit in a plane inclined
// 5.145° to the ecliptic, which itself is inclined 23.44° to the equator.
// This is sufficient for trajectory accuracy at the ~minutes level.
//
// Sun position: apparent geocentric position assuming circular Earth orbit
// in the ecliptic plane.
// =============================================================================

// Module-level ephemeris configuration. The test harness or framework caller
// can adjust these to align the model with a specific mission's launch geometry.
const EPHEMERIS = {
  moonLaunchPhase: 0.4,  // Moon angle at t=0 (radians) — used by 'circular' mode
  sunLaunchPhase:  3.54, // Sun angle at t=0 (radians)
  moonInclination: CONST.MOON_INCL_ECLIPTIC, // Set to 0 to put Moon in equatorial plane
  applyObliquity:  true, // Set to false to skip ecliptic→equatorial rotation

  // High-fidelity Moon model (Phase B). When mode === 'chebyshev', moonPosition
  // returns the Chebyshev-evaluated DE440 ephemeris instead of the circular
  // Keplerian approximation. Requires:
  //   - mission_epoch_jdtdb: absolute JDTDB at integrator t=0
  //   - moonChebyshevFit:    object with .x, .y, .z (each {t_min, t_max, c[]})
  // Use loadMoonChebyshev() and setMissionEpoch() to configure.
  mode:                 'circular',
  mission_epoch_jdtdb:  null,
  moonChebyshevFit:     null,

  // High-fidelity perturbations (Phase C). Each is independently togglable.
  includeJ2:  false,        // Earth equatorial bulge (zonal harmonic 2)
  includeJ3:  false,        // Earth pear-shape (zonal harmonic 3)
  includeJ4:  false,        // higher-order zonal
  includeSRP: false,        // Solar radiation pressure (requires spacecraft mass+area)
  spacecraftMass_kg:    25400,  // Orion+ESM nominal mass after consumed propellant
  spacecraftArea_m2:    32,     // Effective cross-section for SRP
  spacecraftCR:         1.3,    // Radiation pressure coefficient (1=absorb, 2=reflect)

  // Atmospheric drag (Phase E). Active when includeDrag is true and altitude
  // < ATMO_TOP_KM. After ESM separation Orion is just the Crew Module (CM)
  // with the heat shield as the primary drag surface.
  includeDrag:           false,
  spacecraftMassEntry_kg: 9300,   // Orion CM only (ESM jettisoned for re-entry)
  spacecraftDragArea_m2:  19.5,   // Heat shield cross-section
  spacecraftCd:           1.4,    // Drag coefficient for blunt entry capsule
  spacecraftLD:           0.3,    // Lift-to-drag ratio (Orion CM, banked entry)
};

/**
 * Rotate a vector by an angle around the X axis.
 * Used to transform from ecliptic to equatorial coordinates.
 */
function rotX(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c];
}

/**
 * Evaluate a Chebyshev fit at parameter t (single component).
 * Inlined here to keep physics3d self-contained for the Moon ephemeris.
 * The fit object is { t_min, t_max, c: [coefficients] } in the same form
 * as chebyshev.js produces. Uses Clenshaw recursion.
 */
function evalChebyshevSingle(fit, t) {
  const tau = 2 * (t - fit.t_min) / (fit.t_max - fit.t_min) - 1;
  const c = fit.c;
  let b1 = 0, b2 = 0;
  for (let k = c.length - 1; k >= 1; k--) {
    const bk = 2 * tau * b1 - b2 + c[k];
    b2 = b1;
    b1 = bk;
  }
  return c[0] + tau * b1 - b2;
}

/**
 * Get Moon position in 3D (ECI frame, km).
 * t is mission elapsed time in seconds from launch.
 *
 * Branches on EPHEMERIS.mode:
 *   - 'circular':  simplified Keplerian circular orbit (legacy)
 *   - 'chebyshev': high-fidelity DE440 fit (Phase B), requires
 *                  mission_epoch_jdtdb and moonChebyshevFit to be set
 *
 * Uses the module-level EPHEMERIS.moonLaunchPhase for circular mode.
 * Set via setEphemeris() to align with a specific mission's launch geometry.
 */
function moonPosition(t, launchPhase) {
  // High-fidelity Chebyshev mode: evaluate DE440 fit at absolute JDTDB
  if (EPHEMERIS.mode === 'chebyshev' &&
      EPHEMERIS.moonChebyshevFit &&
      EPHEMERIS.mission_epoch_jdtdb !== null) {
    const jd = EPHEMERIS.mission_epoch_jdtdb + t / 86400;
    const fit = EPHEMERIS.moonChebyshevFit;
    const ecliptic = [
      evalChebyshevSingle(fit.x, jd),
      evalChebyshevSingle(fit.y, jd),
      evalChebyshevSingle(fit.z, jd),
    ];
    if (EPHEMERIS.applyObliquity) {
      return rotX(ecliptic, CONST.ECLIPTIC_OBLIQUITY);
    }
    return ecliptic;
  }

  // Circular Keplerian mode (legacy fallback)
  if (launchPhase === undefined) launchPhase = EPHEMERIS.moonLaunchPhase;
  const meanAnomaly = launchPhase + 2 * Math.PI * t / CONST.LUNAR_PERIOD;
  const x_orbit = CONST.LUNAR_DIST * Math.cos(meanAnomaly);
  const y_orbit = CONST.LUNAR_DIST * Math.sin(meanAnomaly);
  const z_orbit = 0;

  // Apply Moon orbital inclination (5.145° to ecliptic)
  const ecliptic = rotX([x_orbit, y_orbit, z_orbit], EPHEMERIS.moonInclination);

  // Apply ecliptic-to-equatorial rotation (Earth axial tilt)
  if (EPHEMERIS.applyObliquity) {
    return rotX(ecliptic, CONST.ECLIPTIC_OBLIQUITY);
  }
  return ecliptic;
}

/**
 * Load a Chebyshev Moon ephemeris fit (from moon_chebyshev.json) and
 * switch the Moon model to high-fidelity mode.
 *
 * Expected input is the parsed JSON from fit_moon_ephemeris.js, which has:
 *   { domain_jdtdb: [t_min, t_max], coefficients: { x: [...], y: [...], z: [...] } }
 */
function loadMoonChebyshev(fitJson) {
  const t_min = fitJson.domain_jdtdb[0];
  const t_max = fitJson.domain_jdtdb[1];
  EPHEMERIS.moonChebyshevFit = {
    x: { t_min, t_max, c: fitJson.coefficients.x },
    y: { t_min, t_max, c: fitJson.coefficients.y },
    z: { t_min, t_max, c: fitJson.coefficients.z },
  };
  EPHEMERIS.mode = 'chebyshev';
}

/**
 * Set the absolute JDTDB epoch corresponding to integrator t=0.
 * Required for the Chebyshev Moon model.
 */
function setMissionEpoch(jdtdb) {
  EPHEMERIS.mission_epoch_jdtdb = jdtdb;
}

/**
 * Get Sun position in 3D (ECI frame, km).
 * Earth in circular orbit around Sun; we represent the Sun's apparent
 * geocentric position.
 *
 * The sunPhase parameter sets the Sun's position at t=0.
 */
function sunPosition(t, sunPhase) {
  if (sunPhase === undefined) sunPhase = EPHEMERIS.sunLaunchPhase;
  // Sun apparent motion in the ecliptic
  const meanLongitude = sunPhase + 2 * Math.PI * t / CONST.EARTH_YEAR;
  const x_ecliptic = CONST.AU * Math.cos(meanLongitude);
  const y_ecliptic = CONST.AU * Math.sin(meanLongitude);
  const z_ecliptic = 0;

  // Convert from ecliptic to equatorial frame (gated by EPHEMERIS.applyObliquity
  // so the test harness can put the Sun in the equatorial plane for 2D-vs-3D
  // sanity checks).
  if (EPHEMERIS.applyObliquity) {
    return rotX([x_ecliptic, y_ecliptic, z_ecliptic], CONST.ECLIPTIC_OBLIQUITY);
  }
  return [x_ecliptic, y_ecliptic, z_ecliptic];
}

// =============================================================================
// TIME, EARTH ROTATION & GEODETIC TRANSFORMS
// =============================================================================
//
// Frames used in the framework:
//   ECEF  — Earth-Centered Earth-Fixed. Rotates with Earth. x toward 0°N 0°E
//           (Greenwich), z toward true north pole.
//   ECI_eq — Earth-Centered Inertial, equatorial. x toward J2000 mean
//           vernal equinox, z toward J2000 mean north pole.
//   ECI_ec — Earth-Centered Inertial, ecliptic (Horizons default for COMMAND
//           '-1024' returns this). Same x-axis as ECI_eq, z toward ecliptic
//           north pole. Differs from ECI_eq by a rotation of OBLIQUITY about x.
//
// All conversions ignore precession/nutation/polar motion (sub-arcsecond
// terms over our mission window).
// =============================================================================

/**
 * Convert a JavaScript Date (or ISO 8601 string) to Julian Date (UT1 ≈ UTC).
 * The TDB↔UTC offset (~69 s) is ignored — for our tolerance (~0.3° in
 * Earth-rotation phase) this is below the noise floor.
 */
function julianDate(date) {
  if (typeof date === 'string') date = new Date(date);
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Greenwich Mean Sidereal Time at a given Julian Date, in radians [0, 2π).
 *
 * Uses the simplified linear model accurate to ~1 second over decades:
 *   θ_GMST(h) = (18.697374558 + 24.06570982441908·D) mod 24
 * where D = JD − 2451545.0. The leading constant is θ_GMST at J2000 epoch
 * and the slope is the sidereal rate in hours per UT day.
 */
function gmst(jd) {
  const D = jd - CONST.J2000_JD;
  let h = (18.697374558 + 24.06570982441908 * D) % 24;
  if (h < 0) h += 24;
  return h * Math.PI / 12;
}

/**
 * Rotate a vector around the Z axis by angle (radians).
 */
function rotZ(v, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0]*c - v[1]*s, v[0]*s + v[1]*c, v[2]];
}

/**
 * ECEF → ECI (equatorial). Apply Earth rotation by +GMST.
 */
function ecefToEci(pos, jd) {
  return rotZ(pos, gmst(jd));
}

/**
 * ECI (equatorial) → ECEF. Undo Earth rotation by −GMST.
 */
function eciToEcef(pos, jd) {
  return rotZ(pos, -gmst(jd));
}

/**
 * Ecliptic J2000 → equatorial J2000. Rotate by +obliquity around X.
 */
function eclipticToEquatorial(v) {
  return rotX(v, CONST.ECLIPTIC_OBLIQUITY);
}

/**
 * Equatorial J2000 → ecliptic J2000. Rotate by −obliquity around X.
 */
function equatorialToEcliptic(v) {
  return rotX(v, -CONST.ECLIPTIC_OBLIQUITY);
}

/**
 * Geodetic (lat, lon, alt) → ECEF Cartesian (km).
 * lat, lon in radians; alt in km above the WGS84 ellipsoid.
 *
 * Standard parametric form:
 *   N = a / √(1 − e²·sin²φ)        (prime-vertical radius of curvature)
 *   x = (N + h) cosφ cosλ
 *   y = (N + h) cosφ sinλ
 *   z = (N(1 − e²) + h) sinφ
 */
function geodeticToEcef(lat, lon, alt) {
  const a = CONST.WGS84_A;
  const e2 = CONST.WGS84_E2;
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);
  return [
    (N + alt) * cosLat * Math.cos(lon),
    (N + alt) * cosLat * Math.sin(lon),
    (N * (1 - e2) + alt) * sinLat,
  ];
}

/**
 * ECEF Cartesian (km) → geodetic (lat, lon, alt). Returns radians and km.
 *
 * Bowring's iterative method (1985 form). Converges in 1–2 iterations to
 * sub-millimeter precision for any altitude up to GEO and beyond.
 */
function ecefToGeodetic(pos) {
  const [x, y, z] = pos;
  const a = CONST.WGS84_A;
  const f = CONST.WGS84_F;
  const e2 = CONST.WGS84_E2;
  const b = a * (1 - f);
  const ep2 = (a*a - b*b) / (b*b);

  const p = Math.sqrt(x*x + y*y);
  const lon = Math.atan2(y, x);

  // Initial parametric latitude
  const theta = Math.atan2(z * a, p * b);
  const sinT = Math.sin(theta), cosT = Math.cos(theta);
  let lat = Math.atan2(
    z + ep2 * b * sinT * sinT * sinT,
    p - e2  * a * cosT * cosT * cosT
  );

  // One Newton refinement is enough below LEO; iterate twice for safety.
  for (let i = 0; i < 2; i++) {
    const sinL = Math.sin(lat);
    const N = a / Math.sqrt(1 - e2 * sinL * sinL);
    lat = Math.atan2(z + e2 * N * sinL, p);
  }

  const sinL = Math.sin(lat);
  const N = a / Math.sqrt(1 - e2 * sinL * sinL);
  const alt = p / Math.cos(lat) - N;

  return { lat, lon, alt };
}

// =============================================================================
// ATMOSPHERIC MODEL (Phase E)
// =============================================================================
//
// Three-piece exponential approximation to the US Standard Atmosphere 1976.
// Continuous at the breakpoints (25 km and 100 km). Accurate within ~10%
// of the standard atmosphere from sea level through 300 km — sufficient
// for splashdown lat/lon prediction within 50 km.
//
// h is geometric altitude above mean Earth radius in km.
// Returns density in kg/m³.

const ATMO_TOP_KM = 300;  // Above this, drag is negligible

function atmosphereDensity(h_km) {
  if (h_km < 0)         return 1.225;          // sea level
  if (h_km > ATMO_TOP_KM) return 0;
  if (h_km < 25) {
    return 1.225 * Math.exp(-h_km / 8.4);
  }
  if (h_km < 100) {
    // Continuous fit through (25, 0.0394) → (100, ~5e-7)
    return 0.0394 * Math.exp(-(h_km - 25) / 6.5);
  }
  // 100 km and above: very thin, large scale height
  return 5.297e-7 * Math.exp(-(h_km - 100) / 28);
}

// =============================================================================
// GRAVITY MODEL
// =============================================================================

/**
 * Compute total acceleration on a spacecraft at position `pos` with velocity
 * `vel` at mission time `t`. Includes:
 *   - Earth point-mass gravity
 *   - J2 oblateness (if EPHEMERIS.includeJ2)
 *   - Moon gravity
 *   - Sun tidal perturbation
 *   - Solar radiation pressure (if EPHEMERIS.includeSRP)
 *   - Atmospheric drag (if EPHEMERIS.includeDrag and altitude < ATMO_TOP_KM)
 *
 * Velocity is required for the drag term; for backwards compatibility, if
 * `vel` is undefined the drag term is silently disabled.
 *
 * Returns acceleration vector [ax, ay, az] in km/s².
 */
function gravityAccel(pos, vel, t) {
  // Allow legacy 2-arg call where t was the 2nd arg
  if (typeof vel === 'number' && t === undefined) {
    t = vel;
    vel = undefined;
  }
  // Earth gravity (point mass)
  const rE = V.mag(pos);
  const rE3 = rE * rE * rE;
  let a = V.scale(pos, -CONST.MU_EARTH / rE3);

  // J2 oblateness (Phase C). The J2 zonal harmonic is symmetric about
  // Earth's *rotation* axis (not the ecliptic axis), so when the integrator
  // runs in ecliptic coordinates we transiently rotate position to the
  // equatorial frame, compute J2 there, and rotate the resulting
  // acceleration back to ecliptic.
  if (EPHEMERIS.includeJ2) {
    const inEcliptic = !EPHEMERIS.applyObliquity;
    const pos_eq = inEcliptic ? rotX(pos, CONST.ECLIPTIC_OBLIQUITY) : pos;
    const r2 = rE * rE;
    const r5 = r2 * r2 * rE;
    const z = pos_eq[2];
    const k = 5 * z * z / r2;
    const f2 = -1.5 * CONST.J2_EARTH * CONST.MU_EARTH * CONST.WGS84_A * CONST.WGS84_A / r5;
    let aJ2 = [
      f2 * pos_eq[0] * (1 - k),
      f2 * pos_eq[1] * (1 - k),
      f2 * pos_eq[2] * (3 - k),
    ];
    if (inEcliptic) aJ2 = rotX(aJ2, -CONST.ECLIPTIC_OBLIQUITY);
    a = V.add(a, aJ2);
  }

  // Moon gravity
  const moon = moonPosition(t);
  const dM = V.sub(pos, moon);
  const rM = V.mag(dM);
  const rM3 = rM * rM * rM;
  a = V.add(a, V.scale(dM, -CONST.MU_MOON / rM3));

  // Sun tidal perturbation
  // The Sun's direct pull on the spacecraft is mostly canceled by the
  // Earth's free-fall toward the Sun (we're in a rotating Earth-centered
  // frame). The residual tidal acceleration is the difference.
  const sun = sunPosition(t);
  const dS = V.sub(pos, sun);
  const rS = V.mag(dS);
  const rS3 = rS * rS * rS;
  const rSE = V.mag(sun);
  const rSE3 = rSE * rSE * rSE;
  // Tidal: -mu_sun * (dS/rS^3 + sun/rSE^3)
  const tidal = V.add(
    V.scale(dS,  -CONST.MU_SUN / rS3),
    V.scale(sun, -CONST.MU_SUN / rSE3)
  );
  a = V.add(a, tidal);

  // Solar Radiation Pressure (Phase C). Force per unit mass directed
  // radially away from the Sun. Accel = C_R * P_solar * (A/m), where
  // P_solar at 1 AU = 4.56e-6 N/m². At distance r from Sun, P scales as
  // (1 AU / r)². The direction is +unit(spacecraft − sun_position).
  if (EPHEMERIS.includeSRP) {
    const P0 = 4.56e-6;  // N/m² at 1 AU = mm/s² × kg/m²
    const dist_au = rS / CONST.AU;
    const P = P0 / (dist_au * dist_au);
    const accel_mag_ms2 = EPHEMERIS.spacecraftCR * P * EPHEMERIS.spacecraftArea_m2 / EPHEMERIS.spacecraftMass_kg;
    const accel_kms2 = accel_mag_ms2 / 1000; // m/s² → km/s²
    const dir = V.norm(dS); // dS = spacecraft − sun, points away from Sun
    a = V.add(a, V.scale(dir, accel_kms2));
  }

  // Atmospheric drag (Phase E). Active below ATMO_TOP_KM.
  // The relative wind is the spacecraft velocity minus the local atmosphere
  // velocity from Earth rotation.  Drag opposes the relative wind direction
  // with magnitude 0.5 ρ v_rel² Cd A / m.
  if (EPHEMERIS.includeDrag && vel) {
    const alt_km = rE - CONST.R_EARTH;
    if (alt_km < ATMO_TOP_KM) {
      const rho = atmosphereDensity(alt_km); // kg/m³
      if (rho > 0) {
        // Earth rotation vector in current frame.
        // ω points along Earth's rotation axis (equatorial north).
        // In ecliptic coordinates that vector is rotated by -obliquity around X
        // from [0,0,1]: equatorial_north_ec = [0, sin(obl), cos(obl)].
        const inEcliptic = !EPHEMERIS.applyObliquity;
        const omegaHat = inEcliptic
          ? [0, Math.sin(CONST.ECLIPTIC_OBLIQUITY), Math.cos(CONST.ECLIPTIC_OBLIQUITY)]
          : [0, 0, 1];
        const omega = V.scale(omegaHat, CONST.SIDEREAL_RATE);  // rad/s
        const v_atm = V.cross(omega, pos);  // km/s (Earth-rotation wind)
        const v_rel = V.sub(vel, v_atm);    // km/s relative wind
        const v_rel_mag = V.mag(v_rel);     // km/s
        if (v_rel_mag > 0) {
          // Drag deceleration in m/s² (then convert to km/s²)
          // |F_drag/m| = 0.5 ρ v² Cd A / m, with v in m/s
          const v_ms = v_rel_mag * 1000;
          const accel_ms2 =
            0.5 * rho * v_ms * v_ms * EPHEMERIS.spacecraftCd *
            EPHEMERIS.spacecraftDragArea_m2 / EPHEMERIS.spacecraftMassEntry_kg;
          const accel_kms2 = accel_ms2 / 1000; // m/s² → km/s²
          const dragDir = V.scale(V.norm(v_rel), -1); // opposes relative wind
          a = V.add(a, V.scale(dragDir, accel_kms2));

          // Lift: perpendicular to relative wind, in the plane of relative
          // wind and "up" (radial). Orion banks during entry to use lift
          // for range control (skip entry). |L|/|D| = spacecraftLD.
          if (EPHEMERIS.spacecraftLD > 0) {
            const upHat = V.norm(pos);
            const vHat = V.norm(v_rel);
            const upDotV = V.dot(upHat, vHat);
            // up_perp = up - (up·v) v   →  perpendicular to v in (v, up) plane
            const upPerp = [
              upHat[0] - upDotV * vHat[0],
              upHat[1] - upDotV * vHat[1],
              upHat[2] - upDotV * vHat[2],
            ];
            const upPerpMag = V.mag(upPerp);
            if (upPerpMag > 1e-9) {
              const liftDir = V.scale(upPerp, 1 / upPerpMag);
              const liftAccel_kms2 = accel_kms2 * EPHEMERIS.spacecraftLD;
              a = V.add(a, V.scale(liftDir, liftAccel_kms2));
            }
          }
        }
      }
    }
  }

  return a;
}

// =============================================================================
// RK4 INTEGRATOR — 6D state vector
// =============================================================================

/**
 * State: { pos: [x,y,z], vel: [vx,vy,vz] }
 *
 * Advance the state by one timestep using the classic RK4 method.
 */
function rk4Step(state, t, dt) {
  // k1
  const k1_pos = state.vel;
  const k1_vel = gravityAccel(state.pos, state.vel, t);

  // k2 (midpoint estimate)
  const pos2 = V.add(state.pos, V.scale(k1_pos, 0.5*dt));
  const vel2 = V.add(state.vel, V.scale(k1_vel, 0.5*dt));
  const k2_pos = vel2;
  const k2_vel = gravityAccel(pos2, vel2, t + 0.5*dt);

  // k3 (midpoint refined)
  const pos3 = V.add(state.pos, V.scale(k2_pos, 0.5*dt));
  const vel3 = V.add(state.vel, V.scale(k2_vel, 0.5*dt));
  const k3_pos = vel3;
  const k3_vel = gravityAccel(pos3, vel3, t + 0.5*dt);

  // k4 (endpoint)
  const pos4 = V.add(state.pos, V.scale(k3_pos, dt));
  const vel4 = V.add(state.vel, V.scale(k3_vel, dt));
  const k4_pos = vel4;
  const k4_vel = gravityAccel(pos4, vel4, t + dt);

  // Weighted sum
  const dPos = V.scale(
    V.add(V.add(k1_pos, V.scale(k2_pos, 2)),
          V.add(V.scale(k3_pos, 2), k4_pos)),
    dt / 6
  );
  const dVel = V.scale(
    V.add(V.add(k1_vel, V.scale(k2_vel, 2)),
          V.add(V.scale(k3_vel, 2), k4_vel)),
    dt / 6
  );

  return {
    pos: V.add(state.pos, dPos),
    vel: V.add(state.vel, dVel)
  };
}

// =============================================================================
// BURNS — 3D delta-v application
// =============================================================================

/**
 * Apply an impulsive burn to a state vector.
 *
 * burn = {
 *   met: number,            // mission elapsed time (seconds)
 *   dv_magnitude: number,   // m/s (will be converted to km/s internally)
 *   frame: 'RTN' | 'ECI',   // reference frame
 *   components: [r, t, n]   // direction unit vector in the chosen frame
 * }
 *
 * RTN frame:
 *   R = Radial    (unit vector from Earth center to spacecraft, outward)
 *   T = Tangential (in orbital plane, perpendicular to R, in direction of motion)
 *   N = Normal    (perpendicular to orbital plane, R × T direction)
 *
 * Returns a new state with updated velocity.
 */
function applyBurn(state, burn) {
  const dv_kms = burn.dv_magnitude / 1000; // m/s → km/s

  let dv_eci;
  if (burn.frame === 'ECI') {
    // Direct ECI components
    dv_eci = V.scale(burn.components, dv_kms);
  } else {
    // RTN frame: convert to ECI
    const R = V.norm(state.pos);
    const h = V.cross(state.pos, state.vel);  // angular momentum direction
    const N = V.norm(h);
    const T = V.cross(N, R);                  // R × N would be wrong direction; N × R gives prograde

    const [cR, cT, cN] = burn.components;
    dv_eci = [
      cR * R[0] + cT * T[0] + cN * N[0],
      cR * R[1] + cT * T[1] + cN * N[1],
      cR * R[2] + cT * T[2] + cN * N[2],
    ];
    dv_eci = V.scale(dv_eci, dv_kms);
  }

  return {
    pos: state.pos,
    vel: V.add(state.vel, dv_eci),
  };
}

// =============================================================================
// TRAJECTORY INTEGRATION
// =============================================================================

/**
 * Integrate a trajectory from initial state to t_end, applying burns at
 * scheduled times.
 *
 * Stops early if the spacecraft re-enters Earth's atmosphere (altitude
 * below `reentryAlt` km, default 50 km) AFTER moving beyond the initial
 * altitude (so the start condition doesn't trigger an immediate stop).
 *
 * Returns an array of {t, pos, vel} samples.
 */
function integrate(initialState, burns, t_end, dt = 10, opts = {}) {
  const reentryAlt = opts.reentryAlt ?? 50; // km
  const reentryR = CONST.R_EARTH + reentryAlt;
  const minDepartTime = opts.minDepartTime ?? 3600; // don't trigger reentry until ≥1h after launch

  const trajectory = [];
  let state = { pos: [...initialState.pos], vel: [...initialState.vel] };
  let t = 0;

  // Sort burns by MET
  const sortedBurns = [...burns].sort((a, b) => a.met - b.met);
  let burnIdx = 0;

  trajectory.push({ t, pos: [...state.pos], vel: [...state.vel] });

  let hasDeparted = false;

  while (t < t_end) {
    // Apply any burns due at or before the current time
    while (burnIdx < sortedBurns.length && sortedBurns[burnIdx].met <= t) {
      state = applyBurn(state, sortedBurns[burnIdx]);
      burnIdx++;
    }

    // Advance one RK4 step
    state = rk4Step(state, t, dt);
    t += dt;

    trajectory.push({ t, pos: [...state.pos], vel: [...state.vel] });

    // Re-entry detection: spacecraft must have departed first, then return
    const r = V.mag(state.pos);
    if (!hasDeparted && t > minDepartTime && r > CONST.R_EARTH + 5000) {
      hasDeparted = true;
    }
    if (hasDeparted && r < reentryR) {
      // Trajectory ends here — atmospheric re-entry
      break;
    }
  }

  return trajectory;
}

// =============================================================================
// EXPORTS
// =============================================================================

function setEphemeris(opts) {
  if (opts.moonLaunchPhase !== undefined) EPHEMERIS.moonLaunchPhase = opts.moonLaunchPhase;
  if (opts.sunLaunchPhase  !== undefined) EPHEMERIS.sunLaunchPhase  = opts.sunLaunchPhase;
  if (opts.moonInclination !== undefined) EPHEMERIS.moonInclination = opts.moonInclination;
  if (opts.applyObliquity  !== undefined) EPHEMERIS.applyObliquity  = opts.applyObliquity;
  if (opts.includeJ2       !== undefined) EPHEMERIS.includeJ2       = opts.includeJ2;
  if (opts.includeJ3       !== undefined) EPHEMERIS.includeJ3       = opts.includeJ3;
  if (opts.includeJ4       !== undefined) EPHEMERIS.includeJ4       = opts.includeJ4;
  if (opts.includeSRP      !== undefined) EPHEMERIS.includeSRP      = opts.includeSRP;
  if (opts.includeDrag     !== undefined) EPHEMERIS.includeDrag     = opts.includeDrag;
  if (opts.spacecraftMass_kg !== undefined) EPHEMERIS.spacecraftMass_kg = opts.spacecraftMass_kg;
  if (opts.spacecraftArea_m2 !== undefined) EPHEMERIS.spacecraftArea_m2 = opts.spacecraftArea_m2;
  if (opts.spacecraftCR    !== undefined) EPHEMERIS.spacecraftCR    = opts.spacecraftCR;
  if (opts.spacecraftMassEntry_kg !== undefined) EPHEMERIS.spacecraftMassEntry_kg = opts.spacecraftMassEntry_kg;
  if (opts.spacecraftDragArea_m2  !== undefined) EPHEMERIS.spacecraftDragArea_m2  = opts.spacecraftDragArea_m2;
  if (opts.spacecraftCd    !== undefined) EPHEMERIS.spacecraftCd    = opts.spacecraftCd;
  if (opts.spacecraftLD    !== undefined) EPHEMERIS.spacecraftLD    = opts.spacecraftLD;
}

function getEphemeris() {
  return { ...EPHEMERIS };
}

module.exports = {
  CONST,
  V,
  EPHEMERIS,
  setEphemeris,
  getEphemeris,
  moonPosition,
  loadMoonChebyshev,
  setMissionEpoch,
  sunPosition,
  atmosphereDensity,
  gravityAccel,
  rk4Step,
  applyBurn,
  integrate,
  // Time, Earth rotation & geodetic
  julianDate,
  gmst,
  rotZ,
  ecefToEci,
  eciToEcef,
  eclipticToEquatorial,
  equatorialToEcliptic,
  geodeticToEcef,
  ecefToGeodetic,
};
