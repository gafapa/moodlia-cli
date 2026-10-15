import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import test from 'node:test';
import { once } from 'node:events';
import { request, socketPath, browserDirectory } from '../browser/protocol.mjs';
import { createAuthenticatedServer } from '../browser/server.mjs';

const token = 'a'.repeat(64);

async function fixture(t, handler, options) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'moodlia-ipc-'));
  const sockets = new Set();
  const server = options ? createAuthenticatedServer({ token, execute: handler, cleanup: async () => {}, ...options })
    : net.createServer(handler);
  server.on('connection', socket => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(socketPath(directory), resolve); });
  await fs.writeFile(path.join(directory, 'session.json'), JSON.stringify({ token }), { mode: 0o600 });
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => server.close(resolve));
    await fs.unlink(path.join(directory, 'session.json')).catch(() => {});
    await fs.rmdir(directory);
  });
  return { directory, server };
}

async function rawRequest(directory, frame) {
  const socket = net.createConnection(socketPath(directory));
  socket.setEncoding('utf8');
  await once(socket, 'connect');
  socket.end(frame);
  let response = '';
  for await (const chunk of socket) response += chunk;
  return response ? JSON.parse(response) : null;
}

test('browser directory uses an explicit local override', () => {
  assert.equal(browserDirectory({ MOODLIA_BROWSER_HOME: './synthetic-profile' }), path.resolve('synthetic-profile'));
  assert.ok(browserDirectory({}).endsWith(path.join('.moodlia', 'browser')));
});

test('IPC preserves multibyte text split across socket chunks', async t => {
  const { directory } = await fixture(t, socket => socket.once('data', () => {
    const frame = Buffer.from(`${JSON.stringify({ ok: true, result: { name: 'Corrección áéíóú ñ 🧪' } })}\n`);
    const split = frame.indexOf(Buffer.from('ó')) + 1;
    socket.write(frame.subarray(0, split));
    setTimeout(() => socket.end(frame.subarray(split)), 5);
  }));
  assert.deepEqual(await request(directory, 'status'), { name: 'Corrección áéíóú ñ 🧪' });
});

for (const [name, response, expected] of [
  ['malformed JSON', 'private-data-must-not-leak\n', /Invalid browser response/],
  ['invalid response envelope', '{"result":7}\n', /Invalid browser response/],
  ['invalid error envelope', '{"ok":false,"error":{}}\n', /Invalid browser response/],
  ['truncated response', '{"ok":true', /outcome may be unknown/],
  ['empty response', '', /outcome may be unknown/],
  ['structured remote failure', '{"ok":false,"error":"Permission denied"}\n', /Permission denied/],
]) {
  test(`IPC handles ${name} without retries or leaking response bytes`, async t => {
    let calls = 0;
    const { directory } = await fixture(t, socket => socket.once('data', () => { calls++; socket.end(response); }));
    await assert.rejects(request(directory, 'call'), error => {
      assert.match(error.message, expected);
      assert.equal(error.message.includes('private-data-must-not-leak'), false);
      return true;
    });
    assert.equal(calls, 1);
  });
}

test('IPC enforces response byte limits and a bounded timeout', async t => {
  const { directory } = await fixture(t, socket => socket.on('data', () => socket.write('éééé')));
  await assert.rejects(request(directory, 'status', {}, 1000, 4), /byte limit.*outcome may be unknown/);
  await assert.rejects(request(directory, 'status', {}, 20, 100), /timed out.*outcome may be unknown/);
});

test('IPC rejects invalid limits and malformed session credentials before connecting', async t => {
  const { directory } = await fixture(t, () => {});
  for (const limit of [0, -1, NaN, 1.5, Infinity]) {
    await assert.rejects(request(directory, 'status', {}, limit), /positive integers/);
    await assert.rejects(request(directory, 'status', {}, 10, limit), /positive integers/);
  }
  await fs.writeFile(path.join(directory, 'session.json'), '{"token":"invalid-private-token"}');
  await assert.rejects(request(directory, 'status'), /Invalid browser session state/);
  await fs.writeFile(path.join(directory, 'session.json'), 'invalid JSON');
  await assert.rejects(request(directory, 'status'), /No browser session/);
  await fs.unlink(path.join(directory, 'session.json'));
  await assert.rejects(request(directory, 'status'), /No browser session/);
});

test('IPC rejects unserializable input without crashing or opening a socket', async t => {
  let connections = 0;
  const { directory } = await fixture(t, () => { connections++; });
  const parameters = {};
  parameters.self = parameters;
  await assert.rejects(request(directory, 'call', parameters), TypeError);
  assert.equal(connections, 0);
});

for (const [name, payload, expected] of [
  ['missing token', { command: 'status' }, /Unauthorized/],
  ['wrong token', { token: 'b'.repeat(64), command: 'status' }, /Unauthorized/],
  ['multibyte token', { token: 'é'.repeat(64), command: 'status' }, /Unauthorized/],
  ['null request', null, /Unauthorized/],
  ['unsupported command', { token, command: 'evaluate' }, /Unsupported/],
  ['array parameters', { token, command: 'call', parameters: [] }, /must be an object/],
  ['null parameters', { token, command: 'call', parameters: null }, /must be an object/],
]) {
  test(`IPC server rejects ${name} before executing any browser action`, async t => {
    let calls = 0;
    const { directory } = await fixture(t, async () => { calls++; }, {});
    const response = await rawRequest(directory, `${JSON.stringify(payload)}\n`);
    assert.equal(response.ok, false);
    assert.match(response.error, expected);
    assert.equal(calls, 0);
  });
}

test('IPC server rejects malformed JSON and oversized UTF-8 frames', async t => {
  let calls = 0;
  const { directory } = await fixture(t, async () => { calls++; }, { maximumRequestBytes: 180 });
  assert.match((await rawRequest(directory, 'malformed-secret-data\n')).error, /Invalid browser request JSON/);
  const response = await rawRequest(directory, `${JSON.stringify({ token, command: 'call', parameters: { text: '🧪'.repeat(40) } })}\n`);
  assert.match(response.error, /byte limit.*no tool was invoked/);
  assert.equal(calls, 0);
});

test('IPC serializes concurrent actions and recovers after an operation error', async t => {
  const observed = [];
  const { directory } = await fixture(t, async (_command, { id }) => {
    observed.push(`start-${id}`);
    await new Promise(resolve => setTimeout(resolve, 3));
    observed.push(`end-${id}`);
    if (id === 2) throw new Error('Synthetic failure');
    return { id };
  }, {});
  const results = await Promise.allSettled([1, 2, 3].map(id => request(directory, 'call', { id })));
  assert.equal(observed.length, 6);
  for (let index = 0; index < observed.length; index += 2) {
    assert.equal(observed[index + 1], observed[index].replace('start-', 'end-'));
  }
  assert.equal(results[0].status, 'fulfilled');
  assert.equal(results[1].status, 'rejected');
  assert.deepEqual(results[2].value, { id: 3 });
});

test('IPC drops a disconnected queued mutation before invoking it', async t => {
  let release;
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const invoked = [];
  const { directory, server } = await fixture(t, async (_command, { id }) => {
    invoked.push(id);
    if (id === 1) { entered(); await gate; }
    return { id };
  }, {});
  const first = request(directory, 'call', { id: 1 });
  await started;
  const connected = once(server, 'connection');
  const socket = net.createConnection(socketPath(directory));
  const clientConnected = once(socket, 'connect');
  const [accepted] = await connected;
  await clientConnected;
  socket.write(`${JSON.stringify({ token, command: 'call', parameters: { id: 2 } })}\n`);
  await once(accepted, 'data');
  const closed = once(accepted, 'close');
  socket.destroy();
  await closed;
  release();
  await first;
  await request(directory, 'status', { id: 3 });
  assert.deepEqual(invoked, [1, 3]);
});

test('IPC authenticated close runs cleanup once and rejects arbitrary code commands', async t => {
  let cleaned = 0;
  const { directory } = await fixture(t, async () => ({ running: true }), { cleanup: async () => { cleaned++; } });
  assert.deepEqual(await request(directory, 'close'), { closed: true });
  assert.equal(cleaned, 1);
  await assert.rejects(request(directory, 'evaluate', { code: 'process.exit()' }), /Unsupported/);
  assert.equal(cleaned, 1);
});

test('IPC idle connections are closed without invoking a tool', async t => {
  let calls = 0;
  const { directory } = await fixture(t, async () => { calls++; }, { idleTimeout: 15 });
  const socket = net.createConnection(socketPath(directory));
  await once(socket, 'connect');
  socket.write('{');
  await once(socket, 'close');
  assert.equal(calls, 0);
});
