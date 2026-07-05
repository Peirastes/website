# UCO Degree Plan Navigator

## Interactive Curriculum Planning & Degree Building Tool

**University of Central Oklahoma — School of Engineering**
**2025–2026 Catalog**

---

## Purpose

The Degree Plan Navigator is an interactive, browser-based tool that replaces the static PDF flowcharts currently used by the UCO School of Engineering for degree planning. It provides students, faculty, and academic advisors with a dynamic, visual environment for exploring, customizing, and managing engineering degree plans across all five undergraduate programs.

The tool serves two distinct audiences with tailored functionality:

- **Students and Advisors** use the Navigator mode to explore existing degree plans, track personal progress, rearrange course sequences, select electives, compare major changes, and export customized plans.
- **Faculty and Curriculum Designers** use the Degree Builder mode to prototype new degree programs from scratch, edit course metadata, evaluate the downstream impact of curriculum changes, and validate against university requirements.

---

## Motivation

### The Problem with Static Flowcharts

Every engineering program at UCO distributes its curriculum as a static PDF flowchart — a fixed image showing courses arranged by semester with colored backgrounds indicating offering patterns. While these flowcharts serve as useful reference documents, they have significant limitations:

- **No interactivity.** Students cannot explore prerequisite chains, view course descriptions, or understand why a particular sequencing matters.
- **No personalization.** A student who has already completed courses, transferred credits, or wants to rearrange their plan must mentally overlay their situation onto the static chart.
- **No "what-if" analysis.** Moving a course to a different semester, selecting an elective, or evaluating the impact of switching majors requires manual tracing of prerequisite chains — error-prone and time-consuming.
- **No progress tracking.** There is no mechanism to mark courses as completed or in-progress and see how far through the degree one has progressed.
- **Difficult curriculum development.** Faculty designing or revising degree programs must work with spreadsheets and manual calculations to ensure all university requirements are met and prerequisite chains are valid.
- **No concept of the critical path.** Neither students nor faculty have an automated way to identify which prerequisite chain constrains time-to-degree — the sequence where any single failure cascades into delayed graduation.

### The Opportunity

Modern web technologies make it possible to build a tool that is simultaneously a visual reference (like the flowcharts), a personal planning tool (like a spreadsheet), and a curriculum design environment (like specialized academic software) — all in a single, accessible interface that runs in any browser with no installation required.

---

## Utility

### For Students

The Navigator provides a complete personal degree planning environment:

- **Visual Exploration.** Click any course to view its catalog description, credit hours, offering semester, prerequisites, and downstream courses. Prerequisite chains are visualized with SVG bezier connector lines between related cards.
- **Drag-and-Drop Rearrangement.** Move courses between semester columns to create a customized plan. The tool automatically flags prerequisite violations (red warnings) and semester offering mismatches (orange warnings). Every drag is recorded; the ↩ Undo button reverses the last action without losing other customizations. A history stack of up to 20 operations is maintained.
- **Elective Selection.** Dashed-border elective slots can be filled by selecting from a dropdown of eligible courses or by dragging from the columnar Elective Groups panel below the grid. Clicking any course in the elective panel opens its full detail view with catalog description and prerequisites.
- **Elective Lock-In.** Once an elective is selected, it transforms from a dashed placeholder to a solid card with a 🔒 icon. The selected course's prerequisite string is parsed into actual course ID references, integrating it into the full dependency graph — so locked electives participate in prereq chain highlighting, critical path analysis, and violation detection. An unlock button in the detail panel reverts to the picker view.
- **Progress Tracking.** A three-state checkbox (bottom-right of each card) cycles through unmarked → in-progress (blue) → completed (green with strikethrough). A stacked progress bar in the toolbar shows completed (green), in-progress (blue), and remaining hours with numeric totals.
- **Critical Path Analysis.** A toggle highlights the longest prerequisite chain constraining graduation timing. An info banner shows the chain length, semester span, plain-language explanation, and the full course sequence as clickable badges. Clicking any course in the chain opens its detail panel. The algorithm uses dynamic programming with three-tier tie-breaking (longest path → prefers Senior Design II endpoint → prefers latest semester) to ensure the graduation-critical path is always selected.
- **What-If Major Change.** Students who have marked courses as completed in one program can switch to another tab and activate the What-If tool to instantly see: how many courses transfer (exist in both programs), how many won't apply (orphaned), and how many new requirements the target program adds. Transferring courses appear on cards with a blue "WI" badge. A dropdown lets students compare against any program where they have progress recorded.
- **Semester Offering Awareness.** Every course card displays an F (Fall only, orange), S (Spring only, blue), or F/S (both, gray) badge. Dragging a Fall-only course into a Spring column triggers an orange ⚠ warning with tooltip.
- **Persistent Save/Load.** Named plans persist across sessions via browser storage. Students can save multiple plan variants (e.g., "Plan A — Start Spring," "Plan B — Lighter Junior Year") and load them later. All state is preserved: semester overrides, elective selections, course statuses. A "Reset to Default" button clears everything for the current program.
- **PDF Export.** A print-optimized landscape layout generates a clean PDF snapshot with white backgrounds, all course statuses visible, and a credit hour progress summary. Interactive elements (buttons, connector lines, detail panels) are hidden. A print-only header shows the program name and full progress breakdown.
- **Comprehensive Help Overlay.** A "?" button in the header opens a modal with 12 panels covering all features — 8 for student tools, 4 for faculty tools — with color-coded headers, concise descriptions, and a disclaimer about official audit status.

### For Faculty and Curriculum Designers

The Degree Builder provides a curriculum prototyping environment:

- **Blank Canvas.** An empty 8-semester grid where faculty can construct a new degree program from scratch. An editable program name field, running course count, and total credit hour display provide immediate feedback.
- **2D Course Catalog.** The complete course inventory is organized as a grid with course level (1000→4000) on the horizontal axis and department (Mathematics, Physics, Engineering, Computer Science/SE, Biomedical Engineering, Science, General Education) on the vertical axis — creating a natural spatial mapping to the semester grid above. Courses already in the plan are dimmed with a ✓ indicator.
- **Requirements Tracker.** A live checklist between the toolbar and the grid monitors five mandatory requirement categories: University Core (11 items including English Comp, Speech, Math, Life Science, Physical Science, Humanities, Philosophy, Am. Government, Am. History, Life Skills, Social/Behavioral), Math Foundation (Calc 1–4, Diff Eq), Physics (Physics I & II), Engineering Core (Intro, Computing, Statics, Electrical Science, Prob & Stats, Senior Design), and Chemistry. Each item shows ✓ (met), ○ (unmet), or an amber partial count like (2/4).
- **Course Editing.** Click any course and hit "✏ Edit Course" to open an inline editor with fields for name, title, credits, offered semester (dropdown), and description (textarea). While editing, all downstream courses that list the edited course as a prerequisite are highlighted in amber with ⚠ indicators across the grid, and the editor's right column shows a scrollable "Downstream Impact" list with affected course names and which programs they belong to. A "Done" button saves the edit; "Revert" restores original catalog data. Edited courses show a ✏ icon on their cards and in catalog chips.
- **Custom Course Creation.** A "+ New Course" button opens a dialog for entering a course ID and title. New courses appear in the 2D catalog grid under the appropriate department and level cell with a ✦ icon, and can be dragged, edited, and used like any other course.
- **Catalog Search.** A real-time search bar above the catalog grid filters by course name, ID, or title. Non-matching courses are hidden while the grid structure is preserved.
- **Builder Persistence.** Builder plans (including all courses, semester placements, and course edits) can be saved with "💾 Save Builder" and appear alongside navigator saves in the Load menu. Loading a builder save automatically switches to builder mode and restores everything.

### For Advisors

The tool bridges the gap between student self-service and faculty oversight:

- Students can prepare a customized plan before an advising appointment and export it as a PDF for discussion.
- Advisors can use the Critical Path feature to identify which courses a struggling student should prioritize to stay on track for graduation.
- The What-If tool lets advisors quickly show students how their progress would transfer if they switched majors — with concrete numbers on transferring courses, orphaned credits, and new requirements.
- The prerequisite violation and semester offering warnings catch common planning errors before they become enrollment problems.

---

## Programs Supported

The Navigator includes complete course data for all five UCO School of Engineering undergraduate programs, organized across seven tabs:

| Tab | Program | Accent Color |
|-----|---------|-------------|
| EP | Engineering Physics | Gold (#E8C547) |
| ME | Mechanical Engineering | Blue (#4EA8DE) |
| EE | Electrical Engineering | Purple (#7C6EF6) |
| CE | Computer Engineering | Green (#43AA8B) |
| BME-A | Biomedical Engineering — Pre-Medical | Pink (#E05780) |
| BME-B | Biomedical Engineering — Instrumentation | Orange (#E88D4F) |
| BME-C | Biomedical Engineering — Biomechanics | Green (#6BBF8A) |

The three BME concentrations are organized as nested subtabs under a single "BME" parent tab.

A shared course catalog of 90+ courses eliminates redundancy — updating a course description in one place propagates the change across all programs that reference it.

---

## Competitive Landscape

### Industry Comparison

The tool was benchmarked against the leading enterprise degree planning platforms: **Stellic** (used at CMU, Johns Hopkins, Mizzou, CWRU), **DegreeWorks/Ellucian** (used across the SUNY system and hundreds of institutions), **uAchieve/CollegeSource**, and **Ad Astra**.

| Feature | Stellic / DegreeWorks | UCO Navigator |
|---|---|---|
| Drag-and-drop planning | ✓ | ✓ |
| Prereq checking on drag | ✓ | ✓ + visual connector lines |
| Progress tracking | ✓ (green/yellow/gray bars) | ✓ (3-state checkboxes + stacked bar) |
| Semester offering awareness | ✓ (Stellic shows term availability) | ✓ (F/S/FS badges + mismatch warnings) |
| What-if major exploration | ✓ (DegreeWorks specialty) | ✓ (cross-program transfer analysis with counts) |
| Save/load plans | ✓ | ✓ |
| PDF export | Limited | ✓ (print-optimized landscape) |
| Undo support | Not standard | ✓ (20-operation history stack) |
| **Critical path analysis** | **✗ None offer this** | **✓ First-class feature with info banner** |
| **Curriculum builder for faculty** | **✗ Separate systems required** | **✓ Integrated with same UI** |
| **Downstream impact visualization** | **✗** | **✓ On course edit in builder** |
| **Requirements tracker** | **✗ (audit only, not design-time)** | **✓ Live checklist during program design** |
| **Elective dependency integration** | **✗** | **✓ Locked electives join prereq graph** |
| **Zero infrastructure** | **✗ All require SIS integration** | **✓ Single file, any browser** |

### Where Enterprise Tools Excel (Features Not Yet Implemented)

- **SIS/transcript integration** — enterprise tools pull directly from student records; our tool requires manual status marking.
- **Course conflict detection** — Stellic generates conflict-free schedules based on actual section times; requires schedule data we don't have.
- **Advisor notes and collaboration** — Stellic provides in-app chat and notes between students and advisors.
- **Transfer credit evaluation** — DegreeWorks automatically maps transfer credits from other institutions.
- **Co-requisite detection** — enterprise tools enforce concurrent enrollment requirements (e.g., lecture + lab).
- **Course demand forecasting** — Ad Astra aggregates student plan data to predict enrollment pressure; requires multi-user data.

---

## Novelty

### What Makes This Different

**1. Zero-infrastructure deployment.** The entire application is a single React component (2,143 lines, 154KB) that runs in any modern browser. There is no server, no database, no API, no authentication system, and no installation required. It can be embedded on a department website, shared as a file, or hosted on any static web server.

**2. Critical path analysis as a first-class feature.** No comparable student-facing tool — including Stellic, DegreeWorks, uAchieve, and Ad Astra — surfaces the longest prerequisite chain as a visual, interactive element. This concept, borrowed from project management, gives students actionable insight into which courses matter most for on-time graduation, and gives faculty a quantitative measure of curriculum bottleneck severity.

**3. Unified student/faculty tool.** The same interface serves both audiences. Students use the Navigator to plan their personal path; faculty use the Builder to design new programs. Shared data and consistent interaction patterns mean skills transfer between modes. Enterprise platforms typically require separate systems for student planning and curriculum management.

**4. Drag-and-drop curriculum prototyping with live validation.** The Degree Builder's 2D catalog (department × course level) with drag-to-semester interaction, combined with the live requirements tracker and downstream impact highlighting, provides rapid feedback during the design process that typically requires manual spreadsheet work and committee review cycles.

**5. Elective lock-in with dependency integration.** When a student selects a specific course for an elective slot, the tool parses its prerequisite string into actual course ID references, integrating the elective into the full dependency graph. This means locked-in electives participate in prerequisite chain highlighting, critical path analysis, and violation detection — treating the student's personalized plan as a complete, coherent system rather than a template with holes. No comparable tool does this.

**6. What-if with quantitative transfer analysis.** While DegreeWorks offers what-if major changes, it shows a revised audit checklist. Our tool provides immediate quantitative feedback: N courses transfer (M credit hours), X courses won't apply (Y hours wasted), Z new requirements (W additional hours). Cards visually distinguish transferred progress from native progress.

**7. Offline-capable with persistent storage.** The application uses browser-based key-value storage for plan persistence, requiring no server-side infrastructure. Students can save multiple plan variants, and faculty can save builder prototypes, all surviving across sessions without an account system.

---

## Technical Architecture

### Deliverables

| File | Description | Size |
|------|-------------|------|
| `degree-navigator.jsx` | Main application (React component) | 154KB, 2,143 lines |
| `degree-navigator-overview.md` | This documentation | — |

### Data Model

The application is built on a **shared catalog + per-program plan** architecture:

- `COURSE_CATALOG` — a single object containing all course metadata (name, title, hours, description, CC tags). Shared across all programs. ~90 entries.
- `OFFERED` — a separate lookup object mapping course IDs to semester offering patterns (F/S/FS). Easy to update independently of the catalog.
- `DEGREE_PLANS` — per-program definitions that reference catalog course IDs and add program-specific data (semester placement, prerequisites, elective groups, credit hour targets).

This separation means:
- Updating a course description propagates to all programs.
- Offering data can be corrected without touching the catalog.
- New programs can be added by defining a new plan that references existing catalog entries.

### Component Architecture

The application uses a minimal set of React components, all designed as pure render functions (no hooks in child components) to ensure stability in the artifact runtime:

- **Card** — course card with 12 visual states: normal, highlighted, dimmed, selected, critical path, completed, in-progress, locked elective, warning, semester mismatch, what-if transfer, and editing target.
- **Detail** — expandable course information panel with 4-column grid layout, adapting between regular courses (identity, description, prereqs, leads-to), unfilled electives (identity, picker dropdown, available groups), and locked electives (identity, description, prereqs + unlock button).
- **Lines** — SVG prerequisite connector lines with bezier curves and arrowhead markers, computed directly during render with no hooks.
- **Electives** — columnar elective group display with per-group color coding, drag-to-plan, and click-to-inspect.
- **App** — main component (~1,800 lines) containing all state management (25+ state variables), computed values (12 useMemo blocks), event handlers, and layout orchestration for both Navigator and Builder modes.

### Key Algorithms

- **Critical Path** — dynamic programming longest-path computation with memoization. For each course, computes the longest chain of prerequisites leading into it, then finds the globally longest path. Three-tier tie-breaking: longest chain → prefers ENGR4892 (Senior Design II) endpoint → prefers latest semester.
- **Prerequisite Violation Detection** — for each course with prerequisites, checks that all prereq courses are placed in an earlier semester (same semester = concurrent, allowed). Violations are surfaced as red card borders and ⚠ icons.
- **Elective Prereq Parsing** — regex-based extraction of course IDs (pattern: 2-4 uppercase letters followed by 4 digits) from prerequisite description strings, matched against courses present in the current plan. Enables locked electives to participate in the full dependency graph.
- **What-If Transfer Analysis** — cross-references completed/in-progress course IDs from one program's status map against another program's course list. Produces transfer, orphan, and new-requirement sets with credit hour totals.
- **Requirements Validation** — iterates over five requirement category definitions, each containing items with lists of satisfying course IDs and minimum counts. Produces met/partial/unmet status per item.

### State Management

Navigator mode manages 25+ pieces of state including: current program selection, selected course, elective panel open/closed, course semester overrides (per-program), elective selections (per-program), course statuses (per-program), drag state, critical path toggle, what-if source program, save/load dialog state, and undo history.

Builder mode adds: builder course list, builder name, builder course edits, builder selection, editing state, new course dialog, and catalog search.

All state is serializable for save/load persistence.

---

## Roadmap

### Completed Features (21)

- [x] 8-column semester grid with 7 program tabs (including 3 BME concentrations)
- [x] Shared course catalog with per-program degree plan definitions
- [x] Click-to-explore detail panel (description, prereqs, leads-to, offering info)
- [x] Drag-and-drop course rearrangement with prereq and offering violation warnings
- [x] Dynamic credit hour tracking per semester
- [x] Elective selection via dropdown and drag-from-panel with click-to-inspect
- [x] Elective lock-in with prerequisite integration and unlock
- [x] Course status tracking (unmarked/in-progress/completed) with stacked progress bar
- [x] Critical path highlighting with info banner and clickable chain
- [x] Semester offering indicators (F/S/F+S) with mismatch warnings
- [x] Persistent save/load for navigator and builder plans
- [x] PDF export with print-optimized landscape layout
- [x] Help overlay with 12-panel feature documentation
- [x] Undo support for drag operations (20-operation history)
- [x] What-if major change with quantitative transfer analysis
- [x] Degree Builder with blank canvas and full catalog
- [x] 2D catalog layout (department × course level)
- [x] Requirements tracker (University Core, Math, Physics, Engineering, Chemistry)
- [x] Course editing with downstream impact visualization
- [x] Custom course creation
- [x] Catalog search/filter

### Pre-Deployment Data Review

Before sharing with students and colleagues, the following data items need faculty review and correction:

- [ ] **Course descriptions** — current descriptions are paraphrased summaries, not official UCO Course Catalog text. Need canonical replacement.
- [ ] **Semester offering data** — F/S/FS values were inferred from flowchart color coding. Some are certainly incorrect.
- [ ] **Prerequisite data** — needs systematic validation pass across all programs for consistency and completeness.

### Planned Enhancements

- [ ] Co-requisite detection (flag courses that must be taken concurrently, e.g., lecture + lab pairs)
- [ ] Advisor notes field (text notes per plan, persisted with save/load)
- [ ] Transfer credit mapping (mark courses as transferred with source institution)
- [ ] Course conflict detection (requires schedule/time slot data)
- [ ] Course demand forecasting from aggregated saved plans
- [ ] Mobile-responsive layout
- [ ] Keyboard accessibility
- [ ] URL-based deep linking to specific programs
- [ ] Builder prereq definition and validation
- [ ] Builder export to shareable format

---

## Disclaimer

This tool is for planning purposes only and does not constitute official enrollment or degree audit. Students should always consult with their academic advisor and refer to the official UCO Course Catalog for current requirements. Course descriptions and prerequisite data are subject to correction.

---

*Developed for the UCO School of Engineering — 2025–2026 Academic Year*
