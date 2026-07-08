import React, { useMemo, useState } from 'react';
import { X, Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Star } from 'lucide-react';
import { seedRegistry, sublaneStats, newSublaneId } from '../views/BridgeView/sublanes';

/**
 * SublaneManagerModal — Phase 2 UI for the persistent sublane registry.
 *
 * Launched from the Bridge Command frame's ⚙ actions. Works on a local draft so
 * Cancel discards; Save merges { sublanes } into settings, which the App-level
 * auto-save effect persists to the server (POST /api/settings).
 *
 * Per domain (Projects excluded — its tracks are managed in the Projects view):
 *   • Track rows — Eye toggle (track/untrack, keeps history when hidden),
 *     editable name, tag + title-keyword chip binders, reorder, remove.
 *   • Live stats per track — total / open / % done / since-year, ★ = busiest.
 *   • "Uncovered tags" — subcategory tags present in the data but claimed by no
 *     track; click one to spin up a track bound to it.
 *
 * Props: settings, setSettings, tasks (full live array), domains, onClose.
 */
export const SublaneManagerModal = ({ settings, setSettings, tasks = [], domains = [], onClose }) => {
  const managed = useMemo(() => domains.filter(d => d !== 'Projects'), [domains]);
  const [draft, setDraft] = useState(() => seedRegistry(settings, managed));
  const [active, setActive] = useState(managed[0] || null);
  const [inputs, setInputs] = useState({});   // transient add-chip inputs, keyed `${id}:${type}`
  const [newName, setNewName] = useState('');

  const rows = draft[active] || [];
  const domainTasks = useMemo(() => tasks.filter(t => t.domain === active), [tasks, active]);
  const stats = rows.map(s => sublaneStats(s, domainTasks));
  const maxTotal = Math.max(0, ...stats.map(s => s.total));

  // Subcategory tags in the data not claimed by any track in this domain.
  const uncovered = useMemo(() => {
    const claimed = new Set();
    for (const s of rows) for (const m of (s.matches || [])) claimed.add(m);
    const seen = new Map();
    for (const t of domainTasks) {
      const c = t.subcategory;
      if (!c || claimed.has(c)) continue;
      seen.set(c, (seen.get(c) || 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows, domainTasks]);

  // ── Draft mutators (scoped to the active domain) ───────────────────────────
  const mutate = (fn) => setDraft(d => ({ ...d, [active]: fn(d[active] || []) }));
  const updateRow = (id, patch) => mutate(list => list.map(s => (s.id === id ? { ...s, ...patch } : s)));
  const toggleTrack = (id) => mutate(list => list.map(s => (s.id === id ? { ...s, tracked: !s.tracked } : s)));
  const move = (id, dir) => mutate(list => {
    const i = list.findIndex(s => s.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return list;
    const next = [...list]; [next[i], next[j]] = [next[j], next[i]]; return next;
  });
  const removeRow = (id) => mutate(list => list.filter(s => s.id !== id));
  const addTag = (id, type) => {
    const key = `${id}:${type}`; const v = (inputs[key] || '').trim();
    if (!v) return;
    mutate(list => list.map(s => {
      if (s.id !== id) return s;
      const arr = s[type] || [];
      return arr.includes(v) ? s : { ...s, [type]: [...arr, v] };
    }));
    setInputs(n => ({ ...n, [key]: '' }));
  };
  const removeTag = (id, type, val) =>
    mutate(list => list.map(s => (s.id === id ? { ...s, [type]: (s[type] || []).filter(x => x !== val) } : s)));
  const addSublane = (name, matches = []) => {
    const v = (name || '').trim(); if (!v) return;
    mutate(list => [...list, { id: newSublaneId(), name: v, matches, titleMatches: [], tracked: true }]);
    setNewName('');
  };

  const handleSave = () => {
    setSettings(s => ({ ...s, sublanes: { ...(s.sublanes || {}), ...draft } }));
    onClose();
  };
  const onEnter = (fn) => (e) => { if (e.key === 'Enter') { e.preventDefault(); fn(); } };

  const setInput = (key, val) => setInputs(n => ({ ...n, [key]: val }));

  return (
    <div className="cin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cin-modal cin-modal--sublanes" style={{ maxWidth: '46rem' }}>
        <div className="cin-modal__head">
          <div className="cin-modal__title">Sublane Manager</div>
          <button className="cin-modal__close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="cin-modal__body">
          {/* Domain tabs */}
          <div className="sl-tabs" role="tablist">
            {managed.map(d => (
              <button key={d} type="button" role="tab"
                className={`sl-tab${active === d ? ' is-active' : ''}`}
                onClick={() => setActive(d)}>{d}</button>
            ))}
          </div>
          <div className="cin-settings-section__hint">
            Tracks bind to existing task tags/titles — they never rename them. Untrack
            a track (the eye) to hide it from the globe while keeping its history;
            re-track it any time. Projects tracks are managed in the Projects view.
          </div>

          {/* Track rows */}
          <div className="sl-list">
            {rows.length === 0 && <div className="cin-chip-row__empty">No tracks yet — add one below.</div>}
            {rows.map((s, i) => {
              const st = stats[i];
              const busiest = st.total > 0 && st.total === maxTotal;
              return (
                <div key={s.id} className={`sl-row${s.tracked ? '' : ' is-untracked'}`}>
                  <div className="sl-row__main">
                    <button type="button" className={`sl-track${s.tracked ? ' is-on' : ''}`}
                      onClick={() => toggleTrack(s.id)}
                      title={s.tracked ? 'Tracked — shown on the globe' : 'Untracked — hidden (history kept)'}>
                      {s.tracked ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <input className="cin-input sl-name" value={s.name}
                      onChange={(e) => updateRow(s.id, { name: e.target.value })} placeholder="Track name" />
                    <span className="sl-stats" title="all-time tasks · open · completion · first seen">
                      {busiest && <Star size={10} className="sl-stats__star" fill="currentColor" />}
                      <b>{st.total}</b> tasks · {st.open} open · {st.pct}% done{st.since ? ` · since ’${st.since.slice(2)}` : ''}
                    </span>
                    <span className="sl-row__ctrls">
                      <button type="button" className="cin-utility-btn" onClick={() => move(s.id, -1)} disabled={i === 0} aria-label="Move up"><ChevronUp size={13} /></button>
                      <button type="button" className="cin-utility-btn" onClick={() => move(s.id, +1)} disabled={i === rows.length - 1} aria-label="Move down"><ChevronDown size={13} /></button>
                      <button type="button" className="cin-utility-btn sl-del" onClick={() => removeRow(s.id)} aria-label="Remove track"><Trash2 size={13} /></button>
                    </span>
                  </div>
                  <div className="sl-binds">
                    <div className="sl-bind">
                      <span className="sl-bind__label">Tags</span>
                      <div className="cin-chip-row">
                        {(s.matches || []).map(m => (
                          <span key={m} className="cin-chip">{m}
                            <button type="button" className="cin-chip__remove" onClick={() => removeTag(s.id, 'matches', m)} aria-label={`Remove ${m}`}><X size={10} /></button>
                          </span>
                        ))}
                        <input className="cin-input sl-tagin" value={inputs[`${s.id}:matches`] || ''} placeholder="+ tag"
                          onChange={(e) => setInput(`${s.id}:matches`, e.target.value)}
                          onKeyDown={onEnter(() => addTag(s.id, 'matches'))} />
                      </div>
                    </div>
                    <div className="sl-bind">
                      <span className="sl-bind__label">Title has</span>
                      <div className="cin-chip-row">
                        {(s.titleMatches || []).map(m => (
                          <span key={m} className="cin-chip cin-chip--title">{m}
                            <button type="button" className="cin-chip__remove" onClick={() => removeTag(s.id, 'titleMatches', m)} aria-label={`Remove ${m}`}><X size={10} /></button>
                          </span>
                        ))}
                        <input className="cin-input sl-tagin" value={inputs[`${s.id}:titleMatches`] || ''} placeholder="+ keyword"
                          onChange={(e) => setInput(`${s.id}:titleMatches`, e.target.value)}
                          onKeyDown={onEnter(() => addTag(s.id, 'titleMatches'))} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add track */}
          <div className="cin-chip-input-row">
            <input className="cin-input" value={newName} placeholder={active ? `New ${active} track` : 'New track'}
              onChange={(e) => setNewName(e.target.value)} onKeyDown={onEnter(() => addSublane(newName))} />
            <button type="button" className="cin-btn cin-btn--secondary" onClick={() => addSublane(newName)}>
              <Plus size={12} /> Add track
            </button>
          </div>

          {/* Uncovered tags — quick-create tracks from tags present in the data. */}
          {uncovered.length > 0 && (
            <div className="cin-settings-section">
              <div className="cin-settings-section__head">
                Uncovered tags <span className="sl-muted">· click to make a track</span>
              </div>
              <div className="cin-chip-row">
                {uncovered.map(([tag, count]) => (
                  <button key={tag} type="button" className="cin-chip cin-chip--ghost" onClick={() => addSublane(tag, [tag])}>
                    {tag} <span className="sl-muted">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="cin-modal__footer">
          <button type="button" className="cin-btn cin-btn--secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="cin-btn cin-btn--primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};
