# 0038. Remove the inert scoring axis + `freezeLoadsAtCreation` stub (partially supersedes 0037 §Deferred)

- **Status:** Accepted (partially supersedes ADR-0037 §Deferred — the _present-but-inert scoring axis_ clause only; reverses the `docs/roadmap.md` Phase-6 `freezeLoadsAtCreation` stub)
- **Date:** 2026-06-08
- **Deciders:** Maksim (owner), Claude (co-owner)
- **Tags:** `lms`, `plan-content`, `domain-model`, `yagni`

## Context

The compose-only plan-content model (ADR-0037) shipped two surfaces **present-but-inert** — valid and stored at author time, but with no engine that ever reads the stored value:

1. **The `scoring` axis** — the 5th Container axis. `scoringDirectiveSchema` (6-variant discriminated union: `prescribed` / `amrap` / `for_time` / `max_in_remaining` / `total` / `progressive`) + `scoringConditionSchema` (`appliesToRounds`). ADR-0037 §Deferred parked the scoring/execution layer "to a separate later phase" and pinned the inertness with **type + test, not a comment** — two guard-test files existed _solely_ to assert that no code computes a score. The axis additionally grew a full inert-render fork in `plan-detail`: a dashed `InertScoringChip`, a `tone: "active" | "inert"` discriminator forking every composition-summary consumer (incl. the per-card HOT PATH `schema-card-meta`), a `hasScoringSemantics` disjunct in the `should-be-container` heuristic, a `scoring.kind.*` coverage-cell quartet, a scoring axis editor field + info-note the coach could fill that did nothing, and lossy round-trip mappers (`mapScoring` / `scoringFromComposition`).

2. **`freezeLoadsAtCreation`** — a `Boolean @default(false)` column on `Session`, stubbed for a Phase-6 "freeze percentage loads to absolute kg at session creation" engine. It threaded the contract (`sessionSchema` + `createSessionSchema`), the mapper (passthrough), the admin write spreads, the seed canonical schema + emitters, one coverage cell, and one gated coverage assertion. **No reader of the value existed anywhere in business logic.** Its UI chip (`SessionFreezeFlag`) had already been removed.

Both are pure carrying cost with **zero product value today**. Each plan-editor refactor (the redesign initiative propagates to all three apps) paid the `tone`-fork tax and the scoring-mapper-correctness tax; every contract reshape dragged six inert directive variants + a condition VO; the gated ~10-minute seed-coverage suite carried a freeze/scoring seeding obligation. Inert stored surface designed against a 2026-06 guess is the wrong shape to retrofit when the real engine is built.

This is a deliberate **reversal of two ratified decisions** (ADR-0037's present-but-inert scoring-axis clause; the roadmap Phase-6 freeze stub). YAGNI: re-introduce fresh when the engine actually lands, not as a stored-but-inert axis.

## Decision

Remove both inert stubs entirely.

- **The scoring axis is deleted.** `scoringDirectiveSchema` / `scoringConditionSchema` / `SCORING_DIRECTIVE_KINDS` / `ScoringDirective` / `ScoringDirectiveKind` / `ScoringCondition` leave `@repo/contracts`; `scoring` leaves the `.strict()` `compositionSchema`. The Container axis model goes **5 → 4**: `repetition` · `arrangement` · `rest` (+ the thin `programKind` classifier). The inert-render fork collapses — `CompositionSummaryPart.tone` is **dropped** (single-valued after scoring leaves = dead abstraction), `InertScoringChip` and the scoring axis editor field/note are deleted, and `should-be-container` no longer keys on scoring.
- **`freezeLoadsAtCreation` is deleted** from the contract, mapper, admin writes, seed, coverage, and the Prisma `Session` column.
- **Re-introduce fresh, not inert.** When Phase 5 (scoring/execution) and Phase 6 (freeze snapshot) actually build the engine, the shape is designed against the real execution model — not resurrected from this 2026-06 inert guess.

Migration is aggressive and bridge-free (no users, non-prod Neon, solo dev): the column drop is applied by the owner via `db:push` + reseed; no `migrations/` (per ADR-0019).

## Consequences

- **Partial supersede of ADR-0037, narrow.** Only the §Deferred _present-but-inert scoring axis_ clause and the axis-list's `scoring` member are reversed. The compose-only model, the emergent-archetype principle, the **other four axes**, the sacred Week/Day/Session/Block/Schema tree, and all Json value-objects stay **fully in force**. ADR-0037 is otherwise intact.
- **Out of scope (still deferred).** The rest of ADR-0037's deferred scoring/execution layer that is _not_ the scoring axis — notably the **parallel-track interleave** inert surface (`arrangement.parallel.interleaveOrder`) — is **not** removed here. It remains present-but-inert under ADR-0037; only the scoring axis + freeze stub are excised. A future decision can revisit it.
- **Contract tightens.** `.strict()` `compositionSchema` now rejects any payload/stored row carrying a `scoring` key. Stale stored `scoring` keys on pre-existing rows fail parse on read — cleared by the owner's reseed (non-prod, no real data).
- **Coverage shrinks by 5 cells** (4 `scoring.kind.*` + 1 `entity.sessionFreeze`); `requiredCellIds` + the gated `freezeLoadsAtCreation=true` assertion are removed in lockstep. The gated seed-coverage suite re-greens on a freshly reseeded scoring/freeze-free DB.
- **Initiative decision logs are superseded forward, not edited.** `D-SCORING-INERT` / `D-SCORING-RENDER` / `D-PHASE5-SCORING` (in `initiatives/plan-editor-compose/` + `compose-hardening/`) and the `docs/roadmap.md` Phase-5/6 scoring/freeze lines are append-only ratified records / orientation docs — this ADR is their forward-looking reversal (the same mechanism by which ADR-0037 superseded the archetype catalog without editing `analysis/`). They are left as history.
- **Blast radius ~50 files** across `contracts` + `platform` + `api-server` + Prisma + seed — not a blocker (no users, nothing to migrate), exactly as ADR-0037 framed its own removal.
- **`analysis/06-formalization/` is untouched** (frozen history per ADR-0037); its `freezeLoadsAtCreation` mentions stay as a dated formalization record. The totality grep is scoped to living code (`apps/` + `packages/`).
