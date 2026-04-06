# Optics Lab — Interactive Physics Simulator

**Status:** v2.0 — All 5 modules complete, deployed, physics verified  
**Author:** [peirastes](https://peirastes.com)  
**Origin:** PHY 2114 — Physics II, University of Central Oklahoma  
**Coverage:** Snell's Law, TIR, Thin Lenses, Double-Slit, Single-Slit, Diffraction Grating  
**Deployed:** `peirastes.com/optics-lab/`

---

## Overview

Optics Lab is a browser-based interactive simulator covering both ray optics and wave optics. Every parameter is a live slider — students watch Snell's law break into TIR, drag objects through focal points, and see interference fringes respond to slit spacing, wavelength, and screen distance in real time.

Single self-contained HTML file. No build step, no frameworks, no server. Canvas2D rendering, vanilla JavaScript, two Google Fonts (graceful degradation to system fonts).

---

## Modules

### Module 1: Snell's Law & Total Internal Reflection

**Controls:** Upper/lower medium selectors (air, water, crown glass, diamond), wavelength (380–700 nm), incidence angle (0–89°), light direction toggle, dispersion toggle.

**Physics:** Snell's law with real-time refracted/reflected rays. TIR detection + critical angle indicator. Cauchy dispersion model n(λ) = B + C/λ² for all media. White-light dispersion splits into ~15 spectral wavelengths.

**Readouts:** n₁, n₂ (wavelength-dependent), θ₁, θ₂ (or TIR), θ_c, λ

### Module 2: Thin Lenses

**Controls:** Lens type (converging/diverging), focal length (3–40 cm), wavelength (380–700 nm), object distance (2–80 cm).

**Physics:** Thin lens equation 1/d_o + 1/d_i = 1/f. Two principal rays (parallel + central). Virtual image rendering with dashed back-projections. Singularity at d_o = f handled (parallel exit rays, "at infinity").

**Readouts:** f, d_o, d_i, M, image nature (real/virtual, upright/inverted), λ

### Module 3: Double-Slit Interference

**Controls:** Wavelength (380–700 nm), slit spacing d (5–200 µm), slit width a (1–80 µm, clamped to a ≤ d), screen distance L (0.2–3.0 m), diffraction envelope toggle.

**Physics:** I(θ) = cos²(πd·sinθ/λ) × sinc²(πa·sinθ/λ). Physical screen coordinates: sinθ = y/√(y²+L²). Circular Huygens wavefronts from both slits. Screen position and fringe spacing respond to d and L.

**Readouts:** λ, d, a, L, Δy (fringe spacing), θ₁

### Module 4: Single-Slit Diffraction

**Controls:** Wavelength (380–700 nm), slit width a (1–100 µm), screen distance L (0.2–3.0 m).

**Physics:** I(θ) = sinc²(πa·sinθ/λ). Same physical coordinate mapping. Screen position scales with L. Visual slit width scales with a.

**Readouts:** λ, a, L, central maximum width, θ₁ (first minimum)

### Module 5: Diffraction Grating

**Controls:** Wavelength (380–700 nm), slit spacing d (1–50 µm), number of slits N (2–20), screen distance L (0.2–3.0 m), diffraction envelope toggle.

**Physics:** I(θ) = [sin(Nβ)/(N·sinβ)]² × sinc²(α) where β = πd·sinθ/λ, α = πa·sinθ/λ (a = d/5 assumed). Same physical coordinate mapping. Huygens wavefronts from every slit. Principal maxima sharpen with N, fringe spacing responds to d and L.

**Readouts:** λ, d, N, L, θ₁, R (resolving power at m=1)

---

## Technical Architecture

**Stack:** Single HTML file, vanilla JavaScript, Canvas2D rendering  
**External dependencies:** Google Fonts (Share Tech Mono, Orbitron) — gracefully degrades  
**Rendering:** HiDPI-aware canvas (devicePixelRatio scaling), real-time redraw on slider input  
**Physics engine:** Pure JS, no libraries  
**Accessibility:** ARIA tab roles, keyboard navigation (←/→ switch modules)  
**Design:** Peirastes Instrument Full tier — chassis gradients, CRT screens, rivets, amber/cyan palette. Matches Collision Lab benchmark.

**Wave optics coordinate system:** All three wave modules use physical screen coordinates with viewHalf = 0.3m and exact geometry sinθ = y/√(y²+L²). This ensures d, a, L, and λ all visibly affect the interference/diffraction pattern — no auto-scaling masks the physics.

**Beam rendering:** 5-layer glow stack (outer bloom → white highlight core).

**Cauchy dispersion coefficients** (λ in nm):

| Material | B | C |
|----------|-------|-------|
| Water | 1.3199 | 6878 |
| Crown glass | 1.5046 | 4200 |
| Diamond | 2.3780 | 12200 |

---

## Design Philosophy

1. **The beam color is the physics.** Beam hue computed from CIE spectral approximation. Dispersion splits white into constituent spectral colors at Cauchy-corrected angles.

2. **Continuity over cases.** Parameters sweep continuously through qualitative transitions — critical angle, focal point singularity, fringe collapse.

3. **Dark bench, bright light.** CRT-dark background makes beams read as coherent light, not geometric lines.

4. **Sliders are the lab bench.** Every physical parameter has a slider. Every slider visibly changes the output. No dead controls.

---

## Deployment

- **Root entry point:** `Website/optics-lab/index.html` (iframe wrapper with OG meta)
- **App file:** `Website/optics-lab/optics_lab.html` (standalone, 1270 lines)
- **Source copy:** `Website/projects/optics-lab/optics_lab.html` (synced with root)
- **projects.json:** `id: project28`, `type: instrument`, `link: optics-lab/index.html`

---

## Changelog

### v2.0 (2026-04-06) — Wave Optics Complete
- Added Modules 3–5: Double-Slit, Single-Slit, Diffraction Grating
- Physical screen coordinate system (sinθ = y/√(y²+L²)) for all wave modules
- All sliders functional: d, a, N, L, λ visibly affect patterns
- Huygens wavefronts from every slit source (including N-slit grating)
- Diffraction envelope overlay (toggleable) for double-slit and grating
- Restyled to Peirastes Instrument Full aesthetic (collision-lab benchmark match)
- Synced projects/optics-lab/ with deployed root version

### v1.0 (2026-04-02) — Ray Optics MVP
- Modules 1–2: Snell's Law + Thin Lenses
- Cauchy dispersion, TIR, virtual imaging, singularity handling
- HiDPI canvas, responsive layout, ARIA keyboard navigation
- 5-layer beam glow rendering
- OG meta tags, Peirastes home link

---

## Future Improvements (backlog, not blocking)

- [ ] Touch-drag on canvas (drag incidence angle, drag lens object)
- [ ] Preset buttons for homework problem values
- [ ] Restore third principal ray (focal ray) in thin lens module
- [ ] EM wave / Poynting vector module
- [ ] Export/screenshot for student submissions

---

## File Manifest

| File | Description |
|------|-------------|
| `optics_lab.html` | Complete standalone simulator (5 modules) |
| `optics_lab_project.md` | This document |
