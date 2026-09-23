import { createMoodleClient as createCoreClient } from 'moodle-core-cli';
import { CoreMoodleAdapter } from 'moodle-core-cli/adapters/core';
import { createMoodleClient } from '../client/moodle-rest-client.mjs';
import { MoodliaMoodleAdapter } from '../adapters/moodlia/index.mjs';
import { AdaptiveMoodleAdapter } from './adaptive-adapter.mjs';

/**
 * Builds the adaptive adapter for a profile. Packages that extend the
 * adapters, such as moodlia-sync, pass their subclasses in `classes`.
 */
export function createAdaptiveSiteAdapter({
  profile,
  moodliaContract,
  allowWrite = false,
  classes = {}
}) {
  if (!profile) throw new TypeError('profile is required.');
  if (!moodliaContract) throw new TypeError('moodliaContract is required.');
  const {
    core: CoreAdapter = CoreMoodleAdapter,
    moodlia: MoodliaAdapter = MoodliaMoodleAdapter,
    adaptive: AdaptiveAdapter = AdaptiveMoodleAdapter
  } = classes;
  const useMoodlia = profile.backend !== 'core' && profile.credentials.moodlia;
  const useCore = profile.backend !== 'moodlia' && profile.credentials.core;
  const moodlia = useMoodlia
    ? new MoodliaAdapter({
      client: createMoodleClient({
        baseUrl: profile.url,
        token: profile.credentials.moodlia.token,
        contract: moodliaContract,
        allowInsecure: profile.allow_insecure
      }),
      profileName: profile.name
    })
    : null;
  const core = useCore
    ? new CoreAdapter({
      client: createCoreClient({
        baseUrl: profile.url,
        token: profile.credentials.core.token,
        allowInsecure: profile.allow_insecure,
        readOnly: !allowWrite
      }),
      profileName: profile.name
    })
    : null;
  return new AdaptiveAdapter({ moodlia, core, profileName: profile.name });
}
