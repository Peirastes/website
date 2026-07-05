# Capacitor Dielectric Lab — Operations & Program Manual

**PSE-II Interactive RC Circuit Simulator**
**Version 2.0 — Single-File Vanilla HTML/CSS/JS**

---

## 1. Overview

The Capacitor Dielectric Lab is a browser-based interactive simulator designed for the Physics for Scientists and Engineers II (PSE-II) course. It provides students with a real-time virtual laboratory for exploring the behavior of parallel-plate capacitors with interchangeable dielectric materials in an RC charging/discharging circuit.

The simulator is delivered as a single self-contained HTML file (`capacitor_lab.html`) with no build step, no framework dependencies, and no server requirement. It can be opened directly in any modern browser. External dependencies are limited to three Google Fonts and the KaTeX math typesetting library (loaded via CDN, with graceful Unicode fallback if offline).

### 1.1 Pedagogical Goals

The lab is designed to help students build physical intuition for the following relationships:

- **Capacitance scales linearly with κ**: Inserting a dielectric increases C by a factor of κ, directly observable in the Telemetry panel.
- **Time constant τ = RC**: Since τ depends on C, changing the dielectric changes the charging/discharging timescale — visible as a slower or faster exponential curve on the oscilloscope.
- **Exponential charging/discharging**: The oscilloscope traces show $V(t) = V_0(1 - e^{-t/\tau})$ for charging and $V(t) = V_0 e^{-t/\tau}$ for discharging, with τ markers overlaid for direct comparison.
- **KVL verification**: The Circuit Analysis panel displays $V_R + V_{cap}$ alongside $V_{supply}$, confirming Kirchhoff's Voltage Law in real time.
- **Energy storage**: Capacitor energy $U = \frac{1}{2}CV^2$ updates live, showing how dielectric choice affects energy capacity.

### 1.2 Design Philosophy

The interface follows a retro-futuristic cockpit aesthetic inspired by analog oscilloscopes and spacecraft instrument panels. Every data readout is presented in a backlit shadowbox display with a slim visor overhang, metal bevel frame, and color-matched ambient glow — designed to feel like reading instruments in a darkened control room. This visual language serves a pedagogical purpose: it trains students to read instruments, associate color with physical quantity, and treat the simulation as a serious measurement tool rather than a toy.

---

## 2. System Architecture

### 2.1 File Structure

The entire application lives in a single HTML file organized into three sections:

| Section | Lines (approx.) | Contents |
|---------|-----------------|----------|
| `<head>` + `<style>` | 1–118 | CSS custom properties, texture definitions, all component styles |
| `<body>` HTML | 119–178 | Static DOM structure — chassis, panels, containers for dynamic content |
| `<script>` | 179–423 | Physics engine, DOM update loop, canvas drawing, event handlers |

### 2.2 Rendering Pipeline

The application uses a **dirty-flag render loop** inspired by game engine patterns:

1. **State mutation** — Any user interaction (knob drag, button click, material select) mutates the global state object `S` and sets `dirty = true`.
2. **Main loop** — `requestAnimationFrame(ml)` runs continuously. On each frame, if `dirty` is true, it calls `updDOM()` and resets the flag.
3. **`updDOM()`** — Rebuilds all dynamic innerHTML (knobs, buttons, readouts, status indicators), then calls `drawScope()` and `drawApp()` for canvas/SVG rendering.
4. **Simulation loop** — When a charge/discharge is running, `requestAnimationFrame(sim)` runs in parallel, advancing simulation time and pushing trace data, setting `dirty = true` each frame.

This architecture avoids unnecessary redraws when nothing has changed, while ensuring immediate visual feedback on any interaction.

### 2.3 External Dependencies

| Resource | Purpose | Fallback |
|----------|---------|----------|
| Google Fonts (VT323, Rajdhani, Share Tech Mono) | Typography | Browser defaults |
| KaTeX 0.16.9 (CSS + JS via CDN) | LaTeX equation rendering | Unicode plain-text equations |

The KaTeX script uses an `onload` callback to set `window._katexReady = true` and trigger a re-render. If KaTeX fails to load, the equations display as readable Unicode text (e.g., `V(t) = V₀(1 − e⁻ᵗ/τ`).

---

## 3. Visual Design System

### 3.1 Chassis & Texture Layers

The outer `.chassis` wrapper uses four tiled SVG texture layers rendered as data-URI backgrounds, cached by the browser and composited via CSS:

| Layer | Class | Tile Size | Purpose |
|-------|-------|-----------|---------|
| Metal grain | `.tex-m` | 300×300 | Fractal noise, desaturated — fine metallic grain |
| Brushed flow | `.tex-b` | 400×200 | Asymmetric turbulence — directional brushed metal |
| Rust patina | `.tex-r` | 200×200 | Warm-tinted fractal noise via `mix-blend-mode: overlay` |
| Fine grit | `.tex-g` | 150×150 | High-frequency turbulence — ultra-fine surface texture |

Each sub-panel replicates these four texture divs within its own `overflow: hidden` container.

### 3.2 Color Palette

The interface uses a consistent color language where each hue maps to a physical domain:

| Color | Hex | Assigned To |
|-------|-----|-------------|
| Cyan | `#00ddee` | Supply voltage, general labels, field lines |
| Green | `#33ee55` | Capacitor voltage (CH1), charge Q, oscilloscope status |
| Amber/Gold | `#ffaa22` / `#ffcc44` | Resistance, time constant τ, capacitance, dielectric κ |
| Red | `#ff2244` | Energy, power, halt/stop, alert indicators |
| Blue | `#4488ff` | System status, idle indicators |

### 3.3 Shadowbox Display Components

All data readouts and equations share a unified shadowbox visual language:

**`.eq-box`** (equations) and **`.ro-box`** (readouts) both feature:

- **Recessed cavity**: Deep gradient background (`#04060a` → `#0c1018`) with heavy inset box-shadows creating apparent depth.
- **Backlight glow** (`::before`): Radial gradient rising from the bottom, color-matched to the displayed quantity via `--eq-glow` / `--eq-glow2` CSS custom properties.
- **Visor overhang** (`.ro-visor` / `::after`): A slim 4–5px solid bar at the top casting a long `box-shadow` downward (three stacked layers reaching 14–20px), simulating the anti-glare shroud on analog oscilloscope CRTs.
- **Metal bevel frame** (`.eq-frame`): Raised border with lighter top edge (`#3e444a`) and darker bottom (`#1c2026`), plus a faint inner highlight.
- **Glass specular** (`.eq-glass`, equations only): A subtle highlight streak near the top-left corner.

### 3.4 Hardware Components (SVG-Generated)

**Knurled rotary knobs** — 68px diameter SVG, 48 radial teeth rotating with the knob angle. Features include a knurl band (outer/inner concentric rings), a colored position notch, 28 arc indicator dots (lit proportionally to value), a pointer line with endpoint dot, and a hexagonal center cap. Drag interaction via `pointerdown`/`pointermove`/`pointerup` on `[data-knob]` attribute.

**Dome buttons** — CHARGE (green), DISCHARGE (amber), HALT (red). Each has a pressed/unpressed state with a domed cap containing an inner sphere, specular highlight, and shadow transitions.

**Material push buttons** — 9 dielectric selectors with LED bar indicators at top, 3D depress effect when active, identified by `[data-mat]` attribute.

**LED indicators** — Radial-gradient circles with glow shadows at various sizes (3px header dots, 5px panel indicators, 8px status squares).

**Bar graphs** — 8-segment vertical bars with color zones (green → amber → red at 65%/85% thresholds).

---

## 4. Physics Engine

### 4.1 Constants & Materials

The vacuum permittivity constant is defined as `E0 = 8.854 × 10⁻¹² F/m`.

Nine dielectric materials are available:

| Material | Symbol | κ (Dielectric Constant) |
|----------|--------|-------------------------|
| Vacuum | — | 1.000 |
| Air | — | 1.0006 |
| Paper | — | 3.7 |
| Glass | — | 4.7 |
| Mica | — | 5.4 |
| Rubber | — | 7.0 |
| Water | H₂O | 80 |
| Barium Titanate | BaTiO₃ | 300 |
| Strontium Titanate | SrTiO₃ | 310 |

### 4.2 Core Equations

**Capacitance**: $C = \kappa \varepsilon_0 \frac{A}{d}$

Computed by `cC(a, d, k)` where `a` is plate area in cm², `d` is separation in mm, and `k` is the dielectric constant. Internal conversion: area multiplied by `1e-4` (cm² → m²), separation multiplied by `1e-3` (mm → m).

**Time constant**: $\tau = RC$

Where R is resistance in ohms (state stores kΩ, multiplied by 1000 internally).

**Charging**: $V(t) = V_0 \left(1 - e^{-t/\tau}\right)$

**Discharging**: $V(t) = V_0 \, e^{-t/\tau}$

**Derived quantities** (computed each frame):

- Current: $I = \pm \frac{V_0}{R} e^{-t/\tau}$ (sign depends on charge/discharge mode)
- Charge: $Q = CV_{cap}$
- Energy: $U = \frac{1}{2} C V_{cap}^2$
- Resistor voltage: $V_R = V_{supply} - V_{cap}$ (charging) or $V_R = V_{cap}$ (discharging)
- Resistor power: $P_R = I^2 R$

### 4.3 Simulation Timestepping

The `sim(ts)` function receives a `requestAnimationFrame` timestamp and computes:

```
dt = (wallClockDelta / 1000) × (timeWindow / 4)
```

This maps real wall-clock time to simulation time such that one complete charge/discharge cycle takes approximately 4 seconds of real time, regardless of the actual τ value. The time window is `tw = max(5τ, 1μs)`.

Trace data is stored as an array of `{t, v, r}` objects (time, capacitor voltage, resistor voltage) and filtered to keep only points within `1.05 × tw`.

### 4.4 SI Prefix Formatting

The `fSI(value, unit)` function automatically selects the appropriate SI prefix (pico through kilo) and formats to 3 decimal places. This ensures readouts always display human-readable values regardless of the orders-of-magnitude range of capacitance, time constant, current, etc.

### 4.5 Control Ranges

| Parameter | Min | Max | Step | Default |
|-----------|-----|-----|------|---------|
| Supply Voltage | 1 V | 50 V | 0.5 V | 12 V |
| Resistance | 0.1 kΩ | 100 kΩ | 0.1 kΩ | 10 kΩ |
| Plate Area | 25 cm² | 2500 cm² | 25 cm² | 400 cm² |
| Plate Separation | 0.5 mm | 40 mm | 0.5 mm | 2 mm |

---

## 5. Panel Reference

### 5.1 Control Interface (Left Column, Top)

Contains four knurled rotary knobs (Supply V, Resistance, Plate Area, Separation), four corresponding 8-segment bar graphs, a row of 9 dielectric material push buttons, three dome action buttons (CHARGE, DISCHARGE, HALT), a status strip, and a polarization toggle checkbox.

**Knob interaction**: Click and drag vertically. Dragging upward increases the value; downward decreases. The knob SVG, arc indicators, and numeric readout all update in real time.

**Material buttons**: Click to select. The active material shows a depressed state with lit LED bar and amber glow.

**Dome buttons**: CHARGE initiates a charging cycle from 0V. DISCHARGE initiates a discharging cycle from V₀. HALT stops any running simulation. Buttons are disabled (no response) while a simulation is already running — you must HALT first.

**Polarization toggle**: When checked, the cross-section diagram shows molecular dipoles instead of E-field arrows in the dielectric gap.

### 5.2 Cross Section (Left Column, Bottom)

An SVG diagram of the RC circuit, laid out top-to-bottom:

1. **DC Supply box** (top, fixed position) — displays current supply voltage.
2. **Labels** — plate separation `d`, plate area `A`, and dielectric material name with κ value, centered below the supply.
3. **Wiring** — Left wire exits supply terminal horizontally outward, then turns down through a zigzag resistor symbol (labeled R with value) before connecting to the positive plate. Right wire exits horizontally outward, turns down, connects to the negative plate.
4. **Capacitor plates** — Positive plate (red gradient, + symbols) on the left, negative plate (blue gradient, − symbols) on the right, with dark silver (`#4a4e52`) metal outlines. The gap between plates scales with the separation knob; plate height scales with √(area).
5. **Dielectric fill** — The gap is filled with a material-specific SVG pattern texture overlaid on the base color, plus E-field arrows (cyan, pointing left-to-right) or polarization dipoles (amber, when toggled).

The wiring and supply are anchored at fixed positions — only the plates and dielectric gap change when parameters are adjusted. The SVG `viewBox` dynamically expands vertically to accommodate larger plate areas.

#### Dielectric Texture Patterns

Each material has a unique SVG `<pattern>` providing visual identity:

| Material | Pattern Description |
|----------|-------------------|
| Vacuum / Air | No pattern — dark empty space |
| Paper | Diagonal crosshatch lines in warm tan, suggesting cellulose fiber |
| Glass | Small rounded rectangles and specular dots in cool blue — amorphous silicate |
| Mica | Horizontal layered lines at varying opacities — sheet-silicate cleavage planes |
| Rubber | Scattered soft circles in warm brown — cross-linked polymer granularity |
| Water | Bubbles (unfilled circles), wave paths, and filled dots in blue — molecular motion |
| BaTiO₃ | Square unit cells with center atoms and bonds in warm gold — perovskite lattice |
| SrTiO₃ | Diamond-rotated unit cells with corner/center atoms in bright gold — perovskite variant |

Materials with κ > 5 also receive a subtle inner glow stroke along the dielectric edge (blue for water, warm gold for others).

### 5.3 Oscilloscope (Right Column, Top)

A 560×300px HTML5 canvas rendering a phosphor-style oscilloscope display.

**Background**: Radial amber-tinted gradient with scanline overlay (alternating 2px horizontal bands) and corner vignette.

**Grid**: 10 vertical × 8 horizontal divisions in dim amber, with center crosshairs in slightly brighter amber.

**Axes**: Time axis (bottom) auto-scales with SI prefixes (μs, ms, s). Voltage axis (left) scales from 0 to the nearest multiple of 5V above the supply voltage.

**τ markers**: Cyan dashed vertical lines at 1τ, 2τ, 3τ, etc. positions, labeled at the top. These provide direct visual measurement of the time constant.

**Traces**: Three-layer phosphor glow rendering per channel:

1. Thick dim outer stroke (10px, 10% opacity) — phosphor bloom
2. Medium mid stroke (5px, 25% opacity) — body
3. Thin bright core stroke (2px, full opacity, with canvas `shadowBlur`) — sharp center

An animated dot (bright circle with white center) marks the current trace endpoint.

**Channel modes**: Toggle between CH1 (V_cap, green), CH2 (V_R, amber), or DUAL (both overlaid) using the channel buttons above the screen.

**Status indicators**: A status strip shows colored LED squares and a recording label ("REC" with blink animation during simulation, "IDLE" when stopped).

### 5.4 Telemetry (Right Column)

Six shadowbox instrument readouts in a 2×3 grid:

| Readout | Color | Unit |
|---------|-------|------|
| Capacitance | Gold | F (with SI prefix) |
| Time Constant τ | Amber | s (with SI prefix) |
| V_cap | Green | V |
| Current | Cyan | A (with SI prefix) |
| Charge Q | Green | C (with SI prefix) |
| Energy U | Red | J (with SI prefix) |

All values update in real time during simulation with a subtle `hum` animation (opacity oscillation).

### 5.5 Circuit Analysis (Right Column)

**Top section** — Three κ comparison readouts in a 1×3 grid:

| Readout | Description |
|---------|-------------|
| κ (material) | Raw dielectric constant of selected material |
| C / C_vacuum | Ratio showing capacitance amplification factor |
| τ / τ_vacuum | Ratio showing time constant amplification factor |

**Divider** — Section label: "LOAD RESISTOR — R = X kΩ"

**Bottom section** — Four load resistor readouts in a 2×2 grid:

| Readout | Color |
|---------|-------|
| V_R | Amber |
| I through R | Gold |
| Power P_R | Red |
| V_R + V_cap | Gray (with ≈ V_supply annotation) |

**KVL reminder**: Static text at the bottom: `KVL ▸ V_SUPPLY = V_R + V_CAP`

### 5.6 Equations (Right Column, Bottom)

Four KaTeX-rendered equations in backlit shadowbox frames:

| Label | Equation | Glow Color |
|-------|----------|------------|
| Capacitance | $C = \kappa \varepsilon_0 \frac{A}{d}$ | Gold |
| Time Constant | $\tau = RC$ | Amber |
| Charging | $V(t) = V_0\left(1 - e^{-t/\tau}\right)$ | Green |
| Discharging | $V(t) = V_0 e^{-t/\tau}$ | Amber |

Equations render once when KaTeX loads (flagged by `window._eqDone`). Each equation box has its own `--eq-glow` color matching the equation's physical domain.

---

## 6. Operating Modes

### 6.1 Explore Mode (Default)

All controls are unlocked. The student can freely adjust any parameter, select any material, and run charge/discharge cycles in any order. This is the open sandbox mode for experimentation.

### 6.2 Guided Mode

A 5-step structured investigation workflow, accessible via the GUIDED button:

| Step | Title | Instruction | Success Condition |
|------|-------|-------------|-------------------|
| 01 | CALIBRATE | Set dielectric to AIR | Air selected |
| 02 | BASELINE | Record C₀ (air), charge, observe τ | Always passes |
| 03 | INSERT | Select a non-trivial dielectric, observe C jump | Non-air/vacuum selected |
| 04 | COMPARE | Charge again, observe τ change | Always passes |
| 05 | EXPLORE | All unlocked, predict then test | Always passes |

Navigation controls (BACK / NEXT / RESET) allow stepping through the workflow. A status indicator shows current step progress and whether the step condition is met (green check vs. amber waiting).

---

## 7. Event System

### 7.1 Knob Drag Protocol

Knob interaction uses the Pointer Events API for unified mouse/touch handling:

1. `pointerdown` on any `[data-knob]` SVG element captures the pointer, records the starting Y position and current value.
2. `pointermove` computes `ΔY = startY - currentY`, maps it through the knob's range (`(max - min) / 150` pixels), snaps to the step size, and clamps to bounds.
3. `pointerup` releases the capture.

### 7.2 Click Delegation

A single `document.addEventListener('click', ...)` handler uses `closest()` to identify click targets:

- `[data-mat]` → material selection
- `[data-ch]` → oscilloscope channel toggle
- `#dC` → charge action
- `#dD` → discharge action
- `#dH` → halt action

### 7.3 Checkbox

The polarization toggle (`#chkP`) uses a `change` event listener.

---

## 8. Performance Considerations

**Texture caching**: All four SVG texture patterns are encoded as data-URI CSS custom properties, decoded once by the browser and tiled via `background-size`. No network requests after initial page load (for textures).

**Dirty-flag rendering**: The DOM is only rebuilt when state changes. During idle periods, the main loop runs but skips `updDOM()` entirely.

**Canvas optimization**: The oscilloscope canvas is only redrawn when `dirty` is true. The three-layer phosphor glow effect uses three sequential `stroke()` calls with varying `lineWidth` and `globalAlpha` — this is more efficient than creating off-screen canvases or applying CSS filters.

**innerHTML batching**: All dynamic DOM updates are batched into a single `updDOM()` call that rebuilds innerHTML for each container in sequence. This is faster than incremental DOM diffing for this use case because the content is fully regenerated from state each frame.

**SVG apparatus**: The cross-section SVG is rebuilt as a string and assigned to `innerHTML` each frame. This is efficient because the SVG is relatively simple (< 50 elements) and string concatenation is faster than DOM manipulation for full rebuilds.

---

## 9. Deployment

### 9.1 Requirements

- Any modern browser (Chrome, Firefox, Safari, Edge) with JavaScript enabled.
- Internet connection for Google Fonts and KaTeX CDN on first load (both are cached by the browser thereafter).
- No server, build step, or installation required.

### 9.2 Offline Usage

The file works offline with two graceful degradations: fonts fall back to system sans-serif/monospace, and equations display as Unicode plain text instead of KaTeX-rendered LaTeX.

### 9.3 Integration

The HTML file can be:

- Embedded in an LMS (Canvas, Blackboard, Moodle) as a file upload or iframe.
- Hosted on any static file server or GitHub Pages.
- Distributed directly to students as a downloadable file.
- Opened locally from the filesystem via `file://` protocol.

---

## 10. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | — | Initial React/JSX implementation with Vite build |
| 2.0 | 2026-03 | Complete vanilla HTML/CSS/JS rewrite matching Cash Bubble Simulator architecture. Single-file, no build step. Added: SVG dielectric texture patterns per material, dynamic viewBox scaling, top-anchored fixed wiring layout, KaTeX equation rendering with fallback, shadowbox readout displays with visor overhangs, per-panel ambient glow system, upgraded chassis/panel depth treatment. Separation range doubled to 40mm. |
