import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Calendar, ChevronDown, ChevronLeft, ChevronRight, Download, Upload, Settings, AlertCircle, CheckCircle, LayoutGrid, List, Shield, Clock, Archive, Repeat, BarChart3, TrendingUp, RefreshCw, Compass } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);
import { BootOverlay } from './components/BootOverlay';
import { CinematicChrome } from './components/CinematicChrome';
import { SearchPalette } from './components/SearchPalette';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutHelp } from './components/ShortcutHelp';
import { UndoToast } from './components/UndoToast';
import { InfoModal } from './components/InfoModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';

const API_BASE = '/api';

async function apiFetch(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

const EisenhowerTaskManager = () => {
  // PIN Protection
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('eisenhower-unlocked') === 'true';
  });
  // Track if we just unlocked (for entrance animation) vs already unlocked on load
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [appRevealed, setAppRevealed] = useState(() => {
    // If already unlocked on mount, skip the reveal animation
    return sessionStorage.getItem('eisenhower-unlocked') === 'true';
  });

  // All state must be declared before any conditional rendering
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState({
    domains: ['Teaching', 'Projects', 'Personal'],
    scopes: ['Professional', 'Personal'],
    subcategories: {
      'Teaching': ['PSEII', 'Dynamics', 'Statics', 'Intro to Engineering', 'TE Lab'],
      'Projects': ['Optics Lab', 'ETM', 'Bond Graph Engine', 'Agent World', 'Website', 'Collision Lab', 'Capacitor Lab', 'Smoke Sim', 'Artemis II', 'ODS Paper', 'DSL', 'KB Explorer', 'Pipeline IDE'],
      'Personal': ['Car', 'Home', 'Health', 'Finance']
    },
    listMode: 'simple'
  });
  const [backupMetadata, setBackupMetadata] = useState({
    lastExport: null,
    exportCount: 0,
    lastAutoSave: null
  });
  const [view, setView] = useState('matrix');
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [defaultDueDate, setDefaultDueDate] = useState('');
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingTask, setCompletingTask] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  /* Undo-on-delete buffer. Holds { task, index } for ~5s after a delete;
     clicking the toast or hitting Undo restores the task at its prior index. */
  const [deletedTask, setDeletedTask] = useState(null);
  const [filters, setFilters] = useState({
    quadrant: 'all',
    domain: 'all',
    scope: 'all',
    status: 'active',
    recurrence: 'all'
  });
  const [sortBy, setSortBy] = useState('priority');
  const [isLoading, setIsLoading] = useState(true);

  // PIN check moved to JSX return — no early return before hooks

  // Dead code: sample tasks kept for reference but unused — server is single source of truth
  const _unusedSampleTasks = [
    {
      id: '1',
      task: 'Prepare Homework (HW3)',
      domain: 'Teaching', scope: 'Professional',
      subcategory: 'Dynamics',
      isUrgent: true,
      isNecessary: true,
      rank: 1,
      assignedDate: '2025-01-20',
      dueDate: '2025-01-25',
      completedDate: null,
      percentComplete: 0,
      isRecurring: false,
      recurringPattern: 'once',
      notes: 'Focus on problem sets 4-7',
      qualityRating: null,
      easeRating: null,
      timeEstimateValue: 5,
      timeEstimateUnit: 'hours'
    },
    {
      id: '2',
      task: 'Complete Lab Report',
      domain: 'Teaching', scope: 'Professional',
      subcategory: 'TE Lab',
      isUrgent: true,
      isNecessary: true,
      rank: 2,
      assignedDate: '2025-01-18',
      dueDate: '2025-01-26',
      completedDate: null,
      percentComplete: 60,
      isRecurring: false,
      recurringPattern: 'once',
      notes: 'Data analysis section remaining',
      qualityRating: null,
      easeRating: null,
      timeEstimateValue: 8,
      timeEstimateUnit: 'hours'
    },
    {
      id: '3',
      task: 'Review Course Material',
      domain: 'Teaching', scope: 'Professional',
      subcategory: 'PSEII',
      isUrgent: false,
      isNecessary: true,
      rank: 1,
      assignedDate: '2025-01-22',
      dueDate: '2025-01-24',
      completedDate: null,
      percentComplete: 0,
      isRecurring: true,
      recurringPattern: 'daily',
      notes: '30 minutes each day',
      qualityRating: null,
      easeRating: null,
      timeEstimateValue: 0.5,
      timeEstimateUnit: 'hours'
    },
    {
      id: '4',
      task: 'Attend Team Meeting',
      domain: 'Teaching', scope: 'Professional',
      subcategory: 'Intro to Engineering',
      isUrgent: true,
      isNecessary: false,
      rank: 1,
      assignedDate: '2025-01-23',
      dueDate: '2025-01-24',
      completedDate: null,
      percentComplete: 0,
      isRecurring: true,
      recurringPattern: 'weekly',
      notes: 'Thursday 3pm',
      qualityRating: null,
      easeRating: null,
      timeEstimateValue: 1,
      timeEstimateUnit: 'hours'
    },
    {
      id: '5',
      task: 'Schedule Car Maintenance',
      domain: 'Personal', scope: 'Personal',
      subcategory: 'Car',
      isUrgent: false,
      isNecessary: true,
      rank: 2,
      assignedDate: '2025-01-22',
      dueDate: '2025-02-05',
      completedDate: null,
      percentComplete: 0,
      isRecurring: true,
      recurringPattern: 'monthly',
      notes: 'Oil change and tire rotation',
      qualityRating: null,
      easeRating: null,
      timeEstimateValue: 1.5,
      timeEstimateUnit: 'hours'
    },
    {
      id: '6',
      task: 'File Annual Tax Documents',
      domain: 'Personal', scope: 'Personal',
      subcategory: 'Finance',
      isUrgent: false,
      isNecessary: true,
      rank: 1,
      assignedDate: '2025-01-15',
      dueDate: '2025-04-15',
      completedDate: null,
      percentComplete: 0,
      isRecurring: true,
      recurringPattern: 'yearly',
      notes: 'Tax deadline April 15th',
      qualityRating: null,
      easeRating: null,
      timeEstimateValue: 3,
      timeEstimateUnit: 'days'
    },
    {
      id: '7',
      task: 'Plan Spring Project',
      domain: 'Teaching', scope: 'Professional',
      subcategory: 'Intro to Engineering',
      isUrgent: false,
      isNecessary: true,
      rank: 2,
      assignedDate: '2025-01-21',
      dueDate: '2025-02-10',
      completedDate: null,
      percentComplete: 20,
      isRecurring: false,
      recurringPattern: 'once',
      notes: 'Research potential topics',
      qualityRating: null,
      easeRating: null,
      timeEstimateValue: 2,
      timeEstimateUnit: 'days'
    },
    {
      id: '8',
      task: 'Browse Course Catalog',
      domain: 'Teaching', scope: 'Professional',
      subcategory: 'PSEII',
      isUrgent: false,
      isNecessary: false,
      rank: 3,
      assignedDate: '2025-01-20',
      dueDate: '2025-02-15',
      completedDate: null,
      percentComplete: 0,
      isRecurring: false,
      recurringPattern: 'once',
      notes: 'Look at elective options',
      qualityRating: null,
      easeRating: null,
      timeEstimateValue: null,
      timeEstimateUnit: 'hours'
    }
  ];

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data from server (single source of truth)
  const [serverOffline, setServerOffline] = useState(false);

  const loadData = async () => {
    try {
      const serverTasks = await apiFetch('/tasks');
      setTasks(Array.isArray(serverTasks) ? serverTasks : []);
      setServerOffline(false);
    } catch (e) {
      setServerOffline(true);
      setIsLoading(false);
      return;
    }

    try {
      const serverSettings = await apiFetch('/settings');
      if (serverSettings) setSettings(serverSettings);
    } catch (e) { /* use defaults */ }

    try {
      const serverBackup = await apiFetch('/backup-metadata');
      if (serverBackup) setBackupMetadata(serverBackup);
    } catch (e) { /* use defaults */ }

    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Load data on mount — and re-load when unlocked after PIN entry
  useEffect(() => {
    if (isUnlocked) {
      loadData();
    }
  }, [isUnlocked]);

  // Global keyboard shortcuts (only after unlock). Skipped when focus is
  // inside an editable field so typing "N" in a task title still works.
  useEffect(() => {
    if (!isUnlocked) return;
    const isEditable = (el) => {
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };
    const handler = (e) => {
      // Ctrl+K / Cmd+K — toggle search palette (fires even from inputs).
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowSearch(s => !s);
        return;
      }
      // Plain single-key shortcuts: skip if user is typing in a field.
      if (isEditable(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Skip N when any modal/overlay is already open — avoids stacking.
      const anyOverlay = showForm || showSettings || showShortcuts
                      || showSearch || showCompletionModal || showInfo;
      if (e.key === 'n' || e.key === 'N') {
        if (anyOverlay) return;
        e.preventDefault();
        setEditingTask(null);
        setShowForm(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isUnlocked, showForm, showSettings, showShortcuts, showSearch, showCompletionModal, showInfo]);

  // Save tasks to server when they change
  useEffect(() => {
    if (!isLoading && !serverOffline) {
      const saveData = async () => {
        try {
          await apiPost('/tasks', tasks);
        } catch (e) {
          console.error('Failed to save tasks:', e);
        }

        const updatedMetadata = {
          ...backupMetadata,
          lastAutoSave: new Date().toISOString()
        };
        setBackupMetadata(updatedMetadata);
        try {
          await apiPost('/backup-metadata', updatedMetadata);
        } catch (e) { /* ignore */ }
      };
      saveData();
    }
  }, [tasks, isLoading]);

  // Save settings to server when they change
  useEffect(() => {
    if (!isLoading && !serverOffline) {
      const saveSettings = async () => {
        try {
          await apiPost('/settings', settings);
        } catch (e) {
          console.error('Failed to save settings:', e);
        }
      };
      saveSettings();
    }
  }, [settings, isLoading]);

  // Check for backup reminder
  useEffect(() => {
    if (!isLoading && backupMetadata.lastExport) {
      const daysSinceExport = Math.floor(
        (new Date() - new Date(backupMetadata.lastExport)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceExport >= 7 && tasks.length > 0) {
        setShowBackupReminder(true);
      }
    }
  }, [isLoading, backupMetadata.lastExport, tasks.length]);

  const getQuadrant = (task) => {
    if (task.isUrgent && task.isNecessary) return 'do-first';
    if (!task.isUrgent && task.isNecessary) return 'schedule';
    if (task.isUrgent && !task.isNecessary) return 'delegate';
    return 'eliminate';
  };

  const calculatePriority = (task) => {
    const today = new Date();
    const due = new Date(task.dueDate);
    const daysToDue = Math.floor((due - today) / (1000 * 60 * 60 * 24));
    return daysToDue;
  };

  const calculateTaskScore = (task) => {
    // Only calculate for completed tasks
    if (task.percentComplete !== 100 || !task.completedDate) {
      return null;
    }

    // Skip if no due date
    if (!task.dueDate) {
      return null;
    }

    // Skip if assigned date equals due date (would cause division by zero)
    if (task.assignedDate === task.dueDate) {
      return null;
    }

    const assigned = new Date(task.assignedDate).getTime();
    const due = new Date(task.dueDate).getTime();
    const completed = new Date(task.completedDate).getTime();

    const daysAvailable = due - assigned;
    const daysTaken = completed - assigned;

    // Score = (due - completed) / (due - assigned)
    // Positive score = completed early (good)
    // Negative score = completed late (bad)
    // Score close to 1 = completed near start
    // Score close to 0 = completed near due date
    // Score < 0 = completed after due date
    const score = (due - completed) / daysAvailable;

    return score;
  };

  const sortTasks = (tasksToSort) => {
    return [...tasksToSort].sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  };

  const addTask = (taskData) => {
    const newTask = {
      ...taskData,
      id: Date.now().toString(),
      assignedDate: taskData.assignedDate || new Date().toISOString().split('T')[0],
      completedDate: null,
      qualityRating: null,
      easeRating: null
    };
    setTasks([...tasks, newTask]);
    setShowForm(false);
    setEditingTask(null);
  };

  const addMultipleTasks = (tasksArray) => {
    const newTasks = tasksArray.map(taskData => ({
      ...taskData,
      id: Date.now().toString() + Math.random(),
      assignedDate: taskData.assignedDate || new Date().toISOString().split('T')[0],
      completedDate: null,
      qualityRating: null,
      easeRating: null
    }));
    setTasks([...tasks, ...newTasks]);
  };

  const updateTask = (taskData) => {
    setTasks(tasks.map(t => t.id === taskData.id ? taskData : t));
    setShowForm(false);
    setEditingTask(null);
  };

  /* Delete is reversible: instead of a blocking confirm, the task lands in
     deletedTask for ~5s with a fixed-position undo toast. Deleting a second
     task replaces the first (the prior delete becomes permanent). */
  const deleteTask = (taskId) => {
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const removed = tasks[idx];
    setTasks(tasks.filter(t => t.id !== taskId));
    setDeletedTask({ task: removed, index: idx });
  };

  const undoDelete = () => {
    if (!deletedTask) return;
    setTasks(prev => {
      const next = prev.slice();
      const safeIdx = Math.min(deletedTask.index, next.length);
      next.splice(safeIdx, 0, deletedTask.task);
      return next;
    });
    setDeletedTask(null);
  };

  // Auto-dismiss the undo toast after 5 seconds.
  useEffect(() => {
    if (!deletedTask) return;
    const tid = setTimeout(() => setDeletedTask(null), 5000);
    return () => clearTimeout(tid);
  }, [deletedTask]);

  const toggleComplete = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    
    // If marking as incomplete (unchecking), just do it
    if (task.percentComplete === 100) {
      setTasks(tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            percentComplete: 0,
            completedDate: null,
            qualityRating: null,
            easeRating: null
          };
        }
        return t;
      }));
    } else {
      // If marking as complete, show the completion modal
      setCompletingTask(task);
      setShowCompletionModal(true);
    }
  };

  const confirmCompletion = (taskId, qualityRating, easeRating) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          percentComplete: 100,
          completedDate: new Date().toISOString().split('T')[0],
          qualityRating,
          easeRating
        };
      }
      return t;
    }));
    setShowCompletionModal(false);
    setCompletingTask(null);
  };

  const exportData = () => {
    const data = JSON.stringify({ tasks, settings }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eisenhower-tasks-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const updatedMetadata = {
      lastExport: new Date().toISOString(),
      exportCount: backupMetadata.exportCount + 1,
      lastAutoSave: backupMetadata.lastAutoSave
    };
    setBackupMetadata(updatedMetadata);
    setShowBackupReminder(false);
    
    try {
      localStorage.setItem('eisenhower-backup-metadata', JSON.stringify(updatedMetadata));
    } catch (e) {
      console.error('Failed to save backup metadata:', e);
    }
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.tasks) setTasks(data.tasks);
          if (data.settings) setSettings(data.settings);
          alert(`Successfully imported ${data.tasks?.length || 0} tasks!`);
        } catch (error) {
          alert('Invalid file format. Please select a valid JSON export file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const getStats = () => {
    const active = tasks.filter(t => t.percentComplete < 100);
    const completed = tasks.filter(t => t.percentComplete === 100);
    const overdue = active.filter(t => calculatePriority(t) < 0);
    const dueToday = active.filter(t => calculatePriority(t) === 0);
    
    const byQuadrant = {
      'do-first': active.filter(t => getQuadrant(t) === 'do-first').length,
      'schedule': active.filter(t => getQuadrant(t) === 'schedule').length,
      'delegate': active.filter(t => getQuadrant(t) === 'delegate').length,
      'eliminate': active.filter(t => getQuadrant(t) === 'eliminate').length
    };

    const byRecurrence = {
      once: tasks.filter(t => t.recurringPattern === 'once').length,
      daily: tasks.filter(t => t.recurringPattern === 'daily').length,
      weekly: tasks.filter(t => t.recurringPattern === 'weekly').length,
      monthly: tasks.filter(t => t.recurringPattern === 'monthly').length,
      yearly: tasks.filter(t => t.recurringPattern === 'yearly').length
    };

    return { active, completed, overdue, dueToday, byQuadrant, byRecurrence };
  };

  const stats = getStats();

  const getDaysSinceExport = () => {
    if (!backupMetadata.lastExport) return null;
    return Math.floor((new Date() - new Date(backupMetadata.lastExport)) / (1000 * 60 * 60 * 24));
  };

  // Show PIN modal if not unlocked (must be before loading check)
  if (!isUnlocked) {
    // PHASE 2: cinematic BootOverlay. PIN validated inside the overlay
    // (constant in BootOverlay.jsx); onUnlock fires after the scan-line
    // sweep completes.
    // We pre-set justUnlocked + appRevealed so the v2 etm-reveal-animate
    // (hazard-stripe slide-up) does NOT re-trigger after the cinematic
    // boot ceremony — one entrance moment is enough.
    return <BootOverlay onUnlock={() => {
      setIsUnlocked(true);
      setJustUnlocked(true);
      setAppRevealed(true);
    }} />;
  }

  if (serverOffline) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
          <span className="cin-led cin-led--crit cin-led--pulse" style={{ width: 12, height: 12 }} />
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--crit)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            textShadow: '0 0 10px var(--crit-glow)'
          }}>Server Offline</div>
          <div style={{
            color: 'rgba(180, 180, 180, 0.65)',
            fontSize: '11px',
            maxWidth: '280px',
            lineHeight: 1.5,
            fontFamily: "'Inter', sans-serif"
          }}>
            ETM server is not reachable. Ensure the server is running and you are connected to Tailscale.
          </div>
          <button
            className="cin-btn cin-btn--secondary"
            onClick={() => { setServerOffline(false); setIsLoading(true); loadData(); }}
            style={{ marginTop: '6px' }}
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !justUnlocked) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--cin-gold)',
          letterSpacing: '0.30em',
          textTransform: 'uppercase',
          textShadow: '0 0 10px var(--cin-gold-glow)'
        }}>Initializing</div>
      </div>
    );
  }

  return (
    // PHASE 2: etm-reveal-start / etm-reveal-animate conditionals removed.
    // The cinematic BootOverlay scan-line is the new entrance ceremony;
    // firing the v2 slide-up + hazard-stripe afterwards was redundant.
    // The keyframes definitions in the inline <style> below are now inert
    // (kept for one cycle in case we want to restore them); they'll be
    // cleaned up in a future polish pass.
    <div className="h-screen flex flex-col text-[#c8d0e0] overflow-hidden" style={{
      fontFamily: "'Inter', system-ui, sans-serif",
      // PHASE 1 (Cinematic foundation): was a solid radial-gradient bg
      // (#1a2024 → #0a0e12 → #040608). Removed so the cinematic banner
      // backdrop (body::before in index.css) shows through the gaps
      // between the etm-* chrome. v2 components keep their own
      // backgrounds and render normally on top of the new atmosphere.
      background: 'transparent',
      // PHASE 2: cleared the cinematic chrome row at the top.
      // PHASE 4 finale: cleared the cinematic action bar at the bottom.
      // PHASE 5 polish: readout bar is fixed-positioned (top:5rem) so
      // paddingTop needs to clear chrome AND the readout bar. Readout bar
      // bottom is at ~7.2rem (top:5rem + ~2.2rem rendered height with
      // padding + border). paddingTop is set to JUST clear it (no extra
      // breathing) so the workspace's margin-top alone controls the
      // visible gap. The workspace then uses `margin-top: 0.9rem` to
      // match the inter-Q cin-matrix-grid gap exactly. See cinematic.css.
      paddingTop: '7.2rem',
      paddingBottom: '3.6rem'
    }}>
      {/* PHASE 1: SVG film-grain layer — see `.cin-grain` in index.css.
          position: fixed escapes this stacking context; mix-blend-mode:
          overlay textures the cinematic atmosphere visible through any
          transparent area in the v2 chrome. */}
      <div className="cin-grain" aria-hidden="true" />

      {/* PHASE 2: cinematic chrome row (PEIRASTES wordmark / instrument
          title / action buttons / corner ticks). Fixed-positioned at the
          top of the viewport so it overlays the etm-readout-strip beneath.
          The etm-readout-strip needs ~4.5rem of breathing room from the
          viewport top to clear the chrome — handled by the wrapper below. */}
      <CinematicChrome
        title="Eisenhower Task Manager"
        sub="Operations — Task Prioritization Console"
        crew="Critical · Strategic · Delegate · Eliminate"
        version="v3.0"
        onInfo={() => setShowInfo(true)}
        onSettings={() => setShowSettings(true)}
      />

      {/* PHASE 5 cleanup: removed etm-reveal-* keyframes (retired in
          Phase 2 when the cinematic scan-line took over the entrance).
          Phase 5 finale also removed TaskCard, so the .priority-badge
          utility class is no longer used either — the inline <style>
          tag is now empty and can be deleted entirely if desired. */}

      {/* === CONTROL PANEL LAYOUT: readouts → screens → controls === */}

      {/* PHASE 3: Cinematic readout bar — acrylic glass, bare colored
          numbers for Q1-Q4 (no text labels — LED + color encodes
          identity), text labels preserved on Overdue/Today (temporal
          state, not quadrant identity), Mk-III nameplate at right.
          Q1='do-first', Q2='schedule', Q3='delegate', Q4='eliminate'.
          NOTE: the `env(safe-area-inset-top)` inline paddingTop was
          removed here — it was a leftover from when this strip sat at
          the very top of the viewport. With the chrome row above, the
          notch is already cleared by .cin-flank's top inset; keeping it
          here was overriding the symmetric 0.5rem CSS padding and
          pushing the cell content to the top of the bar on desktop. */}
      <div className="readout-bar">
        <div className="readout-group">
          {[
            { qid: 'q1', valKey: 'do-first'   },
            { qid: 'q2', valKey: 'schedule'   },
            { qid: 'q3', valKey: 'delegate'   },
            { qid: 'q4', valKey: 'eliminate'  },
          ].map(r => (
            <div key={r.qid} className="readout-cell readout-cell--quad">
              <span className={`cin-led cin-led--${r.qid}`} />
              <div className={`readout-cell__value readout-cell__value--${r.qid}`}>{stats.byQuadrant[r.valKey] ?? 0}</div>
            </div>
          ))}
        </div>
        <div className="readout-group">
          {stats.overdue.length > 0 && (
            <div className="readout-cell">
              <div className="readout-cell__label"><span className="cin-led cin-led--crit cin-led--pulse" /> Overdue</div>
              <div className="readout-cell__value readout-cell__value--crit">{stats.overdue.length}</div>
            </div>
          )}
          {stats.dueToday.length > 0 && (
            <div className="readout-cell">
              <div className="readout-cell__label"><span className="cin-led cin-led--warn cin-led--pulse" /> Today</div>
              <div className="readout-cell__value readout-cell__value--warn">{stats.dueToday.length}</div>
            </div>
          )}
          <div className="hidden sm:block cin-nameplate">Peirastes Mk-III</div>
        </div>
      </div>

      {/* Middle: Main Content — fills viewport between readouts and control bar */}
      {/* PHASE 5 polish: removed `max-w-7xl mx-auto px-* py-2` from <main>.
          Those Tailwind classes constrained the workspace to 1280px wide,
          centered, with extra horizontal padding — so on wide screens the
          Q-panels were narrower than the readout bar + action bar (which
          use 1.6rem viewport margins). Letting <main> fill the flex
          column means the workspace's own `margin: 0 1.6rem` is the only
          horizontal inset, matching both bars exactly. */}
      <main className="flex-1 min-h-0 w-full h-full">
        {/* key={view} forces remount on view swap so the fade keyframe
            on .cin-view-swap fires each time. */}
        <div className="cin-view-swap" key={view}>
        {view === 'matrix' ? (
          <MatrixView
            tasks={tasks}
            getQuadrant={getQuadrant}
            sortTasks={sortTasks}
            calculatePriority={calculatePriority}
            toggleComplete={toggleComplete}
            setEditingTask={setEditingTask}
            setShowForm={setShowForm}
            deleteTask={deleteTask}
            calculateTaskScore={calculateTaskScore}
          />
        ) : view === 'list' ? (
          /* PHASE 4b: each view renders its own .cin-view-panel internally
             with a custom header (filters, month nav, etc. inline). */
          <ListView
            tasks={tasks} filters={filters} setFilters={setFilters}
            sortBy={sortBy} setSortBy={setSortBy} getQuadrant={getQuadrant}
            calculatePriority={calculatePriority} toggleComplete={toggleComplete}
            setEditingTask={setEditingTask} setShowForm={setShowForm}
            deleteTask={deleteTask} calculateTaskScore={calculateTaskScore}
            settings={settings} setSettings={setSettings}
          />
        ) : view === 'gantt' ? (
          <GanttView
            tasks={tasks} getQuadrant={getQuadrant}
            calculatePriority={calculatePriority} toggleComplete={toggleComplete}
            setEditingTask={setEditingTask} setShowForm={setShowForm}
            deleteTask={deleteTask} settings={settings}
          />
        ) : view === 'calendar' ? (
          <CalendarView
            tasks={tasks} filters={filters} setFilters={setFilters}
            getQuadrant={getQuadrant} calculatePriority={calculatePriority}
            toggleComplete={toggleComplete} setEditingTask={setEditingTask}
            setShowForm={setShowForm} deleteTask={deleteTask}
            setDefaultDueDate={setDefaultDueDate} settings={settings}
          />
        ) : view === 'bridge' ? (
          <BridgeView
            tasks={tasks} getQuadrant={getQuadrant}
            setEditingTask={setEditingTask} setShowForm={setShowForm}
            settings={settings}
          />
        ) : (
          <AnalyticsView
            tasks={tasks} calculateTaskScore={calculateTaskScore}
          />
        )}
        </div>
      </main>

      {/* PHASE 4 finale: cinematic action bar (replaces v2 chassis footer).
          Centered floating glass strip at the bottom. View tabs in the
          middle, Add Task amber button, utility cluster (Export / Import
          / Refresh) on the right. The v2 footer's stats block (active /
          done counts) is dropped here — the same numbers are already
          implicit in the top readout bar's Q1-Q4 counts. */}
      <div className="cin-action-bar">
        <div className="cin-view-tabs" role="tablist">
          {[
            { key: 'matrix',    icon: LayoutGrid,  label: 'Matrix' },
            { key: 'list',      icon: List,        label: 'List' },
            { key: 'gantt',     icon: BarChart3,   label: 'Gantt' },
            { key: 'calendar',  icon: Calendar,    label: 'Calendar' },
            { key: 'bridge',    icon: Compass,     label: 'Bridge' },
            { key: 'analytics', icon: TrendingUp,  label: 'Analytics' }
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              className={`cin-view-tab ${view === key ? 'on' : ''}`}
              onClick={() => setView(key)}
              role="tab"
              aria-selected={view === key}
            >
              <span className="cin-view-tab__glyph"><Icon size={13} /></span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="cin-action-bar__divider" />

        <button
          className="cin-add-task"
          onClick={() => { setEditingTask(null); setShowForm(true); }}
          title="Add new task"
        >
          <span className="cin-add-task__glyph"><Plus size={14} strokeWidth={2.5} /></span>
          <span>Add Task</span>
        </button>

        <div className="cin-action-bar__divider" />

        <div className="cin-utility-cluster">
          <button
            className="cin-utility-btn"
            onClick={exportData}
            title="Export data"
            aria-label="Export"
          ><Download size={13} /></button>
          <label className="cin-utility-btn" title="Import data" style={{ cursor: 'pointer' }}>
            <Upload size={13} />
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
          </label>
          <button
            className="cin-utility-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw size={13} className={isRefreshing ? 'cin-utility-btn--spin' : ''} />
          </button>
        </div>
      </div>

      {/* PHASE 5: Backup reminder toast — cinematic acrylic glass.
          Floats bottom-right above the action bar. Amber left edge
          signals the warning state without shouting. */}
      {showBackupReminder && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(1.6rem + 50px)',
          right: '1.6rem',
          zIndex: 60,
          padding: '10px 12px',
          maxWidth: '260px',
          background: 'var(--glass-bg-deep)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: '1px solid var(--glass-border)',
          borderLeft: '2px solid var(--cin-gold)',
          borderRadius: '4px',
          boxShadow: 'var(--glass-shadow)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.62rem',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--cin-gold)',
            textShadow: '0 0 6px var(--cin-gold-glow)'
          }}>
            <Shield size={12} /> Backup · {getDaysSinceExport()}d since last export
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button className="cin-btn cin-btn--primary" style={{ padding: '3px 10px', fontSize: '10px' }} onClick={exportData}>Export</button>
            <button className="cin-btn cin-btn--secondary" style={{ padding: '3px 10px', fontSize: '10px' }} onClick={() => setShowBackupReminder(false)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Info / About modal (Info glyph button) */}
      {showInfo && (
        <InfoModal
          version="v3.0"
          backupMetadata={backupMetadata}
          onShowShortcuts={() => setShowShortcuts(true)}
          onClose={() => setShowInfo(false)}
        />
      )}

      {/* Settings modal (cog button) */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          setSettings={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Keyboard shortcut help (?) */}
      {showShortcuts && (
        <ShortcutHelp onClose={() => setShowShortcuts(false)} />
      )}

      {/* Undo-on-delete toast */}
      {deletedTask && (
        <UndoToast task={deletedTask.task} onUndo={undoDelete} />
      )}

      {/* Ctrl+K search palette */}
      {showSearch && (
        <SearchPalette
          tasks={tasks}
          getQuadrant={getQuadrant}
          onClose={() => setShowSearch(false)}
          onSelectTask={(t) => {
            setShowSearch(false);
            setEditingTask(t);
            setShowForm(true);
          }}
        />
      )}

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          defaultDueDate={defaultDueDate}
          onSave={editingTask ? updateTask : addTask}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
            setDefaultDueDate('');
          }}
          settings={settings}
        />
      )}

      {/* Completion Verification Modal */}
      {showCompletionModal && completingTask && (
        <CompletionModal
          task={completingTask}
          onConfirm={confirmCompletion}
          onCancel={() => {
            setShowCompletionModal(false);
            setCompletingTask(null);
          }}
        />
      )}
    </div>
  );
};

const CompletionModal = ({ task, onConfirm, onCancel }) => {
  const [qualityRating, setQualityRating] = useState(null);
  const [easeRating, setEaseRating] = useState(null);

  const handleConfirm = () => {
    if (qualityRating === null || easeRating === null) {
      alert('Please rate both quality and ease before confirming completion.');
      return;
    }
    onConfirm(task.id, qualityRating, easeRating);
  };

  return (
    /* PHASE 5: cinematic completion modal — acrylic glass, Orbitron
       title, cinematic rating dots (green for quality, amber for ease). */
    <div className="cin-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="cin-modal">
        <div className="cin-modal__head">
          <div className="cin-modal__title">Complete Task</div>
          <button className="cin-modal__close" onClick={onCancel} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="cin-modal__body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Task summary */}
            <div className="cin-field">
              <label className="cin-field__label">Task</label>
              <div style={{
                padding: '10px 12px',
                background: 'rgba(8, 12, 18, 0.38)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '3px'
              }}>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: 'rgba(232, 232, 232, 0.92)',
                  fontWeight: 500
                }}>{task.task}</div>
                {task.subcategory && (
                  <div style={{
                    marginTop: '3px',
                    fontFamily: 'Share Tech Mono, monospace',
                    fontSize: '10px',
                    letterSpacing: '0.06em',
                    color: 'rgba(180, 180, 180, 0.55)'
                  }}>{task.subcategory}</div>
                )}
              </div>
            </div>

            {/* Quality rating (green) */}
            <div className="cin-rating-row">
              <div className="cin-rating-row__label">How well did you complete this task?</div>
              <div className="cin-rating-dots">
                {[1,2,3,4,5].map(d => (
                  <button
                    key={d}
                    type="button"
                    className={'cin-rating-dot' + (qualityRating !== null && qualityRating >= d ? ' cin-rating-dot--lit-green' : '')}
                    onClick={() => setQualityRating(d)}
                    aria-label={`Rate quality ${d} of 5`}
                  />
                ))}
              </div>
              <div className="cin-rating-row__caption">
                {qualityRating === null ? 'Click to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][qualityRating]}
              </div>
            </div>

            {/* Ease rating (amber) */}
            <div className="cin-rating-row">
              <div className="cin-rating-row__label">How easy/difficult was this task?</div>
              <div className="cin-rating-dots">
                {[1,2,3,4,5].map(d => (
                  <button
                    key={d}
                    type="button"
                    className={'cin-rating-dot' + (easeRating !== null && easeRating >= d ? ' cin-rating-dot--lit-amber' : '')}
                    onClick={() => setEaseRating(d)}
                    aria-label={`Rate ease ${d} of 5`}
                  />
                ))}
              </div>
              <div className="cin-rating-row__caption">
                {easeRating === null ? 'Click to rate' : ['', 'Very Difficult', 'Difficult', 'Moderate', 'Easy', 'Very Easy'][easeRating]}
              </div>
            </div>

            {/* Help text */}
            <div className="cin-field__hint" style={{
              padding: '8px 10px',
              background: 'rgba(8, 12, 18, 0.32)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '3px',
              fontSize: '10px',
              letterSpacing: '0.04em',
              color: 'rgba(180,180,180,0.65)',
              lineHeight: 1.5
            }}>
              <strong style={{ color: 'rgba(232,232,232,0.92)' }}>Quality:</strong> Your satisfaction with the result.<br/>
              <strong style={{ color: 'rgba(232,232,232,0.92)' }}>Ease:</strong> How smooth the process was (5 = very easy · 1 = very difficult).
            </div>

          </div>
        </div>

        <div className="cin-modal__footer">
          <button type="button" className="cin-btn cin-btn--secondary" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className="cin-btn cin-btn--primary"
            onClick={handleConfirm}
            disabled={qualityRating === null || easeRating === null}
            style={{
              opacity: (qualityRating === null || easeRating === null) ? 0.5 : 1,
              cursor: (qualityRating === null || easeRating === null) ? 'not-allowed' : 'pointer'
            }}
          >
            <CheckCircle size={14} />
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
};

const MatrixView = ({ tasks, getQuadrant, sortTasks, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, calculateTaskScore }) => {
  const [activeTab, setActiveTab] = useState('do-first');
  const activeTasks = tasks.filter(t => t.percentComplete < 100);

  /* PHASE 5+ sweep: dropped legacy v2 properties from the quadrants
     array (screenClass / monitorClass / textColor / tabColor / ledClass
     / label / subtitle) — none had callers after the matrix view was
     ported to MatrixTask + .quad-panel + .cin-led. Kept the cinematic
     props (qid / designation / cinSub) plus title / shortTitle which
     the mobile tab bar reads. */
  const quadrants = [
    { id: 'do-first',  title: 'DO FIRST',  shortTitle: 'Do First',  qid: 'q1', designation: 'Q1 · Critical',  cinSub: 'Urgent · Necessary' },
    { id: 'schedule',  title: 'SCHEDULE',  shortTitle: 'Schedule',  qid: 'q2', designation: 'Q2 · Strategic', cinSub: 'Not Urgent · Necessary' },
    { id: 'delegate',  title: 'DELEGATE',  shortTitle: 'Delegate',  qid: 'q3', designation: 'Q3 · Delegate',  cinSub: 'Urgent · Not Necessary' },
    { id: 'eliminate', title: 'ELIMINATE', shortTitle: 'Eliminate', qid: 'q4', designation: 'Q4 · Eliminate', cinSub: 'Not Urgent · Not Necessary' }
  ];

  // Count tasks per quadrant for tab badges
  const quadrantCounts = {};
  for (const q of quadrants) {
    quadrantCounts[q.id] = activeTasks.filter(t => getQuadrant(t) === q.id).length;
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* PHASE 5 finale — cinematic mobile matrix.
          Tab bar with per-quadrant LED + count, active tab gets the
          chromatic left edge + glow in its quadrant hue. Below it,
          a single .quad-panel for the selected quadrant with the same
          MatrixTask rows the desktop grid uses. */}
      <div className="cin-mobile-tabs">
        {quadrants.map((q) => (
          <button
            key={q.id}
            onClick={() => setActiveTab(q.id)}
            className={`cin-mobile-tab cin-mobile-tab--${q.qid}${activeTab === q.id ? ' on' : ''}`}
            aria-pressed={activeTab === q.id}
          >
            <span className="cin-mobile-tab__label">{q.shortTitle}</span>
            <span className="cin-mobile-tab__count">{quadrantCounts[q.id]}</span>
          </button>
        ))}
      </div>

      <div className="cin-mobile-matrix">
        {quadrants.filter(q => q.id === activeTab).map((quadrant) => {
          const quadrantTasks = sortTasks(activeTasks.filter(t => getQuadrant(t) === quadrant.id));
          return (
            <div key={quadrant.id} className={`quad-panel quad-panel--${quadrant.qid}`} style={{ height: '100%' }}>
              <div className="quad-panel__head">
                <div className="quad-panel__designation">
                  <span className={`cin-led cin-led--${quadrant.qid}`} /> {quadrant.designation}
                </div>
                <div className="quad-panel__sub">{quadrant.cinSub}</div>
                <div className="quad-panel__count">{quadrantTasks.length}</div>
              </div>
              {quadrantTasks.length === 0 ? (
                <div className="quad-panel__empty">— No tasks —</div>
              ) : (
                <div className="cin-task-list">
                  {quadrantTasks.map((task) => (
                    <MatrixTask
                      key={task.id}
                      task={task}
                      qid={quadrant.qid}
                      calculatePriority={calculatePriority}
                      toggleComplete={toggleComplete}
                      onClick={() => {
                        setEditingTask(task);
                        setShowForm(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PHASE 3: Desktop matrix — acrylic-glass quad-panels in the
          cinematic .cin-workspace. Replaces the v2 CRT monitor array
          (hood/bezel/rivets/well/glass/scanlines). Per-panel chromatic
          edge + hue wash matches the demo. Task rows are MatrixTask
          (click-to-edit). */}
      <div className="hidden md:flex cin-workspace">
        <div className="cin-matrix-grid">
          {quadrants.map((quadrant) => {
            const quadrantTasks = sortTasks(activeTasks.filter(t => getQuadrant(t) === quadrant.id));
            const qid = quadrant.qid;   // 'q1' | 'q2' | 'q3' | 'q4'
            return (
              <div key={quadrant.id} className={`quad-panel quad-panel--${qid}`}>
                <div className="quad-panel__head">
                  <div className="quad-panel__designation">
                    <span className={`cin-led cin-led--${qid}`} /> {quadrant.designation}
                  </div>
                  <div className="quad-panel__sub">{quadrant.cinSub}</div>
                  <div className="quad-panel__count">{quadrantTasks.length}</div>
                </div>
                {quadrantTasks.length === 0 ? (
                  <div className="quad-panel__empty">— No tasks —</div>
                ) : (
                  <div className="cin-task-list">
                    {quadrantTasks.map((task) => (
                      <MatrixTask
                        key={task.id}
                        task={task}
                        qid={qid}
                        calculatePriority={calculatePriority}
                        toggleComplete={toggleComplete}
                        onClick={() => {
                          setEditingTask(task);
                          setShowForm(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * PHASE 3: MatrixTask — cinematic task row for the desktop matrix view.
 * Click the row → open edit modal (replaces v2's expand/collapse UI).
 * Checkbox toggles completion without bubbling. Hover translates the row
 * 2px right + brightens the border (same interaction vocabulary as the
 * demo's task rows).
 */
const MatrixTask = ({ task, qid, calculatePriority, toggleComplete, onClick }) => {
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

const QID_BY_QUAD = {
  'do-first': 'q1', 'schedule': 'q2', 'delegate': 'q3', 'eliminate': 'q4'
};

/**
 * PHASE 4b: ListView (cinematic). Acrylic-glass full-workspace panel
 * with 4-stop quadrant-rainbow top edge. 5 filter dropdowns + sort in
 * the header. Each task row: colored quadrant stripe + name + project
 * pill + due badge + priority + progress bar. Click row to edit;
 * delete moved into the edit modal (no inline buttons).
 */
const ListView = ({ tasks, filters, setFilters, sortBy, setSortBy, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, calculateTaskScore, settings, setSettings }) => {
  const listMode = settings?.listMode === 'advanced' ? 'advanced' : 'simple';
  const setListMode = (mode) => setSettings(s => ({ ...s, listMode: mode }));
  const filteredTasks = tasks.filter(task => {
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

  const quadrantLabels = {
    'do-first': 'Do First',
    'schedule': 'Schedule',
    'delegate': 'Delegate',
    'eliminate': 'Eliminate'
  };

  const getRecurrenceColor = (pattern) => {
    const colors = {
      once: 'bg-[#1a1e2c] text-[#8899aa]',
      daily: 'bg-[#764ba220] text-[#b794f4]',
      weekly: 'bg-[#667eea20] text-[#818cf8]',
      monthly: 'bg-[#00ccdd20] text-[#6ea8fe]',
      yearly: 'bg-[#33ff6620] text-[#50c878]'
    };
    return colors[pattern] || 'bg-[#1a1e2c] text-[#8899aa]';
  };

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
              const due = dueDisplay(task);
              const rowClass = 'list-row list-row--' + qid
                + (isOverdue ? ' list-row--overdue' : '')
                + (isToday   ? ' list-row--today'   : '')
                + (isDone    ? ' list-row--done'    : '');
              const recur = task.recurringPattern && task.recurringPattern !== 'once'
                ? task.recurringPattern
                : '—';
              return (
                <div
                  key={task.id}
                  className={rowClass}
                  onClick={() => { setEditingTask(task); setShowForm(true); }}
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
                    <div className="list-row__bar-fill" style={{ width: `${task.percentComplete || 0}%` }} />
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

// Old ListView body (mobile cards, table view, recurrence color helper)
// retired in Phase 4b — the cinematic version above handles both desktop
// and mobile via responsive CSS.

const TaskForm = ({ task, defaultDueDate, onSave, onCancel, settings }) => {
  /* Stored task.dueDate is either "YYYY-MM-DD" (no time) or
     "YYYY-MM-DDTHH:MM" (with time). The form edits these as two inputs;
     re-joined on submit. splitDueDate handles both shapes safely. */
  const splitDueDate = (raw) => {
    if (typeof raw !== 'string' || !raw) return { date: '', time: '' };
    if (raw.includes('T')) {
      const [d, t] = raw.split('T');
      return { date: d, time: (t || '').slice(0, 5) };
    }
    return { date: raw, time: '' };
  };
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

  return (
    /* PHASE 5: cinematic acrylic-glass modal — Orbitron title, cyan
       form inputs with cyan-glow focus, gold-check checkboxes,
       cyan-chevron dropdowns, amber primary action button. */
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

// ─── Analytics View ───────────────────────────────────────────────
/**
 * PHASE 4b: AnalyticsView (cinematic). 4 scorecard tiles + 2 horizontal
 * bar charts (Quadrant Load + Domain Distribution) + 30-day completion
 * velocity SVG. v2's chart.js charts are retired in favor of the demo's
 * simpler inline-SVG area chart — the v2 version had more depth but
 * didn't match the cinematic vocabulary.
 */
const AnalyticsView = ({ tasks, calculateTaskScore }) => {
  // ── Stats ──
  const total = tasks.length;
  const completed = tasks.filter(t => t.percentComplete === 100).length;
  const overdue = tasks.filter(t => {
    if (t.percentComplete === 100) return false;
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate); d.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    return d < today;
  }).length;
  const activeForPri = tasks.filter(t => t.percentComplete < 100);
  const avgRank = activeForPri.length === 0
    ? 0
    : activeForPri.reduce((s, t) => s + (t.rank || 5), 0) / activeForPri.length;

  // ── Quadrant breakdown ──
  const getQ = (t) => {
    const u = !!t.isUrgent, n = !!t.isNecessary;
    if (u && n)  return 'do-first';
    if (!u && n) return 'schedule';
    if (u && !n) return 'delegate';
    return 'eliminate';
  };
  const quadCounts = { 'do-first': 0, 'schedule': 0, 'delegate': 0, 'eliminate': 0 };
  tasks.filter(t => t.percentComplete < 100).forEach(t => { quadCounts[getQ(t)]++; });
  const quadMax = Math.max(...Object.values(quadCounts), 1);

  // ── Domain breakdown ──
  const domainCounts = {};
  tasks.filter(t => t.percentComplete < 100).forEach(t => {
    const d = t.domain || 'Other';
    domainCounts[d] = (domainCounts[d] || 0) + 1;
  });
  const domainMax = Math.max(...Object.values(domainCounts), 1);

  // ── Velocity (30-day rolling completions from task.completedDate) ──
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const velocity = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    velocity.push({ date: d, count: 0 });
  }
  tasks.forEach(t => {
    if (!t.completedDate) return;
    const cd = new Date(t.completedDate); cd.setHours(0, 0, 0, 0);
    const offset = Math.round((today - cd) / 86400000);
    if (offset >= 0 && offset <= 29) {
      velocity[29 - offset].count++;
    }
  });
  const completed30d = velocity.reduce((s, d) => s + d.count, 0);

  const Q_LABELS = {
    'do-first':  'Q1 · Critical',
    'schedule':  'Q2 · Strategic',
    'delegate':  'Q3 · Delegate',
    'eliminate': 'Q4 · Eliminate'
  };

  return (
    <div className="cin-view-panel">
      <div className="cin-view-panel__head">
        <div className="cin-view-panel__title">
          Performance · Metrics
          <span className="cin-view-panel__count">{total}</span>
          <span className="cin-view-panel__sub">historical data</span>
        </div>
      </div>

      <div className="cin-view-panel__body analytics-body">
        {/* Scorecards */}
        <div className="score-tiles">
          <div className="score-tile score-tile--total">
            <div className="score-tile__label">Total Tasks</div>
            <div className="score-tile__value">{total}</div>
            <div className="score-tile__sub">All quadrants</div>
          </div>
          <div className="score-tile score-tile--complete">
            <div className="score-tile__label">Completed</div>
            <div className="score-tile__value">{completed}</div>
            <div className="score-tile__sub">{completed30d} closed last 30 days</div>
          </div>
          <div className="score-tile score-tile--overdue">
            <div className="score-tile__label"><span className="cin-led cin-led--crit cin-led--pulse" /> Overdue</div>
            <div className="score-tile__value">{overdue}</div>
            <div className="score-tile__sub">Active · needs triage</div>
          </div>
          <div className="score-tile score-tile--priority">
            <div className="score-tile__label">Avg Rank</div>
            <div className="score-tile__value">{avgRank.toFixed(1)}</div>
            <div className="score-tile__sub">Lower = higher priority</div>
          </div>
        </div>

        {/* Two side-by-side bar charts */}
        <div className="chart-row">
          <div className="chart-card">
            <div className="chart-card__title">
              Quadrant Load
              <span className="chart-card__title-sub">active tasks per quadrant</span>
            </div>
            <div className="hbar-rows">
              {['do-first','schedule','delegate','eliminate'].map(q => {
                const qid = QID_BY_QUAD[q];
                return (
                  <div className="hbar-row" key={q}>
                    <div className="hbar-row__label">{Q_LABELS[q]}</div>
                    <div className="hbar-row__track">
                      <div className={`hbar-row__fill hbar-row__fill--${qid}`} style={{ width: `${(quadCounts[q] / quadMax) * 100}%` }} />
                    </div>
                    <div className="hbar-row__value">{quadCounts[q]}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-card__title">
              Domain Distribution
              <span className="chart-card__title-sub">active tasks per domain</span>
            </div>
            <div className="hbar-rows">
              {Object.entries(domainCounts).sort((a,b) => b[1] - a[1]).map(([dom, count]) => (
                <div className="hbar-row" key={dom}>
                  <div className="hbar-row__label">{dom}</div>
                  <div className="hbar-row__track">
                    <div className="hbar-row__fill hbar-row__fill--neutral" style={{ width: `${(count / domainMax) * 100}%` }} />
                  </div>
                  <div className="hbar-row__value">{count}</div>
                </div>
              ))}
              {Object.keys(domainCounts).length === 0 && (
                <div className="list-empty">— No active tasks —</div>
              )}
            </div>
          </div>
        </div>

        {/* Velocity chart */}
        <div className="chart-card chart-card--wide">
          <div className="chart-card__title">
            Completion Velocity
            <span className="chart-card__title-sub">tasks completed · 30-day window</span>
          </div>
          <VelocityChart data={velocity} />
        </div>
      </div>
    </div>
  );
};

/**
 * PHASE 4b: Inline-SVG smooth-area chart for the velocity widget.
 * Catmull-Rom -> cubic bezier path, amber area gradient fill,
 * today line + today dot. Auto-sizes to its container; re-renders
 * on data change via React. (No resize observer here; the
 * cin-view-panel body is responsive so the SVG just inherits.)
 */
const VelocityChart = ({ data }) => {
  const containerRef = React.useRef(null);
  const [dims, setDims] = React.useState({ w: 600, h: 160 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) {
        setDims({
          w: containerRef.current.clientWidth || 600,
          h: containerRef.current.clientHeight || 160
        });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { w: W, h: H } = dims;
  const PAD_L = 26, PAD_R = 16, PAD_T = 12, PAD_B = 20;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;
  const n = data.length;
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const x = (i) => PAD_L + (i / Math.max(n - 1, 1)) * plotW;
  const y = (v) => PAD_T + plotH - (v / maxCount) * plotH;

  const pts = data.map((d, i) => ({ x: x(i), y: y(d.count) }));

  // Catmull-Rom -> cubic bezier
  let linePath = '';
  if (pts.length > 0) {
    linePath = 'M ' + pts[0].x + ' ' + pts[0].y;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }
  const areaPath = pts.length === 0 ? '' :
    linePath
    + ` L ${pts[pts.length - 1].x} ${PAD_T + plotH}`
    + ` L ${pts[0].x} ${PAD_T + plotH} Z`;

  const xLabels = [
    { i: 0,        text: '30d ago' },
    { i: 15,       text: '15d ago' },
    { i: 22,       text: '7d ago'  },
    { i: 26,       text: '3d ago'  },
    { i: n - 1,    text: 'TODAY', today: true }
  ];
  const ySteps = [
    { v: maxCount, label: maxCount },
    { v: Math.round(maxCount / 2), label: Math.round(maxCount / 2) },
    { v: 0, label: 0 }
  ];

  return (
    <div className="velocity-chart" ref={containerRef}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(255, 174, 32, 0.38)" />
            <stop offset="100%" stopColor="rgba(255, 174, 32, 0.02)" />
          </linearGradient>
        </defs>
        {ySteps.map((s, i) => (
          <g key={i}>
            <line className="velocity-chart__gridline" x1={PAD_L} y1={y(s.v)} x2={W - PAD_R} y2={y(s.v)} />
            <text className="velocity-chart__axis-label" x={PAD_L - 6} y={y(s.v) + 3} textAnchor="end">{s.label}</text>
          </g>
        ))}
        {n > 0 && (
          <>
            <line className="velocity-chart__today-line" x1={x(n - 1)} y1={PAD_T} x2={x(n - 1)} y2={PAD_T + plotH} />
            <path className="velocity-chart__area" d={areaPath} />
            <path className="velocity-chart__line" d={linePath} />
            <circle className="velocity-chart__point" cx={x(n - 1)} cy={y(data[n - 1].count)} r="3" />
          </>
        )}
        {xLabels.map((l, i) => (
          <text
            key={i}
            className={`velocity-chart__axis-label ${l.today ? 'velocity-chart__axis-label--today' : ''}`}
            x={x(l.i)} y={H - 4} textAnchor="middle"
          >{l.text}</text>
        ))}
      </svg>
    </div>
  );
};

/**
 * PHASE 4b: GanttView (cinematic). 21-day timeline window centered on
 * today. Each task with a dueDate appears as a horizontal bar:
 *   - Upcoming: bar runs from today to dueDate (length = time left)
 *   - Overdue: bar runs from dueDate to today, RED (how late)
 *   - Same-day: 1-day pill at the today column
 * Today line in amber, weekends faded, click bar OR label to edit.
 * Filter by quadrant. v2's GanttView had richer interactions (zoom,
 * multi-week, etc.); simplified to match the demo prototype.
 */
const GanttView = ({ tasks, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, settings }) => {
  const [filterQuad, setFilterQuad] = useState('all');
  const scrollRef = React.useRef(null);

  /* Tape-gauge timeline. Pixel-laid-out 7-month tape with NO browser
     scrollbar — the user click-and-drags anywhere on the tape to scrub
     forward/back through time. Plain wheel zooms (anchored on the cursor
     day so the point under the cursor stays under the cursor); Shift+wheel
     scrolls vertically through the task list. Label column sticks to the
     left during scrub; axis sticks to the top during vertical scroll. */
  const WINDOW_BACK  = 30;
  const WINDOW_FWD   = 180;
  const WINDOW_TOTAL = WINDOW_BACK + 1 + WINDOW_FWD;   // 211 days
  const LABEL_WIDTH  = 220;
  const PX_PER_DAY_MIN = 6;
  const PX_PER_DAY_MAX = 80;
  const [pxPerDay, setPxPerDay] = useState(24);
  const TAPE_PX         = WINDOW_TOTAL * pxPerDay;
  const TODAY_OFFSET_PX = WINDOW_BACK * pxPerDay;
  const showMondayLabels = pxPerDay >= 14;   // collapse to month-firsts only when dense

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayOffset = (d) => {
    const dd = new Date(d); dd.setHours(0,0,0,0);
    return Math.round((dd - today) / 86400000);
  };

  const visible = tasks.filter(t => {
    if (t.percentComplete === 100) return false;
    if (!t.dueDate) return false;
    if (filterQuad !== 'all' && getQuadrant(t) !== filterQuad) return false;
    const off = dayOffset(t.dueDate, t.dueTime);
    return off >= -WINDOW_BACK && off <= WINDOW_FWD;
  }).sort((a, b) => dayOffset(a.dueDate, a.dueTime) - dayOffset(b.dueDate, b.dueTime));

  const scrollToToday = React.useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    const todayLeft = LABEL_WIDTH + TODAY_OFFSET_PX;
    const target = Math.max(0, todayLeft - el.clientWidth * 0.25);
    if (smooth) el.scrollTo({ left: target, behavior: 'smooth' });
    else        el.scrollLeft = target;
  }, [LABEL_WIDTH, TODAY_OFFSET_PX]);

  /* Anchor on today on initial mount only. Depending on scrollToToday here
     would re-fire after every wheel zoom (its useCallback identity changes
     with pxPerDay), which would override the cursor-anchored zoom correction
     below with a snap back to today. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { scrollToToday(false); }, []);

  /* Wheel zoom. React's onWheel is passive — to call preventDefault and
     keep the page from scrolling we attach via addEventListener with
     { passive: false }. Anchor: the day under the cursor must stay under
     the cursor across the zoom. We capture the anchor here, commit the
     new pxPerDay via setState, then a useLayoutEffect on [pxPerDay] reads
     the anchor and corrects scrollLeft before the browser paints. */
  const zoomAnchorRef = React.useRef(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = (e) => {
      // Shift+wheel routes through to vertical scroll (task list).
      if (e.shiftKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorXInViewport = e.clientX - rect.left;
      const cursorXInTape = cursorXInViewport + el.scrollLeft - LABEL_WIDTH;
      const cursorDay = cursorXInTape / pxPerDay;
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      const next = Math.max(PX_PER_DAY_MIN, Math.min(PX_PER_DAY_MAX, pxPerDay * factor));
      if (next === pxPerDay) return;          // at clamp boundary
      zoomAnchorRef.current = { cursorDay, cursorXInViewport };
      setPxPerDay(next);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [pxPerDay, LABEL_WIDTH]);

  // Cursor-anchored zoom correction. Runs synchronously after pxPerDay
  // commits, before the browser paints — so the zoom feels "around the
  // cursor" with no visible jump.
  React.useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current;
    if (!anchor || !scrollRef.current) return;
    zoomAnchorRef.current = null;
    const el = scrollRef.current;
    const newCursorXInTape = anchor.cursorDay * pxPerDay;
    el.scrollLeft = Math.max(0, newCursorXInTape + LABEL_WIDTH - anchor.cursorXInViewport);
  }, [pxPerDay, LABEL_WIDTH]);

  /* Click-and-drag scrub. Pointer capture so the cursor can leave the tape
     and the drag still tracks. justDragged ref + click-capture handler
     suppresses the synthetic click that follows a drag — otherwise releasing
     after a slide-onto-a-bar would open the task editor. */
  const dragState  = React.useRef({ active: false, startX: 0, startScroll: 0, moved: false });
  const justDragged = React.useRef(false);

  const onPointerDown = (e) => {
    if (!scrollRef.current) return;
    if (e.button !== undefined && e.button !== 0) return;   // left button only
    dragState.current = {
      active: true,
      startX: e.clientX,
      startScroll: scrollRef.current.scrollLeft,
      moved: false
    };
    scrollRef.current.style.cursor = 'grabbing';
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onPointerMove = (e) => {
    const s = dragState.current;
    if (!s.active || !scrollRef.current) return;
    const dx = e.clientX - s.startX;
    if (Math.abs(dx) > 4) s.moved = true;
    scrollRef.current.scrollLeft = s.startScroll - dx;
  };
  const onPointerUp = (e) => {
    const s = dragState.current;
    if (!s.active) return;
    justDragged.current = s.moved;
    dragState.current.active = false;
    if (scrollRef.current) scrollRef.current.style.cursor = '';
    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    // Clear the suppress flag after the trailing click (if any) has fired.
    setTimeout(() => { justDragged.current = false; }, 0);
  };
  const onClickCapture = (e) => {
    if (justDragged.current) { e.stopPropagation(); e.preventDefault(); }
  };

  const MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const axisDays = [];
  for (let i = -WINDOW_BACK; i <= WINDOW_FWD; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const dow = d.getDay();
    const isMonthStart = d.getDate() === 1;
    const isToday = i === 0;
    /* Clean minimal demarcation: TODAY chip, month abbreviation on the 1st,
       bare day-number on every Monday. All other days carry a tick only
       (drawn by the per-day axis gradient). Weekends get a subtle wash. */
    let majorText = null;
    if (isToday)                              majorText = 'TODAY';
    else if (isMonthStart)                    majorText = MONTH_ABBR[d.getMonth()];
    else if (dow === 1 && showMondayLabels)   majorText = String(d.getDate());
    axisDays.push({ i, majorText, isToday, isWeekend: dow === 0 || dow === 6, isMonthStart });
  }

  return (
    <div className="cin-view-panel">
      <div className="cin-view-panel__head">
        <div className="cin-view-panel__title">
          Schedule · Timeline
          <span className="cin-view-panel__count">{visible.length}</span>
          <span className="cin-view-panel__sub">drag to scrub · wheel to zoom · {WINDOW_BACK}d ← today → {WINDOW_FWD}d</span>
        </div>
        <div className="cin-view-panel__toolbar">
          <button
            type="button"
            className="cin-btn cin-btn--secondary"
            onClick={() => scrollToToday(true)}
            title="Recenter on today"
          >Today</button>
          <div className="cin-filter">
            <label className="cin-filter__label">Quadrant</label>
            <select value={filterQuad} onChange={(e) => setFilterQuad(e.target.value)}>
              <option value="all">All</option>
              <option value="do-first">Q1 · Critical</option>
              <option value="schedule">Q2 · Strategic</option>
              <option value="delegate">Q3 · Delegate</option>
              <option value="eliminate">Q4 · Eliminate</option>
            </select>
          </div>
        </div>
      </div>

      <div className="gantt-narrow-notice">
        Gantt requires a wider viewport — rotate or use the List view
      </div>

      <div className="cin-view-panel__body" style={{ overflow: 'hidden', padding: 0 }}>
        <div
          className="gantt-tape"
          ref={scrollRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={onClickCapture}
        >
          <div
            className="gantt-tape__inner"
            style={{
              '--tape-px':  `${TAPE_PX}px`,
              '--day-px':   `${pxPerDay}px`,
              '--label-px': `${LABEL_WIDTH}px`
            }}
          >
            {/* Axis row */}
            <div className="gantt-axis-tape__spacer" />
            <div className="gantt-axis-tape__days">
              {axisDays.map(d => (
                <div
                  key={d.i}
                  className={'gantt-axis-tape__day'
                    + (d.isToday      ? ' is-today'       : '')
                    + (d.isWeekend    ? ' is-weekend'     : '')
                    + (d.isMonthStart ? ' is-month-start' : '')}
                >
                  {d.majorText && (
                    <span className="gantt-axis-tape__tick-label">{d.majorText}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Empty state — spans both columns */}
            {visible.length === 0 && (
              <div className="gantt-tape__empty">— No scheduled tasks in this window —</div>
            )}

            {/* Task rows */}
            {visible.map(t => {
              const dueOff = dayOffset(t.dueDate, t.dueTime);
              const isOverdue = dueOff < 0;
              const isDone = t.percentComplete === 100;
              const startOff = isOverdue ? dueOff : 0;
              const endOff   = isOverdue ? 0 : dueOff;
              const leftPx  = (startOff + WINDOW_BACK) * pxPerDay;
              const widthPx = Math.max((endOff - startOff + 1) * pxPerDay, pxPerDay);
              const qid = QID_BY_QUAD[getQuadrant(t)] || 'q4';
              const barClass = 'gantt-bar gantt-bar--' + (isOverdue ? 'overdue' : qid)
                + (isDone ? ' gantt-bar--done' : '');
              const dueDateText = new Date(t.dueDate).toLocaleDateString();
              return (
                <React.Fragment key={t.id}>
                  <div
                    className="gantt-row-tape__label"
                    onClick={() => { setEditingTask(t); setShowForm(true); }}
                  >
                    <div className="gantt-row__label-name" title={t.task}>{t.task}</div>
                    <div className="gantt-row__label-meta">{(t.subcategory || t.domain) + ' · ' + dueDateText}</div>
                  </div>
                  <div className="gantt-row-tape__track">
                    <div
                      className={barClass}
                      style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                      onClick={() => { setEditingTask(t); setShowForm(true); }}
                    >
                      {t.rank ? `R${t.rank}` : ''}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Today line — full-height vertical accent inside the grid;
                positioned in absolute pixels so it scrolls with content. */}
            <div
              className="gantt-today-line-tape"
              style={{ left: `calc(var(--label-px) + ${TODAY_OFFSET_PX}px)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   BRIDGE VIEW — Horizon (forward perspective) + Radar (top-down PPI)
   ═══════════════════════════════════════════════════════════════
   Bridge-of-the-ship metaphor. Tasks approach the present as time
   advances. Two visualizations of the same data:
     • Horizon: lanes converge toward a vanishing point at the
       horizon; tasks ride them inward, perspective-scaled.
     • Radar:  concentric range rings + sectored pie; ship at
       center, tasks at polar coords (r=time, θ=domain sector).
   Lanes = settings.domains. Tasks with unknown / missing domain
   are placed in a fallback "OTHER" lane so nothing is dropped. */

/* Adaptive horizon-distance formatters. Horizon distance is stored as
   fractional days throughout, so anything sub-day reads in hours and
   anything day-or-above reads in days. Long form for milestone arc
   labels (caps), short form for the subtitle status line. */
const formatHorizonLong = (days) => {
  if (days < 1) {
    const h = Math.max(1, Math.round(days * 24));
    return h === 1 ? '1 HOUR' : `${h} HOURS`;
  }
  const d = Math.round(days);
  return d === 1 ? '1 DAY' : `${d} DAYS`;
};
const formatHorizonShort = (days) => {
  if (days < 1) return `${Math.max(1, Math.round(days * 24))}h`;
  return `${Math.round(days)}d`;
};

/* Absolute date/time label for the left side of each range arc. Anchors
   the user to real calendar time while panning. Sub-day granularity prints
   wall-clock time ("14:30"); day-or-coarser prints abbreviated month+day
   ("JUN 13"), with year suffix when the reference crosses into a future
   calendar year ("DEC 25 '27"). */
const BRIDGE_MONTH_ABBR = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const formatAbsolute = (refMs, granularityDays) => {
  const d = new Date(refMs);
  if (granularityDays < 1) {
    const h = d.getHours();
    const m = d.getMinutes();
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
  const month = BRIDGE_MONTH_ABBR[d.getMonth()];
  const day = d.getDate();
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return sameYear
    ? `${month} ${day}`
    : `${month} ${day} '${String(d.getFullYear()).slice(-2)}`;
};

/* Relative-from-ship label for the right side of each calendar-anchored
   grid arc. Auto-collapses to the most readable unit. Mirrors the suffix
   convention but without AHEAD/AGO since position vs. ship is implied
   visually (above ship = future, below = past). */
const formatRelative = (effOff) => {
  if (Math.abs(effOff) < 1/48) return 'NOW';
  const sign = effOff < 0 ? '-' : '';
  const abs = Math.abs(effOff);
  if (abs < 1)   return `${sign}${Math.round(abs * 24)}H`;
  if (abs < 14)  return `${sign}${Math.round(abs)}D`;
  if (abs < 60)  return `${sign}${Math.round(abs / 7)}W`;
  if (abs < 365) return `${sign}${Math.round(abs / 30)}MO`;
  return `${sign}${Math.round(abs / 365)}Y`;
};

/* Ship label adapts to the drag-pan anchor. < 30 min off real-now reads
   as TODAY; otherwise compact mission-ops-style "12H AHEAD" / "3D AGO". */
const formatAnchor = (anchor) => {
  if (Math.abs(anchor) < 1/48) return 'TODAY';
  const abs = Math.abs(anchor);
  const suffix = anchor > 0 ? 'AHEAD' : 'AGO';
  if (abs < 1)   return `${Math.round(abs * 24)}H ${suffix}`;
  if (abs < 14)  return `${Math.round(abs)}D ${suffix}`;
  if (abs < 60)  return `${Math.round(abs / 7)}W ${suffix}`;
  if (abs < 365) return `${Math.round(abs / 30)}MO ${suffix}`;
  return `${Math.round(abs / 365)}Y ${suffix}`;
};

const BridgeView = ({ tasks, getQuadrant, setEditingTask, setShowForm, settings }) => {
  const [mode, setMode] = useState('horizon');
  const [filterQuad, setFilterQuad] = useState('all');
  /* Title-label visibility on the Bridge.
       all        — every task pip labelled
       incomplete — only LIVE tasks labelled (completed pips bare)
       tracked    — only tasks with tracked:true labelled
       none       — no labels at all
     Persisted to localStorage so the choice survives reloads. */
  const [labelMode, setLabelMode] = useState(() => {
    try { return localStorage.getItem('bridge-label-mode') || 'all'; }
    catch { return 'all'; }
  });
  useEffect(() => {
    try { localStorage.setItem('bridge-label-mode', labelMode); } catch {}
  }, [labelMode]);
  /* Horizon distance is wheel-zoomable. State lives here so it survives
     Horizon ↔ Radar toggles. */
  const [horizonDays, setHorizonDays] = useState(90);
  /* Time anchor for Horizon's drag-to-pan. Fractional days from real-now.
     viewAnchor = 0 means the ship sits at "now" (default). Positive =
     ship has sailed forward in time; negative = panned to the past.
     Only applied in Horizon mode. */
  const [viewAnchor, setViewAnchor] = useState(0);

  const RADAR_DAYS   = 180;
  const maxDays = mode === 'horizon' ? horizonDays : RADAR_DAYS;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  /* Fractional days, so the Horizon can resolve below 1d into hours.
     Date-only strings ("YYYY-MM-DD") parse as local midnight; if an
     explicit dueTime ("HH:MM") is supplied, it's folded in to give a
     fractional-day offset. Legacy "YYYY-MM-DDTHH:MM" strings still
     parse correctly via the fallback. */
  const dayOffset = (d, t) => {
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [y, m, day] = d.split('-').map(Number);
      let h = 0, mi = 0;
      if (typeof t === 'string' && /^\d{1,2}:\d{2}/.test(t)) {
        [h, mi] = t.split(':').map(Number);
      }
      return (new Date(y, m - 1, day, h, mi).getTime() - today.getTime()) / 86400000;
    }
    const dd = (typeof d === 'string') ? new Date(d) : d;
    return (dd.getTime() - today.getTime()) / 86400000;
  };

  /* Default lanes — Teaching first-left, Personal first-right. Order
     determines lateral position via the alternating-outward sector
     packer in HorizonScene: lanes[0] = first-left, lanes[1] = first-
     right, lanes[2] = second-left, lanes[3] = second-right, etc. */
  const baseDomains = (settings?.domains && settings.domains.length > 0)
    ? settings.domains
    : ['Teaching', 'Personal'];
  const lanes = baseDomains;
  const laneOf = (t) => {
    const idx = baseDomains.indexOf(t.domain);
    return idx === -1 ? 0 : idx;
  };

  const visible = tasks.filter(t => {
    /* Completed tasks remain visible on the Bridge — they render
       without the ring/blip so the player sees "cleared targets"
       drift past the ship after completion. */
    if (!t.dueDate) return false;
    if (filterQuad !== 'all' && getQuadrant(t) !== filterQuad) return false;
    /* In Horizon mode, the visible window is anchored to viewAnchor —
       so panning forward in time keeps the [-7d, +horizon] window
       relative to the new ship position. */
    let off = dayOffset(t.dueDate, t.dueTime);
    if (mode === 'horizon') off -= viewAnchor;
    return off >= -7 && off <= maxDays;
  });

  /* Click a pip → show a lightweight details popup first. The "Edit"
     button inside the popup hands off to the existing edit form. */
  const [selectedTask, setSelectedTask] = useState(null);
  const onPick = (t) => setSelectedTask(t);
  const handleEditFromDetails = (t) => { setEditingTask(t); setShowForm(true); };

  /* Toggle the task's `tracked` flag via PATCH. Used by the details
     modal so the user can curate the "tracked" label-mode subset. */
  const [trackedVersion, setTrackedVersion] = useState(0); // forces re-render of selectedTask
  const handleToggleTrack = async (t) => {
    const next = !t.tracked;
    try {
      const res = await fetch(`/api/tasks/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracked: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      /* Mutate in place so the visible list reflects it immediately
         without waiting for the parent to refetch. */
      t.tracked = updated.tracked;
      setSelectedTask({ ...t });
      setTrackedVersion(v => v + 1);
    } catch (e) {
      console.error('toggleTrack failed:', e);
    }
  };

  return (
    <div className="cin-view-panel">
      <div className="cin-view-panel__head">
        <div className="cin-view-panel__title">
          Bridge · Navigation
          <span className="cin-view-panel__count">{visible.length}</span>
          <span className="cin-view-panel__sub">
            {mode === 'horizon'
              ? `forward perspective · ${formatHorizonShort(maxDays)} horizon · drag to pan · wheel to zoom`
              : `top-down radar · ${maxDays}d range · click a target to edit`}
          </span>
        </div>
        <div className="cin-view-panel__toolbar">
          {mode === 'horizon' && Math.abs(viewAnchor) >= 1/48 && (
            <button
              type="button"
              className="cin-btn cin-btn--secondary"
              onClick={() => setViewAnchor(0)}
              title="Recenter on now"
            >Recenter</button>
          )}
          <div className="cin-mode-toggle" role="group" aria-label="Bridge mode">
            <button
              type="button"
              className={`cin-mode-toggle__btn ${mode === 'horizon' ? 'is-active' : ''}`}
              onClick={() => setMode('horizon')}
              aria-pressed={mode === 'horizon'}
            >Horizon</button>
            <button
              type="button"
              className={`cin-mode-toggle__btn ${mode === 'radar' ? 'is-active' : ''}`}
              onClick={() => setMode('radar')}
              aria-pressed={mode === 'radar'}
            >Radar</button>
          </div>
          <div className="cin-filter">
            <label className="cin-filter__label">Quadrant</label>
            <select value={filterQuad} onChange={(e) => setFilterQuad(e.target.value)}>
              <option value="all">All</option>
              <option value="do-first">Q1 · Critical</option>
              <option value="schedule">Q2 · Strategic</option>
              <option value="delegate">Q3 · Delegate</option>
              <option value="eliminate">Q4 · Eliminate</option>
            </select>
          </div>
          {mode === 'horizon' && (
            <div className="cin-filter">
              <label className="cin-filter__label">Labels</label>
              <select value={labelMode} onChange={(e) => setLabelMode(e.target.value)}>
                <option value="all">All</option>
                <option value="incomplete">Incomplete</option>
                <option value="tracked">Tracked only</option>
                <option value="none">None</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="cin-view-panel__body" style={{ overflow: 'hidden', display: 'flex' }}>
        {mode === 'horizon' ? (
          <HorizonScene
            tasks={visible} lanes={lanes} laneOf={laneOf}
            dayOffset={dayOffset} maxDays={horizonDays}
            setMaxDays={setHorizonDays}
            viewAnchor={viewAnchor} setViewAnchor={setViewAnchor}
            getQuadrant={getQuadrant} onPick={onPick}
            labelMode={labelMode}
          />
        ) : (
          <RadarScene
            tasks={visible} lanes={lanes} laneOf={laneOf}
            dayOffset={dayOffset} maxDays={RADAR_DAYS}
            getQuadrant={getQuadrant} onPick={onPick}
          />
        )}
      </div>

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          getQuadrant={getQuadrant}
          onEdit={handleEditFromDetails}
          onToggleTrack={handleToggleTrack}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

const HorizonScene = ({ tasks, lanes, laneOf, dayOffset, maxDays, setMaxDays, viewAnchor = 0, setViewAnchor, getQuadrant, onPick, labelMode = 'all' }) => {
  const W = 1000, H = 600;
  const N = lanes.length;
  const svgRef = React.useRef(null);

  /* True 3D sphere projection — latitude/longitude grid model.
     The ship sits on the equator at longitude 0; sphere center at world
     origin; rotation axis is the world Y axis. Ship sails east (toward
     +Z). A camera at altitude H_CAM directly above the ship
     ((R+H_CAM, 0, 0)) is pitched down by BETA to look across the
     visible surface.

     Lanes are LATITUDE lines (small circles parallel to the equator at
     constant world Y) — they DON'T converge at the ship, they run
     roughly parallel near the ship and curve away from each other
     toward the limb.

     Arcs are LONGITUDE lines (great-circle meridians at constant
     longitude east of ship) — each represents a calendar date; they
     run N-S across the visible surface, tilted by their distance east
     of the ship.

     The yellow horizon line is the actual limb of the sphere — the
     circle where the line-of-sight is tangent to the sphere. */
  /* WIREFRAME GLOBE — Google-Earth-style.

     Camera sits at altitude H_CAM directly above the sphere's "ship"
     point and stares straight at the sphere's centre. There is NO
     forward tilt. The limb (horizon) therefore projects to a perfect
     geometric circle centred in the chart, and the sphere reads as a
     proper globe rather than a tilted ground plane.

     World axes:  +X = radial-out at ship (toward camera)
                  +Y = "east" on the globe   (time axis)
                  +Z = "north" on the globe  (lane axis)

     The ship sits at the sub-camera point (lat=0, lon=0). Spinning the
     globe (drag-to-pan) changes viewAnchor, which shifts task longitudes
     and slides them across the visible cap. */
  const R = 100;
  const ALT_MIN = R * 0.15;                                  // ~ surface skim
  const ALT_MAX = R * 20;                                    // ~ deep space
  /* Default camera view — Picture6 framing, pulled back a tad so the
     globe's edges sit inside the chart with a small buffer.
     - cameraAlt = R      ⇒  α_limb = π/3 (60°), LIMB_R_PX ≈ 462.
                              Side buffer (CX − LIMB_R_PX) ≈ 38 px.
     - panY = 240         ⇒  ship at y ≈ 540 (bottom-centre, as before).
                              Top buffer (CY − LIMB_R_PX) ≈ 78 px.
     - panX = 0           ⇒  ship horizontally centred. */
  const [cameraAlt, setCameraAlt] = React.useState(R);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(240);
  const H_CAM = cameraAlt;
  const ALPHA_LIMB = Math.acos(R / (R + H_CAM));             // visible cap angular radius
  const COS_LIMB = Math.cos(ALPHA_LIMB);
  const SCALE = 800;
  /* Each lane occupies one 15° latitude band (one wireframe sector).
     Lanes fill the inner sectors first and step outward alternately
     left↔right, so:
       lane 0 → −7.5°  (first sector LEFT of equator, [−15°, 0°])
       lane 1 → +7.5°  (first sector RIGHT, [0°, +15°])
       lane 2 → −22.5° (second sector LEFT, [−30°, −15°])
       lane 3 → +22.5° (second sector RIGHT)
       … and so on.
     This keeps named lanes near the equator instead of pushing them
     to the visible pole, and aligns each lane's sector to a wireframe
     band — labels always sit at the band's centre. */
  const SECTOR_WIDTH = Math.PI / 12;            // 15°

  /* Alternating-outward sector packing — see SECTOR_WIDTH comment. */
  const laneLat = (i) => {
    const sign = (i % 2 === 0) ? -1 : +1;
    const ring = Math.floor(i / 2);                          // 0, 1, 2, …
    return sign * (ring + 0.5) * SECTOR_WIDTH;
  };

  /* Project a 3D world point to viewBox coords. Camera at
     (R + H_CAM, 0, 0), looking straight toward sphere centre:
        forward = (−1, 0, 0)
        right   = ( 0, 1, 0)   → screen-x = +east = forward in time
        up      = ( 0, 0, 1)   → screen-y = +north = up the lanes
     Forward depth is (R + H_CAM) − Px; on the visible hemisphere this
     is always positive, so visibility is decided by the great-circle
     cap test (cos lat · cos lon ≥ cos α_limb), not by depth sign. */
  const CX = W / 2 + panX, CY = H / 2 + panY;
  const project = (Px, Py, Pz) => {
    const f = (R + H_CAM) - Px;
    if (f < 0.05) return null;
    return {
      x: CX + (Py / f) * SCALE,
      y: CY - (Pz / f) * SCALE
    };
  };
  const projectLatLon = (lat, lon) => {
    const cL = Math.cos(lat);
    return project(R * cL * Math.cos(lon), R * Math.sin(lat), R * cL * Math.sin(lon));
  };
  const isVisible = (lat, lon) => Math.cos(lat) * Math.cos(lon) >= COS_LIMB - 1e-6;

  /* Map (day, lane index) to a viewBox point.
     Day → longitude: maxDays corresponds to ALPHA_LIMB (eastward limb
     at the equator). */
  const dayToLon = (d) => (d / maxDays) * ALPHA_LIMB;

  /* Each lane occupies its own 15° latitude band, centred on laneLat(i).
     This is independent of the other lanes' positions — each lane gets
     a clean sector aligned with the wireframe graticule. */
  const laneSectors = lanes.map((_, i) => {
    const c = laneLat(i);
    return [c - SECTOR_WIDTH / 2, c + SECTOR_WIDTH / 2];
  });

  /* Stable per-task hash for jittering inside a sector. djb2-style. */
  const hashId = (s) => {
    let h = 5381;
    const str = String(s);
    for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    return h;
  };

  /* The (lat, lon) a task occupies. Shared between pip projection and
     dependency-arc rendering so the arc endpoints land on the same
     jittered positions as the pips. */
  const taskLatLon = (d, laneIdx, taskId) => {
    const lon = Math.max(-ALPHA_LIMB, Math.min(ALPHA_LIMB, dayToLon(d)));
    const [lo, hi] = laneSectors[laneIdx] || [-ALPHA_LIMB, ALPHA_LIMB];
    const c = (lo + hi) / 2;
    const halfW = (hi - lo) / 2;
    const norm = (hashId(taskId) % 1000) / 1000 - 0.5;
    const lat = c + norm * halfW * 1.2;
    return { lat, lon };
  };
  const dayLaneToXY = (d, laneIdx, taskId) => {
    const { lat, lon } = taskLatLon(d, laneIdx, taskId);
    if (!isVisible(lat, lon)) return null;
    return projectLatLon(lat, lon);
  };

  /* Great-circle arc between two (lat, lon) points on the unit sphere,
     sampled via slerp in 3D Cartesian and projected. Returns the visible
     portion of the arc as a polyline; clips at the limb if either end
     leaves the visible cap. */
  const GC_SAMPLES = 32;
  const greatCircleArc = (latA, lonA, latB, lonB) => {
    const Pa = [
      R * Math.cos(latA) * Math.cos(lonA),
      R * Math.sin(latA),
      R * Math.cos(latA) * Math.sin(lonA),
    ];
    const Pb = [
      R * Math.cos(latB) * Math.cos(lonB),
      R * Math.sin(latB),
      R * Math.cos(latB) * Math.sin(lonB),
    ];
    const dot = (Pa[0]*Pb[0] + Pa[1]*Pb[1] + Pa[2]*Pb[2]) / (R * R);
    const omega = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (omega < 1e-5) return [];
    const sinO = Math.sin(omega);
    const pts = [];
    for (let i = 0; i <= GC_SAMPLES; i++) {
      const t = i / GC_SAMPLES;
      const wA = Math.sin((1 - t) * omega) / sinO;
      const wB = Math.sin(t * omega) / sinO;
      const Px = wA * Pa[0] + wB * Pb[0];
      const Py = wA * Pa[1] + wB * Pb[1];
      const Pz = wA * Pa[2] + wB * Pb[2];
      /* Visibility cap: a point on the sphere faces the camera when its
         X-component (radial-out) > R · cos α_limb. */
      if (Px < R * COS_LIMB) continue;
      const p = project(Px, Py, Pz);
      if (p) pts.push(p);
    }
    return pts;
  };

  /* Visibility helpers — a point (lat, lon) is visible if its great-circle
     distance from the ship is ≤ ALPHA_LIMB:
        cos(lat) · cos(lon) ≥ cos(ALPHA_LIMB)
     so the max longitude at given latitude is acos(cos α_limb / cos lat)
     and similarly for the max latitude at given longitude. */
  const lonMaxAtLat = (lat) => {
    const r = Math.cos(ALPHA_LIMB) / Math.cos(lat);
    return r > 1 ? 0 : Math.acos(r);
  };
  const latMaxAtLon = (lon) => {
    const r = Math.cos(ALPHA_LIMB) / Math.cos(lon);
    return r > 1 ? 0 : Math.acos(r);
  };

  /* Build a polyline path from an array of {x,y} samples. */
  const polyPath = (pts) => {
    if (!pts || pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
    return d;
  };

  /* Wheel zoom — snaps maxDays to a CURATED BREAKPOINT TABLE of
     natural calendar units. Each breakpoint also dictates its own
     minor/major line spacing, so every zoom level uses clean
     intervals (min / hr / day / week / month) — no awkward "12h
     between days" or 7.5-min ticks. */
  const _D = 1, _HR = 1/24, _MIN = 1/(24*60);
  const HORIZON_TIERS = [
    // horizon target | minor tick | major (labelled) tick
    { horizon: 15*_MIN, minor: _MIN,    major: 5*_MIN  },
    { horizon: 30*_MIN, minor: 5*_MIN,  major: 15*_MIN },
    { horizon: _HR,     minor: 5*_MIN,  major: 15*_MIN },
    { horizon: 3*_HR,   minor: 15*_MIN, major: _HR     },
    { horizon: 6*_HR,   minor: 30*_MIN, major: _HR     },
    { horizon: 12*_HR,  minor: _HR,     major: 3*_HR   },
    { horizon: _D,      minor: 3*_HR,   major: 6*_HR   },
    { horizon: 2*_D,    minor: 6*_HR,   major: 12*_HR  },
    { horizon: 3*_D,    minor: 6*_HR,   major: _D      },
    { horizon: 7*_D,    minor: 12*_HR,  major: _D      },
    { horizon: 14*_D,   minor: _D,      major: 7*_D    },  // ← 14-day sweet spot
    { horizon: 30*_D,   minor: _D,      major: 7*_D    },
    { horizon: 90*_D,   minor: 7*_D,    major: 14*_D   },
    { horizon: 180*_D,  minor: 14*_D,   major: 30*_D   },
    { horizon: 365*_D,  minor: 30*_D,   major: 90*_D   },
  ];
  const HORIZON_BREAKPOINTS = HORIZON_TIERS.map(t => t.horizon);
  React.useEffect(() => {
    const el = svgRef.current;
    if (!el || !setMaxDays) return;
    const handler = (e) => {
      e.preventDefault();
      let next;
      if (e.deltaY > 0) {
        // Zoom OUT — smallest breakpoint strictly greater than current.
        next = HORIZON_BREAKPOINTS.find(bp => bp > maxDays + 1e-9)
            ?? HORIZON_BREAKPOINTS[HORIZON_BREAKPOINTS.length - 1];
      } else {
        // Zoom IN — largest breakpoint strictly less than current.
        next = [...HORIZON_BREAKPOINTS].reverse().find(bp => bp < maxDays - 1e-9)
            ?? HORIZON_BREAKPOINTS[0];
      }
      if (Math.abs(next - maxDays) < 1e-9) return;
      setMaxDays(next);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [maxDays, setMaxDays]);

  /* Three drag modes:
     - LEFT-click    = SPIN (VERTICAL drag → viewAnchor along time axis).
                       Drag DOWN advances the ship forward in time; drag
                       UP rolls back. This matches the projection — in
                       our setup screen-up = +east (future), so dragging
                       DOWN pulls future toward the ship at the centre.
     - MIDDLE-click  = ALTITUDE (vertical drag → camera distance from
                       globe). Drag UP flies the drone closer.
                       Multiplicative scaling for constant-feel rate.
     - RIGHT-click   = PAN (translate the globe within the chart, 1:1
                       with cursor — same as Google Earth/Maya pan).
                       This is screen-space offset, not a sphere rotation. */
  const dragState  = React.useRef({ active: false, mode: null, startX: 0, startY: 0, startAnchor: 0, startAlt: 0, startPanX: 0, startPanY: 0, moved: false });
  const justDragged = React.useRef(false);
  const onPointerDown = (e) => {
    if (e.button === 1) {
      // Middle-click (wheel button): altitude
      dragState.current = { active: true, mode: 'alt', startY: e.clientY, startAlt: cameraAlt, moved: false };
      if (svgRef.current) svgRef.current.style.cursor = 'ns-resize';
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      e.preventDefault();
      return;
    }
    if (e.button === 2) {
      // Right-click: pan
      dragState.current = { active: true, mode: 'pan', startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY, moved: false };
      if (svgRef.current) svgRef.current.style.cursor = 'move';
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      e.preventDefault();
      return;
    }
    if (e.button !== undefined && e.button !== 0) return;
    if (!setViewAnchor) return;
    dragState.current = { active: true, mode: 'time', startY: e.clientY, startAnchor: viewAnchor, moved: false };
    if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onPointerMove = (e) => {
    const s = dragState.current;
    if (!s.active || !svgRef.current) return;
    if (s.mode === 'alt') {
      const dy = e.clientY - s.startY;
      if (Math.abs(dy) > 4) s.moved = true;
      const containerH = svgRef.current.clientHeight || 600;
      /* Drag UP → dy negative → factor < 1 → altitude shrinks (closer).
         Slope tuned so one full container-height drag is ~e^1.6 ≈ 5× change. */
      const factor = Math.exp(dy / Math.max(containerH, 1) * 1.6);
      const newAlt = Math.max(ALT_MIN, Math.min(ALT_MAX, s.startAlt * factor));
      setCameraAlt(newAlt);
      return;
    }
    if (s.mode === 'pan') {
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) s.moved = true;
      /* Convert screen-pixel delta → viewBox-unit delta so the globe
         tracks the cursor 1:1 even when the chart is resized. */
      const rect = svgRef.current.getBoundingClientRect();
      const sx = W / Math.max(rect.width,  1);
      const sy = H / Math.max(rect.height, 1);
      setPanX(s.startPanX + dx * sx);
      setPanY(s.startPanY + dy * sy);
      return;
    }
    const dy = e.clientY - s.startY;
    if (Math.abs(dy) > 4) s.moved = true;
    const containerH = svgRef.current.clientHeight || 600;
    const daysPerPx = (2 * maxDays) / Math.max(containerH, 1);
    setViewAnchor(s.startAnchor + dy * daysPerPx);
  };
  const onPointerUp = (e) => {
    const s = dragState.current;
    if (!s.active) return;
    justDragged.current = s.moved;
    dragState.current.active = false;
    if (svgRef.current) svgRef.current.style.cursor = '';
    try {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    setTimeout(() => { justDragged.current = false; }, 0);
  };
  const onContextMenu = (e) => e.preventDefault();
  const onClickCapture = (e) => {
    if (justDragged.current) { e.stopPropagation(); e.preventDefault(); }
  };

  /* Calendar-anchored grid arcs (meridians at constant longitude).
     Spacing comes from HORIZON_TIERS (same table the wheel snap uses):
     find the smallest tier whose `horizon` is ≥ current maxDays and
     use its minor/major spacing. Each tier is hand-picked from natural
     calendar units (min / hr / day / week / month). */
  const _tier = HORIZON_TIERS.find(t => t.horizon >= maxDays - 1e-9)
             ?? HORIZON_TIERS[HORIZON_TIERS.length - 1];
  const minorSpacing     = _tier.minor;
  const majorSpacing     = _tier.major;
  const halfMinorSpacing = minorSpacing / 2;
  const gridSpacing      = majorSpacing; // formatAbsolute granularity
  /* Iterate at half-minor resolution. Each step lands on exactly one of
     three tiers — major (labelled), minor, or half-minor — depending on
     whether absDays divides cleanly into major / minor. */
  const firstAbs = Math.ceil((viewAnchor - maxDays) / halfMinorSpacing) * halfMinorSpacing;
  const lastAbs  = Math.floor((viewAnchor + maxDays) / halfMinorSpacing) * halfMinorSpacing;
  const gridArcs = [];
  for (let absDays = firstAbs; absDays <= lastAbs + 1e-9; absDays += halfMinorSpacing) {
    const effOff = absDays - viewAnchor;
    if (Math.abs(effOff) > maxDays * 1.001) continue;
    const majRatio = absDays / majorSpacing;
    const minRatio = absDays / minorSpacing;
    const isMajor = Math.abs(majRatio - Math.round(majRatio)) < 1e-6;
    const isMinor = Math.abs(minRatio - Math.round(minRatio)) < 1e-6;
    gridArcs.push({ absDays, effOff, isMajor, isMinor });
  }

  /* LIMB — projects to a TRUE GEOMETRIC CIRCLE because the camera is
     looking straight at the sphere's centre. All limb points share the
     same depth f = (R + H_CAM) − R cos α_limb, so the projection of the
     limb circle (radius R sin α_limb in 3D) is a circle of radius
     LIMB_R_PX centred at the chart centre. */
  const LIMB_F_PX = (R + H_CAM) - R * Math.cos(ALPHA_LIMB);
  const LIMB_R_PX = (R * Math.sin(ALPHA_LIMB) / LIMB_F_PX) * SCALE;

  /* Sample a generic lat/lon curve and clip to the visibility cap. Used
     for both wireframe parallels (constant lat, varying lon) and
     wireframe meridians (constant lon, varying lat), plus the
     ETM-specific lane rails and date arcs. */
  const sampleCurve = (genPoint, samples = 80) => {
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const { lat, lon } = genPoint(t);
      if (!isVisible(lat, lon)) continue;
      const P = projectLatLon(lat, lon);
      if (P) pts.push(P);
    }
    return pts;
  };

  /* Parallel: constant lat, lon ∈ [−lonMax, +lonMax]. */
  const parallelPts = (lat) => {
    const lonMax = lonMaxAtLat(lat);
    if (lonMax < 0.001) return [];
    return sampleCurve(t => ({ lat, lon: -lonMax + 2 * lonMax * t }), 90);
  };

  /* Meridian: constant lon, lat ∈ [−latMax, +latMax]. */
  const meridianPts = (lon) => {
    const latMax = latMaxAtLon(lon);
    if (latMax < 0.001) return [];
    return sampleCurve(t => ({ lat: -latMax + 2 * latMax * t, lon }), 90);
  };

  /* Static wireframe grid — canonical 15° graticule. We walk OUTWARD
     from the equator/prime-meridian in 15° increments so the lines
     always land on 0°, ±15°, ±30°, ±45°, … regardless of α_limb. The
     equator (0°) and prime meridian are skipped here — they get a
     brighter axis style further down. */
  const GRID_STEP = 15 * Math.PI / 180;
  const wireframeLats = [];
  for (let k = 1; k * GRID_STEP <= ALPHA_LIMB + 1e-6; k++) {
    wireframeLats.push( k * GRID_STEP);
    wireframeLats.push(-k * GRID_STEP);
  }
  const wireframeLons = [];
  for (let k = 1; k * GRID_STEP <= ALPHA_LIMB + 1e-6; k++) {
    wireframeLons.push( k * GRID_STEP);
    wireframeLons.push(-k * GRID_STEP);
  }
  /* Effective offset for tasks (real days-until-due minus pan anchor). */
  const effOffset = (t) => dayOffset(t.dueDate, t.dueTime) - viewAnchor;
  const todayMs = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
  const sortedTasks = [...tasks].sort((a, b) => effOffset(b) - effOffset(a));

  /* Ship at (lat=0, lon=0). */
  const shipXY = projectLatLon(0, 0);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="bridge-scene bridge-scene--horizon"
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={onContextMenu}
      onClickCapture={onClickCapture}
    >
      <defs>
        <radialGradient id="bridge-globe" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%"   stopColor="rgba(40, 60, 95, 0.20)" />
          <stop offset="80%"  stopColor="rgba(20, 30, 50, 0.10)" />
          <stop offset="100%" stopColor="rgba(10, 18, 28, 0.00)" />
        </radialGradient>
        <clipPath id="bridge-globe-clip">
          <circle cx={CX} cy={CY} r={LIMB_R_PX} />
        </clipPath>
      </defs>

      {/* Faint globe-body wash inside the limb. */}
      <circle cx={CX} cy={CY} r={LIMB_R_PX} fill="url(#bridge-globe)" />

      <g clipPath="url(#bridge-globe-clip)">
        {/* Parallels (constant latitude) — every 15°, INCLUDING the
            equator. All latitudes share the lane-rail style because they
            all represent task lanes. */}
        {wireframeLats.map((lat) => {
          const pts = parallelPts(lat);
          if (pts.length < 2) return null;
          return <path key={`wp${lat.toFixed(4)}`} d={polyPath(pts)} fill="none" className="bridge-lane-rail" />;
        })}
        {(() => {
          const eq = parallelPts(0);
          return eq.length >= 2
            ? <path d={polyPath(eq)} fill="none" className="bridge-lane-rail" />
            : null;
        })()}
        {/* Meridians (constant longitude) — every 15°, plus prime
            meridian as a brighter axis line. */}
        {wireframeLons.map((lon) => {
          const pts = meridianPts(lon);
          if (pts.length < 2) return null;
          return <path key={`wm${lon.toFixed(4)}`} d={polyPath(pts)} fill="none" className="bridge-wire" />;
        })}
        {(() => {
          const pm = meridianPts(0);
          return pm.length >= 2
            ? <path d={polyPath(pm)} fill="none" className="bridge-wire bridge-wire--axis" />
            : null;
        })()}

        {/* Calendar-anchored meridian PATHS — date marks; spin with
            viewAnchor. Labels are rendered AFTER this clipped block so
            they can sit on the limb without being clipped. */}
        {gridArcs.map(({ absDays, effOff, isMajor, isMinor }) => {
          const lon = dayToLon(effOff);
          if (Math.abs(lon) > ALPHA_LIMB) return null;
          const pts = meridianPts(lon);
          if (pts.length < 2) return null;
          const arcCls = isMajor ? 'bridge-range-arc'
            : isMinor              ? 'bridge-range-arc bridge-range-arc--minor'
            :                        'bridge-range-arc bridge-range-arc--half-minor';
          return <path key={absDays.toFixed(4)} d={polyPath(pts)} fill="none" className={arcCls} />;
        })}

        {/* NIGHT-SIDE wash + TODAY meridian. The night region is the
            past half of the visible cap — bounded by the TODAY
            meridian on the future side, and by the past arc of the
            limb on the other. We compute the arc's large-flag from
            the angular distance between the meridian's two limb
            endpoints, so the wash correctly covers the past slice
            whether it's a half-disk (viewAnchor = 0) or a near-full
            disk (when today has panned far into the past direction). */}
        {(() => {
          const todayLon = dayToLon(-viewAnchor);
          if (Math.abs(todayLon) >= ALPHA_LIMB - 1e-6) return null;
          const meridPts = meridianPts(todayLon);
          if (meridPts.length < 2) return null;
          const south = meridPts[0];
          const north = meridPts[meridPts.length - 1];
          /* CW angular distance from north to south around limb centre. */
          const sA = Math.atan2(south.y - CY, south.x - CX);
          const nA = Math.atan2(north.y - CY, north.x - CX);
          const cwLen = ((sA - nA) + 2 * Math.PI) % (2 * Math.PI);
          const largeArc = cwLen > Math.PI ? 1 : 0;
          let nightD = `M ${south.x.toFixed(2)} ${south.y.toFixed(2)}`;
          for (let i = 1; i < meridPts.length; i++) {
            nightD += ` L ${meridPts[i].x.toFixed(2)} ${meridPts[i].y.toFixed(2)}`;
          }
          nightD += ` A ${LIMB_R_PX.toFixed(2)} ${LIMB_R_PX.toFixed(2)} 0 ${largeArc} 1 ${south.x.toFixed(2)} ${south.y.toFixed(2)} Z`;
          return (
            <>
              <path d={nightD} className="bridge-nightside" />
              <path d={polyPath(meridPts)} fill="none" className="bridge-range-arc bridge-range-arc--today" />
            </>
          );
        })()}

        {/* Lane labels — horizontally centred on the projection of each
            lane's centre latitude on the prime meridian, then shifted
            DOWN by LABEL_OFFSET so they sit clear of any task pips
            riding the central horizontal line. */}
        {(() => {
          const LABEL_OFFSET = 22;     // px below the meridian
          return lanes.map((laneName, i) => {
            const lat = laneLat(i);
            const pt = projectLatLon(lat, 0);
            if (!pt) return null;
            return (
              <text key={laneName}
                    x={pt.x} y={pt.y + LABEL_OFFSET}
                    textAnchor="middle"
                    className="bridge-lane-label">{laneName.toUpperCase()}</text>
            );
          });
        })()}
      </g>

      {/* Limb — TRUE GEOMETRIC CIRCLE, drawn over the clipped contents. */}
      <circle cx={CX} cy={CY} r={LIMB_R_PX} fill="none" className="bridge-horizon" />

      {/* Date-arc labels — OUTSIDE the clipPath so they can sit on or
          past the limb. Each major meridian gets two labels:
            - DATE  (absolute) at the south endpoint, extending leftward
            - TIME  (relative offset) at the north endpoint, extending rightward
          South/north are determined by leftmost/rightmost projected
          sample of the meridian — in this projection that's directly the
          lateral endpoints of the arc on the limb. */}
      {gridArcs.filter(g => g.isMajor).map(({ absDays, effOff }) => {
        const lon = dayToLon(effOff);
        if (Math.abs(lon) > ALPHA_LIMB) return null;
        const pts = meridianPts(lon);
        if (pts.length < 2) return null;
        let leftPt = pts[0], rightPt = pts[0];
        for (const p of pts) {
          if (p.x < leftPt.x) leftPt = p;
          if (p.x > rightPt.x) rightPt = p;
        }
        const refMs = todayMs + absDays * 86400000;
        const absText = formatAbsolute(refMs, gridSpacing);
        const relText = formatRelative(effOff);
        return (
          <g key={`lbl${absDays.toFixed(4)}`}>
            <text x={leftPt.x - 6}  y={leftPt.y  + 3}
                  textAnchor="end"
                  className="bridge-range-label bridge-range-label--abs">{absText}</text>
            <text x={rightPt.x + 6} y={rightPt.y + 3}
                  textAnchor="start"
                  className="bridge-range-label">{relText}</text>
          </g>
        );
      })}

      {/* TODAY label — gold "NOW" at both ends of the today meridian. */}
      {(() => {
        const todayLon = dayToLon(-viewAnchor);
        if (Math.abs(todayLon) > ALPHA_LIMB) return null;
        const pts = meridianPts(todayLon);
        if (pts.length < 2) return null;
        let leftPt = pts[0], rightPt = pts[0];
        for (const p of pts) {
          if (p.x < leftPt.x) leftPt = p;
          if (p.x > rightPt.x) rightPt = p;
        }
        return (
          <g>
            <text x={leftPt.x - 6}  y={leftPt.y + 3}  textAnchor="end"
                  className="bridge-range-label bridge-range-label--today">NOW</text>
            <text x={rightPt.x + 6} y={rightPt.y + 3} textAnchor="start"
                  className="bridge-range-label bridge-range-label--today">NOW</text>
          </g>
        );
      })()}

      {/* Dependency arcs — great-circle paths from each prerequisite to
          its dependent. Drawn BEFORE pips so pips sit on top. */}
      {(() => {
        const byId = new Map(tasks.map(t => [t.id, t]));
        const arcs = [];
        tasks.forEach(t => {
          if (!Array.isArray(t.dependsOn) || t.dependsOn.length === 0) return;
          const tEff = effOffset(t);
          if (Math.abs(tEff) / maxDays > 1.0) return;
          const target = taskLatLon(tEff, laneOf(t), t.id);
          if (!isVisible(target.lat, target.lon)) return;
          t.dependsOn.forEach(depId => {
            const src = byId.get(depId);
            if (!src) return;
            const sEff = effOffset(src);
            if (Math.abs(sEff) / maxDays > 1.0) return;
            const source = taskLatLon(sEff, laneOf(src), src.id);
            if (!isVisible(source.lat, source.lon)) return;
            const pts = greatCircleArc(source.lat, source.lon, target.lat, target.lon);
            if (pts.length >= 2) arcs.push({ key: `${depId}->${t.id}`, d: polyPath(pts) });
          });
        });
        return arcs.map(a => (
          <path key={a.key} d={a.d} fill="none" className="bridge-dep-arc" />
        ));
      })()}

      {/* Task pips — both past (negative effOff) and future tasks visible.
          - Colour : ETM quadrant (existing bridge-pip--q{1..4} classes).
          - Size   : log-scaled to the task's effort estimate in hours.
                    A faint distance attenuation is also applied so far
                    tasks read as slightly recessed. */}
      {sortedTasks.map(t => {
        const d_eff = effOffset(t);
        if (Math.abs(d_eff) / maxDays > 1.0) return null;
        const xy = dayLaneToXY(d_eff, laneOf(t), t.id);
        if (!xy) return null;
        const qid = QID_BY_QUAD[getQuadrant(t)] || 'q4';
        const isDone = (Number(t.percentComplete) || 0) >= 100;
        const tNorm = Math.abs(d_eff) / maxDays;
        /* Effort → hours. days/weeks normalised against an 8 h workday
           and 40 h workweek; unknown estimates default to a small pip. */
        const unit = t.timeEstimateUnit || 'hours';
        const val  = Number(t.timeEstimateValue) || 0;
        const hours = val <= 0 ? 0 : (
          unit === 'minutes' ? val / 60 :
          unit === 'days'    ? val * 8 :
          unit === 'weeks'   ? val * 40 :
          val                                                 // hours
        );
        /* log₂(h) maps   0.5 h → −1   1 h → 0   8 h → 3   40 h → 5.3.
           Linear remap to a scale window of [0.5, 1.6]. */
        const sizeScale = hours <= 0
          ? 0.65
          : Math.max(0.45, Math.min(1.6, 0.65 + Math.log2(Math.max(0.25, hours)) * 0.18));
        /* Gentle distance attenuation: 1.0 at ship, 0.8 at limb. */
        const distScale = Math.max(0.8, 1 - tNorm * 0.2);
        const scale = sizeScale * distScale;
        const sizeShowsLabel = scale > 0.7;
        const modeShowsLabel =
            labelMode === 'none'       ? false
          : labelMode === 'incomplete' ? !isDone
          : labelMode === 'tracked'    ? !!t.tracked
          :                              true; // 'all'
        const showLabel = sizeShowsLabel && modeShowsLabel;
        const labelText = t.task.length > 22 ? t.task.slice(0, 20) + '…' : t.task;
        return (
          <g key={t.id}
             className={`bridge-pip bridge-pip--${qid} ${isDone ? 'bridge-pip--done' : ''}`}
             onPointerDown={(e) => e.stopPropagation()}
             onClick={(e) => { e.stopPropagation(); onPick(t); }}
             style={{ cursor: 'pointer' }}>
            {/* Ring + blip only for LIVE targets — completed pips are
                stripped down to the core. */}
            {!isDone && (
              <>
                <circle cx={xy.x} cy={xy.y} r={11 * scale}
                        className="bridge-pip__blip"
                        style={{ animationDelay: `${(hashId(t.id) % 340) / 100}s` }} />
                <circle cx={xy.x} cy={xy.y} r={11 * scale} className="bridge-pip__ring" />
              </>
            )}
            <circle cx={xy.x} cy={xy.y} r={5  * scale} className="bridge-pip__core" />
            {showLabel && (
              <text x={xy.x + 13 * scale} y={xy.y + 4}
                    className="bridge-pip__label"
                    style={{ fontSize: `${10 * scale}px` }}>{labelText}</text>
            )}
            <title>{t.task} · due {new Date(t.dueDate).toLocaleDateString()}</title>
          </g>
        );
      })}

      {/* Ship marker — sub-camera point sits at chart centre. */}
      <g transform={`translate(${CX}, ${CY})`}>
        <circle r={6} className="bridge-ship-core" />
        <circle r={11} fill="none" className="bridge-ship-ring" />
        <text x={0} y={28} textAnchor="middle" className="bridge-ship-label">
          {formatAnchor(viewAnchor)}
        </text>
        {Math.abs(viewAnchor) >= 1/48 && (
          <text x={0} y={42} textAnchor="middle" className="bridge-ship-date">
            {formatAbsolute(todayMs + viewAnchor * 86400000, Math.abs(viewAnchor))}
          </text>
        )}
      </g>

      {/* HUD frame */}
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} className="bridge-frame" />
    </svg>
  );
};

const RadarScene = ({ tasks, lanes, laneOf, dayOffset, maxDays, getQuadrant, onPick }) => {
  const SIZE = 700;
  const CX = SIZE / 2, CY = SIZE / 2;
  const MAX_R = 295;

  /* Polar→cartesian with 12 o'clock as 0 radians (compass convention). */
  const polar = (r, theta) => ({
    x: CX + r * Math.cos(theta - Math.PI / 2),
    y: CY + r * Math.sin(theta - Math.PI / 2)
  });

  const rings = [
    { d: 7,  label: '1w'  },
    { d: 30, label: '1m'  },
    { d: 90, label: '3m'  },
    { d: maxDays, label: `${Math.round(maxDays/30)}m` }
  ];

  const N = lanes.length;
  const sectorAngle = (2 * Math.PI) / N;

  /* Deterministic jitter inside a sector so multiple tasks in the same lane
     don't render on top of each other. djb2-style hash on the task id. */
  const hash = (s) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
    return h;
  };
  const jitter = (id) => ((hash(String(id)) % 1000) / 1000 - 0.5) * 0.7;

  // Compass markers
  const compass = ['N','E','S','W'];

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="bridge-scene bridge-scene--radar"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="radar-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%"   stopColor="rgba(125, 214, 255, 0.08)" />
          <stop offset="60%"  stopColor="rgba(125, 214, 255, 0.02)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={MAX_R + 30} fill="url(#radar-glow)" />

      {/* Sector dividers */}
      {lanes.map((laneName, i) => {
        const aEdge = i * sectorAngle;
        const pEdge = polar(MAX_R, aEdge);
        const pLabel = polar(MAX_R + 24, aEdge + sectorAngle / 2);
        return (
          <g key={laneName}>
            <line x1={CX} y1={CY} x2={pEdge.x} y2={pEdge.y}
                  className="bridge-sector-divider" />
            <text x={pLabel.x} y={pLabel.y + 4}
                  textAnchor="middle"
                  className="bridge-lane-label">
              {laneName.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Range rings */}
      {rings.map(({ d, label }) => {
        const r = (d / maxDays) * MAX_R;
        return (
          <g key={d}>
            <circle cx={CX} cy={CY} r={r} className="bridge-range-ring" />
            <text x={CX + 5} y={CY - r + 3} className="bridge-range-label">{label}</text>
          </g>
        );
      })}

      {/* Outer rim */}
      <circle cx={CX} cy={CY} r={MAX_R} className="bridge-radar-rim" />

      {/* Compass markers (N/E/S/W) */}
      {compass.map((label, i) => {
        const a = (i * Math.PI) / 2;   // 0, π/2, π, 3π/2 from north
        const p = polar(MAX_R + 14, a);
        return (
          <text key={label} x={p.x} y={p.y + 3} textAnchor="middle"
                className="bridge-compass-label">{label}</text>
        );
      })}

      {/* Task pips */}
      {tasks.map(t => {
        const li = laneOf(t);
        const d = Math.max(0, dayOffset(t.dueDate, t.dueTime));
        const r = (d / maxDays) * MAX_R;
        const angle = li * sectorAngle + sectorAngle / 2 + jitter(t.id) * (sectorAngle * 0.35);
        const { x, y } = polar(r, angle);
        const qid = QID_BY_QUAD[getQuadrant(t)] || 'q4';
        const isDone = (Number(t.percentComplete) || 0) >= 100;
        return (
          <g key={t.id}
             className={`bridge-pip bridge-pip--${qid} ${isDone ? 'bridge-pip--done' : ''}`}
             onPointerDown={(e) => e.stopPropagation()}
             onClick={(e) => { e.stopPropagation(); onPick(t); }}
             style={{ cursor: 'pointer' }}>
            {!isDone && (
              <circle cx={x} cy={y} r={9} className="bridge-pip__ring" />
            )}
            <circle cx={x} cy={y} r={4} className="bridge-pip__core" />
            <title>{t.task} · due {new Date(t.dueDate).toLocaleDateString()}</title>
          </g>
        );
      })}

      {/* Ship at center */}
      <circle cx={CX} cy={CY} r={7} className="bridge-ship-core" />
      <circle cx={CX} cy={CY} r={14} className="bridge-ship-ring" />
      <text x={CX} y={CY + 30} textAnchor="middle" className="bridge-ship-label">TODAY</text>

      {/* Outer HUD frame */}
      <rect x={0.5} y={0.5} width={SIZE-1} height={SIZE-1} className="bridge-frame" />
    </svg>
  );
};

const CalendarView = ({ tasks, filters, setFilters, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, setDefaultDueDate, settings }) => {
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

export default EisenhowerTaskManager;
