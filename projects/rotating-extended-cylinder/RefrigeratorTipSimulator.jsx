import React, { useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  GRAVITY,
  PHYS_DT,
  MAX_STEPS_PER_FRAME,
  makeInitialState,
  physicsStep,
  quatRotate,
  classifyOutcome,
} from "./physicsCore.mjs";

// Default parameter set (the §3.4 reference geometry: 350 g can, 3.3 cm
// radius, 16 cm height, 30 cm from hinge, μ=0.5, 80 ms pulse, 0.15 door).
const DEFAULTS = {
  m: 0.35, r: 0.033, h: 0.16, x0: 0.30, mu: 0.5,
  peakTau: 2.5, pulseWidth: 0.08, iDoor: 0.15, doorDamping: 0.05,
};

// Documented test cases — the validation table from the project brief §3.4.
// Each varies only peak torque on the default geometry. `regime` is the
// pass criterion (robust); `phiMax` deg is reference (model-parameter-soft,
// per the N1 convergence study).
const TEST_CASES = [
  { id: 1, label: 'T1 · static',        peakTau: 2.5, regime: 'static',      phiMax: 0.0,  note: 'below tip threshold' },
  { id: 2, label: 'T2 · barely tips',   peakTau: 3.5, regime: 'tip-recover', phiMax: 2.0,  note: 'small but visible lean, settles' },
  { id: 3, label: 'T3 · clear recover', peakTau: 4.5, regime: 'tip-recover', phiMax: 4.9,  note: 'clear tip-and-recover' },
  { id: 4, label: 'T4 · deep recover',  peakTau: 5.2, regime: 'tip-recover', phiMax: 18.7, note: 'very deep excursion (84% of φc) — sits just below the production-dt topple edge; would topple at finer dt' },
  { id: 5, label: 'T5 · topple',        peakTau: 6.5, regime: 'topple',      phiMax: 88.8, note: 'exceeds φc, falls over' },
];

// =====================================================================
// RefrigeratorTipSimulator
// ---------------------------------------------------------------------
// A physics-faithful 3D simulator of a cylindrical drink on a swinging
// refrigerator door shelf. Captures four regimes:
//   static | sliding | tip-and-recover | toppling
// with explicit constraint-manifold switching (flat base / rim point /
// fallen) and rim-rolling kinematics during the tip-recover regime.
//
// Door motion is DERIVED from an applied torque profile τ(t) and the
// door's moment of inertia — not prescribed — so the impulse parameter
// has direct physical meaning.
//
// All physics lives in ./physicsCore.mjs (shared with the headless
// validate.mjs / sweep.mjs harnesses). This file is the R3F view only.
// =====================================================================

// ---------------------------------------------------------------------
// React-Three components
// ---------------------------------------------------------------------
function Refrigerator() {
  return (
    <group>
      {/* Refrigerator body */}
      <mesh position={[-0.35, 0.6, 0]}>
        <boxGeometry args={[0.05, 1.4, 0.7]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.7} />
      </mesh>
      {/* Hinge marker */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.05, 16]} />
        <meshStandardMaterial color="#6b6b6b" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function DoorAndShelf({ stateRef, paramsRef }) {
  const doorGroup = useRef();
  useFrame(() => {
    if (doorGroup.current) {
      doorGroup.current.rotation.y = stateRef.current.theta;
    }
  });
  return (
    <group ref={doorGroup} position={[0, 0, 0]}>
      {/* Door panel, shelf, and lip. The whole assembly is offset back in z
          (Δz = -0.08) so the shelf's depth-centre sits under the cylinder
          (which lives at z = 0 in the physics frame — see note). The
          door→shelf→lip spacing is unchanged from the original. */}
      {/* Door panel — transparent (glassy) so the shelf and cylinder behind
          it stay visible from any orbit angle. */}
      <mesh position={[0.30, 0.5, -0.08]}>
        <boxGeometry args={[0.60, 1.0, 0.02]} />
        <meshStandardMaterial color="#dadada" roughness={0.2} metalness={0.1}
          transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* Shelf surface — centred on the cylinder (z = 0) */}
      <mesh position={[0.30, 0, 0]}>
        <boxGeometry args={[0.55, 0.01, 0.14]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.6} />
      </mesh>
      {/* Shelf lip (front rail) */}
      <mesh position={[0.30, 0.025, 0.07]}>
        <boxGeometry args={[0.55, 0.05, 0.005]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.4} roughness={0.3} />
      </mesh>
      {/* The can */}
      <Cylinder stateRef={stateRef} paramsRef={paramsRef} />
      {/* Contact-point marker */}
      <ContactMarker stateRef={stateRef} paramsRef={paramsRef} />
      {/* Contact-point trace */}
      <CMTrace stateRef={stateRef} />
      {/* Top-centre marker rides the can (door frame); its swept trace is
          rendered in the lab frame — see <TopTrace> at the Canvas level. */}
      <TopMarker stateRef={stateRef} paramsRef={paramsRef} />
    </group>
  );
}

function Cylinder({ stateRef, paramsRef }) {
  const meshRef = useRef();
  useFrame(() => {
    const s = stateRef.current;
    const p = paramsRef.current;
    if (!meshRef.current) return;
    meshRef.current.position.set(s.cmPos[0], s.cmPos[1], s.cmPos[2]);
    meshRef.current.quaternion.set(s.quat[0], s.quat[1], s.quat[2], s.quat[3]);
    meshRef.current.scale.set(p.r / 0.033, p.h / 0.16, p.r / 0.033);
  });
  return (
    <mesh ref={meshRef} castShadow>
      <cylinderGeometry args={[0.033, 0.033, 0.16, 32]} />
      <meshStandardMaterial color="#1d9e75" roughness={0.35} metalness={0.5} />
    </mesh>
  );
}

function ContactMarker({ stateRef, paramsRef }) {
  const ref = useRef();
  useFrame(() => {
    const s = stateRef.current;
    const p = paramsRef.current;
    if (!ref.current) return;
    if (s.phase !== 'tip') { ref.current.visible = false; return; }
    ref.current.visible = true;
    const q = s.quat;
    const xA = [0, 0, 0], zA = [0, 0, 0];
    quatRotate(xA, q, [1, 0, 0]);
    quatRotate(zA, q, [0, 0, 1]);
    const A = p.r * xA[1], B = p.r * zA[1];
    const alphaMin = Math.atan2(B, A) + Math.PI;
    const cA = Math.cos(alphaMin), sA = Math.sin(alphaMin);
    const cRel = [0, 0, 0];
    quatRotate(cRel, q, [p.r * cA, -p.h / 2, p.r * sA]);
    ref.current.position.set(
      s.cmPos[0] + cRel[0],
      s.cmPos[1] + cRel[1],
      s.cmPos[2] + cRel[2]
    );
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.004, 12, 12]} />
      <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.6} />
    </mesh>
  );
}

function CMTrace({ stateRef }) {
  const lineRef = useRef();
  useFrame(() => {
    const s = stateRef.current;
    if (!lineRef.current) return;
    const trace = s.contactTrace;
    const geom = lineRef.current.geometry;
    const positions = new Float32Array(trace.length * 3);
    for (let i = 0; i < trace.length; i++) {
      positions[i * 3] = trace[i][0];
      positions[i * 3 + 1] = 0.002;
      positions[i * 3 + 2] = trace[i][1];
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setDrawRange(0, trace.length);
    geom.attributes.position.needsUpdate = true;
  });
  return (
    <line ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color="#f59e0b" linewidth={2} />
    </line>
  );
}

// Marker dot at the centre of the cylinder's top face.
function TopMarker({ stateRef, paramsRef }) {
  const ref = useRef();
  useFrame(() => {
    const s = stateRef.current;
    const p = paramsRef.current;
    if (!ref.current) return;
    const topRel = [0, 0, 0];
    quatRotate(topRel, s.quat, [0, p.h / 2, 0]);
    ref.current.position.set(
      s.cmPos[0] + topRel[0],
      s.cmPos[1] + topRel[1],
      s.cmPos[2] + topRel[2]
    );
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.005, 14, 14]} />
      <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.55} />
    </mesh>
  );
}

// Swept trace of the top-centre dot — the arc the can's top traces as it
// tips and recovers (cf. the ball trace in the rotating-slot project).
function TopTrace({ stateRef }) {
  const lineRef = useRef();
  useFrame(() => {
    const s = stateRef.current;
    if (!lineRef.current) return;
    const trace = s.topTrace;
    const geom = lineRef.current.geometry;
    const positions = new Float32Array(trace.length * 3);
    for (let i = 0; i < trace.length; i++) {
      positions[i * 3] = trace[i][0];
      positions[i * 3 + 1] = trace[i][1];
      positions[i * 3 + 2] = trace[i][2];
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setDrawRange(0, trace.length);
    geom.attributes.position.needsUpdate = true;
  });
  return (
    <line ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color="#38bdf8" transparent opacity={0.85} linewidth={2} />
    </line>
  );
}

// Canonical S1 slider (Acrylic HUD catalogue, locked) — div-based channel +
// fill + ticks + thumb + LED, driven by a `--val` CSS variable in [0,1].
// Drag with Pointer Events; props mapped to the underlying numeric range.
function S1Slider({ value, min, max, step = 0, onChange, onUserEdit }) {
  const ref = useRef(null);
  const drag = useRef(null);
  // Latest props in a ref so the mounted listeners see fresh values without
  // re-binding every render.
  const latest = useRef({ min, max, step, onChange });
  latest.current = { min, max, step, onChange };

  const frac = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

  const handlePointerDown = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    drag.current = { startX: e.clientX, startFrac: frac, travel: rect.width - 22 };
    e.preventDefault();
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    if (onUserEdit) onUserEdit();
  };

  useEffect(() => {
    const onMove = (e) => {
      const d = drag.current; if (!d) return;
      const { min, max, step, onChange } = latest.current;
      const dx = e.clientX - d.startX;
      const newFrac = Math.max(0, Math.min(1, d.startFrac + dx / Math.max(1, d.travel)));
      let v = min + newFrac * (max - min);
      if (step) v = Math.round(v / step) * step;
      v = Math.max(min, Math.min(max, v));
      onChange(v);
    };
    const onUp = () => {
      if (!drag.current) return;
      drag.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, []);

  return (
    <div className="slider" ref={ref}
      style={{ '--val': frac }} onPointerDown={handlePointerDown}>
      <div className="slider-fill" />
      <div className="slider-ticks">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className={`slider-tick${i % 2 === 0 ? ' slider-tick--major' : ''}`}
            style={{ left: `calc(9px + ${i / 10} * (100% - 18px))` }} />
        ))}
      </div>
      <div className="slider-thumb"><div className="slider-led" /></div>
    </div>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 2]} intensity={0.8} />
      <directionalLight position={[-2, 2, -1]} intensity={0.3} />
    </>
  );
}

function PhasePortrait({ stateRef, params }) {
  const canvasRef = useRef();
  useEffect(() => {
    let raf;
    const draw = () => {
      const c = canvasRef.current;
      if (!c) { raf = requestAnimationFrame(draw); return; }
      const dpr = window.devicePixelRatio || 1;
      const W = c.clientWidth, H = c.clientHeight;
      if (c.width !== W * dpr) { c.width = W * dpr; c.height = H * dpr; }
      const ctx = c.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const s = stateRef.current;
      const trace = s.phaseTrace;   // state-owned: grows during run, clears on reset

      const phiC = Math.atan(2 * params.r / params.h);
      const phiMax = Math.max(phiC * 1.4, 0.6);
      const phiDotMax = 8;
      // φ from computeTilt is unsigned (≥ 0), so the trajectory lives in the
      // right half-plane only. Origin is placed at the left edge accordingly.
      const toX = phi => (phi / phiMax) * W;
      const toY = pd => H / 2 - (pd / phiDotMax) * (H / 2);

      // Axes
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
      ctx.moveTo(toX(0), 0); ctx.lineTo(toX(0), H);
      ctx.stroke();

      // φ_c separatrix (single line — φ ≥ 0). Warm warn-hue.
      ctx.strokeStyle = 'rgba(255, 156, 92, 0.65)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(toX(phiC), 0); ctx.lineTo(toX(phiC), H);
      ctx.stroke();
      ctx.setLineDash([]);

      // Trace — cinematic cyan
      ctx.strokeStyle = '#7dd6ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      trace.forEach((p, i) => {
        const x = toX(p[0]);
        const y = toY(p[1]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Current point — neon amber
      const last = trace[trace.length - 1];
      if (last) {
        ctx.fillStyle = '#ffae20';
        ctx.beginPath();
        ctx.arc(toX(last[0]), toY(last[1]), 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels
      ctx.fillStyle = 'rgba(125, 214, 255, 0.6)';
      ctx.font = "10px 'Share Tech Mono', monospace";
      ctx.fillText('φ', W - 14, H / 2 - 4);
      ctx.fillText('φ̇', toX(0) + 4, 10);
      ctx.fillText(`φc = ${(phiC * 180 / Math.PI).toFixed(1)}°`, toX(phiC) + 4, 14);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [params.r, params.h, stateRef]);
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}

// ---------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------
export default function RefrigeratorTipSimulator() {
  const [m, setM] = useState(0.35);
  const [r, setR] = useState(0.033);
  const [h, setH] = useState(0.16);
  const [x0, setX0] = useState(0.30);
  const [mu, setMu] = useState(0.5);
  const [peakTau, setPeakTau] = useState(2.5);     // N·m
  const [pulseWidth, setPulseWidth] = useState(0.08); // s — brisk fling
  const [iDoor, setIDoor] = useState(0.15);        // kg·m^2 — door panel alone
  const [doorDamping, setDoorDamping] = useState(0.05);

  const stateRef = useRef(makeInitialState());
  const paramsRef = useRef({ m, r, h, x0, mu, peakTau, pulseWidth, iDoor, doorDamping });
  const [running, setRunning] = useState(false);
  const [, setTick] = useState(0);
  const [activeCase, setActiveCase] = useState(null);   // loaded test-case id
  const [lastResult, setLastResult] = useState(null);   // {regime, phiMaxDeg} of last completed run

  useEffect(() => {
    paramsRef.current = { m, r, h, x0, mu, peakTau, pulseWidth, iDoor, doorDamping };
  }, [m, r, h, x0, mu, peakTau, pulseWidth, iDoor, doorDamping]);

  // Reset state when geometry changes (not while running)
  const reset = useCallback(() => {
    const s = makeInitialState();
    s.cmPos[0] = x0;
    s.cmPos[1] = h / 2;
    stateRef.current = s;
    setTick(t => t + 1);
  }, [x0, h]);

  // Re-place the cylinder when geometry changes — but only while idle, and
  // never as a side effect of a run finishing. Keying on `reset` (which only
  // changes with x0/h) instead of `running` means a completed run is NOT
  // wiped, so traces persist until the user hits Run, Reset, or loads a case.
  const runningRef = useRef(running);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { if (!runningRef.current) reset(); }, [reset]);

  // Run-loop
  useEffect(() => {
    if (!running) return;
    let raf;
    let accum = 0;
    let lastT = performance.now();
    const loop = (t) => {
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      accum += dt;
      let steps = 0;
      while (accum >= PHYS_DT && steps < MAX_STEPS_PER_FRAME * 100) {
        physicsStep(stateRef.current, PHYS_DT, paramsRef.current);
        accum -= PHYS_DT;
        steps++;
      }
      setTick(k => k + 1);
      // Auto-stop after fallen & rested, or after 8s; capture the outcome.
      const s = stateRef.current;
      if ((s.fallen && s.t > 1.5) || s.t > 8) {
        setRunning(false);
        setLastResult({
          regime: classifyOutcome(s, paramsRef.current.x0),
          phiMaxDeg: s.phiMax * 180 / Math.PI,
        });
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const handleRun = () => {
    reset();
    setLastResult(null);
    setRunning(true);
  };
  const handleReset = () => {
    setRunning(false);
    reset();
  };

  // Load a documented test case: default geometry + the case's peak torque.
  const loadCase = (c) => {
    setRunning(false);
    setM(DEFAULTS.m); setR(DEFAULTS.r); setH(DEFAULTS.h); setX0(DEFAULTS.x0); setMu(DEFAULTS.mu);
    setPeakTau(c.peakTau); setPulseWidth(DEFAULTS.pulseWidth);
    setIDoor(DEFAULTS.iDoor); setDoorDamping(DEFAULTS.doorDamping);
    setActiveCase(c.id);
    setLastResult(null);
    const st = makeInitialState();
    st.cmPos[0] = DEFAULTS.x0; st.cmPos[1] = DEFAULTS.h / 2;
    stateRef.current = st;
    setTick(t => t + 1);
  };

  const s = stateRef.current;
  const phiC = Math.atan(2 * r / h);
  // Display thresholds
  const tipThresh = 2 * GRAVITY * r / h;
  const slipThresh = mu * GRAVITY;

  // Single classification authority — same as the headless harness.
  const regime = classifyOutcome(s, x0);

  const regimeColors = {
    'static':       ['#27272a', '#a1a1aa'],
    'slide':        ['#422006', '#fbbf24'],
    'tip-recover':  ['#022c22', '#34d399'],
    'topple':       ['#450a0a', '#f87171'],
  };

  const activeCaseObj = TEST_CASES.find(c => c.id === activeCase) || null;
  const casePass = activeCaseObj && lastResult ? lastResult.regime === activeCaseObj.regime : null;

  const sliderRow = (label, val, setter, min, max, step, fmt) => (
    <div className="rtc-slider-row">
      <label>{label}</label>
      <S1Slider value={val} min={min} max={max} step={step}
        onChange={setter} onUserEdit={() => setActiveCase(null)} />
      <span className="val">{fmt(val)}</span>
    </div>
  );

  // Map outcome regime → canonical led-dot color variant (catalogue).
  const regimeLed = { 'static': 'cyan', 'slide': 'amber', 'tip-recover': 'green', 'topple': 'red' };

  return (
    <>
      {/* Full-bleed 3D stage — fills the viewport behind the floating cards */}
      <div className="rtc-stage">
        <Canvas camera={{ position: [0.75, 0.80, 0.85], fov: 45 }} gl={{ alpha: true }} shadows>
          <Lights />
          <Refrigerator />
          <DoorAndShelf stateRef={stateRef} paramsRef={paramsRef} />
          {/* Lab-frame top trace at Canvas root (not in the rotating door group) */}
          <TopTrace stateRef={stateRef} />
          <gridHelper args={[2, 20, '#1f2733', '#141a22']} position={[0, -0.001, 0]} />
          {/* Left-drag = orbit. Right-drag = pan the lab frame. Scroll = zoom.
              Target = the hinge axis at door mid-height, so the door's centre
              of rotation is the default view centre and orbit pivot. */}
          <OrbitControls target={[0, 0.5, 0]} enablePan={true}
            screenSpacePanning={true} panSpeed={0.6}
            minDistance={0.4} maxDistance={2.5} />
        </Canvas>
      </div>

      {/* LEFT COLUMN — inputs (test cases + controls) */}
      <div className="rtc-col rtc-col--left">
      <div className="inst-panel">
        <div className="inst-panel__title">Test Cases <span className="sub">· §3.4</span></div>
        <div className="rtc-tests">
          {TEST_CASES.map(c => (
            <button key={c.id} className={`rtc-test${activeCase === c.id ? ' rtc-test--active' : ''}`}
              onClick={() => loadCase(c)} disabled={running} title={c.note}>
              <span>{c.label} <span className="tau">· {c.peakTau} N·m</span></span>
              <span className="reg" style={{ color: regimeColors[c.regime][1] }}>{c.regime}</span>
            </button>
          ))}
        </div>
        {activeCaseObj && (
          <div className="rtc-result">
            <div>expected: <span style={{ color: regimeColors[activeCaseObj.regime][1] }}>{activeCaseObj.regime}</span> · φmax≈{activeCaseObj.phiMax.toFixed(1)}°</div>
            {lastResult ? (
              <>
                <div>measured: <span style={{ color: regimeColors[lastResult.regime][1] }}>{lastResult.regime}</span> · φmax={lastResult.phiMaxDeg.toFixed(1)}°</div>
                <div style={{ marginTop: 6 }}>
                  <span className="rtc-badge" style={{
                    background: casePass ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                    color: casePass ? '#34d399' : '#f87171',
                    border: `1px solid ${(casePass ? '#34d399' : '#f87171')}55`,
                  }}>{casePass ? '✓ PASS' : '✗ FAIL'}</span>
                  <span style={{ color: 'var(--fg-3)', marginLeft: 8 }}>regime = criterion</span>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--fg-3)', marginTop: 2 }}>press RUN to evaluate</div>
            )}
          </div>
        )}
        <div className="rtc-runrow">
          <button className="cin-action rtc-action--go" onClick={handleRun} disabled={running}>
            {running ? 'RUNNING…' : '▶ RUN'}
          </button>
          <button className="cin-action" onClick={handleReset}>↺ RESET</button>
        </div>
      </div>

      {/* Controls card — stacked under Test Cases in the left column */}
      <div className="inst-panel">
        <div className="inst-panel__title">Door Dynamics</div>
        <div className="rtc-group">
          {sliderRow('peak τ', peakTau, setPeakTau, 0.5, 8, 0.1, v => `${v.toFixed(1)} N·m`)}
          {sliderRow('pulse', pulseWidth, setPulseWidth, 0.04, 0.5, 0.01, v => `${(v*1000).toFixed(0)} ms`)}
          {sliderRow('I_door', iDoor, setIDoor, 0.1, 1.5, 0.05, v => `${v.toFixed(2)}`)}
          {sliderRow('damping', doorDamping, setDoorDamping, 0, 0.3, 0.01, v => v.toFixed(2))}
        </div>
        <div className="inst-panel__title" style={{ marginTop: 6 }}>Cylinder</div>
        <div className="rtc-group">
          {sliderRow('mass', m, setM, 0.1, 1.5, 0.05, v => `${v.toFixed(2)} kg`)}
          {sliderRow('radius', r, setR, 0.020, 0.060, 0.001, v => `${(v*100).toFixed(1)} cm`)}
          {sliderRow('height', h, setH, 0.08, 0.25, 0.005, v => `${(v*100).toFixed(1)} cm`)}
          {sliderRow('x', x0, setX0, 0.10, 0.50, 0.01, v => `${(v*100).toFixed(0)} cm`)}
        </div>
        <div className="inst-panel__title" style={{ marginTop: 6 }}>Contact</div>
        <div className="rtc-group">
          {sliderRow('μ', mu, setMu, 0.05, 1.2, 0.05, v => v.toFixed(2))}
        </div>
      </div>
      </div>

      {/* RIGHT COLUMN — outputs (readout + phase portrait) */}
      <div className="rtc-col rtc-col--right">
      {/* live readout + regime */}
      <div className="inst-panel">
        <div className="inst-panel__title">Readout</div>
        <dl className="rtc-hud">
          <dt>t</dt><dd>{s.t.toFixed(3)} s</dd>
          <dt>θ</dt><dd>{(s.theta * 180 / Math.PI).toFixed(1)}°</dd>
          <dt>θ̇</dt><dd>{s.thetaDot.toFixed(2)} rad/s</dd>
          <dt>φ</dt><dd>{(s.phi * 180 / Math.PI).toFixed(2)}°</dd>
          <dt>φc</dt><dd>{(phiC * 180 / Math.PI).toFixed(2)}°</dd>
          <dt className="thr">tip thr</dt><dd className="thr">{tipThresh.toFixed(2)} m/s²</dd>
          <dt className="thr">slip thr</dt><dd className="thr">{slipThresh.toFixed(2)} m/s²</dd>
        </dl>
        <div className="rtc-regime">
          <span className="ctrl-led">
            <span className={`led-dot ${regimeLed[regime]}`} />
            {regime.toUpperCase()}
          </span>
        </div>
      </div>

      {/* phase portrait (data surface: glass-graph) */}
      <div className="rtc-graph-block">
        <div className="rtc-graph__label">Phase Portrait · (φ, φ̇)</div>
        <div className="glass-graph" style={{ height: 168 }}>
          <PhasePortrait stateRef={stateRef} params={paramsRef.current} />
        </div>
      </div>
      </div>
    </>
  );
}
