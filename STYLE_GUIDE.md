# Peirastes Application Style Guide
**Version 2.3 — 2026-05-25**
**Maintained by: CD Agent**
**Documents:** Peirastes v2 (canonical site style — Cinematic outer shell + in-world instruments)

---

## 0. Site Style Versioning

The Peirastes site has had two distinct visual eras. This guide documents the current one. The version number on the guide itself (2.x) tracks document revisions; the site-style version (v1/v2) tracks the larger design eras.

| Site style | Period | Character |
|---|---|---|
| **Peirastes v1** *(deprecated)* | Pre-2026-04 | Conventional static-site layout. Per-page top nav (`<nav id="site-nav">` on every page), project cards with thumbnail images, single `style.css` content shell. The `current-projects.html` / `previous-work.html` split. |
| **Peirastes v2** *(canonical, this guide)* | 2026-04 → present | Two-layer site. **Cinematic outer shell** (Propylaea title → Atrium menu → Rooms) carries identity, navigation, and atmosphere. **In-world instruments** (apps, sims, labs) live inside the shell as diegetic tools. Powered by `css/cinematic.css` + `js/cinematic.js` for the shell; tier-specific CSS for each instrument. |

Future iterations will be **v3, v4, …** Each version bump represents a fundamental re-architecture of the site experience, not a token swap or palette refresh — those land as 2.x point releases of this document.

When a memory file or working note still refers to the "v3.5 chrome component spec" or "the v3.5 template," that's an internal historical name (the chrome vocabulary was derived from Artemis II's internal version v3.5 during May 2026 iteration). The canonical name going forward is **the Peirastes v2 style** — or, for the outer shell specifically, **the Cinematic Tier**.

---

## 1. Design Philosophy

Peirastes v2 organizes the site into two registers: a **cinematic outer shell** that frames the visit, and **in-world instruments** that do the work. The outer shell is atmospheric, ceremonial, and identity-carrying — visitors enter through a title screen, advance to a menu, then choose a Room. The instruments are physical-feeling tools: precise, dark, instrumental. They exist to help the operator think, to compress complexity into interfaces that reward careful attention.

Three benchmark instruments establish the in-world DNA: **Cash Bubble Simulator** (single-instrument lab bench, now called Thermofluidic Finance), **Capacitor Dielectric Lab** (educational instrument), and **Eisenhower Task Manager** (multi-monitor command station). They look like things you'd find in a well-funded research lab, circa 1985, rebuilt with modern web technology — or in a control room of the same era, at scale. The Cinematic outer shell is a different genre entirely — closer to AAA game main menus (the Halo MCC lineage) than to a software interface.

### Core Principles

1. **Dark-first, deep-black.** The operator works for hours. Backgrounds are near-black (`#040608`–`#0a0e12`), never merely "dark gray." This makes color meaningful and reduces fatigue.

2. **Material depth over flat design.** Surfaces have weight. Panels are inset. Buttons feel like buttons. Multi-stop metallic gradients, layered shadows, and procedural textures create the illusion of physical material. This is not decoration — it's wayfinding. Depth tells you what's interactive, what's a container, and what's a display.

3. **Data is the interface.** The visualization — graph, simulation, readout — is the center of gravity. UI chrome recedes around it. If you can't tell at a glance what the app *does*, the chrome is too loud.

4. **Color carries meaning, never decoration.** Green = good/confirmed. Amber/orange = elevated/uncertain. Red = critical/unconfirmed. Cyan = data/cool state. Every hue earns its place.

5. **Monospace for measurement.** Anything the operator might compare numerically — prices, coordinates, scores, IDs, dates — is rendered in monospace. This is non-negotiable.

6. **Restraint in motion.** No bounce, no elastic, no entrance animations. Motion exists to communicate state change (a panel sliding open) or liveness (a breathing LED). If nothing is changing, nothing should be moving.

---

## 2. Surface Treatments

Peirastes v2 uses **four tiers** organized around the two-layer site architecture. The Cinematic Tier is the outer shell — the cinema the visitor walks into. The other three are in-world instrument tiers — the tools they pick up once they're inside.

### 2.0 Site Architecture: Outer Shell + In-World Instruments

Every visit to peirastes.com flows through two distinct registers:

```
                  ┌──────────────────────────────────────┐
                  │  OUTER SHELL  (Cinematic Tier)       │
                  │  ─────────────────────────────       │
                  │  Propylaea → Atrium → Rooms          │
                  │                                      │
                  │   ┌──────────────────────────────┐   │
                  │   │  IN-WORLD INSTRUMENT         │   │
                  │   │  (one of three tiers below)  │   │
                  │   │                              │   │
                  │   │   Instrument Full /          │   │
                  │   │   Console /                  │   │
                  │   │   Analytical                 │   │
                  │   └──────────────────────────────┘   │
                  └──────────────────────────────────────┘
```

**Outer shell** carries identity, navigation, atmosphere. It is cinematic, ceremonial, restrained-but-warm. The visitor enters the **Propylaea** (title screen), advances to the **Atrium** (menu), and steps into a **Room** (about / projects / timeline / quotes / a content page) or **launches an instrument**.

**In-world instruments** are diegetic tools the visitor picks up inside a Room. They look and feel like instruments — dark, instrumental, dense, technical. Each instrument carries cinematic-tier chrome on its outermost edge (the wordmark, profile pip, corner ticks, action cluster) so it remains a *Peirastes* instrument even when the inner working surface is its own world. Future agents and humans recognizing this pattern: outer chrome = cinematic vocabulary; inner working surface = whichever instrument tier fits the app.

**Why two layers, not one:** earlier iterations (the 2026-05-09 "drop the chassis" Cockpit experiment) tried to let the cinema banner show through as an instrument's working surface. It read as ungrounded — the cinema is for arrival and identity; the working surface needs to be a *place to work*. The two-layer architecture preserves both registers without dilution.

---

### 2.1 Cinematic Tier — Outer Shell ★ v2.3

Used for: the entire site shell — `index.html` (Propylaea + Atrium), all Rooms (`about.html`, `all-projects.html`, `timeline.html`, `quotes.html`, content/treatise pages), and the outer chrome of every in-world instrument wrapper.

**Lineage:** Halo MCC main menu (game-menu testbed scaffolded 2026-05-06, "halo-faithful" variant validated). The cinematic vocabulary was retroactively elevated to a site-wide style when the Artemis II v3.5 wrapper locked the chrome component grammar on 2026-05-09; that grammar is now **the canonical Peirastes v2 style** and propagates to all instrument wrappers via `Website/projects/mission-tracker/working/artemis2_v3_5_ui.html` as the clone source.

#### Three spatial zones

| Zone | Origin | Where it lives | Function |
|---|---|---|---|
| **Propylaea** *(προπύλαια — monumental gateway)* | Stage 1 of `index.html` | Entrance ceremony — title wordmark + "Press Enter" prompt. Body class `stage-title`. |
| **Atrium** *(Latin — central hall)* | Stage 2 of `index.html` | Hall of rooms — wordmark, menu list, profile chip, featured project card, random quote. Body class `stage-menu`. |
| **Rooms** | Every other page on the site | Content destinations. Each room has a page-type metaphor: Profile (`about.html`), Campaign Log (`all-projects.html`), Lore Fragments (`quotes.html`), Treatise / Laboratory / etc. for content pages. |

The Propylaea → Atrium choreography is a *single URL* (`index.html`) with two stage states. They are moments in time, not separate pages. All three zones share one visual language.

#### Atmosphere

- **Backdrop:** cinema-graded photo banner (`images/PeirastesBanner.jpg`) at `saturate(0.78) brightness(0.82)` — cool desaturated grade preserves warm-cool tension with the gold accent. Subtle Ken Burns drift (60s loop) on the Propylaea; static under reduced-motion.
- **Vignette:** radial dark falloff to the edges of the viewport.
- **Grain:** SVG noise at ~4% opacity, overlay-blend, as a finishing layer.
- **Cartographic corner ticks:** L-bracket marks at all four viewport corners (16px, faint cyan, ~0.4 opacity, 0.9rem inset). Universal — appears on Propylaea, Atrium, every Room, and inside every instrument wrapper. Injected at runtime via `js/cinematic.js`. Doubles as a visual diagnostic for mobile viewport edges.

#### Palette (outer shell)

```css
--accent:        #7dd6ff;                       /* cyan — primary accent */
--accent-dim:    rgba(125, 214, 255, 0.18);
--accent-soft:   rgba(125, 214, 255, 0.06);
--gold:          #f0c060;                       /* warm gold — brand wordmark */
--gold-dim:      rgba(240, 192, 96, 0.35);
--text-bright:   rgba(255, 255, 255, 0.92);
--text-mid:      rgba(255, 255, 255, 0.65);
--text-dim:      rgba(255, 255, 255, 0.4);
--surface:       rgba(8, 16, 22, 0.55);         /* glass surfaces */
--surface-strong:rgba(8, 16, 22, 0.78);
--surface-page:  rgba(6, 12, 18, 0.94);
```

Inside a v3.5-pattern instrument wrapper (Artemis II v2 / Tip-Recover / Optics Lab / Smoke Sim), `--gold` shifts hotter to `#ffae20` (neon amber) for engineering-display feel. The outer shell stays at the cooler `#f0c060`. This warm-cool tension between outer and inner is **load-bearing — do not erase it.**

#### Typography (outer shell)

| Role | Font | Where |
|---|---|---|
| **Brand wordmark only** | Cinzel 600, letter-spacing 0.32em on Propylaea title | "PEIRASTES" wherever it appears as identity (Propylaea title, Atrium menu wordmark, instrument wrapper `cin-wordmark`). **Cinzel never appears outside the wordmark.** |
| **Outer-shell UI** | Inter (300/400/500/600) | Everything else in the cinematic shell — menu items, profile chip, hints, page heroes, content body. |

Inside in-world instruments, additional fonts apply (Orbitron for instrument titles, Share Tech Mono for numerical readouts, Courier New for the older Instrument Full apps). See §5.1.

#### Chrome component vocabulary (instrument wrappers)

When an in-world instrument lives inside the cinematic shell, it inherits a consistent chrome row across the top, corner ticks, hint glyphs, and a back-out link. CSS class names are stable and shared across all wrappers (Artemis II v3.5, Tip-Recover, Optics Lab, Smoke Sim):

| Class | Role |
|---|---|
| `.cin-flank.cin-flank--left` | Left flank container. Stacks PEIRASTES wordmark on top, version label below. `align-items: flex-start`. |
| `.cin-flank.cin-flank--right` | Right flank container. Action button row only — **no status pip.** `align-items: flex-end`. |
| `.cin-wordmark` | Brand link inside the left flank. Links to `https://peirastes.com/`. Cinzel 600 + 0.32em tracking. |
| `.cin-version` | Subordinate version label below the wordmark (e.g., `v0.1`, `v3.5`). Inter 0.78rem, dim. |
| `.cin-title` | Mission/instrument title block, floats centered between the two flanks. Three lines: `.cin-title__name` (Orbitron 18px gold), `.cin-title__sub` (Inter cyan), `.cin-title__crew` (Inter dim, optional). Centered via JS: `title.style.left = ((leftFlank.right + rightFlank.left) / 2) + 'px'`. `ResizeObserver` re-fires on flank width changes. |
| `.cin-action` | Action button. Rectangular gradient face + inset bevel + outer drop shadow + 2px transparent left-border. Uppercase Inter. **Round pills are deprecated.** Active state inverts to amber gradient + inset pressed shadow + outer amber glow. |
| `.cin-action-row` | Container for action buttons inside the right flank. |
| `.cin-tick.cin-tick--{tl,tr,bl,br}` | Cartographic L-brackets at the four corners. |
| `.cin-grain` | SVG-noise overlay layer, 4% opacity, overlay-blend. |

**Shared inset frame:** all chrome (wordmark, action cluster, hints, playback bar, floating panels) aligned to a `1.6rem` inset on all four edges. Corner ticks at `0.9rem`. This forms a coherent outer frame the work lives within.

#### Behaviors

- **Reduced motion:** kill ambient animations (Ken Burns, pulses); disable entrance transitions/transforms. Stage-state opacity rules still apply — stages snap instantly without animation. **Do NOT force-override opacity, or both Propylaea + Atrium will render simultaneously.** Do not skip the Propylaea for reduced-motion users — the Propylaea→Atrium separation is structural, not decorative.
- **Title centering:** uses `translateX(-50%)` paired with `left: <calculated>` from JS. Preserve `translateX(-50%)` through entrance animation via `cin-fade-in-centered` keyframe.
- **Body overflow:** the cinematic shell sets `overflow-y: auto` on non-landing bodies. Instrument wrappers that need their own scroll context override with `body { overflow: hidden !important; }`.

#### Banner path

`../images/PeirastesBanner.jpg` (relative from `/css/cinematic.css`) — works for any same-depth-or-shallower app folder.

---

### 2.2 Instrument Tier (Full)

Used for: simulation-heavy, single-purpose tools (Cash Bubble / Thermofluidic Finance, Capacitor Lab). An in-world instrument worn by the visitor inside a Room.

- Multi-stop metallic gradients on panels/chassis
- Inset shadows for recessed areas (screens, wells, readout boxes)
- SVG procedural textures (metal grain, rust, noise) as background overlays
- Hardware details: rivets, nameplates, bezels, knobs
- CRT/scanline effects on data displays
- Glow effects (`box-shadow: 0 0 Npx`) on active/powered elements
- Very tight spacing (4–8px gaps)
- **Single chassis** containing all controls and one or two primary readouts
- Pure Courier New typography throughout

### 2.3 Console Tier (multi-monitor command station) ★ v2.2

Used for: data-heavy operator tools where multiple displays must be visible simultaneously (Eisenhower Task Manager, Artemis II Mission Tracker v2).

- Same screen anatomy as Instrument Full (`bezel → well → glass → content`), but **multiple monitors arranged in a grid** within a framing chassis
- **Anti-glare hood** above each monitor (10px metallic strip)
- **Bezel nameplate plate** floating on the top edge of each bezel, centered (the "Channel 1 / Channel 2" effect)
- **Per-monitor phosphor tint** — each screen's background carries a faint hue (red, green, amber, cyan, neutral) that signals its semantic role; status text inside each monitor inherits the same hue
- **Corner rivets** on each bezel (4 per monitor)
- CRT vignette + scanlines on each `glass` layer
- **Framing chassis bars** at the top and bottom of the viewport (header chassis with brand/title, footer chassis with status/clock)
- **Hybrid typography:** Space Grotesk for UI labels and headings, JetBrains Mono for quantitative data, Courier New retained for the inside-screen instrument labels and empty-state text
- Medium spacing (6–12px gaps inside monitors, 16–20px between monitors)
- **High information density** — each monitor is a self-contained panel; the operator scans the whole grid at once

The Console tier extends Instrument Full's screen anatomy into a layout designed for **continuous multi-domain monitoring**, like a real command room. It's not "more chrome" — it's "the same chrome at scale, with a command-station composition."

### 2.4 Analytical Tier

Used for: multi-panel explorers, dashboards, reference tools (KB Explorer, Spectrum, ECDO Watch).

- Same near-black backgrounds and color semantics
- Simplified panels: single-stop dark backgrounds with subtle border + inset shadow
- `backdrop-filter: blur(10px)` on floating overlays (tooltips, modals, slide-out panels)
- No procedural textures — depth comes from layered transparency and border contrast
- Slightly looser spacing (12–20px padding)
- Cleaner type hierarchy (sans-serif body, monospace data)

All three in-world tiers share the same color system, the same respect for darkness, and the same "instrument" ethos. The difference is surface complexity and composition, not philosophy.

### 2.5 How to Choose a Tier

Choose the outer shell first, then the in-world tier:

```
Is this the site itself, or an instrument inside it?

  SITE (landing, navigation, Rooms, content pages)
    → Cinematic Tier (the only outer shell)

  IN-WORLD INSTRUMENT (an app, sim, lab, tool)
    → Wrap it in a Cinematic outer chrome row + corner ticks + hints,
      then choose the inner-surface tier:

      Does the instrument need MULTIPLE primary readouts visible
      simultaneously (an operator scanning several domains at once)?
        YES → Console                e.g. ETM (4 quadrants), Artemis II v2
              (multi-monitor grid in a framing chassis)

      Otherwise: is the instrument a self-contained simulation or
      single-focus tool?
        YES → Does it have a primary canvas/viewport the user stares at
              for minutes?
          YES → Instrument (Full)    e.g. Cash Bubble, Capacitor Lab
                (single chassis, heaviest chrome, pure Courier New)
          NO  → Analytical           e.g. older Eisenhower (1.x)
        NO  → Is it a multi-panel explorer, dashboard, or reference tool?
          YES → Analytical           e.g. KB Explorer, ECDO Watch, Spectrum
                (transparent panels, blur overlays, Space Grotesk)
          NO  → Analytical (default)
```

**Rule of thumb:**
- *The site itself* → **Cinematic** (outer shell — always)
- *Looks like a physical device* → **Instrument Full** (inner)
- *Looks like a multi-screen control room* → **Console** (inner)
- *Looks like a window into data* → **Analytical** (inner)

When in doubt on the inner tier, start at the lighter one (Analytical) — it's simpler to build and easier to maintain. Promote to Console if the app needs simultaneous multi-monitor display. Promote to Instrument Full only if the entire application has a single dominant canvas.

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

| Role | Cinematic Tier (outer shell) ★ v2.3 | Instrument Tier (Full) | Console Tier ★ v2.2 | Analytical Tier | Fallback |
|------|-------------------------------------|------------------------|---------------------|-----------------|----------|
| **Brand wordmark (PEIRASTES only)** | Cinzel 600, 0.32em tracking | Cinzel (in `cin-wordmark` chrome row) | Cinzel (in `cin-wordmark` chrome row) | Cinzel (in `cin-wordmark` chrome row) | Georgia, serif |
| **Instrument title (mission/app name)** | — | Orbitron 700 (in `cin-title__name`) | Orbitron 700 (in `cin-title__name`) | Orbitron 700 (in `cin-title__name`) | sans-serif |
| **Display** | Inter | Courier New | Space Grotesk | Space Grotesk | system-ui, sans-serif |
| **Labels (UI)** | Inter (caps, tracked) | Courier New (uppercase, 7px, tracked) | Space Grotesk (9–11px, uppercase, tracked) | Space Grotesk (11px) | sans-serif |
| **Labels (instrument plates)** | — | Courier New (7px, 0.16em) | Courier New (7px, 0.16em) — *retained for nameplates inside CRT bezels* | Space Grotesk | monospace |
| **Data/Mono (numerical readouts)** | Share Tech Mono | Courier New | JetBrains Mono | JetBrains Mono | 'Fira Code', Consolas, monospace |
| **Body** | Inter | Courier New | Space Grotesk | Space Grotesk | system-ui, sans-serif |

> **Why four stacks?** The **Cinematic Tier** governs the outer shell — Cinzel reserved for the brand wordmark only (anywhere "PEIRASTES" appears as identity), Inter for everything else in the shell. **Orbitron** is used inside instrument wrappers for the mission/app title in the `cin-title__name` slot — NASA/HUD precision feeling that signals "you are now inside an instrument." **Share Tech Mono** carries numerical readouts (MET, gauge values, coordinates) in the cinematic-framed instruments. The three in-world tiers (Instrument Full, Console, Analytical) keep their existing font roles for their inner working surfaces; the Cinematic chrome row sits above whichever inner tier is in use. All four stacks maintain the monospace-for-data rule.

> **Cinzel discipline:** Cinzel is the Peirastes brand signature. It only appears as the PEIRASTES wordmark — Propylaea title, Atrium menu wordmark, the `cin-wordmark` link in any instrument chrome. It does **not** appear in editorial body text, instrument titles, or anywhere else. Instrument titles use Orbitron (precision feeling); editorial body uses Inter (readability). This contamination discipline is what keeps Cinzel powerful as identity.

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

### 7.12 CRT Monitor (Console tier) ★ v2.2

The Console tier's signature element. Each monitor is a self-contained panel with full screen anatomy (`hood → bezel → well → glass → content`). Use multiple instances arranged in a grid.

**Anatomy:**
```
┌─────────────────────────────┐  ← anti-glare hood (10px metallic strip)
│   ┌─── ◯ ──────── ◯ ───┐    │
│   │  ┌─[ NAMEPLATE ]──┐ │    │  ← bezel (with corner rivets ◯, label plate centered top)
│   │  │                │ │    │
│   │  │  vignette +    │ │    │  ← well (deepest recess)
│   │  │  scanlines     │ │    │     glass (CRT surface, phosphor tint)
│   │  │  CONTENT       │ │    │     content (scrollable inner padding)
│   │  └────────────────┘ │    │
│   └─── ◯ ──────── ◯ ───┘    │
└─────────────────────────────┘
```

**Hood (anti-glare strip on top):**
```css
.console-monitor__hood {
  height: 10px;
  background: linear-gradient(180deg, #2a2e32 0%, #1e2226 60%, #14181c 100%);
  border: 2px solid #0a0e10;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.6);
}
```

**Bezel (chassis frame):**
```css
.console-monitor__bezel {
  position: relative;
  border-radius: 0 0 6px 6px;
  padding: 6px;
  background: linear-gradient(155deg, #4e5458 0%, #3e4448 15%, #2e3438 55%, #1e2428 95%);
  box-shadow: 0 4px 16px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04);
  border: 2px solid #0c1014;
  border-top: none;
}
```

**Bezel nameplate plate (centered on top edge):**
```css
.console-monitor__label {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 4;
  font-size: 7px;
  color: var(--text-label);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  padding: 2px 10px;
  white-space: nowrap;
  background: linear-gradient(180deg, #4a4e52, #3a3e42 30%, #2e3236 70%, #242a2e);
  border: 1px solid #0c1014;
  border-radius: 2px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
}
```

**Corner rivets (4 per bezel, positioned absolutely):**
```css
.console-monitor__rivet {
  position: absolute;
  width: 8px; height: 8px;
  border-radius: 50%;
  z-index: 3;
  border: 1px solid #080c0e;
  background: radial-gradient(circle at 35% 28%,
    #6a6e70, #525658 22%, #3c4044 48%, #282c30 74%, #181c20);
  box-shadow: 0 2px 5px rgba(0,0,0,0.7),
    inset 0 1px 1px rgba(255,255,255,0.06);
}
```

**Screen well (deepest recess):**
```css
.console-monitor__well {
  border-radius: 4px;
  padding: 3px;
  background: #060a0c;
  box-shadow:
    inset 0 5px 20px rgba(0,0,0,0.95),
    inset 0 2px 6px rgba(0,0,0,0.8);
  border: 1px solid #040608;
}
```

**CRT glass (phosphor surface — choose ONE tint per monitor):**
```css
.console-monitor__glass {
  position: relative;
  border-radius: 3px;
  overflow: hidden;
}
/* Tints — choose semantically per monitor */
.console-monitor__glass--red    { background: linear-gradient(180deg, #0c0604, #100806 30%, #0c0604 70%, #080402); }
.console-monitor__glass--green  { background: linear-gradient(180deg, #020806, #031208 30%, #020e06 70%, #020806); }
.console-monitor__glass--amber  { background: linear-gradient(180deg, #0a0804, #0e0a06 30%, #0a0804 70%, #080602); }
.console-monitor__glass--cyan   { background: linear-gradient(180deg, #02060a, #03080e 30%, #02060a 70%, #020408); }
.console-monitor__glass--neutral{ background: linear-gradient(180deg, #060608, #08080c 30%, #060608 70%, #040406); }

/* CRT vignette */
.console-monitor__glass::before {
  content: '';
  position: absolute; inset: 0;
  z-index: 8;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 50%, transparent 48%, rgba(0,0,0,0.5) 100%);
}
/* Scanlines */
.console-monitor__glass::after {
  content: '';
  position: absolute; inset: 0;
  z-index: 9;
  pointer-events: none;
  opacity: 0.06;
  background-image: repeating-linear-gradient(
    0deg, transparent, transparent 1px,
    rgba(0,0,0,0.7) 1px, rgba(0,0,0,0.7) 2px);
  background-size: 100% 3px;
}
```

**Phosphor text glow per monitor (apply on `.console-monitor--{tint} .designation`):**
```css
.console-monitor--red    .console-designation { color: var(--status-negative); text-shadow: 0 0 5px rgba(255,51,68,0.3); }
.console-monitor--green  .console-designation { color: var(--green);           text-shadow: 0 0 5px rgba(51,255,102,0.12); }
.console-monitor--amber  .console-designation { color: var(--status-warning);  text-shadow: 0 0 5px rgba(255,136,34,0.3); }
.console-monitor--cyan   .console-designation { color: var(--cyan);            text-shadow: 0 0 5px rgba(0,204,221,0.3); }
.console-monitor--neutral .console-designation { color: var(--text-secondary); text-shadow: 0 0 4px rgba(128,144,160,0.2); }
```

**Compact scrollbar inside monitor content:**
```css
.console-monitor__content::-webkit-scrollbar       { width: 5px; }
.console-monitor__content::-webkit-scrollbar-track { background: transparent; }
.console-monitor__content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
.console-monitor__content::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
```

### 7.13 Framing Chassis (Console tier) ★ v2.2

The header and footer bars that frame the console workspace. They make the entire viewport feel like the front panel of an installed device.

**Header chassis (light-down-up gradient — convex top):**
```css
.console-chassis-header {
  background: linear-gradient(178deg,
    var(--metal-1) 0%, var(--metal-2) 4%, #444a4e 10%,
    var(--metal-3) 28%, #383e42 50%,
    var(--metal-3) 72%, #444a4e 90%,
    var(--metal-2) 96%, var(--metal-1) 100%);
  box-shadow:
    0 4px 12px rgba(0,0,0,0.6),
    inset 0 1px 0 var(--border-bevel-light);
  border-bottom: 2px solid var(--bg-base);
  position: relative;
}
.console-chassis-header::after {
  content: '';
  position: absolute;
  top: 0; left: 10px; right: 10px;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg,
    transparent,
    rgba(255,255,255,0.06) 20%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.06) 80%,
    transparent);
}
```

**Footer chassis (mirror gradient):**
```css
.console-chassis-footer {
  background: linear-gradient(2deg,
    var(--metal-1) 0%, var(--metal-2) 4%,
    var(--metal-3) 30%, var(--metal-4) 70%,
    var(--metal-5) 100%);
  box-shadow:
    0 -2px 8px rgba(0,0,0,0.4),
    inset 0 1px 0 var(--border-bevel-light);
  border-top: 2px solid var(--bg-base);
}
```

The header carries the brand mark, app name, and any global status indicators. The footer carries the system clock, mission elapsed time, connection status, or other always-on information. Both should be **thin** (32–44px tall) — the workspace must dominate.

### 7.14 Readout Cell (Console tier) ★ v2.2

A single-value readout displayed in a strip between the header and the workspace. Typically used for top-line stats: total tasks, mission elapsed time, current burn, etc.

```css
.console-readout-strip {
  background: var(--bg-base);
  border-bottom: 1px solid var(--border-subtle);
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.4);
  display: flex;
}
.console-readout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
}
.console-readout__label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}
.console-readout__value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
}
/* Color variants — match the semantic tint of whichever monitor the readout summarizes */
.console-readout__value--red    { color: var(--red);             text-shadow: 0 0 12px rgba(255,51,68,0.3); }
.console-readout__value--cyan   { color: var(--cyan);            text-shadow: 0 0 12px rgba(0,204,221,0.3); }
.console-readout__value--amber  { color: var(--amber);           text-shadow: 0 0 12px rgba(255,136,34,0.3); }
.console-readout__value--green  { color: var(--status-positive); text-shadow: 0 0 12px rgba(51,255,102,0.2); }
.console-readout__value--muted  { color: var(--text-secondary); }
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

### 11.4 Site Navigation (Peirastes v2)

Peirastes v2 does **not** use a per-page top nav. Navigation lives in the Cinematic outer shell, structured into the three zones:

| Zone | Navigation surface |
|---|---|
| **Propylaea** (Stage 1 of `index.html`) | "Press Enter" prompt — single advance to Atrium. No site nav surfaced here. |
| **Atrium** (Stage 2 of `index.html`) | `<nav class="menu">` — the canonical 5-link menu: Home / About / Projects / Physics Timeline / Quotes. **This is the only place the site menu appears.** |
| **Rooms** (every other page) | Light chrome only — `chrome-wordmark` top-left (links home), `profile` block, `hints` bar (typically "Esc Home"). Back-out is via the wordmark click or Esc. |
| **Instrument wrappers** | Cinematic chrome row (`.cin-flank--left` + `.cin-flank--right`). The left flank's `.cin-wordmark` is the back-out — links to `https://peirastes.com/`. No menu inside an instrument. |

#### Atrium menu anatomy

```html
<nav class="menu" aria-label="Site Navigation">
  <ul class="menu__list">
    <li class="menu__item is-active" data-href="index.html">Home</li>
    <li class="menu__item" data-href="about.html">About</li>
    <li class="menu__item" data-href="all-projects.html">Projects</li>
    <li class="menu__item" data-href="timeline.html">Physics Timeline</li>
    <li class="menu__item" data-href="quotes.html">Quotes</li>
  </ul>
</nav>
```

Keyboard: ↑↓ navigate, Enter selects, Esc returns to Propylaea. Item entrance animation staggered (60ms between items) under `body.stage-menu`.

#### Room chrome anatomy

```html
<a class="chrome-wordmark" href="/"><h1>PEIRASTES</h1></a>

<div class="profile">
  <div class="profile__mark">P</div>
  <div class="profile__meta">
    <span class="profile__name">Peirastes</span>
    <span class="profile__sub">Visitor</span>
  </div>
</div>

<div class="hints">
  <span class="hint"><kbd>Esc</kbd> Home</span>
</div>
```

#### Don't reintroduce a per-page top nav

The Peirastes v1 nav pattern (`<nav id="site-nav">` with Home / About / Projects on every page) is deprecated. The cinematic shell handles wayfinding once via the Atrium and once via the wordmark back-out — a persistent top bar would compete with the cinematic atmosphere and duplicate the role the wordmark already plays.

---

## 12. Exclusions

- **Fractured Universe** has its own aesthetic (Orbitron, cyberpunk neon, glitch effects). It's a narrative project, not a tool.
- **Agent World** is an Electron-only private tool. Game UI conventions apply.
- **Academic content** (PSEII notes) follows document typography, not app conventions.

These are different *genres*, not violations.

---

## 13. Implementation Kit

### 13.0 Cinematic Tier — Outer Shell Tokens ★ v2.3

The outer shell tokens used by `css/cinematic.css`. Drop these into the root of any page or wrapper that participates in the Peirastes v2 site shell. **Loaded automatically** when a page links to `css/cinematic.css`; you do not need to redeclare them in shell pages.

For an in-world instrument wrapper that is hosted inside the cinematic shell (e.g., `artemis-ii-v3-5/index.html`, `rotating-extended-cylinder/index.html`), declare them locally if the wrapper does not import the shared stylesheet.

```css
/* ── Cinematic Tier (outer shell) ───────────────────────────── */
:root {
  /* Accent — cyan (data/cool) */
  --accent:        #7dd6ff;
  --accent-dim:    rgba(125, 214, 255, 0.18);
  --accent-soft:   rgba(125, 214, 255, 0.06);

  /* Gold — brand (warm) */
  --gold:          #f0c060;       /* outer shell — softer gold */
  --gold-dim:      rgba(240, 192, 96, 0.35);

  /* Text */
  --text-bright:   rgba(255, 255, 255, 0.92);
  --text-mid:      rgba(255, 255, 255, 0.65);
  --text-dim:      rgba(255, 255, 255, 0.4);

  /* Surfaces (translucent glass) */
  --surface:        rgba(8, 16, 22, 0.55);
  --surface-strong: rgba(8, 16, 22, 0.78);
  --surface-page:   rgba(6, 12, 18, 0.94);

  /* Fonts */
  --font-display:  'Cinzel', Georgia, serif;     /* PEIRASTES wordmark only */
  --font-ui:       'Inter', system-ui, sans-serif;
}
```

**Inside an in-world instrument**, `--gold` shifts hotter to `#ffae20` (neon amber) for engineering-display feel:

```css
/* ── Cinematic-framed instrument (Artemis II v2, Tip-Recover, etc.) ── */
:root {
  --gold:        #ffae20;                       /* hotter for instruments */
  --gold-soft:   rgba(255, 174, 32, 0.72);
  --gold-faint:  rgba(255, 174, 32, 0.28);
  --gold-glow:   rgba(255, 174, 32, 0.45);
}
```

**Fonts to load (outer shell + instrument wrappers):**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
```

Orbitron + Share Tech Mono are only needed inside instrument wrappers (`cin-title__name`, numerical readouts); the outer-shell pages (Propylaea/Atrium/Rooms) can omit them, but loading all four together keeps the wrapper template uniform.

### 13.1 In-World Instrument Tokens — Drop this into any new app

```css
/* ── Peirastes Design Tokens v2.1 (in-world instrument inner surface) ── */
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

  /* Font stacks — uncomment ONE block */

  /* Instrument tier (single chassis, heaviest chrome): */
  --font-display: 'Courier New', monospace;
  --font-body:    'Courier New', monospace;
  --font-mono:    'Courier New', monospace;
  --font-plate:   'Courier New', monospace;  /* nameplates always Courier */

  /* Console tier ★ v2.2 (multi-monitor command station): */
  /* --font-display: 'Space Grotesk', system-ui, -apple-system, sans-serif;  */
  /* --font-body:    'Space Grotesk', system-ui, -apple-system, sans-serif;  */
  /* --font-mono:    'JetBrains Mono', 'Fira Code', Consolas, monospace;     */
  /* --font-plate:   'Courier New', monospace;  // bezel labels stay Courier */

  /* Analytical tier (transparent panels, blur overlays): */
  /* --font-display: 'Space Grotesk', system-ui, -apple-system, sans-serif; */
  /* --font-body:    'Space Grotesk', system-ui, -apple-system, sans-serif; */
  /* --font-mono:    'JetBrains Mono', 'Fira Code', Consolas, monospace;    */
  /* --font-plate:   'Space Grotesk', system-ui, sans-serif;                */

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
25. If the app will live on peirastes.com, wrap it in the Cinematic chrome row (`.cin-flank--left` + `.cin-flank--right` + `.cin-title` + corner ticks + hints). See §2.1 and §11.4 for the anatomy. **Do not add a per-page top nav** — that's the deprecated Peirastes v1 pattern.
26. Final visual review at 1440px width.

---

## Appendix A: Benchmark Reference

The canonical references for each tier of Peirastes v2:

### Cinematic Tier (outer shell) — `index.html` + Tip-Recover wrapper ★ v2.3
- **Outer shell live demo:** `index.html` (Propylaea → Atrium choreography) and any Room (`about.html`, `all-projects.html`, `timeline.html`, `quotes.html`)
- **Instrument wrapper benchmark:** `artemis-ii-v3-5/index.html` (public-facing as "Artemis II v2") and `rotating-extended-cylinder/index.html` (Tip-Recover)
- **Canonical clone source for new missions/instruments:** `Website/projects/mission-tracker/working/artemis2_v3_5_ui.html`
- **Stylesheet:** `css/cinematic.css` (outer shell). Each instrument wrapper inlines its own tier-specific CSS for the inner working surface.
- **Behavior:** `js/cinematic.js` — Propylaea/Atrium stage choreography, corner-tick injection, title-centering observer, Esc-home handler, atrium quote loader
- **Atmosphere:** banner backdrop (`PeirastesBanner.jpg`, saturate 0.78 brightness 0.82) + radial vignette + 4% SVG noise grain + Ken Burns drift (60s)
- **Palette:** `--accent: #7dd6ff` cyan, `--gold: #f0c060` (outer) / `#ffae20` (inside instruments). Surface tokens are translucent glass over the banner.
- **Typography:** Cinzel 600 (PEIRASTES wordmark only — 0.32em tracking on the Propylaea title), Inter (all UI), Orbitron 700 (`cin-title__name`), Share Tech Mono (numerical readouts)
- **Chrome vocabulary:** `.cin-flank`, `.cin-title`, `.cin-tick`, `.cin-action`, `.cin-wordmark`, `.cin-version`, `.cin-grain` — see §2.1 for full anatomy
- **Lineage:** Halo MCC main menu (Cole's reference) → game-menu testbed at `Working/game-menu-testbed/cinematic/` (2026-05-06) → Artemis II v3.5 chrome lock (2026-05-09) → propagated to all instrument wrappers
- **Don't:** literal celestial/instrument decoration (orbital rings, dial marks). Tried during the Halo→Destiny iteration; rejected as "cheesy" — reads as costume on a content site. Borrow restraint and engineered chrome, not literal cosmic furniture.

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

### Eisenhower Task Manager (Console tier benchmark) ★ v2.2
- **Fonts:** Space Grotesk (UI labels, headings), JetBrains Mono (task data, scores), Courier New (bezel nameplates, empty-state text inside screens)
- **Layout:** Header chassis bar + readout strip + 4-quadrant CRT grid + footer chassis bar — full viewport, the workspace dominates
- **Per-monitor anatomy:** `hood (10px) → bezel (light-down gradient with corner rivets and centered nameplate plate) → well (deep recess) → glass (phosphor tint + scanlines + vignette) → content (scrollable, tight spacing)`
- **Phosphor tints:** red (Do First), green (Schedule), amber (Delegate), neutral (Eliminate) — each monitor's text glow inherits the tint
- **Chrome:** Anti-glare hoods on every monitor, framing chassis bars top and bottom, recessed readout strip between header and workspace, LED indicator strip in the footer
- **Direct lineage:** Inherits the `bezel → well → glass → content` anatomy from Cash Bubble Simulator (Thermofluidic Finance), then arranges multiple instances in a quadrant grid with framing chrome
- **File:** `projects/eisenhower-task-manager/eisenhower-task-manager-v2/eisenhower-app/src/index.css`

---

## Appendix B: Migration Notes

| App | Tier | Priority | Changes |
|-----|------|----------|---------|
| **KB Explorer** | Analytical | Low | Normalize bg tokens, swap system font → Space Grotesk + JetBrains Mono. |
| **ECDO Watch** | Analytical | Low | Normalize bg tokens, add JetBrains Mono for data. |
| **Spectrum Dashboard** | Analytical | Medium | Azeret Mono → JetBrains Mono, normalize backgrounds to `--bg-void`/`--bg-base` range. |
| **Eisenhower** ★ | **Console** | DONE (2026-03-29) | Restyled to the Console tier — became the v2.2 benchmark. |
| **Electrostatics Lab** | Analytical | Low | Already close. Minor token normalization. |
| **Dynamical Systems Lab** | Analytical | Low | Inherit site → add Space Grotesk + JetBrains Mono. |
| **Artemis II v2** ★ | **Console** | NEXT (Phase G) | New build. Will be the second Console-tier consumer. Trajectory canvas as the main monitor; telemetry, mission log, energy plot, and ground-track as auxiliary monitors in the same framing chassis. |

---

## Revision History

| Version | Date | Notes |
|---------|------|-------|
| 2.0 | 2026-03-11 | Initial style guide. Two tiers: Instrument (Full) and Analytical. Color system, type scale, depth techniques, component library. |
| 2.1 | 2026-03-11 | Implementation kit added (`:root` token block, animations). Migration checklist. Benchmark appendix. |
| **2.2** | **2026-04-11** | **Console tier added** — third surface treatment for multi-monitor command-station layouts. Derived from the Eisenhower Task Manager restyle, which itself inherited the screen anatomy from Cash Bubble Simulator (Thermofluidic Finance). Distinguishing features: anti-glare hoods, bezel nameplate plates centered on top edges, per-monitor phosphor tinting, framing chassis bars at top and bottom of viewport, hybrid Space Grotesk + JetBrains Mono typography (with Courier New retained for bezel nameplates). New components in §7.12 (CRT Monitor), §7.13 (Framing Chassis), §7.14 (Readout Cell). Updated typography table in §5.1, decision tree in §2.4, implementation kit font stacks in §13.1. ETM added to Appendix A as the Console tier benchmark. Driver: Artemis II v2 high-fidelity simulator (Phase F of `project_artemis_ii_v2.md`). |
| **2.3** | **2026-05-25** | **Cinematic Tier added + Peirastes v1/v2 site-style framework introduced.** New §0 defines the v1 (pre-Cinematic) → v2 (canonical, current) site-style versioning so future iterations (v3, v4) have a coherent home. New §2.0 introduces the **outer shell + in-world instrument** two-layer architecture. New §2.1 documents the **Cinematic Tier** as the outer shell — Propylaea / Atrium / Rooms three-zone framing, palette (`#7dd6ff` cyan + `#f0c060` outer gold / `#ffae20` instrument amber), typography (Cinzel wordmark-only discipline + Inter + Orbitron + Share Tech Mono), and the canonical chrome component vocabulary (`.cin-flank`, `.cin-title`, `.cin-tick`, `.cin-action`, `.cin-wordmark`). The chrome vocabulary was previously known internally as the "v3.5 chrome component spec" (after Artemis II's internal version number); that name is retired in favor of "the canonical Peirastes v2 style" or "the Cinematic Tier" depending on scope. Renumbered tiers (Instrument Full → §2.2, Console → §2.3, Analytical → §2.4) and updated the decision tree (§2.5) to start with the outer-shell-vs-in-world branch. Added §13.0 Cinematic outer-shell tokens (the `:root` block from `css/cinematic.css`). Replaced §11.4 (deprecated per-page top nav) with the Cinematic site-navigation anatomy (Atrium menu + Room chrome + instrument wrapper chrome). Added Cinematic benchmark to Appendix A pointing at `index.html`, `artemis-ii-v3-5/`, `rotating-extended-cylinder/`, and the `artemis2_v3_5_ui.html` clone source. Documents lived reality of the site since the 2026-04 redesign; no code or runtime behavior changed by this version. |

---

*This guide is a living document. Update it when you make a deliberate design decision that should propagate. Don't document one-off exceptions — those live in the app's own code.*
