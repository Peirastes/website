// The lab notebook (2026-10-11): a tablet lies on the ray table (Exp 212), the lens bench (213) and the spectrometer
// (214). Click it (or press N at that table) and the experiment's data sheet opens at the left of the world, laid out
// as the lab manual prints it; the apparatus stays in view beside it. The student types every number, raw and derived;
// the notebook never reads the apparatus (lab mode stays honest). It plots the manual's graph with the least-squares
// line, its equation and R^2 (the Excel step), and marks each derived cell and conclusion: does it follow from the
// student's own entries and the fit? Saved in this browser only; CSV download and a printable sheet.
// Sheets, fit and checks: ../../physics/labsheet.mjs (tested on Cole's keys).
import * as THREE from "three";
import { SHEETS, SHEET_OF_STATION, blank, fitOf, audit, fitLabel, toCSV, num, fillAuto } from "../physics/labsheet.mjs";
import { TABLE_Y, MATERIALS } from "./bench.js";

const STORE = "olv2-notebook-v1";
// where each tablet lies (station-local, on the table top's free front corner; checked against the apparatus' extents)
const TABLETS = { ray: { at: [-0.26, -0.235], yaw: 0 }, lens: { at: [-0.56, 0.29], yaw: 0.15 }, spec: { at: [-0.22, 0.225], yaw: 0.1 } };
const TAB = { w: 0.25, d: 0.18, h: 0.009 };

export function createNotebook({ stations, onLayout = () => {} }) {
  // ------------------------------------------------------------ state (one per experiment), saved in this browser
  let store = {};
  try { store = JSON.parse(localStorage.getItem(STORE) || "{}"); } catch { store = {}; }
  if (!store || typeof store !== "object" || Array.isArray(store)) store = {};   // a damaged saved value: start clean
  const stateOf = (id) => {
    const b = blank(id), s = store[id];
    if (!s) return (store[id] = fillAuto(id, b));
    for (const T of SHEETS[id].tables) b.t[T.id] = b.t[T.id].map((r, i) => ({ ...r, ...((s.t && s.t[T.id] && s.t[T.id][i]) || {}) }));   // a saved sheet keeps its shape if the sheet grows
    return (store[id] = fillAuto(id, { t: b.t, c: { ...(s.c || {}) }, meta: { ...b.meta, ...(s.meta || {}) } }));   // a sheet saved before a column went auto fills too
  };
  let saveT = 0;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(store)); } catch {} }, 250); };

  // ------------------------------------------------------------ the 3D tablets
  const tablets = {}, registry = [], labels = [];
  for (const [stId, def] of Object.entries(TABLETS)) {
    const st = stations[stId]; if (!st) continue;
    const id = SHEET_OF_STATION[stId], g = new THREE.Group(); g.name = "notebook:" + stId;
    g.position.set(def.at[0], TABLE_Y, def.at[1]); g.rotation.y = def.yaw;
    const body = new THREE.Mesh(new THREE.BoxGeometry(TAB.w, TAB.h, TAB.d), MATERIALS.anod); body.position.y = TAB.h / 2; body.castShadow = true; body.receiveShadow = true; g.add(body);
    const tex = new THREE.CanvasTexture(screenCanvas(id)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(TAB.w - 0.016, TAB.d - 0.016),
      new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.62, roughness: 0.25, metalness: 0 }));
    screen.rotation.x = -Math.PI / 2; screen.position.y = TAB.h + 0.0004; screen.name = "notebook:screen"; g.add(screen);
    st.group.add(g); tablets[stId] = g;
    registry.push({ id: "notebook:" + stId, name: "Lab notebook", kind: "click", objects: [g], click: () => open(stId),
      describe: () => `Exp ${id} data sheet: record your readings, plot, analyse<br>click to open (or press N)` });
    labels.push({ text: "Lab notebook", obj: g, off: [0, 0.02, 0], prio: 1, station: stId });
  }

  // ------------------------------------------------------------ the sheet (DOM)
  const el = document.createElement("div"); el.id = "notebook"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Lab notebook");
  el.innerHTML = `<div class="nb-bar"><span class="nb-name" id="nbName">Lab notebook</span><span class="nb-tools">
      <button class="es-btn" id="nbCsv" title="Download the tables as CSV (opens in Excel)">CSV</button>
      <button class="es-btn" id="nbPrint" title="Print the sheet and graph (or save as PDF)">Print</button>
      <button class="es-btn" id="nbClear" title="Erase this sheet">Clear</button>
      <button class="es-btn" id="nbClose" title="Close (Esc or N)">✕</button></span></div>
    <div class="nb-page" id="nbPage"></div>`;
  document.body.appendChild(el);
  const page = el.querySelector("#nbPage");
  let cur = null, curStation = null, canvas = null, fitBox = null;

  // a computed (auto) cell is read-only and out of the Tab order: it fills in from the row's own entries
  const cell = (where, val, cls = "", ph = "") => `<input class="nb-in ${cls}" data-w="${where}" value="${esc(val)}" placeholder="${ph}" inputmode="${cls.includes("nb-txt") ? "text" : "decimal"}" autocomplete="off" spellcheck="false"${cls.includes("nb-auto") ? ' readonly tabindex="-1" title="Fills in from your readings"' : ""}>`;
  function render() {
    const sh = SHEETS[cur], S = stateOf(cur);
    el.querySelector("#nbName").textContent = `Lab notebook · Exp ${cur}`;
    let h = `<div class="nb-head"><div class="nb-exp">${sh.title.toUpperCase()}</div><div class="nb-sub">${sh.subtitle.toUpperCase()}</div></div>
      <div class="nb-sec">Original data and observations</div>`;
    for (const T of sh.tables) {
      const lead = Array.isArray(T.rows) ? (T.rowHead || "") : T.trial ? "Trial" : null;
      h += `<table class="nb-tab"><thead><tr>${lead !== null ? `<th>${lead}</th>` : ""}${T.cols.map((C) => `<th${C.text ? ' style="width:15%"' : ""}>${C.head}${C.unit ? `<br><span class="u">(${C.unit === "−" ? "−" : C.unit})</span>` : ""}</th>`).join("")}</tr></thead><tbody>`;
      S.t[T.id].forEach((r, i) => {
        h += `<tr>${lead !== null ? `<td class="nb-lead">${Array.isArray(T.rows) ? T.rows[i] : i + 1}</td>` : ""}` +
          T.cols.map((C) => `<td data-c="${T.id}.${i}.${C.key}"${C.auto !== undefined ? ' class="auto"' : C.derive ? ' class="der"' : ""}>${cell(`t.${T.id}.${i}.${C.key}`, r[C.key] ?? "", C.text ? "nb-txt" : C.auto !== undefined ? "nb-auto" : "")}</td>`).join("") + "</tr>";
      });
      h += `</tbody></table><div class="nb-cap">${T.caption}</div>`;
      if (T.singles) h += `<div class="nb-singles">${T.singles.map((G) => `<label data-c="c.${G.key}" class="der"><span>${G.label}</span>${cell(`c.${G.key}`, S.c[G.key] ?? "")}<span class="u">${G.unit || ""}</span></label>`).join("")}</div>`;
    }
    h += `<div class="nb-sec">Graph</div><canvas class="nb-graph" id="nbGraph"></canvas><div class="nb-fit" id="nbFit"></div>`;
    h += `<div class="nb-sec">Conclusions</div><div class="nb-concl">${sh.conclusions.map((G) => `<label data-c="c.${G.key}"${G.derive ? ' class="der"' : ""}><span>${G.label}</span>${cell(`c.${G.key}`, S.c[G.key] ?? "")}<span class="u">${G.unit || ""}</span></label>`).join("")}</div>`;
    h += `<div class="nb-namebox"><label>Name ${cell("m.name", S.meta.name, "nb-txt")}</label><label>Lab section ${cell("m.section", S.meta.section, "nb-txt")}</label><label>Date ${cell("m.date", S.meta.date, "nb-txt")}</label></div>
      <div class="nb-foot">Type every reading and every calculated value, as on the paper sheet (a shaded column fills in by itself). A <span class="nb-ok">✓</span> means a calculated entry follows from your own entries (or the graph's fit); a <span class="nb-bad">!</span> means it does not: check the arithmetic. Neither says whether a reading is right. Saved in this browser only.</div>`;
    page.innerHTML = h;
    canvas = page.querySelector("#nbGraph"); fitBox = page.querySelector("#nbFit");
    refresh();
  }
  // marks, graph, fit
  function refresh() {
    const S = stateOf(cur), A = audit(cur, S), byWhere = new Map(A.map((a) => [a.where, a]));
    page.querySelectorAll("[data-c]").forEach((td) => {
      const a = byWhere.get(td.dataset.c); td.classList.toggle("ok", !!a && a.ok); td.classList.toggle("bad", !!a && !a.ok);
      const G = SHEETS[cur].conclusions.find((g) => "c." + g.key === td.dataset.c);
      td.title = !a ? "" : a.bad ? "Not a number" : a.ok ? "Follows from your entries" : G && G.fromFit ? "Does not match the graph's fit" : "Does not follow from your entries: check the arithmetic";
    });
    drawGraph();
  }
  function drawGraph() {
    if (!canvas) return;
    const sh = SHEETS[cur], S = stateOf(cur), pts = sh.graph.points(S), fit = fitOf(cur, S);
    const W = canvas.clientWidth || 500, H = Math.round(W * 0.62), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(W * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    canvas.style.height = H + "px";
    const g = canvas.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    plot(g, W, H, sh.graph, pts, fit);
    fitBox.innerHTML = fit ? `<b>${esc(fitLabel(fit, sh.graph.ySym, sh.graph.xSym))}</b> &nbsp; R² = ${fit.r2.toFixed(4)} &nbsp;<span class="u">(${fit.n} points, least squares)</span>`
      : `<span class="u">${pts.length ? "One point so far: the line needs two." : "The graph fills in as you type."}</span>`;
  }
  page.addEventListener("input", (e) => {
    const w = e.target.dataset && e.target.dataset.w; if (!w) return;
    const S = stateOf(cur), [kind, a, b, k] = w.split(".");
    if (kind === "t") S.t[a][+b][k] = e.target.value; else if (kind === "c") S.c[a] = e.target.value; else if (kind === "m") S.meta[a] = e.target.value;
    if (kind === "t") { fillAuto(cur, S); page.querySelectorAll("input.nb-auto").forEach((x) => { const [, ta, tb, tk] = x.dataset.w.split("."); x.value = S.t[ta][+tb][tk] ?? ""; }); }
    save(); refresh();
  });
  // Enter moves down a column (as on paper, a column at a time); Esc closes
  page.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === "Enter" && e.target.dataset.w) {
      e.preventDefault(); const w = e.target.dataset.w.split(".");
      const next = w[0] === "t" && page.querySelector(`[data-w="t.${w[1]}.${+w[2] + 1}.${w[3]}"]`);
      const all = [...page.querySelectorAll("input.nb-in:not([readonly])")]; (next || all[all.indexOf(e.target) + 1] || e.target).focus();
    }
  });
  el.querySelector("#nbClose").addEventListener("click", () => close());
  el.querySelector("#nbClear").addEventListener("click", () => {
    if (!confirm(`Erase the Exp ${cur} sheet? This cannot be undone.`)) return;
    store[cur] = blank(cur); save(); render();
  });
  el.querySelector("#nbCsv").addEventListener("click", () => {
    const blob = new Blob(["﻿" + toCSV(cur, stateOf(cur))], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `Exp ${cur} data.csv`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  el.querySelector("#nbPrint").addEventListener("click", () => window.print());
  window.addEventListener("resize", () => { if (cur && isOpen()) drawGraph(); });

  // ------------------------------------------------------------ open / close
  const isOpen = () => document.body.classList.contains("nb-open");
  function open(stId) {
    const id = SHEET_OF_STATION[stId]; if (!id) return false;
    const was = isOpen(); curStation = stId;
    if (cur !== id || !page.firstChild) { cur = id; render(); }
    document.body.classList.add("nb-open");
    if (!was) { drawGraph(); onLayout(); }
    return true;
  }
  function close() { if (!isOpen()) return; document.body.classList.remove("nb-open"); if (document.activeElement && el.contains(document.activeElement)) document.activeElement.blur(); onLayout(); }
  // the notebook follows you between tables; at a table without one (the wave bench) or in the room it closes
  function follow(stId) { if (!isOpen()) return; if (SHEET_OF_STATION[stId]) open(stId); else close(); }
  const right = () => (isOpen() && window.innerWidth > 920 ? el.getBoundingClientRect().right : 0);
  return { registry, labels, tablets, open, close, follow, isOpen, right, toggle: (stId) => (isOpen() ? (close(), true) : open(stId)),
    sheet: () => cur, state: (id = cur) => stateOf(id), refresh, el };
}

function esc(s) { return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }

// the manual's graph, drawn as the Excel chart Cole's keys use: title, both axes from 0, blue points, a dotted
// least-squares line over the data, the equation and R^2 at the right
function plot(g, W, H, G, pts, fit) {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#3a3f47"; g.textAlign = "center"; g.textBaseline = "top"; g.font = `${Math.max(11, Math.round(W / 38))}px Inter, system-ui, sans-serif`;
  wrapText(g, G.title, W / 2, 8, W - 30, Math.max(13, Math.round(W / 32)));
  const L = 62, R = 16, T = 46, B = 46, pw = W - L - R, ph = H - T - B;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const ax = niceAxis(Math.min(0, ...xs), Math.max(0, ...xs, 1e-12)), ay = niceAxis(Math.min(0, ...ys), Math.max(0, ...ys, 1e-12));
  const X = (x) => L + (x - ax.lo) / (ax.hi - ax.lo) * pw, Y = (y) => T + ph - (y - ay.lo) / (ay.hi - ay.lo) * ph;
  g.strokeStyle = "#d0d4da"; g.lineWidth = 1; g.font = "10.5px Inter, system-ui, sans-serif"; g.fillStyle = "#595959";
  g.beginPath(); g.moveTo(L, Y(0) + 0.5); g.lineTo(L + pw, Y(0) + 0.5); g.moveTo(X(0) + 0.5, T); g.lineTo(X(0) + 0.5, T + ph); g.stroke();
  g.textAlign = "center"; g.textBaseline = "top";
  for (const t of ax.ticks) g.fillText(fmtTick(t, ax.step), X(t), T + ph + 5);
  g.textAlign = "right"; g.textBaseline = "middle";
  for (const t of ay.ticks) g.fillText(fmtTick(t, ay.step), L - 6, Y(t));
  g.textAlign = "center"; g.textBaseline = "bottom"; g.fillText(G.x, L + pw / 2, H - 6);
  g.save(); g.translate(13, T + ph / 2); g.rotate(-Math.PI / 2); g.textBaseline = "middle"; g.fillText(G.y, 0, 0); g.restore();
  if (fit && pts.length > 1) {
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    g.strokeStyle = "#4472c4"; g.lineWidth = 1.6; g.setLineDash([2, 3]);
    g.beginPath(); g.moveTo(X(x0), Y(fit.slope * x0 + fit.intercept)); g.lineTo(X(x1), Y(fit.slope * x1 + fit.intercept)); g.stroke(); g.setLineDash([]);
  }
  g.fillStyle = "#4472c4";
  for (const [x, y] of pts) { g.beginPath(); g.arc(X(x), Y(y), 3.8, 0, Math.PI * 2); g.fill(); }
  if (fit && pts.length > 1) {
    g.fillStyle = "#3a3f47"; g.font = "11px Inter, system-ui, sans-serif"; g.textAlign = "right"; g.textBaseline = "top";
    const ty = fit.slope < 0 ? T + 8 : T + ph * 0.55;
    g.fillText(fitLabel(fit, G.ySym, G.xSym), L + pw - 4, ty); g.fillText(`R² = ${fit.r2.toFixed(4)}`, L + pw - 4, ty + 15);
  }
}
function niceAxis(lo, hi) {
  if (hi - lo <= 0) hi = lo + 1;
  const raw = (hi - lo) / 6, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
  const step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  const a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step, ticks = [];
  for (let t = a; t <= b + step * 1e-6; t += step) ticks.push(Math.abs(t) < step * 1e-9 ? 0 : t);
  return { lo: a, hi: b, step, ticks };
}
const fmtTick = (t, step) => (t === 0 ? "0" : t.toFixed(Math.max(0, -Math.floor(Math.log10(step) + 1e-9) + (step / Math.pow(10, Math.floor(Math.log10(step))) === 2.5 ? 1 : 0))));
function wrapText(g, text, x, y, maxW, lh) {
  const words = text.split(" "); let line = "";
  for (const w of words) { const t = line ? line + " " + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t; }
  g.fillText(line, x, y);
}

// the tablet's screen: a small picture of the data sheet (a table and a graph), so it reads as a notebook from afar
function screenCanvas(id) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 368; const g = c.getContext("2d");
  g.fillStyle = "#e9e6de"; g.fillRect(0, 0, 512, 368);
  g.fillStyle = "#222831"; g.font = "bold 30px 'Times New Roman', serif"; g.fillText(`EXPERIMENT ${id}`, 24, 46);
  g.font = "16px 'Times New Roman', serif"; g.fillText(SHEETS[id].subtitle.toUpperCase(), 24, 72);
  g.strokeStyle = "#4a5260"; g.lineWidth = 1.5;
  for (let r = 0; r <= 6; r++) { g.beginPath(); g.moveTo(24, 96 + r * 24); g.lineTo(270, 96 + r * 24); g.stroke(); }
  for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(24 + k * 61.5, 96); g.lineTo(24 + k * 61.5, 240); g.stroke(); }
  g.strokeStyle = "#8a8f98"; g.beginPath(); g.moveTo(300, 100); g.lineTo(300, 236); g.lineTo(488, 236); g.stroke();
  g.fillStyle = "#4472c4"; const pts = [[318, 222], [348, 200], [378, 176], [410, 156], [442, 130], [472, 112]];
  for (const [x, y] of pts) { g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); }
  g.strokeStyle = "#4472c4"; g.setLineDash([3, 4]); g.beginPath(); g.moveTo(312, 226); g.lineTo(480, 106); g.stroke(); g.setLineDash([]);
  g.fillStyle = "#222831"; g.font = "bold 22px Inter, system-ui, sans-serif"; g.fillText("LAB NOTEBOOK", 24, 300);
  g.font = "16px Inter, system-ui, sans-serif"; g.fillStyle = "#4a5260"; g.fillText("record · plot · analyse", 24, 328);
  return c;
}
