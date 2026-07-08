const { spawn } = require('child_process');
const path = require('path');

class CommandService {
  /**
   * Execute a command and return stdout/stderr.
   * @param {string} cmd - Command to run
   * @param {string[]} args - Arguments
   * @param {object} opts - Options: cwd, input, timeout
   */
  async run(cmd, args = [], opts = {}) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, {
        cwd: opts.cwd || process.cwd(),
        shell: opts.shell || false,
        timeout: opts.timeout || 300000, // 5 min default
        env: { ...process.env, ...opts.env }
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
      proc.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });

      proc.on('error', (err) => reject(err));

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command "${cmd}" exited with code ${code}\nstderr: ${stderr}`));
        }
      });

      if (opts.input) {
        proc.stdin?.write(opts.input);
        proc.stdin?.end();
      }
    });
  }

  /**
   * Run a Python script.
   */
  async python(scriptPath, args = [], opts = {}) {
    return this.run('python', [scriptPath, ...args], opts);
  }

  /**
   * Run Pandoc to convert markdown to docx.
   */
  async pandoc(sourcePath, outputPath, referenceDoc, opts = {}) {
    const args = [sourcePath, '-o', outputPath];
    if (referenceDoc) {
      args.push('--reference-doc', referenceDoc);
    }
    args.push('--resource-path', path.dirname(sourcePath));
    return this.run('pandoc', args, opts);
  }
}

module.exports = { CommandService };
