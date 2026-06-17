# athlete-core — state (the board)

**Updated:** 2026-06-17. **Block 1 (data core) SHIPPED** via `/feature` (full) on `feat/athlete-core-data-core` — 6 commits, gated api-server suite GREEN on a reseeded DB, close-out docs in the PR. **NEXT: block 2 — Athlete UX (owner-run UI on the data floor).**

## Board

| #   | Step                                             | Status                     | Pointer                                                                                            |
| --- | ------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------------- |
| 0   | Design lock + contract-shape spec                | ✅ done                    | `decisions.md` + `contract-shapes.md` + `block-1-feature-prompt.md`                                |
| 1   | Data core (coarse wave)                          | ✅ **DONE** (feature PR)   | `decisions.md` D-DIST-UNITS…D-SCOPE-PUBLISH · `.feature-dev/1781712323/` (research/design/plan)    |
| 2   | Athlete UX (coarse wave)                         | ⬜ **NEXT** · owner-run UI | plan-view + logging-30s + records/PR + profile; consumes the resolver `unresolved` shapes          |
| 3   | Coach honest-metrics                             | ⬜ pending                 | derived fields + reconcile cron; on the migrated `performedAt` coach-metrics                       |
| —   | Library wave (profiles + benchmarks + templates) | 🅿️ deferred                | one catalog pass; profile-catalog re-homes `profileSelections` free-string keys; fusion-form gated |

## Next action

**▶ Block 2 — Athlete UX (owner-run, ui-first on mocks).** The data floor exists: athlete write routes (`api/platform/athlete/{performed-sessions,one-rm-records,.../result}`), the pure `resolveLoad` + records/PR derivation libs, the `ResolvedLoad` 4-variant shape (resolved / missing_one_rm / missing_profile_pick / not_applicable) the UI renders into (kg / set-1RM affordance / pick-profile affordance / BW). Planner scope = UX requirements + mock-data contracts; the designer is owner-run. The app-side TanStack hooks (`use-performed-sessions`/`use-one-rm-records`/`use-performed-schema-results`) are wired and waiting for screens.

## Resolved this wave (no longer open)

- **byProfile cell-pick** — RESOLVED (D-PROFILE-SELECTIONS): pick-once-remembered, stored in `AthleteProfile.profileSelections` (free-string-keyed), resolved render-time; re-homes to a catalog profile-type id in the library wave. (Superseded contract-shapes §1.3 "no storage" — doc fixed.)
- **D-PUBLISH performed-vs-published seam** — RESOLVED (D-RESULT-RELATION): a recorded result pins its schema (`onDelete: Restrict`).

## Live carry-forwards (see `deferred.md`)

Publish / version-gate wave (D-SCOPE-PUBLISH — gate #2) · input-sanity bounds mini-pass (future-date / valueKg max / profileSelections cardinality — low severity) · per-exercise actuals (post-MVP) · profile-type catalog (re-homes `profileSelections`) · leaderboard.

## Gotchas a resuming session must know

- **Block 1 is the DATA FLOOR — backend + contracts only.** The only user-visible artifact is the coach green benchmark chip. All athlete logging/resolver/records is routes + libs with NO athlete UI (block 2 builds it). Don't expect athlete-visible progress yet.
- **coach-metrics was MIGRATED** (`startedAt/completedAt → performedAt`): the window Map holds **MAX** `performedAt` per (session,user); `isSessionCompleted` = a row exists; `coach-athletes` last-activity = `_max(performedAt)`. Behavior-preserving + repeat-correct.
- **`db:reset` world** (ADR-0019) — block 1 reshaped the schema destructively (dropped `PerformedExerciseInstance` + the uniques); no migration files. A resuming session re-applies via `db:reset` + `db:seed`.
- **9 build decisions ratified** in `decisions.md` (D-DIST-UNITS … D-SCOPE-PUBLISH) — don't re-litigate; block 2 builds to them.
- The resolver/derive libs + app hooks are block-1 deliverables whose production callers are block-2 screens (a ratified scope boundary, like `hidePastBeforeBoarding`).
