# TVD Test Rig Mk0 — parametric CAD

A 1-DOF teeter-totter testbed: drone motor on a servo-driven mount at one end,
adjustable counterweight at the other, magnetic encoder on the pivot.

**One mechanism, three experiments — firmware only:**

| Firmware | What it is |
|---|---|
| servo locked at 0, throttle → angle | Test Rig **Phase A**, the aeropendulum analog |
| servo tracks −θ | 1-D **attitude-hold gimbal** (the tray-gimbal problem) |
| servo tilts thrust to torque the beam | Test Rig **Phase B**, true TVC |

## Files

| File | Purpose |
|---|---|
| `build_rig.py` | Builds the model. Every dimension **and every interface** is an expression on the `Params` sheet. |
| `rig_eval.py` | CAD → plant constants: M, I, CG offsets, ωn, and the counterweight solve. |
| `check_rig.py` | Interference, fit report, swept travel limit. |
| `tune_and_export.py` | Parametric sweep + STL export. |
| `probe_params.py` | Validates the FreeCAD mechanisms the builder relies on. |

Each has a `run_*.py` runner — `freecadcmd` sets `__name__` to the script stem,
not `"__main__"`, so the entry point must be an explicit `main()`.

```
"C:\Program Files\FreeCAD 1.1\bin\freecadcmd.exe" run_build.py
```

## Editing the design

Open `TVD_TestRig_Mk0.FCStd`, edit **column B** of the `Params` sheet, recompute.
Mating features follow because they are derived, not typed twice: bolt patterns,
bearing seats, shaft bores and clearances all reference the same cells as the
parts they join. The `DERIVED — INTERFACES` block is where that lives.

Two rules the builder obeys, both learned the hard way on the rocket model:

- **Never start a spreadsheet cell with `=`** unless it is genuinely a formula.
- **Plain `DocumentObjectGroup`, never `App::Part`.** Containers carry their own
  placement offsets, which is what silently telescoped the rocket geometry.

## The two counterweight knobs

The counterweight rides a vertical threaded rod. The knobs are close to
independent near the pivot, because stiffness grows as `d` and inertia as `d²`:

- **Mass** (washers) → trim, and inertia
- **Height** (`cw_offset`) → gravity stiffness *and its sign*: below the pivot
  is stable, level is neutral (drone-like), above is inverted

`rig_eval.py` solves both: the mass that trims the beam, and the offset for
neutral or for a target period.

## The beam is three parts

A one-piece 400 mm beam does not fit a 250³ printer — not even on the 354 mm
bed diagonal. So it is a central **`PivotHub`** plus two plug-in arms
(**`Arm_Motor`**, **`Arm_CW`**), each 188 mm.

The hub **wraps** the arm section rather than lapping it, so the arms keep
their full cross-section straight through the joint — which matters, because
the joint sits where the bending moment is highest. Strength comes from the
hub walls in bearing plus two M3 bolts per side in double shear.

`joint_clear` is a **separate, tighter** parameter (0.10 mm) from the running
`fit_clear` (0.25 mm), and deliberately so: the encoder reads the *hub*, so
socket slop is arm angle the sensor cannot see. At 0.10 mm over 43 mm of
engagement that is **0.13°** of blind play. `check_rig.py` prints the figure
and complains past 0.25°. Bolts will not remove it — only a tighter fit, a
longer hub, or bonding the joint will.

Because the hub is wider than the arms, it — not the arm — sets the upright
span: `pivot_span = hub_wid + 2·beam_side_gap`.

## Known state (defaults as built, `pivot_height = 160`)

- All 10 printed parts are single valid solids, all fit the build volume;
  no unintended interference.
- **Travel ±50°, symmetric.** At the original 120 mm pivot it was +34/−25° and
  the *counterweight rod* struck the base first. Above roughly 140 mm the
  binding part becomes the **beam ends** and travel goes symmetric.
- **Out of trim as drawn** — 77.7 g counterweight against 44.4 g needed
  (8.0 mm washer stack at 30 mm OD). Trim before reading anything into `dz`.
- **Trimmed, it is slightly inverted** (CG 2.8 mm above the pivot, doubling
  time 0.56 s) because the servo + motor stack rides 23–48 mm above the beam
  while the counterweight is only 20 mm below. `cw_offset = −38.5 mm` gives
  neutral; −72.5 mm gives a stable T = 1.5 s.
- Plant constants at the default trim: **M = 389 g, I = 0.00628 kg·m²**. These
  are *independent of pivot height* — the whole rotating assembly is placed
  relative to the pivot, so raising it changes travel and the uprights only.
  Splitting the beam added 62 g (the hub's wrapping walls) but barely touched
  inertia, because that mass sits at the pivot where it has no lever arm.

## Still open

> **Superseded 2026-08-04 — see `BUILD_STATE.md` for the current build.**
> Both items below are resolved: the servo is an **MG996R**, imported from
> Cole's own CAD rather than approximated, and the motor is the **A2212
> 1000KV** with a 1045 prop, bolted directly to the yoke. The plant numbers
> earlier in this file predate the counterweight redesign and the fastener
> work; trim now needs 228 g at 160 mm, not 44 g.
