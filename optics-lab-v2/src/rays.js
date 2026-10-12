// Rays drawn into the scene, all from the thin-lens model (no separate optics here):
//  - three principal rays from one object point: parallel -> through F', chief (undeviated), through F -> parallel
//  - a light cone: rays from that point to the rim of the clear aperture, converging toward the image point; where
//    the cone meets the screen is exactly the blur disc the screen picture shows
//  - focal points F and F' on the axis, a faint optical axis
//  - a ghost upright arrow where a VIRTUAL image forms, with dashed back-projections of the rays
// Rays run from the object point to the lens plane, then to the screen plane (they stop at the screen).
import * as THREE from "three";
import { cmToX, AXIS_Y, OBJ_TIP, arrowMesh } from "./bench.js";

// the object point the rays leave from: the arrow's tip, as in the textbook construction
export const RAY_SRC = { u: OBJ_TIP[0], v: OBJ_TIP[1] };
const RIM = 20;

// cm (x along the rail, y up from the axis, z toward the viewer) -> world
const W = (x, y, z) => new THREE.Vector3(cmToX(x), AXIS_Y + y / 100, z / 100);

const glowMat = (rgb, opacity = 1) => {
  const m = new THREE.MeshBasicMaterial({ transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  m.color.setRGB(...rgb); return m;
};
const COL = { par: [2.2, 1.35, 0.25], chief: [0.55, 1.6, 2.4], foc: [2.2, 0.7, 1.4], cone: [1.0, 0.95, 0.85] };

export class Rays {
  constructor(scene) {
    this.g = new THREE.Group(); this.g.name = "rays"; scene.add(this.g);
    this.unit = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
    this.mats = { par: glowMat(COL.par), chief: glowMat(COL.chief), foc: glowMat(COL.foc), cone: glowMat(COL.cone, 0.07), coneIn: glowMat([0.7, 1.0, 1.3], 0.07), axis: glowMat([0.5, 0.6, 0.7], 0.35),
      parD: glowMat(COL.par, 0.55), chiefD: glowMat(COL.chief, 0.55), focD: glowMat(COL.foc, 0.55) };
    // only the light itself glows (main.js selective bloom): not the axis, the virtual (dashed) extensions, the markers
    for (const k of ["par", "chief", "foc", "cone", "coneIn"]) this.mats[k].userData.glow = true;
    // one InstancedMesh per material: every segment of that colour is an instance, so the rays cost a handful of draw
    // calls instead of one per segment (~150 in a typical set-up; R3). Additive blending: instance order never matters.
    this.CAP = 1024; this.buckets = new Map();
    for (const mat of Object.values(this.mats)) {
      const m = new THREE.InstancedMesh(this.unit, mat, this.CAP); m.renderOrder = 3; m.count = 0; m.visible = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.g.add(m); this.buckets.set(mat, { mesh: m, n: 0 });
    }
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3(); this._up = new THREE.Vector3(0, 1, 0);
    // focal-point markers
    const dot = (rgb) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 16, 12), glowMat(rgb)); this.g.add(m); return m; };
    this.F = dot([2.0, 2.0, 2.0]); this.Fp = dot([2.0, 2.0, 2.0]);
    // ghost arrow for a virtual image (facing +x, like the light-box face); the group's scale is M
    this.ghost = new THREE.Group(); this.g.add(this.ghost);
    const gm = glowMat([0.45, 1.1, 1.6], 0.45); gm.side = THREE.DoubleSide;
    this.ghost.add(arrowMesh(gm));
    this.imgMark = dot([2.2, 2.2, 2.2]);            // the real image point (where the rays cross)
    this.show = { principal: true, cone: true, focal: true, ghost: true };
    this.debug = null;                                // last geometry, for the checks
  }
  seg(a, b, mat, r = 0.0006) {
    const B = this.buckets.get(mat), d = b.clone().sub(a), L = d.length(); if (L < 1e-6 || B.n >= this.CAP) return;
    this._q.setFromUnitVectors(this._up, d.clone().divideScalar(L));
    this._m.compose(a.clone().addScaledVector(d, 0.5), this._q, this._s.set(r, L, r)); B.mesh.setMatrixAt(B.n++, this._m);
  }
  dashed(a, b, mat, dash = 0.006, gap = 0.005) {
    const d = b.clone().sub(a), L = d.length(); if (L < 1e-6) return; const u = d.clone().divideScalar(L);
    for (let t = 0; t < L; t += dash + gap) this.seg(a.clone().addScaledVector(u, t), a.clone().addScaledVector(u, Math.min(L, t + dash)), mat, 0.0005);
  }
  /** S = bench positions (cm) [+ y0: the object's base above the axis, k: object size factor, far: the distant object],
   *  f, D, st = benchState(...), lab = hide everything that gives the answer away */
  update(S, f, D, st, lab, coneFocus = null) {
    for (const B of this.buckets.values()) B.n = 0;
    const xo = S.obj, xl = S.lens, xs = S.screen, dO = st.dO, dI = st.dI, M = st.M;
    const y0 = S.y0 || 0, k = S.k || 1;
    const y = y0 + k * RAY_SRC.v, z = -k * RAY_SRC.u;   // object point (cm), z = -u (u is horizontal seen from the lens side)
    const P = [xo, y, z], fin = Number.isFinite(dI);
    const I = fin ? [xl + dI, M * y, M * z] : null;
    // a ray that left the lens at (xl, hy, hz): its height at rail position x (image point, or parallel to the chief ray)
    const after = (hy, hz, x) => fin ? [x, hy + (I[1] - hy) * (x - xl) / dI, hz + (I[2] - hz) * (x - xl) / dI]
      : [x, hy - (y / dO) * (x - xl), hz - (z / dO) * (x - xl)];
    const k3 = Math.abs(f - dO) < 1e-9 ? null : f / (f - dO);    // ray through F hits the lens at k3 * (y, z)
    // the distant object (3-4 m away, 20 cm tall): its parallel and focal construction rays would cross the lens plane far
    // outside the lens, so only the chief ray is drawn for it
    const principal = S.far ? [["chief", [0, 0]]] : [["par", [y, z]], ["chief", [0, 0]], ...(k3 === null ? [] : [["foc", [k3 * y, k3 * z]]])];
    const dbg = { P, I, principal: [], rim: [] };
    const on = (k) => this.show[k] && !lab;
    // axis
    if (!lab) this.dashed(W(S.far ? Math.min(0, xl - 10) : xo, 0, 0), W(xs, 0, 0), this.mats.axis, 0.004, 0.006);   // the distant object: the axis from the rail end
    if (on("principal")) for (const [kind, [hy, hz]] of principal) {
      const L = [xl, hy, hz], E = after(hy, hz, xs);
      this.seg(W(...P), W(...L), this.mats[kind]); this.seg(W(...L), W(...E), this.mats[kind]);
      if (fin && !st.real) this.dashed(W(...L), W(...I), this.mats[kind + "D"]);   // back-projection to the virtual image
      dbg.principal.push({ kind, L, E });
    }
    // the cone converges where THIS point focuses, zone by zone: the paraxial image (ideal lens), or for the real
    // singlet the medial focus at this point's field height plus spherical aberration (coneFocus(r, rho) -> z)
    const rP = Math.hypot(y, z);
    const coneEnd = (hy, hz, rho) => {
      const zc = coneFocus ? coneFocus(rP, rho) : null;
      if (!zc || !Number.isFinite(zc)) return after(hy, hz, xs);
      const C = [xl + zc, -y * zc / dO, -z * zc / dO], t = (xs - xl) / zc;
      return [xs, hy + (C[1] - hy) * t, hz + (C[2] - hz) * t];
    };
    // outer zone (the lens rim) and an inner zone at half the radius: with spherical aberration they cross at
    // different distances
    if (on("cone")) for (const [rho, nR, mat] of [[D / 2, RIM, this.mats.cone], [D / 4, 12, this.mats.coneIn]]) for (let i = 0; i < nR; i++) {
      const a = (i / nR) * 2 * Math.PI + (rho < D / 2 ? Math.PI / nR : 0), hy = rho * Math.sin(a), hz = rho * Math.cos(a), L = [xl, hy, hz], E = coneEnd(hy, hz, rho);
      this.seg(W(...P), W(...L), mat, 0.0004); this.seg(W(...L), W(...E), mat, 0.0004);
      dbg.rim.push({ L, E, rho });
    }
    for (const B of this.buckets.values()) { const m = B.mesh; m.count = B.n; m.visible = B.n > 0; m.instanceMatrix.needsUpdate = true; if (B.n) m.computeBoundingSphere(); }
    // focal points: F on the object side for a converging lens, F' on the image side (swapped for a diverging lens)
    this.F.position.copy(W(xl - f, 0, 0)); this.Fp.position.copy(W(xl + f, 0, 0));
    this.F.visible = this.Fp.visible = on("focal");
    this.imgMark.visible = on("principal") && st.real && fin && I[0] <= xs; if (this.imgMark.visible) this.imgMark.position.copy(W(...I));
    // ghost arrow at a virtual image: scaled by M about the axis (upright for M > 0), tail on the axis
    this.ghost.visible = on("ghost") && fin && !st.real;
    if (this.ghost.visible) { this.ghost.position.copy(W(xl + dI, M * y0, 0)); this.ghost.scale.set(1, M * k, M * k); }
    dbg.F = xl - f; dbg.Fp = xl + f; dbg.ghost = this.ghost.visible ? { x: xl + dI, M } : null;
    this.debug = dbg;
  }
}
