# compose-hardening — state (the board)

**Updated:** 2026-06-07 · **🏁 CLOSED**

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; evidence → `audit-findings.md`.

## 🏁 INITIATIVE CLOSED (2026-06-07)

Compose-authoring is **complete** — a coach can build AND iterate any real plan end-to-end (charter goal met). All tiers shipped: audit → 0a edit-mode → 0b program/slot ontology → Tier 1 correctness → Tier 2 read-honesty + UX → Tier 3 hygiene (Cut A + Cut B). `initiatives/ACTIVE` is cleared (no active initiative); **ph.5 (scoring execution) is the future initiative** that inherits the carry-forwards below.

## Board

| #     | Step                                     | Status  | Pointer                                                                   |
| ----- | ---------------------------------------- | ------- | ------------------------------------------------------------------------- |
| audit | 13-agent state-of-the-feature audit      | ✅ done | `audit-findings.md`; Workflow `wf_fc0a986c-5ae`                           |
| 0a    | Edit-mode (T0-1)                         | ✅ done | D-EDIT + D-SCORING-RENDER; merged #247                                    |
| 0b    | program/slot ontology + authoring (T0-2) | ✅ done | merged #248 (`b949f0cf`); D-ONTOLOGY                                      |
| 1     | Correctness (T1-1/2/3)                   | ✅ done | T1-1+T1-3 shipped #249; T1-2 → ph.5                                       |
| 2     | Read honesty + UX snag-list (T2-1..7)    | ✅ done | cut 1 #250 + cut 2 #251                                                   |
| 3     | Hygiene (T3-\*)                          | ✅ done | Cut A #252 + Cut B `fix/compose-tier3-cut-b` (seed/doc + T3-CT-5 + close) |

## Carried to ph.5 (the scoring-execution initiative)

- **T1-2** — create-path `condition` strip + full pass-through (edit-path already closed; owed at conditional-scoring authoring).
- **D-MARKER** (OPEN) + **T3-SEED-5** — `INNER_LADDER_MARKER` deprecate-vs-seed (+ a full Gauntlet Block C if seeded).
- **`scoring` execution / conditional-scoring evaluation** — the inert axis stays present-but-inert; ph.5 owns the engine.

## Deferred as known debt (not ph.5-blocking)

In `deferred.md`: T3-RD-2 (formatter dedup), T3-DB-2 (DB ladder enforcement), T3-API-2 (reorder atomicity), QA-201 (multi-PUT rollback), **T3-SEED-6** (~8 pre-existing phantom matrix anchor refs in un-rewritten tables), **T3-SEED-7** (block-020 order gap — cosmetic).

## Gotchas a future (ph.5) session must know

- **The model/contract was CLEAN throughout — this was a finishing initiative, not a rescue.** Don't re-litigate the algebra.
- **The composition contract is FROZEN** (`@repo/contracts/lms/composition`). D-ONTOLOGY's thin `programKind` was the one authorised addition (shipped 0b). After the D-CT-TIER3 recon, **no composition Gate-A was left open** — T3-CT-5 was an api-server fix (needs tree-context), not a `parallelTrackSchema` change.
- **`scoring` stays present-but-inert until ph.5** — the inert-guard (`scoring-axis-is-inert.test.ts`) + the read card's dashed `InertScoringChip` + the editor's static-disabled scoring field all assume no execution. ph.5 flips this; do NOT remove the inert-guard before then.
- **`file:line` citations age** — the Tier-3 recon (2026-06-07) found several 2026-06-05 citations had shifted in meaning, and Cut B's research-light found a systemic seed-path drift. Always re-verify before acting on a single one.
