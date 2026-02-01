# How to Run ECDO Watch

You now have **three ways** to run the automation. Pick whichever feels best.

---

## Option 1: Desktop Shortcut (Easiest)

**One-time setup (1 min):**

```powershell
cd "C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\scripts"
.\create_desktop_shortcut.ps1
```

**Then, every day (whenever you want):**
- Double-click the **"ECDO Watch"** shortcut on your desktop
- Watch it run
- Close when done

**Bonus:** Right-click shortcut → **Pin to Taskbar** for one-click access

---

## Option 2: Double-Click the Batch File

**Location:**
```
C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\RUN_ECDO_WATCH.bat
```

**To run:**
- Navigate to the folder above
- Double-click `RUN_ECDO_WATCH.bat`
- Watch it run
- Close when done

---

## Option 3: Automatic (Already Scheduled)

**Already running automatically every day at 06:00 UTC**

You don't have to do anything. It just runs.

**To check if it ran:**
```bash
type C:\Users\Cole\Dropbox\Website\projects\ecdo-watch\logs\master_run_status.json
```

---

## What You'll See

When you run it (Option 1 or 2):

```
================================================================================
ECDO WATCH MASTER DAILY RUN
================================================================================

Starting automation...

[1/3] Daily Data Generation
[OK] Daily Data Generation completed successfully

[2/3] Data Validation
[OK] kp_30d.json is 0.0h old
[OK] lod_30d.json is 0.0h old
[OK] mag_30d.json is 0.0h old

[3/3] Validation Analysis (Optional)
[OK] Validation Study completed successfully

[SUMMARY]

Status: [OK] All systems nominal

================================================================================
Press any key to close this window...
```

---

## The Easy Way

**Recommended:**

1. Run once to setup:
   ```powershell
   .\create_desktop_shortcut.ps1
   ```

2. Look for "ECDO Watch" shortcut on your desktop

3. Double-click it whenever you want to manually run

4. Or just let it run automatically every day at 06:00 UTC (it's already scheduled)

---

## That's It

No VSCode. No terminal. No complicated stuff.

Just:
- **Desktop icon** (if you want to run manually)
- **Automatic daily run** (already configured)

Pick whichever feels natural.
