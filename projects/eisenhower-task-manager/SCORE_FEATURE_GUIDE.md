# Planning/Execution Score Feature - User Guide

**Version:** 2.0.1
**Date Added:** 2026-01-24
**Status:** ✅ Live & Ready to Use

---

## What Is the Score?

The **Planning/Execution Score** measures how accurately you estimated the due date for a task.

It answers: *"Did I complete this task when I planned to?"*

---

## How It Works

### The Formula

```
Score = (Due Date - Completed Date) / (Due Date - Assigned Date)
```

**In Plain English:**
- Measure how many "days early or late" you finished
- Divide by total days available
- Get a score from -1 to +1 (and beyond)

### Real Examples

**Example 1: Great Planning ✅**
```
Assigned:    Jan 15
Due:         Jan 20 (5 days available)
Completed:   Jan 18
Score:       (20 - 18) / (20 - 15) = 2/5 = 0.40

Interpretation: Finished 2 days early = good planning!
```

**Example 2: Tight Deadline ⏱️**
```
Assigned:    Jan 15
Due:         Jan 20 (5 days available)
Completed:   Jan 20
Score:       (20 - 20) / (20 - 15) = 0/5 = 0.00

Interpretation: Finished exactly on time = perfect timing!
```

**Example 3: Missed Deadline ⚠️**
```
Assigned:    Jan 15
Due:         Jan 20 (5 days available)
Completed:   Jan 23
Score:       (20 - 23) / (20 - 15) = -3/5 = -0.60

Interpretation: Finished 3 days late = missed deadline
```

---

## Understanding Scores

### Score Range

| Score | Meaning | Color |
|-------|---------|-------|
| 0.75+ | Excellent planning (finished in first quarter) | 🟢 Green |
| 0.50-0.75 | Good planning (finished first half) | 🟢 Light Green |
| 0.25-0.50 | Fair planning (finished second quarter) | 🟡 Yellow-Green |
| 0-0.25 | Tight deadline (finished near due date) | 🟡 Yellow |
| Negative | Deadline missed (finished after due date) | 🔴 Red |

### Color Visualization

The score bar shows a **gradient from red (late) to green (early):**

```
Late ←――――――――――――→ On-Time ←―――――――――――――→ Early
-1.0  -0.5   0.0          0.5    1.0
🔴    🟠    🟡           🟡     🟢
```

---

## Where to Find Your Score

### In Matrix View
- Completed task cards show score below the due date
- Label: "Planning/Execution Score:"
- Displays as: `[bar] 0.45`

**Example:**
```
┌─────────────────────────────┐
│ Prepare Homework (HW3)       │
│ Rank 1 | Dynamics | ☀️ daily │
│ Due: 1/25/2025              │
│                             │
│ Planning/Execution Score:   │
│ [═════════════ ] 0.68       │
└─────────────────────────────┘
```

### In List View
- New "Score" column in the tasks table
- Shows the same bar + number visualization
- Sortable (click header to sort by score)

**Example:**
```
Task              | Score
─────────────────────────────
Homework HW3      | [═══════════════ ] 0.68
Complete Lab Rpt  | [═══════════════════ ] 0.92
File Tax Docs     | [════════════════ ] 0.55
Browse Catalog    | [═══ ] -0.15
```

---

## Score Interpretation

### What a Good Score Means

**High Score (> 0.5):**
- ✅ You estimated well
- ✅ You had comfortable time margin
- ✅ Low stress, high quality
- 💡 You could add more work in similar timeframe

**Medium Score (0 - 0.5):**
- ✅ You estimated reasonably
- ⚠️ Tight timeline but you delivered
- 💡 You know your speed fairly well

**Low/Negative Score (< 0):**
- ⚠️ You underestimated time needed
- ⚠️ Missed deadline or just barely made it
- 💡 This category needs more buffer time

### Patterns to Look For

Track your scores over time to find patterns:

**Question: Do my scores vary by category?**
```
Career tasks:     avg 0.45 (good estimator)
Personal tasks:   avg 0.10 (need more buffer)
Finance tasks:    avg -0.05 (consistently late)
```

**Question: Do I get better over time?**
```
Last month:  avg 0.25
This month:  avg 0.35
Trend:       ✅ Improving!
```

**Question: Am I too optimistic about certain task types?**
```
Quick tasks:     0.60 (you're optimistic, but it works)
Medium tasks:    0.35 (reasonable estimates)
Long projects:   0.05 (way too optimistic)
```

---

## Using Scores to Improve

### For Future Planning

1. **Identify Problem Areas**
   - Export data or scan scores
   - Find categories with negative or low scores
   - Example: "Finance always scores -0.10"

2. **Adjust Your Estimates**
   - Add buffer to categories that score poorly
   - If Finance averages -0.10, add 10% extra time
   - Keep comfortable margin for uncertain tasks

3. **Learn Your Patterns**
   - How long do "reports" actually take?
   - How much time do meetings need prep?
   - Build a mental model of your speed

### For Better Decisions

**When Creating a Task:**
- If it's like past tasks scoring 0.30, you can:
  - Give less deadline padding
  - Take on more work
  - Increase quality expectations

- If it's like past tasks scoring -0.20, you should:
  - Add 20% more time to estimate
  - Prioritize this type of task earlier
  - Break into smaller pieces

**When You're At Risk:**
- High score for similar tasks gives you confidence to commit
- Low/negative score for similar tasks = add buffer now
- System may warn you if task looks "at risk"

---

## Edge Cases (When Score Won't Show)

The score only appears for completed tasks with:
- ✅ Task is marked 100% complete
- ✅ Has a valid due date
- ✅ Has a valid assigned date
- ✅ Assigned date ≠ due date (prevents division by zero)

**Tasks without scores:**
- Incomplete tasks → Shows "-"
- Tasks with no due date → Not scored
- Tasks assigned and due on same day → Skipped (ambiguous)

---

## Future Features (Coming Soon)

Score data enables these future enhancements:

1. **Score Analytics Dashboard**
   - View score trends by category
   - See distribution of your scores
   - Identify which categories need improvement

2. **Smart Deadline Suggestions**
   - System suggests due dates based on your history
   - "For Career tasks, add 5 days" (based on your 0.45 avg)
   - Help remove guesswork from estimates

3. **Planning Health Indicator**
   - Dashboard showing planning quality
   - Categories where you excel
   - Areas needing attention

4. **Risk Warnings**
   - "This task looks risky - similar ones scored -0.15"
   - "You typically take 6 days, you have 5"
   - Early warning to adjust timeline

---

## Tips for Better Scores

### 1. Be Honest With Dates
- Set realistic due dates initially
- Not too ambitious, not too conservative
- Scores are most useful when they reflect your real work

### 2. Track Patterns
- Notice which types of tasks you misjudge
- Build experience with your own speed
- Adjust future estimates accordingly

### 3. Don't Obsess Over Perfection
- Score isn't a judgment
- It's a learning tool
- Negative scores are valuable feedback

### 4. Use Multiple Views
- Check Matrix View for quadrant-specific patterns
- Check List View for category comparisons
- Both perspectives are useful

### 5. Export and Analyze
- Periodically export your tasks
- Look for trends
- Identify your "sweet spot" work

---

## FAQ

**Q: Can I improve a negative score?**
A: Once the score is calculated (task is complete), it won't change. But you can use it to improve future task scores by adjusting your estimates.

**Q: Should I aim for a specific score?**
A: Probably 0.3-0.5 is healthy (finished comfortably early but not with excessive buffer). But depends on task type!

**Q: What if all my scores are negative?**
A: You're consistently underestimating time needed. Try adding 20-30% buffer to all future estimates.

**Q: What if all my scores are > 0.8?**
A: You're very conservative in estimates! You could probably take on more work or reduce buffer time.

**Q: Can I edit a completed date to change the score?**
A: Not recommended (defeats the purpose), but technically you can if you edit the task. Score recalculates automatically.

**Q: Is the score visible to others?**
A: No. All scores are stored locally. Nobody sees your planning accuracy but you.

**Q: How does score relate to Quality/Ease ratings?**
A: They're separate:
- **Quality/Ease** = How well did you do + how hard was it?
- **Score** = How well did you estimate the timeline?

---

## Examples in Action

### Example 1: Learn From History
```
You complete "Write Summary" tasks frequently.
Check scores:
- Jan 5:  0.40
- Jan 12: 0.35
- Jan 19: 0.45
- Jan 26: 0.38
Average: 0.40

Next "Write Summary": Set 5-6 day deadline
(instead of guessing each time)
```

### Example 2: Fix Problem Areas
```
Career → Dynamics tasks scoring poorly: -0.05 avg
Personal → Health tasks scoring well: 0.55 avg

Insight: "I'm bad at estimating Dynamics, good at Health"
Action: Add 10% buffer to Dynamics, stick with Health estimates
```

### Example 3: Track Improvement
```
Month 1: Average score 0.25
Month 2: Average score 0.28
Month 3: Average score 0.35
Trend: Improving! Better at planning over time
```

---

## Next Steps

1. **Complete some tasks** - Generate score data
2. **Review your scores** - Look for patterns
3. **Adjust future estimates** - Use scores to guide
4. **Track trends** - Monitor if improving
5. **Wait for analytics** - More insights coming soon!

---

## Questions or Feedback?

The score feature is new and will improve with your feedback:
- Is the score easy to understand?
- Would you like different metrics?
- What analysis would be most useful?
- Any bugs or confusing behavior?

---

**Happy Planning! 📊**

Remember: The goal isn't perfection. It's awareness and continuous improvement!
