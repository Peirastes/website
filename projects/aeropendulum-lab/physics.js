// physics.js — Aeropendulum Lab physics core
//
// Faithful in-browser simulation of the Propendulum rig:
//   • Rigid-body pendulum dynamics (1 DOF) about a pivot at one end
//   • Parametric motor thrust model (quadratic in PWM with deadband)
//   • PD-with-feedforward controller mirroring firmware v2.9 MODE_STATIC
//   • Analytical static-equilibrium solver
//
// Source of truth for the controller structure:
//   Private/Projects/Physics/Oscillators/Propendulum/PropPendulum/PropPendulum.ino
//   (MODE_STATIC block at line 655 — PD around DUTY_BASE, 5° deadband,
//    ±3 counts/loop slew limiter, no live integral term as of v2.9)
//
// Coordinate convention:
//   θ (theta) is measured in RADIANS from horizontal, positive counterclockwise.
//   θ = 0            → arm horizontal (motor to the right)
//   θ = −π/2         → arm hanging straight down (stable without thrust)
//   θ = +π/2         → arm vertical up (unstable)
//
// All external API surfaces use SI units internally (rad, rad/s, N, kg, m, s).
// Degrees/PWM are used only at the controller boundary to match firmware.

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

// ---------------------------------------------------------------------------
// Default configuration
//
// These are starting values. T_max in particular is an informed guess for a
// v8520 coreless brushed motor + 75mm prop on 1S at reasonable battery state;
// it will be refined via kitchen-scale bench test during Phase D validation.
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG = Object.freeze({
  // Arm geometry (wooden meter stick with motor at tip)
  m_arm:   0.100,   // kg — arm mass
  L:       1.000,   // m  — pivot to tip
  m_motor: 0.005,   // kg — motor + prop assembly at tip
  b:       0.005,   // N·m·s/rad — viscous friction at pivot

  // Motor model (v8520 + 75mm prop, 1S, fresh battery)
  // Default raised from 0.30 N → 0.60 N so that the default parameters
  // reproduce the rig's observed capability (5–10° above horizontal hold).
  T_max:    0.60,   // N  — thrust at 100% PWM
  pwm_dead: 0.08,   // fraction of PWM below which thrust = 0

  // Controller gains (firmware v2.9 savedGains[MODE_STATIC], line 423)
  Kp: 50.0,
  Kd:  5.0,
  Ki:  0.2,         // present in EEPROM but NOT used in live MODE_STATIC
  DUTY_BASE:           120,   // feedforward baseline PWM
  theta_ref_deg:       5.0,   // setpoint in degrees
  E_DEADBAND_deg:      5.0,   // error deadband in degrees
  PWM_SLEW_PER_LOOP:   3,     // max PWM change per controller tick
  I_LIMIT:             35,    // anti-windup clamp (when enableIntegral)
  I_leak:              0.98,  // integral leak in deadband
  enableIntegral:      false, // canonical firmware is PD only

  // Environment
  g: 9.81,          // m/s²
});

// ---------------------------------------------------------------------------
// Motor — parametric thrust model
//
// thrust(pwm) =  T_max · frac²                    for pwm > pwm_dead
//             =  0                                otherwise
//   where frac = (pwm/255 − pwm_dead) / (1 − pwm_dead)
//
// The quadratic shape comes from: for a brushed DC motor, RPM ∝ duty cycle;
// for a prop, thrust ∝ RPM². Combining: thrust ∝ duty². The deadband models
// static friction / voltage threshold before the motor spins up.
// ---------------------------------------------------------------------------

export class Motor {
  constructor({
    T_max    = DEFAULT_CONFIG.T_max,
    pwm_dead = DEFAULT_CONFIG.pwm_dead,
  } = {}) {
    this.T_max = T_max;
    this.pwm_dead = pwm_dead;
  }

  // pwm: integer or float 0..255 (matches firmware analogWrite)
  // returns thrust in Newtons
  thrust(pwm) {
    const p = Math.max(0, Math.min(255, pwm)) / 255;
    if (p <= this.pwm_dead) return 0;
    const frac = (p - this.pwm_dead) / (1 - this.pwm_dead);
    return this.T_max * frac * frac;
  }
}

// ---------------------------------------------------------------------------
// Aeropendulum — rigid-body pendulum with motor-driven perpendicular thrust
//
// Effective mass for gravity torque:  M_eff = m_arm/2 + m_motor
// Moment of inertia about pivot end:  I = L² · (m_arm/3 + m_motor)
//
// Torques (positive = counterclockwise):
//   τ_grav(θ)      = −g · L · M_eff · cos(θ)      // restoring toward ±π/2
//   τ_friction(ω)  = −b · ω                        // linear viscous
//   τ_thrust(F)    = +F · L                        // motor at tip, perpendicular
//
// Equation of motion:
//   I · θ̈ = τ_grav + τ_friction + τ_thrust
//
// Integration: semi-implicit Euler (symplectic, stable, simple).
// ---------------------------------------------------------------------------

export class Aeropendulum {
  constructor({
    m_arm   = DEFAULT_CONFIG.m_arm,
    L       = DEFAULT_CONFIG.L,
    m_motor = DEFAULT_CONFIG.m_motor,
    b       = DEFAULT_CONFIG.b,
    g       = DEFAULT_CONFIG.g,
    theta_0 = -Math.PI / 2,  // start hanging by default
    omega_0 = 0,
  } = {}) {
    this.m_arm   = m_arm;
    this.L       = L;
    this.m_motor = m_motor;
    this.b       = b;
    this.g       = g;
    this.theta   = theta_0;  // rad
    this.omega   = omega_0;  // rad/s
  }

  // Effective mass for gravity torque (kg)
  get M_eff() {
    return this.m_arm / 2 + this.m_motor;
  }

  // Moment of inertia about the pivot (kg·m²)
  get I() {
    return this.L * this.L * (this.m_arm / 3 + this.m_motor);
  }

  // --- degree/dps getters to match firmware conventions ---
  get theta_deg() { return this.theta * RAD2DEG; }
  get omega_dps() { return this.omega * RAD2DEG; }

  // --- torque components (N·m) ---
  gravityTorque(theta = this.theta) {
    return -this.g * this.L * this.M_eff * Math.cos(theta);
  }

  frictionTorque(omega = this.omega) {
    return -this.b * omega;
  }

  thrustTorque(F) {
    return F * this.L;
  }

  // Angular acceleration for given state + thrust (rad/s²)
  accel(theta, omega, F) {
    const tau =
      this.gravityTorque(theta) +
      this.frictionTorque(omega) +
      this.thrustTorque(F);
    return tau / this.I;
  }

  // Semi-implicit Euler step
  // dt: seconds
  // F:  thrust in Newtons (constant over the step)
  step(dt, F) {
    const alpha = this.accel(this.theta, this.omega, F);
    this.omega += alpha * dt;
    this.theta += this.omega * dt;
  }

  reset(theta_0 = -Math.PI / 2, omega_0 = 0) {
    this.theta = theta_0;
    this.omega = omega_0;
  }

  // Total mechanical energy (for conservation checks)
  // Reference: zero when θ = −π/2 (hanging). Positive when arm is above hanging.
  energy() {
    const h =
      this.L * (this.m_arm / 2 + this.m_motor) * (Math.sin(this.theta) + 1);
    const KE = 0.5 * this.I * this.omega * this.omega;
    const PE = this.g * h;
    return KE + PE;
  }
}

// ---------------------------------------------------------------------------
// Analytical static-equilibrium solver
//
// At equilibrium (θ̈ = 0, ω = 0):
//   0 = −gLM_eff cos θ + FL
//   cos θ = F / (g · M_eff)
//
// Returns both branches, in degrees:
//   stable_deg   — below horizontal, stable without feedback
//   unstable_deg — above horizontal, unstable (requires controller)
//
// Returns null if the thrust exceeds gM_eff (no static equilibrium exists —
// the motor is strong enough to push the arm past horizontal unconditionally).
// ---------------------------------------------------------------------------

export function equilibriumAngle(F, {
  m_arm   = DEFAULT_CONFIG.m_arm,
  m_motor = DEFAULT_CONFIG.m_motor,
  g       = DEFAULT_CONFIG.g,
} = {}) {
  const M_eff = m_arm / 2 + m_motor;
  const ratio = F / (g * M_eff);
  if (ratio > 1 || ratio < -1) return null;
  const theta_rad = Math.acos(ratio);
  return {
    stable_deg:   -theta_rad * RAD2DEG,   // ∈ [-90°, 0°]
    unstable_deg:  theta_rad * RAD2DEG,   // ∈ [0°, +90°]
  };
}

// ---------------------------------------------------------------------------
// StaticController — mirrors firmware MODE_STATIC (PropPendulum.ino line 655)
//
// Control law (per line 657–676 of canonical firmware):
//
//   e      = theta_ref − theta                 // degrees
//   if |e| < E_DEADBAND: e = 0                 // buzz suppression
//   uP     = Kp · e
//   uD     = −Kd · omega_dps                   // derivative on measurement
//   u      = DUTY_BASE + uP + uD               // (no I term in canonical v2.9)
//   u_clamp = clamp(u, 0, 255)
//   step   = clamp(u_clamp − pwm_prev, ±PWM_SLEW_PER_LOOP)
//   pwm    = clamp(pwm_prev + step, 0, 255)
//
// The `enableIntegral` flag adds a leaky anti-windup integrator that is
// DISABLED by default (matching firmware). It exists as a sim-only experiment:
// turning it on lets Cole test "what would adding I action do?" in simulation
// before committing changes to the rig firmware. This is the sim's safe
// exploration lane for questions the firmware can't safely ask.
// ---------------------------------------------------------------------------

export class StaticController {
  constructor({
    Kp                 = DEFAULT_CONFIG.Kp,
    Kd                 = DEFAULT_CONFIG.Kd,
    Ki                 = DEFAULT_CONFIG.Ki,
    DUTY_BASE          = DEFAULT_CONFIG.DUTY_BASE,
    theta_ref_deg      = DEFAULT_CONFIG.theta_ref_deg,
    E_DEADBAND_deg     = DEFAULT_CONFIG.E_DEADBAND_deg,
    PWM_SLEW_PER_LOOP  = DEFAULT_CONFIG.PWM_SLEW_PER_LOOP,
    I_LIMIT            = DEFAULT_CONFIG.I_LIMIT,
    I_leak             = DEFAULT_CONFIG.I_leak,
    enableIntegral     = DEFAULT_CONFIG.enableIntegral,
  } = {}) {
    this.Kp = Kp;
    this.Kd = Kd;
    this.Ki = Ki;
    this.DUTY_BASE = DUTY_BASE;
    this.theta_ref_deg = theta_ref_deg;
    this.E_DEADBAND_deg = E_DEADBAND_deg;
    this.PWM_SLEW_PER_LOOP = PWM_SLEW_PER_LOOP;
    this.I_LIMIT = I_LIMIT;
    this.I_leak = I_leak;
    this.enableIntegral = enableIntegral;
    this.pwmPrev = 0;
    this.Iterm = 0;
  }

  // theta_deg: measured angle (degrees from horizontal)
  // omega_dps: measured angular velocity (degrees per second)
  // dt:        seconds since last update
  // returns:   PWM command (integer 0..255)
  update(theta_deg, omega_dps, dt) {
    // Error + deadband
    let e = this.theta_ref_deg - theta_deg;
    if (Math.abs(e) < this.E_DEADBAND_deg) e = 0;

    // Integral (off by default — sim-only experiment)
    if (this.enableIntegral) {
      if (e !== 0) {
        this.Iterm += this.Ki * e * dt;
        this.Iterm = Math.max(-this.I_LIMIT, Math.min(this.I_LIMIT, this.Iterm));
      } else {
        this.Iterm *= this.I_leak;
      }
    }

    // PD around feedforward baseline
    const uP = this.Kp * e;
    const uD = -this.Kd * omega_dps;
    const uI = this.enableIntegral ? this.Iterm : 0;
    const u  = this.DUTY_BASE + uP + uD + uI;

    // Clamp to PWM range
    const uClamped = Math.max(0, Math.min(255, u));

    // Slew-rate limit
    let delta = uClamped - this.pwmPrev;
    if (delta >  this.PWM_SLEW_PER_LOOP) delta =  this.PWM_SLEW_PER_LOOP;
    if (delta < -this.PWM_SLEW_PER_LOOP) delta = -this.PWM_SLEW_PER_LOOP;

    const pwmNext = Math.max(0, Math.min(255, this.pwmPrev + delta));
    this.pwmPrev = pwmNext;

    return pwmNext;
  }

  reset() {
    this.pwmPrev = 0;
    this.Iterm = 0;
  }
}

// ---------------------------------------------------------------------------
// Helper: small-angle natural period around the hanging equilibrium
//
// Useful for validation. Derived from linearizing gravity torque about
// θ = −π/2:  τ ≈ −g·L·M_eff · δ  where δ = θ + π/2 is small.
//
//   ω_n² = g · M_eff / (L · (m_arm/3 + m_motor))
//   T    = 2π / ω_n
// ---------------------------------------------------------------------------

export function hangingPeriod({
  m_arm   = DEFAULT_CONFIG.m_arm,
  m_motor = DEFAULT_CONFIG.m_motor,
  L       = DEFAULT_CONFIG.L,
  g       = DEFAULT_CONFIG.g,
} = {}) {
  const M_eff = m_arm / 2 + m_motor;
  const I_over_L2 = m_arm / 3 + m_motor;
  const omega_n_sq = g * M_eff / (L * I_over_L2);
  return 2 * Math.PI / Math.sqrt(omega_n_sq);
}

// Export constants for users that want them
export { RAD2DEG, DEG2RAD };
