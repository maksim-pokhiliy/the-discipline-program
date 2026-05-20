# Step 8.1b — `lmsSchemaRowApi` (CRUD + 2-pass reorder + parent-kind invariant + payload-discriminator alignment) + `verifySchemaRowOwnership` + `mapToSchemaRow` + `TxClient` hoist

**Wrapper**: `/feature` full pipeline. Multi-layer api-server slice (guard + mapper + endpoint + integration tests + must-test gap-fills); 9-variant discriminated payload coverage drives larger test footprint than Step 8.1a's 33 cases. Carve-out per [[always-via-feature-skill]] does NOT apply (thin-additive contracts-only single-package carve-out reserved for Step 7.0 / 8.0a / 8.0b shape — not 8.1b).

**Branch**: `feat/training-domain` long-lived. NO new branch cut (per [[training-domain-workflow]] + [[always-via-feature-skill]] branch-cut override). 0 commits ahead of `main` at handoff time (PR #197 merged 2026-05-19; branch recreated from fresh `main`).

---

## § 0 — Verbatim source reads (read-at-prompt-write-time per [[planner-verbatim-registration]])

### § 0.1 — Contract: `packages/contracts/src/entities/lms/schema-row/`

**`index.ts`**:

```ts
export * from "./schema-row.constants";
export * from "./schema-row.schema";
export * from "./schema-row.types";
export * from "./schema-row-api.schema";
export * from "./schema-row-api.types";
```

**`schema-row.schema.ts`** (key shapes — full file at `packages/contracts/src/entities/lms/schema-row/schema-row.schema.ts`):

```ts
export const rowKindSchema = z.enum(ROW_KINDS);
export const positionSchema = z.enum(POSITIONS);
export const urlAppliesToSchema = z.enum(URL_APPLIES_TO);
export const footnoteMarkerSchema = z.enum(FOOTNOTE_MARKERS);

export const schemaRowPayloadSchema = z.discriminatedUnion("rowKind", [
  z.object({ rowKind: z.literal("EXERCISE"), exercise: exerciseFormSchema }),
  z.object({ rowKind: z.literal("REST"), raw: z.string().min(1), parsed: restSpecSchema }),
  z.object({
    rowKind: z.literal("FOOTNOTE"),
    marker: footnoteMarkerSchema,
    target: footnoteTargetSchema,
    content: compoundRowSchema,
    typeLabel: z.string().min(1).optional(),
  }),
  z.object({
    rowKind: z.literal("STANDALONE_LOAD"),
    load: loadSchema,
    scope: standaloneLoadScopeSchema,
  }),
  z.object({
    rowKind: z.literal("STANDALONE_URL"),
    url: z.string().url(),
    wrapped: z.boolean(),
    appliesTo: urlAppliesToSchema,
  }),
  z.object({ rowKind: z.literal("PLACEHOLDER"), placeholder: placeholderPayloadSchema }),
  z.object({
    rowKind: z.literal("INNER_LADDER_MARKER"),
    steps: z.array(z.number().int().positive()).min(1),
  }),
  z.object({
    rowKind: z.literal("REP_DEFINITION"),
    equality: z.object({
      form: z.literal("inline_equality"),
      totalReps: z.number().int().positive(),
      composition: z
        .array(z.object({ exerciseId: z.string().cuid(), count: z.number().int().positive() }))
        .min(1),
    }),
  }),
  z.object({ rowKind: z.literal("REST_SLOT") }),
]);

export const schemaRowSchema = z.object({
  id: z.string().cuid(),
  schemaId: z.string().cuid(),
  order: z.number().int().positive(),
  rowKind: rowKindSchema,
  rowPayload: schemaRowPayloadSchema,
  load: loadSchema.nullable(),
  reps: repNotationSchema.nullable(),
  side: perLimbDistributionSchema.nullable(),
  tempo: tempoModifierSchema.nullable(),
  position: positionSchema.nullable(),
  sequence: sequenceIndicatorSchema.nullable(),
  intensity: intensitySchema.nullable(),
  media: mediaReferenceSchema.nullable(),
  compoundRep: compoundRepDefinitionSchema.nullable(),
  notes: z.string().max(SCHEMA_ROW_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSchemaRowSchema = z.object({
  schemaId: z.string().cuid(),
  rowKind: rowKindSchema,
  rowPayload: schemaRowPayloadSchema,
  load: loadSchema.nullable().optional(),
  reps: repNotationSchema.nullable().optional(),
  side: perLimbDistributionSchema.nullable().optional(),
  tempo: tempoModifierSchema.nullable().optional(),
  position: positionSchema.nullable().optional(),
  sequence: sequenceIndicatorSchema.nullable().optional(),
  intensity: intensitySchema.nullable().optional(),
  media: mediaReferenceSchema.nullable().optional(),
  compoundRep: compoundRepDefinitionSchema.nullable().optional(),
  notes: z.string().max(SCHEMA_ROW_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const updateSchemaRowSchema = createSchemaRowSchema.partial();

export const reorderSchemaRowsSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, { message: "orderedIds must be unique" }),
});
```

**Important**: contract `updateSchemaRowSchema = createSchemaRowSchema.partial()` ALLOWS mutation of `schemaId` and `rowKind` at Zod-parse level. **Server enforces structural immutability** via `STRUCTURAL_UPDATE_KEYS` filter (per Step 8.1a D9 precedent).

**Important**: contract has BOTH flat `rowKind: rowKindSchema` AND `rowPayload.rowKind` literal inside discriminated union. Zod does not cross-validate alignment. **Server cross-validates** `data.rowKind === data.rowPayload.rowKind` per Dev-OQ-11.

### § 0.2 — Prisma: `packages/api-server/prisma/schema.prisma`

```prisma
enum RowKind {
  EXERCISE
  REST
  FOOTNOTE
  STANDALONE_LOAD
  STANDALONE_URL
  PLACEHOLDER
  INNER_LADDER_MARKER
  REP_DEFINITION
  REST_SLOT
}

model SchemaRow {
  id          String    @id @default(cuid())
  schemaId    String
  order       Int
  rowKind     RowKind
  rowPayload  Json
  load        Json?
  reps        Json?
  side        Json?
  tempo       Json?
  position    Position?
  sequence    Json?
  intensity   Json?
  media       Json?
  compoundRep Json?
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  schema                     Schema                      @relation(fields: [schemaId], references: [id], onDelete: Cascade)
  performedExerciseInstances PerformedExerciseInstance[]

  @@index([schemaId, order])
  @@map("training_schema_rows")
}
```

**Important shape notes**:

- `rowPayload Json` — non-null (required); marshalling via direct `toInputJson(data.rowPayload)`, NO `Prisma.JsonNull` ternary.
- 8 flat scalars `Json?` (load/reps/side/tempo/sequence/intensity/media/compoundRep) — nullable; marshalling via `data.X === undefined || data.X === null ? Prisma.JsonNull : toInputJson(data.X)` (inline pattern mirror 8.1a's `intensity`/`trailingConnector`).
- `position Position?` — direct Prisma enum, no Json. Mapper passes through; create/update pass through.
- `notes String?` — direct nullable string.
- `@@index([schemaId, order])` — non-unique today; Step 8.3.6 adds `@@unique([schemaId, order])` (full unique, no partial — rows always scoped to single schemaId).
- Cascade on Schema delete (handled at Prisma level).
- `performedExerciseInstances` back-relation defaults to RESTRICT on delete (P2003 surfaces via handlePrismaError; QA-F2 carry-forward for improved messaging).

### § 0.3 — `packages/api-server/src/authz/guards.ts` — reference shapes

**`verifySchemaOwnership`** (Step 8.1a — 8-field return shape):

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

**`verifySchemaRowOwnership` target shape** (Step 8.1b — 9-field return):

```ts
export const verifySchemaRowOwnership = async (
  schemaRowId: string,
  userId: string,
): Promise<{
  status: TrainingPlanStatus;
  schemaId: string;
  schemaKind: SchemaKind;
  parentSchemaId: string | null;
  blockId: string;
  sessionId: string;
  dayId: string;
  weekId: string;
  planId: string;
}>;
```

Chain: `prisma.schemaRow.findUnique({ select: { schemaId, schema: { select: { kind, parentSchemaId, blockId, block: { select: { sessionId, session: { ... } } } } } } })`. Two-branch coach-vs-head-coach access mirror 8.1a precedent.

### § 0.4 — `packages/api-server/src/endpoints/lms/schema/admin.ts` — Step 8.1a precedent (full file at path)

Already shipped; key patterns to mirror:

1. **Method signature with discriminated scope** (Schema 8.1a):

   ```ts
   create: async (userId: string, planId: string, scope: CreateScope, data: SchemaBodyData): Promise<Schema>
   ```

   8.1b — **single-scope** (no discriminated scope; SchemaRow has only `schemaId`):

   ```ts
   create: async (userId: string, planId: string, data: CreateSchemaRowData): Promise<SchemaRow>
   ```

2. **planCheck within tx** (Schema 8.1a lines 53-64):

   ```ts
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
   ```

   Mirror verbatim in 8.1b `create` tx.

3. **Parent fetch in tx** (Schema 8.1a lines 85-107 — for sub-schema parent):
   8.1b — single-branch parent (schema) fetch with `kind` selection:

   ```ts
   const parent = await tx.schema.findUnique({
     where: { id: data.schemaId },
     select: {
       id: true,
       kind: true,
       block: {
         select: {
           session: { select: { day: { select: { week: { select: { planId: true } } } } } },
         },
       },
     },
   });
   if (!parent || parent.block.session.day.week.planId !== planId) {
     throw new NotFoundError("Schema not found", { schemaId: data.schemaId, planId });
   }
   ```

4. **STRUCTURAL_UPDATE_KEYS filter** (Schema 8.1a lines 26 + 167-174):

   ```ts
   const STRUCTURAL_UPDATE_KEYS = ["rowKind", "schemaId"] as const;
   const mutatedStructural = STRUCTURAL_UPDATE_KEYS.filter((k) => data[k] !== undefined);
   if (mutatedStructural.length > 0) {
     throw new BadRequestError(
       "SchemaRow structural fields are immutable; delete + recreate to change",
       { fields: mutatedStructural },
     );
   }
   ```

5. **Within-variant cross-validation on update** (Schema 8.1a's archetypeParams check at lines 176-195):
   8.1b — if `data.rowPayload !== undefined`, re-fetch current `rowKind` and check `data.rowPayload.rowKind === current.rowKind`. Mismatch → BadRequestError.

6. **2-pass reorder** (Schema 8.1a lines 290-297):

   ```ts
   const updated = await prisma.$transaction([
     ...data.orderedIds.map((id, i) =>
       prisma.schemaRow.update({ where: { id }, data: { order: -(i + 1) } }),
     ),
     ...data.orderedIds.map((id, i) =>
       prisma.schemaRow.update({ where: { id }, data: { order: (i + 1) * 10 } }),
     ),
   ]);
   return updated.slice(data.orderedIds.length).map(mapToSchemaRow);
   ```

7. **`retryOnP2034`** wraps `create` only (Schema 8.1a line 50). update/delete/reorder unwrapped.

### § 0.5 — `packages/api-server/src/endpoints/lms/schema/assertions.ts` — Step 8.1a precedent

Pattern to extend in 8.1b's `endpoints/lms/schema-row/assertions.ts`:

```ts
import { type SchemaKind } from "@repo/contracts/lms/schema";
import { BadRequestError } from "@repo/errors";

const SCHEMA_KINDS_ALLOWING_ROWS = ["ATOMIC", "HEADERLESS", "NAMED", "COMPOSITE"] as const;

export const assertParentKindForRow = (parentKind: SchemaKind): void => {
  const allowed: readonly string[] = SCHEMA_KINDS_ALLOWING_ROWS;
  if (!allowed.includes(parentKind)) {
    throw new BadRequestError(
      "SchemaRow cannot be added to NESTED schema body — add a sub-schema instead",
      { parentKind, allowed: SCHEMA_KINDS_ALLOWING_ROWS },
    );
  }
};

export const assertRowKindPayloadAlignment = (
  flatRowKind: RowKind,
  payloadRowKind: RowKind,
): void => {
  if (flatRowKind !== payloadRowKind) {
    throw new BadRequestError("rowPayload.rowKind must match flat rowKind", {
      flatRowKind,
      payloadRowKind,
    });
  }
};
```

**`TxClient` import** post-hoist (per Dev-OQ-9): import from `endpoints/lms/_shared/tx-client.ts` instead of local re-declaration. If `assertions.ts` needs `tx`-scoped helpers in 8.1b (unlikely — parent-kind check is sync; alignment is sync), `TxClient` not needed in this file at all. Schema 8.1a's `assertArchetypeConsistency` was tx-bound; SchemaRow assertions are pure-sync.

### § 0.6 — `packages/api-server/src/mappers/lms/schema.mapper.ts` — Step 8.1a precedent

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

**`mapToSchemaRow` target shape** (Step 8.1b):

```ts
import { type SchemaRow as PrismaSchemaRow } from "@prisma/client";

import {
  compoundRepDefinitionSchema,
  intensitySchema,
  loadSchema,
  mediaReferenceSchema,
  perLimbDistributionSchema,
  repNotationSchema,
  sequenceIndicatorSchema,
  tempoModifierSchema,
} from "@repo/contracts/lms/_shared";
import { type SchemaRow, schemaRowPayloadSchema } from "@repo/contracts/lms/schema-row";

export const mapToSchemaRow = (r: PrismaSchemaRow): SchemaRow => ({
  id: r.id,
  schemaId: r.schemaId,
  order: r.order,
  rowKind: r.rowKind,
  rowPayload: schemaRowPayloadSchema.parse(r.rowPayload),
  load: r.load === null ? null : loadSchema.parse(r.load),
  reps: r.reps === null ? null : repNotationSchema.parse(r.reps),
  side: r.side === null ? null : perLimbDistributionSchema.parse(r.side),
  tempo: r.tempo === null ? null : tempoModifierSchema.parse(r.tempo),
  position: r.position,
  sequence: r.sequence === null ? null : sequenceIndicatorSchema.parse(r.sequence),
  intensity: r.intensity === null ? null : intensitySchema.parse(r.intensity),
  media: r.media === null ? null : mediaReferenceSchema.parse(r.media),
  compoundRep: r.compoundRep === null ? null : compoundRepDefinitionSchema.parse(r.compoundRep),
  notes: r.notes,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});
```

10 `.parse(...)` calls total (1 discriminated payload + 8 nullable VOs + 0 for position direct enum + 0 for notes direct string). Zero `as` casts.

### § 0.7 — `packages/api-server/src/utils/`

Available helpers:

```ts
// utils/index.ts — verbatim
export * from "./date-helpers";
export * from "./find-or-throw";
export * from "./json-record";
export * from "./not-implemented";
export * from "./prisma-error-handler";
export * from "./retry-on-p2034";
export * from "./to-input-json";
```

Used in 8.1b: `retryOnP2034` (wraps `create` Serializable tx), `toInputJson` (Json column marshalling), `handlePrismaError` (catch + transform Prisma errors into typed errors).

### § 0.8 — `packages/api-server/src/endpoints/lms/schema/admin.test.ts` — Step 8.1a precedent

Provisioning helper pattern (lines 44-85):

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
      /* reverse-order delete cascade */
    },
  };
};
```

**8.1b will need `provisionSchema`** — extension that also creates a parent Schema of specified `kind` (ATOMIC default) on top of the Block:

```ts
const provisionSchema = async (
  options: {
    planId?: string;
    kind?: SchemaKind;
    archetypeId?: string;
    archetypeParams?: ArchetypeParams;
  } = {},
) => {
  const blockCtx = await provisionBlock({ planId: options.planId });
  const kind = options.kind ?? "ATOMIC";
  const archetypeId = options.archetypeId ?? atomicArchetypeId;
  const archetypeParams = options.archetypeParams ?? ATOMIC_PARAMS;
  const schema = await cleanupRaw.schema.create({
    data: {
      blockId: blockCtx.block.id,
      parentSchemaId: null,
      order: 10,
      kind,
      archetypeId,
      archetypeParams,
    },
  });
  return {
    ...blockCtx,
    schema,
    cleanup: async () => {
      await cleanupRaw.schemaRow.deleteMany({ where: { schemaId: schema.id } }).catch(() => {});
      await cleanupRaw.schema.delete({ where: { id: schema.id } }).catch(() => {});
      await blockCtx.cleanup();
    },
  };
};
```

afterAll cleanup pattern (lines 140-194 — full chain through schemaPairing → schemaRow → schema → block → session → day → week → trainingPlan → coachProfile → user).

### § 0.9 — `packages/api-server/src/authz/guards.test.ts` — append pattern

`verifySchemaRowOwnership` tests added to existing `guards.test.ts` (single file for all guards). 4 cases mirror 8.1a `verifySchemaOwnership` cases:

1. coach owns plan → returns full 9-field shape.
2. head-coach (admin-or-head-coach role) → returns full 9-field shape.
3. another coach → throws `ForbiddenError`.
4. non-existent / deleted plan → throws `NotFoundError`.

### § 0.10 — `.husky/pre-commit` + `.husky/pre-push` + `turbo.json` (per [[husky-cross-package-squash]])

**`.husky/pre-commit`**:

```
node scripts/check-secrets.mjs
npx lint-staged
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"
pnpm dep:check
```

**`.husky/pre-push`**:

```
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"
```

**`turbo.json` tasks**: `check-types` + `lint` both `dependsOn: ["^check-types"]` / `["^lint"]` (upstream packages must check first). `test: cache: false`.

**Cross-package fan-out analysis for 8.1b**:

- contracts (no change) → no fan-out to api-server / api-routes / query / apps.
- api-server (changes) → upstream `^check-types` applies to its imports (`@repo/contracts`, `@repo/errors`, `@prisma/client`), but those are unchanged — no fan-out break.
- No package-level upstream consumers of api-server's internal exports in this slice (HTTP routes import `lmsSchemaRowApi` will land Step 8.2; not 8.1b scope).

**Conclusion**: per-layer atomic commits OK; no squash trigger fires. Commit strategy in § 7.

### § 0.11 — `packages/contracts/package.json` exports map (per [[planner-verbatim-registration]] extended axis post-Step 8.1a D-4)

Relevant entries (verified verbatim 2026-05-19):

```json
{
  "./lms/_shared": "./src/entities/lms/_shared/index.ts",
  "./lms/schema": "./src/entities/lms/schema/index.ts",
  "./lms/schema-row": "./src/entities/lms/schema-row/index.ts"
}
```

**Status**: Step 8.1a D-4 prereq commit (`3545ab52`) added all 4 missing entry-barrel entries (`archetype`, `schema`, `schema-pairing`, `schema-row`). Subpath import `from "@repo/contracts/lms/schema-row"` in 8.1b works without prereq. No exports-map edit needed in 8.1b.

### § 0.12 — Barrel update targets

**`packages/api-server/src/endpoints/lms/index.ts`** — currently:

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

**Add** in 8.1b:

```ts
export * from "./schema-row";
```

**`packages/api-server/src/mappers/lms/index.ts`** — currently:

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

**Add** in 8.1b:

```ts
export * from "./schema-row.mapper";
```

**`packages/api-server/src/endpoints/lms/schema-row/index.ts`** — NEW (mirror existing 1-line schema/index.ts):

```ts
export * from "./admin";
```

### § 0.13 — `endpoints/lms/_shared/` — TxClient hoist target

**Currently**:

```
endpoints/lms/_shared/
├── date.ts
├── date.test.ts
├── day-of-week.ts
└── index.ts  → export * from "./date"; export * from "./day-of-week";
```

**8.1b adds** `tx-client.ts`:

```ts
import { type prisma } from "../../../db/client";

export type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
```

**Barrel update**:

```ts
export * from "./date";
export * from "./day-of-week";
export * from "./tx-client";
```

**Existing TxClient duplicate sites to migrate**:

- `packages/api-server/src/endpoints/lms/block/admin.ts:29-33` — replace local `type TxClient = Omit<...>` with `import { type TxClient } from "../_shared";`.
- `packages/api-server/src/endpoints/lms/schema/assertions.ts:6-9` — same migration.

After migration: 0 local-alias sites for `TxClient`; canonical source in `_shared/tx-client.ts`.

### § 0.14 — Analysis citations (per [[coach-pov-first]])

**`analysis/artifacts/05-synthesis/domain-model.md` §1.4 — Schema body union**:

> body — union: ordered SchemaRow[] (для atomic / headerless / named / composite) **или** ordered SubSchema[] (для nested).
>
> Invariants:
>
> - `kind === 'nested'` ↔ body содержит SubSchema[], не SchemaRow[]. Mutually exclusive.

**Decision**: server-side enforcement in 8.1b `create` — `assertParentKindForRow(parent.kind)` rejects when `parent.kind === "NESTED"`. Coach-facing message surfaces real reason ("SchemaRow cannot be added to NESTED schema body — add a sub-schema instead"). Coach UX in Step 8.4 — "Add row" button hidden for NESTED schemas (only "Add sub-schema").

**`analysis/artifacts/05-synthesis/domain-model.md` §1.6 — 9-variant discriminated rows**:

> SchemaRow discriminator count post-D12: 9 row kinds (was 10).
> §1.6.1 ExerciseRow, §1.6.2 InlineRestRow, §1.6.3 FootnoteRow, §1.6.4 StandaloneLoadRow, §1.6.5 StandaloneUrlRow, §1.6.6 PlaceholderRow, §1.6.7 InnerLadderMarkerRow, §1.6.8 RepDefinitionRow.
>
> §1.6.9 ~~ConnectorRow~~ — dropped per D12, 2026-05-18.

**REST_SLOT note** (in Prisma + contract but NOT in domain-model §1.6 narrative): treated as servicing variant for `archetype-emom-sub-minute-slot` and similar slot-grid archetypes; coach does not pick it manually from row-kind dropdown. UI in Step 8.4 — system materializes REST_SLOT rows as default-empty slots when EMOM archetype-form ratifies slot grid. **8.1b API generic** — accepts all 9 kinds without REST_SLOT-specific invariant; UX restriction enforced at Step 8.4 form layer.

---

## § 1 — Goal

### Coach view

После Step 8.1b в продукте для тренера ничего визуально не меняется — `/coach/plans/<planId>` остаётся без новых экранов. Это backend-плита под Schema editor (Step 8.4). После ship'а 8.1b API позволяет создать / обновить / удалить / переупорядочить строки внутри schema-блока тренировки для всех 9 типов строк (упражнение / отдых / sноска / standalone-load / standalone-url / placeholder / inner-ladder-marker / rep-definition / rest-slot). Step 8.2 откроет HTTP endpoints, Step 8.3 — клиентские хуки, Step 8.4 — сам Schema editor где тренер будет это видеть.

### Developer view

Second api-server slice для Schema vertical. Mirror Step 8.1a precedent (`packages/api-server/src/endpoints/lms/schema/`) with three structural differences:

1. **Single-scope create** (`schemaId` only — no discriminated `{blockId} | {parentSchemaId}` branch).
2. **9-variant `rowPayload` discriminated parse** в mapper (vs 8.1a's single `archetypeParams` variant).
3. **8 flat nullable `Json?` columns** marshalling (vs 8.1a's 2).

Deliverables: `TxClient` hoist prereq → `verifySchemaRowOwnership` guard + 4 tests → `mapToSchemaRow` mapper + add к barrel → `lmsSchemaRowApi.{create, update, delete, reorder}` + `assertions.ts` + 30+ integration tests + add к barrel → Stage 7 must-test gap-fills.

---

## § 2 — Scope / Inputs

### Files created (NEW)

1. `packages/api-server/src/endpoints/lms/_shared/tx-client.ts` — hoisted `TxClient` typed-Omit.
2. `packages/api-server/src/endpoints/lms/schema-row/admin.ts` — `lmsSchemaRowApi.{create, update, delete, reorder}`.
3. `packages/api-server/src/endpoints/lms/schema-row/admin.test.ts` — integration tests (~30 cases).
4. `packages/api-server/src/endpoints/lms/schema-row/assertions.ts` — `assertParentKindForRow` + `assertRowKindPayloadAlignment`.
5. `packages/api-server/src/endpoints/lms/schema-row/index.ts` — barrel (`export * from "./admin";`).
6. `packages/api-server/src/mappers/lms/schema-row.mapper.ts` — `mapToSchemaRow`.

### Files modified

1. `packages/api-server/src/authz/guards.ts` — append `verifySchemaRowOwnership`.
2. `packages/api-server/src/authz/guards.test.ts` — append 4 tests.
3. `packages/api-server/src/endpoints/lms/_shared/index.ts` — add `export * from "./tx-client";`.
4. `packages/api-server/src/endpoints/lms/block/admin.ts` — replace local `TxClient` alias with import.
5. `packages/api-server/src/endpoints/lms/schema/assertions.ts` — replace local `TxClient` alias with import.
6. `packages/api-server/src/endpoints/lms/index.ts` — add `export * from "./schema-row";`.
7. `packages/api-server/src/mappers/lms/index.ts` — add `export * from "./schema-row.mapper";`.

### Files NOT touched (out of scope)

- `packages/contracts/**` — no contract change (cross-validation done server-side; `.superRefine` contract refinement deferred per Dev-OQ-11 hypothesis (a)).
- `packages/api-server/prisma/schema.prisma` — no schema change (`@@unique([schemaId, order])` lands Step 8.3.6).
- HTTP routes / client hooks / UI — Step 8.2 / 8.3 / 8.4.

---

## § 3 — Phases

### § 3.0 — Phase 0: `TxClient` hoist prereq

**Goal**: lift duplicated `type TxClient = Omit<typeof prisma, ...>` to canonical `endpoints/lms/_shared/tx-client.ts`. Close QA-I1 carry-forward. Sets up clean import path for 8.1b's new `schema-row/admin.ts` (and prevents 5th duplicate site).

**Operations**:

1. **Create** `packages/api-server/src/endpoints/lms/_shared/tx-client.ts`:

   ```ts
   import { type prisma } from "../../../db/client";

   export type TxClient = Omit<
     typeof prisma,
     "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
   >;
   ```

2. **Update** `packages/api-server/src/endpoints/lms/_shared/index.ts`:

   ```ts
   export * from "./date";
   export * from "./day-of-week";
   export * from "./tx-client";
   ```

3. **Migrate** `packages/api-server/src/endpoints/lms/block/admin.ts`:

   - Remove lines 29-33 (local `type TxClient = Omit<...>`).
   - Add to import block: `import { type TxClient } from "../_shared";`.

4. **Migrate** `packages/api-server/src/endpoints/lms/schema/assertions.ts`:
   - Remove lines 6-9 (local `type TxClient = Omit<...>` + the unused `type { prisma } from "../../../db/client"` import).
   - Replace with: `import { type TxClient } from "../_shared";`.

**Commit**: `refactor(api-server): hoist txclient typed-omit to endpoints/lms/_shared` (single atomic commit; no `--no-verify`; pre-commit `turbo check-types --filter="...[HEAD]"` runs on api-server only — single package, no fan-out break).

**Verification**:

```bash
grep -rn "type TxClient = Omit" packages/api-server/src/ | grep -v _shared/tx-client.ts | wc -l
# Expected: 0 (only the canonical _shared definition remains)
```

### § 3.1 — Phase 1: `verifySchemaRowOwnership` guard + tests

**Goal**: append guard к `authz/guards.ts` with 9-field return shape; add 4 tests к `guards.test.ts`.

**Operations**:

1. **Append** `verifySchemaRowOwnership` к `packages/api-server/src/authz/guards.ts` (after `verifySchemaOwnership`):

   ```ts
   export const verifySchemaRowOwnership = async (
     schemaRowId: string,
     userId: string,
   ): Promise<{
     status: TrainingPlanStatus;
     schemaId: string;
     schemaKind: SchemaKind;
     parentSchemaId: string | null;
     blockId: string;
     sessionId: string;
     dayId: string;
     weekId: string;
     planId: string;
   }> => {
     const row = await prisma.schemaRow.findUnique({
       where: { id: schemaRowId },
       select: {
         schemaId: true,
         schema: {
           select: {
             kind: true,
             parentSchemaId: true,
             blockId: true,
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
         },
       },
     });

     if (!row || row.schema.block.session.day.week.plan.deletedAt !== null) {
       throw new NotFoundError("SchemaRow not found", { schemaRowId });
     }

     const plan = row.schema.block.session.day.week.plan;

     const buildResponse = () => ({
       status: TRAINING_PLAN_STATUS_MAP[plan.status],
       schemaId: row.schemaId,
       schemaKind: row.schema.kind,
       parentSchemaId: row.schema.parentSchemaId,
       blockId: row.schema.blockId,
       sessionId: row.schema.block.sessionId,
       dayId: row.schema.block.session.dayId,
       weekId: row.schema.block.session.day.weekId,
       planId: row.schema.block.session.day.week.planId,
     });

     if (plan.creatorId === userId) {
       return buildResponse();
     }

     const user = await prisma.user.findUnique({
       where: { id: userId },
       select: { role: true },
     });

     if (user && isAdminOrHeadCoach(ROLE_MAP[user.role])) {
       return buildResponse();
     }

     throw new ForbiddenError("SchemaRow does not belong to this coach");
   };
   ```

   **Note**: introduce `buildResponse` local helper to dedupe the 9-field literal — `verifySchemaOwnership` uses inline duplication, but 9 fields × 2 branches = 18 lines vs 11 lines with helper. Mirror this small optimization here only (do NOT retroactively refactor `verifySchemaOwnership` — out of zone per [[inline-fix-pre-existing]] 5-line threshold for cross-touch refactors).

2. **Append** 4 tests к `packages/api-server/src/authz/guards.test.ts` (in existing `describe("platform guards", ...)` block):

   - "verifySchemaRowOwnership: coach owns plan returns full shape"
   - "verifySchemaRowOwnership: head-coach role returns full shape"
   - "verifySchemaRowOwnership: another coach throws ForbiddenError"
   - "verifySchemaRowOwnership: deleted plan throws NotFoundError"

   Each test provisions: block → schema (ATOMIC, n-rounds) → schemaRow (REST_SLOT — minimal payload) via `cleanupRaw.*`; calls guard; asserts shape / throw.

**Commit**: `feat(api-server): add verifyschemarowownership guard for schema row ownership chain`.

**Verification**:

```bash
pnpm --filter @repo/api-server test -- guards.test.ts
# Expected: 4 new tests pass + existing tests still pass (likely ~25 total guards tests after).
```

### § 3.2 — Phase 2: `mapToSchemaRow` mapper + barrel

**Goal**: create mapper with 10 `.parse(...)` calls (1 discriminated payload + 8 nullable VOs + 1 direct position enum) + zero `as` casts; add к `mappers/lms/index.ts` barrel.

**Operations**:

1. **Create** `packages/api-server/src/mappers/lms/schema-row.mapper.ts`:

   ```ts
   import { type SchemaRow as PrismaSchemaRow } from "@prisma/client";

   import {
     compoundRepDefinitionSchema,
     intensitySchema,
     loadSchema,
     mediaReferenceSchema,
     perLimbDistributionSchema,
     repNotationSchema,
     sequenceIndicatorSchema,
     tempoModifierSchema,
   } from "@repo/contracts/lms/_shared";
   import { type SchemaRow, schemaRowPayloadSchema } from "@repo/contracts/lms/schema-row";

   export const mapToSchemaRow = (r: PrismaSchemaRow): SchemaRow => ({
     id: r.id,
     schemaId: r.schemaId,
     order: r.order,
     rowKind: r.rowKind,
     rowPayload: schemaRowPayloadSchema.parse(r.rowPayload),
     load: r.load === null ? null : loadSchema.parse(r.load),
     reps: r.reps === null ? null : repNotationSchema.parse(r.reps),
     side: r.side === null ? null : perLimbDistributionSchema.parse(r.side),
     tempo: r.tempo === null ? null : tempoModifierSchema.parse(r.tempo),
     position: r.position,
     sequence: r.sequence === null ? null : sequenceIndicatorSchema.parse(r.sequence),
     intensity: r.intensity === null ? null : intensitySchema.parse(r.intensity),
     media: r.media === null ? null : mediaReferenceSchema.parse(r.media),
     compoundRep: r.compoundRep === null ? null : compoundRepDefinitionSchema.parse(r.compoundRep),
     notes: r.notes,
     createdAt: r.createdAt,
     updatedAt: r.updatedAt,
   });
   ```

2. **Update** `packages/api-server/src/mappers/lms/index.ts`:
   ```ts
   // add line:
   export * from "./schema-row.mapper";
   ```

**Commit**: `feat(api-server): add lms schemarow mapper with 9-variant payload parse + 8 nullable vo parses`.

**Verification**:

```bash
pnpm --filter @repo/api-server check-types
# Expected: 0 errors (proves Zod discriminated union narrows correctly + 8 nullable parses return correct VO types).
```

### § 3.3 — Phase 3: `lmsSchemaRowApi` + `assertions.ts` + tests + barrel

**Goal**: ship full CRUD slice + 30+ integration tests.

**Operations**:

1. **Create** `packages/api-server/src/endpoints/lms/schema-row/assertions.ts`:

   ```ts
   import { type SchemaKind } from "@repo/contracts/lms/schema";
   import { type RowKind } from "@repo/contracts/lms/schema-row";
   import { BadRequestError } from "@repo/errors";

   const SCHEMA_KINDS_ALLOWING_ROWS = ["ATOMIC", "HEADERLESS", "NAMED", "COMPOSITE"] as const;

   export const assertParentKindForRow = (parentKind: SchemaKind): void => {
     const allowed: readonly string[] = SCHEMA_KINDS_ALLOWING_ROWS;
     if (!allowed.includes(parentKind)) {
       throw new BadRequestError(
         "SchemaRow cannot be added to NESTED schema body — add a sub-schema instead",
         { parentKind, allowed: SCHEMA_KINDS_ALLOWING_ROWS },
       );
     }
   };

   export const assertRowKindPayloadAlignment = (
     flatRowKind: RowKind,
     payloadRowKind: RowKind,
   ): void => {
     if (flatRowKind !== payloadRowKind) {
       throw new BadRequestError("rowPayload.rowKind must match flat rowKind", {
         flatRowKind,
         payloadRowKind,
       });
     }
   };
   ```

2. **Create** `packages/api-server/src/endpoints/lms/schema-row/admin.ts`:

   Skeleton (full ~270-290 LOC):

   ```ts
   import { Prisma } from "@prisma/client";

   import {
     type CreateSchemaRowData,
     type ReorderSchemaRowsData,
     type SchemaRow,
     type UpdateSchemaRowData,
   } from "@repo/contracts/lms/schema-row";
   import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

   import {
     verifyPlanEditable,
     verifySchemaOwnership,
     verifySchemaRowOwnership,
   } from "../../../authz/guards";
   import { prisma } from "../../../db/client";
   import { mapToSchemaRow } from "../../../mappers/lms";
   import { handlePrismaError, retryOnP2034, toInputJson } from "../../../utils";

   import { assertParentKindForRow, assertRowKindPayloadAlignment } from "./assertions";

   const STRUCTURAL_UPDATE_KEYS = ["rowKind", "schemaId"] as const;

   const FLAT_JSON_FIELDS = [
     "load",
     "reps",
     "side",
     "tempo",
     "sequence",
     "intensity",
     "media",
     "compoundRep",
   ] as const;

   type FlatJsonField = (typeof FLAT_JSON_FIELDS)[number];

   const marshalNullableJson = (value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
     if (value === undefined || value === null) {
       return Prisma.JsonNull;
     }
     return toInputJson(value);
   };

   export const lmsSchemaRowApi = {
     create: async (
       userId: string,
       planId: string,
       data: CreateSchemaRowData,
     ): Promise<SchemaRow> => {
       const owner = await verifySchemaOwnership(data.schemaId, userId);

       if (owner.planId !== planId) {
         throw new NotFoundError("Schema not found in plan", { planId, schemaId: data.schemaId });
       }

       verifyPlanEditable(owner);

       assertRowKindPayloadAlignment(data.rowKind, data.rowPayload.rowKind);
       assertParentKindForRow(owner.kind);

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

               const parent = await tx.schema.findUnique({
                 where: { id: data.schemaId },
                 select: {
                   id: true,
                   kind: true,
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
                   schemaId: data.schemaId,
                   planId,
                 });
               }
               assertParentKindForRow(parent.kind);

               const max = await tx.schemaRow.aggregate({
                 where: { schemaId: data.schemaId },
                 _max: { order: true },
               });
               const nextOrder = (max._max.order ?? 0) + 10;

               return tx.schemaRow.create({
                 data: {
                   schemaId: data.schemaId,
                   order: nextOrder,
                   rowKind: data.rowKind,
                   rowPayload: toInputJson(data.rowPayload),
                   load: marshalNullableJson(data.load),
                   reps: marshalNullableJson(data.reps),
                   side: marshalNullableJson(data.side),
                   tempo: marshalNullableJson(data.tempo),
                   position: data.position ?? null,
                   sequence: marshalNullableJson(data.sequence),
                   intensity: marshalNullableJson(data.intensity),
                   media: marshalNullableJson(data.media),
                   compoundRep: marshalNullableJson(data.compoundRep),
                   notes: data.notes ?? null,
                 },
               });
             },
             { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
           ),
         );

         return mapToSchemaRow(created);
       } catch (error) {
         return handlePrismaError(error, { entity: "SchemaRow" });
       }
     },

     update: async (
       userId: string,
       schemaRowId: string,
       data: UpdateSchemaRowData,
     ): Promise<SchemaRow> => {
       const owner = await verifySchemaRowOwnership(schemaRowId, userId);
       verifyPlanEditable(owner);

       const mutatedStructural = STRUCTURAL_UPDATE_KEYS.filter((k) => data[k] !== undefined);
       if (mutatedStructural.length > 0) {
         throw new BadRequestError(
           "SchemaRow structural fields are immutable; delete + recreate to change",
           { fields: mutatedStructural },
         );
       }

       if (data.rowPayload !== undefined) {
         const current = await prisma.schemaRow.findUnique({
           where: { id: schemaRowId },
           select: { rowKind: true },
         });
         if (!current) {
           throw new NotFoundError("SchemaRow not found", { schemaRowId });
         }
         assertRowKindPayloadAlignment(current.rowKind, data.rowPayload.rowKind);
       }

       try {
         const updated = await prisma.schemaRow.update({
           where: { id: schemaRowId },
           data: {
             ...(data.rowPayload !== undefined && { rowPayload: toInputJson(data.rowPayload) }),
             ...(data.load !== undefined && { load: marshalNullableJson(data.load) }),
             ...(data.reps !== undefined && { reps: marshalNullableJson(data.reps) }),
             ...(data.side !== undefined && { side: marshalNullableJson(data.side) }),
             ...(data.tempo !== undefined && { tempo: marshalNullableJson(data.tempo) }),
             ...(data.position !== undefined && { position: data.position }),
             ...(data.sequence !== undefined && { sequence: marshalNullableJson(data.sequence) }),
             ...(data.intensity !== undefined && {
               intensity: marshalNullableJson(data.intensity),
             }),
             ...(data.media !== undefined && { media: marshalNullableJson(data.media) }),
             ...(data.compoundRep !== undefined && {
               compoundRep: marshalNullableJson(data.compoundRep),
             }),
             ...(data.notes !== undefined && { notes: data.notes }),
           },
         });
         return mapToSchemaRow(updated);
       } catch (error) {
         return handlePrismaError(error, { entity: "SchemaRow" });
       }
     },

     delete: async (userId: string, schemaRowId: string): Promise<void> => {
       const owner = await verifySchemaRowOwnership(schemaRowId, userId);
       verifyPlanEditable(owner);

       try {
         await prisma.schemaRow.delete({ where: { id: schemaRowId } });
       } catch (error) {
         return handlePrismaError(error, { entity: "SchemaRow" });
       }
     },

     reorder: async (
       userId: string,
       planId: string,
       schemaId: string,
       data: ReorderSchemaRowsData,
     ): Promise<SchemaRow[]> => {
       const owner = await verifySchemaOwnership(schemaId, userId);
       if (owner.planId !== planId) {
         throw new NotFoundError("Schema not found in plan", { planId, schemaId });
       }
       verifyPlanEditable(owner);

       const rows = await prisma.schemaRow.findMany({
         where: { id: { in: [...data.orderedIds] } },
         select: { id: true, schemaId: true },
       });

       if (rows.length !== data.orderedIds.length) {
         throw new BadRequestError("Some orderedIds reference non-existent rows", {
           missing: data.orderedIds.filter((id) => !rows.some((r) => r.id === id)),
         });
       }

       const foreignIds = rows.filter((r) => r.schemaId !== schemaId);
       if (foreignIds.length > 0) {
         throw new BadRequestError("Some orderedIds do not belong to the target schema", {
           foreignIds: foreignIds.map((r) => r.id),
         });
       }

       const scopeCount = await prisma.schemaRow.count({ where: { schemaId } });
       if (data.orderedIds.length !== scopeCount) {
         throw new BadRequestError("orderedIds must include every row in the target schema", {
           provided: data.orderedIds.length,
           expected: scopeCount,
         });
       }

       try {
         const updated = await prisma.$transaction([
           ...data.orderedIds.map((id, i) =>
             prisma.schemaRow.update({ where: { id }, data: { order: -(i + 1) } }),
           ),
           ...data.orderedIds.map((id, i) =>
             prisma.schemaRow.update({ where: { id }, data: { order: (i + 1) * 10 } }),
           ),
         ]);
         return updated.slice(data.orderedIds.length).map(mapToSchemaRow);
       } catch (error) {
         return handlePrismaError(error, { entity: "SchemaRow" });
       }
     },
   };
   ```

   **Note 1**: `verifySchemaOwnership` (NOT `verifySchemaRowOwnership`) is called at `create` entry — the schema is the parent; row doesn't exist yet. `assertParentKindForRow(owner.kind)` runs BEFORE tx (cheap sync check on guard-returned kind) AND again inside tx after parent re-fetch (TOCTOU defense). Per [[planner-adversarial-review]] axis "concurrent": owner.kind may differ from in-tx parent.kind if another tx mutates schema kind between guard and tx — Step 8.1a D9 forbids kind mutation on update, so this race is impossible TODAY, but the in-tx check defends regardless.

   **Note 2**: `marshalNullableJson` helper extracted within `admin.ts` (private, not exported) — 11 invocations × ternary = ~33 lines saved vs full inline; well within manifesto 2.4 (3+ repetitions warrants extraction). Local helper, not in `_shared` (not reusable across other slices yet).

   **Note 3**: `position` is enum, not Json — handled by `data.position ?? null` (create) and `data.position !== undefined && { position: data.position }` (update). No `marshalNullableJson` for position.

   **Note 4**: `position` semantically nullable but contract `optional() + nullable()` — same `undefined | null | Position` shape. Create normalizes `undefined → null`; update only writes when explicitly set.

3. **Create** `packages/api-server/src/endpoints/lms/schema-row/index.ts`:

   ```ts
   export * from "./admin";
   ```

4. **Update** `packages/api-server/src/endpoints/lms/index.ts`:

   ```ts
   // add line:
   export * from "./schema-row";
   ```

5. **Create** `packages/api-server/src/endpoints/lms/schema-row/admin.test.ts` — integration tests (~30 cases). See § 6 for breakdown.

**Commit**: `feat(api-server): add lmsschemarowapi with crud and two-pass reorder` (mirror 8.1a `0d7c6943`).

**Verification**:

```bash
pnpm --filter @repo/api-server test -- schema-row/admin.test.ts
# Expected: 30+ cases pass.
pnpm --filter @repo/api-server check-types
# Expected: 0 errors.
pnpm --filter @repo/api-server lint
# Expected: 0 warnings (max-warnings 0).
```

### § 3.4 — Phase 4: Stage 7 hostile-QA must-test gap-fills

**Goal**: per `/feature` Stage 7 QA, surface any must-test gaps revealed by hostile review. Add as separate commit (mirror 8.1a `f8bf917b`).

Likely candidates (pre-emptively anticipated):

- Concurrent two-coach create on same `schemaId` → P2034 retry path coverage.
- Empty `data.rowPayload` ↔ `data.rowKind` mismatch with REST_SLOT (empty payload special case).
- Duplicate orderedIds reorder defense (mirror 8.1a QA-Must-Test-37).
- Update `rowPayload` to mismatched variant → BadRequestError on cross-validate.
- `position` enum-only update (no rowPayload change) — proves enum field independent of payload variant.

**Commit**: `test(api-server): cover qa must-test gaps for lmsschemarowapi`.

---

## § 4 — Acceptance criteria

1. ✅ `packages/api-server/src/endpoints/lms/_shared/tx-client.ts` exports `type TxClient = Omit<typeof prisma, ...>` (5 keys: `$connect`, `$disconnect`, `$on`, `$transaction`, `$use`, `$extends` — verbatim 6-key Omit per Step 8.1a precedent).
2. ✅ `endpoints/lms/_shared/index.ts` re-exports `tx-client`.
3. ✅ `endpoints/lms/block/admin.ts` + `endpoints/lms/schema/assertions.ts` import `TxClient` from `_shared`; no local `type TxClient = Omit` re-declaration.
4. ✅ `grep -rn "type TxClient = Omit" packages/api-server/src/ | grep -v _shared/tx-client.ts` returns 0 lines.
5. ✅ `verifySchemaRowOwnership` appended to `guards.ts` with 9-field return shape `{status, schemaId, schemaKind, parentSchemaId, blockId, sessionId, dayId, weekId, planId}`.
6. ✅ 4 guard tests pass: owner / head-coach / foreign-coach / deleted-plan.
7. ✅ `mapToSchemaRow` mapper has 10 Zod `.parse(...)` calls (1 discriminated payload + 8 nullable VO + 0 `as` casts + 0 unsafe value conversions). `position` direct enum, `notes` direct nullable string.
8. ✅ `mappers/lms/index.ts` re-exports `schema-row.mapper`.
9. ✅ `lmsSchemaRowApi.create` enforces:
   - `verifySchemaOwnership` of parent schema (ownership + plan match).
   - `assertRowKindPayloadAlignment(data.rowKind, data.rowPayload.rowKind)` before tx (saves tx cost on mismatch).
   - `assertParentKindForRow(owner.kind)` before tx + `assertParentKindForRow(parent.kind)` re-check inside tx (TOCTOU defense).
   - `planCheck` via `tx.trainingPlan.findUnique` (deletedAt + ARCHIVED status).
   - Order via `_max(order) + 10` aggregate inside tx.
   - Serializable isolation + `retryOnP2034` wrap.
10. ✅ `lmsSchemaRowApi.update` enforces:
    - `verifySchemaRowOwnership` + `verifyPlanEditable`.
    - `STRUCTURAL_UPDATE_KEYS = ["rowKind", "schemaId"]` filter → BadRequestError on attempt.
    - If `data.rowPayload !== undefined` → re-fetch `current.rowKind` → cross-validate `current.rowKind === data.rowPayload.rowKind`; mismatch → BadRequestError.
    - 11 conditional `data.X !== undefined && { X: ... }` spread merges (rowPayload + 8 flat nullable Json + position + notes).
11. ✅ `lmsSchemaRowApi.delete` is single-statement default-isolation `prisma.schemaRow.delete` after ownership + editable checks.
12. ✅ `lmsSchemaRowApi.reorder` enforces:
    - `verifySchemaOwnership` of parent schema (ownership + plan match).
    - Foreign-id check (`r.schemaId !== schemaId`).
    - Missing-id check (`rows.length !== orderedIds.length`).
    - Scope-count check (`orderedIds.length !== scopeCount`).
    - 2-pass UPDATE `prisma.$transaction([... order = -(i+1)], ... order = (i+1)*10])` (anticipates Step 8.3.6 `@@unique([schemaId, order])`).
13. ✅ `endpoints/lms/schema-row/index.ts` exports `lmsSchemaRowApi`.
14. ✅ `endpoints/lms/index.ts` re-exports `schema-row`.
15. ✅ `admin.test.ts` covers ≥30 cases (see § 6 breakdown). Each test provisions parent schema via `provisionSchema` helper; cleanup reverses schemaRow → schema → block → session → day → week chain.
16. ✅ `pnpm --filter @repo/api-server check-types` — 0 errors.
17. ✅ `pnpm --filter @repo/api-server test` — all api-server tests pass (existing baseline + new 4 guard + 30+ admin = ~660+ total).
18. ✅ `pnpm check-types` (root) — 16/16.
19. ✅ `pnpm lint` (root) — 16/16, 0 warnings.
20. ✅ `pnpm test` (root) — ~1395+ cases (~1361 baseline + 30+ new).
21. ✅ `pnpm dep:check` — 0 violations.
22. ✅ Husky pre-commit + pre-push clean on every commit. Zero `--no-verify` / `--no-edit` / `--no-gpg-sign` usage.
23. ✅ Per-layer atomic commits on `feat/training-domain` (no squash; no cross-package shape change in 8.1b).
24. ✅ `analysis/` directory unchanged (`git diff <start>..HEAD -- analysis/` returns 0 lines).
25. ✅ `admin.ts` raw LOC ≤ 320 (post-extraction with `assertions.ts` sibling + `marshalNullableJson` local helper).

---

## § 5 — Adversarial pass (per [[planner-adversarial-review]])

### Axis 1: Concurrent

- **Two coaches create rows on same schemaId simultaneously** → `_max(order) + 10` race. Serializable isolation + `retryOnP2034` retry retries the losing tx. Final state: both rows persisted with distinct sequential orders.
- **Create concurrent with reorder** → reorder updates orders to -(i+1) staging then (i+1)\*10. Concurrent create reads stale `_max(order)` → final order may collide BUT Step 8.3.6's future `@@unique` will catch. Today (8.1b time): no constraint → eventual orphan order collision (QA-B4 carry-forward unchanged from 8.1a; defer to Step 8.2 HTTP retry).
- **Update + delete race** → delete wins (P2025 "Record not found" on update); handlePrismaError surfaces as NotFoundError.
- **Reorder + delete race** → delete during reorder may produce P2025 inside tx; tx aborts; client retries.

### Axis 2: TOCTOU

- **Parent schema deleted between `verifySchemaOwnership` and `create` tx** → in-tx `tx.schema.findUnique` returns null → `NotFoundError("Parent schema not found")`. Owner.planId stale but unused for write — tx parent fetch is authoritative.
- **Parent.kind mutated between guard and tx** → Step 8.1a D9 forbids `kind` mutation on update, so impossible TODAY. In-tx `assertParentKindForRow(parent.kind)` defends regardless if D9 ever relaxes.
- **Plan deleted between guard and tx** → in-tx `tx.trainingPlan.findUnique({select: deletedAt})` catches.
- **Plan archived between guard and tx** → in-tx status check catches.

### Axis 3: Subset / superset / empty / duplicates

- **Empty orderedIds** → Zod `.min(1)` on contract rejects.
- **Single id reorder** → `_max` returns single row; pass-through.
- **Duplicate ids** → Zod `.refine(new Set(ids).size === ids.length)` rejects (also Stage 7 must-test gap-fill 8.1a precedent).
- **Subset (some ids missing from schema)** → scope-count mismatch → BadRequestError.
- **Superset (all schema ids + extras)** → foreign-id check → BadRequestError.
- **Cross-schema ids** → foreign-id check → BadRequestError.

### Axis 4: Malformed input

- **`rowKind === EXERCISE` + `rowPayload.rowKind === REST`** → `assertRowKindPayloadAlignment` rejects with BadRequestError before tx.
- **`rowPayload.exercise.exerciseId` non-cuid** → Zod parse in `createSchemaRowSchema` rejects at contract level (HTTP boundary in Step 8.2; in 8.1b unit tests this passes through unless test bypasses contract).
- **Update `rowKind`** → STRUCTURAL_UPDATE_KEYS filter rejects.
- **Update `schemaId`** → STRUCTURAL_UPDATE_KEYS filter rejects.
- **Update `rowPayload` with different `rowKind`** → cross-validate rejects.

### Axis 5: Boundary

- **Order overflow** → `_max(order) + 10` after 200M+ inserts hits int32 max (QA-A3 8.1a carry-forward; out of zone).
- **`notes` length** → Zod `.max(SCHEMA_ROW_CONSTANTS.MAX_NOTES_LENGTH)` enforces at contract.
- **Empty REST_SLOT payload** → `schemaRowPayloadSchema.parse({rowKind: "REST_SLOT"})` succeeds (literal-only object); mapper round-trips correctly.

### Axis 6: Intermediate-state mutation invariant (per [[planner-mutation-invariant-trace]])

- **2-pass reorder safety** without `@@unique([schemaId, order])` today: non-strict — could have duplicate orders briefly if concurrent create races (handled by Serializable isolation on create). After Step 8.3.6 lands `@@unique`: 2-pass `-(i+1)` → `(i+1)*10` avoids intermediate-state P2002 (proven Step 7.3.6 D-2).
- **No cross-tx swap risk** today (no `@@unique`); future-proof for Step 8.3.6.

---

## § 6 — Test coverage strategy

### `admin.test.ts` (~30-34 cases)

**Create — happy paths (9 row-kind variants × 1 happy case each = 9)**:

1. create EXERCISE row → returns full SchemaRow with parsed exercise payload.
2. create REST row → returns row with raw + parsed.
3. create FOOTNOTE row → returns row with marker + target + content compound.
4. create STANDALONE_LOAD row → returns row with load + scope.
5. create STANDALONE_URL row → returns row with url + wrapped + appliesTo.
6. create PLACEHOLDER row → returns row with placeholder payload.
7. create INNER_LADDER_MARKER row → returns row with steps array.
8. create REP_DEFINITION row → returns row with equality compound.
9. create REST_SLOT row → returns row with empty payload `{rowKind: "REST_SLOT"}`.

**Create — invariants (5 cases)**: 10. create when parent schema is NESTED → BadRequestError. 11. create with rowKind + rowPayload mismatch → BadRequestError (alignment check). 12. create when caller does not own parent schema's plan → ForbiddenError. 13. create when plan ARCHIVED → ForbiddenError. 14. create when parent schema does not exist → NotFoundError.

**Update — happy + invariants (6 cases)**: 15. update notes only → returns row with new notes; rowPayload + other fields untouched. 16. update rowPayload within same rowKind variant → returns row with new payload (e.g., REST raw text edit). 17. update flat scalars (e.g., `load: null → load: {kind: "absolute", ...}`) → returns row with new load. 18. update rowKind → BadRequestError (STRUCTURAL_UPDATE_KEYS filter). 19. update schemaId → BadRequestError (STRUCTURAL_UPDATE_KEYS filter). 20. update rowPayload to mismatched variant → BadRequestError (cross-validation).

**Delete (2 cases)**: 21. delete owned row → success; row gone. 22. delete when caller does not own → ForbiddenError.

**Reorder (5 cases)**: 23. reorder 3 rows happy path → all 3 returned with new order = `(i+1)*10`. 24. reorder with missing id → BadRequestError. 25. reorder with foreign id (different schema) → BadRequestError. 26. reorder with subset of schema rows → BadRequestError (scope-count mismatch). 27. reorder with duplicate ids → contract `.refine` rejects (Zod-level; tests verify via api parse path).

**Cross-cutting (3-4 must-test gap-fills surfaced Stage 7)**: 28. concurrent create on same schemaId — both succeed under retry. 29. update position enum-only (no rowPayload change) → proves enum field independent of payload variant. 30. delete row that has PerformedExerciseInstance back-relation → P2003 surfaces as NotFoundError-style message (QA-F2 carry-forward acknowledged). 31. (optional) reorder under simulated tx-level conflict → retry path.

Total: **31 expected; ±3 from Stage 7 hostile QA surface** = 28-34 final.

### `guards.test.ts` — 4 new cases (Phase 1)

Append `describe("verifySchemaRowOwnership", ...)` block at end of existing `describe("platform guards", ...)`.

---

## § 7 — Commit strategy (per-layer atomic; no squash trigger)

Per [[husky-cross-package-squash]]: cross-package check NOT triggered (8.1b is api-server slice only; no contract / schema / consumer-cascade shape change). Per-layer atomic commits on `feat/training-domain`.

**Commit 1**: `refactor(api-server): hoist txclient typed-omit to endpoints/lms/_shared`

- 4 files: `_shared/tx-client.ts` (new), `_shared/index.ts` (modified), `block/admin.ts` (migrated), `schema/assertions.ts` (migrated).
- Closes QA-I1 carry-forward.

**Commit 2**: `feat(api-server): add verifyschemarowownership guard for schema row ownership chain`

- 2 files: `authz/guards.ts` (appended), `authz/guards.test.ts` (appended).
- 4 new guard tests.

**Commit 3**: `feat(api-server): add lms schemarow mapper with 9-variant payload parse + 8 nullable vo parses`

- 2 files: `mappers/lms/schema-row.mapper.ts` (new), `mappers/lms/index.ts` (modified barrel).

**Commit 4**: `feat(api-server): add lmsschemarowapi with crud and two-pass reorder`

- 5 files: `endpoints/lms/schema-row/admin.ts` (new), `endpoints/lms/schema-row/assertions.ts` (new), `endpoints/lms/schema-row/admin.test.ts` (new), `endpoints/lms/schema-row/index.ts` (new), `endpoints/lms/index.ts` (modified barrel).
- ~30 integration test cases.

**Commit 5** (if Stage 7 surfaces gaps): `test(api-server): cover qa must-test gaps for lmsschemarowapi`

- 1 file: `endpoints/lms/schema-row/admin.test.ts` (appended).

**Commit 6** (executor at end): `docs(step-08.1b): write executor output report`

- 1 file: `implementation/step-08.1b/output.md` (new).

Commitlint constraints: subject ≤ 100 chars all-lowercase (no caps even for acronyms — `lmsschemarowapi` not `LmsSchemaRowApi`). Body lines ≤ 150 chars. Reference Step 8.1a commit set (`3545ab52..f8bf917b`) for verbatim style match.

---

## § 8 — Out-of-scope / deferred carry-forwards

- **`mapToBlockWithSchemas` mapper** — Step 8.3.5 (rows embedded inside schemas embedded inside Block; read-surface expansion).
- **HTTP routes for `lmsSchemaRowApi`** — Step 8.2.
- **Client hooks for `lmsSchemaRowApi`** — Step 8.3.
- **Schema editor UI (ArchetypePicker + row editor)** — Step 8.4.
- **`@@unique([schemaId, order])`** — Step 8.3.6.
- **`@@unique([blockId, parentSchemaId, order])`-style partial-unique on Schema** — Step 8.3.7 + 8.3.7-pre.
- **Pairings api (`lmsSchemaPairingApi`)** — Step 8.1c.
- **QA-B4 reorder without `retryOnP2034`** — Step 8.2 HTTP retry layer.
- **QA-C2 P2028 tx-timeout mapping** — separate `/fix` ticket.
- **QA-D1 `.max(N)` cap on orderedIds arrays** — Step 8.0b follow-up.
- **QA-E3 guards `userId = undefined` defensive throw** — cross-guard `/fix` ticket.
- **QA-F2 delete-blocked-by-PerformedExerciseInstance better message** — surface in 8.1b if natural; otherwise carry to athlete-side workflow.
- **FIND-001 `resolveStorageContext` extraction** — defer per Dev-OQ-10 (SchemaRow single-scope doesn't trigger same Schema-only complexity).
- **Optional `nullableJson` global helper extraction** — local `marshalNullableJson` in admin.ts only; if 8.1c needs same pattern → hoist к utils.

---

## § 9 — Verifications cheatsheet

After each commit (executor runs locally; husky enforces):

```bash
# Per-commit (husky pre-commit handles automatically):
pnpm --filter @repo/api-server check-types
pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"

# Per-commit (husky pre-push handles automatically before push):
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"

# Manual mid-development:
pnpm --filter @repo/api-server test -- schema-row/admin.test.ts
pnpm --filter @repo/api-server test -- guards.test.ts
pnpm --filter @repo/api-server lint

# Root-level sweep (executor final check before output.md):
pnpm check-types
pnpm lint
pnpm test
pnpm dep:check
```

Expected baseline numbers (per Step 8.1a close-out):

- `pnpm check-types` 16/16, ~30s.
- `pnpm lint` 16/16, 0 warnings, ~10s.
- `pnpm --filter @repo/api-server test` ~625 cases (8.1a baseline) + 4 guards + 30+ admin = ~660+.
- `pnpm test` (root) ~1361 + ~34 = ~1395.
- `pnpm dep:check` 0 violations / 1252+5 = ~1257 modules (5 new: admin.ts + assertions.ts + admin.test.ts + index.ts + schema-row.mapper.ts; plus 1 new tx-client.ts in \_shared).

Pre-existing flake awareness: `block/admin.test.ts:406` timing assertion (QA-023; FIND-002 Step 8.1a) — re-run on CI flake.

---

## § 10 — Output report format (executor produces `output.md`)

Section headers per WORKFLOW.md § "`output.md` format":

```markdown
## Что сделано

[прозой что построено — 1 параграф, English терминология для имён артефактов]

## Изменённые/созданные файлы

[bullet list — path: created | modified, brief description]

## Принятые решения

[D-1, D-2, ... — executor-time inline divergences from prompt с rationale]

## Возникшие вопросы и как решены

[QA-001 ... — escalations through AskUserQuestion + ratify outcome]

## Что отложено

[carry-forwards к state/03-deferred.md + reason]

## Ссылка на `.feature-dev/<ts>/`

[full path к `/feature` Stage artefacts]

## Verification notes

[per Acceptance criteria table — ✅ for each + numbers + timings]

## Acceptance criteria self-check

[# 1-25 of § 4 — checked-off list]
```

UI smoke-test scenario — N/A для 8.1b (api-server slice без HTTP exposure).

---

## § 11 — Wrapper choice + process notes

**Wrapper**: `/feature` (full pipeline). Not `/feature small`. Reasoning:

- api-server slice = multi-layer (guard + mapper + endpoint + tests + barrel updates).
- Cross-cutting refactor (`TxClient` hoist) bundled.
- Test footprint ~30+ cases (larger than 8.1a's 33 due to 9-variant payload coverage).
- Per [[always-via-feature-skill]] thin-additive carve-out does NOT apply (8.1b touches 7+ files across 4 layers; not "thin additive contracts-only single-package").

**Branch**: `feat/training-domain` (long-lived). NO branch cut. Override per [[always-via-feature-skill]] branch-cut → matches `[[training-domain-workflow]]`.

**Per-step cycle**: thesis already ratified (planner-user chat 2026-05-19; 3 coach OQs + 12 developer OQs ratified). Skip Stage 0 thesis re-ratify; jump to Stage 1 Research.

**Calendar**: estimated executor effort 4-6 hours (mirror 8.1a session). 30+ integration tests with provisioning helpers dominate.

**Handoff after close-out**: Step 8.1c thesis cycle (`lmsSchemaPairingApi` — basic CRUD, UI deferred per D11; `/feature small` thin scope). Then Step 8.2 HTTP routes for all of {schema, schema-row, schema-pairing}.

---

**End of prompt.**
