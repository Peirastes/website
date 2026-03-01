// Use global React hooks and THREE from CDN
const { useState, useEffect, useRef, useCallback, useMemo } = React;
const THREE = window.THREE;

// ============================================================================
// KATEX FORMULA COMPONENT
// ============================================================================

function KaTeXFormula({ tex, color, style }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { displayMode: false, throwOnError: false });
    } catch (e) {
      return tex;
    }
  }, [tex]);
  return (
    <span
      className="katex-equation"
      style={{ color, ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ============================================================================
// NUMERICAL INTEGRATORS
// ============================================================================

function rk4Step(f, t, z, dt, params) {
  const k1 = f(t, z, params);
  const k2 = f(t + dt/2, z.map((zi, i) => zi + dt * k1[i] / 2), params);
  const k3 = f(t + dt/2, z.map((zi, i) => zi + dt * k2[i] / 2), params);
  const k4 = f(t + dt, z.map((zi, i) => zi + dt * k3[i]), params);
  return z.map((zi, i) => zi + (dt / 6) * (k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
}

function integrate(f, z0, tSpan, dt, params, options = {}) {
  const [t0, t1] = tSpan;
  const nSteps = Math.ceil((t1 - t0) / dt);
  const t = [];
  const z = [];
  
  let zCurrent = [...z0];
  let tCurrent = t0;
  
  t.push(tCurrent);
  z.push([...zCurrent]);
  
  for (let i = 0; i < nSteps; i++) {
    // Ground collision for projectile
    if (options.groundCollision && zCurrent[1] <= 0 && zCurrent[3] < 0) {
      const e = params.e || 0.4;
      zCurrent[1] = 0;
      zCurrent[3] = -e * zCurrent[3];
      if (Math.abs(zCurrent[3]) < 0.5) {
        zCurrent[3] = 0;
      }
    }
    
    zCurrent = rk4Step(f, tCurrent, zCurrent, dt, params);
    tCurrent += dt;
    
    t.push(tCurrent);
    z.push([...zCurrent]);
  }
  
  return { t, z };
}

// ============================================================================
// RHS FUNCTIONS - ALL ARCHETYPES FROM ORIGINAL CODE
// ============================================================================

// --- A: Growth / Relaxation ---
const rhsLogistic = (t, [x], { r = 1, K = 1 }) => [r * x * (1 - x / K)];

const rhsRelaxation = (t, [T], { tau = 1, T_env = 0 }) => [-(T - T_env) / tau];

// --- B: Oscillators ---
const rhsLinearOscillator = (t, [x, v], { omega0 = 1, zeta = 0, F0 = 0, omegaDrive = 0 }) => [
  v,
  -2 * zeta * omega0 * v - omega0 * omega0 * x + F0 * Math.cos(omegaDrive * t)
];

const rhsPendulum = (t, [theta, omega], { g = 9.81, L = 1, zeta = 0, F0 = 0, omegaDrive = 0 }) => [
  omega,
  -(g / L) * Math.sin(theta) - 2 * zeta * omega + F0 * Math.cos(omegaDrive * t)
];

const rhsVanDerPol = (t, [x, y], { mu = 1 }) => [
  y,
  mu * (1 - x * x) * y - x
];

const rhsHopf = (t, [x, y], { lambda = 0.5, omega = 1 }) => {
  const r2 = x * x + y * y;
  return [
    (lambda - r2) * x - omega * y,
    (lambda - r2) * y + omega * x
  ];
};

const rhsDuffing = (t, [x, v], { alpha = 1, beta = 1, delta = 0.2, gamma = 0.3, omegaDrive = 1.2 }) => [
  v,
  -delta * v - alpha * x - beta * x * x * x + gamma * Math.cos(omegaDrive * t)
];

// --- C: Multi-well / Manifolds ---
const rhsDoubleWell = (t, [x], { a = 1, b = 1 }) => [a * x - b * x * x * x];

const rhsSaddleNode = (t, [x], { r = 0 }) => [r + x * x];

const rhsPitchfork = (t, [x], { r = 0 }) => [r * x - x * x * x];

// --- D: Chaos ---
const rhsLorenz = (t, [x, y, z], { sigma = 10, rho = 28, beta = 8/3 }) => [
  sigma * (y - x),
  x * (rho - z) - y,
  x * y - beta * z
];

const rhsRossler = (t, [x, y, z], { a = 0.2, b = 0.2, c = 5.7 }) => [
  -y - z,
  x + a * y,
  b + z * (x - c)
];

const rhsChua = (t, [x, y, z], { alpha = 15.6, beta = 28, m0 = -1.143, m1 = -0.714 }) => {
  const h = m1 * x + 0.5 * (m0 - m1) * (Math.abs(x + 1) - Math.abs(x - 1));
  return [
    alpha * (y - x - h),
    x - y + z,
    -beta * y
  ];
};

// --- E: Particle / Kinetic ---
const rhsProjectile = (t, [x, y, vx, vy], { g = 9.81, drag = 0 }) => [
  vx,
  vy,
  -drag * vx,
  -g - drag * vy
];

const rhsKepler = (t, [x, y, vx, vy], { mu = 1 }) => {
  const r = Math.sqrt(x * x + y * y) + 1e-10;
  const r3 = r * r * r;
  return [vx, vy, -mu * x / r3, -mu * y / r3];
};

const rhsUniformB = (t, [x, y, vx, vy], { qOverM = 1, Bz = 1 }) => [
  vx,
  vy,
  qOverM * vy * Bz,
  -qOverM * vx * Bz
];

const rhsThreeBody = (t, state, { m1 = 1, m2 = 1, m3 = 1, G = 1 }) => {
  const [x1, y1, x2, y2, x3, y3, vx1, vy1, vx2, vy2, vx3, vy3] = state;
  
  const r12 = Math.sqrt((x2-x1)**2 + (y2-y1)**2) + 1e-10;
  const r13 = Math.sqrt((x3-x1)**2 + (y3-y1)**2) + 1e-10;
  const r23 = Math.sqrt((x3-x2)**2 + (y3-y2)**2) + 1e-10;
  
  const ax1 = G * m2 * (x2-x1)/r12**3 + G * m3 * (x3-x1)/r13**3;
  const ay1 = G * m2 * (y2-y1)/r12**3 + G * m3 * (y3-y1)/r13**3;
  const ax2 = G * m1 * (x1-x2)/r12**3 + G * m3 * (x3-x2)/r23**3;
  const ay2 = G * m1 * (y1-y2)/r12**3 + G * m3 * (y3-y2)/r23**3;
  const ax3 = G * m1 * (x1-x3)/r13**3 + G * m2 * (x2-x3)/r23**3;
  const ay3 = G * m1 * (y1-y3)/r13**3 + G * m2 * (y2-y3)/r23**3;
  
  return [vx1, vy1, vx2, vy2, vx3, vy3, ax1, ay1, ax2, ay2, ax3, ay3];
};

// --- F: Feedback / Interaction ---
const rhsLotkaVolterra = (t, [x, y], { alpha = 1.5, beta = 1, delta = 1, gamma = 3 }) => [
  alpha * x - beta * x * y,
  delta * x * y - gamma * y
];

const rhsSIR = (t, [S, I, R], { beta = 0.4, gamma = 0.1 }) => [
  -beta * S * I,
  beta * S * I - gamma * I,
  gamma * I
];

const rhsSEIR = (t, [S, E, I, R], { beta = 0.5, sigma = 0.2, gamma = 0.1 }) => [
  -beta * S * I,
  beta * S * I - sigma * E,
  sigma * E - gamma * I,
  gamma * I
];

const rhsCompetition = (t, [x, y], { r1 = 1, r2 = 1, K1 = 1, K2 = 1, a12 = 0.5, a21 = 0.5 }) => [
  r1 * x * (1 - (x + a12 * y) / K1),
  r2 * y * (1 - (y + a21 * x) / K2)
];

// --- G: Chemical / Reaction-Diffusion ---
const rhsBrusselator = (t, [x, y], { A = 1, B = 3 }) => [
  A + x * x * y - (B + 1) * x,
  B * x - x * x * y
];

const rhsOregonator = (t, [x, y, z], { epsilon = 0.04, delta = 0.0004, q = 0.0008, f = 1 }) => [
  (q * y - x * y + x * (1 - x)) / epsilon,
  (-q * y - x * y + f * z) / delta,
  x - z
];

// --- H: Neuronal ---
const rhsFitzHughNagumo = (t, [v, w], { a = 0.7, b = 0.8, tau = 12.5, I = 0.5 }) => [
  v - v * v * v / 3 - w + I,
  (v + a - b * w) / tau
];

const rhsHindmarshRose = (t, [x, y, z], { a = 1, b = 3, c = 1, d = 5, r = 0.006, s = 4, xR = -1.6, I = 3.25 }) => [
  y - a * x * x * x + b * x * x - z + I,
  c - d * x * x - y,
  r * (s * (x - xR) - z)
];

// ============================================================================
// PDE SOLVER CLASSES
// ============================================================================

class HeatSolver2D {
  constructor(nx, ny, params = {}) {
    this.nx = nx; this.ny = ny;
    this.alpha = params.alpha || 0.01;
    this.u = new Float32Array(nx * ny);
    this.lap = new Float32Array(nx * ny);
    this.time = 0;
  }
  idx(i, j) { return j * this.nx + i; }
  fill(v) { this.u.fill(v); }
  setCircle(cx, cy, r, v) {
    for (let j = 0; j < this.ny; j++)
      for (let i = 0; i < this.nx; i++)
        if ((i-cx)**2 + (j-cy)**2 <= r*r) this.u[this.idx(i,j)] = v;
  }
  setRect(x0, y0, x1, y1, v) {
    for (let j = Math.max(0,y0); j < Math.min(this.ny,y1); j++)
      for (let i = Math.max(0,x0); i < Math.min(this.nx,x1); i++)
        this.u[this.idx(i,j)] = v;
  }
  step(dt) {
    const {nx, ny, alpha, u, lap} = this;
    for (let j = 1; j < ny-1; j++)
      for (let i = 1; i < nx-1; i++) {
        const idx = j*nx + i;
        lap[idx] = u[idx+1] + u[idx-1] + u[idx+nx] + u[idx-nx] - 4*u[idx];
      }
    for (let j = 1; j < ny-1; j++)
      for (let i = 1; i < nx-1; i++) {
        const idx = j*nx + i;
        u[idx] += alpha * lap[idx] * dt;
      }
    this.time += dt;
  }
}

class WaveSolver1D {
  constructor(nx, params = {}) {
    this.nx = nx;
    this.c = params.c || 1;
    this.damping = params.damping || 0.001;
    this.u = new Float32Array(nx);
    this.v = new Float32Array(nx);
    this.time = 0;
  }
  pluck(pos, width, amp) {
    for (let i = 0; i < this.nx; i++) {
      const x = i / this.nx;
      this.u[i] = amp * Math.exp(-((x - pos)**2) / (2*width*width));
    }
  }
  step(dt) {
    const {nx, c, damping, u, v} = this;
    for (let i = 1; i < nx-1; i++) {
      const lap = u[i+1] - 2*u[i] + u[i-1];
      v[i] += (c*c * lap * nx*nx - damping * v[i]) * dt;
    }
    for (let i = 1; i < nx-1; i++) u[i] += v[i] * dt;
    u[0] = 0; u[nx-1] = 0;
    this.time += dt;
  }
}

class WaveSolver2D {
  constructor(nx, ny, params = {}) {
    this.nx = nx; this.ny = ny;
    this.c = params.c || 1;
    this.damping = params.damping || 0.005;
    this.u = new Float32Array(nx * ny);
    this.v = new Float32Array(nx * ny);
    this.lap = new Float32Array(nx * ny);
    this.obstacle = new Uint8Array(nx * ny);
    this.time = 0;
    
    // Apply boundary type
    if (params.boundaryType === 'box' && params.boxMargin) {
      this.addBoxBoundary(params.boxMargin);
    }
    
    // Apply obstacle type
    if (params.obstacleType && params.obstacleType !== 'none') {
      this.addObstaclePreset(params.obstacleType);
    }
  }
  idx(i, j) { return j * this.nx + i; }
  
  tap(cx, cy, width, amp) {
    for (let j = 0; j < this.ny; j++)
      for (let i = 0; i < this.nx; i++) {
        const r2 = (i-cx)**2 + (j-cy)**2;
        if (!this.obstacle[this.idx(i,j)])
          this.u[this.idx(i,j)] += amp * Math.exp(-r2 / (2*width*width));
      }
  }
  
  addObstacle(x0, y0, x1, y1) {
    for (let j = y0; j < y1; j++)
      for (let i = x0; i < x1; i++)
        if (i >= 0 && i < this.nx && j >= 0 && j < this.ny)
          this.obstacle[this.idx(i,j)] = 1;
  }
  
  addCircleObstacle(cx, cy, r) {
    for (let j = 0; j < this.ny; j++)
      for (let i = 0; i < this.nx; i++)
        if ((i-cx)**2 + (j-cy)**2 < r*r)
          this.obstacle[this.idx(i,j)] = 1;
  }
  
  addBoxBoundary(margin) {
    // Add inner rectangular boundary (waves bounce inside a box)
    const m = margin;
    // Top wall
    this.addObstacle(m, this.ny - m - 2, this.nx - m, this.ny - m);
    // Bottom wall
    this.addObstacle(m, m, this.nx - m, m + 2);
    // Left wall
    this.addObstacle(m, m, m + 2, this.ny - m);
    // Right wall
    this.addObstacle(this.nx - m - 2, m, this.nx - m, this.ny - m);
  }
  
  addObstaclePreset(type) {
    const cx = Math.floor(this.nx / 2);
    const cy = Math.floor(this.ny / 2);
    
    switch(type) {
      case 'slit':
        // Vertical barrier with single slit
        const slitW = 3;
        const slitH = 12;
        this.addObstacle(cx - 1, 0, cx + 1, cy - slitH/2);
        this.addObstacle(cx - 1, cy + slitH/2, cx + 1, this.ny);
        break;
        
      case 'double-slit':
        // Vertical barrier with double slit
        const dSlitGap = 8;
        const dSlitH = 8;
        this.addObstacle(cx - 1, 0, cx + 1, cy - dSlitGap - dSlitH);
        this.addObstacle(cx - 1, cy - dSlitGap, cx + 1, cy + dSlitGap);
        this.addObstacle(cx - 1, cy + dSlitGap + dSlitH, cx + 1, this.ny);
        break;
        
      case 'circle':
        // Circular obstacle in center
        this.addCircleObstacle(cx, cy, Math.min(this.nx, this.ny) / 6);
        break;
        
      case 'random':
        // Random small obstacles
        for (let n = 0; n < 8; n++) {
          const rx = Math.floor(Math.random() * (this.nx - 20) + 10);
          const ry = Math.floor(Math.random() * (this.ny - 20) + 10);
          const rr = Math.floor(Math.random() * 5 + 3);
          this.addCircleObstacle(rx, ry, rr);
        }
        break;
    }
  }
  
  clearObstacles() {
    this.obstacle.fill(0);
  }
  
  step(dt) {
    const {nx, ny, c, damping, u, v, lap, obstacle} = this;
    // Use smaller effective dt for stability (CFL condition)
    const effectiveDt = Math.min(dt, 0.1 / c);
    const c2 = c * c;
    
    // Compute Laplacian
    for (let j = 1; j < ny-1; j++)
      for (let i = 1; i < nx-1; i++) {
        const idx = j*nx + i;
        if (!obstacle[idx])
          lap[idx] = u[idx+1] + u[idx-1] + u[idx+nx] + u[idx-nx] - 4*u[idx];
      }
    
    // Update velocity
    for (let j = 1; j < ny-1; j++)
      for (let i = 1; i < nx-1; i++) {
        const idx = j*nx + i;
        if (!obstacle[idx])
          v[idx] += (c2 * lap[idx] - damping * v[idx]) * effectiveDt;
      }
    
    // Update displacement
    for (let j = 1; j < ny-1; j++)
      for (let i = 1; i < nx-1; i++) {
        const idx = j*nx + i;
        if (!obstacle[idx]) u[idx] += v[idx] * effectiveDt;
      }
    
    // Fixed boundaries
    for (let i = 0; i < nx; i++) { u[i] = 0; u[(ny-1)*nx+i] = 0; v[i] = 0; v[(ny-1)*nx+i] = 0; }
    for (let j = 0; j < ny; j++) { u[j*nx] = 0; u[j*nx+nx-1] = 0; v[j*nx] = 0; v[j*nx+nx-1] = 0; }
    
    // Set obstacle cells to zero
    for (let idx = 0; idx < nx * ny; idx++) {
      if (obstacle[idx]) { u[idx] = 0; v[idx] = 0; }
    }
    
    this.time += effectiveDt;
  }
}

class GrayScottSolver {
  constructor(nx, ny, params = {}) {
    this.nx = nx; this.ny = ny;
    this.Du = params.Du || 0.16;
    this.Dv = params.Dv || 0.08;
    this.f = params.f || 0.035;
    this.k = params.k || 0.065;
    this.u = new Float32Array(nx * ny);
    this.uv = new Float32Array(nx * ny);
    this.lapU = new Float32Array(nx * ny);
    this.lapV = new Float32Array(nx * ny);
    this.time = 0;
    this.u.fill(1); this.uv.fill(0);
  }
  idx(i, j) { return j * this.nx + i; }
  seed(cx, cy, r) {
    for (let j = 0; j < this.ny; j++)
      for (let i = 0; i < this.nx; i++)
        if ((i-cx)**2 + (j-cy)**2 < r*r) {
          const idx = this.idx(i, j);
          this.u[idx] = 0.5 + Math.random() * 0.1;
          this.uv[idx] = 0.25 + Math.random() * 0.1;
        }
  }
  step(dt) {
    const {nx, ny, Du, Dv, f, k, u, uv, lapU, lapV} = this;
    for (let j = 1; j < ny-1; j++)
      for (let i = 1; i < nx-1; i++) {
        const idx = j*nx + i;
        lapU[idx] = u[idx+1] + u[idx-1] + u[idx+nx] + u[idx-nx] - 4*u[idx];
        lapV[idx] = uv[idx+1] + uv[idx-1] + uv[idx+nx] + uv[idx-nx] - 4*uv[idx];
      }
    for (let j = 1; j < ny-1; j++)
      for (let i = 1; i < nx-1; i++) {
        const idx = j*nx + i;
        const uvv = u[idx] * uv[idx] * uv[idx];
        u[idx] += (Du * lapU[idx] - uvv + f * (1 - u[idx])) * dt;
        uv[idx] += (Dv * lapV[idx] + uvv - (f + k) * uv[idx]) * dt;
      }
    for (let i = 0; i < nx; i++) {
      u[i] = u[(ny-2)*nx+i]; u[(ny-1)*nx+i] = u[nx+i];
      uv[i] = uv[(ny-2)*nx+i]; uv[(ny-1)*nx+i] = uv[nx+i];
    }
    for (let j = 0; j < ny; j++) {
      u[j*nx] = u[j*nx+nx-2]; u[j*nx+nx-1] = u[j*nx+1];
      uv[j*nx] = uv[j*nx+nx-2]; uv[j*nx+nx-1] = uv[j*nx+1];
    }
    this.time += dt;
  }
}

class LBMSolver {
  constructor(nx, ny, params = {}) {
    this.nx = nx; this.ny = ny;
    this.omega = params.omega || 1.7;
    this.ex = [0, 1, 0, -1, 0, 1, -1, -1, 1];
    this.ey = [0, 0, 1, 0, -1, 1, 1, -1, -1];
    this.w = [4/9, 1/9, 1/9, 1/9, 1/9, 1/36, 1/36, 1/36, 1/36];
    this.opp = [0, 3, 4, 1, 2, 7, 8, 5, 6];
    this.f = Array(9).fill().map(() => new Float32Array(nx * ny));
    this.fTemp = Array(9).fill().map(() => new Float32Array(nx * ny));
    this.rho = new Float32Array(nx * ny);
    this.ux = new Float32Array(nx * ny);
    this.uy = new Float32Array(nx * ny);
    this.obstacle = new Uint8Array(nx * ny);
    this.time = 0;
    this.init(1, 0.08, 0);
  }
  init(rho0, ux0, uy0) {
    for (let idx = 0; idx < this.nx * this.ny; idx++) {
      this.rho[idx] = rho0; this.ux[idx] = ux0; this.uy[idx] = uy0;
      for (let k = 0; k < 9; k++) {
        const eu = this.ex[k]*ux0 + this.ey[k]*uy0;
        this.f[k][idx] = this.w[k] * rho0 * (1 + 3*eu + 4.5*eu*eu - 1.5*(ux0*ux0+uy0*uy0));
      }
    }
  }
  addCircleObstacle(cx, cy, r) {
    for (let j = 0; j < this.ny; j++)
      for (let i = 0; i < this.nx; i++)
        if ((i-cx)**2 + (j-cy)**2 < r*r) this.obstacle[j*this.nx + i] = 1;
  }
  step() {
    const {nx, ny, omega, ex, ey, w, opp, f, fTemp, rho, ux, uy, obstacle} = this;
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const idx = j*nx + i;
        if (obstacle[idx]) continue;
        let r = 0, u = 0, v = 0;
        for (let k = 0; k < 9; k++) { r += f[k][idx]; u += ex[k]*f[k][idx]; v += ey[k]*f[k][idx]; }
        rho[idx] = r; ux[idx] = u/r; uy[idx] = v/r;
        for (let k = 0; k < 9; k++) {
          const eu = ex[k]*ux[idx] + ey[k]*uy[idx];
          const feq = w[k] * r * (1 + 3*eu + 4.5*eu*eu - 1.5*(ux[idx]**2+uy[idx]**2));
          fTemp[k][idx] = f[k][idx] + omega * (feq - f[k][idx]);
        }
      }
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++)
        for (let k = 0; k < 9; k++) {
          const ni = (i + ex[k] + nx) % nx;
          const nj = (j + ey[k] + ny) % ny;
          const idxSrc = j*nx + i, idxDst = nj*nx + ni;
          if (obstacle[idxDst]) f[opp[k]][idxSrc] = fTemp[k][idxSrc];
          else f[k][idxDst] = fTemp[k][idxSrc];
        }
    const u0 = 0.08;
    for (let j = 1; j < ny-1; j++) {
      const idx = j*nx;
      if (!obstacle[idx]) {
        ux[idx] = u0; uy[idx] = 0;
        for (let k = 0; k < 9; k++) {
          const eu = ex[k]*u0;
          f[k][idx] = w[k] * rho[idx] * (1 + 3*eu + 4.5*eu*eu - 1.5*u0*u0);
        }
      }
    }
    this.time++;
  }
  getVorticity() {
    const {nx, ny, ux, uy} = this;
    const vort = new Float32Array(nx * ny);
    for (let j = 1; j < ny-1; j++)
      for (let i = 1; i < nx-1; i++) {
        const idx = j*nx + i;
        vort[idx] = (uy[idx+1] - uy[idx-1])/2 - (ux[idx+nx] - ux[idx-nx])/2;
      }
    return vort;
  }
}

// Doppler Effect 3D Engine
class DopplerEngine {
  constructor(params = {}) {
    this.c = params.waveSpeed || 4.0;
    this.vs = params.sourceSpeed || 1.5;
    this.fs = params.frequency || 0.5;
    this.amplitude = params.amplitude || 1.0;
    this.omega = 2 * Math.PI * this.fs;
    
    this.observerPos = new THREE.Vector3(0, 0, 0);
    this.sourceStartY = params.sourceStartY || -12;
    
    this.time = 0;
    this.wavefronts = [];
    this.detectionEvents = [];
    this.measuredFrequencies = [];
    this.lastEmissionTime = -Infinity;
    this.lastDetectionTime = -Infinity;
    this.emissionInterval = 1 / (2 * this.fs);
    
    this.detectThreshold = params.detectThreshold || 0.2;
    this.detectionDebounce = params.detectionDebounce || 0.1;
    this.maxRadius = params.maxRadius || 25;
  }
  
  getSourcePosition(t) {
    return new THREE.Vector3(0, this.sourceStartY + this.vs * t, 0);
  }
  
  step(dt) {
    this.time += dt;
    const t = this.time;
    
    if (t - this.lastEmissionTime >= this.emissionInterval) {
      const srcPos = this.getSourcePosition(t);
      this.wavefronts.push({
        emissionTime: t,
        emissionPos: srcPos.clone(),
        detected: false,
        radius: 0
      });
      this.lastEmissionTime = t;
    }
    
    for (let i = this.wavefronts.length - 1; i >= 0; i--) {
      const wf = this.wavefronts[i];
      wf.radius = (t - wf.emissionTime) * this.c;
      
      if (!wf.detected && t - this.lastDetectionTime > this.detectionDebounce) {
        const distToObserver = wf.emissionPos.distanceTo(this.observerPos);
        
        if (Math.abs(wf.radius - distToObserver) < this.detectThreshold) {
          wf.detected = true;
          this.detectionEvents.push(t);
          this.lastDetectionTime = t;
          
          if (this.detectionEvents.length > 1) {
            const n = this.detectionEvents.length;
            const period = this.detectionEvents[n - 1] - this.detectionEvents[n - 2];
            const freq = period > 0 ? 1 / period : 0;
            this.measuredFrequencies.push({ t, frequency: freq, period });
          }
        }
      }
      
      if (wf.radius > this.maxRadius) {
        this.wavefronts.splice(i, 1);
      }
    }
  }
  
  buildSignalWavePoints(numPoints = 200) {
    const points = [];
    const srcPos = this.getSourcePosition(this.time);
    const yMin = -18;
    const yMax = 18;
    
    for (let i = 0; i < numPoints; i++) {
      const y = yMin + (yMax - yMin) * (i / (numPoints - 1));
      const delta = y - srcPos.y;
      
      let tau;
      if (delta >= 0) {
        tau = this.time - delta / (this.c - this.vs);
      } else {
        tau = this.time + delta / (this.c + this.vs);
      }
      
      if (tau < 0) tau = 0;
      
      const phase = this.omega * tau;
      const z = this.amplitude * Math.sin(phase);
      
      points.push(new THREE.Vector3(0, y, z));
    }
    
    return points;
  }
  
  getTheoreticalFrequency() {
    const srcPos = this.getSourcePosition(this.time);
    const dy = this.observerPos.y - srcPos.y;
    const vRadial = dy > 0 ? this.vs : -this.vs;
    const denom = this.c - vRadial;
    if (Math.abs(denom) < 0.01) return this.fs * 10;
    return this.fs * this.c / denom;
  }
  
  reset() {
    this.time = 0;
    this.wavefronts = [];
    this.detectionEvents = [];
    this.measuredFrequencies = [];
    this.lastEmissionTime = -Infinity;
    this.lastDetectionTime = -Infinity;
  }
  
  updateParams(params) {
    if (params.waveSpeed !== undefined) this.c = params.waveSpeed;
    if (params.sourceSpeed !== undefined) this.vs = params.sourceSpeed;
    if (params.frequency !== undefined) {
      this.fs = params.frequency;
      this.omega = 2 * Math.PI * this.fs;
      this.emissionInterval = 1 / (2 * this.fs);
    }
    if (params.amplitude !== undefined) this.amplitude = params.amplitude;
    if (params.sourceStartY !== undefined) this.sourceStartY = params.sourceStartY;
  }
}

// ============================================================================
// SYSTEM CATALOG - Complete taxonomy
// ============================================================================

const SYSTEMS = {
  // === A: Growth / Relaxation ===
  logistic: {
    id: 'logistic',
    name: 'Logistic Growth',
    category: 'A',
    categoryName: 'Growth & Relaxation',
    description: 'Population growth with carrying capacity. The canonical S-curve.',
    equations: '\\dot{x} = rx(1 - x/K)',
    rhs: rhsLogistic,
    defaultParams: { r: 1, K: 1 },
    defaultZ0: [0.1],
    defaultTSpan: [0, 10],
    stateLabels: ['x'],
    paramLabels: { r: 'Growth rate r', K: 'Carrying capacity K' },
    paramRanges: { r: [0.1, 5], K: [0.5, 10] },
  },
  relaxation: {
    id: 'relaxation',
    name: 'Exponential Relaxation',
    category: 'A',
    categoryName: 'Growth & Relaxation',
    description: 'RC discharge, Newton cooling, radioactive decay. First-order approach to equilibrium.',
    equations: '\\dot{T} = -(T - T_{\\text{env}})/\\tau',
    rhs: rhsRelaxation,
    defaultParams: { tau: 2, T_env: 0 },
    defaultZ0: [1],
    defaultTSpan: [0, 15],
    stateLabels: ['T'],
    paramLabels: { tau: 'Time constant \u03C4', T_env: 'Environment T_env' },
    paramRanges: { tau: [0.1, 10], T_env: [-5, 5] },
  },
  
  // === B: Oscillators ===
  sho: {
    id: 'sho',
    name: 'Simple Harmonic Oscillator',
    category: 'B',
    categoryName: 'Oscillators',
    description: 'Mass-spring system, LC circuit. Undamped sinusoidal motion.',
    equations: '\\ddot{x} + \\omega_0^2 x = 0',
    rhs: rhsLinearOscillator,
    defaultParams: { omega0: 1, zeta: 0, F0: 0, omegaDrive: 0 },
    defaultZ0: [1, 0],
    defaultTSpan: [0, 30],
    stateLabels: ['x', 'v'],
    paramLabels: { omega0: 'Natural freq \u03C9\u2080', zeta: 'Damping \u03B6', F0: 'Drive amplitude', omegaDrive: 'Drive freq' },
    paramRanges: { omega0: [0.1, 5], zeta: [0, 1], F0: [0, 2], omegaDrive: [0, 5] },
  },
  dampedOscillator: {
    id: 'dampedOscillator',
    name: 'Damped Oscillator',
    category: 'B',
    categoryName: 'Oscillators',
    description: 'Energy dissipation through friction. Underdamped, critical, overdamped regimes.',
    equations: '\\ddot{x} + 2\\zeta\\omega_0\\dot{x} + \\omega_0^2 x = 0',
    rhs: rhsLinearOscillator,
    defaultParams: { omega0: 1, zeta: 0.15, F0: 0, omegaDrive: 0 },
    defaultZ0: [1, 0],
    defaultTSpan: [0, 30],
    stateLabels: ['x', 'v'],
    paramLabels: { omega0: 'Natural freq \u03C9\u2080', zeta: 'Damping \u03B6', F0: 'Drive amplitude', omegaDrive: 'Drive freq' },
    paramRanges: { omega0: [0.1, 5], zeta: [0, 2], F0: [0, 2], omegaDrive: [0, 5] },
  },
  drivenOscillator: {
    id: 'drivenOscillator',
    name: 'Driven Oscillator',
    category: 'B',
    categoryName: 'Oscillators',
    description: 'Resonance, beating, forced response. Foundation of spectroscopy.',
    equations: '\\ddot{x} + 2\\zeta\\omega_0\\dot{x} + \\omega_0^2 x = F_0\\cos(\\omega t)',
    rhs: rhsLinearOscillator,
    defaultParams: { omega0: 1, zeta: 0.1, F0: 0.5, omegaDrive: 1.0 },
    defaultZ0: [0, 0],
    defaultTSpan: [0, 60],
    stateLabels: ['x', 'v'],
    paramLabels: { omega0: 'Natural freq \u03C9\u2080', zeta: 'Damping \u03B6', F0: 'Drive amplitude', omegaDrive: 'Drive freq' },
    paramRanges: { omega0: [0.1, 5], zeta: [0, 1], F0: [0, 3], omegaDrive: [0, 5] },
  },
  pendulum: {
    id: 'pendulum',
    name: 'Nonlinear Pendulum',
    category: 'B',
    categoryName: 'Oscillators',
    description: 'Large-angle swings. Period depends on amplitude, unlike linear oscillators.',
    equations: '\\ddot{\\theta} + (g/L)\\sin\\theta = 0',
    rhs: rhsPendulum,
    defaultParams: { g: 9.81, L: 1, zeta: 0.02, F0: 0, omegaDrive: 0 },
    defaultZ0: [2.5, 0],
    defaultTSpan: [0, 20],
    stateLabels: ['\u03B8', '\u03C9'],
    paramLabels: { g: 'Gravity g', L: 'Length L', zeta: 'Damping \u03B6', F0: 'Drive torque', omegaDrive: 'Drive freq' },
    paramRanges: { g: [1, 20], L: [0.1, 5], zeta: [0, 0.5], F0: [0, 2], omegaDrive: [0, 5] },
  },
  vanDerPol: {
    id: 'vanDerPol',
    name: 'Van der Pol Oscillator',
    category: 'B',
    categoryName: 'Oscillators',
    description: 'Self-sustained oscillation. Negative damping at small amplitude, positive at large. Relaxation oscillations.',
    equations: '\\ddot{x} - \\mu(1-x^2)\\dot{x} + x = 0',
    rhs: rhsVanDerPol,
    defaultParams: { mu: 1.5 },
    defaultZ0: [0.1, 0],
    defaultTSpan: [0, 40],
    stateLabels: ['x', '\u1E8B'],
    paramLabels: { mu: 'Nonlinearity \u03BC' },
    paramRanges: { mu: [0.1, 8] },
  },
  hopf: {
    id: 'hopf',
    name: 'Hopf Bifurcation',
    category: 'B',
    categoryName: 'Oscillators',
    description: 'Normal form for birth of limit cycle. Supercritical Hopf at \u03BB=0.',
    equations: '\\dot{x} = (\\lambda - r^2)x - \\omega y,\\; \\dot{y} = (\\lambda - r^2)y + \\omega x',
    rhs: rhsHopf,
    defaultParams: { lambda: 0.5, omega: 1 },
    defaultZ0: [0.1, 0],
    defaultTSpan: [0, 30],
    stateLabels: ['x', 'y'],
    paramLabels: { lambda: 'Bifurcation \u03BB', omega: 'Angular freq \u03C9' },
    paramRanges: { lambda: [-1, 2], omega: [0.1, 5] },
  },
  duffing: {
    id: 'duffing',
    name: 'Duffing Oscillator',
    category: 'B',
    categoryName: 'Oscillators',
    description: 'Cubic nonlinearity. Hardening/softening springs. Route to chaos under forcing.',
    equations: '\\ddot{x} + \\delta\\dot{x} + \\alpha x + \\beta x^3 = \\gamma\\cos(\\omega t)',
    rhs: rhsDuffing,
    defaultParams: { alpha: -1, beta: 1, delta: 0.2, gamma: 0.3, omegaDrive: 1.2 },
    defaultZ0: [0.5, 0],
    defaultTSpan: [0, 100],
    stateLabels: ['x', 'v'],
    paramLabels: { alpha: 'Linear \u03B1', beta: 'Cubic \u03B2', delta: 'Damping \u03B4', gamma: 'Drive \u03B3', omegaDrive: 'Drive freq \u03C9' },
    paramRanges: { alpha: [-2, 2], beta: [-2, 2], delta: [0, 1], gamma: [0, 1], omegaDrive: [0.5, 2] },
  },
  
  // === C: Multi-well / Manifolds ===
  doubleWell: {
    id: 'doubleWell',
    name: 'Double-Well Potential',
    category: 'C',
    categoryName: 'Bifurcations & Manifolds',
    description: 'Bistability. Two stable equilibria separated by an unstable saddle. Phase transitions.',
    equations: '\\dot{x} = ax - bx^3',
    rhs: rhsDoubleWell,
    defaultParams: { a: 1, b: 1 },
    defaultZ0: [0.1],
    defaultTSpan: [0, 10],
    stateLabels: ['x'],
    paramLabels: { a: 'Instability a', b: 'Saturation b' },
    paramRanges: { a: [-2, 2], b: [0.1, 5] },
  },
  saddleNode: {
    id: 'saddleNode',
    name: 'Saddle-Node Bifurcation',
    category: 'C',
    categoryName: 'Bifurcations & Manifolds',
    description: 'Birth/death of fixed points. Canonical fold catastrophe.',
    equations: '\\dot{x} = r + x^2',
    rhs: rhsSaddleNode,
    defaultParams: { r: -0.25 },
    defaultZ0: [0.3],
    defaultTSpan: [0, 20],
    stateLabels: ['x'],
    paramLabels: { r: 'Parameter r' },
    paramRanges: { r: [-1, 1] },
  },
  pitchfork: {
    id: 'pitchfork',
    name: 'Pitchfork Bifurcation',
    category: 'C',
    categoryName: 'Bifurcations & Manifolds',
    description: 'Symmetry breaking. One stable state splits into two. Supercritical form.',
    equations: '\\dot{x} = rx - x^3',
    rhs: rhsPitchfork,
    defaultParams: { r: 1 },
    defaultZ0: [0.1],
    defaultTSpan: [0, 10],
    stateLabels: ['x'],
    paramLabels: { r: 'Parameter r' },
    paramRanges: { r: [-2, 2] },
  },
  
  // === D: Chaos ===
  lorenz: {
    id: 'lorenz',
    name: 'Lorenz System',
    category: 'D',
    categoryName: 'Chaos & Strange Attractors',
    description: 'The butterfly. Deterministic chaos, sensitive dependence. Atmospheric convection model.',
    equations: '\\dot{x} = \\sigma(y-x),\\; \\dot{y} = x(\\rho-z)-y,\\; \\dot{z} = xy-\\beta z',
    rhs: rhsLorenz,
    defaultParams: { sigma: 10, rho: 28, beta: 8/3 },
    defaultZ0: [1, 1, 1],
    defaultTSpan: [0, 50],
    stateLabels: ['x', 'y', 'z'],
    paramLabels: { sigma: 'Prandtl \u03C3', rho: 'Rayleigh \u03C1', beta: 'Geometry \u03B2' },
    paramRanges: { sigma: [1, 20], rho: [0, 50], beta: [0.5, 5] },
  },
  rossler: {
    id: 'rossler',
    name: 'R\u00F6ssler Attractor',
    category: 'D',
    categoryName: 'Chaos & Strange Attractors',
    description: 'Simpler than Lorenz. Single spiral with occasional large excursions. Period-doubling route to chaos.',
    equations: '\\dot{x} = -y-z,\\; \\dot{y} = x+ay,\\; \\dot{z} = b+z(x-c)',
    rhs: rhsRossler,
    defaultParams: { a: 0.2, b: 0.2, c: 5.7 },
    defaultZ0: [1, 1, 1],
    defaultTSpan: [0, 100],
    stateLabels: ['x', 'y', 'z'],
    paramLabels: { a: 'Parameter a', b: 'Parameter b', c: 'Parameter c' },
    paramRanges: { a: [0.1, 0.5], b: [0.1, 0.5], c: [2, 10] },
  },
  chua: {
    id: 'chua',
    name: "Chua's Circuit",
    category: 'D',
    categoryName: 'Chaos & Strange Attractors',
    description: 'Electronic chaos. Piecewise-linear nonlinearity. Double-scroll attractor.',
    equations: '\\dot{x} = \\alpha(y-x-h(x)),\\; \\dot{y} = x-y+z,\\; \\dot{z} = -\\beta y',
    rhs: rhsChua,
    defaultParams: { alpha: 15.6, beta: 28, m0: -1.143, m1: -0.714 },
    defaultZ0: [0.1, 0, 0],
    defaultTSpan: [0, 50],
    stateLabels: ['x', 'y', 'z'],
    paramLabels: { alpha: '\u03B1', beta: '\u03B2', m0: 'Inner slope m\u2080', m1: 'Outer slope m\u2081' },
    paramRanges: { alpha: [8, 20], beta: [15, 35], m0: [-1.5, -0.8], m1: [-1, -0.5] },
  },
  
  // === E: Particle / Kinetic ===
  projectile: {
    id: 'projectile',
    name: 'Projectile Motion',
    category: 'E',
    categoryName: 'Particle Dynamics',
    description: 'Parabolic flight under gravity. Optional drag and ground collision.',
    equations: '\\ddot{x} = -\\text{drag}\\cdot\\dot{x},\\; \\ddot{y} = -g - \\text{drag}\\cdot\\dot{y}',
    rhs: rhsProjectile,
    defaultParams: { g: 9.81, drag: 0, e: 0.6 },
    defaultZ0: [0, 0, 15, 20],
    defaultTSpan: [0, 6],
    stateLabels: ['x', 'y', 'vx', 'vy'],
    paramLabels: { g: 'Gravity g', drag: 'Drag coeff', e: 'Restitution e' },
    paramRanges: { g: [1, 20], drag: [0, 0.5], e: [0, 1] },
    options: { groundCollision: true },
  },
  kepler: {
    id: 'kepler',
    name: 'Keplerian Orbit',
    category: 'E',
    categoryName: 'Particle Dynamics',
    description: 'Central inverse-square force. Ellipses, parabolas, hyperbolas. Conservation of angular momentum.',
    equations: '\\ddot{\\mathbf{r}} = -\\mu\\mathbf{r}/|\\mathbf{r}|^3',
    rhs: rhsKepler,
    defaultParams: { mu: 1 },
    defaultZ0: [1, 0, 0, 0.8],
    defaultTSpan: [0, 20],
    stateLabels: ['x', 'y', 'vx', 'vy'],
    paramLabels: { mu: 'Grav. parameter \u03BC' },
    paramRanges: { mu: [0.1, 5] },
  },
  uniformB: {
    id: 'uniformB',
    name: 'Cyclotron Motion',
    category: 'E',
    categoryName: 'Particle Dynamics',
    description: 'Charged particle in uniform magnetic field. Circular motion at Larmor frequency.',
    equations: '\\dot{\\mathbf{v}} = (q/m)\\mathbf{v} \\times \\mathbf{B}',
    rhs: rhsUniformB,
    defaultParams: { qOverM: 1, Bz: 1 },
    defaultZ0: [0, 0, 1, 0],
    defaultTSpan: [0, 20],
    stateLabels: ['x', 'y', 'vx', 'vy'],
    paramLabels: { qOverM: 'Charge/mass q/m', Bz: 'Field Bz' },
    paramRanges: { qOverM: [-5, 5], Bz: [-5, 5] },
  },
  threeBody: {
    id: 'threeBody',
    name: 'Three-Body Problem',
    category: 'E',
    categoryName: 'Particle Dynamics',
    description: 'Gravitational chaos. No general closed-form solution. Figure-8 and other choreographies.',
    equations: '\\ddot{\\mathbf{r}}_i = \\sum_j Gm_j(\\mathbf{r}_j - \\mathbf{r}_i)/|\\mathbf{r}_j - \\mathbf{r}_i|^3',
    rhs: rhsThreeBody,
    defaultParams: { m1: 1, m2: 1, m3: 1, G: 1 },
    defaultZ0: [-1, 0, 1, 0, 0, 1.732, 0.347, 0.532, 0.347, 0.532, -0.694, -1.064],
    defaultTSpan: [0, 20],
    stateLabels: ['x\u2081', 'y\u2081', 'x\u2082', 'y\u2082', 'x\u2083', 'y\u2083', 'vx\u2081', 'vy\u2081', 'vx\u2082', 'vy\u2082', 'vx\u2083', 'vy\u2083'],
    paramLabels: { m1: 'Mass 1', m2: 'Mass 2', m3: 'Mass 3', G: 'Grav. constant G' },
    paramRanges: { m1: [0.1, 3], m2: [0.1, 3], m3: [0.1, 3], G: [0.1, 3] },
  },
  
  // === F: Feedback / Interaction ===
  lotkaVolterra: {
    id: 'lotkaVolterra',
    name: 'Lotka-Volterra (Predator-Prey)',
    category: 'F',
    categoryName: 'Ecological & Epidemic',
    description: 'Coupled population oscillations. Foxes and rabbits. Neutral cycles.',
    equations: '\\dot{x} = \\alpha x - \\beta xy,\\; \\dot{y} = \\delta xy - \\gamma y',
    rhs: rhsLotkaVolterra,
    defaultParams: { alpha: 1.5, beta: 1, delta: 1, gamma: 3 },
    defaultZ0: [1, 0.5],
    defaultTSpan: [0, 30],
    stateLabels: ['Prey', 'Predator'],
    paramLabels: { alpha: 'Prey growth \u03B1', beta: 'Predation \u03B2', delta: 'Conversion \u03B4', gamma: 'Predator death \u03B3' },
    paramRanges: { alpha: [0.1, 5], beta: [0.1, 5], delta: [0.1, 5], gamma: [0.1, 5] },
  },
  competition: {
    id: 'competition',
    name: 'Competitive Exclusion',
    category: 'F',
    categoryName: 'Ecological & Epidemic',
    description: 'Two species competing for same resource. Coexistence, exclusion, or bistability.',
    equations: '\\dot{x} = r_1 x(1-(x+\\alpha_{12}y)/K_1)',
    rhs: rhsCompetition,
    defaultParams: { r1: 1, r2: 1, K1: 1, K2: 1, a12: 0.5, a21: 0.5 },
    defaultZ0: [0.5, 0.3],
    defaultTSpan: [0, 30],
    stateLabels: ['Species 1', 'Species 2'],
    paramLabels: { r1: 'Growth r\u2081', r2: 'Growth r\u2082', K1: 'Capacity K\u2081', K2: 'Capacity K\u2082', a12: 'Competition \u03B1\u2081\u2082', a21: 'Competition \u03B1\u2082\u2081' },
    paramRanges: { r1: [0.1, 3], r2: [0.1, 3], K1: [0.5, 2], K2: [0.5, 2], a12: [0, 2], a21: [0, 2] },
  },
  sir: {
    id: 'sir',
    name: 'SIR Epidemic',
    category: 'F',
    categoryName: 'Ecological & Epidemic',
    description: 'Susceptible-Infected-Recovered. Herd immunity threshold. Basic reproduction number R\u2080.',
    equations: '\\dot{S} = -\\beta SI,\\; \\dot{I} = \\beta SI - \\gamma I,\\; \\dot{R} = \\gamma I',
    rhs: rhsSIR,
    defaultParams: { beta: 0.4, gamma: 0.1 },
    defaultZ0: [0.99, 0.01, 0],
    defaultTSpan: [0, 100],
    stateLabels: ['S', 'I', 'R'],
    paramLabels: { beta: 'Infection rate \u03B2', gamma: 'Recovery rate \u03B3' },
    paramRanges: { beta: [0.1, 1], gamma: [0.01, 0.5] },
  },
  seir: {
    id: 'seir',
    name: 'SEIR Epidemic',
    category: 'F',
    categoryName: 'Ecological & Epidemic',
    description: 'Adds Exposed compartment. Incubation period before infectiousness.',
    equations: '\\dot{S} = -\\beta SI,\\; \\dot{E} = \\beta SI - \\sigma E,\\; \\dot{I} = \\sigma E - \\gamma I,\\; \\dot{R} = \\gamma I',
    rhs: rhsSEIR,
    defaultParams: { beta: 0.5, sigma: 0.2, gamma: 0.1 },
    defaultZ0: [0.99, 0, 0.01, 0],
    defaultTSpan: [0, 150],
    stateLabels: ['S', 'E', 'I', 'R'],
    paramLabels: { beta: 'Infection rate \u03B2', sigma: 'Incubation rate \u03C3', gamma: 'Recovery rate \u03B3' },
    paramRanges: { beta: [0.1, 1], sigma: [0.05, 0.5], gamma: [0.01, 0.5] },
  },
  
  // === G: Chemical / Reaction-Diffusion ===
  brusselator: {
    id: 'brusselator',
    name: 'Brusselator',
    category: 'G',
    categoryName: 'Chemical Oscillators',
    description: 'Autocatalytic chemical oscillator. Hopf bifurcation at B = 1 + A\u00B2.',
    equations: '\\dot{x} = A + x^2y - (B+1)x,\\; \\dot{y} = Bx - x^2y',
    rhs: rhsBrusselator,
    defaultParams: { A: 1, B: 3 },
    defaultZ0: [1, 1],
    defaultTSpan: [0, 50],
    stateLabels: ['X', 'Y'],
    paramLabels: { A: 'Feed rate A', B: 'Bifurcation B' },
    paramRanges: { A: [0.5, 3], B: [1, 5] },
  },
  oregonator: {
    id: 'oregonator',
    name: 'Oregonator (BZ Reaction)',
    category: 'G',
    categoryName: 'Chemical Oscillators',
    description: 'Belousov-Zhabotinsky reaction model. Relaxation oscillations, spiral waves.',
    equations: '\\varepsilon\\dot{x} = qy - xy + x(1-x),\\; \\delta\\dot{y} = -qy - xy + fz,\\; \\dot{z} = x - z',
    rhs: rhsOregonator,
    defaultParams: { epsilon: 0.04, delta: 0.0004, q: 0.0008, f: 1 },
    defaultZ0: [0.5, 0.1, 0.1],
    defaultTSpan: [0, 500],
    stateLabels: ['HBrO\u2082', 'Br\u207B', 'Ce\u2074\u207A'],
    paramLabels: { epsilon: 'Fast scale \u03B5', delta: 'Slow scale \u03B4', q: 'Parameter q', f: 'Stoichiometry f' },
    paramRanges: { epsilon: [0.01, 0.1], delta: [0.0001, 0.001], q: [0.0001, 0.005], f: [0.5, 2] },
  },
  
  // === H: Neuronal ===
  fitzhughNagumo: {
    id: 'fitzhughNagumo',
    name: 'FitzHugh-Nagumo',
    category: 'H',
    categoryName: 'Neuronal Models',
    description: 'Reduced Hodgkin-Huxley. Excitability, spiking, bistability.',
    equations: '\\dot{v} = v - v^3/3 - w + I,\\; \\tau\\dot{w} = v + a - bw',
    rhs: rhsFitzHughNagumo,
    defaultParams: { a: 0.7, b: 0.8, tau: 12.5, I: 0.5 },
    defaultZ0: [-1, -0.5],
    defaultTSpan: [0, 100],
    stateLabels: ['v (voltage)', 'w (recovery)'],
    paramLabels: { a: 'Parameter a', b: 'Parameter b', tau: 'Time scale \u03C4', I: 'Input current I' },
    paramRanges: { a: [0.1, 1.5], b: [0.1, 1.5], tau: [1, 30], I: [0, 1] },
  },
  hindmarshRose: {
    id: 'hindmarshRose',
    name: 'Hindmarsh-Rose',
    category: 'H',
    categoryName: 'Neuronal Models',
    description: 'Bursting neuron model. Slow adaptation variable enables spike trains.',
    equations: '\\dot{x} = y - ax^3 + bx^2 - z + I,\\; \\dot{y} = c - dx^2 - y,\\; \\dot{z} = r[s(x - x_r) - z]',
    rhs: rhsHindmarshRose,
    defaultParams: { a: 1, b: 3, c: 1, d: 5, r: 0.006, s: 4, xR: -1.6, I: 3.25 },
    defaultZ0: [-1.5, -10, 2],
    defaultTSpan: [0, 800],
    stateLabels: ['x (membrane)', 'y (fast)', 'z (slow)'],
    paramLabels: { a: 'a', b: 'b', c: 'c', d: 'd', r: 'Slow rate r', s: 's', xR: 'Rest x\u1D63', I: 'Current I' },
    paramRanges: { a: [0.5, 2], b: [1, 5], c: [0.5, 2], d: [1, 10], r: [0.001, 0.02], s: [1, 8], xR: [-2, -1], I: [1, 5] },
  },
  
  // === I: PDEs - Heat & Diffusion ===
  heatEquation: {
    id: 'heatEquation',
    name: 'Heat Equation',
    category: 'I',
    categoryName: 'Heat & Diffusion',
    type: 'pde',
    pdeType: 'heat',
    description: 'Parabolic PDE. Fourier heat conduction, diffusion of temperature or concentration.',
    equations: '\\partial T/\\partial t = \\alpha\\nabla^2 T',
    defaultParams: { alpha: 0.5, nx: 80, ny: 80 },
    paramLabels: { alpha: 'Diffusivity \u03B1' },
    paramRanges: { alpha: [0.1, 2] },
  },
  
  // === J: PDEs - Waves ===
  waveString: {
    id: 'waveString',
    name: 'Vibrating String',
    category: 'J',
    categoryName: 'Waves',
    type: 'pde',
    pdeType: 'wave1d',
    description: 'Hyperbolic PDE. Standing waves, harmonics, plucked string dynamics.',
    equations: '\\partial^2 u/\\partial t^2 = c^2\\,\\partial^2 u/\\partial x^2',
    defaultParams: { c: 1, damping: 0.002, nx: 200 },
    paramLabels: { c: 'Wave speed c', damping: 'Damping' },
    paramRanges: { c: [0.5, 3], damping: [0, 0.01] },
  },
  waveMembrane: {
    id: 'waveMembrane',
    name: '2D Membrane',
    category: 'J',
    categoryName: 'Waves',
    type: 'pde',
    pdeType: 'wave2d',
    description: 'Drumhead vibration. Circular wave propagation, interference, reflection from boundaries and obstacles.',
    equations: '\\partial^2 u/\\partial t^2 = c^2\\nabla^2 u',
    defaultParams: { 
      c: 1, 
      damping: 0.01, 
      nx: 80, 
      ny: 80,
      sourceX: 0.5,  // 0-1 normalized position
      sourceY: 0.5,
      sourceWidth: 5,
      boundaryType: 'fixed',  // 'fixed', 'open', 'box'
      boxMargin: 10,  // pixels from edge for inner box
      obstacleType: 'none',  // 'none', 'slit', 'double-slit', 'circle', 'random'
    },
    paramLabels: { 
      c: 'Wave speed c', 
      damping: 'Damping',
      sourceX: 'Source X',
      sourceY: 'Source Y',
    },
    paramRanges: { 
      c: [0.5, 3], 
      damping: [0, 0.05],
      sourceX: [0.1, 0.9],
      sourceY: [0.1, 0.9],
    },
    boundaryOptions: ['fixed', 'box'],
    obstacleOptions: ['none', 'slit', 'double-slit', 'circle', 'random'],
  },
  dopplerEffect: {
    id: 'dopplerEffect',
    name: 'Doppler Effect',
    category: 'J',
    categoryName: 'Waves',
    type: 'pde',
    pdeType: 'doppler',
    description: '3D visualization of moving source wavefront propagation. Shows frequency shift from retarded-time phase calculation.',
    equations: 'f_{\\text{obs}} = f_0 \\cdot c / (c - v_s)',
    defaultParams: {
      waveSpeed: 4.0,
      sourceSpeed: 1.5,
      frequency: 0.5,
      amplitude: 1.0,
      sourceStartY: -12,
    },
    paramLabels: {
      waveSpeed: 'Wave speed c',
      sourceSpeed: 'Source speed v',
      frequency: 'Source freq f\u2080',
      amplitude: 'Amplitude',
    },
    paramRanges: {
      waveSpeed: [2, 8],
      sourceSpeed: [0, 7],
      frequency: [0.2, 1.5],
      amplitude: [0.5, 2],
    },
    presets: [
      { name: 'Stationary', params: { sourceSpeed: 0, frequency: 0.5 } },
      { name: 'Slow Approach', params: { sourceSpeed: 1.0, frequency: 0.5 } },
      { name: 'Fast Approach', params: { sourceSpeed: 2.5, frequency: 0.5 } },
      { name: 'Near Sonic', params: { sourceSpeed: 3.5, frequency: 0.6 } },
    ],
  },
  
  // === K: PDEs - Reaction-Diffusion ===
  grayScott: {
    id: 'grayScott',
    name: 'Gray-Scott',
    category: 'K',
    categoryName: 'Reaction-Diffusion',
    type: 'pde',
    pdeType: 'grayscott',
    description: 'Pattern formation via Turing instability. Spots, stripes, mitosis, coral growth.',
    equations: '\\partial_t u = D_u\\nabla^2 u - uv^2 + f(1-u),\\; \\partial_t v = D_v\\nabla^2 v + uv^2 - (f+k)v',
    defaultParams: { Du: 0.16, Dv: 0.08, f: 0.035, k: 0.065, nx: 128, ny: 128 },
    paramLabels: { f: 'Feed rate f', k: 'Kill rate k' },
    paramRanges: { f: [0.01, 0.08], k: [0.03, 0.08] },
    presets: [
      { name: 'Mitosis', params: { f: 0.028, k: 0.062 }},
      { name: 'Coral', params: { f: 0.062, k: 0.063 }},
      { name: 'Fingerprint', params: { f: 0.035, k: 0.065 }},
      { name: 'Spots', params: { f: 0.030, k: 0.057 }},
      { name: 'Worms', params: { f: 0.058, k: 0.065 }},
    ],
  },
  
  // === L: PDEs - Fluid Dynamics ===
  latticeBoltzmann: {
    id: 'latticeBoltzmann',
    name: 'Lattice Boltzmann',
    category: 'L',
    categoryName: 'Fluid Dynamics',
    type: 'pde',
    pdeType: 'lbm',
    description: 'Mesoscopic fluid simulation. Von K\u00E1rm\u00E1n vortex streets, flow around obstacles.',
    equations: 'f_i(x+e_i,\\, t+1) = f_i - \\omega(f_i - f_i^{\\text{eq}})',
    defaultParams: { omega: 1.85, nx: 200, ny: 80 },
    paramLabels: { omega: 'Relaxation \u03C9' },
    paramRanges: { omega: [1.0, 1.95] },
  },
};

// Category order and colors
const CATEGORIES = [
  { id: 'A', name: 'Growth & Relaxation', color: '#4a9eff' },
  { id: 'B', name: 'Oscillators', color: '#22c55e' },
  { id: 'C', name: 'Bifurcations & Manifolds', color: '#a855f7' },
  { id: 'D', name: 'Chaos & Strange Attractors', color: '#ef4444' },
  { id: 'E', name: 'Particle Dynamics', color: '#f59e0b' },
  { id: 'F', name: 'Ecological & Epidemic', color: '#06b6d4' },
  { id: 'G', name: 'Chemical Oscillators', color: '#ec4899' },
  { id: 'H', name: 'Neuronal Models', color: '#8b5cf6' },
  { id: 'I', name: 'Heat & Diffusion', color: '#f97316' },
  { id: 'J', name: 'Waves', color: '#14b8a6' },
  { id: 'K', name: 'Reaction-Diffusion', color: '#e879f9' },
  { id: 'L', name: 'Fluid Dynamics', color: '#3b82f6' },
];

// ============================================================================
// VISUALIZATION
// ============================================================================

function TimeSeriesPlot({ t, z, labels, colors, width = 400, height = 200 }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || t.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    
    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
    
    // Find ranges
    const tMin = t[0], tMax = t[t.length - 1];
    let yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i < z.length; i++) {
      for (let j = 0; j < z[i].length; j++) {
        if (isFinite(z[i][j])) {
          yMin = Math.min(yMin, z[i][j]);
          yMax = Math.max(yMax, z[i][j]);
        }
      }
    }
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const yPad = (yMax - yMin) * 0.1;
    yMin -= yPad; yMax += yPad;
    
    // Scale functions
    const sx = (tv) => margin.left + (tv - tMin) / (tMax - tMin) * w;
    const sy = (yv) => margin.top + h - (yv - yMin) / (yMax - yMin) * h;
    
    // Grid
    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }
    
    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();
    
    // Axis labels
    ctx.fillStyle = '#666';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('t', width / 2, height - 5);
    
    ctx.textAlign = 'right';
    ctx.fillText(yMax.toFixed(2), margin.left - 5, margin.top + 10);
    ctx.fillText(yMin.toFixed(2), margin.left - 5, height - margin.bottom);
    
    // Plot each variable
    const nVars = z[0].length;
    const defaultColors = ['#4a9eff', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];
    
    for (let v = 0; v < nVars; v++) {
      ctx.strokeStyle = colors?.[v] || defaultColors[v % defaultColors.length];
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      let started = false;
      for (let i = 0; i < t.length; i++) {
        const x = sx(t[i]);
        const y = sy(z[i][v]);
        if (isFinite(y)) {
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }
    
    // Legend
    if (labels) {
      ctx.font = '10px ui-monospace, monospace';
      for (let v = 0; v < nVars && v < labels.length; v++) {
        ctx.fillStyle = colors?.[v] || defaultColors[v % defaultColors.length];
        const lx = margin.left + 10 + v * 60;
        ctx.fillRect(lx, 8, 12, 3);
        ctx.fillStyle = '#888';
        ctx.textAlign = 'left';
        ctx.fillText(labels[v], lx + 16, 12);
      }
    }
  }, [t, z, labels, colors, width, height]);
  
  return <canvas ref={canvasRef} style={{ width, height }} />;
}

function PhasePlot({ z, xIdx = 0, yIdx = 1, labels, width = 300, height = 300, showFlow, rhs, params }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || z.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    const margin = { top: 20, right: 20, bottom: 35, left: 45 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    
    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
    
    // Find ranges
    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;
    for (let i = 0; i < z.length; i++) {
      if (isFinite(z[i][xIdx])) {
        xMin = Math.min(xMin, z[i][xIdx]);
        xMax = Math.max(xMax, z[i][xIdx]);
      }
      if (isFinite(z[i][yIdx])) {
        yMin = Math.min(yMin, z[i][yIdx]);
        yMax = Math.max(yMax, z[i][yIdx]);
      }
    }
    const xPad = (xMax - xMin) * 0.15 || 1;
    const yPad = (yMax - yMin) * 0.15 || 1;
    xMin -= xPad; xMax += xPad;
    yMin -= yPad; yMax += yPad;
    
    const sx = (xv) => margin.left + (xv - xMin) / (xMax - xMin) * w;
    const sy = (yv) => margin.top + h - (yv - yMin) / (yMax - yMin) * h;
    
    // Vector field
    if (showFlow && rhs && z[0].length === 2) {
      const nx = 15, ny = 15;
      ctx.strokeStyle = '#2a2a3a';
      ctx.lineWidth = 0.5;
      
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < ny; j++) {
          const x = xMin + (i + 0.5) * (xMax - xMin) / nx;
          const y = yMin + (j + 0.5) * (yMax - yMin) / ny;
          const dz = rhs(0, [x, y], params);
          const mag = Math.sqrt(dz[0] * dz[0] + dz[1] * dz[1]) + 1e-10;
          const scale = Math.min(15, 200 / mag);
          
          const px = sx(x);
          const py = sy(y);
          const dx = dz[0] / mag * scale;
          const dy = -dz[1] / mag * scale;
          
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + dx, py + dy);
          ctx.stroke();
        }
      }
    }
    
    // Grid
    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx(0), margin.top);
    ctx.lineTo(sx(0), height - margin.bottom);
    ctx.moveTo(margin.left, sy(0));
    ctx.lineTo(width - margin.right, sy(0));
    ctx.stroke();
    
    // Trajectory
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < z.length; i++) {
      const x = sx(z[i][xIdx]);
      const y = sy(z[i][yIdx]);
      if (isFinite(x) && isFinite(y)) {
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();
    
    // Start/end markers
    if (z.length > 0) {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(sx(z[0][xIdx]), sy(z[0][yIdx]), 4, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(sx(z[z.length-1][xIdx]), sy(z[z.length-1][yIdx]), 4, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(labels?.[xIdx] || `x${xIdx+1}`, width / 2, height - 5);
    
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(labels?.[yIdx] || `x${yIdx+1}`, 0, 0);
    ctx.restore();
    
  }, [z, xIdx, yIdx, labels, width, height, showFlow, rhs, params]);
  
  return <canvas ref={canvasRef} style={{ width, height }} />;
}

function Plot3D({ z, width = 300, height = 300, rotation = 0 }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || z.length === 0 || z[0].length < 3) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
    
    // Find ranges
    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;
    let zMin = Infinity, zMax = -Infinity;
    
    for (let i = 0; i < z.length; i++) {
      xMin = Math.min(xMin, z[i][0]); xMax = Math.max(xMax, z[i][0]);
      yMin = Math.min(yMin, z[i][1]); yMax = Math.max(yMax, z[i][1]);
      zMin = Math.min(zMin, z[i][2]); zMax = Math.max(zMax, z[i][2]);
    }
    
    const cx = (xMax + xMin) / 2;
    const cy = (yMax + yMin) / 2;
    const cz = (zMax + zMin) / 2;
    const scale = Math.min(width, height) * 0.35 / Math.max(xMax - xMin, yMax - yMin, zMax - zMin);
    
    // Simple isometric projection with rotation
    const angle = rotation * Math.PI / 180;
    const project = (x, y, zv) => {
      const rx = (x - cx) * Math.cos(angle) - (y - cy) * Math.sin(angle);
      const ry = (x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle);
      return [
        width / 2 + (rx * 0.866 - ry * 0.866) * scale,
        height / 2 - (zv - cz) * scale + (rx * 0.5 + ry * 0.5) * scale * 0.5
      ];
    };
    
    // Draw trajectory with depth coloring
    for (let i = 1; i < z.length; i++) {
      const [px1, py1] = project(z[i-1][0], z[i-1][1], z[i-1][2]);
      const [px2, py2] = project(z[i][0], z[i][1], z[i][2]);
      
      const depth = (z[i][2] - zMin) / (zMax - zMin + 0.001);
      const alpha = 0.3 + depth * 0.7;
      ctx.strokeStyle = `rgba(74, 158, 255, ${alpha})`;
      ctx.lineWidth = 1 + depth;
      
      ctx.beginPath();
      ctx.moveTo(px1, py1);
      ctx.lineTo(px2, py2);
      ctx.stroke();
    }
    
    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    const origin = project(cx, cy, cz);
    const xEnd = project(cx + (xMax - xMin) * 0.4, cy, cz);
    const yEnd = project(cx, cy + (yMax - yMin) * 0.4, cz);
    const zEnd = project(cx, cy, cz + (zMax - zMin) * 0.4);
    
    ctx.beginPath();
    ctx.moveTo(origin[0], origin[1]); ctx.lineTo(xEnd[0], xEnd[1]);
    ctx.moveTo(origin[0], origin[1]); ctx.lineTo(yEnd[0], yEnd[1]);
    ctx.moveTo(origin[0], origin[1]); ctx.lineTo(zEnd[0], zEnd[1]);
    ctx.stroke();
    
    ctx.fillStyle = '#666';
    ctx.font = '10px ui-monospace, monospace';
    ctx.fillText('x', xEnd[0] + 5, xEnd[1]);
    ctx.fillText('y', yEnd[0] + 5, yEnd[1]);
    ctx.fillText('z', zEnd[0] + 5, zEnd[1] - 5);
    
  }, [z, width, height, rotation]);
  
  return <canvas ref={canvasRef} style={{ width, height }} />;
}

function FieldPlot({ data, nx, ny, width = 400, height = 400, colormap = 'thermal', vmin, vmax, onClick, frame, obstacle }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || !data.length) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    const cellW = width / nx;
    const cellH = height / ny;
    
    let min = vmin, max = vmax;
    if (min === undefined || max === undefined) {
      min = Infinity; max = -Infinity;
      for (let i = 0; i < data.length; i++) {
        if (isFinite(data[i])) { min = Math.min(min, data[i]); max = Math.max(max, data[i]); }
      }
      // Handle case where all values are the same or no valid values
      if (!isFinite(min) || !isFinite(max)) { min = -1; max = 1; }
      if (min === max) { min -= 0.5; max += 0.5; }
    }
    
    const colormaps = {
      thermal: (t) => {
        if (t < 0.25) return [0, Math.floor(t*4*100), Math.floor(100+t*4*155)];
        if (t < 0.5) return [0, Math.floor(100+(t-0.25)*4*155), Math.floor(255-(t-0.25)*4*155)];
        if (t < 0.75) return [Math.floor((t-0.5)*4*255), 255, 0];
        return [255, Math.floor(255-(t-0.75)*4*200), 0];
      },
      coolwarm: (t) => {
        if (t < 0.5) return [Math.floor(59+t*2*140), Math.floor(76+t*2*140), Math.floor(192-t*2*40)];
        return [Math.floor(199+(t-0.5)*2*56), Math.floor(216-(t-0.5)*2*120), Math.floor(152-(t-0.5)*2*110)];
      },
      viridis: (t) => [Math.floor(68+t*120), Math.floor(1+t*180+50*Math.sin(t*3.14)), Math.floor(84+80*t*(1-t)*4)],
      grayscale: (t) => { const c = Math.floor(t*255); return [c,c,c]; },
    };
    
    const cmap = colormaps[colormap] || colormaps.thermal;
    const imageData = ctx.createImageData(Math.ceil(width*dpr), Math.ceil(height*dpr));
    const pixels = imageData.data;
    
    const range = max - min || 1;
    
    for (let py = 0; py < height*dpr; py++) {
      for (let px = 0; px < width*dpr; px++) {
        const i = Math.floor(px / dpr / cellW);
        const j = ny - 1 - Math.floor(py / dpr / cellH);
        const idx = Math.max(0, Math.min(j * nx + i, data.length - 1));
        const pidx = (py * Math.ceil(width*dpr) + px) * 4;
        
        // Check if this is an obstacle cell
        if (obstacle && obstacle[idx]) {
          pixels[pidx] = 40; pixels[pidx+1] = 40; pixels[pidx+2] = 50; pixels[pidx+3] = 255;
        } else {
          const val = isFinite(data[idx]) ? data[idx] : 0;
          const v = Math.max(0, Math.min(1, (val - min) / range));
          const [r, g, b] = cmap(v);
          pixels[pidx] = r; pixels[pidx+1] = g; pixels[pidx+2] = b; pixels[pidx+3] = 255;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [data, nx, ny, width, height, colormap, vmin, vmax, frame, obstacle]);
  
  return <canvas ref={canvasRef} style={{ width, height, cursor: onClick ? 'crosshair' : 'default' }} onClick={onClick} />;
}

function WaveformPlot({ data, width = 400, height = 150, frame }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
    
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < data.length; i++) { min = Math.min(min, data[i]); max = Math.max(max, data[i]); }
    if (!isFinite(min) || !isFinite(max)) { min = -1; max = 1; }
    if (min === max) { min -= 1; max += 1; }
    const pad = (max - min) * 0.1; min -= pad; max += pad;
    
    ctx.strokeStyle = '#4a9eff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((data[i] - min) / (max - min)) * height;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Zero line
    const y0 = height - ((0 - min) / (max - min)) * height;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    ctx.lineTo(width, y0);
    ctx.stroke();
  }, [data, width, height, frame]);
  
  return <canvas ref={canvasRef} style={{ width, height }} />;
}

// ============================================================================
// DOPPLER 3D VISUALIZATION
// ============================================================================

function Doppler3DScene({ engine, isRunning, onStateUpdate, params }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const animRef = useRef(null);
  const objectsRef = useRef({
    wavefrontMeshes: [],
    signalLine: null,
    sourceMesh: null,
    observerMesh: null,
    pulseRing: null,
  });
  
  const cameraStateRef = useRef({
    theta: 0.5,
    phi: 1.2,
    radius: 35,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
    autoRotate: true
  });
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05050a);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.up.set(0, 0, 1);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 20);
    scene.add(directionalLight);
    
    const gridHelper = new THREE.GridHelper(40, 20, 0x1a1a2e, 0x0f0f1a);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);
    
    // Axes
    const axesGroup = new THREE.Group();
    const xAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-20, 0, 0), new THREE.Vector3(20, 0, 0)]),
      new THREE.LineBasicMaterial({ color: 0xff4444 })
    );
    const yAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -20, 0), new THREE.Vector3(0, 20, 0)]),
      new THREE.LineBasicMaterial({ color: 0x44ff44 })
    );
    const zAxis = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -2), new THREE.Vector3(0, 0, 5)]),
      new THREE.LineBasicMaterial({ color: 0x4444ff })
    );
    axesGroup.add(xAxis, yAxis, zAxis);
    scene.add(axesGroup);
    
    // Observer
    const observerMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x4a9eff, emissive: 0x2a5e9f, emissiveIntensity: 0.3 })
    );
    scene.add(observerMesh);
    objectsRef.current.observerMesh = observerMesh;
    
    // Pulse ring
    const pulseRing = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.5, 32),
      new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    scene.add(pulseRing);
    objectsRef.current.pulseRing = pulseRing;
    
    // Source
    const sourceMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x8f2222, emissiveIntensity: 0.4 })
    );
    scene.add(sourceMesh);
    objectsRef.current.sourceMesh = sourceMesh;
    
    // Signal wave line
    const signalLine = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 2 })
    );
    scene.add(signalLine);
    objectsRef.current.signalLine = signalLine;
    
    // Mouse controls
    const camState = cameraStateRef.current;
    
    const handleMouseDown = (e) => {
      camState.isDragging = true;
      camState.autoRotate = false;
      camState.lastMouseX = e.clientX;
      camState.lastMouseY = e.clientY;
      container.style.cursor = 'grabbing';
    };
    
    const handleMouseMove = (e) => {
      if (!camState.isDragging) return;
      const deltaX = e.clientX - camState.lastMouseX;
      const deltaY = e.clientY - camState.lastMouseY;
      camState.theta -= deltaX * 0.008;
      camState.phi += deltaY * 0.008;
      camState.phi = Math.max(0.08, Math.min(Math.PI - 0.08, camState.phi));
      camState.lastMouseX = e.clientX;
      camState.lastMouseY = e.clientY;
    };
    
    const handleMouseUp = () => {
      camState.isDragging = false;
      container.style.cursor = 'grab';
    };
    
    const handleWheel = (e) => {
      e.preventDefault();
      camState.radius += e.deltaY * 0.02;
      camState.radius = Math.max(15, Math.min(80, camState.radius));
    };
    
    const handleDoubleClick = () => {
      camState.theta = 0.5;
      camState.phi = 1.2;
      camState.radius = 35;
      camState.autoRotate = true;
    };
    
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('dblclick', handleDoubleClick);
    container.style.cursor = 'grab';
    
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('dblclick', handleDoubleClick);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);
  
  useEffect(() => {
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const objects = objectsRef.current;
    
    if (!scene || !renderer || !camera || !engine) return;
    
    let lastTime = performance.now();
    
    const animate = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      
      if (isRunning) {
        engine.step(dt);
      }
      
      // Update source position
      const srcPos = engine.getSourcePosition(engine.time);
      objects.sourceMesh.position.copy(srcPos);
      
      // Update signal wave
      const wavePoints = engine.buildSignalWavePoints(300);
      const positions = new Float32Array(wavePoints.length * 3);
      for (let i = 0; i < wavePoints.length; i++) {
        positions[i * 3] = wavePoints[i].x;
        positions[i * 3 + 1] = wavePoints[i].y;
        positions[i * 3 + 2] = wavePoints[i].z;
      }
      objects.signalLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      // Update wavefronts
      const currentWavefronts = engine.wavefronts;
      const existingMeshes = objects.wavefrontMeshes;
      
      while (existingMeshes.length > currentWavefronts.length) {
        const mesh = existingMeshes.pop();
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      
      for (let i = 0; i < currentWavefronts.length; i++) {
        const wf = currentWavefronts[i];
        let mesh = existingMeshes[i];
        
        if (!mesh) {
          const geom = new THREE.RingGeometry(wf.radius - 0.05, wf.radius + 0.05, 64);
          const mat = new THREE.MeshBasicMaterial({
            color: wf.detected ? 0x22c55e : 0x6699ff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
          });
          mesh = new THREE.Mesh(geom, mat);
          scene.add(mesh);
          existingMeshes.push(mesh);
        } else {
          mesh.geometry.dispose();
          const innerR = Math.max(0, wf.radius - 0.05);
          mesh.geometry = new THREE.RingGeometry(innerR, wf.radius + 0.05, 64);
          mesh.material.color.setHex(wf.detected ? 0x22c55e : 0x6699ff);
          mesh.material.opacity = Math.max(0.1, 0.7 - wf.radius / 30);
        }
        
        mesh.position.set(wf.emissionPos.x, wf.emissionPos.y, 0);
      }
      
      // Pulse effect
      const timeSinceDetect = engine.time - engine.lastDetectionTime;
      if (timeSinceDetect < 0.5 && timeSinceDetect >= 0) {
        objects.pulseRing.material.opacity = 1 - timeSinceDetect * 2;
        const scale = 1 + timeSinceDetect * 4;
        objects.pulseRing.scale.set(scale, scale, scale);
        objects.pulseRing.visible = true;
      } else {
        objects.pulseRing.visible = false;
      }
      
      // Update camera
      const camState = cameraStateRef.current;
      if (camState.autoRotate && isRunning) {
        camState.theta += 0.002;
      }
      camera.position.x = camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta);
      camera.position.y = camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta);
      camera.position.z = camState.radius * Math.cos(camState.phi);
      camera.lookAt(0, 0, 0);
      
      // Report state
      if (onStateUpdate) {
        const lastFreq = engine.measuredFrequencies.length > 0 
          ? engine.measuredFrequencies[engine.measuredFrequencies.length - 1] 
          : null;
        onStateUpdate({
          time: engine.time,
          detectionCount: engine.detectionEvents.length,
          measuredFrequencies: engine.measuredFrequencies,
          lastFrequency: lastFreq?.frequency,
          lastPeriod: lastFreq?.period,
          theoreticalFreq: engine.getTheoreticalFrequency(),
          sourceFreq: engine.fs
        });
      }
      
      renderer.render(scene, camera);
      animRef.current = requestAnimationFrame(animate);
    };
    
    animRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [engine, isRunning, onStateUpdate]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '100%', minHeight: 400, borderRadius: 6, overflow: 'hidden', position: 'relative' }}
    >
      <div style={{
        position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6, pointerEvents: 'none'
      }}>
        <div style={{ padding: '3px 6px', background: 'rgba(0,0,0,0.6)', borderRadius: 3, fontSize: 9, color: '#666' }}>
          Drag to orbit
        </div>
        <div style={{ padding: '3px 6px', background: 'rgba(0,0,0,0.6)', borderRadius: 3, fontSize: 9, color: '#666' }}>
          Scroll to zoom
        </div>
      </div>
    </div>
  );
}

function DopplerFrequencyPlot({ frequencies, sourceFreq, theoreticalFreq, width = 400, height = 150 }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    const margin = { top: 20, right: 15, bottom: 25, left: 45 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;
    
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
    
    let tMin = 0, tMax = 12;
    let fMin = 0, fMax = Math.max(sourceFreq * 2.5, 1.5);
    
    if (frequencies.length > 0) {
      tMax = Math.max(12, frequencies[frequencies.length - 1].t + 2);
      const maxMeasured = Math.max(...frequencies.map(f => f.frequency));
      fMax = Math.max(fMax, maxMeasured * 1.3);
    }
    
    const sx = (t) => margin.left + (t - tMin) / (tMax - tMin) * w;
    const sy = (f) => margin.top + h - (f - fMin) / (fMax - fMin) * h;
    
    // Grid
    ctx.strokeStyle = '#151520';
    for (let i = 0; i <= 4; i++) {
      const y = margin.top + (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }
    
    // Source frequency line
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(margin.left, sy(sourceFreq));
    ctx.lineTo(width - margin.right, sy(sourceFreq));
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = '#ef4444';
    ctx.font = '9px ui-monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`f\u2080=${sourceFreq.toFixed(2)}`, width - margin.right - 3, sy(sourceFreq) - 3);
    
    // Measured data
    if (frequencies.length > 0) {
      ctx.strokeStyle = '#4a9eff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (const pt of frequencies) {
        const x = sx(pt.t);
        const y = sy(pt.frequency);
        if (isFinite(y) && y > margin.top && y < height - margin.bottom) {
          if (!started) { ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      ctx.fillStyle = '#4a9eff';
      for (const pt of frequencies) {
        const x = sx(pt.t);
        const y = sy(pt.frequency);
        if (isFinite(y) && y > margin.top && y < height - margin.bottom) {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
    
    // Axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.stroke();
    
    ctx.fillStyle = '#666';
    ctx.font = '9px ui-monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Time (s)', width / 2, height - 5);
    
    ctx.fillStyle = '#888';
    ctx.font = 'bold 10px ui-monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Measured Frequency', margin.left, 12);
    
  }, [frequencies, sourceFreq, theoreticalFreq, width, height]);
  
  return <canvas ref={canvasRef} style={{ width, height, borderRadius: 4 }} />;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function UnifiedPhysicsLab() {
  const [selectedSystem, setSelectedSystem] = useState('lorenz');
  const [params, setParams] = useState({});
  const [z0, setZ0] = useState([]);
  const [tSpan, setTSpan] = useState([0, 50]);
  const [dt, setDt] = useState(0.01);
  const [result, setResult] = useState({ t: [], z: [] });
  const [isRunning, setIsRunning] = useState(false);
  const [showFlow, setShowFlow] = useState(true);
  const [rotation3D, setRotation3D] = useState(30);
  const [expandedCategory, setExpandedCategory] = useState('D');
  
  // PDE state
  const [pdeSolver, setPdeSolver] = useState(null);
  const [pdeFrame, setPdeFrame] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState(0);
  
  // Doppler state
  const [dopplerEngine, setDopplerEngine] = useState(null);
  const [dopplerState, setDopplerState] = useState(null);
  
  const animRef = useRef(null);
  const stepRef = useRef(0);
  
  const system = SYSTEMS[selectedSystem];
  const isDoppler = system?.pdeType === 'doppler';
  const isPDE = system?.type === 'pde';
  
  // Initialize when system changes
  useEffect(() => {
    if (system) {
      setParams({ ...system.defaultParams });
      setIsRunning(false);
      stepRef.current = 0;
      
      if (system.pdeType === 'doppler') {
        // Initialize Doppler engine
        const engine = new DopplerEngine(system.defaultParams);
        setDopplerEngine(engine);
        setDopplerState(null);
        setPdeSolver(null);
      } else if (system.type === 'pde') {
        // Initialize PDE solver
        const p = system.defaultParams;
        let solver = null;
        
        if (system.pdeType === 'heat') {
          solver = new HeatSolver2D(p.nx, p.ny, { alpha: p.alpha });
          solver.fill(0);
          solver.setCircle(p.nx/2, p.ny/2, p.nx/5, 1);
        } else if (system.pdeType === 'wave1d') {
          solver = new WaveSolver1D(p.nx, { c: p.c, damping: p.damping });
          solver.pluck(0.3, 0.05, 1);
        } else if (system.pdeType === 'wave2d') {
          solver = new WaveSolver2D(p.nx, p.ny, { 
            c: p.c, 
            damping: p.damping,
            boundaryType: p.boundaryType,
            boxMargin: p.boxMargin,
            obstacleType: p.obstacleType,
          });
          const srcX = Math.floor((p.sourceX || 0.5) * p.nx);
          const srcY = Math.floor((p.sourceY || 0.5) * p.ny);
          solver.tap(srcX, srcY, p.sourceWidth || 5, 1);
        } else if (system.pdeType === 'grayscott') {
          solver = new GrayScottSolver(p.nx, p.ny, { Du: p.Du, Dv: p.Dv, f: p.f, k: p.k });
          solver.seed(p.nx/2, p.ny/2, 10);
        } else if (system.pdeType === 'lbm') {
          solver = new LBMSolver(p.nx, p.ny, { omega: p.omega });
          solver.addCircleObstacle(p.nx/4, p.ny/2, p.ny/6);
        }
        
        setPdeSolver(solver);
        setPdeFrame(0);
        setDopplerEngine(null);
      } else {
        setPdeSolver(null);
        setDopplerEngine(null);
        setZ0([...system.defaultZ0]);
        setTSpan([...system.defaultTSpan]);
        setDt(system.defaultTSpan[1] > 100 ? 0.1 : 0.01);
      }
    }
  }, [selectedSystem]);
  
  // Run ODE simulation
  const runSimulation = useCallback(() => {
    if (!system || isPDE) return;
    const res = integrate(system.rhs, z0, tSpan, dt, params, system.options);
    setResult(res);
  }, [system, z0, tSpan, dt, params, isPDE]);
  
  // Initial ODE run
  useEffect(() => {
    if (system && !isPDE && z0.length > 0) {
      runSimulation();
    }
  }, [system, z0, params, tSpan, dt, isPDE]);
  
  // PDE animation loop
  useEffect(() => {
    if (!isRunning || !pdeSolver) return;
    
    const animate = () => {
      const stepsPerFrame = system.pdeType === 'grayscott' ? 20 : 
                           system.pdeType === 'lbm' ? 3 : 5;
      
      for (let i = 0; i < stepsPerFrame; i++) {
        if (system.pdeType === 'lbm') {
          pdeSolver.step();
        } else {
          pdeSolver.step(1);
        }
      }
      setPdeFrame(f => f + 1);
      animRef.current = requestAnimationFrame(animate);
    };
    
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isRunning, pdeSolver, system]);
  
  // ODE animation for playback
  useEffect(() => {
    if (isRunning && !isPDE && result.z.length > 0) {
      const animate = () => {
        stepRef.current = (stepRef.current + 5) % result.z.length;
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isRunning, isPDE, result.z.length]);
  
  // 3D rotation animation
  useEffect(() => {
    if (system?.stateLabels?.length >= 3 && !isPDE) {
      const interval = setInterval(() => setRotation3D(r => (r + 0.5) % 360), 50);
      return () => clearInterval(interval);
    }
  }, [system, isPDE]);
  
  const handleParamChange = (key, value) => {
    setParams(p => ({ ...p, [key]: value }));
    // Update PDE solver params
    if (pdeSolver) {
      if (key in pdeSolver) pdeSolver[key] = value;
    }
    // Update Doppler engine params
    if (dopplerEngine) {
      dopplerEngine.updateParams({ [key]: value });
    }
  };
  
  const handleFieldClick = (e) => {
    if (!pdeSolver) return;
    const rect = e.target.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / rect.width * pdeSolver.nx);
    const y = Math.floor((1 - (e.clientY - rect.top) / rect.height) * pdeSolver.ny);
    
    if (system.pdeType === 'wave2d') {
      pdeSolver.tap(x, y, 4, 0.5);
    } else if (system.pdeType === 'grayscott') {
      pdeSolver.seed(x, y, 5);
    } else if (system.pdeType === 'heat') {
      pdeSolver.setCircle(x, y, 5, 1);
    }
    setPdeFrame(f => f + 1);
  };
  
  const resetPDE = () => {
    if (!system || !isPDE) return;
    setIsRunning(false);
    const p = params;
    
    if (system.pdeType === 'doppler') {
      const engine = new DopplerEngine(p);
      setDopplerEngine(engine);
      setDopplerState(null);
      return;
    }
    
    let solver = null;
    
    if (system.pdeType === 'heat') {
      solver = new HeatSolver2D(p.nx || 80, p.ny || 80, { alpha: p.alpha });
      solver.fill(0);
      solver.setCircle((p.nx||80)/2, (p.ny||80)/2, 15, 1);
    } else if (system.pdeType === 'wave1d') {
      solver = new WaveSolver1D(p.nx || 200, { c: p.c, damping: p.damping });
      solver.pluck(0.3, 0.05, 1);
    } else if (system.pdeType === 'wave2d') {
      const nx = p.nx || 80;
      const ny = p.ny || 80;
      solver = new WaveSolver2D(nx, ny, { 
        c: p.c, 
        damping: p.damping,
        boundaryType: p.boundaryType,
        boxMargin: p.boxMargin,
        obstacleType: p.obstacleType,
      });
      const srcX = Math.floor((p.sourceX || 0.5) * nx);
      const srcY = Math.floor((p.sourceY || 0.5) * ny);
      solver.tap(srcX, srcY, p.sourceWidth || 5, 1);
    } else if (system.pdeType === 'grayscott') {
      solver = new GrayScottSolver(p.nx || 128, p.ny || 128, { Du: p.Du, Dv: p.Dv, f: p.f, k: p.k });
      solver.seed((p.nx||128)/2, (p.ny||128)/2, 10);
    } else if (system.pdeType === 'lbm') {
      solver = new LBMSolver(p.nx || 200, p.ny || 80, { omega: p.omega });
      solver.addCircleObstacle((p.nx||200)/4, (p.ny||80)/2, (p.ny||80)/6);
    }
    
    setPdeSolver(solver);
    setPdeFrame(0);
  };
  
  const applyPreset = (presetIdx) => {
    if (!system?.presets?.[presetIdx]) return;
    const preset = system.presets[presetIdx];
    setParams(p => ({ ...p, ...preset.params }));
    setSelectedPreset(presetIdx);
    // Reinitialize with new params
    setTimeout(() => resetPDE(), 50);
  };
  
  const handleZ0Change = (idx, value) => {
    setZ0(z => {
      const newZ = [...z];
      newZ[idx] = value;
      return newZ;
    });
  };
  
  const categoryColor = CATEGORIES.find(c => c.id === system?.category)?.color || '#666';
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#08080c',
      color: '#c8c8d0',
      fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", monospace',
      fontSize: '13px',
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #1a1a24',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: categoryColor,
            boxShadow: `0 0 8px ${categoryColor}`,
          }} />
          <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
            Dynamical Systems Laboratory
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          {Object.keys(SYSTEMS).length} systems \u2022 RK4 integrator
        </div>
      </header>
      
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 50px)' }}>
        {/* Sidebar - System Selection */}
        <aside style={{
          width: '280px',
          borderRight: '1px solid #1a1a24',
          overflowY: 'auto',
          flexShrink: 0,
        }}>
          {CATEGORIES.map(cat => {
            const systemsInCat = Object.values(SYSTEMS).filter(s => s.category === cat.id);
            const isExpanded = expandedCategory === cat.id;
            
            return (
              <div key={cat.id}>
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: isExpanded ? '#0f0f14' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #1a1a24',
                    color: '#888',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: cat.color,
                  }} />
                  <span style={{ flex: 1 }}>{cat.name}</span>
                  <span style={{ color: '#444' }}>{systemsInCat.length}</span>
                  <span style={{ color: '#444', transform: isExpanded ? 'rotate(90deg)' : 'none' }}>{'\u203A'}</span>
                </button>
                
                {isExpanded && (
                  <div style={{ background: '#0a0a0f' }}>
                    {systemsInCat.map(sys => (
                      <button
                        key={sys.id}
                        onClick={() => setSelectedSystem(sys.id)}
                        style={{
                          width: '100%',
                          padding: '8px 16px 8px 28px',
                          background: selectedSystem === sys.id ? '#14141c' : 'transparent',
                          border: 'none',
                          borderLeft: selectedSystem === sys.id ? `2px solid ${cat.color}` : '2px solid transparent',
                          color: selectedSystem === sys.id ? '#e0e0e8' : '#888',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {sys.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </aside>
        
        {/* Main Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {system && (
            <>
              {/* System Info */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #1a1a24',
                background: '#0a0a0f',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <h1 style={{
                      fontSize: '18px',
                      fontWeight: 500,
                      marginBottom: '6px',
                      color: '#e8e8f0',
                    }}>
                      {system.name}
                    </h1>
                    <p style={{ color: '#666', fontSize: '12px', marginBottom: '8px' }}>
                      {system.description}
                    </p>
                    <div style={{
                      display: 'inline-block',
                      background: '#14141c',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}>
                      <KaTeXFormula tex={system.equations} color={categoryColor} />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setParams({ ...system.defaultParams });
                      if (system.type === 'pde') {
                        setTimeout(() => resetPDE(), 50);
                      } else if (system.defaultZ0) {
                        setZ0([...system.defaultZ0]);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#1a1a24',
                      border: '1px solid #2a2a34',
                      borderRadius: '4px',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
              
              {/* Parameters */}
              <div style={{
                padding: '12px 24px',
                borderBottom: '1px solid #1a1a24',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                alignItems: 'center',
              }}>
                {Object.entries(system.paramLabels).map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '11px', color: '#666', minWidth: '80px' }}>
                      {label}
                    </label>
                    <input
                      type="range"
                      min={system.paramRanges[key]?.[0] ?? -10}
                      max={system.paramRanges[key]?.[1] ?? 10}
                      step={(system.paramRanges[key]?.[1] - system.paramRanges[key]?.[0]) / 100 || 0.1}
                      value={params[key] ?? 0}
                      onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
                      style={{ width: '80px' }}
                    />
                    <span style={{ fontSize: '11px', color: '#888', minWidth: '40px' }}>
                      {(params[key] ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
                
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={showFlow}
                      onChange={(e) => setShowFlow(e.target.checked)}
                      style={{ marginRight: '4px' }}
                    />
                    Vector field
                  </label>
                </div>
              </div>
              
              {/* Initial Conditions (ODE only) */}
              {!isPDE && (
                <div style={{
                  padding: '8px 24px',
                  borderBottom: '1px solid #1a1a24',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                  fontSize: '11px',
                }}>
                  <span style={{ color: '#666' }}>Initial:</span>
                  {z0.map((val, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#888' }}>{system.stateLabels?.[idx] + '\u2080'} =</span>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => handleZ0Change(idx, parseFloat(e.target.value) || 0)}
                        style={{
                          width: '60px',
                          background: '#14141c',
                          border: '1px solid #2a2a34',
                          borderRadius: '3px',
                          padding: '2px 6px',
                          color: '#c8c8d0',
                          fontSize: '11px',
                        }}
                      />
                    </div>
                  ))}
                  
                  <span style={{ color: '#666', marginLeft: '16px' }}>Time:</span>
                  <input
                    type="number"
                    value={tSpan[1]}
                    onChange={(e) => setTSpan([0, parseFloat(e.target.value) || 10])}
                    style={{
                      width: '60px',
                      background: '#14141c',
                      border: '1px solid #2a2a34',
                      borderRadius: '3px',
                      padding: '2px 6px',
                      color: '#c8c8d0',
                      fontSize: '11px',
                    }}
                  />
                </div>
              )}
              
              {/* PDE Controls */}
              {isPDE && (
                <div style={{
                  padding: '8px 24px',
                  borderBottom: '1px solid #1a1a24',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  fontSize: '11px',
                }}>
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    style={{
                      padding: '6px 16px',
                      background: isRunning ? '#7f1d1d' : '#14532d',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 500,
                    }}
                  >
                    {isRunning ? '\u25A0 Stop' : '\u25B6 Run'}
                  </button>
                  <button
                    onClick={resetPDE}
                    style={{
                      padding: '6px 16px',
                      background: '#1a1a24',
                      border: '1px solid #2a2a34',
                      borderRadius: '4px',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    Reset
                  </button>
                  <span style={{ color: '#555', marginLeft: '12px' }}>
                    {pdeSolver && `t = ${typeof pdeSolver.time === 'number' ? pdeSolver.time.toFixed(1) : pdeSolver.time}`}
                  </span>
                </div>
              )}
              
              {/* Plots */}
              <div style={{
                flex: 1,
                padding: '24px',
                display: 'flex',
                gap: '24px',
                overflow: 'auto',
                background: '#08080c',
              }}>
                {/* ODE Visualizations */}
                {!isPDE && (
                  <>
                    {/* Time Series */}
                    <div style={{
                      background: '#0a0a0f',
                      border: '1px solid #1a1a24',
                      borderRadius: '6px',
                      padding: '16px',
                    }}>
                      <div style={{
                        fontSize: '10px',
                        color: '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '12px',
                      }}>
                        Time Series
                      </div>
                      <TimeSeriesPlot
                        t={result.t}
                        z={result.z}
                        labels={system.stateLabels}
                        width={450}
                        height={250}
                      />
                    </div>
                    
                    {/* Phase Portrait */}
                    <div style={{
                      background: '#0a0a0f',
                      border: '1px solid #1a1a24',
                      borderRadius: '6px',
                      padding: '16px',
                    }}>
                      <div style={{
                        fontSize: '10px',
                        color: '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '12px',
                      }}>
                        Phase Portrait
                      </div>
                      {system.stateLabels?.length >= 3 ? (
                        <Plot3D
                          z={result.z}
                          width={300}
                          height={300}
                          rotation={rotation3D}
                        />
                      ) : (
                        <PhasePlot
                          z={result.z}
                          labels={system.stateLabels}
                          width={300}
                          height={300}
                          showFlow={showFlow}
                          rhs={system.rhs}
                          params={params}
                        />
                      )}
                    </div>
                    
                    {/* 2D projections for 3D+ systems */}
                    {system.stateLabels?.length >= 3 && (
                      <div style={{
                        background: '#0a0a0f',
                        border: '1px solid #1a1a24',
                        borderRadius: '6px',
                        padding: '16px',
                      }}>
                        <div style={{
                          fontSize: '10px',
                          color: '#666',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          marginBottom: '12px',
                        }}>
                          Projections
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <PhasePlot z={result.z} xIdx={0} yIdx={1} labels={system.stateLabels} width={200} height={150} />
                          <PhasePlot z={result.z} xIdx={0} yIdx={2} labels={system.stateLabels} width={200} height={150} />
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Doppler Effect 3D Visualization */}
                {isDoppler && dopplerEngine && (
                  <>
                    <div style={{
                      background: '#0a0a0f',
                      border: '1px solid #1a1a24',
                      borderRadius: '6px',
                      padding: '16px',
                      flex: 1,
                      minWidth: 500,
                    }}>
                      <div style={{
                        fontSize: '10px',
                        color: '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <span>3D Wavefront Propagation</span>
                        <span style={{ color: '#444' }}>
                          t = {dopplerState?.time?.toFixed(2) || '0.00'} s
                        </span>
                      </div>
                      <div style={{ height: 400 }}>
                        <Doppler3DScene
                          engine={dopplerEngine}
                          isRunning={isRunning}
                          onStateUpdate={setDopplerState}
                          params={params}
                        />
                      </div>
                    </div>
                    
                    {/* Doppler Instrument Panel */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      minWidth: 280,
                    }}>
                      {/* Measurements */}
                      <div style={{
                        background: '#0a0a0f',
                        border: '1px solid #1a1a24',
                        borderRadius: '6px',
                        padding: '16px',
                      }}>
                        <div style={{
                          fontSize: '10px',
                          color: '#666',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          marginBottom: '12px',
                        }}>
                          Measurements
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#888' }}>Source f{'\u2080'}</span>
                            <span style={{ fontSize: 13, color: '#ef4444', fontFamily: 'ui-monospace' }}>
                              {params.frequency?.toFixed(3) || '0.500'} Hz
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#888' }}>Measured f</span>
                            <span style={{ fontSize: 13, color: '#4a9eff', fontFamily: 'ui-monospace', fontWeight: 600 }}>
                              {dopplerState?.lastFrequency?.toFixed(3) || '\u2014'} Hz
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#888' }}>Theoretical</span>
                            <span style={{ fontSize: 13, color: '#22c55e', fontFamily: 'ui-monospace' }}>
                              {dopplerState?.theoreticalFreq?.toFixed(3) || '\u2014'} Hz
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#888' }}>Doppler Ratio</span>
                            <span style={{ 
                              fontSize: 13, 
                              color: dopplerState?.lastFrequency > params.frequency ? '#22c55e' : '#f97316',
                              fontFamily: 'ui-monospace',
                              fontWeight: 600
                            }}>
                              {dopplerState?.lastFrequency 
                                ? `${(dopplerState.lastFrequency / params.frequency).toFixed(3)}\u00D7` 
                                : '\u2014'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#888' }}>Mach Number</span>
                            <span style={{ fontSize: 13, color: '#a855f7', fontFamily: 'ui-monospace' }}>
                              {(params.sourceSpeed / params.waveSpeed).toFixed(3)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#888' }}>Detections</span>
                            <span style={{ fontSize: 13, color: '#666', fontFamily: 'ui-monospace' }}>
                              {dopplerState?.detectionCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Frequency Plot */}
                      <div style={{
                        background: '#0a0a0f',
                        border: '1px solid #1a1a24',
                        borderRadius: '6px',
                        padding: '12px',
                      }}>
                        <DopplerFrequencyPlot
                          frequencies={dopplerState?.measuredFrequencies || []}
                          sourceFreq={params.frequency || 0.5}
                          theoreticalFreq={dopplerState?.theoreticalFreq || params.frequency}
                          width={256}
                          height={140}
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {/* PDE Visualizations */}
                {isPDE && pdeSolver && !isDoppler && (
                  <>
                    {/* Field Plot */}
                    <div style={{
                      background: '#0a0a0f',
                      border: '1px solid #1a1a24',
                      borderRadius: '6px',
                      padding: '16px',
                    }}>
                      <div style={{
                        fontSize: '10px',
                        color: '#666',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <span>
                          {system.pdeType === 'wave1d' ? 'Displacement' : 
                           system.pdeType === 'lbm' ? 'Velocity Magnitude' : 'Field'}
                        </span>
                        <span style={{ color: '#444' }}>
                          t = {pdeSolver.time?.toFixed?.(1) || pdeSolver.time}
                        </span>
                      </div>
                      
                      {system.pdeType === 'wave1d' ? (
                        <WaveformPlot
                          data={pdeSolver.u}
                          width={500}
                          height={200}
                          frame={pdeFrame}
                        />
                      ) : system.pdeType === 'lbm' ? (
                        <FieldPlot
                          data={pdeSolver.ux.map((vx, i) => Math.sqrt(vx*vx + pdeSolver.uy[i]*pdeSolver.uy[i]))}
                          nx={pdeSolver.nx}
                          ny={pdeSolver.ny}
                          width={500}
                          height={200}
                          colormap="viridis"
                          frame={pdeFrame}
                        />
                      ) : system.pdeType === 'grayscott' ? (
                        <FieldPlot
                          data={pdeSolver.uv}
                          nx={pdeSolver.nx}
                          ny={pdeSolver.ny}
                          width={400}
                          height={400}
                          colormap="viridis"
                          onClick={handleFieldClick}
                          frame={pdeFrame}
                        />
                      ) : (
                        <FieldPlot
                          data={pdeSolver.u}
                          nx={pdeSolver.nx}
                          ny={pdeSolver.ny}
                          width={400}
                          height={400}
                          colormap={system.pdeType === 'wave2d' ? 'coolwarm' : 'thermal'}
                          onClick={handleFieldClick}
                          frame={pdeFrame}
                          obstacle={system.pdeType === 'wave2d' ? pdeSolver.obstacle : null}
                        />
                      )}
                      
                      <div style={{
                        marginTop: '12px',
                        fontSize: '10px',
                        color: '#555',
                      }}>
                        {(system.pdeType === 'wave2d' || system.pdeType === 'grayscott' || system.pdeType === 'heat') && 
                          'Click to add perturbation'}
                      </div>
                    </div>
                    
                    {/* Wave2D Configuration Panel */}
                    {system.pdeType === 'wave2d' && (
                      <div style={{
                        background: '#0a0a0f',
                        border: '1px solid #1a1a24',
                        borderRadius: '6px',
                        padding: '16px',
                        minWidth: '200px',
                      }}>
                        <div style={{
                          fontSize: '10px',
                          color: '#666',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          marginBottom: '12px',
                        }}>
                          Membrane Config
                        </div>
                        
                        {/* Boundary Type */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>Boundary</div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {['fixed', 'box'].map(bt => (
                              <button
                                key={bt}
                                onClick={() => {
                                  setParams(p => ({ ...p, boundaryType: bt }));
                                  setTimeout(() => resetPDE(), 50);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: params.boundaryType === bt ? '#1a1a2e' : 'transparent',
                                  border: '1px solid #2a2a34',
                                  borderRadius: '3px',
                                  color: params.boundaryType === bt ? '#e8e8f0' : '#666',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  textTransform: 'capitalize',
                                }}
                              >
                                {bt}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Obstacle Type */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>Obstacle</div>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {['none', 'slit', 'double-slit', 'circle', 'random'].map(ot => (
                              <button
                                key={ot}
                                onClick={() => {
                                  setParams(p => ({ ...p, obstacleType: ot }));
                                  setTimeout(() => resetPDE(), 50);
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: params.obstacleType === ot ? '#1a1a2e' : 'transparent',
                                  border: '1px solid #2a2a34',
                                  borderRadius: '3px',
                                  color: params.obstacleType === ot ? '#e8e8f0' : '#666',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                }}
                              >
                                {ot}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Source Position */}
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                            Source X: {((params.sourceX || 0.5) * 100).toFixed(0)}%
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="0.9"
                            step="0.05"
                            value={params.sourceX || 0.5}
                            onChange={(e) => setParams(p => ({ ...p, sourceX: parseFloat(e.target.value) }))}
                            style={{ width: '100%' }}
                          />
                        </div>
                        
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
                            Source Y: {((params.sourceY || 0.5) * 100).toFixed(0)}%
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="0.9"
                            step="0.05"
                            value={params.sourceY || 0.5}
                            onChange={(e) => setParams(p => ({ ...p, sourceY: parseFloat(e.target.value) }))}
                            style={{ width: '100%' }}
                          />
                        </div>
                        
                        {/* Tap button */}
                        <button
                          onClick={() => {
                            if (pdeSolver) {
                              const nx = pdeSolver.nx;
                              const ny = pdeSolver.ny;
                              const srcX = Math.floor((params.sourceX || 0.5) * nx);
                              const srcY = Math.floor((params.sourceY || 0.5) * ny);
                              pdeSolver.tap(srcX, srcY, params.sourceWidth || 5, 1);
                              setPdeFrame(f => f + 1);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px',
                            background: 'linear-gradient(135deg, #4a9eff, #3a7ecc)',
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}
                        >
                          Tap at Source
                        </button>
                      </div>
                    )}
                    
                    {/* Presets for Gray-Scott */}
                    {system.presets && (
                      <div style={{
                        background: '#0a0a0f',
                        border: '1px solid #1a1a24',
                        borderRadius: '6px',
                        padding: '16px',
                        minWidth: '180px',
                      }}>
                        <div style={{
                          fontSize: '10px',
                          color: '#666',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          marginBottom: '12px',
                        }}>
                          Presets
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {system.presets.map((preset, idx) => (
                            <button
                              key={idx}
                              onClick={() => applyPreset(idx)}
                              style={{
                                padding: '8px 12px',
                                background: selectedPreset === idx ? '#1a1a2e' : 'transparent',
                                border: '1px solid #2a2a34',
                                borderRadius: '4px',
                                color: selectedPreset === idx ? '#e8e8f0' : '#888',
                                cursor: 'pointer',
                                fontSize: '11px',
                                textAlign: 'left',
                              }}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* LBM vorticity */}
                    {system.pdeType === 'lbm' && (
                      <div style={{
                        background: '#0a0a0f',
                        border: '1px solid #1a1a24',
                        borderRadius: '6px',
                        padding: '16px',
                      }}>
                        <div style={{
                          fontSize: '10px',
                          color: '#666',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          marginBottom: '12px',
                        }}>
                          Vorticity
                        </div>
                        <FieldPlot
                          data={pdeSolver.getVorticity()}
                          nx={pdeSolver.nx}
                          ny={pdeSolver.ny}
                          width={500}
                          height={200}
                          colormap="coolwarm"
                          frame={pdeFrame}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
