# 0029. WorkoutLog repeatability — drop @@unique constraint

> **[SUPERSEDED — partial]** by ADR-0037 on 2026-05-03 — the `enrollmentId` and `sourceDayId` columns referenced in this ADR's "Decision" section (`@@index([enrollmentId, startedAt])`, `WorkoutSession.sourceDayId`) were dropped when the plan-editor / library / templates feature was rolled back; `PlanEnrollment` no longer exists and `Day` was deleted with the authoring tree. The core decision — `WorkoutSession` carries no uniqueness constraint, repeatability is the contract, sessions are identified by their primary key — survives unchanged. The athlete-history index `@@index([userId, startedAt])` remains. Coach-side per-enrollment progress views are gone with the enrollments.

- **Status:** Accepted
- **Date:** 2026-04-26
- **Tags:** `lms`, `schema`, `breaking-change`

> Status flipped from Proposed to Accepted: the schema change has landed and is load-bearing in code.

## Context

The legacy `WorkoutLog` model carries `@@unique([userId, workoutId])`: at most one log per user per workout. The constraint was pragmatic at the time — it prevented duplicate inserts from a misbehaving client and gave the dashboard a stable upsert key.

Three real product behaviors require the constraint to go.

1. **Repeated programs.** A coach reuses an annual cycle. An athlete who completed Discipline-2024 starts Discipline-2025; the days are the same DB rows; the second pass would fail the constraint on every workout.
2. **Backfill.** When an athlete enrolls mid-cycle, they want to log the workouts they did before the system existed. Each backfilled date is a distinct attempt, not an overwrite of "today's log".
3. **Retest attempts.** PR retesting on a benchmark workout (Cindy, Fran) is a deliberate second attempt. Comparing performance over time requires both attempts to exist.

The legacy `WorkoutLog` model is being removed entirely (ADR-0027). Its replacement, `WorkoutSession`, is designed for repeatability from the start. This ADR records the rationale separately because the repeatability decision is independent of the structural rewrite — it would still apply if we kept the flat log model.

## Decision

`WorkoutSession` does not carry a uniqueness constraint over `(userId, sourceDayId)`. `sourceDayId` is itself optional: a session can exist without being tied to a planned day (free-form logging, drop-in workout). The natural identifier of a session is its primary key (`id`).

Query patterns are served by secondary indexes:

- `@@index([userId, startedAt])` — athlete history view, ordered by date.
- `@@index([enrollmentId, startedAt])` — coach's per-athlete progress view inside one plan.

The dashboard consumes "most recent session per day" via an ordered query, not via a uniqueness assumption.

## Consequences

**Positive:**

- Repeated annual cycles work without contortion.
- Backfill works without inventing fake dates or per-attempt counters.
- PR retest patterns (re-running a benchmark every 8 weeks) capture the full progression.
- The data model carries no implicit "one log = one workout" assumption that future features would have to break.

**Negative:**

- Clients that previously relied on the unique constraint as deduplication insurance must dedupe explicitly. Mitigated: the only such client was the platform dashboard, which we are rewriting wholesale in M1.
- "Latest session for day X" requires `ORDER BY startedAt DESC LIMIT 1` instead of a direct lookup. Indexed; sub-millisecond. Acceptable.

**Neutral:**

- Idempotency for client retries — if it becomes necessary — is implemented via a client-supplied `idempotencyKey` (HTTP header) and a small dedup table in the API layer, not via a domain uniqueness constraint. Out of scope for M0.

## Alternatives considered

**Keep `@@unique`, soft-overwrite via upsert.** Rejected: loses history. The whole point of a log is the history.

**Composite uniqueness on `(userId, sourceDayId, attempt)`.** Add an explicit attempt counter, increment on retest. Rejected: every write needs a read-modify-write of the counter under a lock. Race-prone, latency-prone, ugly. The PK-only model is simpler and matches the domain ("a session is a thing that happened, not a slot to be filled").

**Soft-delete the previous log on insert.** Rejected: dashboard queries become "WHERE deletedAt IS NULL" and lose the second attempt; or they show both and the soft-delete is dishonest. Either way, the constraint adds confusion without value.

## References

- `docs/design/workout-redesign.md` §6.6 (repeatability) and §3.3 (`WorkoutSession` model).
- ADR-0027 — the structural rewrite that retires `WorkoutLog`.
- ADR-0009 — soft-delete extension; not used here.
