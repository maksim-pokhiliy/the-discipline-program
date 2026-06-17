# primitive-v2 — deferred

Carry-forwards: findings/obligations not yet scheduled, with disposition + status. **Promote here at every gate.**

**Status:** `OPEN` (live) · `SCHEDULED` (assigned to a step) · `CLOSED` (done) · `DROPPED` (decided not to).

| ID                       | One-liner                                                                     | Disposition                                                                                                                                                                                                                              | Status |
| ------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| BASKET-C-2               | "build to a heavy single (1RM)" is domain-inexpressible                       | DEFER to Phase 3 (athlete 1RM). Owner: don't lose it. Stopgap: back-squat + a "build to a heavy single" modifier                                                                                                                         | OPEN   |
| BASKET-C-19              | "Core (each round a different movement)" per-round rotation                   | Already expresses (compound / per-set row-group — evil-corpus S3 builds it). No fold needed (confirmed at design time).                                                                                                                  | CLOSED |
| EXEC-11                  | score / time-windowed effort on a schema                                      | DEFERRED to the Phase-4 executor (D-V2-EXEC-DEFER-HOLD). No engine reads score/time-window; NO inert field now (ADR-0039 discipline).                                                                                                    | OPEN   |
| EXEC-20                  | rest BETWEEN schemas (inter-schema transition)                                | DEFERRED to the Phase-4 executor (D-V2-EXEC-DEFER-HOLD). "2 min between rounds" already = `schema.rest{between_rounds}`; the ":20 between ladders" remnant is a group-track transition (brushes D-2) — typed fresh against the executor. | OPEN   |
| FOLLOWUP-INTENSITY-RANGE | `IntensityFields` can't author `effortPercent` RANGE (`@80–85%`) — value-only | DEFER — PRE-EXISTING component limit (intensitySchema reused unchanged this wave; the ratified evil-corpus uses single-value `@85%`). A future intensity-authoring wave. QA-001's sibling finding QA-002.                                | OPEN   |
| FOLLOWUP-NUMERIC-PACE    | `IntensityFields` has NO `numericPace` input at all                           | DEFER — same: pre-existing, beyond primitive-v2 scope. The dimension is in `intensitySchema` + renders, but is unauthorable in-UI. QA-003.                                                                                               | OPEN   |

## Detail on the live ones

- **BASKET-C-2** — Phase-3 athlete work (1RM); out of primitive-v2.
- **EXEC-11 / EXEC-20** — the `D-EXEC-DEFER` boundary, upheld by D-V2-EXEC-DEFER-HOLD. Typed only against the real Phase-4 executor, never as an inert field now (the discipline that killed the `window` field via ADR-0039). All trace to `session-primitive/e2e-findings.md`.
- **FOLLOWUP-INTENSITY-RANGE / FOLLOWUP-NUMERIC-PACE** — surfaced by the reshape's QA pass (QA-002/003). The intensity reshape (D-V2-INTENSITY-TRINITY) carried the EXISTING `IntensityFields` to row+block+schema; it did NOT improve the component's authoring coverage. So these gaps pre-date primitive-v2 (they existed at the schema level) and are now wider (3 levels). Real product gaps — a coach can't type `@80–85%` or a numeric pace anywhere — but out of THIS wave's ratified scope. Address in a dedicated intensity-authoring wave when prioritized.

## Closed history

- **BASKET-C-19** (2026-06-17) — confirmed already-expressible via compound / per-set row-groups; no model change needed.
