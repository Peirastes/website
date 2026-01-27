# Project Overview Document (POD): Peirastes Website

> *"The astute investigator is much more effective in seeking to increase the reliability of probative information, than by attempting to increase the probative nature of reliable information."*
> — The Ethical Skeptic

---

**Project:** Peirastes Research & Portfolio Website
**Owner:** Cole Prather
**Last Updated:** 2026-01-27
**Status:** Active

---

## 1. What This Project Is

The Peirastes website is a research portfolio and archive platform designed to showcase scientific and engineering work spanning physics, dynamical systems, control theory, and applied mathematics. The site serves as both a professional portfolio and a knowledge repository, presenting projects across an 8-year span (2017–2026) with curated descriptions, supporting materials, and educational resources.

The platform embodies the peirastic philosophy defined on its About page—"one who tests or tries"—functioning as a living archive that documents both completed research and active investigations. Rather than serving as a static resume, it provides intellectual context: exploring why problems matter, how they were approached, where assumptions fail, and what remains robust under scrutiny.

The website aggregates three primary content streams: (1) an archive of past projects organized by year, (2) current research and pedagogical projects in active development, and (3) supplementary content including a physics timeline and curated quotes reflecting the investigative philosophy. The technical architecture prioritizes simplicity, accessibility, and semantic clarity—using vanilla HTML/CSS/JavaScript without heavy frameworks, ensuring fast load times and maintainability.

---

## 2. Main Objectives

| Objective | Success Looks Like | Status |
|-----------|-------------------|--------|
| Archive and present 17 completed research projects with clear descriptions and supporting materials | Projects are discoverable, well-organized by year, and accessible via search/filter | Complete |
| Enable users to explore projects by year, category, and keyword using an intuitive interface | Archive sidebar functions smoothly, search is responsive, filters work reliably | Complete |
| Communicate research philosophy and methodology through About section and project descriptions | About page clearly explains peirastic approach; each project articulates its testing methodology | Complete |
| Support light and dark theme preferences with persistent user settings | Theme switcher is functional, state persists across page navigation, CSS variables update correctly | Complete |
| Maintain responsive design across desktop, tablet, and mobile viewports | Layout adapts properly at breakpoints (768px, 480px); no horizontal scroll or layout issues | In Progress |
| Display project metadata including publication year, category, and keyword tags for filtering | Year tags recently added to project cards; filtering by year, category, and keywords works | In Progress |
| Provide secondary pages (About, Current Projects, Timeline, Quotes) with consistent navigation | All pages accessible, navigation functional, content properly formatted | Complete |

---

## 3. Current Status

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
