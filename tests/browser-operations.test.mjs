import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { uploadFile, downloadFile, createBrowserOperations, decodeResult } from '../browser/operations.mjs';

async function localFiles(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'moodlia-files-'));
  const input = path.join(directory, 'ficticio áéíóú.txt');
  const output = path.join(directory, 'download.txt');
  const bytes = Buffer.from('Synthetic document: áéíóú ñ 🧪.');
  await fs.writeFile(input, bytes);
  t.after(async () => {
    for (const entry of await fs.readdir(directory)) {
      const target = path.join(directory, entry);
      assert.equal((await fs.lstat(target)).isDirectory(), false, 'A failed download left a temporary directory.');
      await fs.unlink(target);
    }
    await fs.rmdir(directory);
  });
  return { directory, input, output, bytes };
}

test('uploads reject invalid paths, non-files and invalid size limits before touching the browser', async t => {
  const { directory, input, bytes } = await localFiles(t);
  const page = { evaluate() { assert.fail('Browser must not run for invalid local files.'); } };
  await assert.rejects(uploadFile(page, path.join(directory, 'missing')), /ENOENT/);
  await assert.rejects(uploadFile(page, directory), /regular file/);
  for (const maximumUploadBytes of [-1, 0, NaN, Infinity, 2.5]) {
    await assert.rejects(uploadFile(page, input, { maximumUploadBytes }), /positive integer/);
  }
  await assert.rejects(uploadFile(page, input, { maximumUploadBytes: bytes.length - 1 }), /exceeds/);
});

test('uploads retain Unicode filenames, use a real local file and always remove the temporary input', async t => {
  const { input, bytes } = await localFiles(t);
  let removed = 0;
  let selected;
  const uploads = [];
  const page = {
    evaluate: async (_callback, parameters) => {
      if (typeof parameters === 'object') { uploads.push(parameters); return { draft_item_id: 55, filename: parameters.filename }; }
    },
    locator: () => ({
      setInputFiles: async value => { selected = value; assert.deepEqual(await fs.readFile(value), bytes); },
      evaluate: async () => { removed++; },
    }),
  };
  assert.equal((await uploadFile(page, input)).filename, path.basename(input));
  assert.equal(selected, await fs.realpath(input));
  assert.equal(uploads.length, 1);
  assert.equal(removed, 1);
  page.evaluate = async (_callback, parameters) => { if (typeof parameters === 'object') throw new Error('Upload rejected by Moodle'); };
  await assert.rejects(uploadFile(page, input), /Upload rejected by Moodle/);
  assert.equal(removed, 2);
  page.locator = () => ({ setInputFiles: async () => { throw new Error('File chooser failed'); }, evaluate: async () => { removed++; } });
  await assert.rejects(uploadFile(page, input), /File chooser failed/);
  assert.equal(removed, 3);
});

function downloadPage(bytes, { failure, selectionFailure, timeout } = {}) {
  return {
    url: () => 'https://school.test/moodle/course/view.php?id=7',
    evaluate: async () => { if (selectionFailure) throw new Error(selectionFailure); },
    waitForEvent: () => timeout ? Promise.reject(new Error('Download timed out')) : Promise.resolve({
      saveAs: async destination => { await fs.writeFile(destination, bytes); if (failure) throw new Error(failure); },
    }),
  };
}

test('native downloads verify bytes/hash and never overwrite an existing output', async t => {
  const { output, bytes } = await localFiles(t);
  const page = downloadPage(bytes);
  const parameters = { url: 'https://school.test/moodle/pluginfile.php/7/file.txt', output };
  const result = await downloadFile(page, parameters);
  assert.equal(result.sha256, createHash('sha256').update(bytes).digest('hex'));
  assert.equal(result.filesize, bytes.length);
  assert.deepEqual(await fs.readFile(output), bytes);
  await assert.rejects(downloadFile(page, parameters), /EEXIST/);
  assert.deepEqual(await fs.readFile(output), bytes);
});

test('downloads reject external origins, authentication queries, non-file URLs and invalid limits', async t => {
  const { output, bytes } = await localFiles(t);
  const page = downloadPage(bytes);
  page.waitForEvent = () => assert.fail('Rejected downloads must not start.');
  for (const url of [
    'https://other.test/pluginfile.php/7/file.txt', 'http://school.test/pluginfile.php/7/file.txt',
    'https://school.test/moodle/course/view.php?id=7', 'https://user:password@school.test/pluginfile.php/7',
    'https://school.test/pluginfile.php/7?wstoken=synthetic',
    'https://school.test/draftfile.php/7?%73esskey=synthetic',
  ]) await assert.rejects(downloadFile(page, { url, output }));
  for (const maximumDownloadBytes of [0, -1, NaN, 1.5, Infinity]) {
    await assert.rejects(downloadFile(page, { url: 'https://school.test/draftfile.php/7', output, maximumDownloadBytes }), /positive integer/);
  }
  await assert.rejects(downloadFile(page, { url: 'https://school.test/draftfile.php/7' }), /explicit output/);
});

for (const scenario of ['oversized', 'transfer failure', 'selection failure', 'timeout']) {
  test(`downloads remove temporary bytes after ${scenario}`, async t => {
    const { directory, output, bytes } = await localFiles(t);
    const page = downloadPage(bytes, { failure: scenario === 'transfer failure' ? 'Synthetic network failure' : null,
      selectionFailure: scenario === 'selection failure' ? 'Synthetic selection failure' : null, timeout: scenario === 'timeout' });
    await assert.rejects(downloadFile(page, { url: 'https://school.test/draftfile.php/7/file.txt', output,
      maximumDownloadBytes: scenario === 'oversized' ? 1 : 1000 }));
    await assert.rejects(fs.access(output));
    assert.deepEqual(await fs.readdir(directory), ['ficticio áéíóú.txt']);
  });
}

function browserPage() {
  let current = 'about:blank';
  const calls = [];
  const page = {
    url: () => current,
    goto: async url => { current = url; }, bringToFront: async () => {},
    waitForURL: async url => { calls.push(['navigation', url]); },
    webmcp: { tools: async () => [{ name: 'read' }, { name: 'moodlia_open_page' }],
      callTool: async (name, parameters) => { calls.push([name, parameters]); return JSON.stringify({ id: 7 }); } },
  };
  return { page, calls };
}

test('browser operations reject invalid targets and parameters before calling tools', async () => {
  const { page, calls } = browserPage();
  const execute = createBrowserOperations({}, page);
  assert.equal((await execute('status', {})).on_selected_origin, false);
  await assert.rejects(execute('tools', {}), /left the selected/);
  await assert.rejects(execute('open', { url: 'http://school.test' }), /HTTPS/);
  await execute('open', { url: 'https://school.test/moodle' });
  for (const parameters of [{}, { name: 7, arguments: {} }, { name: 'read', arguments: [] }, { name: 'read', arguments: null }]) {
    await assert.rejects(execute('call', parameters), /name and argument object/);
  }
  await assert.rejects(execute('call', { name: 'missing', arguments: {} }), /Tool unavailable/);
  await assert.rejects(execute('evaluate', {}), /Unsupported browser command/);
  assert.equal(calls.length, 0);
  assert.deepEqual(await execute('call', { name: 'read', arguments: { id: 7 } }), { id: 7 });
  assert.deepEqual(decodeResult({ id: 9 }), { id: 9 });
});

test('browser navigation retains structured Moodle failures without attempting navigation', async () => {
  const { page, calls } = browserPage();
  const execute = createBrowserOperations({}, page);
  await execute('open', { url: 'https://school.test/moodle' });
  const denied = { isError: true, content: [{ type: 'text', text: 'Gradebook permission denied.' }] };
  page.webmcp.callTool = async () => denied;
  assert.deepEqual(await execute('call', { name: 'moodlia_open_page', arguments: {} }), denied);
  assert.equal(calls.length, 0);
  page.webmcp.callTool = async () => ({ url: 'https://other.test/' });
  await assert.rejects(execute('call', { name: 'moodlia_open_page', arguments: {} }), /left the selected/);
  page.webmcp.callTool = async () => ({ url: 'https://school.test/moodle/course/view.php?id=99' });
  await execute('call', { name: 'moodlia_open_page', arguments: {} });
  assert.deepEqual(calls, [['navigation', 'https://school.test/moodle/course/view.php?id=99']]);
});

test('browser discovery waits for registration and reports an explicit discovery timeout', async t => {
  const { page } = browserPage();
  const execute = createBrowserOperations({}, page);
  await execute('open', { url: 'https://school.test/moodle' });
  let attempts = 0;
  page.webmcp.tools = async () => ++attempts === 1 ? [] : [{ name: 'read' }];
  assert.equal((await execute('tools', {}))[0].name, 'read');
  assert.equal(attempts, 2);
  let clock = 0;
  t.mock.method(Date, 'now', () => { clock += 20000; return clock; });
  page.webmcp.tools = async () => [];
  await assert.rejects(execute('tools', {}), /No WebMCP tools/);
});
