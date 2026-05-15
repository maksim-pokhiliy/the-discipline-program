# Planning State

> Last updated: 2026-05-15 (Step 5 fully closed; PR opened against `main`; Step 6 thesis is the next planner action)

## Workflow goal

End-to-end coach happy path:

1. Domain model from `analysis/` ported into `packages/api-server/prisma`.
2. CRUD tables for catalogs (Exercise, Label, Archetype, possibly more) in `apps/admin`, following existing module conventions.
3. Plan editor in `apps/platform/src/modules/plan-detail/` with week-based navigation.
4. Coach can: create catalog entities in admin → create plan in platform → program a week with realistic sessions → data persists per Prisma schema.
5. Athlete flow NOT built. Acceptable to extend Prisma model with athlete-facing entities and seed minimum data so smoke-test paths are not broken.

## Current step

**Step 5 fully closed** (2026-05-15). HEAD on `feat/training-domain` past `169d5086`; first PR `feat/training-domain → main` opened at close-out, batching Steps 1-5 (schema + 34 archetypes seed + Exercise & Label admin CRUDs + plan-detail calendar viewport). Plan-detail page at `/coach/plans/[planId]` is the first real training-domain surface in `apps/platform` — calendar viewport over weeks per **D6**, 7 full-width day rows, lazy `Week` materialization via `upsertNotes`, inline-edit plan title/description, and the create-plan landing redirect.

What shipped: the `lms/week` contract slice (`weekSchema`, `updateWeekNotesSchema`, api-types; addressed by `(planId, startDate)`; `null`-week as a 200, not a 404); `lmsWeekApi` (`getByPlanAndDate` + `upsertNotes`, ownership-guard first, write-only `verifyPlanEditable`, `resolveWeekStartDate` UTC-midnight anchor for `@db.Date`); `mapToWeek`; platform GET+PUT route at `/api/platform/training-plans/[planId]/weeks/[startDate]` (no POST, no DELETE, no list); `useWeek` / `useUpdateWeekNotes`; `@repo/ui` `InlineEditText` primitive + strictly-additive `PageHeader` editable extension; the `plan-detail` module (`PlanDetailView`, `WeekNavigator` with MUI `DatePicker`, `WeekGrid`, `DayRow`, `WeekNotes`); OQ-D create-plan redirect. 12 executor commits `2845244a..42787606` + 5 post-validation tweaks (`11a7c463`, `8cc8cf43`, `27be221c`, `e600c23c`, `9d9389bd`) + 2 close-out cosmetic commits (`3dc40feb`, `169d5086`). Smoke-test **passed** 2026-05-15 — 15 scenario steps green.

Three executor-caught planner prompt bugs, all resolved during Stage 6 / fix-loop; full details in the `IMPLEMENTATION_LOG.md` Lesson-learned addendum:

1. **Write-back cache key** — `useUpdateWeekNotes` writes back via the caller's `startDate` string (not `formatDateParam(week.startDate)`); the response isn't Zod-coerced, so the field is a string at runtime.
2. **`description` conditional-spread** — `exactOptionalPropertyTypes: true` rejects `?? undefined`; codebase idiom is `{...(plan.description !== null && { description: plan.description })}`.
3. **QA-001 (CRITICAL)** — `Week.startDate` re-anchored to `Date.UTC(...)` at the api-server boundary via `resolveWeekStartDate` in `endpoints/lms/week/admin.ts`. Proven with `TZ=Asia/Kolkata` (pre-fix: `expected 17 to be 18`; post-fix: 7/7 green). **Step 6 hard carry-forward**: `Day` materialization upserts a `Week` row → same boundary; the prompt must spec the same UTC anchor.

Deferred non-blockers: QA-003 (no `invalidateQueries` in `useUpdateWeekNotes` — accepted: single-user blur-commit surface, `setQueryData` is correct); QA-005 (no client-side length cap on `InlineEditText` — server-side rejected with a toast, follow-up); QA-002 / QA-007 / QA-008 / QA-009 / Review WARN-2 (pre-existing surface or completeness-level).

## Step queue (draft, refined per iteration)

> Granularity will likely change as we learn. Steps named with provisional titles.

- **Step 1** — Model ratification (no code). Apply 4 ratified decisions (Week, Athlete-derived, full-scope, library-vs-config split) into analysis-artifacts. Output: updated `analysis/artifacts/05-synthesis/{domain-model.md, er-diagram.md}` + `analysis/artifacts/06-formalization/{schema.prisma, er-final.md, implementation-notes.md, types.ts}`. No edits to `packages/api-server`. Likely NOT `/feature` — pure documentation/spec change.

- **Step 2** — Prisma schema port + Archetype seed + minimal user/plan seed. Bring ratified schema into `packages/api-server/prisma/schema.prisma`. Wire seed: 1 coach (User+CoachProfile), 1 athlete (User+AthleteProfile), 1 empty TrainingPlan, all 34 archetypes (full canonical set, derived from `analysis/artifacts/06-formalization/implementation-notes.md` archetype catalog). NO seed for Exercise/Label — user creates via admin UI. `pnpm --filter @repo/api-server db:reset` per ADR-0019; no versioned migrations during workflow.

- **Step 3** — Admin Exercise CRUD + Phase 0 D5 schema refinement. **COMPLETED** 2026-05-13 (HEAD `51302f93`). `apps/admin/src/modules/exercises/` shipped as canonical reference template for future catalog-library CRUD modules. Smoke-test scenario in `implementation/step-03/output.md`.

- **Step 4** — Admin Label CRUD. **COMPLETED** 2026-05-14 (HEAD `252d7323`). Structural mirror of Step 3 Exercise module + `applicableLevels` multi-value checkbox widget (`FormGroup` + 3 `Checkbox`, `fieldState`-subscribed per Step 3.1 regression guard). No schema change. Smoke-test scenario in `implementation/step-04/output.md`.

- **~~Step 5~~ — Platform plan list / create-plan flow. DROPPED 2026-05-14.** Found already implemented as pre-existing base LMS infrastructure (see § "Current step"). Queue renumbered below; old 6-12 → 5-11.

- **Step 5** (was Step 6) — Plan-detail shell (calendar viewport). **COMPLETED** 2026-05-15. `lms/week` contract slice, `lmsWeekApi` (read + lazy notes-upsert with UTC-midnight anchor), platform week API route + hooks, `@repo/ui` `InlineEditText` + additive `PageHeader` extension, `plan-detail` calendar-viewport module, create-plan redirect (OQ-D). Smoke-test scenario in `implementation/step-05/output.md`.

- **Step 6** (was Step 7) — Day-level operations within a week. Day add/edit/reorder/delete; Day.label autocomplete from Label library.

- **Step 7** (was Step 8) — Session-level operations. Add/edit/reorder sessions inside a day; Session.label autocomplete.

- **Step 8** (was Step 9) — Block-level operations. Block add/edit/delete inside a session; block-label M:N with order; block-level Intensity / TimeCap composites.

- **Step 9** (was Step 10) — Schema editor. Archetype picker (from seeded archetype catalog), `archetypeParams` form per archetype (driven by `archetypeParamsSchema`), schema body switching (rows vs subSchemas based on `kind`).

- **Step 10** (was Step 11) — SchemaRow editor. Per-rowKind forms (EXERCISE, REST, FOOTNOTE, STANDALONE_LOAD, PLACEHOLDER, INNER_LADDER_MARKER, CONNECTOR, REST_SLOT, REP_DEFINITION, STANDALONE_URL); shared Load / RepNotation / Intensity / Tempo / Side / Media / CompoundRep composites.

- **Step 11** (was Step 12) — End-to-end coach happy path smoke-test + cleanup. Manual scenario validated; defects fixed.

Some steps (especially 9, 10) will likely split into sub-steps. Granularity locked at thesis time, not now.

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

### 2026-05-14 — Week = calendar slot (D6 ratified)

- **D6 (Week is a lazily-materialized calendar slot, not a managed entity).** The plan-detail surface is a **calendar viewport**, not a week-list manager. Settled during the Step 5 thesis discussion. Decisions:
  - No coach-facing "add week" / "remove week" / "add first week" UX. The coach navigates the calendar axis (week = viewport unit, **no free calendar scroll**) and programmes whichever slot they need — empty or not.
  - A `Week` DB row materializes **lazily** — upsert by `(planId, startDate)` on the first `Day` created in that week (Step 6, via `connectOrCreate`/upsert) or the first per-week note. Navigating past empty weeks creates nothing; an empty slot = no `Week` row.
  - Weeks are addressed by `(planId, startDate)`, not `weekId` — the client computes the viewport's `startDate`; the row may not exist. Step 5's Week API surface is therefore read-mostly: `GET .../weeks/[startDate]` + a notes upsert. **No POST-create-week / DELETE-week routes.** Week-row creation as a side-effect of `Day` creation is a Step 6 concern.
  - Plan-detail body layout: **7 full-width day rows** (Mon–Sun), not 7 columns. A Day is a nested document (Session→Block→Schema→SchemaRow), not a calendar event; 7 columns at `maxWidth="lg"` give ~140px/day and content dies. Today's date gets the "Thu 14"-with-bright-circle row-label treatment.
  - Week navigation: prev/next + jump-to-date + "today"; default on open = current calendar week, `?week=<startDate>` URL param overrides.
  - Drove a ratified **prose clarification** of `analysis/artifacts/05-synthesis/domain-model.md §1.0` — the loose "add / remove / clone / clear week" phrasing reframed to calendar-slot + lazy-materialization wording. **No schema change** — the `Week` Prisma model already supports this; no `06-formalization` touch.

### Deferred sub-decisions (default hypothesis applied; revisit on contact)

- **Order semantics**: **sparse integers (10/20/30)** per Phase 4 Q6 (ratified in `analysis/artifacts/06-formalization/er-final.md §5 #7`). Earlier draft in this file mistakenly proposed sequential; reverted 2026-05-12 after Step 1 executor flagged the divergence. Step 2 seed and any insert-helpers must use sparse increments; renumber only on collision.
- **Phase 7 archetypes (super-set)**: include in archetype seed at Step 2. `Intensity` Zod schema admits optional `hrZone` and `numericPace`.
- **Migrations stance**: no versioned migrations during workflow; `db:reset` per schema change per ADR-0019. **Note (Step 2 finding)**: `db:reset` script in this repo runs `prisma db push --force-reset && tsx scripts/apply-sql-checks.ts` only — does NOT auto-seed. After every schema change run `db:reset` then `db:seed` explicitly.
- **`TrainingPlan` naming**: keep as plan-shell (creator/status/name). Plan-content lives below Week.
- **Plan edit/rename UI**: ~~`useUpdateTrainingPlan` exists but no edit UI~~ — **resolved in Step 5** (inline name/description edit in the plan-detail `PageHeader` via the `InlineEditText` primitive).
- **QA-001 — `@db.Date` ↔ local-midnight boundary (Step 5 finding; Step 6+ hard carry-forward)**: `getMonday` / `parseDateParam` (`@repo/shared`) build **local-midnight** `Date`s; Prisma serializes `@db.Date` columns via `toISOString()` (UTC) — so a local-midnight `Date` on a positive-UTC-offset server persists one day early. Step 5 fixed it for `Week.startDate` via `resolveWeekStartDate` in `packages/api-server/src/endpoints/lms/week/admin.ts` (re-anchors the Monday to `Date.UTC(...)` before the Prisma boundary; proven with a `TZ=Asia/Kolkata` test). **Any future step writing a `Date` into a `@db.Date` column must do the same.** Step 6 `Day` materialization upserts a `Week` row (D6) → hits this directly; the Step 6 prompt must spec it.

## Rules / invariants

- `analysis/source/` and `analysis/artifacts/00-meta/`, `01-inventory/`, `02-patterns/`, `03-content/`, `04-structure/` — read-only forever.
- `analysis/artifacts/05-synthesis/` and `06-formalization/` — living source of truth, updated synchronously with every Prisma schema change. Each such update mentioned explicitly in `IMPLEMENTATION_LOG.md`.
- Every step touching Prisma updates seed in the same session; smoke-test scenario cannot be valid without coherent seed.
- Schema changes require thesis approval cycle before prompt finalization.
- Each step lives under `implementation/step-NN/` with `prompt.md` and `output.md`.
- Pre-existing implementations of this domain are deleted (4th attempt). Do not search git history or memory for them. If something surfaces accidentally, halt and surface to user.

## Next action

1. **Step 6 thesis** — Day-level operations within a week. NEW surface, but builds directly on Step 5's `plan-detail` module + `lmsWeekApi`. Per the read-then-spec lesson: read the Step 5 code verbatim before specing — `lmsWeekApi` (`packages/api-server/src/endpoints/lms/week/admin.ts`) is the nested-resource template, `mapToWeek` is the no-enum mapper template, the `plan-detail` components are the consumption seam, plus the `Day` Prisma model + `DayOfWeek` enum + `(weekId, dayOfWeek)` unique constraint. **Hard carry-forward: QA-001** — `Day` creation materializes a `Week` row (D6) via `connectOrCreate`/upsert; the `Week.startDate` write hits the same `@db.Date` boundary, so the Step 6 prompt must spec `resolveWeekStartDate`-style UTC anchoring (reuse the helper directly, or mirror the pattern if the import boundary doesn't allow it). Drafting: тезисы → user approval → `implementation/step-06/prompt.md`.
2. **PR review** — `feat/training-domain` → `main` PR opened at Step 5 close-out, batching Steps 1-5. Review may flag items for follow-up; route them to either a Step-5-followup commit on the same branch or an explicit "deferred to Step N+" note here, then merge or keep open until the plan-editor steps land.
3. **`pnpm build`** — still not run on the workflow branch; not blocking, but recommended as a gate before merging the PR.
