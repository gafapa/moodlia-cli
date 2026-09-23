import { createServer } from 'node:http';

import { reportMoodliaCliError, runMoodliaCli } from '../../cli/runner.mjs';

function baseType(definition) {
  return typeof definition === 'string' ? definition.split(';')[0].trim() : definition;
}

export function sampleReturnValue(definition) {
  const base = baseType(definition);
  if (Array.isArray(base)) {
    return base.length > 0 ? [sampleReturnValue(base[0])] : [];
  }
  if (base && typeof base === 'object') {
    return Object.fromEntries(Object.entries(base).map(([name, child]) => [name, sampleReturnValue(child)]));
  }
  const alternatives = String(base).split('|').map((entry) => entry.trim());
  const type = alternatives.find((entry) => entry !== 'null') ?? 'null';
  switch (type) {
    case 'integer': return 7;
    case 'number': return 1.5;
    case 'boolean': return true;
    case 'array': return [];
    case 'object': return {};
    case 'url': return 'https://moodle.test/sample';
    case 'null': return null;
    default: return 'sample';
  }
}

export function sampleParameterValue(name, definition) {
  if (Array.isArray(definition.enum) && definition.enum.length > 0) {
    return String(definition.enum[0]);
  }
  switch (definition.type) {
    case 'integer': return String(Math.max(definition.minimum ?? 1, 1));
    case 'number': return String(Math.max(definition.minimum ?? 1, 1));
    case 'boolean': return 'true';
    case 'array': return definition.items === 'integer' ? '[3,4]' : '["a"]';
    case 'object': return '{"sample":true}';
    default: return `sample-${name}`;
  }
}

export function kebab(value) {
  return value.replaceAll('_', '-');
}

export function requiredArguments(operation) {
  const argv = [];
  for (const [name, definition] of Object.entries(operation.parameters ?? {})) {
    if (definition.required) {
      argv.push(`--${kebab(name)}`, sampleParameterValue(name, definition));
    }
  }
  return argv;
}

/**
 * A local Moodle stand-in: records every request and answers each REST
 * function with a value shaped by the contract's declared return schema.
 */
export async function startFakeMoodle(contract, { respond } = {}) {
  const byFunction = new Map(contract.operations.map((operation) => [
    `${contract.restPrefix}_${operation.name}`,
    operation
  ]));
  const requests = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const entry = { method: request.method, url: request.url, headers: request.headers, body };
    requests.push(entry);
    response.setHeader('content-type', 'application/json');
    if (request.url.startsWith('/webservice/upload.php')) {
      response.end(JSON.stringify([{ itemid: 901, filename: 'upload.bin', filepath: '/', filesize: 1 }]));
      return;
    }
    const parameters = new URLSearchParams(body.toString('utf8'));
    const operation = byFunction.get(parameters.get('wsfunction'));
    const custom = respond?.({ entry, parameters, operation });
    if (custom !== undefined) {
      if (custom.status) response.statusCode = custom.status;
      response.end(typeof custom.body === 'string' ? custom.body : JSON.stringify(custom.body));
      return;
    }
    if (!operation) {
      response.end(JSON.stringify({ exception: 'dml_missing_record_exception', errorcode: 'invalidrecord', message: 'Unknown function' }));
      return;
    }
    response.end(JSON.stringify(sampleReturnValue(operation.returns)));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    reset() { requests.length = 0; },
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

/**
 * Runs the moodlia CLI in-process and captures its streams and exit code.
 * Tests using it must not run concurrently within the same file.
 */
export async function runCliInProcess(argv, env = {}) {
  const stdout = [];
  const stderr = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalEnv = {};
  for (const [key, value] of Object.entries(env)) {
    originalEnv[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;
  console.log = (...values) => stdout.push(values.join(' '));
  console.error = (...values) => stderr.push(values.join(' '));
  let code;
  try {
    try {
      await runMoodliaCli(argv);
    } catch (error) {
      reportMoodliaCliError(error);
    }
    code = process.exitCode ?? 0;
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = previousExitCode;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  return { code, stdout: stdout.join('\n'), stderr: stderr.join('\n') };
}
