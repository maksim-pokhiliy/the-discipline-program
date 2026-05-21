# Step 8.3.5 — `schemas[]` + `alternatingGroups[]` read-embed in `blockSchema`

**Wrapper**: `/feature small`. Cross-package read-shape widening — `@repo/contracts` (`blockSchema` widened + a new recursive `schemaWithBodySchema`) + `@repo/api-server` (one new mapper, `mapToBlock` widened, two Prisma includes widened). No new endpoint, no new business logic, no UI, no Prisma schema change. The structural twin of Step 7.3.5 (Block embed into the week response), one level deeper. Step 7.3.5 ran `/feature small`; 8.3.5 is the same kind at higher volume (a recursive embed + a sibling `alternatingGroups[]` embed) — calibration holds: read-shape widening → `small`.

**Branch**: `feat/training-domain` long-lived. **NO new branch cut** (per `[[training-domain-workflow]]` + `[[always-via-feature-skill]]` branch-cut override — the `/feature` skill's default `feat/<slug>` cut is overridden; stay on `feat/training-domain`). At prompt-write the branch is at `3193ddd3` (1 commit ahead of `main` `e48c2b33` — the PR #200 merge-housekeeping commit); the prompt commit (`docs(step-08.3.5): …`) makes it 2 — **use that prompt commit as the `git diff` baseline**.

**Predecessor / decomposition**: Steps 8.0b → 8.1a → 8.1b → 8.1c → 8.1d → 8.2 → 8.3 shipped the **write** path for the `Schema` / `SchemaRow` / `AlternatingGroup` slices end-to-end (contracts → api-server endpoints → HTTP routes → client api/hooks). Nothing reads a `Schema` back: `blockSchema` carries no `schemas[]`, and there is no GET route (D-8.2-2). Step 8.3.5 ships the **read surface** — a `schemas[]` embed (plus the sibling `alternatingGroups[]` embed) into `blockSchema`, so the week read path returns each block with its full schema tree. After 8.3.5 the block read surface is complete and the Step 8.4 plan-editor can render schemas inside blocks straight off `useWeek`. Thesis ratified in the planner-user chat 2026-05-21 (two-voice; the user confirmed all three OQs — see § 1.x).

This step ships **no UI** (Step 8.4+) and **no new client hook** — the widened `blockSchema` flows through `GetWeekResponse` → `useWeek` transparently (§ 0.8, D-8.3.5-6). No browser smoke-test (§ 9): there is no runtime UI surface; the embed is verified by contract + api-server tests.

---

## § 0 — Verbatim source reads (read-at-prompt-write-time per `[[planner-verbatim-registration]]` + `[[scope-via-existing-patterns]]`)

All quotes are the **current** state, verified 2026-05-21. Reference material — the deliverable shapes are described structurally in § 3, not as code skeletons (per `[[planner-strategic-level]]`). The executor re-reads precedents during `/feature` Research; § 0 records the planner-verified state and the load-bearing exact-quote files.

### § 0.1 — The canonical precedent: Step 7.3.5 (Block embed into the week response — still in place)

Step 7.3.5 embedded `blocks[]` into the session within the week response. Its output is the **current** state of the files below — 8.3.5 mirrors it **one level deeper** (`schemas[]` into the block). The week read path:

`week/admin.ts` `lmsWeekApi.getByPlanAndDate` → `mapToDaySlot` → `mapToSessionWithLabelAndBlocks` → `mapToBlockWithLabels`.

`packages/api-server/src/mappers/lms/day.mapper.ts` (verbatim — the 7.3.5 helper + its second consumer trace):

```ts
type BlockWithLabelsRelation = PrismaBlock & {
  labelAssignments: (PrismaBlockLabelAssignment & { label: PrismaLabel })[];
};

type SessionWithRelations = PrismaSession & {
  label: PrismaLabel | null;
  blocks: BlockWithLabelsRelation[];
};

type DayWithRelations = PrismaDay & {
  label: PrismaLabel | null;
  sessions: SessionWithRelations[];
};

export const mapToSessionWithLabelAndBlocks = (s: SessionWithRelations): SessionWithLabel => ({
  ...mapToSession(s),
  label: s.label ? mapToLabel(s.label) : null,
  blocks: s.blocks.map(mapToBlockWithLabels),
});

export const mapToDaySlot = (dayOfWeek: DayOfWeek, day: DayWithRelations | null): DaySlot => ({
  dayOfWeek,
  label: day?.label ? mapToLabel(day.label) : null,
  notes: day?.notes ?? null,
  sessions: (day?.sessions ?? []).map(mapToSessionWithLabelAndBlocks),
});
```

**Load-bearing fact (the consumer trace — D-8.3.5-4).** `mapToSessionWithLabelAndBlocks` / `mapToDaySlot` are **shared**: used by the week read endpoint (`week/admin.ts`) **and** by the day-metadata side-channel (`day/admin.ts` `setLabel` / `setNotes`, via the `DAY_INCLUDE` const — § 0.6). When `mapToSessionWithLabelAndBlocks` switches to `mapToBlockWithSchemas`, its input type `SessionWithRelations` widens — and **both** Prisma includes that produce a `SessionWithRelations` (the `week/admin.ts` inline include **and** `DAY_INCLUDE`) must be widened, identically. This is the exact shape of the Step 7.3.5 D-1 finding — there, widening `SessionWithRelations` with `blocks` broke `DAY_INCLUDE`; the resolution was to widen `DAY_INCLUDE` (not split the mapper). 8.3.5 repeats that resolution.

### § 0.2 — `blockSchema` (the file widened) + `block-api.schema.ts` (auto-widening dependents)

`packages/contracts/src/entities/lms/block/block.schema.ts` (verbatim):

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
```

`blockSchema` already folds in the `labels[]` embed (the block slice has **one** block schema, not a base + a `blockWithLabelsSchema` variant — unlike the session slice, where 7.3.5 widened the separate `sessionWithLabelSchema`). 8.3.5 follows the block slice's own choice: widen the single `blockSchema`.

`block-api.schema.ts` (verbatim — every block response schema references `blockSchema` **whole**, no `.pick` / `.omit`):

```ts
export const createBlockResponseSchema = blockSchema;
export const updateBlockResponseSchema = blockSchema;
export const reorderBlocksResponseSchema = z.object({ blocks: z.array(blockSchema) });
export const assignBlockLabelsResponseSchema = blockSchema;
```

→ when `blockSchema` widens, every block response schema auto-widens; the Block CRUD routes' response validation gains the new fields and the mappers supply them (`schemas: []` for the base mapper — § 3). **No `block-api.schema.ts` edit.** The block _request_ schemas (`createBlockSchema` etc.) are unaffected — create/update block do not take `schemas`.

### § 0.3 — The recursive-Zod pattern to mirror: `schemaSchema` (`schema.schema.ts`, verbatim)

```ts
export const trailingConnectorSchema = z
  .object({ form: connectorFormSchema, roundsCount: z.number().int().positive().optional() })
  .superRefine((value, ctx) => {
    /* … */
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
```

**This is the pattern for `schemaWithBodySchema`.** A self-referential Zod schema cannot infer its own type — it needs a `z.lazy(() => …)` body **and** an explicit `z.ZodType<Shape>` annotation, with `Shape` a structural type declared alongside (here `SchemaShape`, local to `schema.schema.ts`, not exported; the exported `Schema` = `z.infer<typeof schemaSchema>` lives in `schema.types.ts`). `schemaWithBodySchema` is genuinely recursive (`subSchemas` self-reference) and **must** follow this exact form.

### § 0.4 — `SchemaWithBody` type + `schemaRowSchema` + `alternatingGroupSchema`

`packages/contracts/src/entities/lms/schema/schema.types.ts` (verbatim — the embed shape, recursive):

```ts
import { type SchemaRow } from "../schema-row";
// …
export type Schema = z.infer<typeof schemaSchema>;
// …
export type SchemaWithBody = {
  schema: Schema;
  rows: SchemaRow[];
  subSchemas: SchemaWithBody[];
};
```

`SchemaWithBody` is the embed element. It already exists as a hand-written type. The new `schemaWithBodySchema` Zod schema must infer to **exactly this shape** — `{ schema: schemaSchema, rows: z.array(schemaRowSchema), subSchemas: z.array(schemaWithBodySchema) }`. Wire `schema.types.ts` consistently with the `SchemaShape`/`Schema` precedent (§ 0.3) — the exported `SchemaWithBody` ends up as the inferred type of the new schema; do not leave a separate hand-written definition that can drift from the schema.

`schema-row.schema.ts` — `schemaRowSchema` is a plain (non-lazy) `z.object` with `id` / `schemaId` / `order` / `rowKind` / `rowPayload` (`schemaRowPayloadSchema` discriminated union) + nullable VO columns + timestamps. Exported from the `schema-row` slice barrel.

`alternating-group.schema.ts` (verbatim):

```ts
export const alternatingGroupSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  relationKind: alternatingGroupRelationSchema,
  schemaIds: z.array(z.string().cuid()).min(2),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

`alternatingGroupSchema` already exists (8.1c). The AG embed reuses it as-is — `alternatingGroups: z.array(alternatingGroupSchema)` on `blockSchema`.

### § 0.5 — The mappers (verbatim — the composition targets)

`block.mapper.ts`:

```ts
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

Note the established **partial-population idiom**: `mapToBlock` (the base) returns `labels: []` — a `blockSchema`-valid object that simply does not populate the relation; `mapToBlockWithLabels` overrides it. 8.3.5 extends this idiom: `mapToBlock` gains `schemas: []` + `alternatingGroups: []`; a new `mapToBlockWithSchemas` populates them.

`schema.mapper.ts` — `mapToSchema(s: PrismaSchema): Schema` — maps a bare `PrismaSchema` to the contract `Schema` (parses the `Json` columns; needs no relations).

`schema-row.mapper.ts` — `mapToSchemaRow(r: PrismaSchemaRow): SchemaRow` — maps a bare `PrismaSchemaRow`.

`alternating-group.mapper.ts` (verbatim — **load-bearing for the AG include shape**):

```ts
type AlternatingGroupWithSchemas = PrismaAlternatingGroup & {
  schemas: { id: string }[];
};

export const mapToAlternatingGroup = (group: AlternatingGroupWithSchemas): AlternatingGroup => ({
  id: group.id,
  blockId: group.blockId,
  relationKind: group.relationKind,
  schemaIds: group.schemas.map((s) => s.id),
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
});
```

`mapToAlternatingGroup` needs the group's `schemas` relation loaded (only `{ id }` selected) to derive `schemaIds`. → the block include for `alternatingGroups` is **not** a bare `true` — it is `alternatingGroups: { include: { schemas: { select: { id: true } } } }`.

`mappers/lms/index.ts` is a **wildcard barrel** (`export * from "./block.mapper"` …) — a new `mapToBlockWithSchemas` in `block.mapper.ts` is auto-re-exported, **no barrel edit**.

### § 0.6 — The two Prisma includes to widen (the dual consumer — D-8.3.5-4)

`week/admin.ts` `lmsWeekApi.getByPlanAndDate` — inline include (verbatim):

```ts
const week = await prisma.week.findUnique({
  where: { planId_startDate: { planId, startDate } },
  include: {
    days: {
      include: {
        label: true,
        sessions: {
          orderBy: { order: "asc" },
          include: {
            label: true,
            blocks: {
              orderBy: { order: "asc" },
              include: {
                labelAssignments: { orderBy: { order: "asc" }, include: { label: true } },
              },
            },
          },
        },
      },
    },
  },
});
```

`day/admin.ts` — `DAY_INCLUDE` const (verbatim):

```ts
const DAY_INCLUDE = {
  label: true,
  sessions: {
    orderBy: { order: "asc" as const },
    include: {
      label: true,
      blocks: {
        orderBy: { order: "asc" as const },
        include: {
          labelAssignments: { orderBy: { order: "asc" as const }, include: { label: true } },
        },
      },
    },
  },
} as const;
```

The two `blocks: { … }` sub-includes are **byte-identical today** (modulo `as const` — `DAY_INCLUDE` is a standalone const, the week include is inline). 8.3.5 widens **both** `blocks` sub-includes, identically, with `schemas` + `alternatingGroups` (§ 3.2). Match each file's existing form (`DAY_INCLUDE` keeps `as const`; the week include stays inline). The hoist of this duplicated include to a shared module is a **separate** carry-forward, **not** triggered here — see § 7.

### § 0.7 — Prisma models (verbatim relations — the include topology)

```prisma
model Block {
  // … scalar fields …
  session           Session                @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  labelAssignments  BlockLabelAssignment[]
  schemas           Schema[]
  alternatingGroups AlternatingGroup[]
  @@unique([sessionId, order])
}

model Schema {
  id                 String     @id @default(cuid())
  blockId            String                                  // NON-nullable — every schema (top-level AND sub) has a block
  parentSchemaId     String?                                 // nullable — sub-schemas point to their parent
  alternatingGroupId String?
  order              Int
  // … scalar fields …
  block            Block             @relation(fields: [blockId], references: [id], onDelete: Cascade)
  parentSchema     Schema?           @relation("SchemaSubSchemas", fields: [parentSchemaId], references: [id], onDelete: Cascade)
  subSchemas       Schema[]          @relation("SchemaSubSchemas")
  alternatingGroup AlternatingGroup? @relation(fields: [alternatingGroupId], references: [id], onDelete: SetNull)
  rows             SchemaRow[]
  @@index([blockId, order])
  @@index([parentSchemaId, order])
}

model AlternatingGroup {
  id           String @id @default(cuid())
  blockId      String
  relationKind AlternatingGroupRelation
  block   Block    @relation(fields: [blockId], references: [id], onDelete: Cascade)
  schemas Schema[]                                           // members, via Schema.alternatingGroupId
}

model SchemaRow {
  // … scalar fields …
  schema Schema @relation(fields: [schemaId], references: [id], onDelete: Cascade)
  @@index([schemaId, order])
}
```

**Load-bearing facts.** (1) `Schema.blockId` is **non-nullable** — every schema, top-level and sub, has a `blockId`. The `block.schemas` relation therefore returns **all** of a block's schemas, flat (top-level + sub mixed). → the include for `schemas` **must** filter `where: { parentSchemaId: null }` to get the top-level set; the self-relation `subSchemas` then nests the children. Without the filter, sub-schemas appear both at the top level and under their parent — double-counted. (2) The self-relation is `"SchemaSubSchemas"` — `parentSchema` (parent) / `subSchemas` (children). (3) `AlternatingGroup.schemas` is the member relation (via `Schema.alternatingGroupId`). (4) Depth bound: a sub-schema is never `kind === "NESTED"` (domain-model.md §1.5 — "SubSchema сам по себе не может быть nested, одноуровневое вложение"; §1.4 — a sub-schema is `ATOMIC` **or** `HEADERLESS`, both of which have a `SchemaRow[]` body, never a `SubSchema[]` body). The schema tree is therefore **depth-2** — a fixed-depth-2 Prisma include suffices; there is no third level to fetch.

### § 0.8 — The read path forward (proves: no client adapter — D-8.3.5-6)

`week-api.schema.ts`: `getWeekResponseSchema = z.object({ week: weekSchema.nullable(), days: z.array(daySlotSchema).length(7) })`. `day.schema.ts`: `daySlotSchema.sessions = z.array(sessionWithLabelSchema)`; `sessionWithLabelSchema = sessionSchema.extend({ label: …, blocks: z.array(blockSchema) })`. → the chain `getWeekResponseSchema → daySlotSchema → sessionWithLabelSchema → blockSchema` means widening `blockSchema` **transitively widens `GetWeekResponse`** with no edit to `day.schema.ts` / `week-api.schema.ts`.

`apps/platform/src/lib/hooks/use-weeks.ts` `useWeek` (verbatim):

```ts
export const useWeek = (planId: string, startDate: string) =>
  useQuery({
    queryKey: platformKeys.weeks.byDate(planId, startDate),
    queryFn: () => api.weeks.getByDate(planId, startDate),
    enabled: !!planId && !!startDate,
  });
```

`api.weeks.getByDate` → `Promise<GetWeekResponse>` (`endpoints/weeks.ts`). The week route handler (`weeks/[startDate]/route.ts`) is `createAuthGetByParamHandler(fn, paramsSchema, getWeekResponseSchema)` — a **factory** that validates the response against `getWeekResponseSchema`; it auto-adapts when that schema widens, no manual construction. → `useWeek().data` carries `block.schemas` / `block.alternatingGroups` automatically; Step 8.4 reads them straight off `useWeek`. **No new client hook, no client adapter, no `weeks.ts` / `use-weeks.ts` edit.**

### § 0.9 — Barrels + husky / turbo

- `schema/index.ts`, `block/index.ts`, `schema-row/index.ts`, `alternating-group/index.ts`, `lms/index.ts`, `mappers/lms/index.ts` — **all wildcard** (`export * from …`). `schemaWithBodySchema` (in `schema.schema.ts`) and `mapToBlockWithSchemas` (in `block.mapper.ts`) are auto-re-exported. **No barrel file edit.** Verified: no `schema` / `schema-row` / `alternating-group` slice file imports `../block` → adding `block → schema` + `block → alternating-group` import edges introduces **no cycle**.
- `.husky/pre-commit`: `check-secrets` → `lint-staged` → `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"`.
- `.husky/pre-push`: `pnpm dep:check` → `SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"`.
- `turbo.json`: `check-types` / `lint` `dependsOn: ["^…"]`; `test: { cache: false }`.

**Fan-out → squash.** 8.3.5 is cross-package: `@repo/contracts` (`blockSchema` widens) + `@repo/api-server` (`mapToBlock` consumes the widened `Block` type). Committing `@repo/contracts` first leaves `@repo/api-server`'s `mapToBlock` literal missing the new fields → `turbo check-types --filter="...[HEAD]"` (which checks the dependency **and its dependents**) fails on that commit; committing `@repo/api-server` first is impossible (it needs the widened contract type). No valid ordering → **one squash commit** (§ 6), per `[[husky-cross-package-squash]]`. Mirrors Step 7.3.5 (`b8a6982f` — one squash commit).

### § 0.A — Consumer enumeration (per `[[planner-consumer-pattern-read]]` — a contract response-shape change)

`blockSchema` references (`grep -rln blockSchema`): `block/{block.schema,block.types,block-api.schema}.ts` + `day/day.schema.ts` + `block/{block.schema,block-api.schema}.test.ts`. The api-server does **not** import `blockSchema` — it imports the `Block` **type**. Propagation:

- **Contract side** — `block.types.ts` (`Block = z.infer<typeof blockSchema>`), `block-api.schema.ts` (response schemas, § 0.2), `day.schema.ts` (`sessionWithLabelSchema.blocks`), `week-api.schema.ts` (`getWeekResponseSchema`, transitively) — **all auto-widen**, no edit. Test files with `blockSchema` valid-fixtures need the new fields (§ 2).
- **api-server side** — the `Block` type widens → `mapToBlock`'s object literal (`block.mapper.ts`) is the **single** compile break: it must gain `schemas: []` + `alternatingGroups: []`. `mapToBlockWithLabels` spreads `mapToBlock` → inherits, no edit to its body. `mapToBlock` / `mapToBlockWithLabels` callsites (`grep`): `block/admin.ts` lines 145/171/283 (`mapToBlockWithLabels` — create/update/assignLabels) + line 241 (`mapToBlock` — reorder); all return through the mappers → all auto-get `schemas: []` / `alternatingGroups: []`. **No `block/admin.ts` edit.**
- **Route handlers** — the week route + the four block routes + the two day-metadata routes are all `createAuth*Handler(…)` factory wrappers parameterised by a contract response schema; they validate/serialize against it and **auto-adapt** when it widens. No manual response construction in any of them → **no route handler edit**. (The executor confirms this during Research.)
- **Client** — `use-blocks.ts` (`TResult = Block`), `use-weeks.ts` (`useWeek` → `GetWeekResponse`), `endpoints/{blocks,weeks}.ts` — all carry the widened types transparently (§ 0.8). **No client edit.**

---

## § 1 — Goal & ratified decisions

### Coach view

**Walkthrough.** Денис открывает плановый день в редакторе плана и смотрит на блок тренировки. Внутри блока — схемы, которые он собрал раньше: например, `n-rounds` «5 раундов × 8 повторов, отдых 90 сек». Он видит каждую схему — её заголовок и её наполнение — ровно в том порядке и виде, как оставил. Переходит на другую неделю, возвращается к этой — блок снова показывает все свои схемы, ничего не пропадает.

**Goal (coach).** На самом шаге 8.3.5 тренер не увидит ничего нового — это невидимая прослойка. Схемы внутри блоков появляются на экране начиная со Step 8.4 (anchor); 8.3.5 — то, без чего они туда не доедут и не переживут уход с экрана. Данные о связке схем в чередующийся набор (alternating-группа) тоже подвозятся этим шагом, но на экране возникают позже — на шаге архетипа `alternating-sets`.

### Developer view

**Goal.** Widen `blockSchema` with the `schemas[]` read-embed (and the sibling `alternatingGroups[]` embed) so the week read path returns each block with its full, depth-2 schema tree and its alternating groups. After 8.3.5 the block read surface is complete end-to-end and Step 8.4 can render schemas inside blocks straight off `useWeek`. Cross-package (`@repo/contracts` + `@repo/api-server`), structural twin of Step 7.3.5, one squash commit.

### § 1.x — Ratified decisions (planner-user chat 2026-05-21; the user confirmed all three thesis OQs)

- **D-8.3.5-1 (one step, `/feature small`).** 8.3.5 is one cross-package read-shape step — a recursive contract schema + a widened `blockSchema` + one new mapper + two widened includes. No new endpoint, no business logic, no UI, no Prisma schema change. Step 7.3.5 (the structural twin) ran `/feature small`; 8.3.5 is the same kind at higher volume → `/feature small`.
- **D-8.3.5-2 (`schemaWithBodySchema` — recursive `z.lazy`, not depth-bounded).** A new `schemaWithBodySchema` is added to `schema/schema.schema.ts` — `SchemaWithBody` exists today only as a hand-written type, with no Zod schema. It is genuinely recursive (`subSchemas` self-reference) → it follows `schemaSchema`'s declaration form exactly (§ 0.3): `z.lazy(() => z.object({ schema: schemaSchema, rows: z.array(schemaRowSchema), subSchemas: z.array(schemaWithBodySchema) }))` with an explicit `z.ZodType<…>` annotation. The depth-2 bound (a sub-schema is never `NESTED` — domain §1.5) is a **domain invariant** enforced by the write-side `schemaSchemaWithInvariants` and by the depth-2 Prisma include — **not** a Zod-type constraint. The Zod schema stays recursive so it infers exactly the existing `SchemaWithBody` shape; `SchemaWithBody` is **not** redefined into a depth-bounded form.
- **D-8.3.5-3 (widen the base `blockSchema` directly).** `blockSchema` gains `schemas: z.array(schemaWithBodySchema)` and `alternatingGroups: z.array(alternatingGroupSchema)` — added straight to the single base schema, mirroring how it already folds in `labels[]` (§ 0.2 — the block slice has one block schema, not a base + a `with-X` variant). The Block CRUD endpoints return `schemas: []` / `alternatingGroups: []` via the base `mapToBlock` (a freshly created or reordered block: its schemas are unchanged-or-absent and the client invalidates the week query → refetches the authoritative populated state — identical to the existing `labels: []` idiom).
- **D-8.3.5-4 (`mapToBlockWithSchemas` + widen BOTH includes — Fork A).** A new `mapToBlockWithSchemas` extends `mapToBlockWithLabels` (**not** `mapToBlock` — the week block embed carries `labels` too; the `03-deferred.md` carry-forward said "extending `mapToBlock`" loosely). The week path's `mapToSessionWithLabelAndBlocks` switches to `mapToBlockWithSchemas` → its input type `SessionWithRelations` widens → **both** the `week/admin.ts` inline include **and** `day/admin.ts`'s `DAY_INCLUDE` are widened, identically (§ 0.6) — `mapToDaySlot` is shared between the week read and the day-metadata side-channel. This mirrors the Step 7.3.5 D-1 resolution (widen `DAY_INCLUDE` for type integrity + week/day-mutate cache consistency, rather than split the mapper). The rejected alternative — splitting `mapToSessionWithLabelAndBlocks` / `mapToDaySlot` into with-/without-schemas variants — adds permanent dual-mapper surface to save a query cost on a cold path (`setLabel` / `setNotes` are low-frequency); not worth it. The schema include is **depth-2**: top-level `schemas` filtered `where: { parentSchemaId: null }`, `subSchemas` via the self-relation, `rows` at both levels, every level `orderBy: { order: "asc" }`.
- **D-8.3.5-5 (fold the `AlternatingGroup` embed in).** D-A2 deferred group-membership read to "a future `AlternatingGroup` embed (mirrors the Step 8.3.5 pattern)" — that embed is the same `blockSchema` widening, the same two includes, the same `mapToBlockWithSchemas`, the same cross-package squash. Folding it into 8.3.5 = one read-surface step; deferring it = a second cross-package squash re-touching identical files for ~8 LOC. `blockSchema` gains `alternatingGroups: z.array(alternatingGroupSchema)`; the includes gain `alternatingGroups: { include: { schemas: { select: { id: true } } } }` (§ 0.5 — `mapToAlternatingGroup` needs the member ids); `mapToAlternatingGroup` already exists (8.1d). The coach-facing UX of the _grouping_ surfaces only at the `alternating-sets` archetype step (queue 8.10) — the `alternatingGroups[]` field rides unrendered until then; the block's read shape (`labels` + `schemas` + `alternatingGroups`) is one coherent unit, assembled in one step.
- **D-8.3.5-6 (no client adapter, no new hook).** § 0.8 verified: the widened `blockSchema` flows through `getWeekResponseSchema` → `GetWeekResponse` → `useWeek` transparently; Step 8.4 reads `block.schemas` straight off `useWeek`. No new client hook, no adapter, no `apps/platform` edit.
- **D-8.3.5-7 (hoist NOT triggered).** The `week/admin.ts` block include and `DAY_INCLUDE` are duplicated (§ 0.6); 8.3.5 widens both **in place**, kept identical. The `BLOCK_WITH_LABELS_INCLUDE` / `DAY_INCLUDE` hoist carry-forwards (`03-deferred.md`) trigger on a **3rd callsite** — 8.3.5 adds none (it widens the existing two). The hoist stays deferred; do **not** hoist in this step (mirror 7.3.5's accepted duplication). See § 7.
- **D-8.3.5-8 (one squash commit).** Cross-package with no green intermediate ordering (§ 0.9) → one squash commit, body listing per-layer changes for logical revertability.

---

## § 2 — Scope / Inputs

### Files MODIFIED — `@repo/contracts`

- `packages/contracts/src/entities/lms/schema/schema.schema.ts` — add `schemaWithBodySchema` (recursive `z.lazy`, explicit `z.ZodType<…>` annotation; mirror `schemaSchema` — § 0.3).
- `packages/contracts/src/entities/lms/schema/schema.types.ts` — wire `SchemaWithBody` consistently with the `SchemaShape`/`Schema` precedent (the exported `SchemaWithBody` is the inferred type of the new schema; no separate hand-written definition that can drift).
- `packages/contracts/src/entities/lms/block/block.schema.ts` — `blockSchema` gains `schemas: z.array(schemaWithBodySchema)` + `alternatingGroups: z.array(alternatingGroupSchema)`; add barrel imports from `../schema` + `../alternating-group` (the established cross-slice import idiom — `block.schema.ts` already imports `../label`).
- `packages/contracts/src/entities/lms/schema/schema.schema.test.ts` — cases for `schemaWithBodySchema` (flat schema with rows + empty `subSchemas`; nested schema, depth-2 with populated `subSchemas`; empty `rows`).
- `packages/contracts/src/entities/lms/block/block.schema.test.ts` — `blockSchema` valid-fixtures gain `schemas` / `alternatingGroups`; a populated-embed case.
- `packages/contracts/src/entities/lms/block/block-api.schema.test.ts` — block fixtures gain the new fields if the file builds any.
- `packages/contracts/src/entities/lms/day/day.schema.test.ts` — block fixtures inside `sessionWithLabelSchema` / `daySlotSchema` fixtures gain the new fields if needed.

### Files MODIFIED — `@repo/api-server`

- `packages/api-server/src/mappers/lms/block.mapper.ts` — `mapToBlock` gains `schemas: []` + `alternatingGroups: []`; add `mapToBlockWithSchemas` (extends `mapToBlockWithLabels`; assembles the depth-2 `SchemaWithBody` tree via `mapToSchema` + `mapToSchemaRow`; maps `alternatingGroups` via `mapToAlternatingGroup`; declares its input relation type alongside `BlockWithLabels`).
- `packages/api-server/src/mappers/lms/day.mapper.ts` — `mapToSessionWithLabelAndBlocks` switches `s.blocks.map(mapToBlockWithLabels)` → `mapToBlockWithSchemas`; widen the `SessionWithRelations` (and the `BlockWith…` relation type) to carry the schema tree + alternating groups.
- `packages/api-server/src/endpoints/lms/week/admin.ts` — widen the `getByPlanAndDate` inline `blocks` sub-include with `schemas` (depth-2) + `alternatingGroups` (§ 3.2).
- `packages/api-server/src/endpoints/lms/day/admin.ts` — widen `DAY_INCLUDE`'s `blocks` sub-include **identically** to the `week/admin.ts` one.
- `packages/api-server/src/endpoints/lms/week/admin.test.ts` — cases for the schema/alternating-group embed in the week response.
- `packages/api-server/src/endpoints/lms/day/admin.test.ts` — cases for the embed in the `setLabel` / `setNotes` `DaySlot` response (`DAY_INCLUDE` now carries it).

### Files / areas NOT touched (out of scope)

- `block-api.schema.ts`, `day.schema.ts`, `week-api.schema.ts` — auto-widen via `blockSchema` references (§ 0.2, § 0.8); no edit.
- All barrels (`schema/index.ts`, `block/index.ts`, `lms/index.ts`, `mappers/lms/index.ts`, …) — wildcard; no edit (§ 0.9).
- `block/admin.ts` and all route handlers — mapper-based / factory-based; auto-adapt (§ 0.A); no edit.
- `apps/platform` (`use-weeks.ts`, `use-blocks.ts`, `endpoints/{weeks,blocks}.ts`, UI) — auto-widen / Step 8.4+; no edit (D-8.3.5-6).
- `apps/admin`, the Prisma schema, the seed — no schema change, no entity-semantics change.
- `analysis/` — **no `analysis/` sync.** 8.3.5 is a read-shape widening of existing entity relations; it introduces no domain-semantics change and no Prisma schema change (`SchemaWithBody` already exists in `06-formalization/types.ts`). Per WORKFLOW.md `analysis/` rules — mirrors Step 7.3.5 ("Analysis/-files touched: none").
- The hoist of the duplicated block include — deferred (D-8.3.5-7, § 7).
- The `Schema` / `SchemaRow` / `AlternatingGroup` write endpoints, routes, client api/hooks — complete; 8.3.5 only adds the read shape.

---

## § 3 — Phases (spec-only — structural descriptions, no code skeletons)

Read the precedents in § 0 and mirror their idiom / import style; write the actual code per project convention. No code comments (project rule). Both phases land in **one squash commit** (§ 6) — the "phases" are the executor's logical order, not separate commits.

### § 3.1 — Phase 1: contract layer

1. **`schemaWithBodySchema`** in `schema/schema.schema.ts` — a recursive Zod schema mirroring `schemaSchema`'s declaration form (§ 0.3): `z.lazy(() => z.object({ schema: schemaSchema, rows: z.array(schemaRowSchema), subSchemas: z.array(schemaWithBodySchema) }))`, with the explicit `z.ZodType<…>` annotation that a self-referential schema requires. `schemaRowSchema` is imported from the `../schema-row` slice barrel. Wire `schema.types.ts` so the exported `SchemaWithBody` is the schema's inferred type, per the `SchemaShape`/`Schema` precedent.
2. **Widen `blockSchema`** in `block/block.schema.ts` — add `schemas: z.array(schemaWithBodySchema)` and `alternatingGroups: z.array(alternatingGroupSchema)`; import `schemaWithBodySchema` from `../schema` and `alternatingGroupSchema` from `../alternating-group` (barrel imports). Field order is cosmetic — place them with the existing `labels` embed.
3. **Contract tests** — `schema.schema.test.ts` gets `schemaWithBodySchema` cases (flat / nested-depth-2 / empty-body); the `blockSchema` valid-fixtures across `block.schema.test.ts` / `block-api.schema.test.ts` / `day.schema.test.ts` gain the new fields.

### § 3.2 — Phase 2: api-server layer

1. **`mapToBlock`** (`block.mapper.ts`) — add `schemas: []` and `alternatingGroups: []` to the base object literal (the single compile break — § 0.A). `mapToBlockWithLabels` is unchanged (it spreads `mapToBlock`).
2. **`mapToBlockWithSchemas`** (`block.mapper.ts`) — a new mapper that extends `mapToBlockWithLabels` and populates `schemas` + `alternatingGroups`. It assembles the depth-2 `SchemaWithBody` tree: top-level schemas → `{ schema: mapToSchema(s), rows: s.rows.map(mapToSchemaRow), subSchemas: <sub-schemas, each mapped the same way with subSchemas: []> }`; `alternatingGroups` via `mapToAlternatingGroup`. Declare its input relation type alongside `BlockWithLabels` (a `PrismaBlock` with `labelAssignments` + the depth-2 `schemas` relation + `alternatingGroups` with `{ id }`-selected member schemas). A small `mapToSchemaWithBody`-style local helper for the per-schema assembly is acceptable (executor's call) — the two tree levels share the per-schema shape.
3. **`mapToSessionWithLabelAndBlocks`** (`day.mapper.ts`) — switch the block map to `mapToBlockWithSchemas`; widen `SessionWithRelations` (and the block relation type) to match `mapToBlockWithSchemas`'s input.
4. **The two includes** — widen the `blocks` sub-include in **both** `week/admin.ts` (inline) and `day/admin.ts` (`DAY_INCLUDE`), **identically**:
   - `schemas: { where: { parentSchemaId: null }, orderBy: { order: "asc" }, include: { rows: { orderBy: { order: "asc" } }, subSchemas: { orderBy: { order: "asc" }, include: { rows: { orderBy: { order: "asc" } } } } } }` — the depth-2 tree; the `where` filter is mandatory (§ 0.7 fact 1).
   - `alternatingGroups: { include: { schemas: { select: { id: true } } } }` — `mapToAlternatingGroup` needs the member ids (§ 0.5).
   - Match each file's existing form (`DAY_INCLUDE` keeps `as const` and `"asc" as const`; the week include stays inline).
5. **api-server tests** — `week/admin.test.ts` covers the embed in the week response (block with schemas + rows; a nested schema, depth-2; an empty block; ordering at each level; an alternating group present with its `schemaIds`). `day/admin.test.ts` covers the embed now flowing through `DAY_INCLUDE` (`setLabel` / `setNotes` return a `DaySlot` whose blocks carry populated `schemas`).

---

## § 4 — Acceptance criteria

1. ✅ `schemaWithBodySchema` added to `schema.schema.ts` — recursive `z.lazy`, explicit `z.ZodType<…>` annotation (mirrors `schemaSchema`); infers the `SchemaWithBody` shape (`{ schema, rows, subSchemas }`). `schema.types.ts` wired to the precedent (no drift-prone hand-written duplicate).
2. ✅ `blockSchema` gains `schemas: z.array(schemaWithBodySchema)` + `alternatingGroups: z.array(alternatingGroupSchema)`; imports added from `../schema` + `../alternating-group` (barrel imports).
3. ✅ `block-api.schema.ts`, `day.schema.ts`, `week-api.schema.ts`, all barrels — **byte-identical** (auto-widen / wildcard).
4. ✅ `mapToBlock` gains `schemas: []` + `alternatingGroups: []`; `mapToBlockWithLabels` body unchanged; `block/admin.ts` unchanged.
5. ✅ `mapToBlockWithSchemas` added — extends `mapToBlockWithLabels`, assembles the depth-2 `SchemaWithBody` tree (via `mapToSchema` + `mapToSchemaRow`) and `alternatingGroups` (via `mapToAlternatingGroup`).
6. ✅ `mapToSessionWithLabelAndBlocks` uses `mapToBlockWithSchemas`; `SessionWithRelations` widened to match.
7. ✅ `week/admin.ts` inline include AND `DAY_INCLUDE` both widened, **identically**, with the depth-2 `schemas` include (`where: { parentSchemaId: null }` top-level filter present) + `alternatingGroups` (with `schemas: { select: { id } }`); all include levels `orderBy: { order: "asc" }`.
8. ✅ Contract tests cover `schemaWithBodySchema` (flat / nested-depth-2 / empty-body); `blockSchema` fixtures updated; tests pass.
9. ✅ api-server tests cover the embed in the week response and the `DaySlot` response (block with schemas/rows, nested depth-2, empty block, ordering, alternating group present).
10. ✅ No new client hook / no adapter / no GET route; `apps/platform`, `apps/admin`, the Prisma schema, the seed, `analysis/` — byte-identical (D-8.3.5-6).
11. ✅ No hoist of the duplicated include (D-8.3.5-7); no toast change; the `/fix`-bundle carry-forwards untouched.
12. ✅ `pnpm check-types` (root) 16/16; `pnpm lint` (root) 16/16, 0 warnings; `pnpm test` (root) all packages pass (baseline + the new cases); `pnpm dep:check` 0 violations, **no new cycle**.
13. ✅ One squash commit (cross-package, per-layer body) + the docs commit; husky pre-commit + pre-push clean on both; zero `--no-verify` / `--no-edit` / `--no-gpg-sign`.
14. ✅ `git diff <prompt-commit>..HEAD` — changes confined to `packages/contracts/src/entities/lms/{schema,block,day}/` + `packages/api-server/src/{mappers/lms,endpoints/lms/{week,day}}/` + `implementation/step-08.3.5/output.md`; everything else 0 lines.

---

## § 5 — Adversarial pass (per `[[planner-adversarial-review]]` — read-step axes)

8.3.5 has no write operations; the axes are data-shape and consumer-trace correctness:

- **`parentSchemaId: null` top-level filter — mandatory.** `Schema.blockId` is non-nullable (§ 0.7) → `block.schemas` returns top-level **and** sub-schemas, flat. Without `where: { parentSchemaId: null }` on the `schemas` include, every sub-schema appears **twice** — once at the top level, once under its parent's `subSchemas`. The filter is load-bearing; a test must assert a nested schema's sub-schema is **not** present at the top level.
- **The dual-include trap (the Step 7.3.5 D-1 recurrence risk).** `mapToSessionWithLabelAndBlocks` switches to `mapToBlockWithSchemas` → `SessionWithRelations` widens → if **only** the `week/admin.ts` include is widened and `DAY_INCLUDE` is missed, `day/admin.ts`'s `mapToDaySlot` call fails `check-types` (the un-widened `DAY_INCLUDE` produces a block without the schema relation). Both includes MUST be widened identically — § 0.6 quotes both; § 3.2.4 specifies both; criterion 7 checks both.
- **Empty / shape cases.** Block with 0 schemas → `schemas: []`. Schema with 0 rows → `rows: []`. A `NESTED` schema → `rows: []` + populated `subSchemas`. An `ATOMIC` / `HEADERLESS` schema → populated `rows` + `subSchemas: []`. A block with no alternating group → `alternatingGroups: []`.
- **Depth bound.** The include is fixed depth-2; a sub-schema is never `NESTED` (domain §1.5) so there is no level-3 to fetch. The recursive `schemaWithBodySchema` _accepts_ any depth structurally — it will not reject a (domain-impossible) deeper tree, but the write-side `schemaSchemaWithInvariants` already prevents constructing one, and the include never fetches past level 2. This is correct — do not attempt to encode the depth bound in the Zod type.
- **Recursive `z.lazy` needs the annotation.** `schemaWithBodySchema` MUST carry the explicit `z.ZodType<…>` annotation — TypeScript cannot infer a self-referential schema without it (`schemaSchema` shows the pattern, § 0.3). The schema also nests through `blockSchema → sessionWithLabelSchema → daySlotSchema → getWeekResponseSchema`; the `z.ZodType` annotations bound the instantiation depth — `schemaSchema` already nests this deep, so this is proven, but keep the annotation.
- **`mapToBlock` base returns `schemas: []` / `alternatingGroups: []`.** The Block CRUD reorder path (`block/admin.ts:241`) returns blocks via `mapToBlock` → `schemas: []`. That is **not** wrong: the reorder did not change the blocks' schemas, and the client invalidates the week query → refetches the authoritative populated state. Identical to the pre-existing `labels: []` idiom. Do not "fix" it by loading schemas in the reorder path.
- **AG `schemaIds` reference integrity.** `mapToAlternatingGroup` derives `schemaIds` from the `group.schemas` relation (`{ id }` select). Those ids reference schemas that are **also** in the block's `schemas[]` embed — the AG carries only ids, no duplicated schema bodies; the Step 8.10 consumer cross-references. A test may assert a group's `schemaIds` are a subset of the block's `schemas[].schema.id`.
- **`DAY_INCLUDE` query weight.** `setLabel` / `setNotes` now haul the full schema tree per call. These are low-frequency coach actions (renaming a day, editing day notes) on the week the coach is already editing (warm data); the heavier query is accepted — it buys week/day-mutate response-shape consistency (the day-mutate `DaySlot` is writable into the week cache). This is the Fork-A trade-off ratified in D-8.3.5-4.
- **No cycle.** `block.schema.ts` gains imports from `../schema` + `../alternating-group`; verified (§ 0.9) that no file in those slices imports `../block` → no import cycle. `pnpm dep:check` must stay at 0 violations.

---

## § 6 — Commit strategy (one squash commit, per `[[husky-cross-package-squash]]`)

**Fan-out (§ 0.9).** Cross-package: `@repo/contracts` widens `blockSchema`; `@repo/api-server` consumes the widened `Block` type. A `@repo/contracts`-first commit leaves `@repo/api-server`'s `mapToBlock` literal missing the new fields → `turbo check-types --filter="...[HEAD]"` fails on that commit (it checks the dependency and its dependents). An `@repo/api-server`-first commit is impossible (it needs the widened contract type). No green intermediate ordering → **one squash commit**.

**Commit 1 (squash — the whole step):** subject e.g. `feat(training-domain): embed schemas and alternating groups in block read` (≤ 100 chars, fully lowercase — verify with `echo -n "<subject>" | wc -c`). Body (per-layer, `-m` flags — each ≤ ~140 chars, lowercase; em-dashes near the 100-char mark can trip commitlint body/footer split, so prefer short `-m` paragraphs) listing: contract layer (`schemaWithBodySchema` + `blockSchema` widened with `schemas[]` + `alternatingGroups[]`); api-server layer (`mapToBlockWithSchemas`, `mapToBlock` widened, `mapToSessionWithLabelAndBlocks` switched, the `week` include + `DAY_INCLUDE` widened); tests. Mirrors Step 7.3.5's single squash commit (`b8a6982f`).

**Commit 2:** `docs(step-08.3.5): write executor output report` — `implementation/step-08.3.5/output.md`.

Commitlint: subject ≤ 100 chars, fully lowercase (no caps anywhere, incl. acronyms); body lines ≤ 150. Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — a failing hook is a root cause to fix.

---

## § 7 — Out-of-scope / deferred (forward notes)

- **The block-include hoist — NOT this step (D-8.3.5-7).** `week/admin.ts`'s inline `blocks` include and `day/admin.ts`'s `DAY_INCLUDE` are duplicated and 8.3.5 widens both. The `BLOCK_WITH_LABELS_INCLUDE` / `DAY_INCLUDE` hoist carry-forwards (`03-deferred.md` "Step 8 surface triggers") trigger on a **3rd callsite** — 8.3.5 adds none. Do **not** hoist the include to a shared module in this step; widen the two copies in place and keep them identical (mirror Step 7.3.5's accepted duplication). The hoist stays deferred.
- **Toast policy** (D-8.3-6, `03-deferred.md`) — a mutation-side concern; 8.3.5 is read-side, touches no hook. Untouched.
- **REVIEW-I4/I5/I6 + QA-W1/W2 + QA-D1 + QA-I2** — `03-deferred.md` carry-forwards for a separate `/fix` bundle; 8.3.5 touches none of them.
- **The schema-editing UI** — the ArchetypePicker, the Schema / SchemaRow editors, the alternating-group bracket rendering — Step 8.4+ (anchor) and Step 8.10 (`alternating-sets`). 8.3.5 ships only the read shape.
- **`@@unique` constraints** — `SchemaRow @@unique([schemaId, order])` is Step 8.3.6; `Schema` partial-unique is Step 8.3.7. Not this step.

---

## § 8 — Verifications cheatsheet

```bash
# Per-package during work:
pnpm --filter @repo/contracts check-types && pnpm --filter @repo/contracts test
pnpm --filter @repo/api-server check-types && pnpm --filter @repo/api-server test

# Root sweep before output.md:
pnpm check-types        # 16/16
pnpm lint               # 16/16, 0 warnings
pnpm test               # all packages green (baseline + new cases)
pnpm dep:check          # 0 violations, no new cycle

# Husky enforces per commit:
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"               # pre-commit
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"   # pre-push
```

**No `db:reset` / `db:seed`** — 8.3.5 changes no Prisma schema and no seed. The api-server tests self-fixture (create blocks / schemas / rows / groups directly, the Step 7.3.5 / 7.3.6 pattern) against the current DB. Pre-existing flake awareness: `api-server` `block/admin.test.ts:406` timing assertion (QA-023) — re-run on flake, not a regression. The api-server test suite is single-config serial (~10 min) — expected.

---

## § 9 — Output report format (executor produces `implementation/step-08.3.5/output.md`)

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

No `analysis-files touched` line — 8.3.5 changes no `analysis/` file (read-shape widening, no domain-semantics / Prisma change). No UI smoke-test scenario — N/A (no runtime UI; the embed is verified by contract + api-server tests; UI smoke resumes at the Step 8.4 anchor).

---

## § 10 — Wrapper choice & process notes

**Wrapper**: `/feature small`. Cross-package read-shape widening, no new endpoint / business logic / UI — the structural twin of Step 7.3.5, which ran `small`. Higher volume than 7.3.5 (a recursive contract schema + the sibling `alternatingGroups[]` embed) but the same kind; the read-shape calibration holds. The two load-bearing traps — the `parentSchemaId: null` filter and the dual-include — are enumerated in § 0.6 / § 0.7 / § 3.2 / § 5; the `small` pipeline's Research + review-light stages plus this prompt's rigor are the safety net.

**Branch**: `feat/training-domain` (long-lived). **No branch cut** — override the `/feature` skill's default `feat/<slug>` cut.

**Per-step cycle**: thesis ratified in the planner-user chat 2026-05-21 (two-voice; the user confirmed all three OQs — D-8.3.5-2 / -4 / -5). Jump to `/feature` Stage 1 (Research).

**Escalation** (WORKFLOW.md "Executor escalation protocol"): if anything the spec did not anticipate surfaces — a precedent detail that contradicts § 3, a contract type that does not resolve as § 0 describes, a route handler that manually shapes a block response (§ 0.A assumed all are factory-based), an import cycle `pnpm dep:check` flags — STOP and surface with a hypothesis. Do not silently adapt. In particular: do not hoist the duplicated include (D-8.3.5-7); do not add a GET route or a read hook (the read surface is this embed); do not touch `analysis/` or the Prisma schema; do not drift into UI (Step 8.4+).

**Handoff after close-out**: Step 8.3.6 — `SchemaRow @@unique([schemaId, order])` + reorder two-pass (mirror Step 7.3.6). Then 8.3.7 (Schema partial-unique) → **8.4 anchor** (first coach-visible Schema editor).

---

**End of prompt.**
