import fs from 'node:fs';
import path from 'node:path';
import { describeProfile, loadProfiles, resolveProfile } from 'moodle-core-cli/profiles';
import {
  createCourseSyncEngine,
  SqliteSyncStateStore,
  validateSyncPlan
} from 'moodle-core-cli/sync';
import { createAdaptiveSiteAdapter } from '../adaptive/index.mjs';
import { MoodleClientError } from '../client/moodle-rest-client.mjs';

const DEFAULT_CONFIG = '.moodle-profiles.json';
const DEFAULT_STATE = path.join('.moodle-sync', 'state.sqlite');

function requiredOption(options, name) {
  const value = options[name];
  if (value === undefined || value === true || String(value).trim() === '') {
    throw new MoodleClientError('invalid_parameters', `--${name.replaceAll('_', '-')} is required.`, {
      parameter: name
    });
  }
  return String(value);
}

function positiveIntegerOption(options, name) {
  const value = Number(requiredOption(options, name));
  if (!Number.isInteger(value) || value <= 0) {
    throw new MoodleClientError('invalid_parameters', `--${name.replaceAll('_', '-')} must be a positive integer.`, {
      parameter: name
    });
  }
  return value;
}

function booleanOption(options, name) {
  const value = options[name];
  if (value === undefined) return false;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  throw new MoodleClientError('invalid_parameters', `--${name.replaceAll('_', '-')} must be true or false.`, {
    parameter: name
  });
}

function resolvedProfile(options, name) {
  return resolveProfile(loadProfiles(options.config ?? DEFAULT_CONFIG), name);
}

function adaptiveAdapter(profile, contract, { allowWrite = false } = {}) {
  return createAdaptiveSiteAdapter({ profile, moodliaContract: contract, allowWrite });
}

function openStateStore(options) {
  const statePath = path.resolve(options.state ?? DEFAULT_STATE);
  fs.mkdirSync(path.dirname(statePath), { recursive: true, mode: 0o700 });
  return new SqliteSyncStateStore(statePath);
}

function readPlan(planPath) {
  const contents = fs.readFileSync(path.resolve(planPath), 'utf8').replace(/^\uFEFF/, '');
  return validateSyncPlan(JSON.parse(contents));
}

function readMapping(mappingPath) {
  if (mappingPath === undefined) return {};
  if (mappingPath === true) {
    throw new MoodleClientError('invalid_parameters', '--mapping requires a JSON file path.');
  }
  const mapping = JSON.parse(fs.readFileSync(path.resolve(String(mappingPath)), 'utf8').replace(/^\uFEFF/, ''));
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
    throw new MoodleClientError('invalid_parameters', '--mapping must contain a JSON object.');
  }
  return mapping;
}

function savePlan(plan, requestedPath) {
  const planPath = path.resolve(requestedPath === true || requestedPath === undefined
    ? path.join('.moodle-sync', 'plans', `${plan.plan_id}.json`)
    : String(requestedPath));
  fs.mkdirSync(path.dirname(planPath), { recursive: true, mode: 0o700 });
  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, {
    encoding: 'utf8', flag: 'wx', mode: 0o600
  });
  return planPath;
}

export function printAdaptiveCapabilitiesHelp() {
  console.log('Usage: moodlia capabilities --profile <name> [options]');
  console.log('');
  console.log('  --config <path>             Profile file (default: .moodle-profiles.json)');
  console.log('  --profile <name>            Adaptive Moodle site profile');
  console.log('  --course-id <id>            Optional course context');
  console.log('  --format json');
}

export function printAdaptiveSyncHelp() {
  console.log('Usage: moodlia course sync [options]');
  console.log('       moodlia sync-course [options]');
  console.log('       moodlia sync status --job-id <id>');
  console.log('       moodlia sync resume --job-id <id> --plan-digest <sha256> --allow-write');
  console.log('       moodlia sync verify --plan-id <id> [--job-id <id>]');
  console.log('       moodlia sync history');
  console.log('       moodlia sync cancel --job-id <id>');
  console.log('');
  console.log('Planning:');
  console.log('  --source-profile <name>     Source Moodle profile');
  console.log('  --source-course-id <id>     Source course ID');
  console.log('  --target-profile <name>     Target Moodle profile');
  console.log('  --target-course-id <id>     Existing target course ID');
  console.log('  --create-target-category-id <id>  Create a hidden target course in this category');
  console.log('  --target-shortname <value>  Required short name for a newly created target course');
  console.log('  --plan [path]               Save an immutable plan');
  console.log('  --plan-file <path>          Alias for --plan <path>');
  console.log('  --mapping <path>            Explicit section/group ID mapping JSON');
  console.log('  --unsupported-policy <mode> error, skip, or degrade');
  console.log('  --conflict-policy <mode>    abort, source-wins, target-wins, or report');
  console.log('');
  console.log('Applying:');
  console.log('  --approve-plan <path>       Persist external approval for MCP execution');
  console.log('  --yes                       Confirm local approval');
  console.log('  --apply-plan <path>         Apply a saved plan');
  console.log('  --plan-digest <sha256>      Approve the exact saved plan');
  console.log('  --allow-write               Required to apply a plan');
  console.log('  --resume-job <id>           Reconcile and resume an interrupted job');
  console.log('  --verify-plan <id>          Verify a completed plan by live readback');
  console.log('  --job-id <id>               Inspect one durable job');
  console.log('  --history                   List durable synchronization jobs');
  console.log('  --cancel-job <id>           Request cancellation before the next action');
  console.log('');
  console.log('  --config <path>             Profile file (default: .moodle-profiles.json)');
  console.log('  --state <path>              SQLite state file (default: .moodle-sync/state.sqlite)');
  console.log('  --format json');
}

export async function runAdaptiveCapabilities(options, contract) {
  const profileName = requiredOption(options, 'profile');
  const profile = resolvedProfile(options, profileName);
  const adapter = adaptiveAdapter(profile, contract);
  const discovery = await adapter.discoverSite();
  const capabilities = await adapter.syncCapabilities({
    courseId: options.course_id === undefined ? undefined : positiveIntegerOption(options, 'course_id')
  });
  return { profile: describeProfile(profile), discovery, capabilities };
}

export async function runAdaptiveCourseSync(options, contract) {
  if (options.plan !== undefined && options.plan_file !== undefined) {
    throw new MoodleClientError('invalid_parameters', 'Do not combine --plan with --plan-file.');
  }
  if (options.plan_file !== undefined) options = { ...options, plan: options.plan_file };
  const approving = options.approve_plan !== undefined;
  const applying = options.apply_plan !== undefined;
  const resuming = options.resume_job !== undefined;
  const verifying = options.verify_plan !== undefined;
  const inspecting = options.job_id !== undefined;
  const listing = options.history !== undefined;
  const cancelling = options.cancel_job !== undefined;
  const allowWrite = booleanOption(options, 'allow_write');
  const modes = [approving, applying, resuming, verifying, inspecting, listing, cancelling,
    options.plan !== undefined].filter(Boolean);
  if (modes.length > 1) {
    throw new MoodleClientError('invalid_parameters',
      'Planning, approval, apply, resume, verify, job, history, and cancel modes cannot be combined.');
  }
  if (!applying && !resuming && allowWrite) {
    throw new MoodleClientError('invalid_parameters', '--allow-write is only valid with --apply-plan or --resume-job.');
  }
  const store = openStateStore(options);
  try {
    const engine = createCourseSyncEngine({ stateStore: store });
    if (listing) return { jobs: store.listJobs() };
    if (inspecting) {
      const jobId = requiredOption(options, 'job_id');
      const job = store.getJob(jobId);
      if (!job) throw new MoodleClientError('not_found', `Unknown sync job: ${jobId}.`);
      return job;
    }
    if (cancelling) {
      const jobId = requiredOption(options, 'cancel_job');
      const job = store.getJob(jobId);
      if (!job) throw new MoodleClientError('not_found', `Unknown sync job: ${jobId}.`);
      if (!['queued', 'running'].includes(job.status)) {
        throw new MoodleClientError('invalid_state', `Job ${jobId} cannot be cancelled from status ${job.status}.`);
      }
      const cancelled = { ...job, status: 'cancel_requested', updated_at: new Date().toISOString() };
      store.saveJob(cancelled);
      return cancelled;
    }
    if (resuming || verifying) {
      const job = resuming ? store.getJob(requiredOption(options, 'resume_job')) : null;
      const planId = resuming ? job?.plan_id : requiredOption(options, 'verify_plan');
      if (!planId) throw new MoodleClientError('not_found', `Unknown sync job: ${options.resume_job}.`);
      const plan = store.getPlan(planId);
      if (!plan) throw new MoodleClientError('not_found', `Unknown sync plan: ${planId}.`);
      const sourceName = String(plan.source?.site?.profile ?? '');
      const targetName = String(plan.target?.site?.profile ?? '');
      if (!targetName || (resuming && !sourceName)) {
        throw new MoodleClientError('invalid_parameters', 'The stored plan does not identify its site profiles.');
      }
      const targetAdapter = adaptiveAdapter(resolvedProfile(options, targetName), contract, { allowWrite: resuming });
      if (verifying) {
        return await engine.verify({ planId, targetAdapter, jobId: options.verify_job_id });
      }
      if (!allowWrite) throw new MoodleClientError('permission_denied', 'Resuming a job requires --allow-write.');
      return await engine.apply({
        planId,
        planDigest: requiredOption(options, 'plan_digest'),
        resumeJobId: job.job_id,
        sourceAdapter: adaptiveAdapter(resolvedProfile(options, sourceName), contract),
        targetAdapter
      });
    }
    if (approving) {
      if (!booleanOption(options, 'yes')) {
        throw new MoodleClientError('permission_denied', 'Approving a sync plan requires --yes.');
      }
      const plan = readPlan(requiredOption(options, 'approve_plan'));
      const approval = {
        schema_version: 1,
        plan_id: plan.plan_id,
        digest: plan.digest,
        approved_at: new Date().toISOString(),
        expires_at: plan.expires_at,
        consumed_at: null
      };
      store.savePlan(plan);
      store.saveApproval(approval);
      return approval;
    }
    if (applying) {
      if (!allowWrite) {
        throw new MoodleClientError('permission_denied', 'Applying a sync plan requires --allow-write.');
      }
      const plan = readPlan(requiredOption(options, 'apply_plan'));
      const sourceName = String(plan.source?.site?.profile ?? '');
      const targetName = String(plan.target?.site?.profile ?? '');
      if (!sourceName || !targetName) {
        throw new MoodleClientError('invalid_parameters', 'The plan does not identify both site profiles.');
      }
      store.savePlan(plan);
      return await engine.apply({
        planId: plan.plan_id,
        planDigest: requiredOption(options, 'plan_digest'),
        sourceAdapter: adaptiveAdapter(resolvedProfile(options, sourceName), contract),
        targetAdapter: adaptiveAdapter(resolvedProfile(options, targetName), contract, { allowWrite: true })
      });
    }

    const sourceName = requiredOption(options, 'source_profile');
    const targetName = requiredOption(options, 'target_profile');
    const hasTargetCourse = options.target_course_id !== undefined;
    const createsTarget = options.create_target_category_id !== undefined;
    if (hasTargetCourse === createsTarget) {
      throw new MoodleClientError(
        'invalid_parameters',
        'Provide exactly one of --target-course-id or --create-target-category-id.'
      );
    }
    const targetCreation = createsTarget ? {
      category_id: positiveIntegerOption(options, 'create_target_category_id'),
      shortname: requiredOption(options, 'target_shortname')
    } : null;
    const plan = await engine.plan({
      sourceAdapter: adaptiveAdapter(resolvedProfile(options, sourceName), contract),
      targetAdapter: adaptiveAdapter(resolvedProfile(options, targetName), contract),
      sourceCourseId: positiveIntegerOption(options, 'source_course_id'),
      targetCourseId: hasTargetCourse ? positiveIntegerOption(options, 'target_course_id') : null,
      targetCreation,
      mapping: readMapping(options.mapping),
      policies: {
        unsupported: options.unsupported_policy ?? 'error',
        conflict: options.conflict_policy ?? 'abort'
      }
    });
    return { ...plan, plan_path: savePlan(plan, options.plan) };
  } finally {
    store.close();
  }
}
