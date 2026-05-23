// =====================================================================
// physicsCore.mjs
// ---------------------------------------------------------------------
// Pure (React-free, THREE-free) physics core for the refrigerator
// tip-recover problem. Imported by both the interactive R3F component
// (RefrigeratorTipSimulator.jsx) and the headless harnesses
// (validate.mjs, sweep.mjs). Plain ESM so `node validate.mjs` runs with
// no build step.
//
// State is integrated in the shelf frame (rotating with the door); the
// inertial pseudo-forces (Euler, centripetal, Coriolis) are added at the
// CM each substep.
// =====================================================================

export const GRAVITY = 9.81;
export const PHYS_DT = 1 / 2000;        // 2 kHz physics substeps
export const MAX_STEPS_PER_FRAME = 8;   // cap to keep frame budget sane (UI loop)

// Outcome-classification thresholds (used by classifyOutcome — kept
// independent of any per-frame display heuristic).
export const TIP_DETECT_RAD = 0.5 * Math.PI / 180;  // tilt past which a run "tipped"
export const SLIDE_DETECT_M = 0.002;                // horizontal CM travel marking a "slide"

// ---------------------------------------------------------------------
// Quaternion helpers (kept local to avoid GC churn from THREE objects)
// ---------------------------------------------------------------------
export function quatMul(out, a, b) {
  const ax = a[0], ay = a[1], az = a[2], aw = a[3];
  const bx = b[0], by = b[1], bz = b[2], bw = b[3];
  out[0] = aw * bx + ax * bw + ay * bz - az * by;
  out[1] = aw * by - ax * bz + ay * bw + az * bx;
  out[2] = aw * bz + ax * by - ay * bx + az * bw;
  out[3] = aw * bw - ax * bx - ay * by - az * bz;
  return out;
}
export function quatNorm(q) {
  const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  q[0] /= n; q[1] /= n; q[2] /= n; q[3] /= n;
  return q;
}
export function quatRotate(out, q, v) {
  // out = q * v * q^-1, with v as a vector
  const x = v[0], y = v[1], z = v[2];
  const qx = q[0], qy = q[1], qz = q[2], qw = q[3];
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  return out;
}

// ---------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------
export function makeInitialState() {
  return {
    // Door (1-DOF, rotates about world +Y at the hinge)
    theta: 0,
    thetaDot: 0,
    // Cylinder CM position in shelf frame (x along shelf, y up, z lateral)
    cmPos: [0.30, 0, 0],   // start at x = 30 cm from hinge
    cmVel: [0, 0, 0],
    // Orientation quaternion (cylinder's symmetry axis = body +Y)
    quat: [0, 0, 0, 1],
    // Angular velocity in body frame
    omegaBody: [0, 0, 0],
    // Phase: 'flat' | 'tip' | 'fallen'
    phase: 'flat',
    fallen: false,
    t: 0,
    // For phase-portrait
    phi: 0,       // tilt angle of symmetry axis from vertical
    phiDot: 0,
    // Trace of CM and contact point on shelf
    cmTrace: [],
    contactTrace: [],
    // Trace of the top-centre point (symmetry-axis top), 3D in shelf frame
    topTrace: [],
    // Phase-portrait trace (φ, φ̇) — grows only while integrating, clears with state
    phaseTrace: [],
    // Maximum tilt reached this run
    phiMax: 0,
  };
}

// ---------------------------------------------------------------------
// Tilt-from-vertical angle from quaternion
// ---------------------------------------------------------------------
const _tmpAxis = [0, 0, 0];
export function computeTilt(q) {
  quatRotate(_tmpAxis, q, [0, 1, 0]);
  const dot = Math.max(-1, Math.min(1, _tmpAxis[1]));
  return Math.acos(dot);
}

// ---------------------------------------------------------------------
// Torque profile for the door — half-sine impulse
// ---------------------------------------------------------------------
export function doorTorque(t, peakTau, pulseWidth) {
  if (t < 0 || t > pulseWidth) return 0;
  return peakTau * Math.sin(Math.PI * t / pulseWidth);
}

// ---------------------------------------------------------------------
// One physics substep
// ---------------------------------------------------------------------
export function physicsStep(s, dt, params) {
  const { m, r, h, mu, peakTau, pulseWidth, iDoor, doorDamping } = params;
  // Numerical/contact knobs — overridable for the N1 convergence study
  // (converge.mjs); defaults reproduce the canonical model.
  const kN = params.kN ?? 80000;                              // contact stiffness, N/m
  const cN = params.cN ?? 200;                                // contact damping
  const seedDur = params.seedDur ?? 0.003;                    // flat→tip ω-seed duration, s
  const tiltFlatThresh = params.tiltFlatThresh ?? (0.5 * Math.PI / 180);
  const tiltRecThresh = params.tiltRecThresh ?? (0.02 * Math.PI / 180);
  const omegaRecThresh = params.omegaRecThresh ?? 0.05;

  // ---- 1. Advance door dynamics ----
  const tau = doorTorque(s.t, peakTau, pulseWidth);
  const thetaDDot = (tau - doorDamping * s.thetaDot) / iDoor;
  s.thetaDot += thetaDDot * dt;
  s.theta += s.thetaDot * dt;

  // ---- 2. Inertial pseudo-acceleration of the cylinder, shelf frame ----
  // Frame rotates at ω = thetaDot about world +Y. The fictitious
  // acceleration on a body at shelf position r=(x,y,z) is
  //     a_fict = -ω̇×r  -  ω×(ω×r)  -  2 ω×v_rel
  // With ω=(0,w,0), ω̇=(0,wDot,0), r=(x,_,z), v=(vx,_,vz):
  //     Euler       -ω̇×r       = (-wDot·z, 0,  wDot·x)
  //     Centrifugal -ω×(ω×r)   = ( w²·x,   0,  w²·z )   (outward)
  //     Coriolis    -2 ω×v_rel = (-2w·vz,  0,  2w·vx)
  // (Earlier revisions had the Euler/Coriolis signs flipped relative to
  //  the centrifugal term, which is the physically correct reference.)
  const xCM = s.cmPos[0];           // along shelf (radially outward from hinge)
  const zCM = s.cmPos[2];           // lateral, along door panel
  const vx = s.cmVel[0];
  const vz = s.cmVel[2];
  const w = s.thetaDot;
  const wDot = thetaDDot;
  const aEulerX = -wDot * zCM;
  const aEulerZ =  wDot * xCM;
  const aCentX = w * w * xCM;
  const aCentZ = w * w * zCM;
  const aCorX = -2 * w * vz;
  const aCorZ =  2 * w * vx;

  const aPseudoX = aEulerX + aCentX + aCorX;
  const aPseudoZ = aEulerZ + aCentZ + aCorZ;

  // Inertial (pseudo) force on the cylinder in the shelf frame = m * a_fict.
  const fPseudo = [m * aPseudoX, 0, m * aPseudoZ];
  const fGravity = [0, -m * GRAVITY, 0];

  // ---- 3. Contact geometry: lowest rim point of the bottom face ----
  // Bottom rim in body frame: circle at y=-h/2, radius r in the xz plane.
  // World-y of point (r cosα, -h/2, r sinα) is
  //     r·(xAxisWorld.y·cosα + zAxisWorld.y·sinα) - (h/2)·yAxisWorld.y
  // minimized at α = atan2(B, A) + π.
  const yAxisWorld = [0, 0, 0];
  const xAxisWorld = [0, 0, 0];
  const zAxisWorld = [0, 0, 0];
  quatRotate(yAxisWorld, s.quat, [0, 1, 0]);
  quatRotate(xAxisWorld, s.quat, [1, 0, 0]);
  quatRotate(zAxisWorld, s.quat, [0, 0, 1]);
  const A = r * xAxisWorld[1];
  const B = r * zAxisWorld[1];
  const alphaMin = Math.atan2(B, A) + Math.PI;

  // Tilt angle
  const tilt = computeTilt(s.quat);
  s.phi = tilt;
  if (tilt > s.phiMax) s.phiMax = tilt;

  // Have we fully fallen? (tilt > π/2 - small)
  if (!s.fallen && tilt > Math.PI / 2 - 0.05) {
    s.fallen = true;
    s.phase = 'fallen';
  }

  // Phase by tilt, with hysteresis: enter 'tip' eagerly, return to 'flat'
  // only when tilt is essentially zero AND angular velocity is small.
  if (!s.fallen) {
    if (s.phase === 'flat') {
      if (tilt > tiltFlatThresh) s.phase = 'tip';
    } else if (s.phase === 'tip') {
      const omegaMag = Math.hypot(s.omegaBody[0], s.omegaBody[1], s.omegaBody[2]);
      if (tilt < tiltRecThresh && omegaMag < omegaRecThresh) {
        s.phase = 'flat';
        s.omegaBody[0] = 0;
        s.omegaBody[1] = 0;
        s.omegaBody[2] = 0;
      }
    }
  }

  // ---- 4. Apply forces and torques ----
  let fNet = [fPseudo[0] + fGravity[0], fPseudo[1] + fGravity[1], fPseudo[2] + fGravity[2]];
  let tauWorld = [0, 0, 0];

  if (s.phase === 'flat') {
    // Pin CM y to h/2; normal force balances vertical.
    s.cmPos[1] = h / 2;
    s.cmVel[1] = 0;
    fNet[1] = 0;
    // Friction at base: opposes horizontal velocity until exceeded.
    const fHorizMag = Math.hypot(fNet[0], fNet[2]);
    const fFricMax = mu * Math.abs(m * GRAVITY);
    const vHorizMag = Math.hypot(s.cmVel[0], s.cmVel[2]);
    if (vHorizMag < 1e-4 && fHorizMag < fFricMax) {
      // Static friction holds it
      fNet[0] = 0; fNet[2] = 0;
      s.cmVel[0] = 0; s.cmVel[2] = 0;
    } else {
      // Kinetic friction opposes velocity (or applied force if slipping from rest)
      const dir = vHorizMag > 1e-4
        ? [s.cmVel[0] / vHorizMag, s.cmVel[2] / vHorizMag]
        : [fNet[0] / (fHorizMag || 1), fNet[2] / (fHorizMag || 1)];
      fNet[0] -= fFricMax * dir[0];
      fNet[2] -= fFricMax * dir[1];
    }
    // Tipping criterion: moment of the inertial force about the downstream
    // base edge exceeds gravity's restoring moment. Seed the tip phase with
    // an ω about the pivot edge.
    const aPseudoMag = Math.hypot(aPseudoX, aPseudoZ);
    if (aPseudoMag * (h / 2) > GRAVITY * r) {
      const dirN = [aPseudoX / aPseudoMag, aPseudoZ / aPseudoMag];
      const axisH = [-dirN[1], 0, dirN[0]];
      const d2 = r * r + (h / 2) * (h / 2);
      const Icm = m * (r * r / 4 + h * h / 12);
      const Iedge = Icm + m * d2;
      const netTorqueMag = m * (aPseudoMag * (h / 2) - GRAVITY * r);
      const phiDDot = netTorqueMag / Iedge;
      const omegaSeed = phiDDot * seedDur;   // ~seedDur of angular accel as initial ω
      const qInv = [-s.quat[0], -s.quat[1], -s.quat[2], s.quat[3]];
      const axisBody = [0, 0, 0];
      quatRotate(axisBody, qInv, axisH);
      s.omegaBody[0] = axisBody[0] * omegaSeed;
      s.omegaBody[1] = axisBody[1] * omegaSeed;
      s.omegaBody[2] = axisBody[2] * omegaSeed;
      s.cmPos[1] = h / 2 + 1e-4;  // lift off the flat constraint
      s.phase = 'tip';
    }
  } else if (s.phase === 'tip') {
    // Single point contact at the lowest rim point.
    const cAlpha = Math.cos(alphaMin), sAlpha = Math.sin(alphaMin);
    const contactRelBody = [r * cAlpha, -h / 2, r * sAlpha];
    const contactRelWorld = [0, 0, 0];
    quatRotate(contactRelWorld, s.quat, contactRelBody);
    // Maintain contact: cmPos[1] + contactRelWorld[1] = 0 (penalty)
    const targetCmY = -contactRelWorld[1];
    const penetration = targetCmY - s.cmPos[1];
    const fNormalMag = Math.max(0, kN * penetration - cN * s.cmVel[1]);
    fNet[1] += fNormalMag;

    // Friction at contact point. v_contact = v_cm + ω_world × contactRelWorld.
    const omegaWorld = [0, 0, 0];
    quatRotate(omegaWorld, s.quat, s.omegaBody);
    const vContact = [
      s.cmVel[0] + omegaWorld[1] * contactRelWorld[2] - omegaWorld[2] * contactRelWorld[1],
      s.cmVel[1] + omegaWorld[2] * contactRelWorld[0] - omegaWorld[0] * contactRelWorld[2],
      s.cmVel[2] + omegaWorld[0] * contactRelWorld[1] - omegaWorld[1] * contactRelWorld[0],
    ];
    const vSlip = [vContact[0], 0, vContact[2]];
    const vSlipMag = Math.hypot(vSlip[0], vSlip[2]);
    const fFricMag = mu * fNormalMag;
    if (vSlipMag > 1e-4) {
      const fFric = [
        -fFricMag * vSlip[0] / vSlipMag,
        0,
        -fFricMag * vSlip[2] / vSlipMag,
      ];
      fNet[0] += fFric[0];
      fNet[2] += fFric[2];
      tauWorld[0] += contactRelWorld[1] * fFric[2] - contactRelWorld[2] * fFric[1];
      tauWorld[1] += contactRelWorld[2] * fFric[0] - contactRelWorld[0] * fFric[2];
      tauWorld[2] += contactRelWorld[0] * fFric[1] - contactRelWorld[1] * fFric[0];
    }
    // Torque from normal force about CM
    const fN = [0, fNormalMag, 0];
    tauWorld[0] += contactRelWorld[1] * fN[2] - contactRelWorld[2] * fN[1];
    tauWorld[1] += contactRelWorld[2] * fN[0] - contactRelWorld[0] * fN[2];
    tauWorld[2] += contactRelWorld[0] * fN[1] - contactRelWorld[1] * fN[0];

    // Record contact point for trace
    const contactWorld = [
      s.cmPos[0] + contactRelWorld[0],
      0,
      s.cmPos[2] + contactRelWorld[2],
    ];
    if (s.contactTrace.length === 0 ||
        Math.hypot(contactWorld[0] - s.contactTrace[s.contactTrace.length - 1][0],
                   contactWorld[2] - s.contactTrace[s.contactTrace.length - 1][1]) > 0.001) {
      s.contactTrace.push([contactWorld[0], contactWorld[2]]);
      if (s.contactTrace.length > 600) s.contactTrace.shift();
    }
  } else if (s.phase === 'fallen') {
    // Crude: cylinder side contact. Rest CM at y=r, heavy damping.
    s.cmPos[1] = r;
    s.cmVel[1] = 0;
    fNet[1] = 0;
    s.cmVel[0] *= 0.92;
    s.cmVel[2] *= 0.92;
    s.omegaBody[0] *= 0.85;
    s.omegaBody[1] *= 0.85;
    s.omegaBody[2] *= 0.85;
  }

  // ---- 5. Integrate translation (semi-implicit Euler) ----
  s.cmVel[0] += (fNet[0] / m) * dt;
  s.cmVel[1] += (fNet[1] / m) * dt;
  s.cmVel[2] += (fNet[2] / m) * dt;
  s.cmPos[0] += s.cmVel[0] * dt;
  s.cmPos[1] += s.cmVel[1] * dt;
  s.cmPos[2] += s.cmVel[2] * dt;

  // ---- 6. Integrate rotation (explicit Euler on the body-frame eqns) ----
  const Ixx = m * (r * r / 4 + h * h / 12);
  const Iyy = m * (r * r / 2);
  const Izz = Ixx;
  const qInv = [-s.quat[0], -s.quat[1], -s.quat[2], s.quat[3]];
  const tauBody = [0, 0, 0];
  quatRotate(tauBody, qInv, tauWorld);
  const wx = s.omegaBody[0], wy = s.omegaBody[1], wz = s.omegaBody[2];
  const dwx = (tauBody[0] - (Izz - Iyy) * wy * wz) / Ixx;
  const dwy = (tauBody[1] - (Ixx - Izz) * wz * wx) / Iyy;
  const dwz = (tauBody[2] - (Iyy - Ixx) * wx * wy) / Izz;
  s.omegaBody[0] += dwx * dt;
  s.omegaBody[1] += dwy * dt;
  s.omegaBody[2] += dwz * dt;
  // Quaternion update: q̇ = 0.5 * q * (0, ω_body)
  const omegaQuat = [s.omegaBody[0], s.omegaBody[1], s.omegaBody[2], 0];
  const qDot = [0, 0, 0, 0];
  quatMul(qDot, s.quat, omegaQuat);
  s.quat[0] += 0.5 * qDot[0] * dt;
  s.quat[1] += 0.5 * qDot[1] * dt;
  s.quat[2] += 0.5 * qDot[2] * dt;
  s.quat[3] += 0.5 * qDot[3] * dt;
  quatNorm(s.quat);

  // φ̇ estimate (rate of change of tilt)
  const newTilt = computeTilt(s.quat);
  s.phiDot = (newTilt - s.phi) / dt;

  // ---- 7. Trace CM ----
  if (s.cmTrace.length === 0 ||
      Math.hypot(s.cmPos[0] - s.cmTrace[s.cmTrace.length - 1][0],
                 s.cmPos[2] - s.cmTrace[s.cmTrace.length - 1][1]) > 0.002) {
    s.cmTrace.push([s.cmPos[0], s.cmPos[2]]);
    if (s.cmTrace.length > 600) s.cmTrace.shift();
  }

  // ---- 7b. Trace top-centre point (symmetry-axis top) in the LAB (inertial)
  // frame, so the door's swing shows: the shelf-frame point is rotated about
  // the hinge (world +Y) by the door angle θ. Static ⇒ a clean circular arc;
  // tipping ⇒ wobble superimposed on that arc.
  const topRel = [0, 0, 0];
  quatRotate(topRel, s.quat, [0, h / 2, 0]);
  const sx = s.cmPos[0] + topRel[0];
  const sy = s.cmPos[1] + topRel[1];
  const sz = s.cmPos[2] + topRel[2];
  const cT = Math.cos(s.theta), sT = Math.sin(s.theta);
  const topPt = [sx * cT + sz * sT, sy, -sx * sT + sz * cT];   // shelf → world (rotY θ)
  const tt = s.topTrace;
  if (tt.length === 0 ||
      Math.hypot(topPt[0] - tt[tt.length - 1][0],
                 topPt[1] - tt[tt.length - 1][1],
                 topPt[2] - tt[tt.length - 1][2]) > 0.0015) {
    tt.push(topPt);
    if (tt.length > 16000) tt.shift();   // ≥ max substeps/run ⇒ no roll-off within a run
  }

  // ---- 7c. Phase-portrait trace (φ, φ̇), throttled by change ----
  const pa = s.phaseTrace;
  if (pa.length === 0 ||
      Math.abs(s.phi - pa[pa.length - 1][0]) > 3e-4 ||
      Math.abs(s.phiDot - pa[pa.length - 1][1]) > 1.5e-2) {
    pa.push([s.phi, s.phiDot]);
    if (pa.length > 16000) pa.shift();   // ≥ max substeps/run ⇒ no roll-off within a run
  }

  s.t += dt;
}

// ---------------------------------------------------------------------
// Derived geometric quantities
// ---------------------------------------------------------------------
export function geometry(params) {
  const { m, r, h, mu } = params;
  const d = Math.hypot(r, h / 2);                 // CM-to-pivot-edge distance
  const Icm = m * (r * r / 4 + h * h / 12);
  const Iedge = Icm + m * d * d;
  return {
    phiC: Math.atan2(2 * r, h),                   // critical tip angle
    d, Icm, Iedge,
    aTip: 2 * GRAVITY * r / h,                     // shelf-accel tip threshold
    aSlip: mu * GRAVITY,                           // shelf-accel slide threshold
    // Min angular rate at upright pivot to just reach φc (energy barrier):
    //   ½ I_edge φ̇² = m g (d - h/2)
    phiDotCrit: Math.sqrt(2 * m * GRAVITY * (d - h / 2) / Iedge),
  };
}

// ---------------------------------------------------------------------
// Seed a tip-phase state at a given tilt φ0 (rad) and tilt-rate φ̇0 (rad/s),
// with forcing implicitly off (used by validate.mjs). Tilt is about world
// +Z so the symmetry axis tips in the x-direction; contact point is placed
// exactly on the shelf (y=0).
// ---------------------------------------------------------------------
export function makeTipState(params, phi0, phiDot0) {
  const { r, h } = params;
  const s = makeInitialState();
  s.phase = 'tip';
  // Quaternion: rotation of phi0 about world +Z
  const half = phi0 / 2;
  s.quat = [0, 0, Math.sin(half), Math.cos(half)];
  // ω: world angular velocity (0,0,phiDot0) expressed in the body frame
  const qInv = [-s.quat[0], -s.quat[1], -s.quat[2], s.quat[3]];
  const wBody = [0, 0, 0];
  quatRotate(wBody, qInv, [0, 0, phiDot0]);
  s.omegaBody = wBody;
  // Place CM so the lowest rim point sits on the shelf (y=0).
  const xAxisWorld = [0, 0, 0], zAxisWorld = [0, 0, 0];
  quatRotate(xAxisWorld, s.quat, [1, 0, 0]);
  quatRotate(zAxisWorld, s.quat, [0, 0, 1]);
  const A = r * xAxisWorld[1], B = r * zAxisWorld[1];
  const alphaMin = Math.atan2(B, A) + Math.PI;
  const contactRelWorld = [0, 0, 0];
  quatRotate(contactRelWorld, s.quat,
    [r * Math.cos(alphaMin), -h / 2, r * Math.sin(alphaMin)]);
  s.cmPos = [params.x0 ?? 0.30, -contactRelWorld[1], 0];
  // For a rigid pivot about the contact point at rate φ̇0, the CM must
  // translate: v_cm = ω_world × (r_cm − r_contact) = (0,0,φ̇0) × (−contactRelWorld).
  // (ω0 = 0 ⇒ v_cm = 0, so the at-rest seeding is unchanged.)
  s.cmVel = [phiDot0 * contactRelWorld[1], -phiDot0 * contactRelWorld[0], 0];
  s.phi = phi0;
  return s;
}

// ---------------------------------------------------------------------
// Outcome-based regime classification — computed from the whole trajectory,
// independent of the live HUD heuristic.
// ---------------------------------------------------------------------
export function classifyOutcome(s, x0) {
  if (s.fallen) return 'topple';
  if (s.phiMax > TIP_DETECT_RAD) return 'tip-recover';
  const disp = Math.hypot(s.cmPos[0] - x0, s.cmPos[2]);
  if (disp > SLIDE_DETECT_M) return 'slide';
  return 'static';
}

// ---------------------------------------------------------------------
// Run a complete trajectory headlessly and return its outcome.
//   opts.maxT      — hard time cap (s), default 8
//   opts.restAfter — stop early once fallen and t exceeds this, default 1.5
//   opts.dt        — substep, default PHYS_DT
//   opts.initial   — pre-seeded state (e.g. from makeTipState); otherwise
//                    a fresh upright state at params.x0 is used.
// ---------------------------------------------------------------------
export function simulateRun(params, opts = {}) {
  const dt = opts.dt ?? PHYS_DT;
  const maxT = opts.maxT ?? 8;
  const restAfter = opts.restAfter ?? 1.5;
  const x0 = params.x0 ?? 0.30;

  let s;
  if (opts.initial) {
    s = opts.initial;
  } else {
    s = makeInitialState();
    s.cmPos[0] = x0;
    s.cmPos[1] = params.h / 2;
  }

  const maxSteps = Math.ceil(maxT / dt);
  for (let i = 0; i < maxSteps; i++) {
    physicsStep(s, dt, params);
    if (s.fallen && s.t > restAfter) break;
  }

  return {
    regime: classifyOutcome(s, x0),
    phiMax: s.phiMax,
    phiMaxDeg: s.phiMax * 180 / Math.PI,
    toppled: s.fallen,
    finalTiltDeg: s.phi * 180 / Math.PI,
    maxDisp: Math.hypot(s.cmPos[0] - x0, s.cmPos[2]),
    tFinal: s.t,
  };
}
