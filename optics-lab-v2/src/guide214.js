// Exp 214 The Diffraction Grating: the procedure as the Guide walks it (plan approved by Cole 2026-10-24).
// From the handout notes, the Tips sheet and Cole's key: the zero angle theta_0 with helium; the yellow 587.562 nm line,
// first order, right and left (Table 3: d = lambda / sin theta); the hydrogen tube in (theta_0 stays); each Balmer line
// right and left (Table 4: lambda = d sin theta); #13 1/lambda against 1/n^2, R = -slope, % error against 0.01097 nm^-1.
// As 212 and 213 (Cole): every bench step waits for the student's button, live once its prerequisite holds (the right
// tube); whether the line sits on the crosshair is the student's judgement, never a gate. Each reading is two steps: put
// the line on the crosshair (the overview: the arm can be dragged), then read the vernier (its close-up) and type it.
// The computed columns fill in by themselves. In the lab the telescope starts 25 deg off straight (Cole's call).
//
// ctx: { M (the spectrometer's api), S (its state), nb(path), filled(path) }
const EYE = "#eyeBox";
const he = (c) => c.S.tube === "helium", h = (c) => c.S.tube === "hydrogen";
const SIDE = {
  R: { name: "right", reads: "more than θ<sub>0</sub>", col: "t1R", sym: "<i>θ</i><sub>1,R</sub>" },
  L: { name: "left", reads: "less than θ<sub>0</sub>", col: "t1L", sym: "<i>θ</i><sub>1,L</sub>" },
};
const TURN = "Drag the telescope around the circle (or scroll over it: 0.1° a notch, Shift 1°); ← → fine-tune it (0.02°, Shift 0.2°). Watch the eyepiece at the lower left (click it to enlarge).";
const READ = "Read the circle at the vernier: the whole degree just below the vernier's 0, plus the tenth where a vernier line lines up exactly with a circle line.";

// one reading: the line on the crosshair (a confirm), then the vernier read and typed (a record)
const reading = ({ id, phase, table, row, what, why, ready, notReady }, k) => {
  const s = SIDE[k], cell = `t.${table}.${row}.${s.col}`;
  return [
    { id: `${id}${k}`, phase, kind: "confirm", title: `Put the ${what} on the crosshair, first order, ${s.name} side`,
      why: `${why} On the ${s.name} side the circle reads ${s.reads}.`, watch: TURN,
      confirm: "It is on the crosshair", ready, notReady, view: "overview", target: () => ({ el: EYE }) },
    { id: `${id}${k}_rec`, phase, title: `Read the circle and record ${s.sym}`, why: READ,
      watch: `Type it in Table ${table === "t3" ? 3 : 4}, then press Enter or Tab.`,
      view: "vernier", notebook: true, target: () => ({ cell }), done: (c) => c.filled(cell) },
  ];
};
const both = (o) => [...reading(o, "R"), ...reading(o, "L")];
const LINES = [
  { row: 0, what: "red line", n: 3, why: "Red, n = 3: the farthest out of hydrogen's four lines." },
  { row: 1, what: "green line", n: 4, why: "Green (blue-green in this tube), n = 4: the next one in from red." },
  { row: 2, what: "blue-violet line", n: 5, why: "Blue-violet, n = 5: further in again, and fainter." },
  { row: 3, what: "violet line", n: 6, why: "Violet, n = 6: the closest in, and the faintest; enlarge the eyepiece if it is hard to see." },
];
const calc = (key, title, why) => ({ id: key, phase: "an", title, why, notebook: true, target: () => ({ cell: `c.${key}` }), done: (c) => c.filled(`c.${key}`) });

export const PROC_214 = {
  id: "214", title: "Exp 214", station: "spec", module: "spec",
  phases: [
    { id: "zero", name: "Zero angle" }, { id: "he", name: "Helium calibration" }, { id: "h", name: "Hydrogen" }, { id: "an", name: "Analysis" },
  ],
  steps: [
    // ------------------------------------------------ the zero angle, with helium
    { id: "straight", phase: "zero", kind: "confirm", title: "Swing the telescope to the slit image, straight through",
      why: "Straight through, nothing is bent: every line of the tube lands at once, the zeroth order. Its circle reading is θ₀, the zero angle every other angle is measured from.",
      watch: TURN, confirm: "The slit image is on the crosshair", ready: he, notReady: "The helium tube in the lamp.",
      view: "overview", target: () => ({ el: EYE }) },
    { id: "th0", phase: "zero", title: "Read the circle and record θ<sub>0</sub>", why: READ,
      watch: "Type it in Table 3, then press Enter or Tab.", view: "vernier", notebook: true,
      target: () => ({ cell: "t.t3.0.th0" }), done: (c) => c.filled("t.t3.0.th0") },
    // ------------------------------------------------ Table 3: helium's yellow line calibrates d
    ...both({ id: "he", phase: "he", table: "t3", row: 0, what: "yellow line",
      why: "Helium's yellow line is 587.562 nm (given): its angle calibrates the grating spacing, d = λ / sin θ. First order is the first yellow line out from the slit image. Reading both sides and averaging cancels a grating that sits a little off square.",
      ready: he, notReady: "The helium tube in the lamp." }),
    // ------------------------------------------------ Table 4: hydrogen's Balmer lines
    { id: "tube", phase: "h", kind: "confirm", title: "Change to the hydrogen tube",
      why: "Leave the grating and the spectrometer as they are: θ₀ has to stay where it was, so the d you just found still applies.",
      watch: "Pick Hydrogen tube under Discharge tube in the panel.", confirm: "The hydrogen tube is in",
      ready: h, notReady: "Pick Hydrogen tube under Discharge tube.", view: "overview", target: () => ({ el: "#tubeSel" }) },
    { id: "straightH", phase: "h", kind: "confirm", title: "Back to the slit image: check θ<sub>0</sub> has not moved",
      why: "Changing the tube should not move the zero angle. If it reads differently now, use the new value for hydrogen.",
      watch: TURN, confirm: "The slit image is on the crosshair", ready: h, notReady: "The hydrogen tube in the lamp.",
      view: "overview", target: () => ({ el: EYE }) },
    { id: "th0H", phase: "h", title: "Read the circle and record θ<sub>0</sub> on every row of Table 4", why: READ,
      watch: "Type it in Table 4's θ₀ column (all four rows), then press Enter or Tab.", view: "vernier", notebook: true,
      target: () => ({ cell: "t.t4.0.th0" }), cells: () => [0, 1, 2, 3].map((r) => `t.t4.${r}.th0`),
      done: (c) => [0, 1, 2, 3].every((r) => c.filled(`t.t4.${r}.th0`)) },
    ...LINES.flatMap((L) => both({ id: `h${L.n}`, phase: "h", table: "t4", row: L.row, what: L.what, why: L.why,
      ready: h, notReady: "The hydrogen tube in the lamp." })),
    // ------------------------------------------------ analysis (θ, sin θ, d and λ fill in; the graph and its trendline are drawn)
    calc("RB", "Read the slope of 1/<i>λ</i> against 1/<i>n</i>²: <i>R<sub>B</sub></i> = −slope",
      "Balmer's formula, 1/λ = R(1/2² − 1/n²): a straight line of slope −R. The graph is below the tables. Write your R down here, in nm⁻¹."),
    calc("pe", "The % error of <i>R<sub>B</sub></i>", "% error = |R_B − R_A| / R_A × 100 %, with R_A = 10 973 732 m⁻¹ = 0.01097 nm⁻¹ (convert before you compare)."),
  ],
  done: "Your data, graph and analysis are in the lab notebook. Download the CSV or print the sheet (the notebook's bar), and write your conclusions.",
};
