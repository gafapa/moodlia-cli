import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { openBrowser } from '../browser/index.mjs';
import { socketPath } from '../browser/protocol.mjs';
import { createAuthenticatedServer } from '../browser/server.mjs';

async function directoryFixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'moodlia-launch-'));
  const token = 'a'.repeat(64);
  let server;
  let startTask;
  const execute = async (command, parameters) => {
    if (command === 'open') return { url: parameters.url };
    return { running: true };
  };
  async function startServer() {
    server = createAuthenticatedServer({ token, execute, cleanup: async () => {} });
    await new Promise(resolve => server.listen(socketPath(directory), resolve));
    await fs.writeFile(path.join(directory, 'session.json'), JSON.stringify({ token }));
  }
  const spawnProcess = (...argumentsList) => {
    assert.equal(argumentsList[2].detached, true);
    assert.equal(argumentsList[2].windowsHide, true);
    assert.equal(argumentsList[2].env.MOODLIA_BROWSER_HOME, directory);
    startTask = startServer();
    return { on() {}, unref() {} };
  };
  t.after(async () => {
    await startTask;
    if (server) await new Promise(resolve => server.close(resolve));
    for (const name of await fs.readdir(directory)) await fs.unlink(path.join(directory, name));
    await fs.rmdir(directory);
  });
  return { directory, spawnProcess, startServer };
}

test('browser launcher reuses an existing session without starting a process', async t => {
  const fixture = await directoryFixture(t);
  await fixture.startServer();
  const result = await openBrowser('https://school.test/moodle', fixture.directory, {
    spawnProcess: () => assert.fail('A running session must be reused.'),
  });
  assert.equal(result.url, 'https://school.test/moodle');
});

test('browser launcher creates a detached local session and waits until it is ready', async t => {
  const fixture = await directoryFixture(t);
  const result = await openBrowser('https://school.test/moodle', fixture.directory, {
    spawnProcess: fixture.spawnProcess, startupTimeout: 1000, pollInterval: 5,
  });
  assert.equal(result.url, 'https://school.test/moodle');
});

test('browser launcher recovers a dead PID without reusing its stale authentication secret', async t => {
  const fixture = await directoryFixture(t);
  await fs.writeFile(path.join(fixture.directory, 'daemon.lock'), '2147483647');
  await fs.writeFile(path.join(fixture.directory, 'session.json'), JSON.stringify({ token: 'b'.repeat(64) }));
  if (process.platform !== 'win32') await fs.writeFile(path.join(fixture.directory, 'browser.sock'), 'stale socket marker');
  const result = await openBrowser('https://school.test/moodle', fixture.directory, {
    spawnProcess: fixture.spawnProcess, startupTimeout: 1000, pollInterval: 5,
  });
  assert.equal(result.url, 'https://school.test/moodle');
  assert.equal(JSON.parse(await fs.readFile(path.join(fixture.directory, 'session.json'))).token, 'a'.repeat(64));
});

test('browser launcher refuses a corrupt lock and never kills an unrelated process', async t => {
  const fixture = await directoryFixture(t);
  await fs.writeFile(path.join(fixture.directory, 'daemon.lock'), 'invalid-pid');
  await assert.rejects(openBrowser('https://school.test', fixture.directory), /Invalid browser lock/);
  await fs.writeFile(path.join(fixture.directory, 'daemon.lock'), String(process.pid));
  await assert.rejects(openBrowser('https://school.test', fixture.directory, {
    startupTimeout: 20, pollInterval: 5, spawnProcess: () => assert.fail('An occupied live PID must not be replaced.'),
  }), /Browser did not start/);
  assert.doesNotThrow(() => process.kill(process.pid, 0));
});

test('browser launcher reports missing startup and validates URL/timeouts before spawning', async t => {
  const fixture = await directoryFixture(t);
  await assert.rejects(openBrowser('http://remote.test', fixture.directory), /HTTPS/);
  await assert.rejects(openBrowser('https://school.test', fixture.directory, { startupTimeout: 0 }), /positive integers/);
  await assert.rejects(openBrowser('https://school.test', fixture.directory, {
    startupTimeout: 20, pollInterval: 5, spawnProcess: () => ({ on() {}, unref() {} }),
  }), /startup.log/);
});
