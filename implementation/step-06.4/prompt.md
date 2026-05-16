# Step 6.4 — Platform HTTP routes for day metadata + label search, with P2034 retry infrastructure

> Self-contained prompt for a fresh Opus 4.7 max-effort executor session. Run via `/feature` (full pipeline — 6 phases across 3 packages warrant the design + plan + review steps; not `/feature small`).

## § 0 — Hard triggers (STOP-and-surface to planner BEFORE writing code)

Surface to planner via `AskUserQuestion` if any of the following diverges from the verbatim current state quoted below — do NOT silently adapt. Each item is a registration-file or contract claim that planner has read at prompt-write time (2026-05-16 HEAD `d882e2ff`).

### 0.1 — Contract registration files (Phase 1 edits)

**`packages/contracts/src/entities/lms/label/label-api.schema.ts` current state (verbatim, lines 1-25):**

```ts
import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createLabelSchema, labelSchema, updateLabelSchema } from "./label.schema";

export const getLabelsResponseSchema = z.array(labelSchema);

export const getLabelByIdParamsSchema = idParamSchema;

export const createLabelRequestSchema = createLabelSchema;

export const updateLabelParamsSchema = idParamSchema;

export const updateLabelRequestSchema = updateLabelSchema;

export const deleteLabelParamsSchema = idParamSchema;

export const labelSearchParamsSchema = z.object({
  q: z.string().min(1).max(200).optional(),
});

export const getLabelsPageDataResponseSchema = z.object({
  labels: getLabelsResponseSchema,
});
```

**Intent (additive only):** add `.trim()` transform on `q` and add `level: appLevelSchema.optional()`. `appLevelSchema` already exported from `./label.schema:12` (`z.enum(APP_LEVELS)`, `APP_LEVELS = ["DAY", "SESSION", "BLOCK"]` from `./label.constants:6-7`) — import it from `./label.schema`.

**Final state of `labelSearchParamsSchema` (verbatim, what executor writes):**

```ts
export const labelSearchParamsSchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  level: appLevelSchema.optional(),
});
```

If any other line in the file looks different from § 0.1 verbatim — STOP, surface.

### 0.2 — DAY_OF_WEEK_TO_PRISMA callsites (Phase 3 hoist source)

Three callsites today, byte-identical 9-line const + `as const satisfies Record<DayOfWeek, PrismaDayOfWeek>`:

- **`packages/api-server/src/endpoints/lms/session/admin.ts:23-31`** (currently `import { Prisma, type DayOfWeek as PrismaDayOfWeek } from "@prisma/client"` line 1 + `import { type DayOfWeek } from "@repo/contracts/lms/_shared"` line 3)
- **`packages/api-server/src/endpoints/lms/day/admin.ts:18-26`** (same import shape)
- **`packages/api-server/src/endpoints/lms/week/admin.ts:16-24`** (currently `import { type DayOfWeek as PrismaDayOfWeek } from "@prisma/client"` line 1 + `import { type DayOfWeek, dayOfWeekValues } from "@repo/contracts/lms/_shared"` line 3)

Each file's current `DAY_OF_WEEK_TO_PRISMA` declaration is identical:

```ts
const DAY_OF_WEEK_TO_PRISMA = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const satisfies Record<DayOfWeek, PrismaDayOfWeek>;
```

If any callsite's declaration differs (e.g. extra value, different sort, different cast) — STOP, surface (hoist breaks).

### 0.3 — `_shared/index.ts` current state (Phase 3 barrel edit)

**`packages/api-server/src/endpoints/lms/_shared/index.ts` (verbatim):**

```ts
export * from "./date";
```

**Final state (additive 1 line):**

```ts
export * from "./date";
export * from "./day-of-week";
```

### 0.4 — `utils/index.ts` current state (Phase 4 barrel edit)

**`packages/api-server/src/utils/index.ts` (verbatim):**

```ts
export * from "./date-helpers";
export * from "./find-or-throw";
export * from "./json-record";
export * from "./not-implemented";
export * from "./prisma-error-handler";
export * from "./to-input-json";
```

**Final state (additive 1 line, alphabetical insertion):**

```ts
export * from "./date-helpers";
export * from "./find-or-throw";
export * from "./json-record";
export * from "./not-implemented";
export * from "./prisma-error-handler";
export * from "./retry-on-p2034";
export * from "./to-input-json";
```

### 0.5 — `endpoints/lms/index.ts` (verbatim, NO edit expected)

```ts
export * from "./_shared";
export * from "./day";
export * from "./exercise";
export * from "./label";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

Phase 3 adds `_shared/day-of-week.ts` re-exported through `_shared/index.ts` → already reachable via this barrel's `export * from "./_shared"`. No edit to this file expected. If executor finds itself needing to edit it — STOP, surface (likely importing wrong).

### 0.6 — `packages/api-routes/src/error-handler.ts` current state (Phase 2 edit)

The 429 retry-after pattern lives at lines 61-81:

```ts
const appErrorResponse = (error: AppError, requestId: string | undefined): NextResponse => {
  const headers = buildHeaders(requestId) ?? new Headers();

  if (error.statusCode === 429 && typeof error.details?.retryAfter === "number") {
    headers.set("Retry-After", String(error.details.retryAfter));
  }
  // ...
```

**Intent (additive):** mirror the 429 branch with a 503 branch, immediately after it. Final state:

```ts
const appErrorResponse = (error: AppError, requestId: string | undefined): NextResponse => {
  const headers = buildHeaders(requestId) ?? new Headers();

  if (error.statusCode === 429 && typeof error.details?.retryAfter === "number") {
    headers.set("Retry-After", String(error.details.retryAfter));
  }

  if (error.statusCode === 503 && typeof error.details?.retryAfter === "number") {
    headers.set("Retry-After", String(error.details.retryAfter));
  }

  const redactedDetails = error.details ? redactPii(error.details) : undefined;
  // ... rest unchanged
```

Two independent `if` branches (not `else if`) — statusCode is a single value, only one fires per request; this matches the existing 429 idiom of "extract header before constructing body".

### 0.7 — Zero-state consumer verification per `[[planner-consumer-pattern-read]]`

This step adds **first consumer surface** for three api-server methods. Current consumers verified by planner at prompt-write time:

- `lmsDayMetadataApi.setLabel` — consumers: **0** (Step 6.5 hooks will be first; Step 6.4 routes are first).
- `lmsDayMetadataApi.setNotes` — consumers: **0**.
- `lmsLabelPlatformApi.list` — consumers: **0**.

Contract additions in Phase 1 (`labelSearchParamsSchema` adds `level`, `q` gains `.trim()`):

- `labelSearchParamsSchema` was added in Step 6.3 (commit `4aca6ea0`); current consumers across `apps/*` + `packages/*`: **0** (Step 6.4 route is first; Step 6.5 hook second).
- `appLevelSchema` is consumed by `label.schema.ts:14-20` (`applicableLevelsSchema`) and by validation in `lmsDayMetadataApi.setLabel` + `lmsSessionApi.{create,update}` (cast `as AppLevelValue[]`). Reusing the same symbol — no shape mutation. No cascade.

If during execution you find a consumer that planner missed — STOP, surface.

### 0.8 — Husky hooks / turbo pipeline (Phase 7 commit-strategy validation)

`.husky/pre-commit` (verbatim):

```
node scripts/check-secrets.mjs
npx lint-staged
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"
```

`.husky/pre-push` (verbatim):

```
pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"
```

`turbo.json` fans `check-types` along `^check-types` dependency graph. All Step 6.4 changes are **additive** (new exports, new files, new optional schema fields). No commit in the planned 5-7 commit sequence (§ 7) leaves downstream packages broken — per-layer atomic commits hold. **No squash needed**. If during execution you discover a planned commit fails `turbo check-types --filter="...[HEAD]"`, STOP and surface (per `[[husky-cross-package-squash]]`).

---

## § 1 — Goal

Wire **3 platform HTTP routes** consuming 3 already-shipped api-server methods, plus bundle 3 deferred follow-ups into one cohesive vertical slice:

**Routes (apps/platform):**

- `GET /api/platform/labels/search?q=<query>&level=<DAY|SESSION|BLOCK>` → `lmsLabelPlatformApi.list`
- `PUT /api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/label` → `lmsDayMetadataApi.setLabel`
- `PUT /api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/notes` → `lmsDayMetadataApi.setNotes`

**Bundled deferred follow-ups (planner D-decisions, ratified 2026-05-16):**

1. **`DAY_OF_WEEK_TO_PRISMA` hoist** to `endpoints/lms/_shared/day-of-week.ts` (3 callsites today, DRY-merit alone justifies extraction).
2. **`retryOnP2034` helper** in `packages/api-server/src/utils/` — wraps `prisma.$transaction(..., Serializable)` calls with 2 retries + jittered backoff. Apply to `lmsDayMetadataApi.{setLabel, setNotes}` (the two new HTTP-exposed concurrent-write paths). `lmsSessionApi.create` apply deferred to Step 6.4.5 per OQ-G(i) ratification.
3. **`?q=` normalization** via Zod `.trim()` transform at contract level + **bump `LABEL_SEARCH_CAP` 50 → 500** for coach-preload UX (per OQ-F(i) ratification). Bundled with Phase 1 + Phase 5.
4. **`level` filter on label search** — contract gains optional `level: appLevelSchema` field; api-server filters by `applicableLevels { array_contains: level }`. Driven by coach UX requirement: autocomplete for Day label must show only labels with `applicableLevels.includes("DAY")`, etc.

**Companion infra:**

- `@repo/api-routes/error-handler` extended with `503 + Retry-After` branch (4 LOC, mirrors existing 429 path). `ServiceUnavailableError` already exists in `@repo/errors:94-102`; this wires its `details.retryAfter` to the response header.

---

## § 2 — Context (read these BEFORE writing anything)

### 2.1 — Workflow / planner-discipline files

- `implementation/WORKFLOW.md` — six-flavour planner-discipline checklist, husky-squash exception, language conventions.
- `implementation/PLANNING_STATE.md` § "Current step" + "Next action" — authoritative scope confirmation (Step 6.4 = day-metadata + labels, Session routes → 6.4.5).
- `implementation/IMPLEMENTATION_LOG.md` Step 6.0 → 6.3 entries + Lesson-learned addenda (especially Step 6.1 / 6.1.5 / 6.2 — adversarial pass, husky-cross-package-squash, planner-consumer-pattern-read flavours).

### 2.2 — Domain semantics (no new domain spec in this step; cite if a decision becomes ambiguous)

- `analysis/artifacts/06-formalization/schema.prisma:131-172` — `DayOfWeek` enum + `Day` model (`labelId`, `notes`, `@@unique([weekId, dayOfWeek])`).
- `analysis/artifacts/06-formalization/schema.prisma:313-327` — `Label` model (`applicableLevels Json`; storage = string array `["DAY"|"SESSION"|"BLOCK"]`).
- `analysis/artifacts/06-formalization/implementation-notes.md §4.2` — "Label.applicableLevels defaults"; confirms applicableLevels filtering is coach-driven not engineer-cargo. Per `[[coach-pov-first]]`: every contract field cited verbatim from analysis at planner time.
- D7 (PLANNING_STATE) — Day is lazily-materialized calendar slot; day-metadata setters lazy-upsert (Week + Day) inside Serializable tx, no DELETE/POST surface.

### 2.3 — Existing infrastructure (verbatim usage references)

- `packages/api-routes/src/auth-factories.ts:26-39` — `createAuthGetWithQueryHandler` signature.
- `packages/api-routes/src/auth-factories.ts:125-142` — `createAuthPutByParamHandler` signature; idempotency auto-wired via `wrapAuthHandler(inner, JSON_CONFIG)`.
- `packages/api-routes/src/rate-limit/rate-limit-tiers.ts:1-5` — three tiers (`AUTH=5`, `PUBLIC=30`, `API=100` req/min). All Step 6.4 routes use `RATE_LIMIT_TIER.API` per OQ-D(no-differentiation) ratification.
- `packages/api-routes/src/rate-limit/with-rate-limit.ts:54-87` — `withAuthRateLimit` wrapper (per-userId limiter).
- `apps/platform/src/lib/server/auth.ts:7` — `withCoachAuth` (`COACH_ROLES = [COACH, HEAD_COACH, ADMIN]`).
- `packages/errors/src/http-errors.ts:94-102` — `ServiceUnavailableError` (statusCode 503).
- `packages/api-routes/src/error-handler.ts:61-81` — existing 429 `Retry-After` branch (mirror target for Phase 2).

### 2.4 — Existing api-server methods (DO NOT modify business logic, only retry-wrap)

- `packages/api-server/src/endpoints/lms/day/admin.ts:33-179` — `lmsDayMetadataApi.{setLabel, setNotes}`. Two `prisma.$transaction(..., Serializable)` calls (lines 60-109 and 143-172). Phase 4 wraps both in `retryOnP2034(async () => { return prisma.$transaction(...) }, opts?)`.
- `packages/api-server/src/endpoints/lms/label/platform.ts:1-23` — `lmsLabelPlatformApi.list`. Phase 5 extends signature `(userId, query?: { q?: string; level?: AppLevelValue }) → Promise<Label[]>`, adds `applicableLevels { array_contains: level }` to where-clause, bumps `LABEL_SEARCH_CAP` 50 → 500.
- `packages/api-server/src/endpoints/lms/week/admin.ts:1-80` — `lmsWeekApi` (NOT modified business-logic; only `DAY_OF_WEEK_TO_PRISMA` import refactored).
- `packages/api-server/src/endpoints/lms/session/admin.ts:1-253` — `lmsSessionApi` (NOT modified business-logic; only `DAY_OF_WEEK_TO_PRISMA` import refactored).

### 2.5 — Existing platform route precedents (verbatim pattern reference)

- `apps/platform/src/app/api/platform/users/search/route.ts` — closest analog for `GET /labels/search` (auth + query-validated GET).
- `apps/platform/src/app/api/platform/training-plans/[planId]/weeks/[startDate]/route.ts` — closest analog for the day-metadata PUTs (auth + param-validated PUT, calls api method directly).

### 2.6 — Contract files unchanged in this step (consume only)

- `packages/contracts/src/entities/lms/day/day-api.schema.ts:7-17` — `dayByAddressParamsSchema`, `updateDayLabelRequestSchema/ResponseSchema`, `updateDayNotesRequestSchema/ResponseSchema`. Route handlers `paramsSchema.parse(await context.params)` against `dayByAddressParamsSchema`.
- `packages/contracts/src/entities/lms/label/label.schema.ts:12` — `appLevelSchema = z.enum(APP_LEVELS)`. Imported into `label-api.schema.ts` Phase 1.

### 2.7 — Memory cross-links (read at session start automatically)

- `[[planner-consumer-pattern-read]]` — sixth flavour; § 0.7 verifies zero consumers explicit.
- `[[planner-adversarial-review]]` — fourth flavour; § 6 adversarial test coverage explicit.
- `[[husky-cross-package-squash]]` — fifth flavour; § 7 commit strategy validated.
- `[[planner-verbatim-registration]]` — third flavour; § 0 verbatim quotes of registration files.
- `[[coach-pov-first]]` — second flavour; § 2.2 analysis citations.
- `[[scope-via-existing-patterns]]` — first flavour; § 2.5 + 2.6 verbatim precedent files.
- `[[postgres-ssi-upsert-unique-key]]` — engineering knowledge; § 4 retry helper is the production realization of this rule.
- `[[discipline-program DB non-prod]]` — `pnpm --filter @repo/api-server db:reset` per ADR-0019 if schema-touching; **NOT needed this step** (no Prisma schema change).
- `[[no-tech-debt-in-mocks]]` — applies to retry helper test fixtures; no shortcut mocks.
- `[[neon-dev-direct-url]]` — DATABASE_URL non-pooler; if local test runs flake on pool exhaustion, planner has known issue path.

---

## § 3 — Scope (per-phase plan; in execution order)

### Phase 1 — Contract extension: `labelSearchParamsSchema` adds `level` + trim

**Files (1 edited):**

- `packages/contracts/src/entities/lms/label/label-api.schema.ts` — edit `labelSearchParamsSchema` per § 0.1 final state; add import `appLevelSchema` from `./label.schema`.

**Test additions (1 file edited):**

Sibling `day` slice has a single `day.schema.test.ts` (no separate `day-api.schema.test.ts`); same convention for `session` and `label` today. Append a new `describe("labelSearchParamsSchema", () => { ... })` block to **`packages/contracts/src/entities/lms/label/label.schema.test.ts`** (existing file — adds at end).

Cases (≥6):

1. `safeParse({})` → success, both fields undefined (preload-no-filter use case).
2. `safeParse({ q: "  push  " })` → success, `data.q === "push"` (trim applied).
3. `safeParse({ q: "   " })` → failure (post-trim empty < min 1).
4. `safeParse({ q: "a".repeat(201) })` → failure (max 200).
5. `safeParse({ level: "DAY" })` → success.
6. `safeParse({ level: "INVALID" })` → failure (Zod enum).
7. `safeParse({ q: "push", level: "SESSION" })` → success, both fields set.

**Acceptance:** `pnpm --filter @repo/contracts check-types` + `lint` + `test` green; net +5 or +7 new test cases.

### Phase 2 — api-routes: 503 Retry-After header support

**Files (1 edited):**

- `packages/api-routes/src/error-handler.ts` — add 503 branch per § 0.6 final state. Pure additive (independent `if`, not `else if`).

**Test additions (probably skip — `error-handler.test.ts` is small / may not exist):**

Check if `packages/api-routes/src/error-handler.test.ts` exists. If yes — extend with two cases: (a) `appErrorResponse(new ServiceUnavailableError("X", { retryAfter: 7 }))` returns response with `Retry-After: 7`; (b) `ServiceUnavailableError("X")` (no retryAfter) returns no `Retry-After` header. If file doesn't exist — skip test addition (creating a brand-new test file for 4 LOC of additive infra is overkill; behavior is verified end-to-end via day-metadata retry-exhaustion integration in Phase 6).

**Acceptance:** `pnpm --filter @repo/api-routes check-types` + `lint` + `test` green.

### Phase 3 — api-server: `DAY_OF_WEEK_TO_PRISMA` hoist to `_shared/day-of-week.ts`

**Files (1 new + 4 edited):**

- **New:** `packages/api-server/src/endpoints/lms/_shared/day-of-week.ts`:

```ts
import { type DayOfWeek as PrismaDayOfWeek } from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";

export const DAY_OF_WEEK_TO_PRISMA = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const satisfies Record<DayOfWeek, PrismaDayOfWeek>;
```

- **Edit:** `packages/api-server/src/endpoints/lms/_shared/index.ts` — append `export * from "./day-of-week";` (per § 0.3 final state).

- **Edit:** `packages/api-server/src/endpoints/lms/{session,day,week}/admin.ts` (3 files):
  - Drop local `DAY_OF_WEEK_TO_PRISMA` declaration (lines 23-31 / 18-26 / 16-24 respectively).
  - Drop now-unused `PrismaDayOfWeek` import segment from `@prisma/client` import line. **Pay attention**: `session/admin.ts:1` imports `{ Prisma, type DayOfWeek as PrismaDayOfWeek }` — keep `Prisma`, drop `type DayOfWeek as PrismaDayOfWeek`. `day/admin.ts:1` same pattern (`Prisma` kept). `week/admin.ts:1` imports ONLY `{ type DayOfWeek as PrismaDayOfWeek }` — drop the whole import line.
  - Add `import { DAY_OF_WEEK_TO_PRISMA } from "../_shared";` — the existing barrel will now re-export `day-of-week.ts`. If `../_shared` is already imported for `resolveWeekStartDate` (it is in `session/admin.ts:21` and `day/admin.ts:16`), merge into the same import statement; in `week/admin.ts:14` (`import { resolveWeekStartDate } from "../_shared";`), merge into one line: `import { DAY_OF_WEEK_TO_PRISMA, resolveWeekStartDate } from "../_shared";`.
  - **DO NOT touch** any business-logic line — body of methods stays byte-identical.

**Acceptance:**

- `grep -rn "DAY_OF_WEEK_TO_PRISMA = {" packages/api-server/src/endpoints/` returns exactly 1 match (the new shared file).
- `grep -rn "DAY_OF_WEEK_TO_PRISMA\[" packages/api-server/src/endpoints/` still returns the same number of usage sites as before (5 across 3 files — verify pre-edit count first).
- `pnpm --filter @repo/api-server check-types` + `lint` + `test` green; all existing tests still pass (no behavioral change).

### Phase 4 — api-server: `retryOnP2034` helper + apply to day metadata

**Files (2 new + 1 edited + 1 edited barrel):**

- **New:** `packages/api-server/src/utils/retry-on-p2034.ts`:

```ts
import { Prisma } from "@prisma/client";

import { ServiceUnavailableError } from "@repo/errors";

export type RetryOnP2034Options = {
  attempts?: number;
  jitterMsRange?: readonly [number, number];
  retryAfterSeconds?: number;
};

const DEFAULTS = {
  attempts: 2,
  jitterMsRange: [50, 200] as const,
  retryAfterSeconds: 5,
};

const isP2034 = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const jitter = (range: readonly [number, number]) =>
  range[0] + Math.random() * (range[1] - range[0]);

export const retryOnP2034 = async <T>(
  fn: () => Promise<T>,
  options?: RetryOnP2034Options,
): Promise<T> => {
  const attempts = options?.attempts ?? DEFAULTS.attempts;
  const range = options?.jitterMsRange ?? DEFAULTS.jitterMsRange;
  const retryAfterSeconds = options?.retryAfterSeconds ?? DEFAULTS.retryAfterSeconds;

  if (attempts < 1) {
    throw new Error("retryOnP2034: attempts must be >= 1");
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isP2034(error)) {
        throw error;
      }

      lastError = error;

      if (attempt < attempts - 1) {
        await sleep(jitter(range));
      }
    }
  }

  throw new ServiceUnavailableError(
    "Resource is being modified concurrently, please retry in a moment",
    { retryAfter: retryAfterSeconds, lastErrorCode: "P2034" },
  );
};
```

**Design notes (intentional, do NOT deviate):**

- `attempts: 2` default = 1 initial try + 1 retry = 2 attempts total. On exhaustion → `ServiceUnavailableError` with `retryAfter: 5`.
- Jitter `[50, 200]` ms uniform random. Pure `Math.random()` is fine — non-cryptographic timing, no determinism needed in production. Tests can spy on `Math.random` if needed for deterministic timing assertions.
- `lastError` captured for log/observability traceback in helper but **not re-thrown** — semantically post-retry it is a 503 (service can't fulfill right now), not a 409 (this request conflicts). The `lastErrorCode: "P2034"` detail field exposes the underlying cause for monitoring.
- Non-P2034 errors **rethrown immediately** without retry — preserves `NotFoundError` / `BadRequestError` / `ForbiddenError` paths inside the transaction.

- **New:** `packages/api-server/src/utils/retry-on-p2034.test.ts` — unit test (mirrors `prisma-error-handler.test.ts` style for `Prisma.PrismaClientKnownRequestError` fixture creation):

```ts
import { Prisma } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceUnavailableError } from "@repo/errors";

import { retryOnP2034 } from "./retry-on-p2034";

const makeP2034 = (): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError("Serialization failure", {
    code: "P2034",
    clientVersion: "5.0.0",
  });

describe("retryOnP2034", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns result when fn succeeds on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("ok");

    const result = await retryOnP2034(fn);

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries once on P2034 and returns result on success", async () => {
    const fn = vi.fn().mockRejectedValueOnce(makeP2034()).mockResolvedValue("ok");

    vi.spyOn(Math, "random").mockReturnValue(0);

    const result = await retryOnP2034(fn);

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws ServiceUnavailableError after exhausting retries on P2034", async () => {
    const fn = vi.fn().mockRejectedValue(makeP2034());

    vi.spyOn(Math, "random").mockReturnValue(0);

    await expect(retryOnP2034(fn)).rejects.toThrow(ServiceUnavailableError);
    await expect(retryOnP2034(fn)).rejects.toMatchObject({
      statusCode: 503,
      details: { retryAfter: 5, lastErrorCode: "P2034" },
    });
    expect(fn).toHaveBeenCalled();
  });

  it("rethrows non-P2034 errors immediately without retry", async () => {
    const otherError = new Error("Random failure");
    const fn = vi.fn().mockRejectedValue(otherError);

    await expect(retryOnP2034(fn)).rejects.toBe(otherError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("rethrows non-P2034 Prisma errors immediately", async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "5.0.0",
    });
    const fn = vi.fn().mockRejectedValue(p2002);

    await expect(retryOnP2034(fn)).rejects.toBe(p2002);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("honors custom attempts option", async () => {
    const fn = vi.fn().mockRejectedValue(makeP2034());

    vi.spyOn(Math, "random").mockReturnValue(0);

    await expect(retryOnP2034(fn, { attempts: 3 })).rejects.toThrow(ServiceUnavailableError);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws synchronously when attempts < 1", async () => {
    const fn = vi.fn();

    await expect(retryOnP2034(fn, { attempts: 0 })).rejects.toThrow(/attempts must be >= 1/);
    expect(fn).not.toHaveBeenCalled();
  });

  it("uses ServiceUnavailableError with custom retryAfterSeconds", async () => {
    const fn = vi.fn().mockRejectedValue(makeP2034());

    vi.spyOn(Math, "random").mockReturnValue(0);

    await expect(retryOnP2034(fn, { retryAfterSeconds: 30 })).rejects.toMatchObject({
      details: { retryAfter: 30 },
    });
  });
});
```

- **Edit:** `packages/api-server/src/utils/index.ts` — add `export * from "./retry-on-p2034";` (per § 0.4 final state, alphabetical position).

- **Edit:** `packages/api-server/src/endpoints/lms/day/admin.ts` — wrap both `prisma.$transaction(..., Serializable)` calls in `retryOnP2034(() => prisma.$transaction(...))`. Import `retryOnP2034` from `../../../utils` (same line as `handlePrismaError` if `handlePrismaError` already imported from there — barrel re-export). Concrete change:

Before (lines ~59-114, `setLabel` method):

```ts
try {
  const day = await prisma.$transaction(
    async (tx) => {
      // ... existing body
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return mapToDaySlot(dayOfWeek, day);
} catch (error) {
  return handlePrismaError(error, { entity: "Day" });
}
```

After:

```ts
try {
  const day = await retryOnP2034(() =>
    prisma.$transaction(
      async (tx) => {
        // ... existing body
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  );

  return mapToDaySlot(dayOfWeek, day);
} catch (error) {
  return handlePrismaError(error, { entity: "Day" });
}
```

Same wrap for `setNotes` body (~143-172). **CRITICAL:** `ServiceUnavailableError` thrown from `retryOnP2034` is an `AppError` subclass — `handlePrismaError` (`utils/prisma-error-handler.ts:49 throw error`) **rethrows non-Prisma errors as-is**, so `ServiceUnavailableError` propagates out cleanly through the existing catch. NO change to the `catch` block needed.

**DO NOT** add or change any other line in `day/admin.ts` (the verifyPlanOwnership / verifyPlanEditable / null-on-unmaterialized short-circuit / applicableLevels validation logic is unchanged).

**Acceptance:**

- `pnpm --filter @repo/api-server check-types` + `lint` green.
- `pnpm --filter @repo/api-server test src/utils/retry-on-p2034.test.ts` — 8/8 green.
- `pnpm --filter @repo/api-server test src/endpoints/lms/day` — existing 15+ cases unchanged (no behavioral diff for the happy-path; concurrent-write tests Step 6.2 case 13 still uses `Promise.allSettled` against pre-materialized Day, retry doesn't affect outcome — at least one fulfilled still holds).

### Phase 5 — api-server: `lmsLabelPlatformApi.list` level filter + cap bump

**Files (2 edited):**

- **Edit:** `packages/api-server/src/endpoints/lms/label/platform.ts`. Final shape:

```ts
import { type Label, type LabelSearchParams } from "@repo/contracts/lms/label";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToLabel } from "../../../mappers/lms";

export const LABEL_SEARCH_CAP = 500;

export const lmsLabelPlatformApi = {
  list: async (userId: string, query?: LabelSearchParams): Promise<Label[]> => {
    await requireCoachLikeRole(userId);

    const { q, level } = query ?? {};

    const where = {
      ...(q !== undefined && { nameLower: { contains: q.toLowerCase() } }),
      ...(level !== undefined && { applicableLevels: { array_contains: level } }),
    };

    const rows = await prisma.label.findMany({
      ...(Object.keys(where).length > 0 && { where }),
      orderBy: { nameLower: "asc" },
      take: LABEL_SEARCH_CAP,
    });

    return rows.map(mapToLabel);
  },
};
```

**Design notes:**

- `LABEL_SEARCH_CAP = 500` (was 50), **exported** so the test file can reference it for the cap-regression assertion (avoids hardcoded magic number drift between code + test).
- Signature changed from `query?: string` to `query?: LabelSearchParams` — re-uses the contract type directly (sibling precedent: `lmsSessionApi.create` imports `type CreateSessionData from "@repo/contracts/lms/session"` etc.). Route handler can pass the Zod-validated query object as-is without re-destructuring or excess-property-check fights under `exactOptionalPropertyTypes`.
- `LabelSearchParams = z.infer<typeof labelSearchParamsSchema>` already exported from `@repo/contracts/lms/label` via `label-api.types.ts` (re-exported through `label/index.ts`).
- `where` built incrementally; `Object.keys(where).length > 0` gate avoids passing empty `where: {}` to Prisma — matches sibling pattern `admin.ts:16-23` for `exactOptionalPropertyTypes` safety.
- `applicableLevels` is a Prisma `Json` column storing `string[]`. Prisma's `array_contains: "DAY"` checks JSON array containment via Postgres `@>` operator — efficient enough for catalog ≤ 500 rows without an index.

- **Edit:** `packages/api-server/src/endpoints/lms/label/platform.test.ts` — adapt + extend:

Adapt (1 case):

- Existing "caps the response at 50 rows even when more rows exist" — **rewrite** to use the exported `LABEL_SEARCH_CAP` constant. To avoid inserting 501 labels on every test run (slow under serial suite), make the test **import LABEL_SEARCH_CAP** and assert behavior with a smaller realistic count (`60 labels < 500 cap → all 60 returned`), plus a separate explicit-cap test. Recommended approach: rename existing case to **"returns all labels when total is below LABEL_SEARCH_CAP"** (uses 60 fixtures, asserts `rows.length === 60`). Add second case **"caps the response at LABEL_SEARCH_CAP rows when more exist"** that creates `LABEL_SEARCH_CAP + 1 = 501` labels in a single `Promise.all` and asserts `rows.length === LABEL_SEARCH_CAP`. **Acceptable test slowness** (~2-3s for 501 fixture inserts) — documented and intentional. Export `LABEL_SEARCH_CAP` from `platform.ts` so test references it; if module-export feels weird, define a module-internal `getLabelSearchCap()` getter — pick whichever feels less invasive (planner preference: just export the const).

Extend (≥5 new cases for `level` filter + trim consumption):

```ts
it("filters by applicableLevels using level parameter (DAY only)", async () => {
  const coach = await createTestCoach();
  // ... boilerplate
  const dayOnly = await seedLabel({ name: "Push Day", levels: ["DAY"] });
  const sessionOnly = await seedLabel({ name: "Long Session", levels: ["SESSION"] });
  const blockOnly = await seedLabel({ name: "EMOM Block", levels: ["BLOCK"] });

  const rows = await lmsLabelPlatformApi.list(coach.user.id, { level: "DAY" });
  const ours = rows.filter((row) => [dayOnly.id, sessionOnly.id, blockOnly.id].includes(row.id));

  expect(ours.map((row) => row.id)).toEqual([dayOnly.id]);
});

it("includes labels with multi-level applicability under each matched level", async () => {
  const coach = await createTestCoach();
  // ...
  const multi = await seedLabel({ name: "Multi", levels: ["DAY", "SESSION"] });

  const day = await lmsLabelPlatformApi.list(coach.user.id, { level: "DAY" });
  const session = await lmsLabelPlatformApi.list(coach.user.id, { level: "SESSION" });
  const block = await lmsLabelPlatformApi.list(coach.user.id, { level: "BLOCK" });

  expect(day.some((row) => row.id === multi.id)).toBe(true);
  expect(session.some((row) => row.id === multi.id)).toBe(true);
  expect(block.some((row) => row.id === multi.id)).toBe(false);
});

it("combines q and level filters with AND semantics", async () => {
  const coach = await createTestCoach();
  // ...
  const pushDay = await seedLabel({ name: "Push Day", levels: ["DAY"] });
  const pushSession = await seedLabel({ name: "Push Session", levels: ["SESSION"] });
  const pullDay = await seedLabel({ name: "Pull Day", levels: ["DAY"] });

  const rows = await lmsLabelPlatformApi.list(coach.user.id, { q: "push", level: "DAY" });
  const ours = rows.filter((row) => [pushDay.id, pushSession.id, pullDay.id].includes(row.id));

  expect(ours.map((row) => row.id)).toEqual([pushDay.id]);
});

it("returns all labels when no q and no level provided (preload)", async () => {
  // existing "returns all labels sorted by nameLower asc when no query is supplied" essentially
  // re-asserted with explicit empty query object — confirm parity
});

it("applies cap to no-query preload when total exceeds LABEL_SEARCH_CAP", async () => {
  // 501-label fixture, length === LABEL_SEARCH_CAP
});
```

**Update fixture helper** `seedLabel` — current helper takes `name` only and hardcodes `applicableLevels: ["DAY"]`. Refactor to `seedLabel({ name, levels = ["DAY"] }: { name: string; levels?: AppLevelValue[] })`. Update all existing call sites (use `seedLabel({ name: "Push" })` for prior single-arg behavior).

**Acceptance:**

- `pnpm --filter @repo/api-server test src/endpoints/lms/label/platform.test.ts` — net +5 cases (11 → 16 or thereabouts; one case rewritten = no net loss; new cap test added).
- All existing case names + assertions semantically preserved; renames documented in commit body.

### Phase 6 — apps/platform: 3 new route files

**Files (3 new):**

- **New:** `apps/platform/src/app/api/platform/labels/search/route.ts`:

```ts
import {
  createAuthGetWithQueryHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsLabelPlatformApi } from "@repo/api-server/lms";
import { getLabelsResponseSchema, labelSearchParamsSchema } from "@repo/contracts/lms/label";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (userId, query) => lmsLabelPlatformApi.list(userId, query),
      labelSearchParamsSchema,
      getLabelsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
```

**Adversarial notes** the executor should confirm by mental simulation:

- Anonymous request → `withCoachAuth` → `UnauthorizedError` → 401.
- ATHLETE user → `withCoachAuth` → `ForbiddenError` → 403.
- `?q=&level=DAY` (whitespace q) → Zod trim → empty → min(1) fail → 400 (no api call).
- `?q=push&level=INVALID` → Zod enum reject → 400.
- 101st request in 60s window per userId → `TooManyRequestsError` → 429 + `Retry-After`.
- Response shape stays `Label[]`; client iterates as-is.

- **New:** `apps/platform/src/app/api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/label/route.ts`:

```ts
import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsDayMetadataApi } from "@repo/api-server/lms";
import {
  dayByAddressParamsSchema,
  updateDayLabelRequestSchema,
  updateDayLabelResponseSchema,
} from "@repo/contracts/lms/day";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, startDate, dayOfWeek }, data) =>
        lmsDayMetadataApi.setLabel(userId, planId, startDate, dayOfWeek, data),
      dayByAddressParamsSchema,
      updateDayLabelRequestSchema,
      updateDayLabelResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
```

- **New:** `apps/platform/src/app/api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/notes/route.ts`:

Symmetric — replace `setLabel` → `setNotes`, `updateDayLabel{Request,Response}Schema` → `updateDayNotes{Request,Response}Schema`. Identical wrapper structure.

**Adversarial notes for both PUTs:**

- Anonymous / non-coach → 401 / 403.
- Invalid `[dayOfWeek]` value (not in DayOfWeek enum) → Zod reject → 400.
- Plan owned by another coach → `ForbiddenError` from `verifyPlanOwnership` → 403.
- Plan archived → `ForbiddenError` from `verifyPlanEditable` → 403.
- Plan deleted (soft-delete) → `NotFoundError` → 404.
- `labelId` references non-existent label → `NotFoundError` → 404.
- `labelId` references label without "DAY" in applicableLevels → `BadRequestError` → 400.
- Concurrent same-key write races SSI → `retryOnP2034` catches P2034 → 1 retry → if exhausted → `ServiceUnavailableError` → 503 with `Retry-After: 5`.
- `Idempotency-Key` header sent by client (Step 6.5+) → framework dedups via `wrapAuthHandler(inner, JSON_CONFIG)` (already wired in `createAuthPutByParamHandler`); first response cached for 24h.
- Rate limit (101st req / 60s / userId) → 429 + `Retry-After`.

**Acceptance:**

- `pnpm --filter @app/platform check-types` + `lint` green.
- `pnpm dep:check` 0/X violations (no `platform-no-cms-billing` regression; `apps/platform → @repo/api-server/lms` already allowed).
- No new platform tests in this step — UI consumer + smoke test arrive in Step 6.5/6.6/6.7. Adversarial coverage is by code review + api-server integration tests (Phase 4 +5) which exercise the api methods directly.

---

## § 4 — Out of scope (explicit)

The following are NOT this step's work — surface to planner if any becomes ambient:

- Session HTTP routes (POST create, PUT update, DELETE, PATCH:reorder) — Step 6.4.5.
- Apply `retryOnP2034` to `lmsSessionApi.create` — Step 6.4.5 (1-line change once helper exists).
- Platform client API `createLabelsAPI` / `createDayMetadataAPI` — Step 6.5.
- Platform hooks `useLabelSearch` / `useUpdateDayLabel` / `useUpdateDayNotes` — Step 6.5.
- UI consumers (DayRow label autocomplete, day-notes inline edit) — Step 6.6.
- GIN expression index on `Label.applicableLevels` — perf optimization for catalog > 2k labels, not realistic at current scale.
- Pagination / cursor on `lmsLabelPlatformApi.list` — `LABEL_SEARCH_CAP=500` covers realistic catalog; revisit if/when peak > 500.
- Symbol rename `cms{Label,Exercise}AdminApi` → `lms*` — Step 6.1.5 carry-forward, low priority.
- `?q=` zero-width-character strip — paranoid; Step 6.3 admin precedent strips only on create/update label, not search. Trim is enough.
- WeekGrid consumer changes — Step 6.6 (UI).
- Smoke test — `N/A` for this step (no UI surface).

---

## § 5 — Acceptance criteria (numbered, must hold at session-end)

### 5.1 — File pivot count

- **New (6):** `_shared/day-of-week.ts`, `utils/retry-on-p2034.ts`, `utils/retry-on-p2034.test.ts`, `apps/platform/.../labels/search/route.ts`, `.../days/[dayOfWeek]/label/route.ts`, `.../days/[dayOfWeek]/notes/route.ts`.
- **Edited (10 unique files):**
  - `packages/contracts/src/entities/lms/label/label-api.schema.ts` (Phase 1)
  - `packages/contracts/src/entities/lms/label/label.schema.test.ts` (Phase 1)
  - `packages/api-routes/src/error-handler.ts` (Phase 2)
  - `packages/api-server/src/endpoints/lms/_shared/index.ts` (Phase 3)
  - `packages/api-server/src/endpoints/lms/session/admin.ts` (Phase 3)
  - `packages/api-server/src/endpoints/lms/day/admin.ts` (**Phase 3 + Phase 4 — two separate commits**)
  - `packages/api-server/src/endpoints/lms/week/admin.ts` (Phase 3)
  - `packages/api-server/src/utils/index.ts` (Phase 4)
  - `packages/api-server/src/endpoints/lms/label/platform.ts` (Phase 5)
  - `packages/api-server/src/endpoints/lms/label/platform.test.ts` (Phase 5)
- **Untouched:** Prisma schema, all `analysis/artifacts/`, seed, all mappers, all other endpoints, no `apps/admin` / `apps/storybook` / `apps/marketing` changes, no Step 6.3 `lmsLabelPlatformApi` test helper signatures except the one fixture-helper signature update noted in Phase 5.

### 5.2 — Verifications all-green at root

- `pnpm check-types` 16/16 (FULL TURBO or fresh; check-types green on platform requires api-server + contracts + api-routes types green first).
- `pnpm lint` 16/16.
- `pnpm test` 937 (current) → **~952-958** (+11 contract Phase 1, +8 helper Phase 4, +5 platform Phase 5 = ~+24; -1 rewritten cap case = ~+23). Range tolerance: 950-960. Outside range → STOP, investigate.
- `pnpm dep:check` 0/X (X jumps from 1127 to ~1133-1135 — 6 new modules + a couple of new imports).

### 5.3 — Targeted grep regressions

After all phases ship:

- `grep -rn "const DAY_OF_WEEK_TO_PRISMA = {" packages/api-server/src/endpoints/` → **1** match (only `_shared/day-of-week.ts`).
- `grep -rn "DAY_OF_WEEK_TO_PRISMA" packages/api-server/src/` → **>1** (1 definition + 5 usages in `session/admin.ts`, `day/admin.ts`, `week/admin.ts`).
- `grep -rn "retryOnP2034" packages/api-server/src/` → **≥4** (1 definition + 1 export + 2 usages in `day/admin.ts` setLabel/setNotes).
- `grep -rn "LABEL_SEARCH_CAP = 50" packages/api-server/src/` → **0** (bumped to 500).
- `grep -rn "LABEL_SEARCH_CAP = 500" packages/api-server/src/` → **1**.
- `grep -rn "labelSearchParamsSchema" packages/contracts/src/` → presence + `.trim()` transform + `level` field visible in schema body.
- `grep -rn "withCoachAuth" apps/platform/src/app/api/platform/training-plans/.../days` → 2 matches (both new day route files).
- `grep -rn "Retry-After" packages/api-routes/src/error-handler.ts` → 2 matches (existing 429 path + new 503 path).
- `grep -rn "Session.name\b" packages/api-server/src/endpoints/lms/` → 0 (Session.name carry-forward regression-guard).
- `grep -rn "freezeLoadsAtCreation" packages/api-server/src/endpoints/lms/` → 0 (Step 6.0 Q10 carry-forward guard).

### 5.4 — Targeted test-suite runs

Beyond root `pnpm test`, also run isolated for fast feedback:

- `pnpm --filter @repo/contracts test src/entities/lms/label` → +5-7 new cases over baseline.
- `pnpm --filter @repo/api-server test src/utils/retry-on-p2034.test.ts` → 8/8 new file.
- `pnpm --filter @repo/api-server test src/endpoints/lms/label/platform.test.ts` → ≥15 cases (was 11; rewrite-1 + add-5 = 15+).
- `pnpm --filter @repo/api-server test src/endpoints/lms/day` → no regression, count unchanged.
- `TZ=Asia/Kolkata pnpm --filter @repo/api-server test src/endpoints/lms/week/admin.test.ts` → 7/7 still green (verifies Phase 3 hoist didn't disturb resolveWeekStartDate path).

### 5.5 — Husky hook compliance

Every commit in the 6-7 commit sequence (§ 7) passes:

- `pre-commit`: secret-check + lint-staged + `turbo check-types --filter="...[HEAD]"`.
- `pre-push` (when first push happens): `dep:check + turbo lint check-types --filter="...[origin/main]"`.
- Zero `--no-verify` / `--no-edit` / `--no-gpg-sign` invocations.

### 5.6 — Manual happy-path curl (optional, if local dev server runs)

If `pnpm dev` is feasible during this session and a test coach session cookie is available:

```bash
# Preload (no filter)
curl -i "http://localhost:3001/api/platform/labels/search" -H "cookie: ..."

# Filter by level
curl -i "http://localhost:3001/api/platform/labels/search?level=DAY" -H "cookie: ..."

# Trim policy
curl -i "http://localhost:3001/api/platform/labels/search?q=%20push%20&level=DAY" -H "cookie: ..."

# Day label set
curl -i -X PUT "http://localhost:3001/api/platform/training-plans/<planId>/weeks/2026-05-11/days/MONDAY/label" \
  -H "cookie: ..." -H "content-type: application/json" -d '{"labelId": "<labelCuid>"}'

# Day notes set
curl -i -X PUT "http://localhost:3001/api/platform/training-plans/<planId>/weeks/2026-05-11/days/MONDAY/notes" \
  -H "cookie: ..." -H "content-type: application/json" -d '{"notes": "deload day"}'
```

If `pnpm dev` not feasible — skip; integration tests cover the api-server side, route shape is mechanical wrap.

---

## § 6 — Adversarial coverage matrix per `[[planner-adversarial-review]]`

Each write operation × 5 axes (concurrent, TOCTOU, partial-inputs, malformed, boundary). Mark each cell as **C** (covered in tests) or **R** (covered by review/runtime invariant). No empty cells — surface gaps before locking phases.

| Op                     | Concurrent                                                                                                    | TOCTOU                              | Partial / subset / dup                                                    | Malformed                                  | Boundary                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `setLabel`             | C (retry helper unit) + R (Step 6.2 case 13 still passes)                                                     | R (intra-tx plan re-check Step 6.2) | R (Zod schema `labelId.cuid().nullable()`)                                | C (route Zod params/body)                  | R (Step 6.2 covered: null-on-unmaterialized, missing label, wrong level) |
| `setNotes`             | C (retry helper unit) + R (sym to setLabel)                                                                   | R (intra-tx plan re-check Step 6.2) | R (Zod `notes.string().max(2000).nullable()`)                             | C (route Zod)                              | R (Step 6.2: null-on-unmaterialized, 2000+ chars rejected)               |
| `list` (labels search) | R (read-only, no race)                                                                                        | N/A                                 | C (q empty / whitespace / 201ch / level invalid — Phase 1 contract tests) | C (Phase 1 contract tests cover Zod paths) | C (Phase 5 cap test creates 501 labels)                                  |
| `retryOnP2034` helper  | C (unit: succeed-first, retry-then-success, exhausted, non-P2034, non-error Prisma, attempts opt, attempts<1) | N/A                                 | N/A                                                                       | C (non-P2034 rethrown)                     | C (attempts=0 throws synchronously)                                      |

Sixth axis per `[[husky-cross-package-squash]]`: **does every intermediate commit pass every hook gate?** Answered in § 7 commit strategy.

---

## § 7 — Commit strategy (validated against live hook config per `[[husky-cross-package-squash]]`)

### 7.1 — Pre-commit hooks confirmation (planner-read 2026-05-16)

`.husky/pre-commit` runs:

1. `node scripts/check-secrets.mjs` — secret-scan on staged.
2. `npx lint-staged` — eslint + prettier per `package.json` lint-staged config.
3. `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"` — fans out check-types to all packages that depend (transitively) on packages with staged changes.

### 7.2 — Why per-layer atomic commits work this step

All 6 phases are **additive**:

- Phase 1: new optional field in contract — backward compat (consumers don't break if they ignore new field).
- Phase 2: new independent `if` branch in error-handler — backward compat.
- Phase 3: const-hoist with byte-identical value — semantics preserving.
- Phase 4: new helper + new wrapper application — `ServiceUnavailableError` propagates through existing catch (no API contract change).
- Phase 5: api-server method signature change (`query?: string` → `query?: { q?, level? }`) — this is **breaking** internally, BUT current consumers = 0 per § 0.7. Only the Phase 6 route consumes this — so Phase 5 and Phase 6 must land **in the same commit OR Phase 5 before Phase 6** with check-types still passing on the intermediate state because no real consumer breaks.

Actually wait — Phase 5 changes `list(userId, query?: string)` to `list(userId, query?: { q?, level? })`. Even though there are zero call sites today, the **api-server package itself** type-checks the method, AND `endpoints/lms/index.ts` re-exports it. If Phase 5 lands as one commit and check-types runs, no downstream type-error occurs because no caller exists. ✓

If you stage Phase 5 (signature change in `platform.ts` + test update) **before** Phase 6 (new route consumes new signature), the intermediate tree is **green** because the route doesn't exist yet. ✓

### 7.3 — Commit sequence (7 atomic commits, in order)

Each commit has a single semantic concern, type-checks clean on its own, hook-gates green.

1. **`feat(contracts): add trim and level filter to lms label search params`**

   - Files: `packages/contracts/src/entities/lms/label/label-api.schema.ts` + Phase 1 test file.
   - Body: 3-5 lines — "Adds `.trim()` transform on `q` (rejects whitespace-only via existing `min(1)`); adds optional `level: appLevelSchema` field for applicability-based filtering. Both backward-compatible: existing callers (zero today, Step 6.4 route is first) ignore the new field. Driven by coach autocomplete UX (preload + level-scoped suggestions)."

2. **`feat(api-routes): set retry-after header on 503 service-unavailable responses`**

   - File: `packages/api-routes/src/error-handler.ts` (and test if file exists).
   - Body: "Mirrors the existing 429 `Retry-After` branch in `appErrorResponse` for `statusCode === 503` when `details.retryAfter` is a number. Enables `ServiceUnavailableError({ retryAfter })` to surface a client-actionable backoff hint when the api-server throws after exhausting a P2034 retry loop."

3. **`refactor(api-server): hoist day-of-week prisma map to lms shared module`**

   - Files: `_shared/day-of-week.ts` (new), `_shared/index.ts` (1 line added), `session/admin.ts` + `day/admin.ts` + `week/admin.ts` (drop local const, swap import).
   - Body: "Three callsites had a byte-identical `DAY_OF_WEEK_TO_PRISMA` const. Hoisted to `endpoints/lms/_shared/day-of-week.ts`, re-exported through the `_shared` barrel already consumed by all three files. Pure refactor — no business-logic change; all existing tests still pass without modification."

4. **`feat(api-server): retry serializable transaction conflicts with jittered backoff`**

   - Files: `utils/retry-on-p2034.ts` (new), `utils/retry-on-p2034.test.ts` (new), `utils/index.ts` (1 line added).
   - Body: "Adds `retryOnP2034(fn, opts?)` that retries on `Prisma.PrismaClientKnownRequestError.code === 'P2034'` with 50-200 ms jittered sleep, default 2 attempts. On exhaustion throws `ServiceUnavailableError` with `details.retryAfter = 5` (consumed by api-routes error-handler 503 branch). Non-P2034 errors rethrown immediately. Unit-tested in isolation — does not touch existing endpoints (Phase 6 applies it to day metadata)."

5. **`feat(api-server): wrap day metadata serializable transactions with p2034 retry`**

   - File: `endpoints/lms/day/admin.ts` (apply `retryOnP2034` wrap to both `setLabel` + `setNotes` `prisma.$transaction(..., Serializable)` calls).
   - Body: "Both day-metadata mutations now retry once on Postgres SSI write conflict (P2034 from concurrent upserts on the `(weekId, dayOfWeek)` unique key — see `[[postgres-ssi-upsert-unique-key]]`). On exhaustion the client receives 503 + `Retry-After: 5` instead of an immediate 409 conflict. Non-P2034 errors (NotFoundError / BadRequestError from intra-tx validations) propagate unchanged through the existing `handlePrismaError` rethrow path. `lmsSessionApi.create` will adopt the same wrap in Step 6.4.5."

6. **`feat(api-server): extend label platform search with level filter and preload cap`**

   - Files: `endpoints/lms/label/platform.ts` (signature + filter + cap), `endpoints/lms/label/platform.test.ts` (cases adapted/extended).
   - Body: "`lmsLabelPlatformApi.list` now accepts `{ q?: string; level?: AppLevelValue }` and filters labels by `applicableLevels { array_contains: level }` when provided. Caller-facing change driven by coach autocomplete UX — Day picker shows only `applicableLevels.includes('DAY')` labels, etc. Cap raised 50 → 500 so a single no-query call preloads the realistic full catalog. Tests adapted: cap regression now uses the exported `LABEL_SEARCH_CAP` const + 501-fixture insert; new cases cover level-only, level+q AND, multi-level membership."

7. **`feat(platform): add http routes for label search and day metadata mutations`**
   - Files: 3 new route files under `apps/platform/src/app/api/platform/`.
   - Body: "Wires `GET /api/platform/labels/search` (consumes Phase 1/Phase 5 contract+filter changes) and `PUT /api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/{label,notes}` (consumes Phase 4 retry-wrapped api-server methods). All routes follow the established `withCoachAuth(withAuthRateLimit(..., RATE_LIMIT_TIER.API))` pattern; PUT handlers inherit `Idempotency-Key` replay support from the framework's `wrapAuthHandler(inner, JSON_CONFIG)` wrap. Session routes ship in Step 6.4.5; UI consumers in Steps 6.5/6.6."

Phase 1 + Phase 2 can be ordered (1, 2) or (2, 1) — both green independently. Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 is the natural dependency chain.

### 7.4 — Commitlint guardrails (Step 6.0 + 6.1 lessons)

- All subjects lowercase including acronyms (`lms` not `LMS`, `http` not `HTTP`, `p2034` if subject; `P2034` is OK in body).
- All subjects ≤ 100 chars. **Confirmed** for the 6 subjects above (longest is #5 at 76 chars).
- All body lines ≤ 150 chars. Reflow before commit.
- No `Co-Authored-By` / `Generated-with` trailers.
- No `--no-verify` / `--no-edit` / `--no-gpg-sign`. If a hook fails — fix root cause, surface to planner via § 8 if uncertain.

---

## § 8 — Escalation protocol (the `/feature` skill's surface-with-hypothesis-and-wait pattern)

If during execution any of the following surfaces, **STOP and `AskUserQuestion` the planner** (do not silently adapt):

- **§ 0 verbatim quote mismatches** — file content differs from what's quoted in § 0.x.
- **Phase 3 unforeseen DAY_OF_WEEK_TO_PRISMA usage** — e.g. a test file imports the local const directly via `import { DAY_OF_WEEK_TO_PRISMA } from "./admin"` (it shouldn't, but if it does, the const must be re-exported from admin.ts as well as moved).
- **Prisma `array_contains` syntax issue** — if Prisma 6 in this repo uses different field/path/operator (e.g. requires `path: ["applicableLevels"], array_contains: level`), the Phase 5 implementation must align with what Prisma accepts. Surface with hypothesis: "I tried syntax X, Prisma rejected with error Y; documentation suggests Z; should I apply Z?"
- **Husky pre-commit hook blocks an intermediate commit** — should not happen given additive analysis in § 7, but if it does (e.g. lint-staged finds an unexpected eslint rule violation), surface with the rule + file + suggested fix.
- **Test-count outside § 5.2 range (950-960)** — surface with delta breakdown.
- **Helper-applied-to-wrong-place suspicion** — e.g. if `lmsSessionApi.create` already broken without retry (P2034 surfacing in a test today), surface; don't auto-extend Step 6.4 scope.
- **Smoke-test request** — N/A this step per § 4; if user asks during execution, redirect to Step 6.6/6.7.
- **Domain semantic doubt** — any field, operation, error message, status code where you reach for instinct instead of `analysis/artifacts/` citation. Per `[[coach-pov-first]]`.

Hypothesis format (per `[[planner-adversarial-review]]` example): "[surfaced finding]; from a coach/engineering-correctness perspective the answer is probably X because [rationale]; right?"

Planner answers fast. Planner owns prompt errors.

---

## § 9 — Output report format (executor produces at end)

Write to `implementation/step-06.4/output.md` per WORKFLOW.md "output.md format" section. Required headers in order:

- `## Что сделано` — Russian narrative, 6-12 lines.
- `## Изменённые/созданные файлы` — bulleted by phase, file count totals.
- `## Принятые решения` — D-numbered (D-1, D-2, ...); cover any minor deviations from this prompt (always justify; never silent).
- `## Возникшие вопросы и как решены` — escalations + their resolutions.
- `## Что отложено` — bullet list of newly-identified follow-ups not in this step's scope.
- ``## Ссылка на `.feature-dev/<ts>/``` — research/design/plan/review/qa artifacts.
- `## Verification notes` — per-gate output (Phase 1 contracts → root) with counts.
- `## Acceptance criteria self-check` — checkbox list mirroring § 5.1-5.5.

No smoke-test section (N/A — api-server + route-layer step; see § 4).

---

## § 10 — One-line scope summary (for handoff legibility)

> Wire 3 platform HTTP routes (label search + 2 day-metadata PUTs) consuming already-shipped api-server methods, bundle `DAY_OF_WEEK_TO_PRISMA` hoist + `retryOnP2034` helper + `503 Retry-After` infra + label search `level` filter + cap bump. 6 phases across 3 packages, 7 atomic per-layer commits, additive only, no Prisma schema / analysis-artifacts / seed / UI changes.
