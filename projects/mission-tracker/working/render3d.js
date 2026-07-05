/**
 * Mission Tracker — 3D Rendering Engine
 *
 * Projects 3D world coordinates onto a 2D Canvas2D viewport. Handles:
 *   - Camera with 3D orientation (azimuth, elevation, roll, distance)
 *   - Orthographic projection (perspective is a future option)
 *   - Viewport-aware auto-fit and auto-centering
 *   - Earth rendered as a procedural sphere with day/night shading,
 *     rotation, axial tilt, and lat/lon grid
 *   - Moon as a smaller sphere with phase shading
 *   - Trajectory line with depth-correct ordering
 *
 * No external dependencies. No WebGL. Single Canvas2D context.
 *
 * Status: Phase 2 — initial implementation
 */

'use strict';

// =============================================================================
// CONSTANTS (mirrors physics3d.js — kept here for browser-side independence)
// =============================================================================

const RENDER_CONST = {
  R_EARTH: 6371,
  R_MOON:  1737,
  R_SUN:   695700,
  AU:      149597870.7,
  LUNAR_DIST: 384400,

  // Earth rotation
  SIDEREAL_DAY: 86164.0905,  // seconds (one full rotation in inertial frame)

  // Axial tilt (already applied to ephemeris in physics3d.js)
  ECLIPTIC_OBLIQUITY: 23.44 * Math.PI / 180,
};

// =============================================================================
// 3D VECTOR UTILITIES (subset; full set in physics3d.js)
// =============================================================================

const V = {
  add:   (a, b) => [a[0]+b[0], a[1]+b[1], a[2]+b[2]],
  sub:   (a, b) => [a[0]-b[0], a[1]-b[1], a[2]-b[2]],
  scale: (a, s) => [a[0]*s, a[1]*s, a[2]*s],
  dot:   (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2],
  cross: (a, b) => [
    a[1]*b[2] - a[2]*b[1],
    a[2]*b[0] - a[0]*b[2],
    a[0]*b[1] - a[1]*b[0]
  ],
  mag:   (a) => Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]),
  norm:  (a) => {
    const m = V.mag(a);
    return m > 0 ? [a[0]/m, a[1]/m, a[2]/m] : [0,0,0];
  },
};

// =============================================================================
// CAMERA — 3D orientation, orthographic projection
// =============================================================================

/**
 * A camera defined by spherical coordinates around the origin.
 *
 *   azimuth   — rotation around Z axis (radians, 0 = looking from +X)
 *   elevation — angle above the X-Y plane (radians, 0 = equatorial, π/2 = polar)
 *   roll      — rotation around the view axis (radians, 0 = "up" is +Z)
 *   distance  — viewer distance from origin (km, used for scale and perspective)
 *
 * Default view: looking down on the equatorial plane from above (elevation=π/2).
 * This matches the conventional "top-down" view of orbital diagrams while still
 * being a real 3D projection that can be rotated to any angle.
 */
function makeCamera(opts = {}) {
  return {
    azimuth:   opts.azimuth   ?? 0,
    elevation: opts.elevation ?? (Math.PI / 2 - 0.0001), // nearly polar by default
    roll:      opts.roll      ?? 0,
    distance:  opts.distance  ?? 800000, // km
    fov:       opts.fov       ?? 'ortho', // 'ortho' or perspective scale
  };
}

/**
 * Compute the camera basis vectors (right, up, forward) for the current
 * orientation. Forward points from the camera toward the origin.
 */
function cameraBasis(cam) {
  const ce = Math.cos(cam.elevation);
  const se = Math.sin(cam.elevation);
  const ca = Math.cos(cam.azimuth);
  const sa = Math.sin(cam.azimuth);

  // Camera position in world coordinates
  const cam_pos = [
    cam.distance * ce * ca,
    cam.distance * ce * sa,
    cam.distance * se,
  ];

  // Forward: from camera toward origin (negative of cam_pos direction)
  const forward = V.norm(V.scale(cam_pos, -1));

  // World up is +Z. Compute right = forward × world_up, then up = right × forward.
  let right = V.cross(forward, [0, 0, 1]);
  if (V.mag(right) < 1e-6) {
    // Looking straight up or down — use world +Y as a fallback
    right = V.cross(forward, [0, 1, 0]);
  }
  right = V.norm(right);
  const up = V.norm(V.cross(right, forward));

  // Apply roll (rotation around forward axis)
  if (cam.roll !== 0) {
    const cr = Math.cos(cam.roll);
    const sr = Math.sin(cam.roll);
    const r2 = [
      right[0]*cr + up[0]*sr,
      right[1]*cr + up[1]*sr,
      right[2]*cr + up[2]*sr,
    ];
    const u2 = [
      -right[0]*sr + up[0]*cr,
      -right[1]*sr + up[1]*cr,
      -right[2]*sr + up[2]*cr,
    ];
    return { cam_pos, forward, right: r2, up: u2 };
  }

  return { cam_pos, forward, right, up };
}

/**
 * Project a 3D world-space point to 2D screen-space coordinates.
 *
 * Returns { x, y, depth } where (x, y) are screen coordinates (origin at
 * canvas center) and depth is the distance from the camera (for sorting).
 */
function project(point, cam, basis, scale) {
  const rel = point; // origin is the world origin (Earth center)
  // Project onto camera right and up axes
  const x = V.dot(rel, basis.right) * scale;
  const y = -V.dot(rel, basis.up) * scale; // negate Y because canvas Y is down
  // Depth: distance along forward axis (negative because forward points inward)
  const depth = -V.dot(V.sub(rel, basis.cam_pos), basis.forward);
  return { x, y, depth };
}

/**
 * Compute a uniform scale factor (pixels per km) such that the trajectory
 * fits comfortably within the canvas with margin.
 */
function autoFitScale(canvasW, canvasH, trajectoryExtent, marginFrac = 0.85) {
  const minDim = Math.min(canvasW, canvasH);
  return (minDim * marginFrac) / (2 * trajectoryExtent);
}

// =============================================================================
// EARTH RENDERING — procedural sphere with rotation, lat/lon, day/night
// =============================================================================

/**
 * Render the Earth as a sphere centered at world origin, with:
 *   - Day/night shading from the current Sun direction
 *   - Lat/lon grid that rotates with the Earth (sidereal rotation rate)
 *   - Simplified continent outlines (optional, see continent_outlines below)
 *   - Axial tilt applied via the inertial frame (no extra work here — the
 *     ECI frame already accounts for Earth's tilt)
 *
 * t_seconds: mission elapsed time (used to compute Earth rotation angle)
 * sun_pos: Sun position in 3D world coordinates (from physics3d.sunPosition)
 */
function renderEarth(ctx, cam, basis, scale, t_seconds, sun_pos, opts = {}) {
  const R = RENDER_CONST.R_EARTH;
  // Earth at world origin. project([0,0,0]) returns (0,0) in screen-relative
  // coordinates. Add the canvas center to get the actual draw position, matching
  // the convention in renderTrajectory, renderMoon, and renderSpacecraft.
  const proj = project([0,0,0], cam, basis, scale);
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const center_screen = { x: cw / 2 + proj.x, y: ch / 2 + proj.y };

  // Earth radius in screen pixels (orthographic, so it's just R*scale)
  const r_px = R * scale;

  if (r_px < 2) {
    // Too small to render as a sphere — draw a single dot
    ctx.fillStyle = '#4a8eff';
    ctx.beginPath();
    ctx.arc(center_screen.x, center_screen.y, Math.max(1, r_px), 0, Math.PI*2);
    ctx.fill();
    return;
  }

  // Sun direction (for day/night terminator)
  const sun_dir = V.norm(sun_pos);

  // Earth's rotation angle around its own axis (sidereal)
  // The +X direction at t=0 corresponds to a specific Earth-fixed longitude.
  // For a generic framework, we don't need to be precise about which longitude
  // is at +X at launch — just that the rotation rate is correct.
  const earth_rot_angle = (t_seconds / RENDER_CONST.SIDEREAL_DAY) * 2 * Math.PI;

  // Draw filled Earth disk as a solid ocean-blue circle FIRST (no clip needed)
  ctx.fillStyle = '#0a2540';
  ctx.beginPath();
  ctx.arc(center_screen.x, center_screen.y, r_px, 0, Math.PI*2);
  ctx.fill();

  // Save context for clipping the subsequent drawing to stay inside the Earth disk
  ctx.save();
  ctx.beginPath();
  ctx.arc(center_screen.x, center_screen.y, r_px, 0, Math.PI*2);
  ctx.clip();

  // Render lat/lon grid
  // Walk through latitudes (parallels) and longitudes (meridians) and project
  // each point on the sphere to screen space.
  ctx.strokeStyle = 'rgba(140, 180, 255, 0.25)';
  ctx.lineWidth = 0.5;

  // Latitudes (every 15°)
  for (let lat_deg = -75; lat_deg <= 75; lat_deg += 15) {
    const lat = lat_deg * Math.PI / 180;
    ctx.beginPath();
    let started = false;
    for (let lon_deg = 0; lon_deg <= 360; lon_deg += 5) {
      const lon = lon_deg * Math.PI / 180 + earth_rot_angle;
      // Earth-fixed → ECI: rotate around Z by Earth rotation angle
      const x = R * Math.cos(lat) * Math.cos(lon);
      const y = R * Math.cos(lat) * Math.sin(lon);
      const z = R * Math.sin(lat);
      // Apply axial tilt? The ECI frame already has Earth's axis along +Z,
      // so we don't apply tilt here. The tilt is reflected in where the Sun
      // position vector points in the ECI frame.
      const p = [x, y, z];
      // Cull points on the far side of the sphere
      const view_dot = V.dot(V.norm(p), basis.forward);
      if (view_dot > 0) { started = false; continue; }
      const screen = project(p, cam, basis, scale);
      if (!started) {
        ctx.moveTo(center_screen.x + screen.x, center_screen.y + screen.y);
        started = true;
      } else {
        ctx.lineTo(center_screen.x + screen.x, center_screen.y + screen.y);
      }
    }
    ctx.stroke();
  }

  // Longitudes (every 15°)
  for (let lon_deg = 0; lon_deg < 360; lon_deg += 15) {
    const lon = lon_deg * Math.PI / 180 + earth_rot_angle;
    ctx.beginPath();
    let started = false;
    for (let lat_deg = -90; lat_deg <= 90; lat_deg += 5) {
      const lat = lat_deg * Math.PI / 180;
      const x = R * Math.cos(lat) * Math.cos(lon);
      const y = R * Math.cos(lat) * Math.sin(lon);
      const z = R * Math.sin(lat);
      const p = [x, y, z];
      const view_dot = V.dot(V.norm(p), basis.forward);
      if (view_dot > 0) { started = false; continue; }
      const screen = project(p, cam, basis, scale);
      if (!started) {
        ctx.moveTo(center_screen.x + screen.x, center_screen.y + screen.y);
        started = true;
      } else {
        ctx.lineTo(center_screen.x + screen.x, center_screen.y + screen.y);
      }
    }
    ctx.stroke();
  }

  // Equator emphasis
  ctx.strokeStyle = 'rgba(180, 220, 255, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  let started = false;
  for (let lon_deg = 0; lon_deg <= 360; lon_deg += 3) {
    const lon = lon_deg * Math.PI / 180 + earth_rot_angle;
    const p = [R * Math.cos(lon), R * Math.sin(lon), 0];
    const view_dot = V.dot(V.norm(p), basis.forward);
    if (view_dot > 0) { started = false; continue; }
    const screen = project(p, cam, basis, scale);
    if (!started) {
      ctx.moveTo(center_screen.x + screen.x, center_screen.y + screen.y);
      started = true;
    } else {
      ctx.lineTo(center_screen.x + screen.x, center_screen.y + screen.y);
    }
  }
  ctx.stroke();

  // Day/night terminator: shade the night side with a strong linear gradient
  // along the anti-Sun direction. The gradient darkens the night side heavily
  // while leaving the day side bright.
  const sun_screen_x = V.dot(sun_dir, basis.right);
  const sun_screen_y = -V.dot(sun_dir, basis.up);

  const grad_mag = Math.sqrt(sun_screen_x*sun_screen_x + sun_screen_y*sun_screen_y);
  if (grad_mag > 0.01) {
    // Unit vector toward the Sun in screen coordinates
    const ux = sun_screen_x / grad_mag;
    const uy = sun_screen_y / grad_mag;
    // Gradient line goes from ANTI-SUN (night side) to SUN (day side) across the Earth disk
    const grad = ctx.createLinearGradient(
      center_screen.x - ux*r_px, center_screen.y - uy*r_px, // anti-sun (night)
      center_screen.x + ux*r_px, center_screen.y + uy*r_px  // sun (day)
    );
    grad.addColorStop(0.0, 'rgba(0,0,0,0.92)'); // deep night
    grad.addColorStop(0.35, 'rgba(0,0,0,0.72)'); // dusk
    grad.addColorStop(0.5, 'rgba(0,0,0,0.35)'); // terminator edge
    grad.addColorStop(0.65, 'rgba(0,0,0,0.0)');  // just past dawn
    grad.addColorStop(1.0, 'rgba(0,0,0,0.0)');   // full daylight
    ctx.fillStyle = grad;
    ctx.fillRect(center_screen.x - r_px, center_screen.y - r_px, r_px*2, r_px*2);
  }

  ctx.restore();

  // Earth limb (outline of the disk)
  ctx.strokeStyle = 'rgba(120, 160, 220, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(center_screen.x, center_screen.y, r_px, 0, Math.PI*2);
  ctx.stroke();

  // Atmosphere glow (subtle)
  if (r_px > 8) {
    const glow = ctx.createRadialGradient(
      center_screen.x, center_screen.y, r_px,
      center_screen.x, center_screen.y, r_px * 1.15
    );
    glow.addColorStop(0, 'rgba(120, 180, 255, 0.25)');
    glow.addColorStop(1, 'rgba(120, 180, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(center_screen.x, center_screen.y, r_px * 1.15, 0, Math.PI*2);
    ctx.fill();
  }
}

// =============================================================================
// MOON RENDERING
// =============================================================================

function renderMoon(ctx, cam, basis, scale, moon_pos, sun_pos) {
  const R = RENDER_CONST.R_MOON;
  const screen = project(moon_pos, cam, basis, scale);
  const center_x = ctx.canvas.width / 2 + screen.x;
  const center_y = ctx.canvas.height / 2 + screen.y;
  const r_px = Math.max(2, R * scale);

  // Moon surface
  ctx.fillStyle = '#bbb';
  ctx.beginPath();
  ctx.arc(center_x, center_y, r_px, 0, Math.PI*2);
  ctx.fill();

  // Phase shading
  if (r_px > 4) {
    const moon_to_sun = V.norm(V.sub(sun_pos, moon_pos));
    const sun_screen_x = V.dot(moon_to_sun, basis.right);
    const sun_screen_y = -V.dot(moon_to_sun, basis.up);
    const grad_mag = Math.sqrt(sun_screen_x*sun_screen_x + sun_screen_y*sun_screen_y);
    if (grad_mag > 0.01) {
      const ux = sun_screen_x / grad_mag;
      const uy = sun_screen_y / grad_mag;
      ctx.save();
      ctx.beginPath();
      ctx.arc(center_x, center_y, r_px, 0, Math.PI*2);
      ctx.clip();
      const grad = ctx.createLinearGradient(
        center_x - ux*r_px, center_y - uy*r_px,
        center_x + ux*r_px, center_y + uy*r_px
      );
      grad.addColorStop(0, 'rgba(0,0,0,0.7)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.0)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(center_x - r_px, center_y - r_px, r_px*2, r_px*2);
      ctx.restore();
    }
  }

  // Limb
  ctx.strokeStyle = 'rgba(180, 180, 180, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(center_x, center_y, r_px, 0, Math.PI*2);
  ctx.stroke();
}

// =============================================================================
// TRAJECTORY RENDERING
// =============================================================================

function renderTrajectory(ctx, cam, basis, scale, trajectory, opts = {}) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const cx = cw / 2;
  const cy = ch / 2;

  const color = opts.color || '#e07050';
  const width = opts.width || 1.5;

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  for (let i = 0; i < trajectory.length; i++) {
    const screen = project(trajectory[i].pos, cam, basis, scale);
    const px = cx + screen.x;
    const py = cy + screen.y;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

// =============================================================================
// SPACECRAFT MARKER
// =============================================================================

function renderSpacecraft(ctx, cam, basis, scale, pos) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;
  const screen = project(pos, cam, basis, scale);
  const px = cw / 2 + screen.x;
  const py = ch / 2 + screen.y;

  // Bright dot with glow
  const grad = ctx.createRadialGradient(px, py, 0, px, py, 6);
  grad.addColorStop(0, 'rgba(255, 220, 120, 1)');
  grad.addColorStop(0.5, 'rgba(255, 180, 80, 0.6)');
  grad.addColorStop(1, 'rgba(255, 180, 80, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI*2);
  ctx.fill();

  // Center
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(px, py, 1.5, 0, Math.PI*2);
  ctx.fill();
}

// =============================================================================
// MAIN RENDER LOOP — assemble the full scene
// =============================================================================

/**
 * Render a complete scene to the canvas.
 *
 * scene = {
 *   t_seconds: number,
 *   trajectory: [{t, pos, vel}, ...],
 *   spacecraft_pos: [x,y,z],
 *   moon_pos: [x,y,z],
 *   sun_pos: [x,y,z],
 *   camera: { azimuth, elevation, roll, distance },
 * }
 */
function renderScene(ctx, scene) {
  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;

  // Background
  ctx.fillStyle = '#000510';
  ctx.fillRect(0, 0, cw, ch);

  // Compute trajectory extent for auto-fit
  let max_extent = RENDER_CONST.LUNAR_DIST * 1.2;
  if (scene.trajectory && scene.trajectory.length > 0) {
    for (const pt of scene.trajectory) {
      const r = V.mag(pt.pos);
      if (r > max_extent) max_extent = r;
    }
  }

  // Camera distance acts as zoom: smaller distance → bigger scale (zoom in)
  // Reference distance is 800,000 km (the default). Scale factor inverts the
  // relationship so closer = larger.
  const REFERENCE_DISTANCE = 800000;
  const cam = scene.camera;
  const zoomFactor = REFERENCE_DISTANCE / cam.distance;
  const scale = autoFitScale(cw, ch, max_extent) * zoomFactor;

  const basis = cameraBasis(cam);

  // Render order (back to front):
  //   1. Distant stars (skipped for now)
  //   2. Earth (always at world origin)
  //   3. Trajectory
  //   4. Moon
  //   5. Spacecraft

  renderEarth(ctx, cam, basis, scale, scene.t_seconds, scene.sun_pos);

  if (scene.trajectory) {
    renderTrajectory(ctx, cam, basis, scale, scene.trajectory);
  }

  if (scene.moon_pos) {
    renderMoon(ctx, cam, basis, scale, scene.moon_pos, scene.sun_pos);
  }

  if (scene.spacecraft_pos) {
    renderSpacecraft(ctx, cam, basis, scale, scene.spacecraft_pos);
  }
}

// =============================================================================
// EXPORTS (for both Node.js test environment and browser)
// =============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RENDER_CONST,
    V,
    makeCamera,
    cameraBasis,
    project,
    autoFitScale,
    renderEarth,
    renderMoon,
    renderTrajectory,
    renderSpacecraft,
    renderScene,
  };
}
