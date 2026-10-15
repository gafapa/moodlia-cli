import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { allowedUrl, assertSameOrigin, decodeResult, createBrowserOperations } from '../browser/operations.mjs';
import { socketPath } from '../browser/protocol.mjs';
import { runMoodliaCli } from '../cli/runner.mjs';
import { browserCommand, createWebMcpClient } from '../cli/browser-component.mjs';

test('browser URLs reject credentials, remote HTTP, and non-web protocols', () => {
  for (const value of ['file:///C:/secret', 'http://school.test', 'https://user:password@school.test', 'javascript:alert(1)']) {
    assert.throws(() => allowedUrl(value));
  }
  assert.equal(allowedUrl('http://127.0.0.1:8383/moodle').hostname, '127.0.0.1');
  assert.equal(allowedUrl('https://school.test/moodle').pathname, '/moodle');
  assert.throws(() => assertSameOrigin('https://other.test', 'https://school.test'));
  assert.deepEqual(decodeResult('{"id":7}'), { id: 7 });
});

test('browser writes are not retried and cross-origin manual navigation blocks execution', async () => {
  let current = 'about:blank';
  let calls = 0;
  const page = {
    goto: async url => { current = url; }, bringToFront: async () => {}, url: () => current,
    webmcp: { tools: async () => [{ name: 'write' }], callTool: async () => { calls++; throw new Error('Interrupted'); } },
  };
  const execute = createBrowserOperations({}, page);
  await execute('open', { url: 'https://school.test' });
  await assert.rejects(execute('call', { name: 'write', arguments: {} }), /Interrupted/);
  assert.equal(calls, 1);
  current = 'https://external.test/';
  await assert.rejects(execute('call', { name: 'write', arguments: {} }), /left the selected/);
  assert.equal(calls, 1);
});

test('the base CLI rejects unsupported browser transports before attempting REST', async () => {
  await assert.rejects(runMoodliaCli(['get-current-user', '--transport', 'bad']), /rest or webmcp/);
  await assert.rejects(runMoodliaCli(['core', 'get-current-user', '--transport', 'webmcp']), /Core uses REST/);
  await assert.rejects(runMoodliaCli(['capabilities', '--transport', 'webmcp']), /browser tools/);
});

test('browser command validation rejects malformed arguments before loading an optional component', async () => {
  for (const argumentsList of [
    ['unknown'], ['status', '--url', 'https://school.test'], ['tools', 'extra'], ['install', '--token', 'synthetic'],
    ['open'], ['open', '--url', 'https://school.test', '--url', 'https://other.test'],
    ['call', '--arguments', '{}'], ['call', 'read', 'extra', '--arguments', '{}'],
    ['call', 'read', '--arguments', '[]'], ['call', 'read', '--arguments', 'null'],
    ['download', '--url', 'https://school.test/pluginfile.php/7'],
    ['download', '--url', 'https://school.test/pluginfile.php/7', '--output', 'file.txt', '--max-download-bytes', '-1'],
  ]) await assert.rejects(browserCommand(argumentsList), error => error.code === 'invalid_parameters');
  assert.ok((await browserCommand(['open', '--help'])).usage.length > 0);
});

test('the base CLI needs no Playwright and reports a missing optional component', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'moodlia-browser-missing-'));
  const previous = process.env.MOODLIA_BROWSER_HOME;
  process.env.MOODLIA_BROWSER_HOME = directory;
  try {
    await assert.rejects(runMoodliaCli(['get-current-user', '--transport', 'webmcp']), /browser install/);
    assert.equal(socketPath(directory), socketPath(directory));
    assert.notEqual(socketPath(directory), socketPath(`${directory}-other`));
  } finally {
    if (previous === undefined) delete process.env.MOODLIA_BROWSER_HOME;
    else process.env.MOODLIA_BROWSER_HOME = previous;
    await fs.rmdir(directory);
  }
});

test('optional component commands preserve arguments and uninstall only the component', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'moodlia-browser-contract-'));
  const previous = process.env.MOODLIA_BROWSER_HOME;
  process.env.MOODLIA_BROWSER_HOME = directory;
  const entry = path.join(directory, 'component', 'node_modules', 'moodlia-browser');
  await fs.mkdir(entry, { recursive: true });
  await fs.mkdir(path.join(directory, 'profile'));
  await fs.writeFile(path.join(entry, 'index.mjs'), `
    export const openBrowser = async (url, directory) => ({ url, directory });
    export const request = async (directory, command, parameters) => ({ command, parameters });
  `);
  try {
    assert.ok((await browserCommand(['help'])).usage.some(value => value.includes('download')));
    assert.equal((await browserCommand(['status'])).command, 'status');
    assert.equal((await browserCommand(['tools'])).command, 'tools');
    assert.equal((await browserCommand(['close'])).command, 'close');
    assert.equal((await browserCommand(['open', '--url=https://school.test'])).url, 'https://school.test');
    const called = await browserCommand(['call', 'get_course_contents', '--arguments', '{"course_id":99}']);
    assert.deepEqual(called.parameters, { name: 'get_course_contents', arguments: { course_id: 99 } });
    const downloaded = await browserCommand(['download', '--url', 'https://school.test/pluginfile.php/7', '--output', 'example.pdf', '--max-download-bytes=123']);
    assert.equal(downloaded.parameters.maximumDownloadBytes, 123);
    await assert.rejects(browserCommand(['call', 'get_current_user', '--arguments', 'invalid']), SyntaxError);
    await assert.rejects(browserCommand(['open', '--url']), /is required/);
    await assert.rejects(browserCommand(['unsupported']), /Unknown browser command/);
    assert.equal((await browserCommand(['uninstall'])).profile_preserved, true);
    await fs.access(path.join(directory, 'profile'));
    await assert.rejects(fs.access(path.join(directory, 'component')));
  } finally {
    if (previous === undefined) delete process.env.MOODLIA_BROWSER_HOME;
    else process.env.MOODLIA_BROWSER_HOME = previous;
    await fs.rmdir(path.join(directory, 'profile'));
    await fs.rmdir(directory);
  }
});

test('WebMCP client validates typed input, response shape, byte limits and uncertain write outcomes', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'moodlia-browser-client-'));
  const previous = process.env.MOODLIA_BROWSER_HOME;
  process.env.MOODLIA_BROWSER_HOME = directory;
  const entry = path.join(directory, 'component', 'node_modules', 'moodlia-browser');
  await fs.mkdir(entry, { recursive: true });
  await fs.writeFile(path.join(entry, 'index.mjs'), `
    export async function request(directory, command, parameters = {}) {
      if (command === 'close') return {closed:true};
      if (parameters.name === 'write') throw new Error('Tool invocation failed');
      if (parameters.arguments?.id === 9) return {isError:true,content:[{type:'text',text:'Permission denied.'}]};
      if (parameters.arguments?.id === 10) return {isError:true,content:{invalid:true}};
      return command === 'upload' ? {draft_item_id:543} : {id:parameters.arguments.id};
    }
  `);
  const contract = { operations: [
    { name: 'read', type: 'read', parameters: { id: {type:'integer',required:true} }, returns: { id: 'integer' } },
    { name: 'write', type: 'write', parameters: {}, returns: {} },
  ] };
  try {
    const client = await createWebMcpClient({ contract });
    assert.deepEqual(await client.callOperation('read', { id: '7' }), { id: 7 });
    assert.deepEqual(await client.uploadDraftFile('fictional.txt'), { draft_item_id: 543 });
    await assert.rejects(client.callOperation('read', {}), /Missing required/);
    await assert.rejects(client.callOperation('read', { id: 9 }), error => error.code === 'moodle_error');
    await assert.rejects(client.callOperation('read', { id: 10 }), error => error.code === 'moodle_error');
    await assert.rejects(client.callOperation('missing', {}), /Unknown operation/);
    await assert.rejects(client.callOperation('write', {}), error => error.code === 'unknown_outcome');
    await assert.rejects(createWebMcpClient({ contract, maximumResponseBytes: NaN }), /positive integers/);
    const invalidContract = { operations: [{ ...contract.operations[0], returns: { id: 'string' } }] };
    await assert.rejects((await createWebMcpClient({ contract: invalidContract })).callOperation('read', { id: 7 }), /must be a string/);
    assert.deepEqual(await (await createWebMcpClient({ contract: invalidContract, validateResponses: false })).callOperation('read', {id:7}), {id:7});
    await browserCommand(['uninstall']);
  } finally {
    if (previous === undefined) delete process.env.MOODLIA_BROWSER_HOME;
    else process.env.MOODLIA_BROWSER_HOME = previous;
    await fs.rmdir(directory);
  }
});
