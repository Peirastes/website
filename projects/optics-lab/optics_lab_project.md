# Optics Lab — Interactive Physics Simulator

**Status:** v3.0 — 5 modules with gas discharge spectroscopy, Fresnel reflection, share URLs  
**Author:** [peirastes](https://peirastes.com)  
**Origin:** PHY 2114 — Physics II, University of Central Oklahoma  
**Coverage:** Snell's Law, TIR, Fresnel Reflection, Thin Lenses, Double-Slit, Single-Slit, Diffraction Grating, Gas Discharge Spectroscopy  
**Deployed:** `peirastes.com/optics-lab/`

---

## Overview

Optics Lab is a browser-based interactive simulator covering both ray optics and wave optics. Every parameter is a live slider — students watch Snell's law break into TIR, drag objects through focal points, select gas discharge tubes, and see emission spectra resolve through a diffraction grating in real time.

Single self-contained HTML file. No build step, no frameworks, no server. Canvas2D rendering, vanilla JavaScript, two Google Fonts (graceful degradation to system fonts).

---

## Modules

### Module 1: Snell's Law & Total Internal Reflection

**Controls:** Upper/lower medium selectors (air, water, crown glass, diamond), wavelength (380–700 nm), incidence angle (0–89°), light direction toggle, dispersion toggle.

**Physics:** Snell's law with real-time refracted rays. TIR detection + critical angle indicator. Cauchy dispersion model n(λ) = B + C/λ² for all media. White-light dispersion splits into ~15 spectral wavelengths. **Fresnel partial reflection** at all non-TIR angles — reflected beam intensity follows the average of Rs and Rp for unpolarized light, growing from ~2% at normal incidence to 100% at the critical angle.

**Readouts:** n₁, n₂ (wavelength-dependent), θ₁, θ₂ (or TIR), θ_c, R (reflectance %), λ

### Module 2: Thin Lenses

**Controls:** Lens type (converging/diverging), focal length (3–40 cm), object distance (2–80 cm), object height (2–20 cm).

**Physics:** Thin lens equation 1/d_o + 1/d_i = 1/f. **Three principal rays:** (1) parallel to axis → through F', (2) through lens center → straight, (3) through F → exits parallel. Virtual image rendering with dashed back-projections. 2f and 2f' axis markers. Singularity at d_o = f handled (parallel exit rays, "image at ∞" canvas annotation). 3rd ray auto-hides when geometry exceeds drawn lens height.

**Readouts:** f, d_o, d_i, h_o, h_i, M, image nature (real/virtual, upright/inverted)

### Module 3: Double-Slit Interference

**Controls:** Wavelength (380–700 nm), slit spacing d (5–200 µm), slit width a (1–80 µm, clamped to a ≤ d), screen distance L (0.2–3.0 m), diffraction envelope toggle, **light source selector** (mono/white/H/He/Hg/Na/Ne), stretch dim lines toggle.

**Physics:** I(θ) = cos²(πd·sinθ/λ) × sinc²(πa·sinθ/λ). Physical screen coordinates: sinθ = y/√(y²+L²). Adaptive viewport. Circular Huygens wavefronts from both slits. Gas discharge sources: per-pixel spectral RGB accumulation from real emission lines. Diffraction envelope hidden in multi-line mode.

**Readouts:** λ (or source label), d, a, L, Δy (fringe spacing, uses dominant line for gas sources), θ₁

### Module 4: Single-Slit Diffraction

**Controls:** Wavelength (380–700 nm), slit width a (1–100 µm), screen distance L (0.2–3.0 m), **light source selector**, stretch dim lines toggle.

**Physics:** I(θ) = sinc²(πa·sinθ/λ). Same physical coordinate mapping. Adaptive viewport. Gas discharge spectral rendering.

**Readouts:** λ (or source label), a, L, central maximum width (uses dominant line), θ₁ (first minimum)

### Module 5: Diffraction Grating

**Controls:** Wavelength (380–700 nm), slit spacing d (1–50 µm), **slit width a (0.5–20 µm)**, number of slits N (1–200), screen distance L (0.2–3.0 m), diffraction envelope toggle, **light source selector**, stretch dim lines toggle.

**Physics:** I(θ) = [sin(Nβ)/(N·sinβ)]² × sinc²(α) where β = πd·sinθ/λ, α = πa·sinθ/λ. Adaptive viewport auto-widens at small d. L'Hôpital guard at β=mπ. N=1 degenerates to single-slit diffraction. Huygens wavefronts from every slit with √N opacity scaling. Gas discharge sources with per-pixel spectral accumulation and tube color rendering.

**Readouts:** λ (or source label), d, a, N, L, θ₁ (uses dominant line), R (resolving power at m=1)

---

## Gas Discharge Light Sources

All three wave modules share a light source selector with 7 options:

| Source | Lines | Dominant λ | Tube color |
|--------|-------|-----------|------------|
| Monochromatic | slider λ | — | spectral |
| White (continuous) | 380–700 nm, uniform | — | white |
| Hydrogen (H) | 656.3, 486.1, 434.0, 410.2 nm | Hα 656 nm | pink |
| Helium (He) | 667.8, 587.6, 501.6, 492.2, 471.3, 447.1, 438.8, 402.6 nm | D₃ 588 nm | yellow |
| Mercury (Hg) | 579.0, 577.0, 546.1, 435.8, 404.7 nm | green 546 nm | cyan-green |
| Sodium (Na) | 589.0, 589.6 nm | D₂ 589 nm | yellow |
| Neon (Ne) | 640.2, 621.7, 614.3, 585.2, 576.4, 540.1, 659.9 nm | 640 nm | red-orange |

Emission line wavelengths from NIST databases. Relative intensities approximate standard discharge tube brightness ratios. Tube color computed from intensity-weighted spectral RGB sum.

**Stretch dim lines:** pow(I, 0.3) alpha compression on the screen glow, default ON. Boosts faint m≥1 emission lines that would otherwise be invisible against the bright m=0 central peak. Toggle OFF for honest linear intensity rendering.

---

## Technical Architecture

**Stack:** Single HTML file (1530 lines), vanilla JavaScript, Canvas2D rendering  
**External dependencies:** Google Fonts (Share Tech Mono, Orbitron), KaTeX 0.16.11 — both gracefully degrade  
**Rendering:** HiDPI-aware canvas (devicePixelRatio scaling), real-time redraw on slider input  
**Physics engine:** Pure JS, no libraries  
**Accessibility:** ARIA tablist roles on both tab groups, keyboard navigation (←/→)  
**Design:** Peirastes Instrument Full tier — chassis gradients, CRT screens, rivets, amber/cyan palette

**Adaptive viewport:** `adaptViewHalf(λ_nm, dim_m, L)` computes the detection screen half-height from the m=1 position of the longest wavelength in the source. Floor 0.3 m, cap 2.0 m, 1.3× margin. Ensures first-order peaks stay on-screen even at small d.

**Spectral pattern engine:** `computePattern()` shared by all wave modules. In mono mode, evaluates the intensity function at the slider wavelength. In multi-line mode, loops over the source's emission lines, accumulates intensity-weighted RGB per pixel, normalizes by max channel. `screenRGB()` extracts per-pixel color for the screen glow strip.

**Share URL:** `saveHash()` serializes the active tab + all non-default control values into the URL hash on every render. `loadHash()` parses hash on page load and restores full state. Only non-default values are encoded, keeping URLs short.

**Beam rendering:** 5-layer glow stack (outer bloom → white highlight core).

**Cauchy dispersion coefficients** (λ in nm):

| Material | B | C |
|----------|-------|-------|
| Water | 1.3199 | 6878 |
| Crown glass | 1.5046 | 4200 |
| Diamond | 2.3780 | 12200 |

---

## Design Philosophy

1. **The beam color is the physics.** Beam hue computed from CIE spectral approximation. Dispersion splits white into constituent spectral colors at Cauchy-corrected angles. Gas tube glow computed from emission line weights.

2. **Continuity over cases.** Parameters sweep continuously through qualitative transitions — critical angle, focal point singularity, fringe collapse, spectral line resolution.

3. **Dark bench, bright light.** CRT-dark background makes beams read as coherent light, not geometric lines.

4. **Sliders are the lab bench.** Every physical parameter has a slider. Every slider visibly changes the output. No dead controls.

5. **Shareable configurations.** Every slider state lives in the URL. Instructors can send a link; students open the exact setup.

---

## Deployment

- **Root entry point:** `Website/optics-lab/index.html` (iframe wrapper with OG meta)
- **App file:** `Website/optics-lab/optics_lab.html` (standalone, 1530 lines)
- **Source copy:** `Website/projects/optics-lab/optics_lab.html` (synced with root)
- **projects.json:** `id: project29`, `type: instrument`, `link: optics-lab/index.html`

---

## Changelog

### v3.0 (2026-04-20) — Spectroscopy, Fresnel, Share URLs
- Gas discharge light sources: H, He, Hg, Na, Ne with real NIST emission lines
- Tube color rendering: beam and Huygens wavelets glow in characteristic gas color
- Stretch dim lines toggle (pow 0.3) for faint spectral features
- Fresnel partial reflection on Snell module (average Rs/Rp, R% card)
- 3rd principal ray on lens module (through F → exits parallel)
- 2f/2f' axis markers on lens module
- Object height slider (2–20 cm) with h₀/hᵢ readout cards on lens
- "Image at ∞" canvas annotation at focal-point singularity
- Independent slit width `a` slider on grating (was hardcoded d/5)
- Grating N range extended to 1–200 (was 2–20)
- Adaptive viewport: auto-widens at small d so m≥1 stays visible
- Readout cards use dominant emission line wavelength for gas sources
- Diffraction envelope hidden in multi-line mode
- Share URL: state encoded in hash, "Copy share link" button, full restore on load
- Reset-to-defaults button per module
- Snell default changed to air→water
- Cosmetic lens λ slider removed (f is achromatic)
- Wave optics plane wave / wavelet opacity increased for visibility
- Wave spacing visual clamps relaxed (full 380–700 nm variation)
- Grating slit separation visual clamp relaxed (tracks d beyond 22 µm)
- Grating visual slit width now reflects actual a/d ratio
- Meta/OG descriptions updated, Wave Optics role="tablist" added

### v2.0 (2026-04-06) — Wave Optics Complete
- Added Modules 3–5: Double-Slit, Single-Slit, Diffraction Grating
- Physical screen coordinate system for all wave modules
- Huygens wavefronts, diffraction envelope overlay
- Restyled to Peirastes Instrument Full aesthetic
- Synced projects/optics-lab/ with deployed root version

### v1.0 (2026-04-02) — Ray Optics MVP
- Modules 1–2: Snell's Law + Thin Lenses
- Cauchy dispersion, TIR, virtual imaging, singularity handling
- HiDPI canvas, responsive layout, ARIA keyboard navigation
- 5-layer beam glow rendering

---

## Future Improvements (backlog, not blocking)

- [ ] Touch-drag on canvas (drag incidence angle, drag lens object)
- [ ] Module 6: Rayleigh criterion (circular aperture, two point sources)
- [ ] Preset buttons for homework problem values
- [ ] Brewster's angle indicator on Snell module
- [ ] EM wave / Poynting vector module
- [ ] Export/screenshot for student submissions

---

## File Manifest

| File | Description |
|------|-------------|
| `optics_lab.html` | Complete standalone simulator (5 modules, 1530 lines) |
| `optics_lab_project.md` | This document |
