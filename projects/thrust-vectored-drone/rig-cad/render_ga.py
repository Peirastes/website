"""One annotated general-arrangement view, at theta = 0.

Same projection as the animation (side elevation, XZ), but static and labelled,
so the tree in FreeCAD can be read against a picture of the machine.
"""
import json
import math
import os

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

HERE = os.path.dirname(os.path.abspath(__file__))
ANIM = os.path.join(HERE, "anim")
OUT = os.path.join(ANIM, "tvd_rig_ga.png")

BG = "#0f1216"
COL = {"static": ("#333c47", "#4c5866"),
       "beam": ("#2e6c86", "#7dd6ff"),
       "yoke": ("#8a6012", "#ffae20")}
TEXT = "#c9d4de"
DIM = "#7b8794"
ACC = "#ff7a3d"

# (label, point in model coords, text position, colour)
GREY, CYAN, GOLD = "#8f9aa6", "#7dd6ff", "#ffae20"
LABELS = [
    # left column
    ("SensorBracket + PCB\n(AS5600, far side)", (18, 148), (-252, 288), GREY),
    ("Arm_CW", (-110, 168), (-252, 232), CYAN),
    ("CWRod + CWMass\n(trim, + fine stiffness)", (-160, 130), (-252, 186), CYAN),
    ("KeelRod + KeelBob  116 g\non the pivot axis: pure\nstiffness -- no trim,\nno travel cost",
     (0, 60), (-252, 92), CYAN),
    # over the top
    ("PivotShaft in 625ZZ\n+ MagnetHolder", (0, 160), (-138, 304), CYAN),
    ("PivotHub\n(sockets both ends)", (34, 170), (72, 304), CYAN),
    # right column
    ("Prop 254 dia (1045)", (250, 240), (150, 318), GOLD),
    ("MotorYoke + Motor\n(A2212, bolted down)", (172, 220), (215, 262), GOLD),
    ("ServoYokeBracket\n(servo + idler, one part)", (150, 174), (208, 209), CYAN),
    ("Arm_Motor", (105, 152), (208, 132), CYAN),
    ("Upright x2\n(bearing seats)", (16, 95), (208, 76), GREY),
    ("BasePlate", (60, -4), (208, 20), GREY),
]


def main():
    with open(os.path.join(ANIM, "geom.json")) as fh:
        data = json.load(fh)
    a = data["anchors"]
    pivot, servo = a["pivot"], a["servo"]

    fig, ax = plt.subplots(figsize=(13.0, 8.0), facecolor=BG)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.93, bottom=0.03)
    ax.set_facecolor(BG)
    ax.set_xlim(-312, 305)
    ax.set_ylim(-55, 350)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title("TVD TEST RIG Mk0  --  general arrangement, side elevation "
                 "(X along beam, Z up)",
                 color=TEXT, fontsize=13, fontfamily="monospace", pad=14)

    for p in data["parts"]:
        v = np.asarray(p["verts"], dtype=float)[:, [0, 2]]
        tris = v[np.asarray(p["tris"], dtype=int)]
        fc, ec = COL[p["body"]]
        ax.add_collection(PolyCollection(
            tris, facecolors=fc, edgecolors=ec, linewidths=0.25,
            zorder={"static": 1, "beam": 2, "yoke": 3}[p["body"]]))

    ax.plot([-312, 305], [0, 0], color="#2a323c", lw=1.2, zorder=0)

    # the two rotation axes -- the whole machine is organised around these.
    # Each carries its own label offset: z-22 is clear air under the pivot but
    # lands inside the ServoYokeBracket at the servo, so that one goes out to
    # the left, into the gap between the hub and the bracket, with a leader.
    # -48 puts the text's right edge at x=112, clear of ServoYokeBracket's
    # x=117.5 left face (measured off geom.json, not eyeballed -- the bracket
    # reaches much further left than the visible yoke does).
    AXES = ((pivot, "PIVOT AXIS", (0, -22), "center", "baseline"),
            (servo, "SERVO AXIS", (-48, 0), "right", "center"))
    for (x, z), name, (dx, dz), ha, va in AXES:
        ax.plot([x], [z], marker="o", ms=9, mfc="none", mec=ACC, mew=1.8, zorder=7)
        ax.plot([x], [z], marker="+", ms=13, color=ACC, mew=1.4, zorder=7)
        if dx:
            ax.plot([x + dx + 4, x - 9], [z, z], color=ACC, lw=0.8,
                    alpha=0.6, zorder=6)
        ax.text(x + dx, z + dz, name, color=ACC, fontsize=8, ha=ha, va=va,
                fontfamily="monospace", zorder=7)

    for text, pt, tp, colour in LABELS:
        ax.annotate(text, xy=pt, xytext=tp, color=colour, fontsize=9.5,
                    fontfamily="monospace", zorder=9,
                    ha="left" if tp[0] > pt[0] else "right",
                    va="center",
                    arrowprops=dict(arrowstyle="-", color=colour, lw=0.9,
                                    shrinkA=2, shrinkB=2, alpha=0.65))

    # key dimensions
    def dim(x0, x1, z, label):
        ax.annotate("", xy=(x0, z), xytext=(x1, z),
                    arrowprops=dict(arrowstyle="<->", color=DIM, lw=0.9))
        ax.text((x0 + x1) / 2, z + 6, label, color=DIM, fontsize=8.5,
                ha="center", fontfamily="monospace")

    # dimensions live BELOW the machine and just right of the upright,
    # where nothing else is competing for the space
    dim(0, 160, -26, "motor_arm 160")
    dim(-160, 0, -26, "cw_arm 160")
    ax.annotate("", xy=(46, 0), xytext=(46, pivot[1]),
                arrowprops=dict(arrowstyle="<->", color=DIM, lw=0.9))
    ax.text(52, pivot[1] / 2, "pivot_height 160", color=DIM, fontsize=8.5,
            rotation=90, va="center", ha="center", fontfamily="monospace")

    # travel envelope
    for s in (+1, -1):
        aa = math.radians(s * 50)
        ax.plot([pivot[0], pivot[0] + 214 * math.cos(aa)],
                [pivot[1], pivot[1] - 214 * math.sin(aa)],
                color="#3d4753", lw=0.9, ls=(0, (5, 5)), zorder=0)
    ax.text(148, 44, "beam travel     +/-50 deg\nservo / gimbal  +/-48 deg",
            color="#5a6673", fontsize=8.5, fontfamily="monospace")

    fig.savefig(OUT, facecolor=BG, dpi=110)
    print("wrote %s (%.2f MB)" % (OUT, os.path.getsize(OUT) / 1e6))


if __name__ == "__main__":
    main()
