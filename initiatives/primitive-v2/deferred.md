# primitive-v2 — deferred

Carry-forwards: findings/obligations not yet scheduled, with disposition + status. **Promote here at every gate.**

**Status:** `OPEN` (live) · `SCHEDULED` (assigned to a step) · `CLOSED` (done) · `DROPPED` (decided not to).

| ID          | One-liner                                                   | Disposition                                                                                                                             | Status |
| ----------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| BASKET-C-2  | "build to a heavy single (1RM)" is domain-inexpressible     | DEFER to Phase 3 (athlete 1RM). Owner: don't lose it. Stopgap in use: back-squat + a "build to a heavy single" modifier                 | OPEN   |
| BASKET-C-19 | "Core (each round a different movement)" per-round rotation | Fold into the primitive-v2 design ONLY if cheap; else DEFER. Stopgap: stuffed into the schema title                                     | OPEN   |
| EXEC-11     | score / time-windowed effort on a schema                    | EXECUTOR-GATED (`D-EXEC-DEFER`) — owner decides in/out at design step 0; default DEFER to the Phase-4 executor                          | OPEN   |
| EXEC-20     | rest BETWEEN schemas (inter-schema transition)              | EXECUTOR-GATED (`D-EXEC-DEFER` ≈ "straight into") — owner decides at step 0; may pull in IF it's a rest-carrier, not a scoring semantic | OPEN   |

## Detail on the live ones

All four trace to `session-primitive/e2e-findings.md` (the timed-test findings). **Basket C** is out of primitive-v2 (Phase-3 athlete work, or a cheap fold). **EXEC-11 / EXEC-20** sit on the `D-EXEC-DEFER` boundary: typed only against the real Phase-4 executor, never as an inert field now (the discipline that killed the `window` field via ADR-0039). The owner makes the in/out call at the design-lock step; #20 is the more likely pull-in (a rest carrier between schemas is arguably model, not execution — but the "straight into / no pause" reading is execution, so it needs the owner's framing).

## Closed history

_(none yet)_
