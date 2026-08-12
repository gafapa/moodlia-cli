import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  MoodleClientError,
  RestTransport,
  buildContractParameters,
  resolveMoodleUrl,
  validateContractResponse
} from '../client/moodle-rest-client.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'cli', 'moodlia.mjs'), ...args], {
      cwd: root,
      env: { ...process.env, MOODLE_BASE_URL: '', MOODLE_REST_TOKEN: '' },
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
