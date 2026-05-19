# Step 08.0b — Entity contract slice for Schema / SchemaRow / SchemaPairing / Archetype

- **Date**: 2026-05-18
- **Feature-dev artifacts**: `.feature-dev/1779173176/` (`research.md` + `tasks.md` thin pointers per § 9 minimum contract; `/feature small` wrapper invocation per ratified OQ-7).
- **Prompt**: `implementation/step-08.0b/prompt.md` (~3000 LOC; planner-written 2026-05-18 per 3 coach + 9 developer OQ hypothesis stack accepted — first thesis в new two-voice format per `[[feedback-thesis-format]]`).
- **Output**: `implementation/step-08.0b/output.md` (executor self-report — 40/40 acceptance ✓; 3 D-decisions + 3 Q-questions documented).

## Summary

**Second sub-step of Step 8 decomposition** — entity contract slice shipped в `packages/contracts/src/entities/lms/`: 4 new entity directories (`archetype/`, `schema/`, `schema-pairing/`, `schema-row/`) consuming Step 8.0a VOs. **4 atomic commits на `feat/training-domain`** (`55f5c49e..2d8a4409`):

1. `55f5c49e feat(contracts): add entity slices for schema row pairing archetype` — 33 new files (8 archetype + 9 schema + 8 schema-pairing + 8 schema-row) + barrel update (`lms/index.ts` 9→13 exports).
2. `4d39b8ac feat(api-server): drop rowkind connector enum value per d12` — `enum RowKind` minus `CONNECTOR` (10 → 9 values).
3. `1ee64b62 docs(analysis): sync artifacts after rowkind connector drop` — 5 analysis files synced (06-formalization/schema.prisma mirror + types.ts SchemaRowPayload variant + er-final.md table + 05-synthesis/domain-model.md §1.6.9 reframe + 06-formalization/implementation-notes.md §4.8 addendum).
4. `2d8a4409 docs(step-08.0b): write executor output report` — 40-item acceptance self-check.

**41 files / +2462 LOC**. Key shapes shipped:

- `schemaSchema` via `z.lazy()` + explicit `SchemaShape` type annotation (D-3 rename to resolve TS2308 conflict с public `Schema` from `schema.types.ts`).
- `schemaSchemaWithInvariants` via outer `.superRefine()` для sub-schema kind ∈ {ATOMIC, HEADERLESS} invariant.
- `trailingConnectorSchema` XOR refine via outer `.superRefine()` (form=then_n_rounds ↔ roundsCount).
- `archetypeParamsSchema` flat 34-variant discriminated union per types.ts:563-639 (extracted к `archetype-params.schema.ts` per D-1 ESLint max-lines:300 cap).
- `schemaRowPayloadSchema` 9-variant discriminated union (CONNECTOR DROPPED per D12) + regression test «rejects rowKind:CONNECTOR» (closes D12 regression surface).
- `schemaPairingSchema` minimal CRUD shape (no update — pairings immutable, delete + recreate).
- `archetypeSchema` read-only (no admin CRUD per D4).

**Dev DB reset + seed**: ran against Neon `ep-quiet-sunset-a2oa6hz6` per `[[discipline-program-db-non-prod]]` + ADR-0019. Seed reports Archetypes: 34.

**Verifications all-green**:

- `pnpm check-types` 16/16
- `pnpm lint` 16/16 (0 warnings)
- `pnpm test` 13/13 packages (contracts 738 / api-server 588)
- `pnpm dep:check` 0 violations / 1247 modules

**Streak continuation**: zero § 0 STOP-and-surface escalations (D-1/D-2/D-3 — executor-time adjustments to my planner-spec inconsistencies; recovery clean). Zero new planner-discipline flavours surfaced — nine existing flavours collectively held the bar. **Third cleanest run в ряд** (7.5 → 8.0a → 8.0b). Sixth `/feature small` invocation формально под `[[always-via-feature-skill]]`.

## Open questions resolved

- **D-1 (executor-time: extract `archetype-params.schema.ts` from `schema.schema.ts`)**: 34-variant `archetypeParamsSchema` + 24 per-archetype sub-schemas pushed `schema.schema.ts` к 340 LOC, exceeding ESLint `max-lines: 300` cap. Extracted union + sub-schemas к sibling `archetype-params.schema.ts` (231 LOC). `schema.schema.ts` consumes via `import { archetypeParamsSchema } from "./archetype-params.schema"`. Barrel includes both modules. Tests + types unchanged in semantics. Prompt § 4 acceptance #2 («7-8 files per dir») exceeded only для `schema/` (9 files). Adjacent refinement of `[[planner-lint-impact-trace]]` — ESLint `max-lines` was not surfaced as axis в Step 8.0b prompt § 5; existing rule covers (it lists «ESLint rules» as one axis), но specific `max-lines` constraint warrants future explicit anchor.

- **D-2 (executor-time: drop dead `countFormUnion` definition from prompt § 0.5/§ 3.1 verbatim spec)**: prompt defined `countFormUnion` as `z.union([...])` helper but never referenced в any of 34 variant definitions (`archetypeRoundsSetsParamsSchema` instead uses flat `countForm: z.enum(...)` + optional fields). Including unused const would trigger `no-unused-vars`. Removed per `[[no-tech-debt-in-mocks]]`. Behaviour-equivalent. Adjacent refinement of `[[planner-verbatim-registration]]` (c) — at prompt-write time verify every named helper in § 0/§ 3 is actually consumed (planner-spec internal-consistency check).

- **D-3 (executor-time: local `SchemaShape` type alias instead of exported `Schema` type from `schema.schema.ts`)**: prompt § 1.2 exported `type Schema` from `schema.schema.ts` for `z.lazy(): z.ZodType<Schema>` annotation, and § 1.4 also exported `type Schema = z.infer<typeof schemaSchema>` from `schema.types.ts`. Top-level barrel `export * from` both files → TS2308 «Schema has already exported». Renamed local annotation type к `SchemaShape` (private к `schema.schema.ts`); `schema.types.ts` keeps public `type Schema = z.infer<typeof schemaSchema>` (resolves к same shape). Adjacent refinement of `[[planner-lint-impact-trace]]` library type-system axis — TypeScript export duplicate detection через barrel re-export was not surfaced explicitly в Step 8.0b adversarial pass; existing rule covers (it lists «TypeScript strict flags» as axis), но specific «type-name collision across files in same barrel» warrants future explicit anchor.

- **Q-1 (record-keeping; pre-existing `z.nativeEnum` в plan-enrollment + training-plan)**: prompt § 0.A grep #2 expected 0 matches; actual returned 2 matches в `lms/plan-enrollment/plan-enrollment.schema.ts:5` + `lms/training-plan/training-plan.schema.ts:5`. Pre-existing legacy outside 8.0b touch surface. Acceptance #10 applies к new code shipped в this step. **Carry-forward added**: mechanical follow-up `as const` tuple + `z.enum` migration (see [state/03-deferred.md](../state/03-deferred.md) «z.nativeEnum migration»).

- **Q-2 (test count overshoot 738 vs estimate 660-710)**: planner-estimate was conservative; new tests 738 contracts (35 test files) = 230+ new tests. Не blocker.

- **Q-3 (initial draft tests с incorrect VO shapes)**: executor used `{value, unit}` для weightSchema + restSpecSchema; real shapes richer (`weightSchema = {variant, valueKg}` discriminated; `restSpecSchema = {duration:{value, unit, rangeMax?}, scope, qualifier?, setIndex?}`). Fixed during Phase 1/2 dev-loop via verbatim re-Read of `_shared/{load,cap-spec,weight}.ts`. Adjacent refinement of `[[planner-verbatim-registration]]` (c) — executor cited prompt verbatim quotes for VO shapes which were sufficient, но executor's first-draft test fixtures invented simpler shapes — lesson: при writing test fixtures, executor должен Read the source VO schema file first, не paraphrase from prompt quotes (which may be partial).

## Deferred decisions / carry-forwards (1 NEW + 11 pre-existing unchanged)

- **NEW: Q-1 — `z.nativeEnum` migration в pre-existing legacy** (mechanical follow-up, see state/03-deferred.md).
- **Pre-existing 11 from Step 8.0a close unchanged** — see state/03-deferred.md «Active» section.
- **CLOSED по Step 8.0b**: zero pre-existing carry-forwards closed (8.0b was foundation prep; downstream consumers fire Step 8.1+ when api-server slices arrive — DAY_INCLUDE hoist + BLOCK_WITH_LABELS_INCLUDE hoist + mapToBlockWithSchemas mapper).

## Analysis-artifacts touched

5 files synced (commit 3 `1ee64b62`):

- `06-formalization/schema.prisma` — RowKind enum mirror drop (`-1 line`).
- `06-formalization/types.ts` — `SchemaRowPayload` CONNECTOR variant removed (`-5 lines`).
- `06-formalization/er-final.md` — §3.3 row-payload table loses CONNECTOR; footnote pointer к `Schema.trailing_connector` (`+3 lines diff`).
- `05-synthesis/domain-model.md` — §1.6.9 ConnectorRow paragraph reframed к D12 canonical; §3.7 single-line-with-then-connector body cell + §3.13 Phase 5 ratify paragraph rewritten для cross-reference coherence (`+24 lines diff`).
- `06-formalization/implementation-notes.md` — §4.8 addendum recording D12 ratification trail (`+4 lines`).

## Smoke-test status

**N/A** — contracts-only step + read-only Prisma enum drop. First runtime consumer = Step 8.1a (`lmsSchemaApi`).

## Process note

**Third cleanest run в ряд** (Step 7.5 → Step 8.0a → Step 8.0b). D-1/D-2/D-3 — все executor-time adjustments to planner-spec inconsistencies (ESLint max-lines + dead helper + duplicate type export); recovery clean без `AskUserQuestion`. Zero new planner-discipline flavours surfaced — три adjacent refinements absorbed by existing 9 flavours (D-1/D-3 → (i) `[[planner-lint-impact-trace]]` axis extensions for ESLint max-lines + TypeScript barrel duplicate detection; D-2 → (c) `[[planner-verbatim-registration]]` planner-spec internal-consistency adjacent refinement; Q-3 → (c) executor test-fixture verbatim discipline). Memory entries unchanged (refinements minor enough к not warrant separate entries — flavours already wide-coverage). **First thesis в new two-voice format per `[[feedback-thesis-format]]`** (3 coach + 9 developer OQs); user ratified all 12 hypotheses cleanly.

**Implementation refactor**: post Step 8.0b close-out — `implementation/` directory restructured from monolithic `PLANNING_STATE.md` + `IMPLEMENTATION_LOG.md` к `state/` + `log/` folders per analysis/ pattern. This file (`log/step-08.0b.md`) is the first new-format step entry.

**Next planner action**: Step 8.1a thesis cycle (`lmsSchemaApi` server endpoints — `/feature` full mirror Step 7.1). See [state/04-next-action.md](../state/04-next-action.md).

**Push consideration**: branch теперь 9 commits ahead of `main` (PR #196 last merged 2026-05-18). PR candidate accumulates 8.0a + 8.0b + 8.1a/b/c per Step 6.x precedent.
