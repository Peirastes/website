"""Drill guide for opening the horn's punchouts to M2 -- no drill press needed.

A hand-held twist drill in nylon wanders and grabs. This is a bushing plate:
it locates on the horn's own centre boss, and its 2.1 mm holes are a close fit
on a 2.0 mm drill, so the bit cannot walk off the punchout or lean over.

Thick enough (guide_thk) that the hole guides the drill's ANGLE, which is the
part you cannot judge by eye without a press.

Rotational alignment is by eye against the punchout marks -- they are already
at the right radius, so the guide only has to hold centre and perpendicularity.

Run via run_horn_guide.py.
"""
import json
import os

import FreeCAD as App
import Mesh
import Part  # noqa: F401

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")
STL = os.path.join(HERE, "stl", "TEST_HornDrillGuide.stl")

GUIDE_THK = 8.0      # bushing depth -- what keeps the drill square
DRILL_D = 2.1        # close fit on a 2.0 mm bit
LOCATE_CLEAR = 0.15  # snug over the horn's boss
RIM = 5.0            # material outside the bolt circle


def main():
    src = App.openDocument(SRC)
    sh = src.Params
    r = float(sh.horn_bolt_r)
    dx = float(sh.horn_bolt_dx)
    dz = float(sh.horn_bolt_dz)
    rot = float(sh.horn_bolt_rot)
    boss = float(sh.horn_boss_d)
    App.closeDocument(src.Name)

    od = 2 * (r + RIM)
    doc = App.newDocument("HornDrillGuide")
    g = Part.makeCylinder(od / 2, GUIDE_THK, App.Vector(0, 0, 0))
    # locating counterbore -- drops over the horn's raised centre boss
    g = g.cut(Part.makeCylinder((boss + LOCATE_CLEAR) / 2, 2.0,
                                App.Vector(0, 0, -0.01)))
    # clear the spline bore area right through, so you can see you are centred
    g = g.cut(Part.makeCylinder(3.0, GUIDE_THK + 2, App.Vector(0, 0, -1)))
    # CLOCKED to match the yoke -- holes are no longer on the spoke axes
    for x, y in ((dx, dz), (dx, -dz), (-dx, dz), (-dx, -dz)):
        g = g.cut(Part.makeCylinder(DRILL_D / 2, GUIDE_THK + 2,
                                    App.Vector(x, y, -1)))
    # flat on one side so it cannot roll off the bench, and marks a spoke axis
    g = g.cut(Part.makeBox(od, 3.0, GUIDE_THK + 2,
                           App.Vector(-od / 2, od / 2 - 3.0, -1)))

    obj = doc.addObject("Part::Feature", "HornDrillGuide")
    obj.Shape = g
    doc.recompute()
    if len(g.Solids) != 1 or not g.isValid():
        raise RuntimeError("guide is not a single valid solid")
    Mesh.export([obj], STL)

    print("HORN DRILL GUIDE  %.1f dia x %.1f thick   %.1f cm3"
          % (od, GUIDE_THK, g.Volume / 1000))
    print("  bolt circle    r = %.1f, clocked %.1f deg  (dx %.3f dz %.3f)"
          % (r, rot, dx, dz))
    print("  drill holes    %.1f dia  -- use a 2.0 mm bit" % DRILL_D)
    print("  locating bore  %.1f dia over the horn's %.1f boss"
          % (boss + LOCATE_CLEAR, boss))
    print("  flat edge marks the +X axis -- spokes sit %.1f deg off it" % rot)
    print("\n  -> %s" % STL)
    App.closeDocument(doc.Name)
