# Step 7.1 — `lmsBlockApi` (CRUD + reorder + assignLabels M:N) + `verifyBlockOwnership` + `mapToBlock`

**Branch**: `feat/training-domain` (HEAD `523e16d9` post-Step-7.0 close-out; 3 commits ahead of `main`). Stay on this branch — do NOT cut a feature branch (see § Execution mode).
**Type**: api-server slice. Single package surface (`packages/api-server/src/`). First consumer of the Step 7.0 Block contract slice (`@repo/contracts/lms/block`).
**Scope**: ship `lmsBlockApi` with **5 methods** (`create` / `update` / `delete` / `reorder` / `assignLabels` M:N) + `verifyBlockOwnership` guard + `mapToBlock` mapper + structural-symmetry barrel + ~18-22 integration tests. Mirror `lmsSessionApi` Step 6.1 patterns (Serializable + intra-tx TOCTOU re-check + sparse-int order + `retryOnP2034` wraps where SSI-vulnerable).

**Execution mode**: **`/feature` full pipeline** per `[[always-via-feature-skill]]` (server slice + ~20 integration tests + Stage 5 reviewer + Stage 6 hostile QA — D-7 invariant + cascade behaviour + concurrent SSI surfaces value). **Branch-cut override MANDATORY**: this step lives on long-lived `feat/training-domain` per `[[training-domain-workflow]]`. If `/feature` Stage 0 (Research) attempts `git checkout -b feat/<slug>` from main, you MUST **STOP** and `AskUserQuestion` showing the attempted branch + planner's override directive, then continue on the current `feat/training-domain` branch (do NOT create `feat/<slug>`). All commits land on `feat/training-domain`.

---

## § 0. Hard triggers — read-then-act gate

Before any code, **verify every verbatim quote in § 0.1-0.11 against HEAD `523e16d9` byte-for-byte**. If any quote diverges, **STOP**, run `AskUserQuestion` showing the actual content + this prompt's claim, wait for planner ratification. Do NOT silently adapt — planner owns prompt errors.

### § 0.0 Prior-implementation trace stops

This is the **4th attempt** at this domain; prior three were deleted (per `implementation/WORKFLOW.md`). If you encounter vocab like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — STOP and surface. The only legitimate sources are `analysis/artifacts/`, the live Prisma schema, the Step 7.0 contracts, and the Session mirror referenced here.

### § 0.A Zero-state verification commands

Run these at executor launch and verify expected counts:

```bash
ls packages/api-server/src/endpoints/lms/block/ 2>/dev/null
# Expected: directory does NOT exist. If exists, STOP and surface — Step 7.1 partially done earlier.

ls packages/api-server/src/mappers/lms/block.mapper.ts 2>/dev/null
# Expected: file does NOT exist. If exists, STOP and surface.

grep -rln "lmsBlockApi\|verifyBlockOwnership\|mapToBlock" packages/api-server/src/
# Expected: 0 hits. If non-zero, STOP and surface — Step 7.1 partially landed.

grep -rln "@repo/contracts/lms/block" packages/api-server/src/
# Expected: 0 hits. Step 7.1 IS the first consumer of the Step 7.0 contracts.

grep -rln "@repo/contracts/lms/block" apps/
# Expected: 0 hits. UI/route consumers arrive Steps 7.2-7.4.
```

### § 0.1 Canonical mirror — `lmsSessionApi` (`packages/api-server/src/endpoints/lms/session/admin.ts`, full)

**`lmsBlockApi` mirrors this file's shape 1:1.** Read verbatim — every pattern below (outer guard, `verifyPlanEditable`, `retryOnP2034` wrap, intra-tx TOCTOU re-check, `_max(order) ?? 0 + 10`, conditional-spread update body, complete-set reorder check, sparse-int recompute via array-tx) is the mandatory template.

```ts
import { Prisma } from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import { type AppLevelValue } from "@repo/contracts/lms/label";
import {
  type CreateSessionData,
  type ReorderSessionsData,
  type Session,
  type UpdateSessionData,
} from "@repo/contracts/lms/session";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import {
  verifyPlanEditable,
  verifyPlanOwnership,
  verifySessionOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToSession } from "../../../mappers/lms";
import { handlePrismaError, retryOnP2034 } from "../../../utils";
import { DAY_OF_WEEK_TO_PRISMA, resolveWeekStartDate } from "../_shared";

export const lmsSessionApi = {
  create: async (
    userId: string,
    planId: string,
    startDateParam: string,
    dayOfWeek: DayOfWeek,
    data: CreateSessionData,
  ): Promise<Session> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const startDate = resolveWeekStartDate(startDateParam);
    const prismaDayOfWeek = DAY_OF_WEEK_TO_PRISMA[dayOfWeek];

    try {
      const session = await retryOnP2034(() =>
        prisma.$transaction(
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
        ),
      );

      return mapToSession(session);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session" });
    }
  },

  update: async (userId: string, sessionId: string, data: UpdateSessionData): Promise<Session> => {
    const owner = await verifySessionOwnership(sessionId, userId);

    verifyPlanEditable(owner);

    if (data.labelId !== null && data.labelId !== undefined) {
      const label = await prisma.label.findUnique({
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

    try {
      const session = await prisma.session.update({
        where: { id: sessionId },
        data: {
          ...(data.labelId !== undefined && { labelId: data.labelId }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      return mapToSession(session);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session" });
    }
  },

  delete: async (userId: string, sessionId: string): Promise<void> => {
    const owner = await verifySessionOwnership(sessionId, userId);

    verifyPlanEditable(owner);

    try {
      await prisma.session.delete({ where: { id: sessionId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Session" });
    }
  },

  reorder: async (
    userId: string,
    planId: string,
    startDateParam: string,
    dayOfWeek: DayOfWeek,
    data: ReorderSessionsData,
  ): Promise<Session[]> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const startDate = resolveWeekStartDate(startDateParam);
    const prismaDayOfWeek = DAY_OF_WEEK_TO_PRISMA[dayOfWeek];

    const week = await prisma.week.findUnique({
      where: { planId_startDate: { planId, startDate } },
      select: { id: true },
    });

    if (!week) {
      throw new BadRequestError("Cannot reorder sessions in an unmaterialized day slot", {
        planId,
        startDate: startDateParam,
        dayOfWeek,
      });
    }

    const day = await prisma.day.findUnique({
      where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: prismaDayOfWeek } },
      select: { id: true },
    });

    if (!day) {
      throw new BadRequestError("Cannot reorder sessions in an unmaterialized day slot", {
        planId,
        startDate: startDateParam,
        dayOfWeek,
      });
    }

    const sessions = await prisma.session.findMany({
      where: { id: { in: data.orderedIds } },
      select: { id: true, dayId: true },
    });

    if (sessions.length !== data.orderedIds.length) {
      throw new BadRequestError("Some orderedIds reference non-existent sessions", {
        missing: data.orderedIds.filter((id) => !sessions.some((s) => s.id === id)),
      });
    }

    const foreignDayIds = sessions.filter((s) => s.dayId !== day.id);

    if (foreignDayIds.length > 0) {
      throw new BadRequestError("Some orderedIds do not belong to the target day", {
        foreignIds: foreignDayIds.map((s) => s.id),
      });
    }

    const dayCount = await prisma.session.count({ where: { dayId: day.id } });

    if (data.orderedIds.length !== dayCount) {
      throw new BadRequestError("orderedIds must include every session in the target day", {
        provided: data.orderedIds.length,
        expected: dayCount,
      });
    }

    try {
      const updated = await prisma.$transaction(
        data.orderedIds.map((id, i) =>
          prisma.session.update({ where: { id }, data: { order: (i + 1) * 10 } }),
        ),
      );

      return updated.map(mapToSession);
    } catch (error) {
      return handlePrismaError(error, { entity: "Session" });
    }
  },
};
```

### § 0.2 Canonical guard mirror — `verifySessionOwnership` (`packages/api-server/src/authz/guards.ts`, lines 119-171)

```ts
export const verifySessionOwnership = async (
  sessionId: string,
  userId: string,
): Promise<{ status: TrainingPlanStatus; dayId: string; weekId: string; planId: string }> => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      dayId: true,
      day: {
        select: {
          weekId: true,
          week: {
            select: {
              planId: true,
              plan: { select: { creatorId: true, deletedAt: true, status: true } },
            },
          },
        },
      },
    },
  });

  if (!session || session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Session not found", { sessionId });
  }

  const plan = session.day.week.plan;

  if (plan.creatorId === userId) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      dayId: session.dayId,
      weekId: session.day.weekId,
      planId: session.day.week.planId,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && isAdminOrHeadCoach(ROLE_MAP[user.role])) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      dayId: session.dayId,
      weekId: session.day.weekId,
      planId: session.day.week.planId,
    };
  }

  throw new ForbiddenError("Session does not belong to this coach");
};
```

`verifyBlockOwnership` mirrors this 1:1 with one extra JOIN layer (`block → session → day → week → plan`) and returns `{status, sessionId, dayId, weekId, planId}` (extra `sessionId` field for reuse in Step 8 Schema ownership chain).

### § 0.3 `retryOnP2034` helper (`packages/api-server/src/utils/retry-on-p2034.ts`, full)

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

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isP2034(error)) {
        throw error;
      }

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

### § 0.4 Mapper precedents

**`packages/api-server/src/mappers/lms/session.mapper.ts` (full — trivial scalar copy)**:

```ts
import { type Session as PrismaSession } from "@prisma/client";

import { type Session } from "@repo/contracts/lms/session";

export const mapToSession = (s: PrismaSession): Session => ({
  id: s.id,
  dayId: s.dayId,
  order: s.order,
  labelId: s.labelId,
  notes: s.notes,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});
```

**`packages/api-server/src/mappers/lms/label.mapper.ts` (full — used by `mapToBlockWithLabels` for embed)**:

```ts
import { type Label as PrismaLabel } from "@prisma/client";

import { type AppLevelValue, type Label } from "@repo/contracts/lms/label";

export const mapToLabel = (row: PrismaLabel): Label => ({
  id: row.id,
  name: row.name,
  nameLower: row.nameLower,
  applicableLevels: row.applicableLevels as AppLevelValue[],
  notes: row.notes,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
```

**`packages/api-server/src/mappers/lms/day.mapper.ts` (full — embedded-array pattern precedent)**:

```ts
import {
  type Day as PrismaDay,
  type Label as PrismaLabel,
  type Session as PrismaSession,
} from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import { type DaySlot } from "@repo/contracts/lms/day";

import { mapToLabel } from "./label.mapper";
import { mapToSession } from "./session.mapper";

type DayWithRelations = PrismaDay & {
  label: PrismaLabel | null;
  sessions: (PrismaSession & { label: PrismaLabel | null })[];
};

export const mapToDaySlot = (dayOfWeek: DayOfWeek, day: DayWithRelations | null): DaySlot => ({
  dayOfWeek,
  label: day?.label ? mapToLabel(day.label) : null,
  notes: day?.notes ?? null,
  sessions: (day?.sessions ?? []).map((s) => ({
    ...mapToSession(s),
    label: s.label ? mapToLabel(s.label) : null,
  })),
});
```

### § 0.5 `handlePrismaError` codes that fire in Step 7.1 (`packages/api-server/src/utils/prisma-error-handler.ts`, full)

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

**Note**: `retryOnP2034` wraps the tx **inside** the `try {...} catch` block in api method bodies — P2034 is consumed by `retryOnP2034` first; if all retries exhaust, `ServiceUnavailableError` propagates. `handlePrismaError` sees P2034 only if the call wasn't `retryOnP2034`-wrapped (which shouldn't happen for `create` / `assignLabels` per § 3 Phase 3). P2003 (FK violation) fires for `assignLabels` if a `labelId` references a non-existent Label — mapped to `BadRequestError` with the entity context.

### § 0.6 Step 7.0 contracts — `@repo/contracts/lms/block`

**`packages/contracts/src/entities/lms/block/index.ts` (full)**:

```ts
export * from "./block.constants";
export * from "./block.schema";
export * from "./block.types";
export * from "./block-api.schema";
export * from "./block-api.types";
```

**`packages/contracts/src/entities/lms/block/block.constants.ts` (full)**:

```ts
export const BLOCK_CONSTANTS = {
  MAX_NOTES_LENGTH: 2000,
  MAX_LABELS_PER_BLOCK: 10,
} as const;
```

**`packages/contracts/src/entities/lms/block/block.schema.ts` (full)**:

```ts
import { z } from "zod";

import { intensitySchema, timeCapSchema } from "../_shared";
import { labelSchema } from "../label";

import { BLOCK_CONSTANTS } from "./block.constants";

export const blockSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  order: z.number().int().positive(),
  intensity: intensitySchema.nullable(),
  timeCap: timeCapSchema.nullable(),
  notes: z.string().nullable(),
  labels: z.array(labelSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBlockSchema = z.object({
  intensity: intensitySchema.nullable().optional(),
  timeCap: timeCapSchema.nullable().optional(),
  notes: z.string().max(BLOCK_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
  labelIds: z
    .array(z.string().cuid())
    .max(BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "labelIds must be unique",
    })
    .optional(),
});

export const updateBlockSchema = createBlockSchema;

export const reorderBlocksSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});

export const assignBlockLabelsSchema = z.object({
  labelIds: z
    .array(z.string().cuid())
    .max(BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "labelIds must be unique",
    }),
});
```

**`packages/contracts/src/entities/lms/block/block-api.schema.ts` (full)**:

```ts
import { z } from "zod";

import {
  assignBlockLabelsSchema,
  blockSchema,
  createBlockSchema,
  reorderBlocksSchema,
  updateBlockSchema,
} from "./block.schema";

export const blockBySessionParamsSchema = z.object({
  planId: z.string().cuid(),
  sessionId: z.string().cuid(),
});

export const blockByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  blockId: z.string().cuid(),
});

export const createBlockRequestSchema = createBlockSchema;
export const createBlockResponseSchema = blockSchema;

export const updateBlockRequestSchema = updateBlockSchema;
export const updateBlockResponseSchema = blockSchema;

export const reorderBlocksRequestSchema = reorderBlocksSchema;
export const reorderBlocksResponseSchema = z.object({
  blocks: z.array(blockSchema),
});

export const assignBlockLabelsRequestSchema = assignBlockLabelsSchema;
export const assignBlockLabelsResponseSchema = blockSchema;
```

**`packages/contracts/src/entities/lms/block/block.types.ts` (full)**:

```ts
import { type z } from "zod";

import {
  type assignBlockLabelsSchema,
  type blockSchema,
  type createBlockSchema,
  type reorderBlocksSchema,
  type updateBlockSchema,
} from "./block.schema";

export type Block = z.infer<typeof blockSchema>;
export type CreateBlockData = z.infer<typeof createBlockSchema>;
export type UpdateBlockData = z.infer<typeof updateBlockSchema>;
export type ReorderBlocksData = z.infer<typeof reorderBlocksSchema>;
export type AssignBlockLabelsData = z.infer<typeof assignBlockLabelsSchema>;
```

### § 0.7 Shared VOs — `@repo/contracts/lms/_shared` (Step 7.0)

**`packages/contracts/src/entities/lms/_shared/intensity.ts` (full)**:

```ts
import { z } from "zod";

export const HR_ZONES = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
export const NUMERIC_PACE_DISTANCE_UNITS = ["km", "mi", "m", "yd", "lap"] as const;
export const NUMERIC_PACE_TYPES = ["min_per_distance", "distance_per_min"] as const;
export const PACE_VALUES = ["easy", "moderate", "hard", "recovery"] as const;

export const effortPercentSchema = z.union([
  z.object({ value: z.number().positive().max(100) }),
  z.object({
    range: z
      .object({
        min: z.number().positive().max(100),
        max: z.number().positive().max(100),
      })
      .refine((r) => r.min < r.max, { message: "range.min must be < range.max" }),
  }),
]);

export const rpeSchema = z.object({ value: z.number().positive().max(10) });

export const hrZoneSchema = z.object({
  zone: z.enum(HR_ZONES),
});

export const numericPaceSchema = z.object({
  value: z.string().min(1),
  distanceUnit: z.enum(NUMERIC_PACE_DISTANCE_UNITS),
  paceType: z.enum(NUMERIC_PACE_TYPES),
});

export const paceSchema = z.enum(PACE_VALUES);

export const intensitySchema = z
  .object({
    effortPercent: effortPercentSchema.optional(),
    rpe: rpeSchema.optional(),
    pace: paceSchema.optional(),
    hrZone: hrZoneSchema.optional(),
    numericPace: numericPaceSchema.optional(),
  })
  .refine(
    (v) =>
      v.effortPercent !== undefined ||
      v.rpe !== undefined ||
      v.pace !== undefined ||
      v.hrZone !== undefined ||
      v.numericPace !== undefined,
    { message: "intensity must set at least one dimension" },
  );

export type Intensity = z.infer<typeof intensitySchema>;
```

**`packages/contracts/src/entities/lms/_shared/time-cap.ts` (full)**:

```ts
import { z } from "zod";

export const TIME_CAP_UNITS = ["min", "sec"] as const;

export const timeCapSchema = z
  .object({
    min: z.number().positive(),
    max: z.number().positive().optional(),
    unit: z.enum(TIME_CAP_UNITS),
  })
  .refine((v) => v.max === undefined || v.min < v.max, {
    message: "timeCap.max must be > min when set",
  });

export type TimeCap = z.infer<typeof timeCapSchema>;
```

### § 0.8 Registration files — current state (verbatim at HEAD `523e16d9`)

**`packages/api-server/src/endpoints/lms/index.ts` (full, alphabetic order)**:

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

**Additive intent**: insert `export * from "./block";` between `./_shared` and `./day` (alphabetic — `b` follows `_shared` underscore-prefix).

**Final state**:

```ts
export * from "./_shared";
export * from "./block";
export * from "./day";
export * from "./exercise";
export * from "./label";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

**`packages/api-server/src/mappers/lms/index.ts` (full, alphabetic order)**:

```ts
export * from "./day.mapper";
export * from "./enum-maps";
export * from "./exercise.enum-maps";
export * from "./exercise.mapper";
export * from "./label.mapper";
export * from "./plan-enrollment.mapper";
export * from "./session.mapper";
export * from "./training-plan.mapper";
export * from "./week.mapper";
```

**Additive intent**: prepend `export * from "./block.mapper";` (alphabetic — `b` precedes `d`).

**Final state**:

```ts
export * from "./block.mapper";
export * from "./day.mapper";
export * from "./enum-maps";
export * from "./exercise.enum-maps";
export * from "./exercise.mapper";
export * from "./label.mapper";
export * from "./plan-enrollment.mapper";
export * from "./session.mapper";
export * from "./training-plan.mapper";
export * from "./week.mapper";
```

**`packages/api-server/src/endpoints/lms/_shared/index.ts` (full)** — no change required this step:

```ts
export * from "./date";
export * from "./day-of-week";
```

**Sibling barrel pattern — `packages/api-server/src/endpoints/lms/session/index.ts` (full)**:

```ts
export * from "./admin";
```

**New file** `packages/api-server/src/endpoints/lms/block/index.ts` mirrors this exactly:

```ts
export * from "./admin";
```

### § 0.9 Husky hooks + Turborepo fan-out (verbatim at HEAD `523e16d9`)

**`.husky/pre-commit` (full)**:

```sh
node scripts/check-secrets.mjs
npx lint-staged
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"
```

**`.husky/pre-push` (full)**:

```sh
pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"
```

**`turbo.json` task graph** (relevant excerpt):

```json
"check-types": { "dependsOn": ["^check-types"] },
"lint": { "dependsOn": ["^lint"] },
"test": { "cache": false }
```

**`turbo run check-types --filter="...[HEAD]"` semantics**: re-compile every package depending on (transitively) the files changed in HEAD. Step 7.1 = **`packages/api-server/` only, additive** (new files + new exports in existing barrels; never removes or breaks an existing export). Downstream consumers (`apps/admin`, `apps/platform`, route handlers importing `lmsSessionApi` from `@repo/api-server`) compile unchanged because Block API isn't imported anywhere yet (verified § 0.A grep returns 0). **Conclusion**: per-phase atomic commits (Phase 1 guard, Phase 2 mapper, Phase 3 endpoints+tests) leave the working tree green at every commit. **No husky-cross-package-squash trigger.** See § 7.

### § 0.10 Prisma schema — Block + BlockLabelAssignment + Session + Label (verbatim)

**`packages/api-server/prisma/schema.prisma` lines 633-684 (Session + Block + BlockLabelAssignment)**:

```prisma
model Session {
  id                    String   @id @default(cuid())
  dayId                 String
  order                 Int
  labelId               String?
  notes                 String?
  freezeLoadsAtCreation Boolean  @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  day               Day                @relation(fields: [dayId], references: [id], onDelete: Cascade)
  label             Label?             @relation(fields: [labelId], references: [id], onDelete: Restrict)
  blocks            Block[]
  performedSessions PerformedSession[]

  @@index([dayId, order])
  @@index([labelId])
  @@map("training_sessions")
}

model Block {
  id        String   @id @default(cuid())
  sessionId String
  order     Int
  intensity Json?
  timeCap   Json?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  session          Session                @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  labelAssignments BlockLabelAssignment[]
  schemas          Schema[]

  @@index([sessionId, order])
  @@map("training_blocks")
}

model BlockLabelAssignment {
  id      String @id @default(cuid())
  blockId String
  labelId String
  order   Int

  block Block @relation(fields: [blockId], references: [id], onDelete: Cascade)
  label Label @relation(fields: [labelId], references: [id], onDelete: Restrict)

  @@unique([blockId, labelId])
  @@index([blockId, order])
  @@index([labelId])
  @@map("training_block_label_assignments")
}
```

**`packages/api-server/prisma/schema.prisma` lines 779-794 (Label)**:

```prisma
model Label {
  id               String   @id @default(cuid())
  name             String
  nameLower        String   @unique
  applicableLevels Json
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  days             Day[]
  sessions         Session[]
  blockAssignments BlockLabelAssignment[]

  @@index([name])
  @@map("training_labels")
}
```

**Key observations**:

- **`Block.session onDelete: Cascade`** — `delete` Block does not cascade upward; **`delete` Session cascades to Block** (Step 6.1 case confirmed line 416-450 of `session/admin.test.ts`).
- **`BlockLabelAssignment.block onDelete: Cascade`** — `delete` Block automatically removes its `BlockLabelAssignment[]` rows. Step 7.1 `delete` handler does NOT need an explicit pre-delete `tx.blockLabelAssignment.deleteMany`.
- **`BlockLabelAssignment.label onDelete: Restrict`** — cannot delete a Label that has block-assignments (would throw P2003; out of Step 7.1 scope — Label admin endpoint handles).
- **`@@unique([blockId, labelId])`** — `assignLabels` cannot insert the same `(blockId, labelId)` twice. **Concurrent `assignLabels` on the same `blockId` is SSI-vulnerable** per `[[postgres-ssi-upsert-unique-key]]` → wrap in `retryOnP2034`.
- **`Block.intensity Json?` / `Block.timeCap Json?`** — Prisma stores arbitrary JSON; the `intensitySchema` / `timeCapSchema` (§ 0.7) validate shape at write-time (route layer `.parse(...)`) and re-validate on read in `mapToBlock` per § 3 Phase 2 spec.
- **`Block.notes String?`** — present in schema; surfaced in Step 7.0 `blockSchema.notes: z.string().nullable()`. Step 7.1 handles `notes` in `create` and `update` paths.
- **`Block.order Int`** (no `@default(autoincrement())`) — server-controlled; Step 7.1 computes via `_max(order) ?? 0 + 10` (sparse-int per Phase 4 Q6).
- **`Label.applicableLevels Json`** (stored as JSON array, not `String[]`) — query via `array_contains: "BLOCK"` per Step 6.4 pattern; in mapper cast as `AppLevelValue[]` (precedent `label.mapper.ts:9`).

### § 0.11 D-7 invariant carry-forward from Step 7.0 (HARD REQUIREMENT)

🔴 **`assignLabels(blockId, [])` MUST result in zero `BlockLabelAssignment` rows for `blockId`.**

`assignBlockLabelsSchema.labelIds: cuid[].max(10).unique` accepts empty array as valid input (no `.min(1)`). Semantic: empty array = **wipe all labels** (impossible to express in Zod schema layer — handler responsibility).

**Required server-handler implementation** (§ 3 Phase 3 elaborates):

```ts
// inside retryOnP2034(() => prisma.$transaction(async (tx) => { ... }, Serializable)):
await tx.blockLabelAssignment.deleteMany({ where: { blockId } });

if (data.labelIds.length > 0) {
  await tx.blockLabelAssignment.createMany({
    data: data.labelIds.map((labelId, i) => ({
      blockId,
      labelId,
      order: (i + 1) * 10,
    })),
  });
}
// fetch updated block + labelAssignments+label, return mapToBlockWithLabels
```

**Forbidden alternatives** (silent-bug risk):

- A generic `if-else within tx` where the `createMany` always runs with `data: []` — Prisma `createMany({data: []})` is a runtime noop but the pattern is fragile (a future refactor may switch to `create` in a loop which throws on empty). **Use explicit `if (length > 0)` short-circuit.**
- Computing the order list outside the `if` block and passing `[]` to `createMany` — defeats the explicit-zero-insert invariant.

**Required integration test** (§ 3 Phase 4):

```ts
it("assignLabels([]) wipes all labels with zero insert (D-7 invariant)", async () => {
  // arrange: create Block + assignLabels([a, b, c]) → assert 3 rows
  // act: assignLabels([]) → assert returned Block.labels === []
  // assert: cleanupRaw.blockLabelAssignment.count({ where: { blockId } }) === 0
});
```

---

## § 1. What this step is

`lmsBlockApi` is the api-server slice for **Block-level operations** inside a Session — the second nesting layer below Day (`Day ⊃ Session ⊃ Block`). Block adds two domain wrinkles vs Session (Step 6.1):

1. **M:N labels with order** (`BlockLabelAssignment`) instead of single nullable `labelId`. The `assignLabels` endpoint replaces the entire set atomically per coach interaction; D-7 (§ 0.11) makes `[]` a valid "wipe-all" payload.
2. **Composite JSON-stored value objects** (`intensity`, `timeCap`) instead of plain scalars. `Block.intensity` and `Block.timeCap` are stored as `Json?` and re-validated through `intensitySchema` / `timeCapSchema` on both write (route-layer `.parse`) and read (`mapToBlock`).

**Block.parent = Session** which is materialized **before** Block can exist (Session.create is the materialization point per Step 6.1). Block.create therefore does **NOT** carry the `week.upsert → day.upsert` transitive materialization chain of Session.create — it takes a pre-existing `sessionId`, verifies parent existence + plan ownership, computes sparse-int `order`, and inserts.

**Five methods, each mirroring the lmsSessionApi pattern (§ 0.1)**:

- **`create(userId, planId, sessionId, data)`** — outer `verifySessionOwnership` returns `{status, ..., planId}`; assert `returned.planId === request planId` (defence-in-depth — the route layer also asserts but this catches a planner mistake in routes); `verifyPlanEditable`; inside `retryOnP2034 + prisma.$transaction(Serializable)` — re-check Plan (TOCTOU), re-check Session (TOCTOU; could be deleted mid-tx), validate each `labelId` (existence + `BLOCK` in `applicableLevels`), compute `_max(order)`, insert Block, conditionally insert BlockLabelAssignment rows.
- **`update(userId, blockId, data)`** — `verifyBlockOwnership` + `verifyPlanEditable`; **silently ignore `data.labelIds`** (per ratified hypothesis OQ-b1 from thesis; labels are mutated via `assignLabels` endpoint only); conditional-spread Prisma update of `intensity` / `timeCap` / `notes`. `Prisma.JsonNull` is used to store `null` in Json columns (raw `null` reads as "do not touch"); see § 3 Phase 3 for snippet.
- **`delete(userId, blockId)`** — `verifyBlockOwnership` + `verifyPlanEditable`; single `prisma.block.delete`. Cascades drop `BlockLabelAssignment[]` and `Schema[]` via FK `onDelete: Cascade` (per § 0.10).
- **`reorder(userId, planId, sessionId, data)`** — `verifySessionOwnership` + `planId` assertion + `verifyPlanEditable`; mirror Session reorder: `prisma.block.count({where:{sessionId}})` complete-set check + foreign-session check + non-existent-id check + array-tx `(i+1)*10` recompute.
- **`assignLabels(userId, blockId, data)`** — `verifyBlockOwnership` + `verifyPlanEditable`; inside `retryOnP2034 + prisma.$transaction(Serializable)` — validate each `labelId` (existence + `BLOCK` in `applicableLevels`), unconditional `tx.blockLabelAssignment.deleteMany({where:{blockId}})`, **if `labelIds.length > 0`** `tx.blockLabelAssignment.createMany({...})` with `order = (i+1)*10`; re-fetch Block with `include: {labelAssignments: {include: {label: true}, orderBy: {order: "asc"}}}` and return `mapToBlockWithLabels(block)`.

**`verifyBlockOwnership` guard** — new helper in `authz/guards.ts`, mirrors `verifySessionOwnership` shape (§ 0.2) plus one extra JOIN level (block → session → day → week → plan), returns `{status, sessionId, dayId, weekId, planId}`. Reusable for Step 7.2 routes + Step 8 Schema ownership chain.

**`mapToBlock` + `mapToBlockWithLabels`** — `block.mapper.ts`. `mapToBlock` is scalar (id/sessionId/order/notes/createdAt/updatedAt) + parsed (`intensity`/`timeCap`) + empty labels (`labels: []`). `mapToBlockWithLabels` extends `mapToBlock` with `labels` sorted by `labelAssignments[i].order ascending` and each mapped through `mapToLabel`.

**Out of scope**: HTTP routes (Step 7.2), client API + hooks (Step 7.3), UI (Step 7.4 BlockList + BlockCard), Intensity/TimeCap form widgets (Step 7.5), Schema entity (Step 8). No Prisma schema change. No seed change. No `analysis/artifacts/` change.

**Hard binding** — `Session.freezeLoadsAtCreation` continues to be **out of scope** per Step 6.0 Q10 (carry-forward indefinite). Block does not have an analogous field; do not invent one.

---

## § 2. Inputs / Outputs / Dependencies

### Inputs (verified consumable)

- Step 7.0 contracts at HEAD `523e16d9`: `blockSchema`, `createBlockSchema`, `updateBlockSchema`, `reorderBlocksSchema`, `assignBlockLabelsSchema`, `blockBySessionParamsSchema`, `blockByIdParamsSchema`; types `Block`, `CreateBlockData`, `UpdateBlockData`, `ReorderBlocksData`, `AssignBlockLabelsData`; constants `BLOCK_CONSTANTS.{MAX_NOTES_LENGTH=2000, MAX_LABELS_PER_BLOCK=10}`. Shared VOs `intensitySchema`, `timeCapSchema` with inferred types `Intensity`, `TimeCap`.
- Prisma `Block`, `BlockLabelAssignment`, `Label`, `Session`, `Day`, `Week`, `TrainingPlan` (§ 0.10).
- Existing helpers: `verifyPlanOwnership` / `verifyPlanEditable` / `verifySessionOwnership` (`authz/guards.ts`); `retryOnP2034` (`utils/retry-on-p2034.ts`); `handlePrismaError` (`utils/prisma-error-handler.ts`); `mapToLabel` (`mappers/lms/label.mapper.ts`); `DAY_OF_WEEK_TO_PRISMA`, `resolveWeekStartDate` (`endpoints/lms/_shared/`).
- Test helpers: `cleanupRaw`, `createTestCoach`, `createTestPlan` (`packages/api-server/src/test/helpers.ts`) — patterns demonstrated in `session/admin.test.ts` (§ 0.1 references) and `guards.test.ts`.

### Outputs (new + edited files)

**New (5 files)**:

- `packages/api-server/src/endpoints/lms/block/admin.ts` — `lmsBlockApi` with 5 methods.
- `packages/api-server/src/endpoints/lms/block/admin.test.ts` — integration tests, ~18-22 cases.
- `packages/api-server/src/endpoints/lms/block/index.ts` — barrel `export * from "./admin";` (1 line, structural symmetry with `session/index.ts`).
- `packages/api-server/src/mappers/lms/block.mapper.ts` — `mapToBlock` + `mapToBlockWithLabels`.
- (no separate guard-only test file — `verifyBlockOwnership` cases added to existing `authz/guards.test.ts`)

**Edited (3 files)**:

- `packages/api-server/src/authz/guards.ts` — append `verifyBlockOwnership` (mirror `verifySessionOwnership` shape, plus extra `sessionId` field).
- `packages/api-server/src/authz/guards.test.ts` — append `verifyBlockOwnership` `describe` block with ~4 cases (owner / non-owner / head-coach / not-found).
- `packages/api-server/src/endpoints/lms/index.ts` — insert `export * from "./block";` alphabetically (§ 0.8 final state).
- `packages/api-server/src/mappers/lms/index.ts` — prepend `export * from "./block.mapper";` (§ 0.8 final state).

**Total**: 5 new files + 3 edited files = 8 file changes. Single package = `packages/api-server/`.

### Dependencies

- **Hard**: Step 7.0 contracts (already shipped, verified § 0.6).
- **Hard**: `retryOnP2034`, `verifyPlanOwnership`, `verifyPlanEditable`, `handlePrismaError` (already shipped).
- **None new**: no `pnpm install` required; no Prisma migration; no seed change; no shared package edits.

---

## § 3. Phases (executor must follow this order; each phase has its own commit per § 7)

### Phase 1 — `verifyBlockOwnership` guard

**File**: `packages/api-server/src/authz/guards.ts` (append at end of file, after `verifySessionOwnership` line 171).

**Implementation skeleton** (mirror `verifySessionOwnership` § 0.2):

```ts
export const verifyBlockOwnership = async (
  blockId: string,
  userId: string,
): Promise<{
  status: TrainingPlanStatus;
  sessionId: string;
  dayId: string;
  weekId: string;
  planId: string;
}> => {
  const block = await prisma.block.findUnique({
    where: { id: blockId },
    select: {
      sessionId: true,
      session: {
        select: {
          dayId: true,
          day: {
            select: {
              weekId: true,
              week: {
                select: {
                  planId: true,
                  plan: { select: { creatorId: true, deletedAt: true, status: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!block || block.session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Block not found", { blockId });
  }

  const plan = block.session.day.week.plan;

  if (plan.creatorId === userId) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      sessionId: block.sessionId,
      dayId: block.session.dayId,
      weekId: block.session.day.weekId,
      planId: block.session.day.week.planId,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && isAdminOrHeadCoach(ROLE_MAP[user.role])) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      sessionId: block.sessionId,
      dayId: block.session.dayId,
      weekId: block.session.day.weekId,
      planId: block.session.day.week.planId,
    };
  }

  throw new ForbiddenError("Block does not belong to this coach");
};
```

**File**: `packages/api-server/src/authz/guards.test.ts` — append `describe("verifyBlockOwnership", () => {...})` block with ~4 cases mirroring `describe("verifyPlanOwnership", ...)` pattern (`guards.test.ts:104-152`): owner-returns-status / non-owner-throws-Forbidden / head-coach-bypass-returns-status / not-found-throws-NotFoundError. For setup, create a Week + Day + Session + Block chain via `cleanupRaw.{week,day,session,block}.create`. Add cleanup in `afterAll` (or per-test try/finally if simpler). **Use `crypto.randomUUID().slice(0, 8)` for any test-suite-scoped label uniqueness** if labels surface; for guard tests labels are not needed.

**Commit 1** (after Phase 1): `feat(api-server): add verifyblockownership guard for block ownership chain`.

### Phase 2 — `mapToBlock` + `mapToBlockWithLabels`

**File**: `packages/api-server/src/mappers/lms/block.mapper.ts` (new).

```ts
import {
  type Block as PrismaBlock,
  type BlockLabelAssignment as PrismaBlockLabelAssignment,
  type Label as PrismaLabel,
} from "@prisma/client";

import { intensitySchema, timeCapSchema } from "@repo/contracts/lms/_shared";
import { type Block } from "@repo/contracts/lms/block";

import { mapToLabel } from "./label.mapper";

type BlockWithLabels = PrismaBlock & {
  labelAssignments: (PrismaBlockLabelAssignment & { label: PrismaLabel })[];
};

export const mapToBlock = (b: PrismaBlock): Block => ({
  id: b.id,
  sessionId: b.sessionId,
  order: b.order,
  intensity: b.intensity === null ? null : intensitySchema.parse(b.intensity),
  timeCap: b.timeCap === null ? null : timeCapSchema.parse(b.timeCap),
  notes: b.notes,
  labels: [],
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});

export const mapToBlockWithLabels = (b: BlockWithLabels): Block => ({
  ...mapToBlock(b),
  labels: [...b.labelAssignments]
    .sort((a, x) => a.order - x.order)
    .map((la) => mapToLabel(la.label)),
});
```

**Notes**:

- `intensitySchema.parse` / `timeCapSchema.parse` re-validate Json content on read (per OQ-e ratified hypothesis). If DB content is corrupted (manual SQL edit, future migration mistake), the `ZodError` surfaces explicitly — not silently propagated. Cost is negligible (~5µs/Block). Do NOT use `as Intensity | null` (violates `[[type-quality]]` zero-tolerance for type hacks).
- `mapToBlock` returns `labels: []` because the unjoined Prisma `Block` row doesn't carry assignments. Use `mapToBlockWithLabels` in any code path that needs populated labels (`assignLabels` return path; `create` return path when `labelIds` was non-empty).
- `[...b.labelAssignments]` creates a shallow copy so `.sort` doesn't mutate Prisma's reference (defensive — Prisma may reuse the array across reads).

**Edit** `packages/api-server/src/mappers/lms/index.ts` per § 0.8 final state (prepend `export * from "./block.mapper";`).

**Commit 2** (after Phase 2): `feat(api-server): add lms block mapper with embedded labels and intensity timecap parse`.

### Phase 3 — `lmsBlockApi` (5 methods) + barrel + index registration

**File**: `packages/api-server/src/endpoints/lms/block/admin.ts` (new).

```ts
import { Prisma } from "@prisma/client";

import { type AppLevelValue } from "@repo/contracts/lms/label";
import {
  type AssignBlockLabelsData,
  type Block,
  type CreateBlockData,
  type ReorderBlocksData,
  type UpdateBlockData,
} from "@repo/contracts/lms/block";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import {
  verifyBlockOwnership,
  verifyPlanEditable,
  verifySessionOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToBlock, mapToBlockWithLabels } from "../../../mappers/lms";
import { handlePrismaError, retryOnP2034, toInputJson } from "../../../utils";

const BLOCK_WITH_LABELS_INCLUDE = {
  labelAssignments: {
    include: { label: true },
    orderBy: { order: "asc" as const },
  },
};

const assertLabelsApplicable = async (
  tx: Prisma.TransactionClient,
  labelIds: readonly string[],
): Promise<void> => {
  if (labelIds.length === 0) {
    return;
  }

  const labels = await tx.label.findMany({
    where: { id: { in: [...labelIds] } },
    select: { id: true, applicableLevels: true },
  });

  if (labels.length !== labelIds.length) {
    const missing = labelIds.filter((id) => !labels.some((l) => l.id === id));

    throw new NotFoundError("Label not found", { missing });
  }

  for (const label of labels) {
    const levels = label.applicableLevels as AppLevelValue[];

    if (!levels.includes("BLOCK")) {
      throw new BadRequestError("Label is not applicable to BLOCK level", {
        labelId: label.id,
        applicableLevels: levels,
      });
    }
  }
};

export const lmsBlockApi = {
  create: async (
    userId: string,
    planId: string,
    sessionId: string,
    data: CreateBlockData,
  ): Promise<Block> => {
    const owner = await verifySessionOwnership(sessionId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Session not found", { sessionId, planId });
    }

    verifyPlanEditable(owner);

    const labelIds = data.labelIds ?? [];

    try {
      const block = await retryOnP2034(() =>
        prisma.$transaction(
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

            const sessionCheck = await tx.session.findUnique({
              where: { id: sessionId },
              select: { id: true, day: { select: { week: { select: { planId: true } } } } },
            });

            if (!sessionCheck || sessionCheck.day.week.planId !== planId) {
              throw new NotFoundError("Session not found", { sessionId, planId });
            }

            await assertLabelsApplicable(tx, labelIds);

            const max = await tx.block.aggregate({
              where: { sessionId },
              _max: { order: true },
            });

            const nextOrder = (max._max.order ?? 0) + 10;

            const created = await tx.block.create({
              data: {
                sessionId,
                order: nextOrder,
                intensity:
                  data.intensity === undefined || data.intensity === null
                    ? Prisma.JsonNull
                    : toInputJson(data.intensity),
                timeCap:
                  data.timeCap === undefined || data.timeCap === null
                    ? Prisma.JsonNull
                    : toInputJson(data.timeCap),
                notes: data.notes ?? null,
              },
            });

            if (labelIds.length > 0) {
              await tx.blockLabelAssignment.createMany({
                data: labelIds.map((labelId, i) => ({
                  blockId: created.id,
                  labelId,
                  order: (i + 1) * 10,
                })),
              });
            }

            return tx.block.findUniqueOrThrow({
              where: { id: created.id },
              include: BLOCK_WITH_LABELS_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToBlockWithLabels(block);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  update: async (userId: string, blockId: string, data: UpdateBlockData): Promise<Block> => {
    const owner = await verifyBlockOwnership(blockId, userId);

    verifyPlanEditable(owner);

    try {
      const updated = await prisma.block.update({
        where: { id: blockId },
        data: {
          ...(data.intensity !== undefined && {
            intensity: data.intensity === null ? Prisma.JsonNull : toInputJson(data.intensity),
          }),
          ...(data.timeCap !== undefined && {
            timeCap: data.timeCap === null ? Prisma.JsonNull : toInputJson(data.timeCap),
          }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
        include: BLOCK_WITH_LABELS_INCLUDE,
      });

      return mapToBlockWithLabels(updated);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  delete: async (userId: string, blockId: string): Promise<void> => {
    const owner = await verifyBlockOwnership(blockId, userId);

    verifyPlanEditable(owner);

    try {
      await prisma.block.delete({ where: { id: blockId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  reorder: async (
    userId: string,
    planId: string,
    sessionId: string,
    data: ReorderBlocksData,
  ): Promise<Block[]> => {
    const owner = await verifySessionOwnership(sessionId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Session not found", { sessionId, planId });
    }

    verifyPlanEditable(owner);

    const blocks = await prisma.block.findMany({
      where: { id: { in: [...data.orderedIds] } },
      select: { id: true, sessionId: true },
    });

    if (blocks.length !== data.orderedIds.length) {
      throw new BadRequestError("Some orderedIds reference non-existent blocks", {
        missing: data.orderedIds.filter((id) => !blocks.some((b) => b.id === id)),
      });
    }

    const foreignSessionIds = blocks.filter((b) => b.sessionId !== sessionId);

    if (foreignSessionIds.length > 0) {
      throw new BadRequestError("Some orderedIds do not belong to the target session", {
        foreignIds: foreignSessionIds.map((b) => b.id),
      });
    }

    const sessionCount = await prisma.block.count({ where: { sessionId } });

    if (data.orderedIds.length !== sessionCount) {
      throw new BadRequestError("orderedIds must include every block in the target session", {
        provided: data.orderedIds.length,
        expected: sessionCount,
      });
    }

    try {
      const updated = await prisma.$transaction(
        data.orderedIds.map((id, i) =>
          prisma.block.update({ where: { id }, data: { order: (i + 1) * 10 } }),
        ),
      );

      return updated.map(mapToBlock);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  assignLabels: async (
    userId: string,
    blockId: string,
    data: AssignBlockLabelsData,
  ): Promise<Block> => {
    const owner = await verifyBlockOwnership(blockId, userId);

    verifyPlanEditable(owner);

    try {
      const block = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            await assertLabelsApplicable(tx, data.labelIds);

            await tx.blockLabelAssignment.deleteMany({ where: { blockId } });

            if (data.labelIds.length > 0) {
              await tx.blockLabelAssignment.createMany({
                data: data.labelIds.map((labelId, i) => ({
                  blockId,
                  labelId,
                  order: (i + 1) * 10,
                })),
              });
            }

            return tx.block.findUniqueOrThrow({
              where: { id: blockId },
              include: BLOCK_WITH_LABELS_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToBlockWithLabels(block);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },
};
```

**Notes on `update` ignoring `labelIds`** (ratified OQ-b1):

`updateBlockSchema = createBlockSchema` (per § 0.6) accepts `labelIds?` in the payload. The handler **silently ignores** that key — only `intensity` / `timeCap` / `notes` are conditional-spread into the Prisma update. Client (Step 7.3) must use the `assignLabels` endpoint to modify labels; it should NOT include `labelIds` in its `useUpdateBlock` payload. This mirrors the Session pattern (`update` doesn't have a labels-array surface). **Document this in a 1-line acceptance-criteria check (§ 5)**; do NOT add an inline code comment per `[[global-preferences]]`.

**Notes on `Prisma.JsonNull`**: when writing `null` to a `Json?` column, Prisma distinguishes "leave as-is" (raw `null` in `data`) from "set to JSON null" (`Prisma.JsonNull`). Step 7.1 wants the latter when the payload explicitly says `intensity: null`. Use the `toInputJson` helper (`packages/api-server/src/utils/to-input-json.ts:1-4`) for the non-null branch — it asserts the type to `Prisma.InputJsonValue` (the only acceptable pattern in this codebase per existing usage; not a `[[type-quality]]` violation because the upstream Zod-validated payload guarantees shape).

**File**: `packages/api-server/src/endpoints/lms/block/index.ts` (new, 1 line):

```ts
export * from "./admin";
```

**Edit** `packages/api-server/src/endpoints/lms/index.ts` per § 0.8 final state (insert `export * from "./block";` alphabetically between `_shared` and `day`).

**Commit 3** (after Phase 3 + Phase 4 tests are green): `feat(api-server): add lmsblockapi with crud reorder and assignlabels m:n`.

### Phase 4 — Integration tests (`packages/api-server/src/endpoints/lms/block/admin.test.ts`)

**Mirror `session/admin.test.ts` structure** (§ 0.1 referenced lines 1-689): top-level `describe("lmsBlockApi", ...)`, `beforeAll` provisions 2 coaches + active + archived plan + Week + Day + Session (reuse for most cases) + 3 labels with `applicableLevels` covering `BLOCK`-only, `SESSION`-only, `DAY`-only (mirror session test labels at lines 39-71); `afterAll` cleans block → session → day → week → label → plan → coachProfile → user.

**Required cases** (target: 18-22 total; split across `describe("create")`, `describe("update")`, `describe("delete")`, `describe("reorder")`, `describe("assignLabels")`):

**`describe("create")` (~7 cases)**:

1. `rejects when caller does not own the parent session's plan` — `otherCoach` → `ForbiddenError`; assert `block.count({sessionId}) === 0`.
2. `rejects on an archived plan` — coach owns plan but plan status `ARCHIVED` → `ForbiddenError` (intra-tx re-check fires).
3. `creates an empty Block` — `data: {}` → returns Block with `order=10`, `intensity=null`, `timeCap=null`, `notes=null`, `labels=[]`.
4. `creates a Block with labelIds[3]` — returns Block with `labels.length === 3`, orders in `BlockLabelAssignment` are 10/20/30 in submitted order (verify via `cleanupRaw.blockLabelAssignment.findMany({where:{blockId}, orderBy:{order:"asc"}})`).
5. `assigns the next sparse order on a populated session` — pre-create 2 Blocks with order 10/20, then create → `order=30`.
6. `rejects a labelId whose applicableLevels does not include BLOCK` — supply a SESSION-only labelId → `BadRequestError`; assert `block.count({sessionId}) === 0` (the tx rolled back).
7. `rejects when labelIds reference a non-existent label without side-effect` — supply `["clz0000000000000000000000"]` → `NotFoundError`; assert `block.count({sessionId}) === 0`.
8. **Concurrent create**: `concurrent Block.create on same session — at least one succeeds via P2034 retry`. Mirror `session/admin.test.ts:283-324` pattern. Two `Promise.allSettled`'d `lmsBlockApi.create` calls; assert fulfilled count ≥ 1; assert `block.count({sessionId}) === fulfilledCount`; if both fulfilled, assert orders 10 + 20 distinct.

**`describe("update")` (~3 cases)**:

9. `updates intensity, timeCap, and notes via conditional spread` — pre-create Block, call `update({intensity: {rpe: {value: 8}}, timeCap: {min: 10, unit: "min"}, notes: "hard"})` → returns Block with all three set; verify stored values via `cleanupRaw.block.findUnique`.
10. `clears intensity with intensity: null` — pre-create Block with `intensity` set, call `update({intensity: null})` → returned `block.intensity === null`; stored row has `intensity` as DB-null.
11. `silently ignores labelIds in the payload` (OQ-b1 invariant) — pre-create Block + assignLabels([a, b]); call `update({labelIds: [c]})` → returned Block.labels === [a, b] (unchanged); `BlockLabelAssignment.count({where:{blockId}}) === 2` (labels a/b still present, c not inserted).
12. `rejects non-owner` — pre-create Block, `otherCoach.update(...)` → `ForbiddenError`.

**`describe("delete")` (~2 cases)**:

13. `removes the Block and cascades labelAssignments + schemas` — pre-create Block + 2 BlockLabelAssignment rows + 1 Schema row (via `cleanupRaw.schema.create` directly, minimal valid row); call `delete`; assert Block / BlockLabelAssignment / Schema all gone (`findMany({where:{blockId}})` returns `[]`).
14. `rejects when caller does not own the block` — pre-create Block, `otherCoach.delete(...)` → `ForbiddenError`; assert Block still present.

**`describe("reorder")` (~3 cases — mirror Session reorder coverage)**:

15. `renumbers blocks on the happy path` — pre-create 3 Blocks order 10/20/30, reorder `[c, a, b]` → assert returned + stored orders are c=10, a=20, b=30.
16. `rejects when orderedIds is a subset` (QA-001 family) — pre-create 3 Blocks, reorder `[a, b]` → `BadRequestError`; orders unchanged.
17. `rejects ids that belong to a different session` — pre-create 2 Sessions in the same Day; create 1 Block in each; reorder targeting session A with `orderedIds: [blockA, blockB]` → `BadRequestError`; orders unchanged.
18. `rejects when orderedIds references a non-existent block` — pre-create 1 Block; reorder `[a, "clz0000000000000000000000"]` → `BadRequestError`.

**`describe("assignLabels")` (~5 cases — including D-7 invariant)**:

19. `assigns labels with sequential sparse order` — pre-create Block; `assignLabels({labelIds: [a, b, c]})` → returned `Block.labels.length === 3`; stored `BlockLabelAssignment.findMany({orderBy:{order:"asc"}})` orders are 10/20/30 and labelIds match `[a, b, c]`.
20. **D-7 invariant** `wipes all labels with empty array — zero insert` (CRITICAL): pre-create Block + `assignLabels([a, b, c])`; assert 3 rows present; call `assignLabels({labelIds: []})` → returned `Block.labels === []`; assert `cleanupRaw.blockLabelAssignment.count({where:{blockId}}) === 0`; **also** verify (via spy or by counting before+after) that NO `INSERT` happened — pragmatic version: assert stored array length is exactly 0 (a "noop insert with empty array" would leave 0 either way, but the explicit `if (length > 0)` guard ensures Prisma doesn't issue an `INSERT INTO ... VALUES` SQL with no values).
21. `replaces label set atomically` (set-semantic): pre-create Block + assignLabels([a, b, c]); call `assignLabels({labelIds: [a, b]})` → returned `Block.labels.length === 2` with labelIds matching `[a, b]`; assert stored orders are 10 + 20 (the previous `c` row deleted; `a`/`b` re-inserted with fresh orders, **not** retained from the prior set — that's the "delete-all-then-insert" semantic ratified OQ-c1).
22. `rejects a labelId whose applicableLevels does not include BLOCK` — supply a SESSION-only labelId in the `assignLabels` payload → `BadRequestError`; existing labels (if any) preserved (tx rolled back).
23. `rejects when labelIds reference a non-existent label` — supply `["clz0000000000000000000000"]` → `NotFoundError`; existing labels preserved.
24. (Optional, +1 if time permits) `concurrent assignLabels on same blockId — at least one succeeds via P2034 retry` — mirror create-concurrent pattern: 2 `Promise.allSettled`'d `assignLabels` with disjoint label sets; assert fulfilled ≥ 1; assert final state is the "last fulfilled" winner.

**`describe("verifyBlockOwnership")` in `guards.test.ts` (~4 cases)** — see Phase 1.

**Total target**: ~22-26 new cases (18-22 in `block/admin.test.ts` + 4 in `guards.test.ts`). Acceptable range for `pnpm test` delta: +22 to +30 (1036 baseline → 1058-1066).

**Commit 3 includes both endpoint and tests** — they must land together to keep the tree green.

### Phase 5 — Local verification

Run from repo root (each one independently):

```bash
pnpm --filter @repo/api-server test
# Expected: all api-server tests green (173 baseline + ~22-26 new = ~195-199 cases across 73 test files).

pnpm check-types
# Expected: 16/16 green.

pnpm lint
# Expected: 16/16 green.

pnpm test
# Expected: 1036 baseline + ~22-26 new = ~1058-1062 cases across N+1 test files (the block/admin.test.ts add).

pnpm dep:check
# Expected: 0 violations / +3-5 modules from 1165 baseline (new files: admin.ts + admin.test.ts + index.ts + block.mapper.ts).
```

If any gate fails — fix root cause; do NOT bypass. If a test flakes (timing-sensitive concurrent case): rerun once; if still flaky, surface to planner via `AskUserQuestion`. Do not mark a flaky test `.skip`.

---

## § 4. Out of scope (explicit forbid list)

- **HTTP routes** (`apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/blocks/...`) — Step 7.2.
- **Client API + hooks** (`apps/platform/src/lib/api/endpoints/blocks.ts`, `use-blocks.ts`) — Step 7.3.
- **UI** (BlockList, BlockCard, AddBlockButton) — Step 7.4.
- **Intensity / TimeCap form widgets** — Step 7.5.
- **Schema entity** (Block contains Schema[]; entity ships Step 8). Phase 4 case 13 (`delete` cascade) instantiates a minimal Schema row directly via `cleanupRaw.schema.create` to verify the `onDelete: Cascade`; this is NOT a Schema entity implementation.
- **Prisma schema change** — Block / BlockLabelAssignment already shipped Step 2; no edit to `schema.prisma`, no `db:reset`, no seed change.
- **`analysis/artifacts/` change** — no domain-semantics change.
- **`Session.freezeLoadsAtCreation`** — out of scope per Step 6.0 Q10 (carry-forward indefinite). Do not surface in Block API or mapper.
- **Symbol rename `cms{Label,Exercise}AdminApi` → `lms*`** — Step 6.1.5 deferred carry-forward; not Step 7.1's job.
- **Refactor of `lmsSessionApi`** — Block is additive; do not touch Session code.
- **React Context for label preload** — UI-layer concern (Step 7.4 trigger when prop-drilling hits 5+ levels).

---

## § 5. Acceptance criteria

1. **All 5 `lmsBlockApi` methods** implemented matching § 3 Phase 3 skeleton. No method left as stub or NotImplementedError.
2. **`verifyBlockOwnership` guard** in `authz/guards.ts` mirrors `verifySessionOwnership` shape; returns `{status, sessionId, dayId, weekId, planId}`. Reused by Block.update / delete / assignLabels (3 callsites in this step).
3. **`mapToBlock` + `mapToBlockWithLabels`** in `mappers/lms/block.mapper.ts`. `intensity` / `timeCap` parsed via `intensitySchema.parse` / `timeCapSchema.parse` on read (not `as Intensity` cast).
4. **`update` silently ignores `labelIds`** in payload (OQ-b1 invariant) — verified by Phase 4 case 11.
5. **D-7 invariant** — `assignLabels(blockId, [])` results in zero `BlockLabelAssignment` rows; handler uses explicit `if (labelIds.length > 0)` short-circuit around `createMany`; verified by Phase 4 case 20.
6. **`retryOnP2034` wraps `create` and `assignLabels`** Serializable transactions; **does NOT wrap** `update` / `delete` / `reorder` (no SSI surface in single-statement or default-isolation array-tx).
7. **`Prisma.JsonNull` marshalling** — `intensity: null` / `timeCap: null` write `Prisma.JsonNull` (not raw `null`) so the column gets a JSON null, not "no-update".
8. **Reorder validation** — complete-set check (`block.count`) + foreign-session check + non-existent-id check, mirror Session.reorder. Subset attack rejected with `BadRequestError`.
9. **Label applicability check** — all `labelIds` validated against `applicableLevels.includes("BLOCK")` inside the tx (both `create` and `assignLabels`).
10. **Cascade behaviour verified** — Phase 4 case 13 asserts `delete` Block removes `BlockLabelAssignment` + `Schema` via Prisma FK cascade.
11. **Concurrent create** — Phase 4 case 8 (`Promise.allSettled` two creates on same session, assert fulfilled ≥ 1 + `block.count === fulfilledCount`).
12. **Zero `--no-verify`** / `--no-edit` / `--no-gpg-sign` — every commit passes pre-commit hook (`check-secrets` + `lint-staged` + `turbo check-types --filter="...[HEAD]"`).
13. **Per-step verification all-green**:
    - `pnpm check-types` 16/16
    - `pnpm lint` 16/16
    - `pnpm --filter @repo/api-server test` ~195-199 cases all pass
    - `pnpm test` ~1058-1062 cases all pass
    - `pnpm dep:check` 0 violations, +3-5 modules from 1165 baseline
14. **Regression greps return 0**:
    - `grep -rn "Session.freezeLoadsAtCreation" packages/api-server/src/` → 0 hits.
    - `grep -rn "Session.name" packages/api-server/src/ | grep -v "session.id\|session.dayId"` → 0 hits (no `Session.name` field).
    - `grep -rn "cms/label\|cms/exercise" packages/api-server/src/ packages/contracts/src/` → 0 hits (Step 6.1.5 namespace correction holds).
15. **`@repo/contracts/lms/block` consumed exactly in the expected files** — `grep -rln "@repo/contracts/lms/block" packages/api-server/src/` returns: `endpoints/lms/block/admin.ts`, `endpoints/lms/block/admin.test.ts`, `mappers/lms/block.mapper.ts` (3 files). Nothing else.
16. **No `as Intensity` / `as TimeCap` / `as unknown as ...` casts** in `block.mapper.ts` — `intensitySchema.parse` / `timeCapSchema.parse` is the only allowed conversion path.
17. **Branch convention**: all commits land on `feat/training-domain`. No `feat/<slug>` branch created. **`git log --oneline feat/training-domain ^main`** shows Step 7.0 commits + Step 7.1 commits with no foreign refs.

---

## § 6. Verification gates (run in this order before each commit)

Per phase:

- **After Phase 1** (guards.ts + guards.test.ts):
  - `pnpm --filter @repo/api-server test -- guards.test.ts` — all guard cases green (existing + new verifyBlockOwnership).
  - `pnpm --filter @repo/api-server check-types` — 1/1 green.
- **After Phase 2** (mapper):
  - `pnpm --filter @repo/api-server check-types` — 1/1 green (mapper compiles; consumers absent yet).
  - No test run required (no mapper-specific test file; mapper exercised by Phase 4 tests).
- **After Phase 3 + Phase 4** (endpoints + tests):
  - `pnpm --filter @repo/api-server test` — full api-server suite green.
  - `pnpm --filter @repo/api-server check-types` — 1/1 green.
- **Pre-final-commit / pre-push**:
  - `pnpm check-types` (root) — 16/16.
  - `pnpm lint` (root) — 16/16.
  - `pnpm test` (root) — ~1058-1062 cases.
  - `pnpm dep:check` (root) — 0 violations.
- **TZ invariance not applicable** — Block does not write any `@db.Date` column. Skip `TZ=Asia/Kolkata` rerun.

If a hook fails — fix the underlying issue; never `--no-verify`. Examples:

- Commitlint subject > 100 chars → reword (do NOT amend the prior commit; the failed commit was never created — create a new one with the fixed message).
- `turbo check-types --filter="...[HEAD]"` fails because a downstream consumer breaks → unlikely (Step 7.1 is additive), but if it happens, fix the broken consumer in the same commit (squash exception per `[[husky-cross-package-squash]]` may apply — surface to planner first).
- `lint-staged` auto-format reorders imports → expected; accept the formatted version (lint-staged stages it).

---

## § 7. Commit strategy

Per `[[husky-cross-package-squash]]` pre-check (§ 0.9 verified):

- `.husky/pre-commit` runs `turbo check-types --filter="...[HEAD]"` — fans out to downstream consumers.
- Step 7.1 is **api-server-only and additive** (new files + new exports in existing barrels; never removes an existing export; never touches downstream code).
- **Conclusion**: per-phase atomic commits OK; no squash trigger.

**Recommended structure (3 code commits + 1 docs commit)**:

1. `feat(api-server): add verifyblockownership guard for block ownership chain`

   - `packages/api-server/src/authz/guards.ts` (+ `verifyBlockOwnership`)
   - `packages/api-server/src/authz/guards.test.ts` (+ `describe("verifyBlockOwnership")` with ~4 cases)

2. `feat(api-server): add lms block mapper with embedded labels and intensity timecap parse`

   - `packages/api-server/src/mappers/lms/block.mapper.ts` (new)
   - `packages/api-server/src/mappers/lms/index.ts` (+ `export * from "./block.mapper"`)

3. `feat(api-server): add lmsblockapi with crud reorder and assignlabels m:n`

   - `packages/api-server/src/endpoints/lms/block/admin.ts` (new)
   - `packages/api-server/src/endpoints/lms/block/admin.test.ts` (new, ~18-22 cases)
   - `packages/api-server/src/endpoints/lms/block/index.ts` (new)
   - `packages/api-server/src/endpoints/lms/index.ts` (+ `export * from "./block"`)

4. `docs(step-07.1): write executor output report`
   - `implementation/step-07.1/output.md` (per § 9 format)

**Commit-message conventions** (per `[[commitlint-subject-case]]` + project root commitlint config):

- Subject ≤ 100 chars, **fully lowercase** (including acronyms: `lms` not `LMS`, `crud` not `CRUD`, `m:n` not `M:N`).
- Body lines ≤ 150 chars.
- **No `Co-Authored-By` / `Generated-with` trailers** anywhere.
- Conventional-commits prefix: `feat`, `chore`, `docs`, `refactor`, `fix`, `test`.

**If `/feature` Stage 7 (Finalize) proposes a single squashed commit instead of 3 per-phase commits** — that's also acceptable per `[[husky-cross-package-squash]]` "squash is the squash-exception default for cross-package breaking changes only; single-package additive is per-phase OR single squash, planner's pick = either". Both shapes are byte-equivalent for logical revertability if the squashed body lists per-layer changes. **Pick whichever is cleaner for `/feature` Stage 7 to produce; do not force a 3-commit split if the pipeline naturally produces 1.**

**Forbidden**:

- Branch creation (`git checkout -b feat/<slug>` from main) — see § Execution mode branch-cut override.
- `--no-verify` / `--no-edit` / `--no-gpg-sign` on any git command.
- Amending an existing commit on `feat/training-domain` (the branch has already-pushed history; amending rewrites it). New commits only.
- Squashing across step boundaries (Step 7.0 commits stay separate from Step 7.1 commits).

---

## § 8. Anti-patterns to avoid (will get caught in code review)

1. **Code comments** explaining the `if (labelIds.length > 0)` short-circuit or the `Prisma.JsonNull` semantic. Per `[[global-preferences]]`: no comments unless encoding a non-obvious _why_; both are obvious-by-reading-code or documented in this prompt + acceptance-criteria #4/#5.
2. **`as Intensity` / `as TimeCap` / `as unknown as X`** casts in `block.mapper.ts`. Use `intensitySchema.parse` / `timeCapSchema.parse`. Violates `[[type-quality]]`.
3. **Deprecation shim files** (e.g., `_legacy_label_assignment.ts` re-exporting old symbols). None apply here, but flag if you find yourself reaching for one.
4. **Mocking Prisma** in tests. Use real `prisma`/`cleanupRaw` per `[[no-tech-debt-in-mocks]]`. Concurrent-create test uses `Promise.allSettled` against the real DB (Step 6.1 / 6.4.5 / 6.2 case 13 precedents).
5. **`if-else within tx` where `createMany({data: []})` always runs** (D-7 invariant — § 0.11). Use explicit `if (data.labelIds.length > 0)` short-circuit.
6. **Hoisting `BLOCK_WITH_LABELS_INCLUDE` to a shared module** before Step 8 trigger. Keep it local in `admin.ts` (single callsite-family — `create` returns it, `update` returns it, `assignLabels` returns it; all in same file).
7. **Adding a `mapToBlockWithSchemas` mapper or `findUniqueOrThrowWithSchemas`** — Schema entity ships Step 8; Step 7.1 does not preempt it.
8. **Touching `lmsSessionApi` or `mapToSession`** — Block is additive; Session is untouched.
9. **Inventing a `Block.name` field** in the contract or handler — Block identity is `(order, labels[0]?.name || "Block N")` for UI purposes; no name surface in this domain (mirror Q10 Session.name deferral).
10. **Searching git history / memory for "prior Block implementation"** — 4th attempt; priors deleted. Trace found → STOP and surface.

---

## § 9. Output report format (`implementation/step-07.1/output.md`)

Russian prose where natural, English for code/paths. Section headers verbatim:

```markdown
# Step 7.1 — `lmsBlockApi` (CRUD + reorder + assignLabels M:N) + `verifyBlockOwnership` + `mapToBlock`

## Что сделано

<3-7 lines summarizing the slice + key invariants enforced (D-7, retryOnP2034 wraps, label-applicability, JsonNull marshalling)>

## Изменённые/созданные файлы

<list 5 new + 3 edited paths with 1-line purpose each>

## Принятые решения

<D-1, D-2, ... per minor inline judgement calls — name + rationale + non-impact certification. Use when output diverges from prompt for an obvious reason (e.g. lint-staged auto-format, codebase pattern alignment). Each ≤ 5 lines.>

## Возникшие вопросы и как решены

<if any § 0 STOP-and-surface escalation fired — paste the AskUserQuestion content + planner answer + resolution commit hash. If none fired, write "Без escalations через § 0 — все верbatim quotes byte-for-byte matched HEAD `523e16d9`.">

## Что отложено

<list items the executor noticed but intentionally did NOT do, with the "see Step 7.X" or "see deferred sub-decision in PLANNING_STATE" link. Examples: hoist of `BLOCK_WITH_LABELS_INCLUDE` (Step 8 trigger); `mapToBlockWithSchemas` (Step 8); React Context for label preload (Step 7.4).>

## Ссылка на `.feature-dev/<ts>/`

<full path to the `/feature` pipeline artifacts directory (Stage 0-7 outputs: research.md / design.md / plan.md / review.md / qa.md / etc).>

## Сценарий смоук-теста

**N/A** — api-server-only step. UI smoke resumes Step 7.4 (BlockList surface).

## Verification notes

<table or bullets recording the actual numbers from local verification commands: `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm --filter @repo/api-server test`, `pnpm dep:check`. Each as "expected X / got Y" with planner-range comparison.>

## Acceptance criteria self-check

<numbered checklist mirroring § 5 of this prompt with ✓/✗ per item + brief evidence (test name, file path, line range).>
```

**Length budget**: 200-500 lines. Focus on _what diverged_ from the prompt (D-decisions, escalations) and _what's deferred_ — those are the planner-actionable signals. Verbatim re-statement of the prompt is not useful; it's already in `prompt.md`.

---

## Footer — quick reference

- **Branch**: `feat/training-domain` (long-lived; do NOT cut a feature branch).
- **Mirror target**: `lmsSessionApi` (`endpoints/lms/session/admin.ts`); `verifySessionOwnership` (`authz/guards.ts:119-171`).
- **D-7 invariant**: `assignLabels(blockId, [])` → 0 rows; explicit `if (length > 0)` around `createMany`.
- **`retryOnP2034` wraps**: `create` + `assignLabels` only.
- **`update` ignores `labelIds`** (OQ-b1 ratified): silent strip, labels mutated only via `assignLabels`.
- **Mapper**: `intensitySchema.parse` / `timeCapSchema.parse` on read; no `as` casts.
- **Tests**: 18-22 cases in `block/admin.test.ts` + ~4 in `guards.test.ts`.
- **Commits**: 3 atomic per-phase OR single squash (planner's pick — both valid for api-server-only additive). No `--no-verify`.

If anything in this prompt conflicts with `implementation/WORKFLOW.md` or `~/.claude/CLAUDE.md` global rules — STOP and surface. WORKFLOW.md + global rules win; prompt-side error is planner's fault.
