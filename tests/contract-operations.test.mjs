import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContractFromFile } from '../client/moodle-rest-client.mjs';
import {
  kebab,
  requiredArguments,
  runCliInProcess,
  sampleParameterValue,
  sampleReturnValue,
  startFakeMoodle
} from './helpers/contract-fixtures.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contract = loadContractFromFile(path.join(root, 'contract', 'operations.json'));
const cliOperations = contract.operations.filter((operation) => operation.transports.includes('cli'));
const snapshotPath = path.join(root, 'tests', 'snapshots', 'cli-operations.json');
const token = 'contract-suite-token-must-never-leak';

function readSnapshot() {
  try {
    return JSON.parse(readFileSync(snapshotPath, 'utf8'));
  } catch {
    return null;
  }
}

function requestParameters(entry) {
  const parameters = new URLSearchParams(entry.body.toString('utf8'));
  parameters.delete('wstoken');
  return Object.fromEntries([...parameters.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

test('every contract operation is reachable through the CLI with contract-shaped input and output', async () => {
  const moodle = await startFakeMoodle(contract);
  const observed = {};
  try {
    for (const operation of cliOperations) {
      moodle.reset();
      const argv = ['plugin', kebab(operation.name), ...requiredArguments(operation)];
      const result = await runCliInProcess(argv, {
        MOODLE_BASE_URL: moodle.url,
        MOODLE_REST_TOKEN: token
      });
      const restCall = moodle.requests.find((entry) => entry.url.startsWith('/webservice/rest/server.php'));
      observed[operation.name] = {
        argv,
        exit_code: result.code,
        request: restCall ? requestParameters(restCall) : null,
        stdout: result.stdout ? JSON.parse(result.stdout) : null,
        stderr: result.stderr ? JSON.parse(result.stderr) : null
      };

      assert.equal(result.stdout.includes(token) || result.stderr.includes(token), false,
        `${operation.name} leaked the REST token`);
      assert.equal(result.code, 0, `${operation.name}: ${result.stderr}`);
      assert.ok(restCall, `${operation.name} did not call Moodle`);
      const sent = new URLSearchParams(restCall.body.toString('utf8'));
      assert.equal(sent.get('wsfunction'), `${contract.restPrefix}_${operation.name}`);
      assert.equal(sent.get('moodlewsrestformat'), 'json');
      assert.deepEqual(JSON.parse(result.stdout), sampleReturnValue(operation.returns));
    }
  } finally {
    await moodle.close();
  }

  if (process.env.UPDATE_SNAPSHOTS === '1') {
    writeFileSync(snapshotPath, `${JSON.stringify(observed, null, 2)}\n`);
    return;
  }
  const snapshot = readSnapshot();
  assert.ok(snapshot, 'Missing tests/snapshots/cli-operations.json; run with UPDATE_SNAPSHOTS=1.');
  assert.deepEqual(observed, snapshot, 'CLI request or output changed; review and run with UPDATE_SNAPSHOTS=1.');
});

test('every contract operation documents each parameter in its help', async () => {
  for (const operation of cliOperations) {
    const result = await runCliInProcess(['plugin', kebab(operation.name), '--help']);
    assert.equal(result.code, 0, operation.name);
    for (const [name, definition] of Object.entries(operation.parameters ?? {})) {
      assert.match(result.stdout, new RegExp(`--${kebab(name)} <${definition.type}>`), `${operation.name} help lacks --${kebab(name)}`);
    }
  }
});

test('every contract operation rejects unknown options before contacting Moodle', async () => {
  const moodle = await startFakeMoodle(contract);
  try {
    for (const operation of cliOperations) {
      moodle.reset();
      const result = await runCliInProcess(
        ['plugin', kebab(operation.name), ...requiredArguments(operation), '--definitely-not-an-option', 'x'],
        { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token }
      );
      assert.equal(result.code, 2, operation.name);
      assert.equal(JSON.parse(result.stderr).code, 'invalid_parameters', operation.name);
      assert.equal(moodle.requests.length, 0, `${operation.name} contacted Moodle`);
    }
  } finally {
    await moodle.close();
  }
});

test('every required parameter is enforced before contacting Moodle', async () => {
  const moodle = await startFakeMoodle(contract);
  try {
    for (const operation of cliOperations) {
      const required = Object.entries(operation.parameters ?? {}).filter(([, definition]) => definition.required);
      for (const [missing] of required) {
        moodle.reset();
        const argv = ['plugin', kebab(operation.name)];
        for (const [name, definition] of required) {
          if (name !== missing) argv.push(`--${kebab(name)}`, sampleParameterValue(name, definition));
        }
        const result = await runCliInProcess(argv, { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token });
        assert.equal(result.code, 2, `${operation.name} without ${missing}`);
        assert.equal(moodle.requests.length, 0, `${operation.name} without ${missing} contacted Moodle`);
      }
    }
  } finally {
    await moodle.close();
  }
});

test('enum, integer and range violations are rejected for every constrained parameter', async () => {
  const moodle = await startFakeMoodle(contract);
  try {
    for (const operation of cliOperations) {
      for (const [name, definition] of Object.entries(operation.parameters ?? {})) {
        const invalid = Array.isArray(definition.enum)
          ? 'not-a-declared-value'
          : definition.type === 'integer'
            ? (definition.minimum !== undefined ? String(definition.minimum - 1) : 'not-an-integer')
            : null;
        if (invalid === null) continue;
        moodle.reset();
        const argv = ['plugin', kebab(operation.name), ...requiredArguments(operation)];
        const index = argv.indexOf(`--${kebab(name)}`);
        if (index >= 0) argv[index + 1] = invalid;
        else argv.push(`--${kebab(name)}`, invalid);
        const result = await runCliInProcess(argv, { MOODLE_BASE_URL: moodle.url, MOODLE_REST_TOKEN: token });
        assert.equal(result.code, 2, `${operation.name} --${kebab(name)} ${invalid}`);
        assert.equal(moodle.requests.length, 0, `${operation.name} --${kebab(name)} contacted Moodle`);
      }
    }
  } finally {
    await moodle.close();
  }
});

test('Moodle business errors keep the token out of CLI error output for every operation', async () => {
  const moodle = await startFakeMoodle(contract, {
    respond: () => ({
      body: {
        exception: 'moodle_exception',
        errorcode: 'nopermissions',
        message: `Denied for ${token}`,
        debuginfo: `wstoken=${token}`
      }
    })
  });
  try {
    for (const operation of cliOperations) {
      const result = await runCliInProcess(['plugin', kebab(operation.name), ...requiredArguments(operation)], {
        MOODLE_BASE_URL: moodle.url,
        MOODLE_REST_TOKEN: token
      });
      assert.notEqual(result.code, 0, operation.name);
      assert.equal(result.stderr.includes(token), false, `${operation.name} leaked the token in an error`);
    }
  } finally {
    await moodle.close();
  }
});

test('only documented contract operations are shadowed by top-level workflow aliases', async () => {
  const aliases = new Set(['capabilities', 'sync-course', 'audit-course', 'course-progress', 'sync-enrolments']);
  const shadowed = cliOperations.map((operation) => kebab(operation.name)).filter((name) => aliases.has(name));
  assert.deepEqual(shadowed, ['audit-course'], 'Reach newly shadowed operations through "moodlia plugin <command>".');
  const help = await runCliInProcess(['plugin', 'audit-course', '--help']);
  assert.match(help.stdout, /^Usage: moodlia plugin audit-course/);
});
