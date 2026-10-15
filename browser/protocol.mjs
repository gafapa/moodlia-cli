import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { createHash } from 'node:crypto';

export function browserDirectory(environment = process.env) {
  return path.resolve(environment.MOODLIA_BROWSER_HOME || path.join(os.homedir(), '.moodlia', 'browser'));
}

export function socketPath(directory) {
  return process.platform === 'win32'
    ? `\\\\.\\pipe\\moodlia-${createHash('sha256').update(directory).digest('hex').slice(0, 24)}`
    : path.join(directory, 'browser.sock');
}

export async function request(directory, command, parameters = {}, timeout = 130000, maximumBytes = 64 * 1024 * 1024) {
  if (!Number.isSafeInteger(timeout) || timeout < 1 || !Number.isSafeInteger(maximumBytes) || maximumBytes < 1) {
    throw new Error('Browser timeouts and byte limits must be positive integers.');
  }
  let state;
  try { state = JSON.parse(await fs.readFile(path.join(directory, 'session.json'), 'utf8')); }
  catch { throw new Error('No browser session. Run moodlia browser open --url <Moodle URL>.'); }
  if (!state || typeof state.token !== 'string' || !/^[a-f0-9]{64}$/.test(state.token)) {
    throw new Error('Invalid browser session state. Close the browser and open a new session.');
  }
  const frame = `${JSON.stringify({ token: state.token, command, parameters })}\n`;
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath(directory));
    socket.setEncoding('utf8');
    let response = '';
    let received = 0;
    let settled = false;
    let connected = false;
    const timer = setTimeout(() => {
      finish(new Error('Browser request timed out; its outcome may be unknown. Inspect Moodle before repeating a write.'));
    }, timeout);
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (error) reject(error); else resolve(value);
    };
    socket.on('connect', () => { connected = true; socket.write(frame); });
    socket.on('error', error => finish(new Error(connected
      ? 'Browser connection interrupted; its outcome may be unknown.'
      : `Browser session unavailable: ${error.code}. Run moodlia browser open.`)));
    socket.on('data', chunk => {
      received += Buffer.byteLength(chunk);
      if (received > maximumBytes) return finish(new Error('Browser response exceeds the configured byte limit; its outcome may be unknown.'));
      response += chunk;
      const end = response.indexOf('\n');
      if (end < 0) return;
      try {
        const payload = JSON.parse(response.slice(0, end));
        if (!payload || typeof payload.ok !== 'boolean' || (!payload.ok && typeof payload.error !== 'string')) {
          throw new Error('Invalid browser response.');
        }
        finish(payload.ok ? null : new Error(payload.error), payload.result);
      } catch { finish(new Error('Invalid browser response; its outcome may be unknown.')); }
    });
    socket.on('end', () => {
      if (!response.includes('\n')) finish(new Error('Browser session ended; the operation outcome may be unknown.'));
    });
    socket.on('close', () => {
      if (!settled) finish(new Error('Browser session ended; the operation outcome may be unknown.'));
    });
  });
}
