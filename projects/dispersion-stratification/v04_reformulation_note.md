# Reformulation Note for v0.4 — Throttled Cascade

This note replaces the wave-mechanics framing of v0.3 with a directed-transport framing. The thesis is unchanged: the form of the evolution equations is given, the coefficients are strategic. What changes is the operator. $\hat{H}_\theta$ is no longer a dispersive generator on a complex field; it is a leaky-cascade transport operator on a real-valued capability density indexed by hierarchical rank.

---

## 2. The Throttled Cascade Model

### 2.1 State and equation

Let $n \in \{0, 1, \ldots, N\}$ index rank in a knowledge/power hierarchy, with $n = 0$ the frontier and $n = N$ the periphery. Let $C_n(t) \in \mathbb{R}_{\geq 0}$ denote the capability level at rank $n$. The kinematic equation is

$$\frac{dC_n}{dt} \;=\; R_n(t) \;+\; \kappa_{n-1,n}\,(C_{n-1} - C_n) \;-\; \kappa_{n,n+1}\,(C_n - C_{n+1}) \;-\; \mu_n\,C_n$$

with boundary conditions $\kappa_{-1,0} = \kappa_{N,N+1} = 0$. Four parameter families do distinct work.

- **$R_n(t)$ — the innovation source.** Bimodal in the natural case: large and continuous at the frontier ($n = 0$); small and stochastic at the tail ($n = N$, "practical novelty without implementation capacity"); near-zero in the middle.
- **$\kappa_{n,n+1} \in [0, 1]$ — the throttle.** The strategic primitive. Symmetric in flow direction: the same throttle that keeps capability from leaking down also keeps innovation from migrating up.
- **$\mu_n$ — depreciation.** Knowledge ages; position erodes without maintenance.
- **Topology.** The chain itself can change. Ranks can be inserted, removed, or split. Throttles can be opened or closed.

### 2.2 Continuum limit (visualization-friendly)

For continuous visualization, the natural limit is

$$\partial_t C(x, t) \;=\; \partial_x\!\left[\kappa(x, t)\,\partial_x C(x, t)\right] \;+\; R(x, t) \;-\; \mu(x)\,C(x, t)$$

on $x \in [0, L]$. A parabolic PDE with strategic coefficient — well-posed, real-valued, no interference. The discrete chain is preferred for argumentation; the continuum form is preferred for the simulator.

### 2.3 Strain and stripes

The local gradient $C_{n-1} - C_n$ (equivalently, $-\partial_x C$) is the "stripe width" between adjacent ranks. Where $\kappa$ is small, capability piles up upstream and the gradient steepens — the stripe stretches. Where $\kappa$ is large, the gradient flattens — the stripe compresses. The visible pattern is a sequence of bands of varying width, evolving in time. A strategically engineered moat appears as a *kink* in the profile, not a smooth slope.

---

## 3. The Moat, Formalized

A moat is not a coefficient. It is a profile feature: a localized region of low $\kappa$ that concentrates the capability gradient at one position. Define

$$M(n^*, t) \;=\; \frac{C_{n^*}(t) - C_{n^*+1}(t)}{\sum_{n} \big|C_n(t) - C_{n+1}(t)\big|}$$

— the share of the total cumulative gradient concentrated at throttle $n^*$. A flat $\kappa$ profile gives $M \approx 1/N$ everywhere; a strategically engineered moat gives $M \to 1$ at one position.

In the steady state of a uniform chain with constant frontier rate $R$ and uniform $\kappa$, the profile is linear: $C_n = C_0 - n R/\kappa$. A strategic in-group at rank $n^*$ deviates from linearity by depressing $\kappa_{n^*, n^*+1}$ relative to its neighbors, producing a measurable kink. **The location of the kink identifies the in-group; its sharpness measures the strength of the moat.**

This makes weaponized underdetermination concrete. The out-group observes a possibly distorted profile $C_n^{\text{vis}}(t)$ and must infer $\kappa$. This is a one-dimensional inverse-coefficient problem of a kind well-studied in PDE-constrained optimization — and the in-group is shaping $C^{\text{vis}}$ adversarially. Weaponized underdetermination is the failure of identifiability under strategic distortion of the observable.

---

## 3'. The Three Consequences, Restated in Throttle Vocabulary

- **Strategic throttle.** $\kappa(t)$ is chosen by the in-group. The choice solves an optimization: minimize $\kappa_{n^*, n^*+1}$ subject to legitimacy and operational constraints.
- **Observer-dependent throttle.** The choice of $\kappa(t)$ depends on the out-group's belief $B(t)$ about the gap. When belief catches up, the in-group temporarily opens a *non-critical* throttle (Atoms for Peace: increase $\kappa_{1,2}$ while keeping $\kappa_{0,1}$ closed).
- **Regime shift = topology change.** Under threat, the in-group does not continuously adjust $\kappa$; it changes the chain itself. Insert a new rank (a new credential layer). Split a tier. Open a previously closed channel; close a previously open one. The kink relocates.

---

## 4. Architecture in Layers

The full theory has four layers, in order of timescale and decreasing v0.4 priority:

1. **Kinematic** (fast). The cascade equation above, given $\kappa$, $R$, $\mu$ as exogenous. v0.4 develops in full.
2. **Control** (slow). In-groups choose $\kappa(t)$ to optimize rent minus legitimacy cost. v0.4 sketches the single-in-group case with one worked example. Multiple in-groups deferred.
3. **Epistemic** (slow). Out-group infers $\kappa$ from $C^{\text{vis}}$; in-group distorts $C^{\text{vis}}$. v0.4 frames as inverse problem; full development deferred.
4. **Mobility** (very slow). Population distribution over ranks evolves; agents are displaced by capability shifts. v0.4 flags as forward-looking; deferred entirely.

The layered architecture is itself a contribution. It separates what the system *does* from how it is *steered* from how it is *perceived* from how its inhabitants *move within it*. Each layer is its own paper.

---

## 5. Case Studies, Restated

**Nuclear — single in-group, sharp persistent moat at $n^* = 0$.** Frontier capability concentrated at Los Alamos. After 1946, $\kappa_{0,1}$ collapsed by classification; $\kappa_{1,2}$ held moderate (university physics, civilian programs). Atoms for Peace increased $\kappa_{1,2}$ further to sustain the belief variable while $\kappa_{0,1}$ remained near zero. The kink at $n^* = 0$ persists eighty years later. **Bimodal-source prediction:** peripheral innovations (compact fission, beam physics, ICF) — did the frontier assimilate them, or did the moat block back-flow? The framework predicts the latter and the historical record can be checked.

**Elite higher education — social-rank cascade with topology changes.** The postwar GI Bill is a regime shift that *added a new rank* downstream of the elite tier, opening $\kappa_{1,2}$ massively. Standardized testing codified $\kappa_{0,1}$ into a measurable form. Holistic admissions then *recoded* $\kappa_{0,1}$ into illegible criteria, restoring the throttle through topology change rather than parameter change. Legacy / development / athletic preferences are throttle preservation through cosmetic reform.

**Frontier AI — multiple in-groups at $n^* \in \{0, 1\}$, fast clock.** 3–4 frontier labs at $n^* = 0$; elite-research-university social complex at $n^* = 1$; AI-engineering tier at $n^* = 2$; public at $n^* \geq 3$. Staged release modulates $\kappa_{0,1}$; the social-position throttle at $\kappa_{1,2}$ is maintained through credentialing and access. The framework predicts (a) the kink at $n^* = 0$ widening rather than narrowing despite apparent democratization, and (b) peripheral AI innovation (academic, open-source, international) assimilated *less* than at lower $\kappa$ — the cost the in-groups pay for the moat.

---

*— end of reformulation note, intended for §2–3 of v0.4 —*
