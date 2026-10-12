// Leader-line labels on the void (adapted from the Rankine Cycler's hud.js): an anchor dot on the part, a leader
// line, and the text out in clear space; greedy placement, no overlaps, no crossings, never under the rail.
import * as THREE from "three";

const $ = (id) => document.getElementById(id);

export class Labels {
  // defs: [{ text, obj, off:[x,y,z], when?:()=>bool, prio? }] - anchors follow moving parts
  constructor(defs, center) {
    const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"); svg.id = "leaders"; $("labels").appendChild(svg);
    this.labels = defs.map((L) => {
      const d = document.createElement("div"); d.className = "lbl"; d.textContent = L.text; $("labels").appendChild(d);
      const dot = document.createElement("div"); dot.className = "lbl-dot"; $("labels").appendChild(dot);
      const line = document.createElementNS(NS, "polyline"); line.setAttribute("class", "lbl-line"); svg.appendChild(line);
      return { d, dot, line, obj: L.obj, off: new THREE.Vector3(...(L.off || [0, 0, 0])), when: L.when, prio: L.prio ?? 1 };
    });
    this.center = center; this.occluders = []; this.ray = new THREE.Raycaster(); this.occT = 0; this.show = true; this.tmp = new THREE.Vector3();
    // R3: the canvas and rail rectangles are read once (and again after a resize), not every frame: reading them forced
    // a layout each frame, since the readouts are rewritten every 0.1 s
    this.rects = null; this.sig = ""; window.addEventListener("resize", () => { this.rects = null; this.sig = ""; });
  }
  update(camera, dom, dt) {
    this.rects ||= { R: dom.getBoundingClientRect(), railLeft: $("rail").getBoundingClientRect().left };
    const { R, railLeft } = this.rects;
    const scr = (p) => { const v = p.project(camera); return [R.left + (v.x + 1) / 2 * R.width, R.top + (1 - v.y) / 2 * R.height, v.z]; };
    const [cx, cy] = scr(this.tmp.copy(this.center)), placed = [], hit = (b) => placed.some((p) => b[0] < p[2] && b[2] > p[0] && b[1] < p[3] && b[3] > p[1]);
    const SLOTS = []; for (const len of [46, 74, 102, 132, 168]) for (const da of [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6, Math.PI]) SLOTS.push([len, da]);
    this.occT += dt; const occNow = this.occT > 0.15 && this.occluders.length; if (occNow) this.occT = 0;
    // nothing moved on screen (camera, anchors, which labels apply) and no occlusion pass due: the layout stands (R3)
    if (!occNow) { let sig = `${this.show}|${Math.round(cx)},${Math.round(cy)}`;
      for (const L of this.labels) { L.obj.localToWorld(this.tmp.copy(L.off)); const [ax, ay, az] = scr(this.tmp); sig += `|${Math.round(ax * 2)},${Math.round(ay * 2)},${az < 1 ? 1 : 0},${!L.when || L.when() ? 1 : 0},${L.hidden ? 1 : 0}`; }
      if (sig === this.sig) return; this.sig = sig; } else this.sig = "";
    const segs = [], cross = (a, b, c, d) => { const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
      return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };
    for (const L of [...this.labels].sort((a, b) => b.prio - a.prio)) {
      L.obj.localToWorld(this.tmp.copy(L.off));
      if (occNow) {
        const dir = this.tmp.clone().sub(camera.position), dist = dir.length(); this.ray.set(camera.position, dir.normalize()); this.ray.far = dist - 0.01;
        L.hidden = this.ray.intersectObjects(this.occluders, true).some((h) => !(h.object.material && h.object.material.transparent));
        L.obj.localToWorld(this.tmp.copy(L.off));
      }
      const [ax, ay, az] = scr(this.tmp);
      let vis = this.show && !L.hidden && (!L.when || L.when()) && az < 1 && ax > 20 && ax < railLeft - 20 && ay > 100 && ay < R.height - 40, slot = null;
      if (vis) {
        const w = (L.w ||= L.d.textContent.length * 6.3 + 16), h = 17;
        let dx = ax - cx, dy = (ay - cy) * 0.6; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n; if (Math.hypot(ax - cx, ay - cy) < 8) { dx = 0.3; dy = -1; }
        const base = Math.atan2(dy, dx), order = !occNow && L.slot !== undefined ? [L.slot, ...SLOTS.keys()] : [...SLOTS.keys()];
        for (const k of order) {
          const [len, da] = SLOTS[k], a = base + da, ex = ax + Math.cos(a) * len, ey = ay + Math.sin(a) * len, right = Math.cos(a) >= 0;
          const tx = right ? ex + 5 : ex - 5 - w, box = [tx - 2, ey - h / 2 - 1, tx + w + 2, ey + h / 2 + 1];
          if (box[0] < 16 || box[2] > railLeft - 12 || box[1] < 96 || box[3] > R.height - 34 || hit(box)) continue;
          if (segs.some(([p, q]) => cross([ax, ay], [ex, ey], p, q))) continue;
          slot = { k, ex, ey, tx, right, box }; break;
        }
        vis = !!slot;
      }
      L.d.style.display = L.dot.style.display = vis ? "block" : "none"; L.line.style.display = vis ? "" : "none";
      if (!vis) continue;
      placed.push(slot.box, [ax - 4, ay - 4, ax + 4, ay + 4]); segs.push([[ax, ay], [slot.ex, slot.ey]]); L.slot = slot.k;
      L.d.style.left = slot.tx + "px"; L.d.style.top = slot.ey + "px"; L.dot.style.left = ax + "px"; L.dot.style.top = ay + "px";
      L.line.setAttribute("points", `${ax},${ay} ${slot.ex},${slot.ey} ${slot.right ? slot.ex + 3 : slot.ex - 3},${slot.ey}`);
    }
  }
}
