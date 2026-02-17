# Appendix A: Mathematical Derivations

---

## A.1 State-Space Formulation from First Principles

### A.1.1 The Single-Account Conservation Law

Consider a single financial account as a reservoir with volume $V(t)$ representing the dollar balance at time $t$. Money enters the account at rate $Q_{in}(t)$ and exits at rate $Q_{out}(t)$. By conservation of mass (money neither created nor destroyed within the personal financial system):

$$\frac{dV}{dt} = Q_{in}(t) - Q_{out}(t) \tag{A.1}$$

This is the **fundamental balance equation**, directly analogous to the continuity equation for incompressible fluid in a tank.

For discrete time steps $\Delta t$ (e.g., monthly intervals), the finite-difference approximation is:

$$V(t + \Delta t) = V(t) + \left[ Q_{in}(t) - Q_{out}(t) \right] \Delta t \tag{A.2}$$

### A.1.2 Multi-Account System

For a system of $n$ accounts with balances $V_1, V_2, \ldots, V_n$, the **state vector** is:

$$\mathbf{x}(t) = \begin{bmatrix} V_1(t) \\ V_2(t) \\ \vdots \\ V_n(t) \end{bmatrix} \tag{A.3}$$

Accounts may transfer money internally. Let $T_{ij}$ denote the transfer rate from account $j$ to account $i$ (with $T_{ii} = 0$). The net internal flow into account $i$ is:

$$\sum_{j \neq i} T_{ij} - \sum_{j \neq i} T_{ji} \tag{A.4}$$

Define the **transfer matrix** $\mathbf{A}$ with elements:

$$A_{ij} = \begin{cases}
T_{ij} & \text{if } i \neq j \\
-\sum_{k \neq i} T_{ki} & \text{if } i = j
\end{cases} \tag{A.5}$$

The diagonal elements ensure conservation: each column of $\mathbf{A}$ sums to zero, meaning internal transfers redistribute but do not create money.

### A.1.3 External Flows

Define the **input vector** $\mathbf{u}(t)$ representing external flows:

$$\mathbf{u}(t) = \begin{bmatrix} I(t) \\ S(t) \end{bmatrix} \tag{A.6}$$

where $I(t)$ is total income and $S(t)$ is total spending. The **input matrix** $\mathbf{B}$ maps these to specific accounts:

$$\mathbf{B} = \begin{bmatrix}
b_{1,I} & -b_{1,S} \\
b_{2,I} & -b_{2,S} \\
\vdots & \vdots \\
b_{n,I} & -b_{n,S}
\end{bmatrix} \tag{A.7}$$

where $b_{i,I}$ is the fraction of income deposited to account $i$ (summing to 1), and $b_{i,S}$ is the fraction of spending drawn from account $i$ (summing to 1). The negative sign on spending reflects outflow.

### A.1.4 The State Equation

Combining internal transfers and external flows:

$$\boxed{\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}} \tag{A.8}$$

This is the standard **linear time-invariant (LTI) state-space form**. For personal finance:

- $\mathbf{x}$: Account balances (state)
- $\mathbf{A}$: Internal transfer dynamics (system matrix)
- $\mathbf{B}$: Income/spending routing (input matrix)
- $\mathbf{u}$: External cash flows (input)

### A.1.5 Example: Three-Account System

Consider checking ($V_1$), savings ($V_2$), and investment ($V_3$) accounts. Suppose:
- Income deposits to checking
- Spending draws from checking
- Monthly transfer $\tau_{12}$ from checking to savings
- Monthly transfer $\tau_{23}$ from savings to investment

The transfer matrix:

$$\mathbf{A} = \begin{bmatrix}
-\tau_{12} & 0 & 0 \\
\tau_{12} & -\tau_{23} & 0 \\
0 & \tau_{23} & 0
\end{bmatrix} \tag{A.9}$$

Note: Column sums are zero (conservation). The investment account has no outflow in this example, acting as a terminal reservoir.

The input matrix (all income to checking, all spending from checking):

$$\mathbf{B} = \begin{bmatrix}
1 & -1 \\
0 & 0 \\
0 & 0
\end{bmatrix} \tag{A.10}$$

---

## A.2 Stability Analysis via Eigenvalues

### A.2.1 System Stability Criterion

For the LTI system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, stability depends on the eigenvalues $\lambda_i$ of the transfer matrix $\mathbf{A}$.

**Theorem (Lyapunov Stability):** The system is asymptotically stable if and only if all eigenvalues have negative real parts:

$$\text{Re}(\lambda_i) < 0 \quad \forall i \tag{A.11}$$

### A.2.2 Financial Interpretation

For the three-account system (Eq. A.9), the eigenvalues are the diagonal elements (triangular matrix):

$$\lambda_1 = -\tau_{12}, \quad \lambda_2 = -\tau_{23}, \quad \lambda_3 = 0 \tag{A.12}$$

The zero eigenvalue ($\lambda_3 = 0$) indicates **marginal stability**: the investment account accumulates indefinitely without inherent decay. This is financially sensible—money parked in investments doesn't spontaneously disappear.

The negative eigenvalues indicate that checking and savings balances decay toward equilibrium levels determined by the balance of inflows and outflows.

### A.2.3 Time Constants

The **time constant** $\tau_i = -1/\text{Re}(\lambda_i)$ measures how quickly account $i$ responds to perturbations:

$$\tau_{checking} = \frac{1}{\tau_{12}}, \quad \tau_{savings} = \frac{1}{\tau_{23}} \tag{A.13}$$

Large transfer rates yield small time constants (fast equilibration). If $\tau_{12} = 0.2$ (20% of checking transferred monthly), $\tau_{checking} = 5$ months—the characteristic time for checking balance to adjust.

---

## A.3 Thermodynamics of Compressible Investments

### A.3.1 The Compressible Investment Identity

Unlike liquid cash accounts where \$1 deposited = \$1 held, investment accounts exhibit **compressibility**: the dollar value $V$ depends on both the quantity held $n$ and the market price $P$:

$$V = nP \tag{A.14}$$

The quantity $n$ (shares, coins) is conserved during holding periods. The price $P(t)$ is an external forcing function determined by market dynamics.

### A.3.2 The First Law Derivation

The total differential of $V = nP$:

$$dV = d(nP) = n \, dP + P \, dn \tag{A.15}$$

Identifying the internal energy $U = V = nP$, the First Law $dU = \delta Q - \delta W$ requires:

$$\boxed{\delta Q = n \, dP \quad \text{(unrealized appreciation)}} \tag{A.16}$$

$$\boxed{\delta W = -P \, dn \quad \text{(realized from sales, } dn < 0 \text{)}} \tag{A.17}$$

**Proof of uniqueness**: The decomposition $dU = \delta Q - \delta W$ requires partitioning $dU$ into two terms. Since $dU = n\,dP + P\,dn$ by the product rule, and since $n\,dP$ captures value change from external forcing (price movement with no investor action) while $P\,dn$ captures value change from investor action (transactions at market price), the identification $\delta Q = n\,dP$ and $\delta W = -P\,dn$ is the unique partition consistent with the thermodynamic definitions of heat (energy transfer from environment without mechanical action) and work (energy transfer through mechanical action).

### A.3.3 Work Done by Investment Expansion

For a selling process from holdings $n_1$ to $n_2$ (with $n_2 < n_1$):

$$W_{1 \to 2} = \int_{n_1}^{n_2} (-P(n)) \, dn = \int_{n_2}^{n_1} P(n) \, dn \tag{A.18}$$

If price remains constant during the sale (**isobaric process**):

$$W_{isobaric} = P \cdot (n_1 - n_2) = P \cdot \Delta n \tag{A.19}$$

This equals the realized proceeds from selling $\Delta n$ shares at price $P$.

---

## A.4 Lot-Level Buoyancy: Derivations

### A.4.1 Depth Variable from GBM

Under geometric Brownian motion, the stock price satisfies:

$$\frac{dP}{P} = \mu \, dt + \sigma \, dW_t \tag{A.20}$$

By Ito's lemma, the log-price evolves as:

$$d(\ln P) = \left(\mu - \frac{\sigma^2}{2}\right) dt + \sigma \, dW_t \tag{A.21}$$

The depth of a lot with entry price $P_{entry}$ is $d(t) = \ln P_{entry} - \ln P(t)$. Since $P_{entry}$ is constant:

$$dd(t) = -d(\ln P) = -\left(\mu - \frac{\sigma^2}{2}\right) dt - \sigma \, dW_t \tag{A.22}$$

With $k \equiv \mu - \sigma^2/2$ and redefining the Wiener process orientation:

$$dd(t) = -k \, dt + \sigma \, d\tilde{W}_t \tag{A.23}$$

When mean-reversion effects are incorporated (from market microstructure, valuation anchoring, or empirical observation), this generalizes to the Ornstein-Uhlenbeck process:

$$dd(t) = -\kappa \cdot d(t) \, dt + \sigma \, dW_t \tag{A.24}$$

### A.4.2 OU Process: Key Properties

The OU process (Eq. A.24) has the following analytic solutions:

**Conditional mean** (expected depth at time $t$ given initial depth $d_0$):

$$\mathbb{E}[d(t) | d(0) = d_0] = d_0 \, e^{-\kappa t} \tag{A.25}$$

**Conditional variance**:

$$\text{Var}[d(t) | d(0) = d_0] = \frac{\sigma^2}{2\kappa}\left(1 - e^{-2\kappa t}\right) \tag{A.26}$$

**Stationary distribution** (as $t \to \infty$):

$$d \sim \mathcal{N}\left(0, \frac{\sigma^2}{2\kappa}\right) \tag{A.27}$$

### A.4.3 First-Passage-Time for Recovery

The first-passage-time $\tau$ from depth $d_0 > 0$ to $d = 0$ (recovery) for the OU process satisfies the backward Kolmogorov equation:

$$-\kappa \, d_0 \frac{\partial u}{\partial d_0} + \frac{\sigma^2}{2} \frac{\partial^2 u}{\partial d_0^2} = -1 \tag{A.28}$$

where $u(d_0) = \mathbb{E}[\tau | d(0) = d_0]$. The solution involves Dawson's function and yields:

$$\mathbb{E}[\tau(d_0)] = \frac{\sqrt{\pi}}{\sigma\sqrt{\kappa}} \int_0^{d_0\sqrt{2\kappa}/\sigma} e^{s^2} \, \text{erf}(s) \, ds \tag{A.29}$$

**Asymptotic behavior**:
- Small depth ($d_0 \ll \sigma/\sqrt{\kappa}$): $\mathbb{E}[\tau] \approx d_0^2 / \sigma^2$ (quadratic in depth)
- Large depth ($d_0 \gg \sigma/\sqrt{\kappa}$): $\mathbb{E}[\tau] \sim e^{\kappa d_0^2/\sigma^2}$ (exponential in depth-squared)

### A.4.4 Fokker-Planck Equation for Depth Distribution

The probability density $\rho(d, t)$ of the depth variable evolves according to the Fokker-Planck equation:

$$\frac{\partial \rho}{\partial t} = \kappa \frac{\partial}{\partial d}(d \cdot \rho) + \frac{\sigma^2}{2} \frac{\partial^2 \rho}{\partial d^2} \tag{A.30}$$

**Steady-state solution** (setting $\partial \rho / \partial t = 0$):

$$\rho_{ss}(d) = \sqrt{\frac{\kappa}{\pi \sigma^2}} \exp\left(-\frac{\kappa d^2}{\sigma^2}\right) \tag{A.31}$$

This is a Gaussian centered at $d = 0$ with variance $\sigma^2 / (2\kappa)$.

**Portfolio health metrics** derived from the depth distribution:

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| Mean depth | $\bar{d} = \int d \, \rho(d) \, dd$ | Average position: >0 means portfolio is net underwater |
| Depth variance | $\text{Var}(d) = \int (d - \bar{d})^2 \rho \, dd$ | Spread of entries; wider = more timing dispersion |
| Underwater fraction | $F_{uw} = \int_0^{\infty} \rho(d) \, dd$ | Fraction of lots currently at a loss |
| Skewness | $\gamma_1 = \mathbb{E}[(d-\bar{d})^3]/\text{Var}^{3/2}$ | Asymmetry: positive skew = heavy underwater tail |

---

## A.5 Compressibility Measures

### A.5.1 Definition of Financial Compressibility

By analogy with the isothermal compressibility in fluid mechanics ($\beta_T = -(1/V)(\partial V / \partial P)_T$), define the **financial compressibility** of an instrument as:

$$\beta = \frac{1}{V}\frac{\partial V}{\partial P} \tag{A.32}$$

For cash ($V$ independent of $P$): $\beta = 0$ (incompressible).

For equities ($V = nP$): $\beta = 1/P$ (compressibility inversely proportional to price).

For options (where $V \approx n \cdot \Delta \cdot P$ with delta $\Delta$): $\beta = (\Delta + P \cdot \Gamma) / (\Delta \cdot P)$, incorporating the nonlinear price sensitivity through gamma $\Gamma$. This yields $\beta > 1/P$, confirming supercompressibility.

### A.5.2 Portfolio Compressibility

For a portfolio of $N$ instruments with values $V_i$ and compressibilities $\beta_i$, the **portfolio compressibility** is:

$$\beta_{portfolio} = \sum_i w_i \beta_i \tag{A.33}$$

where $w_i = V_i / V_{total}$ is the weight of instrument $i$. This weighted average determines the portfolio's aggregate sensitivity to market pressure changes.

### A.5.3 Connection to Standard Financial Metrics

| Financial Metric | Compressibility Interpretation |
|-----------------|-------------------------------|
| Bond duration $D$ | $\beta_{bond} \approx D / (1+y)$ where $y$ is yield |
| Equity beta $\beta_{eq}$ | $\beta_{equity} = \beta_{eq} / P$ (market-relative compressibility) |
| Options delta $\Delta$ | $\beta_{option} = \Delta / V$ (price sensitivity per unit value) |
| Leverage ratio $L$ | Amplifies compressibility: $\beta_{leveraged} = L \cdot \beta_{underlying}$ |

---

## Summary of Key Equations

| Equation | Number | Description |
|----------|--------|-------------|
| $\frac{dV}{dt} = Q_{in} - Q_{out}$ | (A.1) | Fundamental balance equation |
| $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ | (A.8) | State-space formulation |
| $V = nP$ | (A.14) | Compressible investment identity |
| $dU = \delta Q - \delta W$ | (A.15) | First Law for investments |
| $\delta Q = n \, dP$ | (A.16) | Unrealized appreciation as heat |
| $\delta W = -P \, dn$ | (A.17) | Realized gains as work |
| $d(t) = \ln(P_{entry}/P(t))$ | (A.22) | Lot depth variable |
| $dd = -\kappa \, d \, dt + \sigma \, dW_t$ | (A.24) | OU process for lot depth |
| $\mathbb{E}[d(t)] = d_0 e^{-\kappa t}$ | (A.25) | Expected depth decay |
| $\rho_{ss}(d) \propto \exp(-\kappa d^2/\sigma^2)$ | (A.31) | Steady-state depth distribution |
| $\beta = (1/V)(\partial V / \partial P)$ | (A.32) | Financial compressibility |
| $\text{Re}(\lambda_i) < 0$ | (A.11) | Stability criterion |

---

*End of Appendix A*
