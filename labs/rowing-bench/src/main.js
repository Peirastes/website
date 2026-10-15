// Rowing Generator Bench: controls, readouts, live plots, leader labels and the frame loop.
// Physics: plant.js (a port of sim/rowing_plant.py). Scene: scene.js. Circuit view: circuit.js.
import { Plant } from './plant.js';
import { Rig } from './scene.js';
import { Circuit } from './circuit.js';

const $ = (id) => document.getElementById(id);
const plant = new Plant();
const F_MAX0 = plant.p.F_max;
const rig = new Rig($('stage'));
const circuit = new Circuit($('cktSvg'), $('cktTitle'), $('cktNote'));
let timeScale = 1;

// ---------------------------------------------------------------- controls
const setOn = (btn, on) => btn.classList.toggle('on', on);
$('rowBtn').onclick = () => { plant.rowing = true; setOn($('rowBtn'), true); setOn($('stopBtn'), false); };
$('stopBtn').onclick = () => { plant.rowing = false; setOn($('rowBtn'), false); setOn($('stopBtn'), true); };
$('resetBtn').onclick = () => { plant.reset(); hist.length = 0; battLog.length = 0; };
$('timeScale').onchange = (e) => { timeScale = +e.target.value; };
$('effort').oninput = (e) => { plant.p.F_max = F_MAX0 * e.target.value / 100; $('effV').textContent = e.target.value + '%'; };
$('gear').oninput = (e) => { plant.p.G = +e.target.value; $('gV').textContent = (+e.target.value).toFixed(1); };
$('jfly').oninput = (e) => { plant.p.J_fly = e.target.value * 1e-4; $('jV').textContent = (e.target.value * 1e-4).toExponential(1) + ' kg·m²'; };
$('rl').oninput = (e) => { plant.p.R_load = +e.target.value; $('rlV').textContent = (+e.target.value).toFixed(1) + ' Ω'; };
$('rin').oninput = (e) => { plant.p.R_in = +e.target.value; };
$('track').onchange = (e) => { plant.p.track_Rin = e.target.checked; $('rin').disabled = e.target.checked; };
$('dischargeBtn').onclick = () => plant.dischargeCap();
// battery presets: open-circuit voltage, capacity, internal resistance (all placeholders, typical values)
const BATTERIES = {
  li1s:  { V_b0: 3.85, Q_Ah: 4.0, R_b: 0.03 },
  sla12: { V_b0: 12.0, Q_Ah: 1.2, R_b: 0.05 },
  li3s:  { V_b0: 11.1, Q_Ah: 2.2, R_b: 0.06 },
  sla7:  { V_b0: 12.0, Q_Ah: 7.0, R_b: 0.03 },
  car:   { V_b0: 12.0, Q_Ah: 50, R_b: 0.01 },
};
const battLog = [];                       // (t, E_batt) samples for the charging-rate estimate
$('battery').onchange = (e) => { Object.assign(plant.p, BATTERIES[e.target.value]); plant.s.Vb = plant.p.V_b0; battLog.length = 0; };
$('soc0').oninput = (e) => { plant.p.soc0 = e.target.value / 100; plant.s.soc = plant.p.soc0; $('socV').textContent = e.target.value + '%'; battLog.length = 0; };
Object.assign(plant.p, BATTERIES[$('battery').value]);
function fmtDur(sec) {
  if (!isFinite(sec) || sec <= 0) return '—';
  const h = Math.floor(sec / 3600), m = Math.round((sec - 3600 * h) / 60);
  return h ? `${h} h ${m} min` : m ? `${m} min` : `${Math.round(sec)} s`;
}
const LOAD_NAME = { open: 'open circuit', R: 'resistor', C: 'capacitor', batt: 'battery' };
function setLoad(v) {
  plant.load = v;
  $('grpR').style.display = v === 'R' ? '' : 'none';
  $('grpC').style.display = v === 'C' ? '' : 'none';
  $('grpB').style.display = v === 'batt' ? '' : 'none';
}
$('load').onchange = (e) => setLoad(e.target.value);
setLoad($('load').value);
plant.p.track_Rin = $('track').checked; $('rin').disabled = $('track').checked;

// ---------------------------------------------------------------- readouts
const chip = (cls, sym, val) => `<div class="chip"><i>${sym}</i> = <b class="${cls}">${val}</b></div>`;
function loadEnergy() {
  const E = plant.E;
  return plant.load === 'R' ? E.loadR : plant.load === 'C' ? E.stored : plant.load === 'batt' ? E.batt : 0;
}
function renderChips() {
  const s = plant.s, p = plant.p, E = plant.E;
  const rpm = s.w_m * 60 / (2 * Math.PI);
  const eta = E.hand > 1 ? 100 * loadEnergy() / E.hand : 0;
  const rate = plant.strokeRate ? plant.strokeRate() : 0;
  let store;
  if (plant.load === 'C') store = chip('c-s', 'V<sub>c</sub>', s.Vc.toFixed(2) + ' V') + chip('c-s', '½CV²', E.stored.toFixed(1) + ' J');
  else if (plant.load === 'batt') {
    // charging rate = energy into the battery over the last ~20 s of simulated time (several strokes)
    let Pm = 0;
    if (battLog.length > 1) { const a = battLog[0], b = battLog[battLog.length - 1]; if (b.t > a.t) Pm = (b.E - a.E) / (b.t - a.t); }
    const capWh = p.V_b0 * p.Q_Ah;
    const remJ = (1 - s.soc) * capWh * 3600;
    store = chip('c-s', 'SOC', (100 * s.soc).toFixed(2) + ' %') + chip('c-s', 'E<sub>batt</sub>', (E.batt / 3600).toFixed(3) + ' Wh') +
      chip('c-s', 'P<sub>batt</sub>', Pm.toFixed(2) + ' W') +
      chip('c-s', 'to full', s.soc >= 1 ? 'full' : fmtDur(Pm > 1e-3 ? remJ / Pm : NaN)) +
      chip('c-s', 'capacity', capWh.toFixed(1) + ' Wh') + chip('c-s', '30 min', Pm > 0 ? (100 * Pm * 1800 / (capWh * 3600)).toFixed(1) + ' %' : '—');
  }
  else if (plant.load === 'R') store = chip('c-s', 'E<sub>R</sub>', E.loadR.toFixed(1) + ' J') + chip('c-s', 'R<sub>L</sub>', p.R_load.toFixed(1) + ' Ω');
  else store = chip('c-s', 'i', '0 A') + chip('c-s', 'v<sub>oc</sub>', s.e.toFixed(2) + ' V');
  $('chips').innerHTML =
    chip('c-f', 'F', s.T.toFixed(1) + ' N') + chip('c-f', 'v', s.vh.toFixed(2) + ' m/s') +
    chip('c-m', 'n<sub>m</sub>', rpm.toFixed(0) + ' rpm') + chip('c-e', 'e', s.e.toFixed(2) + ' V') +
    chip('c-i', 'i', s.i.toFixed(2) + ' A') + chip('c-p', 'P<sub>h</sub>', s.P_hand.toFixed(1) + ' W') +
    chip('c-p', 'P<sub>L</sub>', s.P_load.toFixed(1) + ' W') + chip('c-p', 'η', eta.toFixed(0) + ' %') +
    store + chip('c-m', 'rate', (rate || 0).toFixed(1) + ' spm') + chip('c-m', 'strokes', String(s.strokes));
  const clutch = s.locked ? '<b style="color:#ffae20">engaged</b>' : 'overrunning';
  $('status').innerHTML = `t = <b>${s.t.toFixed(1)} s</b> · ${s.phase} · clutch ${clutch}` +
    (plant.load === 'batt' ? ` · R<sub>in</sub> = <b>${plant.Rin().toFixed(2)} Ω</b>` : '') +
    `<br>η = energy into the load ÷ work at the handle, since reset.`;
  $('mode').textContent = `Load: ${LOAD_NAME[plant.load]} · ${plant.rowing ? 'rowing' : 'stopped'}${timeScale !== 1 ? ' · ' + timeScale + '×' : ''}`;
  if (plant.p.track_Rin) $('rinV').textContent = plant.Rin().toFixed(2) + ' Ω (tracking)';
  else $('rinV').textContent = plant.p.R_in.toFixed(1) + ' Ω';
}

// ---------------------------------------------------------------- live plots (last 6 s of sim time)
let WINDOW = 6;                         // plot window in sim seconds: 6 s of real time at any speed
const hist = [];
const PLOTS = [
  { title: 'ω and n·v  (rad/s) · shaded: clutch engaged', series: [['w', '#7dd6ff', false], ['nv', '#ffae20', true]] },
  { title: 'handle force F  (N)', series: [['F', '#ffb36b', false]] },
  { title: 'current i  (A)', series: [['i', '#9ae6b4', false]] },
  { title: '', series: [['y4', '#7ee8f0', false]] },
];
const plotsEl = $('plots');
for (const pl of PLOTS) {
  const lab = document.createElement('div'); lab.className = 'es-input-label'; lab.style.marginTop = '6px'; lab.textContent = pl.title; pl.lab = lab;
  const c = document.createElement('canvas'); c.className = 'pl'; pl.c = c;
  plotsEl.appendChild(lab); plotsEl.appendChild(c);
}
function y4Title() {
  return plant.load === 'C' ? 'capacitor voltage V_c  (V)' : plant.load === 'batt' ? 'power into the battery V_b·i_b  (W)'
    : plant.load === 'R' ? 'power into R_L  (W)' : 'open-circuit voltage e  (V)';
}
function y4() {
  const s = plant.s;
  return plant.load === 'C' ? s.Vc : plant.load === 'batt' ? s.Vb * s.i_batt : plant.load === 'R' ? s.P_load : s.e;
}
function drawPlots() {
  PLOTS[3].lab.textContent = y4Title();
  if (!hist.length) return;
  const t1 = hist[hist.length - 1].t, t0 = t1 - WINDOW;
  for (const pl of PLOTS) {
    const c = pl.c, dpr = Math.min(2, devicePixelRatio), W = c.clientWidth, H = c.clientHeight;
    if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    let lo = 0, hi = 1e-6;
    for (const h of hist) for (const [k] of pl.series) { lo = Math.min(lo, h[k]); hi = Math.max(hi, h[k]); }
    hi *= 1.1; if (lo < 0) lo *= 1.1;
    const X = (t) => 30 + (t - t0) / WINDOW * (W - 36), Y = (v) => H - 12 - (v - lo) / (hi - lo) * (H - 20);
    // engaged shading on the first plot
    if (pl === PLOTS[0]) {
      g.fillStyle = 'rgba(255,174,32,.10)';
      let start = null;
      for (const h of hist) { if (h.locked && start === null) start = h.t; if (!h.locked && start !== null) { g.fillRect(X(start), 4, X(h.t) - X(start), H - 16); start = null; } }
      if (start !== null) g.fillRect(X(start), 4, X(t1) - X(start), H - 16);
    }
    // axes: zero line + scale labels
    g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1; g.beginPath(); g.moveTo(30, Y(0)); g.lineTo(W - 4, Y(0)); g.stroke();
    g.fillStyle = 'rgba(232,232,232,.75)'; g.font = '9px Share Tech Mono, monospace'; g.textAlign = 'right';
    g.fillText(fmt(hi), 27, 12); g.fillText(fmt(lo), 27, H - 10);
    g.textAlign = 'left'; g.fillText('−' + fmtWin(WINDOW), 30, H - 1); g.textAlign = 'right'; g.fillText('now', W - 4, H - 1);
    for (const [k, col, dash] of pl.series) {
      g.strokeStyle = col; g.lineWidth = 1.6; g.setLineDash(dash ? [4, 3] : []); g.beginPath();
      let first = true;
      for (const h of hist) { const x = X(h.t), y = Y(h[k]); if (first) { g.moveTo(x, y); first = false; } else g.lineTo(x, y); }
      g.stroke(); g.setLineDash([]);
    }
  }
}
const fmtWin = (w) => w >= 120 ? (w / 60).toFixed(0) + ' min' : w.toFixed(0) + ' s';
const fmt = (v) => Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);

// ---------------------------------------------------------------- leader labels
const labelsEl = $('labels'); const labelDivs = new Map();
function drawLabels() {
  for (const [name, v] of rig.anchors(plant)) {
    let d = labelDivs.get(name);
    if (!d) { d = document.createElement('div'); d.className = 'lbl'; d.textContent = name; labelsEl.appendChild(d); labelDivs.set(name, d); }
    if (name === 'load') d.textContent = { open: 'open terminals', R: 'resistor bank', C: 'diode + supercapacitor', batt: 'controller + battery' }[plant.load];
    const [x, y, vis] = rig.project(v);
    d.style.display = vis ? '' : 'none'; d.style.left = x + 'px'; d.style.top = y + 'px';
  }
}

// ---------------------------------------------------------------- loop
const rail = $('rail');
function resize() { rig.resize(rail); }
addEventListener('resize', resize); resize();
let last = performance.now(), chipT = 0;
function frame(now) {
  const dtReal = Math.min(0.05, (now - last) / 1000); last = now;
  const dt = dtReal * timeScale;
  WINDOW = 6 * Math.max(1, timeScale);
  plant.advance(dt);
  const s = plant.s;
  if (plant.load === 'batt') {
    battLog.push({ t: s.t, E: plant.E.batt });
    while (battLog.length > 2 && battLog[0].t < s.t - 20 * Math.max(1, timeScale / 10)) battLog.shift();
  }
  hist.push({ t: s.t, w: s.w_m, nv: (plant.p.G / plant.p.r_spool) * s.vh, locked: s.locked, F: s.T, i: s.i, y4: y4() });
  while (hist.length && hist[0].t < s.t - WINDOW) hist.shift();
  rig.update(plant, plant.load);
  circuit.update(plant, plant.load, dt);
  drawLabels();
  chipT += dtReal;
  if (chipT > 0.1) { chipT = 0; renderChips(); drawPlots(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// headless checks drive the bench through this handle
window.__bench = { plant, rig, circuit, setLoad: (v) => { $('load').value = v; setLoad(v); }, advance: (sec) => { for (let j = 0; j < sec * 60; j++) plant.advance(1 / 60); } };
