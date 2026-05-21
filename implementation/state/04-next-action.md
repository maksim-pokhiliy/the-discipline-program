# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Status: Step 8.3.6 CLOSED 2026-05-21

`@@unique([schemaId, order])` shipped on the `SchemaRow` Prisma model — DB-level positional-uniqueness enforcement, the structural mirror of Step 7.3.6 (`Block`). 1 atomic commit `b32fd892` (5 files, +41/−0) — the constraint + the `analysis/` sync (`schema.prisma` mirror, `er-final.md` invariant #12, `implementation-notes.md` § 4.11) + 1 P2002-floor test. Review-Light APPROVED (0 findings); `pnpm check-types` 16/16 (planner re-ran); `pnpm test` 1692/1692; `db:reset`+`db:seed` clean; scope confined.

**The load-bearing finding — `lmsSchemaRowApi.reorder` was NOT rewritten.** The session brief + the prior `04-next-action.md` assumed a single-pass reorder needing a two-pass rewrite (mirroring Step 7.3.6's _outcome_). Verbatim-read at thesis time + `git blame` corrected it: the method was shipped two-pass in Step 8.1b (`e1091719`). The flavour-(h) intra-tx trace ran upfront and confirmed the constraint compatible with zero changes; `schema-row/admin.ts` is byte-identical (D-8.3.6-3). **This is the carry-forward lesson into 8.3.7 — see the OQ surface below.** Full entry: [../log/step-08.3.6.md](../log/step-08.3.6.md).

## Next planner action: Step 8.3.7 thesis cycle — the `Schema` partial-unique constraint

The last Step 8 infrastructure sub-step before the **8.4 anchor**. `Schema` has a dual scope: a **top-level** schema (`parentSchemaId IS NULL`) is positioned within its `Block`; a **sub-schema** (`parentSchemaId IS NOT NULL`) is positioned within its parent `Schema`. The positional-uniqueness invariant therefore needs **two** constraints, each with a different enforcement mechanism:

- **Sub-schemas** — `@@unique([parentSchemaId, order])` in the Prisma DSL. Postgres treats every `NULL` as distinct, so top-level rows (all `parentSchemaId = NULL`) are naturally excluded — this constraint binds only sub-schemas.
- **Top-level schemas** — a **partial unique index** `schemas_block_top_order` on `(blockId, order) WHERE parent_schema_id IS NULL`, added to `apply-sql-checks.ts` / `lms-checks.sql`. Prisma's `@@unique` cannot express a `WHERE` predicate, and a plain `@@unique([blockId, order])` would be **wrong** — sub-schemas also carry `blockId` (non-nullable), and two sub-schemas of different parents in one block legitimately share `order` values; a block-wide unique on `(blockId, order)` would reject them. The top-level uniqueness must be partial.

Step 8.3.7 ships both + a `db:reset`/`db:seed` + the `analysis/` sync + tests. `/feature small` per the queue. A Prisma schema change **and** an `apply-sql-checks.ts` touch.

**The load-bearing flavour — (h) `[[planner-mutation-invariant-trace]]`, again.** Both constraints fire immediately on every row UPDATE. `lmsSchemaApi.reorder` must be traced intra-transaction against **both** — and across **both scopes** (a reorder call operates on top-level schemas within a block, or on sub-schemas within a parent).

**Thesis OQ surface (8.3.7's to ratify):**

- **`lmsSchemaApi.reorder` — verbatim-read FIRST, do not assume a rewrite.** _Hypothesis:_ `lmsSchemaApi.reorder` was shipped two-pass in Step 8.1a (`01-step-queue.md` Completed — "`lmsSchemaApi` (CRUD + two-pass reorder …)"), so — exactly like `lmsSchemaRowApi.reorder` in 8.3.6 — it is **probably already constraint-compatible with no rewrite**. **Do not let the "mirror Step 7.3.6" framing carry 7.3.6's rewrite outcome as an assumption** — that is the precise 8.3.6 lesson. Read `packages/api-server/src/endpoints/lms/schema/admin.ts` `reorder` verbatim at thesis time, run the intra-tx trace, and additionally confirm the **dual-scope** handling: the reorder must two-pass correctly whether it renumbers a block's top-level schemas or a parent's sub-schemas. Decide rewrite-vs-no-rewrite from the verbatim read, not the brief.
- **The two constraints + two mechanisms.** _Hypothesis:_ `@@unique([parentSchemaId, order])` in `schema.prisma` (placed before the existing `@@index([parentSchemaId, order])` — the 8.3.6 / `Block` pattern) + a `schemas_block_top_order` partial unique index appended to `lms-checks.sql` (`CREATE UNIQUE INDEX IF NOT EXISTS … ON training_schemas ("blockId", "order") WHERE "parentSchemaId" IS NULL` — the idempotent form the existing `plan_enrollment_unique_active` partial index uses). Verbatim-read the `Schema` model + `lms-checks.sql` + `apply-sql-checks.ts` at prompt-write.
- **`analysis/` sync.** _Hypothesis:_ `06-formalization/schema.prisma` mirrors only `@@unique([parentSchemaId, order])` (the analysis spec is Prisma-DSL-only — the existing SQL partial indexes `idx_single_head_coach` / `plan_enrollment_unique_active` are **not** in it); the partial index is recorded textually in `er-final.md` § 5 (a new invariant #13 — the dual-scope uniqueness) + `implementation-notes.md` (a new § 4.12). `domain-model.md` + stress files untouched (engineering enforcement, not domain-semantics — mirror 8.3.6 / 7.3.6).
- **Tests.** _Hypothesis:_ two P2002-floor cases — a sub-schema duplicate `(parentSchemaId, order)` rejected `P2002` (the Prisma `@@unique`), and a top-level duplicate `(blockId, order)` with `parentSchemaId = NULL` rejected `P2002` (the partial index) — plus a re-run of the existing `lmsSchemaApi.reorder` tests unmodified. Decide at thesis whether the partial index needs its own raw-insert floor case distinct from the Prisma `@@unique` one.
- **`apply-sql-checks.ts` + `db:reset` — WORKFLOW-001 echo.** _Hypothesis:_ the new partial index is seed-safe — the seed has zero `Schema` inserts (mirror the 8.3.6 `SchemaRow` zero-inserts finding; verify at prompt-write). WORKFLOW-001 (the `idx_single_head_coach` collision) was resolved inline in Step 8.1c (D13 SUPERSEDED); the new `schemas_block_top_order` index is on a different table and does not re-open it.

**Reference points to read at 8.3.7 prompt-write time:**

- `implementation/step-08.3.6/prompt.md` + `log/step-08.3.6.md` — the immediate precedent (the constraint + analysis-sync + P2002-floor structure; the verbatim-read-before-assuming-a-rewrite lesson).
- `implementation/step-07.3.6/prompt.md` — the original constraint precedent.
- `packages/api-server/prisma/schema.prisma` — the `Schema` model (`model Schema` ~line 687; `@@index([parentSchemaId, order])` is the `@@unique` neighbour).
- `packages/api-server/prisma/sql/lms-checks.sql` — the partial-index file (3 existing entries; `plan_enrollment_unique_active` is the partial-unique form to mirror) + `prisma/scripts/apply-sql-checks.ts` (the runner).
- `packages/api-server/src/endpoints/lms/schema/admin.ts` — `lmsSchemaApi.reorder` (verbatim — the 8.3.6 lesson: read it before assuming) + `schema/admin.test.ts` (the test surface).
- `analysis/artifacts/06-formalization/{schema.prisma, er-final.md, implementation-notes.md}` — the `analysis/` sync targets.

**Walkthrough gate (8.3.7).** A backend/DB step — the thesis walkthrough describes the **final coach UX** the dual constraint serves: what the coach would otherwise see if two schema-order edits raced (a duplicated or lost schema position) at **both** levels — the schemas inside a block, and the sub-schemas inside a `NESTED` schema — and how the constraints keep both lists consistent on reload. Screen-only language per `[[coach-daily-ux-priority]]`; no DB / constraint / P2002 / partial-index vocabulary in the coach view.

## Carry-forwards into the 8.3.7 thesis

- **QA-B4 — `lmsSchemaApi.reorder` without `retryOnP2034`** (`03-deferred.md` "Step 8.1a follow-ups", WARNING). 8.3.7 re-touches the `lmsSchemaApi.reorder` zone (the verbatim read, possibly nothing more). _Hypothesis:_ keep QA-B4 deferred — 8.3.6 did not fold its adjacent QA-W2 into the constraint step; 8.3.7 mirrors that scope discipline (constraint + tests, not a `retryOnP2034` retrofit). Decide consciously at thesis-time.
- **QA-001c** — now also covers `lmsSchemaRowApi.create` (updated at 8.3.6 close-out); after 8.3.7, `lmsSchemaApi.create` joins the list (it too will sit under a uniqueness constraint). A codebase-wide `/fix` carry-forward; not 8.3.7 scope.
- **QA-001b — `Session @@unique([dayId, order])`** — the adjacent sibling latent surface (`03-deferred.md` "Pre-Step-8 cleanup"). Not `Schema`, not 8.3.7 — the same mirror pattern when scheduled.
- **The `analysis/` sync rules** — 8.3.7 is a Prisma schema change → it follows the WORKFLOW.md `analysis/` sync protocol.

## Process reminders (active)

- Thesis = two voice-coded sections (coach view + developer view) per `[[thesis-format]]`; the coach view carries the mandatory 1-paragraph walkthrough per `[[coach-walkthrough-gate]]`, screen-only per `[[coach-daily-ux-priority]]`.
- Prompt spec-only per `[[planner-strategic-level]]` — § 0 verbatim quotes of existing code; no prescriptive new-code skeletons in § 3.
- Flavour (h) `[[planner-mutation-invariant-trace]]` is load-bearing for 8.3.7 — trace `lmsSchemaApi.reorder`'s intra-transaction UPDATE sequence against **both** constraints and **both** scopes; **read the method verbatim before assuming a rewrite** (the 8.3.6 lesson — a "mirror step M" framing must not carry M's outcome as a given).
- Flavour (e) `[[husky-cross-package-squash]]` — 8.3.7 is likely single-package (`@repo/api-server` — Prisma schema + `lms-checks.sql` + the endpoint/tests + the `analysis/` mirror); an additive `@@unique` + partial index is likely per-layer atomic, one commit, no squash — confirm fan-out at § commit-strategy.
- Flavour (c) `[[planner-verbatim-registration]]` — the § 0.A grep enumeration should be **exhaustive** or explicitly marked **non-exhaustive** (the 8.3.6 § 0.A grep-1 was abbreviated again — Step 7.3.6 Q-1's adjacent refinement; apply it in 8.3.7).
- `/feature small`, `feat/training-domain` long-lived branch, no branch cut.

## After Step 8.3.7 close-out

Per [01-step-queue.md](01-step-queue.md) execution order: 8.3.7 → **8.4 anchor** — the ArchetypePicker UI shell + Schema CRUD wire-up in `plan-detail` + the first 2 `archetypeParams` forms hand-rolled (`n-rounds` + `amrap-flat`) + the RestSpec sub-editor. The first coach-visible Schema editor end-to-end; `/feature` full. Then **9.1..9.11 row editor** → **8.5..8.20 archetype expansion** → 10.
