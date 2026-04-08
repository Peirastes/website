# Social Field Theory — Mathematical Formalism

**Author:** Cole Prather
**Date:** 2026-04-08
**Status:** Working draft — foundation for simulator implementation

---

## 1. State Space

### 1.1 The Lattice

A 2D square lattice Λ of N × N sites, indexed by **r** = (i, j) where i, j ∈ {1, ..., N}. Periodic boundary conditions (torus topology) to eliminate edge effects.

Each site represents a **social agent** — an individual, household, or local community depending on the scale of analysis.

### 1.2 The Spin Variable

At each site **r**, a continuous scalar spin:

$$s_\mathbf{r} \in [-1, +1]$$

This represents the agent's orientation along a single **alignment axis** chosen for the phenomenon under study (e.g., regime loyalty, market confidence, ethnic identification).

- s = +1: fully aligned with one pole (e.g., loyalist, confident, in-group)
- s = -1: fully aligned with the opposing pole (e.g., rebel, panic, out-group)
- s = 0: neutral / undecided / disengaged

**Note:** This is a dimensional reduction. The full manifold of human belief is high-dimensional; each simulation projects onto one axis. The choice of axis is part of the model specification, not an output.

---

## 2. The Hamiltonian

The total energy of the social field:

$$\mathcal{H} = \mathcal{H}_{\text{coupling}} + \mathcal{H}_{\text{field}} + \mathcal{H}_{\text{anisotropy}}$$

### 2.1 Coupling Energy (Peer Influence)

$$\mathcal{H}_{\text{coupling}} = -\sum_{\mathbf{r}} \sum_{\mathbf{r}'} J(\mathbf{r}, \mathbf{r}') \, s_\mathbf{r} \, s_{\mathbf{r}'}$$

where the coupling function:

$$J(\mathbf{r}, \mathbf{r}') = \frac{J_0 + \Delta J(\mathbf{r})}{1 + \left( d(\mathbf{r}, \mathbf{r}') / \lambda \right)^\alpha}$$

**Parameters:**
- **J₀** (base coupling): background social cohesion. J₀ > 0 = ferromagnetic (agents tend to align with neighbors). J₀ < 0 = antiferromagnetic (agents tend to oppose neighbors — contrarian dynamics).
- **ΔJ(r)** (coupling modification): **Huxley irrational propaganda**. Spatially varying, time-dependent. When the user drags across the field, ΔJ increases in that region — agents become more susceptible to peer influence without being told *what* to believe.
- **d(r, r')**: distance between sites on the lattice (Euclidean, with periodic wrapping)
- **λ** (interaction length): characteristic social distance
- **α** (range exponent): controls how quickly influence decays with distance
  - α = 0: mean-field (everyone influences everyone equally) → mass media, state TV
  - α = 2: moderate decay → social media (long-range but attenuated)
  - α → ∞: nearest-neighbor only → pre-industrial village

### 2.2 External Field (Rational Propaganda)

$$\mathcal{H}_{\text{field}} = -\sum_{\mathbf{r}} h(\mathbf{r}) \, s_\mathbf{r}$$

where h(**r**) is the **Huxley rational propaganda field**: a spatially varying, time-dependent external bias that directly pushes spins toward a specific orientation.

- h > 0: pushes spins toward +1
- h < 0: pushes spins toward -1
- h = 0: no directed messaging

When the user clicks on the field, h is applied locally. A broadcast (drag across entire field) applies h globally — this is state television.

**The Huxley distinction in Hamiltonian terms:**
- Rational propaganda: modifies h (tells agents what to believe)
- Irrational propaganda: modifies J (makes agents susceptible to what others believe)
- Same Hamiltonian, different terms. Different physical mechanisms.

### 2.3 Anisotropy (Institutional Structure)

$$\mathcal{H}_{\text{anisotropy}} = -\sum_{\mathbf{r}} K(\mathbf{r}) \, s_\mathbf{r}^2$$

This term penalizes neutrality (s ≈ 0) when K > 0, favoring strong opinions in either direction. It represents:
- Constitutional frameworks that force binary choices (two-party systems)
- Cultural norms that stigmatize fence-sitting
- Institutional structures that reward commitment

When K < 0, neutrality is favored — agents prefer disengagement. This models:
- Apathy-inducing environments
- Regimes that prefer a passive, uncommitted population

**Note:** More sophisticated anisotropy could favor a specific direction (K·s rather than K·s²), representing institutional bias toward one alignment. For v1, the symmetric form suffices.

---

## 3. Dynamics

### 3.1 Stochastic Update (Metropolis-Hastings)

At each timestep, select a site **r** at random and propose a spin update:

$$s_\mathbf{r} \to s_\mathbf{r}' = s_\mathbf{r} + \eta$$

where η is drawn from a uniform distribution [-δ, +δ], with δ controlling the step size. Clamp the result to [-1, +1].

Accept the update with probability:

$$P(\text{accept}) = \min\left(1, \, \exp\left(-\frac{\Delta \mathcal{H}}{T}\right)\right)$$

where ΔH = H(new) - H(old) and T is the **social temperature**.

**Temperature T interpretation:**
- T → 0: agents always minimize energy (deterministic alignment with local majority + field). Frozen, brittle.
- T moderate: agents sometimes go against the local majority — noise, independent thinking, contrarianism.
- T → ∞: agents ignore their neighbors entirely — pure randomness, no collective behavior.

### 3.2 Energy Change for a Single-Spin Update

$$\Delta \mathcal{H} = -\left(s_\mathbf{r}' - s_\mathbf{r}\right) \left[ \sum_{\mathbf{r}'} J(\mathbf{r}, \mathbf{r}') \, s_{\mathbf{r}'} + h(\mathbf{r}) + K(\mathbf{r}) \left(s_\mathbf{r}' + s_\mathbf{r}\right) \right]$$

This is the local field experienced by site **r**. The sum over r' is the computationally expensive part — for long-range interactions (low α), this is O(N²) per update.

### 3.3 Sweep Definition

One **Monte Carlo sweep** = N² attempted updates (each site visited once on average). This is one "timestep" of the simulation. Display updates after each sweep.

### 3.4 Temporal Evolution of Parameters

The user-injected perturbations (h and ΔJ) decay over time to model attention span and narrative fatigue:

$$h(\mathbf{r}, t+1) = h(\mathbf{r}, t) \cdot (1 - \gamma_h)$$
$$\Delta J(\mathbf{r}, t+1) = \Delta J(\mathbf{r}, t) \cdot (1 - \gamma_J)$$

where γ_h and γ_J are damping rates. This means:
- A propaganda campaign that stops being broadcast fades over time
- But coupling modifications (irrational propaganda) can have a different decay rate than direct messaging
- If γ_J < γ_h, irrational propaganda persists longer than rational propaganda — the susceptibility outlasts the message. This is the **hysteresis** mechanism.

---

## 4. Observable Quantities

### 4.1 Order Parameter (Magnetization)

$$M = \frac{1}{N^2} \sum_{\mathbf{r}} s_\mathbf{r}$$

- M ≈ +1: near-total alignment (consensus)
- M ≈ 0: disordered (no collective opinion) or perfectly balanced polarization
- M ≈ -1: near-total alignment in opposing direction

**Social meaning:** M is the "mood of the nation" — the net collective orientation. Phase transitions manifest as rapid changes in M.

### 4.2 Susceptibility

$$\chi = \frac{1}{T} \left( \langle M^2 \rangle - \langle M \rangle^2 \right)$$

Susceptibility peaks at the critical temperature — the system is maximally responsive to perturbation. In social terms: the moment when a small event can trigger massive realignment. **This is the tipping point.**

### 4.3 Domain Wall Density

$$\rho_w = \frac{1}{2N^2} \sum_{\langle \mathbf{r}, \mathbf{r}' \rangle} \Theta\left( |s_\mathbf{r} - s_{\mathbf{r}'}| - \delta_w \right)$$

where the sum is over nearest-neighbor pairs and Θ is the Heaviside step function with threshold δ_w (e.g., 0.5). This counts the fraction of neighbor pairs that disagree significantly.

- ρ_w ≈ 0: uniform alignment (consensus or frozen state)
- ρ_w high: fragmented — many domains with sharp boundaries
- ρ_w moderate: large domains with clear fault lines

**Social meaning:** Fragmentation index. Civil wars have high ρ_w with spatial clustering. Polarized democracies have moderate ρ_w with geographic patterning.

### 4.4 Energy per Site

$$e = \frac{\mathcal{H}}{N^2}$$

Low energy = stable configuration (strong alignment with coupling and field). High energy = frustrated configuration (many unsatisfied interactions). A rapid drop in energy signals a phase transition (the system "snaps" into a lower-energy aligned state).

### 4.5 Spatial Correlation Length

$$\xi = \text{characteristic length over which } C(\mathbf{r}, \mathbf{r}') = \langle s_\mathbf{r} \, s_{\mathbf{r}'} \rangle - \langle s \rangle^2 \text{ decays}$$

In practice, computed from the radial average of the correlation function. ξ diverges at the critical point — meaning alignment becomes system-wide just before the phase transition.

**Social meaning:** How far does local consensus extend? In a pre-revolutionary state, ξ grows as grievances spread — local pockets of dissent connect into a national movement.

---

## 5. The Huxley Mechanism — Formal Statement

### 5.1 Rational Propaganda (External Field h)

Adds energy term: -h·sᵢ

**Effect:** Directly biases spin orientation. Like a magnetic field aligning a compass needle — the spin feels a torque toward the field direction.

**Social mechanism:** "Here is what you should believe." News broadcasts, political speeches, advertising with explicit messaging, educational curricula.

**Temperature dependence:** Competes with thermal noise. At high T, the field is drowned out. At low T, the field dominates. At intermediate T, **stochastic resonance** occurs (González-Avella 2013) — propaganda is maximally effective.

**Prediction:** Rational propaganda effectiveness has an inverted-U relationship with social temperature.

### 5.2 Irrational Propaganda (Coupling Modification ΔJ)

Modifies coupling: J → J + ΔJ

**Effect:** Changes how strongly agents influence each other without specifying the direction of influence. Doesn't tell you what to think — makes you more susceptible to what others think.

**Social mechanism:** Fear, tribal identity activation, emotional manipulation, fatigue-inducing rallies (Huxley: "Hitler scheduled rallies at night when fatigue makes people vulnerable to suggestion"), social media algorithmic amplification of peer content.

**Temperature dependence (hypothesis):** ΔJ modifies the interaction strength, not the noise floor. It should work at ANY temperature because it's not competing with T — it's changing J. This means irrational propaganda may bypass the stochastic resonance constraint that limits rational propaganda.

**Prediction:** Irrational propaganda effectiveness is temperature-independent (or at least weakly dependent). This is testable in the simulator and, if true, explains why authoritarian regimes prefer irrational techniques — they work regardless of the information environment.

### 5.3 Combined Propaganda (The Authoritarian Playbook)

Apply ΔJ first (prime the coupling — make people susceptible), then h (direct the alignment).

**Predicted sequence:**
1. Increase ΔJ in target region (fear, identity, emotional priming)
2. Coupling strengthens — agents become responsive to neighbors
3. Apply h (specific message, enemy identification, call to action)
4. Aligned domains form rapidly due to amplified coupling
5. Remove h (stop the broadcast) — but alignment persists due to hysteresis (the coupling modification decays slower than the field)

**Test case:** Rwanda (Case 2). Radio Mille Collines used irrational propaganda (fear, dehumanization) to prime coupling, then rational propaganda (lists of names, specific instructions) to direct the violence. The model predicts that ΔJ + h produces a qualitatively more extreme outcome than h alone.

---

## 6. Phase Transition Classification

### 6.1 Continuous (Second-Order) Transition

Order parameter M changes gradually through the critical point. Susceptibility χ diverges. Correlation length ξ diverges. No latent energy.

**Social analogue:** Gradual political polarization. No single moment of rupture — the system smoothly separates into opposing domains. Brexit (Case 5) may be this type.

### 6.2 Discontinuous (First-Order) Transition

Order parameter M jumps abruptly. Latent energy released. Hysteresis — the system doesn't return to the disordered state at the same T where it ordered.

**Social analogue:** Revolution, regime collapse. A sudden, irreversible flip from one state to another. Berlin Wall (Case 1), Rwanda (Case 2), potentially the 2008 crisis (Case 3).

### 6.3 Spinodal Decomposition

A disordered system quenched below the critical temperature spontaneously separates into domains that coarsen over time.

**Social analogue:** Post-conflict fragmentation. After a collapse (e.g., Soviet Union, Yugoslavia, Arab Spring Syria), the system doesn't reach consensus — it separates into distinct domains that slowly consolidate. Syria (Case 4b) may be this type.

---

## 7. Test Case Parameter Specifications

### Case 1: Berlin Wall (1989)

| Parameter | Value | Rationale |
|---|---|---|
| J₀ | 1.0 | Moderate social cohesion |
| T | Ramp from 0.5 → 2.5 over simulation | Glasnost / information leakage |
| h | 0 | No directed propaganda triggered the fall |
| ΔJ | 0 | No irrational propaganda campaign |
| K | 1.5 (initial) → 0.5 (decaying) | Institutional enforcement weakening |
| α | 3 | Moderate interaction range (pre-social-media) |
| Initial state | All spins ≈ +1 (forced alignment with regime) | 40 years of enforced consensus |

**Expected behavior:** As T rises past critical value T_c, the metastable aligned state becomes unstable. Rapid domain reversal occurs — not gradually but as a cascade. The system should remain stable for a while (T < T_c) then flip suddenly (T > T_c).

### Case 2: Rwanda (1994)

| Parameter | Value | Rationale |
|---|---|---|
| J₀ | 0.8 | Moderate baseline cohesion |
| T | 1.0 | Moderate social noise (economic stress) |
| h | 0 → +1.5 (applied at t=t₁) | RTLM rational propaganda (kill lists, instructions) |
| ΔJ | 0 → +1.5 (applied at t=t₀ < t₁) | RTLM irrational propaganda (fear, dehumanization) |
| K | 0.3 | Weak institutional resistance (state = propagandist) |
| α | 4 | Mostly local interactions (neighbor-to-neighbor violence) |
| Initial state | Mixed domains (Hutu/Tutsi communities interspersed) | Pre-existing ethnic geography |

**Expected behavior:** ΔJ primes coupling (t₀), then h directs alignment (t₁). The combination produces rapid, extreme polarization. Run control: h alone (no ΔJ) should produce significantly less extreme outcome.

### Case 3: 2008 Financial Crisis

| Parameter | Value | Rationale |
|---|---|---|
| J₀ | 1.8 | Very high coupling (financial interconnection) |
| T | 0.3 | Low noise (Great Moderation, low volatility) |
| h | 0 | No propaganda — endogenous crisis |
| ΔJ | 0 | No coupling modification |
| K | 1.5 aligned to +1 | Institutional confidence bias (rating agencies, Fed) |
| α | 0.5 | Long-range interactions (global financial linkage) |
| Initial state | All spins ≈ +1 (market confidence) | Great Moderation consensus |
| Perturbation | Flip 1% of spins to -1 at t=t₁ | Lehman collapse (local failure) |

**Expected behavior:** Small perturbation propagates globally due to high J₀ and low α. The entire system flips from +1 to -1 rapidly (brittle fracture). Control: same perturbation at T=2.0 (high noise) should be absorbed locally.

### Case 4: Arab Spring — Tunisia (4a) vs Syria (4b)

**4a — Tunisia:**

| Parameter | Value | Rationale |
|---|---|---|
| J₀ | 1.0 (uniform) | Homogeneous society |
| T | 1.5 | High (economic frustration, education, internet) |
| h | 0 → +0.5 (social media amplification) | Modest external field |
| K | 0.5 | Weak institutional entrenchment |
| α | 1.5 | Moderate-to-long range (social media era) |
| Initial state | All spins ≈ +0.3 (mild regime support) | Apathetic compliance |
| Perturbation | Flip one spin to -1 (Bouazizi) | Single catalyst event |

**4b — Syria:**

| Parameter | Value | Rationale |
|---|---|---|
| J₀ | +1.2 within domains, -0.5 between domains | Sectarian coupling (in-group cohesion, out-group repulsion) |
| T | 1.5 | Similar economic frustration |
| h | Multiple competing: +0.5, -0.5, +0.3 from different directions | Iran, Saudi, Russia, US each pushing different alignment |
| K | 1.8 | Strong military-security institutional entrenchment |
| α | 1.5 | Same connectivity era |
| Initial state | Pre-defined domains (Sunni, Alawi, Kurdish regions) | Sectarian geography |
| Perturbation | Same as Tunisia | Same catalyst type |

**Expected behavior:** Tunisia flips cleanly to new alignment. Syria shatters into hardened domains that resist unification.

### Case 5: Brexit (2016)

| Parameter | Value | Rationale |
|---|---|---|
| J₀ | 0.6 (within domains), 0.2 (between domains) | Fragmented society (urban/rural, age, education) |
| T | 1.2 | Moderate (economic anxiety but not crisis) |
| h | +0.8 (Leave) vs -0.6 (Remain), spatially varying | Competing campaigns, differently distributed |
| ΔJ | +0.3 in Leave-leaning regions | Leave campaign's identity/sovereignty emotional appeal |
| K | 0.3 | Weak institutional consensus (both parties split) |
| α | 1.0 | Social media era (long range) |
| Initial state | Pre-defined domains matching UK geography | Urban/rural, London/rest, Scotland/England |

**Expected behavior:** Polarization hardens along pre-existing domain boundaries. Net M tips slightly positive (Leave wins narrowly). Spatial pattern matches UK geography.

---

## 8. Computational Notes

### 8.1 Efficiency

The coupling sum Σ J(r,r')·s_r' for each site update is the bottleneck. For α > 2, truncate the sum at distance R_cut where J drops below ε. For α < 2, use mean-field approximation for distant interactions:

$$\sum_{\mathbf{r}': d > R_{\text{cut}}} J \, s_{\mathbf{r}'} \approx J_{\text{mf}} \cdot M$$

where J_mf is the total long-range coupling and M is the current global magnetization. This is O(R_cut²) per update instead of O(N²).

### 8.2 Visualization

Color mapping: s → color
- s = -1: deep red (RGB: 200, 40, 40)
- s = 0: dark gray (RGB: 60, 60, 60)
- s = +1: deep blue (RGB: 40, 40, 200)

Continuous interpolation between these values. Domain walls appear as sharp color gradients.

### 8.3 Frame Rate Target

At N=100, one sweep = 10,000 updates. Each update requires ~R_cut² ≈ 25-100 coupling evaluations. Total: ~250k-1M operations per frame. At 60 fps: ~15-60M ops/sec — feasible in JavaScript for R_cut ≤ 5.

---

## 9. Falsifiability Summary

| Claim | Test | Falsified if... |
|---|---|---|
| SFT-001: Structural mapping | All 5 cases | <3 of 5 qualitative matches with pre-specified parameters |
| SFT-002: Huxley duality | Case 2 (Rwanda) | h alone produces same outcome as ΔJ + h |
| SFT-003: Excessive order = fragility | Case 3 (2008) | High J + low T produces resilience |
| SFT-004: Topology → outcome class | Case 4 (Tunisia vs Syria) | Same J topology produces different outcomes, or different J topology produces same outcome |
| SFT-005: Spontaneous transition | Case 1 (Berlin Wall) | Model requires h to produce regime collapse |

---

*This document is the mathematical foundation for the simulator. Implementation follows directly from these equations.*
