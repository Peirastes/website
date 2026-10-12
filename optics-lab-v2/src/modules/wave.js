// MODULES: Double slit, Single slit, Grating - one wave-optics apparatus on the rail, shared by three modules.
//   source (laser, discharge tube, white lamp) -> slide holder -> screen (a card on the rail, or the WALL board across
//   the room for long distances; L is then measured from the slide to the wall).
// Real slide set in a rack beside the rail; each module shows its own slides. EXTENDED: continuous a, d, N ("custom
// slide"). The pattern is GPU-painted from the Fraunhofer formulas (wavepattern.js, physics/wave.mjs); each screen
// carries a ruler so fringe spacings can be measured; lab mode hides the computed values.
import * as THREE from "three";
import { MATERIALS, cmToX, AXIS_Y, RAIL_TOP, TABLE_Y, RAIL, WALL_X } from "../bench.js";
import { WavePattern } from "../wavepattern.js";
import { SOURCES, wavelengthRGB, orderY, singleMinY } from "../../physics/wave.mjs";

const CARD_CM = 16, WALL_W = 240, WALL_H = 60;     // screen sizes (cm)
const BEAM_W = { laser: 0.2, tube: 0.5, lamp: 0.5 };   // illuminated width at the slide (cm): sets N for a grating

export const SLIDES = {
  single: [{ id: "s20", a: 20e-6, tag: "a 0.02 mm" }, { id: "s40", a: 40e-6, tag: "a 0.04 mm" }, { id: "s80", a: 80e-6, tag: "a 0.08 mm" }, { id: "s160", a: 160e-6, tag: "a 0.16 mm" }],
  double: [{ id: "d25a4", a: 40e-6, d: 250e-6, tag: "d 0.25 · a 0.04" }, { id: "d50a4", a: 40e-6, d: 500e-6, tag: "d 0.50 · a 0.04" },
           { id: "d25a8", a: 80e-6, d: 250e-6, tag: "d 0.25 · a 0.08" }, { id: "d50a8", a: 80e-6, d: 500e-6, tag: "d 0.50 · a 0.08" }],
  grating: [{ id: "g100", d: 1e-3 / 100, a: 0.4e-3 / 100, tag: "100 lines/mm" }, { id: "g300", d: 1e-3 / 300, a: 0.4e-3 / 300, tag: "300 lines/mm" },
            { id: "g600", d: 1e-3 / 600, a: 0.4e-3 / 600, tag: "600 lines/mm" }],
};
const KIND_NAME = { single: "Single slit", double: "Double slit", grating: "Grating" };

function rulerTexture(widthCm, heightPx, everyMm, labelEveryCm) {
  const W = 4096, c = document.createElement("canvas"); c.width = W; c.height = heightPx; const g = c.getContext("2d"), pxPerCm = W / widthCm;
  g.clearRect(0, 0, W, heightPx); g.fillStyle = "#15171a"; g.textAlign = "center"; g.textBaseline = "top";
  g.font = `600 ${Math.round(heightPx * 0.32)}px 'Share Tech Mono', monospace`;
  const half = widthCm / 2;
  for (let mm = -half * 10; mm <= half * 10; mm += everyMm) {
    const x = W / 2 + (mm / 10) * pxPerCm, big = mm % (labelEveryCm * 10) === 0, mid = mm % 5 === 0;
    const len = big ? heightPx * 0.5 : mid ? heightPx * 0.34 : heightPx * 0.2; g.fillRect(x - (big ? 1.5 : 0.8), 0, big ? 3 : 1.6, len);
    if (big) g.fillText(String(Math.abs(mm / 10)), x, heightPx * 0.56);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}

function carrier(name, postX = 0) {
  const g = new THREE.Group(); g.name = name;
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const saddle = box(0.06, 0.035, RAIL.d + 0.026, MATERIALS.anod); saddle.position.y = RAIL_TOP + 0.0115; g.add(saddle);
  const ptr = box(0.0016, 0.02, 0.003, MATERIALS.brass); ptr.position.set(0, RAIL_TOP - 0.006, RAIL.d / 2 + 0.0145); g.add(ptr);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, AXIS_Y - RAIL_TOP - 0.03, 24), MATERIALS.alu);
  post.position.set(postX, RAIL_TOP + 0.029 + (AXIS_Y - RAIL_TOP - 0.03) / 2, 0); g.add(post);
  return g;
}

export function createWaveModules({ renderer, $, clamp, setText }) {
  const group = new THREE.Group(); group.name = "module:wave";
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const glowMat = () => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffffff, emissiveIntensity: 2.4, userData: { glow: true } });

  // ---- source carrier: laser head, or a lamp housing (discharge tube / white bulb) with a collimating slit
  const src = carrier("wave:source"); group.add(src);
  const laser = new THREE.Group(); src.add(laser);
  const lbody = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 32), MATERIALS.anod); lbody.rotation.z = Math.PI / 2; lbody.position.set(-0.045, AXIS_Y, 0); laser.add(lbody);
  const lcap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.012, 32), MATERIALS.alu); lcap.rotation.z = Math.PI / 2; lcap.position.set(0.021, AXIS_Y, 0); laser.add(lcap);
  const ldot = new THREE.Mesh(new THREE.CircleGeometry(0.0022, 20), glowMat()); ldot.rotation.y = Math.PI / 2; ldot.position.set(0.0275, AXIS_Y, 0); laser.add(ldot);
  const lamp = new THREE.Group(); src.add(lamp);
  const lhouse = box(0.07, 0.11, 0.07, MATERIALS.black); lhouse.position.set(-0.02, AXIS_Y + 0.01, 0); lamp.add(lhouse);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 16), glowMat()); tube.position.set(-0.02, AXIS_Y + 0.01, 0.0362); lamp.add(tube);   // seen through the side window
  const window_ = box(0.012, 0.09, 0.001, new THREE.MeshPhysicalMaterial({ color: 0x223344, transparent: true, opacity: 0.25, roughness: 0.1 })); window_.position.set(-0.02, AXIS_Y + 0.01, 0.0352); lamp.add(window_);
  const lslit = box(0.001, 0.012, 0.002, glowMat()); lslit.position.set(0.0155, AXIS_Y, 0); lamp.add(lslit);
  // ---- slide holder
  const hold = carrier("wave:holder"); group.add(hold);
  const hframe = box(0.008, 0.09, 0.09, MATERIALS.black); hframe.position.set(0, AXIS_Y, 0); hold.add(hframe);
  const slideMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.5 });
  const slidePlate = box(0.002, 0.05, 0.05, slideMat); slidePlate.position.set(-0.005, AXIS_Y, 0); hold.add(slidePlate);
  const slideTag = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.012), new THREE.MeshBasicMaterial({ transparent: true })); slideTag.rotation.y = -Math.PI / 2; slideTag.position.set(-0.0062, AXIS_Y - 0.032, 0); hold.add(slideTag);
  // ---- rail screen: white card + ruler
  const scr = carrier("wave:screen", 0.019); group.add(scr);
  const sframe = box(0.012, 0.19, 0.19, MATERIALS.black); sframe.position.set(0.007, AXIS_Y + 0.01, 0); scr.add(sframe);
  const cardPat = new WavePattern(renderer, CARD_CM, CARD_CM, 2048);
  const cardMat = new THREE.MeshStandardMaterial({ color: 0xc9c9c3, roughness: 0.92, emissive: 0xffffff, emissiveMap: cardPat.texture, emissiveIntensity: 1 });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.16), cardMat); card.rotation.y = -Math.PI / 2; card.position.set(-0.0002, AXIS_Y, 0); card.userData.sharedLook = true; scr.add(card);
  // in the glow pass (main.js) the screens show only their light: a laser's spot and fringes glow, the card does not
  const cardGlow = new THREE.MeshBasicMaterial({ map: cardPat.texture }); card.userData.glowAs = cardGlow;
  const cardRule = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.018), new THREE.MeshBasicMaterial({ map: rulerTexture(CARD_CM, 220, 1, 1), transparent: true, toneMapped: false }));
  cardRule.rotation.y = -Math.PI / 2; cardRule.position.set(-0.0005, AXIS_Y - 0.035, 0); scr.add(cardRule);
  // ---- wall board across the room (long L), with its ruler and a tape line from the slide
  const wall = new THREE.Group(); wall.position.set(WALL_X, 0, 0); wall.userData.onWall = true; group.add(wall);
  // (mounted on the room's east wall: the room places the wave bench so that wall is WALL_X from the bench origin)
  const wallPat = new WavePattern(renderer, WALL_W, WALL_H, 4096);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xc9c9c3, roughness: 0.92, emissive: 0xffffff, emissiveMap: wallPat.texture, emissiveIntensity: 1 });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W / 100, WALL_H / 100), wallMat); board.rotation.y = -Math.PI / 2; board.position.set(0, AXIS_Y, 0); board.userData.sharedLook = true; wall.add(board);
  const wallGlow = new THREE.MeshBasicMaterial({ map: wallPat.texture }); board.userData.glowAs = wallGlow;
  const wframe = box(0.02, WALL_H / 100 + 0.03, WALL_W / 100 + 0.03, MATERIALS.black); wframe.position.set(0.012, AXIS_Y, 0); wall.add(wframe);
  const wallRule = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W / 100, 0.06), new THREE.MeshBasicMaterial({ map: rulerTexture(WALL_W, 220, 10, 10), transparent: true, toneMapped: false }));
  wallRule.rotation.y = -Math.PI / 2; wallRule.position.set(-0.001, AXIS_Y - 0.21, 0); wall.add(wallRule);
  const tapeMat = new THREE.MeshBasicMaterial({ color: 0xe8c86a, transparent: true, opacity: 0.8 });
  const tape = new THREE.Mesh(new THREE.BoxGeometry(1, 0.0015, 0.012), tapeMat); wall.add(tape);       // repositioned each frame
  // ---- beam from the source to the slide (a faint glowing line)
  const beamMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, userData: { glow: true } });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(1, 0.0012, 0.0012), beamMat); group.add(beam);
  // ---- slide rack beside the rail
  const rack = new THREE.Group(); rack.position.set(0.12, TABLE_Y, 0.21); group.add(rack);
  const rbase = box(0.34, 0.014, 0.06, MATERIALS.anod); rbase.position.y = 0.007; rack.add(rbase);
  // one texture per tag text, made once and kept (R4): 12 tags in all; redrawing and disposing them on every visit to
  // the bench was churn, and after a GPU reset it disposed textures of the lost context (WebGL warnings)
  const tagCache = new Map(), tagTex = (text) => tagCache.get(text) || tagCache.set(text, tagTex0(text)).get(text);
  const tagTex0 = (text) => { const c = document.createElement("canvas"); c.width = 512; c.height = 96; const g = c.getContext("2d");
    g.fillStyle = "#e6d3a8"; g.font = "600 52px 'Share Tech Mono', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 256, 50);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const rackSlots = [];
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group(); g.position.set(-0.12 + i * 0.08, 0.014, 0); rack.add(g);
    const plate = box(0.06, 0.05, 0.003, slideMat); plate.position.y = 0.03; g.add(plate);
    const frm = box(0.064, 0.054, 0.002, MATERIALS.anod); frm.position.set(0, 0.03, -0.0022); g.add(frm);
    const t = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.011), new THREE.MeshBasicMaterial({ transparent: true })); t.position.set(0, 0.0, 0.031); t.rotation.x = -Math.PI / 2; t.position.y = 0.0005; g.add(t);
    rackSlots.push({ g, plate, t });
  }
  for (const m of [ldot, lslit, tube]) m.userData.sharedLook = true;

  // ---------------------------------------------------------------- state
  const S = { kind: "double", src: 5, hold: 20, screen: 100, source: "red", slide: { single: "s40", double: "d25a4", grating: "g100" }, wall: false, stretch: false,
    custom: false, ca: 40e-6, cd: 250e-6, cN: 200, lab: false };
  const DEFAULTS = JSON.parse(JSON.stringify(S));
  const GAP = 6;
  const LIM = { src: () => [0, S.hold - GAP], hold: () => [S.src + GAP, (S.wall ? 100 : S.screen - GAP)], screen: () => [S.hold + GAP, 100] };
  const setPos = (k, v) => { const [a, b] = LIM[k](); S[k] = Math.round(clamp(v, a, b) * 100) / 100; };
  const slideOf = () => SLIDES[S.kind].find((x) => x.id === S.slide[S.kind]);
  const source = () => SOURCES[S.source];
  const isLaser = () => source().kind === "laser";
  // the effective aperture: the mounted slide, or (EXTENDED) the custom one
  function aperture() {
    const sl = slideOf();
    if (S.custom) { const N = S.kind === "grating" ? S.cN : S.kind === "double" ? 2 : 1; return { a: S.ca, d: S.kind === "single" ? 0 : S.cd, N, W: N * S.cd, tag: "custom" }; }
    const N = S.kind === "grating" ? Math.round((BEAM_W[source().kind] / 100) / sl.d) : S.kind === "double" ? 2 : 1;
    return { a: sl.a, d: sl.d || 0, N, W: BEAM_W[source().kind] / 100, tag: sl.tag };   // W: the lit width (the beam)
  }
  const Lm = () => (S.wall ? WALL_X - cmToX(S.hold) : (S.screen - S.hold) / 100);
  function mountSlide(id) { S.slide[S.kind] = id; $("slideSel").value = id; refreshRack(); }
  function refreshRack() {
    const list = SLIDES[S.kind];
    rackSlots.forEach((r, i) => { const sl = list[i]; r.g.visible = !!sl; if (!sl) return; r.sl = sl;
      if (r.t.material.map !== tagTex(sl.tag)) { r.t.material.map = tagTex(sl.tag); r.t.material.needsUpdate = true; } r.plate.visible = sl.id !== S.slide[S.kind]; });
    { const t = tagTex(S.custom ? "custom" : slideOf().tag); if (slideTag.material.map !== t) { slideTag.material.map = t; slideTag.material.needsUpdate = true; } }
  }
  function setKind(kind) {
    S.kind = kind;
    $("slideSel").innerHTML = SLIDES[kind].map((x) => `<option value="${x.id}">${x.tag}</option>`).join("");
    $("slideSel").value = S.slide[kind];
    $("cdRow").style.display = kind === "single" ? "none" : ""; $("cNRow").style.display = kind === "grating" ? "" : "none";
    refreshRack();
  }
  $("sourceSel").innerHTML = Object.entries(SOURCES).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join("");
  $("sourceSel").addEventListener("change", (e) => { S.source = e.target.value; });
  $("slideSel").addEventListener("change", (e) => mountSlide(e.target.value));
  $("tWall").addEventListener("change", (e) => { S.wall = e.target.checked; setPos("hold", S.hold); });
  $("tStretch").addEventListener("change", (e) => { S.stretch = e.target.checked; });
  // EXTENDED: custom slide
  const cfmt = () => { $("caVal").textContent = `${(S.ca * 1e6).toFixed(0)} µm`; $("cdVal").textContent = `${(S.cd * 1e6).toFixed(0)} µm`; $("cNVal").textContent = `${S.cN}`; };
  $("tCustom").addEventListener("change", (e) => { S.custom = e.target.checked; $("customRows").style.display = S.custom ? "" : "none"; $("slideSel").disabled = S.custom;
    refreshRack(); });
  $("ca").addEventListener("input", (e) => { S.ca = +e.target.value * 1e-6; cfmt(); });
  $("cd").addEventListener("input", (e) => { S.cd = +e.target.value * 1e-6; cfmt(); });
  $("cN").addEventListener("input", (e) => { S.cN = +e.target.value; cfmt(); });
  cfmt();

  // ---------------------------------------------------------------- per frame
  let patKey = "";
  function frame() {
    src.position.x = cmToX(S.src); hold.position.x = cmToX(S.hold); scr.position.x = cmToX(S.screen);
    scr.visible = !S.wall; tape.visible = S.wall;
    const L = isLaser(), srcS = source();
    laser.visible = L; lamp.visible = !L;
    const col = srcS.lines.reduce((c, l) => { const r = wavelengthRGB(l.w); return c.map((x, i) => x + r[i] * l.I); }, [0, 0, 0]), mx = Math.max(...col) || 1;
    for (const m of [ldot.material, tube.material, lslit.material]) m.emissive.setRGB(col[0] / mx, col[1] / mx, col[2] / mx);
    beamMat.color.setRGB(col[0] / mx * 1.6, col[1] / mx * 1.6, col[2] / mx * 1.6); beam.visible = L;   // only a laser beam is seen in the air
    const x0 = cmToX(S.src) + 0.028, x1 = cmToX(S.hold) - 0.006; beam.position.set((x0 + x1) / 2, AXIS_Y, 0); beam.scale.set(Math.max(0.001, x1 - x0), 1, 1);
    if (S.wall) { const xa = cmToX(S.hold), xb = WALL_X; tape.position.set((xa + xb) / 2 - WALL_X, RAIL_TOP - 0.03, 0.06); tape.scale.set(xb - xa, 1, 1); }
    const ap = aperture(), lines = srcS.lines;
    const p = { kind: S.kind, a: ap.a, d: ap.d, N: ap.N, W: ap.W, L: Lm(), lines, rgbOf: wavelengthRGB, laser: L, stretch: S.stretch };
    (S.wall ? wallPat : cardPat).draw(p);
    // brightness: a laser is bright and spreads little; lamps are dimmer; the far wall gets less light per area
    // laser spots are bright enough to glow (a real laser dot is easy to see across a room); lamp spectra are dimmer
    const bright = L ? (S.wall ? 3.0 : S.kind === "grating" ? 2.0 : 1.0) : (S.wall ? 1.4 : 1.0);
    cardMat.emissiveIntensity = wallMat.emissiveIntensity = bright;
    cardGlow.color.setScalar(L ? 0.6 * bright : 0); wallGlow.color.setScalar(L ? 0.6 * bright : 0);   // lamp spectra: no glow
  }
  function warm() { cardPat.draw({ kind: "double", a: 4e-5, d: 2.5e-4, N: 2, L: 1, lines: SOURCES.red.lines, rgbOf: wavelengthRGB, laser: true, stretch: false });
    wallPat.draw({ kind: "double", a: 4e-5, d: 2.5e-4, N: 2, L: 2, lines: SOURCES.red.lines, rgbOf: wavelengthRGB, laser: true, stretch: false }); frame(); }

  // ---------------------------------------------------------------- views, controls, labels
  const views = {
    overview: () => [[0.30, 1.42, 1.30], [0.10, 1.0, 0.0], [1.30, 0.42]],
    screen: () => { const x = cmToX(S.screen); return [[x - 0.32, AXIS_Y + 0.05, 0.26], [x, AXIS_Y, 0], [0.24, 0.22]]; },
    screenClose: () => { const x = cmToX(S.screen); return [[x - 0.18, AXIS_Y + 0.0, 0.03], [x, AXIS_Y - 0.01, 0], [0.09, 0.07]]; },
    wall: () => [[WALL_X - 1.1, AXIS_Y + 0.12, 0.35], [WALL_X, AXIS_Y - 0.05, 0], [2.5, 0.75]],
    wallClose: () => [[WALL_X - 0.45, AXIS_Y + 0.0, 0.05], [WALL_X, AXIS_Y - 0.08, 0], [0.5, 0.3]],
    slide: () => { const x = cmToX(S.hold); return [[x - 0.14, AXIS_Y + 0.05, 0.16], [x, AXIS_Y - 0.01, 0], [0.12, 0.12]]; },
    source: () => { const x = cmToX(S.src); return [[x + 0.2, AXIS_Y + 0.06, 0.2], [x - 0.02, AXIS_Y - 0.01, 0], [0.16, 0.14]]; },
    rack: () => [[0.12, 1.12, 0.58], [0.12, 0.94, 0.21], [0.36, 0.12]],
  };
  const viewNames = { overview: "Bench overview", screen: "Screen", screenClose: "Screen close-up", wall: "Wall screen", wallClose: "Wall close-up", slide: "Slide holder", source: "Source", rack: "Slide rack" };
  const describePos = (k, what) => () => `Rail reading <b>${S[k].toFixed(1)} cm</b> · ${what}<br>drag along the rail · scroll = 1 mm (Shift: 1 cm)`;
  const registry = [
    { id: "wave:source", name: "Source", objects: [src], kind: "slide", axis: new THREE.Vector3(1, 0, 0), worldPerUnit: 0.01, get: () => S.src, set: (v) => setPos("src", v), describe: () => describePos("src", source().name)() },
    { id: "wave:holder", name: "Slide holder", objects: [hold], kind: "slide", axis: new THREE.Vector3(1, 0, 0), worldPerUnit: 0.01, get: () => S.hold, set: (v) => setPos("hold", v), describe: () => describePos("hold", S.custom ? "custom slide" : slideOf().tag)() },
    { id: "wave:screen", name: "Screen", objects: [scr], kind: "slide", axis: new THREE.Vector3(1, 0, 0), worldPerUnit: 0.01, get: () => S.screen, set: (v) => setPos("screen", v), describe: describePos("screen", "white card with a mm ruler") },
    ...rackSlots.map((r, i) => ({ id: "wave:rack:" + i, name: "Slide", objects: [r.g], kind: "click", click: () => { if (r.sl) mountSlide(r.sl.id); },
      describe: () => (!r.sl ? "" : S.slide[S.kind] === r.sl.id ? `${r.sl.tag} · in the holder` : `${r.sl.tag} · click to put it in the holder`) })),
  ];
  const labels = [
    { text: "source", obj: src, off: [-0.02, AXIS_Y + 0.07, 0], prio: 3 },
    { text: "slide holder", obj: hold, off: [0, AXIS_Y + 0.05, 0], prio: 3 },
    { text: "screen + ruler", obj: scr, off: [0.007, AXIS_Y + 0.105, 0], prio: 3, when: () => !S.wall },
    { text: "slide rack", obj: rack, off: [0.17, 0.014, 0.03], prio: 1 },
    { text: "wall screen", obj: wall, off: [0, AXIS_Y + 0.33, 0], prio: 2, when: () => S.wall },
    { text: "tape: L", obj: tape, off: [0, 0.01, 0], prio: 2, when: () => S.wall },
  ];

  // ---------------------------------------------------------------- readouts
  function text(kind) {
    const ap = aperture(), L = Lm(), srcS = source(), dom = srcS.lines.reduce((b, l) => (l.I > b.I ? l : b)), lam = dom.w, h = S.lab;
    const c = (cls, sym, val, hide = false) => `<div class="chip ${cls}${hide ? " hide" : ""}">${sym} = <b>${val}</b></div>`;
    const rc = (name, x) => `<div class="chip c-x" title="rail reading, cm">${name} <b>${x.toFixed(1)}</b></div>`;
    let chips = c("c-f", "<i>λ</i>", srcS.kind === "laser" ? `${lam} nm` : `${srcS.name.split(" ")[0]} (${lam} nm)`) + c("c-p", "<i>L</i>", `${L.toFixed(3)} m${S.wall ? " (tape)" : ""}`);
    if (kind !== "grating") chips += c("c-x", "<i>a</i>", `${(ap.a * 1e3).toFixed(3)} mm`);
    if (kind !== "single") chips += c("c-x", "<i>d</i>", kind === "grating" ? `${(ap.d * 1e6).toFixed(2)} µm (${(1e-3 / ap.d).toFixed(0)}/mm)` : `${(ap.d * 1e3).toFixed(2)} mm`);
    if (kind === "grating") chips += c("c-x", "<i>N</i> lit", `${ap.N}`);
    let msg;
    if (kind === "double") {
      const y1 = orderY(ap.d, 1, lam, L), env = singleMinY(ap.a, 1, lam, L);
      chips += c("c-t", "Δ<i>y</i>", `${(y1 * 1000).toFixed(2)} mm`, h) + c("c-g", "fringes in centre", `${Math.round(2 * ap.d / ap.a) - 1}`, h);
      msg = h ? "Computed values hidden. Measure the fringe spacing on the ruler." : `Bright fringes every <b>${(y1 * 1000).toFixed(2)} mm</b> (Δy ≈ λL/d), inside the single-slit envelope whose first zeros are ±${(env * 1000).toFixed(1)} mm (a sin θ = λ): ${Math.round(2 * ap.d / ap.a) - 1} fringes fit in the centre.`;
    } else if (kind === "single") {
      const y1 = singleMinY(ap.a, 1, lam, L);
      chips += c("c-t", "<i>y</i><sub>1</sub> (dark)", `${(y1 * 1000).toFixed(2)} mm`, h) + c("c-g", "centre width", `${(2 * y1 * 1000).toFixed(1)} mm`, h);
      msg = h ? "Computed values hidden. Measure the width of the central bright band on the ruler." : `First dark fringes at ±<b>${(y1 * 1000).toFixed(2)} mm</b> (a sin θ = λ): the central band is ${(2 * y1 * 1000).toFixed(1)} mm wide. A narrower slit spreads the light wider.`;
    } else {
      const y1 = orderY(ap.d, 1, lam, L), th = Math.asin(lam * 1e-9 / ap.d) * 180 / Math.PI, half = (S.wall ? WALL_W : CARD_CM) / 200;
      chips += c("c-t", "<i>θ</i><sub>1</sub>", `${th.toFixed(2)}°`, h) + c("c-g", "<i>y</i><sub>1</sub>", y1 === null ? "—" : `${(y1 * 100).toFixed(2)} cm`, h);
      msg = h ? "Computed values hidden. Measure where the first order lands, and L, then use d sin θ = mλ." : y1 !== null && y1 > half ? `The first order lands ${(y1 * 100).toFixed(1)} cm out, off this screen: bring the screen closer${S.wall ? "" : " or use the wall screen"}.` :
        `d sin θ = mλ: the first order at <b>${th.toFixed(2)}°</b>, ${(y1 * 100).toFixed(2)} cm from the centre. ${ap.N > 12 ? `${ap.N} slits are lit, so each order arrives as a spot about the size of the beam.` : `Only ${ap.N} slits lit: broad orders with ${ap.N - 2} faint maxima between them.`}${srcS.kind !== "laser" ? " Each spectral line lands at its own angle: the tube's spectrum." : ""}`;
    }
    setText({ rail: rc("source", S.src) + rc("slide", S.hold) + (S.wall ? `<div class="chip c-x">wall <b>tape</b></div>` : rc("screen", S.screen)), chips, status: msg,
      mode: `${S.custom ? "custom slide" : slideOf().tag} · ${srcS.name}` + (h ? " · lab mode" : "") });
  }
  function reset() { Object.assign(S, JSON.parse(JSON.stringify(DEFAULTS))); S.kind = cur; for (const id of ["tWall", "tStretch", "tCustom"]) $(id).checked = false;
    $("customRows").style.display = "none"; $("slideSel").disabled = false; $("sourceSel").value = S.source; setKind(cur); }

  let cur = "double";
  const mk = (kind) => ({
    id: kind, name: KIND_NAME[kind], group: "Wave optics", scope: `Wave optics · ${KIND_NAME[kind]}`,
    station: "wave", root: group, views, viewNames, defaultView: "overview", registry, labels, panel: "wave",
    enter: () => { cur = kind; setKind(kind); }, frame, text: () => text(kind), warm, reset, setLab: (on) => { S.lab = on; },
    onContextRestored: () => { cardPat.key = wallPat.key = ""; },   // render targets lost: repaint on the next draw (R4)
    focus: [[card, "screenClose"], [board, "wallClose"], [hframe, "slide"], [rbase, "rack"]],
    api: { S, setPos, mountSlide, setKind, aperture, Lm, cardPat, wallPat, card, board, hold, scr, src, rackSlots },
  });
  setKind("double");
  return [mk("double"), mk("single"), mk("grating")];
}
