# compose-hardening — state (the board)

**Updated:** 2026-06-07

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; evidence → `audit-findings.md`. **Resume here** (the SessionStart hook force-loads it).

## Board

| #     | Step                                     | Status     | Pointer                                                                                   |
| ----- | ---------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| audit | 13-agent state-of-the-feature audit      | ✅ done    | `audit-findings.md`; Workflow `wf_fc0a986c-5ae`                                           |
| 0a    | Edit-mode (T0-1)                         | ✅ done    | D-EDIT + D-SCORING-RENDER ratified; merged #247                                           |
| 0b    | program/slot ontology + authoring (T0-2) | ✅ done    | merged #248 (`b949f0cf`); D-ONTOLOGY                                                      |
| 1     | Correctness (T1-1/2/3)                   | ✅ done    | T1-1+T1-3 shipped `feat/compose-tier1-correctness`; T1-2→ph.5                             |
| 2     | Read honesty + UX snag-list (T2-1..7)    | ✅ done    | cut 1 `feat/compose-read-card-honesty` + cut 2 `feat/compose-tier2-cut2`; spawned T3-CT-5 |
| 3     | Hygiene (T3-\*)                          | ⬜ pending | plan §3                                                                                   |

## Next action

**Tier 2 cut 2 (owner snag-list T2-3..7 + QA-103) is DONE** — shipped on `feat/compose-tier2-cut2` via `/feature` (full), after a planner-recon pass that verify-then-spec'd the 2026-06-05 audit on live code. **Three citations shifted in meaning:** T2-4's ladder-collision reject is _server-only_ (no client check at all, opaque 400), not a client `safeParse`; QA-103 is a real _create/edit asymmetry_ (edit could persist a self-paired track create rejects), not just an opaque 400; T2-7 routing is _moot_ — per-schema "Edit axes" already exists, so it's a re-label. Owner ratified **scope=Full + T2-6=build** via one `AskUserQuestion` (ASCII previews). **Shipped:** T2-3 EMOM `MIN n` pill on the authoring canvas (shared `MinutePill`, DIRECT-rows-only, `deriveMinuteView` guarded vs non-positive rounds); T2-4 inline ladder×inner-marker mutex (keys the DRAFT `rowKind`, catches uncommitted markers); T2-5 contract-mirrored inline axis-field validation (errors from the FROZEN `repetitionAxisSchema`/`restSpecFormSchema` `safeParse`, surface-only with the persist `safeParse` as backstop; the 3 safety-probe describes INVERTED); **T2-6 demote-to-row BUILT** (`demoteContainerInProgram` unwrap + `demoteNode` Option-2 wiring, create-mode-gated, re-selects child — **D-DEMOTE**); T2-7 block-meta modal re-labeled "Block intensity & cap"; **QA-103 edit-arrangement inline parity** (new `arrangement-invalid` diff variant → the existing issues Alert — **D-ARR-EDIT-VALID**). Review **A / 0-CRITICAL**, QA **0-CRITICAL**; one QA WARNING (`MIN NaN` on rounds=0) fixed in-pipeline. check-types + lint + `dep:check` clean; full platform suite **1084 tests green**. Disposes **T2-3..7 + QA-103**; spawns **T3-CT-5** (server self-pair gap, Gate-A, OPEN). **Next: Tier 3 (hygiene)** — its own session. Budget ≤1 `/feature`/session.

## Open decisions awaiting ratification

- **D-MARKER** — `INNER_LADDER_MARKER` deprecate-vs-seed. Tied to ph.5.

_RATIFIED 2026-06-06: **D-EDIT**, **D-SCORING-RENDER**, **D-ONTOLOGY**. RATIFIED 2026-06-07: **D-DEMOTE** (demote-to-row affordance), **D-ARR-EDIT-VALID** (QA-103 edit-arrangement parity) — see `decisions.md`._

## Live carry-forwards

Full catalog in `deferred.md`. **T0-1 + T0-2 CLOSED** (edit-mode + program-kind shipped). **T3-CT-1 CLOSED** (both zombie VOs deleted in 0b). **Tier 1 correctness: T1-1 + T1-3 CLOSED** (shipped `feat/compose-tier1-correctness`; T1-3 upgraded minor→major via seeded block-010, fixed by recursive read not a depth cap). **T1-2 still OPEN → ph.5** (edit-path closed; create-path condition strip + full pass-through owed at conditional-authoring). **Tier 2 read-honesty cut 1: T2-1 + T2-2 CLOSED** (shipped `feat/compose-read-card-honesty`; dashed inert scoring chip + interleave label + condition suffix + per-row superset pair chips). **Tier 2 cut 2: T2-3..7 + QA-103 CLOSED** (shipped `feat/compose-tier2-cut2` via `/feature` full; T2-6 demote BUILT, T2-7 re-labeled, QA-103 edit-arrangement inline parity; one QA `MIN NaN` WARNING fixed in-pipeline) → **NEW T3-CT-5** (server self-pair gap: `parallelTrackSchema` lacks the sibling-track check; Gate-A, OPEN). **T3-RD-2 note deepened** — the read formatter now returns structured `{text,tone}[]` (richer than authoring `axes-summary` `string`); the eventual dedup must reconcile a richer read core, not just merge the (still-shared) label maps. **T3-SEED-2 partially closed** (block-008 dup fixed → block-181; pre-existing block-047/098 dups still open). NEW from the 0b review/QA pass: **T3-SEED-1 deepened** (0b deleted the VOs `coverage-matrix.md` still documents in §17-19 + block-008 ref → escalates the rewrite), **QA(0b)-INFO** (property-test arbitrary doesn't gen programKind; `mapToSchema` hard-`parse` 500-on-corrupt class → relates T3-DB-1), **T3-RD-1** (header fallback for axis-only containers — 0b kept programKind out of the header, the holistic fallback for scoring/arrangement-only stays open). Still open from T0-1 Q/A: REV-W2, QA-201, QA-302 (QA-103 CLOSED in cut 2). Re-homed from `plan-editor-compose`: T3-CT-2 (QA-untilrec), T3-DB-2 (QA-108), T3-RD-2 (REVIEW-005), T3-MISC-1 (ADR-0023).

## Gotchas a resuming session must know

- **The model/contract is CLEAN — this is a finishing pass, not a rescue.** The audit re-confirmed zero drift. Do not re-litigate the algebra.
- **The composition contract is FROZEN** (`@repo/contracts/lms/composition`) — reuse, never edit; any change is a Gate-A escalation. **D-ONTOLOGY's thin `programKind` field is now IN** (shipped 0b, `feat/compose-program-kind`) — that was the one authorised addition. No further composition change is authorised; T3-CT-2 (`until_recovery`) and T3-CT-5 (server self-pair check) remain open Gate-As.
- **`scoring` stays present-but-inert until ph.5** — do NOT remove the inert-guard. T2-1 (read card: dashed `InertScoringChip`) + D-SCORING-RENDER (editor: static-disabled) shipped the _presentation_ honesty; execution stays ph.5. The read formatter renders `condition.appliesToRounds` as **stored config text**, never a computed score.
- **`plan-editor-compose` is concluded** — its docs keep the trail; live obligations re-homed here (carry-over map in `audit-findings.md`).
- **`file:line` citations came from agent reports**, spot-verified at close-out (journal 2026-06-05). They reflect 2026-06-05 code; re-verify before acting on any single one.
