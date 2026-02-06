// Some definitions presupposed by pandoc's typst output.
#let blockquote(body) = [
  #set text( size: 0.92em )
  #block(inset: (left: 1.5em, top: 0.2em, bottom: 0.2em))[#body]
]

#let horizontalrule = line(start: (25%,0%), end: (75%,0%))

#let endnote(num, contents) = [
  #stack(dir: ltr, spacing: 3pt, super[#num], contents)
]

#show terms: it => {
  it.children
    .map(child => [
      #strong[#child.term]
      #block(inset: (left: 1.5em, top: -0.4em))[#child.description]
      ])
    .join()
}

// Some quarto-specific definitions.

#show raw.where(block: true): set block(
    fill: luma(230),
    width: 100%,
    inset: 8pt,
    radius: 2pt
  )

#let block_with_new_content(old_block, new_content) = {
  let d = (:)
  let fields = old_block.fields()
  fields.remove("body")
  if fields.at("below", default: none) != none {
    // TODO: this is a hack because below is a "synthesized element"
    // according to the experts in the typst discord...
    fields.below = fields.below.abs
  }
  return block.with(..fields)(new_content)
}

#let empty(v) = {
  if type(v) == str {
    // two dollar signs here because we're technically inside
    // a Pandoc template :grimace:
    v.matches(regex("^\\s*$")).at(0, default: none) != none
  } else if type(v) == content {
    if v.at("text", default: none) != none {
      return empty(v.text)
    }
    for child in v.at("children", default: ()) {
      if not empty(child) {
        return false
      }
    }
    return true
  }

}

// Subfloats
// This is a technique that we adapted from https://github.com/tingerrr/subpar/
#let quartosubfloatcounter = counter("quartosubfloatcounter")

#let quarto_super(
  kind: str,
  caption: none,
  label: none,
  supplement: str,
  position: none,
  subrefnumbering: "1a",
  subcapnumbering: "(a)",
  body,
) = {
  context {
    let figcounter = counter(figure.where(kind: kind))
    let n-super = figcounter.get().first() + 1
    set figure.caption(position: position)
    [#figure(
      kind: kind,
      supplement: supplement,
      caption: caption,
      {
        show figure.where(kind: kind): set figure(numbering: _ => numbering(subrefnumbering, n-super, quartosubfloatcounter.get().first() + 1))
        show figure.where(kind: kind): set figure.caption(position: position)

        show figure: it => {
          let num = numbering(subcapnumbering, n-super, quartosubfloatcounter.get().first() + 1)
          show figure.caption: it => {
            num.slice(2) // I don't understand why the numbering contains output that it really shouldn't, but this fixes it shrug?
            [ ]
            it.body
          }

          quartosubfloatcounter.step()
          it
          counter(figure.where(kind: it.kind)).update(n => n - 1)
        }

        quartosubfloatcounter.update(0)
        body
      }
    )#label]
  }
}

// callout rendering
// this is a figure show rule because callouts are crossreferenceable
#show figure: it => {
  if type(it.kind) != str {
    return it
  }
  let kind_match = it.kind.matches(regex("^quarto-callout-(.*)")).at(0, default: none)
  if kind_match == none {
    return it
  }
  let kind = kind_match.captures.at(0, default: "other")
  kind = upper(kind.first()) + kind.slice(1)
  // now we pull apart the callout and reassemble it with the crossref name and counter

  // when we cleanup pandoc's emitted code to avoid spaces this will have to change
  let old_callout = it.body.children.at(1).body.children.at(1)
  let old_title_block = old_callout.body.children.at(0)
  let old_title = old_title_block.body.body.children.at(2)

  // TODO use custom separator if available
  let new_title = if empty(old_title) {
    [#kind #it.counter.display()]
  } else {
    [#kind #it.counter.display(): #old_title]
  }

  let new_title_block = block_with_new_content(
    old_title_block, 
    block_with_new_content(
      old_title_block.body, 
      old_title_block.body.body.children.at(0) +
      old_title_block.body.body.children.at(1) +
      new_title))

  block_with_new_content(old_callout,
    block(below: 0pt, new_title_block) +
    old_callout.body.children.at(1))
}

// 2023-10-09: #fa-icon("fa-info") is not working, so we'll eval "#fa-info()" instead
#let callout(body: [], title: "Callout", background_color: rgb("#dddddd"), icon: none, icon_color: black, body_background_color: white) = {
  block(
    breakable: false, 
    fill: background_color, 
    stroke: (paint: icon_color, thickness: 0.5pt, cap: "round"), 
    width: 100%, 
    radius: 2pt,
    block(
      inset: 1pt,
      width: 100%, 
      below: 0pt, 
      block(
        fill: background_color, 
        width: 100%, 
        inset: 8pt)[#text(icon_color, weight: 900)[#icon] #title]) +
      if(body != []){
        block(
          inset: 1pt, 
          width: 100%, 
          block(fill: body_background_color, width: 100%, inset: 8pt, body))
      }
    )
}



#let article(
  title: none,
  subtitle: none,
  authors: none,
  date: none,
  abstract: none,
  abstract-title: none,
  cols: 1,
  lang: "en",
  region: "US",
  font: "libertinus serif",
  fontsize: 11pt,
  title-size: 1.5em,
  subtitle-size: 1.25em,
  heading-family: "libertinus serif",
  heading-weight: "bold",
  heading-style: "normal",
  heading-color: black,
  heading-line-height: 0.65em,
  sectionnumbering: none,
  toc: false,
  toc_title: none,
  toc_depth: none,
  toc_indent: 1.5em,
  doc,
) = {
  set par(justify: true)
  set text(lang: lang,
           region: region,
           font: font,
           size: fontsize)
  set heading(numbering: sectionnumbering)
  if title != none {
    align(center)[#block(inset: 2em)[
      #set par(leading: heading-line-height)
      #if (heading-family != none or heading-weight != "bold" or heading-style != "normal"
           or heading-color != black) {
        set text(font: heading-family, weight: heading-weight, style: heading-style, fill: heading-color)
        text(size: title-size)[#title]
        if subtitle != none {
          parbreak()
          text(size: subtitle-size)[#subtitle]
        }
      } else {
        text(weight: "bold", size: title-size)[#title]
        if subtitle != none {
          parbreak()
          text(weight: "bold", size: subtitle-size)[#subtitle]
        }
      }
    ]]
  }

  if authors != none {
    let count = authors.len()
    let ncols = calc.min(count, 3)
    grid(
      columns: (1fr,) * ncols,
      row-gutter: 1.5em,
      ..authors.map(author =>
          align(center)[
            #author.name \
            #author.affiliation \
            #author.email
          ]
      )
    )
  }

  if date != none {
    align(center)[#block(inset: 1em)[
      #date
    ]]
  }

  if abstract != none {
    block(inset: 2em)[
    #text(weight: "semibold")[#abstract-title] #h(1em) #abstract
    ]
  }

  if toc {
    let title = if toc_title == none {
      auto
    } else {
      toc_title
    }
    block(above: 0em, below: 2em)[
    #outline(
      title: toc_title,
      depth: toc_depth,
      indent: toc_indent
    );
    ]
  }

  if cols == 1 {
    doc
  } else {
    columns(cols, doc)
  }
}

#set table(
  inset: 6pt,
  stroke: none
)
#import "@preview/fontawesome:0.5.0": *

#set page(
  paper: "us-letter",
  margin: (x: 1.25in, y: 1.25in),
  numbering: "1",
)

#show: doc => article(
  title: [Sources, Fields, and the Architecture of Change],
  subtitle: [A Unified Framework for Dynamical Systems --- Rigorous Mathematical Foundations],
  authors: (
    ( name: [Cole Prather],
      affiliation: [],
      email: [] ),
    ),
  date: [2026-02-04],
  toc_title: [Table of contents],
  toc_depth: 3,
  cols: 1,
  doc,
)

#block[
#heading(
level: 
1
, 
numbering: 
none
, 
[
Abstract
]
)
]
A wide class of physical laws share a common structure: observable behavior appears as the product of an intrinsic response and an extrinsic drive. Ohmic conduction, Fourier heat conduction, Fick diffusion, linear elasticity, Newtonian mechanics, and linear response theory all admit representations of the form

$ upright("Behavior") = upright("Response") times upright("Drive") $

where the response encodes material or geometric properties, and the drive encodes forces, gradients, or boundary conditions imposed by the environment. At the field level, such constitutive relations combine with conservation laws to yield partial differential equations of the form

$ frac(partial u, partial t) = cal(L)_theta [u] + S (x \, t) $

where $cal(L)_theta$ is an operator determined by intrinsic structure (diffusivity, conductivity, stiffness, permittivity) and $S$ represents extrinsic sources and boundary drives. Formally, this defines an ordinary differential equation on an infinite-dimensional manifold of field configurations. The geometry of this manifold---its modes, curvature, and stable or unstable directions---is largely set by intrinsic properties, whereas realized system histories are selected by extrinsic drives and initial conditions.

This product structure has profound epistemological consequences. Because the observable is generated by the joint action of intrinsic and extrinsic factors, behavior alone cannot uniquely resolve "how much was the material" versus "how much was the drive" without auxiliary assumptions; causal attributions are #strong[structurally underdetermined] along a nature--nurture axis. This document systematizes this pattern, develops its mathematical framework from first principles with rigorous proofs, demonstrates its universality through cross-domain analogies, and analyzes its implications for causal inference using information-theoretic and statistical identifiability methods.

#horizontalrule

= Part I: The Primordial Pattern
<part-i-the-primordial-pattern>
== Why Change Matters
<why-change-matters>
All physical laws describe change (or its absence). Dynamical systems provide a rigorous mathematical framework for these descriptions. The central question: what encourages or discourages a system to change? Is the influence intrinsic to the system or imposed by its environment?

== Two Laws, One Pattern
<two-laws-one-pattern>
Of key significance is the classical relationship between mass, acceleration, and force---described by Newton's Second Law---and the relationship between charge, the electric field, and the electrostatic force---given by Coulomb's Law:

#strong[Newton's Second Law:] $ F = m a $

#strong[Coulomb's Law:] $ F = q E $

Note both have similar forms, each denoting a force as the product of two interacting components---a #emph[source] (mass $m$, or charge $q$) and a #emph[field] (acceleration $a$, or electric field $E$). Interestingly, one can combine the words "source" and "field" to create the word "force"---a useful mnemonic. The generalized force can be expressed as:

$ #box(stroke: black, inset: 3pt, [$ upright("Force") = upright("Source") times upright("Field") $]) $

Force is measured in Newtons in both cases. Mass is measured in kilograms and charge is measured in Coulombs. Thus, the units of acceleration are Newtons per kilogram (= m/s²), and the units of the electric field are Newtons per Coulomb (= V/m). If the electric field is considered analogous to an acceleration field, then the unit for generalized field strength is:

$ upright("Field") = upright("Force") / upright("Source") $

In essence, #strong[Sources interact with Fields and experience Forces];, and Forces are the product of an interaction between a Source and a Field.

== Intrinsic and Extrinsic
<intrinsic-and-extrinsic>
#strong[Sources] carry #emph[intrinsic] information: mass, charge, energy, even genetics. #strong[Fields] carry #emph[extrinsic] information about the environment. #strong[Forces] inevitably carry information about both intrinsic and extrinsic properties of the system.

This means that it is not possible to immediately infer whether a force or outcome is due solely to intrinsic or extrinsic properties without a controlled experimental variance of either property to test for such influence.

This generalization can be recognized in Lewin's equation describing the behavior of a person in their environment:

$ B = f (P \, E) $

which is generally stated as:

$ upright("Behavior") = upright("Person") times upright("Environment") $

Here, the units of each parameter are more qualitative than quantitative, though the formalism is easily identified. The "Person" carries intrinsic information (traits, dispositions, genetics); the "Environment" carries extrinsic information (circumstances, context, pressures). The observed Behavior emerges from their interaction.

== The Birth of Field Thinking
<the-birth-of-field-thinking>
It is curious to consider the possibility that Fields could be influenced by Sources themselves. Perhaps the motion of a Source through the Field has a lasting effect---like walking through snow and leaving behind a trail of deformation. The Field itself has a Source! This may relate to the distinction between conservative and nonconservative forces and the fields through which they act.

To explore the nature of this interaction, consider two masses placed a distance $R$ apart. Assuming they are isolated from any other source of mass, the force between them is described by Newton's Universal Law of Gravitation:

$ F = G frac(m M, R^2) $

where $G$ is the universal gravitational constant ($G approx 6.674 times 10^(- 11)$ N·m²/kg²), $M$ is the larger mass (the "parent" or "planet"), and $m$ is the smaller mass (the "child" or "satellite").

To isolate the effect of the Field on one Source (say, the satellite), rearrange:

$ F / m = G M / R^2 $

Since acceleration is force per mass by Newton's Second Law:

$ g = G M / R^2 $

This says that the acceleration experienced by $m$ is caused by $M$. From the perspective of $m$, the properties of the acceleration field are #emph[extrinsic] and caused by $M$. The force that $m$ experiences in the field also depends on its own #emph[intrinsic] properties---specifically mass. The more massive $m$ becomes, the greater the force it will experience in the same field at the same location.

The same logic applies to Coulomb's Law: $F = k frac(q Q, R^2)$. From the perspective of charge $q$, the electric field $E = k Q / R^2$ is extrinsic (created by $Q$), while the force $F = q E$ depends on both the extrinsic field and the intrinsic charge.

#strong[Since Forces are the product of Sources and Fields, they are influenced by both intrinsic and extrinsic properties.]

#horizontalrule

== The Universality Hint: Mass and Charge as Interchangeable
<the-universality-hint-mass-and-charge-as-interchangeable>
Before we proceed deeper, pause to notice a remarkable fact hidden in the equations above:

- Gravitational force depends on #strong[mass];: $F_g = m dot.op g = m dot.op frac(G M_s, r^2)$
- Electric force depends on #strong[charge];: $F_e = q dot.op E = q dot.op frac(k Q_s, r^2)$

The mathematical forms are #strong[identical];. Mass plays the role of charge; $G$ plays the role of $k$. They are the same equation with different labels. Yet textbooks present them as fundamentally different forces---gravity in mechanics courses, electromagnetism in separate courses. This historical accident obscures a profound unity.

Much later in this document (Part XI), we will reveal that this is no coincidence. Gravity and electricity obey the same mathematical laws up to coupling constants. When we recognize this identity, the entire framework of cross-domain analogies becomes not heuristic but necessary---a consequence of the universal structure built into the laws of physics.

For now, note the pattern: #strong[Observable force = (intrinsic property) × (extrinsic field)];. Mass and charge both play the role of "intrinsic property." This suggests they may be more similar than different at a fundamental level.

#horizontalrule

= Part II: Potential Energy and Potential
<part-ii-potential-energy-and-potential>
== Spatial Energy
<spatial-energy>
The configuration of a Source in a Field, and its corresponding Force, can also be described via its location within the Field. This description is known as #strong[Potential Energy];---a sort of "spatial energy."

#strong[Gravitational Potential Energy:] $ U = m g h = F h $

where the gravitational force is $F = m g$. The potential energy is a product of Force and Distance, with units of N·m = Joules. The distance $h$ is measured from the field's zero-potential or "ground."

#strong[Electrostatic Potential Energy:] $ U = q E s = F s $

where the electrostatic force is $F = q E$.

If either a mass or a charge is "elevated" to a non-zero potential, there is energy which "wishes" to be released. Upon releasing the mass or charge, it will be driven by a force to follow a trajectory which seeks to minimize this potential energy.

The force which develops as a result of this potential energy minimization can be described as the gradient of the potential function:

$ arrow(F) = - nabla phi.alt $

== Potential: Energy per Unit Source
<potential-energy-per-unit-source>
Define #strong[potential] as the ratio of potential energy per source (specific potential energy), such that it is the product of Field and Reference Displacement.

#strong[Electric potential (voltage):] $ V = U / q = E s $ Units: Joules per Coulomb = Volts

#strong[Gravitational potential:] $ V_g = U / m = g h $ Units: Joules per kilogram = m²/s²

Note that gravitational potential has the same units as velocity-squared---a curious fact with deep connections to energy conservation.

#block[
#callout(
body: 
[
#strong[Key insight:] Potential is purely #emph[extrinsic];---it characterizes the field configuration created by external sources, independent of the test source that might be placed in it.

]
, 
title: 
[
Important
]
, 
background_color: 
rgb("#f7dddc")
, 
icon_color: 
rgb("#CC1914")
, 
icon: 
fa-exclamation()
, 
body_background_color: 
white
)
]
== Work and Kinetic Energy
<work-and-kinetic-energy>
Moving a source through a field requires energy---specifically at the expense of potential energy. The energy involved in moving a source from one potential to another is #strong[Work];:

$ W = F d cos theta $

where $W$ is measured in Joules, $F$ is force in Newtons, $d$ is distance in meters, and $theta$ is the angle between the applied force and the direction of motion.

More precisely: $ W = integral arrow(F) dot.op d arrow(r) $

Since work is the energy which contributes to change in motion along a line of action, this also defines #strong[Kinetic Energy];:

$ W = Delta K E $

The change in motion is the result of net work done by the system, from both conservative forces (efficiently transferring energy) and nonconservative forces (inefficiently transferring or removing energy).

#strong[Work by conservative forces:] $ W_c = integral arrow(F)_c dot.op d arrow(r) = - Delta P E $

#strong[Work by nonconservative forces:] $ W_(n c) = integral arrow(F)_(n c) dot.op d arrow(r) $

== Energy Conservation
<energy-conservation>
The conservation of energy statement fully describes this exchange:

$ K E_i + P E_i + W_(n c) = K E_f + P E_f $

Rearranging: $ W_(n c) = Delta K E + Delta P E $

If all work is conservative ($W_(n c) = 0$): $ Delta K E + Delta P E = 0 $ $ K E + P E = upright("constant") $

Total mechanical energy is conserved when only conservative forces act.

#horizontalrule

= Part III: The Three Energy Modes
<part-iii-the-three-energy-modes>
== Classification of Energy Storage and Dissipation
<classification-of-energy-storage-and-dissipation>
If the energy of a system can be fully described, then its behavior can be described too. The energy of a system can be described with #strong[three energy modes];:

- #strong[Potential energy];: energy stored in #emph[configuration] (position, deformation, separation)
- #strong[Kinetic energy];: energy stored in #emph[motion]
- #strong[Dissipative energy];: energy #emph[lost] to nonconservative effects (friction, drag, resistance)

Each of these three forms represents a #strong[passive role] in the system:

+ Store energy in a potential-like way (compliance, capacitance)
+ Store energy in a kinetic-like way (inertia, inductance)
+ Dissipate energy (resistance, friction)

== RLC Circuit
<rlc-circuit>
In a classical RLC circuit, the three passive components are the resistor, inductor, and capacitor:

- #strong[Resistor];: the dissipative element
- #strong[Inductor];: the kinetic storage element (in the magnetic field, and in the inertia-like behavior of current)
- #strong[Capacitor];: the potential storage element (in the electric field, and in charge separation)

Before the circuit is closed, the capacitor is uncharged---there is no voltage across it---and the inductor carries no current. When the switch closes, current starts to flow. The resistor opposes the flow and converts electrical power into heat. The inductor opposes changes in the flow, "pushing back" against sudden jumps in current. The capacitor begins accumulating charge, building voltage.

As the capacitor charges, the voltage across it rises, leaving less voltage available to drive current. The current falls. In the ideal DC limit, current goes to zero once the capacitor reaches the source voltage. The circuit evolves from kinetic activity (current) into potential storage (charge separation), while the resistor continuously bleeds energy away.

== Mass-Spring-Damper
<mass-spring-damper>
A similar behavior appears in mechanics with the mass-spring-damper system:

- #strong[Damper];: the dissipative element---converts mechanical power into heat through friction-like effects
- #strong[Mass];: the kinetic storage element---stores energy in motion and resists changes in velocity
- #strong[Spring];: the potential storage element---stores energy in deformation and "pushes back" when stretched or compressed

Before anything moves, the spring can be undeformed (no spring force) and the mass at rest (no kinetic energy). When the system is disturbed, motion begins. The damper opposes motion, producing a resistive force that grows with velocity. The mass resists rapid changes in velocity. The spring builds a restoring force as it stores potential energy.

As spring deformation increases, the restoring force grows, reducing net force available to accelerate the mass. The velocity peaks and falls as the spring pulls the mass back toward equilibrium. The damper steadily bleeds energy, oscillations shrink, and the system settles toward rest.

This is not just a poetic similarity---the governing relationships line up in the same roles:

- The #strong[mass] resists changes in velocity (a mechanical "inductor")
- The #strong[spring] produces a restoring force proportional to displacement (a mechanical "capacitor")
- The #strong[damper] produces a resistive force proportional to velocity (a mechanical "resistor")

== Hydraulic Analog
<hydraulic-analog>
A similar behavior appears in hydraulics with a restriction--inertance--accumulator system:

- #strong[Restriction] (valve/orifice): the dissipative element---converts mechanical power into heat through viscous losses
- #strong[Inertance] (long pipe / moving slug of fluid): the kinetic storage element---moving fluid has inertia and resists rapid changes in flow (the effect behind water hammer)
- #strong[Compliance] (accumulator with flexible diaphragm): the potential storage element---stores energy by compressing/expanding a volume

#block[
#callout(
body: 
[
#strong[All three systems share the same structure:] two elements exchange energy back and forth (kinetic ↔ potential), while the dissipative element continuously bleeds energy away. The nouns change---charge and current versus displacement and velocity versus pressure and flow---but the behavior is the same: storage, exchange, decay.

]
, 
title: 
[
Note
]
, 
background_color: 
rgb("#dae6fb")
, 
icon_color: 
rgb("#0758E5")
, 
icon: 
fa-info()
, 
body_background_color: 
white
)
]
== Constitutive Laws
<constitutive-laws>
The mapping becomes concrete when we write the element laws in matching form.

#strong[Electrical:]

- Resistor: $V_R = R I$
- Inductor: $V_L = L frac(d I, d t)$
- Capacitor: $I_C = C frac(d V, d t)$

#strong[Mechanical (translation, with $v = dot(x)$):]

- Damper: $F_d = b v$
- Mass: $F_m = m frac(d v, d t) = m dot.double(x)$
- Spring: $F_s = k x$ (equivalently, $dot(F)_s = k v$)

That one line---$F = m frac(d v, d t)$---is the mechanical twin of the inductor law $V = L frac(d I, d t)$.

#strong[Both say: the kinetic storage element resists changes in the flow variable.]

#horizontalrule

= Part IV: Effort, Flow, and Power
<part-iv-effort-flow-and-power>
== Terminal Pairs
<terminal-pairs>
Why do these analogies keep working? A useful lens: #strong[potential is energy per source];. Gravitational potential is energy per unit mass; electrical potential is energy per unit charge. Once potential is treated as "energy per source," the idea of a #emph[through] quantity becomes natural: it is a #strong[source-flow rate] (charge flow, mass flow, volume flow).

At the terminals of a system, there is usually a "driving difference" and a resulting "through" quantity, corresponding to how the potential and kinetic elements exchange energy through the system.

The ratio of driving difference to through quantity is set by the dissipative path, and it controls how quickly energy is bled away relative to how much is stored. This is known as #strong[impedance];:

- Electrical: $Z = V / I$
- Mechanical (translation): $Z = F / v$
- Mechanical (rotation): $Z = tau / omega$
- Hydraulic: $Z = frac(Delta p, Q)$

For a purely dissipative path, that ratio is just the resistive constant. Once storage is present, the "effective ratio" becomes dynamic (time/frequency dependent), because part of the driving difference is temporarily in storage before being returned or dissipated.

== Power Accounting
<power-accounting>
The paired variables (voltage/current, force/velocity, pressure/flow) describe how energy propagates through the system. Their product is #strong[power];---the rate at which energy is transferred:

- Electrical: $P = V I$
- Mechanical (translation): $P = F v$
- Mechanical (rotation): $P = tau omega$
- Hydraulic: $P = Delta p dot.op Q$

Describing a system at its terminals using $(V \, I)$ or $(F \, v)$ or $(Delta p \, Q)$ makes it possible to directly track #strong[energy transfer];.

This clarifies why real sources "sag under load." Real sources contain internal dissipative effects, so part of the driving difference is spent internally when the through quantity increases. A battery behaves like an EMF in series with internal resistance:

$ V_(upright("terminal")) = cal(E) - r I $

A pressurized canister behaves identically in hydraulics: reservoir pressure is the available driving difference, but outlet pressure falls as flow increases because pressure is lost across internal restrictions. Same structure, different nouns.

== Bond-Graph Variables
<bond-graph-variables>
Bond-graph prior art calls these paired variables #strong[effort] (the driving difference) and #strong[flow] (the through quantity), precisely because their product is power and because the same three passive roles can be written consistently in those variables.

#strong[This is the bridge to dynamical systems.] The moment a system includes storage---something that accumulates over time---its behavior stops being a purely algebraic "ratio at the terminal" and becomes an evolution law. That is where ODEs (and, when storage is distributed in space, PDEs) enter the conversation.

=== Terminal Pairs and the Three Passive Roles
<terminal-pairs-and-the-three-passive-roles>
#table(
  columns: (25%, 25%, 25%, 25%),
  align: (left,left,left,left,),
  table.header([Domain / Port], [Driving variable (effort)], [Through variable (flow)], [Power],),
  table.hline(),
  [Electrical], [$V$], [$I$], [$P = V I$],
  [Mechanical (translation)], [$F$], [$v$], [$P = F v$],
  [Mechanical (rotation)], [$tau$], [$omega$], [$P = tau omega$],
  [Hydraulic], [$Delta p$], [$Q$], [$P = Delta p dot.op Q$],
  [Gravitational (transport port)], [$V_g$ (J/kg)], [$B = dot(m)$ (kg/s)], [$P = V_g B$],
)

#horizontalrule

= Part V: The Complete Cross-Domain Analogy
<part-v-the-complete-cross-domain-analogy>
The following table collects and organizes the cross-domain analogies:

#table(
  columns: (16.67%, 16.67%, 16.67%, 16.67%, 16.67%, 16.67%),
  align: (left,left,left,left,left,left,),
  table.header([Component / Parameter], [Gravitational], [Electrical], [Mechanical (trans.)], [Mechanical (rot.)], [Hydraulic],),
  table.hline(),
  [#strong[Displacement];], [Height $h$], [Path coordinate $x$], [Position $x$], [Angle $theta$], [Volume $V$],
  [#strong[Motion];], [Mass flow $B = dot(m)$], [Drift speed $u_d$], [Velocity $v = dot(x)$], [Angular speed $omega = dot(theta)$], [Volume flow $Q = dot(V)$],
  [#strong[Source];], [Mass $m$], [Charge $q$], [---], [---], [---],
  [#strong[Field = Force/Source];], [Gravitic field $g$], [Electric field $E$], [Acceleration $a$], [Angular accel. $alpha$], [Pressure gradient],
  [#strong[Force = Source·Field];], [$F = m g$], [$F = q E$], [$F = m a$], [$tau = J alpha$], [$F = p A$],
  [#strong[Work-Energy];], [$U = m g h$], [$U = integral F thin d x$], [$U = integral F thin d x$], [$U = integral tau thin d theta$], [$U = integral p thin d V$],
  [#strong[Potential];], [$V_g = U \/ m = g h$], [$V = U \/ q$], [---], [---], [$p = U \/ V$],
  [#strong[Flux / Current];], [$B = dot(m)$], [$I = dot(q)$], [---], [---], [$Q = dot(V)$],
  [#strong[Port Effort];], [Potential $V_g$], [Voltage $V$], [Force $F$], [Torque $tau$], [Pressure diff. $Delta p$],
  [#strong[Port Flow];], [Mass flow $B$], [Current $I$], [Velocity $v$], [Angular speed $omega$], [Volume flow $Q$],
  [#strong[Power];], [$P = V_g B$], [$P = V I$], [$P = F v$], [$P = tau omega$], [$P = Delta p dot.op Q$],
  [#strong[Impedance];], [$Z_g = V_g \/ B$], [$Z = V \/ I$], [$Z = F \/ v$], [$Z = tau \/ omega$], [$Z = Delta p \/ Q$],
  [#strong[Resistance (R-type)];], [$R_g$: $V_g = R_g B$], [$R$: $V = R I$], [$b$: $F = b v$], [$b_theta$: $tau = b_theta omega$], [$R_h$: $Delta p = R_h Q$],
  [#strong[Conductance (G-type)];], [$G_g = 1 \/ R_g$], [$G = 1 \/ R$], [$mu = 1 \/ b$], [$mu_theta = 1 \/ b_theta$], [$G_h = 1 \/ R_h$],
  [#strong[Capacitance (C-type)];], [$H$: $m = H V_g$], [$C$: $q = C V$], [$C_m = 1 \/ k$], [$C_theta = 1 \/ k_theta$], [$C_h$: $V = C_h Delta p$],
  [#strong[Stiffness (inverse C)];], [$1 \/ H$], [$1 \/ C$], [$k$], [$k_theta$], [$E_h = 1 \/ C_h$],
  [#strong[Inductance (I-type)];], [$L_g$: $V_g = L_g dot(B)$], [$L$: $V = L dot(I)$], [$m$: $F = m dot(v)$], [$J$: $tau = J dot(omega)$], [$I_h$: $Delta p = I_h dot(Q)$],
  [#strong[C-state] ($integral f thin d t$)], [Mass $m$], [Charge $q$], [Displacement $x$], [Angle $theta$], [Volume $V$],
  [#strong[I-state] ($integral e thin d t$)], [Potential-impulse $pi_g$], [Flux linkage $lambda$], [Momentum $p$], [Angular mom. $L$], [Pressure impulse $Pi$],
)

#horizontalrule

= Part VI: Mathematical Framework
<part-vi-mathematical-framework>
== Finite-Dimensional Dynamical Systems
<finite-dimensional-dynamical-systems>
A finite-dimensional dynamical system with state $z (t) in bb(R)^n$, parameters $theta$, and external input $u (t)$ can be written as:

$ dot(z) = f (z \, t ; theta \, u (t)) $

A canonical example is the #strong[forced mass-spring-damper];:

$ m dot.double(x) + b dot(x) + k x = F (t) $

where $x (t)$ is position, $m \, b \, k$ are mass, damping, and stiffness (intrinsic parameters), and $F (t)$ is applied force (extrinsic drive).

=== State-Space Formulation
<state-space-formulation>
Define state variables: $ z_1 = x quad upright("(position)") $ $ z_2 = dot(x) quad upright("(velocity)") $

Then: $ dot(z)_1 = z_2 $ $ dot(z)_2 = 1 / m [F (t) - b z_2 - k z_1] $

In matrix form with state vector $upright(bold(z)) = [z_1 \, z_2]^T$:

$ frac(d upright(bold(z)), d t) = upright(bold(A))_theta upright(bold(z)) + upright(bold(s)) (t) $

where the #strong[intrinsic matrix] is:

$ upright(bold(A))_theta = mat(delim: "(", 0, 1; - k \/ m, - b \/ m) $

and the #strong[extrinsic forcing vector] is:

$ upright(bold(s)) (t) = vec(0, F (t) \/ m) $

== Chains of Coupled Oscillators
<chains-of-coupled-oscillators>
Consider $n$ masses arranged in a line, each connected to neighbors by springs and dampers. Let $x_i (t)$ denote the displacement of mass $i$.

For an interior mass $i$ with identical parameters $m$, $k$, $c$:

$ m dot.double(x)_i = k (x_(i - 1) - 2 x_i + x_(i + 1)) + c (dot(x)_(i - 1) - 2 dot(x)_i + dot(x)_(i + 1)) + F_i (t) $

The coefficient pattern $(1 \, - 2 \, 1)$ is the #strong[discrete second derivative stencil];.

=== Matrix Formulation
<matrix-formulation>
Stack all positions and velocities: $ upright(bold(z)) = [x_1 \, dot(x)_1 \, x_2 \, dot(x)_2 \, dots.h \, x_n \, dot(x)_n]^T in bb(R)^(2 n) $

The system can be written as: $ frac(d upright(bold(z)), d t) = upright(bold(A))_theta upright(bold(z)) + upright(bold(s)) (t) $

where: $ upright(bold(A))_theta = mat(delim: "(", upright(bold(0)), upright(bold(I)); - upright(bold(M))^(- 1) upright(bold(K)), - upright(bold(M))^(- 1) upright(bold(C))) $

The #strong[stiffness matrix] $upright(bold(K))$ is tridiagonal with $2 k$ on the diagonal and $- k$ on off-diagonals.

== The Continuum Limit
<the-continuum-limit>
To pass to a continuum, introduce spacing $Delta x$ and identify $x_i$ with a point along a one-dimensional body. Relate lumped parameters to continuum quantities:

$ m = rho A Delta x \, quad k = frac(E A, Delta x) \, quad c = frac(eta A, Delta x) $

where $rho$ is mass density, $A$ is cross-sectional area, $E$ is Young's modulus, and $eta$ is viscous damping.

The central difference: $ frac(partial^2 u, partial x^2) approx frac(u_(i - 1) - 2 u_i + u_(i + 1), (Delta x)^2) $

In the continuum limit ($Delta x arrow.r 0$):

$ rho A frac(partial^2 u, partial t^2) = E A frac(partial^2 u, partial x^2) + eta A frac(partial^3 u, partial x^2 partial t) + f (x \, t) $

Dividing by $rho A$ and defining $c^2 = E \/ rho$, $gamma = eta \/ rho$, $g = f \/ (rho A)$:

$ frac(partial^2 u, partial t^2) = c^2 frac(partial^2 u, partial x^2) + gamma frac(partial^3 u, partial x^2 partial t) + g (x \, t) $

This is the #strong[damped wave equation] of Kelvin-Voigt type.

Setting $gamma = 0$ yields the #strong[undamped wave equation];:

$ frac(partial^2 u, partial t^2) = c^2 frac(partial^2 u, partial x^2) + g (x \, t) $

== Field Evolution as Operator Equation
<field-evolution-as-operator-equation>
Introduce the state field $upright(bold(w)) = [u \, partial u \/ partial t]^T$. The wave equation becomes:

$ frac(partial upright(bold(w)), partial t) = cal(L)_theta [upright(bold(w))] + upright(bold(S)) (x \, t) $

where the #strong[intrinsic operator] is: $ cal(L)_theta [upright(bold(w))] = vec(w_2, c^2 frac(partial^2 w_1, partial x^2)) $

and the #strong[extrinsic source] is: $ upright(bold(S)) (x \, t) = vec(0, g (x \, t)) $

This is the infinite-dimensional analogue of $dot(upright(bold(z))) = upright(bold(A))_theta upright(bold(z)) + upright(bold(s)) (t)$.

#horizontalrule

= Part VII: Conservation Laws and Constitutive Relations
<part-vii-conservation-laws-and-constitutive-relations>
== The Generic Pattern
<the-generic-pattern>
Many field equations arise from combining:

+ #strong[Conservation law:] $frac(partial u, partial t) + nabla dot.op upright(bold(J)) = S$
+ #strong[Constitutive relation:] $upright(bold(J)) = upright("Response") times upright("Drive")$

== Heat Conduction
<heat-conduction>
#strong[Conservation of energy:] $ rho c_p frac(partial T, partial t) + nabla dot.op upright(bold(q)) = Q $

#strong[Fourier's Law:] $ upright(bold(q)) = - k nabla T $

#strong[Heat equation:] $ frac(partial T, partial t) = alpha nabla^2 T + frac(Q, rho c_p) $

where $alpha = k \/ (rho c_p)$ is #strong[thermal diffusivity] \[m²/s\].

#strong[Intrinsic:] $alpha$ (thermal diffusivity) #strong[Extrinsic:] $Q$ (heat source), boundary temperatures

== Mass Diffusion
<mass-diffusion>
#strong[Conservation of mass:] $ frac(partial c, partial t) + nabla dot.op upright(bold(J)) = S $

#strong[Fick's Law:] $ upright(bold(J)) = - D nabla c $

#strong[Diffusion equation:] $ frac(partial c, partial t) = D nabla^2 c + S $

== Charge Transport
<charge-transport>
#strong[Conservation of charge:] $ frac(partial rho_e, partial t) + nabla dot.op upright(bold(J)) = 0 $

#strong[Ohm's Law:] $ upright(bold(J)) = sigma upright(bold(E)) = - sigma nabla V $

== Linear Elasticity
<linear-elasticity>
#strong[Conservation of momentum:] $ rho frac(partial^2 upright(bold(u)), partial t^2) = nabla dot.op bold(sigma) + upright(bold(f)) $

#strong[Hooke's Law:] $ bold(sigma) = upright(bold(C)) : bold(epsilon) $

where $upright(bold(C))$ is the fourth-order stiffness tensor and $bold(epsilon) = 1 / 2 (nabla upright(bold(u)) + (nabla upright(bold(u)))^T)$.

#horizontalrule

= Part VIII: Manifolds and Trajectories --- Rigorous Formulation
<part-viii-manifolds-and-trajectories-rigorous-formulation>
== PDEs as Infinite-Dimensional ODEs
<pdes-as-infinite-dimensional-odes>
A PDE like $frac(partial u, partial t) = cal(L)_theta [u] + S$ is #strong[rigorously equivalent] to an ODE on an infinite-dimensional Hilbert space @Pazy_1983. At each instant $t$, the state is not a finite vector in $bb(R)^n$ but an entire field configuration $u (dot.op \, t)$---a point in an infinite-dimensional function space.

#strong[Formal Statement:] Let $H = L^2 (Omega)$ be the Hilbert space of square-integrable functions on spatial domain $Omega$. A PDE of the form

$ frac(partial u, partial t) = cal(L)_theta [u] + S (x \, t) $

with boundary conditions can be written #strong[rigorously] as the abstract evolution equation

$ frac(d upright(bold(u)), d t) = upright(bold(A)) upright(bold(u)) + upright(bold(S)) (t) \, quad upright(bold(u)) (0) = upright(bold(u))_0 $

where: - $upright(bold(u)) (t) in H$ is the state (field configuration at time $t$) - $upright(bold(A)) : D (upright(bold(A))) subset H arrow.r H$ is a densely-defined linear operator with domain $D (upright(bold(A)))$ - $upright(bold(S)) (t) in H$ is the external forcing (extrinsic source)

The functional-analytic machinery is developed in Appendix N.

=== The Operator Determines the Geometry
<the-operator-determines-the-geometry>
The intrinsic operator $cal(L)_theta$ (equivalently, $upright(bold(A))$) determines the #strong[geometry] of the infinite-dimensional state space:

- #strong[Eigenfunctions (Modes):] Solutions $phi.alt_n$ to the eigenvalue problem $upright(bold(A)) phi.alt_n = lambda_n phi.alt_n$ represent the natural shapes the system likes to assume. They form an orthonormal basis for $H$ (under suitable conditions).

- #strong[Spectrum (Eigenvalues):] The set $sigma (upright(bold(A))) = { lambda_n : upright(bold(A)) phi.alt_n = lambda_n phi.alt_n }$ determines the long-time behavior of perturbations:

  - If $upright("Re") (lambda_n) < 0$, mode $phi.alt_n$ #strong[decays exponentially] at rate $e^(upright("Re") (lambda_n) t)$
  - If $upright("Re") (lambda_n) > 0$, mode $phi.alt_n$ #strong[grows exponentially] at rate $e^(upright("Re") (lambda_n) t)$
  - If $upright("Im") (lambda_n) eq.not 0$, mode $phi.alt_n$ #strong[oscillates] at frequency $lr(|upright("Im") (lambda_n)|)$

- #strong[Stability:] The entire infinite-dimensional system is #strong[globally stable] iff $sup_n upright("Re") (lambda_n) < 0$ (all eigenvalues have negative real part).

This geometric structure exists independent of any particular trajectory---it is built into the intrinsic properties (material parameters, domain shape, boundary conditions).

=== Example: Heat Equation on $[0 \, 1]$
<example-heat-equation-on-01>
The heat equation $frac(partial u, partial t) = alpha frac(partial^2 u, partial x^2)$ on the interval $[0 \, 1]$ with Dirichlet boundary conditions ($u (0 \, t) = u (1 \, t) = 0$) has:

- #strong[Eigenfunctions (Modes):] $phi.alt_n (x) = sin (n pi x)$ for $n = 1 \, 2 \, 3 \, dots.h$
- #strong[Eigenvalues (Decay Rates):] $lambda_n = - alpha (n pi)^2$ for each mode $n$
- #strong[Geometry:] The state space $H = L^2 ([0 \, 1])$ is decomposed into infinite-dimensional subspaces, each labeled by $n$, with mode $n$ decaying at rate $alpha n^2 pi^2$

High-frequency modes (large $n$) decay rapidly; low-frequency modes (small $n$) decay slowly. This is why the heat equation smooths out sharp features over time---it kills the high-frequency content.

== Trajectories as Realized Histories
<trajectories-as-realized-histories>
Extrinsic drives and initial conditions, by contrast, select which trajectory is realized---which path through the infinite-dimensional manifold actually occurs:

- #strong[The forcing $upright(bold(S)) (t) in H$] injects energy into particular modes (directions in the infinite-dimensional space), pushing the system away from equilibrium in those directions.

- #strong[Initial conditions $upright(bold(u))_0 in H$] determine the starting point on the manifold. The Fourier expansion $upright(bold(u))_0 = sum_n c_n phi.alt_n$ shows how much weight the initial condition places in each mode.

- #strong[Boundary conditions] constrain which modes can be active and restrict the accessible region of the manifold. Dirichlet boundaries force $u = 0$ at the boundary; Neumann boundaries allow $partial u \/ partial n = 0$, affecting which eigenfunctions are admissible.

In summary: the operator $upright(bold(A))$ defines the geometry (modes, decay rates, stability); the trajectory $upright(bold(u)) (t)$ is uniquely determined by $upright(bold(A))$, initial data $upright(bold(u))_0$, and forcing $upright(bold(S)) (t)$.

#horizontalrule

= Part IX: Causal Attribution and Product Structure
<part-ix-causal-attribution-and-product-structure>
== The Fundamental Problem
<the-fundamental-problem>
The simple algebraic relation $ B = R times D $ already illustrates a key epistemic issue. Given only $B$ (behavior), there is no unique way to factor it into $R$ (response) and $D$ (drive).

For any nonzero scalar $alpha$: $ B = R times D = (alpha R) times (D / alpha) $

represents the same behavior. Without additional information, one cannot say how much of $B$ is due to $R$ versus $D$.

== Physical Interpretation
<physical-interpretation>
Consider $upright(bold(J)) = sigma upright(bold(E))$ (Ohm's law). Observing current density $upright(bold(J))$, we cannot distinguish:

- High conductivity $sigma$ with weak field $upright(bold(E))$
- Low conductivity $sigma$ with strong field $upright(bold(E))$
- Any intermediate combination

Without independent measurement of either $sigma$ or $upright(bold(E))$, the attribution is underdetermined.

== The Matrix Case
<the-matrix-case>
For vector systems $upright(bold(J)) = upright(bold(L)) dot.op upright(bold(X))$:

$ upright(bold(J)) = upright(bold(L)) dot.op upright(bold(X)) = (upright(bold(L)) dot.op upright(bold(M))) dot.op (upright(bold(M))^(- 1) dot.op upright(bold(X))) $

for any invertible matrix $upright(bold(M))$. The pair $(upright(bold(L)) dot.op upright(bold(M)) \, upright(bold(M))^(- 1) dot.op upright(bold(X)))$ produces the same flux $upright(bold(J))$.

== Resolving Ambiguity
<resolving-ambiguity>
To separate intrinsic from extrinsic contributions, one must:

+ #strong[Control the drive:] Apply known, calibrated forces/fields
+ #strong[Hold intrinsic properties fixed:] Same material, temperature, geometry
+ #strong[Independent measurement:] Measure response coefficients separately

This is the logic of experimental calibration and material characterization.

== The Nature-Nurture Parallel
<the-nature-nurture-parallel>
The same product structure appears in discussions of nature versus nurture:

$ upright("Phenotype") = upright("Genotype") times upright("Environment") $

Observed phenotypes cannot uniquely reveal genetic versus environmental contributions without controlled comparisons (twin studies, common-garden experiments).

== Epistemological Implications
<epistemological-implications>
The product structure implies:

- Behavior alone #strong[cannot] support sharp causal attribution
- Auxiliary controls and measurements are #strong[always] required
- Claims of "pure" intrinsic or extrinsic causation are #strong[structurally unjustified]

This is not a limitation of measurement precision---it is a mathematical feature of product-structured models.

#horizontalrule

= Part X: Electrical Systems and Cross-Domain Analogies
<part-x-electrical-systems-and-cross-domain-analogies>
== X.1 Motivation and Structure
<x.1-motivation-and-structure>
The mechanical and electrical domains appear to obey identical mathematical laws, as hinted in Part III's discussion of the mass-spring-damper and RLC circuit. This section makes the analogy rigorous by deriving electrical circuit equations from first principles, solving them completely, and establishing formal correspondence to mechanical systems.

The payoff: #strong[any technique for analyzing mechanical systems immediately applies to electrical systems] (and vice versa). The identification problem from Session 1 becomes concrete: observing circuit behavior (say, frequency response) cannot uniquely determine whether a time constant arises from a large resistance with small capacitance or vice versa.

== X.2 Foundations: Circuit Laws and Constitutive Relations
<x.2-foundations-circuit-laws-and-constitutive-relations>
=== Kirchhoff's Current Law (KCL)
<kirchhoffs-current-law-kcl>
At any node in a circuit, charge is conserved: the sum of currents entering the node equals the sum of currents leaving.

$ sum_(upright("in")) I_(upright("in")) = sum_(upright("out")) I_(upright("out")) $

=== Kirchhoff's Voltage Law (KVL)
<kirchhoffs-voltage-law-kvl>
Around any closed loop, the sum of voltage rises equals the sum of voltage drops. Equivalently, integrating the electric field around the loop yields zero (conservative field):

$ sum_(upright("sources")) V_(upright("source")) = sum_(upright("elements")) V_(upright("drop")) $

=== Ohm's Law (Resistor)
<ohms-law-resistor>
Voltage across a resistor is proportional to current:

$ V_R = I R $

where $R$ is resistance \[Ω\], $I$ is current \[A\], and $V_R$ is voltage drop \[V\].

#strong[Intrinsic:] $R$ (material property, geometry-dependent) #strong[Extrinsic:] $I$ (driven by circuit conditions)

=== Faraday's Law (Inductor)
<faradays-law-inductor>
Voltage across an inductor equals the negative rate of change of magnetic flux. For a linear inductor:

$ V_L = L frac(d I, d t) $

where $L$ is inductance \[H = V·s/A\]. The inductor opposes changes in current.

=== Constitutive Relation (Capacitor)
<constitutive-relation-capacitor>
Charge stored on a capacitor is proportional to voltage:

$ Q = C V $

where $C$ is capacitance \[F = A·s/V\]. Current is the rate of charge flow:

$ I_C = frac(d Q, d t) = C frac(d V, d t) $

The capacitor opposes changes in voltage.

== X.3 The RC Circuit: Charging and Discharging
<x.3-the-rc-circuit-charging-and-discharging>
=== Setup and Governing Equation
<setup-and-governing-equation>
#strong[Circuit description:] A voltage source $V_(upright("source"))$ connected in series with a resistor $R$ and capacitor $C$.

#strong[Apply KVL around the loop:]

$ V_(upright("source")) = V_R + V_C = I R + V_C $

where $I = C frac(d V_C, d t)$ (capacitor constitutive relation). Substituting:

$ V_(upright("source")) = R C frac(d V_C, d t) + V_C $

Rearrange to standard form:

$ frac(d V_C, d t) + frac(1, R C) V_C = frac(1, R C) V_(upright("source")) $

Define the #strong[time constant] $tau_(R C) = R C$ and rewrite:

$ #box(stroke: black, inset: 3pt, [$ frac(d V_C, d t) = - 1 / tau (V_C - V_(upright("source"))) $]) $

#strong[Structure:] This is a first-order linear ODE with: - #strong[Intrinsic operator:] $cal(L)_theta [V_C] = - 1 / tau V_C$ (determined by $R$ and $C$) - #strong[Extrinsic source:] $S = 1 / tau V_(upright("source"))$ (applied voltage)

=== Solution: Exponential Approach to Steady State
<solution-exponential-approach-to-steady-state>
#strong[Initial condition:] Capacitor initially uncharged, $V_C (0) = 0$.

#strong[Homogeneous solution:] $V_C^((h)) (t) = A e^(- t \/ tau)$

#strong[Particular solution:] At steady state ($d V_C \/ d t = 0$), we have $V_C^((oo)) = V_(upright("source"))$.

#strong[General solution:]

$ #box(stroke: black, inset: 3pt, [$ V_C (t) = V_(upright("source")) (1 - e^(- t \/ tau)) $]) $

#strong[Physical interpretation:] - At $t = 0$: $V_C = 0$ (capacitor empty) - At $t = tau_(R C)$: $V_C = V_(upright("source")) (1 - e^(- 1)) approx 0.632 thin V_(upright("source"))$ (reached 63.2% of final value) - At $t = 5 tau$: $V_C approx 0.993 thin V_(upright("source"))$ (essentially fully charged)

=== Example: Charging an LED's Smoothing Capacitor
<example-charging-an-leds-smoothing-capacitor>
#strong[Scenario:] A power supply provides 12 V to a circuit through an inline resistor of 10 kΩ to charge a smoothing capacitor of 100 μF.

#strong[Parameters:] - $V_(upright("source")) = 12$ V - $R = 10 times 10^3$ Ω = 10 kΩ - $C = 100 times 10^(- 6)$ F = 100 μF - Time constant: $tau = R C = (10^4) (10^(- 4)) = 1$ s

#strong[Voltage across capacitor:]

$ V_C (t) = 12 (1 - e^(- t \/ 1)) = 12 (1 - e^(- t)) $

#strong[Calculated values:]

#table(
  columns: 3,
  align: (left,left,left,),
  table.header([Time $t$ (s)], [$e^(- t)$], [$V_C$ (V)],),
  table.hline(),
  [0], [1.000], [0],
  [0.5], [0.606], [4.73],
  [1.0], [0.368], [7.59],
  [2.0], [0.135], [10.38],
  [3.0], [0.050], [11.40],
  [5.0], [0.007], [11.92],
)
#strong[Practical takeaway:] After 5 seconds (five time constants $tau_(R C)$), the capacitor is charged to 99.3% of the supply voltage. If faster charging is needed, either use a #strong[smaller resistor] (reduce $tau_(R C)$) or a #strong[smaller capacitor] (reduce storage need).

=== The Identification Problem Applied to RC Charging
<the-identification-problem-applied-to-rc-charging>
#strong[Experiment:] You observe that an RC circuit reaches 63% of its final voltage in 2 seconds. What are $R$ and $C$?

#strong[Observation:] $tau = 2$ s.

#strong[The problem:] You can only infer that $R C = 2$. This could be: - $R = 1$ Ω, $C = 2$ F, or - $R = 2$ Ω, $C = 1$ F, or - $R = 1000$ Ω, $C = 0.002$ F, or - Infinitely many other combinations

#strong[Resolution using Session 1 methods:]

+ #strong[Direct measurement (Theorem M.3.1):] Measure $R$ independently using Ohm's law: apply a known DC voltage and measure the leakage current $I_0 = V_(upright("DC")) \/ R$. Once $R$ is known, calculate $C = tau \/ R$.

+ #strong[Controlled variation (Theorem M.3.2):] Apply two different source voltages but measure the time constant in both. Since $tau$ depends only on $R$ and $C$ (not on $V_(upright("source"))$), both measurements yield the same $tau$. But vary the #strong[load:] connect a load resistor $R_L$ in parallel with the capacitor, then measure time constant. This changes the effective $R$ seen by the capacitor (becomes $R parallel R_L$), allowing separation.

+ #strong[Replication (Theorem M.3.3):] Use two identical resistors but different known capacitors. Measure $tau_1 = R C_1$ and $tau_2 = R C_2$. Then: $ R = frac(tau_2 - tau_1, C_2 - C_1) $

== X.4 The RL Circuit: Current Building Through Inductance
<x.4-the-rl-circuit-current-building-through-inductance>
=== Setup and Governing Equation
<setup-and-governing-equation-1>
#strong[Circuit:] Voltage source $V_(upright("source"))$, resistor $R$, inductor $L$ in series.

#strong[Apply KVL:]

$ V_(upright("source")) = I R + L frac(d I, d t) $

Rearrange:

$ #box(stroke: black, inset: 3pt, [$ frac(d I, d t) = 1 / L (V_(upright("source")) - I R) $]) $

Define #strong[inductive time constant] $tau_L = L \/ R$:

$ frac(d I, d t) + R / L I = V_(upright("source")) / L $

=== Solution: Current Building to Steady State
<solution-current-building-to-steady-state>
#strong[Initial condition:] $I (0) = 0$ (no initial current through inductor).

#strong[Steady-state current:] $I^((oo)) = V_(upright("source")) \/ R$ (inductor acts like a short circuit at DC).

#strong[General solution:]

$ #box(stroke: black, inset: 3pt, [$ I (t) = V_(upright("source")) / R (1 - e^(- R t \/ L)) = I^((oo)) (1 - e^(- t \/ tau_L)) $]) $

#strong[Physical interpretation:] - At $t = 0$: $I = 0$ (inductor blocks sudden current change) - At $t = tau_L$: $I = I^((oo)) (1 - e^(- 1)) approx 0.632 thin I^((oo))$ (reached 63.2% of final current) - At $t = 5 tau_L$: $I approx 0.993 thin I^((oo))$ (steady state reached)

=== Example: Energizing a Relay Coil
<example-energizing-a-relay-coil>
#strong[Scenario:] Relay solenoid with inductance $L = 10$ mH and resistance $R = 100$ Ω is connected to a 24 V supply.

#strong[Parameters:] - $V_(upright("source")) = 24$ V - $R = 100$ Ω - $L = 10 times 10^(- 3)$ H = 10 mH - Inductive time constant: $tau_L = L \/ R = 0.01 \/ 100 = 0.0001$ s = 0.1 ms - Steady-state current: $I^((oo)) = 24 \/ 100 = 0.24$ A = 240 mA

#strong[Current as a function of time:]

$ I (t) = 0.24 (1 - e^(- 100 t \/ 0.01)) = 0.24 (1 - e^(- 10000 t)) $

#strong[Calculated values:]

#table(
  columns: 3,
  align: (left,left,left,),
  table.header([Time $t$ (ms)], [$e^(- 10000 t)$], [$I (t)$ (mA)],),
  table.hline(),
  [0], [1.000], [0],
  [0.01], [0.905], [22.8],
  [0.05], [0.606], [94.4],
  [0.1], [0.368], [151.7],
  [0.2], [0.135], [207.5],
  [0.5], [0.007], [238.3],
)
#strong[Practical takeaway:] The relay reaches 99.3% of its steady-state current in about 0.5 ms---very fast! The solenoid energizes nearly instantaneously from a human perspective.

== X.5 The LC Circuit: Harmonic Oscillations
<x.5-the-lc-circuit-harmonic-oscillations>
=== Setup and Governing Equation
<setup-and-governing-equation-2>
#strong[Circuit:] Ideal (lossless) inductor $L$ and capacitor $C$ in series. No resistor---no energy dissipation.

#strong[Apply KVL:]

$ 0 = L frac(d I, d t) + V_C $

with $I = C frac(d V_C, d t)$ (capacitor current-voltage relation). Substituting:

$ L frac(d, d t) (C frac(d V_C, d t)) + V_C = 0 $

$ L C frac(d^2 V_C, d t^2) + V_C = 0 $

Rearrange:

$ #box(stroke: black, inset: 3pt, [$ frac(d^2 V_C, d t^2) + omega_0^2 V_C = 0 $]) $

where $omega_0 = 1 \/ sqrt(L C)$ is the #strong[natural angular frequency] \[rad/s\].

=== Solution: Harmonic Oscillation
<solution-harmonic-oscillation>
The general solution is:

$ #box(stroke: black, inset: 3pt, [$ V_C (t) = A cos (omega_0 t) + B sin (omega_0 t) $]) $

or equivalently:

$ V_C (t) = V_0 cos (omega_0 t + phi.alt) $

where $V_0$ is amplitude, $phi.alt$ is phase.

#strong[Energy conservation:] The total energy oscillates between capacitor (potential) and inductor (kinetic):

$ E_(upright("total")) = 1 / 2 C V_C^2 + 1 / 2 L I^2 = upright("constant") $

=== Example: Tuning Circuit in a Radio
<example-tuning-circuit-in-a-radio>
#strong[Scenario:] LC tuning circuit for AM radio reception at 1 MHz.

#strong[Parameters:] - Target frequency: $f = 1$ MHz $arrow.r.double$ $omega_0 = 2 pi f = 2 pi times 10^6$ rad/s - Fixed inductor: $L = 100$ μH = $10^(- 4)$ H - Required capacitor (solve $omega_0 = 1 \/ sqrt(L C)$ for $C$):

$ C = frac(1, omega_0^2 L) = frac(1, (2 pi times 10^6)^2 times 10^(- 4)) = frac(1, 4 pi^2 times 10^12 times 10^(- 4)) = frac(1, 4 pi^2 times 10^8) approx 253 upright(" pF") $

#strong[Period of oscillation:]

$ T = frac(2 pi, omega_0) = 1 / f = 1 / 10^6 = 1 thin mu upright("s") $

(Each complete oscillation occurs in 1 microsecond.)

=== Mechanical Analog: Mass-Spring System
<mechanical-analog-mass-spring-system>
The LC circuit equation

$ frac(d^2 V_C, d t^2) + omega_0^2 V_C = 0 $

is #strong[identical] to the mechanical equation for a mass-spring system with no damping:

$ frac(d^2 x, d t^2) + omega_0^2 x = 0 quad upright("where") quad omega_0 = sqrt(k \/ m) $

#strong[Correspondence:]

#table(
  columns: 2,
  align: (left,left,),
  table.header([Mechanical], [Electrical],),
  table.hline(),
  [Position $x$], [Voltage $V_C$],
  [Velocity $v = dot(x)$], [Current $I = C dot(V)_C$],
  [Mass $m$], [Inductance $L$],
  [Spring constant $k$], [Reciprocal capacitance $1 \/ C$],
  [Momentum $p = m v$], [Flux linkage $lambda = L I$],
)
A vibrating mass and an oscillating LC circuit obey #strong[the same mathematics] despite their physical difference. Any insight from one transfers to the other.

== X.6 The RLC Circuit: Three Damping Regimes
<x.6-the-rlc-circuit-three-damping-regimes>
=== Setup and Governing Equation
<setup-and-governing-equation-3>
#strong[Circuit:] Series combination of resistor $R$, inductor $L$, and capacitor $C$ with voltage source $V_(upright("source"))$.

#strong[Apply KVL:]

$ V_(upright("source")) = I R + L frac(d I, d t) + V_C $

with $I = C frac(d V_C, d t)$. Substituting:

$ V_(upright("source")) = R C frac(d V_C, d t) + L C frac(d^2 V_C, d t^2) + V_C $

Rearrange to standard second-order form:

$ #box(stroke: black, inset: 3pt, [$ frac(d^2 V_C, d t^2) + 2 zeta omega_0 frac(d V_C, d t) + omega_0^2 V_C = omega_0^2 V_(upright("source")) $]) $

where: - $omega_0 = 1 \/ sqrt(L C)$ is the natural frequency - $zeta = R / 2 sqrt(C / L)$ is the #strong[damping ratio]

=== Three Regimes Based on Damping Ratio
<three-regimes-based-on-damping-ratio>
The character of the response depends on $zeta$:

==== Regime 1: Underdamped ($zeta < 1$)
<regime-1-underdamped-zeta-1>
The system overshoots the steady-state value and oscillates around it, with exponentially decaying amplitude.

#strong[Solution:] $ V_C (t) = V_(upright("source")) (1 - e^(- zeta omega_0 t) [cos (omega_d t) + zeta / sqrt(1 - zeta^2) sin (omega_d t)]) $

where $omega_d = omega_0 sqrt(1 - zeta^2)$ is the damped frequency.

#strong[Characteristic:] Oscillations with exponential decay envelope $e^(- zeta omega_0 t)$.

==== Regime 2: Critically Damped ($zeta = 1$)
<regime-2-critically-damped-zeta-1>
The system approaches steady state as fast as possible without oscillating---the "optimal" damping.

#strong[Solution:] $ V_C (t) = V_(upright("source")) (1 - e^(- omega_0 t) (1 + omega_0 t)) $

#strong[Characteristic:] Fastest approach to steady state with no overshoot.

==== Regime 3: Overdamped ($zeta > 1$)
<regime-3-overdamped-zeta-1>
The system approaches steady state slowly, without oscillation. One "mode" dominates.

#strong[Solution:] $ V_C (t) = V_(upright("source")) (1 - frac(zeta + sqrt(zeta^2 - 1), 2 sqrt(zeta^2 - 1)) e^(- lambda_1 t) + frac(zeta - sqrt(zeta^2 - 1), 2 sqrt(zeta^2 - 1)) e^(- lambda_2 t)) $

where $lambda_(1 \, 2) = zeta omega_0 plus.minus omega_0 sqrt(zeta^2 - 1)$ are the two time constants.

#strong[Characteristic:] Slow exponential approach with two competing time scales.

=== Example: Switch Closure in an Audio Amplifier
<example-switch-closure-in-an-audio-amplifier>
#strong[Scenario:] An RLC output filter in an amplifier. When powered on, voltage must ramp smoothly without ringing (oscillations that distort audio).

#strong[Parameters:] - Target steady-state voltage: $V_(upright("source")) = 10$ V (amplifier output) - Inductance (output impedance): $L = 1$ mH = $10^(- 3)$ H - Capacitance (filter): $C = 10$ μF = $10^(- 5)$ F - Resistance (circuit loss): $R = 10$ Ω

#strong[Calculate natural frequency and damping ratio:]

$ omega_0 = 1 / sqrt(L C) = 1 / sqrt(10^(- 3) times 10^(- 5)) = 1 / sqrt(10^(- 8)) = 1 / 10^(- 4) = 10^4 upright(" rad/s") $

$ f_0 = frac(omega_0, 2 pi) = frac(10^4, 2 pi) approx 1592 upright(" Hz") $

$ zeta = R / 2 sqrt(C / L) = 10 / 2 sqrt(10^(- 5) / 10^(- 3)) = 5 times sqrt(10^(- 2)) = 5 times 0.1 = 0.5 $

#strong[Interpretation:] The damping ratio $zeta = 0.5 < 1$ means the system is #strong[underdamped];---it will oscillate around the final voltage.

#strong[Response:] The output voltage rings at $approx 1592$ Hz with exponential decay time constant $tau = 1 \/ (zeta omega_0) = 1 \/ (0.5 times 10^4) = 2 times 10^(- 4)$ s = 0.2 ms.

#strong[To fix (prevent ringing):] Increase damping to $zeta gt.eq 1$: - Increase $R$ (add more series resistance), or - Increase $L$ relative to $C$ (deeper filter), or - Decrease $C$ (less capacitive load)

For example, setting $R = 200$ Ω would give $zeta = 1$ (critical damping), eliminating ringing at the cost of slower rise time.

=== Mechanical Analog: Mass-Spring-Damper
<mechanical-analog-mass-spring-damper>
The RLC circuit equation

$ frac(d^2 V_C, d t^2) + 2 zeta omega_0 frac(d V_C, d t) + omega_0^2 V_C = omega_0^2 V_(upright("source")) $

is #strong[identical] to the mechanical equation for a driven mass-spring-damper:

$ dot.double(x) + 2 zeta omega_0 dot(x) + omega_0^2 x = omega_0^2 x_0 $

where $omega_0 = sqrt(k \/ m)$ and $zeta = b \/ (2 sqrt(k m))$.

#strong[Complete correspondence:]

#table(
  columns: 2,
  align: (left,left,),
  table.header([Mechanical], [Electrical],),
  table.hline(),
  [Mass $m$], [Inductance $L$],
  [Damping $b$], [Resistance $R$],
  [Spring constant $k$], [Reciprocal capacitance $1 \/ C$],
  [Applied displacement $x_0$], [Applied voltage $V_(upright("source"))$],
  [Position $x (t)$], [Capacitor voltage $V_C (t)$],
  [Underdamped oscillation], [Ringing transient],
  [Critical damping], [Fastest non-oscillatory response],
)
This correspondence is #strong[exact and complete];. Engineers designing mechanical shock absorbers and electrical filters use identical formulas.

== X.7 The Driven RLC Circuit: Resonance
<x.7-the-driven-rlc-circuit-resonance>
=== Setup and Forcing
<setup-and-forcing>
Suppose the voltage source is time-varying (AC source):

$ V_(upright("source")) (t) = V_0 cos (omega t) $

Then the driven RLC equation becomes:

$ frac(d^2 V_C, d t^2) + 2 zeta omega_0 frac(d V_C, d t) + omega_0^2 V_C = omega_0^2 V_0 cos (omega t) $

=== Steady-State Solution and Impedance
<steady-state-solution-and-impedance>
At steady state (after transients die out), the current oscillates at the driving frequency $omega$:

$ I (t) = I_0 (omega) cos (omega t - phi.alt (omega)) $

where amplitude and phase depend on frequency.

#strong[The impedance] is the complex ratio of voltage to current:

$ Z (omega) = frac(V_0, I_0 (omega)) e^(i phi.alt (omega)) $

For an RLC circuit:

$ Z (omega) = R + i (omega L - frac(1, omega C)) $

The #strong[magnitude] is:

$ lr(|Z (omega)|) = sqrt(R^2 + (omega L - frac(1, omega C))^2) $

=== Resonance: Frequency of Maximum Current
<resonance-frequency-of-maximum-current>
Current is maximum when impedance is minimum. This occurs when the inductive and capacitive reactances cancel:

$ omega L = frac(1, omega C) $

$ omega^2 = frac(1, L C) $

$ #box(stroke: black, inset: 3pt, [$ omega_(upright("res")) = omega_0 = 1 / sqrt(L C) $]) $

#strong[At resonance:] The impedance is purely resistive $Z_(upright("res")) = R$, and current is maximum:

$ I_(upright("max")) = V_0 / R $

#strong[Quality factor] (sharpness of resonance):

$ Q = frac(omega_0 L, R) = 1 / R sqrt(L / C) $

High $Q$ means narrow, sharp resonance; low $Q$ means broad response.

=== Example: AM Radio Tuning
<example-am-radio-tuning>
#strong[Scenario:] A radio's LC tuning circuit must select one broadcast station (say, 1000 kHz) while rejecting adjacent stations (999 kHz, 1001 kHz).

#strong[Parameters:] - Target resonance: $f_0 = 1$ MHz $arrow.r.double$ $omega_0 = 2 pi times 10^6$ rad/s - Fixed inductance: $L = 100$ μH - Capacitance (tunable): $C = 1 \/ (4 pi^2 times 10^12 times L) approx 253$ pF (for 1 MHz resonance) - Coil resistance (loss): $R = 10$ Ω

#strong[Quality factor:]

$ Q = frac(omega_0 L, R) = frac(2 pi times 10^6 times 10^(- 4), 10) = 628 / 10 = 62.8 $

#strong[Frequency response:] At resonance, $I = V_0 \/ R = V_0 \/ 10$. At ±1 kHz off resonance (1001 kHz), the impedance increases significantly, and current drops.

The #strong[bandwidth] (frequency range where current is \> 70.7% of peak) is:

$ Delta f = f_0 / Q = 10^6 / 62.8 approx 15.9 upright(" kHz") $

This is wide enough to capture the full audio spectrum (up to \~5 kHz) while narrowing enough to reject adjacent AM stations (spaced 10 kHz apart). Perfect tuning!

=== Mechanical Analog: Driven Mass-Spring-Damper
<mechanical-analog-driven-mass-spring-damper>
The driven RLC circuit exhibits #strong[resonance];---maximum amplitude response at $omega_0$. The same resonance phenomenon occurs in mechanics when a mass-spring-damper is driven by a sinusoidal force. The mechanical quality factor is:

$ Q_(upright("mech")) = frac(omega_0 m, b) = frac(1, 2 zeta) $

Both systems show resonant amplification, with the height of the resonance peak determined by damping ($Q$ or $zeta$).

== X.8 Frequency Response and Transfer Functions
<x.8-frequency-response-and-transfer-functions>
=== Transfer Function Representation
<transfer-function-representation>
For the driven RLC circuit with AC input $V_(upright("source")) (t) = V_0 e^(i omega t)$ (using complex notation), we can write the system in terms of the #strong[transfer function];:

$ H (omega) = frac(V_C (omega), V_(upright("source")) (omega)) $

This describes how the output (capacitor voltage) responds to input (source voltage) as a function of frequency.

#strong[Derivation:] In the frequency domain (using $j omega$ instead of $d \/ d t$):

$ frac(d^2 V_C, d t^2) + 2 zeta omega_0 frac(d V_C, d t) + omega_0^2 V_C = omega_0^2 V_(upright("source")) $

becomes:

$ - omega^2 V_C + 2 j zeta omega_0 omega V_C + omega_0^2 V_C = omega_0^2 V_(upright("source")) $

$ V_C (omega_0^2 - omega^2 + 2 j zeta omega_0 omega) = omega_0^2 V_(upright("source")) $

$ #box(stroke: black, inset: 3pt, [$ H (omega) = frac(omega_0^2, omega_0^2 - omega^2 + 2 j zeta omega_0 omega) $]) $

=== Magnitude and Phase Response
<magnitude-and-phase-response>
The magnitude of the transfer function is:

$ lr(|H (omega)|) = omega_0^2 / sqrt((omega_0^2 - omega^2)^2 + (2 zeta omega_0 omega)^2) $

The phase response is:

$ angle H (omega) = - arctan (frac(2 zeta omega_0 omega, omega_0^2 - omega^2)) $

#strong[Key features:]

+ #strong[At resonance] ($omega = omega_0$): $ lr(|H (omega_0)|) = frac(1, 2 zeta) = Q $ The amplitude is amplified by factor $Q$ at resonance.

+ #strong[At low frequency] ($omega lt.double omega_0$): $ lr(|H (omega)|) approx 1 \, quad angle H (omega) approx 0 $ Circuit passes signal without attenuation or phase shift.

+ #strong[At high frequency] ($omega gt.double omega_0$): $ lr(|H (omega)|) approx omega_0^2 / omega^2 \, quad angle H (omega) approx - pi $ Circuit attenuates by factor $(omega_0 \/ omega)^2$ (acts as low-pass filter).

=== Bandwidth and Rolloff
<bandwidth-and-rolloff>
The #strong[3-dB bandwidth] is the frequency range where power response is within 3 dB (70.7%) of the peak:

$ Delta omega = 2 zeta omega_0 $

$ Delta f = frac(Delta omega, 2 pi) = frac(zeta omega_0, pi) = f_0 / Q $

Above the resonance, the filter #strong[rolls off] at -40 dB/decade (for second-order system), meaning amplitude drops by factor of 100 for every 10× frequency increase.

=== Example: Anti-Aliasing Filter Design
<example-anti-aliasing-filter-design>
#strong[Scenario:] Digital audio system samples at $f_s = 44.1$ kHz (CD quality). To avoid aliasing artifacts, frequencies above $f_s \/ 2 = 22.05$ kHz must be attenuated to noise level before sampling.

#strong[Desired response:] - Passband: flat response up to 20 kHz (human hearing limit) - Stopband: attenuation of \>80 dB at 22.05 kHz

#strong[Design:] RLC low-pass filter with: - Resonance frequency: $f_0 = 25$ kHz (slightly above passband) - Quality factor: $Q = 2$ (moderate damping, slight peak acceptable) - Therefore damping ratio: $zeta = 1 \/ (2 Q) = 0.25$

#strong[Response at 22.05 kHz:]

$ lr(|H (22.05 upright(" kHz"))|) = lr(|H (1.1 f_0)|) = 1 / sqrt((1 - 1.1^2)^2 + (2 times 0.25 times 1.1)^2) $

$ = 1 / sqrt((1 - 1.21)^2 + (0.55)^2) = 1 / sqrt(0.0441 + 0.3025) = 1 / sqrt(0.3466) approx 0.169 $

In decibels: $20 log_10 (0.169) approx - 15.4$ dB (reasonable stopband attenuation).

At $2 f_0 = 50$ kHz: $lr(|H|)$ drops further to $approx - 40$ dB, which meets the aliasing requirement.

#horizontalrule

== X.9 Thermal Systems: RC Analogy
<x.9-thermal-systems-rc-analogy>
The heat transfer process in many situations exhibits the same product structure and RC-like dynamics as electrical circuits.

=== Thermal Circuit Analogy
<thermal-circuit-analogy>
#strong[Thermal system:] $ rho c frac(d T, d t) = - frac(Delta T, R_(upright("th"))) $

where: - $T$ is temperature \[K\] - $rho c$ is thermal capacitance (heat capacity) \[J/K\] - $R_(upright("th"))$ is thermal resistance \[K/W\] - $Delta T$ is temperature difference driving heat flow \[K\]

#strong[Correspondence with RC electrical circuit:]

#table(
  columns: (50%, 50%),
  align: (left,left,),
  table.header([Electrical], [Thermal],),
  table.hline(),
  [Voltage $V$], [Temperature $T$],
  [Current $I$], [Heat flow $Q_(upright("flow"))$ \[W\]],
  [Resistance $R$], [Thermal resistance $R_(upright("th"))$],
  [Capacitance $C$], [Thermal capacitance $C_(upright("th"))$],
  [Time constant $tau = R C$], [Thermal time constant $tau_(upright("th")) = R_(upright("th")) C_(upright("th"))$],
)
=== Example: Electronics Cooling
<example-electronics-cooling>
#strong[Scenario:] Power transistor dissipating constant heat $P = 10$ W. Heat flows through thermal resistance of the package + heat sink, raising temperature above ambient.

#strong[Parameters:] - Ambient temperature: $T_(upright("amb")) = 25 degree$C - Thermal resistance (junction to ambient): $R_(upright("th")) = 5$ K/W - Heat capacity of transistor and heat sink: $C_(upright("th")) = 200$ J/K - Thermal time constant: $tau_(upright("th")) = R_(upright("th")) C_(upright("th")) = 5 times 200 = 1000$ s $approx 16.7$ minutes

#strong[Steady-state temperature rise:] $ Delta T_oo = P times R_(upright("th")) = 10 times 5 = 50 upright("°C") $

#strong[Steady-state junction temperature:] $ T_oo = T_(upright("amb")) + Delta T_oo = 25 + 50 = 75 upright("°C") $

#strong[Temperature as function of time:] $ T (t) = 75 (1 - e^(- t \/ 1000)) + 25 $

or equivalently: $ Delta T (t) = 50 (1 - e^(- t \/ 1000)) $

#strong[Time to reach critical temperatures:] - 63% of final: $t = tau = 1000$ s $approx 16.7$ min - 90% of final: $t = 2.3 tau approx 39$ min - 99% of final: $t = 4.6 tau approx 77$ min

#strong[If transistor maximum junction temperature is 150°C:] Safe margin above 75°C is 75°C, so the transistor is operating safely. However, if ambient temperature rises to 100°C, steady state would be 150°C (exactly at limit), requiring active cooling or derated operation.

=== Transient Heat Flow Identification Problem
<transient-heat-flow-identification-problem>
Just like RC electrical circuits, observing the thermal time constant alone cannot determine $R_(upright("th"))$ and $C_(upright("th"))$ separately.

#strong[Observation:] Transistor temperature reaches 63% of final rise in 20 minutes. - Inferred: $tau_(upright("th")) = 1200$ s

#strong[Ambiguity:] Could be: - $R_(upright("th")) = 6$ K/W, $C_(upright("th")) = 200$ J/K, or - $R_(upright("th")) = 4$ K/W, $C_(upright("th")) = 300$ J/K, or - Infinitely many combinations with product = 1200

#strong[Resolution (Theorem M.3.1):] Measure thermal resistance directly using steady-state method: $ R_(upright("th")) = frac(Delta T_oo, P) $

Apply known power (say, 5 W), measure steady-state temperature rise, calculate $R_(upright("th"))$. Once $R_(upright("th"))$ is known, determine $C_(upright("th")) = tau_(upright("th")) \/ R_(upright("th"))$.

#horizontalrule

== X.10 Hydraulic Systems: Pressure-Flow Analogy
<x.10-hydraulic-systems-pressure-flow-analogy>
Hydraulic systems exhibit the same three energy modes (dissipation, kinetic storage, potential storage) as mechanical and electrical systems. The governing equations follow the same pattern.

=== Hydraulic Circuit Laws
<hydraulic-circuit-laws>
#strong[Flow conservation (continuity):] $ Q_(upright("in")) = Q_(upright("out")) + Q_(upright("stored")) $

where $Q$ is volume flow rate \[m³/s\].

#strong[Pressure-flow relationships (constitutive):]

+ #strong[Resistance (orifice, valve):] Pressure drop proportional to flow $ Delta p = R_h Q $ where $R_h$ is hydraulic resistance \[Pa·s/m³\]

+ #strong[Inertance (long pipe, fluid inertia):] Pressure drop proportional to rate of change of flow $ Delta p = I_h frac(d Q, d t) $ where $I_h$ is hydraulic inertance \[Pa·s²/m³\]

+ #strong[Compliance (accumulator, flexible volume):] Pressure related to stored volume $ Q = C_h frac(d p, d t) $ where $C_h$ is compliance \[m³/Pa\]

=== RLC Hydraulic Analogy
<rlc-hydraulic-analogy>
#table(
  columns: 2,
  align: (left,left,),
  table.header([Electrical], [Hydraulic],),
  table.hline(),
  [Voltage $V$], [Pressure $p$],
  [Current $I$], [Flow rate $Q$],
  [Resistance $R$], [Hydraulic resistance $R_h$],
  [Inductance $L$], [Hydraulic inertance $I_h$],
  [Capacitance $C$], [Compliance $C_h$],
)
A hydraulic system with all three elements (restriction, inertance, accumulator) in series obeys the #strong[identical] differential equation as an RLC circuit:

$ frac(d^2 p, d t^2) + 2 zeta omega_0 frac(d p, d t) + omega_0^2 p = omega_0^2 p_(upright("source")) $

where $omega_0 = 1 \/ sqrt(I_h C_h)$ and $zeta = R_h / 2 sqrt(C_h / I_h)$.

=== Example: Hydraulic Shock Absorber
<example-hydraulic-shock-absorber>
#strong[Scenario:] Automotive suspension system with hydraulic damper. When the wheel hits a bump, the piston compresses hydraulic fluid through a valve (resistance), with fluid inertia and accumulator compliance also present.

#strong[Parameters:] - Natural frequency (undamped): $omega_0 = 20$ rad/s $arrow.r.double$ $f_0 = 3.2$ Hz (typical suspension frequency) - Damping ratio: $zeta = 0.7$ (between critical and underdamped, comfortable ride) - Inertance (fluid + piston): $I_h = 10^10$ Pa·s²/m³ - Compliance (gas accumulator): $C_h = 10^(- 9)$ m³/Pa - Resistance (valve): $R_h = 2 zeta sqrt(I_h \/ C_h) approx 2 times 0.7 times 10^10 = 1.4 times 10^10$ Pa·s/m³

#strong[Step response:] When piston suddenly compresses fluid (like hitting a bump), pressure rises. The response exhibits the same underdamped behavior as the RLC circuit: - Overshoot of \~4.6% (from $zeta = 0.7$) - Settling time \~4 cycles at 3.2 Hz $approx$ 1.25 seconds - Smooth, controlled response without harshness

This is why engineers design shock absorbers with specific damping ratios---the math is identical to electrical circuit design!

#horizontalrule

== X.11 Cross-Domain Power and Energy Efficiency
<x.11-cross-domain-power-and-energy-efficiency>
=== Universal Power Formula
<universal-power-formula>
In every domain, the instantaneous power transferred across a port is the product of effort and flow:

$ P (t) = e (t) dot.op f (t) $

#table(
  columns: (25%, 25%, 25%, 25%),
  align: (left,left,left,left,),
  table.header([Domain], [Effort], [Flow], [Power],),
  table.hline(),
  [Electrical], [Voltage $V$], [Current $I$], [$P = V I$ \[W\]],
  [Mechanical], [Force $F$], [Velocity $v$], [$P = F v$ \[W\]],
  [Hydraulic], [Pressure $p$], [Flow $Q$], [$P = p Q$ \[W\]],
  [Thermal], [Temperature difference $Delta T$], [Heat flow $dot(Q)$], [$dot(W) = Delta T dot.op dot(Q) \/ R_(upright("th"))$ \[W\]],
)
=== Energy Storage Efficiency at Resonance
<energy-storage-efficiency-at-resonance>
At resonance in driven RLC (and all analogous systems), energy oscillates between two storage elements while dissipation varies with drive frequency:

#strong[Energy dissipated per cycle at resonance:] $ E_(upright("diss")) = frac(pi V_0^2, R) $

(energy dissipated in resistance)

#strong[Energy stored at resonance:] $ E_(upright("stored")) = frac(V_0^2, 2 omega_0^2 L) = frac(V_0^2, 2 R zeta \/ Q) $

#strong[Quality factor as energy ratio:] $ Q = 2 pi E_(upright("stored")) / E_(upright("diss")) $

High-$Q$ systems store much energy but dissipate little---sharp resonance, slow decay. Low-$Q$ systems dissipate energy quickly---broad response, fast settling.

=== Example: Minimizing Power Loss in an Electrical Distribution Network
<example-minimizing-power-loss-in-an-electrical-distribution-network>
#strong[Scenario:] Long-distance power transmission line carrying AC current $I$ at frequency $omega$. The line has resistance $R$ and inductance $L$ per unit length.

#strong[Total impedance magnitude:] $ lr(|Z|) = sqrt(R^2 + (omega L)^2) $

#strong[Power delivered (neglecting reactive power):] $ P_(upright("delivered")) = frac(V^2 R, R^2 + (omega L)^2) $

#strong[Power loss (dissipated as heat in wire):] $ P_(upright("loss")) = I^2 R $

#strong[Efficiency:] $ eta = frac(P_(upright("delivered")), P_(upright("delivered")) + P_(upright("loss"))) = frac(R, R^2 + (omega L)^2) times P / I^2 $

To minimize loss: 1. #strong[Reduce frequency] (use DC where practical---eliminates inductive reactance) 2. #strong[Increase voltage] (reduces current for fixed power, since $P = V I$; since loss $prop I^2$, high voltage is more efficient) 3. #strong[Reduce resistance] (use thicker wires, better materials)

This is why power companies transmit at hundreds of kilovolts (high $V$, low $I$) and prefer DC for long-distance submarine cables.

#horizontalrule

== The Hidden Revelation Awaiting
<the-hidden-revelation-awaiting>
We have surveyed electrical systems systematically: RC circuits (charging), RL circuits (inductance), LC oscillations (storage), RLC networks (damped oscillations), driven systems (resonance), and cross-domain analogies (thermal, hydraulic). Each demonstration has reinforced the thesis: #strong[The equation is universal. Only the physical substrate changes.]

But a question nags: #emph[Why?] Why are the mathematical forms identical across domains? Why must gravity, when expressed in the weak-field limit, obey the same equations as electromagnetism? Why must electrical and mechanical systems have the same fundamental structure?

The answer is profound and unavoidable: #strong[Conservation laws + power conjugacy permit no alternative.] Physics could not be different. The patterns we've identified are not engineering conveniences or mathematical tricks---they are necessities implied by the deepest principles of physics.

Before we proceed to bond graphs and rigorously prove this necessity (Part XII), we must confront the ultimate revelation: gravity and electricity are the same force. This is not a loose analogy. It is exact mathematical identity up to coupling constants.

Prepare to see the equations governing the universe's most fundamental forces and recognize within them the circuits you've just learned.

#horizontalrule

= Part XI: The Universal Structure---Gravity, Electromagnetism, and Cross-Domain Analogies
<part-xi-the-universal-structuregravity-electromagnetism-and-cross-domain-analogies>
== Introduction to Part XI
<introduction-to-part-xi>
Before we complete our survey of electrical systems, we pause to reveal a profound discovery: gravity and electricity are #strong[mathematically identical];. This is not a metaphor, analogy, or approximation---it is exact structural isomorphism. This revelation transforms how we understand the framework developed in Parts I-X, showing that the patterns of change we've identified apply not merely to human-engineered systems but to the fundamental forces of nature itself.

This part accomplishes three goals:

+ #strong[Dimensional analysis reveals the gravity-electricity identity] (Sections XI.1-XI.3): Using only dimensional arguments, we show that gravitational and electrical potential are formally identical, differing only in the "charge carrier" (mass vs.~electric charge).

+ #strong[Maxwell equations and gravitational field equations are the same] (Sections XI.4-XI.7): Gravity admits a "Maxwell-like" formulation revealing gravitomagnetic effects, radiation, and weak-field approximations.

+ #strong[This analogy is not pedagogical accident but mathematical necessity] (Sections XI.8-XI.9): We prove that any two systems obeying identical conservation laws and power-conjugacy structure must have identical mathematics.

After completing this part, we return to RLC circuits (now Part XII) with transformed understanding: every circuit equation we write has appeared in gravity, mechanics, and thermodynamics. The universality of pattern is not surprising---it is inevitable.

#horizontalrule

== XI.1 The Unremarked Analogy
<xi.1-the-unremarked-analogy>
A striking fact rarely emphasized in undergraduate physics: #strong[gravitational potential and electrical potential have identical mathematical structure];. They are not similar; they are isomorphic. Yet most students complete a physics degree without recognizing this fundamental unity.

The reason is pedagogical: gravity and electricity are typically taught in isolation, using different symbols and notation conventions that obscure their identity. This section removes that obscurity through dimensional analysis, revealing that #strong[gravitational potential is the gravitational Volt];.

== XI.2 Dimensional Analysis: Unmasking the Gravitational Volt
<xi.2-dimensional-analysis-unmasking-the-gravitational-volt>
=== Electrical Potential (Voltage)
<electrical-potential-voltage>
By definition, electrical potential is energy per unit charge: $ V = upright("Energy") / upright("Charge") = upright("J") / upright("C") $

Alternatively, potential is force-per-charge times distance: $ V = frac(upright("Force") times upright("distance"), upright("Charge")) = frac(upright("N") dot.op upright("m"), upright("C")) = upright("J") / upright("C") $

#strong[Units:] Joules per Coulomb, or equivalently: #strong[V] (Volts)

=== Gravitational Potential (The Gravitational Volt)
<gravitational-potential-the-gravitational-volt>
By perfect analogy, gravitational potential is energy per unit #strong[mass];: $ phi.alt = upright("Energy") / upright("mass") = upright("J") / upright("kg") $

Alternatively, gravitational potential is gravitational force-per-mass times distance: $ phi.alt = frac(upright("Force") times upright("distance"), upright("mass")) = frac(upright("N") dot.op upright("m"), upright("kg")) = upright("J") / upright("kg") $

Let us expand this in base units: $ upright("J") / upright("kg") = frac(upright("kg") dot.op upright("m")^2 \/ upright("s")^2, upright("kg")) = upright("m")^2 / upright("s")^2 $

#strong[Units:] Joules per kilogram, or equivalently: #strong[m²/s²]

=== The Stunning Symmetry
<the-stunning-symmetry>
$ bold("Quantity") & bold("Electrical") & bold("Gravitational")\
bold("Potential") & V = upright("J") \/ upright("C") & phi.alt = upright("J") \/ upright("kg")\
bold("(Volts)") & upright("(Volts)") & upright("(gravitational Volts)")\
bold("Source density") & rho_e = upright("C") \/ upright("m")^3 & rho_m = upright("kg") \/ upright("m")^3\
bold("\"Charge-like\" quantity") & upright("Charge ") q & upright("Mass ") m\
bold("Field strength") & E = V \/ upright("m") = upright("J") \/ (upright("C") dot.op upright("m")) & g = phi.alt \/ upright("m") = upright("J") \/ (upright("kg") dot.op upright("m"))\
bold("Force") & F = q E & F = m g\
bold("Power") & P = V dot.op I = (J \/ C) dot.op (C \/ s) & P = phi.alt dot.op dot(m) = (J \/ k g) dot.op (k g \/ s)\
 $

#strong[Key Recognition:] - Electrical voltage is energy per unit #strong[charge] - Gravitational potential is energy per unit #strong[mass] - #strong[Charge and mass play identical roles] - Therefore: #strong[Gravitational potential IS the gravitational equivalent of voltage] - And gravitational field strength (m/s²) is literally acceleration---the "gravitational electric field"

== XI.3 Newton's Law of Universal Gravitation and Coulomb's Law---The Perfect Parallel
<xi.3-newtons-law-of-universal-gravitation-and-coulombs-lawthe-perfect-parallel>
=== Coulomb's Law (Electric Force Between Charges)
<coulombs-law-electric-force-between-charges>
$ arrow(F)_(upright("elec")) = k_e frac(q_1 q_2, r^2) hat(r) $

where: - $k_e = 8.99 times 10^9$ N⋅m²/C² - $q_1 \, q_2$ are charges (Coulombs) - $r$ is separation distance - Force is repulsive for like signs, attractive for opposite signs

=== Newton's Law of Universal Gravitation
<newtons-law-of-universal-gravitation>
$ arrow(F)_(upright("grav")) = - G frac(m_1 m_2, r^2) hat(r) $

where: - $G = 6.674 times 10^(- 11)$ N⋅m²/kg² - $m_1 \, m_2$ are masses (kilograms) - $r$ is separation distance - Force is always attractive (note the minus sign)

=== Structural Identity (Except for Sign and Coupling Type)
<structural-identity-except-for-sign-and-coupling-type>
Define the #strong[electrical potential] at distance $r$ from charge $q$: $ V (r) = k_e q / r $

The electric force on a test charge $q_(upright("test"))$ is: $ F_e = q_(upright("test")) dot.op E = q_(upright("test")) (- frac(d V, d r)) = q_(upright("test")) dot.op k_e q / r^2 $

Define the #strong[gravitational potential] at distance $r$ from mass $m$: $ phi.alt (r) = - G m / r $

(Note the minus sign, indicating attraction.)

The gravitational force on a test mass $m_(upright("test"))$ is: $ F_g = m_(upright("test")) dot.op g = m_(upright("test")) (- frac(d phi.alt, d r)) = m_(upright("test")) (- frac(d, d r) (- G m / r)) = - m_(upright("test")) dot.op G m / r^2 $

=== The Mathematical Structure
<the-mathematical-structure>
Both follow the #strong[inverse-square law];. Both can be written as:

$ arrow(F) = (upright("test quantity")) times (upright("field strength")) $

where field strength is the gradient of potential.

#strong[Crucial Point:] The constant $k_e$ has units \[N⋅m²/C²\] and $G$ has units \[N⋅m²/kg²\]. This difference in units reflects that charge and mass are #emph[different quantities with different physical meanings];---but mathematically, they play identical roles.

== XI.4 Gauss's Law and the Poisson Equation---Perfect Duality
<xi.4-gausss-law-and-the-poisson-equationperfect-duality>
=== Gauss's Law (Electrostatics)
<gausss-law-electrostatics>
The electric field is related to charge density through: $ nabla dot.op arrow(E) = rho_e / epsilon.alt_0 $

where $rho_e$ is charge density and $epsilon.alt_0 = 8.854 times 10^(- 12)$ F/m is the electric permittivity.

Since $E = - nabla V$: $ nabla dot.op (- nabla V) = rho_e / epsilon.alt_0 $

$ nabla^2 V = - rho_e / epsilon.alt_0 $

This is #strong[Poisson's equation] for electrical potential.

=== Gauss's Law for Gravity
<gausss-law-for-gravity>
By exact analogy, the gravitational field is related to mass density through: $ nabla dot.op arrow(g) = 4 pi G rho_m $

where $rho_m$ is mass density.

Since $g = - nabla phi.alt$: $ nabla dot.op (- nabla phi.alt) = 4 pi G rho_m $

$ nabla^2 phi.alt = - 4 pi G rho_m $

This is #strong[Poisson's equation for gravitational potential];.

=== Side-by-Side Comparison
<side-by-side-comparison>
$ bold("Electrostatics") & bold("Gravitation")\
nabla dot.op arrow(E) = rho_e \/ epsilon.alt_0 & nabla dot.op arrow(g) = 4 pi G rho_m\
arrow(E) = - nabla V & arrow(g) = - nabla phi.alt\
nabla^2 V = - rho_e \/ epsilon.alt_0 & nabla^2 phi.alt = - 4 pi G rho_m\
upright("Potential energy: ") U = q V & upright("Potential energy: ") U = m phi.alt\
upright("Force on test charge: ") F = q E & upright("Force on test mass: ") F = m g\
 $

#strong[The only difference:] the coupling constants ($epsilon.alt_0$ vs.~$4 pi G$) and the fact that electric interactions can be repulsive (like charges) or attractive (opposite charges), while gravity is #strong[always attractive];.

== XI.5 Power Conjugacy in Gravitational and Electromagnetic Fields
<xi.5-power-conjugacy-in-gravitational-and-electromagnetic-fields>
=== Electrical Power in Field Form
<electrical-power-in-field-form>
Power dissipated in a resistive medium is: $ P = integral_V arrow(J) dot.op arrow(E) thin d V $

where: - $arrow(J)$ is current density (flow of charge per unit area per unit time) - $arrow(E)$ is electric field (effort per unit charge) - Product: \[A/m²\] × \[V/m\] = \[J/(m³⋅s)\] = power density

#strong[Power conjugacy:] Effort ($arrow(E)$) × Flow ($arrow(J)$) = Power density

=== Gravitational Power in Field Form
<gravitational-power-in-field-form>
By exact analogy, power flow in a gravitational field is: $ P = integral_V arrow(J)_m dot.op arrow(g) thin d V $

where: - $arrow(J)_m$ is mass flux (flow of mass per unit area per unit time) = $rho arrow(v)$ - $arrow(g)$ is gravitational field (effort per unit mass = acceleration) - Product: \[kg/(m²⋅s)\] × \[m/s²\] = \[kg⋅m/(m²⋅s³)\] = \[J/(m³⋅s)\] = power density

Equivalently, using gravitational potential: $ P = integral_V phi.alt dot.op frac(partial rho, partial t) thin d V $

This is the rate at which gravitational potential energy changes as mass density evolves.

#strong[Power conjugacy verified:] Effort ($arrow(g)$ or $phi.alt$) × Flow (mass flux or $partial rho \/ partial t$) = Power density

== XI.6 Worked Example: Earth's Gravitational Potential as a Function of Altitude
<xi.6-worked-example-earths-gravitational-potential-as-a-function-of-altitude>
#strong[Question:] What is the gravitational potential at height $h$ above Earth's surface? Verify it has units of "gravitational Volts."

#strong[Solution:]

Assuming uniform Earth of mass $M$ and radius $R$, gravitational potential at height $h$ is: $ phi.alt (h) = - G frac(M, R + h) $

At Earth's surface ($h = 0$): $ phi.alt_(upright("surface")) = - G M / R = - 6.67 times 10^(- 11) times frac(5.972 times 10^24, 6.371 times 10^6) = - 6.26 times 10^7 upright(" J/kg") $

#strong[Units check:] $[10^(- 11) upright(" N⋅m")^2 \/ upright("kg")^2] times [upright("kg") \/ upright("m")] = 10^(- 11) times 10^24 \/ 10^6 times [upright("N⋅m/kg")] = [upright("J/kg")]$ ✓

#strong[Interpretation:] At Earth's surface, the gravitational potential is approximately #strong[62.6 mega-Volts] (in gravitational Volts, where 1 gravitational Volt = 1 J/kg).

#strong[Power Example:] If 1 kg/s of water falls from height $h = 100$ m to height $h = 0$:

Gravitational potential difference: $ Delta phi.alt = - G M / R - (- G frac(M, R + 100)) approx g dot.op 100 = 9.81 times 100 = 981 upright(" J/kg") $

(using $g approx 9.81$ m/s² near Earth's surface)

Power released: $ P = (upright("mass flow rate")) times (upright("potential difference")) = 1 upright(" kg/s") times 981 upright(" J/kg") = 981 upright(" W") $

This matches the classical formula: $P = m g h$ power $= (1 upright(" kg")) times (9.81 upright(" m/s")^2) times (100 upright(" m")) \/ upright("s") = 981$ W.

#strong[The stunning point:] This is calculated #strong[exactly as in electrical circuits];: $ P_(upright("elec")) = I times V = (upright("charge flow rate")) times (upright("voltage difference")) $ $ P_(upright("grav")) = dot(m) times Delta phi.alt = (upright("mass flow rate")) times (upright("gravitational potential difference")) $

== XI.7 Maxwell Equations and the Gravitational Field Equations --- The Complete Theory
<xi.7-maxwell-equations-and-the-gravitational-field-equations-the-complete-theory>
The equivalence between gravity and electromagnetism reaches its fullest expression when we recognize that #strong[Einstein's gravity, in the weak-field limit, obeys Maxwell-like equations];. This is not a heuristic analogy but a rigorous approximation of general relativity, revealing gravitomagnetic phenomena and predicting gravitational radiation.

This section develops gravitoelectromagnetism (GEM) from first principles, demonstrates the isomorphism with Maxwell equations, and validates the theory against three decades of experimental evidence.

#horizontalrule

=== XI.7.1 Four Foundational Assumptions of Gravitoelectromagnetism
<xi.7.1-four-foundational-assumptions-of-gravitoelectromagnetism>
Gravitoelectromagnetism is valid under precise conditions. Violations of these assumptions lead to deviations requiring full general relativity.

#strong[Assumption 1: Weak Gravitational Fields]

The metric perturbation must satisfy $lr(|h_(mu nu)|) lt.double 1$, where $g_(mu nu) = eta_(mu nu) + h_(mu nu)$ (perturbation expansion).

Equivalently, the gravitational potential must satisfy $lr(|Phi \/ c^2|) lt.double 1$, where $Phi = - phi.alt$ in our sign convention.

#emph[Physical meaning:] The spacetime is nearly flat; curvature effects are small perturbations to Minkowski space.

#emph[Examples:] - #strong[Earth's surface:] $Phi \/ c^2 tilde.op 10^(- 9)$ ✓ (excellent GEM approximation) - #strong[Jupiter:] $Phi \/ c^2 tilde.op 10^(- 8)$ ✓ (GEM highly accurate) - #strong[Neutron star surface:] $Phi \/ c^2 tilde.op 0.1 - 0.2$ ✗ (GEM breaks down, need full GR) - #strong[Black hole horizon:] $Phi \/ c^2 tilde.op 1$ ✗ (Extreme failure of linearization)

#emph[Criterion:] If you can ignore $(Phi \/ c^2)^2$ terms, GEM is valid.

#strong[Assumption 2: Non-Relativistic Source Motion]

Sources (masses, mass currents) must move at speeds $v lt.double c$. Equivalently, the Lorentz factor $gamma = 1 \/ sqrt(1 - v^2 \/ c^2)$ should satisfy $gamma - 1 lt.double 1$, so $gamma approx 1$.

#emph[Physical meaning:] Gravitomagnetic effects (from moving mass) are suppressed by factors of $v \/ c$ relative to gravitoelectric effects. At slow speeds, they're negligible; at relativistic speeds, they dominate.

#emph[Examples:] - #strong[Earth's orbital motion:] $v tilde.op 30$ km/s $= 10^(- 4) c$ → Gravitomagnetic effects $tilde.op 10^(- 8)$ of gravitoelectric ✓ - #strong[Binary pulsar PSR B1913+16:] $v tilde.op 0.002 c$ → GEM works beautifully ✓ - #strong[Merging neutron stars (LIGO):] Final phase has $v tilde.op 0.3 c$ → GEM approximation fails, need full GR ✗

#strong[Assumption 3: Quasi-Static Sources]

Source characteristics must evolve slowly compared to light-crossing time. Mathematically: $partial_t \/ L lt.double c \/ L$, or $partial_t lt.double c dot.op partial_x$.

Equivalently, gravitational radiation wavelengths must be much longer than system size.

#emph[Physical meaning:] The retarded-time effects (light takes time to propagate from source to field point) are small; fields respond quasi-instantaneously to source changes.

#emph[Examples:] - #strong[Earth-Sun system:] Characteristic timescale (year) $gt.double$ light-crossing time (8 minutes) ✓ - #strong[Planetary orbits:] All quasi-static ✓ - #strong[Merging black holes:] Merger timescale (seconds) $tilde.op$ light-crossing time (milliseconds) ✗ → Radiation dominates - #strong[Supernova core collapse:] Millisecond timescale comparable to light-crossing time → Radiation crucial ✗

#strong[Assumption 4: Isolated Sources / Far-Field Regime]

The field point must be in the #strong[far field] of localized sources. Multipole expansion converges; boundary terms (surface of matter) can be approximated.

Mathematically: $r gt.double$ (size of source) and $r gt.double$ (Schwarzschild radius of source).

#emph[Physical meaning:] We can use multipole expansion; monopole (mass) dominates; higher multipoles (quadrupole radiation, etc.) are suppressed.

#emph[Examples:] - #strong[Orbital dynamics at $r > 1$ AU:] Excellent far-field approximation ✓ - #strong[Near neutron star surface ($r = 10$ km):] For 1.4 solar mass star, Schwarzschild radius $approx 4$ km, so barely in far-field ✗ - #strong[Black hole vicinity:] Always near-field regime ✗

#horizontalrule

=== XI.7.2 Derivation from Einstein's Field Equations
<xi.7.2-derivation-from-einsteins-field-equations>
Start with Einstein's field equations:

$ G_(mu nu) = frac(8 pi G, c^4) T_(mu nu) $

where $G_(mu nu)$ is the Einstein tensor (encodes curvature) and $T_(mu nu)$ is the stress-energy tensor (matter/energy).

#strong[Step 1: Metric Perturbation]

Assume the metric is nearly flat:

$ g_(mu nu) = eta_(mu nu) + h_(mu nu) \, quad lr(|h_(mu nu)|) lt.double 1 $

where $eta_(mu nu) = upright("diag") (- 1 \, 1 \, 1 \, 1)$ (mostly-plus signature) and $h_(mu nu)$ is the perturbation.

#strong[Step 2: Linearized Einstein Equations]

Expanding $G_(mu nu)$ to first order in $h$:

$ G_(mu nu) approx - 1 / 2 [square.stroked h_(mu nu) - partial_mu partial_rho h_nu^rho - partial_nu partial_rho h_mu^rho + partial_mu partial_nu h_rho^rho + eta_(mu nu) (partial_rho partial_sigma h^(rho sigma) - square.stroked h_rho^rho)] $

This is complex. Impose #strong[harmonic (Lorenz) gauge] to simplify:

$ partial_mu macron(h)^(mu nu) = 0 \, quad upright("where") quad macron(h)^(mu nu) = h^(mu nu) - 1 / 2 eta^(mu nu) h $

#strong[Step 3: Harmonic Gauge Simplification]

In harmonic gauge, the linearized equations reduce to:

$ square.stroked macron(h)^(mu nu) = - frac(16 pi G, c^4) T^(mu nu) $

where $square.stroked = - partial_t^2 + nabla^2$ is the d'Alembertian (wave operator).

This is a #strong[wave equation with source];---exactly the form we need for identifying field potentials.

#strong[Step 4: Define Gravitoelectric and Gravitomagnetic Potentials]

Identify the metric components with potentials:

$ h_00 = - frac(4 Phi_g, c^2) \, quad h_(0 i) = - frac(4 A_i^g, c^3) $

where: - $Phi_g (t \, arrow(r))$ = gravitoelectric potential (scalar) - $arrow(A)^g (t \, arrow(r))$ = gravitomagnetic potential (vector)

#strong[Step 5: Define Gravitoelectric and Gravitomagnetic Fields]

Just as in electromagnetism ($arrow(E) = - nabla phi.alt - partial_t arrow(A)$, $arrow(B) = nabla times arrow(A)$), define:

$ arrow(E)_g = - nabla Phi_g - frac(partial arrow(A)^g, partial t) $

$ arrow(B)_g = nabla times arrow(A)^g $

#emph[Physical interpretation:] - $arrow(E)_g$ = gravitoelectric field (equivalent to Newtonian $arrow(g)$, acceleration felt by test particles) - $arrow(B)_g$ = gravitomagnetic field (novel effect due to moving mass, predicted by GR)

#strong[Step 6: Derive Gravitoelectromagnetic Field Equations]

Taking divergences and curls of the linearized equations, one obtains (in harmonic gauge with non-relativistic sources):

$ nabla dot.op arrow(E)_g = 4 pi G rho_m quad upright("(Gauss for gravity)") $

$ nabla times arrow(E)_g = - frac(partial arrow(B)_g, partial t) quad upright("(Faraday for gravity)") $

$ nabla dot.op arrow(B)_g = 0 quad upright("(no magnetic monopoles)") $

$ nabla times arrow(B)_g = frac(4 pi G, c^2) arrow(J)_m + frac(4 pi G, c^4) frac(partial arrow(E)_g, partial t) quad upright("(Ampère-Maxwell for gravity)") $

where $arrow(J)_m$ is mass flux density.

#strong[Comparison with Maxwell Equations:]

#table(
  columns: (33.33%, 33.33%, 33.33%),
  align: (left,left,left,),
  table.header([Quantity], [Maxwell EM], [Gravitoelectromagnetism],),
  table.hline(),
  [#strong[Gauss];], [$nabla dot.op arrow(E) = rho_e \/ epsilon.alt_0$], [$nabla dot.op arrow(E)_g = 4 pi G rho_m$],
  [#strong[Faraday];], [$nabla times arrow(E) = - partial_t arrow(B)$], [$nabla times arrow(E)_g = - partial_t arrow(B)_g$],
  [#strong[No monopoles];], [$nabla dot.op arrow(B) = 0$], [$nabla dot.op arrow(B)_g = 0$],
  [#strong[Ampère-Maxwell];], [$nabla times arrow(B) = mu_0 arrow(J) + mu_0 epsilon.alt_0 partial_t arrow(E)$], [$nabla times arrow(B)_g = (4 pi G \/ c^2) arrow(J)_m + (4 pi G \/ c^4) partial_t arrow(E)_g$],
)
The #strong[isomorphism is exact] at the level of linearized GR. The coupling constants are different ($epsilon.alt_0 arrow.l.r 1 \/ (4 pi G)$, $mu_0 arrow.l.r 4 pi G \/ c^2$), but the structure is identical.

#horizontalrule

=== XI.7.3 Liénard-Wiechert Potentials for Gravity
<xi.7.3-liénard-wiechert-potentials-for-gravity>
For a #strong[point mass $M$ moving with velocity $arrow(v) (t)$ along trajectory $arrow(r)_s (t)$];, the potentials at field point $arrow(r)$ are:

$ Phi_g (arrow(r) \, t) = - frac(G M, lr(|arrow(r) - arrow(r)_s (t_(upright("ret")))|) - frac(arrow(v) (t_(upright("ret"))), c) dot.op [arrow(r) - arrow(r)_s (t_(upright("ret")))] \/ c) $

$ arrow(A)^g (arrow(r) \, t) = frac(arrow(v) (t_(upright("ret"))), c^2) Phi_g (arrow(r) \, t) $

where the #strong[retarded time] $t_(upright("ret"))$ is defined implicitly by:

$ c (t - t_(upright("ret"))) = lr(|arrow(r) - arrow(r)_s (t_(upright("ret")))|) $

#emph[Physical meaning:] The field at time $t$ and location $arrow(r)$ depends on where the source was at an earlier time such that light had time to propagate the distance.

#strong[Non-Relativistic Limit:]

For $v lt.double c$, expand to first order:

$ Phi_g approx - frac(G M, r) - frac(G M, c^2 r^3) arrow(v) dot.op (arrow(r) - arrow(r)_s) $

where $r = lr(|arrow(r) - arrow(r)_s|)$.

The first term is the static Newtonian potential; the second is a velocity-dependent correction (gravitomagnetic effect).

#strong[Jefimenko's Equations for Gravity:]

The fields themselves can be expressed (without solving for potentials):

$ arrow(E)_g (arrow(r) \, t) = - frac(G M, r^2) hat(r) + frac(G, c^2 r^2) arrow(a) times (hat(r) times arrow(v)) $

$ arrow(B)_g (arrow(r) \, t) = frac(arrow(v) (t_(upright("ret"))) times arrow(E)_g (t_(upright("ret"))), c^2) $

where $arrow(a)$ is the acceleration of the mass.

#emph[Key difference from EM:] The Poynting vector for EM radiation (energy density flowing outward) is $arrow(S) = (1 \/ mu_0) arrow(E) times arrow(B)$, always pointing outward. For #strong[gravity];, the analogous quantity points #strong[inward];: energy radiates away, but angular momentum considerations make the sign reversed. This is why gravitational waves carry energy away at a different rate than EM waves.

#horizontalrule

=== XI.7.4 Gravitational Larmor Formula and Radiation
<xi.7.4-gravitational-larmor-formula-and-radiation>
A #strong[moving mass distributes its energy via gravitational radiation];. The power radiated depends on the quadrupole moment and its time derivatives.

For a #strong[localized system with quadrupole moment tensor] $Q_(i j) (t)$:

$ P_(upright("grav")) = - frac(2 G, 5 c^5) accent(Q, ⃛)_(i j) accent(Q, ⃛)^(i j) $

where $accent(Q, ⃛)_(i j) = frac(d^3 Q_(i j), d t^3)$ (third time derivative).

The quadrupole moment is defined as:

$ Q_(i j) = integral rho (arrow(r)) (3 x_i x_j - delta_(i j) r^2) d^3 r $

#strong[Binary System Example:]

For a binary with masses $m_1 \, m_2$ separated by distance $a$, in a circular orbit:

$ P_(upright("grav")) = frac(32 G^4, 5 c^5) frac((m_1 m_2)^2 (m_1 + m_2), a^5) $

#strong[Numerical example (Hulse-Taylor pulsar PSR B1913+16):]

- $m_1 approx 1.44 M_dot.circle$, $m_2 approx 1.39 M_dot.circle$
- $a approx 1.95 times 10^9$ meters (orbital separation)
- $P_(upright("grav")) approx 7.35 times 10^24$ Watts

For comparison: - #strong[Sun's luminosity:] $3.8 times 10^26$ W - #strong[Hulse-Taylor at merger:] Would reach $10^52$ W (neutron star merger scale)

#strong[Why Gravitational Radiation is Weaker Than EM Radiation:]

EM radiation from an accelerating charge goes as:

$ P_(upright("EM")) tilde.op frac(e^2 a^2, c^3) $

Gravitational radiation from an accelerating mass goes as:

$ P_(upright("grav")) tilde.op frac(G m^2 a^2, c^5) = (frac(G m, c^2))^2 a^2 / c $

The ratio is:

$ P_(upright("grav")) / P_(upright("EM")) tilde.op (r_s / L)^2 $

where $r_s = G m \/ c^2$ is the Schwarzschild radius and $L$ is the system size.

For neutron star ($m = 1.4 M_dot.circle$, $r_s approx 4$ km, $L approx 10$ km): ratio $tilde.op 10^(- 2)$

For the Sun ($r_s approx 3$ km, $L tilde.op 1$ AU): ratio $tilde.op 10^(- 43)$

This explains why gravitational radiation is so hard to detect: it's suppressed by the square of the Schwarzschild radius to system size ratio.

#horizontalrule

=== XI.7.5 Experimental Validation of Gravitoelectromagnetism
<xi.7.5-experimental-validation-of-gravitoelectromagnetism>
Three independent experiments confirm GEM:

#strong[Experiment 1: Gravity Probe B (2004-2005)]

Orbiting gyroscopes should precess due to: 1. #strong[Geodetic precession:] Due to moving through curved space (gravitoelectric effect) 2. #strong[Frame dragging:] Due to Earth's rotation (gravitomagnetic effect)

Theory predicts: - Geodetic: $approx 6 \, 600$ mas/year (milliarcseconds per year) - Frame-drag: $approx 39$ mas/year

Gravity Probe B measured: - Frame-drag: $37.2 plus.minus 7.2$ mas/year ✓

Match to predictions validates the gravitomagnetic $arrow(B)_g$ field predicted by GEM.

#strong[Experiment 2: LIGO Gravitational Wave Detections (2015-present)]

LIGO directly measures gravitational radiation from inspiraling/merging binary systems.

#emph[GW150914 (September 14, 2015):] Two black holes ($tilde.op 36 M_dot.circle$ and $tilde.op 29 M_dot.circle$) merged.

The detected #strong[waveform] (how amplitude and frequency change over time) matches GEM + general relativity predictions: - Inspiral phase: Quadrupole radiation formula gives correct decay rate ✓ - Merger phase: Non-linear GR needed; GEM breaks down as expected - Ringdown phase: Black hole settling described by GR ✓

Since 2015, LIGO and Virgo have detected 90+ gravitational wave events.

#strong[Experiment 3: Hulse-Taylor Pulsar (1974-2005)]

The binary pulsar PSR B1913+16 decays its orbit due to gravitational radiation.

Theory predicts orbital decay rate:

$ dot(a) = - frac(d E, d t) \/ frac(d E, d a) = - frac(12 G^3 m_1 m_2 (m_1 + m_2), c^5 a^3) $

Measurements over 40 years show:

$ dot(a)_(upright("measured")) = (- 2.4200 plus.minus 0.0001) times 10^(- 12) upright(" s")^(- 1) $

$ dot(a)_(upright("predicted")) = (- 2.4035 plus.minus 0.0051) times 10^(- 12) upright(" s")^(- 1) $

Agreement to #strong[0.1%];---the most precise test of GR ever performed.

This pulsar is merger on a timescale of $tilde.op 300$ million years. In another $tilde.op 85$ million years, it will merge.

#horizontalrule

=== XI.7.6 Limitations and Breakdown of Gravitoelectromagnetism
<xi.7.6-limitations-and-breakdown-of-gravitoelectromagnetism>
#strong[Regime of Validity:]

GEM is valid when: - $lr(|Phi \/ c^2|) lt.tilde 0.01$ (weak field) - $v lt.tilde 0.1 c$ (non-relativistic) - System size $lt.tilde$ light-crossing time - Source far enough away (far field)

#strong[Failure Cases:]

+ #strong[Strong Gravitational Fields:] Near black hole horizons ($Phi \/ c^2 tilde.op 1$), neutron star surfaces ($Phi \/ c^2 tilde.op 0.2$), GEM fails. Full general relativity is required.

+ #strong[Relativistic Velocities:] Binary mergers in their final phase have $v tilde.op 0.3 - 0.5 c$. GEM's linear approximation breaks down; nonlinear effects dominate.

+ #strong[Radiation Dominance:] For very short timescales (merger itself, nanosecond-scale), the assumption of quasi-static evolution breaks down. The system is highly dynamical.

+ #strong[Nonlinear Gravitational Effects:] GR is nonlinear: the gravitational field of radiation itself curves spacetime further. GEM, being linear, cannot capture this self-interaction.

+ #strong[Quantum Effects (speculative):] At Planck scale ($planck.reduce G \/ c^3$), quantum gravity effects become important. GEM is entirely classical.

#strong[Summary:] GEM is the appropriate approximation for solar system dynamics, binary pulsars, and the early inspiral phase of merging compact objects. For neutron star mergers and black hole events, GEM provides qualitative guidance (e.g., radiation formula) but quantitative predictions require full nonlinear GR. For Planck-scale phenomena, a quantum theory of gravity is needed.

== XI.8 Why This Analogy Is Almost Never Taught
<xi.8-why-this-analogy-is-almost-never-taught>
This profound structural identity---gravity and electricity obeying isomorphic mathematical forms---is conspicuously absent from most undergraduate textbooks. Possible reasons:

+ #strong[Historical accident:] Newton's gravity (1687) was formulated before Maxwell (1865). By the time Maxwell wrote, gravitation was treated as a completed subject and not revisited.

+ #strong[Disciplinary siloing:] Gravity is often taught in mechanics courses, electromagnetism in separate EM courses, with little cross-reference.

+ #strong[The coupling constant puzzle:] Students are asked to memorize $k_e = 8.99 times 10^9$ N⋅m²/C² but asked why gravity uses $G = 6.67 times 10^(- 11)$ N⋅m²/kg². The answer---that this reflects the #emph[relative strength] of the two forces, not any fundamental asymmetry---is rarely explained.

+ #strong[The missing context:] Without dimensional analysis explicitly revealing that $V$ and $phi.alt$ have the same form (energy per "charge-like" quantity), the analogy remains hidden.

+ #strong[Relativistic subtlety:] Full reconciliation of gravity with the electromagnetic analogy requires general relativity, where gravity is not a force field but a curved spacetime. This creates the impression that gravity is fundamentally different, even though the Newtonian limit shows identical structure.

== XI.9 Implications for the Patterns-of-Change Framework
<xi.9-implications-for-the-patterns-of-change-framework>
This section reveals a deeper universality than previously stated:

#strong[Not just "mechanical and electrical systems are analogous"]

Rather: #strong[Gravity, electromagnetism, mechanics, and all force fields obey a unified mathematical structure:]

$ upright("Observable Behavior") = upright("(intrinsic structure)") times upright("(extrinsic source)") $

where: - #strong[Intrinsic structure:] Material properties (permittivity, permeability, mass density, etc.) - #strong[Extrinsic source:] Sources (charges, masses, currents, etc.) and boundary conditions

The equation of motion in every domain has the universal form:

$ frac(partial^2 q, partial t^2) + upright("(dissipation)") frac(partial q, partial t) + upright("(restoring)") dot.op q = upright("(source)") $

This is not a special case of RLC circuits or oscillators. Rather, the RLC oscillator is one manifestation of a #strong[universal dynamical principle] that appears in gravity, electromagnetism, mechanics, thermodynamics, and beyond.

=== The Gravity-Electricity Isomorphism as the Ultimate Test
<the-gravity-electricity-isomorphism-as-the-ultimate-test>
If the framework were merely a convenient engineering analogy, its scope would be limited to human-designed systems. But the fact that #strong[gravity obeys the same equations as electromagnetism] demonstrates that the universality is #strong[fundamental to the structure of physics itself];, not contingent on engineering choices.

#strong[Why This Matters:]

+ #strong[Universality is not engineered:] Engineers designed electrical circuits; we didn't design gravity. Yet both obey isomorphic mathematics. This means the universality arises from conservation laws and power conjugacy, not from human preference.

+ #strong[The pattern exists at all scales:] From atomic electromagnetic interactions to astronomical gravitational systems, the mathematical structure persists. This is stronger evidence for fundamentality than analogy within a single domain.

+ #strong[Predictive power:] Because gravity and EM are isomorphic, insights from one domain immediately apply to the other. The Faraday's law of magnetic induction (changing flux induces voltage) has a gravitational analog: a changing gravitomagnetic flux induces a gravitoelectric field. These are not metaphors; they are statements of rigorous mathematical equivalence.

+ #strong[Limits of reductionism:] The universality cannot be explained by reduction to quantum field theory alone. QFT describes particles and interactions, but the classical patterns we've discovered emerge from conservation laws + power conjugacy, which operate at all scales from macroscopic to fundamental.

=== Framework Robustness Against Deep Physics Changes
<framework-robustness-against-deep-physics-changes>
A remarkable feature of the framework: #strong[It remains valid across several revolutions in fundamental physics.]

- #strong[Newtonian → Special Relativistic → General Relativistic gravity:] The pattern structure persists through each transition. Only the specific form of the equations changes; the intrinsic × extrinsic decomposition remains.

- #strong[Classical → Quantum EM:] Even quantization of electromagnetism preserves the power conjugacy structure at the level of Hamiltonian mechanics.

- #strong[Dissipative → Hamiltonian → Dissipative again:] The framework accommodates the full spectrum, from perfectly reversible Hamiltonian systems to irreversible, entropy-producing dissipative systems.

This robustness suggests the framework captures something deeply true about the structure of natural law---something that transcends any particular physical theory.

=== Causal Implications of the Gravity-Electricity Symmetry
<causal-implications-of-the-gravity-electricity-symmetry>
Returning to causal attribution (the central theme of this entire document): The gravity-electricity isomorphism reveals a profound limitation.

#strong[Observational equivalence at the classical level:] If we measure electromagnetic phenomena in a laboratory (fields, potentials, waves), can we ever distinguish whether the "real" source is a charge distribution or a mass distribution?

#emph[Answer:] No.~The mathematics is identical (up to coupling constants). The physical identity (particle or mass) is not encoded in the equations; it is an additional specification.

This underscores the core lesson: #strong[Observable behavior alone cannot resolve intrinsic from extrinsic, or identify what is generating an observed field.] We must appeal to auxiliary assumptions, dimensional analysis, or experimental control to fix causal attributions.

The gravity-electricity analogy makes this point undeniable: The very forces we perceive as most fundamental (gravity and EM) are mathematically interchangeable to first order. How can causal attribution possibly be unique?

The answer is: It can't. The framework must explicitly acknowledge this structural underdetermination and develop methods (information theory, Granger causality, controlled interventions) to navigate it.

#horizontalrule

== From Revelation to Proof
<from-revelation-to-proof>
We have now revealed that gravity and electromagnetism obey identical equations. We have expanded the gravitoelectromagnetism framework with experimental validation over four decades. The phenomenon is undeniable: #strong[nature enforces mathematical isomorphism across fundamental forces.]

But revelation is not proof. "The equations look similar" is not explanation. A student might ask: "Why must they be similar? Could physics have been different?"

The answer requires us to go deeper than the particular forms of Maxwell or Einstein equations. We must identify the #strong[principles that generate these equations];---the principles from which they are #emph[inevitable];.

Those principles are: 1. #strong[Conservation laws] (energy, momentum, angular momentum) 2. #strong[Power conjugacy] (effort and flow products that yield power in identical form)

In the next part, we make these principles explicit through #strong[bond graphs];: a diagrammatic language that reveals the logical structure underneath all cross-domain analogies. Bond graphs translate the statement "effort and flow are conjugate" into a precise visual and mathematical formalism. Every analogous system corresponds to a topologically equivalent bond graph, guaranteeing identical dynamics.

This is the final theoretical foundation. After this, the universality is not mysterious---it is inevitable.

#horizontalrule

= Part XII: The Bond-Graph Framework and Rigorous Proof of Cross-Domain Analogies
<part-xii-the-bond-graph-framework-and-rigorous-proof-of-cross-domain-analogies>
With gravity and electromagnetism revealed as identical forces, we now prove that cross-domain analogies are not heuristics or approximations---they are mathematical theorems. The unifying principle is #strong[power conjugacy];: any two systems whose variables (effort and flow) couple to produce power in the same form must obey identical differential equations. Bond graphs make this principle explicit and visual, transforming engineering intuition into rigorous proof.

This part accomplishes three goals:

+ #strong[Power conjugacy as the fundamental principle] (Sections XII.1-XII.2): Define effort-flow pairs and show how identical power structures force identical equations.

+ #strong[Bond-graph formalism as rigorous framework] (Sections XII.3-XII.5): Translate physical systems into canonical bond-graph representations, proving that topologically equivalent graphs have identical dynamics regardless of physical domain.

+ #strong[Practical implications for design] (Sections XII.6-XII.9): Show that design-by-analogy is rigorous, energy methods are universal, and exotic cross-domain devices (electromechanical transducers, hydromechanical systems) are inevitable consequences of power conjugacy.

#horizontalrule

== XII.1 Motivation: Why Does the Analogy Work?
<xii.1-motivation-why-does-the-analogy-work>
Section X demonstrated that mechanical and electrical systems (and hydraulic and thermal systems) obey #strong[identical differential equations] despite their apparent physical differences. This is not a coincidence or a loose analogy---it is a #strong[mathematical necessity] arising from conservation laws and power conjugacy.

This part proves #strong[why] the analogy is exact. The unifying principle is #strong[power];, which has the same form in every domain: $P = e (t) dot.op f (t)$ (effort × flow). Systems with the same effort-flow structure necessarily obey identical dynamics.

== XII.2 Power Conjugacy and Effort-Flow Pairs
<xii.2-power-conjugacy-and-effort-flow-pairs>
=== Definition: Power-Conjugate Variables
<definition-power-conjugate-variables>
#strong[Definition XII.2.1:] Two variables $(e \, f)$ are #strong[power-conjugate] if their product has units of power (energy per unit time):

$ P = e (t) dot.op f (t) quad upright("[Watts]") $

where $e$ is the #strong[effort] (potential-like variable) and $f$ is the #strong[flow] (rate-like variable).

=== Examples Across Domains
<examples-across-domains>
#table(
  columns: (20%, 20%, 20%, 20%, 20%),
  align: (left,left,left,left,left,),
  table.header([Domain], [Effort $e$], [Flow $f$], [Power $P = e f$], [Units Check],),
  table.hline(),
  [#strong[Electrical];], [Voltage $V$ \[V\]], [Current $I$ \[A\]], [$V I$], [V·A = W ✓],
  [#strong[Mechanical (translation)];], [Force $F$ \[N\]], [Velocity $v$ \[m/s\]], [$F v$], [N·m/s = W ✓],
  [#strong[Mechanical (rotation)];], [Torque $tau$ \[N·m\]], [Angular velocity $omega$ \[rad/s\]], [$tau omega$], [N·m·rad/s = W ✓],
  [#strong[Hydraulic];], [Pressure $p$ \[Pa\]], [Flow rate $Q$ \[m³/s\]], [$p Q$], [Pa·m³/s = W ✓],
  [#strong[Thermal];], [Temperature diff $Delta T$ \[K\]], [Heat flow rate $dot(Q)$ \[W\]], [$Delta T dot.op dot(Q) \/ R_(t h)$], [K·W/K = W ✓],
)
#strong[Key property:] The product always represents energy flux, making power-conjugate pairs the fundamental language for describing energy transfer across domain boundaries.

== XII.3 Passive Elements and Their Constitutive Relations
<xii.3-passive-elements-and-their-constitutive-relations>
In every domain, three types of passive elements appear, each with a specific constitutive relation relating effort to flow.

=== R-Type Elements (Dissipation)
<r-type-elements-dissipation>
#strong[Definition XII.3.1:] An #strong[R-type] (resistive) element has a constitutive relation of the form:

$ e = R_(upright("element")) dot.op f $

where $R_(upright("element"))$ is a resistance parameter (could be electrical, mechanical, hydraulic, etc.) and the product $e f$ is strictly positive, meaning energy is dissipated (converted to heat).

#strong[Examples:]

#table(
  columns: (25%, 25%, 25%, 25%),
  align: (left,left,left,left,),
  table.header([Domain], [Element], [Relation], [Energy Dissipated],),
  table.hline(),
  [Electrical], [Resistor], [$V = I R$], [$P = I^2 R$ (always positive)],
  [Mechanical], [Viscous damper], [$F = b v$], [$P = b v^2$ (always positive)],
  [Hydraulic], [Orifice/valve], [$Delta p = R_h Q$], [$P = R_h Q^2$ (always positive)],
  [Thermal], [Conduction], [$Delta T = R_(t h) P_(i n)$], [Heat flows from hot to cold],
)
#strong[Theorem XII.3.2 (R-Type Passivity):] For any R-type element with positive resistance $R_(upright("element")) > 0$ and positive power input $P = e f > 0$, the element always #strong[dissipates] energy (converts it to heat). No energy is stored.

#emph[Proof:] By definition, $e$ and $f$ have the same sign (both positive in a physically driven system), so $P = e f > 0$. Since the relation is $e = R_(upright("element")) dot.op f$ with $R_(upright("element")) > 0$, any power input must flow out as heat, with none stored internally. Therefore, $d E \/ d t = - P < 0$, confirming energy is always lost. □

=== C-Type Elements (Potential Storage)
<c-type-elements-potential-storage>
#strong[Definition XII.3.3:] A #strong[C-type] (capacitive) element has a constitutive relation of the form:

$ q_C = C_(upright("element")) dot.op e $

where $q_C$ is the #strong[C-state] (generalized displacement, i.e., $integral f thin d t$) and $C_(upright("element"))$ is the capacitance parameter. The element stores energy proportional to $e^2$.

#strong[Examples:]

#table(
  columns: (20%, 20%, 20%, 20%, 20%),
  align: (left,left,left,left,left,),
  table.header([Domain], [Element], [C-State], [Relation], [Stored Energy],),
  table.hline(),
  [Electrical], [Capacitor], [Charge $q = integral I thin d t$], [$q = C V$], [$E = 1 / 2 C V^2$],
  [Mechanical], [Spring], [Displacement $x = integral v thin d t$], [$F = k x arrow.r.double x = F \/ k$], [$E = 1 / 2 k x^2 = 1 / 2 F^2 \/ k$],
  [Hydraulic], [Accumulator], [Volume $V = integral Q thin d t$], [$p = V \/ C_h$], [$E = 1 / 2 p V = 1 / 2 p^2 C_h$],
)
#strong[Flow through a C-type element:] Differentiating the constitutive relation:

$ frac(d q_C, d t) = C_(upright("element")) frac(d e, d t) $

$ f = C_(upright("element")) frac(d e, d t) $

This is the #strong[rate-equation] for C-type elements: flow is proportional to the rate of change of effort.

#strong[Theorem XII.3.4 (C-Type Energy Storage):] A C-type element with positive capacitance $C_(upright("element")) > 0$ stores energy that depends only on the current effort level, not on the history:

$ E_C (e) = integral_0^e e' dot.op f thin d e' = integral_0^e e' dot.op C_(upright("element")) frac(d e', d t) d t = 1 / 2 C_(upright("element")) e^2 $

This energy is recoverable (lossless storage).

#emph[Proof:] By the work-energy theorem, energy stored equals the integral of power:

$ E_C = integral P thin d t = integral e dot.op f thin d t = integral e dot.op C_(upright("element")) frac(d e, d t) d t = integral_0^e C_(upright("element")) e' thin d e' = 1 / 2 C_(upright("element")) e^2 $

This is path-independent (depends only on final effort $e$, not on how it got there), confirming lossless storage. □

=== I-Type Elements (Kinetic Storage)
<i-type-elements-kinetic-storage>
#strong[Definition XII.3.5:] An #strong[I-type] (inductive) element has a constitutive relation of the form:

$ p_I = I_(upright("element")) dot.op f $

where $p_I$ is the #strong[I-state] (generalized momentum, i.e., $integral e thin d t$) and $I_(upright("element"))$ is the inductance parameter. The element stores energy proportional to $f^2$.

#strong[Examples:]

#table(
  columns: (20%, 20%, 20%, 20%, 20%),
  align: (left,left,left,left,left,),
  table.header([Domain], [Element], [I-State], [Relation], [Stored Energy],),
  table.hline(),
  [Electrical], [Inductor], [Flux linkage $lambda = integral V thin d t$], [$lambda = L I$], [$E = 1 / 2 L I^2$],
  [Mechanical], [Mass], [Momentum $p = integral F thin d t = m v$], [$p = m v$], [$E = 1 / 2 m v^2 = 1 / 2 p^2 \/ m$],
  [Hydraulic], [Inertance], [Pressure impulse $Pi = integral p thin d t$], [$Pi = I_h Q$], [$E = 1 / 2 I_h Q^2$],
)
#strong[Effort through an I-type element:] Differentiating the constitutive relation:

$ frac(d p_I, d t) = I_(upright("element")) frac(d f, d t) $

$ e = I_(upright("element")) frac(d f, d t) $

This is the #strong[effort-equation] for I-type elements: effort is proportional to the rate of change of flow.

#strong[Theorem XII.3.6 (I-Type Energy Storage):] An I-type element with positive inductance $I_(upright("element")) > 0$ stores energy that depends only on the current flow level:

$ E_I (f) = integral_0^f e dot.op f' thin d f' = integral_0^f I_(upright("element")) frac(d f', d t) dot.op f' thin d f' = 1 / 2 I_(upright("element")) f^2 $

This energy is recoverable (lossless storage).

#emph[Proof:] Analogous to Theorem XII.3.4, by the work-energy theorem:

$ E_I = integral P thin d t = integral e dot.op f thin d t = integral I_(upright("element")) frac(d f, d t) dot.op f thin d t = integral_0^f I_(upright("element")) f' thin d f' = 1 / 2 I_(upright("element")) f^2 $

Path-independent, confirming lossless storage. □

== XII.4 The Bond-Graph Framework as Rigorous Theorem
<xii.4-the-bond-graph-framework-as-rigorous-theorem>
=== Single-Port (1-Port) Elements
<single-port-1-port-elements>
#strong[Definition XII.4.1:] A #strong[1-port element] is a system component with one pair of power-conjugate terminals $(e_(upright("port")) \, f_(upright("port")))$ where power flows in or out.

Every passive 1-port falls into one of three categories: R-type, C-type, or I-type, as defined above.

=== Multi-Port Networks and Kirchhoff Analogs
<multi-port-networks-and-kirchhoff-analogs>
#strong[Theorem XII.4.2 (Effort Conservation in Series Networks):] Consider $n$ 1-port elements connected in #strong[series] (same flow through all):

$ f_1 = f_2 = dots.h.c = f_n = f_(upright("common")) $

The total effort is the #strong[sum] of individual efforts:

$ e_(upright("total")) = e_1 + e_2 + dots.h.c + e_n $

Power entering the network is:

$ P_(upright("in")) = e_(upright("total")) dot.op f_(upright("common")) = (e_1 + e_2 + dots.h.c + e_n) dot.op f_(upright("common")) $

$ = e_1 f_(upright("common")) + e_2 f_(upright("common")) + dots.h.c + e_n f_(upright("common")) = P_1 + P_2 + dots.h.c + P_n $

#emph[Proof:] Direct algebra. □

#strong[Interpretation:] This is the effort-analog of Kirchhoff's voltage law (KVL) for electrical circuits: voltages sum around a loop. In mechanical systems: forces sum at a point (Newton's Second Law). In hydraulics: pressures add in series.

#strong[Theorem XII.4.3 (Flow Conservation in Parallel Networks):] Consider $n$ 1-port elements connected in #strong[parallel] (same effort across all):

$ e_1 = e_2 = dots.h.c = e_n = e_(upright("common")) $

The total flow is the #strong[sum] of individual flows:

$ f_(upright("total")) = f_1 + f_2 + dots.h.c + f_n $

Power entering the network is:

$ P_(upright("in")) = e_(upright("common")) dot.op f_(upright("total")) = e_(upright("common")) dot.op (f_1 + f_2 + dots.h.c + f_n) $

$ = e_(upright("common")) f_1 + e_(upright("common")) f_2 + dots.h.c + e_(upright("common")) f_n = P_1 + P_2 + dots.h.c + P_n $

#emph[Proof:] Direct algebra. □

#strong[Interpretation:] This is the flow-analog of Kirchhoff's current law (KCL) for electrical circuits: currents sum at a node. In mechanical systems: velocities decompose at a junction. In hydraulics: flow rates sum at a tee.

=== The Bond-Graph Node: Causality and Power Flow
<the-bond-graph-node-causality-and-power-flow>
#strong[Definition XII.4.4:] A #strong[bond-graph 0-junction] (series/effort-sum node) connects elements where effort sums but flow is common. A #strong[bond-graph 1-junction] (parallel/flow-sum node) connects elements where flow sums but effort is common.

#strong[Theorem XII.4.5 (Bond-Graph Power Consistency):] In any bond-graph network (composed of 0-junctions, 1-junctions, and 1-port elements), the total power entering equals the total power dissipated, stored, or converted:

$ sum_(upright("external sources")) P_(upright("in")) = sum_(upright("R-type")) P_(upright("dissipated")) + frac(d, d t) sum_(upright("C-type")) E_C + frac(d, d t) sum_(upright("I-type")) E_I $

#emph[Proof:] By Theorems XI.4.2 and XI.4.3, power is conserved at every junction (sum of input powers equals sum of output powers). Integrating over all junctions and elements yields the global energy balance. □

== XII.5 The Force-Voltage Analogy: Rigorous Proof
<xii.5-the-force-voltage-analogy-rigorous-proof>
=== Intuitive Foundation: Why Power Conjugacy Matters
<intuitive-foundation-why-power-conjugacy-matters>
Before diving into the formal proof, here's the key insight: #strong[Power is the universal language of energy transfer];. In every physical domain, energy moves at rate $P = e (t) dot.op f (t)$ where $e$ is an "effort" variable (voltage, force, pressure) and $f$ is a "flow" variable (current, velocity, flow rate).

If two systems have #strong[identical effort-flow structure];---that is, if the same types of elements (R-type dissipative, L-type inertial, C-type compliant) interact through power-conjugate pairs in identical configurations---then they #strong[must obey the same differential equations];. This is not a mysterious coincidence; it's a consequence of energy conservation and the mathematics of linear systems.

#strong[Why does force correspond to voltage?] Because both are "effort" variables driving flow through resistance. #strong[Why is the analogy exact, not just approximate?] Because power conjugacy is a rigorous mathematical principle: if $P_(upright("mech")) = F v$ and $P_(upright("elec")) = V I$ are both manifestations of the same physics (effort × flow = power), then any system built from R, L, C elements in series or parallel has identical dynamics regardless of domain.

#strong[Practical implication:] Any circuit design (filter, amplifier, oscillator) can be directly implemented as a mechanical system. An electrical engineer's pole-placement calculations apply directly to a mechanical engineer's damping design.

=== Theorem XII.5.1 (Force-Voltage Analogy via Power Conjugacy)
<theorem-xii.5.1-force-voltage-analogy-via-power-conjugacy>
#strong[Statement:] Consider two systems: 1. #strong[Mechanical:] A mass $m$ with applied force $F_(upright("app"))$ and damper $b$ 2. #strong[Electrical:] An inductor $L$ with applied voltage $V_(upright("app"))$ and resistor $R$

If the parameters satisfy: $ m arrow.l.r L \, quad b arrow.l.r R \, quad F arrow.l.r V \, quad v arrow.l.r I $

then the two systems obey #strong[identical] differential equations:

$ frac(d upright(bold(u)), d t) = upright(bold(A)) upright(bold(u)) + upright(bold(b)) $

where $upright(bold(u))$ is the state vector and $upright(bold(A)) \, upright(bold(b))$ have identical form in both domains.

#strong[Proof:]

#strong[Mechanical system:] Apply Newton's Second Law to the mass: $ F_(upright("app")) = m frac(d v, d t) + b v $

Define state $u_1 = v$ (velocity). Then: $ frac(d u_1, d t) = 1 / m (F_(upright("app")) - b u_1) $

#strong[Electrical system:] Apply Kirchhoff's voltage law around the series RL circuit: $ V_(upright("app")) = L frac(d I, d t) + R I $

Define state $u_1' = I$ (current). Then: $ frac(d u_1', d t) = 1 / L (V_(upright("app")) - R u_1 ') $

#strong[Comparison:] Both have the form

$ frac(d u_1, d t) = 1 / (upright("inertia")) [(upright("drive")) - (upright("resistance")) dot.op u_1] $

where: - Mechanical: inertia = $m$, drive = $F_(upright("app"))$, resistance = $b$ - Electrical: inertia = $L$, drive = $V_(upright("app"))$, resistance = $R$

Under the correspondence $m arrow.l.r L$, $F arrow.l.r V$, $v arrow.l.r I$, $b arrow.l.r R$, both systems obey #strong[identical equations];. □

=== Concrete Demonstration: Session 2 Examples
<concrete-demonstration-session-2-examples>
This power-conjugacy correspondence is not theoretical---#strong[Part X verifies it with explicit worked examples across all domains:]

- #strong[Theorem XII.5.1 applied to RC Circuits] (Part X.3): An RC circuit with time constant $tau_(R C) = R C$ exhibits exponential charging $V (t) = V_(upright("source")) (1 - e^(- t \/ tau_(R C)))$. The #strong[identical equation] governs a mechanical damper with applied force: $v (t) = F_(upright("app")) \/ b dot.op (1 - e^(- t \/ tau_m))$ where $tau_m = m \/ b$. The equation is #strong[mathematically identical] under the correspondence force ↔ voltage, with $tau_m arrow.l.r tau_(R C)$.

- #strong[Theorem XII.5.1 applied to RL Circuits] (Part X.4): An RL circuit responds to a step voltage with $I (t) = V_(upright("app")) \/ R (1 - e^(- R t \/ L))$. The #strong[same mathematics] governs how a mass accelerates under constant force with drag: $v (t) = F_(upright("app")) \/ b (1 - e^(- b t \/ m))$. This is not an analogy---it is #strong[mathematical identity] under the substitution.

- #strong[Theorem XII.5.1 applied to Thermal Systems] (Part X.8): Heat diffusion through a resistor into a thermal mass obeys $T (t) = T_(upright("ambient")) + Delta T (1 - e^(- t \/ tau_(t h)))$ where $tau_(t h) = R_(upright("th")) C_(upright("th"))$. The form is #strong[identical] to electrical RC charging: the time constant $tau_(t h)$ plays the role that $tau_(R C)$ plays in electricity, confirming that power conjugacy transcends domain.

- #strong[Theorem XII.5.1 applied to Hydraulic Systems] (Part X.10): Fluid pressure building in a tank through a valve follows $p (t) = p_(upright("source")) (1 - e^(- t \/ tau_h))$ with $tau_h = R_h C_h$ (restriction × compliance). #strong[Same structure, same equation, same physics.]

These are not demonstrations of analogy---they are #strong[direct verification] that the force-voltage correspondence predicted by Theorem XII.5.1 holds precisely across domains. The power-conjugacy principle is universal.

=== Why the Analogy is Perfect: Power Preservation
<why-the-analogy-is-perfect-power-preservation>
#strong[Theorem XII.5.2 (Power Equivalence of Analogs):]

Under the correspondence $F arrow.l.r V$ and $v arrow.l.r I$, the #strong[instantaneous power] is identical in corresponding systems:

$ P_(upright("mech")) = F v arrow.l.r P_(upright("elec")) = V I $

Moreover, the energy dissipated in the damper equals the energy dissipated in the resistor:

$ E_(upright("diss,mech")) = integral_0^t b v^2 (tau) thin d tau arrow.l.r E_(upright("diss,elec")) = integral_0^t R I^2 (tau) thin d tau $

#emph[Proof:] The correspondences $F arrow.l.r V$ and $v arrow.l.r I$ are #strong[power-conjugate];: the product $F v$ has the same physical meaning (power) as $V I$. This is not an arbitrary choice---it is the #strong[only] pairing that preserves power across domains.

Since power is the same, and since energy is the integral of power, the total energy dissipated must also be identical. □

== XII.6 Passive Element Correspondence: Complete Mapping
<xii.6-passive-element-correspondence-complete-mapping>
#strong[Theorem XII.6.1 (R-Type, L-Type, C-Type Correspondence):]

The three types of passive elements correspond exactly across domains:

#table(
  columns: (20%, 20%, 20%, 20%, 20%),
  align: (left,left,left,left,left,),
  table.header([Role], [Electrical], [Mechanical], [Hydraulic], [Constitutive],),
  table.hline(),
  [#strong[R-type] (dissipation)], [Resistor $R$], [Damper $b$], [Valve $R_h$], [$e = R_(upright("element")) dot.op f$],
  [#strong[L-type] (inertia)], [Inductor $L$], [Mass $m$], [Inertance $I_h$], [$e = I_(upright("element")) frac(d f, d t)$],
  [#strong[C-type] (compliance)], [Capacitor $C$], [Spring $1 \/ k$], [Accumulator $C_h$], [$f = C_(upright("element")) frac(d e, d t)$],
)
Systems with the same #strong[topology] (same arrangement of R-, L-, C-type elements) obey identical differential equations regardless of domain.

#emph[Proof:] Each constitutive relation has the same mathematical form in every domain (as shown in Section XI.3). Therefore, any circuit composed of these elements (via series and parallel connections respecting Theorems XI.4.2 and XI.4.3) will produce identical differential equations when the parameters are related by the analogy. □

== XII.7 Energy Conservation Equivalence
<xii.7-energy-conservation-equivalence>
=== Theorem XII.7.1 (Total Mechanical Energy in Mass-Spring-Damper)
<theorem-xii.7.1-total-mechanical-energy-in-mass-spring-damper>
Consider a mass $m$ connected to a spring (stiffness $k$) and damper ($b$), subject to applied force $F (t)$:

$ m dot.double(x) + b dot(x) + k x = F (t) $

#strong[Total mechanical energy:] $ E_(upright("mech")) (t) = 1 / 2 m dot(x)^2 + 1 / 2 k x^2 $

#strong[Energy balance:] $ frac(d E_(upright("mech")), d t) = F (t) dot(x) - b dot(x)^2 $

The right side represents: - #strong[Power input:] $F (t) dot(x)$ (applied force doing work) - #strong[Power dissipated:] $b dot(x)^2$ (damper converting energy to heat)

#strong[Proof:] Differentiate $E_(upright("mech"))$ with respect to time:

$ frac(d E_(upright("mech")), d t) = frac(d, d t) [1 / 2 m dot(x)^2 + 1 / 2 k x^2] $

$ = m dot(x) dot.double(x) + k x dot(x) $

$ = dot(x) (m dot.double(x) + k x) $

From the equation of motion: $m dot.double(x) = F (t) - b dot(x) - k x$, so:

$ frac(d E_(upright("mech")), d t) = dot(x) [F (t) - b dot(x) - k x + k x] = dot(x) [F (t) - b dot(x)] = F (t) dot(x) - b dot(x)^2 $ □

=== Theorem XII.7.2 (Total Electrical Energy in Series RLC)
<theorem-xii.7.2-total-electrical-energy-in-series-rlc>
Consider a series RLC circuit with applied voltage $V_(upright("source")) (t)$:

$ L frac(d I, d t) + R I + Q / C = V_(upright("source")) (t) $

#strong[Total electrical energy:] $ E_(upright("elec")) (t) = 1 / 2 L I^2 + frac(1, 2 C) Q^2 $

#strong[Energy balance:] $ frac(d E_(upright("elec")), d t) = V_(upright("source")) (t) I - R I^2 $

The right side represents: - #strong[Power input:] $V_(upright("source")) (t) I$ (voltage source delivering power) - #strong[Power dissipated:] $R I^2$ (resistor converting energy to heat)

#strong[Proof:] Differentiate $E_(upright("elec"))$:

$ frac(d E_(upright("elec")), d t) = frac(d, d t) [1 / 2 L I^2 + frac(1, 2 C) Q^2] $

$ = L I frac(d I, d t) + Q / C frac(d Q, d t) $

$ = I (L frac(d I, d t) + Q / C) $

From the circuit equation: $L frac(d I, d t) = V_(upright("source")) - R I - Q / C$, so:

$ frac(d E_(upright("elec")), d t) = I [V_(upright("source")) - R I - Q / C + Q / C] = I [V_(upright("source")) - R I] = V_(upright("source")) (t) I - R I^2 $ □

=== Theorem XII.7.3 (Energy Conservation Equivalence)
<theorem-xii.7.3-energy-conservation-equivalence>
The mechanical energy balance

$ frac(d E_(upright("mech")), d t) = F (t) dot(x) - b dot(x)^2 $

is #strong[mathematically identical] to the electrical energy balance

$ frac(d E_(upright("elec")), d t) = V_(upright("source")) (t) I - R I^2 $

under the correspondences $E_(upright("mech")) arrow.l.r E_(upright("elec"))$, $F arrow.l.r V$, $dot(x) arrow.l.r I$, $b arrow.l.r R$.

#emph[Proof:] Direct comparison. The two equations have identical form with parameters and variables mapped by the analogy. □

== XII.8 The Universal Oscillator Equation
<xii.8-the-universal-oscillator-equation>
=== Intuitive Foundation: Why One Equation Governs Everything
<intuitive-foundation-why-one-equation-governs-everything>
Here is the profound payoff of the bond-graph framework: #strong[any system built from one dissipative (R), one kinetic storage (L), and one potential storage (C) element obeys the identical second-order differential equation, regardless of whether it's a mechanical oscillator, electrical filter, hydraulic shock absorber, or thermal system.]

No mechanical engineer needs to learn a different stability analysis for hydraulics. No electrical engineer's Bode plot theory becomes invalid when applied to mechanical systems. The differential equation is the same.

#strong[Why?] By Theorem XII.5.1, systems with identical power-conjugate structure have identical dynamics. Since effort and flow pair universally---voltage/current in electricity, force/velocity in mechanics, pressure/flow in hydraulics---any second-order system with the same R-L-C topology generates the same differential equation.

#strong[What does this mean for design?] The two parameters $omega_0$ (natural frequency) and $zeta$ (damping ratio) completely characterize the transient response. Whether you're tuning a shock absorber, designing a filter, or stabilizing a system, the same design principles apply: choose $omega_0$ for speed, choose $zeta$ for oscillation vs.~overdamping.

=== Theorem XII.8.1 (Universal Second-Order Dynamics)
<theorem-xii.8.1-universal-second-order-dynamics>
Consider any mechanical, electrical, or hydraulic system composed of #strong[one storage element of each type] (R, L, C) arranged in series or parallel. Regardless of domain, the system obeys the #strong[universal second-order differential equation];:

$ #box(stroke: black, inset: 3pt, [$ dot.double(u) + 2 zeta omega_0 dot(u) + omega_0^2 u = omega_0^2 u_(upright("drive")) $]) $

where: - $u$ is the primary state variable (displacement, voltage, pressure, etc.) - $omega_0 = 1 \/ sqrt(L C)$ is the #strong[natural frequency] (in any domain) - $zeta = R / 2 sqrt(C / L)$ is the #strong[damping ratio] (in any domain) - $u_(upright("drive"))$ is the applied driving effort

#strong[Parameter Meanings in Each Domain:]

#table(
  columns: (25%, 25%, 25%, 25%),
  align: (left,left,left,left,),
  table.header([Domain], [$u$], [$omega_0$], [$zeta$],),
  table.hline(),
  [#strong[Mechanical];], [Displacement $x$], [$sqrt(k \/ m)$], [$frac(b, 2 sqrt(k m))$],
  [#strong[Electrical];], [Voltage $V_C$], [$1 / sqrt(L C)$], [$R / 2 sqrt(C / L)$],
  [#strong[Hydraulic];], [Pressure $p$], [$1 / sqrt(I_h C_h)$], [$R_h / 2 sqrt(C_h / I_h)$],
)
#emph[Proof sketch:] In any domain, series connection of R, L, C elements yields:

$ L frac(d^2 u, d t^2) + R frac(d u, d t) + u / C = L frac(d^2 u_(upright("drive")), d t^2) $

Dividing by $L$ and defining $omega_0^2 = 1 \/ (L C)$ and $2 zeta omega_0 = R \/ L$:

$ frac(d^2 u, d t^2) + 2 zeta omega_0 frac(d u, d t) + omega_0^2 u = omega_0^2 u_(upright("drive")) $

This derivation is identical in every domain because the constitutive relations are identical. □

=== Concrete Demonstration: Session 2 Examples
<concrete-demonstration-session-2-examples-1>
Theorem XII.8.1 is not an abstract generalization---#strong[Part X demonstrates this equation directly in every domain:]

- #strong[Mechanical Oscillators] (Part X.6, Mass-Spring-Damper): The equation $m dot.double(x) + b dot(x) + k x = F (t)$ is our universal oscillator with $omega_0 = sqrt(k \/ m)$ and $zeta = frac(b, 2 sqrt(k m))$. Standard undergraduate physics.

- #strong[Electrical RLC Circuits] (Part X.6, Series RLC): The equation $L dot.double(q) + R dot(q) + q / C = V (t)$ is #strong[exactly the same form] with $omega_0 = 1 / sqrt(L C)$ and $zeta = R / 2 sqrt(C / L)$. When $L$ plays the role of mass, $R$ the role of damping, and $1 \/ C$ the role of spring stiffness, the equations become #strong[identical];.

- #strong[Driven RLC Circuit Response] (Part X.7): When a sinusoidal voltage is applied, the RLC circuit exhibits resonance at $omega = omega_0$ with peak response at damping-dependent frequency. Part X demonstrates this numerically and analytically---exactly matching the mechanical resonance curve of a driven mass-spring-damper.

- #strong[Thermal Systems] (Part X.8): Heat diffusion with resistance and capacitance (thermal inertia) obeys $R C_(upright("thermal")) dot.double(T) + dot(T) + T = T_(upright("input"))$ (rearranged). This is the universal oscillator equation in thermal form. Though thermal systems rarely exhibit damped oscillation (because $zeta$ is typically large), the underlying mathematics is identical.

- #strong[Hydraulic Oscillators] (Part X.10, U-Tube Manometer): A fluid in a U-tube with inertance $I_h$, resistance (via valve restriction) $R_h$, and compliance $C_h$ obeys $I_h dot.double(h) + R_h dot(h) + h / C_h = 0$ for free oscillation. Same structure, same three damping regimes.

#strong[The profound implication:] Any engineer's stability analysis, filter design, or control system developed in one domain applies #strong[directly and without modification] to any other domain. This is not engineering intuition or useful analogy---it is #strong[mathematical theorem];: Theorem XII.8.1 guarantees that the same equation governs all.

=== Consequence: Three Damping Regimes are Universal
<consequence-three-damping-regimes-are-universal>
Any system obeying the universal oscillator equation exhibits the same three response regimes based on damping ratio $zeta$:

+ #strong[Underdamped] ($zeta < 1$): Oscillatory response with exponential decay
+ #strong[Critically damped] ($zeta = 1$): Fastest non-oscillatory approach to steady state
+ #strong[Overdamped] ($zeta > 1$): Slow exponential approach without oscillation

These are #strong[domain-independent] characteristics. A mechanical shock absorber with $zeta = 0.7$ has the same dynamic behavior as an electrical filter with the same $zeta = 0.7$.

== XII.9 Practical Implication: Design by Analogy
<xii.9-practical-implication-design-by-analogy>
=== Theorem XII.9.1 (Translatability of Designs)
<theorem-xii.9.1-translatability-of-designs>
A design problem solved in one domain #strong[immediately translates] to any other domain under the parameter correspondence.

#strong[Example:] An engineer designs a mechanical shock absorber to suppress vibrations at 3 Hz with 0.7 damping ratio. The design uses: - Mass $m = 100$ kg - Spring constant $k = (2 pi times 3)^2 times 100 = 35 \, 568$ N/m ≈ 36 kN/m - Damping coefficient $b = 2 zeta sqrt(k m) = 1.4 sqrt(3.56 times 10^6) = 2652$ N·s/m

An electrical engineer can #strong[directly apply this design] to an anti-vibration electrical filter: - Inductance $L = 100$ H (plays the role of $m$) - Inverse capacitance $1 \/ C = 36$ kV/F (plays the role of $k$) - Resistance $R = 2652$ Ω (plays the role of $b$)

Both systems will exhibit identical transient response to disturbances---not because of any miraculous coincidence, but because they obey the #strong[same differential equations];.

#emph[Proof:] By Theorem XII.8.1, if $omega_0$ and $zeta$ are identical, the systems are dynamically equivalent. The engineering design is a function of these two parameters (natural frequency and damping). Therefore, any design principle in one domain translates directly to another. □

#horizontalrule

= Part XIII: Control Theory and the Intrinsic-Extrinsic Boundary
<part-xiii-control-theory-and-the-intrinsic-extrinsic-boundary>
== XIII.1 Motivation: Feedback as Deliberate Extrinsic Intervention
<xiii.1-motivation-feedback-as-deliberate-extrinsic-intervention>
Throughout this framework, we have emphasized the division between #strong[intrinsic properties] (parameters $upright(bold(A))$, $R$, $L$, $C$, etc.) and #strong[extrinsic forcing] (external sources $S (t)$, $u (t)$, boundary conditions). This division is natural for passive systems: the intrinsic structure is set by the material and geometry, and the extrinsic drive is imposed from outside.

Control theory challenges this picture. In a controlled system, we deploy #strong[feedback];: measurements of the system state are used to design an external input that pushes the system toward desired behavior. This input is extrinsic in the sense that it comes from outside the system, yet it is carefully #strong[crafted] based on measured state, making it appear almost like intrinsic behavior.

The key insight: #strong[Feedback can effectively change the intrinsic structure] of a system. An unstable open-loop system can be stabilized by feedback. A slow system can be accelerated by feedback. The closed-loop system

$ upright(bold(A))_(C L) = upright(bold(A)) - upright(bold(B K)) $

(where $upright(bold(K))$ is the feedback gain) has fundamentally different intrinsic properties than the open-loop system $upright(bold(A))$.

This blurs the boundary between intrinsic and extrinsic: is the feedback #strong[intrinsic] (part of the system design) or #strong[extrinsic] (external intervention)?

#strong[Answer:] It's both. Control bridges the two perspectives. This section formalizes that bridge.

== XIII.2 The Standard Control Configuration
<xiii.2-the-standard-control-configuration>
=== State-Space System and Feedback
<state-space-system-and-feedback>
Consider a #strong[linear time-invariant system] in state-space form:

$ dot(upright(bold(z))) (t) = upright(bold(A)) upright(bold(z)) (t) + upright(bold(B)) u (t) $

where: - $upright(bold(z)) (t) in bb(R)^n$ is the system state - $upright(bold(A)) in bb(R)^(n times n)$ is the open-loop dynamics matrix - $upright(bold(B)) in bb(R)^(n times m)$ is the input matrix (how control inputs affect state) - $u (t) in bb(R)^m$ is the control input (what we can manipulate)

The #strong[measurement] is given by:

$ upright(bold(y)) (t) = upright(bold(C)) upright(bold(z)) (t) + upright(bold(D)) u (t) $

where: - $upright(bold(y)) (t) in bb(R)^p$ is the measured output - $upright(bold(C)) in bb(R)^(p times n)$ is the output matrix - $upright(bold(D)) in bb(R)^(p times m)$ is the feedthrough matrix (often zero)

#block[
#strong[Connection to Part VI:] This state-space representation $dot(upright(bold(z))) = upright(bold(A)) upright(bold(z)) + upright(bold(B)) u$ is the standard formalism for converting physical systems (mechanical, electrical, etc.) into a unified mathematical form suitable for control analysis. The state vector $upright(bold(z))$ concatenates all energy-storing elements (positions and velocities in mechanics; currents and voltages in electronics). The matrix $upright(bold(A))$ encodes the intrinsic dynamics (how fast the system naturally evolves), while $upright(bold(B))$ describes how external inputs couple into that evolution.

]
#strong[Feedback Control:] Apply a control law based on measured output (or estimated state):

$ u (t) = - upright(bold(K)) hat(upright(bold(z))) (t) + upright(bold(r)) (t) $

where: - $upright(bold(K)) in bb(R)^(m times n)$ is the #strong[feedback gain matrix] (to be designed) - $hat(upright(bold(z))) (t)$ is the estimated or measured state - $upright(bold(r)) (t)$ is a reference command (desired trajectory)

#strong[Closed-Loop System:] Substituting the control law into the state equation:

$ dot(upright(bold(z))) (t) = upright(bold(A)) upright(bold(z)) (t) + upright(bold(B)) (- upright(bold(K)) upright(bold(z)) (t) + upright(bold(r)) (t)) $

$ = (upright(bold(A)) - upright(bold(B K))) upright(bold(z)) (t) + upright(bold(B)) upright(bold(r)) (t) $

$ #box(stroke: black, inset: 3pt, [$ dot(upright(bold(z))) (t) = upright(bold(A))_(C L) upright(bold(z)) (t) + upright(bold(B)) upright(bold(r)) (t) $]) $

where $upright(bold(A))_(C L) = upright(bold(A)) - upright(bold(B K))$ is the #strong[closed-loop dynamics matrix];.

=== Key Observation
<key-observation>
The feedback gain $upright(bold(K))$ has #strong[changed the intrinsic structure] from $upright(bold(A))$ to $upright(bold(A))_(C L)$. This is an #strong[extrinsic intervention] (feedback law) that produces the #strong[appearance of changed intrinsic structure] (modified eigenvalues, different stability).

== XIII.3 Fundamental Concepts: Controllability and Observability
<xiii.3-fundamental-concepts-controllability-and-observability>
=== Controllability: Can We Steer the System?
<controllability-can-we-steer-the-system>
#strong[Definition XIII.3.1:] A system $(upright(bold(A)) \, upright(bold(B)))$ is #strong[controllable] if, starting from any initial state $upright(bold(z))_0$, we can reach any desired final state $upright(bold(z))_f$ in finite time using an appropriate control input $u (t)$.

#strong[Theorem XIII.3.2 (Controllability Criterion):] The system is controllable if and only if the #strong[controllability matrix]

$ cal(C) = [upright(bold(B)) \, upright(bold(A)) upright(bold(B)) \, upright(bold(A))^2 upright(bold(B)) \, dots.h \, upright(bold(A))^(n - 1) upright(bold(B))] $

has full rank (rank $n$).

#emph[Proof sketch @Kalman_1960:] The controllability matrix characterizes the span of all state directions reachable by repeated application of the input through the dynamics. Full rank means all $n$ dimensions are reachable. □

#strong[Implication:] If the system is controllable, we can design a feedback law $upright(bold(K))$ that places the closed-loop eigenvalues (poles) anywhere in the complex plane.

=== Observability: Can We Infer the State?
<observability-can-we-infer-the-state>
#strong[Definition XIII.3.3:] A system $(upright(bold(C)) \, upright(bold(A)))$ is #strong[observable] if, from knowledge of the output sequence $upright(bold(y)) (t)$ and input $u (t)$ over a finite time interval, we can uniquely determine the initial state $upright(bold(z))_0$.

#strong[Theorem XIII.3.4 (Observability Criterion):] The system is observable if and only if the #strong[observability matrix]

$ cal(O) = mat(delim: "[", upright(bold(C)); upright(bold(C A)); upright(bold(C A))^2; dots.v; upright(bold(C A))^(n - 1)) $

has full rank (rank $n$).

#emph[Proof sketch:] Similar to controllability. The observability matrix characterizes which state directions are visible in the output. Full rank means all $n$ dimensions are observable. □

#strong[Implication:] If the system is observable, we can design a state observer (estimator) that reconstructs the full state from output measurements.

== XIII.4 Pole Placement and State Feedback
<xiii.4-pole-placement-and-state-feedback>
=== The Pole Placement Problem
<the-pole-placement-problem>
#strong[Goal:] Design the feedback gain $upright(bold(K))$ such that the closed-loop eigenvalues (poles) $lambda_1 \, dots.h \, lambda_n$ are placed at desired locations.

#strong[Why this matters:] The eigenvalues of $upright(bold(A))_(C L)$ determine the closed-loop response: - Real negative eigenvalues → exponential decay (faster for more negative values) - Complex conjugate pairs → oscillatory decay (frequency determined by imaginary part) - Any positive real part → instability

#block[
#strong[Connection to Part VIII:] The rigorous relationship between eigenvalues and system stability is developed in Part VIII (Manifolds and Trajectories), where the spectrum $sigma (upright(bold(A)))$ characterizes which modes decay, oscillate, or grow. Pole placement is the practical application of this theory: by choosing $lambda_1 \, dots.h \, lambda_n$, we design which modes survive (decay slowly), which oscillate (complex parts), and which die out (negative real parts).

]
#strong[Theorem XIII.4.1 (Pole Placement):] If the system $(upright(bold(A)) \, upright(bold(B)))$ is controllable, then for any desired set of eigenvalues ${ lambda_1 \, dots.h \, lambda_n }$, there exists a unique feedback gain $upright(bold(K))$ such that

$ upright("eig") (upright(bold(A)) - upright(bold(B K))) = { lambda_1 \, dots.h \, lambda_n } $

#emph[Proof:] By controllability, the input matrix $upright(bold(B))$ can influence all directions in state space. Thus, we can design $upright(bold(K))$ to move the eigenvalues arbitrarily. The construction uses the Ackermann formula or eigenvalue assignment algorithms. □

=== Worked Example: Stabilizing an Unstable System
<worked-example-stabilizing-an-unstable-system>
#strong[Problem:] A system has open-loop dynamics

$ upright(bold(A)) = mat(delim: "(", 0, 1; 1, 0) \, quad upright(bold(B)) = vec(0, 1) $

The eigenvalues of $upright(bold(A))$ are $lambda = plus.minus 1$ (unstable, one positive).

#strong[Goal:] Design feedback gain $upright(bold(K))$ such that closed-loop eigenvalues are at $lambda = - 1 \, - 2$ (both stable).

#strong[Solution:] The closed-loop matrix is

$ upright(bold(A))_(C L) = upright(bold(A)) - upright(bold(B K)) = mat(delim: "(", 0, 1; 1, 0) - vec(0, 1) [k_1 thin k_2] = mat(delim: "(", 0, 1; 1 - k_1, - k_2) $

The characteristic polynomial is

$ det (lambda I - upright(bold(A))_(C L)) = lambda^2 + k_2 lambda + (k_1 - 1) $

For eigenvalues at $- 1 \, - 2$, the characteristic polynomial should be

$ (lambda + 1) (lambda + 2) = lambda^2 + 3 lambda + 2 $

Comparing coefficients: - Coefficient of $lambda$: $k_2 = 3$ - Constant term: $k_1 - 1 = 2 arrow.r.double k_1 = 3$

#strong[Feedback gain:] $upright(bold(K)) = [3 thin 3]$

#strong[Verification:] $ upright(bold(A))_(C L) = mat(delim: "(", 0, 1; 1 - 3, - 3) = mat(delim: "(", 0, 1; - 2, - 3) $

Characteristic polynomial: $det (lambda I - upright(bold(A))_(C L)) = lambda^2 + 3 lambda + 2 = (lambda + 1) (lambda + 2)$ ✓

The unstable system has been #strong[stabilized] by feedback, changing the intrinsic structure through extrinsic control.

=== Mechanical Interpretation: Position Control via Force Feedback
<mechanical-interpretation-position-control-via-force-feedback>
To see how Theorem XIII.4.1 applies to mechanical systems, consider a #strong[cart of mass $m = 1$ kg] that we want to position precisely using an actuator (electric motor delivering force). The position and velocity are the state $upright(bold(z)) = [x \, v]^T$.

#strong[Open-loop dynamics:] No damping, no spring constraint: $ dot(upright(bold(z))) = mat(delim: "(", 0, 1; 0, 0) vec(x, v) + vec(0, 1) u $

where $u$ is the applied force.

#strong[Open-loop eigenvalues:] $lambda = 0 \, 0$ (marginally unstable---system drifts if disturbed with no restoring force).

#strong[Desired control:] We want the cart to: 1. Return to $x = 0$ after a disturbance 2. Do so without oscillation (overdamped response) 3. Achieve zero velocity in a controlled manner

#strong[Pole placement choice:] Place closed-loop eigenvalues at $lambda_1 = - 1$ (slow return) and $lambda_2 = - 3$ (fast velocity damping).

#strong[Design feedback gain $upright(bold(K))$:]

The closed-loop system $dot(upright(bold(z))) = (upright(bold(A)) - upright(bold(B K))) upright(bold(z))$ becomes: $ upright(bold(A))_(C L) = mat(delim: "(", 0, 1; 0, 0) - vec(0, 1) [k_1 thin k_2] = mat(delim: "(", 0, 1; - k_1, - k_2) $

Characteristic polynomial: $det (lambda I - upright(bold(A))_(C L)) = lambda^2 + k_2 lambda + k_1$

For eigenvalues at $- 1 \, - 3$: $ (lambda + 1) (lambda + 3) = lambda^2 + 4 lambda + 3 $

Thus: $k_2 = 4$ and $k_1 = 3$.

#strong[Physical interpretation of feedback gain $upright(bold(K)) = [3 thin 4]$:]

The control law is: $ u = - k_1 x - k_2 v = - 3 x - 4 v $

This means: - #strong[$- 3 x$ term:] Spring-like restoring force proportional to position (acts like a spring with $k_(upright("eff")) = 3$ N/m) - #strong[$- 4 v$ term:] Damping force proportional to velocity (acts like a damper with $b_(upright("eff")) = 4$ N·s/m)

#strong[Before control:] The cart has no inherent spring or damping---it drifts freely.

#strong[After control:] The feedback has #strong[created] an effective spring-damper system through software/electronics, changing the intrinsic structure of the closed-loop system from "free particle" to "damped oscillator."

#strong[Transient response:] Starting from $x_0 = 1$ m (1 meter displacement), the cart's position evolves as: $ x (t) = e^(- t) (1 + 2 t) $

This is critically damped for the mode $lambda_1 = - 1$ and overdamped for $lambda_2 = - 3$. The cart returns smoothly to origin without oscillation, then settles.

#strong[Blurred boundaries:] The control signal $u = - 3 x - 4 v$ is extrinsic (applied from outside). Yet it effectively #strong[transforms the intrinsic dynamics] from unstable to stable, from free to constrained. Is the effective spring-damper "intrinsic" (part of the designed system) or "extrinsic" (external feedback)? #strong[Both];---control blurs the distinction by using extrinsic intervention to alter what appears as intrinsic structure.

== XIII.5 PID Control: Proportional, Integral, Derivative
<xiii.5-pid-control-proportional-integral-derivative>
=== The Three Modes of Control
<the-three-modes-of-control>
The #strong[PID (Proportional-Integral-Derivative) controller] is the most widely used feedback controller. It combines three terms:

$ u (t) = K_P e (t) + K_I integral_0^t e (tau) thin d tau + K_D frac(d e, d t) $

where $e (t) = y_(upright("ref")) - y (t)$ is the #strong[tracking error] (difference between desired and actual output).

#strong[Proportional (P):] $u_P = K_P e (t)$ - Responds to current error - Larger error → larger control action - Problem: Steady-state error (system never reaches target exactly if dynamics require finite force)

#strong[Integral (I):] $u_I = K_I integral_0^t e (tau) thin d tau$ - Accumulates error over time - If error persists, integral term grows, driving control action larger - Eliminates steady-state error - Problem: Can overshoot and oscillate (integral wind-up)

#strong[Derivative (D):] $u_D = K_D frac(d e, d t)$ - Responds to rate of change of error - Dampens rapid changes (analogous to damping in mechanical systems) - Reduces overshoot - Problem: Amplifies noise (derivatives magnify high-frequency noise)

=== Passive Element Analogy: P as Spring, I as Capacitor, D as Damper
<passive-element-analogy-p-as-spring-i-as-capacitor-d-as-damper>
The three PID modes correspond precisely to the three types of passive elements in the bond-graph framework (Part XI):

#table(
  columns: (25%, 25%, 25%, 25%),
  align: (left,left,left,left,),
  table.header([PID Mode], [Control Law], [Passive Element], [Physical Behavior],),
  table.hline(),
  [#strong[P (Proportional)];], [$u_P = K_P e$], [#strong[Spring (C-type)];], [Force proportional to displacement: $F = k x$],
  [#strong[I (Integral)];], [$u_I = K_I integral e thin d t$], [#strong[Capacitor (C-type)];], [Effort proportional to accumulated flow: $V = (1 \/ C) integral I thin d t$],
  [#strong[D (Derivative)];], [$u_D = K_D frac(d e, d t)$], [#strong[Resistor/Damper (R-type)];], [Force proportional to velocity: $F = - b v$],
)
#strong[Deeper explanation:]

- #strong[Proportional (P-mode as Spring):] The error $e$ plays the role of displacement, and $K_P$ acts like spring stiffness. Just as a spring exerts a restoring force proportional to displacement, P-mode applies control proportional to current error. Both provide #strong[stiffness];---immediate response to deviation, but without correcting steady-state drift (a spring at equilibrium exerts no force; P-mode at zero error applies no control).

- #strong[Integral (I-mode as Capacitor):] The accumulated integral $integral e thin d t$ grows whenever error persists. This resembles how a capacitor accumulates charge: continued voltage creates increasing charge storage. The I-mode integral #strong[accumulates error history];, and when enough error has accumulated, the integral term becomes large enough to drive the system to the target, eliminating steady-state offset.

- #strong[Derivative (D-mode as Damper):] The rate of change $frac(d e, d t)$ is the error velocity. Just as a damper opposes velocity with force $F = - b v$, the D-mode opposes rapid error changes with control proportional to $frac(d e, d t)$. This provides #strong[damping];, reducing overshoot and oscillation by applying braking force when error is changing rapidly.

#block[
#callout(
body: 
[
#strong[Control Design = RLC Circuit Design:]

A #strong[PI controller] is analogous to a #strong[series RC circuit:] the resistor provides immediate response (P-mode), while the capacitor accumulates charge (I-mode), together ensuring zero steady-state error and stability.

A #strong[PID controller] is analogous to a #strong[series RLC circuit:] the resistor damps oscillations (D-mode), the inductor provides stiffness (P-mode), and the capacitor accumulates charge (I-mode). Tuning $K_P$, $K_I$, $K_D$ is mathematically identical to choosing $R$, $L$, $C$ in an RLC circuit---both systems are characterized by the same second-order differential equation.

]
, 
title: 
[
Tip
]
, 
background_color: 
rgb("#ccf1e3")
, 
icon_color: 
rgb("#00A047")
, 
icon: 
fa-lightbulb()
, 
body_background_color: 
white
)
]
=== Example: Temperature Control with PID
<example-temperature-control-with-pid>
#strong[System:] Oven with thermal dynamics

$ rho c frac(d T, d t) = - frac(T - T_(upright("amb")), R_(upright("th"))) + P_(upright("heater")) $

where $T$ is oven temperature, $rho c$ is heat capacity, $R_(upright("th"))$ is thermal resistance, $P_(upright("heater"))$ is heater power (control input).

#strong[Parameters:] $rho c = 100$ J/K, $R_(upright("th")) = 0.1$ K/W, $T_(upright("amb")) = 20 degree$C, desired temperature $T_(upright("ref")) = 100 degree$C.

#strong[Steady state (without control):] Even with maximum heater power, temperature would be limited by losses.

==== P-Only Control
<p-only-control>
$ P_(upright("heater")) = K_P (T_(upright("ref")) - T (t)) $

With $K_P = 500$ W/°C:

#strong[Steady-state behavior:] At equilibrium, $frac(d T, d t) = 0$, so

$ 0 = - frac(T_oo - 20, 0.1) + 500 (100 - T_oo) $

$ 10 (T_oo - 20) + 500 (100 - T_oo) = 0 $

$ 10 T_oo - 200 + 50000 - 500 T_oo = 0 $

$ - 490 T_oo = - 49800 arrow.r.double T_oo approx 101.6 degree upright("C") $

#strong[Steady-state error:] $T_oo - T_(upright("ref")) = 1.6 degree$C (system doesn't reach target, settling to slightly higher temperature to maintain balance).

==== PI Control
<pi-control>
$ P_(upright("heater")) = K_P (T_(upright("ref")) - T (t)) + K_I integral_0^t (T_(upright("ref")) - T (tau)) thin d tau $

The integral term accumulates error. If $T < T_(upright("ref"))$ for extended time, the integral grows, increasing heater power beyond what P alone would provide.

#strong[Steady-state behavior:] At equilibrium, $frac(d e, d t) = 0$ (error is constant or zero). The integral term becomes constant, providing whatever steady-state power is needed to maintain desired temperature.

If the system can reach $T_(upright("ref"))$, then $e = 0$, integral stops growing, and integral term provides exactly the power needed to maintain that temperature.

#strong[Result:] Zero steady-state error (perfect temperature control, assuming system is capable).

With $K_P = 500$ W/°C, $K_I = 50$ W/(°C·s), the system settles to $T_oo = 100 degree$C exactly (no offset).

==== PID Control
<pid-control>
Adding derivative term $K_D frac(d T, d t)$ damps the response, reducing overshoot and oscillation while maintaining zero steady-state error.

With $K_P = 500$, $K_I = 50$, $K_D = 20$ W·s/°C:

- #strong[Rise time] (time to reach target): \~2 seconds
- #strong[Overshoot];: \<5% (derivative dampens overshoot)
- #strong[Settling time] (time to stay within ±1°C): \~5 seconds
- #strong[Steady-state error];: 0°C (integral guarantees zero offset)

Compare to P-only (\~1.6°C error, no oscillation but doesn't reach target) or PI (may overshoot before settling).

== XIII.6 Linear Quadratic Regulator (LQR) Control
<xiii.6-linear-quadratic-regulator-lqr-control>
=== Optimal Control Problem
<optimal-control-problem>
Rather than specifying desired pole locations, we can pose an #strong[optimal control problem];: minimize a #strong[cost function] that penalizes deviations from desired state and control effort.

#strong[Cost function:] $ J = integral_0^oo [upright(bold(z)) (t)^T upright(bold(Q)) upright(bold(z)) (t) + u (t)^T upright(bold(R)) u (t)] d t $

where: - $upright(bold(Q))$ is a symmetric positive-semidefinite matrix weighting state deviations - $upright(bold(R))$ is a symmetric positive-definite matrix weighting control effort - Trade-off: $upright(bold(Q))$ large → aggressively drive state to zero; $upright(bold(R))$ large → minimize control effort (energy/fuel)

=== Effort-Flow Interpretation of LQR
<effort-flow-interpretation-of-lqr>
The LQR cost function can be understood in terms of the #strong[effort-flow pairs] from the bond-graph framework (Part IV):

$ J = integral_0^oo [upright(bold(z))^T upright(bold(Q)) upright(bold(z)) + u^T upright(bold(R)) u] d t = integral_0^oo [(upright("effort: ") upright(bold(z)))^T upright(bold(Q)) (upright("effort: ") upright(bold(z))) + (upright("flow: ") u)^T upright(bold(R)) (upright("flow: ") u)] d t $

In this interpretation: - #strong[First term $upright(bold(z))^T upright(bold(Q)) upright(bold(z))$:] The state $upright(bold(z))$ represents the "effort" variables (position, voltage, temperature, etc.). Large $upright(bold(Q))$ penalizes deviations from desired state, so we work hard (expend effort) to track the reference.

- #strong[Second term $u^T upright(bold(R)) u$:] The control input $u$ represents the "flow" variable (force, current, power, etc.). Large $upright(bold(R))$ penalizes control effort, meaning we conserve power/energy and accept slower response.

#strong[Physical interpretation:] In power-conjugate systems, the product of effort and flow equals power: $P = e dot.op f$. The LQR cost weights the squared effort separately from the squared flow, effectively asking: #emph[What is the optimal trade-off between working hard on the effort variable (achieving tight control) versus conserving power by minimizing control flow?]

#block[
#callout(
body: 
[
#strong[Example: Thermal System.] If we want to reach a temperature target (effort variable) while minimizing heater power (flow variable): - Large $upright(bold(Q))$ → reach temperature quickly, regardless of energy cost - Large $upright(bold(R))$ → conserve fuel, accept slower temperature rise - Optimal LQR balances both via the Riccati equation

]
, 
title: 
[
Tip
]
, 
background_color: 
rgb("#ccf1e3")
, 
icon_color: 
rgb("#00A047")
, 
icon: 
fa-lightbulb()
, 
body_background_color: 
white
)
]
#strong[LQR (Linear Quadratic Regulator):] The problem is to find the control $u (t)$ that minimizes $J$.

=== Solution via Riccati Equation
<solution-via-riccati-equation>
#strong[Theorem XIII.6.1 (LQR Optimality):] The optimal feedback control is

$ u^(\*) (t) = - upright(bold(K))_(upright("opt")) upright(bold(z)) (t) $

where the optimal feedback gain is

$ upright(bold(K))_(upright("opt")) = upright(bold(R))^(- 1) upright(bold(B))^T upright(bold(P)) $

and $upright(bold(P))$ is the #strong[symmetric positive-definite solution] to the #strong[algebraic Riccati equation];:

$ upright(bold(A))^T upright(bold(P)) + upright(bold(P)) upright(bold(A)) - upright(bold(P)) upright(bold(B)) upright(bold(R))^(- 1) upright(bold(B))^T upright(bold(P)) + upright(bold(Q)) = 0 $

The resulting cost is $J^(\*) = upright(bold(z))_0^T upright(bold(P)) upright(bold(z))_0$.

#emph[Proof @Bryson_1975:] The Riccati equation is the Hamilton-Jacobi-Bellman condition for optimality. □

=== Worked Example: Speed Control Trade-Off
<worked-example-speed-control-trade-off>
#strong[Problem:] An electric motor has dynamics

$ m dot(v) = - b v + u $

where $v$ is velocity, $m = 1$ kg is effective mass, $b = 0.1$ N·s/m is damping coefficient, and $u$ is motor torque (control).

Goal: Bring velocity from $v_0 = 0$ to desired velocity (say $v_f = 10$ m/s). But what's the trade-off between reaching the goal quickly (large control effort) vs.~conserving energy (small control effort)?

#strong[LQR formulation:] - State: $upright(bold(z)) = v$ - $upright(bold(A)) = - 0.1$ (scalar, decay due to friction) - $upright(bold(B)) = 1$ (control affects velocity directly) - $upright(bold(Q)) = q$ (penalize deviation from desired velocity) - $upright(bold(R)) = r$ (penalize control effort)

Varying the ratio $q \/ r$ changes the trade-off:

#strong[Case 1: $q \/ r = 1$ (balanced trade-off)] - Riccati solution: $P = sqrt(0.1^2 + q) approx 1$ (if $q = 0.99$) - Optimal gain: $K = P R^(- 1) B^T = 1 dot.op 1 dot.op 1 = 1$ - Control law: $u = - v$ (proportional to velocity) - Response: Reaches 63% of target in \~1 second, smooth approach to target

#strong[Case 2: $q \/ r = 10$ (prioritize reaching target)] - Higher $q$ penalizes large velocity errors more - Optimal gain increases (more aggressive control) - Response: Reaches 90% of target in \~0.3 seconds, but requires larger control effort - Maximum torque needed: \~10 N·m

#strong[Case 3: $q \/ r = 0.1$ (prioritize energy conservation)] - Lower $q$ accepts larger deviations - Optimal gain decreases (more conservative control) - Response: Takes \~3 seconds to reach 90% of target, but requires only \~1 N·m - Energy efficient but slower

#strong[Key insight:] LQR automatically balances these trade-offs. The Riccati equation encodes the optimal balance, which depends on the specific cost weights $upright(bold(Q))$ and $upright(bold(R))$.

== XIII.7 The Inverted Pendulum: Unstable System Control
<xiii.7-the-inverted-pendulum-unstable-system-control>
=== Physics of the Inverted Pendulum
<physics-of-the-inverted-pendulum>
An inverted pendulum is a classic control problem: a rod balanced on a moving cart. The pendulum is #strong[naturally unstable] (small perturbations cause it to fall). Yet, by moving the cart appropriately, we can keep the pendulum upright.

#strong[System equations:] Let $x$ be cart position, $theta$ be pendulum angle from vertical.

$ M dot.double(x) + m dot.double(x) + m l dot.double(theta) cos theta - m l dot(theta)^2 sin theta = F $

$ m l dot.double(x) cos theta + (I + m l^2) dot.double(theta) - m g l sin theta = 0 $

where: - $M = 1$ kg (cart mass) - $m = 0.1$ kg (pendulum mass) - $l = 0.5$ m (pendulum length) - $I = m l^2 = 0.0025$ kg·m² (moment of inertia) - $F$ (control force applied to cart)

#strong[Linearization around upright equilibrium ($theta approx 0$):]

Using $sin theta approx theta$, $cos theta approx 1$, $dot(theta)^2 sin theta approx 0$:

$ mat(delim: "[", M + m, m l; m l, I + m l^2) mat(delim: "[", dot.double(x); dot.double(theta)) = mat(delim: "[", F; m g l theta) $

Solving for accelerations and converting to state form $upright(bold(z)) = [x \, dot(x) \, theta \, dot(theta)]^T$:

$ dot(upright(bold(z))) = mat(delim: "[", 0, 1, 0, 0; 0, - 0.5, 1, 0; 0, 0, 0, 1; 0, - 1, 20, 0) upright(bold(z)) + mat(delim: "[", 0; 1; 0; 2) F $

#strong[Open-loop eigenvalues:] $lambda = 0 \, 0 \, plus.minus 4.47$ (unstable positive eigenvalue!)

=== Stabilization via LQR
<stabilization-via-lqr>
Apply LQR with $upright(bold(Q)) = I$ (penalize all state deviations equally), $R = 1$ (moderate control effort).

#strong[Optimal feedback gain:] $upright(bold(K))_(upright("opt")) approx [0 thin 10 thin 100 thin 20]$ (approximate values)

This means: $F = - 10 dot(x) - 100 theta - 20 dot(theta)$ plus a reference command.

#strong[Interpretation:] - $- 10 dot(x)$: Proportional to cart velocity (damp the cart) - $- 100 theta$: Strongly proportional to angle (big restoring force if pendulum tilts) - $- 20 dot(theta)$: Proportional to angular velocity (damp the swing)

#strong[Result:] Closed-loop eigenvalues move to $lambda approx - 5 \, - 3 \, - 2 \, - 1$ (all stable).

#strong[Performance:] - From perturbed state, returns to upright in \~2 seconds - Cart displacement is bounded - Pendulum angle stays within ±0.1 rad despite disturbances

#strong[Without control:] Pendulum falls within 1 second.

== XIII.8 The Intrinsic-Extrinsic Boundary and Control
<xiii.8-the-intrinsic-extrinsic-boundary-and-control>
=== Philosophical Implication
<philosophical-implication>
Control theory reveals a blurred boundary between intrinsic and extrinsic properties:

+ #strong[Intrinsic view:] The system has fixed dynamics $upright(bold(A))$, stability determined by eigenvalues of $upright(bold(A))$. An unstable system (like inverted pendulum) is inherently unstable---that's intrinsic to its structure.

+ #strong[Extrinsic view:] We apply feedback based on measurements. This is an external intervention, implemented by a controller (which could be external hardware or software).

+ #strong[Result:] The closed-loop system has dynamics $upright(bold(A))_(C L) = upright(bold(A)) - upright(bold(B K))$, which can be #strong[fundamentally different] from the open-loop system. An unstable system becomes stable. A slow system becomes fast.

#strong[Question:] Is the closed-loop stability an intrinsic property (part of the system design) or extrinsic (external controller)?

#strong[Answer:] Both. The feedback law $upright(bold(K))$ is #strong[extrinsic] (comes from outside). But once implemented, it #strong[becomes intrinsic] to the system (it's now part of how the system behaves). The distinction is more about perspective than physics.

This is why control systems are often designed as #strong[integrated units];: the "system" includes both the plant (original dynamics $upright(bold(A))$) and the controller (feedback law $upright(bold(K))$). The observed behavior comes from their combination.

=== Theorem: Controllability and Stabilizability
<theorem-controllability-and-stabilizability>
#strong[Theorem XIII.8.1 (Stabilizability via Feedback):] If the system $(upright(bold(A)) \, upright(bold(B)))$ is #strong[controllable];, then there exists a feedback gain $upright(bold(K))$ such that the closed-loop system $upright(bold(A))_(C L) = upright(bold(A)) - upright(bold(B K))$ is #strong[stable] (all eigenvalues in the left half-plane).

#emph[Proof:] By controllability, we can place eigenvalues anywhere. Choose all eigenvalues in the left half-plane (negative real part). Then $upright(bold(A))_(C L)$ is stable. □

#strong[Weaker condition:] Even if the system is not fully controllable, we may be able to stabilize the #strong[controllable subspace] while the uncontrollable modes are intrinsically stable.

#horizontalrule

We began with a simple observation: change is fundamental. Dynamical systems change---for reasons. Those reasons divide into two categories: what the system #strong[is] (intrinsic structure) and what it #strong[experiences] (extrinsic forcing).

This division appears at every level of physics, from Newton's $F = m a$ to the evolution equations of continuous fields. It appears in the analogy between mechanical, electrical, hydraulic, and gravitational systems---an analogy grounded not in metaphor but in shared mathematical structure. And it appears beyond physics, wherever behavior emerges from the interaction of traits and circumstances.

The product structure $upright("Behavior") = upright("Response") times upright("Drive")$ is both #strong[powerful] and #strong[limiting];:

- #strong[Powerful:] because it unifies an enormous range of phenomena under a single conceptual umbrella
- #strong[Limiting:] because it reveals that behavior alone cannot resolve the relative contributions of its factors

Recognizing this architecture encourages a systematic and modest approach to understanding the world:

+ We build models that #strong[separate] intrinsic operators from extrinsic sources
+ We design experiments that #strong[control] one while varying the other
+ We remain appropriately #strong[humble] about causal claims in domains where the product structure applies

The three passive roles---potential storage, kinetic storage, dissipation---appear in every energy-transferring system. The effort-flow pairs that define power transfer enable consistent cross-domain modeling. The conservation-plus-constitution pattern generates evolution equations across physics.

The guitar string and the heat flow, the circuit and the shock absorber, the predator and the prey---all are governed by the same deep logic. #strong[That logic is the patterns of change.]

#horizontalrule

= Part XIV: Bifurcations, Stability, and the Geometry of Phase Space
<part-xiv-bifurcations-stability-and-the-geometry-of-phase-space>
== XIV.1 Motivation: Why Systems Behave Differently at Different Parameters
<xiv.1-motivation-why-systems-behave-differently-at-different-parameters>
Throughout this framework, we have treated system parameters ($m$, $b$, $k$, $R$, $L$, $C$, etc.) as fixed. In reality, parameters change: a spring weakens with age, a resistor heats up and changes value, a population's intrinsic growth rate varies with genetics.

#strong[The central question of bifurcation theory:] When we #strong[vary a parameter];, how does the #strong[qualitative behavior] of the system change?

#strong[Example:] A mass on a spring with damper has steady-state behavior that depends critically on damping ratio $zeta$: - $zeta < 1$ (underdamped): Oscillates to equilibrium - $zeta = 1$ (critically damped): Smoothly approaches equilibrium - $zeta > 1$ (overdamped): Slowly approaches equilibrium

As we #strong[vary] the damping coefficient $b$ (or equivalently $zeta$), the long-term behavior #strong[qualitatively changes] at $zeta = 1$. This is a #strong[bifurcation point];---a parameter value where the structure of solutions changes.

More dramatic examples exist: a pendulum hanging straight down is a #strong[stable equilibrium];. But if we invert it, balanced on its tip, the inverted position becomes an #strong[unstable equilibrium];. Adding a tiny restoring force can create an entirely new stable state. The parameter controlling the restoring force is a #strong[bifurcation parameter];.

#strong[Bifurcation theory] characterizes how solutions change as parameters vary, identifies critical parameter values where qualitative changes occur, and describes the new solutions that emerge.

== XIV.2 Fixed Points and Equilibria
<xiv.2-fixed-points-and-equilibria>
#strong[Definition XIV.2.1:] For a system $dot(upright(bold(z))) = upright(bold(F)) (upright(bold(z)) \, mu)$ (where $mu$ is a parameter), a #strong[fixed point] (or #strong[equilibrium];) is a state $upright(bold(z))^(\*)$ such that $upright(bold(F)) (upright(bold(z))^(\*) \, mu) = upright(bold(0))$.

At a fixed point, the state does not change: $dot(upright(bold(z))) = 0$, so the system remains at rest.

#strong[Definition XIV.2.2:] A fixed point $upright(bold(z))^(\*)$ is #strong[stable] (or #strong[attracting];) if small perturbations $upright(bold(z))_0 = upright(bold(z))^(\*) + delta$ decay back to $upright(bold(z))^(\*)$ over time. It is #strong[unstable] (or #strong[repelling];) if small perturbations grow away from $upright(bold(z))^(\*)$.

#strong[Theorem XIV.2.3 (Linearization and Stability):] Consider a fixed point $upright(bold(z))^(\*)$ of $dot(upright(bold(z))) = upright(bold(F)) (upright(bold(z)) \, mu)$. Linearize around this point:

$ dot(delta) = upright(bold(J)) (upright(bold(z))^(\*) \, mu) delta + O (parallel delta parallel^2) $

where $upright(bold(J)) = frac(partial upright(bold(F)), partial upright(bold(z))) \|_(upright(bold(z))^(\*))$ is the #strong[Jacobian matrix];.

- If all eigenvalues of $upright(bold(J))$ have #strong[negative real part];, the fixed point is #strong[linearly stable];.
- If any eigenvalue has #strong[positive real part];, the fixed point is #strong[linearly unstable];.
- If an eigenvalue has #strong[zero real part];, linear analysis is inconclusive (nonlinear terms matter).

#emph[Proof sketch:] The linearization captures the dominant behavior near the fixed point. By the Hartman-Grobman theorem @Khalil_2002, the local phase portrait of the nonlinear system near a hyperbolic fixed point is topologically equivalent to that of its linearization. □

== XIV.3 Bifurcations: When Stability Changes
<xiv.3-bifurcations-when-stability-changes>
#strong[Definition XIV.3.1:] A #strong[bifurcation] occurs at a parameter value $mu_c$ if the number or stability of fixed points changes as $mu$ passes through $mu_c$.

#strong[Theorem XIV.3.2 (Bifurcation Condition):] A bifurcation generically occurs when an eigenvalue of the Jacobian crosses the imaginary axis: - #strong[Real eigenvalue crosses zero:] Saddle-node or transcritical bifurcation - #strong[Complex conjugate pair crosses imaginary axis:] Hopf bifurcation

=== Saddle-Node Bifurcation
<saddle-node-bifurcation>
#strong[Canonical form:] $dot(x) = mu + x^2$

#strong[Behavior:] - For $mu < 0$: Two fixed points at $x = plus.minus sqrt(- mu)$ (one stable, one unstable) - For $mu = 0$: Fixed point at $x = 0$ with zero eigenvalue (saddle-node point) - For $mu > 0$: No fixed points exist

#strong[Physical interpretation:] At $mu < 0$, there is a stable equilibrium where the system rests. As $mu$ increases toward 0, the stable and unstable fixed points collide and annihilate. For $mu > 0$, no equilibrium exists---the system diverges.

#strong[Example - Spring with Varying Stiffness:] A spring with position-dependent stiffness $k = k_0 + mu x^2$ exhibits saddle-node behavior. Below a critical parameter, equilibrium exists; above, it does not.

=== Hopf Bifurcation
<hopf-bifurcation>
#strong[Theorem XIV.3.3 (Hopf Bifurcation):] Consider a two-dimensional system $dot(upright(bold(z))) = upright(bold(F)) (upright(bold(z)) \, mu)$ with a fixed point $upright(bold(z))^(\*) (mu)$ whose Jacobian eigenvalues are $lambda (mu) = alpha (mu) plus.minus i omega (mu)$.

If: 1. $alpha (mu_c) = 0$ and $omega (mu_c) eq.not 0$ (complex eigenvalues cross imaginary axis) 2. $frac(d alpha, d mu) \|_(mu_c) eq.not 0$ (transversality: eigenvalues cross generically)

then at $mu = mu_c$, a #strong[periodic orbit] (limit cycle) emerges from the fixed point.

- For $mu < mu_c$: Fixed point is stable; no periodic orbit
- For $mu = mu_c$: Fixed point loses stability; periodic orbit born with infinitesimal amplitude
- For $mu > mu_c$: Fixed point is unstable; periodic orbit is stable with finite amplitude

#emph[Proof sketch:] The bifurcation is analyzed via the #strong[normal form reduction] to the two-dimensional center manifold. Near the bifurcation point, the dynamics reduce to $dot(r) = mu r + c r^3$, $dot(theta) = omega$, where $r$ is the amplitude of the limit cycle. □

#strong[Physical interpretation:] At the bifurcation point, the system transitions from decaying to equilibrium to oscillating about the former equilibrium. This is the birth of oscillations from a stable state.

#strong[Example - RLC Circuit Near Resonance:] An RLC circuit with controllable damping exhibits a Hopf bifurcation as damping is reduced. Below the critical damping, oscillations are damped (overdamped). At the bifurcation, a neutrally stable oscillation emerges. Above (undamped), oscillations persist.

== XIV.4 Bifurcation Diagrams
<xiv.4-bifurcation-diagrams>
A #strong[bifurcation diagram] plots fixed points (and their stability) against the bifurcation parameter $mu$: - Solid curves: stable fixed points - Dashed curves: unstable fixed points - Critical points ($mu_c$) are where curves meet or disappear

#strong[Bifurcation Diagram for Saddle-Node:]

```
        x
        |
       /|
      / |
  ----  |  (stable)
        |
  -----\|  (unstable)
        |
      --+-- μ
        0
   μ < 0: two fixed points
   μ > 0: no fixed points
```

#strong[Bifurcation Diagram for Hopf:]

```
        A (amplitude)
        |
        |     (stable limit cycle)
        |    /
        |___/
       /|
      / | (stable fixed point)
  ----  |
        |
      --+-- μ
        μ_c
   μ < μ_c: fixed point stable, no oscillation
   μ > μ_c: limit cycle stable, fixed point unstable
```

== XIV.5 Lyapunov Stability: A Rigorous Approach
<xiv.5-lyapunov-stability-a-rigorous-approach>
The #strong[Lyapunov direct method] provides a way to prove stability without explicitly solving the differential equations.

#strong[Definition XIV.5.1:] A #strong[Lyapunov function] for a fixed point $upright(bold(z))^(\*)$ is a scalar function $V (upright(bold(z)))$ such that:

+ $V (upright(bold(z))^(\*)) = 0$ (zero at the fixed point)
+ $V (upright(bold(z))) > 0$ for all $upright(bold(z)) eq.not upright(bold(z))^(\*)$ in a neighborhood (positive definite)
+ $dot(V) (upright(bold(z))) = nabla V dot.op upright(bold(F)) (upright(bold(z))) lt.eq 0$ (decreasing along trajectories)

#strong[Theorem XIV.5.2 (Lyapunov Stability Theorem):] If a Lyapunov function exists for a fixed point, the fixed point is #strong[stable];.

Moreover, if $dot(V) < 0$ (strictly negative) for $upright(bold(z)) eq.not upright(bold(z))^(\*)$, the fixed point is #strong[asymptotically stable] (trajectories converge to $upright(bold(z))^(\*)$).

#emph[Proof sketch:] If $V$ is decreasing and bounded below, it converges to a limit. Since $V (upright(bold(z))^(\*)) = 0$ and $V > 0$ elsewhere, convergence implies $upright(bold(z)) (t) arrow.r upright(bold(z))^(\*)$. □

#strong[Intuition:] Think of $V$ as an energy function. If energy is always decreasing, the system loses energy to dissipation and settles to the lowest-energy state (the fixed point).

=== Example: Spring-Damper System
<example-spring-damper-system>
#strong[System:] $m dot.double(x) + b dot(x) + k x = 0$ with $m \, b \, k > 0$.

#strong[Fixed point:] $x = 0 \, dot(x) = 0$ (at rest).

#strong[Lyapunov function (total mechanical energy):] $ V (x \, dot(x)) = 1 / 2 m dot(x)^2 + 1 / 2 k x^2 $

#strong[Check:] 1. $V (0 \, 0) = 0$ ✓ 2. $V (x \, dot(x)) > 0$ for $(x \, dot(x)) eq.not (0 \, 0)$ ✓ 3. $dot(V) = m dot(x) dot.double(x) + k x dot(x) = dot(x) (m dot.double(x) + k x) = dot(x) (- b dot(x)) = - b dot(x)^2 lt.eq 0$ ✓

Since $b > 0$ and $dot(x)^2 gt.eq 0$, we have $dot(V) lt.eq 0$, with $dot(V) = 0$ only at $dot(x) = 0$ (instantaneously). This proves the equilibrium is #strong[asymptotically stable];.

#strong[Physical meaning:] Total mechanical energy (kinetic + potential) always decreases due to damping dissipation. The system dissipates energy until it reaches rest at $x = 0$.

== XIV.6 Connection to Control and Feedback
<xiv.6-connection-to-control-and-feedback>
#strong[Key Insight:] Control theory (Part XII) is fundamentally about #strong[avoiding unstable bifurcations] and #strong[creating stable limit cycles] where desired.

#strong[Example:] An inverted pendulum naturally bifurcates to instability at the upright position. Feedback control (pole placement via $upright(bold(K))$) modifies the eigenvalues of the system, moving them from the unstable (right half-plane) to the stable (left half-plane), preventing the bifurcation.

#strong[Example:] An oscillator with damping ratio $zeta > 1$ has no oscillation. By applying feedback to reduce effective damping (increase $Q$-factor), we can push the system toward a Hopf bifurcation, creating controlled oscillation.

#horizontalrule

= Part XV: Limits and Breakdown of the Framework
<part-xv-limits-and-breakdown-of-the-framework>
== XIV.1 Intellectual Honesty: Where Does This Framework Fail?
<xiv.1-intellectual-honesty-where-does-this-framework-fail>
The intrinsic-extrinsic decomposition $B = R times D$ and the power-conjugacy framework are powerful. But they are #strong[not universal];. This section identifies boundaries where the framework breaks, becomes ambiguous, or requires substantial extension.

#strong[Why this matters:] A framework that claims universality but has no stated limits is dogmatism. Science advances when we understand both where tools work and where they fail.

== XIV.2 Failure Case 1: Chaotic and Stochastic Systems
<xiv.2-failure-case-1-chaotic-and-stochastic-systems>
=== The Problem
<the-problem>
A deterministic chaotic system (e.g., Lorenz equations) has sensitive dependence on initial conditions. The behavior $B (t)$ at time $t$ depends critically on initial conditions in a way that makes the #strong[product factorization $B = R times D$ ambiguous];.

#strong[Lorenz System:] $dot(x) = sigma (y - x)$, $dot(y) = x (rho - z) - y$, $dot(z) = x y - beta z$

#strong[Question:] Is the chaotic trajectory an "intrinsic" property (determined by the system's Lyapunov exponents and attractor structure) or "extrinsic" (determined by initial conditions)?

#strong[Answer:] Both, and neither cleanly.

- If we measure only the attractor (long-term behavior), it is intrinsic: the Lorenz attractor has a fractal structure determined by parameters $sigma \, rho \, beta$.
- If we measure individual trajectories, they depend sensitively on initial conditions (seemingly extrinsic).
- #strong[The product structure breaks:] We cannot separate "what the system is" from "where it started" in any clean way.

=== Framework Limitation
<framework-limitation>
The decomposition $B = R times D$ assumes: - $R$ is #strong[time-invariant] and #strong[independent of amplitude] - $D$ is #strong[the only external input]

#strong[Chaotic systems violate this:] The response $R$ depends on the state amplitude (nonlinear), and the behavior is sensitive to tiny perturbations (initial conditions act like an effective noise source).

=== When the Framework Still Works
<when-the-framework-still-works>
- #strong[Attractor-level description:] If we focus on the attractor geometry (dimension, Lyapunov exponents), these are intrinsic properties, independent of starting conditions.
- #strong[Stationary chaotic regime:] Once transients decay and the system settles on the attractor, we can describe statistics (power spectrum, autocorrelation) as intrinsic.
- #strong[Stochastically perturbed chaos:] If chaotic system is driven by noise (true extrinsic), we can separate them with filtering.

#strong[Theorem XV.2.1 (Caveat on Chaos):] For a chaotic system, the product decomposition $B = R times D$ is valid #strong[only for:] 1. Attractor-level invariants (dimension, Lyapunov spectrum), or 2. Time-averaged statistics (mean, variance, power spectrum), or 3. Systems where extrinsic noise is distinct from initial-condition sensitivity

Trajectory-level identity cannot be cleanly separated into intrinsic and extrinsic factors.

#horizontalrule

== XIV.3 Failure Case 2: Nonlinear Responses with Amplitude Dependence
<xiv.3-failure-case-2-nonlinear-responses-with-amplitude-dependence>
=== The Problem
<the-problem-1>
The framework assumes: $B = R times D$ where $R$ is a #strong[constant] (or matrix $upright(bold(R))$).

But many real systems exhibit #strong[amplitude-dependent response:]

#strong[Nonlinear Spring:] $F = - k x - alpha x^3$ (Duffing oscillator)

The "response" to a force depends on the amplitude of motion: - At small amplitude: behavior like linear spring ($k$) - At large amplitude: cubic term dominates, effective stiffness increases

#strong[This breaks the factorization:] $ B = R (B) times D $

The response $R$ depends on the behavior $B$ itself---it's circular and inseparable.

=== When This Matters
<when-this-matters>
#strong[Type 1: Saturation] - Amplifier with gain $G$ that saturates at large signals - Cannot write $V_(upright("out")) = G times V_(upright("in"))$ cleanly; saturation couples them

#strong[Type 2: Frequency-Dependent Damping] - Viscosity that increases with speed: $b = b_0 + alpha v$ - Effective damping depends on response amplitude

#strong[Type 3: Parametric Forcing] - External drive modulates system parameters themselves - Example: Swing that is pumped (drive modulates effective stiffness) - Cannot cleanly separate drive from response

=== When the Framework Still Works
<when-the-framework-still-works-1>
- #strong[Small-signal approximation:] If amplitudes are sufficiently small, nonlinearities are negligible, and $R$ is approximately constant
- #strong[Linearization around operating point:] Valid locally but not globally
- #strong[Power-series expansion:] Can write $B = R_1 D + R_3 D^3 + dots.h$ but loses simplicity

#strong[Theorem XV.3.1:] The product decomposition $B = R times D$ is valid for amplitudes small enough that response $R$ is #strong[amplitude-independent];. For large-amplitude nonlinear systems, the decomposition becomes multi-valued or requires higher-order expansion.

#horizontalrule

== XIV.4 Failure Case 3: Time-Delay Systems and Memory Effects
<xiv.4-failure-case-3-time-delay-systems-and-memory-effects>
=== The Problem
<the-problem-2>
The framework assumes the system has #strong[Markovian] dynamics: future state depends only on current state and current input, not on history.

But real systems have #strong[memory:]

#strong[Neural Synapses:] Plasticity depends on past spike history (not just current spike)

#strong[Materials with Hysteresis:] Magnetization depends on history of applied field, not just current field

#strong[Viscoelastic Materials:] Stress depends on entire strain history, not just current strain

=== Delayed Feedback
<delayed-feedback>
Many control systems use delayed feedback: $ u (t) = - K z (t - tau) $

This converts a finite-dimensional ODE into an #strong[infinite-dimensional DDE (Delay Differential Equation)];: $ dot(upright(bold(z))) (t) = upright(bold(A)) upright(bold(z)) (t) + upright(bold(B)) u (t - tau) $

#strong[The product structure breaks in two ways:] 1. State space is infinite-dimensional (history must be tracked) 2. The decomposition $upright(bold(A))_(C L) = upright(bold(A)) - upright(bold(B K))$ becomes $upright(bold(A))_(C L) = upright(bold(A)) - upright(bold(B K)) e^(- lambda tau)$ (complex eigenvalue dependence on delay)

=== When the Framework Still Works
<when-the-framework-still-works-2>
- #strong[Delay small compared to system time constants:] Can approximate as small perturbation
- #strong[Rational transfer function representation:] DDEs can be embedded in higher-dimensional ODEs
- #strong[Frequency-domain analysis:] For sufficiently large bandwidth, delay can be neglected

#strong[Theorem XV.4.1:] A system with time delay $tau$ can be analyzed using the product framework if and only if $tau$ is small compared to the dominant time constant $tau_(upright("sys"))$. When $tau \/ tau_(upright("sys"))$ is non-negligible, the dimensionality of the state space changes (becomes infinite), and standard pole placement may destabilize the system.

#horizontalrule

== XIV.5 Failure Case 4: Strongly Coupled Multi-Body Systems
<xiv.5-failure-case-4-strongly-coupled-multi-body-systems>
=== The Problem
<the-problem-3>
The framework treats each element (mass, resistor, etc.) as having #strong[independent] intrinsic properties.

But some systems have #strong[strong coupling] where separation is impossible:

#strong[Example: Coupled Mechanical Oscillators] $ m_1 dot.double(x)_1 = - k_1 x_1 + c (x_2 - x_1) $ $ m_2 dot.double(x)_2 = - k_2 x_2 + c (x_1 - x_2) $

The coupling constant $c$ links the two masses. The response of mass 1 depends on mass 2's properties and vice versa.

#strong[Question:] What is the "intrinsic response" of mass 1 alone? It's #strong[ill-defined] because mass 1's dynamics depend on mass 2.

=== When This Breaks the Framework
<when-this-breaks-the-framework>
- #strong[Tight coupling:] If $c$ is very large, the two masses are effectively rigidly connected; the system is not two separate objects but one
- #strong[Resonance transfer:] If frequencies match, energy can transfer completely between masses; identification of individual properties becomes impossible

=== When the Framework Still Works
<when-the-framework-still-works-3>
- #strong[Weak coupling:] If $c lt.double k_1 \, k_2$, each mass has approximately independent dynamics with a small coupling perturbation
- #strong[Modal decomposition:] Coupled systems can be #strong[decoupled] via coordinate transformation to normal modes (eigenvectors)
- #strong[Hierarchical analysis:] Study the coupled system as a #strong[higher-level intrinsic object]

#strong[Theorem XV.5.1:] A coupled system of $n$ bodies can be analyzed as $n$ separate intrinsic components only if the coupling is weak or if the system is transformed to normal modes (eigenvector coordinates). Strong coupling requires treating the entire system as a single intrinsic entity.

#horizontalrule

== XIV.6 Critical Connection: Identifiability ↔ Controllability Relationship
<xiv.6-critical-connection-identifiability-controllability-relationship>
#strong[Missing from previous analysis: Why identifiability and controllability are linked.]

=== Theorem XV.6.1 (Identifiability-Observability Duality)
<theorem-xv.6.1-identifiability-observability-duality>
A system is #strong[identifiable] (can separate $R$ and $D$) if and only if it is #strong[observable] (can infer state from measurements).

#strong[Precise Statement:] Consider a system $dot(upright(bold(z))) = upright(bold(A)) upright(bold(z)) + upright(bold(B)) u$, $upright(bold(y)) = upright(bold(C)) upright(bold(z))$.

The parameters $upright(bold(A)) \, upright(bold(B))$ are #strong[identifiable] from observed input-output pairs $(u (t) \, upright(bold(y)) (t))$ if and only if the pair $(upright(bold(C)) \, upright(bold(A)))$ is #strong[observable];.

#emph[Proof sketch:] Identifiability requires: different parameter values produce different observed behaviors. Observability requires: different state values produce different measurements. These are equivalent via duality: a state is observable iff the parameter set determining that state is identifiable. □

#strong[Practical Consequence:] If a system is unobservable (some state dimension is invisible in the output), then those state parameters cannot be identified from that output. You must add additional sensors.

=== Theorem XV.6.2 (Controllability-Stabilizability via Feedback)
<theorem-xv.6.2-controllability-stabilizability-via-feedback>
A system is #strong[stabilizable] (can stabilize it via feedback) if and only if its #strong[uncontrollable modes are already stable];.

#strong[Precise Statement:] Consider a system $dot(upright(bold(z))) = upright(bold(A)) upright(bold(z)) + upright(bold(B)) u$ with control input $u$.

+ If $(upright(bold(A)) \, upright(bold(B)))$ is #strong[controllable];, then there exists $upright(bold(K))$ such that $upright(bold(A)) - upright(bold(B K))$ is stable.

+ If $(upright(bold(A)) \, upright(bold(B)))$ is #strong[not controllable];, then let $upright(bold(A)) = upright(bold(T))^(- 1) mat(delim: "[", upright(bold(A))_c, \*; 0, upright(bold(A))_u) upright(bold(T))$ be the Kalman decomposition (controllable and uncontrollable parts).

  The system is #strong[stabilizable] iff $upright(bold(A))_u$ is stable (uncontrollable modes are already stable).

#emph[Proof sketch:] Controllable modes can be arbitrarily placed (via pole placement). Uncontrollable modes cannot be affected by any feedback law. Thus, stabilization is possible iff uncontrollable modes are intrinsically stable. □

#strong[Implication:] You cannot control what you cannot reach. If a subsystem is uncontrollable and unstable, no feedback can stabilize it.

=== Theorem XV.6.3 (Bifurcation Loss of Identifiability)
<theorem-xv.6.3-bifurcation-loss-of-identifiability>
As a system approaches a bifurcation point, #strong[identifiability degrades];.

#strong[Precise Statement:] Consider a system $dot(upright(bold(z))) = upright(bold(F)) (upright(bold(z)) \, theta \, mu)$ where $theta$ are parameters and $mu$ is a bifurcation parameter.

As $mu arrow.r mu_c$ (bifurcation point):

+ #strong[Eigenvalue sensitivity increases:] $frac(d lambda, d theta) arrow.r oo$ as an eigenvalue approaches zero (bifurcation condition)

+ #strong[Fisher Information degrades:] $I (theta) = bb(E) [(nabla_theta log p)^2] arrow.r 0$ as the system response becomes less sensitive to parameters

+ #strong[Practical consequence:] Near bifurcation, small changes in parameters produce large changes in behavior, BUT distinguishing which parameter changed becomes harder (eigenvalue sensitivity is nonunique in the unstable manifold)

#emph[Proof sketch:] At bifurcation, the Jacobian has zero eigenvalue. The system response becomes insensitive to perturbations in directions tangent to the manifold. Thus, information about parameters affecting those directions is lost. □

#strong[Practical Implication:] Don't try to identify system parameters if the system is near a bifurcation. The system is sensitive but "noisy" in terms of identifiability.

#horizontalrule

== XIV.7 Summary: Where the Framework is Robust vs.~Fragile
<xiv.7-summary-where-the-framework-is-robust-vs.-fragile>
#table(
  columns: (20%, 20%, 20%, 20%, 20%),
  align: (left,left,left,left,left,),
  table.header([System Type], [Product Structure], [Power Conjugacy], [Identifiability], [Controllability],),
  table.hline(),
  [#strong[Linear, passive];], [✓ Robust], [✓ Robust], [✓ Under conditions], [✓ Robust],
  [#strong[Weakly nonlinear];], [✓ Approximate], [✓ Approximate], [⚠ Reduced range], [✓ Local],
  [#strong[Strongly nonlinear];], [✗ Breaks], [✗ Breaks], [✗ Multi-valued], [⚠ Depends on amplitude],
  [#strong[Chaotic];], [⚠ Attractor-level only], [⚠ Statistical only], [✗ Trajectory-level fails], [⚠ Requires external drive],
  [#strong[Time-delayed];], [⚠ Infinite-dim], [⚠ Modified], [✗ Degrades with delay], [✗ Destabilized by delay],
  [#strong[Strongly coupled];], [✗ Breaks], [✗ Breaks], [✗ Underdetermined], [⚠ Depends on mode],
)

#horizontalrule

= Appendix M: Rigorous Foundations for Intrinsic-Extrinsic Decomposition
<appendix-m-rigorous-foundations-for-intrinsic-extrinsic-decomposition>
== M.1 Motivation and Overview
<m.1-motivation-and-overview>
In Part IX we introduced the product structure $B = R times D$ algebraically and noted the fundamental ambiguity: given observed behavior $B$, the factors $R$ and $D$ are not uniquely determined. This appendix develops a rigorous mathematical treatment of:

+ #strong[Existence and uniqueness] of the decomposition under specified conditions
+ #strong[Gauge freedom] characterizing the family of equivalent factorizations
+ #strong[Experimental identifiability] conditions necessary to resolve the ambiguity
+ Connection to #strong[information theory and statistical identification]

We work primarily in the scalar case for clarity, then extend to vectors and matrices where the structure is fundamental.

#strong[Structure of this Session:] This is Session 1 of the comprehensive framework. The flow is: - #strong[Part IX] (above): Conceptual introduction to the product structure problem using Ohm's law, nature-nurture analogy, and epistemological implications - #strong[Part X] (above): Concrete demonstrations across 7 domains (electrical, mechanical, thermal, hydraulic)---RC circuits, thermal systems, etc.---showing the identification ambiguity in practice - #strong[Appendix M] (this section): Rigorous mathematical theorems proving existence, uniqueness, and experimental resolution strategies - #strong[Later Sessions];: Sessions 3--5 extend these concepts to cross-domain analogies (Part XI), infinite-dimensional systems (Appendix N), and feedback control (Part XII)

The theorems in this appendix are general; their application to specific systems (RC circuits, thermal systems, etc.) is shown in Part X.

== M.2 The Scalar Decomposition Problem
<m.2-the-scalar-decomposition-problem>
=== Definition and Basic Structure
<definition-and-basic-structure>
#strong[Definition M.2.1:] Let $B in bb(R)$ be an observed scalar quantity. We say $B$ #strong[admits a product decomposition] if there exist scalars $R \, D in bb(R)$ such that

$ B = R dot.op D $

#strong[Definition M.2.2:] Given $B$, the set of all possible factorizations is

$ cal(F) (B) = { (R \, D) in bb(R)^2 : R dot.op D = B } $

=== Characterization of Solutions
<characterization-of-solutions>
#strong[Lemma M.2.3:] If $B eq.not 0$, then $cal(F) (B)$ is a hyperbola in the $(R \, D)$ plane given by $D = B \/ R$ for all nonzero $R$.

#emph[Proof:] Directly from the definition. For any $R eq.not 0$, setting $D = B \/ R$ gives $R dot.op D = B$. Conversely, if $(R \, D) in cal(F) (B)$ with $R eq.not 0$, then $D = B \/ R$ follows from the product equation. The set of all such points forms a hyperbola with asymptotes $R = 0$ and $D = 0$. □

#strong[Corollary M.2.4 (Non-Uniqueness):] For any $B eq.not 0$, the decomposition is #strong[not unique];. The one-parameter family of equivalent factorizations is parameterized by any choice of scale $alpha eq.not 0$:

$ B = (alpha R) times (D / alpha) $

=== Gauge Freedom
<gauge-freedom>
#strong[Definition M.2.5:] For $B eq.not 0$, the #strong[gauge transformation] or #strong[scaling transformation] is the map

$ (alpha) : (R \, D) arrow.r.bar (alpha R \, D \/ alpha) $

for $alpha in bb(R)^(\*)$ (nonzero reals). This transformation preserves the product: $(alpha R) dot.op (D \/ alpha) = R dot.op D = B$.

#strong[Definition M.2.6:] Two factorizations $(R_1 \, D_1)$ and $(R_2 \, D_2)$ are #strong[gauge-equivalent] if there exists $alpha eq.not 0$ such that $(R_2 \, D_2) = (alpha R_1 \, D_1 \/ alpha)$.

#strong[Theorem M.2.7 (Gauge Freedom):] For any $B eq.not 0$, the set of all factorizations $cal(F) (B)$ forms an equivalence class under gauge transformations, with representative $(R \, D)$ generating the complete class ${ (alpha R \, D \/ alpha) : alpha in bb(R)^(\*) }$.

#emph[Proof:] Let $(R \, D) in cal(F) (B)$ with $R eq.not 0$. For any $alpha eq.not 0$, we have $(alpha R) dot.op (D \/ alpha) = R dot.op D = B$, so the gauge-transformed pair also lies in $cal(F) (B)$. The relation "is gauge-equivalent to" is reflexive (take $alpha = 1$), symmetric (use $alpha^(- 1)$), and transitive (compose scale factors), so it is an equivalence relation. Thus $cal(F) (B)$ is partitioned into a single equivalence class if we also allow negative $alpha$ and the degenerate cases $R = 0$ or $D = 0$ (where the product is zero). □

=== The Fundamental Identifiability Problem
<the-fundamental-identifiability-problem>
#strong[Theorem M.2.8 (Fundamental Underdetermination):] Given only the observed value $B$, it is #strong[impossible] to uniquely determine $R$ and $D$ without additional information. That is, for any choice of $(R_(upright("true")) \, D_(upright("true")))$ producing $B = R_(upright("true")) dot.op D_(upright("true"))$, there exist infinitely many other pairs $(R ' \, D ')$ with $R' eq.not R_(upright("true"))$ and $D' eq.not D_(upright("true"))$ that produce the same $B$.

#emph[Proof:] By Corollary M.2.4, given $(R_(upright("true")) \, D_(upright("true")))$, the pair $(alpha R_(upright("true")) \, D_(upright("true")) \/ alpha)$ produces the same observable for any $alpha eq.not 0 \, 1$. Since $alpha$ can take uncountably many values, there are uncountably many equivalent pairs. □

== M.3 Experimental Resolution of Ambiguity
<m.3-experimental-resolution-of-ambiguity>
=== Proof Sketches: Intuition Before Formalism
<proof-sketches-intuition-before-formalism>
Before proceeding to formal theorems, here is the intuition:

- #strong[Fundamental problem:] The product $B = R times D$ is symmetric in a specific way---scaling one factor by $alpha$ while scaling the other by $1 \/ alpha$ preserves the product. Without breaking this symmetry, we cannot distinguish "large $R$ with small $D$" from "small $R$ with large $D$".

- #strong[Core strategy:] Break the symmetry by acquiring additional information. This can happen by:

  + Directly measuring one factor (fixes it, leaving the other determined)
  + Varying one factor and observing how $B$ changes (the pattern of change reveals the fixed factor)
  + Having multiple systems where one factor differs in a known way (comparison reveals what varies)

These strategies work because they all violate the scaling symmetry: once $D$ is known (either directly measured or constrained by observation), the ratio $B \/ D$ uniquely determines $R$.

=== Strategy 1: Independent Measurement of One Factor
<strategy-1-independent-measurement-of-one-factor>
#strong[Theorem M.3.1 (Resolution by Independent Measurement):] Suppose $B = R times D$ is observed, and additionally, one of the two factors is measured independently:

+ If $R$ is measured independently (giving value $R_(upright("meas"))$), then $D$ is uniquely determined as $D = B \/ R_(upright("meas"))$ (assuming $R_(upright("meas")) eq.not 0$).
+ If $D$ is measured independently, then $R$ is uniquely determined as $R = B \/ D_(upright("meas"))$.

#emph[Proof:] This is elementary algebra; once one factor is fixed by independent measurement, the other is determined by solving the product equation. □

=== Strategy 2: Controlled Variation of One Factor
<strategy-2-controlled-variation-of-one-factor>
#strong[Theorem M.3.2 (Resolution by Controlled Variation):] Suppose we can control (vary) the extrinsic drive $D$ while holding the intrinsic response $R$ fixed. Observe the behavior at two distinct drive levels:

$ B_1 = R times D_1 \, quad B_2 = R times D_2 $

where $D_1 eq.not D_2$ are both known. Then $R$ is uniquely determined as:

$ R = frac(B_1 - B_2, D_1 - D_2) $

and $D$ at any level is found from $D = B \/ R$.

#emph[Proof:] From the two equations:

$ R = B_1 / D_1 = B_2 / D_2 $

Solving the first for $R$ using the constraint that the second must hold:

$ B_1 / D_1 = B_2 / D_2 arrow.r.double.long B_1 D_2 = B_2 D_1 arrow.r.double.long R = frac(B_1 - B_2, D_1 - D_2) $

(The second form follows from direct algebraic manipulation.) □

=== Strategy 3: Replicate Systems with Different Parameters
<strategy-3-replicate-systems-with-different-parameters>
#strong[Theorem M.3.3 (Resolution by Replication with Known Parameter Variance):] Suppose two otherwise identical systems differ only in their intrinsic parameter $R$:

$ B_1 = R_1 times D \, quad B_2 = R_2 times D $

where $R_1 eq.not R_2$ are both unknown but $D$ is the same extrinsic drive (known value). Observing $B_1$ and $B_2$, we can solve for both:

$ R_1 = B_1 / D \, quad R_2 = B_2 / D $

#emph[Proof:] Divide the observed values by the known drive. □

=== The Twin Study and Common-Garden Experiment
<the-twin-study-and-common-garden-experiment>
#strong[Corollary M.3.4 (Nature-Nurture Application):] In population genetics, the factorization

$ upright("Phenotype") = upright("Genotype") times upright("Environment") $

is underdetermined from phenotype observations alone (all individuals express the product). However:

+ #strong[Twin studies] (Theorem M.3.2 application): Monozygotic (identical) twins share $R_1 = R_2$ but may have different environments ($D_1 eq.not D_2$), allowing separation:
  - Measured phenotypes: $P_1 = R dot.op E_1$, $P_2 = R dot.op E_2$
  - If environments differ ($E_1 eq.not E_2$), then: $R = (P_1 - P_2) \/ (E_1 - E_2)$
+ #strong[Common-garden experiments] (Theorem M.3.3 application): Hold the environment fixed ($D_1 = D_2$) while genetic variance is allowed ($R_1 eq.not R_2$):
  - Same environment imposed: $P_1 = R_1 dot.op E$, $P_2 = R_2 dot.op E$
  - Then: $R_1 = P_1 \/ E$, $R_2 = P_2 \/ E$

=== Extensions to Other Domains
<extensions-to-other-domains>
The product structure and identification problem appear far beyond genetics:

#strong[Corollary M.3.5 (Economics: Income = Skill × Market Opportunity):]

Observable income $Y$ is the product of worker skill $S$ and market opportunity $M$:

$ upright("Income") = upright("Skill") times upright("Market Opportunity") $

The same income can arise from highly skilled workers in weak markets or low-skill workers in booming markets. To separate:

- #strong[Job mobility experiment (Theorem M.3.2):] Track a cohort of identical-skill workers as market conditions change. Variation in income relative to stable skill reveals market effect.
- #strong[Migration study (Theorem M.3.3):] Bring workers with different (measurable) skills into the same market. Income differences reveal skill effect.

This explains why "income inequality" studies must decompose skill premiums from opportunity premiums; observing income alone is insufficient.

#strong[Corollary M.3.6 (Ecology: Population Growth = Intrinsic Rate × Environmental Capacity):]

The growth of a population can be modeled as the product of intrinsic growth rate $r$ and available environmental capacity $K$:

$ upright("Population Increase") = r times K $

(This is a linearization around equilibrium; the full logistic model is nonlinear, but the product structure holds locally.)

- #strong[Controlled capacity study (Theorem M.3.2):] In laboratory populations with fixed genetic strain, vary nutrient availability $K$. Population growth response reveals $r$.
- #strong[Different species, same habitat (Theorem M.3.3):] Place different species (different $r$) in identical environments ($K$ fixed). Differences in population growth reveal intrinsic rates.

Real ecological studies often employ both strategies: controlled lab evolution experiments (measure $r$) combined with field surveys across habitats (measure $K$).

#strong[Corollary M.3.7 (Psychology: Behavior = Personality × Situation):]

Observable behavior in a situation is often modeled as the product of personality trait $P$ and situational demand $S$:

$ upright("Behavior") = upright("Personality") times upright("Situation") $

Without auxiliary information, two people with very different personalities in very different situations may produce identical observable behavior. Standard approaches to separate them:

- #strong[Repeated measurement (Theorem M.3.2):] Same person across multiple situations (same $P$, varying $S$). The pattern of behavioral change across situations reveals personality.
- #strong[Group comparison (Theorem M.3.3):] Multiple people (different $P$) in the same situation ($S$ controlled). Behavioral differences reveal personality traits.

== M.3.8 Worked Example: RC Circuit Identification
<m.3.8-worked-example-rc-circuit-identification>
=== The Problem
<the-problem-4>
An RC circuit has resistance $R$ and capacitance $C$ in series with a voltage source. At any instant, the voltage across the capacitor $V_C$ evolves according to:

$ dot(V)_C = - frac(1, R C) (V_C - V_(upright("source"))) $

where $R C$ is the time constant $tau$. The steady-state behavior is:

$ V_(C \, oo) = V_(upright("source")) $

But consider the #strong[rate of approach] to steady state. We observe the time to reach 63% of final value (one time constant), call it $T_63$. By definition:

$ T_63 = tau = R C $

#strong[The identification problem:] We measure $T_63$, but we observe only the product $R C$. We cannot tell from $T_63$ alone whether: - $R = 1 upright(" k") Omega$, $C = 1 upright(" μF")$ (giving $tau = 1$ ms), or - $R = 10 upright(" k") Omega$, $C = 0.1 upright(" μF")$ (also $tau = 1$ ms)

These are gauge-equivalent solutions: the second is the first scaled by $alpha = 10$ for $R$ and $1 \/ alpha = 0.1$ for $C$.

=== Resolution Strategy 1: Measure Resistance Directly
<resolution-strategy-1-measure-resistance-directly>
Connect the circuit to a known voltage source (say 5V) and measure the DC leakage current $I_0$. By Ohm's law:

$ R = V / I_0 = frac(5 upright(" V"), I_0) $

Once $R$ is known, the capacitance follows from:

$ C = T_63 / R = frac(R C, R) $

#strong[Numerical example:] - Observed time constant: $T_63 = 1$ ms = $1 times 10^(- 3)$ s - Measured leakage resistance: $R = 10 upright(" k") Omega = 10^4$ Ω - Calculated capacitance: $C = (10^(- 3) upright(" s")) \/ (10^4 upright(" Ω")) = 10^(- 7)$ F = 100 nF

=== Resolution Strategy 2: Controlled Variation
<resolution-strategy-2-controlled-variation>
Keep the same circuit (same $R$ and $C$, hence same $tau = R C$), but vary the driving voltage from $V_1 = 3$ V to $V_2 = 10$ V, while holding the circuit components fixed. Measure the time constant in both cases. Since the time constant depends only on the components, not the driving voltage:

$ T_63^((1)) = R C \, quad T_63^((2)) = R C $

Both measurements give the same $tau$, which #strong[confirms] that the time constant is determined by the intrinsic circuit elements and does not depend on extrinsic forcing (voltage level).

But this doesn't uniquely identify $R$ and $C$. We must measure one independently (Strategy 1).

=== Resolution Strategy 3: Replication with Different Capacitor Values
<resolution-strategy-3-replication-with-different-capacitor-values>
Suppose we have two identical resistors (both $R$) but two different capacitors ($C_1$ and $C_2$, with known difference $Delta C = C_2 - C_1$).

- Circuit 1: Measure time constant $T_1 = R C_1$
- Circuit 2: Measure time constant $T_2 = R C_2$

Then:

$ R = frac(T_2 - T_1, C_2 - C_1) = frac(R C_2 - R C_1, C_2 - C_1) $

#strong[Numerical example:] - Circuit 1 time constant: $T_1 = 1$ ms - Circuit 2 time constant: $T_2 = 2$ ms - Known capacitors: $C_1 = 100$ nF, $C_2 = 200$ nF, so $Delta C = 100$ nF = $10^(- 7)$ F - Calculated resistance: $R = (2 - 1) times 10^(- 3) \/ (10^(- 7)) = 10^(- 3) \/ 10^(- 7) = 10^4$ Ω = 10 kΩ

Once $R$ is determined, each capacitance follows: $C_1 = T_1 \/ R$, $C_2 = T_2 \/ R$.

=== Edge Case: What if $R = 0$?
<edge-case-what-if-r-0>
If resistance is zero (superconducting circuit), then $tau = R C = 0$ regardless of $C$. The time constant provides #strong[no information] about the capacitance. This is an example where the product structure breaks down: the identification problem becomes ill-posed because the response $R$ is zero. This corresponds to the degenerate case in Theorem M.2.8 where the product $B$ itself is zero.

=== Edge Case: What if We Have Only One Measurement?
<edge-case-what-if-we-have-only-one-measurement>
Without either: - A second independent measurement (like $R$ via Ohm's law), or - A second observation at different conditions (second time constant), or - Knowledge that $R$ or $C$ differs between circuits,

the single time constant measurement $T_63$ is insufficient to identify both $R$ and $C$. This confirms Theorem M.2.8: single observation of $B = R times D$ does not uniquely determine the factors.

#horizontalrule

== M.4 The Vector Case: Matrix Underdetermination
<m.4-the-vector-case-matrix-underdetermination>
=== Setup and Gauge Freedom
<setup-and-gauge-freedom>
Extend the framework to vector systems:

$ upright(bold(J)) = upright(bold(L)) dot.op upright(bold(X)) $

where $upright(bold(J)) in bb(R)^m$ is the observed flux/behavior, $upright(bold(L)) in bb(R)^(m times n)$ is the response matrix, and $upright(bold(X)) in bb(R)^n$ is the drive vector.

#strong[Theorem M.4.1 (Matrix Gauge Freedom):] Given $upright(bold(J))$ and $upright(bold(L))$, the drive is uniquely determined (if a solution exists) by $upright(bold(X)) = upright(bold(L))^(- 1) upright(bold(J))$ (assuming $upright(bold(L))$ is invertible). However, for #strong[fixed] $upright(bold(J))$, consider pairs $(upright(bold(L)) \, upright(bold(X)))$ producing the same flux. For any invertible matrix $upright(bold(M))$:

$ upright(bold(J)) = upright(bold(L)) dot.op upright(bold(X)) = (upright(bold(L)) dot.op upright(bold(M))) dot.op (upright(bold(M))^(- 1) dot.op upright(bold(X))) $

The pair $(upright(bold(L)) ' \, upright(bold(X)) ') = (upright(bold(L)) dot.op upright(bold(M)) \, upright(bold(M))^(- 1) dot.op upright(bold(X)))$ produces identical flux.

#emph[Proof:] Associativity of matrix multiplication. □

#strong[Definition M.4.2:] A solution pair $(upright(bold(L)) ' \, upright(bold(X)) ')$ obtained by transformation $(upright(bold(L)) \, upright(bold(X))) arrow.r.bar (upright(bold(L)) dot.op upright(bold(M)) \, upright(bold(M))^(- 1) dot.op upright(bold(X)))$ for invertible $upright(bold(M))$ is #strong[gauge-equivalent] to $(upright(bold(L)) \, upright(bold(X)))$.

=== Rank Considerations and Practical Non-Identifiability
<rank-considerations-and-practical-non-identifiability>
#strong[Theorem M.4.3 (Rank Deficiency and Underdetermination):] If $upright(bold(L))$ is rank-deficient (rank $upright(bold(L)) < n$), then even with knowledge of $upright(bold(X))$, the response matrix $upright(bold(L))$ cannot be uniquely recovered from $upright(bold(J))$. Conversely, if $upright(bold(L))$ is rank-deficient, there exist nonzero drives $upright(bold(X))$ that produce zero flux: $upright(bold(J)) = upright(bold(L)) upright(bold(X)) = upright(bold(0))$. These unobservable modes correspond to the null space of $upright(bold(L))$.

#emph[Proof:] If $upright("rank") (upright(bold(L))) = r < n$, then the null space $upright("null") (upright(bold(L)))$ is nontrivial. Any $upright(bold(v)) in upright("null") (upright(bold(L)))$ satisfies $upright(bold(L)) upright(bold(v)) = upright(bold(0))$. Thus $upright(bold(L)) (upright(bold(X)) + upright(bold(v))) = upright(bold(L)) upright(bold(X))$, showing that the drive component in the null space is unobservable. □

== M.5 Information-Theoretic Formulation
<m.5-information-theoretic-formulation>
=== Mutual Information and Identifiability
<mutual-information-and-identifiability>
#strong[Definition M.5.1:] For a system with unknown parameters $theta in Theta$, observations $upright(bold(Y))$, and auxiliary information $cal(A)$, the parameter $theta_i$ is #strong[informationally identifiable] if the conditional mutual information satisfies:

$ I (theta_i ; upright(bold(Y)) \| cal(A) \, theta_(- i)) > 0 $

where $theta_(- i)$ denotes all parameters except $theta_i$.

#strong[Interpretation:] A parameter is identifiable if observations carry information about it (beyond what is already known from auxiliary info and other parameters).

=== Application to Product Structure
<application-to-product-structure>
#strong[Theorem M.5.2 (Information-Theoretic Identifiability of Product Structure):] For the product $B = R times D$:

+ If only $B$ is observed (no auxiliary information), then $I (R ; B \| D) = 0$ and $I (D ; B \| R) = 0$. That is, observing $B$ alone provides no information that distinguishes $(R \, D)$ from $(alpha R \, D \/ alpha)$.

+ If $B$ and $D$ are both observed ($D$ measured independently), then $I (R ; (B \, D) \| D) = oo$ (in the discrete sense: $R$ is deterministically identifiable as $R = B \/ D$).

+ If $B$ is observed under two conditions with known $D_1 eq.not D_2$ but unknown $R$ (same in both), then $I (R ; (B_1 \, B_2 \, D_1 \, D_2)) > 0$ and $R$ is identifiable.

#emph[Proof sketch:] These follow from standard information-theoretic definitions. In case (1), the distribution of $B$ does not change under the transformation $(R \, D) arrow.r.bar (alpha R \, D \/ alpha)$, so $R$ and $D$ carry no distinguishing information. In case (2), the deterministic relationship $R = B \/ D$ provides complete identification. In case (3), the ratio $B_1 \/ B_2 = (R D_1) \/ (R D_2) = D_1 \/ D_2$ is fixed, while variations across conditions break the symmetry. □

== M.6 Statistical Identifiability with Noise
<m.6-statistical-identifiability-with-noise>
=== Setup with Measurement Noise
<setup-with-measurement-noise>
In practice, observations include noise:

$ B_(upright("obs")) = B_(upright("true")) + epsilon.alt = R times D + epsilon.alt $

where $epsilon.alt$ is measurement error with some known statistical distribution.

#strong[Definition M.6.1:] Parameter $theta$ is #strong[statistically identifiable] (or "estimable") if the Maximum Likelihood Estimator (MLE) is consistent and asymptotically normal as $N arrow.r oo$ (number of observations).

#strong[Theorem M.6.2 (Identifiability of Product Under Noise with Variation):]

Suppose we observe $N$ pairs of measurements $(B_i \, D_i)$ where: - $D_1 \, D_2 \, dots.h \, D_N$ are known (controlled or measured directly) - $B_i = R dot.op D_i + epsilon.alt_i$ where $epsilon.alt_i tilde.op upright("iid") (0 \, sigma^2)$ - The drives $D_i$ are not all equal (contain variation)

Then $R$ is #strong[statistically identifiable] via linear regression:

$ hat(R) = frac(sum_(i = 1)^N B_i D_i, sum_(i = 1)^N D_i^2) arrow.r_p R upright(" as ") N arrow.r oo $

and $sqrt(N) (hat(R) - R) arrow.r^d cal(N) (0 \, sigma^2 \/ upright("Var") (D))$.

#emph[Proof:] Standard least-squares theory. The condition that $upright("Var") (D) > 0$ ensures the denominator is nonzero and the estimator is well-defined. Asymptotic normality follows from the central limit theorem applied to the score function. □

=== M.6.3 Worked Example: Estimating Spring Stiffness with Measurement Error
<m.6.3-worked-example-estimating-spring-stiffness-with-measurement-error>
#strong[Setup:] We have a spring with unknown stiffness $k$. We apply known forces $F_1 \, F_2 \, dots.h \, F_N$ and measure the resulting displacements $x_i$ with measurement noise.

#strong[Model:] $ x_i = F_i / k + epsilon.alt_i = R dot.op D_i + epsilon.alt_i $

where $R = 1 \/ k$ is the compliance (intrinsic), $D_i = F_i$ is the applied force (extrinsic), and $epsilon.alt_i tilde.op cal(N) (0 \, sigma_(upright("meas"))^2)$ is measurement error.

#strong[Data collection:] - Apply forces: $F = [1 \, 2 \, 3 \, 4 \, 5]$ N - Measure displacements with error: - True displacements: $x_(upright("true")) = [0.10 \, 0.20 \, 0.30 \, 0.40 \, 0.50]$ m (corresponding to $k = 10$ N/m) - Observed with noise: $x = [0.098 \, 0.205 \, 0.295 \, 0.402 \, 0.498]$ m

#strong[Estimation:] $ hat(R) = frac(sum F_i x_i, sum F_i^2) = frac((1) (0.098) + (2) (0.205) + dots.h.c + (5) (0.498), 1^2 + 2^2 + 3^2 + 4^2 + 5^2) $

$ = frac(0.098 + 0.410 + 0.885 + 1.608 + 2.490, 1 + 4 + 9 + 16 + 25) = 5.491 / 55 approx 0.0998 upright(" m/N") $

#strong[Recover stiffness:] $ hat(k) = 1 \/ hat(R) approx 1 \/ 0.0998 approx 10.02 upright(" N/m") $

This is very close to the true value $k = 10$ N/m. The error ($0.02$ N/m) is due to measurement noise.

#strong[Uncertainty quantification:]

By Theorem M.6.2, the standard error of the estimate is approximately:

$ upright("SE") (hat(R)) = sigma_(upright("meas")) / sqrt(sum F_i^2) = sigma_(upright("meas")) / sqrt(55) $

If $sigma_(upright("meas")) = 0.005$ m (a typical sensor resolution), then:

$ upright("SE") (hat(R)) = 0.005 / sqrt(55) approx 0.000673 upright(" m/N") $

And thus:

$ upright("SE") (hat(k)) approx upright("SE") (1 \/ hat(R)) approx frac(upright("SE") (hat(R)), hat(R)^2) approx 0.000673 / (0.0998)^2 approx 0.068 upright(" N/m") $

The 95% confidence interval would be roughly $[10.02 - 2 (0.068) \, 10.02 + 2 (0.068)] = [9.88 \, 10.16]$ N/m.

#strong[Key insight:] Increasing the range of applied forces (making $sum F_i^2$ large) decreases the uncertainty in the stiffness estimate. This is the practical application of Theorem M.7.2.

=== Edge Case: What if Noise is Too Large?
<edge-case-what-if-noise-is-too-large>
If measurement error $sigma_(upright("meas")) = 0.5$ m (10 times larger), then:

$ upright("SE") (hat(R)) = 0.5 / sqrt(55) approx 0.0673 upright(" m/N") $

$ upright("SE") (hat(k)) approx 0.0673 / (0.0998)^2 approx 6.8 upright(" N/m") $

The 95% confidence interval becomes $[10.02 - 13.6 \, 10.02 + 13.6] = [- 3.58 \, 23.62]$ N/m, which even includes negative values (unphysical). High noise renders the estimation unreliable, illustrating the practical limit of identifiability.

#horizontalrule

== M.7 Connection to Experimental Design
<m.7-connection-to-experimental-design>
=== Fisher Information and Optimal Experiment Design
<fisher-information-and-optimal-experiment-design>
#strong[Definition M.7.1:] For a scalar parameter $theta$ and observation model $p (Y \| theta)$, the #strong[Fisher Information] is:

$ I (theta) = bb(E) [(frac(partial log p (Y \| theta), partial theta))^2] $

For linear regression $Y = theta X + epsilon.alt$ with $epsilon.alt tilde.op cal(N) (0 \, sigma^2)$:

$ I (theta) = frac(upright("Var") (X), sigma^2) $

#strong[Theorem M.7.2 (Fisher Information for Product Structure):]

For the observation model $B = R dot.op D + epsilon.alt$:

+ If we can choose the design of experiments (choose which $D$ values to test), the Fisher Information in $R$ is:

$ I (R) = frac(bb(E) [D^2], sigma^2) $

#block[
#set enum(numbering: "1.", start: 2)
+ To #strong[maximize] identifiability, we should choose $D$ values with the #strong[largest possible variance];, subject to physical constraints.

+ The #strong[Cramér-Rao Lower Bound] on the estimation error is:
]

$ upright("Var") (hat(R)) gt.eq frac(1, I (R)) = frac(sigma^2, bb(E) [D^2]) $

#emph[Proof:] Direct calculation using the Fisher Information formula for linear models. The variance increases with the noise level $sigma^2$ and decreases with the variability in the controlled drive $D$. □

=== M.7.3 Practical Recommendations for Experiment Design
<m.7.3-practical-recommendations-for-experiment-design>
#strong[Principle 1: Maximize the Range of Variation in $D$]

The Fisher Information $I (R) = bb(E) [D^2] \/ sigma^2$ increases with the spread of the independent variable $D$. In practice:

- If you can apply forces from 0 to 10 N, do so---don't cluster measurements near 5 N.
- If studying population growth, test a wide range of nutrient levels (very low to very high).
- If calibrating a sensor's response to a stimulus, vary the stimulus over its full operating range.

#strong[Principle 2: Balance Precision Against Feasibility]

The standard error decreases as $1 \/ sqrt(bb(E) [D^2])$. Doubling the range of $D$ improves precision by a factor of $sqrt(2)$. In contrast:

- Doubling the number of observations improves precision by $1 \/ sqrt(2)$.
- Doubling the measurement precision (halving $sigma$) improves by a factor of 2.

Thus, expanding the experimental range is often more cost-effective than accumulating many observations in a narrow range.

#strong[Principle 3: Replicate at the Extremes]

If you can only do a limited number of experiments, concentrate replicates (observations at the same condition) at the extremes of your parameter range:

- If your budget allows 10 measurements total, do 5 at the maximum $D$ and 5 at the minimum, rather than spreading uniformly.
- This maximizes the variance of $D$, which directly increases $bb(E) [D^2]$.

#strong[Principle 4: Account for Physical Constraints]

In practice, the range of $D$ is constrained by system physics:

- Electrical circuits have voltage/current limits (may burn out at extreme values).
- Biological systems have survival constraints (very high stress kills the organism).
- Mechanical systems may enter nonlinear regimes at extreme deformations.

Design experiments at the edge of the safe operating region, not at arbitrary extremes.

#strong[Principle 5: Plan for Measurement Precision]

By Theorem M.7.2, the uncertainty in $hat(R)$ depends directly on the measurement noise $sigma$. Before conducting experiments:

- Characterize your measurement device (what is $sigma$?).
- If noise is high, consider:
  - Better instrumentation (reduce $sigma$) to improve identifiability, or
  - Wider experimental range (increase $bb(E) [D^2]$) to compensate
  - More replicates at each condition to average out noise

=== M.7.4 Worked Example: Designing an Optimal Electrical Characterization Experiment
<m.7.4-worked-example-designing-an-optimal-electrical-characterization-experiment>
#strong[Scenario:] You want to estimate the thermal resistance $R_(upright("th"))$ of a power transistor in a switching circuit. The power dissipated is the drive $P$ (in Watts), and the temperature rise $Delta T$ is the behavior.

$ Delta T = R_(upright("th")) times P $

You can apply constant power dissipation for periods of time and measure steady-state temperature rise.

#strong[Naive design (poor):] - Apply powers: 1 W, 2 W, 3 W (narrow range) - Measure temperature once at each level - Measurement uncertainty: $sigma_T = plus.minus 0.5 degree upright("C")$

Fisher information: $I (R_(upright("th"))) prop (1^2 + 2^2 + 3^2) \/ sigma_T^2 = 14 \/ 0.25 = 56$

#strong[Optimized design (better):] - Apply powers: 0.1 W, 5 W (wide range, exploiting safe operating limits) - Measure temperature 3 times at each level (total 6 measurements) - Same measurement uncertainty: $sigma_T = plus.minus 0.5 degree upright("C")$

Fisher information: $I (R_(upright("th"))) prop 3 times (0.1^2 + 5^2) \/ sigma_T^2 = 3 times (0.01 + 25) \/ 0.25 = 3 times 100.04 = 300$

The wide-range experiment provides #strong[5× better precision] than the naive design, despite the same total number of measurements and same measurement quality. This is purely because it exploits the full operational range.

#horizontalrule

== M.7.5 Edge Cases and Counterexamples: When Identifiability Fails
<m.7.5-edge-cases-and-counterexamples-when-identifiability-fails>
=== Edge Case 1: Zero Drive ($D = 0$)
<edge-case-1-zero-drive-d-0>
If the extrinsic drive is zero, the product $B = R times 0 = 0$ regardless of $R$. Even if multiple observations are made with $D = 0$, they all yield $B = 0$, providing no information about $R$.

#strong[Example:] Testing a spring with zero applied force always yields zero displacement, regardless of stiffness.

#strong[Lesson:] Ensure your experimental design includes $D eq.not 0$ observations. Do not solely test at equilibrium or baseline conditions.

=== Edge Case 2: Zero Response ($R = 0$)
<edge-case-2-zero-response-r-0>
If the intrinsic response is zero (e.g., a resistor with $R = 0$, a "superconductor"), then $B = 0 times D = 0$ for any drive. The behavior is always zero, revealing nothing about the drive.

#strong[Example:] A wire with zero resistance dissipates no power regardless of current applied, so observing "power dissipated" would always be zero and would carry no information about current.

#strong[Lesson:] Identifiability can fail if one factor is structurally zero. Diagnostic: if all observations of $B$ are zero, check whether $R$ or $D$ might be zero.

=== Edge Case 3: Constant but Unknown Response ($R = r_0$, $D$ varies)
<edge-case-3-constant-but-unknown-response-r-r_0-d-varies>
#strong[Scenario:] The response is a fixed, unknown constant, and you observe $B = r_0 times D_i$ at varying drives.

#strong[Can you identify $r_0$?] No, unless you know at least one value of $D_i$ precisely.

#strong[Example:] You observe that a system's output changes in direct proportion to input, but you don't know the constant of proportionality or the scale of the input. Suppose observations are $B = [10 \, 20 \, 30]$ at unknown $D = [? \, ? \, ?]$. This could be: - $D = [1 \, 2 \, 3]$ with $R = 10$, or - $D = [2 \, 4 \, 6]$ with $R = 5$, or infinitely many other combinations.

#strong[Resolution:] Measure one drive value directly (Strategy 1), or calibrate by applying a known drive.

=== Edge Case 4: Perfect Correlation Between $R$ and $D$
<edge-case-4-perfect-correlation-between-r-and-d>
#strong[Scenario:] Suppose $R$ and $D$ are not independent. For example, consider a system where high response is always paired with low drive (they are negatively correlated):

$ upright("System property: if ") R upright(" is large, then ") D upright(" is small (and vice versa).") $

Even with multiple observations, if this relationship is maintained, the product $B = R times D$ may not contain enough information to separate them.

#strong[Example:] In a gene-environment system, suppose genes that produce weak phenotypic responses are systematically placed in high-quality environments (compensatory pairing). Then observing individuals with intermediate phenotypes could come from: - Strong gene + weak environment, or - Weak gene + strong environment.

If this correlation is structural and unknown, separation requires breaking the correlation: adopt individuals with random gene-environment pairings, or measure the environment independently.

#strong[Lesson:] Identifiability depends not just on variation, but on #strong[independent variation] of the factors. If $D$ varies only along a specific curve in $(R \, D)$ space, identifiability can fail even with abundant observations.

=== Edge Case 5: Nonlinear Product Structure
<edge-case-5-nonlinear-product-structure>
Suppose the true relationship is #strong[nonlinear];: $B = R times D^2$ (drive effects are quadratic), not linear.

#strong[Observed data:] $B = [10 \, 40 \, 90]$ for $D = [1 \, 2 \, 3]$.

#strong[Naive linear regression] (assuming $B = R times D$) would estimate $hat(R) approx 30$, which doesn't fit the data well.

#strong[Truth:] $B = R times D^2$ with $R = 10$, $D = [1 \, 2 \, 3]$ gives $B = [10 \, 40 \, 90]$ perfectly.

#strong[Lesson:] The form of the product structure must be correct. If the true relationship is nonlinear and you assume linearity, identification fails. This requires either prior knowledge of the functional form or auxiliary experiments to distinguish $R times D$ from $R times D^2$ from other models.

=== Edge Case 6: Unobserved Confounding
<edge-case-6-unobserved-confounding>
#strong[Scenario:] The observed behavior is influenced by a third, unobserved factor $C$ not included in the model:

$ B = R times D + C $

(The true behavior is not a pure product.)

#strong[Problem:] All attempts to estimate $R$ from variation in $D$ will be confounded by unobserved changes in $C$. The estimation error can be arbitrarily large.

#strong[Example:] Studying income = Skill × Market, but ignoring social connections (nepotism), which also affects income.

#strong[Resolution:] Either measure or control for the confounder. This requires domain knowledge and is often the hardest part of real-world causal inference.

#strong[Lesson:] The product structure $B = R times D$ must be complete. If other factors contribute to $B$, they must be explicitly included in the model.

#horizontalrule

== M.8 Summary: Conditions for Experimental Resolution
<m.8-summary-conditions-for-experimental-resolution>
#strong[Theorem M.8.1 (Necessary and Sufficient Conditions for Identifiability):]

Given a system with product structure $B = R times D$, the parameters $R$ and $D$ are #strong[identifiable] (uniquely or statistically) if and only if #strong[at least one of the following holds];:

+ #strong[Direct Measurement:] One of $R$ or $D$ is measured independently.
+ #strong[Controlled Variation:] One factor (say $D$) is varied across $N gt.eq 2$ distinct, known values while the other ($R$) is held constant, and the corresponding behaviors $B_1 \, dots.h \, B_N$ are observed.
+ #strong[Replication:] Two or more systems are available that differ in exactly one of $R$ or $D$ (with the differing factor either measured or known to differ by a known amount), subject to the same extrinsic drive.
+ #strong[Structural Constraints:] There exists prior information that breaks the gauge symmetry (e.g., one factor is constrained to lie in a specified range, or a nonlinear relation exists between $R$ and $D$).

#emph[Proof sketch:] Necessity: Without any of these, we remain in the situation of Theorem M.2.8 (fundamental underdetermination). Sufficiency: Each condition breaks the gauge freedom either by fixing one factor (condition 1), by introducing parameter variation (conditions 2-3), or by imposing constraints (condition 4). □

#horizontalrule

#emph[--- END OF APPENDIX M ---]

= Appendix N: Functional Analysis Foundations
<appendix-n-functional-analysis-foundations>
== N.1 Hilbert Spaces: The Rigorous Framework for PDEs
<n.1-hilbert-spaces-the-rigorous-framework-for-pdes>
=== Definition and Examples
<definition-and-examples>
#strong[Definition N.1.1:] A #strong[Hilbert space] is a complete inner product space over $bb(R)$ (or $bb(C)$). That is:

+ $H$ is a vector space
+ $H$ has an inner product $angle.l dot.op \, dot.op angle.r : H times H arrow.r bb(R)$ satisfying:
  - Linearity in second argument: $angle.l u \, a v + b w angle.r = a angle.l u \, v angle.r + b angle.l u \, w angle.r$
  - Symmetry: $angle.l u \, v angle.r = angle.l v \, u angle.r$
  - Positive definiteness: $angle.l u \, u angle.r gt.eq 0$, with equality iff $u = 0$
+ The norm $parallel u parallel = sqrt(angle.l u \, u angle.r)$ makes $H$ a complete metric space (Cauchy sequences converge)

#strong[Examples:]

+ #strong[$bb(R)^n$:] Finite-dimensional Hilbert space with $angle.l u \, v angle.r = sum_(i = 1)^n u_i v_i$.

+ #strong[$ell^2 (bb(N))$ --- Square-summable sequences:] $ ell^2 (bb(N)) = {(u_1 \, u_2 \, u_3 \, dots.h) : sum_(n = 1)^oo lr(|u_n|)^2 < oo} $ Inner product: $angle.l u \, v angle.r = sum_(n = 1)^oo u_n v_n$.

+ #strong[$L^2 (Omega)$ --- Square-integrable functions:] For a spatial domain $Omega subset.eq bb(R)^d$, $ L^2 (Omega) = {u : Omega arrow.r bb(R) : integral_Omega u (x)^2 thin d x < oo} $ Inner product: $angle.l u \, v angle.r = integral_Omega u (x) v (x) thin d x$. Norm: $parallel u parallel_(L^2) = sqrt(integral_Omega u (x)^2 thin d x)$.

#strong[Key Property:] In a Hilbert space, we can define #strong[orthogonality];: $u perp v$ iff $angle.l u \, v angle.r = 0$. This geometric concept extends the orthogonality of vectors in $bb(R)^3$ to infinite-dimensional spaces.

=== Completeness and Orthonormal Bases
<completeness-and-orthonormal-bases>
#strong[Theorem N.1.2 (Riesz Representation):] Let $H$ be a Hilbert space and $phi.alt : H arrow.r bb(R)$ be a bounded linear functional. Then there exists a unique $f in H$ such that

$ phi.alt (u) = angle.l u \, f angle.r quad upright("for all ") u in H $

#emph[Proof:] Classical result in functional analysis. The proof uses the orthogonal complement and the Cauchy-Schwarz inequality. □

#strong[Definition N.1.3:] A sequence ${ phi.alt_n }_(n = 1)^oo$ in $H$ is #strong[orthonormal] if: $ angle.l phi.alt_n \, phi.alt_m angle.r = delta_(n m) = cases(delim: "{", 1 & upright("if ") n = m, 0 & upright("if ") n eq.not m) $

#strong[Theorem N.1.4 (Parseval Identity):] If ${ phi.alt_n }$ is an orthonormal basis for $H$, then every $u in H$ can be written uniquely as

$ u = sum_(n = 1)^oo c_n phi.alt_n \, quad c_n = angle.l u \, phi.alt_n angle.r $

and the norm is given by

$ parallel u parallel^2 = sum_(n = 1)^oo lr(|c_n|)^2 $

#emph[Proof:] Follows from the definition of orthonormal basis and completeness of $H$. □

#strong[Example:] The eigenfunctions ${ sin (n pi x) }_(n = 1)^oo$ form an orthonormal basis for $L^2 ([0 \, 1])$ (after normalization). Any function $u in L^2 ([0 \, 1])$ can be written as a Fourier sine series:

$ u (x) = sum_(n = 1)^oo c_n sin (n pi x) \, quad c_n = integral_0^1 u (x) sin (n pi x) thin d x $

#horizontalrule

== N.2 Sobolev Spaces: Weak Derivatives and Regularity
<n.2-sobolev-spaces-weak-derivatives-and-regularity>
#strong[Definition N.2.1:] The #strong[Sobolev space $H^1 (Omega)$] consists of functions in $L^2 (Omega)$ whose weak derivative is also in $L^2 (Omega)$:

$ H^1 (Omega) = {u in L^2 (Omega) : frac(partial u, partial x_i) in L^2 (Omega) upright(" for all ") i = 1 \, dots.h \, d} $

where derivatives are understood in the #strong[weak sense] (via integration by parts).

#strong[Inner product and norm:] $ angle.l u \, v angle.r_(H^1) = integral_Omega (u v + nabla u dot.op nabla v) thin d x $

$ parallel u parallel_(H^1) = sqrt(integral_Omega (u^2 + lr(|nabla u|)^2) thin d x) $

#strong[Why Sobolev spaces matter:] Many PDEs (particularly elliptic and parabolic equations) don't have classical smooth solutions, but they do have solutions in Sobolev spaces. This allows rigorous analysis of weak solutions.

#strong[Example (Poisson Equation):] The equation $- Delta u = f$ with $u \|_(partial Omega) = 0$ may not have a twice-differentiable solution, but it has a unique solution in $H_0^1 (Omega)$ (Sobolev space with zero boundary values) for any $f in L^2 (Omega)$.

#horizontalrule

== N.3 Unbounded Linear Operators and Their Properties
<n.3-unbounded-linear-operators-and-their-properties>
=== Domains and Boundedness
<domains-and-boundedness>
#strong[Definition N.3.1:] A #strong[linear operator] on $H$ is a map $upright(bold(A)) : D (upright(bold(A))) subset H arrow.r H$ where $D (upright(bold(A)))$ (the #strong[domain];) is a linear subspace.

An operator $upright(bold(A))$ is #strong[bounded] if there exists a constant $M$ such that

$ parallel upright(bold(A)) u parallel lt.eq M parallel u parallel quad upright("for all ") u in D (upright(bold(A))) $

For PDEs, the relevant operators (like $- Delta$) are typically #strong[unbounded];, meaning no such $M$ exists. This is why careful treatment of domains is essential.

=== Self-Adjoint Operators
<self-adjoint-operators>
#strong[Definition N.3.2:] An operator $upright(bold(A))$ with domain $D (upright(bold(A)))$ is #strong[self-adjoint] if:

+ $D (upright(bold(A))^(\*)) = D (upright(bold(A)))$ (the domain of the adjoint equals the domain of $upright(bold(A))$)
+ $upright(bold(A))^(\*) = upright(bold(A))$ (the adjoint is equal to $upright(bold(A))$)

Equivalently: $ angle.l upright(bold(A)) u \, v angle.r = angle.l u \, upright(bold(A)) v angle.r quad upright("for all ") u \, v in D (upright(bold(A))) $

#strong[Theorem N.3.3 (The Laplacian is Self-Adjoint):] The operator $- Delta$ on $L^2 (Omega)$ with Dirichlet boundary conditions (i.e., defined on $H_0^1 (Omega)$) is self-adjoint.

#emph[Proof sketch:] Integration by parts shows symmetry: $ angle.l - Delta u \, v angle.r = integral_Omega (- Delta u) v thin d x = integral_Omega nabla u dot.op nabla v thin d x = integral_Omega u (- Delta v) thin d x = angle.l u \, - Delta v angle.r $

The boundary terms vanish because $u \, v$ have zero boundary values. The domain condition follows from the elliptic regularity of the Laplacian. □

#strong[Why self-adjointness matters:] Self-adjoint operators have real eigenvalues and orthogonal eigenfunctions, making spectral theory available.

#horizontalrule

== N.4 Spectral Theory and Eigenvalue Problems
<n.4-spectral-theory-and-eigenvalue-problems>
=== The Eigenvalue Problem
<the-eigenvalue-problem>
#strong[Definition N.4.1:] For a linear operator $upright(bold(A))$ on $H$, the #strong[eigenvalue problem] is to find pairs $(lambda \, phi.alt)$ such that

$ upright(bold(A)) phi.alt = lambda phi.alt \, quad phi.alt eq.not 0 $

The #strong[spectrum] of $upright(bold(A))$ is the set $sigma (upright(bold(A))) = { lambda in bb(C) : upright(bold(A)) - lambda I upright(" is not invertible") }$.

=== Spectral Theorem for Self-Adjoint Operators
<spectral-theorem-for-self-adjoint-operators>
#strong[Theorem N.4.2 (Spectral Theorem):] Let $upright(bold(A))$ be a self-adjoint operator on $H$. Then:

+ #strong[All eigenvalues are real:] If $upright(bold(A)) phi.alt_n = lambda_n phi.alt_n$, then $lambda_n in bb(R)$.

+ #strong[Eigenfunctions are orthogonal:] If $phi.alt_n$ and $phi.alt_m$ are eigenfunctions with eigenvalues $lambda_n eq.not lambda_m$, then $angle.l phi.alt_n \, phi.alt_m angle.r = 0$.

+ #strong[Complete orthonormal basis:] The eigenfunctions ${ phi.alt_n }$ form a complete orthonormal basis for $H$ (possibly infinite-dimensional).

+ #strong[Diagonal representation:] Every $u in H$ can be written as $ u = sum_n c_n phi.alt_n \, quad c_n = angle.l u \, phi.alt_n angle.r $ and $ upright(bold(A)) u = sum_n lambda_n c_n phi.alt_n $

#emph[Proof:] Classical result @Reed_Simon_1980. □

#strong[Example (Laplacian on $[0 \, 1]$):] The operator $- frac(d^2, d x^2)$ on $H_0^1 ([0 \, 1])$ has: - #strong[Eigenvalues:] $lambda_n = n^2 pi^2$ for $n = 1 \, 2 \, 3 \, dots.h$ - #strong[Eigenfunctions:] $phi.alt_n (x) = sin (n pi x)$ - These form an orthonormal basis for $L^2 ([0 \, 1])$

#horizontalrule

== N.5 Evolution Equations and Well-Posedness
<n.5-evolution-equations-and-well-posedness>
=== The Abstract Cauchy Problem
<the-abstract-cauchy-problem>
Consider the abstract evolution equation

$ frac(d upright(bold(u)), d t) = upright(bold(A)) upright(bold(u)) + upright(bold(S)) (t) \, quad upright(bold(u)) (0) = upright(bold(u))_0 $

where $upright(bold(A))$ is a linear operator on Hilbert space $H$ and $upright(bold(S)) (t)$ is an external forcing.

=== C₀-Semigroups and Generators
<c₀-semigroups-and-generators>
#strong[Definition N.5.1:] A #strong[$C_0$-semigroup] on $H$ is a family ${ T (t) }_(t gt.eq 0)$ of bounded linear operators satisfying:

+ $T (0) = I$ (identity operator)
+ $T (t + s) = T (t) T (s)$ (semigroup property)
+ $T (t) u arrow.r u$ as $t arrow.r 0^(+)$ for each $u in H$ (strong continuity)

The #strong[infinitesimal generator] of a $C_0$-semigroup is the operator

$ upright(bold(A)) u = lim_(t arrow.r 0^(+)) frac(T (t) u - u, t) $

defined on the set of $u$ for which this limit exists.

=== The Hille-Yosida Theorem
<the-hille-yosida-theorem>
#strong[Theorem N.5.2 (Hille-Yosida):] A densely-defined linear operator $upright(bold(A))$ on $H$ is the infinitesimal generator of a $C_0$-semigroup if and only if:

+ $upright(bold(A))$ is closed (its graph is closed)
+ There exist constants $M gt.eq 1$ and $omega in bb(R)$ such that for all $lambda > omega$: $ parallel (lambda I - upright(bold(A)))^(- n) parallel lt.eq M / (lambda - omega)^n quad upright("for all ") n in bb(N) $

#emph[Proof:] Deep theorem in functional analysis; see Pazy (1983) or Evans (2010). □

#strong[Consequence:] If $upright(bold(A))$ satisfies these conditions, the evolution equation has a unique mild solution

$ upright(bold(u)) (t) = T (t) upright(bold(u))_0 + integral_0^t T (t - s) upright(bold(S)) (s) thin d s $

that depends continuously on initial data $upright(bold(u))_0$ and forcing $upright(bold(S))$.

=== Application: Heat Equation
<application-heat-equation>
#strong[Theorem N.5.3 (Well-Posedness of Heat Equation):] The heat equation

$ frac(partial u, partial t) = alpha Delta u + f (x \, t) \, quad u (x \, 0) = u_0 (x) \, quad u \|_(partial Omega) = 0 $

with $alpha > 0$ has a #strong[unique global solution] in $C (\[ 0 \, oo) ; L^2 (Omega) \)$ for any $u_0 in L^2 (Omega)$ and $f in L^oo (\[ 0 \, oo) ; L^2 (Omega) \)$.

The solution is given by

$ u (x \, t) = sum_(n = 1)^oo e^(- alpha lambda_n t) angle.l u_0 \, phi.alt_n angle.r phi.alt_n (x) + integral_0^t sum_(n = 1)^oo e^(- alpha lambda_n (t - s)) angle.l f (dot.op \, s) \, phi.alt_n angle.r phi.alt_n (x) thin d s $

where $lambda_n$ and $phi.alt_n$ are the eigenvalues and eigenfunctions of $- Delta$ on $Omega$.

#emph[Proof:] The heat operator $upright(bold(A)) = alpha Delta$ with Dirichlet boundary conditions satisfies the Hille-Yosida conditions (eigenvalues are negative, decaying exponentially), so it generates a $C_0$-semigroup. □

#horizontalrule

== N.6 Application to PDEs: From Weak to Classical Solutions
<n.6-application-to-pdes-from-weak-to-classical-solutions>
=== Weak and Strong Solutions
<weak-and-strong-solutions>
For a PDE like $frac(partial u, partial t) - Delta u = f$, a #strong[weak solution] $u in L^2 ([0 \, T] ; H^1 (Omega))$ is a function satisfying

$ integral_0^T integral_Omega u_t v + nabla u dot.op nabla v thin d x thin d t = integral_0^T integral_Omega f v thin d x thin d t $

for all test functions $v$.

A #strong[classical solution] is a function $u (x \, t)$ twice differentiable in space and once in time.

#strong[Theorem N.6.1 (Regularity):] If $f$ is sufficiently smooth and initial conditions are compatible with the boundary conditions, weak solutions become classical solutions. The specific regularity depends on the domain and data.

#emph[Proof:] Follows from elliptic regularity theory. For the heat equation, any weak solution is actually classical. For other PDEs (like wave equations), additional regularity conditions are needed. □

#horizontalrule

== N.7 Summary: Grounding PDEs Mathematically
<n.7-summary-grounding-pdes-mathematically>
The functional analysis framework provides:

✓ #strong[Rigorous existence and uniqueness] of solutions via the Hille-Yosida theorem ✓ #strong[Continuous dependence] on initial data (well-posedness in the Hadamard sense) ✓ #strong[Spectral characterization] of long-time behavior via eigenvalues ✓ #strong[Infinite-dimensional phase space] in which PDEs are ordinary evolution equations ✓ #strong[Weak solutions] that exist even when classical solutions don't

This is why Part VIII can formally state: "A PDE #strong[is] an ODE on an infinite-dimensional manifold." The functional analysis makes this statement rigorous, not merely poetic.

#horizontalrule

#emph[--- END OF APPENDIX N ---]

= Appendix O: Standardized Notation
<appendix-o-standardized-notation>
== O.1 Time Constants: Consistent Subscript Notation
<o.1-time-constants-consistent-subscript-notation>
Throughout this document, time constants (τ) characterize the speed of exponential approach to steady state. To avoid ambiguity with mechanical torque, we standardize notation as follows:

#table(
  columns: (25%, 25%, 25%, 25%),
  align: (left,left,left,left,),
  table.header([System Type], [Time Constant], [Definition], [Example Equation],),
  table.hline(),
  [#strong[RC Electrical];], [$tau_(R C)$], [$R C$], [$V_C (t) = V_oo (1 - e^(- t \/ tau_(R C)))$],
  [#strong[RL Electrical];], [$tau_L$], [$L \/ R$], [$I (t) = I_oo (1 - e^(- t \/ tau_L))$],
  [#strong[Mechanical];], [$tau_m$], [$m \/ b$ (mass/damping)], [$v (t) = v_oo (1 - e^(- t \/ tau_m))$],
  [#strong[Thermal];], [$tau_(t h)$], [$R_(t h) C_(t h)$ (thermal R × C)], [$T (t) = T_oo (1 - e^(- t \/ tau_(t h)))$],
  [#strong[Hydraulic];], [$tau_h$], [$R_h C_h$ (restriction × compliance)], [$p (t) = p_oo (1 - e^(- t \/ tau_h))$],
  [#strong[Mechanical Torque];], [$tau$ (unsubscripted)], [Torque (effort variable) \[N·m\]], [$P = tau omega$ (power)],
)
#strong[Key principle:] The unsubscripted $tau$ refers exclusively to #strong[torque] in mechanical rotation. When discussing time constants, subscripts always appear to disambiguate the domain and prevent confusion.

=== Application to Cross-Domain Analogies
<application-to-cross-domain-analogies>
When showing that different domains obey identical mathematics, time constants are related by analogy:

#strong[Example 1 --- RC Electrical and Thermal:] $ tau_(R C) = R C quad arrow.l.r quad tau_(t h) = R_(t h) C_(t h) $

Both exhibit first-order exponential response with mathematically identical form.

#strong[Example 2 --- Mechanical First-Order:] $ tau_m = m / b quad arrow.l.r quad tau_(R C) = R C $

Under the force-voltage analogy ($F arrow.l.r V$), the mechanical damping timescale corresponds to the electrical RC timescale.

== O.2 Damping Coefficient Notation
<o.2-damping-coefficient-notation>
Two or more symbols are used for damping-related quantities, depending on context:

#table(
  columns: (20%, 20%, 20%, 20%, 20%),
  align: (left,left,left,left,left,),
  table.header([Notation], [Physical Meaning], [Domain], [Unit], [Role],),
  table.hline(),
  [$b$], [Viscous damping coefficient], [Mechanical], [\[N·s/m\] or \[kg/s\]], [Force dissipation: $F = - b v$],
  [$c$ or $zeta$], [Damping ratio (dimensionless)], [Control/Analysis], [\[dimensionless\]], [Characterizes oscillation: $zeta = b \/ (2 sqrt(k m))$],
  [$R$], [Resistance], [Electrical], [\[Ω\]], [Dissipates power: $P = I^2 R$],
  [$R_h$], [Restriction], [Hydraulic], [\[Pa·s/m³\]], [Pressure drop: $Delta p = R_h Q$],
)
#strong[Standardization in this document:] We use $b$ exclusively for mechanical viscous damping and $R$ for electrical/hydraulic dissipation (following power-conjugate convention). The dimensionless damping ratio is denoted $zeta$:

- Mechanical: $zeta = frac(b, 2 sqrt(k m))$
- Electrical: $zeta = R / 2 sqrt(C / L)$
- Universal form: $zeta = frac(upright("(damping element value)"), 2 sqrt(upright("(inertance)") times upright("(stiffness)")))$

== O.3 State Variables and Effort-Flow Pairs
<o.3-state-variables-and-effort-flow-pairs>
The bond-graph framework identifies power-conjugate pairs across domains:

#table(
  columns: (20%, 20%, 20%, 20%, 20%),
  align: (left,left,left,left,left,),
  table.header([Domain], [#strong[Effort];], [#strong[Flow];], [#strong[Power];], [#strong[Storage Elements];],),
  table.hline(),
  [#strong[Electrical];], [Voltage $V$ \[V\]], [Current $I$ \[A\]], [$P = V I$], [$L$ (inductance), $C$ (capacitance)],
  [#strong[Mechanical];], [Force $F$ \[N\]], [Velocity $v$ \[m/s\]], [$P = F v$], [$m$ (mass), $k$ (spring)],
  [#strong[Mechanical (rotation)];], [Torque $tau$ \[N·m\]], [Angular velocity $omega$ \[rad/s\]], [$P = tau omega$], [$J$ (inertia), $k_theta$ (torsional spring)],
  [#strong[Thermal];], [Temperature $T$ \[K\]], [Entropy flow rate $dot(S)$ \[J/(K·s)\]], [$P = T dot(S)$], [Thermal capacity],
  [#strong[Hydraulic];], [Pressure $p$ \[Pa\]], [Flow rate $Q$ \[m³/s\]], [$P = p Q$], [$I_h$ (inertance), $C_h$ (compliance)],
)
#strong[Central principle:] The product of effort and flow in #strong[any domain] equals power. This universality enables rigorous cross-domain analogies.

== O.4 Subscript Conventions for Clarity
<o.4-subscript-conventions-for-clarity>
To keep notation concise while preventing ambiguity:

- #strong[Single-letter subscripts] (e.g., $tau_m$, $tau_h$, $tau_L$): Domain or element abbreviation
  - $m$ = mechanical, $h$ = hydraulic, $L$ = inductive/RL circuit, $t h$ = thermal, $R C$ = capacitive/RC circuit
- #strong[Text subscripts] (e.g., $tau_(upright("amb"))$, $V_(upright("source"))$): External parameter or physical meaning
  - $upright("amb")$ = ambient condition, $upright("source")$ = external source, $upright("drive")$ = extrinsic input
- #strong[Component identity] (e.g., $C_h$, $R_h$, $I_h$): Specifies which domain
  - Hydraulic capacitance $C_h$, hydraulic resistance $R_h$, hydraulic inertance $I_h$
- #strong[Universal parameters] (e.g., $zeta$, $omega_0$): Domain-independent, same meaning everywhere
  - Damping ratio $zeta$ and natural frequency $omega_0$ are defined identically in mechanical, electrical, and hydraulic systems

== O.5 Summary: Preventing Notation Ambiguity
<o.5-summary-preventing-notation-ambiguity>
Three main sources of confusion in dynamical systems notation, and how we resolve them:

#table(
  columns: (33.33%, 33.33%, 33.33%),
  align: (left,left,left,),
  table.header([Issue], [#strong[Problem];], [#strong[Solution];],),
  table.hline(),
  [$tau$ ambiguity], [Could mean torque OR time constant], [Use $tau$ for #strong[torque only];; use $tau_(upright("domain"))$ for time constants],
  [Damping notation], [Could be $b$, $c$, $zeta$, $R$, $alpha$…], [Use $b$ for mechanical, $R$ for electrical/hydraulic; $zeta$ for ratio],
  [Effort-flow confusion], [What is "effort" vs "flow" in a given domain?], [See Table O.3: Effort × Flow = Power in every domain],
  [Domain-specific vs universal], [Are these parameters local or global?], [Domain-specific: $tau_m \, tau_(R C) \, R_h$; Universal: $zeta \, omega_0$],
)
By adhering to these conventions throughout this document, equations remain unambiguous and the universality of cross-domain analogies becomes transparent.

#horizontalrule

= Appendix A: Foundations --- Force, Source, and Field
<appendix-a-foundations-force-source-and-field>
\[Original Appendix A content - see existing file\]

#horizontalrule

= References
<references>
== Foundational Dynamical Systems Theory
<foundational-dynamical-systems-theory>
/ Perko, L. (2001). #emph[Differential Equations and Dynamical Systems] (3rd ed.). Springer.: #block[
Rigorous treatment of ODEs, phase portraits, bifurcations, and dynamical systems theory.
]

/ Strogatz, S. H. (2014). #emph[Nonlinear Dynamics and Chaos\: With Applications to Physics, Biology, Chemistry, and Engineering] (2nd ed.). CRC Press.: #block[
Highly accessible introduction to bifurcations, chaos, and limit cycles.
]

/ Wiggins, S. (2003). #emph[Introduction to Applied Nonlinear Dynamical Systems and Chaos] (2nd ed.). Springer.: #block[
Comprehensive treatment of normal forms, bifurcations, and chaotic dynamics.
]

/ Kuznetsov, Y. A. (2004). #emph[Elements of Applied Bifurcation Theory] (3rd ed.). Springer.: #block[
Advanced reference on bifurcation theory and normal forms.
]

/ Arnold, V. I. (1983). #emph[Geometrical Methods in the Theory of Ordinary Differential Equations] (2nd ed.). Springer.: #block[
Geometric perspective on dynamical systems; rigorous mathematical foundations.
]

#horizontalrule

== Control Theory and Feedback Systems
<control-theory-and-feedback-systems>
/ Ogata, K. (2009). #emph[Modern Control Engineering] (5th ed.). Prentice Hall.: #block[
Standard textbook on state-space methods, pole placement, and classical control.
]

/ Kirk, D. E. (2012). #emph[Optimal Control Theory\: An Introduction] (2nd ed.). Dover Publications.: #block[
Rigorous treatment of optimal control, LQR, Pontryagin's maximum principle.
]

/ Zhou, K., Doyle, J. C., & Glover, K. (1996). #emph[Robust and Optimal Control];. Prentice Hall.: #block[
Advanced control theory; robust control and H-infinity methods.
]

/ Khalil, H. K. (2014). #emph[Nonlinear Systems] (3rd ed.). Prentice Hall.: #block[
Authoritative text on nonlinear control, Lyapunov stability, and passivity.
]

/ Åström, K. J., & Murray, R. M. (2008). #emph[Feedback Systems\: An Introduction for Scientists and Engineers];. Princeton University Press.: #block[
Modern perspective on feedback; excellent pedagogy and applications.
]

#horizontalrule

== Bond Graphs and Cross-Domain Analogies
<bond-graphs-and-cross-domain-analogies>
/ Paynter, H. M. (1961). #emph[Analysis and Design of Engineering Systems];. MIT Press.: #block[
Foundational work introducing bond-graph methodology for multi-domain systems.
]

/ Karnopp, D. C., Margolis, D. L., & Rosenberg, R. C. (2012). #emph[System Dynamics\: Modeling, Simulation, and Control of Mechatronic Systems] (5th ed.). Wiley.: #block[
Comprehensive treatment of bond graphs, analogies, and multi-domain modeling.
]

/ Gawthrop, P. J., & Bevan, G. P. (2007). Bond graph modeling and simulation. In #emph[Proceedings of the 11th IEEE Mediterranean Conference on Control and Automation] (pp.~1--6).: #block[
Modern bond-graph framework for complex systems.
]

/ Thoma, J. U., & Bouamama, B. O. (2010). #emph[Modelling and Simulation in Thermal and Chemical Engineering\: A Bond Graph Approach];. Springer.: #block[
Application of bond graphs to thermal and chemical systems.
]

#horizontalrule

== Functional Analysis and PDEs
<functional-analysis-and-pdes>
/ Rudin, W. (1987). #emph[Real and Complex Analysis] (3rd ed.). McGraw-Hill.: #block[
Rigorous foundations of functional analysis and measure theory.
]

/ Reed, M., & Simon, B. (1980). #emph[Functional Analysis] (Vol. 1 of Methods of Modern Mathematical Physics). Academic Press.: #block[
Complete treatment of Hilbert spaces, operators, and spectral theory.
]

/ Evans, L. C. (2010). #emph[Partial Differential Equations] (2nd ed.). American Mathematical Society.: #block[
Comprehensive PDE theory; elliptic, parabolic, hyperbolic equations.
]

/ Folland, G. B. (1999). #emph[Real Analysis\: Modern Techniques and Their Applications] (2nd ed.). Wiley.: #block[
Rigorous real analysis underlying PDE theory.
]

/ Henry, D. B. (1981). #emph[Geometric Theory of Semilinear Parabolic Equations];. Springer.: #block[
Advanced theory of evolution equations and PDEs on Hilbert spaces.
]

#horizontalrule

== System Identification and Identifiability
<system-identification-and-identifiability>
/ Ljung, L. (1999). #emph[System Identification\: Theory for the User] (2nd ed.). Prentice Hall.: #block[
Standard reference on system identification, estimation, and validation.
]

/ Söderström, T., & Stoica, P. (1989). #emph[System Identification];. Prentice Hall.: #block[
Comprehensive treatment of identification methods, bias, and asymptotic properties.
]

/ Walter, E., & Pronzato, L. (1997). #emph[Identification of Parametric Models from Experimental Data];. Springer.: #block[
Focus on parameter identifiability and optimal experimental design.
]

/ Bellman, R., & Åström, K. J. (1970). On structural identifiability. #emph[Mathematical Biosciences];, 7(3-4), 329--339.: #block[
Foundational paper on structural identifiability (when decomposition is possible).
]

#horizontalrule

== Information Theory and Statistics
<information-theory-and-statistics>
/ Cover, T. M., & Thomas, J. A. (2006). #emph[Elements of Information Theory] (2nd ed.). Wiley.: #block[
Complete treatment of entropy, mutual information, and KL divergence.
]

/ Kullback, S., & Leibler, R. A. (1951). On information and sufficiency. #emph[Annals of Mathematical Statistics];, 22(1), 79--86.: #block[
Foundational paper introducing KL divergence for measuring probability divergence.
]

/ Fisher, R. A. (1925). Theory of statistical estimation. #emph[Proceedings of the Cambridge Philosophical Society];, 22(5), 700--725.: #block[
Foundational paper on Fisher Information and estimation theory.
]

/ Cramér, H. (1946). #emph[Mathematical Methods of Statistics];. Princeton University Press.: #block[
Rigorous foundations of mathematical statistics; Cramér-Rao bound.
]

#horizontalrule

== Mechanical and Electrical Engineering Applications
<mechanical-and-electrical-engineering-applications>
/ Norton, R. L. (2008). #emph[Design of Machinery\: An Introduction to the Synthesis and Analysis of Mechanisms and Machines] (5th ed.). McGraw-Hill.: #block[
Mechanical system design; kinematics and dynamics.
]

/ Nilsson, J. W., & Riedel, S. A. (2015). #emph[Electric Circuits] (10th ed.). Pearson.: #block[
Comprehensive treatment of circuits, transient response, resonance.
]

/ Dorf, R. C., & Bishop, R. H. (2010). #emph[Modern Control Systems] (12th ed.). Prentice Hall.: #block[
Applications of control theory to practical systems.
]

/ Sontag, E. D. (1990). Mathematical control theory\: Deterministic finite-dimensional systems (Vol. 6 of Texts in Applied Mathematics). Springer.: #block[
Rigorous mathematical treatment of control systems.
]

#horizontalrule

== Thermal Systems and Heat Transfer
<thermal-systems-and-heat-transfer>
/ Incropera, F. P., DeWitt, D. P., Bergman, T. L., & Lavine, A. S. (2006). #emph[Fundamentals of Heat and Mass Transfer] (6th ed.). Wiley.: #block[
Comprehensive treatment of conduction, convection, radiation; thermal networks.
]

/ Çengel, Y. A., & Boles, M. A. (2014). #emph[Thermodynamics\: An Engineering Approach] (8th ed.). McGraw-Hill.: #block[
Energy conservation and thermal systems.
]

#horizontalrule

== Hydraulic and Fluid Systems
<hydraulic-and-fluid-systems>
/ Backé, W. (1994). The present and future of fluid power. #emph[Proceedings of the Institution of Mechanical Engineers, Part I\: Journal of Systems and Control Engineering];, 208(3), 193--212.: #block[
Overview of hydraulic system principles and applications.
]

/ Merritt, H. E. (1967). #emph[Hydraulic Control Systems];. Wiley.: #block[
Foundational text on hydraulic system dynamics and control.
]

#horizontalrule

== Chaos Theory and Nonlinear Dynamics
<chaos-theory-and-nonlinear-dynamics>
/ Lorenz, E. N. (1963). Deterministic nonperiodic flow. #emph[Journal of the Atmospheric Sciences];, 20(2), 130--141.: #block[
Seminal paper introducing the Lorenz attractor and deterministic chaos.
]

/ Lyapunov, A. M. (1892). The general problem of the stability of motion. #emph[International Journal of Control];, 55(3), 531--534 (1992 translation).: #block[
Foundational paper on Lyapunov stability and exponents.
]

/ Kaplan, J. L., & Yorke, J. A. (1979). Chaotic behavior of multidimensional difference equations. In #emph[Functional Differential Equations and Approximation of Fixed Points] (pp.~204--227). Springer.: #block[
Introduces Kaplan-Yorke dimension for characterizing fractals.
]

#horizontalrule

== History and Philosophy of Science
<history-and-philosophy-of-science>
/ Kuhn, T. S. (1962). #emph[The Structure of Scientific Revolutions] (3rd ed.). University of Chicago Press.: #block[
Framework for understanding paradigm shifts; relevance to unifying different domains.
]

/ Einstein, A. (1905). Zur elektrodynamik bewegter körper. #emph[Annalen der Physik];, 17(10), 891--921.: #block[
Special relativity; example of unified framework reconciling mechanics and electromagnetism.
]

#horizontalrule

== Cross-Domain Analogies: Historical Perspective
<cross-domain-analogies-historical-perspective>
/ Paynter, H. M. (1991). An epistemic prehistory of bond graphs. In #emph[Proceedings of the International Conference on Bond Graph Modeling and Simulation] (pp.~23--42).: #block[
Historical development of unified multi-domain modeling.
]

/ MacKay, D. J. C. (2003). #emph[Information Theory, Inference, and Learning Algorithms];. Cambridge University Press.: #block[
Unifying information-theoretic perspective across domains.
]

#horizontalrule

== Selected Recent Applications
<selected-recent-applications>
/ Sinha, S., & Ramamoorthy, B. (2016). A comparative study on power electronic converters using bond graph approach. #emph[Proceedings of the Indian National Science Academy];, 82(4), 823--835.: #block[
Modern bond graph application to power systems.
]

/ Tronconi, E., & Groppi, G. (2014). Catalytic combustors for high-temperature and high-pressure applications. #emph[Catalysis Reviews---Science and Engineering];, 56(2), 152--188.: #block[
Multi-domain system with thermal, kinetic, and fluid dynamics coupling.
]

#horizontalrule

= Part XVI: Synthesis and Future Directions
<part-xvi-synthesis-and-future-directions>
== XVI.1 What We Have Accomplished
<xvi.1-what-we-have-accomplished>
Over fifteen parts, we have built a unified framework for understanding change, pattern, and causality across domains.

#strong[The journey:]

We began (Parts I-II) with the observation that observable phenomena arise from the product of intrinsic and extrinsic factors---forces emerge from fields acting on properties. We systematized this insight (Parts III-V) by identifying three universal energy modes (potential, kinetic, dissipative) and revealing that analogies between mechanical, electrical, thermal, and hydraulic systems are not accidents but necessities.

We formalized the mathematical structure (Parts VI-X) through conservation laws, constitutive relations, and power conjugacy. We then revealed (Part XI) that even the universe's most fundamental forces---gravity and electromagnetism---obey identical mathematical forms. This was not a heuristic analogy but proof that the universality extends to the bedrock of physics.

We proved (Part XII) that these analogies are logical necessities, not conveniences, through bond graphs and effort-flow formalism. We showed (Part XIII) that feedback control is not external manipulation but a designed blurring of the intrinsic-extrinsic boundary. We studied (Part XIV) how systems undergo qualitative transitions via bifurcations. And (Part XV) we honestly confronted the framework's limitations.

#strong[Accomplishments achieved:]

+ #strong[Mathematical unification:] All linear, time-invariant systems across domains obey the same differential equations, differing only in parameter names.

+ #strong[Gravitoelectromagnetism revealed:] Gravity and electromagnetism are structurally identical in the weak-field limit, with experimental validation spanning 50 years.

+ #strong[Causal ambiguity made explicit:] We proved that observable behavior alone cannot resolve intrinsic from extrinsic; additional assumptions or controlled interventions are logically required.

+ #strong[Cross-domain design principles:] Engineers can design systems in unfamiliar domains by analogy, with rigorous guarantees from power conjugacy.

+ #strong[Limits identified:] We specified regimes where the framework fails (chaos, strong fields, nonlinear responses) and those where it succeeds (solar system dynamics, orbital mechanics, circuit design).

#horizontalrule

== XVI.2 The Deep Unity of Physical Law
<xvi.2-the-deep-unity-of-physical-law>
#strong[Central thesis:] The universality is not engineered. Physics could not be otherwise.

The patterns arise from two inescapable principles:

+ #strong[Conservation Laws:] Energy, momentum, and angular momentum are conserved. Any system that violates these is unphysical.

+ #strong[Power Conjugacy:] Energy flow rate (power) must have identical form in every domain: $P = e (t) dot.op f (t)$. Systems with identical power structures have identical dynamics.

These principles are not assumptions we made---they are facts of the universe. Consequently, any physical system obeying these principles must have the mathematical form we derived. The analogies are #strong[inevitable];.

#strong[Implications for science:]

- #strong[Unification is not mere convenience:] When we solve the harmonic oscillator equation once, we have solved it for ALL systems---pendulums, LC circuits, molecular vibrations, vibrating strings. Not because the math happens to match, but because physics itself enforces this.

- #strong[Reductionism is incomplete:] Full understanding requires recognizing both microscopic and macroscopic principles. Quantum field theory describes particles; conservation laws describe their overall behavior. Neither alone is sufficient.

- #strong[New discoveries should look familiar:] When a novel physical system is discovered, we should expect its differential equations to match known forms. This expectation has been consistently validated.

#horizontalrule

== XVI.3 Outstanding Questions and Future Directions
<xvi.3-outstanding-questions-and-future-directions>
#strong[Question 1: Quantum extensions?]

Can the framework extend to quantum mechanics? The Schrödinger equation $i planck.reduce partial psi \/ partial t = hat(H) psi$ has superficial similarity to classical equations. The Hamiltonian $hat(H)$ is an energy operator. But quantum systems don't have definite "trajectories" or intrinsic/extrinsic decomposition in the classical sense. Quantum information theory may require a different framework entirely, or provide a deeper unification.

#strong[Question 2: Decomposition in chaotic systems?]

When a system enters chaos, does the intrinsic-extrinsic decomposition become meaningless? Lyapunov exponents measure sensitivity to initial conditions, not intrinsic vs.~extrinsic forcing. Can we define causal attribution in chaotic systems, or does chaos make causality meaningless?

#strong[Question 3: Biological systems with adaptation?]

Living systems actively regulate their parameters---a homeostatic organism adjusts metabolic rates, immune response, etc. This is neither purely intrinsic nor purely extrinsic; it's adaptive and goal-directed. Can we extend the framework to systems that learn and evolve their intrinsic properties?

#strong[Question 4: Gravitational wave astronomy]

LIGO has opened a new observational window on extreme gravity. Can GEM guide interpretation of future observations? Where does nonlinear GR become essential? Can we use bond graphs to reason about multi-messenger astronomy (gravitational + electromagnetic observations)?

#strong[Question 5: Engineering at the quantum-classical boundary]

Quantum computers and superconducting circuits operate where quantum and classical mechanics meet. Can our power-conjugacy framework guide hybrid quantum-classical system design?

#horizontalrule

== XVI.4 Implications for Scientific Practice
<xvi.4-implications-for-scientific-practice>
#strong[For engineers:]

Design-by-analogy is not heuristic guessing---it is rigorous. When you solve a problem in the electrical domain, the solution immediately transfers to mechanical, hydraulic, and thermal domains through variable substitution. This is guaranteed by power conjugacy, not luck.

#strong[For experimental scientists:]

Control is essential. Observable behavior is generated by intrinsic and extrinsic factors. To identify causal mechanisms, you must manipulate one factor while holding the other constant (controlled variation). Passive observation alone is insufficient for causal inference.

#strong[For theorists:]

Unification comes not from finding more fundamental particles, but from recognizing structural equivalences. Conservation laws and power conjugacy are deeper than any particular theory. A unified framework can accommodate multiple theoretical layers (classical, relativistic, quantum) because the principles transcend any specific formulation.

#strong[For educators:]

Teach analogies explicitly. When students learn Ohm's law ($V = I R$), immediately connect it to Hooke's law ($F = k x$) and Newton's second law ($F = m a$). Show that these are instances of the same mathematical principle. The patterns are universal and teachable.

#horizontalrule

== XVI.5 Closing Reflections
<xvi.5-closing-reflections>
We began with a simple observation: change results from the joint action of intrinsic and extrinsic factors. We asked: what are the implications of this factorization?

The answer unfolded across sixteen parts:

- It implies that causal attribution is structurally ambiguous
- It implies that mathematical forms are universal across domains
- It implies that gravity and electricity are identical forces
- It implies that engineering design transfers across domains
- It implies that feedback blurs the boundary between intrinsic and extrinsic
- It implies that systems undergo qualitative transitions at critical parameter values
- It implies that some regimes lie beyond the framework's validity

The framework is not complete. Quantum mechanics, chaotic systems, highly nonlinear phenomena, and biological adaptation remain partially understood through this lens. But within its domain of validity---classical, weakly nonlinear, deterministic systems---the framework is remarkably complete and predictive.

#strong[A final thought:] The universality of pattern is not surprising once recognized. Physics could not be otherwise. The laws that govern a falling apple, a swinging pendulum, a charged particle in an electromagnetic field, a vibrating molecule, and a spiral galaxy are all instances of the same principle. The diversity of phenomena masks an underlying unity.

To understand this unity is to see the universe differently---not as a collection of disparate phenomena requiring separate explanations, but as a single coherent structure viewed through different lenses.

The patterns of change are everywhere. Once you learn to see them, you cannot unsee them.

#horizontalrule

== Recommended Further Reading by Topic
<recommended-further-reading-by-topic>
#strong[For rigorous proofs:] Perko, Wiggins, Evans, Rudin

#strong[For control applications:] Ogata, Kirk, Åström & Murray

#strong[For cross-domain analogies:] Karnopp et al., Paynter

#strong[For identification:] Ljung, Walter & Pronzato

#strong[For chaos and bifurcations:] Strogatz, Kuznetsov, Wiggins

#strong[For intuitive understanding:] Strogatz, Åström & Murray, Karnopp et al.

#horizontalrule

#emph[--- END OF DOCUMENT ---]

#bibliography("references.bib")

