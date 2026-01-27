# 🚀 QUICK START GUIDE

You've downloaded the Eisenhower Task Manager! Here's how to get started in 2 minutes:

## 📦 Step 1: Extract the ZIP

Extract `eisenhower-task-manager.zip` to any folder on your computer.

Example locations:
- Windows: `C:\Users\YourName\Documents\eisenhower-task-manager\`
- Mac: `~/Documents/eisenhower-task-manager/`
- Linux: `~/eisenhower-task-manager/`

---

## ⚡ Step 2: Run the Quick Start Script

### Windows Users:
1. Open the extracted folder
2. **Double-click `start.bat`**
3. Follow the on-screen prompts
4. Done! 🎉

### Mac/Linux Users:
1. Open Terminal
2. Navigate to the folder:
   ```bash
   cd /path/to/eisenhower-task-manager
   ```
3. Run the script:
   ```bash
   ./start.sh
   ```
4. Follow the on-screen prompts
5. Done! 🎉

---

## 🎯 What the Script Does

1. ✅ Installs all required dependencies (takes ~30 seconds)
2. ✅ Asks you to choose storage mode:
   - **Simple mode**: Data in browser (quick setup)
   - **File-based mode**: Data in `data/` folder (recommended)
3. ✅ Starts the app
4. ✅ Opens your browser automatically

---

## 🌐 Access the App

Once running, the app will open at:
**http://localhost:5173**

If it doesn't open automatically, just paste that URL in your browser!

---

## 💾 Where is My Data?

### Simple Mode (localStorage):
- Stored in your browser
- Persists across sessions
- Great for single-device use

### File-Based Mode (Recommended):
Your tasks are saved as JSON files in:
```
eisenhower-task-manager/
  └── data/
      ├── tasks.json           ← Your tasks here!
      ├── settings.json        ← Your categories
      └── backup-metadata.json ← Backup history
```

**To backup:** Just copy the `data/` folder!

---

## 🛠️ Manual Installation (If Script Fails)

**Prerequisites:**
- Node.js 16+ ([Download](https://nodejs.org/))

**Steps:**
```bash
# 1. Open terminal in the project folder
cd /path/to/eisenhower-task-manager

# 2. Install dependencies
npm install

# 3. Run the app

# Option A: Simple mode
npm run dev

# Option B: File-based mode
npm start
```

Then open http://localhost:5173

---

## 📖 Next Steps

1. **Read README.md** - Full documentation
2. **Add your first task** - Click "Add Task" button
3. **Try AI Input** - Click "AI Input" and paste a to-do list
4. **Export backup** - Click "Export Backup" in footer
5. **Customize categories** - Edit settings in the app

---

## 🔧 Troubleshooting

**"Node.js not found"**
→ Install Node.js from https://nodejs.org/

**"Port already in use"**
→ Close other apps on port 5173 or change port in `vite.config.js`

**"Permission denied" (Mac/Linux)**
→ Run: `chmod +x start.sh`

**Script doesn't work**
→ Use manual installation steps above

---

## 📁 What's Inside?

```
eisenhower-task-manager/
├── start.bat           ← Windows quick start
├── start.sh            ← Mac/Linux quick start
├── README.md           ← Full documentation
├── package.json        ← Dependencies
├── server.js           ← Backend (for file-based mode)
├── src/
│   └── App.jsx        ← Main application
└── [other config files]
```

---

## 🎉 You're Ready!

That's it! Your Eisenhower Task Manager is ready to help you prioritize and organize your tasks.

**Pro tip:** Use file-based mode and put the folder in Dropbox or Google Drive for automatic cloud backup!

---

**Questions?** Check the full README.md in the folder.

**Happy task managing! 📝✨**
