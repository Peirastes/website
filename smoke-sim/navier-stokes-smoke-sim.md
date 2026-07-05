# Navier-Stokes Smoke Simulator

**A real-time 2D Eulerian fluid dynamics simulator built entirely in WebGL2.**

Single-file, zero dependencies, ~1,370 lines of HTML/CSS/GLSL/JavaScript. Runs in any modern browser at 60fps.

---

## Overview

This project implements a complete incompressible Navier-Stokes fluid solver on the GPU using WebGL2 fragment shaders. The simulation models smoke, fire, and atmospheric convection through operator-split time integration of the momentum and scalar transport equations, with interactive obstacle placement, wind tunnel mode, and experimental weather physics.

The governing equations:

$$\frac{\partial \mathbf{u}}{\partial t} + (\mathbf{u} \cdot \nabla)\mathbf{u} = -\nabla p + \mathbf{f}$$

$$\nabla \cdot \mathbf{u} = 0$$

where **u** is the velocity field, *p* is pressure, and **f** encompasses buoyancy, vorticity confinement, Coriolis, and external forces. The incompressibility constraint is enforced via Helmholtz-Hodge decomposition at each timestep.

---

## Solver Architecture

The simulation runs entirely on the GPU through a ping-pong framebuffer pipeline. All fields (velocity, pressure, density, temperature, curl, divergence) are stored as RGBA16F textures at the simulation grid resolution (configurable from 128 to 2048). Each timestep executes the following shader passes:

### Per-Frame Pipeline

| Pass | Shader | Operation |
|------|--------|-----------|
| 0 | `F_NOISE` | Optional ambient turbulence (hash-based velocity perturbation) |
| 0b | `F_WIND` | Optional wind tunnel injection (left-edge velocity + density) |
| 1 | `F_BUOY` | Thermal buoyancy: **f** = (−α·d + β·T) · **ĵ** |
| 2 | `F_ADVECT` / `F_MC` | Semi-Lagrangian or MacCormack velocity self-advection |
| 3 | `F_ADVECT` / `F_MC` | Density advection (pure transport) |
| 3b | `F_STRAIN_DISS` | Strain-rate-dependent density dissipation |
| 4 | `F_ADVECT` | Temperature advection with dissipation |
| 4b | `F_WEATHER` | Optional: condensation, precipitation, moisture cycle |
| 4b | `F_WEATHER_TEMP` | Optional: latent heat, evaporative cooling, lapse rate |
| 4b | `F_CORIOLIS` | Optional: 2D Coriolis force for cyclonic rotation |
| 5 | `F_CURL` | Compute vorticity ω = ∇ × **u** |
| 5 | `F_VORT` | Vorticity confinement: re-inject rotational energy |
| 5b | `F_BND` | Wall boundary enforcement (no-slip / Neumann / open outflow) |
| 5b | `F_OBS_BND` | Obstacle boundary enforcement |
| 6 | `F_DIV` | Compute divergence ∇ · **u** |
| 6 | `F_JAC` × N | Jacobi pressure solve (warm-started, 40 iterations default) |
| 6 | `F_BND` | Pressure boundary (Neumann) |
| 6 | `F_GRAD` | Subtract pressure gradient: **u** ← **u** − ∇p |
| 6b | `F_BND` + `F_OBS_BND` | Final velocity + obstacle boundary enforcement |
| 7 | `F_RENDER` | Composite density + temperature + obstacles to screen |
| 7 | `F_VEL_VIZ` | Optional: velocity field overlay (direction-as-hue) |

Total: 21 shader programs, 10–15 draw calls per frame (plus N Jacobi iterations).

---

## Mathematical Methods

### Advection

Two schemes are implemented, togglable at runtime:

**Semi-Lagrangian** (Stam, 1999): Traces each grid point backward along the velocity field and interpolates the source value. Unconditionally stable regardless of timestep, but introduces numerical diffusion that smears fine detail.

**MacCormack** (Selle et al., 2008): A predictor-corrector extension that performs a forward semi-Lagrangian step, then a reverse step, and uses the discrepancy to estimate and correct the truncation error. Produces visibly sharper vortex filaments and smoke tendrils. Stability is maintained by clamping the corrected value to the min/max of the neighborhood around the back-traced position.

### Pressure Projection

The incompressibility constraint ∇ · **u** = 0 is enforced by solving the Poisson equation for pressure:

∇²p = ∇ · **w**

where **w** is the intermediate (divergent) velocity. The solve uses iterative Jacobi relaxation on the GPU with ping-pong framebuffers. The previous frame's pressure field is reused as the initial guess (warm-start), which dramatically improves convergence compared to cold-starting from zero — particularly important after large velocity injections.

### Vorticity Confinement (Fedkiw et al., 2001)

Numerical dissipation on coarse grids damps out the rotational flow structures that give smoke its visual character. Vorticity confinement counteracts this by computing the vorticity field ω = ∇ × **u**, finding the gradient of its magnitude (which points from regions of low to high vorticity), and applying a body force that amplifies existing rotation:

**f**_conf = ε · (**N** × ω̂) · |ω|

where **N** = ∇|ω| / |∇|ω|| and ε is a user-controlled strength parameter.

### Buoyancy Model

Following Fedkiw et al. (2001), the buoyancy force combines thermal lift and gravitational smoke weight:

**f**_buoy = (−α · d + β · T) · **ĵ**

where α is the smoke weight coefficient, β is the thermal buoyancy coefficient, d is smoke density, and T is temperature. This drives the natural plume behavior: hot smoke rises, cool dense smoke sinks.

### Strain-Based Dissipation

Rather than applying uniform exponential decay to the density field (which fades smoke like an opacity slider), the dissipation rate is modulated by the local strain rate of the velocity field. The shader computes the full 2D strain rate tensor S_ij from the velocity gradient, takes its Frobenius norm, and uses it to scale the decay:

dissipation = baseDiss − strainScale · |S| · dt

Smoke in high-shear regions (vortex edges, plume boundaries, obstacle wakes) dissolves faster, while stagnant smoke lingers. This approximates turbulent mixing without an explicit sub-grid model.

### Boundary Conditions

**Domain walls:** No-slip (velocity zeroed) on solid boundaries, Neumann (∂p/∂n = 0, copied from interior neighbor) for pressure. When the wind tunnel is active, the right edge switches to an open outflow condition (copies interior values to let fluid exit freely).

**Obstacles:** A binary mask texture is CPU-rasterized from the obstacle array. The obstacle boundary shader zeros velocity inside solid regions and averages non-obstacle neighbor pressures for the Neumann condition. Density and temperature are also zeroed inside obstacles each frame.

---

## Obstacle System

Obstacles are defined as an array of geometric primitives, each with position, size, shape, and rotation angle. The point-in-shape test applies inverse rotation before evaluating the shape-specific containment function.

### Available Shapes

| Shape | Test | Fluid Dynamics Character |
|-------|------|--------------------------|
| **Circle** | Distance test: dx² + dy² < r² | Classic cylinder — clean von Kármán vortex street |
| **Square** | Axis-aligned box: \|dx\| < r, \|dy\| < r | Fixed separation points, wider chaotic wake |
| **Triangle** | Barycentric half-plane test | Asymmetric shedding depending on orientation |
| **Airfoil** | NACA 0012-ish thickness distribution | Attached boundary layer, thin trailing wake |
| **Flat Plate** | Thin rectangle perpendicular to flow | Maximum drag, violent alternating vortices |
| **Diamond** | L1 norm: \|dx\|/rx + \|dy\|/ry < 1 | Sharp leading edge, symmetric rear separation |

All shapes support arbitrary rotation, enabling angle-of-attack studies with the airfoil or orientation-dependent wake analysis.

---

## Rendering

### Smoke Mode

The density field's RGB channels carry the user-selected smoke color. A temperature-driven flame layer is composited additively on top using a blackbody-inspired color ramp: deep red at low temperature, through orange and yellow, to white-hot at the core. A blue inner core tint simulates the hottest combustion zone of a gas flame. The flame layer's intensity scales with both temperature and density, so it only appears where smoke is present.

### Flame Mode

When the flame color swatch is selected, the renderer switches to a fully temperature-driven color model. Cool regions show dark blue-tinted smoke, hot regions display the full blackbody flame gradient with an emissive blue-white core. This mode is designed for candle/match flame visualization.

### Velocity Overlay

A diagnostic mode that renders the velocity field as a directional color map (hue = flow direction, brightness = log-scaled speed) composited over the smoke. Includes a subtle grid overlay for cell-scale reference. Useful for visualizing the divergence-free flow field, vortex pairs, and entrainment currents.

### Obstacle Rendering

Obstacles render as dark solid shapes with edge detection (sampling neighboring mask values) for a beveled rim highlight. A faked top-left light direction adds subtle depth.

---

## Wind Tunnel

A toggleable mode that continuously injects horizontal velocity along the left edge of the domain, creating a steady free-stream flow. In normal smoke mode, colored density streaks are also injected with a sinusoidal vertical perturbation to seed vortex instability. In weather mode, only the velocity is injected (no visible streaks). The right domain edge switches to an open outflow boundary condition.

---

## Weather Physics (Experimental)

An optional atmospheric convection model adds three additional shader passes:

**Condensation cycle:** Moisture (stored in the density field's alpha channel) is advected with the flow. When moisture exceeds a saturation threshold, it condenses into visible cloud mass (added to density RGB) and releases latent heat (added to temperature). This creates the positive feedback loop that drives real convective storms: condensation → heat → stronger updraft → more condensation.

**Precipitation and evaporative cooling:** Dense cloud regions generate falling rain that evaporates below cloud base, cooling the sub-cloud air and driving downdrafts.

**Coriolis force:** A 2D approximation of the Coriolis effect applies a velocity-dependent force perpendicular to the flow direction: **F** = f · (v_y, −v_x). This spins up cyclonic rotation from convective updrafts, producing storm-like rotating structures.

**Temperature lapse rate:** A background vertical temperature gradient (warm at surface, cool aloft) creates the convective instability that drives atmospheric overturning.

**Weather renderer:** A dedicated render mode with a sky gradient, cloud shading (bright anvil tops, dark bases), moisture haze, and temperature-tinted storm cores.

---

## Interaction

The interface uses a mode-based system:

### Smoke Mode (default)
- Click to emit a smoke burst with temperature (triggers buoyancy-driven rise)
- Hold for continuous emission
- Drag to apply directional force to the fluid
- Radial puff on initial click expands outward before buoyancy takes over

### Obstacle Mode
- Click empty space to place the selected shape at the current rotation
- Click an existing obstacle to select it
- Drag a selected obstacle to reposition
- Scroll wheel to resize
- Shift + scroll to rotate
- Delete/Backspace to remove selected
- Rotation slider for fine control

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Space | Pause / Resume |
| C | Clear smoke (preserves obstacles) |
| S | Screenshot (PNG download) |
| V | Toggle velocity field overlay |
| T | Toggle ambient turbulence |
| W | Toggle wind tunnel |
| M | Toggle Smoke / Obstacle mode |
| R / Shift+R | Rotate selected obstacle ±15° |
| 1–6 | Select smoke color swatch |

---

## Tunable Parameters

| Parameter | Range | Effect |
|-----------|-------|--------|
| Grid Resolution | 128–2048 | Simulation fidelity vs. performance |
| Jacobi Iterations | 8–80 | Pressure solve accuracy |
| Time Step | 0.004–0.040 | Simulation speed |
| Vorticity (ε) | 0–20 | Swirl intensity from confinement |
| Buoyancy (β) | 0–500 | Thermal rise strength |
| Smoke Weight (α) | 0–20 | Gravitational pull on dense smoke |
| Dissipation | 0.90–1.00 | Base smoke fade rate |
| Splat Radius | 1%–100% | Emitter size (maps to 0.0001–0.04 UV) |
| Temperature | 5%–200% | Emitter heat intensity |
| Wind Speed | 5%–100% | Wind tunnel free-stream velocity |

---

## Technical Notes

**Unit system:** Velocity is stored in grid-cells-per-second. The advection shader converts to UV-space displacement via `pos = uv − dt · vel · rdx` where `rdx = 1/gridSize`. All force terms (buoyancy, vorticity, Coriolis) operate in the same grid-cell units.

**Stability:** The MacCormack scheme's clamping step prevents oscillatory instability by bounding the corrected value within the min/max of the back-traced neighborhood. The splat injection uses saturating addition (hard clamp per channel) to prevent field values from growing without bound during rapid interaction. Velocity field dissipation (0.999/frame) provides a safety valve against long-term accumulation.

**Warm-start Jacobi:** Reusing the previous frame's pressure field as the initial guess for the iterative solve exploits temporal coherence — pressure fields change smoothly between frames, so the solver starts close to the solution. This is equivalent to roughly doubling the effective iteration count compared to cold-starting from zero.

**Obstacle rasterization:** The obstacle mask is CPU-rasterized into an R8 texture whenever obstacles are added, moved, resized, or rotated. This is fast enough for interactive manipulation (the rasterization loop is O(gridW × gridH × numObstacles)) but would need optimization for very large obstacle counts.

---

## Lineage

The solver's architecture traces a direct lineage through the foundational works in real-time fluid simulation for computer graphics:

- **Stam, J.** "Stable Fluids." *SIGGRAPH 1999.* — The semi-Lagrangian advection and operator-splitting framework that made real-time fluid simulation practical.
- **Fedkiw, R., Stam, J., Jensen, H.W.** "Visual Simulation of Smoke." *SIGGRAPH 2001.* — Vorticity confinement and the buoyancy model for smoke simulation.
- **Harris, M.J.** "Fast Fluid Dynamics Simulation on the GPU." *GPU Gems, Chapter 38, NVIDIA, 2004.* — The GPU implementation paradigm using fragment shaders and ping-pong framebuffers.
- **Selle, A., Fedkiw, R., Kim, B., Liu, Y., Rossignac, J.** "An Unconditionally Stable MacCormack Method." *J. Sci. Comput. 35, 2008.* — The clamped MacCormack advection scheme for higher-order accuracy.
- **Crane, K.** "Real-Time Simulation and Rendering of 3D Fluids." *GPU Gems 3, Chapter 30, NVIDIA.* — MacCormack on GPU, obstacle interaction, and rendering techniques.
- **Zehnder, J., Narain, R., Thomaszewski, B.** "An Advection-Reflection Solver for Detail-Preserving Fluid Simulation." *ACM Trans. Graph. 37(4), 2018.* — Energy-preserving alternatives to standard projection.
- **Nabizadeh, M.S., Yin, H., Roy-Chowdhury, R., Ramamoorthi, R., Chern, A.** "Fluid Implicit Particles on Coadjoint Orbits." *SIGGRAPH Asia 2024, Best Paper Honorable Mention.* — State-of-the-art structure-preserving fluid simulation using differential geometry (CO-FLIP).

---

## Platform

Single HTML file. WebGL2 required (EXT_color_buffer_float, OES_texture_float_linear). No build step, no dependencies, no server. Open the file in a browser and it runs.
