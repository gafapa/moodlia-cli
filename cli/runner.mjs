import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exitCodeForError, exitCodeForResult } from 'moodle-core-cli/exit-codes';
import { runMoodleCoreCli } from 'moodle-core-cli/cli-runner';
import { loadProfiles, resolveProfile } from 'moodle-core-cli/profiles';
import { commandLineFileRoots } from 'moodle-core-cli/transport';
import {
  buildContractParameters,
  createMoodleRestClient,
  loadContractFromFile,
  loadEnvFile,
  MoodleClientError,
  normalizeClientError
} from '../client/moodle-rest-client.mjs';
import {
  printAdaptiveCapabilitiesHelp,
  printAdaptiveSyncHelp,
  runAdaptiveCapabilities,
  runAdaptiveCourseSync
} from './adaptive-commands.mjs';
import {
  printAdaptiveCourseAuditHelp,
  printAdaptiveCourseCompletionAuditHelp,
  printAdaptiveCourseCompletionRepairHelp,
  printAdaptiveCourseProgressHelp,
  printAdaptiveEnrolmentSyncHelp,
  runAdaptiveCourseAudit,
  runAdaptiveCourseCompletionAudit,
  runAdaptiveCourseCompletionRepair,
  runAdaptiveCourseProgress,
  runAdaptiveEnrolmentSync
} from './adaptive-workflow-commands.mjs';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractPath = path.join(rootDirectory, 'contract', 'operations.json');

function toKebabCase(value) {
  return value.replaceAll('_', '-');
}

function toSnakeCase(value) {
  return value.replaceAll('-', '_');
}

function supportsUploadFile(operation) {
  return Object.hasOwn(operation.parameters ?? {}, 'upload_reference')
    || operation.name === 'create_module';
}

const TEXT_FILE_FIELDS = ['content', 'summary', 'intro', 'activity', 'message', 'definition', 'description', 'question_text'];

function textFileFields(operation) {
  return TEXT_FILE_FIELDS.filter((field) => operation.parameters?.[field]?.type === 'string');
}

function textFileDescription(operation, field) {
  switch (field) {
    case 'summary': return operation.name.includes('section') ? 'the section summary' : 'the course summary';
    case 'intro': return operation.name === 'update_assignment' ? 'the assignment description' : 'the activity description';
    case 'activity': return 'the assignment instructions';
    case 'message': return 'the post message';
    case 'definition': return 'the glossary definition';
    case 'question_text': return 'the question text';
    case 'description': return 'the description';
    default: return 'the operation content';
  }
}

async function prepareTextFileOptions(operation, rawOptions) {
  const normalizedOptions = { ...rawOptions };
  const supported = textFileFields(operation);
  for (const field of TEXT_FILE_FIELDS) {
    const localOption = `${field}_file`;
    if (normalizedOptions[localOption] === undefined) {
      continue;
    }
    if (!supported.includes(field)) {
      throw new MoodleClientError(
        'invalid_parameters',
        `--${toKebabCase(localOption)} is not supported by ${toKebabCase(operation.name)}.`,
        { operation: operation.name, parameter: localOption }
      );
    }
    if (normalizedOptions[localOption] === true) {
      throw new MoodleClientError(
        'invalid_parameters',
        `--${toKebabCase(localOption)} requires a local file path.`,
        { operation: operation.name, parameter: localOption }
      );
    }
    if (normalizedOptions[field] !== undefined) {
      throw new MoodleClientError(
        'invalid_parameters',
        `Do not combine --${toKebabCase(field)} with --${toKebabCase(localOption)}.`,
        { operation: operation.name, parameters: [field, localOption] }
      );
    }

    const textFilePath = path.resolve(String(normalizedOptions[localOption]));
    delete normalizedOptions[localOption];
    try {
      normalizedOptions[field] = (await fs.readFile(textFilePath, 'utf8')).replace(/^﻿/, '');
    } catch (error) {
      throw new MoodleClientError(
        'invalid_parameters',
        `Unable to read ${field.replaceAll('_', ' ')} file: ${textFilePath}`,
        { operation: operation.name, parameter: localOption, file_path: textFilePath },
        error
      );
    }
  }
  return normalizedOptions;
}

function explicitLocalFiles(options) {
  return [
    options.upload_file,
    ...TEXT_FILE_FIELDS.map((field) => options[`${field}_file`])
  ].filter((value) => typeof value === 'string' && value.trim() !== '');
}

function parseArguments(argv) {
  const positional = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) {
      positional.push(argument);
      continue;
    }

    const raw = argument.slice(2);
    if (raw === 'help') {
      options.help = true;
      continue;
    }

    const inlineSeparator = raw.indexOf('=');
    if (inlineSeparator !== -1) {
      options[toSnakeCase(raw.slice(0, inlineSeparator))] = raw.slice(inlineSeparator + 1);
      continue;
    }

    const key = toSnakeCase(raw);
    const next = argv[index + 1];
    if (next === undefined || next.startsWith('--')) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return { positional, options };
}

function prepareUploadFileOptions(operation, rawOptions) {
  const normalizedOptions = { ...rawOptions };
  if (normalizedOptions.upload_file === undefined) {
    return { options: normalizedOptions, upload: null };
  }

  if (!supportsUploadFile(operation)) {
    throw new MoodleClientError(
      'invalid_parameters',
      `--upload-file is not supported by ${toKebabCase(operation.name)}.`,
      { operation: operation.name, parameter: 'upload_file' }
    );
  }
  if (normalizedOptions.upload_file === true) {
    throw new MoodleClientError('invalid_parameters', '--upload-file requires a local file path.', {
      operation: operation.name,
      parameter: 'upload_file'
    });
  }

  const uploadFilePath = path.resolve(String(normalizedOptions.upload_file));
  delete normalizedOptions.upload_file;
  if (Object.hasOwn(operation.parameters ?? {}, 'upload_reference')) {
    if (normalizedOptions.upload_reference !== undefined || normalizedOptions.draft_item_id !== undefined) {
      throw new MoodleClientError(
        'invalid_parameters',
        'Do not combine --upload-file with --upload-reference or --draft-item-id.',
        { operation: operation.name, parameters: ['upload_file', 'upload_reference', 'draft_item_id'] }
      );
    }
    normalizedOptions.filename ??= path.basename(uploadFilePath);
    return {
      options: normalizedOptions,
      upload: { filePath: uploadFilePath, filename: normalizedOptions.filename, target: 'operation' }
    };
  }

  if (String(normalizedOptions.module_type ?? '') !== 'resource') {
    throw new MoodleClientError(
      'invalid_parameters',
      '--upload-file with create-module requires --module-type resource.',
      { operation: operation.name, parameter: 'module_type' }
    );
  }
  let resourceOptions = {};
  if (normalizedOptions.options !== undefined && normalizedOptions.options !== '') {
    try {
      resourceOptions = typeof normalizedOptions.options === 'object'
        ? { ...normalizedOptions.options }
        : JSON.parse(String(normalizedOptions.options));
    } catch (error) {
      throw new MoodleClientError('invalid_parameters', '--options must be valid JSON.', {
        operation: operation.name,
        parameter: 'options'
      }, error);
    }
  }
  if (!resourceOptions || typeof resourceOptions !== 'object' || Array.isArray(resourceOptions)) {
    throw new MoodleClientError('invalid_parameters', '--options must be a JSON object.', {
      operation: operation.name,
      parameter: 'options'
    });
  }
  if (resourceOptions.upload_reference !== undefined || resourceOptions.draft_item_id !== undefined) {
    throw new MoodleClientError(
      'invalid_parameters',
      'Do not combine --upload-file with options.upload_reference or options.draft_item_id.',
      { operation: operation.name, parameters: ['upload_file', 'options.upload_reference', 'options.draft_item_id'] }
    );
  }
  resourceOptions.filename ??= path.basename(uploadFilePath);
  normalizedOptions.options = resourceOptions;
  return {
    options: normalizedOptions,
    upload: { filePath: uploadFilePath, filename: resourceOptions.filename, target: 'resource_options' }
  };
}

async function resolveUploadFile(prepared, client) {
  if (!prepared.upload) {
    return prepared.options;
  }

  const uploaded = await client.uploadDraftFile(prepared.upload.filePath, {
    filename: prepared.upload.filename
  });
  const normalizedOptions = { ...prepared.options };
  if (prepared.upload.target === 'operation') {
    normalizedOptions.filename = uploaded.filename;
    normalizedOptions.draft_item_id = uploaded.draft_item_id;
    return normalizedOptions;
  }

  normalizedOptions.options = {
    ...normalizedOptions.options,
    filename: uploaded.filename,
    draft_item_id: uploaded.draft_item_id
  };
  return normalizedOptions;
}

function buildParameters(operation, rawOptions) {
  const normalizedOptions = { ...rawOptions };

  const parameterOptions = {};
  for (const [name, definition] of Object.entries(operation.parameters ?? {})) {
    if ((normalizedOptions[name] === undefined || normalizedOptions[name] === null || normalizedOptions[name] === '') && definition.required) {
      throw new MoodleClientError('invalid_parameters', `Missing required option --${toKebabCase(name)}.`, {
        operation: operation.name,
        parameter: name
      });
    }
    if (normalizedOptions[name] !== undefined) {
      parameterOptions[name] = normalizedOptions[name];
    }
  }

  const localOptionNames = [
    'format',
    'help',
    'no_validate_response',
    'raw',
    'upload_file',
    'max_response_bytes',
    'max_upload_bytes',
    'max_download_bytes',
    ...TEXT_FILE_FIELDS.map((field) => `${field}_file`)
  ];
  for (const [name, value] of Object.entries(normalizedOptions)) {
    if (localOptionNames.includes(name) || value === undefined || value === null || value === '') {
      continue;
    }
    if (!Object.hasOwn(operation.parameters ?? {}, name)) {
      throw new MoodleClientError('invalid_parameters', `Unknown option --${toKebabCase(name)} for ${toKebabCase(operation.name)}.`, {
        operation: operation.name,
        parameter: name
      });
    }
  }

  return buildContractParameters(operation, parameterOptions);
}

function describeOption(definition) {
  const details = [];
  details.push(definition.required ? 'required' : 'optional');
  if (Array.isArray(definition.enum)) {
    details.push(`one of: ${definition.enum.join(', ')}`);
  }
  if (definition.minimum !== undefined) {
    details.push(`min: ${definition.minimum}`);
  }
  if (definition.maximum !== undefined) {
    details.push(`max: ${definition.maximum}`);
  }
  if (definition.type === 'object') {
    details.push('JSON object');
  }

  return details.join('; ');
}

function printHelp(contract, operation = null, commandPrefix = 'moodlia') {
  if (!operation) {
    console.log(`Usage: ${commandPrefix} <command> [options]`);
    console.log('');
    console.log('Commands:');
    console.log('  capabilities  Inspect adaptive Core and MoodlIA capabilities');
    console.log('  course sync   Plan or apply cross-site course synchronization');
    console.log('  sync-course   Alias for course sync');
    console.log('  course audit  Evidence-based adaptive course audit');
    console.log('  course progress  Adaptive progress and grade report');
    console.log('  course completion audit  Adaptive completion configuration audit');
    console.log('  course completion repair Plan or apply a typed completion repair');
    console.log('  enrolments sync  Plan or apply add-only manual enrolments');
    if (commandPrefix === 'moodlia') {
      console.log('  core <command>    Run an explicit Moodle Core operation in-process');
      console.log('  plugin <command>  Run an explicit MoodlIA plugin operation');
    }
    for (const entry of contract.operations.filter((item) => item.transports.includes('cli'))) {
      console.log(`  ${toKebabCase(entry.name)}  ${entry.summary}`);
    }
    console.log('');
    console.log('Global options:');
    console.log('  --format json');
    console.log('  --no-validate-response');
    console.log('  --raw  Alias for --no-validate-response');
    console.log('  --help');
    console.log('');
    console.log('Exit codes: 0 success, 1 internal, 2 validation, 3 capability gap, 4 conflict,');
    console.log('            5 remote failure, 6 partial execution, 7 verification failure.');
    return;
  }

  console.log(`Usage: ${commandPrefix} ${toKebabCase(operation.name)} [options]`);
  console.log('');
  console.log(operation.summary);
  console.log('');
  console.log('Options:');
  for (const [name, definition] of Object.entries(operation.parameters)) {
    console.log(`  --${toKebabCase(name)} <${definition.type}>  ${describeOption(definition)}`);
  }
  if (supportsUploadFile(operation)) {
    const qualifier = operation.name === 'create_module' ? ' for resource modules' : '';
    console.log(`  --upload-file <path>  optional${qualifier}; streams a local file to Moodle without a client-side size limit`);
  }
  for (const field of textFileFields(operation)) {
    console.log(`  --${toKebabCase(field)}-file <path>  optional; reads ${textFileDescription(operation, field)} from a UTF-8 file`);
  }
  console.log('  --max-response-bytes <n>  optional; response limit (MOODLE_MAX_RESPONSE_BYTES; default 64 MiB)');
  console.log('  --max-upload-bytes <n>  optional; streamed upload limit (MOODLE_MAX_UPLOAD_BYTES; default unlimited)');
  console.log('  --max-download-bytes <n>  optional; streamed download limit (MOODLE_MAX_DOWNLOAD_BYTES; default 2 GiB)');
  console.log('  --format <string>  optional; one of: json');
  console.log('  --no-validate-response  optional; skip contract response validation');
  console.log('  --raw  optional; alias for --no-validate-response');
}

function takeNamespaceOption(argv, name) {
  const longName = `--${name}`;
  const remaining = [];
  let value;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === longName) {
      value = argv[index + 1];
      index += 1;
    } else if (argument.startsWith(`${longName}=`)) {
      value = argument.slice(longName.length + 1);
    } else {
      remaining.push(argument);
    }
  }
  return { value, remaining };
}

function hasCliOption(argv, name) {
  const prefix = `--${name}`;
  return argv.some((argument) => argument === prefix || argument.startsWith(`${prefix}=`));
}

function prepareCoreNamespaceArguments(rawArguments) {
  const profileOption = takeNamespaceOption(rawArguments, 'profile');
  const configOption = takeNamespaceOption(profileOption.remaining, 'config');
  const argumentsForCore = [...configOption.remaining];
  if (profileOption.value !== undefined) {
    if (!profileOption.value || profileOption.value.startsWith('--')) {
      throw new MoodleClientError('invalid_parameters', '--profile requires a profile name.');
    }
    const profile = resolveProfile(loadProfiles(configOption.value ?? '.moodle-profiles.json'), profileOption.value);
    const credentials = profile.credentials.core;
    if (!credentials) {
      throw new MoodleClientError('provider_unavailable', `Profile ${profile.name} does not configure Core credentials.`);
    }
    if (!hasCliOption(argumentsForCore, 'url')) argumentsForCore.push('--url', profile.url);
    if (!hasCliOption(argumentsForCore, 'token')) argumentsForCore.push('--token', credentials.token);
    if (profile.allow_insecure && !hasCliOption(argumentsForCore, 'allow-insecure')) {
      argumentsForCore.push('--allow-insecure');
    }
  } else if (!hasCliOption(argumentsForCore, 'token')
      && !process.env.MOODLE_TOKEN
      && process.env.MOODLE_REST_TOKEN) {
    argumentsForCore.push('--token', process.env.MOODLE_REST_TOKEN);
  }
  return argumentsForCore;
}

export async function runMoodliaCli(rawArguments = process.argv.slice(2)) {
  loadEnvFile(path.join(process.cwd(), '.env'));
  loadEnvFile(path.join(rootDirectory, '.env'));

  if (rawArguments[0] === 'core') {
    const coreArguments = rawArguments.length === 1 ? ['--help'] : rawArguments.slice(1);
    await runMoodleCoreCli(prepareCoreNamespaceArguments(coreArguments));
    return;
  }

  const contract = loadContractFromFile(contractPath);
  const { positional, options } = parseArguments(rawArguments);
  const pluginNamespace = positional[0] === 'plugin';
  const command = pluginNamespace ? positional[1] : positional[0];
  const syncSubcommand = command === 'sync' ? positional[1] : null;
  const groupedSyncCommand = ['status', 'resume', 'verify', 'history', 'cancel'].includes(syncSubcommand);
  const workflowRouting = !pluginNamespace;
  const syncCommand = workflowRouting && ((command === 'course' && positional[1] === 'sync')
    || command === 'sync-course'
    || groupedSyncCommand);
  const auditCommand = workflowRouting && ((command === 'course' && positional[1] === 'audit') || command === 'audit-course');
  const progressCommand = workflowRouting && ((command === 'course' && positional[1] === 'progress') || command === 'course-progress');
  const completionAuditCommand = workflowRouting && command === 'course' && positional[1] === 'completion' && positional[2] === 'audit';
  const completionRepairCommand = workflowRouting && command === 'course' && positional[1] === 'completion' && positional[2] === 'repair';
  const enrolmentSyncCommand = workflowRouting && ((command === 'enrolments' && positional[1] === 'sync') || command === 'sync-enrolments');

  if (workflowRouting && command === 'capabilities') {
    if (options.help) {
      printAdaptiveCapabilitiesHelp();
      return;
    }
    const payload = await runAdaptiveCapabilities(options, contract);
    console.log(JSON.stringify(payload, null, 2));
    process.exitCode = exitCodeForResult(payload);
    return;
  }
  if (syncCommand) {
    if (options.help) {
      printAdaptiveSyncHelp();
      return;
    }
    const { job_id: groupedJobId, plan_id: groupedPlanId, binding_id: groupedBindingId,
      ...groupedBaseOptions } = options;
    const groupedOptions = syncSubcommand === 'status'
      ? { ...groupedBaseOptions, job_id: groupedJobId }
      : syncSubcommand === 'resume'
        ? { ...groupedBaseOptions, resume_job: groupedJobId }
        : syncSubcommand === 'verify'
          ? {
              ...groupedBaseOptions,
              verify_plan: groupedPlanId ?? groupedBindingId,
              verify_job_id: groupedJobId
            }
          : syncSubcommand === 'history'
            ? { ...groupedBaseOptions, history: true }
            : syncSubcommand === 'cancel'
              ? { ...groupedBaseOptions, cancel_job: groupedJobId }
              : options;
    const payload = await runAdaptiveCourseSync(groupedOptions, contract);
    console.log(JSON.stringify(payload, null, 2));
    process.exitCode = exitCodeForResult(payload);
    return;
  }
  if (auditCommand || progressCommand || completionAuditCommand || completionRepairCommand || enrolmentSyncCommand) {
    if (options.help) {
      if (auditCommand) printAdaptiveCourseAuditHelp();
      else if (progressCommand) printAdaptiveCourseProgressHelp();
      else if (completionAuditCommand) printAdaptiveCourseCompletionAuditHelp();
      else if (completionRepairCommand) printAdaptiveCourseCompletionRepairHelp();
      else printAdaptiveEnrolmentSyncHelp();
      return;
    }
    const payload = auditCommand
      ? await runAdaptiveCourseAudit(options, contract)
      : progressCommand
        ? await runAdaptiveCourseProgress(options, contract)
        : completionAuditCommand
          ? await runAdaptiveCourseCompletionAudit(options, contract)
          : completionRepairCommand
            ? await runAdaptiveCourseCompletionRepair(options, contract)
            : await runAdaptiveEnrolmentSync(options, contract);
    console.log(JSON.stringify(payload, null, 2));
    process.exitCode = exitCodeForResult(payload);
    return;
  }

  if (!command || options.help) {
    const operation = command
      ? contract.operations.find((entry) => toKebabCase(entry.name) === command && entry.transports.includes('cli'))
      : null;
    printHelp(contract, operation, pluginNamespace ? 'moodlia plugin' : 'moodlia');
    return;
  }

  const operation = contract.operations.find((entry) => toKebabCase(entry.name) === command && entry.transports.includes('cli'));
  if (!operation) {
    throw new MoodleClientError('invalid_parameters', `Unknown command: ${command}`, {
      command
    });
  }

  const format = options.format ?? 'json';
  if (format !== 'json') {
    throw new MoodleClientError('invalid_parameters', 'Only --format json is currently supported.', {
      parameter: 'format',
      allowed_values: ['json']
    });
  }

  const textOptions = await prepareTextFileOptions(operation, options);
  const prepared = prepareUploadFileOptions(operation, textOptions);
  buildParameters(operation, prepared.options);
  const byteOption = (name) => (options[name] === undefined ? undefined : Number(options[name]));
  const client = createMoodleRestClient({
    baseUrl: process.env.MOODLE_BASE_URL,
    token: process.env.MOODLE_REST_TOKEN,
    contract,
    validateResponses: !(options.no_validate_response || options.raw),
    allowedFileRoots: commandLineFileRoots(explicitLocalFiles(options)),
    environment: process.env,
    maximumResponseBytes: byteOption('max_response_bytes'),
    maximumUploadBytes: byteOption('max_upload_bytes'),
    maximumDownloadBytes: byteOption('max_download_bytes')
  });
  const resolvedOptions = await resolveUploadFile(prepared, client);
  const parameters = buildParameters(operation, resolvedOptions);
  const payload = await client.callOperation(operation.name, parameters);
  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = exitCodeForResult(payload);
}

export function reportMoodliaCliError(error) {
  console.error(JSON.stringify(normalizeClientError(error).toJSON()));
  process.exitCode = exitCodeForError(error);
}
