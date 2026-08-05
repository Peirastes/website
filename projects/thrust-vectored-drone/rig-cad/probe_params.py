"""Probe: verify the parametric mechanisms before building the real assembly.

Checks, in order:
  1. Spreadsheet aliases + expression binding on primitive dimensions
  2. Expression binding on Placement.Base.{x,y,z}
  3. A static rotation survives alongside Base expressions (bores along Y)
  4. A boolean Cut recomputes correctly when a driving cell changes

Run with freecadcmd via run_probe.py (freecadcmd sets __name__ to the script
stem, not "__main__", so the entry point must be an explicit main()).
"""
import os

import FreeCAD as App
import Part  # noqa: F401  (registers Part:: object types)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_probe.FCStd")


def main():
    doc = App.newDocument("probe")

    sh = doc.addObject("Spreadsheet::Sheet", "Params")
    sh.set("A1", "beam_len")
    sh.set("B1", "400")
    sh.setAlias("B1", "beam_len")
    sh.set("A2", "bore_d")
    sh.set("B2", "5")
    sh.setAlias("B2", "bore_d")
    sh.set("A3", "derived_half")
    sh.set("B3", "=beam_len / 2")          # spreadsheet-internal formula
    sh.setAlias("B3", "derived_half")
    doc.recompute()

    print("1. aliases:      beam_len=%s derived_half=%s" % (sh.beam_len, sh.derived_half))
    assert abs(float(sh.derived_half) - 200.0) < 1e-9

    # --- 2/3. box with expression dims + expression placement --------------
    box = doc.addObject("Part::Box", "Beam")
    box.setExpression("Length", "Params.beam_len")
    box.setExpression("Width", "20")
    box.setExpression("Height", "20")
    box.setExpression("Placement.Base.x", "-Params.derived_half")
    doc.recompute()
    bb = box.Shape.BoundBox
    print("2. box X span:   %.2f .. %.2f  (expect -200..200)" % (bb.XMin, bb.XMax))
    assert abs(bb.XMin + 200) < 1e-6 and abs(bb.XMax - 200) < 1e-6

    # --- 3. cylinder rotated to lie along Y, base still expression-driven --
    cyl = doc.addObject("Part::Cylinder", "Bore")
    # rotation FIRST (static -- orientation never varies with parameters)
    cyl.Placement = App.Placement(
        App.Vector(0, 0, 0), App.Rotation(App.Vector(1, 0, 0), -90))
    # then bind the base coordinates by expression
    cyl.setExpression("Radius", "Params.bore_d / 2")
    cyl.setExpression("Height", "60")
    cyl.setExpression("Placement.Base.y", "-30")
    doc.recompute()
    cb = cyl.Shape.BoundBox
    print("3. bore Y span:  %.2f .. %.2f  (expect -30..30)" % (cb.YMin, cb.YMax))
    print("   bore rot:     axis=%s angle=%.1f" % (cyl.Placement.Rotation.Axis, cyl.Placement.Rotation.Angle * 57.2957795))
    assert abs(cb.YMin + 30) < 1e-6 and abs(cb.YMax - 30) < 1e-6, "rotation lost"
    assert abs(cb.XMax - 2.5) < 1e-6, "radius expression lost"

    # --- 4. boolean that must track a cell change --------------------------
    cut = doc.addObject("Part::Cut", "BeamCut")
    cut.Base = box
    cut.Tool = cyl
    doc.recompute()
    v0 = cut.Shape.Volume
    print("4. cut volume:   %.1f mm^3" % v0)

    sh.set("B1", "300")
    sh.set("B2", "8")
    doc.recompute()
    v1 = cut.Shape.Volume
    nb = cut.Shape.BoundBox
    print("   after edit:   X span %.2f .. %.2f, volume %.1f" % (nb.XMin, nb.XMax, v1))
    assert abs(nb.XMin + 150) < 1e-6 and abs(nb.XMax - 150) < 1e-6, "cut did not follow"
    assert v1 < v0, "volume should shrink"

    doc.saveAs(OUT)
    print("\nALL PROBE CHECKS PASSED -> %s" % OUT)
    App.closeDocument(doc.Name)
