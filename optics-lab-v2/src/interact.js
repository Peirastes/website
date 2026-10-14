// Direct manipulation of the bench (adapted from the Rankine Cycler's interact.js): hover highlight + live
// tooltip, click parts, slide carriers along the rail, click anything else to fly the camera to it.
// control = { id, name, objects:[Object3D], kind:'slide'|'click'|'rotary'|'plane', axis?:Vector3, worldPerUnit?, get?(), set?(v),
//             rotate?(dRad), centre?:Object3D, wheelStep?, wheelStepShift? (rad per wheel notch), click?(), describe(),
//             plane: planeY() (world height), grab(p), moveTo(p) (world points on that plane), turn(sign, shift) on the wheel }
// carry() -> null or a part held in the hand (Exp 212 hand placement): { planeY(), move(p) (it follows the cursor),
//             drop(p) (a click sets it down), turn(sign, shift), describe() }
import * as THREE from "three";

export function setupInteraction({ camera, dom, orbit, root, registry, focusOf, flyTo, tip, isActive = () => true, roomTarget = () => null, carry = () => null }) {
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const meshToCtl = new Map();
  for (const c of registry) {
    for (const o of c.objects) o.traverse((m) => {
      if (!m.isMesh) return;
      if (m.material && m.material.emissive && !m.material.isMeshBasicMaterial && !m.userData.sharedLook) {
        m.material = m.material.clone(); m.userData.baseEmissive = m.material.emissive.clone(); m.userData.baseEI = m.material.emissiveIntensity;
      }
      meshToCtl.set(m, c);
    });
  }
  let hovered = null, drag = null, down = null;

  const setRay = (ev) => {
    const r = dom.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  };
  const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
  const pick = (ev) => {
    setRay(ev);
    for (const h of ray.intersectObject(root, true)) {
      if (!shown(h.object) || h.object.isSprite) continue;   // a hidden parent hides its children from the mouse too
      const rt = roomTarget(h.object); if (rt) return { ctl: rt, obj: h.object, point: h.point };   // the room view: a whole station is one target
      if (!isActive(h.object)) return null;                  // another station's part: scenery, and it blocks what is behind it
      const ctl = meshToCtl.get(h.object); if (ctl) return { ctl, obj: h.object, point: h.point };
      if (h.object.material && h.object.material.transparent && h.object.material.opacity < 0.5) continue;   // glass never blocks
      const view = focusOf.get(h.object); if (view) return { view, obj: h.object };
      return null;              // the first opaque thing that isn't interactive blocks
    }
    return null;
  };
  const highlight = (ctl, on) => {
    if (!ctl) return;
    for (const o of ctl.objects) o.traverse((m) => {
      if (!m.isMesh || m.userData.baseEmissive === undefined) return;
      if (on) { m.material.emissive.setRGB(0.10, 0.32, 0.45); m.material.emissiveIntensity = 1; }
      else { m.material.emissive.copy(m.userData.baseEmissive); m.material.emissiveIntensity = m.userData.baseEI; }
    });
  };
  let tipCtl = null;
  const showTip = (ev, html, ctl = null) => { tipCtl = ctl; tip.innerHTML = html; tip.style.display = "block"; tip.style.left = ev.clientX + 16 + "px"; tip.style.top = ev.clientY + 14 + "px"; };
  const tipHtml = (c) => `<div class="h">${c.name}</div><div class="s">${c.describe()}</div>`;

  // slide: the pointer ray meets a plane that contains the slide axis and faces the camera; the carrier follows the
  // component of that point along the axis, so it tracks the cursor from any viewing angle
  const plane = new THREE.Plane(), hitP = new THREE.Vector3();
  const along = (ev) => { setRay(ev); return ray.ray.intersectPlane(plane, hitP) ? hitP.dot(drag.axis) : null; };
  // plane drags and carrying: the pointer ray meets a horizontal plane at the part's height
  const hPlane = new THREE.Plane(), onPlane = (ev, y) => { setRay(ev); hPlane.set(new THREE.Vector3(0, 1, 0), -y); return ray.ray.intersectPlane(hPlane, new THREE.Vector3()); };
  const carryTip = (ev, C) => showTip(ev, `<div class="h">In your hand</div><div class="s">${C.describe()}</div>`, null);

  dom.addEventListener("pointermove", (ev) => {
    const C = carry();
    if (C && !drag) { const q = onPlane(ev, C.planeY()); if (q) C.move(q); highlight(hovered, false); hovered = null; dom.style.cursor = "grabbing"; carryTip(ev, C); return; }
    if (drag && drag.plane) { const q = onPlane(ev, drag.ctl.planeY()); if (q) drag.ctl.moveTo(q); showTip(ev, tipHtml(drag.ctl), drag.ctl); return; }
    if (drag && drag.rot) {
      const a = Math.atan2(ev.clientY - drag.c.y, ev.clientX - drag.c.x);
      let d = a - drag.a; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      drag.a = a; drag.ctl.rotate(d); showTip(ev, tipHtml(drag.ctl), drag.ctl); return;
    }
    if (drag) {
      const a = along(ev);
      if (a !== null) drag.ctl.set(drag.v0 + (a - drag.a0) / drag.ctl.worldPerUnit);
      showTip(ev, tipHtml(drag.ctl), drag.ctl);
      return;
    }
    const hit = pick(ev), ctl = hit && hit.ctl;
    if (ctl !== hovered) { highlight(hovered, false); highlight(ctl, true); hovered = ctl; }
    dom.style.cursor = ctl ? (ctl.kind === "slide" ? "ew-resize" : ctl.kind === "rotary" || ctl.kind === "plane" ? "grab" : "pointer") : hit && hit.view ? "zoom-in" : "default";
    if (ctl) showTip(ev, tipHtml(ctl), ctl); else { tip.style.display = "none"; tipCtl = null; }
  });
  dom.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    if (carry()) { down = { x: ev.clientX, y: ev.clientY, hit: null, carry: true }; return; }
    down = { x: ev.clientX, y: ev.clientY, hit: pick(ev) };
    const c = down.hit && down.hit.ctl;
    if (c && c.kind === "plane") {
      const q = onPlane(ev, c.planeY()); if (q) c.grab(q);
      drag = { ctl: c, plane: true }; orbit.enabled = false; dom.style.cursor = "grabbing"; dom.setPointerCapture(ev.pointerId);
    } else if (c && c.kind === "slide") {
      const axis = c.axis.clone().normalize(), toCam = camera.position.clone().sub(down.hit.point);
      const n = toCam.sub(axis.clone().multiplyScalar(toCam.dot(axis))).normalize();   // perpendicular to the axis, toward the camera
      plane.setFromNormalAndCoplanarPoint(n, down.hit.point);
      drag = { ctl: c, axis, v0: c.get(), a0: down.hit.point.dot(axis) };
      orbit.enabled = false; dom.style.cursor = "ew-resize"; dom.setPointerCapture(ev.pointerId);
    } else if (c && c.kind === "rotary") {
      // angular drag about the part's own centre on screen (as the Rankine handwheel)
      const v = (c.centre || c.objects[0]).getWorldPosition(new THREE.Vector3()).project(camera), r = dom.getBoundingClientRect();
      const cx = r.left + (v.x + 1) / 2 * r.width, cy = r.top + (1 - v.y) / 2 * r.height;
      drag = { ctl: c, rot: true, c: { x: cx, y: cy }, a: Math.atan2(ev.clientY - cy, ev.clientX - cx) };
      orbit.enabled = false; dom.style.cursor = "grabbing"; dom.setPointerCapture(ev.pointerId);
    }
  });
  dom.addEventListener("pointerup", (ev) => {
    const moved = down ? Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 5 : true;
    if (drag) { drag = null; orbit.enabled = true; down = null; return; }
    if (!down) return;
    if (down.carry) { const C = carry(); if (C && !moved) { const q = onPlane(ev, C.planeY()); C.drop(q); tip.style.display = "none"; } down = null; return; }
    if (!moved && down.hit) {
      if (down.hit.ctl && down.hit.ctl.click) { down.hit.ctl.click(); showTip(ev, tipHtml(down.hit.ctl), down.hit.ctl); }
      else if (down.hit.view) flyTo(down.hit.view);
    }
    down = null;
  });
  // scroll over a carrier moves it 1 mm per notch (Shift: 1 cm): fine focusing, and it doesn't zoom
  dom.addEventListener("wheel", (ev) => {
    // Chrome/Edge on Windows send Shift+wheel as a SIDEWAYS scroll (deltaX, deltaY = 0): read whichever axis moved, or
    // every "Shift: 5 deg / 1 mm" step would do nothing
    const dY = ev.deltaY || ev.deltaX;
    const C = carry(), P = C || (hovered && hovered.kind === "plane" ? hovered : null);
    if (P) { ev.preventDefault(); ev.stopImmediatePropagation(); P.turn(-Math.sign(dY), ev.shiftKey); if (C) carryTip(ev, C); else showTip(ev, tipHtml(P), P); return; }
    if (hovered && hovered.kind === "rotary") {
      ev.preventDefault(); ev.stopImmediatePropagation(); hovered.rotate(-Math.sign(dY) * (ev.shiftKey && hovered.wheelStepShift ? hovered.wheelStepShift : hovered.wheelStep ?? Math.PI / 36));   /* per control: the iris 5 deg, the protractor table 0.5 deg, the spectrometer arm 0.1 deg (Shift 1) */
      showTip(ev, tipHtml(hovered), hovered); return;
    }
    if (hovered && hovered.kind === "slide") {
      ev.preventDefault(); ev.stopImmediatePropagation();
      hovered.set(hovered.get() - Math.sign(dY) * (ev.shiftKey ? 1 : 0.1));
      showTip(ev, tipHtml(hovered), hovered);
    }
  }, { capture: true, passive: false });
  dom.addEventListener("pointerleave", () => { tip.style.display = "none"; tipCtl = null; });
  return { refresh() { if (tipCtl && tip.style.display === "block") { const h = tipHtml(tipCtl); if (tip.innerHTML !== h) tip.innerHTML = h; } } };
}
