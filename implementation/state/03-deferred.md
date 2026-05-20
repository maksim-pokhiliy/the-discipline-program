# Deferred sub-decisions / carry-forwards

> Active + closed carry-forwards. Default hypothesis applied; revisit on contact. Resolved items struck through with closing commit reference.

## Active (as of 2026-05-20)

### Step 8.1c/8.1d follow-ups — PR #199 review (`claude[bot]`, 2026-05-20)

> CI review on merged PR #199 — verdict **LGTM**, all notes non-blocking. Comment: <https://github.com/maksim-pokhiliy/the-discipline-program/pull/199#issuecomment-4499978671>. Bundle target: one `/fix` cycle schedulable alongside QA-W1 (shared delete-path theme) — post-merge, before/with Step 8 infrastructure. Review note #1 (`schemaIds` ordering not contract-documented) — 8.2 prompt-write verbatim-research found Block route handlers carry no route-level tests, and `mapToAlternatingGroup`'s `Schema.order asc` ordering is already pinned by the 8.1d mapper-determinism test; Zod arrays cannot express array ordering structurally and the no-comments rule forbids a JSDoc — note #1 is recorded **covered** (no further artifact owed), see `step-08.2/prompt.md` § 7. Not carried here. Note #3 (`lmsAlternatingGroupApi.delete` runs outside a tx) is folded into QA-W1 below. Note #5 (no migration file) discarded — ADR-0019 ratified no `migrations/` during the workflow; `SchemaPairing` never reached prod (no prod data), so no hand-written data migration is owed; the workflow-end baseline migration ships the final schema directly.

- **REVIEW-I4 — bare `.max(24)` on `createAlternatingGroupSchema.schemaIds`** (INFO; PR #199 note #6). Magic number in `packages/contracts/src/entities/lms/alternating-group/alternating-group.schema.ts`; the schema test hardcodes 24/25 the same way. **Action**: extract a named `ALTERNATING_GROUP_MAX_MEMBERS = 24` beside the existing `ALTERNATING_GROUP_RELATIONS` in `alternating-group.constants.ts`, reference it from schema + test. Pattern-compliance fix — the file already names its sibling constants. Effort XS (~3-5 LOC).

- **REVIEW-I5 — one conceptual member floor, two comparators + timings** (INFO; PR #199 note #2). `lmsAlternatingGroupApi.removeMember` checks `memberCount <= SURVIVING_MEMBER_FLOOR` pre-unlink; `lmsSchemaApi.delete` checks `remaining < SURVIVING_GROUP_FLOOR` post-delete. Both correct, but a maintainer reads two constants + two comparators for one invariant. **Action**: rename to encode the boundary (`MIN_PRE_REMOVE_COUNT` / `MIN_POST_DELETE_COUNT`) or align both to a single pre/post pattern. Effort XS.

- **REVIEW-I6 — `lmsAlternatingGroupApi.create` runs N sequential `verifySchemaOwnership` round-trips** (INFO; PR #199 note #4). At `.max(24)` that is up to 24 chain-walking guard calls before the tx opens. Not hot — no HTTP route or UI consumer exists yet. **Action when triggered**: collapse to one `prisma.schema.findMany` joining `plan.creatorId`/`deletedAt`/`status` only if a real consumer ever puts this on a hot path. Lowest priority; may stay deferred indefinitely.

### Step 8.1b follow-ups (NEW)

- **QA-W1 — delete/update paths lack in-tx `plan` re-check** (WARNING). `lmsSchemaRowApi.update` / `.delete` lack an in-tx `plan.deletedAt` re-check; **`lmsAlternatingGroupApi.delete` runs with no transaction at all** (PR #199 review note #3) — it loses the commit-time re-verify of `plan.deletedAt === null` + `plan.status !== ARCHIVED` that its siblings `create`/`addMember`/`removeMember` get via `assertPlanEditableInTx`. Race: another tx soft-deletes or archives the plan between guard return and write. Not blocking (api-server slice, no HTTP exposure). **Action when triggered**: one `/fix` cycle — wrap each write in interactive `$transaction` with the in-tx plan re-check, bundled with regression tests per branch.

- **QA-W2 — `lmsSchemaRowApi.reorder` array-form `$transaction([...])` cannot embed plan re-fetch** (WARNING). Array form, not interactive tx. Either convert к interactive `$transaction(async tx)` or accept the race as known-defer. **Action when triggered**: future `/fix` cycle, decide form at that time.

- ~~**REVIEW-I3 — `lms-guards.ts` at ~293/300 logical LOC**~~ — **CLOSED 2026-05-20** via Step 8.1d commit `f99d9ba6` (own-file axis): executor placed `verifyAlternatingGroupOwnership` in a new `authz/alternating-group-guards.ts` (83 lines) joined to the `authz/guards.ts` barrel, leaving `lms-guards.ts` byte-identical at 331 physical / ~293 logical lines (under the 300 cap). Zero churn risk in the four shipped sibling guards; importers continue resolving via `from "…/authz/guards"`. The cap is cleared via separate-file split rather than in-place — acceptable axis, planner-concur'd at close-out.

### Step 8.1a follow-ups

- **QA-B4 — `lmsSchemaApi.reorder` без `retryOnP2034`** (WARNING). Concurrent create on same scope can lose reorder под SSI. Mirror Block precedent (`lmsBlockApi.reorder` also unwrapped). **Action when triggered**: address при Step 8.2 HTTP route layer retry semantics (preserves UX without bloating api-server method). Defer.

- **QA-C2 — `handlePrismaError` не маппит P2028 (tx-timeout)** (WARNING). Surfaces as raw 500. Out-of-zone for 8.1a (file unmodified). **Action when triggered**: separate `/fix` ticket covering P2028 mapping across all error paths. Effort S (~5 LOC + 1 test).

- **QA-D1 — `reorderSchemasSchema.orderedIds` имеет `.min(1)` без `.max()` cap** (WARNING). DoS-class via tx-timeout на гигантских массивах. Out-of-zone for 8.1a (Step 8.0b contracts territory). **Action when triggered**: Step 8.0b follow-up `.max(N)` cap или `/fix`. Suggest `N = 1000` matching reasonable schema-per-block upper bound. Effort S.

- **QA-E3 — All 4 guards propagate `PrismaClientValidationError` на `userId = undefined`** (WARNING). Plan/Block/Schema + future Row/Pairing guards. 4 × 2-line defensive fix exceeds `[[inline-fix-pre-existing]]` 5-LOC threshold. **Action when triggered**: separate cross-guard `/fix` уни formly adding `if (!userId) throw new ForbiddenError(...)` early-throw at each guard entry. Effort S (4 × 2 LOC + 4 tests).

- **QA-F2 — Delete-blocked-by-PerformedExerciseInstance surfaces as misleading "Referenced Schema does not exist" P2003** (WARNING). Actually FK violation от downstream entity. Defer к Step 8.1b/c (SchemaRow API + delete-blocked semantics + improved error message). Surface будет fire когда athlete-facing entities materialize (out of this workflow's primary scope; may stay deferred indefinitely).

- **Schema 8.1a INFO bundle (7 items)** — purely advisory, no immediate action: QA-A3 int32 overflow on `_max(order)+10` (200M+ inserts), QA-A4 UTF-16 vs codepoint length semantics on `header.max(500)`, QA-A5 discriminated-scope runtime-erasure `{blockId, parentSchemaId}` silent top-route, QA-B1 P2034 retry-exhaustion deterministic, QA-B2 P2003 message imprecision Block-vs-Schema, QA-B5 last-writer-wins reorder без optimistic-concurrency, QA-F3 duplicate-id reorder error reports `missing: []` (partially Stage 7-covered C30). _(QA-I1 `TxClient` hoist — CLOSED via Step 8.1b, see Closed section.)_

- **FIND-001 — `lmsSchemaApi.create` body 132 lines** (WARNING; review note, Schema-specific). NOT triggered by Step 8.1b — SchemaRow single-scope create did not repeat Schema's discriminated-scope 132-LOC pattern. Remains a Schema-specific carry-forward; `resolveStorageContext` extraction revisit only if `lmsSchemaApi.create` is ever re-touched. Not blocking.

- **Cross-step planner-discipline note — `[[planner-verbatim-registration]]` (c) consumer-package package.json exports axis**. Two-layer miss surfaced 8.1a-time (Step 8.0b shipped barrels but forgot exports map; Step 8.1a planner didn't Read package.json verbatim at prompt-write). Memory entry update queued — extend `[[planner-verbatim-registration]]` body 1-2 sentences к explicitly include "consumer-package `package.json` `exports` field" alongside existing list (barrels/dep-cruiser/turbo.json/pnpm-workspace.yaml). Не a new flavour; axis expansion to existing (c). **Action**: update memory file body during this close-out cycle.

### Pre-Step-8 cleanup candidates

- **QA-001b — `Session @@unique([dayId, order])` mirror constraint** (WARNING; Step 7.3.6 D-2 carry-forward). Session model has identical `@@index([dayId, order])` without `@@unique`; same SSI-mechanism protection as pre-Step-7.3.6 Block (Step 6.4.5 `retryOnP2034` wrap on `lmsSessionApi.create`); same latent regression surface when Step 8 Schema adds more concurrent write paths. **Action when triggered**: mirror Step 7.3.6 implementation pattern — schema edit + `lmsSessionApi.reorder` two-pass rewrite + 2 tests + analysis sync. Single atomic commit. `/feature small` pipeline.

- **QA-001c — `retryOnP2034` widening к also retry P2002 on `_max+N` insert pattern** (INFO; Step 7.3.6 D-2 carry-forward). Post-`@@unique` constraint, loser сейчас видит immediate P2002 ConflictError вместо retry. Helper extension (new variant `retryOnConcurrentInsertRace` taking both P2002 + P2034 codes) preserves prior concurrent UX где two simultaneous creates often produced fulfilledCount=2. **Action when triggered**: design new variant helper в `packages/api-server/src/utils/`; apply к `lmsBlockApi.create` + `lmsSessionApi.create` (if QA-001b shipped) + `lmsDayMetadataApi.{setLabel,setNotes}`. Step 7.x or pre-Step-8 cleanup.

- **QA-023 — Flaky timing-proxy assertion в `packages/api-server/src/endpoints/lms/block/admin.test.ts:406`** (INFRA/test-quality; Step 7.4 carry-forward). Test uses `expect(elapsed).toBeLessThan(50)` proxy для verifying absence of retry. Threshold too tight под нагрузкой (1/3 repeat runs fail at 68ms). **Fix options**: (1) widen threshold к 200ms; (2) replace timing-proxy с call-counter spy via `vi.spyOn`; (3) verify absence of retry via `retryOnP2034` internal logging. **Action when triggered**: pick option at next opportunity OR separate `/fix` loop; prefer (1) для minimal-touch fix.

### Step 8 surface triggers

- ~~**WORKFLOW-001 — `db:seed` vs test suite incompatibility through `idx_single_head_coach`**~~ — **CLOSED 2026-05-20** via Step 8.1c commit `8c3a701b` (D13 path (b)): `schema/admin.test.ts` + `label/platform.test.ts` — the 2 files that created a 2nd `HEAD_COACH` without clearing the seeded one — now demote any pre-existing `HEAD_COACH` → `COACH` before promoting their fixture; the other 4 HEAD_COACH-creating test files already carried the pattern. Deterministic collision no longer reproduces; `pnpm test` green on a `db:reset`+`db:seed` DB. Step 8.3.7-pre DROPPED (D13 SUPERSEDED). Convention recorded in Standing context below.

- **`DAY_INCLUDE` hoist к shared module** (Step 7.3.5 D-1 carry-forward; Step 8 trigger). `lms/day/admin.ts` defines `DAY_INCLUDE` const inline. Hoist к `endpoints/lms/_shared/` when 3rd callsite materializes (likely Step 8.1a or 8.3.5 — Schema entity Day-include extension).

- **`BLOCK_WITH_LABELS_INCLUDE` hoist** (Step 7.x carry-forward; Step 8 trigger). Similar — Block include shape currently inline в week endpoint; hoist when 3rd callsite materializes.

- **`mapToBlockWithSchemas` mapper** (Step 7.x carry-forward; Step 8.0b/8.1 trigger — Schema entity arrives). When schemas[] embed lands в blockSchema (Step 8.3.5), mapper-side needs `mapToBlockWithSchemas` extending `mapToBlock` with nested Schema → SchemaWithBody assembly.

### Architectural cleanup

- **Symbol rename `cms{Label,Exercise}AdminApi` → `lms{Label,Exercise}AdminApi`** (Step 6.1.5 deferred; ~13 files mechanical sed). The moved api-server endpoints still export their CMS-prefixed symbol names because Step 6.1.5 refactor was strictly path-only ("byte-identical move" prompt § 4 invariant). Estimated blast radius: 7 admin route handlers + 2 api-server self-exports + 4 test files. Schedule as its own atomic PR — low priority (runtime unaffected; only naming consistency).

- **`z.nativeEnum` migration в `lms/plan-enrollment` + `lms/training-plan`** (Step 8.0b Q-1 carry-forward 2026-05-18). Pre-existing legacy violations of `contracts-no-prisma` boundary rule (per `.dependency-cruiser.cjs:26-33`). Mechanical follow-up: replace `z.nativeEnum(SomePrismaEnum)` с `as const` tuple + `z.enum`. ~2 files, ~5-10 LOC delta each. Behavioural equivalent. Schedule as `/feature small` atomic refactor.

### Test-quality (optional, INFO)

- **QA-006 — HEAD_COACH + ARCHIVED plan composition test** (Step 7.1 Stage 6 INFO). Optional 10-line test для completeness; correctness already covered by composition. Не blocker для Step 7.2/7.3+ steps.

- **QA-019 — D-7 invariant test outcome-only (no SQL-spy на createMany call count)** (Step 7.1 Stage 6 INFO). Acceptable per `[[no-tech-debt-in-mocks]]` rule — outcome test sufficient; SQL-spy-based would require Prisma client instrumentation (rejected). Carry as documentation.

- **QA-022 — `TxClient` Omit deny-list fragile to Prisma major upgrades** (Step 7.1 D-1 INFO; flag для `/upgrade` prompts). `TxClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">` correct для Prisma 6 (mirrors internal `ITXClientDenyList`); future Prisma client additions would leak. **Action when triggered**: any `/upgrade @prisma/client` prompt должен re-verify omit list shape против new Prisma version's internal `ITXClientDenyList`.

### Domain-driven

- **`mapToSessionWithLabel` extraction as named symbol** (Step 6.2 deferred per output.md D-2). Currently inline `{ ...mapToSession(s), label: s.label ? mapToLabel(s.label) : null }` inside `mapToDaySlot`. Single use site; extract if Step 6.6 WeekGrid builds the same shape on the client.

## Closed (selected — chronological recent first)

- ~~**QA-I1 — `TxClient` structural-typing leak / local-alias duplication**~~ — CLOSED 2026-05-19 via Step 8.1b Phase 0 (`d2e9b7e5`). Hoisted к `endpoints/lms/_shared/tx-client.ts`; `block/admin.ts` + `schema/assertions.ts` migrated к import; `grep "type TxClient = Omit"` → 1 canonical site only.

- ~~**Step 7.1 Stage 6 QA-001 — `@@unique([sessionId, order])` constraint on `Block` model**~~ — CLOSED 2026-05-18 via Step 7.3.6 (`85866ba1`). 8th planner-discipline flavour `[[planner-mutation-invariant-trace]]` saved.

- ~~**Step 7.1 Stage 6 QA-003 — router middleware для `ZodError` from mapper**~~ — CLOSED 2026-05-18 via Step 7.2 Phase 1 patch (`89f81e9c`). Fix landed в api-server's `handlePrismaError` (not api-routes).

- ~~**Step 7.3.6 D-2 / WORKFLOW-002 — Planner adversarial-pass intra-tx state extension**~~ — RESOLVED inline 2026-05-18 (8th planner-discipline flavour `[[planner-mutation-invariant-trace]]` codified).

- ~~**Step 7.4 D-1 / PLAN-001 — Planner adversarial-pass static analysis (lint impact) axis**~~ — RESOLVED inline 2026-05-18 (9th planner-discipline flavour `[[planner-lint-impact-trace]]` codified).

- ~~**Production retry-on-P2034 at HTTP layer**~~ — FULLY RESOLVED 2026-05-16. Helper `retryOnP2034` shipped Step 6.4 (`b0b23ae4`); applied к all 3 production callsites (DayMetadata.setLabel/setNotes + Session.create).

- ~~**WORKFLOW.md husky-squash guidance**~~ — RESOLVED 2026-05-16 (`4d93c60a docs(workflow): document husky-squash strategy`).

- ~~**`DAY_OF_WEEK_TO_PRISMA` hoist**~~ — RESOLVED 2026-05-16 (`4b52e32d refactor(api-server): hoist day-of-week prisma map`).

- ~~**`endpoints/lms/exercise/index.ts` structural symmetry fix**~~ — RESOLVED 2026-05-16 (`859ac2c2`).

## Standing context (foundation rules)

- **Order semantics**: sparse integers (10/20/30) per Phase 4 Q6 (ratified в `analysis/artifacts/06-formalization/er-final.md §5 #7`). Step 2 seed and insert-helpers use sparse increments; renumber only on collision.

- **Migrations stance**: no versioned migrations during workflow; `db:reset` per schema change per ADR-0019. `db:reset` does NOT auto-seed; explicit `db:seed` required after.

- **Q10 — `Session.freezeLoadsAtCreation`** (indefinite carry-forward): field exists в Prisma but `Session` contract layer does NOT expose. Default coach workflow uses live formula resolution (DP2). Revisited only когда concrete coach use-case for testing-week toggle materializes.

- **Session.name** (indefinite carry-forward): Prisma schema has no `Session.name` field; do NOT add для flexibility. Session identity = `(order, label?, notes?)`. SessionCard renders `label.name || "Session N"`.

- **QA-001 — `@db.Date` ↔ local-midnight boundary** (Step 5 finding, Step 6+ hard rule): any `Date` written into `@db.Date` column must use `resolveWeekStartDate` to re-anchor к `Date.UTC(...)`.

- **Idempotency-key reuse with mismatching body documentation** (Step 6.4 deferred): `wrapAuthHandler(JSON_CONFIG)` throws `ConflictError("Idempotency-Key reuse with different request body")`. Acceptable behavior but undocumented at route level; surface contract к hook layer.

- **ZWS / control-char normalization on Day notes** (Step 6.6 deferred). Trigger: QA reports "notes appear empty but have characters". Implementation: hoist `normalizeText` helper from `lms/label/label.schema.ts:7` к shared module.

- **Label autocomplete preload + filter-by-applicability** (Step 6.4 ratified mid-thesis 2026-05-16): coach opens label-select → all applicable labels preloaded server-side; in-form filter narrows by `applicableLevels`. Driven `lmsLabelPlatformApi.list({q?, level?})`, `LABEL_SEARCH_CAP` 50→500.

- **HEAD_COACH test-setup convention** (established Step 8.1c, WORKFLOW-001 closure): the seed creates exactly one `HEAD_COACH`; the `idx_single_head_coach` partial unique index allows only one. Any api-server test that needs its own `HEAD_COACH` fixture MUST first demote any pre-existing `HEAD_COACH` → `COACH` before promoting. Pattern in `authz/guards.test.ts`, `lms/plan-enrollment/admin.test.ts`, `iam/users-admin-actor-role.test.ts`, `lms/schema/admin.test.ts`, `lms/label/platform.test.ts`.
