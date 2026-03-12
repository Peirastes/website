# Peirastes Application Style Guide
**Version 2.1 — 2026-03-11**
**Maintained by: CD Agent**

---

## 1. Design Philosophy

Peirastes applications are **instruments**. Not dashboards, not pages — instruments. They exist to help the operator think, to compress complexity into physical-feeling interfaces that reward careful attention. The two benchmark apps — **Cash Bubble Simulator** and **Capacitor Dielectric Lab** — establish the design DNA: they look like things you'd find in a well-funded research lab, circa 1985, rebuilt with modern web technology.

### Core Principles

1. **Dark-first, deep-black.** The operator works for hours. Backgrounds are near-black (`#040608`–`#0a0e12`), never merely "dark gray." This makes color meaningful and reduces fatigue.

2. **Material depth over flat design.** Surfaces have weight. Panels are inset. Buttons feel like buttons. Multi-stop metallic gradients, layered shadows, and procedural textures create the illusion of physical material. This is not decoration — it's wayfinding. Depth tells you what's interactive, what's a container, and what's a display.

3. **Data is the interface.** The visualization — graph, simulation, readout — is the center of gravity. UI chrome recedes around it. If you can't tell at a glance what the app *does*, the chrome is too loud.

4. **Color carries meaning, never decoration.** Green = good/confirmed. Amber/orange = elevated/uncertain. Red = critical/unconfirmed. Cyan = data/cool state. Every hue earns its place.

5. **Monospace for measurement.** Anything the operator might compare numerically — prices, coordinates, scores, IDs, dates — is rendered in monospace. This is non-negotiable.

6. **Restraint in motion.** No bounce, no elastic, no entrance animations. Motion exists to communicate state change (a panel sliding open) or liveness (a breathing LED). If nothing is changing, nothing should be moving.

---

## 2. Surface Treatments

The instrument aesthetic applies at two intensities. Choose based on the app's character.

### 2.1 Instrument Surface (Full)

Used for: simulation-heavy, single-purpose tools (Cash Bubble, Capacitor Lab).

- Multi-stop metallic gradients on panels/chassis
- Inset shadows for recessed areas (screens, wells, readout boxes)
- SVG procedural textures (metal grain, rust, noise) as background overlays
- Hardware details: rivets, nameplates, bezels, knobs
- CRT/scanline effects on data displays
- Glow effects (`box-shadow: 0 0 Npx`) on active/powered elements
- Very tight spacing (4–8px gaps)

### 2.2 Instrument Surface (Analytical)

Used for: multi-panel explorers, dashboards, reference tools (KB Explorer, Spectrum, ECDO Watch).

- Same near-black backgrounds and color semantics
- Simplified panels: single-stop dark backgrounds with subtle border + inset shadow
- `backdrop-filter: blur(10px)` on floating overlays (tooltips, modals, slide-out panels)
- No procedural textures — depth comes from layered transparency and border contrast
- Slightly looser spacing (12–20px padding)
- Cleaner type hierarchy (sans-serif body, monospace data)

Both tiers share the same color system, the same respect for darkness, and the same "instrument" ethos. The difference is surface complexity, not philosophy.

### 2.3 How to Choose a Tier

```
Is the app a self-contained simulation or single-focus instrument?
  YES → Does it have a primary canvas/viewport the user stares at for minutes?
    YES → Instrument (Full)     e.g. Cash Bubble, Capacitor Lab
    NO  → Analytical            e.g. Eisenhower matrix
  NO → Is it a multi-panel explorer, dashboard, or reference tool?
    YES → Analytical            e.g. KB Explorer, ECDO Watch, Spectrum
    NO  → Analytical (default)
```

**Rule of thumb:** If the app benefits from looking like a *physical device*, use Instrument. If it benefits from looking like a *window into data*, use Analytical. When in doubt, use Analytical — it's simpler to build and easier to maintain.

---

## 3. Layout & Responsive Targets

### 3.1 Breakpoints

| Name | Width | Target |
|------|-------|--------|
| `sm` | < 640px | Phone (portrait) |
| `md` | 640–1023px | Phone (landscape), small tablet |
| `lg` | 1024–1439px | Tablet, small laptop |
| `xl` | 1440–1919px | Laptop, desktop |
| `2xl` | 1920px+ | Large monitor |

**Primary design target:** `xl` (1440px). Scale down gracefully, scale up with breathing room.

### 3.2 Container Strategy

| Context | Approach |
|---------|----------|
| **Full-bleed instruments** (Cash Bubble, Capacitor Lab, KB Explorer, ECDO Watch) | No max-width. Fill viewport. Fixed sidebars/panels. Canvas/SVG occupies remaining flex space. |
| **Document pages** (project pages, papers) | `max-width: 900px`, centered, comfortable reading margins. |
| **Grid tools** (Eisenhower) | `max-width: 1280px`, centered, CSS Grid internal layout. |

### 3.3 Grid

- **Instrument 3-column:** `grid-template-columns: 1fr [center]px 1fr` — fixed-width center with flexible wings. Cash Bubble uses `1fr 170px 1fr`, Capacitor Lab uses `1fr 260px 1fr`.
- **Card grids:** `repeat(auto-fit, minmax(320px, 1fr))` with `gap: 16px`
- **Full-bleed analytical:** Flex with `flex: 1` on the canvas/visualization area, absolute/fixed overlays for panels.

### 3.4 Responsive Behavior

| Breakpoint | What changes |
|------------|-------------|
| `2xl` → `xl` | No change. This is the primary target. |
| `xl` → `lg` | 3-column instrument grid collapses to 2 columns (center + stacked wings). Side panels reduce to 320px. Font sizes unchanged. |
| `lg` → `md` | Side panels become bottom sheets or full-screen overlays. Instrument chrome hides non-essential panels (show on tap/toggle). Grid becomes single-column stack. Reduce `--sp-8` padding to `--sp-6`. |
| `md` → `sm` | Toolbar collapses to hamburger menu. Canvas/visualization goes full-width. All panels are overlays. Consider whether the app is usable at all — some instruments (Cash Bubble) may show a "rotate device" prompt instead. |

**Font size scaling:** Do not scale fonts down at smaller breakpoints. The type scale is already small. Instead, hide non-essential labels and rely on tooltips/tap-to-reveal.

### 3.5 Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| `--sp-1` | 4px | Inline gaps, rivet spacing, tight instrument labels |
| `--sp-2` | 6px | Sub-panel internal padding (instrument tier) |
| `--sp-3` | 8px | Card padding (compact), button padding |
| `--sp-4` | 12px | Standard panel padding, grid gaps |
| `--sp-6` | 16px | Section separation, analytical panel padding |
| `--sp-8` | 20px | Major panel padding (analytical tier) |
| `--sp-12` | 32px | Page-level vertical rhythm |

---

## 4. Color System

### 4.1 Core Palette

#### Backgrounds (dark theme)

| Token | Hex | Use |
|-------|-----|-----|
| `--bg-void` | `#040608` | Deepest background, page/viewport |
| `--bg-base` | `#0a0e12` | Primary app background |
| `--bg-surface` | `#1e2428` | Panels, sub-containers |
| `--bg-raised` | `#2e3438` | Headers, toolbars, elevated chrome |
| `--bg-input` | `#1a1e2c` | Input fields, interactive wells |
| `--bg-hover` | `#3c4246` | Hover states |

#### Metallic Scale (instrument tier only)

| Token | Hex | Use |
|-------|-----|-----|
| `--metal-1` | `#586064` | Highlight edge (top of gradient) |
| `--metal-2` | `#4e5458` | Upper mid |
| `--metal-3` | `#3c4246` | Center |
| `--metal-4` | `#2e3438` | Lower mid |
| `--metal-5` | `#1e2428` | Shadow edge (bottom of gradient) |
| `--metal-6` | `#0e1418` | Deepest recess |

These are the building blocks for metallic linear gradients. A typical chassis gradient sweeps from `--metal-1` through `--metal-3` to `--metal-1` (light-dark-light) to simulate curved metal.

#### Text

| Token | Hex | Use |
|-------|-----|-----|
| `--text-primary` | `#c8d0e0` | Headings, primary content |
| `--text-secondary` | `#8899aa` | Labels, supporting text |
| `--text-muted` | `#506070` | Placeholders, disabled, tertiary |
| `--text-label` | `#7a8690` | Instrument labels, section tags |

#### Borders

| Token | Hex |
|-------|-----|
| `--border-subtle` | `#1a1e2c` |
| `--border-default` | `#2a3048` |
| `--border-strong` | `#3a4260` |
| `--border-bevel-light` | `rgba(255,255,255,0.05)` |
| `--border-bevel-dark` | `rgba(0,0,0,0.4)` |

### 4.2 Brand Accent

| Token | Hex | Use |
|-------|-----|-----|
| `--accent` | `#e86030` | Primary brand accent (warm orange) — CTAs, active states |
| `--accent-hover` | `#ff7040` | Hover on accent elements |
| `--accent-muted` | `#e8603020` | Accent backgrounds |

The orange appears in the **brand layer** (nav, CTAs) and recedes in the **tool layer** (charts, workspace). Inside instruments, semantic colors (green/amber/red/cyan) dominate.

### 4.3 Semantic Colors

| Token | Hex | Glow | Use |
|-------|-----|------|-----|
| `--green` | `#33ff66` | `rgba(51,255,102,0.15)` | Success, confirmed, buy, nominal |
| `--amber` | `#ff8822` | `rgba(255,136,34,0.15)` | Warning, hypothesized, sell, elevated |
| `--red` | `#ff3344` | `rgba(255,51,68,0.15)` | Error, speculative, critical, loss |
| `--cyan` | `#00ccdd` | `rgba(0,204,221,0.15)` | Informational, data, cool state, links |

These are high-saturation neon values — they're designed to read against near-black. On lighter or mid-gray surfaces, use desaturated variants:

| Token | Hex | Use |
|-------|-----|-----|
| `--status-positive` | `#50c878` | Status badges, chart fills |
| `--status-warning` | `#fbbf24` | Status badges, chart fills |
| `--status-negative` | `#f87171` | Status badges, chart fills |
| `--status-info` | `#6ea8fe` | Status badges, chart fills |

### 4.4 Domain / Category Colors

For apps with multiple domains or categories:

| Slot | Hex | Example |
|------|-----|---------|
| Domain 1 | `#6ea8fe` | Epistemology |
| Domain 2 | `#e07050` | ECDO Theory |
| Domain 3 | `#50c878` | Thermofluidic Finance |
| Domain 4 | `#c084fc` | Dynamical Systems |
| Domain 5 | `#fbbf24` | Pedagogy |
| Domain 6 | `#f87171` | Archaeoastronomy |
| Domain 7 | `#a08850` | Quotes, warm neutral |
| Domain 8 | `#8090b0` | Foundation, steel neutral |
| Muted | `#607080` | TES concepts, low-priority |

---

## 5. Typography

### 5.1 Font Stack

| Role | Instrument Tier | Analytical Tier | Fallback |
|------|----------------|-----------------|----------|
| **Display** | Courier New | Space Grotesk | system-ui, sans-serif |
| **Labels** | Courier New (uppercase, 7px, tracked) | Space Grotesk (11px) | sans-serif |
| **Data/Mono** | Courier New | JetBrains Mono | 'Fira Code', Consolas, monospace |
| **Body** | Courier New | Space Grotesk | system-ui, sans-serif |

> **Why two stacks?** The instrument tier uses Courier New *everywhere* — it's part of the retro-lab character. Mixing in a sans-serif would break the illusion. The analytical tier uses Space Grotesk for readability at small sizes while keeping JetBrains Mono for quantitative data. Both stacks maintain the monospace-for-data rule.

> **Cinzel** stays for the main site's editorial pages (headers, hero text). It doesn't appear inside tools.

### 5.2 Type Scale

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `--text-xs` | 7px | 700 | Instrument labels, fine print (instrument tier) |
| `--text-sm` | 11px | 500 | Badges, stat values, readouts |
| `--text-base` | 13px | 400 | Body text, descriptions |
| `--text-md` | 14px | 500 | Section labels |
| `--text-lg` | 16px | 700 | Panel headers, nameplates |
| `--text-xl` | 20px | 600 | Page titles (tools) |

### 5.3 Rules

- **Monospace for quantitative data.** Always.
- **Uppercase + letter-spacing for instrument labels:** `text-transform: uppercase; letter-spacing: 0.16em; font-weight: 700; font-size: 7px`. This is the "nameplate" pattern both benchmark apps use.
- **Text-shadow on dark backgrounds:** `text-shadow: 0 1px 2px rgba(0,0,0,0.5)` improves legibility against gradients and textures.
- **No bold body text.** Use `font-weight: 500` for emphasis. Reserve `600`+ for headings and labels.
- **Line height:** `1.2` for headings, `1.5` for body, `1.3` for compact UI.

---

## 6. Material Depth Techniques

This section codifies the specific CSS techniques that give Peirastes apps their physical feel.

### 6.1 Metallic Gradients

**Chassis/container (convex surface) — Cash Bubble:**
```css
background: linear-gradient(178deg,
  #586064 0%, #4e5458 4%, #444a4e 10%,
  #3c4246 28%, #383e42 50%,
  #3c4246 72%, #444a4e 90%,
  #4e5458 96%, #586064 100%);
```

**Chassis/container (convex surface) — Capacitor Lab:**
```css
background: linear-gradient(178deg,
  #383e44 0%, #282c30 10%, #1e2024 35%,
  #111418 70%, #090a0c 100%);
```

The light-dark-light (Cash Bubble) or light-to-dark (Capacitor Lab) pattern simulates a curved metallic surface lit from above.

**Sub-panel (concave/recessed):**
```css
background: linear-gradient(175deg,
  #3a4044, #2e3438 30%, #262c30 65%, #1e2428);
```
Dark-to-darker simulates a recessed well.

**Page background (radial vignette):**
```css
/* Cash Bubble */
background: radial-gradient(ellipse at 50% 40%, #1a2024, #0a0e12 65%, #040608);

/* Capacitor Lab */
background: radial-gradient(ellipse at 50% 40%, #141618, #090a0c 65%, #040506);
```

### 6.2 Shadow Layering

**Raised surface (chassis, buttons):**
```css
box-shadow:
  0 18px 60px rgba(0,0,0,0.9),           /* ground shadow */
  0 4px 20px rgba(0,0,0,0.7),            /* close shadow */
  inset 0 1px 0 rgba(255,255,255,0.07),  /* top bevel highlight */
  inset 0 -1px 0 rgba(0,0,0,0.4);        /* bottom bevel shadow */
```

**Recessed surface (screen wells, readout boxes):**
```css
box-shadow:
  inset 0 4px 16px rgba(0,0,0,0.55),     /* deep recess */
  inset 0 1px 3px rgba(0,0,0,0.4),       /* edge shadow */
  0 1px 0 rgba(255,255,255,0.02);        /* rim highlight */
```

**Screen housing (deep recess + ambient glow):**
```css
box-shadow:
  inset 0 4px 14px rgba(0,0,0,0.8),
  inset 0 -2px 10px rgba(0,0,0,0.4),
  inset 0 0 30px rgba(200,150,60,0.04),  /* warm ambient */
  0 2px 8px rgba(0,0,0,0.5);
```

**Active glow (powered elements, LEDs):**
```css
box-shadow: 0 0 8px var(--cyan), 0 0 20px rgba(0,204,221,0.15);
```

**Pushbutton active state:**
```css
box-shadow:
  0 1px 2px rgba(0,0,0,0.4),
  inset 0 3px 8px rgba(0,0,0,0.6);       /* pressed-in */
```

### 6.3 Procedural Textures (SVG Data URIs)

Copy-paste these into your `:root` block. Apply via `::before`/`::after` pseudo-elements with `position: absolute; inset: 0; pointer-events: none`.

**Metal grain** (fine fractal noise, desaturated):
```css
--tex-metal: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
```

**Directional brush** (elongated turbulence for brushed-metal effect):
```css
--tex-brush: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.005 0.05' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='200' filter='url(%23b)' opacity='0.12'/%3E%3C/svg%3E");
```

**Rust / patina** (warm-tinted fractal noise):
```css
--tex-rust: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='r'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.3' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0.15 0.5 0 0 0 0.05 0 0 0 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23r)' opacity='0.12'/%3E%3C/svg%3E");
```

**Fine grain** (high-frequency noise for subtle surface variation):
```css
--tex-grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='turbulence' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23g)' opacity='0.04'/%3E%3C/svg%3E");
```

**Applying a texture to a panel:**
```css
.panel {
  position: relative;
  /* ... gradient, shadow, etc. ... */
}

.panel > .tex {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: var(--tex-metal);
  background-size: 300px 300px;
  mix-blend-mode: normal;
  opacity: 0.6;
}
```

Multiple textures can be layered by using multiple `.tex` children or `::before`/`::after`.

### 6.4 Screen/Display Effects

**Scanlines (CRT):**
```css
background-image: repeating-linear-gradient(0deg,
  transparent, transparent 1px,
  rgba(0,0,0,0.7) 1px, rgba(0,0,0,0.7) 2px);
```

**Vignette:**
```css
background: radial-gradient(ellipse at 50% 50%,
  transparent 48%, rgba(0,0,0,0.5) 100%);
```

**Top-edge bevel highlight** (applied as `::before` on raised panels):
```css
content: '';
position: absolute;
top: 0; left: 10%; right: 10%;
height: 1px;
background: linear-gradient(90deg,
  transparent, rgba(255,255,255,0.06) 20%,
  rgba(255,255,255,0.08) 50%,
  rgba(255,255,255,0.06) 80%, transparent);
```

**Sub-panel glow underlay** (applied as `::after`):
```css
content: '';
position: absolute;
inset: 0;
background: radial-gradient(ellipse at 50% 100%,
  rgba(0,180,220,0.03), transparent 70%);
pointer-events: none;
```

### 6.5 Analytical Depth (lighter touch)

For analytical-tier apps, depth comes from transparency and blur instead of textures:

```css
/* Floating panel */
background: rgba(14, 16, 26, 0.95);
backdrop-filter: blur(10px);
border: 1px solid var(--border-subtle);
border-radius: 8px;
box-shadow: 0 8px 32px rgba(0,0,0,0.4);
```

```css
/* Modal overlay */
background: rgba(14, 16, 26, 0.85);
backdrop-filter: blur(4px);
```

---

## 7. Components

### 7.1 Buttons

**Pushbutton (instrument tier):**
```css
width: 28px;
height: 28px;
border-radius: 50%;
border: 1px solid #0e1216;
background: radial-gradient(circle at 35% 27%,
  #5e6264, #4e5254 18%, #3e4244 38%,
  #2e3234 62%, #1e2224 85%, #121618);
box-shadow:
  0 4px 8px rgba(0,0,0,0.65),
  0 2px 3px rgba(0,0,0,0.4),
  inset 0 2px 3px rgba(255,255,255,0.06),
  inset 0 -2px 5px rgba(0,0,0,0.35);
cursor: pointer;
transition: all 0.08s ease;
```

Hover:
```css
background: radial-gradient(circle at 35% 27%,
  #686c6e, #585c5e 18%, #484c4e 38%,
  #383c3e 62%, #282c2e 85%, #1a1e20);
```

Active (pressed):
```css
transform: translateY(2px);
box-shadow:
  0 1px 2px rgba(0,0,0,0.4),
  inset 0 3px 8px rgba(0,0,0,0.6);
```

**Mode button (instrument tier, rectangular):**
```css
padding: 4px 10px;
border-radius: 3px;
border: 1px solid #0e1216;
background: linear-gradient(180deg, #2e3234, #1e2224 40%, #141618);
box-shadow: 0 2px 4px rgba(0,0,0,0.4),
  inset 0 1px 1px rgba(255,255,255,0.03);
font-family: 'Courier New', monospace;
font-size: 7px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.06em;
color: var(--text-label);
cursor: pointer;
transition: all 0.08s ease;
```

Active/on state:
```css
background: linear-gradient(180deg, #1e2224, #141618 40%, #0e1214);
box-shadow: 0 1px 2px rgba(0,0,0,0.3),
  inset 0 2px 6px rgba(0,0,0,0.4),
  0 0 8px var(--glow-color, rgba(51,255,102,0.1));
```

**Secondary button (analytical tier):**
```css
background: transparent;
border: 1px solid var(--border-default);
color: var(--text-secondary);
padding: 6px 14px;
border-radius: 6px;
font-size: 12px;
font-family: 'Space Grotesk', system-ui, sans-serif;
cursor: pointer;
transition: all 0.15s ease;
```
Hover: `background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-strong)`

**Ghost button (toolbar):**
```css
background: transparent;
border: none;
color: var(--text-muted);
padding: 4px 10px;
border-radius: 4px;
font-size: 11px;
cursor: pointer;
transition: all 0.15s ease;
```

### 7.2 Panels / Cards

**Instrument panel (sub-panel):**
```css
border: 2px solid #0e1216;
border-top-color: #1a1e22;
border-bottom-color: #080c10;
background: linear-gradient(175deg, #3a4044, #2e3438 30%, #262c30 65%, #1e2428);
box-shadow:
  inset 0 4px 16px rgba(0,0,0,0.55),
  inset 0 1px 3px rgba(0,0,0,0.4),
  0 1px 0 rgba(255,255,255,0.02);
border-radius: 5px;
position: relative;
```
Add `::before` with a 1px gradient highlight at top edge for bevel effect (see 6.4).

**Capacitor Lab sub-panel (darker variant):**
```css
border-radius: 3px;
background: linear-gradient(178deg, #1e2228 0%, #141820 30%, #0c1018 70%, #080c14 100%);
box-shadow:
  inset 0 2px 8px rgba(0,0,0,0.5),
  inset 0 -1px 6px rgba(0,0,0,0.3),
  0 4px 12px rgba(0,0,0,0.5),
  0 1px 3px rgba(0,0,0,0.3);
```

**Analytical panel:**
```css
background: rgba(14, 16, 26, 0.95);
border: 1px solid var(--border-subtle);
border-radius: 8px;
backdrop-filter: blur(10px);
padding: 16px;
```

### 7.3 Readout / Data Display

**Dark screen well (instrument tier):**
```css
background: linear-gradient(180deg, #04060a 0%, #080c12 40%, #0c1018 100%);
border-radius: 3px;
box-shadow:
  inset 0 3px 10px rgba(0,0,0,0.7),
  inset 0 -2px 8px rgba(0,0,0,0.3),
  inset 0 0 16px rgba(0,0,0,0.4),
  0 2px 5px rgba(0,0,0,0.4);
font-family: 'Courier New', monospace;
color: var(--cyan);
text-shadow: 0 0 6px rgba(0,204,221,0.15);
position: relative;
```

Glow underlay (as `::before`):
```css
content: '';
position: absolute;
inset: 0;
background: radial-gradient(ellipse at 50% 100%,
  rgba(255,200,80,0.06), rgba(255,170,40,0.02) 50%, transparent 80%);
pointer-events: none;
```

### 7.4 Badges / Tags

```css
display: inline-flex;
padding: 2px 8px;
border-radius: 3px;
font-family: 'JetBrains Mono', 'Courier New', monospace;
font-size: 10px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.04em;
```
Color pattern: `background: {status-color}18; color: {status-color};`

### 7.5 Tooltips

```css
position: fixed;
background: var(--bg-raised);
border: 1px solid var(--border-default);
border-radius: 6px;
padding: 8px 12px;
font-size: 12px;
max-width: 280px;
pointer-events: none;
backdrop-filter: blur(8px);
z-index: 200;
```

### 7.6 Side Panels (slide-out)

```css
width: 400px;
background: rgba(14, 16, 26, 0.96);
border-left: 1px solid var(--border-subtle);
backdrop-filter: blur(12px);
transition: right 0.25s ease;
overflow-y: auto;
z-index: 90;
```

### 7.7 Inputs

```css
background: var(--bg-input);
border: 1px solid var(--border-default);
border-radius: 4px;
padding: 6px 12px;
color: var(--text-primary);
font-family: 'Courier New', monospace;
font-size: 12px;
outline: none;
```
Focus: `border-color: var(--cyan); box-shadow: 0 0 0 2px rgba(0,204,221,0.15);`

### 7.8 LED Indicators

```css
width: 6px;
height: 6px;
border-radius: 50%;
background: #1a1e22;
```

On/active state:
```css
background: radial-gradient(circle at 38% 32%, #fff, var(--led-color) 35%);
box-shadow: 0 0 8px var(--led-color), 0 0 20px var(--led-color);
animation: pulse 2.5s ease-in-out infinite;
```

### 7.9 Rivets (instrument tier)

```css
width: 6px;
height: 6px;
border-radius: 50%;
background: radial-gradient(circle at 35% 28%,
  #6a6e70, #525658 22%, #3c4044 48%, #282c30 74%, #181c20);
box-shadow: 0 2px 5px rgba(0,0,0,0.7),
  inset 0 1px 1px rgba(255,255,255,0.06);
position: relative;
```

Rust ring (as `::after`):
```css
content: '';
position: absolute;
inset: -2px;
border-radius: 50%;
background: radial-gradient(circle, rgba(120,60,20,0.15) 30%,
  rgba(80,40,10,0.08) 60%, transparent 75%);
```

### 7.10 Toggle Switches (instrument tier)

**Track:**
```css
width: 28px;
height: 14px;
border-radius: 4px;
background: linear-gradient(180deg, #282c30, #181c20 30%, #080c10 50%, #181c20 70%, #282c30);
box-shadow: inset 0 3px 9px rgba(0,0,0,0.8);
```

**Thumb:**
```css
width: 12px;
height: 12px;
border-radius: 3px;
background: linear-gradient(180deg, #5a5e60, #4a4e50 30%, #3a3e40 60%, #2a2e30);
box-shadow: 0 2px 6px rgba(0,0,0,0.6),
  inset 0 1px 2px rgba(255,255,255,0.06);
```

### 7.11 Slider Inputs (instrument tier)

**Track:**
```css
background: linear-gradient(to top, #1a1e22, #2a2e32);
box-shadow: inset 0 1px 3px rgba(0,0,0,0.6);
```

**Thumb:**
```css
background: radial-gradient(circle at 35% 30%,
  #6a6e70, #4a4e50 30%, #2e3234 65%, #1a1e20);
box-shadow: 0 2px 6px rgba(0,0,0,0.6),
  inset 0 1px 2px rgba(255,255,255,0.06),
  0 0 8px rgba(0,204,221,0.15);
```

---

## 8. Motion & Interaction

### 8.1 Transitions

| Context | Duration | Easing |
|---------|----------|--------|
| Button press (instrument) | 80ms | `ease` |
| Hover color/border | 150ms | `ease` |
| Panel open/close | 250ms | `ease` |
| Opacity fade (focus mode) | 300ms | `ease` |
| Chart data load | 350ms | `ease-out` |

### 8.2 Animations (reserved use only)

```css
/* LED pulse — active indicator, powered state */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
/* Duration: 2.5s ease-in-out infinite */

/* Glow breathe — live data, background hum */
@keyframes hum {
  0%, 100% { opacity: 0.92; }
  50% { opacity: 1; }
}
/* Duration: 3s ease-in-out infinite */

/* Blink — attention-required indicator */
@keyframes blink {
  0%, 90%, 100% { opacity: 0.85; }
  30% { opacity: 0.3; }
}
/* Duration: 2s ease-in-out infinite */

/* Canvas warmup — initial display fade-in */
@keyframes warmup {
  from { filter: brightness(0); }
  to { filter: brightness(1); }
}
/* Duration: 1.2s ease-out forwards */
```

### 8.3 Rules

- **No bounce, no elastic.** `ease` or `ease-out` only.
- **No animation on page load** except data visualizations (use `warmup` for canvas).
- **Pulsing = liveness.** It means something is active, uncertain, or streaming. Don't pulse decoratively.
- **Drag should feel immediate.** No transition on position during drag.
- **Mechanical feedback:** Instrument-tier buttons should feel instant (80ms or less).

---

## 9. Data Visualization

### 9.1 Defaults

- **Background:** transparent (inherits container background)
- **Grid lines:** `var(--border-subtle)` at 0.3 opacity
- **Axis labels:** `var(--text-muted)`, monospace, 11px
- **Data lines:** 2px stroke, semantic or domain color
- **Area fills:** Color at 8–15% opacity
- **Tooltips:** Match component tooltip spec (7.5)

### 9.2 Status Encoding

| Status | Color | Opacity | Additional |
|--------|-------|---------|------------|
| Established / Confirmed | `--green` | 1.0 | Solid fill |
| Hypothesized / Elevated | `--amber` | 0.85 | Pulse animation |
| Speculative / Critical | `--red` | 0.45 | Reduced opacity |
| Unknown / Pending | `--text-muted` | 0.3 | No fill |

---

## 10. Dark / Light Mode

### 10.1 Implementation

```css
:root, [data-theme="dark"] {
  --bg-void: #040608;
  --bg-base: #0a0e12;
  /* ... dark values ... */
}

[data-theme="light"] {
  --bg-void: #f0f0f4;
  --bg-base: #f8f8fa;
  /* ... light values ... */
}
```

### 10.2 Rules

- **Dark is the default.** Every app ships dark. Light mode is optional.
- **Never invert colors mechanically.** Light mode needs its own considered palette.
- **Instrument-tier apps do not need light mode.** The retro-lab aesthetic is inherently dark. Don't force it.
- **Analytical-tier apps** may offer light mode for readability contexts (e.g., reference documentation).
- **Accent adjusts:** `#e86030` dark → `#d45520` light.
- **Shadows appear in light mode only.** In dark mode, depth comes from background shade and borders.

---

## 11. Iconography & Branding

### 11.1 Logo / Favicon

Bold orange "P" on dark ground. SVG format. Referenced via `<link rel="icon" type="image/svg+xml" href="favicon.svg">`.

### 11.2 Icons

- Prefer **no icon library.** Use Unicode, inline SVG, or CSS shapes.
- If needed, use **Lucide** (clean, MIT-licensed, small).
- Default: `--text-muted`. Hover: `--text-secondary`.
- Size: 16px inline, 20px standalone.

### 11.3 Nameplates (instrument tier)

```css
font-family: 'Courier New', monospace;
font-size: 7px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.3em;
color: var(--text-label);
text-shadow: 0 1px 2px rgba(0,0,0,0.5);
text-align: center;
```

Applied on a dark inset strip:
```css
background: linear-gradient(180deg, #1a1e24, #141820 30%, #0c1018 70%, #080c14);
border-radius: 2px;
padding: 4px 12px;
box-shadow:
  0 4px 14px rgba(0,0,0,0.7),
  inset 0 1px 0 rgba(255,255,255,0.04),
  inset 0 -1px 6px rgba(0,0,0,0.4);
```

### 11.4 Nav Bar (site-level)

Every app on peirastes.com should include a minimal top nav:

```html
<nav id="site-nav">
  <span class="nav-brand">Peirastes</span>
  <a href="/index.html">Home</a>
  <a href="/about.html">About</a>
  <a href="/current-projects.html">Projects</a>
</nav>
```

`height: 36px`, `background: var(--bg-raised)`, `border-bottom: 1px solid var(--border-subtle)`, `font-size: 11px`. Exists to orient, not to dominate.

---

## 12. Exclusions

- **Fractured Universe** has its own aesthetic (Orbitron, cyberpunk neon, glitch effects). It's a narrative project, not a tool.
- **Agent World** is an Electron-only private tool. Game UI conventions apply.
- **Academic content** (PSEII notes) follows document typography, not app conventions.

These are different *genres*, not violations.

---

## 13. Implementation Kit

### 13.1 Starter CSS — Drop this into any new app

```css
/* ── Peirastes Design Tokens v2.1 ───────────────────────────── */
:root {
  /* Backgrounds */
  --bg-void:    #040608;
  --bg-base:    #0a0e12;
  --bg-surface: #1e2428;
  --bg-raised:  #2e3438;
  --bg-input:   #1a1e2c;
  --bg-hover:   #3c4246;

  /* Metallic scale (instrument tier) */
  --metal-1: #586064;
  --metal-2: #4e5458;
  --metal-3: #3c4246;
  --metal-4: #2e3438;
  --metal-5: #1e2428;
  --metal-6: #0e1418;

  /* Text */
  --text-primary:   #c8d0e0;
  --text-secondary: #8899aa;
  --text-muted:     #506070;
  --text-label:     #7a8690;

  /* Borders */
  --border-subtle:      #1a1e2c;
  --border-default:     #2a3048;
  --border-strong:      #3a4260;
  --border-bevel-light: rgba(255,255,255,0.05);
  --border-bevel-dark:  rgba(0,0,0,0.4);

  /* Brand */
  --accent:       #e86030;
  --accent-hover: #ff7040;
  --accent-muted: rgba(232,96,48,0.12);

  /* Semantic — neon (use on near-black backgrounds) */
  --green: #33ff66;
  --amber: #ff8822;
  --red:   #ff3344;
  --cyan:  #00ccdd;
  --glow:  rgba(0,204,221,0.15);

  /* Semantic — desaturated (use on mid-gray or in badges) */
  --status-positive: #50c878;
  --status-warning:  #fbbf24;
  --status-negative: #f87171;
  --status-info:     #6ea8fe;

  /* Domain palette */
  --domain-1: #6ea8fe;  /* Epistemology */
  --domain-2: #e07050;  /* ECDO Theory */
  --domain-3: #50c878;  /* Thermofluidic */
  --domain-4: #c084fc;  /* Dynamical Systems */
  --domain-5: #fbbf24;  /* Pedagogy */
  --domain-6: #f87171;  /* Archaeoastronomy */
  --domain-7: #a08850;  /* Quotes */
  --domain-8: #8090b0;  /* Foundation */
  --domain-muted: #607080;

  /* Spacing */
  --sp-1:  4px;
  --sp-2:  6px;
  --sp-3:  8px;
  --sp-4:  12px;
  --sp-6:  16px;
  --sp-8:  20px;
  --sp-12: 32px;

  /* Type scale */
  --text-xs:   7px;
  --text-sm:   11px;
  --text-base: 13px;
  --text-md:   14px;
  --text-lg:   16px;
  --text-xl:   20px;

  /* Font stacks — uncomment ONE pair */
  /* Instrument tier: */
  --font-display: 'Courier New', monospace;
  --font-body:    'Courier New', monospace;
  --font-mono:    'Courier New', monospace;
  /* Analytical tier: */
  /* --font-display: 'Space Grotesk', system-ui, -apple-system, sans-serif; */
  /* --font-body:    'Space Grotesk', system-ui, -apple-system, sans-serif; */
  /* --font-mono:    'JetBrains Mono', 'Fira Code', Consolas, monospace;    */

  /* Procedural textures (instrument tier) */
  --tex-metal: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
  --tex-brush: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.005 0.05' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='200' filter='url(%23b)' opacity='0.12'/%3E%3C/svg%3E");
  --tex-rust:  url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='r'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.3' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0.15 0.5 0 0 0 0.05 0 0 0 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23r)' opacity='0.12'/%3E%3C/svg%3E");
  --tex-grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='turbulence' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23g)' opacity='0.04'/%3E%3C/svg%3E");
}

/* ── Base reset ──────────────────────────────────────────────── */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  background: radial-gradient(ellipse at 50% 40%, #1a2024, var(--bg-base) 65%, var(--bg-void));
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}

/* ── Animations ──────────────────────────────────────────────── */
@keyframes pulse   { 0%,100% { opacity: 1; }    50% { opacity: 0.6; } }
@keyframes hum     { 0%,100% { opacity: 0.92; } 50% { opacity: 1; }   }
@keyframes blink   { 0%,90%,100% { opacity: 0.85; } 30% { opacity: 0.3; } }
@keyframes warmup  { from { filter: brightness(0); } to { filter: brightness(1); } }
```

### 13.2 Google Fonts Import (analytical tier only)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Instrument-tier apps use Courier New which is a system font — no imports needed.

### 13.3 Migration Checklist

When restyling an existing app to match this guide, follow these steps in order:

**Phase 1: Foundation (do first, test before moving on)**
1. Add the `:root` token block from 13.1 to the top of your CSS.
2. Replace `html, body` background with the radial-gradient pattern.
3. Replace all hardcoded background colors with `var(--bg-*)` tokens.
4. Replace all hardcoded text colors with `var(--text-*)` tokens.
5. Replace all hardcoded border colors with `var(--border-*)` tokens.
6. Verify the app still looks correct. Fix any broken contrast.

**Phase 2: Typography**
7. Choose your tier (Instrument or Analytical) and set `--font-display`, `--font-body`, `--font-mono` accordingly.
8. Replace all `font-family` declarations with `var(--font-*)`.
9. Replace hardcoded `font-size` values with `var(--text-*)` tokens.
10. Ensure all quantitative data (numbers, IDs, dates, coordinates) uses `var(--font-mono)`.
11. Apply the nameplate pattern (uppercase, 7px, 0.16em tracking) to section labels if instrument tier.

**Phase 3: Depth**
12. Replace flat card/panel backgrounds with the appropriate gradient pattern (6.1 for instrument, 6.5 for analytical).
13. Add shadow layering to raised and recessed surfaces (6.2).
14. If instrument tier: add texture overlay elements (`.tex` divs or `::before`/`::after`) using the SVG data URIs.
15. Add top-edge bevel highlights (`::before`) to raised panels.
16. Add glow underlays (`::after`) to screen/readout containers.

**Phase 4: Components**
17. Restyle buttons to match 7.1 (choose pushbutton or secondary based on tier).
18. Restyle inputs to match 7.7.
19. Add/restyle tooltips to match 7.5.
20. Add/restyle badges to match 7.4.
21. If applicable: restyle side panels to match 7.6.

**Phase 5: Motion & Polish**
22. Replace all `transition` durations with the values from 8.1.
23. Remove any bounce/elastic easing functions.
24. Add LED/pulse animations only where semantically appropriate (8.2).
25. Add the site nav bar (11.4) if hosted on peirastes.com.
26. Final visual review at 1440px width.

---

## Appendix A: Benchmark Reference

The two apps that define the Peirastes aesthetic:

### Cash Bubble Simulator
- **Font:** Courier New throughout
- **Layout:** `grid-template-columns: 1fr 170px 1fr`
- **Page bg:** `radial-gradient(ellipse at 50% 40%, #1a2024, #0a0e12 65%, #040608)`
- **Chassis gradient:** 10-stop metallic sweep (light-dark-light)
- **Textures:** `--tex-metal`, `--tex-rust`, `--tex-grain`
- **CSS variables:** `--m1:#5c6266` through `--m6:#0e1418`, `--green:#33ff66`, `--amber:#ff8822`, `--red:#ff3344`, `--cyan:#00ccdd`, `--lbl:#7a8690`, `--glow:rgba(0,204,221,.15)`
- **Shadows:** 4-layer on chassis, 3-layer inset on sub-panels, 4-layer on pushbuttons
- **Animations:** LED pulse 2.5s, glow breathe 3s, backlight pulse 4s
- **File:** `projects/cash-bubble/CashBubbleSimulator.html`

### Capacitor Dielectric Lab
- **Fonts:** Rajdhani (labels), Share Tech Mono (data/equations)
- **Layout:** `grid-template-columns: 1fr 260px 1fr`
- **Page bg:** `radial-gradient(ellipse at 50% 40%, #141618, #090a0c 65%, #040506)`
- **Chassis gradient:** 5-stop dark sweep (light-to-dark)
- **Textures:** `--tex-metal`, `--tex-brush`, `--tex-rust`, `--tex-grain`
- **Shadows:** Same layering philosophy as Cash Bubble
- **Animations:** Hum 3s, warmup 1.2s, blink 2s
- **File:** `projects/capacitor_lab.css` + `projects/capacitor_lab.html`

---

## Appendix B: Migration Notes

| App | Tier | Priority | Changes |
|-----|------|----------|---------|
| **KB Explorer** | Analytical | Low | Normalize bg tokens, swap system font → Space Grotesk + JetBrains Mono. |
| **ECDO Watch** | Analytical | Low | Normalize bg tokens, add JetBrains Mono for data. |
| **Spectrum Dashboard** | Analytical | Medium | Azeret Mono → JetBrains Mono, normalize backgrounds to `--bg-void`/`--bg-base` range. |
| **Eisenhower** | Analytical | Medium | IBM Plex Sans → Space Grotesk, add dark mode, normalize colors. |
| **Electrostatics Lab** | Analytical | Low | Already close. Minor token normalization. |
| **Dynamical Systems Lab** | Analytical | Low | Inherit site → add Space Grotesk + JetBrains Mono. |

---

*This guide is a living document. Update it when you make a deliberate design decision that should propagate. Don't document one-off exceptions — those live in the app's own code.*
