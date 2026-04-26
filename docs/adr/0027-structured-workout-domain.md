# 0027. Structured workout domain (supersedes ADR-0016)

- **Status:** Proposed
- **Date:** 2026-04-26
- **Tags:** `domain`, `lms`, `breaking-change`, `schema`

## Context

ADR-0016 deferred structured workout modeling. At the time the platform was scaffolded but unshipped, product decisions about block types, set schemas, and exercise references had not been made, and the cost of the deferral was bounded — `Workout.content` could carry HTML from tiptap until those decisions matured.

Two things changed at once. First, a domain analysis against a real coach's program (the Discipline dump) surfaced 20 distinct edge cases that cannot live inside a single HTML blob: time-boxed segments, wave loading, ladders, compound reps, per-set variation, suspension states, equivalent substitutions, asymmetric/hold modes, selective rest config, composite movements, and 12 more (see `docs/design/workout-redesign.md` §5.1). Second, every product feature on the M1+ roadmap — analytics (PR per movement, tonnage by muscle group, density, compliance), six archetype timers (NONE / COUNT_UP / COUNT_DOWN / INTERVAL_LOOP / EMOM_LOOP / TIME_BOXED), per-athlete overrides, named templates, free-text/PDF import — requires structured exercise references and structured set logging. None of these can be built on top of `Workout.content` HTML.

The database is empty. There are no production users. Migration cost is zero. The only cost of the rewrite is the work itself, paid against a decision-window where the alternative (continued HTML) compounds friction every week the LMS layer is exercised.

## Decision

We replace `Workout` and its descendants with a seven-level structured hierarchy:

```
TrainingPlan → Week → Day → Session → Block → BlockSegment → SetGroup → ExerciseEntry
```

`ExerciseEntry` carries an FK to `ExerciseLibraryItem` and an immutable JSON snapshot of the entry-time exercise state, so that historical entries survive library renames and deletions while analytics can still `GROUP BY exerciseId`. `BlockSegment` discriminates on a `SchemeArchetypeKind` enum (six values: NONE, COUNT_UP, COUNT_DOWN, INTERVAL_LOOP, EMOM_LOOP, TIME_BOXED — covered in ADR-0031) and carries `schemeParams` as JSON validated by a discriminated zod union with a database CHECK constraint enforcing that `scheme_params->>'kind' = archetype_kind::text`.

Logging is rewritten in parallel as a four-level structure: `WorkoutSession → BlockSession → ExerciseLog → SetLog`. The `@@unique([userId, workoutId])` constraint on the legacy `WorkoutLog` is dropped (covered in ADR-0029): athletes may log the same workout multiple times.

`Workout`, `WorkoutLog`, `BenchmarkDefinition`, and `UserBenchmark` are removed entirely. Benchmarks become `ExerciseLibraryItem` rows with `isBenchmark = true`; per-user references become `Benchmark` rows with `source = MANUAL` (covered in ADR-0034 for the library design and the design doc §6.7 for the data flow).

The decision is bounded to the LMS bounded context. Marketing, billing, IAM, CMS, and storage are not affected.

## Consequences

**Positive:**

- Analytics that the legacy schema could not produce — PR per movement, tonnage by `MovementPattern`, weekly compliance gradient, density per block — become straightforward Prisma queries with sub-50ms budgets.
- Six archetype timers in `@repo/workout-engine` (M3 deliverable) bind to a stable enum, not to free-text parsing.
- Per-athlete overrides, named templates (block / session / week level), and free-text PDF import all have a target structure to write into.
- Snapshot-on-insert protects historical entries: renaming "DB Snatch" to "Single-arm DB Snatch" does not retroactively rewrite logs.
- The 20 edge cases from the program dump map cleanly without any FREEFORM escape hatch.

**Negative:**

- Schema breaking change. Everything in `packages/contracts/src/entities/lms/`, `packages/api-server/src/endpoints/lms/`, `packages/api-server/src/mappers/lms/`, the platform app's `modules/plan-detail`, and the platform app's plan/workout API routes is rewritten. Apps/platform UI is broken between M0 and M1.
- More tables (~16 new LMS models) means a larger surface area to keep type-safe and to seed.
- JSON `schemeParams` is not directly indexable. We accept this trade — see ADR-0031.
- Snapshotting roughly doubles write volume on `ExerciseEntry` and `ExerciseLog` rows (~200 bytes/row of JSON). Acceptable at expected workload (~70k rows for a full 52-week plan; see design doc §11.1).

**Neutral:**

- Database CHECK constraints live in `packages/api-server/prisma/sql/lms-checks.sql` and are applied by a `db:push` wrapper, because Prisma does not yet have first-class CHECK support (covered in ADR-0031).
- The `Plan` aggregate is paginated by week range; the API does not return the full tree by default. Editor consumers fetch `?fromWeek=N&toWeek=M`.
- A new package `@repo/workout-engine` is introduced in M3 for the timer FSMs. Browser-safe, pure dependencies (`@repo/contracts` + `@repo/shared` only).

## Alternatives considered

**Keep `Workout.content` as HTML, parse on read.** The lowest-friction option for the editor — coaches already type into tiptap. Rejected: every analytics query becomes a regex pass over HTML; no synonym handling; no PR detection; no timer binding. The audit explicitly called this out as the structural blocker. The deferral in ADR-0016 was conditional on product immaturity, and the condition no longer holds.

**Pure relational scheme decomposition (separate tables per archetype).** Six tables, one per `SchemeArchetypeKind`. Strict typing at the DB level. Rejected: most of the per-archetype tables would be sparse; query plans for "load any block segment with its scheme" would need a six-way left join or a discriminator-aware union; adding a seventh archetype later would be a new table and a new migration. The DB CHECK plus zod-validated JSON achieves equivalent correctness at one-fifth the schema surface.

**Pure JSON for the plan tree.** A single `Plan.tree: Json` column. Maximum flexibility. Rejected: every analytics query becomes a JSONB GIN scan; `GROUP BY exerciseId` is impossible without denormalization; per-row indexes on `(plan_id, week_index, day_of_week)` are gone. The hybrid recovers indexability for the analytics-critical entities (ExerciseEntry, SetLog) while keeping JSON for the execution-only `schemeParams` payload that analytics never reads.

**Continue with HTML in M0/M1, structure later.** Rejected: every M1+ feature on the roadmap (analytics, timers, overrides, templates, import) is blocked on this decision. Doing it later doubles the work — once for the HTML editor in M1, again for the structured editor in M2 — and forces a real-data migration off HTML, which is exactly the migration cost we currently do not have.

## References

- `docs/design/workout-redesign.md` — full design (1786 lines).
- ADR-0016 — superseded by this record.
- ADR-0017 — partially superseded by ADR-0028 in the same wave.
- ADR-0029 — repeatability constraint drop.
- ADR-0030 — snapshot strategy.
- ADR-0031 — JSON discriminator.
- ADR-0034 — three CRUD libraries.
