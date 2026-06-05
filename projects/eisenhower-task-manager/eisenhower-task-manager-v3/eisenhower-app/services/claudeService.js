const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    this.client = null;
  }

  ensureClient() {
    if (!this.client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set in .env');
      this.client = new Anthropic({ apiKey });
    }
    return true;
  }

  /**
   * Single-shot Claude API call with system context and user prompt.
   * No conversation history — each call is independent.
   */
  async call({ system, prompt, model = 'claude-opus-4-6', maxTokens = 16000 }) {
    this.ensureClient();

    const messages = [{ role: 'user', content: prompt }];

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      system: system || undefined,
      messages
    });

    // Extract text from response
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      text,
      model: response.model,
      inputTokens: response.usage?.input_tokens || 0,
      outputTokens: response.usage?.output_tokens || 0,
      stopReason: response.stop_reason
    };
  }
}

module.exports = { ClaudeService };
