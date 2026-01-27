# Phase 1: Critical Decisions to Make

Before starting implementation, please make decisions on these design questions. These will save significant rework.

---

## Decision 1: Canvas Resolution

**Options:**

**A) 1200 x 700 pixels (RECOMMENDED)**
- Pros: Fits nicely in UI, ~10-15 units per side feels right
- Cons: Smaller, less room for nuanced positioning
- Best for: Quick matches, arcade-style gameplay

**B) 1600 x 900 pixels**
- Pros: More room for tactical positioning, feels more spacious
- Cons: Takes up more screen space, needs larger monitors
- Best for: Strategic deep gameplay, more unit variety

**C) 1920 x 1080 pixels**
- Pros: Maximum detail and positioning precision
- Cons: Only works on large screens, very space-intensive
- Best for: Desktop-only, hardcore players

**YOUR CHOICE:** _____________

**Why this matters:** Screen size affects:
- How zoomed-in you feel (intimacy)
- How many units can be positioned (tactical depth)
- How readable unit details are
- Overall game feel (arcade vs tactical)

---

## Decision 2: Unit Movement Speed

**Options:**

**A) 100 pixels/second (RECOMMENDED)**
- Time to cross battlefield: ~7 seconds at 1200px width
- Feels: Quick, tactical, reactive
- Matches: Shattered Galaxy's medium pace

**B) 150 pixels/second**
- Time to cross battlefield: ~5 seconds
- Feels: Fast, arcade-like, twitchy
- Matches: Action-oriented gameplay

**C) 75 pixels/second**
- Time to cross battlefield: ~9 seconds
- Feels: Slow, deliberate, chess-like
- Matches: Deep strategy focus

**YOUR CHOICE:** _____________

**Why this matters:**
- Affects battle duration and pacing
- Faster = more action, less strategy
- Slower = more planning, less reaction time
- Determines how long PoC capture takes relative to travel time

---

## Decision 3: PoC Capture Time

**Options:**

**A) 3 seconds with 1 unit (RECOMMENDED)**
- Faster pace, less time spent sitting on PoCs
- Forces aggressive play
- Matches our simplified system

**B) 5 seconds with 1 unit**
- More balanced, gives enemies time to react
- Closer to Shattered Galaxy (30 sec with tools)
- More strategic (positioning matters more)

**C) 7 seconds with 1 unit**
- Very slow, strong emphasis on holding territory
- Forces heavy unit presence on PoCs
- Chess-like, less action-oriented

**Scaling formula:**
```
If you choose X seconds with 1 unit:
- 2 units = X / 1.3 seconds
- 3 units = X / 1.5 seconds
- 4+ units = X / 2 seconds (minimum 1 second)
```

**YOUR CHOICE:** _____________

**Why this matters:**
- Affects risk/reward of positioning on PoCs
- Faster = rewards aggressive play
- Slower = rewards defensive play
- Changes entire battle tempo

---

## Decision 4: Unit Size & Combat Range

**Options:**

**A) 20px units, 40px combat range (RECOMMENDED)**
- Units clearly visible but not huge
- Combat range forces meaningful positioning
- Balanced between visibility and precision

**B) 25px units, 50px combat range**
- Larger, easier to click on and see
- Larger combat range, more forgiving
- Feels less precise but more accessible

**C) 15px units, 35px combat range**
- Smaller, less obtrusive, cleaner look
- Tighter combat ranges, more precision needed
- Harder to click on, better for mouse than touch

**YOUR CHOICE:** _____________

**Why this matters:**
- Affects how "tight" the gameplay feels
- Larger units = easier to control, less precision
- Smaller units = harder to click, more strategy
- Combat range determines when engagement happens

---

## Decision 5: PoC Capture Radius

**Options:**

**A) 50px radius (RECOMMENDED)**
- Clearly visible, not too large
- Unit has to be mostly on PoC to capture
- Balanced precision

**B) 60px radius**
- Larger capture area, more forgiving
- Easier to position units correctly
- Less punishing for precision

**C) 40px radius**
- Tighter, requires precise positioning
- Forces more tactical play
- Harder for mouse control

**YOUR CHOICE:** _____________

**Why this matters:**
- Determines how easy PoCs are to capture
- Affects positioning difficulty
- Larger = more forgiving, less strategic
- Smaller = more challenging, higher skill ceiling

---

## Decision 6: Camera/View Controls

**Options:**

**A) Fixed view, no camera movement (RECOMMENDED for MVP)**
- No panning or zooming
- Canvas always shows full battlefield
- Simpler to implement
- Matches Shattered Galaxy (birds-eye view)

**B) Drag-to-pan + zoom**
- Hold mouse button to drag view around
- Mouse wheel to zoom (0.5x - 2x)
- More control, more complex
- Better for large battles

**C) Fixed view with edge-pan**
- No zoom, but moving mouse to canvas edge pans view
- Middle ground approach
- Some control without complexity

**YOUR CHOICE:** _____________

**Why this matters:**
- Affects how players see the full battle
- No pan = must see entire battlefield always
- With pan = can zoom in on details
- Simpler = faster to implement and debug

---

## Decision 7: Unit Selection

**Options:**

**A) Click unit to select, drag to move (RECOMMENDED)**
- Click on unit highlights it
- Drag highlighted unit to new position
- One unit selected at a time
- Simplest to implement

**B) Multi-select with Shift+click**
- Click unit = select
- Shift+click = add to selection
- Drag all selected units together
- More complex, better for large squads

**C) Drag-select box**
- Click and drag to create selection box
- All units in box are selected
- Drag selected units to move together
- Most complex, most powerful

**YOUR CHOICE:** _____________

**Why this matters:**
- Affects squad control complexity
- Single-select = simpler, more arcade
- Multi-select = strategic, complex
- Large squads (8-12 units) benefit from multi-select
- Small squads (3-6 units) work fine with single-select

---

## Decision 8: Game Difficulty & AI

**Options:**

**A) Single difficulty, fixed AI (RECOMMENDED for MVP)**
- One enemy behavior set (medium intelligence)
- Enemy AI always uses same strategy
- Simpler to balance
- Focus on player skill

**B) 3 difficulty levels**
- Easy: Enemy AI slow, poor targeting
- Normal: Standard AI
- Hard: Aggressive tactics, better positioning
- More replayability, complexity

**C) Scalable difficulty based on player performance**
- AI adapts to player skill
- Automatic challenge adjustment
- Complex to implement and balance
- Most engagement potential

**YOUR CHOICE:** _____________

**Why this matters:**
- Affects replayability
- Difficulty scaling = more playthroughs
- Fixed difficulty = simpler, faster to launch
- Can add difficulty later (not critical for Phase 1)

---

## Summary: Your Answers

Please provide your choices above. If you have questions about any decision, ask before answering. Here's a template to fill in:

```
Decision 1 (Canvas): [A/B/C]
Decision 2 (Unit Speed): [A/B/C]
Decision 3 (Capture Time): [A/B/C]
Decision 4 (Unit Size): [A/B/C]
Decision 5 (PoC Radius): [A/B/C]
Decision 6 (Camera): [A/B/C]
Decision 7 (Selection): [A/B/C]
Decision 8 (Difficulty): [A/B/C]
```

---

## Recommended Configuration (Pick All A's)

If you just want to get started quickly, here's the recommended set:

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| Canvas | A (1200x700) | Good balance of space and performance |
| Unit Speed | A (100 px/s) | Standard pace, matches SG |
| Capture Time | A (3 sec) | Fast enough to feel actionable |
| Unit Size | A (20px/40px) | Clear visibility, good balance |
| PoC Radius | A (50px) | Clearly visible, balanced precision |
| Camera | A (Fixed) | Simpler to implement, full view always |
| Selection | A (Single select) | Easier for 6-12 unit squads |
| Difficulty | A (Fixed) | Focus on core gameplay first |

**Total complexity:** Medium
**Implementation time:** 2 weeks
**Core feature completeness:** 80%
**Ready to move to Phase 2:** Yes

---

## Next Steps

1. **Review the decisions above** - Do you agree with the recommended settings?
2. **Answer Decision 1-8** - Provide your choice for each
3. **Ask questions** - Anything unclear?
4. **Confirm** - Once you're ready, we start Day 1

These decisions will be written into Phase 1 so we don't change them mid-implementation. Changing them late costs time and rework.

---

## Decision Rationale

Why are these questions important?

- **Canvas size** sets the visual scale of the entire game
- **Movement speed** determines battle pacing and how "arcade" vs "tactical" it feels
- **Capture time** affects whether PoCs feel like strategic objectives or just target zones
- **Unit size** affects how easy the game is to control precisely
- **PoC radius** determines positioning difficulty
- **Camera** affects how much of the battlefield you can see at once
- **Selection** affects how many units you can control simultaneously
- **Difficulty** affects replayability and long-term engagement

Get these right now, and Phase 1 builds consistently. Change them later, and you're rewriting core systems.

---

## Can We Change These Later?

**Yes, but with cost:**

- **Canvas size:** ✓ Easy to change (just 1 number)
- **Unit speed:** ✓ Easy to change (1 number, affects all gameplay)
- **Capture time:** ✓ Easy to change (1 number)
- **Unit size:** ✗ Moderate difficulty (affects collision, rendering, many places)
- **PoC radius:** ✓ Easy to change (1 number)
- **Camera:** ✓ Easy to add later (add zoom, panning)
- **Selection:** ✗ Moderate difficulty (input system refactor)
- **Difficulty:** ✓ Easy to add later (scaling multipliers)

**Bottom line:** Some decisions are flexible, others are locked in once implemented. Get consensus now.
