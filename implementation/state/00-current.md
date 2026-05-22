# Current state

> Live current-state snapshot. Updated every close-out. Read this file first when resuming as planner.

**Last updated**: 2026-05-22.

**Current step status**: **Step 8.4 CLOSED 2026-05-22** — the anchor: the first coach-visible Schema editor, end-to-end. **Phase 0** — the archetype read-path (`lmsArchetypePlatformApi.list` → `mapToArchetype` → `GET /api/platform/archetypes` → `createArchetypesAPI` → the `use-archetypes` hook; folded into 8.4 per D-8.4-1, not a separate enabler step). **Phases 1-4** — the `plan-detail` Schema editor UI: `SchemaList`/`SchemaCard`/`AddSchemaButton` embedded in `BlockCard`, `ArchetypePicker` over all 34 archetypes grouped by family (zero availability logic), `SchemaEditorModal` thin dispatcher + the `SCHEMA_PARAM_FORM_REGISTRY` of self-contained `*SchemaForm` components, the `amrap-flat` + `n-rounds` param forms, the reusable `RestSpecFields` sub-editor. **Approach (A)** — a registry of self-contained forms — was ratified at the Design gate: the prompt's literal `SchemaEditorModal`-owns-`useForm` shape is not type-safe under a runtime dispatch over heterogeneous per-archetype forms (a prompt error — flavour (i) miss, caught cleanly at the gate); this registry pattern is the template for Steps 8.5-8.20. 6 per-layer atomic commits `ed386142..7f1b6cbd` (27 files, +1572/−0, additive). QA verdict C re-assessed (2 CRITICAL → WARNING — traced, planner-concurred); `check-types` 16/16 (planner re-ran FULL), `lint` 16/16, `dep:check` 0, `pnpm test` 1701; browser smoke user-run + accepted. Full entry: [log/step-08.4.md](../log/step-08.4.md).

**Next planner action**: Step 9.1 thesis cycle — the SchemaRow body editor begins: the STANDALONE_LOAD rowKind + the LoadEditor composite (5 kinds: absolute / percentage / bodyweight / without_weight / unspecified) + the WeightEditor sub-composite (8 variants). The schema cards 8.4 ships have empty bodies; Step 9 fills them. `/feature` full. See [04-next-action.md](04-next-action.md).

**Branch state**: `feat/training-domain` — Steps 8.3.7 + 8.4 + their docs commits ahead of `main` (`584f26b0`). PR cadence: #199 = 8.1c+8.1d, #200 = 8.2+8.3, #201 = 8.3.5+8.3.6; the next PR batches the post-#201 work (8.3.7 + 8.4 onward) once enough accrues — the planner does not open it unprompted. All Step 8 infrastructure **and** the 8.4 anchor are shipped: the coach can create a plan, programme a block with schemas, pick from 34 archetypes, fill the `amrap-flat` / `n-rounds` param forms, and the schema cards render — bodies empty until the Step 9 row editor.

**Step queue (expanded 2026-05-20 under D3)**: `01-step-queue.md` Step 8 + Step 9 sections — full hand-rolled coverage of all 34 archetypes + 9 SchemaRow rowKinds + 7 composite VOs. Step 8 → 28 sub-steps; Step 9 → 11 sub-steps. **Execution order** (full interleave): ~~infrastructure 8.3.7~~ → ~~8.4 anchor~~ → 9.1..9.11 row editor → 8.5..8.20 archetype expansion → 10. **Queue updated at 8.4 close-out 2026-05-22**: 8.4 → COMPLETED; the anchor shipped; cursor advances to Step 9.1 (the SchemaRow row editor).

**Process shifts codified в current arc** (2026-05-19 → 2026-05-21):

- `[[coach-walkthrough-gate]]` — каждый thesis несёт 1-параграф coach walkthrough («тренер открывает X / делает Y / видит Z»); текст в thesis, НЕ UI prototype; active from Step 8.1c. Walkthrough concrete examples (archetype names, rowKinds) — domain claims, ground them in `analysis/` (Step 8.3 thesis-cycle lesson — "EMOM 12" instinct-spec).
- `[[planner-strategic-level]]` — planner = стратегия (что/зачем, паттерны, инварианты, декомпозиция); executor = тактика + код. Промпты spec-only: § 0 verbatim quotes existing code остаются как reference, § 3 prescriptive new-code skeletons убираются.
- `[[coach-daily-ux-priority]]` + `[[planner-coach-role]]` — coach daily UX > pattern elegance; planner оценивает решения через призму professional CrossFit coach.
- `[[training-domain-validation-gate]]` — **DEPRECATED**; Step 10 coach gate dropped; scope = full реализация `analysis/`.
- `[[no-en-ru-mixing]]` — чистый русский в чате, английский только для идентификаторов/путей.

**Refactor 2026-05-18**: `implementation/` migrated к structured folders `state/` + `log/`. Historical archive at [log/\_archive-pre-refactor.md](../log/_archive-pre-refactor.md) (Steps 1 → 8.0a).
