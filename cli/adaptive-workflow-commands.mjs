import { contentDigest } from 'moodle-core-cli/canonical';
import {
  booleanOption,
  positiveIntegerOption,
  readJsonFile,
  requiredOption,
  writeNewJsonFile
} from 'moodle-core-cli/cli-options';
import { loadProfiles, resolveProfile } from 'moodle-core-cli/profiles';
import {
  applyManualEnrolmentSync,
  auditCourseCompletion,
  auditCourse,
  getCourseProgressReport,
  planCourseCompletionRepair,
  planManualEnrolmentSync
} from 'moodle-core-cli/workflows';
import { createAdaptiveSiteAdapter } from '../adaptive/index.mjs';
import { MoodleClientError } from '../client/moodle-rest-client.mjs';

const DEFAULT_CONFIG = '.moodle-profiles.json';

const cliErrors = Object.freeze({
  validation: (message, details = {}, cause = null) => new MoodleClientError('invalid_parameters', message, details, cause)
});

function required(options, name) {
  return requiredOption(options, name, cliErrors);
}

function positiveInteger(options, name, fallback) {
  return positiveIntegerOption(options, name, { fallback, errors: cliErrors });
}

function booleanFlag(options, name) {
  return booleanOption(options, name, cliErrors);
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

export function printAdaptiveCourseCompletionAuditHelp() {
  console.log('Usage: moodlia course completion audit --profile <name> --course-id <id> [options]');
  console.log('Uses the typed MoodlIA audit when authorized and otherwise reports conservative Core evidence.');
}

export function printAdaptiveCourseCompletionRepairHelp() {
  console.log('Usage: moodlia course completion repair --profile <name> --course-id <id> [options]');
  console.log('  --mode <mode>               book_view_only, all_grade_to_view, or disable_all');
  console.log('  --reset-completion-states   Reset affected state only when explicitly applying');
  console.log('  --allow-write --yes         Apply through MoodlIA; otherwise produce a dry-run or Core gap plan');
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

export async function runAdaptiveCourseCompletionAudit(options, contract) {
  const adapter = siteAdapter(options, contract);
  await adapter.discoverSite();
  const courseId = positiveInteger(options, 'course_id');
  if (adapter.discovery.providers.moodlia?.available
      && adapter.adapters.moodlia.hasDeclaredOperation('audit_course_completion')) {
    return {
      provider: 'moodlia',
      data: await adapter.adapters.moodlia.client.callOperation('audit_course_completion', {
        course_id: courseId,
        include_ok: booleanFlag(options, 'include_ok')
      })
    };
  }
  if (!adapter.discovery.providers.core?.available) {
    throw new MoodleClientError('capability_gap', 'Neither MoodlIA completion audit nor the Core evidence workflow is available.');
  }
  return {
    provider: 'core',
    data: await auditCourseCompletion(adapter.adapters.core.client, { courseId })
  };
}

export async function runAdaptiveCourseCompletionRepair(options, contract) {
  const allowWrite = booleanFlag(options, 'allow_write');
  const confirmed = booleanFlag(options, 'yes');
  if (allowWrite && !confirmed) {
    throw new MoodleClientError('permission_denied', 'Applying a completion repair requires --allow-write and --yes.');
  }
  const adapter = siteAdapter(options, contract, allowWrite);
  await adapter.discoverSite();
  const courseId = positiveInteger(options, 'course_id');
  const mode = options.mode ?? 'book_view_only';
  if (adapter.discovery.providers.moodlia?.available
      && adapter.adapters.moodlia.hasDeclaredOperation('repair_course_completion')) {
    return {
      provider: 'moodlia',
      data: await adapter.adapters.moodlia.client.callOperation('repair_course_completion', {
        course_id: courseId,
        mode,
        dry_run: !allowWrite,
        reset_completion_states: allowWrite && booleanFlag(options, 'reset_completion_states')
      })
    };
  }
  if (!adapter.discovery.providers.core?.available) {
    throw new MoodleClientError('capability_gap', 'No completion repair provider is available.');
  }
  const audit = await auditCourseCompletion(adapter.adapters.core.client, { courseId });
  return { provider: 'core', data: planCourseCompletionRepair(audit, { mode }) };
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
    if (!booleanFlag(options, 'allow_write') || !booleanFlag(options, 'yes')) {
      throw new MoodleClientError('permission_denied', 'Applying an enrolment plan requires --allow-write and --yes.');
    }
    const outer = readJsonFile(required(options, 'apply_plan'), 'enrolment plan', cliErrors);
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
  const desired = readJsonFile(required(options, 'desired_file'), 'desired enrolments', cliErrors);
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
    return { ...plan, plan_path: writeNewJsonFile(required(options, 'plan_file'), plan) };
  }
  return plan;
}
