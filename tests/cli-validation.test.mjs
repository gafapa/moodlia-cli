import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadContractFromFile } from '../client/moodle-rest-client.mjs';
import { kebab, requiredArguments, runCliInProcess, startFakeMoodle } from './helpers/contract-fixtures.mjs';

const contract = loadContractFromFile(new URL('../contract/operations.json', import.meta.url));

for (const [name, extra, message] of [
  ['get_course_details', ['--upload-file', 'missing.bin'], /not supported/],
  ['update_section', ['--upload-file'], /requires a local file path/],
  ['update_section', ['--upload-file', 'missing.bin', '--draft-item-id', '5'], /Do not combine/],
  ['create_module', ['--upload-file', 'missing.bin'], /requires --module-type resource/],
  ...['{', '[]', 'null', '{"draft_item_id":5}', '{"upload_reference":"x"}'].map((value) => [
    'create_module', ['--module-type', 'resource', '--upload-file', 'missing.bin', '--options', value], /JSON|Do not combine/
  ]),
  ['create_forum_discussion', ['--attachment-file'], /requires a local file path/],
  ['create_forum_discussion', ['--attachment-file', 'missing.bin', '--attachment-draft-item-id', '5'], /Do not combine/],
  ['create_question', ['--background-image-file'], /requires a local file path/],
  ...['{', '[]', 'null', '{"background_image_base64":"abc"}'].map((value) => [
    'create_question', ['--background-image-file', 'missing.bin', '--options', value], /JSON|Do not combine/
  ]),
  ['create_question', ['--background-image-file', 'missing.bin'], /Unable to read background image file/],
  ['update_section', ['--summary-file'], /requires a local file path/]
]) {
  test(`CLI rejects ${name} ${extra.join(' ')} before network access`, async (t) => {
    const moodle = await startFakeMoodle(contract);
    t.after(() => moodle.close());
    const operation = contract.operations.find((entry) => entry.name === name);
    const result = await runCliInProcess(['plugin', kebab(name), ...requiredArguments(operation), ...extra], {
      MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: 'synthetic-validation-token'
    });
    assert.equal(result.code, 2, result.stderr);
    assert.match(JSON.parse(result.stderr).message, message);
    assert.equal(moodle.requests.length, 0);
  });
}

test('Core namespace resolves profile credentials and respects explicit URL and token overrides', async (t) => {
  const moodle = await startFakeMoodle(contract, { respond({ parameters }) {
    if (parameters.get('wsfunction') === 'core_webservice_get_site_info') return { body: { userid: 2, release: '5.2 (Build: 20260101)', version: '2026010100', functions: [{ name: 'core_course_get_courses_by_field' }] } };
    if (parameters.get('wsfunction') === 'core_course_get_courses_by_field') return { body: { courses: [{ id: 42, fullname: 'Synthetic Course' }], warnings: [] } };
  } });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'moodlia-core-namespace-'));
  const previousToken = process.env.MOODLIA_CORE_NAMESPACE_TOKEN;
  process.env.MOODLIA_CORE_NAMESPACE_TOKEN = 'synthetic-profile-token';
  t.after(async () => {
    await moodle.close();
    fs.rmSync(directory, { recursive: true, force: true });
    if (previousToken === undefined) delete process.env.MOODLIA_CORE_NAMESPACE_TOKEN;
    else process.env.MOODLIA_CORE_NAMESPACE_TOKEN = previousToken;
  });
  const config = path.join(directory, 'profiles.json');
  fs.writeFileSync(config, JSON.stringify({ schema_version: 1, profiles: {
    lab: { url: moodle.url, backend: 'core', allow_insecure: true, credentials: { core: { token_env: 'MOODLIA_CORE_NAMESPACE_TOKEN' } } },
    plugin: { url: moodle.url, backend: 'moodlia', credentials: { moodlia: { token_env: 'MOODLIA_CORE_NAMESPACE_TOKEN' } } }
  } }));
  for (const extra of [[], ['--url', moodle.url, '--token', 'explicit-token']]) {
    const result = await runCliInProcess(['core', 'get-course', '--course-id', '42', '--profile=lab', '--config', config, ...extra]);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).id, 42);
    const parameters = new URLSearchParams(moodle.requests.at(-1).body.toString());
    assert.equal(parameters.get('wstoken'), extra.length ? 'explicit-token' : 'synthetic-profile-token');
  }
  const missing = await runCliInProcess(['core', 'get-course', '--profile', '--help']);
  assert.equal(JSON.parse(missing.stderr).code, 'invalid_parameters');
  const unavailable = await runCliInProcess(['core', 'get-course', '--profile', 'plugin', '--config', config]);
  assert.equal(JSON.parse(unavailable.stderr).code, 'provider_unavailable');
  const legacy = await runCliInProcess(['core', 'get-course', '--course-id', '42', '--url', moodle.url], { MOODLE_TOKEN: undefined, MOODLE_REST_TOKEN: 'legacy-token' });
  assert.equal(legacy.code, 0, legacy.stderr);
  assert.equal(new URLSearchParams(moodle.requests.at(-1).body.toString()).get('wstoken'), 'legacy-token');
});

test('unsupported formats are rejected before transport construction', async () => {
  const result = await runCliInProcess(['plugin', 'get-course-details', '--course-id', '42', '--format', 'xml']);
  assert.equal(JSON.parse(result.stderr).code, 'invalid_parameters');
  assert.match(JSON.parse(result.stderr).message, /Only --format json/);
});
