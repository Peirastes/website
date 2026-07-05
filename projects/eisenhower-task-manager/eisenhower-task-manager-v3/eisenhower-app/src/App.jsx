import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Edit2, Trash2, Calendar, ChevronDown, ChevronLeft, ChevronRight, Download, Upload, Settings, Info, AlertCircle, CheckCircle, LayoutGrid, List, Shield, Clock, Archive, Repeat, BarChart3, TrendingUp, RefreshCw, Compass, MessageSquare, FolderKanban } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);
import { BootOverlay } from './components/BootOverlay';
import { CinematicChrome } from './components/CinematicChrome';
import { BridgeClock } from './components/BridgeClock';
import { AppDock } from './components/AppDock';
import { SearchPalette } from './components/SearchPalette';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutHelp } from './components/ShortcutHelp';
import { UndoToast } from './components/UndoToast';
import { InfoModal } from './components/InfoModal';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { CompletionModal } from './components/CompletionModal';
import { MatrixTask } from './components/MatrixTask';
import { VelocityChart } from './components/VelocityChart';
import { AnalyticsView } from './views/AnalyticsView';
import { GanttView } from './views/GanttView';
import { CalendarView } from './views/CalendarView';
import { TaskForm } from './views/TaskForm';
import { MatrixView } from './views/MatrixView';
import { ListView } from './views/ListView';
import { BridgeView } from './views/BridgeView';
import { CopilotView } from './views/CopilotView';
import { ProjectsView } from './views/ProjectsView';

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
  const [projects, setProjects] = useState([]);
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
      const arr = Array.isArray(serverTasks) ? serverTasks : [];
      /* Soft-delete purge: drop tombstones older than the 24h grace
         window on load. The next auto-save writes the purged array back,
         so expired trash is permanently reclaimed without a separate job. */
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const purged = arr.filter(t => !t.deletedAt || new Date(t.deletedAt).getTime() > cutoff);
      setTasks(purged);
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

    try {
      const serverProjects = await apiFetch('/projects');
      if (serverProjects && serverProjects.projects) setProjects(serverProjects.projects);
    } catch (e) { /* projects optional */ }

    setIsLoading(false);
  };

  // Reload just the project list (after create/assign/status changes).
  const refreshProjects = async () => {
    try { const r = await apiFetch('/projects'); if (r && r.projects) setProjects(r.projects); } catch {}
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

  /* Soft delete: the task is NOT removed from the array — it gets a
     `deletedAt` timestamp and is filtered out of every view via the
     liveTasks chokepoint. This survives reloads (the tombstone is
     persisted by the auto-save effect) and is reclaimed after a 24h
     grace window by the purge in loadData. Two recovery paths:
       • the 5s undo toast (immediate "oops")
       • ListView's Trash status filter (recover any time within 24h) */
  const deleteTask = (taskId) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target || target.deletedAt) return;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, deletedAt: new Date().toISOString() } : t));
    setDeletedTask({ task: target, id: taskId });
  };

  /* Clear the tombstone, bringing the task back into the live set at its
     original array position (the record never moved). */
  const restoreTask = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const { deletedAt, ...rest } = t;
      return rest;
    }));
  };

  const undoDelete = () => {
    if (!deletedTask) return;
    restoreTask(deletedTask.id);
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

  /* The live task set — everything NOT soft-deleted. This is what every
     view, the stats, and search operate on. Raw `tasks` (tombstones
     included) is reserved for persistence, undo, purge, and the ListView
     Trash filter. */
  const liveTasks = useMemo(() => tasks.filter(t => !t.deletedAt), [tasks]);

  const getStats = () => {
    const active = liveTasks.filter(t => t.percentComplete < 100);
    const completed = liveTasks.filter(t => t.percentComplete === 100);
    const overdue = active.filter(t => calculatePriority(t) < 0);
    const dueToday = active.filter(t => calculatePriority(t) === 0);
    
    const byQuadrant = {
      'do-first': active.filter(t => getQuadrant(t) === 'do-first').length,
      'schedule': active.filter(t => getQuadrant(t) === 'schedule').length,
      'delegate': active.filter(t => getQuadrant(t) === 'delegate').length,
      'eliminate': active.filter(t => getQuadrant(t) === 'eliminate').length
    };

    const byRecurrence = {
      once: liveTasks.filter(t => t.recurringPattern === 'once').length,
      daily: liveTasks.filter(t => t.recurringPattern === 'daily').length,
      weekly: liveTasks.filter(t => t.recurringPattern === 'weekly').length,
      monthly: liveTasks.filter(t => t.recurringPattern === 'monthly').length,
      yearly: liveTasks.filter(t => t.recurringPattern === 'yearly').length
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
    <div className={`etm-shell ${view === 'bridge' ? 'etm-shell--bridge' : ''} h-screen flex flex-col text-[#c8d0e0] overflow-hidden`} style={{
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
      // Copilot tab hides the task-readout bar, so it only needs to clear the chrome.
      paddingTop: '4.4rem', /* readout removed — only clear the chrome title now */
      paddingBottom: 'var(--etm-actionbar-clear)' /* 2-row panel on mobile, single line on desktop */
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
        title={view === 'bridge' ? 'Chronosphere' : 'Eisenhower Task Manager'}
        sub={view === 'bridge' ? 'Temporal Task Horizon' : 'Operations — Task Prioritization Console'}
        crew={view === 'bridge' ? '' : 'Critical · Strategic · Delegate · Eliminate'}
        align={view === 'bridge' ? 'left' : 'center'}
      />
      {/* Live wall-clock, top-right on the Bridge header line (above the Command
          frame), mirroring the left-anchored Chronosphere title. */}
      {view === 'bridge' && <BridgeClock />}

      {/* PHASE 5 cleanup: removed etm-reveal-* keyframes (retired in
          Phase 2 when the cinematic scan-line took over the entrance).
          Phase 5 finale also removed TaskCard, so the .priority-badge
          utility class is no longer used either — the inline <style>
          tag is now empty and can be deleted entirely if desired. */}

      {/* === CONTROL PANEL LAYOUT: readouts → screens → controls === */}

      {/* Readout bar removed 2026-06-19 — its Q1–Q4 counts duplicated the Matrix
          quadrant tabs, and the info wasn't wanted on the other tabs. Content now
          only needs to clear the chrome (paddingTop 5rem), reclaiming the row. */}

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
            tasks={liveTasks}
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
            deleteTask={deleteTask} restoreTask={restoreTask}
            calculateTaskScore={calculateTaskScore}
            settings={settings} setSettings={setSettings}
          />
        ) : view === 'gantt' ? (
          <GanttView
            tasks={liveTasks} getQuadrant={getQuadrant}
            calculatePriority={calculatePriority} toggleComplete={toggleComplete}
            setEditingTask={setEditingTask} setShowForm={setShowForm}
            deleteTask={deleteTask} settings={settings}
          />
        ) : view === 'calendar' ? (
          <CalendarView
            tasks={liveTasks} filters={filters} setFilters={setFilters}
            getQuadrant={getQuadrant} calculatePriority={calculatePriority}
            toggleComplete={toggleComplete} setEditingTask={setEditingTask}
            setShowForm={setShowForm} deleteTask={deleteTask}
            setDefaultDueDate={setDefaultDueDate} settings={settings}
          />
        ) : view === 'bridge' ? (
          <BridgeView
            tasks={liveTasks} projects={projects} getQuadrant={getQuadrant}
            setEditingTask={setEditingTask} setShowForm={setShowForm}
            settings={settings}
            view={view} setView={setView}
            onInfo={() => setShowInfo(true)} onSettings={() => setShowSettings(true)}
            onExport={exportData} onImport={importData}
            onRefresh={handleRefresh} isRefreshing={isRefreshing}
          />
        ) : view === 'copilot' ? (
          <CopilotView />
        ) : view === 'projects' ? (
          <ProjectsView
            projects={projects} tasks={tasks}
            onRefresh={refreshProjects}
            setEditingTask={setEditingTask} setShowForm={setShowForm}
          />
        ) : (
          <AnalyticsView
            tasks={liveTasks} calculateTaskScore={calculateTaskScore}
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
      {/* PHASE 4 finale: cinematic action bar. On the Bridge this dock moves
          into the view's own top-left command column (rendered inside
          BridgeView), so the bottom strip is suppressed there. */}
      {view !== 'bridge' && (
        <AppDock
          layout="bar"
          view={view} setView={setView}
          onAddTask={() => { setEditingTask(null); setShowForm(true); }}
          onInfo={() => setShowInfo(true)} onSettings={() => setShowSettings(true)}
          onExport={exportData} onImport={importData}
          onRefresh={handleRefresh} isRefreshing={isRefreshing}
        />
      )}

      {/* PHASE 5: Backup reminder toast — cinematic acrylic glass.
          Floats bottom-right above the action bar. Amber left edge
          signals the warning state without shouting. */}
      {showBackupReminder && (
        <div className="etm-backup-toast" style={{
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
          tasks={liveTasks}
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
          projects={projects}
          tasks={tasks}
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

export default EisenhowerTaskManager;
