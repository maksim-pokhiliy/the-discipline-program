# session-primitive — state (the board)

**Updated:** 2026-06-11

Resume here (SessionStart hook force-loads this). Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; the design itself → `primitive-spec.md`.

## Board

| #   | Wave                                                   | Status              | Pointer                        |
| --- | ------------------------------------------------------ | ------------------- | ------------------------------ |
| 0   | Founding: review → skeleton + grid + spec              | 🟢 done             | `primitive-spec.md` · D-1..D-8 |
| W1  | Group/box UX on the existing model (platform-only)     | 🟢 merged (PR #261) | plan §W1 · DR-W1-1..5          |
| W2  | Model core (Group entity, recursion/arrangement death) | 🟡 prompt issued    | `w2-runner-prompt.md`          |
| W3  | Editor remap (DnD/ungroup persistence)                 | ⚪                  | plan §W3                       |
| W4  | Row grammar + leaf residuals                           | ⚪ needs F-PLAQUE+  | plan §W4                       |

## Next action

**W1 CLOSED 2026-06-11** — PR #261 merged to main `6a45cc3d` (branch deleted); owner walkthrough verdict: "всё работает, полировка будет потом" (W1-BOX-FRAME accepted as-is → CLOSED; W1-SUBADD-BOX no fix → dissolves in W2). **D-MARKER-DEATH RATIFIED** ("да, вырываем с корнем"). **The W2 runner prompt is issued: `w2-runner-prompt.md`** — written against a full orchestrator verify-pass of the live code (contracts core read verbatim; seed verified marker-free; the dormant `@repo/api-routes` idempotency layer chosen for W1-DUP-RETRY; `@@unique([blockId, order])` consciously deferred → W2-ORDER-UNIQUE). Next, in order:

1. **Owner transports the prompt**: paste the BODY of `w2-runner-prompt.md` into a `/feature` (full) run in a FRESH session — one full run, nothing else in that session (D-7 budget).
2. **On return: orchestrator reviews the git diff** (never the runner's self-report) against the prompt's §4 red lines — OPEN F-row surfaces untouched (weight exotics/tempo/position/sequence/timeCap/or_alternative/perSet); no recursion/typed-rel/child-count semantics; the ONE clustering helper is the only box-ness source; W3 scope absent; close-out docs rode the PR (D9).
3. **Owner ritual after review passes**: `db:reset` + seed + the gated api-server suite (runner cannot run it) + the §6 acceptance walkthrough (9 steps in the prompt).
4. Then W3 (editor remap) planning; W2-ORDER-UNIQUE rides W3's reorder rebuild.

F-ledger follow-ups stay owner-paced and gate only W4 (F-PLAQUE first when the owner has the appetite).

## Open decisions awaiting ratification

- The F-ledger (`deferred.md`): F-PLAQUE (gates W4, first) · F-CHIPS · F-POSITION-CARRIER · F-WEIGHT-EXOTICS · F-TEMPO · F-BLOCK-TIMECAP · F-SLOT · F-HEADER. Owner-paced, one topic per touch, orchestrator brings a concrete rec each time. (D-MARKER-DEATH ratified 2026-06-11 — no model-core decisions remain open.)

## Live carry-forwards

SCHEDULED → W2 (in the prompt): **W1-DUP-RETRY** (idempotency via the existing `@repo/api-routes` layer, §D4) · **W1-RENDER-REPOINT** (clustering helper re-point, §D7) · **W1-SUBADD-BOX** (in-box add hides the checkbox, §D7) · MARKER-FATE (the cut, §D1/D6 — seed verified marker-free).
OPEN: W2-ORDER-UNIQUE (→ W3 reorder rebuild) · W1-INSESSION-CHECK (low) · QA-004 (confirm/undo rides the editor rebuild) · BACKLOG-ROUNDS (Group label until an engine) · BACKLOG-TAIL / BACKLOG-PATTERNS (dissolve by design — confirm at freeze). W1-BOX-FRAME CLOSED (accepted as-is; solid-divider fallback documented). Standing debts out-of-scope: `Performed*`/`OneRMRecord` known-wrong (Phase-4 redesign); roadmap §4.2 stale; reuse features post-primitive.

## Gotchas a resuming session must know

- **ADR-0040 is the LIVE behavior of main** (derived parallelism, atomic `POST …/schemas/parallel`) until W2 lands. W1 builds ON it (box render gated by the live `isStructurallyParallel`), it does not fight it. D-2 supersedes the mechanism only at W2 implementation time.
- **One-predicate rule** — any "is this a box/parallel" reader consults the shared contracts predicate; a hand-rolled child-count check is how the last CRITICAL shipped.
- **W1 red lines:** platform-only (zero contracts/api-server/Prisma/seed); no DnD/ungroup persistence fakes (no re-parenting API exists); marker artifacts untouched (OPEN decision).
- **The corpus is the floor, not the ceiling** — one PERSONAL plan; m/f (`byProfile`) and RX/SC are real despite corpus cardinality 1/0 (D-5/D-6).
- **No typed relation kinds; no chips-as-blanket-mechanism** (D-4; F-CHIPS rejected as "костыль") — channel-3 carriers decided per case in follow-ups.
- **Owner verbatim bars** in `decisions.md` D-6 (TOTAL dead, footnote=ordering, per-set=row-group) — quote them in runner prompts, don't re-litigate.
- Predecessors (`plan-editor-compose`, `compose-authoring-ux`) are CLOSED; their decisions describe main's current code, not this redesign's constraints — except the charter's Sacred list.
