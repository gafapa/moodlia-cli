#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildContractParameters,
  createMoodleRestClient,
  loadContractFromFile,
  loadEnvFile,
  MoodleClientError,
  normalizeClientError
} from '../client/moodle-rest-client.mjs';

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

function supportsSummaryFile(operation) {
  return operation.name === 'update_section';
}

async function prepareSummaryFileOptions(operation, rawOptions) {
  const normalizedOptions = { ...rawOptions };
  if (normalizedOptions.summary_file === undefined) {
    return normalizedOptions;
  }

  if (!supportsSummaryFile(operation)) {
    throw new MoodleClientError(
      'invalid_parameters',
      `--summary-file is not supported by ${toKebabCase(operation.name)}.`,
      { operation: operation.name, parameter: 'summary_file' }
    );
  }
  if (normalizedOptions.summary_file === true) {
    throw new MoodleClientError('invalid_parameters', '--summary-file requires a local file path.', {
      operation: operation.name,
      parameter: 'summary_file'
    });
  }
  if (normalizedOptions.summary !== undefined) {
    throw new MoodleClientError(
      'invalid_parameters',
      'Do not combine --summary with --summary-file.',
      { operation: operation.name, parameters: ['summary', 'summary_file'] }
    );
  }

  const summaryFilePath = path.resolve(String(normalizedOptions.summary_file));
  delete normalizedOptions.summary_file;
  try {
    normalizedOptions.summary = await fs.readFile(summaryFilePath, 'utf8');
  } catch (error) {
    throw new MoodleClientError(
      'invalid_parameters',
      `Unable to read summary file: ${summaryFilePath}`,
      { operation: operation.name, parameter: 'summary_file', file_path: summaryFilePath },
      error
    );
  }

  return normalizedOptions;
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

  for (const [name, value] of Object.entries(normalizedOptions)) {
    if (['format', 'help', 'no_validate_response', 'raw', 'upload_file', 'summary_file'].includes(name) || value === undefined || value === null || value === '') {
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

function printHelp(contract, operation = null) {
  if (!operation) {
    console.log('Usage: moodlia <command> [options]');
    console.log('');
    console.log('Commands:');
    for (const entry of contract.operations.filter((item) => item.transports.includes('cli'))) {
      console.log(`  ${toKebabCase(entry.name)}  ${entry.summary}`);
    }
    console.log('');
    console.log('Global options:');
    console.log('  --format json');
    console.log('  --no-validate-response');
    console.log('  --raw  Alias for --no-validate-response');
    console.log('  --help');
    return;
  }

  console.log(`Usage: moodlia ${toKebabCase(operation.name)} [options]`);
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
  if (supportsSummaryFile(operation)) {
    console.log('  --summary-file <path>  optional; reads the section summary from a UTF-8 file');
  }
  console.log('  --format <string>  optional; one of: json');
  console.log('  --no-validate-response  optional; skip contract response validation');
  console.log('  --raw  optional; alias for --no-validate-response');
}

async function main() {
  loadEnvFile(path.join(process.cwd(), '.env'));
  loadEnvFile(path.join(rootDirectory, '.env'));

  const contract = loadContractFromFile(contractPath);
  const { positional, options } = parseArguments(process.argv.slice(2));
  const command = positional[0];

  if (!command || options.help) {
    const operation = command
      ? contract.operations.find((entry) => toKebabCase(entry.name) === command && entry.transports.includes('cli'))
      : null;
    printHelp(contract, operation);
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

  const summaryOptions = await prepareSummaryFileOptions(operation, options);
  const prepared = prepareUploadFileOptions(operation, summaryOptions);
  buildParameters(operation, prepared.options);
  const client = createMoodleRestClient({
    baseUrl: process.env.MOODLE_BASE_URL,
    token: process.env.MOODLE_REST_TOKEN,
    contract,
    validateResponses: !(options.no_validate_response || options.raw)
  });
  const resolvedOptions = await resolveUploadFile(prepared, client);
  const parameters = buildParameters(operation, resolvedOptions);
  const payload = await client.callOperation(operation.name, parameters);
  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify(normalizeClientError(error).toJSON()));
  process.exitCode = 1;
});
