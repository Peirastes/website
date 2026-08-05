"""Set up a detail view: hide chosen parts, frame the camera on a sub-assembly.

The full-rig view is dominated by a 400 mm beam and a 255 mm prop, so anything
happening around the servo axis is a few pixels across. This hides what is in
the way and reframes on just the parts of interest.

Does NOT rebuild geometry -- it only changes visibility and the camera, then
rewrites GuiDocument.xml. Re-run run_build.py to get the whole rig back.

Run via run_focus.py.
"""
import os
import sys

import FreeCAD as App

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import inject_gui  # noqa: E402

DOC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")

# what to get out of the way
HIDE = ["Motor", "Prop"]
# what to frame on
FOCUS = ["Servo", "Horn", "HornHub", "MotorYoke", "ServoYokeBracket"]
MARGIN = 1.35        # how much room around the focus group


def main():
    doc = App.openDocument(DOC)

    for n in HIDE:
        o = doc.getObject(n)
        if o is not None and hasattr(o, "Visibility"):
            o.Visibility = False

    lo = [1e9] * 3
    hi = [-1e9] * 3
    found = []
    for n in FOCUS:
        o = doc.getObject(n)
        if o is None or not hasattr(o, "Shape") or not o.Shape.Faces:
            continue
        found.append(n)
        bb = o.Shape.BoundBox
        lo = [min(lo[0], bb.XMin), min(lo[1], bb.YMin), min(lo[2], bb.ZMin)]
        hi = [max(hi[0], bb.XMax), max(hi[1], bb.YMax), max(hi[2], bb.ZMax)]
    if not found:
        raise RuntimeError("none of the focus objects exist: %s" % FOCUS)

    centre = tuple((lo[i] + hi[i]) / 2.0 for i in range(3))
    radius = max(hi[i] - lo[i] for i in range(3)) / 2.0 * MARGIN

    doc.save()
    print("hidden : %s" % ", ".join(HIDE))
    print("framed : %s" % ", ".join(found))
    print("centre : %.1f %.1f %.1f   radius %.1f" % (centre + (radius,)))
    App.closeDocument(doc.Name)

    inject_gui.main(centre, radius)
