# Changelog

## 0.4.0 - unreleased

Breaking changes:

- Course synchronization moved to the new `moodlia-sync` package.
  `moodlia course sync`, `sync-course`, `moodlia sync ...`, and the
  `./sync` export are removed; the commands exit with
  `unsupported_operation` (exit code 3) and point to `moodlia-sync`.
  `moodlia capabilities` reports provider discovery only. The MoodlIA and
  adaptive adapters keep discovery; `createAdaptiveSiteAdapter` accepts the
  subclasses to instantiate.
- Requires `moodle-core-cli` 0.4, which has no native dependency.
- `MoodleClientError` is now Core's class, so errors from both packages are
  the same type. Its JSON output redacts sensitive detail keys.
- REST responses are limited to 64 MiB by default (`--max-response-bytes` or
  `MOODLE_MAX_RESPONSE_BYTES`); an oversized response raises
  `payload_too_large` instead of exhausting memory. Uploads remain unlimited
  unless configured; downloads stream with a 2 GiB default.

Additions and fixes:

- Every text parameter accepts `--<field>-file`: `content`, `summary`,
  `intro`, `activity`, `message`, `definition`, `description`, and
  `question_text` (40 operations instead of 15). A UTF-8 BOM is stripped.
- Operations that take files as a draft item id (forum discussions and
  replies, glossary entries, Lesson and wiki pages; plugin 0.1.215) accept
  `--upload-file`, and forum and glossary also `--attachment-file`.
  `create-question` and `update-question` accept `--background-image-file` for
  drag-and-drop questions.
- The bundled contract follows plugin 0.1.215: group visibility,
  participation, and enrolment keys; `markdown` and `moodle` text formats; and
  Book and Lesson `content_format` names.
- `moodlia plugin audit-course` now runs the contract operation instead of
  the adaptive audit workflow.
- Moodle error messages and debug information no longer echo the token.
- Upload tokens travel in the request body instead of the URL.
- File downloads accept browser `pluginfile.php` URLs, such as those returned
  by `backup_course`, and fetch them through the webservice endpoint.
- `moodlia/core/*` re-exports the Core modules that `moodlia-sync` uses.
- A test generated from the contract exercises all 250 operations, and CI
  checks the bundled contract against the pinned plugin release.

Migration: replace `moodlia course sync ...` and `moodlia sync ...` with the
`moodlia-sync` commands listed in its README.

## 0.3.7 - 2026-09-22

- Normalize authenticated `/webservice/pluginfile.php/` editor URLs without
  leaving a source-site prefix before `@@PLUGINFILE@@`.
- Canonicalize `@@PLUGINFILE@@` references to rawurlencoded path segments and
  recognize both encoded and decoded rendered asset URLs, so content written to
  a destination reads back identically during verification.
- Require Core 0.3.6 so module creation results that echo `grouping_id: 0`
  verify by `module_id` and record their binding mapping; live MoodlIA-to-MoodlIA
  qualification on Moodle 4.5 to 5.3 discovered both defects.

## 0.3.6 - 2026-09-22

- Require Core 0.3.5 so synchronization gaps retain the blocked source module type.

## 0.3.5 - 2026-09-22

- Preserve the destination course context when adding synchronized groups to MoodlIA groupings.

## 0.3.4 - 2026-09-22

- Require the Core 0.3.4 Moodle 5.3 course-summary normalization discovered by live MoodlIA-to-Core qualification.

## 0.3.3 - 2026-09-22

- Normalize Moodle's rendered course-summary overflow wrapper back to portable authoring HTML.
- Require the Core 0.3.3 section-identity verification fix discovered by live Core-to-MoodlIA qualification.

## 0.3.2 - 2026-09-22

- Keep the durable SQLite state store open until asynchronous apply, resume, and verification operations settle.
- Require the Core 0.3.2 lifecycle and resume-reconciliation fixes and add a regression guard for adaptive synchronization.
- Map grouped resume, verify, and cancel identifiers without leaving conflicting lifecycle options behind.

## 0.3.1 - 2026-09-22

- Add explicit in-process `moodlia core` and `moodlia plugin` namespaces.
- Add grouped synchronization lifecycle aliases for status, resume, verification, history, and cancellation.
- Add adaptive completion audit and repair: use the typed MoodlIA operation when authorized and return a precise Core capability gap otherwise.
- Adopt the shared machine-readable CLI outcome codes.
- Expand CI qualification to Node.js 22.13 and 24 on Windows and Linux.

## 0.3.0 - 2026-09-21

- Add adaptive Core/MoodlIA profiles and field-aware provider selection.
- Add no-backup cross-site course synchronization through the shared Core engine.
- Add adaptive course audit, progress reporting, and add-only manual-enrolment workflows.
