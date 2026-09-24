import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeOperationTypes } from 'moodle-core-cli/type-generator';

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractPath = path.join(rootDirectory, 'contract', 'operations.json');
const outputPath = path.join(rootDirectory, 'client', 'generated', 'operation-types.d.ts');

async function main() {
  const contract = JSON.parse((await fs.readFile(contractPath, 'utf8')).replace(/^﻿/, ''));
  const written = await writeOperationTypes({
    contract,
    outputPath,
    check: process.argv.includes('--check'),
    // MoodlIA object parameters also accept JSON strings, and its client exposes call().
    objectParameterType: 'JsonObject | string',
    clientMethods: ['call', 'callOperation']
  });
  if (written) console.log(`Generated ${path.relative(rootDirectory, outputPath)} from ${contract.operations.length} operations.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
