# Knowledge Base Gap Report
Generated: 2026-03-18

## Summary
- Scanned: 16 project directories, 40 documents, 6 agent files
- Projects in projects.json: 23
- Existing KB nodes: 168 (16 FP, 12 DA, 35 claims, 14 HSK, 36 SOP, 37 SKL, 18 TOOL)
- Candidate new entries: 186
  - Tool gaps: 23
  - Domain knowledge gaps: 66
  - Human skill gaps: 5
  - AI skill gaps: 12
  - AI knowledge gaps: 80

---

## Tool Gaps (technologies used but not in TOOL entries)

### Strong (multiple sources)

- **Claude API** -- used by [.claude, agent-pipeline-ide, agent-world, cash-bubble, ecdo-watch, electrostatics-lab, kb-explorer, project-documents, POD/PSR: agent_pipeline_ide_build_plan.md, POD/PSR: agent_pipeline_ide_POD.md, POD/PSR: agent_world_POD.md, POD/PSR: agent_world_PSR.md, POD/PSR: eisenhower_task_manager_POD.md, POD/PSR: eisenhower_task_manager_PSR.md, Memory: MEMORY.md, Memory: project_pipeline_checkpoints.md, Agent Guide: CE, Agent Guide: PM]
- **KaTeX Math Rendering** -- used by [agent-pipeline-ide, dynamical-systems, electrostatics-lab, kb-explorer, project-documents, POD/PSR: capacitor_dielectric_lab_POD.md, POD/PSR: dynamical_systems_lab_POD.md, POD/PSR: dynamical_systems_lab_PSR.md, POD/PSR: dynamical_systems_sources_fields_POD.md, POD/PSR: dynamical_systems_sources_fields_PSR.md, POD/PSR: electrostatics_lab_POD.md, POD/PSR: electrostatics_lab_PSR.md, Memory: MEMORY.md]
- **Anthropic SDK** -- used by [.claude, agent-pipeline-ide, agent-world, electrostatics-lab, kb-explorer, project-documents, POD/PSR: agent_pipeline_ide_build_plan.md, POD/PSR: agent_world_PSR.md]
- **Express.js Server** -- used by [agent-pipeline-ide, eisenhower-task-manager, kb-explorer, project-documents, POD/PSR: eisenhower_task_manager_POD.md, POD/PSR: eisenhower_task_manager_PSR.md, Memory: MEMORY.md, Agent Guide: CE]
- **Manim Animation** -- used by [.claude, electrostatics-lab, kb-explorer, manims, project-documents, POD/PSR: manims_POD.md, Agent Guide: CE]
- **Marked (Markdown Parser)** -- used by [agent-pipeline-ide, agent-world, dynamical-systems, eisenhower-task-manager, kb-explorer, project-documents, Agent Guide: CD]
- **Tailscale Networking** -- used by [agent-pipeline-ide, kb-explorer, project-documents, POD/PSR: eisenhower_task_manager_POD.md, POD/PSR: eisenhower_task_manager_PSR.md, Memory: MEMORY.md, Agent Guide: CE]
- **WebSockets** -- used by [fractured-universe, kb-explorer, project-documents, POD/PSR: fractured_universe_PSR.md, POD/PSR: spectrum_dashboard_POD.md, POD/PSR: spectrum_dashboard_PSR.md]
- **Sharp Image Processing** -- used by [agent-world, kb-explorer, market-analytics-dashboard, Agent Guide: CD, Agent Guide: SA]
- **Chart.js** -- used by [eisenhower-task-manager, kb-explorer, project-documents, POD/PSR: ecdo_watch_POD.md, POD/PSR: eisenhower_task_manager_PSR.md]
- **CodeMirror Editor** -- used by [agent-pipeline-ide, kb-explorer, Memory: MEMORY.md, Agent Guide: CE]
- **Quarto Document System** -- used by [agent-pipeline-ide, dynamical-systems, kb-explorer, Memory: MEMORY.md]
- **CesiumJS 3D Globe** -- used by [.claude, kb-explorer, POD/PSR: ecdo_watch_PSR.md]
- **Tailwind CSS** -- used by [eisenhower-task-manager, kb-explorer, Memory: project_style_audit.md]
- **OpenAI API** -- used by [kb-explorer, market-analytics-dashboard]

### Weak (single source)

- **Socket.IO** -- found in [kb-explorer]
- **Sass/SCSS** -- found in [kb-explorer]
- **Webpack** -- found in [kb-explorer]
- **Jest Testing** -- found in [kb-explorer]
- **Puppeteer** -- found in [kb-explorer]
- **Highlight.js** -- found in [kb-explorer]
- **Prism.js Syntax Highlighting** -- found in [kb-explorer]
- **Leaflet Maps** -- found in [kb-explorer]

---

## Human Skill Gaps (not in HSK entries)

### Technology Skills

- **HSK-DEV-015:** Physics Simulation Development -- found in [Capacitor Dielectric Lab, Disk Cam Synthesis] -- not covered by existing HSK entries
- **HSK-DEV-016:** Interactive Web Application Design -- found in [Capacitor Dielectric Lab, ECDO Watch, Electrostatics Lab, SPECTRUM Market Analytics, Dynamical Systems Lab] -- not covered by existing HSK entries
- **HSK-DEV-017:** 3D Graphics & Rendering -- found in [ECDO Watch, Electrostatics Lab, Dynamical Systems Lab, Dynamic Control of an Aeropendulum, Disk Cam Synthesis] -- not covered by existing HSK entries
- **HSK-DEV-018:** Dashboard & Monitoring Design -- found in [ECDO Watch, SPECTRUM Market Analytics] -- not covered by existing HSK entries
- **HSK-DEV-019:** Data Visualization Design -- found in [Electrostatics Lab, SPECTRUM Market Analytics, Dynamical Systems Lab] -- not covered by existing HSK entries

### Domain Knowledge Gaps (not in claims/DAs)

#### Strong (multiple sources)

- **Dynamical Systems** -- found in [.claude, cash-bubble, dynamical-systems, kb-explorer, project-documents, projects.json: Thermofluidic Finance, projects.json: On Dynamical Systems, projects.json: Dynamical Systems Lab, projects.json: Inferential Dynamics, POD/PSR: dynamical_systems_lab_POD.md, POD/PSR: dynamical_systems_lab_PSR.md, POD/PSR: dynamical_systems_sources_fields_POD.md, POD/PSR: dynamical_systems_sources_fields_PSR.md, POD/PSR: ecdo_watch_PSR.md, POD/PSR: propendulum_POD.md, POD/PSR: propendulum_PSR.md, Memory: dynamical_systems_review_2026-02-27.md, Memory: inferential_dynamics_review_2026-02-27.md, Memory: MEMORY.md, Memory: project_dsl_editorial_audit.md, Memory: project_style_audit.md, Agent Guide: CE] -- not covered by existing claims
- **Assessment Design** -- found in [agent-pipeline-ide, cash-bubble, dynamical-systems, eisenhower-task-manager, project-documents, POD/PSR: agent_world_PSR.md, POD/PSR: cash_bubble_PSR.md, POD/PSR: dynamical_systems_lab_PSR.md, POD/PSR: dynamical_systems_sources_fields_PSR.md, POD/PSR: ecdo_watch_PSR.md, POD/PSR: eisenhower_task_manager_PSR.md, POD/PSR: electrostatics_lab_PSR.md, POD/PSR: fractured_universe_PSR.md, POD/PSR: propendulum_PSR.md, POD/PSR: spectrum_dashboard_POD.md, POD/PSR: spectrum_dashboard_PSR.md, Agent Guide: CD, Agent Guide: PM, Agent Guide: RA, Agent Guide: TA] -- not covered by existing claims
- **Wave Physics** -- found in [.claude, agent-pipeline-ide, cash-bubble, dynamical-systems, kb-explorer, manims, market-analytics-dashboard, project-documents, projects.json: Capacitor Dielectric Lab, projects.json: Gravitational Wave Detector, POD/PSR: capacitor_dielectric_lab_POD.md, POD/PSR: dynamical_systems_lab_POD.md, POD/PSR: dynamical_systems_lab_PSR.md, Memory: feedback_chapter_notes_process.md, Memory: MEMORY.md, Agent Guide: TA] -- not covered by existing claims
- **Electrostatics** -- found in [agent-pipeline-ide, dynamical-systems, electrostatics-lab, kb-explorer, project-documents, projects.json: The Work-Energy Principle, projects.json: Electrostatics Lab, projects.json: On Physical Analogies, POD/PSR: capacitor_dielectric_lab_POD.md, POD/PSR: electrostatics_lab_POD.md, POD/PSR: electrostatics_lab_PSR.md, Memory: project_style_audit.md, Agent Guide: CD, Agent Guide: CE, Agent Guide: PM, Agent Guide: TA] -- not covered by existing claims
- **Thermofluidic Finance** -- found in [agent-pipeline-ide, cash-bubble, kb-explorer, market-analytics-dashboard, project-documents, projects.json: Thermofluidic Finance, POD/PSR: cash_bubble_POD.md, POD/PSR: cash_bubble_PSR.md, POD/PSR: dynamical_systems_sources_fields_POD.md, POD/PSR: dynamical_systems_sources_fields_PSR.md, POD/PSR: spectrum_dashboard_POD.md, POD/PSR: spectrum_dashboard_PSR.md, Memory: MEMORY.md, Memory: project_dsl_editorial_audit.md, Memory: project_style_audit.md, Agent Guide: PM] -- not covered by existing claims
- **Circuit Analysis** -- found in [agent-pipeline-ide, agent-world, electrostatics-lab, project-documents, projects.json: Capacitor Dielectric Lab, projects.json: On Dynamical Systems, POD/PSR: agent_pipeline_ide_POD.md, POD/PSR: capacitor_dielectric_lab_POD.md, POD/PSR: propendulum_POD.md, POD/PSR: propendulum_PSR.md, Memory: dynamical_systems_review_2026-02-27.md, Memory: feedback_circuit_figures.md, Memory: MEMORY.md, Agent Guide: TA] -- not covered by existing claims
- **Game Development** -- found in [agent-world, electrostatics-lab, fractured-universe, market-analytics-dashboard, project-documents, POD/PSR: agent_world_POD.md, POD/PSR: agent_world_PSR.md, POD/PSR: dynamical_systems_sources_fields_PSR.md, POD/PSR: fractured_universe_POD.md, POD/PSR: fractured_universe_PSR.md, Memory: MEMORY.md, Agent Guide: CE, Agent Guide: PM] -- not covered by existing claims
- **Physics Simulation** -- found in [cash-bubble, electrostatics-lab, kb-explorer, project-documents, projects.json: Capacitor Dielectric Lab, projects.json: Disk Cam Synthesis, POD/PSR: capacitor_dielectric_lab_POD.md, POD/PSR: cash_bubble_POD.md, POD/PSR: dynamical_systems_lab_POD.md, Agent Guide: CE, Agent Guide: PM, Agent Guide: RA, Agent Guide: SA] -- not covered by existing claims
- **ECDO Theory** -- found in [.claude, agent-pipeline-ide, ecdo-watch, electrostatics-lab, kb-explorer, project-documents, projects.json: ECDO Watch, POD/PSR: ecdo_watch_POD.md, POD/PSR: ecdo_watch_PSR.md, Memory: project_style_audit.md, Agent Guide: CE, Agent Guide: PM] -- not covered by existing claims
- **Capacitance** -- found in [agent-pipeline-ide, electrostatics-lab, kb-explorer, project-documents, projects.json: Capacitor Dielectric Lab, projects.json: Fundamental Principles - On Analogies (continued), POD/PSR: capacitor_dielectric_lab_POD.md, POD/PSR: electrostatics_lab_PSR.md, Memory: feedback_chapter_notes_process.md, Memory: feedback_circuit_figures.md, Memory: MEMORY.md, Memory: project_style_audit.md] -- not covered by existing claims
- **Gravitational Physics** -- found in [agent-pipeline-ide, dynamical-systems, kb-explorer, project-documents, projects.json: The Work-Energy Principle, projects.json: ECDO Watch, projects.json: Two-Body Gravitational Free Fall, projects.json: On Physical Analogies, projects.json: Gravitational Radiation, projects.json: Gravitational Wave Detector, POD/PSR: ecdo_watch_POD.md, POD/PSR: ecdo_watch_PSR.md] -- not covered by existing claims
- **Magnetism** -- found in [agent-pipeline-ide, ecdo-watch, project-documents, projects.json: Dynamic Control of an Aeropendulum, POD/PSR: ecdo_watch_POD.md, POD/PSR: ecdo_watch_PSR.md, POD/PSR: propendulum_POD.md, POD/PSR: propendulum_PSR.md, Memory: MEMORY.md, Agent Guide: TA] -- not covered by existing claims
- **IPC Communication** -- found in [agent-pipeline-ide, agent-world, kb-explorer, project-documents, POD/PSR: agent_pipeline_ide_build_plan.md, POD/PSR: agent_pipeline_ide_POD.md, POD/PSR: agent_world_POD.md, POD/PSR: agent_world_PSR.md, Memory: MEMORY.md, Memory: project_page_builder_pipeline.md] -- not covered by existing claims
- **PSCPR Framework** -- found in [agent-pipeline-ide, kb-explorer, projects.json: Problem-Solving and Critical Path Reasoning, Agent Guide: CD, Agent Guide: CE, Agent Guide: PM, Agent Guide: RA, Agent Guide: SA, Agent Guide: TA] -- not covered by existing claims
- **Thermodynamics** -- found in [agent-pipeline-ide, cash-bubble, project-documents, projects.json: Thermofluidic Finance, projects.json: Fundamental Principles - On Analogies (continued), projects.json: On Physical Analogies, POD/PSR: cash_bubble_POD.md, POD/PSR: cash_bubble_PSR.md, Agent Guide: TA] -- not covered by existing claims
- **Pedagogy** -- found in [agent-pipeline-ide, agent-world, kb-explorer, manims, POD/PSR: dynamical_systems_sources_fields_PSR.md, Agent Guide: CD, Agent Guide: PM, Agent Guide: RA, Agent Guide: TA] -- not covered by existing claims
- **PID Control** -- found in [agent-pipeline-ide, cash-bubble, dynamical-systems, project-documents, projects.json: Dynamic Control of an Aeropendulum, POD/PSR: propendulum_POD.md, POD/PSR: propendulum_PSR.md, Memory: dynamical_systems_review_2026-02-27.md, Agent Guide: PM] -- not covered by existing claims
- **Pendulum Mechanics** -- found in [dynamical-systems, kb-explorer, manims, project-documents, projects.json: Dynamical Systems Lab, projects.json: Dynamic Control of an Aeropendulum, projects.json: Rebound Pendulum, POD/PSR: propendulum_POD.md, POD/PSR: propendulum_PSR.md] -- not covered by existing claims
- **DAG/Pipeline Architecture** -- found in [agent-pipeline-ide, ecdo-watch, project-documents, POD/PSR: agent_pipeline_ide_build_plan.md, POD/PSR: agent_pipeline_ide_POD.md, Memory: MEMORY.md, Memory: project_workbench_vision.md, Agent Guide: PM] -- not covered by existing claims
- **Attractor Theory** -- found in [agent-pipeline-ide, dynamical-systems, manims, project-documents, projects.json: Dynamical Systems Lab, projects.json: Inferential Dynamics, POD/PSR: dynamical_systems_lab_POD.md, Memory: inferential_dynamics_review_2026-02-27.md] -- not covered by existing claims
- **Maxwell's Equations** -- found in [agent-pipeline-ide, agent-world, dynamical-systems, projects.json: Inferential Dynamics, projects.json: Gravitational Radiation, Memory: inferential_dynamics_review_2026-02-27.md, Memory: MEMORY.md, Agent Guide: TA] -- not covered by existing claims
- **Numerical Methods (RK4)** -- found in [dynamical-systems, electrostatics-lab, project-documents, projects.json: Electrostatics Lab, POD/PSR: dynamical_systems_lab_POD.md, POD/PSR: dynamical_systems_lab_PSR.md, POD/PSR: electrostatics_lab_POD.md, Agent Guide: CE] -- not covered by existing claims
- **Inductive Reasoning** -- found in [agent-pipeline-ide, agent-world, project-documents, projects.json: Certainty, Inference, and Comprehension, POD/PSR: electrostatics_lab_POD.md, Memory: MEMORY.md, Agent Guide: RA] -- not covered by existing claims
- **Field Line Visualization** -- found in [agent-pipeline-ide, electrostatics-lab, manims, project-documents, projects.json: Electrostatics Lab, POD/PSR: electrostatics_lab_POD.md, POD/PSR: electrostatics_lab_PSR.md] -- not covered by existing claims
- **Proportional Reasoning** -- found in [agent-world, kb-explorer, project-documents, projects.json: Universe of Proportions, POD/PSR: agent_world_POD.md, POD/PSR: agent_world_PSR.md, Memory: MEMORY.md] -- not covered by existing claims
- **Bifurcation Theory** -- found in [dynamical-systems, project-documents, projects.json: Dynamical Systems Lab, POD/PSR: dynamical_systems_lab_POD.md, POD/PSR: dynamical_systems_lab_PSR.md, POD/PSR: dynamical_systems_sources_fields_POD.md, Memory: dynamical_systems_review_2026-02-27.md] -- not covered by existing claims
- **Market Analytics** -- found in [market-analytics-dashboard, project-documents, projects.json: SPECTRUM Market Analytics, POD/PSR: cash_bubble_POD.md, POD/PSR: spectrum_dashboard_POD.md, POD/PSR: spectrum_dashboard_PSR.md, Agent Guide: CE] -- not covered by existing claims
- **Resistance/Circuits** -- found in [agent-pipeline-ide, agent-world, electrostatics-lab, project-documents, POD/PSR: capacitor_dielectric_lab_POD.md, Memory: feedback_circuit_figures.md] -- not covered by existing claims
- **Mirror Optics** -- found in [agent-pipeline-ide, fractured-universe, project-documents, POD/PSR: propendulum_POD.md, POD/PSR: propendulum_PSR.md, Memory: project_workbench_reorg.md] -- not covered by existing claims
- **Work-Energy Theorem** -- found in [agent-pipeline-ide, project-documents, projects.json: The Work-Energy Principle, projects.json: Two-Body Gravitational Free Fall, POD/PSR: manims_POD.md, Memory: MEMORY.md] -- not covered by existing claims
- **Eigenvalue Analysis** -- found in [cash-bubble, dynamical-systems, project-documents, projects.json: Inferential Dynamics, POD/PSR: cash_bubble_PSR.md, Memory: inferential_dynamics_review_2026-02-27.md] -- not covered by existing claims
- **Conservation Laws** -- found in [cash-bubble, dynamical-systems, project-documents, projects.json: On Dynamical Systems, POD/PSR: cash_bubble_PSR.md, POD/PSR: dynamical_systems_sources_fields_POD.md] -- not covered by existing claims
- **Game Design** -- found in [fractured-universe, project-documents, POD/PSR: fractured_universe_POD.md, POD/PSR: fractured_universe_PSR.md, Memory: project_style_audit.md, Agent Guide: CE] -- not covered by existing claims
- **Curriculum Design** -- found in [agent-pipeline-ide, Memory: MEMORY.md, Agent Guide: RA, Agent Guide: SA, Agent Guide: TA] -- not covered by existing claims
- **Differential Equations** -- found in [agent-pipeline-ide, cash-bubble, dynamical-systems, project-documents, POD/PSR: capacitor_dielectric_lab_POD.md] -- not covered by existing claims
- **Fluid Mechanics** -- found in [cash-bubble, project-documents, POD/PSR: cash_bubble_POD.md, POD/PSR: cash_bubble_PSR.md, POD/PSR: dynamical_systems_sources_fields_PSR.md] -- not covered by existing claims
- **Earth Orientation** -- found in [ecdo-watch, project-documents, projects.json: ECDO Watch, POD/PSR: ecdo_watch_POD.md, POD/PSR: ecdo_watch_PSR.md] -- not covered by existing claims
- **Equipotential Surfaces** -- found in [electrostatics-lab, project-documents, projects.json: Electrostatics Lab, POD/PSR: electrostatics_lab_POD.md, POD/PSR: electrostatics_lab_PSR.md] -- not covered by existing claims
- **Impedance/AC Circuits** -- found in [project-documents, projects.json: On Dynamical Systems, POD/PSR: capacitor_dielectric_lab_POD.md, POD/PSR: dynamical_systems_sources_fields_POD.md, POD/PSR: dynamical_systems_sources_fields_PSR.md] -- not covered by existing claims
- **Electromagnetism** -- found in [agent-pipeline-ide, kb-explorer, manims, projects.json: Electrostatics Lab] -- not covered by existing claims
- **Abductive Reasoning** -- found in [agent-pipeline-ide, projects.json: Certainty, Inference, and Comprehension, Memory: inferential_dynamics_review_2026-02-27.md, Agent Guide: RA] -- not covered by existing claims
- **Chaos Theory** -- found in [dynamical-systems, project-documents, projects.json: Dynamical Systems Lab, POD/PSR: dynamical_systems_lab_POD.md] -- not covered by existing claims
- **Marching Cubes Algorithm** -- found in [electrostatics-lab, project-documents, projects.json: Electrostatics Lab, POD/PSR: electrostatics_lab_POD.md] -- not covered by existing claims
- **Isometric 3D** -- found in [project-documents, POD/PSR: agent_world_POD.md, POD/PSR: dynamical_systems_lab_POD.md, Memory: MEMORY.md] -- not covered by existing claims
- **Seismology Data** -- found in [project-documents, projects.json: ECDO Watch, POD/PSR: ecdo_watch_POD.md, POD/PSR: ecdo_watch_PSR.md] -- not covered by existing claims
- **Graph Algorithms** -- found in [agent-pipeline-ide, POD/PSR: agent_pipeline_ide_build_plan.md, Memory: MEMORY.md] -- not covered by existing claims
- **Progressive Web Apps** -- found in [agent-pipeline-ide, Memory: MEMORY.md, Agent Guide: CE] -- not covered by existing claims
- **Optics** -- found in [agent-pipeline-ide, Memory: MEMORY.md, Agent Guide: TA] -- not covered by existing claims
- **Deductive Reasoning** -- found in [agent-pipeline-ide, projects.json: Certainty, Inference, and Comprehension, Agent Guide: RA] -- not covered by existing claims
- **Diffraction** -- found in [agent-pipeline-ide, Memory: feedback_chapter_notes_process.md, Memory: MEMORY.md] -- not covered by existing claims
- **Lens Optics** -- found in [agent-pipeline-ide, Memory: feedback_chapter_notes_process.md, Agent Guide: TA] -- not covered by existing claims
- **Faraday's Law** -- found in [agent-pipeline-ide, electrostatics-lab, Agent Guide: TA] -- not covered by existing claims
- **Voxel/Low-poly Art** -- found in [agent-world, POD/PSR: agent_world_PSR.md, Memory: MEMORY.md] -- not covered by existing claims
- **Bond Graph Theory** -- found in [dynamical-systems, project-documents, POD/PSR: dynamical_systems_sources_fields_POD.md] -- not covered by existing claims
- **Control Systems** -- found in [dynamical-systems, projects.json: Dynamic Control of an Aeropendulum, POD/PSR: propendulum_PSR.md] -- not covered by existing claims
- **Lorenz Attractor** -- found in [project-documents, projects.json: Dynamical Systems Lab, POD/PSR: dynamical_systems_lab_POD.md] -- not covered by existing claims
- **Formal Logic** -- found in [agent-pipeline-ide, projects.json: Inferential Dynamics] -- not covered by existing claims
- **Population Modeling** -- found in [kb-explorer, projects.json: Nonlinear Human Population Growth Modeling] -- not covered by existing claims
- **Collision Physics** -- found in [kb-explorer, projects.json: Rebound Pendulum] -- not covered by existing claims
- **Cam Design** -- found in [projects.json: Disk Cam Synthesis, Agent Guide: CE] -- not covered by existing claims
- **CNC/G-code** -- found in [projects.json: Disk Cam Synthesis, Agent Guide: CE] -- not covered by existing claims

#### Weak (single source)

- **Ampere's Law** -- found in [agent-pipeline-ide] -- not covered by existing claims
- **Force-directed Graphs** -- found in [kb-explorer] -- not covered by existing claims
- **Logistic Growth** -- found in [projects.json: Nonlinear Human Population Growth Modeling] -- not covered by existing claims
- **Semiconductor Physics** -- found in [projects.json: Gravitational Wave Detector] -- not covered by existing claims
- **Snell's Law** -- found in [Memory: feedback_chapter_notes_process.md] -- not covered by existing claims

---

## AI Skill Gaps (not in SOP/SKL entries)

### Capabilities demonstrated but not in KB

- **CE:** Code Editor Integration -- evidence: [agent-pipeline-ide, kb-explorer] -- no matching SOP/SKL
- **CE:** WebSocket Real-time Communication -- evidence: [fractured-universe, kb-explorer, project-documents] -- no matching SOP/SKL
- **CE:** CesiumJS Globe/Geospatial Visualization -- evidence: [.claude, kb-explorer] -- no matching SOP/SKL
- **CE:** KaTeX Math Rendering Integration -- evidence: [agent-pipeline-ide, dynamical-systems, electrostatics-lab, kb-explorer, project-documents] -- no matching SOP/SKL
- **CE:** Quarto Document Compilation -- evidence: [agent-pipeline-ide, dynamical-systems, kb-explorer] -- no matching SOP/SKL
- **CE:** Express.js Server Development -- evidence: [agent-pipeline-ide, eisenhower-task-manager, kb-explorer, project-documents] -- no matching SOP/SKL
- **CE:** Manim Mathematical Animation -- evidence: [.claude, electrostatics-lab, kb-explorer, manims, project-documents] -- no matching SOP/SKL
- **CE:** Chart.js Visualization -- evidence: [eisenhower-task-manager, kb-explorer, project-documents] -- no matching SOP/SKL
- **CE:** Claude API Integration -- evidence: [.claude, agent-pipeline-ide, agent-world, cash-bubble, ecdo-watch, electrostatics-lab, kb-explorer, project-documents] -- no matching SOP/SKL
- **CE:** Anthropic SDK Usage -- evidence: [.claude, agent-pipeline-ide, agent-world, electrostatics-lab, kb-explorer, project-documents] -- no matching SOP/SKL
- **CE:** Tailscale Networking & Remote Access -- evidence: [agent-pipeline-ide, kb-explorer, project-documents] -- no matching SOP/SKL
- **CE:** Isosurface Rendering (Marching Cubes) -- evidence: [electrostatics-lab, project-documents] -- no matching SOP/SKL

### AI Domain Knowledge (from agent guides, not yet structured)

- **CD:** **Editorial voice:** The consistent personality, register, and perspective that characterizes all of the operation's public communication. Rigorously intellectual but accessible. Curious, not condescending. Precise, not pedantic. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CD:** **Debate scripting:** Constructing dialogues between historical thinkers that faithfully represent their actual positions while creating genuine intellectual tension. Not strawmen; not hagiography. The audience should leave *genuinely uncertain* about who was right. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CD:** **Content layering:** A single intellectual exchange (e.g., a Great Minds debate) generates multiple content outputs: full-length video, short-form clips, written article/newsletter, social media posts, and potential ebook chapters. The CD Agent plans for this extraction from the beginning. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CD:** **Brand identity:** The visual and verbal system that makes the operation recognizable. The name *peirastes* (one who tests) and the tagline ("Probing the fidelity of Nature and Reason") establish the foundation. Every public touchpoint reinforces this identity. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CD:** **Pedagogical voice vs. marketing voice vs. debate voice:** The operation uses different registers for different contexts, but all share the same philosophical DNA. Teaching is patient and builds from known to unknown. Marketing is direct and honest. Debates are adversarial but fair. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CD:** `Agents/AI_Agent_Philosophical_Debriefing.md` — reasoning principles (always loaded) — this is both the philosophical guide *and* the source of the operation's distinctive voice -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CD:** `Agents/CD Agent/CD_AGENT_GUIDE.md` — this document -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CD:** `Website/about.html` — author profile, research interests, and public positioning -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CD:** RA Agent research outputs — for factual accuracy in all content -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CD:** TA Agent style guides — for pedagogical voice consistency in educational content -- from guide section "2. Domain Knowledge" -- could be AKN entry
- *(2 more CD knowledge items omitted)*
- **CE:** **Component-driven architecture:** Build UIs from composable, reusable components. Prefer composition over inheritance. Each component owns its state and renders predictably. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CE:** **Physics simulation:** Numerical integration (RK4, Euler, Verlet), real-time rendering, parametric exploration, physical accuracy with performance trade-offs. Simulations must produce *falsifiable* outputs — results that can be checked against analytical solutions or limiting cases. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CE:** **Local AI infrastructure:** Running open-weight models locally via Ollama or LM Studio on dedicated hardware. Model selection balances capability against latency and memory. The AI tutoring platform depends on reliable local inference. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CE:** **API integration patterns:** RESTful services, webhook handling, rate limiting, graceful degradation. External APIs are unreliable by default — always implement fallbacks and staleness detection. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CE:** **Deployment pipeline:** Build → test → deploy. Static sites via GitHub Pages or similar. Applications via containerized deployment or platform hosting. Automate what repeats. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CE:** `Agents/AI_Agent_Philosophical_Debriefing.md` — reasoning principles (always loaded) -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CE:** `Agents/CE Agent/CE_AGENT_GUIDE.md` — this document -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CE:** `Agents/CE Agent/DIRECTIVES.md` — current work assignments and priorities (maintained by PM Agent) -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CE:** Project-specific `README.md`, `CLAUDE.md`, and `package.json` files — loaded per project -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **CE:** `Website/DEPLOYMENT-GUIDE.md` — website deployment procedures -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **PM:** **POD (Project Overview Document):** 1-2 page orientation snapshot answering "What is this and where does it stand?" Target audience: someone unfamiliar with the project who needs to understand it in 3 minutes. 400-800 words of content. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **PM:** **PSR (Project Status Report):** 4-10 page detailed assessment answering "What happened, what's working, what's not, and what's next?" Target audience: the project owner reviewing progress, problems, and plans. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **PM:** **Epistemic Position (PSR Section 7):** For research/scientific projects only — distinguishes established findings from hypotheses and open questions. Apply to: `cash_bubble`, `ecdo_watch`, `dynamical_systems_sources_fields`, `propendulum`. Skip for: `eisenhower_task_manager`, `fractured_universe`, `spectrum_dashboard`, `electrostatics_lab`, `dynamical_systems_lab`. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **PM:** **Portfolio Review:** Systematic survey of all projects to triage documentation freshness and project health. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **PM:** **Work Breakdown Structure (WBS):** Decomposition of a multi-agent objective into discrete, assignable tasks. Each task has an owning agent, inputs, outputs, acceptance criteria, and dependencies. Not every objective needs a formal WBS — simple tasks can be assigned directly. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **PM:** **Dependency Map:** Identification of which tasks must complete before others can start. Expressed as "Task B is blocked by Task A." Used to determine sequencing and identify the critical path. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **PM:** **Critical Path:** The longest chain of dependent tasks from start to completion. This chain determines the minimum timeline. Shortening the project means shortening the critical path — optimizing off-path tasks does not help. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **PM:** **Handoff Brief:** A structured package that accompanies work from one agent to the next. Contains: what was done, what's needed next, acceptance criteria, context the receiving agent needs, and any open questions. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **PM:** **DIRECTIVES.md:** Per-agent file in each agent's folder (`Agents/XX Agent/DIRECTIVES.md`). Contains active work items, standing orders, completed items, and blockers. This is the primary coordination artifact — the shared ledger of who owes what to whom. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **PM:** **Workflow Playbook:** A pre-defined sequence of agent tasks for a recurring deliverable type (e.g., "publish a debate video" or "release an ebook"). Playbooks encode learned dependencies so coordination doesn't restart from scratch each time. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- *(7 more PM knowledge items omitted)*
- **RA:** **Market research:** Demand validation, competitive analysis, pricing strategy, total addressable market (TAM). Distinguish between top-down estimates (unreliable) and bottom-up evidence (from actual comparable products and sales data). -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **RA:** **Literature review:** Systematic identification, evaluation, and synthesis of existing published work. Not a reading list — a critical analysis of the field's state, gaps, and tensions. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **RA:** **Field test design:** Experimental methodology for evaluating educational interventions. Control groups, sample size, measurable outcomes, pre/post assessment, confounding variables, IRB/consent considerations. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **RA:** **Epistemic classification:** Categorizing claims by evidential strength — established (deductive/strong inductive), hypothesized (abductive/weak inductive), speculative (no evidence, plausible story), and unknown (not yet investigated). -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **RA:** **Competitive landscape analysis:** Identifying direct and indirect competitors, evaluating their offerings, pricing, strengths, and weaknesses. Focus on *capability* comparison, not feature lists. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **RA:** **Source reliability hierarchy:** Primary sources (original data, direct observation) > secondary sources (peer-reviewed analysis) > tertiary sources (summaries, textbooks) > claims without methodology (marketing, self-reported metrics). -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **RA:** `Agents/AI_Agent_Philosophical_Debriefing.md` — reasoning principles (always loaded) -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **RA:** `Agents/RA Agent/RA_AGENT_GUIDE.md` — this document -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **RA:** `Website/projects/project-documents/` — existing PODs and PSRs for project context -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **RA:** `Website/about.html` — author profile, research interests, and disciplinary focus -- from guide section "2. Domain Knowledge" -- could be AKN entry
- *(5 more RA knowledge items omitted)*
- **SA:** **SEO (Search Engine Optimization):** Technical and content practices that help search engines understand and surface content. Covers metadata, keyword strategy, site structure, load speed, and mobile responsiveness. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **SA:** **Content distribution:** The strategy for getting published content in front of the right audience across multiple channels (YouTube, Substack, social media, storefronts). -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **SA:** **Conversion funnel:** The path from discovery (visitor finds the content) → engagement (visitor consumes content) → conversion (visitor makes a purchase or subscribes). Each stage has measurable drop-off. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **SA:** **Platform-specific optimization:** Each platform has its own algorithm, metadata requirements, and best practices. YouTube rewards watch time; Amazon KDP rewards reviews and sales velocity; Substack rewards subscriber engagement. -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **SA:** **Analytics interpretation:** Distinguishing between vanity metrics (page views, follower counts) and actionable metrics (conversion rates, revenue per product, subscriber retention, course completion). -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **SA:** `Agents/AI_Agent_Philosophical_Debriefing.md` — reasoning principles (always loaded) -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **SA:** `Agents/SA Agent/SA_AGENT_GUIDE.md` — this document -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **SA:** `Website/DEPLOYMENT-GUIDE.md` — peirastes.com deployment procedures -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **SA:** `Website/projects.json` — master project inventory for website listings -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **SA:** `Website/index.html`, `Website/about.html` — current site structure and content -- from guide section "2. Domain Knowledge" -- could be AKN entry
- *(2 more SA knowledge items omitted)*
- **TA:** Vector algebra and calculus (gradient, divergence, curl, line/surface/volume integrals) -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **TA:** Dimensional analysis and unit verification -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **TA:** Limiting case analysis -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **TA:** Superposition and symmetry reasoning -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **TA:** Order-of-magnitude estimation -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **TA:** Bloom's taxonomy for assessment design -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **TA:** **Mechanics:** Kinematics, Newton's Laws, energy, momentum, rotational dynamics, oscillations, waves -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **TA:** **Electromagnetism:** Electrostatics, Gauss's Law, circuits, magnetism, Faraday's Law, Maxwell's equations, optics -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **TA:** **Thermodynamics:** Laws of thermodynamics, heat transfer, entropy, statistical mechanics -- from guide section "2. Domain Knowledge" -- could be AKN entry
- **TA:** **Modern Physics:** Relativity, quantum mechanics, atomic/nuclear physics -- from guide section "2. Domain Knowledge" -- could be AKN entry
- *(4 more TA knowledge items omitted)*

---

## Cross-Reference Matrix

Projects mapped to existing KB entries and gaps.

| Project | Covered Tools | Uncovered Tech | Covered Domains | Uncovered Domains |
|---------|---------------|----------------|-----------------|-------------------|
| The Work-Energy Principle | -- | -- | -- | -- |
| Capacitor Dielectric Lab | -- | -- | -- | -- |
| ECDO Watch | TOOL-001 (React); TOOL-003 (Python); TOOL-006 (THREE.js / 3D Rendering) | Claude API | -- | Magnetism; ECDO Theory; Earth Orientation; DAG/Pipeline Architecture |
| Thermofluidic Finance | TOOL-006 (THREE.js / 3D Rendering); TOOL-001 (React) | Claude API | -- | Eigenvalue Analysis; Conservation Laws; Physics Simulation; Thermofluidic Finance; Thermodynamics; Assessment Design; Dynamical Systems; Fluid Mechanics; PID Control; Wave Physics; Differential Equations |
| On Dynamical Systems | TOOL-001 (React); TOOL-006 (THREE.js / 3D Rendering); TOOL-003 (NumPy); TOOL-003 (Matplotlib); TOOL-003 (Python); TOOL-001 (JavaScript); TOOL-008 (Pandoc) | KaTeX Math Rendering; Quarto Document System; Marked (Markdown Parser) | -- | Pendulum Mechanics; Wave Physics; Dynamical Systems; Numerical Methods (RK4); Assessment Design; Bifurcation Theory; Chaos Theory; Electrostatics; Gravitational Physics; Conservation Laws; Maxwell's Equations; Differential Equations; Attractor Theory; Eigenvalue Analysis; Bond Graph Theory; Control Systems; PID Control |
| Electrostatics Lab | TOOL-006 (THREE.js / 3D Rendering); TOOL-001 (React); TOOL-010 (Vite Build System); TOOL-001 (TypeScript); TOOL-008 (LaTeX); TOOL-008 (Pandoc); TOOL-003 (Python); TOOL-001 (JavaScript) | KaTeX Math Rendering; Manim Animation; Claude API; Anthropic SDK | -- | Electrostatics; Numerical Methods (RK4); Capacitance; Marching Cubes Algorithm; Equipotential Surfaces; Field Line Visualization; Faraday's Law; ECDO Theory; Circuit Analysis; Physics Simulation; Game Development; Resistance/Circuits |
| SPECTRUM Market Analytics | TOOL-001 (React); TOOL-010 (Vite Build System); TOOL-003 (Python); TOOL-011 (D3.js Data Visualization) | OpenAI API; Sharp Image Processing | -- | Market Analytics; Wave Physics; Thermofluidic Finance; Game Development |
| Eisenhower Task Manager | TOOL-010 (Vite Build System); TOOL-001 (React) | Marked (Markdown Parser); Express.js Server; Tailwind CSS; Chart.js | -- | Assessment Design |
| Dynamical Systems Lab | TOOL-001 (React); TOOL-006 (THREE.js / 3D Rendering); TOOL-003 (NumPy); TOOL-003 (Matplotlib); TOOL-003 (Python); TOOL-001 (JavaScript); TOOL-008 (Pandoc) | KaTeX Math Rendering; Quarto Document System; Marked (Markdown Parser) | -- | Pendulum Mechanics; Wave Physics; Dynamical Systems; Numerical Methods (RK4); Assessment Design; Bifurcation Theory; Chaos Theory; Electrostatics; Gravitational Physics; Conservation Laws; Maxwell's Equations; Differential Equations; Attractor Theory; Eigenvalue Analysis; Bond Graph Theory; Control Systems; PID Control |
| Two-Body Gravitational Free Fall | -- | -- | -- | -- |
| Problem-Solving and Critical Path Reasoning | -- | -- | -- | -- |
| Inferential Dynamics | -- | -- | -- | -- |
| Dynamic Control of an Aeropendulum | -- | -- | -- | -- |
| Rebound Pendulum | -- | -- | -- | -- |
| Certainty, Inference, and Comprehension | -- | -- | -- | -- |
| Horizontal Frame Centering Algorithm | -- | -- | -- | -- |
| Universe of Proportions | -- | -- | -- | -- |
| Fundamental Principles - On Analogies (continued) | -- | -- | -- | -- |
| On Physical Analogies | -- | -- | -- | -- |
| Gravitational Radiation | -- | -- | -- | -- |
| Disk Cam Synthesis | -- | -- | -- | -- |
| Nonlinear Human Population Growth Modeling | -- | -- | -- | -- |
| Gravitational Wave Detector | -- | -- | -- | -- |

---

## Appendix: Existing KB Nodes

### First Principles (FP)
- FP-001: Skepticism Is Suspension, Not Cynicism
- FP-002: Challenge Narrative, Not Novelty
- FP-003: Ignorance Is a Verb
- FP-004: Not Wrong ≠ Correct
- FP-005: The Null Hypothesis Discipline
- FP-006: The Epistemic Journey (Certainty → Uncertainty → Exploration)
- FP-007: The Four Stages of Reasoning (PSCPR)
- FP-008: The Three Modes of Inference
- FP-009: Truth as a Stable Attractor
- FP-010: The Epistemological Posture
- FP-011: The Art of the Question
- FP-012: Informative Error Over Hollow Correctness
- FP-013: The Tree of Knowledge Obfuscation
- FP-014: Information Reliability Over Probative Value
- FP-015: The Selected Axioms of The Ethical Skeptic
- FP-016: The Ultimate Test

### Domain Axioms (DA)
- DA-DSL-001: The Treatise's Novelty Is Unification, Not Individual Theorems
- DA-DSL-002: Known Results Repositioned Within the Framework Are Still Valuable
- DA-ECDO-001: The Np' Hypothesis Is Testable
- DA-ECDO-002: Mainstream Archaeoastronomy Is the Null
- DA-ECDO-003: Measurement Precedes Interpretation
- DA-EPI-001: The TES Corpus Is an Operational Epistemology
- DA-EPI-002: The Scientific Method Is the Pipeline, Not the Destination
- DA-PED-001: PSCPR Is Both Reasoning Framework and Assessment Tool
- DA-PED-002: Questions Over Answers
- DA-TF-001: Household-Level Thermodynamic Modeling Is an Unoccupied Niche
- DA-TF-002: The First Law Decomposition Is Assumption-Free
- DA-TF-003: Lot-Level Buoyancy Is Genuinely Novel

### Domain Claims
- ARCH-001: Monument Orientation Data Require Documented Intentional Astronomical Alignment (archaeoastronomy.md)
- ARCH-002: Mainstream Explanations Must Be Exhausted Before Invoking Np' (archaeoastronomy.md)
- ARCH-003: Monument Bearing Measurement Requires Standardized Precision Criteria (archaeoastronomy.md)
- ARCH-004: The 147-Monument Dataset Is a Preliminary Sample, Not a Final Corpus (archaeoastronomy.md)
- ARCH-005: Statistical Clustering in Monument Bearings Must Be Tested Against Random Distribution (archaeoastronomy.md)
- ARCH-006: Archaeoastronomical Source Reliability Varies by Study Type (archaeoastronomy.md)
- DSL-001: The Treatise's Genuine Novelty Is the Unifying Framework, Not Individual Theorems (dynamical_systems.md)
- DSL-002: Known Results Repositioned Within the Framework Are Still Valuable (dynamical_systems.md)
- DSL-003: The R/D Decomposition Is the Framework's Core Structural Contribution (dynamical_systems.md)
- DSL-004: The Failure Analysis Contribution Is an Applied Novelty (dynamical_systems.md)
- DSL-005: The Treatise Parallels the Thermofluidic Paper in Novelty Structure (dynamical_systems.md)
- ECDO-001: The ECDO Hypothesis Is a Testable Scientific Hypothesis (ecdo_theory.md)
- ECDO-002: Mainstream Archaeoastronomy Constitutes the Null Hypothesis (ecdo_theory.md)
- ECDO-003: Measurement Precedes Interpretation in Monument Analysis (ecdo_theory.md)
- ECDO-004: The 104° SAC-LLVP Alignment Is an Empirically Grounded Prediction (ecdo_theory.md)
- ECDO-005: Exothermic Core Activity Is a Supplementary Driver of Climate Change (ecdo_theory.md)
- ECDO-006: The Khufu Pyramid Encodes Geophysical Information (ecdo_theory.md)
- EPI-001: The TES Corpus Constitutes a Coherent Operational Epistemology (epistemology_and_method.md)
- EPI-002: The Scientific Method Is the Operational Pipeline, Not an Identity (epistemology_and_method.md)
- EPI-003: Inference Mode Hierarchy Determines Claim Strength (epistemology_and_method.md)
- EPI-004: Consilience Over Precision as the Path to Certainty (epistemology_and_method.md)
- EPI-005: The TOKO Taxonomy Is Operationally Sufficient for Detecting Obfuscation (epistemology_and_method.md)
- EPI-006: Expert Type Determines Evidence Quality Assessment (epistemology_and_method.md)
- EPI-007: Information Always Carries Intent — Messenger Disposition Is Irrelevant (epistemology_and_method.md)
- EPI-008: The Omega Hypothesis Is the Terminal Pathology of Pseudoscience (epistemology_and_method.md)
- EPI-009: Corber's Burden Makes Universal Debunking Epistemologically Untenable (epistemology_and_method.md)
- PED-001: PSCPR Is Both a Reasoning Framework and an Assessment Tool (pedagogy_and_assessment.md)
- PED-002: Questions Over Answers as Assessment Philosophy (pedagogy_and_assessment.md)
- PED-003: The Socratic Method Maps to PSCPR Scaffolding (pedagogy_and_assessment.md)
- PED-004: T1/T2/T3 Expert Types Map to Student Development Stages (pedagogy_and_assessment.md)
- PED-005: AI Async Tutoring Extends the Socratic Method Beyond Classroom Hours (pedagogy_and_assessment.md)
- TF-001: Household-Level Thermodynamic Modeling Is an Unoccupied Niche (thermofluidic_finance.md)
- TF-002: The First Law Decomposition (dU = n dP + P dn) Is Exact and Assumption-Free (thermofluidic_finance.md)
- TF-003: Lot-Level Buoyancy Is a Genuinely Novel Applied Contribution (thermofluidic_finance.md)
- TF-004: The Unifying Framework's Novelty Is the Integration, Not Individual Components (thermofluidic_finance.md)

### Human Skills (HSK)
- HSK-BIZ-001: Product Development & Strategy
- HSK-BIZ-002: Multi-Agent System Orchestration
- HSK-DEV-001: Full-Stack Web Development
- HSK-DEV-002: Python Scientific Computing
- HSK-DEV-003: AI/LLM Application Design
- HSK-ENG-001: Mechanical Engineering Design
- HSK-ENG-002: Embedded Systems & Instrumentation
- HSK-PED-001: PSCPR-Based Assessment Design
- HSK-PED-002: AI Tutoring System Design
- HSK-PHYS-001: Undergraduate Physics Instruction
- HSK-PHYS-002: Physics Problem & Exam Design
- HSK-PHYS-003: Course Material Development
- HSK-RES-001: Academic Research & Writing
- HSK-RES-002: Epistemological Framework Application

### Agent SOPs
- SOP-CD-001: Write a Great Minds Debate Script
- SOP-CD-002: Draft Ebook or Digital Guide
- SOP-CD-003: Write the Pedagogy Book
- SOP-CD-004: Script Mini-Course Lessons
- SOP-CD-005: Develop Marketing Copy
- SOP-CD-006: Maintain Brand Voice Guidelines
- SOP-CE-001: Build or Extend an Application
- SOP-CE-002: Build a Physics Simulation
- SOP-CE-003: Manage Local AI Infrastructure
- SOP-CE-004: Technical Integration
- SOP-CE-005: Support TA Agent Pipeline
- SOP-PM-001: Generate a Project Overview Document (POD)
- SOP-PM-002: Generate a Project Status Report (PSR)
- SOP-PM-003: Update Existing Documents
- SOP-PM-004: Full Portfolio Review
- SOP-PM-005: Decompose and Delegate Multi-Agent Objective
- SOP-PM-006: Manage Cross-Agent Handoff
- SOP-PM-007: Conduct Priority Triage
- SOP-RA-001: Market Research
- SOP-RA-002: Literature Review
- SOP-RA-003: Philosophical Accuracy Verification
- SOP-RA-004: Field Test Design
- SOP-RA-005: Competitor and Landscape Analysis
- SOP-RA-006: Knowledge Base Maintenance
- SOP-SA-001: Publish Content to YouTube
- SOP-SA-002: Configure a Storefront Listing
- SOP-SA-003: Website Update
- SOP-SA-004: Monitor and Report Analytics
- SOP-SA-005: SEO Audit and Optimization
- SOP-TA-001: Generate a Lecture Note Chapter
- SOP-TA-002: Generate Figures for Existing Chapter
- SOP-TA-003: Generate a Drill Worksheet
- SOP-TA-004: Generate a Homework Assignment
- SOP-TA-005: Generate an Exam
- SOP-TA-006: Review and Edit Existing Materials
- SOP-TA-007: Onboard a New Course

### Agent Skills (SKL)
- SKL-CD-001: Long-Form Argumentation
- SKL-CD-002: Philosophical Voice Reproduction
- SKL-CD-003: Debate Structure & Escalation
- SKL-CD-004: Audience-Adapted Writing
- SKL-CD-005: Pedagogical Content Design
- SKL-CD-006: Brand Voice Architecture
- SKL-CE-001: React Component Architecture
- SKL-CE-002: API Integration Patterns
- SKL-CE-003: Version Control & CI/CD
- SKL-CE-004: Numerical Methods & Simulation
- SKL-CE-005: Scientific Visualization
- SKL-CE-006: Local AI Infrastructure
- SKL-CE-007: Electron Application Development
- SKL-CE-008: D3.js Data Visualization
- SKL-PM-001: Project State Assessment
- SKL-PM-002: Technical Documentation
- SKL-PM-003: Priority Analysis
- SKL-PM-004: Multi-Agent Orchestration
- SKL-PM-005: Acceptance Criteria Design
- SKL-RA-001: Source Reliability Assessment
- SKL-RA-002: TES Obfuscation Filter
- SKL-RA-003: Market Analysis
- SKL-RA-004: Academic Research Methods
- SKL-RA-005: Philosophical Analysis
- SKL-RA-006: Experimental Design
- SKL-SA-001: Web Publishing
- SKL-SA-002: SEO & Analytics
- SKL-SA-003: Storefront Configuration
- SKL-SA-004: Payment Integration Management
- SKL-SA-005: Responsive Web Design
- SKL-SA-006: Platform Analytics
- SKL-TA-001: Physics Content Expertise
- SKL-TA-002: Pedagogical Voice
- SKL-TA-003: Scientific Figure Creation
- SKL-TA-004: Document Pipeline Management
- SKL-TA-005: Assessment Design
- SKL-TA-006: Quality Review

### Tools (TOOL)
- TOOL-001: JavaScript/TypeScript
- TOOL-002: React
- TOOL-003: Python
- TOOL-004: Node.js
- TOOL-005: Git / GitHub
- TOOL-006: Three.js / WebGL
- TOOL-007: Ollama / LM Studio
- TOOL-008: Pandoc
- TOOL-009: pdflatex / LaTeX
- TOOL-010: Electron + Vite
- TOOL-011: D3.js
- TOOL-012: YouTube / Analytics Platforms
- TOOL-013: Storefront Platforms
- TOOL-014: GitHub Pages
- TOOL-015: Stripe
- TOOL-016: Matplotlib / pseii_figures.py
- TOOL-017: post_process_header.py
- TOOL-018: Arduino / PlatformIO

---

## Appendix: Scanned Sources

### Project Directories Scanned
- **.claude**: 5 tech, 3 domain mentions
- **agent-pipeline-ide**: 18 tech, 35 domain mentions (package.json: 22 deps)
- **agent-world**: 8 tech, 10 domain mentions (package.json: 8 deps)
- **cash-bubble**: 3 tech, 11 domain mentions
- **dynamical-systems**: 10 tech, 17 domain mentions
- **ecdo-watch**: 4 tech, 4 domain mentions
- **eisenhower-task-manager**: 6 tech, 1 domain mentions
- **electrostatics-lab**: 12 tech, 12 domain mentions (package.json: 13 deps)
- **fractured-universe**: 5 tech, 3 domain mentions (package.json: 6 deps)
- **kb-explorer**: 41 tech, 19 domain mentions (package.json: 5 deps)
- **manims**: 5 tech, 6 domain mentions
- **market-analytics-dashboard**: 6 tech, 4 domain mentions (package.json: 7 deps)
- **problem-solving-cpr**: 0 tech, 0 domain mentions
- **project-documents**: 19 tech, 42 domain mentions
- **propendulum**: 0 tech, 0 domain mentions
- **thrust-vectored-drone**: 0 tech, 0 domain mentions

### Documents Found
- qmd/on-analogies-of-dynamical-systems.qmd (.qmd)
- qmd/problem-solving-cpr.qmd (.qmd)
- qmd/two-body-problem.qmd (.qmd)
- qmd/work-energy-principle (1).qmd (.qmd)
- qmd/work-energy-principle.qmd (.qmd)
- dynamic-documents/Certainty, Inference, and Comprehension_v1.pptx (.pptx)
- dynamic-documents/Challenging Climate Sin.docx (.docx)
- dynamic-documents/GravRadDef_v7.pptx (.pptx)
- dynamic-documents/Hypothesis, Deduction, Proof, and Prosecution.docx (.docx)
- dynamic-documents/Inferential Dynamics_v1.pptx (.pptx)
- dynamic-documents/NCUR 2018 Presentation - NLHPGM.pptx (.pptx)
- dynamic-documents/OAS Presentation - Nonlinear Human Population Growth Modeling - Upper Bias.pptx (.pptx)
- dynamic-documents/On The Shoulders of Giants.docx (.docx)
- dynamic-documents/Peirastikon Draft.docx (.docx)
- dynamic-documents/Peirastikon Outline v1.0.docx (.docx)
- dynamic-documents/Phrases and Quotes_v4.docx (.docx)
- dynamic-documents/Problem-Solving.docx (.docx)
- dynamic-documents/Rebound Pendulum v3.pptx (.pptx)
- dynamic-documents/Series and Parallel Spring Proof.docx (.docx)
- dynamic-documents/Work-Energy Principle.docx (.docx)
- dynamic-documents/Work-Energy_Principle_Edits.md (.md)

### Lecture Chapters
- Chapter 22: PSEII_Notes_Chapter_22.md
- Chapter 23: 
- Chapter 24: 
- Chapter 25: Ch25_Lecture_Reference_Notes.md, PSEII_Notes_Chapter_25.md, PSEII_Notes_Chapter_25_v2.md
- Chapter 26: Ch26_Lecture_Reference_Notes.md, PSEII_Notes_Chapter_26.md
- Chapter 27: PSEII_Notes_Chapter_27.md
- Chapter 30: PSEII_Notes_Chapter_30.md
- Chapter 31: PSEII_Notes_Chapter_31.md

### Project Documents (PODs/PSRs)
- agent_pipeline_ide_build_plan.md (other)
- agent_pipeline_ide_POD.md (POD)
- agent_world_POD.md (POD)
- agent_world_PSR.md (PSR)
- capacitor_dielectric_lab_POD.md (POD)
- cash_bubble_POD.md (POD)
- cash_bubble_PSR.md (PSR)
- dynamical_systems_lab_POD.md (POD)
- dynamical_systems_lab_PSR.md (PSR)
- dynamical_systems_sources_fields_POD.md (POD)
- dynamical_systems_sources_fields_PSR.md (PSR)
- ecdo_watch_POD.md (POD)
- ecdo_watch_PSR.md (PSR)
- eisenhower_task_manager_POD.md (POD)
- eisenhower_task_manager_PSR.md (PSR)
- electrostatics_lab_POD.md (POD)
- electrostatics_lab_PSR.md (PSR)
- fractured_universe_POD.md (POD)
- fractured_universe_PSR.md (PSR)
- manims_POD.md (POD)
- propendulum_POD.md (POD)
- propendulum_PSR.md (PSR)
- spectrum_dashboard_POD.md (POD)
- spectrum_dashboard_PSR.md (PSR)

