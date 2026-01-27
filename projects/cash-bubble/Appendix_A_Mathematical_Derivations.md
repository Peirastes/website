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

For a system of $n$ accounts with balances $V_1, V_2, \ldots, V_n$, we define the **state vector**:

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

## A.2 Signal Dynamics: Derivatives of Financial Position

### A.2.1 Velocity (First Derivative)

The **financial velocity** is the instantaneous rate of change of net worth:

$$v(t) = \frac{dV_{total}}{dt} = \sum_i \frac{dV_i}{dt} = I(t) - S(t) \tag{A.11}$$

For the total system, internal transfers cancel, leaving only external flows. This is the **net savings rate**.

In discrete time:

$$v[k] = \frac{V_{total}[k] - V_{total}[k-1]}{\Delta t} \tag{A.12}$$

### A.2.2 Acceleration (Second Derivative)

The **financial acceleration** measures how the savings rate itself is changing:

$$a(t) = \frac{dv}{dt} = \frac{d^2 V_{total}}{dt^2} = \frac{dI}{dt} - \frac{dS}{dt} \tag{A.13}$$

Positive acceleration indicates improving financial momentum (savings rate increasing). Negative acceleration signals deteriorating momentum, even if velocity is still positive.

In discrete time:

$$a[k] = \frac{v[k] - v[k-1]}{\Delta t} \tag{A.14}$$

### A.2.3 Jerk (Third Derivative)

The **financial jerk** detects inflection points in the acceleration:

$$j(t) = \frac{da}{dt} = \frac{d^3 V_{total}}{dt^3} \tag{A.15}$$

Sign changes in jerk indicate transitions between concave and convex financial trajectories—early warning of trend reversals.

### A.2.4 Stability Interpretation

The phase space $(v, a)$ partitions into four quadrants with distinct financial interpretations:

| Quadrant | Velocity | Acceleration | Interpretation |
|----------|----------|--------------|----------------|
| I | $v > 0$ | $a > 0$ | Accelerating growth (stable, improving) |
| II | $v < 0$ | $a > 0$ | Decelerating loss (recovering) |
| III | $v < 0$ | $a < 0$ | Accelerating loss (unstable, crisis) |
| IV | $v > 0$ | $a < 0$ | Decelerating growth (approaching equilibrium) |

Trajectories in Quadrant III require intervention; continued negative acceleration compounds losses.

---

## A.3 Thermodynamics of the Cash Bubble

### A.3.1 The Compressible Investment Assumption

Unlike liquid cash accounts where $1 deposited = $1 held, investment accounts exhibit **compressibility**: the dollar value $V$ depends on both the quantity held $n$ and the market price $P$:

$$V = nP \tag{A.16}$$

The quantity $n$ (shares, coins) is conserved during holding periods. The price $P(t)$ is an external forcing function determined by market dynamics.

### A.3.2 The Ideal Gas Analogy

We propose the **ideal gas law analogue**:

$$PV = nRT \tag{A.17}$$

With the mapping:

| Thermodynamic | Financial | Interpretation |
|---------------|-----------|----------------|
| $P$ (pressure) | Market price per unit | External forcing |
| $V$ (volume) | Dollar value of position | Observable balance |
| $n$ (moles) | Number of shares/coins | Conserved quantity |
| $R$ (gas constant) | Liquidity factor | Market depth constant |
| $T$ (temperature) | Market sentiment | Volatility proxy |

Rearranging: $V = nRT/P$. But since $V = nP$ by definition (Eq. A.16), consistency requires:

$$RT = P^2 \tag{A.18}$$

This implies that "temperature" (sentiment/volatility) scales with the square of price—a relationship empirically observed in options markets where implied volatility often correlates with price levels.

### A.3.3 Work Done by Investment Expansion

When an investor sells $dn$ units at price $P$, the **work extracted** (money transferred to liquid accounts) is:

$$\delta W = P \, dn \cdot P = P \, dV_{liquid} \tag{A.19}$$

More precisely, for a selling process from state 1 to state 2:

$$W_{1 \to 2} = \int_{n_1}^{n_2} P(n) \, dn \tag{A.20}$$

If price remains constant during the sale (**isobaric process**):

$$W_{isobaric} = P \cdot (n_1 - n_2) = P \cdot \Delta n \tag{A.21}$$

This equals the **realized gain** if we measure work relative to the cost basis.

### A.3.4 The First Law for Investment Accounts

Define:
- $U$: Internal energy (unrealized value = $nP$)
- $Q$: Heat input (market appreciation without transactions)
- $W$: Work output (realized gains extracted via sales)

The **First Law of Thermodynamics**:

$$\boxed{dU = \delta Q - \delta W} \tag{A.22}$$

Financial interpretation:

$$d(nP) = n \, dP + P \, dn \tag{A.23}$$

- $n \, dP$: Change in value due to price movement (heat input $\delta Q$)
- $P \, dn$: Change in value due to transactions (work $\delta W$, negative for sales)

Thus:

$$\boxed{\delta Q = n \, dP \quad \text{(unrealized appreciation)}} \tag{A.24}$$

$$\boxed{\delta W = -P \, dn \quad \text{(realized from sales, } dn < 0 \text{)}} \tag{A.25}$$

### A.3.5 Isothermal vs. Adiabatic Processes

**Isothermal Process** ($T$ = constant, slow liquidation in stable market):

From $RT = P^2$ (Eq. A.18), constant $T$ implies constant $P$. The investor sells gradually at a stable price:

$$W_{isothermal} = P \cdot \Delta n \tag{A.26}$$

All extracted value is realized gain with no change in market conditions.

**Adiabatic Process** ($Q = 0$, rapid price collapse with no market heat exchange):

From the First Law with $\delta Q = 0$:

$$dU = -\delta W \implies d(nP) = P \, dn \tag{A.27}$$

This implies $n \, dP = 0$. If $n \neq 0$, then $dP = 0$, which contradicts "rapid price collapse." 

The resolution: during market crashes, the investor cannot extract work (sell) without accepting reduced prices. The **adiabatic crash** relationship follows from $PV^\gamma = \text{const}$ where $\gamma$ is the heat capacity ratio. For investments, we propose:

$$P \cdot V^\gamma = P \cdot (nP)^\gamma = P^{1+\gamma} n^\gamma = \text{const} \tag{A.28}$$

With $\gamma > 1$, rapid selling (decreasing $n$) requires accepting lower $P$ to maintain the adiabatic invariant—capturing the **price impact** of panic selling.

### A.3.6 Investment Efficiency

Define the **investment efficiency** $\eta$ as the ratio of work extracted to heat absorbed over a complete cycle (buy low, sell high, reinvest):

$$\eta = \frac{W_{net}}{Q_{in}} = \frac{\oint P \, dn}{\int_{appreciation} n \, dP} \tag{A.29}$$

For an ideal Carnot-like cycle between "cold" price $P_L$ and "hot" price $P_H$:

$$\eta_{Carnot} = 1 - \frac{P_L}{P_H} \tag{A.30}$$

This sets an **upper bound** on investment efficiency: no strategy can extract more than $(1 - P_L/P_H)$ of the market's appreciation as realized gains. Transaction costs, timing errors, and behavioral factors reduce actual efficiency below this theoretical maximum.

---

## A.4 Stability Analysis via Eigenvalues

### A.4.1 System Stability Criterion

For the LTI system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$, stability depends on the eigenvalues $\lambda_i$ of the transfer matrix $\mathbf{A}$.

**Theorem (Lyapunov Stability):** The system is asymptotically stable if and only if all eigenvalues have negative real parts:

$$\text{Re}(\lambda_i) < 0 \quad \forall i \tag{A.31}$$

### A.4.2 Financial Interpretation

For the three-account system (Eq. A.9):

$$\mathbf{A} = \begin{bmatrix}
-\tau_{12} & 0 & 0 \\
\tau_{12} & -\tau_{23} & 0 \\
0 & \tau_{23} & 0
\end{bmatrix}$$

The eigenvalues are the diagonal elements (triangular matrix):

$$\lambda_1 = -\tau_{12}, \quad \lambda_2 = -\tau_{23}, \quad \lambda_3 = 0 \tag{A.32}$$

The zero eigenvalue ($\lambda_3 = 0$) indicates **marginal stability**: the investment account accumulates indefinitely without inherent decay. This is financially sensible—money parked in investments doesn't spontaneously disappear.

The negative eigenvalues indicate that checking and savings balances decay toward equilibrium levels determined by the balance of inflows and outflows.

### A.4.3 Time Constants

The **time constant** $\tau_i = -1/\text{Re}(\lambda_i)$ measures how quickly account $i$ responds to perturbations:

$$\tau_{checking} = \frac{1}{\tau_{12}}, \quad \tau_{savings} = \frac{1}{\tau_{23}} \tag{A.33}$$

Large transfer rates yield small time constants (fast equilibration). If $\tau_{12} = 0.2$ (20% of checking transferred monthly), $\tau_{checking} = 5$ months—the characteristic time for checking balance to adjust.

---

## A.5 Control Theory: The Implicit PID Controller

### A.5.1 The Financial Control Problem

Consider a saver with target net worth $r(t)$. The **error signal** is:

$$e(t) = r(t) - V_{total}(t) \tag{A.34}$$

The saver adjusts spending $S(t)$ to reduce error. A **PID controller** generates control action:

$$u(t) = K_p e(t) + K_i \int_0^t e(\tau) \, d\tau + K_d \frac{de}{dt} \tag{A.35}$$

### A.5.2 Financial Interpretation of PID Terms

**Proportional Term** ($K_p e$): Immediate response to deviation.
- "I'm $500 below target → cut spending by $K_p \times 500$ this month"
- Provides rapid correction but cannot eliminate steady-state error alone

**Integral Term** ($K_i \int e \, d\tau$): Accumulated historical error.
- "I've been below target for 6 months → make structural lifestyle changes"
- Eliminates steady-state error but risks overshoot and oscillation

**Derivative Term** ($K_d \frac{de}{dt}$): Rate of error change.
- "My gap is widening at $100/month → preemptive action now"
- This is precisely the **velocity-based early warning** already implemented in the signal dynamics framework

### A.5.3 Acceleration as Derivative of Derivative Control

The financial acceleration $a(t) = d^2V/dt^2$ provides **derivative of velocity**, enabling second-order predictive control:

$$u_{advanced}(t) = K_p e + K_i \int e \, d\tau + K_d \dot{e} + K_{dd} \ddot{e} \tag{A.36}$$

where $\ddot{e} = -a(t)$ (error acceleration, opposite sign of balance acceleration). This **PIDD controller** detects not just that the financial situation is deteriorating, but whether the deterioration is itself accelerating—a critical early warning absent from standard financial planning.

### A.5.4 Stability of the Controlled System

The closed-loop transfer function for a PID-controlled financial system can exhibit:
- **Overdamped response**: Slow but stable return to target (conservative saver)
- **Critically damped**: Fastest return without overshoot (optimal)
- **Underdamped**: Oscillations around target (reactive saver, boom-bust cycles)
- **Unstable**: Unbounded deviation (poor gain tuning, financial crisis)

Proper tuning of $K_p$, $K_i$, $K_d$ represents the behavioral economics of individual financial decision-making—an avenue for future empirical research.

---

## A.6 Stochastic Extensions (Outline)

### A.6.1 Brownian Motion for Market Prices

Market prices follow **Geometric Brownian Motion** (GBM):

$$dP = \mu P \, dt + \sigma P \, dW_t \tag{A.37}$$

where $\mu$ is drift (expected return), $\sigma$ is volatility, and $W_t$ is a Wiener process.

### A.6.2 Stochastic Investment Value

Combining with $V = nP$:

$$dV = n \, dP = n(\mu P \, dt + \sigma P \, dW_t) = \mu V \, dt + \sigma V \, dW_t \tag{A.38}$$

The investment account itself follows GBM—a well-known result, here derived from the fluid-thermodynamic framework.

### A.6.3 Fluctuation-Dissipation Analogy (Statistical Mechanics)

Market volatility $\sigma$ plays the role of **thermal fluctuations**. The fluctuation-dissipation theorem relates fluctuations to dissipative response:

$$\langle (\Delta V)^2 \rangle \propto k_B T \tag{A.39}$$

In the financial analogue, high "temperature" (sentiment) produces high variance in returns—consistent with the $RT = P^2$ relationship (Eq. A.18) where temperature proxies for volatility.

*Further development of statistical mechanics analogues is reserved for future work, as the classical framework provides sufficient foundation for the present analysis.*

---

## Summary of Key Equations

| Equation | Number | Description |
|----------|--------|-------------|
| $\frac{dV}{dt} = Q_{in} - Q_{out}$ | (A.1) | Fundamental balance equation |
| $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ | (A.8) | State-space formulation |
| $v = dV/dt = I - S$ | (A.11) | Financial velocity |
| $a = dv/dt$ | (A.13) | Financial acceleration |
| $PV = nRT$ | (A.17) | Ideal gas analogue for investments |
| $dU = \delta Q - \delta W$ | (A.22) | First Law for investments |
| $\delta Q = n \, dP$ | (A.24) | Unrealized appreciation as heat |
| $\delta W = -P \, dn$ | (A.25) | Realized gains as work |
| $\eta_{Carnot} = 1 - P_L/P_H$ | (A.30) | Maximum investment efficiency |
| $\text{Re}(\lambda_i) < 0$ | (A.31) | Stability criterion |
| PID control law | (A.35) | Financial decision-making model |

---

*End of Appendix A*
