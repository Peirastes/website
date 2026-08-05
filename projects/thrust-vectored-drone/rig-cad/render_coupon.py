"""Dimensioned drawing of the bolt-pattern coupon.

Reads stl/coupon.json, which build_coupon.py writes from the same numbers it
cut the STL with -- so the drawing cannot disagree with the part.

Plan view + side section. The plan is the one to hold the motor against.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle

HERE = os.path.dirname(os.path.abspath(__file__))
JSN = os.path.join(HERE, "stl", "coupon.json")
OUT = os.path.join(HERE, "anim", "coupon_drawing.png")

BG = "#0f1216"
BODY, EDGE = "#2e6c86", "#7dd6ff"
TEXT, DIM, ACC = "#c9d4de", "#7b8794", "#ff7a3d"


def main():
    with open(JSN) as fh:
        p = json.load(fh)
    L, W, H = p["L"], p["W"], p["H"]
    bx, by, hd = p["motor_bolt_x"], p["motor_bolt_y"], p["motor_bolt_d"]

    fig, (ax, sx) = plt.subplots(
        1, 2, figsize=(12.4, 6.4), facecolor=BG,
        gridspec_kw={"width_ratios": [1.45, 1]})
    fig.subplots_adjust(left=0.05, right=0.97, top=0.86, bottom=0.08, wspace=0.18)
    fig.suptitle("BOLT-PATTERN COUPON  --  cross, %g on X / %g on Y"
                 % (bx, by), color=TEXT, fontsize=13,
                 fontfamily="monospace", y=0.96)

    # ---- plan ----------------------------------------------------------
    ax.set_facecolor(BG)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title("PLAN  (hold the motor against this face)",
                 color=TEXT, fontsize=10, fontfamily="monospace", pad=12)
    ax.add_patch(Rectangle((-L / 2, -W / 2), L, W, facecolor=BODY,
                           edgecolor=EDGE, lw=1.6))
    ax.add_patch(Rectangle((-p["px"] / 2, -p["py"] / 2), p["px"], p["py"],
                           facecolor="none", edgecolor="#4c5866", lw=1.0,
                           ls=(0, (5, 4))))
    ax.text(0, -W / 2 - 4.2, "dashed = pocket below, %g deep" % p["pocket_depth"],
            color="#5a6673", fontsize=8, ha="center", fontfamily="monospace")
    ax.add_patch(Circle((0, 0), p["motor_boss_d"] / 2, facecolor=BG,
                        edgecolor=EDGE, lw=1.3))
    for x, y in ((bx / 2, 0), (-bx / 2, 0), (0, by / 2), (0, -by / 2)):
        ax.add_patch(Circle((x, y), hd / 2, facecolor=BG, edgecolor=ACC, lw=1.5))
        ax.plot([x], [y], marker="+", ms=8, color=ACC, mew=1.0)

    def dim(x0, y0, x1, y1, label, off):
        ax.annotate("", xy=(x0, y0), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="<->", color=DIM, lw=1.0))
        ax.text((x0 + x1) / 2 + off[0], (y0 + y1) / 2 + off[1], label,
                color=DIM, fontsize=9, ha="center", va="center",
                fontfamily="monospace",
                bbox=dict(facecolor=BG, edgecolor="none", pad=1.5))

    # offset the pattern dimensions clear of the boss hole
    dim(-bx / 2, -12.6, bx / 2, -12.6, "%g" % bx, (0, 2.3))
    dim(-13.2, -by / 2, -13.2, by / 2, "%g" % by, (-3.6, 0))
    dim(-L / 2, -W / 2 - 10, L / 2, -W / 2 - 10, "%g" % L, (0, 1.8))
    dim(L / 2 + 6, -W / 2, L / 2 + 6, W / 2, "%g" % W, (3.6, 0))
    ax.annotate("hole %g dia" % hd, xy=(bx / 2, 0), xytext=(L / 2 - 1, W / 2 + 4),
                color=ACC, fontsize=8.5, fontfamily="monospace", ha="center",
                arrowprops=dict(arrowstyle="-", color=ACC, lw=0.8, alpha=0.7))
    ax.annotate("boss clearance %g dia" % p["motor_boss_d"], xy=(0, p["motor_boss_d"] / 2),
                xytext=(-L / 2 - 3, W / 2 + 4), color=EDGE, fontsize=8.5,
                fontfamily="monospace", ha="center",
                arrowprops=dict(arrowstyle="-", color=EDGE, lw=0.8, alpha=0.7))
    ax.text(0, W / 2 + 10.5, "the %g mm pair runs ALONG THE BEAM (X)" % bx,
            color=ACC, fontsize=9.5, ha="center", fontfamily="monospace")
    ax.set_xlim(-L / 2 - 16, L / 2 + 16)
    ax.set_ylim(-W / 2 - 17, W / 2 + 15)

    # ---- section -------------------------------------------------------
    sx.set_facecolor(BG)
    sx.set_aspect("equal")
    sx.axis("off")
    sx.set_title("SECTION", color=TEXT, fontsize=10,
                 fontfamily="monospace", pad=12)
    plate = p["motor_plate_thk"]
    sx.add_patch(Rectangle((-L / 2, H - plate), L, plate, facecolor=BODY,
                           edgecolor=EDGE, lw=1.5))
    for s in (-1, 1):
        sx.add_patch(Rectangle((s * p["px"] / 2, 0),
                               s * (L / 2 - p["px"] / 2), H - plate,
                               facecolor=BODY, edgecolor=EDGE, lw=1.5))
    sx.annotate("", xy=(L / 2 + 5, H - plate), xytext=(L / 2 + 5, H),
                arrowprops=dict(arrowstyle="<->", color=DIM, lw=1.0))
    sx.text(L / 2 + 7.5, H - plate / 2, "plate %g" % plate, color=DIM,
            fontsize=9, va="center", fontfamily="monospace")
    sx.annotate("", xy=(L / 2 + 5, 0), xytext=(L / 2 + 5, H - plate),
                arrowprops=dict(arrowstyle="<->", color=DIM, lw=1.0))
    sx.text(L / 2 + 7.5, (H - plate) / 2, "pocket %g" % p["pocket_depth"],
            color=DIM, fontsize=9, va="center", fontfamily="monospace")
    sx.text(0, H + 5, "motor sits here; screws thread UP",
            color=TEXT, fontsize=9, ha="center", fontfamily="monospace")
    sx.text(0, (H - plate) / 2, "screw heads\nlive in here", color="#5a6673",
            fontsize=8.5, ha="center", va="center", fontfamily="monospace")
    sx.set_xlim(-L / 2 - 6, L / 2 + 26)
    sx.set_ylim(-6, H + 12)

    fig.savefig(OUT, facecolor=BG, dpi=110)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    main()
