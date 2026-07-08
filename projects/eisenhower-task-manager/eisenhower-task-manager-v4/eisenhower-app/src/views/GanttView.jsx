import React, { useState } from 'react';
import { QID_BY_QUAD } from '../lib/quadrant';

/**
 * PHASE 4b: GanttView (cinematic). 21-day timeline window centered on
 * today. Each task with a dueDate appears as a horizontal bar:
 *   - Upcoming: bar runs from today to dueDate (length = time left)
 *   - Overdue: bar runs from dueDate to today, RED (how late)
 *   - Same-day: 1-day pill at the today column
 * Today line in amber, weekends faded, click bar OR label to edit.
 * Filter by quadrant. v2's GanttView had richer interactions (zoom,
 * multi-week, etc.); simplified to match the demo prototype.
 *
 * Events (t.isEvent) are filtered out — they belong on the Bridge /
 * Calendar, not on the Gantt task timeline.
 */
export const GanttView = ({ tasks, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, settings }) => {
  const [filterQuad, setFilterQuad] = useState('all');
  const scrollRef = React.useRef(null);

  /* Tape-gauge timeline. Pixel-laid-out 7-month tape with NO browser
     scrollbar — the user click-and-drags anywhere on the tape to scrub
     forward/back through time. Plain wheel zooms (anchored on the cursor
     day so the point under the cursor stays under the cursor); Shift+wheel
     scrolls vertically through the task list. Label column sticks to the
     left during scrub; axis sticks to the top during vertical scroll. */
  const WINDOW_BACK  = 30;
  const WINDOW_FWD   = 180;
  const WINDOW_TOTAL = WINDOW_BACK + 1 + WINDOW_FWD;   // 211 days
  const LABEL_WIDTH  = 220;
  const PX_PER_DAY_MIN = 6;
  const PX_PER_DAY_MAX = 80;
  const [pxPerDay, setPxPerDay] = useState(24);
  const TAPE_PX         = WINDOW_TOTAL * pxPerDay;
  const TODAY_OFFSET_PX = WINDOW_BACK * pxPerDay;
  const showMondayLabels = pxPerDay >= 14;   // collapse to month-firsts only when dense

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayOffset = (d) => {
    const dd = new Date(d); dd.setHours(0,0,0,0);
    return Math.round((dd - today) / 86400000);
  };

  const visible = tasks.filter(t => {
    if (t.isEvent) return false;            // events don't belong on the Gantt
    if (t.percentComplete === 100) return false;
    if (!t.dueDate) return false;
    if (filterQuad !== 'all' && getQuadrant(t) !== filterQuad) return false;
    const off = dayOffset(t.dueDate, t.dueTime);
    return off >= -WINDOW_BACK && off <= WINDOW_FWD;
  }).sort((a, b) => dayOffset(a.dueDate, a.dueTime) - dayOffset(b.dueDate, b.dueTime));

  const scrollToToday = React.useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    const todayLeft = LABEL_WIDTH + TODAY_OFFSET_PX;
    const target = Math.max(0, todayLeft - el.clientWidth * 0.25);
    if (smooth) el.scrollTo({ left: target, behavior: 'smooth' });
    else        el.scrollLeft = target;
  }, [LABEL_WIDTH, TODAY_OFFSET_PX]);

  /* Anchor on today on initial mount only. Depending on scrollToToday here
     would re-fire after every wheel zoom (its useCallback identity changes
     with pxPerDay), which would override the cursor-anchored zoom correction
     below with a snap back to today. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { scrollToToday(false); }, []);

  /* Wheel zoom. React's onWheel is passive — to call preventDefault and
     keep the page from scrolling we attach via addEventListener with
     { passive: false }. Anchor: the day under the cursor must stay under
     the cursor across the zoom. We capture the anchor here, commit the
     new pxPerDay via setState, then a useLayoutEffect on [pxPerDay] reads
     the anchor and corrects scrollLeft before the browser paints. */
  const zoomAnchorRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e) => {
      // Shift+wheel routes through to vertical scroll (task list).
      if (e.shiftKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorXInViewport = e.clientX - rect.left;
      const cursorXInTape = cursorXInViewport + el.scrollLeft - LABEL_WIDTH;
      const cursorDay = cursorXInTape / pxPerDay;
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      const next = Math.max(PX_PER_DAY_MIN, Math.min(PX_PER_DAY_MAX, pxPerDay * factor));
      if (next === pxPerDay) return;          // at clamp boundary
      zoomAnchorRef.current = { cursorDay, cursorXInViewport };
      setPxPerDay(next);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [pxPerDay, LABEL_WIDTH]);

  // Cursor-anchored zoom correction. Runs synchronously after pxPerDay
  // commits, before the browser paints — so the zoom feels "around the
  // cursor" with no visible jump.
  React.useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current;
    if (!anchor || !scrollRef.current) return;
    zoomAnchorRef.current = null;
    const el = scrollRef.current;
    const newCursorXInTape = anchor.cursorDay * pxPerDay;
    el.scrollLeft = Math.max(0, newCursorXInTape + LABEL_WIDTH - anchor.cursorXInViewport);
  }, [pxPerDay, LABEL_WIDTH]);

  /* Click-and-drag scrub. Pointer capture so the cursor can leave the tape
     and the drag still tracks. justDragged ref + click-capture handler
     suppresses the synthetic click that follows a drag — otherwise releasing
     after a slide-onto-a-bar would open the task editor. */
  const dragState  = React.useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const justDragged = React.useRef(false);

  const onPointerDown = (e) => {
    if (!scrollRef.current) return;
    if (e.button !== undefined && e.button !== 0) return;   // left button only
    dragState.current = {
      active: true,
      startX: e.clientX,
      startScroll: scrollRef.current.scrollLeft,
      moved: false
    };
    scrollRef.current.style.cursor = 'grabbing';
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onPointerMove = (e) => {
    const s = dragState.current;
    if (!s.active || !scrollRef.current) return;
    const dx = e.clientX - s.startX;
    if (Math.abs(dx) > 4) s.moved = true;
    scrollRef.current.scrollLeft = s.startScroll - dx;
  };
  const onPointerUp = (e) => {
    const s = dragState.current;
    if (!s.active) return;
    justDragged.current = s.moved;
    dragState.current.active = false;
    if (scrollRef.current) scrollRef.current.style.cursor = '';
    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    // Clear the suppress flag after the trailing click (if any) has fired.
    setTimeout(() => { justDragged.current = false; }, 0);
  };
  const onClickCapture = (e) => {
    if (justDragged.current) { e.stopPropagation(); e.preventDefault(); }
  };

  const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const axisDays = [];
  for (let i = -WINDOW_BACK; i <= WINDOW_FWD; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const dow = d.getDay();
    const isMonthStart = d.getDate() === 1;
    const isToday = i === 0;
    /* Clean minimal demarcation: TODAY chip, month abbreviation on the 1st,
       bare day-number on every Monday. All other days carry a tick only
       (drawn by the per-day axis gradient). Weekends get a subtle wash. */
    let majorText = null;
    if (isToday)                              majorText = 'TODAY';
    else if (isMonthStart)                    majorText = MONTH_ABBR[d.getMonth()];
    else if (dow === 1 && showMondayLabels)   majorText = String(d.getDate());
    axisDays.push({ i, majorText, isToday, isWeekend: dow === 0 || dow === 6, isMonthStart });
  }

  return (
    <div className="cin-view-panel">
      <div className="cin-view-panel__head">
        <div className="cin-view-panel__title">
          Schedule · Timeline
          <span className="cin-view-panel__count">{visible.length}</span>
          <span className="cin-view-panel__sub">drag to scrub · wheel to zoom · {WINDOW_BACK}d ← today → {WINDOW_FWD}d</span>
        </div>
        <div className="cin-view-panel__toolbar">
          <button
            type="button"
            className="cin-btn cin-btn--secondary"
            onClick={() => scrollToToday(true)}
            title="Recenter on today"
          >Today</button>
          <div className="cin-filter">
            <label className="cin-filter__label">Quadrant</label>
            <select value={filterQuad} onChange={(e) => setFilterQuad(e.target.value)}>
              <option value="all">All</option>
              <option value="do-first">Q1 · Critical</option>
              <option value="schedule">Q2 · Strategic</option>
              <option value="delegate">Q3 · Delegate</option>
              <option value="eliminate">Q4 · Eliminate</option>
            </select>
          </div>
        </div>
      </div>

      <div className="gantt-narrow-notice">
        Gantt requires a wider viewport — rotate or use the List view
      </div>

      <div className="cin-view-panel__body" style={{ overflow: 'hidden', padding: 0 }}>
        <div
          className="gantt-tape"
          ref={scrollRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={onClickCapture}
        >
          <div
            className="gantt-tape__inner"
            style={{
              '--tape-px':  `${TAPE_PX}px`,
              '--day-px':   `${pxPerDay}px`,
              '--label-px': `${LABEL_WIDTH}px`
            }}
          >
            {/* Axis row */}
            <div className="gantt-axis-tape__spacer" />
            <div className="gantt-axis-tape__days">
              {axisDays.map(d => (
                <div
                  key={d.i}
                  className={'gantt-axis-tape__day'
                    + (d.isToday      ? ' is-today'       : '')
                    + (d.isWeekend    ? ' is-weekend'     : '')
                    + (d.isMonthStart ? ' is-month-start' : '')}
                >
                  {d.majorText && (
                    <span className="gantt-axis-tape__tick-label">{d.majorText}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Empty state — spans both columns */}
            {visible.length === 0 && (
              <div className="gantt-tape__empty">— No scheduled tasks in this window —</div>
            )}

            {/* Task rows */}
            {visible.map(t => {
              const dueOff = dayOffset(t.dueDate, t.dueTime);
              const isOverdue = dueOff < 0;
              const isDone = t.percentComplete === 100;
              const startOff = isOverdue ? dueOff : 0;
              const endOff   = isOverdue ? 0 : dueOff;
              const leftPx  = (startOff + WINDOW_BACK) * pxPerDay;
              const widthPx = Math.max((endOff - startOff + 1) * pxPerDay, pxPerDay);
              const qid = QID_BY_QUAD[getQuadrant(t)] || 'q4';
              const barClass = 'gantt-bar gantt-bar--' + (isOverdue ? 'overdue' : qid)
                + (isDone ? ' gantt-bar--done' : '');
              const dueDateText = new Date(t.dueDate).toLocaleDateString();
              return (
                <React.Fragment key={t.id}>
                  <div
                    className="gantt-row-tape__label"
                    onClick={() => { setEditingTask(t); setShowForm(true); }}
                  >
                    <div className="gantt-row__label-name" title={t.task}>{t.task}</div>
                    <div className="gantt-row__label-meta">{(t.subcategory || t.domain) + ' · ' + dueDateText}</div>
                  </div>
                  <div className="gantt-row-tape__track">
                    <div
                      className={barClass}
                      style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                      onClick={() => { setEditingTask(t); setShowForm(true); }}
                    >
                      {t.rank ? `R${t.rank}` : ''}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Today line — full-height vertical accent inside the grid;
                positioned in absolute pixels so it scrolls with content. */}
            <div
              className="gantt-today-line-tape"
              style={{ left: `calc(var(--label-px) + ${TODAY_OFFSET_PX}px)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
