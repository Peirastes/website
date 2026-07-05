# Work-Energy Principle — Proposed Edits

> **Source document:** `Website/documents/dynamic-documents/Work-Energy Principle.docx`
> **Reviewed by:** TA Agent (2026-03-14)
> **Status:** Approved by Cole, not yet executed
> **Target:** New markdown version (leave `.docx` as-is)

---

## Structural Edits

### S1. Add an introduction

The document opens with "Let's start with the classic conservation of energy statement" — no motivation, no framing. Add a 3-4 sentence paragraph stating the thesis: the energy equation is a powerful accounting tool because two of three terms are endpoint quantities. Orient the reader before the math begins.

### S2. Add section headers with consistent hierarchy

Current state: "Mechanics" and "Electrostatics" are headers, but drag subsections within each aren't demarcated. The closing remarks have a header but the earlier material doesn't. Reads like a continuous scroll.

**Proposed structure:**

1. Introduction *(new)*
2. The Energy Equation *(the framework derivation, currently lines 1–~50)*
3. Mechanics: Friction on an Inclined Plane
4. Mechanics: Velocity-Dependent Drag (Stokes)
5. Electrostatics: Constant Retarding Force
6. Electrostatics: Velocity-Dependent Drag
7. The Energy Audit *(the closing remarks — they deserve a real title)*

### S3. Deduplicate the "menacingly tedious" integral

The full $v^2(t)$ integral expansion is shown twice — once for mechanics (Stokes), once for EM (generic $\beta$). Show it in full once (mechanics). In the EM section, state "the integral has the same structure with $mg \to qE$ and $6\pi r\eta \to \beta$" and skip straight to the energy audit punchline. The repetition dilutes the rhetorical force.

---

## Terminology Edits

### T1. Drop "useful work," "exhausted work," and "natural work"

These are nonstandard labels that won't appear in any textbook. The parenthetical definitions ($W$, $W_\text{nc}$, $W_\text{c}$) are sufficient. The financial analogy ("income and expense") used two paragraphs later is a stronger conceptual frame — lean into that one and cut the competing vocabulary.

---

## Physics / Precision Edits

### P1. Strengthen the Drude model bridge

The EM drag section ends with $v_T = qE/\beta$ and one sentence naming it "the basis of the Drude model." Add 2-3 sentences: identify $\beta = m_e/\tau$, state that this single parameter yields conductivity and Ohm's law, and note the copper resistivity prediction. Don't derive it — just name the destination so the reader knows the ODE isn't purely a mathematical exercise.

**Suggested text (after the terminal velocity sentence):**

> When $\beta = m_e/\tau$ — the electron mass divided by the mean free time between lattice collisions — this ODE is the Drude model of metallic conduction. The terminal velocity becomes the drift velocity of conduction electrons, and from it one can derive current density, conductivity, resistivity, and Ohm's law — all from Newtonian mechanics applied to electrons bouncing off atoms. When the numbers are plugged in for copper, the predicted resistivity matches the measured value to within 2%.

### P2. Fix sign convention inconsistency in the Stokes section

The document writes $6\pi r\eta \vec{v} - m\vec{g} = -m\vec{a}$ (drag positive, gravity negative, acceleration negative), then two lines later uses the more standard ODE form $m\,dv/dt = mg - 6\pi r\eta v$. Pick one convention — the ODE form is cleaner. Remove or rewrite the Newton's-second-law line to match.

### P3. Clarify $\Delta V$ sign convention in electrostatics

The document writes $\Delta PE = q\Delta V = q(V_f - V_i)$ and then $v_f = \sqrt{v_i^2 - \frac{2q}{m}\Delta V}$. This is correct but potentially confusing: a positive charge accelerating through a potential *drop* has $\Delta V < 0$, so the minus sign in the square root becomes a plus. Add one sentence clarifying that $\Delta V$ is negative when the particle gains energy.

---

## Voice / Polish Edits

### V1. Promote the closing remarks

The closing section (starting "Each term in the energy equation has a different relationship to what is knowable") is the strongest writing in the document. The paragraph explaining what each term "knows" — KE is two speed measurements, PE is an endpoint lookup, $W_\text{nc}$ is the stubborn remainder — is genuinely insightful. The normal-force / magnetic-force analogy at the end is a strong closer. These deserve better setup from the preceding material; currently they feel sharper than the derivation sections.

No specific text change — just a note that when the structural edits (S1, S2) are executed, the closing section should be treated as the destination the whole document builds toward.

### V2. Cut hedging language

Remove parenthetical hedges like "(could be measured)" and similar. The document's strength is its directness — trust it.

### V3. Resolve the lone second-person aside

The sentence "I'll leave you to consider the latter" (about sound as energy loss) is a nice informal touch, but it's the only direct second-person aside in the entire document until the closing. Either commit to occasional direct address throughout, or cut this one for consistency.

---

## Summary

| ID | Category | Effort | Impact |
|----|----------|--------|--------|
| S1 | Structure | Low | High |
| S2 | Structure | Medium | High |
| S3 | Structure | Low | Medium |
| T1 | Terminology | Low | Medium |
| P1 | Physics | Low | High |
| P2 | Physics | Low | Medium |
| P3 | Physics | Low | Medium |
| V1 | Voice | — | Context for S1/S2 |
| V2 | Voice | Low | Low |
| V3 | Voice | Low | Low |

**Recommended execution order:** S1 → S2 → P1 → T1 → S3 → P2 → P3 → V2 → V3
