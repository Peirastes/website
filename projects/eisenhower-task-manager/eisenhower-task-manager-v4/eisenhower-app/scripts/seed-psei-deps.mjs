#!/usr/bin/env node
/**
 * One-shot seed of PSEI deliverables with dependency arcs for testing
 * the Bridge view's great-circle dependency rendering.
 *
 * Run from the eisenhower-app dir:
 *   node scripts/seed-psei-deps.mjs
 *
 * All seeded tasks have IDs prefixed `psei-test-` so they're easy to
 * find and delete later. The script POSTs to /api/tasks/add on
 * http://localhost:3001.
 */

const API = 'http://localhost:3001/api/tasks/add';

const baseTask = {
  subcategory: 'PSEI',
  domain: 'Teaching',
  scope: 'Professional',
  assignedDate: '2026-06-06',
  completedDate: null,
  percentComplete: 0,
  isRecurring: false,
  recurringPattern: 'once',
  notes: 'PSEI test deliverable (auto-seeded for dependency-arc demo)',
  qualityRating: null,
  easeRating: null,
  timeEstimateUnit: 'hours',
};

const tasks = [
  // Lecture cascade — Q2 Strategic
  { id: 'psei-test-lec-1', task: 'PSE-I Lecture · Ch 1 Intro',          dueDate: '2026-06-08', isUrgent: false, isNecessary: true,  rank: 2, timeEstimateValue: 4,  dependsOn: [] },
  { id: 'psei-test-lec-2', task: 'PSE-I Lecture · Ch 2 1-D Kinematics', dueDate: '2026-06-10', isUrgent: false, isNecessary: true,  rank: 2, timeEstimateValue: 4,  dependsOn: ['psei-test-lec-1'] },
  { id: 'psei-test-lec-3', task: 'PSE-I Lecture · Ch 3 Vectors',        dueDate: '2026-06-15', isUrgent: false, isNecessary: true,  rank: 2, timeEstimateValue: 4,  dependsOn: ['psei-test-lec-2'] },
  { id: 'psei-test-lec-4', task: 'PSE-I Lecture · Ch 4 2-D Kinematics', dueDate: '2026-06-17', isUrgent: false, isNecessary: true,  rank: 2, timeEstimateValue: 4,  dependsOn: ['psei-test-lec-3'] },
  { id: 'psei-test-lec-5', task: 'PSE-I Lecture · Ch 5 Energy',         dueDate: '2026-06-22', isUrgent: false, isNecessary: true,  rank: 2, timeEstimateValue: 5,  dependsOn: ['psei-test-lec-4'] },

  // Drills — Q2 then Q1 closer to due
  { id: 'psei-test-drill-1', task: 'PSE-I Drill 1 · Ch 1-2',             dueDate: '2026-06-12', isUrgent: true,  isNecessary: true,  rank: 3, timeEstimateValue: 2,  dependsOn: ['psei-test-lec-1', 'psei-test-lec-2'] },
  { id: 'psei-test-drill-2', task: 'PSE-I Drill 2 · Ch 3-4',             dueDate: '2026-06-19', isUrgent: false, isNecessary: true,  rank: 3, timeEstimateValue: 2,  dependsOn: ['psei-test-lec-3', 'psei-test-lec-4'] },
  { id: 'psei-test-drill-3', task: 'PSE-I Drill 3 · Free-fall pre-lab',  dueDate: '2026-06-24', isUrgent: false, isNecessary: true,  rank: 3, timeEstimateValue: 2,  dependsOn: ['psei-test-lec-5'] },

  // Homework — Q1 Critical (graded artifacts)
  { id: 'psei-test-hw-1',  task: 'PSE-I HW 1 · Ch 1+2 grading',          dueDate: '2026-06-19', isUrgent: true,  isNecessary: true,  rank: 2, timeEstimateValue: 6,  dependsOn: ['psei-test-lec-1', 'psei-test-lec-2'] },
  { id: 'psei-test-hw-2',  task: 'PSE-I HW 2 · Ch 3+4 grading',          dueDate: '2026-06-26', isUrgent: true,  isNecessary: true,  rank: 2, timeEstimateValue: 6,  dependsOn: ['psei-test-lec-3', 'psei-test-lec-4'] },

  // Lab — depends on the pre-lab drill
  { id: 'psei-test-lab-105', task: 'PSE-I Lab 105 · Free-Fall',          dueDate: '2026-06-26', isUrgent: false, isNecessary: true,  rank: 3, timeEstimateValue: 3,  dependsOn: ['psei-test-drill-3'] },

  // Exam — the convergence point. Q1 Critical, depends on everything.
  { id: 'psei-test-exam-1', task: 'PSE-I Exam 1',                        dueDate: '2026-07-01', isUrgent: true,  isNecessary: true,  rank: 1, timeEstimateValue: 8,
    dependsOn: [
      'psei-test-lec-1', 'psei-test-lec-2', 'psei-test-lec-3', 'psei-test-lec-4', 'psei-test-lec-5',
      'psei-test-hw-1',  'psei-test-hw-2',
      'psei-test-drill-1', 'psei-test-drill-2',
    ],
  },
];

/* Dropbox occasionally locks the tasks.json during sync, causing
   sporadic EPERM on the server's atomic-rename. Retry with backoff
   and stagger POSTs to dodge the race. */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let posted = 0, failed = 0;
for (const partial of tasks) {
  const task = { ...baseTask, ...partial };
  let ok = false;
  for (let attempt = 1; attempt <= 6 && !ok; attempt++) {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      console.log(`+ ${body.id}  ${body.task}` + (attempt > 1 ? `  (attempt ${attempt})` : ''));
      ok = true;
      posted++;
    } catch (err) {
      if (attempt < 6) await sleep(500 * attempt);
      else { console.error(`! ${task.id}  ${err.message} (gave up)`); failed++; }
    }
  }
  await sleep(400);
}
console.log(`\nDone. ${posted} posted, ${failed} failed.`);
