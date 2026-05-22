# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-22.

**Current step status**: **Step 9.1 CLOSED 2026-05-22** — the SchemaRow body editor begins; the schema body stops being empty. Shipped: the `STANDALONE_LOAD` rowKind end-to-end, two reusable composite-VO editors — `LoadEditor` (5 kinds, `switch`-dispatch) + `WeightEditor` (8 variants, `switch`-dispatch) — `PercentageReferenceEditor` (2 scopes; `other_exercise` deferred to 9.3), the `LoadSummary` formatter, the self-contained `StandaloneLoadRowForm`, the row-kind dispatch infra (`ROW_KIND_FORM_REGISTRY` + `RowEditorModal` + `AddRowButton` — an 8-rowKind menu, unimplemented = no-op), and the body rendering (`SchemaRowList` / `SchemaRowCard` embedded in `SchemaCard`). **D-9.1-4** — the load-bearing decision — was specced as a `switch`-dispatch (not a `Record`-registry) with the type simulated upfront per the flavour-(i) lesson of 8.4; the executor implemented it with **zero escalation** (the contrast with 8.4, where the prompt's ownership shape failed at the Design gate). 6 commits `d6e770bf..4e4421ce` (30 code files, +2387/−0, additive, all under `plan-detail/components/`). Review APPROVE (0/0/3); QA verdict B (0 CRITICAL / 2 WARNING / 5 INFO — both WARNINGs planner-traced: QA-307 deferred to 9.3, QA-301 re-assessed to deferred-domain); `check-types` 16/16 + `lint` 16/16 + `dep:check` 0 + `vitest --project platform` 64/64 (planner re-ran all FULL); browser smoke user-run + accepted. Full entry: [log/step-09.1.md](../log/step-09.1.md).

**Next planner action**: Step 9.2 thesis cycle — REST + INNER_LADDER_MARKER + STANDALONE_URL rowKinds (3 simple rowKinds in one batch; the RestSpec sub-editor reused from 8.4). `/feature`. See [04-next-action.md](04-next-action.md).

**Branch state**: `feat/training-domain` — **7 commits ahead of `origin/feat/training-domain`** (1 prompt-commit `6c92e60b` + 6 Step 9.1 commits `d6e770bf..4e4421ce`); the user chose to keep them local (not pushed). PR cadence: #199 = 8.1c+8.1d, #200 = 8.2+8.3, #201 = 8.3.5+8.3.6, #202 = 8.3.7+8.4; the next PR batches the post-#202 work (8.4 onward — wait, #202 carried 8.4; so the next PR batches Step 9.x) once enough sub-steps accrue — the planner does not open it unprompted. After 8.4 + Step 9.1 the coach can create a plan, programme a block with schemas, **and now fill a schema body with `STANDALONE_LOAD` rows** — the first genuinely usable schema + row editor.

**Step queue (expanded 2026-05-20 under D3)**: `01-step-queue.md` Step 8 + Step 9 sections — full hand-rolled coverage of all 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order** (full interleave): ~~8.3.7~~ → ~~8.4 anchor~~ → ~~9.1~~ → 9.2..9.11 row editor → 8.5..8.20 archetype expansion → 10. **Queue updated at 9.1 close-out 2026-05-22**: 9.1 → COMPLETED (1/9 rowKinds + 1/7 composite VOs — Load); cursor advances to Step 9.2.

**Process shifts codified в current arc** (2026-05-19 → 2026-05-21):

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough («тренер открывает X / делает Y / видит Z»); текст в thesis, НЕ UI prototype; active from Step 8.1c. Walkthrough concrete examples (archetype names, rowKinds) — domain claims, ground them in `analysis/`.
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты spec-only: § 0 verbatim quotes existing code остаются как reference, § 3 prescriptive new-code skeletons убираются.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner оценивает решения через призму professional CrossFit coach.
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full реализация `analysis/`.
- `[[no-en-ru-mixing]]` — чистый русский в чате, английский только для идентификаторов/путей.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
