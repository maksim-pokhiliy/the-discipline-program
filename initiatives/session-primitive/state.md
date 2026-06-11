# session-primitive — state (the board)

**Updated:** 2026-06-11 (W2 built)

Resume here (SessionStart hook force-loads this). Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; the design itself → `primitive-spec.md`.

## Board

| #   | Wave                                                   | Status              | Pointer                         |
| --- | ------------------------------------------------------ | ------------------- | ------------------------------- |
| 0   | Founding: review → skeleton + grid + spec              | 🟢 done             | `primitive-spec.md` · D-1..D-8  |
| W1  | Group/box UX on the existing model (platform-only)     | 🟢 merged (PR #261) | plan §W1 · DR-W1-1..5           |
| W2  | Model core (Group entity, recursion/arrangement death) | 🟢 built (PR open)  | `0041` · DR-W2-1..9 · FORK-1..6 |
| W3  | Editor remap (DnD/ungroup persistence)                 | ⚪                  | plan §W3                        |
| W4  | Row grammar + leaf residuals                           | ⚪ needs F-PLAQUE+  | plan §W4                        |

## Next action

**W2 BUILT 2026-06-11** — the model core shipped on `feat/session-primitive-w2-model-core` (9 commits; this close-out commit rides the SAME PR per `closeout-before-pr`). `SchemaGroup` is a real persisted entity (membership-based sibling relation, opaque label, SetNull dissolution, no `order` column); recursion + the arrangement axis are dead; the ratified leaf kills landed; the seed re-expressed; platform re-points box-ness to the `buildBlockItems` one-predicate; idempotency threaded. **All runnable gates green** (check-types 16/16, lint 16/16, dep:check 0, contracts 745/745, platform 801/801). DR-W2-1..9 + DR-W2-FORK-1..6 ratified; ADR-0041 written (supersedes 0040). Next, in order:

1. **Owner ritual (the acceptance gate the runner cannot run):** `pnpm --filter @repo/api-server db:reset` + seed + the gated api-server SUITE (live Neon, ~10 min serial) + the **§6 9-step walkthrough** in `w2-runner-prompt.md` (the 4 ex-parallel boxes incl. block-037's multi-track; block-010/011 rounds-label boxes; EMOM slots; label round-trip; checked/unchecked batch + in-modal retry idempotency; in-box add; delete-to-dissolution; the 4 row kinds + the **footnote-LAST** and **URL-as-demo** content confirmations — W2-FOOTNOTE-LAST / W2-URL-PLACEHOLDER in `deferred.md`, 1-line seed fix if either reads wrong; group-as-unit reorder). **The reseed is a HARD prerequisite for the app to function** — the read mappers `.parse()` against the new contracts, so the app 500s on a non-reseeded DB (not just the test suite). The re-derived ≥2-member structural-parallel group count = 4 is verified statically; the reseed proves it live.
2. **Merge** the PR (squash) once the owner's gate passes.
3. Then **W3** (editor remap / reorder rebuild) planning — **W2-ORDER-UNIQUE** (`@@unique([blockId, order])` + the two-phase-reorder re-examination) and the **recursive-draft collapse** (W2-DRAFT-RECURSION) ride it.

F-ledger follow-ups stay owner-paced and gate only W4 (F-PLAQUE first when the owner has the appetite).

## Open decisions awaiting ratification

- The F-ledger (`deferred.md`): F-PLAQUE (gates W4, first) · F-CHIPS · F-POSITION-CARRIER · F-WEIGHT-EXOTICS · F-TEMPO · F-BLOCK-TIMECAP · F-SLOT · F-HEADER. Owner-paced, one topic per touch, orchestrator brings a concrete rec each time. **(D-MARKER-DEATH DONE — landed in W2; no model-core decisions remain open.)**

## Live carry-forwards

**CLOSED in W2 (this PR):** W1-DUP-RETRY (idempotency via the existing `@repo/api-routes` layer; stable `${draft.id}:${trackIndex}` key) · W1-RENDER-REPOINT (box re-points to Group via the `buildBlockItems` one-predicate) · W1-SUBADD-BOX (in-group-add hides the «Group into one box» checkbox) · MARKER-FATE / D-MARKER-DEATH (`INNER_LADDER_MARKER` removed; the distinction survives as two structures).
OPEN: **W2-ORDER-UNIQUE** (→ W3 reorder rebuild — `@@unique([blockId, order])` consciously deferred, DR-W2-8) · **W2-FOOTNOTE-LAST / W2-URL-PLACEHOLDER** (owner-verify the two seed-content calls at the §6 walkthrough) · W2-DRAFT-RECURSION (→ W3 — the authoring draft layer is still recursive but never stored/rendered) · W2-IDEM-REMOUNT (low — close+reopen mints a fresh idempotency batch by design) · W1-INSESSION-CHECK (low) · QA-004-editor (confirm/undo rides the editor rebuild) · BACKLOG-ROUNDS (Group label until an engine) · BACKLOG-TAIL / BACKLOG-PATTERNS (dissolve by design — confirm at freeze). Low cleanup: W2-STALE-FIXTURES / W2-VESTIGIAL-EXPORTS / W2-STALE-NAMES. W1-BOX-FRAME CLOSED. Standing debts out-of-scope: `Performed*`/`OneRMRecord` known-wrong (Phase-4 redesign, now the carrier for the ex-roadmap score-type debt); reuse features post-primitive.

## Gotchas a resuming session must know

- **ADR-0041 is now the law** — the box is a real `SchemaGroup` entity (membership-based, opaque label, no recursion, no typed relation kinds, no child-count semantics); parallelism is explicit Group membership, not derived. **ADR-0040 (derive-parallelism) is SUPERSEDED by 0041** — it is no longer the live law of main once W2 merges; `isStructurallyParallel` / the arrangement axis / `parentSchemaId` / `POST …/schemas/parallel` are deleted.
- **The reseed is mandatory before the app runs against the new code** (aggressive bridge-free, QA-001): the read mappers reject any pre-W2 row shape and 500 the week GET. `db:reset` + seed is the stale-data remedy (ADR-0019, non-prod Neon).
- **One-predicate rule** — box-ness/clustering ONLY via `schema.groupId` membership and the ONE shared `buildBlockItems(schemas, groups)` helper in contracts; a hand-rolled child-count/cluster check is how the last CRITICAL shipped. The Group label is opaque text the system NEVER reads.
- **The corpus is the floor, not the ceiling** — one PERSONAL plan; m/f (`byProfile`) and RX/SC are real despite corpus cardinality 1/0 (D-5/D-6).
- **No typed relation kinds; no chips-as-blanket-mechanism** (D-4; F-CHIPS rejected as "костыль") — channel-3 carriers decided per case in follow-ups; a relation gains typed semantics ONLY against a real engine (ADR-0038 re-introduce-fresh).
- **Owner verbatim bars** in `decisions.md` D-6 (TOTAL dead, footnote=ordering, per-set=row-group) — quote them in runner prompts, don't re-litigate.
- **`docs/roadmap.md` was removed** (W2 commit `58de8394`, owner-requested) — don't expect it; the Phase-4 score-type debt it carried is re-anchored to the `Performed*`/`OneRMRecord` standing debt in `deferred.md`.
- Predecessors (`plan-editor-compose`, `compose-authoring-ux`) are CLOSED; their decisions describe main's current code, not this redesign's constraints — except the charter's Sacred list.
