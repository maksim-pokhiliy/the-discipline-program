# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-20.

**Current step status**: **Step 8.1d CLOSED 2026-05-20** — `lmsAlternatingGroupApi` api-server vertical against the Step 8.1c definition layer. 4-method endpoint (`create` / `addMember` / `removeMember` / `delete`) + `verifyAlternatingGroupOwnership` guard (new `authz/alternating-group-guards.ts` — REVIEW-I3 closure via own-file axis; `lms-guards.ts` byte-identical) + `mapToAlternatingGroup` mapper + `addMember` / `removeMember` contract schemas (`removeMember` response nullable for D-A4 dissolve) + `.max(24)` on `createAlternatingGroupSchema.schemaIds` (QA-004 closure). D-A4 scope expansion shipped: `lmsSchemaApi.delete` group-aware — one Serializable tx wraps read+delete+count+conditional dissolve, closing the `addMember` race. 6 commits `a2e261e8..66626a11` + close-out docs commit. Review APPROVE / QA PASS; `pnpm test` 1670/1670; 38 adversarial attacks attempted, 0 exploited. Full entry: [log/step-08.1d.md](../log/step-08.1d.md).

**Next planner action**: Step 8.2 thesis cycle — platform HTTP routes for `Schema` / `SchemaRow` / `AlternatingGroup` api slices, mirroring Step 7.2 (Block). Per-entity split possible if file count > 6-7; collapsed otherwise. `/feature small`. See [04-next-action.md](04-next-action.md).

**Branch state**: `feat/training-domain` — pushed to `origin`; **PR #199 open against `main`** (`maksim-pokhiliy/the-discipline-program#199`, unmerged) — Steps 8.1c + 8.1d together. The api-server vertical for `AlternatingGroup` is complete; only HTTP wiring + read surface remain before the UI anchor. Next cycle's first housekeeping commit records the #199 outcome (mirror `a94bebb6` post-#198).

**Step queue (expanded 2026-05-20 under D3)**: `01-step-queue.md` Step 8 + Step 9 sections expanded — full hand-rolled coverage всех 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order** (full interleave): infrastructure (8.2 → 8.3.7) → 8.4 anchor → 9.1..9.11 row editor → 8.5..8.20 archetype expansion → 10. **Queue updated at 8.1d close-out 2026-05-20**: 8.1d → COMPLETED; cursor advances to 8.2.

**Process shifts codified в current arc** (2026-05-19 → 2026-05-20):

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough («тренер открывает X / делает Y / видит Z»); текст в thesis, НЕ UI prototype; active from Step 8.1c.
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты переходят на spec-only: § 0 verbatim quotes existing code остаются как reference, § 3 prescriptive new-code skeletons убираются.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner оценивает решения через призму professional CrossFit coach (групповой + Games level).
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full реализация `analysis/`.
- `[[no-en-ru-mixing]]` — чистый русский в чате, английский только для идентификаторов/путей.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
