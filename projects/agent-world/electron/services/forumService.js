const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

/**
 * Forum debate service — orchestrates multi-character AI debates
 * using the Assembly of History's Greatest Minds roster.
 */
class ForumService {
  constructor() {
    this.client = null;
    this.history = [];
    this.maxHistory = 30;
    this.rosterData = null;
    this.thinkerEntries = {};
    this.panelDynamics = '';
  }

  ensureClient() {
    if (this.client) return true;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return false;
    this.client = new Anthropic({ apiKey });
    return true;
  }

  loadRoster(rosterPath) {
    try {
      const raw = fs.readFileSync(rosterPath, 'utf-8');
      this.rosterData = raw;
      this._parseRoster(raw);
      return { success: true, thinkerCount: Object.keys(this.thinkerEntries).length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  _parseRoster(markdown) {
    const lines = markdown.split('\n');
    this.thinkerEntries = {};
    let currentThinker = null;
    let currentBlock = [];
    let inDynamics = false;
    let dynamicsLines = [];

    for (const line of lines) {
      // Detect thinker headers: "#### Name (dates) — Title"
      const thinkerMatch = line.match(/^####\s+(.+?)\s+\(/);
      if (thinkerMatch) {
        // Save previous thinker
        if (currentThinker) {
          this.thinkerEntries[currentThinker] = currentBlock.join('\n');
        }
        currentThinker = thinkerMatch[1].trim();
        currentBlock = [line];
        inDynamics = false;
        continue;
      }

      // Detect Panel Dynamics section
      if (line.startsWith('## Panel Dynamics')) {
        if (currentThinker) {
          this.thinkerEntries[currentThinker] = currentBlock.join('\n');
          currentThinker = null;
          currentBlock = [];
        }
        inDynamics = true;
        dynamicsLines = [line];
        continue;
      }

      // Detect next ## section after dynamics
      if (inDynamics && line.startsWith('## ') && !line.startsWith('## Panel')) {
        this.panelDynamics = dynamicsLines.join('\n');
        inDynamics = false;
        continue;
      }

      if (inDynamics) {
        dynamicsLines.push(line);
      } else if (currentThinker) {
        // Stop collecting for current thinker at next ### or ## header
        if (line.startsWith('### ') || (line.startsWith('## ') && currentBlock.length > 1)) {
          this.thinkerEntries[currentThinker] = currentBlock.join('\n');
          currentThinker = null;
          currentBlock = [];
        } else {
          currentBlock.push(line);
        }
      }
    }

    // Save last thinker
    if (currentThinker) {
      this.thinkerEntries[currentThinker] = currentBlock.join('\n');
    }
    if (inDynamics) {
      this.panelDynamics = dynamicsLines.join('\n');
    }
  }

  _findThinkerEntry(name) {
    // Direct match
    if (this.thinkerEntries[name]) return this.thinkerEntries[name];
    // Fuzzy match (first/last name)
    for (const [key, val] of Object.entries(this.thinkerEntries)) {
      if (key.includes(name) || name.includes(key)) return val;
    }
    return null;
  }

  buildSystemPrompt(selectedThinkerNames) {
    let thinkerProfiles = '';
    for (const name of selectedThinkerNames) {
      const entry = this._findThinkerEntry(name);
      if (entry) {
        thinkerProfiles += `\n---\n${entry}\n`;
      }
    }

    return `You are simulating a debate among history's greatest thinkers in "The Forum."

SELECTED PANELISTS:
${thinkerProfiles}

PANEL DYNAMICS:
${this.panelDynamics}

RULES:
- Each thinker speaks IN CHARACTER using their documented debate style and voice.
- Thinkers should reference their documented core positions, key references, and philosophical framework.
- Thinkers should engage with, challenge, and build upon each other's arguments.
- Use the "Clashes with" and "Aligns with" relationships when relevant.
- Responses should be substantive (2-5 sentences each), not soundbites.
- Include 3-8 thinker responses per round — not everyone needs to speak every round.
- Suggest 2-3 follow-up questions or provocations for the user.

RESPONSE FORMAT (strict JSON):
{
  "responses": [
    { "thinker": "Full Name", "text": "Their response...", "responds_to": null },
    { "thinker": "Full Name", "text": "Their response...", "responds_to": "Name they're replying to" }
  ],
  "suggested_followups": ["Question 1...", "Question 2...", "Question 3..."]
}

Respond ONLY with valid JSON. No markdown fences, no commentary outside the JSON.`;
  }

  async debate(topic, thinkerIds) {
    if (!this.ensureClient()) {
      return { error: 'No ANTHROPIC_API_KEY set.' };
    }

    // Map IDs to full names
    const THINKER_NAMES = {
      ARENDT: 'Hannah Arendt', AURELIUS: 'Marcus Aurelius', HUME: 'David Hume',
      JUNG: 'Carl Jung', AQUINAS: 'Thomas Aquinas', ARISTOTLE: 'Aristotle',
      DESCARTES: 'René Descartes', HUXLEY: 'Aldous Huxley', FEYNMAN: 'Richard Feynman',
      SOCRATES: 'Socrates', LEONARDO: 'Leonardo da Vinci', GALILEO: 'Galileo Galilei',
      POPPER: 'Karl Popper', LEIBNIZ: 'Gottfried Wilhelm Leibniz', VOLTAIRE: 'Voltaire',
      CLEOPATRA: 'Cleopatra', NIETZSCHE: 'Friedrich Nietzsche', FRANKLIN: 'Benjamin Franklin',
      NEWTON: 'Isaac Newton', MAXWELL: 'James Clerk Maxwell', HILDEGARD: 'Hildegard von Bingen',
      HYPATIA: 'Hypatia', TESLA: 'Nikola Tesla',
    };

    const names = thinkerIds.map(id => THINKER_NAMES[id] || id);
    const systemPrompt = this.buildSystemPrompt(names);
    this._lastSystemPrompt = systemPrompt;

    // Reset conversation for new topic
    this.history = [];
    this.history.push({ role: 'user', content: `Topic for debate: ${topic}` });

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: this.history,
      });

      const rawText = response.content[0].text;
      this.history.push({ role: 'assistant', content: rawText });

      return this._parseResponse(rawText);
    } catch (err) {
      return { error: `API error: ${err.message}` };
    }
  }

  async followUp(message) {
    if (!this.ensureClient()) {
      return { error: 'No ANTHROPIC_API_KEY set.' };
    }

    this.history.push({ role: 'user', content: message });

    // Trim to sliding window
    while (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    try {
      // Rebuild system prompt from last debate context
      const systemPrompt = this._lastSystemPrompt || 'Continue the debate in character. Respond with JSON.';

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: this.history,
      });

      const rawText = response.content[0].text;
      this.history.push({ role: 'assistant', content: rawText });

      return this._parseResponse(rawText);
    } catch (err) {
      return { error: `API error: ${err.message}` };
    }
  }

  _parseResponse(rawText) {
    try {
      let jsonStr = rawText;
      const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1];

      const parsed = JSON.parse(jsonStr.trim());
      return {
        responses: parsed.responses || [],
        suggested_followups: parsed.suggested_followups || [],
      };
    } catch (parseErr) {
      // Fallback: wrap raw text as a single response
      return {
        responses: [{ thinker: 'Forum', text: rawText.slice(0, 1000), responds_to: null }],
        suggested_followups: [],
      };
    }
  }

  stop() {
    this.history = [];
  }
}

module.exports = { ForumService };
