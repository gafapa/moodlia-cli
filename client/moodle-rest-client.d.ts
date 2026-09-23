export * from './generated/operation-types.js';

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
  callFunction(functionName: string, parameters?: Record<string, unknown>, options?: { maximumResponseBytes?: number }): Promise<unknown>;
  uploadDraftFile?(filePath: string, options?: DraftUploadOptions): Promise<DraftUploadResult>;
  uploadDraftData?(data: Uint8Array, options: DraftDataUploadOptions): Promise<DraftUploadResult>;
  downloadFile?(url: string, options?: { maximumBytes?: number }): Promise<Uint8Array>;
  downloadFileToPath?(url: string, destinationPath: string, options?: { maximumBytes?: number }): Promise<StreamedDownloadResult>;
}

export interface RestTransportOptions {
  baseUrl?: string;
  token?: string;
  timeoutMs?: number;
  uploadTimeoutMs?: number;
  fetchImplementation?: typeof fetch;
  allowInsecure?: boolean;
  /** null (default) leaves local files unrestricted; a list restricts uploads and downloads to those roots. */
  allowedFileRoots?: string[] | null;
  /** Default 64 MiB. */
  maximumResponseBytes?: number;
  /** Default unlimited; uploads always stream. */
  maximumUploadBytes?: number;
  /** Default 2 GiB; downloads always stream. */
  maximumDownloadBytes?: number;
  /** Source for MOODLE_MAX_*_BYTES defaults; pass process.env to honour them. */
  environment?: Record<string, string | undefined>;
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

export interface MoodleClientInstance {
  readonly contract: MoodleOperationContract;
  readonly transport: MoodleTransport;
  operationNames(): string[];
  getOperation(operationName: string): unknown;
  call(operationName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  callOperation(operationName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  callFunction(functionName: string, parameters?: Record<string, unknown>): Promise<unknown>;
  uploadDraftFile(filePath: string, options?: DraftUploadOptions): Promise<DraftUploadResult>;
  uploadDraftData(data: Uint8Array, options: DraftDataUploadOptions): Promise<DraftUploadResult>;
  downloadFile(url: string, options?: { maximumBytes?: number }): Promise<Uint8Array>;
  downloadFileToPath(url: string, destinationPath: string, options?: { maximumBytes?: number }): Promise<StreamedDownloadResult>;
  [operationName: string]: unknown;
}

export class RestTransport implements MoodleTransport {
  constructor(options?: RestTransportOptions);
  callFunction(functionName: string, parameters?: Record<string, unknown>, options?: { maximumResponseBytes?: number }): Promise<unknown>;
  uploadDraftFile(filePath: string, options?: DraftUploadOptions): Promise<DraftUploadResult>;
  uploadDraftData(data: Uint8Array, options: DraftDataUploadOptions): Promise<DraftUploadResult>;
  downloadFile(url: string, options?: { maximumBytes?: number }): Promise<Uint8Array>;
  downloadFileToPath(url: string, destinationPath: string, options?: { maximumBytes?: number }): Promise<StreamedDownloadResult>;
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
  uploadDraftFile(filePath: string, options?: DraftUploadOptions): Promise<DraftUploadResult>;
  uploadDraftData(data: Uint8Array, options: DraftDataUploadOptions): Promise<DraftUploadResult>;
  downloadFile(url: string, options?: { maximumBytes?: number }): Promise<Uint8Array>;
  downloadFileToPath(url: string, destinationPath: string, options?: { maximumBytes?: number }): Promise<StreamedDownloadResult>;
  [operationName: string]: unknown;
}

export { MoodleClientError, MoodlePayloadTooLargeError } from 'moodle-core-cli/transport';
import type { MoodleClientError } from 'moodle-core-cli/transport';

export function loadEnvFile(filePath: string): void;
export function loadContractFromFile(contractPath: string): MoodleOperationContract;
export function encodeFileForUpload(filePath: string): string;
export interface DraftUploadOptions {
  filename?: string | null;
  filepath?: string;
  itemId?: number;
  timeoutMs?: number;
}
export interface DraftUploadResult {
  draft_item_id: number;
  filename: string;
  filepath: string;
  filesize: number;
}
export interface DraftDataUploadOptions extends DraftUploadOptions {
  filename: string;
}
export interface StreamedDownloadResult {
  path: string;
  filesize: number;
  sha256: string;
}
export function uploadFileToMoodleDraft(options: {
  baseUrl: string;
  token: string;
  filePath: string;
  filename?: string | null;
  filepath?: string;
  itemId?: number;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
  allowInsecure?: boolean;
}): Promise<DraftUploadResult>;
export function uploadDataToMoodleDraft(options: {
  baseUrl: string;
  token: string;
  data: Uint8Array;
  filename: string;
  filepath?: string;
  itemId?: number;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
  allowInsecure?: boolean;
}): Promise<DraftUploadResult>;
export function downloadFileFromMoodle(options: {
  baseUrl: string;
  token: string;
  url: string;
  maximumBytes?: number;
  fetchImplementation?: typeof fetch;
  allowInsecure?: boolean;
}): Promise<Uint8Array>;
export function downloadFileFromMoodleToPath(options: {
  baseUrl: string;
  token: string;
  url: string;
  destinationPath: string;
  maximumBytes?: number;
  fetchImplementation?: typeof fetch;
  allowInsecure?: boolean;
}): Promise<StreamedDownloadResult>;
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
