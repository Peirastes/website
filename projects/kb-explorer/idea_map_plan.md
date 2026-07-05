# Idea Map Plan — peirastes.com

> **Document Type:** Project Plan
> **Author:** PM Agent
> **Date:** 2026-03-11
> **Status:** Draft — Awaiting Human Review

---

## Objective

Build an interactive, Obsidian-style knowledge graph for peirastes.com that visualizes the connections between projects, themes, and ideas — making the intellectual topology of the site navigable and discoverable.

**What "done" looks like:** A new page on peirastes.com where visitors see a force-directed graph of interconnected nodes. Clicking a node navigates to that project or concept. The graph reveals the thematic structure that currently exists only implicitly.

---

## 1. Why This Matters

The website has 21 visible projects spanning physics, engineering, natural philosophy, finance, and mathematics. The existing navigation (homepage list, archive sidebar, tag filters) is **linear** — it answers "what's here?" but not "how does it connect?" An idea map answers the second question and surfaces the intellectual coherence that is the site's real value proposition.

---

## 2. Data Architecture

### Current State

`projects.json` has titles, descriptions, tags, categories, and dates — but **no explicit connections between projects**. Tags provide weak implicit links (two projects tagged "Physics" aren't necessarily related).

### Proposed: Extend `projects.json`

Add a `connections` array to each project entry:

```json
{
  "id": "project20",
  "title": "On Dynamical Systems",
  "connections": [
    { "target": "project14", "type": "extends", "label": "Interactive companion" },
    { "target": "project16", "type": "applies", "label": "Finance as dynamical system" },
    { "target": "project12", "type": "extends", "label": "Logic as stability" }
  ]
}
```

**Rationale:** `projects.json` is already the single source of truth. Adding connections keeps it that way. A separate `graph.json` would create a consistency maintenance burden.

### Alternative: Separate `graph.json`

A standalone file defining nodes and edges. More flexible, but splits the source of truth. Not recommended unless the schema extension proves unwieldy.

### Node Types

The graph should show **concepts**, not just projects.

| Node Type | Source | Examples | Visual |
|-----------|--------|----------|--------|
| **Project** | projects.json entries | "Electrostatics Lab", "ECDO Watch" | Large circle, project color |
| **Theme** | New: curated list | "Dynamical Systems", "Cross-Domain Analogies" | Medium hexagon, cluster color |
| **Method** | New: curated list | "Falsification", "Physical Analogy", "Proportional Reasoning" | Small diamond |

This creates a two-level graph: projects cluster around themes, themes connect via shared methods.

### Connection Types

| Type | Meaning | Example |
|------|---------|---------|
| `extends` | B builds on A's framework | Dynamical Systems → Dynamical Systems Lab |
| `applies` | B applies A's method to a new domain | Physical Analogies → Thermofluidic Finance |
| `validates` | B experimentally tests A's theory | Gravitational Radiation → Gravitational Wave Detector |
| `generalizes` | B abstracts A into a broader principle | Physical Analogies → Universe of Proportions |
| `complements` | A and B address related aspects | Electrostatics Lab → Capacitor Lab |
| `methodological` | A and B share reasoning approach | PSCPR → Certainty, Inference, Comprehension |

---

## 3. Thematic Clusters

Based on the website content, these are the natural clusters the graph should reveal:

| Cluster | Projects | Unifying Idea |
|---------|----------|---------------|
| **Dynamical Systems** | On Dynamical Systems, DS Lab, Aeropendulum, Inferential Dynamics, Thermofluidic Finance, Rebound Pendulum | Stability, state-space, control |
| **Electromagnetic & Gravitational Fields** | Electrostatics Lab, Grav Radiation, Grav Wave Detector, Capacitor Lab, ECDO Watch | Field theory, measurement, analogy |
| **Cross-Domain Analogies** | Physical Analogies, Analogies (continued), Universe of Proportions, Inferential Dynamics | Structural isomorphism across domains |
| **Natural Philosophy & Reasoning** | PSCPR, Certainty-Inference-Comprehension, Inferential Dynamics | Epistemology, falsification, logic |
| **Applied Engineering** | Disk Cam, Aeropendulum, ECDO Watch | Theory to hardware |
| **Mathematical Frameworks** | Frame Centering Algorithm, Population Modeling, Universe of Proportions | Quantitative methods |

Several projects (Inferential Dynamics, Universe of Proportions, Aeropendulum) appear in multiple clusters — these are the **bridge nodes** that make the graph interesting.

---

## 4. Technical Implementation

### Visualization Library

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **D3.js force-directed** | Full control, no dependencies, works with static sites | Steeper learning curve, more code | **Recommended** |
| Cytoscape.js | Purpose-built for graphs, good layouts | Heavier library (~500KB) | Viable alternative |
| vis.js Network | Easy API, good interactivity | Less visual polish, dated look | Pass |
| Three.js (3D graph) | Dramatic visual, already used in Agent World | Overkill for this, accessibility concerns | Pass |

**Recommendation:** D3.js force-directed graph. Lightweight, works on static sites with no build step, and provides the Obsidian-like aesthetic. The site already uses vanilla JS — D3 fits that philosophy.

### Page Structure

- New page: `idea-map.html` (added to nav bar)
- Full-viewport SVG canvas with force simulation
- Sidebar panel (collapsible) showing details on hover/click
- Controls: zoom, filter by cluster/type, search
- Responsive: works on desktop (primary), degrades gracefully on mobile (static image fallback or simplified view)

### Interactions

- **Hover** a node: highlight its connections, dim unrelated nodes
- **Click** a node: open detail panel (title, description, links to related nodes, link to project page)
- **Double-click**: navigate to the project page
- **Filter toggles**: show/hide node types or clusters
- **Search**: highlight matching nodes
- **Drag**: reposition nodes (force simulation pauses)

---

## 5. Work Breakdown & Agent Assignment

### Phase 1: Data Layer (Week 1)

| Task | Agent | Input | Output | Acceptance Criteria |
|------|-------|-------|--------|---------------------|
| 1.1 Define all project-to-project connections | **Human + RA** | Website content, project pages | Connection definitions (target, type, label) for all 21 visible projects | Every project has at least 1 connection; connection types are from the defined taxonomy; no circular `extends` chains |
| 1.2 Define theme and method nodes | **Human + CD** | Cluster analysis (Section 3) | Curated list of 6-8 theme nodes and 4-6 method nodes with descriptions | Each theme has 2+ project members; each method connects to 2+ themes |
| 1.3 Extend projects.json schema | **CE** | Output of 1.1 and 1.2 | Updated projects.json with `connections` array + new `themes` and `methods` arrays | Schema is backward-compatible; existing homepage rendering unaffected |

**Critical path:** 1.1 and 1.2 can run in parallel. 1.3 depends on both.

### Phase 2: Visualization (Week 2)

| Task | Agent | Input | Output | Acceptance Criteria |
|------|-------|-------|--------|---------------------|
| 2.1 Build D3 force graph renderer | **CE** | Updated projects.json | `js/idea-map.js` — renders nodes and edges from data | Graph renders all nodes; force simulation stabilizes in <3s; nodes are draggable |
| 2.2 Design visual style | **CD** | Site's existing CSS variables, theme system | Node/edge color scheme, typography, hover/active states | Matches site's light/dark themes; node types are visually distinct; accessible contrast ratios |
| 2.3 Build idea-map.html page | **CE** | Style from 2.2, renderer from 2.1 | Complete page with nav, graph viewport, controls | Integrated into site navigation; responsive; theme toggle works |

**Critical path:** 2.1 and 2.2 can run in parallel. 2.3 depends on both.

### Phase 3: Interactivity & Polish (Week 3)

| Task | Agent | Input | Output | Acceptance Criteria |
|------|-------|-------|--------|---------------------|
| 3.1 Detail panel + navigation | **CE** | Working graph from 2.3 | Click/hover interactions, sidebar panel, double-click navigation | Panel shows project info; links work; graceful behavior on mobile |
| 3.2 Filter and search controls | **CE** | Working graph from 2.3 | Cluster/type filter toggles, search box | Filters animate smoothly; search highlights correct nodes |
| 3.3 Write page copy and meta tags | **CD** | Completed page | Page description, OG tags, introductory text | Consistent with site voice; SEO-ready |
| 3.4 Update sitemap and navigation | **SA** | Completed page | Updated sitemap.xml, nav bar, any cross-links | sitemap has new URL; all 7 nav links present on all pages |

**Critical path:** 3.1 and 3.2 can run in parallel (both depend on 2.3). 3.3 depends on page being functional. 3.4 is final.

---

## 6. Dependency Map

```
1.1 (RA/Human: connections) ──┐
                               ├──> 1.3 (CE: schema) ──> 2.1 (CE: renderer) ──┐
1.2 (CD/Human: themes)  ──────┘                                                │
                                                                                ├──> 2.3 (CE: page) ──> 3.1 (CE: interactions)
                                     2.2 (CD: visual style) ───────────────────┘                   ──> 3.2 (CE: filters)
                                                                                                        ──> 3.3 (CD: copy)
                                                                                                             ──> 3.4 (SA: deploy)
```

**Critical path:** 1.1 → 1.3 → 2.1 → 2.3 → 3.1 → 3.4

**Constraint:** Task 1.1 (defining connections) requires human judgment — this is the bottleneck. The quality of the map depends entirely on the quality of the connection definitions. No amount of good visualization compensates for poorly defined relationships.

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Connection definitions are subjective / inconsistent | High | High | Use the defined connection taxonomy strictly; RA validates each connection against project content |
| Graph is too dense / cluttered with 21+ projects | Medium | Medium | Cluster layout with theme gravity wells; filter controls; progressive disclosure |
| Mobile experience is poor | Medium | Low | Desktop-first; mobile gets a simplified static view or list fallback |
| D3 learning curve slows CE work | Low | Medium | D3 force-directed graphs are well-documented; many reference implementations exist |
| Maintaining connections becomes overhead | Medium | Medium | Connections in projects.json mean one file to update; CD/PM review on new project additions |

---

## 8. Success Criteria

1. A visitor can identify the 6 thematic clusters within 30 seconds of viewing the graph
2. Every project node links to its project page; every click path works
3. The graph renders in <3 seconds on a standard connection
4. Light and dark themes both produce a legible, visually coherent graph
5. At least 3 "bridge" projects (appearing in multiple clusters) are visually apparent
6. The page passes Lighthouse accessibility audit at 90+

---

## 9. Open Questions for Human Decision

1. **Data structure:** Extend `projects.json` (recommended) or separate `graph.json`?
2. **Cluster accuracy:** Do the 6 thematic clusters match your mental model, or would you reorganize them?
3. **Quotes integration:** Should the 60+ quotes appear as nodes connected to relevant projects/themes, or is that too noisy?
4. **Hidden projects:** Should SPECTRUM and Eisenhower appear in the graph (dimmed/ghosted), or remain fully hidden?
5. **Priority:** Where does this sit relative to current active work (Agent World, PSEII chapters, Propendulum)?

---

*This plan is a hypothesis. Revise when evidence contradicts it.*
