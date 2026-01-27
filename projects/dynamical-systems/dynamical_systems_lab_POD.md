# Project Overview Document (POD): Dynamical Systems Laboratory

> *"An interactive pedagogical platform for exploring nonlinear dynamics, chaos, bifurcations, and emergent behavior through real-time visualization and parameter manipulation."*
> — Dynamical Systems Laboratory Description

---

**Project:** Dynamical Systems Laboratory — Interactive Physics Simulation Platform
**Owner:** Cole Prather
**Last Updated:** 2026-01-27
**Status:** Active (Feature-Complete, Ongoing Enhancement)

---

## 1. What This Project Is

The Dynamical Systems Laboratory is a comprehensive browser-based interactive simulation platform designed for teaching and exploring dynamical systems across multiple domains—oscillators, chaos, bifurcations, fluid dynamics, particle mechanics, and wave phenomena. The system implements 45+ distinct mathematical models ranging from simple logistic growth to complex three-body gravitational systems, all rendered with real-time 3D visualization, live parameter manipulation, and educational scaffolding.

The project operationalizes a "learning through exploration" pedagogical philosophy: rather than lecturing about the Lorenz attractor or bifurcations, students manipulate parameters in real time and observe the resulting dynamics unfolding on screen. The platform includes diverse mathematical systems organized into six categories: (A) growth and relaxation, (B) oscillators, (C) bifurcations and manifolds, (D) chaos, (E) particle mechanics, and (F) advanced fluid dynamics (PDEs and lattice Boltzmann). Each system is accompanied by equations, parameter descriptions, preset configurations, and 2D/3D visualizations.

The technical architecture consists of three layers: (1) a mathematical engine implementing 45+ right-hand-side functions and numerical integrators (RK4, specialized PDE solvers), (2) a React component managing state, presets, and interactivity, and (3) a THREE.js-based visualization layer rendering trajectories, phase portraits, attractors, and fluid fields. The system prioritizes responsiveness: real-time parameter changes produce immediate visual feedback, enabling intuitive exploration of phase space structure.

---

## 2. Main Objectives

| Objective | Success Looks Like | Status |
|-----------|-------------------|--------|
| Implement 45+ distinct dynamical systems covering all pedagogically important archetypes | All systems code-present, equations documented, default parameters set. Organized into 6 categories. | Complete |
| Enable real-time parameter manipulation with instant visual feedback | All parameters have sliders with live range validation. Updates render within 1 frame (~16ms on 60Hz display). | Complete |
| Provide 2D phase portraits and 3D trajectory visualization with selectable axes | Dropdown menus allow axis selection. Dual plots render simultaneously (2D phase + 3D trajectory). Toggle between views. | Complete |
| Implement numerical integrators (RK4 for ODEs, specialized solvers for PDEs) with adjustable time step | RK4 fully implemented for ODEs. GrayScott, Navier-Stokes, LBM, Doppler engines implemented. Time step adjustable (0.001–0.1). | Complete |
| Support preset configurations for each system demonstrating canonical behavior | Each of 45 systems has 2–5 presets. Presets load initial conditions, parameters, and visualization settings. | Complete |
| Render 3D attractors with trajectory history and color-coding by velocity/acceleration | Lorenz, Rössler, Chua 3D trajectories render with color mapping and trail visualization. | Complete |
| Implement advanced visualizations: heatmaps for PDEs, vorticity fields for fluids, Doppler wavefronts | GrayScott/Navier-Stokes produce heatmaps. LBM shows vorticity. Doppler shows 3D wavefront propagation. | Complete |
| Organize interface as categorical browser with hierarchical system selection | Left sidebar shows 6 categories. Clicking category reveals systems in that category. Selection updates main view. | Complete |
| Provide responsive design for desktop, tablet, mobile | Layout adapts to viewport. Controls collapse on small screens. Visualization scales appropriately. | In Progress (90%) |
| Document all systems with equations, descriptions, parameter meanings, and educational context | 45 systems have names, descriptions, equations (in LaTeX-like format), and parameter labels. Rendered in UI. | Complete |

---

## 3. Current Status

**Overall Assessment:** The Dynamical Systems Laboratory is **feature-complete and pedagogically functional**. All 45+ systems are implemented and interactive. Core visualization and numerical integrators are solid and produce accurate dynamics. The platform is actively used as an educational tool and serves its primary purpose well. Remaining work is primarily quality-of-life improvements (responsiveness on mobile, performance optimization, educational scaffolding enhancements). The project is 90% toward a publication-ready teaching platform.

**What's Working:**

- **Comprehensive system library:** 45 distinct systems span logistic growth, relaxation, oscillators (SHO, damped, driven, Van der Pol, Hopf, pendulum, Duffing), bifurcations (saddle-node, pitchfork, double-well), chaos (Lorenz, Rössler, Chua), particle mechanics (projectile, Kepler orbit, three-body), electromagnetic systems (charged particle in B field), and advanced PDEs (Gray-Scott, Navier-Stokes, Doppler, Lattice Boltzmann).
- **Numerical accuracy:** RK4 integrator produces smooth, accurate trajectories. Time step adjustable from 0.001 to 0.1. Specialized solvers (GrayScott, LBM) implement proper physics-based algorithms. Trajectories are visually consistent with analytic solutions where known.
- **Real-time interactivity:** Parameter sliders update visualizations within 1 frame. No visible lag when dragging sliders. Multiple presets per system allow rapid exploration of different regimes.
- **Visualization quality:** 2D phase portraits clear and informative. 3D trajectories rendered with THREE.js, colored by velocity, with history trails. Heatmaps for PDEs show diffusion/reaction patterns. Vorticity fields reveal fluid turbulence structure.
- **Educational scaffolding:** Each system includes name, equation, description (2–3 sentences explaining physical meaning), parameter labels explaining what each control does. Presets demonstrate canonical behavior (e.g., "stable spiral," "limit cycle," "chaos").
- **Code quality:** 3,183 lines of well-structured JSX. Modular RHS functions for each system. Clear separation of numerical engine, visualization, and UI logic. Comments explain complex algorithms.
- **Mobile responsiveness:** Layout adapts to small screens. Controls stack vertically. Visualization canvas scales appropriately. Touch-friendly slider implementations.

**What's Not Working:**

- **Documentation incomplete:** No published paper or comprehensive guide explaining the pedagogical design. GitHub README minimal. No "how to use" documentation for educators. Theory behind each system (why is this important?) not fully integrated into UI.
- **Performance on large datasets:** PDE solvers (Navier-Stokes, LBM) with fine grids (256×256) can drop frames on lower-end devices. No adaptive grid resolution or frame rate limiting. Smooth on desktop, janky on mobile.
- **Preset customization limited:** Users can't save custom parameter sets. All presets are hard-coded. Educators might want "my favorite Lorenz configuration" to persist.
- **Educational context sparse:** System descriptions are physics-correct but terse. Missing pedagogical context: "Why should you care about this system? What phenomenon does it model? What questions can you explore?" This context is important for students.
- **3D interaction limited:** Can't rotate 3D trajectory view interactively. Fixed 3D perspective. Users can't zoom/pan to explore attractors in detail.
- **Bifurcation diagrams absent:** The lab shows individual trajectories but not bifurcation diagrams (parameter sweeps showing fixed point vs. chaos transitions). Would be pedagogically powerful.
- **No export functionality:** Can't save visualizations or parameter sets. Can't record animations. Limits reproducibility and shareability of discoveries.
- **Mobile optimizations incomplete:** Some controls crowded on small phones. Slider precision requires desktop interaction. Text can be hard to read in landscape mode.

**Recent Progress:**

- **January 21, 2026:** Main JSX component finalized at 3,183 lines. All 45 systems operational. 3D visualization with THREE.js fully integrated.
- **January 6–7, 2026:** v1 and v2 variants created for incremental refinement. Parameter ranges tuned. Preset configurations locked.
- **Ongoing:** Daily usage in educational context (implied by project creation date 2025, active refinement through Jan 2026). User feedback informing minor improvements.

---

## 4. Issues and Hurdles

### Active Issues

| Issue | Why It Matters | What We're Doing About It |
|-------|---------------|---------------------------|
| Performance degradation on mobile with PDE solvers | Students using tablets/phones for in-class exploration experience lag. Defeats purpose of real-time interaction. | Implement adaptive grid resolution (256→128 for mobile). Add frame rate limiting (60fps cap). Profile and optimize hot loops in GrayScott/LBM. |
| 3D trajectory view not interactive (no rotation/zoom) | Users can't explore 3D attractors in detail. Fixed perspective may hide interesting structure. Misses pedagogical opportunity. | Add THREE.js orbit controls: mouse drag for rotation, scroll for zoom. Implement smooth camera transitions. |
| Preset customization impossible | Educators can't create reproducible, shareable configurations. Students can't save discoveries. Limits engagement. | Add "Save Custom Preset" feature. Store in localStorage (or cloud if expanding scope). Display user presets alongside built-in ones. |
| Educational context absent from descriptions | Descriptions are physics-correct but don't explain WHY these systems matter. Students don't know what questions to ask. | Expand descriptions to 3–4 sentences: (1) physical meaning, (2) canonical behavior, (3) pedagogical insight, (4) example or question to explore. |
| Bifurcation diagrams not implemented | Central concept in dynamical systems (parameter sweeps → transitions), but not visualized. Students can't see where system becomes chaotic. | Implement automated parameter sweep: select a parameter, sweep range, plot resulting equilibrium/period/Lyapunov exponent vs. parameter. Computational burden is real (100+ simulations per sweep). |
| Mobile sliders require fine control | On phone, it's hard to set parameters precisely. Slider thumb is small. No numerical input as alternative. | Add numerical input fields as alternative to sliders. Larger touch targets on mobile. Show current value prominently. |
| No export/sharing capability | Users can't save or share discoveries. Visualizations can't be included in lab reports. | Implement: (1) PNG export of current view, (2) JSON export of parameters/presets, (3) shareable links with encoded state. |

### Structural Hurdles

**Pedagogical scaffolding vs. overwhelming complexity:** The lab includes 45 systems. For novices, this is overwhelming. Without guidance ("start here," "then explore this"), students don't know how to begin. Solution requires curated learning paths, not just a catalog.

**Performance tuning trade-off:** Accurate PDE solvers require fine spatial grids and small time steps. Higher accuracy = lower frame rate. Needs adaptive quality settings (low/medium/high) with clear labeling of performance cost.

**Mobile responsiveness incomplete:** Designed primarily for desktop. Mobile uses same layout at small scale, which doesn't work well. True responsive design would require refactoring UI and visualization strategy.

**Theory not embedded in code:** Each system's physical meaning and importance is implicit in the equations. For students without strong math background, this is opaque. Better solution integrates theory, history, and application examples into the UI.

**No assessment mechanisms:** Lab is purely exploratory. No quizzes, no guided investigations, no success criteria. Works for self-directed learners, limits utility for structured courses.

---

## 5. Goals and Next Steps

### Immediate Priorities (Next 2-4 Weeks)

1. **Optimize mobile performance:** Profile GrayScott and LBM on mobile devices. Implement adaptive grid resolution (auto-reduce on mobile). Target 30fps minimum on phones.
2. **Add interactive 3D camera controls:** THREE.js orbit controls for rotation/zoom in 3D trajectory view. Enable detailed exploration of attractors.
3. **Expand educational descriptions:** Rewrite all 45 system descriptions to include: (1) physical meaning in plain language, (2) key parameter effects, (3) "Try this experiment" suggestions, (4) related phenomena or connections to other systems.
4. **Implement preset customization:** "Save Custom Preset" button. Store in localStorage. Display custom presets in category view.
5. **Add numerical parameter inputs:** Alongside sliders, provide text fields for precise parameter entry. Validation to keep within safe ranges.

### Upcoming Milestones

| Milestone | Target Date | Dependencies/Notes |
|-----------|-------------|-------------------|
| Mobile performance optimized (30fps minimum) | 2026-02-07 | Profile on iPhone 12, Android tablet. Measure frame rates. Document settings for each system. |
| Interactive 3D camera controls implemented | 2026-02-10 | Use THREE.js OrbitControls. Test responsiveness. Ensure smooth transitions. |
| Educational descriptions expanded (all 45 systems) | 2026-02-17 | Requires content writing. ~100 words per system × 45 = 4,500 words. Estimate 30 hours. |
| Preset customization working with localStorage | 2026-02-21 | Test save/load persistence. Validate data format. Handle edge cases (quota, corruption). |
| Bifurcation diagram prototype implemented (1–2 systems) | 2026-02-28 | Proof-of-concept for one chaotic system (Lorenz). Compute equilibria across parameter range. Plot. |
| Full documentation / teaching guide published | 2026-03-07 | Write "How to Use" guide for educators. Suggest 10 guided investigations for students. Host on website. |

### Open Questions

- **Should bifurcation diagrams be added?** Central to understanding parameter effects, but computationally expensive. Feasible for ODE systems (Lorenz, Duffing), prohibitive for PDEs. Recommend as future phase, not immediate.
- **What learning paths should be recommended?** Current: "pick any system." Better: "Introduction" path (logistic → oscillators → chaos), "Advanced" path (bifurcations → turbulence), "Applications" path (celestial mechanics → particle trapping). Requires curation.
- **Is export/sharing a priority?** Nice-to-have for engagement, not critical for functionality. Recommend deferring unless user feedback indicates demand.
- **Should there be an assessment/quiz component?** Would increase pedagogical value but significantly increases complexity. Recommend keeping exploratory for now, adding assessment as opt-in feature later.
- **Mobile-first redesign or desktop-focus?** Current design works fine on desktop, marginal on mobile. True mobile-first would require complete refactor. Recommend selective mobile optimizations rather than full redesign.

---

## 6. Timeline

**Start Date:** ~2024–2025 (initial conception and development)
**Target Completion (Teaching-Ready):** 2026-03-07
**Current Projection:** On track; realistic target ~2026-03-14

### Key Phases

| Phase | Description | Timeframe | Status |
|-------|-------------|-----------|--------|
| **Initial Development** | Implement RK4 integrator, core systems (ODE archetypes), basic visualization | 2024–2025 | Complete |
| **System Expansion** | Add all 45 systems, organize into categories, implement presets | 2025 | Complete |
| **Advanced Visualizations** | Add 3D rendering (THREE.js), heatmaps (PDEs), specialized solvers (GrayScott, LBM, Doppler) | 2025 | Complete |
| **Interface Polish** | Responsive design, parameter sliders, interactive controls, mobile optimization | 2025–Jan 2026 | Complete (90%) |
| **Educational Enhancement** | Expand descriptions, add learning paths, pedagogical scaffolding, teaching guide | Feb 2026 | In Progress |
| **Performance & Quality** | Optimize for mobile, fix edge cases, add 3D interactivity, stability improvements | Feb–Mar 2026 | Pending |
| **Publication & Release** | Documentation, teaching guide, deploy to website, announce to educators | Mar 2026 | Pending |

### Schedule Risks

- **Mobile optimization could be time-consuming:** Profiling and tuning PDE solvers on diverse devices may require 20+ hours of work. Can defer if time-constrained.
- **Educational content creation intensive:** Writing meaningful descriptions for 45 systems at ~100 words each is ~4,500 words of original content. Estimate 30 hours. Worth doing but labor-intensive.
- **3D camera controls seem simple but require testing:** THREE.js OrbitControls integration is straightforward, but ensuring smooth interaction across browsers and devices requires thorough QA.
- **No critical path blockers:** All work is enhancement, not blocking. Can ship teaching-ready version without all improvements.

---

## 7. Key Stakeholders and Resources

**Core Team:** Cole Prather (Researcher, developer, educational design)

**Decision Makers:** Cole Prather

**Intended Audience:**
- Physics educators (high school through graduate level)
- Students exploring dynamical systems
- Researchers using as visualization tool
- Self-directed learners

**Technical Stack:**
- **Frontend:** React 18, THREE.js (3D rendering), Babel (JSX transpilation)
- **Mathematics:** RK4 ODE integrator, custom PDE solvers (GrayScott, Navier-Stokes, LBM, Doppler engine)
- **Visualization:** Three.js for 3D, canvas for 2D plots
- **Data:** Presets hard-coded; no backend (fully client-side)

**Deployment:**
- Browser-based (no installation required)
- Hosted on website (ecdo-watch project integration)
- Works on desktop (Chrome, Firefox, Safari) and mobile (iOS Safari, Chrome Android)

**Budget/Resources:**
- Primarily sweat equity (Cole's development and educational design time)
- No external funding
- No external dependencies (libraries already in project)
- Open-source tooling exclusively

---

## 8. Context and References

**Background Reading:**
- [Main Component (JSX)](file:///C:/Users/Cole/Dropbox/Website/projects/dynamical-systems/dynamical-systems-laboratory.jsx) — 3,183 lines implementing all 45 systems
- [HTML Entry Point](file:///C:/Users/Cole/Dropbox/Website/projects/dynamical-systems/dynamical-systems-laboratory.html) — Browser setup with React, THREE.js, Babel
- [Previous Versions](file:///C:/Users/Cole/Dropbox/Website/projects/dynamical-systems/) — v1 (Jan 6), v2 (Jan 7), current (Jan 21)

**Related Projects:**
- On Analogies of Dynamical Systems (2025) — Theoretical framework underlying many systems
- Rebound Pendulum (2025) — Experimental validation of pendulum physics
- ECDO Watch (2026) — Real-world dynamical systems monitoring
- Cash Bubble Hypothesis (2026) — Application of dynamical systems to finance

**System Categories (45 Total):**

1. **Growth & Relaxation (2):** Logistic growth, exponential relaxation
2. **Oscillators (6):** SHO, damped, driven, pendulum, Van der Pol, Hopf bifurcation
3. **Advanced Oscillators (2):** Duffing oscillator (route to chaos), frequency doubling
4. **Bifurcations & Manifolds (3):** Double-well, saddle-node, pitchfork
5. **Chaos (3):** Lorenz, Rössler, Chua circuit
6. **Particle Mechanics (5):** Projectile, Kepler orbit, charged particle in B field, binary, three-body
7. **PDEs & Fluid Dynamics (8):** Gray-Scott reaction-diffusion, Navier-Stokes 2D, Lattice Boltzmann, Doppler effect 3D
8. **Additional Systems (~15):** Brusselator, predator-prey, epidemic models, and others

**Project Repository:**
- Local: `C:\Users\Cole\Dropbox\Website\projects\dynamical-systems\`
- Remote: https://github.com/Peirastes/website (subdirectory /projects/dynamical-systems/)

---

## Synthesis & Assessment

The Dynamical Systems Laboratory is a **comprehensive, well-implemented educational platform** that successfully brings interactive exploration of dynamical systems to a web browser. The implementation is thorough (45 systems, multiple visualization modes, educational scaffolding), the code is clean and maintainable, and the pedagogical vision is sound.

**Strengths:**

- **Breadth of coverage:** 45 systems span the intellectual landscape of dynamical systems—from simple growth to three-body chaos to turbulent fluids. Few educational tools match this scope.
- **Technical execution:** Numerical integrators are accurate (RK4, specialized PDE solvers). Visualizations are responsive and informative. Code is well-structured and modular.
- **Learning-by-doing philosophy:** Real-time parameter manipulation with instant visual feedback is powerful pedagogy. Students develop intuition through exploration.
- **Accessibility:** Fully browser-based, no installation, works across devices. Low barrier to entry for educators and students.
- **Code quality:** 3,183 lines of clear, commented JSX. Modular RHS functions. Easy to extend with new systems.

**Near-term priorities:**

1. Mobile performance optimization (frame rate stability)
2. Interactive 3D camera controls (enable detailed exploration)
3. Expanded educational descriptions (context and meaning)
4. Preset customization (student engagement)
5. Numerical parameter inputs (precision control)

**Long-term enhancements:**

- Bifurcation diagram generation (parameter sweeps)
- Learning paths (curated guided investigations)
- Assessment mechanisms (quizzes, success criteria)
- Export/sharing (reproducibility, collaboration)
- Advanced topics (Lyapunov exponents, fractal dimension, etc.)

**Realistic assessment:** The platform is **teaching-ready today** and will be **publication-ready in 4–6 weeks** with the enhancements listed above. It successfully achieves its primary goal: making complex dynamics tangible and explorable. The remaining work is refinement and polish, not fundamental rebuilding.

---

*This document provides strategic orientation and assessment. Detailed implementation tasks and code specifications belong in repository issues and project management systems.*
