import { contentDigest } from 'moodle-core-cli/sync';

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
      const error = new TypeError(`No provider is available for profile ${this.profileName ?? 'unknown'}.`);
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

  async exportCourse(courseId) {
    if (!this.discovery) await this.discoverSite();
    const adapter = this.availableAdapter();
    if (!adapter) throw new TypeError('No provider can export the course.');
    const model = await adapter.exportCourse(courseId);
    const adapted = {
      ...model,
      site: {
        ...model.site,
        provider: 'adaptive',
        selected_provider: adapter.provider,
        profile: this.profileName
      }
    };
    adapted.digest = contentDigest({ ...adapted, extracted_at: undefined, digest: undefined });
    return adapted;
  }

  async prepareTargetCourse(targetCreation) {
    if (!this.discovery) await this.discoverSite();
    const adapter = this.availableAdapter();
    if (!adapter?.prepareTargetCourse) throw new TypeError('No provider can prepare a new target course.');
    const model = await adapter.prepareTargetCourse(targetCreation);
    const adapted = {
      ...model,
      site: {
        ...model.site,
        provider: 'adaptive',
        selected_provider: adapter.provider,
        profile: this.profileName
      }
    };
    adapted.digest = contentDigest({ ...adapted, extracted_at: undefined, digest: undefined });
    return adapted;
  }

  async syncCapabilities(context = {}) {
    if (!this.discovery) await this.discoverSite();
    const byProvider = {};
    for (const name of ['moodlia', 'core']) {
      if (!this.discovery.providers[name]?.available) continue;
      byProvider[name] = await this.adapters[name].syncCapabilities(context);
    }
    const capabilities = {};
    const names = new Set(Object.values(byProvider).flatMap((entry) => Object.keys(entry)));
    for (const capabilityName of names) {
      for (const providerName of ['moodlia', 'core']) {
        const value = byProvider[providerName]?.[capabilityName];
        const available = value === true || value?.available === true;
        if (!available) continue;
        capabilities[capabilityName] = typeof value === 'object'
          ? { ...value, provider: providerName }
          : { available: true, provider: providerName };
        this.capabilityProviders.set(capabilityName, providerName);
        break;
      }
      capabilities[capabilityName] ??= { available: false };
    }
    return capabilities;
  }

  async applySyncAction(action, context) {
    const capabilityName = action.kind.replaceAll('.', '_');
    if (!this.capabilityProviders.has(capabilityName)) await this.syncCapabilities(context);
    const providerName = action.provider ?? this.capabilityProviders.get(capabilityName);
    const adapter = this.adapters[providerName];
    if (!adapter) throw new TypeError(`No provider can apply sync action ${action.kind}.`);
    return adapter.applySyncAction(action, context);
  }

  async providerForCapability(capabilityName, context = {}, requiredProvider = null) {
    if (!this.capabilityProviders.has(capabilityName)) await this.syncCapabilities(context);
    const providerName = requiredProvider ?? this.capabilityProviders.get(capabilityName);
    const adapter = this.adapters[providerName];
    if (!adapter) throw new TypeError(`No provider is available for capability ${capabilityName}.`);
    return adapter;
  }

  async downloadAsset(asset) {
    if (!this.discovery) await this.discoverSite();
    const adapter = this.availableAdapter();
    if (!adapter?.downloadAsset) throw new TypeError('The selected source provider cannot download synchronized assets.');
    return adapter.downloadAsset(asset);
  }

  async stageModuleAssets(action, assetsWithData, context) {
    const adapter = await this.providerForCapability('module_asset_stage', context, action.provider);
    return adapter.stageModuleAssets(action, assetsWithData, context);
  }

  async replaceResourceAsset(action, data, context) {
    const adapter = await this.providerForCapability('resource_asset_replace', context, action.provider);
    return adapter.replaceResourceAsset(action, data, context);
  }

  async publishBookChapterAssets(action, assetsWithData, context) {
    const adapter = await this.providerForCapability('book_asset_transfer', context, action.provider);
    return adapter.publishBookChapterAssets(action, assetsWithData, context);
  }
}

export function createAdaptiveMoodleAdapter(options) {
  return new AdaptiveMoodleAdapter(options);
}
