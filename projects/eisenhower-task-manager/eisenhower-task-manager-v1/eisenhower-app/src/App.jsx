import React, { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Calendar, ChevronDown, Download, Upload, Settings, AlertCircle, CheckCircle, LayoutGrid, List, Sparkles, Loader2, Shield, Clock, Archive, Repeat } from 'lucide-react';

const EisenhowerTaskManager = () => {
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
  const [showAIInput, setShowAIInput] = useState(false);
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [filters, setFilters] = useState({
    quadrant: 'all',
    category: 'all',
    status: 'active',
    recurrence: 'all'
  });
  const [sortBy, setSortBy] = useState('priority');
  const [isLoading, setIsLoading] = useState(true);

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
      notes: 'Focus on problem sets 4-7'
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
      notes: 'Data analysis section remaining'
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
      notes: '30 minutes each day'
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
      notes: 'Thursday 3pm'
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
      notes: 'Oil change and tire rotation'
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
      notes: 'Tax deadline April 15th'
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
      notes: 'Research potential topics'
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
      notes: 'Look at elective options'
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
      completedDate: null
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
      completedDate: null
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
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          percentComplete: t.percentComplete === 100 ? 0 : 100,
          completedDate: t.percentComplete === 100 ? null : new Date().toISOString().split('T')[0]
        };
      }
      return t;
    }));
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
              </div>
              <button
                onClick={() => setShowAIInput(true)}
                className="ai-gradient text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-purple-200 font-medium"
              >
                <Sparkles size={18} strokeWidth={2.5} />
                AI Input
              </button>
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
          />
        ) : (
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

      {/* AI Input Modal */}
      {showAIInput && (
        <AIInputModal
          onClose={() => setShowAIInput(false)}
          onTasksCreated={addMultipleTasks}
          settings={settings}
        />
      )}
    </div>
  );
};

const AIInputModal = ({ onClose, onTasksCreated, settings }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleProcess = async () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are a task parser for an Eisenhower Matrix task manager. Parse the following text into structured tasks.

Available categories: ${settings.categories.join(', ')}
Available subcategories by category:
${Object.entries(settings.subcategories).map(([cat, subs]) => `  ${cat}: ${subs.join(', ')}`).join('\n')}

Input text:
${input}

Instructions:
1. Extract each task from the input
2. Determine if each task is urgent (time-sensitive, needs immediate attention)
3. Determine if each task is necessary (important, critical, meaningful impact)
4. Assign a rank (1-3) based on priority within its context (1 = highest priority)
5. Extract or infer a due date (format: YYYY-MM-DD). If no date given, use reasonable defaults (urgent tasks: 2-3 days, non-urgent: 1-2 weeks from today which is ${new Date().toISOString().split('T')[0]})
6. Match to appropriate category and subcategory from the available options
7. Determine recurrence pattern: "once" (one-time task), "daily" (every day), "weekly" (every week), "monthly" (every month), or "yearly" (annually). Look for keywords like "every day", "weekly", "each month", "annual", etc.
8. Extract any notes or additional context

Return ONLY a JSON array with this exact structure (no preamble, no markdown):
[
  {
    "task": "task description",
    "category": "Career or Personal",
    "subcategory": "specific subcategory from the available list",
    "isUrgent": true/false,
    "isNecessary": true/false,
    "rank": 1-3,
    "dueDate": "YYYY-MM-DD",
    "percentComplete": 0,
    "isRecurring": true if pattern is not "once", false otherwise,
    "recurringPattern": "once" | "daily" | "weekly" | "monthly" | "yearly",
    "notes": "any additional context"
  }
]`
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.content.find(c => c.type === 'text')?.text || '';
      
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedTasks = JSON.parse(jsonMatch[0]);
        setResult(parsedTasks);
      } else {
        throw new Error('Could not parse tasks from response');
      }
    } catch (error) {
      console.error('Error processing tasks:', error);
      alert('Failed to process tasks. Please try again or use manual input.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (result && result.length > 0) {
      onTasksCreated(result);
      onClose();
    }
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
    <div className="modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="modal-content bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 ai-gradient px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Sparkles className="text-white" size={24} />
            <h2 className="text-2xl font-bold text-white">AI Task Input</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-slate-600 mb-4">
              Paste your tasks, to-do list, email, or any text. Claude will extract and structure them with recurrence patterns (once, daily, weekly, monthly, yearly).
            </p>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
              rows="12"
              placeholder="Example:
- Finish physics homework by Friday (urgent!)
- Review course notes daily
- Weekly team meeting on Thursdays
- Monthly car maintenance check
- Annual tax filing in April
- Research spring project topics - due Feb 10"
            />
          </div>

          {result && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle size={18} />
                {result.length} task{result.length !== 1 ? 's' : ''} extracted
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.map((task, idx) => (
                  <div key={idx} className="bg-white rounded p-3 border border-green-200">
                    <div className="font-medium text-slate-900">{task.task}</div>
                    <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{task.subcategory}</span>
                      <span className={`px-2 py-0.5 rounded ${task.isUrgent ? 'bg-orange-100 text-orange-700' : 'bg-slate-100'}`}>
                        {task.isUrgent ? 'Urgent' : 'Not Urgent'}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${task.isNecessary ? 'bg-blue-100 text-blue-700' : 'bg-slate-100'}`}>
                        {task.isNecessary ? 'Necessary' : 'Not Necessary'}
                      </span>
                      <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${getRecurrenceColor(task.recurringPattern)}`}>
                        <Repeat size={10} />
                        {task.recurringPattern}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">Due: {task.dueDate}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">Rank: {task.rank}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            {!result ? (
              <button
                onClick={handleProcess}
                disabled={!input.trim() || isProcessing}
                className="px-6 py-3 ai-gradient text-white rounded-lg hover:opacity-90 transition-all shadow-lg shadow-purple-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Parse Tasks
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-200 font-medium flex items-center gap-2"
              >
                <CheckCircle size={18} />
                Add {result.length} Task{result.length !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MatrixView = ({ tasks, getQuadrant, sortTasks, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask }) => {
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

const TaskCard = ({ task, calculatePriority, toggleComplete, onEdit, onDelete }) => {
  const priority = calculatePriority(task);
  const isOverdue = priority < 0;
  const dueDate = new Date(task.dueDate);
  
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

const ListView = ({ tasks, filters, setFilters, sortBy, setSortBy, getQuadrant, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask }) => {
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
      notes: ''
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

export default EisenhowerTaskManager;
