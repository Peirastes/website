import React from 'react';
import {
  LayoutGrid, List, BarChart3, Calendar, Compass, TrendingUp,
  FolderKanban, MessageSquare, Plus, Info, Settings, Download, Upload, RefreshCw, Columns
} from 'lucide-react';

/**
 * AppDock — the app's navigation + action controls, rendered in one of two
 * layouts so there is a single source of truth for the nav tabs + utilities:
 *   • layout="bar"  → the default floating strip at the bottom (all views).
 *   • layout="rail" → vertical glass frames (Views + Actions) for the Bridge's
 *                     top-left command column.
 */
const VIEW_TABS = [
  { key: 'matrix',    icon: LayoutGrid,   label: 'Matrix' },
  { key: 'list',      icon: List,         label: 'List' },
  { key: 'gantt',     icon: BarChart3,    label: 'Gantt' },
  { key: 'calendar',  icon: Calendar,     label: 'Calendar' },
  { key: 'bridge',    icon: Compass,      label: 'Bridge' },
  { key: 'analytics', icon: TrendingUp,   label: 'Analytics' },
  { key: 'projects',  icon: FolderKanban, label: 'Projects' },
  { key: 'copilot',   icon: MessageSquare, label: 'Copilot' }
];

export const AppDock = ({
  layout = 'bar', view, setView,
  onAddTask, onInfo, onSettings, onExport, onImport, onRefresh, isRefreshing,
  onSublanes
}) => {
  /* On the Bridge the dock floats over the draggable globe — stop pointerdown
     from starting a globe drag. Harmless on the bottom bar. */
  const stop = (e) => e.stopPropagation();

  const tabs = (
    <div className="cin-view-tabs" role="tablist">
      {VIEW_TABS.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          className={`cin-view-tab ${view === key ? 'on' : ''}`}
          onClick={() => setView(key)}
          onPointerDown={stop}
          role="tab"
          aria-selected={view === key}
        >
          <span className="cin-view-tab__glyph"><Icon size={13} /></span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );

  const actions = (
    <>
      <button className="cin-add-task" onClick={onAddTask} onPointerDown={stop} title="Add new task">
        <span className="cin-add-task__glyph"><Plus size={14} strokeWidth={2.5} /></span>
        <span>Add Task</span>
      </button>
      <div className="cin-utility-cluster">
        <button className="cin-utility-btn" onClick={onInfo} onPointerDown={stop} title="About this app" aria-label="About"><Info size={13} /></button>
        <button className="cin-utility-btn" onClick={onSettings} onPointerDown={stop} title="Settings" aria-label="Settings"><Settings size={13} /></button>
        {onSublanes && (
          <button className="cin-utility-btn" onClick={onSublanes} onPointerDown={stop} title="Manage sublanes" aria-label="Manage sublanes"><Columns size={13} /></button>
        )}
        <button className="cin-utility-btn" onClick={onExport} onPointerDown={stop} title="Export data" aria-label="Export"><Download size={13} /></button>
        <label className="cin-utility-btn" title="Import data" style={{ cursor: 'pointer' }} onPointerDown={stop}>
          <Upload size={13} />
          <input type="file" accept=".json" onChange={onImport} style={{ display: 'none' }} />
        </label>
        <button className="cin-utility-btn" onClick={onRefresh} onPointerDown={stop} disabled={isRefreshing} title="Refresh" aria-label="Refresh">
          <RefreshCw size={13} className={isRefreshing ? 'cin-utility-btn--spin' : ''} />
        </button>
      </div>
    </>
  );

  if (layout === 'rail') {
    /* Inline sections that nest inside the Bridge's single Command frame —
       no glass chrome of their own; the frame around them supplies it. */
    return (
      <>
        <span className="bridge-console__sep" />
        <div className="bridge-console__sub">◰ Views</div>
        {tabs}
        <span className="bridge-console__sep" />
        <div className="bridge-console__sub">◰ Actions</div>
        <div className="bridge-console__actions">{actions}</div>
      </>
    );
  }

  return (
    <div className="cin-action-bar">
      <div className="cin-dash-zone cin-dash-zone--views">{tabs}</div>
      <div className="cin-dash-zone cin-dash-zone--actions">{actions}</div>
    </div>
  );
};
