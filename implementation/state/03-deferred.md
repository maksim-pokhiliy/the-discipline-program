# Deferred sub-decisions / carry-forwards

> Active + closed carry-forwards. Default hypothesis applied; revisit on contact. Resolved items struck through with closing commit reference.

## Active (12 items as of 2026-05-18)

### Pre-Step-8 cleanup candidates

- **QA-001b — `Session @@unique([dayId, order])` mirror constraint** (WARNING; Step 7.3.6 D-2 carry-forward). Session model has identical `@@index([dayId, order])` without `@@unique`; same SSI-mechanism protection as pre-Step-7.3.6 Block (Step 6.4.5 `retryOnP2034` wrap on `lmsSessionApi.create`); same latent regression surface when Step 8 Schema adds more concurrent write paths. **Action when triggered**: mirror Step 7.3.6 implementation pattern — schema edit + `lmsSessionApi.reorder` two-pass rewrite + 2 tests + analysis sync. Single atomic commit. `/feature small` pipeline.

- **QA-001c — `retryOnP2034` widening к also retry P2002 on `_max+N` insert pattern** (INFO; Step 7.3.6 D-2 carry-forward). Post-`@@unique` constraint, loser сейчас видит immediate P2002 ConflictError вместо retry. Helper extension (new variant `retryOnConcurrentInsertRace` taking both P2002 + P2034 codes) preserves prior concurrent UX где two simultaneous creates often produced fulfilledCount=2. **Action when triggered**: design new variant helper в `packages/api-server/src/utils/`; apply к `lmsBlockApi.create` + `lmsSessionApi.create` (if QA-001b shipped) + `lmsDayMetadataApi.{setLabel,setNotes}`. Step 7.x or pre-Step-8 cleanup.

- **QA-023 — Flaky timing-proxy assertion в `packages/api-server/src/endpoints/lms/block/admin.test.ts:406`** (INFRA/test-quality; Step 7.4 carry-forward). Test uses `expect(elapsed).toBeLessThan(50)` proxy для verifying absence of retry. Threshold too tight под нагрузкой (1/3 repeat runs fail at 68ms). **Fix options**: (1) widen threshold к 200ms; (2) replace timing-proxy с call-counter spy via `vi.spyOn`; (3) verify absence of retry via `retryOnP2034` internal logging. **Action when triggered**: pick option at next opportunity OR separate `/fix` loop; prefer (1) для minimal-touch fix.

### Step 8 surface triggers

- **WORKFLOW-001 — `db:seed` vs test suite incompatibility through `idx_single_head_coach`** (Step 7.3.6 D-3 carry-forward; landing Step 8.3.7-pre per D13). `apply-sql-checks.ts:1-6` creates partial unique index blocking 2nd HEAD_COACH user; seed creates 1; tests create their own → P2002. Workflow requires «`db:reset` alone before tests» convention but undocumented. Options surfaced в `step-07.3.6/output.md` and D13: (a) new `db:reset:for-tests` alias; (b) test setup find-and-reuse seed HEAD_COACH; (c) document «reset-without-seed-and-checks» convention в WORKFLOW.md. Picks at 8.3.7-pre thesis.

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
