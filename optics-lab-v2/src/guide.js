// THE GUIDE: a lab's procedure, one step at a time (as the Rankine Cycler's guided procedure). Each step says what to
// do and why, flies the camera to the part, and marks the part (a pulsing ring) or the notebook cell (a pulsing outline)
// to use. A step completes from the bench's STATE (a part placed, the table turned, a notebook cell filled) - never a
// Next button - except the student's own judgement calls ("the ray looks straight"), which they confirm on the card.
// Back and Skip are always there.
//
// procedure = { id, title, station, phases: [{ id, name }], steps: [step], done: "closing text" }
// step = { id, phase, title, why, watch?, view?, kind?: "do" | "confirm", confirm?: "button text",
//          ready?(ctx) (confirm steps: the button is live only then), notReady?: "what to do first",
//          done(ctx), target?(ctx) -> { obj, off } (a 3D part) | { cell: "t.t1.3.r" } (a notebook cell) | null,
//          notebook?: true (open the lab notebook on this step) }
export function createGuide({ $, flyTo, screenPoint, notebook, onExit }) {
  const card = document.createElement("div"); card.id = "guide"; document.body.appendChild(card);
  const ring = document.createElement("div"); ring.id = "guideRing"; document.body.appendChild(ring);
  // revisit: a step returned to with Back. If it is already done it waits (Skip goes on) instead of jumping straight back
  // ahead; once its state is undone and done again (the student redid it), it advances as usual
  let P = null, i = 0, confirmed = false, shown = false, ctxFn = null, enteredAt = 0, lastCell = null, html = "", revisit = false, undone = false;
  const isActive = () => !!P;
  const step = () => (P && i < P.steps.length ? P.steps[i] : null);

  function enter(k, back = false) {
    i = Math.max(0, Math.min(P.steps.length, k)); confirmed = false; enteredAt = performance.now(); html = ""; revisit = back; undone = false;
    const s = step(); if (!s) return;
    if (s.notebook) notebook.open(P.station);
    // a step on the bench: leave the notebook's cell, or the bench's keys (F, arrows) would type into it
    else if (document.activeElement && notebook.el.contains(document.activeElement)) document.activeElement.blur();
    if (s.view) flyTo(s.view);
  }
  function start(proc, ctx) { P = proc; ctxFn = ctx; enter(0); setShown(true); }
  function stop() { P = null; setShown(false); clearCell(); onExit?.(); }
  function setShown(on) { shown = on && !!P; card.style.display = shown ? "block" : "none"; if (!shown) { ring.style.display = "none"; clearCell(); } }
  function clearCell() { if (lastCell) lastCell.classList.remove("guide-target"); lastCell = null; }

  card.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-g]"); if (!b || !P) return;
    const a = b.dataset.g;
    if (a === "back") enter(i - 1, true);
    else if (a === "skip") enter(i + 1);
    else if (a === "confirm") confirmed = true;
    else if (a === "close") stop();
  });

  function render(ctx) {
    const s = step(), n = P.steps.length;
    const pi = s ? P.phases.findIndex((ph) => ph.id === s.phase) : P.phases.length;      // phases before it: done
    const tracker = P.phases.map((ph, k) => `<span class="g-ph${k < pi ? " done" : k === pi ? " on" : ""}">${ph.name}</span>`).join("");
    let body;
    if (!s) body = `<div class="g-title">${P.title}: procedure complete</div><div class="g-why">${P.done}</div>
      <div class="g-btns"><button class="es-btn" data-g="back">Back</button><button class="es-btn" data-g="close">Close the guide</button></div>`;
    else {
      const ready = s.kind === "confirm" ? (s.ready ? s.ready(ctx) : true) : true;
      body = `<div class="g-step">Step ${i + 1} of ${n}</div><div class="g-title">${s.title}</div>
        <div class="g-why">${s.why}</div>${s.watch ? `<div class="g-watch">${s.watch}</div>` : ""}
        ${s.kind === "confirm" ? (ready ? "" : `<div class="g-note">${s.notReady || ""}</div>`) : ""}
        ${revisit && !undone && s.kind !== "confirm" && s.done(ctx) ? `<div class="g-note">Already done. Change it to redo this step, or Skip to go on.</div>` : ""}
        <div class="g-btns"><button class="es-btn" data-g="back"${i === 0 ? " disabled" : ""}>Back</button>
        ${s.kind === "confirm" ? `<button class="es-btn g-ok" data-g="confirm"${ready ? "" : " disabled"}>${s.confirm || "Confirm"}</button>` : ""}
        <button class="es-btn" data-g="skip">Skip</button><button class="es-btn" data-g="close" title="Close the guide (your work stays)">✕</button></div>`;
    }
    const h = `<div class="g-head"><span class="g-lab">GUIDE · ${P.title}</span></div><div class="g-tracker">${tracker}</div>${body}`;
    if (h !== html) { card.innerHTML = h; html = h; }
  }

  // called every frame by main.js; visible = the guide's station is the one on screen
  function update(visible) {
    if (!P) return;
    if (visible !== shown) setShown(visible);
    if (!shown) return;
    const ctx = ctxFn();
    const s = step();
    if (s) {
      const ok = s.kind === "confirm" ? confirmed && (!s.ready || s.ready(ctx)) : s.done(ctx);
      if (revisit && !ok) undone = true;
      if (ok && (!revisit || undone || confirmed) && performance.now() - enteredAt > 350) { enter(i + 1); return; }
    }
    render(ctx);
    // the card sits at the bottom, right of the notebook when it is open
    card.style.left = Math.max(16, notebook.right() + 16) + "px";
    // the target: a ring on a 3D part, or an outline on a notebook cell
    const t = s && s.target ? s.target(ctx) : null;
    if (t && t.obj) {
      const xy = screenPoint(t.obj, t.off || [0, 0, 0]);
      const onScreen = xy && xy[0] > 0 && xy[1] > 0 && xy[0] < innerWidth && xy[1] < innerHeight;
      ring.style.display = onScreen ? "block" : "none"; if (onScreen) { ring.style.left = xy[0] + "px"; ring.style.top = xy[1] + "px"; }
    } else ring.style.display = "none";
    const cell = t && t.cell && notebook.isOpen() ? notebook.el.querySelector(`[data-w="${t.cell}"]`) : null;
    if (cell !== lastCell) { clearCell(); if (cell) { cell.classList.add("guide-target"); lastCell = cell; } }
  }
  return { start, stop, update, isActive, index: () => i, step, confirm: () => { confirmed = true; }, skip: () => enter(i + 1), back: () => enter(i - 1, true), el: card };
}
