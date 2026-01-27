import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Calendar, ChevronDown, Download, Upload, Settings, AlertCircle, CheckCircle, LayoutGrid, List, Shield, Clock, Archive, Repeat, BarChart3 } from 'lucide-react';
import { PINModal } from './components/PINModal';

const EisenhowerTaskManager = () => {
  // PIN Protection
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('eisenhower-unlocked') === 'true';
  });

  // All state must be declared before any conditional rendering
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState({
    categories: ['Career', 'Personal'],
    subcategories: {
      'Career': ['Dynamics', 'Statics', 'Intro to Engineering', 'Thermal Engineering Lab', 'Physics'],
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
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingTask, setCompletingTask] = useState(null);
  const [filters, setFilters] = useState({
    quadrant: 'all',
    category: 'all',
    status: 'active',
    recurrence: 'all'
  });
  const [sortBy, setSortBy] = useState('priority');
  const [isLoading, setIsLoading] = useState(true);

  // Show PIN modal if not unlocked (after all state is declared)
  if (!isUnlocked) {
    return <PINModal onUnlock={() => setIsUnlocked(true)} />;
  }

  // Sample seed data with all recurrence types
  const sampleTasks = [
    {
      id: '1',
      task: 'Prepare Homework (HW3)',
      category: 'Career',
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
      category: 'Career',
      subcategory: 'Thermal Engineering Lab',
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
      category: 'Career',
      subcategory: 'Physics',
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
      category: 'Career',
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
      category: 'Personal',
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
      category: 'Personal',
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
      category: 'Career',
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
      category: 'Career',
      subcategory: 'Physics',
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

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const tasksData = localStorage.getItem('eisenhower-tasks');
        if (tasksData) {
          setTasks(JSON.parse(tasksData));
        } else {
          setTasks(sampleTasks);
        }
      } catch (e) {
        setTasks(sampleTasks);
      }

      try {
        const settingsData = localStorage.getItem('eisenhower-settings');
        if (settingsData) {
          setSettings(JSON.parse(settingsData));
        }
      } catch (e) {
        // Use default settings
      }

      try {
        const backupData = localStorage.getItem('eisenhower-backup-metadata');
        if (backupData) {
          setBackupMetadata(JSON.parse(backupData));
        }
      } catch (e) {
        // Use default backup metadata
      }

      setIsLoading(false);
    };
    loadData();
  }, []);

  // Save tasks when they change
  useEffect(() => {
    if (!isLoading) {
      const saveData = () => {
        try {
          localStorage.setItem('eisenhower-tasks', JSON.stringify(tasks));
          
          const updatedMetadata = {
            ...backupMetadata,
            lastAutoSave: new Date().toISOString()
          };
          setBackupMetadata(updatedMetadata);
          localStorage.setItem('eisenhower-backup-metadata', JSON.stringify(updatedMetadata));
        } catch (e) {
          console.error('Failed to save tasks:', e);
        }
      };
      saveData();
    }
  }, [tasks, isLoading]);

  // Save settings when they change
  useEffect(() => {
    if (!isLoading) {
      const saveSettings = () => {
        try {
          localStorage.setItem('eisenhower-settings', JSON.stringify(settings));
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-2xl font-light text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        
        .quadrant-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .quadrant-card:hover {
          transform: translateY(-2px);
        }
        
        .task-item {
          transition: all 0.2s ease;
        }
        
        .task-item:hover {
          transform: translateX(4px);
        }
        
        .completed-task {
          opacity: 0.6;
        }
        
        .priority-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .modal-backdrop {
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-content {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ai-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .pulse-animation {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>

      {/* Backup Reminder Banner */}
      {showBackupReminder && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="pulse-animation" size={20} />
              <span className="font-semibold">
                Backup Reminder: It's been {getDaysSinceExport()} days since your last export
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportData}
                className="bg-white text-orange-600 px-4 py-1.5 rounded-lg font-medium hover:bg-orange-50 transition-colors"
              >
                Export Now
              </button>
              <button
                onClick={() => setShowBackupReminder(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-indigo-900 bg-clip-text text-transparent">
                Eisenhower Matrix
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-wide">
                URGENT × IMPORTANT TASK PRIORITIZATION
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setView('matrix')}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                    view === 'matrix'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid size={16} />
                  <span className="font-medium">Matrix</span>
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                    view === 'list'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List size={16} />
                  <span className="font-medium">List</span>
                </button>
                <button
                  onClick={() => setView('gantt')}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                    view === 'gantt'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 size={16} />
                  <span className="font-medium">Gantt</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowForm(true);
                }}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-200 font-medium"
              >
                <Plus size={18} strokeWidth={2.5} />
                Add Task
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <div className="text-xs font-semibold text-red-700 uppercase tracking-wider">Do First</div>
              <div className="text-2xl font-bold text-red-900 mt-1">{stats.byQuadrant['do-first']}</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Schedule</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{stats.byQuadrant['schedule']}</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Delegate</div>
              <div className="text-2xl font-bold text-amber-900 mt-1">{stats.byQuadrant['delegate']}</div>
            </div>
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
              <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Eliminate</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{stats.byQuadrant['eliminate']}</div>
            </div>
            {stats.overdue.length > 0 && (
              <div className="bg-rose-100 border-2 border-rose-400 rounded-lg px-4 py-3">
                <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle size={12} />
                  Overdue
                </div>
                <div className="text-2xl font-bold text-rose-900 mt-1">{stats.overdue.length}</div>
              </div>
            )}
            {stats.dueToday.length > 0 && (
              <div className="bg-orange-100 border-2 border-orange-400 rounded-lg px-4 py-3">
                <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Due Today</div>
                <div className="text-2xl font-bold text-orange-900 mt-1">{stats.dueToday.length}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <ListView
            tasks={tasks}
            filters={filters}
            setFilters={setFilters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            getQuadrant={getQuadrant}
            calculatePriority={calculatePriority}
            toggleComplete={toggleComplete}
            setEditingTask={setEditingTask}
            setShowForm={setShowForm}
            deleteTask={deleteTask}
            calculateTaskScore={calculateTaskScore}
          />
        ) : (
          <GanttView
            tasks={tasks}
            getQuadrant={getQuadrant}
            calculatePriority={calculatePriority}
            toggleComplete={toggleComplete}
            setEditingTask={setEditingTask}
            setShowForm={setShowForm}
            deleteTask={deleteTask}
          />
        )}
      </main>

      {/* Footer with Backup Info */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="text-sm text-slate-600">
                <span className="font-semibold">{stats.active.length}</span> active · 
                <span className="font-semibold ml-1">{stats.completed.length}</span> completed
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock size={14} />
                <span>
                  Last backup: {
                    backupMetadata.lastExport
                      ? `${getDaysSinceExport()} days ago`
                      : 'Never'
                  }
                </span>
              </div>
              {backupMetadata.exportCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Archive size={14} />
                  <span>{backupMetadata.exportCount} exports</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportData}
                className="px-4 py-2 border-2 border-emerald-300 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2 hover:bg-emerald-100 transition-colors font-medium"
              >
                <Download size={16} />
                Export Backup
              </button>
              <label className="px-4 py-2 border border-slate-300 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors text-slate-700 cursor-pointer font-medium">
                <Upload size={16} />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </footer>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={editingTask ? updateTask : addTask}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
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

  const RatingStars = ({ value, onChange, label, color }) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className={`text-3xl transition-all transform hover:scale-110 ${
                value >= star ? color : 'text-slate-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500">
          {value === null ? 'Click to rate' : 
           value === 1 ? 'Poor' :
           value === 2 ? 'Fair' :
           value === 3 ? 'Good' :
           value === 4 ? 'Very Good' :
           'Excellent'}
        </div>
      </div>
    );
  };

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-content bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-white" size={24} />
            <h2 className="text-2xl font-bold text-white">Complete Task</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">Task:</h3>
            <p className="text-slate-700">{task.task}</p>
            {task.subcategory && (
              <p className="text-sm text-slate-500 mt-1">{task.subcategory}</p>
            )}
          </div>

          <div className="space-y-6">
            <RatingStars
              value={qualityRating}
              onChange={setQualityRating}
              label="How well did you complete this task?"
              color="text-yellow-400"
            />

            <RatingStars
              value={easeRating}
              onChange={setEaseRating}
              label="How easy/difficult was this task?"
              color="text-blue-400"
            />
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Quality:</strong> Your satisfaction with the result<br/>
              <strong>Ease:</strong> How smooth the process was (5 = very easy, 1 = very difficult)
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={qualityRating === null || easeRating === null}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        <span className="text-xs font-medium text-slate-500">-</span>
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
    bgColor = 'bg-emerald-100';
  } else if (score < 0) {
    // Late completion - red gradient
    const intensity = Math.min(Math.abs(score), 1);
    const redValue = Math.round(239 - (239 - 220) * intensity); // EF-DC
    const greenValue = Math.round(68 - (68 - 38) * intensity); // 44-26
    const blueValue = Math.round(68 - (68 - 35) * intensity); // 44-23
    barColor = `rgb(${redValue}, ${greenValue}, ${blueValue})`;
    bgColor = 'bg-rose-100';
  } else {
    // Right on time - neutral
    barColor = 'rgb(100, 116, 139)'; // slate-500
    bgColor = 'bg-slate-100';
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
      <span className="text-xs font-medium text-slate-600 w-10 text-right">
        {score.toFixed(2)}
      </span>
    </div>
  );
};

const MatrixView = ({ tasks, getQuadrant, sortTasks, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, calculateTaskScore }) => {
  const activeTasks = tasks.filter(t => t.percentComplete < 100);
  
  const quadrants = [
    {
      id: 'do-first',
      title: 'DO FIRST',
      subtitle: 'Urgent & Necessary',
      bgColor: 'bg-gradient-to-br from-red-50 to-orange-50',
      borderColor: 'border-red-300',
      accentColor: 'bg-red-500',
      textColor: 'text-red-900',
      icon: '🔥'
    },
    {
      id: 'schedule',
      title: 'SCHEDULE',
      subtitle: 'Necessary, Not Urgent',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      borderColor: 'border-blue-300',
      accentColor: 'bg-blue-500',
      textColor: 'text-blue-900',
      icon: '📅'
    },
    {
      id: 'delegate',
      title: 'DELEGATE',
      subtitle: 'Urgent, Not Necessary',
      bgColor: 'bg-gradient-to-br from-amber-50 to-yellow-50',
      borderColor: 'border-amber-300',
      accentColor: 'bg-amber-500',
      textColor: 'text-amber-900',
      icon: '👥'
    },
    {
      id: 'eliminate',
      title: 'ELIMINATE',
      subtitle: 'Neither Urgent Nor Necessary',
      bgColor: 'bg-gradient-to-br from-slate-50 to-gray-100',
      borderColor: 'border-slate-300',
      accentColor: 'bg-slate-400',
      textColor: 'text-slate-700',
      icon: '🗑️'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {quadrants.map((quadrant) => {
        const quadrantTasks = sortTasks(activeTasks.filter(t => getQuadrant(t) === quadrant.id));
        
        return (
          <div
            key={quadrant.id}
            className={`quadrant-card ${quadrant.bgColor} border-2 ${quadrant.borderColor} rounded-xl shadow-lg overflow-hidden`}
          >
            <div className={`${quadrant.accentColor} px-6 py-4 flex items-center justify-between`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{quadrant.icon}</span>
                  <h2 className="text-lg font-bold text-white tracking-wider">{quadrant.title}</h2>
                </div>
                <p className="text-xs text-white/90 mt-1 font-medium">{quadrant.subtitle}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <span className="text-white font-bold text-lg">{quadrantTasks.length}</span>
              </div>
            </div>
            
            <div className="p-4 space-y-3 min-h-[300px]">
              {quadrantTasks.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 font-medium">
                  No tasks in this quadrant
                </div>
              ) : (
                quadrantTasks.map((task) => (
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
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TaskCard = ({ task, calculatePriority, toggleComplete, onEdit, onDelete, calculateTaskScore }) => {
  const priority = calculatePriority(task);
  const isOverdue = priority < 0;
  const dueDate = new Date(task.dueDate);
  const taskScore = calculateTaskScore(task);
  
  const getRecurrenceIcon = (pattern) => {
    const icons = {
      once: '📌',
      daily: '☀️',
      weekly: '📅',
      monthly: '🗓️',
      yearly: '📆'
    };
    return icons[pattern] || '📌';
  };

  const getRecurrenceColor = (pattern) => {
    const colors = {
      once: 'bg-slate-100 text-slate-700',
      daily: 'bg-purple-100 text-purple-700',
      weekly: 'bg-indigo-100 text-indigo-700',
      monthly: 'bg-cyan-100 text-cyan-700',
      yearly: 'bg-teal-100 text-teal-700'
    };
    return colors[pattern] || 'bg-slate-100 text-slate-700';
  };
  
  return (
    <div className={`task-item bg-white border-2 ${isOverdue ? 'border-rose-400' : 'border-slate-200'} rounded-lg p-4 shadow-sm hover:shadow-md ${task.percentComplete === 100 ? 'completed-task' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={task.percentComplete === 100}
            onChange={() => toggleComplete(task.id)}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />
          <div className="flex-1">
            <h3 className={`font-semibold ${task.percentComplete === 100 ? 'line-through text-slate-500' : 'text-slate-900'}`}>
              {task.task}
            </h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="priority-badge bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Rank {task.rank}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                isOverdue
                  ? 'bg-rose-100 text-rose-700'
                  : priority === 0
                  ? 'bg-orange-100 text-orange-700'
                  : priority <= 3
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isOverdue ? `${Math.abs(priority)}d overdue` : priority === 0 ? 'Due today' : `${priority}d left`}
              </span>
              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {task.subcategory}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1 ${getRecurrenceColor(task.recurringPattern || 'once')}`}>
                <span>{getRecurrenceIcon(task.recurringPattern || 'once')}</span>
                {task.recurringPattern || 'once'}
              </span>
              {task.percentComplete > 0 && task.percentComplete < 100 && (
                <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-medium">
                  {task.percentComplete}%
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Calendar size={12} />
              Due: {dueDate.toLocaleDateString()}
            </div>
            {taskScore !== null && (
              <div className="mt-3 pt-2 border-t border-slate-200">
                <div className="text-xs font-medium text-slate-600 mb-1">Planning/Execution Score:</div>
                <TaskScoreBar score={taskScore} />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ListView = ({ tasks, filters, setFilters, sortBy, setSortBy, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, calculateTaskScore }) => {
  const filteredTasks = tasks.filter(task => {
    if (filters.status === 'active' && task.percentComplete === 100) return false;
    if (filters.status === 'completed' && task.percentComplete < 100) return false;
    if (filters.quadrant !== 'all' && getQuadrant(task) !== filters.quadrant) return false;
    if (filters.category !== 'all' && task.category !== filters.category) return false;
    if (filters.recurrence !== 'all' && (task.recurringPattern || 'once') !== filters.recurrence) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      return calculatePriority(a) - calculatePriority(b);
    } else if (sortBy === 'dueDate') {
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
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

  const getRecurrenceIcon = (pattern) => {
    const icons = {
      once: '📌',
      daily: '☀️',
      weekly: '📅',
      monthly: '🗓️',
      yearly: '📆'
    };
    return icons[pattern] || '📌';
  };

  const getRecurrenceColor = (pattern) => {
    const colors = {
      once: 'bg-slate-100 text-slate-700',
      daily: 'bg-purple-100 text-purple-700',
      weekly: 'bg-indigo-100 text-indigo-700',
      monthly: 'bg-cyan-100 text-cyan-700',
      yearly: 'bg-teal-100 text-teal-700'
    };
    return colors[pattern] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4 flex-wrap">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          <option value="active">Active Tasks</option>
          <option value="completed">Completed</option>
          <option value="all">All Tasks</option>
        </select>
        
        <select
          value={filters.quadrant}
          onChange={(e) => setFilters({ ...filters, quadrant: e.target.value })}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          <option value="all">All Quadrants</option>
          <option value="do-first">Do First</option>
          <option value="schedule">Schedule</option>
          <option value="delegate">Delegate</option>
          <option value="eliminate">Eliminate</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        >
          <option value="all">All Categories</option>
          <option value="Career">Career</option>
          <option value="Personal">Personal</option>
        </select>

        <select
          value={filters.recurrence}
          onChange={(e) => setFilters({ ...filters, recurrence: e.target.value })}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium flex items-center gap-2"
        >
          <option value="all">All Recurrence</option>
          <option value="once">📌 Once</option>
          <option value="daily">☀️ Daily</option>
          <option value="weekly">📅 Weekly</option>
          <option value="monthly">🗓️ Monthly</option>
          <option value="yearly">📆 Yearly</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-slate-600 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="category">Category</option>
            <option value="recurrence">Recurrence</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-12"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Task</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Quadrant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Recurrence</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Score</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedTasks.map((task) => {
              const priority = calculatePriority(task);
              const isOverdue = priority < 0;
              const recurrencePattern = task.recurringPattern || 'once';
              
              return (
                <tr key={task.id} className={`hover:bg-slate-50 transition-colors ${task.percentComplete === 100 ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={task.percentComplete === 100}
                      onChange={() => toggleComplete(task.id)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-semibold ${task.percentComplete === 100 ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {task.task}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{task.subcategory}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      getQuadrant(task) === 'do-first'
                        ? 'bg-red-100 text-red-700'
                        : getQuadrant(task) === 'schedule'
                        ? 'bg-blue-100 text-blue-700'
                        : getQuadrant(task) === 'delegate'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {quadrantLabels[getQuadrant(task)]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{task.category}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium flex items-center gap-1 w-fit ${getRecurrenceColor(recurrencePattern)}`}>
                      <span>{getRecurrenceIcon(recurrencePattern)}</span>
                      {recurrencePattern}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`priority-badge px-2 py-1 rounded ${
                      isOverdue
                        ? 'bg-rose-100 text-rose-700'
                        : priority === 0
                        ? 'bg-orange-100 text-orange-700'
                        : priority <= 3
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isOverdue ? `${Math.abs(priority)}d overdue` : priority === 0 ? 'Today' : `${priority}d`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[80px]">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${task.percentComplete}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 font-medium w-8">{task.percentComplete}%</span>
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
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
          <div className="text-center py-12 text-slate-400">
            No tasks found matching your filters
          </div>
        )}
      </div>
    </div>
  );
};

const TaskForm = ({ task, onSave, onCancel, settings }) => {
  const [formData, setFormData] = useState(
    task || {
      task: '',
      category: 'Career',
      subcategory: '',
      isUrgent: false,
      isNecessary: false,
      rank: 2,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: '',
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

  const subcategoryOptions = settings.subcategories[formData.category] || [];

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-content bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Task Name *
            </label>
            <input
              type="text"
              value={formData.task}
              onChange={(e) => setFormData({ ...formData, task: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter task description"
              required
            />
          </div>

          {/* Urgency and Necessity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isUrgent}
                  onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-2 focus:ring-orange-500"
                />
                <div>
                  <div className="font-semibold text-slate-900">Urgent</div>
                  <div className="text-xs text-slate-600">Time-sensitive</div>
                </div>
              </label>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNecessary}
                  onChange={(e) => setFormData({ ...formData, isNecessary: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <div className="font-semibold text-slate-900">Necessary</div>
                  <div className="text-xs text-slate-600">Important/Critical</div>
                </div>
              </label>
            </div>
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {settings.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Subcategory
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select...</option>
                {subcategoryOptions.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates and Rank */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Assigned Date
              </label>
              <input
                type="date"
                value={formData.assignedDate}
                onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Rank (1-3)
              </label>
              <select
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1 - Highest</option>
                <option value={2}>2 - Medium</option>
                <option value={3}>3 - Lower</option>
              </select>
            </div>
          </div>

          {/* Time Estimate */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 5, 2.5"
                />
              </div>
              <div>
                <select
                  value={formData.timeEstimateUnit}
                  onChange={(e) => setFormData({ ...formData, timeEstimateUnit: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2 italic">
              💡 5-Minute Rule: If a task takes less than 5 minutes, just do it now instead of scheduling it.
            </p>
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Progress: {formData.percentComplete}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={formData.percentComplete}
              onChange={(e) => setFormData({ ...formData, percentComplete: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Recurring Pattern */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Recurrence Pattern
            </label>
            <select
              value={formData.recurringPattern || 'once'}
              onChange={(e) => setFormData({ 
                ...formData, 
                recurringPattern: e.target.value,
                isRecurring: e.target.value !== 'once'
              })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="once">📌 Once (one-time task)</option>
              <option value="daily">☀️ Daily (every day)</option>
              <option value="weekly">📅 Weekly (every week)</option>
              <option value="monthly">🗓️ Monthly (every month)</option>
              <option value="yearly">📆 Yearly (annually)</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows="3"
              placeholder="Additional details..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-200 font-medium"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GanttView = ({ tasks, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask }) => {
  const [filters, setFilters] = useState({
    quadrant: 'all',
    category: 'all',
    status: 'active'
  });
  const [groupBy, setGroupBy] = useState('quadrant');
  const [zoomLevel, setZoomLevel] = useState('monthly');
  const [tooltip, setTooltip] = useState(null);
  const [activeContextMenu, setActiveContextMenu] = useState(null);

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

  const getVisibleDateRange = () => {
    let minDate = new Date();
    let maxDate = new Date();

    // Set default range based on zoom level
    const zoomRanges = {
      daily: 3,
      weekly: 28,
      monthly: 84,
      quarterly: 365,
      yearly: 730
    };
    const defaultDays = zoomRanges[zoomLevel] || 90;
    maxDate.setDate(maxDate.getDate() + defaultDays);

    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const timeline = calculateTaskTimeline(task);

        if (timeline.start < minDate) minDate = timeline.start;
        if (dueDate > maxDate) maxDate = dueDate;
      }
    });

    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);

    return { minDate, maxDate };
  };

  const filteredTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    if (filters.status === 'active' && task.percentComplete === 100) return false;
    if (filters.status === 'completed' && task.percentComplete < 100) return false;
    if (filters.quadrant !== 'all' && getQuadrant(task) !== filters.quadrant) return false;
    if (filters.category !== 'all' && task.category !== filters.category) return false;
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
    } else {
      const grouped = {};
      filteredTasks.forEach(task => {
        const cat = task.category;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(task);
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
      'do-first': 'bg-red-50',
      'schedule': 'bg-blue-50',
      'delegate': 'bg-amber-50',
      'eliminate': 'bg-slate-50'
    };
    return colors[quadrant] || 'bg-gray-50';
  };

  // Get gridline and label frequencies based on zoom level
  const getGridlineFrequency = () => {
    const frequencies = {
      daily: { gridline: 1, label: 1 },      // Every day
      weekly: { gridline: 7, label: 7 },     // Every week
      monthly: { gridline: 30, label: 30 },  // Every month
      quarterly: { gridline: 90, label: 90 },// Every 3 months
      yearly: { gridline: 365, label: 365 }  // Every year
    };
    return frequencies[zoomLevel] || frequencies.monthly;
  };

  const grouped = groupedTasks();
  const lanes = Object.keys(grouped).filter(key => grouped[key].length > 0);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
          >
            <option value="active">Active Tasks</option>
            <option value="completed">Completed</option>
            <option value="all">All Tasks</option>
          </select>

          <select
            value={filters.quadrant}
            onChange={(e) => setFilters({ ...filters, quadrant: e.target.value })}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
          >
            <option value="all">All Quadrants</option>
            <option value="do-first">Do First</option>
            <option value="schedule">Schedule</option>
            <option value="delegate">Delegate</option>
            <option value="eliminate">Eliminate</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
          >
            <option value="all">All Categories</option>
            <option value="Career">Career</option>
            <option value="Personal">Personal</option>
          </select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">Group by:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
            >
              <option value="quadrant">Quadrant</option>
              <option value="category">Category</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-slate-600 font-medium">Zoom:</span>
            <div className="flex bg-slate-100 rounded-lg p-1 overflow-x-auto">
              {['daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map(level => (
                <button
                  key={level}
                  onClick={() => setZoomLevel(level)}
                  className={`px-2.5 py-1 rounded text-sm font-medium transition-all whitespace-nowrap ${
                    zoomLevel === level
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-600">
          Showing {filteredTasks.length} of {tasks.filter(t => t.dueDate).length} tasks with due dates
        </div>
      </div>

      {/* Gantt Chart */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <div className="text-slate-400 font-medium">No tasks found matching your filters</div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {/* Timeline Header */}
            <div className="flex">
              <div className="w-64 border-r border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-sm text-slate-700 flex-shrink-0">
                Task
              </div>
              <div className="flex-1 border-b border-slate-200 bg-slate-50 px-2 py-2 flex relative">
                {/* Weekend shading */}
                {Array.from({ length: Math.min(totalDays, 365) }).map((_, i) => {
                  const date = new Date(minDate);
                  date.setDate(date.getDate() + i);
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                  return isWeekend ? (
                    <div
                      key={`weekend-${i}`}
                      className="absolute bg-slate-100 opacity-20 h-full"
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
                      className="absolute w-px bg-slate-300 h-full opacity-40"
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
                      className="absolute text-xs text-slate-600 font-semibold"
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
                ? { 'do-first': '🔥 Do First', 'schedule': '📅 Schedule', 'delegate': '👥 Delegate', 'eliminate': '🗑️ Eliminate' }[lane]
                : lane;

              return (
                <div key={lane}>
                  {/* Lane Header */}
                  <div className={`flex ${getQuadrantBg(groupBy === 'quadrant' ? lane : 'schedule')} border-b border-slate-200`}>
                    <div className="w-64 border-r border-slate-200 px-4 py-3 flex-shrink-0">
                      <div className="font-semibold text-sm text-slate-700">
                        {laneLabel}
                      </div>
                      <div className="text-xs text-slate-500">
                        {grouped[lane].length} task{grouped[lane].length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex-1"></div>
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
                      <div key={task.id} className="flex border-b border-slate-100 hover:bg-indigo-50 transition-colors relative">
                        {/* Task name - clickable to open context menu */}
                        <div
                          className="w-64 border-r border-slate-200 px-4 py-3 flex-shrink-0 cursor-pointer hover:bg-indigo-100 transition-colors"
                          onClick={() => setActiveContextMenu(activeContextMenu === task.id ? null : task.id)}
                        >
                          <div className={`text-sm font-medium ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.task}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {task.subcategory}
                          </div>
                        </div>

                        {/* Timeline bar */}
                        <div className="flex-1 relative py-3 px-2">
                          {/* Gridlines and today indicator for task row */}
                          {Array.from({ length: Math.min(totalDays, 1095) }).map((_, i) => {
                            const date = new Date(minDate);
                            date.setDate(date.getDate() + i);
                            const x = dateToX(date);
                            const freq = getGridlineFrequency();

                            return i % freq.gridline === 0 ? (
                              <div
                                key={`gridline-task-${i}`}
                                className="absolute w-px bg-slate-300 h-full opacity-30 z-0"
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
                            <div className="fixed bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-max" style={{
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)'
                            }}>
                              <button
                                onClick={() => {
                                  toggleComplete(task.id);
                                  setActiveContextMenu(null);
                                }}
                                className={`w-full px-4 py-2 text-sm text-left transition-colors flex items-center gap-2 ${
                                  isCompleted
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-slate-700 hover:bg-indigo-50'
                                }`}
                              >
                                <CheckCircle size={16} />
                                <span>{isCompleted ? 'Mark incomplete' : 'Mark complete'}</span>
                              </button>
                              <div className="border-t border-slate-200" />
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setShowForm(true);
                                  setActiveContextMenu(null);
                                }}
                                className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                              >
                                <Edit2 size={16} />
                                <span>Edit</span>
                              </button>
                              <div className="border-t border-slate-200" />
                              <button
                                onClick={() => {
                                  deleteTask(task.id);
                                  setActiveContextMenu(null);
                                }}
                                className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
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
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-700 mb-3">Legend</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Do First', color: '#ef4444' },
            { label: 'Schedule', color: '#3b82f6' },
            { label: 'Delegate', color: '#f59e0b' },
            { label: 'Eliminate', color: '#9ca3af' }
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-600">
          <div>• Bar width represents time estimate (due date - estimate = start date)</div>
          <div>• Diamond indicates task without time estimate (milestone)</div>
          <div>• Red line shows today's date</div>
          <div>• Gray shading indicates weekends</div>
        </div>
      </div>
    </div>
  );
};

export default EisenhowerTaskManager;
