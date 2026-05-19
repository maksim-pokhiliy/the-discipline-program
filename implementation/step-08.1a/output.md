# Step 8.1a — `lmsSchemaApi` (CRUD + two-pass reorder + parent-vs-child discriminated create) + `verifySchemaOwnership` + `mapToSchema`

> Executor cycle for `implementation/step-08.1a/prompt.md` per `/feature` 9-stage pipeline. Branch-cut override active: все 5 коммитов легли прямо на `feat/training-domain`, без `--no-verify`. Артефакты Stage 1-7 — в `.feature-dev/1779188538/`.

---

## Что сделано

- `lmsSchemaApi.{create, update, delete, reorder}` ships в `packages/api-server/src/endpoints/lms/schema/admin.ts` (304 LOC; ESLint `max-lines: 300` mitigated через D-1 extract). 4 метода зеркалируют `lmsBlockApi` precedent с четырьмя Schema-специфичными расхождениями: D10 discriminated scope `{blockId} | {parentSchemaId}` на `create` + `reorder`; archetype consistency cross-checks внутри tx (`tx.archetype.findUnique` + `kind` + `archetypeParams.archetype` literal alignment); sub-schema invariants (`parent.kind === "NESTED"` + `data.kind ∈ {ATOMIC, HEADERLESS}`); structural-fields-immutable on `update` (`kind`/`archetypeId`/`parentSchemaId`/`blockId` → `BadRequestError`).
- `verifySchemaOwnership` guard в `packages/api-server/src/authz/guards.ts` — 8-полевой контекст `{status, blockId, sessionId, dayId, weekId, planId, parentSchemaId, kind}` с креатор-self short-circuit + ADMIN/HEAD_COACH bypass; покрыто 4 кейсами в `guards.test.ts`.
- `mapToSchema` mapper в `packages/api-server/src/mappers/lms/schema.mapper.ts` — 25 LOC; три `.parse(...)` на Json-колонки (`archetypeParamsSchema` / `intensitySchema` / `trailingConnectorSchema`) с ternary для nullable; zero `as` casts (только `as PrismaSchema` import-rename).
- `retryOnP2034` wraps только `create` Serializable tx (D-3 ratify). 2-pass reorder uniform для top-level + sub-scope (`-(i+1)` → `(i+1)*10`) — anticipates Step 8.3.7 partial-unique constraint `schemas_block_top_order`.
- 33 интеграционных кейса в `schema/admin.test.ts` (29 базовых + 2 QA gap-fills из Stage 7) + 4 кейса в `guards.test.ts` через real Postgres (Neon DEV per ADR-0019).
- D-1 contingency сработал: `assertArchetypeConsistency` + `assertSubSchemaInvariants` extracted в sibling `assertions.ts` (57 LOC) — `admin.ts` приземлился на 304 raw / 256 non-blank LOC.

## Изменённые/созданные файлы

**Новые (5)**:

- `packages/api-server/src/endpoints/lms/schema/admin.ts` (304 LOC) — `lmsSchemaApi.{create, update, delete, reorder}` slice + local `CreateScope` discriminated union + `STRUCTURAL_UPDATE_KEYS` module-scope const.
- `packages/api-server/src/endpoints/lms/schema/admin.test.ts` (1295 LOC, 33 кейса) — интеграционные тесты по 10 thematic groups (auth, top-create, sub-create, archetype-consistency, update, JsonNull, structural-immutable, delete-cascade, reorder dual-scope, 2-pass reverse).
- `packages/api-server/src/endpoints/lms/schema/assertions.ts` (57 LOC) — sibling helpers `assertArchetypeConsistency` (async tx-bound) + `assertSubSchemaInvariants` (sync); extracted per D-1 ESLint mitigation.
- `packages/api-server/src/endpoints/lms/schema/index.ts` (1 LOC) — barrel `export * from "./admin"`; структурная симметрия с `block/index.ts`.
- `packages/api-server/src/mappers/lms/schema.mapper.ts` (25 LOC) — `mapToSchema(s: PrismaSchema): Schema` с тремя Zod-парсами; zero `as` casts.

**Изменённые (5)**:

- `packages/api-server/src/authz/guards.ts` (+84 строк) — `verifySchemaOwnership` дописан зеркалом `verifyBlockOwnership` с extra JOIN-level (`schema → block → session → day → week → plan`) + 2 extra fields (`parentSchemaId`, `kind`); `import { type SchemaKind } from "@repo/contracts/lms/schema"` добавлен в шапку.
- `packages/api-server/src/authz/guards.test.ts` (+102 строки) — 4 кейса в `describe("verifySchemaOwnership")`: creator-owns / non-owner-rejected / HEAD_COACH-bypass / not-found.
- `packages/api-server/src/endpoints/lms/index.ts` (+1 строка) — `export * from "./schema"` в strict-alphabetic позиции (между `./plan-enrollment` и `./session`).
- `packages/api-server/src/mappers/lms/index.ts` (+1 строка) — `export * from "./schema.mapper"` (между `./plan-enrollment.mapper` и `./session.mapper`).
- `packages/contracts/package.json` (+4 строки) — D-4 prereq drift fix: добавлены 4 exports-map entries (`./lms/archetype`, `./lms/schema`, `./lms/schema-pairing`, `./lms/schema-row`) в alphabetic порядке, ранее не зашиты в Step 8.0b.

**Итого**: 5 new + 5 edited = 10 файлов, ~1874 строк inserted, 0 строк removed.

## Принятые решения

- **D-1 ESLint `max-lines: 300` mitigation fired** — `admin.ts` после Phase 3 wrap приземлился на 304 raw / 256 non-blank LOC, что укладывается в ESLint `skipBlankLines: true` config-bar (verified clean). Extraction `assertArchetypeConsistency` + `assertSubSchemaInvariants` в sibling `assertions.ts` сделан pre-emptively per Stage 4 wrap-time decision, чтобы оставить headroom для будущего `resolveStorageContext` (per FIND-001 review note). 2-way reversible; если 3rd callsite в Step 8.1b/c — promote в `endpoints/lms/_shared/`. Non-impact на behaviour — helpers вызываются с tx-параметром, идентично inline-форме.
- **D-2 Phase 4 test case target 28-32 — итог 33** — слегка превысили upper-cap из-за Stage 7 +2 must-test gap-fills (QA-Must-Test-36 `parentSchemaId: null` rejection + QA-Must-Test-37 duplicate-ids defense-in-depth). 29 baseline + 2 gap-fills = 31 в основной серии + 2 reorder edge-cases = 33. Per D-2 «no upper cap; quality > quantity per manifesto 2.5» — acceptable. Test runtime прирост ~3-5 сек (внутри 15s budget).
- **D-3 `retryOnP2034` wraps `create` only** — `update`/`delete` используют default-isolation single-statement; `reorder` — default-isolation `prisma.$transaction([...])` array form. P2034 surfaces only inside Serializable txs (которыми обернут только `create`). QA-B4 (reorder concurrent-create SSI race без retry) deferred to Step 8.2 HTTP layer retry, per § 5.7 ratify + design.md § 7 D-3 consequences.
- **D-4 prereq commit bundles all 4 exports-map entries** — Step 8.1a-named scope формально требует только `./lms/schema`, но drift root affected all 4 entity barrels (`archetype`, `schema`, `schema-pairing`, `schema-row`). Per `[[inline-fix-pre-existing]]` — 4 lines, same file, same single PR window. Steps 8.1b/c уже не триггерят prereq-dance; zero functional impact на 8.1a.
- **D-5 mapper via `.parse()`, не `as` casts** — три Zod `.parse(...)` (ternary для `intensity` + `trailingConnector` nullable; direct для `archetypeParams` non-null). Zero `as ArchetypeParams` / `as Intensity` / `as TrailingConnector` / `as unknown as ...`. DB-content drift surfaces explicitly через `ZodError` → `InternalServerError(kind: "DbCorruption")` per `handlePrismaError` ZodError arm. Per manifesto 2.3 + `[[type-quality]]`.
- **D-6 2-pass reorder uniform для обоих scopes** — top-level (`{blockId}` + `parentSchemaId === null` filter) и sub-scope (`{parentSchemaId}`) применяют одинаковую 2-pass UPDATE форму. Sub-scope технически не нуждается (partial-unique `schemas_block_top_order` в Step 8.3.7 покроет только top-level), но uniform код яснее. Cost ≈ 1 wasted UPDATE per ID per pass на sub-reorders (negligible).

## Возникшие вопросы и как решены

Без escalations через § 0 — все verbatim quotes byte-for-byte matched HEAD `2d8a4409` per Stage 1 Research + Stage 2 Design verification. Stage 1 зафиксировал 3 paraphrase imprecisions в prompt (non-material):

- § 0.5 omits `ZodError` arm в `handlePrismaError` (lines 50-60) — реальный mapper триггерит этот arm через `<schema>.parse(...)` при DB corruption.
- § 0.7 пишет `_shared/connector-form.ts`, актуальная локация — `_shared/enums.ts:29`, re-exported через `_shared/index.ts` barrel; import path `from "../_shared"` корректен.
- § 0.1 не упоминает 5-й метод `assignLabels` на `lmsBlockApi:251-291`. Schema корректно опускает (нет M:N labels surface на Schema entity).

**Adversarial QA findings (Stage 6, see `.feature-dev/1779188538/qa.md` § K), deferred to planner triage**:

- **QA-B4 (WARNING)** — reorder без `retryOnP2034`; concurrent create на том же scope может потерять reorder под SSI. Mirrors Block precedent; UX gap. Defer to Step 8.2 HTTP layer retry semantics.
- **QA-C2 (WARNING)** — `handlePrismaError` не маппит P2028 (tx-timeout) — surfaces как raw 500. Out-of-zone (file unmodified by Step 8.1a). Recommend separate `/fix` ticket.
- **QA-D1 (WARNING)** — `reorderSchemasSchema.orderedIds` имеет `.min(1)` без `.max()` cap; DoS-class via tx timeout на гигантских массивах. Out-of-zone (Step 8.0b contracts territory). Recommend Step 8.0b follow-up или `/fix`.
- **QA-E3 (WARNING)** — все 4 guards (Plan, Block, Schema, plus eventual Row/Pairing) propagate `PrismaClientValidationError` на `userId = undefined`. Cross-guard 4 × 2-line defensive fix превышает inline-fix threshold (5 LOC). Recommend separate `/fix` covering all guards uniformly.
- **QA-F2 (WARNING)** — delete-blocked-by-PerformedExerciseInstance surfaces как misleading "Referenced Schema does not exist" P2003 message. Defer to Step 8.1b/c (SchemaRow API + delete-blocked semantics).
- **INFO findings (8 items)** — int32 overflow on `_max(order)+10` (QA-A3), UTF-16 vs codepoint length semantics (QA-A4), discriminated-scope runtime-erasure {blockId, parentSchemaId} silent top-route (QA-A5), P2034 retry-exhaustion deterministic (QA-B1), P2003 message imprecision Block-vs-Schema (QA-B2), last-writer-wins reorder без optimistic-concurrency (QA-B5), duplicate-id error reports `missing: []` (QA-F3 — partially covered Stage 7 test C30), `TxClient` structural-typing leak (QA-I1). Purely advisory; no action required this step.

Stage 5 review surfaced **FIND-001 (WARNING)**: `lmsSchemaApi.create` body at 132 lines exceeds manifesto 2.2 soft cap of 100. Drivers: discriminated-scope full TOCTOU re-fetch (~45 lines) + 3-Json-column conditional marshalling (~20 lines) + tx-wrapper boilerplate. Block precedent `create` at 91 lines; Session at 88. Acceptable per «up to 100 with explicit reason» rule, but flagged as candidate for `resolveStorageContext` helper extraction в Step 8.1b/c (~35-line savings, brings to ~97 lines). Effort S; not blocking.

Stage 5 surfaced **FIND-002 (INFO)**: pre-existing timing flake `block/admin.test.ts:406` (assertion `expect(elapsed).toBeLessThan(50)` на retryOnP2034 skip-on-P2002). Surfaced на run 1, прошло на run 2 — non-deterministic под Neon DEV latency variance. Originated commit `44945d92` (Step 7.1). Out-of-zone; recommend `/fix` ticket targeting bound loosening.

## Что отложено

- **`mapToSchemaWithBody` recursive mapper** — Step 8.3.5 trigger когда `schemas[]` embed в `blockSchema` response landed.
- **`DAY_INCLUDE` / `BLOCK_WITH_LABELS_INCLUDE` hoist** — Step 8.3.5+ trigger когда 3rd outside callsite материализуется.
- **`lmsSchemaRowApi` (SchemaRow CRUD)** — Step 8.1b.
- **`lmsSchemaPairingApi` (SchemaPairing CRUD)** — Step 8.1c.
- **Partial-unique constraint `schemas_block_top_order`** — Step 8.3.7 (запустит partial-unique через `apply-sql-checks.ts`).
- **`db:reset:for-tests` alias + WORKFLOW-001 fix** — Step 8.3.7-pre per D13.
- **HTTP routes для Schema CRUD** — Step 8.2 (`apps/platform/src/app/api/.../schemas/...`).
- **Client API + TanStack Query hooks** — Step 8.3 (`apps/platform/src/lib/api/endpoints/schemas.ts`).
- **UI surface** — Step 8.4+ `ArchetypePicker` + `archetypeParams` typed forms per discriminator (34-variant); coach-visible Schema editor.
- **Optional `resolveStorageContext` helper extraction** — bring `create` from 132 LOC ближе к Block precedent 91. Defer to Step 8.1b/c rule-of-two trigger per FIND-001.
- **All Adversarial QA findings (5 WARNING + 8 INFO)** noted выше for triage to planner. QA-D1/C2/E3 are S-effort defense-in-depth; QA-B4/F2 — feature decisions для Step 8.2/8.1b/c.
- **`z.nativeEnum` migration в `lms/plan-enrollment` + `lms/training-plan`** — Step 8.0b Q-1 carry-forward; separate `/feature small` (не Step 8.1a's scope).

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1779188538/` — содержит:

- `research.md` (Stage 1, ~1300 LOC) — verbatim verification HEAD `4d280c55` + affected-area map + existing-patterns trace.
- `design.md` (Stage 2, ~720 LOC) — § 5 architecture + § 6 alternatives (A-D) + § 7 decision record (D10/D12 restate + D-1..D-6) + § 9 DoD mirror.
- `plan.md` (Stage 3, ~510 LOC) — 9 atomic tasks + commit map + risk register + branch-cut override carry-forward.
- `review.md` (Stage 5, ~280 LOC) — APPROVED-WITH-WARNINGS; 21/21 acceptance criteria pass; FIND-001 + FIND-002 logged.
- `qa.md` (Stage 6, ~770 LOC) — DEGRADED (0 CRITICAL, 5 WARNING, 8 INFO); § K findings summary + § L 43-item must-test list + § M verdict.
- `tasks.md` (Stage 3 skeleton).

## Сценарий смоук-теста

**N/A** — api-server-only step. UI smoke возобновится Step 8.4 (`ArchetypePicker` + 34-variant `archetypeParams` typed forms = первый coach-visible Schema editor). Step 8.2 (HTTP routes) и Step 8.3 (client hooks) — backend/wiring only, без visual surface.

## Verification notes

| Gate                                                                                                                         | Expected               | Got                                                                                                                                                                                                                          | Status |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `pnpm check-types` (root)                                                                                                    | 16/16 green            | 16/16 green (30.5s, 12 cached + 4 fresh)                                                                                                                                                                                     | ✓      |
| `pnpm lint` (root)                                                                                                           | 16/16 0 warnings       | 16/16 0 warnings (9.56s)                                                                                                                                                                                                     | ✓      |
| `pnpm --filter @repo/api-server test`                                                                                        | ~620-624 cases         | 625 cases (baseline 588 post-Step 8.0b + 33 schema/admin.test.ts + 4 guards.test.ts = 625; превышает upper-target на 1 из-за Stage 7 +2 must-test gap-fills per D-2)                                                         | ✓      |
| `pnpm test` (root)                                                                                                           | ~1358-1362 cases       | runs Stage 9 (root vitest currently executing in background; review.md confirmed 622+1flake → 623 для api-server и Stage 7 +2 gap-fills = 625; root total ~1361-1363 expected)                                               | TBD    |
| `pnpm dep:check`                                                                                                             | 0 violations, +4-5     | 0 violations, 1252 modules (was 1247 baseline; +5 new modules = admin.ts, admin.test.ts, schema/index.ts, schema.mapper.ts, assertions.ts; D-1 contingency fired)                                                            | ✓      |
| Regression grep — `RowKind.CONNECTOR\|rowKind: "CONNECTOR"` (apps + packages)                                                | 0 hits                 | 1 hit: `packages/contracts/src/entities/lms/schema-row/schema-row.schema.test.ts:200` — NEGATIVE D12 regression guard test (`success).toBe(false)`), intentional, не violation                                               | ✓      |
| Regression grep — `SchemeType\|per-block atomic save\|coach always edit mode\|plan-editor rollback` (apps/packages/analysis) | 0 hits                 | 0 hits                                                                                                                                                                                                                       | ✓      |
| Import count — `@repo/contracts/lms/schema` consumers in `packages/api-server/src/`                                          | 4 files                | 4 files: `endpoints/lms/schema/admin.ts`, `endpoints/lms/schema/assertions.ts`, `mappers/lms/schema.mapper.ts`, `authz/guards.ts` (admin.test.ts использует type inference через `lmsSchemaApi` signature — strictly better) | ✓      |
| Husky pre-commit / pre-push hooks                                                                                            | green, zero skips      | 5 commits all clean — no `--no-verify`, no `--no-edit`, no `--no-gpg-sign`; `check-secrets` + `lint-staged` + `turbo check-types --filter="...[HEAD]"` all green                                                             | ✓      |
| Branch verification (`git rev-parse --abbrev-ref HEAD`)                                                                      | `feat/training-domain` | `feat/training-domain` (long-lived; no `feat/<slug>` cut)                                                                                                                                                                    | ✓      |
| `analysis/` directory diff                                                                                                   | empty                  | empty (`git diff analysis/` returns 0 lines)                                                                                                                                                                                 | ✓      |

**Commits trail** (5 commits on `feat/training-domain` between HEAD `f8bf917b` and Stage 0 baseline `4d280c55`):

```
f8bf917b test(api-server): cover qa must-test gaps for lmsschemaapi
0d7c6943 feat(api-server): add lmsschemaapi with crud and two-pass reorder
4da6d75a feat(api-server): add lms schema mapper with archetypeparams intensity trailingconnector parse
bee94b97 feat(api-server): add verifyschemaownership guard for schema ownership chain
3545ab52 feat(contracts): add archetype schema schema-pairing schema-row to exports map
```

(Commit 6 `docs(step-08.1a): write executor output report` создаётся сейчас этим Stage 8 cycle'ом.)

## Acceptance criteria self-check

Per prompt § 5 (21 items) — все evidence из Stage 5 review.md + Stage 7 audit. Каждый ✓ + brief evidence (file path + line range или test ID).

1. ✓ **All 4 `lmsSchemaApi` methods implemented** — `admin.ts:28-304` (create/update/delete/reorder); no stubs, no `NotImplementedError`.
2. ✓ **`verifySchemaOwnership` returns 8-field shape** — `guards.ts:241-322`; tests `guards.test.ts:309-318, :327-337`.
3. ✓ **`mapToSchema` via `.parse()` not `as` casts** — `schema.mapper.ts:18-21` three `.parse(...)` calls; zero value-casts.
4. ✓ **D10 discriminated scope** — `admin.ts:22` `type CreateScope`; narrowed via `"blockId" in scope` at `:36, :69, :243, :253, :270`; storage `blockId` resolves to top-level Block (sub: `parent.blockId` at `:110`); test C11 (`admin.test.ts:498-527`) asserts `stored?.blockId === ctx.block.id`.
5. ✓ **Sub-schema invariants enforced server-side** — `assertSubSchemaInvariants(parent.kind, data.kind)` at `assertions.ts:42`; called inside tx at `admin.ts:108`; tests C12-C14 (`admin.test.ts:529-592`).
6. ✓ **Archetype consistency** — `assertArchetypeConsistency(tx, archetypeId, dataKind, paramsArchetype)` at `assertions.ts:11`; called at `admin.ts:114`; tests C8-C10 (`admin.test.ts:431-496`).
7. ✓ **`retryOnP2034` wraps `create` only** — `admin.ts:50` sole call site; update/delete/reorder unwrapped (lines 198, 230, 290).
8. ✓ **Structural-fields-immutable on `update`** — `admin.ts:26` `STRUCTURAL_UPDATE_KEYS`; filter+throw at `:167-174`; test C19 (`admin.test.ts:713-754`) + QA-Must-Test-36 (`:756-781`) covers `parentSchemaId: null` explicit case.
9. ✓ **archetypeParams variant alignment on `update`** — `admin.ts:176-195` separate-read then literal compare; test (`admin.test.ts:689-711`).
10. ✓ **`Prisma.JsonNull` marshalling** — `admin.ts:140-147` (create), `:206, :209-212` (update); test (`admin.test.ts:630-661`) verifies stored row reads back DB-null.
11. ✓ **Reorder dual-scope correctness** — `admin.ts:253-287`; tests C25-C31 (`admin.test.ts:907-1224`): happy top, happy sub, subset rejection, foreign-scope rejection, non-existent rejection, duplicate-ids rejection (QA-Must-Test-37 `:1148-1193`), top-not-touched-by-sub.
12. ✓ **Canonical 2-pass reorder** — `admin.ts:290-297` Phase 1 `-(i+1)`, Phase 2 `(i+1)*10`; test (`admin.test.ts:1195-1233`) full reverse N=5.
13. ✓ **Cascade behaviour verified** — test C22 (`admin.test.ts:785-842`) creates parent NESTED + sub ATOMIC + sibling + SchemaRow + SchemaPairing; deletes parent; asserts all 4 dependents cascade-deleted, sibling preserved.
14. ✓ **Concurrent create P2034-retry** — test C7 (`admin.test.ts:388-429`) `Promise.allSettled([create1, create2])`; `fulfilledCount >= 1`; `stored.length === fulfilledCount`; if both fulfilled, orders `[10, 20]`.
15. ✓ **Zero `--no-verify` / `--no-edit` / `--no-gpg-sign` / `Co-Authored-By` / `Generated`** — `git log 4d280c55..HEAD` 5 commits verified clean via grep; full Husky pre-commit + pre-push trail.
16. ✓ **Per-step verification all-green** — check-types 16/16 (30.5s), lint 16/16 0 warnings (9.56s), `pnpm --filter @repo/api-server test` 625 passes (623 при review + 2 QA gap-fills = 625; превышает 624 upper-target на 1 — acceptable per D-2 «no upper cap»), dep:check 0 violations / 1252 modules / +5 from 1247 baseline. Root `pnpm test` deferred to Stage 9.
17. ✓ **Regression greps return 0 hits** — `RowKind.CONNECTOR` returns 1 NEGATIVE regression-guard test (intentional, `success).toBe(false)`), zero positive uses; `SchemeType\|per-block atomic save\|coach always edit mode\|plan-editor rollback` returns 0 hits across packages/apps/analysis/source.
18. ✓ **`@repo/contracts/lms/schema` consumers** — 4 files exact: `endpoints/lms/schema/admin.ts`, `endpoints/lms/schema/assertions.ts`, `mappers/lms/schema.mapper.ts`, `authz/guards.ts`. `admin.test.ts` uses type inference through `lmsSchemaApi` signature (strictly better — fewer imports, equivalent type safety).
19. ✓ **No `as ArchetypeParams` / `as Intensity` / `as TrailingConnector` / `as unknown as ...` in mapper** — verified via grep. Only `as PrismaSchema` (type-import rename, line 1) and `as const` on `STRUCTURAL_UPDATE_KEYS` (literal narrowing, not bypass).
20. ✓ **Branch convention** — `git rev-parse --abbrev-ref HEAD` = `feat/training-domain`; `git branch | grep -E "feat/(lmsschema|schema|step-08)"` empty; `git log --oneline feat/training-domain ^main` shows Step 7.x + 8.0a + 8.0b + 8.1a commits with zero foreign refs.
21. ✓ **No analysis-artifacts touch** — `git status` clean for `analysis/`; `git diff 4d280c55..HEAD -- analysis/` returns 0 lines.

**Result**: 21/21 prompt acceptance criteria pass. Stage 5 review verdict **APPROVED-WITH-WARNINGS** (FIND-001 cleanup + FIND-002 pre-existing flake; neither gates Stage 6/7/8/9). Stage 6 QA verdict **DEGRADED** (0 CRITICAL, 5 WARNING, 8 INFO; all deferred to follow-up steps or `/fix` tickets per § «Что отложено»).

---

**Status**: green for shipping. Step 8.1a establishes the `lmsSchemaApi` slice with full coach-authoring CRUD + 2-pass reorder + discriminated parent-vs-child create + ownership guard + Zod-validated mapper. Handoff к Step 8.1b (`lmsSchemaRowApi`) готов — все Schema-уровневые primitives canonical.
