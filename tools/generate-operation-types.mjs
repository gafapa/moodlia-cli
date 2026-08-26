import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractPath = path.join(rootDirectory, 'contract/operations.json');
const outputPath = path.join(rootDirectory, 'client/generated/operation-types.d.ts');

function toPascalCase(value) {
  return value
    .split('_')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join('');
}

function quote(value) {
  return JSON.stringify(String(value));
}

function scalarType(value) {
  if (typeof value === 'string' && value.includes('|')) {
    return value.split('|').map((part) => scalarType(part.trim())).join(' | ');
  }

  switch (value) {
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'string':
      return 'string';
    case 'array':
      return 'unknown[]';
    case 'object':
      return 'JsonObject | string';
    case 'null':
      return 'null';
    default:
      return 'unknown';
  }
}

function parameterType(definition) {
  if (Array.isArray(definition.enum)) {
    return definition.enum.map(quote).join(' | ');
  }

  return scalarType(definition.type);
}

function responseType(definition, indent = 0) {
  const padding = ' '.repeat(indent);
  const nestedPadding = ' '.repeat(indent + 2);

  if (typeof definition === 'string') {
    return scalarType(definition);
  }

  if (Array.isArray(definition)) {
    if (definition.length === 0) {
      return 'unknown[]';
    }

    return `${responseType(definition[0], indent)}[]`;
  }

  if (definition && typeof definition === 'object') {
    const entries = Object.entries(definition);
    if (entries.length === 0) {
      return 'Record<string, never>';
    }

    const lines = entries.map(([key, value]) => `${nestedPadding}${key}: ${responseType(value, indent + 2)};`);
    return `{\n${lines.join('\n')}\n${padding}}`;
  }

  return 'unknown';
}

function buildParameterInterface(operation) {
  const name = `${toPascalCase(operation.name)}Parameters`;
  const entries = Object.entries(operation.parameters ?? {});

  if (entries.length === 0) {
    return `export interface ${name} {}\n`;
  }

  const lines = entries.map(([key, definition]) => {
    const optional = definition.required ? '' : '?';
    return `  ${key}${optional}: ${parameterType(definition)};`;
  });

  return `export interface ${name} {\n${lines.join('\n')}\n}\n`;
}

function buildResponseInterface(operation) {
  const name = `${toPascalCase(operation.name)}Response`;
  const body = responseType(operation.returns, 0);

  if (body.startsWith('{\n')) {
    return `export interface ${name} ${body}\n`;
  }

  return `export type ${name} = ${body};\n`;
}

export function buildOperationTypes(contract) {
  const operations = contract.operations ?? [];
  const header = [
    '// This file is generated from contract/operations.json.',
    '// Run npm run types:generate after changing the canonical operation contract.',
    '',
    'export type JsonPrimitive = string | number | boolean | null;',
    'export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];',
    'export interface JsonObject { [key: string]: JsonValue; }',
    ''
  ];

  const operationNames = operations.map((operation) => operation.name);
  const operationNameType = `export type MoodleOperationName = ${operationNames.map(quote).join(' | ')};\n`;
  const parameterInterfaces = operations.map(buildParameterInterface).join('\n');
  const responseInterfaces = operations.map(buildResponseInterface).join('\n');
  const parameterMap = [
    'export interface MoodleOperationParameters {',
    ...operations.map((operation) => `  ${operation.name}: ${toPascalCase(operation.name)}Parameters;`),
    '}',
    ''
  ].join('\n');
  const responseMap = [
    'export interface MoodleOperationResponses {',
    ...operations.map((operation) => `  ${operation.name}: ${toPascalCase(operation.name)}Response;`),
    '}',
    ''
  ].join('\n');
  const clientMethods = operations.map((operation) => {
    const pascalName = toPascalCase(operation.name);
    const canonical = operation.name;
    const parameterTypeName = `${pascalName}Parameters`;
    const responseTypeName = `${pascalName}Response`;
    const parameterSignature = Object.keys(operation.parameters ?? {}).length === 0
      ? `parameters?: ${parameterTypeName}`
      : `parameters: ${parameterTypeName}`;
    return `  ${canonical}(${parameterSignature}): Promise<${responseTypeName}>;`;
  });

  const typedClient = [
    'export interface TypedMoodleClient {',
    '  operationNames(): MoodleOperationName[];',
    '  call<TName extends MoodleOperationName>(',
    '    operationName: TName,',
    '    parameters: MoodleOperationParameters[TName]',
    '  ): Promise<MoodleOperationResponses[TName]>;',
    '  callOperation<TName extends MoodleOperationName>(',
    '    operationName: TName,',
    '    parameters: MoodleOperationParameters[TName]',
    '  ): Promise<MoodleOperationResponses[TName]>;',
    ...clientMethods,
    '}',
    '',
    'export type MoodleOperationParameter<TName extends MoodleOperationName> = MoodleOperationParameters[TName];',
    'export type MoodleOperationResponse<TName extends MoodleOperationName> = MoodleOperationResponses[TName];',
    ''
  ].join('\n');

  return [
    ...header,
    operationNameType,
    parameterInterfaces,
    responseInterfaces,
    parameterMap,
    responseMap,
    typedClient
  ].join('\n');
}

async function readContract() {
  return JSON.parse((await fs.readFile(contractPath, 'utf8')).replace(/^\uFEFF/, ''));
}

async function main() {
  const check = process.argv.includes('--check');
  const contract = await readContract();
  const expected = buildOperationTypes(contract);

  if (check) {
    const actual = await fs.readFile(outputPath, 'utf8');
    if (actual.replace(/\r\n/g, '\n') !== expected) {
      throw new Error('Generated operation type declarations are stale. Run npm run types:generate.');
    }
    return;
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, expected);
  console.log(`Generated ${path.relative(rootDirectory, outputPath)} from ${operationsLabel(contract)}.`);
}

function operationsLabel(contract) {
  return `${contract.operations?.length ?? 0} operations`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
