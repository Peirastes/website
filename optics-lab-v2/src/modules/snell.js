// MODULE: Snell's law. A ray box shines a narrow beam at the centre of a rotating protractor table carrying a
// semicircular block (the classic ray-table kit). Turning the table sets the angle of incidence on the flat face;
// turned past 90 deg, the light enters through the curved face (radially, undeviated) and meets the flat face from
// inside, so total internal reflection appears past the critical angle. Every beam is traced with vector Snell's law
// and weighted by Fresnel (physics/optics.mjs). The degree ring is printed on the table and turns with the block, so
// the beams cross it at their true angles from the normal.
// EXTENDED: white light with dispersion (each wavelength refracts by its own n).
// A blank curved SCREEN around the table catches every beam as a spot (Cole 2026-10-12).
// The tray also holds a front-surface PLANE MIRROR (law of reflection): it stands on the same diameter, its silvered face
// exactly on the line through the centre, so the ring reads the incident and reflected angles from the normal.
// A separate MIRROR TRAY behind the turntable holds the plane mirror and two cylindrical mirrors, concave and convex
// (R = 16 cm, f = ±R/2), each with its vertex on the centre. The ray box takes a slit mask (1, 3 or 5 parallel beams):
// with one beam a curved mirror only shows its vertex, which reflects like a plane mirror; with 3 or 5 the concave
// mirror brings them through a real focus and the convex one spreads them from a virtual focus behind it.
// HAND PLACEMENT (Exp 212): in lab mode the table starts empty and a part goes on by hand: click it in its tray, it
// follows the cursor over the platform, a click sets it down there. Drag it to slide it, scroll to turn it, arrow keys
// and , . to nudge. Its pose (S.pose: x, z, psi in turntable coordinates) rides with the table, and every beam is traced
// against the part where it actually sits: a face off the centre or turned shifts the readings, as on a real table.
import * as THREE from "three";
import { MATERIALS, TABLE_Y } from "../bench.js";
import { MEDIA, indexAt, refract, criticalAngle, fresnel, reflect, MIRROR_R } from "../../physics/optics.mjs";
import { wavelengthRGB } from "../../physics/wave.mjs";

const D2R = Math.PI / 180;
const C0 = new THREE.Vector3(0.10, 0, 0.02);          // turntable centre (on the table)
const R_TABLE = 0.13, R_BLOCK = 0.05, BLOCK_H = 0.02;
const DISC_Y = TABLE_Y + 0.022, BEAM_Y = DISC_Y + 0.009;   // protractor surface; beam height (mid-block)
const BOX_X = C0.x - 0.33;                                  // ray-box front face
const L_OUT = 0.24;                                         // how far the centre ray's segments run past the centre (m; readouts)
// THE SCREEN: a blank curved screen around the table (fixed), open toward the ray box. Beams end on it as spots.
const R_SCR = 0.20, SCR_H = 0.05, SCR_GAP = 12 * D2R;      // radius about the table centre, height, half-gap around the ray box
// THE LAB SOURCE (lab mode = Exp 212 as run in class, PASCO-style): an incandescent light source on a short bench rail,
// a slit plate (5 slits) on a holder at the turntable's edge, and a slit mask that passes one ray. Explore mode keeps the
// laser ray box. Sizes are assumed (Cole's apparatus not measured): filament coil 4 mm long, 1 mm across; slits 0.5 mm
// wide, 4 mm apart; mask opening 2.5 mm; slit plate 16 cm before the table centre; filament 2.5-15 cm behind the slit.
const X_SLIT = C0.x - 0.16, FIL_L = 0.004, FIL_D = 0.001, SLIT_W = 0.0005, SLIT_SP = 0.004, N_SLIT = 5, MASK_OPEN = 0.0025;
const D_MIN = 0.025, D_MAX = 0.15, YS_MAX = 0.01, MASK_MAX = 0.012;
// lab mode starts as a student finds the bench: filament turned 70 deg from vertical, 5 cm from the slit, the slit plate
// 3 mm off the axis, and the mask lying beside the holder
const LAB_SRC = { d: 0.05, psi: 70 * D2R, ys: 0.003, mask: null };
// explore mode uses the SAME bench (Cole 2026-10-12: "the preview/demo mode should not differ so significantly from the
// actual lab"), set up well: source 10 cm back, filament vertical, the ray centred, the mask over the centre slit
const EXPLORE_SRC = { d: 0.10, psi: 0, ys: 0, mask: 0 };
const WHITE8 = [410, 450, 490, 530, 570, 610, 650, 690];
// the bulb's colour filters (explore; lab mode is the bare white bulb)
const FILTERS = [{ id: "white", tag: "white (no filter)" }, { id: 650, tag: "red filter" }, { id: 532, tag: "green filter" }, { id: 405, tag: "violet filter" }];
const MASK_ON = 0.0032;                                     // where the mask lands when put on: over the next slit, not the centre
const slitY = (k) => (k - (N_SLIT - 1) / 2) * SLIT_SP;     // slit k's place on the plate (m across, from its centre)
export const BLOCKS = [
  { id: "acrylic", tag: "acrylic" }, { id: "crown", tag: "crown glass" }, { id: "water", tag: "water dish" }, { id: "diamond", tag: "diamond" },
  { id: "mirror", tag: "plane mirror", mirror: true, curve: 0 },
  { id: "concave", tag: "concave mirror", mirror: true, curve: 1 }, { id: "convex", tag: "convex mirror", mirror: true, curve: -1 },
];
const MIRROR_T = 0.006;                                      // mirror plate thickness (m): silvered face on the diameter, backing behind
const MIRROR_RC = 0.16;                                      // radius of curvature of the curved mirrors (m): f = R/2 = 8 cm, inside the ring
const SLIT_GAP = 0.015;                                      // spacing of the ray box's parallel beams (m)
export const SLITS = [1, 3, 5];
export const LIGHTS = [{ id: 650, tag: "red 650 nm" }, { id: 532, tag: "green 532 nm" }, { id: 405, tag: "violet 405 nm" }];

// the protractor face, printed like the ray-table kit's: degree ticks, numbers 0-90-0-90 from the normal, the NORMAL line
// (0-0) and the COMPONENT line (90-90) solid and labelled at both ends, a centre cross, the block outline. Bold enough to
// read from the overview, not only from the top view.
function protractorTexture() {
  const S = 2048, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d"), C = S / 2, Rr = S * 0.48;
  g.fillStyle = "#ece9e2"; g.beginPath(); g.arc(C, C, S / 2, 0, 2 * Math.PI); g.fill();
  // canvas angle a (from +x, counter-clockwise on the canvas) <-> table angle; 0 = the outward normal of the flat face
  g.strokeStyle = "#14161b"; g.fillStyle = "#14161b"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "700 66px 'Share Tech Mono', monospace";
  g.lineWidth = 4; g.beginPath(); g.arc(C, C, Rr, 0, 2 * Math.PI); g.stroke();                // the scale's base circle
  for (let d = 0; d < 360; d++) {
    const a = (180 + d) * D2R, len = d % 10 === 0 ? 84 : d % 5 === 0 ? 56 : 30, w = d % 10 === 0 ? 7 : d % 5 === 0 ? 4.5 : 2.5;
    g.lineWidth = w; g.beginPath(); g.moveTo(C + Math.cos(a) * Rr, C - Math.sin(a) * Rr); g.lineTo(C + Math.cos(a) * (Rr - len), C - Math.sin(a) * (Rr - len)); g.stroke();
    if (d % 10 === 0) { const v = d <= 90 ? d : d <= 180 ? 180 - d : d <= 270 ? d - 180 : 360 - d, rr = Rr - 135;
      g.save(); g.translate(C + Math.cos(a) * rr, C - Math.sin(a) * rr); g.rotate(-a + Math.PI / 2); g.fillText(String(v), 0, 0); g.restore(); }
  }
  const rIn = Rr - 180;                                                                         // the lines stop inside the numbers
  g.lineWidth = 7; g.strokeStyle = "#14161b";
  g.beginPath(); g.moveTo(C - rIn, C); g.lineTo(C + rIn, C); g.stroke();                       // the normal (0-0)
  g.beginPath(); g.moveTo(C, C - rIn); g.lineTo(C, C + rIn); g.stroke();                       // the component line (90-90): the flat face goes here
  g.lineWidth = 5; g.beginPath(); g.arc(C, C, 26, 0, 2 * Math.PI); g.stroke();                // centre mark
  g.lineWidth = 4; g.strokeStyle = "rgba(20,22,27,.35)"; g.setLineDash([16, 12]);
  const rb = (R_BLOCK / R_TABLE) * (S / 2);
  g.beginPath(); g.arc(C, C, rb, -Math.PI / 2, Math.PI / 2); g.stroke(); g.setLineDash([]);   // block outline: curved side away from the light
  // the line names, both ends, reading along the line, between the block outline and the numbers
  g.font = "700 50px 'Share Tech Mono', monospace"; const rl = (rb + rIn) / 2 + 30;
  const tag = (x, y, rot, s) => { g.save(); g.translate(x, y); g.rotate(rot); const w = g.measureText(s).width + 24;
    g.fillStyle = "#ece9e2"; g.fillRect(-w / 2, -32, w, 64); g.fillStyle = "#14161b"; g.fillText(s, 0, 2); g.restore(); };
  tag(C - rl, C, 0, "NORMAL"); tag(C + rl, C, 0, "NORMAL");
  tag(C, C - rl, -Math.PI / 2, "COMPONENT"); tag(C, C + rl, -Math.PI / 2, "COMPONENT");
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}

const isMirror = (id) => !!BLOCKS.find((B) => B.id === id).mirror;
const curveOf = (id) => BLOCKS.find((B) => B.id === id).curve || 0;
function blockMaterial(id) {
  if (isMirror(id)) {             // one material per box face (+x, -x, +y, -y, +z, -z): the -x face (toward the light at 0 deg) is silvered;
                                  // the curved plates use the first three (0 backing, 1 silvered, 2 edges)
    const back = new THREE.MeshStandardMaterial({ color: 0x24262b, metalness: 0.2, roughness: 0.7 });          // painted backing
    const silver = new THREE.MeshStandardMaterial({ color: 0xe6e9ee, metalness: 1, roughness: 0.04, envMapIntensity: 1.6 });
    const edge = new THREE.MeshStandardMaterial({ color: 0x6f8f86, metalness: 0.1, roughness: 0.3 });          // the glass plate's edge (seen from above)
    return [back, silver, edge, edge, edge, edge];
  }
  const tint = { acrylic: 0xe8f4ff, crown: 0xd8f0e6, water: 0xbfe0ff, diamond: 0xf4f6ff }[id];
  return new THREE.MeshPhysicalMaterial({ color: tint, metalness: 0, roughness: 0.03, transparent: true, opacity: id === "water" ? 0.22 : 0.3,
    clearcoat: 1, clearcoatRoughness: 0.02, ior: MEDIA[id].n, envMapIntensity: 1.3, depthWrite: false, side: THREE.DoubleSide });
}
// a cylindrical mirror plate in turntable coordinates (x across, silvered side toward -x; z along the face; y up):
// the silvered arc of radius MIRROR_RC through the origin (the vertex), the backing MIRROR_T behind it, square ends
// at |z| = R_BLOCK. curve = +1 concave (centre of curvature on the light side), -1 convex. Groups: 0 backing,
// 1 silvered, 2 edges. Normals on the arcs are radial, so the silvered face shades as a smooth curve.
function curvedMirrorGeometry(s) {
  const Cx = -s * MIRROR_RC, rB = MIRROR_RC + s * MIRROR_T, N = 48, H = BLOCK_H;
  const xAt = (r, z) => Cx + s * Math.sqrt(r * r - z * z);
  const G = [[], [], []], nG = [[], [], []];
  const tri = (g, V, Nv) => {                       // V: 3 points, Nv: 3 normals; wind so the face normal agrees with Nv
    const e1 = V[1].map((v, i) => v - V[0][i]), e2 = V[2].map((v, i) => v - V[0][i]);
    const fn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const avg = [0, 1, 2].map((i) => Nv[0][i] + Nv[1][i] + Nv[2][i]);
    const ord = fn[0] * avg[0] + fn[1] * avg[1] + fn[2] * avg[2] < 0 ? [0, 2, 1] : [0, 1, 2];
    for (const k of ord) { G[g].push(...V[k]); nG[g].push(...Nv[k]); }
  };
  const quad = (g, a, b, c, d, na, nb, nc, nd) => { tri(g, [a, b, c], [na, nb, nc]); tri(g, [a, c, d], [na, nc, nd]); };
  for (let i = 0; i < N; i++) {
    const z0 = -R_BLOCK + (2 * R_BLOCK * i) / N, z1 = -R_BLOCK + (2 * R_BLOCK * (i + 1)) / N;
    for (const [g, r, sg] of [[1, MIRROR_RC, -s], [0, rB, s]]) {      // silvered normal toward the light, backing away from it
      const p0 = xAt(r, z0), p1 = xAt(r, z1), n0 = [sg * (p0 - Cx) / r, 0, sg * z0 / r], n1 = [sg * (p1 - Cx) / r, 0, sg * z1 / r];
      quad(g, [p0, 0, z0], [p1, 0, z1], [p1, H, z1], [p0, H, z0], n0, n1, n1, n0);
    }
    for (const [y, ny] of [[0, -1], [H, 1]]) {                         // top and bottom of the plate
      const a = [xAt(MIRROR_RC, z0), y, z0], b = [xAt(MIRROR_RC, z1), y, z1], c = [xAt(rB, z1), y, z1], d = [xAt(rB, z0), y, z0], n = [0, ny, 0];
      quad(2, a, b, c, d, n, n, n, n);
    }
  }
  for (const z of [-R_BLOCK, R_BLOCK]) { const n = [0, 0, Math.sign(z)], a = xAt(MIRROR_RC, z), b = xAt(rB, z);
    quad(2, [a, 0, z], [b, 0, z], [b, H, z], [a, H, z], n, n, n, n); }
  const g = new THREE.BufferGeometry(), pos = [].concat(...G), nrm = [].concat(...nG);
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  let at = 0; for (let k = 0; k < 3; k++) { g.addGroup(at, G[k].length / 3, k); at += G[k].length / 3; }
  return g;
}
function blockGeometry(id) {
  if (id === "mirror") { const g = new THREE.BoxGeometry(MIRROR_T, BLOCK_H, 2 * R_BLOCK); g.translate(MIRROR_T / 2, BLOCK_H / 2, 0); return g; }
  if (isMirror(id)) return curvedMirrorGeometry(curveOf(id));
  const s = new THREE.Shape(); s.moveTo(0, -R_BLOCK); s.absarc(0, 0, R_BLOCK, -Math.PI / 2, Math.PI / 2, false); s.lineTo(0, -R_BLOCK);
  const g = new THREE.ExtrudeGeometry(s, { depth: BLOCK_H, bevelEnabled: false, curveSegments: 64 });
  g.rotateX(-Math.PI / 2);   // shape x -> world x, shape y -> world -z; extrude (z) -> world y
  return g;
}

export function createSnellModule({ $, clamp, setText, camera }) {
  const group = new THREE.Group(); group.name = "module:snell";
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  // turntable: dark base, printed protractor disc, the block on it (both turn)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R_TABLE + 0.012, R_TABLE + 0.016, 0.018, 64), MATERIALS.anod);
  base.position.set(C0.x, TABLE_Y + 0.009, C0.z); group.add(base);
  // the optical axis: fixed (it does not turn with the table), along the ray box's beam. A white index on the base at
  // each end of the axis (the table angle is read against it) and a line printed on the tabletop out to the ray box.
  const axisMat = new THREE.MeshBasicMaterial({ color: 0xd8d4ca }), baseTop = TABLE_Y + 0.0181, RB = R_TABLE + 0.012;
  for (const sgn of [-1, 1]) {
    const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.009, 0.0024), axisMat); tick.rotation.x = -Math.PI / 2;
    tick.position.set(C0.x + sgn * (R_TABLE + 0.0075), baseTop, C0.z); tick.name = "snell:axisIndex"; group.add(tick);
  }
  const axisTex = (() => { const c = document.createElement("canvas"); c.width = 1024; c.height = 128; const g = c.getContext("2d");
    g.fillStyle = "#d8d4ca"; g.fillRect(0, 59, 1024, 10); g.font = "700 46px 'Share Tech Mono', monospace"; g.textBaseline = "bottom";
    g.fillText("OPTICAL AXIS", 300, 52); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
  const x0 = BOX_X + 0.004, x1 = C0.x - RB - 0.004;
  const axisLine = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, (x1 - x0) / 8), new THREE.MeshBasicMaterial({ map: axisTex, transparent: true, depthWrite: false }));
  axisLine.rotation.x = -Math.PI / 2; axisLine.position.set((x0 + x1) / 2, TABLE_Y + 0.0006, C0.z); axisLine.name = "snell:axisLine"; group.add(axisLine);
  // the screen: blank, matte, fixed (no scale: it would read from the optical axis, not the normal; the ring is read).
  // Open toward the ray box. It takes no clicks (students reach over it). (three.js cylinders: x = r sin t, z = r cos t)
  const screenMat = new THREE.MeshStandardMaterial({ color: 0xd8d5ce, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
  const screen = new THREE.Mesh(new THREE.CylinderGeometry(R_SCR, R_SCR, SCR_H, 160, 1, true, 1.5 * Math.PI + SCR_GAP, 2 * Math.PI - 2 * SCR_GAP), screenMat);
  screen.position.set(C0.x, TABLE_Y + SCR_H / 2, C0.z); screen.name = "snell:screen"; screen.raycast = () => {}; screen.receiveShadow = true; group.add(screen);
  const turn = new THREE.Group(); turn.position.set(C0.x, 0, C0.z); group.add(turn);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(R_TABLE, 128), new THREE.MeshStandardMaterial({ map: protractorTexture(), roughness: 0.85 }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = DISC_Y; disc.name = "snell:disc"; turn.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R_TABLE, 0.004, 10, 128), MATERIALS.anod); rim.rotation.x = Math.PI / 2; rim.position.y = DISC_Y; turn.add(rim);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.016, 20), MATERIALS.brass); knob.position.set(0, DISC_Y + 0.008, R_TABLE * 0.93); turn.add(knob);   // on the COMPONENT line (90), the student's side at table 0
  // the block: flat face on the turntable's diameter, curved side away from the light at 0 deg
  const block = new THREE.Mesh(blockGeometry("acrylic"), blockMaterial("acrylic")); block.position.y = DISC_Y + 0.0005; block.renderOrder = 2;   // curved side +x: away from the light at 0 deg
  block.userData.sharedLook = true; turn.add(block);
  // the grab pad: an unseen disc a little larger than the part, so the wheel and a drag over the part work on the PART (a
  // thin mirror is hard to hit, and the table under it took the wheel). It rides with the part; the table still turns by
  // its rim, its knob and the disc outside the pad.
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(R_BLOCK + 0.008, R_BLOCK + 0.008, 0.024, 40), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 }));
  pad.position.y = 0.006; pad.userData.pickOnly = true; block.add(pad);
  // ray box: lamp housing with a slit, fixed, aimed at the centre
  const rb = new THREE.Group(); rb.position.set(BOX_X, TABLE_Y, C0.z); group.add(rb);
  const housing = box(0.11, 0.06, 0.07, MATERIALS.black); housing.position.set(-0.055, 0.03, 0); rb.add(housing);
  const slitOffsets = (n) => Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * SLIT_GAP);   // beam centres across the box (m, +z)
  const slitMeshes = slitOffsets(5).map((z) => { const m = box(0.002, 0.004, 0.002, MATERIALS.glow); m.position.set(0.0005, BEAM_Y - TABLE_Y, z); rb.add(m); return { m, z }; });
  const fins = box(0.04, 0.004, 0.072, MATERIALS.anod); fins.position.set(-0.08, 0.062, 0); rb.add(fins);
  // ---- THE LAB SOURCE (lab mode only; the ray box is explore mode's): rail, light source, slit holder, slit plate, mask
  const labG = new THREE.Group(); labG.name = "snell:labSource"; labG.visible = false; labG.position.y = TABLE_Y; group.add(labG);   // on the tabletop
  const yB = BEAM_Y - TABLE_Y;                                               // beam height above the tabletop
  // the rail, with a scale from the slit (0) back to 16 cm: the filament's distance is read at the carrier's index
  const RAIL0 = X_SLIT - 0.005, RAIL1 = X_SLIT - D_MAX - 0.045;
  const rail = box(RAIL0 - RAIL1, 0.010, 0.032, MATERIALS.anod); rail.position.set((RAIL0 + RAIL1) / 2, 0.005, C0.z); labG.add(rail);
  const railTex = (() => { const c = document.createElement("canvas"); c.width = 2048; c.height = 128; const g = c.getContext("2d");
    g.fillStyle = "#d9d6cd"; g.fillRect(0, 0, 2048, 128); g.fillStyle = g.strokeStyle = "#16181c"; g.font = "700 44px 'Share Tech Mono', monospace"; g.textAlign = "center";
    const pxPerM = 2048 / (RAIL0 - RAIL1);
    for (let mm = 0; mm <= (RAIL0 - RAIL1 + 0.005) * 1000; mm++) { const x = 2048 - (mm / 1000 - 0.005) * pxPerM; if (x < 0 || x > 2048) continue;
      const L = mm % 10 === 0 ? 46 : mm % 5 === 0 ? 30 : 16; g.lineWidth = mm % 10 === 0 ? 4 : 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, L); g.stroke();
      if (mm % 10 === 0) g.fillText(String(mm / 10), x, 96); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
  const railScale = new THREE.Mesh(new THREE.PlaneGeometry(RAIL0 - RAIL1, 0.0085), new THREE.MeshBasicMaterial({ map: railTex }));
  railScale.position.set((RAIL0 + RAIL1) / 2, 0.005, C0.z + 0.0161); labG.add(railScale);   // on the rail's front face, toward the student
  // the light source on its carrier: the filament sits at the carrier's index line; the housing is behind it, with a window
  const srcG = new THREE.Group(); srcG.position.set(X_SLIT - LAB_SRC.d, 0, C0.z); labG.add(srcG);
  const carrierM = box(0.03, 0.012, 0.04, MATERIALS.black); carrierM.position.set(0, 0.016, 0); srcG.add(carrierM);
  const idxTab = box(0.004, 0.009, 0.001, MATERIALS.black); idxTab.position.set(0, 0.0055, 0.0175); srcG.add(idxTab);   // a tab hanging over the scale
  const idx = box(0.0006, 0.008, 0.0004, MATERIALS.glow); idx.position.set(0, 0.0055, 0.0181); srcG.add(idx);         // its index line, at the filament
  const hsg = new THREE.Group(); srcG.add(hsg);
  const hBack = box(0.046, 0.058, 0.05, MATERIALS.black); hBack.position.set(-0.029, 0.051, 0); hsg.add(hBack);
  const winFrame = (w, h, x, y, z) => { const m = box(0.003, h, w, MATERIALS.black); m.position.set(x, y, z); hsg.add(m); };
  winFrame(0.05, 0.016, -0.0045, 0.051 + 0.021, 0); winFrame(0.05, 0.016, -0.0045, 0.051 - 0.021, 0);   // window frame above / below
  winFrame(0.015, 0.026, -0.0045, 0.051, 0.0175); winFrame(0.015, 0.026, -0.0045, 0.051, -0.0175);       // and either side
  const filG = new THREE.Group(); filG.position.set(0, yB, 0); srcG.add(filG);
  const filMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffd9a0, emissiveIntensity: 3.0, userData: { glow: true } });
  const fil = new THREE.Mesh(new THREE.CylinderGeometry(FIL_D / 2, FIL_D / 2, FIL_L, 12), filMat); filG.add(fil);
  const srcKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.012, 24), MATERIALS.brass); srcKnob.position.set(-0.02, 0.086, 0); srcG.add(srcKnob);
  const srcKnobMark = box(0.012, 0.0006, 0.0015, MATERIALS.black); srcKnobMark.position.set(0.003, 0.0062, 0); srcKnob.add(srcKnobMark);
  // the slit holder at the turntable's edge, the slit plate in it (it slides across), the mask over the plate
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, yB - 0.016, 12), MATERIALS.anod); post.position.set(X_SLIT - 0.004, (yB - 0.016) / 2, C0.z); labG.add(post);
  const foot = box(0.02, 0.003, 0.03, MATERIALS.anod); foot.position.set(X_SLIT - 0.004, 0.0015, C0.z); labG.add(foot);
  const clamp_ = box(0.006, 0.004, 0.06, MATERIALS.anod); clamp_.position.set(X_SLIT - 0.002, yB - 0.016, C0.z); labG.add(clamp_);
  const plateG = new THREE.Group(); plateG.position.set(X_SLIT, yB, C0.z); labG.add(plateG);
  const plate = box(0.0015, 0.03, 0.064, MATERIALS.black); plateG.add(plate);   // 2 cm wider than the mask: its ends stick out to grab
  const slitMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffe2b8, emissiveIntensity: 1.6, userData: { glow: true } });
  const slitLines = Array.from({ length: N_SLIT }, (_, k) => { const m = box(0.0003, 0.022, SLIT_W, slitMat); m.position.set(0.0008, 0, slitY(k)); m.userData.sharedLook = true; plateG.add(m); return m; });   // sharedLook: one material, which follows the source's brightness
  const maskG = new THREE.Group(); maskG.position.set(0.0022, 0, 0); plateG.add(maskG);
  const maskL = box(0.001, 0.03, 1, MATERIALS.anod), maskR = box(0.001, 0.03, 1, MATERIALS.anod); maskG.add(maskL, maskR);
  const maskTab = box(0.001, 0.008, 0.008, MATERIALS.brass); maskTab.position.set(0, 0.019, 0); maskG.add(maskTab);
  const maskOff = new THREE.Group(); maskOff.position.set(X_SLIT - 0.005, 0.0006, C0.z + 0.05); labG.add(maskOff);   // lying beside the holder, inside the screen
  const maskFlat = box(0.03, 0.001, 0.044, MATERIALS.anod); maskOff.add(maskFlat);
  const maskHole = box(0.0302, 0.0012, MASK_OPEN, MATERIALS.black); maskOff.add(maskHole);
  // fewer draw calls: fixed parts that share a material are folded into one mesh (each part is drawn in the main pass,
  // the glow pass and the shadow pass; the bench's 26 parts had cost ~6 fps in the room flights, perf 2026-10-12)
  function absorb(target, others) {
    target.updateMatrixWorld(true); const inv = target.matrixWorld.clone().invert(), parts = [target.geometry.clone()];
    for (const o of others) { o.updateMatrixWorld(true); parts.push(o.geometry.clone().applyMatrix4(inv.clone().multiply(o.matrixWorld))); }
    const pos = [], nor = [], uv = [], idx = []; let off = 0;
    for (const g of parts) { const gi = g.index ? g : g.toNonIndexed();
      pos.push(...gi.attributes.position.array); nor.push(...gi.attributes.normal.array); uv.push(...gi.attributes.uv.array);
      if (gi.index) for (const i of gi.index.array) idx.push(i + off); else for (let i = 0; i < gi.attributes.position.count; i++) idx.push(i + off);
      off += gi.attributes.position.count; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeBoundingSphere(); geo.computeBoundingBox();
    target.geometry.dispose(); target.geometry = geo; for (const o of others) o.parent.remove(o);
  }
  absorb(hBack, hsg.children.filter((m) => m !== hBack).concat([carrierM, idxTab]));   // the housing, its window frame, carrier and index tab
  absorb(rail, [post, foot, clamp_]);                                                   // the rail and the slit holder's post, foot, clamp
  absorb(slitLines[0], slitLines.slice(1));                                             // the five slit lines (one material)
  // the source's looks follow its state (positions, the filament's turn and glow, the mask's opening)
  function syncSource() {
    rb.visible = !bulbOn(); labG.visible = bulbOn();
    if (!bulbOn()) return;
    srcG.position.x = X_SLIT - S.src.d; filG.rotation.x = S.src.psi; srcKnob.rotation.y = S.src.psi;
    plateG.position.z = C0.z + S.src.ys;
    const B = srcBright(); slitMat.emissiveIntensity = 0.6 + 0.8 * Math.min(1.5, B); filMat.emissiveIntensity = 3.0;
    const on = S.src.mask !== null; maskG.visible = on; maskOff.visible = !on;
    if (on) { const m = S.src.mask, e = 0.022, a = m - MASK_OPEN / 2, b = m + MASK_OPEN / 2;
      maskL.scale.z = Math.max(1e-4, a + e); maskL.position.z = (a - e) / 2; maskR.scale.z = Math.max(1e-4, e - b); maskR.position.z = (b + e) / 2; maskTab.position.z = m; }
  }
  // block tray (click a block to mount it), and the mirror tray behind the turntable
  const tray = new THREE.Group(); tray.position.set(C0.x + 0.36, TABLE_Y, C0.z - 0.02); tray.rotation.y = Math.PI / 2; group.add(tray);   // beside the table, out of the overview
  const tbase = box(0.36, 0.012, 0.09, MATERIALS.anod); tbase.position.y = 0.006; tray.add(tbase);
  const mtray = new THREE.Group(); mtray.position.set(C0.x, TABLE_Y, C0.z - 0.29); group.add(mtray);          // silvered faces toward the front of the table
  const mbase = box(0.27, 0.012, 0.09, MATERIALS.anod); mbase.position.y = 0.006; mtray.add(mbase);
  let nb = 0, nm = 0;
  const slots = BLOCKS.map((B) => {
    const g = new THREE.Group(); if (B.mirror) { g.position.set(-0.09 + nm++ * 0.09, 0.012, 0); mtray.add(g); } else { g.position.set(-0.135 + nb++ * 0.09, 0.012, 0); tray.add(g); }
    const m = new THREE.Mesh(blockGeometry(B.id), blockMaterial(B.id)); m.scale.set(0.8, 0.8, 0.8); m.rotation.y = Math.PI / 2; m.userData.sharedLook = true; m.renderOrder = 2; g.add(m);
    const pad = box(0.07, 0.002, 0.07, MATERIALS.black); pad.position.y = 0.001; g.add(pad);   // something solid to click
    return { g, m, B };
  });

  // ---------------------------------------------------------------- state
  const DEFAULTS = { phi: 30, block: "acrylic", wl: 650, white: false, slits: 1 };
  // pose: the part's reference point (the flat face's centre, or the mirror's vertex) and turn, in turntable coordinates
  // (m, rad; x toward the ray box's far side at table 0). placed: false = the table is empty. held: a part in the hand.
  // box: the laser ray box instead of the bulb (EXTENDED, explore only); filter: the bulb's colour filter (null = white)
  const S = { ...DEFAULTS, lab: false, pose: { x: 0, z: 0, psi: 0 }, placed: true, held: null, hand: null, src: { ...EXPLORE_SRC }, box: false, filter: null };
  const bulbOn = () => S.lab || !S.box;                                  // the class light source is on the table
  const wrap = (a) => ((a + 180) % 360 + 360) % 360 - 180;
  function setPhi(a) { S.phi = Math.round(wrap(a) * 10) / 10; }
  let shownPart = "acrylic";          // the part the mesh is built as (built so at startup)
  function setPart(id) {             // the mesh on (or above) the table shows this part
    S.block = id; $("blockSel").value = id;
    if (id === shownPart) return;      // already built: no rebuild (disposing GPU objects made before a context loss warns)
    shownPart = id; for (const m of [].concat(block.material)) m.dispose(); block.material = blockMaterial(id);
    block.geometry.dispose(); block.geometry = blockGeometry(id);
  }
  const traySlots = () => { const out = S.held || (S.placed ? S.block : null); for (const s of slots) s.m.visible = s.B.id !== out; };
  // one click, perfectly aligned (explore mode; the checks): the reference point on the centre, the face on the 90-90 line
  function mountBlock(id) { setPart(id); S.pose = { x: 0, z: 0, psi: 0 }; S.placed = true; S.held = null; traySlots(); }
  function clearTable() { S.placed = false; S.held = null; traySlots(); }
  // hand placement: pick a part up from its tray (whatever was on the table goes back). It comes into the hand square to
  // the table's lines, its face on the COMPONENT line toward the light, whatever angle the table is at (Cole 2026-10-14:
  // it used to keep its tray turn, 100 deg off). It is set down as it is held: no snap (Cole 2026-10-24: the student must
  // be able to turn it, e.g. square to a ray that is not quite on 0). In the hand the wheel turns it 0.5 deg (Shift 5);
  // on the table 0.1 deg (Shift 1) over its grab pad; , and . 0.1 deg; F half a turn.
  function pickUp(id) { setPart(id); S.placed = false; S.held = id; S.hand = { x: 0, z: 0.5, psi: 0, off: true }; traySlots(); }
  const wrapR = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const toTable = (p) => { const v = turn.worldToLocal(p.clone()); return { x: v.x, z: v.z }; };
  const onDisc = (q) => Math.hypot(q.x, q.z) <= R_TABLE - 0.01;
  const discY = () => turn.localToWorld(new THREE.Vector3(0, DISC_Y, 0)).y;
  const FINE = { step: 0.0002, turn: 0.1 * D2R };                                 // keyboard nudges: 0.2 mm, 0.1 deg
  const carry = {
    active: () => !!S.held, planeY: discY,
    move(p) { const q = toTable(p); S.hand.x = q.x; S.hand.z = q.z; S.hand.off = !onDisc(q); },
    drop(p) {
      if (!p) return; const q = toTable(p);
      if (!onDisc(q)) { S.held = null; traySlots(); return; }                   // set down off the platform: it goes back in its tray
      S.pose = { x: q.x, z: q.z, psi: S.hand.psi }; S.placed = true; S.held = null; traySlots();
    },
    turn(sign, shift) { S.hand.psi = wrapR(S.hand.psi + sign * (shift ? 5 : 0.5) * D2R); },
    describe: () => `${BLOCKS.find((B) => B.id === S.held).tag}<br>click on the platform to set it down (off it: back to the tray)<br>it comes square to the lines · scroll to turn it 0.5° (Shift 5°) · F half a turn`,
  };
  // slide the placed part: it keeps the offset between the cursor and its reference point from the moment it was grabbed
  let grabOff = { x: 0, z: 0 };
  function nudge(dx, dz, dpsi) {
    const x = S.pose.x + dx, z = S.pose.z + dz, r = Math.hypot(x, z), k = r > R_TABLE - 0.01 ? (R_TABLE - 0.01) / r : 1;
    S.pose = { x: x * k, z: z * k, psi: wrapR(S.pose.psi + dpsi) };
  }
  // keys while a part sits on the table: arrows slide it 0.2 mm (Shift 1 mm) across the screen, , and . turn it 0.1 deg
  // (Shift 1 deg); Esc puts a part in the hand back in its tray
  function onKey(e) {
    if (S.held && e.key === "Escape") { S.held = null; traySlots(); return true; }
    if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey && (S.held || S.placed)) {   // half a turn
      if (S.held) S.hand.psi = wrapR(S.hand.psi + Math.PI); else nudge(0, 0, Math.PI); return true; }
    if (!S.placed) return false;
    const m = e.shiftKey ? 5 : 1;
    if (e.key === "," || e.key === "<" || e.key === "." || e.key === ">") { nudge(0, 0, (e.key === "," || e.key === "<" ? 1 : -1) * FINE.turn * (e.shiftKey ? 10 : 1)); return true; }
    const dir = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key]; if (!dir) return false;
    // the screen's right and up, flattened onto the table, in turntable coordinates
    const r = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion), u = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    let f = new THREE.Vector3(u.x, 0, u.z); if (f.length() < 0.1) f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0);   // looking level: forward
    const w = r.setY(0).normalize().multiplyScalar(dir[0]).add(f.normalize().multiplyScalar(dir[1])).normalize();
    const a = turn.getWorldQuaternion(new THREE.Quaternion()).invert(), v = w.applyQuaternion(a);
    nudge(v.x * FINE.step * m, v.z * FINE.step * m, 0); return true;
  }
  $("blockSel").innerHTML = BLOCKS.map((B) => `<option value="${B.id}">${B.tag}</option>`).join("");
  function lightMenu() {             // the bulb's filters, or the ray box's lasers
    const box = !bulbOn(), list = box ? LIGHTS : FILTERS, val = box ? String(S.wl) : S.filter === null ? "white" : String(S.filter);
    $("lightSel").innerHTML = list.map((L) => `<option value="${L.id}">${L.tag}</option>`).join(""); $("lightSel").value = val;
    $("lightSel").disabled = S.lab || (box && S.white); $("slitSel").disabled = S.lab || !box; $("tWhite").disabled = S.lab || !box; $("tBox").disabled = S.lab;
  }
  $("blockSel").addEventListener("change", (e) => mountBlock(e.target.value));
  $("lightSel").addEventListener("change", (e) => { const v = e.target.value; if (bulbOn()) S.filter = v === "white" ? null : +v; else S.wl = +v; });
  $("tBox").addEventListener("change", (e) => { S.box = e.target.checked; lightMenu(); });
  $("slitSel").innerHTML = SLITS.map((n) => `<option value="${n}">${n} slit${n > 1 ? "s" : ""}</option>`).join("");
  function setSlits(n) { S.slits = n; $("slitSel").value = n; const on = slitOffsets(n); for (const s of slitMeshes) s.m.visible = on.some((z) => Math.abs(z - s.z) < 1e-9); }
  $("slitSel").addEventListener("change", (e) => setSlits(+e.target.value));
  setSlits(S.slits);
  lightMenu();
  // EXTENDED: white light, dispersion
  $("tWhite").addEventListener("change", (e) => { S.white = e.target.checked; lightMenu(); });
  mountBlock(S.block);

  // ---------------------------------------------------------------- beams (a glowing ribbon on the protractor)
  // The beam is K rays across its width (traceBeam). Neighbouring rays that took the same path are joined by a
  // ribbon, and the ribbon's brightness at each end is the power per unit width there: I (BEAM_W/K) / spacing. So a
  // beam that stays parallel shows 2.2 I^0.7 and one that fans out dims as it spreads, as a real beam does. No floor:
  // a 4 % reflection is faint, and the Fresnel ramp toward the critical angle is visible. One mesh, rebuilt on change.
  const ribbonGeo = new THREE.BufferGeometry();
  const ribbon = new THREE.Mesh(ribbonGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide, userData: { glow: true } }));
  ribbon.renderOrder = 4; ribbon.frustumCulled = false; group.add(ribbon);
  let rpos = [], rcol = [];
  const glow = (Iw) => 2.2 * Math.pow(Math.max(0, Iw), 0.7);
  function quad(a0, b0, a1, b1, rgb, ga0, gb0, ga1, gb1) {          // ray 0 from a0 to b0, ray 1 from a1 to b1 (xz)
    const V = [[a0, ga0], [b0, gb0], [b1, gb1], [a0, ga0], [b1, gb1], [a1, ga1]];
    for (const [q, g] of V) { rpos.push(q[0], BEAM_Y, q[1]); rcol.push(rgb[0] * g, rgb[1] * g, rgb[2] * g); }
  }
  // the ribbon's two outer edges also get a 3 mm vertical wall: a flat ribbon seen from a low camera is thinner than a
  // pixel and breaks into dashes (the old slab beams were 3 mm tall for the same reason)
  const EDGE_H = 0.001, EDGE_G = 0.45;              // 2 mm tall; dimmer than the ribbon (two edges add, and both bloom)
  function vquad(p0, p1, rgb, g0, g1) {
    const V = [[p0, -1, g0], [p1, -1, g1], [p1, 1, g1], [p0, -1, g0], [p1, 1, g1], [p0, 1, g0]];
    for (const [q, s, g] of V) { rpos.push(q[0], BEAM_Y + s * EDGE_H, q[1]); rcol.push(rgb[0] * g, rgb[1] * g, rgb[2] * g); }
  }
  // a beam's spot on the screen, between two neighbouring rays' end points: along the arc (not a chord), SPOT_H above and
  // below the beam's height, brightest on the beam's line and fading to nothing at the top and bottom, 0.5 mm off the wall
  const SPOT_H = 0.007, SPOT_G = 1.6;                           // 7 mm up and down; a lit patch on matte white reads brighter than the beam in air
  function spot(q0, q1, rgb, g0, g1) {
    const C = [C0.x, C0.z], a0 = Math.atan2(q0[1] - C[1], q0[0] - C[0]); let da = Math.atan2(q1[1] - C[1], q1[0] - C[0]) - a0;
    da = Math.atan2(Math.sin(da), Math.cos(da)); const N = Math.max(1, Math.ceil(Math.abs(da) / (2 * D2R))), r = R_SCR - 0.002;
    const P = (k) => { const a = a0 + da * k / N; return [C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)]; };
    for (let k = 0; k < N; k++) {
      const p0 = P(k), p1 = P(k + 1), h0 = g0 + (g1 - g0) * k / N, h1 = g0 + (g1 - g0) * (k + 1) / N;
      for (const s of [-1, 1]) {
        const V = [[p0, 0, h0], [p1, 0, h1], [p1, s, 0], [p0, 0, h0], [p1, s, 0], [p0, s, 0]];
        for (const [q, y, g] of V) { rpos.push(q[0], BEAM_Y + y * SPOT_H, q[1]); rcol.push(rgb[0] * g, rgb[1] * g, rgb[2] * g); }
      }
    }
  }
  function drawBundle(rays, rgb, scale, dw) {
    const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    for (let i = 0; i + 1 < rays.length; i++) for (const [k, s0] of rays[i]) {
      const s1 = rays[i + 1].get(k); if (!s1) continue;
      const edge0 = i === 0 || !rays[i - 1].has(k), edge1 = i + 2 >= rays.length || !rays[i + 2].has(k);
      const I = (s0.I + s1.I) / 2; if (I < 0.002) continue;
      // in short pieces: power per width falls as 1/spacing, which a single long quad's linear colour blend can't follow;
      // as many pieces as the spread needs (a parallel stretch is one piece, a fan near grazing up to 16) - R3
      const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      const wAt = (t) => Math.max(d(lerp(s0.a, s0.b, t), lerp(s1.a, s1.b, t)), dw * 0.3);
      const gAt = (t) => Math.min(4, glow(I * dw / wAt(t))) * scale;
      // two rays that cross (a curved mirror's focus) would make a twisted quad: split the strip at the crossing
      const L0 = d(s0.a, s0.b) || 1, ux = (s0.b[0] - s0.a[0]) / L0, uz = (s0.b[1] - s0.a[1]) / L0;
      const side = (t) => { const p = lerp(s0.a, s0.b, t), q = lerp(s1.a, s1.b, t); return ux * (q[1] - p[1]) - uz * (q[0] - p[0]); };
      const sA = side(0), sB = side(1), ranges = sA * sB < 0 ? [[0, sA / (sA - sB)], [sA / (sA - sB), 1]] : [[0, 1]];
      for (const [ta, tb] of ranges) {
        const NS = Math.min(16, Math.max(1, Math.ceil(Math.abs(Math.log2(wAt(tb) / wAt(ta))) * 4)));
        for (let j = 0; j < NS; j++) { const t0 = ta + (tb - ta) * j / NS, t1 = ta + (tb - ta) * (j + 1) / NS, g0 = gAt(t0), g1 = gAt(t1);
          quad(lerp(s0.a, s0.b, t0), lerp(s0.a, s0.b, t1), lerp(s1.a, s1.b, t0), lerp(s1.a, s1.b, t1), rgb, g0, g1, g0, g1);
          if (edge0) vquad(lerp(s0.a, s0.b, t0), lerp(s0.a, s0.b, t1), rgb, g0 * EDGE_G, g1 * EDGE_G);
          if (edge1) vquad(lerp(s1.a, s1.b, t0), lerp(s1.a, s1.b, t1), rgb, g0 * EDGE_G, g1 * EDGE_G); }
      }
      if (s0.b.scr && s1.b.scr) { const g = Math.min(4, gAt(1) * SPOT_G); spot(s0.b, s1.b, rgb, g, g); }
    }
  }
  function drawSeg(a, b, rgb, I, scale) {                          // a single beam of width BEAM_W (grazing case)
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / L * BEAM_W / 2, nz = (b[0] - a[0]) / L * BEAM_W / 2, g = glow(I) * scale;
    quad([a[0] - nx, a[1] - nz], [b[0] - nx, b[1] - nz], [a[0] + nx, a[1] + nz], [b[0] + nx, b[1] + nz], rgb, g, g, g, g);
  }
  const P3 = (x, z) => new THREE.Vector3(x, BEAM_Y, z);
  let dbg = null;
  // trace one wavelength: returns the segments [from(xz), to(xz), I, inside?] and the angles
  // where the part sits (world xz): O its reference point, nOut the outward normal of its flat/silvered face (toward the
  // light at table 0), tg along the face. A perfectly mounted part has O = the table centre and nOut at the table angle.
  function partFrame() {
    const phi = S.phi * D2R, c = Math.cos(phi), sn = Math.sin(phi), b = phi + S.pose.psi;
    const O = [C0.x + S.pose.x * c + S.pose.z * sn, C0.z - S.pose.x * sn + S.pose.z * c], nOut = [-Math.cos(b), Math.sin(b)];
    return { O, nOut, tg: [nOut[1], -nOut[0]], beta: b };
  }
  const aligned = () => S.pose.x === 0 && S.pose.z === 0 && S.pose.psi === 0;
  const emptyTrace = () => { const c = centreRay(); if (!c) return darkTrace(); return { segs: [[c.p, outTo(c.p, c.u), 1, false]], th1: null, th2: null, n: null, empty: true }; };
  // what the degree ring shows for a beam: where it crosses the scale (radius R_RING about the table centre), as the angle
  // from the printed normal (0-0) line, folded 0..90 like the printed numbers. A perfectly placed part sends every beam
  // through the centre, so the ring reads the true angles; a misplaced one does not, and the readings drift.
  const R_RING = R_TABLE * 0.96;
  function ringRead(seg, outward) {
    const C = [C0.x, C0.z], a = seg[0], b = seg[1], d = [b[0] - a[0], b[1] - a[1]], w = [a[0] - C[0], a[1] - C[1]];
    const A = d[0] * d[0] + d[1] * d[1], B = w[0] * d[0] + w[1] * d[1], Cq = w[0] * w[0] + w[1] * w[1] - R_RING * R_RING, D = B * B - A * Cq;
    if (D < 0) return null;
    const t = (outward ? -B + Math.sqrt(D) : -B - Math.sqrt(D)) / A; if (t < 0 || t > 1) return null;
    if (outward && Cq > 0) return null;                    // must start inside the ring to cross it going out
    const q = [w[0] + d[0] * t, w[1] + d[1] * t], phi = S.phi * D2R, nT = [-Math.cos(phi), Math.sin(phi)];
    return Math.acos(Math.min(1, Math.abs(q[0] * nT[0] + q[1] * nT[1]) / R_RING)) / D2R;
  }
  // ring readings along one traced ray (a Map key -> segment): incident (going in), and the first outward crossing of the
  // transmitted and the reflected chains
  function ringReadings(ray, chains) {
    const seg = (k) => { const v = ray.get(k); return v ? [v.a, v.b] : null; }, out = { i: seg("") ? ringRead(seg(""), false) : null };
    for (const [name, keys] of Object.entries(chains)) { out[name] = null; for (const k of keys) { const sg = seg(k); const r = sg && ringRead(sg, true); if (r !== null && r !== undefined) { out[name] = r; break; } } }
    return out;
  }
  // the centre ray of a part that is NOT perfectly placed: the general tracer, reading the angles where it meets the faces
  function traceGeneral(wl) {
    const ev = [], Bd = traceBeam(wl, [{ ...centreRay(), w: 1 }], 1e-6, ev), n = indexAt(S.block, wl), first = ev.find((e) => e.key === "");
    const ring = ringReadings(Bd.rays[0], first && !first.flat ? { t: ["tt"], r: ["trt", "tr"] } : { t: ["tt", "t"], r: ["r"] });
    const base = { segs: Bd.segs, n, general: true, ring };
    if (!first) return { ...base, th1: null, th2: null, miss: true };
    const deg = (ci) => Math.acos(Math.min(1, ci)) / D2R;
    if (first.flat) { const th1 = deg(first.ci); return { ...base, th1, th2: Math.asin(Math.sin(th1 * D2R) / n) / D2R, from: "flat" }; }
    const fl = ev.find((e) => e.key === "t" && e.flat);            // in through the curved face, then the flat face from inside
    const entry = deg(first.ci);                                    // 0 when the beam enters the curved face radially (aimed at the centre)
    if (!fl) return { ...base, th1: null, th2: null, from: "curved", entry, noFlat: true };
    const th1 = deg(fl.ci); return { ...base, th1, th2: fl.tir ? null : Math.asin(Math.min(1, n * Math.sin(th1 * D2R))) / D2R, from: "curved", entry };
  }
  function trace(wl) {
    if (bulbOn() && !centreRay()) return darkTrace();                   // the mask covers every slit
    if (!S.placed) return emptyTrace();
    if (isMirror(S.block)) return traceMirror();
    if (!aligned() || bulbOn()) return traceGeneral(wl);           // the bulb: its own ray, wherever it goes
    const n = indexAt(S.block, wl), phi = S.phi * D2R, O = [C0.x, C0.z];
    const nOut = [-Math.cos(phi), Math.sin(phi)];            // flat face's outward normal (away from the curved side), world xz
    const d = [1, 0], dn = d[0] * nOut[0] + d[1] * nOut[1], segs = [];
    const R0 = ((n - 1) / (n + 1)) ** 2;                     // curved face, normal incidence
    const add = (p, q) => [p[0] + q[0], p[1] + q[1]], mul = (v, k) => [v[0] * k, v[1] * k];
    // refraction / reflection at O, light travelling along u, medium n1 -> n2, normal N toward the incident side
    const atFace = (u, N, n1, n2) => { const ci = -(u[0] * N[0] + u[1] * N[1]), eta = n1 / n2, k = 1 - eta * eta * (1 - ci * ci);
      const r = add(u, mul(N, 2 * ci)), F = fresnel(n1, n2, Math.acos(Math.min(1, ci)));
      return { ci, r, t: k < 0 ? null : add(mul(u, eta), mul(N, eta * ci - Math.sqrt(k))), F }; };
    let th1, th2, I1 = 1, from = "flat";
    if (Math.abs(Math.abs(S.phi) - 90) < 0.05) return { segs: [[[BOX_X, C0.z], O, 1, false]], th1: 90, th2: null, n, grazing: true };
    if (dn < 0) {                                            // air -> block through the flat face at O
      segs.push([[BOX_X, C0.z], O, 1, false]);
      const f = atFace(d, nOut, 1, n); th1 = Math.acos(f.ci) / D2R; th2 = Math.asin(Math.sin(th1 * D2R) / n) / D2R;
      segs.push([O, add(O, mul(f.r, L_OUT)), f.F.R, false]);
      segs.push([O, add(O, mul(f.t, R_BLOCK)), f.F.T, true], [add(O, mul(f.t, R_BLOCK)), add(O, mul(f.t, L_OUT)), f.F.T * (1 - R0), false]);
    } else {                                                 // in through the curved face (radial), block -> air at O
      from = "curved";
      const E = [O[0] - R_BLOCK, O[1]]; segs.push([[BOX_X, C0.z], E, 1, false]); I1 = 1 - R0; segs.push([E, O, I1, true]);
      const N = [-nOut[0], -nOut[1]], f = atFace(d, N, n, 1); th1 = Math.acos(f.ci) / D2R;
      if (f.t) { th2 = Math.asin(Math.min(1, n * Math.sin(th1 * D2R))) / D2R; segs.push([O, add(O, mul(f.t, L_OUT)), I1 * f.F.T, false]); } else th2 = null;
      segs.push([O, add(O, mul(f.r, R_BLOCK)), I1 * f.F.R, true], [add(O, mul(f.r, R_BLOCK)), add(O, mul(f.r, L_OUT)), I1 * f.F.R * (1 - R0), false]);
    }
    return { segs, th1, th2, n, from };
  }
  // the beam as drawn: K parallel rays across the beam's width, each traced through the real half-disc (the curved face
  // is a lens, so off-centre rays meet the flat face a little off the centre ray's angle: ±0.6° for acrylic) and split
  // by Fresnel at every face. Near the critical angle part of the beam is already trapped while the rest still leaves,
  // and the leaving part fans out along the face: the gradual onset seen on a real ray table.
  const BEAM_W = 0.0016;                                       // drawn width of a single segment (grazing case)
  // ray i of K across the beam from slit offset off (a parallel beam BEAM_W wide)
  const beamRay = (i, K, off) => ({ p: [BOX_X, C0.z + off + (K > 1 ? ((i + 0.5) / K - 0.5) * BEAM_W : 0)], u: [1, 0] });
  const boxBeam = (K, off) => Array.from({ length: K }, (_, i) => ({ ...beamRay(i, K, off), w: 1 }));
  // THE LAB SOURCE's beams: light from every point across the filament's width (as seen from the slit) passes through
  // each open slit, so each beam is a fan pivoting on its slit, +-atan(h/d) wide (h: half the filament's projected width,
  // d: filament to slit), tilted by where the slit sits off the filament's line. Brightness falls as 1/d^2.
  const filHalf = () => (FIL_L * Math.abs(Math.sin(S.src.psi)) + FIL_D * Math.abs(Math.cos(S.src.psi))) / 2;
  function slitPass(k) {                                                       // the part of slit k the mask leaves open
    if (S.src.mask === null) return 1;
    const y = slitY(k), lo = Math.max(y - SLIT_W / 2, S.src.mask - MASK_OPEN / 2), hi = Math.min(y + SLIT_W / 2, S.src.mask + MASK_OPEN / 2);
    return Math.max(0, hi - lo) / SLIT_W;
  }
  const filament = () => [X_SLIT - S.src.d, C0.z];
  const srcBright = () => Math.min(2, (0.05 / S.src.d) ** 2);
  function labBeams(K) {
    const F = filament(), h = filHalf(), B = srcBright(), out = [];
    for (let k = 0; k < N_SLIT; k++) {
      const w = slitPass(k); if (w < 1e-3) continue;
      const P = [X_SLIT, C0.z + S.src.ys + slitY(k)];
      const rays = Array.from({ length: K }, (_, j) => { const f = [F[0], F[1] + (K > 1 ? ((j + 0.5) / K - 0.5) * 2 * h : 0)], v = [P[0] - f[0], P[1] - f[1]], L = Math.hypot(...v);
        return { p: P, u: [v[0] / L, v[1] / L], w: B * w }; });
      out.push({ off: slitY(k), rays });
    }
    return out;
  }
  // the ray the readouts follow: explore, the ray box's centre ray; lab, the filament's centre through the open slit (the
  // most open one, the centre one on a tie), or null when the mask covers every slit (no light reaches the table)
  function centreRay(off = 0) {
    if (!bulbOn()) return { p: [BOX_X, C0.z + off], u: [1, 0], off };
    let k = -1, best = 1e-3; for (let i = 0; i < N_SLIT; i++) { const w = slitPass(i); if (w > best + 1e-12 || (Math.abs(w - best) <= 1e-12 && k >= 0 && Math.abs(slitY(i)) < Math.abs(slitY(k)))) { best = w; k = i; } }
    if (k < 0) return null;
    const F = filament(), P = [X_SLIT, C0.z + S.src.ys + slitY(k)], v = [P[0] - F[0], P[1] - F[1]], L = Math.hypot(...v);
    return { p: P, u: [v[0] / L, v[1] / L], off: slitY(k) };
  }
  const darkTrace = () => ({ segs: [], th1: null, th2: null, n: null, empty: true, dark: true });
  // where a ray leaving the apparatus stops: on the screen (q.scr = true), or, heading back through the gap toward the
  // ray box, at the box's face
  const inGap = (q) => Math.abs(Math.atan2(q[1] - C0.z, -(q[0] - C0.x))) < SCR_GAP;
  function exitPoint(p, u) {
    const O = [C0.x, C0.z], w = [p[0] - O[0], p[1] - O[1]], Rin = R_SCR - 0.0015, bq = w[0] * u[0] + w[1] * u[1];
    const t = -bq + Math.sqrt(Math.max(0, bq * bq - (w[0] * w[0] + w[1] * w[1]) + Rin * Rin)), q = [p[0] + u[0] * Math.max(t, 0.002), p[1] + u[1] * Math.max(t, 0.002)];
    if (!inGap(q)) { q.scr = true; return q; }
    const xStop = bulbOn() ? X_SLIT + 0.003 : BOX_X + 0.001;        // the bulb: the slit holder stops it; the ray box: its face
    const tb = u[0] < -1e-9 ? (xStop - p[0]) / u[0] : -1;
    const tt = bulbOn() ? (tb > 0 ? tb : t) : Math.max(tb, t);       // the holder is inside the circle; the box is outside it
    return [p[0] + u[0] * tt, p[1] + u[1] * tt];
  }
  // Imin: branches weaker than this are not followed (drawn below visibility; white light's colours are 1/8 each)
  // the mirrors: the silvered face reflects (angle out = angle in from the local normal, MIRROR_R of the power); a beam
  // reaching the backing or an end of the plate stops there. Same for every wavelength. Segments as trace(): [from, to, I, inside?]
  // mirrorHit: where a ray first ENTERS the solid plate, and through which face. Plate coordinates: a = across (+ toward
  // the light side, along nOut), b = along the face (|b| <= R_BLOCK).
  //  - plane: a slab, silvered face at a = 0, backing at a = -MIRROR_T (a beam near grazing on the back side meets the
  //    plate's end, not its back face)
  //  - curved: the shell between the silvered circle (radius MIRROR_RC about the centre of curvature, through the vertex
  //    at the turntable centre) and the backing circle MIRROR_T behind it, cut square at |b| = R_BLOCK
  // Returns { q, front, kind ("s" silvered, "b" backing, "e" end), N (unit normal of the silvered face, toward the light) }.
  function mirrorHit(p, u, id) {
    const { O, nOut, tg } = partFrame(), w = [p[0] - O[0], p[1] - O[1]];
    const a0 = w[0] * nOut[0] + w[1] * nOut[1], ua = u[0] * nOut[0] + u[1] * nOut[1];
    const b0 = w[0] * tg[0] + w[1] * tg[1], ub = u[0] * tg[0] + u[1] * tg[1];
    const sc = curveOf(id);
    if (!sc) {
      const slab = (x0, ux, lo, hi) => { if (Math.abs(ux) < 1e-15) return x0 >= lo && x0 <= hi ? [-Infinity, Infinity] : [Infinity, -Infinity];
        const t1 = (lo - x0) / ux, t2 = (hi - x0) / ux; return [Math.min(t1, t2), Math.max(t1, t2)]; };
      const [ta0, ta1] = slab(a0, ua, -MIRROR_T, 0), [tb0, tb1] = slab(b0, ub, -R_BLOCK, R_BLOCK);
      const tin = Math.max(ta0, tb0), tout = Math.min(ta1, tb1);
      if (!(tin < tout) || tin <= 1e-9) return null;
      const front = ta0 >= tb0 && ua < 0;                       // entered across the silvered face
      return { q: [p[0] + u[0] * tin, p[1] + u[1] * tin], front, kind: front ? "s" : ta0 >= tb0 ? "b" : "e", N: nOut };
    }
    // curved: centre of curvature at a = sc * RC (on the light side for concave), in (a, b) coordinates
    const RC = MIRROR_RC, rB = RC + sc * MIRROR_T, lo = Math.min(RC, rB), hi = Math.max(RC, rB), ca = sc * RC;
    const inShell = (A, Bb) => { const r = Math.hypot(A - ca, Bb); return r >= lo - 1e-12 && r <= hi + 1e-12 && Math.abs(Bb) <= R_BLOCK + 1e-12 && sc * A < RC; };
    const cand = [];
    for (const [r, kind] of [[RC, "s"], [rB, "b"]]) {
      const wa = a0 - ca, bq = wa * ua + b0 * ub, cq = wa * wa + b0 * b0 - r * r, disc = bq * bq - cq;
      if (disc >= 0) for (const t of [-bq - Math.sqrt(disc), -bq + Math.sqrt(disc)]) cand.push([t, kind]);
    }
    if (Math.abs(ub) > 1e-15) for (const e of [-R_BLOCK, R_BLOCK]) cand.push([(e - b0) / ub, "e"]);
    cand.sort((x, y) => x[0] - y[0]);
    for (const [t, kind] of cand) {
      if (t <= 1e-9) continue;
      const tt = t + 1e-7; if (!inShell(a0 + ua * tt, b0 + ub * tt)) continue;     // the ray is entering the plate here
      const q = [p[0] + u[0] * t, p[1] + u[1] * t], A = a0 + ua * t, Bb = b0 + ub * t;
      const na = -sc * (A - ca) / RC, nb = -sc * Bb / RC;          // silvered-face normal toward the light side
      return { q, front: kind === "s", kind, N: [na * nOut[0] + nb * tg[0], na * nOut[1] + nb * tg[1]] };
    }
    return null;
  }
  const outTo = exitPoint;
  // one ray off the mounted mirror, bounce after bounce (a concave mirror can return a ray onto itself near grazing)
  function mirrorRay(src, d) {
    const segs = [], hits = []; let p = src, u = d, I = 1;
    for (let k = 0; k < 4; k++) {
      const h = mirrorHit(p, u, S.block);
      if (!h) { segs.push([p, outTo(p, u), I, false]); break; }
      segs.push([p, h.q, I, false]); hits.push({ ...h, u });
      if (!h.front) break;
      u = reflect(u, h.N); p = h.q; I *= MIRROR_R;
    }
    return { segs, hits };
  }
  const angleTo = (u, N) => Math.acos(Math.min(1, Math.abs(u[0] * N[0] + u[1] * N[1]))) / D2R;
  function traceMirror(off = 0) {
    const c = centreRay(off), { segs, hits } = mirrorRay(c.p, c.u);
    const ring = ringReadings(new Map(segs.map((sg, k) => ["r".repeat(k), { a: sg[0], b: sg[1] }])), { r: ["r"] });
    const base = { n: null, mirror: true, curve: curveOf(S.block), from: "mirror", ring };
    if (!hits.length) return { segs, th1: 90, th2: null, grazing: aligned(), miss: !aligned(), ...base };
    const h = hits[0], th1 = angleTo(h.u, h.N);
    if (!h.front) return { segs, th1, th2: null, back: h.kind === "b", edge: h.kind === "e", ...base };
    return { segs, th1, th2: angleTo(reflect(h.u, h.N), h.N), ...base };
  }
  function mirrorBundle(beam) {
    const segs = [], rays = [];
    for (const { p: src, u, w } of beam) {
      const R = mirrorRay(src, u), ray = new Map(); rays.push(ray);
      R.segs.forEach((sg, k) => { segs.push([sg[0], sg[1], sg[2] * w, sg[3]]); ray.set("r".repeat(k), { a: sg[0], b: sg[1], I: sg[2] * w }); });
    }
    return { segs, rays, trappedFrac: 0, leaveFrac: 0 };
  }
  // beam: its rays [{ p, u, w (starting power) }]. ev (optional): every face meeting is recorded { key, flat, ci, tir }
  // trappedFrac / leaveFrac: of the beam's starting power
  function traceBeam(wl, beam, Imin = 0.002, ev = null) {
    const W = beam.reduce((s, r) => s + r.w, 0) || 1;
    if (!S.placed) { const rays = [], segs = []; for (const { p: a, u, w } of beam) { const b = outTo(a, u); segs.push([a, b, w, false]); rays.push(new Map([["", { a, b, I: w }]])); } return { segs, rays, trappedFrac: 0, leaveFrac: 0 }; }
    if (isMirror(S.block)) return mirrorBundle(beam);
    const n = indexAt(S.block, wl), { O, nOut } = partFrame(), T0 = [C0.x, C0.z];
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1], sub = (p, q) => [p[0] - q[0], p[1] - q[1]], at = (p, u, t) => [p[0] + u[0] * t, p[1] + u[1] * t];
    const out = [], rays = []; let ray = null, leave = 0, trapped = 0;
    // first boundary hit along p + u t (t > eps): the flat chord or the curved arc
    const hit = (p, u, inside) => {
      let best = null; const eps = 1e-7;
      const dn = dot(u, nOut);
      if (Math.abs(dn) > 1e-12) { const t = dot(sub(O, p), nOut) / dn, q = at(p, u, t); if (t > eps && Math.hypot(...sub(q, O)) <= R_BLOCK + 1e-9) best = { t, q, N: nOut, flat: true }; }
      const w = sub(p, O), bq = dot(w, u), cq = dot(w, w) - R_BLOCK * R_BLOCK, disc = bq * bq - cq;
      if (disc >= 0) for (const t of inside ? [-bq + Math.sqrt(disc)] : [-bq - Math.sqrt(disc), -bq + Math.sqrt(disc)]) {
        const q = at(p, u, t); if (t > eps && dot(sub(q, O), nOut) <= 1e-9 && (!best || t < best.t)) { best = { t, q, N: [(q[0] - O[0]) / R_BLOCK, (q[1] - O[1]) / R_BLOCK], flat: false }; break; } }
      return best;
    };
    const go = (p, u, inside, I, depth, key) => {
      if (I < Imin) return;
      const h = depth < 4 && (inside || depth === 0) ? hit(p, u, inside) : null;
      if (!h) {                                                // leaves: on to the screen (or back through its gap to the box)
        const q = exitPoint(p, u); out.push([p, q, I, inside]); ray.set(key, { a: p, b: q, I }); return;
      }
      out.push([p, h.q, I, inside]); ray.set(key, { a: p, b: h.q, I });
      let N = h.N; if (dot(u, N) > 0) N = [-N[0], -N[1]];     // normal toward the incident side
      const n1 = inside ? n : 1, n2 = inside ? 1 : n, ci = -dot(u, N), eta = n1 / n2, k = 1 - eta * eta * (1 - ci * ci);
      const F = fresnel(n1, n2, Math.acos(Math.min(1, ci)));
      // the refracted ray: the FIRST meeting with the flat face from inside (key "t": in through the curved face). Later
      // meetings, after bounces inside the half-disc, are stray light leaving elsewhere, not the ray being watched
      if (inside && h.flat && key === "t") { if (k < 0) trapped += I; else leave += I * F.T; }
      if (ev) ev.push({ key, flat: h.flat, ci, tir: k < 0 });
      go(h.q, [u[0] + 2 * ci * N[0], u[1] + 2 * ci * N[1]], inside, I * F.R, depth + 1, key + "r");
      if (k >= 0) go(h.q, [eta * u[0] + (eta * ci - Math.sqrt(k)) * N[0], eta * u[1] + (eta * ci - Math.sqrt(k)) * N[1]], !inside, I * F.T, depth + 1, key + "t");
    };
    for (const { p, u, w } of beam) { ray = new Map(); rays.push(ray); go(p, u, false, w, 0, ""); }
    return { segs: out, rays, trappedFrac: trapped / W, leaveFrac: leave / W };
  }
  let key = "";
  function frame() {
    turn.rotation.y = S.phi * D2R;
    const P = S.held ? S.hand : S.pose; block.visible = !!S.held || S.placed;
    // a part in the hand floats 12 mm up over the platform, 5 cm off it (lifted over the screen)
    block.position.set(P.x, DISC_Y + 0.0005 + (S.held ? (S.hand.off ? 0.05 : 0.012) : 0), P.z); block.rotation.y = P.psi;
    syncSource();
    const k = `${S.phi}|${S.block}|${S.wl}|${S.white}|${S.slits}|${S.placed}|${S.pose.x}|${S.pose.z}|${S.pose.psi}|${S.lab}|${S.box}|${S.filter}|${S.src.d}|${S.src.psi}|${S.src.ys}|${S.src.mask}`; if (k === key) return; key = k;
    rpos = []; rcol = [];
    const bulb = bulbOn(), white = bulb ? S.lab || S.filter === null : S.white;   // the bulb is white unless filtered (lab: bare)
    const wls = white ? WHITE8 : [bulb ? S.filter : S.wl];
    dbg = { wls: [] };
    for (const wl of wls) {
      // white: 8 beams of 1/8 strength each (1.4/8 so the sum reads white), so their colours stay apart where they separate;
      // 7 rays per colour (56 in all) instead of 11: the white rebuild near grazing cost 3.4 ms a turn (R3)
      // the centre ray gives the readouts (and the checks); the bundle is what is drawn. With 3 or 5 slits each beam gets fewer
      // rays (white: 3, one colour: 7): white light through a block with 5 slits at 7 rays took 10-27 ms a turn
      const T = trace(wl), rgb = wavelengthRGB(wl), scale = white ? 1.4 / wls.length : 1;
      // one beam per slit; the centre slit's bundle is `bundle` (the readouts use it), every slit's in `bundles`.
      // Lab: the source's open slits (9 rays per colour per beam; 4 when several slits are open)
      let bundles;
      if (bulb) {
        const K = labBeams(1).length > 1 ? 4 : 9;
        bundles = labBeams(K).map((b) => { const Bd = traceBeam(wl, b.rays, 0.012 * b.rays[0].w); drawBundle(Bd.rays, rgb, scale, BEAM_W / K); return { ...Bd, off: b.off }; });   // cut-off relative to the beam's power
      } else {
        const K = S.slits > 1 ? (white ? 3 : 7) : white ? 7 : 11;
        bundles = slitOffsets(S.slits).map((off) => {
          if (off === 0 && T.grazing) { drawSeg(...T.segs[0].slice(0, 2), rgb, 1, scale); return { segs: T.segs, rays: [], trappedFrac: 0, leaveFrac: 0, off }; }
          const Bd = traceBeam(wl, boxBeam(K, off), white ? 0.012 : 0.002); drawBundle(Bd.rays, rgb, scale, BEAM_W / K); return { ...Bd, off };
        });
      }
      const slitRays = isMirror(S.block) && !bulb ? slitOffsets(S.slits).map((off) => traceMirror(off)) : null;   // each slit's centre ray (focus readout)
      const none = { segs: [], rays: [], trappedFrac: 0, leaveFrac: 0, off: 0 };
      const cOff = bulb ? (centreRay()?.off ?? 0) : 0;                   // the beam the readouts follow
      dbg.wls.push({ wl, ...T, bundle: bundles.find((b) => Math.abs(b.off - cOff) < 1e-12) || none, bundles, slitRays });
    }
    // reuse the buffers (grown when needed) instead of allocating new ones on every turn of the table (R3)
    for (const [name, arr] of [["position", rpos], ["color", rcol]]) {
      let at = ribbonGeo.getAttribute(name);
      if (!at || at.array.length < arr.length) { at = new THREE.BufferAttribute(new Float32Array(Math.ceil(arr.length * 1.5 / 3) * 3), 3); at.setUsage(THREE.DynamicDrawUsage); ribbonGeo.setAttribute(name, at); }
      at.array.set(arr); at.needsUpdate = true;
    }
    ribbonGeo.setDrawRange(0, rpos.length / 3);
  }

  // ---------------------------------------------------------------- views, controls, labels
  const views = {
    overview: () => [[C0.x + 0.05, TABLE_Y + 0.42, C0.z + 0.62], [C0.x - 0.02, TABLE_Y + 0.02, C0.z], [0.78, 0.3]],
    protractor: () => [[C0.x + 0.001, TABLE_Y + 0.55, C0.z + 0.03], [C0.x, DISC_Y, C0.z], [0.30, 0.30]],
    block: () => [[C0.x + 0.12, DISC_Y + 0.12, C0.z + 0.16], [C0.x, DISC_Y + 0.01, C0.z], [0.14, 0.1]],
    raybox: () => [[BOX_X + 0.12, TABLE_Y + 0.14, C0.z + 0.2], [BOX_X - 0.04, TABLE_Y + 0.03, C0.z], [0.18, 0.1]],
    tray: () => [[tray.position.x + 0.22, TABLE_Y + 0.24, tray.position.z + 0.14], [tray.position.x, TABLE_Y + 0.02, tray.position.z], [0.14, 0.38]],
    mirrors: () => [[mtray.position.x + 0.02, TABLE_Y + 0.22, mtray.position.z + 0.26], [mtray.position.x, TABLE_Y + 0.02, mtray.position.z], [0.32, 0.12]],
    source: () => [[X_SLIT - 0.02, TABLE_Y + 0.17, C0.z + 0.22], [X_SLIT - 0.07, TABLE_Y + 0.05, C0.z], [0.24, 0.15]],   // the light source and slit, its knob clear of the title
  };
  const viewNames = { overview: "Overview", protractor: "Protractor (top)", block: "Block", raybox: "Ray box", source: "Light source + slit (lab)", tray: "Block tray", mirrors: "Mirror tray" };
  const registry = [
    { id: "snell:part", name: "Part on the table", objects: [block], kind: "plane", planeY: discY,
      grab: (p) => { const q = toTable(p); grabOff = { x: S.pose.x - q.x, z: S.pose.z - q.z }; },
      moveTo: (p) => { const q = toTable(p); nudge(q.x + grabOff.x - S.pose.x, q.z + grabOff.z - S.pose.z, 0); },
      turn: (sign, shift) => nudge(0, 0, sign * (shift ? 1 : 0.1) * D2R),   // on the table: fine (Cole 2026-10-24)
      describe: () => `${BLOCKS.find((B) => B.id === S.block).tag}<br>drag to slide it · scroll to turn it 0.1° (Shift 1°) · F half a turn<br>arrow keys 0.2 mm · , and . turn 0.1°` },
    { id: "snell:table", name: "Protractor table", objects: [disc, rim, knob], centre: turn, kind: "rotary", wheelStep: 0.5 * D2R,
      rotate: (d) => setPhi(S.phi - d / D2R), describe: () => `Table turned to <b>${S.phi.toFixed(1)}°</b><br>drag the table around, or scroll (0.5° a notch)` },
    // the lab source (hidden in explore mode, so not pickable there)
    { id: "snell:source", name: "Light source", objects: [carrierM, hBack, hsg], kind: "slide", axis: new THREE.Vector3(1, 0, 0), worldPerUnit: 0.01,
      get: () => (X_SLIT - S.src.d) * 100, set: (v) => { S.src.d = Math.round(Math.min(D_MAX, Math.max(D_MIN, X_SLIT - v / 100)) * 1e5) / 1e5; },
      describe: () => `Filament ${(S.src.d * 100).toFixed(1)} cm from the slit (read the rail scale)<br>drag along the rail · scroll 1 mm (Shift 1 cm)` },
    { id: "snell:filament", name: "Filament knob", objects: [srcKnob], centre: srcKnob, kind: "rotary", wheelStep: 5 * D2R, wheelStepShift: 1 * D2R,
      rotate: (d) => { S.src.psi = wrapR(S.src.psi + d); },
      describe: () => "Turns the bulb: look at the filament through the window, and at the ray it makes<br>drag around, or scroll (5° a notch, Shift 1°)" },
    { id: "snell:slitplate", name: "Slit plate", objects: [plate, ...slitLines], kind: "slide", axis: new THREE.Vector3(0, 0, 1), worldPerUnit: 0.001,
      get: () => S.src.ys * 1000, set: (v) => { S.src.ys = Math.round(Math.min(YS_MAX, Math.max(-YS_MAX, v / 1000)) * 1e6) / 1e6; },
      describe: () => "Five slits; it slides across the holder<br>drag across · scroll 0.1 mm (Shift 1 mm)" },
    { id: "snell:maskTab", name: "Slit mask tab", objects: [maskTab], kind: "click", click: () => { S.src.mask = null; },
      describe: () => "click to take the mask off (all five slits open)" },
    { id: "snell:mask", name: "Slit mask", objects: [maskL, maskR], kind: "slide", axis: new THREE.Vector3(0, 0, 1), worldPerUnit: 0.001,
      get: () => (S.src.mask ?? 0) * 1000, set: (v) => { if (S.src.mask !== null) S.src.mask = Math.round(Math.min(MASK_MAX, Math.max(-MASK_MAX, v / 1000)) * 1e6) / 1e6; },
      describe: () => "One opening: slide it over the slit you want<br>drag across · scroll 0.1 mm (Shift 1 mm) · its brass tab takes it off" },
    { id: "snell:maskOff", name: "Slit mask", objects: [maskFlat, maskHole], kind: "click", click: () => { S.src.mask = MASK_ON; },
      describe: () => "click to put it on the slit plate" },
    ...slots.map((s) => ({ id: "snell:tray:" + s.B.id, name: `${s.B.tag[0].toUpperCase() + s.B.tag.slice(1)}${s.B.mirror ? "" : " block"}`, objects: [s.g], kind: "click",
      click: () => (S.lab ? pickUp(s.B.id) : mountBlock(s.B.id)), describe: () => (S.held === s.B.id ? "in your hand" : S.placed && S.block === s.B.id ? "on the table" : S.lab ? `${s.B.tag} · click to pick it up` : `${s.B.mirror ? (s.B.curve ? `front-surface, R = ${(MIRROR_RC * 100).toFixed(0)} cm` : "front-surface mirror") : `n = ${MEDIA[s.B.id].n.toFixed(3)}`} · click to put it on the table`) })),
  ];
  const labels = [
    { text: "ray box", obj: housing, off: [0, 0.035, 0], prio: 3, when: () => !bulbOn() },
    { text: "light source", obj: hBack, off: [0, 0.04, 0], prio: 3, when: () => bulbOn() },
    { text: "slit plate", obj: plate, off: [0, 0.01, 0.029], prio: 2,   /* an end: the mask covers the middle */ when: () => bulbOn() },
    { text: "slit mask", obj: maskFlat, off: [0, 0.01, 0], prio: 2, when: () => bulbOn() && S.src.mask === null },
    { text: "protractor table", obj: rim, off: [0, 0, R_TABLE], prio: 2 },
    { text: "block", obj: block, off: [0.03, 0.02, -0.0], prio: 3, when: () => S.placed && !isMirror(S.block) },   // only a part on the table (lab: it starts empty)
    ...BLOCKS.filter((B) => B.mirror).map((B) => ({ text: B.tag, obj: block, off: [0.0, 0.02, 0.035], prio: 3, when: () => S.placed && S.block === B.id })),
    { text: "block tray", obj: tray, off: [0.17, 0.012, 0], prio: 1 },
    { text: "mirror tray", obj: mtray, off: [0.15, 0.012, 0], prio: 1 },
  ];

  // ---------------------------------------------------------------- readouts
  // how far the part sits from a perfect mount (explore mode): the face line's distance from the table centre, the
  // reference point's slide along the face, and the face's turn away from the 90-90 line (mod 180: either side may face the light)
  function alignment() {
    const { x, z, psi } = S.pose, across = -x * Math.cos(psi) + z * Math.sin(psi), along = x * Math.sin(psi) + z * Math.cos(psi);
    const tw = wrapR(2 * psi) / 2;
    return { across, along, twist: tw / D2R };
  }
  function alignText(T) {
    if (S.lab || !S.placed || aligned()) return "";
    const A = alignment(), mm = (v) => `${(Math.abs(v) * 1000).toFixed(1)} mm`, mir = isMirror(S.block) && !curveOf(S.block);
    let t = `<br><b>Alignment:</b> face ${mm(A.across)} off the centre` + (mir ? "" : `, ${mm(A.along)} along it`) + `; turned ${Math.abs(A.twist).toFixed(2)}° from the COMPONENT line.`;
    const R = T && T.ring, f = (v) => (v === null || v === undefined ? "—" : `${v.toFixed(1)}°`);
    if (R && T.th1 !== null) {
      const pairs = T.mirror ? [["θ<sub>i</sub>", R.i, T.th1], ["θ<sub>r</sub>", R.r, T.th2]] : [["θ<sub>1</sub>", R.i, T.th1], ["θ<sub>2</sub>", R.t, T.th2]];
      t += " On the ring: " + pairs.map(([sym, ring, tru]) => `${sym} reads ${f(ring)} (true ${f(tru)})`).join(", ") + ".";
    }
    return t;
  }
  function text() {
    const T = dbg && dbg.wls[0] ? dbg.wls[Math.floor(dbg.wls.length / 2)] : null; if (!T) return;
    if (T.dark) { setText({ chips: `<div class="chip c-x">table = <b>${S.phi.toFixed(1)}°</b></div>`, status: "No light reaches the table: the slit mask covers every slit. Slide it over the centre slit.", mode: "no light" }); return; }
    if (T.empty) {
      const held = S.held && BLOCKS.find((B) => B.id === S.held).tag;
      setText({ chips: `<div class="chip c-x">table = <b>${S.phi.toFixed(1)}°</b></div>`,
        status: held ? `Holding the <b>${held}</b>. Click on the cross to set it down: it comes square to the lines; scroll to turn it (F half round).`
          : "The table is empty. Click the D-shaped lens or the mirror in its tray to pick it up, then set it on the platform.",
        mode: held ? "placing the " + held : "empty table" });
      return;
    }
    if (T.mirror) return textMirror(T);
    if (T.th1 === null) {
      const B = BLOCKS.find((b) => b.id === S.block);
      setText({ chips: (S.lab ? "" : `<div class="chip c-f"><i>n</i> = <b>${T.n.toFixed(3)}</b></div>`) + `<div class="chip c-x">table = <b>${S.phi.toFixed(1)}°</b></div>`,   // lab mode: n is what Exp 212 measures
        status: (T.miss ? `The beam misses the ${B.tag}.` : `The beam goes through the ${B.tag} without meeting the flat face.`) + " Slide it so its face is centred on the cross." + alignText(),
        mode: B.tag + " · misplaced" });
      return;
    }
    const h = S.lab, B = BLOCKS.find((b) => b.id === S.block), n = T.n;
    const c = (cls, sym, val, hide = false) => `<div class="chip ${cls}${hide ? " hide" : ""}">${sym} = <b>${val}</b></div>`;
    const inside = T.from === "curved", n1 = inside ? n : 1, n2 = inside ? 1 : n, crit = criticalAngle(n1, n2);
    const F = T.th1 !== undefined ? fresnel(n1, n2, T.th1 * D2R) : null;
    const chips = c("c-f", "<i>n</i>", `${n.toFixed(3)}`, h) + c("c-x", "table", `${S.phi.toFixed(1)}°`) +   // lab mode hides n too: it is what Exp 212 measures
      c("c-p", "<i>θ</i><sub>1</sub>", `${T.th1.toFixed(1)}°`, h) + c("c-t", "<i>θ</i><sub>2</sub>", T.th2 === null ? "TIR" : `${T.th2.toFixed(1)}°`, h) +
      (crit ? c("c-e", "<i>θ</i><sub>c</sub>", `${(crit / D2R).toFixed(1)}°`, h) : "") + (F ? c("c-g", "<i>R</i>", `${(F.R * 100).toFixed(1)} %`, h) : "");
    let msg;
    if (h) msg = "Computed values hidden. Read the angles where the beams cross the degree ring.";
    else if (T.grazing) msg = "Grazing incidence: the beam runs along the flat face.";
    else if (!inside) msg = `Air → ${B.tag}: the beam bends <b>toward</b> the normal, ${T.th1.toFixed(1)}° → ${T.th2.toFixed(1)}° (sin θ<sub>1</sub> = ${n.toFixed(3)} sin θ<sub>2</sub>). ${(F.R * 100).toFixed(1)} % is reflected.`;
    else if (T.th2 === null && T.bundle.leaveFrac > 0.002) msg = `Just past the critical angle (${(crit / D2R).toFixed(1)}°) for the centre of the beam, but its other edge still meets the face below it: ${(T.bundle.leaveFrac * 100).toFixed(1)} % of the light still grazes out. Turn a little further.`;
    else if (T.th2 === null) msg = `<b>Total internal reflection.</b> Inside the ${B.tag} at ${T.th1.toFixed(1)}°, past the critical angle ${(crit / D2R).toFixed(1)}°: no light leaves the flat face.`;
    else if (T.th1 > crit / D2R - 4) msg = `Near the critical angle (${(crit / D2R).toFixed(1)}°): the emerging beam swings toward the face (${T.th1.toFixed(1)}° → ${T.th2.toFixed(1)}°) and fades, while the reflected beam brightens (<i>R</i> = ${(F.R * 100).toFixed(0)} %).` +
      (T.bundle.trappedFrac > 0.01 ? ` The edge of the beam meets the face a little more steeply (the curved face focuses it), so ${(T.bundle.trappedFrac * 100).toFixed(0)} % of the beam is already totally reflected.` : "");
    else msg = `${B.tag[0].toUpperCase() + B.tag.slice(1)} → air (in through the curved face): the beam bends <b>away</b> from the normal, ${T.th1.toFixed(1)}° → ${T.th2.toFixed(1)}°. Turn past ${(crit / D2R).toFixed(1)}° for total internal reflection.`;
    const trapped = S.white ? dbg.wls.filter((W) => W.th2 === null).length : 0;
    if (S.white && !h) msg += inside ? (trapped > 0 && trapped < dbg.wls.length ? ` White light: the colours have different critical angles. ${trapped} of ${dbg.wls.length} (from violet up) are already totally reflected while red still leaves.`
        : trapped === dbg.wls.length ? " White light: every colour is totally reflected." : " White light: near the critical angle the colours spread wide (violet bends most). Turn a little further and violet is trapped first.") : " White light: each colour has its own n, so the beam fans out (violet bends most). The spread is small here; turn the curved face to the light and approach the critical angle to see it grow.";
    if (!h && T.general && T.from === "curved" && T.entry > 0.05) msg += ` The beam meets the curved face ${T.entry.toFixed(1)}° off its normal, so it already bends going in.`;
    msg += alignText(T);
    setText({ chips, status: msg, mode: `${B.tag}` + (h ? " · lab" : T.th2 === null && !T.grazing ? " · total internal reflection" : inside ? " · block → air" : " · air → block") });
  }

  // where the two outermost beams' reflected rays (or, for a convex mirror, their backward extensions) cross:
  // { d: distance from the vertex (m), real: crossing in front of the mirror along both rays } or null
  function focusOf(T) {
    const R = T.slitRays; if (!R || R.length < 2) return null;
    const A = R[0], B = R[R.length - 1]; if (A.th2 === null || B.th2 === null || A.segs.length < 2 || B.segs.length < 2) return null;
    const dir = (sg) => { const v = [sg[1][0] - sg[0][0], sg[1][1] - sg[0][1]], L = Math.hypot(...v); return [v[0] / L, v[1] / L]; };
    const p = A.segs[1][0], u = dir(A.segs[1]), q = B.segs[1][0], v = dir(B.segs[1]), den = u[0] * v[1] - u[1] * v[0];
    if (Math.abs(den) < 1e-9) return null;
    const t = ((q[0] - p[0]) * v[1] - (q[1] - p[1]) * v[0]) / den, s2 = ((q[0] - p[0]) * u[1] - (q[1] - p[1]) * u[0]) / den;
    const X = [p[0] + u[0] * t, p[1] + u[1] * t];
    const O = partFrame().O; return { d: Math.hypot(X[0] - O[0], X[1] - O[1]), real: t > 0 && s2 > 0, X };
  }
  function textMirror(T) {
    const h = S.lab, c = (cls, sym, val, hide = false) => `<div class="chip ${cls}${hide ? " hide" : ""}">${sym} = <b>${val}</b></div>`;
    const sc = T.curve, f = sc * MIRROR_RC / 2, tag = BLOCKS.find((B) => B.id === S.block).tag, cm = (x) => (x * 100).toFixed(1);
    const chips = c("c-x", "table", `${S.phi.toFixed(1)}°`) + c("c-p", "<i>θ</i><sub>i</sub>", `${T.th1.toFixed(1)}°`, h) +
      c("c-t", "<i>θ</i><sub>r</sub>", T.th2 === null ? "—" : `${T.th2.toFixed(1)}°`, h) +
      (sc ? c("c-f", "<i>f</i>", `${f > 0 ? "+" : "−"}${cm(Math.abs(f))} cm`, h) : "") + c("c-g", "<i>R</i>", `${(MIRROR_R * 100).toFixed(0)} %`, h);
    let msg;
    const F = sc ? focusOf(T) : null, axial = Math.abs(wrapR(partFrame().beta)) < 3 * D2R;
    if (h) msg = sc ? "Computed values hidden. Find where the reflected beams cross (concave) or where their backward extensions meet (convex), and measure from the mirror." : "Computed values hidden. Read the incident and reflected angles where the beams cross the degree ring.";
    else if (T.miss) msg = "The beam misses the mirror. Slide it so its face is centred on the cross.";
    else if (T.grazing) msg = "Grazing: the beam runs along the mirror's face.";
    else if (T.edge) msg = "The beam meets the end of the mirror plate and stops there.";
    else if (T.back) msg = "The beam meets the <b>back</b> of the mirror (the painted backing): nothing comes through. Turn the silvered face toward the ray box.";
    else if (sc && S.slits === 1) msg = `${tag[0].toUpperCase() + tag.slice(1)}, R = ${cm(MIRROR_RC)} cm. The single beam meets it at the vertex, where it reflects like a plane mirror (θ<sub>r</sub> = θ<sub>i</sub> = ${T.th1.toFixed(1)}°). Choose 3 or 5 slits on the ray box to see the ${sc > 0 ? "focus" : "beams spread"}.`;
    else if (sc > 0) msg = (F && F.real ? `<b>Real focus.</b> Parallel beams reflect toward one point: the outer beams cross ${cm(F.d)} cm in front of the mirror${axial ? `, close to F at f = R/2 = ${cm(f)} cm` : ""}.` : "The reflected beams converge.") +
      (axial ? (S.slits === 5 ? " The outermost beams cross slightly nearer than the inner ones: spherical aberration." : "") : ` Off axis (table at ${S.phi.toFixed(1)}°) the beams no longer meet at a single point.`);
    else if (sc < 0) msg = (F && !F.real ? `<b>Virtual focus.</b> The reflected beams spread out as if they came from a point ${cm(F.d)} cm <b>behind</b> the mirror${axial ? ` (f = −R/2 = −${cm(Math.abs(f))} cm)` : ""}. No light reaches that point and no screen catches it: extend the beams backward with a ruler to find it.` : "The reflected beams diverge.") +
      (axial ? "" : ` Off axis (table at ${S.phi.toFixed(1)}°) the extensions no longer meet at a single point.`);
    else msg = `<b>Law of reflection:</b> the beam comes in at ${T.th1.toFixed(1)}° from the normal and leaves at ${T.th2.toFixed(1)}° on the other side: θ<sub>r</sub> = θ<sub>i</sub>. Turning the mirror by an angle turns the reflected beam by twice that.`;
    if (!h && S.white && !T.back && !T.edge && !T.grazing) msg += " White light: every colour reflects the same way, so the beams stay white (no dispersion in reflection).";
    msg += alignText(T);
    setText({ chips, status: msg, mode: tag + (h ? " · lab" : T.back ? " · back of the mirror" : T.edge || T.grazing ? "" : sc > 0 && S.slits > 1 ? " · real focus" : sc < 0 && S.slits > 1 ? " · virtual focus" : " · reflection") });
  }
  function setLab(on) {
    if (on && !S.lab) { clearTable(); S.src = { ...LAB_SRC }; }      // lab mode: the table empty, the source as a student finds it
    if (!on && S.lab) { mountBlock(S.block); S.src = { ...EXPLORE_SRC }; }   // back to explore: part square, source set up well
    S.lab = on; $("blockSel").disabled = on; lightMenu();
  }   // turning lab mode on empties the table; parts go on by hand
  function reset() { Object.assign(S, DEFAULTS); S.src = { ...(S.lab ? LAB_SRC : EXPLORE_SRC) }; S.filter = null; if (S.lab) { setPart(S.block); clearTable(); } else mountBlock(S.block); setSlits(S.slits); $("tWhite").checked = false; lightMenu(); }
  return {
    id: "snell", name: "Snell's law", group: "Geometric optics", scope: "Geometric optics · Refraction",
    station: "ray", root: group, views, viewNames, defaultView: "overview", registry, labels, panel: "snell",
    frame, text, warm: frame, reset, setLab, carry, key: onKey, focus: [[disc, "protractor"], [block, "block"], [housing, "raybox"], [rail, "source"], [post, "source"], [tbase, "tray"], [mbase, "mirrors"]],
    api: { S, setPhi, mountBlock, setSlits, setBox: (on) => { $("tBox").checked = on; S.box = on; lightMenu(); }, bulbOn, knob, slotOf: (id) => slots.find((s) => s.B.id === id).g, focusOf, pickUp, carry, clearTable, nudge, partFrame, debug: () => dbg, turn, disc, block, frameNow: () => frame(),
      // the lab source (checks): its rays, the parts a mouse works, and its constants
      labBeams, centreRay, slitPass, srcBright, filHalf, src: { srcKnob, plate, maskFlat, maskTab, maskR, hBack, carrierM, labG, rb, slitLines, slitMat, idx },
      SRC: { X_SLIT, C0: [C0.x, C0.z], LAB_SRC, MASK_ON, FIL_L, FIL_D, SLIT_SP, SLIT_W, MASK_OPEN, D_MIN, D_MAX } },
  };
}
