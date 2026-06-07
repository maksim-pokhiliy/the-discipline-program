# compose-hardening — state (the board)

**Updated:** 2026-06-07

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; evidence → `audit-findings.md`. **Resume here** (the SessionStart hook force-loads it).

## Board

| #     | Step                                     | Status     | Pointer                                         |
| ----- | ---------------------------------------- | ---------- | ----------------------------------------------- |
| audit | 13-agent state-of-the-feature audit      | ✅ done    | `audit-findings.md`; Workflow `wf_fc0a986c-5ae` |
| 0a    | Edit-mode (T0-1)                         | ✅ done    | D-EDIT + D-SCORING-RENDER ratified; merged #247 |
| 0b    | program/slot ontology + authoring (T0-2) | ✅ done    | merged #248 (`b949f0cf`); D-ONTOLOGY            |
| 1     | Correctness (T1-1/2/3)                   | 🔄 active  | T1-1 + T1-3 this session; plan §1               |
| 2     | Read honesty + UX snag-list (T2-1..7)    | ⬜ pending | plan §2                                         |
| 3     | Hygiene (T3-\*)                          | ⬜ pending | plan §3                                         |

## Next action

**0b (T0-2 program/slot) is DONE** — D-ONTOLOGY implemented + shipped on `feat/compose-program-kind` (7 feature commits, `/feature` full pipeline). The coach's four-projection ruling executed: stages = sibling EXERCISE rows (already authorable), classification = a thin `programKind` field on `composition` (the one authorised Gate-A contract change, now in), both fat VOs (`stagedProgram` + `slotSpec`) DELETED, EMOM stays nested-window. Selector + card badge + create/edit round-trip (the keystone: programKind from the edited draft, not `original`); seed re-authored (block-163 wave un-flattened to 3 stage-rows, block-164 cluster `rounds(5)`, block-008 drop_set + dup-fix→block-181). Review A / QA B, 0 CRITICAL; QA-001 (root silent-drop) + QA-002 (header leak) fixed in-pipeline. Disposes **T0-2 + T3-CT-1**. **Merged to main — PR #248 (squash `b949f0cf`).** **Current cut: Tier 1 (correctness)** — T1-1 (arrangement-ref create-skip) + T1-3 (depth-2 projector) via `/feature small` this session; **T1-2 ph.5-gated → deferred** (no create-path condition-authoring until ph.5). Then Tier 2 (read-honesty + owner snag-list), Tier 3 (hygiene). Budget ≤1 `/feature`/session → each its own session.

## Open decisions awaiting ratification

- **D-MARKER** — `INNER_LADDER_MARKER` deprecate-vs-seed. Tied to ph.5.

_RATIFIED 2026-06-06: **D-EDIT**, **D-SCORING-RENDER**, **D-ONTOLOGY** (see `decisions.md`)._

## Live carry-forwards

Full catalog in `deferred.md`. **T0-1 + T0-2 CLOSED** (edit-mode + program-kind shipped). **T3-CT-1 CLOSED** (both zombie VOs deleted in 0b). **T3-SEED-2 partially closed** (block-008 dup fixed → block-181; pre-existing block-047/098 dups still open). Correctness (Tier 1, next): **T1-1** (arrangement-ref create-skip), **T1-2** (condition-drop — closed for the EDIT path; create-path strip stays open), **T1-3** (depth-2 projector). NEW from the 0b review/QA pass: **T3-SEED-1 deepened** (0b deleted the VOs `coverage-matrix.md` still documents in §17-19 + block-008 ref → escalates the rewrite), **QA(0b)-INFO** (property-test arbitrary doesn't gen programKind; `mapToSchema` hard-`parse` 500-on-corrupt class → relates T3-DB-1), **T3-RD-1** (header fallback for axis-only containers — 0b kept programKind out of the header, the holistic fallback for scoring/arrangement-only stays open). Still open from T0-1 Q/A: QA-103, REV-W2, QA-201, QA-302. Re-homed from `plan-editor-compose`: T3-CT-2 (QA-untilrec), T3-DB-2 (QA-108), T3-RD-2 (REVIEW-005), T3-MISC-1 (ADR-0023).

## Gotchas a resuming session must know

- **The model/contract is CLEAN — this is a finishing pass, not a rescue.** The audit re-confirmed zero drift. Do not re-litigate the algebra.
- **The composition contract is FROZEN** (`@repo/contracts/lms/composition`) — reuse, never edit; any change is a Gate-A escalation. **D-ONTOLOGY's thin `programKind` field is now IN** (shipped 0b, `feat/compose-program-kind`) — that was the one authorised addition. No further composition change is authorised; T3-CT-2 (`until_recovery`) remains an open Gate-A.
- **`scoring` stays present-but-inert until ph.5** — do NOT remove the inert-guard; T2-1 / D-SCORING-RENDER fixes _presentation_, not execution.
- **`plan-editor-compose` is concluded** — its docs keep the trail; live obligations re-homed here (carry-over map in `audit-findings.md`).
- **`file:line` citations came from agent reports**, spot-verified at close-out (journal 2026-06-05). They reflect 2026-06-05 code; re-verify before acting on any single one.
