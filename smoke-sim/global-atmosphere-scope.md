# Global Atmospheric Simulator — Project Scope

## Rotating Shallow-Water Equations on an Equirectangular Grid

**Objective:** A real-time, interactive 2D atmospheric dynamics simulator that captures the essential phenomenology of global weather — Rossby waves, cyclogenesis, jet streams, trade winds, and storm systems — using the rotating shallow-water equations solved on the GPU via WebGL2.

**Phase 1:** Flat equirectangular grid (the "unrolled globe").
**Phase 2:** Wrap onto a 3D globe with Three.js.

---

## Governing Equations

The rotating shallow-water equations on a beta-plane:

```
∂(uh)/∂t + ∂(u²h + gh²/2)/∂x + ∂(uvh)/∂y = h(fv − g·∂H/∂x) − κuh

∂(vh)/∂t + ∂(uvh)/∂x + ∂(v²h + gh²/2)/∂y = h(−fu − g·∂H/∂y) − κvh

∂h/∂t + ∂(uh)/∂x + ∂(vh)/∂y = S
```

Where:
- **h(x,y,t)** = fluid layer thickness (proxy for pressure / geopotential height)
- **(u,v)** = velocity components (eastward, northward)
- **f = f₀ + β(y − ȳ)** = Coriolis parameter (varies with latitude)
- **g** = effective gravitational acceleration (gravity wave speed parameter)
- **H(x,y)** = bottom topography (mountain ranges as orographic forcing)
- **κ** = friction/drag coefficient
- **S** = mass source/sink terms (thermal forcing, moisture proxy)

These are the same equations used in geophysical fluid dynamics to study large-scale atmospheric and oceanic circulation. The fluid height h acts as a proxy for pressure: low h = low pressure = cyclone; high h = high pressure = anticyclone.

---

## What the Physics Produces (for free, from the equations alone)

| Phenomenon | Mechanism in the Model |
|------------|----------------------|
| **Cyclones / Anticyclones** | Pressure anomalies + Coriolis → geostrophic balance → rotating systems |
| **Rossby Waves** | β-effect (latitude-varying Coriolis) → westward-propagating planetary waves |
| **Jet Streams** | Meridional temperature gradient → thermal wind balance → fast zonal flow |
| **Trade Winds** | Hadley cell analog from equator-to-pole thermal forcing |
| **Baroclinic Instability** | Shear zones → frontal cyclogenesis (mid-latitude storm development) |
| **Orographic Waves** | Flow over topography → lee waves, Rossby wave trains |
| **Vortex Merging** | 2D upscale energy cascade → small vortices merge into large ones |
| **Equatorial Kelvin Waves** | Trapped gravity waves propagating eastward along the equator |
| **Von Kármán Streets** | Wake vortices behind island-like topographic obstacles |

---

## Numerical Method

### Spatial Discretization

**Equirectangular grid:** 720×360 (0.5° resolution, ~55km at equator). This maps naturally to a texture for GPU processing. The x-axis wraps periodically (east-west), y-axis has wall boundaries at the poles.

**Metric terms:** Grid cells at high latitudes are narrower than at the equator. The effective dx scales as dx = Δλ·R·cos(φ), where φ is latitude. This must be accounted for in all spatial derivatives.

### Temporal Integration

**Lax-Wendroff scheme** (2nd order in both space and time): Following Hogan (2014), this is the standard scheme for shallow-water equations on the GPU. It uses a predictor-corrector structure:

1. **Half-step predictor:** Compute fluxes at half-timestep, half-grid positions
2. **Full-step corrector:** Use half-step fluxes to update the full timestep

This avoids the need for iterative pressure solves (unlike our smoke sim's Helmholtz-Hodge projection) because the shallow-water equations are hyperbolic — pressure waves propagate explicitly through the height field. No Jacobi iterations needed.

**CFL condition:** Δt < Δx / (|u| + √(gh)). The gravity wave speed √(gh) sets the maximum timestep. For typical atmospheric parameters this allows ~30-60 second timesteps at 0.5° resolution.

### Alternative: Semi-Lagrangian + Pressure Projection

We could also reuse our smoke sim architecture (semi-Lagrangian advection + Jacobi pressure solve) adapted for the shallow-water system. This would allow larger timesteps but introduces numerical diffusion. The Lax-Wendroff approach is more physically accurate for wave phenomena.

**Recommendation:** Start with Lax-Wendroff (it's the standard for SWE), fall back to semi-Lagrangian if stability issues arise.

---

## Shader Pipeline (per timestep)

| Pass | Operation | Notes |
|------|-----------|-------|
| 1 | **Lax-Wendroff half-step** | Compute (uh, vh, h) at half-grid, half-time |
| 2 | **Lax-Wendroff full-step** | Update (uh, vh, h) using half-step fluxes |
| 3 | **Coriolis source term** | Apply f·v, −f·u rotation (latitude-dependent) |
| 4 | **Thermal forcing** | Relax h toward equilibrium profile (equator-to-pole gradient) |
| 5 | **Friction** | Linear drag on velocity (Rayleigh damping) |
| 6 | **Topographic forcing** | Bottom topography gradient terms |
| 7 | **Moisture/cloud pass** | Convergence → condensation → cloud density (visual) |
| 8 | **Boundary conditions** | Periodic east-west, wall or sponge at poles |
| 9 | **Render** | Height field → pressure map, cloud overlay, wind vectors |

Total: ~9 shader passes per timestep, no iterative loops. Much cheaper per step than the smoke sim.

---

## Data Fields (GPU Textures)

| Texture | Format | Contents |
|---------|--------|----------|
| **state** | RGBA16F | (uh, vh, h, moisture) — conservative variables |
| **state_half** | RGBA16F | Half-step intermediate values |
| **topography** | R16F | Bottom elevation H(x,y) — static, loaded once |
| **coriolis** | R16F | f(y) = f₀ + βy — static, computed once |
| **equilibrium** | R16F | Target h profile for thermal relaxation — static or seasonal |
| **clouds** | RGBA16F | Cloud density + precipitation (visual only) |
| **scratch** | RGBA16F | Temporary computation buffer |

---

## Parameterized Physics (simplified, not resolved)

### Thermal Forcing (Hadley Cell Driver)

Instead of resolving radiation and convection, we relax the height field toward an equilibrium profile that's high at the equator and low at the poles (representing the meridional temperature gradient). The relaxation timescale controls how strongly the atmosphere is "heated":

```
∂h/∂t += −(h − h_eq(y)) / τ_relax
```

This drives a Hadley-like circulation: air flows poleward at upper levels (high h), returns equatorward at the surface, and the Coriolis force deflects it into trade winds and westerlies.

### Moisture and Clouds

A moisture field is advected with the flow. Where the flow converges (∇·u < 0), moisture accumulates and "condenses" above a threshold, producing visible cloud density. This is purely visual — it doesn't feed back into the dynamics (no latent heat release in this version). But it makes convergence zones, fronts, and cyclone spiral arms visible.

### Friction

Linear Rayleigh drag with a stronger coefficient near the surface (lower h) simulates boundary layer friction. This breaks geostrophic balance near the ground, causing cross-isobar flow into low-pressure centers — which is what makes real cyclones fill in and why they need continuous energy input.

### Topography

A simplified Earth topography texture (major mountain ranges: Rockies, Andes, Himalayas, Alps) provides orographic forcing. Flow over mountains generates Rossby wave trains that propagate downstream — this is a major control on real-world weather patterns.

---

## Interaction Design

### Click Actions (mode-based)

| Mode | Click Action |
|------|-------------|
| **Cyclone** | Inject a low-pressure anomaly (decrease h) → Coriolis spins it up |
| **Anticyclone** | Inject a high-pressure anomaly (increase h) → opposite rotation |
| **Heat** | Add thermal forcing (increase equilibrium h locally) → convective trigger |
| **Cool** | Remove thermal forcing → cold pool, downdraft analog |
| **Wind** | Apply directional force (like the smoke sim drag) |
| **Moisture** | Inject moisture → visible cloud formation where convergence occurs |

### Global Controls

| Parameter | Effect |
|-----------|--------|
| **Rotation Rate (Ω)** | Coriolis strength — 0 = no rotation (symmetric convection), 1x = Earth, higher = stronger jets |
| **Temperature Gradient** | Equator-to-pole ΔT — drives circulation strength |
| **Gravity Wave Speed** | Controls how fast pressure adjusts — affects storm size and propagation |
| **Friction** | Boundary layer drag — affects cyclone intensity and lifespan |
| **Season** | Shifts the thermal equator north/south — moves the ITCZ and jet streams |
| **Simulation Speed** | Timesteps per frame (1x real-time to 1000x fast-forward) |
| **Topography** | Toggle Earth mountains on/off |

### Visualization Modes

| Mode | Display |
|------|---------|
| **Pressure / Height** | Color map of h field (blue=low/cyclone, red=high/anticyclone) |
| **Clouds** | White cloud layer derived from convergence + moisture |
| **Wind Speed** | Color map of |u| with optional streamline overlay |
| **Vorticity** | Curl of velocity field (shows rotation centers) |
| **Temperature** | Proxy from h field (geostrophic relationship) |
| **Satellite View** | Earth texture + cloud overlay (the "pretty" mode) |

---

## Rendering (Phase 1: Flat Map)

The equirectangular grid renders directly as a full-screen quad with the simulation texture mapped onto it. Coastline and topography contours are overlaid as a static texture. Cloud layer is composited with soft alpha blending. Wind barbs or streamlines can be drawn as a second pass.

The visual style should evoke a weather analysis chart or radar display — dark background, vivid pressure coloring, bright cloud masses.

---

## Rendering (Phase 2: 3D Globe)

A textured sphere in Three.js or raw WebGL:
- Earth albedo texture (land/ocean/ice)
- Simulation fields mapped as overlays (pressure, clouds, wind)
- Atmosphere haze at the limb
- Day/night terminator
- Camera orbit controls
- Click-to-interact via raycasting onto the sphere surface

The simulation still runs on the flat equirectangular grid — the globe is purely a rendering projection. The texture coordinates of the sphere map directly to the simulation UV coordinates.

---

## Development Phases

### Phase 1a: Core Solver (flat grid, no physics)
- Lax-Wendroff shallow-water solver on equirectangular grid
- Periodic east-west boundaries, wall at poles
- Coriolis force with latitude-dependent f
- Click to inject height anomalies
- Render as pressure color map
- **Milestone:** Gravity waves propagate, Coriolis deflects them, Rossby waves visible

### Phase 1b: Atmospheric Physics
- Thermal forcing (equilibrium relaxation → Hadley cell)
- Friction (Rayleigh drag)
- Topography (static elevation field)
- Moisture advection + convergence-based clouds
- **Milestone:** Spontaneous jet stream formation, trade winds, orographic Rossby waves

### Phase 1c: Interaction + Polish
- Click modes (cyclone, anticyclone, heat, cool, moisture, wind)
- Visualization modes (pressure, clouds, wind, vorticity, satellite)
- Parameter controls panel
- Speed control (fast-forward)
- **Milestone:** Click to spin up a cyclone, watch it propagate and interact with the jet stream

### Phase 2: Globe Rendering
- Three.js sphere with simulation texture mapping
- Earth albedo + coastlines + topography shading
- Cloud layer with proper alpha
- Orbit camera controls
- Raycast click interaction on sphere surface
- Day/night terminator
- **Milestone:** Rotating globe with live weather simulation

---

## Performance Estimate

- Grid: 720×360 = 259,200 cells
- Textures: ~7 RGBA16F at 720×360 = ~5.3 MB VRAM
- Shader passes: ~9 per timestep
- Timesteps per frame: 4–10 (for visible simulation speed)
- Total fragment operations: ~9.3M–23.3M per frame
- **Verdict:** Easily within WebGL2 budget at 60fps, even on integrated GPUs

---

## Key References

- **Hogan, R.** "Shallow Water Model." University of Reading, 2014. — The direct pedagogical reference for this project. Lax-Wendroff on beta-plane, demonstrates all target phenomena.
- **Pedlosky, J.** *Geophysical Fluid Dynamics.* Springer, 2013. — The theoretical foundation for rotating fluid dynamics.
- **Vallis, G.K.** *Atmospheric and Oceanic Fluid Dynamics.* Cambridge, 2017. — Comprehensive reference for the shallow-water approximation in atmospheric context.
- **Hagen, T.R. et al.** "Visual Simulation of Shallow-Water Waves." *Simulation Modelling Practice and Theory*, 2005. — GPU implementation reference.
- **Sadourny, R.** "The Dynamics of Finite-Difference Models of the Shallow-Water Equations." *J. Atmos. Sci.*, 1975. — Classic paper on numerical schemes for SWE on the sphere.

---

## Architecture Comparison: Smoke Sim vs. Atmosphere Sim

| Aspect | Smoke Simulator | Atmosphere Simulator |
|--------|----------------|---------------------|
| Equations | Incompressible Navier-Stokes | Rotating Shallow-Water |
| Pressure | Poisson solve (iterative Jacobi) | Explicit in height field (no iteration) |
| Time integration | Operator splitting (advect → project) | Lax-Wendroff (single unified step) |
| Rotation | Optional Coriolis force | Essential latitude-dependent Coriolis |
| Grid | Cartesian, no curvature | Equirectangular with cos(φ) metric |
| Boundary | Walls + obstacles | Periodic E-W, polar walls |
| Visualization | Density + temperature → smoke/flame | Height + moisture → pressure map + clouds |
| Interaction | Emit smoke, place obstacles | Inject pressure anomalies, thermal forcing |
| Rendering | 2D fullscreen quad | 2D flat map → 3D globe |

The solver architecture is fundamentally different (hyperbolic Lax-Wendroff vs. elliptic pressure projection), but the GPU pipeline paradigm is identical: ping-pong framebuffers, fullscreen quad fragment shaders, texture-based field storage.
