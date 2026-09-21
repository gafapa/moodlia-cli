// This file is generated from contract/operations.json.
// Run npm run types:generate after changing the canonical operation contract.

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject { [key: string]: JsonValue; }

export type MoodleOperationName = "get_current_user" | "get_moodlia_status" | "get_sync_capabilities" | "list_plugins" | "get_plugin_details" | "get_plugin_dependencies" | "check_plugin_updates" | "set_plugin_enabled" | "get_courses" | "get_course_categories" | "create_course_category" | "update_course_category" | "delete_course_category" | "get_course_contents" | "get_course_details" | "get_module_details" | "get_calendar_events" | "create_calendar_event" | "update_calendar_event" | "delete_calendar_event" | "get_enrolled_users" | "get_grade_items" | "set_course_grade_pass" | "get_user_grades" | "get_course_completion_criteria" | "set_course_completion_criteria" | "get_course_completion_status" | "get_activity_completion_statuses" | "get_grade_categories" | "create_grade_category" | "update_grade_category" | "delete_grade_category" | "create_grade_item" | "update_grade_item" | "delete_grade_item" | "update_grade_value" | "get_course_progress_report" | "set_activity_completion_status" | "get_user_details" | "create_user" | "update_user" | "delete_user" | "create_cohort" | "update_cohort" | "delete_cohort" | "add_cohort_member" | "remove_cohort_member" | "assign_course_role" | "unassign_course_role" | "enrol_user" | "unenrol_user" | "get_groups" | "create_group" | "update_group" | "delete_group" | "get_groupings" | "create_grouping" | "update_grouping" | "delete_grouping" | "add_group_to_grouping" | "remove_group_from_grouping" | "get_group_members" | "add_group_member" | "remove_group_member" | "create_course" | "export_course_blueprint" | "create_course_from_blueprint" | "apply_course_blueprint" | "copy_course_structure" | "sync_course_enrolments" | "set_course_publish_state" | "audit_course" | "backup_course" | "restore_course_backup" | "upload_course_backup" | "get_course_backup_files" | "delete_course_backup_file" | "audit_course_completion" | "repair_course_completion" | "update_course" | "move_course" | "delete_course" | "create_section" | "update_section" | "delete_section" | "create_module" | "update_module" | "duplicate_module" | "move_module" | "get_course_books" | "get_book_chapters" | "view_book" | "create_book_chapter" | "update_book_chapter" | "move_book_chapter" | "delete_book_chapter" | "get_lesson_access_information" | "get_lesson_details" | "get_course_lessons" | "get_lesson_pages" | "create_lesson_page" | "update_lesson_page" | "delete_lesson_page" | "view_lesson" | "get_lesson_user_grade" | "get_lesson_user_timers" | "get_lesson_possible_jumps" | "get_lesson_attempts_overview" | "get_data_fields" | "create_data_field" | "update_data_field" | "delete_data_field" | "get_data_entries" | "create_data_entry" | "update_data_entry" | "delete_data_entry" | "set_workshop_phase" | "get_workshop_submissions" | "get_workshop_user_plan" | "get_workshop_grades" | "get_workshop_grades_report" | "get_workshop_reviewer_assessments" | "get_workshop_submission_assessments" | "allocate_workshop_submission" | "get_workshop_assessment_form_definition" | "get_workshop_grading_form" | "set_workshop_grading_form" | "update_workshop_assessment" | "evaluate_workshop_assessment" | "create_workshop_submission" | "update_workshop_submission" | "delete_workshop_submission" | "create_glossary_entry" | "get_course_glossaries" | "view_glossary" | "view_glossary_entry" | "get_glossary_entry" | "get_glossary_entries_by_letter" | "get_glossary_entries_by_category" | "get_glossary_entries_by_author" | "get_glossary_entries_by_author_id" | "get_glossary_entries_by_date" | "get_glossary_entries_by_term" | "get_glossary_categories" | "get_glossary_authors" | "search_glossary_entries" | "get_glossary_entries_to_approve" | "update_glossary_entry" | "delete_glossary_entry" | "create_wiki_page" | "get_wiki_pages" | "get_wiki_subwikis" | "get_wiki_files" | "view_wiki" | "view_wiki_page" | "update_wiki_page" | "delete_wiki_page" | "get_choice_options" | "get_course_choices" | "view_choice" | "submit_choice_response" | "delete_choice_responses" | "get_course_feedbacks" | "view_feedback" | "get_feedback_access_information" | "create_feedback_item" | "update_feedback_item" | "get_feedback_items" | "get_feedback_page_items" | "get_feedback_analysis" | "get_feedback_finished_responses" | "delete_feedback_item" | "get_choice_results" | "get_course_forums" | "view_forum" | "get_forum_discussions" | "create_forum_discussion" | "get_forum_discussion_posts" | "create_forum_discussion_post" | "update_forum_discussion_post" | "set_forum_discussion_pin" | "set_forum_discussion_favourite" | "set_forum_discussion_subscription" | "set_forum_discussion_lock" | "delete_forum_discussion_post" | "get_course_assignments" | "update_assignment" | "get_assignment_submission_status" | "save_assignment_submission" | "submit_assignment_for_grading" | "save_assignment_grade" | "get_assignment_grading_form" | "set_assignment_rubric" | "set_assignment_checklist" | "set_assignment_marking_guide" | "grade_assignment_with_rubric" | "grade_assignment_with_checklist" | "grade_assignment_with_marking_guide" | "get_assignment_submissions" | "get_assignment_grades" | "view_assignment" | "view_assignment_submission_status" | "view_assignment_grading_table" | "delete_module" | "upload_folder_file" | "get_folder_files" | "download_folder_file" | "update_page" | "update_label" | "update_url" | "update_resource" | "get_resource_files" | "download_resource_file" | "delete_folder_file" | "get_question_banks" | "get_question_categories" | "export_question_bank_blueprint" | "import_question_bank_blueprint" | "create_question_category" | "update_question_category" | "delete_question_category" | "create_question" | "get_questions" | "update_question" | "move_question" | "delete_question" | "get_quiz_questions" | "get_course_quizzes" | "start_quiz_attempt" | "get_quiz_attempts" | "get_quiz_results_report" | "get_quiz_attempt_access_information" | "get_quiz_attempt_data" | "get_quiz_attempt_summary" | "save_quiz_attempt" | "process_quiz_attempt" | "get_quiz_attempt_review" | "get_quiz_access_information" | "get_quiz_combined_review_options" | "view_quiz" | "view_quiz_attempt" | "view_quiz_attempt_summary" | "view_quiz_attempt_review" | "get_quiz_user_best_grade" | "get_quiz_feedback_for_grade" | "get_quiz_required_question_types" | "add_question_to_quiz" | "add_random_questions_to_quiz" | "remove_question_from_quiz" | "update_quiz_question_slot";

export interface GetCurrentUserParameters {}

export interface GetMoodliaStatusParameters {}

export interface GetSyncCapabilitiesParameters {
  course_id?: number;
  category_id?: number;
}

export interface ListPluginsParameters {
  plugin_type?: string;
  source?: "all" | "standard" | "additional" | "missing";
  status?: "all" | "nodb" | "uptodate" | "new" | "upgrade" | "delete" | "downgrade" | "missing";
}

export interface GetPluginDetailsParameters {
  component: string;
}

export interface GetPluginDependenciesParameters {
  component: string;
}

export interface CheckPluginUpdatesParameters {
  component?: string;
  refresh?: boolean;
}

export interface SetPluginEnabledParameters {
  component: string;
  enabled: boolean;
}

export interface GetCoursesParameters {
  limit?: number;
}

export interface GetCourseCategoriesParameters {
  parent_id?: number;
}

export interface CreateCourseCategoryParameters {
  name: string;
  parent_id?: number;
  visible?: boolean;
  reuse_existing?: boolean;
}

export interface UpdateCourseCategoryParameters {
  category_id: number;
  name?: string;
  visible?: boolean;
}

export interface DeleteCourseCategoryParameters {
  category_id: number;
}

export interface GetCourseContentsParameters {
  course_id: number;
}

export interface GetCourseDetailsParameters {
  course_id: number;
}

export interface GetModuleDetailsParameters {
  course_id: number;
  module_id: number;
}

export interface GetCalendarEventsParameters {
  course_id: number;
  time_from: number;
  time_to: number;
}

export interface CreateCalendarEventParameters {
  course_id: number;
  name: string;
  timestart: number;
  description?: string;
  timeduration?: number;
}

export interface UpdateCalendarEventParameters {
  course_id: number;
  event_id: number;
  name?: string;
  description?: string;
  timestart?: number;
  timeduration?: number;
}

export interface DeleteCalendarEventParameters {
  course_id: number;
  event_id: number;
}

export interface GetEnrolledUsersParameters {
  course_id: number;
}

export interface GetGradeItemsParameters {
  course_id: number;
}

export interface SetCourseGradePassParameters {
  course_id: number;
  grade_pass?: number;
  grade_pass_percent?: number;
}

export interface GetUserGradesParameters {
  course_id: number;
  user_id?: number;
  group_id?: number;
}

export interface GetCourseCompletionCriteriaParameters {
  course_id: number;
}

export interface SetCourseCompletionCriteriaParameters {
  course_id: number;
  required_module_ids?: unknown[];
  require_all_activities?: boolean;
  required_course_grade_percent?: number;
  criteria_aggregation?: "all" | "any";
}

export interface GetCourseCompletionStatusParameters {
  course_id: number;
  user_id?: number;
}

export interface GetActivityCompletionStatusesParameters {
  course_id: number;
  user_id?: number;
}

export interface GetGradeCategoriesParameters {
  course_id: number;
}

export interface CreateGradeCategoryParameters {
  course_id: number;
  name: string;
  aggregation?: number;
  grade_pass?: number;
  grade_max?: number;
  exclude_empty_grades?: boolean;
}

export interface UpdateGradeCategoryParameters {
  course_id: number;
  category_id: number;
  name?: string;
  aggregation?: number;
  hidden?: boolean;
  grade_pass?: number;
  grade_max?: number;
  exclude_empty_grades?: boolean;
  keep_highest?: number;
  drop_lowest?: number;
}

export interface DeleteGradeCategoryParameters {
  course_id: number;
  category_id: number;
}

export interface CreateGradeItemParameters {
  course_id: number;
  name: string;
  grade_max?: number;
  grade_min?: number;
  grade_pass?: number;
  category_id?: number;
  hidden?: boolean;
}

export interface UpdateGradeItemParameters {
  course_id: number;
  item_id: number;
  name?: string;
  grade_max?: number;
  grade_min?: number;
  grade_pass?: number;
  category_id?: number;
  hidden?: boolean;
  locked?: boolean;
  weight?: number;
}

export interface DeleteGradeItemParameters {
  course_id: number;
  item_id: number;
}

export interface UpdateGradeValueParameters {
  course_id: number;
  item_id: number;
  user_id: number;
  grade: number;
  feedback?: string;
}

export interface GetCourseProgressReportParameters {
  course_id: number;
  limit?: number;
}

export interface SetActivityCompletionStatusParameters {
  module_id: number;
  completed: boolean;
}

export interface GetUserDetailsParameters {
  user_id: number;
}

export interface CreateUserParameters {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  auth?: string;
  suspended?: boolean;
}

export interface UpdateUserParameters {
  user_id: number;
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
  auth?: string;
  suspended?: boolean;
}

export interface DeleteUserParameters {
  user_id: number;
}

export interface CreateCohortParameters {
  name: string;
  idnumber?: string;
  description?: string;
  visible?: boolean;
}

export interface UpdateCohortParameters {
  cohort_id: number;
  name?: string;
  idnumber?: string;
  description?: string;
  visible?: boolean;
}

export interface DeleteCohortParameters {
  cohort_id: number;
}

export interface AddCohortMemberParameters {
  cohort_id: number;
  user_id: number;
}

export interface RemoveCohortMemberParameters {
  cohort_id: number;
  user_id: number;
}

export interface AssignCourseRoleParameters {
  course_id: number;
  user_id: number;
  role_archetype?: "student" | "teacher" | "editingteacher";
}

export interface UnassignCourseRoleParameters {
  course_id: number;
  user_id: number;
  role_archetype?: "student" | "teacher" | "editingteacher";
}

export interface EnrolUserParameters {
  course_id: number;
  user_id: number;
  role_archetype?: "student" | "teacher" | "editingteacher";
}

export interface UnenrolUserParameters {
  course_id: number;
  user_id: number;
}

export interface GetGroupsParameters {
  course_id: number;
}

export interface CreateGroupParameters {
  course_id: number;
  name: string;
  description?: string;
  idnumber?: string;
}

export interface UpdateGroupParameters {
  course_id: number;
  group_id: number;
  name?: string;
  description?: string;
  idnumber?: string;
}

export interface DeleteGroupParameters {
  course_id: number;
  group_id: number;
}

export interface GetGroupingsParameters {
  course_id: number;
}

export interface CreateGroupingParameters {
  course_id: number;
  name: string;
  description?: string;
  idnumber?: string;
}

export interface UpdateGroupingParameters {
  course_id: number;
  grouping_id: number;
  name?: string;
  description?: string;
  idnumber?: string;
}

export interface DeleteGroupingParameters {
  course_id: number;
  grouping_id: number;
}

export interface AddGroupToGroupingParameters {
  course_id: number;
  grouping_id: number;
  group_id: number;
}

export interface RemoveGroupFromGroupingParameters {
  course_id: number;
  grouping_id: number;
  group_id: number;
}

export interface GetGroupMembersParameters {
  course_id: number;
  group_id: number;
}

export interface AddGroupMemberParameters {
  course_id: number;
  group_id: number;
  user_id: number;
}

export interface RemoveGroupMemberParameters {
  course_id: number;
  group_id: number;
  user_id: number;
}

export interface CreateCourseParameters {
  fullname: string;
  shortname: string;
  category_id?: number;
  visible?: boolean;
  summary?: string;
  summary_format?: "html" | "plain";
  course_format?: string;
  start_date?: number;
  end_date?: number;
  enable_completion?: boolean;
}

export interface ExportCourseBlueprintParameters {
  course_id: number;
  include_contents?: boolean;
  include_groups?: boolean;
}

export interface CreateCourseFromBlueprintParameters {
  blueprint: JsonObject | string;
}

export interface ApplyCourseBlueprintParameters {
  course_id: number;
  blueprint: JsonObject | string;
}

export interface CopyCourseStructureParameters {
  source_course_id: number;
  target_course_id: number;
  include_contents?: boolean;
  include_groups?: boolean;
}

export interface SyncCourseEnrolmentsParameters {
  course_id: number;
  enrolments: string;
  unenrol_missing?: boolean;
}

export interface SetCoursePublishStateParameters {
  course_id: number;
  publish_state: "draft" | "ready" | "published" | "archived";
}

export interface AuditCourseParameters {
  course_id: number;
}

export interface BackupCourseParameters {
  course_id: number;
  filename?: string;
  include_users?: boolean;
  include_activities?: boolean;
  include_blocks?: boolean;
  include_filters?: boolean;
  include_comments?: boolean;
  include_logs?: boolean;
  include_grade_histories?: boolean;
}

export interface RestoreCourseBackupParameters {
  backup_file_id: number;
  target?: "new_course" | "existing_add" | "existing_delete";
  target_course_id?: number;
  category_id?: number;
  fullname?: string;
  shortname?: string;
}

export interface UploadCourseBackupParameters {
  filename: string;
  upload_reference?: string;
  draft_item_id?: number;
}

export interface GetCourseBackupFilesParameters {
  course_id?: number;
  include_private?: boolean;
}

export interface DeleteCourseBackupFileParameters {
  file_id: number;
}

export interface AuditCourseCompletionParameters {
  course_id: number;
  include_ok?: boolean;
}

export interface RepairCourseCompletionParameters {
  course_id: number;
  mode?: "book_view_only" | "all_grade_to_view" | "disable_all";
  dry_run?: boolean;
  reset_completion_states?: boolean;
}

export interface UpdateCourseParameters {
  course_id: number;
  fullname?: string;
  shortname?: string;
  visible?: boolean;
  summary?: string;
  summary_format?: "html" | "plain";
  course_format?: string;
  category_id?: number;
  start_date?: number;
  end_date?: number;
  enable_completion?: boolean;
}

export interface MoveCourseParameters {
  course_id: number;
  category_id: number;
}

export interface DeleteCourseParameters {
  course_id: number;
}

export interface CreateSectionParameters {
  course_id: number;
  name: string;
  summary?: string;
  summary_format?: "html" | "plain";
  position?: number;
  visible?: boolean;
}

export interface UpdateSectionParameters {
  course_id: number;
  section_id?: number;
  section_number?: number;
  name?: string;
  summary?: string;
  summary_format?: "html" | "plain";
  visible?: boolean;
  filename?: string;
  upload_reference?: string;
  draft_item_id?: number;
}

export interface DeleteSectionParameters {
  course_id: number;
  section_id?: number;
  section_number?: number;
  delete_mode?: "delete" | "clear";
}

export interface CreateModuleParameters {
  course_id: number;
  section_number: number;
  module_type: "assign" | "book" | "choice" | "data" | "feedback" | "lesson" | "lti" | "page" | "folder" | "forum" | "glossary" | "label" | "qbank" | "quiz" | "resource" | "subsection" | "url" | "wiki" | "workshop";
  name: string;
  options?: JsonObject | string;
}

export interface UpdateModuleParameters {
  course_id: number;
  module_id: number;
  name?: string;
  visible?: boolean;
  options?: JsonObject | string;
}

export interface DuplicateModuleParameters {
  course_id: number;
  module_id: number;
  section_number?: number;
  name?: string;
}

export interface MoveModuleParameters {
  course_id: number;
  module_id: number;
  section_number: number;
  before_module_id?: number;
}

export interface GetCourseBooksParameters {
  course_id: number;
}

export interface GetBookChaptersParameters {
  course_id: number;
  module_id: number;
  include_content?: boolean;
  include_hidden?: boolean;
}

export interface ViewBookParameters {
  course_id: number;
  module_id: number;
  chapter_id?: number;
}

export interface CreateBookChapterParameters {
  course_id: number;
  module_id: number;
  title: string;
  content: string;
  content_format?: number;
  subchapter?: boolean;
  after_chapter_id?: number;
  hidden?: boolean;
  filename?: string;
  upload_reference?: string;
  draft_item_id?: number;
}

export interface UpdateBookChapterParameters {
  course_id: number;
  module_id: number;
  chapter_id: number;
  title?: string;
  content?: string;
  content_format?: number;
  subchapter?: boolean;
  hidden?: boolean;
  filename?: string;
  upload_reference?: string;
  draft_item_id?: number;
}

export interface MoveBookChapterParameters {
  course_id: number;
  module_id: number;
  chapter_id: number;
  after_chapter_id?: number;
}

export interface DeleteBookChapterParameters {
  course_id: number;
  module_id: number;
  chapter_id: number;
}

export interface GetLessonAccessInformationParameters {
  course_id: number;
  module_id: number;
}

export interface GetLessonDetailsParameters {
  course_id: number;
  module_id: number;
  password?: string;
}

export interface GetCourseLessonsParameters {
  course_id: number;
}

export interface GetLessonPagesParameters {
  course_id: number;
  module_id: number;
  password?: string;
}

export interface CreateLessonPageParameters {
  course_id: number;
  module_id: number;
  title: string;
  content: string;
  content_format?: number;
  branches?: JsonObject | string;
  after_page_id?: number;
  display_in_menu?: boolean;
  horizontal?: boolean;
  page_type?: "content" | "essay" | "matching" | "multichoice" | "numerical" | "shortanswer" | "truefalse";
  answers?: JsonObject | string;
}

export interface UpdateLessonPageParameters {
  course_id: number;
  module_id: number;
  page_id: number;
  title?: string;
  content?: string;
  content_format?: number;
  branches?: JsonObject | string;
  display_in_menu?: boolean;
  horizontal?: boolean;
  answers?: JsonObject | string;
}

export interface DeleteLessonPageParameters {
  course_id: number;
  module_id: number;
  page_id: number;
}

export interface ViewLessonParameters {
  course_id: number;
  module_id: number;
  password?: string;
}

export interface GetLessonUserGradeParameters {
  course_id: number;
  module_id: number;
  user_id?: number;
}

export interface GetLessonUserTimersParameters {
  course_id: number;
  module_id: number;
  user_id?: number;
}

export interface GetLessonPossibleJumpsParameters {
  course_id: number;
  module_id: number;
}

export interface GetLessonAttemptsOverviewParameters {
  course_id: number;
  module_id: number;
  group_id?: number;
}

export interface GetDataFieldsParameters {
  course_id: number;
  module_id: number;
}

export interface CreateDataFieldParameters {
  course_id: number;
  module_id: number;
  field_type: "text" | "textarea" | "number" | "menu" | "checkbox" | "radiobutton" | "multimenu" | "url";
  name: string;
  description?: string;
  required?: boolean;
  options?: JsonObject | string;
}

export interface UpdateDataFieldParameters {
  course_id: number;
  module_id: number;
  field_id: number;
  name: string;
  description?: string;
  required?: boolean;
  options?: JsonObject | string;
}

export interface DeleteDataFieldParameters {
  course_id: number;
  module_id: number;
  field_id: number;
}

export interface GetDataEntriesParameters {
  course_id: number;
  module_id: number;
  search?: string;
  include_contents?: boolean;
  page?: number;
  per_page?: number;
}

export interface CreateDataEntryParameters {
  course_id: number;
  module_id: number;
  values: JsonObject | string;
  group_id?: number;
}

export interface UpdateDataEntryParameters {
  course_id: number;
  module_id: number;
  entry_id: number;
  values: JsonObject | string;
}

export interface DeleteDataEntryParameters {
  course_id: number;
  module_id: number;
  entry_id: number;
}

export interface SetWorkshopPhaseParameters {
  course_id: number;
  module_id: number;
  phase: "setup" | "submission" | "assessment" | "evaluation" | "closed";
}

export interface GetWorkshopSubmissionsParameters {
  course_id: number;
  module_id: number;
  user_id?: number;
  group_id?: number;
  page?: number;
  per_page?: number;
}

export interface GetWorkshopUserPlanParameters {
  course_id: number;
  module_id: number;
  user_id?: number;
}

export interface GetWorkshopGradesParameters {
  course_id: number;
  module_id: number;
  user_id?: number;
}

export interface GetWorkshopGradesReportParameters {
  course_id: number;
  module_id: number;
  group_id?: number;
  sort_by?: "lastname" | "firstname" | "submissiontitle" | "submissionmodified" | "submissiongrade" | "gradinggrade";
  sort_direction?: "ASC" | "DESC";
  page?: number;
  per_page?: number;
}

export interface GetWorkshopReviewerAssessmentsParameters {
  course_id: number;
  module_id: number;
  user_id?: number;
}

export interface GetWorkshopSubmissionAssessmentsParameters {
  course_id: number;
  module_id: number;
  submission_id: number;
}

export interface AllocateWorkshopSubmissionParameters {
  course_id: number;
  module_id: number;
  submission_id: number;
  reviewer_id?: number;
  weight?: number;
}

export interface GetWorkshopAssessmentFormDefinitionParameters {
  course_id: number;
  module_id: number;
  assessment_id: number;
  mode?: "assessment" | "preview";
}

export interface GetWorkshopGradingFormParameters {
  course_id: number;
  module_id: number;
}

export interface SetWorkshopGradingFormParameters {
  course_id: number;
  module_id: number;
  strategy: "accumulative" | "comments" | "numerrors" | "rubric";
  definition: JsonObject | string;
}

export interface UpdateWorkshopAssessmentParameters {
  course_id: number;
  module_id: number;
  assessment_id: number;
  data_json: string;
}

export interface EvaluateWorkshopAssessmentParameters {
  course_id: number;
  module_id: number;
  assessment_id: number;
  feedback_text?: string;
  feedback_format?: "html" | "plain";
  weight?: number;
  grading_grade_over?: string;
}

export interface CreateWorkshopSubmissionParameters {
  course_id: number;
  module_id: number;
  title: string;
  content?: string;
  content_format?: "html" | "plain";
}

export interface UpdateWorkshopSubmissionParameters {
  course_id: number;
  module_id: number;
  submission_id: number;
  title: string;
  content?: string;
  content_format?: "html" | "plain";
}

export interface DeleteWorkshopSubmissionParameters {
  course_id: number;
  module_id: number;
  submission_id: number;
}

export interface CreateGlossaryEntryParameters {
  course_id: number;
  module_id: number;
  concept: string;
  definition: string;
  definition_format?: "html" | "plain";
  options?: JsonObject | string;
}

export interface GetCourseGlossariesParameters {
  course_id: number;
}

export interface ViewGlossaryParameters {
  course_id: number;
  module_id: number;
  mode?: string;
}

export interface ViewGlossaryEntryParameters {
  course_id: number;
  module_id: number;
  entry_id: number;
}

export interface GetGlossaryEntryParameters {
  course_id: number;
  module_id: number;
  entry_id: number;
}

export interface GetGlossaryEntriesByLetterParameters {
  course_id: number;
  module_id: number;
  letter?: string;
  from?: number;
  limit?: number;
  include_not_approved?: boolean;
}

export interface GetGlossaryEntriesByCategoryParameters {
  course_id: number;
  module_id: number;
  category_id?: number;
  from?: number;
  limit?: number;
  include_not_approved?: boolean;
}

export interface GetGlossaryEntriesByAuthorParameters {
  course_id: number;
  module_id: number;
  letter?: string;
  field?: "FIRSTNAME" | "LASTNAME";
  sort?: "ASC" | "DESC";
  from?: number;
  limit?: number;
  include_not_approved?: boolean;
}

export interface GetGlossaryEntriesByAuthorIdParameters {
  course_id: number;
  module_id: number;
  author_id: number;
  order?: "CONCEPT" | "CREATION" | "UPDATE";
  sort?: "ASC" | "DESC";
  from?: number;
  limit?: number;
  include_not_approved?: boolean;
}

export interface GetGlossaryEntriesByDateParameters {
  course_id: number;
  module_id: number;
  order?: "CREATION" | "UPDATE";
  sort?: "ASC" | "DESC";
  from?: number;
  limit?: number;
  include_not_approved?: boolean;
}

export interface GetGlossaryEntriesByTermParameters {
  course_id: number;
  module_id: number;
  term: string;
  from?: number;
  limit?: number;
  include_not_approved?: boolean;
}

export interface GetGlossaryCategoriesParameters {
  course_id: number;
  module_id: number;
  from?: number;
  limit?: number;
}

export interface GetGlossaryAuthorsParameters {
  course_id: number;
  module_id: number;
  from?: number;
  limit?: number;
  include_not_approved?: boolean;
}

export interface SearchGlossaryEntriesParameters {
  course_id: number;
  module_id: number;
  query: string;
  full_search?: boolean;
  order?: "CONCEPT" | "CREATION" | "UPDATE";
  sort?: "ASC" | "DESC";
  from?: number;
  limit?: number;
  include_not_approved?: boolean;
}

export interface GetGlossaryEntriesToApproveParameters {
  course_id: number;
  module_id: number;
  letter?: string;
  order?: "CONCEPT" | "CREATION" | "UPDATE";
  sort?: "ASC" | "DESC";
  from?: number;
  limit?: number;
}

export interface UpdateGlossaryEntryParameters {
  course_id: number;
  module_id: number;
  entry_id: number;
  concept?: string;
  definition?: string;
  definition_format?: "html" | "plain";
  options?: JsonObject | string;
}

export interface DeleteGlossaryEntryParameters {
  course_id: number;
  module_id: number;
  entry_id: number;
}

export interface CreateWikiPageParameters {
  course_id: number;
  module_id: number;
  title: string;
  content: string;
  content_format?: "html" | "creole" | "nwiki";
  group_id?: number;
  user_id?: number;
}

export interface GetWikiPagesParameters {
  course_id: number;
  module_id: number;
  group_id?: number;
  user_id?: number;
  sort_by?: string;
  sort_direction?: "ASC" | "DESC";
  include_content?: boolean;
}

export interface GetWikiSubwikisParameters {
  course_id: number;
  module_id: number;
}

export interface GetWikiFilesParameters {
  course_id: number;
  module_id: number;
  group_id?: number;
  user_id?: number;
}

export interface ViewWikiParameters {
  course_id: number;
  module_id: number;
}

export interface ViewWikiPageParameters {
  course_id: number;
  module_id: number;
  page_id: number;
}

export interface UpdateWikiPageParameters {
  course_id: number;
  module_id: number;
  page_id: number;
  content: string;
  section?: string;
}

export interface DeleteWikiPageParameters {
  course_id: number;
  module_id: number;
  page_id: number;
}

export interface GetChoiceOptionsParameters {
  course_id: number;
  choice_module_id: number;
}

export interface GetCourseChoicesParameters {
  course_id: number;
}

export interface ViewChoiceParameters {
  course_id: number;
  choice_module_id: number;
}

export interface SubmitChoiceResponseParameters {
  course_id: number;
  choice_module_id: number;
  option_ids: string;
}

export interface DeleteChoiceResponsesParameters {
  course_id: number;
  choice_module_id: number;
  response_ids?: string;
}

export interface GetCourseFeedbacksParameters {
  course_id: number;
}

export interface ViewFeedbackParameters {
  course_id: number;
  module_id: number;
  module_viewed?: boolean;
}

export interface GetFeedbackAccessInformationParameters {
  course_id: number;
  module_id: number;
}

export interface CreateFeedbackItemParameters {
  course_id: number;
  module_id: number;
  type: "textfield" | "textarea" | "numeric" | "multichoice" | "multichoicerated" | "label" | "info" | "captcha" | "pagebreak";
  name?: string;
  definition: JsonObject | string;
  position?: number;
  label?: string;
  required?: boolean;
  depend_item_id?: number;
  depend_value?: string;
}

export interface UpdateFeedbackItemParameters {
  course_id: number;
  module_id: number;
  item_id: number;
  name?: string;
  definition?: JsonObject | string;
  position?: number;
  label?: string;
  required?: boolean;
  depend_item_id?: number;
  depend_value?: string;
}

export interface GetFeedbackItemsParameters {
  course_id: number;
  module_id: number;
}

export interface GetFeedbackPageItemsParameters {
  course_id: number;
  module_id: number;
  page?: number;
}

export interface GetFeedbackAnalysisParameters {
  course_id: number;
  module_id: number;
  group_id?: number;
}

export interface GetFeedbackFinishedResponsesParameters {
  course_id: number;
  module_id: number;
}

export interface DeleteFeedbackItemParameters {
  course_id: number;
  module_id: number;
  item_id: number;
}

export interface GetChoiceResultsParameters {
  course_id: number;
  choice_module_id: number;
}

export interface GetCourseForumsParameters {
  course_id: number;
}

export interface ViewForumParameters {
  course_id: number;
  module_id: number;
}

export interface GetForumDiscussionsParameters {
  course_id: number;
  module_id: number;
}

export interface CreateForumDiscussionParameters {
  course_id: number;
  module_id: number;
  name: string;
  message: string;
}

export interface GetForumDiscussionPostsParameters {
  course_id: number;
  module_id: number;
  discussion_id: number;
}

export interface CreateForumDiscussionPostParameters {
  course_id: number;
  module_id: number;
  discussion_id: number;
  parent_post_id?: number;
  subject: string;
  message: string;
}

export interface UpdateForumDiscussionPostParameters {
  course_id: number;
  module_id: number;
  discussion_id: number;
  post_id: number;
  subject?: string;
  message?: string;
}

export interface SetForumDiscussionPinParameters {
  course_id: number;
  module_id: number;
  discussion_id: number;
  pinned: boolean;
}

export interface SetForumDiscussionFavouriteParameters {
  course_id: number;
  module_id: number;
  discussion_id: number;
  favourite: boolean;
}

export interface SetForumDiscussionSubscriptionParameters {
  course_id: number;
  module_id: number;
  discussion_id: number;
  subscribed: boolean;
}

export interface SetForumDiscussionLockParameters {
  course_id: number;
  module_id: number;
  discussion_id: number;
  locked: boolean;
}

export interface DeleteForumDiscussionPostParameters {
  course_id: number;
  module_id: number;
  discussion_id: number;
  post_id: number;
}

export interface GetCourseAssignmentsParameters {
  course_id: number;
}

export interface UpdateAssignmentParameters {
  course_id: number;
  module_id: number;
  name?: string;
  intro?: string;
  intro_format?: "html" | "plain";
  activity?: string;
  activity_format?: "html" | "plain";
  filename?: string;
  upload_reference?: string;
  draft_item_id?: number;
  file_area?: "intro" | "activity";
}

export interface GetAssignmentSubmissionStatusParameters {
  course_id: number;
  module_id: number;
  user_id?: number;
}

export interface SaveAssignmentSubmissionParameters {
  course_id: number;
  module_id: number;
  online_text: string;
}

export interface SubmitAssignmentForGradingParameters {
  course_id: number;
  module_id: number;
  accept_submission_statement?: boolean;
}

export interface SaveAssignmentGradeParameters {
  course_id: number;
  module_id: number;
  user_id: number;
  grade: number;
  feedback_comment?: string;
  attempt_number?: number;
}

export interface GetAssignmentGradingFormParameters {
  course_id: number;
  module_id: number;
}

export interface SetAssignmentRubricParameters {
  course_id: number;
  module_id: number;
  name: string;
  description?: string;
  criteria: JsonObject | string;
  options?: JsonObject | string;
}

export interface SetAssignmentChecklistParameters {
  course_id: number;
  module_id: number;
  name: string;
  description?: string;
  items: JsonObject | string;
}

export interface SetAssignmentMarkingGuideParameters {
  course_id: number;
  module_id: number;
  name: string;
  description?: string;
  criteria: JsonObject | string;
  comments?: JsonObject | string;
  options?: JsonObject | string;
}

export interface GradeAssignmentWithRubricParameters {
  course_id: number;
  module_id: number;
  user_id: number;
  criteria: JsonObject | string;
  feedback_comment?: string;
  attempt_number?: number;
}

export interface GradeAssignmentWithChecklistParameters {
  course_id: number;
  module_id: number;
  user_id: number;
  items: JsonObject | string;
  feedback_comment?: string;
  attempt_number?: number;
}

export interface GradeAssignmentWithMarkingGuideParameters {
  course_id: number;
  module_id: number;
  user_id: number;
  criteria: JsonObject | string;
  feedback_comment?: string;
  attempt_number?: number;
}

export interface GetAssignmentSubmissionsParameters {
  course_id: number;
  module_id: number;
  status?: "new" | "draft" | "submitted" | "reopened";
  since?: number;
  before?: number;
}

export interface GetAssignmentGradesParameters {
  course_id: number;
  module_id: number;
  since?: number;
}

export interface ViewAssignmentParameters {
  course_id: number;
  module_id: number;
}

export interface ViewAssignmentSubmissionStatusParameters {
  course_id: number;
  module_id: number;
}

export interface ViewAssignmentGradingTableParameters {
  course_id: number;
  module_id: number;
}

export interface DeleteModuleParameters {
  course_id: number;
  module_id: number;
}

export interface UploadFolderFileParameters {
  course_id: number;
  module_id: number;
  filename: string;
  upload_reference?: string;
  draft_item_id?: number;
}

export interface GetFolderFilesParameters {
  course_id: number;
  module_id: number;
}

export interface DownloadFolderFileParameters {
  course_id: number;
  module_id: number;
  file_id?: number;
  path?: string;
}

export interface UpdatePageParameters {
  course_id: number;
  module_id: number;
  name?: string;
  content?: string;
  content_format?: "html" | "plain";
  print_intro?: boolean;
  print_last_modified?: boolean;
  filename?: string;
  upload_reference?: string;
  draft_item_id?: number;
}

export interface UpdateLabelParameters {
  course_id: number;
  module_id: number;
  content?: string;
  content_format?: "html" | "plain";
  filename?: string;
  upload_reference?: string;
  draft_item_id?: number;
}

export interface UpdateUrlParameters {
  course_id: number;
  module_id: number;
  name?: string;
  external_url?: string;
  intro?: string;
  intro_format?: "html" | "plain";
  display?: number;
  print_intro?: boolean;
  popup_width?: number;
  popup_height?: number;
  filename?: string;
  upload_reference?: string;
  draft_item_id?: number;
}

export interface UpdateResourceParameters {
  course_id: number;
  module_id: number;
  filename: string;
  upload_reference?: string;
  draft_item_id?: number;
  name?: string;
  intro?: string;
  intro_format?: "html" | "plain";
}

export interface GetResourceFilesParameters {
  course_id: number;
  module_id: number;
}

export interface DownloadResourceFileParameters {
  course_id: number;
  module_id: number;
  file_id?: number;
  path?: string;
}

export interface DeleteFolderFileParameters {
  course_id: number;
  module_id: number;
  file_id?: number;
  path?: string;
}

export interface GetQuestionBanksParameters {
  course_id: number;
  include_quiz_private?: boolean;
}

export interface GetQuestionCategoriesParameters {
  course_id: number;
  bank_scope?: "course_shared" | "quiz_private";
  question_bank_module_id?: number;
  quiz_module_id?: number;
  include_top?: boolean;
}

export interface ExportQuestionBankBlueprintParameters {
  course_id: number;
  bank_scope?: "course_shared" | "quiz_private";
  question_bank_module_id?: number;
  quiz_module_id?: number;
  category_id?: number;
  include_unsupported?: boolean;
}

export interface ImportQuestionBankBlueprintParameters {
  course_id: number;
  blueprint_json: string;
  bank_scope?: "course_shared" | "quiz_private";
  question_bank_module_id?: number;
  quiz_module_id?: number;
  category_id?: number;
  create_categories?: boolean;
}

export interface CreateQuestionCategoryParameters {
  course_id: number;
  name: string;
  parent_id?: number;
  description?: string;
  bank_scope?: "course_shared" | "quiz_private";
  question_bank_module_id?: number;
  quiz_module_id?: number;
}

export interface UpdateQuestionCategoryParameters {
  category_id: number;
  context_id: number;
  name?: string;
  description?: string;
}

export interface DeleteQuestionCategoryParameters {
  category_id: number;
  context_id: number;
  delete_mode?: "delete" | "merge";
}

export interface CreateQuestionParameters {
  category_id: number;
  context_id: number;
  question_type: "truefalse" | "shortanswer" | "multichoice" | "numerical" | "essay" | "matching" | "description" | "randomsamatch" | "gapselect" | "ddwtos" | "ordering" | "multianswer" | "ddmarker" | "ddimageortext" | "calculatedsimple" | "calculated" | "calculatedmulti";
  name: string;
  question_text: string;
  options: JsonObject | string;
}

export interface GetQuestionsParameters {
  course_id: number;
  category_id: number;
  bank_scope?: "course_shared" | "quiz_private";
  question_bank_module_id?: number;
  quiz_module_id?: number;
}

export interface UpdateQuestionParameters {
  question_id: number;
  name?: string;
  question_text?: string;
  options?: JsonObject | string;
}

export interface MoveQuestionParameters {
  course_id: number;
  question_id: number;
  target_category_id: number;
  target_bank_scope?: "course_shared" | "quiz_private";
  target_question_bank_module_id?: number;
  target_quiz_module_id?: number;
}

export interface DeleteQuestionParameters {
  question_id: number;
}

export interface GetQuizQuestionsParameters {
  quiz_module_id: number;
}

export interface GetCourseQuizzesParameters {
  course_id?: number;
  course_ids?: string;
}

export interface StartQuizAttemptParameters {
  quiz_module_id: number;
  force_new?: boolean;
}

export interface GetQuizAttemptsParameters {
  quiz_module_id: number;
  user_id?: number;
  status?: "all" | "finished" | "unfinished";
  include_previews?: boolean;
}

export interface GetQuizResultsReportParameters {
  quiz_module_id: number;
  limit?: number;
  include_previews?: boolean;
}

export interface GetQuizAttemptAccessInformationParameters {
  quiz_module_id: number;
  attempt_id?: number;
}

export interface GetQuizAttemptDataParameters {
  quiz_module_id: number;
  attempt_id: number;
  page?: number;
  preflight_data?: string;
}

export interface GetQuizAttemptSummaryParameters {
  quiz_module_id: number;
  attempt_id: number;
  preflight_data?: string;
}

export interface SaveQuizAttemptParameters {
  quiz_module_id: number;
  attempt_id: number;
  data?: string;
  preflight_data?: string;
}

export interface ProcessQuizAttemptParameters {
  quiz_module_id: number;
  attempt_id: number;
  data?: string;
  finish_attempt?: boolean;
  time_up?: boolean;
  preflight_data?: string;
}

export interface GetQuizAttemptReviewParameters {
  quiz_module_id: number;
  attempt_id: number;
  page?: number;
}

export interface GetQuizAccessInformationParameters {
  quiz_module_id: number;
}

export interface GetQuizCombinedReviewOptionsParameters {
  quiz_module_id: number;
  user_id?: number;
}

export interface ViewQuizParameters {
  quiz_module_id: number;
}

export interface ViewQuizAttemptParameters {
  quiz_module_id: number;
  attempt_id: number;
  page?: number;
  preflight_data?: string;
}

export interface ViewQuizAttemptSummaryParameters {
  quiz_module_id: number;
  attempt_id: number;
  preflight_data?: string;
}

export interface ViewQuizAttemptReviewParameters {
  quiz_module_id: number;
  attempt_id: number;
}

export interface GetQuizUserBestGradeParameters {
  quiz_module_id: number;
  user_id?: number;
}

export interface GetQuizFeedbackForGradeParameters {
  quiz_module_id: number;
  grade: number;
}

export interface GetQuizRequiredQuestionTypesParameters {
  quiz_module_id: number;
}

export interface AddQuestionToQuizParameters {
  quiz_module_id: number;
  question_id: number;
  slot?: number;
}

export interface AddRandomQuestionsToQuizParameters {
  quiz_module_id: number;
  category_id: number;
  number: number;
  slot?: number;
  include_subcategories?: boolean;
  bank_scope?: "course_shared" | "quiz_private";
  question_bank_module_id?: number;
}

export interface RemoveQuestionFromQuizParameters {
  quiz_module_id: number;
  slot?: number;
  question_id?: number;
}

export interface UpdateQuizQuestionSlotParameters {
  quiz_module_id: number;
  slot: number;
  max_mark: number;
}

export interface GetCurrentUserResponse {
  id: number;
  username: string;
  fullname: string;
  site_url: string;
}

export interface GetMoodliaStatusResponse {
  component: string;
  site_url: string;
  site_name: string;
  moodle_release: string;
  moodle_version: string;
  plugin_release: string;
  plugin_version: number;
  user_id: number;
  username: string;
  can_use_api: boolean;
  rest_service: string;
  function_count: number;
  functions_json: string;
}

export interface GetSyncCapabilitiesResponse {
  course_id: number;
  category_id: number;
  context_evaluated: boolean;
  capabilities_json: string;
}

export interface ListPluginsResponse {
  total: number;
  plugins: {
    component: string;
    plugin_type: string;
    name: string;
    display_name: string;
    source: string;
    status: string;
    version_disk: string;
    version_db: string;
    release: string;
    enabled_known: boolean;
    enabled: boolean;
    can_change_enabled: boolean;
    update_count: number;
  }[];
}

export interface GetPluginDetailsResponse {
  component: string;
  plugin_type: string;
  name: string;
  display_name: string;
  source: string;
  status: string;
  version_disk: string;
  version_db: string;
  release: string;
  enabled_known: boolean;
  enabled: boolean;
  can_change_enabled: boolean;
  dependency_count: number;
  required_by_count: number;
  update_count: number;
}

export interface GetPluginDependenciesResponse {
  component: string;
  satisfied: boolean;
  dependencies: {
    component: string;
    installed_version: string;
    required_version: string;
    status: string;
    availability: string;
  }[];
  required_by: string[];
}

export interface CheckPluginUpdatesResponse {
  refreshed: boolean;
  last_checked: number;
  total: number;
  updates: {
    component: string;
    current_version: string;
    available_version: string;
    release: string;
    maturity: number;
    information_url: string;
    download_url: string;
  }[];
}

export interface SetPluginEnabledResponse {
  component: string;
  previous_enabled: boolean;
  enabled: boolean;
  changed: boolean;
}

export interface GetCoursesResponse {
  courses: unknown[];
}

export interface GetCourseCategoriesResponse {
  categories: {
    category_id: number;
    name: string;
    parent_id: number;
    visible: boolean;
    course_count: number;
    url: string;
  }[];
}

export interface CreateCourseCategoryResponse {
  category_id: number;
  name: string;
  parent_id: number;
  visible: boolean;
  course_count: number;
  url: string;
  created: boolean;
}

export interface UpdateCourseCategoryResponse {
  category_id: number;
  name: string;
  parent_id: number;
  visible: boolean;
  course_count: number;
  url: string;
}

export interface DeleteCourseCategoryResponse {
  deleted: boolean;
  id: number;
}

export interface GetCourseContentsResponse {
  course_id: number;
  sections: {
    section_id: number;
    course_id: number;
    section_number: number;
    name: string;
    summary: string;
    summary_raw: string;
    summary_format: string;
    summary_files: {
      file_id: number;
      filename: string;
      url: string;
      filepath: string;
      filesize: number;
      mimetype: string;
      content_hash: string;
      time_modified: number;
    }[];
    visible: boolean;
    modules: {
      module_id: number;
      course_module_id: number;
      instance_id: number;
      name: string;
      module_type: string;
      visible: boolean;
      visible_on_course_page: boolean;
      user_visible: boolean;
      url: string;
      completion: number;
      completion_view: number;
      completion_grade_item_number: number;
      completion_expected: number;
    }[];
  }[];
}

export interface GetCourseDetailsResponse {
  course_id: number;
  shortname: string;
  fullname: string;
  category_id: number;
  visible: boolean;
  summary: string;
  summary_format: string;
  format: string;
  enable_completion: boolean;
  start_date: number;
  end_date: number;
  url: string;
}

export interface GetModuleDetailsResponse {
  module_id: number;
  course_module_id: number;
  instance_id: number;
  name: string;
  module_type: string;
  visible: boolean;
  visible_on_course_page: boolean;
  user_visible: boolean;
  id_number: string;
  language: string;
  group_mode: number;
  grouping_id: number;
  availability: string;
  download_content: boolean;
  url: string;
  course_id: number;
  context_id: number;
  section_id: number;
  section_number: number;
  section_name: string;
  description: string;
  show_description: boolean;
  completion: number;
  completion_view: number;
  completion_grade_item_number: number;
  completion_expected: number;
  added: number;
  deletion_in_progress: boolean;
  extra_json: unknown;
}

export interface GetCalendarEventsResponse {
  course_id: number;
  events: {
    event_id: number;
    course_id: number;
    name: string;
    description: string;
    event_type: string;
    timestart: number;
    timeduration: number;
    url: string;
  }[];
}

export interface CreateCalendarEventResponse {
  event_id: number;
  course_id: number;
  name: string;
  description: string;
  event_type: string;
  timestart: number;
  timeduration: number;
  url: string;
}

export interface UpdateCalendarEventResponse {
  event_id: number;
  course_id: number;
  name: string;
  description: string;
  event_type: string;
  timestart: number;
  timeduration: number;
  url: string;
}

export interface DeleteCalendarEventResponse {
  deleted: boolean;
  id: number;
}

export interface GetEnrolledUsersResponse {
  course_id: number;
  users: {
    user_id: number;
    username: string;
    fullname: string;
    email: string;
    roles: string[];
  }[];
}

export interface GetGradeItemsResponse {
  course_id: number;
  items: {
    item_id: number;
    course_id: number;
    category_id: number;
    name: string;
    item_type: string;
    item_module: string;
    item_instance: number;
    item_number: number;
    course_module_id: number;
    grade_min: number;
    grade_max: number;
    grade_pass: number;
    weight: number;
    weight_overridden: boolean;
    hidden: boolean;
    locked: boolean;
    contributes_to_course_total: boolean;
    time_modified: number;
  }[];
}

export interface SetCourseGradePassResponse {
  item_id: number;
  course_id: number;
  category_id: number;
  name: string;
  item_type: string;
  item_module: string;
  item_instance: number;
  item_number: number;
  course_module_id: number;
  grade_min: number;
  grade_max: number;
  grade_pass: number;
  weight: number;
  weight_overridden: boolean;
  hidden: boolean;
  locked: boolean;
  contributes_to_course_total: boolean;
  time_modified: number;
}

export interface GetUserGradesResponse {
  course_id: number;
  user_id: number;
  user_fullname: string;
  items: {
    item_id: number;
    name: string;
    item_type: string;
    item_module: string;
    item_instance: number;
    course_module_id: number;
    grade_raw: number;
    grade_formatted: string;
    grade_min: number;
    grade_max: number;
    range_formatted: string;
    percentage_formatted: string;
    feedback: string;
    hidden: boolean;
    locked: boolean;
  }[];
}

export interface GetCourseCompletionCriteriaResponse {
  course_id: number;
  course_completion_enabled: boolean;
  criteria_locked: boolean;
  criteria_aggregation: string;
  activity_aggregation: string;
  required_module_ids: number[];
  criteria_count: number;
  grade_criterion_enabled: boolean;
  required_course_grade: number;
  required_course_grade_percent: number;
  course_grade_pass: number;
  course_grade_pass_percent: number;
  course_grade_min: number;
  course_grade_max: number;
}

export interface SetCourseCompletionCriteriaResponse {
  course_id: number;
  course_completion_enabled: boolean;
  criteria_locked: boolean;
  criteria_aggregation: string;
  activity_aggregation: string;
  required_module_ids: number[];
  criteria_count: number;
  grade_criterion_enabled: boolean;
  required_course_grade: number;
  required_course_grade_percent: number;
  course_grade_pass: number;
  course_grade_pass_percent: number;
  course_grade_min: number;
  course_grade_max: number;
}

export interface GetCourseCompletionStatusResponse {
  course_id: number;
  user_id: number;
  completed: boolean;
  aggregation: number;
  criteria_count: number;
  completed_criteria_count: number;
  status_json: unknown;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetActivityCompletionStatusesResponse {
  course_id: number;
  user_id: number;
  statuses: {
    module_id: number;
    module_type: string;
    instance_id: number;
    state: number;
    time_completed: number;
    tracking: number;
    override_by: number;
    value_used: boolean;
    has_completion: boolean;
    is_automatic: boolean;
    is_tracked_user: boolean;
    user_visible: boolean;
    details_json: unknown;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetGradeCategoriesResponse {
  course_id: number;
  categories: {
    category_id: number;
    course_id: number;
    name: string;
    aggregation: number;
    exclude_empty_grades: boolean;
    keep_highest: number;
    drop_lowest: number;
    total_item_id: number;
    grade_min: number;
    grade_max: number;
    grade_pass: number;
    hidden: boolean;
    locked: boolean;
    time_modified: number;
  }[];
}

export interface CreateGradeCategoryResponse {
  category_id: number;
  course_id: number;
  name: string;
  aggregation: number;
  exclude_empty_grades: boolean;
  keep_highest: number;
  drop_lowest: number;
  total_item_id: number;
  grade_min: number;
  grade_max: number;
  grade_pass: number;
  hidden: boolean;
  locked: boolean;
  time_modified: number;
}

export interface UpdateGradeCategoryResponse {
  category_id: number;
  course_id: number;
  name: string;
  aggregation: number;
  exclude_empty_grades: boolean;
  keep_highest: number;
  drop_lowest: number;
  total_item_id: number;
  grade_min: number;
  grade_max: number;
  grade_pass: number;
  hidden: boolean;
  locked: boolean;
  time_modified: number;
}

export interface DeleteGradeCategoryResponse {
  course_id: number;
  category_id: number;
  deleted: boolean;
}

export interface CreateGradeItemResponse {
  item_id: number;
  course_id: number;
  category_id: number;
  name: string;
  item_type: string;
  item_module: string;
  item_instance: number;
  item_number: number;
  course_module_id: number;
  grade_min: number;
  grade_max: number;
  grade_pass: number;
  weight: number;
  weight_overridden: boolean;
  hidden: boolean;
  locked: boolean;
  contributes_to_course_total: boolean;
  time_modified: number;
}

export interface UpdateGradeItemResponse {
  item_id: number;
  course_id: number;
  category_id: number;
  name: string;
  item_type: string;
  item_module: string;
  item_instance: number;
  item_number: number;
  course_module_id: number;
  grade_min: number;
  grade_max: number;
  grade_pass: number;
  weight: number;
  weight_overridden: boolean;
  hidden: boolean;
  locked: boolean;
  contributes_to_course_total: boolean;
  time_modified: number;
}

export interface DeleteGradeItemResponse {
  course_id: number;
  item_id: number;
  deleted: boolean;
}

export interface UpdateGradeValueResponse {
  course_id: number;
  item_id: number;
  user_id: number;
  grade: number;
  updated: boolean;
}

export interface GetCourseProgressReportResponse {
  course_id: number;
  requested_limit: number;
  returned_user_count: number;
  total_enrolled_user_count: number;
  grade_item_count: number;
  tracked_activity_count: number;
  completed_user_count: number;
  average_grade_percentage: number;
  users: {
    user_id: number;
    username: string;
    fullname: string;
    roles: string[];
    course_completed: boolean;
    course_criteria_count: number;
    completed_course_criteria_count: number;
    tracked_activity_count: number;
    completed_activity_count: number;
    grade_item_count: number;
    graded_item_count: number;
    grade_points: number;
    grade_max: number;
    grade_percentage: number;
    grade_percentage_formatted: string;
    warnings_count: number;
  }[];
  warnings: {
    user_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface SetActivityCompletionStatusResponse {
  course_id: number;
  module_id: number;
  completed: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetUserDetailsResponse {
  user_id: number;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  auth: string;
  suspended: boolean;
  deleted: boolean;
  confirmed: boolean;
  time_modified: number;
}

export interface CreateUserResponse {
  user_id: number;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  auth: string;
  suspended: boolean;
  deleted: boolean;
  confirmed: boolean;
  time_modified: number;
}

export interface UpdateUserResponse {
  user_id: number;
  username: string;
  firstname: string;
  lastname: string;
  fullname: string;
  email: string;
  auth: string;
  suspended: boolean;
  deleted: boolean;
  confirmed: boolean;
  time_modified: number;
}

export interface DeleteUserResponse {
  deleted: boolean;
  id: number;
}

export interface CreateCohortResponse {
  cohort_id: number;
  context_id: number;
  name: string;
  idnumber: string;
  description: string;
  description_format: number;
  visible: boolean;
  time_created: number;
  time_modified: number;
}

export interface UpdateCohortResponse {
  cohort_id: number;
  context_id: number;
  name: string;
  idnumber: string;
  description: string;
  description_format: number;
  visible: boolean;
  time_created: number;
  time_modified: number;
}

export interface DeleteCohortResponse {
  deleted: boolean;
  id: number;
}

export interface AddCohortMemberResponse {
  cohort_id: number;
  user_id: number;
  member: boolean;
}

export interface RemoveCohortMemberResponse {
  cohort_id: number;
  user_id: number;
  member: boolean;
}

export interface AssignCourseRoleResponse {
  course_id: number;
  user_id: number;
  role_id: number;
  role_archetype: string;
  assigned: boolean;
  roles: string[];
}

export interface UnassignCourseRoleResponse {
  course_id: number;
  user_id: number;
  role_id: number;
  role_archetype: string;
  unassigned: boolean;
  roles: string[];
}

export interface EnrolUserResponse {
  course_id: number;
  user_id: number;
  role_id: number;
  role_archetype: string;
  enrolled: boolean;
  user: {
    user_id: number;
    username: string;
    fullname: string;
    email: string;
    roles: string[];
  };
}

export interface UnenrolUserResponse {
  course_id: number;
  user_id: number;
  unenrolled: boolean;
}

export interface GetGroupsResponse {
  course_id: number;
  groups: {
    group_id: number;
    course_id: number;
    name: string;
    description: string;
    idnumber: string;
  }[];
}

export interface CreateGroupResponse {
  group_id: number;
  course_id: number;
  name: string;
  description: string;
  idnumber: string;
}

export interface UpdateGroupResponse {
  group_id: number;
  course_id: number;
  name: string;
  description: string;
  idnumber: string;
}

export interface DeleteGroupResponse {
  deleted: boolean;
  id: number;
}

export interface GetGroupingsResponse {
  course_id: number;
  groupings: {
    grouping_id: number;
    course_id: number;
    name: string;
    description: string;
    idnumber: string;
    group_ids: number[];
  }[];
}

export interface CreateGroupingResponse {
  grouping_id: number;
  course_id: number;
  name: string;
  description: string;
  idnumber: string;
}

export interface UpdateGroupingResponse {
  grouping_id: number;
  course_id: number;
  name: string;
  description: string;
  idnumber: string;
}

export interface DeleteGroupingResponse {
  deleted: boolean;
  id: number;
}

export interface AddGroupToGroupingResponse {
  course_id: number;
  grouping_id: number;
  group_id: number;
  added: boolean;
  grouping: JsonObject | string;
  group: JsonObject | string;
}

export interface RemoveGroupFromGroupingResponse {
  course_id: number;
  grouping_id: number;
  group_id: number;
  removed: boolean;
}

export interface GetGroupMembersResponse {
  course_id: number;
  group_id: number;
  members: {
    user_id: number;
    username: string;
    fullname: string;
    email: string;
  }[];
}

export interface AddGroupMemberResponse {
  course_id: number;
  group_id: number;
  user_id: number;
  added: boolean;
}

export interface RemoveGroupMemberResponse {
  course_id: number;
  group_id: number;
  user_id: number;
  removed: boolean;
}

export interface CreateCourseResponse {
  course_id: number;
  shortname: string;
  fullname: string;
  category_id: number;
  visible: boolean;
  summary: string;
  summary_format: string;
  format: string;
  enable_completion: boolean;
  start_date: number;
  end_date: number;
  url: string;
}

export interface ExportCourseBlueprintResponse {
  course_id: number;
  blueprint_json: string;
}

export interface CreateCourseFromBlueprintResponse {
  course_id: number;
  publish_state: string;
  course_json: string;
  sections_json: string;
  modules_json: string;
  groups_json: string;
  enrolments_json: string;
  warnings_json: string;
}

export interface ApplyCourseBlueprintResponse {
  course_id: number;
  sections_json: string;
  modules_json: string;
  groups_json: string;
  enrolments_json: string;
  warnings_json: string;
}

export interface CopyCourseStructureResponse {
  source_course_id: number;
  target_course_id: number;
  sections_json: string;
  modules_json: string;
  groups_json: string;
  warnings_json: string;
}

export interface SyncCourseEnrolmentsResponse {
  course_id: number;
  enrolled_json: string;
  unenrolled_json: string;
  warnings_json: string;
}

export interface SetCoursePublishStateResponse {
  course_id: number;
  publish_state: string;
  visible: boolean;
  course_json: string;
}

export interface AuditCourseResponse {
  course_id: number;
  ready: boolean;
  issue_count: number;
  issues_json: string;
}

export interface BackupCourseResponse {
  course_id: number;
  file_id: number;
  filename: string;
  url: string;
  filepath: string;
  filesize: number;
  mimetype: string;
  time_modified: number;
}

export interface RestoreCourseBackupResponse {
  course_id: number;
  target: string;
  restored: boolean;
  fullname: string;
  shortname: string;
  category_id: number;
  warnings_json: string;
}

export interface UploadCourseBackupResponse {
  course_id: number;
  file_id: number;
  filename: string;
  url: string;
  filepath: string;
  filesize: number;
  mimetype: string;
  time_modified: number;
}

export interface GetCourseBackupFilesResponse {
  course_id: number;
  count: number;
  files_json: string;
}

export interface DeleteCourseBackupFileResponse {
  file_id: number;
  filename: string;
  deleted: boolean;
}

export interface AuditCourseCompletionResponse {
  course_id: number;
  issue_count: number;
  repairable_count: number;
  issues_json: string;
  ok_json: string;
}

export interface RepairCourseCompletionResponse {
  course_id: number;
  mode: string;
  dry_run: boolean;
  changed_count: number;
  warning_count: number;
  changes_json: string;
  warnings_json: string;
}

export interface UpdateCourseResponse {
  course_id: number;
  shortname: string;
  fullname: string;
  category_id: number;
  visible: boolean;
  summary: string;
  summary_format: string;
  format: string;
  enable_completion: boolean;
  start_date: number;
  end_date: number;
  url: string;
}

export interface MoveCourseResponse {
  course_id: number;
  category_id: number;
  moved: boolean;
  url: string;
}

export interface DeleteCourseResponse {
  deleted: boolean;
  id: number;
}

export interface CreateSectionResponse {
  section_id: number;
  course_id: number;
  section_number: number;
  name: string;
  summary: string;
  summary_raw: string;
  summary_format: string;
  summary_files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
  }[];
  visible: boolean;
}

export interface UpdateSectionResponse {
  section_id: number;
  course_id: number;
  section_number: number;
  name: string;
  summary: string;
  summary_raw: string;
  summary_format: string;
  summary_files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
  }[];
  visible: boolean;
  uploaded_files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
  }[];
}

export interface DeleteSectionResponse {
  deleted: boolean;
  id: number;
}

export interface CreateModuleResponse {
  module_id: number;
  course_module_id: number;
  instance_id: number;
  name: string;
  module_type: string;
  visible: boolean;
  visible_on_course_page: boolean;
  user_visible: boolean;
  id_number: string;
  language: string;
  group_mode: number;
  grouping_id: number;
  availability: string;
  download_content: boolean;
  completion: number;
  completion_view: number;
  completion_grade_item_number: number;
  completion_expected: number;
  url: string;
}

export interface UpdateModuleResponse {
  module_id: number;
  course_module_id: number;
  instance_id: number;
  name: string;
  module_type: string;
  visible: boolean;
  visible_on_course_page: boolean;
  user_visible: boolean;
  id_number: string;
  language: string;
  group_mode: number;
  grouping_id: number;
  availability: string;
  download_content: boolean;
  completion: number;
  completion_view: number;
  completion_grade_item_number: number;
  completion_expected: number;
  url: string;
}

export interface DuplicateModuleResponse {
  module_id: number;
  course_module_id: number;
  instance_id: number;
  name: string;
  module_type: string;
  visible: boolean;
  visible_on_course_page: boolean;
  user_visible: boolean;
  id_number: string;
  language: string;
  group_mode: number;
  grouping_id: number;
  availability: string;
  download_content: boolean;
  url: string;
}

export interface MoveModuleResponse {
  module_id: number;
  course_module_id: number;
  instance_id: number;
  name: string;
  module_type: string;
  visible: boolean;
  visible_on_course_page: boolean;
  user_visible: boolean;
  id_number: string;
  language: string;
  group_mode: number;
  grouping_id: number;
  availability: string;
  download_content: boolean;
  url: string;
}

export interface GetCourseBooksResponse {
  course_id: number;
  count: number;
  books: {
    book_id: number;
    module_id: number;
    course_id: number;
    name: string;
    numbering: number;
    custom_titles: boolean;
    revision: number;
    time_modified: number;
    url: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetBookChaptersResponse {
  course_id: number;
  module_id: number;
  book_id: number;
  count: number;
  chapters: {
    chapter_id: number;
    book_id: number;
    module_id: number;
    title: string;
    content: string;
    content_format: number;
    page_number: number;
    subchapter: boolean;
    hidden: boolean;
    parent_chapter_id: number;
    previous_chapter_id: number;
    next_chapter_id: number;
    url: string;
    files: {
      file_id: number;
      filename: string;
      url: string;
      filepath: string;
      filesize: number;
      mimetype: string;
      content_hash: string;
      time_modified: number;
    }[];
  }[];
}

export interface ViewBookResponse {
  course_id: number;
  module_id: number;
  book_id: number;
  chapter_id: number;
  viewed: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface CreateBookChapterResponse {
  chapter_id: number;
  book_id: number;
  module_id: number;
  title: string;
  content: string;
  content_format: number;
  page_number: number;
  subchapter: boolean;
  hidden: boolean;
  parent_chapter_id: number;
  previous_chapter_id: number;
  next_chapter_id: number;
  url: string;
  files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
  }[];
  uploaded_files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    time_modified: number;
  }[];
}

export interface UpdateBookChapterResponse {
  chapter_id: number;
  book_id: number;
  module_id: number;
  title: string;
  content: string;
  content_format: number;
  page_number: number;
  subchapter: boolean;
  hidden: boolean;
  parent_chapter_id: number;
  previous_chapter_id: number;
  next_chapter_id: number;
  url: string;
  files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
  }[];
  uploaded_files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    time_modified: number;
  }[];
}

export interface MoveBookChapterResponse {
  chapter_id: number;
  book_id: number;
  module_id: number;
  title: string;
  content: string;
  content_format: number;
  page_number: number;
  subchapter: boolean;
  hidden: boolean;
  parent_chapter_id: number;
  previous_chapter_id: number;
  next_chapter_id: number;
  url: string;
}

export interface DeleteBookChapterResponse {
  course_id: number;
  module_id: number;
  book_id: number;
  chapter_id: number;
  deleted: boolean;
  deleted_chapter_ids: number[];
}

export interface GetLessonAccessInformationResponse {
  module_id: number;
  lesson_id: number;
  can_manage: boolean;
  can_grade: boolean;
  can_view_reports: boolean;
  review_mode: boolean;
  attempts_count: number;
  last_page_seen: number;
  left_during_timed_session: boolean;
  first_page_id: number;
  prevent_access_reasons: {
    reason: string;
    data: string;
    message: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetLessonDetailsResponse {
  lesson: {
    module_id: number;
    lesson_id: number;
    course_id: number;
    name: string;
    intro: string;
    intro_format: number;
    language: string;
    grade: number;
    practice: boolean;
    allow_review: boolean;
    use_password: boolean;
    custom_scoring: boolean;
    ongoing_score: boolean;
    use_max_grade: boolean;
    max_answers: number;
    max_attempts: number;
    allow_question_retry: boolean;
    after_correct_answer: number;
    default_feedback: boolean;
    minimum_questions: number;
    pages_to_show: number;
    time_limit_seconds: number;
    retakes_allowed: boolean;
    activity_link: number;
    slideshow: boolean;
    slideshow_width: number;
    slideshow_height: number;
    slideshow_background: string;
    display_left_menu: boolean;
    display_left_if: number;
    progress_bar: boolean;
    available_from: number;
    deadline: number;
    time_modified: number;
    completion_end_reached: boolean;
    completion_time_spent_seconds: number;
    allow_offline_attempts: boolean;
    intro_files_count: number;
    media_files_count: number;
  };
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetCourseLessonsResponse {
  course_id: number;
  count: number;
  lessons: {
    module_id: number;
    lesson_id: number;
    course_id: number;
    name: string;
    intro: string;
    intro_format: number;
    language: string;
    grade: number;
    practice: boolean;
    allow_review: boolean;
    use_password: boolean;
    custom_scoring: boolean;
    ongoing_score: boolean;
    use_max_grade: boolean;
    max_answers: number;
    max_attempts: number;
    allow_question_retry: boolean;
    after_correct_answer: number;
    default_feedback: boolean;
    minimum_questions: number;
    pages_to_show: number;
    time_limit_seconds: number;
    retakes_allowed: boolean;
    activity_link: number;
    slideshow: boolean;
    slideshow_width: number;
    slideshow_height: number;
    slideshow_background: string;
    display_left_menu: boolean;
    display_left_if: number;
    progress_bar: boolean;
    available_from: number;
    deadline: number;
    time_modified: number;
    completion_end_reached: boolean;
    completion_time_spent_seconds: number;
    allow_offline_attempts: boolean;
    intro_files_count: number;
    media_files_count: number;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetLessonPagesResponse {
  module_id: number;
  lesson_id: number;
  count: number;
  pages: {
    page_id: number;
    lesson_id: number;
    module_id: number;
    previous_page_id: number;
    next_page_id: number;
    question_type: number;
    question_option: number;
    layout: number;
    display: number;
    display_in_menu_block: boolean;
    type: number;
    type_id: number;
    type_string: string;
    title: string;
    content: string;
    content_format: number;
    time_created: number;
    time_modified: number;
    answer_ids: number[];
    jumps: number[];
    files_count: number;
    files_size_total: number;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface CreateLessonPageResponse {
  created: boolean;
  page: {
    page_id: number;
    lesson_id: number;
    module_id: number;
    previous_page_id: number;
    next_page_id: number;
    question_type: number;
    question_option: number;
    layout: number;
    display: number;
    display_in_menu_block: boolean;
    type: number;
    type_id: number;
    type_string: string;
    title: string;
    content: string;
    content_format: number;
    time_created: number;
    time_modified: number;
    answer_ids: number[];
    jumps: number[];
    files_count: number;
    files_size_total: number;
    branches_count: number;
    branches: {
      answer_id: number;
      title: string;
      title_format: number;
      response: string;
      response_format: number;
      jump_to: number;
      score: number;
    }[];
  };
}

export interface UpdateLessonPageResponse {
  updated: boolean;
  page: {
    page_id: number;
    lesson_id: number;
    module_id: number;
    previous_page_id: number;
    next_page_id: number;
    question_type: number;
    question_option: number;
    layout: number;
    display: number;
    display_in_menu_block: boolean;
    type: number;
    type_id: number;
    type_string: string;
    title: string;
    content: string;
    content_format: number;
    time_created: number;
    time_modified: number;
    answer_ids: number[];
    jumps: number[];
    files_count: number;
    files_size_total: number;
    branches_count: number;
    branches: {
      answer_id: number;
      title: string;
      title_format: number;
      response: string;
      response_format: number;
      jump_to: number;
      score: number;
    }[];
  };
}

export interface DeleteLessonPageResponse {
  deleted: boolean;
  id: number;
}

export interface ViewLessonResponse {
  module_id: number;
  lesson_id: number;
  viewed: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetLessonUserGradeResponse {
  module_id: number;
  lesson_id: number;
  user_id: number;
  has_grade: boolean;
  grade: number;
  formatted_grade: string;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetLessonUserTimersResponse {
  module_id: number;
  lesson_id: number;
  user_id: number;
  count: number;
  timers: {
    timer_id: number;
    lesson_id: number;
    module_id: number;
    user_id: number;
    start_time: number;
    lesson_time: number;
    completed: boolean;
    time_modified_offline: number;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetLessonPossibleJumpsResponse {
  module_id: number;
  lesson_id: number;
  count: number;
  jumps: {
    page_id: number;
    answer_id: number;
    jump_to: number;
    calculated_jump: number;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetLessonAttemptsOverviewResponse {
  module_id: number;
  lesson_id: number;
  group_id: number;
  lesson_scored: boolean;
  attempts_count: number;
  average_score: number;
  high_score: number;
  low_score: number;
  average_time: number;
  high_time: number;
  low_time: number;
  students: {
    user_id: number;
    full_name: string;
    best_grade: number;
    attempts: {
      attempt_number: number;
      grade: number;
      time_start: number;
      time_end: number;
      end_time: number;
    }[];
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetDataFieldsResponse {
  course_id: number;
  module_id: number;
  data_id: number;
  count: number;
  fields: {
    field_id: number;
    data_id: number;
    module_id: number;
    type: string;
    name: string;
    description: string;
    required: boolean;
    params_json: string;
  }[];
}

export interface CreateDataFieldResponse {
  field_id: number;
  data_id: number;
  module_id: number;
  type: string;
  name: string;
  description: string;
  required: boolean;
  params_json: string;
}

export interface UpdateDataFieldResponse {
  field_id: number;
  data_id: number;
  module_id: number;
  type: string;
  name: string;
  description: string;
  required: boolean;
  params_json: string;
}

export interface DeleteDataFieldResponse {
  course_id: number;
  module_id: number;
  data_id: number;
  field_id: number;
  deleted: boolean;
}

export interface GetDataEntriesResponse {
  course_id: number;
  module_id: number;
  data_id: number;
  count: number;
  entries: {
    entry_id: number;
    data_id: number;
    module_id: number;
    user_id: number;
    group_id: number;
    approved: boolean;
    time_created: number;
    time_modified: number;
    contents_json: string;
  }[];
}

export interface CreateDataEntryResponse {
  entry_id: number;
  data_id: number;
  module_id: number;
  user_id: number;
  group_id: number;
  approved: boolean;
  time_created: number;
  time_modified: number;
  contents_json: string;
}

export interface UpdateDataEntryResponse {
  entry_id: number;
  data_id: number;
  module_id: number;
  user_id: number;
  group_id: number;
  approved: boolean;
  time_created: number;
  time_modified: number;
  contents_json: string;
}

export interface DeleteDataEntryResponse {
  deleted: boolean;
  id: number;
}

export interface SetWorkshopPhaseResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  phase: string;
  phase_code: number;
}

export interface GetWorkshopSubmissionsResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  count: number;
  submissions: {
    submission_id: number;
    workshop_id: number;
    module_id: number;
    author_id: number;
    title: string;
    content: string;
    content_format: string;
    grade: number;
    grade_over: number;
    grade_over_by: number;
    published: boolean;
    late: boolean;
    time_created: number;
    time_modified: number;
  }[];
}

export interface GetWorkshopUserPlanResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  user_id: number;
  phase_count: number;
  phases: {
    code: number;
    title: string;
    phase: string;
    active: boolean;
    task_count: number;
    tasks: {
      code: string;
      title: string;
      link: string;
      details: string;
      completed: string;
    }[];
    action_count: number;
    actions: {
      type: string;
      label: string;
      url: string;
      method: string;
    }[];
  }[];
  example_count: number;
  examples: {
    submission_id: number;
    title: string;
    assessment_id: number;
    grade: number;
    grading_grade: number;
  }[];
}

export interface GetWorkshopGradesResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  user_id: number;
  submission_raw_grade: number;
  submission_grade: string;
  submission_grade_hidden: boolean;
  assessment_raw_grade: number;
  assessment_grade: string;
  assessment_grade_hidden: boolean;
}

export interface GetWorkshopGradesReportResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  group_id: number;
  sort_by: string;
  sort_direction: string;
  page: number;
  per_page: number;
  total_count: number;
  count: number;
  grades: {
    user_id: number;
    submission_id: number;
    submission_title: string;
    submission_modified: number;
    submission_grade: number;
    grading_grade: number;
    submission_grade_over: number;
    submission_grade_over_by: number;
    submission_published: boolean;
    reviewed_by: {
      user_id: number;
      assessment_id: number;
      submission_id: number;
      grade: number;
      grading_grade: number;
      grading_grade_over: number;
      weight: number;
    }[];
    reviewer_of: {
      user_id: number;
      assessment_id: number;
      submission_id: number;
      grade: number;
      grading_grade: number;
      grading_grade_over: number;
      weight: number;
    }[];
  }[];
}

export interface GetWorkshopReviewerAssessmentsResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  user_id: number;
  count: number;
  assessments: {
    assessment_id: number;
    workshop_id: number;
    module_id: number;
    submission_id: number;
    reviewer_id: number;
    weight: number;
    grade: number;
    grading_grade: number;
    grading_grade_over: number;
    grading_grade_over_by: number;
    feedback_author: string;
    feedback_author_format: string;
    feedback_reviewer: string;
    feedback_reviewer_format: string;
    time_created: number;
    time_modified: number;
  }[];
}

export interface GetWorkshopSubmissionAssessmentsResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  submission_id: number;
  count: number;
  assessments: {
    assessment_id: number;
    workshop_id: number;
    module_id: number;
    submission_id: number;
    reviewer_id: number;
    weight: number;
    grade: number;
    grading_grade: number;
    grading_grade_over: number;
    grading_grade_over_by: number;
    feedback_author: string;
    feedback_author_format: string;
    feedback_reviewer: string;
    feedback_reviewer_format: string;
    time_created: number;
    time_modified: number;
  }[];
}

export interface AllocateWorkshopSubmissionResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  submission_id: number;
  assessment_id: number;
  reviewer_id: number;
  weight: number;
  grade: number;
  grading_grade: number;
  grading_grade_over: number;
  grading_grade_over_by: number;
  feedback_author: string;
  feedback_author_format: string;
  feedback_reviewer: string;
  feedback_reviewer_format: string;
  time_created: number;
  time_modified: number;
  created: boolean;
}

export interface GetWorkshopAssessmentFormDefinitionResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  assessment_id: number;
  mode: string;
  dimensions_count: number;
  description_files_count: number;
  options_json: string;
  fields_json: string;
  current_json: string;
  dimensions_json: string;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetWorkshopGradingFormResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  strategy: string;
  phase: number;
  dimensions_count: number;
  definition_json: string;
}

export interface SetWorkshopGradingFormResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  strategy: string;
  updated: boolean;
  dimensions_count: number;
  dimensions_json: string;
}

export interface UpdateWorkshopAssessmentResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  assessment_id: number;
  updated: boolean;
  raw_grade: number;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface EvaluateWorkshopAssessmentResponse {
  course_id: number;
  module_id: number;
  workshop_id: number;
  assessment_id: number;
  evaluated: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface CreateWorkshopSubmissionResponse {
  submission_id: number;
  workshop_id: number;
  module_id: number;
  author_id: number;
  title: string;
  content: string;
  content_format: string;
  grade: number;
  grade_over: number;
  grade_over_by: number;
  published: boolean;
  late: boolean;
  time_created: number;
  time_modified: number;
}

export interface UpdateWorkshopSubmissionResponse {
  submission_id: number;
  workshop_id: number;
  module_id: number;
  author_id: number;
  title: string;
  content: string;
  content_format: string;
  grade: number;
  grade_over: number;
  grade_over_by: number;
  published: boolean;
  late: boolean;
  time_created: number;
  time_modified: number;
}

export interface DeleteWorkshopSubmissionResponse {
  deleted: boolean;
  id: number;
}

export interface CreateGlossaryEntryResponse {
  entry_id: number;
  glossary_id: number;
  module_id: number;
  concept: string;
  definition: string;
  definition_format: string;
  approved: boolean;
  url: string;
}

export interface GetCourseGlossariesResponse {
  course_id: number;
  count: number;
  glossaries: {
    glossary_id: number;
    module_id: number;
    course_id: number;
    name: string;
    intro: string;
    intro_format: number;
    allow_duplicated_entries: boolean;
    display_format: string;
    main_glossary: boolean;
    show_special: boolean;
    show_alphabet: boolean;
    show_all: boolean;
    allow_comments: boolean;
    allow_print_view: boolean;
    use_dynamic_linking: boolean;
    default_approval: boolean;
    approval_display_format: string;
    global_glossary: boolean;
    entries_per_page: number;
    edit_always: boolean;
    rss_type: number;
    rss_articles: number;
    assessed: number;
    scale: number;
    time_created: number;
    time_modified: number;
    completion_entries: number;
    browse_modes: string[];
    can_add_entry: boolean;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface ViewGlossaryResponse {
  module_id: number;
  glossary_id: number;
  mode: string;
  viewed: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface ViewGlossaryEntryResponse {
  module_id: number;
  glossary_id: number;
  entry_id: number;
  viewed: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetGlossaryEntryResponse {
  entry_id: number;
  glossary_id: number;
  module_id: number;
  concept: string;
  definition: string;
  definition_format: string;
  approved: boolean;
  url: string;
  can_delete: boolean;
  can_update: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetGlossaryEntriesByLetterResponse {
  module_id: number;
  glossary_id: number;
  count: number;
  entries: {
    entry_id: number;
    glossary_id: number;
    module_id: number;
    concept: string;
    definition: string;
    definition_format: string;
    approved: boolean;
    url: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetGlossaryEntriesByCategoryResponse {
  module_id: number;
  glossary_id: number;
  count: number;
  entries: {
    entry_id: number;
    glossary_id: number;
    module_id: number;
    concept: string;
    definition: string;
    definition_format: string;
    approved: boolean;
    url: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
  category_id: number;
}

export interface GetGlossaryEntriesByAuthorResponse {
  module_id: number;
  glossary_id: number;
  count: number;
  entries: {
    entry_id: number;
    glossary_id: number;
    module_id: number;
    concept: string;
    definition: string;
    definition_format: string;
    approved: boolean;
    url: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
  letter: string;
  field: string;
}

export interface GetGlossaryEntriesByAuthorIdResponse {
  module_id: number;
  glossary_id: number;
  count: number;
  entries: {
    entry_id: number;
    glossary_id: number;
    module_id: number;
    concept: string;
    definition: string;
    definition_format: string;
    approved: boolean;
    url: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
  author_id: number;
}

export interface GetGlossaryEntriesByDateResponse {
  module_id: number;
  glossary_id: number;
  count: number;
  entries: {
    entry_id: number;
    glossary_id: number;
    module_id: number;
    concept: string;
    definition: string;
    definition_format: string;
    approved: boolean;
    url: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetGlossaryEntriesByTermResponse {
  module_id: number;
  glossary_id: number;
  count: number;
  entries: {
    entry_id: number;
    glossary_id: number;
    module_id: number;
    concept: string;
    definition: string;
    definition_format: string;
    approved: boolean;
    url: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetGlossaryCategoriesResponse {
  module_id: number;
  glossary_id: number;
  count: number;
  categories: {
    category_id: number;
    glossary_id: number;
    module_id: number;
    name: string;
    use_dynamic_linking: boolean;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetGlossaryAuthorsResponse {
  module_id: number;
  glossary_id: number;
  count: number;
  authors: {
    user_id: number;
    full_name: string;
    picture_url: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface SearchGlossaryEntriesResponse {
  course_id: number;
  module_id: number;
  glossary_id: number;
  count: number;
  entries: {
    entry_id: number;
    glossary_id: number;
    module_id: number;
    concept: string;
    definition: string;
    definition_format: string;
    approved: boolean;
    url: string;
  }[];
}

export interface GetGlossaryEntriesToApproveResponse {
  module_id: number;
  glossary_id: number;
  count: number;
  entries: {
    entry_id: number;
    glossary_id: number;
    module_id: number;
    concept: string;
    definition: string;
    definition_format: string;
    approved: boolean;
    url: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface UpdateGlossaryEntryResponse {
  entry_id: number;
  glossary_id: number;
  module_id: number;
  concept: string;
  definition: string;
  definition_format: string;
  approved: boolean;
  url: string;
}

export interface DeleteGlossaryEntryResponse {
  deleted: boolean;
  id: number;
}

export interface CreateWikiPageResponse {
  page_id: number;
  wiki_id: number;
  module_id: number;
  subwiki_id: number;
  title: string;
  content: string;
  content_format: string;
  can_edit: boolean;
  first_page: boolean;
  time_created: number;
  time_modified: number;
  url: string;
}

export interface GetWikiPagesResponse {
  course_id: number;
  module_id: number;
  wiki_id: number;
  count: number;
  pages: {
    page_id: number;
    wiki_id: number;
    module_id: number;
    subwiki_id: number;
    title: string;
    content: string;
    content_format: string;
    can_edit: boolean;
    first_page: boolean;
    time_created: number;
    time_modified: number;
    url: string;
  }[];
}

export interface GetWikiSubwikisResponse {
  course_id: number;
  module_id: number;
  wiki_id: number;
  count: number;
  subwikis: {
    subwiki_id: number;
    wiki_id: number;
    module_id: number;
    group_id: number;
    user_id: number;
    can_edit: boolean;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetWikiFilesResponse {
  course_id: number;
  module_id: number;
  wiki_id: number;
  group_id: number;
  user_id: number;
  count: number;
  files: {
    file_name: string;
    file_path: string;
    file_size: number;
    file_url: string;
    time_modified: number;
    mime_type: string;
    is_external_file: boolean;
    repository_type: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface ViewWikiResponse {
  course_id: number;
  module_id: number;
  wiki_id: number;
  status: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface ViewWikiPageResponse {
  course_id: number;
  module_id: number;
  wiki_id: number;
  page_id: number;
  status: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface UpdateWikiPageResponse {
  page_id: number;
  wiki_id: number;
  module_id: number;
  subwiki_id: number;
  title: string;
  content: string;
  content_format: string;
  can_edit: boolean;
  first_page: boolean;
  time_created: number;
  time_modified: number;
  url: string;
}

export interface DeleteWikiPageResponse {
  deleted: boolean;
  id: number;
  course_id: number;
  module_id: number;
  wiki_id: number;
  subwiki_id: number;
  title: string;
}

export interface GetChoiceOptionsResponse {
  choice_id: number;
  choice_module_id: number;
  options: {
    option_id: number;
    text: string;
    max_answers: number;
    answer_count: number;
    checked: boolean;
    disabled: boolean;
  }[];
}

export interface GetCourseChoicesResponse {
  course_id: number;
  count: number;
  choices: {
    choice_id: number;
    choice_module_id: number;
    course_id: number;
    name: string;
    intro: string;
    intro_format: number;
    publish_anonymous: boolean;
    show_results: number;
    display: number;
    allow_update: boolean;
    allow_multiple: boolean;
    show_unanswered: boolean;
    include_inactive: boolean;
    limit_answers: boolean;
    time_open: number;
    time_close: number;
    show_preview: boolean;
    time_modified: number;
    completion_submit: boolean;
    show_available: boolean;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface ViewChoiceResponse {
  choice_id: number;
  choice_module_id: number;
  viewed: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface SubmitChoiceResponseResponse {
  choice_id: number;
  choice_module_id: number;
  submitted: boolean;
  option_ids: string;
}

export interface DeleteChoiceResponsesResponse {
  choice_id: number;
  choice_module_id: number;
  deleted: boolean;
  response_ids: string;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetCourseFeedbacksResponse {
  course_id: number;
  count: number;
  feedbacks: {
    feedback_id: number;
    module_id: number;
    course_id: number;
    name: string;
    intro: string;
    intro_format: number;
    language: string;
    anonymous: number;
    email_notification: boolean;
    multiple_submit: boolean;
    auto_numbering: boolean;
    site_after_submit: string;
    page_after_submit: string;
    page_after_submit_format: number;
    publish_stats: boolean;
    time_open: number;
    time_close: number;
    time_modified: number;
    completion_submit: boolean;
    url: string;
  }[];
  warnings: unknown[];
}

export interface ViewFeedbackResponse {
  feedback_id: number;
  module_id: number;
  viewed: boolean;
  warnings: unknown[];
}

export interface GetFeedbackAccessInformationResponse {
  feedback_id: number;
  module_id: number;
  can_view_analysis: boolean;
  can_complete: boolean;
  can_submit: boolean;
  can_delete_submissions: boolean;
  can_view_reports: boolean;
  can_edit_items: boolean;
  is_empty: boolean;
  is_open: boolean;
  is_already_submitted: boolean;
  is_anonymous: boolean;
  warnings: unknown[];
}

export interface CreateFeedbackItemResponse {
  item_id: number;
  feedback_id: number;
  module_id: number;
  name: string;
  name_format: number;
  label: string;
  presentation: string;
  presentation_format: number;
  type: string;
  has_value: boolean;
  position: number;
  item_number: number;
  required: boolean;
  depend_item_id: number;
  depend_value: string;
  options: string;
  other_data: string;
}

export interface UpdateFeedbackItemResponse {
  item_id: number;
  feedback_id: number;
  module_id: number;
  name: string;
  name_format: number;
  label: string;
  presentation: string;
  presentation_format: number;
  type: string;
  has_value: boolean;
  position: number;
  item_number: number;
  required: boolean;
  depend_item_id: number;
  depend_value: string;
  options: string;
  other_data: string;
}

export interface GetFeedbackItemsResponse {
  course_id: number;
  module_id: number;
  feedback_id: number;
  count: number;
  items: {
    item_id: number;
    feedback_id: number;
    module_id: number;
    name: string;
    name_format: number;
    label: string;
    presentation: string;
    presentation_format: number;
    type: string;
    has_value: boolean;
    position: number;
    item_number: number;
    required: boolean;
    depend_item_id: number;
    depend_value: string;
    options: string;
    other_data: string;
  }[];
}

export interface GetFeedbackPageItemsResponse {
  course_id: number;
  feedback_id: number;
  module_id: number;
  page: number;
  count: number;
  has_previous_page: boolean;
  has_next_page: boolean;
  items: {
    item_id: number;
    feedback_id: number;
    module_id: number;
    name: string;
    name_format: number;
    label: string;
    presentation: string;
    presentation_format: number;
    type: string;
    has_value: boolean;
    position: number;
    item_number: number;
    required: boolean;
    depend_item_id: number;
    depend_value: string;
    options: string;
    other_data: string;
  }[];
  warnings: unknown[];
}

export interface GetFeedbackAnalysisResponse {
  course_id: number;
  feedback_id: number;
  module_id: number;
  group_id: number;
  completed_count: number;
  items_count: number;
  items_data: {
    item: JsonObject | string;
    data_json: string;
  }[];
  warnings: unknown[];
}

export interface GetFeedbackFinishedResponsesResponse {
  course_id: number;
  feedback_id: number;
  module_id: number;
  count: number;
  responses: {
    response_id: number;
    name: string;
    print_value: string;
    raw_value: string;
  }[];
  warnings: unknown[];
}

export interface DeleteFeedbackItemResponse {
  deleted: boolean;
  id: number;
}

export interface GetChoiceResultsResponse {
  choice_id: number;
  choice_module_id: number;
  results: {
    option_id: number;
    text: string;
    answer_count: number;
  }[];
}

export interface GetCourseForumsResponse {
  course_id: number;
  count: number;
  forums: {
    forum_id: number;
    module_id: number;
    course_id: number;
    forum_type: string;
    name: string;
    intro: string;
    intro_format: number;
    due_date: number;
    cutoff_date: number;
    assessed: number;
    scale: number;
    grade_forum: number;
    grade_forum_notify: number;
    max_bytes: number;
    max_attachments: number;
    force_subscribe: number;
    tracking_type: number;
    rss_type: number;
    rss_articles: number;
    time_modified: number;
    warn_after: number;
    block_after: number;
    block_period: number;
    completion_discussions: number;
    completion_replies: number;
    completion_posts: number;
    discussion_count: number;
    can_create_discussions: boolean;
    lock_discussion_after: number;
    tracked: boolean;
    unread_posts: number;
    show_immediately: boolean;
    url: string;
  }[];
  warnings: unknown[];
}

export interface ViewForumResponse {
  forum_id: number;
  module_id: number;
  viewed: boolean;
  warnings: unknown[];
}

export interface GetForumDiscussionsResponse {
  course_id: number;
  module_id: number;
  forum_id: number;
  discussions: {
    discussion_id: number;
    forum_id: number;
    course_id: number;
    module_id: number;
    first_post_id: number;
    name: string;
    message: string;
    user_id: number;
    reply_count: number;
    created: number;
    modified: number;
    can_reply: boolean;
    url: string;
  }[];
}

export interface CreateForumDiscussionResponse {
  discussion_id: number;
  forum_id: number;
  course_id: number;
  module_id: number;
  first_post_id: number;
  name: string;
  message: string;
  user_id: number;
  reply_count: number;
  created: number;
  modified: number;
  can_reply: boolean;
  url: string;
}

export interface GetForumDiscussionPostsResponse {
  course_id: number;
  module_id: number;
  forum_id: number;
  discussion_id: number;
  posts: {
    post_id: number;
    discussion_id: number;
    parent_post_id: number;
    subject: string;
    message: string;
    user_id: number;
    created: number;
    modified: number;
    url: string;
  }[];
}

export interface CreateForumDiscussionPostResponse {
  post_id: number;
  discussion_id: number;
  parent_post_id: number;
  subject: string;
  message: string;
  user_id: number;
  created: number;
  modified: number;
  url: string;
}

export interface UpdateForumDiscussionPostResponse {
  post_id: number;
  discussion_id: number;
  parent_post_id: number;
  subject: string;
  message: string;
  user_id: number;
  created: number;
  modified: number;
  url: string;
}

export interface SetForumDiscussionPinResponse {
  course_id: number;
  module_id: number;
  forum_id: number;
  discussion_id: number;
  pinned: boolean;
}

export interface SetForumDiscussionFavouriteResponse {
  course_id: number;
  module_id: number;
  forum_id: number;
  discussion_id: number;
  favourite: boolean;
}

export interface SetForumDiscussionSubscriptionResponse {
  course_id: number;
  module_id: number;
  forum_id: number;
  discussion_id: number;
  subscribed: boolean;
}

export interface SetForumDiscussionLockResponse {
  course_id: number;
  module_id: number;
  forum_id: number;
  discussion_id: number;
  locked: boolean;
  lock_time: number;
}

export interface DeleteForumDiscussionPostResponse {
  deleted: boolean;
  id: number;
  course_id: number;
  module_id: number;
  discussion_id: number;
}

export interface GetCourseAssignmentsResponse {
  course_id: number;
  count: number;
  assignments: {
    assignment_id: number;
    module_id: number;
    course_id: number;
    name: string;
    intro: string;
    intro_format: number;
    activity: string;
    activity_format: number;
    intro_files: {
      file_id: number;
      filename: string;
      url: string;
      filepath: string;
      filesize: number;
      mimetype: string;
      content_hash: string;
      time_modified: number;
      file_area: string;
    }[];
    activity_files: {
      file_id: number;
      filename: string;
      url: string;
      filepath: string;
      filesize: number;
      mimetype: string;
      content_hash: string;
      time_modified: number;
      file_area: string;
    }[];
    allowsubmissionsfromdate: number;
    duedate: number;
    cutoffdate: number;
    gradingduedate: number;
    grade: number;
    teamsubmission: boolean;
    requireallteammemberssubmit: boolean;
    teamsubmissiongroupingid: number;
    blindmarking: boolean;
    hidegrader: boolean;
    markingworkflow: boolean;
    markingallocation: boolean;
    requiresubmissionstatement: boolean;
    submissiondrafts: boolean;
    maxattempts: number;
    attemptreopenmethod: string;
    submissionattachments: boolean;
    sendnotifications: boolean;
    sendlatenotifications: boolean;
    sendstudentnotifications: boolean;
    submission_plugins: string[];
    feedback_plugins: string[];
    visible: boolean;
    url: string;
  }[];
}

export interface UpdateAssignmentResponse {
  assignment_id: number;
  module_id: number;
  course_id: number;
  name: string;
  intro: string;
  intro_format: number;
  activity: string;
  activity_format: number;
  intro_files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
    file_area: string;
  }[];
  activity_files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
    file_area: string;
  }[];
  allowsubmissionsfromdate: number;
  duedate: number;
  cutoffdate: number;
  gradingduedate: number;
  grade: number;
  teamsubmission: boolean;
  requireallteammemberssubmit: boolean;
  teamsubmissiongroupingid: number;
  blindmarking: boolean;
  hidegrader: boolean;
  markingworkflow: boolean;
  markingallocation: boolean;
  requiresubmissionstatement: boolean;
  submissiondrafts: boolean;
  maxattempts: number;
  attemptreopenmethod: string;
  submissionattachments: boolean;
  sendnotifications: boolean;
  sendlatenotifications: boolean;
  sendstudentnotifications: boolean;
  submission_plugins: string[];
  feedback_plugins: string[];
  visible: boolean;
  url: string;
  uploaded_files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
    file_area: string;
  }[];
}

export interface GetAssignmentSubmissionStatusResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  user_id: number;
  submission_id: number;
  status: string;
  attempt_number: number;
  can_edit: boolean;
  submitted: boolean;
  online_text: string;
  graded: boolean;
  grade: number;
  grader_id: number;
  grading_status: string;
  feedback_comment: string;
}

export interface SaveAssignmentSubmissionResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  user_id: number;
  submission_id: number;
  status: string;
  attempt_number: number;
  can_edit: boolean;
  submitted: boolean;
  online_text: string;
  graded: boolean;
  grade: number;
  grader_id: number;
  grading_status: string;
  feedback_comment: string;
}

export interface SubmitAssignmentForGradingResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  user_id: number;
  submission_id: number;
  status: string;
  attempt_number: number;
  can_edit: boolean;
  submitted: boolean;
  online_text: string;
  graded: boolean;
  grade: number;
  grader_id: number;
  grading_status: string;
  feedback_comment: string;
}

export interface SaveAssignmentGradeResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  user_id: number;
  submission_id: number;
  status: string;
  attempt_number: number;
  can_edit: boolean;
  submitted: boolean;
  online_text: string;
  graded: boolean;
  grade: number;
  grader_id: number;
  grading_status: string;
  feedback_comment: string;
}

export interface GetAssignmentGradingFormResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  active_method: string;
  supported: boolean;
  definition_id: number;
  name: string;
  description: string;
  status: number;
  criteria: {
    criterion_id: number;
    sort_order: number;
    shortname: string;
    description: string;
    description_markers: string;
    max_score: number;
    levels: {
      level_id: number;
      score: number;
      definition: string;
    }[];
  }[];
  comments: {
    comment_id: number;
    sort_order: number;
    description: string;
  }[];
  checklist_compatible: boolean;
  options_json: string;
}

export interface SetAssignmentRubricResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  active_method: string;
  supported: boolean;
  definition_id: number;
  name: string;
  description: string;
  status: number;
  criteria: {
    criterion_id: number;
    sort_order: number;
    shortname: string;
    description: string;
    description_markers: string;
    max_score: number;
    levels: {
      level_id: number;
      score: number;
      definition: string;
    }[];
  }[];
  comments: {
    comment_id: number;
    sort_order: number;
    description: string;
  }[];
  checklist_compatible: boolean;
  options_json: string;
}

export interface SetAssignmentChecklistResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  active_method: string;
  supported: boolean;
  definition_id: number;
  name: string;
  description: string;
  status: number;
  criteria: {
    criterion_id: number;
    sort_order: number;
    shortname: string;
    description: string;
    description_markers: string;
    max_score: number;
    levels: {
      level_id: number;
      score: number;
      definition: string;
    }[];
  }[];
  comments: {
    comment_id: number;
    sort_order: number;
    description: string;
  }[];
  checklist_compatible: boolean;
  options_json: string;
}

export interface SetAssignmentMarkingGuideResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  active_method: string;
  supported: boolean;
  definition_id: number;
  name: string;
  description: string;
  status: number;
  criteria: {
    criterion_id: number;
    sort_order: number;
    shortname: string;
    description: string;
    description_markers: string;
    max_score: number;
    levels: {
      level_id: number;
      score: number;
      definition: string;
    }[];
  }[];
  comments: {
    comment_id: number;
    sort_order: number;
    description: string;
  }[];
  checklist_compatible: boolean;
  options_json: string;
}

export interface GradeAssignmentWithRubricResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  user_id: number;
  submission_id: number;
  status: string;
  attempt_number: number;
  can_edit: boolean;
  submitted: boolean;
  online_text: string;
  graded: boolean;
  grade: number;
  grader_id: number;
  grading_status: string;
  feedback_comment: string;
}

export interface GradeAssignmentWithChecklistResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  user_id: number;
  submission_id: number;
  status: string;
  attempt_number: number;
  can_edit: boolean;
  submitted: boolean;
  online_text: string;
  graded: boolean;
  grade: number;
  grader_id: number;
  grading_status: string;
  feedback_comment: string;
}

export interface GradeAssignmentWithMarkingGuideResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  user_id: number;
  submission_id: number;
  status: string;
  attempt_number: number;
  can_edit: boolean;
  submitted: boolean;
  online_text: string;
  graded: boolean;
  grade: number;
  grader_id: number;
  grading_status: string;
  feedback_comment: string;
}

export interface GetAssignmentSubmissionsResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  submissions: {
    submission_id: number;
    assignment_id: number;
    user_id: number;
    status: string;
    attempt_number: number;
    group_id: number;
    created: number;
    modified: number;
    started: number;
    grading_status: string;
    online_text: string;
  }[];
}

export interface GetAssignmentGradesResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  grades: {
    grade_id: number;
    assignment_id: number;
    user_id: number;
    attempt_number: number;
    created: number;
    modified: number;
    grader_id: number;
    grade: number;
    grade_formatted: string;
  }[];
}

export interface ViewAssignmentResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  view: string;
  viewed: boolean;
}

export interface ViewAssignmentSubmissionStatusResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  view: string;
  viewed: boolean;
}

export interface ViewAssignmentGradingTableResponse {
  course_id: number;
  module_id: number;
  assignment_id: number;
  view: string;
  viewed: boolean;
}

export interface DeleteModuleResponse {
  deleted: boolean;
  id: number;
}

export interface UploadFolderFileResponse {
  file_id: number;
  filename: string;
  url: string;
}

export interface GetFolderFilesResponse {
  files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
  }[];
}

export interface DownloadFolderFileResponse {
  file_id: number;
  filename: string;
  url: string;
}

export interface UpdatePageResponse {
  module_id: number;
  instance_id: number;
  name: string;
  content: string;
  content_format: number;
  files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
  }[];
}

export interface UpdateLabelResponse {
  module_id: number;
  instance_id: number;
  content: string;
  content_format: number;
  files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
  }[];
}

export interface UpdateUrlResponse {
  module_id: number;
  instance_id: number;
  name: string;
  external_url: string;
  intro: string;
  intro_format: number;
  display: number;
  print_intro: boolean;
  popup_width: number;
  popup_height: number;
  files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
  }[];
}

export interface UpdateResourceResponse {
  module_id: number;
  course_module_id: number;
  instance_id: number;
  name: string;
  files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
  }[];
}

export interface GetResourceFilesResponse {
  files: {
    file_id: number;
    filename: string;
    url: string;
    filepath: string;
    filesize: number;
    mimetype: string;
    content_hash: string;
    time_modified: number;
  }[];
}

export interface DownloadResourceFileResponse {
  file_id: number;
  filename: string;
  url: string;
  filepath: string;
  filesize: number;
  mimetype: string;
  time_modified: number;
}

export interface DeleteFolderFileResponse {
  deleted: boolean;
  id: number;
}

export interface GetQuestionBanksResponse {
  banks: {
    bank_scope: string;
    module_id: number;
    question_bank_module_id: number | null;
    quiz_module_id: number | null;
    name: string;
    context_id: number;
    visible: boolean;
    url: unknown;
  }[];
}

export interface GetQuestionCategoriesResponse {
  categories: {
    category_id: number;
    name: string;
    context_id: number;
    parent_id: number;
    question_count: number;
    is_top: boolean;
    bank_scope: string;
    question_bank_module_id: number | null;
    quiz_module_id: number | null;
    url: unknown;
  }[];
}

export interface ExportQuestionBankBlueprintResponse {
  course_id: number;
  bank_scope: string;
  context_id: number;
  question_bank_module_id: number | null;
  quiz_module_id: number | null;
  category_count: number;
  question_count: number;
  skipped_question_count: number;
  blueprint_json: string;
}

export interface ImportQuestionBankBlueprintResponse {
  course_id: number;
  bank_scope: string;
  context_id: number;
  question_bank_module_id: number | null;
  quiz_module_id: number | null;
  created_category_count: number;
  created_question_count: number;
  created_categories_json: string;
  created_questions_json: string;
}

export interface CreateQuestionCategoryResponse {
  category_id: number;
  name: string;
  context_id: number;
  bank_scope: string;
  question_bank_module_id: number | null;
  quiz_module_id: number | null;
}

export interface UpdateQuestionCategoryResponse {
  category_id: number;
  name: string;
}

export interface DeleteQuestionCategoryResponse {
  deleted: boolean;
  id: number;
}

export interface CreateQuestionResponse {
  question_id: number;
  category_id: number;
  question_type: string;
  name: string;
}

export interface GetQuestionsResponse {
  questions: {
    question_id: number;
    category_id: number;
    question_type: string;
    name: string;
    question_text: string;
    default_mark: number;
  }[];
}

export interface UpdateQuestionResponse {
  question_id: number;
  name: string;
}

export interface MoveQuestionResponse {
  question_id: number;
  source_category_id: number;
  target_category_id: number;
  target_context_id: number;
  target_bank_scope: string;
  target_question_bank_module_id: number | null;
  target_quiz_module_id: number | null;
  moved: boolean;
}

export interface DeleteQuestionResponse {
  deleted: boolean;
  id: number;
}

export interface GetQuizQuestionsResponse {
  quiz_id: number;
  quiz_module_id: number;
  questions: {
    slot: number;
    slot_id: number;
    question_id: number;
    name: string;
    question_type: string;
    page: number;
    maxmark: number;
  }[];
}

export interface GetCourseQuizzesResponse {
  course_ids: number[];
  count: number;
  quizzes: {
    quiz_id: number;
    course_id: number;
    quiz_module_id: number;
    name: string;
    intro: string;
    intro_format: number;
    time_open: number;
    time_close: number;
    time_limit: number;
    attempts_allowed: number;
    grade: number;
    sum_grades: number;
    preferred_behaviour: string;
    questions_per_page: number;
    navigation_method: string;
    has_feedback: boolean;
    visible: boolean;
    url: string;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface StartQuizAttemptResponse {
  quiz_id: number;
  quiz_module_id: number;
  attempt: {
    attempt_id: number;
    quiz_id: number;
    user_id: number;
    attempt_number: number;
    unique_id: number;
    state: string;
    preview: boolean;
    time_start: number;
    time_finish: number;
    time_modified: number;
    sum_grades: number;
  };
}

export interface GetQuizAttemptsResponse {
  quiz_id: number;
  quiz_module_id: number;
  user_id: number;
  attempts: {
    attempt_id: number;
    quiz_id: number;
    user_id: number;
    attempt_number: number;
    unique_id: number;
    state: string;
    preview: boolean;
    time_start: number;
    time_finish: number;
    time_modified: number;
    sum_grades: number;
  }[];
}

export interface GetQuizResultsReportResponse {
  course_id: number;
  quiz_id: number;
  quiz_module_id: number;
  quiz_name: string;
  requested_limit: number;
  returned_user_count: number;
  total_enrolled_user_count: number;
  quiz_grade_max: number;
  users_with_attempts_count: number;
  users_with_finished_attempts_count: number;
  users_with_grades_count: number;
  average_best_grade: number;
  average_best_grade_percentage: number;
  users: {
    user_id: number;
    username: string;
    fullname: string;
    roles: string[];
    attempt_count: number;
    finished_attempt_count: number;
    in_progress_attempt_count: number;
    preview_attempt_count: number;
    last_attempt_state: string;
    last_attempt_time_start: number;
    last_attempt_time_finish: number;
    has_grade: boolean;
    best_grade: number;
    grade_to_pass: number;
    grade_percentage: number;
    feedback_text: string;
    feedback_format: number;
  }[];
  warnings: {
    user_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetQuizAttemptAccessInformationResponse {
  quiz_id: number;
  quiz_module_id: number;
  attempt_id: number;
  end_time: number;
  is_finished: boolean;
  is_preflight_check_required: boolean;
  prevent_new_attempt_reasons: string[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetQuizAttemptDataResponse {
  quiz_id: number;
  quiz_module_id: number;
  attempt: {
    attempt_id: number;
    quiz_id: number;
    user_id: number;
    attempt_number: number;
    unique_id: number;
    state: string;
    preview: boolean;
    time_start: number;
    time_finish: number;
    time_modified: number;
    sum_grades: number;
  };
  page: number;
  next_page: number;
  messages: string[];
  questions: {
    slot: number;
    question_type: string;
    page: number;
    question_number: string;
    html: string;
    flagged: boolean;
    sequence_check: number;
    last_action_time: number;
    has_autosaved_step: boolean;
    state: string;
    state_class: string;
    status: string;
    blocked_by_previous: boolean;
    mark: string;
    max_mark: number;
    settings: string;
    response_file_area_count: number;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetQuizAttemptSummaryResponse {
  quiz_id: number;
  quiz_module_id: number;
  attempt_id: number;
  total_unanswered: number;
  questions: {
    slot: number;
    question_type: string;
    page: number;
    question_number: string;
    html: string;
    flagged: boolean;
    sequence_check: number;
    last_action_time: number;
    has_autosaved_step: boolean;
    state: string;
    state_class: string;
    status: string;
    blocked_by_previous: boolean;
    mark: string;
    max_mark: number;
    settings: string;
    response_file_area_count: number;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface SaveQuizAttemptResponse {
  quiz_id: number;
  quiz_module_id: number;
  attempt_id: number;
  saved: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface ProcessQuizAttemptResponse {
  quiz_id: number;
  quiz_module_id: number;
  attempt_id: number;
  state: string;
  finished: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetQuizAttemptReviewResponse {
  quiz_id: number;
  quiz_module_id: number;
  attempt: {
    attempt_id: number;
    quiz_id: number;
    user_id: number;
    attempt_number: number;
    unique_id: number;
    state: string;
    preview: boolean;
    time_start: number;
    time_finish: number;
    time_modified: number;
    sum_grades: number;
  };
  grade: string;
  page: number;
  additional_data: {
    id: string;
    title: string;
    content: string;
  }[];
  questions: {
    slot: number;
    question_type: string;
    page: number;
    question_number: string;
    html: string;
    flagged: boolean;
    sequence_check: number;
    last_action_time: number;
    has_autosaved_step: boolean;
    state: string;
    state_class: string;
    status: string;
    blocked_by_previous: boolean;
    mark: string;
    max_mark: number;
    settings: string;
    response_file_area_count: number;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetQuizAccessInformationResponse {
  quiz_id: number;
  quiz_module_id: number;
  can_attempt: boolean;
  can_manage: boolean;
  can_preview: boolean;
  can_review_my_attempts: boolean;
  can_view_reports: boolean;
  access_rules: string[];
  active_rule_names: string[];
  prevent_access_reasons: string[];
}

export interface GetQuizCombinedReviewOptionsResponse {
  quiz_id: number;
  quiz_module_id: number;
  user_id: number;
  some_options: {
    name: string;
    value: boolean;
  }[];
  all_options: {
    name: string;
    value: boolean;
  }[];
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface ViewQuizResponse {
  quiz_id: number;
  quiz_module_id: number;
  viewed: boolean;
}

export interface ViewQuizAttemptResponse {
  quiz_id: number;
  quiz_module_id: number;
  attempt_id: number;
  page: number;
  viewed: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface ViewQuizAttemptSummaryResponse {
  quiz_id: number;
  quiz_module_id: number;
  attempt_id: number;
  viewed: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface ViewQuizAttemptReviewResponse {
  quiz_id: number;
  quiz_module_id: number;
  attempt_id: number;
  viewed: boolean;
  warnings: {
    item: string;
    item_id: number;
    warning_code: string;
    message: string;
  }[];
}

export interface GetQuizUserBestGradeResponse {
  quiz_id: number;
  quiz_module_id: number;
  user_id: number;
  has_grade: boolean;
  grade: number;
  grade_to_pass: number;
  feedback_text: string;
  feedback_format: number;
}

export interface GetQuizFeedbackForGradeResponse {
  quiz_id: number;
  quiz_module_id: number;
  grade: number;
  feedback_text: string;
  feedback_format: number;
}

export interface GetQuizRequiredQuestionTypesResponse {
  quiz_id: number;
  quiz_module_id: number;
  question_types: string[];
}

export interface AddQuestionToQuizResponse {
  quiz_id: number;
  question_id: number;
  slot: number;
  maxmark: number;
}

export interface AddRandomQuestionsToQuizResponse {
  quiz_id: number;
  quiz_module_id: number;
  category_id: number;
  added_count: number;
  include_subcategories: boolean;
  slots: {
    slot: number;
    slot_id: number;
    question_id: number;
    name: string;
    question_type: string;
    page: number;
    maxmark: number;
  }[];
}

export interface RemoveQuestionFromQuizResponse {
  quiz_id: number;
  quiz_module_id: number;
  question_id: number;
  slot: number;
  removed: boolean;
}

export interface UpdateQuizQuestionSlotResponse {
  quiz_id: number;
  quiz_module_id: number;
  slot: number;
  slot_id: number;
  question_id: number;
  question_type: string;
  maxmark: number;
  updated: boolean;
}

export interface MoodleOperationParameters {
  get_current_user: GetCurrentUserParameters;
  get_moodlia_status: GetMoodliaStatusParameters;
  get_sync_capabilities: GetSyncCapabilitiesParameters;
  list_plugins: ListPluginsParameters;
  get_plugin_details: GetPluginDetailsParameters;
  get_plugin_dependencies: GetPluginDependenciesParameters;
  check_plugin_updates: CheckPluginUpdatesParameters;
  set_plugin_enabled: SetPluginEnabledParameters;
  get_courses: GetCoursesParameters;
  get_course_categories: GetCourseCategoriesParameters;
  create_course_category: CreateCourseCategoryParameters;
  update_course_category: UpdateCourseCategoryParameters;
  delete_course_category: DeleteCourseCategoryParameters;
  get_course_contents: GetCourseContentsParameters;
  get_course_details: GetCourseDetailsParameters;
  get_module_details: GetModuleDetailsParameters;
  get_calendar_events: GetCalendarEventsParameters;
  create_calendar_event: CreateCalendarEventParameters;
  update_calendar_event: UpdateCalendarEventParameters;
  delete_calendar_event: DeleteCalendarEventParameters;
  get_enrolled_users: GetEnrolledUsersParameters;
  get_grade_items: GetGradeItemsParameters;
  set_course_grade_pass: SetCourseGradePassParameters;
  get_user_grades: GetUserGradesParameters;
  get_course_completion_criteria: GetCourseCompletionCriteriaParameters;
  set_course_completion_criteria: SetCourseCompletionCriteriaParameters;
  get_course_completion_status: GetCourseCompletionStatusParameters;
  get_activity_completion_statuses: GetActivityCompletionStatusesParameters;
  get_grade_categories: GetGradeCategoriesParameters;
  create_grade_category: CreateGradeCategoryParameters;
  update_grade_category: UpdateGradeCategoryParameters;
  delete_grade_category: DeleteGradeCategoryParameters;
  create_grade_item: CreateGradeItemParameters;
  update_grade_item: UpdateGradeItemParameters;
  delete_grade_item: DeleteGradeItemParameters;
  update_grade_value: UpdateGradeValueParameters;
  get_course_progress_report: GetCourseProgressReportParameters;
  set_activity_completion_status: SetActivityCompletionStatusParameters;
  get_user_details: GetUserDetailsParameters;
  create_user: CreateUserParameters;
  update_user: UpdateUserParameters;
  delete_user: DeleteUserParameters;
  create_cohort: CreateCohortParameters;
  update_cohort: UpdateCohortParameters;
  delete_cohort: DeleteCohortParameters;
  add_cohort_member: AddCohortMemberParameters;
  remove_cohort_member: RemoveCohortMemberParameters;
  assign_course_role: AssignCourseRoleParameters;
  unassign_course_role: UnassignCourseRoleParameters;
  enrol_user: EnrolUserParameters;
  unenrol_user: UnenrolUserParameters;
  get_groups: GetGroupsParameters;
  create_group: CreateGroupParameters;
  update_group: UpdateGroupParameters;
  delete_group: DeleteGroupParameters;
  get_groupings: GetGroupingsParameters;
  create_grouping: CreateGroupingParameters;
  update_grouping: UpdateGroupingParameters;
  delete_grouping: DeleteGroupingParameters;
  add_group_to_grouping: AddGroupToGroupingParameters;
  remove_group_from_grouping: RemoveGroupFromGroupingParameters;
  get_group_members: GetGroupMembersParameters;
  add_group_member: AddGroupMemberParameters;
  remove_group_member: RemoveGroupMemberParameters;
  create_course: CreateCourseParameters;
  export_course_blueprint: ExportCourseBlueprintParameters;
  create_course_from_blueprint: CreateCourseFromBlueprintParameters;
  apply_course_blueprint: ApplyCourseBlueprintParameters;
  copy_course_structure: CopyCourseStructureParameters;
  sync_course_enrolments: SyncCourseEnrolmentsParameters;
  set_course_publish_state: SetCoursePublishStateParameters;
  audit_course: AuditCourseParameters;
  backup_course: BackupCourseParameters;
  restore_course_backup: RestoreCourseBackupParameters;
  upload_course_backup: UploadCourseBackupParameters;
  get_course_backup_files: GetCourseBackupFilesParameters;
  delete_course_backup_file: DeleteCourseBackupFileParameters;
  audit_course_completion: AuditCourseCompletionParameters;
  repair_course_completion: RepairCourseCompletionParameters;
  update_course: UpdateCourseParameters;
  move_course: MoveCourseParameters;
  delete_course: DeleteCourseParameters;
  create_section: CreateSectionParameters;
  update_section: UpdateSectionParameters;
  delete_section: DeleteSectionParameters;
  create_module: CreateModuleParameters;
  update_module: UpdateModuleParameters;
  duplicate_module: DuplicateModuleParameters;
  move_module: MoveModuleParameters;
  get_course_books: GetCourseBooksParameters;
  get_book_chapters: GetBookChaptersParameters;
  view_book: ViewBookParameters;
  create_book_chapter: CreateBookChapterParameters;
  update_book_chapter: UpdateBookChapterParameters;
  move_book_chapter: MoveBookChapterParameters;
  delete_book_chapter: DeleteBookChapterParameters;
  get_lesson_access_information: GetLessonAccessInformationParameters;
  get_lesson_details: GetLessonDetailsParameters;
  get_course_lessons: GetCourseLessonsParameters;
  get_lesson_pages: GetLessonPagesParameters;
  create_lesson_page: CreateLessonPageParameters;
  update_lesson_page: UpdateLessonPageParameters;
  delete_lesson_page: DeleteLessonPageParameters;
  view_lesson: ViewLessonParameters;
  get_lesson_user_grade: GetLessonUserGradeParameters;
  get_lesson_user_timers: GetLessonUserTimersParameters;
  get_lesson_possible_jumps: GetLessonPossibleJumpsParameters;
  get_lesson_attempts_overview: GetLessonAttemptsOverviewParameters;
  get_data_fields: GetDataFieldsParameters;
  create_data_field: CreateDataFieldParameters;
  update_data_field: UpdateDataFieldParameters;
  delete_data_field: DeleteDataFieldParameters;
  get_data_entries: GetDataEntriesParameters;
  create_data_entry: CreateDataEntryParameters;
  update_data_entry: UpdateDataEntryParameters;
  delete_data_entry: DeleteDataEntryParameters;
  set_workshop_phase: SetWorkshopPhaseParameters;
  get_workshop_submissions: GetWorkshopSubmissionsParameters;
  get_workshop_user_plan: GetWorkshopUserPlanParameters;
  get_workshop_grades: GetWorkshopGradesParameters;
  get_workshop_grades_report: GetWorkshopGradesReportParameters;
  get_workshop_reviewer_assessments: GetWorkshopReviewerAssessmentsParameters;
  get_workshop_submission_assessments: GetWorkshopSubmissionAssessmentsParameters;
  allocate_workshop_submission: AllocateWorkshopSubmissionParameters;
  get_workshop_assessment_form_definition: GetWorkshopAssessmentFormDefinitionParameters;
  get_workshop_grading_form: GetWorkshopGradingFormParameters;
  set_workshop_grading_form: SetWorkshopGradingFormParameters;
  update_workshop_assessment: UpdateWorkshopAssessmentParameters;
  evaluate_workshop_assessment: EvaluateWorkshopAssessmentParameters;
  create_workshop_submission: CreateWorkshopSubmissionParameters;
  update_workshop_submission: UpdateWorkshopSubmissionParameters;
  delete_workshop_submission: DeleteWorkshopSubmissionParameters;
  create_glossary_entry: CreateGlossaryEntryParameters;
  get_course_glossaries: GetCourseGlossariesParameters;
  view_glossary: ViewGlossaryParameters;
  view_glossary_entry: ViewGlossaryEntryParameters;
  get_glossary_entry: GetGlossaryEntryParameters;
  get_glossary_entries_by_letter: GetGlossaryEntriesByLetterParameters;
  get_glossary_entries_by_category: GetGlossaryEntriesByCategoryParameters;
  get_glossary_entries_by_author: GetGlossaryEntriesByAuthorParameters;
  get_glossary_entries_by_author_id: GetGlossaryEntriesByAuthorIdParameters;
  get_glossary_entries_by_date: GetGlossaryEntriesByDateParameters;
  get_glossary_entries_by_term: GetGlossaryEntriesByTermParameters;
  get_glossary_categories: GetGlossaryCategoriesParameters;
  get_glossary_authors: GetGlossaryAuthorsParameters;
  search_glossary_entries: SearchGlossaryEntriesParameters;
  get_glossary_entries_to_approve: GetGlossaryEntriesToApproveParameters;
  update_glossary_entry: UpdateGlossaryEntryParameters;
  delete_glossary_entry: DeleteGlossaryEntryParameters;
  create_wiki_page: CreateWikiPageParameters;
  get_wiki_pages: GetWikiPagesParameters;
  get_wiki_subwikis: GetWikiSubwikisParameters;
  get_wiki_files: GetWikiFilesParameters;
  view_wiki: ViewWikiParameters;
  view_wiki_page: ViewWikiPageParameters;
  update_wiki_page: UpdateWikiPageParameters;
  delete_wiki_page: DeleteWikiPageParameters;
  get_choice_options: GetChoiceOptionsParameters;
  get_course_choices: GetCourseChoicesParameters;
  view_choice: ViewChoiceParameters;
  submit_choice_response: SubmitChoiceResponseParameters;
  delete_choice_responses: DeleteChoiceResponsesParameters;
  get_course_feedbacks: GetCourseFeedbacksParameters;
  view_feedback: ViewFeedbackParameters;
  get_feedback_access_information: GetFeedbackAccessInformationParameters;
  create_feedback_item: CreateFeedbackItemParameters;
  update_feedback_item: UpdateFeedbackItemParameters;
  get_feedback_items: GetFeedbackItemsParameters;
  get_feedback_page_items: GetFeedbackPageItemsParameters;
  get_feedback_analysis: GetFeedbackAnalysisParameters;
  get_feedback_finished_responses: GetFeedbackFinishedResponsesParameters;
  delete_feedback_item: DeleteFeedbackItemParameters;
  get_choice_results: GetChoiceResultsParameters;
  get_course_forums: GetCourseForumsParameters;
  view_forum: ViewForumParameters;
  get_forum_discussions: GetForumDiscussionsParameters;
  create_forum_discussion: CreateForumDiscussionParameters;
  get_forum_discussion_posts: GetForumDiscussionPostsParameters;
  create_forum_discussion_post: CreateForumDiscussionPostParameters;
  update_forum_discussion_post: UpdateForumDiscussionPostParameters;
  set_forum_discussion_pin: SetForumDiscussionPinParameters;
  set_forum_discussion_favourite: SetForumDiscussionFavouriteParameters;
  set_forum_discussion_subscription: SetForumDiscussionSubscriptionParameters;
  set_forum_discussion_lock: SetForumDiscussionLockParameters;
  delete_forum_discussion_post: DeleteForumDiscussionPostParameters;
  get_course_assignments: GetCourseAssignmentsParameters;
  update_assignment: UpdateAssignmentParameters;
  get_assignment_submission_status: GetAssignmentSubmissionStatusParameters;
  save_assignment_submission: SaveAssignmentSubmissionParameters;
  submit_assignment_for_grading: SubmitAssignmentForGradingParameters;
  save_assignment_grade: SaveAssignmentGradeParameters;
  get_assignment_grading_form: GetAssignmentGradingFormParameters;
  set_assignment_rubric: SetAssignmentRubricParameters;
  set_assignment_checklist: SetAssignmentChecklistParameters;
  set_assignment_marking_guide: SetAssignmentMarkingGuideParameters;
  grade_assignment_with_rubric: GradeAssignmentWithRubricParameters;
  grade_assignment_with_checklist: GradeAssignmentWithChecklistParameters;
  grade_assignment_with_marking_guide: GradeAssignmentWithMarkingGuideParameters;
  get_assignment_submissions: GetAssignmentSubmissionsParameters;
  get_assignment_grades: GetAssignmentGradesParameters;
  view_assignment: ViewAssignmentParameters;
  view_assignment_submission_status: ViewAssignmentSubmissionStatusParameters;
  view_assignment_grading_table: ViewAssignmentGradingTableParameters;
  delete_module: DeleteModuleParameters;
  upload_folder_file: UploadFolderFileParameters;
  get_folder_files: GetFolderFilesParameters;
  download_folder_file: DownloadFolderFileParameters;
  update_page: UpdatePageParameters;
  update_label: UpdateLabelParameters;
  update_url: UpdateUrlParameters;
  update_resource: UpdateResourceParameters;
  get_resource_files: GetResourceFilesParameters;
  download_resource_file: DownloadResourceFileParameters;
  delete_folder_file: DeleteFolderFileParameters;
  get_question_banks: GetQuestionBanksParameters;
  get_question_categories: GetQuestionCategoriesParameters;
  export_question_bank_blueprint: ExportQuestionBankBlueprintParameters;
  import_question_bank_blueprint: ImportQuestionBankBlueprintParameters;
  create_question_category: CreateQuestionCategoryParameters;
  update_question_category: UpdateQuestionCategoryParameters;
  delete_question_category: DeleteQuestionCategoryParameters;
  create_question: CreateQuestionParameters;
  get_questions: GetQuestionsParameters;
  update_question: UpdateQuestionParameters;
  move_question: MoveQuestionParameters;
  delete_question: DeleteQuestionParameters;
  get_quiz_questions: GetQuizQuestionsParameters;
  get_course_quizzes: GetCourseQuizzesParameters;
  start_quiz_attempt: StartQuizAttemptParameters;
  get_quiz_attempts: GetQuizAttemptsParameters;
  get_quiz_results_report: GetQuizResultsReportParameters;
  get_quiz_attempt_access_information: GetQuizAttemptAccessInformationParameters;
  get_quiz_attempt_data: GetQuizAttemptDataParameters;
  get_quiz_attempt_summary: GetQuizAttemptSummaryParameters;
  save_quiz_attempt: SaveQuizAttemptParameters;
  process_quiz_attempt: ProcessQuizAttemptParameters;
  get_quiz_attempt_review: GetQuizAttemptReviewParameters;
  get_quiz_access_information: GetQuizAccessInformationParameters;
  get_quiz_combined_review_options: GetQuizCombinedReviewOptionsParameters;
  view_quiz: ViewQuizParameters;
  view_quiz_attempt: ViewQuizAttemptParameters;
  view_quiz_attempt_summary: ViewQuizAttemptSummaryParameters;
  view_quiz_attempt_review: ViewQuizAttemptReviewParameters;
  get_quiz_user_best_grade: GetQuizUserBestGradeParameters;
  get_quiz_feedback_for_grade: GetQuizFeedbackForGradeParameters;
  get_quiz_required_question_types: GetQuizRequiredQuestionTypesParameters;
  add_question_to_quiz: AddQuestionToQuizParameters;
  add_random_questions_to_quiz: AddRandomQuestionsToQuizParameters;
  remove_question_from_quiz: RemoveQuestionFromQuizParameters;
  update_quiz_question_slot: UpdateQuizQuestionSlotParameters;
}

export interface MoodleOperationResponses {
  get_current_user: GetCurrentUserResponse;
  get_moodlia_status: GetMoodliaStatusResponse;
  get_sync_capabilities: GetSyncCapabilitiesResponse;
  list_plugins: ListPluginsResponse;
  get_plugin_details: GetPluginDetailsResponse;
  get_plugin_dependencies: GetPluginDependenciesResponse;
  check_plugin_updates: CheckPluginUpdatesResponse;
  set_plugin_enabled: SetPluginEnabledResponse;
  get_courses: GetCoursesResponse;
  get_course_categories: GetCourseCategoriesResponse;
  create_course_category: CreateCourseCategoryResponse;
  update_course_category: UpdateCourseCategoryResponse;
  delete_course_category: DeleteCourseCategoryResponse;
  get_course_contents: GetCourseContentsResponse;
  get_course_details: GetCourseDetailsResponse;
  get_module_details: GetModuleDetailsResponse;
  get_calendar_events: GetCalendarEventsResponse;
  create_calendar_event: CreateCalendarEventResponse;
  update_calendar_event: UpdateCalendarEventResponse;
  delete_calendar_event: DeleteCalendarEventResponse;
  get_enrolled_users: GetEnrolledUsersResponse;
  get_grade_items: GetGradeItemsResponse;
  set_course_grade_pass: SetCourseGradePassResponse;
  get_user_grades: GetUserGradesResponse;
  get_course_completion_criteria: GetCourseCompletionCriteriaResponse;
  set_course_completion_criteria: SetCourseCompletionCriteriaResponse;
  get_course_completion_status: GetCourseCompletionStatusResponse;
  get_activity_completion_statuses: GetActivityCompletionStatusesResponse;
  get_grade_categories: GetGradeCategoriesResponse;
  create_grade_category: CreateGradeCategoryResponse;
  update_grade_category: UpdateGradeCategoryResponse;
  delete_grade_category: DeleteGradeCategoryResponse;
  create_grade_item: CreateGradeItemResponse;
  update_grade_item: UpdateGradeItemResponse;
  delete_grade_item: DeleteGradeItemResponse;
  update_grade_value: UpdateGradeValueResponse;
  get_course_progress_report: GetCourseProgressReportResponse;
  set_activity_completion_status: SetActivityCompletionStatusResponse;
  get_user_details: GetUserDetailsResponse;
  create_user: CreateUserResponse;
  update_user: UpdateUserResponse;
  delete_user: DeleteUserResponse;
  create_cohort: CreateCohortResponse;
  update_cohort: UpdateCohortResponse;
  delete_cohort: DeleteCohortResponse;
  add_cohort_member: AddCohortMemberResponse;
  remove_cohort_member: RemoveCohortMemberResponse;
  assign_course_role: AssignCourseRoleResponse;
  unassign_course_role: UnassignCourseRoleResponse;
  enrol_user: EnrolUserResponse;
  unenrol_user: UnenrolUserResponse;
  get_groups: GetGroupsResponse;
  create_group: CreateGroupResponse;
  update_group: UpdateGroupResponse;
  delete_group: DeleteGroupResponse;
  get_groupings: GetGroupingsResponse;
  create_grouping: CreateGroupingResponse;
  update_grouping: UpdateGroupingResponse;
  delete_grouping: DeleteGroupingResponse;
  add_group_to_grouping: AddGroupToGroupingResponse;
  remove_group_from_grouping: RemoveGroupFromGroupingResponse;
  get_group_members: GetGroupMembersResponse;
  add_group_member: AddGroupMemberResponse;
  remove_group_member: RemoveGroupMemberResponse;
  create_course: CreateCourseResponse;
  export_course_blueprint: ExportCourseBlueprintResponse;
  create_course_from_blueprint: CreateCourseFromBlueprintResponse;
  apply_course_blueprint: ApplyCourseBlueprintResponse;
  copy_course_structure: CopyCourseStructureResponse;
  sync_course_enrolments: SyncCourseEnrolmentsResponse;
  set_course_publish_state: SetCoursePublishStateResponse;
  audit_course: AuditCourseResponse;
  backup_course: BackupCourseResponse;
  restore_course_backup: RestoreCourseBackupResponse;
  upload_course_backup: UploadCourseBackupResponse;
  get_course_backup_files: GetCourseBackupFilesResponse;
  delete_course_backup_file: DeleteCourseBackupFileResponse;
  audit_course_completion: AuditCourseCompletionResponse;
  repair_course_completion: RepairCourseCompletionResponse;
  update_course: UpdateCourseResponse;
  move_course: MoveCourseResponse;
  delete_course: DeleteCourseResponse;
  create_section: CreateSectionResponse;
  update_section: UpdateSectionResponse;
  delete_section: DeleteSectionResponse;
  create_module: CreateModuleResponse;
  update_module: UpdateModuleResponse;
  duplicate_module: DuplicateModuleResponse;
  move_module: MoveModuleResponse;
  get_course_books: GetCourseBooksResponse;
  get_book_chapters: GetBookChaptersResponse;
  view_book: ViewBookResponse;
  create_book_chapter: CreateBookChapterResponse;
  update_book_chapter: UpdateBookChapterResponse;
  move_book_chapter: MoveBookChapterResponse;
  delete_book_chapter: DeleteBookChapterResponse;
  get_lesson_access_information: GetLessonAccessInformationResponse;
  get_lesson_details: GetLessonDetailsResponse;
  get_course_lessons: GetCourseLessonsResponse;
  get_lesson_pages: GetLessonPagesResponse;
  create_lesson_page: CreateLessonPageResponse;
  update_lesson_page: UpdateLessonPageResponse;
  delete_lesson_page: DeleteLessonPageResponse;
  view_lesson: ViewLessonResponse;
  get_lesson_user_grade: GetLessonUserGradeResponse;
  get_lesson_user_timers: GetLessonUserTimersResponse;
  get_lesson_possible_jumps: GetLessonPossibleJumpsResponse;
  get_lesson_attempts_overview: GetLessonAttemptsOverviewResponse;
  get_data_fields: GetDataFieldsResponse;
  create_data_field: CreateDataFieldResponse;
  update_data_field: UpdateDataFieldResponse;
  delete_data_field: DeleteDataFieldResponse;
  get_data_entries: GetDataEntriesResponse;
  create_data_entry: CreateDataEntryResponse;
  update_data_entry: UpdateDataEntryResponse;
  delete_data_entry: DeleteDataEntryResponse;
  set_workshop_phase: SetWorkshopPhaseResponse;
  get_workshop_submissions: GetWorkshopSubmissionsResponse;
  get_workshop_user_plan: GetWorkshopUserPlanResponse;
  get_workshop_grades: GetWorkshopGradesResponse;
  get_workshop_grades_report: GetWorkshopGradesReportResponse;
  get_workshop_reviewer_assessments: GetWorkshopReviewerAssessmentsResponse;
  get_workshop_submission_assessments: GetWorkshopSubmissionAssessmentsResponse;
  allocate_workshop_submission: AllocateWorkshopSubmissionResponse;
  get_workshop_assessment_form_definition: GetWorkshopAssessmentFormDefinitionResponse;
  get_workshop_grading_form: GetWorkshopGradingFormResponse;
  set_workshop_grading_form: SetWorkshopGradingFormResponse;
  update_workshop_assessment: UpdateWorkshopAssessmentResponse;
  evaluate_workshop_assessment: EvaluateWorkshopAssessmentResponse;
  create_workshop_submission: CreateWorkshopSubmissionResponse;
  update_workshop_submission: UpdateWorkshopSubmissionResponse;
  delete_workshop_submission: DeleteWorkshopSubmissionResponse;
  create_glossary_entry: CreateGlossaryEntryResponse;
  get_course_glossaries: GetCourseGlossariesResponse;
  view_glossary: ViewGlossaryResponse;
  view_glossary_entry: ViewGlossaryEntryResponse;
  get_glossary_entry: GetGlossaryEntryResponse;
  get_glossary_entries_by_letter: GetGlossaryEntriesByLetterResponse;
  get_glossary_entries_by_category: GetGlossaryEntriesByCategoryResponse;
  get_glossary_entries_by_author: GetGlossaryEntriesByAuthorResponse;
  get_glossary_entries_by_author_id: GetGlossaryEntriesByAuthorIdResponse;
  get_glossary_entries_by_date: GetGlossaryEntriesByDateResponse;
  get_glossary_entries_by_term: GetGlossaryEntriesByTermResponse;
  get_glossary_categories: GetGlossaryCategoriesResponse;
  get_glossary_authors: GetGlossaryAuthorsResponse;
  search_glossary_entries: SearchGlossaryEntriesResponse;
  get_glossary_entries_to_approve: GetGlossaryEntriesToApproveResponse;
  update_glossary_entry: UpdateGlossaryEntryResponse;
  delete_glossary_entry: DeleteGlossaryEntryResponse;
  create_wiki_page: CreateWikiPageResponse;
  get_wiki_pages: GetWikiPagesResponse;
  get_wiki_subwikis: GetWikiSubwikisResponse;
  get_wiki_files: GetWikiFilesResponse;
  view_wiki: ViewWikiResponse;
  view_wiki_page: ViewWikiPageResponse;
  update_wiki_page: UpdateWikiPageResponse;
  delete_wiki_page: DeleteWikiPageResponse;
  get_choice_options: GetChoiceOptionsResponse;
  get_course_choices: GetCourseChoicesResponse;
  view_choice: ViewChoiceResponse;
  submit_choice_response: SubmitChoiceResponseResponse;
  delete_choice_responses: DeleteChoiceResponsesResponse;
  get_course_feedbacks: GetCourseFeedbacksResponse;
  view_feedback: ViewFeedbackResponse;
  get_feedback_access_information: GetFeedbackAccessInformationResponse;
  create_feedback_item: CreateFeedbackItemResponse;
  update_feedback_item: UpdateFeedbackItemResponse;
  get_feedback_items: GetFeedbackItemsResponse;
  get_feedback_page_items: GetFeedbackPageItemsResponse;
  get_feedback_analysis: GetFeedbackAnalysisResponse;
  get_feedback_finished_responses: GetFeedbackFinishedResponsesResponse;
  delete_feedback_item: DeleteFeedbackItemResponse;
  get_choice_results: GetChoiceResultsResponse;
  get_course_forums: GetCourseForumsResponse;
  view_forum: ViewForumResponse;
  get_forum_discussions: GetForumDiscussionsResponse;
  create_forum_discussion: CreateForumDiscussionResponse;
  get_forum_discussion_posts: GetForumDiscussionPostsResponse;
  create_forum_discussion_post: CreateForumDiscussionPostResponse;
  update_forum_discussion_post: UpdateForumDiscussionPostResponse;
  set_forum_discussion_pin: SetForumDiscussionPinResponse;
  set_forum_discussion_favourite: SetForumDiscussionFavouriteResponse;
  set_forum_discussion_subscription: SetForumDiscussionSubscriptionResponse;
  set_forum_discussion_lock: SetForumDiscussionLockResponse;
  delete_forum_discussion_post: DeleteForumDiscussionPostResponse;
  get_course_assignments: GetCourseAssignmentsResponse;
  update_assignment: UpdateAssignmentResponse;
  get_assignment_submission_status: GetAssignmentSubmissionStatusResponse;
  save_assignment_submission: SaveAssignmentSubmissionResponse;
  submit_assignment_for_grading: SubmitAssignmentForGradingResponse;
  save_assignment_grade: SaveAssignmentGradeResponse;
  get_assignment_grading_form: GetAssignmentGradingFormResponse;
  set_assignment_rubric: SetAssignmentRubricResponse;
  set_assignment_checklist: SetAssignmentChecklistResponse;
  set_assignment_marking_guide: SetAssignmentMarkingGuideResponse;
  grade_assignment_with_rubric: GradeAssignmentWithRubricResponse;
  grade_assignment_with_checklist: GradeAssignmentWithChecklistResponse;
  grade_assignment_with_marking_guide: GradeAssignmentWithMarkingGuideResponse;
  get_assignment_submissions: GetAssignmentSubmissionsResponse;
  get_assignment_grades: GetAssignmentGradesResponse;
  view_assignment: ViewAssignmentResponse;
  view_assignment_submission_status: ViewAssignmentSubmissionStatusResponse;
  view_assignment_grading_table: ViewAssignmentGradingTableResponse;
  delete_module: DeleteModuleResponse;
  upload_folder_file: UploadFolderFileResponse;
  get_folder_files: GetFolderFilesResponse;
  download_folder_file: DownloadFolderFileResponse;
  update_page: UpdatePageResponse;
  update_label: UpdateLabelResponse;
  update_url: UpdateUrlResponse;
  update_resource: UpdateResourceResponse;
  get_resource_files: GetResourceFilesResponse;
  download_resource_file: DownloadResourceFileResponse;
  delete_folder_file: DeleteFolderFileResponse;
  get_question_banks: GetQuestionBanksResponse;
  get_question_categories: GetQuestionCategoriesResponse;
  export_question_bank_blueprint: ExportQuestionBankBlueprintResponse;
  import_question_bank_blueprint: ImportQuestionBankBlueprintResponse;
  create_question_category: CreateQuestionCategoryResponse;
  update_question_category: UpdateQuestionCategoryResponse;
  delete_question_category: DeleteQuestionCategoryResponse;
  create_question: CreateQuestionResponse;
  get_questions: GetQuestionsResponse;
  update_question: UpdateQuestionResponse;
  move_question: MoveQuestionResponse;
  delete_question: DeleteQuestionResponse;
  get_quiz_questions: GetQuizQuestionsResponse;
  get_course_quizzes: GetCourseQuizzesResponse;
  start_quiz_attempt: StartQuizAttemptResponse;
  get_quiz_attempts: GetQuizAttemptsResponse;
  get_quiz_results_report: GetQuizResultsReportResponse;
  get_quiz_attempt_access_information: GetQuizAttemptAccessInformationResponse;
  get_quiz_attempt_data: GetQuizAttemptDataResponse;
  get_quiz_attempt_summary: GetQuizAttemptSummaryResponse;
  save_quiz_attempt: SaveQuizAttemptResponse;
  process_quiz_attempt: ProcessQuizAttemptResponse;
  get_quiz_attempt_review: GetQuizAttemptReviewResponse;
  get_quiz_access_information: GetQuizAccessInformationResponse;
  get_quiz_combined_review_options: GetQuizCombinedReviewOptionsResponse;
  view_quiz: ViewQuizResponse;
  view_quiz_attempt: ViewQuizAttemptResponse;
  view_quiz_attempt_summary: ViewQuizAttemptSummaryResponse;
  view_quiz_attempt_review: ViewQuizAttemptReviewResponse;
  get_quiz_user_best_grade: GetQuizUserBestGradeResponse;
  get_quiz_feedback_for_grade: GetQuizFeedbackForGradeResponse;
  get_quiz_required_question_types: GetQuizRequiredQuestionTypesResponse;
  add_question_to_quiz: AddQuestionToQuizResponse;
  add_random_questions_to_quiz: AddRandomQuestionsToQuizResponse;
  remove_question_from_quiz: RemoveQuestionFromQuizResponse;
  update_quiz_question_slot: UpdateQuizQuestionSlotResponse;
}

export interface TypedMoodleClient {
  operationNames(): MoodleOperationName[];
  call<TName extends MoodleOperationName>(
    operationName: TName,
    parameters: MoodleOperationParameters[TName]
  ): Promise<MoodleOperationResponses[TName]>;
  callOperation<TName extends MoodleOperationName>(
    operationName: TName,
    parameters: MoodleOperationParameters[TName]
  ): Promise<MoodleOperationResponses[TName]>;
  get_current_user(parameters?: GetCurrentUserParameters): Promise<GetCurrentUserResponse>;
  get_moodlia_status(parameters?: GetMoodliaStatusParameters): Promise<GetMoodliaStatusResponse>;
  get_sync_capabilities(parameters: GetSyncCapabilitiesParameters): Promise<GetSyncCapabilitiesResponse>;
  list_plugins(parameters: ListPluginsParameters): Promise<ListPluginsResponse>;
  get_plugin_details(parameters: GetPluginDetailsParameters): Promise<GetPluginDetailsResponse>;
  get_plugin_dependencies(parameters: GetPluginDependenciesParameters): Promise<GetPluginDependenciesResponse>;
  check_plugin_updates(parameters: CheckPluginUpdatesParameters): Promise<CheckPluginUpdatesResponse>;
  set_plugin_enabled(parameters: SetPluginEnabledParameters): Promise<SetPluginEnabledResponse>;
  get_courses(parameters: GetCoursesParameters): Promise<GetCoursesResponse>;
  get_course_categories(parameters: GetCourseCategoriesParameters): Promise<GetCourseCategoriesResponse>;
  create_course_category(parameters: CreateCourseCategoryParameters): Promise<CreateCourseCategoryResponse>;
  update_course_category(parameters: UpdateCourseCategoryParameters): Promise<UpdateCourseCategoryResponse>;
  delete_course_category(parameters: DeleteCourseCategoryParameters): Promise<DeleteCourseCategoryResponse>;
  get_course_contents(parameters: GetCourseContentsParameters): Promise<GetCourseContentsResponse>;
  get_course_details(parameters: GetCourseDetailsParameters): Promise<GetCourseDetailsResponse>;
  get_module_details(parameters: GetModuleDetailsParameters): Promise<GetModuleDetailsResponse>;
  get_calendar_events(parameters: GetCalendarEventsParameters): Promise<GetCalendarEventsResponse>;
  create_calendar_event(parameters: CreateCalendarEventParameters): Promise<CreateCalendarEventResponse>;
  update_calendar_event(parameters: UpdateCalendarEventParameters): Promise<UpdateCalendarEventResponse>;
  delete_calendar_event(parameters: DeleteCalendarEventParameters): Promise<DeleteCalendarEventResponse>;
  get_enrolled_users(parameters: GetEnrolledUsersParameters): Promise<GetEnrolledUsersResponse>;
  get_grade_items(parameters: GetGradeItemsParameters): Promise<GetGradeItemsResponse>;
  set_course_grade_pass(parameters: SetCourseGradePassParameters): Promise<SetCourseGradePassResponse>;
  get_user_grades(parameters: GetUserGradesParameters): Promise<GetUserGradesResponse>;
  get_course_completion_criteria(parameters: GetCourseCompletionCriteriaParameters): Promise<GetCourseCompletionCriteriaResponse>;
  set_course_completion_criteria(parameters: SetCourseCompletionCriteriaParameters): Promise<SetCourseCompletionCriteriaResponse>;
  get_course_completion_status(parameters: GetCourseCompletionStatusParameters): Promise<GetCourseCompletionStatusResponse>;
  get_activity_completion_statuses(parameters: GetActivityCompletionStatusesParameters): Promise<GetActivityCompletionStatusesResponse>;
  get_grade_categories(parameters: GetGradeCategoriesParameters): Promise<GetGradeCategoriesResponse>;
  create_grade_category(parameters: CreateGradeCategoryParameters): Promise<CreateGradeCategoryResponse>;
  update_grade_category(parameters: UpdateGradeCategoryParameters): Promise<UpdateGradeCategoryResponse>;
  delete_grade_category(parameters: DeleteGradeCategoryParameters): Promise<DeleteGradeCategoryResponse>;
  create_grade_item(parameters: CreateGradeItemParameters): Promise<CreateGradeItemResponse>;
  update_grade_item(parameters: UpdateGradeItemParameters): Promise<UpdateGradeItemResponse>;
  delete_grade_item(parameters: DeleteGradeItemParameters): Promise<DeleteGradeItemResponse>;
  update_grade_value(parameters: UpdateGradeValueParameters): Promise<UpdateGradeValueResponse>;
  get_course_progress_report(parameters: GetCourseProgressReportParameters): Promise<GetCourseProgressReportResponse>;
  set_activity_completion_status(parameters: SetActivityCompletionStatusParameters): Promise<SetActivityCompletionStatusResponse>;
  get_user_details(parameters: GetUserDetailsParameters): Promise<GetUserDetailsResponse>;
  create_user(parameters: CreateUserParameters): Promise<CreateUserResponse>;
  update_user(parameters: UpdateUserParameters): Promise<UpdateUserResponse>;
  delete_user(parameters: DeleteUserParameters): Promise<DeleteUserResponse>;
  create_cohort(parameters: CreateCohortParameters): Promise<CreateCohortResponse>;
  update_cohort(parameters: UpdateCohortParameters): Promise<UpdateCohortResponse>;
  delete_cohort(parameters: DeleteCohortParameters): Promise<DeleteCohortResponse>;
  add_cohort_member(parameters: AddCohortMemberParameters): Promise<AddCohortMemberResponse>;
  remove_cohort_member(parameters: RemoveCohortMemberParameters): Promise<RemoveCohortMemberResponse>;
  assign_course_role(parameters: AssignCourseRoleParameters): Promise<AssignCourseRoleResponse>;
  unassign_course_role(parameters: UnassignCourseRoleParameters): Promise<UnassignCourseRoleResponse>;
  enrol_user(parameters: EnrolUserParameters): Promise<EnrolUserResponse>;
  unenrol_user(parameters: UnenrolUserParameters): Promise<UnenrolUserResponse>;
  get_groups(parameters: GetGroupsParameters): Promise<GetGroupsResponse>;
  create_group(parameters: CreateGroupParameters): Promise<CreateGroupResponse>;
  update_group(parameters: UpdateGroupParameters): Promise<UpdateGroupResponse>;
  delete_group(parameters: DeleteGroupParameters): Promise<DeleteGroupResponse>;
  get_groupings(parameters: GetGroupingsParameters): Promise<GetGroupingsResponse>;
  create_grouping(parameters: CreateGroupingParameters): Promise<CreateGroupingResponse>;
  update_grouping(parameters: UpdateGroupingParameters): Promise<UpdateGroupingResponse>;
  delete_grouping(parameters: DeleteGroupingParameters): Promise<DeleteGroupingResponse>;
  add_group_to_grouping(parameters: AddGroupToGroupingParameters): Promise<AddGroupToGroupingResponse>;
  remove_group_from_grouping(parameters: RemoveGroupFromGroupingParameters): Promise<RemoveGroupFromGroupingResponse>;
  get_group_members(parameters: GetGroupMembersParameters): Promise<GetGroupMembersResponse>;
  add_group_member(parameters: AddGroupMemberParameters): Promise<AddGroupMemberResponse>;
  remove_group_member(parameters: RemoveGroupMemberParameters): Promise<RemoveGroupMemberResponse>;
  create_course(parameters: CreateCourseParameters): Promise<CreateCourseResponse>;
  export_course_blueprint(parameters: ExportCourseBlueprintParameters): Promise<ExportCourseBlueprintResponse>;
  create_course_from_blueprint(parameters: CreateCourseFromBlueprintParameters): Promise<CreateCourseFromBlueprintResponse>;
  apply_course_blueprint(parameters: ApplyCourseBlueprintParameters): Promise<ApplyCourseBlueprintResponse>;
  copy_course_structure(parameters: CopyCourseStructureParameters): Promise<CopyCourseStructureResponse>;
  sync_course_enrolments(parameters: SyncCourseEnrolmentsParameters): Promise<SyncCourseEnrolmentsResponse>;
  set_course_publish_state(parameters: SetCoursePublishStateParameters): Promise<SetCoursePublishStateResponse>;
  audit_course(parameters: AuditCourseParameters): Promise<AuditCourseResponse>;
  backup_course(parameters: BackupCourseParameters): Promise<BackupCourseResponse>;
  restore_course_backup(parameters: RestoreCourseBackupParameters): Promise<RestoreCourseBackupResponse>;
  upload_course_backup(parameters: UploadCourseBackupParameters): Promise<UploadCourseBackupResponse>;
  get_course_backup_files(parameters: GetCourseBackupFilesParameters): Promise<GetCourseBackupFilesResponse>;
  delete_course_backup_file(parameters: DeleteCourseBackupFileParameters): Promise<DeleteCourseBackupFileResponse>;
  audit_course_completion(parameters: AuditCourseCompletionParameters): Promise<AuditCourseCompletionResponse>;
  repair_course_completion(parameters: RepairCourseCompletionParameters): Promise<RepairCourseCompletionResponse>;
  update_course(parameters: UpdateCourseParameters): Promise<UpdateCourseResponse>;
  move_course(parameters: MoveCourseParameters): Promise<MoveCourseResponse>;
  delete_course(parameters: DeleteCourseParameters): Promise<DeleteCourseResponse>;
  create_section(parameters: CreateSectionParameters): Promise<CreateSectionResponse>;
  update_section(parameters: UpdateSectionParameters): Promise<UpdateSectionResponse>;
  delete_section(parameters: DeleteSectionParameters): Promise<DeleteSectionResponse>;
  create_module(parameters: CreateModuleParameters): Promise<CreateModuleResponse>;
  update_module(parameters: UpdateModuleParameters): Promise<UpdateModuleResponse>;
  duplicate_module(parameters: DuplicateModuleParameters): Promise<DuplicateModuleResponse>;
  move_module(parameters: MoveModuleParameters): Promise<MoveModuleResponse>;
  get_course_books(parameters: GetCourseBooksParameters): Promise<GetCourseBooksResponse>;
  get_book_chapters(parameters: GetBookChaptersParameters): Promise<GetBookChaptersResponse>;
  view_book(parameters: ViewBookParameters): Promise<ViewBookResponse>;
  create_book_chapter(parameters: CreateBookChapterParameters): Promise<CreateBookChapterResponse>;
  update_book_chapter(parameters: UpdateBookChapterParameters): Promise<UpdateBookChapterResponse>;
  move_book_chapter(parameters: MoveBookChapterParameters): Promise<MoveBookChapterResponse>;
  delete_book_chapter(parameters: DeleteBookChapterParameters): Promise<DeleteBookChapterResponse>;
  get_lesson_access_information(parameters: GetLessonAccessInformationParameters): Promise<GetLessonAccessInformationResponse>;
  get_lesson_details(parameters: GetLessonDetailsParameters): Promise<GetLessonDetailsResponse>;
  get_course_lessons(parameters: GetCourseLessonsParameters): Promise<GetCourseLessonsResponse>;
  get_lesson_pages(parameters: GetLessonPagesParameters): Promise<GetLessonPagesResponse>;
  create_lesson_page(parameters: CreateLessonPageParameters): Promise<CreateLessonPageResponse>;
  update_lesson_page(parameters: UpdateLessonPageParameters): Promise<UpdateLessonPageResponse>;
  delete_lesson_page(parameters: DeleteLessonPageParameters): Promise<DeleteLessonPageResponse>;
  view_lesson(parameters: ViewLessonParameters): Promise<ViewLessonResponse>;
  get_lesson_user_grade(parameters: GetLessonUserGradeParameters): Promise<GetLessonUserGradeResponse>;
  get_lesson_user_timers(parameters: GetLessonUserTimersParameters): Promise<GetLessonUserTimersResponse>;
  get_lesson_possible_jumps(parameters: GetLessonPossibleJumpsParameters): Promise<GetLessonPossibleJumpsResponse>;
  get_lesson_attempts_overview(parameters: GetLessonAttemptsOverviewParameters): Promise<GetLessonAttemptsOverviewResponse>;
  get_data_fields(parameters: GetDataFieldsParameters): Promise<GetDataFieldsResponse>;
  create_data_field(parameters: CreateDataFieldParameters): Promise<CreateDataFieldResponse>;
  update_data_field(parameters: UpdateDataFieldParameters): Promise<UpdateDataFieldResponse>;
  delete_data_field(parameters: DeleteDataFieldParameters): Promise<DeleteDataFieldResponse>;
  get_data_entries(parameters: GetDataEntriesParameters): Promise<GetDataEntriesResponse>;
  create_data_entry(parameters: CreateDataEntryParameters): Promise<CreateDataEntryResponse>;
  update_data_entry(parameters: UpdateDataEntryParameters): Promise<UpdateDataEntryResponse>;
  delete_data_entry(parameters: DeleteDataEntryParameters): Promise<DeleteDataEntryResponse>;
  set_workshop_phase(parameters: SetWorkshopPhaseParameters): Promise<SetWorkshopPhaseResponse>;
  get_workshop_submissions(parameters: GetWorkshopSubmissionsParameters): Promise<GetWorkshopSubmissionsResponse>;
  get_workshop_user_plan(parameters: GetWorkshopUserPlanParameters): Promise<GetWorkshopUserPlanResponse>;
  get_workshop_grades(parameters: GetWorkshopGradesParameters): Promise<GetWorkshopGradesResponse>;
  get_workshop_grades_report(parameters: GetWorkshopGradesReportParameters): Promise<GetWorkshopGradesReportResponse>;
  get_workshop_reviewer_assessments(parameters: GetWorkshopReviewerAssessmentsParameters): Promise<GetWorkshopReviewerAssessmentsResponse>;
  get_workshop_submission_assessments(parameters: GetWorkshopSubmissionAssessmentsParameters): Promise<GetWorkshopSubmissionAssessmentsResponse>;
  allocate_workshop_submission(parameters: AllocateWorkshopSubmissionParameters): Promise<AllocateWorkshopSubmissionResponse>;
  get_workshop_assessment_form_definition(parameters: GetWorkshopAssessmentFormDefinitionParameters): Promise<GetWorkshopAssessmentFormDefinitionResponse>;
  get_workshop_grading_form(parameters: GetWorkshopGradingFormParameters): Promise<GetWorkshopGradingFormResponse>;
  set_workshop_grading_form(parameters: SetWorkshopGradingFormParameters): Promise<SetWorkshopGradingFormResponse>;
  update_workshop_assessment(parameters: UpdateWorkshopAssessmentParameters): Promise<UpdateWorkshopAssessmentResponse>;
  evaluate_workshop_assessment(parameters: EvaluateWorkshopAssessmentParameters): Promise<EvaluateWorkshopAssessmentResponse>;
  create_workshop_submission(parameters: CreateWorkshopSubmissionParameters): Promise<CreateWorkshopSubmissionResponse>;
  update_workshop_submission(parameters: UpdateWorkshopSubmissionParameters): Promise<UpdateWorkshopSubmissionResponse>;
  delete_workshop_submission(parameters: DeleteWorkshopSubmissionParameters): Promise<DeleteWorkshopSubmissionResponse>;
  create_glossary_entry(parameters: CreateGlossaryEntryParameters): Promise<CreateGlossaryEntryResponse>;
  get_course_glossaries(parameters: GetCourseGlossariesParameters): Promise<GetCourseGlossariesResponse>;
  view_glossary(parameters: ViewGlossaryParameters): Promise<ViewGlossaryResponse>;
  view_glossary_entry(parameters: ViewGlossaryEntryParameters): Promise<ViewGlossaryEntryResponse>;
  get_glossary_entry(parameters: GetGlossaryEntryParameters): Promise<GetGlossaryEntryResponse>;
  get_glossary_entries_by_letter(parameters: GetGlossaryEntriesByLetterParameters): Promise<GetGlossaryEntriesByLetterResponse>;
  get_glossary_entries_by_category(parameters: GetGlossaryEntriesByCategoryParameters): Promise<GetGlossaryEntriesByCategoryResponse>;
  get_glossary_entries_by_author(parameters: GetGlossaryEntriesByAuthorParameters): Promise<GetGlossaryEntriesByAuthorResponse>;
  get_glossary_entries_by_author_id(parameters: GetGlossaryEntriesByAuthorIdParameters): Promise<GetGlossaryEntriesByAuthorIdResponse>;
  get_glossary_entries_by_date(parameters: GetGlossaryEntriesByDateParameters): Promise<GetGlossaryEntriesByDateResponse>;
  get_glossary_entries_by_term(parameters: GetGlossaryEntriesByTermParameters): Promise<GetGlossaryEntriesByTermResponse>;
  get_glossary_categories(parameters: GetGlossaryCategoriesParameters): Promise<GetGlossaryCategoriesResponse>;
  get_glossary_authors(parameters: GetGlossaryAuthorsParameters): Promise<GetGlossaryAuthorsResponse>;
  search_glossary_entries(parameters: SearchGlossaryEntriesParameters): Promise<SearchGlossaryEntriesResponse>;
  get_glossary_entries_to_approve(parameters: GetGlossaryEntriesToApproveParameters): Promise<GetGlossaryEntriesToApproveResponse>;
  update_glossary_entry(parameters: UpdateGlossaryEntryParameters): Promise<UpdateGlossaryEntryResponse>;
  delete_glossary_entry(parameters: DeleteGlossaryEntryParameters): Promise<DeleteGlossaryEntryResponse>;
  create_wiki_page(parameters: CreateWikiPageParameters): Promise<CreateWikiPageResponse>;
  get_wiki_pages(parameters: GetWikiPagesParameters): Promise<GetWikiPagesResponse>;
  get_wiki_subwikis(parameters: GetWikiSubwikisParameters): Promise<GetWikiSubwikisResponse>;
  get_wiki_files(parameters: GetWikiFilesParameters): Promise<GetWikiFilesResponse>;
  view_wiki(parameters: ViewWikiParameters): Promise<ViewWikiResponse>;
  view_wiki_page(parameters: ViewWikiPageParameters): Promise<ViewWikiPageResponse>;
  update_wiki_page(parameters: UpdateWikiPageParameters): Promise<UpdateWikiPageResponse>;
  delete_wiki_page(parameters: DeleteWikiPageParameters): Promise<DeleteWikiPageResponse>;
  get_choice_options(parameters: GetChoiceOptionsParameters): Promise<GetChoiceOptionsResponse>;
  get_course_choices(parameters: GetCourseChoicesParameters): Promise<GetCourseChoicesResponse>;
  view_choice(parameters: ViewChoiceParameters): Promise<ViewChoiceResponse>;
  submit_choice_response(parameters: SubmitChoiceResponseParameters): Promise<SubmitChoiceResponseResponse>;
  delete_choice_responses(parameters: DeleteChoiceResponsesParameters): Promise<DeleteChoiceResponsesResponse>;
  get_course_feedbacks(parameters: GetCourseFeedbacksParameters): Promise<GetCourseFeedbacksResponse>;
  view_feedback(parameters: ViewFeedbackParameters): Promise<ViewFeedbackResponse>;
  get_feedback_access_information(parameters: GetFeedbackAccessInformationParameters): Promise<GetFeedbackAccessInformationResponse>;
  create_feedback_item(parameters: CreateFeedbackItemParameters): Promise<CreateFeedbackItemResponse>;
  update_feedback_item(parameters: UpdateFeedbackItemParameters): Promise<UpdateFeedbackItemResponse>;
  get_feedback_items(parameters: GetFeedbackItemsParameters): Promise<GetFeedbackItemsResponse>;
  get_feedback_page_items(parameters: GetFeedbackPageItemsParameters): Promise<GetFeedbackPageItemsResponse>;
  get_feedback_analysis(parameters: GetFeedbackAnalysisParameters): Promise<GetFeedbackAnalysisResponse>;
  get_feedback_finished_responses(parameters: GetFeedbackFinishedResponsesParameters): Promise<GetFeedbackFinishedResponsesResponse>;
  delete_feedback_item(parameters: DeleteFeedbackItemParameters): Promise<DeleteFeedbackItemResponse>;
  get_choice_results(parameters: GetChoiceResultsParameters): Promise<GetChoiceResultsResponse>;
  get_course_forums(parameters: GetCourseForumsParameters): Promise<GetCourseForumsResponse>;
  view_forum(parameters: ViewForumParameters): Promise<ViewForumResponse>;
  get_forum_discussions(parameters: GetForumDiscussionsParameters): Promise<GetForumDiscussionsResponse>;
  create_forum_discussion(parameters: CreateForumDiscussionParameters): Promise<CreateForumDiscussionResponse>;
  get_forum_discussion_posts(parameters: GetForumDiscussionPostsParameters): Promise<GetForumDiscussionPostsResponse>;
  create_forum_discussion_post(parameters: CreateForumDiscussionPostParameters): Promise<CreateForumDiscussionPostResponse>;
  update_forum_discussion_post(parameters: UpdateForumDiscussionPostParameters): Promise<UpdateForumDiscussionPostResponse>;
  set_forum_discussion_pin(parameters: SetForumDiscussionPinParameters): Promise<SetForumDiscussionPinResponse>;
  set_forum_discussion_favourite(parameters: SetForumDiscussionFavouriteParameters): Promise<SetForumDiscussionFavouriteResponse>;
  set_forum_discussion_subscription(parameters: SetForumDiscussionSubscriptionParameters): Promise<SetForumDiscussionSubscriptionResponse>;
  set_forum_discussion_lock(parameters: SetForumDiscussionLockParameters): Promise<SetForumDiscussionLockResponse>;
  delete_forum_discussion_post(parameters: DeleteForumDiscussionPostParameters): Promise<DeleteForumDiscussionPostResponse>;
  get_course_assignments(parameters: GetCourseAssignmentsParameters): Promise<GetCourseAssignmentsResponse>;
  update_assignment(parameters: UpdateAssignmentParameters): Promise<UpdateAssignmentResponse>;
  get_assignment_submission_status(parameters: GetAssignmentSubmissionStatusParameters): Promise<GetAssignmentSubmissionStatusResponse>;
  save_assignment_submission(parameters: SaveAssignmentSubmissionParameters): Promise<SaveAssignmentSubmissionResponse>;
  submit_assignment_for_grading(parameters: SubmitAssignmentForGradingParameters): Promise<SubmitAssignmentForGradingResponse>;
  save_assignment_grade(parameters: SaveAssignmentGradeParameters): Promise<SaveAssignmentGradeResponse>;
  get_assignment_grading_form(parameters: GetAssignmentGradingFormParameters): Promise<GetAssignmentGradingFormResponse>;
  set_assignment_rubric(parameters: SetAssignmentRubricParameters): Promise<SetAssignmentRubricResponse>;
  set_assignment_checklist(parameters: SetAssignmentChecklistParameters): Promise<SetAssignmentChecklistResponse>;
  set_assignment_marking_guide(parameters: SetAssignmentMarkingGuideParameters): Promise<SetAssignmentMarkingGuideResponse>;
  grade_assignment_with_rubric(parameters: GradeAssignmentWithRubricParameters): Promise<GradeAssignmentWithRubricResponse>;
  grade_assignment_with_checklist(parameters: GradeAssignmentWithChecklistParameters): Promise<GradeAssignmentWithChecklistResponse>;
  grade_assignment_with_marking_guide(parameters: GradeAssignmentWithMarkingGuideParameters): Promise<GradeAssignmentWithMarkingGuideResponse>;
  get_assignment_submissions(parameters: GetAssignmentSubmissionsParameters): Promise<GetAssignmentSubmissionsResponse>;
  get_assignment_grades(parameters: GetAssignmentGradesParameters): Promise<GetAssignmentGradesResponse>;
  view_assignment(parameters: ViewAssignmentParameters): Promise<ViewAssignmentResponse>;
  view_assignment_submission_status(parameters: ViewAssignmentSubmissionStatusParameters): Promise<ViewAssignmentSubmissionStatusResponse>;
  view_assignment_grading_table(parameters: ViewAssignmentGradingTableParameters): Promise<ViewAssignmentGradingTableResponse>;
  delete_module(parameters: DeleteModuleParameters): Promise<DeleteModuleResponse>;
  upload_folder_file(parameters: UploadFolderFileParameters): Promise<UploadFolderFileResponse>;
  get_folder_files(parameters: GetFolderFilesParameters): Promise<GetFolderFilesResponse>;
  download_folder_file(parameters: DownloadFolderFileParameters): Promise<DownloadFolderFileResponse>;
  update_page(parameters: UpdatePageParameters): Promise<UpdatePageResponse>;
  update_label(parameters: UpdateLabelParameters): Promise<UpdateLabelResponse>;
  update_url(parameters: UpdateUrlParameters): Promise<UpdateUrlResponse>;
  update_resource(parameters: UpdateResourceParameters): Promise<UpdateResourceResponse>;
  get_resource_files(parameters: GetResourceFilesParameters): Promise<GetResourceFilesResponse>;
  download_resource_file(parameters: DownloadResourceFileParameters): Promise<DownloadResourceFileResponse>;
  delete_folder_file(parameters: DeleteFolderFileParameters): Promise<DeleteFolderFileResponse>;
  get_question_banks(parameters: GetQuestionBanksParameters): Promise<GetQuestionBanksResponse>;
  get_question_categories(parameters: GetQuestionCategoriesParameters): Promise<GetQuestionCategoriesResponse>;
  export_question_bank_blueprint(parameters: ExportQuestionBankBlueprintParameters): Promise<ExportQuestionBankBlueprintResponse>;
  import_question_bank_blueprint(parameters: ImportQuestionBankBlueprintParameters): Promise<ImportQuestionBankBlueprintResponse>;
  create_question_category(parameters: CreateQuestionCategoryParameters): Promise<CreateQuestionCategoryResponse>;
  update_question_category(parameters: UpdateQuestionCategoryParameters): Promise<UpdateQuestionCategoryResponse>;
  delete_question_category(parameters: DeleteQuestionCategoryParameters): Promise<DeleteQuestionCategoryResponse>;
  create_question(parameters: CreateQuestionParameters): Promise<CreateQuestionResponse>;
  get_questions(parameters: GetQuestionsParameters): Promise<GetQuestionsResponse>;
  update_question(parameters: UpdateQuestionParameters): Promise<UpdateQuestionResponse>;
  move_question(parameters: MoveQuestionParameters): Promise<MoveQuestionResponse>;
  delete_question(parameters: DeleteQuestionParameters): Promise<DeleteQuestionResponse>;
  get_quiz_questions(parameters: GetQuizQuestionsParameters): Promise<GetQuizQuestionsResponse>;
  get_course_quizzes(parameters: GetCourseQuizzesParameters): Promise<GetCourseQuizzesResponse>;
  start_quiz_attempt(parameters: StartQuizAttemptParameters): Promise<StartQuizAttemptResponse>;
  get_quiz_attempts(parameters: GetQuizAttemptsParameters): Promise<GetQuizAttemptsResponse>;
  get_quiz_results_report(parameters: GetQuizResultsReportParameters): Promise<GetQuizResultsReportResponse>;
  get_quiz_attempt_access_information(parameters: GetQuizAttemptAccessInformationParameters): Promise<GetQuizAttemptAccessInformationResponse>;
  get_quiz_attempt_data(parameters: GetQuizAttemptDataParameters): Promise<GetQuizAttemptDataResponse>;
  get_quiz_attempt_summary(parameters: GetQuizAttemptSummaryParameters): Promise<GetQuizAttemptSummaryResponse>;
  save_quiz_attempt(parameters: SaveQuizAttemptParameters): Promise<SaveQuizAttemptResponse>;
  process_quiz_attempt(parameters: ProcessQuizAttemptParameters): Promise<ProcessQuizAttemptResponse>;
  get_quiz_attempt_review(parameters: GetQuizAttemptReviewParameters): Promise<GetQuizAttemptReviewResponse>;
  get_quiz_access_information(parameters: GetQuizAccessInformationParameters): Promise<GetQuizAccessInformationResponse>;
  get_quiz_combined_review_options(parameters: GetQuizCombinedReviewOptionsParameters): Promise<GetQuizCombinedReviewOptionsResponse>;
  view_quiz(parameters: ViewQuizParameters): Promise<ViewQuizResponse>;
  view_quiz_attempt(parameters: ViewQuizAttemptParameters): Promise<ViewQuizAttemptResponse>;
  view_quiz_attempt_summary(parameters: ViewQuizAttemptSummaryParameters): Promise<ViewQuizAttemptSummaryResponse>;
  view_quiz_attempt_review(parameters: ViewQuizAttemptReviewParameters): Promise<ViewQuizAttemptReviewResponse>;
  get_quiz_user_best_grade(parameters: GetQuizUserBestGradeParameters): Promise<GetQuizUserBestGradeResponse>;
  get_quiz_feedback_for_grade(parameters: GetQuizFeedbackForGradeParameters): Promise<GetQuizFeedbackForGradeResponse>;
  get_quiz_required_question_types(parameters: GetQuizRequiredQuestionTypesParameters): Promise<GetQuizRequiredQuestionTypesResponse>;
  add_question_to_quiz(parameters: AddQuestionToQuizParameters): Promise<AddQuestionToQuizResponse>;
  add_random_questions_to_quiz(parameters: AddRandomQuestionsToQuizParameters): Promise<AddRandomQuestionsToQuizResponse>;
  remove_question_from_quiz(parameters: RemoveQuestionFromQuizParameters): Promise<RemoveQuestionFromQuizResponse>;
  update_quiz_question_slot(parameters: UpdateQuizQuestionSlotParameters): Promise<UpdateQuizQuestionSlotResponse>;
}

export type MoodleOperationParameter<TName extends MoodleOperationName> = MoodleOperationParameters[TName];
export type MoodleOperationResponse<TName extends MoodleOperationName> = MoodleOperationResponses[TName];
