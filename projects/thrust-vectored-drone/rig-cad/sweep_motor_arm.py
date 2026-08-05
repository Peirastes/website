"""Sweep motor_arm to recover gimbal range, and report what it costs.

Lengthening the arm moves the prop outboard so its inboard tip clears the hub
-- but it also swings the prop nearer the floor and grows the beam, so beam
travel and trim move the other way. Both limits are reported.

Key shortcut: the prop-vs-hub collision happens in the BEAM frame (the hub is
fixed to the beam; the yoke rotates relative to it), so theta cancels and the
servo limit depends on phi alone. That is why "servo alone" and "gimbal" gave
the same answer, and it means only a handful of booleans are needed per angle.

Run via run_sweep_arm.py.
"""
import os

import FreeCAD as App

HERE = os.path.dirname(os.path.abspath(__file__))
DOC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")

YOKE = ["MotorYoke", "Motor", "Prop"]
AGAINST = ["PivotHub", "Arm_Motor", "Arm_CW", "ServoYokeBracket"]
TOL = 1.0
TARGET = 48          # the beam-travel figure we are trying to match
ARM_CLEAR = 40.0     # beam tip must extend this far past the yoke


def _row(sh, alias):
    for r in range(1, 200):
        if sh.getAlias("B%d" % r) == alias:
            return r
    raise KeyError(alias)


def servo_limit(doc, maxdeg=60):
    sh = doc.Params
    servo = App.Vector(float(sh.motor_arm), 0, float(sh.yoke_axis_z))
    axis = App.Vector(0, 1, 0)
    yoke = {n: doc.getObject(n).Shape for n in YOKE}
    fixed = {n: doc.getObject(n).Shape for n in AGAINST}
    for deg in range(1, maxdeg + 1):
        for sign in (+1, -1):
            for nm, s in yoke.items():
                r = s.copy()
                r.rotate(servo, axis, sign * deg)
                for fn, fs in fixed.items():
                    if not r.BoundBox.intersect(fs.BoundBox):
                        continue
                    if r.common(fs).Volume > TOL:
                        return deg - 1, "%s -> %s" % (nm, fn)
    return maxdeg, None


def main():
    import tune_and_export as T
    import rig_eval

    doc = App.openDocument(DOC)
    sh = doc.Params
    base = {a: float(getattr(sh, a)) for a in ("motor_arm", "beam_len")}

    print("%-9s %-9s %-11s %-11s %-8s %s"
          % ("motor_arm", "beam_len", "servo deg", "beam deg", "trim g", "servo limited by"))
    for ma in (160, 175, 190, 205, 220):
        bl = 2 * (ma + ARM_CLEAR)
        sh.set("B%d" % _row(sh, "motor_arm"), str(ma))
        sh.set("B%d" % _row(sh, "beam_len"), str(bl))
        doc.recompute()
        slim, why = servo_limit(doc)
        tp, tn = T.travel(doc, float(sh.pivot_height))
        m_trim, _ = T.plant(doc)
        print("%-9d %-9d +/-%-8d +%d / -%-6d %-8.1f %s"
              % (ma, bl, slim, tp, tn, m_trim, why or "(clear)"))

    for a, v in base.items():
        sh.set("B%d" % _row(sh, a), str(v))
    doc.recompute()
    doc.save()
    print("\nrestored (motor_arm=%g beam_len=%g)" % (base["motor_arm"], base["beam_len"]))
    App.closeDocument(doc.Name)
