import { describe, expect, test } from 'vitest';
import { ChatService } from '../src/chatService.js';

const host = process.env.OLLAMA_HOST || 'http://10.0.0.227:11434';
const model = process.env.OLLAMA_MODEL || 'qwen3:4b';

describe('ChatService integration', () => {
  test('responds to a simple prompt', async () => {
    const chat = new ChatService({ host, model });
    const response = await chat.sendMessage('Say hello in one short sentence.');

    expect(typeof response).toBe('string');
    expect(response.trim().length).toBeGreaterThan(0);
  }, 90_000);
});
