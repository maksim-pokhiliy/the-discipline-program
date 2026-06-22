# 15. Archived inconsistency is intentional

- **Status:** Accepted
- **Date:** 2026-04-12
- **Context:** Audit section 2 flagged that `TrainingPlanStatus.ARCHIVED` (enum) and `Workout.isArchived` (boolean) use different mechanisms for the same word "archived."

> **Superseded by ADR-0037 (2026-06-22 doc sweep):** the `Workout` model and its `isArchived` boolean were removed in the compose pivot. The enum-vs-boolean inconsistency this ADR rationalised no longer exists; kept as history.

## Decision

Keep the inconsistency. The two mechanisms are intentionally different because the underlying domain semantics differ:

- **TrainingPlan** has a lifecycle with explicit transitions: `DRAFT -> ACTIVE -> ARCHIVED`. Archiving is a status transition that affects visibility, enrollment eligibility, and dashboard computations. An enum state machine is the right model.
- **Workout** has no lifecycle. It is either visible or hidden within its plan. `isArchived` is a soft-visibility toggle, not a status transition. A boolean is the right model — there is no "draft workout" or "active workout" concept.

Forcing workouts into a status enum would add complexity without adding information. Forcing plans into a boolean would lose the state machine.

## Consequences

- The word "archived" means different things for plans (status transition) and workouts (visibility toggle). This is documented in the glossary (BOUNDED-CONTEXTS.md section 12).
- New entities should choose the mechanism based on whether they have a lifecycle (enum) or not (boolean).
