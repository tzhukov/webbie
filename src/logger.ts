import fs from 'node:fs/promises';
import path from 'node:path';

const logDir = path.resolve(process.cwd(), 'logs');
const logFile = path.join(logDir, 'app.log');

async function ensureLogDir(): Promise<void> {
  await fs.mkdir(logDir, { recursive: true });
}

function timestamp(): string {
  return new Date().toISOString();
}

export async function logLine(message: string): Promise<void> {
  try {
    await ensureLogDir();
    const line = `[${timestamp()}] ${message}\n`;
    await fs.appendFile(logFile, line, 'utf8');
  } catch (err) {
    // Last resort: log to stderr if file logging fails
    console.error('log write failed', err);
  }
}
