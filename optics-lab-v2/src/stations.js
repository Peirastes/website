// Stations: the tables of the lab room. Each station is a group with its own origin (x, z on the floor, metres) and
// yaw (radians about +y); everything a lab builds lives in that group, in station-local coordinates, so a station can be
// placed anywhere in the room without its apparatus, camera views or drag axes changing. Some stations carry a rail.
//   ray table  -> Snell's law
//   lens bench -> Thin lens
//   wave bench -> Double slit, Single slit, Grating (one apparatus)
//   spectrometer -> Exp 214 (grating spectrometer)
// R0 (2026-10-10): stations, every one at the origin. R1: placed around the room (room.js), each on its own table; the
// wave bench stands so the room's east wall is WALL_X along its rail axis (the wall screen hangs there).
import * as THREE from "three";
import { buildRail, buildTable, WALL_X } from "./bench.js";
import { ROOM } from "./room.js";

const BIG = { w: 1.5, d: 0.75, cx: 0, cz: 0.04 };
export const STATIONS = [
  { id: "ray", name: "Ray table", origin: [-2.8, 1.5], yaw: 0, rail: false, table: { w: 1.1, d: 0.75, cx: 0.15, cz: 0.04 } },
  { id: "lens", name: "Lens bench", origin: [-0.6, 1.6], yaw: 0, rail: true, table: BIG },
  { id: "wave", name: "Wave bench", origin: [ROOM.x1 - 0.025 - WALL_X, -1.6], yaw: 0, rail: true, table: BIG },   // 25 mm: the screen's frame stands off the wall
  { id: "spec", name: "Spectrometer", origin: [2.5, 1.7], yaw: 0, rail: false, table: { w: 0.9, d: 0.66, cx: -0.03, cz: 0 } },   // Exp 214 (2026-10-10)
];

// TEST HOOK (checks only): ?stationShift=1 moves and turns every station, so the checks prove that nothing a module
// does depends on where its station stands (R0 gate). No effect on normal use.
const SHIFT = typeof location !== "undefined" && new URLSearchParams(location.search).has("stationShift")
  ? { ray: [[-1.6, 0.7], -Math.PI / 2], lens: [[2.1, 1.3], Math.PI / 6], wave: [[0.8, -2.4], Math.PI], spec: [[-3.0, -1.8], Math.PI / 2] } : null;

export function buildStations(world) {
  const out = {};
  for (const d0 of STATIONS) {
    const def = SHIFT ? { ...d0, origin: SHIFT[d0.id][0], yaw: SHIFT[d0.id][1] } : d0;
    const group = new THREE.Group(); group.name = "station:" + def.id;
    group.position.set(def.origin[0], 0, def.origin[1]); group.rotation.y = def.yaw; world.add(group);
    const st = { ...def, group, rail: def.rail ? buildRail() : null };
    if (st.rail) group.add(st.rail.group);
    st.tableMesh = buildTable(def.table); group.add(st.tableMesh);
    group.updateMatrixWorld(true);
    // station-local point / direction -> world
    st.toWorld = (p) => group.localToWorld(new THREE.Vector3(...p));
    st.dirToWorld = (v) => v.clone().applyQuaternion(group.getWorldQuaternion(new THREE.Quaternion()));
    out[def.id] = st;
  }
  return out;
}
