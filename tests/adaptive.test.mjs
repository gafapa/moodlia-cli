import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const execFileAsync = promisify(execFile);

test('CLI documents adaptive audit, progress, and add-only enrolment workflows', async () => {
  const cli = fileURLToPath(new URL('../cli/moodlia.mjs', import.meta.url));
  for (const command of [
    ['course', 'audit', '--help'],
    ['course', 'progress', '--help'],
    ['course', 'completion', 'audit', '--help'],
    ['course', 'completion', 'repair', '--help'],
    ['enrolments', 'sync', '--help']
  ]) {
    const result = await execFileAsync(process.execPath, [cli, ...command]);
    assert.match(result.stdout, /Usage: moodlia/);
  }
});

test('adaptive enrolment sync writes a new plan file and applies it through Core by digest', async () => {
  const { createServer } = await import('node:http');
  const fsSync = await import('node:fs');
  const os = await import('node:os');
  const { runAdaptiveEnrolmentSync } = await import('../cli/adaptive-workflow-commands.mjs');
  const { loadContractFromFile } = await import('../client/moodle-rest-client.mjs');
  const contract = loadContractFromFile(new URL('../contract/operations.json', import.meta.url));
  const calls = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const functionName = new URLSearchParams(Buffer.concat(chunks).toString('utf8')).get('wsfunction');
    calls.push(functionName);
    response.setHeader('content-type', 'application/json');
    if (functionName === 'core_webservice_get_site_info') {
      response.end(JSON.stringify({ release: '5.2 (Build: 20260101)', version: '2026010100', sitename: 'Test', userid: 2, functions: [] }));
    } else if (functionName === 'core_enrol_get_enrolled_users') {
      response.end(JSON.stringify([{ id: 5, fullname: 'Existing', roles: [{ roleid: 5 }] }]));
    } else {
      response.end('null');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const directory = fsSync.mkdtempSync(path.join(os.tmpdir(), 'moodlia-adaptive-enrol-'));
  const previousToken = process.env.ADAPTIVE_TEST_CORE_TOKEN;
  process.env.ADAPTIVE_TEST_CORE_TOKEN = 'core-token';
  try {
    const configPath = path.join(directory, 'profiles.json');
    fsSync.writeFileSync(configPath, JSON.stringify({
      schema_version: 1,
      profiles: {
        lab: {
          url: `http://127.0.0.1:${server.address().port}`,
          backend: 'core',
          credentials: { core: { token_env: 'ADAPTIVE_TEST_CORE_TOKEN' } }
        }
      }
    }));
    const desiredPath = path.join(directory, 'desired.json');
    fsSync.writeFileSync(desiredPath, JSON.stringify([{ user_id: 5, role_id: 5 }, { user_id: 9, role_id: 5 }]));
    const planPath = path.join(directory, 'plans', 'plan.json');
    const options = { config: configPath, profile: 'lab', course_id: '42', desired_file: desiredPath, plan_file: planPath };
    const plan = await runAdaptiveEnrolmentSync({ ...options }, contract);
    assert.equal(plan.provider, 'core');
    assert.equal(plan.plan_path, planPath);
    assert.equal(plan.provider_plan.actions.length, 1);
    await assert.rejects(() => runAdaptiveEnrolmentSync({ ...options }, contract), { code: 'EEXIST' });
    const applied = await runAdaptiveEnrolmentSync({
      config: configPath,
      apply_plan: planPath,
      plan_digest: plan.digest,
      allow_write: true,
      yes: true
    }, contract);
    assert.equal(applied.applied, 1);
    assert.ok(calls.includes('enrol_manual_enrol_users'));
  } finally {
    if (previousToken === undefined) delete process.env.ADAPTIVE_TEST_CORE_TOKEN;
    else process.env.ADAPTIVE_TEST_CORE_TOKEN = previousToken;
    await new Promise((resolve) => server.close(resolve));
    fsSync.rmSync(directory, { recursive: true, force: true });
  }
});

test('synchronization commands point to the moodlia-sync package', async () => {
  const cli = fileURLToPath(new URL('../cli/moodlia.mjs', import.meta.url));
  for (const command of [['course', 'sync'], ['sync-course'], ['sync', 'status', '--job-id', 'x']]) {
    const result = await execFileAsync(process.execPath, [cli, ...command]).catch((error) => error);
    assert.equal(result.code, 3, command.join(' '));
    const error = JSON.parse(result.stderr);
    assert.equal(error.code, 'unsupported_operation');
    assert.match(error.message, /moodlia-sync/);
  }
  const help = await execFileAsync(process.execPath, [cli, 'capabilities', '--help']);
  assert.match(help.stdout, /moodlia-sync capabilities/);
});

test('adaptive discovery names each provider error when no provider is available', async () => {
  const { AdaptiveMoodleAdapter } = await import('../adaptive/adaptive-adapter.mjs');
  const failing = (code, message) => ({
    async discoverSite() {
      const error = new Error(message);
      error.code = code;
      throw error;
    }
  });
  const adapter = new AdaptiveMoodleAdapter({
    moodlia: failing('function_not_available', 'local_moodlia is not installed'),
    core: failing('connection_error', 'connect ECONNREFUSED 127.0.0.1:1'),
    profileName: 'school'
  });
  await assert.rejects(adapter.discoverSite(), (error) => {
    assert.equal(error.message, 'No provider is available for profile school '
      + '(moodlia: function_not_available: local_moodlia is not installed; '
      + 'core: connection_error: connect ECONNREFUSED 127.0.0.1:1).');
    assert.equal(error.details.providers.core.available, false);
    return true;
  });
});
