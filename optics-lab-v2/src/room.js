// The lab room (R1): a darkened optics lab. Floor, four walls and a ceiling, a door, a cabinet, dim ceiling panels, and a
// pendant lamp over each station's table. Metres, world coordinates; x east, z south, y up.
// Walls and ceiling are single planes facing INTO the room: seen from outside they are back faces and are not drawn,
// so a camera that pulls back through a wall (a wide fit-to-view) looks straight into the room, like a dollhouse.
import * as THREE from "three";
import { MATERIALS } from "./bench.js";

export const ROOM = { x0: -4.5, x1: 4.5, z0: -3.5, z1: 3.5, h: 3.0 };

const ROOM_MATS = {
  wall: new THREE.MeshStandardMaterial({ color: 0x23272d, roughness: 0.95, metalness: 0 }),        // matte dark paint: an optics lab
  ceiling: new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.95, metalness: 0 }),
  skirting: new THREE.MeshStandardMaterial({ color: 0x0f1012, roughness: 0.7, metalness: 0.1 }),
  door: new THREE.MeshStandardMaterial({ color: 0x3b2f25, roughness: 0.7, metalness: 0 }),
  panel: new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xdfe6f0, emissiveIntensity: 0.12, roughness: 0.9 }),   // ceiling lights, dimmed
  shade: new THREE.MeshStandardMaterial({ color: 0x1b1d22, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }),
  bulb: new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffe3bf, emissiveIntensity: 0.9, userData: { glow: true } }),
};
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const plane = (w, h, m) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);

/** The room shell and its furniture. Returns { group, lamps }: call addLamp(st) for each station's pendant. */
export function buildRoom(scene) {
  const g = new THREE.Group(); g.name = "room"; scene.add(g);
  const W = ROOM.x1 - ROOM.x0, D = ROOM.z1 - ROOM.z0, H = ROOM.h, cx = (ROOM.x0 + ROOM.x1) / 2, cz = (ROOM.z0 + ROOM.z1) / 2;
  const floor = plane(W, D, MATERIALS.floor); floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz); floor.receiveShadow = true; floor.name = "room:floor"; g.add(floor);
  const ceil = plane(W, D, ROOM_MATS.ceiling); ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, H, cz); ceil.name = "room:ceiling"; g.add(ceil);
  // walls: [centre x, centre z, length, yaw so the face looks into the room]
  for (const [x, z, len, yaw, name] of [[cx, ROOM.z0, W, 0, "north"], [cx, ROOM.z1, W, Math.PI, "south"], [ROOM.x0, cz, D, Math.PI / 2, "west"], [ROOM.x1, cz, D, -Math.PI / 2, "east"]]) {
    const w = plane(len, H, ROOM_MATS.wall); w.position.set(x, H / 2, z); w.rotation.y = yaw; w.receiveShadow = true; w.name = "room:wall:" + name; g.add(w);
    const sk = plane(len, 0.09, ROOM_MATS.skirting); sk.position.set(x, 0.045, z); sk.rotation.y = yaw; sk.translateZ(0.002); g.add(sk);
  }
  // door (west wall, toward the south end): frame, leaf, handle - drawn just proud of the wall
  const door = new THREE.Group(); door.position.set(ROOM.x0, 0, 2.3); door.rotation.y = Math.PI / 2; g.add(door);
  const leaf = plane(0.92, 2.05, ROOM_MATS.door); leaf.position.set(0, 1.025, 0.006); door.add(leaf);
  for (const [x, y, w, h] of [[-0.5, 1.06, 0.08, 2.12], [0.5, 1.06, 0.08, 2.12], [0, 2.1, 1.08, 0.08]]) { const f = box(w, h, 0.03, ROOM_MATS.skirting); f.position.set(x, y, 0.015); door.add(f); }
  const handle = box(0.12, 0.02, 0.03, MATERIALS.steel); handle.position.set(0.36, 1.0, 0.03); door.add(handle);
  // a tall cabinet against the north wall (scale, and somewhere the kit lives)
  const cab = new THREE.Group(); cab.position.set(-0.4, 0, ROOM.z0 + 0.26); g.add(cab);
  const body = box(1.2, 1.9, 0.5, MATERIALS.anod); body.position.y = 0.95; cab.add(body);
  for (const s of [-1, 1]) { const dr = box(0.585, 1.84, 0.01, MATERIALS.black); dr.position.set(s * 0.3, 0.95, 0.255); cab.add(dr);
    const h = box(0.015, 0.22, 0.02, MATERIALS.steel); h.position.set(s * 0.04, 1.05, 0.27); cab.add(h); }
  cab.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // dimmed ceiling panels (they read as "lights off", the room lit by the table lamps)
  for (const x of [-2.6, 0, 2.6]) for (const z of [-1.6, 1.6]) { const p = plane(1.2, 0.6, ROOM_MATS.panel); p.rotation.x = Math.PI / 2; p.position.set(x, H - 0.005, z); g.add(p); }
  return g;
}

/** A pendant lamp over a station's table: shade + bulb + a soft spot (no shadows: the active station's rig casts them). */
export function addLamp(scene, st) {
  const at = st.toWorld([st.table.cx, 0, st.table.cz]), y = 2.15;
  const g = new THREE.Group(); g.position.set(at.x, 0, at.z); g.name = "lamp:" + st.id; scene.add(g);
  const cord = box(0.006, ROOM.h - y - 0.12, 0.006, MATERIALS.black); cord.position.y = (ROOM.h + y + 0.12) / 2; g.add(cord);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 32, 1, true), ROOM_MATS.shade); shade.position.y = y + 0.03; g.add(shade);
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), ROOM_MATS.bulb); bulb.rotation.x = Math.PI / 2; bulb.position.y = y - 0.04; g.add(bulb);
  const spot = new THREE.SpotLight(0xffe7c8, 2.2, 0, 0.75, 0.9, 2); spot.position.set(at.x, y - 0.05, at.z); spot.target.position.set(at.x, 0.9, at.z);
  scene.add(spot, spot.target);
  return { group: g, spot };
}
