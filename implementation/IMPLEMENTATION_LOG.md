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

## Lesson learned (planner discipline)

**Strike pattern surfaced during Step 3** — six (6) deviations between prompt-spec and codebase patterns, all on the same dimension: my prompt encoded "TS best-practice instincts" rather than reading the codebase. Each was caught by the executor at Stage 1 / Stage 2 of `/feature` and resolved via rule 4 ("existing patterns are sacred"):

1. **D2** — server-side pagination spec vs codebase client-side (`z.array(entity)` cap=100 + `DataTable` client-paginate).
2. **D3** — multi-select `DataTableFilter` spec vs codebase single-value primitive (multi extension would touch shared `@repo/ui`).
3. **D4** — `.toISOString()` Date marshalling spec vs codebase raw `Date` + RSC payload.
4. **D7** — backend ILIKE search spec vs codebase client-side `Column.searchValue`.
5. **D10** — `Stack spacing={4}` per global memory vs project codebase `{3}` (41/61 occurrences).
6. **D11** — `z.nativeEnum(Equipment from @prisma/client)` spec vs `.dependency-cruiser.cjs` `contracts-no-prisma` rule + codebase mirror+bridge pattern (per `BLOG_CATEGORY` precedent).

**Rule for Step 4+ prompts**: before specing any cross-package boundary (mapper output, contract schema, API response, client API type, form field, list/filter/search behaviour, sidebar config), the planner **reads 2-3 canonical implementations verbatim** and quotes the pattern in the prompt with file paths + line ranges. No "TS best practice" instincts. Rule 4 supersedes any external convention. The executor's Stage 1 RFC should not be the first time codebase compatibility is checked — the prompt should already align.

**Step 3's `apps/admin/src/modules/exercises/` is now the canonical reference** for catalog-library admin CRUD (Step 4 Label CRUD, future entity catalogs).

---

## Step 03 — Admin Exercise CRUD (with Phase 0 D5 refinement)

- **Date**: 2026-05-13
- **Feature-dev artifacts**: `.feature-dev/1778666831/` (research.md, design.md, plan.md, review.md, qa.md, tasks.md)
- **Prompt**: `implementation/step-03/prompt.md`
- **Output**: `implementation/step-03/output.md`
- **Summary**: Phase 0 ratified D5 (`Exercise.defaultDemoUrl String?` → `defaultDemoUrls String[]`) across analysis-artifacts + real schema; `db:reset+seed` clean. Phases 1-7 shipped first user-visible admin CRUD: contracts (mirrored enums per dep-cruiser `contracts-no-prisma` rule), backend handlers with `P2002`/`P2003` intercepts, 4 admin routes, client API + TanStack hooks, admin module (form split into 4 sub-cards + 2 helpers per `react/no-multi-comp`), 3 pages, new `Library` sidebar group. Stage 5/6 hardening: NFKC normalize + zero-width strip, http(s)-only URL scheme refine, length/array caps (`MAX_URL_LENGTH=2048`, `MAX_NOTES_LENGTH=10_000`, `MAX_ARRAY_LENGTH=20`), cross-field placeholder consistency refine. 12 commits on `feat/training-domain` (HEAD `51302f93`). 753 tests passing (+25); type-check/lint/dep:check all 16/16 green.
- **Open questions**:
  - **Memory hygiene** flagged by planner this turn — `feedback_localized_helper.md` is admin-v4 cross-pollution; `feedback_pattern_compliance.md` Stack spacing should note discipline-specific `{3}` override. Both pending user approval.
  - **Browser smoke-test** scenario documented in `step-03/output.md` §"Сценарий смоук-теста"; awaiting user execution.
- **Deferred decisions** (from executor's Stage 6 QA):
  - **QA-008** server-side pagination — defer until library > ~500 entries; cross-cutting refactor on all admin CMS endpoints simultaneously.
  - **QA-010** `canonicalCompoundType × placeholderFlag` dual-encoding collapse — long-term schema migration (drop flag, derive on read).
  - **QA-011** `ConfirmationModal` stuck open on delete-error — project-wide pattern in `useDeleteConfirmation`; fix once for all modules.
  - **QA-012** Server-validation errors not inline on input — project-wide; centralized fix in `createCrudHooks` `setError` chain.
  - **`aliases Json? → String[]`** schema migration — bounded `as string[] | null` narrowing in mapper this step; future symmetry with `defaultDemoUrls`.
  - **`defaultLoad` UI surface** — nullable in schema; no form input this step; future schema-extension step.
  - **Multi-select `DataTableFilter` primitive** — `@repo/ui` extension; needed by plan-builder picker (Step 9+).
  - **`stress-final.md` / `00-meta/phase-06-prompt.md` stale `defaultDemoUrl` mentions** — out-of-scope per prompt §2/§3; paper trail in output.md.
  - **Production rollout workflow** — separate ADR when prod migrates off Neon dev.
- **Analysis/-files touched**: `06-formalization/{schema.prisma, implementation-notes.md, er-final.md}` (Phase 0 D5 refinement only).
- **Smoke-test status**: passed (2026-05-13). 10 of 11 scenario steps green on first run; step 8 (cross-field refine UX) silently failed — refine fired at resolver but Switch field did not surface error. Fixed inline via commit `919b836d fix(exercise): surface cross-field refine error on placeholder flag toggle` (`classification-card.tsx` placeholderFlag Controller now subscribes to `fieldState` and renders error in `FormHelperText`, matching the `canonicalCompoundType` Select pattern in the same file). Re-test passed both directions (PLACEHOLDER+off and ATOMIC+on). Step 3 fully closed.

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
