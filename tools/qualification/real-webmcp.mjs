import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { randomBytes, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createAuthenticatedServer } from '../../browser/server.mjs';
import { createBrowserOperations } from '../../browser/operations.mjs';
import { socketPath, request } from '../../browser/protocol.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const fixturePath = process.env.MOODLIA_QA_FIXTURE;
if (!fixturePath) throw new Error('MOODLIA_QA_FIXTURE must identify a private synthetic fixture.');
const fixture = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
if (new URL(fixture.url).hostname !== '127.0.0.1') throw new Error('Only a tunneled loopback lab is allowed.');
const directory = path.join(root, 'node_modules', '.real-webmcp-validation');
const environment = { ...process.env, MOODLIA_BROWSER_HOME: directory };
const results = [];
const report = { site: fixture.url, branch: process.env.MOODLIA_QA_BRANCH || 'unknown', checks: results };
const reportPath = path.join(path.dirname(fixturePath), `real-webmcp-${report.branch}.json`);
const cli = (...args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['cli/moodlia.mjs', ...args], { cwd: root, env: environment, windowsHide: true });
  let output = '', errors = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { errors += chunk; });
  child.on('error', reject);
  child.on('close', code => code === 0 ? resolve(JSON.parse(output)) : reject(new Error(errors)));
});
const call = (name, argumentsObject) => request(directory, 'call', { name, arguments: argumentsObject });
async function check(name, action) {
  try { await action(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false, error: error.message }); throw error; }
  finally { await fs.writeFile(reportPath, JSON.stringify(report, null, 2)); }
}
await fs.mkdir(directory, { recursive: true, mode: 0o700 });
await cli('browser', 'install');
const require = createRequire(path.join(directory, 'component', 'node_modules', 'moodlia-browser', 'index.mjs'));
const { chromium } = require('playwright');
const context = await chromium.launchPersistentContext(path.join(directory, 'profile'), {
  headless: true, channel: 'chromium', args: ['--enable-features=WebMCP', '--enable-blink-features=WebMCP'],
});
const page = context.pages()[0] || await context.newPage();
const execute = createBrowserOperations(context, page);
const server = createAuthenticatedServer({ token: 'a'.repeat(64), execute, cleanup: async () => {} });
await new Promise(resolve => server.listen(socketPath(directory), resolve));
await fs.writeFile(path.join(directory, 'session.json'), JSON.stringify({ token: 'a'.repeat(64) }), { mode: 0o600 });
const filePath = path.join(directory, 'synthetic-file.txt');
const outputPath = path.join(directory, `download-${randomBytes(4).toString('hex')}.txt`);
const content = Buffer.from('Synthetic WebMCP file: áéíóú ñ 🧪.');
await fs.writeFile(filePath, content);
let moduleId;
let assignmentId;
async function login(username, password) {
  await context.clearCookies();
  await execute('open', { url: `${fixture.url}/login/index.php` });
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await Promise.all([
    page.waitForURL(url => !url.pathname.endsWith('/login/index.php'), { timeout: 60000 }),
    page.locator('#loginbtn').click(),
  ]);
  await page.goto(`${fixture.url}/course/view.php?id=${fixture.course_id}`);
}
try {
  await check('manual-form synthetic login and native registration of all 251 tools', async () => {
    await login(fixture.username, fixture.password);
    const tools = await cli('browser', 'tools');
    assert.equal(tools.length, 251);
    assert.ok(tools.some(tool => tool.name === 'create_course'));
  });
  await check('CLI discovers the real Moodle/plugin release and authenticated user', async () => {
    report.status = await cli('get-moodlia-status', '--transport', 'webmcp');
    const user = await cli('get-current-user', '--transport', 'webmcp');
    assert.equal(user.username, fixture.username);
    assert.equal(report.status.function_count, 250);
  });
  await check('real multipart draft upload, section persistence and download bytes', async () => {
    const result = await cli('update-section', '--course-id', String(fixture.course_id), '--section-number', '1',
      '--summary', '<p>Synthetic WebMCP content áéíóú.</p>', '--upload-file', filePath, '--transport', 'webmcp');
    assert.equal(result.summary_files.length, 1);
    assert.equal(result.summary_files[0].content_hash, createHash('sha1').update(content).digest('hex'));
    const contents = await cli('get-course-contents', '--course-id', String(fixture.course_id), '--transport', 'webmcp');
    assert.ok(contents.sections.some(section => section.summary_raw.includes('Synthetic WebMCP content')));
    const downloaded = await cli('browser', 'download', '--url', result.summary_files[0].url, '--output', outputPath);
    assert.equal(downloaded.sha256, createHash('sha256').update(content).digest('hex'));
    assert.deepEqual(await fs.readFile(outputPath), content);
  });
  await check('native object/boolean arguments create and reread a real Page', async () => {
    const created = await cli('create-module', '--course-id', String(fixture.course_id), '--section-number', '1',
      '--module-type', 'page', '--name', 'Synthetic WebMCP Page áéíóú', '--options', JSON.stringify({
        content: '<p>Synthetic page content.</p>', visible: true, completion_tracking: 'manual',
      }), '--transport', 'webmcp');
    moduleId = created.module_id;
    const contents = await cli('get-course-contents', '--course-id', String(fixture.course_id), '--transport', 'webmcp');
    assert.ok(contents.sections.some(section => section.modules.some(module => module.module_id === moduleId)));
  });
  await check('native integer-array completion criteria survive the browser bridge', async () => {
    const result = await cli('set-course-completion-criteria', '--course-id', String(fixture.course_id),
      '--required-module-ids', JSON.stringify([moduleId]), '--require-all-activities', 'false', '--transport', 'webmcp');
    assert.deepEqual(result.required_module_ids, [moduleId]);
  });
  await check('same-tab navigation shows a real Moodle activity and registers tools again', async () => {
    await cli('browser', 'call', 'moodlia_open_page', '--arguments', JSON.stringify({ destination: 'activity', module_id: moduleId }));
    assert.equal(new URL(page.url()).pathname, '/mod/page/view.php');
    assert.equal(context.pages().length, 1);
    assert.equal((await cli('browser', 'tools')).length, 251);
    await page.screenshot({ path: path.join(path.dirname(fixturePath), `real-webmcp-${report.branch}.png`), fullPage: false });
  });
  await check('HTTP GET, missing CSRF, unknown tools and invalid object arguments are rejected', async () => {
    const endpoint = `${fixture.url}/local/moodlia/webmcp.php`;
    assert.equal((await context.request.get(endpoint)).status(), 400);
    const noKey = await context.request.post(endpoint, { form: { action: 'execute', tool: 'get_current_user', arguments: '{}' } });
    assert.equal(noKey.status(), 400);
    const sesskey = await page.evaluate(() => M.cfg.sesskey);
    for (const fields of [
      { action: 'execute', tool: 'unknown_operation', arguments: '{}' },
      { action: 'execute', tool: 'get_current_user', arguments: '[]' },
      { action: 'execute', tool: 'get_current_user', arguments: '{"wstoken":"synthetic"}' },
      { action: 'execute', tool: 'get_current_user', arguments: '{malformed' },
    ]) {
      const response = await context.request.post(endpoint, { form: { ...fields, sesskey } });
      assert.equal(response.status(), 400);
      assert.equal((await response.json()).ok, false);
    }
  });
  await check('course reads use an explicit course identifier while an activity is displayed', async () => {
    const courses = await cli('get-courses', '--transport', 'webmcp');
    assert.ok(courses);
    const target = fixture.other_course_id || fixture.course_id;
    const contents = await cli('get-course-contents', '--course-id', String(target), '--transport', 'webmcp');
    assert.equal(contents.course_id, target);
  });
  await check('create a real assignment for native grader permission checks', async () => {
    const assignment = await cli('create-module', '--course-id', String(fixture.course_id), '--section-number', '1',
      '--module-type', 'assign', '--name', 'Synthetic grading permissions', '--transport', 'webmcp');
    assignmentId = assignment.module_id;
    assert.ok(assignmentId > 0);
  });
  await check('student transport permission does not grant write, gradebook or grader capabilities', async () => {
    await login(fixture.student_username, fixture.student_password);
    assert.equal((await cli('get-current-user', '--transport', 'webmcp')).username, fixture.student_username);
    if (fixture.other_course_id) {
      await assert.rejects(cli('get-course-contents', '--course-id', String(fixture.other_course_id), '--transport', 'webmcp'), /moodle_error/);
    }
    await assert.rejects(cli('create-course', '--fullname', 'Unauthorized synthetic course', '--shortname', 'DENIED-WEBMCP-QA', '--transport', 'webmcp'), /moodle_error/);
    for (const argumentsObject of [
      { destination: 'gradebook', course_id: fixture.course_id },
      { destination: 'assignment_grader', module_id: assignmentId },
    ]) await assert.rejects(cli('browser', 'call', 'moodlia_open_page', '--arguments', JSON.stringify(argumentsObject)), /moodle_error/);
  });
  await check('logged-out requests cannot invoke tools with an old sesskey', async () => {
    const sesskey = await page.evaluate(() => M.cfg.sesskey);
    await context.clearCookies();
    const response = await context.request.post(`${fixture.url}/local/moodlia/webmcp.php`, {
      form: { action: 'execute', tool: 'get_current_user', arguments: '{}', sesskey },
    });
    assert.equal(response.status(), 400);
    assert.equal((await response.json()).ok, false);
  });
  report.passed = true;
  console.log(`PASS: ${results.length} real Moodle WebMCP/CLI checks (${report.branch}).`);
} finally {
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  await context.close();
  await new Promise(resolve => server.close(resolve));
  await fs.unlink(path.join(directory, 'session.json')).catch(() => {});
  await fs.unlink(filePath).catch(() => {});
  await fs.unlink(outputPath).catch(() => {});
}
