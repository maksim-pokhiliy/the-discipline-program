# session-primitive — state (the board)

**Updated:** 2026-06-10

Resume here (SessionStart hook force-loads this). Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; the design itself → `primitive-spec.md`.

## Board

| #   | Wave                                                   | Status                  | Pointer                        |
| --- | ------------------------------------------------------ | ----------------------- | ------------------------------ |
| 0   | Founding: review → skeleton + grid + spec              | 🟢 done                 | `primitive-spec.md` · D-1..D-8 |
| W1  | Group/box UX on the existing model (platform-only)     | 🔵 launched 2026-06-10  | plan §W1 · prompt issued       |
| W2  | Model core (Group entity, recursion/arrangement death) | ⚪ needs D-MARKER-DEATH | plan §W2                       |
| W3  | Editor remap (DnD/ungroup persistence)                 | ⚪                      | plan §W3                       |
| W4  | Row grammar + leaf residuals                           | ⚪ needs F-PLAQUE+      | plan §W4                       |

## Next action

**W1 runner session is out** (`/feature` full; prompt issued 2026-06-10; owner transports). On its return: the orchestrator reviews the GIT DIFF (never the runner's self-report) against the W1 red lines (platform-only; one-predicate rule; no DnD/ungroup fakes) before W2 launches. **From the owner, any time before W2: D-MARKER-DEATH yes/no** (`decisions.md` — everything needed for the call is written there).

## Open decisions awaiting ratification

- **D-MARKER-DEATH** (`decisions.md`) — gates W2.
- The F-ledger (`deferred.md`): F-PLAQUE (gates W4, first) · F-CHIPS · F-POSITION-CARRIER · F-WEIGHT-EXOTICS · F-TEMPO · F-BLOCK-TIMECAP · F-SLOT · F-HEADER. Owner-paced, one topic per touch, orchestrator brings a concrete rec each time.

## Live carry-forwards

Inherited: QA-004 (confirm/undo rides the editor rebuild) · MARKER-FATE (→ D-MARKER-DEATH) · BACKLOG-ROUNDS (Group label until an engine) · BACKLOG-TAIL / BACKLOG-PATTERNS (dissolve by design — confirm at freeze). Standing debts out-of-scope: `Performed*`/`OneRMRecord` known-wrong (Phase-4 redesign); roadmap §4.2 stale; reuse features post-primitive.

## Gotchas a resuming session must know

- **ADR-0040 is the LIVE behavior of main** (derived parallelism, atomic `POST …/schemas/parallel`) until W2 lands. W1 builds ON it (box render gated by the live `isStructurallyParallel`), it does not fight it. D-2 supersedes the mechanism only at W2 implementation time.
- **One-predicate rule** — any "is this a box/parallel" reader consults the shared contracts predicate; a hand-rolled child-count check is how the last CRITICAL shipped.
- **W1 red lines:** platform-only (zero contracts/api-server/Prisma/seed); no DnD/ungroup persistence fakes (no re-parenting API exists); marker artifacts untouched (OPEN decision).
- **The corpus is the floor, not the ceiling** — one PERSONAL plan; m/f (`byProfile`) and RX/SC are real despite corpus cardinality 1/0 (D-5/D-6).
- **No typed relation kinds; no chips-as-blanket-mechanism** (D-4; F-CHIPS rejected as "костыль") — channel-3 carriers decided per case in follow-ups.
- **Owner verbatim bars** in `decisions.md` D-6 (TOTAL dead, footnote=ordering, per-set=row-group) — quote them in runner prompts, don't re-litigate.
- Predecessors (`plan-editor-compose`, `compose-authoring-ux`) are CLOSED; their decisions describe main's current code, not this redesign's constraints — except the charter's Sacred list.
