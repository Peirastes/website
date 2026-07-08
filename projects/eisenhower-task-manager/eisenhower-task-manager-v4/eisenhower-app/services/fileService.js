const fs = require('fs');
const path = require('path');

class FileService {
  read(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Write content to a file. Backup-before-overwrite: if the target already
   * exists and the new content differs, the existing file is first copied to a
   * timestamped backup in a sibling `_backups/` folder. This makes every pipeline
   * overwrite non-destructive and locally recoverable — a re-run can never
   * silently clobber notes, deliverables, or any prior output.
   *   - Identical content → skipped entirely (no write, no backup, no mtime churn).
   *   - Backup failure → throws rather than overwriting unprotected.
   */
  write(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      let existing = null;
      try { existing = fs.readFileSync(filePath, 'utf-8'); } catch { /* binary/locked → treat as changed */ }
      if (existing === content) {
        return filePath; // no change — leave the file (and its mtime) untouched
      }
      try {
        const backupDir = path.join(dir, '_backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        const base = `${path.basename(filePath)}.${this._timestamp()}`;
        // Guarantee a unique name even for multiple writes within the same millisecond.
        let backupPath = path.join(backupDir, `${base}.bak`);
        for (let n = 1; fs.existsSync(backupPath); n++) {
          backupPath = path.join(backupDir, `${base}-${n}.bak`);
        }
        fs.copyFileSync(filePath, backupPath);
      } catch (err) {
        // Never overwrite something we couldn't back up.
        throw new Error(`Refusing to overwrite ${filePath}: backup failed (${err.message})`);
      }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
  }

  _timestamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${ms}`;
  }

  exists(filePath) {
    return fs.existsSync(filePath);
  }

  glob(directory, pattern) {
    if (!fs.existsSync(directory)) return [];
    const files = fs.readdirSync(directory);
    if (!pattern) return files.map(f => path.join(directory, f));

    const ext = pattern.replace('*', '');
    return files
      .filter(f => f.endsWith(ext))
      .map(f => path.join(directory, f));
  }
}

module.exports = { FileService };
