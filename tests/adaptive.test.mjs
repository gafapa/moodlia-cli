import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createAdaptiveMoodleAdapter } from '../adaptive/index.mjs';
import { createMoodliaMoodleAdapter } from '../adapters/moodlia/index.mjs';

const execFileAsync = promisify(execFile);

function adapter(provider, capabilities, model) {
  return {
    provider,
    async discoverSite() { return { provider, site_url: `https://${provider}.example` }; },
    async exportCourse() { return structuredClone(model); },
    async syncCapabilities() { return structuredClone(capabilities); },
    async applySyncAction(action) { return { provider, kind: action.kind }; }
  };
}

test('adaptive adapter prefers MoodlIA per capability and falls back to Core', async () => {
  const model = {
    schema_version: 1,
    extracted_at: '2026-01-01T00:00:00.000Z',
    digest: 'old',
    site: { provider: 'moodlia', site_url: 'https://example.test', profile: 'school' },
    course: { source_id: 1 },
    sections: [], groups: [], groupings: [], assets: [], exclusions: []
  };
  const moodlia = adapter('moodlia', {
    course_update: { available: true, supported_fields: ['summary'] },
    group_create: { available: false }
  }, model);
  const core = adapter('core', {
    course_update: { available: true, supported_fields: ['summary'] },
    group_create: { available: true, supported_fields: ['name'] }
  }, model);
  const adaptive = createAdaptiveMoodleAdapter({ moodlia, core, profileName: 'school' });
  await adaptive.discoverSite();
  const capabilities = await adaptive.syncCapabilities();
  assert.equal(capabilities.course_update.provider, 'moodlia');
  assert.equal(capabilities.group_create.provider, 'core');
  assert.equal((await adaptive.applySyncAction({ kind: 'course.update' }, { courseId: 1 })).provider, 'moodlia');
  assert.equal((await adaptive.applySyncAction({ kind: 'group.create' }, { courseId: 1 })).provider, 'core');
});

test('adaptive adapter falls back when MoodlIA discovery fails', async () => {
  const core = adapter('core', { course_update: true }, {
    schema_version: 1,
    extracted_at: '2026-01-01T00:00:00.000Z',
    digest: 'old',
    site: { provider: 'core', site_url: 'https://example.test', profile: 'school' },
    course: { source_id: 1 },
    sections: [], groups: [], groupings: [], assets: [], exclusions: []
  });
  const moodlia = { async discoverSite() { throw new Error('not installed'); } };
  const adaptive = createAdaptiveMoodleAdapter({ moodlia, core, profileName: 'school' });
  const discovery = await adaptive.discoverSite();
  assert.equal(discovery.providers.moodlia.available, false);
  assert.equal(discovery.providers.core.available, true);
  assert.equal((await adaptive.exportCourse(1)).site.selected_provider, 'core');
});

test('adaptive adapter routes binary sync work through the selected MoodlIA capability', async () => {
  const calls = [];
  const moodlia = {
    provider: 'moodlia',
    async discoverSite() { return { provider: 'moodlia' }; },
    async syncCapabilities() {
      return {
        module_asset_stage: { available: true },
        resource_asset_replace: { available: true },
        book_asset_transfer: { available: true }
      };
    },
    async downloadAsset(asset) { calls.push(['download', asset.filename]); return new Uint8Array([1]); },
    async stageModuleAssets() { calls.push(['stage']); return { draft_item_id: 2 }; },
    async replaceResourceAsset() { calls.push(['replace']); return { files: [] }; },
    async publishBookChapterAssets() { calls.push(['book']); return { files: [] }; }
  };
  const adapter = createAdaptiveMoodleAdapter({ moodlia, profileName: 'school' });
  await adapter.discoverSite();
  await adapter.syncCapabilities({ courseId: 1 });
  await adapter.downloadAsset({ filename: 'file.pdf' });
  await adapter.stageModuleAssets({}, [], { courseId: 1 });
  await adapter.replaceResourceAsset({}, new Uint8Array(), { courseId: 1 });
  await adapter.publishBookChapterAssets({}, [], { courseId: 1 });
  assert.deepEqual(calls, [['download', 'file.pdf'], ['stage'], ['replace'], ['book']]);
});

test('Book chapter assets share one draft and publish once', async () => {
  const uploads = [];
  const operations = [];
  const client = {
    async uploadDraftData(data, options) {
      uploads.push({ data: [...data], options });
      return {
        draft_item_id: options.itemId || 41,
        filename: options.filename,
        filepath: options.filepath
      };
    },
    async callOperation(name, parameters) {
      operations.push({ name, parameters });
      return { files: uploads.map((upload) => ({ ...upload.options, filesize: upload.data.length })) };
    }
  };
  const adapter = createMoodliaMoodleAdapter({ client });
  const action = {
    source_key: 'assets:chapter:3',
    parent_source_key: 'chapter:3',
    parent_module_source_key: 'module:2',
    content: '<p>Portable</p>',
    content_format: 1,
    assets: [
      { filename: 'hero.jpg', filepath: '/' },
      { filename: 'flow.svg', filepath: '/diagrams/' }
    ]
  };
  const createdEntities = new Map([
    ['modules:module:2', { module_id: 20 }],
    ['chapters:chapter:3', { chapter_id: 30 }]
  ]);

  await adapter.publishBookChapterAssets(action, [
    { asset: action.assets[0], data: new Uint8Array([1, 2]) },
    { asset: action.assets[1], data: new Uint8Array([3]) }
  ], { courseId: 10, createdEntities });

  assert.equal(uploads.length, 2);
  assert.equal(uploads[0].options.itemId, 0);
  assert.equal(uploads[1].options.itemId, 41);
  assert.equal(operations.length, 1);
  assert.equal(operations[0].name, 'update_book_chapter');
  assert.equal(operations[0].parameters.draft_item_id, 41);
  assert.equal(operations[0].parameters.filename, 'hero.jpg');
});

test('CLI documents adaptive capabilities and course sync', async () => {
  const cli = fileURLToPath(new URL('../cli/moodlia.mjs', import.meta.url));
  const capabilities = await execFileAsync(process.execPath, [cli, 'capabilities', '--help']);
  assert.match(capabilities.stdout, /--profile <name>/);
  const sync = await execFileAsync(process.execPath, [cli, 'course', 'sync', '--help']);
  assert.match(sync.stdout, /--apply-plan <path>/);
  assert.match(sync.stdout, /--plan-digest <sha256>/);
  for (const option of ['--resume-job', '--verify-plan', '--job-id', '--history', '--cancel-job']) {
    assert.match(sync.stdout, new RegExp(option));
  }
});
