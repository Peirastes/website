// MODULE: Thin lens. Light box with the arrow, a lens and a screen on the rail; real-singlet or ideal lens; rays;
// iris (EXTENDED). Physics: ../../../physics/lens.mjs. Everything here was main.js before the module split (W0a).
// Exp 213 (2026-10-11, Cole's picks): a DISTANT object for Method 1 (a lit arrow on the far wall, f ~ d_i); a mm ruler
// on the card, 0 on the axis, for h_i; the light box's height knob, and in lab mode the arrow starts 2 mm off the axis.
import * as THREE from "three";
import { makeLens, buildLensKit, MATERIALS, LENSES, APERTURE, H_OBJ, cmToX, AXIS_Y, RAIL_TOP, RAIL, arrowMesh } from "../bench.js";
import { STATIONS } from "../stations.js";
import { ROOM } from "../room.js";
import { ScreenImage } from "../screenimage.js";
import { Rays } from "../rays.js";
import { benchState, blurAt, fieldFocus, zoneMap, saCoefficient, N_GLASS } from "../../physics/lens.mjs";

export function createLensModule({ renderer, stations, $, clamp, setText }) {
  const group = new THREE.Group(); group.name = "module:lens";
  const { P } = buildLensKit(), rail = stations.lens.rail;                  // the kit is this module's; the rail is the lens bench's
  for (const o of [P.object, P.lens, P.screen, P.tray]) group.add(o);

  // the screen's picture: GPU-painted from the physics, as the card's emissive map (projected light)
  const screenImg = new ScreenImage(renderer);
  MATERIALS.card.emissiveMap = screenImg.texture; MATERIALS.card.needsUpdate = true;
  P.card.userData.sharedLook = true;
  const rays = new Rays(group);
  let raysKey = "";

  // ---------------------------------------------------------------- state (cm) + physics
  const DEFAULTS = { obj: 10.0, lens: 40.0, screen: 85.0, lensId: "c15", y0: 0, far: false };
  const S = { ...DEFAULTS, lab: false, ideal: false, iris: false, D: APERTURE };   // iris + D: EXTENDED feature (see setIris)
  // ---- Exp 213: the distant object, a lit arrow FAR_K x the light box's (20 cm tall) on the room's west wall, on the
  // rail's axis. Placed from the station's design position, so it keeps its place (station-local) wherever the station is.
  const FAR_K = 5, LAB_Y0 = 0.2, Y0_MAX = 0.5;                  // far arrow size factor; lab mode's starting offset (cm)
  const FAR_X = ROOM.x0 + 0.025 - STATIONS.find((d) => d.id === "lens").origin[0];   // its face, station-local x (m)
  const FAR_CM = Math.round((FAR_X - RAIL.x0) * 1000) / 10;      // ... as a rail reading (cm, far below 0)
  const far = new THREE.Group(); far.name = "lens:far"; far.userData.onWall = true; group.add(far);
  const farBoard = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.34, 0.30), MATERIALS.black); farBoard.position.set(FAR_X - 0.011, AXIS_Y + 0.09, 0); farBoard.name = "far:board"; far.add(farBoard);
  const farMat = MATERIALS.glow.clone(), farArrow = arrowMesh(farMat); farArrow.scale.setScalar(FAR_K); farArrow.position.set(FAR_X + 0.0004, AXIS_Y, 0); far.add(farArrow);
  const k = () => (S.far ? FAR_K : 1), yOff = () => (S.far ? 0 : S.y0), xObj = () => (S.far ? FAR_CM : S.obj);
  function setY0(v) { S.y0 = Math.round(clamp(v, -Y0_MAX, Y0_MAX) * 1000) / 1000; }
  function setFar(on) { S.far = on; $("tFar").checked = on; setPos("lens", S.lens); }   // back on the light box: the lens keeps its gap
  const R_EDGE = 3.8, R_CENTRE = 0.3;                       // object radii (cm) read out as the arrow's "tip" and "base" (light box)
  const rTip = () => Math.abs(yOff() + k() * R_EDGE), rBase = () => Math.abs(yOff() + k() * R_CENTRE);   // ... for the object as it sits
  const GAP = 4.0;                                          // carriers cannot come closer than this (cm)
  const lensOf = (id) => LENSES.find((L) => L.id === id);
  const LIMITS = { obj: () => [0, S.lens - GAP], lens: () => [S.far ? 0 : S.obj + GAP, S.screen - GAP], screen: () => [S.lens + GAP, 100] };
  function setPos(id, v) { const [a, b] = LIMITS[id](); S[id] = Math.round(clamp(v, a, b) * 100) / 100; }
  const st = () => benchState({ xObj: xObj(), xLens: S.lens, xScreen: S.screen, f: lensOf(S.lensId).f, D: S.D, hO: H_OBJ * k() });
  // blur (cm) on the screen for an object point at radius r: the lens model lives in physics/lens.mjs
  function blurFn() {
    const f = lensOf(S.lensId).f, dO = S.lens - xObj(), s = S.screen - S.lens, ideal = S.ideal;
    const D = S.D, fn = (r) => blurAt(D, f, dO, s, r, ideal);
    fn.uniform = ideal; fn.D = D; fn.zone = ideal ? null : (r) => zoneMap(D, f, dO, s, r, false);
    fn.ideal = ideal; fn.f = f; fn.A = saCoefficient(f, dO); fn.n = N_GLASS;      // what the GPU painter needs
    fn.y0 = yOff(); fn.k = k();
    return fn;
  }
  let mountedMesh = null;
  function mount(id) {
    S.lensId = id; $("lensSel").value = id;
    if (mountedMesh) { P.glassMount.remove(mountedMesh); mountedMesh.geometry.dispose(); }
    mountedMesh = makeLens(lensOf(id).f); mountedMesh.userData.sharedLook = true; P.glassMount.add(mountedMesh);
    for (const t of P.traySlots) t.lensMesh.visible = t.L.id !== id;   // the mounted lens leaves its slot empty
  }
  $("lensSel").innerHTML = LENSES.map((L) => `<option value="${L.id}">f = ${L.tag} ${L.f > 0 ? "conv." : "div."}</option>`).join("");
  mount(S.lensId);

  // ---------------------------------------------------------------- EXTENDED FEATURE: iris diaphragm
  // An adjustable aperture stop at the lens: SA blur ~ D^3, defocus blur ~ D, brightness ~ D^2. Off by default (D = 4.0 cm,
  // the lens's full clear aperture). It is an exploration extra: a guided lab procedure must NOT rely on it.
  const D_MIN = 0.5, IRIS_PER_RAD = (APERTURE - D_MIN) / (2 * Math.PI / 3);   // lever sweeps 120 deg from open to D_MIN
  function setAperture(D) {
    S.D = Math.round(clamp(D, D_MIN, APERTURE) * 100) / 100; $("irisD").value = S.D; $("irisVal").textContent = `${S.D.toFixed(2)} cm · f/${(Math.abs(lensOf(S.lensId).f) / S.D).toFixed(1)}`;
    P.irisBlades.geometry.dispose(); P.irisBlades.geometry = new THREE.RingGeometry(S.D / 200, 0.0305, 64);
    P.irisLever.rotation.x = -((APERTURE - S.D) / IRIS_PER_RAD) + Math.PI / 3;   // open = lever 60 deg one side, closed = 60 deg the other
  }
  function setIris(on) {
    S.iris = on; $("tIris").checked = on; P.iris.visible = on; $("irisRow").style.display = on ? "" : "none";
    if (!on) setAperture(APERTURE);                                                  // removing the iris restores the full lens
  }
  $("tIris").addEventListener("change", (e) => setIris(e.target.checked));
  $("irisD").addEventListener("input", (e) => setAperture(+e.target.value));
  setAperture(APERTURE); setIris(false);
  $("lensSel").addEventListener("change", (e) => mount(e.target.value));
  $("modelSel").addEventListener("change", (e) => { S.ideal = e.target.value === "ideal"; });
  $("tFar").addEventListener("change", (e) => setFar(e.target.checked));
  for (const [id, k] of [["tRays", "principal"], ["tCone", "cone"], ["tFocal", "focal"], ["tGhost", "ghost"]]) $(id).addEventListener("change", (e) => { rays.show[k] = e.target.checked; });

  // ---------------------------------------------------------------- camera views (follow the carriers)
  const views = {
    overview: () => [[0.30, 1.42, 1.30], [0.0, 1.0, 0.0], [1.20, 0.42]],
    screen: () => { const x = cmToX(S.screen); return [[x - 0.32, AXIS_Y + 0.05, 0.26], [x, AXIS_Y, 0], [0.24, 0.22]]; },
    screenClose: () => { const x = cmToX(S.screen); return [[x - 0.20, AXIS_Y + 0.01, 0.06], [x, AXIS_Y, 0], [0.075, 0.075]]; },
    rail: () => { const x = cmToX(S.lens); return [[x + 0.03, RAIL_TOP + 0.07, 0.24], [x, RAIL_TOP - 0.01, 0.03], [0.16, 0.08]]; },
    lens: () => { const x = cmToX(S.lens); return [[x + 0.16, AXIS_Y + 0.06, 0.24], [x, AXIS_Y - 0.03, 0], [0.16, 0.18]]; },
    object: () => { const x = cmToX(S.obj); return [[x + 0.26, AXIS_Y + 0.06, 0.22], [x, AXIS_Y - 0.02, 0], [0.18, 0.18]]; },
    tray: () => [[0.14, 1.12, 0.62], [0.14, 0.93, 0.22], [0.34, 0.12]],
    far: () => [[-0.9, AXIS_Y + 0.25, 0.55], [FAR_X, AXIS_Y + 0.09, 0], [0.5, 0.42]],
  };
  const viewNames = { overview: "Bench overview", screen: "Screen", screenClose: "Screen close-up", rail: "Rail scale at the lens", lens: "Lens", object: "Light box", tray: "Lens tray", far: "Distant object (far wall)" };

  // ---------------------------------------------------------------- controls
  const KNOB_STEP = (2 * Math.PI) / 50;                     // rad per 0.1 mm (5 mm a turn)
  const describePos = (id, what) => () => `Rail reading <b>${S[id].toFixed(1)} cm</b> · ${what}<br>drag along the rail · scroll = 1 mm (Shift: 1 cm)`;
  const registry = [
    { id: "object", name: "Light box (object)", objects: [P.object], kind: "slide", axis: new THREE.Vector3(1, 0, 0), worldPerUnit: 0.01,
      get: () => S.obj, set: (v) => setPos("obj", v), describe: describePos("obj", "illuminated arrow, tip 4.0 cm above the axis") },
    { id: "lens", name: "Lens holder", objects: [P.lens], kind: "slide", axis: new THREE.Vector3(1, 0, 0), worldPerUnit: 0.01,
      get: () => S.lens, set: (v) => setPos("lens", v), describe: () => describePos("lens", `${lensOf(S.lensId).f > 0 ? "converging" : "diverging"} lens, f = ${lensOf(S.lensId).tag}`)() },
    { id: "screen", name: "Screen", objects: [P.screen], kind: "slide", axis: new THREE.Vector3(1, 0, 0), worldPerUnit: 0.01,
      get: () => S.screen, set: (v) => setPos("screen", v), describe: describePos("screen", "white card") },
    // Exp 213: the light box's height knob (5 mm a turn; a wheel notch 0.1 mm, Shift 1 mm)
    { id: "objHeight", name: "Light-box height knob", objects: [P.objKnob], centre: P.objKnob, kind: "rotary", wheelStep: KNOB_STEP, wheelStepShift: KNOB_STEP * 10,
      rotate: (d) => setY0(S.y0 + (d / KNOB_STEP) * 0.01),
      describe: () => (S.lab ? "Raises or lowers the arrow" : `Arrow base <b>${(S.y0 * 10).toFixed(1)} mm</b> ${S.y0 >= 0 ? "above" : "below"} the axis`) + "<br>drag around the knob, or scroll: 0.1 mm a notch (Shift 1 mm)" },
    // EXTENDED: iris lever, rotary (only reachable while the iris is mounted)
    { id: "iris", name: "Iris diaphragm", objects: [P.irisLever, P.irisBlades], centre: P.iris, kind: "rotary",
      rotate: (d) => setAperture(S.D - d * IRIS_PER_RAD), describe: () => `Clear aperture <b>D = ${S.D.toFixed(1)} cm</b> · f/${(Math.abs(lensOf(S.lensId).f) / S.D).toFixed(1)}<br>drag the lever around the ring, or scroll` },
    ...P.traySlots.map((t) => ({ id: "tray:" + t.L.id, name: `Lens ${t.L.tag}`, objects: [t.slot], kind: "click",
      click: () => mount(t.L.id), describe: () => (S.lensId === t.L.id ? "mounted on the rail" : `${t.L.f > 0 ? "converging" : "diverging"} · click to mount it`) })),
  ];
  const labels = [
    { text: "light box · object", obj: P.object, off: [-0.026, AXIS_Y + 0.05, 0], prio: 3 },
    { text: "lens", obj: P.lens, off: [0, AXIS_Y + 0.035, 0], prio: 3 },
    { text: "screen", obj: P.screen, off: [0.007, AXIS_Y + 0.105, 0], prio: 3 },
    { text: "rail scale (cm)", obj: rail.scale, off: [0.42, 0, 0], prio: 2 },
    { text: "lens tray", obj: P.tray, off: [0.15, 0.016, 0.035], prio: 1 },
    { text: "height knob", obj: P.objKnob, off: [0, -0.012, 0.01], prio: 1, when: () => !S.far },
    { text: "ruler (cm, 0 on the axis)", obj: P.ruler, off: [0, 0.098, 0], prio: 1 },
    { text: "distant object · 20 cm arrow", obj: far, off: [FAR_X + 0.01, AXIS_Y + 0.27, 0], prio: 2 },
    { text: "F", obj: rays.F, prio: 2, when: () => rays.F.visible },
    { text: "F′", obj: rays.Fp, prio: 2, when: () => rays.Fp.visible },
    { text: "image", obj: rays.imgMark, prio: 2, when: () => rays.imgMark.visible },
    { text: "virtual image", obj: rays.ghost.children[0], prio: 2, when: () => rays.ghost.visible },
  ];

  // ---------------------------------------------------------------- readouts
  const SHARP = 0.02;     // cm: about what an eye resolves on a card ~25 cm away (~1 arcmin)
  const fmt = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "∞");
  let bestKey = "", bestVal = null, focusWord = "";
  // best focus (screen distance s from the lens, cm) and its blur, for the base and the tip of the arrow;
  // recomputed only when the light box, lens or lens model changes
  function bestFocus() {
    const f = lensOf(S.lensId).f, dO = S.lens - xObj(), key = `${f}|${dO}|${S.ideal}|${S.D}|${rBase()}|${rTip()}`;
    if (key === bestKey) return bestVal;
    const scan = (r) => { let best = { s: NaN, b: Infinity };
      for (let s = GAP; s <= 100 - S.lens + 40; s += 0.02) { const b = blurAt(S.D, f, dO, s, r, S.ideal); if (b < best.b) best = { s, b }; } return best; };
    bestKey = key; bestVal = { c: scan(rBase()), e: scan(rTip()) };
    return bestVal;
  }
  function text() {
    const s = st(), bf = blurFn(), L = lensOf(S.lensId), h = S.lab;
    const c = (cls, sym, val, hide = false) => `<div class="chip ${cls}${hide ? " hide" : ""}">${sym} = <b>${val}</b></div>`;
    const rc = (name, x) => `<div class="chip c-x" title="rail reading, cm">${name} <b>${x.toFixed(1)}</b></div>`;
    const chips = c("c-f", "<i>f</i>", `${L.f > 0 ? "+" : "−"}${Math.abs(L.f).toFixed(1)} cm`) + c("c-p", "<i>d</i><sub>o</sub>", `${s.dO.toFixed(1)} cm`, h) + c("c-p", "<i>s</i>", `${s.s.toFixed(1)} cm`, h) +
      c("c-t", "<i>d</i><sub>i</sub>", `${fmt(s.dI)} cm`, h) + c("c-t", "<i>M</i>", Number.isFinite(s.M) ? s.M.toFixed(2) : "∞", h) +
      (S.iris ? c("c-f", "<i>D</i>", `${S.D.toFixed(2)} cm · f/${(Math.abs(L.f) / S.D).toFixed(1)}`) : "") +
      c("c-e", "<i>h</i><sub>i</sub>", `${fmt(s.hI)} cm`, h) + c("c-g", "<i>b</i> base", `${fmt(bf(rBase()), 2)} cm`, h) + c("c-g", "<i>b</i> tip", `${fmt(bf(rTip()), 2)} cm`, h) +
      (!S.far && S.y0 !== 0 ? c("c-e", "arrow base", `${(S.y0 * 10).toFixed(1)} mm ${S.y0 > 0 ? "above" : "below"} the axis`, h) : "");
    let msg;
    const farNote = S.far && s.real && Number.isFinite(s.dI) ? ` <b>Distant object</b> ${(s.dO / 100).toFixed(2)} m away: the image forms at d<sub>i</sub> = ${s.dI.toFixed(2)} cm, ${((s.dI / L.f - 1) * 100).toFixed(1)} % beyond f. That is the error in taking f ≈ d<sub>i</sub>.` : "";
    const offNote = !S.far && S.y0 !== 0 && Number.isFinite(s.M) ? ` The arrow's base sits ${(Math.abs(S.y0) * 10).toFixed(1)} mm ${S.y0 > 0 ? "above" : "below"} the axis, so its image's base reads ${(s.M * S.y0).toFixed(2)} cm on the ruler, not 0.` : "";
    if (h) msg = "Computed values hidden.";
    else if (!Number.isFinite(s.dI)) msg = "Object at the focal point: the light leaves the lens parallel and the image is at infinity. Nothing focuses on the screen.";
    else if (!s.real) msg = `<b>Virtual image</b> ${Math.abs(s.dI).toFixed(1)} cm on the light-box side of the lens: no screen position can show it. Look back through the lens instead.`;
    else if (S.ideal) msg = s.blur < SHARP ? `<b>Sharp.</b> The screen sits at the image: s = d<sub>i</sub>. Inverted, ${Math.abs(s.M) >= 1 ? "magnified" : "reduced"} ×${Math.abs(s.M).toFixed(2)}.`
      : `Real image at <b>${(S.lens + s.dI).toFixed(1)} cm</b> on the rail; the screen is ${Math.abs(s.focusError).toFixed(1)} cm ${s.focusError > 0 ? "beyond" : "short of"} it, so each point spreads into a ${s.blur.toFixed(2)} cm disc.`;
    else {
      // real singlet: judge each region against ITS OWN best focus (with spherical aberration nothing reaches a point)
      const bc = bf(rBase()), be = bf(rTip()), B = bestFocus();
      const cOk = bc <= B.c.b * 1.15 + 0.002, eOk = be <= B.e.b * 1.15 + 0.002;
      const haze = B.c.b > SHARP ? ` Even at its best the base keeps a ${(B.c.b * 10).toFixed(1)} mm haze: spherical aberration (the outer zones of the lens focus nearer).` : "";
      msg = cOk && eOk ? `<b>Best focus along the whole arrow</b> (b = ${bc.toFixed(2)} / ${be.toFixed(2)} cm).${haze}`
        : cOk ? `<b>Base at its best, tip soft</b> (b = ${bc.toFixed(2)} / ${be.toFixed(2)} cm). The sharp image lies on a curved surface: the tip, far from the axis, focuses nearer the lens, at ${(S.lens + B.e.s).toFixed(1)} cm.${haze}`
        : eOk ? `<b>Tip at its best, base soft</b> (b = ${be.toFixed(2)} / ${bc.toFixed(2)} cm). The base, on the axis, focuses farther out, at ${(S.lens + B.c.s).toFixed(1)} cm. Astigmatism keeps a little blur at the tip even here.`
        : `Blurred (b = ${bc.toFixed(2)} cm base, ${be.toFixed(2)} cm tip). Best focus: base at <b>${(S.lens + B.c.s).toFixed(1)} cm</b>, tip at <b>${(S.lens + B.e.s).toFixed(1)} cm</b> on the rail.`;
      focusWord = cOk && eOk ? " · best focus" : cOk ? " · base best" : eOk ? " · tip best" : " · image blurred";
    }
    if (!h) msg += farNote + offNote;
    setText({ rail: (S.far ? '<div class="chip c-x" title="the object: a lit arrow on the far wall">object <b>far wall</b></div>' : rc("box", S.obj)) + rc("lens", S.lens) + rc("screen", S.screen), chips, status: msg,
      mode: `${L.f > 0 ? "converging" : "diverging"} f = ${L.tag}` + (h ? " · lab" : !Number.isFinite(s.dI) ? " · image at infinity" : !s.real ? " · virtual image"
        : S.ideal ? (s.blur < SHARP ? " · image sharp" : " · image blurred") : focusWord) });
  }

  // ---------------------------------------------------------------- per frame (only while active)
  function frame() {
    P.object.position.x = cmToX(S.obj); P.lens.position.x = cmToX(S.lens); P.screen.position.x = cmToX(S.screen);
    P.object.visible = !S.far;                                       // the distant object: the light box is off the rail
    P.objHead.position.y = S.y0 / 100; P.objKnob.rotation.z = -(S.y0 / 0.01) * KNOB_STEP;
    farMat.emissiveIntensity = S.far ? MATERIALS.glow.emissiveIntensity : 0.0;
    const s = st(), bf = blurFn();
    screenImg.draw(s, bf);
    const rk = `${S.obj}|${S.lens}|${S.screen}|${S.lensId}|${S.lab}|${S.ideal}|${S.D}|${S.far}|${S.y0}|${Object.values(rays.show).join()}`;
    if (rk !== raysKey) { raysKey = rk; rays.update(rayS(), lensOf(S.lensId).f, S.D, s, S.lab, S.ideal ? null : (r, rho) => { const f = lensOf(S.lensId).f; return 1 / (1 / fieldFocus(f, s.dO, r).zm + saCoefficient(f, s.dO) * rho * rho); }); }
    MATERIALS.card.emissiveIntensity = clamp(0.8 * s.E, 0.03, 0.95);   // keep a normal picture below white + the bloom threshold: clipping and glow hide the blur
  }
  const rayS = () => ({ ...S, obj: xObj(), y0: yOff(), k: k() });     // the object as the rays see it
  function warm() { rays.update(rayS(), lensOf(S.lensId).f, S.D, st(), S.lab, null); screenImg.draw(st(), blurFn()); }
  function reset() { Object.assign(S, DEFAULTS); S.y0 = S.lab ? LAB_Y0 : 0; setFar(false); mount(S.lensId); setIris(false); }
  // Exp 213: switching lab mode ON sets the arrow LAB_Y0 off the axis (the student finds it from the ruler and turns the
  // knob); switching it off leaves the arrow where the student put it
  function setLab(on) { if (on && !S.lab) S.y0 = LAB_Y0; S.lab = on; for (const id of ["tRays", "tCone", "tFocal", "tGhost"]) $(id).disabled = on; }

  return {
    id: "lens", name: "Thin lens", group: "Geometric optics", scope: "Geometric optics · Thin lenses",
    station: "lens", root: group, views, viewNames, defaultView: "overview", registry, labels,
    panel: "lens", frame, text, warm, reset, setLab, focus: [[P.card, "screen"], [P.ruler, "screenClose"], [P.trayBase, "tray"], [rail.scale, "rail"], [rail.rail, "rail"], [farBoard, "far"]],
    onContextRestored: () => { screenImg.key = ""; },
    api: { P: { ...P, rail: rail.rail, scale: rail.scale }, S, setPos, mount, st, screenImg, rays, blurFn, setIris, setAperture, setY0, setFar, FAR_CM, FAR_K, LAB_Y0, far, farArrow, setIdeal: (on) => { S.ideal = on; $("modelSel").value = on ? "ideal" : "real"; } },
  };
}
