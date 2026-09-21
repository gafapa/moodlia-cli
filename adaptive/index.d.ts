export interface AdaptiveAdapterOptions {
  moodlia?: Record<string, unknown> | null;
  core?: Record<string, unknown> | null;
  profileName?: string | null;
}

export class AdaptiveMoodleAdapter {
  constructor(options: AdaptiveAdapterOptions);
  readonly provider: 'adaptive';
  discoverSite(): Promise<Record<string, unknown>>;
  exportCourse(courseId: number): Promise<import('moodle-core-cli/sync').CourseSyncModel>;
  syncCapabilities(context?: { courseId?: number }): Promise<Record<string, unknown>>;
  applySyncAction(action: Record<string, unknown>, context: { courseId: number }): Promise<unknown>;
}

export function createAdaptiveMoodleAdapter(options: AdaptiveAdapterOptions): AdaptiveMoodleAdapter;
export function createAdaptiveSiteAdapter(options: {
  profile: Record<string, unknown>;
  moodliaContract: Record<string, unknown>;
  allowWrite?: boolean;
}): AdaptiveMoodleAdapter;
