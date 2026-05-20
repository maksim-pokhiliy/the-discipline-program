# Step 8.1c — `SchemaPairing` → `AlternatingGroup` model redesign (Prisma + contract + analysis + seed)

**Wrapper**: `/feature` full pipeline. Schema change (Prisma) + cross-package contract reshape + analysis-artifact sync. NOT `/feature small` — touches 2 packages across 4 layers, triggers `db:reset`, mutates the living domain model. The `[[always-via-feature-skill]]` thin-additive carve-out does not apply.

**Branch**: `feat/training-domain` long-lived. NO new branch cut (per `[[training-domain-workflow]]` + `[[always-via-feature-skill]]` branch-cut override). 0 commits ahead of `main` at handoff (PR #198 merged 2026-05-20; branch recreated from fresh `main`).

**Predecessor / decomposition**: Thesis ratified in planner-user chat 2026-05-20. The originally-scoped Step 8.1c (`lmsSchemaPairingApi` thin api-server slice) was **cancelled** during the thesis cycle — verification surfaced that `SchemaPairing` is modelled as a 2-FK pair but the `alternating-sets` archetype is an N-ary relation (the coach links 2..N schemas, no cap). This is a ratified domain-model change (**D14**), split into two sub-steps:

- **Step 8.1c (this prompt)** — model redesign: drop `SchemaPairing`, add `AlternatingGroup` across Prisma + contract + analysis + seed. Definition layer only — no api endpoints.
- **Step 8.1d (next)** — `lmsAlternatingGroupApi` (`create` / `addMember` / `removeMember` / `delete`) + `verifyAlternatingGroupOwnership` guard + `mapToAlternatingGroup` mapper, against the shape this step establishes.

This step ships no coach-visible behaviour and no runtime endpoint. It is the schema-change sub-step mandated by the WORKFLOW.md "Domain-model change protocol".

---

## § 0 — Verbatim source reads (read-at-prompt-write-time per `[[planner-verbatim-registration]]`)

All quotes below are the **current** state (verified 2026-05-20). They are reference material — the deliverable shapes are described structurally in § 3, not as code skeletons (per `[[planner-strategic-level]]`).

### § 0.1 — Real Prisma: `packages/api-server/prisma/schema.prisma`

**`enum SchemaPairingRelation`** (lines 587-589):

```prisma
enum SchemaPairingRelation {
  ALTERNATING_SETS
}
```

**`model Block`** (lines 652-669) — current relations block:

```prisma
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

  @@unique([sessionId, order])
  @@index([sessionId, order])
  @@map("training_blocks")
}
```

**`model Schema`** (lines 686-713):

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
```

**`model SchemaPairing`** (lines 715-727):

```prisma
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

Reference for field/format style — `model SchemaRow` (timestamps + `@@index` + `@@map` conventions) and `model BlockLabelAssignment` (the second join table — note it carries NO timestamps; `AlternatingGroup` deliberately departs from that, see D-A1).

### § 0.2 — Contract slice: `packages/contracts/src/entities/lms/schema-pairing/` (8 files)

**`index.ts`**:

```ts
export * from "./schema-pairing.constants";
export * from "./schema-pairing.schema";
export * from "./schema-pairing.types";
export * from "./schema-pairing-api.schema";
export * from "./schema-pairing-api.types";
```

**`schema-pairing.constants.ts`**:

```ts
export const SCHEMA_PAIRING_RELATIONS = ["ALTERNATING_SETS"] as const;
export type SchemaPairingRelation = (typeof SCHEMA_PAIRING_RELATIONS)[number];
```

**`schema-pairing.schema.ts`**:

```ts
import { z } from "zod";

import { SCHEMA_PAIRING_RELATIONS } from "./schema-pairing.constants";

export const schemaPairingRelationSchema = z.enum(SCHEMA_PAIRING_RELATIONS);

export const schemaPairingSchema = z.object({
  id: z.string().cuid(),
  schemaAId: z.string().cuid(),
  schemaBId: z.string().cuid(),
  relationKind: schemaPairingRelationSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSchemaPairingSchema = z
  .object({
    schemaAId: z.string().cuid(),
    schemaBId: z.string().cuid(),
    relationKind: schemaPairingRelationSchema,
  })
  .refine((p) => p.schemaAId !== p.schemaBId, {
    message: "schemaAId and schemaBId must be different",
    path: ["schemaBId"],
  });
```

**`schema-pairing.types.ts`**:

```ts
import { type z } from "zod";

import { type createSchemaPairingSchema, type schemaPairingSchema } from "./schema-pairing.schema";

export type SchemaPairing = z.infer<typeof schemaPairingSchema>;
export type CreateSchemaPairingData = z.infer<typeof createSchemaPairingSchema>;
```

**`schema-pairing-api.schema.ts`**:

```ts
import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createSchemaPairingSchema, schemaPairingSchema } from "./schema-pairing.schema";

export const getSchemaPairingsResponseSchema = z.array(schemaPairingSchema);

export const createSchemaPairingRequestSchema = createSchemaPairingSchema;
export const createSchemaPairingResponseSchema = schemaPairingSchema;

export const deleteSchemaPairingParamsSchema = idParamSchema;
```

**`schema-pairing-api.types.ts`**:

```ts
import { type z } from "zod";

import {
  type createSchemaPairingRequestSchema,
  type createSchemaPairingResponseSchema,
  type deleteSchemaPairingParamsSchema,
  type getSchemaPairingsResponseSchema,
} from "./schema-pairing-api.schema";

export type GetSchemaPairingsResponse = z.infer<typeof getSchemaPairingsResponseSchema>;
export type CreateSchemaPairingRequest = z.infer<typeof createSchemaPairingRequestSchema>;
export type CreateSchemaPairingResponse = z.infer<typeof createSchemaPairingResponseSchema>;
export type DeleteSchemaPairingParams = z.infer<typeof deleteSchemaPairingParamsSchema>;
```

Plus 2 test files: `schema-pairing.schema.test.ts` (every `schemaPairingSchema` fixture passes `createdAt`/`updatedAt`), `schema-pairing-api.schema.test.ts` (4 api-schema cases).

### § 0.3 — `packages/contracts/src/entities/lms/schema/archetype-params.schema.ts` — `alternating-sets` variant

Lines 44-46 (`positiveInt` is a module-local helper):

```ts
const archetypeAlternatingSetsParamsSchema = z.object({
  setEnumeration: z.array(positiveInt).min(1),
  pairedWithSchemaId: z.string().cuid().optional(),
});
```

Used in the discriminated union (lines 175-176):

```ts
    archetype: z.literal("alternating-sets"),
    params: archetypeAlternatingSetsParamsSchema,
```

**Distinct, NOT touched**: line 40 `pairedWithInnerRowId` in `parallelLadderEntrySchema` is a different field for a different archetype family — leave it.

### § 0.4 — Analysis anchor: `analysis/artifacts/06-formalization/schema.prisma` — `model SchemaPairing` (lines 252-263)

```prisma
model SchemaPairing {
  id           String                @id @default(cuid())
  schemaAId    String
  schemaBId    String
  relationKind SchemaPairingRelation

  schemaA Schema @relation("SchemaPairingA", fields: [schemaAId], references: [id], onDelete: Cascade)
  schemaB Schema @relation("SchemaPairingB", fields: [schemaBId], references: [id], onDelete: Cascade)

  @@unique([schemaAId, schemaBId])
  @@index([schemaBId])
}
```

The anchor mirrors the real Prisma for LMS domain entities (no `@@map`, no app-level models). `enum SchemaPairingRelation`, `model Schema` (`pairingsA`/`pairingsB`), `model Block` exist in the anchor too — mirror every real-Prisma change into the anchor.

### § 0.5 — Registration files (verbatim per `[[planner-verbatim-registration]]`)

**`packages/contracts/src/entities/lms/index.ts`** — current:

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

**`packages/contracts/package.json`** — `exports` map, current `lms/*` entries (lines 17-30):

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

**Consumer grep** (verified 2026-05-20): no production code imports `@repo/contracts/lms/schema-pairing` or the `SchemaPairing` Prisma type. Only the two api-server test files in § 0.6 reference `cleanupRaw.schemaPairing` (the Prisma client delegate, not the contract). The contract rename therefore breaks no importer; the Prisma rename breaks only those two test files.

### § 0.6 — api-server test-file `SchemaPairing` references (2 files)

**`packages/api-server/src/endpoints/lms/schema/admin.test.ts`** — 3 sites:

- Lines 72-74, in `provisionBlock().cleanup`:
  ```ts
  await cleanupRaw.schemaPairing
    .deleteMany({ where: { schemaA: { blockId: block.id } } })
    .catch(() => {});
  ```
- Lines 141-151, in `afterAll`:
  ```ts
  await cleanupRaw.schemaPairing
    .deleteMany({
      where: {
        schemaA: {
          block: {
            session: { day: { week: { planId: { in: [activePlanId, archivedPlanId] } } } },
          },
        },
      },
    })
    .catch(() => {});
  ```
- Lines 835-856, inside a delete-cascade test — creates a pairing then asserts it cascade-dies:
  ```ts
  const pairing = await cleanupRaw.schemaPairing.create({
    data: { schemaAId: parent.id, schemaBId: sibling.id, relationKind: "ALTERNATING_SETS" },
  });
  // ... await lmsSchemaApi.delete(coach.user.id, parent.id);
  const pairingAfter = await cleanupRaw.schemaPairing.findUnique({ where: { id: pairing.id } });
  // ... expect(pairingAfter).toBeNull();
  ```
  The test's primary assertions (`parentAfter` / `subAfter` / `rowAfter` null; `siblingAfter` not null) do NOT involve `SchemaPairing`.

**`packages/api-server/src/endpoints/lms/schema-row/admin.test.ts`** — 2 sites: lines 69-71 (`provisionBlock().cleanup`) and 199-209 (`afterAll`) — both `cleanupRaw.schemaPairing.deleteMany({ where: { schemaA: { ... } } })` teardown only.

### § 0.7 — Seed: `packages/api-server/prisma/seed/archetypes/rounds-ladder.ts`

The `alternating-sets` Archetype catalog entry (lines ~32-50) carries an `archetypeParamsSchema` JSON descriptor (stored in the `Archetype.archetypeParamsSchema` DB column per D4). Line 41 declares `pairedWithSchemaId`:

```ts
        pairedWithSchemaId: { type: "string", nullable: true },
```

This descriptor must drop `pairedWithSchemaId` to stay consistent with the Zod schema change in § 0.3. The Archetype's `name` / `kind` / `family` / `relatedArchetypes` are unchanged — `alternating-sets` stays a seeded archetype.

### § 0.8 — Analysis citations (domain semantics, per `[[coach-pov-first]]`)

**`er-final.md` §3.1** — current join-table description:

> **SCHEMA_PAIRING** — bidirectional FK для alternating-sets (block-009 case). `(schemaAId, schemaBId)` unique; `relationKind` enum (текущий: `ALTERNATING_SETS`; extensible — например `EMOM_SUB_PAIR`).

**`stress-test.md` §3 / `stress-final.md` §2.20** — `alternating-sets` appears exactly once in the stress sample (block-009), with 2 schemas: schema-1 `header="1st | 3rd | 5th sets:"` / `setEnumeration=[1,3,5]`, schema-2 `header="2nd | 4th | 6th sets"` / `setEnumeration=[2,4,6]`. The model generalised "pair" from this N=1 / cardinality-2 sample.

**`edge-cases.md` §1.2** — already flagged the model as provisional:

> Если block-singleton (alternating-sets) appears в новом блоке → cardinality растёт, archetype validates как general-purpose.

**`edge-cases.md` §10 Q20** — `super-set` vs `SchemaPairing`: `super-set` is an ordered exercise sequence inside ONE schema (`ArchetypeSuperSetParams`), unrelated to `SchemaPairing`. **The `super-set` archetype and `SuperSetPair` VO are NOT touched by this redesign.**

The redesign rationale: `setEnumeration` on each schema already carries the global set sequence; the link entity only records _which_ schemas form one alternating cycle. With 2 schemas → odd/even; with 3 → every-third; with N → every-Nth. The pair table cannot express N>2. See § 1.

### § 0.9 — Hooks & turbo (commit-strategy inputs, per `[[husky-cross-package-squash]]`)

`.husky/pre-commit`: `check-secrets` → `lint-staged` → `turbo run check-types --filter="...[HEAD]"`.
`.husky/pre-push`: `dep:check` → `turbo run lint check-types --filter="...[origin/main]"`.
`turbo.json`: `check-types` / `lint` both `dependsOn: ["^check-types"]` / `["^lint"]`; `test: { cache: false }`.

**Fan-out analysis** — see § 6. Summary: per-layer atomic commits; no squash trigger fires, because every intermediate tree type-checks (the Prisma drop's only broken consumers — the two test files — are fixed inside the same commit; the contract package does not import the Prisma client).

---

## § 1 — Goal & ratified decisions

### Coach view

**Walkthrough.** Денис открывает план в редакторе, заходит в неделю → день → сессию; в блоке «STRENGTH ENDURANCE» у него три серии — «Подходы 1·4·7», «Подходы 2·5·8», «Подходы 3·6·9» — атлет прокручивает их по кругу, подход за подходом. Денис выделяет все три, жмёт «Объединить в alternating-группу» — вокруг трёх карточек появляется скоба с подписью «alternating», и блок читается как один чередующийся цикл из трёх серий. Позже он передумывает, убирает третью серию из группы — скоба стягивается до двух карточек, третья серия остаётся в блоке сама по себе. Step 8.1c — это то, что делает такую группу из 2..N серий вообще представимой в данных: сущность `AlternatingGroup` вместо старой таблицы-пары `SchemaPairing`. Сам экран объединения и операции (`create` / добавить / убрать / удалить) — следующий шаг (8.1d) и UI позже (D11).

**Goal.** После 8.1c доменная модель умеет хранить «эти 2..N серий — одна alternating-группа», без потолка участников; Prisma, контракт и `analysis/` согласованы по форме `AlternatingGroup`. Шаг не добавляет ни одного экрана и ни одного эндпоинта — это слой определения модели.

**C-A1 (ratified).** У группы нет собственного порядка участников. Последовательность подходов уже записана в номерах подходов каждой серии (`setEnumeration`: `[1,4,7]` vs `[2,5,8]` vs `[3,6,9]`); группа лишь фиксирует «вот эти серии чередуются». Порядок карточек на экране = порядок серий в блоке (`Schema.order`). → `AlternatingGroup` НЕ несёт `order`-колонку; `contract.schemaIds` — массив без семантики порядка.

### Developer view

Replace `SchemaPairing` (2-FK pair table) with `AlternatingGroup` (N-ary grouping entity) across the model-definition layer: Prisma, the contract slice, the `analysis/` living source, and the seed. No api-server endpoint, no mapper, no guard — those land in Step 8.1d against the shape established here.

The reshape (not a mechanical rename): a pair table with `schemaAId` + `schemaBId` becomes a grouping entity `AlternatingGroup` whose members are carried by a single nullable FK `Schema.alternatingGroupId`. A schema belongs to at most one group (single FK — structural; no junction table). The group is block-scoped and is a managed, mutable entity (members added/removed in 8.1d), so it carries `createdAt`/`updatedAt`.

### § 1.x — Ratified decisions

- **D14 (`SchemaPairing` → `AlternatingGroup` redesign).** Ratified 2026-05-20 (planner-user thesis cycle). `alternating-sets` is an N-ary relation: a coach links 2..N schemas into one alternating cycle, with no upper bound. The 2-FK pair table cannot express N>2. Replaced by `AlternatingGroup` — a block-scoped grouping entity; membership via single nullable FK `Schema.alternatingGroupId`. The analysis modelled "pair" from a single cardinality-2 sample (block-009) and `edge-cases.md` §1.2 explicitly flagged that as provisional — D14 is the anticipated correction, not a contradiction of the analysis. Not a domain-model _limitation surfaced mid-implementation_ in the silent-adapt sense — it was escalated and ratified per the WORKFLOW.md "Domain-model change protocol" before any code; this step is the mandated schema-change sub-step.
- **D-A1 (`AlternatingGroup` Prisma shape + `onDelete`).** `AlternatingGroup { id, blockId, relationKind, createdAt, updatedAt }`. Membership = single nullable FK `Schema.alternatingGroupId`. `onDelete`: `AlternatingGroup.block` → `Cascade` (deleting a Block deletes its groups); `Schema.alternatingGroup` → `SetNull` (deleting a group leaves the member schemas alive and ungrouped — this is the "delete = unlink, schemas survive" requirement). The behaviour when a _member schema_ is deleted and the group shrinks below 2 (auto-dissolve vs reject) is api logic — **Step 8.1d**, NOT this step. timestamps — yes; `AlternatingGroup` is a managed mutable entity (members change), unlike the bare `BlockLabelAssignment`/old-`SchemaPairing` join rows.
- **D-A2 (contract `Schema` is NOT extended).** Prisma `Schema` gains `alternatingGroupId`. The contract `schemaSchema` and `mapToSchema` are **NOT** changed in 8.1c — group membership is read via a future `AlternatingGroup` embed (mirrors the Step 8.3.5 `schemas[]` read-embed pattern). This keeps 8.1c scoped to "define the entity".
- **D-A3 / naming.** Entity `AlternatingGroup`; Prisma enum `AlternatingGroupRelation`; table `@@map("training_alternating_groups")`; contract slice directory `alternating-group/`; contract enum constant `ALTERNATING_GROUP_RELATIONS`. User picked `AlternatingGroup` 2026-05-20 (over the working name `SchemaGroup`).
- **C-A1** — see Coach view above. No member-order column on the group.
- **Decomposition.** 8.1c = this (model definition). 8.1d = `lmsAlternatingGroupApi` + `verifyAlternatingGroupOwnership` + `mapToAlternatingGroup` + the `addMember`/`removeMember` operation contract schemas (defined alongside the api methods that consume them). `super-set` (Q20) is untouched.

---

## § 2 — Scope / Inputs

### Files CREATED — `packages/contracts/src/entities/lms/alternating-group/` (8 files)

1. `index.ts` — barrel (5 re-exports, mirror old `schema-pairing/index.ts`).
2. `alternating-group.constants.ts`
3. `alternating-group.schema.ts`
4. `alternating-group.types.ts`
5. `alternating-group.schema.test.ts`
6. `alternating-group-api.schema.ts`
7. `alternating-group-api.types.ts`
8. `alternating-group-api.schema.test.ts`

### Files MODIFIED

- `packages/api-server/prisma/schema.prisma` — drop `enum SchemaPairingRelation` + `model SchemaPairing`; add `enum AlternatingGroupRelation` + `model AlternatingGroup`; edit `model Schema` (drop `pairingsA`/`pairingsB`, add `alternatingGroupId` + relation + index); edit `model Block` (add `alternatingGroups`).
- `packages/api-server/prisma/seed/archetypes/rounds-ladder.ts` — drop `pairedWithSchemaId` property from the `alternating-sets` archetype `archetypeParamsSchema` descriptor (§ 0.7).
- `packages/api-server/src/endpoints/lms/schema/admin.test.ts` — migrate the 3 `SchemaPairing` sites (§ 0.6 / § 3.1 op 4).
- `packages/api-server/src/endpoints/lms/schema-row/admin.test.ts` — migrate the 2 teardown sites.
- `packages/contracts/src/entities/lms/schema/archetype-params.schema.ts` — drop `pairedWithSchemaId` from `archetypeAlternatingSetsParamsSchema`.
- `packages/contracts/src/entities/lms/schema/schema.schema.test.ts` — line ~146 fixture: drop the stale `pairedWithSchemaId` key.
- `packages/contracts/src/entities/lms/index.ts` — barrel: `./schema-pairing` → `./alternating-group`.
- `packages/contracts/package.json` — `exports` map: `./lms/schema-pairing` → `./lms/alternating-group` (reposition per the existing alpha order — `alternating-group` sorts between `_shared` and `archetype`).
- `analysis/artifacts/06-formalization/schema.prisma`
- `analysis/artifacts/06-formalization/types.ts`
- `analysis/artifacts/06-formalization/er-final.md`
- `analysis/artifacts/06-formalization/implementation-notes.md`
- `analysis/artifacts/06-formalization/stress-final.md`
- `analysis/artifacts/05-synthesis/domain-model.md`
- `analysis/artifacts/05-synthesis/edge-cases.md`
- `analysis/artifacts/05-synthesis/stress-test.md`

### Files DELETED

- `packages/contracts/src/entities/lms/schema-pairing/` — entire directory (8 files).

### Files / areas NOT touched (out of scope)

- `analysis/artifacts/00-meta/**` — read-only-forever; `phase-06-prompt.md` / `phase-07-prompt.md` keep their `paired_with_schema` / `SCHEMA_PAIRING` mentions as point-in-time historical truth.
- api-server production code (`lmsSchemaApi`, `lmsSchemaRowApi`, guards, mappers) — no `SchemaPairing` import; nothing to change.
- `lmsAlternatingGroupApi`, `verifyAlternatingGroupOwnership`, `mapToAlternatingGroup`, `addMember`/`removeMember` contract schemas — Step 8.1d.
- HTTP routes / client hooks / UI — Steps 8.2 / 8.3 / 8.4 / D11.
- `super-set` archetype, `ArchetypeSuperSetParams`, `SuperSetPair` (Q20) — unrelated.
- `parallelLadderEntrySchema.pairedWithInnerRowId` (archetype-params.schema.ts:40) — different field, different archetype family.

---

## § 3 — Phases (spec-only — structural descriptions, no code skeletons)

The shapes below are specifications. Mirror the formatting/idiom of the cited canonical siblings; write the actual code per project convention.

### § 3.1 — Phase 1: Prisma model + seed descriptor + api-server test-file migration

**Goal.** Replace `SchemaPairing` with `AlternatingGroup` in the real Prisma schema; keep the seed descriptor consistent; keep the two api-server test suites green.

**Operations:**

1. **`packages/api-server/prisma/schema.prisma`:**

   - **Drop** `enum SchemaPairingRelation` and `model SchemaPairing`.
   - **Add** `enum AlternatingGroupRelation` with the single value `ALTERNATING_SETS` (extensible; mirror the old enum).
   - **Add** `model AlternatingGroup` with fields: `id` (cuid PK), `blockId` (String, non-null FK), `relationKind` (`AlternatingGroupRelation`), `createdAt` (`@default(now())`), `updatedAt` (`@updatedAt`). Relations: `block Block @relation(fields: [blockId], references: [id], onDelete: Cascade)`; `schemas Schema[]` (back-relation of `Schema.alternatingGroup`). Indexes: `@@index([blockId])`. Map: `@@map("training_alternating_groups")`. Mirror the field-alignment / block style of `model SchemaRow`.
   - **Edit `model Schema`:** remove the `pairingsA` and `pairingsB` relation fields. Add scalar `alternatingGroupId String?` (place it alongside the other optional scalars, e.g. after `parentSchemaId`) and relation `alternatingGroup AlternatingGroup? @relation(fields: [alternatingGroupId], references: [id], onDelete: SetNull)`. Add `@@index([alternatingGroupId])` (member-by-group lookup; Prisma does not auto-index FK scalars).
   - **Edit `model Block`:** add the back-relation `alternatingGroups AlternatingGroup[]` alongside `schemas`/`labelAssignments`.
   - The `AlternatingGroup ↔ Schema` and `AlternatingGroup ↔ Block` relations each have exactly one FK — no named `@relation("…")` labels needed (unlike the old dual-FK `SchemaPairing`).

2. **`packages/api-server/prisma/seed/archetypes/rounds-ladder.ts`:** in the `alternating-sets` archetype entry's `archetypeParamsSchema` descriptor, delete the `pairedWithSchemaId` property line (§ 0.7). Leave `setEnumeration` and the rest of the entry intact.

3. **Regenerate + reset the dev DB.** After editing `schema.prisma`, run `pnpm --filter @repo/api-server db:reset` then `pnpm --filter @repo/api-server db:seed` (per ADR-0019 / `[[discipline-program-db-non-prod]]`). `db:reset` regenerates the Prisma client — required so the migrated test files (op 4) type-check against `cleanupRaw.alternatingGroup`. `db:seed` must report `Archetypes: 34` and succeed (`alternating-sets` descriptor change is data-only).

4. **Migrate the two api-server test files** (§ 0.6) so they compile against the new Prisma client and keep passing:
   - `schema/admin.test.ts` + `schema-row/admin.test.ts` **teardown sites**: the `cleanupRaw.schemaPairing.deleteMany(...)` calls. `AlternatingGroup` carries `blockId` directly, so the filter simplifies (`{ blockId: block.id }` / `{ block: { session: { … } } }`). Executor's tactical call: convert to `cleanupRaw.alternatingGroup.deleteMany(...)`, OR drop the lines entirely — `AlternatingGroup.block onDelete: Cascade` means deleting the Block (already in teardown) removes its groups. Either is acceptable; prefer dropping if it leaves teardown simpler.
   - `schema/admin.test.ts` **cascade test (lines 835-856)**: this step **sheds the `SchemaPairing` limb** — remove the `pairing` creation and the `pairingAfter` fetch + `expect(pairingAfter).toBeNull()` assertion. Keep all other assertions (`parentAfter`/`subAfter`/`rowAfter` null; `siblingAfter` not null) — they are the test's primary subject and do not involve the link entity. Do NOT add `AlternatingGroup` behavioural coverage here — group-member-deletion semantics are undefined until 8.1d. If the `it(...)` title references "pairing", retitle to match the remaining assertions.

**Commit 1**: `refactor(api-server): replace schemapairing model with alternatinggroup` — `schema.prisma` + `seed/archetypes/rounds-ladder.ts` + the 2 test files. Body lists per-layer changes. The Prisma drop and the test-file fixes ship together (the drop breaks `cleanupRaw.schemaPairing` type-checking — they must be one commit; § 6).

### § 3.2 — Phase 2: contract slice rewrite (`schema-pairing/` → `alternating-group/`)

**Goal.** Replace the pair contract slice with an N-ary `alternating-group/` slice; drop the superseded `pairedWithSchemaId`; fix the barrel + exports map.

**Operations:**

1. **Create `packages/contracts/src/entities/lms/alternating-group/`** — 8 files, mirroring the file layout of the old `schema-pairing/` slice (§ 0.2). Shapes:

   - **`alternating-group.constants.ts`** — `ALTERNATING_GROUP_RELATIONS = ["ALTERNATING_SETS"] as const` + the derived `AlternatingGroupRelation` type. Direct rename of `SCHEMA_PAIRING_RELATIONS`.
   - **`alternating-group.schema.ts`** —
     - `alternatingGroupRelationSchema = z.enum(ALTERNATING_GROUP_RELATIONS)`.
     - `alternatingGroupSchema` — object: `id` (cuid), `blockId` (cuid), `relationKind` (`alternatingGroupRelationSchema`), `schemaIds` (`z.array(z.string().cuid()).min(2)` — the N members), `createdAt` (`z.date()`), `updatedAt` (`z.date()`). The `schemaIds` array is unordered-set semantics per **C-A1** — no order meaning.
     - `createAlternatingGroupSchema` — object: `relationKind`, `schemaIds` (`z.array(z.string().cuid()).min(2)` + a `.refine` rejecting duplicate ids — mirror `reorderSchemaRowsSchema`'s `new Set(ids).size === ids.length` refinement in the `schema-row` slice). `blockId` is NOT a create input — the server derives it from the member schemas in 8.1d. The old self-pair `.refine(schemaAId !== schemaBId)` is subsumed by `.min(2)` + the uniqueness refine.
   - **`alternating-group.types.ts`** — `AlternatingGroup` and `CreateAlternatingGroupData` inferred types.
   - **`alternating-group-api.schema.ts`** — `getAlternatingGroupsResponseSchema = z.array(alternatingGroupSchema)`; `createAlternatingGroupRequestSchema = createAlternatingGroupSchema`; `createAlternatingGroupResponseSchema = alternatingGroupSchema`; `deleteAlternatingGroupParamsSchema = idParamSchema` (import `idParamSchema` from `../../../common`). NO `addMember`/`removeMember` schemas — those are Step 8.1d.
   - **`alternating-group-api.types.ts`** — the 4 inferred api types.
   - **2 test files** — mirror the structure of the old `schema-pairing*.test.ts` for the new shapes: relation-enum acceptance, full-entity parse (now with a valid `schemaIds` array of ≥2 cuids), missing-field rejection, `createAlternatingGroupSchema` accept/reject (`.min(2)` boundary: reject a 1-element `schemaIds`; reject duplicate ids), and the api-schema identity/`idParam` cases.
   - **`index.ts`** — barrel: 5 `export * from "./alternating-group…"` lines.

2. **Delete** `packages/contracts/src/entities/lms/schema-pairing/` (all 8 files).

3. **`packages/contracts/src/entities/lms/index.ts`** — replace `export * from "./schema-pairing";` with `export * from "./alternating-group";` (keep alpha order — `alternating-group` sorts before `archetype`, so the line moves to the top of the entity block, after `./_shared`).

4. **`packages/contracts/package.json`** — `exports` map: remove `"./lms/schema-pairing": …`, add `"./lms/alternating-group": "./src/entities/lms/alternating-group/index.ts"`, positioned per the existing alpha order (between `"./lms/_shared"` and `"./lms/archetype"`).

5. **`packages/contracts/src/entities/lms/schema/archetype-params.schema.ts`** — drop the `pairedWithSchemaId` line from `archetypeAlternatingSetsParamsSchema` (§ 0.3). Result: `archetypeAlternatingSetsParamsSchema = z.object({ setEnumeration: z.array(positiveInt).min(1) })`. Leave the `alternating-sets` union entry and `pairedWithInnerRowId` (line 40, different schema) untouched.

6. **`packages/contracts/src/entities/lms/schema/schema.schema.test.ts`** — line ~146, the fixture `params: { setEnumeration: [1, 2, 3], pairedWithSchemaId: cuidA }` — drop the `pairedWithSchemaId` key (it is now an unknown key Zod would strip; leaving it is stale per `[[no-tech-debt-in-mocks]]`). If `cuidA` becomes unused after this, clean it up too (lint will flag it).

**Commit 2**: `refactor(contracts): replace schema-pairing slice with alternating-group` — new `alternating-group/` dir, deleted `schema-pairing/` dir, `archetype-params.schema.ts`, `schema.schema.test.ts`, `lms/index.ts`, `package.json`.

### § 3.3 — Phase 3: `analysis/` living-source sync

**Goal.** Bring the living domain model into sync with D14 — per WORKFLOW.md "`analysis/` directory rules" + "Domain-model change protocol". This is a schema change that alters relations and entity semantics, so `06-formalization/{schema.prisma, er-final.md}` + `05-synthesis/domain-model.md` + `06-formalization/implementation-notes.md` all update; the stress files update too, because N-ary alternation is a case the old pair model did not cover.

**Operations** — sync each file from `SchemaPairing` (2-FK pair) to `AlternatingGroup` (N-ary, block-scoped, single-FK membership). Read each file in full before editing; the line references below are starting points, not the full extent.

- **`06-formalization/schema.prisma`** — mirror the real-Prisma change (§ 3.1 op 1) into the anchor: drop `SchemaPairing` + `SchemaPairingRelation`; add `AlternatingGroup` + `AlternatingGroupRelation`; edit `Schema` + `Block`. The anchor omits `@@map` and app-level models — keep that convention.
- **`06-formalization/types.ts`** — the `@prisma/client` re-export block: `SchemaPairing` → `AlternatingGroup`, `SchemaPairingRelation` → `AlternatingGroupRelation` (~4 occurrences). `ArchetypeAlternatingSetsParams` interface (~line 400): drop `pairedWithSchemaId`.
- **`06-formalization/er-final.md`** — the top "change" table row for `SCHEMA_PAIRING explicit join`; the Mermaid ER block (the two `SCHEMA ||--o{ SCHEMA_PAIRING : "paired-A/B"` edges → a `SCHEMA }o--o| ALTERNATING_GROUP` membership edge + a `BLOCK ||--o{ ALTERNATING_GROUP : contains` edge); the `SCHEMA_PAIRING` entity block → `ALTERNATING_GROUP`; §3.1 join-tables prose; the relation-cardinality table (`Schema ↔ SchemaPairing`).
- **`06-formalization/implementation-notes.md`** — add a short addendum recording D14 (the redesign, its rationale, ratify date) — mirror the style of the existing D12 ratification-trail addendum.
- **`06-formalization/stress-final.md`** — §2.20 block-009: rewrite the `SchemaPairing(schemaAId=…, schemaBId=…)` representation as an `AlternatingGroup` containing `[schema-1, schema-2]`; drop `pairedWithSchemaId` from the two `archetypeParams` blocks; the §5 special-cases table row for `paired_with_schema_ref`.
- **`05-synthesis/domain-model.md`** — §3.1 archetype table, the `alternating-sets` row: drop `paired_with_schema_ref?` from the `archetype_params` cell. Keep the entity census (§7) coherent — `AlternatingGroup` described as an N-ary block-scoped grouping entity.
- **`05-synthesis/edge-cases.md`** — §1.2 table (the `alternating-sets` / `paired_with_schema_ref` note); §6.5 `paired_with_schema_ref persistence`; §10 Q20 table row mentioning "SchemaPairing остаётся для alternating-sets". Reframe to N-ary `AlternatingGroup`.
- **`05-synthesis/stress-test.md`** — §3 block-009 model-fitment block (the `paired_with_schema_ref` lines in both schemas + the Gaps/observations note + the §10 coverage-table row).

Where the prose previously said "pair" / "bidirectional FK" / "2 schemas", state that the link is an N-ary group (2..N members) — block-009 happens to have 2, but the model supports any N≥2. **Do NOT fabricate a synthetic N>2 stress block** — note the generalisation in prose; the empirical sample stays as-is.

**Commit 3**: `docs(analysis): sync artifacts for alternatinggroup redesign` — the 8 analysis files.

---

## § 4 — Acceptance criteria

1. ✅ `enum SchemaPairingRelation` and `model SchemaPairing` removed from `packages/api-server/prisma/schema.prisma`.
2. ✅ `enum AlternatingGroupRelation { ALTERNATING_SETS }` + `model AlternatingGroup` added; fields `{ id, blockId, relationKind, createdAt, updatedAt }`; `block` relation `onDelete: Cascade`; `schemas Schema[]` back-relation; `@@index([blockId])`; `@@map("training_alternating_groups")`.
3. ✅ `model Schema`: `pairingsA`/`pairingsB` removed; `alternatingGroupId String?` + `alternatingGroup` relation (`onDelete: SetNull`) + `@@index([alternatingGroupId])` added.
4. ✅ `model Block`: `alternatingGroups AlternatingGroup[]` added.
5. ✅ `db:reset` + `db:seed` succeed; seed reports `Archetypes: 34`.
6. ✅ `seed/archetypes/rounds-ladder.ts` — `alternating-sets` archetype descriptor no longer declares `pairedWithSchemaId`.
7. ✅ `packages/contracts/src/entities/lms/alternating-group/` exists with 8 files; `schemaPairing` directory deleted.
8. ✅ `alternatingGroupSchema` shape = `{ id, blockId, relationKind, schemaIds: cuid[].min(2), createdAt, updatedAt }`; `createAlternatingGroupSchema` = `{ relationKind, schemaIds: cuid[].min(2) + unique-refine }`.
9. ✅ `alternating-group-api.schema.ts` exports `get`/`create`(request+response)/`delete` schemas; no `addMember`/`removeMember`.
10. ✅ `archetypeAlternatingSetsParamsSchema` no longer has `pairedWithSchemaId`; `schema.schema.test.ts` fixture cleaned; `pairedWithInnerRowId` untouched.
11. ✅ `lms/index.ts` barrel + `contracts/package.json` exports map: `schema-pairing` → `alternating-group`, alpha order preserved.
12. ✅ `schema/admin.test.ts` + `schema-row/admin.test.ts` migrated; the cascade test (835-856) sheds its `SchemaPairing` limb, keeps the rest.
13. ✅ `grep -rn "SchemaPairing\|schemaPairing\|schema-pairing\|SCHEMA_PAIRING\|pairedWithSchemaId" packages/` returns **0** lines (outside generated/`node_modules`).
14. ✅ 8 `analysis/` files synced; `analysis/artifacts/00-meta/**` unchanged.
15. ✅ `pnpm check-types` (root) — 16/16.
16. ✅ `pnpm lint` (root) — 16/16, 0 warnings.
17. ✅ `pnpm test` (root) — all packages pass; contracts test count adjusts for the renamed slice; api-server count unchanged (the 2 migrated files still pass).
18. ✅ `pnpm dep:check` — 0 violations.
19. ✅ Husky pre-commit + pre-push clean on every commit. Zero `--no-verify` / `--no-edit` / `--no-gpg-sign`.
20. ✅ 3 per-layer atomic commits (+ executor `docs(step-08.1c)` output report); no squash; no `--no-verify`.
21. ✅ `git diff <start>..HEAD` — changes confined to the § 2 file list; api-server production endpoints/guards/mappers and `apps/**` show 0 lines.

---

## § 5 — Migration-completeness pass (per `[[planner-adversarial-review]]`, redesign-flavoured)

This step has no runtime endpoint, so the adversarial axes are migration-correctness, not concurrency.

- **Dangling references.** After all 3 phases, no identifier `SchemaPairing` / `schemaPairing` / `SchemaPairingRelation` / `SCHEMA_PAIRING_RELATIONS` / `pairedWithSchemaId` survives in `packages/` (acceptance #13). `analysis/artifacts/00-meta/**` is the only place `paired_with_schema` / `SCHEMA_PAIRING` legitimately remains (read-only historical).
- **Barrel / exports-map consistency.** `lms/index.ts` and `package.json` `exports` must point at the new directory; a stale entry pointing at the deleted `schema-pairing/` dir would break `@repo/contracts` resolution. Both edited in Phase 2, same commit as the directory swap.
- **Prisma-client regeneration ordering.** The migrated test files type-check against the regenerated client — `db:reset` (or `db:generate`) MUST run before the Phase-1 commit, else pre-commit `turbo check-types` sees the old client and fails.
- **`onDelete` correctness.** `AlternatingGroup.block` = `Cascade` (block delete → group gone). `Schema.alternatingGroup` = `SetNull` (group delete → schema survives, `alternatingGroupId` nulled). `SetNull` is valid only because `alternatingGroupId` is nullable — confirm the field is `String?`, not `String`.
- **`db:reset` SQL checks.** `db:reset` runs `scripts/apply-sql-checks.ts`. Confirm it has no `training_schema_pairings` reference (it should not — it covers the head-coach partial index per D13). If it does, surface — do not silently edit.
- **Husky per-commit green.** Each of the 3 commits must leave `turbo check-types --filter="...[HEAD]"` green — see § 6.
- **Contract `.min(2)` boundary.** `createAlternatingGroupSchema.schemaIds.min(2)` — a 1-element array must be rejected; tests cover the boundary. The duplicate-id `.refine` — `[X, X]` must be rejected.
- **No behavioural over-reach.** This step defines the model; it must NOT add api logic, a mapper, a guard, or `AlternatingGroup` behavioural test coverage (member add/remove, dissolve-on-shrink). Those are 8.1d. If the executor feels pulled toward defining group-member-deletion behaviour — STOP, that is 8.1d.

---

## § 6 — Commit strategy (per-layer atomic; no squash trigger, per `[[husky-cross-package-squash]]`)

**Fan-out analysis.** `check-types` is `dependsOn: ["^check-types"]`.

- **Commit 1 (Phase 1, api-server)** — Prisma drop breaks exactly two consumers: `schema/admin.test.ts` + `schema-row/admin.test.ts` (`cleanupRaw.schemaPairing`). Both are fixed inside Commit 1 → the api-server tree type-checks. `packages/contracts` does not import the Prisma client, so its still-present `schema-pairing/` slice type-checks fine. `apps/**` / `api-routes` / `api-client` do not import `SchemaPairing`. Tree green.
- **Commit 2 (Phase 2, contracts)** — the `schema-pairing/` → `alternating-group/` swap. No production code imports `@repo/contracts/lms/schema-pairing` (§ 0.5), so no downstream package breaks. `contracts` self-consistent after the barrel + exports-map edits land in the same commit. Tree green.
- **Commit 3 (Phase 3, analysis)** — docs only. Tree green.

Every intermediate tree type-checks → **per-layer atomic commits, no squash**. Order 1 → 2 → 3 (Prisma anchors the model; contract follows; analysis documents). After Commit 1, the contract slice is briefly stale-but-compiling (it describes `SchemaPairing` while Prisma has `AlternatingGroup`) — acceptable per the squash rule (a _broken_ tree triggers a squash, a _semantically-stale-but-compiling_ tree does not).

**Commits:**

1. `refactor(api-server): replace schemapairing model with alternatinggroup`
   — `schema.prisma`, `seed/archetypes/rounds-ladder.ts`, `schema/admin.test.ts`, `schema-row/admin.test.ts`. Body: per-layer bullet list (model swap / seed descriptor / test migration).
2. `refactor(contracts): replace schema-pairing slice with alternating-group`
   — new `alternating-group/` (8 files), deleted `schema-pairing/` (8 files), `archetype-params.schema.ts`, `schema.schema.test.ts`, `lms/index.ts`, `package.json`.
3. `docs(analysis): sync artifacts for alternatinggroup redesign`
   — 8 `analysis/` files.
4. `docs(step-08.1c): write executor output report` — `implementation/step-08.1c/output.md`.

Commitlint: subject ≤ 100 chars, fully lowercase (no caps, including acronyms — `alternatinggroup`, not `AlternatingGroup`, in the subject); body lines ≤ 150. Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — a failing hook means a root cause to fix.

---

## § 7 — Out-of-scope / deferred (forward notes for Step 8.1d)

- **`lmsAlternatingGroupApi`** — `create` / `addMember` / `removeMember` / `delete`. Step 8.1d.
- **`addMember` / `removeMember` request-contract schemas** — defined in 8.1d alongside the api methods that consume them (this step ships only entity + `create` + `delete` + list contracts).
- **`verifyAlternatingGroupOwnership` guard** — 8.1d. Resolves ownership through the group's `block` chain; only `delete`/`addMember`/`removeMember` consume it (`create` will verify member schemas via `verifySchemaOwnership`).
- **`mapToAlternatingGroup` mapper** — 8.1d. Materialises `schemaIds` from the `schemas` relation (`include`/`select` on the Prisma query) — `AlternatingGroup` does not store member ids as a column.
- **Group lifecycle behaviour** — same-block invariant on `create`; dissolve-vs-reject when a `removeMember` (or a member-schema delete) would drop the group below 2 members; whether group members must share the `alternating-sets` archetype; `setEnumeration` tiling validation. All 8.1d (api-logic), surfaced at the 8.1d thesis.
- **contract `Schema.alternatingGroupId` exposure + `mapToSchema` change** — deferred per D-A2; future read-embed step.
- **HTTP routes / client hooks / UI** — Steps 8.2 / 8.3 / 8.4 / D11.

---

## § 8 — Verifications cheatsheet

```bash
# Phase 1 — after editing schema.prisma + seed:
pnpm --filter @repo/api-server db:reset
pnpm --filter @repo/api-server db:seed            # expect: Archetypes: 34
pnpm --filter @repo/api-server check-types        # expect: 0 errors (migrated test files compile)
pnpm --filter @repo/api-server test -- schema/admin.test.ts schema-row/admin.test.ts

# Phase 2 — after the contract slice swap:
pnpm --filter @repo/contracts check-types
pnpm --filter @repo/contracts test
pnpm --filter @repo/contracts lint

# Completeness sweep (acceptance #13):
grep -rn "SchemaPairing\|schemaPairing\|schema-pairing\|SCHEMA_PAIRING\|pairedWithSchemaId" packages/

# Root sweep before output.md:
pnpm check-types        # 16/16
pnpm lint               # 16/16, 0 warnings
pnpm test               # all packages green
pnpm dep:check          # 0 violations

# Husky enforces per commit:
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"          # pre-commit
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"  # pre-push
```

Pre-existing flake awareness: `block/admin.test.ts:406` timing assertion (FIND-002) — re-run on flake, not a regression.

---

## § 9 — Output report format (executor produces `implementation/step-08.1c/output.md`)

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

Add an explicit line: **`analysis-files touched: <list>`** (mandated by WORKFLOW.md "`analysis/` directory rules" for any schema-changing step). UI smoke-test scenario — N/A (no runtime surface).

---

## § 10 — Wrapper choice & process notes

**Wrapper**: `/feature` full. Schema change + `db:reset` + cross-package contract reshape + living-model sync — well past the `/feature small` thin-additive carve-out.

**Branch**: `feat/training-domain` (long-lived). No branch cut.

**Per-step cycle**: thesis ratified in the planner-user chat 2026-05-20 (D14 + D-A1/A2/A3 + C-A1 + decomposition; user confirmed `AlternatingGroup` naming and the single-FK membership). Jump to `/feature` Stage 1 (Research).

**Escalation**: if any step hits something the spec did not anticipate — a model question, a hidden consumer, an `apply-sql-checks` collision — STOP and surface with a hypothesis (WORKFLOW.md "Executor escalation protocol"). Do not silently adapt the model or invent behaviour. In particular, do not let scope drift into 8.1d's api/behaviour territory.

**Domain-model change protocol**: this is the schema-change sub-step. The `analysis/` sync (Phase 3) is mandatory and part of acceptance, not optional cleanup. The close-out `log/step-08.1c.md` entry records the `analysis-files touched` list and ratifies **D14** into `state/02-decisions.md`.

**Handoff after close-out**: Step 8.1d thesis cycle — `lmsAlternatingGroupApi` + `verifyAlternatingGroupOwnership` + `mapToAlternatingGroup`, against the shape this step established.

---

**End of prompt.**
