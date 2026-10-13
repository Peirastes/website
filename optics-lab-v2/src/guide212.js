// Exp 212 Geometrical Optics: the procedure as the Guide walks it. From Cole (2026-10-12): "Students start by calibrating
// their light source using the distance of the light source (farther the better), the alignment of the slit/mask to get
// as close to a straight light beam as possible. Then they place the flat mirror on the component axis and measure
// reflection angle for incident angles of 0-80 in increments of 10. Then students swap the flat mirror with the acrylic
// half-circle lens and measure the refraction angle in the same range/increments. Then they put the half-circle on the
// opposite side of the normal axis and measure the critical angle." The data sheet is the manual's (the notebook).
// Alignment is the student's judgement (Cole): the guide asks them to confirm it, and never measures it, so whatever they
// set up is what their data carry. A record step completes when its notebook cell holds a number (any number).
//
// ctx: { M (the ray table's api), S (its state), T (the traced ray the readouts follow), nb(path) (a notebook cell's
//        text: "t.t1.3.r", "c.thc"), filled(path) }
const D2R = Math.PI / 180;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const atZero = (c) => Math.abs(c.S.phi) < 0.05;
const ANGLES = [0, 10, 20, 30, 40, 50, 60, 70, 80];

const rows = (table, phase, keys, what) => ANGLES.map((a, k) => ({
  id: `${table}_${a}`, phase,
  title: `Turn the table to ${a}°, read the ${what}, and record it`,
  why: `Table ${table === "t1" ? 1 : 2}, row ${k + 1}: incident angle ${a}°.`,
  watch: table === "t1"
    ? "Read where the reflected ray crosses the degree ring, counting from the NORMAL line. Type the incident angle and the reflection angle in the notebook."
    : "Read where the refracted ray leaves the curved side and crosses the degree ring, counting from the NORMAL line. Type the incident angle and the refraction angle in the notebook.",
  view: "protractor", notebook: true,
  target: () => ({ cell: `t.${table}.${k}.${keys[1]}` }),
  done: (c) => c.filled(`t.${table}.${k}.${keys[0]}`) && c.filled(`t.${table}.${k}.${keys[1]}`),
}));

export const PROC_212 = {
  id: "212", title: "Exp 212", station: "ray", module: "snell",
  phases: [
    { id: "cal", name: "Calibrate the source" }, { id: "refl", name: "Reflection" }, { id: "refr", name: "Refraction" },
    { id: "crit", name: "Critical angle" }, { id: "an", name: "Analysis" },
  ],
  steps: [
    // ------------------------------------------------ calibrate the light source
    { id: "far", phase: "cal", title: "Slide the light source back along the rail: the farther, the better",
      why: "The filament is not a point: the farther it is from the slit, the narrower and straighter the ray.",
      watch: "Drag the light source along its rail. Read its distance from the slit on the rail scale: at least 10 cm.",
      view: "source", target: (c) => ({ obj: c.M.src.hBack }), done: (c) => c.S.src.d >= 0.1 - 1e-9 },
    { id: "filament", phase: "cal", kind: "confirm", title: "Turn the filament until it stands vertical",
      why: "Turned, the filament looks wider from the slit, so the ray is wider and fuzzier.",
      watch: "Turn the knob on top of the light source (drag around it, or scroll). Watch the filament in the window, and the ray on the table.",
      confirm: "The filament is vertical", view: "source", target: (c) => ({ obj: c.M.src.srcKnob }) },
    { id: "mask", phase: "cal", title: "Put the slit mask on the slit plate",
      why: "The slit plate has five slits; the mask lets one ray through.",
      watch: "Click the slit mask lying beside the holder.", view: "source", target: (c) => ({ obj: c.M.src.maskFlat }),
      done: (c) => c.S.src.mask !== null },
    { id: "oneRay", phase: "cal", title: "Slide the mask until only one ray gets through",
      why: "One ray, from the centre slit: as you put it on, the mask lets the next slit through.", watch: "Drag the mask across the slit plate (or scroll over it).",
      view: "overview", target: (c) => ({ obj: c.M.src.maskR }), done: (c) => c.M.labBeams(1).length === 1 && c.M.centreRay()?.off === 0 },
    { id: "zero", phase: "cal", title: "Turn the table to 0°",
      why: "At 0° the NORMAL line points at the light source.", watch: "Drag the table around, or scroll over it (0.5° a notch).",
      view: "protractor", target: (c) => ({ obj: c.M.knob }), done: atZero },
    { id: "straight", phase: "cal", kind: "confirm", title: "Slide the slit plate until the ray runs along the NORMAL line, through the centre",
      why: "A ray off the centre, or tilted, shifts every angle you read: a systematic error in all your data.",
      watch: "Drag the slit plate across (or scroll over it: 0.1 mm a notch). Follow the ray across the whole table.",
      confirm: "The ray runs along NORMAL", ready: (c) => atZero(c) && !c.S.placed && c.M.labBeams(1).length === 1,
      notReady: "The table must be empty, at 0°, with one ray.", view: "protractor", target: (c) => ({ obj: c.M.src.plate }) },
    // ------------------------------------------------ reflection (Table 1)
    { id: "mirror", phase: "refl", title: "Set the plane mirror on the COMPONENT line, centred on the cross",
      why: "Its face on the COMPONENT line puts the NORMAL line at right angles to it, through the centre.",
      watch: "Click the plane mirror in the mirror tray, then click on the platform to set it down. Drag it to slide it; scroll to turn it.",
      view: "overview", target: (c) => ({ obj: c.M.slotOf("mirror") }), done: (c) => c.S.placed && c.S.block === "mirror" },
    { id: "mirror0", phase: "refl", kind: "confirm", title: "Check the mirror at 0°: the ray should come straight back on itself",
      why: "If it doesn't, the mirror's face is not square to the ray: every reflection angle would be off.",
      watch: "Turn or slide the mirror if needed (scroll to turn it; , and . turn it 0.1°).",
      confirm: "It comes straight back", ready: (c) => atZero(c) && c.S.placed && c.S.block === "mirror",
      notReady: "The mirror on the table and the table at 0°.", view: "protractor", target: (c) => ({ obj: c.M.block }) },
    ...rows("t1", "refl", ["i", "r"], "reflection angle"),
    // ------------------------------------------------ refraction (Table 2)
    { id: "lens", phase: "refr", title: "Swap the mirror for the acrylic half-circle: flat face on the COMPONENT line, toward the light, centred",
      why: "The ray meets the flat face at the centre, bends inside, and leaves the curved face along a radius, unbent.",
      watch: "Click the acrylic half-circle in the block tray (the mirror goes back), then set it down. Scroll to turn it so the flat face faces the light source.",
      view: "overview", target: (c) => ({ obj: c.M.slotOf("acrylic") }),
      done: (c) => c.S.placed && c.S.block === "acrylic" && Math.abs(wrap(c.S.pose.psi)) < 45 * D2R },
    { id: "lens0", phase: "refr", kind: "confirm", title: "Check the half-circle at 0°: the ray should go straight through, unbent",
      why: "At 0° a ray on the centre meets both faces square. If it bends, the half-circle is off the centre or turned.",
      watch: "Slide or turn the half-circle if needed.", confirm: "It goes straight through",
      ready: (c) => atZero(c) && c.S.placed && c.S.block === "acrylic", notReady: "The half-circle on the table and the table at 0°.",
      view: "protractor", target: (c) => ({ obj: c.M.block }) },
    ...rows("t2", "refr", ["phi", "php"], "refraction angle"),
    // ------------------------------------------------ critical angle
    { id: "flip", phase: "crit", title: "Turn the half-circle around, so the light enters its curved side",
      why: "Now the light goes from acrylic to air at the flat face: past the critical angle, none of it gets out.",
      watch: "Press F with the half-circle on the table to turn it half round (or pick it up and turn it).",
      view: "protractor", target: (c) => ({ obj: c.M.block }), done: (c) => c.S.placed && c.S.block === "acrylic" && c.T && c.T.from === "curved" },
    { id: "thc", phase: "crit", title: "Turn the table slowly until the ray leaving the flat face just disappears, and record that angle",
      why: "At the critical angle the refracted ray grazes the face, and fades out.",
      watch: "Read the incident angle where the incoming ray crosses the degree ring, from the NORMAL line. Type it as the measured critical angle.",
      view: "protractor", notebook: true, target: () => ({ cell: "c.thc" }), done: (c) => c.filled("c.thc") },
    // ------------------------------------------------ analysis (the notebook)
    { id: "sines", phase: "an", title: "Work out sin φ and sin φ′ for every row of Table 2",
      why: "The graph is sin φ against sin φ′: by Snell's law a straight line with slope n_g.",
      watch: "A ✓ means the value follows from your own entries.", notebook: true, target: () => ({ cell: "t.t2.1.sphi" }),
      done: (c) => ANGLES.every((a, k) => c.filled(`t.t2.${k}.sphi`) && c.filled(`t.t2.${k}.sphp`)) },
    { id: "ng2", phase: "an", title: "Read the slope of the graph: that is n_g",
      why: "Snell's law with air n ≈ 1: sin φ = n_g sin φ′.", watch: "The graph and its trendline are below the tables.",
      notebook: true, target: () => ({ cell: "c.ng2" }), done: (c) => c.filled("c.ng2") },
    { id: "ng1", phase: "an", title: "Work out n_g from your critical angle",
      why: "n_g = 1 / sin θc (air on the other side).", notebook: true, target: () => ({ cell: "c.ng1" }), done: (c) => c.filled("c.ng1") },
    { id: "pd", phase: "an", title: "The % difference between your two values of n_g",
      why: "How well do the two methods agree? Think about where your systematic errors came from.",
      notebook: true, target: () => ({ cell: "c.pd" }), done: (c) => c.filled("c.pd") },
  ],
  done: "Your data, graph and analysis are in the lab notebook. Download the CSV or print the sheet (the notebook's bar), and write your conclusions.",
};
