# Dispersion and Stratification

## *Nature, Nurture, and the Strategic Shaping of a Medium*

**Cole Prather (Peirastes)** · Draft v0.3, April 2026

---

> **Abstract.** This paper sits at the intersection of dynamical systems, control theory, differential game theory, and the epistemology of adversarially-maintained regularities. Its central proposal is that the mathematics of dispersive wave propagation — imported from physics and structurally modified so that the dispersion relation is itself a strategic variable — provides a unified framework for understanding how technological and social stratification emerge, couple, and persist. Nature provides the form of the evolution equations; nurture, in the strong sense of strategic choice by agents with differential power, provides the coefficients. We develop the single-field model, introduce strategic control and three consequences with no analog in standard wave mechanics, couple two fields to represent technology and social position, and apply the framework to three case studies: the nuclear arc, elite higher education, and frontier artificial intelligence. The paper is framed as a case study within the author's larger research program on intrinsic–extrinsic coupling in dynamical systems.

— • —

## 1. Introduction

Stratification is the characteristic shape of any long-lived technology or social order. What begins localized at an origin becomes, over time, a spectrum of attenuated forms ordered by distance from that origin. The front retains the original advantage; the rear retains a narrative of the original advantage and, often, the belief that it is converging on it. This is true of nuclear physics, of elite universities, of access to frontier artificial intelligence. The shape recurs too often to be coincidence.

This paper proposes that the recurrence is structural, that the structure has the mathematical form of dispersive wave propagation through a medium, and that the medium in question is not nature-given but strategically shaped. The proposal sits at the intersection of four disciplines. Dynamical systems provides the evolution equations; control theory, as a subfield, introduces agents who can steer trajectories but cannot reason about other agents; differential game theory extends this to reflexive settings in which each agent's optimum depends on the other's, which is a genuine second-order effect (the fixed point of mutual best-responses is nonlinear even when the underlying dynamics are linear); and the epistemology of adversarially-maintained regularities — a frame that includes cryptography, coevolutionary biology, and the more recent machine-learning notion of adversarial robustness — supplies the conceptual tools for doing science on a system whose regularities are being actively shaped against the observer.

**The central thesis.** Nature provides the form of the coupled evolution equations that govern the propagation of technological capability and social position through a population. This is the intrinsic side. The coefficients of those equations — the base velocity, the spread, the asymmetric dispersion, the cross-coupling between fields — are not nature-given. They are the residue of strategic choices by agents with differential power. This is the extrinsic side, in the strong sense: nurture, not as perturbation to a nature-given baseline, but as the substance determining the medium's qualitative properties. The observable patterns of stratification are the joint product.

This framing inherits its mathematical backbone from a larger program on intrinsic–extrinsic structure in dynamical systems (Prather 2026). That program establishes a general result: when a system's observable behavior arises as the joint action of an intrinsic operator and an extrinsic drive, causal attribution is structurally underdetermined — the product carries less information than its factors. The stratification paper is a case study of what happens when the intrinsic operator is no longer independent of the extrinsic drive but is itself shaped by strategic choice, and when the resulting underdetermination is actively exploited by one of the agents. That exploitation — what we will call *weaponized underdetermination* — is the secondary thread running through the paper, supporting rather than displacing the dispersion mechanics that constitute its primary contribution.

The paper is structured as follows. Section 2 develops the single-field dispersion model. Section 3 introduces strategic control of the dispersion relation, names three consequences with no analog in standard wave mechanics, and situates the framework within adversarial epistemology. Section 4 extends to two coupled fields representing technological capability and social position. Section 5 applies the framework to three case studies. Section 6 discusses the framework's relation to the larger research program and its limits.

---

## 2. The Single-Field Dispersion Model

Let $\psi(x, t)$ denote a complex scalar field on the real line. Its squared modulus $|\psi(x, t)|^2$ is the observable intensity of whatever capability or standing $\psi$ represents. We initialize the field as a Gaussian packet of width $\sigma$ centered at the in-group's origin $x_0$:

$$\psi(x, 0) = \exp\!\left[-\frac{(x - x_0)^2}{2\sigma^2}\right]$$

The Fourier transform is Gaussian in the wavenumber $k$, with width $1/\sigma$. Narrow initial packets therefore contain broad spectra — a direct consequence of the Fourier uncertainty relation — and disperse more rapidly. Technologies and institutions that begin in small coherent groups have the widest spectra and therefore the greatest potential for subsequent stratification.

Propagation is governed by a dispersion relation $\omega(k)$, so that each mode evolves as $\exp[-i\omega(k)t]$. We adopt the three-parameter form

$$\omega(k) = v_0\,k \;-\; \alpha\,k^2 \;-\; \beta\,k^3$$

with group velocity $v_g(k) = v_0 - 2\alpha k - 3\beta k^2$. The three coefficients do different work. $v_0$ is the base velocity: the rate at which the coherent front would advance in the absence of dispersion. $\alpha$ produces symmetric spreading, slowing modes of either sign equally. $\beta$ is the strategically interesting coefficient: it slows high-$k$ modes more than low-$k$ modes, producing the asymmetric rear-band lag that is the signature of a moat.

The interpretation of the wavenumber matters. Low-$k$ modes represent long-wavelength, slowly-varying content: codified knowledge, explicit protocols, standardized credentials. High-$k$ modes represent short-wavelength, rapidly-varying content: tacit knowledge, proprietary texture, informal networks, the fine grain of institutional membership. A positive $\beta$ preferentially suppresses the propagation of tacit, textural content — which is precisely the content that is hardest to democratize, whether by deliberate withholding or by emergent friction.

In the notation of the larger program on dynamical systems (Prather 2026), this is an evolution equation of the form $\partial_t\psi = \hat{H}_\theta\psi + S(x, t)$, with an intrinsic dispersion operator $\hat{H}_\theta$ parameterized by $\theta = (v_0, \alpha, \beta)$ and an extrinsic source $S$. The next section addresses what happens when $\theta$ is itself strategic.

---

## 3. Strategic Control of the Dispersion Relation

### 3.1 The move

In standard dispersive-medium physics, $\omega(k)$ is a property of the medium. It is given by the physics, discovered by experiment, and invariant with respect to the observer. Newton, Maxwell, and Einstein learned what $\omega(k)$ was for various media; they did not choose it.

In the framework of this paper, $\omega(k)$ for the medium through which technological capability and social position propagate is not given. It is *chosen*. The coefficients $(v_0, \alpha, \beta)$ are not nature-given constants but the residue of strategic activity by a subset of agents — the in-group — who have access to control levers the out-group does not. The in-group's problem is to choose a trajectory $\beta(t)$ (and, to a lesser extent, the other coefficients) that optimizes its objective. The resulting dispersion relation is a *negotiated object*, and any attempt to model it as nature-given misses what it is.

This is a small mathematical modification. It is a larger conceptual one. Once $\omega(k)$ is strategic, three consequences follow that have no analog in standard wave mechanics.

### 3.2 Observer-dependent dispersion

The in-group's choice of $\beta(t)$ depends on what the out-group believes. When the out-group develops tools to measure the capability gap, the in-group revises $\beta$ (or, more often, revises the publicly visible signal $\Delta_\text{vis}$ that the out-group's beliefs track) to frustrate the measurement. In ordinary physics, the dispersion relation of a medium does not care whether it is being observed. In *strategic* physics, it does. The observer's epistemic state is a parameter of the dynamics — a feature the framework inherits from its game-theoretic structure rather than from wave mechanics proper.

Formally: let $B(t)$ denote the out-group's belief about the gap. Then the in-group's optimal $\beta$ is a function $\beta^*(t;\,B(t))$, and the belief dynamics

$$\frac{dB}{dt} = -\gamma_B\,(B - \Delta_\text{vis}) + \xi(t)$$

close the loop. Neither the in-group's policy nor the out-group's belief is exogenous; each is a fixed point of the other.

### 3.3 Adversarial dispersion

The in-group does not merely conceal the dispersion relation. It shapes $\beta$ and the public signal $\Delta_\text{vis}$ to produce specific misperceptions in the out-group's model of the dynamics. If the out-group believes the medium is symmetric ($\beta = 0$), they will predict eventual convergence between frontier and rear. An in-group that benefits from sustained stratification benefits from allowing this belief to persist while maintaining $\beta > 0$. The dispersion relation is chosen, in part, to be *adversarial* with respect to the out-group's inference procedures.

This is the point at which the paper's secondary thread — adversarial epistemology — enters with the most force. The underdetermination theorem of Prather (2026) establishes that passive observation cannot separate intrinsic response from extrinsic drive when behavior is their joint product. In the non-strategic case, this is an epistemic obstacle that controlled experiment can overcome. In the strategic case, the obstacle is being *actively exploited*. The in-group does not merely benefit from the underdetermination of the intrinsic-extrinsic partition; it manufactures that underdetermination, and it does so in ways designed to route the out-group's causal attribution into the wrong factorization. Narratives of meritocracy, of natural selection within competitive markets, of the inherent difficulty of frontier work — each is a candidate wrong factorization that the in-group has reason to sustain. **Weaponized underdetermination is the epistemic shape of a moat.**

This places the framework in a specific intellectual family: alongside cryptography, in which adversaries shape the security parameters of a scheme against the cryptanalyst; alongside host–pathogen coevolution, in which selection pressure maintains regularities against the observer's probes; alongside Scott's (1998) analysis of state-constructed legibility, in which modern states produce the regularities social scientists then study. What these settings share is that the regularities are not nature-given but actively maintained, and that the standard tools of passive science are systematically insufficient for them.

### 3.4 Regime-switching dispersion

The third consequence concerns what the in-group does when ordinary parameter adjustment is insufficient to preserve its position. Under most conditions, $\beta(t)$ varies smoothly: the in-group fine-tunes the moat in response to slow changes in the out-group's capability or belief. Under extraordinary conditions — when the out-group is about to catch up, when a leak is imminent, when a counter-narrative threatens to collapse $B$ — the in-group does not continuously adjust $\beta$. It introduces a *new modality of control*. A new classification regime, a new credential, a new institutional layer, a new technological closure. This is the physics analog of what strategic theorists call "changing the game" rather than "changing a parameter of the game."

Regime shifts of this kind are discontinuous: the dispersion operator $\hat{H}_\theta$ jumps rather than drifts. They are triggered by strategic state (threat to rent, threat to legitimacy) rather than by physical state. They have no analog in ordinary dispersive physics, where the medium does not change what kind of medium it is in response to observation. They are, however, entirely characteristic of historical stratification arcs, as Section 5 will show.

---

## 4. Coupled Fields: Technology and Social Position

A single field is not enough. Technological advantage generates economic surplus, which buys social position, which opens access to tacit technological knowledge. Advantage in one field is partially convertible into advantage in the other, and the conversion operates continuously. We represent this as two coupled fields.

Let $\psi_t$ denote the technology field and $\psi_s$ the social-position field. Each evolves under its own single-field dispersion with its own coefficients $(v, \alpha, \beta)$, and the two are linked by a coupling $\gamma$:

$$i\,\partial_t \psi_t = \hat{H}_t\,\psi_t + \gamma\,\psi_s$$

$$i\,\partial_t \psi_s = \hat{H}_s\,\psi_s + \gamma\,\psi_t$$

The coupling term transfers amplitude between the fields wherever both are nonzero. It is a two-by-two rotation in field space at rate $\gamma$, superposed on the single-field dispersions. Three effects follow immediately.

**Co-stratification.** Even when only one field has a strongly asymmetric dispersion, the coupling drags the other into the same band structure. A strongly stratified technology field, coupled to a broader social field, pulls the social field's modes into alignment with its own lead and rear. The cross-correlation $\rho$ between $|\psi_t|^2$ and $|\psi_s|^2$ rises from low initial values toward values near unity.

**Amplification.** The coupled system's rate of band separation exceeds the sum of the rates for the two fields taken independently. Advantage in one channel, transported into the other, reappears as advantage of a different kind, which opens new access in the original channel. Each traversal of the loop increases the lead and depletes the rear. This is the Matthew effect (Merton 1968), rendered as a transport mechanism rather than as a statistical observation.

**Joint control.** The in-group's strategic problem is no longer the choice of a single $\beta$ but the joint choice of $(\beta_t,\,\beta_s,\,\gamma)$. The belief variable $B$ averages over both fields — narratives of technological meritocracy and of educational meritocracy are alternative presentations of the same $\Delta_\text{vis}$. An in-group that can sustain both narratives simultaneously controls the joint field, and the joint field is in an important sense more controllable than either field alone. The self-stratifying belief feedback, in which out-group members internalize their position and thereby refrain from pursuing access even when no formal barrier prevents them (Bourdieu 1977; Hoxby and Avery 2013), operates primarily through the social field but, through the coupling $\gamma$, does much of the work of sustaining the technology moat. This is why technological moats can be maintained with surprisingly modest $\beta_t$, as Section 5.3 will show.

---

## 5. Case Studies

### 5.1 Nuclear: single-field, strong β, weak γ

The nuclear arc is the clearest case of single-field dispersion under strong strategic control, with weak coupling to the social field. The initial packet was established at Los Alamos in 1943–1945 with extraordinarily narrow $\sigma$: the working knowledge of implosion-device engineering was held by perhaps a hundred people, making the spectrum correspondingly broad and the dispersive potential large. The dispersion relation was imposed by the Atomic Energy Act of 1946, by compartmentalized classification, and by the unreproducible texture of weapons metallurgy. Band separation followed: Soviet Union 1949, United Kingdom 1952, France 1960, China 1964, India 1974, Pakistan in the 1980s, North Korea 2006. The widening inter-band spacing is consistent with persistent positive $\beta$ rather than purely symmetric $\alpha$. The 1953 Atoms for Peace program executed credible partial disclosure — substantial real civilian release — sustaining the belief variable at high value while the weapons frontier remained closed. Eighty years after Trinity, the lead band is still closed and narrative collapse has not occurred. The case is largely single-field because the coupling to social position, while real, operates on a community too small and specialized to generate a large-scale social-field effect.

### 5.2 Elite higher education: social-field with institutional β-control and regime shifts

Elite higher education in the United States from 1945 to the present is the clearest social-field case, and it displays all three of the Section 3 consequences. The postwar expansion under the GI Bill and the public research university system executed credible partial disclosure at massive scale: the number of Americans in higher education increased by an order of magnitude, sustaining the belief that the system was meritocratic and broadly accessible.

During the same period, the lead-band institutions did not stand still; they executed a sequence of *regime shifts* in the sense of Section 3.4. The move to standardized testing codified some tacit content into low-$k$ signals that could be partially democratized. The subsequent shift to holistic admissions recoded tacit content into high-$k$ signals that could not. Cultivation of legacy, development, and athletic preferences preserved incumbent access. Dramatically increased selectivity compressed the lead band back toward its original coherence. Each of these was a discontinuous change in the dispersion operator, triggered by strategic state rather than by continuous parameter drift. The adversarial dispersion of Section 3.3 is visible: applicants from non-elite backgrounds systematically underapply to elite institutions even when admission probabilities and financial aid structures are known to them to be favorable (Hoxby and Avery 2013). The self-stratifying belief feedback is large, and it is doing work the explicit $\beta$ does not need to do.

### 5.3 Frontier artificial intelligence: coupled fields in real time

Artificial intelligence, circa 2020–2026, exhibits the coupled dynamics with unusual clarity. The technology field is stratifying on a timescale short enough to be observed within a single career; the social field is reorganizing in response on a comparably short timescale; and the coupling is institutionally visible rather than analogical.

The technology field has a positive and apparently increasing $\beta_t$, sustained by regular intermediate-capability releases that keep the belief variable high while the frontier advances (Atoms for Peace as industrial practice). The social field is organized around access: who is invited early to a new model, who sits on boards and advisory councils, who is acknowledged on capability-defining work, who is credentialed as having worked at the frontier. These are social-field questions resolved through mechanisms structurally identical to those of elite higher education, and the relevant institutions overlap heavily. The coupling $\gamma$ is the institutional apparatus by which membership in the social in-group is converted into technological access and vice versa; the same person who receives early API access on the basis of social position gains, through that access, tacit knowledge about the frontier that is unavailable to those outside, which positions them for the next round of social-field recognition.

If the coupled framework is correct, we should expect the frontier-to-public gap to widen rather than narrow despite the superficial appearance of democratization; an increasingly tight correlation between positions in the social and technology fields; an elaboration of meritocratic narrative as the gap widens (adversarial dispersion); and overall stability of the arrangement, because the self-stratifying belief feedback of the social field allows $\beta_t$ to remain modest. These are falsifiable. They can be checked against the record as it develops.

---

## 6. Discussion

### 6.1 Relation to the larger research program

This paper is a case study within an ongoing research program on intrinsic–extrinsic coupling in dynamical systems (Prather 2026). That program develops, across five physical domains, a unified evolution equation $\partial_t u = \hat{H}_\theta u + S(x, t)$ in which an intrinsic operator $\hat{H}_\theta$ and an extrinsic drive $S$ jointly generate observable behavior, and it proves a structural underdetermination result: the intrinsic–extrinsic partition cannot be resolved from the observed trajectory alone. The present paper takes up a specific extension the program flags at its close: cases in which the extrinsic drive is no longer independent of the intrinsic operator. Strategic choice of the dispersion relation is exactly this: the coefficients of $\hat{H}_\theta$ are themselves shaped by the same agents whose choices also appear in $S$, which means the partition between intrinsic and extrinsic has become state-dependent in the way the program identifies as requiring generalization. The stratification case is useful because it makes that generalization concrete and testable in a specific domain, and because one of the agents in the coupled system is actively exploiting the very underdetermination the program proves. This paper does not complete the general program; it provides one worked instance of the kind of case the program points toward.

### 6.2 What the framework gets right, and what it does not

The framework captures three features that simpler adoption-curve accounts miss: the widening of the frontier-to-public gap over time rather than its closing; the coexistence of apparent democratization with persistent and sometimes increasing stratification; and the cross-channel amplification by which technological and social advantages compound. It also provides a natural home for phenomena that sit awkwardly in single-discipline accounts, including self-stratifying belief, regime-switching control, and adversarial narrative management.

The framework leaves much unmodeled. Capability and position are treated as scalar fields, which is an abstraction. The assumption of a single in-group is often violated; real fields typically have multiple competing in-groups whose interactions shape the dispersion relations in ways this single-actor analysis does not represent. The narrative channel is handled functionally rather than structurally; a full treatment would model $\Delta_\text{vis}$ as its own dispersive field coupled to the other two. The generational boundary, where many of the interesting control decisions are made, is absent. None of these is a fatal omission, but each marks a direction in which the framework can be deepened.

### 6.3 Closing

The framework is a claim about shape, not about necessity. Stratification on the pattern described here is what happens *when strategic incentives are followed*. The historical counterfactual — Tesla wanting $\beta = 0$ while Morgan wanted $\beta > 0$ — is a standing reminder that the dispersion relation is chosen. Open-source movements, commons-based governance, and the long arc of scientific publishing each represent arrangements with systematically lower $\beta$ and $\gamma$ than the closed default. What the framework tells us is where to look if we want to understand why most arrangements are not of this kind, and what would need to change for them to be. Nature sets the form of the equations; nurture, in the strong sense, sets the coefficients — and it is the coefficients, far more than the form, that determine how stratified the medium will be.

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

*— end of draft v0.3 —*
