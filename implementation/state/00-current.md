# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-20.

**Current step status**: **Step 8.1c CLOSED 2026-05-20** — `SchemaPairing` → `AlternatingGroup` N-ary model redesign (D14). Definition layer: Prisma + `@repo/contracts` slice + `analysis/` sync + seed; no endpoint/guard/mapper (those are Step 8.1d). The originally-scoped 8.1c (`lmsSchemaPairingApi` thin slice) was cancelled at thesis time — D14 found `SchemaPairing` mis-modelled as a 2-FK pair while `alternating-sets` is N-ary (coach links 2..N schemas, no cap). 5 commits `aec22f8a..cf14aab8` + close-out docs commit. Review A / QA A; `pnpm test` 1610/1610; `db:reset`+`db:seed` green; `git grep SchemaPairing` in `packages/` = 0. WORKFLOW-001 resolved inline (commit `8c3a701b`). Full entry: [log/step-08.1c.md](../log/step-08.1c.md).

**Next planner action**: Step 8.1d thesis cycle — `lmsAlternatingGroupApi` (`create` / `addMember` / `removeMember` / `delete`) + `verifyAlternatingGroupOwnership` guard + `mapToAlternatingGroup` mapper + `addMember`/`removeMember` contract schemas, against the `AlternatingGroup` shape Step 8.1c established. `/feature` full. See [04-next-action.md](04-next-action.md).

**Branch state**: `feat/training-domain` — 6 commits ahead of `main` (5 Step-8.1c code/docs `aec22f8a..cf14aab8` + 1 close-out docs commit). **Local, unpushed** — user pushes (ratified 2026-05-20). Next PR candidate accumulates from Step 8.1c.

**Step queue (expanded 2026-05-20 under D3)**: `01-step-queue.md` Step 8 + Step 9 sections expanded — full hand-rolled coverage всех 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order** (full interleave): infrastructure (8.1d → 8.3.7) → 8.4 anchor → 9.1..9.11 row editor → 8.5..8.20 archetype expansion → 10. Rationale в queue file §"Adversarial review concerns" #3. **Queue updated at 8.1c close-out 2026-05-20** (D14): 8.1c → COMPLETED (redesign), 8.1d inserted (`lmsAlternatingGroupApi`), 8.3.7-pre DROPPED (WORKFLOW-001 resolved by 8.1c).

**Process shifts codified в current arc** (2026-05-19 → 2026-05-20):

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough («тренер открывает X / делает Y / видит Z»); текст в thesis, НЕ UI prototype; active from Step 8.1c.
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты переходят на spec-only: § 0 verbatim quotes existing code остаются как reference, § 3 prescriptive new-code skeletons убираются.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner оценивает решения через призму professional CrossFit coach (групповой + Games level).
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full реализация `analysis/`.
- `[[no-en-ru-mixing]]` — чистый русский в чате, английский только для идентификаторов/путей.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
