# session-primitive — state (the board)

**Updated:** 2026-06-10

Resume here (SessionStart hook force-loads this). Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`; the design itself → `primitive-spec.md`.

## Board

| #   | Step                                                        | Status  | Pointer                          |
| --- | ----------------------------------------------------------- | ------- | -------------------------------- |
| 0   | Founding: review → skeleton + grid + spec                   | 🟢 done | `primitive-spec.md` · D-1..D-7   |
| 1   | Follow-up design: close F-\* + D-MARKER-DEATH → spec freeze | ⚪ next | `deferred.md` F-ledger · plan §1 |
| 2   | Group/box UX on mocks                                       | ⚪      | plan §2                          |
| 3   | Contracts + Prisma + seed reshape                           | ⚪      | plan §3                          |
| 4   | Editor remap + cleanup                                      | ⚪      | plan §4                          |

## Next action

**Step 1, owner-paced follow-ups** — the owner is design-fatigued ("я устал дизайнить"); do NOT dump the whole F-ledger on him. One topic per touch, orchestrator brings a concrete recommendation each time. First topic: **F-PLAQUE** (it gates the row-level grammar — rest rows, OR carrier, connectors). The implementation steps (2–4) do not start until `primitive-spec.md` has zero OPEN rows.

## Open decisions awaiting ratification

- **D-MARKER-DEATH** (`decisions.md`) — marker row kind dies; rep-scheme ladder = one-row ladder-schemas in a Group. Explicitly asked 2026-06-10, not yet answered. Do not execute past it.
- The F-ledger (`deferred.md`): F-PLAQUE · F-CHIPS · F-POSITION-CARRIER · F-WEIGHT-EXOTICS · F-TEMPO · F-BLOCK-TIMECAP · F-SLOT · F-HEADER.

## Live carry-forwards

Inherited: QA-004 (confirm/undo rides the editor rebuild) · MARKER-FATE (→ D-MARKER-DEATH) · BACKLOG-ROUNDS (Group label until an engine) · BACKLOG-TAIL / BACKLOG-PATTERNS (dissolve by design — confirm at freeze). Standing debts acknowledged out-of-scope: `Performed*`/`OneRMRecord` known-wrong (Phase-4 redesign); roadmap §4.2 stale wording; reuse features post-primitive.

## Gotchas a resuming session must know

- **ADR-0040 is the LIVE behavior of main** (derived parallelism, `isStructurallyParallel`, atomic `POST …/schemas/parallel`) until step 3 lands. D-2 supersedes it forward at implementation time — don't half-apply either world.
- **The corpus is the floor, not the ceiling** — it's ONE personal plan; m/f loads (`dual_value`) and RX/SC are real-and-frequent in group programming despite corpus cardinality 1/0 (owner correction, D-5/D-6).
- **No typed relation kinds, no chips-as-blanket-mechanism** — both explicitly rejected by the owner (D-4, F-CHIPS). Channel-3 carriers are decided per case in follow-ups.
- **Owner verbatim bars** live in `decisions.md` (D-6: TOTAL dead, footnote=ordering, per-set=row-group) — don't re-litigate them in runner prompts; quote them.
- **Predecessors are CLOSED** (`plan-editor-compose`, `compose-authoring-ux`) — their decisions are the floor of main's current code, not constraints on this redesign EXCEPT the explicitly-sacred list in the charter.
- Verification sources for the grid: `analysis/artifacts/03-content/schema-content-primitives.md` + `modifier-scope.md` + `compound-and-alternative.md` + `edge-cases.md` (all re-read at founding); `load-representation.md`/`load-edge-cases.md` deliberately deferred to F-WEIGHT-EXOTICS.
