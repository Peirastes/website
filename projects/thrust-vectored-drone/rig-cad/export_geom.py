"""Stage 1 of the animation: tessellate the model and dump it for the renderer.

freecadcmd has no viewport, so nothing can be screenshotted here. Instead we
export triangles + the kinematic anchors, and a plain-Python renderer does the
frames. (Same split as the rocket silhouette pipeline: FreeCAD meshes, system
Python draws.)

Each part is tagged with the body it belongs to:
  static -- bolted to the world
  beam   -- swings about the pivot by theta
  yoke   -- swings about the SERVO axis by phi, and is then carried by theta

Run via run_export_geom.py.
"""
import json
import os

import FreeCAD as App

HERE = os.path.dirname(os.path.abspath(__file__))
DOC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")
OUT = os.path.join(HERE, "anim", "geom.json")

BODY = {
    "static": ["BasePlate", "Upright_PY", "Upright_NY", "Bearing_PY",
               "Bearing_NY", "SensorBracket", "PCB"],
    "beam": ["PivotHub", "Arm_Motor", "Arm_CW", "ServoYokeBracket",
             "MagnetHolder", "PivotShaft", "CWRod", "CWMass", "Servo", "Magnet",
             "KeelRod", "KeelBob"],
    "yoke": ["MotorYoke", "Motor", "Prop", "Horn", "HornHub"],
}
DEFLECTION = 0.4   # mm; plenty for a silhouette, keeps the payload small


def main():
    doc = App.openDocument(DOC)
    sh = doc.Params
    data = {
        "anchors": {
            "pivot": [0.0, float(sh.pivot_height)],
            "servo": [float(sh.motor_arm), float(sh.yoke_axis_z)],
            "motor_arm": float(sh.motor_arm),
            "prop_z": float(sh.yoke_axis_z) + float(sh.motor_len) / 2 + 3,
            "prop_d": float(sh.prop_d),
        },
        "parts": [],
    }
    ntri = 0
    for body, names in BODY.items():
        for n in names:
            o = doc.getObject(n)
            if o is None:
                raise RuntimeError("missing %s" % n)
            verts, facets = o.Shape.tessellate(DEFLECTION)
            data["parts"].append({
                "name": n,
                "body": body,
                "verts": [[round(v.x, 3), round(v.y, 3), round(v.z, 3)] for v in verts],
                "tris": [list(f) for f in facets],
            })
            ntri += len(facets)
            print("  %-18s %-7s %6d tris" % (n, body, len(facets)))

    if not os.path.isdir(os.path.dirname(OUT)):
        os.makedirs(os.path.dirname(OUT))
    with open(OUT, "w") as fh:
        json.dump(data, fh)
    print("\n%d parts, %d triangles -> %s (%.1f MB)"
          % (len(data["parts"]), ntri, OUT, os.path.getsize(OUT) / 1e6))
    App.closeDocument(doc.Name)
