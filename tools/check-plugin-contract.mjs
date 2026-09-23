import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentDigest } from 'moodle-core-cli/canonical';

// Compares the bundled operation contract with the MoodlIA plugin's contract.
// usage: node tools/check-plugin-contract.mjs [plugin-contract.json] [--write]
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundledPath = path.join(root, 'contract', 'operations.json');
const args = process.argv.slice(2);
const write = args.includes('--write');
const pluginPath = path.resolve(
  args.find((entry) => !entry.startsWith('--'))
    ?? process.env.MOODLIA_PLUGIN_CONTRACT
    ?? path.join(root, '..', 'moodlia-moodle-plugin', 'contract', 'operations.json')
);

const read = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^﻿/, ''));
const bundled = read(bundledPath);
const plugin = read(pluginPath);

if (contentDigest(bundled) === contentDigest(plugin)) {
  console.log(`Contract matches the plugin (${plugin.operations.length} operations).`);
  process.exit(0);
}
if (write) {
  fs.writeFileSync(bundledPath, `${JSON.stringify(plugin, null, 2)}\n`);
  console.log(`Copied the plugin contract (${plugin.operations.length} operations). Run npm run types:generate.`);
  process.exit(0);
}
const byName = (contract) => new Map(contract.operations.map((operation) => [operation.name, operation]));
const bundledOperations = byName(bundled);
const pluginOperations = byName(plugin);
const report = {
  only_in_plugin: [...pluginOperations.keys()].filter((name) => !bundledOperations.has(name)),
  only_in_cli: [...bundledOperations.keys()].filter((name) => !pluginOperations.has(name)),
  changed: [...pluginOperations.keys()].filter((name) => bundledOperations.has(name)
    && contentDigest(pluginOperations.get(name)) !== contentDigest(bundledOperations.get(name)))
};
console.error(`The bundled contract differs from ${pluginPath}:`);
console.error(JSON.stringify(report, null, 2));
console.error('Run: node tools/check-plugin-contract.mjs <plugin-contract.json> --write');
process.exit(1);
