import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { RagService } from '../src/ragService.js';

const tmpDir = path.join(process.cwd(), 'tests', 'tmp-data');

describe('RagService', () => {
  beforeAll(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'note1.txt'), 'TypeScript is great for large JavaScript applications.');
    await fs.writeFile(path.join(tmpDir, 'note2.md'), 'Ollama serves local LLMs via HTTP on port 11434.');
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('builds an index and retrieves relevant context', async () => {
    const rag = new RagService({ dataDir: tmpDir, topK: 2 });
    const ctx = await rag.retrieveContext('How do I run local LLMs?');

    expect(ctx).toContain('Retrieved Context');
    expect(ctx).toMatch(/11434/);
  });
});
