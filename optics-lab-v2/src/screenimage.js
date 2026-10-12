// The picture on the screen card, computed on the GPU in floating point (a fragment shader into a render target).
// For every point p on the card it adds up the light arriving through each part of the lens (a gather):
//  - Where light lands: around the chief-ray point, so the arrow is scaled by -s/d_o (inverted) whatever the focus.
//  - How it spreads: a pupil sample at height rho on the lens lands L(rho) from there, in its own direction.
//    Ideal thin lens: L = rho |1 - s/d_i|, a uniform disc. Real singlet: the same field curvature + astigmatism +
//    spherical aberration as physics/lens.mjs zoneMap (formulas mirrored below; checks/m1_check.cjs compares the
//    painted picture with the model).
//  - The arrow is tested exactly from its polygons, so there is no source-image resolution limit.
// Light reaching p from pupil sample k left the object point q = (p - offset_k)/scale. The spot shape is taken at
// p's own field radius; it varies slowly across the card, so this is the same approximation the old ring painter
// made (_attic/), without its rings, masks and 8-bit stacking, which drew contour lines.
// Brightness is set by the material's emissive intensity from E ~ (D/s)^2.
import * as THREE from "three";
import { OBJ_POLYS, CARD } from "./bench.js";

// polygons padded to 4 vertices (a triangle repeats its last vertex: a zero-length edge passes the test)
const PV = OBJ_POLYS.flatMap((poly) => [0, 1, 2, 3].map((i) => poly[Math.min(i, poly.length - 1)]));

export const CARD_CM = CARD;
const SIZE = Math.round((1024 * CARD_CM) / 16), NS = 96;     // same pixel pitch as the old 16 cm card (0.16 mm)
// Vogel spiral over the unit disc (pupil samples, uniform by area)
const DISC = Array.from({ length: NS }, (_, i) => { const r = Math.sqrt((i + 0.5) / NS), a = i * 2.399963; return new THREE.Vector2(r * Math.cos(a), r * Math.sin(a)); });

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 disc[${NS}];
uniform vec2 pv[${OBJ_POLYS.length * 4}];  // convex polygons, 4 vertices each, counter-clockwise (object cm, u horizontal from the lens side)
uniform float scale, D, s, f, dI, M, A, nG, ideal, finiteI, px, y0, objK;
float inF(vec2 q) {                          // q = object point (z, y) in cm; object u = -z
  vec2 g = vec2(-q.x, q.y - y0) / objK;       // the arrow: its base y0 above the axis (Exp 213), objK times the light-box size (the far arrow)
  for (int i = 0; i < ${OBJ_POLYS.length}; i++) {
    bool inside = true;
    for (int j = 0; j < 4; j++) { vec2 a = pv[i * 4 + j], b = pv[i * 4 + (j + 1) - ((j + 1) / 4) * 4], e = b - a, w = g - a;
      if (e.x * w.y - e.y * w.x < 0.0) inside = false; }
    if (inside) return 1.0;
  }
  return 0.0;
}
void main() {
  vec2 p = (vUv - 0.5) * ${CARD_CM.toFixed(1)};        // card point, cm: x = world z, y = world y
  float r = length(p) / abs(scale);                     // field radius of the object point imaged here
  float ms0 = 1.0, mt0 = 1.0, Ak = 0.0;
  if (finiteI > 0.5) {
    if (ideal > 0.5) { ms0 = 1.0 - s / dI; mt0 = ms0; }
    else {
      float hI = M * r, q = hI * hI / (2.0 * f);
      float zs = dI - (1.0 + 1.0 / nG) * q, zt = dI - (3.0 + 1.0 / nG) * q;
      ms0 = 1.0 - s / zs; mt0 = 1.0 - s / zt; Ak = A;   // spherical aberration adds -s A rho^2 to both
    }
  }
  float acc = 0.0;
  for (int k = 0; k < ${NS}; k++) {
    vec2 d = disc[k]; float rf = length(d), rho = rf * D * 0.5;
    float L;
    if (finiteI < 0.5) L = rho;                                        // parallel beam
    else { float ms = ms0 - s * Ak * rho * rho, mt = mt0 - s * Ak * rho * rho; L = rho * sqrt(0.5 * (ms * ms + mt * mt)); }
    vec2 off = rf > 0.0 ? d / rf * L : vec2(0.0);
    vec2 jit = disc[(k * 37) - (k * 37 / ${NS}) * ${NS}] * px * 0.5;     // sub-pixel spread: anti-aliases a sharp edge
    acc += inF((p - off + jit) / scale);
  }
  float I = acc / ${NS.toFixed(1)};
  gl_FragColor = vec4(vec3(1.0, 0.957, 0.886) * I, 1.0);
}`;

export class ScreenImage {
  constructor(renderer) {
    this.renderer = renderer;
    this.target = new THREE.WebGLRenderTarget(SIZE, SIZE, { type: THREE.UnsignedByteType, magFilter: THREE.LinearFilter, minFilter: THREE.LinearMipmapLinearFilter, generateMipmaps: true });
    this.texture = this.target.texture; this.texture.anisotropy = 8;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { disc: { value: DISC }, pv: { value: PV.map(([u, v]) => new THREE.Vector2(u, v)) },
        scale: { value: -1 }, D: { value: 4 }, s: { value: 30 }, f: { value: 15 }, dI: { value: 30 }, M: { value: -1 }, A: { value: 0 },
        nG: { value: 1.52 }, ideal: { value: 0 }, finiteI: { value: 1 }, px: { value: CARD_CM / SIZE }, y0: { value: 0 }, objK: { value: 1 } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: FRAG, depthTest: false, depthWrite: false });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat); this.quad.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.quad); this.cam = new THREE.Camera();
    this.key = ""; this.lastMs = 0; this.cardCm = CARD_CM;
    this._c = document.createElement("canvas"); this._c.width = this._c.height = SIZE;
  }
  /** st = benchState(...); opt = { ideal, D, f, A, n, y0 (object base above the axis, cm), k (object size factor) }. Returns true if it re-rendered. */
  draw(st, opt) {
    const fin = Number.isFinite(st.dI) ? 1 : 0;
    const key = [st.scale, opt.D, st.s, opt.f, st.dO, fin ? st.dI : 0, opt.ideal ? 1 : 0, opt.A, opt.y0 || 0, opt.k || 1].map((x) => x.toFixed(6)).join("|");
    if (key === this.key) return false; this.key = key;
    const t0 = performance.now(), U = this.mat.uniforms;
    U.scale.value = st.scale; U.D.value = opt.D; U.s.value = st.s; U.f.value = opt.f;
    U.dI.value = fin ? st.dI : 1; U.M.value = fin ? st.M : 0; U.A.value = opt.ideal ? 0 : opt.A; U.nG.value = opt.n;
    U.ideal.value = opt.ideal ? 1 : 0; U.finiteI.value = fin; U.y0.value = opt.y0 || 0; U.objK.value = opt.k || 1;
    // linear output into the target: no tone mapping, no colour-space conversion (the card material applies its own)
    const r = this.renderer, prevT = r.getRenderTarget(), prevTM = r.toneMapping;
    r.toneMapping = THREE.NoToneMapping; r.setRenderTarget(this.target); r.render(this.scene, this.cam); r.setRenderTarget(prevT); r.toneMapping = prevTM;
    this.lastMs = performance.now() - t0;
    return true;
  }
  /** For the checks: the current picture as a 2D canvas (top row = top of the card), read back from the GPU. */
  get c() {
    const buf = new Uint8Array(SIZE * SIZE * 4); this.renderer.readRenderTargetPixels(this.target, 0, 0, SIZE, SIZE, buf);
    const g = this._c.getContext("2d", { willReadFrequently: true }), im = g.createImageData(SIZE, SIZE);
    for (let y = 0; y < SIZE; y++) im.data.set(buf.subarray((SIZE - 1 - y) * SIZE * 4, (SIZE - y) * SIZE * 4), y * SIZE * 4);
    g.putImageData(im, 0, 0); return this._c;
  }
}
