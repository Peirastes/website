// Exp 213 Geometrical Optics of a Thin Lens: the procedure as the Guide walks it (plan approved by Cole 2026-10-24).
// From the handout, the Tips sheet and Cole's key: Method 1, a distant object, f ~ d_i, for both lenses (Table 1);
// Method 2, Lens #1 (+10) at d_0 = 15, 20, 22.5, 25, 30 cm, 1/d_i against 1/d_0 (Table 2, #7); Method 3, Lens #2 (+20) at
// d_0 = 30, 40, 45, 50, 60 cm, f from the lens equation, its mean and SD (Table 3); m two ways for both.
// As 212 (Cole): every bench step waits for the student's button, live once its prerequisite holds; how sharp, how close
// to the axis, is the student's judgement, never a gate. Steps follow real prerequisites: the arrow-on-axis check needs
// the light box back on the rail, so it comes after Table 1 and before Table 2 (Cole's call). A record step completes
// when its cells hold numbers and the student has left them. The lab starts with the lens holder empty.
//
// ctx: { M (the lens bench's api), S (its state), nb(path), filled(path) }
const D1 = [15, 20, 22.5, 25, 30], D2 = [30, 40, 45, 50, 60];
const slot = (c, id) => c.M.P.traySlots.find((t) => t.L.id === id).slot;
const FAR = "label:has(#tFar)";

const rows = (table, phase, lensTag, ds) => ds.map((d, k) => ({
  id: `${table}_${d}`, phase,
  title: `Trial ${k + 1}: set <i>d</i><sub>0</sub> = ${d} cm, focus, and record <i>d</i><sub>0</sub>, <i>d<sub>i</sub></i> and <i>h<sub>i</sub></i>`,
  why: `${lensTag}. <i>d</i><sub>0</sub> = lens − light box and <i>d<sub>i</sub></i> = screen − lens, read on the rail scale; <i>h<sub>i</sub></i> = where the arrow's tip lands on the card's ruler (negative: the image is inverted).`,
  watch: "Slide the lens (or the light box) to set d₀, then slide the screen to the sharpest image. Type d₀, dᵢ and hᵢ in the notebook, then press Enter or Tab.",
  view: "overview", notebook: true,
  target: () => ({ cell: `t.${table}.${k}.do` }), cells: () => ["do", "di", "hi"].map((key) => `t.${table}.${k}.${key}`),
  done: (c) => ["do", "di", "hi"].every((key) => c.filled(`t.${table}.${k}.${key}`)),
}));
const calc = (key, phase, title, why, watch) => ({ id: key, phase, title, why, watch, notebook: true, target: () => ({ cell: `c.${key}` }), done: (c) => c.filled(`c.${key}`) });

export const PROC_213 = {
  id: "213", title: "Exp 213", station: "lens", module: "lens",
  phases: [
    { id: "far", name: "Direct measurement" }, { id: "axis", name: "Object on the axis" }, { id: "l1", name: "Lens #1" },
    { id: "l2", name: "Lens #2" }, { id: "an", name: "Analysis" },
  ],
  steps: [
    // ------------------------------------------------ Method 1: a distant object, f ~ d_i (Table 1)
    { id: "mount1", phase: "far", kind: "confirm", title: "Mount Lens #1 (+10 cm) in the lens holder",
      why: "Two converging lenses: Lens #1 (+10 cm) and Lens #2 (+20 cm).",
      watch: "Click Lens #1 in the lens tray: it goes into the holder on the rail.",
      confirm: "Lens #1 is mounted", ready: (c) => c.S.lensId === "c10", notReady: "Click Lens #1 (+10 cm) in the tray.",
      view: "tray", target: (c) => ({ obj: slot(c, "c10") }) },
    { id: "farOn", phase: "far", kind: "confirm", title: "Switch on the distant object",
      why: "A lit arrow on the far wall, about 4 m away: d₀ ≫ dᵢ, so 1/d₀ ≈ 0 and f ≈ dᵢ.",
      watch: "Turn on Distant object in the panel. The light box comes off the rail.",
      confirm: "The distant object is on", ready: (c) => c.S.far, notReady: "Turn on Distant object.",
      view: "overview", target: () => ({ el: FAR }) },
    { id: "focus1", phase: "far", kind: "confirm", title: "Slide the screen until the far arrow's image is sharpest",
      why: "The sharpest image sits at dᵢ. Where it is sharpest is your judgement: a random error.",
      watch: "Drag the screen along the rail (or scroll over it: 1 mm a notch, Shift 1 cm). Watch the image on the card.",
      confirm: "The image is sharp", ready: (c) => c.S.far && c.S.lensId === "c10", notReady: "Lens #1 mounted and the distant object on.",
      view: "overview", target: (c) => ({ obj: c.M.P.card }) },   // overview: the card stays in view as it slides (the Screen view frames where it started)
    { id: "f1", phase: "far", title: "Record the focal length of Lens #1: f ≈ dᵢ",
      why: "dᵢ = screen − lens, both read on the rail scale. The far arrow is not at infinity, so this f comes out a little long.",
      watch: "Type it in Table 1 for Lens #1, then press Enter or Tab.",
      view: "rail", notebook: true, target: () => ({ cell: "t.t1.0.f" }), done: (c) => c.filled("t.t1.0.f") },
    { id: "mount2", phase: "far", kind: "confirm", title: "Swap to Lens #2 (+20 cm)",
      why: "The same direct measurement for the second lens.", watch: "Click Lens #2 in the lens tray (Lens #1 goes back).",
      confirm: "Lens #2 is mounted", ready: (c) => c.S.lensId === "c20", notReady: "Click Lens #2 (+20 cm) in the tray.",
      view: "tray", target: (c) => ({ obj: slot(c, "c20") }) },
    { id: "focus2", phase: "far", kind: "confirm", title: "Slide the screen until the far arrow's image is sharpest",
      why: "Lens #2's image forms farther from the lens.", watch: "Drag the screen along the rail (or scroll over it).",
      confirm: "The image is sharp", ready: (c) => c.S.far && c.S.lensId === "c20", notReady: "Lens #2 mounted and the distant object on.",
      view: "overview", target: (c) => ({ obj: c.M.P.card }) },   // overview: the card stays in view as it slides (the Screen view frames where it started)
    { id: "f2", phase: "far", title: "Record the focal length of Lens #2: f ≈ dᵢ",
      why: "dᵢ = screen − lens, on the rail scale.", watch: "Type it in Table 1 for Lens #2, then press Enter or Tab.",
      view: "rail", notebook: true, target: () => ({ cell: "t.t1.1.f" }), done: (c) => c.filled("t.t1.1.f") },
    // ------------------------------------------------ the object on the axis (before Table 2: Cole)
    { id: "farOff", phase: "axis", kind: "confirm", title: "Switch off the distant object: the light box goes back on the rail",
      why: "Tables 2 and 3 use the lit arrow on the light box: 4 cm tall, at a d₀ you set.",
      watch: "Turn off Distant object in the panel.", confirm: "The light box is back", ready: (c) => !c.S.far, notReady: "Turn off Distant object.",
      view: "overview", target: () => ({ el: FAR }) },
    { id: "mount1b", phase: "axis", kind: "confirm", title: "Mount Lens #1 again",
      why: "Table 2 is Lens #1.", watch: "Click Lens #1 in the lens tray.",
      confirm: "Lens #1 is mounted", ready: (c) => c.S.lensId === "c10", notReady: "Click Lens #1 (+10 cm) in the tray.",
      view: "tray", target: (c) => ({ obj: slot(c, "c10") }) },
    { id: "axis", phase: "axis", kind: "confirm", title: "Check the arrow is on the axis: its base should image at 0 on the card's ruler",
      why: "An arrow off the axis shifts every image height you read: a systematic error. However close you get, what is left over stays in your data.",
      watch: "Focus an image (light box and lens about 20 cm apart), and read where the arrow's base lands on the ruler (the Screen close-up view shows it). If it is not at 0, turn the height knob on the light box (drag around it, or scroll: 0.1 mm a notch).",
      confirm: "The base images at 0", ready: (c) => !c.S.far && c.S.lensId === "c10", notReady: "The light box on the rail and Lens #1 mounted.",
      view: "overview", target: (c) => ({ obj: c.M.P.objKnob }) },
    // ------------------------------------------------ Method 2: Lens #1 (Table 2)
    ...rows("t2", "l1", "Lens #1", D1),
    // ------------------------------------------------ Method 3: Lens #2 (Table 3)
    { id: "mount2b", phase: "l2", kind: "confirm", title: "Swap to Lens #2 (+20 cm)",
      why: "Table 3 is Lens #2: its focal length from the lens equation, trial by trial. At d₀ = 30 cm its image forms about 60 cm past the lens, so slide the light box to the 0 end of the rail first, or the screen runs out of rail.",
      watch: "Click Lens #2 in the lens tray, and slide the light box to the 0 end of the rail.",
      confirm: "Lens #2 is mounted", ready: (c) => c.S.lensId === "c20", notReady: "Click Lens #2 (+20 cm) in the tray.",
      view: "tray", target: (c) => ({ obj: slot(c, "c20") }) },
    ...rows("t3", "l2", "Lens #2", D2),
    // ------------------------------------------------ analysis (the notebook; m, % diff in m and Table 3's f fill in by themselves)
    calc("fbar", "an", "The mean focal length of Lens #2, <i>f̄</i>", "The mean of Table 3's f column (it fills in from your readings, by Eq. 1)."),
    calc("sf", "an", "Its standard deviation, <i>σ<sub>f</sub></i>", "The sample standard deviation (divide by n − 1) of the same five values."),
    calc("slope", "an", "Read the slope of 1/<i>d<sub>i</sub></i> against 1/<i>d</i><sub>0</sub>", "From the lens equation, 1/dᵢ = −1/d₀ + 1/f: a straight line of slope −1.", "The graph and its trendline are below the tables (Table 2's points)."),
    calc("pe", "an", "The % error of the slope against −1", "% error = |slope − (−1)| / |−1| × 100 %."),
    calc("f1", "an", "<i>f</i><sub>1</sub> from the graph: 1 / intercept", "The intercept of the trendline is 1/f for Lens #1."),
    calc("pd1", "an", "The % diff of <i>f</i><sub>1</sub>: the graph against Table 1", "How well do Methods 1 and 2 agree for Lens #1?"),
    calc("pd2", "an", "The % diff of <i>f</i><sub>2</sub>: <i>f̄</i> against Table 1", "How well do Methods 1 and 3 agree for Lens #2? Think about where your systematic errors came from."),
  ],
  done: "Your data, graph and analysis are in the lab notebook. Download the CSV or print the sheet (the notebook's bar), and write your conclusions.",
};
