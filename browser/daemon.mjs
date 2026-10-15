import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { browserDirectory, socketPath } from './protocol.mjs';
import { createBrowserOperations } from './operations.mjs';
import { createAuthenticatedServer } from './server.mjs';

async function launchContext(profile, options) {
  const { chromium } = await import('playwright');
  return chromium.launchPersistentContext(profile, options);
}

export async function startBrowserDaemon({ directory = browserDirectory(), launchBrowserContext = launchContext } = {}) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const lock = await fs.open(path.join(directory, 'daemon.lock'), 'wx', 0o600);
  await lock.writeFile(String(process.pid));
  let context;
  let server;
  let cleanupTask;
  const signalHandler = () => { void cleanup(); };
  function cleanup() {
    if (!cleanupTask) cleanupTask = Promise.resolve().then(async () => {
      await context?.close().catch(() => {});
      server?.close();
      await lock.close();
      await fs.unlink(path.join(directory, 'session.json')).catch(() => {});
      await fs.unlink(path.join(directory, 'daemon.lock')).catch(() => {});
      process.removeListener('SIGTERM', signalHandler);
      process.removeListener('SIGINT', signalHandler);
    });
    return cleanupTask;
  }
  process.on('SIGTERM', signalHandler);
  process.on('SIGINT', signalHandler);
  try {
    context = await launchBrowserContext(path.join(directory, 'profile'), {
      headless: false, channel: 'chromium', args: ['--enable-features=WebMCP', '--enable-blink-features=WebMCP'],
    });
    const page = context.pages()[0] || await context.newPage();
    const execute = createBrowserOperations(context, page);
    context.on('close', () => { void cleanup(); });
    const token = randomBytes(32).toString('hex');
    server = createAuthenticatedServer({ token, execute, cleanup });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(socketPath(directory), resolve);
    });
    if (process.platform !== 'win32') await fs.chmod(socketPath(directory), 0o600);
    await fs.writeFile(path.join(directory, 'session.json'), JSON.stringify({ token, pid: process.pid }), { mode: 0o600 });
    return { context, server, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await startBrowserDaemon();
}
