export interface MoodliaAdapterOptions {
  client: {
    operationNames(): string[];
    callOperation(name: string, parameters?: Record<string, unknown>): Promise<unknown>;
  };
  profileName?: string | null;
}

/** Site discovery for the MoodlIA plugin. moodlia-sync extends it with synchronization. */
export class MoodliaMoodleAdapter {
  constructor(options: MoodliaAdapterOptions);
  readonly client: MoodliaAdapterOptions['client'];
  readonly provider: 'moodlia';
  profileName: string | null;
  discovery: Record<string, unknown> | null;
  discoverSite(): Promise<Record<string, unknown>>;
  hasDeclaredOperation(name: string): boolean;
}

export function createMoodliaMoodleAdapter(options: MoodliaAdapterOptions): MoodliaMoodleAdapter;
