// The load circuit, drawn literally as an SVG schematic, with the current shown as dots moving along
// the wires at a speed proportional to the current (stopped when it is zero). Rebuilt on a load change.
const NS = 'http://www.w3.org/2000/svg';
const INK = '#cfd6de', AMB = '#ffae20', CYAN = '#7dd6ff', GRN = '#9ae6b4';

function el(tag, attrs, parent, text) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (text !== undefined) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
const wire = (g, d) => el('path', { d, fill: 'none', stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);
const txt = (g, x, y, s, o = {}) => el('text', { x, y, fill: o.fill || INK, 'font-size': o.size || 11, 'font-family': o.mono ? 'Share Tech Mono, monospace' : 'Times New Roman, serif', 'font-style': o.mono ? 'normal' : 'italic', 'text-anchor': o.anchor || 'middle' }, g, s);

function zigzagH(x0, x1, y) {          // horizontal resistor
  const n = 6, w = (x1 - x0) / n; let d = `M${x0},${y}`;
  for (let j = 0; j < n; j++) d += ` L${x0 + w * (j + 0.25)},${y - 6} L${x0 + w * (j + 0.75)},${y + 6}`;
  return d + ` L${x1},${y}`;
}
function zigzagV(x, y0, y1) {          // vertical resistor
  const n = 6, h = (y1 - y0) / n; let d = `M${x},${y0}`;
  for (let j = 0; j < n; j++) d += ` L${x - 6},${y0 + h * (j + 0.25)} L${x + 6},${y0 + h * (j + 0.75)}`;
  return d + ` L${x},${y1}`;
}

export class Circuit {
  constructor(svg, titleEl, noteEl) {
    this.svg = svg; this.title = titleEl; this.note = noteEl; this.mode = null; this.off1 = 0; this.off2 = 0;
  }

  build(mode) {
    this.mode = mode;
    const svg = this.svg; svg.innerHTML = '';
    const g = el('g', {}, svg);
    const yT = 26, yB = 128, xs = 40;
    // the motor: source e = k omega with its winding resistance R_w (inside the dashed box)
    el('rect', { x: 10, y: 10, width: 118, height: 132, rx: 6, fill: 'none', stroke: 'rgba(255,255,255,.28)', 'stroke-dasharray': '4 3' }, g);
    txt(g, 69, 139, 'motor', { mono: true, size: 9.5, fill: 'rgba(255,255,255,.55)' });
    el('circle', { cx: xs, cy: 77, r: 15, fill: 'none', stroke: INK, 'stroke-width': 1.6 }, g);
    txt(g, xs, 73, '+', { mono: true, size: 12 }); txt(g, xs, 89, '−', { mono: true, size: 12 });
    wire(g, `M${xs},${yT} L${xs},62 M${xs},92 L${xs},${yB}`);
    wire(g, zigzagH(62, 108, yT)); wire(g, `M${xs},${yT} L62,${yT} M108,${yT} L128,${yT}`);
    txt(g, 85, yT - 12, 'R', {}).appendChild(el('tspan', { 'font-size': 8, dy: 3 }, null, 'w'));
    this.lblE = txt(g, 82, 82, '', { mono: true, size: 10.5, fill: CYAN, anchor: 'start' });
    let path1 = '', path2 = null;
    if (mode === 'open') {
      wire(g, `M128,${yT} L240,${yT}`); el('circle', { cx: 240, cy: yT, r: 3, fill: INK }, g); el('circle', { cx: 290, cy: yT, r: 3, fill: INK }, g);
      wire(g, `M240,${yT} L284,${yT - 18}`); wire(g, `M290,${yT} L380,${yT} L380,${yB} L${xs},${yB}`);
      txt(g, 265, yT + 22, 'open switch: no current', { mono: true, size: 10 });
      path1 = `M${xs},${yT} L128,${yT}`;
      this.title.textContent = 'Load circuit · open';
    } else if (mode === 'R') {
      wire(g, `M128,${yT} L340,${yT} L340,48`); wire(g, zigzagV(340, 48, 106)); wire(g, `M340,106 L340,${yB} L${xs},${yB}`);
      txt(g, 362, 82, 'R', {}).appendChild(el('tspan', { 'font-size': 8, dy: 3 }, null, 'L'));
      path1 = `M${xs},${yT} L340,${yT} L340,${yB} L${xs},${yB} Z`;
      this.title.textContent = 'Load circuit · resistor';
    } else if (mode === 'C') {
      // diode on the top wire, then the capacitor
      wire(g, `M128,${yT} L190,${yT}`); el('path', { d: `M190,${yT - 9} L190,${yT + 9} L206,${yT} Z`, fill: INK }, g); wire(g, `M206,${yT - 9} L206,${yT + 9}`);
      wire(g, `M206,${yT} L340,${yT} L340,70`); wire(g, `M326,70 L354,70 M326,80 L354,80`); wire(g, `M340,80 L340,${yB} L${xs},${yB}`);
      txt(g, 198, yT - 13, 'diode', { mono: true, size: 9.5 }); txt(g, 378, 79, 'C', {});
      this.lblV = txt(g, 395, 79, '', { mono: true, size: 10.5, fill: CYAN, anchor: 'start' });
      path1 = `M${xs},${yT} L340,${yT} L340,${yB} L${xs},${yB} Z`;
      this.title.textContent = 'Load circuit · diode → capacitor';
    } else {
      // rectifier diode -> DC-DC converter (presents R_in) -> battery
      wire(g, `M128,${yT} L150,${yT}`); el('path', { d: `M150,${yT - 9} L150,${yT + 9} L166,${yT} Z`, fill: INK }, g); wire(g, `M166,${yT - 9} L166,${yT + 9}`);
      wire(g, `M166,${yT} L198,${yT} M198,${yB} L${xs},${yB}`);
      el('rect', { x: 198, y: 14, width: 104, height: 126, rx: 6, fill: 'rgba(125,214,255,.05)', stroke: CYAN, 'stroke-width': 1.4 }, g);
      txt(g, 250, 32, 'DC–DC converter', { mono: true, size: 9.5, fill: CYAN });
      // inductor + switch symbols inside the box
      let d = 'M212,62'; for (let j = 0; j < 4; j++) d += ` a7,7 0 0 1 14,0`; wire(g, d); wire(g, 'M268,62 L272,62 M272,62 L286,52 M290,62 L294,62');
      el('circle', { cx: 272, cy: 62, r: 2, fill: INK }, g); el('circle', { cx: 290, cy: 62, r: 2, fill: INK }, g);
      txt(g, 250, 92, 'presents R', { mono: true, size: 9.5 }).appendChild(el('tspan', { 'font-size': 7.5, dy: 3 }, null, 'in'));
      this.lblRin = txt(g, 250, 112, '', { mono: true, size: 10.5, fill: AMB });
      this.lblVin = txt(g, 250, 127, '', { mono: true, size: 10.5, fill: CYAN });
      wire(g, `M302,${yT} L388,${yT} L388,64`); wire(g, `M370,64 L406,64 M378,72 L398,72 M370,80 L406,80 M378,88 L398,88`); wire(g, `M388,88 L388,${yB} L302,${yB}`);
      txt(g, 416, 62, '+', { mono: true, size: 12, anchor: 'start' }); txt(g, 416, 92, '−', { mono: true, size: 12, anchor: 'start' });
      this.lblB = txt(g, 458, 146, '', { mono: true, size: 10, fill: GRN, anchor: 'end' });
      this.lblIb = txt(g, 345, yT - 8, '', { mono: true, size: 10, fill: GRN });
      path1 = `M${xs},${yT} L198,${yT} M198,${yB} L${xs},${yB}`;
      path2 = `M302,${yT} L388,${yT} L388,${yB} L302,${yB}`;
      this.title.textContent = 'Charge controller → battery';
    }
    this.lblI = txt(g, 92, yB - 8, '', { mono: true, size: 10.5, fill: AMB });
    // current dots (dashed strokes with a moving offset)
    const dots = (d, color) => el('path', { d, fill: 'none', stroke: color, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-dasharray': '0.1 14', opacity: 0.95 }, g);
    this.dots1 = dots(path1, AMB); this.dots2 = path2 ? dots(path2, GRN) : null;
  }

  update(plant, mode, dt) {
    if (mode !== this.mode) this.build(mode);
    const s = plant.s;
    // dots move at a speed proportional to the current (px/s per A), clockwise from the + terminal
    const K = 40;
    this.off1 -= s.i * K * dt; this.dots1.setAttribute('stroke-dashoffset', this.off1.toFixed(2));
    this.dots1.style.display = s.i > 1e-4 ? '' : 'none';
    if (this.dots2) {
      this.off2 -= s.i_batt * K * 3 * dt; this.dots2.setAttribute('stroke-dashoffset', this.off2.toFixed(2));
      this.dots2.style.display = s.i_batt > 1e-4 ? '' : 'none';
    }
    this.lblE.textContent = `e = kω = ${s.e.toFixed(2)} V`;
    this.lblI.textContent = `i = ${s.i.toFixed(2)} A`;
    if (mode === 'C' && this.lblV) this.lblV.textContent = `Vc = ${s.Vc.toFixed(2)} V`;
    if (mode === 'batt') {
      this.lblRin.textContent = `R_in = ${plant.Rin().toFixed(2)} Ω`;
      this.lblVin.textContent = `v_in = ${s.v_in.toFixed(2)} V`;
      this.lblB.textContent = `V_b ${s.Vb.toFixed(2)} V · SOC ${(100 * s.soc).toFixed(2)}%`;
      this.lblIb.textContent = `i_b = ${(1000 * s.i_batt).toFixed(0)} mA`;
    }
    const notes = {
      open: 'Nothing connected: the motor spins free and generates e = kω with no current, so it does not brake.',
      R: 'All the generated power not lost in R_w heats R_L: P_L = i²R_L. Dots move at a speed proportional to i.',
      C: 'Current flows only while e > V_d + V_c (the diode blocks the capacitor from driving the motor).',
      batt: 'The converter presents R_in to the motor whatever the battery voltage, and passes η_c of that power on.',
    };
    this.note.textContent = notes[mode];
  }
}
