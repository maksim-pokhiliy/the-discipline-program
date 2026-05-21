# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Status: Step 8.3.5 CLOSED 2026-05-21

The block read surface shipped — `blockSchema` widened with the recursive `schemas: SchemaWithBody[]` depth-2 embed + the sibling `alternatingGroups[]` embed; `mapToBlockWithSchemas` assembles the tree; the `week/admin.ts` include and `DAY_INCLUDE` were widened identically (D-8.3.5-4 — the Step 7.3.5 D-1 dual-consumer recurrence averted). 1 cross-package squash commit `2ee659cd` + output docs. Review-Light APPROVED (0 CRITICAL/WARNING, 1 closed INFO); `pnpm check-types` 16/16 (planner re-ran); `pnpm test` 1691/1691; scope confined. One deviation — OQ-1, the D-8.3.5-2 `SchemaWithBody` wiring (the `z.infer` literal does not compile for a recursive schema; one canonical exported type pinned by `z.ZodType<…>` — intent preserved, Review-Light-verified sound). The block read surface is complete end-to-end. Full entry: [../log/step-08.3.5.md](../log/step-08.3.5.md).

## Next planner action: Step 8.3.6 thesis cycle — `SchemaRow @@unique([schemaId, order])` + reorder two-pass

A Prisma constraint step — the structural mirror of Step 7.3.6 (Block `@@unique([sessionId, order])` + the `lmsBlockApi.reorder` two-pass rewrite). `SchemaRow` carries `@@index([schemaId, order])` but no `@@unique` — two rows in one schema can collide on `order` under a concurrent write. Step 8.3.6 adds `@@unique([schemaId, order])` and rewrites `lmsSchemaRowApi.reorder` to the two-pass shift-to-negative pattern. A Prisma schema change → `db:reset` + `db:seed` + `analysis/` sync (`schema.prisma`, `er-final.md`, `implementation-notes.md`). `/feature small` per the queue.

**The load-bearing flavour — (h) `[[planner-mutation-invariant-trace]]`.** A Postgres unique constraint fires immediately on every row UPDATE (not `DEFERRABLE` by default). `lmsSchemaRowApi.reorder` (shipped Step 8.1b — array-form `$transaction([...])`) currently does a single-pass UPDATE sequence; a swap reorder (`[A=10, B=20]` → `[B=10, A=20]`) collides on the first UPDATE — **intermediate-state P2002**, even though the final state is valid. Step 7.3.6 hit this mid-execution (its § 5 adversarial pass wrongly stated "no violation possible"); **8.3.6's thesis must spec the two-pass reorder from the start** — this is the exact flavour-(h) anti-precedent, do not repeat it.

**Thesis OQ surface (8.3.6's to ratify):**

- **The two-pass reorder, specced upfront.** Hypothesis: rewrite `lmsSchemaRowApi.reorder` to the canonical two-pass pattern within its `$transaction` — Phase 1 stages every row to a safe negative offset (`-(i+1)`), Phase 2 moves each to its final position (`(i+1)*10`), so no intermediate UPDATE collides. Verbatim mirror of the Step 7.3.6 `lmsBlockApi.reorder` rewrite (`85866ba1`). Confirm the current `lmsSchemaRowApi.reorder` form at prompt-write (array-form vs interactive tx — QA-W2 says array-form).
- **`@@unique` placement.** Hypothesis: `@@unique([schemaId, order])` added before the existing `@@index([schemaId, order])` in the `SchemaRow` model, both retained — the Block/Week/Day canonical pattern (7.3.6 — Prisma generates a separate unique index + the plain index).
- **QA-W2 — in or out of scope.** The reorder rewrite re-touches `lmsSchemaRowApi.reorder` — the exact method QA-W2 flags (the array-form `$transaction` cannot embed a `plan.deletedAt` re-check). Hypothesis: keep QA-W2 deferred — 8.3.6 mirrors 7.3.6's scope (constraint + two-pass + 2 tests), and 7.3.6 did not fold the plan re-check into the reorder rewrite; QA-W2 belongs to the QA-W1/W2 `/fix` bundle. Decide consciously at thesis-time and state it.
- **Tests.** Hypothesis: mirror 7.3.6's two new cases — a direct P2002-floor case (a raw duplicate `(schemaId, order)` create rejected `P2002`) + the reorder happy-path swap case (the two-pass works, no intermediate P2002).

**Reference points to read at 8.3.6 prompt-write time:**

- Step 7.3.6 entry — `implementation/log/_archive-pre-refactor.md` (search `## Step 07.3.6`) — the canonical precedent (constraint + two-pass + 2 tests + the flavour-(h) anti-precedent diagnosis).
- `packages/api-server/prisma/schema.prisma` — the `SchemaRow` model (the `@@unique` target; `SchemaRow` line ~731).
- `packages/api-server/src/endpoints/lms/schema-row/admin.ts` — `lmsSchemaRowApi.reorder` (the method rewritten) + the sibling `admin.test.ts` (the test surface).
- `analysis/artifacts/06-formalization/{schema.prisma, er-final.md, implementation-notes.md}` — the `analysis/` sync targets (a Prisma schema change updates them in the same session per WORKFLOW.md `analysis/` rules).

**Walkthrough gate (8.3.6).** 8.3.6 is a backend/DB step — the thesis walkthrough describes the **final coach UX** the constraint serves: what the coach would otherwise see if two row-order edits on the same schema raced (a duplicated or lost row position) and how the constraint + the retry path keep the row list consistent on reload. Screen-only language per `[[coach-daily-ux-priority]]`; no DB / constraint / P2002 vocabulary in the coach view.

## Carry-forwards into the 8.3.6 thesis

- **QA-001b — `Session @@unique([dayId, order])`** (`03-deferred.md` "Pre-Step-8 cleanup") — a sibling latent surface, **not** 8.3.6 scope (8.3.6 is `SchemaRow`). Mention only as the adjacent pattern.
- **QA-W2** — `lmsSchemaRowApi.reorder` array-form plan re-check — see the OQ above; default-deferred.
- **The `analysis/` sync rules** — 8.3.6 is a Prisma schema change → it follows the WORKFLOW.md `analysis/` sync protocol (`schema.prisma` + `er-final.md` invariant + `implementation-notes.md`). The two include-hoist carry-forwards are untouched (8.3.6 adds no include callsite).

## Process reminders (active)

- Thesis = two voice-coded sections (coach view + developer view) per `[[thesis-format]]`; the coach view carries the mandatory 1-paragraph walkthrough per `[[coach-walkthrough-gate]]`, screen-only per `[[coach-daily-ux-priority]]`.
- Prompt spec-only per `[[planner-strategic-level]]` — § 0 verbatim quotes of existing code; no prescriptive new-code skeletons in § 3.
- Flavour (h) `[[planner-mutation-invariant-trace]]` is the load-bearing one for 8.3.6 — trace `lmsSchemaRowApi.reorder`'s intra-transaction UPDATE sequence; the two-pass fix is specced in the thesis, not discovered in execution.
- Flavour (e) `[[husky-cross-package-squash]]` — 8.3.6 is likely single-package (`@repo/api-server` — the Prisma schema + the endpoint + tests + the `analysis/` mirror); confirm the fan-out at § commit-strategy. An additive `@@unique` is likely per-layer atomic, no squash — but verify.
- `/feature small`, `feat/training-domain` long-lived branch, no branch cut.

## After Step 8.3.6 close-out

Per [01-step-queue.md](01-step-queue.md) execution order: 8.3.6 → 8.3.7 (Schema partial-unique — the `schemas_block_top_order` partial index in `apply-sql-checks.ts` WHERE `parent_schema_id IS NULL` + `@@unique([parentSchemaId, order])` + a dual-scope reorder) → **8.4 anchor** → **9.1..9.11 row editor** → **8.5..8.20 archetype expansion** → 10.
