import React, { useState } from 'react';

// Projects view — mirrors the peirastes.com portfolio (projects.json) plus mission
// initiatives (e.g. Ignition). Each project's progress is computed live: from its
// tasks when it has any, otherwise from a manual % (editable here) or its status
// (done → 100%). Filter by completion and sort by %/name/status/type.

const API = '/api';
async function pjPost(path, body, method = 'POST') {
  const r = await fetch(API + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return r.json();
}

const today = () => new Date().toLocaleDateString('en-CA');

// Progress for a project: task-rollup when it has tasks, else manual %, else status.
// percent === null means "in progress, no % set yet".
function computeProgress(project, tasks) {
  const t = today();
  const mine = tasks.filter(x => !x.deletedAt && x.projectId === project.id);
  const done = mine.filter(x => (x.percentComplete || 0) >= 100 || x.completedDate);
  const open = mine.filter(x => !done.includes(x));
  const overdue = open.filter(x => x.dueDate && x.dueDate < t);
  const nextDue = open.filter(x => x.dueDate).map(x => x.dueDate).sort()[0] || null;
  let percent, source;
  if (mine.length) {
    percent = Math.round(mine.reduce((s, x) => s + (x.completedDate ? 100 : (x.percentComplete || 0)), 0) / mine.length);
    source = 'tasks';
  } else if (typeof project.manualPercent === 'number') {
    percent = project.manualPercent; source = 'manual';
  } else if (project.status === 'done') {
    percent = 100; source = 'status';
  } else {
    percent = null; source = 'unset';
  }
  return { total: mine.length, done: done.length, open: open.length, overdue: overdue.length, percent, source, nextDue };
}

const STATUS_ORDER = { active: 0, paused: 1, done: 2, archived: 3 };
// preferred order for sub-area task groups within a project (e.g. the drone)
const GROUP_ORDER = ['Airframe', 'Test Rig', 'Gimbal'];

export const ProjectsView = ({ projects = [], tasks = [], onRefresh, setEditingTask, setShowForm }) => {
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState('active');   // active | completed | all
  const [sort, setSort] = useState('pct-desc');      // pct-desc | pct-asc | name | status | type
  const [drafts, setDrafts] = useState({});          // local manualPercent while dragging

  const createProject = async () => {
    const name = window.prompt('New project name:');
    if (!name || !name.trim()) return;
    await pjPost('/projects', { name: name.trim() });
    onRefresh && onRefresh();
  };
  const setStatus = async (id, status) => { await pjPost('/projects/' + id, { status }, 'PATCH'); onRefresh && onRefresh(); };
  const setManual = async (id, val) => { await pjPost('/projects/' + id, { manualPercent: val }, 'PATCH'); onRefresh && onRefresh(); };
  const setTracked = async (id, val) => { await pjPost('/projects/' + id, { tracked: val }, 'PATCH'); onRefresh && onRefresh(); };
  const removeProject = async (id) => {
    if (!window.confirm('Delete this project? Its tasks are kept (just un-assigned).')) return;
    await pjPost('/projects/' + id, null, 'DELETE');
    setOpenId(null);
    onRefresh && onRefresh();
  };

  // A project appears in the list when it's a tracked quest OR has linked tasks
  // (task-bearing projects are tracked implicitly). Portfolio mirror entries stay
  // out until tracked or given tasks.
  const taskIds = new Set(tasks.filter(t => !t.deletedAt && t.projectId).map(t => t.projectId));
  const withProg = projects.map(p => ({ p, pr: computeProgress(p, tasks) })).filter(({ p, pr }) => p.tracked || pr.total > 0);
  // candidates for the "track a project" picker: untracked, task-less, not archived
  const untrackedOptions = projects
    .filter(p => p.status !== 'archived' && !p.tracked && !taskIds.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const isComplete = pr => pr.percent !== null && pr.percent >= 100;
  const filtered = withProg.filter(({ pr }) => {
    if (filter === 'completed') return isComplete(pr);
    if (filter === 'active') return !isComplete(pr);
    return true; // all
  });
  const sortVal = pr => (pr.percent === null ? -1 : pr.percent);
  filtered.sort((a, b) => {
    if (sort === 'pct-desc') return sortVal(b.pr) - sortVal(a.pr) || a.p.name.localeCompare(b.p.name);
    if (sort === 'pct-asc') return sortVal(a.pr) - sortVal(b.pr) || a.p.name.localeCompare(b.p.name);
    if (sort === 'name') return a.p.name.localeCompare(b.p.name);
    if (sort === 'type') return (a.p.type || '').localeCompare(b.p.type || '') || a.p.name.localeCompare(b.p.name);
    // status
    return (STATUS_ORDER[a.p.status] ?? 9) - (STATUS_ORDER[b.p.status] ?? 9) || sortVal(b.pr) - sortVal(a.pr);
  });

  const FILTERS = [['active', 'In Progress'], ['completed', 'Completed'], ['all', 'All']];

  const renderTaskRow = (t) => (
    <div key={t.id} className="proj-task-r" onClick={() => { setEditingTask(t); setShowForm(true); }}>
      <span className="proj-task-r__name">{t.task}</span>
      <span className="proj-task-r__pct">{t.completedDate ? '✓' : (t.percentComplete || 0) + '%'}</span>
    </div>
  );
  // group a project's tasks by sub-area (subcategory) when it spans more than one;
  // returns [[null, rows]] for a single group (render flat, no headers).
  const groupTasks = (rows) => {
    const map = rows.reduce((acc, t) => { const k = t.subcategory || 'Tasks'; (acc[k] ||= []).push(t); return acc; }, {});
    const keys = Object.keys(map);
    if (keys.length <= 1) return [[null, rows]];
    keys.sort((a, b) => { const ia = GROUP_ORDER.indexOf(a), ib = GROUP_ORDER.indexOf(b); return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b); });
    return keys.map(k => [k, map[k]]);
  };

  return (
    <div className="cin-view-panel">
      <div className="cin-view-panel__head">
        <div className="cin-view-panel__title">Projects</div>
        <div className="cin-view-panel__count">{filtered.length}/{withProg.length}</div>
        <div style={{ flex: 1 }} />
        <div className="cin-view-panel__toolbar">
          <div className="proj-chips">
            {FILTERS.map(([k, label]) => (
              <button key={k} className={'proj-chip' + (filter === k ? ' proj-chip--on' : '')} onClick={() => setFilter(k)}>{label}</button>
            ))}
          </div>
          <select className="cin-select proj-sort" value={sort} onChange={e => setSort(e.target.value)} title="Sort">
            <option value="pct-desc">% ↓</option>
            <option value="pct-asc">% ↑</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="type">Type</option>
          </select>
          <select className="cin-select proj-track-pick" value="" onChange={e => { if (e.target.value) setTracked(e.target.value, true); }} title="Track a portfolio project">
            <option value="">＋ Track…</option>
            {untrackedOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="cin-btn cin-btn--primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={createProject}>+ New</button>
        </div>
      </div>

      <div className="cin-view-panel__body">
        {filtered.length === 0 ? (
          <div className="proj-empty">{withProg.length === 0
            ? 'No projects with tasks yet. Assign a task to a project (via the task form’s “Project” field) and it’ll appear here.'
            : 'No projects match this filter.'}</div>
        ) : (
          <div className="proj-grid">
            {filtered.map(({ p, pr }) => {
              const isOpen = openId === p.id;
              const mine = tasks.filter(x => !x.deletedAt && x.projectId === p.id);
              const draft = drafts[p.id];
              const shownPct = draft !== undefined ? draft : pr.percent;
              return (
                <div key={p.id} className="proj-card-r" style={{ borderLeftColor: p.color || 'var(--cin-cyan)' }}>
                  <div className="proj-card-r__head" onClick={() => setOpenId(isOpen ? null : p.id)}>
                    <span className="proj-card-r__name">{p.name}</span>
                    {p.type ? <span className="proj-type">{p.type}</span> : null}
                    <span className={'proj-card-r__status proj-st-' + p.status}>{p.status}</span>
                  </div>
                  <div className="proj-bar-r">
                    <div className="proj-bar-r__fill" style={{ width: (shownPct === null ? 0 : shownPct) + '%', background: p.color || 'var(--cin-cyan)' }} />
                  </div>
                  <div className="proj-card-r__meta">
                    {shownPct === null ? <span>in progress</span> : <span>{shownPct}%</span>}
                    {pr.total > 0 ? <span> · {pr.done}/{pr.total} done</span> : (pr.source === 'status' ? <span> · completed</span> : null)}
                    {pr.overdue ? <span className="proj-od"> · {pr.overdue} overdue</span> : null}
                    {pr.nextDue ? <span> · next {pr.nextDue}</span> : null}
                  </div>

                  {isOpen && (
                    <div className="proj-card-r__detail">
                      {p.description ? <div className="proj-desc">{p.description}</div> : null}
                      {p.url ? <a className="proj-link" href={p.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Open on peirastes.com ↗</a> : null}

                      {/* task-bearing → list tasks; task-less → manual % slider */}
                      {mine.length > 0 ? (
                        groupTasks(mine).map(([groupName, rows]) => (
                          groupName === null
                            ? rows.map(renderTaskRow)
                            : (
                              <div key={groupName} className="proj-task-group">
                                <div className="proj-task-group__head">{groupName} <span className="proj-task-group__count">{rows.filter(t => t.completedDate || (t.percentComplete || 0) >= 100).length}/{rows.length}</span></div>
                                {rows.map(renderTaskRow)}
                              </div>
                            )
                        ))
                      ) : (
                        <div className="proj-manual">
                          <label className="proj-manual__label">Progress {shownPct === null ? '(unset)' : shownPct + '%'}</label>
                          <input
                            type="range" min="0" max="100" step="5"
                            value={shownPct === null ? 0 : shownPct}
                            onChange={e => setDrafts(d => ({ ...d, [p.id]: parseInt(e.target.value) }))}
                            onMouseUp={e => setManual(p.id, parseInt(e.target.value))}
                            onTouchEnd={e => setManual(p.id, parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: p.color || 'var(--cin-cyan)' }}
                          />
                          <div className="proj-empty-sm">No linked tasks — set completion manually, or assign tasks via a task's “Project” field.</div>
                        </div>
                      )}

                      <div className="proj-card-r__actions">
                        <button onClick={() => setStatus(p.id, p.status === 'done' ? 'active' : 'done')}>{p.status === 'done' ? 'Re-open' : 'Mark done'}</button>
                        {/* task-less tracked quest → "Untrack" removes it from the list (keeps the project);
                            task-bearing → archive toggle */}
                        {pr.total === 0 && p.tracked
                          ? <button onClick={() => setTracked(p.id, false)}>Untrack</button>
                          : (p.status === 'archived'
                              ? <button onClick={() => setStatus(p.id, 'active')}>Unarchive</button>
                              : <button onClick={() => setStatus(p.id, 'archived')}>Archive</button>)}
                        <button className="proj-danger" onClick={() => removeProject(p.id)}>Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
