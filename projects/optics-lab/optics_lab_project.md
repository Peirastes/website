# Optics Lab — Interactive Physics Simulator

**Status:** MVP complete (Modules 1–2, deployment-ready)  
**Author:** [peirastes](https://peirastes.com)  
**Origin:** PHY 2114 — Physics II, University of Central Oklahoma  
**Coverage:** Snell's Law, Total Internal Reflection, Thin Lenses, Chromatic Dispersion

---

## Overview

Optics Lab is a browser-based interactive simulator that gives students direct control over the degrees of freedom in fundamental optical systems. Rather than static textbook diagrams, every parameter is a live slider — students can watch Snell's law break down into total internal reflection in real time, or drag an object through a lens's focal point and see the image flip from real/inverted to virtual/upright.

The simulator is a single self-contained HTML file with no external dependencies beyond two Google Fonts (graceful degradation to system fonts). It runs entirely client-side with Canvas2D rendering and vanilla JavaScript.

---

## Current Modules

### Module 1: Snell's Law & Total Internal Reflection

**Controls:**
- Upper medium selector (air, water, crown glass, diamond)
- Lower medium selector (air, water, crown glass, diamond)
- Wavelength slider (380–700 nm) — beam color tracks the visible spectrum
- Incidence angle slider (0–89°)
- Light direction toggle (upward from lower medium / downward from upper medium)
- Dispersion toggle (white light → spectrum fan)

**Physics implemented:**
- Snell's law: n₁ sin θ₁ = n₂ sin θ₂ with real-time refracted ray
- Total internal reflection detection with reflected ray rendering
- Critical angle computation and dashed indicator line
- Cauchy dispersion model: n(λ) = B + C/λ² with calibrated coefficients for water, crown glass, and diamond
- Dispersion mode: white incident beam splits into ~15 discrete wavelengths, each refracting at its own Cauchy-corrected angle

**Readouts:** n₁, n₂ (wavelength-dependent, 3 decimal places), θ₁, θ₂ (or "TIR"), θ_c, λ

**Equation reference strip:** n₁ sin θ₁ = n₂ sin θ₂ · θ_c = sin⁻¹(n₂/n₁) · n(λ) = B + C/λ²

---

### Module 2: Thin Lenses

**Controls:**
- Lens type selector (converging / diverging)
- Focal length |f| slider (3–40 cm)
- Wavelength slider (380–700 nm)
- Object distance d_o slider (2–80 cm)

**Physics implemented:**
- Thin lens equation: 1/d_o + 1/d_i = 1/f
- Magnification: M = −d_i / d_o
- Two principal rays traced in real time:
  - Parallel ray: enters parallel to axis → refracts through F' (converging) or diverges from F (diverging)
  - Central ray: passes straight through lens center
- Virtual image rendering: dashed image arrow and dashed back-projections
- Singularity handling: at d_o = f, image reported as "at infinity" with parallel exit rays
- Off-screen handling: rays extend to canvas edges with correct geometry when object or image falls outside the visible frame

**Readouts:** f, d_o, d_i, M, image nature (real/virtual, upright/inverted), λ

**Equation reference strip:** 1/d_o + 1/d_i = 1/f · M = −d_i/d_o · f > 0 converging · f < 0 diverging

---

## Technical Architecture

**Stack:** Single HTML file, vanilla JavaScript, Canvas2D rendering  
**External dependencies:** Google Fonts (JetBrains Mono, DM Sans) — gracefully degrades to system fonts  
**Rendering:** HiDPI-aware canvas (scales to devicePixelRatio) with real-time redraw on every slider input event  
**Physics engine:** All computations in pure JS — no libraries, no server calls  
**Accessibility:** ARIA tab roles, keyboard navigation (arrow keys switch modules), focus-visible outlines  
**Portfolio-ready:** OG meta tags, theme-color, footer attribution, responsive layout

**Beam rendering pipeline** (5-layer glow stack, tuned for clarity):
1. Outer bloom (+12px, α = 0.04)
2. Mid glow (+6px, α = 0.10)
3. Inner glow (+3px, α = 0.25)
4. Core beam (base width, α = 0.70)
5. White highlight (35% width, white at α = 0.25)

**Wavelength-to-RGB conversion:** Piecewise linear approximation of the CIE visible spectrum with gamma correction (0.8) and intensity tapering at the violet and red tails.

**Cauchy dispersion coefficients** (λ in nm):

| Material | B | C |
|----------|-------|-------|
| Water | 1.3199 | 6878 |
| Crown glass | 1.5046 | 4200 |
| Diamond | 2.3780 | 12200 |

Note: C coefficients are calibrated to nm² units. Reference tables typically use μm², requiring a ×10⁶ conversion.

---

## Design Philosophy

1. **The beam color is the physics.** The beam hue is computed directly from the wavelength slider via CIE spectral approximation. In dispersion mode, a white beam splits into constituent spectral colors, each refracting at its own Cauchy-corrected angle. The visual output *is* the physical prediction.

2. **Continuity over cases.** Rather than presenting separate worked examples, the simulator lets students drag parameters continuously through qualitative transitions — through the critical angle for TIR, through the focal point for lens imaging. Singularities are handled gracefully.

3. **Dark bench, bright light.** The dark background is functional: on a real optical bench, you see bright beams against a dark room. The glow rendering (tuned for clarity over spectacle) makes beams read as coherent light rather than geometric lines.

---

## Completed in MVP Polish Pass

- HiDPI canvas rendering (crisp on Retina displays)
- Responsive canvas sizing via aspect-ratio CSS
- Module info bars with orientation text and chapter references
- Equation reference strips below each canvas
- Light direction toggle (upward/downward) for Snell's law module
- Corrected angle arc placement (θ₁ and θ₂ on correct sides of normal for both directions)
- Corrected critical angle indicator positioning
- Removed partial reflection reference beam (caused visual confusion)
- Reduced beam glow intensity for better arrowhead visibility
- Increased arrowhead opacity to full
- Centered thin lens in frame
- Fixed thin lens ray geometry for off-screen object/image positions
- Removed unstable third principal ray (focal ray); two rays suffice for image determination
- ARIA tab roles and keyboard navigation (←/→ arrows)
- OG meta tags and theme-color for portfolio sharing
- Footer with peirastes.com attribution
- Slider thumb hover effects and card hover transitions

---

## Roadmap

### Near-term improvements
- [ ] Touch-drag interaction on canvas (drag the incidence angle directly, drag the object on the lens axis)
- [ ] Dynamic scale factor for thin lens module (auto-scale when object/image distances are large)
- [ ] Preset buttons for specific homework problem values (e.g., "water→air, 40°")
- [ ] Export/screenshot functionality for student submissions
- [ ] Restore third principal ray (focal ray) with robust geometry handling across all d_o values

### Future modules
- [ ] Module 3: Young's double-slit experiment (intensity plot + geometric diagram)
- [ ] Module 4: Single-slit diffraction + grating mode + Rayleigh criterion
- [ ] Module 5: EM wave intensity calculator + spectrum explorer

### Experimental
- [ ] Dispersion comparison tool: measure d(n₁/n₂)/dλ across material pairs
- [ ] Deployment to peirastes.com as a standalone course resource

---

## File Manifest

| File | Description |
|------|-------------|
| `optics_lab.html` | Complete standalone simulator (Modules 1–2, MVP) |
| `optics_lab_project.md` | This document |
