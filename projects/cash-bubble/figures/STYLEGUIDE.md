# Figure Styleguide — Thermofluidic Finance

Design conventions for SVG figures in the paper and project page. Follow these to keep new figures visually consistent with the existing set.

---

## Format

- **Type:** External `.svg` files (not inline SVG)
- **ViewBox:** `viewBox="0 0 800 H"` where H varies by figure (typically 280–500)
- **No explicit width/height** — scaling handled by the `autoscaled-img` CSS class
- **Background:** Always include `<rect width="800" height="H" fill="#FFFFFF"/>` as the first element (ensures readability in dark mode)

## Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| Primary accent | `#FF5500` | Arrows, highlights, "warm" data series, matches site `--primary-accent` |
| Secondary accent | `#0088AA` | Secondary data series, cool-toned elements |
| Text | `#333333` | Axis labels, titles, bold annotations |
| Grid / secondary text | `#999999` | Tick labels, captions, dashed guidelines |
| Warm fill | `#FFF3E0` | Light background for warm-coded regions |
| Cool fill | `#E0F4F4` | Light background for cool-coded regions |
| Background | `#FFFFFF` | SVG canvas |

For translucent fills (shaded regions under curves, region backgrounds), use `rgba()` variants:
- `rgba(255,85,0,0.12–0.15)` — warm shading
- `rgba(0,136,170,0.06–0.18)` — cool shading

## Typography

- **Font:** `font-family="Georgia, serif"` for all text
- **Titles/labels:** `font-size="14–18"`, `font-weight="bold"`, `fill="#333333"`
- **Axis labels:** `font-size="16"`, `font-style="italic"`
- **Tick/secondary labels:** `font-size="12–13"`, `fill="#999999"`
- **Figure caption:** Rendered in HTML, not baked into the SVG (though an in-SVG caption at the bottom in `#999999` at `font-size="13"` is acceptable for standalone viewing)
- **Math variables:** Use `font-style="italic"` — e.g., `<text font-style="italic">P</text>`
- **Greek letters:** Use Unicode directly — τ (U+03C4), ρ (U+03C1), σ (U+03C3), κ (U+03BA), β (U+03B2), δ (U+03B4), γ (U+03B3)
- **Subscripts:** Use `<tspan font-size="9" dy="3">12</tspan><tspan dy="-3">...</tspan>` pattern

## Common Defs

Include a shared arrowhead marker in each SVG:

```xml
<defs>
  <marker id="arrow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
    <polygon points="0 0,10 3.5,0 7" fill="#FF5500"/>
  </marker>
</defs>
```

For axes (neutral arrows), use `fill="#333333"` instead.

## Axes

- Stroke: `#333333`, `stroke-width="2"`
- Arrow marker on positive end
- Axis label positioned outside the plot area, rotated -90° for vertical axes
- Tick marks: short lines (`stroke-width="1.5"`)
- Dashed reference lines: `stroke-dasharray="4,4"` or `"6,4"` in `#999999`

## Data Series

| Style | Meaning |
|-------|---------|
| Solid, `stroke-width="2.5"`, `#FF5500` | Primary / "healthy" / Path 1 |
| Dashed (`stroke-dasharray="8,5"`), `stroke-width="2.5"`, `#0088AA` | Secondary / "unhealthy" / Path 2 |
| Filled region with low opacity | Area under curve / enclosed region |

For computed curves (Gaussians, etc.), sample at ~8px intervals for smooth rendering.

## Diagram Elements

- **Tanks/containers:** `rx="4" ry="4"` rounded rectangles, `stroke="#333333"`, `stroke-width="2"`
- **Sealed lids:** Overwidth line across the top (`stroke-width="3.5"`)
- **Open tops:** Omit top stroke; draw only short vertical side strokes at the top
- **Flow arrows:** `#FF5500`, `stroke-width="2.5"`, with arrowhead markers
- **Annotation brackets:** `#999999`, `stroke-width="1"`, connecting lines with centered italic label

## HTML Integration

Each figure in `cash-bubble.html` uses this pattern:

```html
<div style="text-align: center; margin: 2rem 0;">
  <a href="cash-bubble/figures/figN-name.svg" class="lightbox-trigger">
    <img src="cash-bubble/figures/figN-name.svg" alt="Figure N: ..." class="autoscaled-img">
  </a>
  <p class="figure-caption"><strong>Figure N:</strong> Caption text.</p>
</div>
```

- Paths are relative to `projects/` (where `cash-bubble.html` lives)
- `autoscaled-img` class: `width: 100%; max-width: 800px; height: auto`
- `figure-caption` class: centered Georgia, `0.95rem`, `var(--text-secondary)`
- Lightbox handled by existing overlay + JS in the page footer

## Markdown Integration

In `The_Cash_Bubble_Hypothesis_v05.md`:

```markdown
![Figure N: Alt text](figures/figN-name.svg)

*Figure N: Caption text.*
```

Paths are relative to the `cash-bubble/` directory where the MD file lives.

## Naming Convention

```
figN-descriptive-name.svg
```

Examples: `fig1-multi-tank-topology.svg`, `fig2-compressibility-spectrum.svg`

## Existing Figures

| # | File | Section | Dimensions |
|---|------|---------|------------|
| 1 | `fig1-multi-tank-topology.svg` | §2.3 | 800 × 480 |
| 2 | `fig2-compressibility-spectrum.svg` | §3.5 | 800 × 280 |
| 3 | `fig3-pv-process-diagram.svg` | §3.3 | 800 × 500 |
| 4 | `fig4-depth-distribution.svg` | §4.7 | 800 × 440 |
