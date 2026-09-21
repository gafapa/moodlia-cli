import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { CLI_EXIT_CODES } from 'moodle-core-cli/exit-codes';

test('adaptive CLI exposes the shared exit-code contract in help', () => {
  const result = spawnSync(process.execPath, [path.resolve('cli/moodlia.mjs'), '--help'], {
    cwd: path.resolve('.'),
    encoding: 'utf8'
  });
  assert.equal(result.status, CLI_EXIT_CODES.success, result.stderr);
  assert.match(result.stdout, /2 validation/);
  assert.match(result.stdout, /7 verification failure/);
});

test('adaptive CLI validation failures return exit code 2 with structured stderr', () => {
  const result = spawnSync(process.execPath, [path.resolve('cli/moodlia.mjs'), 'not-a-command'], {
    cwd: path.resolve('.'),
    encoding: 'utf8'
  });
  assert.equal(result.status, CLI_EXIT_CODES.validationError);
  assert.equal(JSON.parse(result.stderr).code, 'invalid_parameters');
});

test('explicit Core and plugin namespaces dispatch without subprocesses', () => {
  const cli = path.resolve('cli/moodlia.mjs');
  const core = spawnSync(process.execPath, [cli, 'core', '--help'], {
    cwd: path.resolve('.'), encoding: 'utf8'
  });
  assert.equal(core.status, CLI_EXIT_CODES.success, core.stderr);
  assert.match(core.stdout, /Usage: moodle-core/);

  const plugin = spawnSync(process.execPath, [cli, 'plugin', 'update-section', '--help'], {
    cwd: path.resolve('.'), encoding: 'utf8'
  });
  assert.equal(plugin.status, CLI_EXIT_CODES.success, plugin.stderr);
  assert.match(plugin.stdout, /Usage: moodlia plugin update-section/);
  assert.match(plugin.stdout, /--summary-file/);
});

test('explicit Core namespace preserves Core validation errors and exit codes', () => {
  const result = spawnSync(process.execPath, [path.resolve('cli/moodlia.mjs'), 'core', 'not-a-command'], {
    cwd: path.resolve('.'), encoding: 'utf8'
  });
  assert.equal(result.status, CLI_EXIT_CODES.validationError);
  assert.equal(JSON.parse(result.stderr).code, 'validation_error');
});
