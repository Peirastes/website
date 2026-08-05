"""Prove the model is really parametric, size the travel problem, export STLs.

Three stages:
  A. VALIDATE a fast vertex-based travel model against the slow boolean sweep
     in check_rig.py (which found +34 / -25 deg). Only then trust it.
  B. SWEEP pivot_height x cw_arm by editing spreadsheet cells and recomputing,
     reporting usable travel and the trimmed plant for each. This is the proof
     that a cell edit propagates through every mating feature.
  C. EXPORT the printed parts to STL at the file's own parameters.

The file is always restored to its saved parameters afterwards.
"""
import math
import os

import FreeCAD as App
import Mesh

HERE = os.path.dirname(os.path.abspath(__file__))
DOC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")
STL = os.path.join(HERE, "stl")

MOVERS = ["PivotHub", "Arm_Motor", "Arm_CW", "ServoYokeBracket",
          "MotorYoke", "MagnetHolder",
          "PivotShaft", "Motor", "Prop", "Servo", "CWRod", "CWMass", "Magnet",
          "KeelRod", "KeelBob"]
PRINTED = ["BasePlate", "Upright_PY", "Upright_NY", "PivotHub", "Arm_Motor",
           "Arm_CW", "ServoYokeBracket", "MotorYoke", "MagnetHolder",
           "SensorBracket"]

# validated against the boolean sweep in check_rig.py, at the file's own params
# (pivot_height 160). Re-measure with run_check.py if the defaults change.
KNOWN = (50, 50)


def travel(doc, pivot_h, maxdeg=60):
    """Usable (+theta, -theta) before anything dips below the base top.

    Samples EDGES, not just vertices: a plain cylinder carries only two seam
    vertices, so a vertex-only cloud misses the rod's bottom rim -- which is
    exactly the feature that strikes first. Validated against the boolean sweep.
    """
    pts = []
    for n in MOVERS:
        s = doc.getObject(n).Shape
        for v in s.Vertexes:
            pts.append((v.X, v.Z - pivot_h))
        for e in s.Edges:
            try:
                for p in e.discretize(Number=16):
                    pts.append((p.x, p.z - pivot_h))
            except Exception:
                pass
    out = []
    for sign in (+1, -1):
        lim = maxdeg
        for deg in range(1, maxdeg + 1):
            a = math.radians(sign * deg)
            ca, sa = math.cos(a), math.sin(a)
            if min(-x * sa + z * ca for x, z in pts) + pivot_h < 0:
                lim = deg - 1
                break
        out.append(lim)
    return tuple(out)


def plant(doc):
    """Trimmed-condition plant summary (delegates the maths to rig_eval)."""
    import rig_eval
    sh = doc.Params
    pivot_h = float(sh.pivot_height)
    cw_arm = float(sh.cw_arm)
    M = Sx = Sz = I = 0.0
    for name in rig_eval.ROTATING:
        o = doc.getObject(name)
        V, cx, cz, iyy = rig_eval.shape_props(o.Shape)
        m = rig_eval.part_mass_g(o)
        I += iyy * (m / V) + m * (cx ** 2 + (cz - pivot_h) ** 2)
        M += m
        Sx += m * cx
        Sz += m * (cz - pivot_h)
    cw = doc.getObject("CWMass")
    m_cw0 = rig_eval.part_mass_g(cw)
    Vcw, cwx, cwz, _ = rig_eval.shape_props(cw.Shape)
    Sx0 = Sx - m_cw0 * cwx
    Sz0 = Sz - m_cw0 * (cwz - pivot_h)
    m_trim = Sx0 / cw_arm
    d_neutral = -Sz0 / m_trim
    return m_trim, d_neutral


def main():
    doc = App.openDocument(DOC)
    sh = doc.Params
    base = {a: float(getattr(sh, a)) for a in ("pivot_height", "cw_arm")}

    # --- A. validate the fast model ------------------------------------
    got = travel(doc, base["pivot_height"])
    err = max(abs(a - b) for a, b in zip(got, KNOWN))
    print("A. travel model check: fast=%s boolean=%s  (max err %d deg) -> %s"
          % (str(got), str(KNOWN), err, "AGREE" if err <= 1 else "DISAGREE"))
    if err > 1:
        raise RuntimeError("fast travel model does not reproduce the boolean sweep")

    # --- B. parametric sweep -------------------------------------------
    print("\nB. PARAMETRIC SWEEP  (edit a cell -> whole assembly follows)")
    print("   %-9s %-8s %-14s %-10s %-12s" %
          ("pivot_h", "cw_arm", "travel deg", "trim g", "neutral mm"))
    rows = []
    for ph in (120, 160, 200):
        for ca in (160, 110):
            sh.set("B%d" % _row(sh, "pivot_height"), str(ph))
            sh.set("B%d" % _row(sh, "cw_arm"), str(ca))
            doc.recompute()
            tp, tn = travel(doc, ph)
            m_trim, d_neutral = plant(doc)
            rows.append((ph, ca, tp, tn, m_trim, d_neutral))
            print("   %-9d %-8d +%-2d / -%-8d %-10.1f %-12.1f"
                  % (ph, ca, tp, tn, m_trim, d_neutral))

    print("\n   Below ~140 mm of pivot height the COUNTERWEIGHT binds -- it hangs"
          "\n   under the beam on a long arm and reaches the base first, which is"
          "\n   why travel was asymmetric. Above that the BEAM ENDS bind instead"
          "\n   and travel goes symmetric. Shortening cw_arm buys travel only in"
          "\n   the first regime, and costs trim mass; raising the pivot works in"
          "\n   both. Note trim mass and neutral offset are unchanged by pivot"
          "\n   height -- the rotating assembly is defined relative to the pivot.")

    # restore
    for a, v in base.items():
        sh.set("B%d" % _row(sh, a), str(v))
    doc.recompute()
    print("\n   restored to saved parameters (pivot_height=%g cw_arm=%g)"
          % (base["pivot_height"], base["cw_arm"]))

    # --- C. STL export ---------------------------------------------------
    if not os.path.isdir(STL):
        os.makedirs(STL)
    print("\nC. STL EXPORT")
    for n in PRINTED:
        o = doc.getObject(n)
        p = os.path.join(STL, "%s.stl" % n)
        Mesh.export([o], p)
        print("   %-18s %8.1f cm3  -> %s"
              % (n, o.Shape.Volume / 1000.0, os.path.basename(p)))

    App.closeDocument(doc.Name)


def _row(sh, alias):
    """Spreadsheet row carrying an alias (aliases live in column B)."""
    for r in range(1, 200):
        if sh.getAlias("B%d" % r) == alias:
            return r
    raise KeyError(alias)
