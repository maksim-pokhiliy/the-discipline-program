# Step 3 — Admin Exercise CRUD (with schema refinement D5)

> Self-contained prompt for execution by a fresh Opus 4.7 (1M context), max-effort session.

## Who you are

You are the executor for Step 3 of a multi-step workflow that integrates a training-domain model into the `the-discipline-program` monorepo. You are NOT the planner. The planner is in a separate session; the user shuttles prompts and outputs between you. Today is **2026-05-13**.

## Why this step exists

This is the **fourth** attempt at this domain. Prior attempts are deleted; memory entries about them have been purged by the user. If you find any code, comment, or memory trace referencing `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — **STOP**, surface to the user, await instructions.

Steps 1 (model ratification) and 2 (Prisma schema port + 34 archetype seeds) are committed on branch `feat/training-domain` (`995504c0`, `b9d84876`). The DB now has the full training-domain schema; `training_archetypes` has 34 rows; `training_exercises` / `training_labels` are empty per D4 (libraries — coach populates via admin UI).

Step 3 ships the first admin CRUD: **Exercise**. Coach can create / list / search / filter / edit / delete `Exercise` records. Label CRUD (Step 4) will follow the same template.

## Workflow rules (hard constraints)

1. **Scope** — Step 3 is allowed to modify:
   - `analysis/artifacts/06-formalization/schema.prisma` (Phase 0 — D5 refinement)
   - `analysis/artifacts/06-formalization/types.ts` (if reference to `defaultDemoUrl` exists)
   - `analysis/artifacts/06-formalization/implementation-notes.md` (append D5 entry under §0)
   - `analysis/artifacts/06-formalization/er-final.md` and `analysis/artifacts/05-synthesis/{domain-model.md, er-diagram.md}` (only if `defaultDemoUrl` is mentioned there)
   - `packages/api-server/prisma/schema.prisma` (Phase 0 — D5 refinement on real schema)
   - `packages/contracts/src/entities/cms/exercise/` (NEW directory + 4 files + register in package barrel)
   - `packages/api-server/src/endpoints/cms/exercise/` (NEW directory + handler file + register in endpoints barrel)
   - `packages/api-server/src/mappers/cms/exercise.mapper.ts` (NEW)
   - `apps/admin/src/app/api/admin/exercises/` (NEW routes)
   - `apps/admin/src/lib/api/endpoints/exercises.ts` (NEW client API)
   - `apps/admin/src/lib/hooks/use-exercises.ts` (NEW hooks)
   - `apps/admin/src/modules/exercises/` (NEW module)
   - `apps/admin/src/app/(dashboard)/exercises/` (NEW pages: list, create, [id])
   - Sidebar nav config (location: discover; add "Exercises" item, optionally in a new "Library" group)
   - `implementation/step-03/output.md` (NEW final report)
2. **Read-only forever** (do not touch):
   - `analysis/source/`, `analysis/artifacts/00-meta/`, `01-inventory/`, `02-patterns/`, `03-content/`, `04-structure/`
3. **Do not touch** in this step:
   - `analysis/artifacts/05-synthesis/stress-test.md`, `edge-cases.md`, `06-formalization/stress-final.md`
   - `apps/marketing/`, `apps/platform/`, `apps/storybook/`
   - Other admin modules (auth, blog, contacts, pages, products, reviews, users) — match patterns but do not modify
   - Other prisma seeders
   - Lock files, CI configs, `.gitignore`
4. **Existing patterns are sacred**: Step 0 admin-map enumerates conventions in `apps/admin/src/modules/`. Match them exactly. Do not invent new patterns. If a convention is ambiguous — match `apps/admin/src/modules/reviews/` (your primary reference) or `blog/` (richer reference with array fields).
5. **No co-authored-by, generated-by, "Generated with Claude Code"** signatures anywhere — commits, code, comments, PRs.
6. **No `--no-verify`, `--no-edit`, `--no-gpg-sign`** in git operations.
7. **No comments inside code** unless they encode a non-obvious _why_ (single-line only). Schema-DSL section markers (already present) are deliberate.
8. **Russian for chat-prose with the user, English inside files.**
9. **Question protocol**: ask with hypothesis. Do not ask without one.
10. **Do not fabricate.** If a pattern doesn't exist in admin and you can't find a clear precedent — escalate.

## Use `/feature` (full pipeline)

Invoke `/feature` (NOT `/feature small` — Step 3 is multi-package, multi-phase work that benefits from full Research → Plan → Implement → Verify → Finalize stages). Use a free-text selector pointing at this prompt:

> `/feature implement Admin Exercise CRUD with schema refinement D5 per implementation/step-03/prompt.md.`

The pipeline produces `.feature-dev/<ts>/` artifacts; reference that path in `output.md`. Pipeline will run type-check / lint / tests at Verify stage — do NOT skip.

## Ratified decisions (recap)

### D1 — Calendar Week as entity (committed in Step 2)

Already in real schema: `Week { id, planId, startDate Date, notes?, ts }` + Day with `dayOfWeek` enum.

### D2 — Athlete = User + AthleteProfile (committed in Step 2)

`OneRMRecord.userId`, `PerformedSession.userId` → real `User.id`. No standalone Athlete. No `profileAttributes`.

### D3 — Full-scope port (committed in Step 2)

14 training-domain models in real schema. Exercise/Label tables empty (libraries).

### D4 — Library vs Configuration (committed in Step 2)

- **Exercise** = library; user-managed via admin UI (this step) — no seed.
- **Label** = library (Step 4).
- **Archetype** = configuration; 34 seeded; no admin CRUD.

### D5 — `defaultDemoUrl` → `defaultDemoUrls String[]` (Phase 0 of this step)

Single URL field replaced by Postgres native `String[]`. Coach can attach multiple demo videos per exercise.

### Additional finalized micro-decisions (apply faithfully)

- **`canonicalNameLower` mechanism**: kept as separate `String @unique` field; auto-derived in backend handlers as `canonicalName.toLowerCase().trim()` on create/update. Coach never inputs it. Not exposed in API DTO. (Dual-field pattern; no `citext` swap — out of scope.)
- **`defaultLoad` in UI v1**: NOT exposed. Field stays nullable in schema. Coach does NOT input it in this step. Future schema-extension step will surface it once UX design is settled.
- **`aliases` UX**: MUI Autocomplete `multiple` + `freeSolo` (chip-input).
- **`defaultDemoUrls` UX**: MUI Autocomplete `multiple` + `freeSolo` with URL validation per chip via Zod `z.string().url()`.
- **`movementFamily` UX**: text input with autocomplete from distinct DB values (separate API endpoint feeds autocomplete options).
- **`placeholderFlag` UX**: Switch toggle, default false.
- **`canonicalCompoundType` UX**: enum Select (5 values: ATOMIC, COMPOUND_PLUS, COMPOSITE_NAMED, PLACEHOLDER, ALTERNATIVE_OR), default ATOMIC.
- **`primaryEquipment` UX**: enum Select (19 values from `Equipment` enum), required.
- **`movementTypeTagPrimary` UX**: enum Select (14 values from `MovementType`), required.
- **`movementTypeTagSecondary` UX**: enum Select, optional (nullable).
- **`notes` UX**: TextArea, optional.
- **List view columns**: Name, Primary Equipment (chip), Movement Type Primary (chip), Compound Type, Placeholder (icon if true), Created At, Actions (edit / delete).
- **List view filters**: `primaryEquipment` (multi), `movementTypeTagPrimary` (multi), `canonicalCompoundType` (multi), `placeholderFlag` (toggle); free-text search by `canonicalName` + `aliases`.
- **Delete UX**: `ConfirmationModal` + Prisma `Restrict` error handling (readable message for "exercise referenced by 1RM records").
- **Sidebar nav placement**: new "Library" group at the end of existing items; this step adds "Exercises", Step 4 will add "Labels" to the same group. If the sidebar doesn't support groups — flat-insert after the last existing item with rationale documented in `output.md` "Принятые решения".

## Inputs to read (before any edit)

1. `implementation/PLANNING_STATE.md` — D1-D5 in "Decisions accepted"; step queue; sparse 10/20/30 order; library/config split.
2. `analysis/artifacts/06-formalization/schema.prisma` — Exercise model spec.
3. `analysis/artifacts/06-formalization/implementation-notes.md` — §0 Phase 7 ratifications.
4. `packages/api-server/prisma/schema.prisma` — current real schema; learn `Exercise` model location (within training-domain delimited section).
5. **Reference admin modules** (read all four for pattern variance):
   - `apps/admin/src/modules/reviews/` — simplest CRUD; toggle pattern
   - `apps/admin/src/modules/contacts/` — read-only + detail-edit
   - `apps/admin/src/modules/blog/` — richer fields incl. arrays
   - `apps/admin/src/modules/users/` — picker patterns
6. **Reference contract module** for one of above: e.g., `packages/contracts/src/entities/cms/reviews/` if exists, or wherever `Review` contracts live. Trace the import chain.
7. **Reference endpoint module**: `packages/api-server/src/endpoints/cms/reviews/admin.ts` (or analogous).
8. **Reference mapper**: `packages/api-server/src/mappers/cms/review.mapper.ts` (or analogous).
9. **Reference client API + hooks**: `apps/admin/src/lib/api/endpoints/reviews.ts` + `apps/admin/src/lib/hooks/use-reviews.ts`.
10. **Reference routes**: `apps/admin/src/app/(dashboard)/reviews/` + `apps/admin/src/app/api/admin/reviews/`.
11. **Sidebar config**: discover where it lives (likely `apps/admin/src/app/(dashboard)/layout.tsx` or in a shared component from `@repo/ui`). Read it.
12. **Form patterns**: `apps/admin/src/modules/reviews/components/review-form.tsx` and `apps/admin/src/modules/blog/` form (richer).

Document any deviation between admin modules in `output.md` "Принятые решения" — match the more canonical-looking one if conventions diverge.

## Phases

### Phase 0 — Schema refinement (D5)

Goal: change `Exercise.defaultDemoUrl String?` → `defaultDemoUrls String[]` in both analysis-schema and real schema; sync analysis-artifacts; reset+seed DB.

**Tasks**:

1. **`analysis/artifacts/06-formalization/schema.prisma`** — `Exercise.defaultDemoUrl String?` → `defaultDemoUrls String[]`.
2. **`analysis/artifacts/06-formalization/types.ts`** — if any direct reference to `defaultDemoUrl`, update (likely uses `@prisma/client` import which auto-updates; if not — manual surgical edit).
3. **`analysis/artifacts/06-formalization/implementation-notes.md`** — append §0.5 sub-section:

   ```markdown
   ### §0.5 D5 — defaultDemoUrls as Postgres native array (2026-05-13)

   `Exercise.defaultDemoUrl String?` → `defaultDemoUrls String[]`. Native PG array over Json for type-safety and to avoid JSON parsing overhead. Coach attaches multiple demo videos per exercise without limit. Ratified prior to Step 3 (Admin Exercise CRUD) implementation.
   ```

4. **`analysis/artifacts/06-formalization/er-final.md`** — if `defaultDemoUrl` appears in Exercise field listings, update to `defaultDemoUrls`. Add a row to §1 (change history table) noting D5.
5. **`analysis/artifacts/05-synthesis/domain-model.md`** and **`er-diagram.md`** — sync if `defaultDemoUrl` is mentioned.
6. **`packages/api-server/prisma/schema.prisma`** — same edit to real `Exercise` model.
7. Run:
   ```bash
   pnpm --filter @repo/api-server exec prisma format
   pnpm --filter @repo/api-server exec prisma validate
   pnpm --filter @repo/api-server exec prisma generate
   pnpm --filter @repo/api-server db:reset
   pnpm --filter @repo/api-server db:seed
   ```
   (Per Step 2 finding: `db:reset` in this repo does NOT auto-seed; explicit `db:seed` follow-up is required.)
8. Verify post-reset state: `training_archetypes` = 34, all training\_\* otherwise 0.

**Acceptance for Phase 0**:

- All analysis-artifacts mentioning `defaultDemoUrl` updated to `defaultDemoUrls`.
- Real schema has `defaultDemoUrls String[]`.
- `prisma generate` succeeds; `@prisma/client` `Exercise.defaultDemoUrls: string[]` available.
- `db:reset + db:seed` clean.

**Stop and escalate if**:

- `defaultDemoUrl` referenced in unexpected places (e.g., `apps/`, hidden test files) — likely residue from prior attempts. Report.
- Existing data in `training_exercises` (shouldn't exist; libraries are empty per D4). If exists — surface.

### Phase 1 — Contracts

Goal: Zod schemas + TS types for Exercise CRUD.

**Files** (NEW):

- `packages/contracts/src/entities/cms/exercise/exercise.schema.ts`
- `packages/contracts/src/entities/cms/exercise/exercise.types.ts`
- `packages/contracts/src/entities/cms/exercise/exercise-api.schema.ts`
- `packages/contracts/src/entities/cms/exercise/index.ts`

**Schema fields** (Zod):

- `canonicalName`: `z.string().min(1).max(200)` required
- `primaryEquipment`: `z.nativeEnum(Equipment)` required
- `movementTypeTagPrimary`: `z.nativeEnum(MovementType)` required
- `movementTypeTagSecondary`: `z.nativeEnum(MovementType).nullable().optional()`
- `canonicalCompoundType`: `z.nativeEnum(CanonicalCompoundType).default(CanonicalCompoundType.ATOMIC)`
- `placeholderFlag`: `z.boolean().default(false)`
- `movementFamily`: `z.string().min(1).max(100).nullable().optional()`
- `defaultDemoUrls`: `z.array(z.string().url()).default([])`
- `aliases`: `z.array(z.string().min(1)).default([])`
- `notes`: `z.string().nullable().optional()`

`canonicalNameLower` — NOT in schema (backend-derived).

Three schemas:

- `createExerciseSchema` — all fields per above (subject to required/optional rules)
- `updateExerciseSchema` — partial of create
- `exerciseSchema` — full output incl. `id`, `canonicalNameLower`, `createdAt`, `updatedAt` (DTO returned by API)

API schemas (`exercise-api.schema.ts`):

- Pagination + filter + sort wrapper for list
- `getExercisesQuery` schema (page, limit, search, primaryEquipment[], movementTypeTagPrimary[], canonicalCompoundType[], placeholderFlag?, sortBy, sortOrder)
- `getExercisesResponse` (items, totalItems, totalPages, page, limit)

Update `packages/contracts/src/entities/cms/index.ts` (or wherever the CMS barrel lives) to re-export `exercise/*`.

**Reference pattern**: trace `packages/contracts/src/entities/cms/reviews/` (or analogous existing module) — match structure exactly. If imports use `@prisma/client` for enum types, follow.

### Phase 2 — Backend handlers + mapper

**Files** (NEW):

- `packages/api-server/src/endpoints/cms/exercise/admin.ts` — handlers
- `packages/api-server/src/mappers/cms/exercise.mapper.ts` — Prisma → API DTO mapper
- Possibly registration in `packages/api-server/src/endpoints/cms/index.ts` (barrel)

**Handlers**:

- `getExercises(query: GetExercisesQuery): Promise<GetExercisesResponse>`
  - Pagination, filters, search by `canonicalName` (using `canonicalNameLower` for case-insensitive contains) + `aliases` (using Postgres `aliases::text ILIKE %X%`)
  - Sort by createdAt | canonicalName
  - Returns `{ items: Exercise[], totalItems, totalPages, page, limit }`
- `getExerciseById(id: string): Promise<Exercise | null>`
- `createExercise(data: CreateExerciseData): Promise<Exercise>`
  - Derive `canonicalNameLower = canonicalName.toLowerCase().trim()`
  - `prisma.exercise.create({ data: { ...input, canonicalNameLower } })`
  - On unique-conflict error (canonicalNameLower @unique) — throw API-level validation error with field path `canonicalName` and message "Exercise with this name already exists"
- `updateExercise(id: string, data: UpdateExerciseData): Promise<Exercise>`
  - If `canonicalName` in input → re-derive `canonicalNameLower`
  - On unique-conflict → same as create
- `deleteExercise(id: string): Promise<void>`
  - `prisma.exercise.delete({ where: { id } })`
  - On Prisma `P2003` (FK constraint) / Restrict error → throw API-level error "Cannot delete: exercise is referenced by 1RM records or schema rows"
- `getMovementFamilies(): Promise<string[]>` — distinct non-null movementFamily values for autocomplete

**Mapper** (`exercise.mapper.ts`):

```ts
export const mapPrismaToExercise = (row: PrismaExercise): Exercise => ({
  id: row.id,
  canonicalName: row.canonicalName,
  canonicalNameLower: row.canonicalNameLower,
  primaryEquipment: row.primaryEquipment,
  movementTypeTagPrimary: row.movementTypeTagPrimary,
  movementTypeTagSecondary: row.movementTypeTagSecondary,
  canonicalCompoundType: row.canonicalCompoundType,
  placeholderFlag: row.placeholderFlag,
  movementFamily: row.movementFamily,
  defaultDemoUrls: row.defaultDemoUrls,
  aliases: (row.aliases as string[] | null) ?? [],
  notes: row.notes,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});
```

Note: `aliases` is `Json?` per schema (analysis ratifications had it as Json). After Phase 0 it's still `Json?` — Phase 0 only touches `defaultDemoUrl(s)`. Treat aliases as `string[] | null`. If you discover that switching `aliases` to `String[]` would be cleaner — **STOP** and escalate; do not silently change schema in this step.

### Phase 3 — API routes

**Files** (NEW):

- `apps/admin/src/app/api/admin/exercises/route.ts` — GET list, POST create
- `apps/admin/src/app/api/admin/exercises/[id]/route.ts` — GET one, PATCH update, DELETE
- `apps/admin/src/app/api/admin/exercises/movement-families/route.ts` — GET distinct movement families

Use existing API route patterns from `apps/admin/src/app/api/admin/reviews/` (or analogous). Auth check via existing middleware (admin role required).

### Phase 4 — Client API + query hooks

**Files** (NEW):

- `apps/admin/src/lib/api/endpoints/exercises.ts` — `createExercisesAPI(client)` factory
- `apps/admin/src/lib/hooks/use-exercises.ts` — TanStack Query hooks via `createCrudHooks` from `@repo/query`

**Client API methods**:

- `getPageData(query)` → paginated list + filters
- `getById(id)`
- `create(data)`
- `update(id, data)`
- `delete(id)`
- `getMovementFamilies()` (for autocomplete)

Register in `apps/admin/src/lib/api/index.ts` (or wherever the central API barrel lives) so `api.exercises.*` is accessible.

### Phase 5 — Admin module

**Files** (NEW under `apps/admin/src/modules/exercises/`):

```
index.ts                                     # re-exports all views
constants.ts                                  # label maps for enums
components/
  index.ts
  exercise-form.tsx                          # main form (RHF + zod resolver)
sections/
  index.ts
  exercises-list-section/index.tsx           # DataTable with filters/search
views/
  index.ts
  exercises-list-view/index.tsx              # wraps QueryWrapper → ListSection
  exercises-create-view/index.tsx            # FormView + ExerciseForm
  exercises-edit-view/
    index.tsx                                # QueryWrapper → ExercisesEditForm
    exercises-edit-form.tsx                  # FormView + ExerciseForm pre-populated
```

**`constants.ts`**:

```ts
import { Equipment, MovementType, CanonicalCompoundType } from "@prisma/client";

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  ASSAULT_BIKE: "Assault Bike",
  ATLAS_STONE: "Atlas Stone",
  BAND: "Band",
  BARBELL: "Barbell",
  BODYWEIGHT: "Bodyweight",
  BOX: "Box",
  BOX_OR_SOFA: "Box / Sofa",
  DUMBBELL: "Dumbbell",
  JUMP_ROPE: "Jump Rope",
  KETTLEBELL: "Kettlebell",
  MIXED: "Mixed",
  PARALLEL_BARS: "Parallel Bars",
  RINGS: "Rings",
  ROW_ERG: "Row Erg",
  SKI_ERG: "Ski Erg",
  SLED: "Sled",
  SOFA: "Sofa",
  UNKNOWN: "Unknown",
  YOKE: "Yoke",
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  SQUAT: "Squat",
  HINGE: "Hinge",
  PRESS: "Press",
  PULL: "Pull",
  LUNGE: "Lunge",
  CARRY: "Carry",
  LOCOMOTION: "Locomotion",
  STATIC_HOLD: "Static Hold",
  ROTATIONAL: "Rotational",
  CARDIO_FLOW: "Cardio Flow",
  CORE: "Core",
  COMBINED_OLYMPIC: "Combined Olympic",
  RAISE: "Raise",
  EXTENSION: "Extension",
  UNKNOWN: "Unknown",
};

export const COMPOUND_TYPE_LABELS: Record<CanonicalCompoundType, string> = {
  ATOMIC: "Atomic",
  COMPOUND_PLUS: "Compound Plus",
  COMPOSITE_NAMED: "Composite Named",
  PLACEHOLDER: "Placeholder",
  ALTERNATIVE_OR: "Alternative (OR)",
};
```

**`exercise-form.tsx`** structure (RHF + zodResolver):

FormCards (per existing convention):

1. **Basic info**:
   - `canonicalName` (TextField, required, helper "Will be uniquely matched case-insensitively")
   - `primaryEquipment` (Select with `EQUIPMENT_LABELS`, required)
   - `movementTypeTagPrimary` (Select, required)
   - `movementTypeTagSecondary` (Select, optional)
2. **Classification**:
   - `canonicalCompoundType` (Select, required, default ATOMIC)
   - `placeholderFlag` (Switch, default false; helper "Use for coach-choice slots like 'biceps / triceps'")
   - `movementFamily` (Autocomplete `freeSolo`; queries `api.exercises.getMovementFamilies()`; helper "Soft grouping for 1RM resolution")
3. **Demos & aliases**:
   - `defaultDemoUrls` (Autocomplete `multiple` + `freeSolo`; chip per URL; validate each chip on enter with Zod URL schema; show inline chip error)
   - `aliases` (Autocomplete `multiple` + `freeSolo`; chip per alias; no URL validation)
4. **Notes**:
   - `notes` (TextField `multiline` rows=4)

**`exercises-list-section/index.tsx`** — DataTable (per `@repo/ui` pattern):

Columns:

- `canonicalName` (sortable, link to `/exercises/[id]`)
- `primaryEquipment` (chip via `EQUIPMENT_LABELS`)
- `movementTypeTagPrimary` (chip via `MOVEMENT_TYPE_LABELS`)
- `canonicalCompoundType` (chip)
- `placeholderFlag` (icon if true: e.g., `?` icon)
- `createdAt` (formatted)
- Actions: Edit (Link icon button), Delete (IconButton → `requestDelete`)

Filters (`DataTableFilter[]`):

- `primaryEquipment` — multi-select with `EQUIPMENT_LABELS`
- `movementTypeTagPrimary` — multi-select
- `canonicalCompoundType` — multi-select
- `placeholderFlag` — toggle

Search:

- by `canonicalName` and `aliases` (backend handles match)
- Placeholder: "Search by name or alias"

CreateButton:

- Top-right "Create Exercise" → `Link` to `/exercises/create`

DeleteConfirmation:

- `useDeleteConfirmation({ deleteMutation: useDeleteExercise() })`
- `ConfirmationModal` with title "Delete Exercise?" and body "This action cannot be undone."
- On error from API (Restrict / FK) — surface the message in modal or via snackbar

**`views/`**:

- `exercises-list-view/index.tsx` — wraps `QueryWrapper` (loading/error/data states) → renders `ExercisesListSection`
- `exercises-create-view/index.tsx` — wraps `FormView` (title, back button, submit) + `ExerciseForm` with empty defaults; on submit → `useCreateExercise().mutateAsync` → navigate back to list
- `exercises-edit-view/index.tsx` — `QueryWrapper` (loads exercise by id) → renders `ExercisesEditForm`
- `exercises-edit-view/exercises-edit-form.tsx` — `FormView` + `ExerciseForm` pre-populated; on submit → `useUpdateExercise().mutateAsync`

### Phase 6 — Routes

**Files** (NEW under `apps/admin/src/app/(dashboard)/exercises/`):

- `page.tsx`:
  ```tsx
  import { ExercisesListView } from "@app/modules/exercises";
  export default function ExercisesPage() {
    return <ExercisesListView />;
  }
  ```
- `create/page.tsx`:
  ```tsx
  import { ExercisesCreateView } from "@app/modules/exercises";
  export default function ExercisesCreatePage() {
    return <ExercisesCreateView />;
  }
  ```
- `[id]/page.tsx`:
  ```tsx
  import { ExercisesEditView } from "@app/modules/exercises";
  type Props = { params: Promise<{ id: string }> };
  export default async function ExercisesEditPage({ params }: Props) {
    const { id } = await params;
    return <ExercisesEditView id={id} />;
  }
  ```

Match existing routes' style (e.g., `apps/admin/src/app/(dashboard)/reviews/`).

### Phase 7 — Sidebar nav entry

Discover sidebar location:

- Likely `apps/admin/src/app/(dashboard)/layout.tsx` includes a `<Sidebar />` component
- Sidebar items defined in a config file (often `apps/admin/src/lib/config/sidebar.ts` or in the component itself)
- Look for an array like `SIDEBAR_ITEMS` with `label`, `href`, `icon`

Add "Exercises" item. If sidebar supports groups — new "Library" group at the end with `Exercises` as first item (Step 4 will add `Labels`). If sidebar is flat — append `Exercises` at the end with rationale in `output.md`.

### Phase 8 — Verification + smoke-test scenario

**Pipeline-driven verification** (`/feature` runs these):

- `pnpm check-types` — must be green
- `pnpm lint --max-warnings 0` — must be green
- `pnpm test` — all tests pass (or document any unrelated pre-existing failures)

**Manual smoke-test scenario** (you generate; user runs it in browser):

Format the scenario in `output.md` "Сценарий смоук-теста" section per workflow rule:

```markdown
## Сценарий смоук-теста

### Предусловия

- DB reset via `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed`
- Auth: log in as admin user (credentials in existing seed)
- Browser at admin app: http://localhost:3002

### Шаги

1. **Open Exercises page**

   - Action: navigate sidebar → "Library" → "Exercises" (or wherever placed)
   - Expected: page loads with empty DataTable, "Create Exercise" button visible

2. **Create first Exercise**

   - Action: click "Create Exercise"
   - Form pre-populated with defaults (compound=ATOMIC, placeholder=off, empty aliases/urls)
   - Fill: name="Back Squat", primaryEquipment=BARBELL, movementType=SQUAT, family="squat_variations", 1 URL chip "https://youtu.be/example", 1 alias chip "BB Squat"
   - Submit
   - Expected: redirect to list; "Back Squat" row appears

3. **Verify case-insensitive uniqueness**

   - Action: click "Create Exercise", try to create with name="back squat" (lowercase)
   - Submit
   - Expected: validation error "Exercise with this name already exists"; form stays open

4. **Edit existing Exercise**

   - Action: click "Back Squat" row in list
   - Form pre-populated with previously saved values
   - Modify: add another alias chip "BS"
   - Submit
   - Expected: redirect to list; row reflects update (no easy aliases column display, but go back into edit to verify)

5. **Filter by primary equipment**

   - Action: open list filter, select BARBELL
   - Expected: "Back Squat" visible; if another exercise exists with DUMBBELL — it's hidden

6. **Movement family autocomplete**

   - Action: open Create form again, click in "Movement Family" field
   - Expected: dropdown shows "squat_variations" (from existing exercise)

7. **Create placeholder exercise**

   - Action: name="Biceps placeholder", primaryEquipment=DUMBBELL, movementType=PULL, compound=PLACEHOLDER, placeholderFlag=on
   - Submit → list row shows placeholder icon (e.g., `?`)

8. **Delete Exercise**

   - Action: click delete (trash icon) on "Biceps placeholder" row
   - Expected: ConfirmationModal "Delete Exercise?"
   - Click Confirm
   - Expected: row disappears

9. **Search by alias**
   - Action: type "BS" in search box
   - Expected: "Back Squat" appears (matched by alias "BS")

### Откат состояния

- `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed`
- Returns to initial state (training_exercises empty)
```

### Phase 9 — Write `implementation/step-03/output.md`

Format (exact section headers):

```markdown
# Step 3 — Output

## Что сделано

<3-5 lines>

## Изменённые/созданные файлы

- <list>

## Принятые решения

<ambiguities resolved silently with rationale>

## Возникшие вопросы и как решены

<escalations or pending>

## Что отложено

<explicit defer markers>

## Ссылка на `.feature-dev/<ts>/`

<path>

## Сценарий смоук-теста

<as drafted in Phase 8>

## Verification notes

- pnpm check-types: <result>
- pnpm lint: <result>
- pnpm test: <result>
- Phase 0 db:reset + db:seed: <result>
- defaultDemoUrls Prisma client regen: <result>
- ... etc

## Acceptance criteria self-check

- [ ] Phase 0: D5 applied to analysis-artifacts + real schema; db:reset+seed clean
- [ ] Phase 1: contracts (4 files + barrel registration)
- [ ] Phase 2: handlers + mapper + endpoint barrel registration
- [ ] Phase 3: 3 API routes
- [ ] Phase 4: client API + hooks + central barrel
- [ ] Phase 5: admin module (all files per layout)
- [ ] Phase 6: 3 pages
- [ ] Phase 7: sidebar nav entry
- [ ] Phase 8: type-check / lint / test green; smoke-test scenario documented
- [ ] No edits outside allowed scope (apps/marketing, apps/platform, apps/storybook, other admin modules — untouched)
- [ ] No co-authored-by / generated signatures
```

## Hypothesis bank (apply silently)

- **Sidebar group support**: discover by reading. If groups exist — add "Library" group. If not — flat-insert.
- **`aliases` schema treatment**: per analysis ratification it's `Json?`; treat as `string[] | null` in mapper. Do not change schema. If pattern in admin says jsonb is fine — match.
- **Form `defaultValues`**: in create — explicit defaults per schema; in edit — pre-populate from query data; reset form on `data` change.
- **API DTO timestamps**: ISO strings via `.toISOString()` matches existing mapper convention.
- **Empty arrays vs null**: arrays default to `[]` (never null) in DTO output.
- **`movementFamily` autocomplete debounce**: 300ms is standard.
- **`URL` validation in chip-input**: validate on add (Enter); show inline error; do not accept invalid into the array.
- **API error shape**: match existing handler error responses (likely `@repo/errors` or similar). Restrict-error: 409 Conflict with `code: "exercise_in_use"`.
- **`getMovementFamilies` cache**: TanStack Query with `staleTime: 60_000` is reasonable.
- **Pagination defaults**: `page=1, limit=20` matches existing CMS modules.

## Hard escalation triggers (STOP and surface)

1. Found code or file under `apps/admin/src/modules/exercises/`, `apps/platform/`, or anywhere else that already implements training-domain Exercise CRUD (residue of prior attempts).
2. Found memory entry suggesting prior implementation details — STOP per workflow rules.
3. `defaultDemoUrl` referenced in places outside analysis-schema + real schema (e.g., in a hidden test file, fixture, or app code).
4. `aliases` schema mismatch — analysis says `Json?`, real schema says different, mapper hesitates — escalate before guessing.
5. Sidebar config can't be located or structurally doesn't accommodate the additions — escalate.
6. Existing admin module conventions diverge significantly between `reviews/` and `blog/` and you can't tell which is canonical — escalate with sketch of both.
7. `/feature` Verify stage finds pre-existing unrelated failures that would normally block — document and ask.
8. Prisma migration / generation fails (e.g., array column constraint surprise) — escalate.

## Order of operations (recommended)

1. Read all inputs.
2. Phase 0: schema refinement + sync + db reset+seed.
3. Phase 1: contracts (build the type/schema scaffolding first — everything else depends on it).
4. Phase 2: backend handlers + mapper (depends on contracts).
5. Phase 3: API routes (depends on handlers).
6. Phase 4: client API + hooks (depends on contracts + API routes).
7. Phase 5: admin module — form first, then list section, then views.
8. Phase 6: pages (thin wrappers, last).
9. Phase 7: sidebar nav.
10. Phase 8: verification + smoke-test scenario draft.
11. Phase 9: output.md.

## Final reminder

This is multi-package work. The `/feature` pipeline will help with verification but the architectural pattern is yours to nail. Match existing admin conventions ruthlessly — when in doubt, follow `reviews/` (simplest) or `blog/` (richer). No invention. No comments unless they encode a non-obvious why. Russian for chat with user, English in files. Surface hesitations with hypotheses. Stop on hard triggers.

The user has burned three prior attempts. This step finally puts the first piece of usable UI in front of the coach. Make it count.

Good luck.
