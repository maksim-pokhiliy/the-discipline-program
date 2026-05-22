# Step 08.4 — Executor output report

> Wrapper: `/feature` **full** (9 stages). Branch: `feat/training-domain` (no cut — per `[[training-domain-workflow]]` + `[[always-via-feature-skill]]`). Commits: `ed386142`, `86489461`, `5adc007c`, `3e8b89de`, `95f719e5`, `7f1b6cbd`.

---

## Что сделано

Shipped the anchor of Step 8 — the first coach-visible Schema editor, end-to-end. A coach now opens a block, taps "add schema", picks one of 34 archetypes grouped by family, fills its param form, and the schema renders as a card inside the block (drag-reorder / edit / delete like blocks).

Two halves, per the prompt:

- **Phase 0 — archetype read-path.** `lmsArchetypePlatformApi.list(userId)` (api-server) → `mapToArchetype` → the platform route `GET /api/platform/archetypes` → `createArchetypesAPI` → the `use-archetypes` `useQuery` hook. Mirrors the `lms/label` platform-read slice. `createSchema` needs a seed-generated cuid `archetypeId` and the picker needs `family` per archetype — this read-path supplies both. An api-server endpoint test (7 scenarios) ships with it.
- **Phases 1-4 — plan-detail Schema editor UI.** `SchemaList` / `SchemaCard` / `AddSchemaButton` embedded in `BlockCard`; `ArchetypePicker` (all 34, grouped by family, zero availability logic); `SchemaEditorModal` dispatching by archetype to a param form; the `amrap-flat` and `n-rounds` param forms; the reusable `RestSpecFields` sub-editor; the archetype-name → form-component registry. Structurally mirrors the Block UI stack. CRUD wired onto the existing `use-schemas` hooks.

Ran through the full `/feature` pipeline: Research (zero § 0 drift, green baseline), Design (RFC — approach A ratified at the gate), Plan (14 atomic tasks / 3 commit boundaries), Implement (3 per-layer commits), Review (APPROVE, 0 CRITICAL — one WARNING fixed), QA (verdict C — severity re-assessed, see Q-4; fixes landed), Test (full suite green). Six commits on `feat/training-domain`, per-layer atomic, husky pre-commit + commit-msg + pre-push clean on every one, zero skip flags.

The contract Zod schemas (`archetype-params.schema.ts`, `cap-spec.ts`, `schema.schema.ts`, `archetype.schema.ts`), the Prisma schema, the seed, and `apps/admin` are **untouched** (prompt § 2). No `analysis/` update is owed — no domain-model / schema change.

---

## Изменённые/созданные файлы

**27 files, +1572 / −0** (purely additive — 19 new, 8 modified). `git diff e7e28487...HEAD`.

### Phase 0 — archetype read-path (api-server, 6 files)

| File                                                               | Type                                                |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| `packages/api-server/src/endpoints/lms/archetype/platform.ts`      | NEW — `lmsArchetypePlatformApi.list`                |
| `packages/api-server/src/endpoints/lms/archetype/index.ts`         | NEW — slice barrel                                  |
| `packages/api-server/src/endpoints/lms/archetype/platform.test.ts` | NEW — endpoint test (7 scenarios)                   |
| `packages/api-server/src/mappers/lms/archetype.mapper.ts`          | NEW — `mapToArchetype`                              |
| `packages/api-server/src/endpoints/lms/index.ts`                   | MOD — `export * from "./archetype"` (append)        |
| `packages/api-server/src/mappers/lms/index.ts`                     | MOD — `export * from "./archetype.mapper"` (append) |

### Phase 0 — archetype read-path (platform, 7 files)

| File                                                     | Type                                                      |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `apps/platform/src/app/api/platform/archetypes/route.ts` | NEW — `GET` handler (`createAuthGetHandler`)              |
| `apps/platform/src/lib/api/endpoints/archetypes.ts`      | NEW — `createArchetypesAPI`                               |
| `apps/platform/src/lib/hooks/use-archetypes.ts`          | NEW — `useArchetypes` (`useQuery`, `staleTime: Infinity`) |
| `apps/platform/src/lib/api/endpoints/index.ts`           | MOD — barrel append                                       |
| `apps/platform/src/lib/api/index.ts`                     | MOD — `createApi` `archetypes` key                        |
| `apps/platform/src/lib/api/keys.ts`                      | MOD — `platformKeys.archetypes`                           |
| `apps/platform/src/lib/hooks/index.ts`                   | MOD — barrel append                                       |

### Phases 1-4 — plan-detail Schema editor UI (14 files)

| File                                                     | Type                                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `…/plan-detail/components/schema-editor-types.ts`        | NEW — `SelectedArchetype`, `SchemaEditorMode`, `SchemaParamFormProps`           |
| `…/plan-detail/components/rest-spec-fields.tsx`          | NEW — `RestSpecFields` sub-editor + `restSpecFormSchema`                        |
| `…/plan-detail/components/n-rounds-form-schema.ts`       | NEW — `n-rounds` form schema + `toFormData`/`buildParams`/`buildBranchDefaults` |
| `…/plan-detail/components/amrap-flat-schema-form.tsx`    | NEW — `AmrapFlatSchemaForm`                                                     |
| `…/plan-detail/components/n-rounds-schema-form.tsx`      | NEW — `NRoundsSchemaForm`                                                       |
| `…/plan-detail/components/schema-param-form-registry.ts` | NEW — `SCHEMA_PARAM_FORM_REGISTRY`                                              |
| `…/plan-detail/components/schema-editor-modal.tsx`       | NEW — `SchemaEditorModal` (thin dispatcher)                                     |
| `…/plan-detail/components/archetype-picker.tsx`          | NEW — `ArchetypePicker`                                                         |
| `…/plan-detail/components/add-schema-button.tsx`         | NEW — `AddSchemaButton`                                                         |
| `…/plan-detail/components/schema-params-summary.tsx`     | NEW — `SchemaParamsSummary`                                                     |
| `…/plan-detail/components/schema-card.tsx`               | NEW — `SchemaCard`                                                              |
| `…/plan-detail/components/schema-list.tsx`               | NEW — `SchemaList`                                                              |
| `…/plan-detail/components/block-card.tsx`                | MOD — embeds `<SchemaList>` (no `BlockCardProps` change)                        |
| `…/plan-detail/components/index.ts`                      | MOD — 9 new component exports (append)                                          |

All 8 modified files are strictly append-only / internal-only edits: 7 barrels/registries gain new entries, the existing entries byte-identical; `block-card.tsx` gains a `<SchemaList>` render and its import, `BlockCardProps` unchanged → `block-list.tsx` untouched.

**Not committed by the executor:** `implementation/step-08.4/output.md` (this file) — left unstaged for the planner's `docs(step-08.4)` close-out commit (prompt § 6).

---

## Принятые решения

### D-EXEC-1 — approach (A): registry of self-contained `*SchemaForm` components (ratified at the Design gate)

The prompt § 2 / § 3 named `AmrapFlatParamsFields` / `NRoundsParamsFields` as fields-only components inside one form-owning `SchemaEditorModal` (mirror of `BlockEditorModal`, D-8.4-5). The Design stage found that literal model cannot be made type-safe: a single `SchemaEditorModal` owning one `useForm`, dispatched through a `Record` of heterogeneous per-archetype form configs, erases the per-archetype `TFormData` generic → forces a non-narrowing `as` at the registry lookup (`[[type-quality]]` violation). Surfaced via `AskUserQuestion`; the user ratified **approach (A)**: the registry is `Partial<Record<ArchetypeName, React.FC<SchemaParamFormProps>>>` of self-contained form components — `AmrapFlatSchemaForm` / `NRoundsSchemaForm` each own their `useForm` + form schema + `FormModal`; `SchemaEditorModal` becomes a thin dispatcher. `RestSpecFields` stays a sub-editor. The Block-stack form pattern (`FormModal` + `react-hook-form` + `zodResolver`) is preserved — relocated one level down into each `*SchemaForm`. All other D-8.4-1..9 are honored as written.

### D-EXEC-2 — RFC decisions D-1..D-8 implemented as designed

Registry `Partial<Record<…>>` (D-1); `n-rounds` form schema = local `z.discriminatedUnion("countForm")` (D-2, contract `archetypeRoundsSetsParamsSchema` stays flat); RestSpec form schema = local flat `z.object` + `superRefine` (D-3, derived `isRange` discriminator); `prisma.archetype.findMany` `orderBy: [{ family: "asc" }, { name: "asc" }]` (D-4); `use-archetypes` `staleTime: Infinity` (D-5); `SchemaParamsSummary` own file (D-6); `ArchetypePicker` on `BaseModal` not `FormModal` (D-7); create/edit as a discriminated `SchemaEditorMode` (D-8). `archetypeParams` assembled as the discriminated `{ archetype, params }` via an explicit contextual type annotation — cast-free, no `as const` even needed.

### D-EXEC-3 — `mapToArchetype` `name` field needs `archetypeNameSchema.parse(row.name)`

Design § 5.3.2 stated all `mapToArchetype` fields assign cast-free. True for `kind`/`family` (Prisma enums) and the two `Json` columns (`z.unknown()` accepts `Prisma.JsonValue`) — but **not** `name`: `Archetype.name` is a Prisma `String`, while the contract types it as `archetypeNameSchema` (a 34-literal union). A `String` is not assignable to the literal union without runtime narrowing. Resolved with the established codebase idiom — `mapToSchema` / `mapToSchemaRow` `.parse()` columns whose contract type is narrower than the Prisma type. `name: archetypeNameSchema.parse(row.name)` — a genuine narrowing with a fail-fast on a malformed seed row, not a cast. A minor adjustment to a § 5.3.2 imprecision; not a structural deviation.

### D-EXEC-4 — barrel: all 9 new components exported; the 2 `.ts` files not

`plan.md` Task 13's tentative default was to exclude `*SchemaForm` / `RestSpecFields` from `components/index.ts` ("intra-module only"). Overridden to match the **existing** barrel convention — it already exports intra-module sub-components (`EffortPercentField`, `HrZoneField`, `TimeCapFields`, …). So all 9 new `.tsx` components are barrel-exported; the 2 non-component `.ts` files (`schema-editor-types.ts`, `schema-param-form-registry.ts`) are not. Stage 5 review (INFO-2) confirmed this is the correct, convention-consistent call.

### D-EXEC-5 — `@repo/api-routes` not touched (commit boundary 2 collapsed)

Research + design confirmed `@repo/api-routes` carries only generic handler factories (`createAuthGetHandler`, …), no per-slice route-path definitions. The prompt § 6's "if it carries route definitions" conditional resolves NO — the archetype route path lives only in the route file's folder path and the `createArchetypesAPI` `client.request` call. The prompt's commit boundary 2 collapsed to "platform route + api + hook".

### D-EXEC-6 — `n-rounds-form-schema.ts` extraction (during the qa-fix)

The QA-204 validation-feedback wiring would have pushed `n-rounds-schema-form.tsx` over the eslint `max-lines` cap (300, `skipBlankLines`). Pre-empted with the extraction `design.md` § 6.1 / review INFO-1 already named: the `n-rounds` form schema, `toFormData` / `buildParams` / `buildBranchDefaults`, and the `DEFAULT_*` constants moved into a non-component `n-rounds-form-schema.ts` (not barrel-exported, same as `schema-editor-types.ts`). The component file dropped to ~210 non-blank LOC; review INFO-1 is closed as a side effect.

### D-EXEC-7 — orchestrator re-assessed the Stage 6 QA severity ratings

QA scored the diff **C** with 2 CRITICAL. The orchestrator re-assessed both as WARNING and one QA "WARNING" as a non-issue — see Q-4. The QA findings themselves (the traced mechanisms) are sound; only the severity labels and one fix-prescription were disputed, with reasoning, and the dispositions were ratified by the user.

---

## Возникшие вопросы и как решены

### Q-1 — approach (A) renames ratified-named components (Design gate)

See D-EXEC-1. Surfaced at the Stage 2 gate with the type-safety rationale + a recommendation; user ratified (A). Not silently adopted.

### Q-2 — WARN-1: `*SchemaForm` `useEffect(reset, [mode])` clobbers in-progress edits (Stage 5 review)

Both `*SchemaForm` components re-sync the form via `useEffect(() => reset(toFormData(mode)), [mode, reset])` — lifted from `BlockEditorModal`, which is safe only because its `block` prop is a stable query reference. The Schema forms receive `mode` as an object literal built inline by `AddSchemaButton` / `SchemaCard` → new identity every parent render → the effect fires on any week-query refetch (incl. `refetchOnWindowFocus`) and `reset()` discards the coach's input. Surfaced; user chose fix; fixed in `3e8b89de` — `useMemo` the `mode` object in both parents (type-safe: the create-side memo returns `SchemaEditorMode | null`, no `!`).

### Q-3 — `mapToArchetype` `name` field

See D-EXEC-3. A § 5.3.2 imprecision; resolved with the codebase `.parse()` idiom; reported, not silently adapted.

### Q-4 — Stage 6 QA verdict C / 2 CRITICAL — re-assessed

- **QA-201 (param integers unbounded — `1e9`, `1e21` persist).** Re-rated **WARNING**, and the fix is **out of 8.4's scope.** The contract schemas (`positiveInt`, `z.number().positive()`) are themselves unbounded and frozen (§ 2) — the form correctly mirrors them. A real ceiling ("max AMRAP duration / rounds / reps") is a domain decision with no spec citation; a form-only `.max()` would invent a bound, drift the form stricter than the contract, and still be bypassed by the unbounded backend. **No `.max()` added.** User-decided: escalate as a domain-model follow-up (see Что отложено).
- **QA-203 + QA-209 (edit-mode `toFormData` downgrades `range`/`count_times_reps` → `exact` when a sub-field is absent).** Re-rated **WARNING** — the trigger (a malformed `n-rounds` row with `countForm: "range"` but `countRange` absent) is **not reachable** in the current project: `NRoundsSchemaForm` is the only writer of `n-rounds` schemas and its discriminated-union form schema always emits a complete branch. The fix is cheap, correct, in-scope (form UX logic, no contract change) → fixed in `95f719e5`: `toFormData` now branches on `params.countForm` itself and defaults only the missing sub-field; the fall-through to `exact` fires only for an unexpected `countForm`.
- **QA-202 (WARN-1 fix "incomplete" — double-click).** Re-rated **non-issue.** The double-click race re-seeds the form at open-time — within the picker's ~225 ms close transition, before the coach types anything. While the modal is open the picker is closed and `pendingArchetype` cannot change, so the `reset` effect cannot clobber actual input. The WARN-1 fix is complete for the real bug. No action.
- **QA-204 (no per-field validation feedback — a rejected value gives a dead Save button).** Legitimate **WARNING**; the codebase precedent (`block-editor-modal`) is equally thin, so this is a codebase-wide UX gap, not an 8.4 regression — surfaced. User chose to fix in 8.4 → fixed in `95f719e5`: `fieldState.error` wired into every `Controller`-rendered `TextField`/`Select` in all 3 forms; the `countRange` cross-field refine got `path: ["max"]`; `RestSpecFields` (a controlled component) got a typed `error` prop fed from `formState.errors.rest`.
- **QA-205 (`countForm` toggle resets the shared `count`)** and **QA-206 (`RestSpec` `rangeMax` `?? 0`)** — folded into `95f719e5` (`handleCountFormChange` carries `count` forward across `exact`↔`count_times_reps`; `?? 0` → `?? ""`).
- **QA-207** (unwindowed `SchemaList` — matches `BlockList`) — INFO, no action. **QA-208** (endpoint test `>= 34` not exact) — INFO; the optional tightening (assert the returned `name` set equals the 34 `ARCHETYPE_NAMES`) folded into `7f1b6cbd`.

### Q-5 — Stage 7: the endpoint test's ordering assertion was a test bug

The full `pnpm test` run surfaced one failure — in the net-new `archetype/platform.test.ts` itself, the `returns archetypes ordered by family then name` case. Root cause: the test asserted family order with a JS string `<=` (alphabetical), but `ArchetypeFamily` is a Postgres enum and Prisma `orderBy: { family: "asc" }` sorts by **enum declaration order** (`ROUNDS_SETS → LADDER → TIME_CAP → COMPOSITE_ROUNDS → …`), not alphabetical (`TIME_CAP` precedes `COMPOSITE_ROUNDS`). The endpoint's `orderBy` is correct (D-4-sanctioned); its real contract is contiguous family grouping with name-sorted rows inside each group — all the picker's single-pass grouping needs. The test was rewritten (`7f1b6cbd`) to assert exactly that — collation-independent; the endpoint was not touched. A test bug introduced in `ed386142`, caught and fixed in-pipeline.

---

## Что отложено

- **QA-201 — param integer upper bounds → domain-model question for the planner.** `durationMin` / `count` / `countRange` / `repsPerSet` / RestSpec `value` / `rangeMax` are unbounded in the frozen contract. A real ceiling is a ratified contract change (`archetype-params.schema.ts` + `cap-spec.ts`), a separate sub-step per the WORKFLOW.md domain-model change protocol — not a form-only patch. **No bound was invented.** The planner decides whether the domain wants ceilings.
- **Toast-policy carry-forward (D-8.4-8)** — schema mutations toast as-is via `useWeekMutation`; the editor-wide success-toast policy change stays a separate `/feature small`.
- **QA-001c** (`lmsSchemaApi.create` P2002 under concurrent create), **QA-B4** (`reorder` racing `create` — `retryOnP2034`), **QA-023** (pre-existing `block/admin.test.ts:406` flake) — codebase-wide carry-forwards (`03-deferred.md`); not folded; confirmed not regressed by 8.4.
- **QA-202** — no action (non-issue, see Q-4). **QA-207** — `SchemaList` unwindowed, matches `BlockList`; revisit only if real plans surface blocks with dozens of schemas.
- **The 32 remaining archetype param forms** — Steps 8.5-8.20. Each adds one `*SchemaForm` file + one `SCHEMA_PARAM_FORM_REGISTRY` entry; `ArchetypePicker` is unchanged (it already renders all 34).
- **Sub-schema / nested archetypes** — Steps 8.18-8.20 (8.4 uses the `{ blockId }` reorder branch only).
- **SchemaRow body editor** — Step 9 (8.4 renders schema cards with empty bodies, no placeholder text per D-8.4-4).

---

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1779382741/` — the `/feature` full pipeline artifacts: `research.md` (Stage 1 — zero § 0 drift, green baseline), `design.md` (Stage 2 — the RFC, approach A), `plan.md` (Stage 3 — 14 tasks), `review.md` (Stage 5 — APPROVE, score A), `qa.md` (Stage 6 — verdict C, the findings), `tasks.md` (the implementation tracker). The planner prompt § 0–§ 9 is the upstream spec; `.feature-dev/` is the execution-time research / design / review / QA layer on top.

---

## Сценарий смоук-теста

**Статус: браузерный прогон — за пользователем** (per WORKFLOW.md — the user runs UI smoke-tests). Below is the prompt § 9 scenario with the expected result per step; the executor's programmatic proxy evidence follows.

**Preconditions:** `db:reset` + `db:seed` (done — 34 archetypes seeded); the platform dev server (`pnpm --filter platform dev`, port 3001); logged in as the seeded coach; a draft training plan open.

1. Open the plan → a week → a day → add a session → add a block. **Expected:** the block card shows label/notes/intensity affordances + an "add schema" button, no schemas.
2. Tap "add schema". **Expected:** the `ArchetypePicker` opens — 34 archetypes grouped by family, all clickable, none greyed.
3. Pick `amrap-flat`. **Expected:** a one-field form "Duration (minutes)". Enter `12`, save. **Expected:** a schema card in the block (header / params summary "AMRAP 12 min"); body empty, no placeholder text.
4. Tap "add schema" → pick `n-rounds`. **Expected:** a `countForm` toggle (Exact / Range / Count × reps), conditional count fields, an optional rest sub-editor. Fill "5 rounds × 8 reps, rest 90 sec between rounds", save. **Expected:** a second schema card.
5. Drag the second schema above the first. **Expected:** order swaps, persists on reload.
6. Open the first schema's menu → Edit → change a param → save. **Expected:** the card updates.
7. Tap an unimplemented archetype (e.g. `ladder-spike`) in the picker. **Expected:** nothing opens, no error.
8. Delete a schema via the menu → confirm. **Expected:** the card disappears, persists on reload.

**Executor proxy evidence (programmatic):** `db:reset` + `db:seed` succeeded with 34 archetypes; the api-server endpoint test (7 scenarios) is green against the real seeded DB — `lmsArchetypePlatformApi.list` returns the exact 34-name set, coach-gated, `(family, name)`-grouped; `check-types` 16/16, `lint` 16/16 0-warnings, `dep:check` 0 violations; the Stage 5 review and Stage 6 QA traced the picker no-op (step 7), the empty-body card (steps 3-4), the optimistic reorder + rollback (step 5), and the edit flow (step 6) through the actual code. Final UI confirmation of steps 1-8 is the user's browser run.

---

## Verification notes

| Gate                   | Result                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check-types`     | **16/16** successful                                                                                                                            |
| `pnpm lint`            | **16/16** successful, 0 warnings (`--max-warnings 0`)                                                                                           |
| `pnpm dep:check`       | **0 violations** (1302 modules, 2475 dependencies)                                                                                              |
| `pnpm test` (Stage 7)  | **132 test files passed, 1701 tests passed**; `archetype/platform.test.ts` 7/7; `block/admin.test.ts:406` (QA-023) did not flake; no regression |
| `db:reset` + `db:seed` | clean — **34 archetypes** seeded                                                                                                                |

**Commits** — 6, per-layer atomic, on `feat/training-domain`, husky pre-commit + commit-msg + pre-push clean on each, zero `--no-verify` / `--no-edit` / `--no-gpg-sign`:

- `ed386142` — `feat(api-server): add lmsarchetypeplatformapi endpoint mapper and barrels`
- `86489461` — `feat(platform): add archetype read api endpoint and use-archetypes hook`
- `5adc007c` — `feat(platform): add schema editor ui with archetypepicker and crud`
- `3e8b89de` — `fix(platform): memoize schema editor mode to prevent form reset on re-render` (WARN-1)
- `95f719e5` — `fix(platform): surface schema form validation errors and preserve edit-mode field state` (QA-203/204/205/206/209)
- `7f1b6cbd` — `test(api-server): assert archetype list returns the exact 34-name set` (QA-208 + the Q-5 ordering-test fix)

Phase 0 is additive — the new archetype endpoint/hook is dead code until the UI consumes it — so every intermediate tree stays green under pre-commit's `turbo check-types --filter="...[HEAD]"`; per-layer atomic, no squash, per D-8.4-9 / `[[husky-cross-package-squash]]`.

---

## Acceptance criteria self-check

Prompt § 4. Build/test/code criteria verified directly; UI-behavioural criteria (AC-3/4/5) verified by Stage 5 review + Stage 6 QA code-tracing — final confirmation is the § 9 browser run (AC-10).

| #   | Criterion                                                                                                                                                  | Status | Notes                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------- |
| 1   | Phase 0 — `lmsArchetypePlatformApi.list()` returns all 34; `mapToArchetype`, route, `createArchetypesAPI`, `use-archetypes` shipped; api-server test green | ✓      | endpoint test 7/7, exact-34-name-set asserted                               |
| 2   | `BlockCard` renders `SchemaList` below the intensity/timeCap summary; empty block shows `AddSchemaButton` only                                             | ✓      | `block-card.tsx` embed; `SchemaList` gates the `DndContext` on `length > 0` |
| 3   | `ArchetypePicker` lists all 34 grouped by family; every entry clickable; no disabled/greyed/"coming soon"                                                  | ✓      | zero availability logic — Stage 5 + QA Scenario 4a confirmed                |
| 4   | `amrap-flat` → one-field form → card; `n-rounds` → `countForm`-conditional + optional RestSpec → card; unimplemented archetype → no modal, no error        | ✓      | registry `undefined` no-op in `AddSchemaButton`; QA Scenario 4a             |
| 5   | `SchemaCard` — drag-reorder (optimistic + rollback), Edit, Delete (`ConfirmationModal`); body not rendered, no placeholder                                 | ✓      | mirrors `BlockCard`/`BlockList`; D-8.4-4 honored                            |
| 6   | `archetypeParams` built as discriminated `{ archetype, params }`; `createSchema` gets the cuid `archetypeId` + `kind`                                      | ✓      | cast-free assembly; QA Scenario 8a confirmed the cuid path                  |
| 7   | No Prisma / seed / `archetypeParams` Zod change; `apps/admin` untouched                                                                                    | ✓      | none in the diff (`git diff --name-only` verified)                          |
| 8   | `check-types` 16/16; `lint` 16/16 0 warnings; `pnpm test` green; `dep:check` 0                                                                             | ✓      | see Verification notes                                                      |
| 9   | Per-layer atomic commits on `feat/training-domain`, dependency order; husky clean; zero skip flags                                                         | ✓      | 6 commits; all hooks clean                                                  |
| 10  | The browser smoke-test (§ 9) passes                                                                                                                        | ⏳     | pending — user-run per WORKFLOW.md                                          |
