# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-20.

**Current step status**: Step 8.1b CLOSED + **PR #198 merged 2026-05-20** (`ad964f73` — Step 8.1b SchemaRow api-server vertical + planning docs landed on `main`). Shipped: `lmsSchemaRowApi.{create, update, delete, reorder}` + `verifySchemaRowOwnership` guard + `mapToSchemaRow` mapper + `TxClient` hoist к `endpoints/lms/_shared/` + `authz/guards.ts` domain split (`_role-helpers` / `role-guards` / `lms-guards` / barrel). 661 api-server tests + 1609 root tests, all gates green. **Fifth cleanest run в ряд** (7.5 → 8.0a → 8.0b → 8.1a → 8.1b). Schema vertical api-server slice now 2/3 done (8.1a Schema + 8.1b SchemaRow; 8.1c Pairing pending). Full entry: [log/step-08.1b.md](../log/step-08.1b.md).

**Next planner action**: Step 8.1c thesis cycle (`lmsSchemaPairingApi` — last api-server slice of Schema vertical). **First step under the `[[coach-walkthrough-gate]]` rule** (thesis coach view несёт 1-параграф walkthrough) **+ first spec-only prompt** (per `[[planner-strategic-level]]` — no prescriptive code skeletons). See [04-next-action.md](04-next-action.md). Heads-up: `lms-guards.ts` at ~293/300 — appending `verifySchemaPairingOwnership` trips eslint `max-lines`; executor splits tactically, no planner pre-work (REVIEW-I3 в [03-deferred.md](03-deferred.md)).

**Branch state**: `feat/training-domain` recreated from fresh `main` post-#198 merge (0 commits ahead). Old `origin/feat/training-domain` deleted via `fetch --prune` per merge cleanup convention. Next PR candidate accumulates from Step 8.1c per Step 6.x precedent.

**Step queue (expanded 2026-05-20 under D3)**: `01-step-queue.md` Step 8 + Step 9 sections expanded — full hand-rolled coverage всех 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order** (full interleave): infrastructure (8.1c → 8.3.7) → 8.4 anchor → 9.1..9.11 row editor → 8.5..8.20 archetype expansion → 10. Rationale в queue file §"Adversarial review concerns" #3.

**Process shifts codified в current arc** (2026-05-19 → 2026-05-20):

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough («тренер открывает X / делает Y / видит Z»); текст в thesis, НЕ UI prototype; active from Step 8.1c.
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты переходят на spec-only: § 0 verbatim quotes existing code остаются как reference, § 3 prescriptive new-code skeletons убираются.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner оценивает решения через призму professional CrossFit coach (групповой + Games level).
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full реализация `analysis/`.
- `[[no-en-ru-mixing]]` — чистый русский в чате, английский только для идентификаторов/путей.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
