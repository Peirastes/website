#!/usr/bin/env node
/**
 * Seed PSE-I Summer 2026 PRODUCTION deliverables, sourced from
 * `Dropbox/Agents/TA Agent/DIRECTIVES.md` (updated 2026-06-06).
 *
 * IDs prefixed `psei2026-` for identification + bulk cleanup.
 *
 * Scope: this is Cole's PRODUCTION pipeline — lecture notes, drill
 * builds, HW writes, exam writes. Lab content isn't a TA-side
 * deliverable. Each task's dueDate = the TA directives' ready-by
 * date (not the conduct date).
 *
 * Items marked DONE in the directives (Ch 1-4 notes, HW1, HW2,
 * Drills 1-2, Exam 1) are posted with percentComplete = 100 so they
 * render as dim cores on the Bridge — historical record, not active.
 */

const API = 'http://localhost:3001/api/tasks/add';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const base = {
  domain: 'Teaching',
  scope: 'Professional',
  assignedDate: '2026-06-06',
  completedDate: null,
  percentComplete: 0,
  isRecurring: false,
  recurringPattern: 'once',
  qualityRating: null,
  easeRating: null,
  timeEstimateUnit: 'hours',
  notes: 'PSE-I Summer 2026 production deliverable (per TA DIRECTIVES.md)',
};

const DONE = '2026-06-06'; // mark-complete date for already-shipped items

// ── Lecture notes — bundled per TA directives ───────────────────────
const notes = [
  { id: 'psei2026-notes-ch1',    task: 'PSE-I Notes · Ch 1 (Intro)',                     dueDate: '2026-05-28', done: true },
  { id: 'psei2026-notes-ch2',    task: 'PSE-I Notes · Ch 2 (1-D Kinematics)',            dueDate: '2026-05-30', done: true },
  { id: 'psei2026-notes-ch3',    task: 'PSE-I Notes · Ch 3 (Vectors)',                   dueDate: '2026-06-02', done: true },
  { id: 'psei2026-notes-ch4',    task: 'PSE-I Notes · Ch 4 (2-D Kinematics)',            dueDate: '2026-06-04', done: true },
  { id: 'psei2026-notes-ch5',    task: 'PSE-I Notes · Ch 5 (Newton, FBDs)',              dueDate: '2026-06-08' }, // P0 NEXT
  { id: 'psei2026-notes-ch6',    task: 'PSE-I Notes · Ch 6 (Drag, Non-inertial frames)', dueDate: '2026-06-15' },
  { id: 'psei2026-notes-ch7',    task: 'PSE-I Notes · Ch 7 (Work-Energy, PE)',           dueDate: '2026-06-17' },
  { id: 'psei2026-notes-ch8',    task: 'PSE-I Notes · Ch 8 (Cons. Energy, Power)',       dueDate: '2026-06-22' },
  { id: 'psei2026-notes-ch9',    task: 'PSE-I Notes · Ch 9 (Momentum, Collisions, CoM)', dueDate: '2026-06-24' },
  { id: 'psei2026-notes-ch10',   task: 'PSE-I Notes · Ch 10 (Rotation, Torque)',         dueDate: '2026-06-29' },
  { id: 'psei2026-notes-ch11-12',task: 'PSE-I Notes · Ch 11-12 (Ang. Momentum, Static Eq)', dueDate: '2026-07-01' },
  { id: 'psei2026-notes-ch13',   task: 'PSE-I Notes · Ch 13 (Gravitation)',              dueDate: '2026-07-06' },
  { id: 'psei2026-notes-ch14',   task: 'PSE-I Notes · Ch 14 (Fluids)',                   dueDate: '2026-07-06' },
  { id: 'psei2026-notes-ch15',   task: 'PSE-I Notes · Ch 15 (SHM, Damped/Driven)',       dueDate: '2026-07-08' },
  { id: 'psei2026-notes-ch16-17',task: 'PSE-I Notes · Ch 16-17 (Waves, Sound)',          dueDate: '2026-07-13' },
  { id: 'psei2026-notes-ch18-19',task: 'PSE-I Notes · Ch 18-19 (Thermo, Heat Transfer)', dueDate: '2026-07-22' },
].map(n => ({
  ...n,
  subcategory: 'PSEI Notes',
  isUrgent: true, isNecessary: true, rank: 1,
  timeEstimateValue: 8,
}));

// ── Drill production ────────────────────────────────────────────────
const drills = [
  { id: 'psei2026-drill-1',  task: 'PSE-I Drill 1 (Ch 4)',                          dueDate: '2026-06-01', done: true, dependsOn: ['psei2026-notes-ch4'] },
  { id: 'psei2026-drill-2',  task: 'PSE-I Drill 2 (Ch 4)',                          dueDate: '2026-06-03', done: true, dependsOn: ['psei2026-notes-ch4'] },
  { id: 'psei2026-drill-3',  task: 'PSE-I Drill 3 (Ch 4 UCM/rel + Ch 5.1-5.4)',     dueDate: '2026-06-08', dependsOn: ['psei2026-notes-ch4', 'psei2026-notes-ch5'] },
  { id: 'psei2026-drill-4',  task: 'PSE-I Drill 4 (Exam 1 review, Ch 1-4)',         dueDate: '2026-06-10', dependsOn: ['psei2026-notes-ch1','psei2026-notes-ch2','psei2026-notes-ch3','psei2026-notes-ch4'] },
  { id: 'psei2026-drill-5',  task: 'PSE-I Drill 5 (Ch 5-6)',                        dueDate: '2026-06-15', dependsOn: ['psei2026-notes-ch5', 'psei2026-notes-ch6', 'psei2026-hw-3'] },
  { id: 'psei2026-drill-6',  task: 'PSE-I Drill 6 (Ch 7)',                          dueDate: '2026-06-17', dependsOn: ['psei2026-notes-ch7', 'psei2026-hw-4'] },
  { id: 'psei2026-drill-7',  task: 'PSE-I Drill 7 (Ch 8 + Exam 2 prep)',            dueDate: '2026-06-22', dependsOn: ['psei2026-notes-ch8', 'psei2026-hw-4'] },
  { id: 'psei2026-drill-8',  task: 'PSE-I Drill 8 (Ch 9)',                          dueDate: '2026-06-29', dependsOn: ['psei2026-notes-ch9', 'psei2026-hw-5'] },
  { id: 'psei2026-drill-9',  task: 'PSE-I Drill 9 (Ch 10)',                         dueDate: '2026-07-01', dependsOn: ['psei2026-notes-ch10', 'psei2026-hw-5'] },
  { id: 'psei2026-drill-10', task: 'PSE-I Drill 10 (Ch 11-13)',                     dueDate: '2026-07-06', dependsOn: ['psei2026-notes-ch11-12','psei2026-notes-ch13','psei2026-hw-6'] },
  { id: 'psei2026-drill-11', task: 'PSE-I Drill 11 (Ch 14 + Exam 3 prep)',          dueDate: '2026-07-08', dependsOn: ['psei2026-notes-ch14', 'psei2026-hw-6'] },
  { id: 'psei2026-drill-12', task: 'PSE-I Drill 12 (Ch 15-16) [may drop]',          dueDate: '2026-07-13', dependsOn: ['psei2026-notes-ch15','psei2026-notes-ch16-17','psei2026-hw-7'] },
].map(d => ({
  ...d,
  subcategory: 'PSEI Drill',
  isUrgent: true, isNecessary: true, rank: 2,
  timeEstimateValue: 4,
}));

// ── Homework production ─────────────────────────────────────────────
const hws = [
  { id: 'psei2026-hw-1', task: 'PSE-I HW 1 (Ch 1-2)',          dueDate: '2026-06-01', done: true, dependsOn: ['psei2026-notes-ch1','psei2026-notes-ch2'] },
  { id: 'psei2026-hw-2', task: 'PSE-I HW 2 (Ch 3-4)',          dueDate: '2026-06-04', done: true, dependsOn: ['psei2026-notes-ch3','psei2026-notes-ch4'] },
  { id: 'psei2026-hw-3', task: 'PSE-I HW 3 (Ch 5-6)',          dueDate: '2026-06-22', dependsOn: ['psei2026-notes-ch5','psei2026-notes-ch6','psei2026-exam-2'] },
  { id: 'psei2026-hw-4', task: 'PSE-I HW 4 (Ch 7-8)',          dueDate: '2026-06-29', dependsOn: ['psei2026-notes-ch7','psei2026-notes-ch8','psei2026-exam-2'] },
  { id: 'psei2026-hw-5', task: 'PSE-I HW 5 (Ch 9-10-11)',      dueDate: '2026-07-06', dependsOn: ['psei2026-notes-ch9','psei2026-notes-ch10','psei2026-notes-ch11-12','psei2026-exam-3'] },
  { id: 'psei2026-hw-6', task: 'PSE-I HW 6 (Ch 12-13-14)',     dueDate: '2026-07-13', dependsOn: ['psei2026-notes-ch11-12','psei2026-notes-ch13','psei2026-notes-ch14','psei2026-exam-3'] },
  { id: 'psei2026-hw-7', task: 'PSE-I HW 7 (Ch 15-16)',        dueDate: '2026-07-20', dependsOn: ['psei2026-notes-ch15','psei2026-notes-ch16-17','psei2026-final'] },
  { id: 'psei2026-hw-8', task: 'PSE-I HW 8 (Ch 17-18-19)',     dueDate: '2026-07-27', dependsOn: ['psei2026-notes-ch16-17','psei2026-notes-ch18-19','psei2026-final'] },
].map(h => ({
  ...h,
  subcategory: 'PSEI HW',
  isUrgent: false, isNecessary: true, rank: 2,
  timeEstimateValue: 6,
}));

// ── Exam production ─────────────────────────────────────────────────
const exams = [
  { id: 'psei2026-exam-1', task: 'PSE-I Exam 1 (Ch 1-4)',  dueDate: '2026-06-15', done: true,
    dependsOn: ['psei2026-notes-ch1','psei2026-notes-ch2','psei2026-notes-ch3','psei2026-notes-ch4'] },
  { id: 'psei2026-exam-2', task: 'PSE-I Exam 2 (Ch 5-8)',  dueDate: '2026-06-29',
    dependsOn: ['psei2026-notes-ch5','psei2026-notes-ch6','psei2026-notes-ch7','psei2026-notes-ch8'] },
  { id: 'psei2026-exam-3', task: 'PSE-I Exam 3 (Ch 9-14)', dueDate: '2026-07-14',
    dependsOn: ['psei2026-notes-ch9','psei2026-notes-ch10','psei2026-notes-ch11-12','psei2026-notes-ch13','psei2026-notes-ch14'] },
  { id: 'psei2026-final',  task: 'PSE-I Final Exam (cumulative)', dueDate: '2026-07-26',
    dependsOn: ['psei2026-exam-1','psei2026-exam-2','psei2026-exam-3','psei2026-notes-ch15','psei2026-notes-ch16-17','psei2026-notes-ch18-19'] },
].map(e => ({
  ...e,
  subcategory: 'PSEI Exam',
  isUrgent: true, isNecessary: true, rank: 1,
  timeEstimateValue: 12,
}));

const all = [...notes, ...drills, ...hws, ...exams];

let posted = 0, failed = 0;
for (const partial of all) {
  const { done, ...rest } = partial;
  const task = {
    ...base,
    ...rest,
    ...(done ? { percentComplete: 100, completedDate: DONE } : {}),
  };
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
      const tag = done ? '✓' : '+';
      console.log(`${tag} ${body.id.padEnd(28)}  ${body.task}` + (attempt > 1 ? `  (attempt ${attempt})` : ''));
      ok = true; posted++;
    } catch (err) {
      if (attempt < 6) await sleep(500 * attempt);
      else { console.error(`! ${task.id}  ${err.message} (gave up)`); failed++; }
    }
  }
  await sleep(350);
}
console.log(`\nDone. ${posted} posted, ${failed} failed.`);
