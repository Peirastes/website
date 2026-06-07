/**
 * Pure math + constants for the wireframe-globe Bridge view. No
 * React, no state — everything is either a constant or takes the
 * camera params as explicit arguments (or via the makeProjection
 * factory, which closes over them once).
 *
 * World axes (matches HorizonScene's projection convention):
 *   +X = radial-out at ship (toward camera)
 *   +Y = "east" on the globe (time axis)
 *   +Z = "north" on the globe (lane axis)
 */

/** Sphere radius in viewBox units. Used for sphere→screen projection
 *  and the great-circle slerp distance metric. */
export const R = 100;

/** djb2-style string hash. Used for stable per-task jitter inside
 *  a sector and for staggering radar-blip animation phase. */
export const hashId = (s) => {
  let h = 5381;
  const str = String(s);
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return h;
};

/** Build an SVG polyline path string from an array of {x, y} samples. */
export const polyPath = (pts) => {
  if (!pts || pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
  return d;
};

/** Wheel-zoom horizon-distance ladder. Each tier defines a target
 *  horizon (in fractional days) plus the minor/major spacing for the
 *  date-grid arcs at that zoom level. */
const _D = 1, _HR = 1/24, _MIN = 1/(24*60);
export const HORIZON_TIERS = [
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
export const HORIZON_BREAKPOINTS = HORIZON_TIERS.map(t => t.horizon);

/** One lane = one 15° latitude band. */
export const SECTOR_WIDTH = Math.PI / 12;

/** Lane index → centre latitude. Alternates left/right and steps
 *  outward, so lane[0]=−7.5°, [1]=+7.5°, [2]=−22.5°, [3]=+22.5°, … */
export const laneLat = (i) => {
  const sign = (i % 2 === 0) ? -1 : +1;
  const ring = Math.floor(i / 2);
  return sign * (ring + 0.5) * SECTOR_WIDTH;
};

/**
 * Factory that returns a bound set of projection + visibility helpers
 * for a given camera state. The camera is at (R + H_CAM, 0, 0) looking
 * straight at sphere centre (no tilt). (CX, CY) is the screen-space
 * centre of the projection (accounts for any pan offset).
 *
 * @returns { ALPHA_LIMB, COS_LIMB, project, projectLatLon, isVisible,
 *           lonMaxAtLat, latMaxAtLon, greatCircleArc }
 */
export const makeProjection = ({ H_CAM, SCALE, CX, CY }) => {
  const ALPHA_LIMB = Math.acos(R / (R + H_CAM));
  const COS_LIMB = Math.cos(ALPHA_LIMB);

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
  /* Great-circle cap test — point is visible from the camera when
     cos(lat)·cos(lon) ≥ cos(α_limb). */
  const isVisible = (lat, lon) => Math.cos(lat) * Math.cos(lon) >= COS_LIMB - 1e-6;
  const lonMaxAtLat = (lat) => {
    const r = Math.cos(ALPHA_LIMB) / Math.cos(lat);
    return r > 1 ? 0 : Math.acos(r);
  };
  const latMaxAtLon = (lon) => {
    const r = Math.cos(ALPHA_LIMB) / Math.cos(lon);
    return r > 1 ? 0 : Math.acos(r);
  };

  /* Great-circle arc between two (lat, lon) points on the unit sphere,
     sampled via slerp in 3D Cartesian and projected. Returns visible
     samples only — points past the visibility cap drop out. */
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
      if (Px < R * COS_LIMB) continue;        // past visibility cap
      const p = project(Px, Py, Pz);
      if (p) pts.push(p);
    }
    return pts;
  };

  return {
    ALPHA_LIMB, COS_LIMB,
    project, projectLatLon, isVisible,
    lonMaxAtLat, latMaxAtLon,
    greatCircleArc,
  };
};
