import fs from 'node:fs';
import {
  DEFAULT_LIMITS,
  MoodleClientError,
  MoodlePayloadTooLargeError,
  assertResponseOrigin,
  normalizeAllowedFileRoots,
  normalizeClientError,
  normalizeMoodleBaseUrl,
  openUploadSource,
  parseLimitedJsonResponse,
  postDraftUpload,
  readLimitedResponse,
  redactTextValues,
  resolveAllowedDestination,
  resolveByteLimit,
  resolveMoodleUrl as resolveKernelMoodleUrl,
  streamResponseToFile
} from 'moodle-core-cli/transport';

export { MoodleClientError, MoodlePayloadTooLargeError, normalizeClientError };

// MoodlIA keeps its public error codes; the shared Core kernel supplies
// limits, streaming, file-root checks, and redaction.
const moodliaErrors = Object.freeze({
  configuration: (message, details = {}, cause = null) => new MoodleClientError('invalid_parameters', message, details, cause),
  validation: (message, details = {}, cause = null) => new MoodleClientError('invalid_parameters', message, details, cause),
  permission: (message, details = {}, cause = null) => new MoodleClientError('permission_denied', message, details, cause),
  connection: (message, details = {}, cause = null) => new MoodleClientError('transport_error', message, details, cause)
});

const DEFAULT_ASSET_BYTES = 50 * 1024 * 1024;

export function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function loadContractFromFile(contractPath) {
  return JSON.parse(fs.readFileSync(contractPath, 'utf8').replace(/^﻿/, ''));
}

export function encodeFileForUpload(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new MoodleClientError('invalid_parameters', 'An upload file path is required.', {
      parameter: 'filePath'
    });
  }

  try {
    return fs.readFileSync(filePath).toString('base64');
  } catch (error) {
    throw new MoodleClientError('invalid_parameters', `Unable to read upload file: ${filePath}`, {
      parameter: 'filePath',
      file_path: filePath
    }, error);
  }
}

function assertTimeout(value, parameter) {
  if (!Number.isFinite(value) || value < 0) {
    throw new MoodleClientError('invalid_parameters', `${parameter} must be a non-negative finite number.`, {
      parameter
    });
  }
}

function moodleErrorCode(payload) {
  const errorCode = String(payload?.errorcode ?? '').toLowerCase();
  const exception = String(payload?.exception ?? '').toLowerCase();
  const combined = `${errorCode} ${exception}`;

  if (combined.includes('invalid') || combined.includes('parameter')) {
    return 'invalid_parameters';
  }
  if (combined.includes('capability') || combined.includes('permission') || combined.includes('access')) {
    return 'missing_capability';
  }
  if (combined.includes('notfound') || combined.includes('not_found')) {
    return 'not_found';
  }
  if (combined.includes('coding_exception')) {
    return 'internal_error';
  }

  return 'moodle_error';
}

function moodleBusinessError(payload, token, fallbackMessage, context = {}) {
  const errorCode = moodleErrorCode(payload);
  return new MoodleClientError(errorCode, redactTextValues(payload.message, [token]) || fallbackMessage, {
    ...context,
    moodle_errorcode: payload.errorcode,
    moodle_exception: payload.exception,
    ...(errorCode !== 'internal_error' && payload.debuginfo
      ? { moodle_debuginfo: redactTextValues(payload.debuginfo, [token]) }
      : {})
  });
}

function draftUploadResult(response, payload, fallback, token) {
  if (!response.ok) {
    throw new MoodleClientError('transport_error', `Moodle draft upload failed with HTTP ${response.status}.`, {
      http_status: response.status
    });
  }
  if (payload?.exception || payload?.errorcode) {
    throw moodleBusinessError(payload, token, 'Moodle draft upload failed.');
  }
  const uploaded = Array.isArray(payload) ? payload[0] : null;
  if (!uploaded || uploaded.error || !Number.isInteger(Number(uploaded.itemid)) || Number(uploaded.itemid) <= 0) {
    throw new MoodleClientError(
      'file_upload_failed',
      uploaded?.error || 'Moodle did not return a draft item id.',
      { error_type: uploaded?.errortype }
    );
  }
  return {
    draft_item_id: Number(uploaded.itemid),
    filename: String(uploaded.filename ?? fallback.filename),
    filepath: String(uploaded.filepath ?? fallback.filepath),
    filesize: Number(uploaded.filesize ?? uploaded.size ?? fallback.filesize)
  };
}

export async function uploadFileToMoodleDraft({
  baseUrl,
  token,
  filePath,
  filename = null,
  filepath = '/',
  itemId = 0,
  timeoutMs = 0,
  fetchImplementation = globalThis.fetch,
  allowInsecure = false,
  allowedFileRoots = null,
  maximumUploadBytes = Infinity,
  maximumResponseBytes = DEFAULT_LIMITS.maximumResponseBytes
} = {}) {
  if (!baseUrl || !token) {
    throw new MoodleClientError(
      'invalid_parameters',
      'A Moodle base URL and REST token are required for draft uploads.',
      { required: ['baseUrl', 'token'] }
    );
  }
  if (typeof fetchImplementation !== 'function') {
    throw new MoodleClientError('invalid_parameters', 'A fetch implementation is required.');
  }
  assertTimeout(timeoutMs, 'timeoutMs');
  if (!Number.isInteger(itemId) || itemId < 0) {
    throw new MoodleClientError('invalid_parameters', 'itemId must be a non-negative integer.', {
      parameter: 'itemId'
    });
  }
  const source = await openUploadSource(filePath, {
    allowedFileRoots: normalizeAllowedFileRoots(allowedFileRoots, moodliaErrors),
    maximumBytes: maximumUploadBytes,
    errors: moodliaErrors
  });
  const resolvedFilename = filename ?? source.filename;
  const { response, payload } = await postDraftUpload({
    baseUrl,
    token,
    body: source.blob,
    filename: resolvedFilename,
    filepath,
    itemId,
    timeoutMs,
    fetchImplementation,
    allowInsecure,
    maximumResponseBytes,
    errors: moodliaErrors
  });
  return draftUploadResult(response, payload, {
    filename: resolvedFilename,
    filepath,
    filesize: source.size
  }, token);
}

export async function uploadDataToMoodleDraft({
  baseUrl,
  token,
  data,
  filename,
  filepath = '/',
  itemId = 0,
  timeoutMs = 0,
  fetchImplementation = globalThis.fetch,
  allowInsecure = false,
  maximumResponseBytes = DEFAULT_LIMITS.maximumResponseBytes
} = {}) {
  if (!baseUrl || !token || !(data instanceof Uint8Array)) {
    throw new MoodleClientError('invalid_parameters', 'A Moodle URL, token, and Uint8Array are required.');
  }
  const { response, payload } = await postDraftUpload({
    baseUrl,
    token,
    body: new Blob([data]),
    filename,
    filepath,
    itemId,
    timeoutMs,
    fetchImplementation,
    allowInsecure,
    maximumResponseBytes,
    errors: moodliaErrors
  });
  if (!response.ok || payload?.exception || payload?.errorcode) {
    throw new MoodleClientError(
      'file_upload_failed',
      redactTextValues(payload?.message, [token]) ?? `Upload failed with HTTP ${response.status}.`
    );
  }
  return draftUploadResult(response, payload, { filename, filepath, filesize: data.byteLength }, token);
}

function webServiceFileUrl(baseUrl, url, token, allowInsecure) {
  const base = normalizeMoodleBaseUrl(baseUrl, { allowInsecure, errors: moodliaErrors, parameter: 'MOODLE_BASE_URL' });
  const target = new URL(String(url), base);
  // Operations such as backup_course return browser pluginfile URLs; tokens
  // only authenticate through the webservice endpoint.
  const browserPrefix = `${base.pathname}pluginfile.php/`;
  if (target.origin === base.origin && target.pathname.startsWith(browserPrefix)) {
    target.pathname = `${base.pathname}webservice/pluginfile.php/${target.pathname.slice(browserPrefix.length)}`;
  }
  if (target.origin !== base.origin || !target.pathname.includes('/webservice/pluginfile.php/')) {
    throw new MoodleClientError('permission_denied', 'Asset downloads must use the configured Moodle webservice file endpoint.');
  }
  target.searchParams.set('token', String(token));
  return target;
}

async function fetchWebServiceFile(target, fetchImplementation) {
  let response;
  try {
    response = await fetchImplementation(target, { redirect: 'error' });
  } catch (error) {
    throw new MoodleClientError('transport_error', 'Moodle file download failed.', {}, error);
  }
  if (!response.ok) {
    throw new MoodleClientError('transport_error', `Moodle file download failed with HTTP ${response.status}.`);
  }
  assertResponseOrigin(response, target, moodliaErrors);
  return response;
}

export async function downloadFileFromMoodle({
  baseUrl,
  token,
  url,
  maximumBytes = DEFAULT_ASSET_BYTES,
  fetchImplementation = globalThis.fetch,
  allowInsecure = false
} = {}) {
  const target = webServiceFileUrl(baseUrl, url, token, allowInsecure);
  const response = await fetchWebServiceFile(target, fetchImplementation);
  const data = await readLimitedResponse(response, maximumBytes, 'Moodle file download', 'maximumDownloadBytes');
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

export async function downloadFileFromMoodleToPath({
  baseUrl,
  token,
  url,
  destinationPath,
  maximumBytes = DEFAULT_ASSET_BYTES,
  fetchImplementation = globalThis.fetch,
  allowInsecure = false,
  allowedFileRoots = null
} = {}) {
  const target = webServiceFileUrl(baseUrl, url, token, allowInsecure);
  if (typeof destinationPath !== 'string' || destinationPath.trim() === '') {
    throw new MoodleClientError('invalid_parameters', 'A destination path is required for streamed downloads.');
  }
  const resolvedPath = await resolveAllowedDestination(
    destinationPath,
    normalizeAllowedFileRoots(allowedFileRoots, moodliaErrors),
    moodliaErrors
  );
  const response = await fetchWebServiceFile(target, fetchImplementation);
  try {
    const { size, sha256 } = await streamResponseToFile(response, resolvedPath, { maximumBytes, hash: true });
    return { path: resolvedPath, filesize: size, sha256 };
  } catch (error) {
    if (error instanceof MoodleClientError) throw error;
    throw new MoodleClientError('transport_error', 'Unable to stream a Moodle asset to the protected cache.', {}, error);
  }
}

export function toRestFunctionName(contract, operationName) {
  return `${contract.restPrefix}_${operationName}`;
}

export function resolveMoodleUrl(baseUrl, relativePath, options = {}) {
  const relative = String(relativePath ?? '').replace(/^\/+/, '');
  if (!relative) {
    throw new MoodleClientError('invalid_parameters', 'Moodle URL paths must be non-empty relative paths.', {
      parameter: 'relativePath'
    });
  }
  return resolveKernelMoodleUrl(baseUrl, relative, {
    ...options,
    errors: moodliaErrors,
    parameter: 'MOODLE_BASE_URL'
  });
}

function findOperation(contract, operationName) {
  return contract?.operations?.find((operation) => operation.name === operationName) ?? null;
}

function validateEnum(value, definition, key) {
  if (Array.isArray(definition.enum) && !definition.enum.includes(String(value))) {
    throw new MoodleClientError('invalid_parameters', `${key} must be one of: ${definition.enum.join(', ')}.`, {
      parameter: key,
      allowed_values: definition.enum
    });
  }
}

function validateRange(value, definition, key) {
  if (definition.minimum !== undefined && value < definition.minimum) {
    throw new MoodleClientError('invalid_parameters', `${key} must be at least ${definition.minimum}.`, {
      parameter: key,
      minimum: definition.minimum
    });
  }

  if (definition.maximum !== undefined && value > definition.maximum) {
    throw new MoodleClientError('invalid_parameters', `${key} must be at most ${definition.maximum}.`, {
      parameter: key,
      maximum: definition.maximum
    });
  }
}

function coerceParameter(value, definition, key, encoding = 'form') {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  switch (definition.type) {
    case 'integer': {
      const raw = String(value).trim();
      if (!/^[+-]?\d+$/.test(raw)) {
        throw new MoodleClientError('invalid_parameters', `${key} must be an integer.`, { parameter: key });
      }
      const parsed = Number.parseInt(raw, 10);
      if (!Number.isInteger(parsed)) {
        throw new MoodleClientError('invalid_parameters', `${key} must be an integer.`, { parameter: key });
      }
      validateEnum(parsed, definition, key);
      validateRange(parsed, definition, key);
      return parsed;
    }
    case 'number': {
      const raw = String(value).trim();
      if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
        throw new MoodleClientError('invalid_parameters', `${key} must be a number.`, { parameter: key });
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        throw new MoodleClientError('invalid_parameters', `${key} must be a number.`, { parameter: key });
      }
      validateEnum(parsed, definition, key);
      validateRange(parsed, definition, key);
      return parsed;
    }
    case 'boolean': {
      let parsed;
      if (typeof value === 'boolean') {
        parsed = value;
      } else if (['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())) {
        parsed = true;
      } else if (['0', 'false', 'no', 'off'].includes(String(value).toLowerCase())) {
        parsed = false;
      } else {
        throw new MoodleClientError('invalid_parameters', `${key} must be a boolean.`, { parameter: key });
      }
      validateEnum(parsed ? '1' : '0', definition, key);
      return encoding === 'json' ? parsed : (parsed ? 1 : 0);
    }
    case 'object': {
      const encoded = typeof value === 'object' ? JSON.stringify(value) : String(value);
      let parsed;
      try {
        parsed = JSON.parse(encoded);
      } catch (error) {
        throw new MoodleClientError('invalid_parameters', `${key} must be valid JSON.`, { parameter: key }, error);
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new MoodleClientError('invalid_parameters', `${key} must be a JSON object.`, { parameter: key });
      }
      return encoding === 'json' ? parsed : encoded;
    }
    case 'array': {
      const encoded = Array.isArray(value) ? value : String(value);
      let parsed;
      try {
        parsed = Array.isArray(encoded) ? encoded : JSON.parse(encoded);
      } catch (error) {
        throw new MoodleClientError('invalid_parameters', `${key} must be a valid JSON array.`, { parameter: key }, error);
      }
      if (!Array.isArray(parsed)) {
        throw new MoodleClientError('invalid_parameters', `${key} must be a JSON array.`, { parameter: key });
      }
      if (definition.items === 'integer' && parsed.some((item) => !Number.isInteger(Number(item)))) {
        throw new MoodleClientError('invalid_parameters', `${key} must contain only integers.`, { parameter: key });
      }
      return definition.items === 'integer' ? parsed.map((item) => Number(item)) : parsed;
    }
    default:
      validateEnum(value, definition, key);
      return String(value);
  }
}

export function buildContractParameters(operation, parameters = {}, { encoding = 'form' } = {}) {
  if (!['form', 'json'].includes(encoding)) {
    throw new MoodleClientError('invalid_parameters', 'Parameter encoding must be form or json.', {
      parameter: 'encoding'
    });
  }

  const result = {};
  const definitions = operation.parameters ?? {};

  for (const [name, definition] of Object.entries(definitions)) {
    const value = parameters[name];
    if ((value === undefined || value === null || value === '') && definition.required) {
      throw new MoodleClientError('invalid_parameters', `Missing required parameter ${name}.`, {
        parameter: name
      });
    }
    if (value !== undefined && value !== null && value !== '') {
      result[name] = coerceParameter(value, definition, name, encoding);
    }
  }

  const unknown = Object.keys(parameters).filter((key) =>
    !Object.hasOwn(definitions, key) &&
    parameters[key] !== undefined &&
    parameters[key] !== null &&
    parameters[key] !== ''
  );
  if (unknown.length > 0) {
    throw new MoodleClientError(
      'invalid_parameters',
      `Unknown parameter(s) for ${operation.name}: ${unknown.join(', ')}.`,
      {
        operation: operation.name,
        parameters: unknown
      }
    );
  }

  return result;
}

function baseReturnType(definition) {
  return typeof definition === 'string' ? definition.split(';')[0].trim() : definition;
}

function returnTypeAlternatives(definition) {
  const base = baseReturnType(definition);
  if (typeof base !== 'string') {
    return [base];
  }

  return base.split('|').map((part) => part.trim()).filter(Boolean);
}

function validateReturnValue(value, definition, path) {
  const alternatives = returnTypeAlternatives(definition);
  if ((value === null || value === undefined) && alternatives.includes('null')) {
    return;
  }

  const normalized = alternatives.find((entry) => entry !== 'null') ?? alternatives[0];
  if (value === null || value === undefined) {
    throw new MoodleClientError('invalid_response', `${path} is missing from the response.`, { path });
  }

  if (Array.isArray(normalized)) {
    if (!Array.isArray(value)) {
      throw new MoodleClientError('invalid_response', `${path} must be an array.`, { path });
    }
    if (normalized.length > 0) {
      for (let index = 0; index < value.length; index += 1) {
        validateReturnValue(value[index], normalized[0], `${path}[${index}]`);
      }
    }
    return;
  }

  if (normalized && typeof normalized === 'object') {
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new MoodleClientError('invalid_response', `${path} must be an object.`, { path });
    }
    for (const [name, childDefinition] of Object.entries(normalized)) {
      validateReturnValue(value[name], childDefinition, `${path}.${name}`);
    }
    return;
  }

  const expected = String(normalized);
  const actualType = Number.isInteger(value) ? 'integer' : typeof value;
  if (expected === 'array') {
    if (!Array.isArray(value)) {
      throw new MoodleClientError('invalid_response', `${path} must be an array.`, { path });
    }
    return;
  }
  if (expected === 'integer') {
    if (!Number.isInteger(value)) {
      throw new MoodleClientError('invalid_response', `${path} must be an integer.`, { path, actual_type: actualType });
    }
    return;
  }
  if (expected === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new MoodleClientError('invalid_response', `${path} must be a number.`, { path, actual_type: actualType });
    }
    return;
  }
  if (['string', 'boolean'].includes(expected) && typeof value !== expected) {
    throw new MoodleClientError('invalid_response', `${path} must be a ${expected}.`, { path, actual_type: actualType });
  }
}

export function validateContractResponse(operation, payload) {
  if (!operation?.returns || typeof operation.returns !== 'object') {
    return payload;
  }

  validateReturnValue(payload, operation.returns, operation.name);
  return payload;
}

export class RestTransport {
  constructor({
    baseUrl,
    token,
    timeoutMs = 30000,
    uploadTimeoutMs = 0,
    fetchImplementation = globalThis.fetch,
    allowInsecure = false,
    allowedFileRoots = null,
    maximumResponseBytes,
    maximumUploadBytes,
    maximumDownloadBytes,
    environment = {}
  } = {}) {
    if (!baseUrl || !token) {
      throw new MoodleClientError(
        'invalid_parameters',
        'MOODLE_BASE_URL and MOODLE_REST_TOKEN are required.',
        { required_environment: ['MOODLE_BASE_URL', 'MOODLE_REST_TOKEN'] }
      );
    }

    if (typeof fetchImplementation !== 'function') {
      throw new MoodleClientError('invalid_parameters', 'A fetch implementation is required.');
    }
    assertTimeout(timeoutMs, 'timeoutMs');
    assertTimeout(uploadTimeoutMs, 'uploadTimeoutMs');

    this.baseUrl = normalizeMoodleBaseUrl(baseUrl, {
      allowInsecure,
      errors: moodliaErrors,
      parameter: 'MOODLE_BASE_URL'
    }).toString();
    this.token = token;
    this.timeoutMs = timeoutMs;
    this.uploadTimeoutMs = uploadTimeoutMs;
    this.fetchImplementation = fetchImplementation;
    this.allowInsecure = allowInsecure;
    this.allowedFileRoots = normalizeAllowedFileRoots(allowedFileRoots, moodliaErrors);
    const limit = (value, name, fallback) => resolveByteLimit(value, { name, fallback, environment, errors: moodliaErrors });
    // MoodlIA operations return whole blueprints and editor content, so the
    // default response limit is the bulk class; uploads stay unlimited.
    this.maximumResponseBytes = limit(maximumResponseBytes, 'maximumResponseBytes', DEFAULT_LIMITS.maximumBulkResponseBytes);
    this.maximumUploadBytes = limit(maximumUploadBytes, 'maximumUploadBytes', Infinity);
    this.maximumDownloadBytes = limit(maximumDownloadBytes, 'maximumDownloadBytes', DEFAULT_LIMITS.maximumDownloadBytes);
  }

  async uploadDraftFile(filePath, options = {}) {
    return uploadFileToMoodleDraft({
      baseUrl: this.baseUrl,
      token: this.token,
      filePath,
      timeoutMs: this.uploadTimeoutMs,
      fetchImplementation: this.fetchImplementation,
      allowInsecure: this.allowInsecure,
      allowedFileRoots: this.allowedFileRoots,
      maximumUploadBytes: this.maximumUploadBytes,
      maximumResponseBytes: this.maximumResponseBytes,
      ...options
    });
  }

  async uploadDraftData(data, options = {}) {
    return uploadDataToMoodleDraft({
      baseUrl: this.baseUrl,
      token: this.token,
      data,
      timeoutMs: this.uploadTimeoutMs,
      fetchImplementation: this.fetchImplementation,
      allowInsecure: this.allowInsecure,
      maximumResponseBytes: this.maximumResponseBytes,
      ...options
    });
  }

  async downloadFile(url, options = {}) {
    return downloadFileFromMoodle({
      baseUrl: this.baseUrl,
      token: this.token,
      url,
      fetchImplementation: this.fetchImplementation,
      allowInsecure: this.allowInsecure,
      ...options
    });
  }

  async downloadFileToPath(url, destinationPath, options = {}) {
    return downloadFileFromMoodleToPath({
      baseUrl: this.baseUrl,
      token: this.token,
      url,
      destinationPath,
      fetchImplementation: this.fetchImplementation,
      allowInsecure: this.allowInsecure,
      allowedFileRoots: this.allowedFileRoots,
      ...options
    });
  }

  async callFunction(functionName, parameters = {}, { maximumResponseBytes } = {}) {
    const endpoint = resolveMoodleUrl(this.baseUrl, 'webservice/rest/server.php', {
      allowInsecure: this.allowInsecure
    });
    const body = new URLSearchParams({
      wstoken: this.token,
      wsfunction: functionName,
      moodlewsrestformat: 'json'
    });

    const appendParameter = (key, value) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => appendParameter(`${key}[${index}]`, item));
        return;
      }
      if (value !== undefined && value !== null) {
        body.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
      }
    };
    for (const [key, value] of Object.entries(parameters)) {
      appendParameter(key, value);
    }

    const signal = this.timeoutMs > 0 ? AbortSignal.timeout(this.timeoutMs) : undefined;
    let response;
    try {
      response = await this.fetchImplementation(endpoint, {
        method: 'POST',
        body,
        redirect: 'error',
        signal
      });
    } catch (error) {
      throw new MoodleClientError('transport_error', `Moodle REST request failed: ${redactTextValues(error.message, [this.token])}`, {
        function_name: functionName
      }, error);
    }
    assertResponseOrigin(response, endpoint, moodliaErrors);

    const payload = await parseLimitedJsonResponse(
      response,
      maximumResponseBytes ?? this.maximumResponseBytes,
      'Moodle REST response',
      { errors: moodliaErrors, details: { function_name: functionName } }
    );

    if (!response.ok) {
      throw new MoodleClientError('transport_error', `Moodle REST request failed with HTTP ${response.status}.`, {
        function_name: functionName,
        http_status: response.status
      });
    }

    if (payload?.exception || payload?.errorcode) {
      throw moodleBusinessError(payload, this.token, 'Moodle REST error.', { function_name: functionName });
    }

    return payload;
  }
}

export class MoodleClient {
  constructor({
    contract,
    transport,
    validateResponses = true
  } = {}) {
    if (!contract?.restPrefix || !Array.isArray(contract.operations)) {
      throw new MoodleClientError('invalid_parameters', 'A valid Moodle operation contract is required.');
    }

    if (!transport || typeof transport.callFunction !== 'function') {
      throw new MoodleClientError(
        'invalid_parameters',
        'A REST transport with callFunction(functionName, parameters) is required.'
      );
    }

    this.contract = contract;
    this.transport = transport;
    this.validateResponses = validateResponses;
  }

  operationNames() {
    return this.contract.operations.map((operation) => operation.name);
  }

  getOperation(operationName) {
    const operation = findOperation(this.contract, String(operationName));
    if (!operation) {
      throw new MoodleClientError('invalid_parameters', `Unknown operation: ${operationName}`, {
        operation: operationName
      });
    }

    return operation;
  }

  async call(operationName, parameters = {}) {
    const operation = this.getOperation(operationName);
    const payload = buildContractParameters(operation, parameters, { encoding: 'form' });
    const limit = operation.limits?.maximumResponseBytes;
    const response = await this.transport.callFunction(
      toRestFunctionName(this.contract, operation.name),
      payload,
      ...(Number.isSafeInteger(limit) ? [{ maximumResponseBytes: limit }] : [])
    );
    return this.validateResponses ? validateContractResponse(operation, response) : response;
  }

  async callOperation(operationName, parameters = {}) {
    return this.call(operationName, parameters);
  }

  async callFunction(functionName, parameters = {}) {
    return this.transport.callFunction(functionName, parameters);
  }

  async uploadDraftFile(filePath, options = {}) {
    if (typeof this.transport.uploadDraftFile !== 'function') {
      throw new MoodleClientError(
        'invalid_parameters',
        'The configured transport does not support Moodle draft uploads.'
      );
    }
    return this.transport.uploadDraftFile(filePath, options);
  }

  async uploadDraftData(data, options = {}) {
    if (typeof this.transport.uploadDraftData !== 'function') {
      throw new MoodleClientError('invalid_parameters', 'The configured transport does not support data uploads.');
    }
    return this.transport.uploadDraftData(data, options);
  }

  async downloadFile(url, options = {}) {
    if (typeof this.transport.downloadFile !== 'function') {
      throw new MoodleClientError('invalid_parameters', 'The configured transport does not support file downloads.');
    }
    return this.transport.downloadFile(url, options);
  }

  async downloadFileToPath(url, destinationPath, options = {}) {
    if (typeof this.transport.downloadFileToPath !== 'function') {
      throw new MoodleClientError('unsupported_operation', 'This transport does not support streamed file downloads.');
    }
    return this.transport.downloadFileToPath(url, destinationPath, options);
  }
}

function proxiedClient(client) {
  return new Proxy(client, {
    get(target, property, receiver) {
      if (typeof property !== 'string') {
        return Reflect.get(target, property, receiver);
      }

      if (property in target) {
        const value = Reflect.get(target, property, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      }

      if (findOperation(target.contract, property)) {
        return (parameters = {}) => target.call(property, parameters);
      }

      return undefined;
    }
  });
}

export function createMoodleClient({
  baseUrl,
  token,
  contract,
  timeoutMs = 30000,
  uploadTimeoutMs = 0,
  fetchImplementation = globalThis.fetch,
  allowInsecure = false,
  allowedFileRoots = null,
  maximumResponseBytes,
  maximumUploadBytes,
  maximumDownloadBytes,
  environment = {},
  transport = null,
  validateResponses = true
} = {}) {
  const resolvedTransport = transport ?? new RestTransport({
    baseUrl,
    token,
    timeoutMs,
    uploadTimeoutMs,
    fetchImplementation,
    allowInsecure,
    allowedFileRoots,
    maximumResponseBytes,
    maximumUploadBytes,
    maximumDownloadBytes,
    environment
  });

  return proxiedClient(new MoodleClient({
    contract,
    transport: resolvedTransport,
    validateResponses
  }));
}

export function createMoodleRestClient(options = {}) {
  if (!options.contract) {
    return new RestTransport(options);
  }

  return createMoodleClient(options);
}
