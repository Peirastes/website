"""Verify the rig's INTERFACES, not just its dimensions.

Three checks:
  1. STATIC INTERFERENCE -- every pair of solids that should not share
     material is tested with a real boolean common(). Catches a bore that
     stopped tracking its shaft, a bracket that grew into its neighbour.
  2. FIT REPORT -- the actual clearance at each designed interface, so a
     tolerance change is visible as a number rather than a hope.
  3. SWEPT TRAVEL -- rotates the whole moving assembly through +/-60 deg and
     reports the angle at which something first strikes the base or the
     uprights. This is the number that tells you how far the rig can
     actually tip, which no single dimension does.

Run via run_check.py.
"""
import math
import os

import FreeCAD as App

HERE = os.path.dirname(os.path.abspath(__file__))
DOC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")

ROTATING = ["PivotHub", "Arm_Motor", "Arm_CW", "ServoYokeBracket",
            "MotorYoke", "MagnetHolder", "CWCarriage",
            "PivotShaft", "Motor", "Prop", "Servo", "CWRod", "CWMass", "Magnet",
            "KeelRod", "KeelBob", "Horn", "HornHub"]
STATIC = ["BasePlate", "Upright_PY", "Upright_NY", "Bearing_PY", "Bearing_NY",
          "SensorBracket", "PCB"]

# Pairs that are SUPPOSED to share material. An interference fit is not a
# modelling error -- it is the fit. Anything not listed here must be clear.
ALLOWED = {
    ("Upright_PY", "Bearing_PY"),   # bearing pressed into its seat
    ("Upright_NY", "Bearing_NY"),
    ("PivotShaft", "Bearing_PY"),   # inner race is a transition fit on the shaft
    ("PivotShaft", "Bearing_NY"),
    ("PivotShaft", "PivotHub"),     # shaft pressed into the hub so it turns with it
    ("PivotShaft", "MagnetHolder"),
    ("CWRod", "CWMass"),            # washer stack rides ON the rod
    ("CWRod", "CWCarriage"),        # pin runs through the carriage
    ("Horn", "HornHub"),            # one part, modelled as two solids
    ("Horn", "MotorYoke"),          # bolted flat to the yoke face
    ("HornHub", "Servo"),           # hub is on the servo shaft
    ("KeelRod", "KeelBob"),         # same, on the keel
    ("KeelRod", "PivotHub"),        # rod seats into the hub boss
}

def _fastener_allowed(a, b):
    """A screw passing through its own clearance hole is not a clash.

    Allow each fastener against the parts it is SUPPOSED to pass through or
    thread into; anything else it touches is a real finding.
    """
    fs, other = (a, b) if a.startswith("FS_") else (b, a)
    if not fs.startswith("FS_"):
        return False
    # a screw threaded into its OWN nut -- that overlap is the engagement
    if other.startswith("FS_"):
        return fs.replace("Nut", "") == other.replace("Nut", "")
    # A NUT is never allowed into a printed part: it sits in a trap with
    # clearance, so any shared material means the trap is wrong. Checked before
    # the prefix table below, because "FS_ServoNutAheadU" starts with
    # "FS_Servo" -- without this the nuts silently inherit the SCREWS'
    # permissions, which is exactly how two buried-nut defects got a PASS.
    # ...except a nut running ON a threaded rod, which is the whole point of it
    if fs == "FS_CWRodNutUp" or fs == "FS_CWRodNutDn":
        return other in ("CWRod", "CWCarriage")
    if "Nut" in fs:
        return False
    ok = {
        "FS_Motor": ("MotorYoke", "Motor"),
        "FS_Horn": ("Horn", "MotorYoke"),

        "FS_Servo": ("Servo", "ServoYokeBracket"),
        # structural -- the holes existed all along; the hardware did not
        "FS_Joint": ("PivotHub", "Arm_Motor", "Arm_CW"),
        "FS_Saddle": ("ServoYokeBracket", "Arm_Motor"),
        "FS_Foot": ("Upright_PY", "Upright_NY", "BasePlate"),
        "FS_Sens": ("Upright_PY", "SensorBracket"),

    }
    for pre in sorted(ok, key=len, reverse=True):
        if fs.startswith(pre):
            return other in ok[pre]
    return False


TOL = 1.0  # mm^3; below this an "overlap" is boolean noise on a tangent face

# Printer envelope, mm. A part must fit SOME orientation of this box.
BUILD_VOLUME = (250.0, 250.0, 250.0)
PRINTED = ["BasePlate", "Upright_PY", "Upright_NY", "PivotHub", "Arm_Motor",
           "Arm_CW", "ServoYokeBracket", "MotorYoke", "MagnetHolder", "CWCarriage",
           "SensorBracket"]


def _pairs(names):
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            yield names[i], names[j]


def check_interference(doc):
    print("1. STATIC INTERFERENCE")
    # Fasteners MUST be included. They were modelled but left out of these
    # lists, so every FS_ object was invisible to this check -- which is
    # precisely the class of clash they were added to catch.
    fs = sorted(o.Name for o in doc.Objects if o.Name.startswith("FS_"))
    names = ROTATING + STATIC + fs
    shapes = {n: doc.getObject(n).Shape for n in names}
    bad = []
    for a, b in _pairs(names):
        if (a, b) in ALLOWED or (b, a) in ALLOWED:
            continue
        if _fastener_allowed(a, b):
            continue
        # cheap reject on bounding boxes before the expensive boolean
        if not shapes[a].BoundBox.intersect(shapes[b].BoundBox):
            continue
        v = shapes[a].common(shapes[b]).Volume
        if v > TOL:
            bad.append((a, b, v))
    if bad:
        for a, b, v in sorted(bad, key=lambda t: -t[2]):
            print("   CLASH  %-18s %-18s %10.1f mm3" % (a, b, v))
    else:
        print("   clear -- no unintended shared material")
    return bad


def check_fits(doc):
    print("\n2. FIT REPORT")
    sh = doc.Params
    f = lambda a: float(getattr(sh, a))
    rows = [
        # AS PRINTED, not nominal. Printed bores come out print_hole under, so
        # the nominal figure is not the fit anyone assembles -- reporting it
        # flagged a correct 0.05 press as "NOT A PRESS FIT".
        ("shaft -> beam bore",
         (f("beam_bore_d") - f("print_hole")) - f("shaft_d"), "press"),
        # a bearing inner race is nominally line-to-line on the shaft; zero is right
        ("shaft -> bearing ID", f("bearing_id") - f("shaft_d"), "transition"),
        ("bearing OD -> seat",
         (f("bearing_seat_d") - f("print_hole")) - f("bearing_od"), "press"),
        ("motor plate thickness", f("motor_plate_thk"), "screw budget"),
        ("idler stub -> arm bore",
         (f("idler_bore_d") - f("print_hole")) - (f("idler_d") + f("print_round")),
         "running"),
        ("motor yoke -> arms (per side)",
         (f("yoke_inner") - (f("yoke_inner") - 2 * f("fit_clear"))) / 2, "running"),
        ("arm -> hub socket (per side)", f("joint_clear") / 2, "snug"),
        ("hub -> upright (per side)",
         (f("pivot_span") - f("hub_wid")) / 2, "swing gap"),
        ("magnet face -> PCB", f("sensor_gap"), "AS5600 air gap"),
    ]
    for label, gap, kind in rows:
        flag = ""
        if kind in ("slip", "running", "swing gap", "screw budget") and gap <= 0:
            flag = "  <-- BINDS"
        if kind == "press" and gap >= 0:
            flag = "  <-- NOT A PRESS FIT"
        if kind == "transition" and abs(gap) > 0.02:
            flag = "  <-- not line-to-line"
        print("   %-32s %+7.3f mm  (%s)%s" % (label, gap, kind, flag))
    # AS5600 wants roughly 0.5-3 mm to the magnet face
    gap = f("sensor_gap")
    if not 0.5 <= gap <= 3.0:
        print("   NOTE sensor_gap %.2f mm is outside the AS5600 usable range" % gap)

    # The encoder reads the HUB. Any slop in the socket means the arm points
    # somewhere the sensor does not know about -- a measurement error, not
    # just a rattle. Worth a number rather than a shrug.
    play = math.degrees(f("joint_clear") / f("joint_len"))
    print("   joint play -> %.2f deg of arm angle the encoder cannot see"
          "  (engagement %.0f mm)" % (play, f("joint_len")))
    if play > 0.25:
        print("   NOTE tighten joint_clear or lengthen hub_len; bolts alone will "
              "not take it out")


def check_fasteners(doc):
    """Fasteners are not modelled, so parts-vs-parts checks cannot see them.

    The motor screws land inside the yoke's hollowed pocket; their HEADS are
    what actually decides how wide that pocket has to be.
    """
    print("\n2b. FASTENER CLEARANCE")
    sh = doc.Params
    f = lambda a: float(getattr(sh, a))
    px = f("yoke_body_l") - 2 * f("motor_wall")
    py = f("yoke_inner") - 2 * f("fit_clear") - 2 * f("motor_wall")
    hd = f("screw_head_d")
    worst = None
    for axis, half, centre in (("X", px / 2, f("motor_bolt_x") / 2),
                               ("Y", py / 2, f("motor_bolt_y") / 2)):
        gap = half - (centre + hd / 2)
        print("   motor screw head vs pocket wall (%s)  %+7.2f mm%s"
              % (axis, gap, "" if gap > 0 else "   <-- FOULS"))
        worst = gap if worst is None else min(worst, gap)
    # Thread engagement into the MOTOR is the one number that can destroy the
    # part we are bolting to. The safe depth is inferred from the screws the
    # manufacturer shipped, so treat it as a ceiling until measured otherwise.
    # Countersunk screws are specified OVER the head; cap/pan are under it. If
    # the hole is not countersunk to match, the cone sits proud and steals that
    # length from the engagement.
    # MEASURED off the modelled screw, not computed. Hand arithmetic here was
    # wrong twice: once on which length a countersunk screw quotes, and once on
    # the sign of the seat offset when the chamfer is wider than the head.
    eng = None
    s = doc.getObject("FS_MotorXp")
    if s is not None:
        eng = s.Shape.BoundBox.ZMax - f("yoke_top_z")
    if eng is None:      # no fastener modelled -- fall back to arithmetic
        proud = max(0.0, f("motor_screw_csk") - f("motor_csk_depth"))
        eng = (f("motor_screw_len") - proud
               - f("motor_plate_thk") - f("motor_washer_thk"))
    safe = f("motor_thread_safe")
    print("   thread engagement into motor            %+7.2f mm  (safe %.2f)%s"
          % (eng, safe,
             "   <-- TOO DEEP, WILL BOTTOM" if eng > safe else
             "   <-- TOO SHALLOW" if eng < 2.5 else ""))
    if eng > safe:
        print("      add %.1f mm of washers under the head, or use a shorter screw"
              % (eng - safe))

    # cross pattern puts two holes only motor_bolt_y/2 from the centre, so the
    # web between them and the central boss clearance is the thin spot
    web = f("motor_bolt_y") / 2 - f("motor_bolt_d") / 2 - f("motor_boss_d") / 2
    print("   web: boss bore -> nearest bolt hole      %+7.2f mm%s"
          % (web, "" if web > 1.5 else "   <-- THIN"))
    return [] if worst > 0 else [("screw head", "yoke pocket", worst)]


def check_travel(doc):
    """Rotate the moving assembly and find where it first hits something."""
    print("\n3. SWEPT TRAVEL")
    sh = doc.Params
    pivot_h = float(sh.pivot_height)
    axis = App.Vector(0, 1, 0)
    centre = App.Vector(0, 0, pivot_h)

    movers = {n: doc.getObject(n).Shape for n in ROTATING}
    statics = {n: doc.getObject(n).Shape for n in STATIC}

    limit_pos, limit_neg, culprit_p, culprit_n = None, None, None, None
    for deg in range(1, 61):
        for sign in (+1, -1):
            if (sign > 0 and limit_pos is not None) or (sign < 0 and limit_neg is not None):
                continue
            hit = None
            for nm, s in movers.items():
                r = s.copy()
                r.rotate(centre, axis, sign * deg)
                # floor strike
                if r.BoundBox.ZMin < 0:
                    hit = "%s -> base plate" % nm
                    break
                for sn, ss in statics.items():
                    if sn in ("BasePlate",):
                        continue
                    if not r.BoundBox.intersect(ss.BoundBox):
                        continue
                    if r.common(ss).Volume > TOL:
                        hit = "%s -> %s" % (nm, sn)
                        break
                if hit:
                    break
            if hit:
                if sign > 0:
                    limit_pos, culprit_p = deg - 1, hit
                else:
                    limit_neg, culprit_n = deg - 1, hit

    lp = limit_pos if limit_pos is not None else 60
    ln = limit_neg if limit_neg is not None else 60
    print("   +theta usable to %2d deg   %s" % (lp, culprit_p or "(clear through 60)"))
    print("   -theta usable to %2d deg   %s" % (ln, culprit_n or "(clear through 60)"))
    usable = min(lp, ln)
    print("   USABLE TRAVEL   +/- %d deg" % usable)
    if usable < 25:
        print("   NOTE travel is tight. Levers, most effective first:")
        print("        raise pivot_height, shorten cw_rod_len/cw_offset, shorten cw_arm")
    return usable


YOKE = ["MotorYoke", "Motor", "Prop", "Horn", "HornHub"]


def check_servo_sweep(doc):
    """Sweep the SERVO, not just the beam.

    check_travel rotates the whole assembly rigidly, so it can never see the
    yoke swinging relative to the arm it is bolted to. With a 10 in prop the
    inboard blade tip drops toward the arm as the servo tilts, and in gimbal
    mode phi = -theta, so beam travel and servo travel are locked together --
    whichever runs out first is the real limit on the demonstration.
    """
    print("\n3b. SERVO SWEEP  (prop vs arm)")
    sh = doc.Params
    pivot_h = float(sh.pivot_height)
    servo = App.Vector(float(sh.motor_arm), 0, float(sh.yoke_axis_z))
    axis = App.Vector(0, 1, 0)
    origin = App.Vector(0, 0, pivot_h)

    yoke = {n: doc.getObject(n).Shape for n in YOKE}
    others = {n: doc.getObject(n).Shape for n in
              ROTATING + STATIC if n not in YOKE}

    def first_hit(gimbal):
        """Largest |angle| that is clear. gimbal=True locks phi = -theta."""
        for deg in range(1, 61):
            for sign in (+1, -1):
                for nm, s in yoke.items():
                    r = s.copy()
                    r.rotate(servo, axis, -sign * deg if gimbal else sign * deg)
                    if gimbal:
                        r.rotate(origin, axis, sign * deg)
                    if r.BoundBox.ZMin < 0:
                        return deg - 1, "%s -> base plate" % nm
                    for on, os_ in others.items():
                        # honour the same intentional-overlap list the static
                        # check uses -- a hub on its own shaft is not a crash
                        if (nm, on) in ALLOWED or (on, nm) in ALLOWED:
                            continue
                        ref = os_
                        if gimbal:
                            ref = os_.copy()
                            if on not in STATIC:
                                ref.rotate(origin, axis, sign * deg)
                        if not r.BoundBox.intersect(ref.BoundBox):
                            continue
                        if r.common(ref).Volume > TOL:
                            return deg - 1, "%s -> %s" % (nm, on)
        return 60, None

    lim_s, why_s = first_hit(False)
    print("   servo alone, beam level     +/- %2d deg   %s"
          % (lim_s, why_s or "(clear through 60)"))
    lim_g, why_g = first_hit(True)
    print("   GIMBAL mode, phi = -theta   +/- %2d deg   %s"
          % (lim_g, why_g or "(clear through 60)"))
    return lim_s, lim_g


# pairs that move relative to each other -- overlap is not the only failure,
# a gap too small to survive print tolerance is a rub
# (a, b, minimum acceptable gap, what the closest approach actually IS)
# Per-pair, because a single threshold conflates two different kinds of
# interface: swept faces want room, a journal is meant to be close.
SWEEP_PAIRS = [
    ("Horn", "ServoYokeBracket", 0.5, "swept face"),
    ("MotorYoke", "ServoYokeBracket", 0.2, "idler journal, close by design"),
    ("Horn", "Servo", 0.5, "swept face"),
    ("MotorYoke", "Arm_Motor", 0.5, "swept face"),
    ("Prop", "PivotHub", 0.5, "swept face"),
    ("KeelBob", "Upright_PY", 0.5, "swept face"),
]


def check_clearances(doc):
    """Measure DISTANCE, not just overlap.

    check_interference only answers "do these share material". Two parts can
    pass that and still be 0.05 mm apart, which for anything that rotates is
    a rub once print tolerance lands on it.
    """
    print("\n2c. RUNNING CLEARANCE")
    bad = []
    for a, b, floor, note in SWEEP_PAIRS:
        oa, ob = doc.getObject(a), doc.getObject(b)
        if oa is None or ob is None:
            continue
        d = oa.Shape.distToShape(ob.Shape)[0]
        tight = d < floor
        print("   %-14s -> %-18s %7.3f mm  (min %.2f, %s)%s"
              % (a, b, d, floor, note, "   <-- WILL RUB" if tight else ""))
        if tight:
            bad.append((a, b, d))
    return bad


def check_build_volume(doc):
    """Does each printed part fit the printer -- axis-aligned, or on a diagonal?

    Three tests, loosest last:
      upright  -- part's own bbox against the sorted build volume
      flat     -- longest dimension along the BED diagonal (the real fallback)
      body     -- longest dimension along the body diagonal (rarely printable,
                  reported only so the number is visible rather than assumed)
    """
    print("\n4. BUILD VOLUME  (%.0f x %.0f x %.0f mm)" % BUILD_VOLUME)
    bx, by, bz = BUILD_VOLUME
    bed_diag = math.hypot(bx, by)
    body_diag = math.sqrt(bx * bx + by * by + bz * bz)
    vol = sorted(BUILD_VOLUME)
    fails = []
    for n in PRINTED:
        bb = doc.getObject(n).Shape.BoundBox
        dims = sorted([bb.XLength, bb.YLength, bb.ZLength])
        longest = dims[-1]
        upright = all(d <= v for d, v in zip(dims, vol))
        flat = longest <= bed_diag and all(d <= min(bx, by, bz) for d in dims[:2])
        body = longest <= body_diag
        if upright:
            how = "fits"
        elif flat:
            how = "fits on the BED DIAGONAL"
        elif body:
            how = "only on the BODY diagonal -- not practically printable"
            fails.append((n, longest))
        else:
            how = "DOES NOT FIT"
            fails.append((n, longest))
        print("   %-18s %6.0f x %5.0f x %5.0f   %s"
              % (n, dims[2], dims[1], dims[0], how))
    if fails:
        print("   bed diagonal = %.0f mm, body diagonal = %.0f mm" % (bed_diag, body_diag))
        for n, l in fails:
            print("   OVERSIZE  %s at %.0f mm" % (n, l))
    return fails


def main():
    doc = App.openDocument(DOC)
    bad = check_interference(doc)
    check_fits(doc)
    bad += check_fasteners(doc)
    bad += check_clearances(doc)
    usable = check_travel(doc)
    check_servo_sweep(doc)
    fails = check_build_volume(doc)
    App.closeDocument(doc.Name)
    problems = []
    if bad:
        problems.append("interference")
    if fails:
        problems.append("oversize parts")
    print("\n%s" % ("FAIL -- " + ", ".join(problems) if problems else "PASS"))
    return usable
