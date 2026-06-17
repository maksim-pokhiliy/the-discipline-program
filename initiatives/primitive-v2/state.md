# primitive-v2 — state (the board)

**Updated:** 2026-06-17 (**reshape shipped**). Step 1 done — the 5-change leaf reshape shipped as ONE `/feature` (full) wave: 94 files (+2061/-412), gates green (check-types 16/16 · lint 16/16 · dep:check 0 · contracts 781 · platform 947), spec re-frozen. It's in the feature PR with the close-out docs. **NEXT: owner acceptance** — `db:reset` + the gated api-server suite + a browser-walkthrough — then merge.

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`. **Resume here** (the SessionStart hook force-loads it).

## Board

| #   | Step                                 | Status      | Pointer                                                         |
| --- | ------------------------------------ | ----------- | --------------------------------------------------------------- |
| 0   | Design lock (planner)                | ✅ DONE     | `reshape-design.md` · `decisions.md` (7 D-V2-\*)                |
| 1   | Reshape — ONE `/feature` (full)      | ✅ SHIPPED  | 94 files; gates green; in the feature PR; owner acceptance owed |
| —   | Executor-gated (#11 score, #20 rest) | 🅿️ deferred | D-V2-EXEC-DEFER-HOLD · Phase-4                                  |

## Next action

**▶ Owner acceptance** (gated, manual — the feature pipeline did NOT run these): `pnpm db:reset` (apply the 3 new Json columns to dev Neon) → `pnpm --filter @repo/api-server test` (the written-not-run suite, ~10 min serial) → browser-walkthrough rebuilding the evil-corpus cases live (Fran-capped, Tabata, row RPE+rest, block @85% overlay, Wall Ball grid) — confirm they round-trip. Then merge the PR. The close-out already rode in the PR (no separate `/initiative-close` commit needed); after merge the initiative is done.

## Open decisions awaiting ratification

NONE. All 7 D-V2-\* RATIFIED + SHIPPED. Implementation-phase micro-calls recorded in `decisions.md`: D-V2-COMPOSE-ROW-UNCHANGED (Gate-A) + the byProfile unique-axis-values hardening + the `isStructurallyParallel` phantom-precedent correction (Implementation notes).

## Live carry-forwards

`deferred.md`: EXEC-11 (score) + EXEC-20 (inter-schema rest) → Phase-4 (D-V2-EXEC-DEFER-HOLD); BASKET-C-2 (build-to-1RM) → Phase 3; BASKET-C-19 CLOSED (already expresses). NEW: FOLLOWUP-INTENSITY-RANGE + FOLLOWUP-NUMERIC-PACE (`IntensityFields` can't author effortPercent-range / numericPace — pre-existing, out of this wave's scope).

## Gotchas a resuming session must know

- **api-server suite was NOT run** by the feature pipeline (owner's gated manual). It's WRITTEN + type-checks. Owner runs `db:reset` THEN the suite.
- **The spec is RE-FROZEN** (`session-primitive/primitive-spec.md`, 2026-06-17) — the 5 changes are in Grid B/C + §6 kill-list (reversals marked SUPERSEDED, trail kept) + §8 (cases 11–18) + §9 (cross-checked vs live contracts).
- **`isStructurallyParallel` is a PHANTOM** — the design cited it as the thread-once precedent; it does not exist in the repo. `resolveIntensity` (`apps/platform/.../lib/resolve-intensity.ts`) is the real single-merge helper. Don't chase the phantom.
- **Two NEW UI surfaces** shipped (byProfile axes/cells grid + block-intensity edit affordance) — the rest of the editor reuses `IntensityFields`/`RestSpecFields`/`TimeCapFields`.
- coach-station is still PAUSED, not closed (Phase-2 Exit + owner-owed gated suites); primitive-v2 completes Phase 1.
