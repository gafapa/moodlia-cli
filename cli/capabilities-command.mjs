import { loadProfiles, describeProfile, resolveProfile } from 'moodle-core-cli/profiles';
import { requiredOption } from 'moodle-core-cli/cli-options';
import { createAdaptiveSiteAdapter } from '../adaptive/index.mjs';
import { MoodleClientError } from '../client/moodle-rest-client.mjs';

const DEFAULT_CONFIG = '.moodle-profiles.json';
const cliErrors = Object.freeze({
  validation: (message, details = {}, cause = null) => new MoodleClientError('invalid_parameters', message, details, cause)
});

export function syncMovedError() {
  return new MoodleClientError(
    'unsupported_operation',
    'Course synchronization moved to the moodlia-sync package. Install it with "npm install -g moodlia-sync" and run "moodlia-sync --help".',
    { package: 'moodlia-sync', since: '0.4.0' }
  );
}

export function printCapabilitiesHelp() {
  console.log('Usage: moodlia capabilities --profile <name> [options]');
  console.log('');
  console.log('Discovers which providers (MoodlIA plugin, Moodle Core) a site profile can use.');
  console.log('Synchronization capabilities are reported by "moodlia-sync capabilities".');
  console.log('');
  console.log(`  --config <path>             Profile file (default: ${DEFAULT_CONFIG})`);
  console.log('  --profile <name>            Adaptive Moodle site profile');
}

export async function runCapabilities(options, contract) {
  const profileName = requiredOption(options, 'profile', cliErrors);
  const profile = resolveProfile(loadProfiles(options.config ?? DEFAULT_CONFIG), profileName);
  const adapter = createAdaptiveSiteAdapter({ profile, moodliaContract: contract });
  return { profile: describeProfile(profile), discovery: await adapter.discoverSite() };
}
