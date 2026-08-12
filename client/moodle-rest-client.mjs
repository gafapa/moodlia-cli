import fs from 'node:fs';

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

    this.baseUrl = normaliseMoodleBaseUrl(baseUrl, { allowInsecure }).toString();
    this.token = token;
    this.timeoutMs = timeoutMs;
    this.fetchImplementation = fetchImplementation;
    this.allowInsecure = allowInsecure;
    this.parameterEncoding = 'form';
    this.supportsCanonicalOperations = false;
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
        throw new MoodleClientError(moodleErrorCode(payload), payload.message || 'Moodle REST error.', {
          function_name: functionName,
          moodle_errorcode: payload.errorcode,
          moodle_exception: payload.exception
        });
      }

      return payload;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  async callOperation() {
    throw new MoodleClientError('invalid_parameters', 'A contract is required to call canonical operations.');
  }
}

function normaliseMcpEndpoint(endpoint, { allowInsecure = false } = {}) {
  let resolved;
  try {
    resolved = new URL(endpoint);
  } catch (error) {
    throw new MoodleClientError('invalid_parameters', 'MCP endpoint must be a valid URL.', {
      parameter: 'endpoint'
    }, error);
  }

  if (resolved.username || resolved.password) {
    throw new MoodleClientError('invalid_parameters', 'MCP endpoint must not contain credentials.', {
      parameter: 'endpoint'
    });
  }

  if (resolved.protocol !== 'https:' && !(resolved.protocol === 'http:' && (allowInsecure || isLoopbackHostname(resolved.hostname)))) {
    throw new MoodleClientError(
      'invalid_parameters',
      'MCP endpoint must use HTTPS. HTTP is allowed only for loopback hosts or when allowInsecure is explicitly enabled.',
      { parameter: 'endpoint', protocol: resolved.protocol }
    );
  }

  resolved.hash = '';
  return resolved;
}

function mcpErrorFromPayload(error, method, httpStatus = null) {
  const canonicalCode = typeof error?.data?.code === 'string'
    ? error.data.code
    : (httpStatus && httpStatus >= 500 ? 'transport_error' : 'mcp_error');
  const details = {
    method,
    jsonrpc_code: error?.code
  };

  if (httpStatus !== null) {
    details.http_status = httpStatus;
  }
  if (error?.data?.details && typeof error.data.details === 'object') {
    Object.assign(details, error.data.details);
  }

  return new MoodleClientError(
    canonicalCode,
    error?.message || 'MCP request failed.',
    details
  );
}

function toolResultError(operationName, result) {
  const textItem = Array.isArray(result?.content)
    ? result.content.find((item) => item?.type === 'text' && typeof item.text === 'string')
    : null;
  let payload = null;

  if (textItem) {
    try {
      payload = JSON.parse(textItem.text);
    } catch {
      payload = null;
    }
  }

  return new MoodleClientError(
    typeof payload?.code === 'string' ? payload.code : 'moodle_error',
    payload?.message || textItem?.text || `MCP operation ${operationName} failed.`,
    {
      operation: operationName,
      ...(payload?.details && typeof payload.details === 'object' ? payload.details : {})
    }
  );
}

export class McpTransport {
  constructor({
    baseUrl,
    endpoint = null,
    token,
    timeoutMs = 30000,
    fetchImplementation = globalThis.fetch,
    allowInsecure = false,
    protocolVersion = '2025-11-25',
    clientInfo = {
      name: 'moodlia-node-client',
      version: '1.0.0'
    }
  } = {}) {
    if ((!baseUrl && !endpoint) || !token) {
      throw new MoodleClientError(
        'invalid_parameters',
        'A Moodle base URL or MCP endpoint and a bearer token are required.',
        { required: ['baseUrl or endpoint', 'token'] }
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
    if (!protocolVersion || typeof protocolVersion !== 'string') {
      throw new MoodleClientError('invalid_parameters', 'protocolVersion must be a non-empty string.', {
        parameter: 'protocolVersion'
      });
    }
    if (!clientInfo?.name || !clientInfo?.version) {
      throw new MoodleClientError('invalid_parameters', 'clientInfo must contain name and version.', {
        parameter: 'clientInfo'
      });
    }

    this.endpoint = endpoint
      ? normaliseMcpEndpoint(endpoint, { allowInsecure }).toString()
      : resolveMoodleUrl(baseUrl, 'local/moodlia/mcp.php', { allowInsecure }).toString();
    this.token = String(token);
    this.timeoutMs = timeoutMs;
    this.fetchImplementation = fetchImplementation;
    this.protocolVersion = protocolVersion;
    this.clientInfo = {
      name: String(clientInfo.name),
      version: String(clientInfo.version)
    };
    this.parameterEncoding = 'json';
    this.supportsCanonicalOperations = true;
    this.requestId = 0;
    this.initializationResult = null;
    this.initializationPromise = null;
  }

  async request(method, params = {}, { notification = false } = {}) {
    const id = notification ? null : ++this.requestId;
    const requestPayload = {
      jsonrpc: '2.0',
      method,
      params
    };
    if (!notification) {
      requestPayload.id = id;
    }

    const controller = new AbortController();
    const timeout = this.timeoutMs > 0 ? setTimeout(() => controller.abort(), this.timeoutMs) : null;

    try {
      let response;
      try {
        response = await this.fetchImplementation(this.endpoint, {
          method: 'POST',
          headers: {
            accept: 'application/json, text/event-stream',
            authorization: `Bearer ${this.token}`,
            'content-type': 'application/json',
            'mcp-protocol-version': this.protocolVersion
          },
          body: JSON.stringify(requestPayload),
          redirect: 'error',
          signal: controller.signal
        });
      } catch (error) {
        throw new MoodleClientError('transport_error', `Moodle MCP request failed: ${error.message}`, {
          method
        }, error);
      }

      const text = await response.text();
      let payload = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch (error) {
          throw new MoodleClientError('transport_error', 'Moodle MCP response was not valid JSON.', {
            method,
            http_status: response.status
          }, error);
        }
      }

      if (payload?.error) {
        throw mcpErrorFromPayload(payload.error, method, response.status);
      }
      if (!response.ok) {
        throw new MoodleClientError('transport_error', `Moodle MCP request failed with HTTP ${response.status}.`, {
          method,
          http_status: response.status
        });
      }
      if (notification) {
        return null;
      }
      if (!payload || payload.jsonrpc !== '2.0' || payload.id !== id || !Object.hasOwn(payload, 'result')) {
        throw new MoodleClientError('transport_error', 'Moodle MCP response was not a valid JSON-RPC response.', {
          method,
          request_id: id,
          response_id: payload?.id
        });
      }

      return payload.result;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }

  async initialize() {
    if (this.initializationResult) {
      return this.initializationResult;
    }
    if (!this.initializationPromise) {
      this.initializationPromise = (async () => {
        const result = await this.request('initialize', {
          protocolVersion: this.protocolVersion,
          capabilities: {},
          clientInfo: this.clientInfo
        });
        if (!result?.protocolVersion) {
          throw new MoodleClientError('transport_error', 'Moodle MCP initialize response omitted protocolVersion.', {
            method: 'initialize'
          });
        }
        this.protocolVersion = result.protocolVersion;
        await this.request('notifications/initialized', {}, { notification: true });
        this.initializationResult = result;
        return result;
      })();
    }

    try {
      return await this.initializationPromise;
    } catch (error) {
      this.initializationPromise = null;
      throw error;
    }
  }

  async ping() {
    await this.initialize();
    return this.request('ping');
  }

  async listTools() {
    await this.initialize();
    const result = await this.request('tools/list');
    return result?.tools ?? [];
  }

  async callOperation(operationName, parameters = {}) {
    await this.initialize();
    const result = await this.request('tools/call', {
      name: operationName,
      arguments: parameters
    });
    if (result?.isError) {
      throw toolResultError(operationName, result);
    }
    if (result && Object.hasOwn(result, 'structuredContent')) {
      return result.structuredContent;
    }

    const textItem = Array.isArray(result?.content)
      ? result.content.find((item) => item?.type === 'text' && typeof item.text === 'string')
      : null;
    if (textItem) {
      try {
        return JSON.parse(textItem.text);
      } catch {
        return textItem.text;
      }
    }

    return result;
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

    if (
      !transport ||
      (typeof transport.callFunction !== 'function' && typeof transport.callOperation !== 'function')
    ) {
      throw new MoodleClientError(
        'invalid_parameters',
        'A transport with callFunction(functionName, parameters) or callOperation(operationName, parameters) is required.'
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
    const useCanonicalOperation = this.transport.supportsCanonicalOperations === true ||
      typeof this.transport.callFunction !== 'function';
    const encoding = this.transport.parameterEncoding ??
      (useCanonicalOperation ? 'json' : 'form');
    const payload = buildContractParameters(operation, parameters, { encoding });
    const response = useCanonicalOperation
      ? await this.transport.callOperation(operation.name, payload)
      : await this.transport.callFunction(toRestFunctionName(this.contract, operation.name), payload);
    return this.validateResponses ? validateContractResponse(operation, response) : response;
  }

  async callOperation(operationName, parameters = {}) {
    return this.call(operationName, parameters);
  }

  async callFunction(functionName, parameters = {}) {
    if (typeof this.transport.callFunction !== 'function') {
      throw new MoodleClientError(
        'invalid_parameters',
        'The configured transport does not support raw Moodle function calls.'
      );
    }
    return this.transport.callFunction(functionName, parameters);
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
  fetchImplementation = globalThis.fetch,
  allowInsecure = false,
  transport = null,
  validateResponses = true
} = {}) {
  const resolvedTransport = transport ?? new RestTransport({
    baseUrl,
    token,
    timeoutMs,
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

export function createMoodleMcpClient(options = {}) {
  const transport = options.transport ?? new McpTransport(options);
  if (!options.contract) {
    return transport;
  }

  return proxiedClient(new MoodleClient({
    contract: options.contract,
    transport,
    validateResponses: options.validateResponses ?? true
  }));
}
