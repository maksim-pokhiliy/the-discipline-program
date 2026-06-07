# compose-hardening — state (the board)

**Updated:** 2026-06-07

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; evidence → `audit-findings.md`. **Resume here** (the SessionStart hook force-loads it).

## Board

| #     | Step                                     | Status      | Pointer                                                                                   |
| ----- | ---------------------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| audit | 13-agent state-of-the-feature audit      | ✅ done     | `audit-findings.md`; Workflow `wf_fc0a986c-5ae`                                           |
| 0a    | Edit-mode (T0-1)                         | ✅ done     | D-EDIT + D-SCORING-RENDER ratified; merged #247                                           |
| 0b    | program/slot ontology + authoring (T0-2) | ✅ done     | merged #248 (`b949f0cf`); D-ONTOLOGY                                                      |
| 1     | Correctness (T1-1/2/3)                   | ✅ done     | T1-1+T1-3 shipped `feat/compose-tier1-correctness`; T1-2→ph.5                             |
| 2     | Read honesty + UX snag-list (T2-1..7)    | 🟦 cut 1 ✅ | T2-1/T2-2 read-honesty shipped `feat/compose-read-card-honesty`; T2-3..7 + QA-103 = cut 2 |
| 3     | Hygiene (T3-\*)                          | ⬜ pending  | plan §3                                                                                   |

## Next action

**Tier 2 read-honesty cut 1 (T2-1 + T2-2) is DONE** — shipped on `feat/compose-read-card-honesty` via `/feature small` (1 code + 1 test commit + close-out). The read card now tells the truth: scoring renders as a **dashed muted `InertScoringChip`** (present-but-inert until ph.5; tooltip "Planned — not scored automatically yet"); parallel folds its **interleave order** into the label (`parallel (round by round)` / `(track by track)` — live enum; the audit's `athlete_by_athlete` was stale); `scoring.condition.appliesToRounds` folds into the inert part (`· rounds 2, 3`); **superset rows are grouped** via per-row pair chips (mirroring the EMOM minute-pill). Architecture: `formatCompositionSummary` → `CompositionSummaryPart[] = {text, tone:"active"|"inert"}` (scoring = `inert`); `formatStructuralSummary` kept `string[]` so the header consumer is byte-identical. **Read-side only** — FROZEN contract + inert-guard untouched; zero api-server / db. Two open coach-POV visual forks surfaced once (AskUserQuestion + ASCII previews); owner ratified dashed-chip + per-row pair chips. Review-light **0 CRITICAL / 0 WARNING / 1 INFO** (benign scoring-only-header info-gain). check-types + lint clean; full platform suite **92 files / 1065 tests green** (+7). Disposes **T2-1 + T2-2**. **Next cut: Tier 2 cut 2 = owner snag-list (T2-3..7 + QA-103)** — its own `/feature` session — then Tier 3 (hygiene). Budget ≤1 `/feature`/session → each its own session.

## Open decisions awaiting ratification

- **D-MARKER** — `INNER_LADDER_MARKER` deprecate-vs-seed. Tied to ph.5.

_RATIFIED 2026-06-06: **D-EDIT**, **D-SCORING-RENDER**, **D-ONTOLOGY** (see `decisions.md`)._

## Live carry-forwards

Full catalog in `deferred.md`. **T0-1 + T0-2 CLOSED** (edit-mode + program-kind shipped). **T3-CT-1 CLOSED** (both zombie VOs deleted in 0b). **Tier 1 correctness: T1-1 + T1-3 CLOSED** (shipped `feat/compose-tier1-correctness`; T1-3 upgraded minor→major via seeded block-010, fixed by recursive read not a depth cap). **T1-2 still OPEN → ph.5** (edit-path closed; create-path condition strip + full pass-through owed at conditional-authoring). **Tier 2 read-honesty cut 1: T2-1 + T2-2 CLOSED** (shipped `feat/compose-read-card-honesty`; dashed inert scoring chip + interleave label + condition suffix + per-row superset pair chips). **T3-RD-2 note deepened** — the read formatter now returns structured `{text,tone}[]` (richer than authoring `axes-summary` `string`); the eventual dedup must reconcile a richer read core, not just merge the (still-shared) label maps. **T3-SEED-2 partially closed** (block-008 dup fixed → block-181; pre-existing block-047/098 dups still open). NEW from the 0b review/QA pass: **T3-SEED-1 deepened** (0b deleted the VOs `coverage-matrix.md` still documents in §17-19 + block-008 ref → escalates the rewrite), **QA(0b)-INFO** (property-test arbitrary doesn't gen programKind; `mapToSchema` hard-`parse` 500-on-corrupt class → relates T3-DB-1), **T3-RD-1** (header fallback for axis-only containers — 0b kept programKind out of the header, the holistic fallback for scoring/arrangement-only stays open). Still open from T0-1 Q/A: QA-103, REV-W2, QA-201, QA-302. Re-homed from `plan-editor-compose`: T3-CT-2 (QA-untilrec), T3-DB-2 (QA-108), T3-RD-2 (REVIEW-005), T3-MISC-1 (ADR-0023).

## Gotchas a resuming session must know

- **The model/contract is CLEAN — this is a finishing pass, not a rescue.** The audit re-confirmed zero drift. Do not re-litigate the algebra.
- **The composition contract is FROZEN** (`@repo/contracts/lms/composition`) — reuse, never edit; any change is a Gate-A escalation. **D-ONTOLOGY's thin `programKind` field is now IN** (shipped 0b, `feat/compose-program-kind`) — that was the one authorised addition. No further composition change is authorised; T3-CT-2 (`until_recovery`) remains an open Gate-A.
- **`scoring` stays present-but-inert until ph.5** — do NOT remove the inert-guard. T2-1 (read card: dashed `InertScoringChip`) + D-SCORING-RENDER (editor: static-disabled) shipped the _presentation_ honesty; execution stays ph.5. The read formatter renders `condition.appliesToRounds` as **stored config text**, never a computed score.
- **`plan-editor-compose` is concluded** — its docs keep the trail; live obligations re-homed here (carry-over map in `audit-findings.md`).
- **`file:line` citations came from agent reports**, spot-verified at close-out (journal 2026-06-05). They reflect 2026-06-05 code; re-verify before acting on any single one.
