# Step 6.4.5 — Session HTTP routes + `retryOnP2034` apply to `lmsSessionApi.create`

> Self-contained prompt for a fresh Opus 4.7 max-effort executor session. Run via `/feature small` — narrow scope (3 phases, 2 packages, ~5 files, no contract changes, no Prisma changes, additive only).

## § 0 — Hard triggers (STOP-and-surface to planner BEFORE writing code)

Surface to planner via `AskUserQuestion` if any of the verbatim quotes below diverges from the actual file state at execution time. All quotes captured at planner-write-time (2026-05-16 HEAD `7380eee1`).

### 0.1 — `lmsSessionApi.create` current state (Phase 1 wrap target)

**`packages/api-server/src/endpoints/lms/session/admin.ts:33-119` (verbatim, lines 48-118 — the try-catch body that wraps):**

```ts
try {
  const session = await prisma.$transaction(
    async (tx) => {
      const planCheck = await tx.trainingPlan.findUnique({
        where: { id: planId },
        select: { deletedAt: true, status: true },
      });

      if (!planCheck || planCheck.deletedAt !== null) {
        throw new NotFoundError("Training plan not found", { planId });
      }

      if (planCheck.status === "ARCHIVED") {
        throw new ForbiddenError("Plan is archived; edits not allowed");
      }

      if (data.labelId !== null && data.labelId !== undefined) {
        const label = await tx.label.findUnique({
          where: { id: data.labelId },
          select: { applicableLevels: true },
        });

        if (!label) {
          throw new NotFoundError("Label not found", { labelId: data.labelId });
        }

        const levels = label.applicableLevels as AppLevelValue[];

        if (!levels.includes("SESSION")) {
          throw new BadRequestError("Label is not applicable to SESSION level", {
            labelId: data.labelId,
            applicableLevels: levels,
          });
        }
      }

      const week = await tx.week.upsert({
        where: { planId_startDate: { planId, startDate } },
        create: { planId, startDate },
        update: {},
      });

      const day = await tx.day.upsert({
        where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: prismaDayOfWeek } },
        create: { weekId: week.id, dayOfWeek: prismaDayOfWeek },
        update: {},
      });

      const max = await tx.session.aggregate({
        where: { dayId: day.id },
        _max: { order: true },
      });

      const nextOrder = (max._max.order ?? 0) + 10;

      return tx.session.create({
        data: {
          dayId: day.id,
          order: nextOrder,
          labelId: data.labelId ?? null,
          notes: data.notes ?? null,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return mapToSession(session);
} catch (error) {
  return handlePrismaError(error, { entity: "Session" });
}
```

**Intent (mechanically identical to Step 6.4 commit `013f8319` Day-metadata wrap):** wrap the `await prisma.$transaction(async (tx) => { ... }, { isolationLevel: Serializable })` expression in `retryOnP2034(() => prisma.$transaction(...))`. **Final state of the relevant lines:**

```ts
try {
  const session = await retryOnP2034(() =>
    prisma.$transaction(
      async (tx) => {
        // ... existing body unchanged
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    ),
  );

  return mapToSession(session);
} catch (error) {
  return handlePrismaError(error, { entity: "Session" });
}
```

**Catch block stays unchanged**: `ServiceUnavailableError` thrown by `retryOnP2034` on retry-exhaustion is an `AppError` subclass; `handlePrismaError` (`utils/prisma-error-handler.ts:49`) rethrows non-Prisma errors as-is. `ServiceUnavailableError` propagates up cleanly through the framework's `withErrorHandling` and surfaces as `503 Retry-After: 5` per Step 6.4 commit `4cb417d2`.

If `session/admin.ts:33-119` has been touched between planner-write-time and your read — STOP, surface.

### 0.2 — Import line edit in `session/admin.ts:20`

**Current state (verbatim):**

```ts
import { handlePrismaError } from "../../../utils";
```

**Final state (additive — merge `retryOnP2034` into existing import; alphabetical):**

```ts
import { handlePrismaError, retryOnP2034 } from "../../../utils";
```

`retryOnP2034` is exported from `packages/api-server/src/utils/index.ts:6` per Step 6.4 commit `b0b23ae4`.

### 0.3 — `lmsSessionApi.update`, `delete`, `reorder` NOT touched

**Verbatim verify at execution**: lines 121-159 (update), 161-171 (delete), 173-253 (reorder) — zero edits. **Only** `create` wraps.

- `update` + `delete` — single `prisma.X.update/delete`, no transaction, no P2034 surface.
- `reorder` — `prisma.$transaction(updates[])` array form at **default isolation** per Step 6.1 design (line 242-246 verbatim: `prisma.$transaction(data.orderedIds.map((id, i) => prisma.session.update({ where: { id }, data: { order: (i + 1) * 10 } })))`). Sequential updates on distinct `id`s, no row contention, no P2034 surface.

If during execution you observe any of these three methods has `Serializable` isolation or read-then-write inside a transaction that would benefit from retry — STOP, surface (planner deferred them off purposely; emergence would be a regression of Step 6.1 design or a new concurrent-race not previously identified).

### 0.4 — Contract addressing schemas (Phase 3 route paths)

**`packages/contracts/src/entities/lms/session/session-api.schema.ts` (verbatim, lines 11-19):**

```ts
export const sessionByDayParamsSchema = z.object({
  planId: z.string().cuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOfWeek: dayOfWeekSchema,
});

export const sessionByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  sessionId: z.string().cuid(),
});
```

**Step 6.0 ratified split**: `byDay` for POST + reorder (day-level addressing); `byId` for PUT/DELETE (`{ planId, sessionId }` — note: NO `dayOfWeek`/`startDate` segments). This drives URL structure:

- POST + reorder → `apps/platform/src/app/api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/sessions/{,reorder/}route.ts`
- PUT + DELETE → `apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/route.ts` (mirror `enrollments/[enrollmentId]/route.ts` precedent)

If `sessionByIdParamsSchema` has changed shape (e.g., added `dayOfWeek` field) — STOP, surface (URL structure must follow contract).

### 0.5 — Route precedents (verbatim — pattern reference, NOT edit)

**`apps/platform/src/app/api/platform/training-plans/[planId]/enrollments/[enrollmentId]/route.ts` (verbatim, lines 1-37):**

```ts
import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanEnrollmentApi } from "@repo/api-server/lms";
import {
  getPlanEnrollmentResponseSchema,
  planEnrollmentParamsSchema,
} from "@repo/contracts/lms/plan-enrollment";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId, enrollmentId }) =>
        lmsPlanEnrollmentApi.getById(userId, planId, enrollmentId),
      planEnrollmentParamsSchema,
      getPlanEnrollmentResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { planId, enrollmentId }) =>
        lmsPlanEnrollmentApi.remove(userId, planId, enrollmentId),
      planEnrollmentParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
```

Multiplexed `GET` + `DELETE` from one route.ts — same pattern is used for Step 6.4.5's `[sessionId]/route.ts` (PUT + DELETE).

**`apps/platform/src/app/api/platform/training-plans/[planId]/weeks/[startDate]/route.ts` (verbatim, lines 28-39):**

```ts
export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, startDate }, data) =>
        lmsWeekApi.upsertNotes(userId, planId, startDate, data),
      weekByPlanAndDateParamsSchema,
      updateWeekNotesRequestSchema,
      updateWeekNotesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
```

`createAuthPutByParamHandler` signature: `(apiFn, paramsSchema, requestSchema, responseSchema)`. Used for both PUT update + PUT reorder in Step 6.4.5.

### 0.6 — Step 6.2 case 13 concurrent test pattern (Phase 2 mirror target)

**`packages/api-server/src/endpoints/lms/day/admin.test.ts:442-475` (verbatim — the canonical concurrent-race-under-retry pattern to mirror):**

```ts
it("concurrent setLabel + setNotes on pre-materialized Day — both persist (different columns)", async () => {
  const week = await cleanupRaw.week.create({
    data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
  });
  const day = await cleanupRaw.day.create({
    data: { weekId: week.id, dayOfWeek: "SATURDAY" },
  });

  try {
    const [labelResult, notesResult] = await Promise.allSettled([
      lmsDayMetadataApi.setLabel(coach.user.id, activePlanId, MONDAY_PARAM, "SATURDAY", {
        labelId: dayLabelId,
      }),
      lmsDayMetadataApi.setNotes(coach.user.id, activePlanId, MONDAY_PARAM, "SATURDAY", {
        notes: "saturday focus",
      }),
    ]);

    expect(labelResult.status === "fulfilled" || notesResult.status === "fulfilled").toBe(true);

    const stored = await cleanupRaw.day.findUnique({ where: { id: day.id } });

    if (labelResult.status === "fulfilled") {
      expect(stored?.labelId).toBe(dayLabelId);
    }

    if (notesResult.status === "fulfilled") {
      expect(stored?.notes).toBe("saturday focus");
    }
  } finally {
    await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
    await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
  }
});
```

Phase 2 builds an analogous test for **concurrent Session.create** — see § 3 Phase 2 for the specific shape.

### 0.7 — Husky hooks / commit-strategy validation

`.husky/pre-commit` runs `turbo check-types --filter="...[HEAD]"`. All Step 6.4.5 changes are **additive** (new files + 1 method body edit semantically-preserving). No intermediate commit leaves a depender broken. **Per-layer atomic commits hold** — see § 7.

### 0.8 — Zero-state consumer verification per `[[planner-consumer-pattern-read]]`

This step adds first consumer surface for `lmsSessionApi.{create, update, delete, reorder}`. Current consumers verified by planner at prompt-write time:

- `lmsSessionApi.create` — consumers: **0** (integration tests don't count; Step 6.4.5 routes are first production consumer; Step 6.5 hooks second).
- `lmsSessionApi.update` — consumers: **0**.
- `lmsSessionApi.delete` — consumers: **0**.
- `lmsSessionApi.reorder` — consumers: **0**.

No contract shape changes in this step (Step 6.0 contracts hold). No mapper changes. No api-server method signature changes (only the inner tx wrapped).

If during execution you find an existing consumer that planner missed — STOP, surface.

---

## § 1 — Goal

Two deliverables in one cohesive vertical slice:

**Deliverable A — `lmsSessionApi.create` retry-wrap (Phase 1 + Phase 2):**

- Wrap the existing `prisma.$transaction(..., Serializable)` call in `retryOnP2034(() => ...)` — 1-line application of the helper born in Step 6.4 commit `b0b23ae4`. Behavior: 2 attempts + jittered `[50, 200]ms` backoff; on exhaustion → `ServiceUnavailableError({ retryAfter: 5, lastErrorCode: "P2034" })` → framework surfaces 503 + `Retry-After: 5` per Step 6.4 commit `4cb417d2`.
- Add 1 integration test for concurrent `Session.create` on a pre-materialized Day, mirroring Step 6.2 case 13 pattern. Closes Step 6.1 QA-002 carry-forward marker ("concurrency repro deferred to HTTP layer").

**Deliverable B — 4 Session HTTP routes (Phase 3):**

- `POST  /api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/sessions` → `lmsSessionApi.create`
- `PUT   /api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/sessions/reorder` → `lmsSessionApi.reorder`
- `PUT   /api/platform/training-plans/[planId]/sessions/[sessionId]` → `lmsSessionApi.update`
- `DELETE /api/platform/training-plans/[planId]/sessions/[sessionId]` → `lmsSessionApi.delete`

Day-level addressing for POST + reorder (matches `sessionByDayParamsSchema`); id-level addressing for PUT/DELETE (matches `sessionByIdParamsSchema` per Step 6.0 ratification + `enrollments/[enrollmentId]/route.ts` precedent). PUT + DELETE multiplexed in one `[sessionId]/route.ts` file.

---

## § 2 — Context (read these BEFORE writing anything)

### 2.1 — Workflow / planner-discipline files

- `implementation/WORKFLOW.md` — six-flavour planner-discipline checklist, husky-squash exception, language conventions.
- `implementation/PLANNING_STATE.md` § "Current step" + "Next action" — authoritative scope confirmation for Step 6.4.5.
- `implementation/IMPLEMENTATION_LOG.md` Step 6.4 + 6.2 + 6.1 entries — context for retry pattern (6.4), concurrent-race test pattern (6.2 case 13), and existing Session test structure (6.1).

### 2.2 — Domain semantics (no new domain spec; cite if ambiguous)

- `analysis/artifacts/06-formalization/schema.prisma:174-191` — `Session` model (`dayId`, `order` non-unique, `labelId?`, `notes?`).
- D7 (PLANNING_STATE) — Day is lazily-materialized; Session.create triggers transitive `week.upsert → day.upsert → session.create` chain inside Serializable tx (Step 6.1 design).
- Step 6.0 carry-forward guards (`[[coach-pov-first]]`): `Session.name` and `Session.freezeLoadsAtCreation` NEVER added to contract or routes. Verified at § 6 grep regressions.

### 2.3 — Existing infrastructure (consume only, do NOT modify)

- `packages/api-server/src/utils/retry-on-p2034.ts` — `retryOnP2034<T>(fn, opts?)` helper (Step 6.4 commit `b0b23ae4`).
- `packages/api-routes/src/error-handler.ts:67-70` — 503 `Retry-After` branch (Step 6.4 commit `4cb417d2`).
- `packages/api-routes/src/auth-factories.ts:89-106` — `createAuthPostByParamHandler` (POST 201, idempotency auto-wired).
- `packages/api-routes/src/auth-factories.ts:125-142` — `createAuthPutByParamHandler` (PUT 200, idempotency auto-wired).
- `packages/api-routes/src/auth-factories.ts:162-175` — `createAuthDeleteHandler` (DELETE 204).
- `packages/api-routes/src/rate-limit/rate-limit-tiers.ts:1-5` — `RATE_LIMIT_TIER.API` (100 req/min/userId; ratified in Step 6.4 OQ-D for all platform routes).
- `apps/platform/src/lib/server/auth.ts:7` — `withCoachAuth` (COACH_ROLES = [COACH, HEAD_COACH, ADMIN]).

### 2.4 — Existing tests (mirror; do NOT regress)

- `packages/api-server/src/endpoints/lms/day/admin.test.ts:442-475` — Step 6.2 case 13 concurrent-race pattern.
- `packages/api-server/src/endpoints/lms/session/admin.test.ts` — 646 LOC, 5 describe blocks (`create` 95-283, `update` 284-371, `delete` 372-436, `reorder` 437-610, `TZ invariance` 611+). Phase 2 inserts 1 case at the END of `describe("create")` block (~line 282-283, just before the closing `});`).

### 2.5 — Memory cross-links (auto-loaded session-start)

- `[[planner-consumer-pattern-read]]` — sixth flavour; § 0.8 verifies zero consumers explicit.
- `[[planner-adversarial-review]]` — fourth flavour; § 6 adversarial matrix covered by existing tests + the new concurrent case.
- `[[husky-cross-package-squash]]` — fifth flavour; § 7 commit strategy validated.
- `[[planner-verbatim-registration]]` — third flavour; § 0 quotes.
- `[[postgres-ssi-upsert-unique-key]]` — engineering knowledge; helper application here is the second production callsite (day-metadata was first).
- `[[api-server-serial-tests]]` — Step 6.1 serial-suite constraint; Phase 2 new case adds ~2-3s to ~10-min pre-push suite.
- `[[no-tech-debt-in-mocks]]` — Phase 2 test uses real `cleanupRaw.{week,day}.create` materialization, no prisma mock.

---

## § 3 — Scope (per-phase plan; in execution order)

### Phase 1 — Wrap `lmsSessionApi.create`'s transaction in `retryOnP2034`

**File (1 edited):**

- `packages/api-server/src/endpoints/lms/session/admin.ts`:
  - Edit import line 20 per § 0.2 final state (`{ handlePrismaError, retryOnP2034 } from "../../../utils"`).
  - Edit `create` method body lines 48-114 — wrap `prisma.$transaction(...)` expression in `retryOnP2034(() => prisma.$transaction(...))` per § 0.1 final state.
  - **DO NOT TOUCH** any other line in the file — `update`, `delete`, `reorder` stay byte-identical, including their default-isolation transaction in reorder.

**Acceptance:**

- `pnpm --filter @repo/api-server check-types` + `lint` green.
- `pnpm --filter @repo/api-server test src/endpoints/lms/session/admin.test.ts` — existing 14 cases still pass unchanged (no behavioral diff for non-concurrent paths).
- `grep -n "retryOnP2034" packages/api-server/src/endpoints/lms/session/admin.ts` — 2 hits (import + call site).
- `grep -n "prisma.\$transaction" packages/api-server/src/endpoints/lms/session/admin.ts` — 2 hits (create's wrapped call + reorder's untouched array form).

### Phase 2 — Integration test for concurrent `Session.create` retry

**File (1 edited):**

- `packages/api-server/src/endpoints/lms/session/admin.test.ts` — append 1 case at the END of `describe("create", () => {...})` block (between the last existing `it(...)` and the closing `});` of the describe block, around line 282-283).

**Test shape** (mirror Step 6.2 case 13, adapted for Session.create — pre-materialize Day, then race two concurrent creates):

```ts
it("concurrent Session.create on pre-materialized Day — at least one succeeds via P2034 retry", async () => {
  const week = await cleanupRaw.week.create({
    data: { planId: activePlanId, startDate: EXPECTED_UTC_MONDAY },
  });
  const day = await cleanupRaw.day.create({
    data: { weekId: week.id, dayOfWeek: "FRIDAY" },
  });

  try {
    const [first, second] = await Promise.allSettled([
      lmsSessionApi.create(coach.user.id, activePlanId, MONDAY_PARAM, "FRIDAY", {
        notes: "first concurrent",
      }),
      lmsSessionApi.create(coach.user.id, activePlanId, MONDAY_PARAM, "FRIDAY", {
        notes: "second concurrent",
      }),
    ]);

    expect(first.status === "fulfilled" || second.status === "fulfilled").toBe(true);

    const stored = await cleanupRaw.session.findMany({
      where: { dayId: day.id },
      orderBy: { order: "asc" },
    });

    const fulfilledCount = [first, second].filter((r) => r.status === "fulfilled").length;

    expect(stored).toHaveLength(fulfilledCount);

    if (fulfilledCount === 2) {
      expect(stored[0]?.order).toBe(10);
      expect(stored[1]?.order).toBe(20);
      expect(new Set(stored.map((s) => s.id)).size).toBe(2);
    }
  } finally {
    await cleanupRaw.session.deleteMany({ where: { dayId: day.id } }).catch(() => {});
    await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
    await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
  }
});
```

**Design notes (intentional):**

- Use `EXPECTED_UTC_MONDAY` + `MONDAY_PARAM` constants from the existing test fixture top (verify they exist in the suite; if named differently — e.g., `WEEK_START`, `MONDAY_DATE_PARAM` — use whatever the existing tests use; do NOT introduce new fixture names).
- Use `dayOfWeek = "FRIDAY"` to avoid collision with the existing `"MONDAY"` fixtures in other cases (defence against cross-test cleanup ordering races under the serial suite).
- `fulfilledCount === 1` is a valid outcome — Postgres SSI can reject the second create on the `session.aggregate _max(order)` range read serialization anomaly even after `retryOnP2034` retries once. The assertion shape ("at least one succeeded; stored count matches fulfilled count") is **invariant-based**, not outcome-fixed. Mirrors Step 6.2 case 13 reasoning.
- `fulfilledCount === 2` checks order=10, order=20 (sparse-int +10 sequence per Step 6.1 design); distinct cuids; ordering by `order` ASC.
- `finally` cleanup deletes in cascade order (sessions → day → week).

**Acceptance:**

- `pnpm --filter @repo/api-server test src/endpoints/lms/session/admin.test.ts` — 15 cases now (was 14; +1 net).
- New case completes in <5s under serial suite (`[[api-server-serial-tests]]` constraint).

### Phase 3 — 3 platform route files (4 verb handlers)

**Files (3 new):**

- **New:** `apps/platform/src/app/api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/sessions/route.ts`:

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

- **New:** `apps/platform/src/app/api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/sessions/reorder/route.ts`:

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

**Design note for reorder**: `lmsSessionApi.reorder` returns `Session[]` (raw array), but `reorderSessionsResponseSchema = z.object({ sessions: z.array(sessionSchema) })` (wrapped object per Step 6.0). The route handler wraps the array in `{ sessions }` so `responseSchema.parse(...)` accepts it. Alternative would be `await/return` with intermediate var — `.then()` chain is tighter and TS-clean. **If lint or prettier reformats this** — let it; AST-equivalent.

- **New:** `apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/route.ts`:

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

**Adversarial notes** (executor should mentally simulate):

- Anonymous → `withCoachAuth` → 401.
- ATHLETE → `withCoachAuth` → 403.
- Invalid `[dayOfWeek]` value (not in `DayOfWeek` enum) → Zod reject → 400.
- Invalid `[sessionId]` value (not cuid) → Zod reject → 400.
- Plan owned by another coach → `verifyPlanOwnership` or `verifySessionOwnership` → `ForbiddenError` → 403.
- Plan archived → `verifyPlanEditable` → `ForbiddenError` → 403.
- Plan deleted → `NotFoundError` → 404.
- `labelId` references non-existent label → `NotFoundError` → 404 (create + update both validate via Step 6.1/6.2).
- `labelId` without "SESSION" in `applicableLevels` → `BadRequestError` → 400 (Step 6.2 OQ-C inline fix).
- Concurrent Session.create on same `(planId, startDate, dayOfWeek)` → retry helper attempts 1 retry → if exhausted → 503 + `Retry-After: 5`.
- Reorder with subset/superset/duplicate `orderedIds` → Step 6.1 complete-set check + Zod dedup refine → 400.
- `Idempotency-Key` header for POST + PUT → framework dedups via `wrapAuthHandler(JSON_CONFIG)` (24h cache, body-fingerprint-checked).
- Rate limit (101st req / 60s / userId) → 429 + `Retry-After`.

**Acceptance:**

- `pnpm --filter platform check-types` + `lint` green.
- `pnpm dep:check` 0/~1136 (+2-3 modules from 1134 — 3 new route files, each independent).
- No new platform-side tests in this step — UI consumer + smoke arrive in Step 6.5/6.6/6.7. Route adversarial coverage is by integration tests in `session/admin.test.ts` (which Phase 1 retry-wrap inherits) + review/QA passes on the route shape itself (mechanical wrap of factory).

---

## § 4 — Out of scope (explicit)

The following are NOT this step's work — surface to planner if any becomes ambient:

- Block-level HTTP routes — Step 7.
- Platform client API (`createSessionsAPI`) + hooks (`useCreateSession`, `useUpdateSession`, `useDeleteSession`, `useReorderSessions`) — Step 6.5.
- UI consumers (DayRow session list + dnd-kit reorder) — Step 6.7.
- Contract changes to `sessionByIdParamsSchema` (adding `dayOfWeek` for full-path PUT/DELETE) — Step 6.0 ratification holds; out of scope.
- Apply `retryOnP2034` to `lmsSessionApi.reorder` or `update` — explicitly NOT applicable per § 0.3 (default isolation reorder, single-statement update, no P2034 surface).
- Adding `createAuthPatchByParamWithBodyHandler` factory to api-routes — `createAuthPutByParamHandler` with PUT verb for reorder is the chosen path (Step 6.4.5 OQ-B ratification); no PATCH factory infra investment.
- Symbol rename `cms{Label,Exercise}AdminApi` → `lms*` — Step 6.1.5 carry-forward.
- Smoke test — N/A (api-server + route-layer; UI consumers Step 6.7).

---

## § 5 — Acceptance criteria (numbered, must hold at session-end)

### 5.1 — File pivot count

- **New (3):** 3 route files under `apps/platform/src/app/api/platform/training-plans/`.
- **Edited (2):** `packages/api-server/src/endpoints/lms/session/admin.ts` (Phase 1 wrap), `packages/api-server/src/endpoints/lms/session/admin.test.ts` (Phase 2 +1 case).
- **Untouched:** all contracts, Prisma schema, all `analysis/artifacts/`, seed, all mappers, all other api-server endpoints, no `apps/admin` / `apps/storybook` / `apps/marketing` changes.

### 5.2 — Verifications all-green at root

- `pnpm check-types` 16/16.
- `pnpm lint` 16/16.
- `pnpm test` 957 (current) → **958** (+1 from Phase 2 concurrent-create case). Outside `[957, 959]` range → STOP, investigate.
- `pnpm dep:check` 0/~1136-1137 (was 0/1134; +2-3 modules for 3 new route files).

### 5.3 — Targeted grep regressions

- `grep -n "retryOnP2034" packages/api-server/src/endpoints/lms/session/admin.ts` → **2** (import + call site).
- `grep -n "prisma.\$transaction" packages/api-server/src/endpoints/lms/session/admin.ts` → **2** (create's wrapped call + reorder's untouched array form).
- `grep -n "Serializable" packages/api-server/src/endpoints/lms/session/admin.ts` → **1** (create's tx; reorder is default isolation).
- `grep -rn "Session.name\b" packages/api-server/src/endpoints/lms/` → **0** (Step 6.0 carry-forward guard).
- `grep -rn "freezeLoadsAtCreation" packages/api-server/src/endpoints/lms/` → **0** (Step 6.0 Q10 carry-forward guard).
- `grep -rn "withCoachAuth" apps/platform/src/app/api/platform/training-plans/.../sessions` → **6** matches (3 import lines + 3-or-more invocation lines across the 3 new route files; multiplexed [sessionId]/route.ts has 2 invocations → total ≥7 incl. multiplexed).
- `grep -n "lmsSessionApi\." apps/platform/src/app/api/platform/training-plans/` → **4** call sites (1 create + 1 reorder + 1 update + 1 delete).

### 5.4 — Targeted test-suite runs

- `pnpm --filter @repo/api-server test src/endpoints/lms/session/admin.test.ts` → **15/15** (was 14; +1 concurrent-create case).
- `TZ=Asia/Kolkata pnpm --filter @repo/api-server test src/endpoints/lms/session/admin.test.ts` → 15/15 still green (Step 6.1 TZ invariance preserved post-wrap).
- `pnpm --filter @repo/api-server test src/endpoints/lms/day/admin.test.ts` → unchanged baseline (Step 6.2 case 13 still passes; no day-metadata regression from session-side change).

### 5.5 — Husky hook compliance

All 3 commits (§ 7) pass `.husky/pre-commit`. Zero `--no-verify` / `--no-edit` / `--no-gpg-sign`.

### 5.6 — Manual curl (optional, if local dev runs)

```bash
# Create session in MONDAY slot
curl -i -X POST "http://localhost:3001/api/platform/training-plans/<planId>/weeks/2026-05-11/days/MONDAY/sessions" \
  -H "cookie: ..." -H "content-type: application/json" -d '{"notes": "morning lifts"}'

# Update session (id-addressed)
curl -i -X PUT "http://localhost:3001/api/platform/training-plans/<planId>/sessions/<sessionId>" \
  -H "cookie: ..." -H "content-type: application/json" -d '{"notes": "renamed"}'

# Reorder (PUT with body)
curl -i -X PUT "http://localhost:3001/api/platform/training-plans/<planId>/weeks/2026-05-11/days/MONDAY/sessions/reorder" \
  -H "cookie: ..." -H "content-type: application/json" -d '{"orderedIds": ["<sessionA>", "<sessionB>"]}'

# Delete
curl -i -X DELETE "http://localhost:3001/api/platform/training-plans/<planId>/sessions/<sessionId>" \
  -H "cookie: ..."
```

Skip if `pnpm dev` not feasible — integration tests cover api-server side.

---

## § 6 — Adversarial coverage matrix per `[[planner-adversarial-review]]`

| Op        | Concurrent                                                                                      | TOCTOU                                                                          | Partial/subset/dup                                           | Malformed                       | Boundary                                                          |
| --------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------- |
| `create`  | **C** (Phase 2 new integration case + helper unit Step 6.4)                                     | R (intra-tx plan re-check Step 6.1 QA-002 fix)                                  | R (Zod `createSessionSchema`)                                | R (Zod params + body)           | R (Step 6.1: ownership, materialization, label applicableLevels)  |
| `update`  | R (single update, no race)                                                                      | R (`verifySessionOwnership` pre-update + label re-validation per Step 6.2 OQ-C) | R (Zod `updateSessionSchema` partial)                        | R (Zod)                         | R (Step 6.1: ownership, plan editable)                            |
| `delete`  | R (single delete, no race)                                                                      | R (`verifySessionOwnership`)                                                    | N/A                                                          | R (Zod params)                  | R (Step 6.1 case #14: non-owner reject + cascade-to-Block tested) |
| `reorder` | R (default isolation, sequential updates on distinct ids — Step 6.1 design verified non-racing) | R (Step 6.1: pre-tx ownership + complete-set + foreign-day rejection)           | R (Step 6.1 QA-001 fix: subset reject + Zod `.refine` dedup) | R (Zod `reorderSessionsSchema`) | R (Step 6.1: 14 reorder cases)                                    |

All op-side defences live in Step 6.1 + Step 6.2 ratified api-server code; Step 6.4.5 inherits them. **Phase 2 new test cell is the only new C** — closes Step 6.1 QA-002 concurrency-repro carry-forward.

Sixth axis per `[[husky-cross-package-squash]]`: **does every intermediate commit pass every hook gate?** Yes — § 7 commit strategy.

---

## § 7 — Commit strategy (validated per `[[husky-cross-package-squash]]`)

All 3 changes are **additive**:

- Phase 1: 1-method-body edit, semantically identical return type, no signature change.
- Phase 2: +1 test case, new behavior verification only.
- Phase 3: 3 new route files, independent of each other and of any existing consumer.

No commit leaves a depender broken under `turbo check-types --filter="...[HEAD]"`. **Per-layer atomic, no squash.**

### 7.1 — Commit sequence (3 commits, in dependency order)

1. **`feat(api-server): wrap session create transaction with p2034 retry`**

   - Files: `packages/api-server/src/endpoints/lms/session/admin.ts` (1-line import edit + tx-wrap), `packages/api-server/src/endpoints/lms/session/admin.test.ts` (+1 concurrent-create case).
   - Body: "Wraps the existing `prisma.$transaction(..., Serializable)` call in `lmsSessionApi.create` with `retryOnP2034(...)` — same pattern Step 6.4 commit `013f8319` applied to day metadata. On exhaustion the client now receives 503 + `Retry-After: 5` instead of an immediate 409 conflict (per Postgres SSI write-conflict on the `(planId, startDate)` and `(weekId, dayOfWeek)` upsert unique keys). Integration test added: pre-materialize Day, race two concurrent `Session.create` calls via `Promise.allSettled`, assert at-least-one-fulfilled invariant — closes Step 6.1 QA-002 concurrency-repro carry-forward. Update / delete / reorder unchanged — single-statement ops or default-isolation array-tx have no P2034 surface."

2. **`feat(platform): add http routes for session crud and reorder`**

   - Files: 3 new route files under `apps/platform/src/app/api/platform/training-plans/`.
   - Body: "Wires `POST /api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/sessions` (create, consumes Phase 1 retry-wrapped api method), `PUT .../sessions/reorder` (reorder, sub-resource action endpoint mirroring `/activate` and `/pause` precedents), and multiplexed `PUT + DELETE /api/platform/training-plans/[planId]/sessions/[sessionId]` (update + delete, id-addressed per Step 6.0 `sessionByIdParamsSchema = { planId, sessionId }` design + `enrollments/[enrollmentId]/route.ts` precedent). All routes follow `withCoachAuth(withAuthRateLimit(..., RATE_LIMIT_TIER.API))` pattern; POST + PUT handlers inherit `Idempotency-Key` replay via `wrapAuthHandler(JSON_CONFIG)`. UI consumer arrives in Step 6.7; client API + hooks in Step 6.5."

3. **`docs(step-06.4.5): write executor output report and step prompt`**
   - Files: `implementation/step-06.4.5/{prompt.md,output.md}`.
   - Body: standard close-out documentation.

### 7.2 — Commitlint guardrails

- All subjects lowercase including acronyms (`http` not `HTTP`, `p2034` not `P2034`; `P2034` allowed in body).
- All subjects ≤ 100 chars. Longest planned: "feat(api-server): wrap session create transaction with p2034 retry" = 67 chars ✓; "feat(platform): add http routes for session crud and reorder" = 60 chars ✓.
- All body lines ≤ 150 chars. Reflow before commit.
- No `Co-Authored-By` / `Generated-with` trailers.
- No skip-flags.

---

## § 8 — Escalation protocol

STOP and `AskUserQuestion` planner if:

- **§ 0 verbatim quote mismatches** — file content differs from quotes.
- **§ 0.3 finding** — `update`, `delete`, or `reorder` actually has `Serializable` isolation or P2034 surface that I missed (would change scope).
- **Phase 2 test stability** — concurrent test flakes under serial suite (re-runs fail intermittently). Surface with reproduction details + suggested mitigation (e.g., add 3rd attempt to retry helper for Session.create specifically, or relax assertions).
- **Phase 3 route path collision** — Next.js routing rejects `[planId]/weeks/[startDate]/days/[dayOfWeek]/sessions/reorder/route.ts` for some reason (e.g., a sibling `[reorder]/route.ts` exists capturing `reorder` as a param). Verify via `ls apps/platform/src/app/api/platform/training-plans/[planId]/weeks/[startDate]/days/[dayOfWeek]/sessions/` before creating files.
- **`reorderSessionsResponseSchema` wrap form differs from `{ sessions }`** — verify `packages/contracts/src/entities/lms/session/session-api.schema.ts:31-33` matches `z.object({ sessions: z.array(sessionSchema) })`. If schema changed (e.g., became raw array `z.array(...)`), update route handler to return `await lmsSessionApi.reorder(...)` directly without `.then(wrap)`.
- **Test-count outside [957, 959] range** — surface with delta breakdown.
- **Husky pre-commit blocks intermediate commit** — should not happen given additive analysis; surface if it does.
- **Domain semantic doubt** — per `[[coach-pov-first]]`, cite `analysis/artifacts/` instead of instinct.

Hypothesis format: "[surfaced finding]; from a [coach/engineering] perspective the answer is probably X because [rationale]; right?"

---

## § 9 — Output report format

Write to `implementation/step-06.4.5/output.md` per WORKFLOW.md "output.md format" section. Required headers in order:

- `## Что сделано` — Russian narrative, 4-8 lines.
- `## Изменённые/созданные файлы` — bulleted by phase, file count totals.
- `## Принятые решения` — D-numbered minor deviations.
- `## Возникшие вопросы и как решены` — escalations + resolutions (or "no escalations").
- `## Что отложено` — bullet list of newly-identified follow-ups not in this step's scope.
- ``## Ссылка на `.feature-dev/<ts>/``` — research/design/review artifacts.
- `## Verification notes` — per-gate output with counts.
- `## Acceptance criteria self-check` — checkbox list mirroring § 5.1-5.5.

No smoke-test section (N/A — api-server + route-layer step; see § 4).

---

## § 10 — One-line scope summary

> Wrap `lmsSessionApi.create` Serializable transaction in the `retryOnP2034` helper born in Step 6.4 (1-line apply + 1 integration test closing Step 6.1 QA-002 carry-forward) and add 4 platform HTTP route handlers across 3 new files (POST create + PUT reorder day-level, multiplexed PUT update + DELETE id-level mirroring `enrollments/[enrollmentId]/route.ts` precedent). 3 phases / 2 packages / 5 file pivots / 3 atomic commits / additive only.
