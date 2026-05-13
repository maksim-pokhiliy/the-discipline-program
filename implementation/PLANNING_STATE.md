# Planning State

> Last updated: 2026-05-13 (Step 2 committed; D5 ratified; Step 3 prompt ready)

## Workflow goal

End-to-end coach happy path:

1. Domain model from `analysis/` ported into `packages/api-server/prisma`.
2. CRUD tables for catalogs (Exercise, Label, Archetype, possibly more) in `apps/admin`, following existing module conventions.
3. Plan editor in `apps/platform/src/modules/plan-detail/` with week-based navigation.
4. Coach can: create catalog entities in admin → create plan in platform → program a week with realistic sessions → data persists per Prisma schema.
5. Athlete flow NOT built. Acceptable to extend Prisma model with athlete-facing entities and seed minimum data so smoke-test paths are not broken.

## Current step

**Step 2 committed** (2026-05-13). Branch `feat/training-domain` created; commits `995504c0` (Step 1) + `b9d84876` (Step 2). **D5 ratified** during Step 3 planning (defaultDemoUrl → defaultDemoUrls String[]). `implementation/step-03/prompt.md` written. Awaiting Step 3 execution via separate Opus 4.7 max-effort session through `/feature` (full pipeline).

## Step queue (draft, refined per iteration)

> Granularity will likely change as we learn. Steps named with provisional titles.

- **Step 1** — Model ratification (no code). Apply 4 ratified decisions (Week, Athlete-derived, full-scope, library-vs-config split) into analysis-artifacts. Output: updated `analysis/artifacts/05-synthesis/{domain-model.md, er-diagram.md}` + `analysis/artifacts/06-formalization/{schema.prisma, er-final.md, implementation-notes.md, types.ts}`. No edits to `packages/api-server`. Likely NOT `/feature` — pure documentation/spec change.

- **Step 2** — Prisma schema port + Archetype seed + minimal user/plan seed. Bring ratified schema into `packages/api-server/prisma/schema.prisma`. Wire seed: 1 coach (User+CoachProfile), 1 athlete (User+AthleteProfile), 1 empty TrainingPlan, all 34 archetypes (full canonical set, derived from `analysis/artifacts/06-formalization/implementation-notes.md` archetype catalog). NO seed for Exercise/Label — user creates via admin UI. `pnpm --filter @repo/api-server db:reset` per ADR-0019; no versioned migrations during workflow.

- **Step 3** — Admin Exercise CRUD. **Phase 0**: schema refinement (D5 — defaultDemoUrl → defaultDemoUrls String[]) + analysis-artifact sync + `db:reset + db:seed`. **Phase 1-7**: contracts → endpoints → mappers → api-client → query hooks → admin module (`apps/admin/src/modules/exercises/`) → routes → sidebar nav. Match existing module conventions (per `apps/admin/src/modules/reviews/` reference). Forms: react-hook-form + zod; tables: `@repo/ui` `DataTable`. Sidebar: new "Library" group at end of existing items. defaultLoad — NOT exposed in v1 UI; auto-derived `canonicalNameLower` in handlers; movementFamily autocomplete with distinct DB values; defaultDemoUrls chip-input with URL validation; aliases chip-input.

- **Step 4** — Admin Label CRUD. Same conventions as Step 3. Distinguishing feature: `applicableLevels` multi-select (day/session/block); typeahead/autocomplete UX expected later in plan-editor.

- **Step 5** — Platform plan list / create-plan flow. Replace/verify `apps/platform/src/modules/plans/` scaffolding; ensure CreatePlan dialog persists to new `TrainingPlan` shape; navigate to plan-detail.

- **Step 6** — Plan-detail shell. Route `apps/platform/.../plan/[id]/`, week navigator (week-as-primary view), add/remove-week primitives, empty-state UX. `apps/platform/src/modules/plan-detail/` currently a stub — full rewrite.

- **Step 7** — Day-level operations within a week. Day add/edit/reorder/delete; Day.label autocomplete from Label library.

- **Step 8** — Session-level operations. Add/edit/reorder sessions inside a day; Session.label autocomplete.

- **Step 9** — Block-level operations. Block add/edit/delete inside a session; block-label M:N with order; block-level Intensity / TimeCap composites.

- **Step 10** — Schema editor. Archetype picker (from seeded archetype catalog), `archetypeParams` form per archetype (driven by `archetypeParamsSchema`), schema body switching (rows vs subSchemas based on `kind`).

- **Step 11** — SchemaRow editor. Per-rowKind forms (EXERCISE, REST, FOOTNOTE, STANDALONE_LOAD, PLACEHOLDER, INNER_LADDER_MARKER, CONNECTOR, REST_SLOT, REP_DEFINITION, STANDALONE_URL); shared Load / RepNotation / Intensity / Tempo / Side / Media / CompoundRep composites.

- **Step 12** — End-to-end coach happy path smoke-test + cleanup. Manual scenario validated; defects fixed.

Some steps (especially 10, 11) will likely split into sub-steps. Granularity locked at thesis time, not now.

## Open architectural questions (block Step 1)

Pending Step 1 follow-up micro-questions (see chat turn).

## Deferred questions (default hypothesis applied; will revisit if needed)

- **Order semantics**: sequential integers (1, 2, 3 …) with whole-row reorder operations (not sparse 10/20/30). Simpler UX, no half-integer hacks; reorder is cheap enough at the cardinalities we expect (≤ ~10 of each child).
- **Phase 7 archetypes (super-set, hrZone, numericPace)**: include now if it costs nothing — they are JSON-only additions. Schema-level: add `super-set` to archetype seed; `Intensity` Zod schema admits `hrZone` and `numericPace` optional fields.
- **Migrations directory**: not maintained during workflow per ADR-0019; `pnpm --filter @repo/api-server db:reset` is the per-step refresh.
- **Naming clash with existing `TrainingPlan`**: keep `TrainingPlan` as the plan-shell entity (creator, status, name). Domain-model `Plan` notion subsumed.

## Decisions accepted

### 2026-05-12 — Foundation architecture (D1-D4 finalized)

- **D1 (Calendar Week as entity).** Explicit `Week` model between `TrainingPlan` and `Day`. Week is a **calendar slot** (Mon-Sun ISO week), not a relative "week 1, week 2" of a fixed program.
  - `Week { id, planId, startDate Date (Monday of ISO week), notes String?, createdAt, updatedAt }`. Unique `(planId, startDate)`.
  - `Day` no longer has `order Int`. Replaced by `dayOfWeek DayOfWeek` enum (MONDAY..SUNDAY). `Day { id, weekId, dayOfWeek, labelId?, notes?, ts }`. Unique `(weekId, dayOfWeek)`.
  - New enum `DayOfWeek { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY }`.
  - Derived (not stored): week end date = `startDate + 6 days`; ISO year+week number; per-day calendar date.
  - Plan is a "train", weeks are slots the coach fills as time moves forward. No fixed end. Was OPEN ("Week / Plan entities — out-of-scope") — closed here.
- **D2 (Athlete = User+AthleteProfile, no profileAttributes).** No standalone `Athlete` model. `OneRMRecord.userId → User.id`. `PerformedSession.userId → User.id`. `profileAttributes` (Phase 6 placeholder for dual-value resolver / level / RX-SC tier) **dropped entirely** — premature without concrete UX. Future additions (e.g., `level`, `modalityTier`) go as explicit enum columns on `AthleteProfile`, not jsonb. Was OPEN ("Connection to TrainingPlan/PlanEnrollment") — closed here.
- **D3 (Full-scope port at Step 2).** All ratified entities — catalogue (Exercise, Label, Archetype), plan-content (Week, Day, Session, Block, BlockLabelAssignment, Schema, SchemaPairing, SchemaRow), athlete-facing (OneRMRecord, PerformedSession, PerformedExerciseInstance) — go into `packages/api-server/prisma/schema.prisma` at Step 2, even though athlete-flow UI/API stays out of scope. Avoids a second schema-change wave mid-workflow.
- **D4 (Library vs Configuration split).** `Exercise` and `Label` are **libraries** — created/managed by coach in admin UI, used for future analytics. NOT seeded; coach populates via admin during smoke-test. `Archetype` is **configuration** — part of the model itself; full canonical set (34) MUST be seeded at Step 2. No admin CRUD for Archetype (UI-editing it is meaningless without parser+renderer updates). `archetypeParamsSchema` lives in DB (Prisma model) rather than code to allow patching without redeploy.

### 2026-05-13 — Exercise model refinement (D5 ratified)

- **D5 (defaultDemoUrl → defaultDemoUrls String[]).** Single URL field replaced by Postgres native string array. Coach can attach multiple demo videos per exercise without limit. Native `String[]` over `Json?` for type-safety and no JSON parsing overhead. Applies to both `analysis/artifacts/06-formalization/schema.prisma` (anchor spec) and real `packages/api-server/prisma/schema.prisma`. Step 3 Phase 0 implements the schema refinement (with analysis-artifact sync) before any UI work.

### Deferred sub-decisions (default hypothesis applied; revisit on contact)

- **Order semantics**: **sparse integers (10/20/30)** per Phase 4 Q6 (ratified in `analysis/artifacts/06-formalization/er-final.md §5 #7`). Earlier draft in this file mistakenly proposed sequential; reverted 2026-05-12 after Step 1 executor flagged the divergence. Step 2 seed and any insert-helpers must use sparse increments; renumber only on collision.
- **Phase 7 archetypes (super-set)**: include in archetype seed at Step 2. `Intensity` Zod schema admits optional `hrZone` and `numericPace`.
- **Migrations stance**: no versioned migrations during workflow; `db:reset` per schema change per ADR-0019. **Note (Step 2 finding)**: `db:reset` script in this repo runs `prisma db push --force-reset && tsx scripts/apply-sql-checks.ts` only — does NOT auto-seed. After every schema change run `db:reset` then `db:seed` explicitly.
- **`TrainingPlan` naming**: keep as plan-shell (creator/status/name). Plan-content lives below Week.

## Rules / invariants

- `analysis/source/` and `analysis/artifacts/00-meta/`, `01-inventory/`, `02-patterns/`, `03-content/`, `04-structure/` — read-only forever.
- `analysis/artifacts/05-synthesis/` and `06-formalization/` — living source of truth, updated synchronously with every Prisma schema change. Each such update mentioned explicitly in `IMPLEMENTATION_LOG.md`.
- Every step touching Prisma updates seed in the same session; smoke-test scenario cannot be valid without coherent seed.
- Schema changes require thesis approval cycle before prompt finalization.
- Each step lives under `implementation/step-NN/` with `prompt.md` and `output.md`.
- Pre-existing implementations of this domain are deleted (4th attempt). Do not search git history or memory for them. If something surfaces accidentally, halt and surface to user.

## Next action

User launches separate Opus 4.7 max-effort session pointed at `implementation/step-03/prompt.md`. Executor invokes `/feature` (full pipeline) per prompt. On completion — planner reads `implementation/step-03/output.md` and `.feature-dev/<ts>/`, manual smoke-test in browser per provided scenario, validates, updates `IMPLEMENTATION_LOG.md`, drafts Step 4 thesis (Admin Label CRUD — should be quick, follows Exercise template).
