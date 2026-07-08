import React, { useState } from 'react';
import { MatrixTask } from '../components/MatrixTask';

/**
 * Eisenhower 2x2 matrix. Desktop: 4 acrylic-glass quad-panels in a
 * 2x2 grid (cinematic vocabulary). Mobile: tab bar that switches
 * between the 4 quadrants in a single full-height panel. Tasks per
 * quadrant come from getQuadrant(t) classification.
 *
 * Events (t.isEvent) are filtered out — they belong on the Bridge /
 * Calendar, not in the prioritisation grid.
 */
export const MatrixView = ({ tasks, getQuadrant, sortTasks, calculatePriority, toggleComplete, setEditingTask, setShowForm, deleteTask, calculateTaskScore }) => {
  const [activeTab, setActiveTab] = useState('do-first');
  const activeTasks = tasks.filter(t => t.percentComplete < 100 && !t.isEvent);

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
