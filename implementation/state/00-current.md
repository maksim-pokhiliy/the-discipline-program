# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-20.

**Current step status**: Step 8.1b CLOSED 2026-05-19 (close-out docs 2026-05-20). `lmsSchemaRowApi.{create, update, delete, reorder}` + `verifySchemaRowOwnership` guard + `mapToSchemaRow` mapper + `TxClient` hoist к `endpoints/lms/_shared/`. 5 atomic commits + docs (`d2e9b7e5..12e71770`). 17 files / +2126 / −333 LOC. Verifications all-green: check-types 16/16, lint 16/16, api-server 661 tests, root 1609 tests, dep:check 0 violations. Planner spot-check at close-out confirmed key artifacts. **Fifth cleanest run в ряд** (7.5 → 8.0a → 8.0b → 8.1a → 8.1b). Schema vertical api-server slice now 2/3 done (8.1a Schema + 8.1b SchemaRow; 8.1c Pairing pending). Full entry: [log/step-08.1b.md](../log/step-08.1b.md).

**One executor-time decision** ratified mid-cycle: `authz/guards.ts` exceeded eslint `max-lines: 300` on the guard append; executor split it by domain into `_role-helpers.ts` + `role-guards.ts` + `lms-guards.ts` + `guards.ts` (2-line barrel). Normal tactical refactor — consumer imports unchanged (`../authz/guards` barrel preserved). `lms-guards.ts` now ~293/300 — next LMS guard (8.1c) will trip the cap again; executor will split, no planner pre-work needed.

**Next planner action**: Step 8.1c thesis cycle (`lmsSchemaPairingApi` — last api-server slice of Schema vertical). **First step under the `[[coach-walkthrough-gate]]` rule** — thesis coach view MUST carry a 1-paragraph walkthrough. See [04-next-action.md](04-next-action.md).

**Branch state**: `feat/training-domain` long-lived — 6 commits ahead of `main` from Step 8.1b + this close-out docs commit. Next PR candidate accumulates Step 8.1c (server vertical complete) per Step 6.x precedent.

**Step queue rewrite 2026-05-20**: `01-step-queue.md` Step 8 + Step 9 sections expanded under D3 (roadmap.md §"Phase 0" — full hand-rolled coverage всех 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs). Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order resequenced** (full interleave): infrastructure → 8.4 anchor → 9.1..9.11 row editor → 8.5..8.20 archetype expansion → 10. Rationale в queue file §"Adversarial review concerns" #3.

**Process shift codified в current arc**:

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough (текст в thesis, не UI prototype); active from Step 8.1c.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner смотрит через призму professional CrossFit coach.
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты переходят на spec-only (без prescriptive code skeletons; § 0 verbatim quotes existing code остаются как reference).
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full analysis/ implementation.
- `[[no-en-ru-mixing]]` — чистый русский в чате.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
