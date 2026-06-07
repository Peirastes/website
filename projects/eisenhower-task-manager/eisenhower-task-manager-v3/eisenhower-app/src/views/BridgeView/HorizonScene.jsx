import React, { useState, useEffect, useRef } from 'react';
import {
  formatAbsolute,
  formatRelative,
  formatAnchor,
} from '../../lib/dateFormat';
import { QID_BY_QUAD } from '../../lib/quadrant';
import {
  R,
  hashId,
  polyPath,
  HORIZON_TIERS,
  SECTOR_WIDTH,
  laneLat,
  makeProjection,
} from './projection';
import { useHorizonZoom } from './useHorizonZoom';
import { useCameraDrag } from './useCameraDrag';

/**
 * HorizonScene — wireframe-globe rendering of the Bridge "horizon"
 * mode. Camera at altitude H_CAM above the ship's sub-camera point,
 * looking straight at sphere centre (no tilt) — so the limb projects
 * to a true geometric circle. Spinning the globe pans viewAnchor
 * along the time axis. Lanes are 15° latitude bands packed
 * alternating-outward from the equator.
 *
 * Pure math + constants live in projection.js (R, hashId, polyPath,
 * HORIZON_TIERS, SECTOR_WIDTH, laneLat, makeProjection). The wheel-
 * zoom breakpoint snap is useHorizonZoom. Camera state + drag
 * handlers still live inline here.
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
  const ALT_MIN = R * 0.15;                                  // ~ surface skim
  const ALT_MAX = R * 20;                                    // ~ deep space
  const SCALE = 800;
  /* Camera state + drag handlers come from useCameraDrag. Defaults
     (cameraAlt = R, panX = 0, panY = 240) reproduce the Picture6
     framing — globe inscribed in chart with ~38 px side buffer + ship
     anchored bottom-centre. */
  const { cameraAlt, panX, panY, handlers: dragHandlers } = useCameraDrag({
    svgRef,
    init: { cameraAlt: R, panX: 0, panY: 240 },
    bounds: { ALT_MIN, ALT_MAX },
    viewBox: { W, H },
    maxDays,
    viewAnchor,
    setViewAnchor,
  });
  const H_CAM = cameraAlt;

  /* Camera-bound projection helpers from projection.js. The factory
     closes over (H_CAM, SCALE, CX, CY) and returns project,
     projectLatLon, isVisible, lonMaxAtLat, latMaxAtLon, greatCircleArc,
     plus the derived ALPHA_LIMB + COS_LIMB. */
  const CX = W / 2 + panX, CY = H / 2 + panY;
  const {
    ALPHA_LIMB,
    COS_LIMB,
    project,
    projectLatLon,
    isVisible,
    lonMaxAtLat,
    latMaxAtLon,
    greatCircleArc,
  } = makeProjection({ H_CAM, SCALE, CX, CY });

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

  /* Wheel zoom — snaps maxDays to HORIZON_BREAKPOINTS (see projection.js). */
  useHorizonZoom(svgRef, maxDays, setMaxDays);

  /* Drag handlers live in useCameraDrag (left/middle/right + the
     drag-suppress capture). Spread `dragHandlers` onto the SVG. */

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
      {...dragHandlers}
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
