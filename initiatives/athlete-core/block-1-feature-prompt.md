# athlete-core — block 1 (data core) — `/feature` (full) prompt

**For the executor session.** This is ONE coarse wave (owner directive — no atomic splitting). Wrap it via `/feature` (full). You implement to the specced shapes; you do NOT re-derive the model or re-open the domain — the decisions are ratified.

## What this wave is

The athlete-core data core: redesign the `Performed*` / `OneRMRecord` stubs FROM SCRATCH against the (now final) primitive, plus the load resolver, records derivation, the date-thread, and the benchmark marker. Backend + contracts only — NO athlete UI (that's block 2, owner-run). It is the data floor the athlete UX and coach metrics stand on.

## Read FIRST (trust these over re-deriving; verbatim quoted inside)

1. `initiatives/athlete-core/contract-shapes.md` — **THE spec.** §1 (shapes), §3 (Performed\* locked), §4 (touch-points), §5 (adversarial pass). §0 lists every verbatim source already verified.
2. `initiatives/athlete-core/decisions.md` — the ratified "why" (D-LAYERS, D-STATS, D-RESULT-TYPES, D-PUBLISH-MODEL, D-BENCHMARK-MARKER, D-LOGGING-MINIMAL, D-LOAD-RESOLVE).
3. The entity PATTERN to mirror exactly: `packages/contracts/src/entities/lms/plan-enrollment/` (schema/create + api.schema + constants + types + index) + the lms entities barrel; and the wiring path (mapper → `lmsXApi` handler → Next route via `createAuth*Handler` + `withAthleteAuth`/`withCoachAuth`).
4. `initiatives/primitive-v2/reshape-design.md` — the FINAL primitive (byProfile axes/cells, intensity trinity, cap, interval units) you build against.

## Scope (build to contract-shapes §1 + §3)

- **Result types** (`result.ts`) — the 6-type discriminated union + `RESULT_DIRECTIONS`.
- **`OneRMRecord` → history** — drop `@@unique([userId,exerciseId])`, add the history index; new `one-rm-record` contract entity; current 1RM = derived max; Decimal→number in the mapper.
- **`Performed*` redesign** — `PerformedSession` (drop the unique, single `performedAt`, keep notes); a `PerformedSchemaResult` (benchmark result per the 6 types, attached to the performed schema). NO `PerformedExerciseInstance` (D-LOGGING-MINIMAL). New athlete-side contract entities + routes under `api/platform/athlete/...` via `withAthleteAuth`.
- **Load resolver** (`lib`) — `absolute`/`bodyweight`/`percentage` (HWPO: have-1RM→kg; missing→`unresolved` + set-1RM path that writes a `MANUAL` OneRMRecord and re-resolves) / `byProfile` (**pick-once-remembered on the current free-string axes** — do NOT build a profile catalog; that's a later library wave).
- **Records / PR derivation** (`lib` + query) — best-of by direction; PR flag; the result time-series. (Leaderboard is a later wave — not here.)
- **Date-thread** — `PlanEnrollment.hidePastBeforeBoarding` (default false) + the contract field; the athlete plan-view read-filter is block 2, but the field + flag land here.
- **Benchmark marker** — `composition.benchmark { resultType } | null` (rides beside `cap`); a GREEN chip beside the cap chip via a THEME token (no hex). This is the only primitive touch — ratified (D-BENCHMARK-MARKER).

## Sacred / constraints (do NOT cross)

- **Channels rule (D-5):** every typed field has a live reader NOW (§5 adversarial pass confirms each). No inert field.
- **D-LOGGING-MINIMAL:** no per-exercise actual load/reps. Do not resurrect `PerformedExerciseInstance`.
- **byProfile = pick-once on free axes; NO profile catalog/union here** (deferred library wave).
- **Primitive touch is ONLY `composition.benchmark`** — nothing else in the primitive moves.
- **`db:reset` world** — no migration files; aggressive, bridge-free; only the final pushed tree green (ADR-0019).
- Coarse ONE wave — the data model is one connected design; don't split it.

## Out of scope (explicit)

Athlete UI (block 2, owner-run) · coach honest-metrics + reconcile cron (block 3) · per-row actuals · profile/benchmark/template catalog + leaderboard (the library wave) · subscription/billing (Phase 5) · in-workout timers/scoring engine (post-MVP).

## Acceptance

- The new contracts round-trip (schema ↔ mapper ↔ handler) for every entity.
- `Performed*`/`OneRMRecord`/benchmark-marker/date-thread shapes match contract-shapes §1+§3 verbatim.
- The gated api-server suite is GREEN on a reseeded DB; `check-types` + `lint` clean.
- Close-out docs land IN this feature PR (board/journal advanced) — not a follow-up commit.

## Process

`/feature` (full), one wave. Orchestrator reviews via `git diff`, never agent self-report. `db:reset` world, no migrations. ≤1 full `/feature` per session.
