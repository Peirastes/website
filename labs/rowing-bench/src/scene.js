// The rig in 3D. Every moving part is driven ONLY by plant.s (no free animation).
// Units: metres. Handle pulled along -x; the rope leaves the TOP of the spool, so the spool turns
// counterclockwise about +z (rotation.z = +theta_s). The belt keeps the sense: the large pulley turns
// at theta_m/G and the small pulley + flywheel at theta_m, both counterclockwise.
// Drawn sizes are exaggerated (real spool radius 15 mm); every ANGLE and the handle travel are real.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const ROPE_Y = 0.50;            // spool top
const S = new THREE.Vector3(0, 0.45, 0);       // spool / large pulley axle
const M = new THREE.Vector3(0.78, 0.45, 0);    // motor axle
const RS = 0.05, R1 = 0.16;     // drawn spool and large-pulley radii
const HX0 = -0.62;              // handle home x
const Z_SPOOL = 0.075, Z_BELT = 0.0, Z_FLY = -0.042;   // flywheel behind the small pulley, so the belt wrap stays visible

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.35, ...opts });
}

function spokedWheel(radius, thick, color, nSpokes, hubColor) {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.92, radius * 0.08, 12, 64), mat(color));
  g.add(rim);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, thick * 0.4, 48),
    mat(color, { transparent: true, opacity: 0.35, metalness: 0.2 }));
  disc.rotation.x = Math.PI / 2; g.add(disc);
  for (let j = 0; j < nSpokes; j++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.86, radius * 0.07, thick * 0.6), mat(hubColor || color));
    const a = (j / nSpokes) * Math.PI * 2;
    sp.position.set(Math.cos(a) * radius * 0.43, Math.sin(a) * radius * 0.43, 0); sp.rotation.z = a; g.add(sp);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.14, radius * 0.14, thick, 24), mat(hubColor || 0xc8ccd2));
  hub.rotation.x = Math.PI / 2; g.add(hub);
  // a bright index mark so rotation reads at a glance
  const mark = new THREE.Mesh(new THREE.BoxGeometry(radius * 0.18, radius * 0.18, thick * 0.7),
    mat(0xffae20, { emissive: 0x6a4000, emissiveIntensity: 0.6 }));
  mark.position.set(radius * 0.92, 0, 0); g.add(mark);
  return g;
}

export class Rig {
  constructor(stage) {
    this.stage = stage;
    const renderer = (this.renderer = new THREE.WebGLRenderer({ antialias: true }));
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.domElement.classList.add('webgl');
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    stage.appendChild(renderer.domElement);
    const scene = (this.scene = new THREE.Scene());
    scene.background = new THREE.Color(0x06080c);
    scene.fog = new THREE.Fog(0x06080c, 5, 12);
    const cam = (this.camera = new THREE.PerspectiveCamera(36, 1, 0.02, 50));
    cam.position.set(0.45, 1.25, 3.35);
    const ctl = (this.controls = new OrbitControls(cam, renderer.domElement));
    ctl.target.set(0.42, 0.28, 0); ctl.enableDamping = true; ctl.dampingFactor = 0.08;
    ctl.minDistance = 0.8; ctl.maxDistance = 5; ctl.maxPolarAngle = Math.PI * 0.49;

    scene.add(new THREE.HemisphereLight(0xbfd6ff, 0x1a1410, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(1.5, 3, 2.5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x7dd6ff, 0.5); rim.position.set(-2, 1.5, -2); scene.add(rim);

    this.build();
  }

  build() {
    const sc = this.scene;
    // bench top + legs
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.05, 0.9), mat(0x2a2f36, { roughness: 0.8, metalness: 0.1 }));
    top.position.set(0.3, -0.025, 0); sc.add(top);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 64), mat(0x0b0e13, { roughness: 1, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.9; sc.add(floor);
    for (const [x, z] of [[-1.1, 0.38], [1.7, 0.38], [-1.1, -0.38], [1.7, -0.38]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, 0.05), mat(0x23272d)); leg.position.set(x, -0.475, z); sc.add(leg);
    }
    // rail the handle rides on
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.02, 0.05), mat(0x5a626c)); rail.position.set(HX0 - 0.2, 0.01, Z_SPOOL); sc.add(rail);
    // axle stands
    for (const [p, h] of [[S, S.y], [M, M.y]]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.04), mat(0x3d434b)); st.position.set(p.x, h / 2, -0.12); sc.add(st);
      const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 12), mat(0xb8bec6)); ax.rotation.x = Math.PI / 2; ax.position.set(p.x, p.y, 0); sc.add(ax);
    }

    // handle
    this.handle = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 16), mat(0x1c1c1f, { roughness: 0.9 }));
    bar.rotation.x = Math.PI / 2; this.handle.add(bar);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.2, 16), mat(0xe8e8e8, { roughness: 0.6 })); grip.rotation.x = Math.PI / 2; this.handle.add(grip);
    sc.add(this.handle);

    // rope (rebuilt each frame: straight when taut, sagging when slack)
    this.ropeMat = mat(0xf4d35e, { roughness: 0.7, metalness: 0.0 });
    this.rope = new THREE.Mesh(new THREE.BufferGeometry(), this.ropeMat); sc.add(this.rope);

    // spool + recoil spring (spool side of the clutch)
    this.spool = spokedWheel(RS, 0.05, 0x93c5fd, 3, 0xdde6f0); this.spool.position.set(S.x, S.y, Z_SPOOL); sc.add(this.spool);
    // the clutch ring between spool and large pulley: amber when locked
    this.clutchMat = mat(0x5a3d10, { emissive: 0x000000, emissiveIntensity: 1.0, metalness: 0.6 });
    this.clutch = new THREE.Mesh(new THREE.TorusGeometry(RS * 1.35, 0.006, 12, 64), this.clutchMat);
    this.clutch.position.set(S.x, S.y, Z_SPOOL - 0.03); sc.add(this.clutch);
    // large pulley (motor side): turns at theta_m / G
    this.big = spokedWheel(R1, 0.03, 0x8a96a3, 5); this.big.position.set(S.x, S.y, Z_BELT); sc.add(this.big);
    // motor: can behind, small pulley on the shaft, flywheel in front
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.26, 40), mat(0x30363e, { metalness: 0.6, roughness: 0.4 }));
    can.rotation.x = Math.PI / 2; can.position.set(M.x, M.y, -0.2); sc.add(can);
    const capm = new THREE.Mesh(new THREE.CylinderGeometry(0.077, 0.077, 0.02, 40), mat(0x9aa3ad)); capm.rotation.x = Math.PI / 2; capm.position.set(M.x, M.y, -0.065); sc.add(capm);
    this.fly = spokedWheel(0.13, 0.02, 0x6c7580, 6, 0xb0b8c2); this.fly.position.set(M.x, M.y, Z_FLY); sc.add(this.fly);
    this.smallGroup = new THREE.Group(); this.smallGroup.position.set(M.x, M.y, Z_BELT); sc.add(this.smallGroup);
    // belt (rebuilt when G changes) + markers riding on it
    this.beltMat = mat(0x1d1f22, { roughness: 0.95, metalness: 0.0 });
    this.belt = new THREE.Mesh(new THREE.BufferGeometry(), this.beltMat); sc.add(this.belt);
    this.beltMarks = [];
    for (let j = 0; j < 6; j++) {
      const mk = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.026), mat(0xe8e8e8, { emissive: 0x333333 }));
      sc.add(mk); this.beltMarks.push(mk);
    }
    this.G = null; this.setGear(5);

    // wires: motor -> load board
    this.board = new THREE.Group(); this.board.position.set(1.42, 0, 0); sc.add(this.board);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.5), mat(0x173b2a, { roughness: 0.7, metalness: 0.1 }));
    plate.position.set(0, 0.006, 0); this.board.add(plate);
    const wpath = (dz, c) => {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(M.x, M.y - 0.05, -0.32), new THREE.Vector3(M.x + 0.2, 0.12, -0.3 + dz),
        new THREE.Vector3(1.2, 0.03, -0.12 + dz), new THREE.Vector3(1.28, 0.03, -0.12 + dz)]);
      const w = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.007, 8), mat(c, { roughness: 0.6 })); sc.add(w);
    };
    wpath(0.0, 0xc0392b); wpath(0.05, 0x111111);
    this.buildLoads();
  }

  buildLoads() {
    const b = this.board;
    // resistor bank: three ceramic power resistors; glow with the power they burn
    this.gR = new THREE.Group(); b.add(this.gR);
    this.resMats = [];
    for (let j = 0; j < 3; j++) {
      const m = mat(0xd9cdb4, { roughness: 0.8, metalness: 0.05, emissive: 0x000000 });
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), m); r.position.set(0, 0.04, -0.12 + j * 0.12); this.gR.add(r); this.resMats.push(m);
      for (const sx of [-0.13, 0.13]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.06, 6), mat(0xcccccc)); t.rotation.z = Math.PI / 2; t.position.set(sx, 0.04, -0.12 + j * 0.12); this.gR.add(t); }
    }
    // diode + supercapacitor with a fill gauge
    this.gC = new THREE.Group(); b.add(this.gC);
    const diode = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 16), mat(0x111111)); diode.rotation.z = Math.PI / 2; diode.position.set(-0.12, 0.03, -0.14); this.gC.add(diode);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.008, 16), mat(0xdddddd)); band.rotation.z = Math.PI / 2; band.position.set(-0.1, 0.03, -0.14); this.gC.add(band);
    const capCan = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 40), mat(0x1f4fa0, { metalness: 0.5, roughness: 0.35, transparent: true, opacity: 0.55 }));
    capCan.position.set(0.05, 0.12, 0.05); this.gC.add(capCan);
    this.capFill = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 1, 40), mat(0x22d3ee, { emissive: 0x0b5560, emissiveIntensity: 0.9, metalness: 0.1 }));
    this.capFill.position.set(0.05, 0.012, 0.05); this.gC.add(this.capFill);
    // charge controller + battery with a state-of-charge gauge
    this.gB = new THREE.Group(); b.add(this.gB);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.12), mat(0x23272d, { metalness: 0.5 })); box.position.set(-0.08, 0.036, -0.14); this.gB.add(box);
    this.ctrlLedMat = mat(0x0a2a12, { emissive: 0x000000, emissiveIntensity: 1 });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 8), this.ctrlLedMat); led.position.set(-0.02, 0.07, -0.1); this.gB.add(led);
    const batt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.13), mat(0x2b2f36, { metalness: 0.3, roughness: 0.6 })); batt.position.set(0.06, 0.066, 0.08); this.gB.add(batt);
    for (const [x, c] of [[0.0, 0xc0392b], [0.12, 0x111111]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.02, 12), mat(c)); t.position.set(x, 0.135, 0.08); this.gB.add(t); }
    const gaugeBack = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.004), mat(0x0a0d12)); gaugeBack.position.set(0.06, 0.07, 0.147); this.gB.add(gaugeBack);
    this.socBar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.018, 0.004), mat(0x9ae6b4, { emissive: 0x2b6b45, emissiveIntensity: 0.9 }));
    this.socBar.position.set(0.06, 0.07, 0.15); this.gB.add(this.socBar);
    // open circuit: just two terminal posts
    this.gO = new THREE.Group(); b.add(this.gO);
    for (const z of [-0.12, -0.07]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 12), mat(z < -0.1 ? 0xc0392b : 0x111111)); t.position.set(-0.12, 0.03, z); this.gO.add(t); }
  }

  setGear(G) {
    if (this.G === G) return;
    this.G = G;
    const R2 = Math.max(0.026, R1 / G);
    this.R2 = R2;
    // small pulley
    this.smallGroup.clear();
    const sp = spokedWheel(R2, 0.03, 0x93c5fd, 3, 0xdde6f0); this.smallGroup.add(sp); this.smallWheel = sp;
    // belt: open belt around both pulleys (exact external tangents + wrap arcs), as a closed path
    const d = M.x - S.x, s = (R1 - R2) / d, c = Math.sqrt(1 - s * s);
    const a1 = Math.atan2(c, s);          // tangent-point angle on both circles (upper span)
    const pts = [];
    const arc = (cx, cy, R, from, to, n) => { for (let j = 0; j <= n; j++) { const a = from + (to - from) * j / n; pts.push(new THREE.Vector3(cx + R * Math.cos(a), cy + R * Math.sin(a), Z_BELT)); } };
    // walk the belt in its direction of travel (CCW pulleys): upper span runs from the motor toward the spool
    arc(M.x, M.y, R2 * 1.04, -a1, a1, 30);                       // around the small pulley (right side), bottom -> top
    arc(S.x, S.y, R1 * 1.02, a1, 2 * Math.PI - a1, 80);           // around the large pulley (left side), top -> bottom
    pts.push(pts[0].clone());
    const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.0);
    this.belt.geometry.dispose();
    this.belt.geometry = new THREE.TubeGeometry(curve, 400, 0.006, 6, true);
    this.beltCurve = curve; this.beltLen = curve.getLength();
  }

  resize(rail) {
    const W = this.stage.clientWidth, H = this.stage.clientHeight;
    this.renderer.setSize(W, H, false);
    this.camera.aspect = W / H;
    // centre the world in the space left of the rail (canon: shift the projection, not the world)
    const railLeft = rail ? rail.getBoundingClientRect().left : W;
    const usable = Math.max(200, Math.min(W, railLeft));
    const dx = W / 2 - usable / 2;
    this.camera.setViewOffset(W, H, dx, 0, W, H);
    this.camera.updateProjectionMatrix();
  }

  update(plant, load) {
    const s = plant.s, p = plant.p;
    this.setGear(p.G);
    // handle: real travel along -x
    const hx = HX0 - s.xh;
    this.handle.position.set(hx, ROPE_Y, Z_SPOOL);
    // rope: taut when it carries tension, sagging by the physical slack r*theta_s - x_h otherwise
    const a = new THREE.Vector3(hx + 0.02, ROPE_Y, Z_SPOOL), bpt = new THREE.Vector3(S.x, ROPE_Y, Z_SPOOL);
    const slack = Math.max(0, p.r_spool * s.th_s - s.xh);
    const L = bpt.x - a.x;
    const sag = s.T > 0 ? 0 : Math.min(0.14, 0.9 * Math.sqrt(slack * Math.max(L, 0.05)));
    const mid = a.clone().lerp(bpt, 0.5); mid.y -= sag;
    const rc = new THREE.QuadraticBezierCurve3(a, mid, bpt);
    this.rope.geometry.dispose(); this.rope.geometry = new THREE.TubeGeometry(rc, 24, 0.0045, 6, false);
    // rotations (CCW about +z), angles real
    this.spool.rotation.z = s.th_s;
    this.big.rotation.z = s.th_m / p.G;
    this.smallWheel.rotation.z = s.th_m;
    this.fly.rotation.z = s.th_m;
    // belt markers move with the belt surface: distance = R1 * (theta_m / G) (drawn radius)
    const travel = R1 * (s.th_m / p.G);
    for (let j = 0; j < this.beltMarks.length; j++) {
      const u = ((travel / this.beltLen + j / this.beltMarks.length) % 1 + 1) % 1;
      const q = this.beltCurve.getPointAt(u);          // the path is laid out in the direction of travel
      this.beltMarks[j].position.copy(q);
    }
    // clutch ring: amber when locked
    this.clutchMat.emissive.setHex(s.locked ? 0xffae20 : 0x000000);
    this.clutchMat.color.setHex(s.locked ? 0xffae20 : 0x5a3d10);
    // loads
    this.gR.visible = load === 'R'; this.gC.visible = load === 'C'; this.gB.visible = load === 'batt'; this.gO.visible = load === 'open';
    if (load === 'R') {
      const glow = Math.min(1, s.P_load / 25);
      for (const m of this.resMats) m.emissive.setRGB(glow, glow * 0.35, 0);
    }
    if (load === 'C') {
      const f = Math.max(0.002, Math.min(1, s.Vc / p.C_rating));
      this.capFill.scale.y = 0.2 * f; this.capFill.position.y = 0.012 + 0.1 * f;
    }
    if (load === 'batt') {
      const f = Math.max(0.01, Math.min(1, s.soc));
      this.socBar.scale.x = 0.15 * f; this.socBar.position.x = 0.06 - 0.075 + 0.075 * f;
      this.ctrlLedMat.emissive.setHex(s.i_batt > 1e-3 ? 0x34d399 : 0x000000);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // anchor points for the leader labels
  anchors(plant) {
    const s = plant.s;
    return [
      ['handle', new THREE.Vector3(HX0 - s.xh, ROPE_Y + 0.13, Z_SPOOL)],
      ['spool + recoil spring', new THREE.Vector3(S.x - 0.05, S.y - 0.11, Z_SPOOL + 0.02)],
      ['one-way clutch', new THREE.Vector3(S.x + 0.11, S.y + 0.1, Z_SPOOL)],
      ['large pulley', new THREE.Vector3(S.x, S.y - R1 - 0.06, 0)],
      ['belt', new THREE.Vector3((S.x + M.x) / 2, S.y + 0.16, 0)],
      ['motor + flywheel', new THREE.Vector3(M.x, M.y + 0.2, Z_FLY)],
      ['load', new THREE.Vector3(1.42, 0.28, 0)],
    ];
  }

  project(v) {
    const p = v.clone().project(this.camera);
    const R = this.renderer.domElement.getBoundingClientRect();
    return [R.left + (p.x + 1) / 2 * R.width, R.top + (1 - p.y) / 2 * R.height, p.z < 1];
  }
}
