# HANDOFF — The Apophenia Filter
**Project page + deployment on peirastes.com**

> ⚠️ **This is the original v0.4.0 design contract (2026-07-01).** It is still authoritative on
> methodology and invariants (§2, §5, §6, §7). For **current as-built status, architecture, and how
> to resume** — and for the deltas since v0.4.0 (Pi instead of Supabase, binomial classifier,
> Cinematic palette, optional accounts, v0.4.1) — read **`PROJECT_STATUS.md`**, which wins on
> as-built facts.

Version: 1.0 · Date: 2026-07-01 · Owner: Cole Prather (Peirastes)
Instrument version covered: v0.4.0
Audience: any agent with file access tasked with building the project page and/or deploying the instrument.

> **Read §7 (INVARIANTS) before changing anything.** This document summarizes; the owner adjudicates. If an instruction here conflicts with an "improvement" you want to make, the instruction wins until the owner says otherwise. Epistemic context for this project's conventions: the owner's AI Agent Philosophical Briefing and POD/PSR templates (null hypothesis discipline, "Not Wrong ≠ Correct," falsification-first). This project is an instance of that program.

---

## 1. PROJECT IDENTITY

- **Name:** The Apophenia Filter (Instrument 001)
- **One-line thesis:** A calibration-scored prediction game that separates genuine discrimination of structure from lucky guessing and apophenia (pattern perception firing on noise), by embedding known generative mechanisms with measured ground-truth ceilings.
- **Status:** Private pilot phase. NOT publicly deployed. Public launch is gated (see §8).
- **Origin:** Grew out of a stock-market prediction idea (Feynman's chess-rules framing: learn the rules of a system without knowing its author). Redirected into an epistemological instrument after recognizing that the founder's own pattern-recognition intuition was the first hypothesis requiring falsification.
- **Relation to owner's other work:** Structural sibling of the Exams-as-Diagnostic-Filters teaching philosophy (staged difficulty, effort/ability separation, instrument-vs-subject signal). Part of the On Dynamical Systems (ODS) research program. Candidate second platform for the assessment-instrument paper thread.

## 2. CONCEPTUAL FOUNDATION (COMPRESSED)

The page copy and any explanatory text must be consistent with these ideas:

1. **Three observers.** A trajectory is deterministic to a fully informed observer, random to an uninformed one, probabilistic to a partially informed one. The instrument measures the partially informed observer's inference capacity.
2. **The lucky forecaster problem.** Outcome track records cannot distinguish skill from luck (survivorship + multiple comparisons). Only calibration over many registered, scored predictions can. Hence Brier scoring, not win/loss counting.
3. **Exam-as-filter mapping.** Noise trials are the "easy exam": they isolate one variable (restraint/calibration). Sentinel trials are the instrument's self-check: an individual missing them is a subject signal; a population missing them indicts the instrument (the class-wide-jump rule).
4. **Abstention is skill.** On a martingale, the correct action is "no edge." The highest behavior the filter detects is knowing when not to predict.
5. **Ceilings, not perfection.** Every mechanism × tier has a Monte-Carlo-measured oracle ceiling (an observer that knows the latent state). Human scores are read against the ceiling, never against 100%.
6. **Quadrants.** A: Discriminator (sensitive + restrained). B: Calibrated-insensitive. C: Undecidable (sensitive but convicted on noise — perception or luck; only repetition resolves). D: Apophenic. Plus Unclassifiable (too few committed calls).

## 3. FILE MANIFEST (WHAT IS BEING HANDED OFF)

| File | Role |
|---|---|
| `apophenia-filter-v0-4.jsx` | The instrument. Single-file React component, default export, no props. This is the deployable artifact. |
| `tuning-harness.js` | Node script. Monte Carlo oracle/practical-observer accuracy per mechanism × tier. Run with `node tuning-harness.js`. Required for ANY parameter change (see §7). |
| `apophenia-filter-handoff.md` | This document. |
| (superseded) `apophenia-filter.jsx`, `-v0-2.jsx`, `-v0-3.jsx` | History only. Do not deploy. |

## 4. TECHNICAL SPEC

- **Stack:** React (hooks only), single file, no dependencies beyond React itself. Inline styles + one injected `<style>` tag. SVG chart, no chart libraries.
- **Fonts:** Space Grotesk (display) + IBM Plex Mono (data/UI) via Google Fonts `@import`. If the site self-hosts fonts, swapping the import for local `@font-face` is fine (visual parity required).
- **Build:** JSX must be compiled. If peirastes.com is a Vite/React site, drop in as a route/page component. If the site is static HTML, either (a) build a small Vite bundle for this page, or (b) convert to a single HTML file with a bundled build step — do NOT ship Babel-in-browser for production.
- **Mobile-first:** max-width 620px column; must remain fully usable on a phone. Test the confidence slider and SVG chart on iOS Safari specifically.
- **Accessibility floor:** visible keyboard focus (already styled), `prefers-reduced-motion` respected (reveal animation skips), buttons are real buttons.
- **No browser storage except:** `localStorage` keys `apophenia_pid` and `apophenia_codename`, both wrapped in try/catch with graceful in-memory fallback. Do not add other storage.
- **Config:** `CONFIG.CONTRIBUTE_ENDPOINT` and `CONFIG.API_KEY` at the top of the file. The Supabase anon key is safe to ship client-side ONLY with row-level security restricting the anon role to INSERT-only on the sessions table. Verify RLS before deploying a key.

## 5. GENERATIVE CORE (v0.4 PARAMETERS — DO NOT EDIT WITHOUT §7 PROCESS)

Trajectory: 60 visible steps (VIS), prediction over next 12 (FUT). Per-trial seed via mulberry32 → every trajectory exactly reproducible from `(seed, mech, tier, version)`.

| Mechanism | Model | Subtle | Standard | Sentinel |
|---|---|---|---|---|
| Momentum | dx = d + 0.7ε; d ← φd + 0.25η | φ=0.82 → **63%** | φ=0.92 → **73%** | φ=0.99 → **88%** |
| Mean reversion | dx = −k·x + ε; ±shock at step VIS−4 | k=0.04, no shock → **65%** | k=0.12, shock 1.5 → **73%** | k=0.12, shock 8 → **93%** |
| Regime | dx = s·μ + ε; s flips w.p. p per step | μ=0.30, p=0.06 → **66%** | μ=0.45, p=0.04 → **77%** | μ=0.90, p=0.01 → **94%** |
| Noise | dx = ε (martingale) | — ceiling 50% by construction — |

Bold numbers = **oracle ceilings** (Monte Carlo, N=30k, observer knows latent state). Stored in the component's `CEILING` table and shown in the report.

Known result worth preserving in copy: momentum's ceiling saturates ~88% at this horizon even with near-permanent drift — momentum is intrinsically the hardest class; not all sentinels are equal, and the instrument says so.

**Deck composition:** Full Lab (24): 9 noise + per structured mechanism {1 sentinel, 2 standard, 2 subtle}. Quick (12): 5 noise + 7 structured incl. 2 sentinels. Shuffled.

**PARAMS_HASH rule:** any change to generator parameters, deck composition, VIS/FUT, or scoring requires (1) re-running the tuning harness, (2) updating the `CEILING` table, (3) writing a new `PARAMS_HASH` string, (4) owner sign-off. Sessions with different hashes are never pooled in analysis.

## 6. SCORING, CLASSIFICATION, DATA

- **Actions:** UP / DOWN with confidence 55–95% (step 5), or NO EDGE (= 50%, abstain; correctness null, Brier 0.25).
- **Scoring:** Brier = (p_up − outcome)². Benchmark: perpetual abstainer = 0.250.
- **Quadrant thresholds (current):** sensitive = structured accuracy ≥ 0.60 with ≥3 committed calls; restrained = apophenia index ≤ 10 OR noise abstain rate ≥ 0.4. Unclassifiable if <3 committed structured calls.
- **Apophenia index:** mean (confidence − 50) on noise trials.
- **Payload schema (per contributed session):** instrument, version, paramsHash, sessionId, participantId, participantPersistent, codename|null, pilot(bool), sessionSize, startedAt, completedAt, summary{quadrant, meanBrier, structAcc, structN, noiseAcc, apopheniaIndex, abstainRateNoise, sentinelHit}, trials[{trial, seed, mech, tier, dir, conf, wentUp, brier, correct, rtMs}].
- **Identity semantics:** participantId = random token in localStorage (per-browser pseudonym; no linkage to any identity). Codename = optional, user-chosen, for cross-device continuity. NO names, emails, IPs, or accounts — do not add any.
- **Backend:** Supabase table `sessions(id uuid pk, received_at timestamptz default now(), payload jsonb)`; RLS on; anon role INSERT-only. Owner fills CONFIG.

## 7. INVARIANTS — DO NOT CHANGE WITHOUT OWNER SIGN-OFF

These carry methodological weight. "Improving" them breaks the instrument even if the page looks better.

1. **The disclosure screen is a fairness constraint, not copy.** Before any trial, participants must be told: the ~40% noise proportion, the three mechanism families and their tells, that abstaining is legitimate and scored, that sentinels exist, and that ceilings exist. This is the analog of "students must be told what to study." Rewording for tone is fine; removing or hiding information is not.
2. **Abstain is always available and always scored.** Never demote it to a skip.
3. **Mechanisms stay hidden until the final report.** No per-trial mechanism feedback in this version.
4. **Sentinels exist in every deck** and are reported with the instrument-vs-subject note.
5. **Parameters change only via the harness process** (§5 PARAMS_HASH rule). Never tune "by feel" or to any individual's performance — including the owner's.
6. **No identifiers in the research pool.** The anonymous research data must never carry names, emails, IPs, or any identity: no analytics that capture IP tied to sessions, no cookies beyond the app's localStorage keys, and no account/login coupled to a contributed session. **Optional accounts are permitted only as a strictly separate, opt-in, owner-facing convenience** (personal longitudinal history/dashboard) that (a) is not required to play or to contribute, (b) writes to its own per-user store — never to the anonymous research pool, and (c) adds zero identity to any research payload. The wall between the two systems is the invariant; the account layer must never become a channel that de-anonymizes a research session. *(Amended 2026-07-05 to reflect the optional-accounts feature; see `PROJECT_STATUS.md` §3.3.)*
7. **Pilot flag semantics:** pilot sessions are excluded from any analysis pool, permanently. The checkbox must remain visible on the intro screen.
8. **Contribution is opt-in, post-hoc, and honest:** button appears only after the report, consent microcopy states exactly what is sent, download is available regardless of contribution.
9. **Scores are read against ceilings.** Never present accuracy as if 100% were achievable.

## 8. DEPLOYMENT GATES (SEQUENCE)

1. **NOW — private pilot:** page built but unlisted/unlinked (or behind an obscure URL). Owner + one friend bug-test with pilot flag ON. Checklist: all-abstain session renders Unclassifiable; rapid-fire session; mid-session refresh (session lost cleanly, pid survives, codename repopulates); mobile Safari slider + chart; contribute with unconfigured endpoint (honest error), with bad key (failed → retry works); JSON download opens and contains every trial's seed and `pilot: true`; seed reproducibility spot-check (regenerate one trajectory from its seed, confirm identical).
2. **Before public launch:** owner sends IRB inquiry to UCO (anonymous, uncompensated, public web-based behavioral task; no identifiers; pseudonymous participant IDs; opt-in post-task data contribution; minimal risk). Public data collection intended for publication starts only after determination. If no paper is ever intended, this gate relaxes — but the owner has explicitly chosen letter-first sequencing to keep the option open.
3. **Public launch:** endpoint configured, RLS verified, PARAMS_HASH frozen, page linked from site nav/projects.

## 9. PAGE REQUIREMENTS

- **URL:** `peirastes.com/apophenia-filter` (or owner's routing convention).
- **Structure:** short framing section above the embedded instrument, instrument, then a "How it works / Read more" section below. Do not bury the instrument below long copy — it should be reachable within one scroll on mobile.
- **Framing copy draft (adapt tone, preserve claims):**
  > *Think you can read the market? Most conviction is spent on noise. The Apophenia Filter deals you trajectories from hidden mechanisms — momentum, mean reversion, regime shifts — shuffled among pure martingales with nothing in them. Call the next move, or admit you have no edge. The instrument scores your calibration, not your bravado. Luck cannot hold calibration across repetition; that is the entire design. The inventor took the test first. He got a D.*
- **Honesty note:** the "He got a D" line refers to a session on the pre-retuning v0.2 instrument (whose momentum sentinel was later shown to be near-impossible); if used, either retest on v0.4 and update, or phrase as "the first prototype handed its inventor a D."
- **Below-the-fold content (pull from §2):** the three observers, the lucky-forecaster problem, exam-as-filter mapping, ceilings table (§5), quadrant definitions, and a data/privacy statement (pseudonymous, opt-in, what the payload contains).
- **Meta/SEO:** title "The Apophenia Filter — can you tell structure from noise?"; description drawn from the framing copy. Standard og tags. No third-party trackers (see invariant 6).
- **Design:** the instrument's own palette (ink #0B1220, brass #E8C468, trace cyan #7FB4C9) should govern the page so the embed doesn't sit in a mismatched frame. Match the owner's site conventions where they exist.

## 10. ROADMAP (NOT IN SCOPE FOR THE PAGE BUILD — DO NOT IMPLEMENT UNPROMPTED)

- v0.5 candidates: feedback-learning mode (per-trial mechanism reveal, to test whether the "rules of chess" can be learned); machine baselines (Kalman/particle filter + small NN run through the identical protocol via seeds); longitudinal per-participant calibration curves; adaptive/adversarial mechanism mode (reflexivity, Goodhart).
- Paper skeleton (parked): motivation (lucky forecaster, unfalsifiable backtests) → instrument (mechanism families, ceilings) → scoring theory (Brier, abstention as first-class) → human study (d′, apophenia rate, quadrants) → machine baselines → market data as one uncontrolled test case, reflexivity as the stated transfer limit.

## 11. RECIPROCAL ASKS BACK TO OWNER

1. Confirm hosting stack for peirastes.com (Vite/React vs static) — determines embed method in §4.
2. Stand up Supabase project and provide CONFIG values (or delegate with the RLS requirement stated in §4/§6).
3. Retake the test on v0.4 and rule on the "He got a D" line (§9).
4. Send the IRB email before gate 3; file the response with this project.
