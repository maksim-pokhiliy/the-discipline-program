# 16. Workout content as plain text

- **Status:** Accepted (interim)
- **Date:** 2026-04-12
- **Context:** Audit section 2 flagged that `Workout.content` is a free-text field (`String? @db.Text`) with no structured data model. There is no `WorkoutBlock`, `PrescribedSet`, `SetLog`, or exercise-level tracking. This limits analytics, PR tracking, exercise substitution, and per-set logging.

## Decision

Keep workout content as plain text for now. Structured workout data (blocks, sets, exercises) is Phase 3+ scope.

Reasons:

1. **Platform app is scaffolded, not shipped.** The coaching UI (Phase 2) is in progress. Building a structured workout editor before the basic platform is usable is premature.
2. **Schema design for structured workouts requires product decisions** that are not yet made: block types (warmup/main/cooldown?), set schemas (reps x weight? time? distance?), exercise reference model, scaling/substitution rules.
3. **The current plain-text approach is functional.** Coaches can write workout descriptions, athletes can log completion. The `isRx` boolean on `WorkoutLog` is a deliberate minimal-feedback mechanism.
4. **Migration path is clean.** When structured workouts are needed: add new models (`WorkoutBlock`, `PrescribedExercise`, `ExerciseSet`), keep `content` as a fallback/legacy field, build a migration tool. No existing data is lost.

## Consequences

- No exercise-level analytics until Phase 3+.
- No PR tracking across workouts.
- No exercise substitution or scaling logic.
- `WorkoutLog.isRx` remains the only structured feedback per workout.
- When structured workouts land, this ADR should be superseded with the new data model design.
