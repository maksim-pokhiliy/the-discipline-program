# compose-authoring-ux — state (the board)

**Updated:** 2026-06-10 — **INITIATIVE CLOSED**

Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`.

## Board

| #   | Step                                     | Status    | Pointer                                                     |
| --- | ---------------------------------------- | --------- | ----------------------------------------------------------- |
| 1   | Authoring UI flow (on mocks)             | ✅ merged | PR #258 · `4bb7669f` · DR-1..6                              |
| 2   | Contract + model + api reshape (persist) | ✅ merged | PRs #259+#260 · ADR-0040 (+ Gate-B amendments) · DR-S2-1..9 |

## Next action

None here — **CLOSED 2026-06-10**, both steps shipped. Successor: **`initiatives/session-primitive/`** (session-primitive domain-model redesign: box model, fixed floors, no recursion), founded the same day out of the 2026-06-10 domain-model review. Resume THERE, not here.

## Open decisions awaiting ratification

None in this initiative. The structural-derivation mechanism (D-TRACKS-DERIVED / DR-S2-1 / DR-S2-4) is slated for forward-supersede by session-primitive's explicit-Group model (its D-BOX) at implementation time — recorded append-only in `decisions.md` §Post-close.

## Live carry-forwards

All transferred to `initiatives/session-primitive/deferred.md`: QA-004 · MARKER-FATE (→ its D-MARKER-DEATH, OPEN) · LABEL-COMBINE (dissolves under explicit groups) · BACKLOG-ROUNDS / -TAIL / -PATTERNS (reframed by the box model). Dispositions in this dir's `deferred.md` point across.

## Gotchas for anyone reading this later

- **Live behavior of main = ADR-0040**: parallelism DERIVED from structure (≥2 container children, no repetition/arrangement; `once` ≡ absence; explicit `ordered` = suppression hatch). That stays true until session-primitive's implementation supersedes it.
- **`INNER_LADDER_MARKER` is still in the contract**; its death is PROPOSED (not ratified) in the successor (D-MARKER-DEATH, OPEN).
- Step 2's board line said "owner gate pending" at close; the owner declared the step done 2026-06-10 ("степ 2 уже окончен, слит в main") — the gated-suite/reseed/browser remainder is his manual ritual, not recorded here.
