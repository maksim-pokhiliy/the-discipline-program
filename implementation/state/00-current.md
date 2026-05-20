# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-20.

**Current step status**: **Step 8.2 CLOSED 2026-05-20** — platform HTTP routes for the `Schema` / `SchemaRow` / `AlternatingGroup` api slices. 10 Next.js App Router `route.ts` handlers over all 12 write methods, composed `withCoachAuth( withAuthRateLimit( createAuth*Handler(...), RATE_LIMIT_TIER.API ) )` mirroring the Block precedent (Step 7.2) + contract enablers (named route-param schemas + `z.union`-widened reorder-request schemas). `removeMember` via `createAuthActionHandler` (nullable body — the delete factory is `204`/void). D-8.2-7 ratified mid-execution: the widened reorder request schema is a `z.union`, not `superRefine` (the latter does not narrow its inferred type to `CreateScope`). 7 executor code/test commits `499b11cb..0728017f` + 2 planner docs commits. Review APPROVED / QA Score A; `pnpm test` 1680/1680; scope confined (`api-server` / `api-routes` / Prisma / `analysis/` 0 lines). Full entry: [log/step-08.2.md](../log/step-08.2.md).

**Next planner action**: Step 8.3 thesis cycle — platform client API + TanStack hooks for the `Schema` / `SchemaRow` / `AlternatingGroup` slices, mirroring Step 7.3 (Block). The 8.2 routes are the call target. `/feature small` likely. See [04-next-action.md](04-next-action.md).

**Branch state**: `feat/training-domain` — local, not pushed; **12 commits ahead of `main`** (`9a5c217e`) — the post-#199 housekeeping commit + Step 8.2 (prompt + 7 code/test + mid-execution ratify + output + this close-out). PR #199 (Steps 8.1c + 8.1d) merged 2026-05-20. The HTTP layer for the three slices is complete; the read surface + client hooks remain before the UI anchor. `claude[bot]` PR #199 review carry-forwards (`REVIEW-I4/I5/I6`) stay in [03-deferred.md](03-deferred.md), unaddressed (deferred `/fix` bundle).

**Step queue (expanded 2026-05-20 under D3)**: `01-step-queue.md` Step 8 + Step 9 sections expanded — full hand-rolled coverage всех 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order** (full interleave): infrastructure (8.2 → 8.3.7) → 8.4 anchor → 9.1..9.11 row editor → 8.5..8.20 archetype expansion → 10. **Queue updated at 8.2 close-out 2026-05-20**: 8.2 → COMPLETED; cursor advances to 8.3.

**Process shifts codified в current arc** (2026-05-19 → 2026-05-20):

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough («тренер открывает X / делает Y / видит Z»); текст в thesis, НЕ UI prototype; active from Step 8.1c.
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты переходят на spec-only: § 0 verbatim quotes existing code остаются как reference, § 3 prescriptive new-code skeletons убираются.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner оценивает решения через призму professional CrossFit coach (групповой + Games level).
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full реализация `analysis/`.
- `[[no-en-ru-mixing]]` — чистый русский в чате, английский только для идентификаторов/путей.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
