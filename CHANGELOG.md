# Changelog

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
