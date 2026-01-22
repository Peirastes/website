# Contributing to Peirastes

This guide explains how to add new project pages to the Peirastes website.

## Quick Start

To add a new project, run:

```bash
python generate-project.py
```

Follow the prompts to enter your project details. This will:
1. Create a new HTML file in `projects/`
2. Add an entry to `projects.json`
3. Automatically update the homepage

## Workflow

### Step 1: Generate the Project

```bash
python generate-project.py
```

You'll be prompted for:
- **Project title** (required) - e.g., "My Physics Experiment"
- **Year** (optional, defaults to current year)
- **Category** (required) - e.g., Physics, Engineering, Math, Natural Philosophy
- **Description** (optional) - Short description of the project
- **Tags** (optional) - Comma-separated tags (e.g., Physics,Math,Mechanics)
- **Image path** (optional) - Path to project image (e.g., images/project_images/my-image.png)
- **Image alt text** (optional)
- **Filename** (optional, auto-generated from title)

The script will create:
- `projects/your-project-name.html` - The project page template
- Update `projects.json` with project metadata

### Step 2: Edit the Project Page

Open `projects/your-project-name.html` and edit the content between the `<!-- PROJECT CONTENT GOES HERE -->` comments.

Example structure:

```html
<section class="project-detail">
    <h1>Your Project Title</h1>

    <p>
        Project description or abstract goes here.
    </p>

    <a href="../images/project_images/example.jpg" class="lightbox-trigger">
        <img src="../images/project_images/example.jpg" alt="Project Image" class="autoscaled-img">
    </a>

    <p>
        More content here...
    </p>
</section>
```

### Step 3: Add Images (If Needed)

Place project images in `images/project_images/` with a descriptive name (kebab-case).

### Step 4: Update the Homepage Archive (Optional)

If you want your project to appear in the "Archive" sidebar on the homepage, edit the year sections in `index.html`:

```html
<div class="year" onclick="toggleYear('2025')">2025</div>
<ul id="2025" class="month-list">
    <li><a href="#project-id">Your Project Title</a></li>
</ul>
```

The homepage will automatically display your project card once you save `projects.json`.

## Project Structure

Your website has these key files:

```
├── index.html                 # Homepage (renders projects from projects.json)
├── projects.json             # Project metadata database
├── projects/
│   ├── template.html         # Template for new projects
│   ├── your-project.html     # Your project pages
│   └── ...
├── css/
│   └── style.css             # Main stylesheet
├── js/
│   └── main.js               # Shared JavaScript (search, filter, lightbox)
├── images/
│   └── project_images/       # Project images go here
└── generate-project.py       # Project generator script
```

## Example: Creating a Simple Project

```bash
$ python generate-project.py

  Peirastes Project Generator
  ============================================================

Enter project details:
Project title: Pendulum Motion Analysis
Year (default 2025): 2025
Category (e.g., Physics, Engineering, Math): Physics
Description (optional, press Enter to skip): Experimental analysis of pendulum motion and damping
Tags (comma-separated, e.g., Physics,Math,Mechanics): Physics, Mechanics, Experimental
Image path (optional, e.g., images/project_images/example.png): images/project_images/pendulum.jpg
Image alt text (optional): Pendulum apparatus
Filename (default pendulum-motion-analysis.html):

============================================================
✓ Project created successfully!
============================================================

Project Details:
  ID: project15
  Title: Pendulum Motion Analysis
  Year: 2025
  Category: Physics
  File: projects/pendulum-motion-analysis.html
  Tags: Physics, Mechanics, Experimental

Next steps:
  1. Edit projects/pendulum-motion-analysis.html to add your project content
  2. If using an image, place it at: images/project_images/pendulum.jpg
  3. Update the archive sidebar in index.html if desired
```

Then edit `projects/pendulum-motion-analysis.html` to add your content.

## Editing Existing Projects

To modify an existing project:

1. Edit the HTML file directly (e.g., `projects/disk-cam.html`)
2. To update metadata (title, tags, category), edit the corresponding entry in `projects.json`

## Styling

Your site uses the style defined in `css/style.css`. Key classes:

- `.project-card` - Individual project card on homepage
- `.project-detail` - Container for project page content
- `.project-thumb` - Thumbnail image on homepage
- `.autoscaled-img` - Full-width image on project pages
- `.lightbox-trigger` - Clickable image that opens in fullscreen overlay
- `.tag` - Tag/category badge

Dark mode is toggled with the "Toggle Dark Mode" button and uses `.dark-mode` class.

## Homepage Functionality

The homepage automatically:

- **Loads projects from `projects.json`** - Displays all projects as cards
- **Search** - Real-time search by title, description, or tags
- **Filter by category** - Click category buttons to filter
- **Filter by tag** - Click individual tags to filter
- **Dark mode** - Toggle button in sidebar
- **Year-based archive** - Navigate to projects by year
- **Random quote** - Displays a random quote on each page load

No manual updates needed—just edit `projects.json` and the homepage updates automatically.

## Tips

- Use **kebab-case** for filenames: `my-project-name.html`
- Keep descriptions **concise** on the homepage card
- Use **relative paths** for links: `../images/...`, `../projects/...`
- For **Quarto (.qmd) projects**, follow the build process in `BUILD_NOTES_v2.bat`
- Add **lightbox-trigger** class to make images clickable and zoomable

## Troubleshooting

**Projects not appearing on homepage?**
- Verify `projects.json` is valid JSON (use an online JSON validator)
- Check that the JSON file is in the root directory
- Refresh your browser (clear cache if needed)

**Images not loading?**
- Check paths are correct (relative to the HTML file)
- Verify image file exists in `images/project_images/`
- Use browser DevTools (F12) to see network errors

**Python script not running?**
- Ensure Python 3 is installed: `python --version`
- Run from the website root directory
- On macOS/Linux: `python3 generate-project.py`

## Questions?

Refer to the existing project pages for examples of different content structures and styling approaches.
