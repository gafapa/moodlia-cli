# WebMCP Qualification — 2026-10-15

## Result

The CLI now has 174 passing tests and 96.70% line coverage, 93.82% branch
coverage, and 90.29% function coverage. The initial WebMCP qualification had
111 tests and 77.70% line coverage; a subsequent local pass added 63 tests
without narrowing the measured source set. All five browser runtime modules
remain included: their isolated unit coverage is 92.73%. Required global gates
are 95% lines, 90% branches, and 85% functions, with 90% lines for the isolated
browser runtime. The daemon's real Playwright import and process entry
are additionally exercised by the native Chromium integration suite.
The expanded global suite and all three global gates passed locally on both
Node 22.13.0 and Node 24.18.0 on Windows, with identical aggregate percentages.

The plugin has 46 passing static/client/coverage-gate tests. Its actual PHP
operation suite and real WebMCP/CLI paths passed on both disposable profiles:

| Profile | PHP | PostgreSQL | PHPUnit | Full plugin suite | Bridge-specific suite | Real browser/CLI checks |
| --- | --- | --- | --- | --- | --- | --- |
| Moodle 4.5.15 | 8.3.15 | 16.15 | 9.6.34 | 103 tests, 1,509 assertions | 20 tests, 300 assertions | 11 passed |
| Moodle 5.2.4 | 8.3.15 | 17.11 | 11.5.55 | 103 tests, 1,471 assertions | 20 tests, 300 assertions | 11 passed |

The native PHP bridge reached 97.48% statement coverage (116/119) on Moodle 5.2.
Its coverage gate requires at least 95% and rejects missing, malformed, duplicate,
zero-statement, or inconsistent Clover data. The Moodle 4.5 tests passed, but its
additional coverage-report generation did not finish. A stale report from the
previous profile was excluded; no Moodle 4.5 percentage is claimed. CI now gives
report generation an explicit 1 GiB PHP memory budget. This CI change has not
been run on hosted runners during this session.

These were ARM64 Docker sites on the explicitly authorized Oracle host `s1`.
The CLI and browser tests ran on Windows with Node 24.18.0 and Playwright 1.64.1.
The functional qualification preceded the final patch-version increments to
CLI 0.5.1, browser component 0.1.1, and plugin 0.1.219. Later command validation
and daemon extraction were rechecked locally, including the native Chromium
fixture; they were not rerun against the removed Moodle sites.

## Expanded Validation

- Adaptive provider discovery and fallback, declared-operation checks, conservative
  Core completion evidence, explicit user selection, and write confirmation.
- Add-only MoodlIA enrolment plans: immutable files, digest validation, invalid
  roles/users/duplicates, provider availability, and already-enrolled skips at apply.
- REST error classification and credential redaction, HTTP/network failures,
  malformed draft-upload replies, synthetic byte transfers, protected file URLs,
  optional transport capabilities, and profile credential overrides.
- CLI file/JSON/format validation before network access. This later coverage pass
  uses local HTTP fixtures and injected fetch responses; it does not rerun the
  previously removed real Moodle sites.
- Authenticated named-pipe/Unix-socket IPC: invalid tokens, malformed JSON,
  UTF-8 boundaries, payload limits, truncated replies, timeouts, and uncertain
  outcomes. Untrusted response bytes are excluded from parsing diagnostics.
- Serialized concurrent execution and recovery after failures. A client that
  disconnects while its request is still queued cannot trigger a later write.
- Private session creation, duplicate-process protection, dead PID recovery,
  failed startup, manual browser close, and lock/signal-listener cleanup.
- Strict command grammar: unknown and duplicate options, extra arguments,
  missing values, non-object tool arguments, and invalid byte limits.
- Upload path/type/limit checks, actual multipart bytes, draft-id propagation,
  ownership and CSRF protection, and temporary input cleanup after failures.
- Native file downloads: same-origin file routes, authentication-query rejection,
  exact bytes and SHA-256, no overwrite, retained-size limits, and cleanup after
  failed or cancelled selection/transfer.
- Native Chromium registration of all 251 plugin tools and all 250 CLI operation
  adapters with contract-shaped fictional results. This adapter test is separate
  from the native Moodle PHP suite; it does not claim 250 real Moodle tool calls.
- Real Moodle login, operation discovery, section persistence, file upload and
  download, Page creation, object/boolean/integer-array parameters, same-tab
  navigation, tool re-registration, malformed HTTP requests, expired sessions,
  and student restrictions on writes, gradebooks and assignment grading.
- Plugin endpoint-origin checks, feature fallback, duplicate initialization,
  fetch recovery, cancellation, and back-forward cache registration lifecycle.

## Defects Found and Corrected

The previous native completion test only checked that criteria rows existed.
The new browser and PHP tests found that numeric-string criterion types were
compared strictly with integer constants. Rows were persisted, but the operation
response omitted the activity ids and grade criterion. Criterion types are now
normalized before serialization; regressions assert the immediate response as
well as stored rows and a later browser read.

Browser navigation previously tried to interpret a structured Moodle permission
error as a destination URL. It now preserves the Moodle error. IPC validation
also prevents uncaught input-serialization errors, preserves unknown outcomes
after interrupted/oversized replies, and drops disconnected queued work.

## Known Limits

Moodle 5.2's full plugin suite still reports five existing notices from legacy
forum/quiz paths and twelve PHPUnit metadata deprecations. The focused WebMCP
suite is clean on both profiles. Moodle 4.5's full suite is clean. The full
supported-version/PHP/database CI matrix was not executed in this session.

Coverage percentages describe executable statements/lines, not permission or
functional completeness. The real-site checks use synthetic administrator and
student accounts. No production course, student data, browser setting, AI
provider, or school credential was used for test content.

## Cleanup

The lab reused existing server images and introduced no image builds or public
ingress. Moodle was published only on loopback and reached through an SSH
tunnel. The web container was capped at 1.5 GiB/1.5 CPU and the database at
384 MiB/0.5 CPU; the two Moodle profiles ran sequentially.

At `2026-10-15T19:06:22Z`, verification found zero owned containers, zero owned
networks, no lab directory, and no listener on the lab port. Container removal
included anonymous volumes. Owned upload archives, scripts, logs, private test
credentials, the synthetic browser profile, and the SSH tunnel were removed.
All services present in the initial running-container inventory remained active.
Existing images and production volumes were preserved.

The checked cleanup script verifies both resource labels and the resolved root
before deletion. It never runs a global Docker prune.

## Reproduction

```bash
npm ci
npm run check
npm run test:coverage
npm run test:coverage:browser
npm run test:webmcp:browser
```

The native Moodle runner is `tools/qualification/real-webmcp.mjs`. It requires
`MOODLIA_QA_FIXTURE` pointing to a private, synthetic loopback fixture and writes
a sanitized result report next to it. The server lifecycle scripts under
`tools/qualification/` are an audit trail for this owned run and use a fixed
run id; review and update that id and ownership guards before a new remote run.
Server-hub helpers remain in the local operations workspace and are not shipped
with the public npm package.

See [the machine-readable result](evidence/webmcp-2026-10-15.json).
