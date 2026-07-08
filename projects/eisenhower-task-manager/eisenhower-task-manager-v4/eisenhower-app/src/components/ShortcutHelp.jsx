import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ShortcutHelp — small centered overlay listing keyboard shortcuts.
 * Triggered by ? — closed by Esc, backdrop click, or the X.
 */
export const ShortcutHelp = ({ onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows = [
    { keys: ['Ctrl', 'K'], desc: 'Search tasks' },
    { keys: ['N'],         desc: 'New task' },
    { keys: ['?'],         desc: 'Show this card' },
    { keys: ['Esc'],       desc: 'Close any modal / overlay' },
  ];

  return (
    <div
      className="cin-shortcut-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <div className="cin-shortcut-card">
        <div className="cin-shortcut-card__head">
          <div className="cin-shortcut-card__title">Keyboard Shortcuts</div>
          <button className="cin-modal__close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <div className="cin-shortcut-card__body">
          {rows.map(r => (
            <div key={r.desc} className="cin-shortcut-row">
              <div className="cin-shortcut-row__keys">
                {r.keys.map((k, i) => (
                  <React.Fragment key={k}>
                    {i > 0 && <span className="cin-shortcut-row__plus">+</span>}
                    <kbd>{k}</kbd>
                  </React.Fragment>
                ))}
              </div>
              <div className="cin-shortcut-row__desc">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
