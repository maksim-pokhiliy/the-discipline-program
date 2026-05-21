# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-21.

**Current step status**: **Step 8.3 CLOSED 2026-05-21** — platform client API + TanStack hooks for the `Schema` / `SchemaRow` / `AlternatingGroup` slices. 3 `createXxxAPI` endpoint factories (12 methods over the Step 8.2 routes) + 12 `useXxx` mutation hooks on `useWeekMutation`, mirroring Step 7.3 (Block). Strictly `apps/platform/src/lib/{api,hooks}/`, purely additive — `useWeekMutation` / `keys.ts` byte-identical. D-8.3-1..6 ratified upfront; D-8.3-4 (api-level `*Request` reorder types — closes `QA-I1`) and D-8.3-5 (`removeMember` via `client.request`, not `requestNoContent`) the two load-bearing points. 2 code commits `f0adca8a..10bcd4b6` + prompt/output docs. Review-Light APPROVED (0 findings); `pnpm test` 1680/1680; scope confined. Full entry: [log/step-08.3.md](../log/step-08.3.md).

**Next planner action**: Step 8.3.5 thesis cycle — the `schemas[]` read-embed into `blockSchema` (the read surface; cross-package contract + api-server, mirror Step 7.3.5). See [04-next-action.md](04-next-action.md).

**Branch state**: **PR #200 merged into `main` 2026-05-21** — `main` advanced `9a5c217e..e48c2b33`; `feat/training-domain` re-cut from fresh `main` (`e48c2b33`), 0 commits ahead. PR #200 batched Steps 8.2 (HTTP routes) + 8.3 (client API/hooks); the `claude[bot]` CI review verdict was clean («No issues found»), no new carry-forwards. The prior batch was PR #199 (Steps 8.1c + 8.1d, merged 2026-05-20). The **write** path for the three slices is complete end-to-end (contracts → api-server → routes → client hooks); the read surface (`schemas[]` embed) remains before the UI anchor — Step 8.3.5.

**Step queue (expanded 2026-05-20 under D3)**: `01-step-queue.md` Step 8 + Step 9 sections — full hand-rolled coverage of all 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order** (full interleave): infrastructure (8.3.5 → 8.3.6 → 8.3.7) → 8.4 anchor → 9.1..9.11 row editor → 8.5..8.20 archetype expansion → 10. **Queue updated at 8.3 close-out 2026-05-21**: 8.3 → COMPLETED; cursor advances to 8.3.5.

**Process shifts codified в current arc** (2026-05-19 → 2026-05-21):

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough («тренер открывает X / делает Y / видит Z»); текст в thesis, НЕ UI prototype; active from Step 8.1c. Walkthrough concrete examples (archetype names, rowKinds) — domain claims, ground them in `analysis/` (Step 8.3 thesis-cycle lesson — "EMOM 12" instinct-spec).
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты spec-only: § 0 verbatim quotes existing code остаются как reference, § 3 prescriptive new-code skeletons убираются.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner оценивает решения через призму professional CrossFit coach.
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full реализация `analysis/`.
- `[[no-en-ru-mixing]]` — чистый русский в чате, английский только для идентификаторов/путей.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
