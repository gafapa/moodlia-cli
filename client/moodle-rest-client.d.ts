export * from './generated/operation-types.d.ts';

export interface MoodleOperationContract {
  restPrefix: string;
  operations?: Array<{
    name: string;
    transports?: string[];
    parameters?: Record<string, MoodleOperationParameter>;
  }>;
}

export interface MoodleOperationParameter {
  type: string;
  required?: boolean;
  enum?: string[];
  minimum?: number;
  maximum?: number;
}

export interface MoodleOperationDefinition {
  name: string;
  transports?: string[];
  parameters?: Record<string, MoodleOperationParameter>;
  returns?: unknown;
}

export interface MoodleTransport {
  callFunction?(functionName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  callOperation?(operationName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  parameterEncoding?: 'form' | 'json';
  supportsCanonicalOperations?: boolean;
}

export interface RestTransportOptions {
  baseUrl?: string;
  token?: string;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
  allowInsecure?: boolean;
}

export interface MoodleClientOptions {
  contract: MoodleOperationContract;
  transport: MoodleTransport;
  validateResponses?: boolean;
}

export interface MoodleClientFactoryOptions extends RestTransportOptions {
  contract: MoodleOperationContract;
  transport?: MoodleTransport | null;
  validateResponses?: boolean;
}

export interface MoodleRestClientOptions extends RestTransportOptions {
  contract?: MoodleOperationContract | null;
  transport?: MoodleTransport | null;
  validateResponses?: boolean;
}

export interface McpTransportOptions {
  baseUrl?: string;
  endpoint?: string | null;
  token?: string;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
  allowInsecure?: boolean;
  protocolVersion?: string;
  clientInfo?: {
    name: string;
    version: string;
  };
}

export interface MoodleMcpClientOptions extends McpTransportOptions {
  contract?: MoodleOperationContract | null;
  transport?: MoodleTransport | null;
  validateResponses?: boolean;
}

export interface MoodleClientInstance {
  readonly contract: MoodleOperationContract;
  readonly transport: MoodleTransport;
  operationNames(): string[];
  getOperation(operationName: string): unknown;
  call(operationName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  callOperation(operationName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  callFunction(functionName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  [operationName: string]: unknown;
}

export class RestTransport implements MoodleTransport {
  readonly parameterEncoding: 'form';
  readonly supportsCanonicalOperations: false;
  constructor(options?: RestTransportOptions);
  callFunction(functionName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  callOperation(operationName: string, parameters?: Record<string, unknown>): Promise<unknown>;
}

export class McpTransport implements MoodleTransport {
  constructor(options?: McpTransportOptions);
  readonly endpoint: string;
  readonly parameterEncoding: 'json';
  readonly supportsCanonicalOperations: true;
  readonly protocolVersion: string;
  initialize(): Promise<Record<string, unknown>>;
  ping(): Promise<unknown>;
  listTools(): Promise<unknown[]>;
  callOperation(operationName: string, parameters?: Record<string, unknown>): Promise<unknown>;
}

export class MoodleClient implements MoodleClientInstance {
  constructor(options: MoodleClientOptions);
  readonly contract: MoodleOperationContract;
  readonly transport: MoodleTransport;
  operationNames(): string[];
  getOperation(operationName: string): unknown;
  call(operationName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  callOperation(operationName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  callFunction(functionName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  [operationName: string]: unknown;
}

export class MoodleClientError extends Error {
  constructor(code: string, message: string, details?: Record<string, unknown>, cause?: unknown);
  readonly code: string;
  readonly details: Record<string, unknown>;
  toJSON(): {
    error: true;
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

export function loadEnvFile(filePath: string): void;
export function loadContractFromFile(contractPath: string): MoodleOperationContract;
export function toRestFunctionName(contract: MoodleOperationContract, operationName: string): string;
export function resolveMoodleUrl(
  baseUrl: string,
  relativePath: string,
  options?: { allowInsecure?: boolean }
): URL;
export function normalizeClientError(
  error: unknown,
  fallbackCode?: string,
  details?: Record<string, unknown>
): MoodleClientError;
export function buildContractParameters(
  operation: MoodleOperationDefinition,
  parameters?: Record<string, unknown>,
  options?: { encoding?: 'form' | 'json' }
): Record<string, unknown>;
export function validateContractResponse(
  operation: MoodleOperationDefinition & { returns?: unknown },
  payload: unknown
): unknown;
export function createMoodleClient(options: MoodleClientFactoryOptions): MoodleClientInstance;
export function createMoodleRestClient(options?: MoodleRestClientOptions): MoodleClientInstance | RestTransport;
export function createMoodleMcpClient(options?: MoodleMcpClientOptions): MoodleClientInstance | McpTransport;
