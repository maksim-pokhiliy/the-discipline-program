# Step 6.5 — Platform client API + hooks for Sessions / DayMetadata / Labels

> Self-contained prompt for a fresh Opus 4.7 max-effort executor session. Recommended: run **directly via prompt brief** (no `/feature` wrapper). Reasoning per Step 6.4.5 D-1 — this prompt is already a complete brief: § 0 verbatim quotes = research-equivalent, § 1-2 goal/context, § 3 per-phase plan, § 5 acceptance, § 7 commit strategy, § 9 output format. Wrapping in `/feature` would re-derive the same brief and try to cut `feat/<slug>` from main, violating long-lived `feat/training-domain` convention per `[[training-domain-workflow]]`. **If you choose `/feature small` anyway** — the per-phase plan still applies; ignore branch-cutting.

## § 0 — Hard triggers (STOP-and-surface to planner BEFORE writing code)

Surface via `AskUserQuestion` if any verbatim quote diverges from the actual file state. All quotes captured at planner-write-time (2026-05-16 HEAD `08b4c71f`).

### 0.1 — Client API endpoint precedent (`weeks.ts` — closest read+mutation analog)

**`apps/platform/src/lib/api/endpoints/weeks.ts` (verbatim, lines 1-10):**

```ts
import { type ApiClient } from "@repo/api-client";
import type { GetWeekResponse, UpdateWeekNotesData, Week } from "@repo/contracts/lms/week";

export const createWeeksAPI = (client: ApiClient) => ({
  getByDate: (planId: string, startDate: string): Promise<GetWeekResponse> =>
    client.request(`/api/platform/training-plans/${planId}/weeks/${startDate}`),

  updateNotes: (planId: string, startDate: string, data: UpdateWeekNotesData): Promise<Week> =>
    client.request(`/api/platform/training-plans/${planId}/weeks/${startDate}`, "PUT", data),
});
```

**Pattern**: factory `createXAPI(client: ApiClient) => ({ method, ... })`. Each method:

- GET typed: `client.request<T>(url)` — TypeScript infers from `Promise<T>` return annotation.
- POST/PUT with body: `client.request<T>(url, "PUT"|"POST", data)`.
- DELETE 204: `client.requestNoContent(url, "DELETE")`.

### 0.2 — Search endpoint precedent (`users.ts` + `use-users.ts` — query-params handling)

**`apps/platform/src/lib/api/endpoints/users.ts` (verbatim, lines 1-7):**

```ts
import { type ApiClient } from "@repo/api-client";
import type { UserSearchResult } from "@repo/contracts/iam/user";

export const createUsersAPI = (client: ApiClient) => ({
  search: (query: string): Promise<UserSearchResult[]> =>
    client.request("/api/platform/users/search", "GET", undefined, { q: query }),
});
```

**Note**: query params passed as 4th positional arg `Record<string, string>` to `client.request`; framework builds `?q=...` URL suffix via `URLSearchParams` in `prepareRequest:117-123`. Body is `undefined` for GET.

**`apps/platform/src/lib/hooks/use-users.ts` (verbatim, lines 1-13):**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useSearchUsers = (query: string, enabled = true) =>
  useQuery({
    queryKey: platformKeys.users.search(query),
    queryFn: () => api.users.search(query),
    enabled,
  });
```

**Pattern**: useQuery + positional `enabled = true` default. **Mirror exactly for `useLabelSearch`** (adapt args + key).

### 0.3 — Hook precedent (`use-weeks.ts` — mutation + invalidate week)

**`apps/platform/src/lib/hooks/use-weeks.ts` (verbatim, lines 1-35):**

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { UpdateWeekNotesData } from "@repo/contracts/lms/week";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useWeek = (planId: string, startDate: string) =>
  useQuery({
    queryKey: platformKeys.weeks.byDate(planId, startDate),
    queryFn: () => api.weeks.getByDate(planId, startDate),
    enabled: !!planId && !!startDate,
  });

export const useUpdateWeekNotes = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ startDate, data }: { startDate: string; data: UpdateWeekNotesData }) =>
      api.weeks.updateNotes(planId, startDate, data),
    onSuccess: (_week, { startDate }) => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.weeks.byDate(planId, startDate),
      });
      toast.success("Week notes saved");
    },
    onError: (error: Error) => {
      notifyError(error, "Failed to save week notes");
    },
  });
};
```

**Pattern bits**:

- `"use client";` directive at top.
- `useMutation` returns hook; consumer calls `.mutate(vars)` / `.mutateAsync(vars)`.
- `onSuccess` invalidates affected query keys via `queryClient.invalidateQueries({ queryKey })`.
- `onError` routes through `notifyError(error, fallbackMessage)` from `@repo/query`.
- Success toast via `sonner`.
- mutationFn signature uses object-destructured `{ startDate, data }` for >1 arg.

### 0.4 — Idempotency-Key auto-generation (NO hook-side opt-in needed)

**`packages/api-client/src/client.ts:33,111-113` (verbatim):**

```ts
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
// ... inside prepareRequest:
if (!IDEMPOTENT_METHODS.has(method)) {
  headers["Idempotency-Key"] = options?.idempotencyKey ?? crypto.randomUUID();
}
```

**Translates to**: every `client.request(url, "POST"|"PUT"|"PATCH"|"DELETE", ...)` auto-injects `Idempotency-Key: <random uuid>` header. Server's `wrapAuthHandler(JSON_CONFIG)` dedups via `app_request_idempotency` table (24h TTL). **Step 6.5 hooks pass no key explicitly**; framework default sufficient for coach UX (double-click protection, network retry safety).

### 0.5 — Query keys central registry (`keys.ts` — foundational Phase 1 edit target)

**`apps/platform/src/lib/api/keys.ts` (verbatim, lines 1-23):**

```ts
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
} as const;
```

**Intent (additive — new `labels` namespace, alphabetical insertion before `trainingPlans`):**

```ts
  labels: {
    search: (level?: AppLevelValue, q?: string) =>
      [...ROOT, "labels", "search", level ?? null, q ?? null] as const,
  },
```

Position: alphabetical insertion between `coachActionItems` (line 16) and `trainingPlans` (line 8 — wait, alphabetical actually goes `coachActionItems → coachDashboard → labels → trainingPlans`? Check current ordering — it's **not strictly alphabetical** today: trainingPlans/users/athletes/coachDashboard/coachActionItems/weeks). **Decision: append `labels` between `coachActionItems` and `weeks`** to keep "lms-domain" entries (`weeks`, `labels`) adjacent. If executor reads the file and sees a different order — pick the insertion point that minimizes diff while keeping `labels` next to `weeks` (both lms entities).

Import addition at line 2 area: `import type { AppLevelValue } from "@repo/contracts/lms/label";` (type-only import).

### 0.6 — Barrel files (Phase 3 edit targets)

**`apps/platform/src/lib/api/endpoints/index.ts` (verbatim, lines 1-7):**

```ts
export { createCoachAthletesAPI } from "./coach-athletes";
export { createCoachActionItemsAPI } from "./coach-action-items";
export { createCoachDashboardAPI } from "./coach-dashboard";
export { createCoachInviteAPI } from "./coach-invite";
export { createTrainingPlansAPI } from "./training-plans";
export { createUsersAPI } from "./users";
export { createWeeksAPI } from "./weeks";
```

**Intent (3 new exports, alphabetical):** insert `createDayMetadataAPI`, `createLabelsAPI`, `createSessionsAPI` at the right positions. Final state:

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

**`apps/platform/src/lib/api/index.ts` (verbatim, lines 1-17 — Phase 2 explicit edit target):**

```ts
import { type ApiClient } from "@repo/api-client";

import { browserApiClient } from "./client";
import * as endpoints from "./endpoints";

export const createApi = (client: ApiClient) => ({
  coachAthletes: endpoints.createCoachAthletesAPI(client),
  coachActionItems: endpoints.createCoachActionItemsAPI(client),
  coachDashboard: endpoints.createCoachDashboardAPI(client),
  coachInvite: endpoints.createCoachInviteAPI(client),
  trainingPlans: endpoints.createTrainingPlansAPI(client),
  users: endpoints.createUsersAPI(client),
  weeks: endpoints.createWeeksAPI(client),
});

export const api = createApi(browserApiClient);
```

**Intent (additive — 3 new entries in `createApi` object, alphabetical insertion):**

```ts
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
```

**This edit is NOT optional** — without it, `api.sessions` / `api.dayMetadata` / `api.labels` are undefined at runtime (TypeScript will fail on the hook-side calls).

**`apps/platform/src/lib/hooks/index.ts` (verbatim, lines 1-8):**

```ts
export * from "./use-coach-athletes";
export * from "./use-current-user-role";
export * from "./use-coach-action-items";
export * from "./use-coach-invite";
export * from "./use-coach-dashboard";
export * from "./use-training-plans";
export * from "./use-users";
export * from "./use-weeks";
```

**Intent (3 new + 1 helper, alphabetical):** insert `use-day-metadata`, `use-label-search`, `use-sessions`, `use-week-mutation` (helper). Helper export OPTIONAL — if you decide to keep helper internal/non-exported, leave it out of the barrel. Recommended: export the helper (small public util, future hooks may want it). Final state with all 4:

```ts
export * from "./use-coach-athletes";
export * from "./use-current-user-role";
export * from "./use-coach-action-items";
export * from "./use-coach-invite";
export * from "./use-coach-dashboard";
export * from "./use-day-metadata";
export * from "./use-label-search";
export * from "./use-sessions";
export * from "./use-training-plans";
export * from "./use-users";
export * from "./use-week-mutation";
export * from "./use-weeks";
```

If current file content differs from § 0.6 verbatim — STOP, surface.

### 0.7 — Zero-state consumer verification per `[[planner-consumer-pattern-read]]`

This step adds **first hook-layer consumer surface** for all 7 HTTP routes shipped in Steps 6.4 + 6.4.5. Current consumers verified by planner at prompt-write time:

- `GET /api/platform/labels/search` (Step 6.4) — consumers: **0**.
- `PUT /api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/label` (Step 6.4) — consumers: **0**.
- `PUT .../days/[dayOfWeek]/notes` (Step 6.4) — consumers: **0**.
- `POST .../days/[dayOfWeek]/sessions` (Step 6.4.5) — consumers: **0**.
- `PUT .../days/[dayOfWeek]/sessions/reorder` (Step 6.4.5) — consumers: **0**.
- `PUT /api/platform/training-plans/[planId]/sessions/[sessionId]` (Step 6.4.5) — consumers: **0**.
- `DELETE /api/platform/training-plans/[planId]/sessions/[sessionId]` (Step 6.4.5) — consumers: **0**.

UI consumers arrive Step 6.6 (`DayRow` header reshape — first UI step) and Step 6.7 (`SessionCard` + dnd-kit reorder — second UI step).

If during execution you find an existing consumer that planner missed — STOP, surface.

### 0.8 — Husky hooks / commit-strategy validation

`.husky/pre-commit` runs `turbo check-types --filter="...[HEAD]"`. All Step 6.5 changes are **additive**: 6 new files + 1 helper + 3 small edits (2 barrel + 1 keys add). No intermediate commit leaves a depender broken — per-layer atomic commits hold. **No squash needed.**

---

## § 1 — Goal

Client-side wrap for the 7 platform HTTP routes shipped в Steps 6.4 + 6.4.5:

**3 client API factories** (`apps/platform/src/lib/api/endpoints/`):

- `createSessionsAPI(client)` → `{ create, update, delete, reorder }` (4 methods over 4 Session routes)
- `createDayMetadataAPI(client)` → `{ setLabel, setNotes }` (2 methods over 2 day-metadata routes)
- `createLabelsAPI(client)` → `{ search }` (1 method over labels-search route)

**6 mutation hooks + 1 query hook + 1 helper** (`apps/platform/src/lib/hooks/`):

- `use-sessions.ts` → `useCreateSession`, `useUpdateSession`, `useDeleteSession`, `useReorderSessions`
- `use-day-metadata.ts` → `useUpdateDayLabel`, `useUpdateDayNotes`
- `use-label-search.ts` → `useLabelSearch`
- `use-week-mutation.ts` → `useWeekMutation<TVars, TResult>(config)` helper (DRYs the 6-fold week-invalidating boilerplate per OQ-A ratification)

**Barrels and keys updated** (`endpoints/index.ts`, `hooks/index.ts`, `keys.ts`).

**Out-of-scope** (Step 6.6+): UI consumers, optimistic updates, unit tests for hooks (per OQ-B ratification — mirror `use-weeks.ts` no-test precedent).

---

## § 2 — Context (read these BEFORE writing anything)

### 2.1 — Workflow / planner-discipline files

- `implementation/WORKFLOW.md`
- `implementation/PLANNING_STATE.md` § "Current step" + "Next action" — Step 6.5 scope sketch + downstream plan (after 6.5 → `pnpm build` → merge to main → Step 6.6/6.7 UI).
- `implementation/IMPLEMENTATION_LOG.md` Step 6.4 + 6.4.5 entries — context for the 7 routes you're wrapping.

### 2.2 — Existing infrastructure (consume only, do NOT modify)

- `apps/platform/src/lib/api/client.ts` — `browserApiClient` instance (used by all hooks).
- `apps/platform/src/lib/api/index.ts` — `api` re-export hub. Verify whether new `sessions/dayMetadata/labels` APIs need explicit wiring here in addition to barrel export. If yes — add. Read the file before deciding.
- `@repo/api-client` exports `ApiClient`, `HttpMethod`, `RequestOptions`, `TypedRequestOptions`.
- `@repo/query` exports `notifyError(error, fallbackMessage)`, `createEntityKeys(root, namespace)`.
- `@tanstack/react-query` v5 — `useMutation`, `useQuery`, `useQueryClient`, `UseMutationResult`, `UseQueryResult`.
- `sonner` — `toast.success` / `toast.error`.

### 2.3 — Contract types to import

**Sessions** (`@repo/contracts/lms/session`):

- `CreateSessionData` → for `useCreateSession` vars
- `UpdateSessionData` → for `useUpdateSession` vars
- `ReorderSessionsData` → for `useReorderSessions` vars
- `Session` → return type of create/update; element type of reorder response
- Reorder response actual shape: `{ sessions: Session[] }` (per `reorderSessionsResponseSchema`). `api.sessions.reorder` returns `Promise<{ sessions: Session[] }>`; hook can return that as-is.

**DayMetadata** (`@repo/contracts/lms/day`):

- `UpdateDayLabelData` → for `useUpdateDayLabel` vars
- `UpdateDayNotesData` → for `useUpdateDayNotes` vars
- `DaySlot` → return type of setLabel/setNotes

**Labels** (`@repo/contracts/lms/label`):

- `LabelSearchParams` → `{ q?: string; level?: AppLevelValue }` — accepted by `api.labels.search`
- `Label` → element type of search response
- `AppLevelValue` → for `useLabelSearch` arg + keys.ts namespace import

**Shared** (`@repo/contracts/lms/_shared`):

- `DayOfWeek` → for hook args that take `dayOfWeek` (sessions create/reorder; day-metadata setLabel/setNotes)

### 2.4 — Memory cross-links (auto-loaded session-start)

- `[[planner-consumer-pattern-read]]` — sixth flavour; § 0.7 verifies zero consumers explicit.
- `[[planner-verbatim-registration]]` — third flavour; § 0 quotes.
- `[[scope-via-existing-patterns]]` — first flavour; § 0.1/0.2/0.3 verbatim precedents.
- `[[husky-cross-package-squash]]` — fifth flavour; § 7 commit strategy validated.
- `[[no-tech-debt-in-mocks]]` — drove OQ-A ratification (extract helper, dedup 6 mutations).
- `[[training-domain-workflow]]` — direct prompt execution per Step 6.4.5 D-1 precedent.

---

## § 3 — Scope (per-phase plan; in execution order)

### Phase 1 — Add `labels` namespace to `keys.ts`

**File (1 edited):**

- `apps/platform/src/lib/api/keys.ts`:
  - Add type-only import at top: `import type { AppLevelValue } from "@repo/contracts/lms/label";`
  - Insert `labels: { search }` namespace per § 0.5 final state (next to `weeks` — both lms entities).

**Acceptance:**

- `pnpm --filter platform check-types` green.
- `grep -n "labels" apps/platform/src/lib/api/keys.ts` → ≥1 hit (namespace definition).
- No existing key shape changes (additive only).

### Phase 2 — 3 new client API endpoints

**Files (3 new):**

- **New:** `apps/platform/src/lib/api/endpoints/sessions.ts`:

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

**Design notes:**

- Argument order matches api-server method signature for create/reorder (`planId, startDate, dayOfWeek, data`); for update/delete only `planId, sessionId` are URL components (api-server method takes `sessionId` only, but URL needs `planId` per `sessionByIdParamsSchema = { planId, sessionId }` ratification Step 6.0).
- `update` / `delete` URLs use id-addressed path `/[planId]/sessions/[sessionId]` (not nested through weeks/days) — matches Step 6.4.5 Phase 3 route file at `apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/route.ts`.
- `reorder` URL ends in `/sessions/reorder` sub-resource (PUT verb per Step 6.4.5 OQ-B ratification).
- Return type of `reorder` is `{ sessions: Session[] }` — matches `reorderSessionsResponseSchema` wrap-object shape ratified Step 6.0.

- **New:** `apps/platform/src/lib/api/endpoints/day-metadata.ts`:

```ts
import { type ApiClient } from "@repo/api-client";
import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { DaySlot, UpdateDayLabelData, UpdateDayNotesData } from "@repo/contracts/lms/day";

export const createDayMetadataAPI = (client: ApiClient) => ({
  setLabel: (
    planId: string,
    startDate: string,
    dayOfWeek: DayOfWeek,
    data: UpdateDayLabelData,
  ): Promise<DaySlot> =>
    client.request(
      `/api/platform/training-plans/${planId}/weeks/${startDate}/days/${dayOfWeek}/label`,
      "PUT",
      data,
    ),

  setNotes: (
    planId: string,
    startDate: string,
    dayOfWeek: DayOfWeek,
    data: UpdateDayNotesData,
  ): Promise<DaySlot> =>
    client.request(
      `/api/platform/training-plans/${planId}/weeks/${startDate}/days/${dayOfWeek}/notes`,
      "PUT",
      data,
    ),
});
```

- **New:** `apps/platform/src/lib/api/endpoints/labels.ts`:

```ts
import { type ApiClient } from "@repo/api-client";
import type { Label, LabelSearchParams } from "@repo/contracts/lms/label";

export const createLabelsAPI = (client: ApiClient) => ({
  search: (query?: LabelSearchParams): Promise<Label[]> => {
    const queryParams: Record<string, string> = {
      ...(query?.q !== undefined && { q: query.q }),
      ...(query?.level !== undefined && { level: query.level }),
    };

    return client.request(
      "/api/platform/labels/search",
      "GET",
      undefined,
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
    );
  },
});
```

**Design notes:**

- Conditional spread for query params (mirrors `lmsLabelPlatformApi.list` Phase 5 pattern from Step 6.4 commit `82fdbb7f`). Avoids passing `{ q: undefined }` which would serialize as `?q=` empty (would fail Zod `.trim().min(1)` on server).
- `Object.keys(queryParams).length > 0 ? queryParams : undefined` guard avoids passing empty `{}` to `client.request` (which would produce no `?...` suffix anyway, but explicit `undefined` matches server's "no query" path).
- Server contract: `labelSearchParamsSchema` allows BOTH `q` and `level` optional → empty preload returns all labels with cap 500.

**Edit barrel (1 file):**

- `apps/platform/src/lib/api/endpoints/index.ts` — add 3 lines per § 0.6 final state.

**Edit api hub (1 file — mandatory):**

- `apps/platform/src/lib/api/index.ts` — wire 3 new APIs into `createApi(client)` object per § 0.6 final state. Without this edit, `api.sessions` / `api.dayMetadata` / `api.labels` are undefined at runtime; hooks fail type-check.

**Acceptance:**

- `pnpm --filter platform check-types` + `lint` green.
- 3 new factory exports reachable via `import { api } from "@app/lib/api"`.

### Phase 3 — `useWeekMutation` helper

**File (1 new):**

- **New:** `apps/platform/src/lib/hooks/use-week-mutation.ts`:

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

**Design notes:**

- Generic `<TVars, TResult>` lets each consumer hook specify exact mutation arg + return types.
- `planId` + `startDate` are passed in; the invalidate-target key is computed once (consumer hooks pass these — see Phase 4).
- Per Step 6.2 D-4: `invalidateQueries` over `setQueryData`/partial-merge (simplicity + correctness; refetch is cheap on serial-blur UX).
- `onSuccess` ignores the result — doesn't try to do anything with it. If a consumer needs the result, it's available via `.mutate(vars, { onSuccess: (result) => ... })` per-call.

### Phase 4 — 3 new hook files

**Files (3 new):**

- **New:** `apps/platform/src/lib/hooks/use-sessions.ts`:

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

**Design notes:**

- `useCreateSession` + `useReorderSessions` need `dayOfWeek` in scope → take it as hook arg (UI knows the day-row context).
- `useUpdateSession` + `useDeleteSession` don't need `dayOfWeek` in URL (id-addressed), but DO need `startDate` for week-invalidation; so hook signature: `(planId, startDate)` and mutate vars include `sessionId`.
- Wrap object `{ sessionId, data }` for `useUpdateSession.mutate` so callers pass two args explicitly.

- **New:** `apps/platform/src/lib/hooks/use-day-metadata.ts`:

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

- **New:** `apps/platform/src/lib/hooks/use-label-search.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";

import type { AppLevelValue, Label, LabelSearchParams } from "@repo/contracts/lms/label";

import { api } from "../api";
import { platformKeys } from "../api/keys";

type UseLabelSearchArgs = {
  level?: AppLevelValue;
  q?: string;
  enabled?: boolean;
};

export const useLabelSearch = ({ level, q, enabled = true }: UseLabelSearchArgs = {}) =>
  useQuery<Label[]>({
    queryKey: platformKeys.labels.search(level, q),
    queryFn: () => {
      const params: LabelSearchParams = {
        ...(level !== undefined && { level }),
        ...(q !== undefined && { q }),
      };

      return api.labels.search(Object.keys(params).length > 0 ? params : undefined);
    },
    enabled,
  });
```

**Design notes:**

- Object-arg signature (`{ level, q, enabled }`) over positional — 3 args including 2 optional + 1 default makes positional confusing.
- `enabled = true` default per OQ-C ratification — hook fetches on mount; consumer can pass `enabled: false` to defer.
- Conditional spread in `queryFn` mirrors `labels.ts` API endpoint pattern (avoids passing `{ level: undefined }`).
- Default empty arg `({} = {})` allows `useLabelSearch()` to fetch all labels (preload-no-filter use case).

**Edit barrel (1 file):**

- `apps/platform/src/lib/hooks/index.ts` — add 4 lines per § 0.6 final state (3 hooks + 1 helper).

**Acceptance:**

- `pnpm --filter platform check-types` + `lint` green.
- All 7 hooks (6 mutation + 1 query) + 1 helper importable via `import { useCreateSession, ... } from "@app/lib/hooks"`.
- `grep -n "useWeekMutation" apps/platform/src/lib/hooks/` → 1 def (use-week-mutation.ts) + 6 callsites (4 in use-sessions.ts + 2 in use-day-metadata.ts).

---

## § 4 — Out of scope (explicit)

- **UI consumers** (`DayRow` header reshape, `SessionCard`, dnd-kit reorder) — Steps 6.6 + 6.7.
- **Optimistic updates** for any mutation — per OQ-D ratification, all mutations use `invalidateQueries` per Step 6.2 D-4 precedent. Optimistic UI deferred until concrete UX feedback in Step 6.6/6.7.
- **Unit tests for hooks** — per OQ-B ratification, mirror `use-weeks.ts` no-test precedent. Hooks are thin api+queryClient wrappers; covered by api-server integration tests + future UI smoke-tests.
- **Idempotency-Key client override** — framework auto-generates per request (`client.ts:111-113`); no hook-side opt-in. If a future flow needs deterministic keys (e.g., to dedup across page reloads), add `options.idempotencyKey` then.
- **`@repo/query` `createCrudHooks` / `useOptimisticMutation` adoption** — neither fits Step 6.5 entities (sessions/day-metadata don't have getPageData/getById; they're week-embedded; labels is read-only with no CRUD). Manual `useMutation`/`useQuery` + `useWeekMutation` helper match the pattern.
- **Sessions / DayMetadata GET hooks** — sessions and day data are read via `useWeek` (Step 6.2 returns 7-day shape with `week.days[].sessions[]` embed). No separate `useSession(id)` / `useDay(...)` hooks needed.
- **`createEntityKeys` adoption for `labels` namespace** — single `.search(level?, q?)` accessor doesn't justify factory; manual key-fn matches `weeks.byDate` pattern.

---

## § 5 — Acceptance criteria (numbered)

### 5.1 — File pivot count

- **New (7):**
  - `apps/platform/src/lib/api/endpoints/sessions.ts`
  - `apps/platform/src/lib/api/endpoints/day-metadata.ts`
  - `apps/platform/src/lib/api/endpoints/labels.ts`
  - `apps/platform/src/lib/hooks/use-week-mutation.ts` (helper)
  - `apps/platform/src/lib/hooks/use-sessions.ts`
  - `apps/platform/src/lib/hooks/use-day-metadata.ts`
  - `apps/platform/src/lib/hooks/use-label-search.ts`
- **Edited (4):**
  - `apps/platform/src/lib/api/keys.ts` — `labels` namespace + `AppLevelValue` type import
  - `apps/platform/src/lib/api/index.ts` — wire 3 new APIs into `createApi(client)` factory (mandatory per § 0.6)
  - `apps/platform/src/lib/api/endpoints/index.ts` — +3 exports
  - `apps/platform/src/lib/hooks/index.ts` — +4 exports
- **Untouched:** all contracts, api-server, Prisma, analysis-artifacts, seed, UI components, all other apps.

### 5.2 — Verifications all-green at root

- `pnpm check-types` 16/16.
- `pnpm lint` 16/16.
- `pnpm test` 958 → **~958** (no new tests per OQ-B ratification). Outside `[957, 959]` → STOP, investigate.
- `pnpm dep:check` 0/~1141-1144 (was 0/1137; +4-7 modules for new client files; range tolerance: 1140-1145).

### 5.3 — Targeted grep regressions

- `grep -rn "createSessionsAPI\|createDayMetadataAPI\|createLabelsAPI" apps/platform/src/lib/api/endpoints/` → 3 def hits (1 per file).
- `grep -rn "useWeekMutation" apps/platform/src/lib/hooks/` → 1 def + 6 callsites = 7 hits.
- `grep -rn "platformKeys.labels.search\|platformKeys.weeks.byDate" apps/platform/src/lib/hooks/` → ≥7 hits (1 labels-search query key in use-label-search.ts + 6 invalidate calls inside use-week-mutation.ts callers — actually invalidate happens inside helper, so 1 inside helper only).

Refined:

- `grep -rn "platformKeys.weeks.byDate" apps/platform/src/lib/hooks/` → 2 hits (1 in use-weeks.ts existing + 1 in use-week-mutation.ts new).
- `grep -rn "platformKeys.labels.search" apps/platform/src/lib/hooks/` → 1 hit (use-label-search.ts).
- `grep -n "AppLevelValue" apps/platform/src/lib/api/keys.ts` → 1 type import.
- `grep -n "use client" apps/platform/src/lib/hooks/use-*.ts` → present in 4 new hook files.

### 5.4 — Targeted suite runs

- `pnpm --filter platform check-types` — green; all 7 hooks + 1 helper type-check clean.
- `pnpm --filter platform lint` — green.
- `pnpm --filter platform test` — current baseline preserved (no hook tests added).

### 5.5 — Husky hook compliance

All 3 commits (§ 7) pass `.husky/pre-commit`. Zero `--no-verify`.

### 5.6 — Manual curl / browser smoke (optional)

If `pnpm dev` feasible: open `/coach/plans/<planId>` in a browser, open devtools Network tab. Confirm:

- `useWeek` request fires on mount (Step 5/6.2 existing).
- No hook-layer code paths execute yet (no UI consumer; Step 6.6/6.7 wires consumers). So devtools won't show new requests this step. **Skip if `pnpm dev` not feasible** — Step 6.5 has no runtime user-visible surface; behavior verification is structural (check-types + lint + grep).

---

## § 6 — Adversarial pass per `[[planner-adversarial-review]]`

Step 6.5 is hook-layer + cache-side; no write ops to DB directly. Adversarial axes:

| Op                                           | Concurrent                                                    | Cache-correctness                                                                | Stale state                                                                             | Malformed         | Boundary                                                  |
| -------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------- |
| `useCreateSession.mutate(data)`              | R (server retry Step 6.4.5; client invalidate refetches)      | C (invalidate week → refetch full week; sessions[].length grows by 1)            | R (next useWeek fetch returns fresh state)                                              | R (Zod on server) | R (Step 6.4.5 cases cover ownership/materialization/etc.) |
| `useUpdateSession.mutate({sessionId, data})` | R                                                             | C (invalidate week → refetch)                                                    | R                                                                                       | R                 | R                                                         |
| `useDeleteSession.mutate({sessionId})`       | R                                                             | C (invalidate week → refetch; cascaded deletes server-side)                      | R                                                                                       | R                 | R                                                         |
| `useReorderSessions.mutate(data)`            | R (Step 6.1 reorder is default-isolation, complete-set check) | C (invalidate week; sessions[].order field changes)                              | R                                                                                       | R                 | R                                                         |
| `useUpdateDayLabel.mutate(data)`             | R (retry Step 6.4)                                            | C (invalidate week → DaySlot label updated)                                      | R                                                                                       | R                 | R                                                         |
| `useUpdateDayNotes.mutate(data)`             | R (retry Step 6.4)                                            | C (invalidate week → DaySlot notes updated)                                      | R                                                                                       | R                 | R                                                         |
| `useLabelSearch({level, q})`                 | N/A (read-only)                                               | C (query key includes both args; switching args triggers refetch via key change) | C (1-min default staleness per tanstack-query default; refetch on window focus default) | R (Zod on server) | R (Step 6.4 cap 500 covered)                              |

**No new write-op tests in this step** — backend tests (Steps 6.0-6.4.5) cover the server side; hooks are pass-through with cache management. **All cells passing — no gaps.**

Per `[[planner-consumer-pattern-read]]`: Step 6.5 IS first hook-layer consumer; zero existing client callsites; § 0.7 explicit. Step 6.6/6.7 UI consumers second.

---

## § 7 — Commit strategy (validated per `[[husky-cross-package-squash]]`)

All changes additive (new files + namespace add + barrel +N lines). No intermediate commit leaves a depender broken — `keys.ts` edit + APIs + hooks each compile independently. **3 atomic per-layer commits.**

### 7.1 — Commit sequence

1. **`feat(platform): add labels query key and client api endpoints for lms vertical slice`**

   - Files: `keys.ts` (+ namespace), `endpoints/sessions.ts`, `endpoints/day-metadata.ts`, `endpoints/labels.ts`, `endpoints/index.ts` (+ 3 exports), `lib/api/index.ts` (wire 3 APIs into `createApi`).
   - Body: "Wires client-side APIs for the 7 platform HTTP routes shipped in Steps 6.4 + 6.4.5: `createSessionsAPI` (create/update/delete/reorder over the 4 session routes), `createDayMetadataAPI` (setLabel/setNotes over the 2 day-metadata routes), `createLabelsAPI` (search over the labels-search route). `labels.search(level?, q?)` query key added to `platformKeys` namespace. `Idempotency-Key` auto-injected by `ApiClient.prepareRequest:111-113` for all POST/PUT/DELETE — no hook-side opt-in needed."

2. **`feat(platform): add hooks for sessions day-metadata and label search`**

   - Files: `hooks/use-week-mutation.ts` (helper), `hooks/use-sessions.ts`, `hooks/use-day-metadata.ts`, `hooks/use-label-search.ts`, `hooks/index.ts` (+ 4 exports).
   - Body: "Adds 6 mutation hooks (`useCreateSession` / `useUpdateSession` / `useDeleteSession` / `useReorderSessions` / `useUpdateDayLabel` / `useUpdateDayNotes`) and 1 query hook (`useLabelSearch`). All 6 mutations DRY through `useWeekMutation<TVars, TResult>` helper — invalidates `platformKeys.weeks.byDate(planId, startDate)` on success per Step 6.2 D-4 precedent (`invalidateQueries` over partial-merge for simplicity). `useLabelSearch({level?, q?, enabled? = true})` fetches on mount per ratified product req (coach preload on form open). UI consumers arrive Steps 6.6/6.7."

3. **`docs(step-06.5): write executor output report and step prompt`**
   - Files: `implementation/step-06.5/{prompt,output}.md`.

### 7.2 — Commitlint guardrails

- All subjects lowercase including acronyms (`lms` not `LMS`, `crud` if used).
- All subjects ≤ 100 chars. Longest planned: "feat(platform): add labels query key and client api endpoints for lms vertical slice" = 87 chars ✓. "feat(platform): add hooks for sessions day-metadata and label search" = 69 chars ✓. "docs(step-06.5): write executor output report and step prompt" = 60 chars ✓.
- All body lines ≤ 150 chars. Reflow before commit.
- No skip-flags.

---

## § 8 — Escalation protocol

STOP and `AskUserQuestion` planner if:

- **§ 0 verbatim quote mismatches** — any file content differs from quotes.
- **`keys.ts` ordering convention divergence** — if you encounter a strict alphabetical or topic-grouped convention not visible in the current file, surface with rationale + suggested placement.
- **`api.labels.search({})` empty-arg behavior** — if `client.request` rejects `undefined` queryParams or `Object.keys({}).length === 0` guard misbehaves, surface with reproduction.
- **`useLabelSearch` arg-shape divergence from `use-users.ts`** — `use-users.ts` uses positional `(query: string, enabled = true)`; planner chose object-arg `({level?, q?, enabled?})` for 3-args-with-defaults clarity. If you have a strong reason to mirror positional instead (consistency with `useSearchUsers`), surface — both defensible.
- **`useWeekMutation` helper placement** — planner placed in `apps/platform/src/lib/hooks/`. If executor finds a more natural location (e.g., `apps/platform/src/lib/api/` next to keys, or extracts to `@repo/query`), surface — but planner's hypothesis is local-to-platform (knows about `platformKeys.weeks`) per OQ-A discussion.
- **Test-count outside [957, 959] range** — surface with delta breakdown.
- **Husky pre-commit blocks intermediate commit** — should not happen; surface if it does.

Hypothesis format: "[surfaced finding]; from a [coach/engineering] perspective the answer is probably X because [rationale]; right?"

---

## § 9 — Output report format

Write to `implementation/step-06.5/output.md` per WORKFLOW.md "output.md format" section. Required headers in order:

- `## Что сделано` — Russian narrative, 4-8 lines.
- `## Изменённые/созданные файлы` — bulleted by phase, file count totals.
- `## Принятые решения` — D-numbered minor deviations.
- `## Возникшие вопросы и как решены` — escalations + resolutions (or "no escalations").
- `## Что отложено` — bullet list of newly-identified follow-ups.
- ``## Ссылка на `.feature-dev/<ts>/```—`N/A — direct execution`(per Step 6.4.5 D-1 precedent) OR populated path if`/feature small` was used.
- `## Verification notes` — per-gate output with counts.
- `## Acceptance criteria self-check` — checkbox list mirroring § 5.1-5.5.

No smoke-test section (N/A — hook layer, no runtime user-visible surface; smoke-test arrives in Step 6.6).

---

## § 10 — One-line scope summary

> Wrap the 7 platform HTTP routes (Steps 6.4 + 6.4.5) in client API + hooks: 3 `createXAPI` factories (sessions/day-metadata/labels) + 6 mutation hooks DRY'd through a `useWeekMutation` helper + 1 query hook for label search. `Idempotency-Key` already auto-generated by `ApiClient`; `invalidateQueries` per Step 6.2 D-4; no UI/optimistic/test work. 4 phases / 1 package / 7 new + 3-4 edited files / 3 atomic commits / additive only.
