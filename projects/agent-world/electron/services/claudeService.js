const Anthropic = require('@anthropic-ai/sdk');

const AGENT_PERSONALITIES = {
  CE: { nickname: 'CHIP', sketch: 'Methodical engineer who loves firmware, pipelines, and clean commits. Speaks precisely.' },
  CD: { nickname: 'MUSE', sketch: 'Aesthetic visionary obsessed with color palettes, typography, and creative storytelling.' },
  PM: { nickname: 'LEAD', sketch: 'Organized coordinator who tracks deadlines, dependencies, and cross-agent workflows.' },
  RA: { nickname: 'SAGE', sketch: 'Curious researcher who digs into data, citations, and empirical evidence.' },
  SA: { nickname: 'GATE', sketch: 'Infrastructure guardian focused on deployments, DNS, CI/CD, and uptime.' },
  TA: { nickname: 'PROF', sketch: 'Warm educator who crafts lecture notes, explains concepts, and cares about pedagogy.' }
};

class ClaudeService {
  constructor() {
    this.client = null;
    this.history = []; // sliding window of conversation messages
    this.maxHistory = 20;
  }

  ensureClient() {
    if (this.client) return true;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return false;
    this.client = new Anthropic({ apiKey });
    return true;
  }

  buildSystemPrompt(workload) {
    const agentLines = Object.entries(AGENT_PERSONALITIES).map(([id, a]) => {
      const w = workload[id] || {};
      const tasks = w.tasks && w.tasks.length > 0 ? w.tasks.join(', ') : 'nothing active';
      const mood = w.mood || 'idle';
      return `- ${a.nickname} (${id}): ${a.sketch} [Mood: ${mood} | Working on: ${tasks}]`;
    }).join('\n');

    return `You are the team of 6 AI agents in a campus world. The player is your boss.

AGENTS:
${agentLines}

RULES:
- Respond as JSON: { "messages": [{ "agent": "CE", "text": "..." }], "tasks": [] }
- 1-3 agents should respond per message — pick whoever is most relevant
- Each response under 120 characters. Stay in character.
- Use agent nicknames naturally (CHIP, MUSE, LEAD, SAGE, GATE, PROF)
- Only include "tasks" array when the player is clearly assigning work
- Task format: { "agent": "CE", "priority": "P2", "title": "Task title", "project": "Project Name", "context": "What needs to be done" }
- Be conversational, witty, and team-like — think Slack workspace vibes
- If the player greets or asks casually, respond casually. Don't over-explain.
- If you can't determine who should respond, PM (LEAD) takes point.`;
  }

  async chat(message, workload) {
    if (!this.ensureClient()) {
      return { error: 'No ANTHROPIC_API_KEY set. Add it to your environment variables.' };
    }

    // Add player message to history
    this.history.push({ role: 'user', content: message });

    // Trim history to sliding window
    while (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const systemPrompt = this.buildSystemPrompt(workload);

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: this.history
      });

      const rawText = response.content[0].text;

      // Add assistant response to history
      this.history.push({ role: 'assistant', content: rawText });

      // Parse JSON response
      try {
        // Extract JSON from potential markdown code fences
        let jsonStr = rawText;
        const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenceMatch) jsonStr = fenceMatch[1];

        const parsed = JSON.parse(jsonStr.trim());
        return {
          messages: parsed.messages || [],
          tasks: parsed.tasks || []
        };
      } catch (parseErr) {
        // JSON parse failed — wrap raw text as PM message
        return {
          messages: [{ agent: 'PM', text: rawText.slice(0, 200) }],
          tasks: []
        };
      }
    } catch (err) {
      return { error: `API error: ${err.message}` };
    }
  }
}

module.exports = { ClaudeService };
