import type { CourseSyncModel } from 'moodle-core-cli/sync';

export interface MoodliaAdapterOptions {
  client: {
    operationNames(): string[];
    callOperation(name: string, parameters?: Record<string, unknown>): Promise<unknown>;
  };
  profileName?: string | null;
}

export class MoodliaMoodleAdapter {
  constructor(options: MoodliaAdapterOptions);
  readonly provider: 'moodlia';
  discoverSite(): Promise<Record<string, unknown>>;
  exportCourse(courseId: number): Promise<CourseSyncModel>;
  syncCapabilities(input?: { courseId?: number }): Promise<Record<string, unknown>>;
  applySyncAction(action: Record<string, unknown>, context: { courseId: number }): Promise<unknown>;
}

export function createMoodliaMoodleAdapter(options: MoodliaAdapterOptions): MoodliaMoodleAdapter;
