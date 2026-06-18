# athlete-core — state (the board)

**Updated:** 2026-06-18. **Block 2 screen 1 (Plan Timetable) SHIPPED** via `/feature` (full, autonomous) on `feat/athlete-plan-timetable` — 13 commits, 70/70 tests green (incl. the gated endpoint integration on the live dev DB), close-out docs in the PR. Block 1 (data core) shipped 2026-06-17 (#283). **NEXT: block 2 screen 2 — the session / workout view.**

## Board

| #   | Step                                             | Status                           | Pointer                                                                                                                                                                                       |
| --- | ------------------------------------------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Design lock + contract-shape spec                | ✅ done                          | `decisions.md` + `contract-shapes.md` + `block-1-feature-prompt.md`                                                                                                                           |
| 1   | Data core (coarse wave)                          | ✅ **DONE** (feature PR)         | `decisions.md` D-DIST-UNITS…D-SCOPE-PUBLISH · `.feature-dev/1781712323/` (research/design/plan)                                                                                               |
| 2   | Athlete UX (coarse wave)                         | 🔄 **IN PROGRESS** · screen 1 ✅ | **Plan Timetable SHIPPED** (`feat/athlete-plan-timetable`, decisions D-TT-\*); screens 2-4 next: session view · logging-30s · records/PR · profile (consume the resolver `unresolved` shapes) |
| 3   | Coach honest-metrics                             | ⬜ pending                       | derived fields + reconcile cron; on the migrated `performedAt` coach-metrics                                                                                                                  |
| —   | Library wave (profiles + benchmarks + templates) | 🅿️ deferred                      | one catalog pass; profile-catalog re-homes `profileSelections` free-string keys; fusion-form gated                                                                                            |

## Next action

**▶ Block 2 screen 2 — the session / workout view** (tap a timetable card → here). Read-only plan content: blocks → schemas (workouts) → rows (exercises), each row showing movement/reps/prescribed-load/intensity/tempo/notes. Render the load resolver's `ResolvedLoad` 4-variant shape (resolved kg / missing_one_rm → inline "set your 1RM" / missing_profile_pick → "pick your profile" / not_applicable → BW). A benchmark schema wears the green chip + result-type → primary action "Log result"; an ordinary session → "Mark completed". Build on screen 1's patterns: server-computes / view presentation-only (D-TT-SERVER-COMPUTES), tz-stable dates (D-TT-DATES-ABSOLUTE), no lms→coaching edge (D-TT-NO-COACHING-EDGE), faithful-to-prototype via theme tokens. The card-tap navigation target stub already exists in the timetable (`onOpenSession`).

Screen 1 (Plan Timetable) is DONE: the read endpoint + builder + hook + UI module + nav extension shipped on `feat/athlete-plan-timetable`. The app-side TanStack hooks (`use-performed-sessions`/`use-one-rm-records`/`use-performed-schema-results`) remain wired and waiting for the logging screens (3).

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
