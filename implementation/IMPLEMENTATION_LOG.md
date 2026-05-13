# Implementation Log

> Append-only log of executed steps. Newest at the top.

## Entry format

```
## Step NN — <short title>

- **Date**: YYYY-MM-DD
- **Feature-dev artifacts**: `.feature-dev/<ts>/` (if `/feature` was used)
- **Prompt**: `implementation/step-NN/prompt.md`
- **Output**: `implementation/step-NN/output.md`
- **Summary**: 3-5 lines on what changed.
- **Open questions**: bullets raised during execution, status (resolved/deferred).
- **Deferred decisions**: deliberately postponed items.
- **Analysis/-files touched**: paths under `analysis/artifacts/05-synthesis/` or `06-formalization/` updated this step (or "none").
- **Smoke-test status**: passed/blocked/not applicable.
```

---

<!-- entries appended below this line, newest first -->

## Step 02 — Prisma Schema Port + Archetype Seed

- **Date**: 2026-05-13
- **Feature-dev artifacts**: `.feature-dev/1778644165/` (`research.md` + `review.md`)
- **Prompt**: `implementation/step-02/prompt.md`
- **Output**: `implementation/step-02/output.md`
- **Summary**: Training-domain срез из `analysis/artifacts/06-formalization/schema.prisma` ported into `packages/api-server/prisma/schema.prisma` — 11 enums + 14 models + 3 back-relations on existing `User`/`TrainingPlan`. `OneRMRecord.valueKg` = `Decimal @db.Decimal(6, 2)`. All `@@map("training_*")`. 34 canonical archetypes seeded (split into 4 family files per ESLint `max-lines: 300`). Exercise/Label tables empty per D4. `prisma format/validate/generate` ✓, `db:reset + db:seed` ✓, 16/16 workspaces type-check + lint clean, 728/728 tests passed.
- **Open questions**:
  - **`db:reset` script ≠ auto-seed** in this repo. Real script = `prisma db push --force-reset && tsx scripts/apply-sql-checks.ts`. Executor compensated by calling `db:seed` separately. Implication for future prompts: when planner says "db:reset" assume it needs explicit `db:seed` follow-up.
  - **`archetypeParamsSchema` source = `types.ts` `ArchetypeParams` discriminated union** (not `implementation-notes.md` — that file covers only 2/34 archetypes in full template form). Acceptable derivation per Step 1 ratification; not fabrication.
- **Deferred decisions**:
  - `Exercise` / `Label` seed — Step 3 / Step 4 implement via admin UI (D4).
  - `Week / Day / Session / Block / Schema / SchemaRow` content seeding — out of scope per D3 (full-schema port ≠ full content seed).
  - `OneRMRecord / PerformedSession*` seeding — out of scope (athlete-flow out).
  - `citext` migration for case-insensitive uniques — explicit defer; current lowercase-mirror pattern stays.
  - Versioned migrations directory — per ADR-0019, not maintained during workflow.
- **Analysis/-files touched**: none (Step 2 is pure port, no model refinement).
- **Smoke-test status**: passed (db:reset + db:seed, table populations verified: archetypes=34, exercises=0, labels=0, training\_\*=0, users=13, lms_training_plans=4).

## Step 01 — Model Ratification

- **Date**: 2026-05-12
- **Feature-dev artifacts**: N/A (no `/feature`; pure docs/spec edit)
- **Prompt**: `implementation/step-01/prompt.md`
- **Output**: `implementation/step-01/output.md`
- **Summary**: Applied D1-D4 ratifications across 6 analysis-artifacts. `schema.prisma` got `Week` model + `DayOfWeek` enum + stub `User`/`TrainingPlan`, `Day` rewritten (drop `order`, add `weekId`+`dayOfWeek`), `Athlete` model removed, FK `athleteId→userId` on `OneRMRecord`/`PerformedSession`. ER-diagrams synced; `implementation-notes.md` got dated §0 with ratifications + OPEN-items closed. `types.ts` minimal cleanup. Validated via `prisma format`.
- **Open questions**:
  - **Memory entries про прошлые попытки** (ADR-0037/0041/0042/0043 + feedback_coach_always_edit_mode) — executor surfaced без halt; cleanup requested via user approval (this conversation turn).
  - **Order semantics divergence** — pre-existing inconsistency between `er-final.md §5 #7` (sparse 10/20/30, Phase 4 Q6 ratified) and `PLANNING_STATE.md` deferred-default (sequential 1,2,3). Resolved: `PLANNING_STATE.md` reverts to **sparse 10/20/30** per Phase 4 Q6. No analysis-artifact edit needed (Phase 4 Q6 was already ratified). To be reflected in Step 2 seed.
- **Deferred decisions**:
  - Pseudocode rewrite of `implementation-notes.md §3.5 resolveDualValue` / §3.8 resolveHrZoneToBpm — requires finalized AthleteProfile columns (Phase 8+).
  - Real Prisma client regeneration — happens in Step 2 (port to `packages/api-server/prisma/schema.prisma`).
  - 149-exercise / 19-label starter-pack delivery format (CSV import in admin? on-demand seed command? manual entry?) — Step 2+ decides.
- **Analysis/-files touched**:
  - `analysis/artifacts/06-formalization/schema.prisma`
  - `analysis/artifacts/06-formalization/er-final.md`
  - `analysis/artifacts/06-formalization/implementation-notes.md`
  - `analysis/artifacts/06-formalization/types.ts`
  - `analysis/artifacts/05-synthesis/domain-model.md`
  - `analysis/artifacts/05-synthesis/er-diagram.md`
- **Smoke-test status**: N/A (no UI/runtime impact).
