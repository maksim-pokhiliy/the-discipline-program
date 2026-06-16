# session-primitive — timed-test (e2e self-test) findings

**Captured:** 2026-06-16, owner timed-test (Phase 2 Exit + Phase 1 e2e self-test) — building the `e2e-evil-corpus.md` schemas by hand in the live plan editor (`localhost:3001`, coach Denys).

This is the Phase-1 e2e gate doing its job: hand-building the evil corpus surfaced real **expressiveness gaps in the (nominally frozen) primitive**, alongside UI papercuts and deferred limits. 20 findings, triaged into 4 baskets.

## Verdict (load-bearing)

The primitive is **NOT fully expressive** — basket B is a set of model extensions. Phase 1 ("the coach can author ANYTHING, zero model gap") is therefore **NOT formally closed**; basket B is effectively a **primitive-v2 design wave** (un-freeze → extend → re-freeze), NOT a fix batch — each item is Prisma + contracts + mappers + spec + ratification (+ `db:reset`). Baskets A (UI papercuts) and C (deferred limits) proceed independently and don't touch the model.

## Basket A — UI papercuts (hotfix; fix straight away, no model change)

| #   | Finding                                                                                              | Surface                      |
| --- | ---------------------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | row-group order number renders in a ~5.8px element vs ~24px on a non-grouped row → column misaligned | plan-detail row-group render |
| 5   | day / session / block labels should render UPPERCASE                                                 | label chip render            |
| 7   | creating a day label gives no way to set the REST flag                                               | label create form (D-10)     |
| 8   | label picker (day/session/block) shows no options until the input is focused — should show on open   | `CreatablePicker` (D-10)     |
| 9   | time-cap schema with range 5-10 min renders the chip as "cap 5'" (drops the range)                   | schema-type chip render      |
| 10  | a row inside an EMOM shows a "MIN X" chip; a row-GROUP inside an EMOM is missing it (should have it) | plan-detail render           |
| 14  | "Push Press 4×6 60% of Push Jerk 1RM" should render "@60% of …" (missing the @)                      | row summary render           |
| 15  | remove the icon + the word "group" from a SCHEMA-group head (as already done for row-groups)         | schema-group-box-head        |
| 18  | "add schema to group" should open the modal like normal add-schema (flow consistency)                | schema-group add flow        |

## Basket B — primitive model extensions (NOT a fix; primitive-v2 design wave)

Each needs Prisma + contracts + mappers + spec + ratification (+ `db:reset`). Do NOT patch ad-hoc — they reshape the frozen model.

| #   | Gap                                                      | Owner words / shape                                                                                            |
| --- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 3   | **rest + RPE at the ROW level**                          | "5×5 @75% · tempo 3-1-X-0 · rest 2–3 min · RPE 8" — rest & RPE not addable on a row                            |
| 4   | **time cap for ANY schema** (today it's a separate type) | "METCON 21-15-9 FOR TIME (12 min cap)" — can't cap a ladder; cap should be an attribute of any schema          |
| 6   | **non-integer / sub-minute interval values**             | "Tabata 8×:20 on/:10 off" → `Expected integer, received float` — intervals aren't always whole minutes         |
| 11  | **schema-level score + time-windowed modifiers**         | "AMRAP 15 · score = rounds+reps, last 3 min @90%+ effort" — inexpressible at the schema level                  |
| 12  | **a ROW that is a duration/effort interval, not reps**   | "Row 2:00 @ Zone 2" — inexpressible on a row (ties to deferred **P-6 reps-unit**)                              |
| 16  | **effort at the BLOCK level**                            | "5 rounds, partners alternate · @85% effort" — block-level effort inexpressible                                |
| 20  | **rest BETWEEN schemas** (inter-schema rest carrier)     | "Rest 2 min between rounds AND :20 between the two ladders" — no rest between schema siblings                  |
| 17  | **NESTED profiles** (RX/SC × ♂/♀)                      | combining works in the model but renders garbled: "RX (M):9 / RX (F):6 / SC (M):6 / SC (F):4"; no true nesting |

## Basket C — deferred limits (record, don't build now)

| #   | Limit                                                                  | Disposition                                                                                                                     |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 2   | "build to a heavy single (1RM)" — domain-inexpressible                 | **DEFER to Phase 3 (athlete 1RM).** Owner: don't lose it. Stopgap used: back-squat + a "build to a heavy single (1RM)" modifier |
| 19  | "Core (each round a different movement)" — per-round movement rotation | semantics gap; stuffed into the schema title as a stopgap. Fold into the basket-B primitive-v2 design (per-round variation)     |

## Open help thread (not a code change yet)

| #   | Item                                                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13  | Clean Complex (1 Clean + 2 Front Squat + 1 Push Jerk ×5, touch-and-go from floor; then Push Press 4×6 @60% jerk) — owner stalled on how to model it. Needs a how-to-express answer (likely a compound/row-group — but "complex as one repeatable unit" may itself be a basket-B gap). Resolve against the live model, don't guess. |

## Next

- **Basket A** → a `fix/` branch (UI only), straight away.
- **Basket B** → a primitive-v2 design wave (its own charter/Gate-A; this is the Phase-1 re-open). Likely several model changes batched by floor (row: rest/RPE/duration; block: effort; schema: cap/score; cross: inter-schema rest, nested profiles, sub-minute intervals).
- **Basket C** → stays here, deferred.
- **#13** → resolve in-thread, then route to A (if expressible today) or B (if it's a real gap).
