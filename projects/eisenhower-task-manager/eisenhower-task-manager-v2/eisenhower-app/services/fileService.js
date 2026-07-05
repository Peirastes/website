const fs = require('fs');
const path = require('path');

class FileService {
  read(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  write(filePath, content) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return filePath;
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
