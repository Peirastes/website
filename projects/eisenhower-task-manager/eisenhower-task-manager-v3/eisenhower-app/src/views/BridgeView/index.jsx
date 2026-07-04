import React, { useState, useEffect } from 'react';
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
export const BridgeView = ({ tasks, projects = [], getQuadrant, setEditingTask, setShowForm, settings }) => {
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

  /* ── Corner HUD data: expandable QUADRANT SECTORS (top-left) + ACTIVE
     PROJECTS with their tasks (top-right), filling the voids by the globe. ── */
  const isOpenTask = (t) => (Number(t.percentComplete) || 0) < 100;
  const dueLabel = (t) => {
    if (!t.dueDate) return '';
    const d = dayOffset(t.dueDate, t.dueTime);
    if (!Number.isFinite(d)) return '';
    return d < 0 ? 'overdue' : d < 1 ? 'today' : `${Math.ceil(d)}d`;
  };
  const byDue = (a, b) => {
    const da = dayOffset(a.dueDate, a.dueTime), db = dayOffset(b.dueDate, b.dueTime);
    const fa = Number.isFinite(da), fb = Number.isFinite(db);
    if (fa && fb) return da - db;      // both dated → soonest first
    return fa ? -1 : fb ? 1 : 0;        // dated before undated
  };
  const trunc = (s, n = 24) => (s && s.length > n + 1 ? s.slice(0, n) + '…' : (s || ''));

  const [openSectors, setOpenSectors] = useState(() => new Set());
  const [openProjects, setOpenProjects] = useState(() => new Set());
  const toggleIn = (setFn, key) => setFn(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n;
  });

  /* ── HUD-as-control-surface: focusing a sector or project dims every
     non-matching pip on the globe so the panel steers the view. Focus is
     single-select and mutually exclusive between the two panels; clicking
     the active row again clears it. Focusing also opens that row's task
     list (accordion — only one open at a time). ── */
  const [focusQuad, setFocusQuad] = useState(null);
  const [focusProject, setFocusProject] = useState(null);
  const pickSector = (key) => {
    const active = focusQuad === key;
    setFocusProject(null);
    setFocusQuad(active ? null : key);
    setOpenSectors(active ? new Set() : new Set([key]));
  };
  const pickProject = (id) => {
    const active = focusProject === id;
    setFocusQuad(null);
    setFocusProject(active ? null : id);
    setOpenProjects(active ? new Set() : new Set([id]));
  };
  /* Panels collapse to just their header pill to bare the globe. */
  const [collapsed, setCollapsed] = useState(() => new Set());
  /* Overdue-behind tray: open, overdue tasks that have fallen past the back
     edge of the view window (>7d behind the ship) and so aren't on the globe
     at all — the real blind spot. Surfaced as a tab that expands a list. */
  const [showOverdue, setShowOverdue] = useState(false);

  const QUAD_META = [
    { key: 'do-first',  qid: 'q1', label: 'Critical'  },
    { key: 'schedule',  qid: 'q2', label: 'Strategic' },
    { key: 'delegate',  qid: 'q3', label: 'Delegate'  },
    { key: 'eliminate', qid: 'q4', label: 'Eliminate' },
  ];
  const sectorTasks = (key) =>
    visible.filter(t => isOpenTask(t) && getQuadrant(t) === key).sort(byDue);

  const projProgress = (p) => {
    const mine = tasks.filter(t => t.projectId === p.id && !t.deletedAt);
    if (mine.length) return Math.round(mine.reduce((s, t) => s + (Number(t.percentComplete) || 0), 0) / mine.length);
    if (typeof p.manualPercent === 'number') return Math.round(p.manualPercent);
    return p.status === 'done' ? 100 : 0;
  };
  const activeProjects = (projects || [])
    .filter(p => p.status !== 'done' && p.status !== 'archived')
    .map(p => ({
      id: p.id, name: p.name, pct: projProgress(p),
      tasks: tasks.filter(t => t.projectId === p.id && isOpenTask(t)).sort(byDue),
    }))
    /* Only projects with actionable work or real progress — skip the 0%,
       task-less portfolio entries so the panel stays a live worklist. */
    .filter(p => p.tasks.length > 0 || p.pct > 0)
    .sort((a, b) => b.tasks.length - a.tasks.length || b.pct - a.pct || (a.name || '').localeCompare(b.name || ''))
    .slice(0, 12);

  /* Overdue tasks that have slipped behind the window's back edge (off - anchor
     < -7) — invisible on the globe, so pull them out into their own tray. */
  const lateLabel = (t) => `${Math.max(1, Math.floor(-dayOffset(t.dueDate, t.dueTime)))}d late`;
  const overdueBehind = tasks
    .filter(t => t.dueDate && !t.completedDate && isOpenTask(t)
              && dayOffset(t.dueDate, t.dueTime) < 0
              && (dayOffset(t.dueDate, t.dueTime) - viewAnchor) < -7)
    .sort(byDue);

  return (
    <div className="cin-view-panel cin-view-panel--bridge">
      <div className="cin-view-panel__body" style={{ overflow: 'hidden', display: 'flex', position: 'relative' }}>
        {/* Console dock — bottom-centre floating glass control bar. Carries the
            mode toggle + filters that used to sit in the header, so the app
            masthead stays the one and only centred title. */}
        <div className="bridge-console">
          <div className="cin-mode-toggle" role="group" aria-label="Bridge mode">
            <button
              type="button"
              className={`cin-mode-toggle__btn ${mode === 'horizon' ? 'is-active' : ''}`}
              onClick={() => setMode('horizon')}
              onPointerDown={(e) => e.stopPropagation()}
              aria-pressed={mode === 'horizon'}
            >Horizon</button>
            <button
              type="button"
              className={`cin-mode-toggle__btn ${mode === 'radar' ? 'is-active' : ''}`}
              onClick={() => setMode('radar')}
              onPointerDown={(e) => e.stopPropagation()}
              aria-pressed={mode === 'radar'}
            >Radar</button>
          </div>
          <span className="bridge-console__sep" />
          <div className="cin-filter">
            <label className="cin-filter__label">Quadrant</label>
            <select value={filterQuad} onChange={(e) => setFilterQuad(e.target.value)}
                    onPointerDown={(e) => e.stopPropagation()}>
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
              <select value={labelMode} onChange={(e) => setLabelMode(e.target.value)}
                      onPointerDown={(e) => e.stopPropagation()}>
                <option value="all">All</option>
                <option value="incomplete">Incomplete</option>
                <option value="tracked">Tracked only</option>
                <option value="none">None</option>
              </select>
            </div>
          )}
        </div>
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
        {/* Corner HUD — expandable QUADRANT SECTORS (top-left) + ACTIVE PROJECTS
            with their tasks (top-right). Fills the voids; horizon only. */}
        {mode === 'horizon' && (
          <>
            <div className={`bridge-hud bridge-hud--sectors${collapsed.has('sectors') ? ' is-collapsed' : ''}${focusQuad ? ' is-focusing' : ''}`}>
              <div className="bridge-hud__head">
                <span className="bridge-hud__head-label">◇ Sectors</span>
                <button type="button" className="bridge-hud__collapse"
                        onClick={() => toggleIn(setCollapsed, 'sectors')}
                        onPointerDown={(e) => e.stopPropagation()}
                        title={collapsed.has('sectors') ? 'Expand panel' : 'Collapse panel'}>
                  {collapsed.has('sectors') ? '▸' : '▾'}
                </button>
              </div>
              <div className="bridge-hud__body">
              {QUAD_META.map(q => {
                const list = sectorTasks(q.key);
                const open = openSectors.has(q.key);
                const focused = focusQuad === q.key;
                return (
                  <div key={q.key} className={`bridge-sector bridge-sector--${q.qid}`}>
                    <button type="button" className={`bridge-sector__head${focused ? ' is-focused' : ''}`}
                            onClick={() => pickSector(q.key)}
                            onPointerDown={(e) => e.stopPropagation()}>
                      <span className="bridge-hud__caret">{list.length ? (open ? '▾' : '▸') : '·'}</span>
                      <span className="bridge-sector__dot" />
                      <span className="bridge-sector__name">{q.label}</span>
                      <span className="bridge-sector__count">{list.length}</span>
                    </button>
                    {open && list.length > 0 && (
                      <div className="bridge-hud__list">
                        {list.map(t => (
                          <button key={t.id} type="button" className="bridge-hud__item"
                                  onClick={() => onPick(t)} onPointerDown={(e) => e.stopPropagation()}>
                            <span className="bridge-hud__item-name">{trunc(t.task)}</span>
                            <span className={`bridge-hud__item-due${dayOffset(t.dueDate, t.dueTime) < 0 ? ' is-overdue' : ''}`}>{dueLabel(t)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>

            <div className={`bridge-hud bridge-hud--projects${collapsed.has('projects') ? ' is-collapsed' : ''}${focusProject ? ' is-focusing' : ''}`}>
              <div className="bridge-hud__head">
                <span className="bridge-hud__head-label">◈ Active Projects</span>
                <button type="button" className="bridge-hud__collapse"
                        onClick={() => toggleIn(setCollapsed, 'projects')}
                        onPointerDown={(e) => e.stopPropagation()}
                        title={collapsed.has('projects') ? 'Expand panel' : 'Collapse panel'}>
                  {collapsed.has('projects') ? '▸' : '▾'}
                </button>
              </div>
              <div className="bridge-hud__body">
              {activeProjects.length === 0 ? (
                <div className="bridge-hud__empty">No active projects.</div>
              ) : activeProjects.map(p => {
                const open = openProjects.has(p.id);
                const focused = focusProject === p.id;
                return (
                  <div key={p.id} className="bridge-project">
                    <button type="button" className={`bridge-project__head${focused ? ' is-focused' : ''}`}
                            onClick={() => pickProject(p.id)}
                            onPointerDown={(e) => e.stopPropagation()}>
                      <span className="bridge-hud__caret">{p.tasks.length ? (open ? '▾' : '▸') : '·'}</span>
                      <span className="bridge-project__dot" />
                      <span className="bridge-project__name">{trunc(p.name, 22)}</span>
                      <span className="bridge-project__pct">{p.pct}%</span>
                    </button>
                    <div className="bridge-quest__bar"><div className="bridge-quest__fill" style={{ width: `${p.pct}%` }} /></div>
                    {open && (
                      <div className="bridge-hud__list">
                        {p.tasks.length === 0 ? (
                          <div className="bridge-hud__empty">no open tasks</div>
                        ) : p.tasks.map(t => (
                          <button key={t.id} type="button" className="bridge-hud__item"
                                  onClick={() => onPick(t)} onPointerDown={(e) => e.stopPropagation()}>
                            <span className="bridge-hud__item-name">{trunc(t.task)}</span>
                            <span className={`bridge-hud__item-due${dayOffset(t.dueDate, t.dueTime) < 0 ? ' is-overdue' : ''}`}>{dueLabel(t)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            </div>

            {/* Overdue-behind tray — bottom-left, red glass. Only shows when
                something has slipped off the back of the horizon. */}
            {overdueBehind.length > 0 && (
              <div className={`bridge-overdue${showOverdue ? ' is-open' : ''}`}>
                {showOverdue && (
                  <div className="bridge-overdue__list">
                    {overdueBehind.slice(0, 12).map(t => (
                      <button key={t.id} type="button" className="bridge-hud__item"
                              onClick={() => onPick(t)} onPointerDown={(e) => e.stopPropagation()}>
                        <span className="bridge-hud__item-name">{trunc(t.task, 26)}</span>
                        <span className="bridge-hud__item-due is-overdue">{lateLabel(t)}</span>
                      </button>
                    ))}
                    {overdueBehind.length > 12 && (
                      <div className="bridge-hud__empty">+{overdueBehind.length - 12} more</div>
                    )}
                  </div>
                )}
                <button type="button" className="bridge-overdue__tab"
                        onClick={() => setShowOverdue(s => !s)}
                        onPointerDown={(e) => e.stopPropagation()}
                        title="Overdue tasks behind the horizon">
                  ◂ {overdueBehind.length} overdue behind
                </button>
              </div>
            )}
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
            focusQuad={focusQuad} focusProject={focusProject}
          />
        ) : (
          <RadarScene
            tasks={visible} lanes={lanes} laneOf={laneOf}
            dayOffset={dayOffset} maxDays={RADAR_DAYS}
            getQuadrant={getQuadrant} onPick={onPick}
            focusQuad={focusQuad} focusProject={focusProject}
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
