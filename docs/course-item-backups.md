# Course item backups

The MoodlIA plugin can export a single activity or a single section as a native
Moodle `.mbz` backup and import it into another existing course. The CLI exposes
the three operations as direct commands:

| Command | What it does |
| --- | --- |
| `moodlia plugin backup-course-module` | Backs up one activity or resource. |
| `moodlia plugin backup-course-section` | Backs up one section and, unless `--include-activities false`, its activities. |
| `moodlia plugin restore-course-item-backup` | Imports an activity or section backup into an existing course without deleting anything. |

These commands need plugin build `2026111300` (release `0.1.223`) or later. With
an older plugin, Moodle answers that the function does not exist. Use release
`0.1.224` or later: in 0.1.223, a backup without `--filename` was stored as
`backup.mbz` and replaced the previous unnamed backup in the same area. Whole-course
backups keep using `backup-course` and `restore-course-backup`;
`restore-course-item-backup` rejects them.

## Export

```sh
moodlia plugin backup-course-module --course-id 42 --module-id 201 --filename essay
moodlia plugin backup-course-section --course-id 42 --section-number 2
moodlia plugin backup-course-section --course-id 42 --section-number 2 --include-activities false
```

Both commands accept `--filename` (`.mbz` is appended when missing),
`--include-users`, `--include-blocks`, `--include-filters`, `--include-comments`,
`--include-logs`, and `--include-grade-histories`. The result contains
`file_id`, `filename`, `url`, `filesize`, and the module or section it came from.

Without user data, Moodle stores the file in the caller's private backup area.
With `--include-users true`, it stores it in the activity or section backup area
of the course. `moodlia plugin get-course-backup-files --course-id 42` lists all
of them with their `backup_area`.

The CLI does not download the file itself. Use the returned `url` with the
client's `downloadFileToPath()` or any HTTP client that sends the web service
token.

## Import

```sh
moodlia plugin restore-course-item-backup --backup-file-id 987 --target-course-id 57
moodlia plugin restore-course-item-backup --backup-file-id 987 --target-course-id 57 --target-section-number 3
```

- An activity backup lands in the section with the same number it had in the
  source course, or section 0 when the target has no such section.
  `--target-section-number` moves it to the end of an existing section instead.
- A section backup is merged into the section with the same number, which Moodle
  creates when it is missing. `--target-section-number` is rejected for section
  backups.

To import a backup from another site, upload it first with
`moodlia upload-course-backup --filename item.mbz --upload-file ./item.mbz` and
pass the returned `file_id` as `--backup-file-id`.

The result reports `backup_type` (`activity` or `section`), `restored`,
`modules_json` (the restored modules and their sections), and `warnings_json`.

## Permissions

The caller needs `local/moodlia:useapi` and:

- `backup-course-module`: `moodle/backup:backupactivity` in the activity.
- `backup-course-section`: `moodle/backup:backupsection` in the course.
- `restore-course-item-backup`: read access to the backup file,
  `moodle/course:manageactivities` in the target course, and
  `moodle/restore:restoreactivity` or `moodle/restore:restoresection`.

Backups with user data also need `moodle/backup:userinfo` to create and
`moodle/restore:userinfo` to restore. The plugin documentation describes the
full permission model.
