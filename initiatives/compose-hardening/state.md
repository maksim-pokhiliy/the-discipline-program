# compose-hardening — state (the board)

**Updated:** 2026-06-05

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; evidence → `audit-findings.md`. **Resume here** (the SessionStart hook force-loads it).

## Board

| #     | Step                                     | Status     | Pointer                                         |
| ----- | ---------------------------------------- | ---------- | ----------------------------------------------- |
| audit | 13-agent state-of-the-feature audit      | ✅ done    | `audit-findings.md`; Workflow `wf_fc0a986c-5ae` |
| 0a    | Edit-mode (T0-1)                         | ⬜ pending | needs D-EDIT                                    |
| 0b    | program/slot ontology + authoring (T0-2) | ⬜ pending | needs D-ONTOLOGY                                |
| 1     | Correctness (T1-1/2/3)                   | ⬜ pending | plan §1                                         |
| 2     | Read honesty + UX snag-list (T2-1..7)    | ⬜ pending | plan §2                                         |
| 3     | Hygiene (T3-\*)                          | ⬜ pending | plan §3                                         |

## Next action

**Ratify the two Tier-0 OPEN decisions, then pick the first cut** (owner: "зафиксируешь — решим что дальше"). Ratify **D-EDIT** (edit-mode shape) and **D-ONTOLOGY** (program/slot home) — both gate Tier 0. Recommended first cut: **T0-1 edit-mode** — highest coach-daily-UX ROI, unblocks everything, and UX-polish is premature without it. Then T0-2. **Do NOT launch `/feature` until D-EDIT / D-ONTOLOGY are ratified** (executing past an OPEN decision = the anti-pattern this system guards against).

## Open decisions awaiting ratification

- **D-EDIT** — edit-mode shape (inverse adapter + edit drawer + save-via-update). Gates 0a.
- **D-ONTOLOGY** — program/slot home (rowKind+VO vs 5th-axis vs nested). Gates 0b.
- **D-SCORING-RENDER** — inert scoring presentation (hide-in-editor vs read-only draft-badge). Gates the scoring part of step 2.
- **D-MARKER** — `INNER_LADDER_MARKER` deprecate-vs-seed. Tied to ph.5.

## Live carry-forwards

All OPEN — full catalog in `deferred.md`. Headline: **T0-1** (create-only) + **T0-2** (program/slot) are load-bearing. NEW correctness finds worth early eyes: **T1-1** (arrangement-ref create-skip), **T1-2** (condition-drop). Re-homed from `plan-editor-compose`: T0-2 (DEFER-001), T1-3 (QA-106), T3-CT-2 (QA-untilrec), T3-DB-2 (QA-108), T3-RD-2 (REVIEW-005), T3-SEED-1 (coverage-matrix), T3-MISC-1 (ADR-0023).

## Gotchas a resuming session must know

- **The model/contract is CLEAN — this is a finishing pass, not a rescue.** The audit re-confirmed zero drift. Do not re-litigate the algebra.
- **The composition contract is FROZEN** (`@repo/contracts/lms/composition`) — reuse, never edit; any change (T0-2 option (i), T3-CT-2) is a Gate-A escalation.
- **`scoring` stays present-but-inert until ph.5** — do NOT remove the inert-guard; T2-1 / D-SCORING-RENDER fixes _presentation_, not execution.
- **`plan-editor-compose` is concluded** — its docs keep the trail; live obligations re-homed here (carry-over map in `audit-findings.md`).
- **`file:line` citations came from agent reports**, spot-verified at close-out (journal 2026-06-05). They reflect 2026-06-05 code; re-verify before acting on any single one.
