# Project Overview Document (POD)

**Project Title:** Peirastes Research & Portfolio Website
**Date:** January 30, 2026 | **Version:** 1.0
**Lead:** Cole Prather

---

## 1. Purpose

### What is this project?
A research portfolio and knowledge archive platform showcasing 17+ scientific and engineering projects spanning 2017–2026. The website functions as both a professional portfolio and curated knowledge repository, organized by year, category, and keyword. The platform embodies the peirastic philosophy ("one who tests or tries") as a living archive documenting completed research, active investigations, philosophical frameworks, and supporting materials.

### Why does it matter?
Traditional resumes are static; research requires context. The Peirastes website explains why problems matter, how they were approached, where assumptions fail, and what remains robust. By presenting projects as intellectual journeys rather than polished outputs, the site demonstrates problem-solving methodology and research resilience. It serves researchers, students, and stakeholders seeking to understand not just what was built, but why and how it was tested.

### What is the driving question?
How can a research website transcend static portfolio presentation to become a dynamic knowledge archive that demonstrates intellectual rigor, falsification-first methodology, and the evolution of research questions over time?

---

## 2. Objectives & Goals

### Primary Objective
Deliver a highly functional, accessible research portfolio platform that archives 17+ projects, supports rich discovery through search/filtering, clearly communicates research philosophy, and provides a living knowledge repository suitable for peer engagement and pedagogical reference.

### Supporting Goals
1. **Organize and display 17+ completed projects** by year, category, and keyword with clear descriptions and supporting materials
2. **Implement rich discovery interface** with full-text search, category filtering, year-based navigation, and keyword tagging
3. **Communicate peirastic philosophy** through About page, project descriptions, and methodological transparency
4. **Provide theme customization** (light/dark) with persistent user settings and accessible color contrast
5. **Maintain responsive design** across desktop, tablet, and mobile viewports with no accessibility barriers
6. **Create supplementary content** (physics timeline, curated quotes, current projects) enriching intellectual context
7. **Ensure performance** with fast load times, minimal dependencies, and semantic HTML/CSS/JavaScript

---

## 3. Value & Novelty

| Dimension | Description |
|-----------|-------------|
| **Novelty** | Research portfolio focused on testing methodology and falsification rather than polished outputs. Explicit peirastic philosophy. Year-based organization reveals research evolution. Multi-view navigation (archive, search, category, timeline) suits different discovery patterns. |
| **Utility** | Enables stakeholders (employers, collaborators, students) to understand research methodology and intellectual trajectory. Archival value for future reference. Educational resource for distributed content. |
| **Gap Addressed** | Typical research portfolios lack methodological context or philosophical grounding. Peirastes demonstrates intellectual integrity by showing where assumptions fail and what remains robust. |

---

## 4. Scope & Boundaries

### In Scope
- 17+ archived projects organized by year (2017–2026)
- Project metadata (category, keywords, year, description, images, links)
- Full-text search with real-time filtering
- Category and keyword filtering with maintained filter state
- Light/dark theme switcher with localStorage persistence
- Responsive design (desktop, tablet, mobile breakpoints)
- Supplementary pages (About, Current Projects, Physics Timeline, Quotes)
- Accessible navigation and semantic HTML structure
- Image lightbox viewer for project media

### Out of Scope
- User accounts or commenting system (knowledge archive priority)
- Project collaboration tools or issue tracking (standalone portfolio)
- Interactive demos or embedded simulations on portfolio pages (links to projects instead)
- Marketing or SEO optimization beyond semantic structure
- Persistent analytics or user tracking (privacy-first approach)

### Key Assumptions
1. Users have browsers supporting ES2020+ JavaScript and CSS Grid/Flexbox
2. Projects are static content updated infrequently (no real-time data required)
3. Mobile experience adequate if desktop-primary design principles follow responsive patterns
4. Audience is technical (researchers, engineers, educators) who value methodology over marketing

### Phase
☑️ Complete / Operational

### Progress Summary
The Peirastes website is **functionally complete and actively maintained**. Core functionality is solid with all primary pages operational. Recent work (January 2026) focused on metadata enhancement (year tags added to project cards) and content curation (project descriptions refined, current projects updated). The architecture is stable, mobile-responsive, and performs well. Minor improvements remain in mobile responsiveness refinement and advanced filtering capabilities.

### Key Achievements
- ✅ 17+ archived projects with full descriptions and metadata
- ✅ Full-text search with real-time filtering across project content
- ✅ Year-based archive organization with toggle functionality
- ✅ Category and keyword filtering with filter state maintenance
- ✅ Light/dark theme switcher with localStorage persistence
- ✅ Responsive design across desktop, tablet, mobile
- ✅ Supplementary pages (About, Current Projects, Timeline, Quotes)
- ✅ Image lightbox viewer for project media
- ✅ Semantic HTML structure with accessible navigation
- ✅ Fast load times with minimal dependencies (vanilla JavaScript)

### Open Items
- Mobile responsiveness refinement (minor layout improvements)
- Advanced filtering combinations (e.g., year + category simultaneously)
- Content consistency review (some project descriptions need updating)
- Social metadata (Open Graph tags for sharing)

---

## 6. Path Forward

### Near-Term Priorities

| Priority | Target Timeframe |
|----------|------------------|
| Refine mobile responsive layouts (tablet breakpoints) | Q1 2026 |
| Update project descriptions with current status | January-February 2026 |
| Add social sharing metadata (Open Graph tags) | February 2026 |

### Success Criteria
- ✅ All projects discoverable via search and filtering
- ✅ Mobile layout functional on all breakpoints
- ✅ Theme switcher persistent across page navigation
- ✅ Load time <2 seconds on typical connection
- ✅ Accessibility score (Lighthouse) >90

### Risks & Considerations

| Risk | Impact | Notes |
|------|--------|-------|
| Content staleness | Low | Projects are archived; static content mostly stable. Mitigation: quarterly review cycle. |
| Mobile layout complexity | Low | Responsive design adequate but not mobile-first optimized. Mitigation: refinements in Q1 2026. |
| Search performance at scale | Low | Current 17 projects perform well. Mitigation: if >100 projects, implement indexed search. |

---

## 7. Resources & Context

### Key Resources
- Vanilla HTML/CSS/JavaScript (no heavy frameworks)
- CSS Grid and Flexbox for responsive layouts
- localStorage for theme persistence
- Regular expressions for full-text search
- Semantic HTML for accessibility

### Dependencies
- Web hosting (static site, GitHub Pages compatible)
- Modern browser with ES2020+ support
- Lightweight image optimization (PNG/JPG)

### Related Work / References
- W3C Web Accessibility Guidelines (WCAG 2.1)
- CSS Flexbox and Grid specifications
- JavaScript DOM APIs and localStorage
- Responsive design best practices

---

*Revision History:*

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-01-30 | Cole Prather | Converted to 2-page template format; active maintenance status |
| 1.0 | 2026-01-27 | Cole Prather | Functionally complete with metadata enhancements |

---

**Overall Assessment:** The website is functionally complete and actively maintained. Core functionality is solid; recent work has focused on metadata enhancement (year tags) and content curation. The architecture is stable, mobile-responsive, and performs well. Minor improvements remain in content consistency and advanced filtering capabilities.

**What's Working:**

- **Archive system:** Year-based organization with toggle functionality allows rapid navigation through 8 years of projects. Archive sidebar is visually distinct and intuitive.
- **Search and filtering:** Full-text search across project titles, descriptions, and tags works smoothly. Tag-based filtering (category, year, keyword) is responsive and maintains URL/filter state through DOM manipulation.
- **Theme system:** Light/dark theme switcher is functional, persists to localStorage, and applies CSS variables consistently across all pages. No theme-switching glitches observed.
- **Responsive design:** Mobile layout (≤768px and ≤480px breakpoints) adapts gracefully. Sidebar collapses to top, project cards stack vertically, typography scales appropriately. No broken layouts in testing.
- **Project card structure:** Consistent visual design across all 17 project cards. Lightbox image viewer functions correctly. Hover effects and transitions are smooth.
- **Content quality:** About page is comprehensive and well-written. Research philosophy is clearly articulated. Current Projects page establishes forward trajectory with 7 active/in-development projects listed.
- **Performance:** Vanilla JavaScript (no heavy frameworks), minimal CSS, fast load times. No render-blocking resources detected. Navigation is snappy.

**What's Not Working:**

- **Year tags (recently fixed):** Year metadata was missing from project card displays until January 27, 2026. Now added but requires user cache-clear to appear. Public audience may not see tags without hard refresh.
- **Inconsistent project images:** Several project cards use placeholder image (`inference-matrix.png`) for multiple projects. Some projects lack images entirely or use low-resolution thumbnails. No image optimization (WebP, srcset, lazy-loading) implemented.
- **Missing project detail pages:** Archive shows 17 projects; only some have dedicated detail pages. Links point to `projects/[name].html` but some pages appear incomplete or are redirects. Navigation clarity breaks when clicking into projects.
- **Limited metadata structure:** Projects lack structured data (Schema.org, Open Graph). No SEO optimization for individual projects. No sharing metadata for social media previews.
- **Previous-work.html page:** Presumably exists but not reviewed in this assessment. Navigation path is present but not examined. Potential content gaps or inconsistency.
- **Timeline page incomplete:** Physics Timeline mentioned in navigation but not examined. Unclear if populated or functional.
- **Quotes page inconsistent styling:** Quotes use inline styles in hidden div; rendering may not align with modern theme system.
- **Tag styling ambiguity:** Year tags (newly added) are uppercase and capitalized like other tags, but lack visual distinction. Difficult to scan which tags are years vs. keywords. No semantic differentiation (color, badge style, prefix).

**Recent Progress:**

- **January 27, 2026:** Year tags added to all 17 project cards on homepage. JavaScript modified to prepend project year to tag list. Tags display inline with existing keyword tags but lack visual distinction.
- **January 27, 2026:** ECDO Watch data updated via Python script. All datasets (Kp, LOD, magnetometer) refreshed across 5 time ranges (30d, 90d, 1y, 5y, 10y). 17 JSON files committed to repository.
- **Recent commits show:** Focus on data freshness (geophysical monitoring), LOD signal fixes, multi-range dataset generation. Website structure itself stable without recent architectural changes.

---

## 4. Issues and Hurdles

### Active Issues

| Issue | Why It Matters | What We're Doing About It |
|-------|---------------|---------------------------|
| Unvisited project detail pages | Users click project links expecting detail pages; navigation breaks, creating frustration. 17 projects in archive but unclear which have functional detail pages. | Unclear—needs audit of all 17 project links to identify missing/broken pages. Recommend creating detail page template for consistency. |
| Year tag visual distinction | Year tags appear identical to keyword tags (uppercase, same styling). Users cannot quickly scan which tags are years vs. keywords. Metadata is present but not usable. | Could apply distinct color, badge style (e.g., outline vs. solid), or prefix (e.g., "[2025]" or "Year: 2025") to differentiate. Consider CSS class `.tag.year-tag`. |
| Missing or inconsistent project images | Multiple projects use the same placeholder image. Lightbox feature is present but underutilized. No image optimization. Reduces visual distinction and professionalism. | Audit all 17 projects; replace placeholders with real screenshots or project images. Implement lazy-loading and WebP with fallbacks. Generate consistent image sizing. |
| No metadata for social sharing | Projects cannot be shared with preview cards on social media. No structured data for search engines. Reduces discoverability and sharing potential. | Add Open Graph meta tags to project detail pages. Implement Schema.org JSON-LD for Project type. Would require modification to project detail templates. |
| Theme system incomplete on some pages | CSS inline styles on About, Current Projects, Quotes pages use hardcoded colors instead of CSS variables. When theme changes, these sections may not update consistently. | Refactor inline styles to use CSS custom properties (--text-primary, --bg-card, etc.). Test all pages with both themes. |

### Structural Hurdles

**Architecture simplicity vs. scalability:** The website is built with vanilla HTML/CSS/JavaScript. This is excellent for performance and maintainability, but as the archive grows (current 17 projects, potentially much more), managing static HTML files for each project becomes cumbersome. No build system, no templating engine, no CMS. Each new project requires manual HTML file creation and archive.json updates. This works at current scale but will become friction at 50+ projects.

**Data freshness for embedded projects:** ECDO Watch and The Cash Bubble include embedded data (JSON files, images) that must be regenerated and manually committed. The Python script for ECDO Watch data refresh exists and works, but the workflow is manual. No automated refresh (e.g., scheduled CI/CD pipeline). If data sources move or APIs change, the entire pipeline breaks.

**Mobile responsiveness edge cases:** While breakpoints are present, sidebar navigation on mobile is top-mounted, potentially consuming valuable screen real estate on small devices. Project cards at small sizes may have text overflow issues. No horizontal scroll locks tested on mobile devices. Consider landscape orientation on phones.

**Maintenance burden of quoted content:** The Quotes page contains 40+ quote entries with inline HTML in a hidden div. Sourcing, fact-checking, and attribution management is manual and error-prone. No way to filter or organize quotes by date added, theme, or verification status.

**Documentation gap:** No internal documentation of project structure, how to add new projects, how to update the archive, how to manage theme system changes. Knowledge is embedded in Cole's head and the codebase. If someone else were to maintain this site, onboarding would be difficult.

---

## 5. Goals and Next Steps

### Immediate Priorities (Next 2-4 Weeks)

1. **Audit and fix project detail pages:** Verify that all 17 linked projects have functional detail pages at their specified URLs. Fix broken links, incomplete pages. Document which projects are complete vs. stub pages.
2. **Distinguish year tags visually:** Modify CSS to apply a unique visual treatment to year tags (color, outline style, or prefix). Ensure users can quickly differentiate year metadata from keyword tags. Test in both light and dark themes.
3. **Standardize project images:** Replace placeholder images with real project screenshots. Ensure all 17 projects have appropriate 16:9 or similar aspect ratio images. Implement lazy-loading on lightbox images.
4. **Refactor hardcoded styles:** Audit About, Current Projects, and Quotes pages for hardcoded color values. Replace with CSS custom properties to ensure theme changes propagate correctly.

### Upcoming Milestones

| Milestone | Target Date | Dependencies/Notes |
|-----------|-------------|-------------------|
| Project detail page audit complete | 2026-02-03 | Identify all missing/broken pages; create list of what needs to be built or fixed. |
| Year tag visual distinction implemented | 2026-02-10 | Update CSS and test in both themes. Verify user testing or feedback that distinction is clear. |
| Project images standardized | 2026-02-17 | Collect/generate images for all 17 projects. Implement lazy-loading if not already present. |
| Add metadata for social sharing (Open Graph, Schema.org) | 2026-02-24 | Update project detail page templates with OG meta tags and JSON-LD. Test with social media preview tools. |
| Documentation: "How to Add a Project" guide | 2026-03-03 | Create step-by-step guide for adding new projects: directory structure, archive.json update, HTML template, linking. |

### Open Questions

- **Which of the 17 linked projects have missing or incomplete detail pages?** Need a comprehensive audit to identify gaps.
- **Should the site migrate to a static site generator (e.g., Jekyll, Hugo, Astro) for scalability?** Current vanilla HTML works, but as archive grows, maintainability becomes harder.
- **How should the ECDO Watch data refresh be automated?** Currently manual Python script; should it be scheduled (e.g., GitHub Actions cron job) or event-driven?
- **Is there interest in adding a filterable timeline view of all projects?** Archive shows years, but no chronological visualization of milestones/progress.
- **Should project pages support comments, discussion, or feedback mechanisms?** Or keep the site as a static read-only archive?
- **What is the target audience: potential employers, collaborators, students, or general public?** Changes metadata strategy and SEO priorities.

---

## 6. Timeline

**Start Date:** Unknown (site structure suggests gradual development since ~2017; recent updates through 2026)
**Target Completion:** Ongoing (active portfolio; no fixed end date)
**Current Projection:** On track (no major blockers; improvements are iterative)

### Key Phases

| Phase | Description | Timeframe | Status |
|-------|-------------|-----------|--------|
| **Foundation & Setup** | Initial site structure, CSS framework, basic navigation, theme system | 2024–2025 | Complete |
| **Content Curation** | Archive all 17 completed projects; write descriptions, gather materials; populate About page | 2025–2026 | Complete |
| **Feature Enhancement** | Search/filter, lightbox, responsive mobile design, year tags | Jan 2026 | In Progress |
| **Quality Polish** | Image standardization, metadata optimization, documentation, UX refinement | Feb–Mar 2026 | Upcoming |
| **Scalability Planning** | Evaluate static site generators, automation pipelines, content management approach | Mar–Apr 2026 | Upcoming |

### Schedule Risks

- **No critical path dependencies:** Site is self-contained; no external blockers (APIs, third parties).
- **Time allocation unclear:** Cole appears to manage website maintenance alongside active research. No dedicated timeline for improvements; updates are ad-hoc.
- **Large archive growth risk:** If projects grow from 17 to 50+, vanilla HTML approach becomes unmaintainable without refactoring. Recommend migration to static site generator before archive exceeds 25 projects.
- **Data refresh dependency:** ECDO Watch relies on external data sources (USGS, IERS, etc.). If APIs become unstable or change formats, refresh pipeline breaks. No automated error handling or fallback mechanisms.

---

## 7. Key Stakeholders and Resources

**Core Team:** Cole Prather (Owner, content curator, researcher, code maintainer)

**Decision Makers:** Cole Prather

**Key Dependencies:**
- External data sources for ECDO Watch (USGS magnetometer, IERS, KP index)
- GitHub repository hosting and CI/CD (if deployed)
- Web hosting provider (if not GitHub Pages)
- Browser compatibility requirements (currently supports modern browsers; no IE fallbacks observed)

**Budget/Resources:**
- Primarily sweat equity (Cole's time). No apparent hosting costs mentioned (likely GitHub Pages or similar free tier).
- Development tools: Text editor, Git, Python (for data scripts), browser dev tools.
- No external contractors or collaborators mentioned.

---

## 8. Context and References

**Background Reading:**
- [Peirastes website – Home page](file:///C:/Users/Cole/Dropbox/Website/index.html)
- [About page – Research philosophy and methodology](file:///C:/Users/Cole/Dropbox/Website/about.html)
- [Current Projects – Active research and pedagogical work](file:///C:/Users/Cole/Dropbox/Website/current-projects.html)
- [Project Overview Document Template](file:///C:/Users/Cole/Dropbox/Website/projects/project_overview_document_template.md)

**Related Projects:**
- ECDO Watch: Geophysical monitoring dashboard (2026)
- The Cash Bubble Hypothesis: Financial dynamics modeling (2026)
- Dynamical Systems Lab: Interactive physics visualization (2025)
- Multiple physics and engineering projects spanning 2017–2025

**Project Repository:**
- Local: `C:\Users\Cole\Dropbox\Website\`
- Remote: `https://github.com/Peirastes/website.git`
- Main files: `index.html`, `about.html`, `current-projects.html`, `css/style.css`, `js/main.js`
- Project details stored in inline JSON within `index.html` (projects-data script tag)

---

## Synthesis & Summary

The Peirastes website is a **well-designed, functional portfolio platform** that successfully archives and showcases 8 years of research. The architecture is clean, performant, and user-friendly. Recent work (year tags, ECDO Watch data refresh) demonstrates active maintenance and iterative improvement.

**Strengths:**
- Simple, elegant design without unnecessary complexity
- Responsive across devices; theme system works well
- Search and filter functionality is intuitive
- Rich contextual content (About, research philosophy) differentiates it from generic portfolios
- Fast load times; no bloat

**Near-term focus areas:**
- Verify all project detail pages are functional
- Visually distinguish year tags from keyword tags
- Standardize project images and implement optimizations
- Extend theme system to all pages

**Long-term considerations:**
- Plan for archive growth beyond 25 projects (may require static site generator)
- Automate data refresh pipelines (e.g., ECDO Watch)
- Add social media sharing support (Open Graph, Schema.org)
- Create documentation for maintainability

The site is **actively maintained and moving in the right direction.** No blocking issues; improvements are refinements that will increase polish and accessibility.

---

*This document provides orientation and assessment. Detailed implementation plans and technical specifications belong in ticket systems or task logs.*
