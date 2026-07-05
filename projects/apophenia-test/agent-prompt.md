# AGENT PROMPT — Apophenia Filter project page build

Copy everything below the line into the agent's task, alongside the three files.

---

## ROLE & MISSION
You are building the project page for **The Apophenia Filter** on peirastes.com. Three files accompany this prompt:

1. `apophenia-filter-handoff.md` — **GOVERNS.** Read it first, and read §7 (Invariants) before touching anything.
2. `apophenia-filter-v0-4.jsx` — the deployable instrument. A single-file React component, default export, no props.
3. `tuning-harness.js` — the parameter guard. You should not need to run it for this task; if you believe you do, stop and ask, because it means you are about to change something §7 forbids.

## AUTHORITY
The handoff document governs. Where this prompt and the handoff conflict, the handoff wins. Where both are silent, ask — do not invent. The nine invariants in §7 carry methodological weight: they are not UX preferences, and "improving" them breaks the instrument even if the page looks better. None may be altered without my explicit sign-off.

## SCOPE — GATE 1 ONLY
Build the **private pilot deployment** (handoff §8, gate 1): an unlisted page, not linked from navigation or sitemap, fully functional end-to-end. `CONFIG.CONTRIBUTE_ENDPOINT` may remain empty for now — the contribute button must honestly report "endpoint not configured," which is its designed behavior.

Explicitly out of scope — do not do these even if they seem helpful:
- Public launch, nav links, sitemap entries, or announcements
- Anything in §10 (roadmap features)
- Any change to generator parameters, deck composition, scoring, or thresholds
- Analytics, trackers, cookies, or any identifier collection (§7.6)
- Restructuring the instrument's internal logic or state machine

## SEQUENCE — locate yourself before you solve
1. Read the handoff in full. Read the v0.4 source in full.
2. Inspect the site repository. Determine the hosting stack and select the correct embed method per handoff §4 (React route vs. small dedicated bundle).
3. **Report back before building.** Provide: (a) a one-paragraph restatement of the mission in your own words; (b) the stack you found and your integration plan; (c) any conflict between the site's existing conventions and the handoff; (d) any part of your plan that touches a §7 invariant; (e) open questions. Wait for my go.
4. Build the page per handoff §9: brief framing section above the fold, the instrument reachable within one scroll on mobile, methodology and data/privacy content below. The instrument's palette governs the page frame. Adapt the framing copy draft — and respect the honesty flag on the "He got a D" line: use the "first prototype handed its inventor a D" phrasing unless I have supplied a v0.4 retest result in this conversation.
5. Execute the §8 gate-1 bug checklist yourself in a dev environment wherever possible (all-abstain session, rapid-fire session, mid-session refresh, mobile viewport, unconfigured-endpoint behavior, JSON download contents including per-trial seeds and `pilot: true`, and the seed-reproducibility spot check). Report results item by item; mark anything you could not test and why.
6. Deliver: the unlisted route/URL, a list of files changed, the checklist results, and the handoff §11 items that still require me (Supabase CONFIG, IRB email, D-grade retest ruling).

## DEFINITION OF DONE
An unlisted, mobile-tested page where a full pilot session completes end-to-end; the JSON download works and contains every trial's seed and `pilot: true`; all nine §7 invariants verifiably intact; nothing public-facing changed anywhere else on the site.

## STYLE & JUDGMENT
Match peirastes.com's existing conventions where they exist; follow handoff §9 otherwise. When you are torn between "better" and "specified," implement *specified* and raise *better* as a written suggestion for my review. Improvements proposed: welcome. Improvements silently implemented: the failure mode this entire prompt exists to prevent.
