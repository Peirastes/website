# Gantt Chart View Guide

The **Gantt Chart View** visualizes your tasks as a timeline, helping you see at a glance when tasks are scheduled to run and how they relate to each other over time.

## Overview

The Gantt Chart displays:
- **Horizontal bars** representing task duration (from estimated start to due date)
- **Swim lanes** organizing tasks by quadrant or category
- **Timeline axis** showing dates with current day highlighted in red
- **Color coding** matching the Eisenhower Matrix (Do First, Schedule, Delegate, Eliminate)
- **Milestones** (diamonds) for tasks without time estimates

## Key Features

### Time Estimation

Time estimates are optional fields that tell the system how long a task will take:

- **Hours**: For tasks taking less than a full day (0.5h, 2h, 8h, etc.)
- **Days**: For longer tasks (1d, 2d, 5d, etc.)
- **5-Minute Rule**: The form includes a reminder: if a task takes less than 5 minutes, just do it now instead of scheduling it

**How it works:**
- Due Date minus Time Estimate = Task Start Date
- Example: Due Friday at 3 tasks with 8 hours of work = starts Wednesday
- Tasks without estimates appear as diamonds (milestones) on their due date

### Timeline Calculation

The Gantt chart automatically calculates task timelines:

```
Start Date ────────── Task Duration ────────── Due Date
           [====== Bar Representing Task ======]
```

For a task with:
- Due Date: Jan 30
- Time Estimate: 2 days

The bar will start on Jan 28 and end on Jan 30.

### Filtering & Organization

**Status Filter:**
- **Active Tasks**: Shows only incomplete tasks
- **Completed**: Shows only finished tasks (at 50% opacity)
- **All Tasks**: Shows everything

**Quadrant Filter:**
- Filter by Do First, Schedule, Delegate, or Eliminate
- Shows only tasks in selected quadrant

**Category Filter:**
- Filter by Career or Personal
- Shows only tasks in selected category

**Group By:**
- **Quadrant**: Organizes swim lanes by urgency/necessity (Do First, Schedule, etc.)
- **Category**: Organizes swim lanes by Career/Personal

### Visual Elements

#### Color Coding

- **Red** (#ef4444): Do First (Urgent & Necessary)
- **Blue** (#3b82f6): Schedule (Necessary, Not Urgent)
- **Amber** (#f59e0b): Delegate (Urgent, Not Necessary)
- **Gray** (#9ca3af): Eliminate (Neither Urgent Nor Necessary)

#### Shading & Indicators

- **Red Vertical Line**: Today's date
- **Gray Background**: Weekends (Saturday/Sunday)
- **Diamonds**: Tasks without time estimates (milestones)
- **Task Names**: Truncated on narrow bars, fully visible on hover

#### Task Information

Each task bar shows (when space allows):
- Task name
- Time estimate badge (e.g., "5h" or "2d")

Hover over any task to see a tooltip with:
- Full task name
- Due date
- Time estimate
- Rank (1-3)

### Interactivity

#### Hover Effects

- Entire row highlights in light blue
- Tooltip appears with full task details
- Bar opacity increases on hover

#### Click Actions

- **Click task bar or row**: Opens task edit form
- **Click checkbox**: Toggles task completion
- **Edit icon**: Opens task editor
- **Delete icon**: Removes task (with confirmation)

### Task Badges & Indicators

Each task in a lane shows:
- **Task name** (with progress strikethrough if completed)
- **Time estimate** (e.g., "⏱ 5h" or "⏱ 2d")
- **Action buttons**: Checkbox, edit, delete

## Workflow Examples

### Example 1: Planning a Project

1. Create task: "Research spring project topics"
   - Due: Feb 10
   - Time Estimate: 2 days
   - Quadrant: Schedule

2. In Gantt view:
   - Bar appears starting Feb 8, ending Feb 10
   - Blue color indicates Schedule quadrant
   - Positioned in "Schedule" swim lane

3. When you complete it:
   - Bar becomes 50% transparent
   - Row appears slightly faded
   - Still visible for reference

### Example 2: Comparing Task Durations

Create three tasks with same due date but different estimates:

| Task | Due Date | Estimate | Starts |
|------|----------|----------|--------|
| Quick review | Jan 30 | 1h | Jan 30 |
| Report | Jan 30 | 8h | Jan 29 |
| Project | Jan 30 | 3d | Jan 27 |

In Gantt view, you'll see bars of different widths, making workload immediately obvious.

### Example 3: Identifying Bottlenecks

Filter by "Do First" quadrant to see urgent tasks:
- If many bars overlap, you have a bottleneck
- Some tasks may need to be rescheduled or delegated
- Use the timeline to communicate realistic deadlines

## Tips & Best Practices

### 1. **Be Realistic with Estimates**

- 1 hour is the minimum useful estimate
- Break tasks under 1 hour into subtasks (or just do them immediately)
- Consider interruptions and context switching
- A 2-day task might be 16 hours of work, not 2x8

### 2. **Use Milestones for Deadlines**

Leave time estimate blank for hard deadlines (e.g., "Submit report by Friday")
- Appears as diamond on due date
- Helps identify critical path items
- Prevents false sense of when work begins

### 3. **Plan Backward from Due Dates**

The Gantt chart's strength is backward planning:
1. Set realistic due dates
2. Estimate how long it takes
3. System calculates when you need to start
4. Compare with available time

### 4. **Review Weekly**

- Check the Gantt view every Sunday evening
- Look for overlapping Do First tasks (bottlenecks)
- Reschedule or adjust estimates
- Celebrate completed tasks

### 5. **Filter for Focus**

- Filter to "Do First" to see critical path
- Filter to "Schedule" to plan next 2 weeks
- Group by Category to focus on work vs. personal

## Limitations & Considerations

### Current Limitations

1. **No Drag & Drop**: Drag-and-drop rescheduling not yet implemented
2. **No Dependencies**: Can't link tasks or show critical path
3. **Simple Time View**: Shows ~90 days at a time
4. **No Resources**: Doesn't show workload distribution by person
5. **Mobile**: Best viewed on desktop; narrow screens show warning

### Tasks Without Due Dates

Tasks without due dates are excluded from Gantt view. The status bar shows how many tasks are excluded.

**To fix:**
- Open task form and set a due date
- Or filter them out of view

### Very Long Estimates

Tasks estimated > 90 days work, but:
- Bar might extend off-screen
- Consider breaking into phases or milestones
- Each phase can be a separate task

## Settings & Customization

### Time Estimate Units

Choose hours or days based on task scale:

| Choose | If Task is... |
|--------|---------------|
| Hours | < 1 day of work (0.5h to 8h typical) |
| Days | > 1 full day of work (2d, 5d, etc.) |

The system assumes 8-hour workday when converting hours to days.

### Filters Persist (Optional Feature)

Filters are reset when view changes. Save your preferred view by:
- Bookmarking the page with filters applied (future feature)
- Or just set them again (takes 10 seconds)

## Troubleshooting

### "No tasks found matching your filters"

**Possible causes:**
1. All tasks are completed and filtered to "Active"
2. No tasks in selected quadrant/category
3. No tasks have due dates (excluded by design)
4. All tasks in selected quadrant are completed

**Solution:** Adjust filters or create more tasks.

### Task bar is very small or not visible

**Possible causes:**
1. Time estimate is very small (< 1% of date range)
2. Task due date is far in the future

**Solution:**
- Zoom in (future feature)
- Scroll to right to find task
- Or increase estimate if reasonable

### Tooltip doesn't appear

**Possible causes:**
1. Mouse moved away too quickly
2. Bar is off-screen

**Solution:** Hover directly over task bar, wait a moment.

### Dates look wrong

**Possible causes:**
1. Browser time zone issue
2. Dates in different format than expected

**Note:** System uses browser's local time zone. Check system time if dates seem shifted.

## Exporting & Backup

### Export Includes Time Estimates

When you export tasks:
```json
{
  "task": "Prepare Homework",
  "dueDate": "2025-01-25",
  "timeEstimateValue": 5,
  "timeEstimateUnit": "hours",
  // ... other fields
}
```

### Import Preserves Estimates

If you import old tasks without estimates:
- `timeEstimateValue` defaults to null (no estimate)
- Appear as milestones in Gantt view
- Fully compatible with new format

## Advanced Use Cases

### 1. Capacity Planning

Create all tasks with estimates, then look at Gantt:
- Visually see if you're over/under-committed
- Spread work across weeks
- Identify gaps to take on more

### 2. Deadline Negotiation

Present Gantt chart to stakeholders:
- Show realistic start dates
- Highlight conflicts and dependencies
- Suggest alternative timelines

### 3. Learning Your Estimates

Track actual vs. estimated time:
- Does a task usually take longer than estimated?
- Update estimates based on experience
- Over time, become more accurate

### 4. Recurring Task Planning

Recurring tasks show on every occurrence:
- Daily standup (0.5h each day)
- Weekly review (2h per week)
- Monthly maintenance (1 day per month)

See pattern of recurring commitments in timeline.

## Future Enhancements

Planned features (not yet implemented):

- **Drag & Drop Rescheduling**: Drag bars to adjust due dates
- **Dependencies**: Link tasks with arrows (Task B starts after Task A)
- **Critical Path**: Highlight sequence of tasks that determines project completion
- **Resource Allocation**: Show workload per person per day
- **Print Layout**: Optimized printable Gantt chart
- **Baseline Comparison**: Compare planned vs. actual timeline
- **Zoom Levels**: Week/month/quarter views
- **Export to Image**: Save Gantt as PNG for presentations

## Integration with Other Views

### Matrix View

- Spatial layout (quadrant)
- Best for understanding importance/urgency
- Good for initial planning

### List View

- Tabular format
- Best for detailed information
- Good for spreadsheet-style management

### Gantt View

- Timeline layout
- Best for project scheduling
- Good for workload visualization

**Use all three together:**
1. Start with Matrix to identify what's important
2. Switch to Gantt to see when to schedule it
3. Use List view for detailed progress tracking

## Quick Reference

### Keyboard Tips

- Click task row to select it
- Tab through filters to navigate
- Enter to apply filter selection

### Color Legend

```
🟥 Red    = Do First (Urgent & Necessary)
🟦 Blue   = Schedule (Necessary)
🟨 Amber  = Delegate (Urgent)
⬜ Gray   = Eliminate (Neither)
◆ Diamond = No time estimate (milestone)
```

### Date Labels

- Shows every 7 days on timeline
- Weekend days shaded gray
- Current date marked with red line

## Support & Feedback

For bugs or feature requests related to Gantt chart:
- Note the view filter settings used
- Describe expected vs. actual behavior
- Include task examples if possible

---

**Last Updated:** 2025-01-27
**Version:** 1.0
