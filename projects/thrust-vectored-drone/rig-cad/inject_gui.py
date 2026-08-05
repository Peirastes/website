"""Write a GuiDocument.xml into the built .FCStd.

freecadcmd has no GUI, so it never writes GuiDocument.xml -- the part of the
archive that holds VIEW state. Visibility in the tree is a ViewObject property
living in that file, so the App-level Visibility the build script sets never
reaches the view: FreeCAD invents ViewProviders from defaults on every open.

That is why the model kept opening with everything hidden no matter what the
build reported. This closes the loop so a headless build can be watched live.

Only Visibility is written. Every other view property is left absent so FreeCAD
fills its own defaults -- we are not trying to own colours or display modes.

Run directly (plain Python, no FreeCAD needed):
    python inject_gui.py
"""
import os
import shutil
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
DOC = os.path.join(HERE, "TVD_TestRig_Mk0.FCStd")

HEAD = """<?xml version='1.0' encoding='utf-8'?>
<!--
 FreeCAD Document, see https://www.freecad.org for more information...
-->
<Document SchemaVersion="1" HasExpansion="1">
    <Expand />
    <ViewProviderData Count="%d">
"""
ENTRY = """        <ViewProvider name="%s" expanded="0">
            <Properties Count="1" TransientCount="0">
                <Property name="Visibility" type="App::PropertyBool" status="1">
                    <Bool value="%s"/>
                </Property>
            </Properties>
        </ViewProvider>
"""
TAIL = """    </ViewProviderData>
%s</Document>
"""

# View orientations, in FreeCAD's own convention. These are its isometric
# quaternion rotated about the vertical -- derived that way rather than from
# first principles, because FreeCAD's up-vector convention does not match the
# obvious look-at construction and the isometric value is the ground truth.
#
#   name              axis (x, y, z)                        angle   camera dir
VIEWS = {
    "front_right_top": ((0.42735, 0.17792, 0.88622), 1.0195, (1, -1, 1)),
    # Captured from a view Cole set by hand and saved -- his sign convention on
    # the axis, not a derived one. Camera dir confirmed by rotating (0,0,-1) by
    # this quaternion: it looks along (+1,+1,-1), i.e. sits at (-1,-1,+1).
    "front_left_top":  ((-0.74290591, 0.3077217, 0.59447277), 5.0660691,
                        (-1, -1, 1)),
    "rear_right_top":  ((0.09057, 0.21978, 0.97134), 2.5082, (1, 1, 1)),
    "rear_left_top":   ((-0.09629, 0.23128, 0.96811), 4.0360, (-1, 1, 1)),
}
VIEW = "front_left_top"          # isometric, top-left-front


def camera_xml(centre, radius):
    """An orthographic camera framing a sphere of `radius` about `centre`.

    Without this FreeCAD invents its own camera on open, which lands zoomed
    into wherever it feels like. `height` is what actually sets the zoom for an
    orthographic view -- position only moves the eye along the view axis.
    """
    if radius <= 0:
        return ""
    axis, angle, vdir = VIEWS[VIEW]
    n = (vdir[0] ** 2 + vdir[1] ** 2 + vdir[2] ** 2) ** 0.5
    vdir = tuple(c / n for c in vdir)
    d = radius * 3.0
    pos = tuple(centre[i] + vdir[i] * d for i in range(3))
    settings = (
        "OrthographicCamera {\n"
        "  viewportMapping ADJUST_CAMERA\n"
        "  position %.6f %.6f %.6f\n"
        "  orientation %.6f %.6f %.6f  %.6f\n"
        "  nearDistance %.6f\n"
        "  farDistance %.6f\n"
        "  aspectRatio 1\n"
        "  focalDistance %.6f\n"
        "  height %.6f\n"
        "\n}\n"
        % (pos[0], pos[1], pos[2],
           axis[0], axis[1], axis[2], angle,
           max(0.1, d - radius * 1.5), d + radius * 2.0,
           d, radius * 2.2))          # 2.2 -> a little margin around the model
    return '    <Camera settings="%s"/>\n' % settings.replace("\n", "&#10;")


def visible_set(path):
    """Read App-level Visibility straight out of Document.xml.

    Avoids needing FreeCAD at all: the build already decided what should show,
    this just mirrors that decision into the view layer.
    """
    import re
    with zipfile.ZipFile(path) as z:
        xml = z.read("Document.xml").decode("utf-8", "replace")
    names, vis = [], {}
    # objects appear as <Object name="..."> ... and their properties follow in
    # an ObjectData block; parse the ObjectData block for Visibility
    for m in re.finditer(r'<Object name="([^"]+)"', xml):
        n = m.group(1)
        if n not in names:
            names.append(n)
    for m in re.finditer(
            r'<Object name="([^"]+)"[^>]*>(.*?)</Object>', xml, re.S):
        name, body = m.group(1), m.group(2)
        vm = re.search(
            r'<Property name="Visibility".*?<Bool value="(\w+)"', body, re.S)
        if vm:
            vis[name] = vm.group(1) == "true"
    return names, vis


def main(centre=None, radius=None):
    names, vis = visible_set(DOC)
    known = [n for n in names if n in vis]
    if not known:
        raise RuntimeError("no Visibility properties found in Document.xml")

    parts = [HEAD % len(known)]
    for n in known:
        parts.append(ENTRY % (n, "true" if vis[n] else "false"))
    cam = camera_xml(centre, radius) if centre and radius else ""
    parts.append(TAIL % cam)
    gui = "".join(parts)

    tmp = DOC + ".tmp"
    with zipfile.ZipFile(DOC) as zin, zipfile.ZipFile(
            tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            if item.filename == "GuiDocument.xml":
                continue
            zout.writestr(item, zin.read(item.filename))
        zout.writestr("GuiDocument.xml", gui)
    shutil.move(tmp, DOC)

    shown = sum(1 for n in known if vis[n])
    print("GuiDocument.xml written: %d view providers, %d visible, %d hidden%s"
          % (len(known), shown, len(known) - shown,
             ", camera fit to r=%.0f" % radius if cam else ", no camera"))


if __name__ == "__main__":
    main()
