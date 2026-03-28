# Unified Project Page Template — Design Spec
**Author:** CD Agent
**Date:** 2026-03-28
**Status:** Ready for CE implementation

---

## 1. Design Intent

One template for all written content on peirastes.com — treatises, discourses, and hybrids. The page is a container with optional zones. The Pipeline IDE (or manual authoring) populates the zones that fit. Empty zones are absent, not hidden.

The template retains full site chrome (header, nav, footer) since these are content pages, not instruments. Instrument apps have their own minimal-wrapper pattern.

---

## 2. Class Name Mapping

| Old | New | Notes |
|-----|-----|-------|
| `.treatise-body` | `.content-body` | The prose wrapper. Max-width 800px, centered. |
| `.discourse-content` | `.content-body` | Same class — no structural difference. |
| `.pub-meta` | `.page-meta` | Publication metadata (treatise flavor: Published, Updated, Status). |
| `.venue-meta` | `.page-meta` | Presentation metadata (discourse flavor: Venue, Date, Audience). |
| All other classes | Unchanged | `.abstract`, `.toc`, `.media-embed`, `.driving-question`, `.specs-grid`, `.cross-links`, `.download-row`, `.download-btn`, `.cross-link-card`, `.spec-card` — all keep their names. |

Only two renames. Everything else stays.

---

## 3. Zone Ordering (top → bottom)

The template lists every zone as a commented HTML block. Pages include only what they need — delete unused zones.

```
<head>
  ├── Meta / OG tags
  ├── <!-- QUARTO_CSS_START / END -->        ← always present (empty if no Quarto)
  ├── style.css (after Quarto CSS)
  ├── Unified inline <style> block
  ├── <!-- QUARTO_JS_START / END -->         ← always present
  └── main.js

<body>
  ├── <header> site header
  ├── <nav> site nav
  ├── <div class="content"><main>
  │     ├── [ZONE 1] .media-embed            ← optional (video/PDF/slides)
  │     ├── <section class="project-detail">
  │     │     └── <div class="content-body">
  │     │           ├── <h2> Page title
  │     │           ├── [ZONE 2] .abstract           ← optional
  │     │           ├── [ZONE 3] .page-meta           ← optional (flexible items)
  │     │           ├── [ZONE 4] .toc                 ← optional (collapsible)
  │     │           ├── [ZONE 5] .driving-question    ← optional
  │     │           ├── [ZONE 6] QMD_CONTENT_START/END ← optional (Quarto injection)
  │     │           ├── [ZONE 7] .specs-grid          ← optional (2-col data)
  │     │           ├── [ZONE 8] .download-row        ← optional
  │     │           └── [ZONE 9] .cross-links         ← optional (related work)
  │     │
  ├── <footer>
  └── Lightbox overlay
```

**Rationale for ordering:**
- **Media embed sits outside `.content-body`** — it's wider (900px max vs 800px body) and precedes the text.
- **Abstract → metadata → TOC** — mirrors the reading order of an academic paper (summary, provenance, navigation).
- **Driving question** comes after TOC but before body text — it's the hook.
- **QMD content** is the main body prose (injected or manual).
- **Specs grid** is supplementary structured data, after the main text.
- **Downloads and cross-links** close the page.

---

## 4. CSS Merge Strategy

### 4.1 Identical rules (keep once under `.content-body`)
- Max-width, padding, font-size, line-height
- h2: Cinzel 600, 1.6rem, accent border-bottom
- h3: Cinzel 500, 1.25rem, secondary color
- p: text-align justify, 1rem margin-bottom
- blockquote: accent left border, tinted background
- figure / figcaption: centered, shadow, muted italic
- table: collapse, card background, accent header
- .math.display: horizontal scroll
- Responsive breakpoints (768px, 480px)

### 4.2 Treatise-only rules (keep as-is)
- h4: Lato 700, 1.05rem (Discourse never used h4 — harmless to include)
- `.abstract`: accent left border, card background
- `.toc`: collapsible details, Cinzel summary, accent marker
- Bootstrap neutralization (`:root` override, header/nav box-sizing reset)
- Quarto-specific: `.math.display` tinted box, `.callout`, `.quarto-title-block`, `.header-section-number`, `#quarto-appendix`, hr styling

### 4.3 Discourse-only rules (keep as-is)
- `.media-embed`: 900px max, responsive iframe (70vh / 50vh / 40vh)
- `.driving-question`: italic, accent left border, card background
- `.specs-grid` + `.spec-card`: 2-column grid, accent left border

### 4.4 Renamed rules
- `.pub-meta` / `.venue-meta` → `.page-meta` (identical styling between the two — flex wrap, card background, border-radius 8px, `.meta-item`, `.meta-label`, `.meta-download`)

### 4.5 What gets cut
- Nothing. All CSS stays. The ~20% "unique" rules are harmless when their corresponding HTML zones are absent. No dead CSS to clean up — unused selectors cost nothing.

---

## 5. `.page-meta` — Flexible Metadata Block

One class, variable content. The HTML inside changes per page type:

**Treatise flavor:**
```html
<div class="page-meta">
    <div class="meta-item"><span class="meta-label">Published:</span> <span>2026-01-15</span></div>
    <div class="meta-item"><span class="meta-label">Last Updated:</span> <span>2026-03-20</span></div>
    <div class="meta-item"><span class="meta-label">Status:</span> <span>Published</span></div>
    <div class="meta-item" style="margin-left:auto">
        <span class="meta-label">Download:</span>
        <a href="#" class="meta-download" title="Download PDF" download>&#x2B07;</a>
    </div>
</div>
```

**Discourse flavor:**
```html
<div class="page-meta">
    <div class="meta-item"><span class="meta-label">Venue:</span> <span>NCUR 2018</span></div>
    <div class="meta-item"><span class="meta-label">Date:</span> <span>April 4, 2018</span></div>
    <div class="meta-item"><span class="meta-label">Audience:</span> <span>Undergraduate researchers</span></div>
    <div class="meta-item" style="margin-left:auto">
        <span class="meta-label">Download:</span>
        <a href="#" class="meta-download" title="Download PDF" download>&#x2B07;</a>
    </div>
</div>
```

Same class, same styling. The labels are just HTML text — no CSS distinction needed.

---

## 6. MathJax

Include MathJax in the template `<head>` unconditionally:
```html
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml-full.js" type="text/javascript"></script>
```
Pages that don't use math incur a ~200KB load but no rendering cost. This is acceptable — most content pages on peirastes.com are mathematical. If performance becomes a concern later, CE can lazy-load it behind a class check.

---

## 7. Template Name

`PROJECT_PAGE_TEMPLATE.html` — matches `projects/` directory convention. Not `CONTENT_PAGE` (too generic), not `UNIFIED_PAGE` (implementation detail). A project page is what it is.

---

## 8. What This Spec Does NOT Cover

- Restyle to Style Guide v2.1 tokens (separate CE task, Priority 3)
- Pipeline IDE publish workflow changes (CE task, in the plan)
- Cross-links content decisions (which pages link where — editorial task, not template design)
- Cash Bubble hybrid page (excluded from this template)
- Instrument app pages (already on minimal wrappers)

---

## 9. CE Implementation Notes

1. **Start from `TREATISE_PAGE_TEMPLATE.html`** — it's the superset (has Quarto zones, Bootstrap neutralization, abstract, TOC). Add Discourse zones to it.
2. **Two renames only:** `.treatise-body` → `.content-body`, `.pub-meta` → `.page-meta`
3. **Add media embed zone** above `.content-body` (outside the 800px wrapper, inside `<main>`)
4. **Add driving question and specs grid** inside `.content-body`, in the order specified above
5. **Move `.media-embed` CSS** from Discourse template into the unified `<style>` block
6. **Delete `DISCOURSE_PAGE_TEMPLATE.html`** after migration
7. **Page migration is class rename + zone normalization** — not a rewrite. Most pages need only `s/treatise-body/content-body/` and `s/pub-meta/page-meta/` (or `s/venue-meta/page-meta/` and `s/discourse-content/content-body/`).
