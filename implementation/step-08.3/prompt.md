# Step 8.3 — Platform client API + TanStack hooks (`Schema` / `SchemaRow` / `AlternatingGroup` slices)

**Wrapper**: `/feature small`. 3 endpoint-factory files + 3 hook files + 3 barrel edits, single-package (`apps/platform/src/lib/`), additive, zero new architecture — a thin-wrapper consumer layer. Mirror Step 7.3 (Block client API + hooks), which ran `/feature small`. The volume (~9 file touches) exceeds 7.3 (5), but the _kind_ is the identical thin pattern ×3 — calibration: thin-wrapper consumer layer → `small`.

**Branch**: `feat/training-domain` long-lived. NO new branch cut (per `[[training-domain-workflow]]` + `[[always-via-feature-skill]]` branch-cut override). At prompt-write the branch is **13 commits ahead of `main`** (`993d5268`), local-unpushed; the prompt commit (`docs(step-08.3): …`) makes it 14 — **use that prompt commit as the `git diff` baseline**.

**Predecessor / decomposition**: Step 8.2 shipped the platform HTTP layer — 10 Next.js App Router `route.ts` handlers over all 12 write methods of `lmsSchemaApi` / `lmsSchemaRowApi` / `lmsAlternatingGroupApi`. Step 8.3 adds the **client consumer**: `createXxxAPI` endpoint factories in `apps/platform/src/lib/api/endpoints/` + `useXxx` TanStack mutation hooks in `apps/platform/src/lib/hooks/`, calling those routes. The contracts (`schema-api` / `schema-row-api` / `alternating-group-api`) and the routes all exist; 8.3 touches **only `apps/platform/src/lib/`**. Thesis ratified in the planner-user chat 2026-05-21 (two-voice; user approved all hypotheses — see § 1.x).

This step ships **no UI** — UI is Step 8.4+. **No read hook** — no GET route exists (D-8.2-2); the read surface is Step 8.3.5. No browser smoke-test (§ 9) — the hooks are reachable only via the future UI.

---

## § 0 — Verbatim source reads (read-at-prompt-write-time per `[[planner-verbatim-registration]]` + `[[scope-via-existing-patterns]]`)

All quotes are the **current** state, verified 2026-05-21. They are reference material — the deliverable shapes are described structurally in § 3, not as code skeletons (per `[[planner-strategic-level]]`). The executor re-reads precedents during `/feature` Research; § 0 records the planner-verified state and the load-bearing exact-quote files.

### § 0.1 — The canonical mirror: Block client API + hooks (Step 7.3 — verbatim, 3 files)

`apps/platform/src/lib/api/endpoints/blocks.ts`:

```ts
import { type ApiClient } from "@repo/api-client";
import type {
  AssignBlockLabelsData,
  Block,
  CreateBlockData,
  ReorderBlocksData,
  UpdateBlockData,
} from "@repo/contracts/lms/block";

export const createBlocksAPI = (client: ApiClient) => ({
  create: (planId: string, sessionId: string, data: CreateBlockData): Promise<Block> =>
    client.request(
      `/api/platform/training-plans/${planId}/sessions/${sessionId}/blocks`,
      "POST",
      data,
    ),

  update: (planId: string, blockId: string, data: UpdateBlockData): Promise<Block> =>
    client.request(`/api/platform/training-plans/${planId}/blocks/${blockId}`, "PUT", data),

  delete: (planId: string, blockId: string): Promise<void> =>
    client.requestNoContent(`/api/platform/training-plans/${planId}/blocks/${blockId}`, "DELETE"),

  reorder: (
    planId: string,
    sessionId: string,
    data: ReorderBlocksData,
  ): Promise<{ blocks: Block[] }> =>
    client.request(
      `/api/platform/training-plans/${planId}/sessions/${sessionId}/blocks/reorder`,
      "PUT",
      data,
    ),

  assignLabels: (planId: string, blockId: string, data: AssignBlockLabelsData): Promise<Block> =>
    client.request(`/api/platform/training-plans/${planId}/blocks/${blockId}/labels`, "PUT", data),
});
```

`apps/platform/src/lib/hooks/use-blocks.ts`:

```ts
"use client";

import type {
  AssignBlockLabelsData,
  Block,
  CreateBlockData,
  ReorderBlocksData,
  UpdateBlockData,
} from "@repo/contracts/lms/block";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useCreateBlock = (planId: string, startDate: string, sessionId: string) =>
  useWeekMutation<CreateBlockData, Block>({
    mutationFn: (data) => api.blocks.create(planId, sessionId, data),
    planId,
    startDate,
    successMessage: "Block created",
    errorMessage: "Failed to create block",
  });

export const useUpdateBlock = (planId: string, startDate: string) =>
  useWeekMutation<{ blockId: string; data: UpdateBlockData }, Block>({
    mutationFn: ({ blockId, data }) => api.blocks.update(planId, blockId, data),
    planId,
    startDate,
    successMessage: "Block updated",
    errorMessage: "Failed to update block",
  });

export const useDeleteBlock = (planId: string, startDate: string) =>
  useWeekMutation<{ blockId: string }, void>({
    mutationFn: ({ blockId }) => api.blocks.delete(planId, blockId),
    planId,
    startDate,
    successMessage: "Block deleted",
    errorMessage: "Failed to delete block",
  });

export const useReorderBlocks = (planId: string, startDate: string, sessionId: string) =>
  useWeekMutation<ReorderBlocksData, { blocks: Block[] }>({
    mutationFn: (data) => api.blocks.reorder(planId, sessionId, data),
    planId,
    startDate,
    successMessage: "Blocks reordered",
    errorMessage: "Failed to reorder blocks",
  });

export const useAssignBlockLabels = (planId: string, startDate: string) =>
  useWeekMutation<{ blockId: string; data: AssignBlockLabelsData }, Block>({
    mutationFn: ({ blockId, data }) => api.blocks.assignLabels(planId, blockId, data),
    planId,
    startDate,
    successMessage: "Block labels saved",
    errorMessage: "Failed to save block labels",
  });
```

`apps/platform/src/lib/hooks/use-week-mutation.ts` (the shared helper — **reused as-is, NOT modified**):

```ts
"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";

import { notifyError } from "@repo/query";

import { platformKeys } from "../api/keys";

type UseWeekMutationConfig<TVars, TResult> = {
  mutationFn: (vars: TVars) => Promise<TResult>;
  planId: string;
  startDate: string;
  successMessage: string;
  errorMessage: string;
};

export const useWeekMutation = <TVars, TResult>({
  mutationFn,
  planId,
  startDate,
  successMessage,
  errorMessage,
}: UseWeekMutationConfig<TVars, TResult>): UseMutationResult<TResult, Error, TVars> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.weeks.byDate(planId, startDate),
      });
      toast.success(successMessage);
    },
    onError: (error: Error) => {
      notifyError(error, errorMessage);
    },
  });
};
```

**Load-bearing facts.** (a) A factory is `createXxxAPI = (client: ApiClient) => ({ method: (...) => client.request(...) })`. (b) A method returning a body → `client.request(url, METHOD, data?)`; a void/`204` method → `client.requestNoContent(url, "DELETE")`. (c) `reorder` returns a **wrapped** object (`{ blocks: Block[] }`) — the route response schema is `{ blocks }`, not a bare array. (d) Hooks: `useWeekMutation<TVars, TResult>` with `{ mutationFn, planId, startDate, successMessage, errorMessage }`; the helper invalidates `weeks.byDate(planId, startDate)` and fires a success/error toast — **every 8.3 hook reuses it byte-identically** (incl. the toast — see D-8.3-6). (e) **TVars convention** — a parent id fixed for the hook's lifetime is a hook param (`sessionId` in `useCreateBlock`); an id varying per call sits in TVars (`blockId` in `useUpdateBlock`); a value+id pair in TVars wraps as `{ id, data }`, never flat (the Step 7.3 R2 ratification — `useAssignBlockLabels` TVars is `{ blockId, data }`). (f) `sessionId` is a hook param in `useCreateBlock` / `useReorderBlocks` **because it is a URL path segment** (`/sessions/[sessionId]/blocks`) — see D-8.3-3 for why no 8.3 hook gets such a param.

### § 0.2 — `ApiClient` method signatures (`@repo/api-client/src/client.ts` — verbatim, NOT modified)

```ts
async request<T>(
  url: string,
  method: HttpMethod = "GET",
  body?: unknown,
  queryParams?: Record<string, string>,
  options?: TypedRequestOptions<T>,
): Promise<T> {
  const prepared = await this.prepareRequest(url, method, body, queryParams, options);
  const response = await this.executeRequest(prepared, method);
  if (response.status === NO_CONTENT_STATUS) {
    throw new InternalServerError("Unexpected 204 No Content for typed request", { ... });
  }
  return parseSuccessBody<T>(response, prepared.fullUrl, options?.responseSchema);
}

async requestNoContent(
  url: string,
  method: HttpMethod = "DELETE",
  body?: unknown,
  ...
): Promise<void> { ... }
```

`HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"` (`client-types.ts`).

**Load-bearing fact for D-8.3-5.** `request` accepts **any** `HttpMethod` (including `"DELETE"`) and `body` is optional. It parses the response body — but **throws `InternalServerError` if the response is `204`**. `requestNoContent` is the inverse: it discards the body. `lmsAlternatingGroupApi.removeMember`'s route returns a **`200` with a JSON body** (`createAuthActionHandler` — the group, or `null` on dissolve), never `204` → `removeMember` MUST use `client.request<…>(url, "DELETE")`. `requestNoContent` would silently drop the `AlternatingGroup | null` result; that is the trap.

### § 0.3 — The 8.2 routes (the call targets — verbatim topology, request/response per route)

All under `apps/platform/src/app/api/platform/training-plans/[planId]/`. Each handler is `withCoachAuth( withAuthRateLimit( createAuth*Handler(...), RATE_LIMIT_TIER.API ) )`. Status: `createAuthPostByParamHandler` → `201`; `createAuthPutByParamHandler` → `200`; `createAuthDeleteHandler` → `204`/void; `createAuthActionHandler` → `200` + body.

| Route file                                                 | HTTP     | Request body (contract schema)                                 | Response (contract schema)                                                                                            |
| ---------------------------------------------------------- | -------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `schemas/route.ts`                                         | `POST`   | `createSchemaRequestSchema` (flat — scope keys packed in body) | `createSchemaResponseSchema` = `schemaSchema`                                                                         |
| `schemas/[schemaId]/route.ts`                              | `PUT`    | `updateSchemaRequestSchema`                                    | `updateSchemaResponseSchema` = `schemaSchema`                                                                         |
| `schemas/[schemaId]/route.ts`                              | `DELETE` | —                                                              | — (`204`)                                                                                                             |
| `schemas/reorder/route.ts`                                 | `PUT`    | `reorderSchemasRequestSchema` (`z.union` — scope in body)      | `reorderSchemasResponseSchema` = `{ schemas: Schema[] }`                                                              |
| `schema-rows/route.ts`                                     | `POST`   | `createSchemaRowRequestSchema` (carries `schemaId`)            | `createSchemaRowResponseSchema` = `schemaRowSchema`                                                                   |
| `schema-rows/[schemaRowId]/route.ts`                       | `PUT`    | `updateSchemaRowRequestSchema`                                 | `updateSchemaRowResponseSchema` = `schemaRowSchema`                                                                   |
| `schema-rows/[schemaRowId]/route.ts`                       | `DELETE` | —                                                              | — (`204`)                                                                                                             |
| `schema-rows/reorder/route.ts`                             | `PUT`    | `reorderSchemaRowsRequestSchema` (carries `schemaId`)          | `reorderSchemaRowsResponseSchema` = `{ schemaRows: SchemaRow[] }`                                                     |
| `alternating-groups/route.ts`                              | `POST`   | `createAlternatingGroupRequestSchema`                          | `createAlternatingGroupResponseSchema` = `alternatingGroupSchema`                                                     |
| `alternating-groups/[groupId]/route.ts`                    | `DELETE` | —                                                              | — (`204`)                                                                                                             |
| `alternating-groups/[groupId]/members/route.ts`            | `POST`   | `addMemberAlternatingGroupRequestSchema` = `{ schemaId }`      | `addMemberAlternatingGroupResponseSchema` = `alternatingGroupSchema`                                                  |
| `alternating-groups/[groupId]/members/[schemaId]/route.ts` | `DELETE` | — (ids in path)                                                | `removeMemberAlternatingGroupResponseSchema` = `alternatingGroupSchema.nullable()` (`createAuthActionHandler`, `200`) |

**Load-bearing facts.** (1) Schema `create` — the route splits scope server-side; **the client sends a flat body** (`createSchemaRequestSchema` packs `blockId` + `parentSchemaId?`). (2) Schema `reorder` — the route accepts the `z.union` request body that **carries the scope** (`{ orderedIds, blockId } | { orderedIds, parentSchemaId }`); the route then wraps the api's bare array into `{ schemas }`. (3) SchemaRow `reorder` body carries `schemaId`. (4) `addMember` body is `{ schemaId }`; `removeMember` takes both ids **in the path**, no body. (5) `removeMember`'s response is **nullable** (`null` = group dissolved — 8.1d D-A4). (6) No GET route exists for any slice (D-8.2-2).

### § 0.4 — Contract types (the types the factories/hooks import — verbatim observations)

The slice barrels `@repo/contracts/lms/{schema,schema-row,alternating-group}` re-export **both** the entity-level types (`*.types.ts`) and the api-level types (`*-api.types.ts`).

- **Entity types** (`*.types.ts`): `Schema`, `CreateSchemaData`, `UpdateSchemaData`, `ReorderSchemasData`; `SchemaRow`, `CreateSchemaRowData`, `UpdateSchemaRowData`, `ReorderSchemaRowsData`; `AlternatingGroup`, `CreateAlternatingGroupData`.
- **Api types** (`*-api.types.ts`): `CreateSchemaRequest`, `UpdateSchemaRequest`, `ReorderSchemasRequest`, `ReorderSchemasResponse`; `CreateSchemaRowRequest`, `UpdateSchemaRowRequest`, `ReorderSchemaRowsRequest`, `ReorderSchemaRowsResponse`; `CreateAlternatingGroupRequest`, `AddMemberAlternatingGroupRequest`, `RemoveMemberAlternatingGroupResponse` (et al. — params types are route-internal, irrelevant to the client).

**The load-bearing divergence.** For `create` / `update` the api request schema is _aliased_ to the entity schema (`createSchemaRequestSchema = createSchemaSchema`) → `CreateSchemaRequest` and `CreateSchemaData` are structurally identical. **For `reorder` they are NOT**: `reorderSchemasRequestSchema` is the `z.union` carrying the scope, while `ReorderSchemasData` (`z.infer<typeof reorderSchemasSchema>`) is `{ orderedIds }`-**only — no scope**. Likewise `ReorderSchemaRowsRequest` carries `schemaId`; `ReorderSchemaRowsData` does not. The Block precedent imported entity `*Data` types throughout (legitimate — Block reorder has no body-scope, so `ReorderBlocksData === ReorderBlocksRequest`). **For 8.3 that would be a compile-clean runtime bug**: a `reorder` method typed with `ReorderSchemasData` accepts a payload missing the scope key, the route's `z.union` rejects it → `400`. → D-8.3-4.

`schema-api.schema.ts` reorder schema, verbatim (the `z.union` from D-8.2-7):

```ts
export const reorderSchemasRequestSchema = z.union([
  reorderSchemasSchema.extend({
    blockId: z.string().cuid(),
    parentSchemaId: z.undefined().optional(),
  }),
  reorderSchemasSchema.extend({
    blockId: z.undefined().optional(),
    parentSchemaId: z.string().cuid(),
  }),
]);
```

→ `ReorderSchemasRequest` infers to `{ orderedIds; blockId: string; parentSchemaId?: undefined } | { orderedIds; blockId?: undefined; parentSchemaId: string }`. `null` is assignable to neither scope key — see QA-I1 / D-8.3-4.

### § 0.5 — Registration files (verbatim — current state at prompt-write, per `[[planner-verbatim-registration]]`)

`apps/platform/src/lib/api/endpoints/index.ts`:

```ts
export { createBlocksAPI } from "./blocks";
export { createCoachAthletesAPI } from "./coach-athletes";
export { createCoachActionItemsAPI } from "./coach-action-items";
export { createCoachDashboardAPI } from "./coach-dashboard";
export { createCoachInviteAPI } from "./coach-invite";
export { createDayMetadataAPI } from "./day-metadata";
export { createLabelsAPI } from "./labels";
export { createSessionsAPI } from "./sessions";
export { createTrainingPlansAPI } from "./training-plans";
export { createUsersAPI } from "./users";
export { createWeeksAPI } from "./weeks";
```

`apps/platform/src/lib/api/index.ts`:

```ts
import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  blocks: endpoints.createBlocksAPI(client),
  coachAthletes: endpoints.createCoachAthletesAPI(client),
  coachActionItems: endpoints.createCoachActionItemsAPI(client),
  coachDashboard: endpoints.createCoachDashboardAPI(client),
  coachInvite: endpoints.createCoachInviteAPI(client),
  dayMetadata: endpoints.createDayMetadataAPI(client),
  labels: endpoints.createLabelsAPI(client),
  sessions: endpoints.createSessionsAPI(client),
  trainingPlans: endpoints.createTrainingPlansAPI(client),
  users: endpoints.createUsersAPI(client),
  weeks: endpoints.createWeeksAPI(client),
});

export const api = createApi(browserApiClient);
```

`apps/platform/src/lib/hooks/index.ts`:

```ts
export * from "./use-blocks";
export * from "./use-blur-commit";
export * from "./use-coach-athletes";
export * from "./use-current-user-role";
export * from "./use-coach-action-items";
export * from "./use-coach-dashboard";
export * from "./use-coach-invite";
export * from "./use-day-metadata";
export * from "./use-label-options";
export * from "./use-label-search";
export * from "./use-sessions";
export * from "./use-training-plans";
export * from "./use-users";
export * from "./use-week-mutation";
export * from "./use-weeks";
```

**Additive intent.** `endpoints/index.ts` gains 3 `export { … }` lines; `createApi` gains 3 keys; `hooks/index.ts` gains 3 `export *` lines. The three files are **mostly** alphabetically ordered (the `coach-*` cluster aside — pre-existing, do NOT reorder it); place the new entries alphabetically, the way Step 7.3 placed `createBlocksAPI` / `use-blocks`. No other registration surface — endpoint factories are plain modules; hooks are plain modules; there is no `package.json` exports / `turbo.json` / dep-cruiser edit (these are intra-`apps/platform` files).

### § 0.6 — `keys.ts` (the invalidation target — verbatim, NOT modified)

`apps/platform/src/lib/api/keys.ts`:

```ts
weeks: {
  byDate: (planId: string, startDate: string) =>
    [...ROOT, "training-plans", planId, "weeks", startDate] as const,
},
```

`useWeekMutation` already invalidates `platformKeys.weeks.byDate(planId, startDate)`. 8.3 adds **no** new query key — every mutation invalidates the existing week-tree key (D-8.3-2).

### § 0.7 — husky / turbo (commit-strategy inputs, per `[[husky-cross-package-squash]]` — durable)

- `.husky/pre-commit`: `check-secrets` → `lint-staged` → `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"`.
- `.husky/pre-push`: `pnpm dep:check` → `SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"`.
- `turbo.json`: `check-types` / `lint` `dependsOn: ["^…"]`; `test: { cache: false }`.

**Fan-out**: 8.3 is **single-package** (`apps/platform` only). No cross-package change → no squash trigger. Per-layer atomic commits (§ 6).

---

## § 1 — Goal & ratified decisions

### Coach view

**Walkthrough.** Тренер открывает редактор плана на конкретной неделе, разворачивает сессию среды, входит в её блок «Strength». Внутри блока он строит саму тренировку: добавляет схему, выбрав архетип «EMOM» — карточка схемы появляется в блоке; наполняет её строками — строка-упражнение «10 cal row», ещё одна, перетаскивает одну выше другой; добавляет вторую схему — «3×5 back squat»; решает, что эти две идут вперемешку, и объединяет их в чередующийся набор; потом вытягивает одну обратно — в наборе осталась одна схема, чередование распадается, оставшаяся возвращается в самостоятельный вид. Каждое действие ложится сразу: блок перерисовывается с новой схемой, новая строка появляется внутри схемы, переставленный список оседает в новом порядке, в углу мигает мелкое подтверждение. Кнопки «сохранить» нет; открыв план назавтра, тренер видит ровно это.

**Goal (coach).** На самом шаге 8.3 тренер не увидит ничего нового — 8.3 это невидимая прослойка. Экраны из walkthrough появляются начиная со Step 8.4 (anchor). 8.3 — то, без чего эти действия потом не сохранятся и не обновят экран.

### Developer view

**Goal.** Ship the platform client layer for the three api slices, mirroring Step 7.3 (Block). Two parts:

1. **Endpoint factories** — `createSchemasAPI` / `createSchemaRowsAPI` / `createAlternatingGroupsAPI` in `apps/platform/src/lib/api/endpoints/`, each `(client: ApiClient) => ({ … })`, one method per 8.2 route (12 methods total), registered in `endpoints/index.ts` + `api/index.ts`.
2. **Mutation hooks** — 12 `useXxx` hooks in `apps/platform/src/lib/hooks/`, each built on `useWeekMutation`, registered in `hooks/index.ts`.

After 8.3 the future plan-editor UI (8.4+) has a typed mutation surface for Schema / SchemaRow / AlternatingGroup. **Write methods only — no read hook** (no GET route; the read surface is Step 8.3.5).

### § 1.x — Ratified decisions (planner-user chat 2026-05-21; user approved all hypotheses)

- **D-8.3-1 (collapsed single step, `/feature small`).** 8.3 is one step — 3 endpoint factories + 3 hook files + 3 barrel edits. The pattern is the Step 7.3 thin-wrapper ×3, zero new architecture, single-package. Step 7.3 (Block, 5 methods) ran `/feature small`; 8.3 is the same kind at higher volume (12 methods) → `/feature small`.
- **D-8.3-2 (`useWeekMutation` reused as-is; no read hook).** All 12 hooks reuse `useWeekMutation` byte-identically; each invalidates `platformKeys.weeks.byDate(planId, startDate)` (the plan-editor renders all three entity types inside the week view → one consistent week-tree refresh). `useWeekMutation` and `keys.ts` are **NOT modified**. No query/read hook — no GET route exists (D-8.2-2); the read surface is Step 8.3.5.
- **D-8.3-3 (hook signatures `(planId, startDate)` + everything else in TVars).** Block's `useCreateBlock` / `useReorderBlocks` carry a 3rd param (`sessionId`) **only because `sessionId` is a URL path segment** (`/sessions/[sessionId]/blocks`). The Schema / SchemaRow / AlternatingGroup create+reorder routes carry their parent scope **in the request body**, not the URL (`/training-plans/[planId]/schemas`). Applying the same Block rule — _fixed URL segment → hook param; varying id + body → TVars_ — every 8.3 hook is `(planId, startDate)` only, with all route-specific ids/data in TVars. This is the **same** rule as Block, not a divergence. TVars per method: `useUpdateSchema` → `{ schemaId, data }`; `useDeleteSchema` → `{ schemaId }`; `useCreateSchema` → the create request type (scope packed in body); `useReorderSchemas` → the reorder request type (scope packed in body); `useDeleteAlternatingGroup` → `{ groupId }`; `useAddAlternatingGroupMember` → `{ groupId, data }` (the `{ id, data }` wrap — Step 7.3 R2 precedent); `useRemoveAlternatingGroupMember` → `{ groupId, schemaId }`.
- **D-8.3-4 (reorder/addMember/response use api-level `*Request` / `*Response` types — NOT entity `*Data`).** Per § 0.4: `ReorderSchemasData` / `ReorderSchemaRowsData` (entity) lack the scope / `schemaId` the wire body carries; only the api-level `ReorderSchemasRequest` / `ReorderSchemaRowsRequest` carry them. The `reorder` factory methods and `useReorder*` hooks (TVars) **must** import the api-level types. `useReorderSchemas`' TVars being exactly `ReorderSchemasRequest` (the `z.union`) **closes QA-I1**: `null` is not assignable to either scope key, so no call site can construct an explicit `parentSchemaId: null` (which the route's `z.union` rejects) — the hook just forwards TVars verbatim. **Rationale for going api-level uniformly** (create/update too, where api ≡ entity): the factory is the wire layer — the api-level types _are_ the wire contract the routes validate; a uniform set avoids a per-method `*Data`-vs-`*Request` split inside one file. Entity-level domain types `Schema` / `SchemaRow` / `AlternatingGroup` stay the natural choice for the `TResult` payloads.
- **D-8.3-5 (`removeMember` uses `client.request`, not `requestNoContent`).** `removeMember` is a `DELETE` verb that **returns a body** (`AlternatingGroup | null`). Every prior platform-client `delete` uses `client.requestNoContent` (discards body, expects `204`). `removeMember`'s route is `createAuthActionHandler` → `200` + JSON (the group, or `null` on dissolve), **never `204`** → use `client.request<AlternatingGroup | null>(url, "DELETE")`. `requestNoContent` would drop the result; `request` throws only on `204`, which this route never returns. The `AlternatingGroup | null` result passes straight through `useWeekMutation`'s generic `TResult` to the caller — no `null`-coalescing; the future grouping UI branches on it.
- **D-8.3-6 (toasts unchanged — mirror Block).** Every 8.3 hook reuses `useWeekMutation` exactly, **including its success + error toast**. The toast-policy idea (drop success toasts editor-wide except on session-delete) was raised in the thesis cycle and **deferred by the user 2026-05-21 — "leave it as is for now"**. 8.3 does **not** touch toast behaviour, does **not** modify `useWeekMutation`. The deferred toast-policy is recorded as a forward note (§ 7) for a later step once the schema-editing UI exists and the cadence is observable.

---

## § 2 — Scope / Inputs

### Files CREATED

- `apps/platform/src/lib/api/endpoints/schemas.ts` — `createSchemasAPI`.
- `apps/platform/src/lib/api/endpoints/schema-rows.ts` — `createSchemaRowsAPI`.
- `apps/platform/src/lib/api/endpoints/alternating-groups.ts` — `createAlternatingGroupsAPI`.
- `apps/platform/src/lib/hooks/use-schemas.ts` — 4 Schema hooks.
- `apps/platform/src/lib/hooks/use-schema-rows.ts` — 4 SchemaRow hooks.
- `apps/platform/src/lib/hooks/use-alternating-groups.ts` — 4 AlternatingGroup hooks.

### Files MODIFIED

- `apps/platform/src/lib/api/endpoints/index.ts` — +3 `export { … }` lines.
- `apps/platform/src/lib/api/index.ts` — +3 keys in `createApi`.
- `apps/platform/src/lib/hooks/index.ts` — +3 `export *` lines.

### Files / areas NOT touched (out of scope)

- `apps/platform/src/lib/hooks/use-week-mutation.ts` — reused as-is (D-8.3-2 / D-8.3-6).
- `apps/platform/src/lib/api/keys.ts` — reused as-is; no new query key (D-8.3-2).
- `apps/platform/src/lib/api/client.ts` (`browserApiClient`) — unchanged.
- The 8.2 `route.ts` handlers, `packages/contracts`, `packages/api-server`, `packages/api-routes` — all complete; 8.3 only **consumes** them.
- No read hook / no GET route / no `useQuery` — D-8.2-2; the read surface is Step 8.3.5.
- UI (`apps/platform/src/modules/`) — Step 8.4+.
- `apps/admin`, Prisma schema, `analysis/` — untouched. 8.3 is a client-layer wrap over settled routes; **no domain-semantics change → no `analysis/` sync** (per WORKFLOW.md `analysis/` rules — hooks are not the domain layer).
- Toast policy on the existing Block/Session/Day hooks — explicitly deferred (D-8.3-6, § 7).

---

## § 3 — Phases (spec-only — structural descriptions, no code skeletons)

Read the Block precedent (§ 0.1) and mirror its formatting / idiom / import style; write the actual code per project convention. No code comments (project rule). The hook files start with `"use client"` (mirror `use-blocks.ts`).

### § 3.1 — Phase 1: endpoint factories + barrels

**Goal.** Three endpoint-factory modules + their two barrels.

**`endpoints/schemas.ts` — `createSchemasAPI(client: ApiClient)`**, 4 methods over the Schema routes (§ 0.3):

- `create(planId, data)` → `Promise<Schema>` — `client.request(.../schemas, "POST", data)`. `data` is the flat create request (scope keys packed in body; the route splits scope server-side).
- `update(planId, schemaId, data)` → `Promise<Schema>` — `client.request(.../schemas/${schemaId}, "PUT", data)`.
- `delete(planId, schemaId)` → `Promise<void>` — `client.requestNoContent(.../schemas/${schemaId}, "DELETE")`.
- `reorder(planId, data)` → `Promise<{ schemas: Schema[] }>` — `client.request(.../schemas/reorder, "PUT", data)`. `data` is the api-level `ReorderSchemasRequest` (`z.union` — scope packed in body; D-8.3-4). The route response is `{ schemas }` — the method's return type matches it.

**`endpoints/schema-rows.ts` — `createSchemaRowsAPI(client)`**, 4 methods:

- `create(planId, data)` → `Promise<SchemaRow>` — `POST .../schema-rows`. `data` carries `schemaId` (the parent — packed in body).
- `update(planId, schemaRowId, data)` → `Promise<SchemaRow>` — `PUT .../schema-rows/${schemaRowId}`.
- `delete(planId, schemaRowId)` → `Promise<void>` — `requestNoContent` `DELETE .../schema-rows/${schemaRowId}`.
- `reorder(planId, data)` → `Promise<{ schemaRows: SchemaRow[] }>` — `PUT .../schema-rows/reorder`. `data` is `ReorderSchemaRowsRequest` (carries `schemaId`; D-8.3-4).

**`endpoints/alternating-groups.ts` — `createAlternatingGroupsAPI(client)`**, 4 methods:

- `create(planId, data)` → `Promise<AlternatingGroup>` — `POST .../alternating-groups`.
- `delete(planId, groupId)` → `Promise<void>` — `requestNoContent` `DELETE .../alternating-groups/${groupId}`.
- `addMember(planId, groupId, data)` → `Promise<AlternatingGroup>` — `POST .../alternating-groups/${groupId}/members`. `data` is `AddMemberAlternatingGroupRequest` (`{ schemaId }`).
- `removeMember(planId, groupId, schemaId)` → `Promise<AlternatingGroup | null>` — **`client.request(.../alternating-groups/${groupId}/members/${schemaId}, "DELETE")`** (D-8.3-5 — `request`, NOT `requestNoContent`; the route returns a `200` body). No request body — both ids are URL segments.

**Barrels** — `endpoints/index.ts` gains the 3 `export { createXxxAPI } from "./…"` lines (alphabetical); `api/index.ts`'s `createApi` gains `schemas` / `schemaRows` / `alternatingGroups` keys (alphabetical — `alternatingGroups` near the top, `schemaRows` / `schemas` before `sessions`).

**Commit 1**: `feat(platform): add client api factories for schema schema-row and alternating-group`.

### § 3.2 — Phase 2: mutation hooks + barrel

**Goal.** Three hook modules — 12 `useXxx` mutation hooks via `useWeekMutation`, all `(planId, startDate)` signatures (D-8.3-3), all reusing `useWeekMutation` with a `successMessage` + `errorMessage` (D-8.3-6 — toasts as Block).

**`hooks/use-schemas.ts`** — `useCreateSchema` / `useUpdateSchema` / `useDeleteSchema` / `useReorderSchemas`, each `(planId, startDate)`:

- `useCreateSchema` — `useWeekMutation<CreateSchemaRequest, Schema>`, `mutationFn: (data) => api.schemas.create(planId, data)`.
- `useUpdateSchema` — `useWeekMutation<{ schemaId, data: UpdateSchemaRequest }, Schema>`, `mutationFn: ({ schemaId, data }) => api.schemas.update(planId, schemaId, data)`.
- `useDeleteSchema` — `useWeekMutation<{ schemaId }, void>`.
- `useReorderSchemas` — `useWeekMutation<ReorderSchemasRequest, { schemas: Schema[] }>`, `mutationFn: (data) => api.schemas.reorder(planId, data)`. TVars is exactly `ReorderSchemasRequest` — the api `z.union` — no hand-widened shape (D-8.3-4 / QA-I1).

**`hooks/use-schema-rows.ts`** — `useCreateSchemaRow` / `useUpdateSchemaRow` / `useDeleteSchemaRow` / `useReorderSchemaRows`, analogous (`SchemaRow` TResult; `useReorderSchemaRows` TVars = `ReorderSchemaRowsRequest`).

**`hooks/use-alternating-groups.ts`** — `(planId, startDate)` each:

- `useCreateAlternatingGroup` — `useWeekMutation<CreateAlternatingGroupRequest, AlternatingGroup>`.
- `useDeleteAlternatingGroup` — `useWeekMutation<{ groupId }, void>`.
- `useAddAlternatingGroupMember` — `useWeekMutation<{ groupId, data: AddMemberAlternatingGroupRequest }, AlternatingGroup>`.
- `useRemoveAlternatingGroupMember` — `useWeekMutation<{ groupId, schemaId }, AlternatingGroup | null>`, `mutationFn: ({ groupId, schemaId }) => api.alternatingGroups.removeMember(planId, groupId, schemaId)`. The `AlternatingGroup | null` `TResult` flows through `useWeekMutation`'s generic — no coalescing.

`successMessage` / `errorMessage` strings — mirror the Block wording register (`"Schema created"`, `"Failed to create schema"`, …). The exact phrasing is the executor's call.

**Barrel** — `hooks/index.ts` gains `export * from "./use-alternating-groups"` / `"./use-schema-rows"` / `"./use-schemas"` (alphabetical).

**Commit 2**: `feat(platform): add schema schema-row and alternating-group mutation hooks`.

---

## § 4 — Acceptance criteria

1. ✅ `endpoints/{schemas,schema-rows,alternating-groups}.ts` created — each `createXxxAPI = (client: ApiClient) => ({ … })`, mirroring `createBlocksAPI`.
2. ✅ Schema factory: `create` / `update` / `delete` / `reorder` — correct URLs + verbs; `delete` via `requestNoContent`; `reorder` returns `{ schemas: Schema[] }`.
3. ✅ SchemaRow factory: 4 methods analogous; `reorder` returns `{ schemaRows: SchemaRow[] }`.
4. ✅ AlternatingGroup factory: `create` / `delete` / `addMember` / `removeMember`; `removeMember` uses `client.request(url, "DELETE")` (NOT `requestNoContent`) and returns `AlternatingGroup | null` (D-8.3-5).
5. ✅ `reorder` / `addMember` method params use the api-level request types (`ReorderSchemasRequest`, `ReorderSchemaRowsRequest`, `AddMemberAlternatingGroupRequest`) — not entity `*Data` (D-8.3-4).
6. ✅ `endpoints/index.ts` exports the 3 factories; `createApi` (`api/index.ts`) registers `schemas` / `schemaRows` / `alternatingGroups`.
7. ✅ `hooks/{use-schemas,use-schema-rows,use-alternating-groups}.ts` created — 12 `useXxx` mutation hooks via `useWeekMutation`, `"use client"` directive, all `(planId, startDate)` signatures (D-8.3-3).
8. ✅ `useReorderSchemas` TVars is exactly `ReorderSchemasRequest` (the api `z.union`) — no hand-widened shape; QA-I1 closed (D-8.3-4).
9. ✅ `useRemoveAlternatingGroupMember` TResult is `AlternatingGroup | null`, passed through unmodified.
10. ✅ All 12 hooks reuse `useWeekMutation` unmodified (success + error toast retained — D-8.3-6); `use-week-mutation.ts` and `keys.ts` byte-identical.
11. ✅ `hooks/index.ts` re-exports the 3 new hook modules.
12. ✅ No read hook / no `useQuery` / no GET route added; `useWeekMutation` / `keys.ts` unmodified.
13. ✅ `pnpm check-types` (root) 16/16; `pnpm lint` (root) 16/16, 0 warnings; `pnpm test` (root) all packages pass; `pnpm dep:check` 0 violations.
14. ✅ Husky pre-commit + pre-push clean on every commit; zero `--no-verify` / `--no-edit` / `--no-gpg-sign`; per-layer atomic commits per § 6 (no squash).
15. ✅ `git diff <prompt-commit>..HEAD` — changes confined to `apps/platform/src/lib/{api,hooks}/`; `packages/*`, the 8.2 `route.ts` files, Prisma schema, `analysis/`, `apps/admin` show 0 lines.

---

## § 5 — Adversarial pass (per `[[planner-adversarial-review]]`)

8.3 is a thin consumer wrap of already-tested parts — the `ApiClient` (`@repo/api-client` `__tests__/`), the 8.2 routes, `useWeekMutation` (shipped Step 6.5). Step 7.3 (Block) added **no hook-level unit test** (verified — `use-blocks.ts` has no sibling test; `use-training-plans.test.ts` is the lone hook test, pre-existing); 8.3 mirrors that — hook correctness rides on the typed wrap + the tested helper. The axes below are the executor's reasoning checklist, not a mandate for new tests:

- **`removeMember` `204` trap.** `client.request` throws `InternalServerError` on a `204`. The `removeMember` route is `createAuthActionHandler` → always `200` + body (group or `null`), never `204` → `request` is safe. If a future route change made it `204`, this would surface immediately. Using `requestNoContent` here is the wrong call — it discards the `AlternatingGroup | null` result (D-8.3-5).
- **reorder type — compile-clean runtime bug.** Typing `reorder` / `useReorderSchemas` with the entity `ReorderSchemasData` (`{ orderedIds }`-only) **compiles** but sends a body with no scope key → the route's `z.union` returns `400`. The api-level `ReorderSchemasRequest` is mandatory (D-8.3-4). Same for `ReorderSchemaRowsRequest` (`schemaId`).
- **QA-I1 — explicit `null` scope key.** `reorderSchemasRequestSchema` rejects `parentSchemaId: null` (the `z.union` members allow only `cuid` or `undefined`). TVars being exactly `ReorderSchemasRequest` makes `null` unassignable at the type level — the hook forwards TVars verbatim, introduces no `?? null`, no scope-key re-derivation. No call site can construct the rejected payload.
- **`reorder` result wrap.** The routes return `{ schemas }` / `{ schemaRows }` (not bare arrays — the 8.2 handlers `.then`-wrap). The factory `reorder` return types and hook `TResult` must be the wrapped object — mirror `createBlocksAPI.reorder` / `useReorderBlocks` (`{ blocks }`).
- **`delete` is `void`.** Schema/SchemaRow/AG `delete` routes are `204` → `requestNoContent`, `Promise<void>`, hook `TResult = void` — mirror `useDeleteBlock`.
- **Invalidation key correctness.** Every hook must pass the caller's `(planId, startDate)` into `useWeekMutation` → `weeks.byDate`. A wrong `startDate` would leave a stale week view — but the hook only forwards the param; supplying the right week is the 8.4 caller's concern.
- **`addMember` / `removeMember` URL shape.** `addMember` → `groupId` in path, `{ schemaId }` in body. `removeMember` → `groupId` AND `schemaId` both in path, no body. Do not put `schemaId` in the `removeMember` body.
- **Barrel ordering.** The 3 registration files are mostly alphabetical with a pre-existing non-alphabetical `coach-*` cluster — insert alphabetically, do not “fix” the `coach-*` order (out of scope, churn).

---

## § 6 — Commit strategy (per-layer atomic; no squash, per `[[husky-cross-package-squash]]`)

**Fan-out.** 8.3 is single-package (`apps/platform`). `check-types` / `lint` are `dependsOn: ["^…"]` but no dependency package changes.

- **Commit 1 (factories + barrels)** — 3 endpoint modules + `endpoints/index.ts` + `api/index.ts`. `createApi` gains 3 keys; nothing consumes them yet. Tree type-checks (the `api` object is additive — added keys are not “unused”). Green.
- **Commit 2 (hooks + barrel)** — 3 hook modules + `hooks/index.ts`, consuming `api.schemas` / `api.schemaRows` / `api.alternatingGroups` (present since Commit 1) + `useWeekMutation` (present). Green.

Every intermediate tree type-checks → **per-layer atomic commits, no squash**. Mirrors Step 7.3's 2-commit split (factory commit, then hooks commit).

**Commits:**

1. `feat(platform): add client api factories for schema schema-row and alternating-group`
2. `feat(platform): add schema schema-row and alternating-group mutation hooks`
3. `docs(step-08.3): write executor output report` — `implementation/step-08.3/output.md`.

Commitlint: subject ≤ 100 chars, **fully lowercase** (no caps, incl. acronyms — `api`); body lines ≤ 150. Verify the subject length at commit time (`echo -n "<subject>" | wc -c`) — do not eyeball. Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — a failing hook is a root cause to fix.

---

## § 7 — Out-of-scope / deferred (forward notes)

- **Read surface** — no GET route exists (D-8.2-2). A read hook / `useQuery` (or, more likely, a `schemas[]` + alternating-group embed into the Block/Week read) is **Step 8.3.5**. Do NOT add a GET route, a read api method, or a `useQuery` in 8.3.
- **UI** — the ArchetypePicker, the Schema/SchemaRow editor, the alternating-group bracket — Step 8.4+ (the anchor). 8.3 ships hooks only.
- **Toast policy (deferred — D-8.3-6).** In the 8.3 thesis cycle the user raised dropping editor-wide success toasts (keep a toast only on session-delete, behind a confirm modal) and then deferred it — "leave it as is for now" (2026-05-21). 8.3 keeps `useWeekMutation`'s toast unchanged. A later step (once the schema-editing UI exists and the toast cadence is observable) may revisit: it would touch `useWeekMutation` + the existing Block/Session/Day hooks + `useUpdateWeekNotes`, retaining a toast on `useDeleteSession` — a behavioural change to already-shipped UX, distinct in nature from 8.3's additive layer. Planner to log this in `03-deferred.md` at the 8.3 close-out.
- **REVIEW-I4/I5/I6 + QA-W1/W2 + QA-D1** — `03-deferred.md` carry-forwards for a separate `/fix` bundle; 8.3 is client hooks and touches none of them.

---

## § 8 — Verifications cheatsheet

```bash
# Per-package during work:
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

No `db:reset` / `db:seed` — 8.3 changes no Prisma schema and no seed. `dep:check`: `apps/platform` → `@repo/api-client` + `@repo/contracts` are existing allowed edges (`blocks.ts` already imports both); +6 source files. Pre-existing flake awareness: `api-server` `block/admin.test.ts:406` timing assertion (QA-023) — re-run on flake, not a regression.

---

## § 9 — Output report format (executor produces `implementation/step-08.3/output.md`)

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

No `analysis-files touched` line — 8.3 changes no `analysis/` file (client layer, not domain). No UI smoke-test scenario — N/A (no runtime UI; the hooks are reachable only via the future Step 8.4 UI).

---

## § 10 — Wrapper choice & process notes

**Wrapper**: `/feature small`. Single-package, additive, thin-wrapper consumer layer — the Step 7.3 calibration (`small` for thin-wrapper consumer steps) applies.

**Branch**: `feat/training-domain` (long-lived). No branch cut.

**Per-step cycle**: thesis ratified in the planner-user chat 2026-05-21 (two-voice; user approved all hypotheses — D-8.3-1..6). Jump to `/feature` Stage 1 (Research).

**Escalation** (WORKFLOW.md "Executor escalation protocol"): if anything the spec did not anticipate surfaces — a Block precedent detail that contradicts § 3, a contract type that does not resolve as § 0.4 describes, a route whose request/response shape differs from § 0.3 — STOP and surface with a hypothesis. Do not silently adapt. In particular: do not add a read hook / GET route / `useQuery` (D-8.2-2 — Step 8.3.5); do not modify `useWeekMutation` or `keys.ts` (D-8.3-2); do not change toast behaviour (D-8.3-6); do not drift into UI (Step 8.4+).

**Handoff after close-out**: Step 8.3.5 — the read surface (a `schemas[]` + alternating-group embed into the Block/Week read, or a dedicated GET). Then 8.3.6 (SchemaRow `@@unique`) → 8.3.7 (Schema partial-unique) → 8.4 anchor.

---

**End of prompt.**
