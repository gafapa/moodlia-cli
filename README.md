# MoodlIA CLI

## Adaptive Moodle profiles and synchronization

MoodlIA 0.3 adds an adaptive path alongside every existing plugin command. A profile may configure separate Core and MoodlIA tokens. The CLI discovers both services and selects MoodlIA for an exact demonstrated capability, otherwise it uses an exact Core implementation when one is available.

Typed section, Page, Text and media, URL, Book, and assignment updates preserve destination identities. Native editor files are grouped by owner and file area, staged as one Moodle draft, and synchronized with portable `@@PLUGINFILE@@` references.

```json
{
  "schema_version": 1,
  "profiles": {
    "school_a": {
      "url": "https://a.example.edu",
      "backend": "auto",
      "credentials": {
        "core": { "token_env": "SCHOOL_A_CORE_TOKEN" },
        "moodlia": { "token_env": "SCHOOL_A_MOODLIA_TOKEN" }
      }
    }
  }
}
```

Inspect the evidence without exposing credentials:

```powershell
moodlia capabilities --profile school_a --course-id 42
```

Create a read-only cross-site plan, without a Moodle backup:

```powershell
moodlia course sync `
  --source-profile school_a --source-course-id 42 `
  --target-profile school_b --target-course-id 81 `
  --plan ".moodle-sync\plans\course-42.json"
```

Apply only the exact reviewed plan:

```powershell
moodlia course sync `
  --apply-plan ".moodle-sync\plans\course-42.json" `
  --plan-digest "sha256:..." --allow-write
```

The preview covers verified course fields, hidden target creation, MoodlIA-backed sections with editor files, groups and grouping membership, portable Page/Label/URL creation and identity-preserving updates, file resources and folders on creation, Books and multi-file chapters, portable standard Lesson pages without embedded files or positive cross-page jumps, new standalone and Quiz-private question banks for file-free supported question types, selected Quiz settings and separately journaled slots, selected assignment content and separate description/instruction file areas, new rubrics, binary checklists and marking guides, new Workshop grading forms, new Database field definitions, new Feedback item definitions with remapped backward dependencies, unlocked activity/course-grade completion criteria, root manual grade items, and safe module-grade-item settings. Quiz review/access settings, custom page breaks, Lesson passwords, Lesson activity links, custom grade categories, and nonportable manual weights require explicit loss acceptance. Asset bytes are streamed through a protected temporary cache, hashed during download, uploaded to an owner-scoped draft, and removed after each action. Existing unsupported authoring changes remain explicit blocking gaps by default. Existing direct commands retain their current behavior and payloads.

Durable jobs use the same SQLite state for inspection, history, cancellation, reconciliation-based resume, and live verification:

```powershell
moodlia course sync --job-id JOB_ID
moodlia course sync --history
moodlia course sync --cancel-job JOB_ID
moodlia course sync --resume-job JOB_ID --plan-digest "sha256:..." --allow-write
moodlia course sync --verify-plan PLAN_ID --verify-job-id JOB_ID
```

The Moodle-hosted MCP remains a single-site operation surface. Cross-site MCP orchestration is provided separately by `moodlia-sync-mcp`; it consumes only externally approved plan digests.

Command-line and Node client for MoodlIA Moodle automation over REST.

This package contains the public Node CLI, the reusable REST client, generated TypeScript declarations, and the canonical command contract needed by external users. MCP integrations remain a separate server-side surface and are not bundled into the CLI package. This package does not include server-side Moodle plugin files, deployment scripts, tests, or browser automation.

The package is intentionally small: install the Moodle plugin on the server first, then use this package from developer machines, CI jobs, or automation workers.

## Version 0.3 Adaptive Scope

Version `0.3.0` keeps every direct command REST-only and adds adaptive profiles, shared no-backup synchronization, contextual MoodlIA capability discovery, immutable plans, drift protection, persistent mappings and jobs, and verified recovery. The CLI does not embed an MCP server.

## Version 0.2 Transport Scope

Version `0.2.7` keeps the package REST-only and adds identity-preserving File
resource replacement through `update-resource --upload-file`. Version `0.2.6`
added UTF-8 `--intro-file` and `--activity-file` input for assignment authoring
content, plus UTF-8 `--content-file` input for content operations such as Book
chapters. Version `0.2.5` added streamed editor-file uploads to Book chapter creation and updates.
Version `0.2.4` added assignment name, description, activity-instruction, and
editor-file updates. Version `0.2.3` added native section summary file uploads
and UTF-8 `--summary-file` input.
Version `0.2.0` removed the
exported `McpTransport` and `createMoodleMcpClient` APIs. MCP integrations
continue through the independent Moodle-hosted endpoint.

## Requirements

- Node.js 22.13 or newer.
- Moodle 4.5 or later. Direct MoodlIA commands require the local plugin; adaptive operations can use exact Core services when it is absent.
- A limited Moodle Core or MoodlIA REST token for each configured site.

## Installation

```bash
npm install -g moodlia
```

For a project-local installation:

```bash
npm install moodlia
```

## Configuration

Set the Moodle URL and REST token in your shell:

```bash
export MOODLE_BASE_URL="https://your-moodle.example"
export MOODLE_REST_TOKEN="your-token"
```

On Windows PowerShell:

```powershell
$env:MOODLE_BASE_URL = "https://your-moodle.example"
$env:MOODLE_REST_TOKEN = "your-token"
```

The CLI also reads a local `.env` file from the current working directory when present:

```text
MOODLE_BASE_URL=https://your-moodle.example
MOODLE_REST_TOKEN=your-token
```

Configuration values:

- `MOODLE_BASE_URL`: Moodle site base URL, for example `https://moodle.example.edu`.
- `MOODLE_REST_TOKEN`: Moodle web service token authorised for MoodlIA.
- `CLI_OUTPUT_FORMAT`: optional default output format. The default is `json`.

`MOODLE_BASE_URL` must use HTTPS for remote hosts and may include a Moodle installation subdirectory such as `https://example.edu/learning`. Loopback HTTP is allowed for local development. REST requests do not follow redirects so that bearer tokens cannot be forwarded to an unexpected destination.

## Usage

```bash
moodlia get-current-user
moodlia get-courses --limit 10
moodlia create-course-category --name "Generated Courses" --visible true
moodlia create-module --course-id 42 --section-number 1 --module-type page --name "Reading" --options "{\"content\":\"<p>Hello</p>\"}"
```

All commands return JSON by default. Errors are written to stderr as JSON with `error`, `code`, `message`, and `details`.

Show all commands:

```bash
moodlia --help
```

Show command options:

```bash
moodlia create-module --help
```

Object parameters are passed as JSON strings:

```bash
moodlia update-course --course-id 42 --summary "<p>Updated summary</p>" --summary-format html
moodlia create-question --category-id 12 --context-id 34 --question-type multichoice --name "Capital city" --question-text "<p>Choose one.</p>" --options "{\"answers\":[{\"text\":\"Madrid\",\"fraction\":1},{\"text\":\"Paris\",\"fraction\":0}]}"
```

## Capabilities

The package currently exposes 247 CLI commands generated from the shared operation contract:

- Course and category management: 22 commands.
- Calendar, enrolments, groups, and completion: 27 commands.
- Sections, modules, resources, and files: 15 commands.
- Assignments, forums, glossaries, wikis, and books: 58 commands.
- Choice, Database, Feedback, Lesson, and Workshop: 49 commands.
- Question banks and quiz workflows: 34 commands.
- Moodle plugin inventory and state: 5 commands.
- Other utility operations: 34 commands.

The three additional synchronization support reads expose contextual capability evidence, portable Workshop grading forms, and their associated authoring metadata. Use the generated help as the authoritative count and schema.

Run `moodlia --help` for the exact command list. The bundled `contract/operations.json` file contains parameter schemas, return schemas, command names, and enum values.

## Common Workflows

Upload a local file without placing its base64 content on the command line:

```bash
moodlia upload-folder-file --course-id 42 --module-id 105 --filename "notes.pdf" --upload-file "./notes.pdf"
moodlia upload-course-backup --filename "course.mbz" --upload-file "./course.mbz"
moodlia create-module --course-id 42 --section-number 1 --module-type resource --name "Notes" --upload-file "./notes.pdf"
moodlia update-resource --course-id 42 --module-id 106 --upload-file "./replacement.pdf"
moodlia update-section --course-id 42 --section-id 7 --summary-file "./section.html" --summary-format html --upload-file "./hero.jpg"
moodlia update-assignment --course-id 42 --module-id 201 --intro '<p><img src="@@PLUGINFILE@@/brief.jpg" alt="Assignment brief"></p>' --intro-format html --upload-file "./brief.jpg" --file-area intro
moodlia update-assignment --course-id 42 --module-id 201 --intro-file "./assignment description.html" --intro-format html --activity-file "./student instructions.html" --activity-format html
moodlia create-book-chapter --course-id 42 --module-id 202 --title "Illustrated chapter" --content '<p><img src="@@PLUGINFILE@@/chapter-hero.jpg" alt="Chapter hero"></p>' --upload-file "./chapter-hero.jpg"
```

`--upload-file` streams the local file as multipart data to Moodle's core draft
upload endpoint, then sends only the returned draft item id to the MoodlIA
operation. This avoids Base64 expansion and does not impose a client-side size
limit. Moodle, PHP, and the web server remain responsible for the effective
upload limit. `--upload-reference` remains available for backward compatibility.

`update-resource` replaces the stored file through Moodle's module update API
while retaining the existing course-module and resource instance identifiers.
It can also update `--name`, `--intro`, and `--intro-format` in the same call.

`update-section --summary-file <path>` reads the section summary as UTF-8 and
can be combined with one `--upload-file`. Use `@@PLUGINFILE@@/filename.ext` in
the HTML to reference the attached file. `--summary-file` is mutually exclusive
with `--summary`; the local path is never sent to Moodle.

`update-assignment` changes only the supplied authoring fields: `--name`,
`--intro`, or `--activity`. The two HTML fields accept independent `html` or
`plain` formats. Use `--intro-file <path>` or `--activity-file <path>` to read
the corresponding field from a UTF-8 file. Each local file option is mutually
exclusive with its inline equivalent, and local paths are never sent to
Moodle. Combine the command with one `--upload-file` and select
`--file-area intro` or `--file-area activity`; reference the file from the
matching HTML field as `@@PLUGINFILE@@/filename.ext`.

`create-book-chapter` and `update-book-chapter` also accept one
`--upload-file`. Use `--content-file <path>` to read chapter HTML from a UTF-8
file instead of passing it inline with `--content`; the two options are mutually
exclusive. The server stores an uploaded asset in Moodle's native
`mod_book/chapter` file area under the chapter id, so
`@@PLUGINFILE@@/filename.ext` references remain valid after native course
backup and restore.

Smoke-check authentication:

```bash
moodlia get-current-user
moodlia get-courses --limit 10
moodlia get-course-categories
```

Create a category, course, section, and page:

```bash
moodlia create-course-category --name "Generated Courses" --visible true
moodlia create-course-category --name "Generated Courses" --visible true --reuse-existing true
moodlia create-course --fullname "MoodlIA Demo Course" --shortname "moodlia-demo-001" --category-id 12 --visible true --enable-completion true
moodlia move-course --course-id 42 --category-id 12
moodlia create-section --course-id 42 --name "Unit 1" --summary "<p>Introduction.</p>" --summary-format html --visible true
moodlia update-section --course-id 42 --section-id 7 --summary "<details><summary>More information</summary><p>Open this section for details.</p></details>" --summary-format html --format json
moodlia create-module --course-id 42 --section-number 1 --module-type page --name "Reading" --options "{\"content\":\"<p>Read this first.</p>\"}"
```

Create and manage Book chapters:

```bash
moodlia create-module --course-id 42 --section-number 1 --module-type book --name "Course guide" --options "{\"intro\":\"<p>Guide intro.</p>\",\"numbering\":\"numbers\"}"
moodlia create-book-chapter --course-id 42 --module-id 201 --title "Chapter 1" --content "<p>Opening content.</p>"
moodlia create-book-chapter --course-id 42 --module-id 201 --title "Chapter 1.1" --content "<p>Nested content.</p>" --after-chapter-id 301 --subchapter true
moodlia create-book-chapter --course-id 42 --module-id 201 --title "Illustrated chapter" --content '<p><img src="@@PLUGINFILE@@/chapter-hero.jpg" alt="Chapter hero"></p>' --upload-file "./chapter-hero.jpg"
moodlia update-book-chapter --course-id 42 --module-id 201 --chapter-id 301 --title "Updated chapter" --content "<p>Updated content.</p>"
moodlia update-book-chapter --course-id 42 --module-id 201 --chapter-id 301 --content '<p><img src="@@PLUGINFILE@@/new-image.png" alt="New image"></p>' --upload-file "./new-image.png"
moodlia move-book-chapter --course-id 42 --module-id 201 --chapter-id 302 --after-chapter-id 0
moodlia get-book-chapters --course-id 42 --module-id 201 --include-content true
moodlia delete-book-chapter --course-id 42 --module-id 201 --chapter-id 302
```

Create a question bank category, question, and quiz slot:

```bash
moodlia create-module --course-id 42 --section-number 0 --module-type qbank --name "MoodlIA Question Bank"
moodlia create-module --course-id 42 --section-number 1 --module-type quiz --name "Unit 1 quiz" --options "{\"grade\":10,\"sumgrades\":10}"
moodlia create-question-category --course-id 42 --name "Generated Questions" --bank-scope course_shared --question-bank-module-id 101
moodlia create-question --category-id 5 --context-id 77 --question-type truefalse --name "True or false" --question-text "<p>Moodle is a learning platform.</p>" --options "{\"correct_answer\":true}"
moodlia add-question-to-quiz --quiz-module-id 102 --question-id 999
moodlia update-quiz-question-slot --quiz-module-id 102 --slot 1 --max-mark 1
```

For `course_shared`, `create-question-category` can omit
`--question-bank-module-id`; MoodlIA then reuses an existing shared bank or
creates `MoodlIA Question Bank` automatically. Shared banks are Moodle `qbank`
modules in section 0 and are included in native course backups.

Work with assignments, forums, and grades:

```bash
moodlia create-module --course-id 42 --section-number 1 --module-type assign --name "Essay" --options "{\"online_text\":true,\"file_submissions\":false,\"grade\":10}"
moodlia update-assignment --course-id 42 --module-id 201 --intro "<p>Write a structured essay.</p>" --intro-format html
moodlia save-assignment-submission --course-id 42 --module-id 201 --online-text "<p>My submission.</p>"
moodlia submit-assignment-for-grading --course-id 42 --module-id 201
moodlia set-assignment-rubric --course-id 42 --module-id 201 --name "Writing rubric" --criteria "{\"criteria\":[{\"description\":\"Content quality\",\"levels\":[{\"definition\":\"Missing\",\"score\":0},{\"definition\":\"Strong\",\"score\":10}]}]}"
moodlia get-assignment-grading-form --course-id 42 --module-id 201
moodlia grade-assignment-with-rubric --course-id 42 --module-id 201 --user-id 7 --criteria "{\"criteria\":[{\"criterion_id\":101,\"level_id\":1002,\"remark\":\"Strong content.\"}]}" --feedback-comment "<p>Rubric feedback.</p>"
moodlia set-assignment-checklist --course-id 42 --module-id 201 --name "Submission checklist" --items "{\"items\":[{\"description\":\"Includes objective\",\"score\":5},{\"description\":\"Includes evidence\",\"score\":5}]}"
moodlia grade-assignment-with-checklist --course-id 42 --module-id 201 --user-id 7 --items "{\"items\":[{\"criterion_id\":101,\"checked\":true},{\"criterion_id\":102,\"checked\":false}]}"
moodlia set-assignment-marking-guide --course-id 42 --module-id 201 --name "Teacher guide" --criteria "{\"criteria\":[{\"shortname\":\"Accuracy\",\"description\":\"Accuracy of the response\",\"max_score\":40}]}"
moodlia grade-assignment-with-marking-guide --course-id 42 --module-id 201 --user-id 7 --criteria "{\"criteria\":[{\"criterion_id\":101,\"score\":35,\"remark\":\"Mostly accurate.\"}]}"
moodlia create-forum-discussion --course-id 42 --module-id 301 --name "Week 1 discussion" --message "<p>What did you learn?</p>"
moodlia get-grade-items --course-id 42
moodlia update-grade-item --course-id 42 --item-id 801 --grade-pass 8 --category-id 50 --weight 1
moodlia set-course-grade-pass --course-id 42 --grade-pass-percent 80
moodlia set-course-completion-criteria --course-id 42 --required-module-ids '[201,202,203]' --require-all-activities true --required-course-grade-percent 80 --criteria-aggregation all
moodlia get-course-completion-criteria --course-id 42
```

The completion command requires course-module ids (not activity instance ids) and activity completion tracking to be enabled for each selected activity. It safely refuses to replace criteria after Moodle has created completion records. `get-grade-items` includes grade ranges, pass grades, categories, weights, visibility, locks, owning activities, and total contribution so the result can be checked before publishing a course.

MoodlIA uses Moodle core advanced grading APIs. Checklist commands are stored as binary Moodle rubrics when the Moodle site does not have a native checklist advanced grading form installed.

Advanced automation can skip response validation when a Moodle instance returns a useful payload that is temporarily ahead of the published contract:

```bash
moodlia get-question-categories --course-id 42 --bank-scope quiz_private --quiz-module-id 102 --raw
```

On Windows PowerShell, prefer `moodlia.ps1` for complex JSON arguments when using a project-local install:

```powershell
$options = '{ "content": "<p>Hello from PowerShell.</p>" }'
.\node_modules\.bin\moodlia.ps1 create-module --course-id 42 --section-number 1 --module-type page --name "Reading" --options $options
```

Project repository: https://github.com/gafapa/moodlia-cli

## Programmatic Use

```js
import { createMoodleClient } from 'moodlia';
import contract from 'moodlia/contract' with { type: 'json' };

const client = createMoodleClient({
  baseUrl: process.env.MOODLE_BASE_URL,
  token: process.env.MOODLE_REST_TOKEN,
  contract
});

const currentUser = await client.get_current_user();
const courses = await client.get_courses({ limit: 10 });
```

All canonical operations are translated to `local_moodlia_*` Moodle REST functions. File uploads use Moodle's multipart draft endpoint before the operation receives a `draft_item_id`.

When JSON module imports are not available, load the contract from a local path:

```js
import { createMoodleClient, loadContractFromFile } from 'moodlia';

const contract = loadContractFromFile('./node_modules/moodlia/contract/operations.json');
```

## Published Files

The npm package includes only:

- `cli/moodlia.mjs`: executable command-line entry point.
- `client/moodle-rest-client.mjs`: reusable REST client.
- `client/moodle-rest-client.d.ts`: TypeScript declarations for the REST client.
- `client/generated/operation-types.d.ts`: generated request and response types per operation.
- `contract/operations.json`: publishable command contract.
- `README.md` and `LICENSE`.

It intentionally excludes server plugin source, local deployment automation, test fixtures, reports, local env files, and generated temporary output.

## Security

- Keep Moodle tokens in environment variables or local uncommitted env files.
- Do not pass tokens as command arguments because shells and CI systems may record them.
- Use a token with only the Moodle capabilities needed for the workflows you automate.
- Treat JSON command output as Moodle data; it may include course, activity, grade, or participant information depending on the operation and token permissions.

## Development

The CLI, REST client, declarations, and tests are maintained in this repository. Keep the bundled operation contract aligned with the Moodle plugin before publishing a release.

## Quality Checks

```bash
npm run check
npm run pack:check
```

The test suite covers contract parameter validation, response validation, REST transport behavior, URL safety, and command-line validation.
