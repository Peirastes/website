import React, { useState } from 'react';
import { X } from 'lucide-react';
import { splitDueDate } from '../lib/dateFormat';

/**
 * PHASE 5: cinematic acrylic-glass task form. Orbitron title, cyan
 * form inputs with cyan-glow focus, gold-check checkboxes,
 * cyan-chevron dropdowns, amber primary action button.
 *
 * dueDate is stored as "YYYY-MM-DD" date-only. dueTime ("HH:MM") is
 * a separate optional field; if a legacy "YYYY-MM-DDTHH:MM" comes
 * in via task.dueDate, splitDueDate splits it on load.
 *
 * Calendar-event toggle (formData.isEvent) marks the task as a
 * scheduled event — those are filtered out of the Matrix / List /
 * Gantt / Analytics views and shown only on the Bridge + Calendar.
 */
export const TaskForm = ({ task, defaultDueDate, onSave, onCancel, settings, projects = [], tasks = [] }) => {
  const [formData, setFormData] = useState(() => {
    if (task) {
      /* Prefer explicit dueTime; fall back to splitting a legacy
         "YYYY-MM-DDTHH:MM" dueDate for back-compat. */
      const { date, time } = splitDueDate(task.dueDate);
      return { ...task, dueDate: date, dueTime: task.dueTime ?? time };
    }
    const { date, time } = splitDueDate(defaultDueDate);
    return {
      task: '',
      domain: 'Teaching',
      scope: 'Professional',
      subcategory: '',
      isUrgent: false,
      isNecessary: false,
      rank: 2,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: date,
      dueTime: time,
      percentComplete: 0,
      isRecurring: false,
      recurringPattern: 'once',
      notes: '',
      qualityRating: null,
      easeRating: null,
      timeEstimateValue: null,
      timeEstimateUnit: 'hours'
    };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.task || !formData.dueDate) {
      alert('Please fill in task name and due date');
      return;
    }
    /* dueDate stays date-only ("YYYY-MM-DD"); dueTime is its own
       optional "HH:MM" string. They're persisted as separate fields. */
    onSave({ ...formData, dueTime: formData.dueTime || '' });
  };

  const subcategoryOptions = settings.subcategories[formData.domain] || [];

  /* Project dropdown: surface tracked projects (quests being followed, or any
     with tasks) at the top, the rest of the portfolio below. (The active project
     store mirrors all of peirastes.com, so most entries are task-less containers.) */
  const projectIdsWithTasks = new Set(tasks.filter(t => !t.deletedAt && t.projectId).map(t => t.projectId));
  const isTracked = p => p.tracked || projectIdsWithTasks.has(p.id);
  const assignable = projects.filter(p => p.status !== 'archived').sort((a, b) => a.name.localeCompare(b.name));
  const trackedProjects = assignable.filter(isTracked);
  const otherProjects = assignable.filter(p => !isTracked(p));

  return (
    <div className="cin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <form className="cin-modal" onSubmit={handleSubmit}>
        <div className="cin-modal__head">
          <div className="cin-modal__title">{task ? 'Edit Task' : 'New Task'}</div>
          <button type="button" className="cin-modal__close" onClick={onCancel} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="cin-modal__body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Task name */}
            <div className="cin-field">
              <label className="cin-field__label">Task name *</label>
              <input
                type="text"
                className="cin-input"
                value={formData.task}
                onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                placeholder="Enter task description"
                required
                autoFocus
              />
            </div>

            {/* Urgent + Necessary check tiles */}
            <div className="cin-form-grid cin-form-grid--2">
              <label className={'cin-check-tile' + (formData.isUrgent ? ' cin-check-tile--checked' : '')}>
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                />
                <div className="cin-check-tile__main">
                  <div className="cin-check-tile__name">Urgent</div>
                  <div className="cin-check-tile__sub">Time-sensitive</div>
                </div>
              </label>
              <label className={'cin-check-tile' + (formData.isNecessary ? ' cin-check-tile--checked' : '')}>
                <input
                  type="checkbox"
                  checked={formData.isNecessary}
                  onChange={(e) => setFormData({ ...formData, isNecessary: e.target.checked })}
                />
                <div className="cin-check-tile__main">
                  <div className="cin-check-tile__name">Necessary</div>
                  <div className="cin-check-tile__sub">Important / Critical</div>
                </div>
              </label>
            </div>

            {/* Domain / Scope / Subcategory */}
            <div className="cin-form-grid cin-form-grid--3">
              <div className="cin-field">
                <label className="cin-field__label">Domain</label>
                <select
                  className="cin-select"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value, subcategory: '' })}
                >
                  {(settings.domains || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="cin-field">
                <label className="cin-field__label">Scope</label>
                <select
                  className="cin-select"
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                >
                  {(settings.scopes || []).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="cin-field">
                <label className="cin-field__label">Subcategory</label>
                <select
                  className="cin-select"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                >
                  <option value="">Select…</option>
                  {subcategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            </div>

            {/* Project */}
            <div className="cin-field">
              <label className="cin-field__label">Project</label>
              <select
                className="cin-select"
                value={formData.projectId || ''}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value || null })}
              >
                <option value="">— None —</option>
                {trackedProjects.length > 0 && (
                  <optgroup label="Tracked Projects">
                    {trackedProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                )}
                {otherProjects.length > 0 && (
                  <optgroup label="All projects">
                    {otherProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Assigned / Due / Rank */}
            <div className="cin-form-grid cin-form-grid--3">
              <div className="cin-field">
                <label className="cin-field__label">Assigned</label>
                <input
                  type="date"
                  className="cin-input"
                  value={formData.assignedDate}
                  onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                />
              </div>
              <div className="cin-field">
                <label className="cin-field__label">Due *</label>
                <div className="cin-form-grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: '6px' }}>
                  <input
                    type="date"
                    className="cin-input"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                  <input
                    type="time"
                    className="cin-input"
                    value={formData.dueTime || ''}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    title="Optional time of day"
                  />
                </div>
              </div>
              <div className="cin-field">
                <label className="cin-field__label">Rank</label>
                <select
                  className="cin-select"
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                >
                  <option value={1}>1 — Highest</option>
                  <option value={2}>2 — Medium</option>
                  <option value={3}>3 — Lower</option>
                </select>
              </div>
            </div>

            {/* Time Estimate */}
            <div className="cin-field">
              <label className="cin-field__label">Time Estimate (optional)</label>
              <div className="cin-form-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="cin-input"
                  value={formData.timeEstimateValue || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    timeEstimateValue: e.target.value ? parseFloat(e.target.value) : null
                  })}
                  placeholder="e.g., 5  ·  2.5"
                />
                <select
                  className="cin-select"
                  value={formData.timeEstimateUnit}
                  onChange={(e) => setFormData({ ...formData, timeEstimateUnit: e.target.value })}
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <div className="cin-field__hint">
                5-minute rule: if a task takes &lt; 5 min, just do it now.
              </div>
            </div>

            {/* Progress */}
            <div className="cin-field">
              <label className="cin-field__label">Progress · {formData.percentComplete}%</label>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={formData.percentComplete}
                onChange={(e) => setFormData({ ...formData, percentComplete: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--cin-gold)' }}
              />
            </div>

            {/* Recurrence */}
            <div className="cin-field">
              <label className="cin-field__label">Recurrence</label>
              <select
                className="cin-select"
                value={formData.recurringPattern || 'once'}
                onChange={(e) => setFormData({
                  ...formData,
                  recurringPattern: e.target.value,
                  isRecurring: e.target.value !== 'once'
                })}
              >
                <option value="once">Once (one-time)</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Event toggle — events show on Bridge + Calendar only,
                excluded from Matrix / List / Gantt / Analytics. */}
            <div className="cin-check-tile" style={{ cursor: 'pointer' }}
                 onClick={() => setFormData({ ...formData, isEvent: !formData.isEvent })}>
              <input
                type="checkbox"
                checked={!!formData.isEvent}
                onChange={(e) => setFormData({ ...formData, isEvent: e.target.checked })}
                onClick={(e) => e.stopPropagation()}
              />
              <div>
                <div className="cin-check-tile__label">Calendar event</div>
                <div className="cin-check-tile__sub">Show on Bridge + Calendar only, not in Matrix / List / Gantt</div>
              </div>
            </div>

            {/* Notes */}
            <div className="cin-field">
              <label className="cin-field__label">Notes</label>
              <textarea
                className="cin-textarea"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details…"
              />
            </div>

          </div>
        </div>

        <div className="cin-modal__footer">
          <button type="button" className="cin-btn cin-btn--secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="cin-btn cin-btn--primary">{task ? 'Update Task' : 'Create Task'}</button>
        </div>
      </form>
    </div>
  );
};
