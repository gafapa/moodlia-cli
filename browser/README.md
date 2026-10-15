# MoodlIA Browser Component

This optional component connects the MoodlIA CLI to the tools registered by the
MoodlIA Moodle plugin through Chromium's experimental WebMCP API and Playwright
1.64.1. The base CLI has no Playwright dependency. The component is bundled as
source and installed, with its dependencies and Chromium, only on request.

## Usage

```bash
moodlia browser install
moodlia browser open --url https://moodle.example/course/view.php?id=7
# Sign in manually in the visible browser.
moodlia browser tools
moodlia get-course-contents --course-id 7 --transport webmcp
moodlia update-section --course-id 7 --section-id 12 --summary-file summary.html --upload-file diagram.png --transport webmcp
moodlia browser call moodlia_open_page --arguments '{"destination":"course","course_id":7}'
moodlia browser download --url https://moodle.example/pluginfile.php/123/mod_resource/content/1/file.pdf --output file.pdf
moodlia browser close
moodlia browser uninstall
```

Use shell-appropriate JSON quoting. `browser call` accepts the exact live tool
name, including underscores. Normal plugin commands retain their kebab-case
names and validate inputs and results against the CLI contract. Core operations
and adaptive workflows currently use REST; requesting WebMCP for them fails
explicitly. There is no automatic transport fallback or retry of tool execution.

Enable WebMCP in the server's MoodlIA settings and grant the signed-in user the
existing `local/moodlia:useapi` capability plus each operation's native Moodle
permissions. Plugin 0.1.218 or newer is required for session draft uploads.
`browser tools` waits up to ten seconds for registration. The current course is
a hint; operations can target any course the user is allowed to access.

## Local Session

One visible Chromium instance uses a dedicated persistent profile, separate from
the user's daily browser. A detached Node process retains that instance between
CLI invocations. IPC uses a named pipe on Windows or a Unix socket, authenticated
with a random secret stored locally. Commands are serialized. No TCP control
port, arbitrary JavaScript evaluation, remote debugging endpoint, or AI service
is exposed. The selected Moodle origin is checked before execution; manual
navigation outside it blocks further calls until an explicit `browser open`.
HTTPS is required except for loopback test sites. Site content and tool output
remain untrusted; tool metadata does not authorize actions.

The default directory is `~/.moodlia/browser`. Set `MOODLIA_BROWSER_HOME` to use
an explicit private directory. Treat the profile and `session.json` as sensitive
local credentials. `status` never outputs cookies or the IPC secret. `close`
preserves login state. `uninstall` removes the component and preserves the
profile and Playwright's shared browser cache. Chromium is never installed into
the user's normal Chrome or Edge profile, and no browser security setting is
disabled.

Uploads use a temporary file input populated by Playwright and a same-origin
multipart request to the plugin. File contents are not encoded into tool JSON.
The server uses Moodle's upload repository, native antivirus, size limits, and
a fresh draft owned by the current user. The CLI passes that draft identifier
to the operation. The existing `--upload-file` and `--attachment-file` options
work with WebMCP; an explicit `--max-upload-bytes` is enforced locally too.

Downloads use Chromium's native streaming download, require a same-origin
`pluginfile.php` or `draftfile.php` URL, and reject authentication query fields.
They publish to the explicit output path without overwriting existing files and
return SHA-256. The default retained-file limit is 2 GiB, configurable with
`--max-download-bytes`; the check occurs after the browser transfer completes.

An interrupted write reports an unknown outcome (exit code 6 where detectable).
Inspect Moodle before repeating it. Closing the browser does not roll back a
server operation. This transport does not implement MCP protocol resources,
prompts, or server notifications; it exposes the plugin's operation tools.

## Validation

The unit coverage gates are 77% for the CLI and shared client modules and 90%
for all five browser runtime modules (`daemon`, `index`, `operations`, `protocol`,
and `server`). Run `npm run test:coverage` and `npm run test:coverage:browser`
from the CLI repository. Cases cover malformed IPC, authentication, UTF-8
boundaries, timeouts, queued cancellation, concurrent writes, dead locks,
manual browser close, failed startup, permissions on file transfers, and
temporary-file cleanup. Malformed browser commands are rejected locally before
loading the optional component.

`node tests/webmcp-browser.mjs` from the CLI repository installs the component
under ignored `node_modules/.browser-validation` and tests a visible Chromium
instance against a loopback fixture with fictional data. On Linux, run it under
`xvfb-run -a`. It invokes all 250 CLI operations with contract-shaped results,
checks session reuse across CLI processes, JSON argument types, same-tab
navigation, file bytes and draft propagation, download SHA-256/no-overwrite,
write non-retry, IPC authentication, and close/reopen.

The loopback fixture tests do not execute Moodle's PHP operations. Separate
real-site qualification passed on disposable Moodle 4.5.15/PostgreSQL 16.15
and Moodle 5.2.4/PostgreSQL 17.11, with 103 PHP tests and 11 browser/CLI checks
per profile. Both sites, their data, and the SSH tunnel were removed afterwards.
See `docs/webmcp-validation-2026-10-15.md` in the CLI repository for exact evidence
and remaining coverage limitations. The full supported-version CI matrix is a
separate qualification. WebMCP remains experimental.

References: [Playwright WebMCP](https://playwright.dev/docs/api/class-webmcp),
[Chrome WebMCP](https://developer.chrome.com/docs/ai/webmcp/imperative-api).
