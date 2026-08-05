"""Render an STL as-exported -- so what you see is the mesh, not the parameters.

The dimensioned drawing is generated from the same numbers that cut the part,
which makes it a good cross-check of intent but a poor check of the export.
This reads the binary STL back off disk and draws the actual triangles.

    python view_stl.py stl/TEST_BoltPatternCoupon.stl
"""
import os
import struct
import sys

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection

HERE = os.path.dirname(os.path.abspath(__file__))
BG = "#0f1216"
FACE, EDGE, TEXT = "#2e6c86", "#7dd6ff", "#c9d4de"


def read_binary_stl(path):
    with open(path, "rb") as fh:
        fh.read(80)
        n = struct.unpack("<I", fh.read(4))[0]
        data = np.frombuffer(fh.read(n * 50), dtype=np.uint8)
    if data.size != n * 50:
        raise RuntimeError("truncated STL: %d triangles declared" % n)
    tris = data.reshape(n, 50)[:, 12:48].copy().view("<f4").reshape(n, 3, 3)
    return np.asarray(tris, dtype=float)


def main(path):
    tris = read_binary_stl(path)
    mn, mx = tris.reshape(-1, 3).min(0), tris.reshape(-1, 3).max(0)
    size = mx - mn
    ctr = (mx + mn) / 2
    r = size.max() / 2 * 1.05

    views = [("FROM ABOVE  (motor face)", 32, -60),
             ("FROM BELOW  (pocket, screw heads)", -30, -60)]
    fig = plt.figure(figsize=(12.6, 6.0), facecolor=BG)
    fig.suptitle("%s   %d triangles   %.1f x %.1f x %.1f mm"
                 % (os.path.basename(path), len(tris), *size),
                 color=TEXT, fontsize=12, fontfamily="monospace", y=0.95)

    for i, (title, elev, azim) in enumerate(views, 1):
        ax = fig.add_subplot(1, 2, i, projection="3d", facecolor=BG)
        ax.add_collection3d(Poly3DCollection(
            tris, facecolors=FACE, edgecolors=EDGE, linewidths=0.25, alpha=1.0))
        ax.set_title(title, color=TEXT, fontsize=10,
                     fontfamily="monospace", pad=2)
        for a, c in zip((ax.set_xlim, ax.set_ylim, ax.set_zlim), ctr):
            a(c - r, c + r)
        ax.set_box_aspect((1, 1, 1))
        ax.view_init(elev=elev, azim=azim)
        ax.set_axis_off()

    out = os.path.join(HERE, "anim",
                       os.path.splitext(os.path.basename(path))[0] + "_view.png")
    fig.savefig(out, facecolor=BG, dpi=110)
    print("%d triangles, %.1f x %.1f x %.1f mm" % (len(tris), *size))
    print("wrote %s" % out)
    return out


if __name__ == "__main__":
    p = sys.argv[1] if len(sys.argv) > 1 else "stl/TEST_BoltPatternCoupon.stl"
    main(p if os.path.isabs(p) else os.path.join(HERE, p))
