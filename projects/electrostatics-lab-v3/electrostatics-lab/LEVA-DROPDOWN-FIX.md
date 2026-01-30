# Leva Dropdown Options Fix - CRITICAL REFERENCE

## Status: ✅ LOCKED IN
**Commit:** `cab1256` - "Fix: invert Leva options so it returns case keys, not labels"
**Date:** January 30, 2026
**Branch:** master (pushed to GitHub)

---

## The Problem

When displaying case options in the Leva dropdown menu, the control was returning **display labels** instead of **case type keys**.

### What was happening:
```
Dropdown showed: "Electric Dipole", "Single Positive Charge" ✅ (correct)
But returned:   "Electric Dipole", "Single Positive Charge" ❌ (wrong!)
Should return:  "dipole", "single_positive" ✅ (correct)
```

This caused:
- `caseType` variable received label values instead of keys
- `CASE_LABELS[caseType]` returned `undefined`
- Model creation failed (switch statement couldn't match label strings to case keys)

### Console evidence:
```javascript
// User selects "Single Positive Charge" from dropdown
caseType = "Single Positive Charge"  // WRONG (should be "single_positive")
CASE_LABELS[caseType] = undefined     // Can't lookup because key doesn't exist
```

---

## The Solution

**Invert the Leva options object** so it maps display labels to case keys:

### Code Change (src/App.tsx, line ~102):

**BEFORE (broken):**
```typescript
caseType: {
  value: 'dipole',
  options: CASE_LABELS,  // { dipole: "Electric Dipole", ... }
  label: 'Case',
},
```

**AFTER (fixed):**
```typescript
caseType: {
  value: 'dipole',
  options: Object.fromEntries(
    Object.entries(CASE_LABELS).map(([k, v]) => [v, k])
  ),  // { "Electric Dipole": "dipole", ... }
  label: 'Case',
},
```

### How it works:
- Leva displays the **object keys** → "Electric Dipole", "Single Positive Charge", etc. ✅
- Leva returns the **object values** → "dipole", "single_positive", etc. ✅
- `caseType` now has the correct case key
- `CASE_LABELS[caseType]` correctly resolves to the display label

---

## Files Changed
- **src/App.tsx** - Inverted options object for caseType control
- **dist/assets/index-xL8rPqLs.js** - New JavaScript build

---

## Why This Matters

Leva's behavior with options objects:
- When you pass `options: { key: "label", ... }` to a Leva dropdown
- It **displays** the object keys and **returns** the object values
- Our original approach had it backwards (displaying labels, returning keys)
- The inversion flips this to the correct behavior

This is the definitive solution. If dropdown issues resurface, revert to commit `cab1256`.

---

## Testing
- ✅ All 11 case types display with proper capitalization
- ✅ Case selection works correctly
- ✅ Model creation succeeds for all cases
- ✅ Console logs show correct case keys being used

---

## If You Need to Revert

```bash
git reset --hard cab1256
npm run build
git push origin master --force-with-lease
```

Then deploy the new dist files and hard refresh the browser.
