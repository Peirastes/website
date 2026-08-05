# TVD Test Rig Mk0 — build state

Snapshot taken 2026-08-04, at the pause to work on circuitry/firmware.
`README.md` covers the original design rationale; this file is the current
state of the physical build. Where the two disagree, this one is newer.

---

## Part state

Volumes are the current STLs in `stl/`. Everything listed is exported and
passes `run_check.py`.

| Part | cm³ | Status |
|---|---|---|
| BasePlate | 262.8 | current, not printed |
| Upright_PY | 85.3 | current, not printed |
| Upright_NY | 85.5 | current, not printed |
| PivotHub | 59.0 | current, next to print |
| Arm_Motor | 58.6 | current, printed 08-04 |
| Arm_CW | 54.5 | current, printed 08-04 |
| ServoYokeBracket | 81.2 | current; **the printed one is stale** |
| MotorYoke | 15.1 | current; **the printed one is stale** |
| CWCarriage | 11.1 | holds pending mass measurement |
| MagnetHolder | 1.8 | current |
| SensorBracket | 7.0 | current |

### The two stale parts in hand — both still useful

- **MotorYoke (printed at 14.7)** — predates the horn-wall change, the M2 nut
  traps, and the rectangle→square bolt-pattern fix. Two of its four horn holes
  are 0.63 mm out of position. Still valid for checking the drilled horn,
  since the bolt circle radius and clocking are unchanged.
- **ServoYokeBracket (printed)** — saddle holes are 10 mm off and there are
  four instead of two, so it will not bolt to the current `Arm_Motor`. Fine
  for the servo-drives-motor bench test, which does not involve the saddle.

---

## Fastener schedule

Chosen against what Cole stocks: **no more than 12 of any one size**, and the
longest M3 on hand is 20 mm.

| Joint | Fastener | Qty |
|---|---|---|
| Hub ↔ arms | M5×35 + M5 nut | 8 |
| Bracket saddle ↔ Arm_Motor | M5×30 + M5 nut | 2 |
| Upright feet ↔ BasePlate | M3×20 + M3 nut | 8 |
| Sensor bracket ↔ Upright_PY | M3 (self-taps the leg) | 2 |
| CW rod lock | M5 nut | 2 |
| Motor ↔ MotorYoke | M3×10 countersunk | 4 |
| Horn ↔ MotorYoke | M2 + M2 nut, trapped | 8 |
| Servo ↔ bracket | M3 + M3 nut | 8 |

44 fasteners total, all modelled and included in the interference check.

Hub joint bolts sit at 1/3 and 2/3 of the 43 mm tongue, two per arm — two
rather than one so the arm cannot rotate about a single fastener as the socket
wears. The saddle takes two on the beam centreline: its load is a moment about
Y, carried by X-spacing, and the clamped flat handles roughly 30× the
gyroscopic roll a Y pair would add.

---

## Counterweight — open, waiting on parts

The rig needs **228 g at 160 mm**, or **192 g at 190 mm**. The old modelled
washer stack was 78 g — about a third of it.

`CWCarriage` is a collar that slides on the CW arm and pins through one of 13
holes at 70–190 mm, every 10 mm. Trim is therefore discrete: one hole step is
worth ~777 g·mm, with washer count as the fine adjustment. `cw_pin_pitch` is
one cell if that proves too coarse.

Cylindrical masses ordered, expected 2026-08-05. **The seat is deliberately
not designed** until they can be measured — diameter, length, mass each, and
how many.

The reason for the redesign is not convenience: the old vertical rod set trim
*and* gravity stiffness with the same adjustment, so balance could not be
changed without changing the plant. Position is now trim, the keel bob is
stiffness, and they are independent.

Still undecided, three joints out: whether the keel rod threads into the hub
boss or takes lock nuts like the CW rod.

---

## ⚠️ The `print_hole` bug class — five instances, all fixed

`fit_clear`'s own note reads "general slip clearance, AFTER print
compensation", which sounds as though compensation is already included. **It is
not.** It is the clearance you want to be *left with*, so `print_hole` (0.20)
must be added wherever it is used. Anywhere it appeared alone, the feature came
out 0.20 undersize.

| Where | Effect |
|---|---|
| M2 / M3 nut traps | nut would not drop into its seat |
| 13 CW pin holes | M5 threaded rod would not pass |
| Keel rod hole | same |
| **Hub shaft bore** | 0.05 press became **0.25** — splits the hub |
| **Both bearing seats** | 0.05 press became **0.25** — wrecks two 625ZZ |

The last two are the dangerous kind: they fail at assembly, against parts that
cost money, rather than at the printer.

`check_fits` was itself reporting **nominal** rather than as-printed
dimensions, which is why it flagged a correctly specified 0.05 press as "NOT A
PRESS FIT". It now reports as-printed.

---

## What the checks cannot see

Every one of these was caught by eye, not by tooling.

- **A prefix-matched whitelist.** `FS_ServoNutAheadU` starts with `FS_Servo`,
  so nuts silently inherited the screws' permission to occupy the bracket —
  hiding two buried-nut defects through several PASSes. Nuts now have their own
  rule: any overlap with a printed part is a finding.
- **A bolt in mid-air clashes with nothing.** Two saddle bolts sat 1 mm off the
  end of the plate because the pattern was centred on `motor_arm`, but the
  saddle is asymmetric about it — `yoke_base_xc` is `motor_arm − 10`, inherited
  from the servo's 14.5-ahead / 34.5-behind tab holes.
- **A hole that is too small does not overlap anything either.** It simply does
  not go together.
- **Four bolts pass just as cleanly as two.** Interference checking verifies
  that solids do not share space. It cannot tell you a design is sensible.

**The horn bolt pattern** deserves its own note: the horn's four holes lie on
spokes 90° apart, so they form a square at *any* clocking. Building them as
(±dx, ±dz) with `dx = r·cos`, `dz = r·sin` produces a rectangle that only
coincides with that square at exactly 45°. At 43.2° two of four holes were
0.63 mm out. One shared `HORN_BOLTS` list in `hardware.py` now drives the yoke
holes, nut traps, insertion slots, the horn model and the fasteners together.

---

## Live rebuild workflow

`tvd_live.py` here, loaded by `~/AppData/Roaming/FreeCAD/Macro/TVD_Live.FCMacro`.
Touch `.rebuild` and the macro rebuilds **in-process**; the viewport follows in
about a second.

- **QTimer, never a watchdog thread.** The FreeCAD API is not thread-safe; the
  threaded version died in access violations.
- **Logic lives in a real module**, because FreeCAD tears down a macro's
  namespace after it returns and leaves the callback holding cleared globals —
  it then throws on every tick with nobody watching.
- **The timer is parked on `App`** or the garbage collector takes it.
- It writes `.live_heartbeat` every tick. Check that to know whether it is
  running, rather than assuming.
- **The macro toggles** — running it a second time stops it.
- Opening and closing `mg996R_v2` mid-rebuild is normal: that is
  `import_servo()` pulling in the real servo solid.
- Fallback that always works: **File → Revert**.

A headless build will happily write the `.FCStd` while the GUI holds it open,
so do not save from the GUI over a newer build — revert first.

---

## Next steps

Circuitry was settled on 2026-08-04; the rig paused there for the night.

1. **Print `PivotHub`** (59.0). Then test the hub↔arm joint with M5×35 while
   the arms are fresh — socket fit at 0.05 mm per side, whether a bolt passes
   all four holes, and whether a nut actually reaches them under the hub. This
   is the highest-value unverified interface left and needs no decisions.
2. **Measure the cylindrical masses** (due 2026-08-05) → design the carriage
   seat. Diameter, length, mass each, how many.
3. **Reprint `MotorYoke`** (15.1, quick) — corrected horn square and the M2
   traps, so the horn can finally be bolted properly.
4. **Reprint `ServoYokeBracket`** (81.2, the long one) — mates with the arms
   already printed.
5. Uprights and base plate — no novel interfaces, longest prints.

### Open: where do the electronics live?

Nothing in the model hosts the **ESC or the controller** — only the AS5600 has
a bracket and PCB. This is not cosmetic: anything mounted on the beam changes
M, I and trim, and trim already needs 228 g of counterweight. Off-rig on the
bench keeps the plant cleanest; the base plate is tidier and costs two
mounting holes; on the beam is worth arguing against unless the flight
configuration demands it.

**Two things to carry into the electronics work.** The AS5600 needs a
**diametrically** magnetised magnet, not axial; the model gives 6 mm dia at a
1.5 mm face-to-PCB gap, inside the 0.5–3 mm usable band. And thrust is about
two orders of magnitude more than the rig needs — roughly 5 g holds 20°, while
the A2212 makes ~900 g — so the useful range is the bottom half-percent of the
throttle curve, where an ESC has little resolution. Worth discovering on the
bench rather than blaming the mechanism later.
