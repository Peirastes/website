# Eisenhower Task Manager App — Development Specification

## Overview

Build a React web application implementing the Eisenhower Method for task prioritization. The app must persist data across sessions using the browser's persistent storage API, enabling deployment on websites for multi-user use.

---

## Source Material Analysis

Two spreadsheets inform this design:

### Task_Manager.xlsx Structure
- **Four Eisenhower Quadrants**: Urgent & Necessary, Urgent but Not Necessary, Necessary but Not Urgent, Neither Urgent Nor Necessary
- **Ranking System**: Tasks ranked 0-3 within each quadrant (lower = higher priority)
- **Task Categories**: Work Tasks vs Personal Tasks
- **Subcategories**: Organized by course/project (Physics, Dynamics, Intro to Engineering, Thermal Engineering Lab, etc.)
- **Recurrence Types**: "Weekly" tasks vs "Once" tasks
- **Goal Statement**: "REDUCE THE NUMBER OF 1's IN THE TASKLIST" — emphasizes clearing urgent/necessary items

### Order_of_Operations.xlsx Structure
- **Columns**: Priority, Category, Subcategory, Task, Assigned Date, Due Date, Complete Date, % Complete
- **Priority Calculation**: Derived from `Due Date - Today's Date` (negative = overdue)
- **Categories**: Career, Personal
- **Completion Tracking**: % Complete (0-1 scale), with completion date recorded
- **Performance Metrics**: Calculates days ahead/behind schedule

---

## Technical Requirements

### Platform
- **Framework**: React (single-file .jsx artifact)
- **Styling**: Tailwind CSS (core utility classes only)
- **Storage**: `window.storage` API for persistence (NOT localStorage)
- **Deployment**: Embeddable on external websites

### Storage API Usage
```javascript
// Save tasks (personal storage, per-user)
await window.storage.set('eisenhower-tasks', JSON.stringify(tasks), false);

// Load tasks
const result = await window.storage.get('eisenhower-tasks', false);
const tasks = result ? JSON.parse(result.value) : [];

// Save user preferences/categories
await window.storage.set('eisenhower-settings', JSON.stringify(settings), false);
```

**Critical**: Always wrap storage calls in try-catch. Non-existent keys throw errors.

---

## Data Model

### Task Object
```javascript
{
  id: string,              // UUID or timestamp-based
  task: string,            // Task description
  category: string,        // "Career" | "Personal" | custom
  subcategory: string,     // e.g., "Dynamics", "Intro to Engineering"
  isUrgent: boolean,       // Determines quadrant (x-axis)
  isNecessary: boolean,    // Determines quadrant (y-axis)
  rank: number,            // 1-3, manual priority within quadrant
  assignedDate: string,    // ISO date string
  dueDate: string,         // ISO date string
  completedDate: string|null,
  percentComplete: number, // 0-100
  isRecurring: boolean,
  recurringPattern: string|null,  // "weekly" | "monthly" | null
  notes: string
}
```

### Settings Object
```javascript
{
  categories: ["Career", "Personal"],
  subcategories: {
    "Career": ["Dynamics", "Statics", "Intro to Engineering", "Thermal Engineering Lab", ...],
    "Personal": ["Car", "Home", "Health", ...]
  },
  defaultView: "matrix" | "list"
}
```

---

## Core Features

### 1. Eisenhower Matrix View (Primary)
- **2×2 Grid Layout**:
  ```
  ┌─────────────────────┬─────────────────────┐
  │  URGENT & NECESSARY │  NECESSARY, NOT     │
  │  (Do First)         │  URGENT (Schedule)  │
  │  Red/Orange accent  │  Blue accent        │
  ├─────────────────────┼─────────────────────┤
  │  URGENT, NOT        │  NEITHER            │
  │  NECESSARY(Delegate)│  (Eliminate/Defer)  │
  │  Yellow accent      │  Gray accent        │
  └─────────────────────┴─────────────────────┘
  ```
- Display task count per quadrant in header
- Tasks sorted by: (1) rank ascending, (2) due date ascending
- Visual indicators: overdue tasks highlighted, completion percentage shown
- Click task to edit, checkbox to mark complete

### 2. Task Entry/Edit Form
- **Required Fields**: Task name, Due date, Urgent toggle, Necessary toggle
- **Optional Fields**: Category, Subcategory, Assigned date, Rank (1-3), Notes, Recurring toggle
- **Smart Defaults**: Assigned date = today, Category = "Career", Rank = 2
- Modal or slide-out panel design

### 3. List View (Secondary)
- Sortable columns: Priority (calculated), Due Date, Category, Subcategory, % Complete
- Filterable by: Quadrant, Category, Status (Active/Completed/All), Date range
- Inline quick-complete toggle
- Priority score display: `daysToDue = dueDate - today` (negative = overdue)

### 4. Priority Calculation Logic
```javascript
const calculatePriority = (task) => {
  const today = new Date();
  const due = new Date(task.dueDate);
  const daysToDue = Math.floor((due - today) / (1000 * 60 * 60 * 24));
  return daysToDue; // Negative = overdue, lower = more urgent
};
```

### 5. Statistics/Dashboard Panel
- Total tasks by quadrant
- Completion rate (completed / total)
- Overdue count
- Tasks due this week

### 6. Data Management
- Auto-save on every change
- Export to JSON button
- Import from JSON button
- Clear all data (with confirmation)

---

## UI/UX Requirements

### Design Direction
- **Aesthetic**: Clean, professional, productivity-focused
- **Theme**: Light mode primary, high contrast for quadrant differentiation
- **Typography**: Use distinctive, readable fonts (avoid Inter/Arial)
- **Color Palette**:
  - Urgent & Necessary: Warm red/coral tones
  - Necessary, Not Urgent: Cool blue tones
  - Urgent, Not Necessary: Amber/yellow tones
  - Neither: Neutral gray tones
  - Completed tasks: Muted/desaturated

### Layout Structure
```
┌────────────────────────────────────────────────────────┐
│  HEADER: App title, View toggle (Matrix|List), + Add  │
├────────────────────────────────────────────────────────┤
│  STATS BAR: Quadrant counts, Overdue alert, Due today │
├────────────────────────────────────────────────────────┤
│                                                        │
│                   MAIN CONTENT                         │
│         (Matrix View or List View)                     │
│                                                        │
├────────────────────────────────────────────────────────┤
│  FOOTER: Export | Import | Settings                   │
└────────────────────────────────────────────────────────┘
```

### Responsive Behavior
- Desktop: Full 2×2 matrix side-by-side
- Tablet: 2×2 matrix with smaller cards
- Mobile: Stack quadrants vertically or default to list view

---

## Component Breakdown

### Required Components
1. **App** — Main container, state management, storage integration
2. **Header** — Title, view toggle, add task button
3. **StatsBar** — Quadrant counts, alerts
4. **EisenhowerMatrix** — 2×2 grid container
5. **QuadrantPanel** — Individual quadrant with task list
6. **TaskCard** — Task display within quadrant (compact)
7. **TaskList** — Table/list view with sorting
8. **TaskRow** — Individual task in list view
9. **TaskForm** — Add/Edit modal
10. **FilterBar** — Filters for list view
11. **Footer** — Export/Import/Settings actions

### State Structure
```javascript
const [tasks, setTasks] = useState([]);
const [settings, setSettings] = useState({...});
const [view, setView] = useState('matrix'); // 'matrix' | 'list'
const [editingTask, setEditingTask] = useState(null);
const [showForm, setShowForm] = useState(false);
const [filters, setFilters] = useState({
  quadrant: 'all',
  category: 'all',
  status: 'active', // 'active' | 'completed' | 'all'
});
const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'dueDate' | 'category'
const [isLoading, setIsLoading] = useState(true);
```

---

## Implementation Notes

### Storage Pattern
```javascript
// On mount: load data
useEffect(() => {
  const loadData = async () => {
    try {
      const result = await window.storage.get('eisenhower-tasks');
      if (result) setTasks(JSON.parse(result.value));
    } catch (e) {
      // Key doesn't exist yet, use empty array
      setTasks([]);
    }
    setIsLoading(false);
  };
  loadData();
}, []);

// On tasks change: save data
useEffect(() => {
  if (!isLoading) {
    window.storage.set('eisenhower-tasks', JSON.stringify(tasks));
  }
}, [tasks, isLoading]);
```

### Quadrant Assignment
```javascript
const getQuadrant = (task) => {
  if (task.isUrgent && task.isNecessary) return 'do-first';
  if (!task.isUrgent && task.isNecessary) return 'schedule';
  if (task.isUrgent && !task.isNecessary) return 'delegate';
  return 'eliminate';
};
```

### Task Sorting Within Quadrant
```javascript
const sortTasks = (tasks) => {
  return [...tasks].sort((a, b) => {
    // First by rank (1 before 2 before 3)
    if (a.rank !== b.rank) return a.rank - b.rank;
    // Then by due date (earliest first)
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
};
```

---

## Sample Seed Data

Include 5-8 sample tasks on first load if storage is empty:

```javascript
const sampleTasks = [
  {
    id: '1',
    task: 'Prepare Homework (HW3)',
    category: 'Career',
    subcategory: 'Dynamics',
    isUrgent: true,
    isNecessary: true,
    rank: 2,
    assignedDate: '2025-01-20',
    dueDate: '2025-01-25',
    completedDate: null,
    percentComplete: 0,
    isRecurring: false,
    recurringPattern: null,
    notes: ''
  },
  // ... more samples covering each quadrant
];
```

---

## Acceptance Criteria

1. ✅ Tasks persist across page reloads using window.storage API
2. ✅ Eisenhower 2×2 matrix displays tasks in correct quadrants
3. ✅ Users can add, edit, complete, and delete tasks
4. ✅ Tasks sort by rank then due date within each quadrant
5. ✅ List view provides alternative sortable/filterable display
6. ✅ Priority score calculates days until due (negative = overdue)
7. ✅ Visual distinction between quadrants via color coding
8. ✅ Responsive design works on desktop and mobile
9. ✅ Export/Import functionality for data backup
10. ✅ Clean, professional UI avoiding generic AI aesthetics

---

## Stretch Goals (If Time Permits)

- Drag-and-drop between quadrants
- Recurring task auto-generation
- Due date notifications/alerts
- Dark mode toggle
- Keyboard shortcuts (n = new task, e = edit, etc.)
- Category/subcategory management UI
