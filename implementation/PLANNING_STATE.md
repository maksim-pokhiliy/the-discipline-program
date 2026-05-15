# Planning State

> Last updated: 2026-05-15 (Step 5 merged to main as PR #191; Step 6 decomposed into 6.0..6.7 atomic sub-steps; Step 6.0 prompt drafted; `feat/training-domain` recreated from main)

## Workflow goal

End-to-end coach happy path:

1. Domain model from `analysis/` ported into `packages/api-server/prisma`.
2. CRUD tables for catalogs (Exercise, Label, Archetype, possibly more) in `apps/admin`, following existing module conventions.
3. Plan editor in `apps/platform/src/modules/plan-detail/` with week-based navigation.
4. Coach can: create catalog entities in admin → create plan in platform → program a week with realistic sessions → data persists per Prisma schema.
5. Athlete flow NOT built. Acceptable to extend Prisma model with athlete-facing entities and seed minimum data so smoke-test paths are not broken.

## Current step

**Step 5 merged** (2026-05-15) — PR #191 `feat: training-domain port (schema, admin catalogs, plan-detail shell)` fast-forward-merged into `main`. 51 commits, Steps 1-5 batched. `feat/training-domain` deleted on `origin`; recreated locally from fresh `main` for Step 6.x work. Step-5-focused suites (contracts, ui, lms api-server) all green; full-suite IAM flake (Neon connection-pool exhaustion under serial-run) noted as pre-existing follow-up — not Step 5.

**Step 6 decomposed** into 8 atomic sub-steps after a thesis-revision cycle that surfaced two product-level corrections (see § "Decisions accepted" D7 + § "Deferred sub-decisions" Q10 / Session.name). Original Step 6 ("Day-level operations: add/edit/reorder/delete + Day.label autocomplete") was rejected by user: Day is a lazily-materialized calendar slot just like Week (D7), so no Day add/remove/reorder UX exists. Coach POV is **session-level operations + day metadata side-channel**, not Day CRUD. Decomposition (see § "Step queue") splits the work into one contract slice → one api-server slice → one day-metadata slice → one platform label mirror → routes → hooks → 2 UI sub-steps (header metadata, then session cards + reorder). Each sub-step = 1 prompt = 1 `/feature` session.

**Step 6.0 prompt drafted** (`implementation/step-06.0/prompt.md`). Contract-only slice: new `entities/lms/_shared/` namespace with `dayOfWeekSchema` (mirror Prisma enum, BLOG_CATEGORY-precedent — Step 3 D11) + new `entities/lms/session/` slice (entity + create/update/reorder write schemas + api-path-params + req/res schemas + tests + barrel). Two deferred sub-decisions bound into the prompt as guardrails: `Session.freezeLoadsAtCreation` stays Prisma-only (Q10 carry-forward), `Session.name` is not added (no schema field, no contract field). Awaiting executor session.

(Step 5 detail — `lms/week` slice, `lmsWeekApi`, `resolveWeekStartDate` UTC anchor, `InlineEditText`, `plan-detail` calendar viewport, OQ-D redirect, the three executor-caught planner bugs — is in `IMPLEMENTATION_LOG.md` § "Step 05 — Plan-detail shell" + the Lesson-learned addendum. Not duplicated here; this section now narrates Step 6.)

## Step queue (draft, refined per iteration)

> Granularity will likely change as we learn. Steps named with provisional titles.

- **Step 1** — Model ratification (no code). Apply 4 ratified decisions (Week, Athlete-derived, full-scope, library-vs-config split) into analysis-artifacts. Output: updated `analysis/artifacts/05-synthesis/{domain-model.md, er-diagram.md}` + `analysis/artifacts/06-formalization/{schema.prisma, er-final.md, implementation-notes.md, types.ts}`. No edits to `packages/api-server`. Likely NOT `/feature` — pure documentation/spec change.

- **Step 2** — Prisma schema port + Archetype seed + minimal user/plan seed. Bring ratified schema into `packages/api-server/prisma/schema.prisma`. Wire seed: 1 coach (User+CoachProfile), 1 athlete (User+AthleteProfile), 1 empty TrainingPlan, all 34 archetypes (full canonical set, derived from `analysis/artifacts/06-formalization/implementation-notes.md` archetype catalog). NO seed for Exercise/Label — user creates via admin UI. `pnpm --filter @repo/api-server db:reset` per ADR-0019; no versioned migrations during workflow.

- **Step 3** — Admin Exercise CRUD + Phase 0 D5 schema refinement. **COMPLETED** 2026-05-13 (HEAD `51302f93`). `apps/admin/src/modules/exercises/` shipped as canonical reference template for future catalog-library CRUD modules. Smoke-test scenario in `implementation/step-03/output.md`.

- **Step 4** — Admin Label CRUD. **COMPLETED** 2026-05-14 (HEAD `252d7323`). Structural mirror of Step 3 Exercise module + `applicableLevels` multi-value checkbox widget (`FormGroup` + 3 `Checkbox`, `fieldState`-subscribed per Step 3.1 regression guard). No schema change. Smoke-test scenario in `implementation/step-04/output.md`.

- **~~Step 5~~ — Platform plan list / create-plan flow. DROPPED 2026-05-14.** Found already implemented as pre-existing base LMS infrastructure (see § "Current step"). Queue renumbered below; old 6-12 → 5-11.

- **Step 5** (was Step 6) — Plan-detail shell (calendar viewport). **COMPLETED** 2026-05-15. `lms/week` contract slice, `lmsWeekApi` (read + lazy notes-upsert with UTC-midnight anchor), platform week API route + hooks, `@repo/ui` `InlineEditText` + additive `PageHeader` extension, `plan-detail` calendar-viewport module, create-plan redirect (OQ-D). Smoke-test scenario in `implementation/step-05/output.md`.

- **Step 6** (was Step 7 + Step 8 absorbed) — Day-level + Session-level operations + day-metadata side-channel + platform-side Label read-mirror. **Decomposed into 8 atomic sub-steps** (2026-05-15) after the user reframed Day per D7 (lazy calendar slot, no add/remove/reorder UX). Coach POV: tag day with one label, leave a note, then program sessions inside the day. Sub-steps:

  - **Step 6.0** — `Session` contract slice + new `entities/lms/_shared/` namespace (`dayOfWeekSchema` mirror). **Prompt drafted** `implementation/step-06.0/prompt.md`. Contract-only, no consumers. Two guardrail decisions bound in: `Session.freezeLoadsAtCreation` Prisma-only (Q10 carry-forward); `Session.name` not added.
  - **Step 6.1** — `lmsSessionApi` (CRUD + reorder via sparse-order recompute) + extract `resolveWeekStartDate` from `lms/week/admin.ts` to `endpoints/lms/_shared/date.ts` (Step 6.1 has 2 callsites — Session create transitively materializes Week; QA-001 hard carry-forward). `mapToSession` mapper. Integration test, including `TZ=Asia/Kolkata` invariance.
  - **Step 6.2** — `lmsDayMetadataApi` (label + notes upsert side-channel; lazy Day materialization on first set) + `getWeekResponseSchema` extension to `{ week, days[7] }` shape. Each `days[i]` carries `{ dayOfWeek, label, notes, sessions: Session[] }`; server always returns all 7 weekdays, empty slots = `{ ..., label: null, notes: null, sessions: [] }`. Update `lmsWeekApi.getByPlanAndDate` to populate the new shape.
  - **Step 6.3** — `lmsLabelPlatformApi` — read-only platform mirror of admin labels (`GET /api/platform/labels?q=`). Reuses existing `cms/label` contract types (no new contract slice). For Day-label autocomplete + Session-label autocomplete in later UI sub-steps.
  - **Step 6.4** — Platform routes: session POST/PUT/DELETE/PATCH:reorder; day-metadata PUT; labels-platform GET; extended week GET (consumes the Step 6.2 shape). All `withCoachAuth(withAuthRateLimit(...))`.
  - **Step 6.5** — Platform client API + hooks: `createSessionsAPI`, `createDayMetadataAPI`, `createLabelsAPI` (platform mirror); `useSession*` family, `useUpdateDayMetadata`, `useLabelSearch`; `useWeek` updated to consume `{ week, days[7] }` shape. **No UI change yet** — `PlanDetailView` keeps rendering empty days, but plumbs the new hook shape.
  - **Step 6.6** — UI part 1: day-row **header** reshape. Each `DayRow` gets a label `Autocomplete` (from labels platform mirror) + an inline `TextField` for notes (multiline, blur-commit). Both lazy-materialize the Day-row server-side. **Smoke-tested.** Sessions area stays placeholder.
  - **Step 6.7** — UI part 2: Session **body**. `SessionCard` (label chip + notes line + trailing menu), "+ Add session" CTA at the bottom of each `DayRow`, dnd-kit reorder within the day (no cross-day move in this step). Inline-create empty session, then inline-edit label/notes via the same pattern as day-row header. **Smoke-tested.**

  Sub-step granularity: 1 prompt = 1 `/feature` session = 1 close-out cycle. Steps 6.0-6.5 = backend/types, smoke-test N/A. Steps 6.6 + 6.7 = UI, scenario-based smoke-tests.

- **Step 7** (was Step 8) — Block-level operations. Block add/edit/delete inside a session; block-label M:N with order; block-level Intensity / TimeCap composites.

- **Step 8** — Schema editor. Archetype picker (from seeded archetype catalog), `archetypeParams` form per archetype (driven by `archetypeParamsSchema`), schema body switching (rows vs subSchemas based on `kind`).

- **Step 9** — SchemaRow editor. Per-rowKind forms (EXERCISE, REST, FOOTNOTE, STANDALONE_LOAD, PLACEHOLDER, INNER_LADDER_MARKER, CONNECTOR, REST_SLOT, REP_DEFINITION, STANDALONE_URL); shared Load / RepNotation / Intensity / Tempo / Side / Media / CompoundRep composites.

- **Step 10** — End-to-end coach happy path smoke-test + cleanup. Manual scenario validated; defects fixed.

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

### 2026-05-15 — Day = calendar slot, mirror of D6 (D7 ratified)

- **D7 (Day is a lazily-materialized calendar slot, mirror of D6).** The "day-level operations" framing in the original queue Step 6 — Day add / edit / reorder / delete — was rejected by the user during the Step 6 thesis cycle: "ты не можешь редактировать ось времени. при входе на plan details ты видишь неделю — 7 строк, по одной на каждый день, и когда тренер заходит — ему не нужно 'создавать дни', ему нужно управлять тренировочными сериями. думай как тренер". Ratified consequences:
  - **No coach-facing "add day" / "delete day" / "reorder day" UX.** `dayOfWeek` is a fixed enum axis (D1); the 7 weekday rows are always visible because they are a calendar fact, not data. Day slot identity = `(weekId, dayOfWeek)`.
  - **A `Day` DB row materializes lazily** via `prisma.day.upsert` (per `(weekId, dayOfWeek)`) on:
    - First `Session` created in the slot (Step 6.1 — `lmsSessionApi.create` issues an atomic `$transaction` that connect-or-creates the Week, then connect-or-creates the Day, then creates the Session).
    - First label set on the day (Step 6.2 — `lmsDayMetadataApi.setLabel`).
    - First notes set on the day (Step 6.2 — `lmsDayMetadataApi.setNotes`).
  - **Day is addressed externally by `(planId, startDate, dayOfWeek)`**, not by `dayId`. The `dayId` is server-internal; client never sees it as an address (only as a field on returned `Session` rows for cache invalidation).
  - **No POST-create-day / DELETE-day routes.** No "clear day" UI in Step 6.x (a Day-row that becomes empty after the last session-delete + null label + null notes is **left as a breadcrumb**; auto-cleanup races concurrent writes and saves no meaningful space).
  - **`getWeekResponseSchema` (Step 6.2)** returns all 7 weekdays as `{ dayOfWeek, label, notes, sessions: Session[] }`, materialized-or-not is invisible to the client: an unmaterialized slot is just `{ ..., label: null, notes: null, sessions: [] }`. Client never branches on materialization state.
  - Drives a future prose clarification of `analysis/artifacts/05-synthesis/domain-model.md §1.1` (Day) — to be done in Step 6.2 if the spec'ing surfaces a divergence; not done now because the Day section already aligns with the calendar-slot framing.

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
- **QA-001 — `@db.Date` ↔ local-midnight boundary (Step 5 finding; Step 6+ hard carry-forward)**: `getMonday` / `parseDateParam` (`@repo/shared`) build **local-midnight** `Date`s; Prisma serializes `@db.Date` columns via `toISOString()` (UTC) — so a local-midnight `Date` on a positive-UTC-offset server persists one day early. Step 5 fixed it for `Week.startDate` via `resolveWeekStartDate` in `packages/api-server/src/endpoints/lms/week/admin.ts` (re-anchors the Monday to `Date.UTC(...)` before the Prisma boundary; proven with a `TZ=Asia/Kolkata` test). **Any future step writing a `Date` into a `@db.Date` column must do the same.** Step 6.1 (`lmsSessionApi.create`) transitively materializes a `Week` row via `connectOrCreate` → hits this directly; Step 6.1 prompt must extract `resolveWeekStartDate` into a shared module (`endpoints/lms/_shared/date.ts`) and reuse it in both `lmsWeekApi` and `lmsSessionApi`.
- **Q10 — `Session.freezeLoadsAtCreation` (Step 6.0 deferred; carry-forward indefinite)**: field exists in Prisma (`schema.prisma:639`, default `false`) as an edge-case toggle for "testing weeks" (per `analysis/artifacts/05-synthesis/edge-cases.md §2.4`, `06-formalization/implementation-notes.md §3.8`, `00-meta/phase-06-prompt.md Q10`). The default coach workflow uses live formula resolution (DP2): 1RM is dynamic, percentage-based loads resolve against the athlete's current 1RM, snapshot mode is **harmful** in the default workflow (athlete sees stale numbers after a fresh PR). **`Session` contract layer does NOT expose this field** in Step 6.0 nor any later 6.x sub-step. The DB column stays default-false; nobody writes or reads it through the contract. Revisited only when (and if) a concrete coach use-case for testing-week toggle materializes — at which point a dedicated sub-step adds it to contract + UI in one shot (D5-Exercise-precedent).
- **Session.name (Step 6.0 deferred; carry-forward indefinite)**: Prisma schema has no `Session.name` field; do NOT add one to the contract "for flexibility". Session identity for coach UX is `(order, label?, notes?)`. Step 6.7 `SessionCard` header will render `label.name || "Session N"` (N derived from `order`). If a real coach need for distinct session naming surfaces, add as a schema change + analysis-artifact sync (D5 precedent), not as an instinct-add field.

## Rules / invariants

- `analysis/source/` and `analysis/artifacts/00-meta/`, `01-inventory/`, `02-patterns/`, `03-content/`, `04-structure/` — read-only forever.
- `analysis/artifacts/05-synthesis/` and `06-formalization/` — living source of truth, updated synchronously with every Prisma schema change. Each such update mentioned explicitly in `IMPLEMENTATION_LOG.md`.
- Every step touching Prisma updates seed in the same session; smoke-test scenario cannot be valid without coherent seed.
- Schema changes require thesis approval cycle before prompt finalization.
- Each step lives under `implementation/step-NN/` with `prompt.md` and `output.md`.
- Pre-existing implementations of this domain are deleted (4th attempt). Do not search git history or memory for them. If something surfaces accidentally, halt and surface to user.

## Next action

1. **Carry `implementation/step-06.0/prompt.md` to an executor session.** `/feature` full pipeline (new contract entity, new namespace, 2 test files, ~10 files; not `/feature small`). Branch is already `feat/training-domain` (recreated from main at this checkpoint). Expected output: executor writes `implementation/step-06.0/output.md`; planner spot-checks against the prompt; close-out IMPLEMENTATION_LOG entry; advance Step 6.1 thesis.
2. **After Step 6.0 closes — Step 6.1 thesis.** `lmsSessionApi` (CRUD + reorder) + extract `resolveWeekStartDate` to `endpoints/lms/_shared/date.ts`. Per read-then-spec: `lmsWeekApi` (Step 5) is the nested-resource template; `mapToWeek` is the no-enum mapper template (Session has nullable FK to Label, otherwise plain copy). Hard carry-forward: QA-001 — Session-create materializes Week via `connectOrCreate`, hits `@db.Date` boundary.
3. **`pnpm build`** — still not run on the workflow branch since the very beginning. Not blocking, but recommended as a final gate before the next merge to `main` (likely after Step 6.5 or Step 6.7).
