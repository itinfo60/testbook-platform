// server/src/modules/ai/llm.service.js
// Wrapper for LLM provider (OpenAI or Anthropic) with streaming support.

import { Readable } from 'stream';

// Load config from env
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai'; // 'openai' or 'anthropic'
const LLM_API_KEY = process.env.LLM_API_KEY || 'test-key';

/**
 * Generate quiz JSON from a prompt.
 * Returns a Readable stream that yields JSON chunks (stringified objects).
 */
async function generateQuiz(prompt) {
  if (LLM_PROVIDER === 'openai') {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        stream: true,
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI error: ${err}`);
    }
    // OpenAI streams SSE lines. Convert to a Node Readable.
    const stream = new Readable({ read() {} });
    response.body.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const json = line.replace('data:', '').trim();
          if (json === '[DONE]') {
            stream.push(null);
            break;
          }
          try {
            const data = JSON.parse(json);
            const content = data.choices[0].delta?.content;
            if (content) {
              stream.push(content);
            }
          } catch (_) {}
        }
      }
    });
    response.body.on('end', () => stream.push(null));
    return stream;
  }
  // Anthropic implementation (simplified)
  if (LLM_PROVIDER === 'anthropic') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LLM_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        temperature: 0.7,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic error: ${err}`);
    }
    const stream = new Readable({ read() {} });
    response.body.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const json = line.replace('data:', '').trim();
          if (json === '[DONE]') {
            stream.push(null);
            break;
          }
          try {
            const data = JSON.parse(json);
            const content = data.delta?.text;
            if (content) {
              stream.push(content);
            }
          } catch (_) {}
        }
      }
    });
    response.body.on('end', () => stream.push(null));
    return stream;
  }
  throw new Error('Unsupported LLM provider');
}

export { generateQuiz };
