"""Structural fasteners -- everything below the rotating assembly.

The holes for all of these already existed in build_rig; what was missing was
the HARDWARE, which is why check_rig could not see any of it. Same blind spot
that hid the buried nuts: a fastener that is not modelled cannot clash.

Convention here: every bolt enters from ABOVE (default fastener orientation,
head up / body down) and takes a plain hex nut underneath, in open air where a
spanner can reach it. No traps -- unlike the horn and servo joints, none of
these are captive once assembled.

Seat planes are expressions, so a bolt tracks the face it lands on.
"""
import FreeCAD as App

from hardware import screw, SOCKET_CAP, HEX_NUT


def joint_bolts(doc):
    """Two M5x30 per arm through the hub socket -- the plug joint's retention.

    Chosen over one bolt or a grub screw: two at 1/3 and 2/3 of the tongue stop
    the arm rotating about a single fastener as the socket wears. This joint
    carries the prop's whole moment and any slop here reads straight through to
    the encoder, which sees 0.13 deg of play at 43 mm engagement even when tight.
    """
    top = "Params.pivot_height + Params.hub_thk / 2"
    bot = "Params.pivot_height - Params.hub_thk / 2 - Params.nut_m5_thk"
    made = []
    for s, sg in ((1, "+"), (-1, "-")):
        for n in ("1", "2"):
            tag = "%s%s" % ("P" if s > 0 else "N", n)
            x = "%sParams.jbolt_dx%s" % ("" if s > 0 else "-", n)
            made.append(screw(doc, "FS_Joint%s" % tag, SOCKET_CAP, "M5",
                              length_expr="Params.jbolt_len",
                              pos=(x, "0", top)))
            made.append(screw(doc, "FS_JointNut%s" % tag, HEX_NUT, "M5",
                              pos=(x, "0", bot)))
    return made


def saddle_bolts(doc):
    """Two M5x30 clamping the servo bracket's saddle down onto the motor arm.

    This is what stops the whole servo/gimbal stack walking along the beam
    under vibration -- the saddle locates it, these hold it.
    """
    top = ("Params.pivot_height + Params.beam_thk / 2"
           " + Params.yoke_base_thk")
    bot = ("Params.pivot_height - Params.beam_thk / 2"
           " - Params.nut_m5_thk")
    made = []
    for i, sx in enumerate((1, -1)):
        x = ("Params.yoke_base_xc %s Params.yoke_bolt_dx"
             % ("+" if sx > 0 else "-"))
        y = "0"
        made.append(screw(doc, "FS_Saddle%d" % i, SOCKET_CAP, "M5",
                          length_expr="Params.saddle_bolt_len",
                          pos=(x, y, top)))
        made.append(screw(doc, "FS_SaddleNut%d" % i, HEX_NUT, "M5",
                          pos=(x, y, bot)))
    return made


def foot_bolts(doc):
    """Two M3x20 per upright foot, down through the base plate.

    Origin is the base plate's TOP face, so the foot sits 0..upright_foot_thk
    and the plate hangs -base_thk..0 -- the nut goes under the plate.
    """
    top = "Params.upright_foot_thk"
    # recessed into BaseNutPocket, so it does not hold the plate off the bench
    bot = "-Params.base_thk"
    made = []
    for sy, ytag in ((1, "P"), (-1, "N")):
        for sx, xtag in ((1, "P"), (-1, "N")):
            tag = ytag + xtag
            x = "%sParams.upright_bolt_dx" % ("" if sx > 0 else "-")
            y = "%sParams.foot_bolt_y" % ("" if sy > 0 else "-")
            made.append(screw(doc, "FS_Foot%s" % tag, SOCKET_CAP, "M3",
                              length_expr="Params.foot_bolt_len",
                              pos=(x, y, top)))
            made.append(screw(doc, "FS_FootNut%s" % tag, HEX_NUT, "M3",
                              pos=(x, y, bot)))
    return made


def sensor_bolts(doc):
    """Two M3 through the +Y upright into the sensor bracket's legs.

    These run along +Y, not down, so they need the rotation that maps the
    fastener's own -Z body direction onto +Y. No nuts: they thread into the
    printed leg, and the bracket carries only a PCB.
    """
    rot = App.Rotation(App.Vector(1, 0, 0), 90)
    head = "Params.upright_y - Params.upright_thk / 2"
    made = []
    for sx, tag in ((1, "P"), (-1, "N")):
        x = "%sParams.sensor_bolt_dx" % ("" if sx > 0 else "-")
        made.append(screw(doc, "FS_Sens%s" % tag, SOCKET_CAP, "M3",
                          length_expr="Params.sens_bolt_len",
                          pos=(x, head, "Params.pivot_height"), rot=rot))
    return made


def rod_nuts(doc):
    """Lock nuts on the two M5 threaded rods.

    The counterweight rod is the trim adjustment and the keel rod sets gravity
    stiffness, so both get a nut each side of the part they pass through --
    that is what makes the setting hold instead of drifting under vibration.
    """
    made = []
    # the nuts now clamp the CARRIAGE, not the bare beam
    cw_top = "Params.pivot_height + Params.cw_car_h / 2"
    cw_bot = "Params.pivot_height - Params.cw_car_h / 2 - Params.nut_m5_thk"
    for tag, z in (("Up", cw_top), ("Dn", cw_bot)):
        made.append(screw(doc, "FS_CWRodNut%s" % tag, HEX_NUT, "M5",
                          pos=("-Params.cw_arm", "0", z)))
    return made


def all_struct(doc):
    return (joint_bolts(doc) + saddle_bolts(doc) + foot_bolts(doc)
            + sensor_bolts(doc) + rod_nuts(doc))
