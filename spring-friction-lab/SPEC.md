# Spring–Friction Lab — SPEC

**One-line:** Interactive sim of a compressed spring trying to launch a block across a frictional surface — built to make the *negative-v²* teaching moment from PHY 2014 Ch 8 tangible. Slide the spring weak and watch it fail to break free; strengthen it and watch it fly.

**Origin:** Companion to `Professional/Instructor/PHY 2014 PSEI & Lab/.../Chapter 8/PSEI_Ch8_SpringFriction_Solution.tex` ("The Spring That Couldn't"). First app in the long-term *lecture-notes-on-the-web + embedded-sims* initiative.

## Physics (SI; g = 9.81)
- **Energy ledger over Δx:** Spring PE = ½kΔx² vs friction toll = μ_k·m·g·Δx.
- **Break-free (static) test:** launches iff `kΔx > μ_s·m·g`. Spring force is *greatest at release* and only weakens → single pass/fail, no ramp-up. μ_s ≥ μ_k enforced in the UI.
- **Lecture equation shown:** v² = (k/m)Δx² − 2μ_k·g·Δx ; d = v²/(2μ_k·g). A **negative v² is information, not an error** — it reports the motion never happens.
- **Animation:** forward Euler (dt = 3e-4) of `a = (F_spring − μ_k·m·g)/m` with `F_spring = k(Δx − s)` while in contact (s < Δx), then coast under −μ_k·g until v ≤ 0. Tracks max speed and coast distance d = s_stop − Δx.

## Controls
k (50–3000 N/m) · Δx (2–25 cm) · m (0.5–20 kg) · μ_k (0–0.6) · μ_s (0–0.8, clamped ≥ μ_k). Launch / Reset.

## Readouts
Energy bars (spring PE / friction toll) · spring peak push kΔx vs max static μ_s·m·g · launch speed² v² (red if < 0) · max speed · coast distance d · GO/NO-LAUNCH verdict banner.

## Defaults (the teaching hook)
k=200, Δx=10 cm, m=10, μ_k=0.30, μ_s=0.35 → **NO LAUNCH** (push 20 N < friction 34 N, v² = −0.39). Raising k toward ~2000 flips it positive (d = 0.24 m), matching the worked solution's "version that actually launches."

## Structure
Self-contained `index.html` (inline CSS + JS, KaTeX + Google Fonts via CDN) — embeddable in an iframe for lecture-note pages. **v1**, focused.

## Site integration (DONE 2026-06-26)
- **Cinematic outer chrome** applied to `index.html` — banner backdrop (`../images/PeirastesBanner.jpg`) + atmosphere + grain + floating chrome (`.cin-wordmark` / `.cin-title` SPRING·FRICTION LAB / `.cin-action` → all-projects / corner `.cin-tick`s). Chrome CSS+markup copied byte-equivalent from `kinematics-lab` per the v3.5 topology rule. The scrolling `.wrap` content sits beneath the fixed chrome (padding-top ~6.4rem).
- **Project page:** `projects/spring-friction-lab.html` — thin meta/OG + full-viewport iframe wrapper → `../spring-friction-lab/index.html` (electrostatics-lab pattern).
- **projects.json:** `project40`, `link: "projects/spring-friction-lab.html"`, status active / type simulator, published 2026-06-24, thumbnail `images/project_images/placeholder-spring-friction-lab.svg`.
- **sitemap.xml:** added.

## TODO / next
- [ ] Replace placeholder SVG thumbnail with a real screenshot when convenient.
- [ ] Optional: extract physics to `physics-core.js` to match kinematics-lab's SPEC+core+index split.
- [ ] Embed in the Ch 8 web lecture note once notes start migrating to the site.
- [ ] Deploy: commit + push the `Peirastes/website` repo (master) — Cole's call.
