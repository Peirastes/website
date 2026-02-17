# Thermofluidic Finance — Project Summary

**Author:** Cole Prather
**Last Updated:** February 16, 2026
**Status:** Advanced Draft (v0.5 — major restructuring complete)

---

## Overview

Thermofluidic Finance is an interdisciplinary research project that develops a rigorous mathematical theory of personal finance grounded in fluid mechanics and thermodynamics. The central ideas:

1. **Cash accounts behave as interconnected reservoirs of incompressible fluid** governed by conservation laws, expressible in state-space form with eigenvalue stability analysis.
2. **Volatile investments behave as compressible media** subject to thermodynamic principles. The First Law of Thermodynamics applies exactly: unrealized gains are heat absorbed ($\delta Q = n\,dP$), realized gains are work extracted ($\delta W = -P\,dn$). This decomposition is assumption-free.
3. **A compressibility spectrum** classifies financial instruments from incompressible (cash) through highly compressible (equities) to supercompressible (derivatives).
4. **Lot-level buoyancy dynamics** model each purchase lot's depth relative to current price as an Ornstein-Uhlenbeck process, yielding analytic results for recovery statistics, drawdown risk, and tax-loss harvesting optimization.

---

## The Three-Pillar Structure

### Pillar 1: Fluid Mechanics of Cash (Section II)

Cash accounts obey a conservation law identical to the continuity equation for fluid in a tank:

$$\frac{dV}{dt} = Q_{in}(t) - Q_{out}(t)$$

Multiple accounts form a network expressible as a linear time-invariant state-space system:

$$\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$$

This opens access to eigenvalue stability analysis, controllability, observability, and optimal control.

### Pillar 2: Thermodynamics of Investments (Section III)

Investment value $V = nP$ exhibits compressibility. The product rule yields an exact First Law:

$$dU = d(nP) = \underbrace{n\,dP}_{\delta Q\text{ (heat)}} + \underbrace{P\,dn}_{-\delta W\text{ (work)}}$$

- **Heat** ($\delta Q = n\,dP$): Unrealized appreciation — value change from price movement without investor action
- **Work** ($\delta W = -P\,dn$): Realized gains — value extracted through deliberate transactions

The compressibility spectrum classifies instruments by pressure sensitivity, connecting to established financial metrics (duration, beta, delta/gamma).

### Pillar 3: Lot-Level Buoyancy Dynamics (Section IV)

Each purchase lot has a depth $d(t) = \ln(P_{entry}/P(t))$ governed by an Ornstein-Uhlenbeck process:

$$dd(t) = -\kappa \cdot d(t)\,dt + \sigma\,dW_t$$

This yields analytic solutions for:
- Underwater-time distributions and recovery probabilities
- Tax-loss harvesting optimization via buoyancy ranking
- Maximum drawdown statistics
- Portfolio depth distributions (Fokker-Planck steady state)

---

## Project Documents

| Document | Description | Status |
|----------|-------------|--------|
| `The_Cash_Bubble_Hypothesis_v05.md` | Main working paper (v0.5 — restructured around three pillars) | Current |
| `The_Cash_Bubble_Hypothesis_v04.md` | Previous version (five-domain structure) | Superseded |
| `The_Cash_Bubble_Hypothesis_v03.md` | Earlier version | Superseded |
| `Appendix_A_Mathematical_Derivations.md` | Updated appendix with OU derivations and compressibility measures | Current |
| `notes_for_later.md` | Preserved content displaced during v04→v05 refactoring (equation of state, Carnot bound, signal dynamics, statistical mechanics) | Reference |
| `REVIEW_PLAN.md` | Critical review and refactoring plan | Reference |
| `Fluid_Finance_Project_Summary.md` | Original project summary with publication outline | Archive |
| `CashBubbleSimulator_v1.html` | Interactive simulator embedded in project page | Active |

---

## What's Complete (v0.5)

- State-space formulation with conservation laws and transfer matrices
- First Law derivation: $\delta Q = n\,dP$ (unrealized), $\delta W = -P\,dn$ (realized)
- Compressibility spectrum taxonomy (cash → savings → bonds → equities → derivatives)
- Formal compressibility measure $\beta = (1/V)(\partial V / \partial P)$ with connections to duration, beta, delta
- Lot-level buoyancy model with depth variable $d = \ln(P_{entry}/P)$
- OU process derivation from GBM via Ito's lemma
- First-passage-time analysis for underwater recovery
- Tax-loss harvesting optimization framework
- Fokker-Planck equation and steady-state depth distribution
- Portfolio health metrics from depth distribution
- Eigenvalue stability analysis
- Updated mathematical appendix

## What's Been Deferred to Companion Papers

| Topic | Status | Location |
|-------|--------|----------|
| Ideal gas law analogue ($PV = nRT$) and $T \propto P^2$ | Separate exploration | `notes_for_later.md`, Paper Seed 1 |
| Carnot efficiency bound ($\eta = 1 - P_L/P_H$) | Needs re-derivation | `notes_for_later.md`, Paper Seed 2 |
| Signal dynamics (velocity, acceleration, jerk) and PID control | Applied paper | `notes_for_later.md`, Paper Seed 3 |
| Statistical mechanics extension | Low priority | `notes_for_later.md`, Paper Seed 4 |

## What Remains for v0.5 Publication

| Gap | Priority | Notes |
|-----|----------|-------|
| Publication-quality figures | High | Tank schematic, compressibility spectrum, depth distribution, P-V diagrams |
| Empirical validation examples | Medium | Apply lot-level model to historical stock data |
| ~~Literature review section~~ | ~~Done~~ | ~~Section 1.3 rewritten as Related Work with five traditions~~ |
| ~~References~~ | ~~Done~~ | ~~20-entry bibliography added~~ |
| ~~Acknowledgments~~ | ~~Done~~ | ~~Tank-draining origin + Claude Opus 4.5/4.6 collaboration~~ |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v0.5 | Feb 2026 | Major restructuring: three-pillar architecture, renamed to "Thermofluidic Finance," First Law promoted to centerpiece, lot-level buoyancy expanded to full section, PV=nRT/Carnot/PID deferred |
| v0.4 | Feb 2026 | Full five-domain paper (fluid + thermo + control + signal + dynamical systems) |
| v0.3 | Jan 2026 | Earlier working draft |

---

## Publication Strategy

- **Primary venue**: Working paper on personal website (full version)
- **Secondary venue**: Peer-reviewed journal submission (format adaptable)
- **Target audience**: Physics/engineering readers; finance terminology explained
- **Candidate journals**: Physica A, Journal of Economic Dynamics & Control, PLOS ONE, American Journal of Physics
- **Data policy**: Simulated data only — no personal financial data disclosed

---

*This summary reflects the state of the project as of February 2026. For the full working paper, see The_Cash_Bubble_Hypothesis_v05.md.*
