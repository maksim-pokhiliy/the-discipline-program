# compose-hardening — state (the board)

**Updated:** 2026-06-07

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; evidence → `audit-findings.md`. **Resume here** (the SessionStart hook force-loads it).

## Board

| #     | Step                                     | Status  | Pointer                                                                                                |
| ----- | ---------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------ |
| audit | 13-agent state-of-the-feature audit      | ✅ done | `audit-findings.md`; Workflow `wf_fc0a986c-5ae`                                                        |
| 0a    | Edit-mode (T0-1)                         | ✅ done | D-EDIT + D-SCORING-RENDER ratified; merged #247                                                        |
| 0b    | program/slot ontology + authoring (T0-2) | ✅ done | merged #248 (`b949f0cf`); D-ONTOLOGY                                                                   |
| 1     | Correctness (T1-1/2/3)                   | ✅ done | T1-1+T1-3 shipped `feat/compose-tier1-correctness`; T1-2→ph.5                                          |
| 2     | Read honesty + UX snag-list (T2-1..7)    | ✅ done | cut 1 `feat/compose-read-card-honesty` + cut 2 `feat/compose-tier2-cut2`; spawned T3-CT-5              |
| 3     | Hygiene (T3-\*)                          | 🔄 wip  | Cut A read-boundary shipped `fix/compose-tier3-read-boundary`; Cut B (seed/doc + T3-CT-5) + close next |

## Next action

**Tier 3 (hygiene) — IN PROGRESS.** A planner-recon pass verify-then-spec'd the 2026-06-05 Tier-3 catalog on live code; **several citations shifted** (see `decisions.md` **D-CT-TIER3** + `deferred.md`). Headlines: **T3-CT-5 is NOT a contract Gate-A** — the self-pair check needs api-server tree-context (`current.subSchemas` rows), and `parallelTrackSchema` (pure composition) can't express it → it's an api-server fix (Cut B), the catalog mis-homed it; **T3-RD-1 aged out** — `buildStructuralParts` now renders scoring-/arrangement-only → MOOT; **T3-CT-4** ratified _folded-into-count_ (draft already carries `count:{min,max}`; contract `range` kind is a 0-instance near-duplicate); **T3-CT-2** dropped (frozen-contract pin that doesn't even fix the real footgun — `restLabel` drops the qualifier); **T3-CT-3** dropped (byte-identical refactor). Owner ratified all four via one `AskUserQuestion` (**D-CT-TIER3**). **Cut A SHIPPED** (`fix/compose-tier3-read-boundary`): `deriveMinuteView` + `isComposeEditable` relocated out of authoring `compose/` into `plan-detail/lib/` — read-side logic-leak closed, only the intentional `ComposeEditorDrawer` mounts remain → **T3-RD-3 + REV-W2 CLOSED**, T3-RD-1 DROPPED. check-types + lint + `dep:check` clean; platform **1084 tests green**. **Next: Cut B** — api-server seed/doc hygiene (T3-SEED-1 coverage-matrix = charter acceptance, T3-SEED-2/3/4, T3-API-1 SCAN_ROOTS, T3-MISC-1 ADR, T3-ARCH-1 light) **+ T3-CT-5** self-pair fix (needs the gated api-server suite) **+ `/initiative-close`** → closes the initiative. Budget ≤1 cut/session.

## Open decisions awaiting ratification

- **D-MARKER** — `INNER_LADDER_MARKER` deprecate-vs-seed. Tied to ph.5.

_RATIFIED 2026-06-06: **D-EDIT**, **D-SCORING-RENDER**, **D-ONTOLOGY**. RATIFIED 2026-06-07: **D-DEMOTE** (demote-to-row affordance), **D-ARR-EDIT-VALID** (QA-103 edit-arrangement parity), **D-CT-TIER3** (Tier-3 contract dispositions: CT-2 drop · CT-4 fold · CT-5→api-server · CT-3 drop) — see `decisions.md`._

## Live carry-forwards

Full catalog in `deferred.md`. **T0-1 + T0-2 CLOSED** (edit-mode + program-kind shipped). **T3-CT-1 CLOSED** (both zombie VOs deleted in 0b). **Tier 1 correctness: T1-1 + T1-3 CLOSED** (shipped `feat/compose-tier1-correctness`; T1-3 upgraded minor→major via seeded block-010, fixed by recursive read not a depth cap). **T1-2 still OPEN → ph.5** (edit-path closed; create-path condition strip + full pass-through owed at conditional-authoring). **Tier 2 read-honesty cut 1: T2-1 + T2-2 CLOSED** (shipped `feat/compose-read-card-honesty`; dashed inert scoring chip + interleave label + condition suffix + per-row superset pair chips). **Tier 2 cut 2: T2-3..7 + QA-103 CLOSED** (shipped `feat/compose-tier2-cut2` via `/feature` full; T2-6 demote BUILT, T2-7 re-labeled, QA-103 edit-arrangement inline parity; one QA `MIN NaN` WARNING fixed in-pipeline) → **NEW T3-CT-5** (server self-pair gap: `parallelTrackSchema` lacks the sibling-track check; Gate-A, OPEN). **T3-RD-2 note deepened** — the read formatter now returns structured `{text,tone}[]` (richer than authoring `axes-summary` `string`); the eventual dedup must reconcile a richer read core, not just merge the (still-shared) label maps. **T3-SEED-2 partially closed** (block-008 dup fixed → block-181; pre-existing block-047/098 dups still open). NEW from the 0b review/QA pass: **T3-SEED-1 deepened** (0b deleted the VOs `coverage-matrix.md` still documents in §17-19 + block-008 ref → escalates the rewrite), **QA(0b)-INFO** (property-test arbitrary doesn't gen programKind; `mapToSchema` hard-`parse` 500-on-corrupt class → relates T3-DB-1), **T3-RD-1** (header fallback for axis-only containers — 0b kept programKind out of the header, the holistic fallback for scoring/arrangement-only stays open). Still open from T0-1 Q/A: QA-201, QA-302 (QA-103 CLOSED in cut 2). Re-homed from `plan-editor-compose`: T3-CT-2 (QA-untilrec), T3-DB-2 (QA-108), T3-RD-2 (REVIEW-005), T3-MISC-1 (ADR-0023). **Tier 3 recon supersedes the above (2026-06-07, D-CT-TIER3):** Cut A CLOSED **T3-RD-3 + REV-W2** (read-boundary relocation) and DROPPED **T3-RD-1** (aged out); **T3-CT-2 + T3-CT-3 DROPPED**, **T3-CT-4** folded-into-count, **T3-CT-5** reclassified to an api-server fix (Cut B). DEFERRED past close as known debt: **T3-RD-2, T3-DB-2, T3-API-2, QA-201**; **QA-302 + T3-DB-1 DROPPED**. Remaining for Cut B: **T3-SEED-1/2/3/4, T3-API-1, T3-MISC-1, T3-ARCH-1 (light), T3-CT-5**. `T3-SEED-5` stays tied to D-MARKER/ph.5.

## Gotchas a resuming session must know

- **The model/contract is CLEAN — this is a finishing pass, not a rescue.** The audit re-confirmed zero drift. Do not re-litigate the algebra.
- **The composition contract is FROZEN** (`@repo/contracts/lms/composition`) — reuse, never edit; any change is a Gate-A escalation. **D-ONTOLOGY's thin `programKind` field is now IN** (shipped 0b, `feat/compose-program-kind`) — that was the one authorised addition. After the D-CT-TIER3 recon, **no open composition Gate-A remains**: T3-CT-2 (`until_recovery` pin) is DROPPED, and T3-CT-5 (server self-pair) was re-verified as an **api-server** fix (needs tree-context), NOT a `parallelTrackSchema` change. So no further composition-contract change is on the table for this initiative.
- **`scoring` stays present-but-inert until ph.5** — do NOT remove the inert-guard. T2-1 (read card: dashed `InertScoringChip`) + D-SCORING-RENDER (editor: static-disabled) shipped the _presentation_ honesty; execution stays ph.5. The read formatter renders `condition.appliesToRounds` as **stored config text**, never a computed score.
- **`plan-editor-compose` is concluded** — its docs keep the trail; live obligations re-homed here (carry-over map in `audit-findings.md`).
- **`file:line` citations came from agent reports**, spot-verified at close-out (journal 2026-06-05). They reflect 2026-06-05 code; re-verify before acting on any single one.
