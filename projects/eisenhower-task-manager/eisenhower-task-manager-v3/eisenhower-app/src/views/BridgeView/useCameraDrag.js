import { useRef, useState } from 'react';

/**
 * Camera-drag state machine for the Horizon scene. Three button-routed
 * modes (DCC-viewport convention):
 *
 *   - LEFT   = SPIN     (vertical drag → viewAnchor along time axis)
 *   - MIDDLE = ALTITUDE (vertical drag → camera distance, exp-scaled)
 *   - RIGHT  = PAN      (cursor-tracked screen-space pan)
 *
 * Returns the three pieces of camera state (cameraAlt, panX, panY) and
 * a bundled `handlers` object the caller spreads onto the SVG. The
 * `setCameraAlt` setter is also exposed in case anything outside the
 * hook wants to programmatically jump to a particular altitude.
 *
 * The pointer-up handler also briefly raises a `justDragged` flag so
 * the synthetic click that follows a drag-release can be intercepted
 * via the `onClickCapture` handler — prevents click-through onto pips
 * after a slide gesture lands on one.
 *
 * @param svgRef        Ref to the SVG element (pointer capture + bbox).
 * @param init          { cameraAlt, panX, panY } defaults.
 * @param bounds        { ALT_MIN, ALT_MAX } altitude clamps.
 * @param viewBox       { W, H } SVG viewBox dims (for pan → viewBox units).
 * @param maxDays       Current horizon distance (left-drag time rate).
 * @param viewAnchor    Current time anchor.
 * @param setViewAnchor Time-anchor setter (left-drag uses this).
 */
export const useCameraDrag = ({
  svgRef,
  init,
  bounds,
  viewBox,
  maxDays,
  viewAnchor,
  setViewAnchor,
}) => {
  const [cameraAlt, setCameraAlt] = useState(init.cameraAlt);
  const [panX, setPanX] = useState(init.panX);
  const [panY, setPanY] = useState(init.panY);

  const dragState = useRef({
    active: false, mode: null,
    startX: 0, startY: 0,
    startAnchor: 0, startAlt: 0,
    startPanX: 0, startPanY: 0,
    moved: false,
  });
  const justDragged = useRef(false);

  const onPointerDown = (e) => {
    if (e.button === 1) {
      // Middle-click (wheel button): altitude
      dragState.current = { active: true, mode: 'alt', startY: e.clientY, startAlt: cameraAlt, moved: false };
      if (svgRef.current) svgRef.current.style.cursor = 'ns-resize';
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      e.preventDefault();
      return;
    }
    if (e.button === 2) {
      // Right-click: pan
      dragState.current = { active: true, mode: 'pan', startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY, moved: false };
      if (svgRef.current) svgRef.current.style.cursor = 'move';
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      e.preventDefault();
      return;
    }
    if (e.button !== undefined && e.button !== 0) return;
    if (!setViewAnchor) return;
    dragState.current = { active: true, mode: 'time', startY: e.clientY, startAnchor: viewAnchor, moved: false };
    if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const onPointerMove = (e) => {
    const s = dragState.current;
    if (!s.active || !svgRef.current) return;
    if (s.mode === 'alt') {
      const dy = e.clientY - s.startY;
      if (Math.abs(dy) > 4) s.moved = true;
      const containerH = svgRef.current.clientHeight || 600;
      /* Drag UP → dy negative → factor < 1 → altitude shrinks (closer).
         Slope tuned so one full container-height drag is ~e^1.6 ≈ 5×. */
      const factor = Math.exp(dy / Math.max(containerH, 1) * 1.6);
      const newAlt = Math.max(bounds.ALT_MIN, Math.min(bounds.ALT_MAX, s.startAlt * factor));
      setCameraAlt(newAlt);
      return;
    }
    if (s.mode === 'pan') {
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) s.moved = true;
      /* Convert screen-pixel delta → viewBox-unit delta so the globe
         tracks the cursor 1:1 even when the chart is resized. */
      const rect = svgRef.current.getBoundingClientRect();
      const sx = viewBox.W / Math.max(rect.width,  1);
      const sy = viewBox.H / Math.max(rect.height, 1);
      setPanX(s.startPanX + dx * sx);
      setPanY(s.startPanY + dy * sy);
      return;
    }
    // time-drag (left button)
    const dy = e.clientY - s.startY;
    if (Math.abs(dy) > 4) s.moved = true;
    const containerH = svgRef.current.clientHeight || 600;
    const daysPerPx = (2 * maxDays) / Math.max(containerH, 1);
    setViewAnchor(s.startAnchor + dy * daysPerPx);
  };

  const onPointerUp = (e) => {
    const s = dragState.current;
    if (!s.active) return;
    justDragged.current = s.moved;
    dragState.current.active = false;
    if (svgRef.current) svgRef.current.style.cursor = '';
    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    setTimeout(() => { justDragged.current = false; }, 0);
  };

  const onContextMenu = (e) => e.preventDefault();
  const onClickCapture = (e) => {
    if (justDragged.current) { e.stopPropagation(); e.preventDefault(); }
  };

  return {
    cameraAlt, setCameraAlt,
    panX, panY,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onContextMenu,
      onClickCapture,
    },
  };
};
