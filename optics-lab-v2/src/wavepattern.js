// The diffraction pattern on a screen (rail card or wall board), computed on the GPU in floating point, in two passes:
//  1. PROFILE: one row, the intensity across the screen (it only varies across: the slits are vertical).
//  2. PICTURE: profile x the beam's vertical profile (a laser's Gaussian spot, or a lamp's illuminated band).
// Profile physics (the same formulas as physics/wave.mjs; checks/wave_check.cjs compares them):
//   single  sinc^2(alpha)                       alpha = pi a sin(theta)/lambda
//   double  cos^2(beta) sinc^2(alpha)           beta  = pi d sin(theta)/lambda
//   grating, few slits lit (N <= 12): [sin(N beta)/(N sin beta)]^2 sinc^2(alpha)    (Fraunhofer)
//   grating, many slits lit: the lit width W = N d is NOT in the far field at bench distances (that needs L >> W^2/lambda,
//     ~6 m for a 2 mm laser beam), so each order arrives as a SPOT the size of the beam, centred at d sin(theta) = m lambda
//     and as bright as the single-slit envelope there; its width is sqrt(W^2 + (lambda L / W)^2) (beam, or diffraction).
// with the exact sin(theta) = z/sqrt(z^2 + L^2) for a point z across the screen, every spectral line in its own colour,
// and each profile pixel averaged over 8 positions across its width.
import * as THREE from "three";

const MAXL = 17;
const PROFILE = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float kind, a, d, N, L, wCm, nLines, pxCm, spots, Wm;
uniform vec3 rgb[${MAXL}];
uniform vec2 line[${MAXL}];          // (wavelength nm, relative intensity)
const float PI = 3.14159265358979;
float sinc(float x) { return abs(x) < 1e-6 ? 1.0 : sin(x) / x; }
float I(float s, float lam) {
  float al = PI * a * s / lam, env = sinc(al); env *= env;
  if (kind < 0.5) return env;
  float be = PI * d * s / lam;
  if (kind < 1.5) { float c = cos(be); return c * c * env; }
  float sb = sin(be);
  if (abs(sb) < 1e-7) return env;
  float r = sin(N * be) / (N * sb); return r * r * env;
}
void main() {
  float zc = (vUv.x - 0.5) * wCm;   // cm across the screen from the axis
  vec3 acc = vec3(0.0);
  if (spots > 0.5) {
    // grating, many slits lit: beam-sized spots at each order
    for (int i = 0; i < ${MAXL}; i++) { if (float(i) >= nLines) break;
      float lam = line[i].x * 1e-9, w = sqrt(Wm * Wm + pow(lam * L / Wm, 2.0)), sig = w / 2.355;   // FWHM -> sigma (m)
      for (int m = -60; m <= 60; m++) {
        float s = float(m) * lam / d; if (abs(s) >= 1.0) continue;
        float y = L * s / sqrt(1.0 - s * s), dz = zc * 0.01 - y;
        if (abs(dz) > 5.0 * sig) continue;
        float al = PI * a * s / lam, env = sinc(al); env *= env;
        acc += rgb[i] * line[i].y * env * exp(-0.5 * dz * dz / (sig * sig));
      }
    }
  } else {
    for (int k = 0; k < 8; k++) {
      float z = (zc + (float(k) + 0.5 - 4.0) / 8.0 * pxCm) * 0.01, s = z / sqrt(z * z + L * L);
      for (int i = 0; i < ${MAXL}; i++) { if (float(i) >= nLines) break; acc += rgb[i] * line[i].y * I(s, line[i].x * 1e-9); }
    }
    acc /= 8.0;
  }
  gl_FragColor = vec4(acc, 1.0);
}`;
const PICTURE = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D profile;
uniform float hCm, laser, sigmaCm, bandCm, stretch, norm;
void main() {
  float yc = (vUv.y - 0.5) * hCm;
  float v = laser > 0.5 ? exp(-0.5 * yc * yc / (sigmaCm * sigmaCm)) : smoothstep(bandCm * 0.5 + 0.15, bandCm * 0.5 - 0.15, abs(yc));
  vec3 c = texture2D(profile, vec2(vUv.x, 0.5)).rgb * norm * v;
  if (stretch > 0.5) { float m = max(max(c.r, c.g), c.b); if (m > 1e-6) c *= pow(m, 0.3) / m; }   // display aid: lift faint orders
  gl_FragColor = vec4(c, 1.0);
}`;

const quadScene = (mat) => { const s = new THREE.Scene(), q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); q.frustumCulled = false; s.add(q); return s; };
const VERT = "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

export class WavePattern {
  constructor(renderer, wCm, hCm, sizePx) {
    this.renderer = renderer; this.wCm = wCm; this.hCm = hCm;
    const W = sizePx, H = Math.max(256, Math.round(Math.min(2048, sizePx * hCm / wCm)));
    this.W = W; this.H = H;
    this.prof = new THREE.WebGLRenderTarget(W, 1, { type: THREE.FloatType, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, generateMipmaps: false, depthBuffer: false });
    this.target = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, magFilter: THREE.LinearFilter, minFilter: THREE.LinearMipmapLinearFilter, generateMipmaps: true, depthBuffer: false });
    this.texture = this.target.texture; this.texture.anisotropy = 8;
    this.pmat = new THREE.ShaderMaterial({ uniforms: {
        kind: { value: 1 }, a: { value: 4e-5 }, d: { value: 2.5e-4 }, N: { value: 2 }, L: { value: 1 }, wCm: { value: wCm }, nLines: { value: 1 }, pxCm: { value: wCm / W },
        spots: { value: 0 }, Wm: { value: 2e-3 },
        rgb: { value: Array.from({ length: MAXL }, () => new THREE.Vector3()) }, line: { value: Array.from({ length: MAXL }, () => new THREE.Vector2()) } },
      vertexShader: VERT, fragmentShader: PROFILE, depthTest: false, depthWrite: false });
    this.imat = new THREE.ShaderMaterial({ uniforms: { profile: { value: this.prof.texture }, hCm: { value: hCm }, laser: { value: 1 }, sigmaCm: { value: 0.12 }, bandCm: { value: 1.2 },
        stretch: { value: 0 }, norm: { value: 1 } }, vertexShader: VERT, fragmentShader: PICTURE, depthTest: false, depthWrite: false });
    this.pscene = quadScene(this.pmat); this.iscene = quadScene(this.imat); this.cam = new THREE.Camera(); this.key = ""; this.lastMs = 0;
  }
  /** p = { kind, a, d, N, L (m), W (lit width, m), lines:[{w,I}], rgbOf(w), laser, stretch } */
  draw(p) {
    const spots = p.kind === "grating" && p.N > 12;
    const key = JSON.stringify([p.kind, p.a, p.d, p.N, p.L, p.W, p.lines.map((l) => l.w), p.laser, p.stretch]);
    if (key === this.key) return false; this.key = key;
    const t0 = performance.now(), U = this.pmat.uniforms, n = Math.min(MAXL, p.lines.length);
    U.kind.value = { single: 0, double: 1, grating: 2 }[p.kind]; U.a.value = p.a; U.d.value = p.d || 1e-3; U.N.value = p.N || 2; U.L.value = p.L;
    U.nLines.value = n; U.spots.value = spots ? 1 : 0; U.Wm.value = p.W || (p.N * (p.d || 1e-3));
    let tot = [0, 0, 0];                                         // the centre (theta = 0) is where every line is at full strength
    for (let i = 0; i < n; i++) { const c = p.rgbOf(p.lines[i].w); U.rgb.value[i].set(...c); U.line.value[i].set(p.lines[i].w, p.lines[i].I); tot = tot.map((x, k) => x + c[k] * p.lines[i].I); }
    const I = this.imat.uniforms; I.norm.value = 1 / Math.max(...tot, 1e-9); I.laser.value = p.laser ? 1 : 0; I.stretch.value = p.stretch ? 1 : 0;
    const r = this.renderer, prevT = r.getRenderTarget(), prevTM = r.toneMapping;
    r.toneMapping = THREE.NoToneMapping;
    r.setRenderTarget(this.prof); r.render(this.pscene, this.cam);
    r.setRenderTarget(this.target); r.render(this.iscene, this.cam);
    r.setRenderTarget(prevT); r.toneMapping = prevTM;
    this.lastMs = performance.now() - t0; this.spots = spots; return true;
  }
  /** For the checks: the across-the-screen profile (linear rgb, before normalisation), one value per pixel. */
  readProfile() {
    const buf = new Float32Array(this.W * 4); this.renderer.readRenderTargetPixels(this.prof, 0, 0, this.W, 1, buf);
    const out = []; for (let i = 0; i < this.W; i++) out.push([buf[i * 4], buf[i * 4 + 1], buf[i * 4 + 2]]); return out;
  }
}
