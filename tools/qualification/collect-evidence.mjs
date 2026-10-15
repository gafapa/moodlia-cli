import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readWebMcpCoverage } from '../../../moodlia-moodle-plugin/tools/check-webmcp-coverage.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const input = path.join(root, 'node_modules', '.qa-s1');
const coverageRuns = [];
for (const [node, file] of [['24.18.0', 'global-coverage-final.log'], ['22.13.0', 'global-coverage-node22.log']]) {
  const report = await fs.readFile(path.join(root, 'node_modules', file), 'utf8');
  const metrics = /all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/.exec(report);
  assert.ok(metrics, `Missing coverage metrics in ${file}.`);
  assert.match(report, /(?:#|ℹ) tests 174\b/);
  assert.match(report, /(?:#|ℹ) pass 174\b/);
  assert.match(report, /(?:#|ℹ) fail 0\b/);
  const [lines, branches, functions] = metrics.slice(1).map(Number);
  assert.ok(lines >= 95 && branches >= 90 && functions >= 85);
  coverageRuns.push({ node, tests: 174, line_percent: lines, branch_percent: branches,
    function_percent: functions, report_sha256: createHash('sha256').update(report).digest('hex') });
}
const evidence = {
  date: '2026-10-15', synthetic_data_only: true,
  local_environment: { platform: process.platform, node: process.version, playwright: '1.64.1' },
  final_artifacts: { cli: '0.5.1', browser: '0.1.1', plugin: '0.1.219' },
  local_checks: { cli_tests: 174, cli_line_percent: coverageRuns[0].line_percent, cli_minimum_percent: 95,
    cli_branch_percent: coverageRuns[0].branch_percent, cli_minimum_branch_percent: 90,
    cli_function_percent: coverageRuns[0].function_percent, cli_minimum_function_percent: 85,
    cli_previous_tests: 111, cli_previous_line_percent: 77.70, cli_coverage_runs: coverageRuns,
    browser_tests: 50, browser_line_percent: 92.73, browser_minimum_percent: 90,
    plugin_static_tests: 46, fictional_native_chromium_cli_operations: 250 },
  native_profiles: [],
  cleanup: { host: 's1', verified_at: '2026-10-15T19:06:22Z', owned_containers: 0, owned_networks: 0,
    lab_directory_exists: false, loopback_listener_exists: false, anonymous_volumes_removed: true,
    private_credentials_removed: true, synthetic_browser_profile_removed: true, ssh_tunnel_removed: true,
    original_running_services_preserved: true, existing_images_and_production_volumes_preserved: true },
  limitations: [
    'Functional profiles preceded final patch-version metadata changes; later client changes were verified locally.',
    'Full supported-version CI matrix and hosted coverage jobs were not executed.',
    'Moodle 4.5 coverage-report generation did not finish; its stale prior-profile Clover file was excluded.',
    'Moodle 5.2 full suite retains five existing notices and twelve PHPUnit metadata deprecations.',
    'All 250 native Chromium CLI adapter calls use fictional responses; real Moodle paths are separate checks.',
  ],
};
for (const [branch, postgres, assertions, file] of [['4.5', '16.15', 1509, 'phpunit.xml'], ['5.2', '17.11', 1471, 'phpunit-final.xml']]) {
  const junit = await fs.readFile(path.join(input, branch, file));
  const attributes = /<testsuite\s+([^>]+)>/.exec(junit.toString())[1];
  const number = key => Number(new RegExp(`\\b${key}="(\\d+)"`).exec(attributes)?.[1]);
  assert.equal(number('tests'), 103);
  assert.equal(number('assertions'), assertions);
  assert.equal(number('failures'), 0);
  assert.equal(number('errors'), 0);
  const browser = JSON.parse(await fs.readFile(path.join(input, `real-webmcp-${branch}.json`)));
  assert.equal(browser.passed, true);
  assert.equal(browser.checks.length, 11);
  assert.ok(browser.checks.every(check => check.passed));
  const profile = { moodle: browser.status.moodle_release, php: '8.3.15', postgres,
    plugin_functional_snapshot: browser.status.plugin_release,
    phpunit: { tests: 103, assertions, failures: 0, errors: 0,
      junit_sha256: createHash('sha256').update(junit).digest('hex') },
    focused_webmcp: { tests: 20, assertions: 300 }, browser: { passed: 11 }, bridge_coverage: null };
  if (branch === '5.2') {
    profile.bridge_coverage = readWebMcpCoverage(await fs.readFile(path.join(input, branch, 'webmcp-final-coverage.xml'), 'utf8'));
    profile.browser.targeting_scope = 'Course reads from an activity; separate-course reads also passed native PHPUnit. The 4.5 browser profile additionally used a separate course.';
  }
  evidence.native_profiles.push(profile);
  for (const project of [root, path.resolve(root, '..', 'moodlia-moodle-plugin')]) {
    const destination = path.join(project, 'docs', 'evidence');
    await fs.mkdir(destination, { recursive: true });
    await fs.writeFile(path.join(destination, `phpunit-webmcp-${branch}-2026-10-15.xml`), junit);
  }
}
for (const project of [root, path.resolve(root, '..', 'moodlia-moodle-plugin')]) {
  await fs.writeFile(path.join(project, 'docs', 'evidence', 'webmcp-2026-10-15.json'), `${JSON.stringify(evidence, null, 2)}\n`);
}
await fs.unlink(path.join(input, 'native-both.tgz')).catch(() => {});
console.log('Verified qualification summaries and native JUnit evidence written without credentials.');
