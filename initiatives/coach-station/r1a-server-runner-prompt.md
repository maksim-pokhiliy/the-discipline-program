# R1a — Clone server-engine — `/feature` runner prompt

> Self-contained prompt for a fresh `/feature` runner (you have none of the design context). Initiative: **coach-station** (Phase 2). Branch: this worktree (`worktree-coach-station`). This is **R1a — the server-side deep-clone engine ONLY**; the editor UI is the separate **R1b** wave. **No UI, no client-api-client methods, no query hooks in this wave** — server + contracts + routes + gated tests.

## Mission

Build a **server-side deep-clone endpoint family** over the training hierarchy `TrainingPlan → Week → Day → Session → Block → Schema(+SchemaGroup) → SchemaRow(+RowGroup)`. Two operations:

- **Replace (`clone-from`)** — week + day: delete the target's content, deep-copy a SOURCE subtree into it, in ONE transaction. **Copy = everything** (the full source subtree verbatim); the target keeps only its slot position (week `startDate` / day `dayOfWeek`).
- **Duplicate (`duplicate`)** — session + block + schema + row: deep-copy the node + its whole subtree, append to the SAME parent. Group members append to the SAME group (contiguity-preserving).

**This is purely ADDITIVE — no Prisma schema change, no migration, no reseed.** Clone reads + writes existing models. (Confirm: you add zero `model`/field to `schema.prisma`.)

## Scope

**IN:** (1) new zod contracts (request/response/params) per operation; (2) api-server endpoint methods with a shared deep-copy helper, transactional; (3) `apps/platform` route handlers; (4) gated api-server tests.

**OUT (→ R1b):** any React/UI, the affordances (`ContentCopyIcon` buttons, the source-picker modal, the danger-confirm), `api-client` methods, `@repo/query` hooks. R1a is server-verifiable on the gated suite with zero UI.

## Frozen ground truth — reuse these patterns VERBATIM (file:line; do NOT invent)

**Deep-read include (the full subtree shape):** `packages/api-server/src/endpoints/lms/_shared/schema-body-include.ts:3-14`

```ts
export const SCHEMA_BODY_INCLUDE = {
  rows: {
    orderBy: { order: "asc" },
    include: {
      modifierAssignments: { orderBy: { order: "asc" }, include: { modifier: true } },
    },
  },
  rowGroups: true,
} satisfies Prisma.SchemaInclude;
```

Week GET include tree: `endpoints/lms/week/admin.ts:25-54` — `Week → days → { label, sessions(order) → { label, blocks(order) → { labelAssignments(order)→label, schemas(order)→SCHEMA_BODY_INCLUDE, groups } } }`. This IS the subtree the clone must read + reproduce. Mappers: `mapToWeek` (`mappers/lms/week.mapper.ts:6`), `mapToSession`/`mapToBlock`/`mapToSchema`/`mapToSchemaRow` (`mappers/lms/`).

**Transaction template:** `endpoints/lms/schema/admin.ts:91-132` — `retryOnP2034(() => prisma.$transaction(async (tx) => { … }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))`. Use this for every clone op.

**Order assignment:** append = `(max._max.order ?? 0) + 10` (session `admin.ts:89-94`, block `:103-108`, row `:114-118`). Grouped insert = `resolveGroupedOrder()` (`schema/admin.ts:35-73` — shifts schemas after the last group member by `+10`, returns `lastMemberOrder + 10`) + `nextOrderInScope()` (`schema/create-steps.ts:44-51`). For a **replace** deep-copy, re-sequence the copied nodes `(i+1)*10` per parent.

**Contiguity guards:** `assertGroupMembersContiguous(blockSchemas, groupId)` (`schema/assertions.ts:9-36`), `assertRowGroupMembersContiguous(rows, rowGroupId)` (`schema-row/assertions.ts:5-32`). Call after any grouped append.

**Ownership:** `verifyPlanOwnership` (`lms-guards.ts:10-34`), `verifySchemaOwnership` (`:157-227`), `verifyBlockOwnership` (`:93-155`), `verifyGroupOwnership` (`lms-group-guards.ts:10-75`), `verifyRowGroupOwnership` (`lms-row-group-guards.ts:10-82`) — each walks `entity → … → plan` and checks `creatorId === userId || isAdminOrHeadCoach(role)`. Plus `assertPlanWritable(tx, planId)` (ARCHIVED guard). Every clone op verifies BOTH the target AND (for replace) the source belong to the SAME plan + caller.

**Idempotency (auto-wired):** `createAuthPostByParamHandler(...)` wraps the handler with `wrapAuthHandler(inner, JSON_CONFIG)` which applies `prismaIdempotencyStore` (`api-server/src/idempotency/prisma-idempotency-store.ts`); the client sends `Idempotency-Key` (`IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9_-]{1,256}$/`). A clone POST through this factory is idempotent for free. No new idempotency code.

**Cascade chain (for replace delete):** `schema.prisma` — `Week→TrainingPlan`, `Day→Week`, `Session→Day`, `Block→Session`, `SchemaGroup→Block`, `Schema→Block`, `SchemaRow→Schema`, `RowModifierAssignment→SchemaRow`, `RowGroup→Schema`, `BlockLabelAssignment→Block` are ALL `onDelete: Cascade`. `Schema.groupId`/`SchemaRow.rowGroupId` = `SetNull`. `SchemaRow.exerciseId` = `Restrict` (clone re-references, never deletes exercises → safe). So **replace deletes the target's Days (`tx.day.deleteMany({ where: { weekId }})`) and the cascade clears everything below**; the Week slot row itself stays. (Verify the FK cascade is live under `db:push` — if Prisma didn't emit ON DELETE CASCADE, delete bottom-up explicitly. Confirm against the live DB in the gated test.) Also sweep `prisma/sql/lms-checks.sql` — the partial unique `schemas_block_order ON ("blockId","order")` must hold after the bulk insert.

**Route registration:** `apps/platform/src/app/api/platform/training-plans/[planId]/schemas/route.ts:18-32` — `withCoachAuth(withAuthRateLimit(createAuthPostByParamHandler(apiFn, paramsSchema, requestSchema, responseSchema), RATE_LIMIT_TIER.API))`. Mirror exactly for each clone route.

## Endpoints to build

| Op           | Route (`POST`)                                             | Body                                                                  | Semantic                                                                                                     | Response                       |
| ------------ | ---------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| Week replace | `…/training-plans/[planId]/weeks/[startDate]/clone-from`   | `{ sourceStartDate }`                                                 | delete target week's Days → deep-copy source week's Days (full subtree). Empty source → no-op.               | the rebuilt week (`mapToWeek`) |
| Day replace  | `…/[planId]/weeks/[startDate]/days/[dayOfWeek]/clone-from` | `{ sourceStartDate, sourceDayOfWeek }` (source = any day in the plan) | delete target day's content → deep-copy source day (label + notes + sessions↓). Empty source → no-op.        | the rebuilt day                |
| Session dup  | `…/[planId]/sessions/[sessionId]/duplicate`                | `{}`                                                                  | deep-copy session → append to same day                                                                       | new session (`mapToSession`)   |
| Block dup    | `…/[planId]/blocks/[blockId]/duplicate`                    | `{}`                                                                  | deep-copy block → append to same session                                                                     | new block (`mapToBlock`)       |
| Schema dup   | `…/[planId]/schemas/[schemaId]/duplicate`                  | `{}`                                                                  | deep-copy schema → append to same block; if grouped → same group (`resolveGroupedOrder` + contiguity assert) | new schema (`mapToSchema`)     |
| Row dup      | `…/[planId]/schema-rows/[schemaRowId]/duplicate`           | `{}`                                                                  | deep-copy row → append to same schema; if grouped → same rowGroup                                            | new row (`mapToSchemaRow`)     |

**Empty-source contract:** the `clone-from` response is a union — `{ cloned: true, … }` on success or `{ cloned: false, reason: "empty-source" }` (HTTP 200, NO delete) when the source has no content. (The R1b UI blocks empty sources in the picker — D-6 — but the server is the source of truth; enforce the guard here too.)

## The deep-copy helper (the engine)

A shared recursive deep-copy over the subtree, in the open `tx`, producing fresh `cuid`s at every node and:

- **Re-references the shared catalog — NEVER duplicates it:** `SchemaRow.exerciseId` (FK), `RowModifierAssignment.modifierId`, `BlockLabelAssignment.labelId`, `media` URLs → copy the reference value as-is, pointing at the same catalog rows.
- **Copies every leaf field + VO:** `load` / `tempo` / `side` / `intensity` / `composition` (Json VOs), `notes` (`Json?` `string[]`), `header`, `sets`, `reps`, etc. — verbatim.
- **Copies group containers + remaps membership:** for a subtree that contains `SchemaGroup`s / `RowGroup`s, create NEW container rows and point the copied schemas/rows at the new `groupId` / `rowGroupId` (preserve `interleaveOrder` + the group's notes). This is why "groups aren't cloned" (no standalone group-clone button) does NOT exempt groups inside a subtree clone — they're part of the subtree and must be reproduced.
- **Re-sequences `order`** per parent as `(i+1)*10` in source order (replace), or appends at `(max ?? 0)+10` (duplicate), or `resolveGroupedOrder` (grouped duplicate).
- **Joins via `createMany`** after each parent (mirror block-create's `blockLabelAssignment.createMany`, row-create's modifier assignment writes).

## Phases (commit units — aggressive, final state green)

1. **Contracts** (`packages/contracts/src/entities/lms/…`): the `clone-from` (week/day) + `duplicate` (session/block/schema/row) request/params/response schemas. The `clone-from` response union (`cloned` discriminant). Reuse existing `…ByPlanParamsSchema` patterns; register in the entity barrels (read them verbatim first — `[[planner-verbatim-registration]]`).
2. **api-server** (`endpoints/lms/<entity>/admin.ts` + a new `_shared/deep-clone.ts`): the deep-copy helper + the six api methods, each `retryOnP2034 + $transaction(Serializable)`, ownership-guarded (target + source same-plan), empty-source no-op for replace.
3. **Routes** (`apps/platform/src/app/api/platform/training-plans/…`): six route files mirroring the schemas-route composition.
4. **Tests** (gated api-server, live Neon): see acceptance.

## Decisions / red lines

- **D-3:** server-side, ONE transaction per clone. No client orchestration. **D-4 / D-6:** the per-floor semantics + "copy = everything" + empty-source no-op + any-source-in-plan.
- **Re-reference the catalog, never duplicate Exercises/Modifiers/Labels/Equipment.**
- **Reuse the quoted patterns verbatim** (transaction / order / `resolveGroupedOrder` / ownership / idempotency / route composition) — do NOT hand-roll. In particular do NOT hand-roll a clustering/child-count check; the read-side `buildBlockItems`/`buildRowItems` one-predicate is sacred — clone writes data, it must not touch or break those.
- **Additive only** — zero `schema.prisma` change, no migration, no reseed. If you find yourself editing Prisma, STOP — you've misread the scope.
- **Source must be same-plan** — reject a cross-plan `sourceStartDate` (ownership walk + explicit `planId` match) with `NotFound`/`BadRequest`.

## Acceptance

- `check-types` / `lint` / `dep:check` green.
- **Gated api-server suite green** (`pnpm db:reset && pnpm db:seed && pnpm --filter @repo/api-server test` — the owner's manual ritual; `db:seed` is users-only now, so the tests SELF-FIXTURE a plan/week/catalog). New tests prove:
  - **Deep round-trip:** build a rich subtree (multiple days/sessions/blocks; a `SchemaGroup` with 2 tracks; a `RowGroup`; rows with modifiers + labels + every load/tempo/side VO + notes), clone it at each floor, assert the clone is structurally identical, fresh ids everywhere, **same catalog refs**, `order` + group/rowGroup membership + contiguity intact, **source untouched**.
  - **Replace** deletes the target subtree and reproduces the source; **empty source → no delete + `{cloned:false}`**.
  - **Idempotency:** double POST with the same key = one clone.
  - **Ownership:** non-owner / cross-plan source → rejected.
  - **Cascade verified live** (the replace delete clears the whole subtree; `lms-checks.sql` unique holds).

## Adversarial pass (run before locking each op)

- **Concurrency:** two clones into the same target → Serializable + `retryOnP2034` (or idempotency) yields one consistent result, no half-tree.
- **Empty / already-empty target:** replace with empty source = no-op (guard); replace into an already-empty target = plain copy.
- **Grouped duplicate:** schema/row duplicate inside a group keeps members contiguous (`resolveGroupedOrder` + assert) — and does NOT land at the block/schema tail if that breaks contiguity.
- **Group-container remap:** a block/session/week clone reproduces inner `SchemaGroup`/`RowGroup` as new containers with members repointed — no member left on a source-side `groupId`.
- **`exerciseId` Restrict:** copying a ref to an existing exercise is fine; never delete/dup an exercise.
- **Order stepping:** `×10` leaves head-room; a replace re-sequences from scratch.
