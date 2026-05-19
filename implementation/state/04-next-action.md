# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Step 8.1a thesis cycle — `lmsSchemaApi` server endpoints

**Scope summary**: First server-side touch для Schema-vertical. CRUD + two-pass reorder + parent-vs-child discriminated create arg per D10 + sub-schema kind=ATOMIC invariant + `verifySchemaOwnership` guard + `mapToSchema` mapper. `/feature` full pipeline mirror Step 7.1 precedent.

**Wrapper choice**: `/feature` full (NOT `/feature small`). Carve-out per `[[always-via-feature-skill]]` does NOT apply — api-server slice + likely 15-20 integration tests = multi-layer scope.

**Thesis format**: per `[[feedback-thesis-format]]` — two voice-coded sections (coach view + developer view), each only Goal + Open Questions. Plan: ~3 coach view OQs (mostly forward-looking про что тренер увидит когда Step 8.4 UI ships) + ~10-15 developer view OQs (canonical мирror Step 7.1 questions: file granularity, two-pass reorder pattern per D10 sub-schema semantics, retryOnP2034 wrap, verifySchemaOwnership return shape, mapToSchema parse-on-read pattern, test coverage, commit strategy).

**Reference points для thesis-write**:

- `packages/api-server/src/endpoints/lms/block/admin.ts` — Step 7.1 canonical api-server slice pattern
- `packages/api-server/src/endpoints/lms/block/admin.test.ts` — Step 7.1 integration test pattern (29 cases)
- `packages/api-server/src/endpoints/lms/_shared/{date,day-of-week}.ts` — shared helpers
- `packages/api-server/src/endpoints/lms/session/admin.ts` — Step 6.1 precedent (parent-of-Block analog)
- `packages/api-server/src/mappers/lms/{block,session,day}.mapper.ts` — mapper canonical pattern
- `packages/api-server/src/utils/retry-on-p2034.ts` — Step 6.4 wrap helper
- Schema entity contract — `packages/contracts/src/entities/lms/schema/*` (Step 8.0b shipped)

**Critical surface для thesis OQs**:

- Two-pass reorder per `[[planner-mutation-invariant-trace]]` 8th flavour (Schema lacks `@@unique` сейчас but Step 8.3.7 will add partial-unique → reorder pattern must anticipate)
- Parent-vs-child discriminated create arg shape: `{blockId} | {parentSchemaId}` (per D10). Single `lmsSchemaApi.create(scope, data)` OR two methods `createTopLevel` / `createSubSchema`?
- Sub-schema invariant enforcement: server-side check `parent.kind === 'NESTED'` before insert + `child.kind ∈ {ATOMIC, HEADERLESS}` (per domain §1.4 + §1.5)
- `retryOnP2034` wrap: yes per Step 6.4/Step 7.1 precedent
- `verifySchemaOwnership` return shape: должен include `{status, blockId, sessionId, dayId, weekId, planId, parentSchemaId?}` для downstream Step 8.1b SchemaRow chain reuse
- `mapToSchema` — parses `intensitySchema` + `archetypeParamsSchema` + `trailingConnectorSchema` from JSON columns at read time (zero `as` casts per `[[type-quality]]`)

**Pre-existing carry-forwards relevant к 8.1a**:

- QA-022 (TxClient Omit deny-list) — re-verify if Prisma upgraded since 7.1
- `mapToBlockWithSchemas` mapper trigger когда schemas[] embed lands (Step 8.3.5 — after 8.1a)

**Push consideration**: branch теперь 9 commits ahead of `main` (8.0a 2 commits + 8.0a close-out + 8.0b prompt commit + 8.0b 4 commits + this refactor commit). Batch PR candidate accumulates через 8.1a/b/c (server vertical complete) per Step 6.x precedent. Push consideration не блокирует thesis cycle.

## After Step 8.1a close-out

Step 8.1b thesis cycle (`lmsSchemaRowApi` — mirror Step 7.1 pattern). Дальше per [01-step-queue.md](01-step-queue.md): 8.1c → 8.2 → 8.3 → 8.3.5 → 8.3.6 → 8.3.7-pre → 8.3.7 → 8.4 → 8.5..8.N.
