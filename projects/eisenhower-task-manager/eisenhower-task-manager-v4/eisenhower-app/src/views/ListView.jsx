import React from 'react';
import { QID_BY_QUAD } from '../lib/quadrant';

/**
 * PHASE 4b: ListView (cinematic). Acrylic-glass full-workspace panel
 * with 4-stop quadrant-rainbow top edge. 5 filter dropdowns + sort in
 * the header. Each task row: colored quadrant stripe + name + project
 * pill + due badge + priority + progress bar. Click row to edit;
 * delete moved into the edit modal (no inline buttons).
 *
 * Events (t.isEvent) are hidden by default — toggleable via the
 * "Events" chip so the list focuses on tracked tasks while keeping
 * bills/meetings visible when triaging.
 */
export const ListView = ({ tasks, filters, setFilters, sortBy, setSortBy, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, restoreTask, calculateTaskScore, settings, setSettings }) => {
  const listMode = settings?.listMode === 'advanced' ? 'advanced' : 'simple';
  const setListMode = (mode) => setSettings(s => ({ ...s, listMode: mode }));

  const showEvents = filters.showEvents === true;
  const isTrash = filters.status === 'deleted';
  const filteredTasks = tasks.filter(task => {
    /* Soft-deleted tasks are hidden everywhere EXCEPT the Trash filter,
       which shows only them (for restore within the 24h grace window). */
    if (isTrash) { if (!task.deletedAt) return false; }
    else if (task.deletedAt) return false;
    if (!showEvents && task.isEvent) return false;
    if (filters.status === 'active' && task.percentComplete === 100) return false;
    if (filters.status === 'completed' && task.percentComplete < 100) return false;
    if (filters.quadrant !== 'all' && getQuadrant(task) !== filters.quadrant) return false;
    if (filters.domain !== 'all' && task.domain !== filters.domain) return false;
    if (filters.scope !== 'all' && task.scope !== filters.scope) return false;
    if (filters.recurrence !== 'all' && (task.recurringPattern || 'once') !== filters.recurrence) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      return calculatePriority(a) - calculatePriority(b);
    } else if (sortBy === 'dueDate') {
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else if (sortBy === 'domain') {
      return (a.domain || '').localeCompare(b.domain || '');
    } else if (sortBy === 'recurrence') {
      const order = { once: 1, daily: 2, weekly: 3, monthly: 4, yearly: 5 };
      return (order[a.recurringPattern || 'once'] || 0) - (order[b.recurringPattern || 'once'] || 0);
    }
    return 0;
  });

  // Format due display (returns text + cinematic class modifier)
  const dueDisplay = (task) => {
    const priority = calculatePriority(task);
    if (!task.dueDate) return { text: '—', cls: '' };
    if (priority < 0)   return { text: `${Math.abs(priority)}d over`, cls: 'list-row__due--overdue' };
    if (priority === 0) return { text: 'Today',                       cls: 'list-row__due--today' };
    if (priority === 1) return { text: 'Tomorrow',                    cls: '' };
    return { text: `${priority}d`, cls: '' };
  };

  return (
    <div className="cin-view-panel">
      <div className="cin-view-panel__head">
        <div className="cin-view-panel__title">
          All Tasks
          <span className="cin-view-panel__count">{sortedTasks.length}</span>
          <span className="cin-view-panel__sub">cross-quadrant view</span>
        </div>
        <div className="cin-view-panel__toolbar">
          <div className="cin-mode-toggle" role="group" aria-label="List density">
            <button
              type="button"
              className={`cin-mode-toggle__btn ${listMode === 'simple' ? 'is-active' : ''}`}
              onClick={() => setListMode('simple')}
              aria-pressed={listMode === 'simple'}
            >Simple</button>
            <button
              type="button"
              className={`cin-mode-toggle__btn ${listMode === 'advanced' ? 'is-active' : ''}`}
              onClick={() => setListMode('advanced')}
              aria-pressed={listMode === 'advanced'}
            >Advanced</button>
          </div>
          <div className="cin-filter">
            <label className="cin-filter__label">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="all">All</option>
              <option value="deleted">Trash</option>
            </select>
          </div>
          <div className="cin-filter">
            <label className="cin-filter__label">Quadrant</label>
            <select value={filters.quadrant} onChange={(e) => setFilters({ ...filters, quadrant: e.target.value })}>
              <option value="all">All</option>
              <option value="do-first">Q1 · Critical</option>
              <option value="schedule">Q2 · Strategic</option>
              <option value="delegate">Q3 · Delegate</option>
              <option value="eliminate">Q4 · Eliminate</option>
            </select>
          </div>
          <div className="cin-filter">
            <label className="cin-filter__label">Domain</label>
            <select value={filters.domain} onChange={(e) => setFilters({ ...filters, domain: e.target.value })}>
              <option value="all">All</option>
              {(settings.domains || []).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="cin-filter">
            <label className="cin-filter__label">Scope</label>
            <select value={filters.scope} onChange={(e) => setFilters({ ...filters, scope: e.target.value })}>
              <option value="all">All</option>
              {(settings.scopes || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="cin-filter">
            <label className="cin-filter__label">Recur</label>
            <select value={filters.recurrence} onChange={(e) => setFilters({ ...filters, recurrence: e.target.value })}>
              <option value="all">All</option>
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <button
            type="button"
            className={`cin-mini-btn ${filters.showEvents ? 'is-on' : ''}`}
            onClick={() => setFilters({ ...filters, showEvents: !filters.showEvents })}
            title={filters.showEvents ? 'Hide calendar events from the list' : 'Show calendar events alongside tasks'}
          >{filters.showEvents ? '✓ Events' : '+ Events'}</button>
          <div className="cin-filter">
            <label className="cin-filter__label">Sort</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="domain">Domain</option>
              <option value="recurrence">Recurrence</option>
            </select>
          </div>
        </div>
      </div>

      <div className="cin-view-panel__body">
        <div className={`list-table list-table--${listMode}`}>
          <div className="list-row list-row--header">
            <div></div>
            <div>Task · Project</div>
            {listMode === 'advanced' && <div>Domain</div>}
            {listMode === 'advanced' && <div>Scope</div>}
            {listMode === 'advanced' && <div>Recur</div>}
            <div>Due</div>
            <div className="list-row__h-priority">Rank</div>
            <div>Progress</div>
          </div>
          {sortedTasks.length === 0 ? (
            <div className="list-empty">— No tasks match the current filter —</div>
          ) : (
            sortedTasks.map((task) => {
              const qid = QID_BY_QUAD[getQuadrant(task)] || 'q4';
              const priority = calculatePriority(task);
              const isOverdue = priority < 0;
              const isToday   = priority === 0;
              const isDone    = task.percentComplete === 100;
              const isDeleted = !!task.deletedAt;
              const due = dueDisplay(task);
              const rowClass = 'list-row list-row--' + qid
                + (isOverdue ? ' list-row--overdue' : '')
                + (isToday   ? ' list-row--today'   : '')
                + (isDone    ? ' list-row--done'    : '')
                + (isDeleted ? ' list-row--deleted' : '');
              const recur = task.recurringPattern && task.recurringPattern !== 'once'
                ? task.recurringPattern
                : '—';
              return (
                <div
                  key={task.id}
                  className={rowClass}
                  onClick={isDeleted ? undefined : () => { setEditingTask(task); setShowForm(true); }}
                  style={isDeleted ? { cursor: 'default', opacity: 0.6 } : undefined}
                >
                  <div className="list-row__stripe"></div>
                  <div className="list-row__main">
                    <div className="list-row__name" title={task.task}>{task.task}</div>
                    {(task.subcategory || task.domain) && (
                      <span className="list-row__project">{task.subcategory || task.domain}</span>
                    )}
                  </div>
                  {listMode === 'advanced' && (
                    <div className="list-row__meta">{task.domain || '—'}</div>
                  )}
                  {listMode === 'advanced' && (
                    <div className="list-row__meta">{task.scope || '—'}</div>
                  )}
                  {listMode === 'advanced' && (
                    <div className="list-row__meta">{recur}</div>
                  )}
                  <div className={`list-row__due ${due.cls}`}>{due.text}</div>
                  <div className="list-row__priority">{task.rank ? `R${task.rank}` : '—'}</div>
                  <div className="list-row__bar">
                    {isDeleted ? (
                      <button
                        type="button"
                        className="cin-mini-btn"
                        onClick={(e) => { e.stopPropagation(); restoreTask(task.id); }}
                        title="Restore this task"
                      >↩ Restore</button>
                    ) : (
                      <div className="list-row__bar-fill" style={{ width: `${task.percentComplete || 0}%` }} />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
