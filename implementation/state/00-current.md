# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-21.

**Current step status**: **Step 8.3.7 CLOSED 2026-05-21** — `@@unique([parentSchemaId, order])` on the `Schema` Prisma model (sub-schemas) + a `schemas_block_top_order` partial unique index in `lms-checks.sql` (top-level schemas, `WHERE "parentSchemaId" IS NULL`): DB-level enforcement of `Schema`'s dual-scope positional-uniqueness invariant, the last Step 8 infrastructure sub-step before the 8.4 anchor. Two mechanisms — Prisma `@@unique` cannot express a `WHERE` predicate, and a flat `@@unique([blockId, order])` would wrongly reject sub-schemas of different parents that legitimately share an `order` in one block. The load-bearing finding — `lmsSchemaApi.reorder` was **not** rewritten: confirmed two-pass since `0d7c6943` by the verbatim read, the flavour-(h) intra-tx trace ran upfront and verified compatibility across both constraints and both scopes (D-8.3.7-3 — `schema/admin.ts` byte-identical). 1 atomic commit `cda82308` (6 files, +152/−0) — the constraint + the partial index + the `analysis/` sync (`schema.prisma` mirror, `er-final.md` invariant #13, `implementation-notes.md` § 4.12) + 3 `cross-cutting` tests. Executed in-session by the planner (no executor shuttle — a proportionality call, D-8.3.7-1); independent review APPROVED (1 INFO applied); `check-types` 16/16, `lint` 16/16, `dep:check` 0; 722/722 api-server tests; `db:reset`+`db:seed` clean; scope confined. Full entry: [log/step-08.3.7.md](../log/step-08.3.7.md).

**Next planner action**: Step 8.4 thesis cycle — the anchor: the first coach-visible Schema editor (ArchetypePicker UI shell + Schema CRUD wire-up in `plan-detail` + the first 2 `archetypeParams` forms hand-rolled — `n-rounds` + `amrap-flat` — + the RestSpec sub-editor). `/feature` full. See [04-next-action.md](04-next-action.md).

**Branch state**: `feat/training-domain` — **2 commits ahead** of `main` (`584f26b0`): `cda82308` (Step 8.3.7) + this close-out docs commit. PR cadence: #199 = 8.1c+8.1d, #200 = 8.2+8.3, #201 = 8.3.5+8.3.6; the next PR batches the post-#201 work (8.3.7 onward) once enough sub-steps accrue — the planner does not open it unprompted. The write **and** read paths for the `Schema` / `SchemaRow` / `AlternatingGroup` slices are complete end-to-end; both `SchemaRow` and `Schema` now carry DB-level positional-uniqueness constraints — all Step 8 infrastructure is shipped, the 8.4 anchor is next.

**Step queue (expanded 2026-05-20 under D3)**: `01-step-queue.md` Step 8 + Step 9 sections — full hand-rolled coverage of all 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order** (full interleave): infrastructure (8.3.7) → 8.4 anchor → 9.1..9.11 row editor → 8.5..8.20 archetype expansion → 10. **Queue updated at 8.3.7 close-out 2026-05-21**: 8.3.7 → COMPLETED; all Step 8 infrastructure sub-steps done; cursor advances to the 8.4 anchor.

**Process shifts codified в current arc** (2026-05-19 → 2026-05-21):

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough («тренер открывает X / делает Y / видит Z»); текст в thesis, НЕ UI prototype; active from Step 8.1c. Walkthrough concrete examples (archetype names, rowKinds) — domain claims, ground them in `analysis/` (Step 8.3 thesis-cycle lesson — "EMOM 12" instinct-spec).
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты spec-only: § 0 verbatim quotes existing code остаются как reference, § 3 prescriptive new-code skeletons убираются.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner оценивает решения через призму professional CrossFit coach.
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full реализация `analysis/`.
- `[[no-en-ru-mixing]]` — чистый русский в чате, английский только для идентификаторов/путей.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
