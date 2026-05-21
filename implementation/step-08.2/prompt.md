# Step 8.2 — Platform HTTP routes (`Schema` / `SchemaRow` / `AlternatingGroup` api slices)

**Wrapper**: `/feature` full pipeline. ~10 new `route.ts` files across 3 entities, a cross-package contract change (`packages/contracts` route-param + reorder-scope schemas), and a non-trivial manual-transform in the `Schema` create/reorder handlers. NOT `/feature small` — Step 7.2 (Block routes) was `/feature small` because it was 4 single-scope pass-through files; 8.2 is materially heavier (dual-scope discriminated split + contract additions).

**Branch**: `feat/training-domain` long-lived. NO new branch cut (per `[[training-domain-workflow]]` + `[[always-via-feature-skill]]` branch-cut override). At handoff the branch is 1 commit ahead of `main` (`34385f21`, the planning housekeeping commit), local-unpushed.

**Predecessor / decomposition**: the api-server vertical for all three entities is complete — `lmsSchemaApi` (8.1a), `lmsSchemaRowApi` (8.1b), `lmsAlternatingGroupApi` (8.1d), each with its guard + mapper. The `@repo/contracts` request/response schemas exist (8.0b + 8.1d). Step 8.2 wires HTTP: new Next.js App Router `route.ts` handlers in `apps/platform`, mirroring the Block routes Step 7.2 shipped. `packages/api-routes` (the generic auth/factory/rate-limit utilities) is **not** modified — its factories already exist. Thesis ratified in the planner-user chat 2026-05-20 (two-voice; user approved all hypotheses — see § 1.x).

This step ships **no UI and no client hooks** — client API + TanStack hooks are Step 8.3, the read surface is Step 8.3.5, UI is Step 8.4+. There is no browser smoke-test (§ 9): the routes are reachable only via the future hooks.

---

## § 0 — Verbatim source reads (read-at-prompt-write-time per `[[planner-verbatim-registration]]` + `[[planner-consumer-pattern-read]]`)

All quotes are the **current** state, verified 2026-05-20. They are reference material — the deliverable shapes are described structurally in § 3, not as code skeletons (per `[[planner-strategic-level]]`). The executor re-reads precedents during `/feature` Research; § 0 records the planner-verified state and the load-bearing exact-quote files.

### § 0.1 — api-server method signatures (the call targets — verbatim, NOT modified this step)

`lmsSchemaApi` (`packages/api-server/src/endpoints/lms/schema/admin.ts`):

```ts
type CreateScope = { blockId: string } | { parentSchemaId: string };
type SchemaBodyData = Omit<CreateSchemaData, "blockId" | "parentSchemaId">;

create:  (userId: string, planId: string, scope: CreateScope, data: SchemaBodyData) => Promise<Schema>
update:  (userId: string, schemaId: string, data: UpdateSchemaData) => Promise<Schema>
delete:  (userId: string, schemaId: string) => Promise<void>
reorder: (userId: string, planId: string, scope: CreateScope, data: ReorderSchemasData) => Promise<Schema[]>
```

`lmsSchemaRowApi` (`packages/api-server/src/endpoints/lms/schema-row/admin.ts`):

```ts
create:  (userId: string, planId: string, data: CreateSchemaRowData) => Promise<SchemaRow>   // CreateSchemaRowData carries schemaId
update:  (userId: string, schemaRowId: string, data: UpdateSchemaRowData) => Promise<SchemaRow>
delete:  (userId: string, schemaRowId: string) => Promise<void>
reorder: (userId: string, planId: string, schemaId: string, data: ReorderSchemaRowsData) => Promise<SchemaRow[]>
```

`lmsAlternatingGroupApi` (`packages/api-server/src/endpoints/lms/alternating-group/admin.ts`):

```ts
create:       (userId: string, planId: string, data: CreateAlternatingGroupData) => Promise<AlternatingGroup>
addMember:    (userId: string, groupId: string, schemaId: string) => Promise<AlternatingGroup>
removeMember: (userId: string, groupId: string, schemaId: string) => Promise<AlternatingGroup | null>
delete:       (userId: string, groupId: string) => Promise<void>
```

**Load-bearing facts.** (1) `lmsSchemaApi.create`/`.reorder` take `scope` and `data` as **separate** arguments — `scope` is the discriminated `CreateScope`, `data` is `SchemaBodyData` (the body **minus** the two scope keys). (2) `reorder` methods return a **bare array** (`Schema[]` / `SchemaRow[]`), not a wrapped object. (3) `lmsSchemaRowApi.reorder` takes `schemaId` as a separate argument. (4) `removeMember` returns `AlternatingGroup | null` (`null` = the group dissolved — 8.1d D-A4). (5) all three api objects export **no read method** (`get` / `list`) — see § 1.x D-8.2-2.

### § 0.2 — Contract slices: current state (the files Phase 1 MODIFIES)

**`schema-api.schema.ts`** (`packages/contracts/src/entities/lms/schema/`):

```ts
import { z } from "zod";
import { idParamSchema } from "../../../common";
import {
  createSchemaSchema,
  reorderSchemasSchema,
  schemaSchema,
  updateSchemaSchema,
} from "./schema.schema";

export const getSchemasResponseSchema = z.array(schemaSchema);
export const getSchemaByIdParamsSchema = idParamSchema;
export const createSchemaRequestSchema = createSchemaSchema;
export const createSchemaResponseSchema = schemaSchema;
export const updateSchemaParamsSchema = idParamSchema;
export const updateSchemaRequestSchema = updateSchemaSchema;
export const updateSchemaResponseSchema = schemaSchema;
export const deleteSchemaParamsSchema = idParamSchema;
export const reorderSchemasRequestSchema = reorderSchemasSchema;
export const reorderSchemasResponseSchema = z.object({ schemas: getSchemasResponseSchema });
```

**`schema-row-api.schema.ts`** — structurally identical: `getSchemaRowByIdParamsSchema` / `updateSchemaRowParamsSchema` / `deleteSchemaRowParamsSchema` are all `idParamSchema`; `reorderSchemaRowsRequestSchema = reorderSchemaRowsSchema`; `reorderSchemaRowsResponseSchema = z.object({ schemaRows: getSchemaRowsResponseSchema })`.

**`alternating-group-api.schema.ts`**:

```ts
import { z } from "zod";
import { idParamSchema } from "../../../common";
import { alternatingGroupSchema, createAlternatingGroupSchema } from "./alternating-group.schema";

export const getAlternatingGroupsResponseSchema = z.array(alternatingGroupSchema);
export const createAlternatingGroupRequestSchema = createAlternatingGroupSchema;
export const createAlternatingGroupResponseSchema = alternatingGroupSchema;
export const addMemberAlternatingGroupRequestSchema = z.object({ schemaId: z.string().cuid() });
export const addMemberAlternatingGroupResponseSchema = alternatingGroupSchema;
export const removeMemberAlternatingGroupRequestSchema = addMemberAlternatingGroupRequestSchema;
export const removeMemberAlternatingGroupResponseSchema = alternatingGroupSchema.nullable();
export const deleteAlternatingGroupParamsSchema = idParamSchema;
```

**`schema.schema.ts`** — the entity-level `create` / `reorder` request shapes (verbatim of the load-bearing parts):

```ts
export const createSchemaSchema = z.object({
  blockId: z.string().cuid(),
  parentSchemaId: z.string().cuid().nullable().optional(),
  kind: schemaKindSchema,
  archetypeId: z.string().cuid(),
  header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable().optional(),
  archetypeParams: archetypeParamsSchema,
  intensity: intensitySchema.nullable().optional(),
  trailingConnector: trailingConnectorSchema.nullable().optional(),
  notes: z.string().max(SCHEMA_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});
export const updateSchemaSchema = createSchemaSchema.partial();
export const reorderSchemasSchema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1).refine(/* unique */),
});
```

`createSchemaRowSchema` carries `schemaId: z.string().cuid()` as a required field; `reorderSchemaRowsSchema` is `{ orderedIds }`-only (no `schemaId`). `createAlternatingGroupSchema` is `{ relationKind, schemaIds }` (no scope/plan field).

**Observation that drives D-8.2-3.** `createSchemaSchema` already packs the discriminated scope (`blockId` required, `parentSchemaId` nullable+optional) **inside the request body**. `reorderSchemasSchema` carries `orderedIds` only — no scope. The existing `*ParamsSchema` exports are all aliased to `idParamSchema` (`{ id }`), which carries no `planId` and whose key `id` does not match a Next.js `[schemaId]` segment.

### § 0.3 — Block route precedent (the canonical mirror — verbatim, 4 files)

`apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/blocks/route.ts`:

```ts
import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockApi } from "@repo/api-server/lms";
import {
  blockBySessionParamsSchema,
  createBlockRequestSchema,
  createBlockResponseSchema,
} from "@repo/contracts/lms/block";
import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, sessionId }, data) => lmsBlockApi.create(userId, planId, sessionId, data),
      blockBySessionParamsSchema,
      createBlockRequestSchema,
      createBlockResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
```

`[planId]/blocks/[blockId]/route.ts` — **PUT + DELETE in one file**:

```ts
export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { blockId }, data) => lmsBlockApi.update(userId, blockId, data),
      blockByIdParamsSchema,
      updateBlockRequestSchema,
      updateBlockResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { blockId }) => lmsBlockApi.delete(userId, blockId),
      blockByIdParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
```

`[planId]/sessions/[sessionId]/blocks/reorder/route.ts` — **note the manual `.then(wrap)`**:

```ts
export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, sessionId }, data) =>
        lmsBlockApi.reorder(userId, planId, sessionId, data).then((blocks) => ({ blocks })),
      blockBySessionParamsSchema,
      reorderBlocksRequestSchema,
      reorderBlocksResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
```

`[planId]/blocks/[blockId]/labels/route.ts` — a single `PUT` (the Block-labels analogue; no 8.2 mirror — informational).

**Load-bearing facts.** (a) Composition is invariant: `withCoachAuth( withAuthRateLimit( createAuth*Handler(...), RATE_LIMIT_TIER.API ) )`. (b) The call-function passed to a factory is **arbitrary** — it can rename/reshape (`{ planId, sessionId }, data) => api.create(userId, planId, sessionId, data)`) and **manually wrap the result** (`reorder` `.then((blocks) => ({ blocks }))`, because the api returns a bare array but the response schema is `{ blocks }`). This is the `[[planner-consumer-pattern-read]]` (f) precedent — the handler is NOT a pass-through. (c) Multiple HTTP verbs on the same path live in one `route.ts`. (d) Block params schemas carry `planId` even when the api method does not consume it (`blockByIdParamsSchema` = `{ planId, blockId }`; `lmsBlockApi.update` ignores `planId`) — the path stays REST-nested under `[planId]`.

### § 0.4 — `@repo/api-routes` factories (verbatim signatures — NOT modified this step)

From `packages/api-routes/src/auth-factories.ts` — every factory returns an `AuthenticatedHandler`:

```ts
createAuthPostByParamHandler<TParams, TRequest, TResponse>(
  apiFn: (userId, params: TParams, data: TRequest) => Promise<TResponse>,
  paramsSchema, requestSchema, responseSchema,
)  // parses params + JSON body, calls apiFn, validates response, NextResponse.json(_, { status: 201 }); wrapAuthHandler JSON_CONFIG

createAuthPutByParamHandler<TParams, TRequest, TResponse>(apiFn, paramsSchema, requestSchema, responseSchema)
  // same shape, status 200; wrapAuthHandler JSON_CONFIG

createAuthDeleteHandler<TParams>(
  apiFn: (userId, params: TParams) => Promise<void>,
  paramsSchema,
)  // parses params only, NO request body, NO response body; returns NextResponse(null, { status: 204 }); wrapAuthHandler NONE_CONFIG

createAuthActionHandler<TParams, TResponse>(
  apiFn: (userId, params: TParams) => Promise<TResponse>,
  paramsSchema, responseSchema, status = 200,
)  // parses params only, NO request body, returns a validated response body; wrapAuthHandler NONE_CONFIG
```

`@repo/api-routes` `index.ts` re-exports all factories + `withAuthRateLimit` + `RATE_LIMIT_TIER`. `RATE_LIMIT_TIER` (from `rate-limit/rate-limit-tiers.ts`):

```ts
export const RATE_LIMIT_TIER = {
  AUTH: { limit: 5, windowMs: 60_000 },
  PUBLIC: { limit: 30, windowMs: 60_000 },
  API: { limit: 100, windowMs: 60_000 },
} as const;
```

**Load-bearing fact for D-8.2-5.** `createAuthDeleteHandler` returns `204` with **no body** and takes **no `responseSchema`**. `lmsAlternatingGroupApi.removeMember` must return a body (`AlternatingGroup | null`). The only existing factory with the shape "params-only input + a validated response body" is `createAuthActionHandler` (params-only, `responseSchema`, status `200`, `NONE_CONFIG`). It is verb-agnostic — `export const DELETE = ...createAuthActionHandler(...)` is valid.

### § 0.5 — Auth wrapper (verbatim — NOT modified; resolves QA-E3 at the route layer)

`apps/platform/src/lib/server/auth.ts`:

```ts
export const { withAdminAuth, withAthleteAuth, withCoachAuth } = createAuthWrappers(authOptions);
```

`packages/api-routes/src/auth-wrappers.ts` — `buildWrapper`, the load-bearing fragment:

```ts
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  throw new UnauthorizedError();
}
const role = (session.user.role ?? null) as UserRole | null;
if (!isRoleAllowed(role, allowed)) {
  throw new ForbiddenError();
}
// ... handler(request, context, session.user.id)
```

`withCoachAuth` is `buildWrapper(authOptions, COACH_ROLES)`, `COACH_ROLES = [COACH, HEAD_COACH, ADMIN]`. The handler receives `userId` (`session.user.id`) **only when it is a non-empty string** — a missing session throws `UnauthorizedError` (`401`) before the handler runs. → **QA-E3 (`userId === undefined` propagation) cannot occur at the route layer** — see D-8.2-6.

### § 0.6 — Block contract params schemas (the precedent Phase 1 mirrors)

`packages/contracts/src/entities/lms/block/block-api.schema.ts`:

```ts
export const blockBySessionParamsSchema = z.object({
  planId: z.string().cuid(),
  sessionId: z.string().cuid(),
});
export const blockByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  blockId: z.string().cuid(),
});
```

Block defines **named** params schemas (`{ planId, sessionId }`, `{ planId, blockId }`) — keys matching the Next.js path segments. The Schema/SchemaRow/AlternatingGroup slices currently have only `idParamSchema`-aliases (`{ id }`) — wrong key, no `planId`. Phase 1 adds named params schemas mirroring Block.

### § 0.7 — Route filesystem layout (Next.js App Router — no barrel)

Routes are file-system-routed: a `route.ts` under `apps/platform/src/app/api/...` exporting named `GET`/`POST`/`PUT`/`DELETE` consts **is** the registration — there is **no barrel, no manifest, no config edit**. Current Block routes live under `apps/platform/src/app/api/platform/training-plans/[planId]/...`. No `route.ts` exists yet for `schemas` / `schema-rows` / `alternating-groups` (verified — `find ... -name route.ts`). The contract slice `index.ts` barrels (`packages/contracts/src/entities/lms/{schema,schema-row,alternating-group}/index.ts`) use `export *` — new exports appended to existing `*-api.schema.ts` / `*-api.types.ts` files are auto-re-exported; `@repo/contracts/package.json` `exports` already maps `./lms/{schema,schema-row,alternating-group}`. **Zero barrel / exports-map / config edits in 8.2.**

### § 0.8 — Hooks & turbo (commit-strategy inputs, per `[[husky-cross-package-squash]]` — verbatim, durable)

- `.husky/pre-commit`: `check-secrets` → `lint-staged` → `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"`.
- `.husky/pre-push`: `pnpm dep:check` → `SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"`.
- `turbo.json`: `check-types` / `lint` both `dependsOn: ["^…"]`; `test: { cache: false }`.

**Fan-out** — see § 6. Summary: per-layer atomic commits, **no squash trigger** — every intermediate tree type-checks (the Phase 1 contract additions are additive; `apps/platform` consumes them only from Phase 2 onward).

---

## § 1 — Goal & ratified decisions

### Coach view

**Walkthrough.** Денис открывает плановый день в plan-editor'е, внутри блока тренировки нажимает «add schema». Появляется список архетипов — выбирает `n-rounds`, видит форму параметров, вбивает «5 раундов × 8 повторов», сохраняет. В блоке появляется карточка schema с этим заголовком и пустым телом. Денис нажимает «add row» внутри карточки, выбирает упражнение из библиотеки — оно встаёт строкой в тело. Добавляет ещё пару упражнений, перетаскивает их за ручку — порядок меняется на месте. На двух схемах с архетипом `alternating-sets` выбирает «link as alternating» — карточки получают общую рамку группы.

**Goal (coach).** На самом шаге 8.2 Денис не увидит ничего нового. Экраны из walkthrough появляются начиная с 8.4 (anchor) — ArchetypePicker и редактор schema. 8.2 — невидимая прослойка, без которой эти кнопки потом не заработают.

### Developer view

**Goal.** Ship the platform HTTP layer for the three api slices — Next.js App Router `route.ts` handlers for every **write** method of `lmsSchemaApi` / `lmsSchemaRowApi` / `lmsAlternatingGroupApi` (12 methods total: `create` / `update` / `delete` / `reorder` × Schema + SchemaRow; `create` / `addMember` / `removeMember` / `delete` × AlternatingGroup). Each handler mirrors the Block precedent: `withCoachAuth( withAuthRateLimit( createAuth*Handler(...), RATE_LIMIT_TIER.API ) )`. Phase 1 first adds the missing contract pieces (named route-param schemas + reorder request schemas widened to carry scope). After 8.2 the routes are reachable; Step 8.3 adds the client API + TanStack hooks that call them.

### § 1.x — Ratified decisions (planner-user chat 2026-05-20; user approved all hypotheses)

- **D-8.2-1 (collapsed single step, `/feature` full).** 8.2 is one step, not split into 8.2a/b/c. ~10 `route.ts` + a contract change + route topology decisions — the per-file novelty is near-zero (1:1 Block mirror), so splitting into three close-out cycles is pure process overhead with no downstream gain (Step 8.3 and 8.4 need the whole HTTP layer anyway). The volume nonetheless exceeds the `/feature small` thin-additive carve-out (Step 7.2 was `small` as 4 single-scope pass-through files; 8.2 has dual-scope split + a contract change) → `/feature` full.
- **D-8.2-2 (no GET routes — read surface is out of scope).** None of `lmsSchemaApi` / `lmsSchemaRowApi` / `lmsAlternatingGroupApi` exports a `get` / `list` method (§ 0.1). 8.2 ships **write routes only**. The `getSchemasResponseSchema` / `getSchemaRowsResponseSchema` / `getAlternatingGroupsResponseSchema` contract schemas exist but stay **unconsumed** — the read surface (a dedicated GET or, more likely, a `schemas[]` / group embed into the Block/Week read) is Step 8.3.5. Do NOT invent a GET route or a read api method in 8.2.
- **D-8.2-3 (8.2 modifies `packages/contracts`).** The slices lack route-param schemas (only `idParamSchema`-aliases — § 0.2 / § 0.6). Phase 1 adds named params schemas mirroring `blockByIdParamsSchema` / `blockBySessionParamsSchema`, and widens the reorder **request** schemas to carry scope (D-8.2-4). This is a cross-package step (contracts + apps/platform) — but additive (new exports), so no squash (§ 6).
- **D-8.2-4 (discriminated scope travels in the request body; routes are flat plan-scoped).** `lmsSchemaApi.create`/`.reorder` need a `CreateScope` (`{blockId}` xor `{parentSchemaId}`) separate from `data`. Decision: **the request body carries the scope; the route is flat — `POST/PUT .../training-plans/[planId]/schemas[/reorder]`, params `{ planId }`**. The handler call-function splits the parsed body into `scope` + `data`. Rationale: (1) `createSchemaSchema` is _already_ designed body-carries-scope (`blockId` + `parentSchemaId` are body fields) — reorder aligns to one consistent scope carrier across the slice; (2) one route per operation (~10 files) vs. a discriminated path (`/blocks/[blockId]/schemas` xor `/schemas/[parentSchemaId]/sub-schemas`) which would double the route branches and still not remove scope from the create body. Consequence: `reorderSchemasRequestSchema` (currently aliased to the `{orderedIds}`-only `reorderSchemasSchema`) is widened to also carry the discriminated scope; likewise `reorderSchemaRowsRequestSchema` gains `schemaId`. The entity-level `reorderSchemasSchema` / `reorderSchemaRowsSchema` stay unchanged (they remain the orderedIds-only shapes). The exact Zod shape of the widened request schema (discriminated union vs. object + `superRefine`) is the executor's tactical call.
- **D-8.2-5 (`removeMember` uses `createAuthActionHandler`, not `createAuthDeleteHandler`).** `removeMember` is a `DELETE` verb but returns a body (`AlternatingGroup | null`). `createAuthDeleteHandler` is `204`/void/no-responseSchema — unusable. `createAuthActionHandler` (params-only input, `responseSchema`, status `200`, verb-agnostic) is the only existing factory of the right shape — use it: `export const DELETE = withCoachAuth(withAuthRateLimit(createAuthActionHandler(...), RATE_LIMIT_TIER.API))` with `removeMemberAlternatingGroupResponseSchema` (nullable — `.parse(null)` passes). Do NOT introduce a new factory in `@repo/api-routes` — that is scope creep for a cosmetic name mismatch ("Action" vs "Delete").
- **D-8.2-6 (QA-E3 is closed at the route layer by construction).** `withCoachAuth` throws `UnauthorizedError` (`401`) when `session.user.id` is absent (§ 0.5) — the handler's `userId` is always a non-empty string. The api-server-layer QA-E3 carry-forward (guards propagate `PrismaClientValidationError` on `userId === undefined`) stays deferred for that layer, but 8.2 needs no route-side `userId` guard.
- **Note on PR #199 review note #1 (`schemaIds` ordering).** `mapToAlternatingGroup` already orders `schemaIds` by `Schema.order asc`, covered by the 8.1d mapper-determinism test; the 8.2 routes are a pure pass-through of that output. Zod arrays cannot structurally express ordering and the no-comments rule forbids a JSDoc — so 8.2 adds no separate artifact for note #1; it is recorded as covered (§ 7).

---

## § 2 — Scope / Inputs

### Files CREATED — `route.ts` handlers under `apps/platform/src/app/api/platform/training-plans/[planId]/`

The exact segment names are the canonical recommendation below; the executor may adjust naming per Next.js / project convention, but the **topology** (flat plan-scoped, scope-in-body for Schema create/reorder, member id in path for `removeMember`) is ratified (D-8.2-4, D-8.2-3, OQ-D3).

- `schemas/route.ts` — `POST` (create).
- `schemas/[schemaId]/route.ts` — `PUT` (update) + `DELETE` (delete).
- `schemas/reorder/route.ts` — `PUT` (reorder).
- `schema-rows/route.ts` — `POST` (create).
- `schema-rows/[schemaRowId]/route.ts` — `PUT` (update) + `DELETE` (delete).
- `schema-rows/reorder/route.ts` — `PUT` (reorder).
- `alternating-groups/route.ts` — `POST` (create).
- `alternating-groups/[groupId]/route.ts` — `DELETE` (delete).
- `alternating-groups/[groupId]/members/route.ts` — `POST` (addMember).
- `alternating-groups/[groupId]/members/[schemaId]/route.ts` — `DELETE` (removeMember).

### Files MODIFIED — `packages/contracts`

- `schema/schema-api.schema.ts` + `schema/schema-api.types.ts` — named route-param schemas; `reorderSchemasRequestSchema` widened with scope.
- `schema-row/schema-row-api.schema.ts` + `schema-row/schema-row-api.types.ts` — named route-param schemas; `reorderSchemaRowsRequestSchema` widened with `schemaId`.
- `alternating-group/alternating-group-api.schema.ts` + `alternating-group/alternating-group-api.types.ts` — named route-param schemas (`{planId}` for create; `{planId, groupId}` for delete + addMember; `{planId, groupId, schemaId}` for removeMember).
- The corresponding `*-api.schema.test.ts` — cases for any non-trivial new schema (the widened reorder request — scope discrimination/refinement). Trivial `z.object({ cuid })` params schemas need no dedicated test.

### Files / areas NOT touched (out of scope)

- `packages/api-routes` — the generic factories / wrappers / rate-limit utilities already exist; 8.2 consumes, does not modify.
- The entity-level `*.schema.ts` (`createSchemaSchema`, `reorderSchemasSchema`, …) — unchanged; only the **api/route-level** `*-api.schema.ts` files change.
- `getSchemasResponseSchema` / `getSchemaRowsResponseSchema` / `getAlternatingGroupsResponseSchema` and any GET route / read api method — D-8.2-2; the read surface is Step 8.3.5.
- `idParamSchema` and the existing `get…ByIdParamsSchema` / `update…ParamsSchema` / `delete…ParamsSchema` aliases — leave them; 8.2 adds **new** named params schemas rather than re-pointing the aliases (the aliases may be consumed elsewhere; minimal-touch).
- `api-server` endpoints / guards / mappers — complete (8.1a/b/d); 8.2 only calls them.
- Client API + TanStack hooks — Step 8.3. UI — Step 8.4+. The `schemas[]` / group read-embed — Step 8.3.5.
- `apps/admin` — irrelevant (platform routes only).
- Prisma schema, `analysis/` — unchanged; 8.2 is HTTP wiring over a settled model, **no domain-semantics change → no `analysis/` sync** (per WORKFLOW.md `analysis/` rules — routes are not the domain layer).
- QA-W1 / QA-E3 / REVIEW-I4-I6 — deferred carry-forwards (`03-deferred.md`); 8.2 touches none of them. D-8.2-6 records why QA-E3 does not surface here.

---

## § 3 — Phases (spec-only — structural descriptions, no code skeletons)

Read the Block route precedent (§ 0.3) and mirror its formatting / idiom; write the actual code per project convention. No code comments (project rule).

### § 3.1 — Phase 1: contract route-param + reorder-scope schemas

**Goal.** Give every route the params schema and (for reorder) the scope-carrying request schema it needs. Purely additive within already-registered slice files.

**Operations** — in each of `schema-api.schema.ts`, `schema-row-api.schema.ts`, `alternating-group-api.schema.ts`:

1. **Named route-param schemas**, mirroring `blockBySessionParamsSchema` / `blockByIdParamsSchema` (§ 0.6) — `z.object({ ... })` with cuid fields keyed to the Next.js path segments:
   - Schema: a `{ planId }` schema (for `POST schemas` + `PUT schemas/reorder`); a `{ planId, schemaId }` schema (for `schemas/[schemaId]`).
   - SchemaRow: a `{ planId }` schema; a `{ planId, schemaRowId }` schema.
   - AlternatingGroup: a `{ planId }` schema (create); a `{ planId, groupId }` schema (delete + addMember); a `{ planId, groupId, schemaId }` schema (removeMember).
   - Naming: mirror the `…By…ParamsSchema` convention.
2. **Widen the reorder request schemas** (D-8.2-4):
   - `reorderSchemasRequestSchema` — currently `= reorderSchemasSchema`. Redefine as a **`z.union` of two object members** — member A: `blockId` (cuid) + `orderedIds`; member B: `parentSchemaId` (cuid) + `orderedIds`. **Ratified mid-execution 2026-05-20 (executor escalation): `z.union`, NOT `object + superRefine`.** A `superRefine` on a both-keys-optional object validates correctly at runtime but its inferred type stays `{ blockId?: string; parentSchemaId?: string }` — the reorder handler then cannot narrow to `CreateScope` and would need a dead `throw` on a branch `superRefine` already made unreachable (compiler-appeasement, rejected per `[[type-quality]]`). The `z.union` infers `{ blockId: string; parentSchemaId?: undefined; orderedIds } | { parentSchemaId: string; blockId?: undefined; orderedIds }` — the handler narrows cleanly via `body.blockId !== undefined`, no throw, no guard-chain. **Gotcha**: the forbidden key on each member must be **actively rejected** (`z.undefined()` on it, or per-member `.strict()`) — Zod strips unknown keys by default, so a bare omission would let `{ blockId, parentSchemaId }` silently pass member A as `{ blockId }` (→ "both keys" accepted instead of `400`). `z.discriminatedUnion` does not apply — there is no shared literal-discriminator field. `superRefine` stays the right idiom for _conditional-field_ invariants (`trailingConnectorSchema`: `roundsCount` depends on `form`'s value) — just not for _mutually-exclusive scope_, which is a union by construction (`CreateScope` in § 0.1 already is one).
   - `reorderSchemaRowsRequestSchema` — currently `= reorderSchemaRowsSchema`. Redefine to also carry `schemaId` (single, not discriminated — `lmsSchemaRowApi.reorder` takes a plain `schemaId`).
   - The entity-level `reorderSchemasSchema` / `reorderSchemaRowsSchema` stay **unchanged**.
3. **`*-api.types.ts`** — add the `z.infer<>` types for every schema added/changed in ops 1-2, mirroring the existing alias blocks.
4. **`*-api.schema.test.ts`** — add cases for the **non-trivial** new schemas: the widened reorder request (scope present & well-formed accepted; both scope keys / neither scope key rejected; `schemaId` required for rows). Trivial `{ planId }` / `{ planId, …Id }` params schemas need no dedicated test (a cuid-object is self-evidently correct — mirror how Block has no test for `blockByIdParamsSchema`).

**Commit 1**: `feat(contracts): add route params and reorder-scope request schemas`.

### § 3.2 — Phase 2: Schema HTTP routes

**Goal.** Three `route.ts` files for `lmsSchemaApi`'s 4 write methods.

- **`schemas/route.ts` — `POST`** → `createAuthPostByParamHandler`, params `{ planId }`, request `createSchemaRequestSchema`, response `createSchemaResponseSchema`. **The call-function performs the load-bearing manual split** (`[[planner-consumer-pattern-read]]`): the parsed body is the full `CreateSchemaData` (scope keys packed in), but `lmsSchemaApi.create` wants `(userId, planId, scope: CreateScope, data: SchemaBodyData)`. Split per § 0.1: a non-null `parentSchemaId` ⇒ `{ parentSchemaId }` scope, else `{ blockId }` scope; `data` = the body minus `blockId` + `parentSchemaId`. This is a deliberate transform, not a pass-through.
- **`schemas/[schemaId]/route.ts` — `PUT` + `DELETE`** in one file. `PUT` → `createAuthPutByParamHandler`, params `{ planId, schemaId }`, request `updateSchemaRequestSchema`, response `updateSchemaResponseSchema`; call `lmsSchemaApi.update(userId, schemaId, data)` (`planId` parsed, unused — mirrors Block). `DELETE` → `createAuthDeleteHandler`, params `{ planId, schemaId }`; call `lmsSchemaApi.delete(userId, schemaId)`.
- **`schemas/reorder/route.ts` — `PUT`** → `createAuthPutByParamHandler`, params `{ planId }`, request `reorderSchemasRequestSchema` (the widened one — carries scope), response `reorderSchemasResponseSchema`. The call-function splits the request into `scope` + `{ orderedIds }`, calls `lmsSchemaApi.reorder(userId, planId, scope, data)`, and **manually wraps** the returned `Schema[]` into `{ schemas }` (mirror Block reorder `.then((blocks) => ({ blocks }))`).

**Commit 2**: `feat(platform): add http routes for schema crud and reorder`.

### § 3.3 — Phase 3: SchemaRow HTTP routes

**Goal.** Three `route.ts` files for `lmsSchemaRowApi`'s 4 write methods.

- **`schema-rows/route.ts` — `POST`** → `createAuthPostByParamHandler`, params `{ planId }`, request `createSchemaRowRequestSchema`, response `createSchemaRowResponseSchema`; call `lmsSchemaRowApi.create(userId, planId, data)` — `data` carries `schemaId`, **pass-through** (no split).
- **`schema-rows/[schemaRowId]/route.ts` — `PUT` + `DELETE`**. `PUT` → `createAuthPutByParamHandler`, params `{ planId, schemaRowId }`, request/response `updateSchemaRow…`; call `lmsSchemaRowApi.update(userId, schemaRowId, data)`. `DELETE` → `createAuthDeleteHandler`, params `{ planId, schemaRowId }`; call `lmsSchemaRowApi.delete(userId, schemaRowId)`.
- **`schema-rows/reorder/route.ts` — `PUT`** → `createAuthPutByParamHandler`, params `{ planId }`, request `reorderSchemaRowsRequestSchema` (widened — carries `schemaId`), response `reorderSchemaRowsResponseSchema`. The call-function extracts `schemaId` from the request, calls `lmsSchemaRowApi.reorder(userId, planId, schemaId, { orderedIds })`, **wraps** the `SchemaRow[]` into `{ schemaRows }`.

**Commit 3**: `feat(platform): add http routes for schema-row crud and reorder`.

### § 3.4 — Phase 4: AlternatingGroup HTTP routes

**Goal.** Four `route.ts` files for `lmsAlternatingGroupApi`'s 4 methods.

- **`alternating-groups/route.ts` — `POST`** → `createAuthPostByParamHandler`, params `{ planId }`, request `createAlternatingGroupRequestSchema`, response `createAlternatingGroupResponseSchema`; call `lmsAlternatingGroupApi.create(userId, planId, data)` — pass-through.
- **`alternating-groups/[groupId]/route.ts` — `DELETE`** → `createAuthDeleteHandler`, params `{ planId, groupId }`; call `lmsAlternatingGroupApi.delete(userId, groupId)` (`204`, void).
- **`alternating-groups/[groupId]/members/route.ts` — `POST`** (addMember) → `createAuthPostByParamHandler`, params `{ planId, groupId }`, request `addMemberAlternatingGroupRequestSchema` (`{ schemaId }`), response `addMemberAlternatingGroupResponseSchema`; the call-function takes `schemaId` out of the parsed body — `lmsAlternatingGroupApi.addMember(userId, groupId, data.schemaId)`.
- **`alternating-groups/[groupId]/members/[schemaId]/route.ts` — `DELETE`** (removeMember) → **`createAuthActionHandler`** (D-8.2-5 — `createAuthDeleteHandler` cannot return a body), params `{ planId, groupId, schemaId }`, response `removeMemberAlternatingGroupResponseSchema` (nullable). `export const DELETE = withCoachAuth(withAuthRateLimit(createAuthActionHandler((userId, { groupId, schemaId }) => lmsAlternatingGroupApi.removeMember(userId, groupId, schemaId), paramsSchema, responseSchema), RATE_LIMIT_TIER.API))`. A `null` return (group dissolved) is valid against the nullable response schema → `200` with body `null`.

**Commit 4**: `feat(platform): add http routes for alternating-group operations`.

---

## § 4 — Acceptance criteria

1. ✅ Phase 1: each of the three `*-api.schema.ts` exports named route-param schemas (cuid objects keyed to path segments, `planId` always included) mirroring `blockByIdParamsSchema`; matching inferred types in `*-api.types.ts`.
2. ✅ `reorderSchemasRequestSchema` is a `z.union` of two scope members (`blockId` xor `parentSchemaId`), each with `orderedIds`, each actively rejecting the other's key — its inferred type narrows to `CreateScope` without a runtime throw; `reorderSchemaRowsRequestSchema` carries `schemaId` + `orderedIds`; the entity-level `reorderSchemasSchema` / `reorderSchemaRowsSchema` are unchanged.
3. ✅ Contract tests cover the widened reorder request schemas (well-formed scope accepted; missing/ambiguous scope rejected).
4. ✅ Schema routes: `schemas/route.ts` (`POST`), `schemas/[schemaId]/route.ts` (`PUT` + `DELETE`), `schemas/reorder/route.ts` (`PUT`) — all `withCoachAuth( withAuthRateLimit( createAuth*Handler(...), RATE_LIMIT_TIER.API ) )`.
5. ✅ The `POST schemas` handler splits the request body into `CreateScope` + `SchemaBodyData`; the `reorder` handler splits scope and wraps the `Schema[]` result into `{ schemas }`.
6. ✅ SchemaRow routes: `schema-rows/route.ts` (`POST`), `schema-rows/[schemaRowId]/route.ts` (`PUT` + `DELETE`), `schema-rows/reorder/route.ts` (`PUT`); `reorder` extracts `schemaId` and wraps the result into `{ schemaRows }`.
7. ✅ AlternatingGroup routes: `alternating-groups/route.ts` (`POST`), `[groupId]/route.ts` (`DELETE`), `[groupId]/members/route.ts` (`POST` addMember), `[groupId]/members/[schemaId]/route.ts` (`DELETE` removeMember).
8. ✅ `removeMember` uses `createAuthActionHandler` with the nullable response schema; a dissolved-group `null` return serialises to `200` body `null`.
9. ✅ No GET route, no read api method; `get…ResponseSchema` schemas remain unconsumed (D-8.2-2).
10. ✅ `packages/api-routes` unmodified; no barrel / `package.json` exports / `turbo.json` edits; entity-level `*.schema.ts` unmodified.
11. ✅ `pnpm check-types` (root) — 16/16.
12. ✅ `pnpm lint` (root) — 16/16, 0 warnings.
13. ✅ `pnpm test` (root) — all packages pass.
14. ✅ `pnpm dep:check` — 0 violations (`apps/platform` → `@repo/api-server` / `@repo/api-routes` / `@repo/contracts` are existing allowed edges — mirror the Block route imports).
15. ✅ Husky pre-commit + pre-push clean on every commit. Zero `--no-verify` / `--no-edit` / `--no-gpg-sign`.
16. ✅ Per-layer atomic commits per § 6; no squash.
17. ✅ `git diff <start>..HEAD` — changes confined to the § 2 list (`apps/platform/src/app/api/...` + `packages/contracts/.../lms/{schema,schema-row,alternating-group}/`); `api-server`, `api-routes`, Prisma schema, `analysis/`, `apps/admin` show 0 lines.

---

## § 5 — Adversarial pass (per `[[planner-adversarial-review]]`)

8.2 routes are thin compositions of already-tested parts — the factories (`@repo/api-routes` `__tests__/`), the wrappers, and the api methods (`@repo/api-server` endpoint tests, shipped 8.1a/b/d). The Block routes carry **no route-level unit test** (verified — no `route.test.ts` beside them); 8.2 mirrors that — route correctness rides on the tested factory + tested api method. Phase 1's contract changes **do** get tests (§ 3.1 op 4). The axes below are for the executor's reasoning + the Phase 1 tests, not a mandate for route-level integration tests:

- **Body / param validation** — the factories `.parse()` params and body; a malformed body or a non-cuid path id throws `ZodError` → `withErrorHandling` → `400`. No handler-side validation needed.
- **Schema create scope split** — body with `parentSchemaId: null`/absent ⇒ `{ blockId }` scope; body with a non-null `parentSchemaId` ⇒ `{ parentSchemaId }` scope. `blockId` is always required by `createSchemaSchema`, so the "neither scope" case is structurally impossible; the split is total. The api re-validates scope ownership — the handler only routes.
- **Reorder scope** — the widened request schema must reject a payload with both `blockId` and `parentSchemaId`, or neither (Phase 1 test). A well-formed single-scope payload splits cleanly into `CreateScope` + `{ orderedIds }`.
- **`removeMember` dissolve** — api returns `null`; `removeMemberAlternatingGroupResponseSchema` is `.nullable()`, `createAuthActionHandler`'s `responseSchema.parse(null)` passes → `200` body `null`. A non-null group serialises normally.
- **Auth / role** — no session → `withCoachAuth` → `401`; `ATHLETE` role → `403`; `COACH` / `HEAD_COACH` / `ADMIN` → through. Ownership (non-owner coach) is enforced inside the api guards → `ForbiddenError` → `403`. Route adds no authz logic.
- **Rate limit** — `RATE_LIMIT_TIER.API` = 100 req / 60 s. The coach reordering 10-15 rows in a burst stays well under it; identical tier to Block reorder, which already sustains this. No tier change.
- **Idempotency** — `createAuthPost*` / `createAuthPut*` factories wrap `JSON_CONFIG` (idempotency on); `createAuthDeleteHandler` / `createAuthActionHandler` wrap `NONE_CONFIG`. Mirror of Block — no 8.2 decision needed.
- **`reorder` result wrap** — the api returns a bare array; the response schema is `{ schemas }` / `{ schemaRows }`. The handler MUST `.then((arr) => ({ schemas: arr }))` — omitting the wrap fails `responseSchema.parse` (the `[[planner-consumer-pattern-read]]` trap; Block reorder is the precedent).

---

## § 6 — Commit strategy (per-layer atomic; no squash, per `[[husky-cross-package-squash]]`)

**Fan-out analysis.** `check-types` / `lint` are `dependsOn: ["^…"]`.

- **Commit 1 (contracts)** — additive: new exports + widened reorder request schemas inside already-registered slice files. `@repo/contracts` self-consistent. `apps/platform` (a dependent) does not yet import them — it still type-checks. Tree green.
- **Commit 2 (Schema routes)** — new `route.ts` files importing the Commit-1 contract schemas (present) + `lmsSchemaApi` (present since 8.1a) + `@repo/api-routes` (present). Tree green.
- **Commit 3 (SchemaRow routes)** — same, against `lmsSchemaRowApi`. Tree green.
- **Commit 4 (AlternatingGroup routes)** — same, against `lmsAlternatingGroupApi`. Tree green.

Every intermediate tree type-checks → **per-layer atomic commits, no squash**. Order 1 → 2 → 3 → 4.

**Commits:**

1. `feat(contracts): add route params and reorder-scope request schemas`
2. `feat(platform): add http routes for schema crud and reorder`
3. `feat(platform): add http routes for schema-row crud and reorder`
4. `feat(platform): add http routes for alternating-group operations`
5. `docs(step-08.2): write executor output report` — `implementation/step-08.2/output.md`.

Commitlint: subject ≤ 100 chars, **fully lowercase** (no caps, including acronyms — `http`, `crud`); body lines ≤ 150. Per-layer body bullet lists welcome. Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — a failing hook is a root cause to fix.

---

## § 7 — Out-of-scope / deferred (forward notes)

- **Client API + TanStack hooks** — Step 8.3 (mirror Step 7.3 — `createXxxAPI` factory in `apps/platform/src/lib/api/endpoints/` + `useXxx` mutation hooks). 8.2's routes are their call target.
- **Read surface** — a GET route / read api method, or (more likely) a `schemas[]` + group embed into the Block/Week read — Step 8.3.5. The `get…ResponseSchema` contract schemas already exist, unconsumed, awaiting it.
- **UI** — ArchetypePicker, the Schema editor, the alternating-group bracket — Step 8.4+.
- **PR #199 review note #1 (`schemaIds` ordering)** — covered, no 8.2 artifact: `mapToAlternatingGroup` orders by `Schema.order asc` and the 8.1d mapper-determinism test pins it; the routes pass that output through unchanged. Zod arrays cannot express ordering structurally and the no-comments rule forbids a JSDoc — nothing further is owed. Recorded closed in spirit; `REVIEW-I4/I5/I6` + `QA-W1` remain the active `03-deferred.md` carry-forwards, untouched by 8.2.
- **QA-W1 / QA-E3** — api-server-layer deferred carry-forwards; D-8.2-6 records that QA-E3 does not surface at the route layer.

---

## § 8 — Verifications cheatsheet

```bash
# Phase 1 — contracts:
pnpm --filter @repo/contracts check-types
pnpm --filter @repo/contracts test
pnpm --filter @repo/contracts lint

# Phases 2-4 — platform routes:
pnpm --filter platform check-types
pnpm --filter platform lint

# Root sweep before output.md:
pnpm check-types        # 16/16
pnpm lint               # 16/16, 0 warnings
pnpm test               # all packages green
pnpm dep:check          # 0 violations

# Husky enforces per commit:
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"               # pre-commit
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"   # pre-push
```

No `db:reset` / `db:seed` — 8.2 changes no Prisma schema and no seed. Pre-existing flake awareness: `api-server` `block/admin.test.ts:406` timing assertion (QA-023) — re-run on flake, not a regression.

---

## § 9 — Output report format (executor produces `implementation/step-08.2/output.md`)

Per WORKFLOW.md "`output.md` format":

```markdown
## Что сделано

## Изменённые/созданные файлы

## Принятые решения

## Возникшие вопросы и как решены

## Что отложено

## Ссылка на `.feature-dev/<ts>/`

## Verification notes

## Acceptance criteria self-check
```

No `analysis-files touched` line — 8.2 changes no `analysis/` file (HTTP layer, not domain). UI smoke-test scenario — N/A (no runtime UI; routes reachable only via the future Step 8.3 hooks). If the executor judged any route-level integration test worth adding (beyond the Block no-route-test precedent), record the rationale.

---

## § 10 — Wrapper choice & process notes

**Wrapper**: `/feature` full. Cross-package (contracts + apps/platform), ~10 route files, a non-trivial manual-transform (scope split) — past the `/feature small` thin-additive carve-out (D-8.2-1).

**Branch**: `feat/training-domain` (long-lived). No branch cut.

**Per-step cycle**: thesis ratified in the planner-user chat 2026-05-20 (two-voice; user approved all hypotheses — D-8.2-1..6). Jump to `/feature` Stage 1 (Research).

**Escalation** (WORKFLOW.md "Executor escalation protocol"): if anything the spec did not anticipate surfaces — a factory that does not compose as § 0.4 describes, a Block precedent detail that contradicts § 3, a contract schema that does not widen cleanly — STOP and surface with a hypothesis. Do not silently adapt. In particular: do not drift into Step 8.3 (client hooks) or 8.3.5 (read surface); do not add a GET route or a read api method (D-8.2-2); do not modify `@repo/api-routes` (D-8.2-5 — use the existing `createAuthActionHandler`).

**Handoff after close-out**: Step 8.3 — platform client API + TanStack hooks for the three slices (mirror Step 7.3). Then 8.3.5 (read-embed) → 8.3.6 → 8.3.7 → 8.4 anchor.

---

**End of prompt.**
