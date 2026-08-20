import fs from 'node:fs';
import path from 'node:path';

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
  return JSON.parse(fs.readFileSync(contractPath, 'utf8').replace(/^\uFEFF/, ''));
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

export async function uploadFileToMoodleDraft({
  baseUrl,
  token,
  filePath,
  filename = null,
  filepath = '/',
  itemId = 0,
  timeoutMs = 0,
  fetchImplementation = globalThis.fetch,
  allowInsecure = false
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
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
    throw new MoodleClientError('invalid_parameters', 'timeoutMs must be a non-negative finite number.', {
      parameter: 'timeoutMs'
    });
  }
  if (!Number.isInteger(itemId) || itemId < 0) {
    throw new MoodleClientError('invalid_parameters', 'itemId must be a non-negative integer.', {
      parameter: 'itemId'
    });
  }
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new MoodleClientError('invalid_parameters', 'An upload file path is required.', {
      parameter: 'filePath'
    });
  }

  const resolvedPath = path.resolve(filePath);
  const resolvedFilename = String(filename ?? path.basename(resolvedPath)).trim();
  if (!resolvedFilename || path.basename(resolvedFilename) !== resolvedFilename) {
    throw new MoodleClientError('invalid_parameters', 'filename must be a plain file name.', {
      parameter: 'filename'
    });
  }
  const resolvedFilepath = String(filepath || '/');
  if (!resolvedFilepath.startsWith('/') || !resolvedFilepath.endsWith('/') || resolvedFilepath.includes('..')) {
    throw new MoodleClientError('invalid_parameters', 'filepath must be an absolute Moodle file path.', {
      parameter: 'filepath'
    });
  }

  let fileBlob;
  try {
    const stats = fs.statSync(resolvedPath);
    if (!stats.isFile()) {
      throw new Error('The path is not a regular file.');
    }
    fileBlob = await fs.openAsBlob(resolvedPath);
  } catch (error) {
    throw new MoodleClientError('invalid_parameters', `Unable to read upload file: ${resolvedPath}`, {
      parameter: 'filePath',
      file_path: resolvedPath
    }, error);
  }

  const endpoint = resolveMoodleUrl(baseUrl, 'webservice/upload.php', { allowInsecure });
  const body = new FormData();
  body.set('token', String(token));
  body.set('filepath', resolvedFilepath);
  body.set('itemid', String(itemId));
  body.set('file_1', fileBlob, resolvedFilename);

  const controller = new AbortController();
  const timeout = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    let response;
    try {
      response = await fetchImplementation(endpoint, {
        method: 'POST',
        body,
        redirect: 'error',
        signal: controller.signal
      });
    } catch (error) {
      throw new MoodleClientError('transport_error', `Moodle draft upload failed: ${error.message}`, {
        endpoint: 'webservice/upload.php'
      }, error);
    }

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch (error) {
      throw new MoodleClientError('transport_error', 'Moodle draft upload response was not valid JSON.', {
        http_status: response.status
      }, error);
    }
    if (!response.ok) {
      throw new MoodleClientError('transport_error', `Moodle draft upload failed with HTTP ${response.status}.`, {
        http_status: response.status
      });
    }
    if (payload?.exception || payload?.errorcode) {
      const errorCode = moodleErrorCode(payload);
      throw new MoodleClientError(errorCode, payload.message || 'Moodle draft upload failed.', {
        moodle_errorcode: payload.errorcode,
        moodle_exception: payload.exception,
        ...(errorCode !== 'internal_error' && payload.debuginfo
          ? { moodle_debuginfo: payload.debuginfo }
          : {})
      });
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
      filename: String(uploaded.filename ?? resolvedFilename),
      filepath: String(uploaded.filepath ?? resolvedFilepath),
      filesize: Number(uploaded.filesize ?? uploaded.size ?? fileBlob.size)
    };
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export function toRestFunctionName(contract, operationName) {
  return `${contract.restPrefix}_${operationName}`;
}

export class MoodleClientError extends Error {
  constructor(code, message, details = {}, cause = null) {
    super(message, cause ? { cause } : undefined);
    this.name = 'MoodleClientError';
    this.code = code;
    this.details = details;
  }

  toJSON() {
    return {
      error: true,
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}

export function normalizeClientError(error, fallbackCode = 'internal_error', details = {}) {
  if (error instanceof MoodleClientError) {
    return error;
  }

  return new MoodleClientError(
    fallbackCode,
    error?.message || 'Unexpected Moodle client error.',
    details,
    error
  );
}

function isLoopbackHostname(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function normaliseMoodleBaseUrl(baseUrl, { allowInsecure = false } = {}) {
  let resolved;
  try {
    resolved = new URL(baseUrl);
  } catch (error) {
    throw new MoodleClientError('invalid_parameters', 'MOODLE_BASE_URL must be a valid URL.', {
      parameter: 'MOODLE_BASE_URL'
    }, error);
  }

  if (resolved.username || resolved.password) {
    throw new MoodleClientError('invalid_parameters', 'MOODLE_BASE_URL must not contain credentials.', {
      parameter: 'MOODLE_BASE_URL'
    });
  }

  if (resolved.protocol !== 'https:' && !(resolved.protocol === 'http:' && (allowInsecure || isLoopbackHostname(resolved.hostname)))) {
    throw new MoodleClientError(
      'invalid_parameters',
      'MOODLE_BASE_URL must use HTTPS. HTTP is allowed only for loopback hosts or when allowInsecure is explicitly enabled.',
      { parameter: 'MOODLE_BASE_URL', protocol: resolved.protocol }
    );
  }

  resolved.search = '';
  resolved.hash = '';
  if (!resolved.pathname.endsWith('/')) {
    resolved.pathname += '/';
  }

  return resolved;
}

export function resolveMoodleUrl(baseUrl, relativePath, options = {}) {
  const relative = String(relativePath ?? '').replace(/^\/+/, '');
  if (!relative || /^[a-z][a-z\d+.-]*:/i.test(relative)) {
    throw new MoodleClientError('invalid_parameters', 'Moodle URL paths must be non-empty relative paths.', {
      parameter: 'relativePath'
    });
  }

  return new URL(relative, normaliseMoodleBaseUrl(baseUrl, options));
}

function findOperation(contract, operationName) {
  return contract?.operations?.find((operation) => operation.name === operationName) ?? null;
}

function normaliseOperationName(contract, operationName) {
  const canonical = String(operationName);
  if (findOperation(contract, canonical)) {
    return canonical;
  }

  return canonical;
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

export class RestTransport {
  constructor({
    baseUrl,
    token,
    timeoutMs = 30000,
    uploadTimeoutMs = 0,
    fetchImplementation = globalThis.fetch,
    allowInsecure = false
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

    if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
      throw new MoodleClientError('invalid_parameters', 'timeoutMs must be a non-negative finite number.', {
        parameter: 'timeoutMs'
      });
    }
    if (!Number.isFinite(uploadTimeoutMs) || uploadTimeoutMs < 0) {
      throw new MoodleClientError('invalid_parameters', 'uploadTimeoutMs must be a non-negative finite number.', {
        parameter: 'uploadTimeoutMs'
      });
    }

    this.baseUrl = normaliseMoodleBaseUrl(baseUrl, { allowInsecure }).toString();
    this.token = token;
    this.timeoutMs = timeoutMs;
    this.uploadTimeoutMs = uploadTimeoutMs;
    this.fetchImplementation = fetchImplementation;
    this.allowInsecure = allowInsecure;
  }

  async uploadDraftFile(filePath, options = {}) {
    return uploadFileToMoodleDraft({
      baseUrl: this.baseUrl,
      token: this.token,
      filePath,
      timeoutMs: this.uploadTimeoutMs,
      fetchImplementation: this.fetchImplementation,
      allowInsecure: this.allowInsecure,
      ...options
    });
  }

  async callFunction(functionName, parameters = {}) {
    const endpoint = resolveMoodleUrl(this.baseUrl, 'webservice/rest/server.php', {
      allowInsecure: this.allowInsecure
    });
    const body = new URLSearchParams({
      wstoken: this.token,
      wsfunction: functionName,
      moodlewsrestformat: 'json'
    });

    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined && value !== null) {
        body.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
      }
    }

    const controller = new AbortController();
    const timeout = this.timeoutMs > 0 ? setTimeout(() => controller.abort(), this.timeoutMs) : null;

    try {
      let response;
      try {
        response = await this.fetchImplementation(endpoint, {
          method: 'POST',
          body,
          redirect: 'error',
          signal: controller.signal
        });
      } catch (error) {
        throw new MoodleClientError('transport_error', `Moodle REST request failed: ${error.message}`, {
          function_name: functionName
        }, error);
      }
      const text = await response.text();
      let payload = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch (error) {
        throw new MoodleClientError('transport_error', 'Moodle REST response was not valid JSON.', {
          function_name: functionName,
          http_status: response.status
        }, error);
      }

      if (!response.ok) {
        throw new MoodleClientError('transport_error', `Moodle REST request failed with HTTP ${response.status}.`, {
          function_name: functionName,
          http_status: response.status
        });
      }

      if (payload?.exception || payload?.errorcode) {
        const errorCode = moodleErrorCode(payload);
        throw new MoodleClientError(errorCode, payload.message || 'Moodle REST error.', {
          function_name: functionName,
          moodle_errorcode: payload.errorcode,
          moodle_exception: payload.exception,
          ...(errorCode !== 'internal_error' && payload.debuginfo
            ? { moodle_debuginfo: payload.debuginfo }
            : {})
        });
      }

      return payload;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
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
    const canonicalName = normaliseOperationName(this.contract, operationName);
    const operation = findOperation(this.contract, canonicalName);
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
    const response = await this.transport.callFunction(
      toRestFunctionName(this.contract, operation.name),
      payload
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

      const canonicalName = normaliseOperationName(target.contract, property);
      if (findOperation(target.contract, canonicalName)) {
        return (parameters = {}) => target.call(canonicalName, parameters);
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
  transport = null,
  validateResponses = true
} = {}) {
  const resolvedTransport = transport ?? new RestTransport({
    baseUrl,
    token,
    timeoutMs,
    uploadTimeoutMs,
    fetchImplementation,
    allowInsecure
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
