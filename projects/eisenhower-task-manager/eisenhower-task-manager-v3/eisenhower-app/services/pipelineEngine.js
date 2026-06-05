const path = require('path');

class PipelineEngine {
  constructor(claudeService, commandService, fileService) {
    this.claude = claudeService;
    this.command = commandService;
    this.file = fileService;
    this.aborted = false;
    this.breakpointGates = {};
  }

  /**
   * Abort a running pipeline — rejects all pending breakpoint gates.
   */
  abort() {
    this.aborted = true;
    for (const gate of Object.values(this.breakpointGates)) {
      gate.reject(new Error('Pipeline aborted'));
    }
    this.breakpointGates = {};
  }

  /**
   * Create a promise gate for a breakpoint node.
   * Engine awaits this; external code calls releaseBreakpointGate() to continue.
   */
  awaitBreakpointGate(nodeId) {
    return new Promise((resolve, reject) => {
      this.breakpointGates[nodeId] = { resolve, reject };
    });
  }

  /**
   * Release a breakpoint gate, optionally with edited outputs.
   */
  releaseBreakpointGate(nodeId, editedOutputs) {
    const gate = this.breakpointGates[nodeId];
    if (gate) {
      gate.resolve(editedOutputs || null);
      delete this.breakpointGates[nodeId];
    }
  }

  /**
   * Execute a pipeline with level-based parallelism and breakpoint gates.
   * @param {object} pipeline - { nodes, edges, breakpoints?, parameters? }
   * @param {function} onStatus - callback(nodeId, status, data)
   * @param {object} parameters - key-value overrides for {{KEY}} substitution
   * @returns {object} - execution results
   */
  async run(pipeline, onStatus, parameters = {}) {
    this.aborted = false;
    this.breakpointGates = {};

    let { nodes, edges } = pipeline;
    const breakpoints = new Set(pipeline.breakpoints || []);

    // Merge pipeline.parameters with explicit parameters (explicit wins)
    const params = { ...(pipeline.parameters || {}), ...parameters };

    // Apply parameter substitution (deep clone first)
    if (Object.keys(params).length > 0) {
      nodes = nodes.map(n => {
        if (!n.config) return { ...n };
        const configStr = JSON.stringify(n.config).replace(
          /\{\{(\w+)\}\}/g,
          (_, key) => {
            if (params[key] === undefined) return '';
            return params[key].replace(/\\/g, '\\\\');
          }
        );
        return { ...n, config: JSON.parse(configStr) };
      });
    } else {
      nodes = nodes.map(n => ({ ...n }));
    }

    const outputs = {}; // nodeId:portName -> value
    const results = {
      deliverables: [],
      log: [],
      tokenUsage: { input: 0, output: 0 },
      nodeStats: [],
      startTime: Date.now()
    };

    // Level-based topological sort for parallel execution
    const levels = this.topologicalSortLevels(nodes, edges);
    const totalNodes = nodes.filter(n => n.type !== 'breakpoint').length;
    let completedNodes = 0;

    for (const level of levels) {
      if (this.aborted) {
        results.duration = Date.now() - results.startTime;
        results.aborted = true;
        return results;
      }

      // Execute all nodes in this level in parallel
      const levelPromises = level.map(async (nodeId) => {
        if (this.aborted) return null;
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return null;

        // Skip breakpoint-type nodes (they're just markers)
        if (node.type === 'breakpoint') {
          onStatus(nodeId, 'skipped', null);
          return { nodeId, type: node.type, outputs: {}, tokens: { input: 0, output: 0 }, deliverables: [], log: [], duration: 0, status: 'skipped' };
        }

        const nodeStart = Date.now();
        const nodeTokens = { input: 0, output: 0 };
        const nodeResults = {
          deliverables: [],
          log: [],
          tokenUsage: nodeTokens
        };

        onStatus(nodeId, 'executing', null);

        try {
          const inputs = this.resolveInputs(nodeId, edges, outputs);
          const nodeOutputs = await this.executeNode(node, inputs, nodeResults);
          return {
            nodeId, type: node.type,
            outputs: nodeOutputs,
            tokens: { ...nodeTokens },
            deliverables: nodeResults.deliverables,
            log: nodeResults.log,
            duration: Date.now() - nodeStart,
            status: 'complete'
          };
        } catch (err) {
          onStatus(nodeId, 'failed', { error: err.message });
          return {
            nodeId, type: node.type,
            error: err.message,
            tokens: { ...nodeTokens },
            deliverables: nodeResults.deliverables,
            log: nodeResults.log,
            duration: Date.now() - nodeStart,
            status: 'failed'
          };
        }
      });

      const levelResults = await Promise.all(levelPromises);

      // Process level results
      let failed = null;
      for (const nr of levelResults) {
        if (!nr) continue;
        results.tokenUsage.input += nr.tokens.input;
        results.tokenUsage.output += nr.tokens.output;
        results.deliverables.push(...nr.deliverables);
        results.log.push(...nr.log);
        results.nodeStats.push({
          nodeId: nr.nodeId, type: nr.type,
          duration: nr.duration, tokens: nr.tokens,
          status: nr.status
        });

        if (nr.status === 'complete') {
          for (const [portName, value] of Object.entries(nr.outputs)) {
            outputs[`${nr.nodeId}:${portName}`] = value;
          }
          if (nr.type !== 'breakpoint') completedNodes++;
          onStatus(nr.nodeId, 'complete', { progress: { completed: completedNodes, total: totalNodes } });
        } else if (nr.status === 'failed' && !failed) {
          failed = nr;
        }
      }

      if (failed) {
        results.duration = Date.now() - results.startTime;
        results.error = `Node "${failed.nodeId}" (${failed.type}) failed: ${failed.error}`;
        return results;
      }

      // Breakpoint gates: pause after level if any completed nodes are breakpoints
      for (const nr of levelResults) {
        if (!nr || nr.status !== 'complete') continue;
        if (breakpoints.has(nr.nodeId)) {
          onStatus(nr.nodeId, 'paused-breakpoint', nr.outputs);
          let editedOutputs;
          try {
            editedOutputs = await this.awaitBreakpointGate(nr.nodeId);
          } catch {
            // Gate rejected (abort) — exit gracefully
            results.duration = Date.now() - results.startTime;
            results.aborted = true;
            return results;
          }
          if (this.aborted) {
            results.duration = Date.now() - results.startTime;
            results.aborted = true;
            return results;
          }
          // Apply user edits to outputs map so downstream nodes get the modified data
          if (editedOutputs) {
            for (const [portName, value] of Object.entries(editedOutputs)) {
              outputs[`${nr.nodeId}:${portName}`] = value;
            }
          }
        }
      }
    }

    results.duration = Date.now() - results.startTime;
    return results;
  }

  /**
   * Level-based topological sort (Kahn's algorithm).
   * Returns array of levels, each level is an array of node IDs that can run in parallel.
   */
  topologicalSortLevels(nodes, edges) {
    const nodeIds = nodes.map(n => n.id);
    const inDegree = {};
    const adj = {};
    for (const id of nodeIds) { inDegree[id] = 0; adj[id] = []; }
    for (const edge of edges) {
      const from = edge.from.split(':')[0];
      const to = edge.to.split(':')[0];
      if (adj[from]) adj[from].push(to);
      inDegree[to] = (inDegree[to] || 0) + 1;
    }

    const levels = [];
    let queue = nodeIds.filter(id => inDegree[id] === 0);
    let processed = 0;

    while (queue.length > 0) {
      levels.push([...queue]);
      processed += queue.length;
      const nextQueue = [];
      for (const cur of queue) {
        for (const nb of (adj[cur] || [])) {
          inDegree[nb]--;
          if (inDegree[nb] === 0) nextQueue.push(nb);
        }
      }
      queue = nextQueue;
    }

    if (processed !== nodeIds.length) throw new Error('Pipeline contains a cycle — cannot execute');
    return levels;
  }

  /**
   * Resolve input values for a node from upstream outputs.
   */
  resolveInputs(nodeId, edges, outputs) {
    const inputs = {};
    for (const edge of edges) {
      const toNode = edge.to.split(':')[0];
      if (toNode !== nodeId) continue;
      const toPort = edge.to.split(':').slice(1).join(':');
      const value = outputs[edge.from];
      const arrayMatch = toPort.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const portName = arrayMatch[1];
        if (!inputs[portName]) inputs[portName] = [];
        inputs[portName].push(value);
      } else {
        inputs[toPort] = value;
      }
    }
    return inputs;
  }

  /**
   * Execute a single node based on its type.
   */
  async executeNode(node, inputs, results) {
    const { type, config } = node;

    switch (type) {
      case 'file-reader': {
        const filePath = config.path;
        const content = this.file.read(filePath);
        return { text: content, file: filePath };
      }

      case 'constant': {
        return { text: config.value || '' };
      }

      case 'context-assembler': {
        const contextParts = inputs.context || [];
        const assembled = contextParts.join('\n\n---\n\n');
        return { context: assembled };
      }

      case 'claude-agent': {
        const systemPrompt = inputs.context || '';
        const userPrompt = inputs.prompt || inputs.text || '';
        if (!userPrompt) throw new Error('Claude Agent node has no prompt input');

        const response = await this.claude.call({
          system: systemPrompt,
          prompt: userPrompt,
          model: config.model || 'claude-opus-4-6',
          maxTokens: config.maxTokens || 16000
        });

        results.tokenUsage.input += response.inputTokens;
        results.tokenUsage.output += response.outputTokens;
        results.log.push({
          nodeId: node.id,
          detail: `Tokens: ${response.inputTokens} in / ${response.outputTokens} out (${response.model})`
        });

        return { text: response.text };
      }

      case 'file-writer': {
        const content = inputs.text || inputs.content || '';
        const filePath = config.path;
        this.file.write(filePath, content);
        return { file: filePath };
      }

      case 'python-script': {
        const scriptPath = config.script;
        const cwd = config.cwd || path.dirname(scriptPath);
        const result = await this.command.python(scriptPath, config.args || [], { cwd });
        return { text: result.stdout, file: config.outputPath || scriptPath };
      }

      case 'pandoc': {
        const sourcePath = inputs.file || config.source;
        const outputPath = config.output || sourcePath.replace(/\.md$/, '.docx');
        const referenceDoc = config.referenceDoc || null;
        await this.command.pandoc(sourcePath, outputPath, referenceDoc);
        return { file: outputPath };
      }

      case 'shell': {
        const cmd = config.command || '';
        const cwd = config.cwd || process.cwd();
        const result = await this.command.run(cmd, [], { cwd, shell: true, timeout: config.timeout || 120000 });
        return { text: result.stdout };
      }

      case 'deliverable': {
        const filePath = inputs.file || '(no file)';
        const label = config.label || 'Output';
        results.deliverables.push({ label, file: filePath });
        return { file: filePath };
      }

      case 'log': {
        const text = inputs.text || '';
        results.log.push({ nodeId: node.id, detail: text });
        return {};
      }

      case 'text-extract': {
        const source = inputs.text || '';
        const pattern = config.pattern || '';
        if (!pattern) return { text: source };
        const match = source.match(new RegExp(pattern, 's'));
        return { text: match ? (match[1] || match[0]) : '' };
      }

      case 'splitter': {
        const text = inputs.text || '';
        const delimiter = config.delimiter || '\n---\n';
        const parts = text.split(delimiter);
        const out = {};
        parts.forEach((part, i) => { out[`part${i}`] = part.trim(); });
        out.text = text;
        return out;
      }

      case 'markdown-html': {
        // Pass through — actual rendering happens client-side or via pandoc
        const text = inputs.text || '';
        return { text, html: text };
      }

      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  }
}

module.exports = { PipelineEngine };
