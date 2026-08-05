"""Compare the four MG996R horn styles as MotorYoke drive interfaces.

Measured off Cole's own STEP files (stl/horns.json), viewed along the servo
axis -- i.e. looking at the yoke's +Y face with the horn on it.

What matters for driving a yoke is not the horn's reach but its BOLT pattern:
a horn with only a centre screw transmits torque through one fastener, which
is a poor way to carry a 9 N thrust reaction.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle

HERE = os.path.dirname(os.path.abspath(__file__))
JSN = os.path.join(HERE, "stl", "horns.json")
OUT = os.path.join(HERE, "anim", "horn_options.png")

BG = "#0f1216"
TEXT, DIM, ACC, GOOD, BAD = "#c9d4de", "#7b8794", "#ff7a3d", "#7ddb9a", "#e2576b"
HORN, SPL = "#8a6012", "#ffae20"

NOTE = {
    "mg996_arm_2pad.step": ("2-PAD", BAD,
                            "centre screw only -- one fastener\ncarrying all the torque"),
    "mg996_arm_4pad.step": ("4-PAD", GOOD,
                            "FOUR M3 at +/-5.5 square\nplus the centre -- a real flange"),
    "mg996_arm_6pad.step": ("6-PAD", BAD,
                            "centre screw only; the 5.2 holes\nsit out at r=13.4"),
    "mg996_arm_round.step": ("ROUND", BAD,
                             "centre screw only -- compact,\nbut nothing to bolt through"),
}
ORDER = ["mg996_arm_4pad.step", "mg996_arm_round.step",
         "mg996_arm_6pad.step", "mg996_arm_2pad.step"]


def main():
    horns = json.load(open(JSN))
    fig, axes = plt.subplots(1, 4, figsize=(15.2, 5.6), facecolor=BG)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.80, bottom=0.20, wspace=0.06)
    fig.suptitle("MG996R HORN OPTIONS  --  viewed along the servo axis, "
                 "measured off your own STEP files",
                 color=TEXT, fontsize=13, fontfamily="monospace", y=0.955)

    for ax, key in zip(axes, ORDER):
        h = horns[key]
        name, colour, blurb = NOTE[key]
        ax.set_facecolor(BG); ax.set_aspect("equal"); ax.axis("off")
        ax.set_title(name, color=colour, fontsize=13, fontfamily="monospace", pad=10)
        w, d = h["bbox"][0], h["bbox"][1]
        ax.add_patch(Rectangle((-w / 2, -d / 2), w, d, facecolor=HORN,
                               edgecolor=SPL, lw=1.4, alpha=0.55))
        for ds, pts in h["holes"].items():
            dia = float(ds)
            if dia > 9:
                continue
            for x, y in pts:
                if dia == 5.7:                      # the spline bore
                    ax.add_patch(Circle((x, y), dia / 2, facecolor=BG,
                                        edgecolor=SPL, lw=1.6))
                elif abs(dia - 3.0) < 0.01 and (x or y):
                    ax.add_patch(Circle((x, y), dia / 2, facecolor=BG,
                                        edgecolor=GOOD, lw=2.2))
                elif dia < 2.0:
                    ax.add_patch(Circle((x, y), dia / 2, facecolor=BG,
                                        edgecolor="#5a6673", lw=0.8))
                else:
                    ax.add_patch(Circle((x, y), dia / 2, facecolor=BG,
                                        edgecolor="#7b8794", lw=1.0))
        ax.text(0, -24, "%.1f x %.1f x %.1f" % tuple(h["bbox"]),
                color=DIM, fontsize=9, ha="center", fontfamily="monospace")
        ax.text(0, -29.5, blurb, color=colour, fontsize=9, ha="center",
                va="top", fontfamily="monospace")
        ax.set_xlim(-23, 23); ax.set_ylim(-40, 23)

    fig.text(0.5, 0.055,
             "green = 3.0 mm bolt holes   gold ring = 5.7 spline   grey = 1.5 linkage holes"
             "        all four horns are 6.3 mm thick",
             color=DIM, fontsize=9.5, ha="center", fontfamily="monospace")
    fig.savefig(OUT, facecolor=BG, dpi=110)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    main()
