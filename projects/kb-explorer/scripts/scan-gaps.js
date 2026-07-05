#!/usr/bin/env node
/**
 * Knowledge Base Gap Scanner
 *
 * Scans website projects, documents, agent files, and memory to identify
 * knowledge and skill entries that should be in the KB but aren't yet.
 *
 * READ-ONLY: This script does NOT modify any KB files.
 *
 * Usage: node scripts/scan-gaps.js
 * Output: stdout + scripts/gap-report.md
 */

const fs = require('fs');
const path = require('path');

// ─── Path Configuration ──────────────────────────────────────────────────────

const DROPBOX = path.resolve(__dirname, '..', '..', '..', '..');
const WEBSITE = path.join(DROPBOX, 'Website');
const AGENTS = path.join(DROPBOX, 'Agents');
const PROJECTS_DIR = path.join(WEBSITE, 'projects');
const PROJECTS_JSON = path.join(WEBSITE, 'projects.json');
const DOCUMENTS_DIR = path.join(WEBSITE, 'documents');
const LECTURE_DIR = path.join(DROPBOX, 'Professional', 'Instructor', 'PHY 2114 PSEII & Lab', 'Lecture');
const PROJECT_DOCS_DIR = path.join(PROJECTS_DIR, 'project-documents');
const MEMORY_DIR = path.join(DROPBOX, '..', '.claude', 'projects', 'C--Users-Cole-Dropbox', 'memory');
const KB_HUMAN_DIR = path.join(AGENTS, 'knowledge-base', 'human');
const KB_AGENTS_DIR = path.join(AGENTS, 'knowledge-base', 'agents');
const KB_SHARED_DIR = path.join(AGENTS, 'knowledge-base', 'shared');
const KB_DOMAINS_DIR = path.join(AGENTS, 'RA Agent', 'knowledge-base', 'domains');
const KB_FOUNDATION = path.join(AGENTS, 'RA Agent', 'knowledge-base', 'FOUNDATION.md');
const OUTPUT_FILE = path.join(__dirname, 'gap-report.md');

// ─── Binary file extensions to skip ──────────────────────────────────────────

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg', '.webp',
  '.pdf', '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt',
  '.zip', '.gz', '.tar', '.7z', '.rar',
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.mkv',
  '.exe', '.dll', '.so', '.dylib', '.woff', '.woff2', '.ttf', '.eot',
  '.map', '.lock', '.min.js', '.min.css',
]);

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'dist-electron', 'build', '.vite', '.cache',
  '__pycache__', '.next', 'coverage',
]);

// ─── Technology Keywords ─────────────────────────────────────────────────────

const TECH_KEYWORDS = {
  'three.js': 'THREE.js / 3D Rendering',
  'threejs': 'THREE.js / 3D Rendering',
  'three': 'THREE.js / 3D Rendering',
  'd3': 'D3.js Data Visualization',
  'react': 'React',
  'electron': 'Electron Desktop Apps',
  'vite': 'Vite Build System',
  'express': 'Express.js Server',
  'codemirror': 'CodeMirror Editor',
  'katex': 'KaTeX Math Rendering',
  'quarto': 'Quarto Document System',
  'tailscale': 'Tailscale Networking',
  'stripe': 'Stripe Payments',
  'numpy': 'NumPy',
  'scipy': 'SciPy',
  'matplotlib': 'Matplotlib',
  'manim': 'Manim Animation',
  'pandoc': 'Pandoc',
  'latex': 'LaTeX',
  'platformio': 'PlatformIO',
  'arduino': 'Arduino',
  'esp32': 'ESP32',
  'claude': 'Claude API',
  'anthropic': 'Anthropic SDK',
  'openai': 'OpenAI API',
  'ollama': 'Ollama',
  'websocket': 'WebSockets',
  'tailwind': 'Tailwind CSS',
  'typescript': 'TypeScript',
  'python': 'Python',
  'javascript': 'JavaScript',
  'cesium': 'CesiumJS 3D Globe',
  'chart.js': 'Chart.js',
  'chartjs': 'Chart.js',
  'socket.io': 'Socket.IO',
  'sass': 'Sass/SCSS',
  'webpack': 'Webpack',
  'jest': 'Jest Testing',
  'puppeteer': 'Puppeteer',
  'sharp': 'Sharp Image Processing',
  'marked': 'Marked (Markdown Parser)',
  'highlight.js': 'Highlight.js',
  'prism': 'Prism.js Syntax Highlighting',
  'leaflet': 'Leaflet Maps',
};

// ─── Domain Knowledge Keywords ───────────────────────────────────────────────

const DOMAIN_KEYWORDS = {
  'electrostatics': 'Electrostatics',
  'electromagnetic': 'Electromagnetism',
  'thermodynamic': 'Thermodynamics',
  'dynamical system': 'Dynamical Systems',
  'differential equation': 'Differential Equations',
  'runge-kutta': 'Numerical Methods (RK4)',
  'rk4': 'Numerical Methods (RK4)',
  'euler method': 'Numerical Methods (Euler)',
  'fourier': 'Fourier Analysis',
  'optics': 'Optics',
  'magnetic': 'Magnetism',
  'induction': 'Electromagnetic Induction',
  'circuit': 'Circuit Analysis',
  'capacitor': 'Capacitance',
  'resistor': 'Resistance/Circuits',
  'buoyancy': 'Fluid Mechanics',
  'cam synthesis': 'Cam Design',
  'g-code': 'CNC/G-code',
  'archaeoastronomy': 'Archaeoastronomy',
  'epistemology': 'Epistemology',
  'pedagogy': 'Pedagogy',
  'assessment': 'Assessment Design',
  'simulation': 'Physics Simulation',
  'game': 'Game Development',
  'isometric': 'Isometric 3D',
  'voxel': 'Voxel/Low-poly Art',
  'force-directed': 'Force-directed Graphs',
  'topological sort': 'Graph Algorithms',
  'dag': 'DAG/Pipeline Architecture',
  'pwa': 'Progressive Web Apps',
  'oauth': 'Authentication',
  'rest api': 'REST API Design',
  'ipc': 'IPC Communication',
  'ecdo': 'ECDO Theory',
  'seismic': 'Seismology Data',
  'polar motion': 'Earth Orientation',
  'market analytics': 'Market Analytics',
  'cash bubble': 'Thermofluidic Finance',
  'thermofluidic': 'Thermofluidic Finance',
  'fractured universe': 'Game Design',
  'gravitational': 'Gravitational Physics',
  'gravity': 'Gravitational Physics',
  'pendulum': 'Pendulum Mechanics',
  'control system': 'Control Systems',
  'pid': 'PID Control',
  'population model': 'Population Modeling',
  'logistic': 'Logistic Growth',
  'bifurcation': 'Bifurcation Theory',
  'chaos': 'Chaos Theory',
  'lorenz': 'Lorenz Attractor',
  'attractor': 'Attractor Theory',
  'eigenvalu': 'Eigenvalue Analysis',
  'impedance': 'Impedance/AC Circuits',
  'bond graph': 'Bond Graph Theory',
  'conservation law': 'Conservation Laws',
  'marching cubes': 'Marching Cubes Algorithm',
  'equipotential': 'Equipotential Surfaces',
  'field line': 'Field Line Visualization',
  'work-energy': 'Work-Energy Theorem',
  'coefficient of restitution': 'Collision Physics',
  'rebound': 'Collision Physics',
  'zener diode': 'Semiconductor Physics',
  'proportions': 'Proportional Reasoning',
  'pscpr': 'PSCPR Framework',
  'modus ponens': 'Formal Logic',
  'modus tollens': 'Formal Logic',
  'deduction': 'Deductive Reasoning',
  'induction': 'Inductive Reasoning',
  'abduction': 'Abductive Reasoning',
  'curriculum': 'Curriculum Design',
  'wave': 'Wave Physics',
  'diffraction': 'Diffraction',
  'refraction': 'Refraction',
  'snell': 'Snell\'s Law',
  'lens': 'Lens Optics',
  'mirror': 'Mirror Optics',
  'maxwell': 'Maxwell\'s Equations',
  'faraday': 'Faraday\'s Law',
  'ampere': 'Ampere\'s Law',
};

// ─── Utility Functions ───────────────────────────────────────────────────────

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function readdirSafe(dirPath) {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

function statSafe(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function isBinaryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function isSourceFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.vue', '.svelte', '.md', '.json'].includes(ext);
}

function readFirstLines(filePath, maxLines = 100) {
  const content = readFileSafe(filePath);
  if (!content) return '';
  const lines = content.split('\n');
  return lines.slice(0, maxLines).join('\n');
}

/**
 * Recursively walk a directory, skipping binary files and excluded dirs.
 * Returns array of { relativePath, fullPath }.
 */
function walkDir(dir, maxDepth = 4, currentDepth = 0) {
  const results = [];
  if (currentDepth > maxDepth) return results;
  const entries = readdirSafe(dir);
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = path.join(dir, entry);
    const stat = statSafe(fullPath);
    if (!stat) continue;
    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath, maxDepth, currentDepth + 1));
    } else if (!isBinaryFile(fullPath)) {
      results.push({ name: entry, fullPath });
    }
  }
  return results;
}

// ─── Existing KB Parser ──────────────────────────────────────────────────────

function parseExistingKB() {
  const existing = {
    hskIds: new Set(),
    sopIds: new Set(),
    sklIds: new Set(),
    toolIds: new Set(),
    claimIds: new Set(),
    fpIds: new Set(),
    daIds: new Set(),
    // Also store descriptions/names for matching
    hskEntries: {},   // id -> { title, description }
    sopEntries: {},
    sklEntries: {},
    toolEntries: {},
    claimEntries: {},
    fpEntries: {},
    daEntries: {},
  };

  // Parse human skills
  const skillsContent = readFileSafe(path.join(KB_HUMAN_DIR, 'skills.md'));
  if (skillsContent) {
    const hskRegex = /### (HSK-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### HSK-|\n## |$)/g;
    let m;
    while ((m = hskRegex.exec(skillsContent)) !== null) {
      const [, id, title, body] = m;
      existing.hskIds.add(id);
      const descMatch = body.match(/\*\*Description:\*\*\s*(.+)/);
      existing.hskEntries[id] = {
        title: title.trim(),
        description: descMatch ? descMatch[1].trim() : '',
      };
    }
  }

  // Parse agent files (SOPs and SKLs)
  const agentFiles = readdirSafe(KB_AGENTS_DIR).filter(f => f.endsWith('.md'));
  for (const af of agentFiles) {
    const content = readFileSafe(path.join(KB_AGENTS_DIR, af));
    if (!content) continue;

    const sopRegex = /### (SOP-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### SOP-|\n## |$)/g;
    let m;
    while ((m = sopRegex.exec(content)) !== null) {
      const [, id, title, body] = m;
      existing.sopIds.add(id);
      const descMatch = body.match(/\*\*Description:\*\*\s*(.+)/);
      existing.sopEntries[id] = {
        title: title.trim(),
        description: descMatch ? descMatch[1].trim() : '',
      };
    }

    const sklRegex = /### (SKL-[A-Z]+-\d+): (.+)\n([\s\S]*?)(?=\n### SKL-|\n### SOP-|\n## |$)/g;
    while ((m = sklRegex.exec(content)) !== null) {
      const [, id, title, body] = m;
      existing.sklIds.add(id);
      const descMatch = body.match(/\*\*Description:\*\*\s*(.+)/);
      existing.sklEntries[id] = {
        title: title.trim(),
        description: descMatch ? descMatch[1].trim() : '',
      };
    }
  }

  // Parse shared tools
  const toolsContent = readFileSafe(path.join(KB_SHARED_DIR, 'tools.md'));
  if (toolsContent) {
    const toolRegex = /### (TOOL-\d+): (.+)\n([\s\S]*?)(?=\n### TOOL-|\n## |$)/g;
    let m;
    while ((m = toolRegex.exec(toolsContent)) !== null) {
      const [, id, title, body] = m;
      existing.toolIds.add(id);
      const descMatch = body.match(/\*\*Purpose:\*\*\s*(.+)/);
      existing.toolEntries[id] = {
        title: title.trim(),
        description: descMatch ? descMatch[1].trim() : '',
      };
    }
  }

  // Parse foundation
  const foundationContent = readFileSafe(KB_FOUNDATION);
  if (foundationContent) {
    const fpRegex = /### (FP-\d+): (.+)/g;
    let m;
    while ((m = fpRegex.exec(foundationContent)) !== null) {
      existing.fpIds.add(m[1]);
      existing.fpEntries[m[1]] = { title: m[2].trim() };
    }
    const daRegex = /#### (DA-[A-Z]+-\d+): (.+)/g;
    while ((m = daRegex.exec(foundationContent)) !== null) {
      existing.daIds.add(m[1]);
      existing.daEntries[m[1]] = { title: m[2].trim() };
    }
  }

  // Parse domain claims
  const domainFiles = readdirSafe(KB_DOMAINS_DIR).filter(f => f.endsWith('.md'));
  for (const df of domainFiles) {
    const content = readFileSafe(path.join(KB_DOMAINS_DIR, df));
    if (!content) continue;
    const claimRegex = /### ([A-Z]+-\d+): (.+)/g;
    let m;
    while ((m = claimRegex.exec(content)) !== null) {
      existing.claimIds.add(m[1]);
      existing.claimEntries[m[1]] = { title: m[2].trim(), file: df };
    }
  }

  return existing;
}

// ─── Source Scanners ─────────────────────────────────────────────────────────

/**
 * Scan projects.json for project metadata
 */
function scanProjectsJson() {
  const content = readFileSafe(PROJECTS_JSON);
  if (!content) return [];
  try {
    return JSON.parse(content);
  } catch {
    console.error('Failed to parse projects.json');
    return [];
  }
}

/**
 * Scan a project directory for technologies used
 */
function scanProjectDir(dirPath, projectName) {
  const findings = {
    technologies: new Map(),  // techKey -> { name, sources: [] }
    domains: new Map(),       // domainKey -> { name, sources: [] }
    imports: [],
    hasPackageJson: false,
    dependencies: [],
  };

  // Check package.json
  const pkgPath = path.join(dirPath, 'package.json');
  const pkgContent = readFileSafe(pkgPath);
  if (pkgContent) {
    findings.hasPackageJson = true;
    try {
      const pkg = JSON.parse(pkgContent);
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };
      findings.dependencies = Object.keys(allDeps);

      // Match dependencies against tech keywords
      for (const dep of Object.keys(allDeps)) {
        const depLower = dep.toLowerCase();
        for (const [keyword, techName] of Object.entries(TECH_KEYWORDS)) {
          if (depLower.includes(keyword)) {
            if (!findings.technologies.has(techName)) {
              findings.technologies.set(techName, { name: techName, sources: [] });
            }
            findings.technologies.get(techName).sources.push(`package.json (${dep})`);
          }
        }
      }
    } catch { /* ignore parse errors */ }
  }

  // Check README.md and CLAUDE.md
  for (const readmeName of ['README.md', 'CLAUDE.md']) {
    const readmePath = path.join(dirPath, readmeName);
    const readmeContent = readFileSafe(readmePath);
    if (readmeContent) {
      scanTextForKeywords(readmeContent, readmeName, findings);
    }
  }

  // Scan source files (first 100 lines of each)
  const sourceFiles = walkDir(dirPath, 3).filter(f => isSourceFile(f.fullPath));
  // Limit to 50 source files per project to keep it manageable
  const filesToScan = sourceFiles.slice(0, 50);
  for (const { name, fullPath } of filesToScan) {
    if (name === 'package.json' || name === 'package-lock.json') continue;
    const content = readFirstLines(fullPath, 100);
    if (content) {
      // Scan imports specifically
      const importMatches = content.match(/(?:import\s+.*?from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g) || [];
      for (const imp of importMatches) {
        const modMatch = imp.match(/['"]([^'"]+)['"]/);
        if (modMatch) {
          const mod = modMatch[1].toLowerCase();
          for (const [keyword, techName] of Object.entries(TECH_KEYWORDS)) {
            if (mod.includes(keyword)) {
              if (!findings.technologies.has(techName)) {
                findings.technologies.set(techName, { name: techName, sources: [] });
              }
              const existing = findings.technologies.get(techName);
              const sourceLabel = `import in ${path.basename(fullPath)}`;
              if (!existing.sources.includes(sourceLabel)) {
                existing.sources.push(sourceLabel);
              }
            }
          }
        }
      }

      // Also scan for domain keywords
      scanTextForKeywords(content, path.basename(fullPath), findings);
    }
  }

  return findings;
}

/**
 * Scan text content for tech and domain keywords
 */
function scanTextForKeywords(text, sourceName, findings) {
  const textLower = text.toLowerCase();

  for (const [keyword, techName] of Object.entries(TECH_KEYWORDS)) {
    // Use word boundary matching to reduce false positives
    const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
    if (regex.test(textLower)) {
      if (!findings.technologies.has(techName)) {
        findings.technologies.set(techName, { name: techName, sources: [] });
      }
      const existing = findings.technologies.get(techName);
      if (!existing.sources.includes(sourceName)) {
        existing.sources.push(sourceName);
      }
    }
  }

  for (const [keyword, domainName] of Object.entries(DOMAIN_KEYWORDS)) {
    const regex = new RegExp(`\\b${escapeRegex(keyword)}`, 'i');
    if (regex.test(textLower)) {
      if (!findings.domains.has(domainName)) {
        findings.domains.set(domainName, { name: domainName, sources: [] });
      }
      const existing = findings.domains.get(domainName);
      if (!existing.sources.includes(sourceName)) {
        existing.sources.push(sourceName);
      }
    }
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Scan documents directory
 */
function scanDocuments() {
  const documents = [];

  // Scan main documents directory
  for (const subdir of ['qmd', 'dynamic-documents', 'static-documents']) {
    const dirPath = path.join(DOCUMENTS_DIR, subdir);
    const files = readdirSafe(dirPath);
    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      if (['.md', '.qmd'].includes(ext)) {
        const content = readFirstLines(path.join(dirPath, f), 30);
        const titleMatch = content ? content.match(/^#\s+(.+)/m) || content.match(/^title:\s*["']?(.+?)["']?\s*$/m) : null;
        documents.push({
          name: f,
          subdir,
          title: titleMatch ? titleMatch[1].trim() : f.replace(ext, ''),
          type: ext,
        });
      } else if (ext === '.docx' || ext === '.pptx') {
        documents.push({
          name: f,
          subdir,
          title: f.replace(ext, ''),
          type: ext,
        });
      }
    }
  }

  return documents;
}

/**
 * Scan lecture files
 */
function scanLectureFiles() {
  const lectureFindings = {
    chapters: [],
    files: [],
    topics: new Set(),
  };

  // Scan top-level lecture files
  const topFiles = readdirSafe(LECTURE_DIR);
  for (const f of topFiles) {
    const fullPath = path.join(LECTURE_DIR, f);
    const stat = statSafe(fullPath);
    if (stat && stat.isDirectory() && f.startsWith('Chapter')) {
      const chapterNum = f.replace('Chapter ', '');
      lectureFindings.chapters.push(chapterNum);

      // Scan chapter contents
      const chFiles = readdirSafe(fullPath);
      for (const cf of chFiles) {
        if (cf.endsWith('.md')) {
          lectureFindings.files.push({ chapter: chapterNum, file: cf });
          // Extract topic from filename
          const topicMatch = cf.match(/PSEII_(\w+)_Chapter/);
          if (topicMatch) {
            lectureFindings.topics.add(topicMatch[1]);
          }
        }
      }
    } else if (!stat?.isDirectory()) {
      const ext = path.extname(f).toLowerCase();
      if (['.md', '.py'].includes(ext)) {
        lectureFindings.files.push({ chapter: 'root', file: f });
      }
    }
  }

  return lectureFindings;
}

/**
 * Scan project documents (PODs and PSRs)
 */
function scanProjectDocuments() {
  const podFindings = [];

  const files = readdirSafe(PROJECT_DOCS_DIR).filter(f => f.endsWith('.md'));
  for (const f of files) {
    if (f.startsWith('POD_Template') || f.startsWith('PSR_Template')) continue;
    const content = readFileSafe(path.join(PROJECT_DOCS_DIR, f));
    if (!content) continue;

    const titleMatch = content.match(/^#\s+(.+)/m);
    const findings = {
      technologies: new Map(),
      domains: new Map(),
    };
    scanTextForKeywords(content, f, findings);

    podFindings.push({
      file: f,
      title: titleMatch ? titleMatch[1].trim() : f,
      technologies: findings.technologies,
      domains: findings.domains,
      isPOD: f.includes('POD'),
      isPSR: f.includes('PSR'),
    });
  }

  return podFindings;
}

/**
 * Scan memory files
 */
function scanMemoryFiles() {
  const memoryFindings = [];

  const files = readdirSafe(MEMORY_DIR).filter(f => f.endsWith('.md'));
  for (const f of files) {
    const content = readFileSafe(path.join(MEMORY_DIR, f));
    if (!content) continue;

    const findings = {
      technologies: new Map(),
      domains: new Map(),
    };
    scanTextForKeywords(content, f, findings);

    memoryFindings.push({
      file: f,
      technologies: findings.technologies,
      domains: findings.domains,
    });
  }

  return memoryFindings;
}

/**
 * Scan agent guides for domain knowledge sections
 */
function scanAgentGuides() {
  const agentFindings = [];

  const agentDirs = readdirSafe(AGENTS).filter(d => d.endsWith('Agent'));
  for (const agentDir of agentDirs) {
    const guidePath = path.join(AGENTS, agentDir);
    const guideFiles = readdirSafe(guidePath).filter(f => f.endsWith('_GUIDE.md') || f === 'AGENT_GUIDE_TEMPLATE.md');

    for (const gf of guideFiles) {
      if (gf === 'AGENT_GUIDE_TEMPLATE.md') continue;
      const content = readFileSafe(path.join(guidePath, gf));
      if (!content) continue;

      const agentCode = agentDir.replace(' Agent', '');

      // Extract sections that mention domain knowledge, key concepts, etc.
      const sections = [];
      const sectionRegex = /^##\s+(.+)/gm;
      let m;
      while ((m = sectionRegex.exec(content)) !== null) {
        sections.push({
          heading: m[1].trim(),
          position: m.index,
        });
      }

      // Look for domain knowledge, key concepts, capabilities sections
      const knowledgeSections = [];
      for (let i = 0; i < sections.length; i++) {
        const heading = sections[i].heading.toLowerCase();
        if (heading.includes('knowledge') || heading.includes('concept') ||
            heading.includes('domain') || heading.includes('capabilit') ||
            heading.includes('expertise') || heading.includes('principle')) {
          const start = sections[i].position;
          const end = i + 1 < sections.length ? sections[i + 1].position : content.length;
          const sectionText = content.substring(start, end);
          knowledgeSections.push({
            heading: sections[i].heading,
            text: sectionText,
          });
        }
      }

      // Also scan the full guide for tech and domain keywords
      const findings = {
        technologies: new Map(),
        domains: new Map(),
      };
      scanTextForKeywords(content, gf, findings);

      agentFindings.push({
        agent: agentCode,
        file: gf,
        knowledgeSections,
        technologies: findings.technologies,
        domains: findings.domains,
      });
    }
  }

  return agentFindings;
}

// ─── Gap Analysis ────────────────────────────────────────────────────────────

/**
 * Map existing TOOL entries to their technology names for cross-reference
 */
function buildToolNameMap(existing) {
  const map = new Map();
  for (const [id, entry] of Object.entries(existing.toolEntries)) {
    // Normalize title to lowercase for matching
    const titleLower = entry.title.toLowerCase();
    map.set(titleLower, id);
    // Also add key fragments
    if (titleLower.includes('/')) {
      for (const part of titleLower.split('/')) {
        map.set(part.trim(), id);
      }
    }
  }
  return map;
}

/**
 * Check if a technology is already covered by an existing TOOL entry
 */
function isTechCovered(techName, toolNameMap, existing) {
  const techLower = techName.toLowerCase();

  // Direct match against tool titles
  for (const [id, entry] of Object.entries(existing.toolEntries)) {
    const titleLower = entry.title.toLowerCase();
    const descLower = (entry.description || '').toLowerCase();
    if (titleLower.includes(techLower) || techLower.includes(titleLower) ||
        descLower.includes(techLower)) {
      return id;
    }
  }

  // Known mappings
  const knownMappings = {
    'THREE.js / 3D Rendering': 'TOOL-006',
    'React': 'TOOL-002',
    'Electron Desktop Apps': 'TOOL-010',
    'Vite Build System': 'TOOL-010',
    'D3.js Data Visualization': 'TOOL-011',
    'Python': 'TOOL-003',
    'JavaScript': 'TOOL-001',
    'TypeScript': 'TOOL-001',
    'NumPy': 'TOOL-003',
    'SciPy': 'TOOL-003',
    'Matplotlib': 'TOOL-016',
    'Pandoc': 'TOOL-008',
    'LaTeX': 'TOOL-009',
    'PlatformIO': 'TOOL-018',
    'Arduino': 'TOOL-018',
    'Ollama': 'TOOL-007',
    'Stripe Payments': 'TOOL-015',
    'Git': 'TOOL-005',
    'GitHub Pages': 'TOOL-014',
  };

  if (knownMappings[techName]) return knownMappings[techName];

  return null;
}

/**
 * Check if a domain topic is covered by existing claims/DAs
 */
function isDomainCovered(domainName, existing) {
  const domainLower = domainName.toLowerCase();

  // Check DA entries
  for (const [id, entry] of Object.entries(existing.daEntries)) {
    if (entry.title.toLowerCase().includes(domainLower) ||
        domainLower.includes(entry.title.toLowerCase())) {
      return id;
    }
  }

  // Check claim entries
  for (const [id, entry] of Object.entries(existing.claimEntries)) {
    if (entry.title.toLowerCase().includes(domainLower)) {
      return id;
    }
  }

  return null;
}

/**
 * Check if a skill description matches existing HSK/SKL entries
 */
function isSkillCovered(skillDesc, existing) {
  const descLower = skillDesc.toLowerCase();

  for (const [id, entry] of Object.entries(existing.hskEntries)) {
    if (entry.title.toLowerCase().includes(descLower) ||
        entry.description.toLowerCase().includes(descLower) ||
        descLower.includes(entry.title.toLowerCase())) {
      return id;
    }
  }

  for (const [id, entry] of Object.entries(existing.sklEntries)) {
    if (entry.title.toLowerCase().includes(descLower) ||
        entry.description.toLowerCase().includes(descLower) ||
        descLower.includes(entry.title.toLowerCase())) {
      return id;
    }
  }

  return null;
}

// ─── Main Analysis ───────────────────────────────────────────────────────────

function main() {
  console.log('Knowledge Base Gap Scanner');
  console.log('=========================\n');

  // Step 1: Parse existing KB
  console.log('Parsing existing KB entries...');
  const existing = parseExistingKB();
  const totalExisting = existing.hskIds.size + existing.sopIds.size +
    existing.sklIds.size + existing.toolIds.size + existing.claimIds.size +
    existing.fpIds.size + existing.daIds.size;
  console.log(`  Found ${totalExisting} existing KB nodes:`);
  console.log(`    FP: ${existing.fpIds.size}, DA: ${existing.daIds.size}, Claims: ${existing.claimIds.size}`);
  console.log(`    HSK: ${existing.hskIds.size}, SOP: ${existing.sopIds.size}, SKL: ${existing.sklIds.size}`);
  console.log(`    TOOL: ${existing.toolIds.size}\n`);

  const toolNameMap = buildToolNameMap(existing);

  // Step 2: Scan projects.json
  console.log('Scanning projects.json...');
  const projects = scanProjectsJson();
  console.log(`  Found ${projects.length} project entries\n`);

  // Step 3: Scan project directories
  console.log('Scanning project directories...');
  const projectDirs = readdirSafe(PROJECTS_DIR).filter(d => {
    const stat = statSafe(path.join(PROJECTS_DIR, d));
    return stat && stat.isDirectory() && !SKIP_DIRS.has(d);
  });

  // Also scan standalone dirs in website root
  const standaloneDirs = ['kb-explorer'].map(d => ({
    name: d,
    path: path.join(WEBSITE, d),
  })).filter(d => statSafe(d.path)?.isDirectory());

  const allProjectScans = new Map();

  for (const dir of projectDirs) {
    const dirPath = path.join(PROJECTS_DIR, dir);
    console.log(`  Scanning: ${dir}`);
    allProjectScans.set(dir, scanProjectDir(dirPath, dir));
  }

  for (const { name, path: dirPath } of standaloneDirs) {
    if (!allProjectScans.has(name)) {
      console.log(`  Scanning standalone: ${name}`);
      allProjectScans.set(name, scanProjectDir(dirPath, name));
    }
  }
  console.log(`  Scanned ${allProjectScans.size} project directories\n`);

  // Step 4: Scan documents
  console.log('Scanning documents...');
  const documents = scanDocuments();
  console.log(`  Found ${documents.length} documents\n`);

  // Step 5: Scan lecture files
  console.log('Scanning lecture files...');
  const lectures = scanLectureFiles();
  console.log(`  Found ${lectures.chapters.length} chapters, ${lectures.files.length} files\n`);

  // Step 6: Scan project documents
  console.log('Scanning project documents (PODs/PSRs)...');
  const podFindings = scanProjectDocuments();
  console.log(`  Found ${podFindings.length} project documents\n`);

  // Step 7: Scan memory files
  console.log('Scanning memory files...');
  const memoryFindings = scanMemoryFiles();
  console.log(`  Found ${memoryFindings.length} memory files\n`);

  // Step 8: Scan agent guides
  console.log('Scanning agent guides...');
  const agentFindings = scanAgentGuides();
  console.log(`  Found ${agentFindings.length} agent guides\n`);

  // ─── Analyze Gaps ────────────────────────────────────────────────────────

  console.log('Analyzing gaps...\n');

  // Aggregate all technology mentions across sources
  const allTechMentions = new Map(); // techName -> { projects: Set, otherSources: Set }
  const allDomainMentions = new Map(); // domainName -> { projects: Set, otherSources: Set }

  // From project directory scans
  for (const [projName, findings] of allProjectScans) {
    for (const [techName] of findings.technologies) {
      if (!allTechMentions.has(techName)) {
        allTechMentions.set(techName, { projects: new Set(), otherSources: new Set() });
      }
      allTechMentions.get(techName).projects.add(projName);
    }
    for (const [domainName] of findings.domains) {
      if (!allDomainMentions.has(domainName)) {
        allDomainMentions.set(domainName, { projects: new Set(), otherSources: new Set() });
      }
      allDomainMentions.get(domainName).projects.add(projName);
    }
  }

  // From projects.json descriptions
  for (const proj of projects) {
    const dummyFindings = { technologies: new Map(), domains: new Map() };
    scanTextForKeywords(
      `${proj.title} ${proj.description} ${(proj.tags || []).join(' ')}`,
      `projects.json (${proj.title})`,
      dummyFindings
    );
    for (const [techName] of dummyFindings.technologies) {
      if (!allTechMentions.has(techName)) {
        allTechMentions.set(techName, { projects: new Set(), otherSources: new Set() });
      }
      allTechMentions.get(techName).otherSources.add(`projects.json: ${proj.title}`);
    }
    for (const [domainName] of dummyFindings.domains) {
      if (!allDomainMentions.has(domainName)) {
        allDomainMentions.set(domainName, { projects: new Set(), otherSources: new Set() });
      }
      allDomainMentions.get(domainName).otherSources.add(`projects.json: ${proj.title}`);
    }
  }

  // From PODs/PSRs
  for (const pod of podFindings) {
    for (const [techName] of pod.technologies) {
      if (!allTechMentions.has(techName)) {
        allTechMentions.set(techName, { projects: new Set(), otherSources: new Set() });
      }
      allTechMentions.get(techName).otherSources.add(`POD/PSR: ${pod.file}`);
    }
    for (const [domainName] of pod.domains) {
      if (!allDomainMentions.has(domainName)) {
        allDomainMentions.set(domainName, { projects: new Set(), otherSources: new Set() });
      }
      allDomainMentions.get(domainName).otherSources.add(`POD/PSR: ${pod.file}`);
    }
  }

  // From memory files
  for (const mem of memoryFindings) {
    for (const [techName] of mem.technologies) {
      if (!allTechMentions.has(techName)) {
        allTechMentions.set(techName, { projects: new Set(), otherSources: new Set() });
      }
      allTechMentions.get(techName).otherSources.add(`Memory: ${mem.file}`);
    }
    for (const [domainName] of mem.domains) {
      if (!allDomainMentions.has(domainName)) {
        allDomainMentions.set(domainName, { projects: new Set(), otherSources: new Set() });
      }
      allDomainMentions.get(domainName).otherSources.add(`Memory: ${mem.file}`);
    }
  }

  // From agent guides
  for (const agent of agentFindings) {
    for (const [techName] of agent.technologies) {
      if (!allTechMentions.has(techName)) {
        allTechMentions.set(techName, { projects: new Set(), otherSources: new Set() });
      }
      allTechMentions.get(techName).otherSources.add(`Agent Guide: ${agent.agent}`);
    }
    for (const [domainName] of agent.domains) {
      if (!allDomainMentions.has(domainName)) {
        allDomainMentions.set(domainName, { projects: new Set(), otherSources: new Set() });
      }
      allDomainMentions.get(domainName).otherSources.add(`Agent Guide: ${agent.agent}`);
    }
  }

  // ─── Identify Tool Gaps ──────────────────────────────────────────────────

  const toolGaps = [];
  for (const [techName, mentions] of allTechMentions) {
    const coveredBy = isTechCovered(techName, toolNameMap, existing);
    if (!coveredBy) {
      const allSources = [...mentions.projects, ...mentions.otherSources];
      const confidence = (mentions.projects.size + mentions.otherSources.size) >= 2 ? 'strong' : 'weak';
      toolGaps.push({
        name: techName,
        projects: [...mentions.projects],
        otherSources: [...mentions.otherSources],
        confidence,
        totalMentions: allSources.length,
      });
    }
  }
  toolGaps.sort((a, b) => b.totalMentions - a.totalMentions);

  // ─── Identify Domain Knowledge Gaps ──────────────────────────────────────

  const domainGaps = [];
  for (const [domainName, mentions] of allDomainMentions) {
    const coveredBy = isDomainCovered(domainName, existing);
    if (!coveredBy) {
      const allSources = [...mentions.projects, ...mentions.otherSources];
      const confidence = (mentions.projects.size + mentions.otherSources.size) >= 2 ? 'strong' : 'weak';
      domainGaps.push({
        name: domainName,
        projects: [...mentions.projects],
        otherSources: [...mentions.otherSources],
        confidence,
        totalMentions: allSources.length,
      });
    }
  }
  domainGaps.sort((a, b) => b.totalMentions - a.totalMentions);

  // ─── Identify Human Skill Gaps ───────────────────────────────────────────

  const skillGapCandidates = [];

  // Map project characteristics to potential skills
  const projectSkillMap = {
    'simulation': 'Physics Simulation Development',
    'interactive': 'Interactive Web Application Design',
    'visualization': 'Data Visualization Design',
    '3d': '3D Graphics & Rendering',
    'api': 'API Architecture & Integration',
    'pipeline': 'Pipeline/Workflow Orchestration',
    'dashboard': 'Dashboard & Monitoring Design',
    'game': 'Game Development',
    'embedded': 'Embedded Systems',
    'document': 'Document Processing & Publishing',
    'editor': 'Code Editor/IDE Development',
    'mobile': 'Mobile/PWA Development',
    'ai agent': 'AI Agent System Design',
  };

  // Scan project descriptions for skill indicators
  for (const proj of projects) {
    const descLower = `${proj.title} ${proj.description} ${(proj.tags || []).join(' ')}`.toLowerCase();
    for (const [keyword, skillName] of Object.entries(projectSkillMap)) {
      if (descLower.includes(keyword)) {
        const coveredBy = isSkillCovered(skillName, existing);
        if (!coveredBy) {
          const existingCandidate = skillGapCandidates.find(c => c.name === skillName);
          if (existingCandidate) {
            if (!existingCandidate.projects.includes(proj.title)) {
              existingCandidate.projects.push(proj.title);
            }
          } else {
            skillGapCandidates.push({
              name: skillName,
              projects: [proj.title],
              suggestedId: `HSK-DEV-${String(existing.hskIds.size + skillGapCandidates.length + 1).padStart(3, '0')}`,
            });
          }
        }
      }
    }
  }

  // ─── Identify AI Skill Gaps (capabilities demonstrated but no SOP/SKL) ───

  const aiSkillGaps = [];

  // Check for capabilities from project scans that have no matching SOP
  const capabilityIndicators = [
    { keyword: 'electron', capability: 'Electron Desktop App Architecture', agent: 'CE' },
    { keyword: 'codemirror', capability: 'Code Editor Integration', agent: 'CE' },
    { keyword: 'websocket', capability: 'WebSocket Real-time Communication', agent: 'CE' },
    { keyword: 'ipc', capability: 'IPC Communication Patterns', agent: 'CE' },
    { keyword: 'cesium', capability: 'CesiumJS Globe/Geospatial Visualization', agent: 'CE' },
    { keyword: 'katex', capability: 'KaTeX Math Rendering Integration', agent: 'CE' },
    { keyword: 'quarto', capability: 'Quarto Document Compilation', agent: 'CE' },
    { keyword: 'express', capability: 'Express.js Server Development', agent: 'CE' },
    { keyword: 'manim', capability: 'Manim Mathematical Animation', agent: 'CE' },
    { keyword: 'pwa', capability: 'Progressive Web App Development', agent: 'CE' },
    { keyword: 'chart.js', capability: 'Chart.js Visualization', agent: 'CE' },
    { keyword: 'claude', capability: 'Claude API Integration', agent: 'CE' },
    { keyword: 'anthropic', capability: 'Anthropic SDK Usage', agent: 'CE' },
    { keyword: 'tailscale', capability: 'Tailscale Networking & Remote Access', agent: 'CE' },
    { keyword: 'force-directed', capability: 'Force-directed Graph Layout', agent: 'CE' },
    { keyword: 'topological sort', capability: 'DAG Topological Execution', agent: 'CE' },
    { keyword: 'marching cubes', capability: 'Isosurface Rendering (Marching Cubes)', agent: 'CE' },
    { keyword: 'seo', capability: 'Search Engine Optimization', agent: 'SA' },
    { keyword: 'sitemap', capability: 'Sitemap & Crawl Management', agent: 'SA' },
    { keyword: 'dark mode', capability: 'Dark Mode/Theme Switching', agent: 'CE' },
    { keyword: 'responsive', capability: 'Responsive Design Implementation', agent: 'CE' },
  ];

  for (const indicator of capabilityIndicators) {
    const techMentions = allTechMentions.get(TECH_KEYWORDS[indicator.keyword]) ||
                         allDomainMentions.get(DOMAIN_KEYWORDS[indicator.keyword]);
    // Also do a direct search
    let found = false;
    let sources = [];

    for (const [projName, findings] of allProjectScans) {
      for (const [techName] of findings.technologies) {
        if (techName.toLowerCase().includes(indicator.keyword)) {
          found = true;
          sources.push(projName);
        }
      }
      for (const [domainName] of findings.domains) {
        if (domainName.toLowerCase().includes(indicator.keyword)) {
          found = true;
          sources.push(projName);
        }
      }
    }

    if (found) {
      // Check if there's already an SOP or SKL for this
      let hasMatchingSOP = false;
      const capLower = indicator.capability.toLowerCase();
      for (const [, entry] of Object.entries(existing.sopEntries)) {
        if (entry.title.toLowerCase().includes(indicator.keyword) ||
            entry.description.toLowerCase().includes(indicator.keyword)) {
          hasMatchingSOP = true;
          break;
        }
      }
      for (const [, entry] of Object.entries(existing.sklEntries)) {
        if (entry.title.toLowerCase().includes(indicator.keyword) ||
            entry.description.toLowerCase().includes(indicator.keyword)) {
          hasMatchingSOP = true;
          break;
        }
      }

      if (!hasMatchingSOP) {
        aiSkillGaps.push({
          agent: indicator.agent,
          capability: indicator.capability,
          evidence: [...new Set(sources)],
        });
      }
    }
  }

  // ─── AI Domain Knowledge from Agent Guides ───────────────────────────────

  const aiKnowledgeGaps = [];
  for (const agent of agentFindings) {
    for (const section of agent.knowledgeSections) {
      // Extract bullet points or key items from the section
      const bullets = section.text.match(/^[-*]\s+(.+)/gm) || [];
      for (const bullet of bullets) {
        const item = bullet.replace(/^[-*]\s+/, '').trim();
        // Check if this is already covered by an existing AKN or claim
        const itemLower = item.toLowerCase();
        let covered = false;
        for (const [, entry] of Object.entries(existing.claimEntries)) {
          if (entry.title.toLowerCase().includes(itemLower.substring(0, 20))) {
            covered = true;
            break;
          }
        }
        if (!covered && item.length > 10) {
          aiKnowledgeGaps.push({
            agent: agent.agent,
            knowledge: item,
            section: section.heading,
            file: agent.file,
          });
        }
      }
    }
  }

  // ─── Build Cross-Reference Matrix ────────────────────────────────────────

  const crossRefMatrix = [];
  // Map projects to KB coverage
  for (const proj of projects) {
    const projDir = projectDirs.find(d => {
      const projLink = (proj.link || '').toLowerCase();
      return projLink.includes(d.toLowerCase());
    });

    const coveredTools = [];
    const uncoveredTech = [];
    const coveredDomains = [];
    const uncoveredDomains = [];

    if (projDir && allProjectScans.has(projDir)) {
      const findings = allProjectScans.get(projDir);
      for (const [techName] of findings.technologies) {
        const toolId = isTechCovered(techName, toolNameMap, existing);
        if (toolId) {
          coveredTools.push(`${toolId} (${techName})`);
        } else {
          uncoveredTech.push(techName);
        }
      }
      for (const [domainName] of findings.domains) {
        const daId = isDomainCovered(domainName, existing);
        if (daId) {
          coveredDomains.push(`${daId} (${domainName})`);
        } else {
          uncoveredDomains.push(domainName);
        }
      }
    }

    crossRefMatrix.push({
      project: proj.title,
      coveredTools,
      uncoveredTech,
      coveredDomains,
      uncoveredDomains,
    });
  }

  // ─── Generate Report ─────────────────────────────────────────────────────

  const now = new Date().toISOString().split('T')[0];
  const totalDocuments = documents.length + lectures.files.length;
  const totalAgentFiles = agentFindings.length;
  const totalCandidates = toolGaps.length + domainGaps.length + skillGapCandidates.length +
    aiSkillGaps.length + aiKnowledgeGaps.length;

  let report = '';
  report += `# Knowledge Base Gap Report\n`;
  report += `Generated: ${now}\n\n`;

  report += `## Summary\n`;
  report += `- Scanned: ${allProjectScans.size} project directories, ${totalDocuments} documents, ${totalAgentFiles} agent files\n`;
  report += `- Projects in projects.json: ${projects.length}\n`;
  report += `- Existing KB nodes: ${totalExisting} (${existing.fpIds.size} FP, ${existing.daIds.size} DA, ${existing.claimIds.size} claims, ${existing.hskIds.size} HSK, ${existing.sopIds.size} SOP, ${existing.sklIds.size} SKL, ${existing.toolIds.size} TOOL)\n`;
  report += `- Candidate new entries: ${totalCandidates}\n`;
  report += `  - Tool gaps: ${toolGaps.length}\n`;
  report += `  - Domain knowledge gaps: ${domainGaps.length}\n`;
  report += `  - Human skill gaps: ${skillGapCandidates.length}\n`;
  report += `  - AI skill gaps: ${aiSkillGaps.length}\n`;
  report += `  - AI knowledge gaps: ${aiKnowledgeGaps.length}\n\n`;

  report += `---\n\n`;

  // ─── Tool Gaps ───────────────────────────────────────────────────────────

  report += `## Tool Gaps (technologies used but not in TOOL entries)\n\n`;
  if (toolGaps.length === 0) {
    report += `No tool gaps found.\n\n`;
  } else {
    const strongToolGaps = toolGaps.filter(g => g.confidence === 'strong');
    const weakToolGaps = toolGaps.filter(g => g.confidence === 'weak');

    if (strongToolGaps.length > 0) {
      report += `### Strong (multiple sources)\n\n`;
      for (const gap of strongToolGaps) {
        const allSources = [...gap.projects, ...gap.otherSources];
        report += `- **${gap.name}** -- used by [${allSources.join(', ')}]\n`;
      }
      report += `\n`;
    }
    if (weakToolGaps.length > 0) {
      report += `### Weak (single source)\n\n`;
      for (const gap of weakToolGaps) {
        const allSources = [...gap.projects, ...gap.otherSources];
        report += `- **${gap.name}** -- found in [${allSources.join(', ')}]\n`;
      }
      report += `\n`;
    }
  }

  report += `---\n\n`;

  // ─── Human Skill Gaps ────────────────────────────────────────────────────

  report += `## Human Skill Gaps (not in HSK entries)\n\n`;

  report += `### Technology Skills\n\n`;
  if (skillGapCandidates.length === 0) {
    report += `No technology skill gaps found.\n\n`;
  } else {
    for (const gap of skillGapCandidates) {
      report += `- **${gap.suggestedId}:** ${gap.name} -- found in [${gap.projects.join(', ')}] -- not covered by existing HSK entries\n`;
    }
    report += `\n`;
  }

  report += `### Domain Knowledge Gaps (not in claims/DAs)\n\n`;
  if (domainGaps.length === 0) {
    report += `No domain knowledge gaps found.\n\n`;
  } else {
    const strongDomainGaps = domainGaps.filter(g => g.confidence === 'strong');
    const weakDomainGaps = domainGaps.filter(g => g.confidence === 'weak');

    if (strongDomainGaps.length > 0) {
      report += `#### Strong (multiple sources)\n\n`;
      for (const gap of strongDomainGaps) {
        const allSources = [...gap.projects, ...gap.otherSources];
        report += `- **${gap.name}** -- found in [${allSources.join(', ')}] -- not covered by existing claims\n`;
      }
      report += `\n`;
    }
    if (weakDomainGaps.length > 0) {
      report += `#### Weak (single source)\n\n`;
      for (const gap of weakDomainGaps) {
        const allSources = [...gap.projects, ...gap.otherSources];
        report += `- **${gap.name}** -- found in [${allSources.join(', ')}] -- not covered by existing claims\n`;
      }
      report += `\n`;
    }
  }

  report += `---\n\n`;

  // ─── AI Skill Gaps ───────────────────────────────────────────────────────

  report += `## AI Skill Gaps (not in SOP/SKL entries)\n\n`;

  report += `### Capabilities demonstrated but not in KB\n\n`;
  if (aiSkillGaps.length === 0) {
    report += `No AI skill gaps found.\n\n`;
  } else {
    // Group by agent
    const byAgent = {};
    for (const gap of aiSkillGaps) {
      if (!byAgent[gap.agent]) byAgent[gap.agent] = [];
      byAgent[gap.agent].push(gap);
    }
    for (const [agent, gaps] of Object.entries(byAgent)) {
      for (const gap of gaps) {
        report += `- **${agent}:** ${gap.capability} -- evidence: [${gap.evidence.join(', ')}] -- no matching SOP/SKL\n`;
      }
    }
    report += `\n`;
  }

  report += `### AI Domain Knowledge (from agent guides, not yet structured)\n\n`;
  if (aiKnowledgeGaps.length === 0) {
    report += `No AI domain knowledge gaps found.\n\n`;
  } else {
    // Group by agent, limit to first 10 per agent to keep report manageable
    const byAgent = {};
    for (const gap of aiKnowledgeGaps) {
      if (!byAgent[gap.agent]) byAgent[gap.agent] = [];
      byAgent[gap.agent].push(gap);
    }
    for (const [agent, gaps] of Object.entries(byAgent)) {
      const shown = gaps.slice(0, 10);
      for (const gap of shown) {
        report += `- **${agent}:** ${gap.knowledge} -- from guide section "${gap.section}" -- could be AKN entry\n`;
      }
      if (gaps.length > 10) {
        report += `- *(${gaps.length - 10} more ${agent} knowledge items omitted)*\n`;
      }
    }
    report += `\n`;
  }

  report += `---\n\n`;

  // ─── Cross-Reference Matrix ──────────────────────────────────────────────

  report += `## Cross-Reference Matrix\n\n`;
  report += `Projects mapped to existing KB entries and gaps.\n\n`;
  report += `| Project | Covered Tools | Uncovered Tech | Covered Domains | Uncovered Domains |\n`;
  report += `|---------|---------------|----------------|-----------------|-------------------|\n`;
  for (const row of crossRefMatrix) {
    const ct = row.coveredTools.length > 0 ? row.coveredTools.join('; ') : '--';
    const ut = row.uncoveredTech.length > 0 ? row.uncoveredTech.join('; ') : '--';
    const cd = row.coveredDomains.length > 0 ? row.coveredDomains.join('; ') : '--';
    const ud = row.uncoveredDomains.length > 0 ? row.uncoveredDomains.join('; ') : '--';
    report += `| ${row.project} | ${ct} | ${ut} | ${cd} | ${ud} |\n`;
  }
  report += `\n`;

  report += `---\n\n`;

  // ─── Appendix: Existing KB Node Summary ──────────────────────────────────

  report += `## Appendix: Existing KB Nodes\n\n`;

  report += `### First Principles (FP)\n`;
  for (const [id, entry] of Object.entries(existing.fpEntries).sort()) {
    report += `- ${id}: ${entry.title}\n`;
  }
  report += `\n`;

  report += `### Domain Axioms (DA)\n`;
  for (const [id, entry] of Object.entries(existing.daEntries).sort()) {
    report += `- ${id}: ${entry.title}\n`;
  }
  report += `\n`;

  report += `### Domain Claims\n`;
  for (const [id, entry] of Object.entries(existing.claimEntries).sort()) {
    report += `- ${id}: ${entry.title} (${entry.file})\n`;
  }
  report += `\n`;

  report += `### Human Skills (HSK)\n`;
  for (const [id, entry] of Object.entries(existing.hskEntries).sort()) {
    report += `- ${id}: ${entry.title}\n`;
  }
  report += `\n`;

  report += `### Agent SOPs\n`;
  for (const [id, entry] of Object.entries(existing.sopEntries).sort()) {
    report += `- ${id}: ${entry.title}\n`;
  }
  report += `\n`;

  report += `### Agent Skills (SKL)\n`;
  for (const [id, entry] of Object.entries(existing.sklEntries).sort()) {
    report += `- ${id}: ${entry.title}\n`;
  }
  report += `\n`;

  report += `### Tools (TOOL)\n`;
  for (const [id, entry] of Object.entries(existing.toolEntries).sort()) {
    report += `- ${id}: ${entry.title}\n`;
  }
  report += `\n`;

  report += `---\n\n`;

  // ─── Appendix: Scanned Sources Detail ────────────────────────────────────

  report += `## Appendix: Scanned Sources\n\n`;

  report += `### Project Directories Scanned\n`;
  for (const [name, findings] of allProjectScans) {
    const techCount = findings.technologies.size;
    const domainCount = findings.domains.size;
    const pkgNote = findings.hasPackageJson ? ` (package.json: ${findings.dependencies.length} deps)` : '';
    report += `- **${name}**: ${techCount} tech, ${domainCount} domain mentions${pkgNote}\n`;
  }
  report += `\n`;

  report += `### Documents Found\n`;
  for (const doc of documents) {
    report += `- ${doc.subdir}/${doc.name} (${doc.type})\n`;
  }
  report += `\n`;

  report += `### Lecture Chapters\n`;
  for (const ch of lectures.chapters) {
    const chFiles = lectures.files.filter(f => f.chapter === ch);
    report += `- Chapter ${ch}: ${chFiles.map(f => f.file).join(', ')}\n`;
  }
  report += `\n`;

  report += `### Project Documents (PODs/PSRs)\n`;
  for (const pod of podFindings) {
    report += `- ${pod.file} (${pod.isPOD ? 'POD' : pod.isPSR ? 'PSR' : 'other'})\n`;
  }
  report += `\n`;

  // ─── Write report ────────────────────────────────────────────────────────

  console.log(report);

  try {
    fs.writeFileSync(OUTPUT_FILE, report, 'utf-8');
    console.log(`\n=== Report written to: ${OUTPUT_FILE} ===`);
  } catch (err) {
    console.error(`Failed to write report: ${err.message}`);
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main();
