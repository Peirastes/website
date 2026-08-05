"""Show only the finished parts. Objects built headlessly keep Visibility=True,
so every intermediate box and cut-tool would render on top of the assembly."""
import os
import FreeCAD as App

HERE = os.path.dirname(os.path.abspath(__file__))
DOC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")

SHOW = [
    "BasePlate", "Upright_PY", "Upright_NY", "PivotHub", "Arm_Motor", "Arm_CW",
    "ServoYokeBracket", "MotorYoke", "MagnetHolder", "SensorBracket",
    "PivotShaft", "Bearing_PY", "Bearing_NY", "Motor", "Prop", "Servo",
    "CWRod", "CWMass", "Magnet", "PCB",
]


def main():
    doc = App.openDocument(DOC)
    shown = hidden = 0
    for o in doc.Objects:
        if not hasattr(o, "Visibility"):
            continue
        vis = o.Name in SHOW
        o.Visibility = vis
        shown += vis
        hidden += not vis
    doc.save()
    print("visible: %d finished parts   hidden: %d intermediates" % (shown, hidden))
    App.closeDocument(doc.Name)
