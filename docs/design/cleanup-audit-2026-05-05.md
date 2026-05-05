# Cleanup audit — 2026-05-05

> **Purpose.** Exhaustive inventory of code / schema / contract artefacts that exist in the monorepo today and do not fit the new training-plan domain (ADR-0038, ADR-0039, ADR-0040). Each entry is one of: REMOVE (dead in new model), MODIFY (needs a change to fit), KEEP (already correct, no action). The list feeds directly into the Prisma schema diff and Zod contracts patches that follow this audit.
>
> **Method.** End-to-end walk of `packages/api-server/prisma/schema.prisma`, `packages/contracts/src/entities/lms/`, `packages/api-server/src/endpoints/`, `packages/api-server/src/mappers/lms/`, `apps/platform/src/app/api/platform/`, `apps/platform/src/app/(coach)/coach/plans/`, `apps/platform/src/modules/plans/`, `apps/platform/src/lib/{api,hooks}/`, `packages/api-server/prisma/seed/`, `apps/admin/src/`. Plus exhaustive grep for 16 dead symbols left from the ADR-0037 rollback. All findings verified against the actual current files (not just an agent summary).
>
> **Headline finding.** The ADR-0037 rollback was thorough. **Zero dead symbols** remain in active code paths. The cleanup work is therefore not "delete forgotten stuff" — it is **deliberate removal of artefacts that survived ADR-0037 but have no role in the new model**: `WeeklyVolume`, `Benchmark`, `BenchmarkSource`, plus a handful of contract-side gaps to close.

---

## Summary by area

| Area                               | REMOVE                             | MODIFY                                      | KEEP-AS-IS                         |
| ---------------------------------- | ---------------------------------- | ------------------------------------------- | ---------------------------------- |
| Prisma schema                      | 2 models, 1 enum, 1 relation field | 1 model (rename field)                      | 11 models, 8 enums                 |
| Contracts (`@repo/contracts/lms/`) | 0 files                            | 1 file (training-plan schema gap)           | 64 files                           |
| API endpoints (server)             | 0 files                            | 0 files                                     | training-plan endpoints + tests    |
| API routes (platform app)          | 0 routes                           | 0 routes                                    | 8 routes                           |
| Mappers (server)                   | 0 files                            | 0 files                                     | all mappers correct                |
| Coach UI (`apps/platform`)         | 0 files                            | 0 files                                     | all current files correct          |
| Library admin UI (`apps/admin`)    | n/a                                | n/a                                         | none exists yet (new build target) |
| Seeds                              | 0 files                            | 1 file (clear-all references removed model) | training-plans.ts                  |

---

## 1. Prisma schema (`packages/api-server/prisma/schema.prisma`)

### REMOVE — outright deletions

| Artefact                                     | Lines   | Reason                                                                                                                                                                                                                                  |
| -------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model WeeklyVolume`                         | 396-415 | Tonnage analytics is out of MVP scope (ADR-0040). Aggregator was stubbed in ADR-0037; removing the table replaces "stubbed table that returns zeros" with "no table at all" — honest. The `tonnageByPattern: Json` column goes with it. |
| `model Benchmark`                            | 417-431 | Per-workout benchmark library and athlete-side per-workout PR tracking are both deferred (ADR-0039, ADR-0040). The model has no consumer in the new MVP. Per-exercise PRs are covered by `PersonalRecord`.                              |
| `enum BenchmarkSource`                       | 289-292 | Used only by `Benchmark.source`. Goes with the model.                                                                                                                                                                                   |
| `User.weeklyVolumes WeeklyVolume[]` relation | 31      | Dead reference once `WeeklyVolume` is removed.                                                                                                                                                                                          |
| `User.benchmarks Benchmark[]` relation       | 30      | Dead reference once `Benchmark` is removed.                                                                                                                                                                                             |

### MODIFY — schema-level changes

| Artefact                             | Lines   | Change                                    | Reason                                                                                                                 |
| ------------------------------------ | ------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `enum SchemeArchetypeKind`           | 232-239 | **Add 2 variants**: `LADDER`, `DISTANCE`. | Required by ADR-0039 to cover rep-ladder schemes (`36-28-20`, `3-6-9-12-9-6-3`) and run-distance schemes (`RUN 5 km`). |
| `model BlockSession.kindName String` | 335     | **Rename to `blockNames String[]`**.      | ADR-0040: composite block-typing in the snapshot mirrors `PlanBlock.blockTypeIds[]` from ADR-0038 / ADR-0039.          |

### KEEP — still correct, no change

| Artefact                                                                                                            | Lines            | Note                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `model TrainingPlan`                                                                                                | 294-308          | Reused as the `Plan` rail entity. Fields are exactly what ADR-0038 needs (`creatorId`, `status`, `name`, `description`, soft-delete).                                                                                                            |
| `enum TrainingPlanStatus`                                                                                           | 226-230          | DRAFT / ACTIVE / ARCHIVED. ADR-0038 lifecycle.                                                                                                                                                                                                   |
| `model WorkoutSession`                                                                                              | 311-327          | Snapshot tier root; reused unchanged.                                                                                                                                                                                                            |
| `model BlockSession`                                                                                                | 330-348          | Snapshot tier; reused with one field rename (above).                                                                                                                                                                                             |
| `model ExerciseLog`                                                                                                 | 351-363          | Snapshot tier; reused unchanged. `exerciseSnapshot: Json` stays.                                                                                                                                                                                 |
| `model SetLog`                                                                                                      | 366-378          | Snapshot tier; reused unchanged.                                                                                                                                                                                                                 |
| `model PersonalRecord`                                                                                              | 381-393          | Drives percent-of-benchmark resolution (ADR-0040).                                                                                                                                                                                               |
| `enum WorkoutSessionStatus`                                                                                         | 241-246          | All 4 variants kept. Only IN_PROGRESS and COMPLETED are written in MVP; ABANDONED and SKIPPED document intent (ADR-0040).                                                                                                                        |
| `enum RxStatus`                                                                                                     | 248-253          | Used by snapshot fields.                                                                                                                                                                                                                         |
| `enum MovementPattern`                                                                                              | 255-276          | Used by `Exercise.primaryMovement` (new model, ADR-0039) and by snapshot `exerciseSnapshot.primaryMovement`.                                                                                                                                     |
| `enum PrKind`                                                                                                       | 278-287          | Used by `PersonalRecord.kind` and by `Exercise.benchmarkPrKind` (new model, ADR-0039).                                                                                                                                                           |
| `model User`, `AthleteProfile`, `CoachProfile`, `CoachAthleteAssignment`                                            | 10-92            | IAM + coaching surface; unchanged.                                                                                                                                                                                                               |
| `enum Role`, `Gender`                                                                                               | 94-104           | Unchanged.                                                                                                                                                                                                                                       |
| `model Product`, `Price`, `Subscription`, `Transaction`, `RequestIdempotency`                                       | 106-211          | Billing + idempotency; unchanged.                                                                                                                                                                                                                |
| `enum Currency`, `PriceInterval`, `SubscriptionStatus`, `TransactionStatus`                                         | 142-224          | Unchanged.                                                                                                                                                                                                                                       |
| `model CoachActionItem`, `CoachNote`                                                                                | 455-500          | Coaching surface; ADR-0037 already removed `NEW_NO_START` references; the surviving paths use only `MISSED_WORKOUTS` + `HEALTH_REPORT`. Verified clean: `coach-action-item-reconcile-conditions.ts:23-25` only discriminates on those two types. |
| `enum ActionItemType`                                                                                               | 439-442          | Two variants (`MISSED_WORKOUTS`, `HEALTH_REPORT`). Already at the post-rollback shape.                                                                                                                                                           |
| `enum ActionItemStatus`, `ActionItemResolveReason`, `ActionItemSeverity`, `HealthStatus`                            | 433-453, 479-483 | Coaching surface; unchanged.                                                                                                                                                                                                                     |
| `model MarketingPage`, `MarketingPageSection`, `MarketingBlogPost`, `MarketingReview`, `MarketingContactSubmission` | 502-606          | Marketing CMS; unchanged.                                                                                                                                                                                                                        |
| `enum MarketingBlogCategory`, `ContactSubmissionStatus`                                                             | 556-563, 583-588 | Unchanged.                                                                                                                                                                                                                                       |
| `model UserInviteToken`                                                                                             | 608-623          | IAM; unchanged.                                                                                                                                                                                                                                  |

### ADD — net-new schema for the new model

For completeness, the following are **added** by the schema diff that follows this audit. Listed here so the audit reader sees the full delta in one place; these are net-new and have no removal predecessor.

```prisma
// Library entries (per ADR-0039)
model Exercise          { id, name, urls[], primaryMovement, benchmarkPrKind?, deletedAt?, ... }
model BlockType         { id, name, description?, deletedAt?, ... }
model SchemeType        { id, name, archetypeKind, defaultParams?, deletedAt?, ... }
model DayType           { id, name, color, deletedAt?, ... }

// Plan content tree (per ADR-0038)
model PlanDay           { id, planId, date, dayTypeId?, ... }
model PlanSession       { id, dayId, order, label?, ... }
model PlanBlock         { id, sessionId, order, schemeTypeId, schemeParams: Json, modifiers?: Json, ... }
model PlanBlockTypeRef  { id, blockId, blockTypeId, ... }   // m:n pivot for blockTypes[]
model PlanItem          { id, blockId, order, exerciseId, prescription: Json, setType?, alternatives?: Json, ... }

// Enrollment (per ADR-0038)
model PlanEnrollment    { id, planId, athleteId, boardedAt, enrolledById, status, statusChangedAt, deletedAt?, ... }
enum EnrollmentStatus   { ACTIVE, PAUSED, REMOVED }
```

The exact field types, indexes, and `@@map` names land in the schema diff PR; this audit only needs to call out the additions exist so the model is read end-to-end.

---

## 2. Contracts (`packages/contracts/src/entities/lms/`)

### REMOVE — outright deletions

None. The contracts package has been kept clean by the ADR-0037 rollback. No dead exports surveyed.

### MODIFY — additions and small fixes

| File                                         | Path                                                                                | Change                                                                                                                                                                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_domain/scheme-archetype.schema.ts`         | full path: `packages/contracts/src/entities/lms/_domain/scheme-archetype.schema.ts` | Add 2 enum variants (`LADDER`, `DISTANCE`) and 2 corresponding params variants in the `schemeParamsSchema` discriminated union.                                                                                                                            |
| `_domain/scheme-archetype.types.ts`          | corresponding types file                                                            | Regenerate types with the 2 added variants.                                                                                                                                                                                                                |
| `_domain/scheme-archetype.constants.ts`      | corresponding constants                                                             | Add labels for new variants.                                                                                                                                                                                                                               |
| `_domain/scheme-archetype.schema.test.ts`    | corresponding test                                                                  | Add cases for new variants.                                                                                                                                                                                                                                |
| `_domain/benchmark-source.{schema,types}.ts` | `_domain/benchmark-source.*`                                                        | **REMOVE** — used only by `Benchmark` model which is being removed.                                                                                                                                                                                        |
| `_domain/index.ts`                           | barrel                                                                              | Remove `benchmark-source` export.                                                                                                                                                                                                                          |
| `training-plan/training-plan.schema.ts`      | line 7-15                                                                           | **MINOR ALIGNMENT** — `trainingPlanSchema` does not include `deletedAt` (the Prisma model has it). Acceptable as-is because soft-delete is server-internal; consumers don't need it on the contract. **No change required.** Documenting for completeness. |

### NEW — net-new contract directories for the new model

Listed here for visibility; lands in the contracts patches.

```
@repo/contracts/lms/library/
  exercise/{schema,types,api-schema,api-types,constants,index}.ts
  block-type/{...same...}.ts
  scheme-type/{...same...}.ts
  day-type/{...same...}.ts

@repo/contracts/lms/plan-content/  (or extension under training-plan/)
  plan-day/{...}.ts
  plan-session/{...}.ts
  plan-block/{...}.ts
  plan-item/{...}.ts

@repo/contracts/lms/plan-enrollment/
  {schema,types,api-schema,api-types,constants,index}.ts
```

### KEEP — already correct

Every file under `packages/contracts/src/entities/lms/` not listed above. Specifically:

- `_domain/exercise-snapshot.{schema,types}.ts` — used by `ExerciseLog.exerciseSnapshot` JSON shape; reused.
- `_domain/prescription.{schema,types}.ts` — used by `SetLog.prescribed` JSON shape; reused.
- `_domain/load-spec.{schema,types}.ts` — used by prescription internals; `PERCENT_BENCHMARK` variant drives ADR-0040.
- `_domain/exercise-composition.{schema,types}.ts` — composition internals (multi-rep moves like `5 DL + 5 HPC + 5 squat`).
- `_domain/rep-spec.{schema,types}.ts`, `tempo-spec.{schema,types}.ts`, `side-mode.{schema,types}.ts` — prescription primitives; reused.
- `_domain/movement-pattern.{schema,types}.ts` — used by `Exercise.primaryMovement` (new) and snapshot.
- `_domain/modality.{schema,types}.ts`, `body-part.{schema,types}.ts` — exercise internals; reused.
- `_domain/pr-kind.{schema,types}.ts` — used by `PersonalRecord` and `Exercise.benchmarkPrKind` (new).
- `_domain/rx-status.{schema,types}.ts`, `workout-session-status.{schema,types}.ts` — snapshot fields; reused.
- `block-session/*`, `exercise-log/*`, `set-log/*`, `workout-session/*` — snapshot tier contracts; reused unchanged.
- `training-plan/*` — plan CRUD contracts; reused, extended (not replaced).

---

## 3. API endpoints (`packages/api-server/src/endpoints/`)

### REMOVE — outright deletions

None. There are no LMS endpoints outside `endpoints/lms/training-plan/` (which is correct).

### MODIFY — extensions

| Path                                           | Change                                                                                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `endpoints/lms/training-plan/training-plan.ts` | Reused as-is for plan CRUD. New endpoints (plan content tree CRUD, enrollment, library) land in new files; this file does not change. |

### NEW — net-new endpoint trees

```
endpoints/lms/library/
  exercise/   (admin-app endpoints, withAdminAuth)
  block-type/
  scheme-type/
  day-type/

endpoints/lms/plan-content/
  plan-day/         (coach-platform endpoints, withCoachAuth)
  plan-session/
  plan-block/
  plan-item/

endpoints/lms/plan-enrollment/
  enrollment/       (coach-platform, plus pause/resume/remove transitions)

endpoints/lms/snapshot/
  start-session/    (athlete-platform — Phase 2 trigger)
  complete-session/
```

(Athlete-side endpoints are scaffolded in MVP for completeness but the athlete app surface itself is Phase 2 per the design negotiation.)

### KEEP — already correct

| File                                                                                                                                              | Note                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `endpoints/lms/training-plan/training-plan.ts`                                                                                                    | Reviewed line-by-line. `verifyPlanOwnership` rule (creator OR ADMIN/HEAD_COACH) is correct. No `PlanCoachAssignment.findFirst` checks (correctly removed by ADR-0037). All 9 methods (`getAll`, `getPageData`, `getById`, `create`, `update`, `delete`, `archive`, `restore`, `activate`) match the new model. |
| `endpoints/lms/training-plan/training-plan.test.ts`                                                                                               | Integration tests; reused.                                                                                                                                                                                                                                                                                     |
| `endpoints/lms/training-plan/training-plan.empty.test.ts`                                                                                         | Empty-DB tests; reused.                                                                                                                                                                                                                                                                                        |
| `endpoints/lms/training-plan/index.ts` + `endpoints/lms/index.ts`                                                                                 | Re-export barrels; reused.                                                                                                                                                                                                                                                                                     |
| `endpoints/coaching/coach-action-item-reconcile-conditions.ts`                                                                                    | **Verified clean.** `Condition` discriminated union (line 23-25) only has `HEALTH_REPORT` and `MISSED_WORKOUTS` variants. No `NEW_NO_START`, no `buildNewNoStartCondition`, no read of `planEnrollments`. ADR-0037 §6 cleanup is complete.                                                                     |
| `endpoints/coaching/coach-action-item.ts`                                                                                                         | Verified — reads only the two surviving condition types.                                                                                                                                                                                                                                                       |
| `endpoints/coaching/coach-action-item-reconcile.ts` and `coach-action-item-reconcile-apply.ts`                                                    | Verified clean.                                                                                                                                                                                                                                                                                                |
| All `endpoints/coaching/coach-athletes/*`, `coach-dashboard*`, `coach-invite/*`, `coach-note*`, `coach-profile*`, `dashboard-computations*`, etc. | Unchanged by this rebuild.                                                                                                                                                                                                                                                                                     |
| All `endpoints/cms/*`, `endpoints/billing/*`, `endpoints/iam/*`, `endpoints/storage/*`, `endpoints/ops/*`                                         | Unchanged by this rebuild.                                                                                                                                                                                                                                                                                     |
| `services/retention/*`                                                                                                                            | Unchanged.                                                                                                                                                                                                                                                                                                     |

---

## 4. Mappers (`packages/api-server/src/mappers/lms/`)

### KEEP — all clean

| File                                                                                                  | Note                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `training-plan.mapper.ts`                                                                             | Maps Prisma `TrainingPlan` → contract. Reused as-is.                                                                                                                             |
| `workout-session.mapper.ts`, `block-session.mapper.ts`, `exercise-log.mapper.ts`, `set-log.mapper.ts` | Snapshot mappers; reused. **MINOR**: `block-session.mapper.ts` will need a tiny update to map `blockNames: string[]` after the field rename (currently maps `kindName: string`). |
| `enum-maps-status.ts`, `enum-maps-taxonomy.ts`, `enum-maps.ts`, `index.ts`                            | Enum maps; reused. The `SCHEME_ARCHETYPE_KIND_MAP` extends to cover 2 new variants (`LADDER`, `DISTANCE`).                                                                       |

### NEW — to add alongside

```
mappers/lms/
  exercise.mapper.ts        (Prisma Exercise → contract Exercise)
  block-type.mapper.ts
  scheme-type.mapper.ts
  day-type.mapper.ts
  plan-day.mapper.ts
  plan-session.mapper.ts
  plan-block.mapper.ts
  plan-item.mapper.ts
  plan-enrollment.mapper.ts
```

---

## 5. API routes (`apps/platform/src/app/api/platform/`)

### KEEP — all 8 routes correct

| Route                                         | File                                        | Note    |
| --------------------------------------------- | ------------------------------------------- | ------- |
| GET / POST `/training-plans`                  | `training-plans/route.ts`                   | Reused. |
| GET / PUT / DELETE `/training-plans/[planId]` | `training-plans/[planId]/route.ts`          | Reused. |
| POST `/training-plans/[planId]/archive`       | `training-plans/[planId]/archive/route.ts`  | Reused. |
| POST `/training-plans/[planId]/restore`       | `training-plans/[planId]/restore/route.ts`  | Reused. |
| POST `/training-plans/[planId]/activate`      | `training-plans/[planId]/activate/route.ts` | Reused. |

No `duplicate` route exists (correctly absent per ADR-0037 §5).

### NEW — to add for the new model

```
apps/platform/src/app/api/platform/
  training-plans/[planId]/
    days/route.ts                  GET (range), POST
    days/[dayId]/route.ts          GET, PUT, DELETE
    days/[dayId]/sessions/...      session CRUD
    sessions/[sessionId]/blocks/...
    blocks/[blockId]/items/...
  enrollments/route.ts             POST (enroll)
  enrollments/[enrollmentId]/route.ts
  enrollments/[enrollmentId]/pause/route.ts
  enrollments/[enrollmentId]/resume/route.ts
```

---

## 6. Coach UI (`apps/platform/src/`)

### KEEP — all current files correct

| File                                                                    | Note                                                                                                                                                                  |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/(coach)/coach/plans/page.tsx`                                      | Plans list page shell. Reused.                                                                                                                                        |
| `app/(coach)/coach/plans/[planId]/page.tsx`                             | **9-line placeholder** (as documented in ADR-0037). Will be replaced as part of the new model build, not as cleanup.                                                  |
| `modules/plans/views/plans-view.tsx`                                    | Plans list view; reused.                                                                                                                                              |
| `modules/plans/sections/plans-list-section.tsx`, `plans-list-config.ts` | List UI; reused.                                                                                                                                                      |
| `modules/plans/components/plan-card.tsx`                                | Plan card; reused.                                                                                                                                                    |
| `modules/plans/components/plan-action-menu.tsx`                         | **Verified clean.** No `onDuplicate` callback (correctly absent). Action menu has Open / Activate / Archive / Restore / Delete only. ADR-0037 §5 cleanup is complete. |
| `modules/plans/components/plan-status-chip.tsx`                         | Status chip; reused.                                                                                                                                                  |
| `modules/plans/components/create-plan-dialog.tsx`                       | Create dialog; reused.                                                                                                                                                |
| `modules/plans/components/index.ts`                                     | Barrel; reused.                                                                                                                                                       |
| `lib/api/endpoints/training-plans.ts`                                   | API client; reused. No `duplicate` method.                                                                                                                            |
| `lib/hooks/use-training-plans.ts`                                       | React Query hooks; reused. No `useDuplicate*`.                                                                                                                        |
| `lib/hooks/use-training-plans.test.ts`                                  | Hook tests; reused.                                                                                                                                                   |

### NEW — net-new modules for the rebuild

```
apps/platform/src/modules/plans/
  views/plan-detail-view.tsx                  // replaces the placeholder, hosts schedule + athletes tabs
  sections/plan-detail-header-section.tsx     // header with status-conditional button
  sections/plan-schedule-section.tsx          // week view with day rows
  sections/plan-athletes-section.tsx          // enrolled-athlete grid + enroll modal
  components/{day-row, session-row, block-editor, item-editor, ...}.tsx
```

(Detailed component breakdown lives in the implementation plan, not this audit.)

---

## 7. Library admin UI (`apps/admin/src/`)

### KEEP — admin app unchanged

The admin app currently has no LMS modules. This is correct — the rebuild adds them as net-new modules following the existing pattern (blog, products, users, reviews, pages, contacts).

### NEW — to add

```
apps/admin/src/
  app/(dashboard)/exercises/        (list + create + [id])
  app/(dashboard)/block-types/
  app/(dashboard)/scheme-types/
  app/(dashboard)/day-types/

  modules/exercises/{views,sections,components}/
  modules/block-types/{...}/
  modules/scheme-types/{...}/
  modules/day-types/{...}/

  lib/api/endpoints/{exercises,block-types,scheme-types,day-types}.ts
  lib/hooks/use-{exercises,block-types,scheme-types,day-types}.ts
  lib/config/navigation.ts          (add "Library" group with 4 entries)
```

Pattern reuses `AdminListView` + `DataTable` + `react-hook-form` + `createCrudHooks()` + `withAdminAuth`. No new architectural surface.

---

## 8. Seeds (`packages/api-server/prisma/seed/`)

### MODIFY — references the removed `WeeklyVolume` model

| File                     | Lines    | Change                                                                                                                                                                                                                                                            |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seed/clear-all.ts`      | 10       | Remove `await db.weeklyVolume.deleteMany()` line. After `WeeklyVolume` is dropped from schema, this call no longer compiles.                                                                                                                                      |
| `seed/clear-all.ts`      | (verify) | Add `await db.benchmark.deleteMany()` removal line, plus removal lines for the new `PlanItem` / `PlanBlock` / `PlanSession` / `PlanDay` / `PlanEnrollment` / `Exercise` / `BlockType` / `SchemeType` / `DayType` tables. Order matters — children before parents. |
| `seed/training-plans.ts` | 1-49     | Reused as-is for the simple `TrainingPlan` rows it seeds. **NEW** seeds added in subsequent files: `seed/library/{exercises,block-types,scheme-types,day-types}.ts` derived from the reference coach's PDF (so the database boots with a usable catalog).         |

### KEEP — other seed files

| File                                                                                                  | Note                       |
| ----------------------------------------------------------------------------------------------------- | -------------------------- |
| `seed/index.ts`, `seed/users.ts`, `seed/products.ts`, `seed/marketing-*.ts`, `seed/profiles.ts`, etc. | Unchanged by this rebuild. |

---

## 9. Dead-symbol grep — final confirmation

Searched 16 known-dead symbols across all `*.ts`, `*.tsx`, `*.prisma` files in `packages/` and `apps/`, excluding `node_modules` and `.d.ts`:

| Symbol                                             | Found?       | Notes                                                                                                                                                                                           |
| -------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PlanCoachAssignment`                              | NO           | Cleanly removed.                                                                                                                                                                                |
| `PlanOverride`                                     | NO           | Cleanly removed.                                                                                                                                                                                |
| `ExerciseLibraryItem`, `exerciseLibraryItem`       | NO           | Cleanly removed.                                                                                                                                                                                |
| `BlockKind`                                        | NO           | Cleanly removed.                                                                                                                                                                                |
| `SchemeTemplate`                                   | NO           | Cleanly removed.                                                                                                                                                                                |
| `BlockTemplate`, `SessionTemplate`, `WeekTemplate` | NO           | Cleanly removed.                                                                                                                                                                                |
| `LibraryScope`, `libraryScope`                     | NO           | Cleanly removed.                                                                                                                                                                                |
| `NEW_NO_START`, `buildNewNoStartCondition`         | NO           | Cleanly removed.                                                                                                                                                                                |
| `originalPlanId`                                   | NO           | Cleanly removed (the dead column flagged in ADR-0037 Consequences was actually purged in a follow-up commit).                                                                                   |
| `sourceDayId`, `sourceBlockId`, `sourceEntryId`    | NO           | Cleanly removed.                                                                                                                                                                                |
| `planEnrollment`, `planEnrollments`                | NO           | Old removed; the new model re-uses the names with different shape (`PlanEnrollment` table per ADR-0038). Verified that the new shape is what is being added, not the old one being resurrected. |
| `weeklyVolume`, `WeeklyVolume`                     | YES (2 hits) | `schema.prisma:31` (`User.weeklyVolumes` relation) and `seed/clear-all.ts:10` (deleteMany call). Both are removed by this audit's actions. After the schema diff lands, `grep` returns 0 hits.  |
| `Benchmark` (model, not type)                      | YES (1 hit)  | `schema.prisma:417-431` — removed by this audit's actions.                                                                                                                                      |
| `BenchmarkSource`                                  | YES (1 hit)  | `schema.prisma:289-292` + `Benchmark.source` field — removed with the model.                                                                                                                    |
| `pr-evaluator`, `prEvaluator`                      | NO           | The aggregator stub from ADR-0037 §3 was deleted in a follow-up commit (no `aggregators/` directory exists). Cleanly absent.                                                                    |
| `tonnageByPattern`                                 | YES (1 hit)  | `schema.prisma:402` — removed with `WeeklyVolume`.                                                                                                                                              |

**No further dead code remains.** The cleanup work consists of the three model removals (`WeeklyVolume`, `Benchmark`, `BenchmarkSource`) plus the two field renames / additions documented above.

---

## 10. Final action list (ordered for the schema diff PR)

The schema diff that follows this audit applies these in order:

1. Drop `model WeeklyVolume` and the `User.weeklyVolumes` relation.
2. Drop `model Benchmark`, the `User.benchmarks` relation, and `enum BenchmarkSource`.
3. Rename `BlockSession.kindName: String` to `BlockSession.blockNames: String[]`.
4. Add `LADDER` and `DISTANCE` variants to `enum SchemeArchetypeKind`.
5. Add new models per ADR-0038 / ADR-0039: `Exercise`, `BlockType`, `SchemeType`, `DayType`, `PlanDay`, `PlanSession`, `PlanBlock`, `PlanBlockTypeRef` (m:n pivot), `PlanItem`, `PlanEnrollment`.
6. Add `enum EnrollmentStatus`.
7. Update `seed/clear-all.ts` to remove `weeklyVolume.deleteMany()` and `benchmark.deleteMany()` calls; add the new tables in correct order (children before parents).
8. Run `pnpm db:reset` per ADR-0019.

Contracts patches in parallel:

1. Add `LADDER` + `DISTANCE` to `_domain/scheme-archetype.{schema,types,constants,test}.ts`.
2. Update `block-session.{schema,types}.ts` to expose `blockNames: string[]`.
3. Remove `_domain/benchmark-source.{schema,types}.ts` and the `_domain/index.ts` export.
4. Add new contract trees for `library/{exercise,block-type,scheme-type,day-type}/`, `plan-content/{plan-day,plan-session,plan-block,plan-item}/`, `plan-enrollment/`.

Mapper update:

1. Update `block-session.mapper.ts` to map `blockNames` instead of `kindName`.
2. Add 4 library mappers, 4 plan-content mappers, 1 enrollment mapper.

API + UI work follows from the new contracts; that is the implementation phase, not cleanup.

---

**End of cleanup audit.**
