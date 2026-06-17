# primitive-v2 — plan

Phased by FLOOR (each axis is a model change; batch where they share a migration). Each code step ships via `/feature` (full/small by scope; ≤1 full per session). UI-first where it has UI. **Design-first:** the planner session (step 0) locks scope + the sacred-touching calls WITH the owner before any `/feature`.

| #   | Step                                                       | Gap(s)  | Gate / note                                                                                                                                                        |
| --- | ---------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0   | **Design lock** (planner session)                          | all     | Owner ratifies the in-scope set, the executor-defer calls (#11/#20), and the sacred-touch (#4 cap placement). `decisions.md` seeded with the superseding re-opens. |
| 1   | **Row axes** — rest + RPE/intensity at row level           | #3, #12 | re-open `D-FLOORS` row-intensity + ONE-rest-per-schema; `reps.unit` already covers duration (#12 ≈ Zone 2 only)                                                    |
| 2   | **Block axis** — effort/intensity at block level           | #16     | re-open `D-FLOORS` block-intensity (pairs with #3 — same reversal)                                                                                                 |
| 3   | **Schema cap** — time cap on any schema                    | #4      | **SACRED-TOUCH** — owner-gated design; cap as an optional cross-cutting attribute vs a repetition kind                                                             |
| 4   | **Cross-cutting** — sub-minute intervals + nested profiles | #6, #17 | extend the `interval` unit + `load.byProfile` nesting (independent typed extensions)                                                                               |
| —   | **Executor-gated** (#11 score, #20 inter-schema rest)      | —       | DEFER to the Phase-4 executor unless the owner pulls one in at step 0                                                                                              |
| —   | **Re-freeze** `primitive-spec.md` + gated acceptance       | all     | spec updated, editor round-trips, gated suite green on reseed                                                                                                      |

**Sequencing rationale.** row → block → schema → cross-cutting mirrors the floors. The intensity re-opens (#3 row, #16 block) share the single `D-FLOORS` reversal, so they pair. #4 (schema cap) is isolated + riskiest (sacred-adjacent), done deliberately on its own. #6/#17 are independent typed extensions with no re-open.

Open design details deferred to step 0 (so they aren't silently decided early): whether row-rest is ONE-per-row or a list; whether intensity is one inheritable axis across row/schema/block or three independent ones; cap placement (#4) cross-cutting vs kind; interval unit shape (#6); byProfile nesting shape (#17); the in/out call on #11/#20.
