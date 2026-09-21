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

test('Label and URL sync actions reuse one staged editor draft', async () => {
  const operations = [];
  const client = {
    async callOperation(name, parameters) {
      operations.push({ name, parameters });
      return { module_id: parameters.module_id };
    }
  };
  const adapter = createMoodliaMoodleAdapter({ client });
  const createdEntities = new Map([['drafts:draft:module:20', {
    draft_item_id: 77,
    files: [{ filename: 'hero image.jpg', filepath: '/' }]
  }]]);

  await adapter.applySyncAction({
    kind: 'label_content.update',
    target_id: 40,
    asset_stage_source_key: 'draft:module:20',
    fields: { content: '<img src="@@PLUGINFILE@@/hero%20image.jpg">', content_format: 1 }
  }, { courseId: 8, createdEntities });
  await adapter.applySyncAction({
    kind: 'url_content.update',
    target_id: 41,
    fields: {
      name: 'Reference', external_url: 'https://example.org', intro: '<p>Reference</p>',
      intro_format: 'html', display: 'popup', popup_width: 720, popup_height: 480
    }
  }, { courseId: 8, createdEntities });

  assert.equal(operations[0].name, 'update_label');
  assert.equal(operations[0].parameters.draft_item_id, 77);
  assert.equal(operations[0].parameters.filename, 'hero image.jpg');
  assert.equal(operations[0].parameters.content_format, 'html');
  assert.equal(operations[1].name, 'update_url');
  assert.equal(operations[1].parameters.display, 6);
  assert.equal(operations[1].parameters.intro_format, 'html');
});

test('section and assignment sync actions publish staged editor drafts', async () => {
  const operations = [];
  const client = {
    async callOperation(name, parameters) {
      operations.push({ name, parameters });
      return name === 'update_section' ? { section_id: parameters.section_id } : { module_id: parameters.module_id };
    }
  };
  const adapter = createMoodliaMoodleAdapter({ client });
  const createdEntities = new Map([
    ['sections:section:10', { section_id: 90, section_number: 1 }],
    ['modules:module:20', { module_id: 80 }],
    ['drafts:draft:section:10', {
      draft_item_id: 70,
      files: [{ filename: 'section hero.jpg', filepath: '/media/' }]
    }],
    ['drafts:draft:intro:module:20', {
      draft_item_id: 71,
      files: [{ filename: 'assignment hero.jpg', filepath: '/' }]
    }]
  ]);

  await adapter.applySyncAction({
    kind: 'section.update',
    source_key: 'content:section:10',
    parent_source_key: 'section:10',
    target_id: null,
    target_section_number: 1,
    asset_stage_source_key: 'draft:section:10',
    fields: { summary: '<img src="@@PLUGINFILE@@/media/section hero.jpg">', summary_format: 'html' }
  }, { courseId: 8, createdEntities });
  await adapter.applySyncAction({
    kind: 'assignment_content.update',
    source_key: 'intro:module:20',
    parent_source_key: 'module:20',
    target_id: null,
    file_area: 'intro',
    asset_stage_source_key: 'draft:intro:module:20',
    fields: { intro: '<img src="@@PLUGINFILE@@/assignment hero.jpg">', intro_format: 1 }
  }, { courseId: 8, createdEntities });

  assert.equal(operations[0].name, 'update_section');
  assert.equal(operations[0].parameters.section_id, 90);
  assert.equal(operations[0].parameters.draft_item_id, 70);
  assert.equal(operations[0].parameters.filename, 'section hero.jpg');
  assert.equal(operations[1].name, 'update_assignment');
  assert.equal(operations[1].parameters.module_id, 80);
  assert.equal(operations[1].parameters.file_area, 'intro');
  assert.equal(operations[1].parameters.draft_item_id, 71);
  assert.equal(operations[1].parameters.intro_format, 'html');
});

test('MoodlIA export produces portable section and assignment editor manifests', async () => {
  const sectionFile = {
    filename: 'section.jpg', filepath: '/', filesize: 3, mimetype: 'image/jpeg',
    content_hash: 'section-hash', url: 'https://source.example/pluginfile.php/1/course/section/10/section.jpg'
  };
  const introFile = {
    filename: 'intro.png', filepath: '/media/', filesize: 4, mimetype: 'image/png',
    content_hash: 'intro-hash', url: 'https://source.example/pluginfile.php/2/mod_assign/intro/0/media/intro.png'
  };
  const client = {
    async callOperation(name) {
      if (name === 'get_course_details') return { course_id: 7, fullname: 'Course', shortname: 'COURSE' };
      if (name === 'get_course_contents') return {
        sections: [{
          section_id: 10, section_number: 0, name: 'General', visible: true,
          summary: '<img src="https://source.example/pluginfile.php/1/course/section/10/section.jpg">',
          summary_raw: '<img src="@@PLUGINFILE@@/section.jpg">', summary_format: 'html',
          summary_files: [sectionFile],
          modules: [{ module_id: 20, instance_id: 30, module_type: 'assign', name: 'Task', visible: true }]
        }]
      };
      if (name === 'get_groups') return { groups: [] };
      if (name === 'get_groupings') return { groupings: [] };
      if (name === 'get_course_assignments') return { assignments: [{
        module_id: 20, name: 'Task', intro: '<img src="@@PLUGINFILE@@/media/intro.png">', intro_format: 1,
        intro_files: [introFile], activity: '', activity_format: 1, activity_files: [],
        submission_plugins: [], feedback_plugins: []
      }] };
      if (name === 'get_assignment_grading_form') return { active_method: '', supported: false };
      throw new Error(`Unexpected operation ${name}`);
    },
    async downloadFile(url) {
      return new Uint8Array(url.includes('section.jpg') ? [1, 2, 3] : [4, 5, 6, 7]);
    }
  };
  const adapter = createMoodliaMoodleAdapter({ client });
  adapter.discovery = {
    provider: 'moodlia', site_url: 'https://source.example', moodle_version: '5.3',
    plugin_version: '0.1.211', operations: [], functions: []
  };
  const exported = await adapter.exportCourse(7);
  assert.equal(exported.sections[0].summary, '<img src="@@PLUGINFILE@@/section.jpg">');
  assert.equal(exported.sections[0].files[0].sha256.length, 64);
  assert.equal(exported.sections[0].modules[0].authoring.content.intro_files[0].sha256.length, 64);
  assert.deepEqual(exported.assets.map((asset) => asset.owner.file_area), ['section', 'intro']);
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
