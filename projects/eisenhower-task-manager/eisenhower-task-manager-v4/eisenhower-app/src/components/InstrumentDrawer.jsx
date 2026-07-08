import React, { useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * InstrumentDrawer — a supplementary instrument that slides OUT like a tool
 * drawer over the Chronosphere floor.
 *
 * The cockpit metaphor: the globe is the console; the Instruments menu in the
 * right Command rail is the drawer bank. Selecting an instrument pulls its
 * drawer OUT from the right, over the dimmed globe. The vertical pull-handle on
 * the drawer's leading (left) edge is grabbable — drag it right to slide the
 * drawer shut (past ~a third → it snaps closed; short of that it springs back
 * open); a plain click closes it; clicking the scrim closes it.
 *
 * Opening is driven from the rail's Instruments menu. The globe stays mounted
 * underneath (dimmed by the scrim), never unmounts.
 */
export const InstrumentDrawer = ({ open, onClose, title = 'Matrix', wide = false, children }) => {
  const panelRef = useRef(null);
  const dragRef = useRef(null);       // live drag session: { startX, panelW, closedX, dx, moved }
  const [dragX, setDragX] = useState(null); // px the panel is dragged toward closed (null = CSS-controlled)

  const onHandleDown = (e) => {
    if (e.button != null && e.button !== 0) return;   // primary button / touch only
    const panel = panelRef.current;
    if (!panel) return;
    const panelW = panel.offsetWidth;
    // Matches the CSS closed transform: translateX(100% + 1rem + 30px).
    const closedX = panelW + 16 + 30;
    dragRef.current = { startX: e.clientX, panelW, closedX, dx: 0, moved: false };
    setDragX(0);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  };

  const onHandleMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    let dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    dx = Math.max(0, Math.min(dx, d.closedX)); // only rightward (open → closed)
    d.dx = dx;
    setDragX(dx);
  };

  const endDrag = (e) => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    // A tap (no real movement) closes, as before. A drag closes only if it
    // crossed a third of the panel width; otherwise it springs back open.
    const shouldClose = !d.moved || d.dx > d.panelW * 0.33;
    setDragX(null);   // release inline transform → CSS transition takes it home
    if (shouldClose) onClose();
  };

  // While dragging, the panel follows the finger 1:1 (no transition); released,
  // the inline style clears and the CSS transition snaps it open or closed.
  const panelStyle = dragX != null
    ? { transform: `translateX(${dragX}px)`, transition: 'none' }
    : undefined;

  return (
    <div className={`cin-drawer ${open ? 'is-open' : ''} ${wide ? 'is-wide' : ''} ${dragX != null ? 'is-dragging' : ''}`}>
      {/* Dim scrim — click off the drawer to slide it back in. Inert while
          stowed so the globe stays fully interactive. */}
      <div className="cin-drawer-scrim" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        className="cin-drawer-panel"
        role="dialog"
        aria-hidden={!open}
        aria-label={`${title} instrument`}
        style={panelStyle}
      >
        {/* Pull-handle on the drawer's leading (left) edge — drag to slide,
            click to close. */}
        <button
          type="button"
          className="cin-drawer-handle"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          title="Drag to slide · click to close"
          aria-label="Drag to slide or click to close drawer"
        >
          <ChevronRight size={14} className="cin-drawer-handle__chev" />
          <span className="cin-drawer-handle__label">{title}</span>
          <span className="cin-drawer-handle__grip" aria-hidden="true" />
        </button>
        <div className="cin-drawer-panel__body">{children}</div>
      </div>
    </div>
  );
};
