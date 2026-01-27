# 🎯 Eisenhower Task Manager

A beautiful, feature-rich task management app based on the Eisenhower Matrix (Urgent/Important prioritization framework).

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **📊 Eisenhower Matrix View** - Visualize tasks in 4 quadrants (Urgent/Important)
- **📝 List View** - Sortable, filterable table view
- **🤖 AI-Powered Input** - Parse natural language into structured tasks
- **🔄 Recurrence Patterns** - Once, Daily, Weekly, Monthly, Yearly
- **💾 Auto-Save** - Never lose your work
- **📤 Export/Import** - JSON backup and restore
- **🎨 Beautiful UI** - Modern, polished design
- **⚡ Fast & Responsive** - Built with React + Vite

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
# Double-click start.bat
# OR run from command prompt:
start.bat
```

**Mac/Linux:**
```bash
# Make executable and run:
chmod +x start.sh
./start.sh
```

The script will:
1. Install all dependencies
2. Let you choose storage mode
3. Start the app automatically
4. Open your browser to http://localhost:5173

---

### Option 2: Manual Setup

**Prerequisites:**
- Node.js 16+ ([Download here](https://nodejs.org/))
- npm (comes with Node.js)

**Steps:**
```bash
# 1. Install dependencies
npm install

# 2. Choose your mode:

# Simple mode (localStorage)
npm run dev

# File-based mode (saves to ./data folder)
npm start
```

Then open http://localhost:5173 in your browser!

---

## 💾 Storage Modes

### Simple Mode (`npm run dev`)
- ✅ Quick setup
- ✅ Auto-save to browser
- ✅ Perfect for single-user
- 📍 Data: Browser localStorage

### File-Based Mode (`npm start`)
- ✅ Real JSON files
- ✅ Easy backup (copy `data/` folder)
- ✅ Cloud sync friendly (Dropbox, Google Drive)
- ✅ Version control ready
- 📍 Data: `./data/` folder

**Your data files:**
```
data/
├── tasks.json            # All your tasks
├── settings.json         # Categories & preferences
└── backup-metadata.json  # Backup history
```

---

## 📖 How to Use

### Adding Tasks

**Method 1: Manual Entry**
- Click "Add Task" button
- Fill in task details
- Choose urgent/necessary flags
- Set recurrence pattern
- Save!

**Method 2: AI Input** ✨
- Click "AI Input" button
- Paste any text (emails, notes, lists)
- Claude parses and structures them
- Review and confirm

### Organizing Tasks

**Matrix View:**
- Tasks automatically sorted by quadrant
- Ranked 1-3 within each quadrant
- Color-coded by urgency

**List View:**
- Filter by: Quadrant, Category, Status, Recurrence
- Sort by: Priority, Due Date, Category, Recurrence
- Quick actions: Complete, Edit, Delete

### Recurrence Patterns

- 📌 **Once** - One-time task
- ☀️ **Daily** - Every day
- 📅 **Weekly** - Every week
- 🗓️ **Monthly** - Every month
- 📆 **Yearly** - Annually

### Backup Your Data

**Export:**
1. Click "Export Backup" in footer
2. Save JSON file to safe location
3. Recommended: Weekly exports

**Import:**
1. Click "Import" in footer
2. Select your JSON backup
3. All tasks restored!

---

## 🎨 Customization

### Categories & Subcategories

Edit `data/settings.json` (or use localStorage):
```json
{
  "categories": ["Career", "Personal", "Health"],
  "subcategories": {
    "Career": ["Work Project A", "Work Project B"],
    "Personal": ["Home", "Family"],
    "Health": ["Exercise", "Nutrition"]
  }
}
```

---

## 🛠️ Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start backend API only
npm run server
```

---

## 📁 Project Structure

```
eisenhower-task-manager/
├── data/                   # Your task data (file-based mode)
├── src/
│   ├── App.jsx            # Main application
│   ├── main.jsx           # React entry point
│   └── index.css          # Base styles
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── server.js              # Backend API (optional)
├── start.bat              # Windows quick start
├── start.sh               # Mac/Linux quick start
└── README.md              # You are here!
```

---

## 🔧 Troubleshooting

**Dependencies won't install:**
- Ensure Node.js 16+ is installed
- Run `npm cache clean --force`
- Try `npm install` again

**Port already in use:**
- Change port in `vite.config.js` (frontend)
- Change PORT in `server.js` (backend)

**Can't save tasks:**
- Check browser console for errors
- Ensure `data/` folder has write permissions
- Try simple mode first

**AI features don't work:**
- AI Input only works in Claude.ai environment
- For local use, use manual entry

---

## 📝 Tips & Best Practices

1. **Weekly Exports** - Set a reminder to export backups
2. **Use Recurrence** - Set up daily/weekly habits
3. **Rank Within Quadrants** - Use 1-3 ranking for priorities
4. **Cloud Sync** - Put project folder in Dropbox for auto-sync
5. **Version Control** - Add `data/` to `.gitignore` for privacy

---

## 🎯 Eisenhower Method

The app is based on the Eisenhower Decision Matrix:

| | Urgent | Not Urgent |
|---|---|---|
| **Important** | 🔥 **DO FIRST**<br/>Critical deadlines | 📅 **SCHEDULE**<br/>Long-term goals |
| **Not Important** | 👥 **DELEGATE**<br/>Interruptions | 🗑️ **ELIMINATE**<br/>Time wasters |

**Goal:** Reduce tasks in "DO FIRST" quadrant!

---

## 🤝 Contributing

This is a personal productivity tool, but feel free to:
- Fork and customize
- Report bugs
- Suggest features

---

## 📄 License

MIT License - Feel free to use and modify!

---

## 🙏 Credits

Built with:
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Lucide React](https://lucide.dev/) - Icons
- [Tailwind CSS](https://tailwindcss.com/) - Utility classes (core only)

---

## 📧 Support

Having issues? Check:
1. This README
2. `LOCAL_SETUP_GUIDE.md` for detailed setup
3. Browser console for errors

---

**Happy Task Managing! 🎉**

Remember: "What is important is seldom urgent, and what is urgent is seldom important." - Dwight D. Eisenhower
