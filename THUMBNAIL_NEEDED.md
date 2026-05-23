# Projects Needing Real Thumbnails

> **Last updated:** 2026-05-22 (SA audit)
> **Status of urgency:** Low. The Cinematic-tier render (`js/cinematic.js`, quest-card template) does **not** read the `image` field from `projects.json` — cards are text-only (status pill, type pill, date, title, description, chevron). Placeholder SVGs are data integrity only; they don't appear on user-visible pages. Worth replacing if the homepage or quest grid ever re-introduces card imagery.

---

## 25 projects currently use placeholder SVGs

All placeholders exist on disk in `images/project_images/`. To replace one: produce a screenshot (PNG or JPG, ~400px wide is plenty), drop it in `images/project_images/`, and update the `image` path on the matching entry in `projects.json`.

### Visible on Projects page

| Project | Placeholder | Suggested screenshot |
|---------|-------------|----------------------|
| Tip-Recover | `placeholder-tip-recover.svg` | 3D simulator with cylinder mid-tip + phase portrait |
| Sound and Setting | `placeholder-sound-and-setting.svg` | Essay hero figure (chamber cross-section or 110 Hz waveform) |
| Induction Lab | `placeholder-induction-lab.svg` | AC Generator module with EMF / Φ traces on scope |
| Dispersion and Stratification | `placeholder-dispersion-stratification.svg` | Mode A or Mode C panel of the simulator |
| Rotating Slot Simulator | `placeholder-rotating-slot.svg` | Spiral trajectory + polar component readouts |
| Navier-Stokes Smoke Simulator | `placeholder-smoke-sim.svg` | Vortex / plume render |
| Data Center Cooling Testbed | `placeholder-te-lab.svg` | Server rack with thermal gradient overlay |
| The Work-Energy Principle | `placeholder-work-energy.svg` | Treatise key figure or section header |
| Capacitor Dielectric Lab | `placeholder-capacitor-lab.svg` | Field-line view with dielectric inserted |
| On Dynamical Systems | `placeholder-dynamical-systems.svg` | Treatise page or key diagram |
| Eisenhower Task Manager | `placeholder-eisenhower.svg` | 4-quadrant matrix view |
| Dynamical Systems Lab | `placeholder-dynamical-systems-lab.svg` | Lorenz attractor 3D render |
| Two-Body Gravitational Free Fall | `placeholder-two-body.svg` | Derivation page or simulation |
| Problem-Solving and Critical Path Reasoning | `placeholder-problem-solving-cpr.svg` | PSCPR guide sheet |
| Inferential Dynamics | `placeholder-inferential-dynamics.svg` | Inference square / stability matrix |
| Dynamic Control of an Aeropendulum | `placeholder-aeropendulum.svg` | Photo of hardware or serial plot |
| Rebound Pendulum | `placeholder-rebound-pendulum.svg` | Slide deck key figure or video still |
| Certainty, Inference, and Comprehension | `placeholder-certainty-inference.svg` | Slide deck cover or key diagram |
| Horizontal Frame Centering Algorithm | `placeholder-frame-center.svg` | Diagram of frame spacing formula |
| Fundamental Principles - On Analogies (continued) | `placeholder-physical-analogies-continued.svg` | Cross-domain analogy table |
| On Physical Analogies | `placeholder-physical-analogies.svg` | Source-field-force diagram |

### Hidden (`visible: false`) — replace if you bring them back

| Project | Placeholder |
|---------|-------------|
| Social Field | `placeholder-social-field.svg` |
| Degree Navigator | `placeholder-degree-nav.svg` |
| Knowledge Base Explorer | `placeholder-kb-explorer.svg` |
| SPECTRUM Market Analytics | `placeholder-spectrum.svg` |

---

## 12 projects with real screenshots

Already wired; no action needed unless replacing.

- 2D Particle Collision Lab — `collision-lab.png`
- Optics Lab — `optics-lab.png`
- Artemis II — `artemis-ii.png`
- ECDO Watch — `ecdo-watch.png`
- Thermofluidic Finance — `thermofluidic-finance.png`
- Electrostatics Lab — `electrostatics-lab.png`
- Universe of Proportions — `univ-of-proportions-pic.png`
- Gravitational Radiation — `grav-rad.png`
- Disk Cam Synthesis — `cam-userform.png`
- Nonlinear Human Population Growth Modeling — `sameforecastnewimage2.jpg`
- Gravitational Wave Detector — `grav-waves-maybe.png`

### One wiring inconsistency

- **Artemis II v2 (`project36`)** currently points to `artemis-ii.png` (same as v1). A real `artemis-ii-v2.png` exists in `images/project_images/` and isn't being used. Swap when convenient.
