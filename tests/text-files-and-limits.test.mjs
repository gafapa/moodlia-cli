import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { MoodleClientError as CoreClientError } from 'moodle-core-cli/transport';
import { exitCodeForError } from 'moodle-core-cli/exit-codes';
import {
  MoodleClientError,
  RestTransport,
  loadContractFromFile,
  uploadFileToMoodleDraft
} from '../client/moodle-rest-client.mjs';
import {
  kebab,
  requiredArguments,
  runCliInProcess,
  startFakeMoodle
} from './helpers/contract-fixtures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contract = loadContractFromFile(path.join(root, 'contract', 'operations.json'));
const TEXT_FIELDS = ['content', 'summary', 'intro', 'activity', 'message', 'definition', 'description', 'question_text'];
const token = 'text-file-suite-token';

function textFieldCases() {
  const cases = [];
  for (const operation of contract.operations.filter((entry) => entry.transports.includes('cli'))) {
    for (const field of TEXT_FIELDS) {
      if (operation.parameters?.[field]?.type === 'string') cases.push({ operation, field });
    }
  }
  return cases;
}

function argvWithout(operation, field) {
  const argv = ['plugin', kebab(operation.name), ...requiredArguments(operation)];
  const index = argv.indexOf(`--${kebab(field)}`);
  if (index >= 0) argv.splice(index, 2);
  return argv;
}

test('every text parameter accepts a UTF-8 file, strips a BOM, and keeps CRLF', async () => {
  const cases = textFieldCases();
  assert.ok(cases.length >= 40, `expected at least 40 text fields, found ${cases.length}`);
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia texto ü-'));
  const moodle = await startFakeMoodle(contract);
  try {
    const body = '<p>Línea uno ü</p>\r\n<p>Línea dos</p>';
    const plainPath = path.join(directory, 'sin bom.html');
    const bomPath = path.join(directory, 'con bom.html');
    await writeFile(plainPath, body, 'utf8');
    await writeFile(bomPath, `﻿${body}`, 'utf8');
    for (const { operation, field } of cases) {
      for (const filePath of [plainPath, bomPath]) {
        moodle.reset();
        const argv = [...argvWithout(operation, field), `--${kebab(field)}-file`, filePath];
        const result = await runCliInProcess(argv, { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token });
        assert.equal(result.code, 0, `${operation.name} --${kebab(field)}-file: ${result.stderr}`);
        const sent = new URLSearchParams(moodle.requests.at(-1).body.toString('utf8'));
        assert.equal(sent.get(field), body, `${operation.name} ${field}`);
      }
    }
  } finally {
    await moodle.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('text files are listed in help, reject conflicts, and report missing files', async () => {
  const moodle = await startFakeMoodle(contract);
  try {
    for (const { operation, field } of textFieldCases()) {
      const help = await runCliInProcess(['plugin', kebab(operation.name), '--help']);
      assert.match(help.stdout, new RegExp(`--${kebab(field)}-file <path>\\s+optional; reads .+ from a UTF-8 file`), operation.name);

      moodle.reset();
      const conflict = await runCliInProcess(
        [...argvWithout(operation, field), `--${kebab(field)}`, 'inline', `--${kebab(field)}-file`, 'x.html'],
        { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token }
      );
      assert.equal(conflict.code, 2);
      assert.match(JSON.parse(conflict.stderr).message, new RegExp(`Do not combine --${kebab(field)} with --${kebab(field)}-file`));

      const missing = await runCliInProcess(
        [...argvWithout(operation, field), `--${kebab(field)}-file`, path.join(root, 'does-not-exist.html')],
        { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token }
      );
      assert.equal(missing.code, 2);
      assert.match(JSON.parse(missing.stderr).message, /Unable to read .+ file/);
      assert.equal(moodle.requests.length, 0, `${operation.name} contacted Moodle`);
    }
  } finally {
    await moodle.close();
  }
});

test('text file options are rejected by operations without that text parameter', async () => {
  const result = await runCliInProcess(['plugin', 'get-course-details', '--course-id', '2', '--message-file', 'x.txt'], {
    MOODLE_BASE_URL: 'http://127.0.0.1:9',
    MOODLE_REST_TOKEN: token
  });
  assert.equal(result.code, 2);
  assert.match(JSON.parse(result.stderr).message, /--message-file is not supported by get-course-details/);
});

test('MoodlIA and Core share one client error class', () => {
  assert.equal(MoodleClientError, CoreClientError);
  assert.equal(exitCodeForError(new MoodleClientError('payload_too_large', 'x')), 2);
});

test('response limits come from options, environment, and the bulk default', async () => {
  const large = JSON.stringify({ course_id: 1, shortname: 'x'.repeat(2048) });
  const moodle = await startFakeMoodle(contract, { respond: () => ({ body: large }) });
  try {
    const argv = ['plugin', 'get-course-details', '--course-id', '2', '--raw'];
    const env = { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token, MOODLE_MAX_RESPONSE_BYTES: undefined };
    assert.equal((await runCliInProcess(argv, env)).code, 0);

    const byOption = await runCliInProcess([...argv, '--max-response-bytes', '1024'], env);
    assert.equal(byOption.code, 2);
    const error = JSON.parse(byOption.stderr);
    assert.equal(error.code, 'payload_too_large');
    assert.equal(error.details.limit, 1024);
    assert.equal(error.details.option, '--max-response-bytes');

    const byEnvironment = await runCliInProcess(argv, { ...env, MOODLE_MAX_RESPONSE_BYTES: '1024' });
    assert.equal(JSON.parse(byEnvironment.stderr).code, 'payload_too_large');
  } finally {
    await moodle.close();
  }

  const transport = new RestTransport({ baseUrl: 'https://moodle.example.com', token: 't' });
  assert.equal(transport.maximumResponseBytes, 64 * 1024 * 1024);
  assert.equal(transport.maximumUploadBytes, Infinity);
});

test('uploads stay unlimited by default, honour an explicit limit, and send the token in the body', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia-upload-limit-'));
  try {
    const filePath = path.join(directory, 'archivo.bin');
    await writeFile(filePath, Buffer.alloc(4096));
    const seen = [];
    const fetchImplementation = async (url, options) => {
      seen.push({ search: new URL(url).search, token: options.body.get('token') });
      return new Response(JSON.stringify([{ itemid: 3, filename: 'archivo.bin', filepath: '/', filesize: 4096 }]));
    };
    const result = await uploadFileToMoodleDraft({ baseUrl: 'https://moodle.example.com', token: 'secret', filePath, fetchImplementation });
    assert.equal(result.draft_item_id, 3);
    assert.deepEqual(seen, [{ search: '', token: 'secret' }]);
    await assert.rejects(
      () => uploadFileToMoodleDraft({ baseUrl: 'https://moodle.example.com', token: 'secret', filePath, fetchImplementation, maximumUploadBytes: 1024 }),
      (error) => error.code === 'payload_too_large' && error.details.observed === 4096
    );
    await assert.rejects(
      () => uploadFileToMoodleDraft({
        baseUrl: 'https://moodle.example.com',
        token: 'secret',
        filePath,
        fetchImplementation,
        allowedFileRoots: [path.join(directory, 'other')]
      }),
      (error) => ['permission_denied', 'invalid_parameters'].includes(error.code)
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('the CLI allows explicitly named files outside the working directory', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia-explicit-'));
  const moodle = await startFakeMoodle(contract);
  try {
    const filePath = path.join(directory, 'resumen.html');
    await writeFile(filePath, '<p>ok</p>');
    const result = await runCliInProcess(
      ['plugin', 'update-section', '--course-id', '2', '--section-number', '1', '--summary-file', filePath],
      { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token }
    );
    assert.equal(result.code, 0, result.stderr);
  } finally {
    await moodle.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('downloads accept browser pluginfile URLs such as backup_course results', async () => {
  const { downloadFileFromMoodle } = await import('../client/moodle-rest-client.mjs');
  const requested = [];
  const data = await downloadFileFromMoodle({
    baseUrl: 'https://moodle.example.com/campus',
    token: 'secret',
    url: 'https://moodle.example.com/campus/pluginfile.php/5/backup/course/backup.mbz',
    fetchImplementation: async (url) => {
      requested.push(new URL(url));
      return new Response('mbz');
    }
  });
  assert.equal(Buffer.from(data).toString(), 'mbz');
  assert.equal(requested[0].pathname, '/campus/webservice/pluginfile.php/5/backup/course/backup.mbz');
  await assert.rejects(
    () => downloadFileFromMoodle({
      baseUrl: 'https://moodle.example.com/campus',
      token: 'secret',
      url: 'https://evil.example.com/campus/pluginfile.php/5/x',
      fetchImplementation: async () => new Response('x')
    }),
    { code: 'permission_denied' }
  );
});
