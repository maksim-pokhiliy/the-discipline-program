# Step 3 — Output

## Что сделано

Step 3 ratified D5 (`Exercise.defaultDemoUrl String?` → `defaultDemoUrls String[]`) and shipped the first user-visible admin CRUD for the training-domain library: Exercise. Coach can create / list / search / filter / edit / delete `Exercise` records via `apps/admin` at `/exercises`. Backend reaches DB through `cmsExerciseAdminApi` handlers with `P2002` (canonicalName uniqueness) and `P2003` (FK-Restrict on `OneRMRecord`) intercepts that surface coach-readable messages. Schema input is hardened (NFKC + zero-width strip, http(s)-only URLs, length/array caps, cross-field placeholder consistency). 25 new tests cover the must-test scenarios — full Vitest suite 753 passing.

## Изменённые/созданные файлы

Phase 0 — schema refinement (D5):

- `analysis/artifacts/06-formalization/schema.prisma`
- `analysis/artifacts/06-formalization/implementation-notes.md` (added §0.5)
- `analysis/artifacts/06-formalization/er-final.md` (line + change-history row)
- `packages/api-server/prisma/schema.prisma`

Phase 1 — contracts (NEW directory + 6 files + barrel registration):

- `packages/contracts/src/entities/cms/exercise/exercise.constants.ts`
- `packages/contracts/src/entities/cms/exercise/exercise.schema.ts`
- `packages/contracts/src/entities/cms/exercise/exercise.types.ts`
- `packages/contracts/src/entities/cms/exercise/exercise-api.schema.ts`
- `packages/contracts/src/entities/cms/exercise/exercise-api.types.ts`
- `packages/contracts/src/entities/cms/exercise/index.ts`
- `packages/contracts/package.json` (`exports` map `+./cms/exercise`)

Phase 2 — api-server handlers + mapper + routes (NEW + 3 modify):

- `packages/api-server/src/mappers/cms/enum-maps.ts` (append-only)
- `packages/api-server/src/mappers/cms/exercise.mapper.ts` (NEW)
- `packages/api-server/src/mappers/cms/index.ts` (barrel)
- `packages/api-server/src/endpoints/cms/exercise/admin.ts` (NEW)
- `packages/api-server/src/endpoints/cms/index.ts` (barrel)
- `apps/admin/src/app/api/admin/exercises/route.ts` (NEW; GET list + POST create)
- `apps/admin/src/app/api/admin/exercises/[id]/route.ts` (NEW; GET one + PUT update + DELETE)
- `apps/admin/src/app/api/admin/exercises/page-data/route.ts` (NEW; list pre-fetch)
- `apps/admin/src/app/api/admin/exercises/movement-families/route.ts` (NEW; distinct values endpoint)

Phase 4 — client API + hooks (NEW + 4 modify):

- `apps/admin/src/lib/api/endpoints/exercises.ts` (NEW)
- `apps/admin/src/lib/api/endpoints/index.ts` (barrel)
- `apps/admin/src/lib/api/index.ts` (`createApi` registration)
- `apps/admin/src/lib/api/keys.ts` (`adminKeys.exercises`)
- `apps/admin/src/lib/hooks/use-exercises.ts` (NEW)
- `apps/admin/src/lib/hooks/index.ts` (barrel)

Phase 5 — admin module (NEW directory tree):

- `apps/admin/src/modules/exercises/constants.ts` (label maps)
- `apps/admin/src/modules/exercises/components/exercise-form.tsx`
- `apps/admin/src/modules/exercises/components/basic-info-card.tsx`
- `apps/admin/src/modules/exercises/components/classification-card.tsx`
- `apps/admin/src/modules/exercises/components/demos-and-aliases-card.tsx`
- `apps/admin/src/modules/exercises/components/notes-card.tsx`
- `apps/admin/src/modules/exercises/components/enum-select-field.tsx`
- `apps/admin/src/modules/exercises/components/secondary-movement-select.tsx`
- `apps/admin/src/modules/exercises/components/index.ts`
- `apps/admin/src/modules/exercises/sections/exercises-list-section/index.tsx`
- `apps/admin/src/modules/exercises/sections/index.ts`
- `apps/admin/src/modules/exercises/views/exercises-list-view/index.tsx`
- `apps/admin/src/modules/exercises/views/exercises-create-view/index.tsx`
- `apps/admin/src/modules/exercises/views/exercises-edit-view/index.tsx`
- `apps/admin/src/modules/exercises/views/exercises-edit-view/exercises-edit-form.tsx`
- `apps/admin/src/modules/exercises/views/index.ts`
- `apps/admin/src/modules/exercises/index.ts`

Phase 6 — pages + sidebar:

- `apps/admin/src/app/(dashboard)/exercises/page.tsx`
- `apps/admin/src/app/(dashboard)/exercises/create/page.tsx`
- `apps/admin/src/app/(dashboard)/exercises/[id]/page.tsx`
- `apps/admin/src/lib/config/navigation.ts` (new `Library` group → `Exercises`)

Phases 5/6 review-driven cleanup + tests:

- `apps/admin/src/modules/exercises/components/{basic-info-card,enum-select-field,secondary-movement-select}.tsx` — sub-component extraction per react/no-multi-comp.
- `packages/contracts/src/entities/cms/exercise/exercise.schema.ts` — trim + scheme refines + length/array caps + placeholder cross-field refine.
- `packages/contracts/src/entities/cms/exercise/exercise.constants.ts` — new length constants.
- `packages/api-server/src/endpoints/cms/exercise/admin.ts` — trim-then-lower order; clean controller spread.
- `apps/admin/src/modules/exercises/components/secondary-movement-select.tsx` — spread `{...field}` so RHF gets `onBlur`/`ref`.

Tests:

- `packages/api-server/src/endpoints/cms/exercise/admin.test.ts` (NEW, 9 integration tests against Neon dev DB).
- `packages/contracts/src/entities/cms/exercise/exercise.schema.test.ts` (NEW, 16 Zod unit tests).

Step 3 commits on `feat/training-domain` (since `241f711c`):

- `99a1859a` feat(api-server): refine exercise schema for multi-url demo array (d5)
- `75fff3d2` feat(contracts): add exercise cms contracts with mirrored enums
- `dacf4fc4` feat(api-server,admin): add exercise admin api handlers and routes
- `ed589554` feat(admin): wire exercise client api and tanstack hooks
- `8ff231d3` feat(admin): add exercise module form and list section
- `6dd50915` feat(admin): add exercise views and module barrel
- `ed9639a8` feat(admin): wire exercise pages and library sidebar group
- `8aef372b` fix(admin): extract exercise select sub-components per react/no-multi-comp
- `e639dec8` fix(exercise): apply stage 5 review findings
- `ede22451` fix(exercise): harden input validation per stage 6 qa findings
- `bc6e8db9` test(exercise): cover must-test scenarios from stage 6 qa

## Принятые решения

**Codebase pattern wins over prompt-spec (workflow rule 4 "existing patterns are sacred").** The prompt sketched several shapes that did not match how the admin app already operates; for each, the codebase pattern won after user ratification at the Stage 1 / Stage 2 approval gates:

- **No server-side pagination** (D2 ratified). Every CMS endpoint returns `z.array(entity)` capped at `DEFAULT_LIST_LIMIT = 100`. `DataTable` paginates client-side. Re-evaluate when the library passes ~500 exercises (a banner + cursor pagination is a small follow-up feature).
- **Single-value filters per enum** (D3 ratified). `DataTableFilter<T>` is single-value; multi-select extension would touch `@repo/ui` shared primitive. Filters: `primaryEquipment`, `movementTypeTagPrimary`, `canonicalCompoundType` each as single `Select`, plus `placeholderFlag` toggle. All ANDed.
- **Mirror enums in contracts + bridge map** (D11 ratified). Dependency-cruiser rule `contracts-no-prisma` (ERROR) blocks `@prisma/client` imports from contracts. Mirrored `EXERCISE_EQUIPMENT` / `EXERCISE_MOVEMENT_TYPE` / `EXERCISE_CANONICAL_COMPOUND_TYPE` arrays in `exercise.constants.ts`, identity `Record<>` bridges in `enum-maps.ts`. Pattern matches `BLOG_CATEGORY` precedent.
- **Raw `Date` timestamps in mapper** (D4 ratified). `contract.createdAt = z.date()`; mapper returns `row.createdAt` (not `.toISOString()`). RSC payload serialization handles `Date` transparently across the wire.
- **Client-side search via `Column.searchValue`** (D7 ratified). The prompt suggested backend search via `canonicalNameLower ILIKE` + `aliases::text ILIKE`; entire admin codebase does client-side. Aliases search merged into `canonicalName.searchValue` (`[canonicalName, ...aliases].join(" ")`) — a separate hidden-only aliases column would render an empty `<th>` slot.
- **Stack `spacing={3}`** (D10 ratified). Global memory entry `feedback_pattern_compliance.md` says `{4}`; the discipline-admin codebase dominates with `{3}` (41/61 occurrences). Project-specific override; memory entry should be updated to reflect this. Surfaced for user; ratified at Stage 2.
- **Form sub-card extraction (deviation from plan T22)**. The flat `exercise-form.tsx` was 313 LOC (above 300-LOC bar) AND tripped `react/no-multi-comp`. Split: `exercise-form.tsx` orchestrates 4 sub-cards (`basic-info-card`, `classification-card`, `demos-and-aliases-card`, `notes-card`) plus 2 reusable helpers (`enum-select-field`, `secondary-movement-select`). Each file ≤ 165 LOC. Only `ExerciseForm` re-exported via `components/index.ts`; sub-cards stay module-private.
- **Edit-view uses `createExerciseSchema` (deviation from plan T29)**. RFC ratified `updateExerciseSchema` for the edit form, but creating `useForm<UpdateExerciseInput>` with `.partial()` fields and `nullable().optional()` cascades makes RHF default-handling messy; the handler-side `buildExerciseUpdateData` spreads only `data.X !== undefined` keys regardless. Net effect on the wire: every PUT carries the full body (idempotent against Prisma `update`). Functionally correct; documented as accepted trade-off rather than re-typing.
- **`canonicalCompoundType` × `placeholderFlag` redundancy retained**. Dual-encoding survives this step. Schema-level `.refine()` enforces consistency (`placeholderFlag === (type === "PLACEHOLDER")`). Long-term collapse (drop the flag, derive on read) deferred to a future schema-migration step.
- **`aliases` stays `Json?`** (D8 ratified). Out of Step 3 scope to migrate to `String[]`. Mapper guards with a bounded `as string[] | null` narrowing — the single allowed `as` in the diff. Writes always flow through `z.array(z.string().min(1))`, so the column never holds anything other than a string array post-Phase 1.
- **`canonicalNameLower` exposed in DTO** (D7 ratified). Coach never inputs it, but read-only exposure lets the list view display the case-normalized form for debugging if needed. Cheap.
- **Movement-family autocomplete** wires `additionalInvalidateKeys: [adminKeys.exercises.movementFamilies()]` so newly-typed families appear immediately. `STALE_TIMES.FIVE_MINUTES` cap for cold cache.
- **TagsInput reuse** (D6 ratified). `@repo/ui`'s existing chip-input primitive handles both `aliases` and `defaultDemoUrls`. No per-chip URL validation in the component; Zod surfaces errors at submit via `notifyError`.
- **Admin auth (`withAdminAuth`) for all 4 routes**. Design.md frames Exercise as "coach library"; that is library-domain nomenclature, NOT a role-based access claim. The admin app's standard pattern (`withAdminAuth`) limits CRUD to ADMIN + HEAD_COACH; regular coaches consume the library via plan-builder (future). Same auth pattern as reviews/blog/contacts.
- **`stress-final.md`** retains the pre-D5 `defaultDemoUrl` mention. Out of scope per prompt §3 ("Do not touch in this step"). Documented as known-stale below.
- **`analysis/artifacts/00-meta/phase-06-prompt.md`** retains the pre-D5 mention; read-only-forever per prompt §2.
- **`db:reset` doesn't auto-seed** in this repo. Phase 0 explicit chain: `db:reset && db:seed`. Documented in plan; surfaced in verification.
- **Database is non-prod** per project memory `feedback_discipline_db_non_prod.md`. ADR-0019 — no `migrations/`, schema-edit + db:reset workflow.
- **prettier autoformat residue** on `analysis/artifacts/04-structure/labels-catalog.md` (read-only-forever zone) discarded pre-pipeline. Not Step 3 territory.

## Возникшие вопросы и как решены

- **Q (Stage 1)**: server-side pagination per prompt vs codebase client-side. **A**: codebase wins (D2).
- **Q (Stage 1)**: multi-select filters per prompt vs single-value codebase. **A**: codebase wins (D3).
- **Q (Stage 1)**: `@prisma/client` enum import in contracts. **A**: dep-cruiser blocks; mirrored enums + bridge map (D11).
- **Q (Stage 1)**: `.toISOString()` vs raw `Date`. **A**: raw `Date` matches codebase (D4).
- **Q (Stage 2)**: search backend vs client-side. **A**: client-side per codebase (D7).
- **Q (Stage 2)**: Stack `spacing={4}` per memory vs `{3}` per codebase. **A**: `{3}` (D10). Memory should be updated for this project specifically.
- **Q (Stage 4)**: lint `react/no-multi-comp` on sub-components. **A**: extracted to separate files (commit `8aef372b`); manifesto + project memory `feedback_one_component_per_file.md` agree.
- **Q (Stage 4)**: MUI 7 Autocomplete `renderInput` typing. **A**: `slotProps` pattern per `timezone-autocomplete.tsx` precedent.
- **Q (Stage 5)**: `canonicalName` trim ordering. **A**: `trim().toLowerCase()` (REV-014 fix) + Zod `.trim()` at schema layer (REV-015 fix).
- **Q (Stage 5)**: `SecondaryMovementSelect` dropping `field.ref`/`onBlur`. **A**: spread `{...field}` on Select (REV-002 fix).
- **Q (Stage 6)**: Zero-width chars bypass case-insensitive uniqueness. **A**: NFKC normalize + zero-width strip in Zod transform (QA-001 fix).
- **Q (Stage 6)**: `defaultDemoUrls` accepts `javascript:`. **A**: scheme refine to http/https only (QA-002 fix).
- **Q (Stage 6)**: Per-value + array length caps. **A**: `MAX_URL_LENGTH=2048`, `MAX_NOTES_LENGTH=10_000`, `MAX_ARRAY_LENGTH=20` (QA-004..007 fixes).
- **Q (Stage 6)**: `canonicalCompoundType=PLACEHOLDER` vs `placeholderFlag` mismatch. **A**: cross-field `.refine()` (QA-010 fix).
- **No hard-escalation triggers fired**. No `SchemeType` / `SETS_REPS as 9th archetype` / `per-block atomic save` / `coach always edit mode` / `plan-editor rollback` / ADR-0037/0041/0042/0043 references found in code (`grep` clean).

## Что отложено

- **`aliases Json? → String[]` schema migration**. Mapper uses bounded `as string[] | null` narrowing. Future schema step can flip the type for full symmetry with `defaultDemoUrls`.
- **`defaultLoad` UI surface**. Field is nullable in schema, no form input. Future step.
- **Multi-select `DataTableFilter`** (`@repo/ui` primitive extension). Would benefit plan-builder picker; out of Step 3.
- **Server-side pagination** (QA-008). Defer until library passes ~500 entries; would also surface a `total_count` banner in the list view.
- **`canonicalCompoundType` × `placeholderFlag` collapse** (QA-010 long-term). Drop the flag; derive `isPlaceholder = type === "PLACEHOLDER"` on read. Requires schema migration + UI swap.
- **ConfirmationModal stuck open on delete error** (QA-011). Project-wide pattern shared with reviews/blog/contacts; fix once in `useDeleteConfirmation` to flow to all modules.
- **Server-validation errors not inline on input** (QA-012). Same — project-wide. Centralized fix in `createCrudHooks` would expose `setError` chain to all callers.
- **`stress-final.md` `defaultDemoUrl` mention** (line 933). Out of scope per prompt §3; left stale with paper trail here.
- **`analysis/artifacts/00-meta/phase-06-prompt.md` `defaultDemoUrl` mention**. Read-only-forever per prompt §2; left stale.
- **Production rollout workflow**. Discipline-program DB is non-prod (Neon dev); when prod migrates we will need to switch from `db:reset` to migrate-deploy (separate ADR).
- **Pre-existing flaky blog test** (`cmsBlogAdminApi > updatePost > sets publishedAt on draft to published transition`) — observed once during the first test run (clock skew on Neon dev), passed on the second run. Not Step 3 territory; left as known-flaky.

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/1778666831/`

Contents:

- `research.md` — codebase research (1085 LOC).
- `design.md` — RFC (D1–D12 decision record).
- `plan.md` — 41-task decomposition.
- `review.md` — Stage 5 staff-engineer review (4 WARNINGs surfaced + 54 INFO).
- `qa.md` — Stage 6 adversarial QA (12 WARNINGs + 21 Must-Test scenarios).
- `tasks.md` — per-phase tracker.

## Сценарий смоук-теста

### Предусловия

- DB reset via `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed`.
- Auth: log in as admin user (credentials in existing seed; default `admin@example.com`).
- Browser at admin app: `http://localhost:3002`.
- Dev server up: `pnpm --filter admin dev` (or `pnpm dev` from monorepo root).

### Шаги

1. **Open Exercises page**

   - Action: navigate sidebar → "Library" → "Exercises".
   - Expected: page loads with empty `DataTable`, "Create Exercise" button visible top-right, "Search by name or alias" placeholder visible.

2. **Create first Exercise**

   - Action: click "Create Exercise".
   - Form pre-populated with defaults: `primaryEquipment=BARBELL`, `movementTypeTagPrimary=SQUAT`, `canonicalCompoundType=ATOMIC`, `placeholderFlag=off`, empty `aliases`/`defaultDemoUrls`, empty `notes`.
   - Fill: name="Back Squat", `movementFamily`="squat_variations", 1 URL chip `https://youtu.be/example`, 1 alias chip "BB Squat".
   - Submit.
   - Expected: redirect to `/exercises`; "Back Squat" row appears.

3. **Verify case-insensitive uniqueness**

   - Action: click "Create Exercise", fill name="back squat" (lowercase), required selects.
   - Submit.
   - Expected: toast with "Exercise with this name already exists"; form stays open; user can edit and retry.

4. **Verify zero-width invisible-char protection**

   - Action: copy "Back Squat" (with a ZWSP between words from a rich-text source), attempt create with that name.
   - Expected: same conflict toast — schema normalizes invisibles before lower-form derivation.

5. **Edit existing Exercise**

   - Action: click "Back Squat" row in list.
   - Expected: form pre-populated with previously saved values.
   - Modify: add another alias chip "BS".
   - Submit.
   - Expected: redirect to list; row reflects update (re-open edit to verify aliases).

6. **Filter by primary equipment**

   - Action: open list filter, select BARBELL.
   - Expected: "Back Squat" visible; if another exercise exists with DUMBBELL — it's hidden.

7. **Movement family autocomplete**

   - Action: open Create form again, click in "Movement Family" field.
   - Expected: dropdown shows "squat_variations" (from the row created in step 2).

8. **Create placeholder exercise (cross-field refine path)**

   - Action: name="Biceps placeholder", `primaryEquipment=DUMBBELL`, `movementType=PULL`, `compound=PLACEHOLDER`, but leave `placeholderFlag=off`.
   - Submit.
   - Expected: validation error on `placeholderFlag` ("must match canonicalCompoundType === 'PLACEHOLDER'"); form stays open. Toggle flag on, resubmit → row appears with placeholder icon (`?`).

9. **Delete Exercise (happy path)**

   - Action: click delete (trash icon) on "Biceps placeholder" row.
   - Expected: `ConfirmationModal` "Delete Exercise".
   - Click Confirm.
   - Expected: row disappears.

10. **Search by alias**

    - Action: type "BS" in search box.
    - Expected: "Back Squat" appears (matched by alias "BS" via `Column.searchValue`).

11. **(Optional) Verify delete-with-FK-Restrict**
    - Pre-condition: insert a `OneRMRecord` referencing one of the exercises (via Prisma Studio or SQL).
    - Action: try to delete that exercise.
    - Expected: ConflictError toast "Cannot delete: exercise is referenced by 1RM records or schema rows"; modal Cancel returns to list.

### Откат состояния

- `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed`.
- Returns to initial state (training_exercises empty, training_archetypes = 34, training_labels = 0).

## Verification notes

- `pnpm check-types`: green (16/16 turbo cache hit on final pass).
- `pnpm lint --max-warnings 0`: green (16/16; resolved `react/no-multi-comp` via commit `8aef372b`).
- `pnpm dep:check`: green (1040 modules, 1883 deps, zero `contracts-no-prisma` violations).
- `pnpm test`: green; 753 tests passed (added 25 in Step 3). Note: one observed flake on the first run in `cmsBlogAdminApi > updatePost > sets publishedAt on draft to published transition` (clock-skew, unrelated to Step 3, passed on retry).
- `pnpm --filter @repo/api-server exec prisma validate`: green.
- `pnpm --filter @repo/api-server exec prisma generate`: green (`Exercise.defaultDemoUrls: string[]` confirmed in generated types).
- Phase 0 `db:reset + db:seed`: green. Verified counts: `archetypes=34`, `exercises=0`, `labels=0`. Column type confirmed `text[]` (camelCase `defaultDemoUrls` — existing Prisma convention; no `@map` on field).
- Backwards-compat grep: zero hits for `defaultDemoUrl[^s]` in `packages/`/`apps/` outside allowed stale locations (`analysis/00-meta`, `stress-final.md`, `implementation/step-03/prompt.md`, `implementation/PLANNING_STATE.md`).
- New tests: 25 (9 integration in `exercise/admin.test.ts` + 16 unit in `exercise.schema.test.ts`).

## Acceptance criteria self-check

- [x] Phase 0: D5 applied to analysis-artifacts + real schema; `db:reset+seed` clean (`archetypes=34, exercises=0, labels=0`).
- [x] Phase 1: contracts (5 files + barrel + `package.json` exports).
- [x] Phase 2: handlers + mapper + endpoint barrel registration.
- [x] Phase 3: 4 admin API routes (`route`, `[id]`, `page-data`, `movement-families`).
- [x] Phase 4: client API + hooks + central barrel.
- [x] Phase 5: admin module (form, list section, views, module barrel).
- [x] Phase 6: 3 pages (`page`, `create/page`, `[id]/page`).
- [x] Phase 7: sidebar nav entry (new `Library` group + `Exercises` link).
- [x] Phase 8: type-check / lint / dep:check / test all green; smoke-test scenario documented.
- [x] No edits outside allowed scope (apps/marketing, apps/platform, apps/storybook, other admin modules — untouched).
- [x] No co-authored-by / generated signatures (verified `git log 241f711c..HEAD --grep="Co-Authored-By"` returns empty).
