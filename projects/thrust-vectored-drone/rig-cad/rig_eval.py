"""Read the rig model and emit the PLANT PARAMETERS the twin needs.

The point of this file: the CAD hands the controller its constants before
anything is printed. On the aeropendulum those constants came out of a
ringdown AFTER the rig existed; here the loop starts one stage earlier.

Emits, for rotation about the pivot axis:
  M            total rotating mass
  dx           CG offset ALONG the beam   -> trim / balance
  dz           CG offset ABOVE the pivot  -> gravity stiffness AND ITS SIGN
  I            moment of inertia about the pivot
  wn, T        natural frequency / period   (dz < 0, stable)
  lambda       divergence rate              (dz > 0, inverted)
  m_cw*        counterweight mass that trims dx to zero, and the washer-stack
               height that provides it

Run via run_eval.py.
"""
import math
import os

import FreeCAD as App

HERE = os.path.dirname(os.path.abspath(__file__))
DOC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")

G = 9810.0  # mm/s^2

# Parts that swing with the beam about the pivot axis.
ROTATING = [
    "PivotHub", "Arm_Motor", "Arm_CW", "ServoYokeBracket",
    "MotorYoke", "MagnetHolder",
    "PivotShaft", "Motor", "Prop", "Servo", "CWRod", "CWMass", "Magnet",
    "KeelRod", "KeelBob", "Horn", "HornHub",
]

RHO = {          # g/cm^3
    "PLA": 1.24,  # 5-perimeter prints come out near solid PLA (rocket calibration)
    "STEEL": 7.85,
    "NDFEB": 7.50,
}
MATERIAL = {
    "PivotShaft": "STEEL", "CWRod": "STEEL", "CWMass": "STEEL",
    "KeelRod": "STEEL", "KeelBob": "STEEL",
    "Magnet": "NDFEB",
}
FIXED_G = {"Servo": 55.0, "Motor": 55.0, "Prop": 12.0, "PCB": 2.0}
# Servo was still 9 g (SG90) after the MG996R swap -- it is ~55 g
# Motor/Prop are A2212 + 1045 nominal -- WEIGH THEM, these drive trim 1:1


def _inertia_yy_about_cm(shape):
    """Second moment about the CoM, Y axis, per unit density (mm^5)."""
    return shape.MatrixOfInertia.A22


def selftest():
    """Pin down FreeCAD's MatrixOfInertia convention instead of assuming it.

    Discriminator: build the same box at the origin and far away. If the
    matrix is about the CENTRE OF MASS the two agree; if it is about the
    global origin they do not.
    """
    import Part
    L, W, H = 40.0, 20.0, 10.0
    at_origin = Part.makeBox(L, W, H)
    far = Part.makeBox(L, W, H, App.Vector(500, 0, 300))
    i0 = _inertia_yy_about_cm(at_origin)
    i1 = _inertia_yy_about_cm(far)
    analytic = (L * W * H) * (L * L + H * H) / 12.0   # volume-weighted
    ok = abs(i0 - i1) < 1e-6 and abs(i0 - analytic) / analytic < 1e-9
    print("selftest  I_yy origin=%.1f far=%.1f analytic=%.1f -> %s"
          % (i0, i1, analytic, "about CoM, volume-weighted" if ok else "UNKNOWN"))
    if not ok:
        raise RuntimeError("MatrixOfInertia convention is not what the maths assumes")


def shape_props(shape):
    """(volume, cx, cz, I_yy about the combined CoM) -- compound-safe.

    A Part.Compound has no .CenterOfMass, so always reduce to .Solids and
    recombine by hand. (Same trap the rocket evaluator hit.)
    """
    solids = shape.Solids if shape.Solids else [shape]
    V = sum(s.Volume for s in solids)
    if V <= 0:
        raise RuntimeError("zero-volume shape")
    cx = sum(s.Volume * s.CenterOfMass.x for s in solids) / V
    cz = sum(s.Volume * s.CenterOfMass.z for s in solids) / V
    iyy = 0.0
    for s in solids:
        c = s.CenterOfMass
        iyy += _inertia_yy_about_cm(s) + s.Volume * ((c.x - cx) ** 2 + (c.z - cz) ** 2)
    return V, cx, cz, iyy


def part_mass_g(obj):
    if obj.Name in FIXED_G:
        return FIXED_G[obj.Name]
    V = shape_props(obj.Shape)[0]
    return V / 1000.0 * RHO[MATERIAL.get(obj.Name, "PLA")]


def main():
    selftest()
    doc = App.openDocument(DOC)
    sh = doc.Params
    pivot_h = float(sh.pivot_height)
    cw_arm = float(sh.cw_arm)
    cw_mass_d = float(sh.cw_mass_d)

    rows, M, Sx, Sz, I = [], 0.0, 0.0, 0.0, 0.0
    for name in ROTATING:
        o = doc.getObject(name)
        if o is None:
            raise RuntimeError("missing object %s" % name)
        V, cx, cz, iyy_vol = shape_props(o.Shape)
        m = part_mass_g(o)
        # density that reproduces the assigned mass (handles the FIXED_G parts,
        # where a solid block stands in for a servo full of gears and air)
        rho_eff = m / V                             # g/mm^3
        icm = iyy_vol * rho_eff                     # g*mm^2 about the part CoM
        I += icm + m * (cx ** 2 + (cz - pivot_h) ** 2)
        M += m
        Sx += m * cx
        Sz += m * (cz - pivot_h)
        rows.append((o.Label, m, cx, cz - pivot_h))

    dx, dz = Sx / M, Sz / M

    print("\n%-20s %8s %10s %10s" % ("ROTATING PART", "mass g", "x mm", "z-piv mm"))
    for lbl, m, x, z in sorted(rows, key=lambda t: -t[1]):
        print("%-20s %8.2f %10.1f %10.1f" % (lbl, m, x, z))
    print("%-20s %8.2f %10.1f %10.1f" % ("TOTAL", M, dx, dz))

    print("\nAS DRAWN")
    print("  M   = %7.1f g      I = %.6f kg*m^2" % (M, I * 1e-9))
    print("  dx  = %+7.2f mm     (trim)      dz = %+7.2f mm  (stiffness)" % (dx, dz))
    if abs(dx) > 1.0:
        settle = math.degrees(math.atan2(dx, -dz))
        print("  OUT OF TRIM -- the CG hangs %.1f deg off level, so the beam will "
              "simply fall\n  to the %s side and sit on its stop. Trim before "
              "reading anything into dz." % (abs(settle), "-X" if dx < 0 else "+X"))

    # --- separate the two knobs -------------------------------------------
    # Everything except the counterweight mass, so the CW can be solved for.
    cwo = doc.getObject("CWMass")
    m_cw0 = part_mass_g(cwo)
    Vcw, cwx, cwz, icw_vol = shape_props(cwo.Shape)
    I_cw0 = icw_vol * (m_cw0 / Vcw) + m_cw0 * (cwx ** 2 + (cwz - pivot_h) ** 2)
    M0, Sx0, Sz0, I0 = (M - m_cw0, Sx - m_cw0 * cwx,
                        Sz - m_cw0 * (cwz - pivot_h), I - I_cw0)

    rho_steel = RHO["STEEL"] / 1000.0          # g/mm^3
    area = math.pi * (cw_mass_d / 2.0) ** 2
    R = cw_mass_d / 2.0

    def with_cw(m, d):
        """Totals with a counterweight of mass m (g) at height d (mm vs pivot)."""
        h = m / (rho_steel * area)
        icm = m * (3 * R * R + h * h) / 12.0
        Mt = M0 + m
        dxt = (Sx0 + m * (-cw_arm)) / Mt
        dzt = (Sz0 + m * d) / Mt
        It = I0 + icm + m * (cw_arm ** 2 + d * d)
        return Mt, dxt, dzt, It, h

    m_trim = Sx0 / cw_arm                       # makes dx exactly zero
    Mt, dxt, dzt, It, h_trim = with_cw(m_trim, float(sh.cw_offset))

    print("\nKNOB 1 -- COUNTERWEIGHT MASS  (sets trim, and inertia)")
    print("  now      %6.1f g  (%4.1f mm stack)  -> dx = %+6.2f mm" % (m_cw0, float(sh.cw_mass_h), dx))
    print("  trimmed  %6.1f g  (%4.1f mm stack)  -> dx = %+6.2f mm" % (m_trim, h_trim, dxt))

    print("\nKNOB 2 -- COUNTERWEIGHT HEIGHT  (sets stiffness, at the trimmed mass)")
    print("  at cw_offset %+.1f mm -> dz = %+.2f mm" % (float(sh.cw_offset), dzt))
    verdict(Mt, dzt, It)

    # offset that puts the CG exactly on the pivot
    d_neutral = -Sz0 / m_trim
    print("\n  cw_offset for NEUTRAL (dz = 0)      = %+7.1f mm" % d_neutral)
    for T in (1.0, 1.5, 2.0):
        # |dz| needed for period T, iterated because moving the mass moves I too
        d = d_neutral
        for _ in range(6):
            Mi, _, _, Ii, _ = with_cw(m_trim, d)
            need = (2 * math.pi / T) ** 2 * Ii / (Mi * G)   # |dz| in mm
            d = d_neutral - need
        print("  cw_offset for STABLE  T = %.1f s     = %+7.1f mm" % (T, d))
    print("  (more negative = lower = stiffer/stable; above neutral = inverted)")

    App.closeDocument(doc.Name)
    return dict(M=M, dx=dx, dz=dz, I=I * 1e-9, m_trim=m_trim, d_neutral=d_neutral)


def verdict(M, dz, I):
    if abs(dz) < 0.05:
        print("  plant = NEUTRAL (no gravity restoring torque -- drone-like)")
    elif dz < 0:
        wn = math.sqrt(M * G * abs(dz) / I)
        print("  plant = STABLE    wn = %.3f rad/s   T = %.3f s"
              % (wn, 2 * math.pi / wn))
    else:
        lam = math.sqrt(M * G * dz / I)
        print("  plant = INVERTED  lambda = %.3f 1/s   doubling time = %.3f s"
              % (lam, math.log(2) / lam))
