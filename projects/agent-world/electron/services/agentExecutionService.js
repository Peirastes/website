const { spawn } = require('child_process');
const path = require('path');

/**
 * Manages Claude CLI child processes — one session per agent.
 * Spawns `claude -p --output-format stream-json` and streams NDJSON events.
 */
class AgentExecutionService {
  constructor() {
    this.sessions = new Map(); // agentTypeId → { process, sessionId, buffer }
  }

  /**
   * Start a new Claude CLI session for an agent.
   */
  startSession(agentTypeId, prompt, onEvent, onExit) {
    // Kill existing session for this agent
    if (this.sessions.has(agentTypeId)) {
      this.stopSession(agentTypeId);
    }

    const args = [
      '-p',
      '--output-format', 'stream-json',
      '--model', 'sonnet',
      '--dangerously-skip-permissions',
      prompt
    ];

    const proc = spawn('claude', args, {
      cwd: 'C:\\Users\\Cole\\Dropbox',
      shell: true,
      env: { ...process.env }
    });

    const session = {
      process: proc,
      sessionId: null,
      buffer: ''
    };

    this.sessions.set(agentTypeId, session);

    // Parse NDJSON from stdout
    proc.stdout.on('data', (chunk) => {
      session.buffer += chunk.toString();
      const lines = session.buffer.split('\n');
      // Keep last incomplete line in buffer
      session.buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const event = JSON.parse(trimmed);
          // Capture session_id from init event
          if (event.type === 'system' && event.subtype === 'init' && event.session_id) {
            session.sessionId = event.session_id;
          }
          onEvent(event);
        } catch (e) {
          // Non-JSON line — send as raw
          onEvent({ type: 'raw', text: trimmed });
        }
      }
    });

    proc.stderr.on('data', (chunk) => {
      onEvent({ type: 'stderr', text: chunk.toString() });
    });

    proc.on('close', (code) => {
      this.sessions.delete(agentTypeId);
      onExit(code);
    });

    proc.on('error', (err) => {
      onEvent({ type: 'error', message: err.message });
      this.sessions.delete(agentTypeId);
      onExit(1);
    });
  }

  /**
   * Resume an existing session with a follow-up message.
   */
  resumeSession(agentTypeId, message, onEvent, onExit) {
    const prev = this.sessions.get(agentTypeId);
    const sessionId = prev ? prev.sessionId : null;

    if (!sessionId) {
      onEvent({ type: 'error', message: 'No session to resume — starting fresh.' });
      return this.startSession(agentTypeId, message, onEvent, onExit);
    }

    // Kill previous process if still running
    if (prev.process && !prev.process.killed) {
      prev.process.kill('SIGTERM');
    }

    const args = [
      '-p',
      '--output-format', 'stream-json',
      '--resume', sessionId,
      '--dangerously-skip-permissions',
      message
    ];

    const proc = spawn('claude', args, {
      cwd: 'C:\\Users\\Cole\\Dropbox',
      shell: true,
      env: { ...process.env }
    });

    const session = {
      process: proc,
      sessionId: sessionId,
      buffer: ''
    };

    this.sessions.set(agentTypeId, session);

    proc.stdout.on('data', (chunk) => {
      session.buffer += chunk.toString();
      const lines = session.buffer.split('\n');
      session.buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const event = JSON.parse(trimmed);
          if (event.type === 'system' && event.subtype === 'init' && event.session_id) {
            session.sessionId = event.session_id;
          }
          onEvent(event);
        } catch (e) {
          onEvent({ type: 'raw', text: trimmed });
        }
      }
    });

    proc.stderr.on('data', (chunk) => {
      onEvent({ type: 'stderr', text: chunk.toString() });
    });

    proc.on('close', (code) => {
      // Keep session info for future resumes, but clear process
      if (this.sessions.has(agentTypeId)) {
        this.sessions.get(agentTypeId).process = null;
      }
      onExit(code);
    });

    proc.on('error', (err) => {
      onEvent({ type: 'error', message: err.message });
      onExit(1);
    });
  }

  /**
   * Stop a running session.
   */
  stopSession(agentTypeId) {
    const session = this.sessions.get(agentTypeId);
    if (!session || !session.process) return;

    const proc = session.process;
    proc.kill('SIGTERM');

    // Force kill after 3s
    setTimeout(() => {
      if (!proc.killed) {
        proc.kill('SIGKILL');
      }
    }, 3000);
  }

  /**
   * Stop all running sessions (called on app quit).
   */
  stopAll() {
    for (const [agentTypeId] of this.sessions) {
      this.stopSession(agentTypeId);
    }
  }

  isRunning(agentTypeId) {
    const session = this.sessions.get(agentTypeId);
    return session && session.process && !session.process.killed;
  }

  getSessionInfo(agentTypeId) {
    const session = this.sessions.get(agentTypeId);
    if (!session) return null;
    return {
      agentTypeId,
      sessionId: session.sessionId,
      running: this.isRunning(agentTypeId)
    };
  }
}

module.exports = { AgentExecutionService };
