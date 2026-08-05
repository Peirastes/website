"""Socket coupon -- test the hub/arm joint fit before printing the real parts.

The arm-into-hub socket is the riskiest fit in the rig: 0.10 mm design
clearance, which is below the printer's noise floor, and the parts it gates are
big (two 188 mm arms plus a 59 cm3 hub). It is also the fit that decides how
much arm angle the encoder cannot see, so it can't simply be opened up.

This prints a short section of each, as a mating pair:
  * SOCKET  -- a slice of PivotHub carrying the real cavity
  * TONGUE  -- a stub of arm at its real section

Both come from the live Params sheet, so they test the compensation values
(print_outside / print_hole) that are currently 0.39 measured and 0.20 assumed.
One M3 hole through both checks that the joint bolts line up when seated.

Run via run_socket_coupon.py.
"""
import json
import os

import FreeCAD as App
import Mesh
import Part  # noqa: F401

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")
STL = os.path.join(HERE, "stl", "TEST_SocketCoupon.stl")
JSN = os.path.join(HERE, "stl", "socket_coupon.json")

DEPTH = 18.0      # cavity depth -- enough to feel the fit, not the full 43
PROUD = 12.0      # tongue sticking out, to grip while fitting
BOLT_IN = 9.0     # bolt axis, measured from the seated tongue tip
GAP = 6.0         # spacing between the two pieces on the bed


def main():
    src = App.openDocument(SRC)
    sh = src.Params
    p = {a: float(getattr(sh, a)) for a in
         ("hub_wid", "hub_thk", "beam_wid", "beam_thk", "socket_w", "socket_h",
          "joint_clear", "m3_clear", "print_flat", "print_hole",
          "idler_bore_d")}
    App.closeDocument(src.Name)

    doc = App.newDocument("SocketCoupon")
    sw, shh = p["socket_w"], p["socket_h"]
    hw, ht = p["hub_wid"], p["hub_thk"]
    bw, bt = p["beam_wid"], p["beam_thk"]
    wall = 3.0
    slen = DEPTH + wall

    # --- socket: a slice of the hub, cavity open toward +X ------------------
    sock = Part.makeBox(slen, hw, ht, App.Vector(0, -hw / 2, 0))
    sock = sock.cut(Part.makeBox(DEPTH + 1, sw, shh,
                                 App.Vector(wall, -sw / 2, (ht - shh) / 2)))
    sock = sock.cut(Part.makeCylinder(
        p["m3_clear"] / 2, ht + 2,
        App.Vector(wall + BOLT_IN, 0, -1)))

    # --- tongue: a stub of arm, seated end at x = 0 -------------------------
    tl = DEPTH + PROUD
    tong = Part.makeBox(tl, bw, bt, App.Vector(0, -bw / 2, 0))
    tong = tong.cut(Part.makeCylinder(
        p["m3_clear"] / 2, bt + 2, App.Vector(BOLT_IN, 0, -1)))
    tong.translate(App.Vector(0, hw / 2 + bw / 2 + GAP, 0))

    # --- third piece: a bore gauge for the yoke's idler stub ---------------
    # Round, not rectangular -- a different joint from the socket, but it rides
    # along in the same print and the stub already exists to test it with.
    ib = p["idler_bore_d"]
    gw = ib + 2 * 4.0
    gauge = Part.makeBox(gw, gw, 10.0, App.Vector(0, 0, 0))
    gauge = gauge.cut(Part.makeCylinder(ib / 2, 12, App.Vector(gw / 2, gw / 2, -1)))
    gauge.translate(App.Vector(0, -hw / 2 - GAP - gw, 0))

    both = Part.makeCompound([sock, tong, gauge])
    obj = doc.addObject("Part::Feature", "SocketCoupon")
    obj.Shape = both
    doc.recompute()
    if len(both.Solids) != 3:
        raise RuntimeError("expected three solids, got %d" % len(both.Solids))

    Mesh.export([obj], STL)
    with open(JSN, "w") as fh:
        json.dump(dict(p, depth=DEPTH, proud=PROUD, bolt_in=BOLT_IN), fh, indent=1)

    fit = (sw - p["print_hole"]) - (bw + p["print_flat"])
    print("SOCKET COUPON   %.1f cm3   (socket %.0f long, tongue %.0f)"
          % (both.Volume / 1000, slen, tl))
    print("  socket cavity   %.2f x %.2f  (model)" % (sw, shh))
    print("  arm section     %.2f x %.2f  (model)" % (bw, bt))
    print("  predicted AS-PRINTED gap  %.2f mm per axis" % fit)
    print("    cavity prints %.2f, tongue prints %.2f"
          % (sw - p["print_hole"], bw + p["print_flat"]))
    print("\n  -> %s" % STL)
    print("\nIf it binds: raise print_hole. If it rattles: lower print_hole.")
    print("Either way the fix is one cell and only the socket needs reprinting.")
    App.closeDocument(doc.Name)
