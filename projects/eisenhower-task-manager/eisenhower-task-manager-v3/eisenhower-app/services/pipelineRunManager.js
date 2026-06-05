const fs = require('fs');
const path = require('path');

/**
 * PipelineRunManager — singleton that holds pipeline execution state across HTTP requests.
 * One pipeline at a time. Manages launch, polling, breakpoint gates, abort.
 */
class PipelineRunManager {
  constructor(pipelineEngine, claudeService, pipelinesDir) {
    this.engine = pipelineEngine;
    this.claude = claudeService;
    this.pipelinesDir = pipelinesDir;
    this.reset();
  }

  reset() {
    this.state = {
      id: null,
      filename: null,
      pipelineName: null,
      status: 'idle',      // idle | running | paused-breakpoint | complete | failed | aborted
      progress: { completed: 0, total: 0, percent: 0 },
      breakpoint: null,     // { nodeId, nodeLabel, outputs }
      deliverables: [],
      log: [],
      tokenUsage: { input: 0, output: 0 },
      startTime: null,
      duration: null,
      error: null
    };
  }

  /**
   * List available pipelines with metadata.
   */
  listPipelines() {
    if (!fs.existsSync(this.pipelinesDir)) return [];
    const files = fs.readdirSync(this.pipelinesDir).filter(f => f.endsWith('.json'));
    return files.map(filename => {
      try {
        const raw = fs.readFileSync(path.join(this.pipelinesDir, filename), 'utf-8');
        const pipeline = JSON.parse(raw);
        const nodes = pipeline.nodes || [];
        const breakpoints = pipeline.breakpoints || [];
        return {
          filename,
          name: pipeline.name || filename.replace(/\.json$/, '').replace(/_/g, ' '),
          nodeCount: nodes.length,
          breakpointCount: breakpoints.length,
          description: pipeline.description || ''
        };
      } catch {
        return { filename, name: filename, nodeCount: 0, breakpointCount: 0, description: '' };
      }
    });
  }

  /**
   * Launch a pipeline. Returns immediately; execution runs async.
   */
  launch(filename, parameters = {}) {
    if (this.state.status === 'running' || this.state.status === 'paused-breakpoint') {
      throw new Error('A pipeline is already running. Abort it first.');
    }

    const filePath = path.join(this.pipelinesDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Pipeline not found: ${filename}`);
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const pipeline = JSON.parse(raw);

    this.reset();
    this.state.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    this.state.filename = filename;
    this.state.pipelineName = pipeline.name || filename;
    this.state.status = 'running';
    this.state.startTime = Date.now();
    this.state.progress.total = (pipeline.nodes || []).filter(n => n.type !== 'breakpoint').length;

    // Build node label lookup
    const nodeLabels = {};
    for (const node of (pipeline.nodes || [])) {
      nodeLabels[node.id] = node.label || node.config?.label || node.id;
    }

    // Run engine async (fire and forget)
    this.engine.run(pipeline, (nodeId, status, data) => {
      // onStatus callback — update state
      this.state.log.push({
        nodeId,
        nodeLabel: nodeLabels[nodeId] || nodeId,
        status,
        time: Date.now(),
        detail: data?.error || null
      });

      if (status === 'complete' && data?.progress) {
        this.state.progress.completed = data.progress.completed;
        this.state.progress.percent = Math.round((data.progress.completed / data.progress.total) * 100);
      }

      if (status === 'paused-breakpoint') {
        this.state.status = 'paused-breakpoint';
        this.state.breakpoint = {
          nodeId,
          nodeLabel: nodeLabels[nodeId] || nodeId,
          outputs: data || {}
        };
      }

      if (status === 'failed') {
        // Individual node failure — engine will propagate the error
      }
    }, parameters).then(results => {
      // Pipeline finished
      if (results.aborted) {
        this.state.status = 'aborted';
      } else if (results.error) {
        this.state.status = 'failed';
        this.state.error = results.error;
      } else {
        this.state.status = 'complete';
      }
      this.state.duration = results.duration;
      this.state.deliverables = results.deliverables || [];
      this.state.tokenUsage = results.tokenUsage || { input: 0, output: 0 };
    }).catch(err => {
      this.state.status = 'failed';
      this.state.error = err.message;
      this.state.duration = Date.now() - this.state.startTime;
    });

    return { id: this.state.id, pipelineName: this.state.pipelineName };
  }

  /**
   * Get current run status (for polling).
   */
  getStatus() {
    return { ...this.state };
  }

  /**
   * Continue from a breakpoint. Optionally apply a revision instruction.
   */
  async continueBreakpoint(nodeId, revisionInstruction) {
    if (this.state.status !== 'paused-breakpoint') {
      throw new Error('Not at a breakpoint');
    }
    if (this.state.breakpoint?.nodeId !== nodeId) {
      throw new Error(`Breakpoint node mismatch: expected ${this.state.breakpoint?.nodeId}, got ${nodeId}`);
    }

    let editedOutputs = null;

    if (revisionInstruction && this.claude) {
      // Apply revision via Claude
      const outputs = this.state.breakpoint.outputs;
      const content = outputs.text || outputs.context || '';

      if (content) {
        const revised = await this._reviseContent(content, revisionInstruction);
        if (revised.success) {
          // Build edited outputs matching the same port names
          editedOutputs = {};
          if (outputs.text !== undefined) editedOutputs.text = revised.text;
          if (outputs.context !== undefined) editedOutputs.context = revised.text;
        } else {
          throw new Error(`Revision failed: ${revised.error}`);
        }
      }
    }

    this.state.status = 'running';
    this.state.breakpoint = null;
    this.engine.releaseBreakpointGate(nodeId, editedOutputs);
  }

  /**
   * Abort the current run.
   */
  abortRun() {
    if (this.state.status !== 'running' && this.state.status !== 'paused-breakpoint') {
      throw new Error('No pipeline running');
    }
    this.engine.abort();
    this.state.status = 'aborted';
    this.state.breakpoint = null;
    this.state.duration = Date.now() - this.state.startTime;
  }

  /**
   * Revise content using Claude (diff mode for large, full mode for short).
   */
  async _reviseContent(content, instruction) {
    try {
      const useDiffMode = content.length > 2000;

      if (useDiffMode) {
        const result = await this.claude.call({
          system: `You are a precise content revision assistant. Output ONLY search-and-replace blocks:

<<<SEARCH
exact original text to find
===
replacement text
>>>REPLACE

Rules:
1. Each SEARCH block must match the original content EXACTLY (including whitespace).
2. Include enough context to be unambiguous (3-5 lines).
3. Output ONLY blocks that need to change.
4. Do NOT include any explanation outside the blocks.`,
          prompt: `Here is the content:\n\n---\n${content}\n---\n\nRevision instruction: ${instruction}`,
          model: 'claude-sonnet-4-6',
          maxTokens: 8000
        });

        const blocks = [];
        const blockRegex = /<<<SEARCH\n([\s\S]*?)\n===\n([\s\S]*?)\n>>>REPLACE/g;
        let match;
        while ((match = blockRegex.exec(result.text)) !== null) {
          blocks.push({ search: match[1], replace: match[2] });
        }

        if (blocks.length === 0) {
          return { success: false, error: 'No valid search/replace blocks found.' };
        }

        let revised = content;
        let applied = 0;
        for (const block of blocks) {
          const idx = revised.indexOf(block.search);
          if (idx >= 0) {
            revised = revised.slice(0, idx) + block.replace + revised.slice(idx + block.search.length);
            applied++;
          }
        }

        if (applied === 0) {
          return { success: false, error: 'All edits failed to match.' };
        }

        return { success: true, text: revised };

      } else {
        const result = await this.claude.call({
          system: 'You are a revision assistant. Apply the requested changes precisely. Output ONLY the revised content — no preamble, no explanation.',
          prompt: `Content:\n\n---\n${content}\n---\n\nRevision instruction: ${instruction}`,
          model: 'claude-sonnet-4-6',
          maxTokens: 16000
        });

        return { success: true, text: result.text };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = { PipelineRunManager };
