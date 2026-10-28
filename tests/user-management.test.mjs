import assert from 'node:assert/strict';
import test from 'node:test';
import { loadContractFromFile } from '../client/moodle-rest-client.mjs';
import { runCliInProcess, startFakeMoodle } from './helpers/contract-fixtures.mjs';

const contract = loadContractFromFile(new URL('../contract/operations.json', import.meta.url));

test('account search preserves filters and explicit false suspension over REST', async () => {
  const moodle = await startFakeMoodle(contract);
  try {
    const result = await runCliInProcess(['plugin', 'list-users', '--search', 'student_%', '--username', 'student01',
      '--email', 'student@example.test', '--auth', 'manual', '--suspended', 'false', '--offset', '25', '--limit', '25'],
    { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: 'fixture-token' });
    assert.equal(result.code, 0, result.stderr);
    const parameters = new URLSearchParams(moodle.requests.at(-1).body.toString());
    for (const [key, value] of Object.entries({ wsfunction: 'local_moodlia_list_users', search: 'student_%',
      username: 'student01', email: 'student@example.test', auth: 'manual', suspended: '0', offset: '25', limit: '25' })) {
      assert.equal(parameters.get(key), value, key);
    }
    for (const suspended of ['true', 'false']) {
      const changed = await runCliInProcess(['plugin', 'set-user-suspended', '--user-id', '42', '--suspended', suspended],
        { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: 'fixture-token' });
      assert.equal(changed.code, 0, changed.stderr);
      const sent = new URLSearchParams(moodle.requests.at(-1).body.toString());
      assert.equal(sent.get('wsfunction'), 'local_moodlia_set_user_suspended');
      assert.equal(sent.get('suspended'), suspended === 'true' ? '1' : '0');
    }
  } finally { await moodle.close(); }
});
