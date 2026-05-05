# 0037. Plan editor and library rollback

- **Status:** Accepted
- **Date:** 2026-05-03
- **Tags:** `lms`, `rollback`, `schema`, `breaking-change`, `archive`

## Context

Between PR #176 and PR #177 (`feat/manual-plan-authoring`) the project landed an end-to-end plan authoring vertical: a structured workout domain (ADR-0027), a service layer for LMS operations (ADR-0028), the hybrid FK + immutable JSON snapshot strategy (ADR-0030), discriminated-JSON scheme params (ADR-0031), three independent CRUD libraries — exercises, block kinds, scheme templates (ADR-0034) — and the explicit edit-session save model (ADR-0035). The vertical reached a load-bearing state: 15 Prisma models, 9 enums, ~50 backend endpoints, the `apps/platform/src/modules/plan-editor` editor, the `apps/platform/src/modules/library` and `apps/admin` library pages, six template tiers (`BlockKind`, `SchemeTemplate`, `BlockTemplate`, `SessionTemplate`, `WeekTemplate`), the `PlanEnrollment` + `PlanOverride` athlete-binding tier, the `PlanCoachAssignment` per-plan grant model, the `chk_scheme_params_kind_matches` DB CHECK, and ~50 api-server tests covering the surface.

The product owner has decided to roll the entire vertical back to a "not started" baseline and re-attempt later from scratch. Reasons for the rollback are out-of-scope for this record. This ADR documents the structural removal — what was deleted, what was preserved, and which prior ADRs are affected — so that the doc tree continues to reflect the live system rather than an aspirational design that was reverted.

The rollback is end-to-end. Frontend modules, app routes, hooks, contracts, server endpoints, services, mappers, Prisma models, enums, seeds, SQL CHECKs, and Storybook stories all delete in one PR. Twelve prior ADRs are affected: five are fully superseded, six are partially superseded, one (ADR-0025) is unaffected and skipped.

## Decision

The plan-editor / library / templates feature is rolled back to a "not started" baseline. Concretely:

1. **DB strategy: `pnpm db:reset`.** ADR-0019 sanctions drop+recreate for non-prod. No `prisma/migrations/` folder exists in repo; the project uses `prisma db push`. Authoring a backward-compatible migration is overkill for a non-prod schema change. All dev databases must reseed after pulling.

2. **Plan access: creator + admin/head_coach.** `verifyPlanOwnership` in `packages/api-server/src/authz/guards.ts` reduces to `creatorId === userId` OR role IN (ADMIN, HEAD_COACH). The `PlanCoachAssignment.findFirst` predicate is removed; the model is gone. Implicit access regression for non-creator non-admin coaches is acceptable since the editor itself is gone (no edits to grant).

3. **Aggregator strategy: stub.** `weekly-volume-aggregator.ts` and `pr-evaluator/` keep their public function signatures and return empty / zero results. The athlete-log endpoints (`weekly-volume`, `personal-record`, `benchmark`) keep their typed response contracts; consumers see well-formed empty responses. Re-implementation will fill the stubs back in alongside whatever library replacement lands.

4. **FK strategy: drop entirely, no nullable string.** `ExerciseLog.exerciseId`, `Benchmark.exerciseId`, and `PersonalRecord.exerciseId` are dropped as columns. The `@@unique([userId, exerciseId, kind])` constraints on PR + Benchmark are dropped (rows now stack chronologically; aggregators are stubbed so the unique-collapse risk doesn't matter). `WorkoutSession.sourceDayId`, `BlockSession.sourceBlockId`, `ExerciseLog.sourceEntryId` are dropped as columns. `ExerciseLog.exerciseSnapshot` JSON survives as the only displayable identity athlete logs retain — disconnected from any library, by design.

5. **`duplicate` endpoint: removed.** `POST /api/platform/training-plans/[planId]/duplicate`, the `lmsTrainingPlanApi.duplicate` server method, the `duplicateTrainingPlanParamsSchema` / `duplicateTrainingPlanResponseSchema` contracts, the `useDuplicateTrainingPlan` hook, and the `onDuplicate` prop chain through `plans-list-section → plan-card → plan-action-menu` are all deleted. Without weeks/days to clone, duplicate has no useful semantics; reducing it to "create blank copy" was rejected as a half-measure (ADR-0037 D5 in the RFC). The "Duplicate" menu item is gone from the plan list.

6. **`NEW_NO_START` action item: removed.** `ActionItemType` enum loses the `NEW_NO_START` variant. The condition builder `buildNewNoStartCondition` in `coach-action-item-reconcile-conditions.ts` and its branch in the `Condition` discriminated union are deleted. The condition reads `athlete.planEnrollments` (deleted); without enrollments, the action item type is unreachable. `MISSED_WORKOUTS` and `HEALTH_REPORT` survive.

7. **Twelve prior ADRs receive supersede stamps.**
   - **Fully superseded** (the entire decision no longer applies to live code):
     - ADR-0027 (structured workout domain) — the seven-level authoring tree is gone; the four-level athlete-log tree survives but disconnected from any library.
     - ADR-0028 (service layer for LMS operations) — every LMS authoring service is deleted; `weekly-volume-aggregator` + `pr-evaluator` survive as stubs.
     - ADR-0030 (exercise library snapshot strategy) — the `ExerciseLibraryItem` model is gone; the `exerciseSnapshot` JSON column on `ExerciseLog` survives but is now snapshot-without-FK.
     - ADR-0034 (three independent CRUD libraries) — all three libraries are deleted; `LibraryScope` enum is gone.
     - ADR-0035 (editor save model) — the entire plan-editor and the `useEditSession` reducer are deleted.
   - **Partially superseded** (the decision still governs surviving code; the part tied to the deleted surface is gone):
     - ADR-0009 (soft-delete via Prisma extension) — six LMS library models drop out of `SOFT_DELETE_MODELS`; the extension and the remaining set are unchanged.
     - ADR-0023 (test strategy) — the LMS authoring test tier is gone; framing for the surviving surface is unchanged.
     - ADR-0029 (workout-log repeatability) — `enrollmentId` index and `sourceDayId` references no longer apply; the no-uniqueness contract on `WorkoutSession` survives.
     - ADR-0031 (scheme params as discriminated JSON) — `BlockSegment` + `chk_scheme_params_kind_matches` are gone; `BlockSession.archetypeKind` + `schemeParamsSnapshot` survive (two-layer validation, no DB CHECK).
     - ADR-0032 (single-team simplification) — library-scope clause and `PlanCoachAssignment` clause are gone; Role enum, no-tenant, HEAD_COACH bypass, `CoachAthleteAssignment` survive.
     - ADR-0036 (idempotency-key on mutations) — the LMS authoring mutation routes that this ADR covered are gone; the factory-level coverage continues to apply structurally to every surviving mutation route.
   - **Skipped** (verified, no material reference to deleted feature):
     - ADR-0025 (code-quality deferred decisions) — branded types, discriminated unions, immutability, sonarjs, knip, additional tsconfig flags, domain error codes; all triggers are generic and survive the rollback.

The decision is bounded to the LMS authoring + library surface. IAM, billing, marketing, CMS, storage, coaching dashboard, action items, and the athlete-log domain models (`WorkoutSession`, `BlockSession`, `ExerciseLog`, `SetLog`, `PersonalRecord`, `Benchmark`, `WeeklyVolume`) survive minus the cleaved FKs.

## Consequences

**Positive:**

- The doc tree reflects the live system. Twelve ADRs that previously described load-bearing code now carry honest supersede stamps; readers six months from now do not have to reconcile aspirational ADRs against a deleted feature surface.
- The schema is genuinely smaller. 15 models + 9 enums removed; ~50 endpoints + ~50 tests gone; backend bundle and Prisma client both shrink.
- The remaining surface is internally consistent. Plan list still works (CRUD, status transitions); the placeholder detail page is one-line; coach dashboard loads with `planId` / `planName` always-null per the unchanged response schema.
- Re-implementation has a clean baseline. Whatever the next attempt looks like, it starts from "not started" rather than from a partially-built editor that survived as dead code.

**Negative:**

- The athlete-log domain models survive but their aggregators are stubs. `weekly-volume-aggregator` returns empty rows; `pr-evaluator` returns no candidates. Anyone reading `WorkoutSession` / `BlockSession` / `ExerciseLog` data today will see well-formed empty responses regardless of what the row data implies — re-implementation will need to rewire the aggregators against whatever library replacement lands.
- Vercel Blob assets that were referenced by the deleted `ExerciseLibraryItem.demoImageUrl` / `demoVideoUrl` columns are orphaned. No automatic cleanup; flagged INFO. (DB is non-prod per ADR-0019; assumed no real assets to lose.)
- Implicit access regression: any non-creator non-admin coach previously granted edit-rights via `PlanCoachAssignment` can no longer edit. Acceptable since the editor itself is gone; no edits to grant.
- The `originalPlanId` column on `TrainingPlan` survives as a nullable string with no writer (duplicate is removed). It is harmless dead schema; cleanup deferred to a future PR.

**Neutral:**

- The `SchemeArchetypeKind` enum + `schemeParamsSchema` zod union remain in `packages/contracts/src/entities/lms/_domain/`. They are referenced by `BlockSession.archetypeKind` + `BlockSession.schemeParamsSnapshot` and continue to validate at write zod / read zod (no DB CHECK).
- The `MovementPattern` enum survives because `WeeklyVolume.tonnageByPattern` JSON shape still references it.
- `TrainingPlanListItem` and `TrainingPlan` converge to the same shape (no `enrolledAthletesCount`); the list / detail divergence per ADR-0020 / manifesto §2.7 is intentional — there is no list-side trim left.
- The placeholder detail page at `apps/platform/src/app/coach/plans/[planId]/page.tsx` is a 9-line server component mirroring `apps/platform/src/app/coach/profile/page.tsx`. Static markup, no fetch, no mutation, no view module.

## Reversibility

**Two-way door.** Git history preserves the deleted surface in its entirety; the supersede stamps on the prior ADRs preserve the design rationale. Re-implementation when product priorities allow can either:

- Cherry-pick from the deleted commits (PR #176, #177, plus follow-up fixes through `5bf0128f`) and adapt to whatever new constraints have emerged, or
- Start fresh with a new RFC and use the ADRs in this archive as background reading.

The DB-side cost of re-introduction is bounded: re-add the dropped columns, re-add the Prisma models, re-seed the libraries. The non-prod baseline (ADR-0019) makes drop+recreate cheap; the same property holds in reverse.

## Alternatives considered

**Soft-disable behind a feature flag.** Keep the code, hide the UI, mark the modules unused. Rejected because the user explicitly asked for "scorched earth, no trace". Soft-disable leaves dead code, dead tests, dead schema, and dead seeds. Manifesto §2.2: dead code deletes immediately; git history is the archive.

**Branch-based archive (delete on `main`, keep on `archive/plan-editor-v1`).** Easy to revive specific files later via cherry-pick. Rejected because git history already preserves everything; branches rot (no CI, no rebase against main). Git is the archive — no second branch needed.

**Keep `ExerciseLibraryItem`, delete only the editor / template / library UI.** Preserve the model so athlete-log FKs survive intact; delete only the surface above. Rejected per the user's explicit "снести... templates и library полностью" direction. Keeping the model leaves dead schema with no consumer (aggregators are stubbed); the FK is dead weight without the library that authored it.

**Reduce `duplicate` to "create blank copy".** Keep the endpoint; gut the cloning logic; have it create a `{ name: 'Copy of <name>', status: DRAFT, originalPlanId: <source-id> }` row. Rejected per the user's "снести целиком" direction; the affordance is removed alongside the menu item.

**Defer the ADR work.** Land the deletion in this PR; stamp ADRs in a follow-up. Rejected because the prior ADRs describe the live system to anyone reading the docs tree; leaving them un-stamped makes the doc-vs-code state inconsistent for as long as the follow-up sits in the queue. The ADR work is small (twelve files, ~30 lines each at most); it ships with the rollback.

## References

- `.feature-dev/1777803708/research.md` — codebase impact map (file-level inventory of what was deleted).
- `.feature-dev/1777803708/design.md` — RFC for the rollback (decision record D1-D7, alternatives, prior art for the placeholder page).
- `.feature-dev/1777803708/plan.md` — per-task atomic plan (task DAG, parallel groups, compile checkpoints).
- ADR-0009 — soft-delete via Prisma `$extends` (partial supersede).
- ADR-0019 — database strategy (drop+recreate sanctioned for non-prod; the basis for D1).
- ADR-0023 — test strategy (partial supersede).
- ADR-0027 — structured workout domain (full supersede).
- ADR-0028 — service layer for LMS operations (full supersede).
- ADR-0029 — workout-log repeatability (partial supersede).
- ADR-0030 — exercise library snapshot strategy (full supersede).
- ADR-0031 — scheme params as discriminated JSON (partial supersede).
- ADR-0032 — single-team product simplification (partial supersede).
- ADR-0034 — three independent CRUD libraries (full supersede).
- ADR-0035 — editor save model (full supersede).
- ADR-0036 — idempotency-key on mutation endpoints (partial supersede).
