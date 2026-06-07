import React from 'react';

/**
 * PHASE 3: MatrixTask — cinematic task row for the desktop matrix view.
 * Click the row → open edit modal (replaces v2's expand/collapse UI).
 * Checkbox toggles completion without bubbling. Hover translates the row
 * 2px right + brightens the border (same interaction vocabulary as the
 * demo's task rows).
 */
export const MatrixTask = ({ task, qid, calculatePriority, toggleComplete, onClick }) => {
  const priority = calculatePriority(task);
  const isOverdue = priority < 0;
  const isToday   = priority === 0;
  const isDone    = task.percentComplete === 100;

  let dueText, badgeClass;
  if (isOverdue) {
    dueText = `${Math.abs(priority)}d over`;
    badgeClass = 'cin-task__badge--overdue';
  } else if (isToday) {
    dueText = 'Today';
    badgeClass = 'cin-task__badge--today';
  } else if (priority === 1) {
    dueText = 'Tomorrow';
    badgeClass = 'cin-task__badge--soon';
  } else if (priority <= 3) {
    dueText = `${priority}d`;
    badgeClass = 'cin-task__badge--soon';
  } else {
    dueText = `${priority}d`;
    badgeClass = 'cin-task__badge--later';
  }

  const rowClass =
    `cin-task cin-task--${qid}` +
    (isOverdue ? ' cin-task--overdue' : '') +
    (isToday   ? ' cin-task--today'   : '') +
    (isDone    ? ' cin-task--done'    : '');

  return (
    <div className={rowClass} onClick={onClick}>
      <input
        type="checkbox"
        className="cin-task__check"
        checked={isDone}
        onChange={(e) => { e.stopPropagation(); toggleComplete(task.id); }}
        onClick={(e) => e.stopPropagation()}
        aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
      />
      <div className="cin-task__name" title={task.task}>{task.task}</div>
      <div className={`cin-task__badge ${badgeClass}`}>{dueText}</div>
      <div className="cin-task__meta-row">
        {task.subcategory && <span className="cin-task__tag">{task.subcategory}</span>}
        <span>R{task.rank}</span>
        {task.percentComplete > 0 && task.percentComplete < 100 && (
          <span style={{ color: 'var(--cin-cyan-soft)' }}>{task.percentComplete}%</span>
        )}
      </div>
    </div>
  );
};
