"""TVD Test Rig -- Mk0 "teeter-totter" 1-DOF attitude-control testbed.

Builds a fully parametric FreeCAD model driven by a single Spreadsheet.
Every dimension AND every interface (bores, bolt patterns, seats, clearances)
is an expression referencing that sheet, so a cell edit propagates through the
whole assembly -- including the mating features between parts.

Frame:  X = along the beam,  Y = pivot axis,  Z = up.
Origin: centre of the base plate's TOP face.

Design intent
-------------
One mechanism, three experiments (firmware only):
  * servo locked at 0, throttle -> angle      = Phase A, aeropendulum analog
  * servo tracks -theta                       = 1-D attitude-hold gimbal
  * servo tilts thrust to torque the beam     = Phase B, true TVC

The counterweight rides a vertical threaded rod: HEIGHT sets gravity stiffness
(and its sign -- stable / neutral / inverted), MASS sets inertia.

Deliberate choices about interconnection
----------------------------------------
  * The servo and the idler bearing live on ONE printed U-bracket, so their
    coaxiality is guaranteed by the print, not by assembly care.
  * Plain DocumentObjectGroups, never App::Part containers -- containers carry
    their own placement offsets, which is exactly the trap that silently
    telescoped the rocket model's geometry. Groups have no placement.
  * Bearing seats, shaft bores and bolt clearances all derive from the same
    fit parameters, so a printer-tolerance change is one cell.

Run via run_build.py (freecadcmd sets __name__ to the script stem).
"""
import os

import FreeCAD as App
import Part  # noqa: F401  (registers the Part:: object types)

import hardware
import hardware_struct

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")

# ---------------------------------------------------------------------------
# Parameters: (alias, value_or_formula, note).  A blank alias renders a header.
# ---------------------------------------------------------------------------
PARAMS = [
    ("", "BEAM (hub + two plug-in arms, so each part fits the printer)", ""),
    ("beam_len", "400", "overall teeter-totter length, tip to tip"),
    ("beam_wid", "20", "arm section, Y"),
    ("beam_thk", "16", "arm section, Z"),
    ("motor_arm", "160", "pivot -> thrust axis"),
    ("cw_arm", "160", "pivot -> counterweight rod"),
    ("hub_len", "110", "central hub, X"),
    ("hub_core", "12", "material each side of the pivot bore"),
    ("socket_wall", "5", "hub wall wrapping the arm"),
    ("joint_clear", "0.10", "SNUG -- joint slop shows up as encoder error"),

    ("", "PIVOT", ""),
    ("pivot_height", "160", "above base top; 120 limited travel to +/-25 deg"),
    ("shaft_d", "5", "steel rod"),
    ("bearing_od", "16", "625ZZ"),
    ("bearing_id", "5", ""),
    ("bearing_w", "5", ""),
    ("beam_side_gap", "4", "beam side -> upright inner face"),
    ("shaft_proud", "8", "shaft protrusion past each upright"),

    ("", "BASE", ""),
    ("base_len", "220", ""),
    ("base_wid", "150", ""),
    ("base_thk", "8", ""),
    ("base_hole_d", "4.5", "M4 clamp-down"),
    ("base_hole_inset", "14", ""),
    # The foot-bolt nuts stand proud under the plate and would rock the whole
    # rig on the bench. Recess them so the plate sits flat on its own face.
    ("base_nut_pocket_d", "=nut_m3_af * 1.25", "round pocket, spanner-free"),
    ("base_nut_pocket_h", "=nut_m3_thk + 1.5", "nut + a little proud of nothing"),

    ("", "UPRIGHT", ""),
    ("upright_wid", "46", "X extent"),
    ("upright_thk", "10", "Y extent"),
    ("upright_boss_wall", "6", "material around the bearing OD"),
    ("upright_foot_len", "26", "flange reaching outboard"),
    ("upright_foot_thk", "6", ""),

    ("", "SERVO YOKE BRACKET", ""),
    ("yoke_axis_h", "70", "servo axis above beam top; 26 capped gimbal at +/-28"),
    ("yoke_wall", "7", "arm plate thickness; taller mast needs more"),
    ("yoke_inner", "38", "motor heads + horn setback + wall + rotating gaps"),
    ("yoke_base_thk", "6", "saddle plate"),
    ("yoke_base_end", "8", "material beyond the outermost tab hole"),
    ("yoke_arm_over", "12", "material above the servo axis"),

    ("", "SERVO (MG996R)  -- MEASURED off Cole's own mg996R_v2.FCStd", ""),
    ("servo_hole_ahead", "14.5", "shaft -> tab holes on the +X side"),
    ("servo_hole_behind", "34.5", "shaft -> tab holes on the -X side"),
    ("servo_hole_dz", "5.0", "FOUR holes: each tab carries a pair 10 mm apart"),
    ("servo_hole_d", "4.0", "measured"),
    ("servo_tab_face", "7.5", "source Z of the TAB TOP -- the face that bears on the arm"),
    ("servo_collar_proud", "4.5", "collar face above the tab face (12.0 - 7.5)"),
    ("horn_seat_off", "3.58", "MEASURED: collar face -> horn back face"),
    # The case section that must pass THROUGH the arm, measured off the model
    # above the tab plane. Asymmetric about the shaft, like everything else here.
    ("servo_case_x0", "-30.0", "case extent behind the shaft"),
    ("servo_case_x1", "10.0", "case extent ahead of the shaft"),
    ("servo_case_h", "20.0", "case height (becomes Z in the rig frame)"),
    ("servo_case_clear", "0.6", ""),
    ("horn_shaft_clear", "10.0", "yoke bore behind the horn, for the shaft tip"),
    ("horn_pocket_clear", "1.5", "radial room around the horn in its pocket"),
    ("horn_screw_len", "10", "M2 Cole has: 2.5 horn + 4.5 wall + 1.6 nut = 8.6"),
    ("servo_tab_thk", "8.5", "tab BOSS, source Z -1.0..7.5 -- head bears on its outer face"),
    ("servo_screw_len", "12", "M3: must stop short of the horn pocket floor"),
    ("nut_m3_af", "5.5", "ISO4032 M3 across flats"),
    ("nut_m3_thk", "2.4", ""),
    ("nut_m5_thk", "4.7", "ISO4032 M5 -- rod lock nuts (4.0 was wrong)"),
    ("jbolt_len", "35", "M5x35 (8 of <=12): 26 hub + full nut + 4.3 proud"),
    ("saddle_bolt_len", "30", "M5x30 (all 8 Cole has): 22 stack + full nut"),
    ("foot_bolt_len", "20", "M3 through foot 6 + base 8 + nut"),
    ("nut_m2_af", "4.0", "ISO4032 M2 across flats"),
    ("nut_m2_thk", "1.6", "ISO4032 M2 -- horn nuts, trapped"),
    ("nut_trap_clear", "0.3", "so the nut drops in without a press"),
    ("nut_trap_extra", "0.3", "trap slightly deeper than the nut"),
    # Just long enough to break into MY_Pocket from the hex seat. Do NOT run
    # these to the bottom of the yoke: the clocked square puts the two holes on
    # each side within 0.5 mm of the same X, so full-height slots merge into one
    # gash down the whole horn wall.
    ("horn_nut_slot_len", "5", "channel from the pocket up into the hex seat"),
    ("horn_od", "36.6", "MEASURED tip to tip on Cole's 4-spoke horn"),
    ("horn_plate_thk", "2.5", "the spoke plate -- sets the yoke setback"),
    ("horn_boss_d", "8.5", "raised boss on the yoke side of the horn"),
    ("horn_boss_depth", "1.2", "shallow pocket so the horn seats flat"),
    ("horn_bolt_r", "10.0", "MEASURED: spline centre to the 2nd punchout"),
    # Clocking ONLY. The four holes stay a square at any value -- all four
    # points rotate together (see HORN_BOLTS in hardware.py).
    ("horn_bolt_rot", "43.2", "3 teeth on a 25T spline"),
    ("horn_wall", "4.5", "horn face -> back; 3.0 left only 1.1 behind the nut trap"),

    ("", "MOTOR / PROP  (A2212 1000KV outrunner, bolted down directly)", ""),
    ("motor_d", "28", "OUTER CAN, not the 22 in the '2212' name"),
    ("motor_len", "30", "body height above the mount face"),
    ("motor_bolt_x", "19", "CROSS pattern: opposing pair on X (measured)"),
    ("motor_bolt_y", "16", "CROSS pattern: opposing pair on Y (measured)"),
    ("motor_bolt_d", "3.4", "M3 clearance"),
    # Clearance only -- the four screws locate the motor, not this bore, so
    # oversize is harmless and only "too small" can bite. Cole put the boss at
    # 8 or under, so 9 clears it; left at 9 for margin.
    ("motor_boss_d", "9", "clears the shaft stub / bearing boss (<=8 measured)"),
    ("motor_plate_thk", "6.5", "clearance hole, NOT threaded -- thicker = stiffer, free"),
    ("motor_screw_len", "10", "M3 length; see motor_screw_csk for how it is measured"),
    ("motor_screw_csk", "1.7", "cone height: 0 for cap/pan, 1.7 for countersunk M3"),
    ("csk_head_d", "6.0", "ISO10642 M3 head dia, measured off the Fasteners WB"),
    ("motor_washer_thk", "0", "washers under the head = adjustable depth stop"),
    ("motor_thread_safe", "3.53", "PROVEN: supplied 5.73 screw thru 2.2 steel plate"),
    ("motor_wall", "3", "material around the hollowed pocket"),
    ("screw_head_d", "7.0", "M3 pan head + washer -- sets pocket width"),
    ("prop_d", "255", "measured"),
    ("yoke_body_l", "34", "rotating yoke, X"),
    ("yoke_body_h", "26", "rotating yoke, Z"),
    ("idler_d", "6", "stub journal into the -Y arm"),

    ("", "KEEL BOB  (stiffness on the pivot axis -- no trim, no travel cost)", ""),
    ("keel_depth", "100", "bob centre below the pivot"),
    ("keel_rod_d", "5", "M5 threaded rod"),
    ("keel_bob_d", "30", ""),
    ("keel_bob_h", "21", "~116 g of steel"),
    ("keel_boss_h", "15", "boss under the hub, so the hole clears the pivot bore"),
    ("keel_boss_d", "18", ""),

    ("", "COUNTERWEIGHT", ""),
    # The counterweight now RIDES the arm instead of standing on a rod: a
    # printed carriage slides along the CW arm and is pinned through one of a
    # row of holes. Trim becomes a pure X-position adjustment in fixed steps,
    # and gravity stiffness is left entirely to the keel bob -- previously the
    # rod height did both at once and the two fought each other.
    ("cw_pin_first", "70", "nearest pin hole to the pivot (clears the tongue)"),
    ("cw_pin_last", "190", "furthest, short of the arm tip"),
    ("cw_pin_pitch", "10", "hole spacing -> trim resolution"),
    ("cw_slide_clear", "0.40", "SLIDING, not the 0.10 snug of the hub joint"),
    ("cw_car_wall", "5", "carriage wall around the arm"),
    ("cw_car_len", "24", "carriage length along the beam"),
    ("cw_rod_d", "5", "M5 threaded rod"),
    ("cw_rod_len", "70", "above the carriage, down past the washer stack"),
    ("cw_mass_d", "30", "washer stack OD"),
    ("cw_mass_h", "14", "washer stack height"),
    ("cw_mass_gap", "3", "washer stack clear of the carriage"),

    ("", "SENSOR (AS5600)", ""),
    ("magnet_d", "6", "diametric"),
    ("magnet_h", "2.5", ""),
    ("mh_od", "16", "magnet holder OD"),
    ("mh_thk", "10", ""),
    ("mh_bore_depth", "6", "slip over the proud shaft"),
    ("pcb_w", "20", ""),
    ("pcb_h", "20", ""),
    ("pcb_thk", "1.6", ""),
    ("pcb_hole_span", "14", ""),
    ("pcb_hole_d", "2.4", ""),
    ("sensor_gap", "1.5", "magnet face -> PCB face"),
    ("sb_wall", "5", "sensor bracket stock"),

    ("", "PRINTER COMPENSATION  (measured on Cole's machine)", ""),
    # Flat and round features do NOT bloat the same. The round figure is a MAX
    # diameter, so it includes the seam; a flat wall has no seam to catch.
    ("print_flat", "0.02", "MEASURED: 20.00 tongue came out 20.02"),
    ("print_round", "0.39", "MEASURED: 6.00 stub came out 6.39 (max dia, incl. seam)"),
    ("print_hole", "0.20", "VALIDATED by the socket coupon fitting at 0.10 gap"),

    ("", "FITS & FASTENERS", ""),
    ("fit_clear", "0.25", "general slip clearance, AFTER print compensation"),
    ("journal_clear", "0.12", "TIGHTER: a bearing's play becomes thrust-angle error"),
    ("rot_gap", "1.0", "LOOSER: faces that sweep past each other, not slip fits"),
    ("fit_press", "0.05", "interference"),
    # A 0.05 press in PLA creeps. The encoder reads this shaft, so a slip does
    # not fail loudly -- it drifts the zero and corrupts every angle recorded
    # after it. This is a vertical screw down the hub centreline onto the rod:
    # friction insurance you can re-tighten, at the cost of one hole.
    ("shaft_lock_d", "2.8", "M3 self-taps into PLA at this size"),
    ("m2_clear", "2.4", ""),
    ("m3_clear", "3.4", ""),
    ("m5_clear", "5.5", "hub joint + saddle -- M5 is what Cole stocks long"),
    ("nut_m5_af", "8.0", "ISO4032 M5 across flats"),

    ("", "DERIVED -- INTERFACES", ""),
    # the HUB is the widest rotating thing, so it -- not the arm -- sets the span
    ("hub_wid", "=beam_wid + 2 * socket_wall", ""),
    ("hub_thk", "=beam_thk + 2 * socket_wall", ""),
    # the arm is a printed feature going into a printed socket, so the socket
    # pays the arm's bloat AND its own shrink on top of the design clearance
    ("socket_w", "=beam_wid + print_flat + print_hole + joint_clear", ""),
    ("socket_h", "=beam_thk + print_flat + print_hole + joint_clear", ""),
    ("joint_len", "=hub_len / 2 - hub_core", "tongue engagement"),
    ("arm_len", "=beam_len / 2 - hub_core", "printed length of each arm"),
    ("jbolt_dx1", "=hub_core + joint_len / 3", ""),
    ("jbolt_dx2", "=hub_core + 2 * joint_len / 3", ""),
    ("pivot_span", "=hub_wid + 2 * beam_side_gap", "clear gap between uprights"),
    ("upright_y", "=pivot_span / 2 + upright_thk / 2", "upright plate centre"),
    ("upright_h", "=pivot_height + bearing_od / 2 + upright_boss_wall", ""),
    ("bearing_seat_d", "=bearing_od - fit_press + print_hole",
     "press fit -- print_hole or a 625ZZ meets a 0.25 interference"),
    # print_hole again, and here it bites the OTHER way: without it the bore
    # prints 0.20 under nominal, turning a 0.05 press into a 0.25 one -- which
    # splits a PLA hub rather than gripping a steel rod.
    ("beam_bore_d", "=shaft_d - fit_press + print_hole",
     "INTERFERENCE: shaft turns with beam"),
    ("shaft_len", "=pivot_span + 2 * upright_thk + 2 * shaft_proud", ""),
    ("shaft_relief_d", "=bearing_od - 4", "shoulder behind the bearing"),
    ("beam_top", "=pivot_height + beam_thk / 2", ""),
    ("yoke_axis_z", "=beam_top + yoke_axis_h", ""),
    ("yoke_outer", "=yoke_inner + 2 * yoke_wall", ""),
    # The MG996R's shaft is NOT centred between its tabs, so the saddle has to
    # be asymmetric about the servo axis or it will not reach the far hole.
    ("yoke_base_x0", "=motor_arm - servo_hole_behind - yoke_base_end", "saddle -X end"),
    ("yoke_base_x1", "=motor_arm + servo_hole_ahead + yoke_base_end", "saddle +X end"),
    ("yoke_base_len", "=yoke_base_x1 - yoke_base_x0", ""),
    # The saddle is NOT symmetric about the thrust axis -- the servo's tab holes
    # are 14.5 ahead and 34.5 behind, so the plate runs -42.5..+22.5. Bolts must
    # be symmetric about THIS, not about motor_arm, or the +X pair lands off the
    # end of the plate with its heads in mid-air.
    ("yoke_base_xc", "=(yoke_base_x0 + yoke_base_x1) / 2", "saddle centre"),
    ("yoke_arm_y", "=yoke_inner / 2 + yoke_wall / 2", "arm plate centre"),
    ("yoke_arm_h", "=yoke_axis_h - yoke_base_thk + yoke_arm_over", ""),
    # Where the horn's back face actually lands, measured from the servo's tab
    # face: collar proud of the tabs, plus the horn's own seat offset. The yoke
    # face has to BE there -- it is not a free choice.
    ("servo_shaft_stack", "=servo_collar_proud + horn_seat_off", "tab face -> horn back"),
    # The horn plate is thicker than the gap the stack leaves, so the arm has to
    # be thinned WHERE THE HORN SWEEPS -- locally, keeping 7 mm elsewhere for the
    # mast's stiffness.
    ("horn_bolt_dx", "=horn_bolt_r * cos(horn_bolt_rot)", ""),
    ("horn_bolt_dz", "=horn_bolt_r * sin(horn_bolt_rot)", ""),
    ("horn_pocket_d", "=horn_od + 2 * horn_pocket_clear", ""),
    ("horn_pocket_depth", "=yoke_wall - (servo_shaft_stack - horn_plate_thk - rot_gap)", ""),
    ("yoke_body_yp", "=yoke_inner / 2 - (servo_shaft_stack - yoke_wall)", "+Y face: horn seats here"),
    ("yoke_body_yn", "=-(yoke_inner / 2 - rot_gap)", "-Y face"),
    ("yoke_top_z", "=yoke_axis_z + yoke_body_h / 2", "motor mount face"),
    ("motor_pocket_h", "=yoke_body_h - motor_plate_thk", "hollowed from below"),
    # Size the countersink TO THE HEAD. Pick a depth instead and the head seats
    # at whatever height the two cones happen to meet, which shifts engagement.
    ("motor_csk_d", "=csk_head_d", "chamfer major dia == head dia -> head sits flush"),
    ("motor_csk_depth", "=(motor_csk_d - motor_bolt_d) / 2", "90 deg csk"),
    ("hub_bottom", "=pivot_height - hub_thk / 2", ""),
    ("cw_offset", "=-(cw_car_h / 2 + nut_m5_thk + cw_mass_gap + cw_mass_h / 2)",
     "mass hangs below the carriage, on the pin"),
    ("cw_bore_w", "=beam_wid + print_flat + print_hole + cw_slide_clear", ""),
    ("cw_bore_h", "=beam_thk + print_flat + print_hole + cw_slide_clear", ""),
    ("cw_car_w", "=cw_bore_w + 2 * cw_car_wall", ""),
    ("cw_car_h", "=cw_bore_h + 2 * cw_car_wall", ""),
    ("cw_pin_n", "=floor((cw_pin_last - cw_pin_first) / cw_pin_pitch) + 1", ""),
    # fit_clear is the clearance we want to be LEFT WITH; the print takes
    # print_hole out of every hole, so it has to be added back or the rod binds.
    # These two were the last holes in the model still missing it.
    ("keel_hole_d", "=keel_rod_d + fit_clear + print_hole", ""),
    ("keel_hole_top", "=pivot_height - beam_bore_d / 2 - 5", "stay clear of the pivot bore"),
    ("keel_rod_len", "=keel_depth + keel_bob_h / 2 + 25", ""),
    ("idler_bore_d", "=idler_d + print_round + print_hole + journal_clear", "takes a printed stub"),
    ("cw_hole_d", "=cw_rod_d + fit_clear + print_hole", "13 pin holes"),
    ("yoke_bolt_dx", "=yoke_base_len / 2 - 9", ""),
    # TWO bolts on the beam centreline, not four. The saddle's job is a moment
    # about Y, which X-spacing resists; a Y pair only adds roll resistance, and
    # the clamped flat already carries ~30x the gyroscopic moment that generates.
    # On the centreline an M5 has 7.25 mm of beam each side instead of 2.25.
    ("upright_bolt_dx", "=upright_wid / 2 - 9", ""),
    ("foot_bolt_y", "=upright_y + upright_thk / 2 + upright_foot_len / 2", ""),
    ("sensor_bolt_dx", "=bearing_od / 2 + upright_boss_wall + 5", ""),
    ("mh_outer_y", "=shaft_len / 2 + mh_thk - mh_bore_depth", "magnet face"),
    ("pcb_y", "=mh_outer_y + sensor_gap", "PCB inner face -- chip sees the magnet"),
    ("sb_face_y", "=pcb_y + pcb_thk", "bracket sits BEHIND the PCB, not through it"),
    ("sb_leg_dx", "=upright_wid / 2 - 6", ""),
    ("sb_leg_len", "=sb_face_y - (upright_y + upright_thk / 2)", "reach across"),
    ("sens_bolt_len", "=upright_thk + sb_leg_len", "through upright into the leg"),
]


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def _place(o, x, y, z):
    if x is not None:
        o.setExpression("Placement.Base.x", x)
    if y is not None:
        o.setExpression("Placement.Base.y", y)
    if z is not None:
        o.setExpression("Placement.Base.z", z)


def box(doc, name, L, W, H, x="0", y="0", z="0"):
    """Axis-aligned box; placement is its minimum corner."""
    o = doc.addObject("Part::Box", name)
    o.setExpression("Length", L)
    o.setExpression("Width", W)
    o.setExpression("Height", H)
    _place(o, x, y, z)
    return o


def cyl(doc, name, D, H, x="0", y="0", z="0", axis="z"):
    """Cylinder of diameter D. axis 'z' | 'y' (+Y) | 'y-' (-Y) | 'x' (+X).

    Rotation is set statically because orientation never varies with a
    parameter; only position and size are expression-driven.
    """
    o = doc.addObject("Part::Cylinder", name)
    rot = {
        "z": App.Rotation(App.Vector(0, 0, 1), 0),
        "y": App.Rotation(App.Vector(1, 0, 0), -90),
        "y-": App.Rotation(App.Vector(1, 0, 0), 90),
        "x": App.Rotation(App.Vector(0, 1, 0), 90),
    }[axis]
    o.Placement = App.Placement(App.Vector(0, 0, 0), rot)
    o.setExpression("Radius", "(%s) / 2" % D)
    o.setExpression("Height", H)
    _place(o, x, y, z)
    return o


def cone(doc, name, D1, D2, H, x="0", y="0", z="0"):
    """Truncated cone, D1 at the base and D2 at the top. Used for countersinks."""
    o = doc.addObject("Part::Cone", name)
    o.setExpression("Radius1", "(%s) / 2" % D1)
    o.setExpression("Radius2", "(%s) / 2" % D2)
    o.setExpression("Height", H)
    _place(o, x, y, z)
    return o


def fuse(doc, name, parts):
    o = doc.addObject("Part::MultiFuse", name)
    o.Shapes = parts
    return o


def cut(doc, name, base, tools):
    if len(tools) == 1:
        tool = tools[0]
    else:
        tool = fuse(doc, name + "_Tools", tools)
    o = doc.addObject("Part::Cut", name)
    o.Base = base
    o.Tool = tool
    return o


def group(doc, name, objs):
    g = doc.addObject("App::DocumentObjectGroup", name)
    for o in objs:
        g.addObject(o)
    return g


def neg(expr):
    return "-(%s)" % expr


def sgn(s, expr):
    """expr for the +Y side, negated for the -Y side."""
    return expr if s > 0 else neg(expr)


# ---------------------------------------------------------------------------
# parts
# ---------------------------------------------------------------------------
def build_base(doc):
    plate = box(doc, "BasePlate_Stock",
                "Params.base_len", "Params.base_wid", "Params.base_thk",
                "-Params.base_len / 2", "-Params.base_wid / 2", "-Params.base_thk")
    tools = []
    for i, (sx, sy_) in enumerate([(1, 1), (1, -1), (-1, 1), (-1, -1)]):
        tools.append(cyl(
            doc, "BaseHole%d" % i, "Params.base_hole_d", "Params.base_thk + 2",
            "%s(Params.base_len / 2 - Params.base_hole_inset)" % ("" if sx > 0 else "-"),
            "%s(Params.base_wid / 2 - Params.base_hole_inset)" % ("" if sy_ > 0 else "-"),
            "-Params.base_thk - 1"))
    # upright foot bolts -- same pattern the uprights are drilled on
    for i, (sx, sy_) in enumerate([(1, 1), (1, -1), (-1, 1), (-1, -1)]):
        tools.append(cyl(
            doc, "BaseFootBolt%d" % i, "Params.m3_clear", "Params.base_thk + 2",
            sgn(sx, "Params.upright_bolt_dx"), sgn(sy_, "Params.foot_bolt_y"),
            "-Params.base_thk - 1"))
        # ...and a pocket in the UNDERSIDE for the nut to live in, so the plate
        # rests on its own face instead of on four nuts.
        tools.append(cyl(
            doc, "BaseNutPocket%d" % i, "Params.base_nut_pocket_d",
            "Params.base_nut_pocket_h + 1",
            sgn(sx, "Params.upright_bolt_dx"), sgn(sy_, "Params.foot_bolt_y"),
            "-Params.base_thk - 1"))
    return cut(doc, "BasePlate", plate, tools)


def build_upright(doc, s):
    tag = "P" if s > 0 else "N"
    plate = box(doc, "Upr%s_Plate" % tag,
                "Params.upright_wid", "Params.upright_thk", "Params.upright_h",
                "-Params.upright_wid / 2",
                sgn(s, "Params.upright_y") + (" - Params.upright_thk / 2" if s > 0
                                              else " - Params.upright_thk / 2"),
                "0")
    # foot flange, reaching outboard (away from the beam)
    foot_y0 = ("Params.upright_y + Params.upright_thk / 2" if s > 0
               else "-(Params.upright_y + Params.upright_thk / 2 + Params.upright_foot_len)")
    foot = box(doc, "Upr%s_Foot" % tag,
               "Params.upright_wid", "Params.upright_foot_len", "Params.upright_foot_thk",
               "-Params.upright_wid / 2", foot_y0, "0")
    stock = fuse(doc, "Upr%s_Stock" % tag, [plate, foot])

    outer = ("Params.upright_y + Params.upright_thk / 2" if s > 0
             else "-(Params.upright_y + Params.upright_thk / 2)")
    tools = []
    # bearing seat, counterbored from the OUTER face inward
    tools.append(cyl(doc, "Upr%s_Seat" % tag,
                     "Params.bearing_seat_d", "Params.bearing_w",
                     "0", outer, "Params.pivot_height",
                     axis="y-" if s > 0 else "y"))
    # relief bore through the rest of the wall (shoulder retains the bearing)
    tools.append(cyl(doc, "Upr%s_Relief" % tag,
                     "Params.shaft_relief_d", "Params.upright_thk + 2",
                     "0", sgn(s, "Params.upright_y") + " - Params.upright_thk / 2 - 1",
                     "Params.pivot_height", axis="y"))
    # foot bolts
    for i, sx in enumerate([1, -1]):
        tools.append(cyl(doc, "Upr%s_Bolt%d" % (tag, i),
                         "Params.m3_clear", "Params.upright_foot_thk + 2",
                         sgn(sx, "Params.upright_bolt_dx"),
                         sgn(s, "Params.foot_bolt_y"), "-1"))
    # sensor-bracket bolt holes (+Y upright only)
    if s > 0:
        for i, sx in enumerate([1, -1]):
            tools.append(cyl(doc, "UprP_Sens%d" % i,
                             "Params.m3_clear", "Params.upright_thk + 2",
                             sgn(sx, "Params.sensor_bolt_dx"),
                             "Params.upright_y - Params.upright_thk / 2 - 1",
                             "Params.pivot_height", axis="y"))
    return cut(doc, "Upright_%s" % ("PY" if s > 0 else "NY"), stock, tools)


def build_hub(doc):
    """Central hub: carries the pivot bore and swallows both arm tongues.

    The hub WRAPS the arm section rather than lapping it, so the arms keep
    their full cross-section through the joint -- which is where the bending
    moment is highest. The joint's strength is the hub walls in bearing plus
    two bolts per side in double shear.
    """
    stock = box(doc, "Hub_Stock",
                "Params.hub_len", "Params.hub_wid", "Params.hub_thk",
                "-Params.hub_len / 2", "-Params.hub_wid / 2",
                "Params.pivot_height - Params.hub_thk / 2")
    boss = cyl(doc, "Hub_KeelBoss", "Params.keel_boss_d", "Params.keel_boss_h",
               "0", "0", "Params.hub_bottom - Params.keel_boss_h")
    stock = fuse(doc, "Hub_Stock2", [stock, boss])
    tools = [
        cyl(doc, "Hub_PivotBore", "Params.beam_bore_d", "Params.hub_wid + 2",
            "0", "-Params.hub_wid / 2 - 1", "Params.pivot_height", axis="y"),
        # blind hole up from the boss, stopping short of the pivot bore
        cyl(doc, "Hub_KeelHole", "Params.keel_hole_d",
            "Params.keel_hole_top - (Params.hub_bottom - Params.keel_boss_h) + 1",
            "0", "0", "Params.hub_bottom - Params.keel_boss_h - 1"),
    ]
    for s in (1, -1):
        tag = "P" if s > 0 else "N"
        x0 = ("Params.hub_core" if s > 0
              else "-Params.hub_len / 2 - 1")
        tools.append(box(doc, "Hub_Socket%s" % tag,
                         "Params.joint_len + 1", "Params.socket_w", "Params.socket_h",
                         x0, "-Params.socket_w / 2",
                         "Params.pivot_height - Params.socket_h / 2"))
    # lock screw: hub top -> bore, on the centreline where nothing else lives
    tools.append(cyl(
        doc, "Hub_ShaftLock", "Params.shaft_lock_d",
        "Params.hub_thk / 2 - Params.beam_bore_d / 2 + 2",
        "0", "0", "Params.pivot_height + Params.beam_bore_d / 2 - 1"))
    for s in (1, -1):
        for n in ("1", "2"):
            tools.append(cyl(
                doc, "Hub_JBolt%s%s" % ("P" if s > 0 else "N", n),
                "Params.m5_clear", "Params.hub_thk + 2",
                sgn(s, "Params.jbolt_dx%s" % n), "0",
                "Params.pivot_height - Params.hub_thk / 2 - 1"))
    return cut(doc, "PivotHub", stock, tools)


def build_arm(doc, s):
    """s = +1 motor arm, -1 counterweight arm. Constant section, no step."""
    tag = "Motor" if s > 0 else "CW"
    x0 = "Params.hub_core" if s > 0 else "-Params.beam_len / 2"
    stock = box(doc, "Arm%s_Stock" % tag,
                "Params.arm_len", "Params.beam_wid", "Params.beam_thk",
                x0, "-Params.beam_wid / 2",
                "Params.pivot_height - Params.beam_thk / 2")
    tools = []
    for n in ("1", "2"):
        tools.append(cyl(doc, "Arm%s_JBolt%s" % (tag, n),
                         "Params.m5_clear", "Params.beam_thk + 2",
                         sgn(s, "Params.jbolt_dx%s" % n), "0",
                         "Params.pivot_height - Params.beam_thk / 2 - 1"))
    if s > 0:
        for i, sx in enumerate([1, -1]):
            tools.append(cyl(
                doc, "ArmMotor_YokeBolt%d" % i, "Params.m5_clear",
                "Params.beam_thk + 2",
                "Params.yoke_base_xc %s Params.yoke_bolt_dx" % ("+" if sx > 0 else "-"),
                "0", "Params.pivot_height - Params.beam_thk / 2 - 1"))
    else:
        # A ROW of pin holes, not one rod hole: the carriage slides along the
        # arm and pins into whichever gives the trim you want. Spacing IS the
        # trim resolution -- see cw_pin_pitch.
        n = int(doc.Params.cw_pin_n)
        for i in range(n):
            tools.append(cyl(
                doc, "ArmCW_Pin%02d" % i, "Params.cw_hole_d",
                "Params.beam_thk + 2",
                "-(Params.cw_pin_first + %d * Params.cw_pin_pitch)" % i, "0",
                "Params.pivot_height - Params.beam_thk / 2 - 1"))
    return cut(doc, "Arm_%s" % tag, stock, tools)


def build_cw_carriage(doc):
    """Counterweight carriage -- a collar that slides on the CW arm.

    Replaces the fixed vertical rod. Slides to a chosen pin hole and locks with
    an M5 through the arm, so trim is set by POSITION rather than by threading
    a mass up and down a rod. Gravity stiffness is the keel bob's job now, and
    the two adjustments stop interacting.

    The bore is a SLIDING fit (cw_slide_clear 0.40), not the 0.10 snug of the
    hub joint -- this one has to move by hand along a printed surface.
    """
    stock = box(doc, "CWC_Stock",
                "Params.cw_car_len", "Params.cw_car_w", "Params.cw_car_h",
                "-Params.cw_arm - Params.cw_car_len / 2",
                "-Params.cw_car_w / 2",
                "Params.pivot_height - Params.cw_car_h / 2")
    tools = [
        # the arm passes straight through
        box(doc, "CWC_Bore",
            "Params.cw_car_len + 2", "Params.cw_bore_w", "Params.cw_bore_h",
            "-Params.cw_arm - Params.cw_car_len / 2 - 1",
            "-Params.cw_bore_w / 2",
            "Params.pivot_height - Params.cw_bore_h / 2"),
        # the pin, through carriage and arm together
        cyl(doc, "CWC_PinHole", "Params.cw_hole_d", "Params.cw_car_h + 2",
            "-Params.cw_arm", "0",
            "Params.pivot_height - Params.cw_car_h / 2 - 1"),
    ]
    return cut(doc, "CWCarriage", stock, tools)


def build_yoke_bracket(doc):
    """Servo + idler on ONE part: coaxiality comes from the print."""
    saddle = box(doc, "YB_Saddle",
                 "Params.yoke_base_len", "Params.yoke_outer", "Params.yoke_base_thk",
                 "Params.yoke_base_x0",
                 "-Params.yoke_outer / 2", "Params.beam_top")
    arms = [saddle]
    for s in (1, -1):
        tag = "P" if s > 0 else "N"
        arms.append(box(doc, "YB_Arm%s" % tag,
                        "Params.yoke_base_len", "Params.yoke_wall", "Params.yoke_arm_h",
                        "Params.yoke_base_x0",
                        sgn(s, "Params.yoke_arm_y") + " - Params.yoke_wall / 2",
                        "Params.beam_top + Params.yoke_base_thk"))
    stock = fuse(doc, "YB_Stock", arms)

    tools = [
        # Hex nut traps on the INNER face. The heads are outboard on the servo
        # tabs; it is the NUTS that would otherwise stand proud into the horn's
        # swept circle. Trapping them also stops them spinning during assembly,
        # which matters because the forward pair is unreachable once the servo
        # is fitted.
    ]
    for nm, ex in (("Ahead", "+ Params.servo_hole_ahead"),
                   ("Behind", "- Params.servo_hole_behind")):
        for sz, zex in (("U", "+"), ("D", "-")):
            trap = doc.addObject("Part::Prism", "YB_NutTrap%s%s" % (nm, sz))
            trap.Polygon = 6
            trap.setExpression(
                "Circumradius",
                "(Params.nut_m3_af + Params.nut_trap_clear + Params.print_hole)"
            " / sqrt(3) * 2 / 2")
            # All four nuts bear on the SAME face, so all four screws take the
            # same grip length -- one screw length, one torque, and the rear
            # pair is no longer a different fastener problem from the forward.
            #
            # The forward pair sits inside the horn pocket, so that face falls
            # naturally at the pocket floor. The rear pair has solid arm out to
            # the inner face, so its trap has to be CUT DEEPER to reach the same
            # face: shifting it outboard instead would seal the cavity and leave
            # no way to get a nut into it.
            depth = "Params.nut_m3_thk + Params.nut_trap_extra"
            if nm != "Ahead":
                depth += " + Params.horn_pocket_depth"   # open to the inner face
            trap.setExpression("Height", depth)
            trap.Placement = App.Placement(
                App.Vector(0, 0, 0), App.Rotation(App.Vector(1, 0, 0), 90))
            trap.setExpression(
                "Placement.Base.x", "Params.motor_arm %s" % ex)
            trap.setExpression(
                "Placement.Base.y",
                "Params.yoke_arm_y - Params.yoke_wall / 2 + Params.nut_m3_thk"
                " + Params.nut_trap_extra + Params.horn_pocket_depth")
            trap.setExpression(
                "Placement.Base.z",
                "Params.yoke_axis_z %s Params.servo_hole_dz" % zex)
            tools.append(trap)
    tools += [
        # Pocket on the arm's INNER face so the horn plate has somewhere to be.
        cyl(doc, "YB_HornPocket", "Params.horn_pocket_d",
            "Params.horn_pocket_depth + 1",
            "Params.motor_arm",
            "Params.yoke_arm_y - Params.yoke_wall / 2 - 1",
            "Params.yoke_axis_z", axis="y"),
        # Rectangular window for the servo case -- NOT a round bore. The tabs
        # sit ~10 mm below the top of the case, so the gearbox housing passes
        # right through the bracket.
        box(doc, "YB_ServoWindow",
            "Params.servo_case_x1 - Params.servo_case_x0 + 2 * Params.servo_case_clear",
            "Params.yoke_wall + 2",
            "Params.servo_case_h + 2 * Params.servo_case_clear",
            "Params.motor_arm + Params.servo_case_x0 - Params.servo_case_clear",
            "Params.yoke_arm_y - Params.yoke_wall / 2 - 1",
            "Params.yoke_axis_z - Params.servo_case_h / 2 - Params.servo_case_clear"),
        # idler journal bore through the -Y arm
        cyl(doc, "YB_IdlerBore", "Params.idler_bore_d", "Params.yoke_wall + 2",
            "Params.motor_arm",
            "-(Params.yoke_arm_y + Params.yoke_wall / 2 + 1)",
            "Params.yoke_axis_z", axis="y"),
    ]
    # servo mounting tabs -- offsets are from the SHAFT axis, not the body centre
    # FOUR tab holes -- each MG996R tab carries a pair 10 mm apart, and the
    # pattern is asymmetric about the shaft (14.5 ahead, 34.5 behind).
    for nm, ex in (("Ahead", "+ Params.servo_hole_ahead"),
                   ("Behind", "- Params.servo_hole_behind")):
        for sz, zex in (("U", "+"), ("D", "-")):
            tools.append(cyl(doc, "YB_Tab%s%s" % (nm, sz), "Params.servo_hole_d",
                             "Params.yoke_wall + 2",
                             "Params.motor_arm %s" % ex,
                             "Params.yoke_arm_y - Params.yoke_wall / 2 - 1",
                             "Params.yoke_axis_z %s Params.servo_hole_dz" % zex,
                             axis="y"))
    for i, sx in enumerate([1, -1]):
        tools.append(cyl(
            doc, "YB_Bolt%d" % i, "Params.m5_clear", "Params.yoke_base_thk + 2",
            "Params.yoke_base_xc %s Params.yoke_bolt_dx" % ("+" if sx > 0 else "-"),
            "0", "Params.beam_top - 1"))
    return cut(doc, "ServoYokeBracket", stock, tools)


def build_motor_yoke(doc):
    body = box(doc, "MY_Body",
               "Params.yoke_body_l", "Params.yoke_body_yp - Params.yoke_body_yn",
               "Params.yoke_body_h",
               "Params.motor_arm - Params.yoke_body_l / 2",
               "Params.yoke_body_yn",
               "Params.yoke_axis_z - Params.yoke_body_h / 2")
    stub = cyl(doc, "MY_Stub", "Params.idler_d",
               "Params.rot_gap + Params.yoke_wall + 1",
               "Params.motor_arm", "Params.yoke_body_yn",
               "Params.yoke_axis_z", axis="y-")
    stock = fuse(doc, "MY_Stock", [body, stub])

    tools = [
        # hollow from BELOW, leaving only motor_plate_thk under the motor. The
        # screws thread up into the motor, so the plate is a screw-length budget
        # -- not a place to add material.
        box(doc, "MY_Pocket",
            "Params.yoke_body_l - 2 * Params.motor_wall",
            "Params.yoke_body_yp - Params.horn_wall"
            " - (Params.yoke_body_yn + Params.motor_wall)",
            "Params.motor_pocket_h + 1",
            "Params.motor_arm - (Params.yoke_body_l - 2 * Params.motor_wall) / 2",
            "Params.yoke_body_yn + Params.motor_wall",
            "Params.yoke_axis_z - Params.yoke_body_h / 2 - 1"),
        # clearance for whatever pokes out of the motor's underside
        cyl(doc, "MY_BossClear", "Params.motor_boss_d", "Params.yoke_body_h + 2",
            "Params.motor_arm", "0",
            "Params.yoke_axis_z - Params.yoke_body_h / 2 - 1"),
        # shallow pocket so the horn's raised boss does not hold it off the face
        cyl(doc, "MY_HornBoss", "Params.horn_boss_d + Params.fit_clear",
            "Params.horn_boss_depth", "Params.motor_arm",
            "Params.yoke_body_yp - Params.horn_boss_depth",
            "Params.yoke_axis_z", axis="y"),
        # clearance for the servo shaft / horn hub behind it
        cyl(doc, "MY_HornHub", "Params.horn_shaft_clear", "Params.horn_wall + 2",
            "Params.motor_arm", "Params.yoke_body_yp - Params.horn_wall - 1",
            "Params.yoke_axis_z", axis="y"),
    ]
    # FOUR M2 through the horn face, on the spoke axes -- a square, clocked
    for tag, sx, sz in hardware.HORN_BOLTS:
        tools.append(cyl(
            doc, "MY_HornBolt%s" % tag, "Params.m2_clear",
            "Params.horn_wall + 2",
            "Params.motor_arm %s" % sx,
            "Params.yoke_body_yp - Params.horn_wall - 1",
            "Params.yoke_axis_z %s" % sz,
            axis="y"))
        # Hex trap in the BACK of the horn wall. MY_Pocket only reaches the
        # lower half of the yoke, so without these the two upper nuts land in
        # solid material while the lower two float in the pocket -- captured on
        # one diagonal, spinning free on the other. Trapping all four makes the
        # joint independent of where the pocket happens to end, and the horn
        # face is the only side you can reach once the yoke is on the servo.
        trap = doc.addObject("Part::Prism", "MY_HornNutTrap%s" % tag)
        trap.Polygon = 6
        trap.setExpression(
            "Circumradius",
            "(Params.nut_m2_af + Params.nut_trap_clear + Params.print_hole)"
            " / sqrt(3) * 2 / 2")
        trap.setExpression(
            "Height", "Params.nut_m2_thk + Params.nut_trap_extra")
        trap.Placement = App.Placement(
            App.Vector(0, 0, 0), App.Rotation(App.Vector(1, 0, 0), -90))
        trap.setExpression(
            "Placement.Base.x",
            "Params.motor_arm %s" % sx)
        trap.setExpression(
            "Placement.Base.y", "Params.yoke_body_yp - Params.horn_wall")
        trap.setExpression(
            "Placement.Base.z",
            "Params.yoke_axis_z %s" % sz)
        tools.append(trap)
        # ...and a channel from inside MY_Pocket up to that seat, because a
        # trap you cannot load is not a trap. The pocket top is set by
        # motor_plate_thk (the motor bolts to that plate, so it cannot be
        # thinned), and it lands just BELOW the upper bolt circle -- which is
        # why the top two screws on the printed yoke ran into solid plastic
        # with nowhere for a nut to go. The nut slides up this slot and the
        # screw captures it. Only the back nut_m2_thk of the wall is cut, so
        # the horn still seats on full material.
        tools.append(box(
            doc, "MY_HornNutSlot%s" % tag,
            "Params.nut_m2_af + Params.nut_trap_clear + Params.print_hole",
            "Params.nut_m2_thk + Params.nut_trap_extra",
            "Params.horn_nut_slot_len",
            "Params.motor_arm %s"
            " - (Params.nut_m2_af + Params.nut_trap_clear"
            " + Params.print_hole) / 2" % sx,
            "Params.yoke_body_yp - Params.horn_wall",
            "Params.yoke_axis_z %s - Params.horn_nut_slot_len" % sz))
    # Motor bolt pattern -- a CROSS, not a rectangle (measured on the A2212):
    # one opposing pair on the X axis at motor_bolt_x apart, the other pair on
    # the Y axis at motor_bolt_y apart, both through the centre.
    holes = [("Xp", "Params.motor_arm + Params.motor_bolt_x / 2", "0"),
             ("Xn", "Params.motor_arm - Params.motor_bolt_x / 2", "0"),
             ("Yp", "Params.motor_arm", "Params.motor_bolt_y / 2"),
             ("Yn", "Params.motor_arm", "-Params.motor_bolt_y / 2")]
    for tag, hx, hy in holes:
        tools.append(cyl(
            doc, "MY_MotorBolt%s" % tag, "Params.motor_bolt_d",
            "Params.motor_plate_thk + 2", hx, hy,
            "Params.yoke_top_z - Params.motor_plate_thk - 1"))
        # countersink at the inlet (pocket side) so a flat head can seat
        tools.append(cone(
            doc, "MY_MotorCsk%s" % tag, "Params.motor_csk_d", "Params.motor_bolt_d",
            "Params.motor_csk_depth", hx, hy,
            "Params.yoke_top_z - Params.motor_plate_thk"))
    return cut(doc, "MotorYoke", stock, tools)


def build_magnet_holder(doc):
    stock = cyl(doc, "MH_Stock", "Params.mh_od", "Params.mh_thk",
                "0", "Params.shaft_len / 2 - Params.mh_bore_depth",
                "Params.pivot_height", axis="y")
    tools = [
        cyl(doc, "MH_Bore", "Params.beam_bore_d", "Params.mh_bore_depth",
            "0", "Params.shaft_len / 2 - Params.mh_bore_depth",
            "Params.pivot_height", axis="y"),
        cyl(doc, "MH_Pocket", "Params.magnet_d + Params.fit_clear", "Params.magnet_h",
            "0", "Params.mh_outer_y - Params.magnet_h",
            "Params.pivot_height", axis="y"),
    ]
    return cut(doc, "MagnetHolder", stock, tools)


def build_sensor_bracket(doc):
    face = box(doc, "SB_Face",
               "Params.upright_wid", "Params.sb_wall", "Params.pcb_h + 2 * Params.sb_wall",
               "-Params.upright_wid / 2", "Params.sb_face_y",
               "Params.pivot_height - Params.pcb_h / 2 - Params.sb_wall")
    legs = [face]
    for i, sx in enumerate([1, -1]):
        legs.append(box(doc, "SB_Leg%d" % i,
                        "Params.sb_wall", "Params.sb_leg_len", "Params.sb_wall + 6",
                        "%s(Params.sb_leg_dx) - Params.sb_wall / 2" % ("" if sx > 0 else "-"),
                        "Params.upright_y + Params.upright_thk / 2",
                        "Params.pivot_height - 3"))
    stock = fuse(doc, "SB_Stock", legs)

    tools = [
        # window so the chip faces the magnet
        cyl(doc, "SB_Window", "Params.mh_od + 2", "Params.sb_wall + 2",
            "0", "Params.sb_face_y - 1", "Params.pivot_height", axis="y"),
    ]
    for i, (sx, sz) in enumerate([(1, 1), (1, -1), (-1, 1), (-1, -1)]):
        tools.append(cyl(
            doc, "SB_PcbHole%d" % i, "Params.pcb_hole_d", "Params.sb_wall + 2",
            sgn(sx, "Params.pcb_hole_span / 2"), "Params.sb_face_y - 1",
            "Params.pivot_height %s Params.pcb_hole_span / 2" % ("+" if sz > 0 else "-"),
            axis="y"))
    for i, sx in enumerate([1, -1]):
        tools.append(cyl(
            doc, "SB_Mount%d" % i, "Params.m3_clear", "Params.sb_leg_len + 2",
            sgn(sx, "Params.sensor_bolt_dx"),
            "Params.upright_y + Params.upright_thk / 2 - 1",
            "Params.pivot_height", axis="y"))
    return cut(doc, "SensorBracket", stock, tools)


# --- hardware representations (mass properties + visual fit checking) -------
def build_hardware(doc):
    hw = {}
    hw["PivotShaft"] = cyl(doc, "PivotShaft", "Params.shaft_d", "Params.shaft_len",
                           "0", "-Params.shaft_len / 2", "Params.pivot_height", axis="y")
    for s in (1, -1):
        tag = "PY" if s > 0 else "NY"
        y0 = ("Params.upright_y + Params.upright_thk / 2 - Params.bearing_w" if s > 0
              else "-(Params.upright_y + Params.upright_thk / 2)")
        o = cyl(doc, "Brg%s_OD" % tag, "Params.bearing_od", "Params.bearing_w",
                "0", y0, "Params.pivot_height", axis="y")
        i = cyl(doc, "Brg%s_ID" % tag, "Params.bearing_id", "Params.bearing_w + 2",
                "0", y0 + " - 1", "Params.pivot_height", axis="y")
        hw["Bearing_%s" % tag] = cut(doc, "Bearing_%s" % tag, o, [i])

    # the motor now sits ON the yoke's top face, not inside a bore
    hw["Motor"] = cyl(doc, "Motor", "Params.motor_d", "Params.motor_len",
                      "Params.motor_arm", "0", "Params.yoke_top_z")
    hw["Prop"] = cyl(doc, "Prop", "Params.prop_d", "1.5",
                     "Params.motor_arm", "0",
                     "Params.yoke_top_z + Params.motor_len + 3")
    hw["Servo"] = import_servo(doc)

    # The horn, as a DISC of the measured tip diameter -- deliberately larger
    # than the real four-spoke cross, so anything that clears this clears the
    # part. It bolts to the yoke's +Y face and turns WITH the yoke.
    horn_disc = cyl(doc, "Horn_Disc", "Params.horn_od", "Params.horn_plate_thk",
                    "Params.motor_arm", "Params.yoke_body_yp",
                    "Params.yoke_axis_z", axis="y")
    horn_cuts = [cyl(doc, "Horn_Spline", "Params.horn_boss_d - 3",
                     "Params.horn_plate_thk + 2", "Params.motor_arm",
                     "Params.yoke_body_yp - 1", "Params.yoke_axis_z", axis="y")]
    for tag, sx, sz in hardware.HORN_BOLTS:
        horn_cuts.append(cyl(
            doc, "Horn_Bolt%s" % tag, "Params.m2_clear",
            "Params.horn_plate_thk + 2",
            "Params.motor_arm %s" % sx,
            "Params.yoke_body_yp - 1",
            "Params.yoke_axis_z %s" % sz,
            axis="y"))
    hw["Horn"] = cut(doc, "Horn", horn_disc, horn_cuts)
    hw["HornHub"] = cyl(doc, "HornHub", "Params.horn_boss_d", "3.3",
                        "Params.motor_arm",
                        "Params.yoke_body_yp + Params.horn_plate_thk",
                        "Params.yoke_axis_z", axis="y")
    hw["CWRod"] = cyl(doc, "CWRod", "Params.cw_rod_d", "Params.cw_rod_len",
                      "-Params.cw_arm", "0",
                      "Params.pivot_height + Params.cw_car_h / 2 + 6"
                      " - Params.cw_rod_len")
    hw["CWMass"] = cyl(doc, "CWMass", "Params.cw_mass_d", "Params.cw_mass_h",
                       "-Params.cw_arm", "0",
                       "Params.pivot_height + Params.cw_offset - Params.cw_mass_h / 2")
    hw["KeelRod"] = cyl(doc, "KeelRod", "Params.keel_rod_d", "Params.keel_rod_len",
                        "0", "0", "Params.keel_hole_top - Params.keel_rod_len")
    hw["KeelBob"] = cyl(doc, "KeelBob", "Params.keel_bob_d", "Params.keel_bob_h",
                        "0", "0",
                        "Params.pivot_height - Params.keel_depth - Params.keel_bob_h / 2")
    hw["Magnet"] = cyl(doc, "Magnet", "Params.magnet_d", "Params.magnet_h",
                       "0", "Params.mh_outer_y - Params.magnet_h",
                       "Params.pivot_height", axis="y")
    hw["PCB"] = box(doc, "PCB", "Params.pcb_w", "Params.pcb_thk", "Params.pcb_h",
                    "-Params.pcb_w / 2", "Params.pcb_y",
                    "Params.pivot_height - Params.pcb_h / 2")
    return hw


SERVO_SRC = os.path.join(
    os.path.expanduser("~"), "Dropbox", "Private", "Projects", "CAD", "Models",
    "motorcad", "mg996R_v2.FCStd")


def import_servo(doc):
    """Bring in Cole's own MG996R solid rather than approximating it.

    Source frame: shaft on the +Z axis through the origin, tab bearing face at
    Z = servo_tab_face. Rotating +90 about X maps +Z -> -Y, so the shaft ends up
    pointing inboard along -Y, which is how it drives the yoke.
    """
    src = App.openDocument(SERVO_SRC)
    shp = src.getObject("Body").Shape.copy()
    App.closeDocument(src.Name)
    shp.rotate(App.Vector(0, 0, 0), App.Vector(1, 0, 0), 90)
    o = doc.addObject("Part::Feature", "Servo")
    o.Shape = shp
    o.setExpression("Placement.Base.x", "Params.motor_arm")
    o.setExpression("Placement.Base.y",
                    "Params.yoke_arm_y + Params.yoke_wall / 2 + Params.servo_tab_face")
    o.setExpression("Placement.Base.z", "Params.yoke_axis_z")
    return o


# ---------------------------------------------------------------------------
def build_sheet(doc):
    sh = doc.addObject("Spreadsheet::Sheet", "Params")
    row = 1
    sh.set("A%d" % row, "TVD TEST RIG Mk0 -- edit column B only")
    row += 2
    for alias, value, note in PARAMS:
        if not alias:
            row += 1
            # NB: never start a cell with '=' -- the sheet parses it as an expression
            sh.set("A%d" % row, "-- %s --" % value)
            row += 1
            continue
        sh.set("A%d" % row, alias)
        sh.set("B%d" % row, value)
        sh.setAlias("B%d" % row, alias)
        if note:
            sh.set("C%d" % row, note)
        row += 1
    doc.recompute()
    return sh


def main():
    doc = App.newDocument("TVD_TestRig_Mk0")
    build_sheet(doc)

    printed = [
        build_base(doc),
        build_upright(doc, 1),
        build_upright(doc, -1),
        build_hub(doc),
        build_arm(doc, 1),
        build_arm(doc, -1),
        build_cw_carriage(doc),
        build_yoke_bracket(doc),
        build_motor_yoke(doc),
        build_magnet_holder(doc),
        build_sensor_bracket(doc),
    ]
    hw = build_hardware(doc)
    doc.recompute()

    fasteners = []
    if hardware.available():
        fasteners = (hardware.motor_joint(doc) + hardware.horn_joint(doc)
                     + hardware.servo_mount(doc)
                     + hardware_struct.all_struct(doc))
        doc.recompute()
        print("fasteners: %d placed (Fasteners WB)" % len(fasteners))
    else:
        print("fasteners: Fasteners WB not found -- skipped")

    groups = [group(doc, "PrintedParts", printed),
              group(doc, "Hardware", list(hw.values()))]
    if fasteners:
        groups.append(group(doc, "Fasteners", fasteners))

    # Show ONLY the finished parts. Objects built headlessly default to
    # Visibility=True, so without this the file opens with every construction
    # box and cut-tool cylinder rendering on top of the assembly -- the parts
    # are not hidden, they are buried. Done here rather than in a separate
    # script so it cannot be forgotten after a rebuild.
    # The GROUPS must stay visible too -- hiding a DocumentObjectGroup hides
    # everything inside it, so leaving them out of `keep` blanks the assembly
    # even though every part is individually visible.
    keep = ({o.Name for o in printed} | {o.Name for o in hw.values()}
            | {o.Name for o in fasteners} | {g.Name for g in groups})
    shown = 0
    for o in doc.Objects:
        if not hasattr(o, "Visibility"):
            continue
        o.Visibility = o.Name in keep
        shown += o.Visibility
    doc.recompute()
    print("visibility: %d shown, %d construction objects hidden"
          % (shown, len(doc.Objects) - shown))
    doc.recompute()

    # --- verification --------------------------------------------------
    bad = [o.Name for o in doc.Objects
           if hasattr(o, "Shape") and o.Shape.Solids and not o.Shape.isValid()]
    if bad:
        raise RuntimeError("invalid shapes: %s" % bad)

    print("%-22s %12s %10s" % ("PART", "VOLUME mm3", "SOLIDS"))
    for o in printed:
        print("%-22s %12.1f %10d" % (o.Label, o.Shape.Volume, len(o.Shape.Solids)))
        if o.Shape.Volume <= 0:
            raise RuntimeError("%s has no material" % o.Label)
        if len(o.Shape.Solids) != 1:
            raise RuntimeError("%s is not a single solid (%d) -- a feature is "
                               "detached or a cut split it"
                               % (o.Label, len(o.Shape.Solids)))

    doc.saveAs(OUT)
    print("\nsaved -> %s" % OUT)
    return doc
