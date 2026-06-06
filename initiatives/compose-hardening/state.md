# compose-hardening — state (the board)

**Updated:** 2026-06-06

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; evidence → `audit-findings.md`. **Resume here** (the SessionStart hook force-loads it).

## Board

| #     | Step                                     | Status     | Pointer                                         |
| ----- | ---------------------------------------- | ---------- | ----------------------------------------------- |
| audit | 13-agent state-of-the-feature audit      | ✅ done    | `audit-findings.md`; Workflow `wf_fc0a986c-5ae` |
| 0a    | Edit-mode (T0-1)                         | ✅ done    | D-EDIT + D-SCORING-RENDER ratified; PR pending  |
| 0b    | program/slot ontology + authoring (T0-2) | ⬜ pending | needs D-ONTOLOGY                                |
| 1     | Correctness (T1-1/2/3)                   | ⬜ pending | plan §1                                         |
| 2     | Read honesty + UX snag-list (T2-1..7)    | ⬜ pending | plan §2                                         |
| 3     | Hygiene (T3-\*)                          | ⬜ pending | plan §3                                         |

## Next action

**0a (T0-1 edit-mode) is DONE** — D-EDIT + D-SCORING-RENDER ratified at `/feature` Gate A and shipped on `feat/compose-edit-mode` (5 commits + this close-out; PR pending the owner getting the docs branch onto `origin/main` first so the feat PR diff stays clean). **Next cut: 0b (program/slot, T0-2) — ratify D-ONTOLOGY first.** Then Tier 1 (correctness), Tier 2 (read-honesty + owner snag-list), Tier 3 (hygiene). Budget ≤1 `/feature`/session → each its own session.

## Open decisions awaiting ratification

- **D-ONTOLOGY** — program/slot home (rowKind+VO vs 5th-axis vs nested). Gates 0b.
- **D-MARKER** — `INNER_LADDER_MARKER` deprecate-vs-seed. Tied to ph.5.

_RATIFIED 2026-06-06: **D-EDIT**, **D-SCORING-RENDER** (see `decisions.md`)._

## Live carry-forwards

Full catalog in `deferred.md`. **T0-1 CLOSED** (edit-mode shipped). Still load-bearing OPEN: **T0-2** (program/slot). Correctness: **T1-1** (arrangement-ref create-skip), **T1-2** (condition-drop — closed for the EDIT path by the scoring-verbatim invariant; the create-path strip stays open). NEW from the T0-1 review/QA pass (Tier 2/3): **QA-103** (edit arrangement validation parity), **REV-W2** (`isComposeEditable` read→`compose/lib` edge, sibling of T3-RD-3), **QA-201** (multi-PUT N>1 partial), **QA-302** (lazy-seed footgun). Re-homed from `plan-editor-compose`: T1-3 (QA-106), T3-CT-2 (QA-untilrec), T3-DB-2 (QA-108), T3-RD-2 (REVIEW-005), T3-SEED-1 (coverage-matrix), T3-MISC-1 (ADR-0023).

## Gotchas a resuming session must know

- **The model/contract is CLEAN — this is a finishing pass, not a rescue.** The audit re-confirmed zero drift. Do not re-litigate the algebra.
- **The composition contract is FROZEN** (`@repo/contracts/lms/composition`) — reuse, never edit; any change (T0-2 option (i), T3-CT-2) is a Gate-A escalation.
- **`scoring` stays present-but-inert until ph.5** — do NOT remove the inert-guard; T2-1 / D-SCORING-RENDER fixes _presentation_, not execution.
- **`plan-editor-compose` is concluded** — its docs keep the trail; live obligations re-homed here (carry-over map in `audit-findings.md`).
- **`file:line` citations came from agent reports**, spot-verified at close-out (journal 2026-06-05). They reflect 2026-06-05 code; re-verify before acting on any single one.
