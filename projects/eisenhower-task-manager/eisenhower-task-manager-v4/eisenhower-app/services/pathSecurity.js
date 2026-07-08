const path = require('path');

const DROPBOX_ROOT = 'C:\\Users\\Cole\\Dropbox';

function safePath(relativePath) {
  const cleaned = relativePath.replace(/\.\./g, '').replace(/^[/\\]+/, '');
  const resolved = path.resolve(DROPBOX_ROOT, cleaned);
  if (!resolved.startsWith(DROPBOX_ROOT)) {
    throw new Error('Access denied: path outside Dropbox');
  }
  return resolved;
}

module.exports = { safePath, DROPBOX_ROOT };
