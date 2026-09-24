import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContractFromFile } from '../client/moodle-rest-client.mjs';
import { runCliInProcess, startFakeMoodle } from './helpers/contract-fixtures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contract = loadContractFromFile(path.join(root, 'contract', 'operations.json'));
const token = 'draft-upload-token';

test('draft-only operations upload --upload-file and --attachment-file and pass their draft ids', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia borrador ü-'));
  const moodle = await startFakeMoodle(contract);
  try {
    const inline = path.join(directory, 'diagrama ü.png');
    const attachment = path.join(directory, 'apuntes.pdf');
    await writeFile(inline, 'png bytes');
    await writeFile(attachment, 'pdf bytes');
    const result = await runCliInProcess([
      'plugin', 'create-forum-discussion',
      '--course-id', '2', '--module-id', '9', '--name', 'Bienvenida',
      '--message', '<p><img src="@@PLUGINFILE@@/diagrama%20%C3%BC.png"></p>',
      '--upload-file', inline,
      '--attachment-file', attachment
    ], { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token });
    assert.equal(result.code, 0, result.stderr);
    const uploads = moodle.requests.filter((entry) => entry.url.startsWith('/webservice/upload.php'));
    assert.equal(uploads.length, 2);
    assert.ok(uploads.every((entry) => !entry.url.includes(token)), 'upload tokens must not travel in the URL');
    const rest = new URLSearchParams(moodle.requests.at(-1).body.toString('utf8'));
    assert.equal(rest.get('wsfunction'), 'local_moodlia_create_forum_discussion');
    assert.equal(rest.get('inline_draft_item_id'), '901');
    assert.equal(rest.get('attachment_draft_item_id'), '901');

    moodle.reset();
    const lesson = await runCliInProcess([
      'plugin', 'update-lesson-page', '--course-id', '2', '--module-id', '5', '--page-id', '7', '--upload-file', inline
    ], { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token });
    assert.equal(lesson.code, 0, lesson.stderr);
    assert.equal(new URLSearchParams(moodle.requests.at(-1).body.toString('utf8')).get('draft_item_id'), '901');
  } finally {
    await moodle.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('attachment and draft options are validated before contacting Moodle', async () => {
  const moodle = await startFakeMoodle(contract);
  try {
    const env = { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token };
    const unsupported = await runCliInProcess(['plugin', 'update-lesson-page', '--course-id', '2', '--module-id', '5', '--page-id', '7', '--attachment-file', 'x.pdf'], env);
    assert.equal(unsupported.code, 2);
    assert.match(JSON.parse(unsupported.stderr).message, /--attachment-file is not supported by update-lesson-page/);
    const conflict = await runCliInProcess(['plugin', 'create-glossary-entry', '--course-id', '2', '--module-id', '5', '--concept', 'c', '--definition', 'd', '--upload-file', 'x.png', '--inline-draft-item-id', '3'], env);
    assert.equal(conflict.code, 2);
    assert.match(JSON.parse(conflict.stderr).message, /Do not combine --upload-file with --inline-draft-item-id/);
    assert.equal(moodle.requests.length, 0);
    const help = await runCliInProcess(['plugin', 'create-forum-discussion-post', '--help']);
    assert.match(help.stdout, /--attachment-file <path>/);
    assert.match(help.stdout, /--upload-file <path>/);
    assert.match(help.stdout, /--message-file <path>/);
  } finally {
    await moodle.close();
  }
});

test('drag-and-drop questions read their background image from a file', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia-fondo-'));
  const moodle = await startFakeMoodle(contract);
  try {
    const image = path.join(directory, 'mapa.png');
    await writeFile(image, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const result = await runCliInProcess([
      'plugin', 'create-question', '--category-id', '3', '--context-id', '4', '--question-type', 'ddmarker',
      '--name', 'Mapa', '--question-text', 'Marca', '--options', '{"drags":[]}',
      '--background-image-file', image
    ], { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token });
    assert.equal(result.code, 0, result.stderr);
    const sent = JSON.parse(new URLSearchParams(moodle.requests.at(-1).body.toString('utf8')).get('options'));
    assert.equal(sent.background_image_base64, 'iVBORw==');
    assert.equal(sent.background_filename, 'mapa.png');
    assert.deepEqual(sent.drags, []);

    const unsupported = await runCliInProcess(['plugin', 'get-course-details', '--course-id', '2', '--background-image-file', image], {
      MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token
    });
    assert.equal(unsupported.code, 2);
  } finally {
    await moodle.close();
    await rm(directory, { recursive: true, force: true });
  }
});
