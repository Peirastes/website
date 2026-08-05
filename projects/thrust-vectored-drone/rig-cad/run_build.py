import os
import sys

# Stale .pyc bit us: Python's source-mtime check is 1-second granular, so an
# edit in the same second as the previous run reuses old bytecode.
sys.dont_write_bytecode = True

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import build_rig
import inject_gui

doc = build_rig.main()

# Frame the camera on what is actually VISIBLE -- the construction geometry is
# no bigger, but framing on everything would still be the wrong instinct.
lo = [1e9, 1e9, 1e9]
hi = [-1e9, -1e9, -1e9]
for o in doc.Objects:
    if not getattr(o, "Visibility", False) or not hasattr(o, "Shape"):
        continue
    if not o.Shape.Faces:
        continue
    bb = o.Shape.BoundBox
    lo = [min(lo[0], bb.XMin), min(lo[1], bb.YMin), min(lo[2], bb.ZMin)]
    hi = [max(hi[0], bb.XMax), max(hi[1], bb.YMax), max(hi[2], bb.ZMax)]
centre = tuple((lo[i] + hi[i]) / 2.0 for i in range(3))
radius = max(hi[i] - lo[i] for i in range(3)) / 2.0

# freecadcmd never writes GuiDocument.xml, so without this the model opens with
# FreeCAD's invented view defaults and the build's visibility never shows.
inject_gui.main(centre, radius)
