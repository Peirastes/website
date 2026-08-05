"""Real fasteners, from the Fasteners Workbench addon.

Screws were the one thing the model did NOT contain, which is exactly why two
defects got through: the heads fouling the yoke pocket, and the countersunk-vs-
socket-cap length confusion. Both were caught by hand arithmetic that I got
wrong before I got it right. Modelled fasteners turn them into ordinary
interference results.

Verified working under freecadcmd (Fasteners WB 0.5.51):
  ISO4762  socket cap   M3x10 -> 13.00 mm tall  (10 measured UNDER the head)
  ISO10642 countersunk  M3x10 -> 10.00 mm tall  (10 measured OVERALL)
  ISO7380-1 button, ISO4032 nut, ISO7089 washer all build too.

Two gotchas, both learned the hard way:
  * FastenerBase imports FreeCADGui. Under freecadcmd that resolves to a stub,
    so it works -- but the addon path must be on sys.path first.
  * Binding an expression to `Length` flips it to "Custom" and the shape then
    follows `LengthCustom`. So drive LengthCustom, not Length.

Threads are left OFF. They cost a great deal of mesh and buy nothing for
interference, which only cares about the envelope.
"""
import os
import sys

import FreeCAD as App

ADDON = os.path.join(os.path.expanduser("~"), "AppData", "Roaming", "FreeCAD",
                     "v1-1", "Mod", "fasteners")

# ISO numbers for the head styles we care about
SOCKET_CAP = "ISO4762"
COUNTERSUNK = "ISO10642"
BUTTON = "ISO7380-1"
HEX_NUT = "ISO4032"
WASHER = "ISO7089"


def available():
    return os.path.isdir(ADDON)


def _cmd():
    if ADDON not in sys.path:
        sys.path.insert(0, ADDON)
    import FastenersCmd
    return FastenersCmd


def screw(doc, name, kind, dia, length_expr=None, pos=("0", "0", "0"),
          invert=False, rot=None):
    """Place one fastener.

    length_expr is an expression string for LengthCustom; omit for parts that
    have no length (nuts, washers). pos entries are expression strings, so a
    fastener tracks the hole it lives in.
    """
    fsc = _cmd()
    o = doc.addObject("Part::FeaturePython", name)
    fsc.FSScrewObject(o, kind, None)
    o.Diameter = dia
    o.Thread = False
    if length_expr is not None:
        o.Length = "Custom"
        o.setExpression("LengthCustom", length_expr)
    if invert:
        o.Invert = True
    if rot is not None:
        o.Placement = App.Placement(App.Vector(0, 0, 0), rot)
    for axis, expr in zip(("x", "y", "z"), pos):
        o.setExpression("Placement.Base.%s" % axis, expr)
    return o


# The horn's four holes lie on spokes 90 deg apart, so they are a SQUARE at any
# clocking -- rotating a square does not make it a rectangle. Clocking it means
# rotating ALL FOUR points by the same angle:
#     (dx, dz)  (-dz, dx)  (-dx, -dz)  (dz, -dx)
# The old form (+/-dx, +/-dz) is only that square when the angle is exactly 45,
# and at 43.2 it put two of the four holes 0.63 mm out of position.
HORN_BOLTS = (
    ("PP", "+ Params.horn_bolt_dx", "+ Params.horn_bolt_dz"),
    ("PN", "+ Params.horn_bolt_dz", "- Params.horn_bolt_dx"),
    ("NN", "- Params.horn_bolt_dx", "- Params.horn_bolt_dz"),
    ("NP", "- Params.horn_bolt_dz", "+ Params.horn_bolt_dx"),
)


def horn_joint(doc):
    """Four M2 through the horn into the yoke, nuts landing in the pocket.

    Head on the OUTBOARD side (the horn), body running inboard, so these are
    rotated -90 about X rather than the +180 the motor screws use.
    """
    rot = App.Rotation(App.Vector(1, 0, 0), -90)
    head_y = "Params.yoke_body_yp + Params.horn_plate_thk"
    # Seats in MY_HornNutTrap*, which is cut INTO the wall from its back face
    # -- and the nut model builds outboard from its base, so base = back face.
    nut_y = "Params.yoke_body_yp - Params.horn_wall"
    made = []
    for tag, xo, zo in HORN_BOLTS:
        x = "Params.motor_arm %s" % xo
        z = "Params.yoke_axis_z %s" % zo
        made.append(screw(doc, "FS_Horn%s" % tag, SOCKET_CAP, "M2",
                          length_expr="Params.horn_screw_len",
                          pos=(x, head_y, z), rot=rot))
        made.append(screw(doc, "FS_HornNut%s" % tag, HEX_NUT, "M2",
                          pos=(x, nut_y, z), rot=rot))
    return made


def servo_mount(doc):
    """The four screws holding the servo's tabs to the bracket arm, plus their
    nuts sitting down in the traps."""
    rot = App.Rotation(App.Vector(1, 0, 0), -90)
    head_y = "Params.yoke_arm_y + Params.yoke_wall / 2 + Params.servo_tab_thk"
    # one bearing face for all four -- see the nut-trap block in build_rig
    # The trap's bearing face is at (... + nut_m3_thk + extra + pocket_depth)
    # and the trap is cut INBOARD from it; the nut model builds OUTBOARD from
    # its base. So the base is one nut thickness back, or the nut lands just
    # outside the cavity meant to hold it.
    NUT_Y = ("Params.yoke_arm_y - Params.yoke_wall / 2"
             " + Params.nut_trap_extra + Params.horn_pocket_depth")

    def nut_y(name):
        return NUT_Y
    made = []
    for nm, ex in (("Ahead", "+ Params.servo_hole_ahead"),
                   ("Behind", "- Params.servo_hole_behind")):
        for sz, zex in (("U", "+"), ("D", "-")):
            made.append(screw(
                doc, "FS_Servo%s%s" % (nm, sz), SOCKET_CAP, "M3",
                length_expr="Params.servo_screw_len",
                pos=("Params.motor_arm %s" % ex, head_y,
                     "Params.yoke_axis_z %s Params.servo_hole_dz" % zex),
                rot=rot))
            made.append(screw(
                doc, "FS_ServoNut%s%s" % (nm, sz), HEX_NUT, "M3",
                pos=("Params.motor_arm %s" % ex, nut_y(nm),
                     "Params.yoke_axis_z %s Params.servo_hole_dz" % zex),
                rot=rot))
    return made


def motor_joint(doc):
    """The four screws holding the motor down onto the yoke.

    They enter from the pocket below and thread up into the motor, so they are
    inverted relative to the fastener's default orientation. Seat plane is the
    countersink face -- the top of the chamfer, where the cone actually lands.
    """
    holes = [("Xp", "Params.motor_arm + Params.motor_bolt_x / 2", "0"),
             ("Xn", "Params.motor_arm - Params.motor_bolt_x / 2", "0"),
             ("Yp", "Params.motor_arm", "Params.motor_bolt_y / 2"),
             ("Yn", "Params.motor_arm", "-Params.motor_bolt_y / 2")]
    # With the chamfer sized to the head, the head's face lands flush with the
    # pocket floor, so that IS the seat plane.
    seat = "Params.yoke_top_z - Params.motor_plate_thk"
    made = []
    for tag, hx, hy in holes:
        made.append(screw(doc, "FS_Motor%s" % tag, COUNTERSUNK, "M3",
                          length_expr="Params.motor_screw_len",
                          pos=(hx, hy, seat),
                          rot=App.Rotation(App.Vector(1, 0, 0), 180)))
    return made
