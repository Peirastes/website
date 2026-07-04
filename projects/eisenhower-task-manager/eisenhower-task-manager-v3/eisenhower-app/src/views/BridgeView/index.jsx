import React, { useState, useEffect } from 'react';
import { formatHorizonShort } from '../../lib/dateFormat';
import { TaskDetailsModal } from '../../components/TaskDetailsModal';
import { HorizonScene } from './HorizonScene';
import { RadarScene } from './RadarScene';

/**
 * ═════════════════════════════════════════════════════════════════
 *   BRIDGE VIEW — Horizon (forward perspective) + Radar (top-down PPI)
 * ═════════════════════════════════════════════════════════════════
 *
 * Bridge-of-the-ship metaphor. Tasks approach the present as time
 * advances. Two visualizations of the same data:
 *   • Horizon: wireframe-globe with lanes as latitudes + dates as
 *     longitudes; drag to spin, wheel to zoom, middle-drag for
 *     altitude, right-drag for screen-space pan.
 *   • Radar:  concentric range rings + sectored pie; ship at
 *     centre, tasks at polar coords (r=time, θ=domain sector).
 *
 * Lanes = settings.domains. Tasks with unknown / missing domain
 * are placed in lane 0 by default.
 *
 * This file is the shell — toggle, toolbar, label-mode select,
 * Recenter button, task-details popup, and routing to the
 * Horizon/Radar children based on mode.
 */
export const BridgeView = ({ tasks, getQuadrant, setEditingTask, setShowForm, settings }) => {
  const [mode, setMode] = useState('horizon');
  const [filterQuad, setFilterQuad] = useState('all');
  /* Title-label visibility on the Bridge.
       all        — every task pip labelled
       incomplete — only LIVE tasks labelled (completed pips bare)
       tracked    — only tasks with tracked:true labelled
       none       — no labels at all
     Persisted to localStorage so the choice survives reloads. */
  const [labelMode, setLabelMode] = useState(() => {
    try { return localStorage.getItem('bridge-label-mode') || 'all'; }
    catch { return 'all'; }
  });
  useEffect(() => {
    try { localStorage.setItem('bridge-label-mode', labelMode); } catch {}
  }, [labelMode]);
  /* Horizon distance is wheel-zoomable. State lives here so it survives
     Horizon ↔ Radar toggles. */
  const [horizonDays, setHorizonDays] = useState(() =>
    (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) ? 21 : 90);
  /* Time anchor for Horizon's drag-to-pan. Fractional days from real-now.
     viewAnchor = 0 means the ship sits at "now" (default). Positive =
     ship has sailed forward in time; negative = panned to the past.
     Only applied in Horizon mode. */
  const [viewAnchor, setViewAnchor] = useState(0);

  /* Live day tick. `today` below is derived once per render, so without a
     nudge the meridian + all day-offset math freeze at mount time — leave
     the Bridge open across midnight and "NOW" never rolls. This polls every
     60s but only forces a re-render when the calendar day actually changes
     (the identity return bails React out the other 1439 minutes), so the
     overhead is one re-render per midnight, not per minute. */
  const [, setDayKey] = useState(() => new Date().toDateString());
  useEffect(() => {
    const id = setInterval(() => {
      setDayKey(prev => {
        const now = new Date().toDateString();
        return prev === now ? prev : now;
      });
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const RADAR_DAYS   = 180;
  const maxDays = mode === 'horizon' ? horizonDays : RADAR_DAYS;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  /* Fractional days, so the Horizon can resolve below 1d into hours.
     Date-only strings ("YYYY-MM-DD") parse as local midnight; if an
     explicit dueTime ("HH:MM") is supplied, it's folded in to give a
     fractional-day offset. Legacy "YYYY-MM-DDTHH:MM" strings still
     parse correctly via the fallback. */
  const dayOffset = (d, t) => {
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [y, m, day] = d.split('-').map(Number);
      let h = 0, mi = 0;
      if (typeof t === 'string' && /^\d{1,2}:\d{2}/.test(t)) {
        [h, mi] = t.split(':').map(Number);
      }
      return (new Date(y, m - 1, day, h, mi).getTime() - today.getTime()) / 86400000;
    }
    const dd = (typeof d === 'string') ? new Date(d) : d;
    return (dd.getTime() - today.getTime()) / 86400000;
  };

  /* Default lanes — Teaching first-left, Personal first-right. Order
     determines lateral position via the alternating-outward sector
     packer in HorizonScene: lanes[0] = first-left, lanes[1] = first-
     right, lanes[2] = second-left, lanes[3] = second-right, etc. */
  const baseDomains = (settings?.domains && settings.domains.length > 0)
    ? settings.domains
    : ['Teaching', 'Personal'];
  const lanes = baseDomains;
  const laneOf = (t) => {
    const idx = baseDomains.indexOf(t.domain);
    return idx === -1 ? 0 : idx;
  };

  const visible = tasks.filter(t => {
    /* Completed tasks remain visible on the Bridge — they render
       without the ring/blip so the player sees "cleared targets"
       drift past the ship after completion. */
    if (!t.dueDate) return false;
    if (filterQuad !== 'all' && getQuadrant(t) !== filterQuad) return false;
    /* In Horizon mode, the visible window is anchored to viewAnchor —
       so panning forward in time keeps the [-7d, +horizon] window
       relative to the new ship position. */
    let off = dayOffset(t.dueDate, t.dueTime);
    if (mode === 'horizon') off -= viewAnchor;
    return off >= -7 && off <= maxDays;
  });

  /* Click a pip → show a lightweight details popup first. The "Edit"
     button inside the popup hands off to the existing edit form. */
  const [selectedTask, setSelectedTask] = useState(null);
  const onPick = (t) => setSelectedTask(t);
  const handleEditFromDetails = (t) => { setEditingTask(t); setShowForm(true); };

  /* Toggle the task's `tracked` flag via PATCH. Used by the details
     modal so the user can curate the "tracked" label-mode subset. */
  const [trackedVersion, setTrackedVersion] = useState(0); // forces re-render of selectedTask
  const handleToggleTrack = async (t) => {
    const next = !t.tracked;
    try {
      const res = await fetch(`/api/tasks/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracked: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      /* Mutate in place so the visible list reflects it immediately
         without waiting for the parent to refetch. */
      t.tracked = updated.tracked;
      setSelectedTask({ ...t });
      setTrackedVersion(v => v + 1);
    } catch (e) {
      console.error('toggleTrack failed:', e);
    }
  };

  /* ── Corner-HUD data: status counts (top-left) + tracked "quests" (top-right)
     to fill the voids flanking the globe. ── */
  const isOpenTask = (t) => (Number(t.percentComplete) || 0) < 100;
  const overdueCount  = visible.filter(t => isOpenTask(t) && dayOffset(t.dueDate, t.dueTime) < 0).length;
  const dueTodayCount = visible.filter(t => { const d = dayOffset(t.dueDate, t.dueTime); return isOpenTask(t) && d >= 0 && d < 1; }).length;
  const trackedCount  = visible.filter(t => t.tracked && isOpenTask(t)).length;
  const quests = visible
    .filter(t => t.tracked && isOpenTask(t))
    .sort((a, b) => dayOffset(a.dueDate, a.dueTime) - dayOffset(b.dueDate, b.dueTime))
    .slice(0, 6);
  const questDue = (t) => {
    const d = dayOffset(t.dueDate, t.dueTime);
    return d < 0 ? 'overdue' : d < 1 ? 'today' : `${Math.ceil(d)}d`;
  };

  return (
    <div className="cin-view-panel">
      <div className="cin-view-panel__head">
        <div className="cin-view-panel__title">
          Bridge · Navigation
          <span className="cin-view-panel__count">{visible.length}</span>
          <span className="cin-view-panel__sub">
            {mode === 'horizon'
              ? `forward perspective · ${formatHorizonShort(maxDays)} horizon · drag to pan · pinch / wheel to zoom`
              : `top-down radar · ${maxDays}d range · click a target to edit`}
          </span>
        </div>
        <div className="cin-view-panel__toolbar">
          <div className="cin-mode-toggle" role="group" aria-label="Bridge mode">
            <button
              type="button"
              className={`cin-mode-toggle__btn ${mode === 'horizon' ? 'is-active' : ''}`}
              onClick={() => setMode('horizon')}
              aria-pressed={mode === 'horizon'}
            >Horizon</button>
            <button
              type="button"
              className={`cin-mode-toggle__btn ${mode === 'radar' ? 'is-active' : ''}`}
              onClick={() => setMode('radar')}
              aria-pressed={mode === 'radar'}
            >Radar</button>
          </div>
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
          {mode === 'horizon' && (
            <div className="cin-filter">
              <label className="cin-filter__label">Labels</label>
              <select value={labelMode} onChange={(e) => setLabelMode(e.target.value)}>
                <option value="all">All</option>
                <option value="incomplete">Incomplete</option>
                <option value="tracked">Tracked only</option>
                <option value="none">None</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="cin-view-panel__body" style={{ overflow: 'hidden', display: 'flex', position: 'relative' }}>
        {/* Recenter floats over the globe (out of the header flow) so its
            show/hide never reflows the toolbar and jostles the frame. */}
        {mode === 'horizon' && Math.abs(viewAnchor) >= 1/48 && (
          <button
            type="button"
            className="cin-btn cin-btn--secondary bridge-recenter"
            onClick={() => setViewAnchor(0)}
            onPointerDown={(e) => e.stopPropagation()}
            title="Recenter on now"
          >Recenter</button>
        )}
        {/* Corner HUD — status readout (top-left) + quest tracker (top-right),
            filling the voids that flank the globe. Horizon only. */}
        {mode === 'horizon' && (
          <>
            <div className="bridge-hud bridge-hud--status">
              <div className="bridge-hud__stat">
                <span className={`bridge-hud__num${overdueCount ? ' bridge-hud__num--crit' : ''}`}>{overdueCount}</span>
                <span className="bridge-hud__lbl">Overdue</span>
              </div>
              <div className="bridge-hud__stat">
                <span className="bridge-hud__num">{dueTodayCount}</span>
                <span className="bridge-hud__lbl">Due Today</span>
              </div>
              <div className="bridge-hud__stat">
                <span className="bridge-hud__num">{trackedCount}</span>
                <span className="bridge-hud__lbl">Tracked</span>
              </div>
            </div>
            <div className="bridge-hud bridge-hud--quests">
              <div className="bridge-hud__head">◈ Active Objectives</div>
              {quests.length === 0 ? (
                <div className="bridge-hud__empty">Track a task to pin it here.</div>
              ) : quests.map(q => (
                <div key={q.id} className="bridge-quest">
                  <div className="bridge-quest__row">
                    <span className="bridge-quest__name">{q.task.length > 26 ? q.task.slice(0, 24) + '…' : q.task}</span>
                    <span className={`bridge-quest__due${dayOffset(q.dueDate, q.dueTime) < 0 ? ' is-overdue' : ''}`}>{questDue(q)}</span>
                  </div>
                  <div className="bridge-quest__bar">
                    <div className="bridge-quest__fill" style={{ width: `${Math.round(Number(q.percentComplete) || 0)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {mode === 'horizon' ? (
          <HorizonScene
            tasks={visible} lanes={lanes} laneOf={laneOf}
            dayOffset={dayOffset} maxDays={horizonDays}
            setMaxDays={setHorizonDays}
            viewAnchor={viewAnchor} setViewAnchor={setViewAnchor}
            getQuadrant={getQuadrant} onPick={onPick}
            labelMode={labelMode}
          />
        ) : (
          <RadarScene
            tasks={visible} lanes={lanes} laneOf={laneOf}
            dayOffset={dayOffset} maxDays={RADAR_DAYS}
            getQuadrant={getQuadrant} onPick={onPick}
          />
        )}
      </div>

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          getQuadrant={getQuadrant}
          onEdit={handleEditFromDetails}
          onToggleTrack={handleToggleTrack}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};
