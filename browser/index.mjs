import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { browserDirectory, request } from './protocol.mjs';
import { allowedUrl } from './operations.mjs';

export { browserDirectory, request } from './protocol.mjs';

export async function openBrowser(url, directory = browserDirectory(), {
  spawnProcess = spawn, startupTimeout = 30000, pollInterval = 200,
} = {}) {
  if (!Number.isSafeInteger(startupTimeout) || startupTimeout < 1 || !Number.isSafeInteger(pollInterval) || pollInterval < 1) {
    throw new Error('Browser startup timeouts must be positive integers.');
  }
  allowedUrl(url);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  try { return await request(directory, 'open', { url }); }
  catch (error) {
    if (!/No browser session|Browser session unavailable/.test(error.message)) throw error;
  }
  const lockPath = path.join(directory, 'daemon.lock');
  let locked = false;
  try {
    const pid = Number(await fs.readFile(lockPath, 'utf8'));
    if (!Number.isSafeInteger(pid) || pid < 1) throw new Error('Invalid browser lock.');
    try { process.kill(pid, 0); locked = true; }
    catch (error) {
      if (error.code !== 'ESRCH') throw error;
      await fs.unlink(lockPath);
      await fs.unlink(path.join(directory, 'session.json')).catch(() => {});
      if (process.platform !== 'win32') await fs.unlink(path.join(directory, 'browser.sock')).catch(() => {});
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!locked) {
    const log = await fs.open(path.join(directory, 'startup.log'), 'w', 0o600);
    try {
      const child = spawnProcess(process.execPath, [fileURLToPath(new URL('./daemon.mjs', import.meta.url))], {
        detached: true, windowsHide: true, stdio: ['ignore', log.fd, log.fd],
        env: { ...process.env, MOODLIA_BROWSER_HOME: directory },
      });
      child.on('error', () => {});
      child.unref();
    } finally { await log.close(); }
  }
  const deadline = Date.now() + startupTimeout;
  while (Date.now() < deadline) {
    try { return await request(directory, 'open', { url }); }
    catch (error) {
      if (!/No browser session|Browser session unavailable/.test(error.message)) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  throw new Error(`Browser did not start. Install its Chromium with moodlia browser install. Diagnostic: ${path.join(directory, 'startup.log')}`);
}
