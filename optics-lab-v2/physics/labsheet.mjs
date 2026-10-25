// The lab notebook's data sheets (Exp 212, 213, 214) and their analysis: the tables as printed in the lab manual, the
// graph the manual asks for (the Excel step: points, least-squares line, equation, R^2), and the arithmetic checks.
// Cole's calls (2026-10-11): the student types every number, raw AND derived, as on paper; the notebook never reads the
// apparatus. A derived cell is checked against what the student's own entries give (not against the truth): it says
// only whether the arithmetic follows. The conclusions are typed too, and checked against the fit and the entries.
//
// A sheet = { id, title, subtitle, tables, graph, conclusions }.
//   table  = { id, caption, rows: n | [labels], cols: [{ key, head, unit, text?, init?, derive?, auto? }], singles?: [...] }
//   auto: n -> the column is computed, not typed: fillAuto writes derive()[0] to n places (blank while its inputs are)
//   derive(row, S) / derive(S, fit) -> null (inputs missing) or an array of acceptable values (one per honest route:
//            e.g. d = lambda/sin(theta) from the typed theta OR from the typed sin(theta))
// The state S = { t: { tableId: [ { key: "typed text" } ] }, c: { key: "typed text" }, meta: { name, section, date } }.

export const HE_LINE = 587.562;                 // nm, the calibration line (Exp 214)
export const R_ACCEPTED = 0.01097;              // nm^-1, as on the whiteboard; 0.010973731568 is also accepted
const RYD = 0.010973731568;
const rad = Math.PI / 180;

// "-0.725", "−0.725", " 20 ", "1.1e-2" -> number; blank -> null; not a number -> NaN. A comma is NOT accepted: "0,5"
// (a decimal comma) would otherwise be read as 5 and silently corrupt the graph, so it is flagged instead
export function num(s) {
  if (s === undefined || s === null) return null;
  const t = String(s).trim().replace(/[−–]/g, "-");
  if (t === "") return null;
  return /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t) ? Number(t) : NaN;
}
// the place value of the last typed digit, as a power of ten: "0.122" -> -3, "20" -> 0, "1.1e-2" -> -3, "5e-2" -> -2
const lastPlace = (s) => { const t = String(s).trim(), m = t.match(/[eE]([-+]?\d+)$/), mant = m ? t.slice(0, m.index) : t, i = mant.indexOf(".");
  return (m ? Number(m[1]) : 0) - (i < 0 ? 0 : mant.length - i - 1); };
const all = (...v) => v.every((x) => x !== null && Number.isFinite(x));
export const pctDiff = (a, b) => Math.abs(a - b) / ((Math.abs(a) + Math.abs(b)) / 2) * 100;
export const pctErr = (b, a) => Math.abs((b - a) / a) * 100;

// Is a typed value one of the acceptable ones, to the student's own rounding? Within half a unit in its last typed digit
// (a little slack for rounding twice), or within `rel` of the value (a student who rounds an intermediate step).
export function agrees(typed, cands, rel = 0.002) {
  const v = num(typed); if (v === null || !Number.isFinite(v) || !cands) return null;
  const half = 0.5 * Math.pow(10, lastPlace(typed)) * 1.05;
  return cands.some((c) => Number.isFinite(c) && (Math.abs(v - c) <= half + 1e-12 || Math.abs(v - c) <= rel * Math.abs(c)));
}

// least squares y = slope x + intercept, with R^2 (as Excel's linear trendline)
export function linfit(pts) {
  const n = pts.length; if (n < 2) return null;
  let sx = 0, sy = 0; for (const [x, y] of pts) { sx += x; sy += y; }
  const mx = sx / n, my = sy / n; let sxx = 0, sxy = 0, syy = 0;
  for (const [x, y] of pts) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); syy += (y - my) ** 2; }
  let sx2 = 0; for (const [x] of pts) sx2 += x * x;
  if (sxx <= 1e-12 * sx2 || sxx === 0) return null;          // every x the same (to rounding): no line
  const slope = sxy / sxx, intercept = my - slope * mx;
  return { slope, intercept, r2: syy === 0 ? 1 : (sxy * sxy) / (sxx * syy), n };
}
// a coefficient as the trendline label prints it: 4 decimals, more if that leaves fewer than 4 significant figures
export function coef(v) {
  if (v === 0) return "0";
  const d = Math.max(4, 3 - Math.floor(Math.log10(Math.abs(v))));
  return v.toFixed(Math.min(d, 10));
}
export const fitLabel = (fit, ySym, xSym) => `${ySym} = ${coef(fit.slope)}${xSym} ${fit.intercept < 0 ? "-" : "+"} ${coef(Math.abs(fit.intercept))}`;

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sdev = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const sinD = (deg) => Math.sin(deg * rad);
// a row's number in column k (null when blank or not a number)
const v = (row, k) => { const x = num(row && row[k]); return Number.isFinite(x) ? x : null; };
const c = (S, k) => { const x = num(S.c && S.c[k]); return Number.isFinite(x) ? x : null; };
const colVals = (S, t, k) => (S.t[t] || []).map((r) => v(r, k)).filter((x) => x !== null);

// the two m columns and their % diff (Exp 213 Tables 2 and 3); computed (auto, Cole 2026-10-24), as is Table 3's f
const M_COLS = [
  { key: "do", head: "Object Distance <i>d</i><sub>0</sub>", unit: "cm" },
  { key: "di", head: "Image Distance <i>d<sub>i</sub></i>", unit: "cm" },
];
const M_TAIL = [
  { key: "ho", head: "Object Height <i>h</i><sub>0</sub>", unit: "cm", init: "4" },
  { key: "hi", head: "Image Height <i>h<sub>i</sub></i>", unit: "cm" },
  { key: "m1", head: "<i>m</i> = <i>h<sub>i</sub></i>/<i>h</i><sub>0</sub>", auto: 3, derive: (r) => all(v(r, "hi"), v(r, "ho")) && v(r, "ho") !== 0 ? [v(r, "hi") / v(r, "ho")] : null },
  { key: "m2", head: "<i>m</i> = −<i>d<sub>i</sub></i>/<i>d</i><sub>0</sub>", auto: 3, derive: (r) => all(v(r, "di"), v(r, "do")) && v(r, "do") !== 0 ? [-v(r, "di") / v(r, "do")] : null },
  { key: "pd", head: "% Diff in <i>m</i>", unit: "%", auto: 2, derive: (r) => {
    const out = [];
    if (all(v(r, "m1"), v(r, "m2"))) out.push(pctDiff(v(r, "m1"), v(r, "m2")));
    if (all(v(r, "hi"), v(r, "ho"), v(r, "di"), v(r, "do"))) out.push(pctDiff(v(r, "hi") / v(r, "ho"), -v(r, "di") / v(r, "do")));
    return out.length ? out : null; } },
];
// Exp 214: theta_R, theta_L, theta from the readings (|reading - theta0|, then the mean); computed (auto, Cole 2026-10-24)
const T_COLS = [
  { key: "th0", head: "<i>θ</i><sub>0</sub>", unit: "°" },
  { key: "t1R", head: "<i>θ</i><sub>1,R</sub>", unit: "°" },
  { key: "thR", auto: 1, head: "<i>θ<sub>R</sub></i> = |<i>θ</i><sub>1,R</sub> − <i>θ</i><sub>0</sub>|", unit: "°", derive: (r) => all(v(r, "t1R"), v(r, "th0")) ? [Math.abs(v(r, "t1R") - v(r, "th0"))] : null },
  { key: "t1L", head: "<i>θ</i><sub>1,L</sub>", unit: "°" },
  { key: "thL", auto: 1, head: "<i>θ<sub>L</sub></i> = |<i>θ</i><sub>1,L</sub> − <i>θ</i><sub>0</sub>|", unit: "°", derive: (r) => all(v(r, "t1L"), v(r, "th0")) ? [Math.abs(v(r, "t1L") - v(r, "th0"))] : null },
  { key: "th", auto: 2, head: "<i>θ</i> = (<i>θ<sub>R</sub></i> + <i>θ<sub>L</sub></i>)/2", unit: "°", derive: (r) => {
    const out = [];
    if (all(v(r, "thR"), v(r, "thL"))) out.push((v(r, "thR") + v(r, "thL")) / 2);
    if (all(v(r, "t1R"), v(r, "t1L"), v(r, "th0"))) out.push((Math.abs(v(r, "t1R") - v(r, "th0")) + Math.abs(v(r, "t1L") - v(r, "th0"))) / 2);
    return out.length ? out : null; } },
];

export const SHEETS = {
  212: {
    id: "212", station: "ray", title: "Experiment 212", subtitle: "Geometrical Optics",
    tables: [
      { id: "t1", caption: "Table 1: Reflection Data", rows: 9, cols: [
        { key: "i", head: "Incident Angle", unit: "Degrees" },
        { key: "r", head: "Reflection Angle", unit: "Degrees" }] },
      { id: "t2", caption: "Table 2: Refraction Data", rows: 9, cols: [
        { key: "phi", head: "Incident Angle <i>φ</i>", unit: "Degrees" },
        { key: "php", head: "Refraction Angle <i>φ′</i>", unit: "Degrees" },
        // auto (Cole 2026-10-24): the sines fill in from the student's own angles, to 4 places
        { key: "sphi", head: "sin <i>φ</i>", unit: "−", auto: 4, derive: (r) => v(r, "phi") !== null ? [sinD(v(r, "phi"))] : null },
        { key: "sphp", head: "sin <i>φ′</i>", unit: "−", auto: 4, derive: (r) => v(r, "php") !== null ? [sinD(v(r, "php"))] : null }] },
    ],
    // the manual's graph: sin(phi) against sin(phi'); its slope is n_g
    graph: { title: "Sinφ as a Function of Sinφ'", x: "Sinφ'", y: "Sinφ", xSym: "Sinφ'", ySym: "Sinφ",
      points: (S) => (S.t.t2 || []).map((r) => [v(r, "sphp"), v(r, "sphi")]).filter(([x, y]) => x !== null && y !== null) },
    conclusions: [
      { key: "thc", label: "Measured critical angle <i>θ<sub>c</sub></i>", unit: "°" },
      { key: "ng1", label: "<i>n<sub>g</sub></i> = 1/sin <i>θ<sub>c</sub></i>", derive: (S) => c(S, "thc") !== null && sinD(c(S, "thc")) !== 0 ? [1 / sinD(c(S, "thc"))] : null },
      { key: "ng2", label: "<i>n<sub>g</sub></i> from the slope of sin <i>φ</i> vs sin <i>φ′</i>", derive: (S, fit) => (fit ? [fit.slope] : null), fromFit: true },
      // each n_g as typed, or carried at full precision from where it came from (1/sin of the typed angle; the fit's slope)
      { key: "pd", label: "% diff = |<i>A</i> − <i>A′</i>| / ((<i>A</i> + <i>A′</i>)/2) × 100 %", unit: "%", derive: (S, fit) => {
        if (!all(c(S, "ng1"), c(S, "ng2"))) return null;
        const a = [c(S, "ng1")], b = [c(S, "ng2")];
        if (c(S, "thc") !== null && sinD(c(S, "thc")) !== 0) a.push(1 / sinD(c(S, "thc")));
        if (fit) b.push(fit.slope);
        return a.flatMap((x) => b.map((y) => pctDiff(y, x)));
      } },
    ],
  },
  213: {
    id: "213", station: "lens", title: "Experiment 213", subtitle: "Geometrical Optics of Thin Lens",
    tables: [
      { id: "t1", caption: "Table 1: Direct Measurement Focal Length Data", rows: ["#1", "#2"], rowHead: "Converging Lens", cols: [
        { key: "f", head: "Focal Length, <i>f</i>", unit: "cm" }] },
      { id: "t2", caption: "Table 2: Converging Lens #1 Optical Bench Data", rows: 5, trial: true, cols: [...M_COLS, ...M_TAIL] },
      { id: "t3", caption: "Table 3: Converging Lens #2 Optical Bench Data", rows: 5, trial: true, cols: [...M_COLS,
        { key: "f", head: "Focal Length, <i>f</i>, using Eq. (1)", unit: "cm", auto: 2, derive: (r) => all(v(r, "do"), v(r, "di")) && v(r, "do") + v(r, "di") !== 0 ? [v(r, "do") * v(r, "di") / (v(r, "do") + v(r, "di"))] : null },
        ...M_TAIL],
        singles: [
          { key: "fbar", label: "<i>f̄</i> =", unit: "cm", derive: (S) => { const f = colVals(S, "t3", "f"); return f.length ? [mean(f)] : null; } },
          { key: "sf", label: "<i>σ<sub>f</sub></i> =", unit: "cm", derive: (S) => { const f = colVals(S, "t3", "f"); return f.length > 1 ? [sdev(f)] : null; } },
        ] },
    ],
    // #7: 1/d_i against 1/d_0 for Lens 1 (slope -1, intercept 1/f_1)
    graph: { title: "Inverse of Image Distance as a Function of the Inverse of Object Distance", x: "Inverse Object Distance, 1/d₀ (cm^-1)", y: "Inverse Image Distance, 1/dᵢ (cm^-1)", xSym: "/d₀", ySym: "1/dᵢ",
      points: (S) => (S.t.t2 || []).map((r) => [v(r, "do"), v(r, "di")]).filter(([a, b]) => a && b).map(([a, b]) => [1 / a, 1 / b]) },
    conclusions: [
      { key: "slope", label: "Slope of 1/<i>d<sub>i</sub></i> vs 1/<i>d</i><sub>0</sub>", derive: (S, fit) => (fit ? [fit.slope] : null), fromFit: true },
      { key: "pe", label: "% error of the slope against −1", unit: "%", derive: (S) => c(S, "slope") !== null ? [pctErr(c(S, "slope"), -1)] : null },
      { key: "f1", label: "<i>f</i><sub>1</sub> = 1/(intercept)", unit: "cm", derive: (S, fit) => (fit && fit.intercept ? [1 / fit.intercept, 1 / Number(coef(fit.intercept))] : null), fromFit: true },
      // each f as typed, or carried at full precision from where it came from (1/intercept of the fit; the mean of the
      // f column), as 212's % diff: both are honest routes (2026-10-24)
      { key: "pd1", label: "% diff of <i>f</i><sub>1</sub> (graph vs Table 1)", unit: "%", derive: (S, fit) => { const a = c(S, "f1"), b = v((S.t.t1 || [])[0], "f"); if (!all(a, b)) return null;
        const out = [pctDiff(a, b)]; if (fit && fit.intercept) out.push(pctDiff(1 / fit.intercept, b), pctDiff(1 / Number(coef(fit.intercept)), b)); return out; } },   // ... and from the label's intercept, as f1 itself
      { key: "pd2", label: "% diff of <i>f</i><sub>2</sub> (<i>f̄</i> vs Table 1)", unit: "%", derive: (S) => { const a = c(S, "fbar"), b = v((S.t.t1 || [])[1], "f"); if (!all(a, b)) return null;
        const out = [pctDiff(a, b)], f = colVals(S, "t3", "f"); if (f.length) out.push(pctDiff(mean(f), b)); return out; } },
    ],
  },
  214: {
    id: "214", station: "spec", title: "Experiment 214", subtitle: "The Diffraction Grating",
    tables: [
      { id: "t3", caption: `Table 3. Spectrometer Calibration Data (helium, <i>λ</i> = ${HE_LINE} nm)`, rows: 1, cols: [...T_COLS,
        { key: "sth", auto: 4, head: "sin <i>θ</i>", unit: "−", derive: (r) => v(r, "th") !== null ? [sinD(v(r, "th"))] : null },
        { key: "d", head: "<i>d</i> = <i>λ</i>/sin <i>θ</i>", unit: "nm", auto: 1, derive: (r) => {
          const out = []; if (v(r, "th")) out.push(HE_LINE / sinD(v(r, "th"))); if (v(r, "sth")) out.push(HE_LINE / v(r, "sth")); return out.length ? out : null; } }] },
      { id: "t4", caption: "Table 4. Hydrogen Spectrum Data", rows: 4, cols: [
        { key: "col", head: "", text: true, init: ["Red", "Green", "Blue-Violet", "Violet"] },
        { key: "n", head: "<i>n</i>", unit: "−", init: ["3", "4", "5", "6"] },
        ...T_COLS,
        { key: "lam", head: "<i>λ</i> = <i>d</i> sin <i>θ</i>", unit: "nm", auto: 1, derive: (r, S) => { const d = v((S.t.t3 || [])[0], "d"); return all(d, v(r, "th")) ? [d * sinD(v(r, "th"))] : null; } }] },
    ],
    // #13: 1/lambda against 1/n^2; the slope is -R
    graph: { title: "Inverse Wavelength as a Function of Inverse of Balmer Number Squared", x: "Inverse of Balmer Number Squared, 1/n^2", y: "Inverse Wavelength, 1/λ (nm^-1)", xSym: "/n²", ySym: "1/λ",
      points: (S) => (S.t.t4 || []).map((r) => [v(r, "n"), v(r, "lam")]).filter(([n, l]) => n && l).map(([n, l]) => [1 / (n * n), 1 / l]) },
    conclusions: [
      { key: "RB", label: "<i>R<sub>B</sub></i> = −slope", unit: "nm⁻¹", derive: (S, fit) => (fit ? [-fit.slope, -Number(coef(fit.slope))] : null), fromFit: true },
      { key: "pe", label: `% error against <i>R<sub>A</sub></i> = ${R_ACCEPTED} nm⁻¹`, unit: "%", derive: (S) => c(S, "RB") !== null ? [pctErr(c(S, "RB"), R_ACCEPTED), pctErr(c(S, "RB"), RYD)] : null },
    ],
  },
};
export const SHEET_OF_STATION = { ray: "212", lens: "213", spec: "214" };

// a blank sheet (with the printed entries: h_0 = 4, the colours and n of Table 4)
export function blank(id) {
  const sh = SHEETS[id], S = { t: {}, c: {}, meta: { name: "", section: "", date: "" } };
  for (const T of sh.tables) {
    const n = Array.isArray(T.rows) ? T.rows.length : T.rows;
    S.t[T.id] = Array.from({ length: n }, (_, i) => Object.fromEntries(T.cols.filter((C) => C.init !== undefined).map((C) => [C.key, Array.isArray(C.init) ? C.init[i] : C.init])));
  }
  return S;
}

// the computed columns (auto): written from the row's own entries; blank while those are missing. Returns S.
export function fillAuto(id, S) {
  for (const T of SHEETS[id].tables) for (const C of T.cols) if (C.auto !== undefined)
    (S.t[T.id] || []).forEach((r) => { const d = C.derive(r, S); r[C.key] = d && Number.isFinite(d[0]) ? d[0].toFixed(C.auto) : ""; });
  return S;
}

// the fit of the sheet's graph (null below two points)
export const fitOf = (id, S) => linfit(SHEETS[id].graph.points(S));

// every check on the sheet: [{ where: "t2.3.sphi" | "c.ng1" | "t3.s.fbar", ok: true|false, bad?: "not a number" }]
export function audit(id, S) {
  const sh = SHEETS[id], fit = fitOf(id, S), out = [];
  for (const T of sh.tables) {
    (S.t[T.id] || []).forEach((r, i) => {
      for (const C of T.cols) {
        const s = r[C.key]; if (C.text || C.auto !== undefined || s === undefined || String(s).trim() === "") continue;   // auto: not the student's
        if (Number.isNaN(num(s))) { out.push({ where: `${T.id}.${i}.${C.key}`, ok: false, bad: "not a number" }); continue; }
        if (C.derive) { const a = agrees(s, C.derive(r, S)); if (a !== null) out.push({ where: `${T.id}.${i}.${C.key}`, ok: a }); }
      }
    });
    for (const G of T.singles || []) {
      const s = S.c[G.key]; if (s === undefined || String(s).trim() === "") continue;
      if (Number.isNaN(num(s))) { out.push({ where: `c.${G.key}`, ok: false, bad: "not a number" }); continue; }
      const a = agrees(s, G.derive(S, fit)); if (a !== null) out.push({ where: `c.${G.key}`, ok: a });
    }
  }
  for (const G of sh.conclusions) {
    const s = S.c[G.key]; if (s === undefined || String(s).trim() === "") continue;
    if (Number.isNaN(num(s))) { out.push({ where: `c.${G.key}`, ok: false, bad: "not a number" }); continue; }
    if (!G.derive) continue;
    const a = agrees(s, G.derive(S, fit), G.fromFit ? 0.005 : 0.002); if (a !== null) out.push({ where: `c.${G.key}`, ok: a });
  }
  return out;
}

// the sheet as CSV (opens in Excel): each table under its caption, then the graph's fit and the conclusions
const plain = (h) => String(h).replace(/<sub>(.*?)<\/sub>/g, "_$1").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");
const q = (s) => { const t = String(s ?? ""); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
export function toCSV(id, S) {
  const sh = SHEETS[id], L = [], fit = fitOf(id, S);
  L.push(`${sh.title} - ${sh.subtitle}`);
  if (S.meta) L.push(["Name", S.meta.name, "Lab section", S.meta.section, "Date", S.meta.date].map(q).join(","));
  for (const T of sh.tables) {
    L.push(""); L.push(q(plain(T.caption)));
    const lead = Array.isArray(T.rows) ? [T.rowHead || ""] : T.trial ? ["Trial"] : [];
    L.push([...lead, ...T.cols.map((C) => plain(C.head) + (C.unit ? ` (${C.unit})` : ""))].map(q).join(","));
    (S.t[T.id] || []).forEach((r, i) => L.push([...(Array.isArray(T.rows) ? [T.rows[i]] : T.trial ? [i + 1] : []), ...T.cols.map((C) => r[C.key] ?? "")].map(q).join(",")));
    for (const G of T.singles || []) L.push([plain(G.label), S.c[G.key] ?? "", G.unit || ""].map(q).join(","));
  }
  L.push(""); L.push(q(sh.graph.title));
  L.push([sh.graph.x, sh.graph.y].map(q).join(","));
  for (const [x, y] of sh.graph.points(S)) L.push(`${x},${y}`);
  if (fit) { L.push(q(fitLabel(fit, sh.graph.ySym, sh.graph.xSym))); L.push(`R^2,${fit.r2}`); L.push(`slope,${fit.slope}`); L.push(`intercept,${fit.intercept}`); }
  L.push(""); L.push("Conclusions");
  for (const G of sh.conclusions) L.push([plain(G.label), S.c[G.key] ?? "", G.unit || ""].map(q).join(","));
  return L.join("\r\n") + "\r\n";
}
