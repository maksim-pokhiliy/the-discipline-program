# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-21.

**Current step status**: **Step 8.3.5 CLOSED 2026-05-21** — the block read surface: `blockSchema` widened with the recursive `schemas: SchemaWithBody[]` depth-2 embed + the sibling `alternatingGroups[]` embed; `mapToBlockWithSchemas` assembles the tree; the `week/admin.ts` include and `DAY_INCLUDE` widened identically (D-8.3.5-4 — the Step 7.3.5 D-1 dual-consumer recurrence averted). The structural twin of Step 7.3.5, one level deeper. D-8.3.5-1..8 ratified upfront; the one deviation is OQ-1 — the D-8.3.5-2 `SchemaWithBody` wiring (the `z.infer` literal does not compile for a recursive schema → one canonical exported type pinned by `z.ZodType<…>`, intent preserved). 1 cross-package squash commit `2ee659cd` + output docs. Review-Light APPROVED (0 CRITICAL/WARNING, 1 closed INFO); `pnpm test` 1691/1691; scope confined. Full entry: [log/step-08.3.5.md](../log/step-08.3.5.md).

**Next planner action**: Step 8.3.6 thesis cycle — `SchemaRow @@unique([schemaId, order])` + the `lmsSchemaRowApi.reorder` two-pass rewrite (a Prisma constraint step, mirror Step 7.3.6). See [04-next-action.md](04-next-action.md).

**Branch state**: `feat/training-domain` — local, **5 commits ahead of `main`** (`e48c2b33`), unpushed, no PR open: the PR #200 merge-housekeeping (`3193ddd3`), the Step 8.3.5 prompt (`c80e18c7`), the 8.3.5 squash (`2ee659cd`), the 8.3.5 output (`0688cc0a`), this close-out. PR cadence — the prior batch (Steps 8.2 + 8.3) merged as PR #200; the next PR batches the post-#200 work once enough sub-steps accrue. Both the write **and** read paths for the three slices are now complete end-to-end (contracts → api-server → routes → client hooks → the week read embed).

**Step queue (expanded 2026-05-20 under D3)**: `01-step-queue.md` Step 8 + Step 9 sections — full hand-rolled coverage of all 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order** (full interleave): infrastructure (8.3.6 → 8.3.7) → 8.4 anchor → 9.1..9.11 row editor → 8.5..8.20 archetype expansion → 10. **Queue updated at 8.3.5 close-out 2026-05-21**: 8.3.5 → COMPLETED; cursor advances to 8.3.6.

**Process shifts codified в current arc** (2026-05-19 → 2026-05-21):

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough («тренер открывает X / делает Y / видит Z»); текст в thesis, НЕ UI prototype; active from Step 8.1c. Walkthrough concrete examples (archetype names, rowKinds) — domain claims, ground them in `analysis/` (Step 8.3 thesis-cycle lesson — "EMOM 12" instinct-spec).
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты spec-only: § 0 verbatim quotes existing code остаются как reference, § 3 prescriptive new-code skeletons убираются.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner оценивает решения через призму professional CrossFit coach.
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full реализация `analysis/`.
- `[[no-en-ru-mixing]]` — чистый русский в чате, английский только для идентификаторов/путей.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
