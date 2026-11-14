import assert from 'node:assert/strict';
import test from 'node:test';
import { loadContractFromFile } from '../client/moodle-rest-client.mjs';
import { runCliInProcess, startFakeMoodle } from './helpers/contract-fixtures.mjs';

const contract = loadContractFromFile(new URL('../contract/operations.json', import.meta.url));
const env = (moodle) => ({ MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: 'fixture-token' });
const sent = (moodle) => new URLSearchParams(moodle.requests.at(-1).body.toString());

test('activity and section backups send their identifiers and explicit false options over REST', async () => {
  const moodle = await startFakeMoodle(contract);
  try {
    const activity = await runCliInProcess(['plugin', 'backup-course-module', '--course-id', '42', '--module-id', '201',
      '--filename', 'essay', '--include-users', 'false'], env(moodle));
    assert.equal(activity.code, 0, activity.stderr);
    for (const [key, value] of Object.entries({ wsfunction: 'local_moodlia_backup_course_module', course_id: '42',
      module_id: '201', filename: 'essay', include_users: '0' })) {
      assert.equal(sent(moodle).get(key), value, key);
    }

    const section = await runCliInProcess(['plugin', 'backup-course-section', '--course-id', '42', '--section-number', '0',
      '--include-activities', 'false'], env(moodle));
    assert.equal(section.code, 0, section.stderr);
    for (const [key, value] of Object.entries({ wsfunction: 'local_moodlia_backup_course_section', course_id: '42',
      section_number: '0', include_activities: '0' })) {
      assert.equal(sent(moodle).get(key), value, key);
    }
  } finally { await moodle.close(); }
});

test('item restore sends the target section only when given', async () => {
  const moodle = await startFakeMoodle(contract);
  try {
    const placed = await runCliInProcess(['plugin', 'restore-course-item-backup', '--backup-file-id', '987',
      '--target-course-id', '57', '--target-section-number', '3'], env(moodle));
    assert.equal(placed.code, 0, placed.stderr);
    for (const [key, value] of Object.entries({ wsfunction: 'local_moodlia_restore_course_item_backup',
      backup_file_id: '987', target_course_id: '57', target_section_number: '3' })) {
      assert.equal(sent(moodle).get(key), value, key);
    }

    const merged = await runCliInProcess(['plugin', 'restore-course-item-backup', '--backup-file-id', '988',
      '--target-course-id', '57'], env(moodle));
    assert.equal(merged.code, 0, merged.stderr);
    assert.equal(sent(moodle).get('backup_file_id'), '988');
    assert.equal(sent(moodle).has('target_section_number'), false);
  } finally { await moodle.close(); }
});

test('item restore rejects a negative target section before contacting Moodle', async () => {
  const moodle = await startFakeMoodle(contract);
  try {
    const result = await runCliInProcess(['plugin', 'restore-course-item-backup', '--backup-file-id', '987',
      '--target-course-id', '57', '--target-section-number', '-1'], env(moodle));
    assert.notEqual(result.code, 0);
    assert.match(result.stdout + result.stderr, /target_section_number must be at least 0/);
    assert.equal(moodle.requests.length, 0);
  } finally { await moodle.close(); }
});
