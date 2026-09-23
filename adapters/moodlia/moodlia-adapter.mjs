function parseDeclaredFunctions(value) {
  if (!value) return [];
  let parsed = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((entry) => String(entry?.name ?? entry)).filter(Boolean);
}

function operationFunction(name) {
  return `local_moodlia_${name}`;
}

export class MoodliaMoodleAdapter {
  constructor({ client, profileName = null }) {
    if (!client) throw new TypeError('client is required.');
    this.client = client;
    this.provider = 'moodlia';
    this.profileName = profileName;
    this.discovery = null;
  }

  async discoverSite() {
    const status = await this.client.callOperation('get_moodlia_status');
    this.discovery = {
      provider: 'moodlia',
      profile: this.profileName,
      site_url: String(status.site_url ?? ''),
      site_name: String(status.site_name ?? ''),
      moodle_version: String(status.moodle_version ?? status.moodle_release ?? ''),
      moodle_release: String(status.moodle_release ?? ''),
      plugin_version: String(status.plugin_version ?? ''),
      plugin_release: String(status.plugin_release ?? ''),
      user_id: Number(status.user_id ?? 0),
      can_use_api: status.can_use_api === true,
      functions: parseDeclaredFunctions(status.functions_json),
      operations: this.client.operationNames()
    };
    return this.discovery;
  }

  hasDeclaredOperation(name) {
    if (!this.discovery) return false;
    return this.discovery.operations.includes(name)
      && this.discovery.functions.includes(operationFunction(name));
  }
}

export function createMoodliaMoodleAdapter(options) {
  return new MoodliaMoodleAdapter(options);
}
