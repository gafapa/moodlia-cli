import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { contentDigest } from 'moodle-core-cli/canonical';
import { loadContractFromFile } from '../client/moodle-rest-client.mjs';
import { createMoodliaMoodleAdapter, MoodliaMoodleAdapter } from '../adapters/moodlia/index.mjs';
import { createAdaptiveMoodleAdapter } from '../adaptive/adaptive-adapter.mjs';
import { createAdaptiveSiteAdapter } from '../adaptive/site-adapter-factory.mjs';
import { runAdaptiveEnrolmentSync } from '../cli/adaptive-workflow-commands.mjs';
import { runCliInProcess, sampleReturnValue, startFakeMoodle } from './helpers/contract-fixtures.mjs';

const contract = loadContractFromFile(new URL('../contract/operations.json', import.meta.url));
const tokenName = 'MOODLIA_WORKFLOW_TEST_TOKEN';

async function fixture(t, { backend = 'moodlia', declared = true } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'moodlia-workflows-'));
  const state = {
    users: [{ user_id: 5, roles: ['STUDENT'] }], enrolled: [],
    coreUsers: [{ id: 5, fullname: 'Synthetic User', roles: [{ roleid: 5 }] }]
  };
  const moodle = await startFakeMoodle(contract, { respond({ parameters, operation }) {
    const name = parameters.get('wsfunction');
    if (name === 'core_webservice_get_site_info') return { body: { userid: 2, release: '5.2 (Build: 20260101)', version: '2026010100', functions: [] } };
    if (name === 'core_course_get_courses_by_field') return { body: { courses: [{ id: 42, visible: 0, summary: '' }], warnings: [] } };
    if (name === 'core_course_get_contents') return { body: [{ id: 1, modules: [{ id: 7, name: 'Book', modname: 'book', completion: 1 }] }] };
    if (name === 'core_enrol_get_enrolled_users') return { body: state.coreUsers };
    if (name?.startsWith('core_completion_')) return { body: {} };
    if (name === 'gradereport_user_get_grade_items') return { body: { usergrades: [] } };
    if (operation?.name === 'get_moodlia_status') return { body: {
      ...sampleReturnValue(operation.returns),
      functions_json: JSON.stringify(declared ? contract.operations.map((entry) => `local_moodlia_${entry.name}`) : [])
    } };
    if (operation?.name === 'get_enrolled_users') return { body: { ...sampleReturnValue(operation.returns), users: state.users.map((user) => ({ ...sampleReturnValue(operation.returns.users[0]), ...user })) } };
    if (operation?.name === 'enrol_user') state.enrolled.push(Object.fromEntries(parameters));
  } });
  const previousToken = process.env[tokenName];
  process.env[tokenName] = 'synthetic-workflow-token';
  const config = path.join(directory, 'profiles.json');
  fs.writeFileSync(config, JSON.stringify({ schema_version: 1, profiles: {
    lab: { url: moodle.url, backend, credentials: {
      ...(backend === 'core' ? {} : { moodlia: { token_env: tokenName } }),
      ...(backend === 'moodlia' ? {} : { core: { token_env: tokenName } })
    } }
  } }));
  t.after(async () => {
    await moodle.close();
    fs.rmSync(directory, { recursive: true, force: true });
    if (previousToken === undefined) delete process.env[tokenName];
    else process.env[tokenName] = previousToken;
  });
  const options = { config, profile: 'lab', course_id: '42' };
  return { ...moodle, directory, state, options,
    async cli(command, extra = []) {
      return runCliInProcess([...command, '--config', config, '--profile', 'lab', '--course-id', '42', ...extra]);
    },
    desired(value) {
      const desired_file = path.join(directory, 'desired.json');
      fs.writeFileSync(desired_file, JSON.stringify(value));
      return { ...options, desired_file };
    }
  };
}

test('MoodlIA discovery normalizes declared functions and requires both contract and server evidence', async () => {
  assert.throws(() => new MoodliaMoodleAdapter({}), /client is required/);
  for (const functions_json of [undefined, 'invalid', '{}', [], ['local_moodlia_read'], [{ name: 'local_moodlia_read' }]]) {
    const adapter = createMoodliaMoodleAdapter({ client: {
      operationNames: () => ['read'],
      callOperation: async (name) => { assert.equal(name, 'get_moodlia_status'); return { functions_json, moodle_release: '5.2' }; }
    } });
    assert.equal(adapter.hasDeclaredOperation('read'), false);
    const status = await adapter.discoverSite();
    assert.equal(status.moodle_version, '5.2');
    assert.equal(status.user_id, 0);
    assert.equal(status.can_use_api, false);
    assert.equal(adapter.hasDeclaredOperation('read'), Array.isArray(functions_json) && functions_json.length === 1);
    assert.equal(adapter.hasDeclaredOperation('missing'), false);
  }
});

test('adaptive discovery selects available providers and exposes conservative failures', async () => {
  assert.throws(() => createAdaptiveMoodleAdapter({}), /At least one/);
  assert.throws(() => createAdaptiveSiteAdapter({}), /profile is required/);
  assert.throws(() => createAdaptiveSiteAdapter({ profile: {} }), /moodliaContract is required/);
  const core = { discoverSite: async () => ({ provider: 'core' }) };
  const adapter = createAdaptiveMoodleAdapter({ moodlia: { discoverSite: async () => { throw null; } }, core });
  assert.equal(adapter.availableAdapter(), null);
  const result = await adapter.discoverSite();
  assert.equal(result.selected_read_provider, 'core');
  assert.deepEqual(result.providers.moodlia.error, { code: 'unavailable', message: 'Provider discovery failed.' });
  assert.equal(adapter.availableAdapter(), core);
  assert.equal(adapter.availableAdapter(['moodlia']), null);
});

for (const command of [
  ['course', 'audit'], ['course', 'progress'], ['course', 'completion', 'audit'],
  ['course', 'completion', 'repair'], ['enrolments', 'sync'], ['capabilities']
]) {
  test(`in-process workflow help: ${command.join(' ')}`, async () => {
    const result = await runCliInProcess([...command, '--help']);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /Usage: moodlia/);
  });
}

for (const backend of ['moodlia', 'core']) {
  for (const command of [['course', 'audit'], ['course', 'progress'], ['course', 'completion', 'audit'], ['course', 'completion', 'repair']]) {
    test(`${backend} workflow returns provider evidence: ${command.join(' ')}`, async (t) => {
      const lab = await fixture(t, { backend });
      const result = await lab.cli(command);
      assert.equal(result.code, backend === 'core' && command.at(-1) === 'repair' ? 3 : 0, result.stderr);
      const output = JSON.parse(result.stdout);
      assert.equal(output.provider, backend);
      if (backend === 'core' && command.at(-1) === 'repair') {
        assert.equal(output.data.applicable, false);
        assert.deepEqual(output.data.actions, []);
      }
      if (backend === 'moodlia' && command.at(-1) === 'repair') {
        const call = lab.requests.map((entry) => new URLSearchParams(entry.body.toString())).find((entry) => entry.get('wsfunction') === 'local_moodlia_repair_course_completion');
        assert.equal(call.get('dry_run'), '1');
        assert.equal(call.get('reset_completion_states'), '0');
      }
    });
  }
}

test('capabilities reports both providers without exposing credentials', async (t) => {
  const lab = await fixture(t, { backend: 'auto' });
  const result = await lab.cli(['capabilities']);
  assert.equal(result.code, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.discovery.providers.moodlia.available, true);
  assert.equal(output.discovery.providers.core.available, true);
  assert.equal(result.stdout.includes(process.env[tokenName]), false);
});

test('completion workflows fall back to Core when plugin does not declare the operation', async (t) => {
  const lab = await fixture(t, { backend: 'auto', declared: false });
  for (const action of ['audit', 'repair']) {
    const result = await lab.cli(['course', 'completion', action]);
    assert.equal(result.code, action === 'repair' ? 3 : 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).provider, 'core');
  }
});

test('completion capability gaps and progress provider restrictions do not issue unsupported calls', async (t) => {
  const lab = await fixture(t, { declared: false });
  for (const action of ['audit', 'repair']) {
    const result = await lab.cli(['course', 'completion', action]);
    assert.equal(JSON.parse(result.stderr).code, 'capability_gap');
  }
  const selected = await lab.cli(['course', 'progress'], ['--user-ids', '5']);
  assert.equal(JSON.parse(selected.stderr).code, 'provider_unavailable');
});

test('completion repair requires confirmation and forwards explicit write flags', async (t) => {
  const lab = await fixture(t);
  const denied = await lab.cli(['course', 'completion', 'repair'], ['--allow-write']);
  assert.equal(JSON.parse(denied.stderr).code, 'permission_denied');
  assert.equal(lab.requests.length, 0);
  const result = await lab.cli(['course', 'completion', 'repair'], ['--allow-write', '--yes', '--reset-completion-states', '--mode', 'disable_all']);
  assert.equal(result.code, 0, result.stderr);
  const parameters = new URLSearchParams(lab.requests.at(-1).body.toString());
  assert.equal(parameters.get('dry_run'), '0');
  assert.equal(parameters.get('reset_completion_states'), '1');
  assert.equal(parameters.get('mode'), 'disable_all');
});

test('Core progress preserves explicit selection and rejects invalid or excessive user sets', async (t) => {
  const lab = await fixture(t, { backend: 'core' });
  const result = await lab.cli(['course', 'progress'], ['--user-ids', '5, 9', '--maximum-users', '1']);
  assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout).data.missing_user_ids, [9]);
  const invalid = await lab.cli(['course', 'progress'], ['--user-ids', 'bad']);
  assert.notEqual(invalid.code, 0);
  lab.state.coreUsers.push({ id: 6, fullname: 'Second Synthetic User', roles: [] });
  const excessive = await lab.cli(['course', 'progress'], ['--maximum-users', '1']);
  assert.notEqual(excessive.code, 0);
  assert.match(JSON.parse(excessive.stderr).message, /above the maximumUsers limit/);
});

test('MoodlIA enrolment plan is add-only, digest-bound and idempotent at apply time', async (t) => {
  const lab = await fixture(t);
  const options = lab.desired([{ user_id: 5, role_archetype: 'student' }, { user_id: 9, role_archetype: 'teacher' }, { user_id: 10, role_archetype: 'student' }]);
  const plan_file = path.join(lab.directory, 'plan.json');
  const plan = await runAdaptiveEnrolmentSync({ ...options, plan_file }, contract);
  assert.equal(plan.provider_plan.actions.length, 2);
  assert.equal(plan.provider_plan.unchanged.length, 1);
  assert.deepEqual(plan.provider_plan.removals, []);
  lab.state.users.push({ user_id: 9, roles: ['teacher'] });
  const applied = await runAdaptiveEnrolmentSync({ ...lab.options, apply_plan: plan_file, plan_digest: plan.digest, allow_write: true, yes: true }, contract);
  assert.equal(applied.applied, 1);
  assert.equal(applied.skipped.length, 1);
  assert.equal(lab.state.enrolled[0].user_id, '10');
});

for (const [name, desired] of [
  ['empty', []], ['object', {}], ['mixed providers', [{ user_id: 5, role_id: 5 }, { user_id: 9, role_archetype: 'student' }]],
  ['ambiguous role', [{ user_id: 5, role_id: 5, role_archetype: 'student' }]],
  ['unsupported role', [{ user_id: 5, role_archetype: 'manager' }]],
  ['invalid user', [{ user_id: -1, role_archetype: 'student' }]],
  ['duplicate', [{ user_id: 5, role_archetype: 'student' }, { user_id: 5, role_archetype: 'student' }]]
]) {
  test(`enrolment planner rejects ${name} without writes`, async (t) => {
    const lab = await fixture(t);
    await assert.rejects(runAdaptiveEnrolmentSync(lab.desired(desired), contract), { code: 'invalid_parameters' });
    assert.equal(lab.state.enrolled.length, 0);
  });
}

test('enrolment apply rejects missing confirmation, tampered digest and unavailable provider', async (t) => {
  const lab = await fixture(t);
  const plan = await runAdaptiveEnrolmentSync(lab.desired([{ user_id: 9, role_archetype: 'student' }]), contract);
  const apply_plan = path.join(lab.directory, 'plan.json');
  const applyOptions = { ...lab.options, apply_plan, plan_digest: plan.digest, allow_write: true, yes: true };
  fs.writeFileSync(apply_plan, JSON.stringify(plan));
  await assert.rejects(runAdaptiveEnrolmentSync({ ...applyOptions, yes: false }, contract), { code: 'permission_denied' });
  await assert.rejects(runAdaptiveEnrolmentSync({ ...applyOptions, plan_digest: 'bad' }, contract), { code: 'invalid_plan' });
  fs.writeFileSync(apply_plan, JSON.stringify({ ...plan, provider: 'core' }));
  await assert.rejects(runAdaptiveEnrolmentSync(applyOptions, contract), { code: 'invalid_plan' });
  const { digest, ...unsigned } = { ...plan, provider: 'core' };
  const unavailable = { ...unsigned, digest: contentDigest(unsigned) };
  fs.writeFileSync(apply_plan, JSON.stringify(unavailable));
  await assert.rejects(runAdaptiveEnrolmentSync({ ...applyOptions, plan_digest: unavailable.digest }, contract), { code: 'provider_unavailable' });
  assert.equal(lab.state.enrolled.length, 0);
});
