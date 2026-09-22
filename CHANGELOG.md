# Changelog

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
