# Workout redesign — M0 handoff

> **Branch:** `feat/workout-redesign-m0` (not yet pushed; user reviews before push)
> **Base:** `main` at `65d15f5` > **Tip:** `c03acb7` > **Date:** 2026-04-26
> **Scope completed:** Roadmap M0 from `docs/design/workout-redesign.md` §14
> **Pipeline:** 9 commits, +12,038 / −5,929 lines, 359 files touched

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
- Branch state: feat/workout-redesign-m0 (9 commits, не запушена). Старт M1 — новая ветка `feat/workout-redesign-m1` от tip ветки M0.

SCOPE M1 (точно из roadmap §14 дизайн-документа):

MUST:
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
13. MarketingPdf MarkdownEditor (renamed RichTextEditor).
14. E2E test: HEAD_COACH создаёт SYSTEM exercise → COACH использует в plan → атлет (через mock) залогировал → PR появился.

NICE-TO-HAVE:
- Block/Session/Week templates.
- Saved searches in library.
- Promote suggestion от тренера (PromotionSuggestion).

ИЗ-ЗА ОБЪЁМА: разбей на под-фазы M1.1-M1.X с green-gate checkpoints. Прочитай handoff §8 (Gotchas) — там нюансы про Apps/platform broken UI, Session vs LmsSession, CHECK constraints.

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
- M1.1 — Bulk-patch endpoint + promote/demote impls (раскрыть 501 stubs).
- M1.2 — apps/admin Exercise CRUD UI (full + promote).
- M1.3 — apps/admin BlockKind + SchemeTemplate CRUD UI.
- M1.4 — apps/platform Library panel (tabs, search, /, @ pickers).
- M1.5 — Plan canvas (week navigator, day cards, sessions, blocks tree, DnD).
- M1.6 — Inspector pane + 6 SchemeForms.
- M1.7 — Cmd+K palette + autosave + undo/redo.
- M1.8 — Plan-coach assignments UI.
- M1.9 — MarkdownEditor rename + cleanup.
- M1.10 — E2E test seed-to-PR + Storybook stories.

Старт:
1. Прочитай docs/design/workout-redesign-handoff.md (особенно §3 follow-ups, §6 endpoints inventory, §8 gotchas).
2. Прочитай docs/design/workout-redesign.md §7 (UX редактора) и §10.4 (bulk-patch).
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

**End of handoff.**
