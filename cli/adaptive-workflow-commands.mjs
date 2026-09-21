import fs from 'node:fs';
import path from 'node:path';
import { loadProfiles, resolveProfile } from 'moodle-core-cli/profiles';
import { contentDigest } from 'moodle-core-cli/sync';
import {
  applyManualEnrolmentSync,
  auditCourse,
  getCourseProgressReport,
  planManualEnrolmentSync
} from 'moodle-core-cli/workflows';
import { createAdaptiveSiteAdapter } from '../adaptive/index.mjs';
import { MoodleClientError } from '../client/moodle-rest-client.mjs';

const DEFAULT_CONFIG = '.moodle-profiles.json';

function required(options, name) {
  const value = options[name];
  if (value === undefined || value === true || String(value).trim() === '') {
    throw new MoodleClientError('invalid_parameters', `--${name.replaceAll('_', '-')} is required.`, { parameter: name });
  }
  return String(value);
}

function positiveInteger(options, name, fallback) {
  const value = options[name] === undefined ? fallback : Number(options[name]);
  if (!Number.isInteger(value) || value <= 0) {
    throw new MoodleClientError('invalid_parameters', `--${name.replaceAll('_', '-')} must be a positive integer.`);
  }
  return value;
}

function booleanOption(options, name) {
  const value = options[name];
  if (value === undefined) return false;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  throw new MoodleClientError('invalid_parameters', `--${name.replaceAll('_', '-')} must be true or false.`);
}

function readJson(filePath, label) {
  const resolved = path.resolve(String(filePath));
  try {
    return JSON.parse(fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new MoodleClientError('invalid_parameters', `Unable to read ${label}: ${resolved}`, { file_path: resolved }, error);
  }
}

function siteAdapter(options, contract, allowWrite = false) {
  const profileName = required(options, 'profile');
  const profile = resolveProfile(loadProfiles(options.config ?? DEFAULT_CONFIG), profileName);
  return createAdaptiveSiteAdapter({ profile, moodliaContract: contract, allowWrite });
}

async function availableProvider(adapter, preference = ['moodlia', 'core']) {
  await adapter.discoverSite();
  for (const provider of preference) {
    if (adapter.discovery.providers[provider]?.available) return provider;
  }
  throw new MoodleClientError('provider_unavailable', 'No workflow provider is available.');
}

export function printAdaptiveCourseAuditHelp() {
  console.log('Usage: moodlia course audit --profile <name> --course-id <id> [options]');
  console.log('Uses the richer MoodlIA audit when available and otherwise composes Core reads.');
}

export function printAdaptiveCourseProgressHelp() {
  console.log('Usage: moodlia course progress --profile <name> --course-id <id> [options]');
  console.log('  --maximum-users <n>         Safety limit (default: 100)');
  console.log('  --user-ids <ids>            Core provider only; comma-separated Moodle user IDs');
}

export function printAdaptiveEnrolmentSyncHelp() {
  console.log('Usage: moodlia enrolments sync --profile <name> --course-id <id> --desired-file <path> [options]');
  console.log('Plans add-only manual enrolments. Core desired entries use role_id; MoodlIA entries use role_archetype.');
  console.log('  --plan-file <path>          Save the immutable JSON plan without overwriting');
  console.log('  --apply-plan <path> --plan-digest <sha256> --allow-write --yes');
}

export async function runAdaptiveCourseAudit(options, contract) {
  const adapter = siteAdapter(options, contract);
  const provider = await availableProvider(adapter);
  const courseId = positiveInteger(options, 'course_id');
  const data = provider === 'moodlia'
    ? await adapter.adapters.moodlia.client.callOperation('audit_course', { course_id: courseId })
    : await auditCourse(adapter.adapters.core.client, { courseId });
  return { provider, data };
}

export async function runAdaptiveCourseProgress(options, contract) {
  const adapter = siteAdapter(options, contract);
  const provider = await availableProvider(adapter, options.user_ids === undefined
    ? ['moodlia', 'core']
    : ['core']);
  const courseId = positiveInteger(options, 'course_id');
  if (provider === 'moodlia') {
    if (options.user_ids !== undefined) {
      throw new MoodleClientError('capability_gap', '--user-ids requires the Core progress workflow.');
    }
    const data = await adapter.adapters.moodlia.client.callOperation('get_course_progress_report', {
      course_id: courseId,
      limit: positiveInteger(options, 'maximum_users', 100)
    });
    return { provider, data };
  }
  const userIds = options.user_ids === undefined ? []
    : String(options.user_ids).split(',').filter(Boolean).map((value) => Number(value.trim()));
  return {
    provider,
    data: await getCourseProgressReport(adapter.adapters.core.client, {
      courseId,
      userIds,
      maximumUsers: positiveInteger(options, 'maximum_users', 100)
    })
  };
}

async function planMoodliaEnrolments(client, courseId, desired) {
  if (!Array.isArray(desired)) throw new MoodleClientError('invalid_parameters', 'Desired enrolments must be an array.');
  const normalized = desired.map((entry) => {
    const role = String(entry.role_archetype ?? '');
    if (!['student', 'teacher', 'editingteacher'].includes(role)) {
      throw new MoodleClientError('invalid_parameters', 'MoodlIA desired enrolments require a supported role_archetype.');
    }
    return { user_id: Number(entry.user_id), role_archetype: role };
  });
  if (normalized.some((entry) => !Number.isInteger(entry.user_id) || entry.user_id <= 0)) {
    throw new MoodleClientError('invalid_parameters', 'Desired user_id values must be positive integers.');
  }
  if (new Set(normalized.map((entry) => `${entry.user_id}:${entry.role_archetype}`)).size !== normalized.length) {
    throw new MoodleClientError('invalid_parameters', 'Desired enrolments contain a duplicate user and role.');
  }
  const currentResult = await client.callOperation('get_enrolled_users', { course_id: courseId });
  const users = currentResult.users ?? [];
  const current = new Set(users.flatMap((user) => (user.roles ?? [])
    .map((role) => `${Number(user.user_id)}:${String(role).toLowerCase()}`)));
  const actions = normalized.filter((entry) => !current.has(`${entry.user_id}:${entry.role_archetype}`))
    .map((entry) => ({ kind: 'enrolment.add', parameters: { course_id: courseId, ...entry } }));
  const unchanged = normalized.filter((entry) => current.has(`${entry.user_id}:${entry.role_archetype}`));
  const unsigned = {
    schema_version: 1, mode: 'add_only', course_id: courseId, actions, unchanged,
    removals: [], limitations: ['existing_enrolments_are_never_removed', 'visible_roles_only']
  };
  return { ...unsigned, digest: contentDigest(unsigned) };
}

export async function runAdaptiveEnrolmentSync(options, contract) {
  if (options.apply_plan !== undefined) {
    if (!booleanOption(options, 'allow_write') || !booleanOption(options, 'yes')) {
      throw new MoodleClientError('permission_denied', 'Applying an enrolment plan requires --allow-write and --yes.');
    }
    const outer = readJson(required(options, 'apply_plan'), 'enrolment plan');
    const { digest, ...unsigned } = outer;
    const expected = contentDigest(unsigned);
    if (digest !== expected || required(options, 'plan_digest') !== expected) {
      throw new MoodleClientError('invalid_plan', 'The enrolment plan digest does not match.');
    }
    options.profile = outer.profile;
    const adapter = siteAdapter(options, contract, true);
    await adapter.discoverSite();
    if (!adapter.discovery.providers[outer.provider]?.available) {
      throw new MoodleClientError('provider_unavailable', `Planned provider ${outer.provider} is unavailable.`);
    }
    if (outer.provider === 'core') {
      return applyManualEnrolmentSync(adapter.adapters.core.client, outer.provider_plan, {
        planDigest: outer.provider_plan.digest
      });
    }
    const currentResult = await adapter.adapters.moodlia.client.callOperation('get_enrolled_users', {
      course_id: outer.provider_plan.course_id
    });
    const current = new Set((currentResult.users ?? []).flatMap((user) => (user.roles ?? [])
      .map((role) => `${Number(user.user_id)}:${String(role).toLowerCase()}`)));
    const results = [];
    const skipped = [];
    for (const action of outer.provider_plan.actions ?? []) {
      const key = `${action.parameters.user_id}:${action.parameters.role_archetype}`;
      if (current.has(key)) {
        skipped.push({ ...action.parameters, reason: 'already_enrolled_at_apply' });
        continue;
      }
      results.push(await adapter.adapters.moodlia.client.callOperation('enrol_user', action.parameters));
      current.add(key);
    }
    return { schema_version: 1, provider: 'moodlia', applied: results.length, skipped, results };
  }

  const courseId = positiveInteger(options, 'course_id');
  const desired = readJson(required(options, 'desired_file'), 'desired enrolments');
  if (!Array.isArray(desired) || desired.length === 0) {
    throw new MoodleClientError('invalid_parameters', 'Desired enrolments must be a non-empty array.');
  }
  const usesRoleIds = desired.every((entry) => entry.role_id !== undefined && entry.role_archetype === undefined);
  const usesArchetypes = desired.every((entry) => entry.role_archetype !== undefined && entry.role_id === undefined);
  if (!usesRoleIds && !usesArchetypes) {
    throw new MoodleClientError(
      'invalid_parameters',
      'Use role_id for every desired Core enrolment or role_archetype for every desired MoodlIA enrolment.'
    );
  }
  const adapter = siteAdapter(options, contract);
  const provider = await availableProvider(adapter, usesRoleIds ? ['core'] : ['moodlia']);
  const providerPlan = provider === 'core'
    ? await planManualEnrolmentSync(adapter.adapters.core.client, { courseId, desired })
    : await planMoodliaEnrolments(adapter.adapters.moodlia.client, courseId, desired);
  const unsigned = {
    schema_version: 1,
    workflow: 'manual_enrolment_sync',
    provider,
    profile: required(options, 'profile'),
    provider_plan: providerPlan
  };
  const plan = { ...unsigned, digest: contentDigest(unsigned) };
  if (options.plan_file !== undefined) {
    const outputPath = path.resolve(required(options, 'plan_file'));
    fs.mkdirSync(path.dirname(outputPath), { recursive: true, mode: 0o700 });
    fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    return { ...plan, plan_path: outputPath };
  }
  return plan;
}
