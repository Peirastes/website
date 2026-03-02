const fs = require('fs');
const path = require('path');

// Agent type ID → folder name mapping
const AGENT_FOLDERS = {
  CE: 'CE Agent',
  CD: 'CD Agent',
  PM: 'PM Agent',
  RA: 'RA Agent',
  SA: 'SA Agent',
  TA: 'TA Agent'
};

class AgentFileService {
  constructor(agentsDir) {
    this.agentsDir = agentsDir;
    this.watcher = null;
  }

  getDirectivesPath(agentTypeId) {
    const folder = AGENT_FOLDERS[agentTypeId];
    if (!folder) throw new Error(`Unknown agent type: ${agentTypeId}`);
    return path.join(this.agentsDir, folder, 'DIRECTIVES.md');
  }

  async readDirectives(agentTypeId) {
    const filePath = this.getDirectivesPath(agentTypeId);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content, path: filePath };
    } catch (err) {
      return { success: false, error: err.message, path: filePath };
    }
  }

  async readAllDirectives() {
    const results = {};
    for (const typeId of Object.keys(AGENT_FOLDERS)) {
      results[typeId] = await this.readDirectives(typeId);
    }
    return results;
  }

  async writeDirectives(agentTypeId, content) {
    const filePath = this.getDirectivesPath(agentTypeId);
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  startWatching(callback) {
    // Dynamically require chokidar to avoid issues during build
    let chokidar;
    try {
      chokidar = require('chokidar');
    } catch (e) {
      console.warn('chokidar not available, file watching disabled');
      return;
    }

    const watchPaths = Object.keys(AGENT_FOLDERS).map(typeId =>
      this.getDirectivesPath(typeId)
    );

    this.watcher = chokidar.watch(watchPaths, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 }
    });

    this.watcher.on('change', (filePath) => {
      // Determine which agent type changed
      const normalizedPath = filePath.replace(/\\/g, '/');
      for (const [typeId, folder] of Object.entries(AGENT_FOLDERS)) {
        if (normalizedPath.includes(folder)) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            callback(typeId, content);
          } catch (err) {
            console.error(`Error reading changed file ${filePath}:`, err);
          }
          break;
        }
      }
    });
  }

  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

module.exports = { AgentFileService };
