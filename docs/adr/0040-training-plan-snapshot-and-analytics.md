# 0040. Training plan snapshot and analytics

- **Status:** Accepted
- **Date:** 2026-05-05
- **Tags:** `lms`, `snapshot`, `analytics`, `schema`

## Context

ADR-0038 establishes that completion truth lives in a frozen snapshot captured at session start. ADR-0039 establishes that library entries (`Exercise`, `BlockType`, `SchemeType`, `DayType`) are referenced from plan content as live links. This record specifies how those two facts compose: what the snapshot contains, when it is taken, what the snapshot is good for (analytics), and what the snapshot deliberately does not capture.

The prior implementation had a sophisticated analytics tier on top of the same snapshot model: `WeeklyVolume` materialized aggregates, a `pr-evaluator` candidate-detector, a `tonnage-by-pattern` rollup keyed on `MovementPattern`. ADR-0037 stubbed all of that to empty; the schema rows survived. This rebuild removes the unused tables outright and re-derives the surviving primitives live, on demand, from the snapshot tables. Materialization comes back when there is a perf wall to hit.

The reference coach's vocabulary uses one prescription pattern that needs explicit modeling: percent-of-personal-record loads (`75% of Back Squat 1RM`). This is borrowed from HWPO / Volt / TrainHeroic and is the standard expectation for any modern coaching tool. It must be in MVP because the very first plan the coach builds will use it for any non-trivial strength block.

## Decision

### Snapshot scope

The snapshot is a **fully denormalized prescribed tree**, captured at session `started`. It is self-sufficient for both render ("what should I do") and logging ("what I did"). Library FKs are not preserved at the block / scheme / day-type level — display works from the resolved names already in the snapshot, and analytics will match by name + `primaryMovement` rather than by FK.

The one exception is `exerciseId`, which **is** preserved in `ExerciseLog.exerciseSnapshot`: cheap to store now, expensive to retrofit if cross-athlete exercise aggregation analytics arrives later.

The four-level snapshot tier (`WorkoutSession → BlockSession → ExerciseLog → SetLog`) is reused unchanged from the surviving athlete-log tier. What changes is what gets written into the snapshot fields:

| Level            | Snapshot contents                                                                                               | Library FK kept                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `WorkoutSession` | scheduledFor (now `scheduledDate`, the plan-day date), athleteId, status fields                                 | `planSessionId?` (nullable; null if source plan deleted) |
| `BlockSession`   | order, resolved blockNames (composite array), schemeName, schemeArchetypeKind, schemeParamsSnapshot, modifiers? | none                                                     |
| `ExerciseLog`    | order, resolved exerciseName, exerciseUrls[], primaryMovement, prescription (resolved load)                     | `exerciseId` (for future analytics)                      |
| `SetLog`         | order, prescribed (resolved), actual, completedAt?                                                              | none                                                     |

`BlockSession.kindName` (currently a single string field) becomes `blockNames` (string array) to match composite block-typing from ADR-0039. The change is structural, not behavioral.

### Two-event session lifecycle

Each `PlanSession` an athlete consumes has two discrete events:

1. **`started`** — athlete clicks "begin". Backend captures a frozen JSON snapshot of the prescribed tree (`PlanSession → PlanBlock → PlanItem`) into `WorkoutSession` / `BlockSession` / `ExerciseLog`. From here on, the athlete's session is decoupled from the live plan tree.

2. **`completed`** — athlete clicks "done". `completedAt` is recorded; duration becomes derivable.

Snapshot timing is `started`, not `completed`, so:

- Coach edits during the athlete's session do not disturb the in-progress snapshot.
- Abandoned sessions (`started` without `completed`) still carry a snapshot + partial actuals → analytics can distinguish "tried" from "finished".

### Started — the operation

```
input: athleteId, planSessionId
checks:
  - athlete has an active (non-deleted, status = ACTIVE) PlanEnrollment
    on the plan that owns this PlanSession;
  - the PlanSession's plan-day date is within the athlete's visibility window
read:
  - full PlanSession tree, joined with BlockType / SchemeType / Exercise / PersonalRecord
transaction:
  - insert WorkoutSession { athleteId, planSessionId, scheduledDate, startedAt: now }
  - for each block: insert BlockSession with denormalized snapshot
  - for each item: insert ExerciseLog with resolved exercise snapshot + resolved prescription
  - SetLogs are created lazily as the athlete logs each set
return: created snapshot tree
```

There is **no concurrency check** in MVP — no "one active session per day" lock. If the athlete starts two sessions in parallel (two browser tabs, weird device behavior) the system tolerates it; observed risk is low and the constraint adds enforcement cost without clear value at this stage. We add the lock if it becomes a real problem.

### Completed — the operation

`completedAt = now`, plus optional summary fields (`perceivedExertion`, `mood`, `notes`). No analytics recompute happens in this call — analytics is derived live from snapshot tables when queried.

Late-close (athlete returns hours or days later to mark an abandoned session done): `completedAt = startedAt + 1h` — a deterministic placeholder duration rather than a fabricated real duration. Lossy timing is the price of letting the athlete close their own loop without UI friction.

### Abandoned semantics

A `WorkoutSession` with `startedAt` set, `completedAt` null, and a plan-day date in the past is **abandoned**. There is no `abandonedAt` field, no status enum entry — the abandoned state is derived from those three facts. There is no automatic "close abandoned" sweep — we do not finish sessions on the athlete's behalf.

The existing `WorkoutSessionStatus` enum (`IN_PROGRESS / COMPLETED / ABANDONED / SKIPPED`) carries `ABANDONED` and `SKIPPED` variants from the prior design. They survive the rebuild but are not used in MVP — derived state is sufficient. They remain available for future flows that need explicit status (e.g. "skip this workout, don't count it as missed").

### Percent-of-benchmark resolution

The prescription resolves percent loads against the athlete's PR at session-start, not session-create:

1. A coach prescribes a load with `loadSpec.kind = PERCENT_BENCHMARK`, specifying a benchmark kind (`BACK_SQUAT_1RM` from `PrKind`) and a percent.
2. At `started`, the backend looks up the athlete's `PersonalRecord` for that kind.
3. If the PR exists, the resolved kg is computed and stored alongside the original percent in the snapshot's prescribed load.
4. If the PR does not exist, the snapshot stores the percent with a null resolved kg. The athlete sees the percent during the workout; pre-session UI prominently CTAs the athlete to set their PR in profile.

Updates to the athlete's PR after `started` do **not** retroactively reshape the in-flight snapshot — frozen is frozen. They affect subsequent sessions only.

The `PERCENT_BENCHMARK` variant exists in `loadSpecSchema` (`@repo/contracts/lms/_domain/load-spec.schema.ts`) from the prior implementation and is reused unchanged. The flow is enabled by `Exercise.benchmarkPrKind` (ADR-0039) — only exercises with that field set may be referenced by a percent-prescribed item; the picker in coach UI filters accordingly.

### Analytics primitives in MVP

- **Scheduled session count (window)** — count of (athlete, planSession) pairs where the planSession's plan-day date is in the window AND the athlete had an active enrollment on that date.
- **Completed session count (window)** — count of `WorkoutSession` rows with `completedAt` in the window.
- **Completion %** = completed / scheduled in the same window.
- **Streak** — current consecutive count of dates (going back from today) where the athlete had ≥1 completed session **or** had no scheduled session that day. Rest days do not break the streak; days outside the athlete's enrollment also do not break the streak. Only a date with a scheduled session and zero completed sessions breaks the chain.
- **Abandon rate (window)** — abandoned count / started count, over the same window.

### Materialization

Analytics in MVP is **derived live** from snapshot tables — no materialized weekly aggregates, no background recompute jobs, no cron. With proper indices on `WorkoutSession (userId, completedAt)` and `WorkoutSession (userId, scheduledFor)` this stays cheap at MVP scale. Materialization comes back when there is a real perf wall to hit.

The existing `WeeklyVolume` model (and its `tonnageByPattern` JSON column) is removed. Tonnage analytics is explicitly **out of MVP scope**; it returns when the coach has a use case for "show me athlete X's pull volume this month".

### Out of MVP scope

The following are explicit non-goals; the schema does not pre-empt them:

- **Per-pattern tonnage rollups.** Removed with `WeeklyVolume`. Re-derive when needed; `MovementPattern` enum survives because `Exercise.primaryMovement` uses it.
- **Per-exercise PR detection from completed sets.** The `pr-evaluator` from the prior implementation is gone. Athletes set their PRs manually in the profile in MVP. Auto-detection from `SetLog.actual` is a Phase 2 deliverable.
- **Benchmark workout time tracking** (Fran, Murph). Deferred per ADR-0039.
- **Cross-plan dashboards.** The athlete may have multiple active enrollments; aggregating across them is a UI / analytics concern, not a domain concern.
- **Real-time biofeedback adjustment** (Volt-style auto-regulation). Schema permits via `Override` overlay if it lands; not built.

## Consequences

**Positive:**

- The snapshot tier (4 tables, already in production schema) does double duty: it captures completion truth for the athlete and feeds every analytics primitive the MVP needs. No second tier to maintain.
- Snapshot at `started` (not `completed`) cleanly separates "what should I do today" (live plan tree) from "what did I do" (snapshot). Coach edits during an athlete's workout never reach into the active session. Coach edits after the fact never reach into a completed session.
- Library FK omission (block-level / scheme-level / day-type-level) keeps snapshots self-rendering. A coach who deletes a `BlockType` does not break athlete history; the deleted name is already frozen in the snapshot.
- Percent-of-benchmark resolution at `started` matches industry expectation (HWPO, Volt, TrainHeroic) and uses primitives already in the codebase (`PERCENT_BENCHMARK` loadSpec variant, `PersonalRecord` model, `PrKind` enum). Zero new tables for this flow.
- Live-derived analytics removes the failure mode where materialized aggregates drift out of sync with snapshot truth. Every query is correct by construction.
- Late-close (`completedAt = startedAt + 1h`) is a deterministic, cheap workaround that keeps the analytics surface honest. We log the wrong duration in a rare edge case rather than fabricate data or block the athlete.

**Negative:**

- Live-derived analytics has a perf ceiling. At MVP scale (one coach, dozens of athletes, weekly snapshots) it is fine; at marketplace scale it is not. We accept the trade in exchange for not maintaining a materialization tier nobody uses yet.
- No materialized streak / completion-percent rollups means UI screens that show these for many athletes (e.g. coach dashboard "all athletes' streaks") run an aggregating query each render. If pagination + index correctness is wrong, the dashboard slows down silently.
- Snapshot at `started` means an athlete who starts a session, then the coach edits the day "for next week" mid-session, gets the old version. This is intentional but counter-intuitive to coaches expecting WYSIWYG. Documentation surface, not schema.
- No PR auto-detection means athletes must remember to set PRs manually for percent prescriptions to resolve. Friction at first plan; manageable with a clear onboarding CTA.
- Removing `WeeklyVolume` and its index means we cannot reconstruct tonnage history retroactively for any data already logged. The decision is made knowing the database is non-prod and effectively empty.

**Neutral:**

- The `Benchmark` model and `BenchmarkSource` enum are removed entirely. They have no consumer in MVP — the coach-side benchmark workout library is deferred (ADR-0039), and athlete-side per-workout PR tracking is also deferred. Re-introduce as new tables when the use case lands.
- The `WorkoutSessionStatus` enum survives with all four variants (`IN_PROGRESS / COMPLETED / ABANDONED / SKIPPED`), even though only `IN_PROGRESS` and `COMPLETED` are written by MVP code. The other two variants document future intent (explicit `SKIPPED` when the athlete tells the system "I'm not doing this", explicit `ABANDONED` if we add an automatic sweep).
- `BlockSession.kindName: string` is renamed to `blockNames: string[]` to match composite block-typing.
- `BlockSession.weight: int` is left in place — it is a UI-side hint for coaches to express block prominence in nav UIs ("the heavy block of the day"); not load-bearing for analytics.
- The existing `_domain` Zod primitives (`exerciseSnapshotSchema`, `prescriptionSchema`, `loadSpecSchema`, `repSpecSchema`, `tempoSpecSchema`, `sideModeSchema`, `modalitySchema`, `bodyPartSchema`, `movementPatternSchema`, `prKindSchema`, `rxStatusSchema`, `schemeArchetypeKindSchema`, `workoutSessionStatusSchema`) survive unchanged except for the `LADDER + DISTANCE` archetype additions in ADR-0039. They define the shape of every snapshot field.

## Alternatives considered

**Snapshot at `completed`.** Capture nothing at start; freeze the prescribed tree only when the athlete marks the session done. Rejected because it leaves abandoned sessions without a snapshot at all (no record of what was supposed to happen) and because it places the burden of "what did the prescribed tree look like at start" on the application to reconstruct from coach-edit history — which we deliberately do not maintain.

**Materialize weekly aggregates from day one.** Build `WeeklyVolume` properly, with a recompute job triggered by snapshot writes. Rejected because materialization adds a second source of truth that drifts from the first whenever the recompute job has a bug. At MVP scale, derived queries are honest and fast; we add materialization when we hit a real perf ceiling, not pre-emptively.

**Keep `WeeklyVolume` model as a stub (per ADR-0037 §3 strategy).** The prior rollback approach: keep the table, return zeros from aggregators. Rejected because dead schema with no writer is worse than no schema at all — every reader has to remember "this is not real, ignore it"; every migration has to maintain compatibility with rows that will never be populated. Honesty wins; remove the table.

**One snapshot row per (athlete, plan-session, attempt) with `attempt_n` discriminator.** Industry pattern for "retry this workout" — every attempt is a row, latest attempt wins. Rejected because the no-uniqueness invariant on `WorkoutSession` (ADR-0029 partial) already supports re-attempts implicitly: the athlete just starts another session against the same `planSessionId`; analytics queries pick the relevant row by date / status. Adding `attempt_n` would force every reader to think about "which attempt" when most readers do not care.

**Auto-detect PRs from `SetLog.actual` at completion.** The prior `pr-evaluator` design. Rejected for MVP because (a) auto-detection requires defining "is this a PR?" rules per `PrKind` which is its own design problem, and (b) the percent-resolution flow only needs PRs to exist, not to update automatically. Manual entry in the profile is sufficient until the rules are written.

## References

- `docs/design/training-plan-domain.md` — full design negotiation, especially Round 4 (Snapshot) and Round 1 (Two-event session lifecycle).
- ADR-0029 — workout-log repeatability (no-uniqueness invariant survives; this ADR continues that line).
- ADR-0030 — exercise library snapshot strategy (superseded by ADR-0037; this ADR re-establishes a snapshot strategy under different library shape, see ADR-0039).
- ADR-0031 — scheme params as discriminated JSON (continues to apply: `BlockSession.archetypeKind` + `schemeParamsSnapshot` use the discriminated `_domain/scheme-archetype.schema.ts` zod union).
- ADR-0037 — prior rollback (the baseline; aggregator stubs from §3 are removed by this ADR).
- ADR-0038 — high-level training-plan domain decisions (the four masses; this ADR specifies mass 4).
- ADR-0039 — library catalog (referenced for the `Exercise.benchmarkPrKind` field that drives percent-resolution).
