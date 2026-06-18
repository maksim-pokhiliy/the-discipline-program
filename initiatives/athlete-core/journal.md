# athlete-core — journal (append-only)

## 2026-06-17 — founded (planner session, parallel to primitive-v2)

Mined the Phase-3 athlete domain in parallel with the `primitive-v2` Step-0 thread.

- **Parallelism resolved first.** Phase 3 builds on the frozen skeleton + 6 repetition kinds (stable). The only cross-thread dependency is the byProfile nested shape — isolated as a tail. The "everything is in flight" worry was an over-read of the charter scope list; the owner corrected it ("это до-дизайн, каркас не меняется") and the spec read confirmed it.
- **Domain mined with the owner** (athlete + coach, first-person authority). Caught and resolved the plan-as-train clash: the recorded Denys principle ("поезд не ждёт", make-up = anti-pattern) is the BILLING layer, not navigation — **D-LAYERS**. Verified the recorded memory verbatim BEFORE folding; nearly overwrote Denys's principle, the check saved it. The memory was then refined (scope-split), not erased.
- **Ratified:** D-LAYERS, D-STATS (statistics decompose; law differs training vs benchmark), D-RESULT-TYPES (six canonical CrossFit result types), D-PUBLISH (plan-level draft/published), D-DATE-THREAD (optional hide-past).
- **New scope surfaced:** benchmarks as a subsystem (any-schema→benchmark, catalog, admin CRUD, profile linkage), templates (block/schema reusables, value-copy on insert), the publish mechanism. Recorded as scope expansion vs the roadmap's "seed ≥25".
- **Founded** the initiative (charter/plan/state/decisions/deferred/discovery). `ACTIVE` stays `primitive-v2`. The designer/UI wave is owner-run, out of planner scope.

**NEXT:** contract-shape spec (plan step 0).

## 2026-06-17 — primitive-v2 closed, repo synced, tail resolved

- Owner merged PR #282 (the primitive-v2 reshape, one wave) and dropped the branch; that session had already done the spec re-freeze + close-out (`docs(primitive-v2): re-freeze spec + initiative close-out`).
- Synced local `main` (fast-forward 07cbcaad..458d5190), pruned the deleted remote, deleted three merged local branches (`feat/primitive-v2-reshape`, `fix/gated-suite-failures`, `fix/timed-test-ui-papercuts`). Local repo clean on `main`.
- Read the final primitive (`reshape-design.md` + `load.ts`): byProfile is now `axes[]` (1–2) + `cells[]` (cartesian, coords-per-axis); intensity trinity (row/schema/block, render overlay row>schema>block); cross-cutting `composition.cap`; interval `work/off {value,unit}`. **Key:** the design doc routes the byProfile + %-of-1RM **resolver to Phase 3** — so it is athlete-core scope, not a wait.
- **Switched `initiatives/ACTIVE` → `athlete-core`** (primitive-v2 closed). Updated charter/plan/state/deferred: no open cross-thread waits; resolver folded into block 1; waves kept coarse per owner directive.

**Still NEXT:** contract-shape spec (plan step 0) — now with the final primitive in hand.

## 2026-06-17 — block 1 (data core) SHIPPED via `/feature` (full)

Executor `/feature` run on `block-1-feature-prompt.md` — the athlete-core data floor. ONE coarse wave; 6 prod commits on `feat/athlete-core-data-core` (+ test/docs/close-out).

- **Built:** Prisma reshape (drop `PerformedExerciseInstance` + the `OneRMRecord`/`PerformedSession` uniques; `startedAt/completedAt → performedAt`; new `PerformedSchemaResult`; `+PlanEnrollment.hidePastBeforeBoarding`; `+AthleteProfile.profileSelections`); 4 contract entities (`result` VO + `one-rm-record` + `performed-session` + `performed-schema-result`); mappers/handlers; 3 athlete write routes (`api/platform/athlete/...`); the pure `resolveLoad` + records/PR derivation libs (fetch-then-compute, N+1-guarded); the coach-metrics migration (`→ performedAt`, window Map holds MAX); the green benchmark chip + editor section.
- **9 build decisions ratified → `decisions.md`:** D-DIST-UNITS, D-TICK-DERIVED, D-PROFILE-SELECTIONS (overrides contract-shapes §1.3 "no storage" — doc fixed), D-RESULT-RELATION, D-RESOLVED-SHAPE, D-SCOPE-PUBLISH (publish OUT of block 1).
- **Process:** research caught a blast-radius the spec understated — the `PerformedSession` reshape fans out through `PerformedByKey` to ~15 coach-metrics files (folded into the wave, migrated semantically). 3 implement waves (Prisma∥Contracts; api-server; platform), per-wave checkpoint commits, orchestrator verified each via `git diff` + check-types/lint (never agent self-report). Review+QA = 0 CRITICAL; 4 integrity WARNINGs proactively fixed (schema↔session link, result-type match, last-activity clamp, result `@@unique`).
- **Gated suite caught one bug** (as intended): a Wave-2 gap — `mapToAthleteProfile` gained `profileSelections` but `admin-user-view.mapper.test.ts`'s loosely-typed fixture omitted it (check-types blind to the loose helper) → `parse(undefined)`. Fixed the fixture (prod always sends null). Reseeded DB, suite GREEN (962 tests).
- **Close-out** (`closeout-before-pr`): decisions/deferred/contract-shapes/plan/state/journal advanced; landed IN the feature PR.

**NEXT:** block 2 — Athlete UX (owner-run UI): plan-as-train view, logging-30s, records/PR, profile + the set-1RM / pick-profile affordances the resolver's `unresolved` shapes feed.

## 2026-06-18 — block 2 screen 1 (Plan Timetable) SHIPPED via `/feature` (full, autonomous)

Executor `/feature` run on `block-2-screen-1-feature-prompt.md` — the athlete plan-timetable on REAL data (the first of block 2's 4 athlete screens). Owner delegated ALL gate decisions ("принимай решения сам, run fully without me"); no blocking gates — every gate self-resolved with logged rationale. 13 commits on `feat/athlete-plan-timetable`.

- **Built (cross-layer slice):** a new `plan-timetable` derived-view contract + read endpoint (`GET /api/platform/athlete/plan-timetable`, `withAthleteAuth`) over a PURE `buildPlanTimetable` (no N+1: 1 enrollment + 1 performed + 1 user query) + a TanStack hook + a mobile-first MUI timetable module (16 files, zero-hex, one-component-per-file) + the athlete nav extension (Records item + `leaderboard` icon + placeholder route) + the page wire. Faithful to the owner-approved Claude Design prototype, built native via theme tokens (no transplanted HTML).
- **8 decisions ratified → `decisions.md` (D-TT-\*):** MULTIPLAN (list endpoint + switcher), SLOT-MODEL (slot/card decoration split for N-session days), SERVER-COMPUTES (view presentation-only), DATES-ABSOLUTE (the tz fix), NO-COACHING-EDGE (overrode the design's backward-import — the `api-server-lms-no-coaching` dep-cruiser rule would have failed pre-push `dep:check`), SHELL, DESKTOP (responsive column, not the prototype's aside rail).
- **Review + QA = 0 CRITICAL.** Both independently flagged a device-tz off-by-one in the date display (reproduced "Jun 14–20" vs "Jun 15–21" under LA) — fixed at the source: the server emits an absolute `dayOfMonth`, the client formats the week-range in UTC + reads the weekday from the `dayOfWeek` enum. Also fixed QA-004 (planId-keyed switcher state vs array-index), QA-005 (default to the first NON-empty plan), and removed dead code. Commit `6c97dcdc`.
- **Tests 70/70 green:** contract 16 + builder 24 (pure, tz-stable across UTC±) + presentation 13 + component 8 + integration 9 (live dev DB, self-fixturing, no-N+1 verified by `vi.spyOn`). No destructive `db:reset` needed — the slice is additive (no schema change) and the integration test creates + cleans its own data.
- **Process:** 8 task-commits in dependency waves (contract → builder/nav → endpoint/hook → ui → route/page), each orchestrator-verified via `git diff` + check-types/lint (never agent self-report). The D-A12 backward-import override proved load-bearing — it aligns with an existing dep-cruiser rule that pre-push enforces.
- **Close-out** (`closeout-before-pr`): decisions/deferred/state/journal/plan advanced; landing IN the feature PR.

**NEXT:** block 2 screen 2 — the session / workout view (read-only blocks→schemas→rows, the `ResolvedLoad` 4-variant render, the benchmark green chip + "Log result" / "Mark completed"). The timetable card-tap stub (`onOpenSession`) is the entry point.
