import { createMoodleClient as createCoreClient } from 'moodle-core-cli';
import { createCoreMoodleAdapter } from 'moodle-core-cli/adapters/core';
import { createMoodleClient } from '../client/moodle-rest-client.mjs';
import { createMoodliaMoodleAdapter } from '../adapters/moodlia/index.mjs';
import { createAdaptiveMoodleAdapter } from './adaptive-adapter.mjs';

export function createAdaptiveSiteAdapter({ profile, moodliaContract, allowWrite = false }) {
  if (!profile) throw new TypeError('profile is required.');
  if (!moodliaContract) throw new TypeError('moodliaContract is required.');
  const useMoodlia = profile.backend !== 'core' && profile.credentials.moodlia;
  const useCore = profile.backend !== 'moodlia' && profile.credentials.core;
  const moodlia = useMoodlia
    ? createMoodliaMoodleAdapter({
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
    ? createCoreMoodleAdapter({
      client: createCoreClient({
        baseUrl: profile.url,
        token: profile.credentials.core.token,
        allowInsecure: profile.allow_insecure,
        readOnly: !allowWrite
      }),
      profileName: profile.name
    })
    : null;
  return createAdaptiveMoodleAdapter({ moodlia, core, profileName: profile.name });
}
