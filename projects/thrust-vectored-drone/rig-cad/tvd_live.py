"""Live in-GUI rebuild watcher. Imported by TVD_Live.FCMacro.

Lives in a REAL module, not in the macro, on purpose: FreeCAD tears down a
macro's namespace once the macro returns, which can leave a QTimer callback
holding cleared globals -- every tick then throws where nobody is looking. That
is what stopped the first version dead while it still reported "watching".

Other things learned the hard way and encoded here:
  * QTimer, never a watchdog thread. The FreeCAD API is not thread-safe and the
    threaded version died in access violations.
  * The timer is parked on App so the garbage collector cannot take it.
  * A HEARTBEAT file, so whether this is alive is an observable fact rather
    than something anyone has to be asked.
"""
import os
import sys
import traceback

import FreeCAD as App

HERE = os.path.dirname(os.path.abspath(__file__))
FLAG = os.path.join(HERE, ".rebuild")
BEAT = os.path.join(HERE, ".live_heartbeat")
DOCNAME = "TVD_TestRig_Mk0"
POLL_MS = 1200

_ticks = 0


def rebuild():
    """Close, rebuild in-process, refit. GUI thread only."""
    import FreeCADGui as Gui
    if HERE not in sys.path:
        sys.path.insert(0, HERE)
    sys.dont_write_bytecode = True

    for name in list(App.listDocuments()):
        if name.startswith(DOCNAME):
            App.closeDocument(name)

    import importlib
    import hardware
    import hardware_struct
    import build_rig
    for m in (hardware, hardware_struct, build_rig):
        importlib.reload(m)

    doc = build_rig.main()
    Gui.ActiveDocument = Gui.getDocument(doc.Name)
    Gui.activeDocument().activeView().viewIsometric()
    Gui.SendMsgToActiveView("ViewFit")
    App.Console.PrintMessage("TVD live: rebuilt (%d objects)\n" % len(doc.Objects))
    return doc


def tick():
    global _ticks
    _ticks += 1
    try:
        with open(BEAT, "w") as fh:
            fh.write("%d\n" % _ticks)
    except OSError:
        pass
    if not os.path.exists(FLAG):
        return
    try:
        os.remove(FLAG)
    except OSError:
        return                      # half-written; take it next tick
    try:
        rebuild()
    except Exception:
        App.Console.PrintError("TVD live rebuild FAILED:\n%s\n"
                               % traceback.format_exc())


def start():
    from PySide6 import QtCore     # 1.1 has no PySide shim
    old = getattr(App, "_tvd_live_timer", None)
    if old is not None:
        try:
            old.stop()
        except Exception:
            pass
        App._tvd_live_timer = None
        App.Console.PrintMessage("TVD live: STOPPED\n")
        return False

    t = QtCore.QTimer()
    t.setInterval(POLL_MS)
    t.timeout.connect(tick)
    t.start()
    App._tvd_live_timer = t         # park it or the GC takes it
    App.Console.PrintMessage(
        "TVD live: watching .rebuild every %.1f s -- run the macro again to "
        "stop\n" % (POLL_MS / 1000.0))
    return True
