# Project Overview Document (POD)

---

**Project:** Knowledge Base Explorer
**Lead:** Cole Prather
**Status:** Active
**Last Updated:** 2026-05-26

---

## The Problem

The Peirastes operation maintains two structured knowledge bases in markdown: a human epistemic KB (first principles, domain axioms, claims with evidence and status) and an AI operational KB (SOPs, skills, tools, and interfaces across 6 agents). These KBs contain hundreds of entries with dependency chains, cross-references, and layer-bridging links, but their structure is only legible to someone who reads the raw markdown files sequentially. There is no way to see the topology of what is known, what depends on what, or where the human and AI knowledge layers connect.

**Driving Question:** Can the full dependency structure of a dual-layer knowledge base be made navigable and queryable through interactive graph visualization?

---

## What's Novel

No off-the-shelf knowledge graph tool ingests structured markdown with epistemic metadata (status, confidence, inference mode, PSCPR stage) and renders it as an explorable force-directed graph with layer switching. Obsidian's graph view shows file links but has no concept of claim status, evidence weight, or human-vs-AI layer separation. This tool treats epistemology as a first-class visual dimension: established claims are solid, hypothesized claims pulse, speculative claims fade, and the entire AI operational layer can be toggled on or off independently.

---

## Goals

**Primary Objective:** Provide a single interactive visualization where the complete dependency structure of both knowledge layers is navigable, filterable, and queryable.

**Near-Term** (1-3 months):

1. Reconcile the deployed `app.html` and the Electron source so both share one feature set (the deployed build has surpassed the source — radial layout, lineage, query tools)
2. Add a structured query mode that can answer graph-distance questions (e.g., "what claims depend on FP-003 within 2 hops?")
3. Automate the export pipeline so `kb-data.json` regenerates on KB file changes without manual script invocation

**Long-Term** (3-12 months):

1. Support editing KB entries directly from the side panel and writing changes back to the source markdown files
2. Surface coverage gaps automatically — domains with few established claims, SOPs with no linked human-knowledge dependencies

---

## Design Constraint

**One canonical geometry.** The Radial map is the single spatial model. Every other capability is either a *scope filter* (show/hide: layer, domain, project, tier) or a *lens* (highlight-only: survey, focus, lineage, query) applied on top of it. New features must be a filter or a lens — never a new layout, view, or alternate geometry. Force is retained only as a hidden `?layout=force` dev flag; Venn is a visual encoding on the radial map, not a geometry.

## What Works

- Parses both KB layers from structured markdown (7 human domain files, 6 agent files, shared tools/interfaces, human skills) and renders a unified force-directed graph using D3.js
- 393 nodes and 963 edges in the current dataset, including 72 claims, 102 quotes, 36 SOPs, 49 skills, 31 tools, and 19 human skills
- Layer toggle (keys 3/4/5) switches between human-only, both, and AI-only views, re-centering the force layout for each
- Two interaction modes: Survey (full graph, zoom/pan/drag) and Focus (click a node to highlight its immediate neighborhood and dim everything else)
- Side panel displays full claim metadata on click: statement, evidence, counter-evidence, status, confidence, inference mode, dependencies, and navigable dependency links
- Domain color-coding and shape encoding distinguish node types at a glance (diamonds for first principles, hexagons for SOPs, pentagons for skills, circles for claims)
- Radial layout option with locked sector ordering maps knowledge domains to spatial positions
- Lineage mode traces the full ancestor chain of any node back to its root principles, showing the inferential path
- Scope Guard query highlights in-scope, adjacent, and out-of-scope nodes relative to any anchor
- Project district overlays show which KB nodes relate to specific Peirastes projects
- Search box filters and highlights matching nodes by ID or title
- Deployed at peirastes.com/kb-explorer as a static single-page app; `export-kb.js` bakes the parsed graph into `kb-data.json` for the web build
- The deployed `app.html` has been retrofitted to the canonical Cinematic Tier (v3.5) chrome — full carbon-copy chrome over a Path A topology, matching the site-wide instrument aesthetic

## What Doesn't

- The web export requires manually running `node scripts/export-kb.js` after any KB edit — stale data is the default state
- The deployed app loads a 12,000-line JSON file synchronously on startup; no lazy loading or incremental rendering for large graphs
- No mobile layout — the filter sidebar, legend, and side panel assume a wide viewport
- The Electron development version (Vite + hot reload) and the deployed static version (single-file `app.html` with baked data) have diverged in features; the deployed version has radial layout, lineage mode, query tools, and the v3.5 Cinematic chrome that the Electron source does not
- Until the map-consolidation pass lands, the app exposes three competing geometries (Force as the default, Radial, Venn) as look-alike toolbar peers — spatial memory never forms, and the richest filters (districts, tiers, ring mode) are silently disabled outside Radial. This is the primary navigation-confusion source (addressed by Next Steps #1)

---

## Next Steps

| Priority | Action | Target |
|----------|--------|--------|
| 1 | Map consolidation — single-geometry IA (Radial canonical; Force→dev-flag; Venn→encoding), canonical-field sectors, Epistemology merged into Philosophy, Physics Simulations hull (CE directive P2b) | Q2 2026 |
| 2 | Reconcile deployed app.html with Electron source so both versions share the same feature set | Q2 2026 |
| 3 | Automate kb-data.json export (file watcher or pre-deploy hook) | Q2 2026 |

*Resolved 2026-05-13: the deployed app was restyled to the canonical Cinematic Tier (v3.5) chrome, superseding the earlier "restyle to Style Guide v2.1" item.*

---

## Open Questions

1. Should the Electron version be retired entirely in favor of the static web build, given that the web version has surpassed it in features and the app has no need for local file system access at runtime?
2. At what node count does the single-file synchronous load become a real performance problem, and should the export be split into per-layer or per-domain chunks before that threshold is hit?

---

*Revision History:*

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-04-03 | Initial creation |
| 1.1 | 2026-05-16 | Corrected stale claims against ground truth. Deployed `app.html` confirmed retrofitted to Cinematic Tier (v3.5) chrome (2026-05-13) — removed the "original prototype look" weakness and the v2.1 restyle Next Step (resolved/superseded). Retired completed near-term styling goal; promoted deployed/Electron reconciliation to near-term goal #1 and Next Step P1. Data figures (393 nodes) re-verified. |
| 1.2 | 2026-05-16 | Added the single-geometry **Design Constraint** (Radial = the only map; everything else a filter or lens). Logged map-consolidation as Next Step #1 — canonical-field sectors, Epistemology merged into Philosophy, Physics Simulations hull, Force→`?layout=force` dev-flag, Venn→radial encoding (CE directive P2b). Added the multi-geometry navigation-confusion weakness. Reconciliation/export demoted to #2/#3. |
| 1.3 | 2026-05-26 | **Sector taxonomy work landed 2026-05-19 → 2026-05-22.** Canonical-field sectors realigned (`f2def152`), Engineering sector added, Economics broadened to "Social Sciences & Economics" (`32071dda`), Life Sciences & Biology sector added (`32071dda`). The KB Explorer is now structurally aligned with the future Website folder reorganization (project tagging by field of study, per Cole's intent — KB sectors are the canonical field taxonomy). Map-consolidation Next Step #1 is partially landed; the consolidation work remaining is the "single-geometry IA" itself (Radial as the only geometry, Force → dev-flag). First PSR created in the same 2026-05-26 portfolio review. |

---

*This document provides orientation. For detailed status and analysis, see the Project Status Report (PSR). For technical details, see the project README.*
