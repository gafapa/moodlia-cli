import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import * as moodliaClient from '../client/moodle-rest-client.mjs';
import {
  MoodleClientError,
  RestTransport,
  buildContractParameters,
  encodeFileForUpload,
  resolveMoodleUrl,
  uploadFileToMoodleDraft,
  validateContractResponse
} from '../client/moodle-rest-client.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('public client exposes REST without bundling MCP transport', () => {
  assert.equal(typeof moodliaClient.RestTransport, 'function');
  assert.equal('McpTransport' in moodliaClient, false);
  assert.equal('createMoodleMcpClient' in moodliaClient, false);
});

test('resolves Moodle paths below subdirectory installations and rejects insecure remote URLs', () => {
  assert.equal(
    resolveMoodleUrl('https://example.test/learning', 'webservice/rest/server.php').toString(),
    'https://example.test/learning/webservice/rest/server.php'
  );
  assert.throws(() => resolveMoodleUrl('http://example.test', 'webservice/rest/server.php'), MoodleClientError);
  assert.equal(
    resolveMoodleUrl('http://127.0.0.1:8080/moodle', 'login/token.php').toString(),
    'http://127.0.0.1:8080/moodle/login/token.php'
  );
});

test('validates and coerces contract parameters', () => {
  const operation = {
    name: 'example',
    parameters: {
      course_id: { type: 'integer', required: true, minimum: 1 },
      visible: { type: 'boolean' },
      mode: { type: 'string', enum: ['safe', 'fast'] },
      options: { type: 'object' }
    }
  };

  assert.deepEqual(buildContractParameters(operation, {
    course_id: '42',
    visible: 'false',
    mode: 'safe',
    options: '{"notify":true}'
  }), {
    course_id: 42,
    visible: 0,
    mode: 'safe',
    options: '{"notify":true}'
  });
  assert.throws(() => buildContractParameters(operation, { course_id: 0 }), /at least 1/);
  assert.throws(() => buildContractParameters(operation, { course_id: 1, unknown: true }), /Unknown parameter/);
});

test('retains legacy base64 upload encoding for backward compatibility', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia-upload-'));
  const filePath = path.join(directory, 'larger-than-old-plugin-limit.bin');
  const content = Buffer.alloc((2 * 1024 * 1024) + 1, 0x5a);

  try {
    await writeFile(filePath, content);
    const encoded = encodeFileForUpload(filePath);
    assert.deepEqual(Buffer.from(encoded, 'base64'), content);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('streams local files to Moodle draft storage with multipart form data', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia-draft-upload-'));
  const filePath = path.join(directory, 'backup.mbz');
  const content = Buffer.from('native Moodle backup');
  let request;

  try {
    await writeFile(filePath, content);
    const result = await uploadFileToMoodleDraft({
      baseUrl: 'https://example.test/moodle',
      token: 'secret-token',
      filePath,
      fetchImplementation: async (url, init) => {
        request = { url: url.toString(), init };
        const uploadedFile = init.body.get('file_1');
        assert.ok(uploadedFile instanceof Blob);
        assert.deepEqual(Buffer.from(await uploadedFile.arrayBuffer()), content);
        return new Response(JSON.stringify([{
          itemid: 731,
          filename: 'backup.mbz',
          filepath: '/',
          filesize: content.length
        }]), { status: 200 });
      }
    });

    assert.deepEqual(result, {
      draft_item_id: 731,
      filename: 'backup.mbz',
      filepath: '/',
      filesize: content.length
    });
    assert.equal(request.url, 'https://example.test/moodle/webservice/upload.php');
    assert.equal(request.init.body.get('token'), 'secret-token');
    assert.equal(request.init.body.get('itemid'), '0');
    assert.equal(request.init.body.get('filepath'), '/');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('validates nested response shapes', () => {
  const operation = {
    name: 'get_example',
    returns: { id: 'integer', items: [{ name: 'string', enabled: 'boolean' }] }
  };

  const payload = { id: 7, items: [{ name: 'Item', enabled: true }] };
  assert.equal(validateContractResponse(operation, payload), payload);
  assert.throws(() => validateContractResponse(operation, { id: '7', items: [] }), /must be an integer/);
});

test('REST transport sends canonical Moodle form fields and preserves subdirectory paths', async () => {
  let request;
  const transport = new RestTransport({
    baseUrl: 'https://example.test/moodle',
    token: 'secret-token',
    fetchImplementation: async (url, init) => {
      request = { url: url.toString(), init };
      return new Response(JSON.stringify([{ id: 1 }]), { status: 200 });
    }
  });

  assert.deepEqual(await transport.callFunction('core_course_get_courses', { includehidden: false }), [{ id: 1 }]);
  assert.equal(request.url, 'https://example.test/moodle/webservice/rest/server.php');
  assert.equal(request.init.method, 'POST');
  assert.equal(request.init.redirect, 'error');
  assert.equal(request.init.body.get('wsfunction'), 'core_course_get_courses');
  assert.equal(request.init.body.get('includehidden'), '0');
});

test('REST transport preserves Moodle business error details', async () => {
  const transport = new RestTransport({
    baseUrl: 'https://example.test/moodle',
    token: 'secret-token',
    fetchImplementation: async () => new Response(JSON.stringify({
      exception: 'moodle_exception',
      errorcode: 'restoreprecheckfailed',
      message: 'The Moodle backup cannot be restored: Missing required plugin',
      debuginfo: 'Missing required plugin: mod_example'
    }), { status: 200 })
  });

  await assert.rejects(
    transport.callFunction('local_moodlia_restore_course_backup', { backup_file_id: 41597 }),
    (error) => error instanceof MoodleClientError
      && error.code === 'moodle_error'
      && error.message.includes('Missing required plugin')
      && error.details.moodle_errorcode === 'restoreprecheckfailed'
      && error.details.moodle_debuginfo === 'Missing required plugin: mod_example'
  );
});

test('CLI validates unknown options before requiring credentials', async () => {
  const result = await runCli(['get-courses', '--unknown', 'value']);
  assert.equal(result.code, 1);
  const error = JSON.parse(result.stderr.trim());
  assert.equal(error.code, 'invalid_parameters');
  assert.match(error.message, /Unknown option/);
});

test('CLI help is generated from the operation contract', async () => {
  const result = await runCli(['get-courses', '--help']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /Usage: moodlia get-courses/);
  assert.match(result.stdout, /--limit <integer>\s+optional; min: 1/);
});

test('section commands accept HTML summaries from the shared contract', async () => {
  const help = await runCli(['create-section', '--help']);
  assert.equal(help.code, 0);
  assert.match(help.stdout, /--summary-format <string>\s+optional; one of: html, plain/);

  const accepted = await runCli([
    'update-section',
    '--course-id', '42',
    '--section-number', '1',
    '--summary', '<p>Updated summary</p>',
    '--summary-format', 'html'
  ]);
  assert.equal(accepted.code, 1);
  assert.match(JSON.parse(accepted.stderr.trim()).message, /MOODLE_BASE_URL and MOODLE_REST_TOKEN are required/);

  const rejected = await runCli([
    'create-section',
    '--course-id', '42',
    '--name', 'Section',
    '--summary', 'Summary',
    '--summary-format', 'markdown'
  ]);
  assert.equal(rejected.code, 1);
  assert.match(JSON.parse(rejected.stderr.trim()).message, /summary_format must be one of: html, plain/);
});

test('CLI upload commands expose the unlimited local file option', async () => {
  const result = await runCli(['upload-folder-file', '--help']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /--upload-file <path>/);
  assert.match(result.stdout, /without a client-side size limit/);

  const resourceHelp = await runCli(['create-module', '--help']);
  assert.equal(resourceHelp.code, 0);
  assert.match(resourceHelp.stdout, /--upload-file <path>\s+optional for resource modules/);
});

test('CLI accepts a local file when creating a Moodle resource', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia-resource-'));
  const filePath = path.join(directory, 'resource.txt');

  try {
    await writeFile(filePath, 'resource content');
    const result = await runCli([
      'create-module',
      '--course-id', '42',
      '--section-number', '1',
      '--module-type', 'resource',
      '--name', 'Resource',
      '--upload-file', filePath
    ]);
    assert.equal(result.code, 1);
    const error = JSON.parse(result.stderr.trim());
    assert.equal(error.code, 'invalid_parameters');
    assert.match(error.message, /MOODLE_BASE_URL and MOODLE_REST_TOKEN are required/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('CLI uploads a backup as multipart and passes only its draft item id to the operation', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia-cli-stream-'));
  const filePath = path.join(directory, 'base.mbz');
  const content = Buffer.from('streamed backup bytes');
  const requests = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    requests.push({
      url: request.url,
      contentType: request.headers['content-type'] ?? '',
      body
    });

    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/webservice/upload.php') {
      response.end(JSON.stringify([{
        itemid: 812,
        filename: 'base.mbz',
        filepath: '/',
        filesize: content.length
      }]));
      return;
    }
    response.end(JSON.stringify({
      course_id: 0,
      file_id: 91,
      filename: 'base.mbz',
      url: 'https://example.test/base.mbz',
      filepath: '/',
      filesize: content.length,
      mimetype: 'application/vnd.moodle.backup',
      time_modified: 1
    }));
  });

  try {
    await writeFile(filePath, content);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    const result = await runCli([
      'upload-course-backup',
      '--upload-file', filePath
    ], {
      env: {
        MOODLE_BASE_URL: `http://127.0.0.1:${address.port}`,
        MOODLE_REST_TOKEN: 'secret-token'
      }
    });

    assert.equal(result.code, 0, result.stderr);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, '/webservice/upload.php');
    assert.match(requests[0].contentType, /^multipart\/form-data; boundary=/);
    assert.equal(requests[0].body.includes(content), true);

    assert.equal(requests[1].url, '/webservice/rest/server.php');
    const operation = new URLSearchParams(requests[1].body.toString('utf8'));
    assert.equal(operation.get('wsfunction'), 'local_moodlia_upload_course_backup');
    assert.equal(operation.get('filename'), 'base.mbz');
    assert.equal(operation.get('draft_item_id'), '812');
    assert.equal(operation.has('upload_reference'), false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

function runCli(args, { env = {} } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'cli', 'moodlia.mjs'), ...args], {
      cwd: root,
      env: { ...process.env, MOODLE_BASE_URL: '', MOODLE_REST_TOKEN: '', ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code, stdout, stderr }));
  });
}
