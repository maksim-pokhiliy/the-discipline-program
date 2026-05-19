# Step 8.1a — `lmsSchemaApi` (CRUD + two-pass reorder + parent-vs-child discriminated create) + `verifySchemaOwnership` + `mapToSchema`

**Branch**: `feat/training-domain` (HEAD `2d8a4409` post-Step-8.0b close-out; 9 commits ahead of `main`). Stay on this branch — do NOT cut a feature branch (see § Execution mode).
**Type**: api-server slice. Single package surface (`packages/api-server/src/`). First consumer of the Step 8.0b Schema contract slice (`@repo/contracts/lms/schema`).
**Scope**: ship `lmsSchemaApi` with **4 methods** (`create` / `update` / `delete` / `reorder`) + `verifySchemaOwnership` guard + `mapToSchema` mapper + structural-symmetry barrel + ~28-32 integration tests. Mirror `lmsBlockApi` Step 7.1 patterns (Serializable + intra-tx TOCTOU re-check + sparse-int order + `retryOnP2034` wrap on `create` + canonical 2-pass UPDATE reorder anticipating Step 8.3.7 partial-unique constraint).

**Execution mode**: **`/feature` full pipeline** per `[[always-via-feature-skill]]` (server slice + ~30 integration tests + Stage 5 reviewer + Stage 6 hostile QA — discriminated scope + archetype-kind cross-validation + sub-schema invariants + concurrent SSI surfaces value). **Branch-cut override MANDATORY**: this step lives on long-lived `feat/training-domain` per `[[training-domain-workflow]]`. If `/feature` Stage 0 (Research) attempts `git checkout -b feat/<slug>` from main, you MUST **STOP** and `AskUserQuestion` showing the attempted branch + planner's override directive, then continue on the current `feat/training-domain` branch (do NOT create `feat/<slug>`). All commits land on `feat/training-domain`.

---

## § 0. Hard triggers — read-then-act gate

Before any code, **verify every verbatim quote in § 0.1-0.12 against HEAD `2d8a4409` byte-for-byte**. If any quote diverges, **STOP**, run `AskUserQuestion` showing the actual content + this prompt's claim, wait for planner ratification. Do NOT silently adapt — planner owns prompt errors.

### § 0.0 Prior-implementation trace stops

This is the **4th attempt** at this domain; prior three were deleted (per `implementation/WORKFLOW.md`). If you encounter vocab like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — STOP and surface. The only legitimate sources are `analysis/artifacts/`, the live Prisma schema, the Step 8.0b contracts, and the Block/Session mirrors referenced here.

### § 0.A Zero-state verification commands

Run these at executor launch and verify expected counts:

```bash
ls packages/api-server/src/endpoints/lms/schema/ 2>/dev/null
# Expected: directory does NOT exist. If exists, STOP and surface — Step 8.1a partially done earlier.

ls packages/api-server/src/mappers/lms/schema.mapper.ts 2>/dev/null
# Expected: file does NOT exist. If exists, STOP and surface.

grep -rln "lmsSchemaApi\|verifySchemaOwnership\|mapToSchema" packages/api-server/src/
# Expected: 0 hits. If non-zero, STOP and surface — Step 8.1a partially landed.

grep -rln "@repo/contracts/lms/schema" packages/api-server/src/
# Expected: 0 hits. Step 8.1a IS the first api-server consumer of the Step 8.0b Schema contracts.

grep -rln "@repo/contracts/lms/schema" apps/
# Expected: 0 hits. UI/route consumers arrive Steps 8.2-8.4.
```

### § 0.1 Canonical mirror — `lmsBlockApi` (`packages/api-server/src/endpoints/lms/block/admin.ts`, full)

**`lmsSchemaApi` mirrors this file's outer shape 1:1.** Read verbatim — every pattern below (outer guard, `verifyPlanEditable`, `retryOnP2034` wrap on `create`, intra-tx TOCTOU re-check, `_max(order) ?? 0 + 10`, conditional-spread update body, complete-set reorder check, canonical 2-pass `prisma.$transaction([...])` array-tx, `BLOCK_WITH_LABELS_INCLUDE` local const, `assertLabelsApplicable` helper) is the mandatory template. Schema-specific divergences (4 ops not 5, archetype-kind cross-validation helpers, discriminated scope, structural-fields-immutable on update, three Json columns) are spec'd in § 3.

```ts
import { Prisma } from "@prisma/client";

import {
  type AssignBlockLabelsData,
  type Block,
  type CreateBlockData,
  type ReorderBlocksData,
  type UpdateBlockData,
} from "@repo/contracts/lms/block";
import { type AppLevelValue } from "@repo/contracts/lms/label";
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
} satisfies Prisma.BlockInclude;

type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const assertLabelsApplicable = async (tx: TxClient, labelIds: readonly string[]): Promise<void> => {
  // ... (truncated for brevity — full body in source; same pattern Schema's `assertArchetypeConsistency` follows)
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

  // update / delete shown for the conditional-spread / cascade pattern Schema mirrors directly

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

  // reorder shown for canonical 2-pass UPDATE pattern Schema mirrors (with dual-scope discriminated extension)

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
      const updated = await prisma.$transaction([
        ...data.orderedIds.map((id, i) =>
          prisma.block.update({ where: { id }, data: { order: -(i + 1) } }),
        ),
        ...data.orderedIds.map((id, i) =>
          prisma.block.update({ where: { id }, data: { order: (i + 1) * 10 } }),
        ),
      ]);

      return updated.slice(data.orderedIds.length).map(mapToBlock);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },

  // assignLabels omitted — Schema has no M:N labels surface
};
```

**Key takeaways for Schema**:

- **Outer `verifyXxxOwnership` returns scope context** (sessionId/dayId/weekId/planId for Block) and is used for both authz + intra-tx TOCTOU re-check. Schema's `verifySchemaOwnership` returns `{status, blockId, sessionId, dayId, weekId, planId, parentSchemaId, kind}` (one extra field `parentSchemaId` for Step 8.1b chain, plus `kind` so Step 8.1b SchemaRow ops can refuse rows-in-NESTED-body — per OQ-D4 ratified).
- **`retryOnP2034` wraps `create` only** (Serializable tx with `_max(order)` race + insert). `update` / `delete` / `reorder` use default-isolation single-statement OR array-tx — no SSI surface (mirror Block precedent — Block.reorder has `@@unique([sessionId, order])` from Step 7.3.6 + canonical 2-pass UPDATE within `$transaction([...])`; no `retryOnP2034` needed because the constraint validates final state on commit, and tx atomicity already serializes the per-row updates).
- **Canonical 2-pass reorder** — lines 236-243 above are the exact shape Schema replicates: Phase 1 stage to negative offsets `-(i + 1)`, Phase 2 final positions `(i + 1) * 10`, return the slice mapped through `mapTo*`. **Schema applies this from Day 1** anticipating Step 8.3.7 partial-unique constraint per `[[planner-mutation-invariant-trace]]` (8th flavour) — see § 0.12.
- **`TxClient` type alias** local to `admin.ts` for helper signatures (`tx: TxClient`); `BLOCK_WITH_LABELS_INCLUDE` local const (single callsite-family — `create` + `update` + `assignLabels` all consume; **NOT** hoisted to `_shared/` until 3rd outside callsite materializes — Schema follows same rule, no `SCHEMA_INCLUDE` hoist this step).

### § 0.2 Canonical guard mirror — `verifyBlockOwnership` (`packages/api-server/src/authz/guards.ts`, lines 173-238)

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

`verifySchemaOwnership` mirrors this 1:1 with one extra JOIN layer (`schema → block → session → day → week → plan`) and returns `{status, blockId, sessionId, dayId, weekId, planId, parentSchemaId, kind}` — see § 3 Phase 1.

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

### § 0.4 Mapper precedent — `mapToBlock` (`packages/api-server/src/mappers/lms/block.mapper.ts`, full)

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

**Schema-specific takeaways**:

- **Parse-on-read with Zod, zero `as` casts** — `intensitySchema.parse(b.intensity)` is the only accepted shape conversion. Same pattern Schema applies to **three** Json columns: `archetypeParams` (non-null always) + `intensity` (nullable) + `trailingConnector` (nullable). See § 3 Phase 2.
- **`mapToSchema` flat shape only this step** — no `mapToSchemaWithBody` recursive mapper (Step 8.3.5 trigger when `schemas[]` embed lands in `blockSchema`). Same rule as `mapToBlock` having `labels: []` until `mapToBlockWithLabels` joined version exists.

### § 0.5 `handlePrismaError` codes that fire in Step 8.1a (`packages/api-server/src/utils/prisma-error-handler.ts`, full)

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

**Note**: `retryOnP2034` wraps the tx **inside** the `try {...} catch` block in `create` — P2034 is consumed by `retryOnP2034` first; if all retries exhaust, `ServiceUnavailableError` propagates. `handlePrismaError` sees P2034 only if the call wasn't `retryOnP2034`-wrapped (which shouldn't happen for `create`). P2003 (FK violation) fires if `archetypeId` references a non-existent Archetype — mapped to `BadRequestError`; but Step 8.1a additionally enforces a server-side `tx.archetype.findUnique` pre-check inside the Serializable tx (§ 3 Phase 3) so the typical path raises a domain-explicit `NotFoundError` instead of letting P2003 surface. **No `@@unique` constraint exists on Schema in this step** (Step 8.3.7 will add partial-unique `WHERE parent_schema_id IS NULL`); P2002 not in 8.1a's expected fault surface.

### § 0.6 Step 8.0b contracts — `@repo/contracts/lms/schema`

**`packages/contracts/src/entities/lms/schema/index.ts` (full)**:

```ts
export * from "./archetype-params.schema";
export * from "./schema-api.schema";
export * from "./schema-api.types";
export * from "./schema.constants";
export * from "./schema.schema";
export * from "./schema.types";
```

**`packages/contracts/src/entities/lms/schema/schema.constants.ts` (full)**:

```ts
export const SCHEMA_CONSTANTS = {
  MAX_HEADER_LENGTH: 500,
  MAX_NOTES_LENGTH: 2000,
} as const;

export const SCHEMA_KINDS = ["ATOMIC", "HEADERLESS", "NESTED", "NAMED", "COMPOSITE"] as const;
export type SchemaKind = (typeof SCHEMA_KINDS)[number];

export const SUB_SCHEMA_ALLOWED_KINDS = ["ATOMIC", "HEADERLESS"] as const;
export type SubSchemaAllowedKind = (typeof SUB_SCHEMA_ALLOWED_KINDS)[number];

export const ARCHETYPE_FAMILIES = [
  "ROUNDS_SETS",
  "LADDER",
  "TIME_CAP",
  "COMPOSITE_ROUNDS",
  "NESTED",
  "NAMED",
  "SINGLE_LINE_HEADERLESS",
  "FLAT_PARALLEL_HEADERLESS",
  "MODALITY_REFERENCE",
] as const;
export type ArchetypeFamily = (typeof ARCHETYPE_FAMILIES)[number];

export const ARCHETYPE_NAMES = [
  "n-rounds",
  "alternating-sets",
  "ladder-descending",
  "ladder-ascending",
  "ladder-vertex-down-pyramid",
  "ladder-spike",
  "parallel-ladders-descending",
  "parallel-ladders-mixed-direction",
  "parallel-pyramids",
  "amrap-flat",
  "emom-nested-per-minute",
  "emom-sub-minute-slot",
  "time-window-outer",
  "composite-rounds-with-rest",
  "composite-intervals-then-rounds",
  "composite-intervals-work-rest-fixed",
  "composite-intervals-work-rest-progressive",
  "composite-intervals-on-off-max-tail",
  "composite-rolling-rounds",
  "nested-rounds-over-rounds",
  "nested-rounds-over-parallel-ladder",
  "nested-composite-rounds-over-ladder",
  "named-themed-sets",
  "named-exercise-program",
  "single-line-with-then-connector",
  "single-line-bare",
  "single-line-total-counter",
  "flat-list-headerless",
  "pull-ups-dips-cycle",
  "run-distance",
  "placeholder-body",
  "practice-list",
  "url-only-body",
  "super-set",
] as const;
export type ArchetypeName = (typeof ARCHETYPE_NAMES)[number];
```

**`packages/contracts/src/entities/lms/schema/schema.schema.ts` (full)**:

```ts
import { z } from "zod";

import { connectorFormSchema, intensitySchema } from "../_shared";

import { archetypeParamsSchema } from "./archetype-params.schema";
import {
  ARCHETYPE_FAMILIES,
  ARCHETYPE_NAMES,
  SCHEMA_CONSTANTS,
  SCHEMA_KINDS,
  SUB_SCHEMA_ALLOWED_KINDS,
} from "./schema.constants";

export const schemaKindSchema = z.enum(SCHEMA_KINDS);
export const archetypeFamilySchema = z.enum(ARCHETYPE_FAMILIES);
export const archetypeNameSchema = z.enum(ARCHETYPE_NAMES);

export const trailingConnectorSchema = z
  .object({
    form: connectorFormSchema,
    roundsCount: z.number().int().positive().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.form === "then_n_rounds" && value.roundsCount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["roundsCount"],
        message: "roundsCount is required when form is then_n_rounds",
      });
    }

    if (value.form !== "then_n_rounds" && value.roundsCount !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["roundsCount"],
        message: "roundsCount is only allowed when form is then_n_rounds",
      });
    }
  });

type SchemaShape = {
  id: string;
  blockId: string;
  parentSchemaId: string | null;
  order: number;
  kind: z.infer<typeof schemaKindSchema>;
  archetypeId: string;
  header: string | null;
  archetypeParams: z.infer<typeof archetypeParamsSchema>;
  intensity: z.infer<typeof intensitySchema> | null;
  trailingConnector: z.infer<typeof trailingConnectorSchema> | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const schemaSchema: z.ZodType<SchemaShape> = z.lazy(() =>
  z.object({
    id: z.string().cuid(),
    blockId: z.string().cuid(),
    parentSchemaId: z.string().cuid().nullable(),
    order: z.number().int().positive(),
    kind: schemaKindSchema,
    archetypeId: z.string().cuid(),
    header: z.string().max(SCHEMA_CONSTANTS.MAX_HEADER_LENGTH).nullable(),
    archetypeParams: archetypeParamsSchema,
    intensity: intensitySchema.nullable(),
    trailingConnector: trailingConnectorSchema.nullable(),
    notes: z.string().max(SCHEMA_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

export const schemaSchemaWithInvariants = schemaSchema.superRefine((value, ctx) => {
  if (value.parentSchemaId !== null) {
    const allowed: readonly string[] = SUB_SCHEMA_ALLOWED_KINDS;

    if (!allowed.includes(value.kind)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["kind"],
        message: `sub-schema kind must be one of ${SUB_SCHEMA_ALLOWED_KINDS.join(", ")} when parentSchemaId is set`,
      });
    }
  }
});

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
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});
```

**`packages/contracts/src/entities/lms/schema/schema.types.ts` (full)**:

```ts
import { type z } from "zod";

import { type SchemaRow } from "../schema-row";

import { type archetypeParamsSchema } from "./archetype-params.schema";
import {
  type createSchemaSchema,
  type reorderSchemasSchema,
  type schemaSchema,
  type trailingConnectorSchema,
  type updateSchemaSchema,
} from "./schema.schema";

export type Schema = z.infer<typeof schemaSchema>;
export type CreateSchemaData = z.infer<typeof createSchemaSchema>;
export type UpdateSchemaData = z.infer<typeof updateSchemaSchema>;
export type ReorderSchemasData = z.infer<typeof reorderSchemasSchema>;
export type ArchetypeParams = z.infer<typeof archetypeParamsSchema>;
export type TrailingConnector = z.infer<typeof trailingConnectorSchema>;

export type SchemaWithBody = {
  schema: Schema;
  rows: SchemaRow[];
  subSchemas: SchemaWithBody[];
};
```

**`packages/contracts/src/entities/lms/schema/schema-api.schema.ts` (full)**:

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
export const reorderSchemasResponseSchema = z.object({
  schemas: getSchemasResponseSchema,
});
```

### § 0.7 Shared VOs Step 8.1a consumes

**`packages/contracts/src/entities/lms/_shared/connector-form.ts` (used by `trailingConnectorSchema` write+parse)** — read verbatim at executor launch; ConnectorForm enum is `then` / `then_dots` / `then_n_rounds`. The XOR refine (`form === "then_n_rounds"` ↔ `roundsCount !== undefined`) is in `schema.schema.ts` `trailingConnectorSchema.superRefine` — already enforced at Zod parse; mapper just re-parses on read; api handler trusts incoming `data.trailingConnector` shape after route-layer `.parse(...)` lands Step 8.2.

**`packages/contracts/src/entities/lms/_shared/intensity.ts`** — `intensitySchema` is the same `effortPercent? | rpe? | pace? | hrZone? | numericPace?` open object with "at least one dimension" refine that Block consumes. Same parse-on-read in `mapToSchema`.

**`packages/contracts/src/entities/lms/schema/archetype-params.schema.ts`** (~231 LOC, 34-variant `z.union([z.object({archetype: z.literal(<name>), params: <variant-schema>}), ...])`) — `archetypeParamsSchema` is the discriminator-by-literal flat union. Server-side cross-validates `data.archetypeParams.archetype === Archetype{id=data.archetypeId}.name` per § 0.11 invariant.

### § 0.8 Registration files — current state (verbatim at HEAD `2d8a4409`)

**🔴 PREREQUISITE — `packages/contracts/package.json` exports map (Step 8.0b drift; fix-in-prereq-commit per § 7)**:

Step 8.0b shipped `packages/contracts/src/entities/lms/{archetype,schema,schema-pairing,schema-row}/index.ts` entity barrels + top-level umbrella `packages/contracts/src/entities/lms/index.ts` re-exports them (verbatim quotes below) — BUT `packages/contracts/package.json` `exports` map was NOT updated for the 4 new subpaths. Result: `import ... from "@repo/contracts/lms/schema"` (and `./archetype`, `./schema-row`, `./schema-pairing`) fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`. All Step 8.1a imports (Phase 1 `type SchemaKind`, Phase 2 mapper trio, Phase 3 endpoint + tests) are blocked without this fix.

**Current state (verbatim, lines 8-39)**:

```json
  "exports": {
    ".": "./src/index.ts",
    "./common": "./src/common/index.ts",
    "./cms/blog": "./src/entities/cms/blog/index.ts",
    "./cms/contact": "./src/entities/cms/contact/index.ts",
    "./cms/dashboard": "./src/entities/cms/dashboard/index.ts",
    "./cms/pages": "./src/entities/cms/pages/index.ts",
    "./cms/product": "./src/entities/cms/product/index.ts",
    "./cms/review": "./src/entities/cms/review/index.ts",
    "./lms": "./src/entities/lms/index.ts",
    "./lms/_shared": "./src/entities/lms/_shared/index.ts",
    "./lms/block": "./src/entities/lms/block/index.ts",
    "./lms/day": "./src/entities/lms/day/index.ts",
    "./lms/exercise": "./src/entities/lms/exercise/index.ts",
    "./lms/label": "./src/entities/lms/label/index.ts",
    "./lms/plan-enrollment": "./src/entities/lms/plan-enrollment/index.ts",
    "./lms/session": "./src/entities/lms/session/index.ts",
    "./lms/training-plan": "./src/entities/lms/training-plan/index.ts",
    "./lms/week": "./src/entities/lms/week/index.ts",
    "./coaching/admin-user-view": "./src/entities/coaching/admin-user-view/index.ts",
    "./coaching/athlete-profile": "./src/entities/coaching/athlete-profile/index.ts",
    "./coaching/coach-action-item": "./src/entities/coaching/coach-action-item/index.ts",
    "./coaching/coach-athletes": "./src/entities/coaching/coach-athletes/index.ts",
    "./coaching/coach-dashboard": "./src/entities/coaching/coach-dashboard/index.ts",
    "./coaching/coach-invite": "./src/entities/coaching/coach-invite/index.ts",
    "./coaching/coach-note": "./src/entities/coaching/coach-note/index.ts",
    "./coaching/coach-profile": "./src/entities/coaching/coach-profile/index.ts",
    "./iam/auth": "./src/entities/iam/auth/index.ts",
    "./iam/invite-token": "./src/entities/iam/invite-token/index.ts",
    "./iam/user": "./src/entities/iam/user/index.ts",
    "./storage/upload": "./src/entities/storage/upload/index.ts"
  },
```

**Additive intent (4 new subpath entries, alphabetic)**:

- Insert `"./lms/archetype": "./src/entities/lms/archetype/index.ts",` between `./lms/_shared` and `./lms/block`.
- Insert `"./lms/schema": "./src/entities/lms/schema/index.ts",` between `./lms/plan-enrollment` and `./lms/session`.
- Insert `"./lms/schema-pairing": "./src/entities/lms/schema-pairing/index.ts",` between `./lms/schema` and `./lms/schema-row` (per below).
- Insert `"./lms/schema-row": "./src/entities/lms/schema-row/index.ts",` between `./lms/schema-pairing` and `./lms/session`.

**Final state (lms section excerpt)**:

```json
    "./lms": "./src/entities/lms/index.ts",
    "./lms/_shared": "./src/entities/lms/_shared/index.ts",
    "./lms/archetype": "./src/entities/lms/archetype/index.ts",
    "./lms/block": "./src/entities/lms/block/index.ts",
    "./lms/day": "./src/entities/lms/day/index.ts",
    "./lms/exercise": "./src/entities/lms/exercise/index.ts",
    "./lms/label": "./src/entities/lms/label/index.ts",
    "./lms/plan-enrollment": "./src/entities/lms/plan-enrollment/index.ts",
    "./lms/schema": "./src/entities/lms/schema/index.ts",
    "./lms/schema-pairing": "./src/entities/lms/schema-pairing/index.ts",
    "./lms/schema-row": "./src/entities/lms/schema-row/index.ts",
    "./lms/session": "./src/entities/lms/session/index.ts",
    "./lms/training-plan": "./src/entities/lms/training-plan/index.ts",
    "./lms/week": "./src/entities/lms/week/index.ts",
```

**Rationale for fixing all 4 (not just `./lms/schema`)**: per `[[inline-fix-pre-existing]]` — pre-existing мелкие косяки в зоне касания фиксить сразу, если 1-5 lines. 4 lines в одном `package.json` файле, all Step 8.0b drift surface, same root cause. Fix-one-defer-three would re-surface на Step 8.1b (SchemaRow) and 8.1c (SchemaPairing) creating duplicate prereq dances.

**Scope justification**: Step 8.1a's named scope is "land `lmsSchemaApi`". The prereq for that landing is "Schema entity importable via canonical subpath". The other 3 entries (archetype/schema-row/schema-pairing) are zero-cost adjacent fixes to the same drift root — same file, same single PR window, additive only, behaviour-equivalent before downstream consumers materialize.

**Cross-references for top-level umbrella barrel** (verbatim, unchanged in 8.1a):

`packages/contracts/src/entities/lms/index.ts` (full, alphabetic — confirms 4 entities already re-exported through umbrella):

```ts
export * from "./_shared";
export * from "./archetype";
export * from "./block";
export * from "./day";
export * from "./exercise";
export * from "./label";
export * from "./plan-enrollment";
export * from "./schema";
export * from "./schema-pairing";
export * from "./schema-row";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

No edit to umbrella barrel — already correct. Only `package.json` exports map needs the 4 additions.

**Verification after prereq commit**:

```bash
pnpm --filter @repo/contracts check-types  # 1/1 green (no consumers yet for archetype/schema-row/schema-pairing; schema subpath enables Phase 1+)
pnpm dep:check                              # 0 violations / 1247 baseline (subpath exports don't introduce cycles)
```

---

**`packages/api-server/src/endpoints/lms/index.ts` (full, alphabetic order)**:

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

**Additive intent**: insert `export * from "./schema";` between `./plan-enrollment` and `./session` (alphabetic — `s` comes between `p` and `t`; `schema` precedes `session` lexicographically).

**Final state**:

```ts
export * from "./_shared";
export * from "./block";
export * from "./day";
export * from "./exercise";
export * from "./label";
export * from "./plan-enrollment";
export * from "./schema";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

**`packages/api-server/src/mappers/lms/index.ts` (full, alphabetic order)**:

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

**Additive intent**: insert `export * from "./schema.mapper";` between `./plan-enrollment.mapper` and `./session.mapper` (alphabetic — `schema` precedes `session`).

**Final state**:

```ts
export * from "./block.mapper";
export * from "./day.mapper";
export * from "./enum-maps";
export * from "./exercise.enum-maps";
export * from "./exercise.mapper";
export * from "./label.mapper";
export * from "./plan-enrollment.mapper";
export * from "./schema.mapper";
export * from "./session.mapper";
export * from "./training-plan.mapper";
export * from "./week.mapper";
```

**`packages/api-server/src/endpoints/lms/_shared/index.ts` (full)** — no change required this step:

```ts
export * from "./date";
export * from "./day-of-week";
```

**Sibling barrel pattern — `packages/api-server/src/endpoints/lms/block/index.ts` (full)**:

```ts
export * from "./admin";
```

**New file** `packages/api-server/src/endpoints/lms/schema/index.ts` mirrors this exactly:

```ts
export * from "./admin";
```

### § 0.9 Husky hooks + Turborepo fan-out (verbatim at HEAD `2d8a4409`)

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

**`turbo run check-types --filter="...[HEAD]"` semantics**: re-compile every package depending on (transitively) the files changed in HEAD. Step 8.1a = **2 packages touched, all additive**:

- **Commit 0 (prereq)**: `packages/contracts/package.json` only — adds 4 subpath exports (`./lms/archetype`, `./lms/schema`, `./lms/schema-pairing`, `./lms/schema-row`). Pure additive; no existing entry removed/renamed; no semantic change to TypeScript types. Downstream consumers of `@repo/contracts` (which is ~every app + most packages) compile unchanged because no existing import path is altered. `pnpm --filter @repo/contracts check-types` 1/1 green; `pnpm dep:check` 0 violations (subpath exports don't introduce cycles).
- **Commits 1-3 (api-server)**: new files + new exports in existing barrels; never removes or breaks an existing export. Downstream consumers (`apps/admin`, `apps/platform`, route handlers importing `lmsBlockApi` from `@repo/api-server`) compile unchanged because Schema API isn't imported anywhere yet outside this step (verified § 0.A grep returns 0).

**Conclusion**: per-commit atomic ordering OK; **no `[[husky-cross-package-squash]]` trigger**. Each commit leaves the working tree green at HEAD: Commit 0 enables Phase 1's `import { type SchemaKind } from "@repo/contracts/lms/schema"` to resolve; Commit 1's tree compiles fully; Commits 2-3 add purely additive surfaces. See § 7.

### § 0.10 Prisma schema — Schema + Archetype + Block + SchemaPairing (verbatim at HEAD `2d8a4409`)

**`packages/api-server/prisma/schema.prisma` lines 686-727 (Schema + SchemaPairing)**:

```prisma
model Schema {
  id                String     @id @default(cuid())
  blockId           String
  parentSchemaId    String?
  order             Int
  kind              SchemaKind
  archetypeId       String
  header            String?
  archetypeParams   Json
  intensity         Json?
  trailingConnector Json?
  notes             String?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt

  block        Block           @relation(fields: [blockId], references: [id], onDelete: Cascade)
  parentSchema Schema?         @relation("SchemaSubSchemas", fields: [parentSchemaId], references: [id], onDelete: Cascade)
  subSchemas   Schema[]        @relation("SchemaSubSchemas")
  archetype    Archetype       @relation(fields: [archetypeId], references: [id], onDelete: Restrict)
  rows         SchemaRow[]
  pairingsA    SchemaPairing[] @relation("SchemaPairingA")
  pairingsB    SchemaPairing[] @relation("SchemaPairingB")

  @@index([blockId, order])
  @@index([parentSchemaId, order])
  @@index([archetypeId])
  @@map("training_schemas")
}

model SchemaPairing {
  id           String                @id @default(cuid())
  schemaAId    String
  schemaBId    String
  relationKind SchemaPairingRelation

  schemaA Schema @relation("SchemaPairingA", fields: [schemaAId], references: [id], onDelete: Cascade)
  schemaB Schema @relation("SchemaPairingB", fields: [schemaBId], references: [id], onDelete: Cascade)

  @@unique([schemaAId, schemaBId])
  @@index([schemaBId])
  @@map("training_schema_pairings")
}
```

**Verify Archetype + SchemaKind enum (executor reads at launch)**:

```bash
grep -n "model Archetype \|enum SchemaKind" packages/api-server/prisma/schema.prisma
```

Expected: `model Archetype` exists with `id`, `family ArchetypeFamily`, `name String @unique`, `kind SchemaKind`, etc. `enum SchemaKind { ATOMIC HEADERLESS NESTED NAMED COMPOSITE }` (5 values, matches `SCHEMA_KINDS` § 0.6).

**Key observations**:

- **`Schema.block onDelete: Cascade`** — `delete` Block automatically removes all its Schemas (recursively cascades via `Schema.parentSchema onDelete: Cascade` too — a deleted parent Schema removes all sub-schemas). Step 7.1's Block.delete cascade test already exercises this (`admin.test.ts:533-573`).
- **`Schema.archetype onDelete: Restrict`** — cannot delete Archetype while Schemas reference it (P2003 on Archetype delete; out of scope — Archetype has no admin CRUD per D4).
- **`Schema.archetypeParams Json`** (NOT `Json?`) — required column always populated. Empty params (e.g., `single-line-bare`) stored as `{}`.
- **`Schema.intensity Json?` / `Schema.trailingConnector Json?`** — nullable Json. Same `Prisma.JsonNull` marshalling pattern as `Block.intensity` (write `Prisma.JsonNull` for explicit null vs raw `null` for "leave as-is").
- **`Schema.order Int`** — server-controlled sparse-int per Phase 4 Q6 (10/20/30). **No `@@unique` constraint in this step** — `@@index([blockId, order])` and `@@index([parentSchemaId, order])` only. Step 8.3.7 adds partial-unique `schemas_block_top_order` WHERE `parent_schema_id IS NULL` via `apply-sql-checks.ts`. See § 0.12.
- **Two indexes** — `[blockId, order]` for top-level reorder query; `[parentSchemaId, order]` for sub-schema reorder query. Both already exist; no new index in 8.1a.
- **`@@map("training_schemas")` / `@@map("training_schema_pairings")`** — DB table names match the bounded-context naming.

### § 0.11 D10 + D12 + analysis invariants (HARD REQUIREMENTS)

🔴 **D10 — Discriminated parent-scope arg at api method signature**. `lmsSchemaApi.create(userId, planId, scope, data)` where `scope = { blockId: string } | { parentSchemaId: string }` discriminated TypeScript union (narrow via `"blockId" in scope` / `"parentSchemaId" in scope`). `data` is server-internal type `SchemaBodyData = Omit<CreateSchemaData, "blockId" | "parentSchemaId">` (strips both scope keys from contract `CreateSchemaData`). Server resolves storage `blockId`:

- Top-level scope `{blockId}` → store `blockId = scope.blockId`, `parentSchemaId = null`.
- Sub-schema scope `{parentSchemaId}` → fetch `parent.blockId` via `tx.schema.findUnique`; store `blockId = parent.blockId`, `parentSchemaId = scope.parentSchemaId`. **DB-stored `blockId` always points to the top-level Block (per `analysis/artifacts/05-synthesis/domain-model.md §1.5 — sub-schemas share their parent's blockId so cascade-on-block-delete works through every level).**

🔴 **D12 — `Schema.trailingConnector` field is canonical persistence** (not `RowKind.CONNECTOR`). Field shipped Step 8.0b; Schema 8.1a `create` accepts `data.trailingConnector` per Zod `trailingConnectorSchema | null | undefined` and marshals via `Prisma.JsonNull` / `toInputJson(...)`. No special handling beyond mirror of `Block.intensity` pattern.

🔴 **Sub-schema invariants** (per `analysis/artifacts/05-synthesis/domain-model.md §1.5`):

- **Parent kind constraint**: if `scope = {parentSchemaId}`, then `parent.kind === "NESTED"` (other kinds CANNOT have sub-schemas). Server-side: fetch `parent.kind` in tx → throw `BadRequestError("Cannot nest schemas under non-NESTED parent kind", {parentKind, parentSchemaId})` if mismatch.
- **Child kind constraint**: if `scope = {parentSchemaId}`, then `data.kind ∈ {ATOMIC, HEADERLESS}` (per `SUB_SCHEMA_ALLOWED_KINDS`). Server-side: explicit if-throw `BadRequestError("Sub-schema kind must be ATOMIC or HEADERLESS", {kind, allowed: SUB_SCHEMA_ALLOWED_KINDS})`. Note: the contract `createSchemaSchema` is **without** invariants (the invariant lives on `schemaSchemaWithInvariants` which is unused for input parsing — defense in depth at server is required).

🔴 **Archetype consistency** (per `analysis/artifacts/05-synthesis/domain-model.md §1.4 "archetype consistent с kind (см. §3 mapping table)"`):

- **Archetype existence**: `tx.archetype.findUnique({where: {id: data.archetypeId}})` → `NotFoundError("Archetype not found", {archetypeId})` if missing. Defense-in-depth ahead of P2003 FK.
- **Archetype kind alignment**: `archetype.kind === data.kind` (e.g. archetype `n-rounds` is kind ATOMIC; `emom-nested-per-minute` is kind NESTED). Mismatch → `BadRequestError("Schema kind does not match Archetype kind", {dataKind, archetypeKind, archetypeName})`.
- **archetypeParams variant alignment**: `data.archetypeParams.archetype === archetype.name` literal. (`archetypeParamsSchema` is discriminator-by-literal on `archetype` field; without this cross-check a coach could submit `{kind: ATOMIC, archetypeId: <n-rounds_id>, archetypeParams: {archetype: "amrap-flat", params: {durationMin: 20}}}` — Zod parses, FK resolves, but the params variant doesn't match the archetype). Mismatch → `BadRequestError("archetypeParams variant does not match Archetype", {paramsArchetype, archetypeName})`.

**Required server-handler implementation** (§ 3 Phase 3 elaborates):

```ts
// inside retryOnP2034(() => prisma.$transaction(async (tx) => { ... }, Serializable)):
// after plan/block re-check:

const archetype = await tx.archetype.findUnique({
  where: { id: data.archetypeId },
  select: { id: true, name: true, kind: true },
});

if (!archetype) {
  throw new NotFoundError("Archetype not found", { archetypeId: data.archetypeId });
}

if (archetype.kind !== data.kind) {
  throw new BadRequestError("Schema kind does not match Archetype kind", {
    dataKind: data.kind,
    archetypeKind: archetype.kind,
    archetypeName: archetype.name,
  });
}

if (data.archetypeParams.archetype !== archetype.name) {
  throw new BadRequestError("archetypeParams variant does not match Archetype", {
    paramsArchetype: data.archetypeParams.archetype,
    archetypeName: archetype.name,
  });
}

// sub-schema path:
if ("parentSchemaId" in scope) {
  const parent = await tx.schema.findUnique({
    where: { id: scope.parentSchemaId },
    select: { id: true, kind: true, blockId: true },
  });

  if (!parent) {
    throw new NotFoundError("Parent schema not found", { parentSchemaId: scope.parentSchemaId });
  }

  if (parent.kind !== "NESTED") {
    throw new BadRequestError("Cannot nest schemas under non-NESTED parent kind", {
      parentKind: parent.kind,
      parentSchemaId: scope.parentSchemaId,
    });
  }

  const subAllowed: readonly string[] = SUB_SCHEMA_ALLOWED_KINDS;

  if (!subAllowed.includes(data.kind)) {
    throw new BadRequestError("Sub-schema kind must be ATOMIC or HEADERLESS", {
      dataKind: data.kind,
      allowed: SUB_SCHEMA_ALLOWED_KINDS,
    });
  }

  // storage blockId resolves via parent.blockId
}
```

**Required integration tests** (§ 3 Phase 4):

1. `create` rejects archetypeId that does not exist (NotFoundError).
2. `create` rejects archetype.kind ≠ data.kind (BadRequestError).
3. `create` rejects archetypeParams.archetype literal ≠ archetype.name (BadRequestError).
4. `create` sub-schema rejects parent.kind !== NESTED (BadRequestError).
5. `create` sub-schema rejects data.kind ∉ {ATOMIC, HEADERLESS} (BadRequestError).
6. `create` sub-schema stores `blockId === parent.blockId` (not from scope; verified via stored row inspection).

🔴 **Structural-fields-immutable on `update`** (per OQ-D9 ratified):

`updateSchemaSchema = createSchemaSchema.partial()` permits all fields as optional, including `kind` / `archetypeId` / `parentSchemaId` / `blockId`. Coach semantics: structural mutation = delete + recreate (changing kind/archetype rebuilds the body fundamentally). Server-side rejection at `update` entry:

```ts
const structuralKeys = ["kind", "archetypeId", "parentSchemaId", "blockId"] as const;
const mutated = structuralKeys.filter((k) => data[k] !== undefined);

if (mutated.length > 0) {
  throw new BadRequestError("Schema structural fields are immutable; delete + recreate to change", {
    fields: mutated,
  });
}
```

**Plus archetypeParams variant alignment on update**: if `data.archetypeParams !== undefined`, fetch `current.archetype.name` and assert `data.archetypeParams.archetype === current.archetype.name` (within-variant params updates only). Mismatch → `BadRequestError("archetypeParams variant must match current Archetype on update; structural change requires delete + recreate", {current, provided})`.

**Editable update subset**: `header` / `archetypeParams` (within-variant) / `intensity` / `trailingConnector` / `notes`.

🔴 **Canonical 2-pass reorder per `[[planner-mutation-invariant-trace]]`** (8th flavour):

Schema has **no `@@unique` constraint** in 8.1a — only `@@index([blockId, order])` + `@@index([parentSchemaId, order])`. But Step 8.3.7 will add partial-unique `schemas_block_top_order` ON `training_schemas (block_id, "order") WHERE parent_schema_id IS NULL` via `packages/api-server/scripts/apply-sql-checks.ts` (top-level Schemas only; sub-schemas have no constraint).

**Adopt 2-pass UPDATE from Day 1** (per OQ-D6 ratified): Phase 1 stages all reordered Schemas to negative offsets `-(i+1)`, Phase 2 final positions `(i+1)*10`. Pattern applies **uniformly** to both top-level scope and sub-schema scope (sub-schema constraint never lands, but uniform code is clearer; cost ≈ 1 wasted UPDATE per ID per pass — negligible vs the Step-8.3.7-rewrite cost).

Anti-precedent: Session's `reorder` is single-pass (`endpoints/lms/session/admin.ts:234-238`) because `Session` has no `@@unique([dayId, order])` yet (QA-001b carry-forward). Schema 8.1a does NOT mirror Session's single-pass — mirror Block (2-pass since Step 7.3.6).

### § 0.12 Step 8.3.7 anticipation note (forward-reference)

**Step 8.3.7 will add**: partial-unique `schemas_block_top_order` ON `training_schemas (block_id, "order") WHERE parent_schema_id IS NULL` + `@@unique([parentSchemaId, order])` DSL refresh in Prisma schema + reorder integration tests for both scopes.

**Why 8.1a anticipates**: per `[[planner-mutation-invariant-trace]]` (8th flavour) — adopting 2-pass UPDATE before the constraint lands avoids a Step-7.3.6-style rewrite (Session's `retryOnP2034` wrap on `lmsSessionApi.create` shipped Step 6.4.5 as a similar anticipation; Block's 2-pass reorder + `@@unique([sessionId, order])` shipped together Step 7.3.6 because Block 7.1 didn't anticipate). Schema 8.1a learns the lesson upfront.

**No `apply-sql-checks.ts` touch in 8.1a**. That file gets edited Step 8.3.7-pre (per D13) or Step 8.3.7 proper.

---

## § 1. What this step is

`lmsSchemaApi` is the api-server slice for **Schema-level operations** inside a Block — the third nesting layer below Day (`Day ⊃ Session ⊃ Block ⊃ Schema`). Schema adds **four** domain wrinkles vs Block:

1. **Parent-vs-child discriminated scope** (`{blockId} | {parentSchemaId}`) at the api method signature (D10). Server resolves storage `blockId` via `parent.blockId` lookup when scope is sub-schema.
2. **Three Json-stored value-object columns** (`archetypeParams`, `intensity`, `trailingConnector`) instead of two on Block (`intensity`, `timeCap`). All three re-validated through Zod parsing on read (`mapToSchema`).
3. **Sub-schema invariants** (`parent.kind === "NESTED"` + `child.kind ∈ {ATOMIC, HEADERLESS}`) enforced server-side defense-in-depth. The contract `createSchemaSchema` is **without** invariants; `schemaSchemaWithInvariants` exists but is not used for input parsing. Server must enforce.
4. **Archetype-consistency cross-validation** on create (and partly on update): archetype existence + `archetype.kind === data.kind` + `data.archetypeParams.archetype === archetype.name`. Defense-in-depth vs P2003 FK errors; surfaces domain-explicit `BadRequestError` with full context.

**Schema.parent = Block** (top-level) **OR Schema** (sub-schema). Top-level Schema requires a pre-existing `blockId`; sub-schema requires a pre-existing `parentSchemaId` with `kind = NESTED`. Schema.create therefore does **NOT** carry the materialization chain of Session.create (no `week.upsert` / `day.upsert`) — it takes the scope, verifies parent, computes sparse-int `order`, inserts.

**Four methods, each mirroring the lmsBlockApi pattern (§ 0.1) with Schema-specific divergences**:

- **`create(userId, planId, scope, data)`** — outer `verifyBlockOwnership(scope.blockId)` (top-level) OR `verifySchemaOwnership(scope.parentSchemaId)` (sub-schema) returns plan context; assert `returned.planId === request planId` (defence-in-depth — route layer also asserts but this catches a planner mistake in routes); `verifyPlanEditable`; inside `retryOnP2034 + prisma.$transaction(Serializable)` — re-check Plan (TOCTOU), re-check Block or parent Schema (TOCTOU; could be deleted mid-tx), archetype consistency cross-checks per § 0.11, sub-schema invariants (if sub), compute `_max(order)` scoped per `(blockId, parentSchemaId)` pair, insert Schema. Return `mapToSchema(created)` (flat — no body embed this step).
- **`update(userId, schemaId, data)`** — `verifySchemaOwnership` + `verifyPlanEditable`; **structural-fields-immutable check** (§ 0.11) — reject if any of `kind`/`archetypeId`/`parentSchemaId`/`blockId` is set; **archetypeParams variant alignment check** — if `data.archetypeParams !== undefined`, fetch `current.archetype.name` and assert variant match; conditional-spread Prisma update of `header` / `archetypeParams` / `intensity` / `trailingConnector` / `notes`. `Prisma.JsonNull` is used for nullable Json columns (raw `null` reads as "do not touch"); see § 3 Phase 3 for snippet.
- **`delete(userId, schemaId)`** — `verifySchemaOwnership` + `verifyPlanEditable`; single `prisma.schema.delete`. Cascades drop `SchemaRow[]` and `Schema[]` (sub-schemas) and `SchemaPairing[]` via FK `onDelete: Cascade` (per § 0.10).
- **`reorder(userId, planId, scope, data)`** — `scope = {blockId} | {parentSchemaId}` discriminated; outer guard depends on scope (mirror create); `verifyPlanEditable`; scope-aware `findMany` + scope-aware `count` + foreign-scope check + non-existent-id check; **canonical 2-pass UPDATE** (per § 0.11 + § 0.12) within `prisma.$transaction([...])` — Phase 1 negative offsets, Phase 2 final positions `(i+1)*10`. Return `mapped` slice (second half of the tx batch).

**`verifySchemaOwnership` guard** — new helper in `authz/guards.ts`, mirrors `verifyBlockOwnership` shape (§ 0.2) with one extra JOIN level (`schema → block → session → day → week → plan`) and adds two extra returned fields `{parentSchemaId, kind}` so Step 8.1b SchemaRow ops can: (a) chain `verifySchemaOwnership(schemaId)` for SchemaRow ops; (b) refuse `SchemaRow.create` if `kind === "NESTED"` (nested-body holds sub-schemas, not rows per domain §1.4). Schema returns full `{status, blockId, sessionId, dayId, weekId, planId, parentSchemaId, kind}`.

**`mapToSchema`** — `schema.mapper.ts`. Pure scalar copy (id/blockId/parentSchemaId/order/kind/archetypeId/header/notes/createdAt/updatedAt) + parsed (`archetypeParams`/`intensity`/`trailingConnector`). No embedded `subSchemas` / `rows` (Step 8.3.5 trigger).

**Out of scope**: HTTP routes (Step 8.2), client API + hooks (Step 8.3), `schemas[]` read-embed in `blockSchema` + `mapToSchemaWithBody` mapper (Step 8.3.5), `SchemaRow` @@unique constraint (Step 8.3.6), Schema partial-unique constraint (Step 8.3.7), UI (Step 8.4+ ArchetypePicker + archetypeParams forms). No Prisma schema change. No seed change. No `analysis/artifacts/` change.

**Hard binding** — `SchemaPairing` API is **NOT** in 8.1a scope (Step 8.1c). `SchemaRow` API is **NOT** in 8.1a scope (Step 8.1b). Archetype admin CRUD does NOT exist per D4 (configuration entity, no UI).

---

## § 2. Inputs / Outputs / Dependencies

### Inputs (verified consumable)

- Step 8.0b contracts at HEAD `2d8a4409`: `schemaSchema`, `schemaSchemaWithInvariants` (unused but available), `createSchemaSchema`, `updateSchemaSchema`, `reorderSchemasSchema`; api request/response schemas `createSchemaRequestSchema`, `createSchemaResponseSchema`, `updateSchemaRequestSchema`, `updateSchemaResponseSchema`, `deleteSchemaParamsSchema`, `reorderSchemasRequestSchema`, `reorderSchemasResponseSchema`, `getSchemaByIdParamsSchema`, `getSchemasResponseSchema`; types `Schema`, `CreateSchemaData`, `UpdateSchemaData`, `ReorderSchemasData`, `ArchetypeParams`, `TrailingConnector`, `SchemaWithBody` (Step 8.3.5 trigger; not consumed in 8.1a); constants `SCHEMA_CONSTANTS`, `SCHEMA_KINDS`, `SUB_SCHEMA_ALLOWED_KINDS`, `ARCHETYPE_FAMILIES`, `ARCHETYPE_NAMES`. Shared VOs `intensitySchema`, `archetypeParamsSchema`, `trailingConnectorSchema`.
- Prisma `Schema`, `Archetype`, `Block`, `Session`, `Day`, `Week`, `TrainingPlan` (§ 0.10 + adjacent).
- Existing helpers: `verifyPlanOwnership` / `verifyPlanEditable` / `verifyBlockOwnership` (`authz/guards.ts`); `retryOnP2034` (`utils/retry-on-p2034.ts`); `handlePrismaError` (`utils/prisma-error-handler.ts`); `toInputJson` (`utils/to-input-json.ts`). NO `DAY_OF_WEEK_TO_PRISMA` / `resolveWeekStartDate` needed (Schema doesn't touch calendar axis).
- Test helpers: `cleanupRaw`, `createTestCoach`, `createTestPlan` (`packages/api-server/src/test/helpers.ts`) — patterns demonstrated in `block/admin.test.ts` + `session/admin.test.ts`. **Plus**: `cleanupRaw.archetype.findFirst({where: {name: "<canonical-name>"}, select: {id: true, name: true, kind: true}})` for seeded-Archetype lookup per kind variant (34 canonical seeded per D4).

### Outputs (new + edited files)

**New (5 files)**:

- `packages/api-server/src/endpoints/lms/schema/admin.ts` — `lmsSchemaApi` with 4 methods + helpers.
- `packages/api-server/src/endpoints/lms/schema/admin.test.ts` — integration tests, ~28-32 cases.
- `packages/api-server/src/endpoints/lms/schema/index.ts` — barrel `export * from "./admin";` (1 line, structural symmetry with `block/index.ts`).
- `packages/api-server/src/mappers/lms/schema.mapper.ts` — `mapToSchema`.
- (no separate guard-only test file — `verifySchemaOwnership` cases added to existing `authz/guards.test.ts`)

**Edited (5 files)**:

- `packages/contracts/package.json` — **PREREQ (Commit 0)**: insert 4 exports map entries (`./lms/archetype`, `./lms/schema`, `./lms/schema-pairing`, `./lms/schema-row`) alphabetically per § 0.8. Fixes Step 8.0b drift; enables Phase 1+ subpath imports.
- `packages/api-server/src/authz/guards.ts` — append `verifySchemaOwnership` (mirror `verifyBlockOwnership` shape, plus extra `parentSchemaId` + `kind` fields).
- `packages/api-server/src/authz/guards.test.ts` — append `verifySchemaOwnership` `describe` block with ~4 cases (owner / non-owner / head-coach / not-found).
- `packages/api-server/src/endpoints/lms/index.ts` — insert `export * from "./schema";` alphabetically (§ 0.8 final state).
- `packages/api-server/src/mappers/lms/index.ts` — insert `export * from "./schema.mapper";` alphabetically (§ 0.8 final state).

**Total**: 5 new files + 5 edited files = 10 file changes. Two packages = `packages/contracts/` (1 file, prereq) + `packages/api-server/` (rest).

**Size budget**:

- `admin.ts` — estimated ~280-310 LOC. **If overflow past ESLint `max-lines: 300`**, extract archetype-consistency + sub-schema-invariants helpers to sibling `assertions.ts` (mirror Step 8.0b D-1 `archetype-params.schema.ts` extraction). Helper file would hold `assertArchetypeConsistency(tx, data, archetype)` + `assertSubSchemaInvariants(tx, scope, dataKind)` pure functions. Acceptable D-1 if surfaces.
- `admin.test.ts` — estimated ~700-800 LOC (28-32 tests, each ~20-25 LOC including provisioning + cleanup).
- `schema.mapper.ts` — ~30 LOC (flat scalar+parse pattern).

### Dependencies

- **Hard**: Step 8.0b contracts (already shipped, verified § 0.6).
- **Hard**: `retryOnP2034`, `verifyPlanOwnership`, `verifyPlanEditable`, `verifyBlockOwnership`, `handlePrismaError`, `toInputJson` (all already shipped).
- **None new**: no `pnpm install` required; no Prisma migration; no seed change; no shared package edits.

---

## § 3. Phases (executor must follow this order; each phase has its own commit per § 7)

### Phase 1 — `verifySchemaOwnership` guard

**File**: `packages/api-server/src/authz/guards.ts` (append at end of file, after `verifyBlockOwnership` line 238).

**Implementation skeleton** (mirror `verifyBlockOwnership` § 0.2, with extra JOIN + extra returned fields):

```ts
export const verifySchemaOwnership = async (
  schemaId: string,
  userId: string,
): Promise<{
  status: TrainingPlanStatus;
  blockId: string;
  sessionId: string;
  dayId: string;
  weekId: string;
  planId: string;
  parentSchemaId: string | null;
  kind: SchemaKind;
}> => {
  const schema = await prisma.schema.findUnique({
    where: { id: schemaId },
    select: {
      blockId: true,
      parentSchemaId: true,
      kind: true,
      block: {
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
      },
    },
  });

  if (!schema || schema.block.session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Schema not found", { schemaId });
  }

  const plan = schema.block.session.day.week.plan;

  if (plan.creatorId === userId) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      blockId: schema.blockId,
      sessionId: schema.block.sessionId,
      dayId: schema.block.session.dayId,
      weekId: schema.block.session.day.weekId,
      planId: schema.block.session.day.week.planId,
      parentSchemaId: schema.parentSchemaId,
      kind: schema.kind,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && isAdminOrHeadCoach(ROLE_MAP[user.role])) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      blockId: schema.blockId,
      sessionId: schema.block.sessionId,
      dayId: schema.block.session.dayId,
      weekId: schema.block.session.day.weekId,
      planId: schema.block.session.day.week.planId,
      parentSchemaId: schema.parentSchemaId,
      kind: schema.kind,
    };
  }

  throw new ForbiddenError("Schema does not belong to this coach");
};
```

**Import addition** at top of `guards.ts`: `import { type SchemaKind } from "@repo/contracts/lms/schema";` — keeps the return type tied to the canonical enum from `schema.constants.ts`.

**File**: `packages/api-server/src/authz/guards.test.ts` — append `describe("verifySchemaOwnership", () => {...})` block with ~4 cases mirroring `describe("verifyBlockOwnership", ...)` pattern: owner-returns-context / non-owner-throws-Forbidden / head-coach-bypass-returns-context / not-found-throws-NotFoundError. For setup, create a Week + Day + Session + Block + Archetype-lookup + Schema chain via `cleanupRaw.{week,day,session,block,schema}.create`. Use `cleanupRaw.archetype.findFirst({where: {name: "n-rounds"}, select: {id: true, kind: true}})` to grab an ATOMIC archetype (kind matches default Schema-creation in tests). Add cleanup in `afterAll` (mirror existing pattern). **Use `crypto.randomUUID().slice(0, 8)` for any test-suite-scoped label uniqueness** if labels surface; for guard tests labels are not needed.

**Commit 1** (after Phase 1): `feat(api-server): add verifyschemaownership guard for schema ownership chain`.

### Phase 2 — `mapToSchema`

**File**: `packages/api-server/src/mappers/lms/schema.mapper.ts` (new).

```ts
import { type Schema as PrismaSchema } from "@prisma/client";

import { intensitySchema } from "@repo/contracts/lms/_shared";
import {
  archetypeParamsSchema,
  type Schema,
  trailingConnectorSchema,
} from "@repo/contracts/lms/schema";

export const mapToSchema = (s: PrismaSchema): Schema => ({
  id: s.id,
  blockId: s.blockId,
  parentSchemaId: s.parentSchemaId,
  order: s.order,
  kind: s.kind,
  archetypeId: s.archetypeId,
  header: s.header,
  archetypeParams: archetypeParamsSchema.parse(s.archetypeParams),
  intensity: s.intensity === null ? null : intensitySchema.parse(s.intensity),
  trailingConnector:
    s.trailingConnector === null ? null : trailingConnectorSchema.parse(s.trailingConnector),
  notes: s.notes,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});
```

**Notes**:

- **Zero `as` casts** per `[[type-quality]]`. `archetypeParamsSchema.parse` / `intensitySchema.parse` / `trailingConnectorSchema.parse` re-validate Json content on read. If DB content is corrupted (manual SQL edit, future migration mistake, or a 8.1a `create` bypass via cleanupRaw), the `ZodError` surfaces explicitly — not silently propagated. Cost is negligible (~10µs per Schema for archetypeParams 34-variant resolution + ~5µs per intensity/trailingConnector).
- **`kind` is `Prisma.SchemaKind` enum (string union 5 values)** — matches the contract's `z.enum(SCHEMA_KINDS)` shape exactly (same 5 literal values). No re-mapping needed (vs e.g. TrainingPlanStatus where Prisma + contract use different enum representations and need `TRAINING_PLAN_STATUS_MAP`). Verify with `pnpm check-types`.
- **`PrismaSchema.archetypeParams` is `Prisma.JsonValue`** (read shape). `archetypeParamsSchema.parse(...)` accepts `unknown` and narrows to typed variant. **Do NOT** use `JSON.parse` on it — Prisma already deserializes Json columns to JS values at the client layer.
- **Step 8.3.5 trigger**: a `mapToSchemaWithBody` recursive mapper materializes when `blockSchema` gets `schemas[]` embed and Schema gains `rows[]` + `subSchemas[]` embed (Step 8.3.5 enabler step). Out of 8.1a scope.

**Edit** `packages/api-server/src/mappers/lms/index.ts` per § 0.8 final state (insert `export * from "./schema.mapper";` between `plan-enrollment.mapper` and `session.mapper`).

**Commit 2** (after Phase 2): `feat(api-server): add lms schema mapper with archetypeparams intensity trailingconnector parse`.

### Phase 3 — `lmsSchemaApi` (4 methods) + barrel + index registration

**File**: `packages/api-server/src/endpoints/lms/schema/admin.ts` (new).

```ts
import { Prisma } from "@prisma/client";

import {
  archetypeParamsSchema,
  type CreateSchemaData,
  type ReorderSchemasData,
  type Schema,
  type SchemaKind,
  SUB_SCHEMA_ALLOWED_KINDS,
  type UpdateSchemaData,
} from "@repo/contracts/lms/schema";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import {
  verifyBlockOwnership,
  verifyPlanEditable,
  verifySchemaOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToSchema } from "../../../mappers/lms";
import { handlePrismaError, retryOnP2034, toInputJson } from "../../../utils";

type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type CreateScope = { blockId: string } | { parentSchemaId: string };

type SchemaBodyData = Omit<CreateSchemaData, "blockId" | "parentSchemaId">;

const STRUCTURAL_UPDATE_KEYS = ["kind", "archetypeId", "parentSchemaId", "blockId"] as const;

const assertArchetypeConsistency = async (
  tx: TxClient,
  archetypeId: string,
  dataKind: SchemaKind,
  paramsArchetype: string,
): Promise<void> => {
  const archetype = await tx.archetype.findUnique({
    where: { id: archetypeId },
    select: { id: true, name: true, kind: true },
  });

  if (!archetype) {
    throw new NotFoundError("Archetype not found", { archetypeId });
  }

  if (archetype.kind !== dataKind) {
    throw new BadRequestError("Schema kind does not match Archetype kind", {
      dataKind,
      archetypeKind: archetype.kind,
      archetypeName: archetype.name,
    });
  }

  if (paramsArchetype !== archetype.name) {
    throw new BadRequestError("archetypeParams variant does not match Archetype", {
      paramsArchetype,
      archetypeName: archetype.name,
    });
  }
};

const assertSubSchemaInvariants = (parentKind: SchemaKind, dataKind: SchemaKind): void => {
  if (parentKind !== "NESTED") {
    throw new BadRequestError("Cannot nest schemas under non-NESTED parent kind", {
      parentKind,
    });
  }

  const subAllowed: readonly string[] = SUB_SCHEMA_ALLOWED_KINDS;

  if (!subAllowed.includes(dataKind)) {
    throw new BadRequestError("Sub-schema kind must be ATOMIC or HEADERLESS", {
      dataKind,
      allowed: SUB_SCHEMA_ALLOWED_KINDS,
    });
  }
};

export const lmsSchemaApi = {
  create: async (
    userId: string,
    planId: string,
    scope: CreateScope,
    data: SchemaBodyData,
  ): Promise<Schema> => {
    const owner =
      "blockId" in scope
        ? await verifyBlockOwnership(scope.blockId, userId)
        : await verifySchemaOwnership(scope.parentSchemaId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Scope target not found in plan", {
        planId,
        scope,
      });
    }

    verifyPlanEditable(owner);

    try {
      const created = await retryOnP2034(() =>
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

            let storageBlockId: string;
            let storageParentSchemaId: string | null;

            if ("blockId" in scope) {
              const blockCheck = await tx.block.findUnique({
                where: { id: scope.blockId },
                select: {
                  id: true,
                  session: { select: { day: { select: { week: { select: { planId: true } } } } } },
                },
              });

              if (!blockCheck || blockCheck.session.day.week.planId !== planId) {
                throw new NotFoundError("Block not found", { blockId: scope.blockId, planId });
              }

              storageBlockId = scope.blockId;
              storageParentSchemaId = null;
            } else {
              const parent = await tx.schema.findUnique({
                where: { id: scope.parentSchemaId },
                select: {
                  id: true,
                  kind: true,
                  blockId: true,
                  block: {
                    select: {
                      session: {
                        select: { day: { select: { week: { select: { planId: true } } } } },
                      },
                    },
                  },
                },
              });

              if (!parent || parent.block.session.day.week.planId !== planId) {
                throw new NotFoundError("Parent schema not found", {
                  parentSchemaId: scope.parentSchemaId,
                  planId,
                });
              }

              assertSubSchemaInvariants(parent.kind, data.kind);

              storageBlockId = parent.blockId;
              storageParentSchemaId = scope.parentSchemaId;
            }

            await assertArchetypeConsistency(
              tx,
              data.archetypeId,
              data.kind,
              data.archetypeParams.archetype,
            );

            const max = await tx.schema.aggregate({
              where: {
                blockId: storageBlockId,
                parentSchemaId: storageParentSchemaId,
              },
              _max: { order: true },
            });

            const nextOrder = (max._max.order ?? 0) + 10;

            return tx.schema.create({
              data: {
                blockId: storageBlockId,
                parentSchemaId: storageParentSchemaId,
                order: nextOrder,
                kind: data.kind,
                archetypeId: data.archetypeId,
                header: data.header ?? null,
                archetypeParams: toInputJson(data.archetypeParams),
                intensity:
                  data.intensity === undefined || data.intensity === null
                    ? Prisma.JsonNull
                    : toInputJson(data.intensity),
                trailingConnector:
                  data.trailingConnector === undefined || data.trailingConnector === null
                    ? Prisma.JsonNull
                    : toInputJson(data.trailingConnector),
                notes: data.notes ?? null,
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToSchema(created);
    } catch (error) {
      return handlePrismaError(error, { entity: "Schema" });
    }
  },

  update: async (userId: string, schemaId: string, data: UpdateSchemaData): Promise<Schema> => {
    const owner = await verifySchemaOwnership(schemaId, userId);

    verifyPlanEditable(owner);

    const mutatedStructural = STRUCTURAL_UPDATE_KEYS.filter((k) => data[k] !== undefined);

    if (mutatedStructural.length > 0) {
      throw new BadRequestError(
        "Schema structural fields are immutable; delete + recreate to change",
        { fields: mutatedStructural },
      );
    }

    if (data.archetypeParams !== undefined) {
      const current = await prisma.schema.findUnique({
        where: { id: schemaId },
        select: { archetype: { select: { name: true } } },
      });

      if (!current) {
        throw new NotFoundError("Schema not found", { schemaId });
      }

      if (current.archetype.name !== data.archetypeParams.archetype) {
        throw new BadRequestError(
          "archetypeParams variant must match current Archetype on update; structural change requires delete + recreate",
          {
            current: current.archetype.name,
            provided: data.archetypeParams.archetype,
          },
        );
      }
    }

    try {
      const updated = await prisma.schema.update({
        where: { id: schemaId },
        data: {
          ...(data.archetypeParams !== undefined && {
            archetypeParams: toInputJson(data.archetypeParams),
          }),
          ...(data.header !== undefined && { header: data.header }),
          ...(data.intensity !== undefined && {
            intensity: data.intensity === null ? Prisma.JsonNull : toInputJson(data.intensity),
          }),
          ...(data.trailingConnector !== undefined && {
            trailingConnector:
              data.trailingConnector === null
                ? Prisma.JsonNull
                : toInputJson(data.trailingConnector),
          }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      return mapToSchema(updated);
    } catch (error) {
      return handlePrismaError(error, { entity: "Schema" });
    }
  },

  delete: async (userId: string, schemaId: string): Promise<void> => {
    const owner = await verifySchemaOwnership(schemaId, userId);

    verifyPlanEditable(owner);

    try {
      await prisma.schema.delete({ where: { id: schemaId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Schema" });
    }
  },

  reorder: async (
    userId: string,
    planId: string,
    scope: CreateScope,
    data: ReorderSchemasData,
  ): Promise<Schema[]> => {
    const owner =
      "blockId" in scope
        ? await verifyBlockOwnership(scope.blockId, userId)
        : await verifySchemaOwnership(scope.parentSchemaId, userId);

    if (owner.planId !== planId) {
      throw new NotFoundError("Scope target not found in plan", { planId, scope });
    }

    verifyPlanEditable(owner);

    const scopeWhere =
      "blockId" in scope
        ? { blockId: scope.blockId, parentSchemaId: null }
        : { parentSchemaId: scope.parentSchemaId };

    const schemas = await prisma.schema.findMany({
      where: { id: { in: [...data.orderedIds] } },
      select: { id: true, blockId: true, parentSchemaId: true },
    });

    if (schemas.length !== data.orderedIds.length) {
      throw new BadRequestError("Some orderedIds reference non-existent schemas", {
        missing: data.orderedIds.filter((id) => !schemas.some((s) => s.id === id)),
      });
    }

    const foreignIds =
      "blockId" in scope
        ? schemas.filter((s) => s.blockId !== scope.blockId || s.parentSchemaId !== null)
        : schemas.filter((s) => s.parentSchemaId !== scope.parentSchemaId);

    if (foreignIds.length > 0) {
      throw new BadRequestError("Some orderedIds do not belong to the target scope", {
        foreignIds: foreignIds.map((s) => s.id),
      });
    }

    const scopeCount = await prisma.schema.count({ where: scopeWhere });

    if (data.orderedIds.length !== scopeCount) {
      throw new BadRequestError("orderedIds must include every schema in the target scope", {
        provided: data.orderedIds.length,
        expected: scopeCount,
      });
    }

    try {
      const updated = await prisma.$transaction([
        ...data.orderedIds.map((id, i) =>
          prisma.schema.update({ where: { id }, data: { order: -(i + 1) } }),
        ),
        ...data.orderedIds.map((id, i) =>
          prisma.schema.update({ where: { id }, data: { order: (i + 1) * 10 } }),
        ),
      ]);

      return updated.slice(data.orderedIds.length).map(mapToSchema);
    } catch (error) {
      return handlePrismaError(error, { entity: "Schema" });
    }
  },
};
```

**Notes on D10 discriminated `scope`**:

- TypeScript narrows via `"blockId" in scope` vs `"parentSchemaId" in scope` (canonical JS-runtime narrowing). At call site (route layer Step 8.2), choose the variant based on URL shape: `POST /api/.../blocks/[blockId]/schemas` → `{blockId}`; `POST /api/.../schemas/[parentSchemaId]/sub-schemas` → `{parentSchemaId}` (URL shape TBD Step 8.2; out of 8.1a scope).
- Outer guard branches on scope variant — `verifyBlockOwnership(scope.blockId, userId)` (top-level) vs `verifySchemaOwnership(scope.parentSchemaId, userId)` (sub-schema). **Both** return objects include `planId`, so the `owner.planId !== planId` assertion works uniformly.
- Inside the tx, top-level branch double-checks the Block exists + belongs to the plan; sub-schema branch double-checks the parent Schema exists + its `parent.block.session.day.week.planId === planId`. Both branches resolve `storageBlockId` (top-level: `scope.blockId`; sub: `parent.blockId`) and `storageParentSchemaId` (top-level: `null`; sub: `scope.parentSchemaId`). DB-stored `blockId` always points to the top-level block (cascade-on-block-delete works through every nesting level per § 0.10).
- **`_max(order)` scoping**: `{blockId: storageBlockId, parentSchemaId: storageParentSchemaId}` — for top-level, scopes to `(blockId, null)` (only top-level siblings); for sub-schema, scopes to `(parentSchemaId, *)` (only siblings under same parent). Both use Prisma's `aggregate({where, _max: {order: true}})` pattern.

**Notes on `update` ignoring structural mutations** (per D9):

`updateSchemaSchema = createSchemaSchema.partial()` accepts `kind`, `archetypeId`, `parentSchemaId`, `blockId` as optional fields. The handler **explicitly rejects** any structural mutation with a `BadRequestError`. Client (Step 8.3) should construct `useUpdateSchema` payloads from the editable subset only (`header` / `archetypeParams` / `intensity` / `trailingConnector` / `notes`). **archetypeParams update is allowed within-variant only** — server cross-validates `data.archetypeParams.archetype === current.archetype.name`. If a coach wants to truly change the archetype (e.g., switch from `n-rounds` to `amrap-flat`), the workflow is delete + recreate.

**Notes on `Prisma.JsonNull` marshalling**:

When writing `null` to a `Json?` column (`intensity`, `trailingConnector`), Prisma distinguishes "leave as-is" (raw `null` in `data`) from "set to JSON null" (`Prisma.JsonNull`). Step 8.1a wants the latter when the payload explicitly says `intensity: null` or `trailingConnector: null`. Use the `toInputJson` helper for non-null branches — it asserts the type to `Prisma.InputJsonValue` (the only acceptable pattern in this codebase per existing Block usage; not a `[[type-quality]]` violation because the upstream Zod-validated payload guarantees shape). For `archetypeParams` (non-null always): direct `toInputJson(data.archetypeParams)`.

**Notes on `reorder` scope discrimination + 2-pass**:

- `scopeWhere` is the Prisma filter that scopes `count` queries: top-level uses `{blockId, parentSchemaId: null}`; sub uses `{parentSchemaId}`. The latter does NOT need `blockId` because `parentSchemaId` is unique within a Block (and a Schema can have at most one parent).
- `foreignIds` check varies per scope: top-level requires `s.blockId === scope.blockId && s.parentSchemaId === null`; sub requires `s.parentSchemaId === scope.parentSchemaId` (blockId implicit via parent chain).
- 2-pass UPDATE pattern (`-(i+1)` then `(i+1)*10`) is uniform across both scopes per § 0.11 — anticipating Step 8.3.7 partial-unique on top-level. Sub-schema 2-pass is technically unnecessary (no constraint will land on sub scope), but uniform code is clearer + cost is negligible.

**File**: `packages/api-server/src/endpoints/lms/schema/index.ts` (new, 1 line):

```ts
export * from "./admin";
```

**Edit** `packages/api-server/src/endpoints/lms/index.ts` per § 0.8 final state (insert `export * from "./schema";` alphabetically between `plan-enrollment` and `session`).

**ESLint `max-lines: 300` mitigation**: if `admin.ts` exceeds 300 LOC after Phase 3 wrap, extract `assertArchetypeConsistency` + `assertSubSchemaInvariants` to sibling `packages/api-server/src/endpoints/lms/schema/assertions.ts` and re-import. Behaviour-equivalent. Mirror Step 8.0b D-1 pattern (archetype-params.schema.ts extraction). Acceptable executor D-decision — note in `output.md` if invoked.

**Commit 3** (after Phase 3 + Phase 4 tests are green): `feat(api-server): add lmsschemaapi with crud and two-pass reorder`.

### Phase 4 — Integration tests (`packages/api-server/src/endpoints/lms/schema/admin.test.ts`)

**Mirror `block/admin.test.ts` structure**: top-level `describe("lmsSchemaApi", ...)`, `beforeAll` provisions 2 coaches + active + archived plan + Week + Day + Session + Block (reuse for most cases) + Archetype lookups for 4-5 canonical kinds (ATOMIC: `n-rounds`; NESTED: `nested-rounds-over-rounds`; HEADERLESS: `single-line-bare`; NAMED: `named-themed-sets`; COMPOSITE: `composite-rounds-with-rest`). `afterAll` cleans schema → block → session → day → week → plan → coachProfile → user. **Do NOT delete Archetype rows in cleanup** — they are seeded canonical configuration (D4); test-suite-scoped Archetypes are not created.

**Provisioning helper** (mirror Block's `provisionSession`):

```ts
const provisionBlock = async (options: { planId?: string } = {}) => {
  const planId = options.planId ?? activePlanId;
  weekCounter += 1;
  const startDate = new Date(Date.UTC(2026, 0, 1));
  startDate.setUTCDate(startDate.getUTCDate() + weekCounter * 7);

  const week = await cleanupRaw.week.create({ data: { planId, startDate } });
  const day = await cleanupRaw.day.create({ data: { weekId: week.id, dayOfWeek: "WEDNESDAY" } });
  const session = await cleanupRaw.session.create({ data: { dayId: day.id, order: 10 } });
  const block = await cleanupRaw.block.create({ data: { sessionId: session.id, order: 10 } });

  return {
    week,
    day,
    session,
    block,
    cleanup: async () => {
      await cleanupRaw.schema.deleteMany({ where: { blockId: block.id } }).catch(() => {});
      await cleanupRaw.block.delete({ where: { id: block.id } }).catch(() => {});
      await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
      await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
      await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
    },
  };
};
```

**Required cases** (target: 28-32 total; split across `describe("create")`, `describe("update")`, `describe("delete")`, `describe("reorder")`):

**`describe("create")` (~12 cases — CRUD happy paths + archetype consistency + sub-schema invariants + authz)**:

1. `rejects when caller does not own the parent block's plan` — `otherCoach` → `ForbiddenError`; assert no Schema created.
2. `rejects on an archived plan` — coach owns plan but plan status `ARCHIVED` → `ForbiddenError` (intra-tx re-check fires).
3. `rejects when planId does not match the block's plan` — provision block in plan A, call create with planId=B → `NotFoundError`.
4. `creates a top-level Schema with kind ATOMIC and order 10` — supply ATOMIC archetype (`n-rounds`), `data.kind = "ATOMIC"`, `archetypeParams = {archetype: "n-rounds", params: {countForm: "exact", count: 5}}` → returns Schema with `blockId, parentSchemaId=null, order=10, kind=ATOMIC, archetypeParams` matching.
5. `creates a top-level Schema with kind NESTED and intensity/trailingConnector` — supply NESTED archetype (`nested-rounds-over-rounds`), include `intensity: {rpe: {value: 7}}` + `trailingConnector: {form: "then_n_rounds", roundsCount: 3}` → returns Schema with `intensity` + `trailingConnector` round-tripped through `mapToSchema`.
6. `assigns next sparse order on a populated block` — pre-create 2 Schemas (orders 10, 20) → next create returns `order=30`.
7. `concurrent Schema.create on same block — at least one succeeds via P2034 retry` — mirror Block precedent: 2 `Promise.allSettled`'d creates with disjoint archetypes; assert fulfilled ≥ 1; assert `Schema.count({blockId}) === fulfilledCount`; if both fulfilled, orders 10 + 20 distinct.
8. `rejects when archetypeId does not exist` — supply `archetypeId: "clz0000000000000000000000"` → `NotFoundError` (server pre-check fires; no FK P2003 surfaces).
9. `rejects when archetype.kind !== data.kind` — supply `archetypeId` of ATOMIC archetype but `data.kind = "NESTED"` → `BadRequestError("Schema kind does not match Archetype kind")`.
10. `rejects when archetypeParams.archetype literal does not match Archetype name` — supply `archetypeId` of `n-rounds` but `archetypeParams = {archetype: "amrap-flat", params: {durationMin: 20}}` → `BadRequestError("archetypeParams variant does not match Archetype")`.
11. `creates a sub-schema with kind ATOMIC under a NESTED parent` — pre-create top-level NESTED Schema; supply scope `{parentSchemaId}`, `data.kind = "ATOMIC"`, ATOMIC archetype → returns Schema with `parentSchemaId === parent.id`, `blockId === parent.blockId` (NOT from scope), `order = 10` (sub-schema order independent of parent's order).
12. `rejects sub-schema creation when parent.kind !== NESTED` — pre-create top-level ATOMIC Schema; supply scope `{parentSchemaId: parentAtomic.id}`, sub data → `BadRequestError("Cannot nest schemas under non-NESTED parent kind")`.
13. `rejects sub-schema when data.kind ∉ {ATOMIC, HEADERLESS}` — pre-create NESTED parent; supply scope `{parentSchemaId}`, `data.kind = "NESTED"` → `BadRequestError("Sub-schema kind must be ATOMIC or HEADERLESS")`. (NAMED + COMPOSITE branches optional additional sub-cases.)
14. `rejects sub-schema when parentSchemaId does not exist` — supply scope `{parentSchemaId: "clz0000000000000000000000"}` → `NotFoundError("Parent schema not found")`.

**`describe("update")` (~7 cases — editable subset + structural-immutability + archetypeParams variant + authz)**:

15. `updates header, intensity, and notes via conditional spread` — pre-create Schema; call `update({header: "new header", intensity: {rpe: {value: 8}}, notes: "set 1"})` → returns Schema with all three set; verify stored row via `cleanupRaw.schema.findUnique`.
16. `clears trailingConnector by writing JSON null when payload sets trailingConnector: null` — pre-create Schema with `trailingConnector = {form: "then"}`; call `update({trailingConnector: null})` → returned `schema.trailingConnector === null`; stored row has `trailingConnector` as DB-null.
17. `updates archetypeParams within same variant` — pre-create Schema with `n-rounds` `{count: 5}`; call `update({archetypeParams: {archetype: "n-rounds", params: {countForm: "exact", count: 7}}})` → returned `schema.archetypeParams.params.count === 7`.
18. `rejects archetypeParams update with different variant literal` — pre-create Schema with `n-rounds`; call `update({archetypeParams: {archetype: "amrap-flat", params: {durationMin: 20}}})` → `BadRequestError("archetypeParams variant must match current Archetype on update")`.
19. **Structural-immutability** — `rejects update with kind/archetypeId/parentSchemaId/blockId set` (4 sub-assertions in one test OR 4 separate tests; planner accepts either): pre-create Schema; call each of `update({kind: "HEADERLESS"})`, `update({archetypeId: "<other>"})`, `update({parentSchemaId: "<some-cuid>"})`, `update({blockId: "<some-cuid>"})` → each → `BadRequestError("Schema structural fields are immutable")`; assert returned-message `fields` array contains the attempted mutation key.
20. `rejects non-owner update` — pre-create Schema; `otherCoach.update(...)` → `ForbiddenError`.
21. `rejects update on archived plan` — pre-create Schema in active plan; archive the plan via `cleanupRaw.trainingPlan.update(...status="ARCHIVED")`; call `update(...)` → `ForbiddenError`. (Restore plan status in `finally`.)

**`describe("delete")` (~3 cases — happy path + cascade verification + authz)**:

22. `removes the Schema and cascades sub-schemas + rows + pairings` — pre-create top-level NESTED Schema + 1 sub-schema ATOMIC + 1 row directly via `cleanupRaw.schemaRow.create` (minimal valid row payload) + 1 pairing directly via `cleanupRaw.schemaPairing.create` (with another top-level schema as the other side). Call `delete(topLevelSchemaId)` → assert top + sub + row + pairing rows all `findMany` returns `[]`. **Critical for verifying `onDelete: Cascade` on `SchemaSubSchemas` + `SchemaPairing`.** Note: row + pairing minimal payloads require valid foreign keys; mock with `cleanupRaw.schemaRow.create({data: {schemaId, order: 10, rowKind: "EXERCISE", payload: {...minimal}}})` (consult `analysis/artifacts/06-formalization/types.ts` SchemaRowPayload for shape).
23. `removes a sub-schema without affecting the parent or siblings` — pre-create top-level NESTED + 2 sub-schemas; delete one sub-schema → returns void; assert top-level Schema still exists; assert sibling sub-schema still exists.
24. `rejects when caller does not own the schema` — pre-create Schema; `otherCoach.delete(...)` → `ForbiddenError`; assert Schema still present.

**`describe("reorder")` (~7 cases — happy + dual-scope + validation)**:

25. `renumbers top-level Schemas on the happy path` — pre-create 3 top-level Schemas in same Block (orders 10/20/30), reorder `[c, a, b]` → assert returned + stored orders are c=10, a=20, b=30.
26. `renumbers sub-schemas under same parent on happy path` — pre-create NESTED parent + 3 sub-schemas (orders 10/20/30), reorder with scope `{parentSchemaId}` and `[c, a, b]` → assert returned + stored orders are c=10, a=20, b=30.
27. `rejects when orderedIds is a subset of target scope's schemas` — pre-create 3 top-level Schemas, reorder `[a, b]` → `BadRequestError("orderedIds must include every schema in the target scope")`; orders unchanged.
28. `rejects ids that belong to a different scope` — pre-create top-level Schema X + sub-schema Y (under separate NESTED parent); reorder scope `{blockId: X.blockId}` with `orderedIds: [X, Y]` → `BadRequestError("Some orderedIds do not belong to the target scope")`; orders unchanged.
29. `rejects when orderedIds references a non-existent schema` — pre-create 1 Schema; reorder `[a, "clz0000000000000000000000"]` → `BadRequestError("Some orderedIds reference non-existent schemas")`.
30. `2-pass UPDATE preserves Schema rows when no @@unique yet` (smoke verification — confirms reorder works against the pre-Step-8.3.7 state) — pre-create 5 Schemas (orders 10/20/30/40/50), reorder full reverse `[e, d, c, b, a]` → all 5 final orders match (10/20/30/40/50) bound to reversed IDs. Verify via `cleanupRaw.schema.findMany({orderBy: {order: "asc"}})`.
31. `rejects mixed-scope orderedIds (top-level + sub-schema in same reorder call)` — pre-create top-level NESTED Schema + 1 sub-schema; reorder scope `{blockId}` with `orderedIds: [topNested.id, subSchema.id]` → `BadRequestError("Some orderedIds do not belong to the target scope")` (sub-schema fails because `parentSchemaId !== null`).

**`describe("verifySchemaOwnership")` in `guards.test.ts` (~4 cases)** — see Phase 1.

**Total target**: ~32-36 new cases (28-32 in `schema/admin.test.ts` + 4 in `guards.test.ts`). Acceptable range for `pnpm test` delta: +32 to +40 (~1326 baseline → ~1358-1362).

**Commit 3 includes both endpoint and tests** — they must land together to keep the tree green.

### Phase 5 — Local verification

Run from repo root (each one independently):

```bash
pnpm --filter @repo/api-server test
# Expected: all api-server tests green (588 baseline + ~32-36 new = ~620-624 cases).

pnpm check-types
# Expected: 16/16 green.

pnpm lint
# Expected: 16/16 green (0 warnings).

pnpm test
# Expected: ~1326 baseline + ~32-36 new = ~1358-1362 cases across N+1 test files (the schema/admin.test.ts add).

pnpm dep:check
# Expected: 0 violations / +4-5 modules from 1247 baseline (new files: admin.ts + admin.test.ts + index.ts + schema.mapper.ts).
```

If any gate fails — fix root cause; do NOT bypass. If a test flakes (timing-sensitive concurrent case): rerun once; if still flaky, surface to planner via `AskUserQuestion`. Do not mark a flaky test `.skip`.

---

## § 4. Out of scope (explicit forbid list)

- **HTTP routes** (`apps/platform/src/app/api/platform/training-plans/[planId]/blocks/[blockId]/schemas/...`) — Step 8.2.
- **Client API + hooks** (`apps/platform/src/lib/api/endpoints/schemas.ts`, `use-schemas.ts`) — Step 8.3.
- **`schemas[]` read-embed** in `blockSchema` — Step 8.3.5 enabler step. Block's `mapToBlockWithSchemas` is the trigger; out of 8.1a.
- **`SchemaRow` API** (`lmsSchemaRowApi`) — Step 8.1b.
- **`SchemaPairing` API** (`lmsSchemaPairingApi`) — Step 8.1c.
- **`SchemaRow @@unique([schemaId, order])` constraint** — Step 8.3.6.
- **Schema partial-unique `schemas_block_top_order` constraint** — Step 8.3.7. **DO NOT edit `packages/api-server/scripts/apply-sql-checks.ts` in 8.1a.**
- **`db:reset:for-tests` alias or test-suite WORKFLOW-001 fix** — Step 8.3.7-pre (per D13).
- **UI** (ArchetypePicker, archetype-params forms) — Step 8.4+.
- **Intensity / TimeCap form widgets** — already shipped Step 7.5 (Block UI vertical complete). Schema does NOT need new widgets; reuses Step 7.5 IntensityForm via Step 8.4+ UI.
- **Prisma schema change** — Schema / SchemaRow / SchemaPairing / Archetype already shipped Step 2 + Step 8.0b D12 enum drop. No edit to `schema.prisma`, no `db:reset`, no seed change.
- **`analysis/artifacts/` change** — no domain-semantics change.
- **Refactor of `lmsBlockApi` / `lmsSessionApi`** — Schema is additive; do not touch Block/Session code.
- **`mapToBlockWithSchemas` mapper** — Step 8.3.5 trigger (when `schemas[]` embed lands in `blockSchema`). Out of 8.1a.
- **`DAY_INCLUDE` / `BLOCK_WITH_LABELS_INCLUDE` hoist** — Step 8.3.5+ trigger when 3rd outside callsite materializes. Out of 8.1a.
- **`z.nativeEnum` migration in pre-existing `lms/plan-enrollment` + `lms/training-plan`** — Step 8.0b Q-1 carry-forward; separate `/feature small`. Out of 8.1a.
- **`SchemaPairing` cascade test** — Step 22 covers via direct `cleanupRaw.schemaPairing.create`; this is NOT a SchemaPairing API implementation, only a cascade verification fixture.

---

## § 5. Acceptance criteria

1. **All 4 `lmsSchemaApi` methods** implemented matching § 3 Phase 3 skeleton. No method left as stub or NotImplementedError.
2. **`verifySchemaOwnership` guard** in `authz/guards.ts` mirrors `verifyBlockOwnership` shape; returns `{status, blockId, sessionId, dayId, weekId, planId, parentSchemaId, kind}`. Reused by Schema.update / delete / reorder (subset of callsites in this step) + create-sub-schema branch.
3. **`mapToSchema`** in `mappers/lms/schema.mapper.ts`. `archetypeParams` / `intensity` / `trailingConnector` parsed via `archetypeParamsSchema.parse` / `intensitySchema.parse` / `trailingConnectorSchema.parse` on read (not `as` casts).
4. **D10 discriminated scope** — `create` + `reorder` take `scope = {blockId} | {parentSchemaId}` discriminated TypeScript union; outer guard branches on scope variant; storage `blockId` always resolves to top-level Block (via `parent.blockId` for sub-schemas).
5. **Sub-schema invariants** — `parent.kind === "NESTED"` + `data.kind ∈ {ATOMIC, HEADERLESS}` enforced server-side via `assertSubSchemaInvariants` helper; verified by Phase 4 cases 11-13.
6. **Archetype consistency** — `tx.archetype.findUnique` existence check + `archetype.kind === data.kind` + `data.archetypeParams.archetype === archetype.name` enforced server-side via `assertArchetypeConsistency` helper; verified by Phase 4 cases 8-10.
7. **`retryOnP2034` wraps `create`** Serializable transaction; **does NOT wrap** `update` / `delete` / `reorder` (no SSI surface in single-statement or default-isolation array-tx).
8. **Structural-fields-immutable on `update`** — `kind` / `archetypeId` / `parentSchemaId` / `blockId` set in payload triggers `BadRequestError`; verified by Phase 4 case 19.
9. **archetypeParams variant alignment on `update`** — `data.archetypeParams.archetype` must match `current.archetype.name`; verified by Phase 4 case 18.
10. **`Prisma.JsonNull` marshalling** — `intensity: null` / `trailingConnector: null` write `Prisma.JsonNull` (not raw `null`) so the column gets a JSON null, not "no-update".
11. **Reorder dual-scope** — top-level (`{blockId}`) reorders only `parentSchemaId === null` siblings; sub (`{parentSchemaId}`) reorders only siblings under same parent; foreign-scope IDs rejected; verified by Phase 4 cases 25-31.
12. **Canonical 2-pass reorder** — Phase 1 stages to `-(i+1)`, Phase 2 final `(i+1)*10`; applied uniformly to both scopes; verified structurally (returned slice + stored orders) by Phase 4 cases 25-26.
13. **Cascade behaviour verified** — Phase 4 case 22 asserts `delete` Schema removes sub-schemas + rows + pairings via Prisma FK cascade.
14. **Concurrent create** — Phase 4 case 7 (`Promise.allSettled` two creates on same block, assert fulfilled ≥ 1 + `Schema.count === fulfilledCount`).
15. **Zero `--no-verify`** / `--no-edit` / `--no-gpg-sign` — every commit passes pre-commit hook (`check-secrets` + `lint-staged` + `turbo check-types --filter="...[HEAD]"`).
16. **Per-step verification all-green**:
    - `pnpm check-types` 16/16
    - `pnpm lint` 16/16 (0 warnings)
    - `pnpm --filter @repo/api-server test` ~620-624 cases all pass
    - `pnpm test` ~1358-1362 cases all pass
    - `pnpm dep:check` 0 violations, +4-5 modules from 1247 baseline
17. **Regression greps return 0**:
    - `grep -rn "RowKind.CONNECTOR\|rowKind: \"CONNECTOR\"\|rowKind:CONNECTOR" packages/ apps/` → 0 hits (D12 Step 8.0b enforces).
    - `grep -rn "SchemeType\|per-block atomic save\|coach always edit mode\|plan-editor rollback" packages/ apps/ analysis/source` → 0 hits (prior-impl trace stop § 0.0).
18. **`@repo/contracts/lms/schema` consumed exactly in the expected files** — `grep -rln "@repo/contracts/lms/schema" packages/api-server/src/` returns: `endpoints/lms/schema/admin.ts`, `endpoints/lms/schema/admin.test.ts`, `mappers/lms/schema.mapper.ts`, `authz/guards.ts` (4 files; `guards.ts` imports `type SchemaKind` per Phase 1 import addition). Nothing else.
19. **No `as ArchetypeParams` / `as Intensity` / `as TrailingConnector` / `as unknown as ...` casts** in `schema.mapper.ts` — `archetypeParamsSchema.parse` / `intensitySchema.parse` / `trailingConnectorSchema.parse` is the only allowed conversion path.
20. **Branch convention**: all commits land on `feat/training-domain`. No `feat/<slug>` branch created. **`git log --oneline feat/training-domain ^main`** shows Step 7.x + 8.0a + 8.0b commits + Step 8.1a commits with no foreign refs.
21. **No analysis-artifacts touch**: `analysis/` directory unchanged; verify via `git status` + `git diff analysis/` returning empty.

---

## § 6. Verification gates (run in this order before each commit)

Per phase:

- **After Phase 1** (guards.ts + guards.test.ts):
  - `pnpm --filter @repo/api-server test -- guards.test.ts` — all guard cases green (existing + new verifySchemaOwnership).
  - `pnpm --filter @repo/api-server check-types` — 1/1 green.
- **After Phase 2** (mapper):
  - `pnpm --filter @repo/api-server check-types` — 1/1 green (mapper compiles; consumers absent yet).
  - No test run required (no mapper-specific test file; mapper exercised by Phase 4 tests).
- **After Phase 3 + Phase 4** (endpoints + tests):
  - `pnpm --filter @repo/api-server test` — full api-server suite green.
  - `pnpm --filter @repo/api-server check-types` — 1/1 green.
- **Pre-final-commit / pre-push**:
  - `pnpm check-types` (root) — 16/16.
  - `pnpm lint` (root) — 16/16 (0 warnings).
  - `pnpm test` (root) — ~1358-1362 cases.
  - `pnpm dep:check` (root) — 0 violations.
- **TZ invariance not applicable** — Schema does not write any `@db.Date` column. Skip `TZ=Asia/Kolkata` rerun.

If a hook fails — fix the underlying issue; never `--no-verify`. Examples:

- Commitlint subject > 100 chars → reword (do NOT amend the prior commit; the failed commit was never created — create a new one with the fixed message).
- `turbo check-types --filter="...[HEAD]"` fails because a downstream consumer breaks → unlikely (Step 8.1a is additive), but if it happens, fix the broken consumer in the same commit (squash exception per `[[husky-cross-package-squash]]` may apply — surface to planner first).
- `lint-staged` auto-format reorders imports → expected; accept the formatted version (lint-staged stages it).
- ESLint `max-lines: 300` violation on `admin.ts` → extract helpers to sibling `assertions.ts` per § 3 Phase 3 ESLint mitigation note; log as D-decision in `output.md`.

---

## § 7. Commit strategy

Per `[[husky-cross-package-squash]]` pre-check (§ 0.9 verified):

- `.husky/pre-commit` runs `turbo check-types --filter="...[HEAD]"` — fans out to downstream consumers.
- Step 8.1a is **api-server-only and additive** (new files + new exports in existing barrels; never removes an existing export; never touches downstream code).
- **Conclusion**: per-phase atomic commits OK; no squash trigger.

**Recommended structure (1 prereq commit + 3 code commits + 1 docs commit)**:

0. **🔴 PREREQ — `feat(contracts): add archetype schema schema-pairing schema-row to exports map`** (per § 0.8 PREREQUISITE — Step 8.0b drift fix; lands FIRST, before any api-server work, so Phase 1+ imports resolve)

   - `packages/contracts/package.json` (+ 4 lines в alphabetical positions per § 0.8 additive intent)

   Verifications before next commit: `pnpm --filter @repo/contracts check-types` 1/1 green + `pnpm dep:check` 0 violations.

1. `feat(api-server): add verifyschemaownership guard for schema ownership chain`

   - `packages/api-server/src/authz/guards.ts` (+ `verifySchemaOwnership` + `import { type SchemaKind } from "@repo/contracts/lms/schema"` — now resolves post-Commit 0)
   - `packages/api-server/src/authz/guards.test.ts` (+ `describe("verifySchemaOwnership")` with ~4 cases)

2. `feat(api-server): add lms schema mapper with archetypeparams intensity trailingconnector parse`

   - `packages/api-server/src/mappers/lms/schema.mapper.ts` (new)
   - `packages/api-server/src/mappers/lms/index.ts` (+ `export * from "./schema.mapper"`)

3. `feat(api-server): add lmsschemaapi with crud and two-pass reorder`

   - `packages/api-server/src/endpoints/lms/schema/admin.ts` (new)
   - `packages/api-server/src/endpoints/lms/schema/admin.test.ts` (new, ~28-32 cases)
   - `packages/api-server/src/endpoints/lms/schema/index.ts` (new)
   - `packages/api-server/src/endpoints/lms/index.ts` (+ `export * from "./schema"`)
   - (if ESLint `max-lines` overflow mitigated) `packages/api-server/src/endpoints/lms/schema/assertions.ts` (new)

4. `docs(step-08.1a): write executor output report`
   - `implementation/step-08.1a/output.md` (per § 9 format)

**Commit-message conventions** (per `[[commitlint-subject-case]]` + project root commitlint config):

- Subject ≤ 100 chars, **fully lowercase** (including acronyms: `lms` not `LMS`, `crud` not `CRUD`).
- Body lines ≤ 150 chars.
- **No `Co-Authored-By` / `Generated-with` trailers** anywhere.
- Conventional-commits prefix: `feat`, `chore`, `docs`, `refactor`, `fix`, `test`.

**If `/feature` Stage 7 (Finalize) proposes a single squashed commit instead of 3 per-phase commits** — that's also acceptable per `[[husky-cross-package-squash]]` "squash is the squash-exception default for cross-package breaking changes only; single-package additive is per-phase OR single squash, planner's pick = either". Both shapes are byte-equivalent for logical revertability if the squashed body lists per-layer changes. **Pick whichever is cleaner for `/feature` Stage 7 to produce; do not force a 3-commit split if the pipeline naturally produces 1.**

**Forbidden**:

- Branch creation (`git checkout -b feat/<slug>` from main) — see § Execution mode branch-cut override.
- `--no-verify` / `--no-edit` / `--no-gpg-sign` on any git command.
- Amending an existing commit on `feat/training-domain` (the branch has already-pushed history; amending rewrites it). New commits only.
- Squashing across step boundaries (Step 8.0b commits stay separate from Step 8.1a commits).

---

## § 8. Anti-patterns to avoid (will get caught in code review)

1. **Code comments** explaining the discriminated scope narrowing, archetype consistency reasoning, or `Prisma.JsonNull` semantic. Per `[[global-preferences]]`: no comments unless encoding a non-obvious _why_; all three are obvious-by-reading-code or documented in this prompt + acceptance-criteria.
2. **`as ArchetypeParams` / `as Intensity` / `as TrailingConnector` / `as unknown as X`** casts in `schema.mapper.ts`. Use `<schema>.parse(...)`. Violates `[[type-quality]]`.
3. **Deprecation shim files** (e.g., `_legacy_schema.ts` re-exporting old symbols). None apply here, but flag if you find yourself reaching for one.
4. **Mocking Prisma** in tests. Use real `prisma`/`cleanupRaw` per `[[no-tech-debt-in-mocks]]`. Concurrent-create test uses `Promise.allSettled` against the real DB (Block precedent).
5. **Single-pass reorder** (e.g., `prisma.$transaction(data.orderedIds.map((id, i) => prisma.schema.update({where:{id}, data:{order: (i+1)*10}})))`). MUST be 2-pass per § 0.11 + § 0.12 (anticipates Step 8.3.7 partial-unique).
6. **Hoisting `assertArchetypeConsistency` or `assertSubSchemaInvariants`** to a shared module outside the schema slice. Keep them local in `admin.ts` (or sibling `assertions.ts` if ESLint `max-lines` overflow mitigates). 3rd-callsite trigger fires Step 8.1b/c at earliest, NOT this step.
7. **Adding a `mapToSchemaWithBody` mapper or `findUniqueOrThrowWithBody`** — Step 8.3.5 trigger; Step 8.1a does not preempt it.
8. **Touching `lmsBlockApi` or `mapToBlock`** — Schema is additive; Block is untouched.
9. **Inventing a `Schema.name` field** in the contract or handler — Schema identity is `(kind, archetype.name, header?)` for UI purposes; no name surface in this domain. `Schema.header` is the closest thing and is governed by the kind's expectations (HEADERLESS → null, NAMED → required-name, etc per domain §1.4 invariants — server enforces via `assertArchetypeConsistency` which derives kind from archetype, but **does NOT enforce header constraints in 8.1a** — header is optional input; coach-time validation comes in Step 8.4 UI per OQ-C1 ratify).
10. **Inserting a `null` raw value for nullable Json columns on update**. MUST use `Prisma.JsonNull` (per § 0.11 example). Raw `null` reads as "do not update" — silent bug.
11. **Branching the api method into `createTopLevel` + `createSubSchema`** — D10 ratified single method with discriminated scope arg.
12. **Allowing structural mutation on `update`** — `kind` / `archetypeId` / `parentSchemaId` / `blockId` MUST throw. Mirror D9 ratify.
13. **Searching git history / memory for "prior Schema implementation"** — 4th attempt; priors deleted. Trace found → STOP and surface.
14. **Forgetting that DB-stored `Schema.blockId` for sub-schemas points to top-level Block** — uniform across all nesting levels per § 0.10. Cascade on Block delete works through every sub-schema.
15. **Using `assertArchetypeConsistency` outside the tx** — must run inside `prisma.$transaction` so TOCTOU re-checks (e.g., Archetype deletion mid-tx, impossible because `onDelete: Restrict`, but defense-in-depth via tx visibility).
16. **Failing to handle the contract permissive shape** — `createSchemaSchema` has `blockId` always required + `parentSchemaId?: null | undefined | string`; but D10 scope is discriminated at api method signature. Server method's `data: SchemaBodyData = Omit<CreateSchemaData, "blockId" | "parentSchemaId">` strips both scope keys at type level; route layer (Step 8.2) is responsible for reconciling URL-path-derived scope with body fields if body still carries them. **Do NOT** add server-side `data.blockId === scope.blockId` assertion (not in 8.1a — route layer's job).

---

## § 9. Output report format (`implementation/step-08.1a/output.md`)

Russian prose where natural, English for code/paths. Section headers verbatim:

```markdown
# Step 8.1a — `lmsSchemaApi` (CRUD + two-pass reorder + parent-vs-child discriminated create) + `verifySchemaOwnership` + `mapToSchema`

## Что сделано

<3-7 lines summarizing the slice + key invariants enforced (D10 discriminated scope, archetype consistency cross-checks, sub-schema invariants, structural-fields-immutable on update, 2-pass reorder anticipation per § 0.12)>

## Изменённые/созданные файлы

<list 5 new + 4 edited paths with 1-line purpose each. If `assertions.ts` was extracted per ESLint mitigation, mention as 6th new.>

## Принятые решения

<D-1, D-2, ... per minor inline judgement calls — name + rationale + non-impact certification. Use when output diverges from prompt for an obvious reason (e.g. ESLint max-lines mitigation, lint-staged auto-format, codebase pattern alignment). Each ≤ 5 lines.>

## Возникшие вопросы и как решены

<if any § 0 STOP-and-surface escalation fired — paste the AskUserQuestion content + planner answer + resolution commit hash. If none fired, write "Без escalations через § 0 — все verbatim quotes byte-for-byte matched HEAD `2d8a4409`.">

## Что отложено

<list items the executor noticed but intentionally did NOT do, with the "see Step 8.X" or "see deferred sub-decision in state/03-deferred.md" link. Examples: `mapToSchemaWithBody` mapper (Step 8.3.5); `DAY_INCLUDE` / `BLOCK_WITH_LABELS_INCLUDE` hoist (Step 8.3.5); SchemaRow / SchemaPairing API (Step 8.1b / 8.1c); partial-unique constraint (Step 8.3.7).>

## Ссылка на `.feature-dev/<ts>/`

<full path to the `/feature` pipeline artifacts directory (Stage 0-7 outputs: research.md / design.md / plan.md / review.md / qa.md / etc).>

## Сценарий смоук-теста

**N/A** — api-server-only step. UI smoke resumes Step 8.4 (ArchetypePicker + archetype-params forms = first coach-visible Schema editor).

## Verification notes

<table or bullets recording the actual numbers from local verification commands: `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm --filter @repo/api-server test`, `pnpm dep:check`. Each as "expected X / got Y" with planner-range comparison.>

## Acceptance criteria self-check

<numbered checklist mirroring § 5 of this prompt with ✓/✗ per item + brief evidence (test name, file path, line range).>
```

**Length budget**: 200-500 lines. Focus on _what diverged_ from the prompt (D-decisions, escalations) and _what's deferred_ — those are the planner-actionable signals. Verbatim re-statement of the prompt is not useful; it's already in `prompt.md`.

---

## Footer — quick reference

- **Branch**: `feat/training-domain` (long-lived; do NOT cut a feature branch).
- **Mirror target**: `lmsBlockApi` (`endpoints/lms/block/admin.ts`); `verifyBlockOwnership` (`authz/guards.ts:173-238`); `mapToBlock` (`mappers/lms/block.mapper.ts`).
- **D10**: discriminated scope `{blockId} | {parentSchemaId}` at method signature; `data` is `Omit<CreateSchemaData, "blockId" | "parentSchemaId">`; storage `blockId` resolves to top-level Block.
- **D12**: `Schema.trailingConnector` Json column canonical; standard `Prisma.JsonNull` marshalling.
- **`retryOnP2034` wraps**: `create` only.
- **2-pass reorder**: uniform for both scopes (`-(i+1)` then `(i+1)*10`); anticipates Step 8.3.7 partial-unique.
- **Mapper**: `archetypeParamsSchema.parse` / `intensitySchema.parse` / `trailingConnectorSchema.parse` on read; no `as` casts.
- **Tests**: 28-32 cases in `schema/admin.test.ts` + ~4 in `guards.test.ts`.
- **Commits**: 3 atomic per-phase OR single squash (planner's pick — both valid for api-server-only additive). No `--no-verify`.
- **No analysis touch**: `analysis/` unchanged.

If anything in this prompt conflicts with `implementation/WORKFLOW.md` or `~/.claude/CLAUDE.md` global rules — STOP and surface. WORKFLOW.md + global rules win; prompt-side error is planner's fault.
