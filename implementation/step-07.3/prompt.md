# Step 7.3 — Platform client API + TanStack hooks для Block

**Branch**: `feat/training-domain` (freshly cut from `main` at `8ee4b720` post-PR-#195 merge; planning-docs commits land on top before executor run, code state identical to main HEAD). Stay on this branch — do NOT cut a feature branch (see § Execution mode).

**Type**: Platform client-side slice (single-package = `apps/platform/`). Pure additive consumer layer over Step 7.2 HTTP routes; no contract / api-server / api-routes changes. **Fourth sub-step** of Step 7 decomposition (7.0 contracts → 7.1 api-server → 7.2 routes → **7.3 client API + hooks**).

**Scope**: ship `createBlocksAPI` factory (5 methods mirror `createSessionsAPI`) + 5 mutation hooks via `useWeekMutation` (mirror Step 6.5 Session pattern) + 3 barrel additions. **2 new files + 3 barrel edits = 5 file touches total**. **NO** PlanDetailView edit, **NO** `useLabelSearch({level:"BLOCK"})` callsite, **NO** new props on WeekGrid/DayRow/SessionList/SessionCard, **NO** Context refactor, **NO** test additions — all defer к Step 7.4 where BlockLabelSelect consumer materializes (per planner R1 ratification 2026-05-18).

**Execution mode**: **`/feature small` pipeline** per `[[always-via-feature-skill]]` (single-package, thin-wrapper consumer layer; Step 7.0 + 7.2 calibration matches). **Branch-cut override MANDATORY**: this step lives on long-lived `feat/training-domain` per `[[training-domain-workflow]]`. If `/feature small` Stage 0 attempts `git checkout -b feat/<slug>` from main, you MUST **STOP** and `AskUserQuestion` showing attempted branch + planner override directive, then continue on current `feat/training-domain` branch (do NOT create `feat/<slug>`). All commits land on `feat/training-domain`.

---

## § 0. Hard triggers — read-then-act gate

Before any code, **verify every verbatim quote in § 0.1-0.10 against current branch HEAD byte-for-byte**. If any quote diverges, **STOP**, run `AskUserQuestion` showing actual file content + this prompt's claim, wait for planner ratification. Do NOT silently adapt — planner owns prompt errors.

### § 0.0 Prior-implementation trace stops

This is the **4th attempt** at this domain; prior three deleted (per `implementation/WORKFLOW.md`). If you encounter vocab like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — STOP and surface. Only legitimate sources are `analysis/artifacts/`, live Prisma schema, the Step 7.0 contracts + Step 7.1 api-server + Step 7.2 routes, и the Step 6.5 Session/DayMetadata/Labels client API mirror referenced here.

### § 0.A Zero-state verification commands

Run these at executor launch and verify expected counts:

```bash
ls apps/platform/src/lib/api/endpoints/blocks.ts 2>/dev/null
# Expected: file does NOT exist. If exists, STOP and surface — Step 7.3 partially done earlier.

ls apps/platform/src/lib/hooks/use-blocks.ts 2>/dev/null
# Expected: file does NOT exist. If exists, STOP and surface.

grep -rln "createBlocksAPI" apps/platform/src/
# Expected: 0 hits. Step 7.3 IS the first client-API consumer of Step 7.2 routes.

grep -rln "useBlocks\|useCreateBlock\|useUpdateBlock\|useDeleteBlock\|useReorderBlocks\|useAssignBlockLabels" apps/platform/src/
# Expected: 0 hits.

grep -n "blocks:" apps/platform/src/lib/api/index.ts
# Expected: 0 hits (no `blocks:` factory entry in createApi).

grep -n "createBlocksAPI" apps/platform/src/lib/api/endpoints/index.ts
# Expected: 0 hits.

grep -n "use-blocks" apps/platform/src/lib/hooks/index.ts
# Expected: 0 hits.

grep -rln "training-plans.*blocks\|sessions.*blocks" apps/platform/src/lib/
# Expected: 0 hits. Block URLs live only on server side in apps/platform/src/app/api/... (shipped Step 7.2).
```

### § 0.B Domain-trace stops

Per `[[always-via-feature-skill]]` + `[[training-domain-workflow]]` + planner R1 ratification: this step is **client API + hooks layer ONLY**. If you find yourself tempted to:

- Add `useLabelSearch({level:"BLOCK"})` callsite anywhere — **STOP**, surface. Defers to Step 7.4 where BlockLabelSelect consumer arrives.
- Add new prop to `WeekGrid` / `DayRow` / `SessionList` / `SessionCard` — **STOP**, surface. No consumer in 7.3.
- Create new component file under `modules/plan-detail/` — **STOP**, surface. UI surface = Step 7.4.
- Add test file for hooks/API — **STOP**, surface. Per Step 6.5 OQ-B precedent, hook-only step skips tests.
- Modify any file outside `apps/platform/src/lib/{api,hooks}/` — **STOP**, surface.

### § 0.1 Canonical mirror — `createSessionsAPI` (`apps/platform/src/lib/api/endpoints/sessions.ts`, 43 LOC full)

Block API factory mirrors this 1:1 in style + structure (substitute Session → Block; drop `dayOfWeek/startDate` URL args since Block routes are sessionId-addressed for create+reorder and blockId-addressed for update+delete+labels; add 5th `assignLabels` method).

```ts
import { type ApiClient } from "@repo/api-client";
import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type {
  CreateSessionData,
  ReorderSessionsData,
  Session,
  UpdateSessionData,
} from "@repo/contracts/lms/session";

export const createSessionsAPI = (client: ApiClient) => ({
  create: (
    planId: string,
    startDate: string,
    dayOfWeek: DayOfWeek,
    data: CreateSessionData,
  ): Promise<Session> =>
    client.request(
      `/api/platform/training-plans/${planId}/weeks/${startDate}/days/${dayOfWeek}/sessions`,
      "POST",
      data,
    ),

  update: (planId: string, sessionId: string, data: UpdateSessionData): Promise<Session> =>
    client.request(`/api/platform/training-plans/${planId}/sessions/${sessionId}`, "PUT", data),

  delete: (planId: string, sessionId: string): Promise<void> =>
    client.requestNoContent(
      `/api/platform/training-plans/${planId}/sessions/${sessionId}`,
      "DELETE",
    ),

  reorder: (
    planId: string,
    startDate: string,
    dayOfWeek: DayOfWeek,
    data: ReorderSessionsData,
  ): Promise<{ sessions: Session[] }> =>
    client.request(
      `/api/platform/training-plans/${planId}/weeks/${startDate}/days/${dayOfWeek}/sessions/reorder`,
      "PUT",
      data,
    ),
});
```

### § 0.2 Canonical mirror — `useSessions` hooks (`apps/platform/src/lib/hooks/use-sessions.ts`, 50 LOC full)

Block hooks mirror this 1:1 (substitute Session → Block; add 5th `useAssignBlockLabels` via same `useWeekMutation` pattern). **TVars wrap convention** per planner R2 ratification (mirror `useUpdateSession` `{sessionId, data: UpdateSessionData}` shape): `useAssignBlockLabels` accepts `{blockId, data: AssignBlockLabelsData}`, NOT flat `{blockId, labelIds}`.

```ts
"use client";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type {
  CreateSessionData,
  ReorderSessionsData,
  Session,
  UpdateSessionData,
} from "@repo/contracts/lms/session";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useCreateSession = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<CreateSessionData, Session>({
    mutationFn: (data) => api.sessions.create(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Session created",
    errorMessage: "Failed to create session",
  });

export const useUpdateSession = (planId: string, startDate: string) =>
  useWeekMutation<{ sessionId: string; data: UpdateSessionData }, Session>({
    mutationFn: ({ sessionId, data }) => api.sessions.update(planId, sessionId, data),
    planId,
    startDate,
    successMessage: "Session updated",
    errorMessage: "Failed to update session",
  });

export const useDeleteSession = (planId: string, startDate: string) =>
  useWeekMutation<{ sessionId: string }, void>({
    mutationFn: ({ sessionId }) => api.sessions.delete(planId, sessionId),
    planId,
    startDate,
    successMessage: "Session deleted",
    errorMessage: "Failed to delete session",
  });

export const useReorderSessions = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<ReorderSessionsData, { sessions: Session[] }>({
    mutationFn: (data) => api.sessions.reorder(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Sessions reordered",
    errorMessage: "Failed to reorder sessions",
  });
```

### § 0.3 `useWeekMutation` helper (`apps/platform/src/lib/hooks/use-week-mutation.ts`, 40 LOC full)

Confirms cache invalidation target = `platformKeys.weeks.byDate(planId, startDate)` (full 7-day tree refresh). Error path = `notifyError(error, errorMessage)` per `@repo/query` (NOT `extractValidationMessage` — admin-v4 scope per memory). Success path = Sonner toast + queryClient invalidate. Block hooks consume this verbatim — no new helper needed.

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

### § 0.4 `platformKeys.weeks.byDate` (`apps/platform/src/lib/api/keys.ts`)

Confirms cache key shape for `useWeekMutation` invalidation. Block mutations all target the same week cache — Block lives inside Session inside Day inside Week, so invalidating week refetches full nested tree per `getWeekResponseSchema` (Step 6.2).

```ts
import type { AppLevelValue } from "@repo/contracts/lms/label";
import { createEntityKeys } from "@repo/query";

const ROOT = ["platform"] as const;

export const platformKeys = {
  root: ROOT,

  trainingPlans: createEntityKeys(ROOT, "training-plans"),
  users: {
    search: (query: string) => [...ROOT, "users", "search", query] as const,
  },
  athletes: createEntityKeys(ROOT, "athletes"),
  coachDashboard: {
    data: () => [...ROOT, "coach-dashboard"] as const,
  },
  coachActionItems: {
    all: () => [...ROOT, "coach-action-items"] as const,
  },
  weeks: {
    byDate: (planId: string, startDate: string) =>
      [...ROOT, "training-plans", planId, "weeks", startDate] as const,
  },
  labels: {
    search: (level?: AppLevelValue, q?: string) =>
      [...ROOT, "labels", "search", level ?? null, q ?? null] as const,
  },
} as const;
```

### § 0.5 Current `apps/platform/src/lib/api/index.ts` (19 LOC full — insertion point)

```ts
import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
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

**Insertion**: add `blocks: endpoints.createBlocksAPI(client),` **as the first key** (alphabetic: `blocks` < `coachAthletes`). Note: existing order has `coachAthletes` before `coachActionItems` (NOT strict alpha within `coach*` family — historical artifact from Step 6.5). Do **NOT** "fix" this; preserve historical ordering. Just insert `blocks:` at the top.

Expected final state:

```ts
export const createApi = (client: ApiClient) => ({
  blocks: endpoints.createBlocksAPI(client),
  coachAthletes: endpoints.createCoachAthletesAPI(client),
  coachActionItems: endpoints.createCoachActionItemsAPI(client),
  // ... rest unchanged
});
```

### § 0.6 Current `apps/platform/src/lib/api/endpoints/index.ts` (10 LOC full — insertion point)

```ts
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

**Insertion**: add `export { createBlocksAPI } from "./blocks";` **as the first line** (alphabetic). Preserve `createCoachAthletesAPI` before `createCoachActionItemsAPI` (mirrors `api/index.ts` § 0.5 historical ordering).

Expected final state:

```ts
export { createBlocksAPI } from "./blocks";
export { createCoachAthletesAPI } from "./coach-athletes";
// ... rest unchanged
```

### § 0.7 Current `apps/platform/src/lib/hooks/index.ts` (13 LOC full — insertion point)

```ts
export * from "./use-blur-commit";
export * from "./use-coach-athletes";
export * from "./use-current-user-role";
export * from "./use-coach-action-items";
export * from "./use-coach-dashboard";
export * from "./use-coach-invite";
export * from "./use-day-metadata";
export * from "./use-label-search";
export * from "./use-sessions";
export * from "./use-training-plans";
export * from "./use-users";
export * from "./use-week-mutation";
export * from "./use-weeks";
```

**Insertion**: add `export * from "./use-blocks";` between line 1 (`use-blur-commit`) and line 2 (`use-coach-athletes`) — alphabetic position. Preserve all other ordering (including `use-current-user-role` between `use-coach-athletes` and `use-coach-action-items` — historical non-alpha artifact, do NOT "fix").

Expected final state (lines 1-3):

```ts
export * from "./use-blur-commit";
export * from "./use-blocks";
export * from "./use-coach-athletes";
// ... rest unchanged
```

Wait — `use-blocks` < `use-blur-commit` alphabetically (`bl` matches, then `o` < `u`). Insert at line 1 (top).

Expected final state corrected:

```ts
export * from "./use-blocks";
export * from "./use-blur-commit";
export * from "./use-coach-athletes";
// ... rest unchanged
```

### § 0.8 Block route handler URLs (shipped Step 7.2, verbatim from `apps/platform/src/app/api/platform/training-plans/...`)

Five HTTP endpoints — confirms exact URL paths for API method `client.request(...)` fetcher strings:

| Method   | URL                                                                         | Source file                                        |
| -------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| `POST`   | `/api/platform/training-plans/{planId}/sessions/{sessionId}/blocks`         | `.../sessions/[sessionId]/blocks/route.ts`         |
| `PUT`    | `/api/platform/training-plans/{planId}/sessions/{sessionId}/blocks/reorder` | `.../sessions/[sessionId]/blocks/reorder/route.ts` |
| `PUT`    | `/api/platform/training-plans/{planId}/blocks/{blockId}`                    | `.../blocks/[blockId]/route.ts` (PUT export)       |
| `DELETE` | `/api/platform/training-plans/{planId}/blocks/{blockId}`                    | `.../blocks/[blockId]/route.ts` (DELETE export)    |
| `PUT`    | `/api/platform/training-plans/{planId}/blocks/{blockId}/labels`             | `.../blocks/[blockId]/labels/route.ts`             |

**Critical**: Block API URLs are **flatter than Session API**. Session create/reorder embed `weeks/{startDate}/days/{dayOfWeek}/` in URL (`startDate` + `dayOfWeek` are URL params). Block create/reorder are addressed via **`sessionId` only** — `sessionByDayParamsSchema` upstream chain handles full validation. **API client methods do NOT need `startDate` or `dayOfWeek` args**. Only `planId` + `sessionId` (for create/reorder) or `planId` + `blockId` (for update/delete/labels).

**Verbatim verification** (4 route files):

```ts
// apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/blocks/route.ts (22 LOC full)
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

```ts
// apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/blocks/reorder/route.ts (22 LOC)
// PUT — wraps lmsBlockApi.reorder Block[] return via .then((blocks) => ({ blocks })) for reorderBlocksResponseSchema wrap shape

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

```ts
// apps/platform/src/app/api/platform/training-plans/[planId]/blocks/[blockId]/route.ts (multiplexed PUT + DELETE, ~36 LOC)
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

```ts
// apps/platform/src/app/api/platform/training-plans/[planId]/blocks/[blockId]/labels/route.ts (21 LOC)
export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { blockId }, data) => lmsBlockApi.assignLabels(userId, blockId, data),
      blockByIdParamsSchema,
      assignBlockLabelsRequestSchema,
      assignBlockLabelsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
```

### § 0.9 Block contract types (`packages/contracts/src/entities/lms/block/block.types.ts` + `block-api.types.ts`)

Confirms type imports for API method signatures + hook TVars/TResult parameters:

```ts
// packages/contracts/src/entities/lms/block/block.types.ts
export type Block = z.infer<typeof blockSchema>;
export type CreateBlockData = z.infer<typeof createBlockSchema>;
export type UpdateBlockData = z.infer<typeof updateBlockSchema>;
export type ReorderBlocksData = z.infer<typeof reorderBlocksSchema>;
export type AssignBlockLabelsData = z.infer<typeof assignBlockLabelsSchema>;
```

Response wrappers (from `block-api.types.ts`):

- `CreateBlockResponse = z.infer<typeof createBlockResponseSchema>` = `Block`
- `UpdateBlockResponse = z.infer<typeof updateBlockResponseSchema>` = `Block`
- `ReorderBlocksResponse = z.infer<typeof reorderBlocksResponseSchema>` = `{ blocks: Block[] }`
- `AssignBlockLabelsResponse = z.infer<typeof assignBlockLabelsResponseSchema>` = `Block`

API methods return raw types (not response wrappers — wrap object only flows through HTTP layer, client unwraps via `client.request<T>` typing). Hook `TResult` = same raw type:

- `create` → `Block`
- `update` → `Block`
- `delete` → `void`
- `reorder` → `{ blocks: Block[] }` (wrap preserved; hook returns wrap object)
- `assignLabels` → `Block`

All Block contract types reachable via single barrel: `from "@repo/contracts/lms/block"`. Do **NOT** deep-import (`@repo/contracts/lms/block/block.types`). Use barrel.

### § 0.10 `useDayMetadata` alternative mirror (`apps/platform/src/lib/hooks/use-day-metadata.ts`, 27 LOC full)

Demonstrates `useWeekMutation` pattern for hooks where `TResult = entity-typed` (matching `useUpdateBlock`'s `Block` return). Both hooks here receive `(planId, startDate, dayOfWeek)` signature → return `useWeekMutation<UpdateXData, DaySlot>`. Block analog: `(planId, startDate)` + TVars wrap for `blockId`.

```ts
"use client";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { DaySlot, UpdateDayLabelData, UpdateDayNotesData } from "@repo/contracts/lms/day";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useUpdateDayLabel = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<UpdateDayLabelData, DaySlot>({
    mutationFn: (data) => api.dayMetadata.setLabel(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Day label saved",
    errorMessage: "Failed to save day label",
  });

export const useUpdateDayNotes = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<UpdateDayNotesData, DaySlot>({
    mutationFn: (data) => api.dayMetadata.setNotes(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Day notes saved",
    errorMessage: "Failed to save day notes",
  });
```

---

## § 1. Goal

Ship the platform client-side slice for Block — `createBlocksAPI` factory + 5 mutation hooks (`useCreateBlock` / `useUpdateBlock` / `useDeleteBlock` / `useReorderBlocks` / `useAssignBlockLabels`) consuming Step 7.2 HTTP routes via `useWeekMutation` helper. Pure additive consumer layer; mirrors Step 6.5 Session/DayMetadata/Labels client API + hooks pattern verbatim. Sets up Step 7.4 UI consumers (BlockList + BlockCard + BlockLabelSelect + AddBlockButton); Step 7.4 also lands the `useLabelSearch({level:"BLOCK"})` 3rd callsite + React Context refactor for label preload.

## § 2. Scope checklist (per-file)

**NEW** (2 files):

1. `apps/platform/src/lib/api/endpoints/blocks.ts` — `createBlocksAPI(client)` factory with 5 methods (`create` / `update` / `delete` / `reorder` / `assignLabels`). Mirror `createSessionsAPI` shape per § 0.1. ~50-60 LOC.
2. `apps/platform/src/lib/hooks/use-blocks.ts` — 5 mutation hooks via `useWeekMutation`. Mirror `useSessions` shape per § 0.2 + add 5th `useAssignBlockLabels`. ~60-70 LOC.

**EDIT** (3 barrel files):

3. `apps/platform/src/lib/api/endpoints/index.ts` — `+1 export` for `createBlocksAPI` at line 1 (alphabetic first; see § 0.6).
4. `apps/platform/src/lib/api/index.ts` — `+1 entry` `blocks: endpoints.createBlocksAPI(client),` at first position in `createApi()` factory (alphabetic; see § 0.5).
5. `apps/platform/src/lib/hooks/index.ts` — `+1 export` `export * from "./use-blocks";` at line 1 (alphabetic first; `use-blocks` < `use-blur-commit`; see § 0.7).

**NO** (forbidden surfaces):

- `packages/contracts/` — no contract changes (Step 7.0 shipped).
- `packages/api-server/` — no server changes (Step 7.1 shipped).
- `packages/api-routes/` or `apps/platform/src/app/api/` — no route changes (Step 7.2 shipped).
- `apps/platform/src/modules/plan-detail/` — **NO PlanDetailView edit, NO WeekGrid/DayRow/SessionList/SessionCard prop additions** per R1. Step 7.4 surface.
- Any test files — per Step 6.5 OQ-B precedent (hook-only step skips test additions). Indirect coverage via Step 7.1 api-server integration tests already shipped.
- Any new component file under `modules/` — Step 7.4 scope.

## § 3. Phases

### Phase 1 — Block API factory + 2 barrel edits (1 atomic commit)

**Files**: 3 (1 new + 2 edits) — all interdependent (`api/index.ts` references `endpoints.createBlocksAPI` which is exported by `endpoints/index.ts` which imports from `./blocks`). Atomic commit avoids broken intermediate tree (`check-types` would fail if any one missing).

**Write `apps/platform/src/lib/api/endpoints/blocks.ts`** (full file, ~58 LOC):

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

**Notes on shape vs `createSessionsAPI` (§ 0.1)**:

- No `DayOfWeek` import — Block URLs don't carry `dayOfWeek`.
- No `startDate` param — Block URLs are id-addressed (sessionId for create/reorder; blockId for update/delete/labels).
- `assignLabels` = 5th method (no Session analog).
- `delete` uses `client.requestNoContent` per Session precedent (204 No Content response, no JSON body).
- All other methods use `client.request<T>` returning typed Promise.

**Edit `apps/platform/src/lib/api/endpoints/index.ts`** — prepend line:

```ts
export { createBlocksAPI } from "./blocks";
```

Final file (11 LOC):

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

**Edit `apps/platform/src/lib/api/index.ts`** — add `blocks:` entry as first key in `createApi()`:

```ts
export const createApi = (client: ApiClient) => ({
  blocks: endpoints.createBlocksAPI(client),
  coachAthletes: endpoints.createCoachAthletesAPI(client),
  // ... rest unchanged
});
```

Final file (20 LOC):

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

**Verification before commit**:

- `pnpm --filter platform check-types` (per-package faster than full turbo).
- Expected: green. No callsites yet for `api.blocks.*` — pure additive, doesn't break existing imports.

**Commit subject**: `feat(platform): add http client api factory for block crud reorder and assignlabels` (78 chars, lowercase, ≤80 char rule).

**Commit body** (optional, brief — per Step 6.5 / 7.2 precedent):

```
- blocks.ts factory with 5 methods (create/update/delete/reorder/assignLabels)
- mirror createSessionsAPI structure; id-addressed urls (no startDate/dayOfWeek)
- register createBlocksAPI in endpoints + api factory barrels (alphabetic first)
```

### Phase 2 — Block hooks + 1 barrel edit (1 atomic commit)

**Files**: 2 (1 new + 1 edit) — interdependent (`hooks/index.ts` exports `./use-blocks`; `use-blocks.ts` imports `api` which already has `.blocks` from Phase 1 commit).

**Write `apps/platform/src/lib/hooks/use-blocks.ts`** (full file, ~68 LOC):

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

**Notes on shape vs `useSessions` (§ 0.2)**:

- No `DayOfWeek` import — Block hooks don't drive `dayOfWeek` URL component.
- `useCreateBlock` + `useReorderBlocks` accept `sessionId` as 3rd arg (not `dayOfWeek`); `startDate` flows only for invalidation.
- `useUpdateBlock` / `useDeleteBlock` / `useAssignBlockLabels` accept `(planId, startDate)` only; `blockId` flows via TVars.
- `useAssignBlockLabels` TVars wrap = `{blockId, data: AssignBlockLabelsData}` per R2 ratification (mirror `useUpdateSession` `{sessionId, data}` shape — NOT flat `{blockId, labelIds}`).
- All 5 hooks use `useWeekMutation<TVars, TResult>` helper — invalidates `platformKeys.weeks.byDate(planId, startDate)` cache (full 7-day tree refresh per `getWeekResponseSchema`).
- Success message strings: "Block created" / "Block updated" / "Block deleted" / "Blocks reordered" / "Block labels saved" (mirror Session phrasing).
- Error message strings: "Failed to create block" / "Failed to update block" / "Failed to delete block" / "Failed to reorder blocks" / "Failed to save block labels".

**Edit `apps/platform/src/lib/hooks/index.ts`** — prepend line:

```ts
export * from "./use-blocks";
```

Final file (14 LOC):

```ts
export * from "./use-blocks";
export * from "./use-blur-commit";
export * from "./use-coach-athletes";
export * from "./use-current-user-role";
export * from "./use-coach-action-items";
export * from "./use-coach-dashboard";
export * from "./use-coach-invite";
export * from "./use-day-metadata";
export * from "./use-label-search";
export * from "./use-sessions";
export * from "./use-training-plans";
export * from "./use-users";
export * from "./use-week-mutation";
export * from "./use-weeks";
```

**Verification before commit**:

- `pnpm --filter platform check-types` — green.

**Commit subject**: `feat(platform): add block hooks via useweekmutation helper` (60 chars, lowercase).

**Commit body** (optional):

```
- 5 mutation hooks (useCreateBlock/useUpdateBlock/useDeleteBlock/useReorderBlocks/useAssignBlockLabels)
- all via useWeekMutation; invalidates weeks.byDate cache (full 7-day tree refetch)
- TVars wrap follows useUpdateSession pattern: {blockId, data} not flat {blockId, labelIds}
- register use-blocks in hooks barrel (alphabetic first)
```

### Phase 3 — Verification gates (no commit)

Run from repo root after both code commits:

```bash
pnpm check-types
# Expected: 16/16 packages. Block typing flows: contract → blocks.ts → use-blocks.ts. No callsite yet, so just compilation check.

pnpm lint
# Expected: 16/16. Standard eslint --fix on touched files; 0 warnings.

pnpm test
# Expected: ≥1068 / ≥1068 (Step 7.2 baseline). Zero test deltas — no new test files; no test changes; baseline preserved.

pnpm dep:check
# Expected: 0 violations / 1175 modules (+2 from Step 7.2 baseline 1173 — exact match for 2 new files: blocks.ts + use-blocks.ts).
```

If `pnpm test` count diverges from baseline (±1 due to counting noise per Step 6.6 reconcile note is acceptable; larger divergence STOP-and-surface). If `dep:check` module count ≠ 1175 ±0 — STOP-and-surface (expected exact match for 2 new files).

## § 4. Out of scope (DO NOT)

Hard "do not touch" list — surface via `AskUserQuestion` if any of these surface as needed:

1. **PlanDetailView** (`apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx`) — no edits. Currently has 2 `useLabelSearch` calls (DAY + SESSION). The 3rd for BLOCK is **Step 7.4 scope**, NOT Step 7.3. Don't add it here even "for preload"; consumer (`BlockLabelSelect`) doesn't exist yet — would create dead-code prop drilling for 1 step.
2. **WeekGrid / DayRow / SessionList / SessionCard** — no new props. Step 7.4 will add `blockLabelOptions` + `blockLabelOptionsLoading` (or refactor to React Context per Step 6.6/6.7 deferred trigger). Step 7.3 doesn't drill anything.
3. **New components** under `apps/platform/src/modules/plan-detail/components/` — none. `BlockList` / `BlockCard` / `AddBlockButton` / `BlockLabelSelect` / `BlockNotesField` all = Step 7.4.
4. **Test files** — no `use-blocks.test.ts` / `blocks.test.ts`. Per Step 6.5 OQ-B precedent (hook-only step). Indirect coverage via Step 7.1's 29 integration tests (api-server side) already shipped.
5. **Contracts** — no edits to `packages/contracts/`. Step 7.0 shipped all needed types.
6. **api-server** — no edits to `packages/api-server/`. Step 7.1 shipped lmsBlockApi + verifyBlockOwnership + mapToBlock.
7. **api-routes** — no edits to `packages/api-routes/`. Step 7.2 shipped handlePrismaError ZodError defence.
8. **Server-side route handlers** — no edits to `apps/platform/src/app/api/`. Step 7.2 shipped 4 Block routes.
9. **Symbol rename** `cms{Label,Exercise}AdminApi` → `lms*` — Step 6.1.5 deferred, out of scope.
10. **README** updates — out of scope (Step 8.0 contract-touching step is natural place per Step 7.0 deferred note).

## § 5. Acceptance criteria (executor self-checks)

Numbered list — verify all before declaring Phase 3 done:

1. **Files created exactly per § 2**: `apps/platform/src/lib/api/endpoints/blocks.ts` (1 file) + `apps/platform/src/lib/hooks/use-blocks.ts` (1 file). No other new files.
2. **Files edited exactly per § 2**: `endpoints/index.ts` (+1 line), `api/index.ts` (+1 line), `hooks/index.ts` (+1 line). No other edits.
3. **`blocks.ts` has exactly 5 methods**: `create` / `update` / `delete` / `reorder` / `assignLabels` (alphabetic in object literal NOT required; mirror Session ordering: create/update/delete/reorder then add assignLabels at end).
4. **`use-blocks.ts` has exactly 5 hooks**: `useCreateBlock` / `useUpdateBlock` / `useDeleteBlock` / `useReorderBlocks` / `useAssignBlockLabels`. All via `useWeekMutation`.
5. **`useAssignBlockLabels` TVars** = `{blockId: string; data: AssignBlockLabelsData}` (wrapped, NOT flat `{blockId, labelIds}`). Per R2 ratification.
6. **No `DayOfWeek` import** in `blocks.ts` (Session has it; Block doesn't — URLs flatter).
7. **`pnpm check-types`** 16/16 packages green (cached + new).
8. **`pnpm lint`** 16/16 packages green; 0 warnings.
9. **`pnpm test`** ≥ 1068 (Step 7.2 baseline preserved; ±1 counting noise acceptable). Zero test file deltas via `git diff main..HEAD -- '**/*.test.*'`.
10. **`pnpm dep:check`** 0 violations / 1175 modules exact (+2 from 1173 baseline; 2 new files).
11. **`grep -rln "@repo/contracts/lms/block" apps/platform/src/lib/`** returns ≥ 2 hits (`blocks.ts` + `use-blocks.ts`). Before this step = 0 hits.
12. **`grep "blocks:" apps/platform/src/lib/api/index.ts`** = 1 hit (line with `blocks: endpoints.createBlocksAPI(client),`).
13. **`grep "createBlocksAPI" apps/platform/src/lib/api/endpoints/index.ts`** = 1 hit (line 1).
14. **`grep "use-blocks" apps/platform/src/lib/hooks/index.ts`** = 1 hit (line 1).
15. **No code comments** in `blocks.ts` or `use-blocks.ts` (per CLAUDE.md + manifesto).
16. **No `as any` / `as unknown` / `!` non-null assertions** in either new file (per `[[type-quality]]`).
17. **Per-phase atomic commits**: 2 code commits + 0 extra commits in this step (docs commit handled by planner post-execution). Branch HEAD = `feat/training-domain`.
18. **Husky pre-commit + commit-msg clean** for both commits without `--no-verify` / `--no-edit` / `--no-gpg-sign`.
19. **Subject lines ≤ 80 chars, fully lowercase, no acronyms** (verified by `commitlint`).
20. **Zero foreign refs in `git log feat/training-domain ^main --oneline`** — only Step 7.3 commits expected (2 code + 0 docs from executor).

## § 6. Anti-patterns (DO NOT)

Per CLAUDE.md + manifesto + memory rules:

- **No optimistic updates** — invalidate-only per Step 6.5 OQ-D ratification. `useWeekMutation` does NOT set `onMutate` / `onSettled` / rollback handlers. UX flicker tolerated; revisit if user reports issue.
- **No `extractValidationMessage`** — admin-v4-scoped memory entry. This repo uses direct `notifyError(error, errorMessage)` per `@repo/query` (built into `useWeekMutation`).
- **No `as any` / `as unknown` / non-null `!` assertions** — per `[[type-quality]]` zero tolerance. If TS complains, fix the source typing (likely contract import).
- **No code comments** — per CLAUDE.md global preferences. Self-documenting code only.
- **No Co-Authored-By / Generated-with trailers** — per CLAUDE.md global preferences.
- **No `--no-verify` / `--no-edit` / `--no-gpg-sign`** — if pre-commit / commit-msg fails, fix the root cause (commitlint subject ≤100 chars lowercase; Cyrillic blocked via check-en-only.sh).
- **No `useAssignBlockLabels({blockId, labelIds})` flat shape** — must wrap as `{blockId, data: AssignBlockLabelsData}` per R2.
- **No `useLabelSearch({level:"BLOCK"})` callsite** — Step 7.4 scope per R1.
- **No new props on WeekGrid/DayRow/SessionList/SessionCard** — Step 7.4 scope.
- **No deep-import** from `@repo/contracts/lms/block/block.types` — use barrel `@repo/contracts/lms/block`.
- **No new `useState` / `useEffect`** in hooks — `useWeekMutation` is the only React primitive needed; trust TanStack Query's built-in state.
- **No symbol rename** of `cms{Label,Exercise}AdminApi` — Step 6.1.5 deferred carry-forward, out of scope.
- **No test file additions** — per Step 6.5 OQ-B precedent.

## § 7. Commit strategy (verified against husky + turbo)

**Hook config verified**:

- `.husky/pre-commit` = `node scripts/check-secrets.mjs` + `npx lint-staged` + `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"`
- `.husky/pre-push` = `pnpm dep:check` + `SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"`
- `.husky/commit-msg` = `npx --no -- commitlint --edit $1`
- `turbo.json` — standard tasks; no test in pre-commit (test cache: false, dev cache: false).

**Husky implication**: pre-commit runs `check-types` on touched packages + their dependents (`...[HEAD]`). For Step 7.3:

- Phase 1 commit (blocks.ts + 2 barrel edits): touches `apps/platform/` only. `check-types` runs `platform` package → must pass (Block factory wired into api).
- Phase 2 commit (use-blocks.ts + hooks/index.ts): touches `apps/platform/` only. `check-types` runs `platform` → must pass (hooks consume already-wired api.blocks).

**Cross-package squash NOT required** per `[[husky-cross-package-squash]]`:

- Single-package scope (`apps/platform/` only). No cross-package consumer breaks possible.
- All additions atomic-within-phase: Phase 1 has 3 interdependent files but they're all in `apps/platform/src/lib/api/`; Phase 2 has 2 interdependent files in `apps/platform/src/lib/hooks/`.
- Phase 1 commit alone: no broken tree (`api.blocks` is defined; no caller yet — pure additive).
- Phase 2 commit alone: no broken tree (`hooks/use-blocks.ts` consumes `api.blocks` which exists from Phase 1).

**Final strategy**: **per-phase atomic** (2 code commits) + 0 docs commits from executor.

| #   | Subject                                                                               | Files                                             | LOC | Notes           |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------- | --- | --------------- |
| 1   | `feat(platform): add http client api factory for block crud reorder and assignlabels` | 3 (blocks.ts + endpoints/index.ts + api/index.ts) | ~62 | Phase 1 atomic. |
| 2   | `feat(platform): add block hooks via useweekmutation helper`                          | 2 (use-blocks.ts + hooks/index.ts)                | ~70 | Phase 2 atomic. |

Commit subject line constraints (commitlint enforced):

- Format: `<type>(<scope>): <subject>` per conventional-commits.
- Subject ≤ 100 chars (commitlint default; project convention ≤ 80 for clarity).
- Fully lowercase including acronyms (`lms` not `LMS`, `http` not `HTTP`).
- Body line length ≤ 150 chars.
- Cyrillic blocked via `check-en-only.sh` — body strictly English.

Commit body convention (optional): brief bullet list of WHAT (not WHY — WHY in step output report). 2-4 bullets max; no over-explanation. Mirror Step 7.2 / 7.0 commit body brevity.

## § 8. Execution mode

**`/feature small` pipeline** invoked at executor session start. Stage 0 will attempt to cut a feature branch from main; **STOP and surface** the planner override (this step lives on `feat/training-domain`).

Stage flow (per `/feature small` definition):

1. Stage 0 (branch-cut) — **override per § Execution mode header**; stay on `feat/training-domain`.
2. Stage 1 (research) — read § 0 verbatim quotes; verify zero-state; load Block contract types + Step 7.2 route URLs into mental model.
3. Stage 2 (design) — implicit; thesis-time done by planner.
4. Stage 3 (plan) — derive from § 3 phases; no additional planning needed.
5. Stage 4 (build) — implement Phase 1 + Phase 2 per § 3; commit per § 7.
6. Stage 5 (review) — independent reviewer pass on shipped code; address findings inline or escalate per § 0.
7. Stage 6 (QA) — N/A for `/feature small` thin-wrapper (hook-only scope; api/server-side QA done Steps 7.1/7.2).
8. Stage 7 (output) — write `implementation/step-07.3/output.md` per WORKFLOW.md § "`output.md` format".

**Branch invariants** (verify before final hand-off):

- Current branch = `feat/training-domain`. NOT `feat/<slug>`. NOT detached HEAD.
- `git log feat/training-domain ^main --oneline` shows only Step 7.3 commits (2 code + 0 docs); no foreign refs.
- Working tree clean (`git status` returns "nothing to commit, working tree clean").
- All commits husky-clean (no `--no-verify` / `--no-edit` / `--no-gpg-sign`).

## § 9. Output report

After Phase 3 verification green, write `implementation/step-07.3/output.md` per WORKFLOW.md § "`output.md` format":

Sections (Russian prose where natural, English for code/paths):

- `## Что сделано` — 3-5 line summary
- `## Изменённые/созданные файлы` — file list with LOC delta
- `## Принятые решения` — D-1, D-2, ... numbered list of any decisions made (e.g., commit body wording, lint-staged auto-format)
- `## Возникшие вопросы и как решены` — OQ list (expected: none; if any, link to `AskUserQuestion` exchange)
- `## Что отложено` — carry-forwards (expected: 0 new from this step; pre-existing 5 from Step 7.2 unchanged)
- `` ## Ссылка на `.feature-dev/<ts>/` `` — feature-dev artifacts directory
- `## Verification notes` — `pnpm` outputs + grep regression checks per § 5
- `## Acceptance criteria self-check` — numbered against § 5 list (20 items)

No `## Сценарий смоук-теста` section — Step 7.3 has no UI surface (hook-only). Smoke resumes Step 7.4 (BlockList UI).

---

## End of prompt

Planner reads `output.md` + `.feature-dev/<ts>/` artifacts post-execution; closes step via PLANNING_STATE.md + IMPLEMENTATION_LOG.md updates + `docs(step-07.3): write executor output report` commit (adds both `prompt.md` + `output.md` per convention).

Next step in queue: **Step 7.4** — UI BlockList + BlockCard + AddBlockButton + BlockLabelSelect + React Context refactor for label preload (5-level prop drilling materializes per Step 6.6/6.7 deferred trigger). `/feature` full pipeline.
