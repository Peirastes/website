"""Stage 2: render the rig's three control modes as a side elevation.

This is a planar mechanism -- everything happens in XZ -- so an orthographic
side view reads better than a shaded 3D render would.

Kinematics (two composed rotations about the pivot axis):
    beam parts  ->  R_pivot(theta)
    yoke parts  ->  R_pivot(theta) . R_servo(phi)

    R(a):  x' = x cos a + z sin a ,  z' = -x sin a + z cos a
    positive a drops the +X (motor) end -- verified against the swept-travel check

Panels:
    LOCKED  phi = 0        thrust tips with the beam        (Phase A analog)
    GIMBAL  phi = -theta   thrust holds world vertical      (attitude hold)
    TVC     phi = -k.theta thrust vectors PAST vertical     (adds restoring torque)

The TVC panel is a schematic of the control ACTION, not a simulated response --
there is no measured thrust for this motor yet, and dressing a guess up as a
simulation would be worse than saying so.

Plain system Python (matplotlib/numpy/PIL + ffmpeg). Run directly.
"""
import json
import math
import os
import subprocess

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
from matplotlib.patches import FancyArrowPatch
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ANIM = os.path.join(HERE, "anim")
FRAMES = os.path.join(ANIM, "frames")

BG = "#0f1216"
COL = {
    "static": ("#333c47", "#4c5866"),
    "beam": ("#2e6c86", "#7dd6ff"),
    "yoke": ("#8a6012", "#ffae20"),
}
TEXT = "#c9d4de"
THRUST = "#ff7a3d"

N_FRAMES = 120
FPS = 30
AMP = 45.0        # deg -- gimbal now clears to 48, beam to 50
TVC_GAIN = 2.0    # servo tilts past vertical by this factor of the error
TVC_CLAMP = 45.0  # deg


def rot(a_deg):
    a = math.radians(a_deg)
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, s], [-s, c]])


def motion(frame):
    """(theta, phi) per panel for this frame."""
    t = frame / float(N_FRAMES)
    rock = AMP * math.sin(2 * math.pi * 2 * t)
    decay = 32.0 * math.exp(-3.0 * t) * math.cos(2 * math.pi * 2.5 * t)
    tvc_phi = max(-TVC_CLAMP, min(TVC_CLAMP, -TVC_GAIN * decay))
    return [(rock, 0.0), (rock, -rock), (decay, tvc_phi)]


def main():
    with open(os.path.join(ANIM, "geom.json")) as fh:
        data = json.load(fh)

    pivot = np.array(data["anchors"]["pivot"])
    servo = np.array(data["anchors"]["servo"])
    prop_z = data["anchors"]["prop_z"]
    motor_arm = data["anchors"]["motor_arm"]

    # per part: (body, ntri x 3 x 2 array in the XZ plane)
    parts = []
    for p in data["parts"]:
        v = np.asarray(p["verts"], dtype=float)[:, [0, 2]]   # drop Y
        tris = v[np.asarray(p["tris"], dtype=int)]           # (n,3,2)
        parts.append((p["body"], tris))

    titles = [
        ("SERVO LOCKED", "thrust tips with the beam"),  # noqa
        ("GIMBAL   phi = -theta", "thrust holds world vertical"),
        ("TVC   phi = -k.theta", "vectoring modulates only ~8% of torque here"),
    ]

    fig, axes = plt.subplots(1, 3, figsize=(15.0, 5.2), facecolor=BG)
    fig.subplots_adjust(left=0.02, right=0.98, top=0.86, bottom=0.06, wspace=0.04)

    panels = []
    for ax, (t1, t2) in zip(axes, titles):
        ax.set_facecolor(BG)
        ax.set_xlim(-300, 320)
        ax.set_ylim(-30, 345)
        ax.set_aspect("equal")
        ax.axis("off")
        ax.set_title(t1, color=TEXT, fontsize=12, fontfamily="monospace", pad=16)
        ax.text(0.5, 1.005, t2, color="#7b8794", fontsize=9, ha="center",
                transform=ax.transAxes, fontfamily="monospace")
        ax.plot([-300, 320], [0, 0], color="#2a323c", lw=1.2, zorder=0)

        cols = []
        for body, tris in parts:
            fc, ec = COL[body]
            z = {"static": 1, "beam": 2, "yoke": 3}[body]
            pc = PolyCollection([], facecolors=fc, edgecolors=ec,
                                linewidths=0.25, zorder=z)
            ax.add_collection(pc)
            cols.append(pc)
        vert = ax.plot([], [], color="#3d4753", lw=1.0, ls=(0, (4, 4)), zorder=4)[0]
        arrow = FancyArrowPatch((0, 0), (0, 1), arrowstyle="-|>",
                                mutation_scale=16, color=THRUST, lw=2.4, zorder=6)
        ax.add_patch(arrow)
        # boxed, because the arm sweeps through this corner at large theta
        label = ax.text(-292, 330, "", color=TEXT, fontsize=10,
                        fontfamily="monospace", va="top", zorder=8,
                        bbox=dict(facecolor=BG, edgecolor="#2a323c",
                                  boxstyle="round,pad=0.35", alpha=0.92))
        panels.append((cols, vert, arrow, label))

    if not os.path.isdir(FRAMES):
        os.makedirs(FRAMES)
    for f in os.listdir(FRAMES):
        os.remove(os.path.join(FRAMES, f))

    for frame in range(N_FRAMES):
        for (theta, phi), (cols, vert, arrow, label) in zip(motion(frame), panels):
            Rp, Rs = rot(theta), rot(phi)
            for pc, (body, tris) in zip(cols, parts):
                if body == "static":
                    out = tris
                elif body == "beam":
                    out = (tris - pivot) @ Rp.T + pivot
                else:
                    out = ((tris - servo) @ Rs.T + servo - pivot) @ Rp.T + pivot
                pc.set_verts(out.reshape(-1, 3, 2))
            # world-vertical reference through the (moved) servo axis
            sv = (servo - pivot) @ Rp.T + pivot
            vert.set_data([sv[0], sv[0]], [sv[1] - 40, sv[1] + 150])
            # thrust acts along the motor axis: total rotation is theta + phi
            tip = (np.array([motor_arm, prop_z]) - servo) @ Rs.T + servo
            tip = (tip - pivot) @ Rp.T + pivot
            d = np.array([math.sin(math.radians(-(theta + phi))),
                          math.cos(math.radians(theta + phi))])
            arrow.set_positions(tuple(tip), tuple(tip + 62 * d))
            label.set_text("theta %+6.1f\nphi   %+6.1f" % (theta, phi))
        fig.savefig(os.path.join(FRAMES, "f%04d.png" % frame),
                    facecolor=BG, dpi=88)
        if frame % 20 == 0:
            print("  frame %3d / %d" % (frame, N_FRAMES))
    plt.close(fig)

    mp4 = os.path.join(ANIM, "tvd_rig_modes.mp4")
    # libx264 + yuv420p needs EVEN width and height; a figure sized in inches
    # x dpi lands on an odd pixel count often enough that this is not optional.
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS),
                    "-i", os.path.join(FRAMES, "f%04d.png"),
                    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", mp4],
                   check=True)
    print("wrote %s (%.1f MB)" % (mp4, os.path.getsize(mp4) / 1e6))

    imgs = [Image.open(os.path.join(FRAMES, "f%04d.png" % i)).convert("RGB")
            for i in range(0, N_FRAMES, 2)]
    w, h = imgs[0].size
    imgs = [im.resize((w // 2, h // 2), Image.LANCZOS).quantize(colors=128)
            for im in imgs]
    gif = os.path.join(ANIM, "tvd_rig_modes.gif")
    imgs[0].save(gif, save_all=True, append_images=imgs[1:],
                 duration=int(2000 / FPS), loop=0, optimize=True)
    print("wrote %s (%.1f MB)" % (gif, os.path.getsize(gif) / 1e6))


if __name__ == "__main__":
    main()
