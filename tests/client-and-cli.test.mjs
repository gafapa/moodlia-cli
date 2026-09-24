import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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

test('accepts integer arrays for global completion criteria', () => {
  const operation = {
    name: 'set_course_completion_criteria',
    parameters: {
      course_id: { type: 'integer', required: true, minimum: 1 },
      required_module_ids: { type: 'array', items: 'integer' }
    }
  };

  assert.deepEqual(buildContractParameters(operation, {
    course_id: '2604',
    required_module_ids: '[12591,12592]'
  }), {
    course_id: 2604,
    required_module_ids: [12591, 12592]
  });
  assert.throws(
    () => buildContractParameters(operation, { course_id: 2604, required_module_ids: '[12591,"quiz"]' }),
    /only integers/
  );
});

test('CLI recognises the course completion configuration command', async () => {
  const result = await runCli([
    'set-course-completion-criteria',
    '--course-id', '2604',
    '--required-module-ids', '[12591,12592]',
    '--required-course-grade-percent', '80'
  ]);

  assert.equal(result.code, 2);
  const error = JSON.parse(result.stderr.trim());
  assert.equal(error.code, 'invalid_parameters');
  assert.match(error.message, /MOODLE_BASE_URL and MOODLE_REST_TOKEN are required/);
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

test('sync asset transport restricts downloads and uploads in-memory data', async () => {
  const bytes = new TextEncoder().encode('portable image');
  let requestedUrl = '';
  const downloaded = await moodliaClient.downloadFileFromMoodle({
    baseUrl: 'https://moodle.example/learning',
    token: 'secret-token',
    url: 'https://moodle.example/learning/webservice/pluginfile.php/2/mod_book/chapter/3/image.png',
    maximumBytes: bytes.byteLength,
    fetchImplementation: async (url) => {
      requestedUrl = String(url);
      return new Response(bytes, { status: 200, headers: { 'content-length': String(bytes.byteLength) } });
    }
  });
  assert.deepEqual(downloaded, bytes);
  assert.match(requestedUrl, /token=secret-token/);
  await assert.rejects(() => moodliaClient.downloadFileFromMoodle({
    baseUrl: 'https://moodle.example',
    token: 'secret-token',
    url: 'https://attacker.example/webservice/pluginfile.php/asset.png'
  }), /configured Moodle/);

  const uploaded = await moodliaClient.uploadDataToMoodleDraft({
    baseUrl: 'https://moodle.example',
    token: 'secret-token',
    data: bytes,
    filename: 'image.png',
    fetchImplementation: async (url, options) => {
      assert.equal(new URL(url).pathname, '/webservice/upload.php');
      assert.equal(options.body.get('token'), 'secret-token');
      assert.equal(options.body.get('file_1').size, bytes.byteLength);
      return Response.json([{ itemid: 91, filename: 'image.png', filepath: '/', filesize: bytes.byteLength }]);
    }
  });
  assert.equal(uploaded.draft_item_id, 91);
});

test('sync asset transport streams bytes to a protected cache path', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia-stream-'));
  const destinationPath = path.join(directory, 'asset.bin');
  const bytes = new TextEncoder().encode('streamed portable image');
  try {
    const result = await moodliaClient.downloadFileFromMoodleToPath({
      baseUrl: 'https://moodle.example',
      token: 'secret-token',
      url: 'https://moodle.example/webservice/pluginfile.php/2/mod_page/content/0/image.png',
      destinationPath,
      maximumBytes: bytes.byteLength,
      fetchImplementation: async () => new Response(bytes, {
        status: 200,
        headers: { 'content-length': String(bytes.byteLength) }
      })
    });
    assert.deepEqual(await readFile(destinationPath), Buffer.from(bytes));
    assert.equal(result.filesize, bytes.byteLength);
    assert.equal(result.sha256, createHash('sha256').update(bytes).digest('hex'));
    await assert.rejects(() => moodliaClient.downloadFileFromMoodleToPath({
      baseUrl: 'https://moodle.example',
      token: 'secret-token',
      url: 'https://moodle.example/webservice/pluginfile.php/asset.png',
      destinationPath,
      fetchImplementation: async () => new Response(bytes)
    }), /Unable to stream|exist/);
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

test('REST transport encodes integer arrays as Moodle external-function fields', async () => {
  let request;
  const transport = new RestTransport({
    baseUrl: 'https://example.test/moodle',
    token: 'secret-token',
    fetchImplementation: async (_url, init) => {
      request = init;
      return new Response(JSON.stringify({ configured: true }), { status: 200 });
    }
  });

  await transport.callFunction('local_moodlia_set_course_completion_criteria', {
    required_module_ids: [12591, 12592]
  });
  assert.equal(request.body.get('required_module_ids[0]'), '12591');
  assert.equal(request.body.get('required_module_ids[1]'), '12592');
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
  assert.equal(result.code, 2);
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
  assert.equal(accepted.code, 2);
  assert.match(JSON.parse(accepted.stderr.trim()).message, /MOODLE_BASE_URL and MOODLE_REST_TOKEN are required/);

  const rejected = await runCli([
    'create-section',
    '--course-id', '42',
    '--name', 'Section',
    '--summary', 'Summary',
    '--summary-format', 'rtf'
  ]);
  assert.equal(rejected.code, 2);
  assert.match(JSON.parse(rejected.stderr.trim()).message, /summary_format must be one of: html, plain, markdown, moodle/);
});

test('update-section help exposes local summary and upload file options', async () => {
  const result = await runCli(['update-section', '--help']);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /--summary-file <path>\s+optional; reads the section summary from a UTF-8 file/);
  assert.match(result.stdout, /--upload-file <path>/);
});

test('update-assignment help exposes authoring fields and editor uploads', async () => {
  const result = await runCli(['update-assignment', '--help']);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /--intro <string>/);
  assert.match(result.stdout, /--activity <string>/);
  assert.match(result.stdout, /--intro-file <path>\s+optional; reads the assignment description from a UTF-8 file/);
  assert.match(result.stdout, /--activity-file <path>\s+optional; reads the assignment instructions from a UTF-8 file/);
  assert.match(result.stdout, /--file-area <string>\s+optional; one of: intro, activity/);
  assert.match(result.stdout, /--upload-file <path>/);
});

test('update-assignment reads UTF-8 authoring content from Unicode paths', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia tarea con espacios á-'));
  const introPath = path.join(directory, 'descripción ü.html');
  const activityPath = path.join(directory, 'instrucciones ñ.html');
  const intro = '<p>Descripción con tilde á</p>';
  const activity = '<p>Instrucciones con eñe ñ</p>';
  let requestBody = null;
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    requestBody = Buffer.concat(chunks).toString('utf8');
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ updated: true }));
  });

  try {
    await writeFile(introPath, intro, 'utf8');
    await writeFile(activityPath, activity, 'utf8');
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    const result = await runCli([
      'update-assignment',
      '--course-id', '2609',
      '--module-id', '7710',
      '--intro-file', introPath,
      '--intro-format', 'html',
      '--activity-file', activityPath,
      '--activity-format', 'html',
      '--no-validate-response'
    ], {
      env: {
        MOODLE_BASE_URL: `http://127.0.0.1:${address.port}`,
        MOODLE_REST_TOKEN: 'test-token'
      }
    });

    assert.equal(result.code, 0, result.stderr);
    const parameters = new URLSearchParams(requestBody);
    assert.equal(parameters.get('wsfunction'), 'local_moodlia_update_assignment');
    assert.equal(parameters.get('intro'), intro);
    assert.equal(parameters.get('activity'), activity);
    assert.equal(parameters.has('intro_file'), false);
    assert.equal(parameters.has('activity_file'), false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('update-assignment rejects conflicting inline and file content', async () => {
  for (const field of ['intro', 'activity']) {
    const result = await runCli([
      'update-assignment',
      '--course-id', '2609',
      '--module-id', '7710',
      `--${field}`, '<p>Inline</p>',
      `--${field}-file`, `${field}.html`
    ]);

    assert.equal(result.code, 2);
    assert.match(
      JSON.parse(result.stderr.trim()).message,
      new RegExp(`Do not combine --${field} with --${field}-file`)
    );
  }
});

test('update-assignment reports missing local authoring files', async () => {
  const missingPath = path.join(tmpdir(), 'contenido inexistente á', 'tarea ü.html');
  const result = await runCli([
    'update-assignment',
    '--course-id', '2609',
    '--module-id', '7710',
    '--intro-file', missingPath
  ]);

  assert.equal(result.code, 2);
  const error = JSON.parse(result.stderr.trim());
  assert.equal(error.code, 'invalid_parameters');
  assert.match(error.message, /Unable to read intro file/);
});

test('update-assignment accepts HTML content with one local editor file', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia-assignment-content-'));
  const imagePath = path.join(directory, 'tarea héroe.jpg');

  try {
    await writeFile(imagePath, 'assignment image bytes');
    const result = await runCli([
      'update-assignment',
      '--course-id', '2609',
      '--module-id', '7710',
      '--intro', '<p><img src="@@PLUGINFILE@@/tarea héroe.jpg" alt="Hero"></p>',
      '--intro-format', 'html',
      '--upload-file', imagePath,
      '--file-area', 'intro'
    ]);

    assert.equal(result.code, 2);
    assert.match(
      JSON.parse(result.stderr.trim()).message,
      /MOODLE_BASE_URL and MOODLE_REST_TOKEN are required/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Book chapter commands expose local file uploads', async () => {
  for (const command of ['create-book-chapter', 'update-book-chapter']) {
    const result = await runCli([command, '--help']);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /--draft-item-id <integer>/);
    assert.match(result.stdout, /--content-file <path>/);
    assert.match(result.stdout, /--upload-file <path>/);
  }
});

test('Page updates expose UTF-8 content files and editor uploads', async () => {
  const result = await runCli(['update-page', '--help']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /--content-file <path>/);
  assert.match(result.stdout, /--upload-file <path>/);
  assert.match(result.stdout, /--content-format <string>/);
});

test('Text and media and URL updates expose typed content and upload options', async () => {
  const labelHelp = await runCli(['update-label', '--help']);
  assert.match(labelHelp.stdout, /--content-file <path>/);
  assert.match(labelHelp.stdout, /--upload-file <path>/);
  const urlHelp = await runCli(['update-url', '--help']);
  assert.match(urlHelp.stdout, /--external-url <string>/);
  assert.match(urlHelp.stdout, /--upload-file <path>/);
});

test('Book chapter commands read UTF-8 content files and reject inline conflicts', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia capítulo contenido á-'));
  const contentPath = path.join(directory, 'capítulo ü.html');

  try {
    await writeFile(contentPath, '<p>Contenido portátil ñ</p>', 'utf8');
    const accepted = await runCli([
      'create-book-chapter',
      '--course-id', '42',
      '--module-id', '202',
      '--title', 'Chapter',
      '--content-file', contentPath
    ]);
    assert.equal(accepted.code, 2);
    assert.match(
      JSON.parse(accepted.stderr.trim()).message,
      /MOODLE_BASE_URL and MOODLE_REST_TOKEN are required/
    );

    const rejected = await runCli([
      'create-book-chapter',
      '--course-id', '42',
      '--module-id', '202',
      '--title', 'Chapter',
      '--content', '<p>Inline</p>',
      '--content-file', contentPath
    ]);
    assert.equal(rejected.code, 2);
    assert.match(JSON.parse(rejected.stderr.trim()).message, /Do not combine --content with --content-file/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('create-book-chapter uploads a Unicode path and passes the draft item id', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia capítulo con espacios-'));
  const imagePath = path.join(directory, 'imagen héroe ü.jpg');
  const image = Buffer.from('Book chapter image bytes');
  const requests = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    requests.push({
      url: request.url,
      body: Buffer.concat(chunks)
    });

    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/webservice/upload.php') {
      response.end(JSON.stringify([{
        itemid: 927,
        filename: 'imagen héroe ü.jpg',
        filepath: '/',
        filesize: image.length
      }]));
      return;
    }
    response.end(JSON.stringify({
      chapter_id: 301,
      book_id: 201,
      module_id: 105,
      title: 'Portable chapter',
      content: '<p><img src="https://moodle.test/pluginfile.php/image.jpg" alt="Hero"></p>',
      content_format: 1,
      page_number: 1,
      subchapter: false,
      hidden: false,
      parent_chapter_id: 0,
      previous_chapter_id: 0,
      next_chapter_id: 0,
      url: 'https://moodle.test/mod/book/view.php?id=105&chapterid=301',
      files: [{
        file_id: 510,
        filename: 'imagen héroe ü.jpg',
        url: 'https://moodle.test/webservice/pluginfile.php/image.jpg',
        filepath: '/',
        filesize: image.length,
        mimetype: 'image/jpeg',
        content_hash: '0123456789abcdef0123456789abcdef01234567',
        time_modified: 1
      }],
      uploaded_files: [{
        file_id: 510,
        filename: 'imagen héroe ü.jpg',
        url: 'https://moodle.test/pluginfile.php/image.jpg',
        filepath: '/',
        filesize: image.length,
        mimetype: 'image/jpeg',
        time_modified: 1
      }]
    }));
  });

  try {
    await writeFile(imagePath, image);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    const result = await runCli([
      'create-book-chapter',
      '--course-id', '42',
      '--module-id', '105',
      '--title', 'Portable chapter',
      '--content', '<p><img src="@@PLUGINFILE@@/imagen%20héroe%20ü.jpg" alt="Hero"></p>',
      '--content-format', '1',
      '--upload-file', imagePath,
      '--format', 'json'
    ], {
      env: {
        MOODLE_BASE_URL: `http://127.0.0.1:${address.port}`,
        MOODLE_REST_TOKEN: 'book-test-token'
      }
    });

    assert.equal(result.code, 0, result.stderr);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, '/webservice/upload.php');
    assert.equal(requests[0].body.includes(image), true);
    const parameters = new URLSearchParams(requests[1].body.toString('utf8'));
    assert.equal(parameters.get('wsfunction'), 'local_moodlia_create_book_chapter');
    assert.equal(parameters.get('filename'), 'imagen héroe ü.jpg');
    assert.equal(parameters.get('draft_item_id'), '927');
    assert.equal(parameters.has('upload_reference'), false);
    const output = JSON.parse(result.stdout);
    assert.equal(output.uploaded_files[0].filename, 'imagen héroe ü.jpg');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('update-section reads UTF-8 summary content and uploads a Unicode path', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia sección con espacios-'));
  const summaryPath = path.join(directory, 'inicio ágil.html');
  const imagePath = path.join(directory, 'equipo héroe ü.jpg');
  const summary = '<figure><img src="@@PLUGINFILE@@/equipo héroe ü.jpg" alt="Equipo"></figure>';
  const image = Buffer.from('section image bytes');
  const requests = [];
  const token = 'sensitive-token-never-output';
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    requests.push({
      url: request.url,
      contentType: request.headers['content-type'] ?? '',
      body: Buffer.concat(chunks)
    });

    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/webservice/upload.php') {
      response.end(JSON.stringify([{
        itemid: 913,
        filename: 'equipo héroe ü.jpg',
        filepath: '/',
        filesize: image.length
      }]));
      return;
    }
    response.end(JSON.stringify({
      section_id: 7708,
      course_id: 2609,
      section_number: 1,
      name: 'Start',
      summary: '<figure><img src="https://moodle.test/pluginfile.php/image.jpg" alt="Equipo"></figure>',
      summary_raw: summary,
      summary_format: 'html',
      summary_files: [{
        file_id: 451,
        filename: 'equipo héroe ü.jpg',
        url: 'https://moodle.test/pluginfile.php/image.jpg',
        filepath: '/',
        filesize: image.length,
        mimetype: 'image/jpeg',
        content_hash: '0123456789abcdef0123456789abcdef01234567',
        time_modified: 1
      }],
      visible: true,
      uploaded_files: [{
        file_id: 451,
        filename: 'equipo héroe ü.jpg',
        url: 'https://moodle.test/pluginfile.php/image.jpg',
        filepath: '/',
        filesize: image.length,
        mimetype: 'image/jpeg',
        content_hash: '0123456789abcdef0123456789abcdef01234567',
        time_modified: 1
      }]
    }));
  });

  try {
    await writeFile(summaryPath, summary, 'utf8');
    await writeFile(imagePath, image);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    const result = await runCli([
      'update-section',
      '--course-id', '2609',
      '--section-id', '7708',
      '--summary-file', summaryPath,
      '--summary-format', 'html',
      '--upload-file', imagePath,
      '--format', 'json'
    ], {
      env: {
        MOODLE_BASE_URL: `http://127.0.0.1:${address.port}`,
        MOODLE_REST_TOKEN: token
      }
    });

    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.stdout.includes(token), false);
    assert.equal(result.stderr.includes(token), false);
    assert.equal(requests.length, 2);
    assert.equal(requests[0].url, '/webservice/upload.php');
    assert.match(requests[0].contentType, /^multipart\/form-data; boundary=/);
    assert.equal(requests[0].body.includes(image), true);

    const parameters = new URLSearchParams(requests[1].body.toString('utf8'));
    assert.equal(requests[1].url, '/webservice/rest/server.php');
    assert.equal(parameters.get('wsfunction'), 'local_moodlia_update_section');
    assert.equal(parameters.get('summary'), summary);
    assert.equal(parameters.has('summary_file'), false);
    assert.equal(parameters.get('filename'), 'equipo héroe ü.jpg');
    assert.equal(parameters.get('draft_item_id'), '913');
    assert.equal(parameters.has('upload_reference'), false);

    const output = JSON.parse(result.stdout);
    assert.equal(output.uploaded_files.length, 1);
    assert.equal(output.uploaded_files[0].filename, 'equipo héroe ü.jpg');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('update-section rejects missing upload files without exposing the token', async () => {
  const missingPath = path.join(tmpdir(), 'carpeta con tilde', 'imagen inexistente á.jpg');
  const token = 'sensitive-token-never-output';
  const result = await runCli([
    'update-section',
    '--course-id', '2609',
    '--section-id', '7708',
    '--upload-file', missingPath
  ], {
    env: {
      MOODLE_BASE_URL: 'http://127.0.0.1:1',
      MOODLE_REST_TOKEN: token
    }
  });

  assert.equal(result.code, 2);
  const error = JSON.parse(result.stderr.trim());
  assert.equal(error.code, 'invalid_parameters');
  assert.match(error.message, /Unable to read upload file/);
  assert.equal(result.stdout.includes(token), false);
  assert.equal(result.stderr.includes(token), false);
});

test('update-section rejects conflicting local and contract options', async () => {
  const uploadConflict = await runCli([
    'update-section',
    '--course-id', '2609',
    '--section-id', '7708',
    '--upload-file', 'image.jpg',
    '--draft-item-id', '913'
  ]);
  assert.equal(uploadConflict.code, 2);
  assert.match(JSON.parse(uploadConflict.stderr.trim()).message, /Do not combine --upload-file/);

  const summaryConflict = await runCli([
    'update-section',
    '--course-id', '2609',
    '--section-id', '7708',
    '--summary', '<p>Inline</p>',
    '--summary-file', 'section.html'
  ]);
  assert.equal(summaryConflict.code, 2);
  assert.match(JSON.parse(summaryConflict.stderr.trim()).message, /Do not combine --summary with --summary-file/);
});

test('update-section allows an inline summary with one local upload file', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia-inline-summary-'));
  const imagePath = path.join(directory, 'hero.jpg');

  try {
    await writeFile(imagePath, 'image bytes');
    const result = await runCli([
      'update-section',
      '--course-id', '2609',
      '--section-id', '7708',
      '--summary', '<p><img src="@@PLUGINFILE@@/hero.jpg" alt="Hero"></p>',
      '--summary-format', 'html',
      '--upload-file', imagePath
    ]);

    assert.equal(result.code, 2);
    assert.match(
      JSON.parse(result.stderr.trim()).message,
      /MOODLE_BASE_URL and MOODLE_REST_TOKEN are required/
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('CLI upload commands expose the unlimited local file option', async () => {
  const result = await runCli(['upload-folder-file', '--help']);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /--upload-file <path>/);
  assert.match(result.stdout, /without a client-side size limit/);

  const resourceHelp = await runCli(['create-module', '--help']);
  assert.equal(resourceHelp.code, 0);
  assert.match(resourceHelp.stdout, /--upload-file <path>\s+optional for resource modules/);

  const updateResourceHelp = await runCli(['update-resource', '--help']);
  assert.equal(updateResourceHelp.code, 0);
  assert.match(updateResourceHelp.stdout, /--upload-file <path>/);
});

test('CLI streams a replacement file and keeps resource identifiers in the response', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'moodlia-resource-update-'));
  const filePath = path.join(directory, 'reemplazo con tilde á.pdf');
  const content = Buffer.from('replacement PDF bytes');
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
        itemid: 944,
        filename: 'reemplazo con tilde á.pdf',
        filepath: '/',
        filesize: content.length
      }]));
      return;
    }
    response.end(JSON.stringify({
      module_id: 106,
      course_module_id: 106,
      instance_id: 501,
      name: 'Updated PDF',
      files: [{
        file_id: 701,
        filename: 'reemplazo con tilde á.pdf',
        url: 'https://moodle.test/pluginfile.php/replacement.pdf',
        filepath: '/',
        filesize: content.length,
        mimetype: 'application/pdf',
        content_hash: '0123456789abcdef0123456789abcdef01234567',
        time_modified: 1
      }]
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
      'update-resource',
      '--course-id', '42',
      '--module-id', '106',
      '--name', 'Updated PDF',
      '--upload-file', filePath,
      '--format', 'json'
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

    const parameters = new URLSearchParams(requests[1].body.toString('utf8'));
    assert.equal(parameters.get('wsfunction'), 'local_moodlia_update_resource');
    assert.equal(parameters.get('course_id'), '42');
    assert.equal(parameters.get('module_id'), '106');
    assert.equal(parameters.get('filename'), 'reemplazo con tilde á.pdf');
    assert.equal(parameters.get('draft_item_id'), '944');
    assert.equal(parameters.has('upload_reference'), false);

    const output = JSON.parse(result.stdout);
    assert.equal(output.course_module_id, 106);
    assert.equal(output.instance_id, 501);
    assert.equal(output.files[0].filename, 'reemplazo con tilde á.pdf');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
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
    assert.equal(result.code, 2);
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
