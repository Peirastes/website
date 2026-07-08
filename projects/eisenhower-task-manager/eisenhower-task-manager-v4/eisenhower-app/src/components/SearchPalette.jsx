import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';

/**
 * SearchPalette — Ctrl+K command palette
 *
 * Acrylic-glass overlay for fast task lookup. Fuzzy substring match
 * across task name, project (task.subcategory), and domain.
 * Up/Down arrows navigate, Enter opens the editor on that task, Esc closes.
 *
 * Props:
 *   tasks         — array of task records
 *   onSelectTask  — (task) => void  — fires when user picks a result
 *   onClose       — () => void
 *   getQuadrant   — (task) => 'do-first' | 'schedule' | 'delegate' | 'eliminate'
 */
export const SearchPalette = ({ tasks, onSelectTask, onClose, getQuadrant }) => {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Autofocus the input on mount.
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Filter + rank. Active (incomplete) tasks first, then completed, capped at 30.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const haystack = (t) => [
      t.task || '',
      t.subcategory || '',
      t.domain || ''
    ].join(' ').toLowerCase();
    const matches = q
      ? tasks.filter(t => haystack(t).includes(q))
      : tasks.filter(t => t.percentComplete !== 100).slice(0, 30);
    matches.sort((a, b) => {
      const aDone = a.percentComplete === 100 ? 1 : 0;
      const bDone = b.percentComplete === 100 ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return (a.task || '').localeCompare(b.task || '');
    });
    return matches.slice(0, 30);
  }, [query, tasks]);

  // Reset highlight whenever the result set changes shape.
  useEffect(() => { setHighlight(0); }, [query]);

  // Keep the highlighted row in view as Up/Down moves through the list.
  useEffect(() => {
    const node = listRef.current?.querySelector(`[data-idx="${highlight}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  const pick = useCallback((task) => {
    if (!task) return;
    onSelectTask(task);
  }, [onSelectTask]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      pick(results[highlight]);
      return;
    }
  };

  return (
    <div
      className="cin-search-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-label="Search tasks"
    >
      <div className="cin-search-panel" onKeyDown={onKeyDown}>
        <div className="cin-search-input-row">
          <Search size={16} strokeWidth={1.5} className="cin-search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, domains…"
            className="cin-search-input"
            aria-label="Search query"
          />
          <kbd className="cin-search-kbd">Esc</kbd>
        </div>

        <div className="cin-search-results" ref={listRef}>
          {results.length === 0 ? (
            <div className="cin-search-empty">No matches</div>
          ) : results.map((t, i) => {
            const q = getQuadrant(t);
            const qid = q === 'do-first' ? 'q1'
                     : q === 'schedule' ? 'q2'
                     : q === 'delegate' ? 'q3'
                     : 'q4';
            const done = t.percentComplete === 100;
            return (
              <button
                key={t.id}
                data-idx={i}
                data-qid={qid}
                className={`cin-search-row ${i === highlight ? 'is-highlight' : ''} ${done ? 'is-done' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(t)}
              >
                <span className="cin-search-row__dot" data-qid={qid} aria-hidden="true" />
                <span className="cin-search-row__name">{t.task}</span>
                {(t.subcategory || t.domain) && (
                  <span className="cin-search-row__meta">{t.subcategory || t.domain}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="cin-search-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};
