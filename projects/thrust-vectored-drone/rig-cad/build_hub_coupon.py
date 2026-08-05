"""Hub bore coupon -- the one PivotHub feature no printed part has tested.

Everything else on the hub is either coupon-validated (the arm sockets, via
TEST_SocketCoupon) or an ordinary clearance hole. The shaft bore is neither: it
is a 0.05 mm INTERFERENCE over 30 mm of depth, and the dimension was only
corrected today (beam_bore_d was missing print_hole, which turned a 0.05 press
into 0.25 -- enough to split the hub).

0.05 is inside print-to-print variation, so this is a fit that has to be
measured rather than predicted. The coupon is the real hub cross-section at the
real bore depth, so the press force is representative, at about a quarter of
the part.

Risk is asymmetric and that is why this is worth ten minutes:
  * too LOOSE  -> recoverable, that is what Hub_ShaftLock is for
  * too TIGHT  -> found out mid-assembly, with a steel rod half-driven into a
                  59 cm3 print that is then scrap

Run via run_hub_coupon.py.
"""
import json
import os

import FreeCAD as App
import Mesh
import Part  # noqa: F401

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")
STL = os.path.join(HERE, "stl", "TEST_HubBoreCoupon.stl")
JSN = os.path.join(HERE, "stl", "hub_coupon.json")

LEN_X = 20.0     # short section of hub; the BORE is what is on test


def main():
    src = App.openDocument(SRC)
    sh = src.Params
    p = {a: float(getattr(sh, a)) for a in
         ("hub_wid", "hub_thk", "beam_bore_d", "shaft_d", "print_hole",
          "shaft_lock_d", "fit_press")}
    App.closeDocument(src.Name)

    doc = App.newDocument("HubBoreCoupon")
    solid = Part.makeBox(LEN_X, p["hub_wid"], p["hub_thk"],
                         App.Vector(-LEN_X / 2, -p["hub_wid"] / 2,
                                    -p["hub_thk"] / 2))
    # the bore, at FULL hub depth so the press force is representative
    solid = solid.cut(Part.makeCylinder(
        p["beam_bore_d"] / 2, p["hub_wid"] + 2,
        App.Vector(0, -p["hub_wid"] / 2 - 1, 0), App.Vector(0, 1, 0)))
    # the lock screw, so the M3 self-tap gets tested too
    solid = solid.cut(Part.makeCylinder(
        p["shaft_lock_d"] / 2, p["hub_thk"] / 2 - p["beam_bore_d"] / 2 + 2,
        App.Vector(0, 0, p["beam_bore_d"] / 2 - 1)))

    obj = doc.addObject("Part::Feature", "HubBoreCoupon")
    obj.Shape = solid
    doc.recompute()
    if len(solid.Solids) != 1 or not solid.isValid():
        raise RuntimeError("coupon is not a single valid solid")

    Mesh.export([obj], STL)
    with open(JSN, "w") as fh:
        json.dump(dict(p, LEN_X=LEN_X), fh, indent=1)

    printed = p["beam_bore_d"] - p["print_hole"]
    print("HUB BORE COUPON  %.0f x %.0f x %.0f mm   %.1f cm3"
          % (LEN_X, p["hub_wid"], p["hub_thk"], solid.Volume / 1000))
    print("  bore     %.2f nominal -> %.2f predicted -> %+.2f on a %.2f rod"
          % (p["beam_bore_d"], printed, printed - p["shaft_d"], p["shaft_d"]))
    print("  depth    %.0f mm, the same as the real hub" % p["hub_wid"])
    print("  lock     %.1f dia, M3 self-tap" % p["shaft_lock_d"])
    print("")
    print("WHAT TO LOOK FOR")
    print("  The rod should need firm hand pressure or a light tap -- not a")
    print("  vice, and not a slide. Then:")
    print("    slides in freely   -> raise fit_press (bore is over-large)")
    print("    will not start     -> lower fit_press; do NOT force it")
    print("    firm push / tap    -> correct, print the hub")
    print("  Measure the bore with calipers or a 5 mm drill shank either way,")
    print("  and tell me the number rather than the verdict -- fit_press is")
    print("  one cell and the hub follows it.")
    print("\n  -> %s" % STL)
    App.closeDocument(doc.Name)
