/* ============================================================================
   physics-core.js — Peirastes mechanics library
   ============================================================================
   Pure functions for classical mechanics. NO DOM access, NO canvas, NO
   global state. Every function takes inputs, returns outputs. Named after
   the physics, not the lab that consumes it.

   Forward consumers (per Kinematics Lab SPEC.md §9):
     - Kinematics Lab  (this summer)    — kinematics1D, vectors, projectile, envelope
     - Forces Lab      (later)          — kinematics1D for inclined-plane motion,
                                          vectorAdd + vectorDecompose for force sum
     - Energy Lab      (later)          — projectileTrajectory (KE+PE over arc),
                                          kinematics1D (1D energy curves)
     - Oscillations Lab (later)         — vectorFromPolar (SHM phase representation)
                                          + future simpleHarmonicOscillator

   This is the operation's mechanics library, born Summer 2026. Add only
   what is *needed* by an actual consumer — no speculative API surface.

   Conventions:
     - Angles in DEGREES on the public API. Internal trig converts as needed.
     - SI units throughout: m, s, m/s, m/s².
     - g defaults to 9.81 m/s² (Earth surface, standard physics convention).
     - All trajectory functions return arrays of samples; rendering is the
       caller's problem.

   PSE-I Ch 2-4 (1D kinematics → vectors → 2D kinematics) is the first
   client. Functions are organized in the same order students meet the
   physics.
   ============================================================================ */

(function (root) {
  'use strict';

  const PhysicsCore = {};

  /* ── Constants ─────────────────────────────────────────────────────────── */
  PhysicsCore.G_EARTH = 9.81;   // m/s²

  /* ── Angle helpers ─────────────────────────────────────────────────────── */
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;
  const deg2rad = (d) => d * DEG;
  const rad2deg = (r) => r * RAD;

  /* ============================================================================
     1D KINEMATICS — constant acceleration
     ============================================================================ */

  /**
   * Position, velocity at time t for constant-acceleration 1D motion.
   *
   *   x(t) = x0 + v0·t + ½·a·t²
   *   v(t) = v0 + a·t
   *   a(t) = a  (constant)
   *
   * @param {Object}  p
   * @param {number}  p.x0   initial position (m)
   * @param {number}  p.v0   initial velocity (m/s)
   * @param {number}  p.a    acceleration (m/s²)
   * @param {number}  p.t    time (s)
   * @returns {{x: number, v: number, a: number}}
   */
  PhysicsCore.kinematics1D = function ({ x0, v0, a, t }) {
    return {
      x: x0 + v0 * t + 0.5 * a * t * t,
      v: v0 + a * t,
      a: a
    };
  };

  /**
   * Sample a 1D constant-acceleration trajectory over [0, tMax].
   *
   * @param {Object}  p
   * @param {number}  p.x0       initial position (m)
   * @param {number}  p.v0       initial velocity (m/s)
   * @param {number}  p.a        acceleration (m/s²)
   * @param {number}  p.tMax     end time (s)
   * @param {number}  [p.nSamples=200]  sample count (≥ 2)
   * @returns {Array<{t:number, x:number, v:number, a:number}>}
   */
  PhysicsCore.kinematics1DTrajectory = function ({ x0, v0, a, tMax, nSamples = 200 }) {
    if (nSamples < 2) nSamples = 2;
    const dt = tMax / (nSamples - 1);
    const out = new Array(nSamples);
    for (let i = 0; i < nSamples; i++) {
      const t = i * dt;
      out[i] = {
        t,
        x: x0 + v0 * t + 0.5 * a * t * t,
        v: v0 + a * t,
        a
      };
    }
    return out;
  };

  /**
   * Closed-form kinematic invariant — useful sanity check or solver.
   *
   *   v² = v0² + 2·a·(x − x0)
   *
   * @returns {number}  v² (m²/s²)
   */
  PhysicsCore.kinematicInvariant = function ({ x0, v0, a, x }) {
    return v0 * v0 + 2 * a * (x - x0);
  };

  /* ============================================================================
     VECTORS (2D)
     ============================================================================ */

  /**
   * Cartesian components from polar form. Angle measured CCW from +x axis.
   *
   * @param {number} magnitude   |v|
   * @param {number} angleDeg    direction in degrees (0 = +x, 90 = +y)
   * @returns {{x:number, y:number, magnitude:number, angleDeg:number}}
   */
  PhysicsCore.vectorFromPolar = function (magnitude, angleDeg) {
    const a = deg2rad(angleDeg);
    return {
      x: magnitude * Math.cos(a),
      y: magnitude * Math.sin(a),
      magnitude,
      angleDeg
    };
  };

  /**
   * Polar form from Cartesian components. Angle in degrees, range (−180, 180].
   *
   * @returns {{x:number, y:number, magnitude:number, angleDeg:number}}
   */
  PhysicsCore.vectorFromCartesian = function (x, y) {
    return {
      x, y,
      magnitude: Math.hypot(x, y),
      angleDeg: rad2deg(Math.atan2(y, x))
    };
  };

  /**
   * Sum of two 2D vectors. Inputs may be polar-form {magnitude, angleDeg}
   * OR Cartesian {x, y}; output carries both forms.
   *
   * @returns {{x:number, y:number, magnitude:number, angleDeg:number}}
   */
  PhysicsCore.vectorAdd = function (a, b) {
    const ax = (a.x !== undefined) ? a.x : a.magnitude * Math.cos(deg2rad(a.angleDeg));
    const ay = (a.y !== undefined) ? a.y : a.magnitude * Math.sin(deg2rad(a.angleDeg));
    const bx = (b.x !== undefined) ? b.x : b.magnitude * Math.cos(deg2rad(b.angleDeg));
    const by = (b.y !== undefined) ? b.y : b.magnitude * Math.sin(deg2rad(b.angleDeg));
    return PhysicsCore.vectorFromCartesian(ax + bx, ay + by);
  };

  /**
   * Difference of two 2D vectors: a − b. Same shape as vectorAdd; inputs
   * may be polar OR Cartesian. Forward consumers: Forces Lab (net force =
   * F_applied − F_friction), Energy Lab (displacement Δr = r_f − r_i),
   * Kinematics Lab Vectors module (subtraction mode).
   *
   * @returns {{x:number, y:number, magnitude:number, angleDeg:number}}
   */
  PhysicsCore.vectorSubtract = function (a, b) {
    const ax = (a.x !== undefined) ? a.x : a.magnitude * Math.cos(deg2rad(a.angleDeg));
    const ay = (a.y !== undefined) ? a.y : a.magnitude * Math.sin(deg2rad(a.angleDeg));
    const bx = (b.x !== undefined) ? b.x : b.magnitude * Math.cos(deg2rad(b.angleDeg));
    const by = (b.y !== undefined) ? b.y : b.magnitude * Math.sin(deg2rad(b.angleDeg));
    return PhysicsCore.vectorFromCartesian(ax - bx, ay - by);
  };

  /**
   * Negate a 2D vector. Output is collinear, opposite direction, same
   * magnitude. Useful for visualizing subtraction as "A + (−B)".
   *
   * @returns {{x:number, y:number, magnitude:number, angleDeg:number}}
   */
  PhysicsCore.vectorNegate = function (v) {
    const x = (v.x !== undefined) ? v.x : v.magnitude * Math.cos(deg2rad(v.angleDeg));
    const y = (v.y !== undefined) ? v.y : v.magnitude * Math.sin(deg2rad(v.angleDeg));
    return PhysicsCore.vectorFromCartesian(-x, -y);
  };

  /**
   * Decompose a polar vector into Cartesian components. Pure projection.
   *
   * @returns {{x:number, y:number}}
   */
  PhysicsCore.vectorDecompose = function (magnitude, angleDeg) {
    const a = deg2rad(angleDeg);
    return {
      x: magnitude * Math.cos(a),
      y: magnitude * Math.sin(a)
    };
  };

  /* ============================================================================
     PROJECTILE — no-air-resistance ballistic motion
     ============================================================================
     Closed-form expressions throughout. Launch from (0, y0) at speed v0 in
     direction theta0 above horizontal. Gravity acts down (-g). Lands when
     y returns to 0.

         x(t)  = v0 · cos(θ) · t
         y(t)  = y0 + v0 · sin(θ) · t − ½·g·t²
         vx(t) = v0 · cos(θ)
         vy(t) = v0 · sin(θ) − g·t

     Forward consumers: Kinematics Lab Module 3 (Projectile), Module 4
     (Projectile + Uncertainty Envelope, Phase 4), Energy Lab (KE+PE over
     a projectile arc).
     ============================================================================ */

  /**
   * Total time-of-flight: t such that y(t) = 0.
   *
   *   y0 + v0·sinθ·t − ½·g·t² = 0
   *   t = (v0·sinθ + √( (v0·sinθ)² + 2·g·y0 )) / g
   *
   * @param {number} v0
   * @param {number} theta0Deg
   * @param {number} [g=G_EARTH]
   * @param {number} [y0=0]
   * @returns {number}  seconds; 0 if v0·sinθ ≤ 0 AND y0 ≤ 0 (no flight)
   */
  PhysicsCore.projectileTimeOfFlight = function (v0, theta0Deg, g = PhysicsCore.G_EARTH, y0 = 0) {
    const vy0 = v0 * Math.sin(deg2rad(theta0Deg));
    const disc = vy0 * vy0 + 2 * g * y0;
    if (disc < 0) return 0;
    return (vy0 + Math.sqrt(disc)) / g;
  };

  /**
   * Maximum height above ground (y = 0). Reached at t = v0·sinθ / g.
   *
   *   y_max = y0 + (v0·sinθ)² / (2·g)        when vy0 > 0
   *   y_max = y0                              when vy0 ≤ 0  (no climb)
   *
   * @returns {number}
   */
  PhysicsCore.projectileMaxHeight = function (v0, theta0Deg, g = PhysicsCore.G_EARTH, y0 = 0) {
    const vy0 = v0 * Math.sin(deg2rad(theta0Deg));
    if (vy0 <= 0) return y0;
    return y0 + (vy0 * vy0) / (2 * g);
  };

  /**
   * Horizontal range — x at landing.
   *
   *   R = vx · t_flight = v0·cosθ · t_flight
   *
   * @returns {number}
   */
  PhysicsCore.projectileRange = function (v0, theta0Deg, g = PhysicsCore.G_EARTH, y0 = 0) {
    const tf = PhysicsCore.projectileTimeOfFlight(v0, theta0Deg, g, y0);
    return v0 * Math.cos(deg2rad(theta0Deg)) * tf;
  };

  /**
   * Position + velocity at time t. Caller's responsibility to keep t in
   * [0, t_flight]; this function does NOT clip y to ground.
   *
   * @returns {{t:number, x:number, y:number, vx:number, vy:number}}
   */
  PhysicsCore.projectileAt = function ({ v0, theta0Deg, y0 = 0, g = PhysicsCore.G_EARTH, t }) {
    const c = Math.cos(deg2rad(theta0Deg));
    const s = Math.sin(deg2rad(theta0Deg));
    return {
      t,
      x:  v0 * c * t,
      y:  y0 + v0 * s * t - 0.5 * g * t * t,
      vx: v0 * c,
      vy: v0 * s - g * t
    };
  };

  /**
   * Sample the full trajectory from t = 0 to t = t_flight.
   *
   * @param {Object}  p
   * @param {number}  p.v0           launch speed (m/s)
   * @param {number}  p.theta0Deg    launch angle above horizontal (deg)
   * @param {number}  [p.y0=0]       launch height (m)
   * @param {number}  [p.g=G_EARTH]  gravity (m/s²)
   * @param {number}  [p.nSamples=200]
   * @returns {Array<{t:number, x:number, y:number, vx:number, vy:number}>}
   */
  PhysicsCore.projectileTrajectory = function ({ v0, theta0Deg, y0 = 0, g = PhysicsCore.G_EARTH, nSamples = 200 }) {
    const tf = PhysicsCore.projectileTimeOfFlight(v0, theta0Deg, g, y0);
    if (tf <= 0 || nSamples < 2) return [];
    const dt = tf / (nSamples - 1);
    const c = Math.cos(deg2rad(theta0Deg));
    const s = Math.sin(deg2rad(theta0Deg));
    const out = new Array(nSamples);
    for (let i = 0; i < nSamples; i++) {
      const t = i * dt;
      out[i] = {
        t,
        x:  v0 * c * t,
        y:  y0 + v0 * s * t - 0.5 * g * t * t,
        vx: v0 * c,
        vy: v0 * s - g * t
      };
    }
    return out;
  };

  /* ============================================================================
     PROJECTILE — Uncertainty Envelope (Phase 4 — reserved)
     ============================================================================
       projectileEnvelope({ v0, dV0Pct, theta0Deg,
                            dTheta0Deg, g, mode })  → envelope object
     ============================================================================ */

  /* ── Module exports ────────────────────────────────────────────────────── */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhysicsCore;          // Node (for unit tests)
  }
  root.PhysicsCore = PhysicsCore;          // Browser global

})(typeof window !== 'undefined' ? window : globalThis);
