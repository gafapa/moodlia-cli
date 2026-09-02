# MoodlIA CLI

Command-line and Node client for MoodlIA Moodle automation over REST.

This package contains the public Node CLI, the reusable REST client, generated TypeScript declarations, and the canonical command contract needed by external users. MCP integrations remain a separate server-side surface and are not bundled into the CLI package. This package does not include server-side Moodle plugin files, deployment scripts, tests, or browser automation.

The package is intentionally small: install the Moodle plugin on the server first, then use this package from developer machines, CI jobs, or automation workers.

## Version 0.2 Transport Scope

Version `0.2.2` keeps the package REST-only, preserves portable HTML section
summaries, and supports explicit `html` or `plain` summary formats for section
creation and updates. Version `0.2.0` removed the
exported `McpTransport` and `createMoodleMcpClient` APIs. MCP integrations
continue through the independent Moodle-hosted endpoint.

## Requirements

- Node.js 22 or newer.
- A Moodle site with the MoodlIA local plugin installed.
- A Moodle REST token enabled for the MoodlIA web service.

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

The package currently exposes 243 CLI commands generated from the shared operation contract:

- Course and category management: 22 commands.
- Calendar, enrolments, groups, and completion: 27 commands.
- Sections, modules, resources, and files: 15 commands.
- Assignments, forums, glossaries, wikis, and books: 57 commands.
- Choice, Database, Feedback, Lesson, and Workshop: 49 commands.
- Question banks and quiz workflows: 34 commands.
- Moodle plugin inventory and state: 5 commands.
- Other utility operations: 31 commands.

Run `moodlia --help` for the exact command list. The bundled `contract/operations.json` file contains parameter schemas, return schemas, command names, and enum values.

## Common Workflows

Upload a local file without placing its base64 content on the command line:

```bash
moodlia upload-folder-file --course-id 42 --module-id 105 --filename "notes.pdf" --upload-file "./notes.pdf"
moodlia upload-course-backup --filename "course.mbz" --upload-file "./course.mbz"
moodlia create-module --course-id 42 --section-number 1 --module-type resource --name "Notes" --upload-file "./notes.pdf"
```

`--upload-file` streams the local file as multipart data to Moodle's core draft
upload endpoint, then sends only the returned draft item id to the MoodlIA
operation. This avoids Base64 expansion and does not impose a client-side size
limit. Moodle, PHP, and the web server remain responsible for the effective
upload limit. `--upload-reference` remains available for backward compatibility.

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
moodlia update-book-chapter --course-id 42 --module-id 201 --chapter-id 301 --title "Updated chapter" --content "<p>Updated content.</p>"
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

Work with assignments, forums, and grades:

```bash
moodlia create-module --course-id 42 --section-number 1 --module-type assign --name "Essay" --options "{\"online_text\":true,\"file_submissions\":false,\"grade\":10}"
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
