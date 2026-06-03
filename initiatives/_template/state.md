# <initiative-slug> — state (the board)

**Updated:** <YYYY-MM-DD>

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`. **Resume here** (the SessionStart hook force-loads it).

## Board

| #   | Step   | Status                                        | Pointer                            |
| --- | ------ | --------------------------------------------- | ---------------------------------- |
| <1> | <step> | ⬜ pending / 🔵 active / ✅ done / ⛔ blocked | <journal date · decision id · doc> |

## Next action

<the ONE concrete next step. If code: "launch /feature with a step prompt". If blocked: name the blocker (e.g. "ratify D-N").>

## Open decisions awaiting ratification

<D-ids from decisions.md with status OPEN — do not execute past these>

## Live carry-forwards

<OPEN ids from deferred.md>

## Gotchas a resuming session must know

<the 2-3 traps — e.g. "the frozen contract is X, reuse don't edit"; "Y is superseded history, don't plan off it">
