# Step 8.1d — `lmsAlternatingGroupApi` (api-server slice: create / addMember / removeMember / delete + guard + mapper)

**Wrapper**: `/feature` full pipeline. Cross-package logic change (contracts + api-server), 4 endpoint methods with group-lifecycle invariants, a guard, a mapper, and a cross-cutting change to `lmsSchemaApi.delete`. NOT `/feature small` — well past the thin-additive carve-out.

**Branch**: `feat/training-domain` long-lived. NO new branch cut (per `[[training-domain-workflow]]` + `[[always-via-feature-skill]]` branch-cut override). At handoff the branch is 6 commits ahead of `main` (Step 8.1c, local-unpushed).

**Predecessor / decomposition**: Step 8.1c shipped the `AlternatingGroup` definition layer — Prisma model, the `@repo/contracts/lms/alternating-group` slice (entity + `create`/`delete`/`list` contracts), `analysis/` sync, seed. No endpoint, no guard, no mapper. Step 8.1d is the api-server slice against that shape. Thesis ratified in the planner-user chat 2026-05-20 (two-voice; D-A4 / D-A5 / D-A6 + QA-004 / QA-005 closures ratified upfront — see § 1).

This step ships **no HTTP route and no UI** — `lmsAlternatingGroupApi` is the api-server method object; HTTP routes are Step 8.2, client hooks 8.3, UI 8.4+. There is no browser smoke-test (§ 9).

---

## § 0 — Verbatim source reads (read-at-prompt-write-time per `[[planner-verbatim-registration]]`)

All quotes are the **current** state, verified 2026-05-20. They are reference material — the deliverable shapes are described structurally in § 3, not as code skeletons (per `[[planner-strategic-level]]`). The executor re-reads precedents during `/feature` Research; § 0 records the planner-verified state and the load-bearing exact-quote files (the modified files + registration files).

### § 0.1 — Prisma: `AlternatingGroup` shape (`packages/api-server/prisma/schema.prisma`) — NOT modified this step

```prisma
enum AlternatingGroupRelation {
  ALTERNATING_SETS
}

model Schema {
  id                 String     @id @default(cuid())
  blockId            String
  parentSchemaId     String?
  alternatingGroupId String?
  order              Int
  kind               SchemaKind
  archetypeId        String
  // ... header / archetypeParams / intensity / trailingConnector / notes / timestamps ...
  block            Block             @relation(fields: [blockId], references: [id], onDelete: Cascade)
  parentSchema     Schema?           @relation("SchemaSubSchemas", fields: [parentSchemaId], references: [id], onDelete: Cascade)
  subSchemas       Schema[]          @relation("SchemaSubSchemas")
  archetype        Archetype         @relation(fields: [archetypeId], references: [id], onDelete: Restrict)
  alternatingGroup AlternatingGroup? @relation(fields: [alternatingGroupId], references: [id], onDelete: SetNull)
  rows             SchemaRow[]
  // @@index([blockId, order]) / @@index([parentSchemaId, order]) / @@index([archetypeId]) / @@index([alternatingGroupId])
}

model AlternatingGroup {
  id           String                   @id @default(cuid())
  blockId      String
  relationKind AlternatingGroupRelation
  createdAt    DateTime                 @default(now())
  updatedAt    DateTime                 @updatedAt

  block   Block    @relation(fields: [blockId], references: [id], onDelete: Cascade)
  schemas Schema[]

  @@index([blockId])
  @@map("training_alternating_groups")
}
```

Membership = the single nullable FK `Schema.alternatingGroupId` (a schema belongs to ≤1 group). `onDelete`: `AlternatingGroup.block` → `Cascade`; `Schema.alternatingGroup` → `SetNull` (deleting a **group** nulls every member's `alternatingGroupId`; deleting a **member schema** just removes that row — the FK `SetNull` does NOT fire on member-row deletion, only on group-row deletion). `Archetype` carries `name` (`alternating-sets` is one of the 34 seeded archetypes).

### § 0.2 — Contract slice `packages/contracts/src/entities/lms/alternating-group/` — current state of the 3 files this step MODIFIES

**`alternating-group.schema.ts`** (`createAlternatingGroupSchema.schemaIds` gains `.max(...)` — see § 3.1):

```ts
import { z } from "zod";

import { ALTERNATING_GROUP_RELATIONS } from "./alternating-group.constants";

export const alternatingGroupRelationSchema = z.enum(ALTERNATING_GROUP_RELATIONS);

export const alternatingGroupSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  relationKind: alternatingGroupRelationSchema,
  schemaIds: z.array(z.string().cuid()).min(2),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createAlternatingGroupSchema = z.object({
  relationKind: alternatingGroupRelationSchema,
  schemaIds: z
    .array(z.string().cuid())
    .min(2)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "schemaIds must be unique",
    }),
});
```

**`alternating-group-api.schema.ts`** (gains `addMember` / `removeMember` request + response schemas):

```ts
import { z } from "zod";

import { idParamSchema } from "../../../common";

import { alternatingGroupSchema, createAlternatingGroupSchema } from "./alternating-group.schema";

export const getAlternatingGroupsResponseSchema = z.array(alternatingGroupSchema);

export const createAlternatingGroupRequestSchema = createAlternatingGroupSchema;
export const createAlternatingGroupResponseSchema = alternatingGroupSchema;

export const deleteAlternatingGroupParamsSchema = idParamSchema;
```

**`alternating-group-api.types.ts`** (gains the new inferred types):

```ts
import { type z } from "zod";

import {
  type createAlternatingGroupRequestSchema,
  type createAlternatingGroupResponseSchema,
  type deleteAlternatingGroupParamsSchema,
  type getAlternatingGroupsResponseSchema,
} from "./alternating-group-api.schema";

export type GetAlternatingGroupsResponse = z.infer<typeof getAlternatingGroupsResponseSchema>;
export type CreateAlternatingGroupRequest = z.infer<typeof createAlternatingGroupRequestSchema>;
export type CreateAlternatingGroupResponse = z.infer<typeof createAlternatingGroupResponseSchema>;
export type DeleteAlternatingGroupParams = z.infer<typeof deleteAlternatingGroupParamsSchema>;
```

Unchanged in the slice: `index.ts` (barrel — re-exports `* from` each file, so appending exports to existing files needs no barrel edit), `alternating-group.constants.ts`, `alternating-group.types.ts` (`AlternatingGroup` / `CreateAlternatingGroupData` inferred types). `idParamSchema` is `z.object({ id: z.string().cuid() })` (`packages/contracts/src/common/params.ts`).

### § 0.3 — `lmsSchemaApi.delete` — current verbatim (`endpoints/lms/schema/admin.ts:224-234`) — MODIFIED this step (§ 3.3)

```ts
  delete: async (userId: string, schemaId: string): Promise<void> => {
    const owner = await verifySchemaOwnership(schemaId, userId);

    verifyPlanEditable(owner);

    try {
      await prisma.schema.delete({ where: { id: schemaId } });
    } catch (error) {
      return handlePrismaError(error, { entity: "Schema" });
    }
  },
```

`verifySchemaOwnership` returns `{ status, blockId, sessionId, dayId, weekId, planId, parentSchemaId, kind }` — it does **not** return `alternatingGroupId`. Do NOT extend the guard's return; resolve `alternatingGroupId` locally inside the new transaction (§ 3.3).

### § 0.4 — Canonical precedents (read in Research; pointers + characterization)

- **`lmsSchemaRowApi.create`** — `endpoints/lms/schema-row/admin.ts:33-119`. Canonical "create inside `retryOnP2034(() => prisma.$transaction(async tx => …, { isolationLevel: Serializable }))`" with in-tx plan re-check (`deletedAt` / `status === "ARCHIVED"`) and an `owner.planId !== planId` route-scope check. The shape `lmsAlternatingGroupApi.create` mirrors.
- **`lmsBlockApi.assignLabels` + `assertLabelsApplicable`** — `endpoints/lms/block/admin.ts:30-56` and `247-287`. Canonical junction-membership mutation: a module-scope `assert*Applicable(tx, ids)` helper that batch-`findMany`s, asserts existence + applicability, throws `NotFoundError` / `BadRequestError`; the mutation runs in `retryOnP2034 + $transaction(Serializable)` and returns the parent via `findUniqueOrThrow({ include })`. The membership-validation helper for `AlternatingGroup` mirrors `assertLabelsApplicable`.
- **`verifyBlockOwnership`** — `authz/lms-guards.ts:100-165`. Canonical ownership guard: resolves the `plan` through the entity → `session → day → week → plan` chain, returns `{ status, …chain… }` when `plan.creatorId === userId` OR `isAdminOrHeadCoach(ROLE_MAP[user.role])`, throws `NotFoundError` on missing/`deletedAt`, `ForbiddenError` otherwise. `verifyAlternatingGroupOwnership` mirrors it, resolving through `AlternatingGroup.block`.
- **`mapToBlockWithLabels`** — `mappers/lms/block.mapper.ts`. Canonical "map a Prisma entity with an included relation" — a module-scope `type XWithY = PrismaX & { relation: … }` plus a mapper that projects the relation. `mapToAlternatingGroup` mirrors this (project `schemas` → `schemaIds`).
- **`assertArchetypeConsistency`** — `endpoints/lms/schema/assertions.ts:6-35`. Precedent for an in-tx archetype lookup (`tx.archetype.findUnique({ select: { name, … } })`) feeding a `BadRequestError`. The `alternating-sets`-homogeneity check uses the same `archetype.name` resolution.
- Endpoint-test precedents: `endpoints/lms/block/admin.test.ts` (`assignLabels` cases — closest junction-mutation test shape), `endpoints/lms/schema/admin.test.ts` (`lmsSchemaApi` harness — `provisionBlock` helper, `cleanupRaw`, `createTestCoach`, the HEAD_COACH demote convention). Guard-test precedent: `authz/guards.test.ts`.

### § 0.5 — Registration files (verbatim per `[[planner-verbatim-registration]]`)

**`packages/api-server/src/endpoints/lms/index.ts`** — current (additive: a new `./alternating-group` line):

```ts
export * from "./_shared";
export * from "./block";
export * from "./day";
export * from "./exercise";
export * from "./label";
export * from "./plan-enrollment";
export * from "./schema-row";
export * from "./schema";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

→ insert `export * from "./alternating-group";` as the **2nd line** (after `_shared`, before `block`) — mirrors the `@repo/contracts` lms barrel, which places `alternating-group` right after `_shared`.

**`packages/api-server/src/mappers/lms/index.ts`** — current (additive: a new `./alternating-group.mapper` line):

```ts
export * from "./block.mapper";
export * from "./day.mapper";
export * from "./enum-maps";
export * from "./exercise.enum-maps";
export * from "./exercise.mapper";
export * from "./label.mapper";
export * from "./plan-enrollment.mapper";
export * from "./schema-row.mapper";
export * from "./schema.mapper";
export * from "./session.mapper";
export * from "./training-plan.mapper";
export * from "./week.mapper";
```

→ insert `export * from "./alternating-group.mapper";` as the **1st line** (alpha — before `block.mapper`).

**`packages/api-server/src/authz/guards.ts`** — current (the barrel every endpoint imports as `from "../../../authz/guards"`):

```ts
export * from "./role-guards";
export * from "./lms-guards";
```

→ if the `lms-guards.ts` split (§ 0.6 / § 3.2) produces new file(s), add `export * from "./<new-file>";` here. Importers use the barrel — a barrel-internal split is invisible to them.

`@repo/contracts/package.json` `exports` and `packages/contracts/src/entities/lms/index.ts` — `./lms/alternating-group` is **already registered** (Step 8.1c). 8.1d adds exports **inside** existing slice files (`alternating-group-api.schema.ts` etc.), which the slice's own `index.ts` already re-exports via `export *` — **no `package.json` / lms-barrel edit needed.**

### § 0.6 — utils / types signatures + the `lms-guards.ts` size constraint

- `retryOnP2034<T>(fn: () => Promise<T>, options?: RetryOnP2034Options): Promise<T>` — `utils/retry-on-p2034.ts`. Retries the closure on Prisma `P2034`; exhaustion → `ServiceUnavailableError`.
- `handlePrismaError(error: unknown, context: { entity: string; field?: string }): never` — `utils/prisma-error-handler.ts`. Maps `P2002`→`ConflictError`, `P2003`→`BadRequestError`, `P2025`→`NotFoundError`, `P2034`→`ConflictError`, `ZodError`→`InternalServerError` (DbCorruption); rethrows the rest.
- `TxClient` — `endpoints/lms/_shared` (`Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">`). The type for an interactive-tx client passed to a helper.
- **REVIEW-I3**: `authz/lms-guards.ts` is **331 physical lines**; eslint `base.js:72` sets `max-lines: ["error", { max: 300, skipBlankLines: true, skipComments: true }]` → ~293 logical LOC, ~7-line headroom. Appending `verifyAlternatingGroupOwnership` (~40 logical lines, mirroring `verifyBlockOwnership`) trips the rule. The executor **splits `lms-guards.ts`** — the split axis (by hierarchy depth, by entity family, …) is the executor's tactical call; new file(s) join the `authz/guards.ts` barrel (§ 0.5). Pre-commit `pnpm lint` runs `--max-warnings 0`; the split is mandatory, not optional. No planner pre-work — non-surprising scope note for the close-out.

### § 0.7 — Hooks & turbo (commit-strategy inputs, per `[[husky-cross-package-squash]]`)

- `.husky/pre-commit`: `check-secrets` → `lint-staged` → `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"`.
- `.husky/pre-push`: `pnpm dep:check` → `SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"`.
- `turbo.json`: `check-types` / `lint` both `dependsOn: ["^…"]`; `test: { cache: false }`.

**Fan-out** — see § 6. Summary: per-layer atomic commits, **no squash trigger** — every intermediate tree type-checks (contract additions are additive; api-server consumes them only in the next commit).

### § 0.8 — Analysis citations (domain semantics, per `[[coach-pov-first]]`)

- **`05-synthesis/domain-model.md` §3.1** (archetype table) + **§7** (entity census): `alternating-sets` archetype, `archetype_params = { set_enumeration: int[] }`; group membership is the `AlternatingGroup` entity. §7 — "`AlternatingGroup` — block-scoped N-ary grouping entity для `alternating-sets` archetype — объединяет 2..N member schemas в один чередующийся цикл, без потолка участников."
- **`06-formalization/stress-final.md` §2.20** — block-009, the sole empirical sample: an `AlternatingGroup` of 2 schemas, both `kind=ATOMIC`, both `archetype=alternating-sets`, both top-level (`parentSchemaId` absent), `setEnumeration=[1,3,5]` / `[2,4,6]`.
- **`06-formalization/implementation-notes.md` §4.9** — the `AlternatingGroup` canonical-shape record (D14). C-A1: "the contract `schemaIds` array is therefore an **unordered set**." `domain-model.md §7` and `edge-cases.md §6.5` both delegate to §4.9 for the canonical shape.
- Across all three: `AlternatingGroup` is consistently coupled to the `alternating-sets` archetype — every member schema in every example carries `archetype=alternating-sets`. This grounds D-A6 (homogeneity); no source mandates cross-member `setEnumeration` tiling validation, which grounds D-A5.

---

## § 1 — Goal & ratified decisions

### Coach view

**Walkthrough.** Денис программирует блок в редакторе плана (`apps/platform/.../plan-detail/`, недельный вид → сессия → блок). Упражнение в блоке он разложил на «плитки» подходов: одна схема — подходы 1·3·5 (тяжёлые синглы), вторая — 2·4·6 (объёмные на скорость). Денис выделяет обе карточки-схемы и жмёт «сгруппировать как чередующиеся подходы» — карточки стягиваются общей скобкой с бейджем «Чередование», и атлет позже понимает, что подходы идут вперемешку. Дальше он либо докидывает третью плитку в ту же скобку, либо вытаскивает плитку обратно в самостоятельную схему (и если в скобке осталась одна — скобка тихо распускается), либо сносит всю чередующуюся конструкцию. Сама скобка-UI приедет на Step 8.4+; Step 8.1d ставит серверный слой под эти четыре жеста — создать группу, добавить участницу, убрать участницу, удалить группу — и держит инвариант «в группе всегда ≥2 плитки» при любом пути.

**Goal.** После 8.1d сервер умеет: связать 2..N схем `alternating-sets` одного блока в одну группу; добавить/убрать участницу по одной; удалить группу. Группа никогда не существует с <2 участницами — при сжатии ниже двух она распускается, оставшиеся схемы живут самостоятельно. Ни одного HTTP-маршрута и ни одного экрана этот шаг не добавляет — это api-server-слой.

### Developer view

Ship the `lmsAlternatingGroupApi` api-server slice against the `AlternatingGroup` shape Step 8.1c established:

- **`lmsAlternatingGroupApi`** — `create` (bulk, 2..N members) / `addMember` / `removeMember` / `delete`.
- **`verifyAlternatingGroupOwnership`** guard — resolves ownership through the group's `block → session → day → week → plan` chain.
- **`mapToAlternatingGroup`** mapper — projects the included `schemas` relation into the contract `schemaIds` array.
- **`addMember` / `removeMember` contract schemas** — request + response, added to the existing `alternating-group/` slice; `createAlternatingGroupSchema.schemaIds` gains a `.max()` cap.
- **`lmsSchemaApi.delete`** becomes group-aware — deleting a member schema dissolves its group if that drops the group below 2 members (the D-A4 scope expansion).

No read method (`get` / `list`): the read surface is Step 8.3.5 (D-A2). All group-cardinality-changing operations run under `Serializable` + `retryOnP2034`, mirroring `lmsSchemaRowApi.create`.

### § 1.x — Ratified decisions

Carried from Step 8.1c (the `AlternatingGroup` definition layer): **D14** (`SchemaPairing` → `AlternatingGroup` N-ary redesign), **D-A1** (Prisma shape + `onDelete`), **D-A2** (contract `Schema` not extended — group membership read via a future embed, not 8.1d), **D-A3** (naming), **C-A1** (no member-order column; `schemaIds` is an unordered set). Full bodies in `state/02-decisions.md`.

Ratified in the Step 8.1d thesis cycle (planner-user chat 2026-05-20):

- **D-A4 (dissolve-on-shrink-below-2; `lmsSchemaApi.delete` scope expansion).** An `AlternatingGroup` is structurally invalid with <2 members (the contract enforces `schemaIds.min(2)`; a 1-member "alternating" group is semantically empty). When an operation would drop a group below 2 members, the group **dissolves** — the group row is deleted, every remaining member's `alternatingGroupId` is nulled via the existing `onDelete: SetNull`, the schemas survive as standalone. Reject-with-error was considered and rejected: it strands the coach with a 2-member bracket that `removeMember` cannot shrink, forcing a separate "delete group" action. Exactly **two** operations reduce group cardinality: `removeMember` (in this step's `lmsAlternatingGroupApi`) and **member-schema deletion** via `lmsSchemaApi.delete` (pre-existing, currently a bare `prisma.schema.delete`). The invariant must hold after **both** → **8.1d expands to make `lmsSchemaApi.delete` group-aware**. This is the `[[planner-mutation-invariant-trace]]` discipline (flavour h, precedent Step 7.3.6): a constraint half-enforced is a latent bug — an un-dissolved 1-member orphan group would fail `alternatingGroupSchema.parse` (`.min(2)`) at the next read. Consequence: `removeMember`'s response is **nullable** — `AlternatingGroup | null`, `null` = the group dissolved.
- **D-A5 (`setEnumeration` tiling is NOT API-enforced).** Members carry `setEnumeration` (which set ordinals each tile covers — `[1,3,5]` / `[2,4,6]`). The API does **not** validate that members' `setEnumeration` arrays partition a contiguous set sequence (disjoint + gap-free). Rationale: a group is built incrementally (one `addMember` at a time) — between additions it cannot tile anything whole, so a hard check would break stepwise construction; and no "total set count" is stored anywhere to validate against. The API enforces **structural** invariants (same block, ≥2 members, archetype homogeneity, ≤1 group per schema); set-coverage **completeness** is the coach's editorial responsibility, surfaced later by the plan editor as a soft warning, never an API reject. No `analysis/` source mandates tiling validation (`[[coach-pov-first]]` — absence of citation → do not invent the rule).
- **D-A6 (members are top-level block schemas only).** Every member schema must have `parentSchemaId === null`. The `alternating-sets` examples in `analysis/` (block-009) are all top-level; `AlternatingGroup` is itself block-scoped; restricting members to top-level keeps the invariant clean. Nested sub-schema alternation is not in the analysis — if it ever surfaces it is an additive extension, not 8.1d scope.
- **D-A6.1 (archetype homogeneity).** Every member schema must have `archetype.name === "alternating-sets"`. `analysis/` consistently couples `AlternatingGroup` to that archetype (§ 0.8); a member without it has no `setEnumeration` and cannot participate. `create` and `addMember` assert this.
- **QA-004 closed — `createAlternatingGroupSchema.schemaIds` gains `.max(24)`.** The Step 8.1c carry-forward (no upper bound on the create array) is closed by a generous cap: a realistic alternating group has 2–6 members and is structurally bounded by the same-block check (a group ⊆ the block's schemas); 24 is far above any plausible case yet bounds the cuid-array parse cost at the HTTP boundary before the same-block check runs. The cap goes on the **create request** only; the **entity** `alternatingGroupSchema.schemaIds` keeps no `.max()` — it must accept whatever the server legitimately produced (an output schema is not an input guard). `addMember` needs no array cap (single member; same-block bounds the total).
- **QA-005 closed — no mirror `.refine` on `alternatingGroupSchema`.** The Step 8.1c carry-forward (the entity schema tolerates duplicate `schemaIds`) is closed as a non-issue: `mapToAlternatingGroup` derives `schemaIds` as `schemas.map(s => s.id)` over a Prisma relation — a set of distinct rows by construction, duplicates impossible. QA-005's condition ("if the mapper assembles `schemaIds` with non-trivial logic") is not met; a `.refine` that can never fire is dead validation — not added.

---

## § 2 — Scope / Inputs

### Files CREATED

- `packages/api-server/src/endpoints/lms/alternating-group/admin.ts` — `lmsAlternatingGroupApi`.
- `packages/api-server/src/endpoints/lms/alternating-group/index.ts` — slice barrel (`export * from "./admin"`).
- `packages/api-server/src/endpoints/lms/alternating-group/admin.test.ts` — endpoint tests.
- `packages/api-server/src/mappers/lms/alternating-group.mapper.ts` — `mapToAlternatingGroup`.
- Optionally `packages/api-server/src/endpoints/lms/alternating-group/assertions.ts` — membership-validation helper(s), if the executor follows the `schema/` + `schema-row/` convention (vs. inline à la `block/admin.ts`'s `assertLabelsApplicable`) — executor's tactical call.
- 1+ new file(s) split out of `authz/lms-guards.ts` (REVIEW-I3) — count + names are the executor's tactical call.

### Files MODIFIED

- `packages/contracts/src/entities/lms/alternating-group/alternating-group.schema.ts` — `.max(24)` on `createAlternatingGroupSchema.schemaIds`.
- `packages/contracts/src/entities/lms/alternating-group/alternating-group-api.schema.ts` — `addMember` / `removeMember` request + response schemas.
- `packages/contracts/src/entities/lms/alternating-group/alternating-group-api.types.ts` — the new inferred types.
- `packages/contracts/src/entities/lms/alternating-group/alternating-group.schema.test.ts` — `.max(24)` boundary cases.
- `packages/contracts/src/entities/lms/alternating-group/alternating-group-api.schema.test.ts` — `addMember` / `removeMember` schema cases.
- `packages/api-server/src/authz/lms-guards.ts` — add `verifyAlternatingGroupOwnership`; split the file per REVIEW-I3.
- `packages/api-server/src/authz/guards.ts` — barrel: add the split file(s).
- `packages/api-server/src/authz/guards.test.ts` — `verifyAlternatingGroupOwnership` coverage.
- `packages/api-server/src/mappers/lms/index.ts` — add `./alternating-group.mapper`.
- `packages/api-server/src/endpoints/lms/index.ts` — add `./alternating-group`.
- `packages/api-server/src/endpoints/lms/schema/admin.ts` — `lmsSchemaApi.delete` group-aware (§ 3.3).
- `packages/api-server/src/endpoints/lms/schema/admin.test.ts` — the dissolve-on-member-delete test.
- `analysis/artifacts/06-formalization/implementation-notes.md` — a §4.10 addendum (§ 3.4).

### Files / areas NOT touched (out of scope)

- `packages/contracts` `package.json` `exports` + `lms/index.ts` barrel — `./lms/alternating-group` already registered (8.1c); 8.1d only appends inside slice files.
- `getAlternatingGroupsResponseSchema` + any `get` / `list` api method — the read surface is Step 8.3.5 (D-A2); leave the existing list contract schema untouched and unconsumed.
- Contract `schemaSchema` / `mapToSchema` / `Schema.alternatingGroupId` exposure — D-A2, future read-embed step.
- `lmsSchemaApi.create` / `.update` / `.reorder`, all of `lmsSchemaRowApi`, other guards/mappers — only `lmsSchemaApi.delete` changes.
- The QA-W1 in-tx `plan.deletedAt` re-check for `lmsSchemaApi.delete` — a separate deferred `/fix`; the § 3.3 change is strictly the group-aware addition, nothing else.
- The QA-E3 `userId === undefined` propagation — `verifyAlternatingGroupOwnership` mirrors its 4 sibling guards exactly, including that known behavior; the uniform fix is the deferred cross-guard `/fix`. Do NOT add a one-off `userId` check that diverges from the siblings.
- HTTP routes / client hooks / UI — Steps 8.2 / 8.3 / 8.4.
- Prisma schema — unchanged; 8.1d is api logic over the 8.1c model. The `analysis/` shape files (`schema.prisma`, `types.ts`, `er-final.md`, stress files) — unchanged (no relations/shape change); only `implementation-notes.md` gets the operational-semantics addendum.

---

## § 3 — Phases (spec-only — structural descriptions, no code skeletons)

The shapes below are specifications. Read the cited canonical siblings (§ 0.4) and mirror their formatting / idiom; write the actual code per project convention. No code comments (per project rules).

### § 3.1 — Phase 1: contract additions

**Goal.** Extend the `alternating-group/` slice with the `addMember` / `removeMember` operation schemas and the `create`-array `.max()` cap. Purely additive within registered files.

**Operations:**

1. **`alternating-group.schema.ts`** — add `.max(24)` to `createAlternatingGroupSchema.schemaIds`. **Placement matters**: `.max()` is a `ZodArray` method; `.refine()` returns a `ZodEffects` (no `.max()`). Insert `.max(24)` into the chain **between `.min(2)` and `.refine(...)`** (`[[planner-lint-impact-trace]]` — the chain order is load-bearing for type-checking). The entity `alternatingGroupSchema.schemaIds` stays as-is (no cap — QA-004 ratified).
2. **`alternating-group-api.schema.ts`** — add:
   - A request schema validating a member reference — an object carrying `schemaId` (a cuid). It is the input both `addMember` and `removeMember` operations need. Define it once; reuse (or alias) for both. Mirror the `idParamSchema`/`createAlternatingGroupRequestSchema` idiom already in the file.
   - `addMember` response schema = `alternatingGroupSchema`.
   - `removeMember` response schema = `alternatingGroupSchema` **nullable** (`null` = the group dissolved — D-A4). Use `.nullable()`.
   - Naming: mirror the existing `create…RequestSchema` / `create…ResponseSchema` / `get…ResponseSchema` convention.
   - The route shape (member id as path param vs. body) is **Step 8.2's** call — 8.1d defines schemas at operation granularity; 8.2 maps them to HTTP.
3. **`alternating-group-api.types.ts`** — add the inferred `z.infer<>` types for every schema added in op 2, mirroring the existing block of type aliases.
4. **`alternating-group.schema.test.ts`** — add `createAlternatingGroupSchema` boundary cases for the cap: a 24-element `schemaIds` accepted, a 25-element rejected. (The existing `.min(2)` / duplicate-`.refine` cases stay.)
5. **`alternating-group-api.schema.test.ts`** — add cases for the new schemas: the member-ref request accepts a cuid `schemaId` and rejects a missing/non-cuid one; `addMember` response = `alternatingGroupSchema`; `removeMember` response accepts both a valid group object **and** `null`.

**Commit 1**: `feat(contracts): add alternating-group member operation schemas`.

### § 3.2 — Phase 2: api-server `AlternatingGroup` vertical (guard + mapper + endpoint)

**Goal.** The `lmsAlternatingGroupApi` slice, its ownership guard, and its mapper — registered and tested.

**3.2.a — `verifyAlternatingGroupOwnership` guard** (`authz/lms-guards.ts`, mirroring `verifyBlockOwnership`):

- Signature: `(groupId: string, userId: string) => Promise<{ status, blockId, sessionId, dayId, weekId, planId }>`.
- Resolve the group's `block → session → day → week → plan` chain in one `findUnique`. Missing group, or `plan.deletedAt !== null` → `NotFoundError`. `plan.creatorId === userId` OR `isAdminOrHeadCoach(ROLE_MAP[user.role])` → return the resolved chain (including the group's own `blockId`) with `status = TRAINING_PLAN_STATUS_MAP[plan.status]`. Otherwise → `ForbiddenError`. Mirror `verifyBlockOwnership` exactly, including the two-stage creator-then-role check.
- **Split `lms-guards.ts`** per REVIEW-I3 (§ 0.6) — tactical; add the new file(s) to the `authz/guards.ts` barrel.
- Tests in `authz/guards.test.ts`: owner coach OK; non-owner coach → `ForbiddenError`; admin / head-coach → OK; missing group → `NotFoundError`; soft-deleted plan → `NotFoundError`. Mirror the `verifyBlockOwnership` test block.

**3.2.b — `mapToAlternatingGroup` mapper** (`mappers/lms/alternating-group.mapper.ts`, mirroring `mapToBlockWithLabels`):

- Input: a Prisma `AlternatingGroup` with the `schemas` relation included — define a module-scope `type …WithSchemas = PrismaAlternatingGroup & { schemas: { id: string }[] }`.
- Output: the contract `AlternatingGroup` — `{ id, blockId, relationKind, schemaIds: schemas.map(s => s.id), createdAt, updatedAt }`.
- `relationKind` — direct pass-through: the Prisma enum `AlternatingGroupRelation` and the contract enum are string-identical (mirrors `mapToSchema`'s `kind` pass-through, not an enum-map).
- `AlternatingGroup` has **no Json columns** → unlike `mapToSchema` / `mapToBlock`, the mapper does **no** Zod `.parse()` — it is a pure projection.
- The `schemas` include must be ordered (`orderBy: { order: "asc" }`) wherever it is queried, so `schemaIds` is deterministic across responses and tests — the array is semantically unordered (C-A1), but a stable order keeps output deterministic (mirrors `mapToBlockWithLabels` sorting `labelAssignments` by `order`).
- Register in `mappers/lms/index.ts` (§ 0.5).

**3.2.c — `lmsAlternatingGroupApi`** (`endpoints/lms/alternating-group/admin.ts`):

All four methods: catch in `handlePrismaError(error, { entity: "AlternatingGroup" })`. `create` / `addMember` / `removeMember` run their writes inside `retryOnP2034(() => prisma.$transaction(async (tx) => …, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))` (mirror `lmsSchemaRowApi.create`). The membership-validation logic (existence, same-block, top-level, `alternating-sets` homogeneity, not-already-grouped) belongs in an `assert…`-style helper taking a `TxClient` (mirror `assertLabelsApplicable`); whether it lives in a sibling `assertions.ts` or inline is tactical.

- **`create(userId, planId, data: CreateAlternatingGroupData): Promise<AlternatingGroup>`** — `data = { relationKind, schemaIds }` (2..24, unique — Zod-enforced).
  - Verify ownership of **every** member schema via `verifySchemaOwnership`; each `owner.planId` must equal `planId` (mirror `lmsSchemaRowApi.create`'s `owner.planId !== planId` → `NotFoundError`). `verifyPlanEditable` on the plan.
  - In-tx: re-check the plan (`deletedAt` / `status === "ARCHIVED"` — mirror `lmsSchemaRowApi.create`). Re-fetch all member schemas (`findMany` by `id IN schemaIds`, selecting `id`, `blockId`, `parentSchemaId`, `alternatingGroupId`, `archetype: { select: { name } }`). Assert: all `schemaIds` resolved (`findMany` count matches `schemaIds.length` — else `NotFoundError`: a member vanished between the ownership check and the transaction); **every** schema `parentSchemaId === null` (D-A6 — else `BadRequestError`); **every** `archetype.name === "alternating-sets"` (D-A6.1 — else `BadRequestError`); **every** `alternatingGroupId === null` (not already in a group — else `BadRequestError`; otherwise the `connect` would silently steal a schema from another group, possibly orphaning it); **all** `blockId` equal (the same-block invariant — else `BadRequestError`). Derive the group's `blockId` from the (now-uniform) member `blockId`.
  - Create the `AlternatingGroup` and link all members atomically (`relationKind`, `blockId`, `schemas: { connect }`), then return it with the ordered `schemas` include → `mapToAlternatingGroup`.
- **`addMember(userId, groupId: string, schemaId: string): Promise<AlternatingGroup>`**:
  - `verifyAlternatingGroupOwnership(groupId, userId)` → `{ status, blockId, planId }`. `verifyPlanEditable`. `verifySchemaOwnership(schemaId, userId)` — must reach the same plan.
  - In-tx: re-fetch the schema. If its `alternatingGroupId === groupId` → `BadRequestError` ("already a member"). If `alternatingGroupId` is some other group → `BadRequestError` ("schema belongs to another group"). Assert `parentSchemaId === null` (D-A6), `archetype.name === "alternating-sets"` (D-A6.1), `blockId === group.blockId` (same-block — D-A6's sibling invariant). Set `alternatingGroupId = groupId`. Return the group with the ordered `schemas` include → `mapToAlternatingGroup`.
- **`removeMember(userId, groupId: string, schemaId: string): Promise<AlternatingGroup | null>`**:
  - `verifyAlternatingGroupOwnership` → `{ status }`. `verifyPlanEditable`.
  - In-tx: confirm the schema is a member (`alternatingGroupId === groupId`) — else `BadRequestError`. Count the group's current members. If removing one would leave fewer than 2 — i.e. the current count is **≤2** — **dissolve**: `tx.alternatingGroup.delete({ where: { id: groupId } })` — `onDelete: SetNull` nulls every remaining member's `alternatingGroupId`; return `null`. (The `≤2` rather than `=2` also covers a degenerate already-sub-2 group defensively.) Otherwise — count **≥3** — set this one schema's `alternatingGroupId = null`; return the group with the ordered `schemas` include → `mapToAlternatingGroup`.
- **`delete(userId, groupId: string): Promise<void>`**:
  - `verifyAlternatingGroupOwnership` → `{ status }`. `verifyPlanEditable`. `prisma.alternatingGroup.delete({ where: { id: groupId } })` — a single statement (no tx needed; `onDelete: SetNull` nulls every member's `alternatingGroupId`, the schemas survive ungrouped — this is the canonical "delete = unlink, schemas survive" per § 4.9 / D-A1).

Method signatures mirror the closest `lmsSchema*Api` precedents: `create` is plan-scoped (`planId` param, like `lmsSchemaRowApi.create`); `addMember` / `removeMember` / `delete` are addressed by `groupId` (no `planId` param, like `lmsSchemaApi.delete`) — the group id resolves the plan. Step 8.2 owns the HTTP route shape.

Create the `endpoints/lms/alternating-group/index.ts` barrel (`export * from "./admin"`) and register it in `endpoints/lms/index.ts` (§ 0.5).

**3.2.d — endpoint tests** (`endpoints/lms/alternating-group/admin.test.ts`) — cover the § 5 adversarial axes for all four methods. Provisioning mirrors `schema/admin.test.ts` (`createTestCoach`, `provisionBlock`, `cleanupRaw`); `alternating-sets` schemas are created via `lmsSchemaApi.create` or `cleanupRaw` (tactical). Honour the HEAD_COACH demote convention (`03-deferred.md` Standing context) for any `HEAD_COACH` fixture. Group rows need no explicit teardown — `AlternatingGroup.block onDelete: Cascade` means `provisionBlock`'s block delete removes them.

**Commit 2**: `feat(api-server): add lmsalternatinggroupapi with ownership guard and mapper`.

### § 3.3 — Phase 3: `lmsSchemaApi.delete` group-aware dissolution (D-A4 scope expansion)

**Goal.** Deleting a member schema must dissolve its group when that drops the group below 2 members — otherwise a 1-member orphan group reaches `mapToAlternatingGroup` → `alternatingGroupSchema.parse` fails `.min(2)` → 500.

**Operations** — in `endpoints/lms/schema/admin.ts`, change **only** `lmsSchemaApi.delete` (§ 0.3 is the current verbatim):

- Keep the `verifySchemaOwnership` + `verifyPlanEditable` prelude.
- Wrap the deletion in `retryOnP2034(() => prisma.$transaction(async (tx) => …, { isolationLevel: Serializable }))`. Inside the tx: read the target schema's `alternatingGroupId`; delete the schema; **if** it had an `alternatingGroupId`, count the group's now-remaining members (`tx.schema.count({ where: { alternatingGroupId } })`) and, if `< 2`, `tx.alternatingGroup.delete({ where: { id: alternatingGroupId } })` (the surviving member, if any, is nulled by `onDelete: SetNull`).
- **The `alternatingGroupId` read MUST be inside this Serializable tx** — not a separate pre-read. Race: a concurrent `addMember` could set `alternatingGroupId` between an out-of-tx read and the delete; an out-of-tx read sees `null`, skips dissolution, and orphans the group. Inside one Serializable tx, SSI detects the read-write overlap → `P2034` → `retryOnP2034` re-runs against the committed state. `retryOnP2034` + the count read also cover concurrent deletes of two members of the same 3-member group (both must not independently conclude "still ≥2").
- Keep `handlePrismaError(error, { entity: "Schema" })`.
- This change is **strictly** the group-aware addition. Do NOT also add the QA-W1 in-tx `plan.deletedAt` re-check (separate deferred `/fix`). Do NOT touch `lmsSchemaApi.create` / `.update` / `.reorder`.
- Note: grouped schemas are `alternating-sets` (`kind = ATOMIC`, top-level) — an ATOMIC schema has no `subSchemas`, so the `Schema.subSchemas` cascade never interacts with group membership; the dissolution logic only concerns the directly-deleted schema's own `alternatingGroupId`.

**Test** (`endpoints/lms/schema/admin.test.ts`): delete a member of a 3-member group → group survives with 2 members; delete a member of a 2-member group → group row gone, the other schema's `alternatingGroupId` nulled, the schema itself alive; delete an ungrouped schema → unchanged behaviour. Group setup via `cleanupRaw.alternatingGroup` or `lmsAlternatingGroupApi` (tactical).

**Commit 3**: `feat(api-server): dissolve alternating group when a member schema is deleted`.

### § 3.4 — Phase 4: `analysis/` living-source sync

**Goal.** Record the 8.1d-ratified operational semantics in the living domain model — per WORKFLOW.md "`analysis/` directory rules" ("`domain-model.md` … if entity semantics change"). 8.1d establishes operational entity semantics (dissolve-below-2, homogeneity, same-block, top-level-only, tiling-not-enforced); these belong in the living source.

**Operations** — `analysis/artifacts/06-formalization/implementation-notes.md`: add a **§4.10 addendum** ("Step 8.1d — `AlternatingGroup` operational semantics"), mirroring the style of the existing §4.8 / §4.9 addenda. Record concisely: the four structural invariants enforced by `lmsAlternatingGroupApi` (same block; ≥2 members — dissolve below 2; `alternating-sets` archetype homogeneity; top-level members only; ≤1 group per schema); that `setEnumeration` tiling is deliberately **not** API-validated (coach editorial responsibility); and that member-schema deletion dissolves a sub-2 group via `lmsSchemaApi.delete`. Cite D-A4 / D-A5 / D-A6 / D-A6.1.

Read the file in full before editing; §4.9 ends with the line handing off to 8.1d — §4.10 is its natural continuation. `domain-model.md §7` and `edge-cases.md §6.5` already delegate to implementation-notes.md for the canonical shape — they need no edit. The `analysis/` shape files (`schema.prisma`, `types.ts`, `er-final.md`, stress files) are unchanged — 8.1d changes no relations or field shapes.

**Commit 4**: `docs(analysis): record alternatinggroup operational semantics for step 8.1d`.

---

## § 4 — Acceptance criteria

1. ✅ `createAlternatingGroupSchema.schemaIds` has `.max(24)`, chained before `.refine(...)`; the entity `alternatingGroupSchema.schemaIds` has no `.max()`.
2. ✅ `alternating-group-api.schema.ts` exports an `addMember` / `removeMember` member-ref request schema, an `addMember` response (`alternatingGroupSchema`), and a `removeMember` response (`alternatingGroupSchema` nullable). `alternating-group-api.types.ts` has the matching inferred types.
3. ✅ Contract tests cover: `.max(24)` boundary (24 OK / 25 rejected); the member-ref request (cuid OK / missing rejected); `removeMember` response accepting a group object **and** `null`.
4. ✅ `verifyAlternatingGroupOwnership` added — resolves through `block → session → day → week → plan`; returns `{ status, blockId, sessionId, dayId, weekId, planId }`; `NotFoundError` / `ForbiddenError` semantics mirror `verifyBlockOwnership`. Covered in `guards.test.ts`.
5. ✅ `lms-guards.ts` split so eslint `max-lines` passes; new file(s) joined to the `authz/guards.ts` barrel; every importer still resolves via `from "../../../authz/guards"`.
6. ✅ `mapToAlternatingGroup` added + registered in `mappers/lms/index.ts`; projects an included `schemas` relation to `schemaIds`; no Zod `.parse()`; `relationKind` pass-through.
7. ✅ `lmsAlternatingGroupApi` exports `create` / `addMember` / `removeMember` / `delete` with the § 3.2.c signatures + return types (`removeMember` → `AlternatingGroup | null`); slice barrel created + registered in `endpoints/lms/index.ts`.
8. ✅ `create` enforces: every member owned + in `planId`; all same block; all top-level; all `alternating-sets`; none already grouped; ≥2 members. Runs under `Serializable` + `retryOnP2034`.
9. ✅ `addMember` / `removeMember` enforce the same-block / homogeneity / top-level / membership invariants; `removeMember` dissolves the group (returns `null`) when it would drop below 2. Both under `Serializable` + `retryOnP2034`.
10. ✅ `delete` removes the group; member schemas survive with `alternatingGroupId` nulled.
11. ✅ `lmsSchemaApi.delete` dissolves a member schema's group when deletion drops it below 2; the `alternatingGroupId` read + the delete share one `Serializable` transaction wrapped in `retryOnP2034`; `create` / `update` / `reorder` untouched.
12. ✅ `endpoints/lms/alternating-group/admin.test.ts` + the `schema/admin.test.ts` dissolution test cover the § 5 axes.
13. ✅ `implementation-notes.md` gains the §4.10 addendum; no other `analysis/` file changed; `analysis/artifacts/00-meta/**` untouched.
14. ✅ No `get` / `list` api method added; `getAlternatingGroupsResponseSchema` untouched; contract `Schema` / `mapToSchema` untouched (D-A2).
15. ✅ `pnpm check-types` (root) — 16/16.
16. ✅ `pnpm lint` (root) — 16/16, 0 warnings.
17. ✅ `pnpm test` (root) — all packages pass.
18. ✅ `pnpm dep:check` — 0 violations.
19. ✅ Husky pre-commit + pre-push clean on every commit. Zero `--no-verify` / `--no-edit` / `--no-gpg-sign`.
20. ✅ Per-layer atomic commits per § 6; no squash.
21. ✅ `git diff <start>..HEAD` — changes confined to the § 2 file list; `apps/**`, `api-routes`, `api-client`, Prisma schema show 0 lines.

---

## § 5 — Adversarial pass (per `[[planner-adversarial-review]]`)

Axes the endpoint tests must cover. Concurrency correctness is by-design — `Serializable` + `retryOnP2034` mirrors the shipped, already-tested `lmsBlockApi` / `lmsSchemaRowApi` patterns; no flaky real-concurrency test is mandated, but if one is written, use the SSI pre-materialize discipline (`[[postgres-ssi-upsert-unique-key]]`). The api-server suite runs serial (`[[api-server-serial-tests]]`).

- **`create` — input degeneracy**: empty / 1-element `schemaIds` (Zod `.min(2)`); 25-element (Zod `.max(24)`); duplicate ids (Zod `.refine`). Non-existent schema id → `NotFoundError` (`verifySchemaOwnership`). Schema in a different plan → `owner.planId !== planId` → `NotFoundError`.
- **`create` — structural rejects**: members spanning two blocks → `BadRequestError` (same-block); a member that is a sub-schema (`parentSchemaId !== null`) → `BadRequestError` (D-A6); a member whose archetype ≠ `alternating-sets` → `BadRequestError` (D-A6.1); a member already in another group → `BadRequestError` (not-already-grouped — otherwise the `connect` silently steals it).
- **`create` — concurrency**: two `create` calls sharing a member schema — SSI write-write on that `Schema.alternatingGroupId` row → `P2034` → `retryOnP2034` → the retry sees `alternatingGroupId !== null` → `BadRequestError`. No double-membership, no silent steal.
- **`addMember`**: schema already a member of this group → `BadRequestError` ("already a member"); schema in another group → `BadRequestError`; cross-block schema → `BadRequestError`; non-`alternating-sets` / sub-schema → `BadRequestError`; non-existent group → `NotFoundError` (guard); non-existent schema → `NotFoundError`. Concurrent `addMember` of the same schema into two groups → SSI → one `P2034`-retries → loses → `BadRequestError`.
- **`removeMember`**: schema not a member → `BadRequestError`; remove from a 3-member group → member nulled, group survives at 2, returns the group; remove from a 2-member group → group row deleted, **both** schemas nulled, returns `null`; concurrent `removeMember` of two members of a 3-member group → SSI → one `P2034`-retries → the retry sees count 2 → dissolves correctly (the invariant cannot be bypassed by interleaving).
- **`delete`**: happy path — group gone, all members survive `alternatingGroupId`-nulled; non-existent group → `NotFoundError`; non-owner coach → `ForbiddenError`.
- **`lmsSchemaApi.delete`**: delete an ungrouped schema → behaviour unchanged; delete a member of a 3-group → group survives at 2; delete a member of a 2-group → group dissolved, the other member survives nulled; delete-member racing `addMember` on the same group → the read+delete being in one Serializable tx forces SSI to serialize them (no orphan).
- **Ownership / plan state — every method**: non-owner coach → `ForbiddenError`; admin / head-coach → allowed; archived plan → `verifyPlanEditable` → `ForbiddenError`; soft-deleted plan → `NotFoundError` (guard).
- **Mapper determinism**: `mapToAlternatingGroup` over a group whose members were inserted out of `order` → `schemaIds` is `order`-ascending and stable across repeated reads.

---

## § 6 — Commit strategy (per-layer atomic; no squash, per `[[husky-cross-package-squash]]`)

**Fan-out analysis.** `check-types` / `lint` are `dependsOn: ["^…"]`.

- **Commit 1 (contracts)** — additive: new exports inside already-registered slice files + `.max(24)`. `@repo/contracts` self-consistent. api-server (a dependent) is unchanged at this commit — it does not yet import the new schemas — so it still type-checks against the additive contract. Tree green.
- **Commit 2 (api-server vertical)** — guard + mapper + `lmsAlternatingGroupApi` + barrels + tests. Consumes the contract schemas from Commit 1 (present) and the Prisma `AlternatingGroup` (present since 8.1c). The `lms-guards.ts` split is barrel-internal — importers unaffected. Tree green.
- **Commit 3 (api-server `lmsSchemaApi.delete`)** — modifies one existing function; references only the Prisma client. Tree green.
- **Commit 4 (analysis docs)** — docs only. Tree green.

Every intermediate tree type-checks → **per-layer atomic commits, no squash**. Order 1 → 2 → 3 → 4.

**Commits:**

1. `feat(contracts): add alternating-group member operation schemas`
2. `feat(api-server): add lmsalternatinggroupapi with ownership guard and mapper`
3. `feat(api-server): dissolve alternating group when a member schema is deleted`
4. `docs(analysis): record alternatinggroup operational semantics for step 8.1d`
5. `docs(step-08.1d): write executor output report` — `implementation/step-08.1d/output.md`.

The pure `lms-guards.ts` split may optionally be carved into its own preceding `refactor(api-server): split lms-guards by …` commit (cleaner SRP) — acceptable, non-blocking; the commit count adjusts.

Commitlint: subject ≤ 100 chars, **fully lowercase** (no caps, including acronyms — `lmsalternatinggroupapi`, not `lmsAlternatingGroupApi`, in the subject line); body lines ≤ 150. Per-layer body bullet lists welcome. Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — a failing hook is a root cause to fix.

---

## § 7 — Out-of-scope / deferred (forward notes)

- **HTTP routes** (`POST` create / member add+remove / `DELETE` group) — Step 8.2. 8.1d defines contract schemas at operation granularity; 8.2 maps member id to path-param vs. body.
- **Client hooks** (TanStack Query wrappers) — Step 8.3.
- **Read surface** — `get` / `list` api method + `mapToSchema` exposing `alternatingGroupId` + the `AlternatingGroup` read-embed — Step 8.3.5 (D-A2). `getAlternatingGroupsResponseSchema` already exists, unconsumed, awaiting that step.
- **UI** — the group bracket + "group as alternating sets" affordance — Step 8.4+.
- **QA-W1** — `lmsSchemaApi.delete` (and `lmsSchemaRowApi.update`/`.delete`) lack an in-tx `plan.deletedAt` re-check — deferred cross-cutting `/fix`; explicitly NOT folded into § 3.3.
- **QA-E3** — `userId === undefined` propagates as `PrismaClientValidationError` across all ownership guards including the new `verifyAlternatingGroupOwnership` — deferred uniform cross-guard `/fix`.

---

## § 8 — Verifications cheatsheet

```bash
# Phase 1 — contracts:
pnpm --filter @repo/contracts check-types
pnpm --filter @repo/contracts test
pnpm --filter @repo/contracts lint

# Phase 2/3 — api-server:
pnpm --filter @repo/api-server check-types
pnpm --filter @repo/api-server lint            # confirms the lms-guards split cleared max-lines
pnpm --filter @repo/api-server test -- alternating-group/admin.test.ts guards.test.ts schema/admin.test.ts

# Root sweep before output.md:
pnpm check-types        # 16/16
pnpm lint               # 16/16, 0 warnings
pnpm test               # all packages green
pnpm dep:check          # 0 violations

# Husky enforces per commit:
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"               # pre-commit
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"   # pre-push
```

No `db:reset` / `db:seed` needed — 8.1d changes no Prisma schema and no seed. Pre-existing flake awareness: `block/admin.test.ts:406` timing assertion (QA-023) — re-run on flake, not a regression.

---

## § 9 — Output report format (executor produces `implementation/step-08.1d/output.md`)

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

Add an explicit **`analysis-files touched: implementation-notes.md`** line (WORKFLOW.md "`analysis/` directory rules"). Record the `lms-guards.ts` split outcome (how it was split, whether carved into a separate commit) — REVIEW-I3 closure. UI smoke-test scenario — N/A (no runtime HTTP surface).

---

## § 10 — Wrapper choice & process notes

**Wrapper**: `/feature` full. Cross-package logic (contracts + api-server), 4 endpoint methods with lifecycle invariants, a guard, a mapper, a cross-cutting `lmsSchemaApi.delete` change — well past the `/feature small` thin-additive carve-out.

**Branch**: `feat/training-domain` (long-lived). No branch cut.

**Per-step cycle**: thesis ratified in the planner-user chat 2026-05-20 (D-A4 / D-A5 / D-A6 / D-A6.1 + QA-004 / QA-005 closures; user approved all hypotheses and the `lmsSchemaApi.delete` scope expansion). Jump to `/feature` Stage 1 (Research).

**Escalation** (WORKFLOW.md "Executor escalation protocol"): if anything the spec did not anticipate surfaces — a model question, a hidden consumer, an invariant the adversarial pass missed — STOP and surface with a hypothesis. Do not silently adapt the model or invent behaviour. In particular: do not drift into Step 8.2 (HTTP routes) or 8.3.5 (read surface); do not "improve" `mapToSchema` to expose `alternatingGroupId` (D-A2).

**Domain-model change protocol**: 8.1d changes no Prisma schema — it is api logic over the settled 8.1c model. The `analysis/` touch is the single §4.10 operational-semantics addendum (§ 3.4), recorded in the close-out's `analysis-files touched` line. D-A4 / D-A5 / D-A6 / D-A6.1 are ratified into `state/02-decisions.md` at close-out.

**Handoff after close-out**: Step 8.2 — HTTP routes for the `Schema` / `SchemaRow` / `AlternatingGroup` api slices. The server vertical for `AlternatingGroup` is complete after 8.1d.

---

**End of prompt.**
