const fs = require('fs');
const path = require('path');

class TokenTracker {
  constructor(usageFile, monthlyBudget = 10) {
    this.usageFile = usageFile;
    this.monthlyBudget = monthlyBudget;
    this.data = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.usageFile)) {
        return JSON.parse(fs.readFileSync(this.usageFile, 'utf-8'));
      }
    } catch {}
    return { daily: {}, totalInput: 0, totalOutput: 0 };
  }

  _save() {
    const dir = path.dirname(this.usageFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.usageFile, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  record(inputTokens, outputTokens) {
    const today = new Date().toISOString().split('T')[0];
    if (!this.data.daily[today]) {
      this.data.daily[today] = { input: 0, output: 0, requests: 0 };
    }
    this.data.daily[today].input += inputTokens;
    this.data.daily[today].output += outputTokens;
    this.data.daily[today].requests += 1;
    this.data.totalInput = (this.data.totalInput || 0) + inputTokens;
    this.data.totalOutput = (this.data.totalOutput || 0) + outputTokens;
    this._save();
  }

  estimateCost(input, output) {
    // Sonnet 4: $3/1M input, $15/1M output
    return (input * 3 / 1000000) + (output * 15 / 1000000);
  }

  getSummary() {
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    let monthInput = 0, monthOutput = 0, monthRequests = 0;
    for (const [day, usage] of Object.entries(this.data.daily)) {
      if (day.startsWith(month)) {
        monthInput += usage.input;
        monthOutput += usage.output;
        monthRequests += usage.requests;
      }
    }

    const todayUsage = this.data.daily[today] || { input: 0, output: 0, requests: 0 };
    const monthCost = this.estimateCost(monthInput, monthOutput);
    const totalCost = this.estimateCost(this.data.totalInput || 0, this.data.totalOutput || 0);
    const budgetRemaining = this.monthlyBudget - monthCost;
    const budgetPct = Math.round((monthCost / this.monthlyBudget) * 100);

    return {
      today: {
        input: todayUsage.input,
        output: todayUsage.output,
        requests: todayUsage.requests,
        cost: this.estimateCost(todayUsage.input, todayUsage.output).toFixed(4)
      },
      month: {
        input: monthInput,
        output: monthOutput,
        requests: monthRequests,
        cost: monthCost.toFixed(4),
        budget: this.monthlyBudget,
        remaining: budgetRemaining.toFixed(4),
        budgetPct
      },
      allTime: {
        input: this.data.totalInput || 0,
        output: this.data.totalOutput || 0,
        cost: totalCost.toFixed(4)
      },
      recent: this._recentDays(7)
    };
  }

  _recentDays(n) {
    const days = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const usage = this.data.daily[key] || { input: 0, output: 0, requests: 0 };
      days.push({ date: key, ...usage, cost: this.estimateCost(usage.input, usage.output).toFixed(4) });
    }
    return days;
  }

  isOverBudget() {
    const summary = this.getSummary();
    return summary.month.budgetPct >= 100;
  }

  reset() {
    this.data = { daily: {}, totalInput: 0, totalOutput: 0 };
    this._save();
  }
}

module.exports = { TokenTracker };
