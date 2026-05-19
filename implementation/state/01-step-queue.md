# Step queue

> Tree of workflow steps + sub-steps with status. Updated on every close-out and on thesis-time decomposition refinement.

Granularity locked at thesis time; some steps may expand into sub-steps as decomposition is ratified.

## Completed

- **Step 1** — Model ratification (no code). 4 ratified decisions applied к analysis-artifacts. **COMPLETED** 2026-05-12.
- **Step 2** — Prisma schema port + Archetype seed (34 canonical) + minimal user/plan seed. `db:reset` per ADR-0019. **COMPLETED** 2026-05-12.
- **Step 3** — Admin Exercise CRUD + Phase 0 D5 schema refinement. **COMPLETED** 2026-05-13 (HEAD `51302f93`). Canonical reference template для future catalog-library CRUD modules.
- **Step 4** — Admin Label CRUD. **COMPLETED** 2026-05-14 (HEAD `252d7323`). Structural mirror Step 3 + `applicableLevels` multi-value widget.
- ~~**Step 5**~~ — Platform plan list / create-plan flow. **DROPPED** 2026-05-14. Found already implemented as pre-existing base LMS infrastructure.
- **Step 5** (was Step 6) — Plan-detail shell (calendar viewport). **COMPLETED** 2026-05-15. `lms/week` slice + `lmsWeekApi` + InlineEditText + plan-detail module.
- **Step 6** — Day-level + Session-level operations + day-metadata side-channel + platform-side Label read-mirror. **COMPLETED** 2026-05-15 → 2026-05-17, decomposed:
  - 6.0 contracts → 6.1 api-server → 6.1.5 cms→lms namespace move → 6.2 day metadata + 7-day week → 6.3 labels platform mirror → 6.4 routes + P2034 retry → 6.4.5 Session routes → 6.5 client hooks → 6.6 DayRow UI → 6.7 Session body + dnd-kit. All sub-steps COMPLETED.
- **Step 7** — Block-level operations. **COMPLETED** 2026-05-18, decomposed:
  - 7.0 contracts → 7.1 api-server → 7.2 routes → 7.3 client hooks → 7.3.5 read-embed enabler → 7.3.6 Block @@unique constraint → 7.4 Block UI → 7.5 Intensity + TimeCap UI. All sub-steps COMPLETED.
- **Step 8.0a** — VO infrastructure в `lms/_shared/`: 11 new Zod schema modules. **COMPLETED** 2026-05-18 (`92b8f915..1608a83a`).
- **Step 8.0b** — Entity contract slice: Schema + SchemaRow + SchemaPairing + Archetype + drop `RowKind.CONNECTOR` per D12 + analysis-artifacts sync. **COMPLETED** 2026-05-18 (`55f5c49e..2d8a4409`).

## Pending (Step 8 trajectory per D9 split policy)

- **Step 8.1a** — `lmsSchemaApi` (CRUD + two-pass reorder + parent-vs-child discriminated create arg per D10 + sub-schema kind=ATOMIC invariant) + `verifySchemaOwnership` guard + `mapToSchema` mapper. `/feature` full mirror Step 7.1.
- **Step 8.1b** — `lmsSchemaRowApi` (CRUD + reorder mirror lmsBlockApi/lmsSessionApi pattern). `/feature` full mirror Step 7.1.
- **Step 8.1c** — `lmsSchemaPairingApi` (basic CRUD; UI deferred per D11). `/feature small`, thin scope.
- **Step 8.2** — Platform HTTP routes (per-entity split 8.2a/b/c возможен если grep > 6-7 files; collapsed if ≤6). `/feature small` mirror Step 7.2.
- **Step 8.3** — Platform client API + hooks (Schema + SchemaRow + Pairing). `/feature small` mirror Step 7.3.
- **Step 8.3.5** — `schemas[]` read-embed в `blockSchema` (bounded recursion safe per domain §1.5 sub.kind=atomic invariant). `/feature small` mirror Step 7.3.5.
- **Step 8.3.6** — SchemaRow `@@unique([schemaId, order])` + reorder two-pass (simple mirror Step 7.3.6). `/feature small`.
- **Step 8.3.7-pre** — WORKFLOW-001 fix per D13: `db:reset:for-tests` alias OR convention doc OR test migration (~2-3 files admin scope). `/feature small`.
- **Step 8.3.7** — Schema partial-unique constraint: `schemas_block_top_order` partial index в `apply-sql-checks.ts` WHERE parent_schema_id IS NULL + `@@unique([parentSchemaId, order])` Prisma DSL + reorder two-pass с dual scope semantics. `/feature small`, apply-sql-checks.ts touch.
- **Step 8.4** — ArchetypePicker + первые 3-4 hand-rolled archetypeParams forms (priority frequent: n-rounds + amrap-flat + ladder-descending + composite-rounds-with-rest). First coach-visible Schema editor end-to-end. `/feature` full.
- **Step 8.5..8.N** — Progressive archetype form additions (~30 remaining; pace 2-4 per sub-step; hand-roll vs generic fallback ratify per sub-step thesis). `/feature` full each. 7-10 additional sub-steps estimated.

Calendar для Step 8: 6-8 weeks (~3-5 days per sub-step cadence per Step 7 precedent).

## Pending (post Step 8)

- **Step 9** — SchemaRow editor (per-rowKind UI forms — 9 discriminator branches post-D12; shared Load / RepNotation / Intensity / Tempo / Side / Media / CompoundRep composites). Likely decomposes аналогично Step 7/8 pattern. Possibly merges с Step 8 if Schema editor naturally extends к Row editor inline.
- **Step 10** — End-to-end coach happy path smoke-test + cleanup + workflow close-out. Manual scenario validated by user + coach; defects fixed via `/fix` loop; workflow completion criteria per WORKFLOW.md verified. **Coach validation pause** per `[[training-domain-validation-gate]]` applies AT this step (NOT between 7.5 and 8) — coach validates с full surface → keep-vs-drop-vs-middle decision drives potential rip-eject contingency.
