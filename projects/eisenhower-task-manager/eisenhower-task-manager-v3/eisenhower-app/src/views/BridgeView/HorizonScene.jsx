import React, { useState, useEffect, useRef } from 'react';
import {
  formatAbsolute,
  formatRelative,
  formatAnchor,
} from '../../lib/dateFormat';
import { QID_BY_QUAD } from '../../lib/quadrant';

/**
 * HorizonScene — wireframe-globe rendering of the Bridge "horizon"
 * mode. Camera at altitude H_CAM above the ship's sub-camera point,
 * looking straight at sphere centre (no tilt) — so the limb projects
 * to a true geometric circle. Spinning the globe pans viewAnchor
 * along the time axis. Lanes are 15° latitude bands packed
 * alternating-outward from the equator.
 *
 * NOTE — this file is still large (~700 lines). Step 7b in the
 * refactor punchlist will further split it into projection.js,
 * curves.js, useCameraDrag.js, useHorizonZoom.js, NightSide.jsx,
 * DateArcs.jsx, Wireframe.jsx, and TaskPip.jsx. For now this is
 * the single-file move that gets it out of App.jsx.
 */
export const HorizonScene = ({ tasks, lanes, laneOf, dayOffset, maxDays, setMaxDays, viewAnchor = 0, setViewAnchor, getQuadrant, onPick, labelMode = 'all' }) => {
  const W = 1000, H = 600;
  const N = lanes.length;
  const svgRef = React.useRef(null);

  /* True 3D sphere projection — latitude/longitude grid model.
     The ship sits on the equator at longitude 0; sphere center at world
     origin; rotation axis is the world Y axis. Ship sails east (toward
     +Z). A camera at altitude H_CAM directly above the ship
     ((R+H_CAM, 0, 0)) is pitched down by BETA to look across the
     visible surface.

     Lanes are LATITUDE lines (small circles parallel to the equator at
     constant world Y) — they DON'T converge at the ship, they run
     roughly parallel near the ship and curve away from each other
     toward the limb.

     Arcs are LONGITUDE lines (great-circle meridians at constant
     longitude east of ship) — each represents a calendar date; they
     run N-S across the visible surface, tilted by their distance east
     of the ship.

     The yellow horizon line is the actual limb of the sphere — the
     circle where the line-of-sight is tangent to the sphere. */
  /* WIREFRAME GLOBE — Google-Earth-style.

     Camera sits at altitude H_CAM directly above the sphere's "ship"
     point and stares straight at the sphere's centre. There is NO
     forward tilt. The limb (horizon) therefore projects to a perfect
     geometric circle centred in the chart, and the sphere reads as a
     proper globe rather than a tilted ground plane.

     World axes:  +X = radial-out at ship (toward camera)
                  +Y = "east" on the globe   (time axis)
                  +Z = "north" on the globe  (lane axis)

     The ship sits at the sub-camera point (lat=0, lon=0). Spinning the
     globe (drag-to-pan) changes viewAnchor, which shifts task longitudes
     and slides them across the visible cap. */
  const R = 100;
  const ALT_MIN = R * 0.15;                                  // ~ surface skim
  const ALT_MAX = R * 20;                                    // ~ deep space
  /* Default camera view — Picture6 framing, pulled back a tad so the
     globe's edges sit inside the chart with a small buffer.
     - cameraAlt = R      ⇒  α_limb = π/3 (60°), LIMB_R_PX ≈ 462.
                              Side buffer (CX − LIMB_R_PX) ≈ 38 px.
     - panY = 240         ⇒  ship at y ≈ 540 (bottom-centre, as before).
                              Top buffer (CY − LIMB_R_PX) ≈ 78 px.
     - panX = 0           ⇒  ship horizontally centred. */
  const [cameraAlt, setCameraAlt] = React.useState(R);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(240);
  const H_CAM = cameraAlt;
  const ALPHA_LIMB = Math.acos(R / (R + H_CAM));             // visible cap angular radius
  const COS_LIMB = Math.cos(ALPHA_LIMB);
  const SCALE = 800;
  /* Each lane occupies one 15° latitude band (one wireframe sector).
     Lanes fill the inner sectors first and step outward alternately
     left↔right, so:
       lane 0 → −7.5°  (first sector LEFT of equator, [−15°, 0°])
       lane 1 → +7.5°  (first sector RIGHT, [0°, +15°])
       lane 2 → −22.5° (second sector LEFT, [−30°, −15°])
       lane 3 → +22.5° (second sector RIGHT)
       … and so on.
     This keeps named lanes near the equator instead of pushing them
     to the visible pole, and aligns each lane's sector to a wireframe
     band — labels always sit at the band's centre. */
  const SECTOR_WIDTH = Math.PI / 12;            // 15°

  /* Alternating-outward sector packing — see SECTOR_WIDTH comment. */
  const laneLat = (i) => {
    const sign = (i % 2 === 0) ? -1 : +1;
    const ring = Math.floor(i / 2);                          // 0, 1, 2, …
    return sign * (ring + 0.5) * SECTOR_WIDTH;
  };

  /* Project a 3D world point to viewBox coords. Camera at
     (R + H_CAM, 0, 0), looking straight toward sphere centre:
        forward = (−1, 0, 0)
        right   = ( 0, 1, 0)   → screen-x = +east = forward in time
        up      = ( 0, 0, 1)   → screen-y = +north = up the lanes
     Forward depth is (R + H_CAM) − Px; on the visible hemisphere this
     is always positive, so visibility is decided by the great-circle
     cap test (cos lat · cos lon ≥ cos α_limb), not by depth sign. */
  const CX = W / 2 + panX, CY = H / 2 + panY;
  const project = (Px, Py, Pz) => {
    const f = (R + H_CAM) - Px;
    if (f < 0.05) return null;
    return {
      x: CX + (Py / f) * SCALE,
      y: CY - (Pz / f) * SCALE
    };
  };
  const projectLatLon = (lat, lon) => {
    const cL = Math.cos(lat);
    return project(R * cL * Math.cos(lon), R * Math.sin(lat), R * cL * Math.sin(lon));
  };
  const isVisible = (lat, lon) => Math.cos(lat) * Math.cos(lon) >= COS_LIMB - 1e-6;

  /* Map (day, lane index) to a viewBox point.
     Day → longitude: maxDays corresponds to ALPHA_LIMB (eastward limb
     at the equator). */
  const dayToLon = (d) => (d / maxDays) * ALPHA_LIMB;

  /* Each lane occupies its own 15° latitude band, centred on laneLat(i).
     This is independent of the other lanes' positions — each lane gets
     a clean sector aligned with the wireframe graticule. */
  const laneSectors = lanes.map((_, i) => {
    const c = laneLat(i);
    return [c - SECTOR_WIDTH / 2, c + SECTOR_WIDTH / 2];
  });

  /* Stable per-task hash for jittering inside a sector. djb2-style. */
  const hashId = (s) => {
    let h = 5381;
    const str = String(s);
    for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    return h;
  };

  /* The (lat, lon) a task occupies. Shared between pip projection and
     dependency-arc rendering so the arc endpoints land on the same
     jittered positions as the pips. */
  const taskLatLon = (d, laneIdx, taskId) => {
    const lon = Math.max(-ALPHA_LIMB, Math.min(ALPHA_LIMB, dayToLon(d)));
    const [lo, hi] = laneSectors[laneIdx] || [-ALPHA_LIMB, ALPHA_LIMB];
    const c = (lo + hi) / 2;
    const halfW = (hi - lo) / 2;
    const norm = (hashId(taskId) % 1000) / 1000 - 0.5;
    const lat = c + norm * halfW * 1.2;
    return { lat, lon };
  };
  const dayLaneToXY = (d, laneIdx, taskId) => {
    const { lat, lon } = taskLatLon(d, laneIdx, taskId);
    if (!isVisible(lat, lon)) return null;
    return projectLatLon(lat, lon);
  };

  /* Great-circle arc between two (lat, lon) points on the unit sphere,
     sampled via slerp in 3D Cartesian and projected. Returns the visible
     portion of the arc as a polyline; clips at the limb if either end
     leaves the visible cap. */
  const GC_SAMPLES = 32;
  const greatCircleArc = (latA, lonA, latB, lonB) => {
    const Pa = [
      R * Math.cos(latA) * Math.cos(lonA),
      R * Math.sin(latA),
      R * Math.cos(latA) * Math.sin(lonA),
    ];
    const Pb = [
      R * Math.cos(latB) * Math.cos(lonB),
      R * Math.sin(latB),
      R * Math.cos(latB) * Math.sin(lonB),
    ];
    const dot = (Pa[0]*Pb[0] + Pa[1]*Pb[1] + Pa[2]*Pb[2]) / (R * R);
    const omega = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (omega < 1e-5) return [];
    const sinO = Math.sin(omega);
    const pts = [];
    for (let i = 0; i <= GC_SAMPLES; i++) {
      const t = i / GC_SAMPLES;
      const wA = Math.sin((1 - t) * omega) / sinO;
      const wB = Math.sin(t * omega) / sinO;
      const Px = wA * Pa[0] + wB * Pb[0];
      const Py = wA * Pa[1] + wB * Pb[1];
      const Pz = wA * Pa[2] + wB * Pb[2];
      /* Visibility cap: a point on the sphere faces the camera when its
         X-component (radial-out) > R · cos α_limb. */
      if (Px < R * COS_LIMB) continue;
      const p = project(Px, Py, Pz);
      if (p) pts.push(p);
    }
    return pts;
  };

  /* Visibility helpers — a point (lat, lon) is visible if its great-circle
     distance from the ship is ≤ ALPHA_LIMB:
        cos(lat) · cos(lon) ≥ cos(ALPHA_LIMB)
     so the max longitude at given latitude is acos(cos α_limb / cos lat)
     and similarly for the max latitude at given longitude. */
  const lonMaxAtLat = (lat) => {
    const r = Math.cos(ALPHA_LIMB) / Math.cos(lat);
    return r > 1 ? 0 : Math.acos(r);
  };
  const latMaxAtLon = (lon) => {
    const r = Math.cos(ALPHA_LIMB) / Math.cos(lon);
    return r > 1 ? 0 : Math.acos(r);
  };

  /* Build a polyline path from an array of {x,y} samples. */
  const polyPath = (pts) => {
    if (!pts || pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
    return d;
  };

  /* Wheel zoom — snaps maxDays to a CURATED BREAKPOINT TABLE of
     natural calendar units. Each breakpoint also dictates its own
     minor/major line spacing, so every zoom level uses clean
     intervals (min / hr / day / week / month) — no awkward "12h
     between days" or 7.5-min ticks. */
  const _D = 1, _HR = 1/24, _MIN = 1/(24*60);
  const HORIZON_TIERS = [
    // horizon target | minor tick | major (labelled) tick
    { horizon: 15*_MIN, minor: _MIN,    major: 5*_MIN  },
    { horizon: 30*_MIN, minor: 5*_MIN,  major: 15*_MIN },
    { horizon: _HR,     minor: 5*_MIN,  major: 15*_MIN },
    { horizon: 3*_HR,   minor: 15*_MIN, major: _HR     },
    { horizon: 6*_HR,   minor: 30*_MIN, major: _HR     },
    { horizon: 12*_HR,  minor: _HR,     major: 3*_HR   },
    { horizon: _D,      minor: 3*_HR,   major: 6*_HR   },
    { horizon: 2*_D,    minor: 6*_HR,   major: 12*_HR  },
    { horizon: 3*_D,    minor: 6*_HR,   major: _D      },
    { horizon: 7*_D,    minor: 12*_HR,  major: _D      },
    { horizon: 14*_D,   minor: _D,      major: 7*_D    },  // ← 14-day sweet spot
    { horizon: 30*_D,   minor: _D,      major: 7*_D    },
    { horizon: 90*_D,   minor: 7*_D,    major: 14*_D   },
    { horizon: 180*_D,  minor: 14*_D,   major: 30*_D   },
    { horizon: 365*_D,  minor: 30*_D,   major: 90*_D   },
  ];
  const HORIZON_BREAKPOINTS = HORIZON_TIERS.map(t => t.horizon);
  React.useEffect(() => {
    const el = svgRef.current;
    if (!el || !setMaxDays) return;
    const handler = (e) => {
      e.preventDefault();
      let next;
      if (e.deltaY > 0) {
        // Zoom OUT — smallest breakpoint strictly greater than current.
        next = HORIZON_BREAKPOINTS.find(bp => bp > maxDays + 1e-9)
            ?? HORIZON_BREAKPOINTS[HORIZON_BREAKPOINTS.length - 1];
      } else {
        // Zoom IN — largest breakpoint strictly less than current.
        next = [...HORIZON_BREAKPOINTS].reverse().find(bp => bp < maxDays - 1e-9)
            ?? HORIZON_BREAKPOINTS[0];
      }
      if (Math.abs(next - maxDays) < 1e-9) return;
      setMaxDays(next);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [maxDays, setMaxDays]);

  /* Three drag modes:
     - LEFT-click    = SPIN (VERTICAL drag → viewAnchor along time axis).
                       Drag DOWN advances the ship forward in time; drag
                       UP rolls back. This matches the projection — in
                       our setup screen-up = +east (future), so dragging
                       DOWN pulls future toward the ship at the centre.
     - MIDDLE-click  = ALTITUDE (vertical drag → camera distance from
                       globe). Drag UP flies the drone closer.
                       Multiplicative scaling for constant-feel rate.
     - RIGHT-click   = PAN (translate the globe within the chart, 1:1
                       with cursor — same as Google Earth/Maya pan).
                       This is screen-space offset, not a sphere rotation. */
  const dragState  = React.useRef({ active: false, mode: null, startX: 0, startY: 0, startAnchor: 0, startAlt: 0, startPanX: 0, startPanY: 0, moved: false });
  const justDragged = React.useRef(false);
  const onPointerDown = (e) => {
    if (e.button === 1) {
      // Middle-click (wheel button): altitude
      dragState.current = { active: true, mode: 'alt', startY: e.clientY, startAlt: cameraAlt, moved: false };
      if (svgRef.current) svgRef.current.style.cursor = 'ns-resize';
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      e.preventDefault();
      return;
    }
    if (e.button === 2) {
      // Right-click: pan
      dragState.current = { active: true, mode: 'pan', startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY, moved: false };
      if (svgRef.current) svgRef.current.style.cursor = 'move';
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      e.preventDefault();
      return;
    }
    if (e.button !== undefined && e.button !== 0) return;
    if (!setViewAnchor) return;
    dragState.current = { active: true, mode: 'time', startY: e.clientY, startAnchor: viewAnchor, moved: false };
    if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onPointerMove = (e) => {
    const s = dragState.current;
    if (!s.active || !svgRef.current) return;
    if (s.mode === 'alt') {
      const dy = e.clientY - s.startY;
      if (Math.abs(dy) > 4) s.moved = true;
      const containerH = svgRef.current.clientHeight || 600;
      /* Drag UP → dy negative → factor < 1 → altitude shrinks (closer).
         Slope tuned so one full container-height drag is ~e^1.6 ≈ 5× change. */
      const factor = Math.exp(dy / Math.max(containerH, 1) * 1.6);
      const newAlt = Math.max(ALT_MIN, Math.min(ALT_MAX, s.startAlt * factor));
      setCameraAlt(newAlt);
      return;
    }
    if (s.mode === 'pan') {
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) s.moved = true;
      /* Convert screen-pixel delta → viewBox-unit delta so the globe
         tracks the cursor 1:1 even when the chart is resized. */
      const rect = svgRef.current.getBoundingClientRect();
      const sx = W / Math.max(rect.width,  1);
      const sy = H / Math.max(rect.height, 1);
      setPanX(s.startPanX + dx * sx);
      setPanY(s.startPanY + dy * sy);
      return;
    }
    const dy = e.clientY - s.startY;
    if (Math.abs(dy) > 4) s.moved = true;
    const containerH = svgRef.current.clientHeight || 600;
    const daysPerPx = (2 * maxDays) / Math.max(containerH, 1);
    setViewAnchor(s.startAnchor + dy * daysPerPx);
  };
  const onPointerUp = (e) => {
    const s = dragState.current;
    if (!s.active) return;
    justDragged.current = s.moved;
    dragState.current.active = false;
    if (svgRef.current) svgRef.current.style.cursor = '';
    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    setTimeout(() => { justDragged.current = false; }, 0);
  };
  const onContextMenu = (e) => e.preventDefault();
  const onClickCapture = (e) => {
    if (justDragged.current) { e.stopPropagation(); e.preventDefault(); }
  };

  /* Calendar-anchored grid arcs (meridians at constant longitude).
     Spacing comes from HORIZON_TIERS (same table the wheel snap uses):
     find the smallest tier whose `horizon` is ≥ current maxDays and
     use its minor/major spacing. Each tier is hand-picked from natural
     calendar units (min / hr / day / week / month). */
  const _tier = HORIZON_TIERS.find(t => t.horizon >= maxDays - 1e-9)
             ?? HORIZON_TIERS[HORIZON_TIERS.length - 1];
  const minorSpacing     = _tier.minor;
  const majorSpacing     = _tier.major;
  const halfMinorSpacing = minorSpacing / 2;
  const gridSpacing      = majorSpacing; // formatAbsolute granularity
  /* Iterate at half-minor resolution. Each step lands on exactly one of
     three tiers — major (labelled), minor, or half-minor — depending on
     whether absDays divides cleanly into major / minor. */
  const firstAbs = Math.ceil((viewAnchor - maxDays) / halfMinorSpacing) * halfMinorSpacing;
  const lastAbs  = Math.floor((viewAnchor + maxDays) / halfMinorSpacing) * halfMinorSpacing;
  const gridArcs = [];
  for (let absDays = firstAbs; absDays <= lastAbs + 1e-9; absDays += halfMinorSpacing) {
    const effOff = absDays - viewAnchor;
    if (Math.abs(effOff) > maxDays * 1.001) continue;
    const majRatio = absDays / majorSpacing;
    const minRatio = absDays / minorSpacing;
    const isMajor = Math.abs(majRatio - Math.round(majRatio)) < 1e-6;
    const isMinor = Math.abs(minRatio - Math.round(minRatio)) < 1e-6;
    gridArcs.push({ absDays, effOff, isMajor, isMinor });
  }

  /* LIMB — projects to a TRUE GEOMETRIC CIRCLE because the camera is
     looking straight at the sphere's centre. All limb points share the
     same depth f = (R + H_CAM) − R cos α_limb, so the projection of the
     limb circle (radius R sin α_limb in 3D) is a circle of radius
     LIMB_R_PX centred at the chart centre. */
  const LIMB_F_PX = (R + H_CAM) - R * Math.cos(ALPHA_LIMB);
  const LIMB_R_PX = (R * Math.sin(ALPHA_LIMB) / LIMB_F_PX) * SCALE;

  /* Sample a generic lat/lon curve and clip to the visibility cap. Used
     for both wireframe parallels (constant lat, varying lon) and
     wireframe meridians (constant lon, varying lat), plus the
     ETM-specific lane rails and date arcs. */
  const sampleCurve = (genPoint, samples = 80) => {
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const { lat, lon } = genPoint(t);
      if (!isVisible(lat, lon)) continue;
      const P = projectLatLon(lat, lon);
      if (P) pts.push(P);
    }
    return pts;
  };

  /* Parallel: constant lat, lon ∈ [−lonMax, +lonMax]. */
  const parallelPts = (lat) => {
    const lonMax = lonMaxAtLat(lat);
    if (lonMax < 0.001) return [];
    return sampleCurve(t => ({ lat, lon: -lonMax + 2 * lonMax * t }), 90);
  };

  /* Meridian: constant lon, lat ∈ [−latMax, +latMax]. */
  const meridianPts = (lon) => {
    const latMax = latMaxAtLon(lon);
    if (latMax < 0.001) return [];
    return sampleCurve(t => ({ lat: -latMax + 2 * latMax * t, lon }), 90);
  };

  /* Static wireframe grid — canonical 15° graticule. We walk OUTWARD
     from the equator/prime-meridian in 15° increments so the lines
     always land on 0°, ±15°, ±30°, ±45°, … regardless of α_limb. The
     equator (0°) and prime meridian are skipped here — they get a
     brighter axis style further down. */
  const GRID_STEP = 15 * Math.PI / 180;
  const wireframeLats = [];
  for (let k = 1; k * GRID_STEP <= ALPHA_LIMB + 1e-6; k++) {
    wireframeLats.push( k * GRID_STEP);
    wireframeLats.push(-k * GRID_STEP);
  }
  const wireframeLons = [];
  for (let k = 1; k * GRID_STEP <= ALPHA_LIMB + 1e-6; k++) {
    wireframeLons.push( k * GRID_STEP);
    wireframeLons.push(-k * GRID_STEP);
  }
  /* Effective offset for tasks (real days-until-due minus pan anchor). */
  const effOffset = (t) => dayOffset(t.dueDate, t.dueTime) - viewAnchor;
  const todayMs = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
  const sortedTasks = [...tasks].sort((a, b) => effOffset(b) - effOffset(a));

  /* Ship at (lat=0, lon=0). */
  const shipXY = projectLatLon(0, 0);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="bridge-scene bridge-scene--horizon"
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={onContextMenu}
      onClickCapture={onClickCapture}
    >
      <defs>
        <radialGradient id="bridge-globe" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%"   stopColor="rgba(40, 60, 95, 0.20)" />
          <stop offset="80%"  stopColor="rgba(20, 30, 50, 0.10)" />
          <stop offset="100%" stopColor="rgba(10, 18, 28, 0.00)" />
        </radialGradient>
        <clipPath id="bridge-globe-clip">
          <circle cx={CX} cy={CY} r={LIMB_R_PX} />
        </clipPath>
      </defs>

      {/* Faint globe-body wash inside the limb. */}
      <circle cx={CX} cy={CY} r={LIMB_R_PX} fill="url(#bridge-globe)" />

      <g clipPath="url(#bridge-globe-clip)">
        {/* Parallels (constant latitude) — every 15°, INCLUDING the
            equator. All latitudes share the lane-rail style because they
            all represent task lanes. */}
        {wireframeLats.map((lat) => {
          const pts = parallelPts(lat);
          if (pts.length < 2) return null;
          return <path key={`wp${lat.toFixed(4)}`} d={polyPath(pts)} fill="none" className="bridge-lane-rail" />;
        })}
        {(() => {
          const eq = parallelPts(0);
          return eq.length >= 2
            ? <path d={polyPath(eq)} fill="none" className="bridge-lane-rail" />
            : null;
        })()}
        {/* Meridians (constant longitude) — every 15°, plus prime
            meridian as a brighter axis line. */}
        {wireframeLons.map((lon) => {
          const pts = meridianPts(lon);
          if (pts.length < 2) return null;
          return <path key={`wm${lon.toFixed(4)}`} d={polyPath(pts)} fill="none" className="bridge-wire" />;
        })}
        {(() => {
          const pm = meridianPts(0);
          return pm.length >= 2
            ? <path d={polyPath(pm)} fill="none" className="bridge-wire bridge-wire--axis" />
            : null;
        })()}

        {/* Calendar-anchored meridian PATHS — date marks; spin with
            viewAnchor. Labels are rendered AFTER this clipped block so
            they can sit on the limb without being clipped. */}
        {gridArcs.map(({ absDays, effOff, isMajor, isMinor }) => {
          const lon = dayToLon(effOff);
          if (Math.abs(lon) > ALPHA_LIMB) return null;
          const pts = meridianPts(lon);
          if (pts.length < 2) return null;
          const arcCls = isMajor ? 'bridge-range-arc'
            : isMinor              ? 'bridge-range-arc bridge-range-arc--minor'
            :                        'bridge-range-arc bridge-range-arc--half-minor';
          return <path key={absDays.toFixed(4)} d={polyPath(pts)} fill="none" className={arcCls} />;
        })}

        {/* NIGHT-SIDE wash + TODAY meridian. The night region is the
            past half of the visible cap — bounded by the TODAY
            meridian on the future side, and by the past arc of the
            limb on the other. We compute the arc's large-flag from
            the angular distance between the meridian's two limb
            endpoints, so the wash correctly covers the past slice
            whether it's a half-disk (viewAnchor = 0) or a near-full
            disk (when today has panned far into the past direction). */}
        {(() => {
          const todayLon = dayToLon(-viewAnchor);
          if (Math.abs(todayLon) >= ALPHA_LIMB - 1e-6) return null;
          const meridPts = meridianPts(todayLon);
          if (meridPts.length < 2) return null;
          const south = meridPts[0];
          const north = meridPts[meridPts.length - 1];
          /* CW angular distance from north to south around limb centre. */
          const sA = Math.atan2(south.y - CY, south.x - CX);
          const nA = Math.atan2(north.y - CY, north.x - CX);
          const cwLen = ((sA - nA) + 2 * Math.PI) % (2 * Math.PI);
          const largeArc = cwLen > Math.PI ? 1 : 0;
          let nightD = `M ${south.x.toFixed(2)} ${south.y.toFixed(2)}`;
          for (let i = 1; i < meridPts.length; i++) {
            nightD += ` L ${meridPts[i].x.toFixed(2)} ${meridPts[i].y.toFixed(2)}`;
          }
          nightD += ` A ${LIMB_R_PX.toFixed(2)} ${LIMB_R_PX.toFixed(2)} 0 ${largeArc} 1 ${south.x.toFixed(2)} ${south.y.toFixed(2)} Z`;
          return (
            <>
              <path d={nightD} className="bridge-nightside" />
              <path d={polyPath(meridPts)} fill="none" className="bridge-range-arc bridge-range-arc--today" />
            </>
          );
        })()}

        {/* Lane labels — horizontally centred on the projection of each
            lane's centre latitude on the prime meridian, then shifted
            DOWN by LABEL_OFFSET so they sit clear of any task pips
            riding the central horizontal line. */}
        {(() => {
          const LABEL_OFFSET = 22;     // px below the meridian
          return lanes.map((laneName, i) => {
            const lat = laneLat(i);
            const pt = projectLatLon(lat, 0);
            if (!pt) return null;
            return (
              <text key={laneName}
                    x={pt.x} y={pt.y + LABEL_OFFSET}
                    textAnchor="middle"
                    className="bridge-lane-label">{laneName.toUpperCase()}</text>
            );
          });
        })()}
      </g>

      {/* Limb — TRUE GEOMETRIC CIRCLE, drawn over the clipped contents. */}
      <circle cx={CX} cy={CY} r={LIMB_R_PX} fill="none" className="bridge-horizon" />

      {/* Date-arc labels — OUTSIDE the clipPath so they can sit on or
          past the limb. Each major meridian gets two labels:
            - DATE  (absolute) at the south endpoint, extending leftward
            - TIME  (relative offset) at the north endpoint, extending rightward
          South/north are determined by leftmost/rightmost projected
          sample of the meridian — in this projection that's directly the
          lateral endpoints of the arc on the limb. */}
      {gridArcs.filter(g => g.isMajor).map(({ absDays, effOff }) => {
        const lon = dayToLon(effOff);
        if (Math.abs(lon) > ALPHA_LIMB) return null;
        const pts = meridianPts(lon);
        if (pts.length < 2) return null;
        let leftPt = pts[0], rightPt = pts[0];
        for (const p of pts) {
          if (p.x < leftPt.x) leftPt = p;
          if (p.x > rightPt.x) rightPt = p;
        }
        const refMs = todayMs + absDays * 86400000;
        const absText = formatAbsolute(refMs, gridSpacing);
        const relText = formatRelative(effOff);
        return (
          <g key={`lbl${absDays.toFixed(4)}`}>
            <text x={leftPt.x - 6}  y={leftPt.y  + 3}
                  textAnchor="end"
                  className="bridge-range-label bridge-range-label--abs">{absText}</text>
            <text x={rightPt.x + 6} y={rightPt.y + 3}
                  textAnchor="start"
                  className="bridge-range-label">{relText}</text>
          </g>
        );
      })}

      {/* TODAY label — gold "NOW" at both ends of the today meridian. */}
      {(() => {
        const todayLon = dayToLon(-viewAnchor);
        if (Math.abs(todayLon) > ALPHA_LIMB) return null;
        const pts = meridianPts(todayLon);
        if (pts.length < 2) return null;
        let leftPt = pts[0], rightPt = pts[0];
        for (const p of pts) {
          if (p.x < leftPt.x) leftPt = p;
          if (p.x > rightPt.x) rightPt = p;
        }
        return (
          <g>
            <text x={leftPt.x - 6}  y={leftPt.y + 3}  textAnchor="end"
                  className="bridge-range-label bridge-range-label--today">NOW</text>
            <text x={rightPt.x + 6} y={rightPt.y + 3} textAnchor="start"
                  className="bridge-range-label bridge-range-label--today">NOW</text>
          </g>
        );
      })()}

      {/* Dependency arcs — great-circle paths from each prerequisite to
          its dependent. Drawn BEFORE pips so pips sit on top. */}
      {(() => {
        const byId = new Map(tasks.map(t => [t.id, t]));
        const arcs = [];
        tasks.forEach(t => {
          if (!Array.isArray(t.dependsOn) || t.dependsOn.length === 0) return;
          const tEff = effOffset(t);
          if (Math.abs(tEff) / maxDays > 1.0) return;
          const target = taskLatLon(tEff, laneOf(t), t.id);
          if (!isVisible(target.lat, target.lon)) return;
          t.dependsOn.forEach(depId => {
            const src = byId.get(depId);
            if (!src) return;
            const sEff = effOffset(src);
            if (Math.abs(sEff) / maxDays > 1.0) return;
            const source = taskLatLon(sEff, laneOf(src), src.id);
            if (!isVisible(source.lat, source.lon)) return;
            const pts = greatCircleArc(source.lat, source.lon, target.lat, target.lon);
            if (pts.length >= 2) arcs.push({ key: `${depId}->${t.id}`, d: polyPath(pts) });
          });
        });
        return arcs.map(a => (
          <path key={a.key} d={a.d} fill="none" className="bridge-dep-arc" />
        ));
      })()}

      {/* Task pips — both past (negative effOff) and future tasks visible.
          - Colour : ETM quadrant (existing bridge-pip--q{1..4} classes).
          - Size   : log-scaled to the task's effort estimate in hours.
                    A faint distance attenuation is also applied so far
                    tasks read as slightly recessed. */}
      {sortedTasks.map(t => {
        const d_eff = effOffset(t);
        if (Math.abs(d_eff) / maxDays > 1.0) return null;
        const xy = dayLaneToXY(d_eff, laneOf(t), t.id);
        if (!xy) return null;
        const qid = QID_BY_QUAD[getQuadrant(t)] || 'q4';
        const isDone = (Number(t.percentComplete) || 0) >= 100;
        const tNorm = Math.abs(d_eff) / maxDays;
        /* Effort → hours. days/weeks normalised against an 8 h workday
           and 40 h workweek; unknown estimates default to a small pip. */
        const unit = t.timeEstimateUnit || 'hours';
        const val  = Number(t.timeEstimateValue) || 0;
        const hours = val <= 0 ? 0 : (
          unit === 'minutes' ? val / 60 :
          unit === 'days'    ? val * 8 :
          unit === 'weeks'   ? val * 40 :
          val                                                 // hours
        );
        /* log₂(h) maps   0.5 h → −1   1 h → 0   8 h → 3   40 h → 5.3.
           Linear remap to a scale window of [0.5, 1.6]. */
        const sizeScale = hours <= 0
          ? 0.65
          : Math.max(0.45, Math.min(1.6, 0.65 + Math.log2(Math.max(0.25, hours)) * 0.18));
        /* Gentle distance attenuation: 1.0 at ship, 0.8 at limb. */
        const distScale = Math.max(0.8, 1 - tNorm * 0.2);
        const scale = sizeScale * distScale;
        const sizeShowsLabel = scale > 0.7;
        const modeShowsLabel =
            labelMode === 'none'       ? false
          : labelMode === 'incomplete' ? !isDone
          : labelMode === 'tracked'    ? !!t.tracked
          :                              true; // 'all'
        const showLabel = sizeShowsLabel && modeShowsLabel;
        const labelText = t.task.length > 22 ? t.task.slice(0, 20) + '…' : t.task;
        return (
          <g key={t.id}
             className={`bridge-pip bridge-pip--${qid} ${isDone ? 'bridge-pip--done' : ''}`}
             onPointerDown={(e) => e.stopPropagation()}
             onClick={(e) => { e.stopPropagation(); onPick(t); }}
             style={{ cursor: 'pointer' }}>
            {/* Ring + blip only for LIVE targets — completed pips are
                stripped down to the core. */}
            {!isDone && (
              <>
                <circle cx={xy.x} cy={xy.y} r={11 * scale}
                        className="bridge-pip__blip"
                        style={{ animationDelay: `${(hashId(t.id) % 340) / 100}s` }} />
                <circle cx={xy.x} cy={xy.y} r={11 * scale} className="bridge-pip__ring" />
              </>
            )}
            <circle cx={xy.x} cy={xy.y} r={5  * scale} className="bridge-pip__core" />
            {showLabel && (
              <text x={xy.x + 13 * scale} y={xy.y + 4}
                    className="bridge-pip__label"
                    style={{ fontSize: `${10 * scale}px` }}>{labelText}</text>
            )}
            <title>{t.task} · due {new Date(t.dueDate).toLocaleDateString()}</title>
          </g>
        );
      })}

      {/* Ship marker — sub-camera point sits at chart centre. */}
      <g transform={`translate(${CX}, ${CY})`}>
        <circle r={6} className="bridge-ship-core" />
        <circle r={11} fill="none" className="bridge-ship-ring" />
        <text x={0} y={28} textAnchor="middle" className="bridge-ship-label">
          {formatAnchor(viewAnchor)}
        </text>
        {Math.abs(viewAnchor) >= 1/48 && (
          <text x={0} y={42} textAnchor="middle" className="bridge-ship-date">
            {formatAbsolute(todayMs + viewAnchor * 86400000, Math.abs(viewAnchor))}
          </text>
        )}
      </g>

      {/* HUD frame */}
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} className="bridge-frame" />
    </svg>
  );
};
