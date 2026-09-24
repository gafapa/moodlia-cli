function safeError(error) {
  return {
    code: String(error?.code ?? 'unavailable'),
    message: String(error?.message ?? 'Provider discovery failed.')
  };
}

export class AdaptiveMoodleAdapter {
  constructor({ moodlia = null, core = null, profileName = null }) {
    if (!moodlia && !core) throw new TypeError('At least one Moodle adapter is required.');
    this.adapters = { moodlia, core };
    this.profileName = profileName;
    this.provider = 'adaptive';
    this.discovery = null;
    this.capabilityProviders = new Map();
  }

  async discoverSite() {
    const providers = {};
    for (const name of ['moodlia', 'core']) {
      const adapter = this.adapters[name];
      if (!adapter) continue;
      try {
        providers[name] = { available: true, evidence: await adapter.discoverSite() };
      } catch (error) {
        providers[name] = { available: false, error: safeError(error) };
      }
    }
    const available = ['moodlia', 'core'].find((name) => providers[name]?.available);
    if (!available) {
      const reasons = Object.entries(providers)
        .map(([name, entry]) => `${name}: ${entry.error.code}: ${entry.error.message}`)
        .join('; ');
      const error = new TypeError(
        `No provider is available for profile ${this.profileName ?? 'unknown'}${reasons ? ` (${reasons})` : ''}.`
      );
      error.details = { providers };
      throw error;
    }
    this.discovery = {
      provider: 'adaptive',
      profile: this.profileName,
      selected_read_provider: available,
      providers
    };
    return this.discovery;
  }

  availableAdapter(preference = ['moodlia', 'core']) {
    for (const name of preference) {
      if (this.discovery?.providers?.[name]?.available) return this.adapters[name];
    }
    return null;
  }
}

export function createAdaptiveMoodleAdapter(options) {
  return new AdaptiveMoodleAdapter(options);
}
