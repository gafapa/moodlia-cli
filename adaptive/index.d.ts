export interface AdaptiveAdapterOptions {
  moodlia?: Record<string, unknown> | null;
  core?: Record<string, unknown> | null;
  profileName?: string | null;
}

/** Discovers both providers and selects one per capability. */
export class AdaptiveMoodleAdapter {
  constructor(options: AdaptiveAdapterOptions);
  readonly provider: 'adaptive';
  readonly adapters: { moodlia: any; core: any };
  profileName: string | null;
  discovery: Record<string, any> | null;
  capabilityProviders: Map<string, string>;
  discoverSite(): Promise<Record<string, unknown>>;
  availableAdapter(preference?: string[]): any;
}

export function createAdaptiveMoodleAdapter(options: AdaptiveAdapterOptions): AdaptiveMoodleAdapter;
export function createAdaptiveSiteAdapter(options: {
  profile: Record<string, unknown>;
  moodliaContract: Record<string, unknown>;
  allowWrite?: boolean;
  /** Subclasses to instantiate, for example the synchronization adapters of moodlia-sync. */
  classes?: { core?: new (options: any) => any; moodlia?: new (options: any) => any; adaptive?: new (options: any) => any };
}): AdaptiveMoodleAdapter;
