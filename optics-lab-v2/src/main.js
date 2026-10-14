// Optics Lab v2 - the shared core: renderer, studio lighting, camera views + fly-to, interaction, labels, rail panel,
// profiler, main loop, and the MODULE switcher. Each apparatus lives in ./modules/*.js and returns
//   { id, name, group, scope, station, root, views, viewNames, defaultView, registry, labels, panel,
//     frame(dt), text(), warm(), reset(), setLab(on), focus, api }
// Each module lives on a STATION (./stations.js): its root sits in the station's group, and everything it states in
// coordinates (parts, camera views, drag axes) is station-local; the core converts views and axes to world.
// Structure and canon follow the Rankine Cycler viewer (the 3D-tier pilot). Physics lives in ../../physics/.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { MATERIALS } from "./bench.js";
import { buildStations } from "./stations.js";
import { buildRoom, addLamp } from "./room.js";
import { applyFinish } from "./look.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { setupInteraction } from "./interact.js";
import { Labels } from "./hud.js";
import { createLensModule } from "./modules/lens.js";
import { createSnellModule } from "./modules/snell.js";
import { createWaveModules } from "./modules/wave.js";
import { createSpecModule } from "./modules/spec.js";
import { createNotebook } from "./notebook.js";
import { createGuide } from "./guide.js";
import { PROC_212 } from "./guide212.js";

const $ = (id) => document.getElementById(id);
const stage = $("stage");
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ---------------------------------------------------------------- renderer (low-GPU fallback as in the Rankine viewer)
let lowGpu = new URLSearchParams(location.search).has("lowgpu");
try { if (sessionStorage.getItem("olb-lowgpu") === "1") lowGpu = true; } catch {}
function makeRenderer() {
  const tries = lowGpu ? [{ antialias: false, powerPreference: "low-power" }] : [{ antialias: true, powerPreference: "high-performance" }, { antialias: false, powerPreference: "low-power" }];
  for (const [k, opt] of tries.entries()) {
    try { const r = new THREE.WebGLRenderer(opt); if (k > 0) lowGpu = true; return r; } catch (e) { console.warn("WebGL context creation failed with", opt, e.message); }
  }
  return null;
}
const renderer = makeRenderer();
if (!renderer) {
  stage.innerHTML = '<div class="gl-overlay show"><div class="gl-box"><div class="ip-label">3D view unavailable</div><p>This browser could not create a WebGL context. Close other 3D tabs or enable hardware acceleration, then reload.</p></div></div>';
  throw new Error("WebGL unavailable");
}
const PERF_PR = { high: 2, balanced: 1.5, low: 1 };
let perfMode = "balanced";
try { const m = localStorage.getItem("olb-perf"); if (PERF_PR[m]) perfMode = m; } catch {}
if (lowGpu) perfMode = "low";
renderer.setPixelRatio(Math.min(PERF_PR[perfMode], window.devicePixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.className = "webgl"; stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07080a);
scene.fog = new THREE.FogExp2(0x07080a, 0.06);          // the room's walls end the view now; a little depth haze only
const makeEnv = () => { const pm = new THREE.PMREMGenerator(renderer); const t = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); return t; };
scene.environment = makeEnv();

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.02, 40);
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true; orbit.dampingFactor = 0.08; orbit.minDistance = 0.12; orbit.maxDistance = 4.0;
orbit.maxPolarAngle = Math.PI * 0.49;

// ---------------------------------------------------------------- lighting: a darkened optics room
// The STATION RIG is the studio light the bench was tuned under (key spot with the one shadow map, blue rim, two
// softboxes); it stands in the same place relative to whichever station is active (placeRig), so every table keeps
// its close-up look. Each table also has a dim pendant lamp (room.js) so the other tables read from across the room.
// Moving lights never recompiles a shader; adding or removing them would.
const key = new THREE.SpotLight(0xffefdc, 3.2, 0, 0.5, 0.8, 2);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; key.shadow.radius = 4;
const rim = new THREE.SpotLight(0x86b9ff, 3, 0, 0.6, 0.8, 2);
RectAreaLightUniformsLib.init();
const softKey = new THREE.RectAreaLight(0xfff1e2, 1.6, 1.6, 0.6), softStrip = new THREE.RectAreaLight(0x9cc8ff, 0.8, 0.25, 1.4);
scene.add(key, key.target, rim, rim.target, softKey, softStrip);
scene.add(new THREE.HemisphereLight(0x8aa0b8, 0x0a0a0c, 0.10));
// rig positions in station coordinates (where they stood when the bench was alone at the origin)
const RIG = { key: [[1.0, 2.6, 1.7], [0, 0.95, 0]], rim: [[-2.0, 2.2, -1.5], [0, 0.95, 0]], softKey: [[0.2, 2.1, 1.3], [0, 1.0, 0]], softStrip: [[-1.5, 1.6, -0.9], [0, 1.0, 0]] };
function placeRig(st) {
  for (const [L, [p, t]] of [[key, RIG.key], [rim, RIG.rim]]) { L.position.copy(st.toWorld(p)); L.target.position.copy(st.toWorld(t)); L.target.updateMatrixWorld(); }
  for (const [L, [p, t]] of [[softKey, RIG.softKey], [softStrip, RIG.softStrip]]) { L.position.copy(st.toWorld(p)); L.lookAt(st.toWorld(t)); }
}

// the canvas textures (rail scale, tags, rulers, protractor) are drawn once at startup: wait for their webfont, or they
// come out in the fallback font on a cold load (seen as a font race in the R0 screenshots). Capped at 3 s.
try { await Promise.race([document.fonts.load("600 64px 'Share Tech Mono'"), new Promise((r) => setTimeout(r, 3000))]); } catch {}
const room = buildRoom(scene);
const root = new THREE.Group(); root.name = "world"; scene.add(root);       // every station (and so every part) is under it
const stations = buildStations(root), focusOf = new Map();
for (const st of Object.values(stations)) st.lamp = addLamp(scene, st);

// ---------------------------------------------------------------- post (SELECTIVE bloom)
// Only the light glows: materials flagged userData.glow (lamp bulbs, lit slits, the light-box arrow, beams, rays,
// lasers, discharge tubes), and a mesh's userData.glowAs stand-in (the wave screens: a laser's spot and fringes). The bloom pass renders the scene with everything else black (transparent parts hidden),
// so the glow is still blocked by what stands in front of it, but white paper, screens and metal never flare (the
// whole-frame bloom, threshold 1.0, haloed the protractor, the tablets and the screens). Its result is added onto the
// normal render before tone mapping.
const bloomComposer = new EffectComposer(renderer); bloomComposer.renderToScreen = false;
bloomComposer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.65, 0.3, 0.12);   // strength, radius, threshold (low: only lights are in the pass)
bloomComposer.addPass(bloom);
const mixPass = new ShaderPass(new THREE.ShaderMaterial({
  uniforms: { baseTexture: { value: null }, bloomTexture: { value: bloomComposer.renderTarget2.texture }, k: { value: 1 } },
  vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: "uniform sampler2D baseTexture; uniform sampler2D bloomTexture; uniform float k; varying vec2 vUv; void main() { gl_FragColor = texture2D(baseTexture, vUv) + k * texture2D(bloomTexture, vUv); }",
}), "baseTexture");
mixPass.needsSwap = true;
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera)); composer.addPass(mixPass); composer.addPass(new OutputPass());
// black in the glow pass, with the part's own sidedness (a double-sided part seen from behind must still block the glow)
const BLACK = [THREE.FrontSide, THREE.BackSide, THREE.DoubleSide].map((side) => new THREE.MeshBasicMaterial({ color: 0x000000, side }));
const BLACK_BG = new THREE.Color(0x000000), swapped = [];
const glows = (m) => !Array.isArray(m) && m?.userData?.glow;
// the glow pass's stand-ins: every non-glowing part black (with its own sidedness) or hidden; glowRestore() undoes it
function glowSwap() {
  scene.traverse((o) => {
    if (!(o.isMesh || o.isLine || o.isPoints || o.isSprite) || glows(o.material)) return;
    if (o.userData.glowAs) { swapped.push([o, o.material, null]); o.material = o.userData.glowAs; return; }   // a screen: only its light
    if (o.isMesh && !Array.isArray(o.material) && !o.material.transparent) { swapped.push([o, o.material, null]); o.material = BLACK[o.material.side] || BLACK[0]; }
    else if (o.visible) { swapped.push([o, null, true]); o.visible = false; }          // glass, decals, tags: out of the way
  });
}
function glowRestore() { for (let i = swapped.length - 1; i >= 0; i--) { const [o, m, vis] = swapped[i]; if (m) o.material = m; else o.visible = vis; } swapped.length = 0; }
function renderGlow() {
  const bg = scene.background, auto = renderer.shadowMap.autoUpdate;
  try {
    glowSwap();
    scene.background = BLACK_BG; renderer.shadowMap.autoUpdate = false;                // the shadow maps from the main pass stand
    bloomComposer.render();
  } finally {                                                                           // always put everything back, even if the render throws
    scene.background = bg; renderer.shadowMap.autoUpdate = auto; glowRestore();
  }
}
let glowOn = true;
function renderAll() {
  if (lowGpu) { renderer.render(scene, camera); return; }
  mixPass.uniforms.k.value = glowOn ? 1 : 0;
  if (glowOn) renderGlow();          // first: the main pass adds its result (the glow pass reuses last frame's shadow maps)
  composer.render();
}

// ---------------------------------------------------------------- modules
let current = null, viewName = "overview", fly = null;
const setText = ({ rail = "", chips = "", status = "", mode = "" }) => {
  $("railChips").innerHTML = rail; $("railChips").style.display = rail ? "" : "none";
  $("chips").innerHTML = chips; $("status").innerHTML = status;
  $("mode").textContent = `${(current.viewNames[viewName] || "Bench").replace(/ overview$/, "")} · ${mode}`;
};
const ctx = { renderer, scene, camera, stations, $, clamp, setText, MATERIALS };
const MODULES = [createSnellModule(ctx), createLensModule(ctx), ...createWaveModules(ctx), createSpecModule(ctx)];
const stationOf = (m) => stations[m.station];
// a shared apparatus registers its controls and labels once (on its first module)
const firstOfRoot = (m) => MODULES.find((x) => x.root === m.root) === m;
for (const m of MODULES) {
  if (m.root.parent !== stationOf(m).group) stationOf(m).group.add(m.root);
  for (const [obj, v] of m.focus || []) focusOf.set(obj, v);
  // slide axes are stated in station-local terms: turn them into world directions once (stations don't move)
  if (firstOfRoot(m)) for (const c of m.registry) if (c.axis) c.axis = stationOf(m).dirToWorld(c.axis);
}
// the whole room is always there: every station and its apparatus stays visible (only the active one runs, below)
const stationGroupOf = (o) => { for (; o; o = o.parent) if (o.name.startsWith("station:")) return o; return null; };
// only the active station casts shadows (the rig's one shadow map is there); the others keep their flags for later (R3)
for (const st of Object.values(stations)) st.group.traverse((o) => { if (o.isMesh) o.userData.castsShadow = o.castShadow; });
function shadowsFor(active) { for (const st of Object.values(stations)) st.group.traverse((o) => { if (o.isMesh) o.castShadow = st === active && o.userData.castsShadow; }); }
root.traverse((o) => { if (o.isMesh && o.material && "envMapIntensity" in o.material && o.material !== MATERIALS.glass) o.material.envMapIntensity = 0.45; });
applyFinish(MATERIALS);
root.traverse((o) => { if (o.isMesh && (o.material === MATERIALS.glow || o.material === MATERIALS.diffuser || o.material === MATERIALS.glass)) o.userData.sharedLook = true; });
const modOf = (id) => MODULES.find((m) => m.id === id);
// the lab notebook (Exp 212/213/214): a tablet on each of those tables; while open, the world centres between it and the rail
const notebook = createNotebook({ stations, onLayout: () => { lastDx = null; applyViewOffset(); if (current && !inRoom) flyTo(viewName); } });

$("modSel").innerHTML = '<option value="" disabled hidden>Choose a lab…</option>' + [...new Set(MODULES.map((m) => m.group))].map((g) => `<optgroup label="${g}">` +
  MODULES.filter((m) => m.group === g).map((m) => `<option value="${m.id}">${m.name}</option>`).join("") + "</optgroup>").join("");

// ---------------------------------------------------------------- the room view (R2) and going to a station
// In the room every table is scenery you can click: it flies you to that station. At a station, the Room button, the
// Camera menu's "Room" entry or Esc bring you back. The Module menu flies between stations from anywhere.
let inRoom = false;
// the room view: a high three-quarter cutaway, fitted like a station view so all three tables fill the frame left of the
// panel at any size. The camera ends up above the ceiling and past the south wall; both face only into the room, so
// from outside they are not drawn.
const ROOM_VIEW = [[-0.4 - 0.3, 0.8 + 1.0, 0.1 + 1.05], [-0.4, 0.8, 0.1], [6.9, 4.4]];
const lastModule = { ray: "snell", lens: "lens", wave: "double", spec: "spec" };  // the lab a station opens with (its last one)
const STATION_LABS = { ray: "Snell's law", lens: "Thin lens", wave: "Double slit · Single slit · Grating", spec: "Grating spectrometer (Exp 214)" };
const showPanel = (key) => document.querySelectorAll("[data-mod]").forEach((el) => { el.style.display = el.dataset.mod.split(" ").includes(key) ? "" : "none"; });
function enterRoom(instant = false) {
  inRoom = true; document.body.classList.add("in-room"); showPanel("room"); notebook.close();
  $("modSel").value = ""; $("view").innerHTML = '<option value="room">Room (all tables)</option>'; viewName = "room";
  $("mode").textContent = "Lab room · click a table to go to it"; $("scope").textContent = "PSE-II · Optics lab";
  labels.center.set(0, 1.0, 0); orbit.maxDistance = 16;
  flyCam(fitPosition(ROOM_VIEW, "room"), new THREE.Vector3(...ROOM_VIEW[1]), instant);
}
function setModule(id, { fly: animate = false } = {}) {
  const m = modOf(id); if (!m) return;
  inRoom = false; document.body.classList.remove("in-room"); orbit.maxDistance = 4.0;
  current = m; $("modSel").value = id; m.enter?.();   // a module takes effect at once, not on its next frame
  lastModule[m.station] = id;
  placeRig(stationOf(m)); shadowsFor(stationOf(m)); labels.center.copy(stationOf(m).toWorld([0, 1.0, 0]));   // the rig, its shadows and the label layout follow the station
  showPanel(m.panel); notebook.follow(m.station);
  $("scope").textContent = `PSE-II · ${m.scope}`;
  $("view").innerHTML = Object.entries(m.viewNames).map(([v, n]) => `<option value="${v}">${n}</option>`).join("") + '<option value="room">Room (all tables)</option>';
  m.setLab?.(lab);
  flyTo(m.defaultView, !animate);
}
const goStation = (id) => setModule(lastModule[id], { fly: true });

// ---------------------------------------------------------------- camera views + fly-to (each module's views follow its parts)
function fitPosition([p, t, [fw, fh]], v) {
  const W = window.innerWidth, H = window.innerHeight, railLeft = $("rail").getBoundingClientRect().left, nbRight = notebook.right();
  const usableW = (railLeft > W * 0.4 ? railLeft : W) - nbRight - 70, usableH = Math.min(H - 240, H - guideBand - 120);   // the guide card's band stays clear
  const tanV = Math.tan((camera.fov * Math.PI) / 360);
  const dW = (fw / 2) / (tanV * (usableW / H)), dH = (fh / 2) / (tanV * (usableH / H));
  const dir = new THREE.Vector3(...p).sub(new THREE.Vector3(...t)); const d0 = dir.length(), d = Math.max(dW, dH) * 1.05;
  return new THREE.Vector3(...t).add(dir.multiplyScalar((v === current.defaultView ? Math.max(d, d0 * 0.8) : d) / d0));
}
// a module's view is [camera position, target, [fit width, fit height]] in its station's coordinates
function flyTo(v, instant = false) {
  if (v === "room") { if (!inRoom) enterRoom(instant); else flyCam(fitPosition(ROOM_VIEW, "room"), new THREE.Vector3(...ROOM_VIEW[1]), instant); return; }
  const local = current.views[v] && current.views[v](); if (!local) return; viewName = v; $("view").value = v;
  const st = stationOf(current), view = [st.toWorld(local[0]).toArray(), st.toWorld(local[1]).toArray(), local[2]];
  flyCam(fitPosition(view, v), new THREE.Vector3(...view[1]), instant);
}
// a flight longer than a metre or so takes longer and arcs up over the furniture (never through a table)
function flyCam(p1, t1, instant) {
  if (instant) { fly = null; camera.position.copy(p1); orbit.target.copy(t1); orbit.update(); return; }
  const dist = camera.position.distanceTo(p1);
  fly = { t: 0, p0: camera.position.clone(), t0: orbit.target.clone(), p1, t1, dur: clamp(0.6 + dist * 0.18, 0.9, 1.8), arc: dist > 1.2 ? Math.min(0.9, dist * 0.12) : 0 };
}

// ---------------------------------------------------------------- interaction + labels across all modules
// a control in a hidden module can't be hovered or grabbed (interact.js skips anything under a hidden parent)
// only the active station's parts answer the mouse; the other tables are scenery until you go to them (R2)
// in the room, a whole station is one click target (it takes you there)
const stationCtl = Object.fromEntries(Object.values(stations).map((st) => [st.group.name, { id: "station:" + st.id, name: st.name, kind: "click", objects: [],
  click: () => goStation(st.id), describe: () => `${STATION_LABS[st.id]}<br>click to go to this table` }]));
const ix = setupInteraction({ camera, dom: renderer.domElement, orbit, root, registry: [...MODULES.filter(firstOfRoot).flatMap((m) => m.registry), ...notebook.registry], focusOf, flyTo, tip: $("tip"),
  isActive: (o) => !inRoom && stationGroupOf(o) === stationOf(current).group,
  roomTarget: (o) => (inRoom ? stationCtl[stationGroupOf(o)?.name] || null : null),
  carry: () => (!inRoom && current.carry && current.carry.active() ? current.carry : null) });
const roomLabels = Object.values(stations).map((st) => ({ text: `${st.name} · ${STATION_LABS[st.id]}`, obj: st.group, off: [st.table.cx, 1.25, st.table.cz], prio: 3, when: () => inRoom }));
const nbLabels = notebook.labels.map((L) => ({ ...L, when: () => !inRoom && current.station === L.station && !notebook.isOpen() }));
const labels = new Labels([...MODULES.filter(firstOfRoot).flatMap((m) => m.labels.map((L) => ({ ...L, when: () => !inRoom && current.root === m.root && (!L.when || L.when()) }))), ...roomLabels, ...nbLabels], new THREE.Vector3(0, 1.0, 0));
labels.occluders = [root];

// ---------------------------------------------------------------- rail panel (shared parts)
// Cole 2026-10-14: every station opens READY FOR THE LAB (the bench as a student finds it, computed values hidden);
// Free mode (the toggle, or ?free=1) shows the values and sets the benches up as demonstrations
let lab = !new URLSearchParams(location.search).has("free");
$("modSel").addEventListener("change", (e) => setModule(e.target.value, { fly: true }));
$("roomBtn").addEventListener("click", () => enterRoom());
window.addEventListener("keydown", (e) => {
  if (inRoom || e.target.closest?.("select, input, textarea, #notebook")) return;
  if (e.key === "Escape" && notebook.isOpen()) { notebook.close(); e.preventDefault(); return; }    // Esc closes the notebook before anything else
  if ((e.key === "n" || e.key === "N") && !e.ctrlKey && !e.metaKey && !e.altKey) { if (notebook.toggle(current.station)) e.preventDefault(); return; }
  if (current.key && current.key(e)) { e.preventDefault(); return; }       // the module's own keys first (Exp 212: nudge the part, Esc puts a held part back)
  if (e.key === "Escape") enterRoom();
});
$("view").addEventListener("change", (e) => flyTo(e.target.value));
$("resetBtn").addEventListener("click", () => current.reset());
$("tFree").checked = !lab; document.body.classList.toggle("lab", lab); for (const m of MODULES) m.setLab?.(lab);
$("tFree").addEventListener("change", (e) => { lab = !e.target.checked; document.body.classList.toggle("lab", lab); for (const m of MODULES) m.setLab?.(lab); if (!lab && guide.isActive()) guide.stop(); });
// ---------------------------------------------------------------- the Guide: a lab's procedure, step by step (Exp 212 for now)
const GUIDES = { snell: PROC_212 };
let guideProc = null;
const screenXY = (obj, off = [0, 0, 0]) => { const v = obj.localToWorld(new THREE.Vector3(...off)).project(camera), R = renderer.domElement.getBoundingClientRect();
  return v.z > 1 ? null : [R.left + (v.x + 1) / 2 * R.width, R.top + (1 - v.y) / 2 * R.height]; };
const guide = createGuide({ $, flyTo, screenPoint: screenXY, notebook, onExit: () => { guideProc = null; $("guideBtn").classList.remove("on"); } });
// what a step's predicates see: the bench's api and state, the ray the readouts follow, and the notebook's cells
function guideCtx() {
  const M = modOf(guideProc.module).api, W = M.debug() && M.debug().wls, T = W && W.length ? W[Math.floor(W.length / 2)] : null, st = notebook.state(guideProc.id);
  const nb = (path) => { const [k, a, b, c] = path.split("."); return k === "t" ? st.t[a]?.[+b]?.[c] : k === "c" ? st.c[a] : st.meta?.[a]; };
  const filled = (path) => { const v = nb(path), t = v === undefined || v === null ? "" : String(v).trim().replace(/[−–]/g, "-"); return t !== "" && /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t); };
  return { M, S: M.S, T, nb, filled };
}
$("guideBtn").addEventListener("click", () => {
  if (guide.isActive()) { guide.stop(); return; }
  const P = GUIDES[current.id]; if (!P) return;
  if ($("tFree").checked) { $("tFree").checked = false; $("tFree").dispatchEvent(new Event("change")); }   // the guide is the lab: free mode off
  guideProc = P; guide.start(P, guideCtx); $("guideBtn").classList.add("on");
});
$("tLabels").addEventListener("change", (e) => { labels.show = e.target.checked; });
$("tGlow").addEventListener("change", (e) => { glowOn = e.target.checked; });

// ---------------------------------------------------------------- view offset (bench centred left of the rail), resize
let lastDx = null, guideBand = 0;          // guideBand: the guide card's height + margin, kept clear of the bench (px)
function applyViewOffset() {
  const W = window.innerWidth, H = window.innerHeight, railLeft = $("rail").getBoundingClientRect().left, nbRight = notebook.right();
  const usable = railLeft > 0 ? railLeft : W, dx = usable < W * 0.4 ? 0 : Math.round(W / 2 - (usable + nbRight) / 2);
  const dy = Math.round(guideBand / 2), key = dx + "," + dy;               // and up, above the guide card
  if (key === lastDx) return; lastDx = key;
  if (dx === 0 && dy === 0) camera.clearViewOffset(); else camera.setViewOffset(W, H, dx, dy, W, H);
}
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight; lastDx = null; applyViewOffset(); camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight); bloomComposer.setSize(window.innerWidth, window.innerHeight);
  flyTo(viewName, true);
});
// ?module=<id> opens at that station (chapter links); otherwise the lab opens in the room, with the thin lens behind it
const startMod = new URLSearchParams(location.search).get("module");
setModule(modOf(startMod) ? startMod : "lens");
if (!modOf(startMod)) enterRoom(true);

// ---------------------------------------------------------------- performance modes + context loss (as in the Rankine viewer)
function setPerf(mode, why = "") {
  perfMode = mode; lowGpu = mode === "low"; $("perfMode").value = mode;
  renderer.setPixelRatio(Math.min(PERF_PR[mode], window.devicePixelRatio)); renderer.setSize(window.innerWidth, window.innerHeight);
  for (const c of [composer, bloomComposer]) { c.setPixelRatio(renderer.getPixelRatio()); c.setSize(window.innerWidth, window.innerHeight); }
  $("tGlow").checked = !lowGpu && glowOn; $("tGlow").disabled = lowGpu;
  $("gpuNote").textContent = lowGpu ? `Low-GPU mode: glow off, reduced resolution${why ? " (" + why + ")" : ""}.` : mode === "high" ? "High: full display resolution." : "Balanced: resolution capped at 1.5×, glow on.";
}
$("perfMode").addEventListener("change", (e) => { const m = e.target.value; try { localStorage.setItem("olb-perf", m); sessionStorage.setItem("olb-lowgpu", "0"); } catch {} setPerf(m, m === "low" ? "selected" : ""); });
let glLost = false;
renderer.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); glLost = true; $("glOverlay").classList.add("show"); $("glMsg").textContent = "Likely cause: too many 3D tabs open, or the GPU driver reset."; });
renderer.domElement.addEventListener("webglcontextrestored", () => {
  scene.environment = makeEnv();
  scene.traverse((o) => { for (const m of o.material ? [].concat(o.material) : []) { m.needsUpdate = true; for (const k of ["map", "roughnessMap", "bumpMap", "emissiveMap"]) if (m[k] && !m[k].isRenderTargetTexture) m[k].needsUpdate = true; } });
  for (const m of MODULES) m.onContextRestored?.();
  // repaint every painted screen now (R4): render-target contents are gone, and the painters only redraw on a change;
  // without this the screens stayed black until a student moved something - and in the room, until they visited.
  // (No composer.setSize here: three.js rebuilds GPU objects lazily after a restore, and resizing disposed the lost
  // context's targets, ~90 "object does not belong to this context" warnings.)
  for (const m of MODULES) if (firstOfRoot(m)) m.warm?.();
  glLost = false; $("glOverlay").classList.remove("show");
});
setTimeout(() => setPerf(perfMode, lowGpu ? "after a GPU problem" : ""), 0);

// ---------------------------------------------------------------- loop
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clock = new THREE.Clock();
let textT = 0, frames = 0;
// ---- profiler (as the Rankine viewer): ?perf=1 shows FPS + a per-section ms split (EMA); ?perf=2 also calls
// gl.finish() so GPU time lands in "render". Startup times (to first frame, to first readouts) are kept too.
const PERF = +(new URLSearchParams(location.search).get("perf") || 0), T0 = performance.now();
const perf = { on: PERF > 0, ms: {}, fps: 0, frameMs: 0, last: 0, hudT: 0, firstFrame: null, firstText: null };
let perfT = 0;
const mark = (name) => { if (!perf.on) return; const t = performance.now(); perf.ms[name] = (perf.ms[name] ?? 0) * 0.95 + (t - perfT) * 0.05; perfT = t; };
function perfFrame(dt) {
  const t = performance.now(); if (perf.last) { perf.frameMs = perf.frameMs * 0.95 + (t - perf.last) * 0.05; perf.fps = 1000 / perf.frameMs; } perf.last = t;
  perf.hudT += dt; if (perf.hudT < 0.5) return; perf.hudT = 0;
  const h = $("perfHud"); h.style.display = "block";
  h.textContent = `FPS ${perf.fps.toFixed(0)}  (${perf.frameMs.toFixed(1)} ms/frame)  ${perfMode}  ${current.id}\n` + Object.entries(perf.ms).map(([k, v]) => `${k.padEnd(8)} ${v.toFixed(2).padStart(6)} ms`).join("\n") +
    `\npixel ratio ${renderer.getPixelRatio()}\nfirst frame ${perf.firstFrame?.toFixed(0)} ms · first readouts ${perf.firstText?.toFixed(0)} ms`;
}
function frame() {
  const dt = Math.min(0.1, clock.getDelta());
  if (perf.on) perfT = performance.now();
  if (!inRoom) current.frame(dt); mark("module");      // the room view runs no station: every table holds its last state
  if (fly) {
    fly.t = Math.min(1, fly.t + dt / (fly.dur || 0.9)); const k = ease(fly.t);
    camera.position.lerpVectors(fly.p0, fly.p1, k); orbit.target.lerpVectors(fly.t0, fly.t1, k);
    if (fly.arc) camera.position.y += Math.sin(Math.PI * k) * fly.arc;
    if (fly.t >= 1) fly = null;
  }
  applyViewOffset(); orbit.update();
  labels.update(camera, renderer.domElement, dt); ix.refresh(); mark("labels");
  textT += dt; if (textT > 0.1) { textT = 0; if (!inRoom) current.text(); perf.firstText ??= performance.now() - T0; } mark("text");
  if (guideProc) guide.update(!inRoom && current.id === guideProc.module);   // the guide shows at its own table only
  { const g = $("guide"), band = g && g.style.display === "block" ? g.offsetHeight + 50 : 0;   // keep the bench above the card
    if (Math.abs(band - guideBand) > 24) { guideBand = band; lastDx = null; applyViewOffset(); if (current && !inRoom) flyTo(viewName); } }
  if (!glLost && !document.hidden) { frames++; const t = performance.now(); renderAll(); perf.firstRender ??= performance.now() - t; }
  if (PERF > 1) renderer.getContext().finish();
  mark("render"); perf.firstFrame ??= performance.now() - T0;
  if (perf.on) perfFrame(dt);
  requestAnimationFrame(frame);
}
// Compile every shader before the first frame, without blocking the page (KHR_parallel_shader_compile where the
// driver has it): on Direct3D the studio-lit materials take ~3 s to compile, and a synchronous first render froze the
// tab for that long. Every module is shown for the compile so switching later costs nothing. A small card says what is
// happening meanwhile.
{
  const card = document.createElement("div"); card.className = "gl-overlay show"; card.id = "prepCard"; card.style.cursor = "default"; card.style.background = "rgba(6,8,12,.35)";
  card.innerHTML = '<div class="gl-box"><div class="ip-label">Preparing the lab</div><p>Compiling the 3D materials for this graphics card. This takes a few seconds the first time.</p></div>';
  document.body.appendChild(card);
  const tc = performance.now();
  try {
    for (const m of MODULES) if (firstOfRoot(m)) m.warm?.();
    // compile with the bloom pipeline's offscreen buffer bound: its shader variants differ from the on-screen ones
    if (!lowGpu) renderer.setRenderTarget(composer.readBuffer);
    await renderer.compileAsync(scene, camera); renderer.setRenderTarget(null);
    if (!lowGpu) { renderer.setRenderTarget(composer.readBuffer); for (const m of BLACK) renderer.compile(new THREE.Mesh(new THREE.BoxGeometry(), m), camera); renderer.setRenderTarget(null); }   // the glow pass's black
    await new Promise((r) => requestAnimationFrame(r));                       // let the card paint before the warm-up
    renderAll();                                                              // warm-up: shadow passes, bloom passes
  } catch (e) { renderer.setRenderTarget(null); console.warn("async shader compile unavailable:", e.message); }
  if (inRoom) enterRoom(true); else setModule(current.id);                 // back to where the page opened
  perf.compile = performance.now() - tc; card.remove();
}
perf.boot = performance.now() - T0;
requestAnimationFrame(frame);

// test / automation hook (no effect on normal use). The thin-lens API stays at the top level (older checks use it).
const lensApi = modOf("lens").api;
window.__bench = { notebook, guide, scene, camera, renderer, orbit, P: lensApi.P, stations, room, registry: MODULES.filter(firstOfRoot).flatMap((m) => m.registry), flyTo, frames: () => frames,
  ...lensApi, get S() { return lensApi.S; },
  modules: Object.fromEntries(MODULES.map((m) => [m.id, m.api])), setModule, module: () => current.id, enterRoom, goStation, inRoom: () => inRoom, flying: () => !!fly,
  perf: () => ({ fps: perf.fps, frameMs: perf.frameMs, ms: { ...perf.ms }, firstFrame: perf.firstFrame, firstText: perf.firstText, boot: perf.boot, firstPaint: perf.firstPaint, firstRender: perf.firstRender, compile: perf.compile, pixelRatio: renderer.getPixelRatio(), mode: perfMode }),
  perfReset: () => { perf.ms = {}; perf.frameMs = 0; perf.last = 0; }, setPerfMode: (m) => { $("perfMode").value = m; $("perfMode").dispatchEvent(new Event("change")); },
  setLab: (on) => { $("tFree").checked = !on; $("tFree").dispatchEvent(new Event("change")); },
  // window coordinates of a point given in a part's local frame
  screenPoint: (obj, off = [0, 0, 0]) => { const v = obj.localToWorld(new THREE.Vector3(...off)).project(camera), R = renderer.domElement.getBoundingClientRect();
    return [R.left + (v.x + 1) / 2 * R.width, R.top + (1 - v.y) / 2 * R.height]; } };

// ?bench=1: the lab-PC benchmark runs a fixed tour and shows its frame rates (benchrun.js; R3)
if (new URLSearchParams(location.search).has("bench")) import("./benchrun.js").then((m) => m.runBench(window.__bench));
