# session-primitive — state (the board)

**Updated:** 2026-06-11 (W2 merged + stage-accepted)

Resume here (SessionStart hook force-loads this). Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; the design itself → `primitive-spec.md`.

## Board

| #   | Wave                                                   | Status              | Pointer                         |
| --- | ------------------------------------------------------ | ------------------- | ------------------------------- |
| 0   | Founding: review → skeleton + grid + spec              | 🟢 done             | `primitive-spec.md` · D-1..D-8  |
| W1  | Group/box UX on the existing model (platform-only)     | 🟢 merged (PR #261) | plan §W1 · DR-W1-1..5           |
| W2  | Model core (Group entity, recursion/arrangement death) | 🟢 merged (PR #262) | `0041` · DR-W2-1..9 · FORK-1..6 |
| W3  | Editor remap (proto fidelity + gestures + draft flat)  | 🟡 prompt issued    | `w3-runner-prompt.md`           |
| W4  | Row grammar + leaf residuals                           | ⚪ needs F-PLAQUE+  | plan §W4                        |

## Next action

**W2 BUILT 2026-06-11** — the model core shipped on `feat/session-primitive-w2-model-core` (9 commits; this close-out commit rides the SAME PR per `closeout-before-pr`). `SchemaGroup` is a real persisted entity (membership-based sibling relation, opaque label, SetNull dissolution, no `order` column); recursion + the arrangement axis are dead; the ratified leaf kills landed; the seed re-expressed; platform re-points box-ness to the `buildBlockItems` one-predicate; idempotency threaded. **All runnable gates green** (check-types 16/16, lint 16/16, dep:check 0, contracts 745/745, platform 801/801). DR-W2-1..9 + DR-W2-FORK-1..6 ratified; ADR-0041 written (supersedes 0040). **Orchestrator review PASSED (2026-06-11):** gates re-run independently (identical numbers); red lines held (OPEN F-surfaces untouched; one-predicate single-consumer; admin/marketing zero-touch); idempotency verified end-to-end (factory-wrapped per ADR-0036). **Two defects fixed in-branch** (`de0c5def` + `578365cb`): the raw-SQL order check (`prisma/sql/lms-checks.sql`) still referenced dead `parentSchemaId` — caught LIVE by the owner's first `db:reset` → now a FULL unique `schemas_block_order`; and `resolveGroupedOrder`'s `Promise.all` shift collided under that unique → descending-sequential. DR-W2-8 SUPERSEDED; **W2-ORDER-UNIQUE CLOSED**; ADR-0041 corrected. **MERGED 2026-06-11 — main `d76f6c8c`, branch deleted** — after the owner's reseed (the fixed `lms-checks.sql` applied clean) + browser walkthrough; verdict verbatim: **"есть косяки по UI/UX, но это уже формат полировки, на данном этапе аппрув."** The roadmap WARN-1 closed (owner merged with the flag explicitly raised). **Gated suite RAN 2026-06-12: 2692/2694** — the 2 failures were stale DR-W2-8 pins (runner tests asserting the OLD no-unique order behavior, written before the review fix) → flipped to pin the FULL unique (duplicate `(blockId, order)` → P2002, incl. the member+ungrouped shape); they are now the only LIVE guard on the raw-SQL layer application. Expected 2694/2694 at the next ritual run.

**W2-UX-POLISH ENUMERATED 2026-06-12 (exactly 2 items) → the W3 prompt is issued: `w3-runner-prompt.md`.** Item 1 = a LIVE bug: the unchecked independent-ladders path 400s — `${draft.id}:${trackIndex}` violates `IDEMPOTENCY_KEY_REGEX /^[A-Za-z0-9_-]{1,256}$/` (the COLON; verified in `request-codec.ts`/`constants.ts`). Item 2 = bring the group card to the owner's hi-fi prototype (`plan-editor-hi-fi-v-2` — fetched + distilled verbatim into the prompt: solid tinted frame, GROUP overline, continuous accent rail, track-no badges instead of member drag handles, segmented interleave, Add group / Add track / Ungroup / Delete-with-tracks gestures). **Key scoping fact: the prototype's whole gesture set is served by the EXISTING W2 API — zero new endpoints; W3 is a platform wave** (sanctioned exceptions: one read-only regex import in a test + two dead-export deletions in contracts). Cross-boundary DnD-grouping stays OUT (proto has buttons, not drag-onto; matches the standing cross-scope-drag deferral). Riders folded in: W2-DRAFT-RECURSION (D4), QA-004 kind-switch confirm (D5), W2-STALE-\* hygiene (D6). §6.7 re-confirms CLOSED (owner enumerated polish as exactly the 2 items — neither flagged). Next, in order:

1. **Owner transports the prompt**: paste the BODY of `w3-runner-prompt.md` into a `/feature` (full) run in a FRESH session (D-7 budget: that session does nothing else).
2. **On return: orchestrator reviews the git diff** against the prompt's §8 red lines — contracts/Prisma/api-server/seed untouched (so NO owner gated-suite ritual this wave unless a Gate-A fork broke that boundary — the close-out must say so loudly); one-predicate held; no hex; no cross-boundary DnD; close-out docs rode the PR.
3. **Owner walkthrough**: prompt §10 (10 steps — the dead 400, proto side-by-side, gestures, kind-switch confirm) → merge.
4. Then W4 needs the F-ledger (F-PLAQUE first) — or, before that, the next ritual run confirms api-server 2694/2694.

F-ledger follow-ups stay owner-paced and gate only W4 (F-PLAQUE first when the owner has the appetite).

## Open decisions awaiting ratification

- The F-ledger (`deferred.md`): F-PLAQUE (gates W4, first) · F-CHIPS · F-POSITION-CARRIER · F-WEIGHT-EXOTICS · F-TEMPO · F-BLOCK-TIMECAP · F-SLOT · F-HEADER. Owner-paced, one topic per touch, orchestrator brings a concrete rec each time. **(D-MARKER-DEATH DONE — landed in W2; no model-core decisions remain open.)**

## Live carry-forwards

**CLOSED in W2 (this PR):** W1-DUP-RETRY (idempotency via the existing `@repo/api-routes` layer; stable `${draft.id}:${trackIndex}` key) · W1-RENDER-REPOINT (box re-points to Group via the `buildBlockItems` one-predicate) · W1-SUBADD-BOX (in-group-add hides the «Group into one box» checkbox) · MARKER-FATE / D-MARKER-DEATH (`INNER_LADDER_MARKER` removed; the distinction survives as two structures) · **W2-ORDER-UNIQUE** (closed at review — the deferral premise was false; full unique `schemas_block_order` landed via the raw-SQL fix, DR-W2-8 SUPERSEDED).
SCHEDULED → W3 (in the prompt): **W2-UX-POLISH** (the 2 enumerated items = D1 idempotency-key bug + D2 proto fidelity) · **W2-DRAFT-RECURSION** (D4 draft collapse) · **QA-004** (D5 kind-switch confirm) · W2-STALE-FIXTURES / W2-VESTIGIAL-EXPORTS / W2-STALE-NAMES (D6 hygiene).
CLOSED 2026-06-12: W2-FOOTNOTE-LAST / W2-URL-PLACEHOLDER (owner enumerated polish as exactly 2 items — neither flagged; current seed expression stands).
OPEN: W2-IDEM-REMOUNT (low — by-design semantics; the W3 prompt explicitly keeps it) · W1-INSESSION-CHECK (low) · BACKLOG-ROUNDS (Group label until an engine) · BACKLOG-TAIL / BACKLOG-PATTERNS (dissolve by design — confirm at freeze). W1-BOX-FRAME CLOSED (and the proto restyle in W3 replaces the dashed look with the solid-tint Fork-A spirit anyway). Standing debts out-of-scope: `Performed*`/`OneRMRecord` known-wrong (Phase-4 redesign, now the carrier for the ex-roadmap score-type debt); reuse features post-primitive.

## Gotchas a resuming session must know

- **ADR-0041 is now the law** — the box is a real `SchemaGroup` entity (membership-based, opaque label, no recursion, no typed relation kinds, no child-count semantics); parallelism is explicit Group membership, not derived. **ADR-0040 (derive-parallelism) is SUPERSEDED by 0041** — it is no longer the live law of main once W2 merges; `isStructurallyParallel` / the arrangement axis / `parentSchemaId` / `POST …/schemas/parallel` are deleted.
- **The reseed is mandatory before the app runs against the new code** (aggressive bridge-free, QA-001): the read mappers reject any pre-W2 row shape and 500 the week GET. `db:reset` + seed is the stale-data remedy (ADR-0019, non-prod Neon).
- **One-predicate rule** — box-ness/clustering ONLY via `schema.groupId` membership and the ONE shared `buildBlockItems(schemas, groups)` helper in contracts; a hand-rolled child-count/cluster check is how the last CRITICAL shipped. The Group label is opaque text the system NEVER reads.
- **The corpus is the floor, not the ceiling** — one PERSONAL plan; m/f (`byProfile`) and RX/SC are real despite corpus cardinality 1/0 (D-5/D-6).
- **No typed relation kinds; no chips-as-blanket-mechanism** (D-4; F-CHIPS rejected as "костыль") — channel-3 carriers decided per case in follow-ups; a relation gains typed semantics ONLY against a real engine (ADR-0038 re-introduce-fresh).
- **Owner verbatim bars** in `decisions.md` D-6 (TOTAL dead, footnote=ordering, per-set=row-group) — quote them in runner prompts, don't re-litigate.
- **`docs/roadmap.md` was removed** (W2 commit `58de8394`, owner-requested) — don't expect it; the Phase-4 score-type debt it carried is re-anchored to the `Performed*`/`OneRMRecord` standing debt in `deferred.md`.
- Predecessors (`plan-editor-compose`, `compose-authoring-ux`) are CLOSED; their decisions describe main's current code, not this redesign's constraints — except the charter's Sacred list.
