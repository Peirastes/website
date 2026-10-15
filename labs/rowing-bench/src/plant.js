// Rowing generator bench -- the physics. A line-for-line port of sim/rowing_plant.py (the realistic
// plant), stepped in real time, plus a fourth load: an idealised charge controller into a battery.
//
//   ROWER   F = a F_max (1 - v/v_max) on the hands + handle (m_hand); recovery tracked back over T_recovery
//   ROPE    spring-damper that can pull but not push; recoil spring on the spool rewinds it
//   CLUTCH  one-way: locks spool to pulley when the spool catches up; releases when its torque would reverse
//   DRIVE   belt x G; belt + bearing drag tau_belt at the pulley shaft (motor side of the clutch)
//   MOTOR   PM brushed: e = k w, L_a, R_w, brush drop, friction, iron, cogging
//   LOADS   'open' | 'R' (resistor R_load) | 'C' (diode -> supercap, ESR, leak) |
//           'batt' (rectifier diode -> DC-DC converter presenting R_in, efficiency eta_c -> battery V_b0, R_b)
//
// Every constant is an ASSUMED placeholder (sim/params.json); the battery and converter values are new
// placeholders, marked below. Checked against the Python plant by check_plant.mjs.

export const DEFAULTS = {
  k: 0.0382, R_w: 2.0, J_motor: 3.0e-6, J_fly: 3.0e-4, tau_f: 2.0e-3, b_visc: 5.0e-6,
  G: 5.0, r_spool: 0.015, L_stroke: 0.30, R_load: 2.0, C: 1.0, C_rating: 16.0, V_diode: 0.7,
  F_max: 120.0, v_max: 1.5, t_ramp: 0.12, T_recovery: 1.6, m_hand: 3.0, k_rope: 5000.0, c_rope: 15.0,
  J_spool: 2.0e-5, tau_recoil: 0.03, k_recoil: 0.002, tau_od: 1.5e-3, tau_belt: 4.0e-3, V_brush: 0.6,
  L_a: 1.0e-3, tau_hyst: 1.0e-3, c_eddy: 3.0e-6, T_cog: 2.0e-3, N_cog: 12, ESR: 0.05, R_leak: 1.0e6,
  R_diode: 0.05,
  // ---- charge controller + battery: NEW placeholders (not in params.json) ----
  R_in: 4.0,          // ohm, input resistance the converter presents to the motor
  track_Rin: false,   // if true, R_in follows R_in* = n^2 k^2 v_max / F_max + R_w (derivation, controller section)
  eta_c: 0.90,        // converter efficiency
  V_b0: 12.0,         // battery open-circuit voltage (a small 12 V sealed lead-acid)
  R_b: 0.05,          // battery internal resistance
  Q_Ah: 1.2,          // battery capacity
  soc0: 0.50,
};

const DT = 1e-4;

export class Plant {
  constructor(overrides = {}) {
    this.p = { ...DEFAULTS, ...overrides };
    this.load = 'C';
    this.rowing = true;
    this.reset();
  }

  reset() {
    const s = (this.s = {
      t: 0, xh: 0, vh: 0, Fh: 0, T: 0, th_s: 0, w_s: 0, th_m: 0, w_m: 0, locked: false,
      i: 0, e: 0, Vc: 0, Vb: this.p.V_b0, soc: this.p.soc0, i_batt: 0, v_in: 0,
      phase: 'drive', t0: 0, x_end: 0, strokes: 0, strokeTimes: [],
      P_hand: 0, P_gen: 0, P_load: 0,
    });
    this.E = { hand: 0, rope_in: 0, gen: 0, copper: 0, brush: 0, diode: 0, esr: 0, leak: 0, loadR: 0,
      batt: 0, conv_loss: 0, friction: 0, iron: 0, belt: 0, clutch: 0, home: 0, stored: 0, spring_pe: 0,
      ke_rotor: 0, rope: 0 };
    void s;
  }

  dischargeCap() { this.s.Vc = 0; }

  Rin() {
    const p = this.p;
    if (!p.track_Rin) return p.R_in;
    const n = p.G / p.r_spool;
    return Math.max(0.1, (n * n * p.k * p.k * p.v_max) / p.F_max + p.R_w);
  }

  advance(dtReal) {
    // carry the fractional step so simulated time tracks real time exactly
    this._carry = (this._carry || 0) + Math.max(0, dtReal) / DT;
    const steps = Math.min(40000, Math.floor(this._carry));   // 60x at 60 fps = 10 000 steps a frame
    this._carry -= steps;
    if (this._carry > 1) this._carry = 0;          // a long stall (tab hidden): drop the backlog
    for (let j = 0; j < steps; j++) this.step();
    const s = this.s, p = this.p, E = this.E;
    E.stored = 0.5 * p.C * s.Vc * s.Vc;
    E.spring_pe = p.tau_recoil * s.th_s + 0.5 * p.k_recoil * s.th_s * s.th_s;
    E.ke_rotor = 0.5 * (p.J_motor + p.J_fly) * s.w_m * s.w_m;
  }

  step() {
    const p = this.p, s = this.s, E = this.E, dt = DT;
    const G = p.G, r = p.r_spool, k = p.k;
    const J = p.J_motor + p.J_fly, Js = p.J_spool, m = p.m_hand;
    const kr = p.k_rope, cr = p.c_rope;
    const wn = 12.0, Kp = m * wn * wn, Kd = 2.0 * m * wn;
    const load = this.load;
    const Rin = this.Rin();
    const decayR = load === 'C' ? p.R_w + p.R_diode + p.ESR
      : load === 'batt' ? p.R_w + p.R_diode + Rin
      : load === 'R' ? p.R_w + p.R_load : Infinity;

    // ---- rope ----
    const d = s.xh - r * s.th_s, dd = s.vh - r * s.w_s;
    const T = d > 0 ? Math.max(0, kr * d + cr * dd) : 0;
    // ---- rower ----
    let Fh = 0;
    if (s.phase === 'drive') {
      const a = this.rowing ? Math.min(1, (s.t - s.t0) / p.t_ramp) : 0;
      Fh = a * p.F_max * Math.max(0, 1 - s.vh / p.v_max);
      if (s.xh >= p.L_stroke || !this.rowing) {
        if (this.rowing) { s.strokes += 1; s.strokeTimes.push(s.t0); if (s.strokeTimes.length > 8) s.strokeTimes.shift(); }
        s.phase = 'recovery'; s.t0 = s.t; s.x_end = s.xh;
      }
    }
    if (s.phase === 'recovery') {
      const tr = Math.min(1, (s.t - s.t0) / p.T_recovery);
      const u = Math.PI * tr;
      const xr = 0.5 * s.x_end * (1 + Math.cos(u));
      const vr = tr < 1 ? -0.5 * s.x_end * Math.PI / p.T_recovery * Math.sin(u) : 0;
      const ar = tr < 1 ? -0.5 * s.x_end * (Math.PI / p.T_recovery) ** 2 * Math.cos(u) : 0;
      Fh = m * ar + Kp * (xr - s.xh) + Kd * (vr - s.vh) + T;
      if (tr >= 1 && this.rowing) { s.phase = 'drive'; s.t0 = s.t; }
    }
    // ---- torques ----
    const tau_rec = -(p.tau_recoil + p.k_recoil * s.th_s);
    const spin = s.w_m > 1e-9;
    const tau_e = k * s.i;
    const tau_fr = (spin ? p.tau_f : 0) + p.b_visc * s.w_m;
    const tau_ir = (spin ? p.tau_hyst : 0) + p.c_eddy * s.w_m;
    const tau_bl = spin ? p.tau_belt / G : 0;
    const tau_cog = -p.T_cog * Math.sin(p.N_cog * s.th_m);
    const tau_rot = -(tau_e + tau_fr + tau_ir + tau_bl) + tau_cog;
    const e = k * s.w_m;
    // ---- ledger (old-state rates) ----
    E.hand += T * s.vh * dt;
    E.rope_in += T * dd * dt;
    E.friction += tau_fr * s.w_m * dt;
    E.iron += tau_ir * s.w_m * dt;
    E.belt += tau_bl * s.w_m * dt;
    E.gen += tau_e * s.w_m * dt;
    s.P_hand = T * s.vh;
    s.P_gen = tau_e * s.w_m;
    // ---- mechanics ----
    const wasLocked = s.locked;
    if (s.locked) {
      const Jtot = Js + G * G * J;
      const alpha = (r * T + tau_rec + G * tau_rot) / Jtot;
      const tau_c = r * T + tau_rec - Js * alpha;
      if (tau_c < 0) s.locked = false;
      else { s.w_s += alpha * dt; s.w_m = G * s.w_s; }
    }
    if (!s.locked) {
      const over = s.w_m / G > s.w_s;
      const drag = over ? p.tau_od : 0;
      if (over) E.clutch += drag * (s.w_m / G - s.w_s) * dt;
      const a_s = (r * T + tau_rec + drag) / Js;
      const a_m = (tau_rot - drag / G) / J;
      s.w_s += a_s * dt;
      const wNew = s.w_m + a_m * dt;
      s.w_m = (s.w_m === 0 && a_m < 0) ? 0 : Math.max(0, wNew);
      if (!wasLocked && s.w_s > 0 && G * s.w_s >= s.w_m) {
        const ke0 = 0.5 * Js * s.w_s * s.w_s + 0.5 * J * s.w_m * s.w_m;
        s.w_s = (Js * s.w_s + G * J * s.w_m) / (Js + G * G * J);
        s.w_m = G * s.w_s;
        E.clutch += ke0 - (0.5 * Js * s.w_s * s.w_s + 0.5 * J * s.w_m * s.w_m);
        s.locked = true;
      }
    }
    s.th_s += s.w_s * dt;
    s.th_m += s.w_m * dt;
    if (s.th_s < 0) { s.th_s = 0; if (s.w_s < 0) { E.home += 0.5 * Js * s.w_s * s.w_s; s.w_s = 0; } }
    s.vh += (Fh - T) / m * dt;
    s.xh += s.vh * dt;
    // ---- electrical (exact update of the R-L current) ----
    let u = 0;
    if (load === 'C') u = e - s.Vc - p.V_diode - p.V_brush;
    else if (load === 'batt') u = e - p.V_diode - p.V_brush;
    else if (load === 'R') u = e - p.V_brush;
    const iOld = s.i;
    if (load === 'open') s.i = 0;
    else if (s.i > 0 || u > 0) {
      const iss = u / decayR;
      const dec = Math.exp(-decayR * dt / p.L_a);
      s.i = Math.max(0, iss + (s.i - iss) * dec);
    }
    const im = 0.5 * (iOld + s.i);
    E.copper += im * im * p.R_w * dt;
    if (im > 0) E.brush += p.V_brush * im * dt;
    s.P_load = 0; s.i_batt = 0; s.v_in = 0;
    if (load === 'C') {
      E.diode += (p.V_diode + p.R_diode * im) * im * dt;
      E.esr += im * im * p.ESR * dt;
      E.leak += s.Vc * s.Vc / p.R_leak * dt;
      s.P_load = s.Vc * im;
      s.Vc += (im - s.Vc / p.R_leak) / p.C * dt;
    } else if (load === 'R') {
      E.loadR += im * im * p.R_load * dt;
      s.P_load = im * im * p.R_load;
    } else if (load === 'batt') {
      E.diode += (p.V_diode + p.R_diode * im) * im * dt;
      const Pin = im * im * Rin;
      s.v_in = im * Rin;
      const Pb = p.eta_c * Pin;
      E.conv_loss += (1 - p.eta_c) * Pin * dt;
      // battery: terminal V_b = V_b0 + R_b i_b; P_b = V_b i_b  ->  i_b from the quadratic
      const ib = Pb > 0 ? (-p.V_b0 + Math.sqrt(p.V_b0 * p.V_b0 + 4 * p.R_b * Pb)) / (2 * p.R_b) : 0;
      s.i_batt = ib;
      s.Vb = p.V_b0 + p.R_b * ib;
      E.batt += p.V_b0 * ib * dt;               // stored chemically (the R_b i^2 part is heat)
      E.conv_loss += p.R_b * ib * ib * dt;
      s.soc = Math.min(1, s.soc + (ib * dt) / (p.Q_Ah * 3600));
      s.P_load = Pin;
    }
    s.e = e;
    s.T = T;
    s.Fh = Fh;
    s.t += dt;
  }

  strokeRate() {
    const st = this.s.strokeTimes;
    if (st.length < 2) return 0;
    return 60 * (st.length - 1) / (st[st.length - 1] - st[0]);
  }
}
