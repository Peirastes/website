# Project Handoff: *Dispersion and Stratification*

**For:** continuing this work in a new chat session
**From:** Peirastes (Cole Prather) and a prior Claude session
**Date of handoff:** April 2026
**Current paper draft:** v0.3
**Current simulation:** Stage 2 (tri-mode)

---

## 0. How to use this document

This brief is a self-contained context dump. A fresh Claude session should be able to read it and continue substantive work without the user re-explaining the project from scratch. Read all of Sections 1–3 before doing anything; Sections 4–7 are reference material to consult as needed.

Two companion files in `/mnt/user-data/outputs/` (or wherever the user provides them) accompany this brief:

- `dispersion_paper_v3.md` (or `.docx`) — the current paper draft
- `dispersion_sim_v3.html` — the current simulation

If either is not available, this brief is still comprehensive enough to reconstruct the project state and continue useful work.

---

## 1. One-paragraph summary of the project

The project is a paper plus an accompanying interactive simulation that together propose treating social and technological stratification as a **dispersive wave phenomenon with a strategically-controlled medium**. The mathematical backbone is dispersive wave propagation (position-space field ψ with a dispersion relation ω(k)); the novel move is that ω(k) is not nature-given but *chosen* by an in-group of agents with differential power, and the paper works out three consequences of that move that have no analog in standard physics (observer-dependent, adversarial, and regime-switching dispersion). A second layer couples two fields — technological capability and social position — to model cumulative advantage (Matthew effect) as a transport mechanism rather than a statistical regularity. The paper sits at the intersection of dynamical systems, control theory, differential game theory, and the epistemology of adversarially-maintained regularities, and is framed as a case study within the author's larger research program on intrinsic–extrinsic coupling in dynamical systems (*On Dynamical Systems*, peirastes.com).

---

## 2. Who the user is, briefly

The user, Peirastes (Cole Prather), is an engineering physics instructor at the University of Central Oklahoma. Key things to know for calibrating responses:

- Strong physical intuition, hands-on iterative working style.
- Interdisciplinary interests: computational physics, systems theory, philosophy of science, game theory (informally).
- Maintains peirastes.com; builds browser-based simulations as a regular practice (fluid sim, optics lab, Orion Time, PhysicaFlow, etc.).
- Has a larger treatise *On Dynamical Systems* (2026) centered on the claim that observable behavior is the product of an intrinsic response and an extrinsic drive, with a formal underdetermination result.
- Prefers concise, thoughtful responses. Has explicitly asked the prior session to slow down and not pile ideas rapid-fire. Takes time to read and reflect between exchanges.
- Uses an epistemological framework called PSCPR (Probabilistic/Skeptical Claim–Premise Reasoning) and a posture of *ethical skepticism*. These are not decoration — they inform how he engages with claims, including claims made by Claude.
- Appreciates structured but not mechanical thinking. Willing to pause for the right question rather than charge into the wrong build.

---

## 3. Current state and recent history

### What's done

- **Paper v0.3** is a full rewrite from the v0.2 draft. The load-bearing thesis was sharpened and the structure tightened from ~14 pages to ~8.
  - Primary thesis: strategic-ω gives the framework its distinctive content ("nature gives the form of the equations, nurture gives the coefficients"); stratification is the domain of application.
  - Three consequences of strategic ω (observer-dependent, adversarial, regime-switching) are in the main text as subsections 3.2–3.4, not an appendix.
  - Adversarial epistemology is named as a fourth-corner discipline (alongside dynamical systems, control, differential game theory) and "weaponized underdetermination" is a secondary framing thread.
  - Three case studies: nuclear (single-field), elite higher education (social-field with regime shifts), AI (fully coupled, contemporary, with falsifiable predictions).
  - The paper is explicitly positioned as *a case study within* the larger ODS research program rather than a freestanding piece. Section 6.1 develops this connection.
  - Scott's *Seeing Like a State* is cited in §3.3 as part of the adversarial-epistemology intellectual family.

- **Simulation Stage 2** has three modes behind a tab switcher, sharing one physics engine.
  - Mode A (Control Game): user plays the in-group, drags β(t) live, belief B(t) and legitimacy tracked. Time-series panel plots Δ, B, β.
  - Mode B (Historical Arcs): scripted regime shifts playback. Three arcs: nuclear, elite higher ed, AI. Timeline strip with markers and narrated events.
  - Mode C (Adversarial Observer): true ω(k) vs. out-group's inferred ω(k), with least-squares fit to windowed COM tracking of intensity. A caveat box explicitly notes the inference is a stylized stand-in, not a faithful cognitive model.

### What the user said most recently

Before requesting this handoff brief, the user had just received Stage 2 and was about to review/iterate on both the paper and the simulation. No specific feedback has been given on Stage 2 yet. The previous session explicitly flagged expected refinements: tuning belief/legitimacy coefficients in Mode A for appropriate difficulty, adjusting arc timings and descriptions in Mode B, and potentially refining the Mode C inference to make the residual more visually dramatic.

### What exists as files

- `dispersion_paper_v3.docx` — Word document, ~8 pages, validated.
- `dispersion_paper_v3.md` — Markdown equivalent with LaTeX-style math (`$$...$$`).
- `dispersion_sim_v3.html` — Single-file HTML/JS simulation, tri-mode, ~60 KB.
- Prior drafts (v0.1, v0.2 of paper; v1, v2 of simulation) also in outputs for reference.

---

## 4. The thesis in precise form

The framework makes the following structural claim about social and technological stratification.

**Intrinsic side (nature).** Stratification of capability or position in a population is governed by evolution equations of dispersive-wave type, acting on scalar complex fields ψ(x, t) whose squared moduli |ψ|² represent local intensity of capability or position. For two coupled fields (technology ψ_t and social position ψ_s), the equations are:

```
i ∂_t ψ_t = Ĥ_t ψ_t + γ ψ_s
i ∂_t ψ_s = Ĥ_s ψ_s + γ ψ_t
```

with single-field dispersion operators Ĥ = v₀·(-i∂_x) - α·(-i∂_x)² - β·(-i∂_x)³, giving dispersion relation ω(k) = v₀·k - α·k² - β·k³ and group velocity v_g(k) = v₀ - 2α·k - 3β·k².

**Extrinsic side (nurture, in the strong sense).** The coefficients (v₀, α, β, γ) of these equations are not nature-given constants. They are the residue of strategic activity by a subset of agents (the in-group) who have access to control levers the out-group does not. Strategic choice determines the medium's qualitative properties; the equations' form is merely the vessel. This is the paper's load-bearing claim.

**Three consequences of strategic ω that have no analog in standard physics** (Section 3):

1. *Observer-dependent dispersion*: the in-group's choice of β(t) is a function of the out-group's belief B(t), which in turn is a function of a visible signal Δ_vis the in-group partially controls. Neither is exogenous; each is a fixed point of the other.
2. *Adversarial dispersion*: β and Δ_vis are shaped to produce specific misperceptions. The in-group benefits when the out-group models the medium as symmetric (β=0) while β > 0 is sustained. This is "weaponized underdetermination" — the in-group exploits the structural underdetermination proved in ODS by actively routing out-group causal attributions into the wrong factorization.
3. *Regime-switching dispersion*: under extraordinary pressure, the in-group does not continuously adjust β but introduces a new modality of control (new classification, new credential, new institutional layer). Ĥ jumps rather than drifts, triggered by strategic state rather than physical state.

**Interpretation of the wavenumber.** Low-k modes are long-wavelength, codified, transferable content (textbooks, protocols, public credentials). High-k modes are short-wavelength, tacit, textural content (proprietary process, informal networks, institutional membership texture). A positive β preferentially suppresses high-k modes — the exact content hardest to democratize.

**Coupling effects.** The γ term between ψ_t and ψ_s produces (a) *co-stratification* — the cross-correlation ρ rises toward 1 as fields lock into the same band structure; (b) *amplification* — band separation faster than the sum of independent rates (Matthew effect as transport); (c) *joint control* — the in-group's problem is (β_t, β_s, γ) together, narratives of meritocracy in both channels are alternative presentations of the same Δ_vis.

**Self-stratifying belief.** Out-group members internalize their position and refrain from pursuing access even absent formal barriers (Bourdieu's habitus; Hoxby–Avery 2013). Formally this is B feeding back into β itself. This mechanism operates primarily in the social field but, through γ, sustains technology moats at modest β_t values.

---

## 5. Paper structure, v0.3

Sections and what each does:

- **Abstract + Intro (§1)** — Frames the four-way intersection (dynamical systems / control theory / differential game theory / adversarial epistemology) and states the nature/nurture thesis.
- **§2 Single-field dispersion model** — Sets up ψ, ω(k), group velocity, wavenumber interpretation. Brief connection to ODS notation ∂_t u = Ĥ_θ u + S(x,t) at section's end.
- **§3 Strategic control** — Subsections:
  - §3.1 The move — ω(k) is chosen, not given.
  - §3.2 Observer-dependent dispersion + belief dynamics.
  - §3.3 Adversarial dispersion — weaponized underdetermination, cryptography/coevolution family, Scott (1998).
  - §3.4 Regime-switching dispersion — discontinuous changes triggered by strategic state.
- **§4 Coupled fields** — Tech/social coupling, three effects (co-stratification, amplification, joint control), self-stratifying belief.
- **§5 Case studies** — Three focused vignettes:
  - §5.1 Nuclear (single-field, strong β, weak γ).
  - §5.2 Elite higher education (social-field with institutional β-control and regime shifts — all three §3 consequences visible).
  - §5.3 Frontier AI (coupled fields in real time, four falsifiable predictions).
- **§6 Discussion**:
  - §6.1 Relation to ODS (the dedicated subsection — positions this paper as a case study within the larger program).
  - §6.2 What the framework gets right / what it leaves unmodeled.
  - §6.3 Closing — nature/nurture spine, Tesla/Morgan counterfactual.

Citations: Akerlof, Bourdieu, Chetty et al., DiPrete & Eirich, Hoxby & Avery, Merton, Prather (ODS 2026), Rhodes, Schelling, Scott, Spence.

---

## 6. Simulation architecture

### Physics engine (shared across all three modes)

- Two complex scalar fields ψ_t and ψ_s on a 1D grid of N=512 points, domain length L=200.
- Time step dt=0.04, using **Strang splitting** for second-order accuracy: half-step dispersion (Fourier space) → full-step coupling (real-space 2×2 rotation at angle γ·dt) → half-step dispersion.
- FFT is an in-place radix-2 Cooley–Tukey implementation inline in the script (no external libs).
- Dispersion applied in Fourier space: each mode rotated by phase −ω(k)·dt where ω(k) = v·k − α·k² − β·k³.
- Initial condition: Gaussian packets of widths σ_t=16, σ_s=20 centered at x₀ = 0.2·L.
- Packets auto-reset when COM exits the right 85% of the domain (to avoid edge wrap artifacts).
- Cross-correlation ρ between |ψ_t|² and |ψ_s|² computed each render as Pearson correlation.

### Mode A — Control Game

- β₁ slider becomes "live" (the user's strategic lever); other parameters set via usual sliders.
- New state: out-group belief B(t), updated by dB/dt = −γ_B(B − Δ_vis) + 0 (noise omitted for cleanliness).
- Δ_vis = visBleed · Δ, where Δ is the true frontier gap (tech lead − social lead).
- Rent accumulates at rate 0.5·Δ. Legitimacy erodes at rate 0.15·|Δ−B|; slow recovery when mismatch small.
- Status banner with four states: stable / low rent warning / eroding / collapse-imminent.
- Time-series panel plots Δ (gold), B (green), β(t) (orange, top strip).
- Presets: "Open" (Tesla-ish), "Cumulative Advantage" (moderate), "Closed Moat" (aggressive).

### Mode B — Historical Arcs

- Arcs are declarative objects: `{ name, title, duration, events: [{ t, label, desc, setParams }] }`.
- Engine fires events when arc time crosses the event's t. setParams applies via slider updates.
- Three arcs scripted:
  - Nuclear (40 time-units, 7 events from 1945 to 2026).
  - Elite higher ed (40 time-units, 6 events from 1945 to present).
  - AI (36 time-units, 6 events from 2017 to 2026).
- Timeline strip shows markers, progress bar, and narrated description of most-recent event.

### Mode C — Adversarial Observer

- Records intensity history |ψ_t|²(x, t) every ~3 steps, keeps last 20 snapshots.
- Inference procedure: window the intensity at 5 fractional positions of the domain, compute windowed center-of-mass at first and last snapshots, estimate group velocity v_g per window, map windows to a synthetic k (low-k for front windows, high-k for rear — this encodes the tacit-vs-codified interpretation).
- Least-squares fit of v_g(k) = v̂₀ − 2α̂k − 3β̂k² via normal equations, 3x3 Gaussian elimination.
- Auxiliary panel shows true ω(k) (solid gold) and inferred ω(k) (dashed tan) over k ∈ [0, 1.6], with the L² residual shaded and reported.
- **Explicit caveat in the UI**: inference is stylized, not a faithful cognitive model. Qualitative behavior (inference underestimates high-k suppression, diverges under regime shifts) is what's honest.
- Three presets: benign (low β), static moat (high fixed β), adversarial (moderate β with implied oscillation from user interaction).

### UI conventions worth preserving

- Dark paper background (`#0c0d10`), warm (tech / `#e07a3c`) and cool (soc / `#6ea4c4`) field coloring throughout.
- Typography: Cormorant Garamond (serif body/italic), JetBrains Mono (UI labels, data readouts).
- Gold accent (`#c89b3c`) for the strategic/control dimension; purple (`#a670c9`) for coupling; green (`#6ec48a`) for out-group belief.
- Status banner convention: neutral = muted, warning = plain, alert = orange-red.
- Mode-specific show/hide via `body[data-mode]` CSS attribute selectors.

---

## 7. Relation to the larger ODS research program

*On Dynamical Systems* (Prather, peirastes.com) establishes across five physical domains a unified evolution equation:

```
∂_t u = Ĥ_θ u + S(x, t)
```

with intrinsic operator Ĥ_θ and extrinsic drive S. Its central result (§IX) is a structural underdetermination theorem: the product structure of intrinsic response × extrinsic drive means causal attribution cannot be resolved from observation alone. Controlled experiment or independent measurement is required to break the ambiguity.

ODS closes with an explicit forward-flag:

> "When the extrinsic drive is no longer independent of the intrinsic response — whether through self-interaction, feedback, or coupling to other dynamical systems — the product structure itself becomes state-dependent, and the clean factorization that underwrites both the framework's universality and its epistemic limits requires generalization. The underdetermination does not disappear — it deepens, because one can no longer cleanly define the partition one is trying to resolve."

The stratification paper is a case study within the program that makes this generalization concrete in one domain. Specifically:

- The dispersion relation's coefficients (β, γ, etc.) are part of the intrinsic operator Ĥ_θ, but they are *shaped by strategic choice* — a form of extrinsic drive. So Ĥ_θ is no longer independent of S. This is the "state-dependent partition" ODS points to.
- Moreover, one of the agents (the in-group) *actively exploits* the underdetermination ODS proves. The in-group benefits from keeping the out-group's causal attribution in the wrong factorization. This is the "weaponized underdetermination" framing in §3.3 of the paper.

The positioning chosen (user's explicit choice) is "case study within the ODS program," not "completion of the program's extension." This paper does not claim to provide a general theory of state-dependent partitions; it provides one worked instance of the kind of case ODS points toward.

---

## 8. Known open questions and natural next steps

These were flagged during the previous session as directions the paper or sim could grow. None has been committed to; the user will choose which to pursue.

### Paper

- **Optimal-control formulation of β*(t)** — A Hamilton–Jacobi–Bellman treatment of the in-group's control problem would strengthen §3 for technical readers. Tractable as a stochastic OC problem with partial observation of B.
- **Multi-in-group extension** — Current model has one in-group; real fields often have competing in-groups. Natural but adds significant game-theoretic machinery.
- **Narrative channel as a third coupled field** — Currently Δ_vis is treated as a function the in-group can shape. A fuller treatment models it as its own dispersive field coupled to both ψ_t and ψ_s.
- **Empirical fitting of (β_t, β_s, γ)** to historical data, checking whether inferred values correlate with known institutional structures.
- **Generational boundary** — Many of the interesting control decisions happen at generational transitions; current model is continuous-time without this structure.
- **Possible elevation of strategic-ω to primary thesis** — User paused on this question earlier. Current v0.3 has strategic-ω as load-bearing but framed as "mechanism for stratification" rather than "the paper is about a new kind of wave mechanics." A future revision could make the latter framing the center of gravity, reducing stratification to domain of application.

### Simulation

- **Tune Mode A difficulty** — Current belief/legitimacy coefficients chosen by feel; playtesting may reveal the game is too easy or too punishing.
- **Adjust Mode B arc timings / descriptions** — User may want to revise event wording, add/remove events, or adjust the parameter jumps.
- **Improve Mode C inference** — Current heuristic is honest but not visually dramatic enough when β is oscillating. Options: (a) better phase-recovery-adjacent fitter, (b) explicit animation of the inferred ω updating in real time with visible lag, (c) add a second axis showing the inferred-parameter trajectory over time.
- **Screenshot export for paper figures** — No export functionality yet; adding download-as-PNG for each panel would let the sim generate paper figures directly.
- **Stage 3 possibilities mentioned earlier** — Two-player game (in-group vs. out-group with counter-control); narrative channel as a third visible field; regime-shift triggering by scripted out-group rediscovery events (rather than timed).

### Deeper / more speculative

- **Is the strategic-ω move generalizable across ODS domains?** The paper applies it to the social/technological medium specifically. Could a similar strategic-coefficient treatment be done for any ODS case where one party has access to control levers? (E.g., pharmacology pricing + regulatory β?)
- **Cryptographic analog**: formalize the inference problem in Mode C as an indistinguishability game, connecting to the adversarial-epistemology framing in §3.3.
- **Connection to PSCPR**: the user's own epistemic framework (ethical skepticism + probabilistic skeptical claim-premise reasoning) sits naturally alongside adversarial epistemology. An essay-length treatment of this connection could be a companion piece.

---

## 9. Working-style notes for continuing the project

These are observed preferences from the prior session; calibrate accordingly.

- **Pace**: The user has explicitly asked not to be overwhelmed. Shorter, more focused responses; substantive single points rather than comprehensive dumps. When in doubt, offer a structured choice via `ask_user_input_v0` rather than writing three paragraphs of unsolicited recommendation.
- **Decision-making**: The user likes to pause and think between moves. Do not push for immediate decisions on structural questions; state the options, say what you'd pick and why in a sentence or two, and wait.
- **Technical register**: The user is physics/engineering-fluent. Math is welcome. Don't over-explain wave mechanics or basic dynamical systems. Do explain social-science citations or game-theory terms when first introduced.
- **Building**: Build when asked; sketch when exploring. Before major structural code or paper changes, confirm the target. The user has several browser-based sim projects and reads HTML/JS fluently.
- **Tool use**: When creating documents, read the relevant SKILL.md first (docx, frontend-design, etc.). When fetching URLs, prefer web_fetch over paraphrasing from memory — ODS in particular has specific content that matters.
- **Honesty**: The user values intellectual honesty over comfortable agreement. If a proposed move is wrong or a previous response was too long, say so plainly. Don't puff up.
- **Structure preference**: Prose over bullet-heavy responses, *except* when laying out options or enumerating features where bullets genuinely help. Headers for longer structured documents are fine; avoid them in conversational replies.

---

## 10. Quick reference: what to do on first message

If the next session opens with "let's continue" or similar without specific direction, the reasonable defaults are:

1. Ask the user what they want to work on: iterate on the paper (v0.3 → v0.4), iterate on the simulation (Stage 2 → Stage 3 or polish), or pursue one of the open questions in §8 above.
2. Do not re-propose structural changes that were already decided (e.g., don't re-suggest elevating strategic-ω to primary thesis unless the user raises it — they paused on this deliberately).
3. Do not re-explain the framework unless asked; it's in this document and in the paper.

If the next session opens with specific direction, proceed with that and consult this document only as needed.

---

*End of handoff brief. The paper and simulation files accompany this document.*
