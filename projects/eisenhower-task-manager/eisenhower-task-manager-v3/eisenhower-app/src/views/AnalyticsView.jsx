import React from 'react';
import { VelocityChart } from '../components/VelocityChart';
import { QID_BY_QUAD } from '../lib/quadrant';

/**
 * PHASE 4b: AnalyticsView (cinematic). 4 scorecard tiles + 2 horizontal
 * bar charts (Quadrant Load + Domain Distribution) + 30-day completion
 * velocity SVG. v2's chart.js charts are retired in favor of the demo's
 * simpler inline-SVG area chart — the v2 version had more depth but
 * didn't match the cinematic vocabulary.
 *
 * Events (t.isEvent) are dropped from analytics — they're calendar
 * items, not tracked work, and would skew quadrant + completion stats.
 */
export const AnalyticsView = ({ tasks: allTasks, calculateTaskScore }) => {
  const tasks = allTasks.filter(t => !t.isEvent);
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
