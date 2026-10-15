import fs from 'node:fs/promises';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';

export function allowedUrl(value) {
  const url = new URL(value);
  const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) || url.username || url.password) {
    throw new Error('Use HTTPS, or HTTP on loopback, without URL credentials.');
  }
  return url;
}

export function assertSameOrigin(value, origin) {
  if (new URL(value).origin !== origin) throw new Error('The current page left the selected Moodle origin. Open the Moodle URL again.');
}

export function decodeResult(value) {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

export async function uploadFile(page, filePath, { filename, maximumUploadBytes } = {}) {
  const resolved = await fs.realpath(filePath);
  const info = await fs.stat(resolved);
  if (!info.isFile()) throw new Error('Upload path must be a regular file.');
  if (maximumUploadBytes !== undefined && (!Number.isSafeInteger(maximumUploadBytes) || maximumUploadBytes < 1)) {
    throw new Error('Upload limit must be a positive integer.');
  }
  if (maximumUploadBytes && info.size > maximumUploadBytes) throw new Error('File exceeds the upload limit.');
  const id = `moodlia-upload-${crypto.randomUUID()}`;
  await page.evaluate(id => {
    const input = document.createElement('input');
    input.type = 'file';
    input.id = id;
    input.hidden = true;
    document.body.append(input);
  }, id);
  try {
    await page.locator(`#${id}`).setInputFiles(resolved);
    return await page.evaluate(async ({ id, filename }) => {
      if (!window.M?.cfg?.wwwroot || !M.cfg.sesskey) throw new Error('Sign in to Moodle before uploading.');
      const endpoint = new URL(`${M.cfg.wwwroot.replace(/\/$/, '')}/local/moodlia/webmcp.php`);
      if (endpoint.origin !== location.origin) throw new Error('Invalid Moodle upload endpoint.');
      const body = new FormData();
      body.set('action', 'upload');
      body.set('sesskey', M.cfg.sesskey);
      body.set('repo_upload_file', document.getElementById(id).files[0], filename);
      const response = await fetch(endpoint, { method: 'POST', credentials: 'same-origin', redirect: 'error', body });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Draft upload failed.');
      return payload.result;
    }, { id, filename: filename || path.basename(resolved) });
  } finally {
    await page.locator(`#${id}`).evaluate(element => element.remove()).catch(() => {});
  }
}

export async function downloadFile(page, { url, output, maximumDownloadBytes = 2 * 1024 * 1024 * 1024 }) {
  const target = allowedUrl(url);
  assertSameOrigin(target.href, new URL(page.url()).origin);
  if (!/(?:^|\/)(?:pluginfile|draftfile)\.php(?:\/|$)/.test(target.pathname)
      || [...target.searchParams.keys()].some(key => /token|password|sesskey/i.test(key))) {
    throw new Error('Download requires a same-origin Moodle pluginfile.php or draftfile.php session URL.');
  }
  if (!Number.isSafeInteger(maximumDownloadBytes) || maximumDownloadBytes < 1) throw new Error('Download limit must be a positive integer.');
  if (typeof output !== 'string' || !output) throw new Error('An explicit output file is required.');
  const destination = path.resolve(output);
  const staging = await fs.mkdtemp(path.join(path.dirname(destination), '.moodlia-download-'));
  const temporary = path.join(staging, 'download');
  try {
    const pending = page.waitForEvent('download', { timeout: 30000 });
    pending.catch(() => {});
    await page.evaluate(href => {
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = '';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    }, target.href);
    const download = await pending;
    await download.saveAs(temporary);
    const { size } = await fs.stat(temporary);
    if (size > maximumDownloadBytes) throw new Error('Downloaded file exceeds the limit; output was not retained.');
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(temporary)) hash.update(chunk);
    // Publish atomically without overwriting an existing user file.
    await fs.link(temporary, destination);
    return { output: destination, filesize: size, sha256: hash.digest('hex') };
  } finally {
    await fs.unlink(temporary).catch(() => {});
    await fs.rmdir(staging).catch(() => {});
  }
}

export function createBrowserOperations(context, initialPage) {
  const page = initialPage;
  let origin;
  async function toolsReady() {
    const deadline = Date.now() + 10000;
    do {
      assertSameOrigin(page.url(), origin);
      const tools = await page.webmcp.tools({ timeout: 10000 });
      if (tools.length) return tools;
      await new Promise(resolve => setTimeout(resolve, 100));
    } while (Date.now() < deadline);
    throw new Error('No WebMCP tools. Sign in and enable WebMCP in the MoodlIA plugin settings.');
  }
  return async (command, parameters) => {
    if (command === 'open') {
      const target = allowedUrl(parameters.url);
      await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
      origin = target.origin;
      await page.bringToFront();
      return { url: page.url(), message: 'Sign in manually, then run browser status or browser tools.' };
    }
    if (command === 'status') {
      return { running: true, url: page.url(), selected_origin: origin, on_selected_origin: origin === new URL(page.url()).origin };
    }
    assertSameOrigin(page.url(), origin);
    if (command === 'tools') return toolsReady();
    if (command === 'call') {
      if (typeof parameters.name !== 'string' || !parameters.arguments || Array.isArray(parameters.arguments)
          || typeof parameters.arguments !== 'object') throw new Error('Tool name and argument object are required.');
      const tools = await toolsReady();
      if (!tools.some(tool => tool.name === parameters.name)) {
        throw new Error('Tool unavailable. Sign in and enable WebMCP in the MoodlIA plugin settings.');
      }
      // Never retry a call: an interrupted write may already have committed in Moodle.
      const result = decodeResult(await page.webmcp.callTool(parameters.name, parameters.arguments, { timeout: 120000 }));
      if (parameters.name === 'moodlia_open_page' && result?.isError !== true) {
        assertSameOrigin(result.url, origin);
        await page.waitForURL(result.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      }
      return result;
    }
    if (command === 'upload') return uploadFile(page, parameters.filePath, parameters.options);
    if (command === 'download') return downloadFile(page, parameters);
    throw new Error(`Unsupported browser command: ${command}`);
  };
}
