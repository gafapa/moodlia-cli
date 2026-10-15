import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { MoodleClientError, validateContractResponse, buildContractParameters } from '../client/moodle-rest-client.mjs';

const bundle = fileURLToPath(new URL('../browser/', import.meta.url));

function checkedToolResult(result) {
  if (result?.isError === true) {
    const content = Array.isArray(result.content) ? result.content : [];
    const message = content.filter(item => item?.type === 'text' && typeof item.text === 'string').map(item => item.text).join('\n');
    throw new MoodleClientError('moodle_error', message || 'The WebMCP tool reported a Moodle error.');
  }
  return result;
}

function invocationError(error, consequential = true) {
  if (error instanceof MoodleClientError) return error;
  const unknown = /timed out|timeout|outcome may be unknown|invocation failed|Target .*closed|context was destroyed/i.test(error.message);
  return new MoodleClientError(unknown && consequential ? 'unknown_outcome' : 'transport_error',
    unknown && consequential ? `${error.message} Inspect Moodle before repeating this action.` : error.message);
}

export function componentDirectory() {
  return path.resolve(process.env.MOODLIA_BROWSER_HOME || path.join(os.homedir(), '.moodlia', 'browser'));
}

async function loadComponent() {
  const entry = path.join(componentDirectory(), 'component', 'node_modules', 'moodlia-browser', 'index.mjs');
  try { await fs.access(entry); }
  catch { throw new MoodleClientError('provider_unavailable', 'Optional browser component missing. Run moodlia browser install.'); }
  return import(pathToFileURL(entry).href);
}

async function runNodeScript(script, argumentsList) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...argumentsList], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let diagnostic = '';
    let output = '';
    child.stdout.on('data', chunk => { output = (output + chunk.toString()).slice(-64000); });
    child.stderr.on('data', chunk => { diagnostic = (diagnostic + chunk.toString()).slice(-4000); });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve(output) : reject(new Error(`Component installation failed (${code}): ${diagnostic}`)));
  });
}

export async function browserCommand(argumentsList) {
  const command = argumentsList[0];
  if (!command || command === '--help' || command === 'help' || argumentsList.includes('--help')) {
    return { usage: [
      'moodlia browser install', 'moodlia browser open --url https://moodle.example',
      'moodlia browser status', 'moodlia browser tools',
      'moodlia browser call <tool> --arguments <JSON object>',
      'moodlia browser download --url <Moodle file URL> --output <local path>',
      'moodlia browser close', 'moodlia browser uninstall',
    ] };
  }
  const definitions = {
    install: [], status: [], tools: [], close: [], uninstall: [], open: ['url'],
    call: ['arguments'], download: ['url', 'output', 'max-download-bytes'],
  };
  if (!Object.hasOwn(definitions, command)) throw new MoodleClientError('invalid_parameters', `Unknown browser command: ${command}`);
  const parsed = {};
  const positional = [];
  for (let index = 1; index < argumentsList.length; index++) {
    const argument = argumentsList[index];
    if (!argument.startsWith('--')) { positional.push(argument); continue; }
    const separator = argument.indexOf('=');
    const name = argument.slice(2, separator < 0 ? undefined : separator);
    if (!definitions[command].includes(name)) throw new MoodleClientError('invalid_parameters', `Unknown browser option: --${name}`);
    if (Object.hasOwn(parsed, name)) throw new MoodleClientError('invalid_parameters', `Duplicate browser option: --${name}`);
    const value = separator < 0 ? argumentsList[++index] : argument.slice(separator + 1);
    if (!value || value.startsWith('--')) throw new MoodleClientError('invalid_parameters', `--${name} is required.`);
    parsed[name] = value;
  }
  if (positional.length !== (command === 'call' ? 1 : 0)) {
    throw new MoodleClientError('invalid_parameters', command === 'call' ? 'browser call requires exactly one tool name.' : 'Unexpected browser command argument.');
  }
  const option = name => {
    if (parsed[name] === undefined) throw new MoodleClientError('invalid_parameters', `--${name} is required.`);
    return parsed[name];
  };
  if (command === 'open') option('url');
  let toolArguments;
  if (command === 'call') {
    toolArguments = JSON.parse(option('arguments'));
    if (!toolArguments || typeof toolArguments !== 'object' || Array.isArray(toolArguments)) {
      throw new MoodleClientError('invalid_parameters', 'Tool arguments must be a JSON object.');
    }
  }
  if (command === 'download') {
    option('url'); option('output');
    if (parsed['max-download-bytes'] !== undefined && (!Number.isSafeInteger(Number(parsed['max-download-bytes']))
        || Number(parsed['max-download-bytes']) < 1)) throw new MoodleClientError('invalid_parameters', 'Download byte limit must be a positive integer.');
  }
  const directory = componentDirectory();
  if (command === 'install') {
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    const npm = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
    await fs.access(npm);
    const staging = await fs.mkdtemp(path.join(directory, 'install-'));
    try {
      const packed = JSON.parse(await runNodeScript(npm, ['pack', bundle, '--pack-destination', staging, '--json']));
      const archive = path.join(staging, path.basename(packed[0].filename));
      await runNodeScript(npm, ['install', '--prefix', path.join(directory, 'component'), '--omit=dev', '--ignore-scripts',
        '--no-audit', '--no-fund', archive]);
    } finally {
      if (path.dirname(staging) !== directory || !path.basename(staging).startsWith('install-')) throw new Error('Invalid staging directory.');
      await fs.rm(staging, { recursive: true, force: true });
    }
    const require = createRequire(path.join(directory, 'component', 'node_modules', 'moodlia-browser', 'index.mjs'));
    const playwrightPackage = require.resolve('playwright/package.json');
    await runNodeScript(path.join(path.dirname(playwrightPackage), 'cli.js'), ['install', 'chromium']);
    return { installed: true, component_directory: path.join(directory, 'component') };
  }
  const component = await loadComponent();
  if (command === 'uninstall') {
    try { await component.request(directory, 'close'); }
    catch (error) { if (!/No browser session|Browser session unavailable/.test(error.message)) throw error; }
    const target = path.resolve(directory, 'component');
    if (path.dirname(target) !== directory || path.basename(target) !== 'component') throw new Error('Invalid component directory.');
    await fs.rm(target, { recursive: true, force: true });
    return { uninstalled: true, profile_preserved: true };
  }
  if (command === 'open') return component.openBrowser(option('url'), directory);
  if (['status', 'tools', 'close'].includes(command)) return component.request(directory, command);
  if (command === 'call') {
    try {
      return checkedToolResult(await component.request(directory, 'call', { name: positional[0], arguments: toolArguments }));
    } catch (error) { throw invocationError(error); }
  }
  if (command === 'download') {
    const parameters = { url: option('url'), output: option('output') };
    if (argumentsList.some(value => value === '--max-download-bytes' || value.startsWith('--max-download-bytes='))) {
      parameters.maximumDownloadBytes = Number(option('max-download-bytes'));
    }
    return component.request(directory, 'download', parameters);
  }
  throw new MoodleClientError('invalid_parameters', `Unknown browser command: ${command}`);
}

export async function createWebMcpClient({ contract, validateResponses = true, maximumUploadBytes, maximumResponseBytes,
  environment = {} } = {}) {
  maximumResponseBytes ??= Number(environment.MOODLE_MAX_RESPONSE_BYTES || 64 * 1024 * 1024);
  maximumUploadBytes ??= environment.MOODLE_MAX_UPLOAD_BYTES === undefined ? undefined : Number(environment.MOODLE_MAX_UPLOAD_BYTES);
  for (const limit of [maximumResponseBytes, maximumUploadBytes]) {
    if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1)) {
      throw new MoodleClientError('invalid_parameters', 'Browser byte limits must be positive integers.');
    }
  }
  const component = await loadComponent();
  const directory = componentDirectory();
  return {
    async callOperation(name, parameters) {
      const operation = contract.operations.find(entry => entry.name === name);
      if (!operation) throw new MoodleClientError('invalid_parameters', `Unknown operation: ${name}`);
      const argumentsObject = buildContractParameters(operation, parameters, { encoding: 'json' });
      let result;
      try { result = await component.request(directory, 'call', { name, arguments: argumentsObject }, 130000, maximumResponseBytes); }
      catch (error) {
        throw invocationError(error, operation.type === 'write');
      }
      checkedToolResult(result);
      return validateResponses ? validateContractResponse(operation, result) : result;
    },
    async uploadDraftFile(filePath, options = {}) {
      return component.request(directory, 'upload', { filePath, options: { ...options, maximumUploadBytes } });
    },
  };
}
