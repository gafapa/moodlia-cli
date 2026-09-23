# Adaptive Moodle Clients and Cross-Site Synchronization

> **Superseded in part (2026-09-24).** The synchronization engine no longer lives in
> `moodle-core-cli`, and the `moodlia-sync-mcp` coordinator is retired. Both moved
> to the standalone `moodlia-sync` CLI (`moodle-core-cli` ← `moodlia` ←
> `moodlia-sync`). Sections below that place the engine in Core or describe the
> MCP coordinator are historical; see `moodlia-sync/docs/ADR-001-SYNC-FOUNDATION.md`.

Status: release candidate. P0-P8 are implemented for the verified preview scope, P3 includes adaptive/Core audit, progress, completion and add-only enrolment workflows plus grouped lifecycle and explicit provider namespaces, and P9 is closed: the 100-scenario logical matrix, the supported-branch plugin matrix, and the disposable end-to-end source/target qualification (Moodle 4.5.12 to 5.3beta, all four provider pairings, run `release037-core036-final`) have passed with public packages. P10 publication of `moodlia@0.3.7`, `moodle-core-cli@0.3.6`, and plugin `0.1.213` closes the gate.

Date: 2026-09-22.

Canonical planning document: `moodlia-cli/docs/UNIFICATION-AND-SYNC-PLAN.md`.

### Implementation checkpoint

The shared Core-owned engine, adaptive MoodlIA client, persistent synchronization state, immutable planning, recovery, and separate MCP coordinator are implemented. The current verified preview includes course metadata and hidden course creation; sections; groups and groupings; portable Page, Label, URL, resource, folder, Book, assignment, Workshop, Database, Feedback, Quiz, Lesson, question-bank, completion, and selected gradebook configuration; owner-scoped assets; and internal-link rewriting. Core and adaptive CLIs also expose evidence-based course audit, progress reporting, and digest-bound add-only manual-enrolment workflows. Unsupported or lossy fields remain plan gaps and require an explicit registered degradation where one exists.

The disposable end-to-end qualification between Moodle 4.5.12 and 5.3beta has now been executed for Core-to-Core, Core-to-MoodlIA, MoodlIA-to-Core, and MoodlIA-to-MoodlIA with public packages, and its evidence and documented gaps are recorded in `moodle-core-cli/docs/CROSS-VERSION-QUALIFICATION.md`. It exposed and fixed real defects (SQLite lifecycle, grouped resume routing, section identity, Moodle 5.3 summary wrappers, plugin file URLs and service permissions, `@@PLUGINFILE@@` canonicalization, and result identifier selection). Remaining work is lower-priority provider-specific workflow promotion where Moodle exposes a verified API and any separately authorized plugin deployment. Clean registry installation, the 100-scenario logical matrix, the supported-branch plugin matrix, English documentation, and skill propagation have been verified. No production course synchronization is implied by this checkpoint.

## 1. Outcome and scope

Make `moodlia` the universal, adaptive Moodle CLI and Node client. It must work with supported Moodle Core services, use the MoodlIA plugin when available and useful, and select an implementation for each requested capability. The user should not have to select a different product because a site lacks the plugin.

Retain `moodle-core-cli` as the independent Core-only distribution and reusable foundation. Add shared workflows and a synchronization engine. Expose the same adaptive synchronization engine through a separate MoodlIA MCP coordinator, while keeping the existing Moodle-hosted MCP endpoint responsible for its own site.

Synchronize supported course content between separate Moodle installations without generating, transferring, or restoring a Moodle `.mbz` backup. Support different versions and every adapter pairing: Core to Core, Core to MoodlIA, MoodlIA to Core, and MoodlIA to MoodlIA. Support depends on the individual entity and field, not merely the pairing.

Implementation includes the two Node packages, necessary plugin extensions, a new MCP coordinator package, contracts and types, documentation and skills, integration fixtures, and release automation. Existing public commands and result formats require a deliberate migration policy.

This plan does not authorize a production content synchronization, a production plugin deployment, or removal of existing repositories. It defines the implementation and validation work to perform next.

## 2. Verified baseline and corrections to earlier proposals

The following baseline was read from the local repositories. It describes source state, not a fresh npm registry or production deployment audit.

| Component | Source baseline | Current responsibility |
| --- | --- | --- |
| `moodle-core-cli` | `0.2.0`, commit `a8e3f8e`, 788 contracted operations | Static Core operation catalog, REST client, CLI, generated types, version checks and client policies |
| `moodlia-cli` / npm `moodlia` | `0.2.7`, commit `a9a42fc`, 245 contracted operations | REST client and CLI for `local_moodlia_*`; native editor uploads and UTF-8 content-file options |
| `moodlia-moodle-plugin` | `0.1.208`, commit `01d81dc` (qualified release: `0.1.213`, commit `117992c`) | Advanced PHP operations, REST adapters and Moodle-hosted MCP |
| `moodlia-skills` | Existing independent repository | Agent instructions for operation and portable content |
| Version scope | 4.5, 5.0, 5.1, 5.2, preliminary 5.3 beta | Each capability needs branch-specific evidence |

### Findings that change the design

1. **Matching command names do not establish equivalence.** For example, the Core `get_grade_items` operation wraps the user grade report, whereas MoodlIA exposes gradebook configuration information. Their inputs and outputs cannot simply be swapped. The earlier count of 118 MoodlIA-only names is not a count of 118 exclusive capabilities.
2. **Discovery is new work.** The Core client currently detects version but does not retain a live function inventory in its normalized `get_site_info` result. Keep that result compatible; introduce a separate discovery API.
3. **MoodlIA status reports declarations.** `get_moodlia_status` reads plugin service definitions. Its `functions_json` is not evidence that the current token may invoke every function, nor that the user can use it in a particular course.
4. **Discovery can be unavailable.** A valid MoodlIA token may not expose `core_webservice_get_site_info`. Failure of that discovery function must not make the existing MoodlIA CLI unusable. Support separate Core and MoodlIA credentials in a site profile when services require them.
5. **Quick creation is not general authoring.** Moodle 4.5's `core_courseformat_new_module` requires `FEATURE_QUICKCREATE` and a course format supporting components. It does not accept arbitrary activity content or editor-file configuration.
6. **Course editor actions have contextual behavior.** `core_courseformat_update_course` delegates to a course-format action implementation. Audit and allowlist individual actions such as section creation and module movement; do not infer arbitrary summary editing from a generic action endpoint.
7. **Backups and copies are distinct from synchronization.** Course duplication/import APIs may use Moodle backup machinery internally. They may remain separate same-site features, but the cross-site synchronization executor must not use them.
8. **Existing blueprints are incomplete and create-oriented.** The current exporter omits section zero, mainly emits module shells, and handles only selected subelements. The importer creates entities and collects some failures as warnings. Neither constitutes an incremental, file-complete synchronization engine.
9. **Existing enrolment synchronization needs stricter semantics.** The plugin processes individual enrolments and can return warnings; its presence does not prove that a requested atomic or exact workflow is supported. Foreign user IDs and role IDs are not portable.
10. **Operation effects need an audit.** `backup_submit_copy_form` is marked `read` in the current Core contract and upstream declaration despite its submission/copy behavior. Current dangerous-operation handling is narrow and destructive handling includes name matching. Shared plans require explicit, reviewed effect metadata, including upload side effects and actions selected by parameters.
11. **A plan hash does not detect subsequent remote edits.** Hashing protects the identity of the approved plan. Re-reading remote state and comparing preconditions is a separate operation.
12. **MCP confirmation is not authorization.** A model-generated `confirm: true` is not evidence of human approval. The host or coordinator policy must enforce authority to apply a specific plan.

### Source anchors

- [Core client](../../moodle-core-cli/client/moodle-rest-client.mjs), [Core CLI](../../moodle-core-cli/cli/moodle-core.mjs), and [Core coverage](../../moodle-core-cli/docs/API-COVERAGE.md).
- [MoodlIA CLI](../cli/moodlia.mjs), [MoodlIA declarations](../client/moodle-rest-client.d.ts), and [MoodlIA contract](../contract/operations.json).
- [Plugin discovery](../../moodlia-moodle-plugin/classes/operation/get_moodlia_status.php), [course workflows](../../moodlia-moodle-plugin/classes/operation/course_workflow_tools.php), [enrolment synchronization](../../moodlia-moodle-plugin/classes/operation/sync_course_enrolments.php), and [module creation](../../moodlia-moodle-plugin/classes/operation/create_module.php).
- Moodle source snapshots inspected: `.moodle-core-sources/moodle-405/course/format/classes/external/new_module.php`, `update_course.php`, `stateactions.php`, and `backup/externallib.php`. These are local audit inputs, not distributable dependencies.

## 3. Product and package boundaries

### Dependency direction

```text
moodle-core-cli
  Core REST client + contracts + CoreAdapter
  neutral capability interfaces + workflows + sync engine
  executable: moodle-core
        ^
        | depends on
  moodlia
    MoodliaAdapter + adaptive resolver + compatibility facade
    executable: moodlia
        ^
        | depends on
  moodlia-sync-mcp (new, proposed package name)
    MCP tools + persistent worker + coordinator authorization

moodlia-moodle-plugin
  PHP operations + per-site REST/MCP + optional sync helpers
  no Node dependency and no destination-site credentials
```

Keep the existing repositories. Place common JavaScript infrastructure in `moodle-core-cli` behind documented subpath exports. Do not introduce a circular dependency or copy the engine into both packages. An independent engine package can be extracted later if size or consumers justify it; it is not needed to start.

| Package | Planned public surfaces | Provider policy |
| --- | --- | --- |
| `moodle-core-cli` | Existing root API plus `/capabilities`, `/workflows`, `/sync`, `/profiles` | Ships and registers Core only; contains no MCP server |
| `moodlia` | Existing root API plus `/adaptive`, `/sync`, `/profiles` | Registers Core and MoodlIA, resolves per operation |
| `moodlia-sync-mcp` | Coordinator executable and MCP server | Uses `moodlia` as its adaptive library; does not spawn CLI subprocesses |
| Moodle plugin | Existing contract plus versioned, justified extensions | Operates only on its own Moodle installation |

Preserve the existing license boundaries: Core source remains MIT and MoodlIA source retains its current GPL license and notices. Shared Core code must be developed from its own implementation and neutral interfaces rather than copied from GPL plugin/client code and relabeled. Review dependency licenses and preserve all applicable notices before packaging the new coordinator.

## 4. Requirement traceability

| ID | Requirement | Delivery phases |
| --- | --- | --- |
| R01 | Keep Moodle 4.5 as the minimum; verify 5.0-5.3 independently | P0, P2, P9 |
| R02 | Core-only installation and operation remain supported | P1-P3, P9 |
| R03 | `moodlia` chooses the best authorized implementation automatically | P2-P3 |
| R04 | Improve Core usability with aliases and composite workflows | P3 |
| R05 | Synchronize course content without `.mbz` | P4-P7 |
| R06 | Support different versions and all four provider pairings | P2, P5-P7, P9 |
| R07 | Transfer files and rewrite course-local references correctly | P6-P7 |
| R08 | Incremental updates preserve mapped target identities | P4-P7 |
| R09 | Handle conflicts, partial failures, interruption and resume | P4-P5, P8 |
| R10 | Both CLIs expose the same engine with their provider sets | P3-P5 |
| R11 | MCP exposes adaptive synchronization using the same engine | P8 |
| R12 | Tokens are isolated by site, principal and service | P1-P2, P6, P8 |
| R13 | Plugin extensions retain REST/MCP contract parity | P6-P7 |
| R14 | Preserve existing command/library contracts or migrate explicitly | P1-P3, P10 |
| R15 | Document operation-level limitations and partial fidelity | All phases |
| R16 | Update project docs, published skills and product documentation | P10 |
| R17 | No production synchronization or plugin deployment in tests | P9-P10 |
| R18 | Deliver a concrete plan before implementation | This document |

## 5. Contracts, types and provider interfaces

Maintain three distinct contract layers:

1. **Transport contracts:** the existing Core static catalog and plugin-owned MoodlIA canonical contract. Their semantics remain authoritative for actual requests.
2. **Semantic capability registry:** neutral names, normalized schemas, implementation mappings, fidelity and evidence. It is not inferred by intersecting command names.
3. **Workflow and sync contracts:** multi-step input/output schemas, read/write effects, required capabilities, recovery rules, plans and job records.

Suggested capability descriptor:

```json
{
  "capability": "section.summary.update",
  "schema_version": 1,
  "effects": ["content.write", "draft.write"],
  "implementations": [
    {
      "provider": "moodlia",
      "operation": "update_section",
      "fidelity": "exact",
      "requirements": ["operation_available", "course_write_access"],
      "supported_fields": ["summary", "summary_format", "assets"]
    }
  ]
}
```

This is a proposed descriptor, not a claim that every listed precondition is currently discoverable. Validate the requested fields against the selected implementation. A metadata-only implementation cannot satisfy a request containing assets.

Separate `implementation_kind` (`direct` or `workflow`) from `fidelity` (`exact`, `partial`, `unsupported`, `unknown`). A composed implementation can be exact; a direct operation can be partial. Track additional properties such as stability (`verified`, `experimental`, `deprecated`) and contextual restrictions.

Adapter responsibilities:

- `discoverSite()` and `resolveCapability(request, context)`.
- `readEntity`, `listEntities` with pagination/completeness metadata, and `readAsset`.
- `planMutation` returning validated effects and preconditions.
- `applyMutation` returning actual IDs, warnings and any partial outcome.
- `verifyMutation` returning observed normalized state.
- Optional provider-specific conditional-write/idempotency support, explicitly advertised.

Use an internal typed result envelope containing `data`, `provider`, `fidelity`, `warnings`, `verification`, and `correlation_id`. Existing public commands retain their legacy payloads through compatibility serializers. New workflow commands use explicit envelopes. Generate TypeScript declarations, JSON schemas, help and MCP schemas from the relevant contracts; do not maintain divergent hand-written definitions.

## 6. Adaptive capability resolution

### Discovery

1. Resolve the selected site profile and credentials without logging secrets.
2. Validate the Moodle base URL, including installation subdirectories.
3. Where authorized, call `core_webservice_get_site_info` and retain the returned function inventory separately from its legacy normalized result.
4. Where configured or discoverable, call MoodlIA status through a known contracted function. Record its declarations and plugin version as declarations, not permission grants.
5. Intersect known contracts with version support, service functions, profile policy and required fields. Record course/activity permissions separately; lack of a permission-introspection endpoint produces `unknown`, not `allowed`.
6. If discovery is denied but a legacy operation can still be called, preserve explicit operation/provider access. Broad sync plans requiring unknown writes remain blocked or require a verified capability probe appropriate to that context. Never probe by creating an entity.

Distinguish `unsupported_by_version`, `function_not_exposed`, `permission_denied`, `missing_provider`, `discovery_unavailable`, `authentication_failed`, `network_error`, and `partial_field_support`. Authentication/network/business errors must not be treated as evidence that the plugin is absent.

The live function list is intersected with the audited static registry. Discovery does not enable arbitrary functions, arbitrary form classes, or third-party plugin calls.

### Selection

Resolve each operation or atomic entity change independently:

1. Filter by the caller's policies, available credentials, version, context and complete requested field support.
2. Prefer exact, verified MoodlIA implementations when they provide the richer semantic operation.
3. Use exact, verified Core implementations or Core workflows when MoodlIA is unavailable, lacks a field, or cannot fulfill the request.
4. Consider an experimental implementation only under explicit policy.
5. Consider a partial transformation only when its specific losses were accepted in the plan.
6. Otherwise return a capability gap with a remedy and no writes.

`--backend auto|core|moodlia` applies to new adaptive commands. `--explain-backend` reports the selected operation(s), required functions, fidelity, evidence and limitations without running the requested mutation.

Provider selection is bound into the approved plan. Different planned steps may use different providers on the same site. Do not change the provider for an already-started mutation after a timeout or permission failure. Reconcile ambiguous outcomes before another attempt.

Cache discovery briefly by normalized site identity, credential identity, contract version and context where applicable. Use an opaque credential reference or keyed identifier, not a stored raw token. Support explicit refresh and invalidate when permissions, plugin version, service or credentials change.

## 7. Profiles and execution policies

Introduce a versioned profile schema shared by the CLIs and coordinator:

```json
{
  "schema_version": 1,
  "profiles": {
    "school_a": {
      "url": "https://a.example.edu/learning",
      "backend": "auto",
      "credentials": {
        "core": {"token_env": "SCHOOL_A_CORE_TOKEN"},
        "moodlia": {"token_env": "SCHOOL_A_MOODLIA_TOKEN"}
      }
    },
    "school_b": {
      "url": "https://b.example.edu",
      "backend": "core",
      "credentials": {
        "core": {"token_env": "SCHOOL_B_CORE_TOKEN"}
      }
    }
  }
}
```

A single credential may serve both providers when its configured Moodle external service contains both sets of functions. Separate credentials on one site must resolve to the same principal for automatic combination; otherwise require explicit per-provider identity policy and show the distinction in plans and audit records.

Keep `MOODLE_BASE_URL`, `MOODLE_TOKEN`, and `MOODLE_REST_TOKEN` compatible with their existing packages. For new adaptive commands, document precedence: explicit profile/config path, selected default profile, then legacy environment mapping. Never silently choose between conflicting tokens. Do not accept destination tokens as workflow parameters.

Share policy enforcement for direct operations, child workflow steps, uploads and MCP execution. A denied child operation cannot be bypassed through an allowed parent workflow. Audit explicit effects rather than relying on upstream `read` metadata or operation-name matching alone. Distinguish harmless content reads from view/tracking operations that change state; extraction must not mark activities viewed or completed.

New workflows plan by default. Applying requires `--allow-write`; destructive actions additionally require `--yes`, and pruning requires its own opt-in. Existing MoodlIA write commands retain behavior during the additive migration; changing those defaults requires a documented breaking release. The stricter sync policy applies from its first release.

## 8. Core workflow backlog

Names below are planned friendly entry points, not promises of universal availability. Each maps to audited functions and a documented capability scope.

| Work item | Implementation approach | Conditions and acceptance |
| --- | --- | --- |
| Current user, course/module details, groups/groupings | Normalize existing Core reads; alias only when semantics match | Golden request/result tests for legacy and new interfaces |
| Course role assignment, calendar conveniences, forum replies | Friendly single-item wrappers over existing Core functions | Preserve context and batching errors; no duplicate backend functionality |
| User grades and progress report | Aggregate users, grade reports and completion reads | Paginate completely; unknown/hidden data stays unknown; do not claim gradebook configuration coverage |
| Course audit | Local rule engine over structure, visibility, content and available settings | Report evidence and inaccessible fields; never treat filtered content as absent |
| Completion audit/repair | Read available settings; plan only individually verified repair operations | Missing config APIs block repair rather than fabricate success |
| Manual enrolment synchronization | Desired-state diff with identity and role mapping | Add-only first; removals only when manual-enrolment ownership and current membership are proven |
| Publication state | Map supported draft/published states to visibility | Archive metadata is not a native Core equivalent; advanced states require provider support |
| Section and module movement/visibility | Versioned adapters over audited course-format actions | Supported formats/actions only; no arbitrary action strings |
| Section creation/deletion | Verified course-format actions where available | Handle section zero, ordering, format restrictions and destructive semantics |
| Module creation | Implement supported quick-create cases only | Never label an unconfigured shell as a fully authored activity |
| Structure copying | Neutral extraction and per-entity replay | Report shells, omitted fields and unavailable creation paths; cross-site route never uses backups |
| Neutral blueprint export/apply | Use the sync model and planner | Export includes completeness and loss metadata; apply respects mapped identities |
| Assignment rubrics and guides | Source audit plus actual Core service experiments | Verify create/update/activate semantics separately from grading-panel functions; unsupported until proven |
| Same-site native course duplication | Existing Core copy functions under explicit write policy | Separate command and documented backup implementation; excluded from no-backup sync |

Do not promote deprecated editor functions as the default simply because they exist in every contract snapshot. Generic dynamic forms are an explicitly reviewed experimental option only if a named form supports the required operation and is usable via authorized REST on the tested branch.

## 9. Synchronization model and entity coverage

Use a versioned `CourseSyncModel`, separate from the existing plugin blueprint format. Supply an explicit converter for supported legacy blueprint fields; report omitted data and do not relabel a v1 blueprint as a complete snapshot.

The model includes:

- Site provenance, Moodle/plugin versions, course identity, extraction times and schema version.
- Entities with persistent opaque sync keys, kind, parent, ordering, normalized fields and typed references.
- Per-field provenance, readability/completeness and write support; distinguish `absent`, `unknown`, `redacted`, explicit `null` and explicit empty values.
- Asset manifests containing logical paths, sizes, MIME information, hashes and owning field/file area.
- Exclusions, unsupported entities, losses and source/target capability evidence.

Numeric IDs are scoped to a site and entity namespace. Module IDs, activity instance IDs, contexts, sections, chapters, question versions and grade items are different namespaces. None is copied as a foreign key into the destination.

### Planned entity coverage

| Entity or field group | Core adapter plan | MoodlIA adapter/plugin plan |
| --- | --- | --- |
| Course metadata | Read/update fields actually exposed; keep category/shortname mappings explicit | Normalize the richer contract where compatible |
| Sections including section zero | Read; create/move/visibility only through verified actions; authoring gaps reported | Read/write summaries, order and supported files; preserve section zero |
| Pages, labels, URLs | Read through corresponding functions where available; do not assume content writes | Add any missing typed read/update contracts after auditing existing operations |
| File resources and folders | Download readable files; draft upload alone does not imply publication support | Identity-preserving file replacement, folder changes and asset verification |
| Groups/groupings | Structure and description within API limits | Normalize same semantic shape; membership remains separately selected |
| Books and chapters | Mark native chapter authoring unsupported unless a verified API exists | Ordered chapters, HTML, subchapters, visibility and native chapter files |
| Assignment authoring | Read supported settings; no generic intro update assumption | Name, description, instructions and files while preserving grading/submission settings |
| Rubrics/checklists/guides | Only proven definition operations; grading results excluded | Definition transfer with criterion/level ID remapping; protect already-graded activities |
| Questions/banks/quizzes | Partial reads/actions only where verified | Full supported question definitions, categories, bank scope, quiz slots and version references |
| Lesson, Database, Feedback | Separate definition access from learner interactions | Add missing authoring readers/updaters required for exact round trips |
| Workshop | Separate form/phase/definition capabilities from submissions | Form definitions and compatible settings; phase/allocation require separate scope |
| Completion/gradebook configuration | No promise beyond exposed configuration APIs | Map IDs and preserve existing completion/grade locks; refuse unsafe changes |
| External/custom activities | Diagnostic by default | Explicit versioned extension adapters only; secrets never inferred or copied |

Build the matrix by direction (`read`, `create`, `update`, `delete`, `verify`) and field set. Reading a Page from a Core source does not establish that a Core destination can recreate it. Creating with MoodlIA does not establish that the source can export every required field.

Each normalizer preserves HTML format and separates authored HTML from renderer output, language-filter output and user-specific URLs. Full-fidelity claims require a round-trip test; otherwise record the precise missing fields.

## 10. Planner and immutable plans

Initial synchronization is one-way, source to destination. The caller selects an existing target course or explicitly requests a new hidden course in a mapped category. Never overwrite a course merely because its name matches.

Planning sequence:

1. Discover both sites, principals, versions and required capabilities.
2. Resolve course identities and verify distinct intended source/target bindings.
3. Read the source, target and previous sync state using read-only operations.
4. Validate pagination and extraction completeness; mark unknown entities explicitly.
5. Normalize content, fields and references; apply selected version transformations.
6. Resolve entity mappings and surface ambiguous matches.
7. Compute a three-way diff and an ordered dependency graph.
8. Bind each action to a provider, operation, effects, expected IDs and preconditions.
9. List conflicts, losses, exclusions and unresolved dependencies before any apply.
10. Save a canonical plan with a digest, expiry, contract versions, capability snapshot and plan ID.

Plan output separates `creates`, `updates`, `moves`, `asset_transfers`, `deletes`, `unchanged`, `conflicts`, `unsupported`, and `unknown`. Include counts, actionable reasons, estimated transfer bytes and the maximum selected change scope. Plans may contain private educational content; they are protected files, not automatically public logs.

Planning must not create drafts, invoke view/tracking operations, start backup/copy tasks or write remote state. It may download selected assets for hashing into a protected local cache, subject to file/network policies, and must report that local activity.

Default `unsupported_policy=error` permits a useful diagnostic plan but blocks applying an incomplete selection. `skip` excludes the named entities and their dependent actions explicitly. `degrade` is available only for registered transformations listed and accepted in that plan; there is no universal lossy-mode switch that makes all changes acceptable.

Creation and publication are separate actions. New activities remain hidden until required content/files/references are verified, where supported. Synchronizing an existing activity preserves its identity and visibility unless explicitly selected otherwise.

## 11. Identity, incremental state and conflicts

### Entity mapping

Store a binding from `(source site, source course, source entity namespace/id)` to `(target site, target course, target entity namespace/id)` with an opaque sync key. Titles and positions are mutable properties, not identifiers.

Initial adoption order:

1. Existing validated mapping for this binding.
2. Explicit caller-provided entity map.
3. A unique stable external identifier, when both sides support it and policy permits adoption.
4. A proposed match for review, never an automatic write based only on a similar name.

New target entities receive mapping records immediately after confirmed creation. A replaced Moodle installation at the same URL, changed destination course, or stale restore invalidates the binding until revalidated. Do not overwrite institution-owned `idnumber` values with sync identifiers without explicit configuration.

### State store

Use a single shared state-store interface. The intended default is a transactional SQLite store backed by a maintained Node 22-compatible driver selected and pinned in P0. Do not assume a particular Node built-in SQLite API is stable across the existing supported runtime range.

Required records: bindings, entity/asset mappings, normalized baselines, plans, approved policy scopes, jobs, per-action attempts, reconciliation records and correlation IDs. Store schema versions and implement tested migrations. Credentials remain external references. Protect the database and asset cache with OS-appropriate permissions.

The engine must support an in-memory implementation for tests. Deployment begins with one coordinator worker per state store and exclusive per-target-course execution leases. CLI and MCP must not run concurrent writers for the same target binding; independent stores cannot coordinate implicitly, so document and detect overlapping targets where possible.

### Three-way comparison

Compare the last verified baseline with the current source and target at the selected-field level:

| Source changed | Target changed | Default result |
| --- | --- | --- |
| No | No | No action |
| Yes | No | Apply source change |
| No | Yes | Preserve target; record drift for review |
| Yes | Yes, same normalized result | Accept as converged |
| Yes | Yes, different result | Conflict; block the affected apply |

Do not silently incorporate target-only edits into the baseline as if they came from the source. Record acknowledged divergence separately. `source-wins`, `target-wins`, or an explicit edited resolution must be bound to the specific conflict and plan revision. Resolving a conflict generates a new plan/digest. Missing target entities, delete-vs-edit and reorder conflicts have explicit cases.

Hash canonical selected fields, not rendered URLs, access tokens, transient timestamps or unrelated settings. HTML canonicalization must not change meaningful whitespace, embedded data or accessibility attributes.

### Deletions

Pruning is off by default and requires explicit selection plus destructive authorization. It applies only to entities owned/adopted by this sync binding. An item omitted by filters, pagination, permissions, failed extraction or unsupported APIs is not proof of deletion. Require complete source inventory and verified disappearance; preserve unowned target entities and block deletes with protected learner data.

## 12. Executor, interruption and verification

Execute a saved plan only after validating its digest, caller, policies, expiry, endpoint identities and currently relevant source/target preconditions. Recheck each entity immediately before its write. A local hash cannot close the race with a concurrent Moodle edit; advertise this limit for Core. Add conditional-write support to plugin helpers where necessary and possible.

Execution order follows dependencies: course/section parents, reusable structures, module shells where appropriate, drafts/assets, authored content, links/ordering, compatible configuration, verification, then approved publication. Independent reads/transfers may use bounded concurrency; dependent writes remain ordered.

Persist intent before a write, then save returned identifiers and observed verification. Distinguish `succeeded`, `failed`, `partially_applied`, `unknown_outcome`, `blocked`, `cancel_requested`, and `cancelled` at action/job level. Warnings returned by legacy plugin operations must be parsed and classified; a 200 response or partially successful batch is not a successful workflow.

No exactly-once guarantee is claimed for Core APIs that lack idempotency. After timeout or crash, re-read the target and reconcile against the action's prior state and ownership markers. If an ambiguous create cannot be identified safely, require reconciliation instead of recreating it. New plugin helpers may accept idempotency keys and return stored results for equivalent authorized requests.

Cancellation stops scheduling new steps, waits for/reconciles in-flight writes and reports partial application. Resume uses the journal and fresh preconditions. Cross-server transactions and automatic universal rollback are not available. Offer compensation only for verified reversible actions; do not delete newly created activities automatically to simulate rollback after learner interaction.

Verify requested fields, identity, order and file integrity through independent reads. Track verification completeness and classify any server-side sanitization or normalization. Update the baseline only for verified outcomes. Reapplying an unchanged successful sync must produce no content writes and no new asset uploads.

## 13. File transfer and reference rewriting

The orchestrator transfers bytes with separate origin and destination credentials. Moodle A never receives Moodle B's token. Neither binary files nor credentials are routed through language-model tool arguments.

1. Discover authenticated readable assets and their owning entity/field/file area.
2. Download with streaming, bounded concurrency, timeouts and configurable quotas into a protected temporary cache; compute SHA-256 incrementally.
3. Preserve logical directory paths and filename Unicode. Validate traversal, separator, case-collision and duplicate-basename behavior independently of the host OS.
4. Upload to a destination draft owned by the destination principal, preserving the required logical paths. For multi-file editors, stage all selected assets into the same compatible draft.
5. Publish through an operation that supports that exact field/file area. Draft upload is not publication.
6. Verify content bytes or the strongest available integrity signal and owner context after publication; record when full remote byte verification is unavailable.

Use a two-pass reference resolver: allocate destination entity mappings first, then rewrite links and publish content. Parse HTML/URLs rather than replacing text blindly. Handle `src`, `href`, `srcset`, supported CSS URLs, relative pluginfile paths, nested package files and known Moodle activity/chapter links. Preserve legitimate external links. Identify unresolved Moodle-origin links and token-bearing URLs as diagnostics or blockers according to scope.

Do not fetch arbitrary URLs embedded in HTML automatically. Remote authenticated downloads must be bound to the configured Moodle origin or an explicitly allowed asset origin; never forward Moodle credentials across redirects. The coordinator additionally needs destination/network allowlists and protection against user-supplied URLs selecting internal infrastructure.

Deduplicate bytes by content hash, but publish files in every required Moodle owner area. Deduplication must not incorrectly reuse a draft/file-area ID from another entity, user or site. Reconcile replacement/deletion of editor files against an explicit manifest; the plugin must define preserve-versus-replace semantics.

Repeated `--upload-file` values become a typed list only for commands whose contract supports staging multiple files. Keep single-file resource replacement single-file. Preserve current `--summary-file`, `--content-file`, `--intro-file`, `--activity-file` semantics and mutual exclusions, including Windows Unicode paths. Paths remain local.

## 14. Version adaptation and limits

Support policy begins at Moodle 4.5. The initial verified matrix is 4.5, 5.0, 5.1, 5.2 and the audited 5.3 snapshot; prerelease support is visibly labeled. Later branches enter after source audit and integration tests, not because a version comparison says greater than 4.5.

Transformations live in named, tested adapters with explicit affected fields and loss descriptions. Model support as a set of features rather than a simple numeric upgrade/downgrade.

Examples requiring explicit handling:

- Standalone shared question-bank modules versus earlier course/question contexts; preserve ownership semantics or report a loss. Do not silently turn a shared bank into a quiz-private bank.
- Subsections and course-format features missing on the target.
- Activity settings, question types, availability conditions, grading plugins and filters that differ between sites.
- Sanitized HTML, format enums and date values. Preserve absolute times by default; shifting dates requires a selected rule and preview.
- Category IDs, role IDs, scales, grade categories, groups and external-tool configurations. Require target-side resolution rather than carrying numeric IDs across sites.

A faithful sync may be impossible for a selected content type on a plugin-free target. Report that before writes. A supported fallback, such as a Book transformed into Pages, is only possible when the target can actually create and populate Pages and the user accepts the structural loss.

No copying of student submissions, grades earned, quiz attempts, historical completion, logs or personal discussion content in the content-sync release. Group membership and enrolments form a separate opt-in workflow with user identity maps; default content sync covers group structure only. Do not match users automatically by a display name or assume equal user IDs. Email-based matching also requires explicit policy and ambiguity checks.

## 15. CLI and library experience

The commands below describe the implemented preview syntax. Existing flat operation commands remain supported.

```powershell
# Inspect capability choices without a write.
moodlia capabilities --profile school_a --course-id 42
moodlia get-courses --profile school_a --backend auto

# Build and save a plan; no remote writes.
moodlia course sync --source-profile school_a --source-course-id 42 `
  --target-profile school_b --target-course-id 81 --plan `
  --plan-file ".moodle-sync\plans\course-42.json"

# Apply the saved, unchanged plan with fresh precondition checks.
moodlia course sync --apply-plan ".moodle-sync\plans\course-42.json" --allow-write

# The Core distribution uses the same syntax and engine, Core providers only.
moodle-core course sync --source-profile school_a --source-course-id 42 `
  --target-profile school_b --target-course-id 81 --plan

# Inspect and resume journaled work.
moodlia sync status --job-id example-job
moodlia sync resume --job-id example-job --allow-write
moodlia sync verify --plan-id example-plan --job-id example-job

# Select a provider contract explicitly without spawning another CLI.
moodlia core get-course --profile school_a --course-id 42
moodlia plugin get-course-details --course-id 42
```

Keep `sync-course` as an alias for `course sync`. Introduce grouped workflow commands without removing existing kebab-case operation commands. Namespaces `moodlia core <command>` and `moodlia plugin <command>` provide explicit access when provider operations differ. Do not flatten colliding contracts into one indistinguishable command list.

No `--allow-write` means plan-only for sync. A convenience plan-and-apply mode can be added later, but the first implementation applies explicit saved plans. Show proposed fields, effects and capability gaps in JSON. Preserve machine-readable stdout; progress belongs on stderr. Define documented exit codes for validation, capability gaps, conflicts, remote failure, partial execution and verification failure.

Library users receive `createAdaptiveMoodleClient`, `createCoreAdapter`, `createSyncEngine`, `planCourseSync`, `applySyncPlan`, `verifySync`, and state-store interfaces through versioned exports. Names are finalized in P1. Existing root factory functions remain compatible during the additive stage; compatibility serializers prevent return-shape changes.

For existing flat `moodlia` commands, automatic fallback is permitted only when the semantic registry can preserve every requested field and the established response contract. Otherwise return a precise capability gap or expose the alternative under a new workflow name. Never ignore unsupported flags to make a fallback appear successful.

## 16. Plugin changes

Keep plugin additions focused on local operations the coordinator needs. Continue using Moodle APIs and capability checks rather than exposing arbitrary database writes or remote-site credentials.

| Addition | Purpose | Implementation constraint |
| --- | --- | --- |
| Versioned sync capability discovery | Report plugin features, schema versions and contextual access evidence | Distinguish installed/declarative capability from service/token permission; preserve existing status response |
| Per-entity authoring readers | Export portable source content and settings, not only rendered/module-shell data | Include section zero, HTML format, field presence and supported asset manifests |
| Missing typed content updaters | Incrementally update Pages/labels/URLs or other audited gaps | Keep IDs, grades, completion and unrelated module settings stable |
| File manifests and multi-file drafts | Publish and verify multiple editor assets | Explicit preserve/replace semantics, owner checks and bounded batches |
| Optional conditional mutations | Reject stale content against an expected normalized fingerprint | Recheck close to the mutation; document concurrency guarantees |
| Optional idempotency records | Reconcile retries without duplicate creation | Keys scoped by principal, context and request digest; retention and cleanup defined |
| Bounded local import batch | Reduce round trips for supported independent actions | Explicit per-item result and transaction scope; not an atomic cross-course promise |

Use names such as `get_sync_capabilities`, `get_course_sync_entities`, and `apply_course_sync_batch` only after schemas are designed. Export/import helpers must share the neutral schema, but PHP must not duplicate the JavaScript diff/planning algorithm. Capability and entity helpers improve fidelity; the coordinator must still interoperate with older plugin versions using their existing operations where adequate.

If persistent idempotency or entity metadata needs new plugin tables, include `db/install.xml`, upgrade steps, indexes, data retention/cleanup, privacy metadata/provider changes and migration tests. The existing static test asserting no private schema must then be intentionally replaced by checks for the justified schema. Do not hide permanent state in Moodle caches or unrelated tables.

Maintain canonical contract ownership in the plugin. Regenerate REST declarations, MCP manifests and CLI contract artifacts together for new local operations. Existing plugin MCP clients should retain all current tools and behavior.

## 17. MCP synchronization coordinator

Create a separate proposed `moodlia-sync-mcp` package after the engine works through both CLIs. It imports the adaptive library and adds transport, job supervision and authorization only. It is not an MCP mode of `moodle-core-cli`.

The existing Moodle-hosted MCP continues to serve one site. New local extraction/apply helpers can be exposed through it, but it does not coordinate remote sites or accept another Moodle's credentials. The Node coordinator is the MCP endpoint for cross-site jobs.

### Proposed tools

| Tool | Effect |
| --- | --- |
| `sync_list_profiles` | List only profiles authorized for the caller, without credentials |
| `sync_discover_capabilities` | Read source/destination capability evidence |
| `sync_plan_course` | Build a plan; may create a local queued planning job for large courses |
| `sync_get_plan` | Retrieve paginated actions, losses, conflicts and verification scope |
| `sync_start_course` | Start an authorized saved plan, bound to its digest and caller |
| `sync_get_status` | Read job progress and partial results |
| `sync_cancel` | Request cancellation; does not undo completed writes |
| `sync_resume` | Reconcile and resume an eligible interrupted job |
| `sync_verify_course` | Run verification without content writes |
| `sync_get_conflicts` | Read conflicts |
| `sync_resolve_conflict` | Record a resolution and produce a new plan revision; no remote write |
| `sync_get_history` | Read caller-scoped history |

Tools accept configured profile names and IDs, not tokens, arbitrary URLs, raw shell commands or arbitrary PHP class names. Scope access to specific profile pairs/courses and effect classes. Plans/jobs and asset storage are isolated per authenticated caller or workspace.

### Lifecycle and authorization

- `sync_start_course` requires a plan ID/digest and authorization established by host consent or explicit coordinator policy. A boolean tool parameter alone cannot grant it.
- Bind approval to caller, source/target identities, policy scope and plan revision; expire it and reject replay after completion or relevant changes.
- Audit every write with correlation/job/action identifiers while redacting credentials and sensitive content.
- Treat Moodle content and tool results as untrusted data; embedded instructions cannot expand synchronization scope, select new profiles or authorize deletions.
- Reuse persistent engine jobs. Do not launch an untracked background promise and report a durable job ID.
- In local stdio mode, the supervised server owns the worker. On process exit jobs become interrupted/reconcilable. In service mode a configured persistent worker processes queued jobs. Package service startup/shutdown and health reporting accordingly.
- Support plain job-ID polling as the baseline. Native MCP task/progress features are optional only when negotiated and tested; do not assume every host supports them.
- Use the selected SDK's supported protocol negotiation. Do not hardcode the previous discussion's protocol-date or handshake assumptions.
- Local stdio is the first transport. Hosted Streamable HTTP is a separate milestone with coordinator authentication, profile ACLs and supported MCP authorization. Moodle REST tokens remain downstream credentials, separate from client-to-coordinator authentication.
- Document actual client compatibility after testing. A ChatGPT/Claude hosted connector must be able to reach and authenticate to the coordinator; installing a local CLI does not make it remotely reachable.

## 18. Planned repository changes

Paths below are target responsibilities, not files created by this planning step.

| Repository | Planned files/areas |
| --- | --- |
| `moodle-core-cli` | Refactor `client/moodle-rest-client.mjs` behind its current exports; add `capabilities/`, `adapters/core/`, `workflows/`, `sync/`, `profiles/`, schemas and tests; extend CLI routing, package exports/types, CI and docs |
| `moodlia-cli` | Add dependency on compatible Core package; add `adapters/moodlia/`, `adaptive/`, legacy serializers, shared command routing, contract parity checks, sync/adaptive docs and tests |
| `moodlia-moodle-plugin` | Add only audited missing readers/updaters/discovery helpers and optional idempotency storage; regenerate contract/manifests; extend PHP tests and version matrix |
| New coordinator project | MCP schemas/tools, worker/service runtime, profile ACL policy, job store wiring, packaging and host-specific setup docs |
| `moodlia-skills` | Update transport guidance, adaptive backend discovery, sync planning/apply workflow, file handling, conflicts, no-backup verification and MCP coordinator instructions |
| Workspace README | Explain shared foundation, adaptive CLI and separate sync MCP coordinator |
| `moodlia-website` | Update product comparison, supported capability matrix, installation and migration pages only after implementation verifies them |

Use the skill-creation workflow when actually editing skills. The canonical skill repository is updated first; synchronize installed copies through the established install/update process rather than allowing local instructions to diverge. Remove stale instructions that claim the CLI always requires the plugin, but retain exact field/file-area validation rules. No backup is required to execute or verify content synchronization; native backup portability tests remain a separate optional plugin QA activity.

## 19. Implementation phases and acceptance gates

### P0 — Evidence and contract audit

Deliver a semantic mapping inventory, version/format test fixtures, operation-effect overrides and a gap list for each requested feature. Inspect Core rubric APIs, course-format actions and authoring access; do not decide solely from function summaries. Select a Node-compatible state-store dependency and publish an architecture decision record.

Acceptance: every planned capability is classified as verified, experimental, unavailable or pending with an evidence reference. Mutating functions mislabeled as reads are identified and covered by policy tests. No current production behavior changes.

### P1 — Shared foundation and compatibility scaffolding

Extract transport utilities and typed policy/error primitives into Core-owned modules while retaining root exports. Define capability, profile, adapter and result interfaces; add neutral schema validators, explicit effect metadata and package export tests. Introduce a state-store abstraction.

Acceptance: existing CLI/library behavior tests and package-install tests pass. The Core package has no dependency on MoodlIA or an MCP SDK. No dependency cycle is present.

### P2 — Discovery and adaptive resolver

Implement service-aware discovery, optional dual credentials, contextual evidence, caching and explanation output. Build Core and MoodlIA adapter registration, field-aware selection and backend overrides. Add a separate adaptive library entry point.

Acceptance: a Core-only site, a plugin-equipped site, an older plugin, a restricted token and missing discovery endpoints all produce the documented result. Exact fallback works without a parameter/result mismatch; denied, ambiguous or failed mutations are never retried through another provider.

### P3 — Friendly commands and workflows

Deliver the backlog in Section 8, prioritizing aliases, reports/audits and add-only enrolment workflows. Implement course-format mutations only for verified actions. Add CLI profiles, grouped routing and legacy aliases; preserve existing payloads.

Acceptance: supported Core workflows work on 4.5 and the newest tested branch, with field-level gap reports on unsupported combinations. Pagination and hidden-data behavior are tested. Legacy commands remain compatible. Experimental authoring has explicit status and policy gates.

### P4 — Neutral model, diff and state

Implement normalized entity/asset schemas, legacy blueprint conversion, stable bindings, completeness tracking, canonical hashing, three-way diff, dependency planning, state migrations and immutable plans.

Acceptance: fixture-based plans are deterministic; title changes do not duplicate entities; section zero is preserved; duplicate titles remain ambiguous; unseen/filtered entities do not become deletes; changes invalidate preconditions separately from the plan digest.

### P5 — Metadata/structure sync through both CLIs

Implement the executor, target leases, journal, recovery and readback for course fields and proven structure/group capabilities. Wire identical sync syntax to Core-only and adaptive provider sets. Support existing and explicitly created hidden target courses.

Acceptance: all four adapter pairings either synchronize supported selected fields or report precise gaps before writing. Re-running a verified sync is a no-op. A killed worker, timeout and target edit produce recoverable or explicitly ambiguous results. This is the first preview milestone, not completion of the full content-sync request.

### P6 — Portable content and files

Implement Pages/labels/URLs and resource/folder definitions where readable/writable, native editor manifests, streaming transfer, multi-file drafts and typed link rewriting. Add necessary plugin local content readers/updaters. Keep each unsupported Core destination path explicitly blocked.

Acceptance: representative HTML with nested Unicode assets survives cross-site transfer; bytes and links are verified; no origin token/temporary URL remains; resource identities persist; partial uploads and quota errors are recoverable. Core fallback is tested where possible and refusal is tested where impossible.

### P7 — Advanced educational content and version transformations

Add Books/chapters, question banks/quizzes, assignment definitions/rubrics/guides, Workshop forms, Lesson/Database/Feedback definitions and compatible completion/gradebook settings. Add typed extension slots and specific cross-version transformations. Complete plugin conditional/idempotent helpers where needed.

Acceptance: each delivered type has export/apply/readback fixtures and versioned capability evidence. Already-graded activities, locked completion and ownership-changing question-bank transformations are protected by explicit conflicts. Types without a reliable API remain documented capability gaps, not silently skipped successes.

### P8 — MCP coordinator

Package the shared engine as MCP tools with persistent jobs, caller-scoped profiles, plan authorization, status/cancellation/resume and verification. Deliver stdio first, then authenticated hosted transport and actual host interoperability tests.

Acceptance: equivalent CLI and MCP requests produce the same normalized plan/actions/outcomes. Credentials and binary assets stay outside tool arguments/results. Restart, revoked access, expired plans, replay, cancellation and unauthorized profile access are tested.

### P9 — Cross-version and recovery qualification

Run the matrix below on disposable environments, including Core-only destinations. Complete missing source audits, effect reviews and runtime/service compatibility fixes. Produce an evidence-based capability report for release.

Acceptance: release gates in Section 22 pass; every unsupported scenario has an intentional diagnostic; temporary test infrastructure is removed and cleanup is verified.

### P10 — Documentation, migration and release

Update English docs, generated command references, examples, compatibility tables, skills and product pages. Ship migration notes and coordinated package versions; verify clean consumer installs and inter-package constraints. Create release artifacts and monitor the relevant CI/package publishing jobs under the normal release workflow.

Acceptance: package contents contain no tokens, state databases or fixture private data; instructions match tested behavior; legacy usage and the adaptive path are both documented. Release and deployment are distinct milestones; the implementation is not considered installed on a production Moodle merely because npm/GitHub publication succeeded.

### Dependency sequence

```text
P0 -> P1 -> P2 -> P3
       |     |
       +---->P4 -> P5 -> P6 -> P7
                    |           |
                    +----> P8 <-+
                               |
                         P9 -> P10
```

MCP scaffolding may begin after stable engine job interfaces exist, but its release requires the content and recovery semantics it exposes. Documentation and tests are maintained during each phase; P9/P10 are qualification and publication gates, not the first time they are written.

## 20. Validation matrix

### Automated tests

| Area | Required cases |
| --- | --- |
| Resolution | Missing plugin, partial/old plugin, no Core discovery, restricted service, field mismatch, context denial, same command/different semantics, explicit backend |
| Profiles | Legacy environment compatibility, conflicting credentials, separate service tokens, different principals, URL subdirectories, secret redaction |
| Policy | Misclassified upstream reads, parameter-selected destructive actions, parent workflow denied child, uploads in read-only mode, preview performs zero remote writes |
| Models | Stable IDs, duplicated names, section zero, unknown fields, incomplete pagination, schema migrations, deterministic output |
| Conflicts | Source-only/target-only edits, equal convergence, edit/delete, delete/recreate, source or target changed after planning, sanitized content |
| Recovery | Timeout after successful write, crash before mapping save, partial batch warning, interrupted upload, duplicate apply, ambiguous create, expired lease, restart |
| Assets | Unicode/spaces, subdirectories, same basename, repeated images, zero-byte files, large streaming files, checksums, redirects, traversal, quota limits, missing download rights |
| Content | Internal links, cross-chapter links, assets in HTML/CSS/srcset, unsupported transforms, hidden activities, restricted sections, existing rubric/grade preservation |
| MCP | Schema validation, profile ACLs, authorization binding, replay rejection, disconnected client, persistent worker restart, cancellation, CLI parity |
| Distribution | TypeScript consumer compilation, preserved root exports, npm pack contents, clean registry-style installs, lockfile reproducibility |

### Integration environments

- Single-site baseline on 4.5, 5.0, 5.1, 5.2 and the current audited 5.3 snapshot, with and without MoodlIA and with representative restricted tokens.
- Logical source/target coverage is five source branches by five destination branches by four adapter pairings: 100 combinations. These are scenarios, not a requirement to run 100 full stacks simultaneously.
- Pull-request suite: representative same-version pairs and 4.5 to newest/newest to 4.5, covering all four pairings and a restricted-service case.
- Nightly or release qualification: the full pair matrix for the supported entity suite, scheduling reused disposable instances sequentially to control resources. Expected capability-gap outcomes count as tested limitations, never successful content transfer.
- Keep per-branch supported PHP/DB combinations; use PostgreSQL 17 for the currently audited 5.3 environment. Record image/tag/commit digests and plugin versions for reproducibility.
- Node 22 and a maintained newer supported runtime; Windows and Linux for CLI/state/file paths.
- Include standard Topics/Weekly formats and unsupported/limited format fixtures to verify quick-create/action limitations.

Use dedicated fixtures with duplicate titles, section zero content, nested assets, a Book, active assignment rubric, question ownership, locked completion and target-only edits. Tests must compare fields and bytes, not merely HTTP status or command exit code. Confirm that sync does not invoke backup/restore/copy functions, create `.mbz` files or trigger a Moodle backup task.

For optional remote integration work on `s1`, use uniquely named containers, volumes, directories and loopback ports with recorded ownership. Avoid production routes and credentials. Tear down exact recorded resources after verification, confirm port/storage cleanup and verify the existing production service remains healthy. The planning step does not provision any environment.

## 21. Release and migration policy

1. Publish additive shared APIs and preview sync functionality under compatible prerelease versions; choose concrete version numbers from the actual package state when implementation is ready.
2. Add a pinned compatible dependency from `moodlia` to `moodle-core-cli`. The coordinator then depends on a compatible `moodlia` release. Test published-tarball installation before promoting tags.
3. Keep the current plugin contract artifact distinct from the workflow/capability contracts; do not add client-only workflows as fictitious PHP operations.
4. Preserve flat CLI names, environment variables, root exports and response formats during the additive migration. Resolve namespace collisions with explicit provider commands.
5. If adaptive defaults or global write policies cannot preserve legacy behavior, introduce them in a clearly documented breaking release with an opt-in preview and migration guide. Do not change semantics silently within an old command.
6. Release plugin additions before promoting capabilities that depend on them, but keep useful fallback against older plugins. Test both the minimum supported plugin and the new plugin.
7. Publish the coordinator only after state/recovery and authorization gates pass. Hosted coordinator deployment needs its own configuration and credentials; it is not bundled into the Moodle ZIP.
8. Update published skills and website claims from the verified capability matrix. Explain that Moodle version support is different from per-token/per-entity capability support.
9. Keep both existing packages and repositories. No repository deletion, package deprecation or global executable replacement is required.

## 22. Completion criteria and remaining decisions

The implementation is complete when:

- `moodlia` works against a plugin-free supported Moodle for its verified Core-capable operations and automatically benefits from MoodlIA where authorized.
- Both CLIs share the same tested workflow/sync engine, preserving their intended provider boundary and existing public interfaces or documented migration.
- Mixed-version and mixed-provider content synchronization transfers every selected supported field/file, preserves mappings and exposes all unsupported or lossy paths before apply.
- A second unchanged run performs no content writes; conflicts and ambiguous failures cannot silently overwrite or duplicate target content.
- The MCP coordinator produces the same plans/results with durable execution and independent authentication for each Moodle.
- Required plugin helper contracts have REST/MCP parity and regression coverage for existing content, grading and file behavior.
- Tests establish which combinations work and which intentionally report gaps; documentation and skills reproduce that exact scope.
- The no-backup property is verified. Student outcomes are outside the initial content-sync scope.

Routine engineering choices to close in P0/P1: SQLite driver, final subpath/API names, release numbers, and exact initial entity promotion based on the capability audit. These choices do not require re-deciding the product architecture.

Deployment-specific choices are separate: where to host the coordinator, which profiles/credentials to authorize, which production courses to synchronize, and which loss/conflict/deletion policy to approve for a real run. Implementation and disposable tests can proceed without those production choices.

Bidirectional synchronization, scheduled autonomous runs, institutional identity provisioning, student-result migration and arbitrary third-party activity plugins are later product milestones. The state model should permit future extensions, but they are not prerequisites for the requested one-way content synchronization.

## 23. External references

Moodle documents external services, their relationship to web/mobile operations and separate file endpoints in its [External Services guide](https://moodledev.io/docs/4.5/apis/subsystems/external). This establishes the transport boundary; actual capability assertions in this plan require source and integration evidence.

The MCP coordinator must follow a deliberately selected and tested protocol version. The [MCP tools specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) documents tool schemas and invocation, while the [authorization specification](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) informs hosted transport authentication. These references are protocol baselines, not a claim that all host applications support every optional feature.
