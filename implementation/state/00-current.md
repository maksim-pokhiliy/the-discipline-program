# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-22.

**Current step status**: **Step 9.2 CLOSED 2026-05-22** — three more SchemaRow body-editor rowKinds: `REST`, `INNER_LADDER_MARKER`, `STANDALONE_URL`. The add-row menu went from 1 working rowKind of 8 to 4. Each new rowKind is a self-contained `*RowForm` mirroring the 9.1 `StandaloneLoadRowForm`, registered in `ROW_KIND_FORM_REGISTRY` (now 4); the dispatch infra (`RowEditorModal`/`AddRowButton`/`SchemaRowList`) is untouched — rowKind-agnostic. Plus `StepArrayFields` (a reusable chip-array number editor, built for Step 8.5/8.6 archetype-form reuse), the `formatRestRaw` pure formatter, and three `SchemaRowCard.renderBody` summary branches. **OQ-C3** (`STANDALONE_URL.wrapped` semantics) was a thesis-blocker resolved by the planner from `analysis/` verbatim — `wrapped` is a non-semantic notation artifact, pinned `true` (D-9.2-3). 6 commits `c19c0725..1a41a453` (14 code files, +1101/−5, additive, all under `plan-detail/components/`). Review APPROVE (0/0/3 INFO); QA verdict B (0 CRITICAL / 2 WARNING — QA-902 / QA-903, both fixed in-pipeline `fe4bee40` and verified verbatim / 5 INFO); `check-types` 16/16 + `lint` 16/16 + `dep:check` 0 + `vitest --project platform` 140/140 (planner re-ran all FULL); browser smoke user-run + accepted. Full entry: [log/step-09.2.md](../log/step-09.2.md).

**Next planner action**: Step 9.3 thesis cycle — `EXERCISE` (atomic form) + `RepNotationEditor` + `SideEditor` + the exerciseForm picker shell. The **largest single Step 9 sub-step** (3 composite VOs); also where `PercentageReferenceEditor` gains the `other_exercise` scope and `toRestrictedReference` is deleted per the **QA-307 hard prerequisite**. `/feature` full. See [04-next-action.md](04-next-action.md).

**Branch state**: `feat/training-domain` — **15 commits ahead of `origin/feat/training-domain`** (the Step 9.1 + 9.2 work + prompts + close-outs), kept local (the user's choice — not pushed). PR cadence: #199 = 8.1c+8.1d, #200 = 8.2+8.3, #201 = 8.3.5+8.3.6, #202 = 8.3.7+8.4; the next PR batches the post-#202 Step 9.x work once enough sub-steps accrue — the planner does not open it unprompted. After 8.4 + Step 9.1 + 9.2 the coach can create a plan, programme a block with schemas, and fill a schema body with 4 of the 8 rowKinds (`STANDALONE_LOAD` / `REST` / `INNER_LADDER_MARKER` / `STANDALONE_URL`) — the `EXERCISE` rowKind (the central one) lands across Steps 9.3-9.6.

**Step queue (expanded 2026-05-20 under D3)**: `01-step-queue.md` Step 8 + Step 9 sections — full hand-rolled coverage of all 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order** (full interleave): ~~8.3.7~~ → ~~8.4 anchor~~ → ~~9.1~~ → ~~9.2~~ → 9.3..9.11 row editor → 8.5..8.20 archetype expansion → 10. **Queue updated at 9.2 close-out 2026-05-22**: 9.2 → COMPLETED (4/9 rowKinds done — `STANDALONE_LOAD` / `REST` / `INNER_LADDER_MARKER` / `STANDALONE_URL`; 1/7 composite VOs — Load); cursor advances to Step 9.3.

**Process shifts codified в current arc** (2026-05-19 → 2026-05-21):

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough («тренер открывает X / делает Y / видит Z»); текст в thesis, НЕ UI prototype; active from Step 8.1c. Walkthrough concrete examples (archetype names, rowKinds) — domain claims, ground them in `analysis/`.
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты spec-only: § 0 verbatim quotes existing code остаются как reference, § 3 prescriptive new-code skeletons убираются.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner оценивает решения через призму professional CrossFit coach.
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full реализация `analysis/`.
- `[[no-en-ru-mixing]]` — чистый русский в чате, английский только для идентификаторов/путей.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
