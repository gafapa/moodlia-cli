import { createHash } from 'node:crypto';
import { createCourseSyncModel } from 'moodle-core-cli/sync';

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

function parseCapabilityEvidence(value) {
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseObject(value) {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function uploadMaterial(client, material, itemId = 0) {
  const options = {
    filename: material.asset.filename,
    filepath: material.asset.filepath,
    itemId
  };
  return material.filePath
    ? client.uploadDraftFile(material.filePath, options)
    : client.uploadDraftData(material.data, options);
}

function normalizeEditorContent(contentValue, rawFiles) {
  let content = String(contentValue ?? '');
  const files = (rawFiles ?? []).map((file) => ({
    filename: String(file.filename),
    filepath: String(file.filepath ?? '/'),
    filesize: Number(file.filesize ?? 0),
    mimetype: String(file.mimetype ?? ''),
    content_hash: String(file.content_hash ?? ''),
    url: (() => {
      const url = new URL(String(file.url));
      for (const name of ['token', 'wstoken', 'access_token']) url.searchParams.delete(name);
      return url.toString();
    })()
  }));
  for (const file of files) {
    try {
      const sourceUrl = new URL(file.url);
      const regularPath = sourceUrl.pathname.replace('/webservice/pluginfile.php/', '/pluginfile.php/');
      const webservicePath = sourceUrl.pathname.replace('/pluginfile.php/', '/webservice/pluginfile.php/');
      const replacement = `@@PLUGINFILE@@${file.filepath}${file.filename}`.replace('//', '/');
      for (const reference of [
        new URL(regularPath, sourceUrl.origin).toString(),
        new URL(webservicePath, sourceUrl.origin).toString(),
        regularPath,
        webservicePath
      ]) content = content.split(reference).join(replacement);
    } catch {
      // Invalid asset URLs remain visible to planner verification instead of being fetched.
    }
  }
  return { content, files };
}

function normalizeChapterContent(chapter) {
  return { ...chapter, ...normalizeEditorContent(chapter.content, chapter.files) };
}

async function hashChapterFiles(client, chapter) {
  const normalized = normalizeChapterContent(chapter);
  normalized.files = await Promise.all(normalized.files.map(async (file) => {
    const data = await client.downloadFile(file.url, { maximumBytes: Math.max(file.filesize, 1) });
    return { ...file, sha256: createHash('sha256').update(data).digest('hex') };
  }));
  return normalized;
}

function normalizeFile(file) {
  const url = new URL(String(file.url));
  for (const name of ['token', 'wstoken', 'access_token']) url.searchParams.delete(name);
  return {
    filename: String(file.filename),
    filepath: String(file.filepath ?? '/'),
    filesize: Number(file.filesize ?? 0),
    mimetype: String(file.mimetype ?? ''),
    content_hash: String(file.content_hash ?? ''),
    url: url.toString()
  };
}

async function hashFiles(client, files) {
  return Promise.all((files ?? []).map(async (rawFile) => {
    const file = normalizeFile(rawFile);
    const data = await client.downloadFile(file.url, { maximumBytes: Math.max(file.filesize, 1) });
    return { ...file, sha256: createHash('sha256').update(data).digest('hex') };
  }));
}

async function assignmentAuthoring(client, assignment, gradingForm) {
  const settings = {
    submission_attachments: Boolean(assignment.submissionattachments),
    submission_drafts: Boolean(assignment.submissiondrafts),
    require_submission_statement: Boolean(assignment.requiresubmissionstatement),
    send_notifications: Boolean(assignment.sendnotifications),
    send_late_notifications: Boolean(assignment.sendlatenotifications),
    send_student_notifications: Boolean(assignment.sendstudentnotifications),
    allow_submissions_from_date: Number(assignment.allowsubmissionsfromdate ?? 0),
    due_date: Number(assignment.duedate ?? 0),
    cutoff_date: Number(assignment.cutoffdate ?? 0),
    grading_due_date: Number(assignment.gradingduedate ?? 0),
    grade: Number(assignment.grade ?? 0),
    team_submission: Boolean(assignment.teamsubmission),
    require_all_team_members_submit: Boolean(assignment.requireallteammemberssubmit),
    blind_marking: Boolean(assignment.blindmarking),
    hide_grader: Boolean(assignment.hidegrader),
    max_attempts: Number(assignment.maxattempts ?? 1),
    attempt_reopen_method: String(assignment.attemptreopenmethod ?? 'manual'),
    marking_workflow: Boolean(assignment.markingworkflow),
    marking_allocation: Boolean(assignment.markingallocation),
    online_text: (assignment.submission_plugins ?? []).includes('onlinetext'),
    file_submissions: (assignment.submission_plugins ?? []).includes('file'),
    feedback_comments: (assignment.feedback_plugins ?? []).includes('comments'),
    feedback_files: (assignment.feedback_plugins ?? []).includes('file'),
    feedback_offline: (assignment.feedback_plugins ?? []).includes('offline'),
    feedback_editpdf: (assignment.feedback_plugins ?? []).includes('editpdf')
  };
  const rubric = gradingForm?.active_method === 'rubric' && gradingForm.supported
    ? {
      name: String(gradingForm.name ?? ''),
      description: String(gradingForm.description ?? ''),
      criteria: (gradingForm.criteria ?? []).map((criterion) => ({
        sort_order: Number(criterion.sort_order ?? 0),
        description: String(criterion.description ?? ''),
        levels: (criterion.levels ?? []).map((level) => ({
          score: Number(level.score ?? 0),
          definition: String(level.definition ?? '')
        }))
      })),
      options: parseObject(gradingForm.options_json)
    }
    : null;
  let gradingDefinition = null;
  if (rubric) {
    gradingDefinition = gradingForm.checklist_compatible ? {
      method: 'checklist',
      name: rubric.name,
      description: rubric.description,
      items: rubric.criteria.map((criterion) => ({
        sort_order: criterion.sort_order,
        description: criterion.description,
        score: Math.max(...criterion.levels.map((level) => level.score), 0)
      }))
    } : { method: 'rubric', ...rubric };
  } else if (gradingForm?.active_method === 'guide' && gradingForm.supported) {
    gradingDefinition = {
      method: 'guide',
      name: String(gradingForm.name ?? ''),
      description: String(gradingForm.description ?? ''),
      criteria: (gradingForm.criteria ?? []).map((criterion) => ({
        sort_order: Number(criterion.sort_order ?? 0),
        shortname: String(criterion.shortname ?? ''),
        description: String(criterion.description ?? ''),
        description_markers: String(criterion.description_markers ?? ''),
        max_score: Number(criterion.max_score ?? 0)
      })),
      comments: (gradingForm.comments ?? []).map((comment) => ({
        sort_order: Number(comment.sort_order ?? 0),
        description: String(comment.description ?? '')
      })),
      options: parseObject(gradingForm.options_json)
    };
  }
  const intro = normalizeEditorContent(assignment.intro, assignment.intro_files);
  const activity = normalizeEditorContent(assignment.activity, assignment.activity_files);
  return {
    kind: 'assignment',
    content: {
      intro: intro.content,
      intro_format: Number(assignment.intro_format ?? 1),
      intro_files: await hashFiles(client, intro.files),
      activity: activity.content,
      activity_format: Number(assignment.activity_format ?? 1),
      activity_files: await hashFiles(client, activity.files)
    },
    settings,
    rubric,
    grading_definition: gradingDefinition,
    losses: [
      ...((assignment.submission_plugins ?? []).length > 0 ? ['submission_plugin_configuration_not_exported'] : []),
      ...((assignment.feedback_plugins ?? []).length > 0 ? ['feedback_plugin_configuration_not_exported'] : []),
      ...(Number(assignment.teamsubmissiongroupingid ?? 0) > 0 ? ['team_submission_grouping_requires_mapping'] : [])
    ]
  };
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

  async exportCourse(courseId) {
    const site = this.discovery ?? await this.discoverSite();
    const [course, contents, groupsResult, groupingsResult, assignmentsResult] = await Promise.all([
      this.client.callOperation('get_course_details', { course_id: courseId }),
      this.client.callOperation('get_course_contents', { course_id: courseId }),
      this.client.callOperation('get_groups', { course_id: courseId }).then(
        (value) => ({ value, error: null }),
        (error) => ({ value: { groups: [] }, error })
      ),
      this.client.callOperation('get_groupings', { course_id: courseId }).then(
        (value) => ({ value, error: null }),
        (error) => ({ value: { groupings: [] }, error })
      ),
      this.client.callOperation('get_course_assignments', { course_id: courseId }).then(
        (value) => ({ value, error: null }),
        (error) => ({ value: { assignments: [] }, error })
      )
    ]);
    const exclusions = [
      { scope: 'student_outcomes', reason: 'content_sync_scope' },
      { scope: 'activity_authoring_fields', reason: 'first_sync_milestone' }
    ];
    if (groupsResult.error) exclusions.push({ scope: 'groups', reason: 'source_read_unavailable' });
    if (groupingsResult.error) exclusions.push({ scope: 'groupings', reason: 'source_read_unavailable' });
    if (assignmentsResult.error) exclusions.push({ scope: 'assignments', reason: 'source_read_unavailable' });
    const assignmentsByModule = new Map((assignmentsResult.value.assignments ?? [])
      .map((assignment) => [Number(assignment.module_id), assignment]));
    const sections = structuredClone(contents.sections ?? []);
    await Promise.all(sections.map(async (section) => {
      const normalized = normalizeEditorContent(
        section.summary_raw ?? section.summary,
        section.summary_files
      );
      section.summary = normalized.content;
      section.files = await hashFiles(this.client, normalized.files);
    }));
    await Promise.all(sections.flatMap((section) => (section.modules ?? []).map(async (module) => {
      if (!['assign', 'book', 'page', 'label', 'url', 'resource', 'folder', 'workshop'].includes(module.module_type)) return;
      try {
        if (module.module_type === 'assign') {
          const assignment = assignmentsByModule.get(Number(module.module_id));
          if (!assignment) throw new TypeError('Assignment details are unavailable.');
          const gradingForm = await this.client.callOperation('get_assignment_grading_form', {
            course_id: courseId,
            module_id: module.module_id
          }).catch(() => null);
          module.authoring_completeness = 'selected';
          module.authoring = await assignmentAuthoring(this.client, assignment, gradingForm);
          return;
        }
        const details = await this.client.callOperation('get_module_details', {
          course_id: courseId,
          module_id: module.module_id
        });
        const extra = parseObject(details.extra_json);
        const activity = parseObject(extra.activity);
        module.authoring_completeness = 'complete';
        if (module.module_type === 'page') {
          const normalized = normalizeEditorContent(activity.content, activity.files);
          module.authoring = {
            kind: 'page',
            settings: {
              content: normalized.content,
              content_format: Number(activity.content_format ?? 1),
              print_intro: Boolean(activity.print_intro),
              print_last_modified: activity.print_last_modified === undefined
                ? true
                : Boolean(activity.print_last_modified)
            },
            files: await hashFiles(this.client, normalized.files)
          };
          return;
        }
        if (module.module_type === 'label') {
          const normalized = normalizeEditorContent(activity.content, activity.files);
          module.authoring = {
            kind: 'label',
            settings: {
              content: normalized.content,
              content_format: Number(activity.content_format ?? 1)
            },
            files: await hashFiles(this.client, normalized.files)
          };
          return;
        }
        if (module.module_type === 'url') {
          const displayNames = { 0: 'auto', 1: 'embed', 3: 'new', 5: 'open', 6: 'popup' };
          const normalized = normalizeEditorContent(activity.intro, activity.files);
          module.authoring = {
            kind: 'url',
            settings: {
              external_url: String(activity.external_url ?? ''),
              intro: normalized.content,
              intro_format: Number(activity.intro_format ?? 1),
              ...(displayNames[activity.display] ? { display: displayNames[activity.display] } : {}),
              print_intro: Boolean(activity.print_intro),
              ...(activity.popup_width ? { popup_width: Number(activity.popup_width) } : {}),
              ...(activity.popup_height ? { popup_height: Number(activity.popup_height) } : {})
            },
            files: await hashFiles(this.client, normalized.files)
          };
          return;
        }
        if (module.module_type === 'resource') {
          const resourceDisplays = { 0: 'auto', 1: 'embed', 2: 'download', 3: 'open', 4: 'popup' };
          const filterFiles = { 0: 'none', 1: 'all', 2: 'html' };
          const resourceFiles = await this.client.callOperation('get_resource_files', {
            course_id: courseId,
            module_id: module.module_id
          });
          module.authoring = {
            kind: 'resource',
            settings: {
              intro: String(activity.intro ?? ''),
              intro_format: Number(activity.intro_format ?? 1),
              ...(resourceDisplays[activity.display] ? { display: resourceDisplays[activity.display] } : {}),
              print_intro: Boolean(activity.print_intro),
              show_size: Boolean(activity.show_size),
              show_type: Boolean(activity.show_type),
              show_date: Boolean(activity.show_date),
              filter_files: filterFiles[activity.filter_files] ?? 'none',
              popup_width: Number(activity.popup_width ?? 620),
              popup_height: Number(activity.popup_height ?? 450)
            },
            files: await hashFiles(this.client, resourceFiles.files)
          };
          return;
        }
        if (module.module_type === 'folder') {
          const folderDisplays = { 0: 'separate', 1: 'course' };
          const folderFiles = await this.client.callOperation('get_folder_files', {
            course_id: courseId,
            module_id: module.module_id
          });
          module.authoring = {
            kind: 'folder',
            settings: {
              intro: String(activity.intro ?? ''),
              intro_format: Number(activity.intro_format ?? 1),
              ...(folderDisplays[activity.display] ? { display: folderDisplays[activity.display] } : {}),
              show_expanded: Boolean(activity.show_expanded),
              show_download_folder: Boolean(activity.show_download_folder),
              force_download: Boolean(activity.force_download)
            },
            files: await hashFiles(this.client, folderFiles.files)
          };
          return;
        }
        if (module.module_type === 'workshop') {
          const submissionModes = { 0: 'disabled', 1: 'available', 2: 'required' };
          const exampleModes = { 0: 'voluntary', 1: 'before_submission', 2: 'before_assessment' };
          const gradingForm = await this.client.callOperation('get_workshop_grading_form', {
            course_id: courseId,
            module_id: module.module_id
          });
          module.authoring = {
            kind: 'workshop',
            settings: {
              strategy: String(activity.strategy ?? 'accumulative'),
              submission_grade: Number(activity.submission_grade ?? 80),
              assessment_grade: Number(activity.assessment_grade ?? 20),
              grade_decimals: Number(activity.grade_decimals ?? 0),
              submission_instructions: String(activity.submission_instructions ?? ''),
              assessment_instructions: String(activity.assessment_instructions ?? ''),
              text_submission: submissionModes[activity.text_submission] ?? 'available',
              file_submission: submissionModes[activity.file_submission] ?? 'available',
              max_submission_attachments: Number(activity.max_submission_attachments ?? 1),
              submission_file_types: String(activity.submission_file_types ?? ''),
              max_file_size: Number(activity.max_file_size ?? 0),
              late_submissions: Boolean(activity.late_submissions),
              self_assessment: Boolean(activity.self_assessment),
              example_submissions: Boolean(activity.example_submissions),
              examples_mode: exampleModes[activity.examples_mode] ?? 'voluntary',
              submission_start: Number(activity.submission_start ?? 0),
              submission_end: Number(activity.submission_end ?? 0),
              assessment_start: Number(activity.assessment_start ?? 0),
              assessment_end: Number(activity.assessment_end ?? 0),
              switch_to_assessment_after_submission_deadline: Boolean(
                activity.switch_to_assessment_after_submission_deadline
              ),
              conclusion: String(activity.conclusion ?? '')
            },
            phase: Number(gradingForm.phase ?? activity.phase ?? 0),
            grading_form: {
              strategy: String(gradingForm.strategy),
              definition: parseObject(gradingForm.definition_json)
            }
          };
          return;
        }
        const chapters = await this.client.callOperation('get_book_chapters', {
            course_id: courseId,
            module_id: module.module_id,
            include_content: true,
            include_hidden: true
          });
        const numberingNames = { 0: 'none', 1: 'numbers', 2: 'bullets', 3: 'indented' };
        module.authoring = {
          kind: 'book',
          settings: {
            ...(activity.numbering === undefined
              ? {}
              : { numbering: numberingNames[activity.numbering] ?? String(activity.numbering) }),
            ...(activity.custom_titles === undefined && activity.customtitles === undefined
              ? {}
              : { custom_titles: Boolean(activity.custom_titles ?? activity.customtitles) })
          },
          chapters: await Promise.all((chapters.chapters ?? []).map((chapter) => hashChapterFiles(this.client, chapter)))
        };
      } catch {
        module.authoring_completeness = 'unavailable';
        exclusions.push({
          scope: `module:${module.module_id}`,
          reason: `${module.module_type}_authoring_read_unavailable`
        });
      }
    })));
    return createCourseSyncModel({
      site,
      course,
      sections,
      groups: groupsResult.value.groups ?? [],
      groupings: groupingsResult.value.groupings ?? [],
      exclusions,
      unknowns: exclusions
        .filter((entry) => entry.reason.endsWith('_read_unavailable'))
        .map((entry) => ({ ...entry, field: 'authoring' })),
      completeness: { inventory: 'complete', pagination: 'complete', authoring: 'selected' },
      capabilityEvidence: {
        provider: 'moodlia',
        plugin_version: site.plugin_version,
        declared_function_count: site.functions.length,
        contract_operation_count: site.operations.length
      }
    });
  }

  async prepareTargetCourse({ category_id: categoryId, shortname }) {
    const site = this.discovery ?? await this.discoverSite();
    return createCourseSyncModel({
      site,
      course: { id: null, fullname: '', shortname: '', category_id: categoryId, visible: false },
      sections: [{ id: null, section: 0, name: '', summary: '', visible: true, modules: [] }],
      targetCreation: { category_id: Number(categoryId), shortname: String(shortname) },
      exclusions: [{ scope: 'target_course', reason: 'not_created_yet' }]
    });
  }

  async syncCapabilities({ courseId, categoryId } = {}) {
    if (!this.discovery) await this.discoverSite();
    let evidence = {};
    if (this.hasDeclaredOperation('get_sync_capabilities')) {
      const result = await this.client.callOperation('get_sync_capabilities', {
        ...(courseId === undefined ? {} : { course_id: courseId }),
        ...(categoryId === undefined ? {} : { category_id: categoryId })
      });
      evidence = parseCapabilityEvidence(result.capabilities_json);
    }
    const courseWriteAllowed = evidence.course_update === true;
    const courseCreateAllowed = evidence.course_create === true;
    const groupWriteAllowed = evidence.group_manage === true;
    const activityWriteAllowed = evidence.activity_manage === true;
    const bookWriteAllowed = evidence.book_edit === true && activityWriteAllowed;
    const gradingFormWriteAllowed = evidence.assignment_grade === true && evidence.grading_form_manage === true;
    const workshopFormWriteAllowed = evidence.workshop_form_manage === true && activityWriteAllowed;
    return {
      course_create: {
        available: this.hasDeclaredOperation('create_course') && courseCreateAllowed,
        supported_fields: ['fullname', 'shortname', 'category_id', 'idnumber', 'summary', 'visible', 'start_date', 'end_date']
      },
      course_update: {
        available: this.hasDeclaredOperation('update_course') && courseWriteAllowed,
        supported_fields: [
          'fullname', 'shortname', 'category_id', 'summary', 'summary_format',
          'visible', 'start_date', 'end_date'
        ]
      },
      section_create: {
        available: this.hasDeclaredOperation('create_section') && courseWriteAllowed,
        supported_fields: ['name', 'summary', 'summary_format', 'visible', 'order']
      },
      section_update: {
        available: this.hasDeclaredOperation('update_section') && courseWriteAllowed,
        supported_fields: ['name', 'summary', 'summary_format', 'visible', 'order']
      },
      group_create: {
        available: this.hasDeclaredOperation('create_group') && groupWriteAllowed,
        supported_fields: ['name', 'description', 'idnumber']
      },
      group_update: {
        available: this.hasDeclaredOperation('update_group') && groupWriteAllowed,
        supported_fields: ['name', 'description', 'idnumber']
      },
      grouping_create: {
        available: this.hasDeclaredOperation('create_grouping') && groupWriteAllowed,
        supported_fields: ['name', 'description', 'idnumber']
      },
      grouping_update: {
        available: this.hasDeclaredOperation('update_grouping') && groupWriteAllowed,
        supported_fields: ['name', 'description', 'idnumber']
      },
      grouping_member_add: {
        available: this.hasDeclaredOperation('add_group_to_grouping') && groupWriteAllowed,
        supported_fields: ['grouping_id', 'group_id']
      },
      module_create: {
        available: this.hasDeclaredOperation('create_module') && activityWriteAllowed,
        supported_fields: ['module_type', 'name', 'visible', 'visible_on_course_page', 'settings']
      },
      module_update: {
        available: this.hasDeclaredOperation('update_module') && activityWriteAllowed,
        supported_fields: ['name', 'visible']
      },
      book_chapter_create: {
        available: this.hasDeclaredOperation('create_book_chapter') && bookWriteAllowed,
        supported_fields: ['title', 'content', 'content_format', 'subchapter', 'hidden', 'order']
      },
      book_chapter_update: {
        available: this.hasDeclaredOperation('update_book_chapter') && bookWriteAllowed,
        supported_fields: ['title', 'content', 'content_format', 'subchapter', 'hidden', 'order']
      },
      book_asset_transfer: {
        available: this.hasDeclaredOperation('update_book_chapter') && bookWriteAllowed,
        supported_fields: ['filename', 'filepath', 'filesize', 'content_hash', 'content']
      },
      page_content_update: {
        available: this.hasDeclaredOperation('update_page') && activityWriteAllowed,
        supported_fields: ['name', 'content', 'content_format', 'print_intro', 'print_last_modified']
      },
      label_content_update: {
        available: this.hasDeclaredOperation('update_label') && activityWriteAllowed,
        supported_fields: ['content', 'content_format']
      },
      url_content_update: {
        available: this.hasDeclaredOperation('update_url') && activityWriteAllowed,
        supported_fields: ['name', 'external_url', 'intro', 'intro_format', 'display', 'print_intro', 'popup_width',
          'popup_height']
      },
      module_asset_stage: {
        available: activityWriteAllowed,
        supported_fields: ['filename', 'filepath', 'filesize', 'content_hash']
      },
      resource_asset_replace: {
        available: this.hasDeclaredOperation('update_resource') && activityWriteAllowed,
        supported_fields: ['filename', 'filepath', 'filesize', 'content_hash']
      },
      assignment_content_update: {
        available: this.hasDeclaredOperation('update_assignment') && activityWriteAllowed,
        supported_fields: ['name', 'intro', 'intro_format', 'activity', 'activity_format']
      },
      assignment_rubric_set: {
        available: this.hasDeclaredOperation('set_assignment_rubric') && gradingFormWriteAllowed,
        supported_fields: ['name', 'description', 'criteria', 'options']
      },
      assignment_checklist_set: {
        available: this.hasDeclaredOperation('set_assignment_checklist') && gradingFormWriteAllowed,
        supported_fields: ['name', 'description', 'items']
      },
      assignment_guide_set: {
        available: this.hasDeclaredOperation('set_assignment_marking_guide') && gradingFormWriteAllowed,
        supported_fields: ['name', 'description', 'criteria', 'comments', 'options']
      },
      workshop_form_set: {
        available: this.hasDeclaredOperation('set_workshop_grading_form') && workshopFormWriteAllowed,
        supported_fields: ['strategy', 'definition']
      }
    };
  }

  async applySyncAction(action, { courseId, createdEntities = new Map() }) {
    if (action.kind === 'course.create') {
      return this.client.callOperation('create_course', action.fields);
    }
    if (action.kind === 'course.update') {
      return this.client.callOperation('update_course', { course_id: courseId, ...action.fields });
    }
    if (action.kind === 'section.create') {
      const { order, ...fields } = action.fields;
      return this.client.callOperation('create_section', {
        course_id: courseId,
        ...fields,
        ...(order === undefined ? {} : { position: order })
      });
    }
    if (action.kind === 'section.update') {
      const { order, ...fields } = action.fields;
      const createdSection = createdEntities.get(`sections:${action.parent_source_key ?? action.source_key}`);
      let sectionId = action.target_id ?? createdSection?.section_id;
      if (!sectionId) {
        const contents = await this.client.callOperation('get_course_contents', { course_id: courseId });
        sectionId = (contents.sections ?? []).find(
          (section) => Number(section.section_number) === Number(action.target_section_number)
        )?.section_id;
      }
      if (!Number.isInteger(Number(sectionId))) {
        throw new TypeError(`Cannot resolve destination section ${action.target_section_number}.`);
      }
      const staged = action.asset_stage_source_key
        ? createdEntities.get(`drafts:${action.asset_stage_source_key}`)
        : null;
      return this.client.callOperation('update_section', {
        course_id: courseId,
        section_id: Number(sectionId),
        ...fields,
        ...(staged?.draft_item_id ? {
          filename: staged.files[0].filename,
          draft_item_id: staged.draft_item_id
        } : {})
      });
    }
    if (action.kind === 'group.create') {
      return this.client.callOperation('create_group', { course_id: courseId, ...action.fields });
    }
    if (action.kind === 'group.update') {
      return this.client.callOperation('update_group', { group_id: action.target_id, ...action.fields });
    }
    if (action.kind === 'grouping.create') {
      return this.client.callOperation('create_grouping', { course_id: courseId, ...action.fields });
    }
    if (action.kind === 'grouping.update') {
      return this.client.callOperation('update_grouping', { grouping_id: action.target_id, ...action.fields });
    }
    if (action.kind === 'grouping.member.add') {
      const grouping = createdEntities.get(`groupings:${action.grouping_source_key}`);
      const group = createdEntities.get(`groups:${action.group_source_key}`);
      const groupingId = action.target_grouping_id ?? Number(grouping?.id ?? grouping?.grouping_id);
      const groupId = action.target_group_id ?? Number(group?.id ?? group?.group_id);
      if (!Number.isInteger(groupingId) || !Number.isInteger(groupId)) {
        throw new TypeError(`Cannot resolve grouping membership targets for ${action.source_key}.`);
      }
      return this.client.callOperation('add_group_to_grouping', {
        grouping_id: groupingId,
        group_id: groupId
      });
    }
    if (action.kind === 'module.create') {
      const createdSection = createdEntities.get(`sections:${action.parent_source_key}`);
      const sectionNumber = action.target_section_number ?? createdSection?.section_number;
      if (!Number.isInteger(Number(sectionNumber))) {
        throw new TypeError(`Cannot resolve the destination section for ${action.source_key}.`);
      }
      const { module_type: moduleType, name, visible, settings } = action.fields;
      const staged = action.asset_stage_source_key
        ? createdEntities.get(`drafts:${action.asset_stage_source_key}`)
        : null;
      return this.client.callOperation('create_module', {
        course_id: courseId,
        section_number: Number(sectionNumber),
        module_type: moduleType,
        name,
        options: {
          ...settings,
          visible,
          ...(staged?.draft_item_id ? { draft_item_id: staged.draft_item_id } : {}),
          ...(['resource', 'page', 'label', 'url'].includes(moduleType) && staged?.files?.[0]?.filename
            ? { filename: staged.files[0].filename }
            : {})
        }
      });
    }
    if (action.kind === 'module.update') {
      return this.client.callOperation('update_module', {
        course_id: courseId,
        module_id: action.target_id,
        ...action.fields
      });
    }
    if (action.kind === 'book_chapter.create') {
      const createdModule = createdEntities.get(`modules:${action.parent_source_key}`);
      const moduleId = action.target_module_id ?? createdModule?.module_id;
      const previousChapter = action.after_source_key
        ? createdEntities.get(`chapters:${action.after_source_key}`)
        : null;
      const { order, ...fields } = action.fields;
      return this.client.callOperation('create_book_chapter', {
        course_id: courseId,
        module_id: Number(moduleId),
        ...fields,
        ...(previousChapter?.chapter_id ? { after_chapter_id: previousChapter.chapter_id } : {})
      });
    }
    if (action.kind === 'book_chapter.update') {
      const { order, ...fields } = action.fields;
      return this.client.callOperation('update_book_chapter', {
        course_id: courseId,
        module_id: action.target_module_id,
        chapter_id: action.target_id,
        ...fields
      });
    }
    if (action.kind === 'page_content.update') {
      const formats = { 1: 'html', 2: 'plain', html: 'html', plain: 'plain' };
      const fields = { ...action.fields };
      if (fields.content_format !== undefined) fields.content_format = formats[fields.content_format];
      if (action.fields.content_format !== undefined && !fields.content_format) {
        throw new TypeError('Page content format cannot be represented by the destination operation.');
      }
      const staged = action.asset_stage_source_key
        ? createdEntities.get(`drafts:${action.asset_stage_source_key}`)
        : null;
      return this.client.callOperation('update_page', {
        course_id: courseId,
        module_id: action.target_id,
        ...fields,
        ...(staged?.draft_item_id ? {
          filename: staged.files[0].filename,
          draft_item_id: staged.draft_item_id
        } : {})
      });
    }
    if (action.kind === 'label_content.update' || action.kind === 'url_content.update') {
      const operation = action.kind === 'label_content.update' ? 'update_label' : 'update_url';
      const formatField = action.kind === 'label_content.update' ? 'content_format' : 'intro_format';
      const formats = { 1: 'html', 2: 'plain', html: 'html', plain: 'plain' };
      const fields = { ...action.fields };
      if (fields[formatField] !== undefined) fields[formatField] = formats[fields[formatField]];
      if (action.fields[formatField] !== undefined && !fields[formatField]) {
        throw new TypeError(`${action.kind} format cannot be represented by the destination operation.`);
      }
      if (action.kind === 'url_content.update' && typeof fields.display === 'string') {
        const displays = { auto: 0, embed: 1, new: 3, open: 5, popup: 6 };
        fields.display = displays[fields.display];
      }
      const staged = action.asset_stage_source_key
        ? createdEntities.get(`drafts:${action.asset_stage_source_key}`)
        : null;
      return this.client.callOperation(operation, {
        course_id: courseId,
        module_id: action.target_id,
        ...fields,
        ...(staged?.draft_item_id ? {
          filename: staged.files[0].filename,
          draft_item_id: staged.draft_item_id
        } : {})
      });
    }
    if (action.kind === 'assignment_content.update') {
      const formats = { 1: 'html', 2: 'plain', html: 'html', plain: 'plain' };
      const fields = { ...action.fields };
      if (fields.intro_format !== undefined) fields.intro_format = formats[fields.intro_format];
      if (fields.activity_format !== undefined) fields.activity_format = formats[fields.activity_format];
      if ((action.fields.intro_format !== undefined && !fields.intro_format)
        || (action.fields.activity_format !== undefined && !fields.activity_format)) {
        throw new TypeError('Assignment content format cannot be represented by the destination operation.');
      }
      const createdModule = createdEntities.get(`modules:${action.parent_source_key ?? action.source_key}`);
      const moduleId = action.target_id ?? createdModule?.module_id;
      const staged = action.asset_stage_source_key
        ? createdEntities.get(`drafts:${action.asset_stage_source_key}`)
        : null;
      return this.client.callOperation('update_assignment', {
        course_id: courseId,
        module_id: Number(moduleId),
        ...fields,
        ...(staged?.draft_item_id ? {
          filename: staged.files[0].filename,
          draft_item_id: staged.draft_item_id,
          file_area: action.file_area
        } : {})
      });
    }
    if (action.kind === 'assignment_rubric.set') {
      const createdModule = createdEntities.get(`modules:${action.parent_source_key}`);
      const moduleId = action.target_module_id ?? createdModule?.module_id;
      return this.client.callOperation('set_assignment_rubric', {
        course_id: courseId,
        module_id: Number(moduleId),
        ...action.fields,
        criteria: { criteria: action.fields.criteria }
      });
    }
    if (action.kind === 'assignment_checklist.set' || action.kind === 'assignment_guide.set') {
      const createdModule = createdEntities.get(`modules:${action.parent_source_key}`);
      const moduleId = action.target_module_id ?? createdModule?.module_id;
      if (action.kind === 'assignment_checklist.set') {
        return this.client.callOperation('set_assignment_checklist', {
          course_id: courseId,
          module_id: Number(moduleId),
          ...action.fields,
          items: { items: action.fields.items }
        });
      }
      return this.client.callOperation('set_assignment_marking_guide', {
        course_id: courseId,
        module_id: Number(moduleId),
        ...action.fields,
        criteria: { criteria: action.fields.criteria },
        comments: { comments: action.fields.comments ?? [] }
      });
    }
    if (action.kind === 'workshop_form.set') {
      const createdModule = createdEntities.get(`modules:${action.parent_source_key}`);
      const moduleId = action.target_module_id ?? createdModule?.module_id;
      return this.client.callOperation('set_workshop_grading_form', {
        course_id: courseId,
        module_id: Number(moduleId),
        strategy: action.fields.strategy,
        definition: action.fields.definition
      });
    }
    throw new TypeError(`MoodlIA adapter cannot apply sync action ${action.kind}.`);
  }

  async downloadAsset(asset) {
    return this.client.downloadFile(asset.url, { maximumBytes: Math.max(asset.filesize, 1) });
  }

  async downloadAssetToFile(asset, destinationPath) {
    return this.client.downloadFileToPath(asset.url, destinationPath, {
      maximumBytes: Math.max(asset.filesize, 1)
    });
  }

  async stageModuleAssets(action, assetsWithData) {
    let draftItemId = 0;
    const files = [];
    for (const material of assetsWithData) {
      const uploaded = await uploadMaterial(this.client, material, draftItemId);
      draftItemId = uploaded.draft_item_id;
      files.push(uploaded);
    }
    return { draft_item_id: draftItemId, files };
  }

  async replaceResourceAsset(action, material, { courseId }) {
    const resolvedMaterial = material instanceof Uint8Array ? { data: material } : material;
    const uploaded = await uploadMaterial(this.client, { asset: action.asset, ...resolvedMaterial });
    return this.client.callOperation('update_resource', {
      course_id: courseId,
      module_id: action.target_id,
      filename: uploaded.filename,
      draft_item_id: uploaded.draft_item_id,
      ...(action.fields ?? {})
    });
  }

  async publishBookChapterAssets(action, assetsWithData, { courseId, createdEntities = new Map() }) {
    const createdModule = createdEntities.get(`modules:${action.parent_module_source_key}`);
    const createdChapter = createdEntities.get(`chapters:${action.parent_source_key}`);
    const moduleId = action.target_module_id ?? createdModule?.module_id;
    const chapterId = action.target_chapter_id ?? createdChapter?.chapter_id;
    if (!Number.isInteger(Number(moduleId)) || !Number.isInteger(Number(chapterId))) {
      throw new TypeError(`Cannot resolve the destination Book chapter for ${action.source_key}.`);
    }
    let draftItemId = 0;
    const uploadedFiles = [];
    for (const material of assetsWithData) {
      const uploaded = await uploadMaterial(this.client, material, draftItemId);
      draftItemId = uploaded.draft_item_id;
      uploadedFiles.push(uploaded);
    }
    return this.client.callOperation('update_book_chapter', {
      course_id: courseId,
      module_id: Number(moduleId),
      chapter_id: Number(chapterId),
      content: action.content,
      content_format: action.content_format,
      filename: uploadedFiles[0]?.filename,
      draft_item_id: draftItemId
    });
  }
}

export function createMoodliaMoodleAdapter(options) {
  return new MoodliaMoodleAdapter(options);
}
