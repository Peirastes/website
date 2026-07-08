import React from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * UndoToast — fixed-position acrylic strip shown for ~5s after a delete.
 * Auto-dismiss timer lives in App.jsx so the toast can be re-triggered
 * (replacing the previous instance) without a per-toast lifecycle here.
 *
 * Props:
 *   task    — the deleted task ({ task: '...', ... })
 *   onUndo  — () => void  restores the task at its prior index
 */
export const UndoToast = ({ task, onUndo }) => {
  return (
    <div className="cin-undo-toast" role="status" aria-live="polite">
      <div className="cin-undo-toast__msg">
        <span className="cin-undo-toast__label">Deleted</span>
        <span className="cin-undo-toast__name" title={task.task}>{task.task}</span>
      </div>
      <button
        type="button"
        className="cin-undo-toast__btn"
        onClick={onUndo}
        aria-label="Undo delete"
      >
        <RotateCcw size={12} />
        <span>Undo</span>
      </button>
    </div>
  );
};
