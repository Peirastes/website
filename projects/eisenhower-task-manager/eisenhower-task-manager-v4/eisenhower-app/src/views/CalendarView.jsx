import React, { useState } from 'react';
import { QID_BY_QUAD } from '../lib/quadrant';

/**
 * PHASE 4b: CalendarView (cinematic). 7×6 month grid, prev/title/next
 * nav + Today button + quadrant filter. Each cell shows up to 3
 * quadrant-colored task pills, sorted timed-tasks-first by time;
 * "+N more" overflow row. Click an empty cell area to create a new
 * task on that date; click a pill to edit.
 */
export const CalendarView = ({ tasks, filters, setFilters, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, setDefaultDueDate, settings }) => {
  const [calendarDate, setCalendarDate] = useState(new Date());

  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const viewYear  = calendarDate.getFullYear();
  const viewMonth = calendarDate.getMonth();
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const gridStart    = new Date(firstOfMonth);
  gridStart.setDate(1 - firstOfMonth.getDay());

  /* Pull "HH:MM" off a dueDate string if it has a time component. Returns
     null for date-only tasks so display + sort can branch on presence. */
  const taskTime = (t) => {
    if (typeof t.dueDate === 'string' && t.dueDate.includes('T')) {
      const piece = t.dueDate.split('T')[1] || '';
      return piece.slice(0, 5) || null;     // "HH:MM"
    }
    return null;
  };

  // Bucket tasks by ISO date for fast lookup, applying quadrant filter
  const tasksByDate = {};
  tasks.forEach(t => {
    if (!t.dueDate) return;
    if (filters.quadrant !== 'all' && getQuadrant(t) !== filters.quadrant) return;
    if (t.percentComplete === 100) return;   // skip completed
    const d = new Date(t.dueDate);
    if (isNaN(d)) return;
    const key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    (tasksByDate[key] = tasksByDate[key] || []).push(t);
  });
  // Sort each day's bucket: timed tasks ascending by time, then untimed.
  Object.values(tasksByDate).forEach(bucket => {
    bucket.sort((a, b) => {
      const ta = taskTime(a), tb = taskTime(b);
      if (ta && !tb) return -1;
      if (!ta && tb) return 1;
      if (ta && tb)  return ta.localeCompare(tb);
      return 0;
    });
  });

  const SHOW_MAX = 3;

  return (
    <div className="cin-view-panel">
      <div className="cin-view-panel__head">
        <div className="cal-monthnav">
          <button
            className="cin-mini-btn"
            onClick={() => setCalendarDate(new Date(viewYear, viewMonth - 1, 1))}
            aria-label="Previous month"
          >&#8249;</button>
          <div className="cal-monthnav__title">{MONTH_NAMES[viewMonth]} {viewYear}</div>
          <button
            className="cin-mini-btn"
            onClick={() => setCalendarDate(new Date(viewYear, viewMonth + 1, 1))}
            aria-label="Next month"
          >&#8250;</button>
        </div>
        <div className="cin-view-panel__toolbar">
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
          <button className="cin-mini-btn" onClick={() => setCalendarDate(new Date())}>Today</button>
        </div>
      </div>

      <div className="cal-weekday-header">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>

      <div className="cal-grid">
        {Array.from({ length: 42 }).map((_, i) => {
          const cellDate = new Date(gridStart.getTime() + i * 86400000);
          const isToday = cellDate.getTime() === today.getTime();
          const isOtherMonth = cellDate.getMonth() !== viewMonth;
          const dow = cellDate.getDay();
          const key = cellDate.getFullYear() + '-' + (cellDate.getMonth() + 1) + '-' + cellDate.getDate();
          const cellTasks = tasksByDate[key] || [];

          const cellClass = 'cal-cell'
            + (isToday ? ' cal-cell--today' : '')
            + (isOtherMonth ? ' cal-cell--other-month' : '')
            + ((dow === 0 || dow === 6) ? ' cal-cell--weekend' : '');

          return (
            <div
              key={i}
              className={cellClass}
              onClick={(e) => {
                // Click on the cell (not on a pill) -> create new task on that date
                if (e.target === e.currentTarget || e.target.classList.contains('cal-cell__date')
                    || e.target.classList.contains('cal-cell__tasks')) {
                  if (setDefaultDueDate) {
                    const iso = cellDate.toISOString().split('T')[0];
                    setDefaultDueDate(iso);
                  }
                  setShowForm(true);
                }
              }}
            >
              <div className="cal-cell__date">{cellDate.getDate()}</div>
              <div className="cal-cell__tasks">
                {cellTasks.slice(0, SHOW_MAX).map(t => {
                  const qid = QID_BY_QUAD[getQuadrant(t)] || 'q4';
                  const tt = taskTime(t);
                  const tooltip = (tt ? `${tt} · ` : '') + t.task
                    + (t.subcategory ? ` (${t.subcategory})` : '');
                  return (
                    <div
                      key={t.id}
                      className={`cal-task-pill cal-task-pill--${qid}`}
                      title={tooltip}
                      onClick={(e) => { e.stopPropagation(); setEditingTask(t); setShowForm(true); }}
                    >
                      {tt && <span className="cal-task-pill__time">{tt}</span>}
                      {t.task}
                    </div>
                  );
                })}
                {cellTasks.length > SHOW_MAX && (
                  <div className="cal-task-pill__overflow">+ {cellTasks.length - SHOW_MAX} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
