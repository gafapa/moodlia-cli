import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  MoodleClient, RestTransport, createMoodleClient, createMoodleRestClient,
  encodeFileForUpload, loadEnvFile, resolveMoodleUrl, uploadFileToMoodleDraft,
  uploadDataToMoodleDraft, downloadFileFromMoodle, downloadFileFromMoodleToPath,
  buildContractParameters, validateContractResponse
} from '../client/moodle-rest-client.mjs';

const baseUrl = 'https://moodle.test/learning';
const token = 'private-synthetic-token';
const options = { baseUrl, token };
const contract = { restPrefix: 'local_moodlia', operations: [{ name: 'read', parameters: {}, returns: { ok: 'boolean' }, limits: { maximumResponseBytes: 128 } }] };
const jsonResponse = (value, status = 200) => new Response(JSON.stringify(value), { status });

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'moodlia-client-failures-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('environment files preserve existing settings and parse only valid assignments', (t) => {
  const directory = temporaryDirectory(t);
  const file = path.join(directory, '.env');
  const names = ['MOODLIA_ENV_TEST_NEW', 'MOODLIA_ENV_TEST_EXISTING'];
  const previous = names.map((name) => process.env[name]);
  t.after(() => names.forEach((name, index) => {
    if (previous[index] === undefined) delete process.env[name];
    else process.env[name] = previous[index];
  }));
  delete process.env[names[0]];
  process.env[names[1]] = 'preserved';
  fs.writeFileSync(file, `# comment\r\n\r\ninvalid\r\n = ignored\r\n${names[0]} = a=b\r\n${names[1]} = overwritten\r\n`);
  loadEnvFile(file);
  loadEnvFile(path.join(directory, 'missing'));
  assert.equal(process.env[names[0]], 'a=b');
  assert.equal(process.env[names[1]], 'preserved');
  assert.throws(() => encodeFileForUpload(''), { code: 'invalid_parameters' });
  assert.throws(() => encodeFileForUpload(path.join(directory, 'missing')), { code: 'invalid_parameters' });
  assert.throws(() => resolveMoodleUrl(baseUrl, ''), { code: 'invalid_parameters' });
});

test('transport and client constructors reject invalid capabilities and configuration', () => {
  for (const invalid of [{ fetchImplementation: null }, { timeoutMs: -1 }, { uploadTimeoutMs: Infinity }]) {
    assert.throws(() => new RestTransport({ ...options, ...invalid }), { code: 'invalid_parameters' });
  }
  assert.throws(() => new MoodleClient(), { code: 'invalid_parameters' });
  assert.throws(() => new MoodleClient({ contract, transport: {} }), { code: 'invalid_parameters' });
  assert.ok(createMoodleRestClient(options) instanceof RestTransport);
});

for (const [errorcode, exception, expected] of [
  ['invalidparameter', 'invalid_parameter_exception', 'invalid_parameters'],
  ['nopermissions', 'required_capability_exception', 'missing_capability'],
  ['itemnotfound', 'moodle_exception', 'not_found'],
  ['codingerror', 'coding_exception', 'internal_error'],
  ['unknown', 'moodle_exception', 'moodle_error']
]) {
  test(`REST maps ${errorcode} and redacts sensitive diagnostics`, async () => {
    const transport = new RestTransport({ ...options, fetchImplementation: async () => jsonResponse({ errorcode, exception, message: `Failure ${token}`, debuginfo: `Diagnostic ${token}` }) });
    await assert.rejects(transport.callFunction('local_moodlia_read'), (error) => {
      assert.equal(error.code, expected);
      assert.equal(JSON.stringify(error).includes(token), false);
      if (expected === 'internal_error') assert.equal(error.details.moodle_debuginfo, undefined);
      else assert.ok(error.details.moodle_debuginfo);
      return true;
    });
  });
}

test('REST rejects failed HTTP and failed requests without leaking token or retrying', async () => {
  let calls = 0;
  const transport = new RestTransport({ ...options, fetchImplementation: async () => { calls++; throw new Error(`Offline ${token}`); } });
  await assert.rejects(transport.callFunction('write'), (error) => error.code === 'transport_error' && !error.message.includes(token));
  assert.equal(calls, 1);
  const unavailable = new RestTransport({ ...options, fetchImplementation: async () => jsonResponse({}, 503) });
  await assert.rejects(unavailable.callFunction('read'), (error) => error.code === 'transport_error' && error.details.http_status === 503);
});

test('client delegates optional capabilities, binds proxy methods and preserves response limits', async () => {
  const calls = [];
  const transport = Object.fromEntries(['callFunction', 'uploadDraftFile', 'uploadDraftData', 'downloadFile', 'downloadFileToPath'].map((name) => [name, async (...args) => { calls.push([name, ...args]); return name === 'callFunction' ? { ok: true } : name; }]));
  const client = createMoodleClient({ contract, transport });
  assert.deepEqual(client.operationNames(), ['read']);
  assert.equal(client[Symbol.toStringTag], undefined);
  assert.equal(client.unknown, undefined);
  const { read } = client;
  assert.deepEqual(await read(), { ok: true });
  assert.deepEqual(calls.at(-1), ['callFunction', 'local_moodlia_read', {}, { maximumResponseBytes: 128 }]);
  assert.deepEqual(await client.callFunction('custom', { id: 7 }), { ok: true });
  for (const name of ['uploadDraftFile', 'uploadDraftData', 'downloadFile']) {
    assert.equal(await client[name]('source', { sample: true }), name);
    assert.deepEqual(calls.at(-1), [name, 'source', { sample: true }]);
  }
  assert.equal(await client.downloadFileToPath('source', 'destination', { sample: true }), 'downloadFileToPath');
  assert.deepEqual(calls.at(-1), ['downloadFileToPath', 'source', 'destination', { sample: true }]);
  await assert.rejects(client.call('unknown'), { code: 'invalid_parameters' });
  const limited = new MoodleClient({ contract, transport: { callFunction: async () => ({}) } });
  for (const name of ['uploadDraftFile', 'uploadDraftData', 'downloadFile', 'downloadFileToPath']) {
    await assert.rejects(limited[name]('source'), { code: name === 'downloadFileToPath' ? 'unsupported_operation' : 'invalid_parameters' });
  }
});

test('draft upload configuration and malformed results fail closed', async (t) => {
  const directory = temporaryDirectory(t);
  const filePath = path.join(directory, 'data.bin');
  fs.writeFileSync(filePath, 'abc');
  for (const invalid of [{ baseUrl: '' }, { fetchImplementation: null }, { timeoutMs: -1 }, { itemId: -1 }]) {
    await assert.rejects(uploadFileToMoodleDraft({ ...options, filePath, ...invalid }), { code: 'invalid_parameters' });
  }
  for (const [payload, status, expected] of [
    [{}, 503, 'transport_error'],
    [{ errorcode: 'nopermissions', exception: 'required_capability_exception', message: 'Denied' }, 200, 'missing_capability'],
    [[], 200, 'file_upload_failed'], [[{ itemid: 0 }], 200, 'file_upload_failed'],
    [[{ error: 'Quota exceeded', errortype: 'quota' }], 200, 'file_upload_failed']
  ]) {
    await assert.rejects(uploadFileToMoodleDraft({ ...options, filePath, fetchImplementation: async () => jsonResponse(payload, status) }), { code: expected });
  }
  await assert.rejects(uploadDataToMoodleDraft({ ...options, data: 'bad' }), { code: 'invalid_parameters' });
  await assert.rejects(uploadDataToMoodleDraft({ ...options, data: new Uint8Array([1]), filename: 'data.bin', fetchImplementation: async () => jsonResponse({ message: token }, 503) }), (error) => error.code === 'file_upload_failed' && !error.message.includes(token));
});

test('REST transport transfers synthetic draft bytes and downloads through protected endpoints', async (t) => {
  const directory = temporaryDirectory(t);
  const filePath = path.join(directory, 'data.bin');
  fs.writeFileSync(filePath, 'abc');
  const transport = new RestTransport({ ...options, allowedFileRoots: [directory], fetchImplementation: async (url, init) => {
    if (String(url).includes('/upload.php')) return jsonResponse([{ itemid: 71 }]);
    assert.equal(new URL(url).pathname, '/learning/webservice/pluginfile.php/1/test.bin');
    assert.equal(new URL(url).searchParams.get('token'), token);
    assert.equal(init.redirect, 'error');
    return new Response('abc');
  } });
  assert.equal((await transport.uploadDraftFile(filePath)).draft_item_id, 71);
  assert.equal((await transport.uploadDraftData(new Uint8Array([1]), { filename: 'data.bin' })).draft_item_id, 71);
  assert.equal(Buffer.from(await transport.downloadFile(`${baseUrl}/pluginfile.php/1/test.bin`)).toString(), 'abc');
  const destination = path.join(directory, 'download.bin');
  assert.equal((await transport.downloadFileToPath(`${baseUrl}/pluginfile.php/1/test.bin`, destination)).filesize, 3);
  assert.equal(fs.readFileSync(destination, 'utf8'), 'abc');
});

test('file downloads reject foreign URLs, missing destinations and unavailable servers', async () => {
  const url = `${baseUrl}/webservice/pluginfile.php/1/test.bin`;
  await assert.rejects(downloadFileFromMoodle({ ...options, url: 'https://other.test/webservice/pluginfile.php/1/test.bin' }), { code: 'permission_denied' });
  await assert.rejects(downloadFileFromMoodleToPath({ ...options, url, destinationPath: '' }), { code: 'invalid_parameters' });
  for (const fetchImplementation of [async () => { throw new Error('offline'); }, async () => new Response('', { status: 404 })]) {
    await assert.rejects(downloadFileFromMoodle({ ...options, url, fetchImplementation }), { code: 'transport_error' });
  }
});

test('contract validators reject malformed arrays, missing values and object/number mismatches', () => {
  const operation = { name: 'validate', parameters: { values: { type: 'array' } } };
  for (const values of ['{', '{}']) assert.throws(() => buildContractParameters(operation, { values }), { code: 'invalid_parameters' });
  for (const [returns, payload] of [
    [{ value: 'string' }, {}], [{ value: ['string'] }, { value: {} }],
    [{ value: { child: 'string' } }, { value: [] }], [{ value: 'number' }, { value: Infinity }]
  ]) assert.throws(() => validateContractResponse({ name: 'read', returns }, payload), { code: 'invalid_response' });
  assert.equal(validateContractResponse({ name: 'raw' }, 'untyped'), 'untyped');
});
