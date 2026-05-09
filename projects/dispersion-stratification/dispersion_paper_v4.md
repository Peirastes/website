# Dispersion and Stratification

## *Nature, Nurture, and the Strategic Shaping of a Medium*

**Cole Prather (Peirastes)** · Draft v0.4, May 2026

---

> **Abstract.** This paper sits at the intersection of dynamical systems, control theory, differential game theory, and the epistemology of adversarially-maintained regularities. Its central proposal is that the mathematics of directed transport on a hierarchical chain — with the conductance of each transition treated as a strategic variable — provides a unified framework for understanding how technological and social stratification emerge and persist. Nature provides the form of the cascade equation; nurture, in the strong sense of strategic choice by agents with differential power, provides the throttle profile that determines how capability flows from the frontier to the periphery. We develop the field-layer model, formalize the *moat* as a localized concentration of the capability gradient, name three consequences of treating the throttle as strategic, situate the framework within a four-layer architecture (kinematic / control / epistemic / mobility), and apply it to three case studies: the nuclear arc, elite higher education, and frontier artificial intelligence. The paper is framed as a worked instance within the author's larger research program on intrinsic–extrinsic coupling in dynamical systems.

— • —

## 1. Introduction

Stratification is the characteristic shape of any long-lived technology or social order. What begins localized at an origin becomes, over time, a sequence of attenuated forms ordered by distance from that origin. The front retains the original advantage; the rear retains a narrative of the original advantage and, often, the belief that it is converging on it. This is true of nuclear physics, of elite universities, of access to frontier artificial intelligence. The shape recurs too often to be coincidence.

This paper proposes that the recurrence is structural, that the structure has the mathematical form of directed transport through a hierarchical chain, and that the chain in question is not nature-given but strategically shaped. The proposal sits at the intersection of four disciplines. Dynamical systems provides the evolution equations; control theory, as a subfield, introduces agents who can steer trajectories but cannot reason about other agents; differential game theory extends this to reflexive settings in which each agent's optimum depends on the other's, which is a genuine second-order effect (the fixed point of mutual best-responses is nonlinear even when the underlying dynamics are linear); and the epistemology of adversarially-maintained regularities — a frame that includes cryptography, coevolutionary biology, and the more recent machine-learning notion of adversarial robustness — supplies the conceptual tools for doing science on a system whose regularities are being actively shaped against the observer.

**The central thesis.** Nature provides the form of the cascade equation that governs the propagation of capability through a hierarchy of ranks. This is the intrinsic side. The throttle profile that gates the flow between adjacent ranks — together with the source distribution and depreciation — is not nature-given. It is the residue of strategic choices by agents with differential power. This is the extrinsic side, in the strong sense: nurture, not as perturbation to a nature-given baseline, but as the substance determining the chain's qualitative properties. The observable patterns of stratification are the joint product.

This framing inherits its mathematical backbone from a larger program on intrinsic–extrinsic structure in dynamical systems (Prather 2026). That program establishes a general result: when a system's observable behavior arises as the joint action of an intrinsic operator and an extrinsic drive, causal attribution is structurally underdetermined — the product carries less information than its factors. The stratification paper is a case study of what happens when the intrinsic operator is no longer independent of the extrinsic drive but is itself shaped by strategic choice, and when the resulting underdetermination is actively exploited by one of the agents. That exploitation — what we will call *weaponized underdetermination* — is the secondary thread running through the paper, supporting rather than displacing the throttle mechanics that constitute its primary contribution.

The paper is structured as follows. Section 2 develops the throttled-cascade kinematic model and formalizes the moat. Section 3 introduces strategic control of the throttle profile and names three consequences with no analog in standard transport theory. Section 4 situates the contribution within a four-layer architecture (kinematic / control / epistemic / mobility) and identifies which layers this paper develops, which it sketches, and which it defers. Section 5 applies the framework to three case studies. Section 6 discusses the framework's relation to the larger research program and its limits.

---

## 2. The Throttled Cascade Model

### 2.1 State and equation

Let $n \in \{0, 1, \ldots, N\}$ index rank in a knowledge/power hierarchy, with $n = 0$ the frontier and $n = N$ the periphery. Let $C_n(t) \in \mathbb{R}_{\geq 0}$ denote the capability level at rank $n$ at time $t$. The kinematic equation is

$$\frac{dC_n}{dt} \;=\; R_n(t) \;+\; \kappa_{n-1,n}\,(C_{n-1} - C_n) \;-\; \kappa_{n,n+1}\,(C_n - C_{n+1}) \;-\; \mu_n\,C_n$$

with boundary conditions $\kappa_{-1,0} = \kappa_{N,N+1} = 0$. Four parameter families do distinct work.

- **$R_n(t)$ — the innovation source** at rank $n$. Bimodal in the natural case: large and continuous at the frontier ($n = 0$); small and stochastic at the tail ($n = N$, "practical novelty without implementation capacity"); near-zero in the middle.
- **$\kappa_{n,n+1} \in [0, 1]$ — the throttle** between adjacent ranks. The strategic primitive of the entire framework. Symmetric in flow direction: the same throttle that gates downstream propagation also gates upstream backflow.
- **$\mu_n$ — depreciation.** Knowledge ages; position erodes without maintenance.
- **Topology.** The chain itself is not fixed. Ranks can be inserted, removed, or split; throttles can be opened or closed.

### 2.2 Continuum limit

For continuous analysis the natural limit is

$$\partial_t C(x, t) \;=\; \partial_x\!\left[\kappa(x, t)\,\partial_x C(x, t)\right] \;+\; R(x, t) \;-\; \mu(x)\,C(x, t)$$

on $x \in [0, L]$, a parabolic PDE with strategic conductivity $\kappa(x, t)$. Real-valued, no oscillation, no interference. The discrete chain is preferred for argumentation; the continuum is preferred for visualization and for connection to the broader literature on inverse-coefficient problems.

### 2.3 Strain

The local gradient $C_{n-1} - C_n$ (equivalently, $-\partial_x C$) measures the capability *step* between adjacent ranks. Where $\kappa$ is small, capability piles up upstream and the step steepens — adjacent ranks pull apart in capability terms. Where $\kappa$ is large, the step flattens. The visible profile across all ranks is a sequence of steps of varying size. A strategically engineered moat appears as a *kink* in the profile, not as a smooth slope.

### 2.4 The moat, formalized

A moat is not a coefficient. It is a profile feature: a localized region of low $\kappa$ that concentrates the capability gradient at one position. We define

$$M(n^*, t) \;=\; \frac{C_{n^*}(t) - C_{n^*+1}(t)}{\sum_{n} \big|C_n(t) - C_{n+1}(t)\big|}$$

— the share of the total cumulative gradient concentrated at throttle $n^*$. A flat $\kappa$ profile gives $M \approx 1/N$ everywhere; a strategically engineered moat gives $M \to 1$ at one position.

In the steady state of a uniform chain with constant frontier rate $R$ and uniform $\kappa$, the profile is linear: $C_n = C_0 - n R/\kappa$. A strategic in-group at rank $n^*$ deviates from linearity by depressing $\kappa_{n^*, n^*+1}$ relative to its neighbors, producing a measurable kink. **The location of the kink identifies the in-group; its sharpness measures the strength of the moat.**

### 2.5 The bimodal source: a falsifiable prediction

Innovation sources peak at both ends of the hierarchy: continuously at the frontier (where capability concentrates and feeds new work) and intermittently at the tail (where novel ideas occasionally appear without implementation capacity). The middle is largely silent. This bimodal structure, together with the *symmetry* of the throttle, produces a prediction that has no analog in unidirectional transport models. A throttle restrictive enough to protect frontier rent against downstream leakage is also restrictive enough to block tail-to-frontier backflow of peripheral innovations. Strong-moat regimes therefore systematically *miss* peripheral innovation. This is the first sharp falsifiable claim of the framework, and Section 5 will check it against the historical record.

---

## 3. Strategic Control of the Throttle

### 3.1 The move

In standard transport physics, $\kappa$ is a property of the medium, given by the physics and discovered by experiment. In the framework of this paper, $\kappa$ for the medium through which technological capability propagates is *chosen*. The coefficients are not nature-given constants but the residue of strategic activity by a subset of agents — the in-group — who have access to control levers the out-group does not. The in-group's problem is to choose a trajectory $\kappa(t)$ that optimizes its objective. The resulting throttle profile is a *negotiated object*, and any attempt to model it as nature-given misses what it is.

This is a small mathematical modification. It is a larger conceptual one. Once $\kappa$ is strategic, three consequences follow that have no analog in standard transport mechanics.

### 3.2 Observer-dependent throttle

The in-group's choice of $\kappa(t)$ depends on what the out-group believes. When the out-group develops tools to measure the capability gap, the in-group revises $\kappa$ — or, more often, revises the publicly visible signal $C^{vis}$ that the out-group's beliefs track — to frustrate the measurement. In ordinary transport theory the conductivity of a medium does not care whether it is being observed. In *strategic* transport, it does. The observer's epistemic state is a parameter of the dynamics — a feature the framework inherits from its game-theoretic structure rather than from transport mechanics proper.

Formally: let $B(t)$ denote the out-group's belief about the gap. Then the in-group's optimal $\kappa$ is a function $\kappa^*(t;\,B(t))$, and the belief dynamics

$$\frac{dB}{dt} = -\gamma_B\,(B - \Delta_\text{vis}) + \xi(t)$$

close the loop. Neither the in-group's policy nor the out-group's belief is exogenous; each is a fixed point of the other.

### 3.3 Adversarial throttle (weaponized underdetermination)

The in-group does not merely conceal the throttle profile. It shapes $\kappa$ and the visible profile $C^{vis}$ to produce specific misperceptions in the out-group's model of the dynamics. If the out-group believes the chain is uniform, they will predict eventual convergence between frontier and rear. An in-group that benefits from sustained stratification benefits from allowing this belief to persist while maintaining a sharp kink at $n^*$. The throttle profile is chosen, in part, to be *adversarial* with respect to the out-group's inference procedure.

This is the point at which the paper's secondary thread — adversarial epistemology — enters with the most force. The underdetermination theorem of Prather (2026) establishes that passive observation cannot separate intrinsic response from extrinsic drive when behavior is their joint product. In the non-strategic case this is an epistemic obstacle that controlled experiment can overcome. In the strategic case the obstacle is being *actively exploited*. The in-group does not merely benefit from the underdetermination of the intrinsic-extrinsic partition; it manufactures that underdetermination, and it does so in ways designed to route the out-group's causal attribution into the wrong factorization. Narratives of meritocracy, of natural selection within competitive markets, of the inherent difficulty of frontier work — each is a candidate wrong factorization that the in-group has reason to sustain.

The throttle framing makes the inversion concrete. Given an observed visible profile $C^{vis}$ and assumed knowledge of $R$ and $\mu$, the steady-state estimator is

$$\hat\kappa_{k,k+1} \;=\; \frac{\sum_{n \le k} R_n - \mu \sum_{n \le k} C^{vis}_n}{C^{vis}_k - C^{vis}_{k+1}}.$$

This is exact when $C^{vis} = C$. When the in-group strategically distorts $C^{vis}$ — for example, presenting the chain as a smooth gradient when in fact it has a kink at $n^*$ — the inferred $\hat\kappa$ becomes biased in a way that flattens the moat. **Weaponized underdetermination is the gap $\|\kappa - \hat\kappa\|$ as a metric.** It places the framework in a specific intellectual family: alongside cryptography, in which adversaries shape security parameters against the cryptanalyst; alongside host–pathogen coevolution, in which selection pressure maintains regularities against the observer's probes; alongside Scott's (1998) analysis of state-constructed legibility. What these settings share is that the regularities are not nature-given but actively maintained, and that the standard tools of passive science are systematically insufficient for them.

### 3.4 Regime shift: topology change

The third consequence concerns what the in-group does when ordinary throttle adjustment is insufficient to preserve its position. Under most conditions, $\kappa(t)$ varies smoothly: the in-group fine-tunes the moat in response to slow changes in out-group capability or belief. Under extraordinary conditions — when the out-group is about to catch up, when a leak is imminent, when a counter-narrative threatens to collapse $B$ — the in-group does not continuously adjust $\kappa$. It changes the *topology* of the chain. A new rank is inserted, a tier is split, a previously-closed channel is opened to relieve pressure, a previously-open one is closed to seal a leak. This is the analog of what strategic theorists call "changing the game" rather than "changing a parameter of the game."

Topology changes are discontinuous: the cascade operator jumps rather than drifts. They are triggered by strategic state (threat to rent, threat to legitimacy) rather than by physical state. They are entirely characteristic of historical stratification arcs, as Section 5 will show.

---

## 4. The Architecture in Layers

The full theory has four layers, in order of timescale and decreasing priority for the present paper.

1. **Kinematic** (fast). The cascade equation of Section 2, given $\kappa$, $R$, $\mu$ as exogenous functions. This paper develops the kinematic layer in full.
2. **Control** (slow). One or more in-groups choose $\kappa(t)$ to optimize an explicit objective: rent at $n^*$ minus a legitimacy cost. The single-in-group case admits a clean formulation as a constrained optimization; the multi-in-group case is a coupled-strategy game whose equilibrium concept matters. This paper sketches layer 2 with a single in-group; the multi-in-group extension is forward-looking.
3. **Epistemic** (slow). The out-group infers $\kappa$ from the visible profile $C^{vis}$; the in-group distorts $C^{vis}$ adversarially. This is a one-dimensional inverse-coefficient problem under an adversarial observation channel — a setting with a known structure in the PDE-constrained optimization literature. This paper frames the inverse problem and identifies it as the operational locus of weaponized underdetermination; full identifiability analysis is forward-looking.
4. **Mobility** (very slow). A particle layer of agents who occupy ranks, sample the local capability, and migrate slowly when their rank's capability shifts. The kinetic-theory dual representation — *field for information, particles for people* — is the natural home for AI-driven employment displacement, generational social mobility, and the long-timescale population reorganization that capability shocks induce. This paper flags the mobility layer; it is the next paper.

The layered architecture is, by itself, a contribution. It separates what the system *does* (kinematic) from how it is *steered* (control) from how it is *perceived* (epistemic) from how its inhabitants *move within it* (mobility). Each layer is a research program in its own right.

---

## 5. Case Studies

### 5.1 Nuclear: single in-group, sharp persistent moat at $n^* = 0$

The nuclear arc is the clearest case of single-in-group throttle control. The initial packet was established at Los Alamos in 1943–1945 with extraordinarily narrow concentration: the working knowledge of implosion-device engineering was held by perhaps a hundred people. The throttle profile was imposed by the Atomic Energy Act of 1946, by compartmentalized classification, and by the unreproducible texture of weapons metallurgy — collapsing $\kappa_{0,1}$ to near zero. The 1953 Atoms for Peace program executed credible partial disclosure: it opened $\kappa_{1,2}$ substantially, sustaining the belief variable at high value while the frontier throttle remained closed. Band separation followed predictably: Soviet Union 1949, United Kingdom 1952, France 1960, China 1964, India 1974, Pakistan in the 1980s, North Korea 2006. Eighty years after Trinity, the kink at $n^* = 0$ persists and the lead band has not been crossed.

The bimodal-source prediction of §2.5 is testable here. Compact-fission devices, beam-physics innovations, and inertial confinement fusion have historical loci outside the frontier weapons community. The framework predicts that the strong $\kappa_{0,1}$ throttle has systematically blocked back-flow assimilation of these peripheral innovations into the lead-band programs. The historical record is broadly consistent with this prediction; quantifying it would be a productive empirical project.

### 5.2 Elite higher education: social-rank cascade with topology changes

Elite higher education in the United States from 1944 to the present is the clearest case of topology change as the in-group's primary tool, and it displays all three of the Section 3 consequences. Before 1944 the system was narrow: a small elite tier with the downstream throttles effectively closed (no mass higher-education tier of any consequence). The GI Bill is best modeled as a topology change: it *activated a downstream tier* that had previously been near-zero, opening $\kappa_{1,2}$ massively and sustaining the belief that the system was meritocratic and broadly accessible. The number of Americans in higher education increased by an order of magnitude; meanwhile, the frontier throttle $\kappa_{0,1}$ was preserved.

The lead-band institutions did not stand still; they executed a sequence of further topology changes. Standardized testing codified $\kappa_{0,1}$ into a measurable form (a legible criterion, partially democratizable). The subsequent shift to holistic admissions *recoded* $\kappa_{0,1}$ into illegible criteria (re-tightening the throttle through the structure of measurement rather than its level). Cultivation of legacy, development, and athletic preferences preserved incumbent access through dedicated channels. Each of these was a discontinuous change in the cascade operator triggered by strategic state rather than by continuous parameter drift. The adversarial-throttle phenomenon of §3.3 is visible: applicants from non-elite backgrounds systematically underapply to elite institutions even when admission probabilities and financial aid structures are known to them to be favorable (Hoxby and Avery 2013). The self-stratifying belief feedback is large, and it is doing work the explicit $\kappa$ does not need to do.

### 5.3 Frontier artificial intelligence: multiple in-groups, fast clock

Artificial intelligence, circa 2017–2026, exhibits the dynamics with unusual clarity and on a timescale short enough to be observed within a single career. Three to four frontier laboratories occupy $n^* = 0$ in nested but mostly non-competitive positions. The elite-research-university complex occupies $n^* = 1$ as a social-position throttle: who is invited early to a new model, who sits on advisory councils, who is acknowledged on capability-defining work, who is credentialed as having worked at the frontier. The broader AI-engineering tier occupies $n^* = 2$ — the public at $n^* \ge 3$.

The frontier throttle $\kappa_{0,1}$ has narrowed steadily through staged release, compute moats, and credential gating. The intermediate throttles have been opened in coordinated waves — the GPT-3 staged release of 2020 and ChatGPT public access in 2023 are textbook Atoms-for-Peace moves. The framework predicts: (a) the kink at $n^* = 0$ widens rather than narrows despite apparent democratization; (b) the social-position throttle at $\kappa_{1,2}$ is doing more of the work than the explicit technological throttle, which can therefore be maintained at modest levels; (c) the symmetric-throttle prediction implies that strong-moat frontier labs should be systematically missing peripheral AI innovation (academic, open-source, international) — paying that as the cost of the moat.

These are falsifiable on a one-to-five year timescale. The case is unusual in that we can watch the predictions develop in real time rather than reconstruct them from the historical record.

---

## 6. Discussion

### 6.1 Relation to the larger research program

This paper is a case study within an ongoing research program on intrinsic–extrinsic coupling in dynamical systems (Prather 2026). That program develops, across five physical domains, a unified evolution equation $\partial_t u = \hat{H}_\theta u + S(x, t)$ in which an intrinsic operator and an extrinsic drive jointly generate observable behavior, and proves a structural underdetermination result: the intrinsic–extrinsic partition cannot be resolved from the observed trajectory alone. The present paper takes up a specific extension the program flags at its close: cases in which the extrinsic drive is no longer independent of the intrinsic operator. Strategic choice of the throttle profile is exactly this case — the coefficients of the cascade operator are themselves shaped by the same agents whose choices also appear in the observable, which means the partition between intrinsic and extrinsic has become state-dependent in the way the program identifies as requiring generalization. The stratification case is useful because it makes that generalization concrete and testable in a specific domain, and because one of the agents in the coupled system is actively exploiting the very underdetermination the program proves.

### 6.2 Reformulation note

This is the second draft. The first draft (v0.3) framed the kinematics as dispersive wave propagation with a strategic dispersion relation $\omega(k)$. After critical review, that framing was abandoned: the dispersion analogy carried weight it had not earned (a complex-valued field with no interpretable interference, a Fourier decomposition into "codified vs tacit" that was asserted rather than derived, a coupled-fields structure that did not survive operationalization of the rank axis). The present framing — directed transport on a hierarchy with strategic conductance — preserves the central thesis (form is intrinsic, coefficients are strategic) while making every load-bearing piece either definable or measurable. Strategic shaping of $\kappa$ is the kind of object the framework was reaching for; dispersive wave propagation was the wrong vehicle.

### 6.3 What the framework gets right, and what it does not

The framework captures three features that simpler adoption-curve accounts miss: the widening of the frontier-to-public gap over time rather than its closing; the coexistence of apparent democratization with persistent and sometimes increasing stratification; and the symmetric-throttle prediction about peripheral innovation, which has empirical content. It also provides natural homes for self-stratifying belief, regime-switching control via topology change, and adversarial narrative management.

The framework leaves much unmodeled. Capability is treated as a real-valued scalar at each rank, which is an abstraction. The single-in-group analysis of §3 is restrictive; real fields typically have multiple competing in-groups whose interactions shape the throttle profile in ways this paper does not represent. The narrative channel is handled functionally rather than structurally; a full treatment would model $C^{vis}$ as its own dispersive field coupled to the observable. The mobility layer — agents migrating between ranks under capability shocks — is sketched but not developed. None of these is a fatal omission, but each marks a direction the framework can be extended in.

### 6.4 Closing

The framework is a claim about shape, not about necessity. Stratification on the pattern described here is what happens *when strategic incentives are followed*. The historical counterfactual — Tesla wanting a uniform $\kappa$ profile while Morgan wanted a sharp moat — is a standing reminder that the throttle profile is chosen. Open-source movements, commons-based governance, and the long arc of scientific publishing each represent arrangements with systematically more uniform $\kappa$ than the closed default. What the framework tells us is where to look if we want to understand why most arrangements are not of this kind, and what would need to change for them to be. Nature sets the form of the cascade; nurture, in the strong sense, sets the throttles — and it is the throttles, far more than the form, that determine how stratified the medium will be.

---

## References

- Akerlof, G. A. (1970). The Market for "Lemons": Quality Uncertainty and the Market Mechanism. *Quarterly Journal of Economics* 84(3): 488–500.
- Bourdieu, P. (1977). *Outline of a Theory of Practice*. Cambridge University Press.
- Chetty, R., Hendren, N., Kline, P., and Saez, E. (2014). Where is the Land of Opportunity? The Geography of Intergenerational Mobility in the United States. *Quarterly Journal of Economics* 129(4): 1553–1623.
- DiPrete, T. A., and Eirich, G. M. (2006). Cumulative Advantage as a Mechanism for Inequality. *Annual Review of Sociology* 32: 271–297.
- Hoxby, C. M., and Avery, C. (2013). The Missing "One-Offs": The Hidden Supply of High-Achieving, Low-Income Students. *Brookings Papers on Economic Activity*.
- Merton, R. K. (1968). The Matthew Effect in Science. *Science* 159(3810): 56–63.
- Prather, C. (2026). *Describing the Structure of Dynamical Systems: A Unifying Mathematical Framework*. peirastes.com/projects/on-dynamical-systems.html.
- Rhodes, R. (1986). *The Making of the Atomic Bomb*. Simon and Schuster.
- Schelling, T. C. (1960). *The Strategy of Conflict*. Harvard University Press.
- Scott, J. C. (1998). *Seeing Like a State*. Yale University Press.
- Spence, M. (1973). Job Market Signaling. *Quarterly Journal of Economics* 87(3): 355–374.

---

*— end of draft v0.4 —*
