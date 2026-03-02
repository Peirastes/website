const fs = require('fs');
const path = require('path');

class SaveService {
  constructor(savesDir) {
    this.savesDir = savesDir;
    this.savePath = path.join(savesDir, 'save.json');
  }

  async load() {
    try {
      if (!fs.existsSync(this.savePath)) {
        return { success: true, data: null };
      }
      const raw = fs.readFileSync(this.savePath, 'utf-8');
      return { success: true, data: JSON.parse(raw) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async save(data) {
    try {
      if (!fs.existsSync(this.savesDir)) {
        fs.mkdirSync(this.savesDir, { recursive: true });
      }
      const payload = {
        ...data,
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.savePath, JSON.stringify(payload, null, 2), 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = { SaveService };
