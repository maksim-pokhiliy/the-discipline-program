# session-primitive — state (the board)

**Updated:** 2026-06-11 (W2 merged + stage-accepted)

Resume here (SessionStart hook force-loads this). Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; the design itself → `primitive-spec.md`.

## Board

| #   | Wave                                                   | Status              | Pointer                         |
| --- | ------------------------------------------------------ | ------------------- | ------------------------------- |
| 0   | Founding: review → skeleton + grid + spec              | 🟢 done             | `primitive-spec.md` · D-1..D-8  |
| W1  | Group/box UX on the existing model (platform-only)     | 🟢 merged (PR #261) | plan §W1 · DR-W1-1..5           |
| W2  | Model core (Group entity, recursion/arrangement death) | 🟢 merged (PR #262) | `0041` · DR-W2-1..9 · FORK-1..6 |
| W3  | Editor remap (DnD/ungroup persistence)                 | ⚪                  | plan §W3                        |
| W4  | Row grammar + leaf residuals                           | ⚪ needs F-PLAQUE+  | plan §W4                        |

## Next action

**W2 BUILT 2026-06-11** — the model core shipped on `feat/session-primitive-w2-model-core` (9 commits; this close-out commit rides the SAME PR per `closeout-before-pr`). `SchemaGroup` is a real persisted entity (membership-based sibling relation, opaque label, SetNull dissolution, no `order` column); recursion + the arrangement axis are dead; the ratified leaf kills landed; the seed re-expressed; platform re-points box-ness to the `buildBlockItems` one-predicate; idempotency threaded. **All runnable gates green** (check-types 16/16, lint 16/16, dep:check 0, contracts 745/745, platform 801/801). DR-W2-1..9 + DR-W2-FORK-1..6 ratified; ADR-0041 written (supersedes 0040). **Orchestrator review PASSED (2026-06-11):** gates re-run independently (identical numbers); red lines held (OPEN F-surfaces untouched; one-predicate single-consumer; admin/marketing zero-touch); idempotency verified end-to-end (factory-wrapped per ADR-0036). **Two defects fixed in-branch** (`de0c5def` + `578365cb`): the raw-SQL order check (`prisma/sql/lms-checks.sql`) still referenced dead `parentSchemaId` — caught LIVE by the owner's first `db:reset` → now a FULL unique `schemas_block_order`; and `resolveGroupedOrder`'s `Promise.all` shift collided under that unique → descending-sequential. DR-W2-8 SUPERSEDED; **W2-ORDER-UNIQUE CLOSED**; ADR-0041 corrected. **MERGED 2026-06-11 — main `d76f6c8c`, branch deleted** — after the owner's reseed (the fixed `lms-checks.sql` applied clean) + browser walkthrough; verdict verbatim: **"есть косяки по UI/UX, но это уже формат полировки, на данном этапе аппрув."** The roadmap WARN-1 closed (owner merged with the flag explicitly raised). **Gated api-server suite run at merge NOT confirmed — ask the owner; if unrun, one ritual covers it before W3.** Next, in order:

1. **Collect the owner's UI/UX polish list** (**W2-UX-POLISH**, owner-paced) — fold in the two §6.7 content re-confirms (W2-FOOTNOTE-LAST: strict-LAST or de-specialize; W2-URL-PLACEHOLDER: demo-read ok). The list is W3's natural scoping input — collect BEFORE locking the W3 prompt.
2. **W3 planning** (editor remap: DnD-grouping, one-click ungroup, member add/remove with real persistence; draft↔contract mapper collapse — **W2-DRAFT-RECURSION** rides it). Same D-7 mechanics: plan §W3 + the runner-prompt checklist (plan.md) + the open carry-forwards; orchestrator verify-pass on live code before locking (incl. the raw-SQL layer — the W2 lesson).

F-ledger follow-ups stay owner-paced and gate only W4 (F-PLAQUE first when the owner has the appetite).

## Open decisions awaiting ratification

- The F-ledger (`deferred.md`): F-PLAQUE (gates W4, first) · F-CHIPS · F-POSITION-CARRIER · F-WEIGHT-EXOTICS · F-TEMPO · F-BLOCK-TIMECAP · F-SLOT · F-HEADER. Owner-paced, one topic per touch, orchestrator brings a concrete rec each time. **(D-MARKER-DEATH DONE — landed in W2; no model-core decisions remain open.)**

## Live carry-forwards

**CLOSED in W2 (this PR):** W1-DUP-RETRY (idempotency via the existing `@repo/api-routes` layer; stable `${draft.id}:${trackIndex}` key) · W1-RENDER-REPOINT (box re-points to Group via the `buildBlockItems` one-predicate) · W1-SUBADD-BOX (in-group-add hides the «Group into one box» checkbox) · MARKER-FATE / D-MARKER-DEATH (`INNER_LADDER_MARKER` removed; the distinction survives as two structures) · **W2-ORDER-UNIQUE** (closed at review — the deferral premise was false; full unique `schemas_block_order` landed via the raw-SQL fix, DR-W2-8 SUPERSEDED).
OPEN: **W2-UX-POLISH** (owner enumerates the walkthrough's polish nits — pre-W3 scoping input) · W2-FOOTNOTE-LAST / W2-URL-PLACEHOLDER (re-confirm item-wise inside the polish pass — the blanket stage-approve didn't answer them) · W2-DRAFT-RECURSION (→ W3 — the authoring draft layer is still recursive but never stored/rendered) · W2-IDEM-REMOUNT (low — close+reopen mints a fresh idempotency batch by design) · W1-INSESSION-CHECK (low) · QA-004-editor (confirm/undo rides the editor rebuild) · BACKLOG-ROUNDS (Group label until an engine) · BACKLOG-TAIL / BACKLOG-PATTERNS (dissolve by design — confirm at freeze). Low cleanup: W2-STALE-FIXTURES / W2-VESTIGIAL-EXPORTS / W2-STALE-NAMES. W1-BOX-FRAME CLOSED. Standing debts out-of-scope: `Performed*`/`OneRMRecord` known-wrong (Phase-4 redesign, now the carrier for the ex-roadmap score-type debt); reuse features post-primitive.

## Gotchas a resuming session must know

- **ADR-0041 is now the law** — the box is a real `SchemaGroup` entity (membership-based, opaque label, no recursion, no typed relation kinds, no child-count semantics); parallelism is explicit Group membership, not derived. **ADR-0040 (derive-parallelism) is SUPERSEDED by 0041** — it is no longer the live law of main once W2 merges; `isStructurallyParallel` / the arrangement axis / `parentSchemaId` / `POST …/schemas/parallel` are deleted.
- **The reseed is mandatory before the app runs against the new code** (aggressive bridge-free, QA-001): the read mappers reject any pre-W2 row shape and 500 the week GET. `db:reset` + seed is the stale-data remedy (ADR-0019, non-prod Neon).
- **One-predicate rule** — box-ness/clustering ONLY via `schema.groupId` membership and the ONE shared `buildBlockItems(schemas, groups)` helper in contracts; a hand-rolled child-count/cluster check is how the last CRITICAL shipped. The Group label is opaque text the system NEVER reads.
- **The corpus is the floor, not the ceiling** — one PERSONAL plan; m/f (`byProfile`) and RX/SC are real despite corpus cardinality 1/0 (D-5/D-6).
- **No typed relation kinds; no chips-as-blanket-mechanism** (D-4; F-CHIPS rejected as "костыль") — channel-3 carriers decided per case in follow-ups; a relation gains typed semantics ONLY against a real engine (ADR-0038 re-introduce-fresh).
- **Owner verbatim bars** in `decisions.md` D-6 (TOTAL dead, footnote=ordering, per-set=row-group) — quote them in runner prompts, don't re-litigate.
- **`docs/roadmap.md` was removed** (W2 commit `58de8394`, owner-requested) — don't expect it; the Phase-4 score-type debt it carried is re-anchored to the `Performed*`/`OneRMRecord` standing debt in `deferred.md`.
- Predecessors (`plan-editor-compose`, `compose-authoring-ux`) are CLOSED; their decisions describe main's current code, not this redesign's constraints — except the charter's Sacred list.
