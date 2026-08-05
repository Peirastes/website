"""Show exactly which holes on the 4-pad horn I mean by "the bolt square".

Drawn from the measured STEP (stl/horns.json), with each hole group coloured
and called out separately, because "the small holes" is ambiguous on a part
that has three different sizes of small hole.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle

HERE = os.path.dirname(os.path.abspath(__file__))
JSN = os.path.join(HERE, "stl", "horns.json")
OUT = os.path.join(HERE, "anim", "bolt_square.png")

BG = "#0f1216"
TEXT, DIM = "#c9d4de", "#7b8794"
HORN, SPL = "#8a6012", "#ffae20"
SQ, LINK, TIP = "#7ddb9a", "#5a6673", "#e2576b"


def main():
    h = json.load(open(JSN))["mg996_arm_4pad.step"]
    holes = {float(k): v for k, v in h["holes"].items()}

    fig, ax = plt.subplots(figsize=(11.6, 8.0), facecolor=BG)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.88, bottom=0.04)
    ax.set_facecolor(BG); ax.set_aspect("equal"); ax.axis("off")
    ax.set_title("THE BOLT SQUARE  --  4-pad horn, looking at its flat face\n"
                 "green = the four holes that matter",
                 color=TEXT, fontsize=13, fontfamily="monospace", pad=14)

    ax.add_patch(Rectangle((-20, -20), 40, 40, facecolor=HORN,
                           edgecolor=SPL, lw=1.5, alpha=0.45))

    # spline bore
    ax.add_patch(Circle((0, 0), 5.7 / 2, facecolor=BG, edgecolor=SPL, lw=2.0))
    ax.annotate("5.7 spline bore\n(servo shaft)", xy=(0, 2.9), xytext=(-16, 12),
                color=SPL, fontsize=10, fontfamily="monospace", ha="center",
                arrowprops=dict(arrowstyle="->", color=SPL, lw=1.2))

    # 1.5 linkage holes
    for x, y in holes.get(1.5, []):
        ax.add_patch(Circle((x, y), 0.75, facecolor=BG, edgecolor=LINK, lw=0.9))
    ax.annotate("1.5 mm linkage holes\n(the rows down each arm)",
                xy=(13.9, 0), xytext=(24, -9), color=LINK, fontsize=10,
                fontfamily="monospace", ha="left",
                arrowprops=dict(arrowstyle="->", color=LINK, lw=1.0))

    # 5.0 tip holes -- the ones Cole says his horn lacks
    for x, y in holes.get(5.0, []):
        ax.add_patch(Circle((x, y), 2.5, facecolor=BG, edgecolor=TIP,
                            lw=1.6, ls=(0, (3, 2))))
    ax.annotate("5.0 mm hole at each arm tip\nYOURS DOES NOT HAVE THESE\n"
                "-- and that is fine, they are not used",
                xy=(0, 17.5), xytext=(15, 27), color=TIP, fontsize=10,
                fontfamily="monospace", ha="center",
                arrowprops=dict(arrowstyle="->", color=TIP, lw=1.2))

    # the bolt square
    sq = [p for p in holes.get(3.0, []) if p[0] or p[1]]
    for x, y in sq:
        ax.add_patch(Circle((x, y), 1.5, facecolor=BG, edgecolor=SQ, lw=3.0))
    xs = sorted(set(p[0] for p in sq))
    ys = sorted(set(p[1] for p in sq))
    if len(xs) == 2 and len(ys) == 2:
        ax.add_patch(Rectangle((xs[0], ys[0]), xs[1] - xs[0], ys[1] - ys[0],
                               facecolor="none", edgecolor=SQ, lw=1.0,
                               ls=(0, (4, 3))))
        ax.annotate("", xy=(xs[0], ys[1] + 3.4), xytext=(xs[1], ys[1] + 3.4),
                    arrowprops=dict(arrowstyle="<->", color=SQ, lw=1.4))
        ax.text(0, ys[1] + 4.6, "%.1f" % (xs[1] - xs[0]), color=SQ, fontsize=11,
                ha="center", fontfamily="monospace")
        ax.annotate("", xy=(xs[1] + 3.4, ys[0]), xytext=(xs[1] + 3.4, ys[1]),
                    arrowprops=dict(arrowstyle="<->", color=SQ, lw=1.4))
        ax.text(xs[1] + 4.4, 0, "%.1f" % (ys[1] - ys[0]), color=SQ, fontsize=11,
                va="center", fontfamily="monospace")
    ax.annotate("FOUR 3.0 mm holes in an %.1f mm square\nclose in to the hub -- "
                "THIS is the bolt square" % (xs[1] - xs[0] if len(xs) == 2 else 11),
                xy=(-5.5, -5.5), xytext=(-21, -26), color=SQ, fontsize=11,
                fontfamily="monospace", ha="center",
                arrowprops=dict(arrowstyle="->", color=SQ, lw=1.6))

    ax.text(0, -34.5,
            "Look at YOUR horn: is there a square of four holes tucked in beside the\n"
            "spline bore, distinct from the rows running out along the arms?",
            color=TEXT, fontsize=10.5, ha="center", fontfamily="monospace")
    ax.set_xlim(-34, 40); ax.set_ylim(-38, 33)

    fig.savefig(OUT, facecolor=BG, dpi=110)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    main()
