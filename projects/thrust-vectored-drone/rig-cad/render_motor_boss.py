"""Schematic: what `motor_boss_d` is, and where to put the callipers.

The A2212's underside is not flat. There is a raised hub around the shaft, and
if the yoke has no relief for it the motor pivots on that hub instead of
seating on its four ears. motor_boss_d is the through-bore that clears it --
so only its DIAMETER matters, never how far it stands proud.

Plain matplotlib, no FreeCAD needed:  python render_motor_boss.py
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt                       # noqa: E402
from matplotlib.patches import Circle, Rectangle, FancyArrowPatch  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "anim", "motor_boss_measure.png")

BG = "#0f1216"
TEXT = "#d8dee9"
DIM = "#7c8797"
CAN = "#4a90a4"       # motor body
BOSS = "#e0a458"      # the thing to measure
PLA = "#5c7a5c"       # printed yoke
HOLE = "#0f1216"

MOTOR_D = 28.0
BOLT_X = 19.0         # opposing pair on X
BOLT_Y = 16.0         # opposing pair on Y
BOSS_D = 9.0          # CURRENT GUESS
HEAD_D = 6.0


def underside(ax):
    ax.set_title("1.  UNDERSIDE OF THE MOTOR\n"
                 "(the face that bolts to the yoke)",
                 color=TEXT, fontsize=12, fontfamily="monospace", pad=16)
    ax.add_patch(Circle((0, 0), MOTOR_D / 2, facecolor=CAN, alpha=0.30,
                        edgecolor=CAN, lw=2.0))
    # the four ears -- a CROSS, not a rectangle
    for x, y in ((BOLT_X / 2, 0), (-BOLT_X / 2, 0),
                 (0, BOLT_Y / 2), (0, -BOLT_Y / 2)):
        ax.add_patch(Circle((x, y), HEAD_D / 2, facecolor=HOLE,
                            edgecolor=DIM, lw=1.4))
    # the boss
    ax.add_patch(Circle((0, 0), BOSS_D / 2, facecolor=BOSS, alpha=0.85,
                        edgecolor=BOSS, lw=2.0))

    # callipers across the boss
    y = -0.0
    ax.annotate("", xy=(-BOSS_D / 2, y), xytext=(BOSS_D / 2, y),
                arrowprops=dict(arrowstyle="<->", color="#0f1216", lw=2.6))
    ax.plot([BOSS_D / 2, 19], [-1.2, -12], color=BOSS, lw=1.2)
    ax.text(19.5, -12.6, "motor_boss_d  <-- MEASURE THIS\n"
                         "widest thing sticking out\n"
                         "of this face (hub + shaft\nend + clip, if present)\n"
                         "modelled at 9.0 -- a GUESS",
            color=BOSS, fontsize=9.5, fontfamily="monospace", va="top")

    ax.plot([BOLT_X / 2 + 3, 16], [0, 9], color=DIM, lw=1.0)
    ax.text(16.5, 9.4, "four ears: 19 across X, 16 across Y\n"
                       "(already measured -- not what we need)",
            color=DIM, fontsize=9, fontfamily="monospace", va="center")

    ax.set_xlim(-22, 46)
    ax.set_ylim(-26, 22)
    ax.set_aspect("equal")
    ax.axis("off")


def section(ax):
    ax.set_title("2.  SIDE SECTION, motor sitting on the yoke\n"
                 "(why it matters)",
                 color=TEXT, fontsize=12, fontfamily="monospace", pad=16)

    # motor can
    ax.add_patch(Rectangle((-MOTOR_D / 2, 2), MOTOR_D, 17,
                           facecolor=CAN, alpha=0.30, edgecolor=CAN, lw=2.0))
    ax.text(0, 10.5, "MOTOR", color=CAN, fontsize=11,
            fontfamily="monospace", ha="center", va="center")
    # mount face + boss hanging below it
    ax.plot([-MOTOR_D / 2, MOTOR_D / 2], [2, 2], color=CAN, lw=2.6)
    ax.add_patch(Rectangle((-BOSS_D / 2, -3.2), BOSS_D, 5.2,
                           facecolor=BOSS, alpha=0.85, edgecolor=BOSS, lw=1.6))

    # printed plate, with the through-bore
    for x0, w in ((-17, 17 - BOSS_D / 2 - 0.4), (BOSS_D / 2 + 0.4, 17 - BOSS_D / 2 - 0.4)):
        ax.add_patch(Rectangle((x0, -8.5), w, 6.5,
                               facecolor=PLA, alpha=0.55, edgecolor=PLA, lw=2.0))
    ax.text(-18.5, -5.2, "PRINTED\nYOKE", color=PLA, fontsize=9.5,
            fontfamily="monospace", ha="right", va="center")

    ax.annotate("", xy=(-BOSS_D / 2 - 0.4, -8.9), xytext=(BOSS_D / 2 + 0.4, -8.9),
                arrowprops=dict(arrowstyle="<->", color=BOSS, lw=1.8))
    ax.text(0, -10.4, "through-bore -- DEPTH DOES NOT MATTER,\n"
                      "it goes all the way through the part",
            color=BOSS, fontsize=9.5, fontfamily="monospace",
            ha="center", va="top")

    ax.plot([MOTOR_D / 2 - 2, 21], [2, 6], color=TEXT, lw=1.0)
    ax.text(21.5, 6.3, "the ears must land HERE.\nIf the bore is too small the\n"
                       "motor rides on the boss and\nrocks -- bolts pull it crooked.",
            color=TEXT, fontsize=9.5, fontfamily="monospace", va="center")

    ax.set_xlim(-30, 52)
    ax.set_ylim(-26, 22)
    ax.set_aspect("equal")
    ax.axis("off")


def main():
    fig, axes = plt.subplots(1, 2, figsize=(15.0, 7.4), facecolor=BG)
    for ax in axes:
        ax.set_facecolor(BG)
    underside(axes[0])
    section(axes[1])
    fig.suptitle("A2212 underside -- what to put the callipers on",
                 color=TEXT, fontsize=14, fontfamily="monospace", y=0.97)
    fig.tight_layout(rect=(0, 0, 1, 0.93))
    fig.savefig(OUT, dpi=125, facecolor=BG)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    main()
