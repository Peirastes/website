"""Servo-mount coupon -- print this BEFORE ServoYokeBracket (86 cm3).

Same idea as the bolt-pattern coupon that caught the cross-vs-rectangle error:
a small plate carrying only the features that have to match a real part, so a
wrong guess costs ten minutes instead of eighty grams.

It replicates the +Y arm's servo face: the two tab holes at their asymmetric
offsets from the shaft axis, and the hub clearance bore. Everything is read
from the live Params sheet, so the coupon cannot drift from the bracket.

The MG996R's shaft is NOT centred between its tabs -- that asymmetry is the
main thing to verify, and it is easy to get backwards.

Run via run_servo_coupon.py.
"""
import json
import os

import FreeCAD as App
import Mesh
import Part  # noqa: F401

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")
STL = os.path.join(HERE, "stl", "TEST_ServoMountCoupon.stl")
JSN = os.path.join(HERE, "stl", "servo_coupon.json")

THK = 4.0        # thinner than the real arm; only the hole pattern is on test
MARGIN = 9.0     # material around the outermost feature


def main():
    src = App.openDocument(SRC)
    sh = src.Params
    p = {a: float(getattr(sh, a)) for a in
         ("servo_hole_ahead", "servo_hole_behind", "servo_hole_dz",
          "servo_hole_d", "servo_case_x0", "servo_case_x1",
          "servo_case_h", "yoke_wall")}
    App.closeDocument(src.Name)

    near, far = p["servo_hole_ahead"], p["servo_hole_behind"]
    dz = p["servo_hole_dz"]
    L = near + far + 2 * MARGIN
    H = max(p["servo_case_h"], 2 * dz + p["servo_hole_d"]) + 2 * MARGIN
    x0 = -far - MARGIN                       # shaft axis sits at x = 0

    doc = App.newDocument("ServoMountCoupon")
    solid = Part.makeBox(L, THK, H, App.Vector(x0, 0, -H / 2))
    # the servo case window -- a rectangle, not a bore: the tabs sit ~10 mm
    # below the top of the case so the gearbox housing passes through
    solid = solid.cut(Part.makeBox(
        p["servo_case_x1"] - p["servo_case_x0"], THK + 2, p["servo_case_h"],
        App.Vector(p["servo_case_x0"], -1, -p["servo_case_h"] / 2)))
    # FOUR tab holes: a pair on each tab, dz above and below the shaft axis
    for x in (near, -far):
        for z in (dz, -dz):
            solid = solid.cut(Part.makeCylinder(
                p["servo_hole_d"] / 2, THK + 2, App.Vector(x, -1, z),
                App.Vector(0, 1, 0)))
    # a notch marking the +X (near-hole) side, so it cannot be fitted mirrored
    solid = solid.cut(Part.makeBox(
        6, THK + 2, 3, App.Vector(x0 + L - 6, -1, H / 2 - 3)))

    obj = doc.addObject("Part::Feature", "ServoMountCoupon")
    obj.Shape = solid
    doc.recompute()
    if len(solid.Solids) != 1 or not solid.isValid():
        raise RuntimeError("coupon is not a single valid solid")

    Mesh.export([obj], STL)
    with open(JSN, "w") as fh:
        json.dump(dict(p, L=L, H=H, THK=THK, x0=x0), fh, indent=1)

    print("SERVO COUPON  %.1f x %.1f x %.1f mm   %.1f cm3" % (L, H, THK, solid.Volume / 1000))
    print("  tab holes at  x %+.2f / %+.2f   z %+.2f / %+.2f   (span %.1f x %.1f)"
          % (near, -far, dz, -dz, near + far, 2 * dz))
    print("  tab holes     %.1f dia" % p["servo_hole_d"])
    print("  case window   %.1f x %.1f" % (p["servo_case_x1"] - p["servo_case_x0"], p["servo_case_h"]))
    print("  notch marks the NEAR-hole side (+X)")
    print("\n  -> %s" % STL)
    print("\nPattern is MEASURED off Cole's mg996R_v2.FCStd. Only servo_hub_d is")
    print("still a guess -- it is the bore the horn hub has to pass through.")
    App.closeDocument(doc.Name)
