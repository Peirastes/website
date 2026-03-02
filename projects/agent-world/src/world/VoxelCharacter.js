import * as THREE from 'three';

/**
 * Smooth low-poly character system — v8 "Human Proportions"
 *
 * Smaller head (~1/5 height), longer torso & limbs, organic profiles.
 * ~2200 tri per character. Total height: 1.5 world units.
 *
 * Body layout (world Y):
 *   0.00  shoe sole
 *   0.07  ankle
 *   0.30  knee joints
 *   0.55  hip joints / torso bottom
 *   0.75  waist
 *   0.95  torso top / collar
 *   0.92  shoulder joints
 *   0.98  head joint (neck top)
 *   1.18  head center (radius 0.20)
 *   ~1.40 head top
 *   ~1.50 hair top
 */

// ─── Material cache ──────────────────────────────────────────────────────────

const _mats = new Map();
function gm(color, roughness = 0.72) {
  const key = color + '|' + roughness;
  if (!_mats.has(key)) {
    _mats.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }));
  }
  return _mats.get(key);
}

function mp(geo, color, x, y, z, roughness) {
  const m = new THREE.Mesh(geo, gm(color, roughness));
  if (x !== undefined) m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

// ─── Profile tube geometry ───────────────────────────────────────────────────

function profileGeo(rings, seg = 10) {
  const positions = [];
  const stride = seg + 1;
  for (const r of rings) {
    for (let s = 0; s <= seg; s++) {
      const a = (s / seg) * Math.PI * 2;
      positions.push(Math.cos(a) * r.rx, r.y, Math.sin(a) * r.rz);
    }
  }
  const indices = [];
  for (let r = 0; r < rings.length - 1; r++) {
    for (let s = 0; s < seg; s++) {
      const a = r * stride + s, b = a + 1;
      const c = (r + 1) * stride + s, d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }
  const topI = positions.length / 3;
  positions.push(0, rings[0].y, 0);
  for (let s = 0; s < seg; s++) indices.push(topI, s, s + 1);
  const botI = positions.length / 3;
  const last = (rings.length - 1) * stride;
  positions.push(0, rings[rings.length - 1].y, 0);
  for (let s = 0; s < seg; s++) indices.push(botI, last + s + 1, last + s);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ─── HEAD (smaller, human-proportioned) ──────────────────────────────────────

function buildHead(cfg, parent) {
  const HC = 0.20;  // head center relative to headJoint
  const HR = 0.20;  // head radius (was 0.28)

  // Skull
  const skullGeo = new THREE.SphereGeometry(HR, 16, 12);
  skullGeo.scale(1.0, 1.10, 0.95);
  parent.add(mp(skullGeo, cfg.skinColor, 0, HC, 0, 0.82));

  // Subtle cheek volume
  for (const s of [-1, 1]) {
    const cg = new THREE.SphereGeometry(0.055, 6, 4);
    cg.scale(1, 0.7, 0.6);
    parent.add(mp(cg, cfg.skinColor, s * 0.13, HC - 0.04, 0.08, 0.82));
  }

  // Neck
  parent.add(mp(new THREE.CylinderGeometry(0.050, 0.058, 0.07, 8), cfg.skinColor, 0, 0.01, 0, 0.82));

  // Ears
  for (const s of [-1, 1]) {
    const eg = new THREE.SphereGeometry(0.028, 6, 5);
    eg.scale(0.45, 1, 0.65);
    parent.add(mp(eg, cfg.skinColor, s * 0.20, HC + 0.01, -0.01, 0.82));
  }

  // ── Eyes ──
  const eyeX = 0.068;
  const eyeY = HC + 0.03;
  const ezSq = HR * HR * 0.90 - eyeX * eyeX - 0.03 * 0.03;
  const eyeZ = (ezSq > 0 ? Math.sqrt(ezSq) : 0.14) + 0.008;

  for (const s of [-1, 1]) {
    const ex = s * eyeX;
    parent.add(mp(new THREE.SphereGeometry(0.022, 8, 6), '#eeeef5', ex, eyeY, eyeZ, 0.2));
    parent.add(mp(new THREE.SphereGeometry(0.013, 8, 6), cfg.eyeColor, ex, eyeY - 0.002, eyeZ + 0.012, 0.25));
    parent.add(mp(new THREE.SphereGeometry(0.007, 6, 5), '#0a0a14', ex, eyeY - 0.004, eyeZ + 0.017, 0.15));
    parent.add(mp(new THREE.SphereGeometry(0.003, 4, 3), '#ffffff', ex - s * 0.004, eyeY + 0.006, eyeZ + 0.020, 0.0));
  }

  // Eyebrows
  for (const s of [-1, 1]) {
    parent.add(mp(new THREE.BoxGeometry(0.048, 0.010, 0.009), cfg.eyebrowColor, s * eyeX, eyeY + 0.028, eyeZ - 0.004, 0.6));
    parent.add(mp(new THREE.BoxGeometry(0.015, 0.007, 0.008), cfg.eyebrowColor, s * (eyeX + s * 0.026), eyeY + 0.024, eyeZ - 0.007, 0.6));
  }

  // Nose
  const noseY = HC - 0.005;
  const nzSq = HR * HR * 0.90 - 0.005 * 0.005;
  const noseZ = (nzSq > 0 ? Math.sqrt(nzSq) : 0.17) + 0.008;
  parent.add(mp(new THREE.SphereGeometry(0.016, 5, 4), cfg.skinColor, 0, noseY, noseZ, 0.85));
  for (const s of [-1, 1])
    parent.add(mp(new THREE.SphereGeometry(0.004, 4, 3), cfg.skinShadow, s * 0.008, noseY - 0.009, noseZ + 0.007, 0.9));

  // Mouth
  const mouthY = HC - 0.07;
  const mzSq = HR * HR * 0.90 - 0.07 * 0.07;
  const mouthZ = (mzSq > 0 ? Math.sqrt(mzSq) : 0.16) + 0.006;
  parent.add(mp(new THREE.BoxGeometry(0.040, 0.005, 0.006), '#7a3838', 0, mouthY + 0.003, mouthZ, 0.6));
  parent.add(mp(new THREE.BoxGeometry(0.032, 0.007, 0.007), '#9a5050', 0, mouthY - 0.004, mouthZ + 0.002, 0.5));

  buildHair(cfg, parent, HC);
  if (cfg.accessories?.includes('glasses')) buildGlasses(cfg, parent, eyeX, eyeY, eyeZ);
  if (cfg.accessories?.includes('hat')) buildHat(cfg, parent, HC);
}

// ─── HAIR ────────────────────────────────────────────────────────────────────

function buildHair(cfg, parent, HC) {
  const c = cfg.hairColor, hi = cfg.hairHighlight;
  const R = 0.215; // hair cap radius (slightly larger than head)

  switch (cfg.hairStyle || 'short') {
    case 'short': {
      parent.add(mp(new THREE.SphereGeometry(R, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), c, 0, HC + 0.03, -0.01, 0.55));
      for (const s of [-1, 1]) {
        const sg = new THREE.SphereGeometry(0.07, 6, 4, 0, Math.PI, 0, Math.PI * 0.8);
        sg.rotateZ(s * Math.PI / 2);
        parent.add(mp(sg, c, s * 0.16, HC + 0.07, -0.03, 0.55));
      }
      parent.add(mp(new THREE.BoxGeometry(0.07, 0.010, 0.10), hi, -0.04, HC + 0.22, 0.01, 0.45));
      break;
    }
    case 'buzz': {
      parent.add(mp(new THREE.SphereGeometry(0.208, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.48), c, 0, HC + 0.02, -0.01, 0.7));
      break;
    }
    case 'mohawk': {
      parent.add(mp(new THREE.BoxGeometry(0.08, 0.04, 0.26), c, 0, HC + 0.16, -0.01, 0.55));
      parent.add(mp(new THREE.BoxGeometry(0.05, 0.16, 0.22), c, 0, HC + 0.26, -0.01, 0.55));
      parent.add(mp(new THREE.BoxGeometry(0.03, 0.08, 0.16), hi, 0, HC + 0.36, -0.01, 0.45));
      parent.add(mp(new THREE.BoxGeometry(0.015, 0.14, 0.18), hi, 0, HC + 0.26, 0, 0.45));
      break;
    }
    case 'long': {
      parent.add(mp(new THREE.SphereGeometry(R + 0.005, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), c, 0, HC + 0.03, -0.015, 0.55));
      for (const s of [-1, 1]) {
        parent.add(mp(new THREE.BoxGeometry(0.04, 0.26, 0.16), c, s * 0.19, HC - 0.07, -0.01, 0.55));
        parent.add(mp(new THREE.BoxGeometry(0.03, 0.20, 0.13), c, s * 0.17, HC - 0.04, 0.02, 0.55));
      }
      parent.add(mp(new THREE.BoxGeometry(0.27, 0.30, 0.04), c, 0, HC - 0.04, -0.17, 0.55));
      for (const s of [-1, 1])
        parent.add(mp(new THREE.BoxGeometry(0.018, 0.08, 0.03), c, s * 0.14, HC - 0.01, 0.13, 0.55));
      parent.add(mp(new THREE.BoxGeometry(0.08, 0.012, 0.10), hi, -0.03, HC + 0.22, 0.03, 0.45));
      break;
    }
    case 'ponytail': {
      parent.add(mp(new THREE.SphereGeometry(R, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), c, 0, HC + 0.02, -0.01, 0.55));
      const tail = mp(new THREE.CylinderGeometry(0.032, 0.015, 0.18, 6), c, 0, HC - 0.06, -0.21, 0.55);
      tail.rotation.x = 0.35;
      parent.add(tail);
      parent.add(mp(new THREE.TorusGeometry(0.035, 0.008, 6, 8), hi, 0, HC + 0.03, -0.19, 0.4));
      for (const s of [-1, 1])
        parent.add(mp(new THREE.SphereGeometry(0.055, 5, 4), c, s * 0.16, HC + 0.04, -0.07, 0.55));
      break;
    }
    case 'parted': {
      parent.add(mp(new THREE.SphereGeometry(R, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.50), c, 0, HC + 0.025, -0.01, 0.55));
      parent.add(mp(new THREE.BoxGeometry(0.009, 0.025, 0.14), cfg.skinColor, 0.03, HC + 0.23, 0, 0.82));
      parent.add(mp(new THREE.BoxGeometry(0.04, 0.10, 0.14), c, -0.17, HC + 0.07, -0.01, 0.55));
      parent.add(mp(new THREE.SphereGeometry(0.05, 5, 4), c, -0.16, HC + 0.11, 0.03, 0.55));
      parent.add(mp(new THREE.BoxGeometry(0.03, 0.04, 0.11), c, 0.17, HC + 0.10, -0.01, 0.55));
      parent.add(mp(new THREE.BoxGeometry(0.23, 0.12, 0.04), c, 0, HC + 0.04, -0.16, 0.55));
      parent.add(mp(new THREE.BoxGeometry(0.065, 0.010, 0.10), hi, -0.06, HC + 0.22, 0.02, 0.45));
      break;
    }
  }
}

// ─── GLASSES ─────────────────────────────────────────────────────────────────

function buildGlasses(cfg, parent, eyeX, eyeY, eyeZ) {
  const fc = '#353545', z = eyeZ + 0.014, t = 0.005;
  for (const s of [-1, 1]) {
    const cx = s * eyeX;
    parent.add(mp(new THREE.BoxGeometry(0.054, t, t), fc, cx, eyeY + 0.024, z, 0.15));
    parent.add(mp(new THREE.BoxGeometry(0.054, t, t), fc, cx, eyeY - 0.024, z, 0.15));
    parent.add(mp(new THREE.BoxGeometry(t, 0.053, t), fc, cx - 0.026, eyeY, z, 0.15));
    parent.add(mp(new THREE.BoxGeometry(t, 0.053, t), fc, cx + 0.026, eyeY, z, 0.15));
    parent.add(mp(new THREE.BoxGeometry(0.046, 0.042, 0.002), '#8888aa', cx, eyeY, z - 0.002, 0.1));
  }
  parent.add(mp(new THREE.BoxGeometry(eyeX * 2 - 0.052, t * 0.8, t), fc, 0, eyeY + 0.015, z, 0.15));
  for (const s of [-1, 1])
    parent.add(mp(new THREE.BoxGeometry(t, t, 0.12), fc, s * (eyeX + 0.026), eyeY + 0.008, z - 0.06, 0.15));
}

// ─── HAT ─────────────────────────────────────────────────────────────────────

function buildHat(cfg, parent, HC) {
  const hc = cfg.hatColor || cfg.hairColor, bc = cfg.hatBand || cfg.beltColor;
  parent.add(mp(new THREE.CylinderGeometry(0.15, 0.18, 0.12, 10), hc, 0, HC + 0.24, -0.01, 0.6));
  parent.add(mp(new THREE.CylinderGeometry(0.12, 0.14, 0.015, 10), bc, 0, HC + 0.305, -0.01, 0.65));
  parent.add(mp(new THREE.CylinderGeometry(0.26, 0.27, 0.018, 14), hc, 0, HC + 0.17, 0.015, 0.6));
  parent.add(mp(new THREE.CylinderGeometry(0.185, 0.185, 0.025, 10), bc, 0, HC + 0.195, -0.01, 0.5));
}

// ─── TORSO (taller, slimmer) ─────────────────────────────────────────────────

function buildTorso(cfg, parent) {
  const torsoGeo = profileGeo([
    { y:  0.20, rx: 0.19, rz: 0.10 },  // shoulders
    { y:  0.16, rx: 0.18, rz: 0.11 },  // upper chest
    { y:  0.08, rx: 0.17, rz: 0.11 },  // chest
    { y:  0.00, rx: 0.14, rz: 0.10 },  // waist (narrowest)
    { y: -0.08, rx: 0.15, rz: 0.10 },  // lower waist
    { y: -0.15, rx: 0.16, rz: 0.10 },  // hips
    { y: -0.20, rx: 0.16, rz: 0.10 },  // bottom
  ], 12);
  parent.add(mp(torsoGeo, cfg.shirtColor, 0, 0.75, 0));

  // Shoulder caps
  for (const s of [-1, 1])
    parent.add(mp(new THREE.SphereGeometry(0.052, 8, 6), cfg.shirtColor, s * 0.19, 0.94, 0));

  // Belt
  parent.add(mp(new THREE.CylinderGeometry(0.165, 0.165, 0.04, 12), cfg.beltColor, 0, 0.57, 0, 0.5));
  parent.add(mp(new THREE.BoxGeometry(0.035, 0.030, 0.012), cfg.beltBuckle, 0, 0.57, 0.17, 0.3));

  // Collar
  parent.add(mp(new THREE.CylinderGeometry(0.10, 0.12, 0.03, 10), cfg.collarColor || cfg.shirtHighlight, 0, 0.97, 0.01));
  parent.add(mp(new THREE.BoxGeometry(0.03, 0.03, 0.02), cfg.skinColor, 0, 0.965, 0.11, 0.82));
}

// ─── ARMS (longer, tapered) ──────────────────────────────────────────────────

function buildArm(cfg, shoulder) {
  // Upper arm (longer: 0.22)
  const upperGeo = profileGeo([
    { y:  0.00, rx: 0.048, rz: 0.044 },
    { y: -0.06, rx: 0.046, rz: 0.042 },
    { y: -0.15, rx: 0.040, rz: 0.038 },
    { y: -0.22, rx: 0.036, rz: 0.036 },
  ], 8);
  shoulder.add(mp(upperGeo, cfg.shirtColor, 0, -0.01, 0));

  const elbow = new THREE.Group();
  elbow.position.set(0, -0.22, 0);
  shoulder.add(elbow);

  // Forearm (longer: 0.14)
  const foreGeo = profileGeo([
    { y:  0.00, rx: 0.038, rz: 0.036 },
    { y: -0.05, rx: 0.036, rz: 0.034 },
    { y: -0.14, rx: 0.030, rz: 0.029 },
  ], 8);
  elbow.add(mp(foreGeo, cfg.shirtColor, 0, 0, 0));

  // Wrist cuff
  elbow.add(mp(new THREE.CylinderGeometry(0.033, 0.033, 0.010, 8), cfg.shirtHighlight || cfg.shirtColor, 0, -0.135, 0));

  // Hand
  const handGeo = new THREE.SphereGeometry(0.032, 7, 5);
  handGeo.scale(1, 1.1, 0.9);
  elbow.add(mp(handGeo, cfg.skinColor, 0, -0.17, 0, 0.82));

  return elbow;
}

// ─── LEGS (longer, tapered) ──────────────────────────────────────────────────

function buildLeg(cfg, hip) {
  // Thigh (longer: 0.25)
  const thighGeo = profileGeo([
    { y:  0.00, rx: 0.062, rz: 0.055 },
    { y: -0.06, rx: 0.058, rz: 0.052 },
    { y: -0.14, rx: 0.050, rz: 0.048 },
    { y: -0.22, rx: 0.044, rz: 0.044 },
    { y: -0.25, rx: 0.042, rz: 0.042 },
  ], 8);
  hip.add(mp(thighGeo, cfg.pantsColor, 0, 0, 0));

  // Knee cap
  hip.add(mp(new THREE.SphereGeometry(0.044, 6, 5), cfg.pantsColor, 0, -0.25, 0.008));

  const knee = new THREE.Group();
  knee.position.set(0, -0.25, 0);
  hip.add(knee);

  // Calf (longer: 0.23)
  const calfGeo = profileGeo([
    { y:  0.00, rx: 0.043, rz: 0.042 },
    { y: -0.05, rx: 0.046, rz: 0.046 },  // calf bulge
    { y: -0.12, rx: 0.040, rz: 0.038 },
    { y: -0.18, rx: 0.033, rz: 0.032 },
    { y: -0.23, rx: 0.028, rz: 0.028 },  // ankle
  ], 8);
  knee.add(mp(calfGeo, cfg.pantsColor, 0, 0, 0));

  // Shoe
  knee.add(mp(new THREE.BoxGeometry(0.09, 0.050, 0.13), cfg.shoeColor, 0, -0.265, 0.012, 0.35));
  knee.add(mp(new THREE.BoxGeometry(0.10, 0.012, 0.15), cfg.shoeColor, 0, -0.296, 0.012, 0.4));
  knee.add(mp(new THREE.BoxGeometry(0.08, 0.035, 0.022), cfg.shoeHighlight || cfg.shoeColor, 0, -0.268, 0.085, 0.35));

  return knee;
}

// ─── BACKPACK ────────────────────────────────────────────────────────────────

function buildBackpack(cfg, parent) {
  const bpColor = cfg.shirtShadow || cfg.shirtColor;
  parent.add(mp(new THREE.BoxGeometry(0.24, 0.28, 0.09), bpColor, 0, 0.74, -0.145));
  parent.add(mp(new THREE.BoxGeometry(0.22, 0.06, 0.025), cfg.shirtColor, 0, 0.82, -0.11));
  parent.add(mp(new THREE.BoxGeometry(0.03, 0.022, 0.010), cfg.beltBuckle, 0, 0.79, -0.10, 0.3));
  parent.add(mp(new THREE.BoxGeometry(0.17, 0.09, 0.018), cfg.shirtColor, 0, 0.63, -0.105));
  for (const s of [-1, 1]) {
    parent.add(mp(new THREE.BoxGeometry(0.025, 0.18, 0.018), bpColor, s * 0.08, 0.88, 0.06));
    parent.add(mp(new THREE.BoxGeometry(0.025, 0.07, 0.10), bpColor, s * 0.08, 0.94, -0.04));
  }
}

// ─── BUILDER ─────────────────────────────────────────────────────────────────

export class VoxelCharacterBuilder {
  static build(cfg) {
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);

    buildTorso(cfg, body);

    const headJoint = new THREE.Group();
    headJoint.position.set(0, 0.98, 0);
    buildHead(cfg, headJoint);
    body.add(headJoint);

    const lSh = new THREE.Group();
    lSh.position.set(-0.19, 0.93, 0);
    const lEl = buildArm(cfg, lSh);
    body.add(lSh);

    const rSh = new THREE.Group();
    rSh.position.set(0.19, 0.93, 0);
    const rEl = buildArm(cfg, rSh);
    body.add(rSh);

    const lHip = new THREE.Group();
    lHip.position.set(-0.08, 0.55, 0);
    const lKn = buildLeg(cfg, lHip);
    body.add(lHip);

    const rHip = new THREE.Group();
    rHip.position.set(0.08, 0.55, 0);
    const rKn = buildLeg(cfg, rHip);
    body.add(rHip);

    if (cfg.accessories?.includes('backpack')) buildBackpack(cfg, body);

    root.userData.joints = {
      bodyGroup: body, headJoint,
      leftShoulder: lSh, rightShoulder: rSh,
      leftElbow: lEl, rightElbow: rEl,
      leftHip: lHip, rightHip: rHip,
      leftKnee: lKn, rightKnee: rKn,
    };
    return root;
  }
}

// ─── ANIMATOR ────────────────────────────────────────────────────────────────

const DIR_ANGLES = [0, Math.PI / 2, -Math.PI / 2, Math.PI];

export class VoxelCharacterAnimator {
  constructor(root) {
    this.root = root;
    const j = root.userData.joints;
    this.body = j.bodyGroup;
    this.head = j.headJoint;
    this.lSh = j.leftShoulder; this.rSh = j.rightShoulder;
    this.lEl = j.leftElbow;    this.rEl = j.rightElbow;
    this.lHip = j.leftHip;     this.rHip = j.rightHip;
    this.lKn = j.leftKnee;     this.rKn = j.rightKnee;
    this.walkPhase = 0;
    this.walkSpeed = 8;
  }

  update(dt, moving, dir, orbit) {
    if (moving) this.walkPhase += dt * this.walkSpeed;
    else {
      this.walkPhase *= Math.max(0, 1 - dt * 10);
      if (Math.abs(this.walkPhase) < 0.01) this.walkPhase = 0;
    }
    const p = this.walkPhase, s = Math.sin(p), a = Math.abs(s);

    this.lHip.rotation.x = s * 0.5;   this.rHip.rotation.x = -s * 0.5;
    this.lKn.rotation.x = s > 0 ? 0 : a * 0.6; this.rKn.rotation.x = s < 0 ? 0 : a * 0.6;
    this.lSh.rotation.x = -s * 0.6;   this.rSh.rotation.x = s * 0.6;
    this.lEl.rotation.x = s < 0 ? a * 0.3 : 0; this.rEl.rotation.x = s > 0 ? a * 0.3 : 0;

    const bob = Math.abs(Math.sin(p * 2)) * 0.02;
    this.body.position.y = moving ? bob : 0;
    this.head.rotation.x = moving ? -bob * 2 : 0;
    this.root.rotation.y = DIR_ANGLES[dir];
  }
}
