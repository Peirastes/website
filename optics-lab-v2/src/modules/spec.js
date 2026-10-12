// MODULE: Grating spectrometer (Exp 214). A discharge tube lights the collimator's slit; the beam meets a 600 lines/mm
// grating square to the collimator; the telescope, on an arm that turns the graduated circle with it, finds each line.
// The circle is read at a FIXED vernier at the front (0.1 deg). The eyepiece view (an inset) shows the lines against
// the crosshair. Calibrate d on He 587.562 nm, then measure the H Balmer lines (Cole, 2026-10-10: a 4th table; 0.1 deg
// vernier; the grating always square; Balmer lines only). Physics: ../../../physics/spectrometer.mjs.
// Station-local metres; the arm angle phi (deg) is a turn about +y (CCW from above), 0 = straight through.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { MATERIALS, TABLE_Y } from "../bench.js";
import { SPEC, TUBES, spectrum, reading, fieldOffset } from "../../physics/spectrometer.mjs";
import { SOURCES, wavelengthRGB } from "../../physics/wave.mjs";

export const Y_S = TABLE_Y + 0.055;          // the scale face (circle top)
export const Y_AX = TABLE_Y + 0.125;         // the optical axis
export const R_S = 0.115;                    // the circle's edge, where the main scale meets the vernier
const BETA_V = -90;                          // the vernier zero: base angle (deg) of the front (+z)
const rad = Math.PI / 180;
const dirAt = (betaDeg, r = 1) => new THREE.Vector3(Math.cos(betaDeg * rad) * r, 0, -Math.sin(betaDeg * rad) * r);   // base angle -> direction
const TICK_W = 0.00018;                      // tick width (m)

const box = (w, h, d, m, r = 0) => new THREE.Mesh(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m);
const cyl = (r, h, m, seg = 32) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
const along = (m, x0, x1) => { m.rotation.z = Math.PI / 2; m.position.x = (x0 + x1) / 2; return m; };   // a cylinder on the x axis

// the circle's numbers (every 10 deg), drawn on a ring texture that turns with the circle
function numbersTexture() {
  const N = 2048, c = document.createElement("canvas"); c.width = c.height = N; const g = c.getContext("2d");
  g.clearRect(0, 0, N, N); g.fillStyle = "#101114"; g.textAlign = "center"; g.textBaseline = "middle";
  const px = N / (2 * R_S), r = (R_S - 0.0088) * px;
  g.font = `700 ${Math.round(0.0034 * px)}px 'Share Tech Mono', monospace`;
  for (let k = 0; k < 360; k += 10) {
    const b = (BETA_V - SPEC.theta0 + k) * rad;                       // where degree k sits on the circle (arm frame)
    const x = N / 2 + Math.cos(b) * r, y = N / 2 - Math.sin(b) * r;   // canvas y = world z = -sin(beta)
    g.save(); g.translate(x, y); g.rotate(Math.atan2(-Math.cos(b), -Math.sin(b))); g.fillText(String(k), 0, 0); g.restore();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}
function textPlane(text, w, h, color = "#101114") {
  const c = document.createElement("canvas"); c.width = 256; c.height = Math.round(256 * h / w); const g = c.getContext("2d");
  g.fillStyle = color; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `700 ${Math.round(c.height * 0.8)}px 'Share Tech Mono', monospace`; g.fillText(text, c.width / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; return m;
}
// ticks: thin flat boxes, length along local x (radial after the turn), one instanced mesh per scale
function ticks(list, mat) {
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.0002, 1), mat, list.length), M = new THREE.Matrix4(), q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  list.forEach(({ beta, r0, len, y }, i) => { const mid = dirAt(beta, r0 + len / 2); mid.y = y; q.setFromAxisAngle(Y, beta * rad); M.compose(mid, q, new THREE.Vector3(Math.abs(len), 1, TICK_W)); im.setMatrixAt(i, M); });
  im.instanceMatrix.needsUpdate = true; return im;
}

export function createSpecModule({ $, clamp, setText }) {
  const group = new THREE.Group(); group.name = "module:spec";
  const scaleMat = new THREE.MeshStandardMaterial({ color: 0xb9bdc3, metalness: 0.25, roughness: 0.5 });   // matte silver: readable, no glint
  const inkMat = new THREE.MeshBasicMaterial({ color: 0x0c0d10 });
  const glowMat = () => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffffff, emissiveIntensity: 2.4, userData: { glow: true } });

  // ---------------------------------------------------------------- base, spindle, grating table (fixed)
  const base = cyl(0.135, 0.02, MATERIALS.anod, 64); base.position.y = TABLE_Y + 0.01; base.name = "spec:base"; group.add(base);
  const spindle = cyl(0.008, Y_AX - 0.022 - Y_S, MATERIALS.steel, 20); spindle.position.y = (Y_S + Y_AX - 0.022) / 2; group.add(spindle);
  const pivot = new THREE.Object3D(); pivot.position.y = Y_S; group.add(pivot);
  const gtable = cyl(0.042, 0.006, MATERIALS.alu, 48); gtable.position.y = Y_AX - 0.025; gtable.name = "spec:gratingTable"; group.add(gtable);
  for (let i = 0; i < 3; i++) { const s = cyl(0.0035, 0.012, MATERIALS.brass, 12), a = (i * 120 + 30) * rad; s.position.set(Math.cos(a) * 0.034, Y_AX - 0.031, Math.sin(a) * 0.034); group.add(s); }   // levelling screws
  // the grating in its holder: face square to the collimator (normal along x)
  const grating = new THREE.Group(); grating.name = "spec:grating"; group.add(grating);
  const gGlass = box(0.0015, 0.036, 0.040, MATERIALS.glass); gGlass.position.y = Y_AX; grating.add(gGlass);   // the bench glass: an iridescent material was its own shader, +0.13 s at a cold start
  for (const s of [-1, 1]) { const post = box(0.005, 0.044, 0.004, MATERIALS.black); post.position.set(0, Y_AX, s * 0.022); grating.add(post); }
  const gFoot = box(0.012, 0.004, 0.05, MATERIALS.black); gFoot.position.y = Y_AX - 0.020; grating.add(gFoot);
  const gTop = box(0.005, 0.004, 0.048, MATERIALS.black); gTop.position.y = Y_AX + 0.0205; grating.add(gTop);

  // ---------------------------------------------------------------- the fixed vernier at the front (10 lines over 9 deg)
  const vern = new THREE.Group(); vern.name = "spec:vernier"; group.add(vern);
  const sector = new THREE.Shape(), r0 = R_S + 0.0004, r1 = R_S + 0.013, b0 = (BETA_V - 1.6) * rad, b1 = (BETA_V + 9 + 1.6) * rad;
  sector.absarc(0, 0, r1, b0, b1, false); sector.absarc(0, 0, r0, b1, b0, true);
  const plate = new THREE.Mesh(new THREE.ExtrudeGeometry(sector, { depth: 0.004, bevelEnabled: false, curveSegments: 24 }), scaleMat);
  plate.rotation.x = -Math.PI / 2; plate.position.y = Y_S - 0.0037; plate.name = "spec:vernierPlate"; vern.add(plate);
  vern.add(ticks(Array.from({ length: 11 }, (_, j) => ({ beta: BETA_V + 0.9 * j, r0, len: j % 5 === 0 ? 0.0042 : 0.0028, y: Y_S + 0.0004 })), inkMat));
  for (const j of [0, 5, 10]) { const t = textPlane(String(j), 0.004, 0.0028); const p = dirAt(BETA_V + 0.9 * j, R_S + 0.0085); t.position.set(p.x, Y_S + 0.0004, p.z); t.rotation.z = (BETA_V + 0.9 * j + 90) * rad; vern.add(t); }
  const vPost = cyl(0.005, Y_S - 0.004 - TABLE_Y, MATERIALS.anod, 16), vp = dirAt(BETA_V + 4.5, 0.143); vPost.position.set(vp.x, (Y_S - 0.004 + TABLE_Y) / 2, vp.z); vern.add(vPost);
  const vTab = box(0.012, 0.004, 0.022, MATERIALS.anod), vt = dirAt(BETA_V + 4.5, 0.134); vTab.position.set(vt.x, Y_S - 0.006, vt.z); vTab.rotation.y = (BETA_V + 4.5) * rad + Math.PI / 2; vern.add(vTab);

  // ---------------------------------------------------------------- the arm: graduated circle + telescope, turning together
  const arm = new THREE.Group(); arm.name = "spec:arm"; group.add(arm);
  const circle = cyl(R_S, 0.006, scaleMat, 180); circle.position.y = Y_S - 0.003; circle.name = "spec:circle"; arm.add(circle);
  const hub = cyl(0.03, 0.004, MATERIALS.anod, 48); hub.position.y = Y_S + 0.002; arm.add(hub);
  const nums = new THREE.Mesh(new THREE.RingGeometry(0.088, R_S - 0.0003, 180), new THREE.MeshBasicMaterial({ map: numbersTexture(), transparent: true, depthWrite: false }));
  nums.rotation.x = -Math.PI / 2; nums.position.y = Y_S + 0.0003; arm.add(nums);
  arm.add(ticks(Array.from({ length: 360 }, (_, k) => { const len = k % 10 === 0 ? 0.0056 : k % 5 === 0 ? 0.0042 : 0.0028;
    return { beta: BETA_V - SPEC.theta0 + k, r0: R_S - len, len, y: Y_S + 0.0002 }; }), inkMat));
  const armBar = box(0.165, 0.008, 0.026, MATERIALS.anod, 0.002); armBar.position.set(0.1, Y_S - 0.012, 0); armBar.name = "spec:armBar"; arm.add(armBar);
  const tPost = cyl(0.006, Y_AX - 0.017 - (Y_S - 0.008), MATERIALS.alu, 16); tPost.position.set(0.175, (Y_AX - 0.017 + Y_S - 0.008) / 2, 0); arm.add(tPost);
  const scope = new THREE.Group(); scope.name = "spec:telescope"; arm.add(scope);
  const tTube = along(cyl(0.017, 0.185, MATERIALS.anod, 40), 0.07, 0.255); tTube.position.y = Y_AX; scope.add(tTube);
  const tObj = along(cyl(0.019, 0.012, MATERIALS.black, 40), 0.068, 0.08); tObj.position.y = Y_AX; scope.add(tObj);
  const tEye = along(cyl(0.010, 0.045, MATERIALS.black, 32), 0.255, 0.30); tEye.position.y = Y_AX; scope.add(tEye);
  const tCup = along(cyl(0.013, 0.012, MATERIALS.black, 32), 0.296, 0.308); tCup.position.y = Y_AX; scope.add(tCup);
  const tKnob = cyl(0.007, 0.012, MATERIALS.brass, 20); tKnob.position.set(0.24, Y_AX, 0.023); tKnob.rotation.x = Math.PI / 2; scope.add(tKnob);   // focus

  // ---------------------------------------------------------------- the collimator (fixed) and the discharge tube
  const colli = new THREE.Group(); colli.name = "spec:collimator"; group.add(colli);
  const cTube = along(cyl(0.016, 0.19, MATERIALS.anod, 40), -0.255, -0.065); cTube.position.y = Y_AX; colli.add(cTube);
  const cLens = along(cyl(0.018, 0.012, MATERIALS.black, 40), -0.077, -0.065); cLens.position.y = Y_AX; colli.add(cLens);
  const cSlitCap = along(cyl(0.019, 0.01, MATERIALS.black, 40), -0.266, -0.256); cSlitCap.position.y = Y_AX; colli.add(cSlitCap);
  const slit = box(0.0004, 0.012, 0.0006, glowMat()); slit.position.set(-0.2665, Y_AX, 0); colli.add(slit);
  const sKnob = cyl(0.006, 0.01, MATERIALS.brass, 16); sKnob.position.set(-0.261, Y_AX + 0.024, 0); colli.add(sKnob);
  const cPost = cyl(0.007, Y_AX - 0.016 - TABLE_Y, MATERIALS.alu, 16); cPost.position.set(-0.15, (Y_AX - 0.016 + TABLE_Y) / 2, 0); colli.add(cPost);
  const cFoot = cyl(0.025, 0.006, MATERIALS.anod, 32); cFoot.position.set(-0.15, TABLE_Y + 0.003, 0); colli.add(cFoot);
  const lamp = new THREE.Group(); lamp.name = "spec:lamp"; group.add(lamp);
  const lBox = box(0.07, 0.20, 0.11, MATERIALS.black, 0.004); lBox.position.set(-0.33, TABLE_Y + 0.10, 0); lamp.add(lBox);
  const lWin = box(0.002, 0.10, 0.016, new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.3 })); lWin.position.set(-0.2955, Y_AX, 0); lamp.add(lWin);   // the slot the tube shows through
  const tubeGlow = cyl(0.0032, 0.085, glowMat(), 16); tubeGlow.position.set(-0.2915, Y_AX, 0); lamp.add(tubeGlow);
  const lSwitch = box(0.012, 0.008, 0.02, MATERIALS.steel); lSwitch.position.set(-0.33, TABLE_Y + 0.204, 0.03); lamp.add(lSwitch);
  for (const o of [slit, tubeGlow]) o.userData.sharedLook = true;
  group.traverse((o) => { if (o.isMesh && !(o.material && o.material.isMeshBasicMaterial)) { o.castShadow = true; o.receiveShadow = true; } });

  // ---------------------------------------------------------------- state
  const DEFAULTS = { phi: 0.8, tube: "helium" };
  const S = { ...DEFAULTS, lab: false };
  const setArm = (deg) => { S.phi = clamp(deg, -SPEC.armMax, SPEC.armMax); };
  $("tubeSel").innerHTML = TUBES.map((t) => `<option value="${t}">${SOURCES[t].name}</option>`).join("");
  $("tubeSel").value = S.tube;
  $("tubeSel").addEventListener("change", (e) => { S.tube = e.target.value; });
  const tubeColour = () => { const c = SOURCES[S.tube].lines.reduce((a, l) => { const r = wavelengthRGB(l.w); return a.map((x, i) => x + r[i] * l.I); }, [0, 0, 0]), mx = Math.max(...c) || 1; return c.map((x) => x / mx); };

  // ---------------------------------------------------------------- the eyepiece: the field of view against the crosshair
  // The telescope inverts, so a line at a larger angle than the arm shows to the right (physics fieldOffset).
  const eye = $("eyeCanvas"), eg = eye.getContext("2d");
  let eyeKey = "", shown = [];
  function drawEye() {
    const big = document.body.classList.contains("eye-big"), css = big ? 420 : 230, dpr = Math.min(2, window.devicePixelRatio || 1);
    const key = `${S.phi}|${S.tube}|${css}|${dpr}`; if (key === eyeKey) return; eyeKey = key;
    if (eye.width !== Math.round(css * dpr)) { eye.width = eye.height = Math.round(css * dpr); eye.style.width = eye.style.height = css + "px"; }
    const N = eye.width, c = N / 2, R = N / 2 - 2 * dpr, pxPerDeg = (2 * R) / SPEC.fov;
    eg.setTransform(1, 0, 0, 1, 0, 0); eg.clearRect(0, 0, N, N);
    eg.save(); eg.beginPath(); eg.arc(c, c, R, 0, 2 * Math.PI); eg.clip();
    eg.fillStyle = "#040507"; eg.fillRect(0, 0, N, N);
    eg.globalCompositeOperation = "lighter";
    const lines = spectrum(S.tube), Imax = Math.max(...SOURCES[S.tube].lines.map((l) => l.I));
    const sig = Math.max(1.2 * dpr, (SPEC.slitDeg / 2.355) * pxPerDeg), hTop = c - R * 0.72, hBot = c + R * 0.72;
    shown = [];
    for (const L of lines) {
      const dx = fieldOffset(L.theta, S.phi); if (Math.abs(dx) > SPEC.fov / 2 + 0.1) continue;
      const x = c + dx * pxPerDeg, b = Math.min(1, Math.sqrt(L.I / Imax) * 1.15), [r, g, bl] = wavelengthRGB(L.w);
      shown.push({ w: L.w, m: L.m, x: (x - c) / pxPerDeg, b });
      const grad = eg.createLinearGradient(x - 4 * sig, 0, x + 4 * sig, 0), col = (a) => `rgba(${Math.round(255 * r)},${Math.round(255 * g)},${Math.round(255 * bl)},${a})`;
      for (let i = 0; i <= 16; i++) { const u = (i / 16) * 8 - 4; grad.addColorStop(i / 16, col(b * Math.exp(-0.5 * u * u))); }
      eg.fillStyle = grad; eg.fillRect(x - 4 * sig, hTop, 8 * sig, hBot - hTop);
      const halo = eg.createLinearGradient(x - 14 * sig, 0, x + 14 * sig, 0); halo.addColorStop(0, col(0)); halo.addColorStop(0.5, col(b * 0.08)); halo.addColorStop(1, col(0));
      eg.fillStyle = halo; eg.fillRect(x - 14 * sig, hTop, 28 * sig, hBot - hTop);
    }
    eg.globalCompositeOperation = "source-over";
    eg.strokeStyle = "rgba(170,176,186,.55)"; eg.lineWidth = Math.max(1, dpr * 0.8);
    eg.beginPath(); eg.moveTo(c, c - R); eg.lineTo(c, c + R); eg.moveTo(c - R, c); eg.lineTo(c + R, c); eg.stroke();
    eg.restore();
    eg.strokeStyle = "rgba(255,174,32,.45)"; eg.lineWidth = 2 * dpr; eg.beginPath(); eg.arc(c, c, R, 0, 2 * Math.PI); eg.stroke();
  }
  $("eyeBox").addEventListener("click", () => { document.body.classList.toggle("eye-big"); eyeKey = ""; drawEye(); });

  // ---------------------------------------------------------------- camera views (station-local; the telescope view follows the arm)
  const views = {
    overview: () => [[0.06, 1.36, 0.80], [-0.03, 0.99, 0.0], [0.78, 0.40]],
    vernier: () => [[0.009, Y_S + 0.062, R_S + 0.052], [0.009, Y_S, R_S + 0.003], [0.032, 0.018]],
    telescope: () => { const u = dirAt(S.phi); return [[u.x * 0.52 - u.z * 0.12, Y_AX + 0.13, u.z * 0.52 + u.x * 0.12], [u.x * 0.05, Y_AX - 0.01, u.z * 0.05], [0.42, 0.22]]; },
    grating: () => [[0.10, Y_AX + 0.07, 0.16], [0, Y_AX - 0.005, 0], [0.13, 0.10]],
    lamp: () => [[-0.16, Y_AX + 0.09, 0.30], [-0.29, Y_AX - 0.01, 0], [0.22, 0.20]],
  };
  const viewNames = { overview: "Spectrometer overview", vernier: "Vernier (read the circle)", telescope: "Telescope arm", grating: "Grating", lamp: "Discharge tube" };

  // ---------------------------------------------------------------- controls
  const describeArm = () => (S.lab ? "Telescope arm" : `Circle reading <b>${reading(S.phi).toFixed(2)}°</b>`) + "<br>drag it around the circle · scroll = 0.1° (Shift 1°) · ← → fine 0.02° (Shift 0.2°)";
  const registry = [
    { id: "spec:arm", name: "Telescope", objects: [scope, armBar, tPost], centre: pivot, kind: "rotary", wheelStep: 0.1 * rad, wheelStepShift: 1 * rad,
      rotate: (d) => setArm(S.phi - d / rad), describe: describeArm },
  ];
  const vl = dirAt(BETA_V + 4.5, R_S + 0.016);
  const labels = [                                       // offsets in each group's own frame (the arm's turns with it)
    { text: "telescope", obj: scope, off: [0.29, Y_AX + 0.022, 0], prio: 3 },
    { text: "collimator + slit", obj: colli, off: [-0.17, Y_AX + 0.026, 0], prio: 3 },
    { text: `grating · ${SPEC.label} lines/mm`, obj: grating, off: [0, Y_AX + 0.03, 0], prio: 3 },
    { text: "discharge tube", obj: lamp, off: [-0.33, TABLE_Y + 0.215, 0], prio: 2 },
    { text: "vernier", obj: vern, off: [vl.x, Y_S + 0.001, vl.z], prio: 2 },
    { text: "graduated circle", obj: group, off: [-0.05, Y_S + 0.002, -0.1], prio: 1 },
  ];

  function onKey(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return false;
    setArm(S.phi + (e.key === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 0.2 : 0.02)); return true;
  }

  // ---------------------------------------------------------------- readouts
  const SIDE = (th) => (th < 0 ? "right" : "left");
  const ORD = ["zeroth", "first", "second", "third"];
  function onCross() {
    let best = null;
    for (const L of spectrum(S.tube)) { const dx = fieldOffset(L.theta, S.phi); if (!best || Math.abs(dx) < Math.abs(best.dx)) best = { ...L, dx }; }
    return best;
  }
  function text() {
    const R = reading(S.phi), L = onCross(), on = L && Math.abs(L.dx) < 0.03, h = S.lab;
    const c = (cls, sym, val, hide = false) => `<div class="chip ${cls}${hide ? " hide" : ""}">${sym} = <b>${val}</b></div>`;
    const chips = c("c-p", "reading", `${R.toFixed(2)}°`, h) + c("c-t", "<i>θ</i>", `${(-S.phi).toFixed(2)}° from straight`, h) +
      c("c-f", "<i>d</i>", `${SPEC.d.toFixed(1)} nm`, h) + c("c-e", "on the cross", on ? `${L.w} nm` : "no line", h);
    let msg;
    if (h) msg = "Look in the eyepiece (lower left; click it to enlarge), put the crosshair on the line, then read the circle at the vernier: the degree just below the vernier's 0, plus the vernier line that lines up exactly.";
    else if (on) msg = L.m === 0 ? `<b>Straight through</b>: every line of the tube at once, the zeroth order. The circle reads θ<sub>0</sub> = <b>${R.toFixed(2)}°</b> here.`
      : `Crosshair on <b>${L.w} nm</b>, ${ORD[Math.abs(L.m)]} order, ${SIDE(L.theta)} side: θ = ${Math.abs(L.theta).toFixed(2)}°, and d sin θ = ${(SPEC.d * Math.sin(Math.abs(L.theta) * rad)).toFixed(1)} nm = ${Math.abs(L.m)}λ.`;
    else msg = L ? `No line on the crosshair. Nearest: ${L.w} nm (${ORD[Math.abs(L.m)]} order), ${Math.abs(L.dx).toFixed(2)}° ${L.dx > 0 ? "to the right in the eyepiece" : "to the left in the eyepiece"}. The telescope inverts: turn the arm toward ${L.dx > 0 ? "→" : "←"} to bring it over.` : "";
    setText({ rail: `<div class="chip c-x" title="the tube in the lamp">${SOURCES[S.tube].name.replace(" tube", "")}</div>`, chips, status: msg, mode: h ? "lab mode" : SOURCES[S.tube].name });
  }

  // ---------------------------------------------------------------- per frame
  function frame() {
    arm.rotation.y = S.phi * rad;
    const col = tubeColour(); for (const m of [tubeGlow.material, slit.material]) m.emissive.setRGB(col[0], col[1], col[2]);
    drawEye();
  }
  function reset() { Object.assign(S, DEFAULTS); $("tubeSel").value = S.tube; }
  function setLab(on) { S.lab = on; }

  return {
    id: "spec", name: "Spectrometer (Exp 214)", group: "Wave optics", scope: "Wave optics · Grating spectrometer",
    station: "spec", root: group, views, viewNames, defaultView: "overview", registry, labels, panel: "spec",
    frame, text, warm: frame, reset, setLab, key: onKey,
    focus: [[plate, "vernier"], [circle, "vernier"], [gGlass, "grating"], [gtable, "grating"], [lBox, "lamp"], [cTube, "telescope"]],
    api: { S, setArm, group, vern, reading: () => reading(S.phi), shown: () => shown, onCross, arm, pivot, plate, circle, Y_S, R_S, drawEye,
      setTube: (t) => { S.tube = t; $("tubeSel").value = t; } },
  };
}
