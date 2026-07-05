import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

// ============================================================
// CURVE DEFINITIONS
// ============================================================
function makeCurves() {
  const parabola = {
    name: "Parabola", halfW: 4.0, A: 0.35,
    yOfX(x) { return this.A * x * x; },
    dydxOfX(x) { return 2 * this.A * x; },
    desc: "y = Ax²",
  };
  const cycloidR = 1.3;
  const cycloid = {
    name: "Cycloid", halfW: Math.PI * cycloidR, R: cycloidR, _tbl: null,
    _init() {
      if (this._tbl) return;
      this._tbl = [];
      for (let i = 0; i <= 1000; i++) {
        const t = (2 * Math.PI * i) / 1000;
        this._tbl.push({ x: this.R * (t - Math.sin(t)) - this.halfW, y: this.R * (1 + Math.cos(t)) });
      }
    },
    yOfX(x) {
      this._init();
      for (let i = 1; i < this._tbl.length; i++) {
        if (this._tbl[i].x >= x) {
          const f = (x - this._tbl[i-1].x) / (this._tbl[i].x - this._tbl[i-1].x);
          return this._tbl[i-1].y + f * (this._tbl[i].y - this._tbl[i-1].y);
        }
      }
      return this._tbl[this._tbl.length-1].y;
    },
    dydxOfX(x) { this._init(); const d = 0.001; return (this.yOfX(x+d) - this.yOfX(x-d)) / (2*d); },
    desc: "Brachistochrone — isochronous oscillation",
  };
  const circArc = {
    name: "Circular Arc", halfW: 4.0, R: 5.5,
    yOfX(x) { const xc = Math.max(-this.R+0.01, Math.min(this.R-0.01, x)); return this.R - Math.sqrt(this.R*this.R - xc*xc); },
    dydxOfX(x) { const xc = Math.max(-this.R+0.01, Math.min(this.R-0.01, x)); return xc / Math.sqrt(this.R*this.R - xc*xc); },
    desc: "Pendulum — period depends on amplitude",
  };
  const sineA = 1.8, sineK = 1.5;
  const sineWave = {
    name: "Sine Wave", halfW: (2*Math.PI)/sineK, sA: sineA, sK: sineK,
    yOfX(x) { return this.sA * (1 - Math.cos(this.sK * x)); },
    dydxOfX(x) { return this.sA * this.sK * Math.sin(this.sK * x); },
    desc: "Multiple wells — potential barriers between valleys",
  };
  return [parabola, cycloid, circArc, sineWave];
}
const CURVES = makeCurves();

export default function BeadOnWire() {
  const mountRef = useRef(null);
  const playingRef = useRef(false);
  const releasedRef = useRef(false);
  const animRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReleased, setIsReleased] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [initHeight, setInitHeight] = useState(100);
  const [initSpeed, setInitSpeed] = useState(0);
  const [curveIdx, setCurveIdx] = useState(0);
  const initHeightRef = useRef(100);
  const initSpeedRef = useRef(0);
  const curveIdxRef = useRef(0);
  // Energy state for HTML overlay
  const [energyState, setEnergyState] = useState({ ke: 0, pe: 1, te: 1 });

  useEffect(() => { playingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { releasedRef.current = isReleased; }, [isReleased]);
  useEffect(() => { initHeightRef.current = initHeight; }, [initHeight]);
  useEffect(() => { initSpeedRef.current = initSpeed; }, [initSpeed]);
  useEffect(() => { curveIdxRef.current = curveIdx; }, [curveIdx]);

  useEffect(() => {
    setIsPlaying(false);
    setIsReleased(false);
    setResetKey(k => k + 1);
  }, [curveIdx]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const curve = CURVES[curveIdxRef.current];
    const halfW = curve.halfW;
    const g = 9.81;

    function yOfX(x) { return curve.yOfX(x); }
    function dydxOfX(x) { return curve.dydxOfX(x); }
    const yEndpoint = Math.max(yOfX(-halfW), yOfX(halfW));

    // Arc-length table
    const nArc = 800;
    const arcTable = [];
    const ddx = (2 * halfW) / nArc;
    let arcS = 0, px = -halfW, py = yOfX(-halfW);
    arcTable.push({ s: 0, x: px, y: py });
    for (let i = 1; i <= nArc; i++) {
      const cx = -halfW + i * ddx;
      const cy = yOfX(cx);
      arcS += Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);
      arcTable.push({ s: arcS, x: cx, y: cy });
      px = cx; py = cy;
    }
    const sTotal = arcTable[arcTable.length - 1].s;

    let sCenter = 0, yMin = Infinity;
    for (const pt of arcTable) { if (pt.y < yMin) { yMin = pt.y; sCenter = pt.s; } }

    function posFromS(sTarget) {
      const sc = Math.max(0, Math.min(sTotal, sTarget));
      for (let i = 1; i < arcTable.length; i++) {
        if (arcTable[i].s >= sc) {
          const f = (sc - arcTable[i-1].s) / (arcTable[i].s - arcTable[i-1].s);
          return {
            x: arcTable[i-1].x + f * (arcTable[i].x - arcTable[i-1].x),
            y: arcTable[i-1].y + f * (arcTable[i].y - arcTable[i-1].y),
          };
        }
      }
      const last = arcTable[arcTable.length-1];
      return { x: last.x, y: last.y };
    }

    function tangentialAccel(x) {
      const dydx = dydxOfX(x);
      return -g * dydx / Math.sqrt(1 + dydx * dydx);
    }

    function sFromYLeft(yTarget) {
      const yt = Math.max(yMin, Math.min(yEndpoint, yTarget));
      for (let i = 1; i < arcTable.length; i++) {
        if (arcTable[i].s > sCenter) break;
        if (arcTable[i].y <= yt && arcTable[i-1].y >= yt) {
          const f = (yt - arcTable[i-1].y) / (arcTable[i].y - arcTable[i-1].y);
          return arcTable[i-1].s + f * (arcTable[i].s - arcTable[i-1].s);
        }
      }
      return sTotal * 0.002;
    }

    // ---- THREE.JS SCENE ----
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1018);

    const yMid = (yMin + yEndpoint) / 2;
    const viewPad = 2.0;
    const viewHalfH = (yEndpoint - yMin) / 2 + viewPad;
    const aspect = width / height;
    let viewHalfW = viewHalfH * aspect;

    const camera = new THREE.OrthographicCamera(
      -viewHalfW, viewHalfW, yMid + viewHalfH, yMid - viewHalfH, 0.1, 100
    );
    camera.position.set(0, yMid, 10);
    camera.lookAt(0, yMid, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ---- PAN & ZOOM CONTROLS ----
    let panX = 0, panY = 0;
    let isDragging = false, dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;
    let zoomLevel = 1;

    function applyView() {
      const hw = viewHalfW * zoomLevel;
      const hh = viewHalfH * zoomLevel;
      camera.left = -hw + panX;
      camera.right = hw + panX;
      camera.top = yMid + hh + panY;
      camera.bottom = yMid - hh + panY;
      camera.updateProjectionMatrix();
    }

    const canvas = renderer.domElement;
    canvas.addEventListener("mousedown", (e) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      panStartX = panX;
      panStartY = panY;
      canvas.style.cursor = "grabbing";
    });
    canvas.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      // Convert pixel delta to world units
      const pixelsPerUnit = width / (2 * viewHalfW * zoomLevel);
      panX = panStartX - dx / pixelsPerUnit;
      panY = panStartY + dy / pixelsPerUnit;
      applyView();
    });
    canvas.addEventListener("mouseup", () => { isDragging = false; canvas.style.cursor = "grab"; });
    canvas.addEventListener("mouseleave", () => { isDragging = false; canvas.style.cursor = "grab"; });
    canvas.style.cursor = "grab";

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
      zoomLevel = Math.max(0.3, Math.min(3.0, zoomLevel * zoomFactor));
      applyView();
    }, { passive: false });

    // Touch support
    let lastTouchDist = 0;
    canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        dragStartX = e.touches[0].clientX;
        dragStartY = e.touches[0].clientY;
        panStartX = panX;
        panStartY = panY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastTouchDist = Math.sqrt(dx*dx + dy*dy);
      }
    }, { passive: true });
    canvas.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - dragStartX;
        const dy = e.touches[0].clientY - dragStartY;
        const pixelsPerUnit = width / (2 * viewHalfW * zoomLevel);
        panX = panStartX - dx / pixelsPerUnit;
        panY = panStartY + dy / pixelsPerUnit;
        applyView();
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (lastTouchDist > 0) {
          const scale = lastTouchDist / dist;
          zoomLevel = Math.max(0.3, Math.min(3.0, zoomLevel * scale));
          applyView();
        }
        lastTouchDist = dist;
      }
    }, { passive: true });
    canvas.addEventListener("touchend", () => { isDragging = false; lastTouchDist = 0; }, { passive: true });

    // Grid (extended for pan range)
    const gridMat = new THREE.LineBasicMaterial({ color: 0x1a2235 });
    const gridRange = 15;
    for (let yy = -gridRange; yy <= gridRange; yy++) {
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-gridRange, yy, -0.2), new THREE.Vector3(gridRange, yy, -0.2)
      ]), gridMat));
    }
    for (let xx = -gridRange; xx <= gridRange; xx++) {
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xx, -gridRange, -0.2), new THREE.Vector3(xx, gridRange, -0.2)
      ]), gridMat));
    }

    // Wire
    const wirePts = [];
    for (let i = 0; i <= 400; i++) {
      const x = -halfW + (2 * halfW * i) / 400;
      wirePts.push(new THREE.Vector3(x, yOfX(x), 0));
    }
    scene.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(wirePts),
      new THREE.LineBasicMaterial({ color: 0x4a90d9 })
    ));

    // Ground line
    const gl = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-halfW - 0.5, yMin, 0), new THREE.Vector3(halfW + 0.5, yMin, 0)
      ]),
      new THREE.LineDashedMaterial({ color: 0x2a3a55, dashSize: 0.15, gapSize: 0.1 })
    );
    gl.computeLineDistances();
    scene.add(gl);

    // Energy level line
    const energyLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-halfW - 0.5, 0, 0), new THREE.Vector3(halfW + 0.5, 0, 0)
      ]),
      new THREE.LineDashedMaterial({ color: 0xf5c842, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.4 })
    );
    energyLine.computeLineDistances();
    scene.add(energyLine);

    // Bead
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xf5c842 })
    );
    scene.add(bead);
    bead.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xf5c842, transparent: true, opacity: 0.12 })
    ));

    const startMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xf5c842, transparent: true, opacity: 0.3 })
    );
    scene.add(startMarker);

    // Arrows
    function createArrow(color) {
      const grp = new THREE.Group();
      const shaftGeo = new THREE.BufferGeometry();
      shaftGeo.setAttribute("position", new THREE.Float32BufferAttribute([0,0,0, 1,0,0], 3));
      grp.add(new THREE.Line(shaftGeo, new THREE.LineBasicMaterial({ color })));
      const hs = new THREE.Shape();
      hs.moveTo(0, 0.055); hs.lineTo(0.13, 0); hs.lineTo(0, -0.055); hs.closePath();
      const head = new THREE.Mesh(new THREE.ShapeGeometry(hs), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
      head.position.set(1, 0, 0);
      grp.add(head);
      grp.userData = { shaft: grp.children[0], head };
      scene.add(grp);
      return grp;
    }
    function updateArrow(arr, ox, oy, dx, dy, len) {
      if (len < 0.005) { arr.visible = false; return; }
      arr.visible = true;
      arr.position.set(ox, oy, 0.01);
      arr.rotation.set(0, 0, Math.atan2(dy, dx));
      const p = arr.userData.shaft.geometry.attributes.position.array;
      p[3] = len; arr.userData.shaft.geometry.attributes.position.needsUpdate = true;
      arr.userData.head.position.set(len, 0, 0);
    }
    const velArrow = createArrow(0x50e880);
    const gravArrow = createArrow(0xe85050);

    // Physics constants
    const maxBarE = g * yEndpoint;
    const vMaxPossible = Math.sqrt(Math.max(0.01, 2 * g * yEndpoint));
    const velScale = 2.2 / Math.max(vMaxPossible, 1);
    const gravLen = 1.1;

    // Simulation state
    let sCur = 0, vSigned = 0, dir = 1, lastTime = null;
    let simTotalE = 0, simYMaxClamped = 0, simInitialized = false;
    let frameCount = 0;

    function animate(time) {
      animRef.current = requestAnimationFrame(animate);

      if (!releasedRef.current) {
        const hF = initHeightRef.current / 100;
        const y0Live = yMin + hF * (yEndpoint - yMin);
        let sLive = y0Live - yMin < 0.01 ? sCenter : sFromYLeft(y0Live);
        const lp = posFromS(sLive);
        bead.position.set(lp.x, lp.y, 0);
        startMarker.position.set(lp.x, lp.y, 0);

        const v0Live = (initSpeedRef.current / 100) * vMaxPossible;
        const teLive = 0.5 * v0Live * v0Live + g * y0Live;
        const ymLive = Math.min(teLive / g, yEndpoint);
        const elp = energyLine.geometry.attributes.position.array;
        elp[1] = ymLive; elp[4] = ymLive;
        energyLine.geometry.attributes.position.needsUpdate = true;

        const peFrac = g * y0Live;
        const keFrac = 0.5 * v0Live * v0Live;
        const dm = Math.max(teLive, maxBarE * 0.1);
        if (frameCount++ % 3 === 0) setEnergyState({ ke: keFrac / dm, pe: peFrac / dm, te: teLive / dm });

        velArrow.visible = false;
        updateArrow(gravArrow, lp.x, lp.y, 0, -1, gravLen);
        lastTime = null;
        renderer.render(scene, camera);
        return;
      }

      if (!playingRef.current) { lastTime = null; renderer.render(scene, camera); return; }

      if (!simInitialized) {
        const hF = initHeightRef.current / 100;
        const y0Now = yMin + hF * (yEndpoint - yMin);
        const v0Now = (initSpeedRef.current / 100) * vMaxPossible;
        simTotalE = 0.5 * v0Now * v0Now + g * y0Now;
        simYMaxClamped = Math.min(simTotalE / g, yEndpoint);
        sCur = y0Now - yMin < 0.01 ? sCenter : sFromYLeft(y0Now);
        vSigned = v0Now;
        dir = 1;
        simInitialized = true;
      }

      if (lastTime === null) { lastTime = time; renderer.render(scene, camera); return; }

      const dt = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      const nSub = 4;
      const subDt = dt / nSub;
      for (let sub = 0; sub < nSub; sub++) {
        const pos = posFromS(sCur);
        const at = tangentialAccel(pos.x);
        sCur += vSigned * subDt + 0.5 * at * subDt * subDt;
        if (sCur < 0) sCur = 0;
        if (sCur > sTotal) sCur = sTotal;
        const np = posFromS(sCur);
        const keHere = simTotalE - g * np.y;
        if (keHere <= 0) {
          vSigned = -vSigned * 0.01;
        } else {
          const vNew = vSigned + at * subDt;
          const speed = Math.sqrt(2 * keHere);
          vSigned = vNew >= 0 ? speed : -speed;
        }
      }

      dir = vSigned >= 0 ? 1 : -1;
      const np = posFromS(sCur);
      bead.position.set(np.x, np.y, 0);

      const keNow = Math.max(0, simTotalE - g * np.y);
      const spd = Math.sqrt(2 * keNow);
      const dydx = dydxOfX(np.x);
      const tl = Math.sqrt(1 + dydx * dydx);
      updateArrow(velArrow, np.x, np.y, dir / tl, dir * dydx / tl, spd * velScale);
      updateArrow(gravArrow, np.x, np.y, 0, -1, gravLen);

      const peVal = g * np.y;
      const keVal = Math.max(0, simTotalE - peVal);
      const dm = Math.max(simTotalE, maxBarE * 0.1);
      if (frameCount++ % 3 === 0) setEnergyState({ ke: keVal / dm, pe: peVal / dm, te: (keVal + peVal) / dm });

      const elp2 = energyLine.geometry.attributes.position.array;
      elp2[1] = simYMaxClamped; elp2[4] = simYMaxClamped;
      energyLine.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    }

    animRef.current = requestAnimationFrame(animate);

    function onResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const a = w / h;
      viewHalfW = viewHalfH * a;
      applyView();
      renderer.setSize(w, h);
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [resetKey]);

  function doReset() { setIsPlaying(false); setIsReleased(false); setResetKey(k => k + 1); }
  function doRelease() { setIsReleased(true); setIsPlaying(true); }

  const barH = 120;
  function BarFill({ frac, color }) {
    const h = Math.max(1, Math.min(1, Math.max(0, frac)) * barH);
    return (
      <div style={{ width: 18, height: barH, background: "#141c28", borderRadius: 3, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", bottom: 0, width: "100%", height: h,
          background: color, borderRadius: "0 0 3px 3px", transition: "height 0.05s linear",
        }} />
      </div>
    );
  }

  return (
    <div style={{
      width: "100%", height: "100vh", background: "#0c1018",
      display: "flex", flexDirection: "column",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 24px", borderBottom: "1px solid #1a2540",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#c8d6e5", letterSpacing: "0.06em" }}>BEAD ON A WIRE</div>
          <div style={{ fontSize: "10px", color: "#4a6080", marginTop: "2px", letterSpacing: "0.08em" }}>ENERGY-CONSERVING CONSTRAINED MOTION</div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {!isReleased ? (
            <button onClick={doRelease} style={{
              background: "#1a3a25", border: "1px solid #2a6040", color: "#50e880",
              padding: "6px 20px", borderRadius: "4px", cursor: "pointer",
              fontSize: "11px", fontFamily: "inherit", letterSpacing: "0.06em", fontWeight: 700,
            }}>▶ RELEASE</button>
          ) : (
            <button onClick={() => setIsPlaying(!isPlaying)} style={{
              background: isPlaying ? "#1a2540" : "#243350", border: "1px solid #2a4060", color: "#c8d6e5",
              padding: "6px 20px", borderRadius: "4px", cursor: "pointer",
              fontSize: "11px", fontFamily: "inherit", letterSpacing: "0.06em",
            }}>{isPlaying ? "⏸ PAUSE" : "▶ PLAY"}</button>
          )}
          <button onClick={doReset} style={{
            background: "#1a2540", border: "1px solid #2a4060", color: "#c8d6e5",
            padding: "6px 20px", borderRadius: "4px", cursor: "pointer",
            fontSize: "11px", fontFamily: "inherit", letterSpacing: "0.06em",
          }}>↺ RESET</button>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        padding: "10px 24px", borderBottom: "1px solid #1a2540",
        display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap", fontSize: "11px", color: "#8a9ab0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#5a7a9a", letterSpacing: "0.05em" }}>CURVE:</span>
          <div style={{ display: "flex", gap: "4px" }}>
            {CURVES.map((c, i) => (
              <button key={c.name} onClick={() => setCurveIdx(i)} style={{
                background: curveIdx === i ? "#2a4a6a" : "#121a28",
                border: curveIdx === i ? "1px solid #4a90d9" : "1px solid #1a2540",
                color: curveIdx === i ? "#c8d6e5" : "#4a6080",
                padding: "4px 10px", borderRadius: "3px", cursor: "pointer",
                fontSize: "10px", fontFamily: "inherit", letterSpacing: "0.04em",
              }}>{c.name}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#5a7a9a", letterSpacing: "0.05em", minWidth: "80px" }}>HEIGHT: {initHeight}%</span>
          <input type="range" min="0" max="100" value={initHeight}
            onChange={e => setInitHeight(Number(e.target.value))} style={{ width: "100px", accentColor: "#4a90d9" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#5a7a9a", letterSpacing: "0.05em", minWidth: "80px" }}>SPEED: {initSpeed}%</span>
          <input type="range" min="0" max="100" value={initSpeed}
            onChange={e => setInitSpeed(Number(e.target.value))} style={{ width: "100px", accentColor: "#50e880" }} />
        </div>
      </div>

      {/* Legend */}
      <div style={{
        padding: "6px 24px", display: "flex", justifyContent: "space-between",
        fontSize: "10px", color: "#5a7090", letterSpacing: "0.05em",
      }}>
        <div style={{ display: "flex", gap: "20px" }}>
          <span><span style={{ color: "#f5c842" }}>●</span> Particle</span>
          <span><span style={{ color: "#50e880" }}>→</span> Velocity</span>
          <span><span style={{ color: "#e85050" }}>↓</span> Gravity</span>
          <span><span style={{ color: "#4a90d9" }}>━</span> Wire</span>
          <span><span style={{ color: "#f5c84266" }}>┈</span> Energy level</span>
        </div>
        <div style={{ color: "#3a5a7a", fontStyle: "italic" }}>{CURVES[curveIdx]?.desc}</div>
      </div>

      {/* Main area: energy bars + canvas */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative" }}>
        {/* Energy bars overlay */}
        <div style={{
          width: "60px", display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: "6px", padding: "10px 6px",
          background: "rgba(12, 16, 24, 0.85)", borderRight: "1px solid #1a2540", zIndex: 2,
        }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div style={{ textAlign: "center" }}>
              <BarFill frac={energyState.ke} color="#50e880" />
              <div style={{ fontSize: "9px", color: "#50e880", marginTop: 4, letterSpacing: "0.05em" }}>KE</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <BarFill frac={energyState.pe} color="#5090e8" />
              <div style={{ fontSize: "9px", color: "#5090e8", marginTop: 4, letterSpacing: "0.05em" }}>PE</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <BarFill frac={energyState.te} color="#f5c842" />
              <div style={{ fontSize: "9px", color: "#f5c842", marginTop: 4, letterSpacing: "0.05em" }}>E</div>
            </div>
          </div>
        </div>
        {/* Three.js canvas */}
        <div ref={mountRef} style={{ flex: 1, minHeight: 0 }} />
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px 24px", borderTop: "1px solid #1a2540",
        fontSize: "10px", color: "#3a5070", letterSpacing: "0.05em", textAlign: "center",
      }}>
        E = ½mv² + mgy &nbsp;·&nbsp; v = √(2(E − mgy)/m) &nbsp;·&nbsp; Kinematic sub-stepping
      </div>
    </div>
  );
}
