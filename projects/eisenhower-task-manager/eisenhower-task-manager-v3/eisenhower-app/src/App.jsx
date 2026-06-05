import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Calendar, ChevronDown, ChevronLeft, ChevronRight, Download, Upload, Settings, AlertCircle, CheckCircle, LayoutGrid, List, Shield, Clock, Archive, Repeat, BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);
// PHASE 2: PINModal replaced by BootOverlay (cinematic register).
// PINModal kept on disk as legacy reference until Phase 5 cleanup.
// import { PINModal } from './components/PINModal';
import { BootOverlay } from './components/BootOverlay';
import { CinematicChrome } from './components/CinematicChrome';

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
    }
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

  const deleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

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
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'radial-gradient(ellipse at 50% 40%, #1a2024, #0a0e12 65%, #040608)',
        fontFamily: "'Courier New', monospace"
      }}>
        <div className="text-center space-y-4">
          <div className="etm-led etm-led--red etm-led--pulse mx-auto" style={{ width: 12, height: 12 }} />
          <div className="text-sm font-bold uppercase tracking-widest" style={{
            color: '#ff3344',
            textShadow: '0 0 10px rgba(255,51,68,.3)'
          }}>Server Offline</div>
          <div style={{ color: '#506070', fontSize: '12px', maxWidth: '280px' }}>
            ETM server is not reachable. Ensure the server is running and you are connected to Tailscale.
          </div>
          <button
            onClick={() => { setServerOffline(false); setIsLoading(true); loadData(); }}
            className="etm-pushbutton text-sm mt-4"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !justUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'radial-gradient(ellipse at 50% 40%, #1a2024, #0a0e12 65%, #040608)',
        fontFamily: "'Courier New', monospace"
      }}>
        <div className="text-sm font-bold uppercase tracking-widest" style={{
          color: '#ffaa33',
          textShadow: '0 0 10px rgba(255,170,51,.3)'
        }}>Initializing...</div>
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
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      // PHASE 1 (Cinematic foundation): was a solid radial-gradient bg
      // (#1a2024 → #0a0e12 → #040608). Removed so the cinematic banner
      // backdrop (body::before in index.css) shows through the gaps
      // between the etm-* chrome. v2 components keep their own
      // backgrounds and render normally on top of the new atmosphere.
      background: 'transparent',
      // PHASE 2: clear the cinematic chrome row (fixed-positioned at
      // top:1.2rem-1.6rem with ~3rem of content height). Pushes the
      // etm-readout-strip + monitor grid + chassis footer down so they
      // don't render UNDER the chrome flanks and title. Chassis footer
      // stays at viewport bottom because padding-top doesn't reduce
      // the root's own height (still h-screen = 100vh).
      paddingTop: '5rem'
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
      />

      <style>{`
        .etm-reveal-start {
          opacity: 0;
          transform: translateY(100vh);
        }
        .etm-reveal-animate {
          animation: etmReveal 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          border-top: 3px solid #0c1014;
          box-shadow: 0 -6px 24px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.05);
        }
        .etm-reveal-animate::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 6px;
          z-index: 9999;
          background: repeating-linear-gradient(90deg, #ffaa33 0px, #ffaa33 12px, #1e2428 12px, #1e2428 24px);
          opacity: 0.5;
          animation: etmHazardFade 1.2s ease-out forwards;
        }

        .priority-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          font-weight: 600;
        }
      `}</style>

      {/* === CONTROL PANEL LAYOUT: readouts → screens → controls === */}

      {/* PHASE 3: Cinematic readout bar — acrylic glass, bare colored
          numbers for Q1-Q4 (no text labels — LED + color encodes
          identity), text labels preserved on Overdue/Today (temporal
          state, not quadrant identity), Mk-III nameplate at right.
          Q1='do-first', Q2='schedule', Q3='delegate', Q4='eliminate'. */}
      <div className="readout-bar" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 flex-1 min-h-0 w-full h-full">
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
            settings={settings}
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
        ) : (
          <AnalyticsView
            tasks={tasks} calculateTaskScore={calculateTaskScore}
          />
        )}
      </main>

      {/* Bottom: Control Bar — chassis with view selector, actions, stats */}
      <footer className="etm-chassis" style={{ borderTop: '2px solid #0c1014', borderBottom: 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Left: title + stats */}
            <div className="flex items-center gap-3 sm:gap-5">
              <h1 className="text-sm sm:text-base font-bold tracking-wider uppercase hidden sm:block" style={{
                color: '#e86030',
                textShadow: '0 0 8px rgba(232,96,48,.3)'
              }}>
                ETM
              </h1>
              <div className="text-xs text-[#506070] font-data">
                <span className="text-[#8899aa]">{stats.active.length}</span> active ·
                <span className="text-[#8899aa] ml-1">{stats.completed.length}</span> done
              </div>
            </div>

            {/* Center: view selector */}
            <div className="flex gap-1 rounded p-0.5 etm-panel--recessed">
              {[
                { key: 'matrix', icon: LayoutGrid, label: 'Matrix' },
                { key: 'list', icon: List, label: 'List' },
                { key: 'gantt', icon: BarChart3, label: 'Gantt' },
                { key: 'analytics', icon: TrendingUp, label: 'Analytics' },
                { key: 'calendar', icon: Calendar, label: 'Calendar' },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setView(key)}
                  className={`etm-pushbutton ${view === key ? 'etm-pushbutton--active' : ''}`}
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  <Icon size={13} />
                  <span className="hidden lg:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button onClick={exportData} className="etm-pushbutton text-[#50c878]" style={{ padding: '4px 8px', fontSize: '11px' }}>
                <Download size={13} /> <span className="hidden sm:inline">Export</span>
              </button>
              <label className="etm-pushbutton cursor-pointer" style={{ padding: '4px 8px', fontSize: '11px' }}>
                <Upload size={13} /> <span className="hidden sm:inline">Import</span>
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="etm-pushbutton"
                style={{ padding: '5px' }}
                title="Refresh"
              >
                <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => { setEditingTask(null); setShowForm(true); }}
                className="etm-pushbutton etm-pushbutton--accent uppercase tracking-wider font-bold"
                style={{ padding: '4px 10px', fontSize: '11px' }}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Backup reminder — now a small overlay toast */}
      {showBackupReminder && (
        <div className="fixed bottom-16 right-4 z-40 etm-panel p-3 max-w-xs" style={{ borderLeft: '3px solid #ff8822' }}>
          <div className="flex items-center gap-2 text-xs text-[#fbbf24]">
            <Shield size={14} />
            <span>Backup: {getDaysSinceExport()}d since last export</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button onClick={exportData} className="etm-pushbutton text-[#50c878]" style={{ padding: '3px 8px', fontSize: '10px' }}>Export</button>
            <button onClick={() => setShowBackupReminder(false)} className="etm-pushbutton" style={{ padding: '3px 6px', fontSize: '10px' }}>Dismiss</button>
          </div>
        </div>
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

  const RatingLEDs = ({ value, onChange, label, litClass }) => {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#8899aa]">{label}</label>
        <div className="etm-led-rating">
          {[1, 2, 3, 4, 5].map((dot) => (
            <button
              key={dot}
              type="button"
              onClick={() => onChange(dot)}
              className={`etm-led-rating__dot ${value >= dot ? `etm-led-rating__dot--lit ${litClass}` : ''}`}
            />
          ))}
        </div>
        <div className="text-xs text-[#506070] font-data">
          {value === null ? 'Click to rate' : labels[value]}
        </div>
      </div>
    );
  };

  return (
    <div className="etm-modal-backdrop p-4">
      <div className="etm-modal rounded-xl max-w-lg w-full">
        <div className="etm-chassis px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: '2px solid #0c1014' }}>
          <div className="flex items-center gap-3">
            <span className="etm-led etm-led--green" style={{ width: 10, height: 10 }} />
            <h2 className="text-xl font-bold text-[#c8d0e0] tracking-wider uppercase">Complete Task</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-[#8899aa] hover:text-[#c8d0e0] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="etm-panel--recessed p-4">
            <h3 className="font-label text-[#506070] mb-2">Task</h3>
            <p className="text-[#c8d0e0] font-medium">{task.task}</p>
            {task.subcategory && (
              <p className="text-sm text-[#506070] mt-1">{task.subcategory}</p>
            )}
          </div>

          <div className="space-y-6">
            <RatingLEDs
              value={qualityRating}
              onChange={setQualityRating}
              label="How well did you complete this task?"
              litClass="green"
            />

            <RatingLEDs
              value={easeRating}
              onChange={setEaseRating}
              label="How easy/difficult was this task?"
              litClass="amber"
            />
          </div>

          <div className="etm-panel--recessed p-4">
            <p className="text-sm text-[#8899aa]">
              <strong className="text-[#c8d0e0]">Quality:</strong> Your satisfaction with the result<br/>
              <strong className="text-[#c8d0e0]">Ease:</strong> How smooth the process was (5 = very easy, 1 = very difficult)
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a3048]">
            <button
              type="button"
              onClick={onCancel}
              className="etm-pushbutton px-6 py-2.5"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={qualityRating === null || easeRating === null}
              className="etm-pushbutton etm-pushbutton--accent px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Mark as Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskScoreBar = ({ score }) => {
  if (score === null) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[#506070]">-</span>
      </div>
    );
  }

  // Calculate percentage for bar width (normalize score to 0-100%)
  // Score ranges from negative (late) to positive (early)
  // We'll use 0 as neutral and show bars for range -1 to 1
  const normalizedScore = Math.max(-1, Math.min(1, score));
  const barPercentage = ((normalizedScore + 1) / 2) * 100;

  // Determine color based on score
  let barColor, bgColor;
  if (score > 0) {
    // Early completion - green gradient
    const intensity = Math.min(score, 1);
    const greenValue = Math.round(34 + (102 - 34) * intensity); // 22-66
    const grayValue = Math.round(197 - (197 - 160) * intensity); // C5-A0
    barColor = `rgb(${Math.round(16 + (34 - 16) * intensity)}, ${greenValue}, ${grayValue})`;
    bgColor = 'bg-[#33ff6620]';
  } else if (score < 0) {
    // Late completion - red gradient
    const intensity = Math.min(Math.abs(score), 1);
    const redValue = Math.round(239 - (239 - 220) * intensity);
    const greenValue = Math.round(68 - (68 - 38) * intensity);
    const blueValue = Math.round(68 - (68 - 35) * intensity);
    barColor = `rgb(${redValue}, ${greenValue}, ${blueValue})`;
    bgColor = 'bg-[#ff334420]';
  } else {
    // Right on time - neutral
    barColor = 'rgb(100, 116, 139)';
    bgColor = 'bg-[#1a1e2c]';
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${bgColor} rounded-full h-2 max-w-[80px]`}>
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${barPercentage}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      <span className="text-xs font-medium text-[#8899aa] w-10 text-right">
        {score.toFixed(2)}
      </span>
    </div>
  );
};

const MatrixView = ({ tasks, getQuadrant, sortTasks, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, calculateTaskScore }) => {
  const [activeTab, setActiveTab] = useState('do-first');
  const [expandedTask, setExpandedTask] = useState(null);
  const activeTasks = tasks.filter(t => t.percentComplete < 100);

  const quadrants = [
    {
      id: 'do-first',
      title: 'DO FIRST',
      shortTitle: 'Do First',
      subtitle: 'Urgent & Necessary',
      screenClass: 'etm-monitor__glass--do-first',
      monitorClass: 'etm-monitor--do-first',
      textColor: 'text-[#ff6675]',
      tabColor: '#ff3344',
      ledClass: 'etm-led--red',
      label: 'Q1 — URGENT / NECESSARY',
      // PHASE 3: Cinematic quad-panel mapping (used by desktop matrix view)
      qid: 'q1',
      designation: 'Q1 · Critical',
      cinSub: 'Urgent · Necessary'
    },
    {
      id: 'schedule',
      title: 'SCHEDULE',
      shortTitle: 'Schedule',
      subtitle: 'Necessary, Not Urgent',
      screenClass: 'etm-monitor__glass--schedule',
      monitorClass: 'etm-monitor--schedule',
      textColor: 'text-[#6ea8fe]',
      tabColor: '#00ccdd',
      ledClass: 'etm-led--cyan',
      label: 'Q2 — NOT URGENT / NECESSARY',
      qid: 'q2',
      designation: 'Q2 · Strategic',
      cinSub: 'Not Urgent · Necessary'
    },
    {
      id: 'delegate',
      title: 'DELEGATE',
      shortTitle: 'Delegate',
      subtitle: 'Urgent, Not Necessary',
      screenClass: 'etm-monitor__glass--delegate',
      monitorClass: 'etm-monitor--delegate',
      textColor: 'text-[#fbbf24]',
      tabColor: '#ff8822',
      ledClass: 'etm-led--amber',
      label: 'Q3 — URGENT / NOT NECESSARY',
      qid: 'q3',
      designation: 'Q3 · Delegate',
      cinSub: 'Urgent · Not Necessary'
    },
    {
      id: 'eliminate',
      title: 'ELIMINATE',
      shortTitle: 'Eliminate',
      subtitle: 'Neither Urgent Nor Necessary',
      screenClass: 'etm-monitor__glass--eliminate',
      monitorClass: 'etm-monitor--eliminate',
      textColor: 'text-[#8899aa]',
      tabColor: '#506070',
      ledClass: 'etm-led--muted',
      label: 'Q4 — NOT URGENT / NOT NECESSARY',
      qid: 'q4',
      designation: 'Q4 · Eliminate',
      cinSub: 'Not Urgent · Not Necessary'
    }
  ];

  // Count tasks per quadrant for tab badges
  const quadrantCounts = {};
  for (const q of quadrants) {
    quadrantCounts[q.id] = activeTasks.filter(t => getQuadrant(t) === q.id).length;
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-[#2a3048] mb-4 -mx-1">
        {quadrants.map((q) => (
          <button
            key={q.id}
            onClick={() => setActiveTab(q.id)}
            className={`flex-1 py-2.5 px-1 text-center transition-all relative ${
              activeTab === q.id ? 'text-[#c8d0e0]' : 'text-[#506070]'
            }`}
          >
            <div className="text-sm font-semibold">{q.shortTitle}</div>
            <div className="text-xs font-mono mt-0.5" style={{ color: q.tabColor }}>{quadrantCounts[q.id]}</div>
            {activeTab === q.id && (
              <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ backgroundColor: q.tabColor }} />
            )}
          </button>
        ))}
      </div>

      {/* Mobile: single monitor */}
      <div className="md:hidden">
        {quadrants.filter(q => q.id === activeTab).map((quadrant) => {
          const quadrantTasks = sortTasks(activeTasks.filter(t => getQuadrant(t) === quadrant.id));
          return (
            <div key={quadrant.id} className={`etm-monitor ${quadrant.monitorClass}`}>
              <div className="etm-monitor__hood"><div className="etm-tex-metal" /></div>
              <div className="etm-monitor__bezel">
                <div className="etm-tex-metal" />
                <div className="etm-monitor__label">{quadrant.label}</div>
                <div className="etm-monitor__well">
                  <div className={`etm-monitor__glass ${quadrant.screenClass}`}>
                    <div className="etm-monitor__status">
                      <div className="etm-monitor__designation">
                        <span className={`etm-led ${quadrant.ledClass}`} style={{ width: 6, height: 6 }} />
                        {quadrant.title}
                      </div>
                      <div className="etm-monitor__count">{quadrantTasks.length}</div>
                    </div>
                    <div className="etm-monitor__content" style={{ maxHeight: '50vh' }}>
                      {quadrantTasks.length === 0 ? (
                        <div className="etm-monitor__empty">NO TASKS</div>
                      ) : (
                        <div className="etm-monitor__tasks space-y-1">
                          {quadrantTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              calculatePriority={calculatePriority}
                              toggleComplete={toggleComplete}
                              onEdit={() => {
                                setEditingTask(task);
                                setShowForm(true);
                              }}
                              onDelete={deleteTask}
                              calculateTaskScore={calculateTaskScore}
                              isExpanded={expandedTask === task.id}
                              onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PHASE 3: Desktop matrix — acrylic-glass quad-panels in the
          cinematic .cin-workspace. Replaces the v2 CRT monitor array
          (hood/bezel/rivets/well/glass/scanlines). Per-panel chromatic
          edge + hue wash matches the demo. Task rows are now MatrixTask
          (click-to-edit) instead of expand/collapse TaskCard. */}
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

const TaskCard = ({ task, calculatePriority, toggleComplete, onEdit, onDelete, calculateTaskScore, isExpanded, onToggleExpand }) => {
  const priority = calculatePriority(task);
  const isOverdue = priority < 0;
  const dueDate = new Date(task.dueDate);
  const taskScore = calculateTaskScore(task);

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

  return (
    <div
      className={`etm-card ${isOverdue ? 'etm-card--overdue' : ''} ${task.percentComplete === 100 ? 'etm-card--completed' : ''}`}
      style={{
        padding: '6px 8px',
        background: isExpanded ? 'rgba(255,255,255,0.03)' : undefined,
        borderColor: isExpanded ? 'rgba(232,96,48,0.25)' : undefined
      }}
    >
      {/* Collapsed row — always visible */}
      <div
        className="flex items-center justify-between gap-2 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={task.percentComplete === 100}
            onChange={(e) => { e.stopPropagation(); toggleComplete(task.id); }}
            onClick={(e) => e.stopPropagation()}
            className="w-3.5 h-3.5 rounded border-[#2a3048] text-[#e86030] focus:ring-1 focus:ring-[#e86030] cursor-pointer flex-shrink-0"
          />
          <span className={`text-xs font-medium truncate ${task.percentComplete === 100 ? 'line-through text-[#506070]' : 'text-[#c8d0e0]'}`}>
            {task.task}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="etm-badge bg-[#1a1e2c] text-[#8899aa]" style={{ fontSize: '9px', padding: '1px 4px' }}>
            R{task.rank}
          </span>
          <span className={`etm-badge ${
            isOverdue
              ? 'bg-[#ff334420] text-[#ff6675]'
              : priority === 0
              ? 'bg-[#ff882220] text-[#fbbf24]'
              : priority <= 3
              ? 'bg-[#fbbf2420] text-[#fbbf24]'
              : 'bg-[#33ff6620] text-[#50c878]'
          }`} style={{ fontSize: '9px', padding: '1px 4px' }}>
            {isOverdue ? `${Math.abs(priority)}d over` : priority === 0 ? 'Today' : `${priority}d`}
          </span>
        </div>
      </div>

      {/* Expanded detail panel */}
      {isExpanded && (
        <div className="mt-1.5 pt-1.5 border-t border-[rgba(255,255,255,0.04)]" style={{ fontFamily: "'Courier New', monospace", fontSize: '10px', color: '#8899aa' }}>
          <div className="flex items-center gap-3 flex-wrap">
            <span>{task.domain}{task.subcategory ? ` / ${task.subcategory}` : ''}</span>
            <span className="text-[#506070]">{task.scope}</span>
            <span className={`uppercase ${getRecurrenceColor(task.recurringPattern || 'once')}`} style={{ fontSize: '9px', padding: '0 4px', borderRadius: '2px' }}>
              {task.recurringPattern || 'once'}
            </span>
            <span style={{ color: '#506070' }}>Due: {dueDate.toLocaleDateString()}</span>
            {task.percentComplete > 0 && task.percentComplete < 100 && (
              <span style={{ color: '#6ea8fe' }}>{task.percentComplete}%</span>
            )}
            {task.timeEstimateValue && (
              <span style={{ color: '#506070' }}>Est: {task.timeEstimateValue}{task.timeEstimateUnit === 'hours' ? 'h' : 'd'}</span>
            )}
          </div>
          {task.notes && (
            <div className="mt-1" style={{ color: '#506070', fontSize: '9px' }}>{task.notes}</div>
          )}
          {taskScore !== null && (
            <div className="mt-1">
              <span style={{ color: '#506070', fontSize: '9px' }}>Score: </span>
              <TaskScoreBar score={taskScore} />
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="etm-pushbutton" style={{ padding: '2px 6px', fontSize: '9px' }}
            >
              <Edit2 size={10} /> Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="etm-pushbutton text-[#ff6675]" style={{ padding: '2px 6px', fontSize: '9px' }}
            >
              <Trash2 size={10} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * PHASE 4: CinematicViewPanel — acrylic-glass drop-in replacement
 * for MonitorShell. Used by List / Gantt / Calendar / Analytics.
 * Title + count appear on the left, optional toolbar on the right,
 * children fill the scrollable body. The 4-stop quadrant-rainbow top
 * edge is the canonical "all-quadrant view" signature from the demo.
 */
const CinematicViewPanel = ({ title, count, sub, toolbar, children }) => (
  <div className="cin-view-panel">
    <div className="cin-view-panel__head">
      <div className="cin-view-panel__title">
        {title}
        {count != null && <span className="cin-view-panel__count">{count}</span>}
        {sub && <span className="cin-view-panel__sub">{sub}</span>}
      </div>
      {toolbar && <div className="cin-view-panel__toolbar">{toolbar}</div>}
    </div>
    <div className="cin-view-panel__body">{children}</div>
  </div>
);

// Reusable single-monitor shell — v2 CRT housing. Kept for any legacy
// callers (none currently); Phase 4 retired its production use in favor
// of CinematicViewPanel above. Safe to delete in Phase 5 cleanup.
const MonitorShell = ({ title, label, ledClass, screenClass, monitorClass, toolbar, children }) => (
  <div className={`etm-monitor ${monitorClass} h-full`}>
    <div className="etm-monitor__hood"><div className="etm-tex-metal" /></div>
    <div className="etm-monitor__bezel">
      <div className="etm-tex-metal" />
      <div className="etm-tex-grain" />
      <div className="etm-monitor__label">{label}</div>
      <div className="etm-monitor__rivet" style={{ top: 5, left: 5 }} />
      <div className="etm-monitor__rivet" style={{ top: 5, right: 5 }} />
      <div className="etm-monitor__rivet" style={{ bottom: 5, left: 5 }} />
      <div className="etm-monitor__rivet" style={{ bottom: 5, right: 5 }} />
      <div className="etm-monitor__well">
        <div className={`etm-monitor__glass ${screenClass}`}>
          <div className="etm-monitor__status">
            <div className="etm-monitor__designation">
              <span className={`etm-led ${ledClass}`} style={{ width: 6, height: 6 }} />
              {title}
            </div>
            {toolbar && <div className="flex items-center gap-1.5">{toolbar}</div>}
          </div>
          <div className="etm-monitor__content">
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Map v2 quadrant ids -> cinematic qid (q1..q4)
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
const ListView = ({ tasks, filters, setFilters, sortBy, setSortBy, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, calculateTaskScore, settings }) => {
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
        <div className="list-table">
          <div className="list-row list-row--header">
            <div></div>
            <div>Task · Project</div>
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
  const [formData, setFormData] = useState(
    task || {
      task: '',
      domain: 'Teaching',
      scope: 'Professional',
      subcategory: '',
      isUrgent: false,
      isNecessary: false,
      rank: 2,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: defaultDueDate || '',
      percentComplete: 0,
      isRecurring: false,
      recurringPattern: 'once',
      notes: '',
      qualityRating: null,
      easeRating: null,
      timeEstimateValue: null,
      timeEstimateUnit: 'hours'
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.task || !formData.dueDate) {
      alert('Please fill in task name and due date');
      return;
    }
    onSave(formData);
  };

  const subcategoryOptions = settings.subcategories[formData.domain] || [];

  return (
    <div className="etm-modal-backdrop p-0 sm:p-4">
      <div className="etm-modal rounded-none sm:rounded-xl max-w-2xl w-full max-h-[100vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 etm-chassis px-6 py-4 flex items-center justify-between sm:rounded-t-xl" style={{ borderBottom: '2px solid #0c1014' }}>
          <h2 className="text-xl font-bold text-[#c8d0e0] tracking-wider uppercase">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onCancel}
            className="text-[#8899aa] hover:text-[#c8d0e0] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-semibold text-[#8899aa] mb-2">
              Task Name *
            </label>
            <input
              type="text"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              className="etm-input"
              placeholder="Enter task description"
              required
            />
          </div>

          {/* Urgency and Necessity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="etm-panel--recessed p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                  className="w-5 h-5 rounded border-[#2a3048] text-[#e86030] focus:ring-2 focus:ring-[#e86030]"
                />
                <div>
                  <div className="font-semibold text-[#c8d0e0]">Urgent</div>
                  <div className="text-xs text-[#506070]">Time-sensitive</div>
                </div>
              </label>
            </div>
            <div className="etm-panel--recessed p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNecessary}
                  onChange={(e) => setFormData({ ...formData, isNecessary: e.target.checked })}
                  className="w-5 h-5 rounded border-[#2a3048] text-[#e86030] focus:ring-2 focus:ring-[#e86030]"
                />
                <div>
                  <div className="font-semibold text-[#c8d0e0]">Necessary</div>
                  <div className="text-xs text-[#506070]">Important/Critical</div>
                </div>
              </label>
            </div>
          </div>

          {/* Domain, Scope, and Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#8899aa] mb-2">
                Domain
              </label>
              <select
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value, subcategory: '' })}
                className="etm-input"
              >
                {(settings.domains || []).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#8899aa] mb-2">
                Scope
              </label>
              <select
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                className="etm-input"
              >
                {(settings.scopes || []).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#8899aa] mb-2">
                Subcategory
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="etm-input"
              >
                <option value="">Select...</option>
                {subcategoryOptions.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates and Rank */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#8899aa] mb-2">
                Assigned Date
              </label>
              <input
                type="date"
                value={formData.assignedDate}
                onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                className="etm-input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#8899aa] mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="etm-input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#8899aa] mb-2">
                Rank (1-3)
              </label>
              <select
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                className="etm-input"
              >
                <option value={1}>1 - Highest</option>
                <option value={2}>2 - Medium</option>
                <option value={3}>3 - Lower</option>
              </select>
            </div>
          </div>

          {/* Time Estimate */}
          <div>
            <label className="block text-sm font-semibold text-[#8899aa] mb-2">
              Time Estimate (Optional)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.timeEstimateValue || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    timeEstimateValue: e.target.value ? parseFloat(e.target.value) : null
                  })}
                  className="etm-input"
                  placeholder="e.g., 5, 2.5"
                />
              </div>
              <div>
                <select
                  value={formData.timeEstimateUnit}
                  onChange={(e) => setFormData({ ...formData, timeEstimateUnit: e.target.value })}
                  className="etm-input"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-[#506070] mt-2 italic">
              5-Minute Rule: If a task takes less than 5 minutes, just do it now instead of scheduling it.
            </p>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-semibold text-[#8899aa] mb-2">
              Progress: {formData.percentComplete}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={formData.percentComplete}
              onChange={(e) => setFormData({ ...formData, percentComplete: parseInt(e.target.value) })}
              className="w-full h-2 bg-[#1a1e2c] rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: '#e86030' }}
            />
          </div>

          {/* Recurring Pattern */}
          <div className="bg-[#0a0e12] border-2 border-[#2a3048] rounded-lg p-4">
            <label className="block text-sm font-semibold text-[#8899aa] mb-3">
              Recurrence Pattern
            </label>
            <select
              value={formData.recurringPattern || 'once'}
              onChange={(e) => setFormData({
                ...formData,
                recurringPattern: e.target.value,
                isRecurring: e.target.value !== 'once'
              })}
              className="etm-input"
            >
              <option value="once">Once (one-time task)</option>
              <option value="daily">Daily (every day)</option>
              <option value="weekly">Weekly (every week)</option>
              <option value="monthly">Monthly (every month)</option>
              <option value="yearly">Yearly (annually)</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-[#8899aa] mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="etm-input resize-none"
              rows="3"
              placeholder="Additional details..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a3048]">
            <button
              type="button"
              onClick={onCancel}
              className="etm-pushbutton px-6 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="etm-pushbutton etm-pushbutton--accent px-6 py-2.5"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
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
  const bodyRef = React.useRef(null);
  const [trackGeom, setTrackGeom] = React.useState({ left: 0, width: 0 });

  const WINDOW_BACK = 3;
  const WINDOW_FWD  = 17;
  const WINDOW_TOTAL = WINDOW_BACK + 1 + WINDOW_FWD;   // 21

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dayOffset = (d) => {
    const dd = new Date(d); dd.setHours(0,0,0,0);
    return Math.round((dd - today) / 86400000);
  };

  const visible = tasks.filter(t => {
    if (t.percentComplete === 100) return false;
    if (!t.dueDate) return false;
    if (filterQuad !== 'all' && getQuadrant(t) !== filterQuad) return false;
    const off = dayOffset(t.dueDate);
    return off >= -WINDOW_BACK && off <= WINDOW_FWD;
  }).sort((a, b) => dayOffset(a.dueDate) - dayOffset(b.dueDate));

  React.useEffect(() => {
    if (!bodyRef.current) return;
    const update = () => {
      const track = bodyRef.current?.querySelector('.gantt-row__track');
      if (track) {
        const r = track.getBoundingClientRect();
        const body = bodyRef.current.getBoundingClientRect();
        setTrackGeom({ left: r.left - body.left, width: r.width });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(bodyRef.current);
    return () => ro.disconnect();
  }, [visible.length]);

  const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const axisDays = [];
  for (let i = -WINDOW_BACK; i <= WINDOW_FWD; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const dow = d.getDay();
    let text;
    if (i === 0)          text = 'TODAY';
    else if (i % 3 === 0) text = `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`;
    else                  text = `${d.getDate()}`;
    axisDays.push({ i, text, isToday: i === 0, isWeekend: dow === 0 || dow === 6 });
  }

  return (
    <div className="cin-view-panel">
      <div className="cin-view-panel__head">
        <div className="cin-view-panel__title">
          Schedule · Timeline
          <span className="cin-view-panel__count">{visible.length}</span>
          <span className="cin-view-panel__sub">21-day window</span>
        </div>
        <div className="cin-view-panel__toolbar">
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

      <div className="cin-view-panel__body">
        <div className="gantt-timeline">
          <div className="gantt-axis">
            <div className="gantt-axis__spacer" />
            <div className="gantt-axis__days">
              {axisDays.map(d => (
                <div
                  key={d.i}
                  className={'gantt-axis__day'
                    + (d.isToday   ? ' gantt-axis__day--today'   : '')
                    + (d.isWeekend ? ' gantt-axis__day--weekend' : '')}
                >{d.text}</div>
              ))}
            </div>
          </div>

          <div className="gantt-body" ref={bodyRef}>
            {visible.length === 0 && (
              <div className="list-empty" style={{ gridColumn: '1 / 3' }}>
                — No scheduled tasks in this window —
              </div>
            )}
            {visible.map(t => {
              const dueOff = dayOffset(t.dueDate);
              const isOverdue = dueOff < 0;
              const isDone = t.percentComplete === 100;
              const startOff = isOverdue ? dueOff : 0;
              const endOff   = isOverdue ? 0 : dueOff;
              const leftPct  = ((startOff + WINDOW_BACK) / WINDOW_TOTAL) * 100;
              const widthPct = Math.max(((endOff - startOff + 1) / WINDOW_TOTAL) * 100, 100 / WINDOW_TOTAL);
              const qid = QID_BY_QUAD[getQuadrant(t)] || 'q4';
              const barClass = 'gantt-bar gantt-bar--' + (isOverdue ? 'overdue' : qid)
                + (isDone ? ' gantt-bar--done' : '');
              const dueDateText = new Date(t.dueDate).toLocaleDateString();
              return (
                <React.Fragment key={t.id}>
                  <div
                    className="gantt-row__label"
                    onClick={() => { setEditingTask(t); setShowForm(true); }}
                  >
                    <div className="gantt-row__label-name" title={t.task}>{t.task}</div>
                    <div className="gantt-row__label-meta">{(t.subcategory || t.domain) + ' · ' + dueDateText}</div>
                  </div>
                  <div className="gantt-row__track">
                    <div
                      className={barClass}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      onClick={() => { setEditingTask(t); setShowForm(true); }}
                    >
                      {t.rank ? `R${t.rank}` : ''}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            {visible.length > 0 && trackGeom.width > 0 && (
              <div
                className="gantt-today-line"
                style={{
                  left: `${trackGeom.left + (WINDOW_BACK / WINDOW_TOTAL) * trackGeom.width}px`,
                  top: 0,
                  bottom: 0
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
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
                  return (
                    <div
                      key={t.id}
                      className={`cal-task-pill cal-task-pill--${qid}`}
                      title={t.task + (t.subcategory ? ` (${t.subcategory})` : '')}
                      onClick={(e) => { e.stopPropagation(); setEditingTask(t); setShowForm(true); }}
                    >
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
