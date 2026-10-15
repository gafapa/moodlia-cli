import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { createHash } from 'node:crypto';
import { socketPath, request } from '../browser/protocol.mjs';
import { requiredArguments, kebab, runCliInProcess, sampleReturnValue } from './helpers/contract-fixtures.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'node_modules', '.browser-validation');
const environment = { ...process.env, MOODLIA_BROWSER_HOME: directory };
const contract = JSON.parse(await fs.readFile(path.join(root, 'contract', 'operations.json'), 'utf8'));
const descriptors = contract.operations.map(operation => ({
  name: operation.name, description: operation.summary,
  inputSchema: {
    type: 'object', properties: Object.fromEntries(Object.entries(operation.parameters).map(([name, definition]) => {
      const schema = { type: definition.type };
      if (definition.enum) schema.enum = definition.enum;
      if (definition.type === 'array') schema.items = { type: typeof definition.items === 'string' ? definition.items : 'string' };
      return [name, schema];
    })),
    required: Object.entries(operation.parameters).filter(([, definition]) => definition.required).map(([name]) => name),
  },
  result: sampleReturnValue(operation.returns),
}));
const cli = (...args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['cli/moodlia.mjs', ...args], { cwd: root, env: environment, windowsHide: true });
  let output = '', error = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { error += chunk; });
  child.on('error', reject);
  child.on('close', code => code === 0 ? resolve(JSON.parse(output)) : reject(new Error(error)));
});
let writes = 0;
const uploads = [];
const operations = [];
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/moodle/pluginfile.php/')) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="fictional.txt"');
    res.end('Synthetic download: áéíóú.');
    return;
  }
  if (req.method === 'POST') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      if (req.url.endsWith('webmcp.php')) {
        uploads.push(body);
        assert.ok(body.includes(Buffer.from('fictional-session-key')));
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, result: { draft_item_id: 543, filename: 'fictional.txt' } }));
      } else if (req.url === '/operation') { operations.push(JSON.parse(body)); res.end('{}'); }
      else { writes++; res.end('{}'); }
    });
    return;
  }
  res.setHeader('Content-Type', 'text/html');
  res.end(`<!doctype html><title>Fictional Moodle</title><h1>Local WebMCP fixture</h1><script>
    window.M={cfg:{wwwroot:location.origin+'/moodle',sesskey:'fictional-session-key'}};
    const register=(name,properties,execute)=>document.modelContext.registerTool({name,description:name,inputSchema:{type:'object',properties},execute});
    const descriptors=${JSON.stringify(descriptors).replaceAll('<', '\\u003c')};
    for(const descriptor of descriptors){
      const {result,...tool}=descriptor;
      document.modelContext.registerTool({...tool,execute:async args=>{
        await fetch('/operation',{method:'POST',body:JSON.stringify({name:tool.name,arguments:args})});return result;
      }});
    }
    register('write_fixture',{},async()=>{await fetch('/write',{method:'POST'});throw new Error('Unknown write outcome');});
    register('denied_fixture',{},()=>({isError:true,content:[{type:'text',text:'Permission denied by fictional Moodle.'}]}));
    register('moodlia_open_page',{destination:{type:'string'},course_id:{type:'integer'}},args=>{
      const url=location.origin+'/moodle/course/view.php?id='+args.course_id;
      setTimeout(()=>location.assign(url),0);return {url};
    });
  </script>`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const fixtureFile = path.join(directory, 'fictional.txt');
const downloadPath = path.join(directory, 'downloaded.txt');
try {
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(fixtureFile, 'Synthetic upload content: áéíóú.');
  await cli('browser', 'install');
  await cli('browser', 'open', '--url', `${base}/moodle`);
  assert.equal((await cli('browser', 'status')).on_selected_origin, true);
  const tools = await cli('browser', 'tools');
  assert.ok(tools.some(tool => tool.name === 'get_current_user'));
  await assert.rejects(request(directory, 'status', {}, 130000, 2), /byte limit/);
  await assert.rejects(cli('browser', 'call', 'denied_fixture', '--arguments', '{}'), /Permission denied by fictional Moodle/);
  for (const operation of contract.operations) {
    const result = await runCliInProcess(['plugin', kebab(operation.name), ...requiredArguments(operation), '--transport', 'webmcp'],
      { MOODLIA_BROWSER_HOME: directory, MOODLE_REST_TOKEN: undefined });
    assert.equal(result.code, 0, `${operation.name}: ${result.stderr}`);
    assert.deepEqual(JSON.parse(result.stdout), sampleReturnValue(operation.returns));
  }
  assert.equal(new Set(operations.map(entry => entry.name)).size, 250);
  await cli('get-course-contents', '--course-id', '99', '--transport', 'webmcp');
  assert.equal(operations.at(-1).arguments.course_id, 99);
  await cli('browser', 'call', 'moodlia_open_page', '--arguments', JSON.stringify({ destination: 'course', course_id: 99 }));
  assert.equal((await cli('browser', 'status')).url, `${base}/moodle/course/view.php?id=99`);
  await cli('update-section', '--course-id', '7', '--section-id', '7', '--summary', 'Contido ficticio: áéíóú ñ.', '--upload-file', fixtureFile, '--transport', 'webmcp');
  assert.equal(operations.at(-1).arguments.draft_item_id, 543);
  assert.equal(operations.at(-1).arguments.summary, 'Contido ficticio: áéíóú ñ.');
  assert.ok(uploads[0].includes(await fs.readFile(fixtureFile)));
  const downloaded = await cli('browser', 'download', '--url', `${base}/moodle/pluginfile.php/1/fictional.txt`, '--output', downloadPath);
  assert.equal(downloaded.sha256, createHash('sha256').update('Synthetic download: áéíóú.').digest('hex'));
  assert.equal(await fs.readFile(downloadPath, 'utf8'), 'Synthetic download: áéíóú.');
  await assert.rejects(cli('browser', 'download', '--url', `${base}/moodle/pluginfile.php/1/fictional.txt`, '--output', downloadPath), /EEXIST/);
  await assert.rejects(cli('browser', 'download', '--url', `${base}/moodle/pluginfile.php/1/fictional.txt`, '--output', `${downloadPath}.oversized`, '--max-download-bytes', '1'), /exceeds the limit/);
  await assert.rejects(fs.access(`${downloadPath}.oversized`));
  await assert.rejects(request(directory, 'call', { name: 'write_fixture', arguments: {} }), /invocation failed/);
  assert.equal(writes, 1);
  const rejected = await new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath(directory));
    socket.on('connect', () => socket.write(`${JSON.stringify({ token: 'x'.repeat(64), command: 'status' })}\n`));
    let result = '';
    socket.on('data', chunk => { result += chunk; });
    socket.on('end', () => resolve(JSON.parse(result)));
    socket.on('error', reject);
  });
  assert.equal(rejected.ok, false);
  assert.match(rejected.error, /Unauthorized/);
  await cli('browser', 'close');
  await cli('browser', 'open', '--url', `${base}/moodle`);
  assert.equal((await cli('browser', 'status')).running, true);
  console.log('PASS: all 250 CLI operations over native WebMCP with contract-shaped fictional responses, optional install, persistent session, typed JSON parameters, same-tab navigation, CLI multipart upload bytes/draft propagation, no write retries, IPC authentication, and reopen.');
} finally {
  await cli('browser', 'close').catch(() => {});
  await fs.unlink(fixtureFile).catch(() => {});
  await fs.unlink(downloadPath).catch(() => {});
  await new Promise(resolve => server.close(resolve));
}
