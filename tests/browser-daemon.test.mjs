import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { startBrowserDaemon } from '../browser/daemon.mjs';
import { request } from '../browser/protocol.mjs';

async function directoryFixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'moodlia-daemon-'));
  t.after(async () => {
    for (const entry of await fs.readdir(directory)) await fs.unlink(path.join(directory, entry));
    await fs.rmdir(directory);
  });
  return directory;
}

function browserFixture({ existingPage = true } = {}) {
  const context = new EventEmitter();
  let url = 'about:blank';
  let closed = 0;
  const page = { url: () => url, goto: async target => { url = target; }, bringToFront: async () => {} };
  context.pages = () => existingPage ? [page] : [];
  context.newPage = async () => page;
  context.close = async () => { closed++; if (closed === 1) context.emit('close'); };
  return { context, closed: () => closed };
}

test('daemon owns a private authenticated session and cleans its lock after a graceful close', async t => {
  const directory = await directoryFixture(t);
  const fixture = browserFixture();
  const listeners = process.listenerCount('SIGTERM');
  const daemon = await startBrowserDaemon({ directory, launchBrowserContext: async (profile, options) => {
    assert.equal(profile, path.join(directory, 'profile'));
    assert.equal(options.headless, false);
    assert.ok(options.args.includes('--enable-features=WebMCP'));
    return fixture.context;
  } });
  const state = JSON.parse(await fs.readFile(path.join(directory, 'session.json')));
  assert.match(state.token, /^[a-f0-9]{64}$/);
  assert.equal(state.pid, process.pid);
  await request(directory, 'open', { url: 'https://school.test/moodle' });
  assert.equal((await request(directory, 'status')).on_selected_origin, true);
  assert.deepEqual(await request(directory, 'close'), { closed: true });
  await daemon.cleanup();
  assert.equal(fixture.closed(), 1);
  assert.equal(process.listenerCount('SIGTERM'), listeners);
  assert.deepEqual(await fs.readdir(directory), []);
});

test('daemon creates a page when needed and cleans up after a manually closed browser', async t => {
  const directory = await directoryFixture(t);
  const fixture = browserFixture({ existingPage: false });
  const daemon = await startBrowserDaemon({ directory, launchBrowserContext: async () => fixture.context });
  await fixture.context.close();
  await daemon.cleanup();
  assert.deepEqual(await fs.readdir(directory), []);
});

test('failed Chromium startup releases the owned lock and signal listeners', async t => {
  const directory = await directoryFixture(t);
  const listeners = process.listenerCount('SIGINT');
  await assert.rejects(startBrowserDaemon({ directory, launchBrowserContext: async () => { throw new Error('Chromium unavailable'); } }), /Chromium unavailable/);
  assert.equal(process.listenerCount('SIGINT'), listeners);
  assert.deepEqual(await fs.readdir(directory), []);
});

test('a second daemon cannot replace an existing process lock or authentication state', async t => {
  const directory = await directoryFixture(t);
  await fs.writeFile(path.join(directory, 'daemon.lock'), 'occupied');
  await assert.rejects(startBrowserDaemon({ directory, launchBrowserContext: async () => assert.fail('Must not launch twice.') }), /EEXIST/);
  assert.equal(await fs.readFile(path.join(directory, 'daemon.lock'), 'utf8'), 'occupied');
});
