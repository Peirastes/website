import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Calendar, ChevronDown, ChevronLeft, ChevronRight, Download, Upload, Settings, AlertCircle, CheckCircle, LayoutGrid, List, Shield, Clock, Archive, Repeat, BarChart3, TrendingUp, RefreshCw } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);
import { PINModal } from './components/PINModal';

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
    return <PINModal onUnlock={() => {
      setJustUnlocked(true);
      setIsUnlocked(true);
      // Trigger reveal after vault doors are mostly open (doors take 1.6s)
      setTimeout(() => setAppRevealed(true), 1200);
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
    <div className={`h-screen flex flex-col text-[#c8d0e0] overflow-hidden ${justUnlocked && !appRevealed ? 'etm-reveal-start' : ''} ${justUnlocked && appRevealed ? 'etm-reveal-animate' : ''}`} style={{
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      background: 'radial-gradient(ellipse at 50% 30%, #1a2024, #0a0e12 60%, #040608)'
    }}>
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

      {/* Top: LED Readout Strip */}
      <div className="etm-readout-strip" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 sm:py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              {[
                { label: 'Q1', cls: 'etm-readout__value--red', led: 'etm-led--red', val: stats.byQuadrant['do-first'] },
                { label: 'Q2', cls: 'etm-readout__value--cyan', led: 'etm-led--cyan', val: stats.byQuadrant['schedule'] },
                { label: 'Q3', cls: 'etm-readout__value--amber', led: 'etm-led--amber', val: stats.byQuadrant['delegate'] },
                { label: 'Q4', cls: 'etm-readout__value--muted', led: 'etm-led--muted', val: stats.byQuadrant['eliminate'] },
              ].map(r => (
                <div key={r.label} className="etm-readout" style={{ padding: '4px 8px' }}>
                  <div className="etm-readout__label"><span className={`etm-led ${r.led}`} /> {r.label}</div>
                  <div className={`etm-readout__value ${r.cls}`} style={{ fontSize: '18px' }}>{r.val}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              {stats.overdue.length > 0 && (
                <div className="etm-readout" style={{ padding: '4px 8px' }}>
                  <div className="etm-readout__label"><span className="etm-led etm-led--red etm-led--pulse" /> Overdue</div>
                  <div className="etm-readout__value etm-readout__value--red" style={{ fontSize: '18px' }}>{stats.overdue.length}</div>
                </div>
              )}
              {stats.dueToday.length > 0 && (
                <div className="etm-readout" style={{ padding: '4px 8px' }}>
                  <div className="etm-readout__label"><span className="etm-led etm-led--amber etm-led--pulse" /> Today</div>
                  <div className="etm-readout__value etm-readout__value--amber" style={{ fontSize: '18px' }}>{stats.dueToday.length}</div>
                </div>
              )}
              <div className="hidden sm:block etm-nameplate">Peirastes Mk-II</div>
            </div>
          </div>
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
          <MonitorShell
            title="LIST VIEW" label="TASK LIST — ALL QUADRANTS"
            ledClass="etm-led--cyan" screenClass="etm-monitor__glass--schedule" monitorClass="etm-monitor--schedule"
          >
            <ListView
              tasks={tasks} filters={filters} setFilters={setFilters}
              sortBy={sortBy} setSortBy={setSortBy} getQuadrant={getQuadrant}
              calculatePriority={calculatePriority} toggleComplete={toggleComplete}
              setEditingTask={setEditingTask} setShowForm={setShowForm}
              deleteTask={deleteTask} calculateTaskScore={calculateTaskScore}
              settings={settings}
            />
          </MonitorShell>
        ) : view === 'gantt' ? (
          <MonitorShell
            title="GANTT CHART" label="TIMELINE — TASK SCHEDULING"
            ledClass="etm-led--amber" screenClass="etm-monitor__glass--delegate" monitorClass="etm-monitor--delegate"
          >
            <GanttView
              tasks={tasks} getQuadrant={getQuadrant}
              calculatePriority={calculatePriority} toggleComplete={toggleComplete}
              setEditingTask={setEditingTask} setShowForm={setShowForm}
              deleteTask={deleteTask} settings={settings}
            />
          </MonitorShell>
        ) : view === 'calendar' ? (
          <MonitorShell
            title="CALENDAR" label="MONTHLY — TASK SCHEDULE"
            ledClass="etm-led--green" screenClass="etm-monitor__glass--schedule" monitorClass="etm-monitor--schedule"
          >
            <CalendarView
              tasks={tasks} filters={filters} setFilters={setFilters}
              getQuadrant={getQuadrant} calculatePriority={calculatePriority}
              toggleComplete={toggleComplete} setEditingTask={setEditingTask}
              setShowForm={setShowForm} deleteTask={deleteTask}
              setDefaultDueDate={setDefaultDueDate} settings={settings}
            />
          </MonitorShell>
        ) : (
          <MonitorShell
            title="ANALYTICS" label="PERFORMANCE — HISTORICAL DATA"
            ledClass="etm-led--green" screenClass="etm-monitor__glass--schedule" monitorClass="etm-monitor--schedule"
          >
            <AnalyticsView
              tasks={tasks} calculateTaskScore={calculateTaskScore}
            />
          </MonitorShell>
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
      label: 'Q1 — URGENT / NECESSARY'
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
      label: 'Q2 — NOT URGENT / NECESSARY'
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
      label: 'Q3 — URGENT / NOT NECESSARY'
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
      label: 'Q4 — NOT URGENT / NOT NECESSARY'
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

      {/* Desktop: 2x2 CRT monitor array */}
      <div className="hidden md:grid grid-cols-2 gap-2 flex-1 min-h-0" style={{ gridTemplateRows: '1fr 1fr' }}>
        {quadrants.map((quadrant) => {
          const quadrantTasks = sortTasks(activeTasks.filter(t => getQuadrant(t) === quadrant.id));
          return (
            <div key={quadrant.id} className={`etm-monitor ${quadrant.monitorClass}`}>
              <div className="etm-monitor__hood">
                <div className="etm-tex-metal" />
              </div>
              <div className="etm-monitor__bezel">
                <div className="etm-tex-metal" />
                <div className="etm-tex-grain" />
                <div className="etm-monitor__label">{quadrant.label}</div>
                <div className="etm-monitor__rivet" style={{ top: 5, left: 5 }} />
                <div className="etm-monitor__rivet" style={{ top: 5, right: 5 }} />
                <div className="etm-monitor__rivet" style={{ bottom: 5, left: 5 }} />
                <div className="etm-monitor__rivet" style={{ bottom: 5, right: 5 }} />

                <div className="etm-monitor__well">
                  <div className={`etm-monitor__glass ${quadrant.screenClass}`}>
                    <div className="etm-monitor__status">
                      <div className="etm-monitor__designation">
                        <span className={`etm-led ${quadrant.ledClass}`} style={{ width: 6, height: 6 }} />
                        {quadrant.title}
                      </div>
                      <div className="etm-monitor__count">{quadrantTasks.length}</div>
                    </div>
                    <div className="etm-monitor__content">
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

// Reusable single-monitor shell for non-matrix views
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

const ListView =({ tasks, filters, setFilters, sortBy, setSortBy, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, calculateTaskScore, settings }) => {
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

  return (
    <div className="p-2 space-y-2" style={{ fontFamily: "'Courier New', monospace", fontSize: '10px' }}>
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-[rgba(255,255,255,0.04)]">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="etm-input text-sm sm:text-base"
        >
          <option value="active">Active Tasks</option>
          <option value="completed">Completed</option>
          <option value="all">All Tasks</option>
        </select>

        <select
          value={filters.quadrant}
          onChange={(e) => setFilters({ ...filters, quadrant: e.target.value })}
          className="etm-input text-sm sm:text-base"
        >
          <option value="all">All Quadrants</option>
          <option value="do-first">Do First</option>
          <option value="schedule">Schedule</option>
          <option value="delegate">Delegate</option>
          <option value="eliminate">Eliminate</option>
        </select>

        <select
          value={filters.domain}
          onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
          className="etm-input text-sm sm:text-base"
        >
          <option value="all">All Domains</option>
          {(settings.domains || []).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={filters.scope}
          onChange={(e) => setFilters({ ...filters, scope: e.target.value })}
          className="etm-input text-sm sm:text-base"
        >
          <option value="all">All Scopes</option>
          {(settings.scopes || []).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filters.recurrence}
          onChange={(e) => setFilters({ ...filters, recurrence: e.target.value })}
          className="etm-input text-sm sm:text-base"
        >
          <option value="all">All Recurrence</option>
          <option value="once">Once</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <div className="col-span-2 sm:ml-auto flex items-center gap-2">
          <span className="text-sm text-[#506070] font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="etm-input text-sm sm:text-base"
          >
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="domain">Domain</option>
            <option value="recurrence">Recurrence</option>
          </select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {sortedTasks.map((task) => {
          const priority = calculatePriority(task);
          const isOverdue = priority < 0;
          const quadrant = getQuadrant(task);
          return (
            <div key={task.id} className={`etm-panel p-4 ${task.percentComplete === 100 ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.percentComplete === 100}
                  onChange={() => toggleComplete(task.id)}
                  className="w-5 h-5 rounded border-[#2a3048] text-[#e86030] focus:ring-[#e86030] mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${task.percentComplete === 100 ? 'line-through text-[#506070]' : 'text-[#c8d0e0]'}`}>
                    {task.task}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      quadrant === 'do-first' ? 'bg-[#ff334420] text-[#ff6675]'
                      : quadrant === 'schedule' ? 'bg-[#00ccdd20] text-[#6ea8fe]'
                      : quadrant === 'delegate' ? 'bg-[#ff882220] text-[#fbbf24]'
                      : 'bg-[#1a1e2c] text-[#8899aa]'
                    }`}>{quadrantLabels[quadrant]}</span>
                    <span className="text-xs text-[#506070]">{task.domain}</span>
                    {task.dueDate && (
                      <span className={`text-xs font-mono ${isOverdue ? 'text-[#ff6675] font-semibold' : 'text-[#506070]'}`}>
                        {isOverdue ? `${Math.abs(priority)}d overdue` : priority === 0 ? 'Today' : `${priority}d`}
                      </span>
                    )}
                  </div>
                  {task.percentComplete > 0 && task.percentComplete < 100 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="etm-progress flex-1">
                        <div className="etm-progress__fill" style={{ width: `${task.percentComplete}%` }} />
                      </div>
                      <span className="text-xs text-[#506070]">{task.percentComplete}%</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setEditingTask(task); setShowForm(true); }} className="p-1.5 text-[#506070] hover:text-[#e86030] rounded">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="p-1.5 text-[#506070] hover:text-[#ff6675] rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {sortedTasks.length === 0 && (
          <div className="text-center py-12 text-[#506070]">No tasks found matching your filters</div>
        )}
      </div>

      {/* Tasks Table */}
      <div className="hidden sm:block etm-panel overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0a0e12] border-b border-[#2a3048]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#506070] uppercase tracking-wider w-12"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#506070] uppercase tracking-wider">Task</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#506070] uppercase tracking-wider">Quadrant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#506070] uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#506070] uppercase tracking-wider">Recurrence</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#506070] uppercase tracking-wider">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#506070] uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#506070] uppercase tracking-wider">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#506070] uppercase tracking-wider">Score</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#506070] uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1e2c]">
            {sortedTasks.map((task) => {
              const priority = calculatePriority(task);
              const isOverdue = priority < 0;
              const recurrencePattern = task.recurringPattern || 'once';

              return (
                <tr key={task.id} className={`hover:bg-[#2e3438] transition-colors ${task.percentComplete === 100 ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={task.percentComplete === 100}
                      onChange={() => toggleComplete(task.id)}
                      className="w-5 h-5 rounded border-[#2a3048] text-[#e86030] focus:ring-2 focus:ring-[#e86030] cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-semibold ${task.percentComplete === 100 ? 'line-through text-[#506070]' : 'text-[#c8d0e0]'}`}>
                      {task.task}
                    </div>
                    <div className="text-xs text-[#506070] mt-1">{task.subcategory}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      getQuadrant(task) === 'do-first'
                        ? 'bg-[#ff334420] text-[#ff6675]'
                        : getQuadrant(task) === 'schedule'
                        ? 'bg-[#00ccdd20] text-[#6ea8fe]'
                        : getQuadrant(task) === 'delegate'
                        ? 'bg-[#ff882220] text-[#fbbf24]'
                        : 'bg-[#1a1e2c] text-[#8899aa]'
                    }`}>
                      {quadrantLabels[getQuadrant(task)]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#8899aa]">{task.domain}</td>
                  <td className="px-4 py-3">
                    <span className={`etm-badge uppercase ${getRecurrenceColor(recurrencePattern)}`}>
                      {recurrencePattern}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#8899aa]">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`priority-badge px-2 py-1 rounded ${
                      isOverdue
                        ? 'bg-[#ff334420] text-[#ff6675]'
                        : priority === 0
                        ? 'bg-[#ff882220] text-[#fbbf24]'
                        : priority <= 3
                        ? 'bg-[#fbbf2420] text-[#fbbf24]'
                        : 'bg-[#33ff6620] text-[#50c878]'
                    }`}>
                      {isOverdue ? `${Math.abs(priority)}d overdue` : priority === 0 ? 'Today' : `${priority}d`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="etm-progress flex-1 max-w-[80px]">
                        <div
                          className={`etm-progress__fill ${task.percentComplete === 100 ? 'etm-progress__fill--complete' : ''}`}
                          style={{ width: `${task.percentComplete}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#506070] font-medium w-8">{task.percentComplete}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TaskScoreBar score={calculateTaskScore(task)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setShowForm(true);
                        }}
                        className="p-1.5 text-[#506070] hover:text-[#e86030] hover:bg-[#e8603015] rounded transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-[#506070] hover:text-[#ff6675] hover:bg-[#ff334415] rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedTasks.length === 0 && (
          <div className="text-center py-12 text-[#506070]">
            No tasks found matching your filters
          </div>
        )}
      </div>
    </div>
  );
};

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
const AnalyticsView = ({ tasks, calculateTaskScore }) => {
  const completed = tasks.filter(t => t.percentComplete === 100 && t.completedDate);
  const withRatings = completed.filter(t => t.qualityRating != null && t.easeRating != null);
  const withDates = completed.filter(t => t.assignedDate && t.dueDate && t.completedDate && t.assignedDate !== t.dueDate);

  if (completed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#506070]">
        <TrendingUp size={48} strokeWidth={1.5} />
        <p className="mt-4 text-lg font-medium">No completed tasks yet</p>
        <p className="text-sm">Complete some tasks to see analytics here.</p>
      </div>
    );
  }

  // --- Summary stats ---
  const avgQuality = withRatings.length > 0
    ? (withRatings.reduce((s, t) => s + t.qualityRating, 0) / withRatings.length)
    : null;
  const avgEase = withRatings.length > 0
    ? (withRatings.reduce((s, t) => s + t.easeRating, 0) / withRatings.length)
    : null;

  const scores = withDates.map(t => calculateTaskScore(t)).filter(s => s !== null);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  const durationErrors = withDates.map(t => {
    const due = new Date(t.dueDate).getTime();
    const done = new Date(t.completedDate).getTime();
    return (done - due) / (1000 * 60 * 60 * 24);
  });
  const sortedErrors = [...durationErrors].sort((a, b) => a - b);
  const medianError = sortedErrors.length > 0
    ? sortedErrors[Math.floor(sortedErrors.length / 2)]
    : null;

  // --- Score distribution data ---
  const qualityCounts = [0, 0, 0, 0, 0];
  const easeCounts = [0, 0, 0, 0, 0];
  withRatings.forEach(t => {
    qualityCounts[t.qualityRating - 1]++;
    easeCounts[t.easeRating - 1]++;
  });

  const scoreDistData = {
    labels: ['1', '2', '3', '4', '5'],
    datasets: [
      {
        label: 'Quality',
        data: qualityCounts,
        backgroundColor: 'rgba(80, 200, 120, 0.6)',
        borderColor: '#50c878',
        borderWidth: 1,
      },
      {
        label: 'Ease',
        data: easeCounts,
        backgroundColor: 'rgba(0, 204, 221, 0.6)',
        borderColor: '#00ccdd',
        borderWidth: 1,
      },
    ],
  };

  const scoreDistOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Score Distribution', font: { size: 14 } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
      x: { title: { display: true, text: 'Rating' } },
    },
  };

  // --- Duration accuracy data ---
  const recentWithDates = [...withDates]
    .sort((a, b) => new Date(a.completedDate) - new Date(b.completedDate))
    .slice(-20);

  const durationData = {
    labels: recentWithDates.map(t => t.task.length > 20 ? t.task.slice(0, 20) + '...' : t.task),
    datasets: [
      {
        label: 'Planned (days)',
        data: recentWithDates.map(t => {
          const assigned = new Date(t.assignedDate).getTime();
          const due = new Date(t.dueDate).getTime();
          return Math.round((due - assigned) / (1000 * 60 * 60 * 24));
        }),
        backgroundColor: 'rgba(0, 204, 221, 0.5)',
        borderColor: '#00ccdd',
        borderWidth: 1,
      },
      {
        label: 'Actual (days)',
        data: recentWithDates.map(t => {
          const assigned = new Date(t.assignedDate).getTime();
          const done = new Date(t.completedDate).getTime();
          return Math.round((done - assigned) / (1000 * 60 * 60 * 24));
        }),
        backgroundColor: recentWithDates.map(t => {
          const due = new Date(t.dueDate).getTime();
          const done = new Date(t.completedDate).getTime();
          return done <= due ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
        }),
        borderColor: recentWithDates.map(t => {
          const due = new Date(t.dueDate).getTime();
          const done = new Date(t.completedDate).getTime();
          return done <= due ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
        }),
        borderWidth: 1,
      },
    ],
  };

  const durationOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Duration: Planned vs Actual (recent 20)', font: { size: 14 } },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Days' } },
      x: { ticks: { maxRotation: 45, minRotation: 45 } },
    },
  };

  // --- Trends data ---
  const chronological = [...withRatings]
    .filter(t => t.completedDate)
    .sort((a, b) => new Date(a.completedDate) - new Date(b.completedDate));

  const rollingAvg = (arr, windowSize) => {
    return arr.map((_, i) => {
      const start = Math.max(0, i - windowSize + 1);
      const window = arr.slice(start, i + 1);
      return window.reduce((a, b) => a + b, 0) / window.length;
    });
  };

  const trendLabels = chronological.map(t => {
    const d = new Date(t.completedDate);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const qualityValues = chronological.map(t => t.qualityRating);
  const easeValues = chronological.map(t => t.easeRating);
  const scoreValues = chronological.map(t => {
    const s = calculateTaskScore(t);
    return s !== null ? Math.round(s * 5 * 100) / 100 : null;
  });

  const windowSize = Math.min(5, chronological.length);

  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Quality (rolling avg)',
        data: rollingAvg(qualityValues, windowSize),
        borderColor: '#50c878',
        backgroundColor: 'rgba(80, 200, 120, 0.1)',
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Ease (rolling avg)',
        data: rollingAvg(easeValues, windowSize),
        borderColor: '#00ccdd',
        backgroundColor: 'rgba(0, 204, 221, 0.1)',
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Task Score (scaled 0-5)',
        data: rollingAvg(scoreValues.map(v => v ?? 0), windowSize),
        borderColor: '#e86030',
        backgroundColor: 'rgba(232, 96, 48, 0.1)',
        tension: 0.3,
        fill: false,
        borderDash: [5, 5],
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Trends Over Time (rolling average)', font: { size: 14 } },
    },
    scales: {
      y: { min: 0, max: 5, title: { display: true, text: 'Rating / Score' } },
    },
  };

  const statCards = [
    { label: 'Completed', value: completed.length, color: 'text-[#e86030]' },
    { label: 'Avg Quality', value: avgQuality !== null ? avgQuality.toFixed(1) : '—', color: 'text-[#50c878]' },
    { label: 'Avg Ease', value: avgEase !== null ? avgEase.toFixed(1) : '—', color: 'text-[#00ccdd]' },
    { label: 'Avg Score', value: avgScore !== null ? avgScore.toFixed(2) : '—', color: 'text-[#e86030]' },
    { label: 'Deadline Error', value: medianError !== null ? `${medianError > 0 ? '+' : ''}${medianError.toFixed(1)}d` : '—', color: medianError !== null && medianError > 0 ? 'text-[#ff3344]' : 'text-[#50c878]' },
  ];

  return (
    <div className="p-2 space-y-3" style={{ fontFamily: "'Courier New', monospace", fontSize: '10px' }}>
      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-2">
        {statCards.map((card) => (
          <div key={card.label} className="text-center p-2 border border-[rgba(255,255,255,0.04)] rounded" style={{ background: 'rgba(255,255,255,0.01)' }}>
            <p style={{ fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#506070' }}>{card.label}</p>
            <p className={`text-lg font-bold mt-0.5 font-data ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Score distribution */}
      {withRatings.length > 0 && (
        <div className="p-3 border border-[rgba(255,255,255,0.04)] rounded" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <Bar data={scoreDistData} options={scoreDistOptions} />
        </div>
      )}

      {/* Duration accuracy */}
      {recentWithDates.length > 0 && (
        <div className="p-3 border border-[rgba(255,255,255,0.04)] rounded" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <Bar data={durationData} options={durationOptions} />
        </div>
      )}

      {/* Trends */}
      {chronological.length >= 3 && (
        <div className="p-3 border border-[rgba(255,255,255,0.04)] rounded" style={{ background: 'rgba(255,255,255,0.01)' }}>
          <Line data={trendData} options={trendOptions} />
        </div>
      )}
    </div>
  );
};

const GanttView = ({ tasks, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, settings }) => {
  const [filters, setFilters] = useState({
    quadrant: 'all',
    domain: 'all',
    scope: 'all',
    status: 'active'
  });
  const [groupBy, setGroupBy] = useState('quadrant');
  const [timelineScale, setTimelineScale] = useState(30); // pixels per day
  const [tooltip, setTooltip] = useState(null);
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Timeline calculation functions
  const calculateTaskTimeline = (task) => {
    const dueDate = new Date(task.dueDate);

    if (!task.timeEstimateValue) {
      return {
        start: dueDate,
        end: dueDate,
        isMilestone: true,
        duration: 0
      };
    }

    let estimateDays;
    if (task.timeEstimateUnit === 'hours') {
      estimateDays = task.timeEstimateValue / 8;
    } else {
      estimateDays = task.timeEstimateValue;
    }

    const startDate = new Date(dueDate);
    startDate.setDate(startDate.getDate() - estimateDays);

    return {
      start: startDate,
      end: dueDate,
      isMilestone: false,
      duration: estimateDays
    };
  };

  // Determine which zoom level matches current scale
  const getNearestZoomLevel = () => {
    if (timelineScale >= 120) return 'daily';
    if (timelineScale >= 40) return 'weekly';
    if (timelineScale >= 12) return 'monthly';
    if (timelineScale >= 2.5) return 'quarterly';
    return 'yearly';
  };

  // Handle mouse wheel zoom (Alt+scroll)
  const handleChartWheel = (e) => {
    if (!e.altKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.85 : 1.15; // scroll down = zoom out
    const newScale = timelineScale * delta;
    setTimelineScale(Math.max(1, Math.min(300, newScale)));
  };

  const getVisibleDateRange = () => {
    let minDate = showHistory ? null : new Date();
    let maxDate = new Date();

    // Set default range based on current zoom level
    const defaultDays = (() => {
      const level = getNearestZoomLevel();
      const ranges = { daily: 3, weekly: 28, monthly: 84, quarterly: 365, yearly: 730 };
      return ranges[level] || 90;
    })();
    maxDate.setDate(maxDate.getDate() + defaultDays);

    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const timeline = calculateTaskTimeline(task);

        if (showHistory) {
          // Include historical dates: use assignedDate if available
          const startDate = task.assignedDate ? new Date(task.assignedDate) : timeline.start;
          if (!minDate || startDate < minDate) minDate = startDate;
        } else {
          // Only adjust minDate if tasks start before today
          const today = new Date();
          if (timeline.start < today && timeline.start < minDate) {
            minDate = timeline.start;
          }
        }

        if (dueDate > maxDate) maxDate = dueDate;
      }
    });

    // Ensure minDate is set (fallback to today if no tasks)
    if (!minDate) minDate = new Date();

    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);

    return { minDate, maxDate };
  };

  const filteredTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    if (filters.status === 'active' && task.percentComplete === 100) return false;
    if (filters.status === 'completed' && task.percentComplete < 100) return false;
    if (filters.quadrant !== 'all' && getQuadrant(task) !== filters.quadrant) return false;
    if (filters.domain !== 'all' && task.domain !== filters.domain) return false;
    if (filters.scope !== 'all' && task.scope !== filters.scope) return false;
    return true;
  });

  const groupedTasks = () => {
    if (groupBy === 'quadrant') {
      return {
        'do-first': filteredTasks.filter(t => getQuadrant(t) === 'do-first'),
        'schedule': filteredTasks.filter(t => getQuadrant(t) === 'schedule'),
        'delegate': filteredTasks.filter(t => getQuadrant(t) === 'delegate'),
        'eliminate': filteredTasks.filter(t => getQuadrant(t) === 'eliminate')
      };
    } else if (groupBy === 'scope') {
      const grouped = {};
      filteredTasks.forEach(task => {
        const s = task.scope || 'Professional';
        if (!grouped[s]) grouped[s] = [];
        grouped[s].push(task);
      });
      return grouped;
    } else {
      const grouped = {};
      filteredTasks.forEach(task => {
        const d = task.domain || 'Teaching';
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(task);
      });
      return grouped;
    }
  };

  const { minDate, maxDate } = getVisibleDateRange();
  const dateRange = maxDate.getTime() - minDate.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.ceil(dateRange / oneDay);

  const dateToX = (date) => {
    const dayOffset = Math.floor((date.getTime() - minDate.getTime()) / oneDay);
    return (dayOffset / totalDays) * 100;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getQuadrantColor = (quadrant) => {
    const colors = {
      'do-first': '#ef4444',
      'schedule': '#3b82f6',
      'delegate': '#f59e0b',
      'eliminate': '#9ca3af'
    };
    return colors[quadrant] || '#6b7280';
  };

  const getQuadrantBg = (quadrant) => {
    const colors = {
      'do-first': 'bg-[#ff334408]',
      'schedule': 'bg-[#00ccdd08]',
      'delegate': 'bg-[#ff882208]',
      'eliminate': 'bg-[#1a1e2c]'
    };
    return colors[quadrant] || 'bg-[#1a1e2c]';
  };

  // Get gridline and label frequencies based on timeline scale
  const getGridlineFrequency = () => {
    if (timelineScale >= 120) {
      return { gridline: 1, label: 1 }; // Daily
    } else if (timelineScale >= 40) {
      return { gridline: 7, label: 7 }; // Weekly
    } else if (timelineScale >= 12) {
      return { gridline: 30, label: 30 }; // Monthly
    } else if (timelineScale >= 2.5) {
      return { gridline: 90, label: 90 }; // Quarterly
    } else {
      return { gridline: 365, label: 365 }; // Yearly
    }
  };

  // Button handler - set predefined scale for zoom level
  const handleZoomButtonClick = (level) => {
    const scales = {
      daily: 150,
      weekly: 40,
      monthly: 12,
      quarterly: 3,
      yearly: 1
    };
    setTimelineScale(scales[level]);
  };

  const grouped = groupedTasks();
  const lanes = Object.keys(grouped).filter(key => grouped[key].length > 0);

  return (
    <div className="p-2 space-y-2" style={{ fontFamily: "'Courier New', monospace", fontSize: '10px' }}>
      {/* Header Controls */}
      <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-[rgba(255,255,255,0.04)]">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="etm-input text-sm"
          >
            <option value="active">Active Tasks</option>
            <option value="completed">Completed</option>
            <option value="all">All Tasks</option>
          </select>

          <select
            value={filters.quadrant}
            onChange={(e) => setFilters({ ...filters, quadrant: e.target.value })}
            className="etm-input text-sm"
          >
            <option value="all">All Quadrants</option>
            <option value="do-first">Do First</option>
            <option value="schedule">Schedule</option>
            <option value="delegate">Delegate</option>
            <option value="eliminate">Eliminate</option>
          </select>

          <select
            value={filters.domain}
            onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
            className="etm-input text-sm"
          >
            <option value="all">All Domains</option>
            {(settings.domains || []).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={filters.scope}
            onChange={(e) => setFilters({ ...filters, scope: e.target.value })}
            className="etm-input text-sm"
          >
            <option value="all">All Scopes</option>
            {(settings.scopes || []).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#506070] font-medium">Group by:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="etm-input text-sm"
            >
              <option value="quadrant">Quadrant</option>
              <option value="domain">Domain</option>
              <option value="scope">Scope</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[#506070] font-medium">Timeline:</span>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`etm-pushbutton text-sm ${showHistory ? 'etm-pushbutton--accent' : ''}`}
              title={showHistory ? 'Showing all historical data' : 'Showing from today forward'}
            >
              {showHistory ? 'History ON' : 'Today Forward'}
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-[#506070] font-medium">Zoom:</span>
            <div className="flex gap-1 etm-panel--recessed p-1 overflow-x-auto">
              {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map(level => (
                <button
                  key={level}
                  onClick={() => handleZoomButtonClick(level)}
                  className={`etm-pushbutton text-xs whitespace-nowrap ${
                    getNearestZoomLevel() === level ? 'etm-pushbutton--active' : ''
                  }`}
                  style={{ padding: '4px 8px' }}
                  title="Click to set, or use Alt+Scroll to zoom"
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto text-[#506070]" style={{ fontSize: '9px' }}>
            {filteredTasks.length}/{tasks.filter(t => t.dueDate).length} tasks
          </div>
        </div>

      {/* Gantt Chart */}
      {filteredTasks.length === 0 ? (
        <div className="etm-panel p-12 text-center">
          <div className="text-[#506070] font-medium">No tasks found matching your filters</div>
        </div>
      ) : (
        <div className="etm-panel overflow-hidden" onWheel={handleChartWheel}>
          <div className="overflow-x-auto">
            {/* Timeline Header */}
            <div className="flex">
              <div className="w-48 border-r border-[#2a3048] bg-[#0a0e12] px-4 py-3 font-semibold text-sm text-[#8899aa] flex-shrink-0">
                Task
              </div>
              <div className="border-b border-[#2a3048] bg-[#0a0e12] px-2 py-2 flex relative" style={{ minWidth: `${totalDays * timelineScale}px` }}>
                {/* Weekend shading */}
                {Array.from({ length: Math.min(totalDays, 365) }).map((_, i) => {
                  const date = new Date(minDate);
                  date.setDate(date.getDate() + i);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return isWeekend ? (
                    <div
                      key={`weekend-${i}`}
                      className="absolute bg-[#2a3048] opacity-20 h-full"
                      style={{
                        left: `${dateToX(date)}%`,
                        width: `${dateToX(new Date(date.getTime() + oneDay)) - dateToX(date)}%`
                      }}
                    />
                  ) : null;
                })}

                {/* Vertical gridlines at date ticks */}
                {Array.from({ length: Math.min(totalDays, 1095) }).map((_, i) => {
                  const date = new Date(minDate);
                  date.setDate(date.getDate() + i);
                  const x = dateToX(date);
                  const freq = getGridlineFrequency();

                  return i % freq.gridline === 0 ? (
                    <div
                      key={`gridline-${i}`}
                      className="absolute w-px bg-[#506070] h-full opacity-40"
                      style={{
                        left: `${x}%`
                      }}
                    />
                  ) : null;
                })}

                {/* Date labels */}
                {Array.from({ length: Math.min(totalDays, 1095) }).map((_, i) => {
                  const date = new Date(minDate);
                  date.setDate(date.getDate() + i);
                  const x = dateToX(date);
                  const freq = getGridlineFrequency();

                  return i % freq.label === 0 ? (
                    <div
                      key={i}
                      className="absolute text-xs text-[#506070] font-semibold"
                      style={{
                        left: `${x}%`,
                        top: '4px'
                      }}
                    >
                      {formatDate(date)}
                    </div>
                  ) : null;
                })}

                {/* Today line - prominent indicator */}
                <div
                  className="absolute w-1 bg-red-500 h-full opacity-80 shadow-lg"
                  style={{
                    left: `${dateToX(new Date())}%`,
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
                  }}
                />
              </div>
            </div>

            {/* Swim Lanes */}
            {lanes.map((lane) => {
              const laneLabel = groupBy === 'quadrant'
                ? { 'do-first': 'Do First', 'schedule': 'Schedule', 'delegate': 'Delegate', 'eliminate': 'Eliminate' }[lane]
                : lane;

              return (
                <div key={lane}>
                  {/* Lane Header */}
                  <div className={`flex ${getQuadrantBg(groupBy === 'quadrant' ? lane : 'schedule')} border-b border-[#2a3048]`}>
                    <div className="w-48 border-r border-[#2a3048] px-4 py-3 flex-shrink-0">
                      <div className="font-semibold text-sm text-[#c8d0e0]">
                        {laneLabel}
                      </div>
                      <div className="text-xs text-[#506070]">
                        {grouped[lane].length} task{grouped[lane].length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ minWidth: `${totalDays * timelineScale}px` }}></div>
                  </div>

                  {/* Tasks in lane */}
                  {grouped[lane].map((task) => {
                    const timeline = calculateTaskTimeline(task);
                    const startX = dateToX(timeline.start);
                    const endX = dateToX(timeline.end);
                    const width = endX - startX;
                    const isCompleted = task.percentComplete === 100;
                    const quadrant = getQuadrant(task);

                    return (
                      <div key={task.id} className="flex border-b border-[#1a1e2c] hover:bg-[#2e3438] transition-colors relative">
                        {/* Task name - clickable to open context menu */}
                        <div
                          className="w-48 border-r border-[#2a3048] px-4 py-3 flex-shrink-0 cursor-pointer hover:bg-[#2e3438] transition-colors"
                          onClick={() => setActiveContextMenu(activeContextMenu === task.id ? null : task.id)}
                        >
                          <div className={`text-sm font-medium ${isCompleted ? 'line-through text-[#506070]' : 'text-[#c8d0e0]'}`}>
                            {task.task}
                          </div>
                          <div className="text-xs text-[#506070] mt-1">
                            {task.subcategory}
                          </div>
                        </div>

                        {/* Timeline bar */}
                        <div className="relative py-3 px-2" style={{ minWidth: `${totalDays * timelineScale}px` }}>
                          {/* Gridlines and today indicator for task row */}
                          {Array.from({ length: Math.min(totalDays, 1095) }).map((_, i) => {
                            const date = new Date(minDate);
                            date.setDate(date.getDate() + i);
                            const x = dateToX(date);
                            const freq = getGridlineFrequency();

                            return i % freq.gridline === 0 ? (
                              <div
                                key={`gridline-task-${i}`}
                                className="absolute w-px bg-[#506070] h-full opacity-30 z-0"
                                style={{
                                  left: `${x}%`
                                }}
                              />
                            ) : null;
                          })}

                          {/* Today line for task row */}
                          <div
                            className="absolute w-1 h-full bg-red-500 opacity-70 z-10"
                            style={{
                              left: `${dateToX(new Date())}%`,
                              boxShadow: '0 0 4px rgba(239, 68, 68, 0.3)'
                            }}
                          />

                          {timeline.isMilestone ? (
                            // Diamond for milestone
                            <div
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 w-4 h-4 rounded-full z-20"
                              style={{
                                left: `${endX}%`,
                                backgroundColor: getQuadrantColor(quadrant),
                                opacity: isCompleted ? 0.5 : 1
                              }}
                              onMouseEnter={() => setTooltip({ task, timeline })}
                              onMouseLeave={() => setTooltip(null)}
                            />
                          ) : (
                            // Bar
                            <div
                              className={`absolute h-8 rounded cursor-pointer transition-opacity z-20 ${isCompleted ? 'opacity-50' : 'opacity-90 hover:opacity-100'}`}
                              style={{
                                left: `${startX}%`,
                                width: `${Math.max(width, 2)}%`,
                                backgroundColor: getQuadrantColor(quadrant),
                                minWidth: '40px'
                              }}
                              onClick={() => {
                                setEditingTask(task);
                                setShowForm(true);
                              }}
                              onMouseEnter={() => setTooltip({ task, timeline })}
                              onMouseLeave={() => setTooltip(null)}
                            >
                              {width > 8 && (
                                <div className="flex items-center gap-1 px-2 h-full text-xs text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                  <span>{task.task}</span>
                                  {task.timeEstimateValue && (
                                    <span className="bg-black/20 px-1 rounded text-xs">
                                      {task.timeEstimateValue}{task.timeEstimateUnit === 'hours' ? 'h' : 'd'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tooltip */}
                          {tooltip && tooltip.task.id === task.id && (
                            <div className="absolute bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs whitespace-nowrap z-50 top-12 left-0 pointer-events-none">
                              <div className="font-semibold">{task.task}</div>
                              <div className="text-slate-300">Due: {formatDate(timeline.end)}</div>
                              {task.timeEstimateValue && (
                                <div className="text-slate-300">
                                  Est: {task.timeEstimateValue} {task.timeEstimateUnit}
                                </div>
                              )}
                              <div className="text-slate-300">Rank: {task.rank}</div>
                            </div>
                          )}
                        </div>

                        {/* Context Menu - appears when task is clicked */}
                        {activeContextMenu === task.id && (
                          <>
                            {/* Backdrop to close menu on click outside */}
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setActiveContextMenu(null)}
                            />

                            {/* Context Menu */}
                            <div className="fixed etm-panel shadow-xl z-50" style={{
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              minWidth: 'max-content'
                            }}>
                              <button
                                onClick={() => {
                                  toggleComplete(task.id);
                                  setActiveContextMenu(null);
                                }}
                                className={`w-full px-4 py-2 text-sm text-left transition-colors flex items-center gap-2 ${
                                  isCompleted
                                    ? 'text-[#50c878] hover:bg-[#33ff6610]'
                                    : 'text-[#8899aa] hover:bg-[#2e3438]'
                                }`}
                              >
                                <CheckCircle size={16} />
                                <span>{isCompleted ? 'Mark incomplete' : 'Mark complete'}</span>
                              </button>
                              <div className="border-t border-[#2a3048]" />
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setShowForm(true);
                                  setActiveContextMenu(null);
                                }}
                                className="w-full px-4 py-2 text-sm text-left text-[#8899aa] hover:bg-[#2e3438] transition-colors flex items-center gap-2"
                              >
                                <Edit2 size={16} />
                                <span>Edit</span>
                              </button>
                              <div className="border-t border-[#2a3048]" />
                              <button
                                onClick={() => {
                                  deleteTask(task.id);
                                  setActiveContextMenu(null);
                                }}
                                className="w-full px-4 py-2 text-sm text-left text-[#ff6675] hover:bg-[#ff334415] transition-colors flex items-center gap-2"
                              >
                                <Trash2 size={16} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="etm-panel p-4">
        <div className="text-sm font-semibold text-[#c8d0e0] mb-3">Legend</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Do First', color: '#ff3344' },
            { label: 'Schedule', color: '#00ccdd' },
            { label: 'Delegate', color: '#ff8822' },
            { label: 'Eliminate', color: '#506070' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-[#8899aa]">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-[#506070]">
          <div>Bar width represents time estimate (due date - estimate = start date)</div>
          <div>Diamond indicates task without time estimate (milestone)</div>
          <div>Red line shows today's date</div>
          <div>Gray shading indicates weekends</div>
        </div>
      </div>
    </div>
  );
};

const CalendarView = ({ tasks, filters, setFilters, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, setDefaultDueDate, settings }) => {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [expandedDay, setExpandedDay] = useState(null);

  const generateMonthGrid = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const startDay = new Date(firstDay);
    startDay.setDate(startDay.getDate() - firstDay.getDay());
    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDay);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const toDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const filteredTasks = tasks.filter(task => {
    if (filters.status === 'active' && task.percentComplete === 100) return false;
    if (filters.status === 'completed' && task.percentComplete < 100) return false;
    if (filters.quadrant !== 'all' && getQuadrant(task) !== filters.quadrant) return false;
    if (filters.domain !== 'all' && task.domain !== filters.domain) return false;
    if (filters.scope !== 'all' && task.scope !== filters.scope) return false;
    return true;
  });

  const datedTasks = filteredTasks.filter(t => t.dueDate);
  const undatedCount = filteredTasks.filter(t => !t.dueDate).length;

  const tasksByDate = new Map();
  datedTasks.forEach(task => {
    const key = task.dueDate;
    if (!tasksByDate.has(key)) tasksByDate.set(key, []);
    tasksByDate.get(key).push(task);
  });

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const days = generateMonthGrid(year, month);
  const todayStr = toDateStr(new Date());
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const goToday = () => setCalendarDate(new Date());

  const quadrantColors = {
    'do-first': { border: 'border-l-[#ff3344]', bg: 'bg-[#ff334410]', text: 'text-[#ff6675]', dot: 'bg-[#ff3344]' },
    'schedule': { border: 'border-l-[#00ccdd]', bg: 'bg-[#00ccdd10]', text: 'text-[#6ea8fe]', dot: 'bg-[#00ccdd]' },
    'delegate': { border: 'border-l-[#ff8822]', bg: 'bg-[#ff882210]', text: 'text-[#fbbf24]', dot: 'bg-[#ff8822]' },
    'eliminate': { border: 'border-l-[#506070]', bg: 'bg-[#1a1e2c]', text: 'text-[#8899aa]', dot: 'bg-[#506070]' }
  };

  const handleDayClick = (dateStr) => {
    setDefaultDueDate(dateStr);
    setEditingTask(null);
    setShowForm(true);
  };

  const MAX_VISIBLE = 3;

  return (
    <div className="p-2 space-y-2" style={{ fontFamily: "'Courier New', monospace", fontSize: '10px' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-[#2e3438] transition-colors">
            <ChevronLeft size={14} className="text-[#8899aa]" />
          </button>
          <h2 className="text-sm font-bold text-[#c8d0e0] min-w-[140px] text-center">
            {monthNames[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-[#2e3438] transition-colors">
            <ChevronRight size={14} className="text-[#8899aa]" />
          </button>
          <button onClick={goToday} className="etm-pushbutton ml-1" style={{ padding: '2px 6px', fontSize: '9px' }}>
            Today
          </button>
        </div>
        {undatedCount > 0 && (
          <div className="text-[#506070]" style={{ fontSize: '9px' }}>
            {undatedCount} undated
          </div>
        )}
        {/* Inline filters */}
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="etm-input"
        >
          <option value="active">Active Tasks</option>
          <option value="completed">Completed</option>
          <option value="all">All Tasks</option>
        </select>
        <select
          value={filters.quadrant}
          onChange={(e) => setFilters({ ...filters, quadrant: e.target.value })}
          className="etm-input"
        >
          <option value="all">All Quadrants</option>
          <option value="do-first">Do First</option>
          <option value="schedule">Schedule</option>
          <option value="delegate">Delegate</option>
          <option value="eliminate">Eliminate</option>
        </select>
        <select
          value={filters.domain}
          onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
          className="etm-input"
        >
          <option value="all">All Domains</option>
          {(settings.domains || []).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={filters.scope}
          onChange={(e) => setFilters({ ...filters, scope: e.target.value })}
          className="etm-input"
        >
          <option value="all">All Scopes</option>
          {(settings.scopes || []).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Calendar Grid */}
      <div className="etm-panel overflow-hidden">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-[#2a3048] bg-[#0a0e12]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="px-2 py-2.5 text-center text-xs font-semibold text-[#506070] uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells - 6 rows */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dateStr = toDateStr(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = dateStr === todayStr;
            const dayTasks = tasksByDate.get(dateStr) || [];
            const isExpanded = expandedDay === dateStr;
            const visibleTasks = isExpanded ? dayTasks : dayTasks.slice(0, MAX_VISIBLE);
            const hiddenCount = dayTasks.length - MAX_VISIBLE;

            return (
              <div
                key={idx}
                className={`min-h-[110px] border-b border-r border-[#1a1e2c] p-1.5 transition-colors ${
                  isCurrentMonth ? 'bg-[#1e2428]' : 'bg-[#0a0e12]/50'
                } ${isToday ? 'bg-[#e8603010] ring-1 ring-inset ring-[#e86030]' : ''}`}
                onClick={(e) => {
                  if (e.target === e.currentTarget || e.target.closest('[data-day-bg]')) {
                    handleDayClick(dateStr);
                  }
                }}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1" data-day-bg>
                  <span className={`text-sm font-medium leading-none ${
                    isToday ? 'bg-[#e86030] text-white w-6 h-6 rounded-full flex items-center justify-center' :
                    isCurrentMonth ? 'text-[#c8d0e0]' : 'text-[#506070]'
                  }`}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Task pills */}
                <div className="space-y-0.5">
                  {visibleTasks.map(task => {
                    const quadrant = getQuadrant(task);
                    const colors = quadrantColors[quadrant] || quadrantColors['eliminate'];
                    const isOverdue = calculatePriority(task) < 0 && task.percentComplete < 100;
                    const isCompleted = task.percentComplete === 100;
                    const isRecurring = task.recurringPattern && task.recurringPattern !== 'once';

                    return (
                      <div
                        key={task.id}
                        className={`group flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer border-l-2 ${colors.border} ${colors.bg} hover:brightness-95 transition-all ${isCompleted ? 'opacity-60' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTask(task);
                          setShowForm(true);
                        }}
                        title={`${task.task} — ${quadrant}`}
                      >
                        <span className={`truncate flex-1 ${isOverdue ? 'text-[#ff6675] font-semibold' : colors.text} ${isCompleted ? 'line-through' : ''}`}>
                          {task.task}
                        </span>
                        {isRecurring && <Repeat size={10} className={colors.text} />}
                      </div>
                    );
                  })}
                  {!isExpanded && hiddenCount > 0 && (
                    <button
                      className="text-xs text-[#e86030] font-medium hover:text-[#ff7040] pl-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDay(dateStr);
                      }}
                    >
                      +{hiddenCount} more
                    </button>
                  )}
                  {isExpanded && dayTasks.length > MAX_VISIBLE && (
                    <button
                      className="text-xs text-[#506070] font-medium hover:text-[#8899aa] pl-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDay(null);
                      }}
                    >
                      show less
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="etm-panel p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {[
            { label: 'Do First', color: 'bg-[#ff3344]' },
            { label: 'Schedule', color: 'bg-[#00ccdd]' },
            { label: 'Delegate', color: 'bg-[#ff8822]' },
            { label: 'Eliminate', color: 'bg-[#506070]' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${item.color}`} />
              <span className="text-[#8899aa]">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[#ff6675] font-semibold text-xs">Overdue</span>
            <span className="text-[#506070]">= red text</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Repeat size={12} className="text-[#506070]" />
            <span className="text-[#8899aa]">= recurring</span>
          </div>
          <div className="text-[#506070] ml-auto text-xs">Click empty space to add a task on that date</div>
        </div>
      </div>
    </div>
  );
};

export default EisenhowerTaskManager;
