# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Step 8.1b thesis cycle — `lmsSchemaRowApi` server endpoints

**Scope summary**: Second server-side touch for Schema vertical. CRUD + reorder + parent-kind invariant (rows ∈ non-NESTED schemas только) + `verifySchemaRowOwnership` guard + `mapToSchemaRow` discriminated-payload mapper. `/feature` full pipeline mirror Step 7.1 + Step 8.1a precedent. Second sub-step of Step 8.1 trajectory (Schema entity → SchemaRow → SchemaPairing).

**Wrapper choice**: `/feature` full (NOT `/feature small`). Carve-out per `[[always-via-feature-skill]]` does NOT apply — api-server slice + likely 25-30 integration tests (9-variant discriminated payload coverage = larger test footprint than Schema 8.1a's 33) = multi-layer scope.

**Thesis format**: per `[[feedback-thesis-format]]` — two voice-coded sections (coach view + developer view), each only Goal + Open Questions (with hypothesis). Plan: ~2-3 coach view OQs (forward-looking про что тренер увидит когда Step 8.4 UI ships — primarily SchemaRow editor inside ArchetypePicker forms) + ~10-12 developer view OQs (file granularity, payload-discriminator-on-update semantics, parent-kind invariant enforcement layer, `retryOnP2034` wrap scope, `verifySchemaRowOwnership` return shape, `mapToSchemaRow` discriminated payload parse strategy, test coverage per row-kind variant, commit strategy, anticipating Step 8.3.6 `@@unique([schemaId, order])`).

**Reference points для thesis-write**:

- `packages/api-server/src/endpoints/lms/schema/admin.ts` — Step 8.1a canonical api-server slice pattern (just shipped; closest precedent с 3-Json-column parse + structural-immutable update + 2-pass reorder).
- `packages/api-server/src/endpoints/lms/schema/admin.test.ts` — Step 8.1a integration test pattern (33 cases; mirror provisioning helper).
- `packages/api-server/src/endpoints/lms/schema/assertions.ts` — Step 8.1a sibling helper extraction precedent (D-1 ESLint mitigation).
- `packages/api-server/src/endpoints/lms/block/admin.ts` — Step 7.1 canonical api-server slice (Block precedent).
- `packages/api-server/src/mappers/lms/schema.mapper.ts` — Step 8.1a Json-column parse pattern (3 Zod `.parse(...)` calls).
- `packages/api-server/src/utils/retry-on-p2034.ts` — Step 6.4 wrap helper.
- SchemaRow entity contract — `packages/contracts/src/entities/lms/schema-row/*` (Step 8.0b shipped).
- `packages/contracts/src/entities/lms/schema-row/schema-row.schema.ts` — 9-variant discriminated `payloadSchema` (post-D12 RowKind.CONNECTOR drop).
- `packages/api-server/prisma/schema.prisma` — `model SchemaRow` definition (search lines).

**Critical surface для thesis OQs**:

- **Parent-kind invariant** per `analysis/artifacts/05-synthesis/domain-model.md §1.4 — rows live in schemas with kind ∈ {ATOMIC, HEADERLESS, NAMED, COMPOSITE} BUT NOT NESTED (nested schemas hold sub-schemas, not rows)**. Server-side enforcement at create: fetch parent schema → check `parent.kind !== "NESTED"`→ throw`BadRequestError("SchemaRow cannot be added к NESTED schema body — use sub-schemas instead", {parentKind})`.
- **`verifySchemaRowOwnership` return shape** — mirror `verifySchemaOwnership` chain + add `schemaId` field. Likely: `{status, schemaId, blockId, sessionId, dayId, weekId, planId, parentSchemaId?, schemaKind}`. Needed for downstream Step 8.3.5 read-embed mapping (when `rows[]` lands in `schemaSchema` output).
- **`mapToSchemaRow` discriminated payload parse** — `schemaRowPayloadSchema.parse(row.payload)` returns 9-variant union narrowed type. Zero `as` casts.
- **2-pass reorder per `[[planner-mutation-invariant-trace]]`** — anticipates Step 8.3.6 `@@unique([schemaId, order])` (full unique, no partial; rows scoped к single schemaId always).
- **`retryOnP2034` wrap scope** — yes per Step 6.4/7.1/8.1a precedent on `create` Serializable tx.
- **Payload-discriminator-on-update semantics** — D9-style structural immutability question: can coach change `rowKind` on update (e.g., EXERCISE → REST)? If yes, payload variant must align with new rowKind; if no, force delete+recreate. Hypothesis: forbid `rowKind` mutation per Step 8.1a D9 precedent (structural change requires delete+recreate). Editable subset: `payload` (within same `rowKind` variant) + `notes`.
- **`payload` write marshalling** — `payload Json` (non-null, required) — direct `toInputJson(data.payload)` (no `Prisma.JsonNull` ternary; mirror `archetypeParams` in Schema 8.1a).
- **Test coverage strategy** — 9 row-kind variants × 2-3 cases each = 18-27 happy-path; + invariant cases (parent.kind=NESTED rejection, structural-immutable rowKind mutation, etc); estimate ~25-30 cases.

**Pre-existing carry-forwards relevant к 8.1b**:

- **FIND-001 trigger point**: extract `resolveStorageContext` helper if 8.1a `create` body 132 LOC pattern repeats here. Likely YES — SchemaRow create has similar discriminated-scope-via-parent-fetch + payload marshalling pattern.
- **QA-F2 candidate fix-zone**: SchemaRow delete-blocked-by-PerformedExerciseInstance (when athlete entities materialize). May surface here or stay deferred.
- **QA-I1 trigger**: `TxClient` local alias now duplicated 3 sites (block, schema/admin, schema/assertions). Adding schema-row/admin + maybe schema-row/assertions = 5 sites. Hoist trigger fires if assertions sibling materializes.
- **`mapToBlockWithSchemas` mapper** still deferred к Step 8.3.5 (rows embed inside schemas embed). Out of 8.1b.
- **QA-022 `TxClient` Omit deny-list re-verify** — re-verify if Prisma upgraded since 7.1. No upgrade yet; skip.

**Push consideration**: PR #197 merged 2026-05-19 (Step 8.0a/8.0b/8.1a batched onto `main`). Branch `feat/training-domain` recreated from fresh `main` (0 commits ahead). Next PR candidate accumulates Step 8.1b + 8.1c (server vertical complete) per Step 6.x precedent; UI work (Step 8.4+) gets its own subsequent PR.

**Memory entry update done (8.1a close-out cycle)**: `[[planner-verbatim-registration]]` (c) body extended at `~/.claude/projects/-home-maksym-projects-contrib-the-discipline-program/memory/feedback_planner_verbatim_registration.md` to include "consumer-package `package.json` `exports` field whenever the step prescribes subpath imports" — applies to all subsequent steps that prescribe `from "@repo/<pkg>/<subpath>"`.

## After Step 8.1b close-out

Step 8.1c thesis cycle (`lmsSchemaPairingApi` — basic CRUD, UI deferred per D11; `/feature small` thin scope). Дальше per [01-step-queue.md](01-step-queue.md): 8.2 → 8.3 → 8.3.5 → 8.3.6 → 8.3.7-pre → 8.3.7 → 8.4 → 8.5..8.N.
