# Step 08.1a — `lmsSchemaApi` (CRUD + two-pass reorder + parent-vs-child discriminated create) + `verifySchemaOwnership` + `mapToSchema`

- **Date**: 2026-05-19
- **Feature-dev artifacts**: `.feature-dev/1779188538/` (Stage 1-7: research / design / plan / review / qa / tasks).
- **Prompt**: `implementation/step-08.1a/prompt.md` (~2140 LOC; planner-written 2026-05-19 in two-voice format per `[[feedback-thesis-format]]` — 3 coach + 13 developer OQs ratified upfront; mid-cycle § 0.8 PREREQ patch landed before executor pickup per Step 8.0b drift escalation).
- **Output**: `implementation/step-08.1a/output.md` (executor self-report — 21/21 acceptance ✓; 6 D-decisions + 0 § 0 escalations).

## Summary

**First server-side touch for Schema vertical** — full slice shipped under `packages/api-server/src/endpoints/lms/schema/`. 6 atomic commits on `feat/training-domain` (`3545ab52..f8bf917b`, plus docs commit `52a49d43`):

1. `3545ab52 feat(contracts): add archetype schema schema-pairing schema-row to exports map` — Step 8.0b drift fix (D-4 prereq); 4 lines in `packages/contracts/package.json` unblocking `@repo/contracts/lms/schema` subpath imports.
2. `bee94b97 feat(api-server): add verifyschemaownership guard for schema ownership chain` — `verifySchemaOwnership` 8-field return shape `{status, blockId, sessionId, dayId, weekId, planId, parentSchemaId, kind}` + 4 guard tests.
3. `4da6d75a feat(api-server): add lms schema mapper with archetypeparams intensity trailingconnector parse` — `mapToSchema` flat scalar+parse pattern; three `.parse(...)` Zod calls; zero value-casts.
4. `0d7c6943 feat(api-server): add lmsschemaapi with crud and two-pass reorder` — `lmsSchemaApi.{create, update, delete, reorder}` + helpers extracted to sibling `assertions.ts` per D-1 ESLint mitigation; 29 main-series integration tests.
5. `f8bf917b test(api-server): cover qa must-test gaps for lmsschemaapi` — Stage 7 +2 must-test gap-fills (QA-Must-Test-36 explicit `parentSchemaId: null` rejection + QA-Must-Test-37 duplicate-ids reorder defense-in-depth).
6. `52a49d43 docs(step-08.1a): write executor output report` — Stage 8 executor self-report.

**10 files / +2456 / -313 LOC** (largest single delta this trajectory; ~1295 LOC integration tests dominate). 33 integration cases in `schema/admin.test.ts` + 4 cases in `guards.test.ts`. Key shapes shipped:

- **D10 discriminated scope**: `type CreateScope = { blockId: string } | { parentSchemaId: string }` at api method signature; TS narrows via `"blockId" in scope` / `"parentSchemaId" in scope`; storage `Schema.blockId` resolves to top-level Block (sub: via `parent.blockId` lookup) so cascade-on-Block-delete works uniformly through nesting levels.
- **Archetype consistency cross-checks**: `assertArchetypeConsistency` (tx-bound) — `tx.archetype.findUnique` existence + `archetype.kind === data.kind` + `data.archetypeParams.archetype === archetype.name` literal alignment.
- **Sub-schema invariants**: `assertSubSchemaInvariants` (sync) — `parent.kind === "NESTED"` + `data.kind ∈ {ATOMIC, HEADERLESS}`. Defense-in-depth (contract `createSchemaSchema` ships without `.superRefine`; `schemaSchemaWithInvariants` unused for input parsing).
- **Structural-fields-immutable on `update`**: `STRUCTURAL_UPDATE_KEYS = ["kind", "archetypeId", "parentSchemaId", "blockId"] as const`; filter+throw at entry; `archetypeParams` allowed only within-variant (server cross-validates `data.archetypeParams.archetype === current.archetype.name`).
- **Canonical 2-pass reorder** uniform across both scopes (`-(i+1)` → `(i+1)*10`) anticipating Step 8.3.7 partial-unique `schemas_block_top_order`; sub-scope uniform-cost trade-off (~1 wasted UPDATE per ID — negligible).
- **`retryOnP2034` wraps `create` only**; update/delete/reorder unwrapped (no Serializable surface).
- **`mapToSchema`** zero `as` casts — three Zod `.parse(...)` calls (ternary for nullable `intensity` + `trailingConnector`; direct for non-null `archetypeParams`).
- **D-1 contingency fired**: `admin.ts` raw 304 LOC / non-blank 256 LOC; helpers extracted к sibling `assertions.ts` (57 LOC) pre-emptively to leave headroom for FIND-001 follow-up.

**Verifications all-green**:

- `pnpm check-types` 16/16 (30.5s)
- `pnpm lint` 16/16 (0 warnings, 9.56s)
- `pnpm --filter @repo/api-server test` 625 cases (588 baseline + 33 schema admin + 4 guards = 625)
- `pnpm test` (root) — Stage 9 confirmed по completion report; total ~1361-1363 cases
- `pnpm dep:check` 0 violations / 1252 modules (+5 from 1247 baseline: admin.ts + admin.test.ts + index.ts + schema.mapper.ts + assertions.ts)
- Husky pre-commit / pre-push all 5 commits clean; zero `--no-verify`/`--no-edit`/`--no-gpg-sign`
- Branch convention preserved (`feat/training-domain` long-lived; no `feat/<slug>` cut)
- `analysis/` directory diff empty

**Streak continuation**: zero § 0 STOP-and-surface escalations. **Fourth cleanest run в ряд** (7.5 → 8.0a → 8.0b → 8.1a). D-1/D-2/D-3/D-4/D-5/D-6 — все planner-ratified prompt-time или mitigation-spec'd (executor's labels in output.md are inline-divergence captures; none surfaced new workflow trajectory decisions).

**One executor-time prereq escalation** ratified mid-cycle: Step 8.0b drift in `packages/contracts/package.json` exports map (4 missing subpath entries). Resolved via D-4 prereq commit per `[[inline-fix-pre-existing]]` rule (all 4 entries bundled vs single-entry deferral) — closed via Commit 0. Two-layer planner discipline finding documented в Process note.

## Open questions resolved

- **D-1 (executor-time: extract `assertArchetypeConsistency` + `assertSubSchemaInvariants` к sibling `assertions.ts`)**: `admin.ts` post-Phase 3 wrap landed на 304 raw LOC, marginally above ESLint `max-lines: 300` cap. `skipBlankLines: true` config-bar made the raw 304 = non-blank 256 which technically fits, BUT extraction was applied pre-emptively per Stage 4 wrap-time decision к leave headroom для FIND-001 follow-up (`resolveStorageContext` helper candidate). Helpers consume `tx: TxClient` (async path) and pure synchronous-throw form (`assertSubSchemaInvariants`); behaviour-equivalent inline form. 2-way reversible. Adjacent refinement of `[[planner-lint-impact-trace]]` (i) — ESLint `max-lines` was anchored explicitly in prompt § 3 Phase 3 mitigation note; executor pre-emptively executed mitigation rather than waiting для overflow — clean.

- **D-2 (test count 33 vs 28-32 prompt-target upper-cap)**: Stage 7 hostile QA surfaced 2 must-test gaps (QA-Must-Test-36 explicit `update({parentSchemaId: null})` rejection + QA-Must-Test-37 duplicate-ids reorder defense-in-depth). Added к separate commit `f8bf917b test(api-server): cover qa must-test gaps for lmsschemaapi`. Per `[[research-full-detail]]`-style discipline — «no upper cap when quality demands». Test runtime delta ~3-5 sec inside 15s budget.

- **D-3 (`retryOnP2034` wraps `create` only)**: planner-ratified OQ-D8 prompt-time; executor implemented per ratify. `update`/`delete` use default-isolation single-statement (no Serializable surface, no SSI race). `reorder` uses default-isolation `prisma.$transaction([...])` array form (no Serializable wrap, no P2034 surface). QA-B4 surfaced concurrent-create-during-reorder race без retry — deferred to Step 8.2 HTTP layer retry semantics per qa.md § K.

- **D-4 (prereq commit bundles all 4 exports-map entries)**: ratified mid-cycle by planner during executor escalation. Drift root affected all 4 Step 8.0b entity barrels (`archetype`, `schema`, `schema-pairing`, `schema-row`); single 1-line fix would have triggered duplicate prereq-dance on Step 8.1b (SchemaRow) + Step 8.1c (SchemaPairing). Per `[[inline-fix-pre-existing]]` — 4 lines, same file, same single PR window. Zero functional impact on 8.1a; Steps 8.1b/c freed from prereq overhead.

- **D-5 (mapper via `.parse()` not `as` casts)**: planner-ratified prompt OQ-D5; three Zod `.parse(...)` calls в `schema.mapper.ts` (ternary для nullable `intensity` + `trailingConnector`; direct для non-null `archetypeParams`). Zero `as ArchetypeParams` / `as Intensity` / `as TrailingConnector` / `as unknown` casts. DB content drift surfaces explicitly через `ZodError` → caught by `handlePrismaError`'s ZodError arm. Per manifesto 2.3 + `[[type-quality]]`.

- **D-6 (2-pass reorder uniform для top-level + sub-scope)**: planner-ratified OQ-D6 prompt-time; executor applied uniform 2-pass UPDATE (`-(i+1)` → `(i+1)*10`) для обоих scopes despite sub-scope не needing constraint protection (Step 8.3.7 partial-unique covers only top-level via `WHERE parent_schema_id IS NULL`). Uniform code clearer; cost ≈ 1 wasted UPDATE per ID per pass on sub-reorders — negligible.

- **Paraphrase imprecisions caught Stage 1 (non-material; no escalation needed)**:

  - § 0.5 omitted `ZodError` arm in `handlePrismaError` verbatim quote (lines 50-60) — real mapper triggers this arm on DB corruption via `.parse(...)`.
  - § 0.7 named `_shared/connector-form.ts` but actual location is `_shared/enums.ts:29` re-exported through `_shared/index.ts` barrel; import path `from "../_shared"` correct.
  - § 0.1 omitted 5th method `assignLabels` on `lmsBlockApi` mirror — Schema correctly omits (no M:N labels surface on Schema entity).

  Adjacent refinement of `[[planner-verbatim-registration]]` (c) — Stage 1 verification of verbatim quotes against HEAD caught all 3 imprecisions before they affected the build. Existing rule covers (it mandates verbatim quotes); future planner should re-Read every quoted source file at prompt-write rather than reconstructing from memory.

## Deferred decisions / carry-forwards (5 NEW WARNING + 2 review FIND + 8 NEW INFO + 1 cross-step planner-discipline finding + 11 pre-existing)

### NEW WARNING — surface к state/03-deferred.md

- **QA-B4 — `reorder` без `retryOnP2034`** (concurrent create on same scope can lose reorder under SSI). Mirror Block precedent. Defer к Step 8.2 HTTP layer retry semantics — backend-level retry preserves UX without bloating api-server method.
- **QA-C2 — `handlePrismaError` не маппит `P2028` (tx-timeout)** — surfaces as raw 500. Out-of-zone (file unmodified by Step 8.1a). Recommend separate `/fix` ticket covering all guards' P2028 handling.
- **QA-D1 — `reorderSchemasSchema.orderedIds` имеет `.min(1)` без `.max()` cap** — DoS-class via tx-timeout на гигантских массивах. Out-of-zone (Step 8.0b contracts territory). Recommend Step 8.0b follow-up `.max(1000)` или `/fix`.
- **QA-E3 — All 4 guards (Plan/Block/Schema + future Row/Pairing) propagate `PrismaClientValidationError` on `userId = undefined`** — should defensively early-throw `ForbiddenError` or `BadRequestError`. 4 × 2-line defensive fix exceeds inline-fix threshold (5 LOC). Recommend separate cross-guard `/fix` covering all guards uniformly.
- **QA-F2 — Delete-blocked-by-PerformedExerciseInstance surfaces as misleading "Referenced Schema does not exist" P2003 message** — actually FK violation. Defer к Step 8.1b/c (SchemaRow API + delete-blocked semantics + improved error message).

### NEW WARNING — Review FINDs

- **FIND-001 — `lmsSchemaApi.create` body 132 lines exceeds manifesto 2.2 soft cap of 100** — drivers: discriminated-scope full TOCTOU re-fetch (~45 lines) + 3-Json-column conditional marshalling (~20 lines) + tx-wrapper boilerplate. Block precedent `create` at 91 lines; Session at 88. Acceptable per «up to 100 with explicit reason» rule, but flagged as candidate для `resolveStorageContext` helper extraction в Step 8.1b/c (~35-line savings; brings create к ~97 lines). Effort S; not blocking.
- **FIND-002 — Pre-existing timing flake `block/admin.test.ts:406`** (assertion `expect(elapsed).toBeLessThan(50)` on retryOnP2034 skip-on-P2002 path). Surfaced run 1, passed run 2 — non-deterministic under Neon DEV latency variance. Originated commit `44945d92` (Step 7.1). Already tracked в pre-existing carry-forward QA-023 — confirmed still flaky in 8.1a CI run.

### NEW INFO — surface briefly

- QA-A3 int32 overflow on `_max(order) + 10` after 200M+ inserts.
- QA-A4 UTF-16 vs codepoint length semantics на `header.max(500)` для emoji-heavy headers.
- QA-A5 discriminated-scope runtime-erasure `{blockId, parentSchemaId}` silent top-route if both passed (TS prevents at compile-time but JSON over wire could).
- QA-B1 P2034 retry-exhaustion deterministic (no jitter caps).
- QA-B2 P2003 message imprecision Block-vs-Schema differentiation (defaults к entity context).
- QA-B5 last-writer-wins reorder без optimistic-concurrency.
- QA-F3 duplicate-id reorder error reports `missing: []` (partially covered Stage 7 test C30).
- QA-I1 `TxClient` structural-typing leak — local alias duplicated across `block/admin.ts` + `schema/admin.ts` + `schema/assertions.ts`; future hoist к `endpoints/lms/_shared/` when 3rd consumer materializes (likely Step 8.1b or 8.1c).

### NEW Cross-step planner-discipline finding

- **`[[planner-verbatim-registration]]` (c) adjacent refinement** — extend rule body к explicitly include "consumer-package `package.json` `exports` field" alongside barrels/dep-cruiser/turbo.json/pnpm-workspace.yaml when subpath imports are prescribed. Two-layer miss surfaced 8.1a-time:

  1. **Step 8.0b ship-time miss**: executor created entity barrels (`archetype`, `schema`, `schema-pairing`, `schema-row`) but did NOT sync `packages/contracts/package.json` exports map. Step 7.0 precedent shipped Block subpath + exports together — pattern broken at 8.0b. Step 8.0b close-out did not catch.
  2. **Step 8.1a prompt-write miss**: planner (me) Read entity barrel directory + entity files verbatim at prompt-write phase per (c), but did NOT Read consumer-package `package.json` exports map verbatim. All planner-prescribed subpath imports (Phase 1 `type SchemaKind`, Phase 2 mapper trio, Phase 3 endpoint+tests) would have failed `ERR_PACKAGE_PATH_NOT_EXPORTED` at executor runtime.

  **Recovery**: executor escalated cleanly via `AskUserQuestion` mid-pipeline with 3 hypothesis-options + recommendation. Planner ratified Option 2 (D-4 bundle-all-4) inline. Prompt patched (§ 0.8 PREREQUISITE sub-block + § 7 Commit 0). Step 8.1b/c freed of duplicate dance.

  **Memory update**: extend `[[planner-verbatim-registration]]` body 1-2 sentences к include consumer-package `package.json` exports field axis. Do NOT create new flavour (existing covers; this is axis expansion only — same precedent as Step 8.0b D-1/D-3 adjacent refinements absorbed без separate flavour).

### Pre-existing 11 from Step 8.0b close (unchanged)

See [state/03-deferred.md](../state/03-deferred.md) for full list. Subset relevant к 8.1b/c: `DAY_INCLUDE` hoist (Step 8.3.5 trigger), `BLOCK_WITH_LABELS_INCLUDE` hoist (Step 8.3.5 trigger), `mapToBlockWithSchemas` mapper (Step 8.3.5 trigger), WORKFLOW-001 (Step 8.3.7-pre per D13).

### CLOSED по Step 8.1a (zero pre-existing closed)

8.1a was foundation prep для Schema vertical; downstream consumers (`DAY_INCLUDE` hoist, etc) fire Step 8.3.5+ when read-embed lands.

## Analysis-artifacts touched

**None** — Step 8.1a is api-server slice only, no Prisma schema change, no domain semantics change. `git diff 4d280c55..HEAD -- analysis/` returns 0 lines per output.md verification table.

## Smoke-test status

**N/A** — api-server slice без HTTP exposure. First runtime consumer = Step 8.2 (HTTP routes). UI smoke возобновится Step 8.4 (ArchetypePicker + 34-variant archetypeParams typed forms = first coach-visible Schema editor).

## Process note

**Fourth cleanest run в ряд** (Step 7.5 → 8.0a → 8.0b → 8.1a). Zero § 0 STOP-and-surface escalations через executor Stage 0-9 pipeline. One legitimate mid-cycle escalation surfaced + cleanly resolved (Step 8.0b drift in `packages/contracts/package.json` exports map — D-4 prereq bundle). All 6 D-decisions either planner-ratified at prompt-write time (D-3/D-5/D-6/D-4) или inline-divergence per pre-spec'd mitigation (D-1 ESLint max-lines extraction) или QA-driven gap-fills (D-2 +2 must-test cases). No new workflow trajectory decisions surfaced — six 9-planner-discipline flavours collectively held the bar.

**Two-voice thesis format proven сольно** — second invocation after Step 8.0b. 3 coach + 13 developer OQs ratified в single pass; user accepted all 16 hypotheses без contр-points. Format scales beyond first-use precedent; codification holds.

**Largest single-step delta this trajectory** — 10 files / +2456 / -313 LOC (1295 LOC integration tests dominate). Sub-100 LOC integration-test footprint per case (~40 LOC each across 33+4 = 37 cases) due to per-test provisioning + cleanup pattern mirror Block precedent. Acceptable per `[[no-tech-debt-in-mocks]]` (real DB, real archetypes, no Prisma mocking).

**One cross-step planner-discipline finding** (see Deferred § «NEW Cross-step»). Adjacent refinement of `[[planner-verbatim-registration]]` (c) — extend body к include consumer-package `package.json` `exports` field. Memory entry update queued (axis expansion, not new flavour). Step 8.0b close-out не caught the drift originating in its scope; Step 8.1a planner inherited the gap; executor escalated cleanly. Recovery protocol worked as designed.

**Next planner action**: Step 8.1b thesis cycle (`lmsSchemaRowApi` — second sub-step of Step 8.1 trajectory; SchemaRow CRUD + reorder mirror Step 7.1/8.1a pattern). See [state/04-next-action.md](../state/04-next-action.md).

**Push consideration**: branch теперь 15 commits ahead of `main` (8.0a 2 commits + 8.0a close-out + 8.0b prompt commit + 8.0b 4 commits + refactor commit + 8.0b output docs + 8.1a 6 commits = 15). PR candidate accumulates через 8.1b/c (server vertical complete) per Step 6.x precedent.
