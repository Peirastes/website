/**
 * Bond Graph Solver Engine — M1
 *
 * Core data model and numerical solver for bond graph systems.
 * Supports R, C, I, Se, Sf elements, 0-junctions, 1-junctions,
 * and TF (transformer) elements.
 *
 * Approach: constraint-based propagation + RK4 integration.
 * At each time step:
 *   1. Storage elements (C, I) set known values from their state
 *   2. Sources impose their values
 *   3. Junction constraints propagate to resolve all bond efforts/flows
 *   4. R elements fill algebraically
 *   5. State derivatives computed: dq/dt = f (for C), dp/dt = e (for I)
 *
 * Sign convention:
 *   - Each bond has a direction (from → to), indicating assumed positive power flow
 *   - Power P = e × f is positive when flowing in the bond direction
 *   - At junctions: bonds pointing IN contribute positive, bonds pointing OUT contribute negative
 *   - 1-junction: common flow, efforts sum to zero (Σ e_in - Σ e_out = 0)
 *   - 0-junction: common effort, flows sum to zero (Σ f_in - Σ f_out = 0)
 *   - Storage elements absorb power when bond points toward them
 */

// ─── Unique ID generator ────────────────────────────────────────────
let _nextId = 1;
function genId() { return _nextId++; }
export function resetIds() { _nextId = 1; }

// ─── Element ────────────────────────────────────────────────────────
export class Element {
  /**
   * @param {'Se'|'Sf'|'R'|'C'|'I'|'TF'} type
   * @param {number} value - R (Ω), C (F), I (H/kg), Se (V/N/K), Sf (A/m·s⁻¹/W), TF (ratio)
   * @param {string} [label]
   */
  constructor(type, value, label) {
    this.id = genId();
    this.type = type;
    this.value = value;
    this.label = label || `${type}:${this.id}`;

    // Energy state for storage elements
    // C: q (generalized displacement — charge, position, entropy displacement)
    // I: p (generalized momentum — flux linkage, momentum, ...)
    this.state = 0;
  }

  /** Reset state to zero */
  reset() { this.state = 0; }
}

// ─── Junction ───────────────────────────────────────────────────────
export class Junction {
  /**
   * @param {'0'|'1'} type
   *   0-junction: common effort, flows sum to zero (parallel / node)
   *   1-junction: common flow, efforts sum to zero (series / loop)
   */
  constructor(type, label) {
    this.id = genId();
    this.type = type;
    this.label = label || `J${type}:${this.id}`;
  }
}

// ─── Bond ───────────────────────────────────────────────────────────
export class Bond {
  /**
   * @param {number} fromId - Node the half-arrow originates from
   * @param {number} toId - Node the half-arrow points to
   * Power is positive when flowing from → to.
   */
  constructor(fromId, toId) {
    this.id = genId();
    this.from = fromId;
    this.to = toId;
    this.effort = NaN;
    this.flow = NaN;
  }

  get power() { return this.effort * this.flow; }

  clearValues() {
    this.effort = NaN;
    this.flow = NaN;
  }
}

// ─── Bond Graph ─────────────────────────────────────────────────────
export class BondGraph {
  constructor() {
    this.nodes = new Map();   // id → Element | Junction
    this.bonds = [];          // all bonds
    this._bondsByNode = null; // lazily built adjacency index
  }

  // ── Construction ────────────────────────────────────────────────

  addElement(type, value, label) {
    const el = new Element(type, value, label);
    this.nodes.set(el.id, el);
    this._bondsByNode = null;
    return el;
  }

  addJunction(type, label) {
    const j = new Junction(type, label);
    this.nodes.set(j.id, j);
    this._bondsByNode = null;
    return j;
  }

  /**
   * Create a power bond from → to.
   * Half-arrow points toward `to`; positive power flows from → to.
   */
  connect(from, to) {
    const b = new Bond(from.id, to.id);
    this.bonds.push(b);
    this._bondsByNode = null;
    return b;
  }

  // ── Topology queries ────────────────────────────────────────────

  /** Build adjacency index: nodeId → [{bond, inward, otherNodeId}] */
  _buildIndex() {
    if (this._bondsByNode) return;
    this._bondsByNode = new Map();
    for (const [id] of this.nodes) {
      this._bondsByNode.set(id, []);
    }
    for (const b of this.bonds) {
      this._bondsByNode.get(b.from).push({ bond: b, inward: false, otherNodeId: b.to });
      this._bondsByNode.get(b.to).push({ bond: b, inward: true, otherNodeId: b.from });
    }
  }

  /** Get all bond connections for a node */
  bondsOf(nodeId) {
    this._buildIndex();
    return this._bondsByNode.get(nodeId) || [];
  }

  /** Get all elements of a given type */
  elementsOfType(type) {
    return [...this.nodes.values()].filter(n => n instanceof Element && n.type === type);
  }

  /** Get all storage elements (C and I) */
  get storageElements() {
    return [...this.nodes.values()].filter(n => n instanceof Element && (n.type === 'C' || n.type === 'I'));
  }

  /** Get all junctions */
  get junctions() {
    return [...this.nodes.values()].filter(n => n instanceof Junction);
  }

  // ── State vector interface ──────────────────────────────────────

  /** Get current state as array [q1, q2, ..., p1, p2, ...] */
  getState() {
    return this.storageElements.map(el => el.state);
  }

  /** Set state from array */
  setState(vec) {
    this.storageElements.forEach((el, i) => { el.state = vec[i]; });
  }

  /** Reset all states to zero */
  resetState() {
    this.storageElements.forEach(el => { el.state = 0; });
  }

  // ── Core solver: propagation ────────────────────────────────────

  /**
   * Resolve all bond efforts and flows for the current state.
   * Uses iterative constraint propagation through junctions.
   *
   * @param {Object} [sourceOverrides] - Optional map: elementId → value(t)
   * @returns {boolean} true if all bonds resolved
   */
  propagate(sourceOverrides) {
    // Clear all bond values
    for (const b of this.bonds) b.clearValues();

    // Phase 1: Elements impose known values on their bonds
    for (const [id, node] of this.nodes) {
      if (!(node instanceof Element)) continue;

      const conns = this.bondsOf(id);
      if (conns.length === 0) continue;
      const { bond, inward } = conns[0]; // 1-port elements have exactly one bond

      const val = sourceOverrides?.[id] ?? node.value;

      switch (node.type) {
        case 'Se': // effort source: imposes effort on its bond
          bond.effort = val;
          break;
        case 'Sf': // flow source: imposes flow on its bond
          bond.flow = inward ? val : val; // flow magnitude on bond
          break;
        case 'C': // capacitive: e = q / C
          bond.effort = node.state / node.value;
          break;
        case 'I': // inertive: f = p / I
          bond.flow = node.state / node.value;
          break;
        // R and TF are resolved during propagation
      }
    }

    // Phase 2: Iterative junction propagation
    const MAX_ITER = 20;
    for (let iter = 0; iter < MAX_ITER; iter++) {
      let progress = false;

      // Propagate through junctions
      for (const jn of this.junctions) {
        if (this._propagateJunction(jn)) progress = true;
      }

      // Propagate through R elements
      for (const [id, node] of this.nodes) {
        if (!(node instanceof Element) || node.type !== 'R') continue;
        const { bond } = this.bondsOf(id)[0];
        if (!isNaN(bond.effort) && isNaN(bond.flow)) {
          bond.flow = bond.effort / node.value;
          progress = true;
        } else if (isNaN(bond.effort) && !isNaN(bond.flow)) {
          bond.effort = node.value * bond.flow;
          progress = true;
        }
      }

      // Propagate through TF elements
      for (const [id, node] of this.nodes) {
        if (!(node instanceof Element) || node.type !== 'TF') continue;
        if (this._propagateTF(node)) progress = true;
      }

      if (!progress) break;
    }

    // Check if everything resolved
    return this.bonds.every(b => !isNaN(b.effort) && !isNaN(b.flow));
  }

  /**
   * Propagate constraints at a single junction.
   * @returns {boolean} true if any new values were determined
   */
  _propagateJunction(jn) {
    const conns = this.bondsOf(jn.id);
    let progress = false;

    if (jn.type === '1') {
      // 1-JUNCTION: common flow, efforts sum to zero
      //
      // Common flow: if any bond has a known flow, all have that flow.
      // Sign: flow on all bonds has the same magnitude at a 1-junction.
      // The sign relative to power direction is already embedded in the effort sum.

      let knownFlow = NaN;
      for (const { bond, inward } of conns) {
        if (!isNaN(bond.flow)) {
          knownFlow = bond.flow;
          break;
        }
      }

      if (!isNaN(knownFlow)) {
        for (const { bond } of conns) {
          if (isNaN(bond.flow)) {
            bond.flow = knownFlow;
            progress = true;
          }
        }
      }

      // Effort sum: Σ (signed effort) = 0
      // For bonds pointing IN (inward=true): sign = +1
      // For bonds pointing OUT (inward=false): sign = -1
      let unknownEffortConn = null;
      let unknownCount = 0;
      let effortSum = 0;

      for (const conn of conns) {
        const sign = conn.inward ? 1 : -1;
        if (isNaN(conn.bond.effort)) {
          unknownCount++;
          unknownEffortConn = conn;
        } else {
          effortSum += sign * conn.bond.effort;
        }
      }

      if (unknownCount === 1 && unknownEffortConn) {
        // Solve for the one unknown: sum must equal zero
        const sign = unknownEffortConn.inward ? 1 : -1;
        unknownEffortConn.bond.effort = -effortSum / sign;
        progress = true;
      }

    } else if (jn.type === '0') {
      // 0-JUNCTION: common effort, flows sum to zero
      //
      // Common effort: if any bond has a known effort, all have that effort.

      let knownEffort = NaN;
      for (const { bond } of conns) {
        if (!isNaN(bond.effort)) {
          knownEffort = bond.effort;
          break;
        }
      }

      if (!isNaN(knownEffort)) {
        for (const { bond } of conns) {
          if (isNaN(bond.effort)) {
            bond.effort = knownEffort;
            progress = true;
          }
        }
      }

      // Flow sum: Σ (signed flow) = 0
      let unknownFlowConn = null;
      let unknownCount = 0;
      let flowSum = 0;

      for (const conn of conns) {
        const sign = conn.inward ? 1 : -1;
        if (isNaN(conn.bond.flow)) {
          unknownCount++;
          unknownFlowConn = conn;
        } else {
          flowSum += sign * conn.bond.flow;
        }
      }

      if (unknownCount === 1 && unknownFlowConn) {
        const sign = unknownFlowConn.inward ? 1 : -1;
        unknownFlowConn.bond.flow = -flowSum / sign;
        progress = true;
      }
    }

    return progress;
  }

  /**
   * Propagate through a TF (transformer) element.
   * TF has exactly 2 bonds: primary and secondary.
   * e1/e2 = m (modulus), f2/f1 = m (power conserving)
   *
   * Convention: TF connects two junctions. The first bond is primary,
   * the second is secondary. TF.value = m (turns ratio).
   */
  _propagateTF(tfElement) {
    const conns = this.bondsOf(tfElement.id);
    if (conns.length !== 2) return false;

    const [c0, c1] = conns;
    const m = tfElement.value;
    let progress = false;

    // Effort: e_primary = m * e_secondary
    if (!isNaN(c0.bond.effort) && isNaN(c1.bond.effort)) {
      c1.bond.effort = c0.bond.effort / m;
      progress = true;
    } else if (isNaN(c0.bond.effort) && !isNaN(c1.bond.effort)) {
      c0.bond.effort = m * c1.bond.effort;
      progress = true;
    }

    // Flow: f_secondary = m * f_primary (power conserving: e1*f1 = e2*f2)
    if (!isNaN(c0.bond.flow) && isNaN(c1.bond.flow)) {
      c1.bond.flow = m * c0.bond.flow;
      progress = true;
    } else if (isNaN(c0.bond.flow) && !isNaN(c1.bond.flow)) {
      c0.bond.flow = c1.bond.flow / m;
      progress = true;
    }

    return progress;
  }

  // ── State derivatives ───────────────────────────────────────────

  /**
   * Compute state derivatives after propagation.
   * Must call propagate() first.
   *
   * @returns {number[]} derivatives [dq1/dt, dq2/dt, ..., dp1/dt, dp2/dt, ...]
   */
  stateDerivatives() {
    return this.storageElements.map(el => {
      const { bond, inward } = this.bondsOf(el.id)[0];

      if (el.type === 'C') {
        // dq/dt = f (flow into C charges it)
        // If bond points toward C (inward from C's perspective means bond.to === C.id,
        // but we query from C's perspective, so inward means power flows into C)
        // Power into C is positive when inward=true → dq/dt = +flow
        // Power out of C when inward=false → dq/dt = -flow
        return inward ? bond.flow : -bond.flow;
      }

      if (el.type === 'I') {
        // dp/dt = e (effort across I changes momentum)
        // Same sign convention: positive when power flows into I
        return inward ? bond.effort : -bond.effort;
      }

      return 0;
    });
  }

  // ── RK4 Integrator ─────────────────────────────────────────────

  /**
   * Right-hand side function for the integrator.
   * Sets state, propagates, returns derivatives.
   */
  _rhs(stateVec, t, sourceOverrides) {
    this.setState(stateVec);
    this.propagate(sourceOverrides);
    return this.stateDerivatives();
  }

  /**
   * Single RK4 step.
   * @param {number} dt - time step
   * @param {number} t - current time
   * @param {Object} [sourceOverrides]
   * @returns {number[]} new state vector
   */
  stepRK4(dt, t, sourceOverrides) {
    const y = this.getState();
    const n = y.length;

    const k1 = this._rhs(y, t, sourceOverrides);

    const y2 = y.map((v, i) => v + 0.5 * dt * k1[i]);
    const k2 = this._rhs(y2, t + 0.5 * dt, sourceOverrides);

    const y3 = y.map((v, i) => v + 0.5 * dt * k2[i]);
    const k3 = this._rhs(y3, t + 0.5 * dt, sourceOverrides);

    const y4 = y.map((v, i) => v + dt * k3[i]);
    const k4 = this._rhs(y4, t + dt, sourceOverrides);

    const yNext = y.map((v, i) =>
      v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
    );

    this.setState(yNext);
    return yNext;
  }

  // ── High-level solve methods ────────────────────────────────────

  /**
   * Solve transient response.
   * @param {Object} options
   * @param {number} options.dt - time step (s)
   * @param {number} options.duration - total simulation time (s)
   * @param {number} [options.recordInterval=1] - record every N steps
   * @param {Object} [options.sourceOverrides] - elementId → value
   * @returns {Array<{t, state, bonds}>} time history
   */
  solveTransient({ dt, duration, recordInterval = 1, sourceOverrides } = {}) {
    const history = [];
    const steps = Math.ceil(duration / dt);
    let t = 0;

    // Record initial state
    this.propagate(sourceOverrides);
    history.push(this._snapshot(t));

    for (let i = 0; i < steps; i++) {
      this.stepRK4(dt, t, sourceOverrides);
      t += dt;

      if ((i + 1) % recordInterval === 0) {
        this.propagate(sourceOverrides); // ensure bonds are resolved for snapshot
        history.push(this._snapshot(t));
      }
    }

    return history;
  }

  /**
   * Solve for steady state (set all derivatives to zero).
   * For DC steady state: C acts as open (f=0), I acts as short (e=0).
   * This is a simplified approach valid for DC sources.
   *
   * For AC or general steady state, use solveTransient and wait for convergence.
   *
   * @param {Object} [sourceOverrides]
   * @returns {{state, bonds, elements}} steady state snapshot
   */
  solveSteadyState(sourceOverrides) {
    // At DC steady state, all derivatives are zero:
    // dq/dt = 0 → f through C = 0 (capacitor is open circuit)
    // dp/dt = 0 → e across I = 0 (inductor is short circuit)
    //
    // Strategy: set C to impose f=0 and I to impose e=0, then propagate.
    // The resulting efforts on C give q = C*e, and flows on I give p = I*f.

    // Clear all bonds
    for (const b of this.bonds) b.clearValues();

    // Sources impose values
    for (const [id, node] of this.nodes) {
      if (!(node instanceof Element)) continue;
      const conns = this.bondsOf(id);
      if (conns.length === 0) continue;
      const { bond, inward } = conns[0];
      const val = sourceOverrides?.[id] ?? node.value;

      switch (node.type) {
        case 'Se': bond.effort = val; break;
        case 'Sf': bond.flow = val; break;
        case 'C':
          // At DC steady state, no flow through C
          bond.flow = 0;
          break;
        case 'I':
          // At DC steady state, no effort across I
          bond.effort = 0;
          break;
      }
    }

    // Propagate to resolve everything
    const MAX_ITER = 20;
    for (let iter = 0; iter < MAX_ITER; iter++) {
      let progress = false;

      for (const jn of this.junctions) {
        if (this._propagateJunction(jn)) progress = true;
      }

      for (const [id, node] of this.nodes) {
        if (!(node instanceof Element)) continue;
        const conns = this.bondsOf(id);
        if (conns.length === 0) continue;
        const { bond } = conns[0];

        if (node.type === 'R') {
          if (!isNaN(bond.effort) && isNaN(bond.flow)) {
            bond.flow = bond.effort / node.value;
            progress = true;
          } else if (isNaN(bond.effort) && !isNaN(bond.flow)) {
            bond.effort = node.value * bond.flow;
            progress = true;
          }
        }

        if (node.type === 'TF') {
          if (this._propagateTF(node)) progress = true;
        }
      }

      if (!progress) break;
    }

    // Set storage element states from the resolved steady-state values
    for (const el of this.storageElements) {
      const { bond } = this.bondsOf(el.id)[0];
      if (el.type === 'C') {
        // q = C * e
        el.state = el.value * bond.effort;
      } else if (el.type === 'I') {
        // p = I * f
        el.state = el.value * bond.flow;
      }
    }

    return this._snapshot(Infinity);
  }

  // ── Snapshot ────────────────────────────────────────────────────

  _snapshot(t) {
    return {
      t,
      state: this.getState(),
      bonds: this.bonds.map(b => ({
        id: b.id,
        from: b.from,
        to: b.to,
        effort: b.effort,
        flow: b.flow,
        power: b.power,
      })),
      elements: [...this.nodes.values()]
        .filter(n => n instanceof Element)
        .map(el => ({
          id: el.id,
          type: el.type,
          label: el.label,
          value: el.value,
          state: el.state,
        })),
    };
  }

  // ── Diagnostic ─────────────────────────────────────────────────

  /** Print current bond values to console */
  dump() {
    console.log('── Bond Graph State ──');
    for (const b of this.bonds) {
      const from = this.nodes.get(b.from);
      const to = this.nodes.get(b.to);
      console.log(
        `  Bond ${b.id}: ${from.label} → ${to.label}  ` +
        `e=${isNaN(b.effort) ? '?' : b.effort.toFixed(4)}  ` +
        `f=${isNaN(b.flow) ? '?' : b.flow.toFixed(4)}  ` +
        `P=${isNaN(b.power) ? '?' : b.power.toFixed(4)}`
      );
    }
    for (const el of this.storageElements) {
      console.log(`  ${el.label}: state=${el.state.toFixed(6)}`);
    }
  }
}
