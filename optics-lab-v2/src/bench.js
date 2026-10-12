// Optics bench geometry: lab table, graduated rail (station equipment), the thin-lens kit (light box with an arrow
// object, lens holder, screen) and a lens tray. Metres in the scene; the rail scale reads centimetres. No physics here.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const TABLE_Y = 0.90;                    // table top
export const RAIL = { x0: -0.50, len: 1.00, h: 0.03, d: 0.06, extra: 0.05 };   // scale 0-100 cm runs x0 .. x0+len
export const RAIL_TOP = TABLE_Y + RAIL.h;
export const AXIS_Y = RAIL_TOP + 0.13;          // optical axis height
export const WALL_X = 2.30;                     // wave bench: the wall screen's face, along the rail axis from the bench origin (m)
export const cmToX = (cm) => RAIL.x0 + cm / 100;

// the object: the textbook arrow, tail on the optical axis, tip h_o = 4.0 cm above it (so h_i = M h_o is the tip's
// image height). Convex polygons in the object plane, centimetres, counter-clockwise: u = horizontal as seen from
// the lens side (u > 0 = world -z), v = up from the axis. Shaft 0.6 cm wide to 2.8 cm, head 1.6 cm wide to the tip.
export const OBJ_POLYS = [
  [[-0.3, 0.0], [0.3, 0.0], [0.3, 2.8], [-0.3, 2.8]],          // shaft
  [[-0.8, 2.8], [0.8, 2.8], [0.0, 4.0]],                         // head
];
export const OBJ_TIP = [0.0, 4.0];                               // (u, v): where the rays leave from
/** The arrow as one THREE.Shape in (u, v) cm. */
export function arrowShape() {
  const s = new THREE.Shape(); const pts = [[-0.3, 0], [0.3, 0], [0.3, 2.8], [0.8, 2.8], [0, 4], [-0.8, 2.8], [-0.3, 2.8]];
  s.moveTo(...pts[0]); for (const q of pts.slice(1)) s.lineTo(...q); s.closePath(); return s;
}
/** A flat arrow mesh in the y-z plane facing +x, in METRES, tail at the local origin (u -> -z, v -> y). */
export function arrowMesh(mat) {
  const g = new THREE.ShapeGeometry(arrowShape()); g.scale(0.01, 0.01, 1);
  const m = new THREE.Mesh(g, mat); m.rotation.y = Math.PI / 2;     // local x (u) -> world -z, local y (v) -> world y, normal -> +x
  return m;
}
export const H_OBJ = 4.0;

export const LENSES = [
  { id: "c10", f: 10, tag: "+10 cm" }, { id: "c15", f: 15, tag: "+15 cm" },
  { id: "c20", f: 20, tag: "+20 cm" }, { id: "d15", f: -15, tag: "−15 cm" },
];
export const APERTURE = 4.0;                    // clear aperture D (cm)
export const CARD = 19;                         // screen card (cm square), centred on the axis
export const RULER = { w: 1.6, z: 5.0, pxPerCm: 240 };   // the card's ruler strip: width, centre (cm toward +z), texture density

// the card's ruler: mm ticks from the edge nearer the image, cm numbers, 0 at the axis (the canvas centre row), + up
export function cardRulerTexture() {
  const K = RULER.pxPerCm, W = Math.round(RULER.w * K), H = CARD * K, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  g.fillStyle = "#e9e6dd"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#121316"; g.textAlign = "right"; g.textBaseline = "middle"; g.font = `600 ${Math.round(0.36 * K)}px 'Share Tech Mono', monospace`;
  const half = Math.floor((CARD / 2) * 10);
  for (let mm = -half; mm <= half; mm++) {
    const y = H / 2 - (mm / 10) * K, len = mm % 10 === 0 ? 0.6 : mm % 5 === 0 ? 0.42 : 0.26, t = mm % 10 === 0 ? 0.03 : 0.02;
    g.fillRect(0, y - (t * K) / 2, len * K, t * K);
    if (mm % 10 === 0) g.fillText(mm === 0 ? "0" : (mm > 0 ? "+" : "−") + Math.abs(mm / 10), W - 0.08 * K, y);
  }
  const tx = new THREE.CanvasTexture(c); tx.anisotropy = 16; tx.colorSpace = THREE.SRGBColorSpace; return tx;
}

export const MATERIALS = {
  alu: new THREE.MeshStandardMaterial({ color: 0x9aa0a7, metalness: 0.75, roughness: 0.35 }),   // toned down: the softbox glint on bright aluminium bloomed into a white flare in close-ups
  anod: new THREE.MeshStandardMaterial({ color: 0x1b1d22, metalness: 0.6, roughness: 0.45 }),
  black: new THREE.MeshStandardMaterial({ color: 0x111214, metalness: 0.3, roughness: 0.6 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc8a05a, metalness: 0.95, roughness: 0.3 }),
  table: new THREE.MeshStandardMaterial({ color: 0x2a2724, metalness: 0.05, roughness: 0.8 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x5d6168, metalness: 0.85, roughness: 0.45 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 }),
  card: new THREE.MeshStandardMaterial({ color: 0xc9c9c3, roughness: 0.92, metalness: 0, emissive: 0xffffff, emissiveIntensity: 1 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xdfefff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.32,
    clearcoat: 1, clearcoatRoughness: 0.03, ior: 1.52, envMapIntensity: 1.4, depthWrite: false }),
  glow: new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xfff3dc, emissiveIntensity: 2.6, userData: { glow: true } }),   // userData.glow: blooms (main.js)
  diffuser: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, emissive: 0x6a6258, emissiveIntensity: 0.35, roughness: 0.9 }),
};

const box = (w, h, d, m, r = 0) => new THREE.Mesh(r ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), m);
const cyl = (r, h, m, seg = 32) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
function shadows(g) { g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }

/** A lab table (top + four legs) in station-local metres: w along x, d along z, centred at (cx, cz). */
export function buildTable({ w, d, cx = 0, cz = 0 }) {
  const t = new THREE.Group(); t.name = "table";
  const top = box(w, 0.04, d, MATERIALS.table, 0.006); top.position.set(cx, TABLE_Y - 0.02, cz); top.name = "table:top"; t.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(0.05, TABLE_Y - 0.04, 0.05, MATERIALS.steel); l.position.set(cx + sx * (w / 2 - 0.05), (TABLE_Y - 0.04) / 2, cz + sz * (d / 2 - 0.045)); t.add(l); }
  return shadows(t);
}

// the scale strip on the rail's front face: mm ticks, cm numbers every 5, 0..100
function scaleTexture() {
  const W = 8192, H = 256, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
  g.fillStyle = "#c7ccd2"; g.fillRect(0, 0, W, H);
  const pad = (RAIL.extra / (RAIL.len + 2 * RAIL.extra)) * W, pxPerCm = (W - 2 * pad) / 100;
  g.fillStyle = "#15171a"; g.textAlign = "center"; g.textBaseline = "top"; g.font = "600 64px 'Share Tech Mono', monospace";
  for (let mm = 0; mm <= 1000; mm++) {
    const x = pad + (mm / 10) * pxPerCm, len = mm % 50 === 0 ? 110 : mm % 10 === 0 ? 78 : mm % 5 === 0 ? 56 : 36;
    g.fillRect(x - (mm % 10 === 0 ? 2 : 1.2), 0, mm % 10 === 0 ? 4 : 2.4, len);
    if (mm % 50 === 0) g.fillText(String(mm / 10), x, 124);
  }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 16; t.colorSpace = THREE.SRGBColorSpace; return t;
}

function carrierBase(name, postX = 0) {
  const g = new THREE.Group(); g.name = name;
  const saddle = box(0.06, 0.035, RAIL.d + 0.026, MATERIALS.anod, 0.004); saddle.position.y = RAIL_TOP + 0.0175 - 0.006; saddle.name = name + ":saddle"; g.add(saddle);
  const knob = cyl(0.009, 0.014, MATERIALS.black, 24); knob.rotation.x = Math.PI / 2; knob.position.set(0, RAIL_TOP + 0.012, -(RAIL.d / 2 + 0.02)); g.add(knob);
  // index pointer: a brass blade at the carrier's optical plane, over the scale on the rail's front face
  const ptr = box(0.0016, 0.02, 0.003, MATERIALS.brass); ptr.position.set(0, RAIL_TOP - 0.006, RAIL.d / 2 + 0.0145); g.add(ptr);
  const shoe = box(0.014, 0.004, 0.012, MATERIALS.brass); shoe.position.set(0, RAIL_TOP + 0.002, RAIL.d / 2 + 0.009); g.add(shoe);
  const post = cyl(0.0065, AXIS_Y - RAIL_TOP - 0.03, MATERIALS.alu); post.position.set(postX, RAIL_TOP + 0.035 + (AXIS_Y - RAIL_TOP - 0.03) / 2 - 0.006, 0); g.add(post);
  return g;
}

/** The graduated rail: station equipment (the lens bench and the wave bench each have one), in station-local metres. */
export function buildRail() {
  const group = new THREE.Group(); group.name = "rail";
  // rail: aluminium bar with the scale on its front face
  const railLen = RAIL.len + 2 * RAIL.extra, railCx = RAIL.x0 + RAIL.len / 2;
  const rail = box(railLen, RAIL.h, RAIL.d, MATERIALS.alu, 0.003); rail.position.set(railCx, TABLE_Y + RAIL.h / 2, 0); rail.name = "rail"; group.add(rail);
  const scaleMat = new THREE.MeshStandardMaterial({ map: scaleTexture(), roughness: 0.55, metalness: 0.3 });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(railLen, RAIL.h * 0.86), scaleMat); strip.position.set(railCx, TABLE_Y + RAIL.h * 0.5, RAIL.d / 2 + 0.0006); strip.name = "rail:scale"; group.add(strip);
  for (const s of [-1, 1]) { const foot = box(0.05, 0.012, 0.14, MATERIALS.anod, 0.003); foot.position.set(railCx + s * (railLen / 2 - 0.03), TABLE_Y + 0.006 - 0.012, 0); group.add(foot); }
  shadows(group);
  return { group, rail, scale: strip };
}

/** The thin-lens kit: light box with the arrow, lens holder (+ EXTENDED iris), screen, lens tray. Station-local metres. */
export function buildLensKit() {
  const root = new THREE.Group(), P = {};

  // light box carrying the illuminated arrow (object plane = the box's +x face)
  // the box (with the arrow) is a HEAD that slides up and down its post: Exp 213, the object can sit off the axis;
  // the brass knob on its front sets the height
  const obj = carrierBase("object"), head = new THREE.Group(); head.name = "object:head"; obj.add(head);
  const lb = box(0.05, 0.10, 0.10, MATERIALS.black, 0.004); lb.position.set(-0.026, AXIS_Y, 0); head.add(lb);
  const diff = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.085), MATERIALS.diffuser); diff.rotation.y = Math.PI / 2; diff.position.set(-0.0005, AXIS_Y, 0); head.add(diff);
  const arrow = arrowMesh(MATERIALS.glow); arrow.position.set(0.0004, AXIS_Y, 0); arrow.name = "object:arrow"; head.add(arrow);
  const fan = cyl(0.012, 0.004, MATERIALS.anod, 24); fan.rotation.z = Math.PI / 2; fan.position.set(-0.053, AXIS_Y, 0); head.add(fan);
  const knob = new THREE.Group(); knob.position.set(-0.026, AXIS_Y - 0.036, 0.05); head.add(knob);
  const kn = cyl(0.007, 0.008, MATERIALS.brass, 24); kn.rotation.x = Math.PI / 2; kn.position.z = 0.004; kn.name = "object:knob"; knob.add(kn);
  const kGrip = box(0.0016, 0.011, 0.002, MATERIALS.black); kGrip.position.z = 0.0085; knob.add(kGrip);   // shows the knob turning
  P.object = obj; P.objHead = head; P.objKnob = knob; root.add(obj);

  // lens holder: a black ring around the mounted lens
  const lens = carrierBase("lens");
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0045, 16, 64), MATERIALS.anod); ring.rotation.y = Math.PI / 2; ring.position.y = AXIS_Y; lens.add(ring);
  const yoke = box(0.012, 0.03, 0.012, MATERIALS.anod); yoke.position.y = AXIS_Y - 0.038; lens.add(yoke);
  const glassMount = new THREE.Group(); glassMount.position.y = AXIS_Y; lens.add(glassMount);
  P.lens = lens; P.glassMount = glassMount; root.add(lens);
  // EXTENDED FEATURE: iris diaphragm on the light-box side of the lens (hidden unless enabled; never part of a guided
  // procedure). Blades = an annulus whose hole is the clear aperture; a brass lever on its rim sets it.
  const iris = new THREE.Group(); iris.name = "iris"; iris.position.set(-0.0075, AXIS_Y, 0); iris.visible = false; lens.add(iris);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0c0d10, metalness: 0.4, roughness: 0.55, side: THREE.DoubleSide });
  const blades = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.0305, 64), bladeMat); blades.rotation.y = -Math.PI / 2; blades.name = "iris:blades"; iris.add(blades);
  const housing = new THREE.Mesh(new THREE.TorusGeometry(0.0315, 0.0028, 12, 64), MATERIALS.anod); housing.rotation.y = Math.PI / 2; iris.add(housing);
  const lever = new THREE.Group(); iris.add(lever);
  const arm = cyl(0.0017, 0.016, MATERIALS.brass, 12); arm.position.y = 0.0385; lever.add(arm);
  const knobI = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 16, 12), MATERIALS.brass); knobI.position.y = 0.0465; lever.add(knobI);
  P.iris = iris; P.irisBlades = blades; P.irisLever = lever;

  // screen: white card (image side faces the lens, -x) in a black frame
  const scr = carrierBase("screen", 0.019);            // post behind the card, never in front of the image
  // card 19 cm square (Exp 213: images to 9 cm below the axis); the frame's lower edge clears the carrier saddle
  const frame = box(0.012, 0.208, 0.215, MATERIALS.black, 0.003); frame.position.set(0.007, AXIS_Y + 0.006, 0); scr.add(frame);
  const card = new THREE.Mesh(new THREE.PlaneGeometry(CARD / 100, CARD / 100), MATERIALS.card); card.rotation.y = -Math.PI / 2; card.position.set(-0.0002, AXIS_Y, 0); card.name = "screen:card"; scr.add(card);
  // a mm ruler printed down the card, 0 on the optical axis, + up: read the image height h_i (Exp 213)
  const ruler = new THREE.Mesh(new THREE.PlaneGeometry(RULER.w / 100, CARD / 100), new THREE.MeshStandardMaterial({ map: cardRulerTexture(), roughness: 0.9, metalness: 0 }));
  ruler.rotation.y = -Math.PI / 2; ruler.position.set(-0.0005, AXIS_Y, RULER.z / 100); ruler.name = "screen:ruler"; scr.add(ruler);
  P.screen = scr; P.card = card; P.ruler = ruler; root.add(scr);

  // lens tray beside the rail: one slot per lens, each with its tag
  const tray = new THREE.Group(); tray.position.set(0.14, TABLE_Y, 0.22); root.add(tray);
  const base = box(0.30, 0.016, 0.07, MATERIALS.anod, 0.004); base.position.y = 0.008; tray.add(base);
  P.tray = tray; P.traySlots = [];
  LENSES.forEach((L, i) => {
    const slot = new THREE.Group(); slot.position.set(-0.11 + i * 0.073, 0.016, 0); tray.add(slot);
    const groove = box(0.05, 0.004, 0.012, MATERIALS.black); groove.position.y = 0.002; slot.add(groove);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.014), new THREE.MeshBasicMaterial({ map: tagTexture(L.tag), transparent: true }));
    tag.rotation.x = -Math.PI / 2; tag.position.set(0, 0.0005 - 0.0075, 0.026); tag.position.y = 0.0002; slot.add(tag);
    const lensMesh = makeLens(L.f); lensMesh.position.y = 0.033; slot.add(lensMesh);
    slot.userData.lens = L; P.traySlots.push({ slot, lensMesh, L });
  });
  P.trayBase = base;

  shadows(root);
  P.card.castShadow = false;
  return { root, P };
}

function tagTexture(text) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 72; const g = c.getContext("2d");
  g.fillStyle = "rgba(10,12,16,0.0)"; g.fillRect(0, 0, 256, 72);
  g.fillStyle = "#e6d3a8"; g.font = "600 46px 'Share Tech Mono', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, 128, 38);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/**
 * A lens element as a solid of revolution about the optical axis (world x). Converging = biconvex,
 * diverging = biconcave. Centre/edge thickness are drawn for visibility; a shorter focal length is drawn more
 * strongly curved. Diameter 5 cm, clear aperture 4 cm (the ring covers the rest).
 */
export function makeLens(f) {
  const R = 0.026, curv = Math.min(1, 12 / Math.abs(f)) * 0.0055;
  const tc = f > 0 ? 0.003 + curv : 0.0022, te = f > 0 ? 0.0022 : 0.0022 + curv;   // centre / edge half-thickness
  const pts = [], N = 24;
  for (let i = 0; i <= N; i++) { const r = (i / N) * R, t = tc + (te - tc) * (r / R) ** 2; pts.push(new THREE.Vector2(r, t)); }
  for (let i = N; i >= 0; i--) { const r = (i / N) * R, t = tc + (te - tc) * (r / R) ** 2; pts.push(new THREE.Vector2(r, -t)); }
  const geo = new THREE.LatheGeometry(pts, 64);           // lathe about local y; rotate so the axis is world x
  const m = new THREE.Mesh(geo, MATERIALS.glass); m.rotation.z = Math.PI / 2; m.renderOrder = 2; m.name = "lens:glass";
  return m;
}
