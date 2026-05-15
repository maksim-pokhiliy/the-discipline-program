# Step 4 — Admin Label CRUD

> Self-contained prompt for execution by a fresh Opus 4.7 (1M context), max-effort session.

## Who you are

You are the executor for Step 4 of a multi-step workflow that integrates a training-domain model into the `the-discipline-program` monorepo. You are NOT the planner. The planner is in a separate session; the user shuttles prompts and outputs between you. Today is **2026-05-13**.

## Why this step exists

This is the **fourth** attempt at this domain. Prior attempts are deleted; memory entries about them have been purged. If you find any code, comment, or memory trace referencing `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — **STOP**, surface to the user.

Steps 1-3 are committed on branch `feat/training-domain` (current HEAD `919b836d`). The DB has the full training-domain schema; `training_archetypes` has 34 rows; `training_exercises` / `training_labels` are empty (libraries — coach populates via admin UI). Step 3 shipped the **first** admin catalog CRUD — Exercise — at `apps/admin/src/modules/exercises/`. It went through `/feature` Stage 1-6, was smoke-tested by the user, and is now the **canonical reference template** for catalog-library CRUD.

Step 4 ships the **second** admin CRUD: **Label**. It is a near-copy of Step 3 with one new pattern (`applicableLevels` multi-value widget). Coach can create / list / search / filter / edit / delete `Label` records via `apps/admin` at `/labels`.

## Workflow rules (hard constraints)

1. **Scope** — Step 4 is allowed to modify:
   - `packages/contracts/src/entities/cms/label/` (NEW directory + files + barrel + `package.json` exports)
   - `packages/api-server/src/endpoints/cms/label/` (NEW directory + handler + endpoints barrel)
   - `packages/api-server/src/mappers/cms/label.mapper.ts` (NEW)
   - `packages/api-server/src/mappers/cms/enum-maps.ts` (append AppLevel bridge — append-only)
   - `packages/api-server/src/mappers/cms/index.ts` (barrel)
   - `apps/admin/src/app/api/admin/labels/` (NEW routes)
   - `apps/admin/src/lib/api/endpoints/labels.ts` (NEW client API)
   - `apps/admin/src/lib/api/endpoints/index.ts` (barrel)
   - `apps/admin/src/lib/api/index.ts` (`createApi` registration)
   - `apps/admin/src/lib/api/keys.ts` (append `adminKeys.labels`)
   - `apps/admin/src/lib/hooks/use-labels.ts` (NEW hooks)
   - `apps/admin/src/lib/hooks/index.ts` (barrel)
   - `apps/admin/src/modules/labels/` (NEW module)
   - `apps/admin/src/app/(dashboard)/labels/` (NEW pages: list, create, [id])
   - `apps/admin/src/lib/config/navigation.ts` (append "Labels" link to existing "Library" group)
   - `implementation/step-04/output.md` (NEW final report)
2. **Do not touch**:
   - `analysis/**` — Label model is correct as-is in `packages/api-server/prisma/schema.prisma`; **no schema refinement this step**, **no analysis-artifact sync**.
   - `packages/api-server/prisma/schema.prisma` — Label model already shipped in Step 2; do NOT edit.
   - `apps/marketing/`, `apps/platform/`, `apps/storybook/`
   - Other admin modules (auth, blog, contacts, pages, products, reviews, users, exercises) — match patterns but do not modify. **Exception**: shared barrels listed in scope above (`hooks/index.ts`, `endpoints/index.ts`, etc.) are append-only edits.
   - Prisma seeders, lock files, CI configs, `.gitignore`
3. **Existing patterns are sacred** — and this time you have the perfect reference: **Step 3's `apps/admin/src/modules/exercises/` module + `packages/contracts/src/entities/cms/exercise/` + `packages/api-server/src/{endpoints,mappers}/cms/exercise*`**. Step 4 is a structural copy. Read the Exercise implementation FIRST, mirror it, adapt for Label's smaller field set. Do NOT invent.
4. **No co-authored-by, generated-by, "Generated with Claude Code"** signatures anywhere.
5. **No `--no-verify`, `--no-edit`, `--no-gpg-sign`** in git operations.
6. **No comments inside code** unless they encode a non-obvious _why_ (single-line only).
7. **Russian for chat-prose with the user, English inside files.**
8. **Question protocol**: ask with hypothesis. Do not ask without one.
9. **Commitlint**: subject must be **fully lowercase** (no capital letters anywhere in the subject line, including acronyms — write `d5` not `D5`, `label` not `Label`). Body lines ≤ 150 chars. (Learned the hard way in Steps 1-3.)

## Use `/feature` (full pipeline)

Invoke `/feature` (NOT `/feature small`). Even though Step 4 is a near-copy, the full pipeline's Stage 1 RFC validates the one new pattern (`applicableLevels` widget) and Stage 5/6 review/QA catch subtle UX bugs — exactly the kind that slipped through Step 3 (`placeholderFlag` field silently rejected submit because the Controller render didn't subscribe to `fieldState`; only manual smoke-test caught it). Selector:

> `/feature implement Admin Label CRUD per implementation/step-04/prompt.md.`

`.feature-dev/<ts>/` artifacts will be created; reference that path in `output.md`.

## Canonical reference — read these FIRST, mirror their patterns

Step 3's Exercise implementation is the template. Before writing anything, read in full:

**Contracts** (`packages/contracts/src/entities/cms/exercise/`):

- `exercise.constants.ts` — mirror-enum + `EXERCISE_CONSTANTS` length-cap object pattern
- `exercise.schema.ts` — `normalizeText` NFKC + zero-width strip helper, `normalizedString(max)` helper, base object + `.refine()` pattern, separate `createXSchema` / `updateXSchema` (`.partial()`)
- `exercise.types.ts` — type exports from schemas
- `exercise-api.schema.ts` + `exercise-api.types.ts` — list query / response wrappers
- `index.ts` — barrel
- `packages/contracts/package.json` — the `exports` map entry `./cms/exercise`

**Backend** (`packages/api-server/src/`):

- `endpoints/cms/exercise/admin.ts` — `cmsExerciseAdminApi` handlers: list / getById / create / update / delete; `P2002` (unique conflict) + `P2003` (FK Restrict) intercept pattern; `name.trim().toLowerCase()` lower-form derivation
- `mappers/cms/exercise.mapper.ts` — Prisma → DTO; raw `Date` passthrough (NO `.toISOString()`); bounded `as` narrowing for `Json` field (`aliases`)
- `mappers/cms/enum-maps.ts` — enum bridge `Record<>` pattern
- `endpoints/cms/index.ts`, `mappers/cms/index.ts` — barrels

**Admin app** (`apps/admin/src/`):

- `app/api/admin/exercises/{route.ts, [id]/route.ts, page-data/route.ts}` — route handlers, `withAdminAuth` wrapper
- `lib/api/endpoints/exercises.ts` — client API factory
- `lib/hooks/use-exercises.ts` — `createCrudHooks` usage
- `lib/api/keys.ts` — `adminKeys.exercises` query-key factory
- `lib/config/navigation.ts` — `ADMIN_NAVIGATION`; "Library" group already exists (line ~21) with "Exercises"
- `modules/exercises/index.ts` — module barrel
- `modules/exercises/constants.ts` — label maps for enums
- `modules/exercises/components/{exercise-form.tsx, basic-info-card.tsx, classification-card.tsx}` — form orchestrator + sub-cards; note `classification-card.tsx` has the `FormControl error={...}` + `FormHelperText` pattern for surfacing field errors (the `placeholderFlag` fix from Step 3.1 — copy this pattern for `applicableLevels`)
- `modules/exercises/sections/exercises-list-section/index.tsx` — `DataTable`, `Column<T>[]`, `DataTableFilter<T>[]` (single-value, `match: (item, value) => ...`), `useDeleteConfirmation`, `ConfirmationModal`, `Column.searchValue`, `CreateButton`
- `modules/exercises/views/{exercises-list-view, exercises-create-view, exercises-edit-view}/` — `QueryWrapper` / `FormView` wiring
- `app/(dashboard)/exercises/{page.tsx, create/page.tsx, [id]/page.tsx}` — thin page wrappers

## Label spec (from `packages/api-server/prisma/schema.prisma`, do NOT edit schema)

```prisma
model Label {
  id               String @id @default(cuid())
  name             String
  nameLower        String @unique
  applicableLevels Json
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  days             Day[]
  sessions         Session[]
  blockAssignments BlockLabelAssignment[]
  @@index([name])
  @@map("training_labels")
}

enum AppLevel { DAY  SESSION  BLOCK }
```

Field mapping to UI / contracts:

- **`name`** — required string. `nameLower` is auto-derived in the backend handler (`name.trim().toLowerCase()` — match the trim-then-lower order from Step 3 REV-014), `@unique` for case-insensitive uniqueness. `nameLower` is NOT a form input; it MAY be exposed read-only in the DTO (Step 3 exposed `canonicalNameLower` — match that choice).
- **`applicableLevels`** — `Json` column holding a **non-empty subset** of `["DAY", "SESSION", "BLOCK"]`. This is THE new pattern of Step 4. See §"New pattern" below.
- **`notes`** — optional string, `TextField multiline`. Apply `MAX_NOTES_LENGTH` cap (reuse 10_000 like Step 3).

## New pattern — `applicableLevels` multi-value widget

This is the only thing Step 4 introduces beyond the Exercise template. Ratified decisions (do not re-litigate):

- **Storage**: keep `Json` column as-is (mirrors Step 3's `aliases Json?` decision — no schema refinement, no migration). Mapper uses bounded `as AppLevelValue[]` narrowing — the single allowed `as` in the mapper diff. Writes always flow through the Zod array schema, so the column never holds anything but a valid subset.
- **Zod**: mirror `AppLevel` in `label.constants.ts` as `APP_LEVELS = ["DAY", "SESSION", "BLOCK"] as const`. Schema field: `z.array(z.enum(APP_LEVELS)).min(1).max(3)` — non-empty, no duplicates concern at max 3 (optionally `.refine` for uniqueness if trivial; otherwise skip — UI checkboxes can't produce dups).
- **UI widget**: `FormGroup` with three `Checkbox` controls (DAY / SESSION / BLOCK), each toggling membership in the array. At least one must be checked.
- **Error surfacing**: the widget MUST subscribe to `fieldState` and render the validation error in a `FormHelperText` with `FormControl error={...}` — exactly the pattern in `classification-card.tsx` (the Step 3.1 fix). Do NOT repeat the Step 3 bug where a Controller render ignored `fieldState` and the form silently rejected submit.
- **Extract** the widget into its own file `apps/admin/src/modules/labels/components/applicable-levels-field.tsx` (per `react/no-multi-comp` + project memory `feedback_one_component_per_file.md`).
- **List rendering**: 1-3 `Chip`s (one per level).
- **List filter**: a single-value `DataTableFilter` "Applicable Level" with `match: (label, value) => (label.applicableLevels ?? []).includes(value)`.
- **Search**: `Column.searchValue` on `name` only (not `applicableLevels` — enum names are noise for substring search).

## Ratified decisions inherited from Steps 1-3 (apply faithfully)

- **Mirror enums, never `@prisma/client` import in contracts** — `.dependency-cruiser.cjs` rule `contracts-no-prisma` blocks it. Mirror `AppLevel` as a `const` array in `label.constants.ts`; bridge in `mappers/cms/enum-maps.ts`.
- **Raw `Date` in mapper** — `contract.createdAt = z.date()`; mapper returns `row.createdAt` directly. RSC payload serializes `Date` across the wire. No `.toISOString()`.
- **Client-side pagination** — list endpoint returns `z.array(label)` capped at the existing `DEFAULT_LIST_LIMIT` (100). `DataTable` paginates client-side. No server-side pagination.
- **Single-value `DataTableFilter`** — do not extend the `@repo/ui` primitive.
- **Client-side search** via `Column.searchValue`.
- **`name` + `nameLower`** dual-field — backend derives `nameLower` as `name.trim().toLowerCase()`; no `citext`.
- **`Stack spacing={3}`** for content vertical rhythm (forms, cards, view bodies) — discipline-admin codebase convention; verify against the canonical Exercise files.
- **`withAdminAuth`** on all API routes — same as Exercise.
- **`P2002`** → readable conflict error ("Label with this name already exists"). **`P2003`** → readable FK-Restrict error ("Cannot delete: label is in use"). Generic message, no per-pathway query (Label is FK'd from `Day.labelId`, `Session.labelId`, `BlockLabelAssignment.labelId` — all `onDelete: Restrict`; one generic message covers all three).

## Phases

### Phase 1 — Contracts

NEW directory `packages/contracts/src/entities/cms/label/`:

- `label.constants.ts` — `LABEL_CONSTANTS` (`MAX_NAME_LENGTH: 200`, `MAX_NOTES_LENGTH: 10_000`), `APP_LEVELS` mirror const + `AppLevelValue` type
- `label.schema.ts` — reuse the `normalizeText` / `normalizedString` helper shape from `exercise.schema.ts` (copy the helpers — they are not currently shared; if you see them already extracted to a shared module, reuse that instead). `labelSchema` (full DTO incl. `id`, `nameLower`, `createdAt`, `updatedAt`), `labelFormBase`, `createLabelSchema`, `updateLabelSchema` (`.partial()`).
- `label.types.ts` — inferred types
- `label-api.schema.ts` + `label-api.types.ts` — list query/response wrappers (mirror `exercise-api.*`)
- `index.ts` — barrel
- `packages/contracts/package.json` — add `./cms/label` to the `exports` map

### Phase 2 — Backend handlers + mapper

- `packages/api-server/src/mappers/cms/enum-maps.ts` — append AppLevel bridge map (append-only; do not reorder existing)
- `packages/api-server/src/mappers/cms/label.mapper.ts` — `mapPrismaToLabel`; raw `Date`; `applicableLevels` bounded `as AppLevelValue[]` narrowing
- `packages/api-server/src/endpoints/cms/label/admin.ts` — `cmsLabelAdminApi`: list / getById / create / update / delete; `nameLower` derivation; `P2002` / `P2003` intercepts
- Register in `packages/api-server/src/{endpoints,mappers}/cms/index.ts` barrels

### Phase 3 — Admin API routes

NEW under `apps/admin/src/app/api/admin/labels/`:

- `route.ts` — GET list + POST create
- `[id]/route.ts` — GET one + PUT update + DELETE
- `page-data/route.ts` — list pre-fetch

All wrapped with `withAdminAuth` (match Exercise routes).

### Phase 4 — Client API + hooks

- `apps/admin/src/lib/api/endpoints/labels.ts` — client API factory (mirror `exercises.ts`)
- `apps/admin/src/lib/api/endpoints/index.ts` — barrel
- `apps/admin/src/lib/api/index.ts` — `createApi` registration
- `apps/admin/src/lib/api/keys.ts` — append `adminKeys.labels` factory
- `apps/admin/src/lib/hooks/use-labels.ts` — `createCrudHooks` usage (mirror `use-exercises.ts`)
- `apps/admin/src/lib/hooks/index.ts` — barrel

### Phase 5 — Admin module

NEW `apps/admin/src/modules/labels/`:

- `constants.ts` — `APP_LEVEL_LABELS: Record<AppLevelValue, string>` (`DAY → "Day"`, `SESSION → "Session"`, `BLOCK → "Block"`)
- `components/label-form.tsx` — single `FormCard "Basic info"` with `Stack spacing={3}`: `name` TextField, `<ApplicableLevelsField />`, `notes` multiline TextField. **Single card, no Grid 2-column split** (Label has only 3 fields; the Exercise `exercise-form.tsx` Grid orchestrator is overkill here — use a flat `FormCard` like the simpler admin modules). If the flat form exceeds the 300-LOC ESLint bar, split — but it will not.
- `components/applicable-levels-field.tsx` — the new widget (see §"New pattern")
- `components/index.ts` — barrel (export `LabelForm` only; `ApplicableLevelsField` stays module-private unless the form file needs it cross-imported — keep it co-located)
- `sections/labels-list-section/index.tsx` — `DataTable` with columns (Name link, Applicable Levels chips, Created, Actions), single-value filter "Applicable Level", `useDeleteConfirmation` + `ConfirmationModal`, `CreateButton href="/labels/create"`, `Column.searchValue` on name
- `sections/index.ts` — barrel
- `views/labels-list-view/index.tsx` — `QueryWrapper` → `LabelsListSection`
- `views/labels-create-view/index.tsx` — `FormView` + `LabelForm`
- `views/labels-edit-view/index.tsx` — `QueryWrapper` → `LabelsEditForm`
- `views/labels-edit-view/labels-edit-form.tsx` — `FormView` + `LabelForm` pre-populated
- `views/index.ts` — barrel
- `index.ts` — module barrel

### Phase 6 — Pages

NEW `apps/admin/src/app/(dashboard)/labels/`:

- `page.tsx` — renders `LabelsListView`
- `create/page.tsx` — renders `LabelsCreateView`
- `[id]/page.tsx` — `await params`, renders `LabelsEditView id={id}`

### Phase 7 — Sidebar nav

`apps/admin/src/lib/config/navigation.ts` — append `{ text: "Labels", href: "/labels", icon: "labels" }` to the existing "Library" group's `links` array (the group already contains "Exercises"). If the `icon` registry does not have a `"labels"` key, pick the closest existing icon and note it in `output.md` "Принятые решения" — do NOT invent an icon asset.

### Phase 8 — Verification + smoke-test scenario

`/feature` pipeline runs:

- `pnpm check-types` — must be green (16/16)
- `pnpm lint --max-warnings 0` — green
- `pnpm dep:check` — zero `contracts-no-prisma` violations
- `pnpm test` — all green; add contract unit tests (mirror `exercise.schema.test.ts`) + integration tests (mirror `exercise/admin.test.ts`) for: name uniqueness (case-insensitive), `applicableLevels` empty rejection, `applicableLevels` invalid-value rejection, create / update / delete happy paths, `P2003` FK-Restrict path

Write a **manual smoke-test scenario** in `output.md` §"Сценарий смоук-теста" (предусловия / нумерованные шаги / ожидаемый результат после каждого / откат) covering at minimum:

1. Open `/labels` — empty table
2. Create label "Push Day", applicableLevels = [DAY] → row appears
3. Create label "push day" (lowercase) → case-insensitive conflict toast
4. Create label with **no** applicableLevels checked → validation error surfaces inline under the widget (this is the Step-3-bug regression guard — the error MUST be visible, not a silent no-op)
5. Edit "Push Day" → add SESSION level → row chips update
6. Filter by "Applicable Level" = SESSION → only labels with SESSION shown
7. Search "push" → matches by name
8. Delete an unused label → ConfirmationModal → row gone
9. (Optional) Delete a label referenced by a Day/Session → `P2003` "label is in use" toast

### Phase 9 — Write `implementation/step-04/output.md`

Exact section headers: `## Что сделано`, `## Изменённые/созданные файлы`, `## Принятые решения`, `## Возникшие вопросы и как решены`, `## Что отложено`, `` ## Ссылка на `.feature-dev/<ts>/` ``, `## Сценарий смоук-теста`, `## Verification notes`, `## Acceptance criteria self-check`.

## Hypothesis bank (apply silently; document in output.md "Принятые решения")

- **`normalizeText` / `normalizedString` helpers**: if Step 3 left them inline in `exercise.schema.ts` (not shared), copy them into `label.schema.ts`. If a follow-up commit extracted them to a shared contracts util — reuse. Do not create a new shared abstraction just for this — copying ~6 lines is fine; if a third entity needs them later, extract then.
- **`nameLower` in DTO**: expose read-only (Step 3 exposed `canonicalNameLower`). Match.
- **`applicableLevels` uniqueness**: checkboxes structurally can't produce dups; skip a `.refine` for it unless trivially cheap.
- **Filter `id`**: use `applicableLevels` as the filter `id`; `match` checks `.includes(value)`.
- **`APP_LEVEL_LABELS`**: title-case singular ("Day", "Session", "Block").
- **Empty-state message**: "No labels yet. Create the first one!" (mirror Exercise).
- **`searchPlaceholder`**: "Search by name".
- **Form layout**: flat single `FormCard`, no Grid orchestrator. If you find a simpler admin module (reviews) uses a flat form — match that exactly.
- **Pagination / list cap**: reuse `DEFAULT_LIST_LIMIT` constant, do not redefine.

## Hard escalation triggers (STOP and surface in output.md + chat)

1. `apps/admin/src/modules/labels/` or any label-CRUD code already exists (residue of prior attempts).
2. Memory trace or code referencing prior-attempt vocabulary (see §"Why this step exists").
3. The `applicableLevels` `Json` column already holds data in `training_labels` (it should be empty — libraries unseeded).
4. `AppLevel` enum in `schema.prisma` differs from `["DAY", "SESSION", "BLOCK]` — the spec above would be wrong; escalate.
5. Step 3's Exercise module diverges structurally from what this prompt describes (e.g., it does server-side pagination after all) — escalate; the prompt's understanding would be stale.
6. `/feature` Verify stage finds pre-existing unrelated failures (note: a known-flaky `cmsBlogAdminApi > updatePost` test exists per Step 3 — if it flakes, retry once; do not "fix" it).
7. `.dependency-cruiser.cjs` flags a new violation — you imported something across a forbidden boundary; fix the import, do not touch the rule.

## Order of operations (recommended)

1. Read the full canonical Exercise reference set (§"Canonical reference").
2. Phase 1 — contracts (the type/schema foundation).
3. Phase 2 — backend handlers + mapper.
4. Phase 3 — API routes.
5. Phase 4 — client API + hooks.
6. Phase 5 — admin module: `applicable-levels-field.tsx` first (the new pattern), then `label-form.tsx`, then list section, then views.
7. Phase 6 — pages.
8. Phase 7 — sidebar nav.
9. Phase 8 — verification + smoke-test scenario draft.
10. Phase 9 — output.md.

## Final reminder

Step 4 is the **second** instance of a pattern Step 3 already proved. The hard thinking is done — your job is faithful mirroring plus one new widget done carefully. The single trap is the `applicableLevels` field: subscribe to `fieldState`, surface the error inline (`FormControl error` + `FormHelperText`), or you will reproduce the Step 3 silent-submit bug. Read the Exercise files. Match them. Russian for chat, English in files. Lowercase commit subjects. Stop on hard triggers.

Good luck.
