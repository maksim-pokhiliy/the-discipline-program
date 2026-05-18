# Step 7.2 — Platform HTTP routes для Block + `handlePrismaError` ZodError DB-corruption defence

**Branch**: `feat/training-domain` (HEAD `71803bb0` post-Step-7.1 close-out; 11 commits ahead of `main`). Stay on this branch — do NOT cut a feature branch (see § Execution mode).
**Type**: Platform HTTP routes slice + tiny api-server util patch. Two-package surface (`apps/platform/` route files + `packages/api-server/src/utils/` 6-LOC handler extension). Third sub-step of Step 7 decomposition (7.0 contracts → 7.1 api-server → 7.2 routes).
**Scope**: ship 4 platform HTTP routes для Block (POST create + PUT reorder + multiplexed PUT/DELETE per blockId + PUT assignLabels) mirror Step 6.4.5 Session pattern + patch `handlePrismaError` чтобы mapper-side `ZodError` (DB-corruption через `intensitySchema.parse` / `timeCapSchema.parse` от Step 7.1 `mapToBlock`) re-throwал как `InternalServerError({kind: "DbCorruption"})` вместо silent pass-through к `handleApiError` где он бы matched к 400 `VALIDATION_ERROR` (wrong — must be 500 DB-corruption).

**Execution mode**: **`/feature small` pipeline** per `[[always-via-feature-skill]]` (6 files total — 4 routes + 1 handler patch + 1 test patch; thin wrappers over Step 7.1 api-server; low-novelty mirror work). **Branch-cut override MANDATORY**: this step lives on long-lived `feat/training-domain` per `[[training-domain-workflow]]`. If `/feature small` Stage 0 attempts `git checkout -b feat/<slug>` from main, you MUST **STOP** and `AskUserQuestion` showing attempted branch + planner override directive, then continue on current `feat/training-domain` branch (do NOT create `feat/<slug>`). All commits land on `feat/training-domain`.

---

## § 0. Hard triggers — read-then-act gate

Before any code, **verify every verbatim quote in § 0.1-0.11 against HEAD `71803bb0` byte-for-byte**. If any quote diverges, **STOP**, run `AskUserQuestion` showing actual content + this prompt's claim, wait for planner ratification. Do NOT silently adapt — planner owns prompt errors.

### § 0.0 Prior-implementation trace stops

This is the **4th attempt** at this domain; prior three deleted (per `implementation/WORKFLOW.md`). If you encounter vocab like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — STOP and surface. The only legitimate sources are `analysis/artifacts/`, the live Prisma schema, the Step 7.0 contracts + Step 7.1 api-server, и the Session 6.4.5 route mirror referenced here.

### § 0.A Zero-state verification commands

Run these at executor launch and verify expected counts:

```bash
ls apps/platform/src/app/api/platform/training-plans/\[planId\]/sessions/\[sessionId\]/blocks/ 2>/dev/null
# Expected: directory does NOT exist. If exists, STOP and surface — Step 7.2 partially done earlier.

ls apps/platform/src/app/api/platform/training-plans/\[planId\]/blocks/ 2>/dev/null
# Expected: directory does NOT exist. If exists, STOP and surface.

grep -rln "lmsBlockApi" apps/platform/src/
# Expected: 0 hits. Step 7.2 IS the first HTTP consumer of Step 7.1 api-server slice.

grep -rln "@repo/contracts/lms/block" apps/platform/src/
# Expected: 0 hits. UI consumers arrive Steps 7.3+.

grep -n "ZodError" packages/api-server/src/utils/prisma-error-handler.ts
# Expected: 0 hits. Patch in § 3 Phase 1 adds first ZodError reference в этом файле.
```

### § 0.1 Canonical mirror — Session POST create route (`apps/platform/.../[planId]/weeks/[startDate]/days/[dayOfWeek]/sessions/route.ts`, 22 LOC full)

Block POST create route mirrors this 1:1 (substitute Session → Block; `sessionByDayParamsSchema` → `blockBySessionParamsSchema`; `createSessionRequestSchema/createSessionResponseSchema` → `createBlockRequestSchema/createBlockResponseSchema`; `lmsSessionApi.create(userId, planId, startDate, dayOfWeek, data)` → `lmsBlockApi.create(userId, planId, sessionId, data)`).

```ts
import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSessionApi } from "@repo/api-server/lms";
import {
  createSessionRequestSchema,
  createSessionResponseSchema,
  sessionByDayParamsSchema,
} from "@repo/contracts/lms/session";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, startDate, dayOfWeek }, data) =>
        lmsSessionApi.create(userId, planId, startDate, dayOfWeek, data),
      sessionByDayParamsSchema,
      createSessionRequestSchema,
      createSessionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
```

### § 0.2 Canonical mirror — Session reorder route (`apps/platform/.../sessions/reorder/route.ts`, 24 LOC full)

Block reorder route mirrors this 1:1 (substitute Session → Block; `reorderSessions*` → `reorderBlocks*`; `.then((sessions) => ({ sessions }))` → `.then((blocks) => ({ blocks }))` для `reorderBlocksResponseSchema = z.object({blocks: z.array(blockSchema)})` per Step 7.0 wrap shape).

```ts
import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSessionApi } from "@repo/api-server/lms";
import {
  reorderSessionsRequestSchema,
  reorderSessionsResponseSchema,
  sessionByDayParamsSchema,
} from "@repo/contracts/lms/session";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, startDate, dayOfWeek }, data) =>
        lmsSessionApi
          .reorder(userId, planId, startDate, dayOfWeek, data)
          .then((sessions) => ({ sessions })),
      sessionByDayParamsSchema,
      reorderSessionsRequestSchema,
      reorderSessionsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
```

### § 0.3 Canonical mirror — Session id-addressed multiplex route (`apps/platform/.../[planId]/sessions/[sessionId]/route.ts`, 36 LOC full)

Block id-addressed multiplex (update + delete) mirrors this 1:1 (substitute Session → Block; `sessionByIdParamsSchema` → `blockByIdParamsSchema`; `updateSession*` → `updateBlock*`; `lmsSessionApi.update(userId, sessionId, data)` → `lmsBlockApi.update(userId, blockId, data)`; `lmsSessionApi.delete(userId, sessionId)` → `lmsBlockApi.delete(userId, blockId)`).

```ts
import {
  createAuthDeleteHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsSessionApi } from "@repo/api-server/lms";
import {
  sessionByIdParamsSchema,
  updateSessionRequestSchema,
  updateSessionResponseSchema,
} from "@repo/contracts/lms/session";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { sessionId }, data) => lmsSessionApi.update(userId, sessionId, data),
      sessionByIdParamsSchema,
      updateSessionRequestSchema,
      updateSessionResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { sessionId }) => lmsSessionApi.delete(userId, sessionId),
      sessionByIdParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
```

### § 0.4 Auth factory signatures (`packages/api-routes/src/auth-factories.ts`, relevant excerpts)

Three factories used in Step 7.2; verified verbatim:

```ts
export const createAuthPostByParamHandler = <TParams, TRequest, TResponse>(
  apiFn: (userId: string, params: TParams, data: TRequest) => Promise<TResponse>,
  paramsSchema: ParseSchema<TParams>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema: ParseSchema<TResponse>,
): AuthenticatedHandler => {
  const inner: AuthenticatedHandler = async (request, context, userId) => {
    const params = paramsSchema.parse(await context.params);
    const body = await parseJsonBody(request);
    const data = requestSchema.parse(body);
    const result = await apiFn(userId, params, data);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  };

  return wrapAuthHandler(inner, JSON_CONFIG);
};

export const createAuthPutByParamHandler = <TParams, TRequest, TResponse>(
  apiFn: (userId: string, params: TParams, data: TRequest) => Promise<TResponse>,
  paramsSchema: ParseSchema<TParams>,
  requestSchema: ParseSchema<TRequest>,
  responseSchema: ParseSchema<TResponse>,
): AuthenticatedHandler => {
  const inner: AuthenticatedHandler = async (request, context, userId) => {
    const params = paramsSchema.parse(await context.params);
    const body = await parseJsonBody(request);
    const data = requestSchema.parse(body);
    const result = await apiFn(userId, params, data);
    const validated = responseSchema.parse(result);

    return NextResponse.json(validated);
  };

  return wrapAuthHandler(inner, JSON_CONFIG);
};

export const createAuthDeleteHandler = <TParams>(
  apiFn: (userId: string, params: TParams) => Promise<void>,
  paramsSchema: ParseSchema<TParams>,
): AuthenticatedHandler => {
  const inner: AuthenticatedHandler = async (_request, context, userId) => {
    const params = paramsSchema.parse(await context.params);

    await apiFn(userId, params);

    return new NextResponse(null, { status: 204 });
  };

  return wrapAuthHandler(inner, NONE_CONFIG);
};
```

**Notes**:

- POST returns 201; PUT returns 200; DELETE returns 204 (NextResponse `null`).
- All wrap `wrapAuthHandler` для idempotency-key handling — same `Idempotency-Key reuse with different request body → ConflictError` behavior inherited automatically (no Block-route-specific work needed).
- Schemas parse params (from `await context.params`), body (from `parseJsonBody(request)`), and response — failure at any schema → ZodError → propagates to `handleApiError` → 400 `VALIDATION_ERROR` (existing behavior, correct for payload validation).

### § 0.5 `handlePrismaError` current shape (`packages/api-server/src/utils/prisma-error-handler.ts`, full 50 LOC)

**This is the file to patch in § 3 Phase 1.** Current behavior: ZodError propagates через final `throw error` line 49 → reaches `handleApiError` (api-routes) → mapped к 400 `VALIDATION_ERROR`. **Wrong для mapper-side ZodError** (DB-corruption should be 500, not 400 "payload validation failed").

```ts
import { Prisma } from "@prisma/client";

import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "@repo/errors";

export const handlePrismaError = (
  error: unknown,
  context: { entity: string; field?: string },
): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const field = Array.isArray(target) ? target[0] : context.field;

      throw new ConflictError(`${context.entity} with this ${field || "value"} already exists`, {
        field: field || "unknown",
      });
    }

    if (error.code === "P2003") {
      const field = (error.meta?.field_name as string) || context.field;

      throw new BadRequestError(`Referenced ${context.entity} does not exist`, {
        field: field || "unknown",
      });
    }

    if (error.code === "P2011") {
      const constraint = error.meta?.constraint;
      const field = Array.isArray(constraint) ? constraint[0] : context.field;

      throw new BadRequestError(`Required field is missing for ${context.entity}`, {
        field: field || "unknown",
      });
    }

    if (error.code === "P2025") {
      throw new NotFoundError(`${context.entity} not found`);
    }

    if (error.code === "P2034") {
      throw new ConflictError(`${context.entity} was modified concurrently, please retry`);
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    throw new InternalServerError(`Database operation failed for ${context.entity}`);
  }

  throw error;
};
```

### § 0.6 `prisma-error-handler.test.ts` current shape (full 127 LOC — test 9 + new patch test count 11)

Existing tests cover P2002 / P2025 / P2003 / P2011 / P2034 / unknown-code / PrismaClientUnknownRequestError / non-Prisma-Error / non-Error. **Keep test #118-122 "non-Prisma error is rethrown as-is"** — it covers generic `new Error("Some random error")` pass-through, which remains correct AFTER the ZodError patch (only ZodError specifically gets intercepted; other Error subclasses still propagate).

```ts
import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "@repo/errors";

import { handlePrismaError } from "./prisma-error-handler";

const makePrismaError = (
  code: string,
  meta?: Record<string, unknown>,
): Prisma.PrismaClientKnownRequestError => {
  const error = new Prisma.PrismaClientKnownRequestError("Prisma error", {
    code,
    clientVersion: "5.0.0",
    ...(meta && { meta }),
  });

  return error;
};

describe("handlePrismaError", () => {
  // ... 9 existing cases (P2002 x 3, P2025, P2003, P2011, P2034, unknown-code, PrismaClientUnknownRequestError, non-Prisma-Error, non-Error) ...

  it("non-Prisma error is rethrown as-is", () => {
    const error = new Error("Some random error");

    expect(() => handlePrismaError(error, { entity: "X" })).toThrow("Some random error");
  });

  it("non-Error value is rethrown", () => {
    expect(() => handlePrismaError("string error", { entity: "X" })).toThrow();
  });
});
```

**Note**: `ZodError` is a subclass of `Error` so the existing "non-Error rethrow" test (line 118-122 — generic `new Error("Some random error")`) does NOT cover ZodError specifically. The patch in § 3 Phase 1 intercepts ZodError BEFORE the final `throw error`; generic Error still hits the final throw. Both tests coexist without conflict.

### § 0.7 `handleApiError` в api-routes (DO NOT TOUCH — verify ZodError → 400 path correctness)

`packages/api-routes/src/error-handler.ts:120-134` `handleApiError`:

```ts
export const handleApiError = (error: unknown, requestId?: string): NextResponse => {
  unstable_rethrow(error);

  reportError(error, summarizeError(error), requestId);

  if (error instanceof AppError) {
    return appErrorResponse(error, requestId);
  }

  if (error instanceof ZodError) {
    return zodErrorResponse(error, requestId);
  }

  return unknownErrorResponse(requestId);
};
```

**`zodErrorResponse` line 87-104**: maps к 400 `VALIDATION_ERROR` with `issues[]` payload. This is **correct** для route-layer ZodErrors thrown by `paramsSchema.parse(...)` / `requestSchema.parse(body)` / `responseSchema.parse(result)` (per auth factories § 0.4) — those represent client-side payload validation failures.

After § 3 Phase 1 patch: mapper-side ZodError gets intercepted at api-server's `handlePrismaError` and re-thrown as `InternalServerError(..., {kind: "DbCorruption", ...})`. The new error is an AppError subclass → hits `if (error instanceof AppError)` branch first → `appErrorResponse` → 500 with structured details. The `ZodError` branch fires only for route-layer parses (correct 400 behavior preserved).

**Do NOT edit `packages/api-routes/src/error-handler.ts`**. The fix is single-package в api-server.

### § 0.8 Step 7.0 Block contract symbols (already shipped, consumed verbatim)

From `@repo/contracts/lms/block` (re-verify exists via `grep -l "blockBySessionParamsSchema" packages/contracts/src/entities/lms/block/`):

- **Params schemas**: `blockBySessionParamsSchema = z.object({planId, sessionId})` для POST create + PUT reorder; `blockByIdParamsSchema = z.object({planId, blockId})` для PUT update + DELETE + PUT assignLabels.
- **Request schemas**: `createBlockRequestSchema` (= `createBlockSchema`), `updateBlockRequestSchema` (= `updateBlockSchema`), `reorderBlocksRequestSchema` (= `reorderBlocksSchema`), `assignBlockLabelsRequestSchema` (= `assignBlockLabelsSchema`).
- **Response schemas**: `createBlockResponseSchema` (= `blockSchema`), `updateBlockResponseSchema` (= `blockSchema`), `reorderBlocksResponseSchema` (= `z.object({blocks: z.array(blockSchema)})` — **wrap shape**), `assignBlockLabelsResponseSchema` (= `blockSchema`).

### § 0.9 `InternalServerError` constructor (`packages/errors/src/http-errors.ts:104-112`)

```ts
export class InternalServerError extends AppError {
  constructor(message = "Internal server error", details?: Record<string, unknown>) {
    super(message, {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      details,
    });
  }
}
```

Patch usage: `throw new InternalServerError("DB content failed schema validation", {kind: "DbCorruption", entity: context.entity, issues: error.errors.map(e => ({path: e.path.join("."), message: e.message, code: e.code}))})`.

### § 0.10 Husky hooks + Turborepo fan-out (verbatim at HEAD `71803bb0`)

**`.husky/pre-commit`**:

```sh
node scripts/check-secrets.mjs
npx lint-staged
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"
```

**`.husky/pre-push`**:

```sh
pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"
```

**`turbo.json` task graph**:

```json
"check-types": { "dependsOn": ["^check-types"] },
"lint": { "dependsOn": ["^lint"] },
"test": { "cache": false }
```

**`turbo run check-types --filter="...[HEAD]"` semantics**: re-compile every package depending on (transitively) the files changed in HEAD. Step 7.2 = **2 packages** (`apps/platform/` for routes + `packages/api-server/src/utils/` for handler patch). Both changes are **additive only** (new route files; new ZodError branch before final `throw error` in handler). Downstream consumers of api-server compile unchanged because handler signature stays the same (still `(error, context) => never`); behavior change is "intercept ZodError → throw AppError" instead of "pass through". This is a behavior-narrowing change — callers that previously got opaque ZodError now get InternalServerError, but neither callsite (current api-server code uses `try { ... } catch (e) { return handlePrismaError(e, ...) }` — the function never returns, always throws — return-type is `never`) cares about which specific Error subclass propagates.

**Conclusion**: per-phase atomic commits OK; no husky-squash trigger. See § 7.

### § 0.11 QA-003 hard requirement (carry-forward from Step 7.1 Stage 6)

🔴 **`handlePrismaError` MUST intercept ZodError and throw InternalServerError before reaching the final `throw error` line.**

Patch shape (§ 3 Phase 1 elaborates):

```ts
import { Prisma } from "@prisma/client";
import { ZodError } from "zod"; // NEW IMPORT

import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "@repo/errors";

export const handlePrismaError = (
  error: unknown,
  context: { entity: string; field?: string },
): never => {
  // ... existing Prisma code branches (P2002, P2003, P2011, P2025, P2034) unchanged ...

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    throw new InternalServerError(`Database operation failed for ${context.entity}`);
  }

  // NEW BRANCH (inserted before final `throw error` line 49):
  if (error instanceof ZodError) {
    throw new InternalServerError(`${context.entity} content failed schema validation`, {
      kind: "DbCorruption",
      entity: context.entity,
      issues: error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
        code: e.code,
      })),
    });
  }

  throw error; // unchanged — generic Error subclasses still propagate
};
```

**Required tests** (§ 3 Phase 1 elaborates): +2 cases в `prisma-error-handler.test.ts`:

```ts
it("ZodError throws InternalServerError with DbCorruption kind and issues", () => {
  const zodError = z.object({ x: z.string() }).safeParse({ x: 123 });
  // Or construct ZodError directly via z.string().min(5).safeParse("ab") → use .error
  if (zodError.success) throw new Error("setup error: expected zod parse to fail");

  expect(() => handlePrismaError(zodError.error, { entity: "Block" })).toThrow(InternalServerError);

  try {
    handlePrismaError(zodError.error, { entity: "Block" });
  } catch (e) {
    expect((e as InternalServerError).message).toBe("Block content failed schema validation");
    expect((e as InternalServerError).details?.kind).toBe("DbCorruption");
    expect((e as InternalServerError).details?.entity).toBe("Block");
    expect(Array.isArray((e as InternalServerError).details?.issues)).toBe(true);
  }
});

it("generic Error (non-Zod, non-Prisma) still rethrown as-is — regression guard for ZodError branch", () => {
  // Adjacent to existing line 118-122 test; explicit guard that ZodError patch didn't
  // accidentally absorb other Error subclasses.
  class CustomError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "CustomError";
    }
  }
  const error = new CustomError("Custom");

  expect(() => handlePrismaError(error, { entity: "X" })).toThrow(CustomError);
});
```

---

## § 1. What this step is

Two work items, tightly coupled by the QA-003 surface:

1. **4 platform HTTP route files для Block** mirror Step 6.4.5 Session pattern. Routes are thin wrappers: `withCoachAuth` + `withAuthRateLimit(RATE_LIMIT_TIER.API)` + auth factory + Step 7.0 contract schemas + Step 7.1 `lmsBlockApi` method invocation. No business logic в route layer.

2. **`handlePrismaError` ZodError DB-corruption defence** (~6 LOC patch + 2 test cases) — closes Step 7.1 Stage 6 QA-003. Mapper-side `ZodError` (thrown by `intensitySchema.parse` / `timeCapSchema.parse` в `mapToBlock`/`mapToBlockWithLabels` when DB content is corrupt) currently propagates through `handlePrismaError`'s final `throw error` к route layer `handleApiError` → mapped к 400 `VALIDATION_ERROR` (wrong: client-side payload validation flag, NOT 500 DB-corruption). Patch intercepts ZodError в api-server's handler, re-throws as `InternalServerError({kind: "DbCorruption", entity, issues})`. Route layer's existing AppError path handles it → 500 with structured details.

**4 routes layout** (per ratified OQ-a + OQ-b):

| Route file                                              | HTTP method(s)   | Factory                                                   | Params schema                | Request schema                                | Response schema                                | API method                                                                          |
| ------------------------------------------------------- | ---------------- | --------------------------------------------------------- | ---------------------------- | --------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `[planId]/sessions/[sessionId]/blocks/route.ts`         | `POST`           | `createAuthPostByParamHandler`                            | `blockBySessionParamsSchema` | `createBlockRequestSchema`                    | `createBlockResponseSchema`                    | `lmsBlockApi.create(userId, planId, sessionId, data)`                               |
| `[planId]/sessions/[sessionId]/blocks/reorder/route.ts` | `PUT`            | `createAuthPutByParamHandler`                             | `blockBySessionParamsSchema` | `reorderBlocksRequestSchema`                  | `reorderBlocksResponseSchema`                  | `lmsBlockApi.reorder(userId, planId, sessionId, data).then(blocks => ({blocks}))`   |
| `[planId]/blocks/[blockId]/route.ts`                    | `PUT` + `DELETE` | `createAuthPutByParamHandler` + `createAuthDeleteHandler` | `blockByIdParamsSchema`      | `updateBlockRequestSchema` (PUT) / — (DELETE) | `updateBlockResponseSchema` (PUT) / — (DELETE) | `lmsBlockApi.update(userId, blockId, data)` + `lmsBlockApi.delete(userId, blockId)` |
| `[planId]/blocks/[blockId]/labels/route.ts`             | `PUT`            | `createAuthPutByParamHandler`                             | `blockByIdParamsSchema`      | `assignBlockLabelsRequestSchema`              | `assignBlockLabelsResponseSchema`              | `lmsBlockApi.assignLabels(userId, blockId, data)`                                   |

**Note on URL structure (OQ-a A1)**: id-addressed Block routes (update/delete/assignLabels) live at `.../[planId]/blocks/[blockId]/...` (sessionId-free), NOT nested under `.../sessions/[sessionId]/...`. Mirror Session precedent (id-addressed Session at `.../[planId]/sessions/[sessionId]/` — also doesn't nest under day/week URL). `blockByIdParamsSchema = {planId, blockId}` from Step 7.0 contracts; `verifyBlockOwnership` (Step 7.1) JOIN's full chain block → session → day → week → plan для ownership validation — sessionId not needed in URL params.

**Note on assignLabels (OQ-b B1)**: dedicated `[blockId]/labels/route.ts` with PUT (full label set replacement semantic). Mirror Session reorder sub-resource pattern (`sessions/reorder/route.ts`). PUT fits "idempotent body-full replace" better than PATCH; auth-factories.ts has no PATCH handler factory (only POST/PUT/DELETE confirmed via § 0.4).

**Out of scope**: no client API (Step 7.3), no hooks (Step 7.3), no UI (Step 7.4), no Schema entity routes (Step 8), no Prisma schema change, no seed change, no `analysis/artifacts/` change, no edit to `packages/api-routes/src/error-handler.ts` (QA-003 fix lands в api-server, not api-routes — see § 0.7).

---

## § 2. Inputs / Outputs / Dependencies

### Inputs (verified consumable)

- Step 7.1 api-server at HEAD `71803bb0`: `lmsBlockApi.{create, update, delete, reorder, assignLabels}` via `@repo/api-server/lms` barrel.
- Step 7.0 contracts: params + request + response schemas via `@repo/contracts/lms/block`.
- Step 6.4.5 Session route precedents (§ 0.1-0.3 verbatim).
- Auth factories (§ 0.4): `createAuthPostByParamHandler`, `createAuthPutByParamHandler`, `createAuthDeleteHandler`.
- `withCoachAuth` from `@app/lib/server/auth` (Session routes precedent).
- `withAuthRateLimit` + `RATE_LIMIT_TIER` from `@repo/api-routes`.
- `handlePrismaError` current state (§ 0.5) + test patterns (§ 0.6).
- `InternalServerError` constructor (§ 0.9).
- `ZodError` from `"zod"` (new import in patch).

### Outputs

**New (4 files)**:

1. `apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/blocks/route.ts` (~25 LOC, POST)
2. `apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/blocks/reorder/route.ts` (~25 LOC, PUT)
3. `apps/platform/src/app/api/platform/training-plans/[planId]/blocks/[blockId]/route.ts` (~36 LOC, multiplexed PUT + DELETE)
4. `apps/platform/src/app/api/platform/training-plans/[planId]/blocks/[blockId]/labels/route.ts` (~25 LOC, PUT)

**Edited (2 files)**:

5. `packages/api-server/src/utils/prisma-error-handler.ts` — add `import { ZodError } from "zod"`, insert ZodError branch before final `throw error`. Net +8 LOC.
6. `packages/api-server/src/utils/prisma-error-handler.test.ts` — add 2 cases (ZodError → InternalServerError + non-Zod-non-Prisma Error regression guard). Net +35 LOC.

**Total**: 4 new files (apps/platform/) + 2 edited files (packages/api-server/utils/) = 6 file changes across 2 packages.

### Dependencies

- **Hard**: Step 7.1 api-server (already shipped).
- **Hard**: Step 7.0 contracts (already shipped).
- **None new**: no `pnpm install`; no Prisma migration; no seed change; no api-routes change; no shared package edits.

---

## § 3. Phases

### Phase 1 — `handlePrismaError` ZodError branch + 2 test cases

**File**: `packages/api-server/src/utils/prisma-error-handler.ts`

Add import + branch per § 0.11. Final shape:

```ts
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "@repo/errors";

export const handlePrismaError = (
  error: unknown,
  context: { entity: string; field?: string },
): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const field = Array.isArray(target) ? target[0] : context.field;

      throw new ConflictError(`${context.entity} with this ${field || "value"} already exists`, {
        field: field || "unknown",
      });
    }

    if (error.code === "P2003") {
      const field = (error.meta?.field_name as string) || context.field;

      throw new BadRequestError(`Referenced ${context.entity} does not exist`, {
        field: field || "unknown",
      });
    }

    if (error.code === "P2011") {
      const constraint = error.meta?.constraint;
      const field = Array.isArray(constraint) ? constraint[0] : context.field;

      throw new BadRequestError(`Required field is missing for ${context.entity}`, {
        field: field || "unknown",
      });
    }

    if (error.code === "P2025") {
      throw new NotFoundError(`${context.entity} not found`);
    }

    if (error.code === "P2034") {
      throw new ConflictError(`${context.entity} was modified concurrently, please retry`);
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    throw new InternalServerError(`Database operation failed for ${context.entity}`);
  }

  if (error instanceof ZodError) {
    throw new InternalServerError(`${context.entity} content failed schema validation`, {
      kind: "DbCorruption",
      entity: context.entity,
      issues: error.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
        code: e.code,
      })),
    });
  }

  throw error;
};
```

**File**: `packages/api-server/src/utils/prisma-error-handler.test.ts`

Add 2 cases AFTER the existing "non-Prisma error is rethrown as-is" case (~line 122, before `it("non-Error value is rethrown", ...)` или в конец before closing describe — your choice; both valid). Add `import { z, ZodError } from "zod"` to imports.

```ts
it("ZodError throws InternalServerError with DbCorruption kind and structured issues", () => {
  const parseResult = z.object({ rpe: z.object({ value: z.number().positive() }) }).safeParse({
    rpe: { value: -5 },
  });

  if (parseResult.success) {
    throw new Error("test setup: expected Zod parse to fail");
  }

  expect(() => handlePrismaError(parseResult.error, { entity: "Block" })).toThrow(
    InternalServerError,
  );

  try {
    handlePrismaError(parseResult.error, { entity: "Block" });
  } catch (e) {
    const err = e as InternalServerError;

    expect(err.message).toBe("Block content failed schema validation");
    expect(err.details?.kind).toBe("DbCorruption");
    expect(err.details?.entity).toBe("Block");
    expect(Array.isArray(err.details?.issues)).toBe(true);

    const issues = err.details?.issues as Array<{ path: string; message: string; code: string }>;

    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.path).toContain("rpe");
  }
});

it("non-Zod non-Prisma Error subclass still rethrown as-is (regression guard for ZodError branch)", () => {
  class CustomError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "CustomError";
    }
  }

  const error = new CustomError("custom failure");

  expect(() => handlePrismaError(error, { entity: "X" })).toThrow(CustomError);
});
```

**Notes**:

- Use `z.object(...).safeParse(...)` to get a real ZodError instance (don't construct ZodError manually — its shape is brittle to Zod version changes).
- The regression-guard test ensures the ZodError branch doesn't accidentally absorb other Error subclasses (defensive — paranoia about future patches widening the branch).
- Existing line 118-122 "non-Prisma error is rethrown as-is" (using `new Error(...)`) stays unchanged; it covers the base Error class.

**Run after Phase 1**:

```bash
pnpm --filter @repo/api-server test -- prisma-error-handler
# Expected: 11 cases green (9 existing + 2 new).
```

**Commit 1**: `feat(api-server): map mapper-side zoderror to internalservererror with dbcorruption kind`.

### Phase 2 — POST create + PUT reorder routes

**File**: `apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/blocks/route.ts` (new, ~25 LOC)

Mirror Session POST verbatim (§ 0.1):

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

**File**: `apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/blocks/reorder/route.ts` (new, ~25 LOC)

Mirror Session reorder verbatim (§ 0.2), with `.then(blocks => ({blocks}))` wrap для response shape per `reorderBlocksResponseSchema = z.object({blocks: ...})`:

```ts
import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockApi } from "@repo/api-server/lms";
import {
  blockBySessionParamsSchema,
  reorderBlocksRequestSchema,
  reorderBlocksResponseSchema,
} from "@repo/contracts/lms/block";

import { withCoachAuth } from "@app/lib/server/auth";

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

**Commit 2**: `feat(platform): add http routes for block create and reorder`.

### Phase 3 — Multiplexed update/delete route + assignLabels route

**File**: `apps/platform/src/app/api/platform/training-plans/[planId]/blocks/[blockId]/route.ts` (new, ~36 LOC)

Mirror Session id-addressed multiplex verbatim (§ 0.3):

```ts
import {
  createAuthDeleteHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsBlockApi } from "@repo/api-server/lms";
import {
  blockByIdParamsSchema,
  updateBlockRequestSchema,
  updateBlockResponseSchema,
} from "@repo/contracts/lms/block";

import { withCoachAuth } from "@app/lib/server/auth";

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

**File**: `apps/platform/src/app/api/platform/training-plans/[planId]/blocks/[blockId]/labels/route.ts` (new, ~25 LOC)

Mirror Session reorder pattern (sub-resource action PUT), substitute schemas:

```ts
import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockApi } from "@repo/api-server/lms";
import {
  assignBlockLabelsRequestSchema,
  assignBlockLabelsResponseSchema,
  blockByIdParamsSchema,
} from "@repo/contracts/lms/block";

import { withCoachAuth } from "@app/lib/server/auth";

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

**Note on assignLabels response shape**: `assignBlockLabelsResponseSchema === blockSchema` (Step 7.0 — verified в `block-api.schema.test.ts:103-108`). `lmsBlockApi.assignLabels` returns `Block` (full Block с embedded labels post-assign, per Step 7.1 `mapToBlockWithLabels`). No `.then(...)` wrap needed — single-value return matches schema.

**Commit 3**: `feat(platform): add http routes for block update delete and assignlabels`.

### Phase 4 — Local verification

Run from repo root in order:

```bash
pnpm --filter @repo/api-server test
# Expected: 583/583 cases (581 baseline post-Step-7.1 + 2 new prisma-error-handler cases).

pnpm check-types
# Expected: 16/16 green.

pnpm lint
# Expected: 16/16 green.

pnpm test
# Expected: 1068/1068 cases (1066 baseline + 2 new prisma-error-handler).

pnpm dep:check
# Expected: 0 violations / +4-5 modules from 1169 baseline (4 new route files + possible transient resolution).
```

If any gate fails — fix root cause; do NOT bypass. If lint-staged auto-formats imports (e.g. multi-line → single-line collapse) — accept the AST-equivalent formatting (pre-ratified pattern per Step 6.4 D-5 / 6.4.5 D-3 / 6.5 D-3 / 6.6 D-2 / 6.7 D-5 / 7.1 D-decisions family).

**Commit 4**: `docs(step-07.2): write executor output report`.

---

## § 4. Out of scope (explicit forbid list)

- **Client API + hooks** (`apps/platform/src/lib/api/endpoints/blocks.ts`, `use-blocks.ts`) — Step 7.3.
- **UI** (BlockList, BlockCard, AddBlockButton, BlockLabelSelect, BlockNotesField) — Step 7.4.
- **Intensity / TimeCap UI form widgets** — Step 7.5.
- **Schema entity routes** — Step 8.
- **Prisma schema change** — already shipped; no edit to `schema.prisma`, no `db:reset`, no seed change.
- **`packages/api-routes/src/error-handler.ts`** — DO NOT TOUCH. Existing ZodError → 400 path correct для route-layer payload validation (see § 0.7). QA-003 fix lands в api-server's `handlePrismaError` (single-package, additive — see § 3 Phase 1).
- **HTTP-layer integration tests** — routes are thin wrappers; auth factories factory-tested implicitly; api-server integration tests Step 7.1 cover business logic. Mirror Step 6.4.5 no-route-tests precedent.
- **`@@unique([sessionId, order])` schema constraint** (QA-001 carry-forward) — separate decision before Step 8 per planner discussion; out of Step 7.2 scope.
- **`analysis/artifacts/` change** — no domain semantics change.
- **Refactor of `lmsBlockApi` или `lmsSessionApi`** — Block routes are additive consumers; no touching api-server methods.
- **New error subclass `DbCorruptionError`** — InternalServerError with `{kind: "DbCorruption"}` details is the chosen shape; do NOT invent a new class.

---

## § 5. Acceptance criteria

1. **4 route files created at expected paths** (per § 1 layout table), each ≤30 LOC, mirror Session pattern verbatim.
2. **Each route wraps `withCoachAuth(withAuthRateLimit(createAuth*Handler(...), RATE_LIMIT_TIER.API))`** — auth + rate-limit + factory chain identical Session.6.4.5.
3. **Params/request/response schemas imported from `@repo/contracts/lms/block`** — no inline schema duplication.
4. **`lmsBlockApi` consumed via `@repo/api-server/lms` barrel** — `lmsBlockApi.{create,update,delete,reorder,assignLabels}` called with correct param ordering per Step 7.1 method signatures.
5. **Reorder route `.then(blocks => ({blocks}))` wrap** present for response shape per `reorderBlocksResponseSchema`.
6. **id-addressed routes at `.../[planId]/blocks/[blockId]/...`** (sessionId-free per OQ-a A1 ratification + `blockByIdParamsSchema = {planId, blockId}`).
7. **assignLabels dedicated route file `.../[blockId]/labels/route.ts`** with PUT (OQ-b B1; NOT multiplex via PATCH on `[blockId]/route.ts`).
8. **`handlePrismaError` ZodError branch added** (§ 3 Phase 1) — intercepts before final `throw error`; throws `InternalServerError({kind: "DbCorruption", entity, issues})`.
9. **2 new test cases in `prisma-error-handler.test.ts`** — (a) ZodError → InternalServerError + structured details verified; (b) non-Zod non-Prisma Error subclass regression guard.
10. **`handleApiError` в api-routes NOT edited** — no touching `packages/api-routes/src/error-handler.ts`.
11. **No HTTP-layer integration tests** — mirror Session.6.4.5 no-route-tests precedent (OQ-e E1 ratified).
12. **Verifications all-green**:
    - `pnpm check-types` 16/16
    - `pnpm lint` 16/16
    - `pnpm --filter @repo/api-server test` 583/583 (581 baseline + 2 new prisma-error-handler)
    - `pnpm test` ~1068/1068 (1066 baseline + 2 new)
    - `pnpm dep:check` 0 violations / +4-5 modules from 1169 baseline (4 new route files)
13. **Husky pre-commit + commit-msg clean** all 3 code commits + 1 docs commit без `--no-verify` / `--no-edit` / `--no-gpg-sign`. Commitlint subjects ≤100 chars fully lowercase.
14. **Regression greps return expected counts**:
    - `grep -rln "lmsBlockApi" apps/platform/src/` returns **4 files** (4 new routes).
    - `grep -rln "@repo/contracts/lms/block" apps/platform/src/` returns **4 files** (same 4 routes).
    - `grep -n "ZodError" packages/api-server/src/utils/prisma-error-handler.ts` returns **2 hits** (import + branch check).
15. **Branch convention**: all commits land on `feat/training-domain`. No `feat/<slug>` branch created. `git log --oneline feat/training-domain ^main` shows Step 7.1 commits + Step 7.2 commits with no foreign refs.

---

## § 6. Verification gates (run in this order before each commit)

Per phase:

- **After Phase 1** (handler + tests):
  - `pnpm --filter @repo/api-server test -- prisma-error-handler` — 11 cases green.
  - `pnpm --filter @repo/api-server check-types` — 1/1 green.
- **After Phase 2** (2 routes):
  - `pnpm --filter platform check-types` — 1/1 green.
  - `pnpm --filter @repo/api-server check-types` — 1/1 green (unchanged from Phase 1).
- **After Phase 3** (2 more routes):
  - `pnpm --filter platform check-types` — 1/1 green.
- **Pre-final-commit / pre-push**:
  - `pnpm check-types` (root) — 16/16.
  - `pnpm lint` (root) — 16/16.
  - `pnpm test` (root) — ~1068/1068.
  - `pnpm dep:check` (root) — 0 violations.

If a hook fails — fix root cause; never `--no-verify`. Examples:

- Commitlint subject > 100 chars → reword (do NOT amend prior commit; failed commit was never created — new commit with fixed message).
- `turbo check-types --filter="...[HEAD]"` fails downstream — unlikely (Step 7.2 additive); if happens, surface to planner first before patching cross-package.
- `lint-staged` auto-format reorders imports → accept formatted version (lint-staged stages it).

---

## § 7. Commit strategy

Per `[[husky-cross-package-squash]]` pre-check (§ 0.10 verified):

- `.husky/pre-commit` runs `turbo check-types --filter="...[HEAD]"` — fans out к downstream.
- Step 7.2 touches 2 packages but BOTH ADDITIVE:
  - `packages/api-server/utils/prisma-error-handler.ts` — new ZodError branch (behavior-narrowing for unhandled error types but signature unchanged; existing callers still get `: never` return).
  - `apps/platform/src/app/api/platform/...` — 4 new route files (no API export changes anywhere).
- Cross-commit dependency: Phase 1 (api-server patch) → Phase 2-3 (routes) — but routes don't import the patched function directly; they import `lmsBlockApi` which already exists. **No broken intermediate trees.**

**Recommended structure (3 code commits + 1 docs commit)**:

1. `feat(api-server): map mapper-side zoderror to internalservererror with dbcorruption kind`

   - `packages/api-server/src/utils/prisma-error-handler.ts` (+8 LOC)
   - `packages/api-server/src/utils/prisma-error-handler.test.ts` (+35 LOC)

2. `feat(platform): add http routes for block create and reorder`

   - `apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/blocks/route.ts` (new)
   - `apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/blocks/reorder/route.ts` (new)

3. `feat(platform): add http routes for block update delete and assignlabels`

   - `apps/platform/src/app/api/platform/training-plans/[planId]/blocks/[blockId]/route.ts` (new)
   - `apps/platform/src/app/api/platform/training-plans/[planId]/blocks/[blockId]/labels/route.ts` (new)

4. `docs(step-07.2): write executor output report`
   - `implementation/step-07.2/output.md` (per § 9 format)

**Alternative if `/feature small` Stage 7 prefers single squash** — acceptable per `[[husky-cross-package-squash]]` (squash exception default for cross-package breaking changes; single-package additive в каждой phase = per-phase OR single squash, planner pick = either). Both shapes byte-equivalent для logical revertability if squash body lists per-phase changes.

**Commit-message conventions** (per `[[commitlint-subject-case]]` + project root commitlint):

- Subject ≤ 100 chars, **fully lowercase** (acronyms too: `lms`, `crud`, `m:n`, `http`).
- Body lines ≤ 150 chars.
- No `Co-Authored-By` / `Generated-with` trailers.
- Conventional-commits prefix: `feat`, `chore`, `docs`, `refactor`, `fix`, `test`.

**Forbidden**:

- Branch creation (`git checkout -b feat/<slug>` from main) — see § Execution mode branch-cut override.
- `--no-verify` / `--no-edit` / `--no-gpg-sign` on any git command.
- Amending an existing commit on `feat/training-domain` (branch has pushed history; amending rewrites it).
- Squashing across step boundaries (Step 7.1 commits stay separate from Step 7.2 commits).

---

## § 8. Anti-patterns to avoid (will get caught in code review)

1. **Code comments** explaining `.then(blocks => ({blocks}))` wrap or ZodError branch rationale. Per `[[global-preferences]]`: no comments unless encoding non-obvious _why_; both are documented в этом prompt'е + acceptance criteria.
2. **Editing `packages/api-routes/src/error-handler.ts`** — § 0.7 + § 4 explicit forbid. Existing ZodError → 400 path correct для route-layer payload validation.
3. **Adding HTTP-layer integration tests** — out of scope per § 4; mirror Session.6.4.5 no-route-tests precedent.
4. **Creating new error subclass `DbCorruptionError`** — `InternalServerError({kind: "DbCorruption"})` is the chosen shape; new class adds surface без value.
5. **Nesting id-addressed Block routes under `.../sessions/[sessionId]/...`** — mirror Session id-addressed precedent at top level (`.../[planId]/sessions/[sessionId]/`).
6. **Multiplexing assignLabels на `[blockId]/route.ts` через PATCH** — dedicated route file mirrors Session reorder; auth-factories.ts doesn't have PATCH factory.
7. **Hardcoding response shape inline** — use Step 7.0 contract schemas (`*ResponseSchema` exports).
8. **Mocking Prisma в Phase 1 tests** — use `z.object(...).safeParse(...)` to construct real ZodError; no Prisma mocks needed for the ZodError branch test.
9. **Touching `lmsBlockApi` или any `mapToBlock*` mapper** — Block api-server slice shipped Step 7.1 untouched. If you find yourself reaching to edit `admin.ts` or `block.mapper.ts`, STOP and surface — likely a misread of this prompt's scope.
10. **Importing `ZodError` from `"@repo/contracts/..."` или other internal package** — direct import `from "zod"` (top-level dependency).

---

## § 9. Output report format (`implementation/step-07.2/output.md`)

Russian prose where natural, English for code/paths. Section headers verbatim:

```markdown
# Step 7.2 — Platform HTTP routes для Block + handlePrismaError ZodError DB-corruption defence

## Что сделано

<3-7 lines summarizing 4 routes + handlePrismaError patch + QA-003 closure>

## Изменённые/созданные файлы

<list 4 new + 2 edited paths with 1-line purpose each>

## Принятые решения

<D-1, D-2, ... per minor inline judgement calls (e.g. lint-staged auto-format, codebase pattern alignment). Each ≤ 5 lines.>

## Возникшие вопросы и как решены

<if any § 0 STOP-and-surface escalation fired — paste AskUserQuestion + planner answer + resolution commit hash. If none, write "Без escalations через § 0 — все verbatim quotes byte-for-byte matched HEAD `71803bb0`.">

## Что отложено

<list items the executor noticed but intentionally did NOT do. Examples: HTTP integration tests (Step 7.3 hooks cover route smoke through TanStack Query), QA-001 schema unique constraint (separate decision before Step 8).>

## Ссылка на `.feature-dev/<ts>/`

<full path to `/feature small` pipeline artifacts: research.md / review.md / etc.>

## Сценарий смоук-теста

**N/A** — HTTP-only step, no UI surface. Smoke resumes Step 7.4 (BlockList).

## Verification notes

<table or bullets recording actual numbers from local verification commands. Format: "expected X / got Y" with planner-range comparison.>

## Acceptance criteria self-check

<numbered checklist mirroring § 5 of this prompt with ✓/✗ per item + brief evidence (file path + line range).>
```

**Length budget**: 150-400 lines. Focus on _what diverged_ from the prompt (D-decisions, escalations) and _what's deferred_ — those are planner-actionable signals.

---

## Footer — quick reference

- **Branch**: `feat/training-domain` (long-lived; do NOT cut a feature branch).
- **Mirror target**: Session.6.4.5 routes (§ 0.1-0.3 verbatim quotes).
- **QA-003 fix location**: `packages/api-server/src/utils/prisma-error-handler.ts` (NOT api-routes/error-handler.ts).
- **4 routes**: POST create + PUT reorder (sessionId-nested) + multiplex PUT/DELETE per blockId + PUT assignLabels (sessionId-free).
- **Tests**: +2 cases в `prisma-error-handler.test.ts` only. No HTTP-layer tests.
- **Commits**: 3 atomic feat + 1 docs (or single squash — both valid). No `--no-verify`.

If anything in this prompt conflicts with `implementation/WORKFLOW.md` or `~/.claude/CLAUDE.md` global rules — STOP and surface. WORKFLOW.md + global rules win; prompt-side error is planner's fault.
