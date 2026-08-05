"""Bolt-pattern test coupon -- print this BEFORE the real yoke.

It is a truncated section of MotorYoke's top: same plate thickness, same
hollowed pocket, same four M3 holes, same central boss clearance. So it tests
the two things that would turn a full yoke print into scrap:

  1. does the motor's bolt pattern actually line up?
  2. do the screw HEADS clear the pocket walls?

Dimensions are read from the live model's Params sheet, so the coupon cannot
drift from the part it is standing in for. Correct the sheet after measuring
and re-run to get a second coupon.

Run via run_coupon.py.
"""
import json
import os

import FreeCAD as App
import Mesh
import Part  # noqa: F401

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")
STL = os.path.join(HERE, "stl", "TEST_BoltPatternCoupon.stl")
JSN = os.path.join(HERE, "stl", "coupon.json")

POCKET_DEPTH = 5.0   # deep enough to seat a screw head and prove the walls clear


def main():
    src = App.openDocument(SRC)
    sh = src.Params
    p = {a: float(getattr(sh, a)) for a in
         ("yoke_body_l", "yoke_inner", "fit_clear", "motor_wall",
          "motor_bolt_x", "motor_bolt_y", "motor_bolt_d", "motor_boss_d",
          "motor_plate_thk", "screw_head_d")}
    App.closeDocument(src.Name)

    L = p["yoke_body_l"]
    W = p["yoke_inner"] - 2 * p["fit_clear"]
    H = p["motor_plate_thk"] + POCKET_DEPTH
    px = L - 2 * p["motor_wall"]
    py = W - 2 * p["motor_wall"]

    doc = App.newDocument("BoltPatternCoupon")
    solid = Part.makeBox(L, W, H, App.Vector(-L / 2, -W / 2, 0))
    # pocket, open downward, exactly as the yoke is hollowed
    solid = solid.cut(Part.makeBox(px, py, POCKET_DEPTH + 1,
                                   App.Vector(-px / 2, -py / 2, -1)))
    # central clearance for whatever protrudes from the motor's underside
    solid = solid.cut(Part.makeCylinder(p["motor_boss_d"] / 2, H + 2,
                                        App.Vector(0, 0, -1)))
    # CROSS pattern, matching the motor: one pair on X, one pair on Y
    for x, y in ((p["motor_bolt_x"] / 2, 0), (-p["motor_bolt_x"] / 2, 0),
                 (0, p["motor_bolt_y"] / 2), (0, -p["motor_bolt_y"] / 2)):
        solid = solid.cut(Part.makeCylinder(
            p["motor_bolt_d"] / 2, H + 2, App.Vector(x, y, -1)))

    obj = doc.addObject("Part::Feature", "BoltPatternCoupon")
    obj.Shape = solid
    doc.recompute()

    if len(solid.Solids) != 1 or not solid.isValid():
        raise RuntimeError("coupon is not a single valid solid")

    Mesh.export([obj], STL)
    # dump what was actually built so the drawing cannot drift from it
    with open(JSN, "w") as fh:
        json.dump(dict(p, L=L, W=W, H=H, px=px, py=py,
                       pocket_depth=POCKET_DEPTH), fh, indent=1)
    print("COUPON  %.1f x %.1f x %.1f mm   %.1f cm3" % (L, W, H, solid.Volume / 1000))
    print("  bolt pattern   CROSS: %.1f on X, %.1f on Y, holes %.1f dia"
          % (p["motor_bolt_x"], p["motor_bolt_y"], p["motor_bolt_d"]))
    print("  boss clearance %.1f dia" % p["motor_boss_d"])
    print("  plate          %.1f mm under the motor" % p["motor_plate_thk"])
    print("  head clearance %+.2f (X) %+.2f (Y) for a %.1f mm head"
          % (px / 2 - (p["motor_bolt_x"] + p["screw_head_d"]) / 2,
             py / 2 - (p["motor_bolt_y"] + p["screw_head_d"]) / 2,
             p["screw_head_d"]))
    print("\n  -> %s" % STL)
    print("\nIf it does not fit: measure the real pattern, edit motor_bolt_x /"
          "\nmotor_bolt_y (and motor_boss_d) in Params, re-run run_coupon.py.")
    App.closeDocument(doc.Name)
