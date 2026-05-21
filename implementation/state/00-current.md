# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-21.

**Current step status**: **Step 8.3.6 CLOSED 2026-05-21** — `@@unique([schemaId, order])` on the `SchemaRow` Prisma model: DB-level enforcement of positional uniqueness, the structural mirror of Step 7.3.6 (`Block`). The load-bearing finding — `lmsSchemaRowApi.reorder` was **not** rewritten: it was shipped two-pass in Step 8.1b (`e1091719`); the session brief + `04-next-action.md` assumed a single-pass reorder needing a rewrite, the verbatim read at thesis time corrected it, the flavour-(h) intra-tx trace ran upfront and confirmed the constraint compatible with zero changes (D-8.3.6-3 — `schema-row/admin.ts` byte-identical). 1 atomic commit `b32fd892` (5 files, +41/−0) — the constraint + the `analysis/` sync (`schema.prisma` mirror, `er-final.md` invariant #12, `implementation-notes.md` § 4.11) + 1 P2002-floor test. Review-Light APPROVED (0 findings); `pnpm check-types` 16/16 (planner re-ran); `pnpm test` 1692/1692; scope confined. Full entry: [log/step-08.3.6.md](../log/step-08.3.6.md).

**Next planner action**: Step 8.3.7 thesis cycle — the `Schema` partial-unique constraint: `@@unique([parentSchemaId, order])` Prisma DSL (sub-schemas) + a `schemas_block_top_order` partial index in `apply-sql-checks.ts` (top-level schemas, `WHERE parent_schema_id IS NULL`) + a dual-scope reorder check. See [04-next-action.md](04-next-action.md).

**Branch state**: `feat/training-domain` — recreated from fresh `main` (`584f26b0`) after **PR #201 merged** (Steps 8.3.5 + 8.3.6 — the block read-embed + the `SchemaRow @@unique` constraint). **0 commits ahead**; this housekeeping commit records the merge + recreate (mirror `3193ddd3`). PR cadence: #199 = 8.1c+8.1d, #200 = 8.2+8.3, #201 = 8.3.5+8.3.6; the next PR batches the post-#201 work once enough sub-steps accrue. The write **and** read paths for the `Schema` / `SchemaRow` / `AlternatingGroup` slices are complete end-to-end; `SchemaRow` carries the DB-level positional-uniqueness constraint.

**Step queue (expanded 2026-05-20 under D3)**: `01-step-queue.md` Step 8 + Step 9 sections — full hand-rolled coverage of all 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order** (full interleave): infrastructure (8.3.7) → 8.4 anchor → 9.1..9.11 row editor → 8.5..8.20 archetype expansion → 10. **Queue updated at 8.3.6 close-out 2026-05-21**: 8.3.6 → COMPLETED; cursor advances to 8.3.7.

**Process shifts codified в current arc** (2026-05-19 → 2026-05-21):

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough («тренер открывает X / делает Y / видит Z»); текст в thesis, НЕ UI prototype; active from Step 8.1c. Walkthrough concrete examples (archetype names, rowKinds) — domain claims, ground them in `analysis/` (Step 8.3 thesis-cycle lesson — "EMOM 12" instinct-spec).
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты spec-only: § 0 verbatim quotes existing code остаются как reference, § 3 prescriptive new-code skeletons убираются.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner оценивает решения через призму professional CrossFit coach.
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full реализация `analysis/`.
- `[[no-en-ru-mixing]]` — чистый русский в чате, английский только для идентификаторов/путей.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
