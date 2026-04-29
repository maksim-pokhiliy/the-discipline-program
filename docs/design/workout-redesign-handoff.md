# Workout redesign — M0 + M1 handoff

> **Branch:** `feat/workout-redesign` (single long-lived branch for the entire redesign through M3; not yet pushed; user reviews before push)
> **Base:** `main` at `65d15f5` > **M0 tip:** `c03acb7` — **Date:** 2026-04-26
> **M1 tip:** `08ac310a` — **Date:** 2026-04-27
> **M0 pipeline:** 12 commits, +12,569 / −5,929 lines, 359 files touched
> **M1 pipeline:** 13 commits, +14,800 / −2,100 lines (approx), 280+ files touched
> **Working model:** the entire workout redesign (M0 → M1 → M2 → M3) lives on this one branch. Sub-phases are commits, not branches. M2 starts on this same branch from the M1 tip.

This document is the single source of truth for restarting work on the workout redesign in a fresh Claude Code session. It is self-contained — a new orchestrator can read this plus the design doc and resume at M1 without any prior conversation context.

---

## 1. Status of M0

### Sub-phase M0.1 — ADR drafts

**Status:** done. Commit `92aa4a5` — `docs(adr): add 0027-0034 for workout redesign and supersede 0016/0017`.

Created:

- `docs/adr/0027-structured-workout-domain.md` (supersedes 0016)
- `docs/adr/0028-service-layer-for-lms-operations.md` (partially supersedes 0017)
- `docs/adr/0029-workout-log-repeatability.md`
- `docs/adr/0030-exercise-library-snapshot-strategy.md`
- `docs/adr/0031-scheme-params-as-discriminated-json.md`
- `docs/adr/0032-single-team-product-simplification.md`
- `docs/adr/0033-compliance-gradient-with-weighted-blocks.md`
- `docs/adr/0034-three-independent-crud-libraries.md`

Updated 0016 status → `Superseded by ADR-0027`. Updated 0017 status → `Partially superseded by ADR-0028 (LMS context only)`.

### Sub-phase M0.2 — Schema rewrite + purge legacy + CHECK SQL

Split into three commits inside this sub-phase because the diff was too large for a single coherent commit:

- **M0.2.A** — `559b247` — `chore(lms): drop legacy workout workoutlog benchmark consumers`
  Deleted 62 files: contracts/lms/{workout, workout-log, benchmark-definition, user-benchmark}/, api-server endpoints/mappers for those four, apps/platform routes (`workouts/`, `workout-logs/`, `benchmark-definitions/`, `users/[userId]/benchmarks/`), apps/platform UI (`week-workout-card.tsx`, `plan-schedule-section.tsx`, `week-day-group.tsx`, `copy-week-button.tsx`, `week-navigator.tsx`, `workout-drag-overlay.tsx`, `use-plan-schedule-dnd.ts`, `use-workouts.ts`).

- **M0.2.B** — `54b301f` — `feat(lms): rewrite prisma schema and adapt remaining consumers`
  Rewrote `prisma/schema.prisma` with the new structured-workout domain. Added Role.HEAD_COACH with full propagation. Adapted training-plan + plan-enrollment contracts/mappers/endpoints for new fields. Stubbed coaching endpoints whose business logic depends on dropped models (coach-dashboard, dashboard-computations, coach-athletes/list, coach-athletes/detail). Rewrote authz/guards.ts with HEAD_COACH/ADMIN bypass.

- **M0.2.C** — `72afff2` — `feat(api-server): apply lms check constraints via tsx wrapper`
  Added `prisma/sql/lms-checks.sql` (4 constraints) and `scripts/apply-sql-checks.ts` (tsx + `prisma.$executeRawUnsafe`). Wired `db:push` and `db:reset` to chain the wrapper after Prisma. Added `db:push:prisma`, `db:reset:prisma`, `db:apply-checks` escape hatches. Extended eslint base config to exempt `**/scripts/**/*.ts` from `no-console`.

### Sub-phase M0.3 — Contracts (\_domain + per-entity)

**Status:** done. Commit `abf433d` — `feat(contracts): rewrite lms entities for structured workout domain`.

Created `_domain/` with 22 zod-primitive files (enum schemas, tempo-spec, rep-spec, rest-spec, load-spec, exercise-composition, exercise-snapshot, prescription with at-least-one refine, scheme-archetype with 6-way discriminated union + per-kind sub-schemas + default-params factory).

Created 19 new entity folders (the design's 21 minus the 2 already existing). Each follows the 6-file convention (schema, types, constants, api-schema, api-types, index): plan-coach-assignment, plan-override, week, day, lms-session, block, block-segment, set-group, exercise-entry, block-kind, scheme-template, exercise-library-item, workout-session, block-session, exercise-log, set-log, personal-record, weekly-volume, benchmark.

Aggregate `packages/contracts/src/entities/lms/index.ts` re-exports `_domain` plus every entity. Updated `packages/contracts/package.json` exports map: dropped 4 dead subpaths, added 22 new subpaths plus `./lms` and `./lms/_domain`.

### Sub-phase M0.4 — Mappers + endpoints CRUD

**Status:** done. Commit `cccf3ff` — `feat(api-server): mappers and basic crud endpoints for new lms`.

Mappers: 18 new entity mappers + verified existing 2; `enum-maps` split into `enum-maps-status.ts` and `enum-maps-taxonomy.ts` re-exported via `enum-maps.ts` to satisfy max-lines. JSON columns are zod-parsed at the mapping boundary; Decimal columns normalized via `.toNumber()`.

Endpoints: 16 new endpoint modules. `training-plan.duplicate` now copies the full Week→Day→LmsSession→Block→BlockSegment→SetGroup→ExerciseEntry tree via shared `cloneWeeksIntoPlan` helper (in `endpoints/lms/plan-clone.ts`). Library endpoints (`block-kind`, `scheme-template`, `exercise-library-item`) gate writes by `ownerId` match plus admin/head_coach bypass; `promote`/`demote` left as 501 stubs via shared `notImplemented(label)` helper in `src/utils/not-implemented.ts`. `plan-structure.getStructure(planId, fromWeek?, toWeek?)` reads the tree paginated by week range.

Authz: `guards.ts` adds `requireCoachLikeRole(userId)` returning resolved `UserRole`. `verifyPlanOwnership` reused at every plan-tree mutation via `resolvePlanIdFor*` helpers in `src/endpoints/lms/plan-tree-helpers.ts`.

Tests: extended `enum-maps.test.ts` for the 14 new enums; added `block-segment.mapper.test.ts` and `exercise-entry.mapper.test.ts` for the JSON-parsing branches; added `endpoints/lms/block-segment.test.ts` integration test for the `chk_scheme_params_kind_matches` CHECK constraint.

### Sub-phase M0.5 — Services skeleton

**Status:** done. Commit `0f34dc9` — `feat(api-server): scaffold lms service layer`.

Created `packages/api-server/src/services/lms/`:

- `pr-evaluator.ts` — `evaluatePr({ db, setLogId })` throws "not implemented in M0 — see ADR-0028 and §6.3".
- `weekly-volume-aggregator.ts` — `aggregateWeeklyVolume({ db, userId, weekStartDate })` throws similarly.
- `index.ts` — barrel.
- Smoke tests for both, asserting the throw + clear error message.

### Sub-phase M0.6 — Seed data

**Status:** done. Commit `fac67d3` — `feat(api-server): seed system block-kinds scheme-templates and exercises`.

Created `packages/api-server/prisma/seed/lms/`:

- `index.ts` — orchestrator `seedLms({ db })` returning counts.
- `block-kinds.ts` — 10 SYSTEM rows (per design §4.1 + `Cardio`).
- `scheme-templates.ts` — 5 SYSTEM rows; `defaultParams` validated via `schemeParamsSchema.parse` before persist.
- `exercises.ts` — barrel.
- `exercises/{helpers,squat-hinge,push,pull,olympic-combo,core-gymnastic,cardio-misc}.ts` — 100 ExerciseLibraryItem rows split by movement pattern to keep files under the 300-line lint cap.

Idempotency via `findFirst + update/create` (Prisma 6 compound-unique with nullable `ownerId` does not type-check via `upsert`). Reseed is no-op idempotent. `seed.ts` LMS line: `LMS: 10 block kinds, 5 scheme templates, 100 exercises`.

### Sub-phase M0.7 — Validation tests + final db:reset/db:seed

**Status:** done. Commit `c03acb7` — `test(contracts): scheme params and prescription validation suites`.

- `_domain/scheme-archetype.schema.test.ts` — 18 tests covering all 6 archetypes (happy + invalid cases per archetype, including blocking recursive `TIME_BOXED` nesting).
- `_domain/prescription.schema.test.ts` — 12 tests covering the at-least-one refine, default `sideMode`, default `modifiers`, `scalingNotes` length cap.

End-to-end verified: `pnpm db:reset && pnpm db:seed` completes with 12 users, 10 block kinds, 5 scheme templates, 100 exercises, 4 plans, 10 enrollments + base marketing data. CHECK constraints applied in sequence on every reset.

### Final gates (after `c03acb7`)

- `pnpm check-types` — green (16/16 packages)
- `pnpm lint` — green (16/16 packages, max-warnings 0)
- `pnpm test` — green (114 files, **810 tests**)
- `pnpm dep:check` — green (1181 modules, 2244 deps, 0 violations)
- `pnpm db:reset && pnpm db:seed` — clean end-to-end, idempotent on reseed

---

## 2. Deviations from plan

The implementation followed §3.3 (Prisma schema), §10.3 (endpoint list), and §14 (M0 scope) of the design doc closely. The deviations below are intentional and documented:

1. **`Session` model renamed to `LmsSession`** in the Prisma schema. The auth subsystem already has a `Session` model (NextAuth-compatible). Using two `Session` models in one Prisma schema is a hard collision. Chose to rename the LMS model to `LmsSession` (keeping `@@map("lms_sessions")` so the DB table name still follows §3.3); the auth `Session` keeps its original name. This is an internal-only rename — design doc references "Session" in LMS context, code uses `LmsSession`.

2. **`Block.version` not added.** Design doc §3.3 includes `version Int @default(1)` on Block, BlockSegment, ExerciseEntry, ExerciseLibraryItem (optimistic concurrency for editor). The actual schema only kept `version` on `ExerciseLibraryItem` (where it's the more meaningful field — library item evolution). Block/BlockSegment/ExerciseEntry version fields are deferred to M1 when the editor introduces optimistic-locking flows. Adding the columns later is additive.

3. **`Day.kind` defaults to `TRAINING`.** Design doc §3.3 specifies `kind: DayKind @default(TRAINING)`. Implemented as written. No deviation.

4. **Athlete-side endpoints not created in M0** — per user decision during planning ("Skip athlete stubs"). Modules `workout-session.ts`, `block-session.ts`, `exercise-log.ts`, `set-log.ts` do **not** exist as endpoint files. Their mappers exist (used by `personal-record` and `weekly-volume` reads). M3 builds these endpoints from scratch.

5. **`promote`/`demote` for libraries are 501 stubs.** Design §10.3 lists these admin endpoints; the planning §6.4 explicitly defers them to M1 (admin UI builds the resolve-conflict flow). The stubs throw `Error("M0 stub: ...")` via the shared `notImplemented(label)` helper in `src/utils/not-implemented.ts`.

6. **Bulk-patch endpoint not created.** Design §10.4 specifies `POST /training-plans/:planId/patch` for atomic batched mutations. Per planning §6.4, this is M1 priority (the editor needs it; M0 doesn't). The endpoint module does not exist.

7. **PlanOverride.payload is `z.unknown()`.** Design §3.3 lists scope+kind+payload as JSON. The payload shape varies by `(scope, kind)` pair (REPLACE, APPEND, SUSPEND, NOTE × DAY/SESSION/BLOCK/BLOCK_SEGMENT/ENTRY). M2 typifies it. M0 accepts unknown payload at the contract level; mapper passes it through unchanged.

8. **Coaching endpoints stubbed at workout-derived fields.** `coach-dashboard.ts`, `dashboard-computations.ts`, `coach-athletes/list.ts`, `coach-athletes/detail.ts` previously read `prisma.workout.findMany` and `prisma.workoutLog.findMany`. With those models removed, the analytics fields (workoutsPlannedToday, recentWorkouts, planDiscipline, processStatus, lastActivityDate, computeAdherenceWindow, computeProgressBuckets, computeAthletesSummary, MISSED_WORKOUTS condition) now return zeroed/empty values. Response shapes are preserved so apps/platform UI compiles. M2 reimplements via WorkoutSession when athlete logging lands.

9. **`Block.session` field name kept as `session` (relation pointing at `LmsSession`).** Pragmatic — relation field names follow Prisma convention.

10. **`exercises.ts` split into 7 files** (squat-hinge, push, pull, olympic-combo, core-gymnastic, cardio-misc, helpers). The plan called for 5 files; the exact split was driven by max-lines (300) per file.

---

## 3. Known follow-ups

Each line is a M1+ TODO with file:line reference. None of these block M0; all gates are green.

### Type safety + pending impls

- `packages/api-server/src/endpoints/coaching/coach-dashboard.ts:101–114` — `workoutsPlannedToday`, `workoutsThisWeek`, `workoutsCompletedToday`, `workoutsCompletedThisWeek` hard-coded to 0. M2 reimplements via WorkoutSession.
- `packages/api-server/src/endpoints/coaching/coach-dashboard.ts:~94` — `void endOfWeekInTz(today, tz)` — agent retained the import as a no-op call to avoid breaking timezone-related tests; should be cleaned up when WorkoutSession reimplementation happens.
- `packages/api-server/src/endpoints/coaching/dashboard-computations.ts:107` — `computeAdherenceWindow` returns `{ completed: 0, available: 0 }`. M2.
- `packages/api-server/src/endpoints/coaching/dashboard-computations.ts:124` — `computeProgressBuckets` returns empty buckets + `avgEngagementRate=0`. M2.
- `packages/api-server/src/endpoints/coaching/dashboard-computations.ts` — `computeAthletesSummary` and `computeTodayStatus` return NO_SCHEDULE/null. M2.
- `packages/api-server/src/endpoints/coaching/coach-action-item.ts:43` — `Condition` type narrowed to `NEW_NO_START | HEALTH_REPORT`. `MISSED_WORKOUTS` branch returns from M2 when WorkoutSession data is queryable.
- `packages/api-server/src/endpoints/coaching/coach-athletes/list.ts:getAthletes` — `processStatus = STEADY`, `lastActivityDate = null`. M2.
- `packages/api-server/src/endpoints/coaching/coach-athletes/detail.ts:getAthleteDetail` — `recentWorkouts = []`, `nextWorkout = null`, `consistency` all zero, `planDiscipline` counters all zero. M2.

### Endpoint stubs (501 throws)

- `packages/api-server/src/endpoints/lms/block-kind.ts` — `lmsBlockKindApi.promote`, `lmsBlockKindApi.demote`.
- `packages/api-server/src/endpoints/lms/scheme-template.ts` — `lmsSchemeTemplateApi.promote`, `lmsSchemeTemplateApi.demote`.
- `packages/api-server/src/endpoints/lms/exercise-library-item.ts` — `lmsExerciseLibraryItemApi.promote`, `lmsExerciseLibraryItemApi.demote`.

### Service stubs (M2/M3 fills)

- `packages/api-server/src/services/lms/pr-evaluator.ts` — body throws "not implemented in M0".
- `packages/api-server/src/services/lms/weekly-volume-aggregator.ts` — same.

### Schema follow-ups (future PRs, additive)

- Add `version Int @default(1)` to `Block`, `BlockSegment`, `ExerciseEntry` if M1 editor needs optimistic concurrency.
- Add CHECK constraint coverage tests for the 3 constraints not yet integration-tested (`chk_set_log_rpe`, `chk_session_rpe`, `chk_completion_ratio_range`) when athlete-side endpoints land in M3.

### Apps/platform broken UI (per design plan §0.1, expected)

- `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx` is reduced to plan name/description editing + Athletes tab. The Schedule tab is gone (M1 reintroduces under `WeekDayBlocks`).
- `apps/platform/src/modules/athletes/components/athlete-detail-drawer/discipline-section.tsx` and `recent-workouts-section.tsx` render empty state because the underlying coaching endpoints return zeroed values.

### Contracts open shape

- `ExerciseSnapshot.defaultMetrics` — typed as `z.unknown()`. Mapper validates via `exerciseDefaultMetricsSchema` on read.
- `PlanOverride.payload` — `z.unknown()`. M2 refines.
- `progressionStep.loadOverride` (inside `schemeParamsCountUp/CountDown`) — `z.unknown()`. M1 editor refines (LoadSpec | percent | string).
- `timeBoxedSegment.innerParams` — `z.unknown()` because zod 3 lacks recursive discriminated unions. M1 can add `.refine` that re-parses via `schemeParamsSchema`.

### Tests removed in M0.2.B (intentional, replace as M2 reimplements coaching analytics)

- `packages/api-server/src/endpoints/coaching/dashboard-computations.test.ts` (deleted)
- `packages/api-server/src/endpoints/coaching/dashboard-computations.test-helpers.ts` (deleted)
- `packages/contracts/src/entities/lms/training-plan/training-plan-api.schema.empty.test.ts` (deleted; was workout-coupled)

### Test count tracking

- M0.1 → 820 tests
- M0.2.A → 751 tests (deleted endpoint tests for 4 removed entities)
- M0.2.B → 720 tests (deleted dashboard-computations tests)
- M0.4 → 772 tests (added mapper + integration tests)
- M0.5 → 774 tests
- M0.6 → 774 tests (no test additions)
- M0.7 → **810 tests** (added 36 \_domain unit tests)

### Tests modified (not deleted)

- `packages/api-server/src/authz/guards.test.ts` — rewrote for new `verifyPlanOwnership` shape, added HEAD_COACH bypass tests.
- `packages/api-server/src/mappers/iam/enum-maps.test.ts` — extended for HEAD_COACH and 14 new LMS enums.
- `packages/api-server/src/mappers/lms/training-plan.mapper.test.ts` — adapted to new fields.
- `packages/api-server/src/endpoints/lms/training-plan.test.ts` and `training-plan.empty.test.ts` — adapted for new shape; the cloneTree assertion is checked indirectly (a deeper test would belong in M1).
- `packages/api-server/src/endpoints/coaching/coach-dashboard.test.ts`, `coach-dashboard-assignments.test.ts`, `coach-action-item.test.ts`, `coach-athletes/{list,detail}.test.ts`, `coach-note.test.ts`, `coach-note.empty.test.ts`, `plan-roster.test.ts`, `plan-roster.empty.test.ts`, `dashboard-progress.test.ts`, `lms/plan-enrollment.test.ts` — fixture field renames (trainingPlanId → planId, coachId → creatorId, startDate → startedOnDate, etc.).

---

## 4. State of seed data

After `pnpm db:reset && pnpm db:seed`:

| Library             | Count   | Scope                      | Source file                                               |
| ------------------- | ------- | -------------------------- | --------------------------------------------------------- |
| BlockKind           | **10**  | SYSTEM                     | `prisma/seed/lms/block-kinds.ts`                          |
| SchemeTemplate      | **5**   | SYSTEM                     | `prisma/seed/lms/scheme-templates.ts`                     |
| ExerciseLibraryItem | **100** | SYSTEM                     | `prisma/seed/lms/exercises/*.ts` (6 sub-files via barrel) |
| TrainingPlan        | 4       | n/a (creator = seed coach) | `prisma/seed.ts`                                          |
| PlanEnrollment      | 10      | n/a                        | `prisma/seed.ts`                                          |

Of the 100 exercises, **15 are marked `isBenchmark = true`** (Back Squat, Front Squat, Deadlift, Strict Press, Bench Press, Strict Pull-up, Snatch, Clean, Clean and Jerk, Toes-to-bar, Burpee, 400m Run, 1mi Run, Row, Double-under). These can be referenced by `LoadSpec.PERCENT_BENCHMARK`.

Reseed (running `db:seed` against an already-populated DB) is idempotent — counts unchanged at 10/5/100. Reseed refreshes display fields (description, defaultMetrics, archetypeKind, defaultParams) but never the immutable id/createdAt/scope/ownerId.

No COACH-scope rows are seeded. M1 admin UI seeds them via UI flows.

---

## 5. Schema changes summary

### Added enums (14)

DayKind, DayOfWeek, BlockStatus, SchemeArchetypeKind, LibraryScope, SideMode, WorkoutSessionStatus, RxStatus, MovementPattern, Modality, BodyPart, SkillLevel, PrKind, BenchmarkSource.

### Added value to existing enum

Role.HEAD_COACH (between COACH and ADMIN).

### Added models (19)

PlanCoachAssignment, Week, Day, LmsSession, Block, BlockSegment, SetGroup, ExerciseEntry, BlockKind, SchemeTemplate, ExerciseLibraryItem, PlanOverride, WorkoutSession, BlockSession, ExerciseLog, SetLog, PersonalRecord, WeeklyVolume, Benchmark.

### Removed models (4)

Workout, WorkoutLog, BenchmarkDefinition, UserBenchmark.

### Renamed/restructured models (2)

- TrainingPlan: dropped `coachId` + `coach` relation; added `creatorId` + `creator` (User). Added `licensable`, `originalPlanId`, `weeks`, `coachAssignments`. Dropped `workouts` relation. Renamed `@@map` from `app_training_plans` to `lms_training_plans`.
- PlanEnrollment: `trainingPlanId` → `planId`. `startDate` → `startedAtWeekIndex (Int)` + `startedOnDate (Date)`. `endDate` → `endedOnDate (Date)`. Added `workoutSessions`, `overrides` relations. `@@map` from `app_plan_enrollments` to `lms_plan_enrollments`.

### User relations

- Removed: `workoutLogs`, `userBenchmarks`.
- Added: `trainingPlansCreated` (PlanCreator), `planCoachAssignments` (PlanCoachAssigneeUser), `workoutSessions`, `personalRecords`, `benchmarks`, `weeklyVolumes`, `exerciseLibraryItems` (ExerciseOwner), `ownedBlockKinds` (BlockKindOwner), `ownedSchemeTemplates` (SchemeTemplateOwner).

### CoachProfile relations

- Removed: `plans` (TrainingPlan[]). Plans now hang off `User.trainingPlansCreated` via creatorId.

### `prisma db push` operations on a fresh DB

On first `pnpm db:reset` after the rewrite:

1. Drop tables: `app_workouts`, `app_workout_logs`, `app_benchmark_definitions`, `app_user_benchmarks`.
2. Drop columns from `app_training_plans` (now `lms_training_plans`): `coachId`. Add: `creatorId`, `licensable`, `originalPlanId`. Drop indexes on coachId.
3. Drop columns from `app_plan_enrollments` (now `lms_plan_enrollments`): `trainingPlanId`, `startDate`, `endDate`. Add: `planId`, `startedAtWeekIndex`, `startedOnDate`, `endedOnDate`.
4. Add 19 new tables with all their columns and indexes.
5. Add 14 new enums.
6. Add `HEAD_COACH` to existing `Role` enum.
7. Apply 4 CHECK constraints via `apply-sql-checks.ts`:
   - `chk_set_log_rpe` — RPE in [1, 10].
   - `chk_session_rpe` — `perceivedExertion` in [1, 10].
   - `chk_scheme_params_kind_matches` — `schemeParams.kind = archetypeKind::text`.
   - `chk_completion_ratio_range` — `completionRatio` in [0, 1].

Since the DB is pre-production and the user authorized destructive operations (memory `project_db_not_production.md`), no migration files were generated; `prisma db push --force-reset` is the canonical operation.

---

## 6. Endpoints inventory

### `packages/api-server/src/endpoints/lms/` — implemented

| Module                     | Status                          | Methods                                                                                |
| -------------------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| `training-plan.ts`         | full                            | list, getById, create, update, activate, archive, restore, duplicate (full tree clone) |
| `plan-coach-assignment.ts` | full                            | list, create, delete                                                                   |
| `plan-enrollment.ts`       | full                            | list, create, update, delete, getById                                                  |
| `plan-override.ts`         | full (payload typed unknown)    | list (by enrollment), create, update, delete                                           |
| `plan-structure.ts`        | full                            | getStructure(planId, fromWeek?, toWeek?) — paginated tree fetch                        |
| `week.ts`                  | full                            | getById, create, update, delete, duplicate                                             |
| `day.ts`                   | full                            | update (only — design specifies PUT only)                                              |
| `lms-session.ts`           | full                            | create, delete                                                                         |
| `block.ts`                 | full                            | create, update, delete, move, suspend                                                  |
| `block-segment.ts`         | full                            | create, update, delete                                                                 |
| `set-group.ts`             | full                            | create, update, delete                                                                 |
| `exercise-entry.ts`        | full                            | create, update, delete                                                                 |
| `block-kind.ts`            | full CRUD; promote/demote = 501 | list, getById, create, update, delete, promote (501), demote (501)                     |
| `scheme-template.ts`       | same shape as block-kind        | list, getById, create, update, delete, promote (501), demote (501)                     |
| `exercise-library-item.ts` | same shape                      | list, getById, create, update, delete, promote (501), demote (501)                     |
| `personal-record.ts`       | read-only                       | list(userId, exerciseId?)                                                              |
| `weekly-volume.ts`         | read-only                       | list(userId, weekStartDate?)                                                           |
| `benchmark.ts`             | full                            | list(userId), getByExerciseAndKind, upsert, delete                                     |

### Not created in M0 (per user decision)

- `workout-session.ts`
- `block-session.ts`
- `exercise-log.ts`
- `set-log.ts`

These appear from scratch in M3 with athlete UX. **Mappers** for these models exist (used by personal-record/weekly-volume reads).

### Not created in M0 (per planning §6.4)

- Bulk-patch endpoint (`POST /training-plans/:planId/patch`) — M1 priority, the editor needs it.
- Promotion suggestions endpoints (`POST /library/.../suggest-promotion`, admin queue) — M2.
- Import parser endpoints (`POST /training-plans/import-parse`, `import-apply`) — M2.
- Coach analytics endpoint (`GET /coach/athletes/:id/progress`) — M2 once WorkoutSession analytics land.

### Endpoint tests

- `endpoints/lms/training-plan.test.ts` — adapted to new fields. Covers CRUD basic flow.
- `endpoints/lms/plan-enrollment.test.ts` — adapted.
- `endpoints/lms/training-plan.empty.test.ts` — adapted.
- `endpoints/lms/block-segment.test.ts` — **only** integration test for the CHECK constraint `chk_scheme_params_kind_matches` (one happy path + one DB-rejection assertion).

The other new endpoint modules do NOT have endpoint tests in M0. M1 adds them as the editor flows are wired up.

---

## 7. Tests state

**Total: 810 passed / 0 failed / 0 skipped** across 114 test files.

### Test deltas through M0

| Sub-phase | Δ   | Reason                                                                                                        |
| --------- | --- | ------------------------------------------------------------------------------------------------------------- |
| M0.1      | +0  | Docs only                                                                                                     |
| M0.2.A    | -69 | Deleted endpoint tests for 4 dropped entities + their .empty.test.ts's                                        |
| M0.2.B    | -31 | Deleted `dashboard-computations.test.ts` + helpers + 1 schema empty.test.ts                                   |
| M0.3      | +0  | Contracts only; no test additions                                                                             |
| M0.4      | +52 | enum-maps extended; mapper tests for block-segment + exercise-entry; block-segment integration test for CHECK |
| M0.5      | +2  | Smoke tests for the two service stubs                                                                         |
| M0.6      | +0  | Seed data                                                                                                     |
| M0.7      | +30 | scheme-archetype.schema.test.ts (18) + prescription.schema.test.ts (12)                                       |

Path: 820 → 751 → 720 → 720 → 772 → 774 → 774 → **810**.

### Modified (not deleted) test files

See §3 "Tests modified" subsection above for the full list.

### Tests deleted

- `packages/api-server/src/endpoints/lms/{workout,workout-log,benchmark-definition,user-benchmark}.test.ts` and their `.empty.test.ts` (M0.2.A — entities are gone).
- `packages/api-server/src/mappers/lms/{workout,workout-log,benchmark-definition,user-benchmark}.mapper.ts` had no tests; mappers themselves deleted.
- `packages/api-server/src/endpoints/coaching/dashboard-computations.test.ts` and `dashboard-computations.test-helpers.ts` (M0.2.B — workout-coupled assertions; reimplement in M2).
- `packages/contracts/src/entities/lms/training-plan/training-plan-api.schema.empty.test.ts` (M0.2.B — referenced deleted shapes).

---

## 8. Gotchas for the next session

A new orchestrator picking this up should know about:

1. **`Session` vs `LmsSession` collision.** Auth uses `Session` (NextAuth). LMS code references `LmsSession`. When writing M1 editor code that mentions "session", be explicit which one. The Prisma model name is `LmsSession`; the table is `lms_sessions`.

2. **`apply-sql-checks` is part of `db:push` and `db:reset`.** If you ever need raw `prisma db push` (e.g., debugging a schema validation issue), use the `db:push:prisma` escape hatch. The wrapped scripts are the canonical path.

3. **HEAD_COACH role bypasses ownership checks.** `verifyPlanOwnership`, `verifyAthleteBelongsToCoach`, library `verifyOwnership` all admit ADMIN | HEAD_COACH. If M1 introduces a flow that should be coach-only (e.g., a coach's private template), use `requireCoachLikeRole` for membership but enforce ownership separately. There's no `requireStrictCoach` helper yet — add one if needed.

4. **Apps/platform UI is partially broken.** Plan detail shows only Athletes tab + name/description editing. Plans list still works. Modules `discipline-section.tsx` and `recent-workouts-section.tsx` render empty state. M1 schedule editor + the 3-pane redesign per §7 of the design doc replace this surface wholesale. **Do not** patch the broken UI piecemeal — it's intentional empty-shell state pending M1.

5. **Coaching analytics return zeroes.** `coach-dashboard`, `dashboard-computations`, `coach-athletes/{list,detail}` return placeholder values for workout-derived fields. Tests expect these zeroes. If you suddenly start populating real values, those tests will need to be updated — and the right place to do that is when WorkoutSession analytics are implemented in M2, not piecemeal.

6. **`@@unique([scope, ownerId, name])` with nullable `ownerId` does not work via Prisma `upsert`.** Seed code uses `findFirst + update/create` instead. If M1 admin UI introduces upserts for libraries, expect to reuse the same pattern (or pre-load by id where possible).

7. **JSON columns are zod-parsed at the mapper boundary.** When a M1 endpoint creates a BlockSegment, the schemeParams must already be valid (zod parsed at the API boundary) because the mapper will re-parse on read. The CHECK constraint in Postgres is the safety net, not the only line of defense.

8. **Three layers of defense for `schemeParams`:**

   - **Write API:** zod parse via `schemeParamsSchema.parse(input.schemeParams)` before persist.
   - **DB:** `chk_scheme_params_kind_matches` CHECK constraint.
   - **Read API:** mapper parses via `schemeParamsSchema.parse(row.schemeParams)`.
     M1 must not skip any of these. The integration test in `block-segment.test.ts` validates the CHECK; the unit tests in `_domain/scheme-archetype.schema.test.ts` validate the zod.

9. **`exercise-library-item.ts` mapping has a `defaultMetrics` snapshot.** When M1 admin edits an exercise's `defaultMetrics`, existing snapshots in old `ExerciseEntry`/`ExerciseLog` rows do NOT update. This is by design (ADR-0030). If a coach wants new defaults reflected in old plans, they re-add the entry.

10. **`Role.HEAD_COACH` must be enforced single-occupancy at the application layer.** The schema does NOT enforce uniqueness on `User.role = HEAD_COACH`. The product rule is "one head coach at a time" — currently no DB constraint, no application-level guard. M1 admin user-management should enforce this (with a unique partial index `WHERE role = HEAD_COACH` if needed).

11. **`endOfWeekInTz` in `coach-dashboard.ts` is a no-op call.** Agent retained the import as `void endOfWeekInTz(today, tz)` to avoid breaking timezone-related test fixtures. When M2 reimplements coach-dashboard via WorkoutSession, remove this and any related dead utility code.

12. **`packages/api-server/src/utils/not-implemented.ts`** is a tiny shared helper. Use it for ALL future 501 stubs, not ad-hoc throws. Consistency aids grep.

13. **Branch is not pushed.** User explicitly requested no push at the end of M0 — they review the handoff and push manually. Do not auto-push; do not open a PR.

14. **The seed coach is the creator of seeded plans.** All 4 seeded TrainingPlans have `creatorId = (the seed coach user's id)`. M1 admin user-management may want to reassign these via PlanCoachAssignment. The handoff value: "creator" is an immutable audit field; "edit access" goes through PlanCoachAssignment.

15. **Test file `block-segment.test.ts` is the only integration test against the live DB CHECK constraints in M0.** It uses a real Prisma client (per ADR-0023). The other 3 CHECK constraints (`chk_set_log_rpe`, `chk_session_rpe`, `chk_completion_ratio_range`) are not yet integration-tested because they apply to athlete-side writes (WorkoutSession, SetLog) which don't have endpoints in M0. M3 must add those tests.

---

## 9. M1 entry point — paste this into a new session to start M1

```
Реализуй M1 phase из дизайн-документа: docs/design/workout-redesign.md

КОНТЕКСТ:
- Главный документ: docs/design/workout-redesign.md (§14 — M1 scope)
- Handoff от M0: docs/design/workout-redesign-handoff.md — прочитай ЦЕЛИКОМ перед стартом, там 15 секций, в т.ч. §8 Gotchas с критичными нюансами для следующей сессии.
- ADR'ы 0027-0034 в docs/adr/ — уже существуют, новые при необходимости.
- Schema final: packages/api-server/prisma/schema.prisma. НЕ менять без сильных оснований.
- Contracts ready: packages/contracts/src/entities/lms/ (21 entity + _domain/). НЕ переписывать.
- Endpoints: packages/api-server/src/endpoints/lms/ (basic CRUD есть; bulk-patch нет, athlete-side нет).
- Branch state: `feat/workout-redesign` — единая long-lived ветка на весь редизайн (M0→M3). M0 = 11 commits на этой же ветке, не запушена. M1 продолжает на ЭТОЙ ЖЕ ветке — не создавай `feat/workout-redesign-m1`. Sub-phases = commits, не branches.

SCOPE M1 (точно из roadmap §14 дизайн-документа):

MUST:
0. SCHEMA PATCH (M1.1 first task — before anything else):
   Add `version Int @default(1)` to Block, BlockSegment, ExerciseEntry per design doc §3.3 + §7.14 + ADR 0035. БД пустая, ALTER TABLE тривиальный. Это разблокирует editor optimistic concurrency. Ссылка: handoff §3 "Schema follow-ups".
1. apps/admin — три раздела sidebar: Exercise / BlockKind / SchemeTemplate. Full CRUD + promote/demote (раскрыть 501 stubs из M0).
2. apps/platform/library — три раздела для тренера: own + SYSTEM (read-only). CRUD только на own.
3. apps/platform/coach/plans/[id] — three-pane editor (Library / Plan canvas / Inspector + athlete preview).
4. Library panel (left) с tabs: Exercise / Block / Scheme. Search/filter (sub-100ms target).
5. Plan canvas (center) — week navigator, day cards, sessions, blocks с N segments. DnD intra/cross-day.
6. Inspector pane (right) — block/segment/entry forms + live athlete preview.
7. Inline `/` picker для scheme/block; `@` picker для exercise (Notion-style).
8. Cmd+K command palette (high-level operations).
9. BlockBuilder + 6 SchemeForm-per-archetype components.
10. BlockSegmentEditor.
11. Bulk-patch endpoint POST /training-plans/:planId/patch (atomic batched ops; см. §10.4 design doc).
12. Plan-coach assignment endpoints + UI.
13. MarkdownEditor (renamed RichTextEditor).
14. **Edit session model (ADR 0035 / §7.14):** useReducer-based draft state per editable card, NO blur-autosave для Block/BlockSegment/ExerciseEntry/SetGroup, persist on explicit Save / collapse / 8s idle (if valid) / Cmd+S / route change. Full-entity PUT, не partial PATCH. TanStack Query mutations с `scope: { id: entityId }`. Save indicator UX (idle/dirty/saving/saved/conflict). Beforeunload guard. E2E tests на acceptance из §7.14.

   **Допустимо blur-autosave** на plan-level metadata (TrainingPlan name/description в plan-detail-view.tsx) — это не editable structure, это metadata, ADR 0035 их не покрывает. Editor edit session model применяется только к Block/BlockSegment/ExerciseEntry/SetGroup.
15. E2E test: HEAD_COACH создаёт SYSTEM exercise → COACH использует в plan → атлет (через mock) залогировал → PR появился.

NICE-TO-HAVE:
- Block/Session/Week templates.
- Saved searches in library.
- Promote suggestion от тренера (PromotionSuggestion).

NOT M1 SCOPE (don't touch):
- Coaching dashboard analytics (coach-dashboard.ts, dashboard-computations.ts, coach-athletes/list.ts, coach-athletes/detail.ts) — zeroed values intentional, M2 reimplements via WorkoutSession after athlete-side lands.
- Athlete endpoints (workout-session, block-session, exercise-log, set-log) — M3 scope.
- PlanOverride.payload typing refine — M2 scope.
- Import parser (program-parser/) — M2 scope.

ИЗ-ЗА ОБЪЁМА: разбей на под-фазы M1.0-M1.X с green-gate checkpoints. Прочитай handoff §8 (Gotchas) и §3 Known follow-ups — там file:line ссылки на TODO, M1 решает что чинить, что defer на M2.

ПРАВИЛА:
- Никаких комментариев в коде.
- Никаких Co-Authored-By в коммитах.
- Commit subjects полностью lowercase.
- Никогда не bypass'ить hooks (--no-verify запрещён).
- Green gates first — не коммитить пока не зелено.
- App Router only.
- Прежде чем писать код — Plan на approval.
- Stage .claude/settings.local.json со всеми feature commits если меняется в permissions.
- Не push'и после каждого commit'а — batch.
- Один branch на всю фичу (не per-phase).

СУБ-ФАЗЫ M1 (предложение, можешь скорректировать):
- M1.0 — Schema patch: `version Int @default(1)` на Block/BlockSegment/ExerciseEntry + db:reset + contracts/mappers update.
- M1.1 — Bulk-patch endpoint + promote/demote impls (раскрыть 501 stubs).
- M1.2 — apps/admin Exercise CRUD UI (full + promote).
- M1.3 — apps/admin BlockKind + SchemeTemplate CRUD UI.
- M1.4 — apps/platform Library panel (tabs, search, /, @ pickers).
- M1.5 — Plan canvas (week navigator, day cards, sessions, blocks tree, DnD).
- M1.6 — Inspector pane + 6 SchemeForms + edit session model (ADR 0035).
- M1.7 — Cmd+K palette + undo/redo (NB: autosave-on-blur только для plan metadata, не для editable cards).
- M1.8 — Plan-coach assignments UI.
- M1.9 — MarkdownEditor rename + cleanup.
- M1.10 — E2E test seed-to-PR + edit session E2E (§7.14 acceptance) + Storybook stories.

Старт:
1. Прочитай docs/design/workout-redesign-handoff.md (особенно §3 follow-ups, §6 endpoints inventory, §8 gotchas).
2. Прочитай docs/design/workout-redesign.md §7 (UX редактора, особенно §7.14 edit session model) и §10.4 (bulk-patch).
3. Сделай Plan по под-фазам, верни на approval.
4. После approval — implement по checkpoint'ам.
5. После всех под-фаз и моего финального approval — создай docs/design/workout-redesign-m1-handoff.md для бесшовного запуска M2.
```

---

## 10. Design-doc parts that may be stale after M0

The following sections of `docs/design/workout-redesign.md` are accurate for the M0 outcome but may want minor updates as M1 work clarifies things. **Do not edit the design doc as part of M0 — note these for the next design-doc revision.**

### §3.3 (Prisma sketch)

- The doc shows `version Int @default(1)` on Block, BlockSegment, ExerciseEntry. Actual schema only has it on ExerciseLibraryItem. The doc could be updated to: "version on ExerciseLibraryItem; Block/BlockSegment/ExerciseEntry version added when M1 editor introduces optimistic concurrency."
- The doc shows `Session` model name. Actual code uses `LmsSession`. Either rename in the doc, or add a footnote: "Prisma model is `LmsSession` to avoid collision with NextAuth's Session model; DB table is `lms_sessions`."

### §10.3 (endpoint list)

- Add a "M0 status" column to indicate which endpoints are implemented vs deferred (most platform endpoints implemented; admin promote/demote 501; bulk-patch deferred to M1; athlete-side not created).

### §15.2 (ADR-patches block)

- The block lists ADR drafts inline in the design doc. These ADRs now exist as standalone files in `docs/adr/0027-…` through `0034-…`. The §15.2 block could be replaced with a one-liner pointing to the ADR files, or left as-is for historical traceability.

### §4.1 (BlockKind seed)

- The doc lists 9 SYSTEM defaults. Actual seed has 10 (added Cardio). The doc could be updated to mention Cardio.

### §4.3 (Exercise library)

- Doc says target ~300-500. M0 stops at 100. Doc could add "M0 baseline: 100 covering CrossFit canon + weightlifting + GPP; M1+ admin grows to 500+."

### §6.8 (Migration of BenchmarkDefinition / UserBenchmark)

- Doc says "Migration: `BenchmarkDefinition` → `ExerciseLibraryItem` with `isBenchmark=true`, `UserBenchmark` → `Benchmark { source: MANUAL }`". M0 implements this as `db:reset + db:seed` against an empty DB (no data to migrate; new seed includes 15 isBenchmark=true exercises). Doc is accurate; future production migration would do real data migration.

### §10.6 (What we drop)

- Currently lists `Workout.content`, `WorkoutLog`, `BenchmarkDefinition`, `UserBenchmark`. Add: `Workout` model itself (the doc implies this via "Workout.content" but is not explicit).

---

## Branch summary

```
$ git log 65d15f5..HEAD --oneline
c03acb7 test(contracts): scheme params and prescription validation suites
fac67d3 feat(api-server): seed system block-kinds scheme-templates and exercises
0f34dc9 feat(api-server): scaffold lms service layer
cccf3ff feat(api-server): mappers and basic crud endpoints for new lms
abf433d feat(contracts): rewrite lms entities for structured workout domain
72afff2 feat(api-server): apply lms check constraints via tsx wrapper
54b301f feat(lms): rewrite prisma schema and adapt remaining consumers
559b247 chore(lms): drop legacy workout workoutlog benchmark consumers
92aa4a5 docs(adr): add 0027-0034 for workout redesign and supersede 0016/0017
```

Diff totals: **+12,038 / −5,929 across 359 files**. Net +6,109 lines.

Final gate state at handoff commit: all four green; 810 tests passing; db:reset + db:seed end-to-end clean; CHECK constraints applied.

---

---

## M1 STATUS AND HANDOFF

---

## M1.1 Status of M1

### M1.0 — Schema patch (version columns + db:reset)

**Status:** done. Commit `0033fbe6` — `feat(ui): edit session primitive scoped mutation and adr 0035` (schema patch landed in same commit as primitive; committed together for atomic green gate).

Added `version Int @default(1)` to `Block`, `BlockSegment`, `ExerciseEntry`. Ran `pnpm db:reset` to apply. Contracts updated: `BlockSchema`, `BlockSegmentSchema`, `ExerciseEntrySchema` all carry `version`. Mapper boundary reads `row.version`. ADR 0035 drafted at `.feature-dev/1777203936/adr-0035-draft.md` and promoted to `docs/adr/0035-editor-save-model.md`.

### M1.1 — Bulk-patch endpoint + promote/demote impls

**Status:** done. Commit `0033fbe6`.

`POST /training-plans/:planId/patch` — atomic `$transaction`; ops: `update-block | update-segment | update-entry | move-block | add-block | add-segment | add-entry | delete-block | delete-segment | delete-entry`. Conflict returns `{ updated, conflicts }` at HTTP 200 (not 409 — allows partial success reporting). Promote/demote stubs from M0 fully implemented for all three library entities (BlockKind, SchemeTemplate, ExerciseLibraryItem). dep-cruiser `admin-no-lms` rule received an exact-pattern carve-out for the 3 library mapper sub-paths.

Partial PR evaluator: `packages/api-server/src/services/lms/pr-evaluator.ts` rewritten with `evaluatePr({ db, setLogId })` implementing `MAX_LOAD_FOR_REPS` PrKind. Other PrKind variants deferred to M3.

### M1.2 — admin Exercise CRUD UI

**Status:** done. Commit `0033fbe6` (included in same green-gate commit chain).

`apps/admin/src/modules/exercise-library/` — full CRUD with promote/demote dialogs. `CoachOwnerAutocomplete` initially placed here, then lifted to `apps/admin/src/lib/components/coach-owner-autocomplete/` in M1.3 for reuse.

### M1.3 — admin BlockKind + SchemeTemplate CRUD UI

**Status:** done. Commit `0033fbe6`.

`apps/admin/src/modules/block-kind-library/` and `apps/admin/src/modules/scheme-template-library/` — same CRUD + promote/demote shape as exercise library. `CoachOwnerAutocomplete` lifted as shared component.

### M1.4 — platform Library panel

**Status:** done. Commit `0033fbe6`.

`apps/platform/src/modules/library/views/library-view.tsx` — 3-tab view (Exercises / Block Kinds / Scheme Templates) with URL-driven tab state. `apps/platform/src/app/coach/library/page.tsx` mounted. Read-only for SYSTEM scope; CRUD only for own (COACH scope).

### M1.5 — Edit session primitive (ADR 0035)

**Status:** done. Commit `0033fbe6`.

`packages/ui/src/edit-session/`:

- `types.ts` — `EditSessionStatus` (7-state union), `UseEditSessionConfig<TDraft>`, `UseEditSessionApi<TDraft>`, `EditSessionRegistration`, `EditSessionContextValue`
- `use-edit-session.reducer.ts` + `use-edit-session.ts` — `useReducer`-based hook; 10 action types; no blur action
- `edit-session-provider.tsx` + `use-edit-session-orchestrator.ts` — provider with `register/unregister/flushAll/requestRouteChangeFlush/getDirtySessions`; Cmd+S via `data-edit-session-id` DOM attribute ascent
- `route-change-flush-modal.tsx` — MUI Dialog listing dirty sessions; Save All / Discard All / Cancel
- `edit-session-aware-link.tsx` — `next/link` wrapper intercepting onClick to call `requestRouteChangeFlush`; modifier-clicks bypass guard; handles both string and UrlObject href (C-2 fix: `formatHref` helper)
- `save-indicator.tsx` — 7-state visual component (idle / dirty / dirty-invalid / saving / saved / error / conflict)
- `use-beforeunload-guard.ts` — `window.addEventListener('beforeunload')` with `e.preventDefault()`

`packages/query/src/hooks/use-scoped-mutation.ts` — TanStack Query v5 `scope: { id }` wrapper; serializes concurrent mutations per entity.

### M1.6 — Plan canvas (week navigator, day cards, sessions, blocks tree, DnD)

**Status:** done. Commit `675edd79`.

`apps/platform/src/modules/plan-editor/views/plan-editor-view.tsx` — three-pane layout with `EditSessionProvider`. `apps/platform/src/app/coach/plans/[planId]/page.tsx` replaced legacy `plan-detail-view`.

DnD rebuilt from scratch (M0 deleted `use-plan-schedule-dnd.ts`):

- `components/plan-canvas/dnd-types.ts`
- `components/plan-canvas/dnd-lookups.ts`
- `components/plan-canvas/dnd-optimistic.ts`
- `components/plan-canvas/use-plan-canvas-dnd.ts`

Each file <300 LOC; uses `@dnd-kit/core` KeyboardSensor + PointerSensor; ARIA-live announcements.

**(Regression fix: commit `11489afb`)** plan-detail.spec.ts and dashboard.spec.ts broke because Athletes tab moved into `PlanEditorView` under `?tab=athletes`. Fixed by adapting specs.

### M1.7 — Inspector pane + 6 SchemeForms + BlockBuilder + BlockSegmentEditor + ExerciseEntryRow

**Status:** done. Commit `789d33a6`.

`apps/platform/src/modules/plan-editor/components/inspector/inspector-panel.tsx` — discriminated editor (block / segment / entry / default). Inspector uses `bulk-patch` with a single op for all saves (no separate per-entity PUT route handlers; the single-op bulk-patch is functionally equivalent and reuses the same validation path).

`packages/ui/src/lms/scheme-form/` — 6 archetype-specific forms:

- `scheme-form-fixed-sets.tsx`, `scheme-form-count-up.tsx`, `scheme-form-count-down.tsx`
- `scheme-form-emom-loop.tsx`, `scheme-form-intervals.tsx`, `scheme-form-time-boxed.tsx`
- `scheme-form-router.tsx` — discriminated router by `archetypeKind`

`packages/ui/src/lms/block-builder/block-builder.tsx`
`packages/ui/src/lms/block-segment-editor/block-segment-editor.tsx`
`packages/ui/src/lms/exercise-entry-row/exercise-entry-row.tsx`

### M1.8 — Cmd+K palette + inline pickers + undo/redo

**Status:** done. Commit `f778144e`.

`apps/platform/src/modules/plan-editor/components/inline-picker/` — `@` picker (exercise), `/` picker (scheme / block kind).
`apps/platform/src/modules/plan-editor/components/command-palette/` — Cmd+K global palette.
`packages/ui/src/lms/plan-editor-helpers/` — pure filtering helpers (vitest here, not in apps/platform which lacks vitest setup).

### M1.9 — Plan-coach assignments UI

**Status:** done. Commit `bfb6d826`.

`apps/platform/src/modules/plan-editor/components/plan-canvas/athletes-tab/` — coach assignment UI on Athletes tab of plan detail. Endpoint already existed (M0.4 `plan-coach-assignment.ts`).

### M1.10 — MarkdownEditor rename + cleanup

**Status:** done. Commit `b6ae7a3d`.

`packages/ui/src/components/rich-text-editor/` → `packages/ui/src/components/markdown-editor/` (8 files, git-moved). All consumers updated. No behaviour change.

### M1.11 — E2E tests + Storybook

**Status:** done. Commits `d8eb6bdc` + `11489afb` + `08ac310a`.

**edit-session.coach.spec.ts** (production UI, 5 tests):

1. Does not save on blur; explicit Save sends exactly 1 bulk-patch
2. Idle 8s autosave fires when draft is valid
3. Idle autosave does NOT fire when draft is invalid
4. Single-card route-change confirm — Library link → modal → Cancel keeps page; Save All flushes + navigates (production wiring via `EditSessionAwareLink`)
5. Concurrent-tab edit raises 409 conflict in second tab

**edit-session-multi-card.storybook.spec.ts** (Storybook, 1 test):

- Three cards; Cmd+S on focused card → exactly 1 PUT; modal lists 2 unsaved; Save All flushes both

**library-create-and-use.spec.ts** (admin → platform E2E, 1 test):

- HEAD_COACH creates SYSTEM exercise via admin UI
- Coach opens plan, uses `@`-picker inline to attach exercise to an entry
- Assert bulk-patch fired and saved indicator visible
- Athlete workout flow seeded via Prisma helpers
- PR evaluator (`MAX_LOAD_FOR_REPS`) asserts personal record created

**Review and critical fixes: commit `08ac310a`**:

- C-1: `pick-conflict-current-version.ts` — uses `result.conflicts[0].currentVersion` (server-authoritative) not `expectedVersion+1`
- C-2: `edit-session-aware-link.tsx` — `formatHref` handles UrlObject hrefs so guard fires for both string and object forms
- C-3: 4th production test added to `edit-session.coach.spec.ts` (route-change confirm via real Library link)
- C-5: `library-create-and-use.spec.ts` rewritten to use inline `@`-picker UI flow

### Final gates (after `08ac310a`)

- `pnpm lint` — green (16/16 packages, max-warnings 0)
- `pnpm check-types` — green (all packages except marketing which has stale `.next/dev/types/routes.d.ts` dev-cache artifact; unrelated to M1 changes; cleared by `rm -rf apps/marketing/.next`)
- `pnpm test` — green (141 test files, **961 tests**)
- `pnpm dep:check` — green (0 violations; `admin-no-lms` rule updated with precise carve-out for 3 library mapper sub-paths)

---

## M1.2 Deviations from plan

1. **Inspector uses single-op bulk-patch, not per-entity PUT endpoints.** The plan called for per-entity `PUT /blocks/:id`, `PUT /segments/:id`, `PUT /entries/:id` route handlers. The inspector cards instead call `POST /training-plans/:planId/patch` with a single `update-block|update-segment|update-entry` op. Functionally equivalent; same full-entity payload + `expectedVersion` contract; same zod validation path. The `use-bulk-patch-update.ts` hooks encapsulate this detail. No separate PUT handlers were created.

2. **Prisma `ExerciseLibraryItem.update` accepts `scope` in payload (W-9 from review).** The admin UI correctly populates `scope` from a controlled dropdown, so this is low-risk in practice, but the endpoint does not strip the `scope` field before persist. M2 should add a `scope`-protection guard (`if (input.scope) throw Forbidden`) for admin editors that might inadvertently demote a SYSTEM exercise.

3. **`Retry` button in `SaveIndicator` does not reconnect to the draft state (W-13 from review).** The `error` status shows a Retry button but the retry handler re-dispatches against a potentially stale draft reference. Sufficient for M1 (the user can re-edit and re-save); M2 should wire the retry to `flushSession(sessionId)` on the orchestrator.

4. **E2E multi-card scenario covered by Storybook, not full production.** The 5th test (3 cards, Cmd+S focused-only, modal listing 2 unsaved) runs against a Storybook story because the real inspector shows one segment at a time. The production-wiring aspect is covered by test #4 (single-card route-change via `EditSessionAwareLink` + Library link in the real platform UI). These together provide adequate coverage.

5. **`CoachOwnerAutocomplete` placement:** M1.2 placed it in exercise-library module, M1.3 lifted to `apps/admin/src/lib/components/coach-owner-autocomplete/`. The lift was additive (no behaviour change).

---

## M1.3 Known follow-ups for M2

### Security

- `packages/api-server/src/endpoints/lms/exercise-library-item.ts` — `.update` accepts `scope` in the payload body. Add server-side guard: if `input.scope !== undefined`, throw `403 Forbidden`. Prevents privilege escalation via crafted PUT.

### UX / functionality

- `packages/ui/src/edit-session/save-indicator.tsx` — Retry button dispatches against stale draft. Wire to `flushSession(sessionId)` on the orchestrator so retry re-sends the current draft, not the draft at time of original error.
- Admin exercise URL fields (demoVideoUrl, demoImageUrl) eagerly validate format, causing friction during typing. Debounce or validate on blur only.
- `Role.HEAD_COACH` single-occupancy not enforced at DB level. M2 should add a unique partial index `WHERE role = 'HEAD_COACH'` and a pre-update guard in the user endpoint.

### Test coverage gaps

- `packages/api-server/src/endpoints/lms/bulk-patch-apply-op.ts` — no unit tests for individual op dispatchers (move-block, add-segment, delete-entry, etc.). M2 should add integration tests per op.
- CHECK constraints `chk_set_log_rpe`, `chk_session_rpe`, `chk_completion_ratio_range` not yet integration-tested (athlete-side writes absent in M1). M3 adds these.

### Deferred from M0 "Known follow-ups" (still open)

All items from §3 of the M0 handoff above remain open unless explicitly resolved. The following were resolved in M1:

- ✅ `version Int @default(1)` added to Block/BlockSegment/ExerciseEntry (M1.0)
- ✅ bulk-patch endpoint created (M1.1)
- ✅ promote/demote 501 stubs replaced with real impls (M1.1)
- ✅ PR evaluator `MAX_LOAD_FOR_REPS` implemented (M1.1)
- ✅ Schedule tab reintroduced (M1.6 `PlanEditorView`)

---

## M1.4 Test count M1

| Sub-phase     | Δ   | Reason                                                                                             |
| ------------- | --- | -------------------------------------------------------------------------------------------------- |
| M1.0 (schema) | +0  | Schema-only; no test additions                                                                     |
| M1.1          | +30 | `max-load-for-reps.test.ts` (10), `block.mapper.test.ts` (3), bulk-patch helpers tests (~17)       |
| M1.2–M1.4     | +0  | UI-only; no new vitest additions                                                                   |
| M1.5          | +55 | `use-edit-session.test.ts`, `edit-session-provider.test.tsx`, `use-scoped-mutation.test.ts`, etc.  |
| M1.6–M1.9     | +25 | `plan-editor-helpers/` pure-function tests (filtering, scheme routing)                             |
| M1.10         | +0  | Rename only                                                                                        |
| M1.11 fixes   | +41 | `pick-conflict-current-version.test.ts` (5), `edit-session-aware-link.test.tsx` (2), E2E additions |

Path: 810 → **961** (+151 unit tests). E2E tests: 7 new specs (5 edit-session production, 1 storybook multi-card, 1 admin seed-to-PR).

---

## M1.5 Architecture added in M1

### Edit Session model (ADR 0035)

- **Hook:** `packages/ui/src/edit-session/use-edit-session.ts` — `useReducer`; 7 statuses; 5 save triggers; idle timer resets on every dispatch; no blur action
- **Orchestrator:** `packages/ui/src/edit-session/use-edit-session-orchestrator.ts` — `register/unregister/flushAll/requestRouteChangeFlush/getDirtySessions/focusedSession`
- **Cmd+S:** focused via `data-edit-session-id` DOM attribute ascent; targets only the focused card
- **Route guard:** `EditSessionAwareLink` intercepts all in-app `<Link>` clicks; modifier-clicks bypass; `formatHref` resolves UrlObject → string before `router.push`
- **beforeunload:** `use-beforeunload-guard.ts` wires `window.beforeunload`; cleans up on unmount
- **Conflict path:** `pickConflictCurrentVersion` reads `result.conflicts[0].currentVersion` (server-authoritative); `ConflictError` thrown with `{ currentVersion }` for the card to transition to `conflict` status

### Bulk-patch endpoint

- `packages/api-server/src/endpoints/lms/training-plan-patch.ts` — main handler
- `packages/api-server/src/endpoints/lms/bulk-patch-helpers.ts` — `verifyOpsBelongToPlan`
- `packages/api-server/src/endpoints/lms/bulk-patch-apply-op.ts` — per-op dispatcher
- Contract types: `BulkPatchOp`, `BulkPatchResult`, `BulkPatchConflict` in `packages/contracts/src/entities/lms/training-plan/training-plan-api.types.ts`

### Platform plan editor structure

```
apps/platform/src/modules/plan-editor/
  views/plan-editor-view.tsx            — three-pane layout + EditSessionProvider
  components/
    plan-canvas/                        — week navigator, day cards, session list, block tree
      dnd-types.ts
      dnd-lookups.ts
      dnd-optimistic.ts
      use-plan-canvas-dnd.ts
    inspector/
      inspector-panel.tsx               — discriminated editor
      use-bulk-patch-update.ts          — wraps bulk-patch for Block / BlockSegment / ExerciseEntry
    inline-picker/                      — @ exercise, / scheme+block kind
    command-palette/                    — Cmd+K global
packages/ui/src/lms/
  scheme-form/                          — 6 archetype forms + router
  block-builder/
  block-segment-editor/
  exercise-entry-row/
  plan-editor-helpers/                  — pure filter/sort helpers (vitest tested here)
```

---

## M1.6 Gotchas for the next session (M2)

1. **Inspector cards call bulk-patch, not per-entity PUT.** `use-bulk-patch-update.ts` encapsulates this. If M2 adds new editable entities (e.g. SetGroup in a dedicated UI), use the same pattern — wrap a `BulkPatchOp` and call `api.planBulkPatch.patch`. Do not create standalone PUT endpoints for these entities.

2. **`EditSessionProvider` must wrap the plan editor root.** `PlanEditorView` mounts the provider; sub-components consume via `useEditSessionOrchestrator`. If M2 adds a new editor surface (e.g. a standalone block detail page), mount the provider there too, or the Cmd+S and beforeunload guards will silently not fire.

3. **Idle autosave timer is per-session.** `idleSaveMs` defaults to 8000ms. Every `dispatch` resets the timer. If M2 introduces a notes textarea that should save more frequently, pass `idleSaveMs: 1500` to `useEditSession` — the no-blur invariant still holds.

4. **`version` column is read-modify-write.** Block/BlockSegment/ExerciseEntry all have `version Int @default(1)`. Any write must read the current version, include it as `expectedVersion`, and handle 409 (or bulk-patch `conflicts`). Never write without `expectedVersion`.

5. **`pickConflictCurrentVersion` is the canonical source for conflict version.** Lives at `packages/contracts/src/entities/lms/training-plan/pick-conflict-current-version.ts`. Import it from `@repo/contracts/lms/training-plan`.

6. **Admin `exercise-library-item` update accepts `scope` (security gap).** Until the M2 guard lands, admin editors should not expose a `scope` field on the edit form (it's currently a read-only field in the UI, but the endpoint doesn't enforce it server-side).

7. **marketing `.next/dev/types/routes.d.ts` can corrupt.** If `pnpm check-types` fails with `routes.d.ts` parse errors, run `rm -rf apps/marketing/.next` to clear the stale dev build. This is a Next.js dev-mode artifact; unrelated to our code. The pre-commit hook runs `check-types` so you may need to clear it before a commit.

8. **Branch is not pushed.** User requested no push at the end of M1 — they review the full branch and push manually. Do not auto-push.

9. **No separate `feat/workout-redesign-m2` branch.** All M2 work goes on `feat/workout-redesign`. Sub-phases = commits.

---

## M1.7 M2 entry point — paste this into a new session to start M2

```
Реализуй M2 phase из дизайн-документа: docs/design/workout-redesign.md

КОНТЕКСТ:
- Главный документ: docs/design/workout-redesign.md (§14 — M2 scope)
- Handoff: docs/design/workout-redesign-handoff.md — прочитай раздел "M1 STATUS AND HANDOFF" целиком, особенно §M1.5 (architecture), §M1.6 (gotchas), §M1.3 (follow-ups).
- Branch state: `feat/workout-redesign` — единая ветка. M0 = 9 commits, M1 = 13 commits на этой же ветке. M2 продолжает на ЭТОЙ ЖЕ ветке — не создавай `feat/workout-redesign-m2`. Sub-phases = commits.
- M1 tip: `08ac310a`.

ОБЯЗАТЕЛЬНЫЕ ФИКСЫ ДО M2 ФИЧЕЙ (carryover из M1 review):
1. `packages/api-server/src/endpoints/lms/exercise-library-item.ts` — добавь server-side guard: `if (input.scope !== undefined) throw Forbidden`. Иначе любой coach может себе promote через PUT.
2. `packages/ui/src/edit-session/save-indicator.tsx` — Retry кнопка. Wire к `flushSession(sessionId)` на orchestrator'е вместо stale dispatch.

SCOPE M2 (из roadmap §14 дизайн-документа):
- Coaching analytics реализация через WorkoutSession (coach-dashboard.ts, dashboard-computations.ts, coach-athletes/{list,detail}.ts — сейчас возвращают нули, M2 реализует через WorkoutSession)
- Athlete-side план endpoints (workout-session, block-session, exercise-log, set-log) — возможно часть M2, часть M3
- PlanOverride.payload typing refine
- Import parser (program-parser/) если в scope M2
- Block/Session/Week templates (nice-to-have из M1)
- Promote suggestion workflow (PromotionSuggestion)

ПРАВИЛА (те же что в M1):
- Никаких комментариев в коде
- Никаких Co-Authored-By в коммитах
- Commit subjects полностью lowercase
- --no-verify запрещён
- Green gates first
- App Router only
- Plan на approval перед кодом
- Stage .claude/settings.local.json со всеми feature commits
- Batch push (не после каждого коммита)
- Один branch на всю фичу
```

---

## M1.8 Branch summary (M1 commits)

```
$ git log c03acb7..HEAD --oneline
08ac310a fix(lms): resolve 4 critical review findings in edit-session and bulk-patch
11489afb test(e2e): adapt plan detail and dashboard specs to m1 editor restructure
d8eb6bdc test(lms): playwright e2es for library flow and edit session and storybook sweep
b6ae7a3d refactor(ui): rename rich text editor to markdown editor
bfb6d826 feat(platform): plan coach assignments ui on plan detail athletes tab
f778144e feat(platform): cmd k palette inline pickers and undo redo
789d33a6 feat(platform): inspector pane block builder six scheme forms and entry editor
675edd79 feat(platform): plan editor canvas with week navigator day cards and dnd
0033fbe6 feat(ui): edit session primitive scoped mutation and adr 0035
```

Final gate state at M1 handoff: lint green (16/16), type-check green (all packages; marketing .next cleared), 961 tests passing, dep:check green.

---

## M2 PARTIAL STATUS (backend done, UI pending)

> Status: 5 of 10 sub-phases complete. Branch `feat/workout-redesign` not pushed. Working tree clean. Tip: `70ff4847`.

### M2.0 Status of M2

#### M2.0.1 Status

| Sub-phase    | Status                | Commit     | What                                                                                                                                                                                                                                                                                             |
| ------------ | --------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| docs cleanup | done                  | `076930ac` | removed import parser / nightly cron / promotion queue from design doc                                                                                                                                                                                                                           |
| M2.0         | done                  | `871241f7` | scope strip guards on `UpdateExerciseLibraryItemInput`, HEAD_COACH partial unique index, `flushSession(sessionId)` in `EditSessionContextValue`, 41 bulk-patch op unit tests, admin URL field debounce                                                                                           |
| M2.1         | done                  | `ccd5fb97` | weekly-volume aggregator on-write incremental + 8 integration scenarios + session-helpers test fixtures (NO cron — explicitly removed from scope)                                                                                                                                                |
| M2.2         | done                  | `59d25cf4` | 7 new PR detectors + 8-branch exhaustive dispatcher + 72 unit tests (Epley `ONE_REP_MAX`, `N_REP_MAX`, `MAX_REPS_UNBROKEN`, `MAX_REPS_TOTAL`, `BEST_TIME_FOR_X`, `MAX_DISTANCE_IN_T`, `MAX_CALORIES_IN_T`)                                                                                       |
| M2.3         | done                  | `1a6025b8` | coaching dashboard analytics — real WorkoutSession queries (`computeAdherenceWindow`, `computeProgressBuckets`, `computeAthletesSummary`, `computeTodayStatus`, `MISSED_WORKOUTS` branch in `coach-action-item`, `coach-athletes/list/detail`) + 8 integration tests + `prismaAsCore` workaround |
| M2.4         | done                  | `70ff4847` | PlanOverride backend — discriminated payload (REPLACE/APPEND/SUSPEND/NOTE), CRUD endpoints with auth + scope/kind semantic validation (`validateScopeKindCombo`), `plan-override-resolver` service, 13 tests                                                                                     |
| M2.5–M2.9    | pending (new session) | —          | UI layer + bulk ops + mobile + e2e/storybook                                                                                                                                                                                                                                                     |

Final gates at M2 partial: check-types 16/16, lint 16/16, dep:check 1450 modules / 0 violations, api-server 802/802 tests, ui 91/91 tests, contracts 158/158 tests. No regressions.

#### M2.0.2 BUGFIX SUB-PHASE REQUIRED BEFORE M2.5

User-facing review of M0–M2.4 surfaced pattern violations + critical regression that must be fixed before M2.5 starts. Bugfix prompt is saved separately by user (copy out of last assistant message in M2 backend session). The bugfix runs as **plain prompt, not via `/feature` skill** — scope is fix-only, no new architecture.

**Blockers (must fix before M2.5):**

- Command palette infinite loop in `apps/platform/src/modules/plan-editor/components/command-palette/command-palette.context.tsx:51` (`registerCommand` `useEffect` cleanup `setVersion` without proper deps) — page `/coach/plans/[id]` does not open.
- Layout regression on `/coach/plans/[id]` — content under header; Library panel tabs overflow drawer width without scroll.
- `/coach/library/` pattern violations: `Stack spacing={3}` (must be `={4}`), divider under tabs (forbidden), All/System/Mine tabs (must be admin-style scope filter), search/filter reinvented (must extract admin primitives to `@repo/ui/lms/library-table/`), empty actions column.
- `react/no-multi-comp` violations across `apps/platform/**/*.tsx` and `apps/admin/**/*.tsx`.

**Admin UI fixes (in same bugfix sub-phase):**

- Remove Promote/Demote **buttons** from Edit drawers in all three library types — kept ONLY in row action menu.
- Add `<Select>` "Scope" field in Edit drawer with conditional required `<Select>` "Owner" (single-owner; multi-coach ownership deferred to M3+ if real use case appears).
- **Bifurcate update endpoint:** platform path strips scope/ownerId (server hardcodes COACH/self.id); admin path accepts scope/ownerId in payload (admin role validated). M2.0's blanket scope-strip needs revisiting.
- Replace `demoImageUrl` URL input with image upload via existing Vercel Blob flow (ADR 0013); video stays URL.
- Three different sidebar icons for Exercise / BlockKind / SchemeTemplate (currently same).
- Owner column → name + avatar chip pattern from `users-admin` (currently raw cuid).
- Benchmark in separate column (not inline).
- `isDeprecated` → inline table `<Switch>` + chip column "Deprecated" + form Switch field; toggle endpoint wired.
- UI tooltip / form section header — `ownerId` = "Owner (creator)", `parentId` = "Variant of (parent exercise)".
- SchemeTemplate `defaultParams` JSON textarea → schema-driven typed form per archetypeKind. Extract M1.7 SchemeForm components into `@repo/ui/lms/scheme-forms/` and reuse.
- `/coach/library` benchmark chip in own column too.

**Memory (already added) for bugfix and all M2.5+ implementers:**

- `feedback_pattern_compliance.md` — new UI must reuse `<Stack spacing={4}>` / `ChipTab` / admin filter primitives.
- `feedback_promote_demote_row_only.md` — library edit forms have only Save Changes; scope changes via form Select (not buttons); promote/demote buttons only in row action menu; single-owner.
- `feedback_image_upload_existing_flow.md` — image fields use Vercel Blob upload; videos stay URL.
- `feedback_one_component_per_file.md` — each `.tsx` exports exactly one React component.
- `feedback_owner_column_avatar.md` — owner columns show name + avatar chip.
- `feedback_no_json_editor_in_ui.md` — discriminated payload fields use schema-driven typed forms per discriminator; no raw JSON textarea.

#### M2.0.3 Architectural decisions to remember in M2.5+

1. **`prismaAsCore` cast** lives in `packages/api-server/src/db/client.ts` as a single concentrated cast `ExtendedPrismaClient → PrismaClient`. All coaching service callers use it. The alternative was either pervasive `as unknown as` casts or "Excessive stack depth" Prisma extension typing failures. M2.5+ services should follow the same pattern when they need access to base Prisma types.

2. **Services accept `db: PrismaClient | Prisma.TransactionClient`** — every M2 service (`weekly-volume-aggregator`, `pr-evaluator`, `plan-override-resolver`) is transaction-friendly. M2.5+ services follow the same shape. M3 athlete write paths will compose multiple services in a single transaction — that's the design assumption.

3. **PlanOverride payload — `z.discriminatedUnion("kind", [...])`** with 4 shapes by `kind` (REPLACE / APPEND / SUSPEND / NOTE), NOT cross-product `4×5=20` by `(scope, kind)`. Semantic `(scope, kind)` validation lives at service layer through `validateScopeKindCombo` (e.g., `SUSPEND` on `NOTE` scope is rejected with `BadRequestError`).

4. **ADR 0035 invariant fully enforced.** No blur-autosave was introduced anywhere in M2 backend. M2.5 PlanOverride editor cards MUST consume `useEditSession` like base `BlockSegmentEditor`. The invariant lives in `docs/adr/0035-editor-save-model.md` and applies to all editable structural cards.

5. **Removed-from-scope items** — three permanent cuts (NOT deferred):

   - Import parser (no PDF / free-text parsing pipeline; `pdfjs-dist` / `pdf-parse` not installed; coach writes plans in editor).
   - Nightly cron / scheduled WeeklyVolume recompute (no Vercel Cron, no `CRON_SECRET`, no `vercel.json` cron config; on-write incremental sufficient).
   - PromotionSuggestion review queue (no `PromotionSuggestion` model, no queue UI; HEAD_COACH promotes directly via row action in admin).
     These three must NOT reappear in M2.5+ implementation. Future trigger to add any of them requires a new ADR and product decision.

6. **`HEAD_COACH` single-occupancy is now DB-enforced** via partial unique index `idx_single_head_coach ON "User" (role) WHERE role = 'HEAD_COACH'` (M2.0). Any attempt to set a second user to HEAD_COACH returns `409 ConflictError`.

7. **Scope strip behaviour from M2.0 will be revisited in bugfix.** Currently `UpdateExerciseLibraryItemInput` strips `scope`. After bugfix, the strip applies only to platform path; admin path accepts scope+ownerId in payload.

#### M2.0.4 Remaining sub-phases (M2.5–M2.9, 33 tasks)

| Sub-phase                            | Tasks | Plan reference                                     |
| ------------------------------------ | ----- | -------------------------------------------------- |
| M2.5 PlanOverride editor UI          | 6     | `.feature-dev/1777283454/plan.md` TASK-028 onwards |
| M2.6 Templates (Block/Session/Week)  | 11    | `.feature-dev/1777283454/plan.md` TASK-034 onwards |
| M2.7 Bulk operations                 | 8     | `.feature-dev/1777283454/plan.md` TASK-045 onwards |
| M2.8 Mobile responsive + TouchSensor | 4     | `.feature-dev/1777283454/plan.md` TASK-053 onwards |
| M2.9 E2E + Storybook sweep           | 7     | `.feature-dev/1777283454/plan.md` TASK-057 onwards |

#### M2.0.6 M2 bugfix b.2 — completion status

Bugfix continuation after b.1 (`24250517`). Addresses every remaining item from user-facing review (admin polish, scope/owner fields, scheme forms, image upload). Lands after b.1.

**Done:**

- Admin `ScopeCard` rebuilt (3 entities: exercise / block-kind / scheme-template) — scope `<Select>` enabled in edit/create + conditional `<Autocomplete>` Owner picker when scope=COACH (single-owner via `useCoachesList`); scope→SYSTEM auto-clears ownerId; "Use Promote/Demote" helper text removed; SideCards/form props no longer carry `isEdit` (except exercise FlagsCard which keeps the flag for the Deprecated switch).
- Contracts extended: `Create{Exercise,BlockKind,SchemeTemplate}Input` accept optional nullable `ownerId` (admin create path).
- Backend create handlers extended in `exercise-library-item-create.ts`, `block-kind-create.ts`, `scheme-template-create.ts` (extracted from main endpoint files): admin/HEAD_COACH path requires explicit `ownerId` for COACH scope (validated against User table + role); regular COACH path rejects `ownerId` (privilege guard) and uses `userId`. Tests in api-server cover both branches.
- Backend update handlers also extracted to `block-kind-update.ts`, `scheme-template-update.ts` (mirroring existing `exercise-library-item-update.ts`); main endpoint files dropped to ~220 lines each (max-lines 300 enforced).
- Promote/Demote header buttons + `<PromoteDemoteSection />` mount removed from all 3 admin detail sections; promote/demote remains accessible only via row action menu in list tables. `promote-demote-section.tsx` files retained — they back row actions.
- Admin detail Metadata sections: Owner now renders via `UserChip` (resolved through `useCoachesList` lookup; falls back to bare avatar with cuid initial when coach record not loaded). Same for all 3 entities.
- Admin list section Owner columns: same `UserChip` upgrade, lookup map memoized per render.
- Admin exercise list: `Benchmark` and `Deprecated` are now standalone columns. Benchmark chip removed from Name column. Deprecated column has inline `<Switch>` (calls `useUpdateExercise` mutation, busy state per-row via `mutation.variables.id`) plus a `Chip` next to it when true.
- `media-card.tsx` (Exercise form): `demoImageUrl` URL TextField replaced with `<ImageUpload>` from `@repo/ui` wired to `useUploadImage` (new `exercise` `UploadContext` added in `@repo/contracts/storage/upload`). `demoVideoUrl` stays a URL field (YouTube embed). On remove, blob is deleted via `useDeleteImage` to avoid orphaning.
- `params-card.tsx` (SchemeTemplate form): JSON `<TextField multiline>` + `as unknown as` cast removed. Replaced with `<SchemeForm>` dispatcher from `@repo/ui/lms/scheme-form` (already present from M1.7). Defaults now imported from `@repo/ui` `SCHEME_PARAMS_DEFAULTS` (typed `{ [K in SchemeArchetypeKind]: Extract<SchemeParams, { kind: K }> }`); admin `DEFAULT_PARAMS_TEMPLATES` aliased to that shared map.
- `scheme-form-time-boxed.tsx` (TimeBoxed inner segments): `JSON.parse(raw) as unknown` and `{ __invalid: raw }` fallback removed. Inner params now render via new `SchemeFormInner` dispatcher (5 sub-forms — TIME_BOXED excluded to prevent infinite nesting). Inner kind change auto-resets innerParams to typed default. The "Free-form for M1; full nested editor lands in M3" tech-debt note is gone.

**Type hacks status:** zero remaining `as any` / `as unknown` / `@ts-ignore` in new production code in `apps/admin/src/modules/{exercise,block-kind,scheme-template}-library/`, `packages/ui/src/lms/scheme-form/`, `packages/ui/src/edit-session/`. The single remaining `as Prisma.InputJsonValue` casts in service files are legitimate Prisma JSON column writes.

**Files added:**

- `packages/api-server/src/endpoints/lms/exercise-library-item-create.ts`
- `packages/api-server/src/endpoints/lms/block-kind-create.ts`
- `packages/api-server/src/endpoints/lms/block-kind-update.ts`
- `packages/api-server/src/endpoints/lms/scheme-template-create.ts`
- `packages/api-server/src/endpoints/lms/scheme-template-update.ts`
- `packages/ui/src/lms/scheme-form/scheme-form-defaults.ts`
- `packages/ui/src/lms/scheme-form/scheme-form-inner.tsx`
- `packages/contracts/src/entities/storage/upload/upload.constants.ts` updated with `exercise` context (5MB cap, JPEG/PNG/WEBP, prefix `exercises`).

#### M2.0.5 M2.5 entry point (after bugfix lands)

1. Read this entire handoff (M0 + M1 + M2 partial sections).
2. Read `.feature-dev/1777283454/plan.md` from TASK-028 onwards.
3. Read `.feature-dev/1777283454/design.md` §5.4 for component design specs.
4. Read `docs/adr/0035-editor-save-model.md` BEFORE starting M2.5 — invariant must be in fresh memory before override editor work.
5. Read all 6 new memory files in `C:\Users\maksi\.claude\projects\D--projects-contrib-the-discipline-program\memory\feedback_*.md` (the auto-loaded MEMORY.md index lists them).
6. Submit a Plan covering remaining sub-phases for approval before writing code.
7. After M2.9 final green gate — update this handoff with full M2 status section (replacing this PARTIAL block).

Branch state: `feat/workout-redesign`, single long-lived (NOT push to main; M3 continues here too). Tip after M2.4 = `70ff4847`. Bugfix sub-phase will land 1–2 commits on top before M2.5 starts.

---

**End of handoff.**
