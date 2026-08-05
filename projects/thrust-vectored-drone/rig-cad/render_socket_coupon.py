"""Measurement schematic for the socket coupon.

Reads stl/socket_coupon.json -- the same numbers build_socket_coupon.py cut the
STL with -- so the drawing states what the part was MEANT to be, and the blanks
are what to fill in from the printed part.

Left: the three pieces as they sit on the bed.
Right: end-on sections, with the four measurements called out.
"""
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle

HERE = os.path.dirname(os.path.abspath(__file__))
JSN = os.path.join(HERE, "stl", "socket_coupon.json")
OUT = os.path.join(HERE, "anim", "socket_coupon_schematic.png")

BG = "#0f1216"
BODY, EDGE = "#2e6c86", "#7dd6ff"
TEXT, DIM, ACC = "#c9d4de", "#7b8794", "#ff7a3d"
GOOD = "#7ddb9a"


def main():
    with open(JSN) as fh:
        p = json.load(fh)
    hw, ht = p["hub_wid"], p["hub_thk"]
    bw, bt = p["beam_wid"], p["beam_thk"]
    sw, sh_ = p["socket_w"], p["socket_h"]
    ib = p["idler_bore_d"]
    po, ph = p["print_flat"], p["print_hole"]

    fig = plt.figure(figsize=(13.6, 7.2), facecolor=BG)
    fig.suptitle("SOCKET COUPON  --  what to measure",
                 color=TEXT, fontsize=14, fontfamily="monospace", y=0.965)

    # ---- left: bed layout ------------------------------------------------
    ax = fig.add_axes([0.03, 0.08, 0.36, 0.80])
    ax.set_facecolor(BG); ax.set_aspect("equal"); ax.axis("off")
    ax.set_title("as printed, looking down", color=TEXT, fontsize=10,
                 fontfamily="monospace", pad=10)
    slen = p["depth"] + 3.0
    tl = p["depth"] + p["proud"]
    gw = ib + 8.0
    pieces = [("SOCKET", 0, -hw / 2, slen, hw, "1"),
              ("TONGUE", 0, hw / 2 + bw / 2 + 6 - bw / 2, tl, bw, "2"),
              ("BORE GAUGE", 0, -hw / 2 - 6 - gw, gw, gw, "3")]
    for label, x, y, w, h, tag in pieces:
        ax.add_patch(Rectangle((x, y), w, h, facecolor=BODY, edgecolor=EDGE, lw=1.5))
        ax.text(x + w + 3, y + h / 2, "%s  %s" % (tag, label), color=TEXT,
                fontsize=9.5, va="center", fontfamily="monospace")
    # socket cavity mouth + gauge bore
    ax.add_patch(Rectangle((3, -sw / 2), slen - 3, sw, facecolor=BG,
                           edgecolor="#4c5866", lw=1.0, ls=(0, (4, 3))))
    ax.add_patch(Circle((-hw / 2 - 6 - gw / 2, -hw / 2 - 6 - gw / 2), 0, color=BG))
    ax.add_patch(Circle((gw / 2, -hw / 2 - 6 - gw / 2), ib / 2,
                        facecolor=BG, edgecolor=EDGE, lw=1.3))
    ax.set_xlim(-8, 62); ax.set_ylim(-hw / 2 - 6 - gw - 6, hw / 2 + bw + 12)

    # ---- right: sections + the ask ---------------------------------------
    bx = fig.add_axes([0.44, 0.44, 0.24, 0.42])
    bx.set_facecolor(BG); bx.set_aspect("equal"); bx.axis("off")
    bx.set_title("2  TONGUE, end on", color=ACC, fontsize=10,
                 fontfamily="monospace", pad=8)
    bx.add_patch(Rectangle((-bw / 2, -bt / 2), bw, bt, facecolor=BODY,
                           edgecolor=ACC, lw=2.0))
    bx.annotate("", xy=(-bw / 2, -bt / 2 - 4), xytext=(bw / 2, -bt / 2 - 4),
                arrowprops=dict(arrowstyle="<->", color=ACC, lw=1.2))
    bx.text(0, -bt / 2 - 7.5, "W = ______  (drawn %.2f)" % bw, color=ACC,
            fontsize=9.5, ha="center", fontfamily="monospace")
    bx.annotate("", xy=(bw / 2 + 4, -bt / 2), xytext=(bw / 2 + 4, bt / 2),
                arrowprops=dict(arrowstyle="<->", color=ACC, lw=1.2))
    bx.text(bw / 2 + 6, 0, "H = ______\n(drawn %.2f)" % bt, color=ACC,
            fontsize=9.5, va="center", fontfamily="monospace")
    bx.set_xlim(-bw / 2 - 6, bw / 2 + 26); bx.set_ylim(-bt / 2 - 11, bt / 2 + 4)

    cx = fig.add_axes([0.70, 0.44, 0.27, 0.42])
    cx.set_facecolor(BG); cx.set_aspect("equal"); cx.axis("off")
    cx.set_title("1  SOCKET, end on", color=EDGE, fontsize=10,
                 fontfamily="monospace", pad=8)
    cx.add_patch(Rectangle((-hw / 2, -ht / 2), hw, ht, facecolor=BODY,
                           edgecolor=EDGE, lw=1.6))
    cx.add_patch(Rectangle((-sw / 2, -sh_ / 2), sw, sh_, facecolor=BG,
                           edgecolor=ACC, lw=2.0))
    cx.text(0, -ht / 2 - 5, "cavity  ____ x ____   (drawn %.2f x %.2f)"
            % (sw, sh_), color=ACC, fontsize=9, ha="center",
            fontfamily="monospace")
    cx.set_xlim(-hw / 2 - 4, hw / 2 + 4); cx.set_ylim(-ht / 2 - 9, ht / 2 + 3)

    # ---- the checklist ---------------------------------------------------
    tx = fig.add_axes([0.44, 0.03, 0.53, 0.36])
    tx.axis("off"); tx.set_facecolor(BG)
    lines = [
        ("v2 -- compensation now MEASURED, this print verifies the fit", TEXT),
        ("  flat bloat %.2f (was assumed %.2f)   round bloat %.2f" % (po, 0.39, 0.39), DIM),
        ("  cavity %.2f (was %.2f)   bore %.2f (was 6.84, tighter journal)"
         % (sw, 20.69, ib), DIM),
        ("", TEXT),
        ("FIT CHECKS -- what good looks like", TEXT),
        ("  2 into 1   light thumb pressure, seats 18 mm, NO ROCK", GOOD),
        ("             the v1 coupon rocked; this one should not", DIM),
        ("             won't start -> raise print_hole (now %.2f)" % ph, DIM),
        ("             still loose -> lower it", DIM),
        ("  stub into 3  free, but tighter than last time", GOOD),
        ("  M3 through both, seated -> bolts line up", GOOD),
        ("", TEXT),
        ("STILL ASSUMED: print_hole %.2f.  Measuring the cavity pins it." % ph, ACC),
    ]
    for i, (s, c) in enumerate(lines):
        tx.text(0.0, 1.0 - i * 0.080, s, color=c, fontsize=9.6,
                fontfamily="monospace", va="top", transform=tx.transAxes)

    fig.savefig(OUT, facecolor=BG, dpi=110)
    print("wrote %s" % OUT)


if __name__ == "__main__":
    main()
