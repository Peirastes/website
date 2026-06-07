import React from 'react';
import { X, Edit2, Calendar, Clock, Tag, Activity, FileText } from 'lucide-react';

const QUAD_META = {
  'do-first':  { label: 'CRITICAL',  qid: 'q1' },
  'schedule':  { label: 'STRATEGIC', qid: 'q2' },
  'delegate':  { label: 'DELEGATE',  qid: 'q3' },
  'eliminate': { label: 'ELIMINATE', qid: 'q4' },
};

const formatDue = (d, t) => {
  if (!d) return 'No date';
  const dd = (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
    ? (() => { const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day); })()
    : new Date(d);
  if (Number.isNaN(dd.getTime())) return 'No date';
  const datePart = dd.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  if (typeof t === 'string' && /^\d{1,2}:\d{2}/.test(t)) {
    const [hh, mm] = t.split(':').map(Number);
    const tDate = new Date(2000, 0, 1, hh, mm);
    const timePart = tDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return `${datePart} · ${timePart}`;
  }
  return datePart;
};

const formatEffort = (task) => {
  const v = Number(task.timeEstimateValue);
  if (!v || v <= 0) return '—';
  const u = task.timeEstimateUnit || 'hours';
  return `${v} ${u}`;
};

export const TaskDetailsModal = ({ task, getQuadrant, onEdit, onClose }) => {
  if (!task) return null;
  const quad = QUAD_META[getQuadrant(task)] || QUAD_META.eliminate;
  const pct = Number(task.percentComplete) || 0;

  return (
    <div
      className="cin-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`cin-modal cin-task-details cin-task-details--${quad.qid}`} style={{ maxWidth: '30rem' }}>
        <div className="cin-modal__head">
          <div className="cin-modal__title">
            <span className={`cin-task-details__badge cin-task-details__badge--${quad.qid}`}>
              {quad.label}
            </span>
          </div>
          <button className="cin-modal__close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="cin-modal__body">
          <div className="cin-task-details__name">{task.task}</div>

          {task.notes && (
            <div className="cin-task-details__notes">
              <FileText size={12} className="cin-task-details__notes-icon" />
              <span>{task.notes}</span>
            </div>
          )}

          <div className="cin-task-details__grid">
            <div className="cin-task-details__row">
              <Calendar size={13} className="cin-task-details__icon" />
              <span className="cin-task-details__label">Due</span>
              <span className="cin-task-details__value">{formatDue(task.dueDate, task.dueTime)}</span>
            </div>
            <div className="cin-task-details__row">
              <Tag size={13} className="cin-task-details__icon" />
              <span className="cin-task-details__label">Lane</span>
              <span className="cin-task-details__value">{task.domain || '—'}</span>
            </div>
            <div className="cin-task-details__row">
              <Clock size={13} className="cin-task-details__icon" />
              <span className="cin-task-details__label">Effort</span>
              <span className="cin-task-details__value">{formatEffort(task)}</span>
            </div>
            <div className="cin-task-details__row">
              <Activity size={13} className="cin-task-details__icon" />
              <span className="cin-task-details__label">Progress</span>
              <span className="cin-task-details__value">
                <span className="cin-task-details__bar">
                  <span
                    className={`cin-task-details__bar-fill cin-task-details__bar-fill--${quad.qid}`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="cin-task-details__bar-text">{pct}%</span>
              </span>
            </div>
          </div>
        </div>

        <div className="cin-modal__footer">
          <button className="cin-btn cin-btn--secondary" onClick={onClose}>Close</button>
          <button
            className="cin-btn"
            onClick={() => { onEdit(task); onClose(); }}
          >
            <Edit2 size={13} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
};
