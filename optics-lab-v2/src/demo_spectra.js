// CLASS DEMO (?demo=spectra): "grating -> emission spectra" on the wave bench, six scenes, for PSEII Tue 11/17 (Cole,
// 2026-11-15; plan: the "Grating to Emission Spectra: Animation Plan" doc). Loaded by main.js only with the flag.
//
// The physics is the bench's own: the 600 lines/mm slide, the lamp lines of physics/wave.mjs (NIST H Balmer, He), and
// every beam aimed at d sin(theta) = m lambda, landing where orderY() puts it on the wall screen (L = wall - slide).
// The gas makes the lines; the grating only sorts them by angle. Nothing is placed by hand.
// Display choices (not physics): the beams are glowing "fog" meshes (additive, in the selective-bloom pass, not a
// volumetric pass); their brightness is compressed (0.35 + 0.65 sqrt(I/Imax)) so faint lines stay visible; the wall
// lines are drawn 6 mm x 11 cm, upright like the lamp's exit slit they are copies of, so they read from the back of a
// room. Orders 0 and +-1 only: every order 2 lands past the edge of the 2.4 m wall screen.
// Scene 1 (Atom) is a 2D inset: hydrogen's levels E_n = -13.6 eV / n^2 (Bohr); each drop to n = 2 gives one photon,
// hf = dE, lambda = hc/dE. Those four lambdas round to the same whole nm as the NIST lines the bench uses.
//
// Controls: the guided labs' step card (guide.js look) at the lower left: click a scene in its tracker, or Back / Replay /
// Next. Keys are the second path: -> / Space / PageDown next, <- / PageUp back, Home / End. Each step's text shows before
// anything moves. Nothing on the bench can be operated in the demo: the step drives the whole scene.
// Test hook: window.__demo (checks/demo_check.cjs).
import * as THREE from "three";
import { cmToX, AXIS_Y, WALL_X } from "./bench.js";
import { SOURCES, wavelengthRGB, orderY } from "../physics/wave.mjs";

const HOLD_CM = 30, SRC_CM = 5, SLIDE = "g600";
const CAP = 1.4;                                      // s: the caption stands alone this long before any motion
const SPOT_W = 0.006, SPOT_H = 0.11;                 // m: each line on the wall, upright like the exit slit
// hydrogen (Bohr): E_n = -13.6 eV / n^2; the visible lines are the drops to n = 2 (Balmer)
export const HC_EVNM = 1239.84, H_EVS = 4.135668e-15, RY_EV = 13.6;
export const levelE = (n) => -RY_EV / (n * n);
export const BALMER = [3, 4, 5, 6].map((n) => { const dE = levelE(n) - levelE(2); return { n, dE, f: dE / H_EVS, w: HC_EVNM / dE }; });
const UP = new THREE.Vector3(0, 1, 0);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ramp = (t, t0, dur = 1.2) => clamp01((t - t0) / dur);
const deg = (r) => (r * 180) / Math.PI;

export function colorName(w) {
  if (w < 420) return "deep violet"; if (w < 440) return "violet"; if (w < 485) return "blue"; if (w < 500) return "cyan";
  if (w < 565) return "green"; if (w < 590) return "yellow"; if (w < 625) return "orange"; return "red";
}
const lin = (rgb) => new THREE.Color().setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace);   // wavelengthRGB is sRGB

// ------------------------------------------------------------------ fog beam: a tapered open cylinder, additive glow
const BEAM_VS = `varying float vY; varying vec3 vN; varying vec3 vV;
void main() { vY = position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }`;
const NOISE = `float h1(float n) { return fract(sin(n) * 43758.5453); }
float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }`;
// crests (display, not to scale): bands across the beam, CREST_M x (lambda / 656 nm) apart, moving away from the grating
// at CREST_V; every colour moves at the same speed, so the shorter crest spacing of violet means a higher frequency
const BEAM_FS = `uniform vec3 color; uniform float k, time, seed, len, lamv, crest, cv; varying float vY; varying vec3 vN; varying vec3 vV;
${NOISE}
void main() {
  float rim = abs(dot(normalize(vN), normalize(vV))), core = pow(rim, 2.2);
  float fog = 0.70 + 0.30 * n1(vY * 70.0 + seed - time * 0.9) * (0.6 + 0.4 * n1(vY * 17.0 + seed * 1.7 + time * 0.35));
  float ph = (vY * len - time * cv) / lamv, band = pow(0.5 + 0.5 * cos(6.2831853 * ph), 3.0);
  float a = core * k * fog * mix(1.0, 0.75, vY) * smoothstep(0.0, 0.004, vY) * mix(1.0, 0.30 + 1.25 * band, crest);
  gl_FragColor = vec4(color * a, 1.0);
}`;
export const CREST_M = 0.04, CREST_V = 0.10;          // m: red's drawn crest spacing; m/s: the drawn crest speed
function makeBeam(r0, r1) {
  const geo = new THREE.CylinderGeometry(r1, r0, 1, 16, 1, true); geo.translate(0, 0.5, 0);
  const mat = new THREE.ShaderMaterial({ uniforms: { color: { value: new THREE.Color() }, k: { value: 0 }, time: { value: 0 }, seed: { value: Math.random() * 100 },
      len: { value: 1 }, lamv: { value: CREST_M }, crest: { value: 0 }, cv: { value: CREST_V } },
    vertexShader: BEAM_VS, fragmentShader: BEAM_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  mat.userData.glow = true;                            // in the selective-bloom pass (main.js): it glows
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = 5; return m;
}
function aim(mesh, a, b) { const d = b.clone().sub(a), len = d.length(); mesh.position.copy(a); mesh.quaternion.setFromUnitVectors(UP, d.normalize()); mesh.scale.set(1, len, 1); }

// line texture for the wall: a bar, flat along its length (the slit's image), soft across and at its two ends
function spotTexture() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 128; const g = c.getContext("2d"), im = g.createImageData(64, 128);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) { const u = (x - 31.5) / 32, v = Math.abs(y - 63.5) / 64, end = Math.min(1, Math.max(0, (1 - v) / 0.12)), a = Math.exp(-(u * u) / 0.12 * 2.2) * end * end * (3 - 2 * end);
    const i = (y * 64 + x) * 4; im.data[i] = im.data[i + 1] = im.data[i + 2] = 255; im.data[i + 3] = Math.round(a * 255); }
  g.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); return t;
}

export function startSpectraDemo({ scene, camera, renderer, stations, $, modOf, setModule, flyTo, setTick, focusOf }) {
  const st = stations.wave, G = modOf("grating").api, views = modOf("grating").views;
  // ---- the bench as the demo needs it: hydrogen tube, 600 lines/mm, the wall screen, values shown, glow on
  setModule("grating");
  G.S.wall = true; $("tWall").checked = true; G.setPos("hold", HOLD_CM); G.setPos("src", SRC_CM); G.mountSlide(SLIDE); G.S.stretch = true;
  G.S.source = "hydrogen";
  const sl = G.aperture(), d = sl.d, L = G.Lm();
  const xg = cmToX(G.S.hold), xw = WALL_X - 0.003, xs = cmToX(G.S.src) + 0.0165;   // grating, wall face, the lamp's exit slit
  const P0 = new THREE.Vector3(xg, AXIS_Y, 0);
  // demo-only camera views (station-local [position, target, fit]); harmless to the module's own menu
  views.dBench = () => [[-0.05, 1.42, 0.95], [-0.05, AXIS_Y, 0.02], [1.15, 0.5]];
  views.dSlide = () => [[xg - 0.14, AXIS_Y + 0.07, 0.17], [xg, AXIS_Y - 0.01, 0], [0.13, 0.12]];
  views.dFan = () => [[-0.75, 2.35, 0.0], [1.75, AXIS_Y, 0.0], [2.75, 1.95]];   // wall line low enough for 8 labels a side above it, with the step card below
  views.dWall = () => [[WALL_X - 1.6, AXIS_Y + 0.10, 0.0], [WALL_X, AXIS_Y, 0.0], [2.3, 0.45]];   // facing the wall screen: the lines as a strip

  // ---- chrome: hide the panel, the hint and the bench's own labels; a caption card; our own beam labels
  const css = document.createElement("style");
  css.textContent = `
  body.demo #rail, body.demo .hint, body.demo #tip { display:none !important; }
  /* the step card IS the guided labs' Guide card (#guide, guide.js look), larger type for a projector */
  body.demo #guide { display:block; width:min(560px, calc(100vw - 70px)); }
  body.demo #guide .g-ph { cursor:pointer; font-size:10px; padding:5px 0 3px; text-align:left; }
  body.demo #guide .g-ph:hover { color:#fff; border-color:rgba(255,255,255,.7); }
  body.demo #guide .g-step { font-size:12px; }
  body.demo #guide .g-title { font-size:20px; font-weight:700; margin:3px 0 6px; }
  body.demo #guide .g-why { font-size:15px; line-height:1.45; color:rgba(255,255,255,.82); min-height:44px; }
  body.demo #guide .g-foot { font:10.5px 'Share Tech Mono', monospace; color:rgba(255,255,255,.42); margin-top:8px; }
  body.demo #guide .g-btns .es-btn { padding:8px 16px; font-size:11px; }
  body.demo #guide .g-btns .es-btn:disabled { opacity:.35; cursor:default; }
  body.demo canvas.webgl { cursor:default !important; }
  #demoLabels { position:fixed; inset:0; pointer-events:none; z-index:25; }
  #demoLabels svg { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
  .dl { position:absolute; font-family:'Inter',sans-serif; font-size:14px; font-weight:600; color:#fff; white-space:nowrap; background:rgba(5,7,11,.80);
    border:1px solid rgba(255,255,255,.18); border-left:4px solid #fff; border-radius:3px; padding:2px 7px; text-shadow:0 1px 2px #000; transition:opacity .3s; }
  #demoInset { position:fixed; left:50%; top:100px; z-index:24; pointer-events:none; transition:opacity .4s;
    width:min(760px, 64vw); background:rgba(3,4,7,.94); border:1px solid rgba(255,174,32,.35); border-radius:6px; padding:10px 12px 8px; box-shadow:0 8px 30px rgba(0,0,0,.7); }
  #demoInset canvas { width:100%; display:block; border-radius:3px; }
  #demoN { position:fixed; z-index:26; width:340px; background:rgba(5,7,11,.88); border:1px solid rgba(255,174,32,.35); border-radius:6px; padding:8px 12px 6px; transition:opacity .3s; }
  #demoN .es-input-label { font-size:14px; color:#fff; } #demoN .h { font:11px 'Share Tech Mono',monospace; color:rgba(255,255,255,.55); margin-top:3px; } #demoN .dv { color:rgba(255,255,255,.72); border-top:1px solid rgba(255,255,255,.15); padding-top:4px; margin-top:5px; } #demoN .dv b { color:#ffae20; font-weight:600; }
  #demoInset .h { font-family:'Share Tech Mono',monospace; font-size:12px; color:rgba(255,255,255,.62); margin-top:6px; }`;
  document.head.appendChild(css); document.body.classList.add("demo");
  $("tLabels").checked = false; $("tLabels").dispatchEvent(new Event("change"));
  $("tGlow").checked = true; $("tGlow").dispatchEvent(new Event("change"));
  // the step card: the guided labs' own Guide card element (guide.js made it; with no lab guide running it is idle, and
  // main.js already keeps the bench above it). The demo fills it: tracker (click a scene), Step n of 6, title, text, buttons.
  const card = document.getElementById("guide"); card.style.display = "block";   // inline "block": main.js then keeps the bench above it
  const FOOT = `Grating ${Math.round(1e-3 / d)} lines/mm (d = ${(d * 1e6).toFixed(3)} µm) · slide to wall L = ${L.toFixed(2)} m · orders 0 and ±1 drawn (every order 2 lands past the edge of the wall screen) · keys: ← →`;
  const labRoot = document.createElement("div"); labRoot.id = "demoLabels"; document.body.appendChild(labRoot);
  const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"); labRoot.appendChild(svg);
  window.dispatchEvent(new Event("resize"));           // the panel is gone: refit the views and the label rectangles

  // ---- scene objects, all in the wave station's frame
  const grp = new THREE.Group(); grp.name = "demo:spectra"; st.group.add(grp);
  const sTex = spotTexture();
  const items = new Map();                              // key -> { mesh, spot, label, k, kind, ... }
  function lineItem(lamp, line, m, Imax) {
    const w = line.w, s = (m * w * 1e-9) / d, th = Math.asin(s), z = orderY(d, m, w, L);
    // the beam stops 3 mm short of the wall face, on its exact ray; the spot sits on the wall at orderY (the same ray)
    const P1 = new THREE.Vector3(xw, AXIS_Y, (xw - xg) * Math.tan(th)), beam = makeBeam(0.0035, 0.009); aim(beam, P0, P1);
    beam.material.uniforms.len.value = beam.scale.y; beam.material.uniforms.lamv.value = CREST_M * (w / 656.279);
    const col = lin(wavelengthRGB(w)), weight = 0.35 + 0.65 * Math.sqrt(line.I / Imax);
    beam.material.uniforms.color.value.copy(col).multiplyScalar(1.15);
    const spot = new THREE.Mesh(new THREE.PlaneGeometry(SPOT_W, SPOT_H), new THREE.MeshBasicMaterial({ map: sTex, color: col.clone().multiplyScalar(2.2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    spot.material.userData.glow = true; spot.rotation.y = -Math.PI / 2; spot.position.set(WALL_X - 0.001, AXIS_Y, z);
    grp.add(beam, spot);
    const nm = lamp === "hydrogen" ? w.toFixed(0) : w.toFixed(1), mm = m < 0 ? `−${-m}` : `${m}`;
    return { key: `${lamp}:${w}:${m}`, kind: "line", lamp, w, m, theta: deg(th), z, P1, beam, spot, weight, col, anchor: spot.position, dir: -1,
      text: `${colorName(w)} ${nm} nm, order ${mm}, ${Math.abs(deg(th)).toFixed(1)}°`, css: `#${col.clone().convertLinearToSRGB().getHexString()}` };
  }
  function mixColor(lines) { const c = lines.reduce((a, l) => { const r = wavelengthRGB(l.w); return a.map((x, i) => x + r[i] * l.I); }, [0, 0, 0]), mx = Math.max(...c) || 1; return lin(c.map((x) => x / mx)); }
  function axialItems(lamp) {
    const lines = SOURCES[lamp].lines, col = mixColor(lines);
    const inc = makeBeam(0.003, 0.0045); aim(inc, new THREE.Vector3(xs, AXIS_Y, 0), P0); inc.material.uniforms.color.value.copy(col).multiplyScalar(0.9);
    const P1 = new THREE.Vector3(xw, AXIS_Y, 0), o0 = makeBeam(0.0035, 0.009); aim(o0, P0, P1); o0.material.uniforms.color.value.copy(col).multiplyScalar(1.1);
    const spot = new THREE.Mesh(new THREE.PlaneGeometry(SPOT_W, SPOT_H), new THREE.MeshBasicMaterial({ map: sTex, color: col.clone().multiplyScalar(2.0), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    spot.material.userData.glow = true; spot.rotation.y = -Math.PI / 2; spot.position.copy(P1); spot.position.x -= 0.001;
    grp.add(inc, o0, spot);
    const name = lamp === "white" ? "white light" : `all ${lines.length} ${lamp} lines`;
    return [{ key: `${lamp}:in`, kind: "in", lamp, beam: inc, weight: 1 },
            { key: `${lamp}:o0`, kind: "o0", lamp, m: 0, theta: 0, z: 0, P1, beam: o0, spot, weight: 1, anchor: P1, dir: -1, text: `order 0: ${name} together, straight on (0°)`, css: `#${col.clone().convertLinearToSRGB().getHexString()}` }];
  }
  // white light: order +-1 as a continuous fan (every wavelength 380-700 nm at its own angle) + its band on the wall
  function fanItem(m) {
    const W0 = 380, W1 = 700, n = 80, pos = [], colr = [], along = [], band = [], bcol = [];
    const pt = (w) => new THREE.Vector3(xw, AXIS_Y, (xw - xg) * Math.tan(Math.asin((m * w * 1e-9) / d)));   // on each wavelength's own ray
    for (let j = 0; j < n; j++) {
      const wa = W0 + ((W1 - W0) * j) / n, wb = W0 + ((W1 - W0) * (j + 1)) / n, A = pt(wa), Bv = pt(wb), ca = lin(wavelengthRGB(wa)), cb = lin(wavelengthRGB(wb));
      pos.push(P0.x, P0.y, P0.z, A.x, A.y, A.z, Bv.x, Bv.y, Bv.z); along.push(0, 1, 1);
      colr.push(ca.r, ca.g, ca.b, ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);
      const y0 = AXIS_Y - SPOT_H / 2, y1 = AXIS_Y + SPOT_H / 2, x = WALL_X - 0.001, za = orderY(d, m, wa, L), zb = orderY(d, m, wb, L);   // the band: on the wall at orderY
      band.push(x, y0, za, x, y1, za, x, y1, zb, x, y0, za, x, y1, zb, x, y0, zb);
      for (const c of [ca, ca, cb, ca, cb, cb]) bcol.push(c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(colr, 3)); g.setAttribute("along", new THREE.Float32BufferAttribute(along, 1));
    const mat = new THREE.ShaderMaterial({ uniforms: { k: { value: 0 }, time: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: "attribute float along; varying float vA; varying vec3 vC; varying vec3 vP; void main() { vA = along; vC = color; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float k, time; varying float vA; varying vec3 vC; varying vec3 vP; ${NOISE}
        void main() { float fog = 0.72 + 0.28 * n1(vA * 60.0 - time * 0.9) * (0.6 + 0.4 * n1(vP.z * 40.0 + time * 0.3)); gl_FragColor = vec4(vC * k * 0.42 * fog * mix(1.0, 0.75, vA), 1.0); }`,
      vertexColors: true });
    mat.userData.glow = true; const fan = new THREE.Mesh(g, mat); fan.frustumCulled = false; fan.renderOrder = 5;
    const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(band, 3)); bg.setAttribute("color", new THREE.Float32BufferAttribute(bcol, 3));
    const bm = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, color: 0xffffff }); bm.userData.glow = true;
    const bandMesh = new THREE.Mesh(bg, bm); bandMesh.frustumCulled = false; grp.add(fan, bandMesh);
    const t0 = deg(Math.asin((W0 * 1e-9) / d)), t1 = deg(Math.asin((W1 * 1e-9) / d)), mid = new THREE.Vector3(WALL_X, AXIS_Y, orderY(d, m, 540, L)), mm = m < 0 ? "−1" : "1";
    return { key: `white:fan:${m}`, kind: "fan", lamp: "white", m, mesh: fan, band: bandMesh, theta0: t0, theta1: t1, W0, W1, anchor: mid, dir: -1, weight: 1,
      text: `white light, order ${mm}: a fan from ${t0.toFixed(1)}° (380 nm) to ${t1.toFixed(1)}° (700 nm)`, css: "#ffffff" };
  }
  const LAMPS = ["hydrogen", "white", "helium"];
  for (const lamp of LAMPS) {
    for (const it of axialItems(lamp)) items.set(it.key, it);
    if (lamp === "white") { for (const m of [1, -1]) { const it = fanItem(m); items.set(it.key, it); } continue; }
    const lines = SOURCES[lamp].lines, Imax = Math.max(...lines.map((l) => l.I));
    for (const l of lines) for (const m of [1, -1]) { const it = lineItem(lamp, l, m, Imax); items.set(it.key, it); }
  }
  // ---- the ripple sheet: the grating's waves across the whole fog plane, grating -> wall, in the far-field picture:
  // circular waves from the grating, each direction weighted by the N-slit sum (array factor)
  //   v(r, theta, t) = [ sum_n cos(2 pi (d/lambda) (n - (N-1)/2) sin theta) / N ] x E(theta) x cos(k r - w t)
  // E = sinc(pi (a/lambda) sin theta), the single-slit envelope of the slide's own slit width a: it dims the orders
  // (on 600 lines/mm, a/d = 0.4: order 1 at sinc^2 = 0.57 of order 0 in intensity, order 2 at 0.05)
  // (the textbook N-slit result; its peaks are at d sin theta = m lambda and narrow as 1/N). Not to scale: crests are drawn
  // PL_LAM x (lambda / 656 nm) apart (~30,000x), but d/lambda is the bench's true value for every line, so the beams form at
  // the true angles. N is the demo's own "slits lit N" slider (the Grating panel's control), PL_NMIN..PL_NMAX.
  const PL_W = 24;                                                                       // white light: wavelengths sampled 400-700 nm
  const PL_LAM = 0.02, PL_SCALE = PL_LAM / (SOURCES.hydrogen.lines[0].w * 1e-9), PL_C = 0.15, PL_MAX = 8, PL_NMIN = 1, PL_NMAX = 24;
  let plN = 4;
  const AOD0 = sl.a / d; let aod = AOD0;                                                // slit width a / d: the mounted slide's, until the slider moves it
  const PLANE_FS = `uniform float time, lam[${PL_MAX}], kc[${PL_MAX}], dl[${PL_MAX}]; uniform vec3 col[${PL_MAX}]; uniform float xg, gain, N, aod, white, dlW[${PL_W}]; uniform vec3 colW[${PL_W}]; varying vec3 vP;
  void main() {
    float x = vP.x - xg; if (x < 0.0) discard;
    float r0 = length(vec2(x, vP.z)) + 1e-4, s = vP.z / r0;
    vec3 sum = vec3(0.0);
    for (int j = 0; j < ${PL_MAX}; j++) {
      if (kc[j] < 0.002) continue;
      float k = 6.2831853 / lam[j], w = k * ${PL_C.toFixed(3)}, ph = 6.2831853 * dl[j] * s, af = 0.0;
      for (int n = 0; n < ${PL_NMAX}; n++) { if (float(n) >= N) break; af += cos(ph * (float(n) - 0.5 * (N - 1.0))); }
      float u = 3.14159265 * aod * dl[j] * s, env = abs(u) < 1e-4 ? 1.0 : sin(u) / u;
      float v = af / N * env * cos(k * r0 - w * time);
      sum += col[j] * kc[j] * pow(max(v, 0.0), 2.0);   // brightness ~ intensity (v^2) at the crests
    }
    if (white > 0.002) {                                         // white: brightness only, |amplitude|^2 per wavelength
      vec3 acc = vec3(0.0);
      for (int j = 0; j < ${PL_W}; j++) {
        float ph = 6.2831853 * dlW[j] * s, af = 0.0;
        for (int n = 0; n < ${PL_NMAX}; n++) { if (float(n) >= N) break; af += cos(ph * (float(n) - 0.5 * (N - 1.0))); }
        float u = 3.14159265 * aod * dlW[j] * s, env = abs(u) < 1e-4 ? 1.0 : sin(u) / u, A = af / N * env;
        acc += colW[j] * A * A;
      }
      sum += acc * white * (3.0 / ${PL_W}.0);
    }
    float edge = smoothstep(0.0, 0.03, x) * (1.0 - smoothstep(0.85, 1.15, abs(vP.z)));
    gl_FragColor = vec4(sum * gain * edge, 1.0);
  }`;
  const plGeo = new THREE.BufferGeometry(), zE = 1.15, yP = AXIS_Y - 0.002;
  plGeo.setAttribute("position", new THREE.Float32BufferAttribute([xg, yP, -zE, xw, yP, -zE, xw, yP, zE, xg, yP, -zE, xw, yP, zE, xg, yP, zE], 3));
  const plMat = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, lam: { value: new Array(PL_MAX).fill(1) }, kc: { value: new Array(PL_MAX).fill(0) },
      dl: { value: new Array(PL_MAX).fill(1) }, N: { value: plN }, aod: { value: aod }, white: { value: 0 },
      dlW: { value: Array.from({ length: PL_W }, (_, j) => d / ((400 + (300 * j) / (PL_W - 1)) * 1e-9)) },
      colW: { value: Array.from({ length: PL_W }, (_, j) => lin(wavelengthRGB(400 + (300 * j) / (PL_W - 1)))) }, col: { value: Array.from({ length: PL_MAX }, () => new THREE.Color()) }, xg: { value: xg }, gain: { value: 1.3 } },
    vertexShader: "varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: PLANE_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const plane = new THREE.Mesh(plGeo, plMat); plane.frustumCulled = false; plane.renderOrder = 4; plane.visible = false; grp.add(plane);

  // drawn vs real, in one place on every sheet step; the real numbers come from the bench (lit width / d, the slide's a)
  const lamR = SOURCES.hydrogen.lines[0].w * 1e-9, th1 = Math.asin(lamR / d), realW = deg(lamR / (sl.N * d * Math.cos(th1)));
  const DRAWN_VS_REAL = `<b>Drawn:</b> crests ${Math.round(PL_SCALE / 1000)},000× larger, N ≤ ${PL_NMAX}, far-field picture (waves from one point).<br>` +
    `<b>Real:</b> crests ${(lamR * 1e6).toFixed(2)} µm, about ${(Math.round(sl.N / 100) * 100).toLocaleString()} slits lit, each beam about ${realW.toPrecision(1)}° wide, leaving as a ${(sl.W * 100).toFixed(1)} cm wide beam with flat crests.`;
  // the demo's "slits lit N" slider (the Grating panel's own control and wording), above the step card on the sheet steps
  const nBox = document.createElement("div"); nBox.id = "demoN";
  // slit width a, as a fraction of d: 0 = point slits (circular wavelets); the mounted slide's own a/d is the start value
  const aTxt = () => `${(aod * d * 1e6).toFixed(2)} µm = ${aod.toFixed(2)} d${Math.abs(aod - AOD0) < 0.005 ? " (this slide)" : aod < 0.005 ? " (points)" : ""}`;
  nBox.innerHTML = `<div class="nrow"><label class="es-input-label">slits lit N · <span id="demoNVal">${plN}</span></label><input type="range" id="demoNIn" min="${PL_NMIN}" max="${PL_NMAX}" step="1" value="${plN}" style="width:100%;accent-color:#ffae20">
    <div class="h">more slits, narrower beams: the orders stay at d sin θ = mλ</div></div>
    <label class="es-input-label">slit width a · <span id="demoAVal">${aTxt()}</span></label><input type="range" id="demoAIn" min="0" max="0.95" step="0.01" value="${AOD0.toFixed(2)}" style="width:100%;accent-color:#7dd6ff">
    <div class="h">a = 0: point slits, every order equally bright · a = d/2: order 2 vanishes · a → d: only order 0 survives</div>
    <div class="h dv nrow">${DRAWN_VS_REAL}</div>`;
  document.body.appendChild(nBox);
  const nIn = nBox.querySelector("#demoNIn"), nVal = nBox.querySelector("#demoNVal"), aIn = nBox.querySelector("#demoAIn"), aVal = nBox.querySelector("#demoAVal");
  nIn.addEventListener("input", () => { plN = +nIn.value; nVal.textContent = plN; plMat.uniforms.N.value = plN; });
  let aTimer = 0;
  aIn.addEventListener("input", () => { aod = +aIn.value; aVal.textContent = aTxt(); plMat.uniforms.aod.value = aod;
    clearTimeout(aTimer); aTimer = setTimeout(() => computeField(aod), 120); });   // the step 3 panel is an exact sum: recompute once the slider rests
  for (const el of [nIn, aIn]) for (const ev of ["keydown", "pointerdown", "wheel"]) el.addEventListener(ev, (e) => e.stopPropagation());
  // set the sheet to a list of lines [{ w, k }] (up to PL_MAX)
  const plLines = [];
  function setPlane(list, white = 0) {
    plLines.length = 0; const U = plMat.uniforms;
    for (let j = 0; j < PL_MAX; j++) {
      const l = list[j]; U.kc.value[j] = l ? l.k : 0;
      if (l) { U.lam.value[j] = PL_LAM * (l.w / SOURCES.hydrogen.lines[0].w); U.dl.value[j] = d / (l.w * 1e-9); U.col.value[j].copy(lin(wavelengthRGB(l.w))); plLines.push({ w: l.w, lamDrawn: U.lam.value[j], dOverLam: U.dl.value[j], k: l.k }); }
    }
    U.white.value = white; plane.visible = white > 0.002 || list.some((l) => l && l.k > 0.002); U.N.value = plN;
  }

  // bench labels (scene 1)
  const benchLabels = [
    { key: "lbl:tube", anchor: new THREE.Vector3(cmToX(G.S.src) - 0.02, AXIS_Y + 0.06, 0.03), dir: -1, text: "hydrogen tube (glowing gas)", css: "#ffd0e0" },
    { key: "lbl:grating", anchor: new THREE.Vector3(xg, AXIS_Y + 0.03, 0), dir: -1, text: `grating, ${Math.round(1e-3 / d)} lines/mm`, css: "#7dd6ff" },
  ];
  for (const b of benchLabels) items.set(b.key, { ...b, kind: "label", weight: 1 });
  // DOM label per labelled item
  for (const it of items.values()) if (it.text) {
    const el = document.createElement("div"); el.className = "dl"; el.textContent = it.text; el.style.borderLeftColor = it.css; el.style.opacity = 0; labRoot.appendChild(el);
    const ln = document.createElementNS(NS, "polyline"); ln.setAttribute("fill", "none"); ln.setAttribute("stroke", it.css); ln.setAttribute("stroke-width", "1.4"); ln.setAttribute("stroke-opacity", "0.85"); svg.appendChild(ln);
    const dot = document.createElementNS(NS, "circle"); dot.setAttribute("r", "3.2"); dot.setAttribute("fill", it.css); svg.appendChild(dot);
    Object.assign(it, { el, ln, dot, lw: 0, lh: 0 });   // label size (px): not it.w, which is the wavelength
  }

  // ---- the Wavelets scene's magnified slits: 4 point sources at the true d/lambda = 2.54 (only 4, so the far field, where separate beams form, fits inside the panel: it starts near (N d)^2/lambda), three layers in sequence
  //  1. RIPPLES: the wave at one instant, Re(C e^{-i w t}), C = sum of the 4 wavelets (precomputed per pixel)
  //  2. AVERAGED: the same field averaged over time, |C|^2, per pixel: dark where the 4 cancel, bright bands where they
  //     arrive in step. Zoomed out (4 px per wavelength) so the bands separate inside the panel. The screen at the right
  //     edge shows |C|^2 down its column; its peaks fall on sin(theta) = m lambda/d (checked in demo_check.cjs).
  //  3. the order directions (dashed, from the grating's centre) with their labels where they meet the screen
  const inset = document.createElement("div"); inset.id = "demoInset"; inset.style.opacity = 0;
  const CW = 620, CH = 600, cv = document.createElement("canvas"); cv.width = CW; cv.height = CH; inset.appendChild(cv);
  const lamRed = SOURCES.hydrogen.lines[0].w, ratio = d / (lamRed * 1e-9);               // d in wavelengths (2.54)
  const insetNote = document.createElement("div"); insetNote.className = "h";
  insetNote.textContent = `Magnified, not to scale: red ${lamRed.toFixed(0)} nm on ${Math.round(1e-3 / d)} lines/mm, so the slits are d = ${ratio.toFixed(2)} wavelengths apart. Ripples: the wave at one instant (bright = crest). Then the same waves averaged over time: dark where they cancel, bright where they arrive in step. Only 4 slits are drawn so the beams form inside the panel; a real grating has thousands, which makes each beam far narrower. Each slit is a line of wavelets across its width a (the blue slider): a = 0 is a point, every order equally bright; wider slits dim the outer orders.`;
  inset.appendChild(insetNote);
  // scene 1's atom panel: a second canvas + note in the same inset frame (only one pane shows at a time)
  const AW = 620, AH = 520, cvA = document.createElement("canvas"); cvA.width = AW; cvA.height = AH; inset.appendChild(cvA);
  const noteA = document.createElement("div"); noteA.className = "h";
  noteA.textContent = "Hydrogen's energy levels, E = −13.6 eV / n², drawn to scale from n = 2 up (n = 1 is far below). Each drop to n = 2 gives off one photon: hf = ΔE, λ = c/f.";
  inset.appendChild(noteA); document.body.appendChild(inset);
  const setPane = (which) => { const a = which === "atom"; cv.style.display = insetNote.style.display = a ? "none" : ""; cvA.style.display = noteA.style.display = a ? "" : "none"; };
  const ax = cvA.getContext("2d");
  const EY0 = 70, EY1 = 400, EMIN = -3.4;                                                 // n = infinity (0 eV) at EY0, n = 2 at EY1
  const yE = (E) => EY0 + (EY1 - EY0) * (E / EMIN);
  const LX0 = 92, LX1 = 330, NX = 425, colX = [140, 185, 230, 275];                                 // level lines; one drop column per line
  const atomShown = [];                                                                    // test hook: what the panel shows
  function drawAtom(t) {
    ax.fillStyle = "#05070b"; ax.fillRect(0, 0, AW, AH); atomShown.length = 0;
    ax.font = "600 15px Inter, sans-serif"; ax.textBaseline = "middle";
    // the levels n = 2..7 and the ionization limit
    for (const n of [2, 3, 4, 5, 6, 7, Infinity]) {
      const E = n === Infinity ? 0 : levelE(n), y = yE(E);
      ax.strokeStyle = n === Infinity ? "rgba(255,255,255,.35)" : "rgba(220,225,235,.85)"; ax.lineWidth = n === Infinity ? 1 : 2; ax.setLineDash(n === Infinity ? [5, 5] : []);
      ax.beginPath(); ax.moveTo(LX0, y); ax.lineTo(LX1, y); ax.stroke(); ax.setLineDash([]);
      ax.fillStyle = "rgba(255,255,255,.85)"; ax.textAlign = "right";
      if (n <= 5 || n === Infinity) ax.fillText(n === Infinity ? "n = ∞" : `n = ${n}`, LX0 - 10, y);
      if (n <= 4 || n === Infinity) { ax.textAlign = "left"; ax.fillStyle = "rgba(255,255,255,.6)"; ax.fillText(n === Infinity ? "0 eV (electron free)" : `${E.toFixed(2)} eV`, LX1 + 8, y); }
    }
    ax.textAlign = "left"; ax.fillStyle = "rgba(255,255,255,.55)"; ax.font = "13px Inter, sans-serif"; ax.fillText("(n = 1 sits at −13.60 eV, far below this scale)", LX0, 50); ax.font = "600 15px Inter, sans-serif";
    ax.save(); ax.translate(26, (EY0 + EY1) / 2); ax.rotate(-Math.PI / 2); ax.textAlign = "center"; ax.fillStyle = "rgba(255,255,255,.7)"; ax.fillText("energy ↑", 0, 0); ax.restore();
    // the strip: 380-700 nm, where each photon's line lands
    const SX0 = 70, SX1 = AW - 30, SY = AH - 50, xW = (w) => SX0 + ((w - 380) / 320) * (SX1 - SX0);
    ax.fillStyle = "#0d1016"; ax.fillRect(SX0, SY - 16, SX1 - SX0, 32); ax.strokeStyle = "rgba(255,255,255,.3)"; ax.lineWidth = 1; ax.strokeRect(SX0, SY - 16, SX1 - SX0, 32);
    ax.font = "13px Inter, sans-serif"; ax.fillStyle = "rgba(255,255,255,.6)"; ax.textAlign = "center";
    for (const w of [400, 500, 600, 700]) ax.fillText(`${w} nm`, xW(w), SY + 28);
    ax.textAlign = "right"; ax.fillText("hydrogen's visible lines", SX1, SY - 26);
    // the four drops, one after another: the electron falls n -> 2, a photon leaves, its line lands on the strip
    BALMER.forEach((b, i) => {
      const t0 = CAP + 0.3 + 1.9 * i, kFall = ramp(t, t0, 0.6), kFly = ramp(t, t0 + 0.6, 0.9), kOn = ramp(t, t0 + 1.5, 0.3);
      if (t < t0) return;
      const rgb = wavelengthRGB(b.w).map((v) => Math.round(255 * Math.min(1, v * 1.15))), css = `rgb(${rgb.join(",")})`, x = colX[i], yTop = yE(levelE(b.n)), yBot = yE(levelE(2));
      // the drop arrow, drawn as far as the electron has fallen
      const yNow = yTop + (yBot - yTop) * kFall;
      ax.strokeStyle = css; ax.lineWidth = 3; ax.beginPath(); ax.moveTo(x, yTop); ax.lineTo(x, yNow); ax.stroke();
      if (kFall >= 1) { ax.fillStyle = css; ax.beginPath(); ax.moveTo(x, yBot); ax.lineTo(x - 7, yBot - 12); ax.lineTo(x + 7, yBot - 12); ax.closePath(); ax.fill(); }
      if (kFall < 1) { ax.fillStyle = "#fff"; ax.beginPath(); ax.arc(x, yNow, 6, 0, 2 * Math.PI); ax.fill(); }
      // the photon: a short wiggle travelling from the bottom of the drop to its place on the strip
      if (kFall >= 1 && kFly < 1) {
        const px = x + (xW(b.w) - x) * kFly, py = yBot + (SY - yBot) * kFly; ax.strokeStyle = css; ax.lineWidth = 2.5; ax.beginPath();
        const ux = xW(b.w) - x, uy = SY - yBot, ul = Math.hypot(ux, uy), nx = -uy / ul, ny = ux / ul;
        for (let s = -22; s <= 0; s += 1) { const q = s / ul, a = 5 * Math.sin(s * 0.9 + t * 20), X = px + ux * q + nx * a, Y = py + uy * q + ny * a; s === -22 ? ax.moveTo(X, Y) : ax.lineTo(X, Y); }
        ax.stroke();
      }
      // its line on the strip, and its numbers beside the ladder
      if (kOn > 0) {
        ax.globalAlpha = kOn; ax.fillStyle = css; ax.fillRect(xW(b.w) - 2.5, SY - 15, 5, 30);
        ax.font = "600 14px Inter, sans-serif"; ax.textAlign = "left"; const ty = 104 + 64 * i;
        ax.fillText(`${b.n} → 2:  ΔE = ${b.dE.toFixed(2)} eV`, NX, ty);
        ax.fillStyle = "rgba(255,255,255,.8)"; ax.font = "13px Inter, sans-serif";
        ax.fillText(`f = ΔE/h = ${(b.f / 1e14).toFixed(2)}×10¹⁴ Hz`, NX, ty + 18);
        ax.fillText(`λ = c/f = ${b.w.toFixed(0)} nm, ${colorName(b.w)}`, NX, ty + 35);
        ax.globalAlpha = 1; atomShown.push({ n: b.n, dE: b.dE, w: b.w, stripX: xW(b.w) });
      }
    });
    ax.font = "600 15px Inter, sans-serif"; ax.fillStyle = "rgba(255,255,255,.75)"; ax.textAlign = "left";
    ax.fillText("hydrogen atom", LX0, 30); ax.fillText("each photon:  hf = ΔE", NX, 30);
  }
  const ix = cv.getContext("2d"), img = ix.createImageData(CW, CH), NSL = 4, LPX = 4, DPX = LPX * ratio, KX = (2 * Math.PI) / LPX, SX = 40, CY = CH / 2;
  const SLIT_W = 2.6, XS = CW - 18;                                                         // slit opening (px); the screen: the column x = XS
  const slitY = Array.from({ length: NSL }, (_, i) => CY + (i - (NSL - 1) / 2) * DPX);
  const Ifar = (sinT) => { let re = 0, im = 0; for (let n = 0; n < NSL; n++) { const ph = 2 * Math.PI * ratio * n * sinT; re += Math.cos(ph); im += Math.sin(ph); } return (re * re + im * im) / (NSL * NSL); };
  const thMax = (70 * Math.PI) / 180;
  // per pixel: C = the sum of the wavelets (complex amplitude). Each slit is a line of M wavelets spread evenly across its
  // width a (Huygens), amplitude 1/M each: a flat front across the opening with rounded ends; a = 0 is one point.
  // Ripples = Re(C e^{-i w t}); Av = |C|^2, the same wave averaged over time (up to a factor 1/2).
  const Cr = new Float32Array(CW * CH), Ci = new Float32Array(CW * CH), Av = new Float32Array(CW * CH), Nf = new Float32Array(CW * CH);
  const bars = [], scr = new Float32Array(CH), fieldPeaks = []; let smax = 1, slitW = SLIT_W, subN = 1;
  function computeField(aodNow) {
    const aPx = aodNow * DPX; subN = aPx < 0.4 ? 1 : Math.max(2, Math.ceil(aPx / (LPX / 3)));       // sub-sources at most lambda/3 apart
    const offs = Array.from({ length: subN }, (_, k) => (subN === 1 ? 0 : (k / (subN - 1) - 0.5) * aPx));
    let mx = 0, ma = 0;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const i = y * CW + x; let re = 0, im = 0;
      if (x < SX) { re = Math.cos(KX * x) * 0.55; im = Math.sin(KX * x) * 0.55; }
      else for (const sy of slitY) for (const o of offs) { const r = Math.hypot(x - SX, y - sy - o) + 0.5, A = 1 / (subN * Math.sqrt(KX * r + 1)); re += A * Math.cos(KX * r); im += A * Math.sin(KX * r); }
      Cr[i] = re; Ci[i] = im; Av[i] = x < SX ? 0 : re * re + im * im;
      if (x > SX + 200) { mx = Math.max(mx, Math.hypot(re, im)); ma = Math.max(ma, Av[i]); }
      Nf[i] = Math.min(1, Math.max(0, (x - SX - 10) / 120));                                // fade in the averaged layer away from the slits
    }
    const sc = 1 / (mx * 0.8); for (let i = Cr.length; i--;) if (i % CW >= SX) { Cr[i] *= sc; Ci[i] *= sc; Av[i] /= ma; }
    // the barrier: bars between equal openings of width a (drawn at least 1.2 px so a point slit still shows)
    slitW = Math.max(1.2, aPx); bars.length = 0; { let y0 = 0; for (const sy of slitY) { bars.push([y0, sy - slitW / 2]); y0 = sy + slitW / 2; } bars.push([y0, CH]); }
    // the screen: the averaged brightness down the column x = XS, and its peaks (local maxima above 25% of the brightest)
    for (let y = 0; y < CH; y++) scr[y] = Av[y * CW + XS]; smax = Math.max(...scr);
    fieldPeaks.length = 0;
    for (let y = 2; y < CH - 2; y++) if (scr[y] > 0.25 * smax && scr[y] >= scr[y - 1] && scr[y] > scr[y + 1]) fieldPeaks.push({ y, th: deg(Math.atan2(CY - y, XS - SX)), I: scr[y] / smax });
  }
  computeField(aod);
  // each order's direction from the grating's centre, d sin(theta) = m lambda; where it meets the screen, or leaves the canvas
  const peaks = [];
  for (let m = -3; m <= 3; m++) {
    const sT = m / ratio; if (Math.abs(sT) >= 1) continue;
    const th = Math.asin(sT), tn = Math.tan(th), yS = CY - (XS - SX) * tn;
    const hit = yS >= 4 && yS <= CH - 4 ? [XS, yS] : [SX + (tn > 0 ? CY - 4 : -(CH - 4 - CY)) / tn, tn > 0 ? 4 : CH - 4];
    peaks.push({ m, th, hit, onScreen: yS >= 4 && yS <= CH - 4 });
  }
  const labelAt = [];
  function drawInset(t, kMove, kBeam, kMarks) {
    const w = kMove * 2 * Math.PI * 0.8 * t, c = Math.cos(w), s = Math.sin(w), D = img.data;
    for (let i = 0, p = 0; i < Cr.length; i++, p += 4) {
      const v = Cr[i] * c + Ci[i] * s, b = (v > 0 ? Math.min(1, v) : 0) * (1 - 0.85 * kBeam * Nf[i]), e = kBeam * Nf[i] * Math.min(1, Av[i] * 1.6);
      D[p] = Math.min(255, 18 + 215 * b + 255 * e); D[p + 1] = Math.min(255, 6 + 40 * b * b + 215 * e * e); D[p + 2] = Math.min(255, 10 + 36 * b * b + 190 * e * e * e); D[p + 3] = 255;
    }
    ix.putImageData(img, 0, 0);
    ix.fillStyle = "#5a616b"; for (const [y0, y1] of bars) if (y1 > y0) ix.fillRect(SX - 3, y0, 4, y1 - y0);
    ix.font = "600 15px Inter, sans-serif"; ix.fillStyle = "rgba(255,255,255,.85)"; ix.textAlign = "left";
    ix.fillText("light", 4, CH - 34); ix.fillText("in →", 4, CH - 14);
    ix.fillText(`${NSL} slits`, SX + 8, slitY[0] - 12);
    if (kBeam > 0) {   // the screen: the same averaged brightness, read down its column
      ix.save(); ix.globalAlpha = kBeam;
      for (let y = 0; y < CH; y++) { const g = Math.pow(scr[y] / smax, 0.6); ix.fillStyle = `rgb(${Math.round(40 + 215 * g)},${Math.round(12 + 225 * g * g)},${Math.round(14 + 200 * g * g * g)})`; ix.fillRect(XS, y, 14, 1); }
      ix.strokeStyle = "rgba(200,205,215,.6)"; ix.lineWidth = 1; ix.strokeRect(XS - 0.5, 0.5, 14, CH - 1);
      ix.font = "600 13px Inter, sans-serif"; ix.fillStyle = "rgba(255,255,255,.75)"; ix.textAlign = "right"; ix.fillText("screen", XS - 6, CH - 12); ix.restore();
    }
    labelAt.length = 0;
    if (kMarks > 0) {
      ix.save(); ix.globalAlpha = kMarks; ix.setLineDash([7, 6]); ix.lineWidth = 1.4; ix.strokeStyle = "rgba(255,255,255,.6)";
      for (const pk of peaks) { ix.beginPath(); ix.moveTo(SX, CY); ix.lineTo(pk.hit[0], pk.hit[1]); ix.stroke(); }
      ix.setLineDash([]); ix.font = "700 16px Inter, sans-serif"; ix.textAlign = "left";
      for (const pk of peaks) {
        const txt = pk.m === 0 ? "order 0" : `order ${pk.m < 0 ? "−" : ""}${Math.abs(pk.m)}, ${Math.abs(deg(pk.th)).toFixed(1)}°`, tw = ix.measureText(txt).width;
        const [qx, qy] = pk.hit, bx = pk.onScreen ? XS - tw - 16 : Math.min(XS - tw - 16, qx + 10), by = pk.onScreen ? Math.max(20, Math.min(CH - 30, qy - 10)) : (qy < CY ? 24 : CH - 12);
        ix.fillStyle = "rgba(0,0,0,.72)"; ix.fillRect(bx - 5, by - 17, tw + 10, 23); ix.fillStyle = "#fff"; ix.fillText(txt, bx, by);
        ix.beginPath(); ix.arc(qx, qy, 3.5, 0, 2 * Math.PI); ix.fill();
        labelAt.push({ m: pk.m, th: deg(pk.th), box: [bx - 5, by - 17, bx + tw + 5, by + 6], peak: [qx, qy] });
      }
      ix.restore();
    }
  }

  // ---- the scenes: state(t) says how much of each item shows (0..1); captions first, motion after CAP
  const H = SOURCES.hydrogen.lines, He = SOURCES.helium.lines;
  const ang = (w, m = 1) => deg(Math.asin((m * w * 1e-9) / d));
  const set = (o, lamp, k, which = ["in", "o0"]) => { for (const w of which) o[`${lamp}:${w}`] = k; };
  const lines = (o, lamp, list, k) => { for (const l of list) for (const m of [1, -1]) o[`${lamp}:${l.w}:${m}`] = k; };
  const S1 = (o, t) => { set(o, "hydrogen", ramp(t, CAP, 2.0)); o["lbl:tube"] = o["lbl:grating"] = ramp(t, CAP + 0.8); };
  const S3 = (o, t) => { set(o, "hydrogen", 1); lines(o, "hydrogen", [H[0]], ramp(t, CAP)); };
  const SCENES = [
    { name: "Atom", view: "dBench", title: "Why a gas makes only a few colors.", inset: "atom",
      body: () => `An electron in hydrogen can sit only on certain energy levels. Dropping to level 2, it gives off one photon carrying the difference: hf = ΔE. Four drops, four energies, four frequencies: the source sets f, so the gas makes ${BALMER.map((b) => b.w.toFixed(0)).join(", ")} nm and nothing in between.`,
      state: (o) => set(o, "hydrogen", 0) },
    { name: "Lamp", view: "dBench", title: "A gas lamp makes only a few colors.",
      body: () => `Hydrogen gives off red ${H[0].w.toFixed(0)} nm, cyan ${H[1].w.toFixed(0)} nm, violet ${H[2].w.toFixed(0)} nm and deep violet ${H[3].w.toFixed(0)} nm light, and nothing in between. Fog in the room shows the light: tube → slit → grating → wall. Only the straight-through beam is drawn for now.`,
      state: S1 },
    { name: "Wavelets", view: "dSlide", title: "Each slit sends out wavelets.", inset: "slits",
      body: (t) => t < CAP + 2.5 ? "Close up, each slit of the grating is a new source. Its wavelets spread out in every direction." :
        "The same ripples averaged over time. In most directions the wavelets from the slits arrive out of step and cancel: dark. Only where neighboring paths differ by a whole wavelength, d sin θ = mλ, do they all arrive in step: a beam. Those few beams are the orders.",
      state: (o) => set(o, "hydrogen", 1) },
    { name: "Red", view: "dFan", title: "Red adds up at one angle: d sin θ = λ.",
      body: () => `At θ = ${ang(H[0].w).toFixed(1)}° the paths from neighboring slits differ by exactly one wavelength of red, so red leaves the grating at ±${ang(H[0].w).toFixed(1)}° (order 1). The ripples across the fog are the grating's waves, drawn ${Math.round(PL_SCALE / 1000)},000 times larger (crests ${Math.round(PL_LAM * 100)} cm apart). The ratio d/λ is the real one, so the beams form out of the ripples at the real angles. Slide N to light more slits: the beams narrow, but stay at the same angles.`,
      state: S3, plane: (t) => [{ w: H[0].w, k: ramp(t, CAP, 1.0) }] },
    { name: "Colors", view: "dFan", title: "Shorter wavelength, smaller angle.",
      body: () => `Cyan ${H[1].w.toFixed(0)} nm leaves at ${ang(H[1].w).toFixed(1)}°, violet ${H[2].w.toFixed(0)} nm at ${ang(H[2].w).toFixed(1)}°, deep violet ${H[3].w.toFixed(0)} nm at ${ang(H[3].w).toFixed(1)}°. Each line of the gas lands at its own angle: the grating sorts the colors. Each color's ripples have their own spacing: violet's crests sit closer together than red's, and all travel at the same speed, so more pass each second: c = fλ.`,
      plane: (t) => [{ w: H[0].w, k: 1 }, { w: H[1].w, k: ramp(t, CAP) }, { w: H[2].w, k: ramp(t, CAP + 1.6) }, { w: H[3].w, k: ramp(t, CAP + 3.2) }],
      state: (o, t) => { S3(o, 99); lines(o, "hydrogen", [H[1]], ramp(t, CAP)); lines(o, "hydrogen", [H[2]], ramp(t, CAP + 1.6)); lines(o, "hydrogen", [H[3]], ramp(t, CAP + 3.2)); } },
    { name: "Lines", view: "dWall", title: "Each color draws a line: the line spectrum.",
      body: () => `On the wall, each wavelength lands as a thin upright line, a copy of the lamp's narrow exit slit. Four wavelengths, four lines, in the same order on both sides: hydrogen's barcode. A narrower slit gives sharper lines; a wide one would smear them together.`,
      state: (o) => { set(o, "hydrogen", 1); lines(o, "hydrogen", H, 1); } },
    { name: "White", view: "dFan", title: "White light lands at every angle.",
      // holds on white light until Next, so the sliders can shape the rainbow; the gas comes back in the Helium step
      body: () => `A white lamp has every wavelength from 380 to 700 nm, so order 1 is a continuous fan from ${ang(380).toFixed(1)}° to ${ang(700).toFixed(1)}°: a rainbow, with no gaps. White light has no steady crests, so the sheet shows its brightness. More slits N: each color's beam narrows and the rainbow sharpens (resolving power R = mN).`,
      white: (t) => ramp(t, CAP, 0.8),
      plane: (t) => { const k = 1 - ramp(t, CAP, 0.8); return H.map((l) => ({ w: l.w, k })); },
      state: (o, t) => { const out = ramp(t, CAP, 0.8), kH = 1 - out; set(o, "hydrogen", kH); lines(o, "hydrogen", H, kH);
        set(o, "white", out); o["white:fan:1"] = o["white:fan:-1"] = out; } },
    { name: "Helium", view: "dFan", title: "Different gas, different lines.",
      body: () => { const y = He.find((l) => Math.abs(l.w - 587.562) < 0.01); return `Helium's lines land at their own angles. Its yellow ${y.w.toFixed(1)} nm line (${ang(y.w).toFixed(1)}°) is the one Lab 214 calibrates with. Unlike white light's rainbow, a gas gives a few lines, and the set of angles identifies the gas.`; },
      plane: (t) => He.map((l, i) => ({ w: l.w, k: ramp(t, CAP + 0.9 + 0.25 * i) * (0.45 + 0.55 * Math.sqrt(l.I / 80)) })),
      state: (o, t) => { const kW = 1 - ramp(t, CAP, 0.8); set(o, "white", kW); o["white:fan:1"] = o["white:fan:-1"] = kW;
        set(o, "helium", ramp(t, CAP + 0.6)); He.forEach((l, i) => lines(o, "helium", [l], ramp(t, CAP + 0.9 + 0.25 * i))); } },
  ];

  let idx = 0, t = 0, clock = 0, html = "";
  // the step card (guide.js look): scene tracker (click any scene), Step n of 6, title, text; Back · Replay · Next
  function render() {
    const S = SCENES[idx], n = SCENES.length, last = idx === n - 1;
    const tracker = SCENES.map((sc, k) => `<span class="g-ph${k < idx ? " done" : k === idx ? " on" : ""}" data-k="${k}" title="Go to scene ${k + 1}: ${sc.title}">${k + 1} · ${sc.name}</span>`).join("");
    const h = `<div class="g-tracker">${tracker}</div><div class="g-head"><span class="g-lab">Demo · Grating → emission spectra</span></div>
      <div class="g-step">Step ${idx + 1} of ${n}</div><div class="g-title">${S.title}</div><div class="g-why">${S.body(t)}</div>
      <div class="g-btns"><button class="es-btn" data-d="back"${idx === 0 ? " disabled" : ""}>◂ Back</button>
      <button class="es-btn" data-d="replay" title="Play this step again from its start">↻ Replay</button>
      <button class="es-btn g-ok" data-d="${last ? "restart" : "next"}">${last ? "Start over" : "Next ▸"}</button></div>
      <div class="g-foot">${FOOT}</div>`;
    if (h !== html) { card.innerHTML = h; html = h; }
  }
  function go(i, { at = 0 } = {}) {
    idx = Math.max(0, Math.min(SCENES.length - 1, i)); t = at;
    render(); flyTo(SCENES[idx].view);
  }
  card.addEventListener("click", (e) => {
    const k = e.target.closest("[data-k]"), b = e.target.closest("button[data-d]");
    if (k) { go(+k.dataset.k); return; }
    if (!b || b.disabled) return;
    ({ back: () => go(idx - 1), next: () => go(idx + 1), replay: () => go(idx), restart: () => go(0) })[b.dataset.d]?.();
  });
  // keys are the second path: -> Space PageDown next, <- PageUp back, Home scene 1. Esc (go to the room) and the bench's
  // own keys are held off: the demo stays on its bench
  window.addEventListener("keydown", (e) => {
    if (e.target.closest?.("select, input, textarea")) return;
    if (["ArrowRight", " ", "PageDown"].includes(e.key)) go(idx + 1);
    else if (["ArrowLeft", "PageUp"].includes(e.key)) go(idx - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(SCENES.length - 1);
    else if (!["Escape", "n", "N"].includes(e.key)) return;
    e.preventDefault(); e.stopImmediatePropagation();
  }, { capture: true });

  // ---- nothing on the bench to operate: the step drives everything. Its carriers and rack ignore drags, wheel and
  // clicks; a click on a part no longer flies to its close-up. (The demo's page only; the labs never load this file.)
  for (const c of modOf("grating").registry) { c.set = () => {}; c.click = () => {}; c.rotate = () => {}; c.describe = () => ""; }
  if (focusOf) for (const [obj, v] of [...focusOf]) { let o = obj; for (; o && o !== st.group; o = o.parent); if (o) focusOf.delete(obj); }

  // ---- labels. Beam labels (orders +-1, the white fans) stand in two columns beside the fan, one per side, stacked
  // above the wall line: inner beam at the top, outer at the bottom, so no two leaders cross. Other labels (order 0,
  // the bench parts) take the lowest free row above their anchor. No overlaps; a leader never runs through a label.
  const tmp = new THREE.Vector3();
  const hide = (it) => { it.el.style.display = "none"; it.ln.style.display = it.dot.style.display = "none"; it.placed = null; };
  function show(it, box, seg) {
    it.placed = box; it.el.style.left = box[0] + "px"; it.el.style.top = box[1] + "px"; it.el.style.opacity = Math.min(1, it.kNow * 1.2);
    it.ln.style.display = it.dot.style.display = ""; it.ln.setAttribute("points", `${seg[0]},${seg[1]} ${seg[2]},${seg[3]}`);
    it.ln.setAttribute("stroke-opacity", (0.85 * it.kNow).toFixed(2)); it.dot.setAttribute("cx", it.sx); it.dot.setAttribute("cy", it.sy); it.dot.setAttribute("opacity", it.kNow.toFixed(2));
  }
  function layout() {
    const R = renderer.domElement.getBoundingClientRect(), CR = card.getBoundingClientRect(), list = [];
    for (const it of items.values()) {
      if (!it.el) continue;
      if ((it.kNow || 0) < 0.02 || inset.style.opacity > 0.05) { hide(it); continue; }
      tmp.copy(it.anchor); st.group.localToWorld(tmp); const v = tmp.project(camera);
      if (v.z > 1) { hide(it); continue; }
      it.sx = R.left + ((v.x + 1) / 2) * R.width; it.sy = R.top + ((1 - v.y) / 2) * R.height;
      if (it.el.style.display === "none" || !it.lw) { it.el.style.display = "block"; it.lw = it.el.offsetWidth; it.lh = it.el.offsetHeight; }
      list.push(it);
    }
    const boxes = [[CR.left - 6, CR.top - 6, CR.right + 6, CR.bottom + 6]], segs = [], GAP = 4;   // the step card is an obstacle
    // centre line on screen: the order-0 anchor (the wall point straight on)
    tmp.set(xw, AXIS_Y, 0); st.group.localToWorld(tmp); const c0 = tmp.project(camera), cx = R.left + ((c0.x + 1) / 2) * R.width;
    for (const side of [-1, 1]) {
      const col = list.filter((it) => (it.kind === "line" || it.kind === "fan") && Math.sign(it.sx - cx) === side).sort((a, b) => Math.abs(a.sx - cx) - Math.abs(b.sx - cx));
      if (!col.length) continue;
      const W = Math.max(...col.map((it) => it.lw)), outer = side > 0 ? Math.max(...col.map((it) => it.sx)) : Math.min(...col.map((it) => it.sx));
      let x0 = side > 0 ? outer + 22 : outer - 22 - W; x0 = Math.min(R.width - W - 10, Math.max(10, x0));
      // as many as fit stand above the wall line (innermost beam at the top); the rest stand below it (innermost of
      // those at the bottom). Either way a label further from the line goes to a beam nearer the centre: no leader crosses.
      const yLine = Math.min(...col.map((it) => it.sy)), hRow = Math.max(...col.map((it) => it.lh)) + GAP;
      const nUp = Math.max(0, Math.min(col.length, Math.floor((yLine - 14 - 100) / hRow))), up = col.slice(0, nUp), down = col.slice(nUp);
      const place = (it, y) => { const bx = side > 0 ? x0 : x0 + W - it.lw, box = [bx, y, bx + it.lw, y + it.lh], seg = [it.sx, it.sy, side > 0 ? box[0] : box[2], y + it.lh / 2];
        boxes.push(box); segs.push(seg); show(it, box, seg); };
      up.forEach((it, i) => place(it, yLine - 14 - (up.length - i) * hRow));
      down.forEach((it, i) => place(it, yLine + 14 + (down.length - 1 - i) * hRow));
    }
    const over = (a, b, pad = 3) => a[0] < b[2] + pad && a[2] > b[0] - pad && a[1] < b[3] + pad && a[3] > b[1] - pad;
    const segHits = (s, b) => { for (let q = 0.04; q <= 0.96; q += 0.046) { const x = s[0] + (s[2] - s[0]) * q, y = s[1] + (s[3] - s[1]) * q; if (x > b[0] - 2 && x < b[2] + 2 && y > b[1] - 2 && y < b[3] + 2) return true; } return false; };
    for (const it of list) {
      if (it.kind === "line" || it.kind === "fan") continue;
      let done = null;
      for (let q = 0; q < 36 && !done; q++) {   // rows on its own side first, then the other side
        const r = q % 18, dir = q < 18 ? it.dir : -it.dir, cy = it.sy + dir * (30 + r * (it.lh + 5)), x0 = Math.min(R.width - it.lw - 10, Math.max(10, it.sx - it.lw / 2)), box = [x0, cy - it.lh / 2, x0 + it.lw, cy + it.lh / 2];
        if (box[1] < 96 || box[3] > R.height - 10) continue;
        if (boxes.some((b) => over(b, box))) continue;
        const seg = [it.sx, it.sy, Math.min(box[2] - 6, Math.max(box[0] + 6, it.sx)), dir < 0 ? box[3] : box[1]];
        if (boxes.some((b) => segHits(seg, b)) || segs.some((s2) => segHits(s2, box))) continue;
        done = { box, seg };
      }
      if (!done) { hide(it); continue; }
      boxes.push(done.box); segs.push(done.seg); show(it, done.box, done.seg);
    }
  }

  // ---- per frame (after the wave module's own frame)
  const board = G.board, fog0 = scene.fog.density;
  if (st.lamp) st.lamp.group.visible = false;   // the wave table's pendant shade stands between the fan view and the wall (its light stays)
  const tape = board.parent.children.find((c) => c.material && c.material.color && c.material.color.getHex() === 0xe8c86a);   // the wall mode's L tape
  setTick((dt) => {
    t += dt; clock += dt;
    const S = SCENES[idx], o = {}; S.state(o, t);
    for (const it of items.values()) {
      const k = o[it.key] || 0; it.kNow = k;
      if (it.beam) { it.beam.visible = k > 0.002; it.beam.material.uniforms.k.value = k * it.weight; it.beam.material.uniforms.time.value = clock;
        it.beam.material.uniforms.crest.value = 0; }
      if (it.spot) { it.spot.visible = k > 0.002; it.spot.material.opacity = k * Math.min(1, it.weight * 1.3); }
      if (it.mesh) { it.mesh.visible = k > 0.002; it.mesh.material.uniforms.k.value = k; it.mesh.material.uniforms.time.value = clock; }
      if (it.band) { it.band.visible = k > 0.002; it.band.material.opacity = k; }
    }
    setPlane(S.plane ? S.plane(t) : [], S.white ? S.white(t) : 0); plMat.uniforms.time.value = clock;
    { const cr = card.getBoundingClientRect(); nBox.style.display = S.plane || S.inset === "slits" ? "block" : "none"; for (const r of nBox.querySelectorAll(".nrow")) r.style.display = S.plane ? "" : "none"; nBox.style.left = cr.left + "px"; nBox.style.top = (cr.top - nBox.offsetHeight - 10) + "px"; }
    // the haze thickens as the fog comes up (scene 1), and stays
    const fogK = S.name === "Atom" ? 0 : S.name === "Lamp" ? ramp(t, CAP, 2.0) : 1; scene.fog.density = fog0 + 0.05 * fogK;
    // the wall screen's own painted pattern is the bench's (wavepattern.js); in the demo the spots above show what is
    // revealed so far, so the board shows only its paper (its pattern is still computed: the check compares it)
    board.material.emissiveIntensity = 0; board.userData.glowAs.color.setScalar(0); if (tape) tape.visible = false;
    // the source the bench paints: the lamp now on show (hydrogen / helium; white keeps hydrogen's pattern)
    const lampNow = S.name === "Helium" && t > CAP ? "helium" : S.name === "White" && t > CAP ? "white" : "hydrogen"; if (G.S.source !== lampNow) G.S.source = lampNow;
    render();
    const showInset = !!S.inset; inset.style.opacity = showInset ? 1 : 0; if (showInset) setPane(S.inset);
    if (showInset) {   // right of the step card, under the title, inside the window at any size
      const cr = card.getBoundingClientRect(), left = cr.right + 24, top = 100, roomW = window.innerWidth - left - 30, roomH = window.innerHeight - top - 30 - 64;
      const w = Math.max(300, Math.min(780, roomW, roomH * (CW / CH)));
      if (Math.abs(inset.offsetWidth - w) > 2) inset.style.width = w + "px";
      inset.style.left = Math.round(left + Math.max(0, (roomW - w) / 2)) + "px";
    }
    if (S.inset === "slits") drawInset(t, ramp(t, CAP, 0.6), ramp(t, CAP + 2.5, 1.5), ramp(t, CAP + 4.0, 0.8));
    if (S.inset === "atom") drawAtom(t);
    layout();
  });
  go(0);

  // ---- test hook
  window.__demo = {
    go: (i, at = 0) => go(i, { at }), scene: () => idx, t: () => t, d, L, xg, xw, scenes: SCENES.length,
    shown: () => [...items.values()].filter((it) => (it.kNow || 0) > 0.5).map((it) => ({ key: it.key, kind: it.kind, lamp: it.lamp, w: it.w, m: it.m, theta: it.theta, z: it.z,
      dir: it.beam ? (() => { const v = UP.clone().applyQuaternion(it.beam.quaternion); return [v.x, v.y, v.z]; })() : null,
      start: it.beam ? it.beam.position.toArray() : null, len: it.beam ? it.beam.scale.y : null,
      spot: it.spot ? it.spot.position.toArray() : null, theta0: it.theta0, theta1: it.theta1,
      fanZ: it.mesh ? (() => { const a = it.mesh.geometry.attributes.position.array, out = []; for (let j = 0; j < a.length; j += 9) out.push([a[j + 3], a[j + 5]]); return out; })() : null,
      label: it.el && it.el.style.display !== "none" ? it.el.textContent : null, placed: it.placed || null })),
    labelsOverlap: () => { const bs = [...items.values()].filter((it) => it.el && it.el.style.display !== "none").map((it) => it.el.getBoundingClientRect());
      for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], b = bs[j]; if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) return true; } return false; },
    card: () => { const r = card.getBoundingClientRect(); return { display: getComputedStyle(card).display, step: card.querySelector(".g-step")?.textContent, title: card.querySelector(".g-title")?.textContent, rect: [r.left, r.top, r.right, r.bottom] }; },
    labelsOnCard: () => { const c = card.getBoundingClientRect(); return [...items.values()].filter((it) => it.el && it.el.style.display !== "none").some((it) => { const a = it.el.getBoundingClientRect(); return a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top; }); },
    insetGeom: () => { const out = { DPX, SLIT_W: slitW, subN, aod, ratio, bars: bars.map((b) => [...b]), openings: [], peaksDeg: [], fieldPeaks: fieldPeaks.map((f) => ({ ...f })), labels: labelAt.map((l) => ({ ...l })) };
      for (let k = 1; k < bars.length; k++) out.openings.push([bars[k - 1][1], bars[k][0]]);
      // the screen's local maxima of I(theta), found numerically on a 0.001 deg grid
      let prev = -1, cur = Ifar(Math.sin(-thMax)), th = -thMax;
      for (let k = 1; th < thMax; k++) { const tn = -thMax + k * 1e-3 * Math.PI / 180, nx = Ifar(Math.sin(tn)); if (cur > prev && cur >= nx && cur > 0.5) out.peaksDeg.push(deg(th)); prev = cur; cur = nx; th = tn; }
      return out; },
    names: () => SCENES.map((s) => s.name), atom: () => atomShown.map((a) => ({ ...a })),
    setA: (v) => { aIn.value = v; aIn.dispatchEvent(new Event('input')); clearTimeout(aTimer); computeField(aod); },
    plane: () => ({ visible: plane.visible, white: plMat.uniforms.white.value, N: plN, aOverD: plMat.uniforms.aod.value, slideA: sl.a, slideD: d, lines: plLines.map((l) => ({ ...l })) }),
    // JS mirror of the sheet's angular amplitude (array factor x envelope), for the check
    sheetAmp: (sinT, w, N) => { const dl = d / (w * 1e-9), ph = 2 * Math.PI * dl * sinT; let af = 0; for (let n = 0; n < N; n++) af += Math.cos(ph * (n - 0.5 * (N - 1)));
      const u = Math.PI * aod * dl * sinT; return (af / N) * (Math.abs(u) < 1e-4 ? 1 : Math.sin(u) / u); }, setN: (n) => { nIn.value = n; nIn.dispatchEvent(new Event('input')); },
    insetRect: () => { const r = inset.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; },
    wallProfile: () => G.wallPat.readProfile(), source: () => G.S.source, Lm: () => G.Lm(), d: () => G.aperture().d,
  };
}
