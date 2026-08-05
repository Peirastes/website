"""Arm coupon -- the saddle bolt pattern, printed before Arm_Motor (59.3 cm3).

The frontier right now is bracket -> arm: ServoYokeBracket is on the printer and
Arm_Motor is the next part outward. Both patterns come from the same
yoke_base_xc / yoke_bolt_dx cells, so they cannot disagree in the MODEL -- but
nothing has yet checked that an M5 actually passes through both real parts, or
that the heads and nuts have somewhere to sit.

This is a short section of the real beam, full 20 x 16 section, carrying only
the saddle holes. If it bolts to the bracket, the arm is safe to print.

Two bolts on the centreline, not four: the saddle resists a moment about Y,
which X-spacing carries, and the clamped flat already handles ~30x the
gyroscopic roll a Y pair would add. On the centreline an M5 has 7.25 mm of beam
each side instead of the 2.25 the four-bolt version left.

Run via run_arm_coupon.py.
"""
import json
import os

import FreeCAD as App
import Mesh
import Part  # noqa: F401

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")
STL = os.path.join(HERE, "stl", "TEST_ArmSaddleCoupon.stl")
JSN = os.path.join(HERE, "stl", "arm_coupon.json")

MARGIN = 10.0        # beam beyond the outermost bolt


def main():
    src = App.openDocument(SRC)
    sh = src.Params
    p = {a: float(getattr(sh, a)) for a in
         ("beam_wid", "beam_thk", "m5_clear", "yoke_bolt_dx",
          "nut_m5_af", "nut_m5_thk", "saddle_bolt_len", "yoke_base_thk")}
    App.closeDocument(src.Name)

    L = 2 * p["yoke_bolt_dx"] + 2 * MARGIN
    doc = App.newDocument("ArmSaddleCoupon")
    # full beam section, so head and nut clearance are the REAL clearances
    solid = Part.makeBox(L, p["beam_wid"], p["beam_thk"],
                         App.Vector(-L / 2, -p["beam_wid"] / 2, 0))
    for sx in (1, -1):
        solid = solid.cut(Part.makeCylinder(
            p["m5_clear"] / 2, p["beam_thk"] + 2,
            App.Vector(sx * p["yoke_bolt_dx"], 0.0, -1)))
    # a notch on +X so the coupon cannot be offered up reversed
    solid = solid.cut(Part.makeBox(
        5, 3, p["beam_thk"] + 2,
        App.Vector(L / 2 - 5, p["beam_wid"] / 2 - 3, -1)))

    obj = doc.addObject("Part::Feature", "ArmSaddleCoupon")
    obj.Shape = solid
    doc.recompute()
    if len(solid.Solids) != 1 or not solid.isValid():
        raise RuntimeError("coupon is not a single valid solid")

    Mesh.export([obj], STL)
    with open(JSN, "w") as fh:
        json.dump(dict(p, L=L), fh, indent=1)

    edge = p["beam_wid"] / 2 - p["m5_clear"] / 2
    head_edge = p["beam_wid"] / 2 - 8.5 / 2
    print("ARM SADDLE COUPON  %.1f x %.1f x %.1f mm   %.1f cm3"
          % (L, p["beam_wid"], p["beam_thk"], solid.Volume / 1000))
    print("  bolts at  x +/-%.1f   on the centreline   %.1f dia"
          % (p["yoke_bolt_dx"], p["m5_clear"]))
    print("  beam outboard of the hole   %.2f mm" % edge)
    print("  beam outboard of the head   %.2f mm  (M5 cap 8.5)" % head_edge)
    print("  stack the bolt must cross   %.1f mm  (saddle %.1f + beam %.1f)"
          % (p["yoke_base_thk"] + p["beam_thk"], p["yoke_base_thk"], p["beam_thk"]))
    print("  notch marks +X")
    print("\n  -> %s" % STL)
    App.closeDocument(doc.Name)
