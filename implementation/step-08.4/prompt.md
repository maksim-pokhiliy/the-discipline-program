# Step 8.4 — the anchor: first coach-visible Schema editor (ArchetypePicker + Schema CRUD + amrap-flat / n-rounds forms)

**Wrapper**: `/feature` **full**. The anchor of Step 8 — the first coach-visible Schema editor end-to-end. Cross-package: a small archetype read-path (api-server → routes → platform) as **Phase 0**, then the platform UI (`plan-detail` components). Not `/feature small` — new components, new forms, a new read-path, a browser smoke-test.

**Branch**: `feat/training-domain` long-lived. **NO new branch cut** (per `[[training-domain-workflow]]` + `[[always-via-feature-skill]]` — override the `/feature` skill's default `feat/<slug>` cut; stay on `feat/training-domain`). At prompt-write the branch is at `b2d8c165` (2 commits ahead of `main` `584f26b0`); the prompt commit (`docs(step-08.4): …`) is the `git diff` baseline.

**Predecessor**: Steps 8.0a → 8.3.7 shipped the full `Schema` / `SchemaRow` / `AlternatingGroup` backend — contracts, api-server, routes, client hooks, the week read-embed, DB-level positional-uniqueness on `Block` / `SchemaRow` / `Schema`. The `plan-detail` UI currently renders the week → day → session → **block** tree; `BlockCard` shows label / notes / intensity-timeCap summary but **does not render `block.schemas`**. Step 8.4 makes schemas coach-visible: a coach picks an archetype, fills its params form, the schema renders as a card inside the block.

**This step ships a browser smoke-test** (§ 9) — it is a coach-facing UI step.

Thesis ratified in the planner-user chat 2026-05-21 (two-voice; D-8.4-1..9 below — see § 1.x).

---

## § 0 — Verbatim source reads (read-at-prompt-write-time per `[[planner-verbatim-registration]]` + `[[scope-via-existing-patterns]]`)

Reference material — the deliverable is described **structurally** in § 3, not as code skeletons (per `[[planner-strategic-level]]`). **Before executing § 3, re-Read each cited path verbatim and confirm a byte-for-byte match.** Any drift → STOP, surface via `AskUserQuestion` with the diff + a hypothesis. Project component patterns are sacred — do not import "React best-practice" instincts.

### § 0.1 — The canonical UI precedent: the Block UI stack (`apps/platform/src/modules/plan-detail/components/`)

Step 8.4 structurally mirrors the **Block UI stack**. Read all four verbatim in Research; each Schema component mirrors its Block twin:

- `block-list.tsx` — `BlockList`: `@dnd-kit` `DndContext` + `SortableContext` (`verticalListSortingStrategy`); `useState`-mirrored `sortedBlocks` synced from props via `useEffect`; `handleDragEnd` does optimistic `arrayMove` → `reorderBlocks.mutate(..., { onError: () => rollback })`; renders `BlockCard` per item + `AddBlockButton` last. → **`SchemaList`** mirrors this exactly (`useReorderSchemas`).
- `block-card.tsx` — `BlockCard`: a bordered `Box`; `useSortable` drag handle; child fields; a `MoreVert` `Menu` → "Edit details" / "Delete"; `BlockEditorModal` + `ConfirmationModal`; `disabled` on pending mutations. → **`SchemaCard`** mirrors this.
- `block-editor-modal.tsx` — `BlockEditorModal`: `FormModal` (from `@repo/ui`) + `react-hook-form` `useForm({ resolver: zodResolver(...) })` + `Controller`-wrapped field components; `toFormData(entity)` / `buildXxxPayload(form)` converters; `reset` in a `useEffect` on entity change; `onSubmit` → `mutate(..., { onSuccess: onClose })`. → **`SchemaEditorModal`** mirrors this form pattern.
- `add-block-button.tsx` — `AddBlockButton`: a single `<Button startIcon={<AddIcon/>}>` calling `createBlock.mutate({})`. **Block create is one-tap (no params); Schema create is NOT** — it needs an archetype chosen first. → **`AddSchemaButton`** opens the `ArchetypePicker`.

`session-card.tsx` renders `<BlockList blocks={session.blocks} … />` inside the session — confirms the nesting depth `SessionCard → BlockList → BlockCard`; `SchemaList` nests one level deeper, inside `BlockCard`.

### § 0.2 — `Schema` contract (`packages/contracts/src/entities/lms/schema/schema.schema.ts`, verbatim)

```ts
type SchemaShape = {
  id: string; blockId: string; parentSchemaId: string | null; order: number;
  kind: SchemaKind; archetypeId: string; header: string | null;
  archetypeParams: z.infer<typeof archetypeParamsSchema>;
  intensity: Intensity | null; trailingConnector: … | null; notes: string | null;
  createdAt: Date; updatedAt: Date;
};

export const createSchemaSchema = z.object({
  blockId: z.string().cuid(),
  parentSchemaId: z.string().cuid().nullable().optional(),
  kind: schemaKindSchema,
  archetypeId: z.string().cuid(),
  header: z.string().max(500).nullable().optional(),
  archetypeParams: archetypeParamsSchema,
  intensity: intensitySchema.nullable().optional(),
  trailingConnector: trailingConnectorSchema.nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export const updateSchemaSchema = createSchemaSchema.partial();
```

`SchemaWithBody = { schema: Schema; rows: SchemaRow[]; subSchemas: SchemaWithBody[] }` — the depth-2 recursive shape `block.schemas` carries.

**Load-bearing.** `createSchemaSchema` requires `archetypeId` — a **cuid** (the `Archetype` row's primary key, generated at `db:seed`) — and `kind` (`SchemaKind`). The form cannot know these statically; they come from the archetype read-path (§ 0.5). `reorderSchemasRequestSchema` is a `z.union` of a `{ blockId }`-scoped and a `{ parentSchemaId }`-scoped branch — Step 8.4 uses the `{ blockId }` (top-level) branch only.

### § 0.3 — `archetypeParams` + `restSpec` (verbatim — the two forms + the sub-editor)

`archetype-params.schema.ts` — `archetypeParamsSchema = z.discriminatedUnion("archetype", [ … 34 … ])`, each member `{ archetype: literal, params: <schema> }`. The two Step 8.4 implements:

```ts
// n-rounds
const archetypeRoundsSetsParamsSchema = z.object({
  countForm: z.enum(["exact", "range", "count_times_reps"]),
  count: positiveInt.optional(),
  countRange: z
    .object({ min: positiveInt, max: positiveInt })
    .refine(min < max)
    .optional(),
  repsPerSet: positiveInt.optional(),
  rest: restSpecSchema.optional(),
});
// amrap-flat
const archetypeAmrapFlatParamsSchema = z.object({ durationMin: positiveInt });
```

`archetypeRoundsSetsParamsSchema` is a **flat object with no cross-field refine** — `count` / `countRange` / `repsPerSet` are all independently optional at the type level. The `countForm` ↔ which-field-is-required relationship is **form UX logic**, not a contract invariant (D-8.4-7).

`restSpecSchema` (`_shared/cap-spec.ts`, verbatim):

```ts
export const restSpecSchema = z.object({
  duration: z
    .object({
      value: z.number().positive(),
      unit: z.enum(["sec", "min", "range_sec", "range_min"]),
      rangeMax: z.number().positive().optional(),
    })
    .refine(/* rangeMax required & > value iff unit is range_*, forbidden otherwise */),
  scope: z.enum(["between_sets", "between_rounds", "between_intervals", "after_specific_set"]),
  qualifier: z.enum(["until_recovery", "fixed", "range"]).optional(),
  setIndex: z.number().int().positive().optional(),
});
```

A **typed structured** value — not a raw-text-and-parse shape. The RestSpec sub-editor edits these fields directly.

### § 0.4 — `Archetype` contract + constants (verbatim)

```ts
// archetype.schema.ts
export const archetypeSchema = z.object({
  id: z.string().cuid(), name: archetypeNameSchema, kind: schemaKindSchema,
  family: archetypeFamilySchema,
  headerPatternDescription: z.string().max(…), bodyLayoutDescription: z.string().max(…),
  archetypeParamsSchema: z.unknown(), relatedArchetypes: z.unknown(),
  createdAt: z.date(), updatedAt: z.date(),
});
// archetype-api.schema.ts
export const getArchetypesResponseSchema = z.array(archetypeSchema);
```

`schema.constants.ts` — `ARCHETYPE_NAMES` (the 34 archetype literals) + `ARCHETYPE_FAMILIES` (9: `ROUNDS_SETS`, `LADDER`, `TIME_CAP`, `COMPOSITE_ROUNDS`, `NESTED`, `NAMED`, `SINGLE_LINE_HEADERLESS`, `FLAT_PARALLEL_HEADERLESS`, `MODALITY_REFERENCE`). The picker groups its 34 entries by each archetype's `family` (carried per-archetype in the fetched `Archetype` row — § 0.5).

### § 0.5 — Archetype read-path is ABSENT — Phase 0 (verified at prompt-write)

The contract layer is ready (`getArchetypesResponseSchema`, `archetype/index.ts` barrel exports it). **Nothing else exists**: no api-server endpoint (`find packages/api-server/src/endpoints -ipath "*archetype*"` → 0 — only `assertArchetypeConsistency` consumers), no `mapToArchetype` mapper, no platform route handler, no platform api endpoint, no `use-archetypes` hook. `apps/admin` has no archetype CRUD (D4 — `Archetype` is configuration, no admin CRUD).

Phase 0 builds the read-path. **Canonical reference — the `lms/label` platform-read slice** (`Label` is a coach-read library; read each verbatim in Research):

- api-server: `packages/api-server/src/endpoints/lms/label/platform.ts` (`lmsLabelPlatformApi`) + `endpoints/lms/label/index.ts` barrel + `endpoints/lms/index.ts` barrel.
- mapper: `packages/api-server/src/mappers/lms/label.mapper.ts` + `mappers/lms/index.ts` barrel.
- route handler: `apps/platform/src/app/api/platform/labels/search/route.ts` (a top-level, non-plan-scoped platform route — archetypes are global configuration, not plan-scoped → `app/api/platform/archetypes/route.ts`).
- platform api: `apps/platform/src/lib/api/endpoints/labels.ts` (`createXxxAPI` factory) + `endpoints/index.ts` barrel + `api/client.ts` + `api/index.ts` + `api/keys.ts`.
- hook: `apps/platform/src/lib/hooks/use-label-*.ts` (a `useQuery` read hook, **not** `useWeekMutation`) + `hooks/index.ts` barrel.

`@repo/api-routes` (if it carries route-path definitions for the other slices) — Read verbatim, mirror for the archetype route. `archetypeSchema.archetypeParamsSchema` / `relatedArchetypes` are `z.unknown()` — the mapper passes the Prisma `Json` columns through raw.

### § 0.6 — `block.schemas` is already embedded (`block.schema.ts`, verbatim)

```ts
export const blockSchema = z.object({
  …, labels: z.array(labelSchema),
  schemas: z.array(schemaWithBodySchema),
  alternatingGroups: z.array(alternatingGroupSchema), …
});
```

Step 8.3.5 widened `blockSchema` with `schemas: SchemaWithBody[]`. **The schema read-path is ready** — `block.schemas` is in the `Block` type the week response delivers; `SchemaList` reads `block.schemas` directly. No read-enabler is owed for schemas (the flavour-(g) trace is satisfied — Phase 0 covers only the _archetype_ read-path, a separate surface).

### § 0.7 — Schema client hooks (`apps/platform/src/lib/hooks/use-schemas.ts`, verbatim — already shipped Step 8.3)

`useCreateSchema` / `useUpdateSchema` / `useDeleteSchema` / `useReorderSchemas` — all on `useWeekMutation`, each with a `successMessage` (they toast — see D-8.4-8). `useCreateSchema` → `api.schemas.create(planId, data: CreateSchemaRequest)`; `useReorderSchemas` → `api.schemas.reorder(planId, data: ReorderSchemasRequest)`. **The schema CRUD hooks exist — Step 8.4 wires the UI to them, it does not create them.**

### § 0.8 — Registration files (Read verbatim at execution; quote current state, state additive intent, show final state)

- `apps/platform/src/modules/plan-detail/components/index.ts` — 26 named exports (`AddBlockButton` … `WeekNotes`); 8.4 appends the new Schema components.
- `apps/platform/src/lib/hooks/index.ts`, `apps/platform/src/lib/api/endpoints/index.ts`, `apps/platform/src/api/client.ts` + `keys.ts` — append the archetype api/hook.
- `packages/api-server/src/endpoints/lms/index.ts`, `mappers/lms/index.ts` — append the archetype endpoint + mapper.
- `packages/contracts/.../archetype/index.ts` — already exports the api schemas; verify, do not re-add.

### § 0.9 — Husky / turbo / commitlint (verbatim)

- `.husky/pre-commit`: `node scripts/check-secrets.mjs` → `npx lint-staged` → `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"`.
- `.husky/pre-push`: `pnpm dep:check` → `SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"`.
- Commitlint: subject ≤ 100, fully lowercase; body lines ≤ 150 (safety ≤ 140; short `-m` paragraphs).
- Cross-package step (api-server + api-routes + platform). See § 6 — Phase 0 is **additive** (a brand-new read-path nothing depends on until Phase 2 consumes the hook), so per-layer atomic commits in dependency order keep every intermediate tree green; no squash. Confirm fan-out against `.husky/{pre-commit,pre-push}` + `turbo.json` before § 6.

### § 0.A — Grep enumeration (mandatory pre-execution, per `[[planner-consumer-pattern-read]]`)

Non-exhaustive — run each, confirm, surface any unexpected hit:

```bash
grep -rn "rchetype" apps/platform/src/                       # expect: 0 (no archetype consumer in platform yet)
grep -rn "block.schemas\|\.schemas" apps/platform/src/modules/plan-detail/  # expect: 0 (BlockCard does not render schemas yet)
grep -rn "lmsLabelPlatformApi\|createLabelsAPI" packages/api-server/src packages/contracts/src apps/platform/src  # the label-slice canonical references
grep -rn "FormModal\|ConfirmationModal" packages/ui/src       # the @repo/ui modal primitives the forms reuse
```

---

## § 1 — Goal & ratified decisions

### Coach view

**Walkthrough.** Денис открывает день плана, внутри сессии — блок тренировки. Раньше блок показывал только метку, заметку и сводку интенсивности — теперь под ними появилась область схем: пока схем нет — кнопка «add schema». Денис тапает её — открывается ArchetypePicker: 34 формата, сгруппированные по 9 семействам (rounds-sets, ladder, time-cap, …). Все 34 видны и кликабельны. Выбирает `n-rounds` — открывается форма: «rounds count» (точное число / диапазон / N подходов × повторы), «reps per set» и по желанию интервал отдыха (вложенный редактор отдыха — длительность: число + единица, и где отдыхать). Заполняет «5 rounds × 8 reps, rest 90 sec between rounds», сохраняет — в блоке появляется карточка схемы с заголовком. Альтернативно `amrap-flat` — форма с единственным полем «duration, minutes» → 12 → карточка «AMRAP 12 min». Денис переупорядочивает схемы перетаскиванием, редактирует или удаляет через меню карточки — как с блоками. Тело схемы (упражнения) пустое — оно наполняется на следующем шаге (редактор строк, Step 9). Если Денис тапнет формат, чья форма ещё не сделана (32 из 34) — модалка просто не откроется.

**Goal (coach).** 8.4 — первый экран, где тренер собирает саму программу тренировки: кладёт в блок конкретные форматы работы (схемы), а не только метаданные блока. Якорный шаг — после него + редактора строк (Step 9) тренер впервые проходит реальный путь «создал план → запрограммировал блок схемами».

### Developer view

**Goal.** The first coach-visible Schema editor. **Phase 0** — the archetype read-path (api-server `lmsArchetypePlatformApi` + `mapToArchetype` + platform route + api + `use-archetypes` hook), because `createSchema` needs `archetypeId` (a seed-generated cuid) and the picker needs `family` per archetype. **Phases 1-4** — the `plan-detail` UI: `SchemaList` / `SchemaCard` / `AddSchemaButton` inside `BlockCard`, `ArchetypePicker` (34 archetypes grouped by family), `SchemaEditorModal` dispatching to the `amrap-flat` and `n-rounds` param forms, the reusable RestSpec sub-editor, the CRUD wire-up onto the existing `use-schemas` hooks. Structurally mirrors the Block UI stack (§ 0.1). `/feature` full.

### § 1.x — Ratified decisions (planner-user chat 2026-05-21)

- **D-8.4-1 (one step, `/feature` full, Phase 0 inside).** The archetype read-path is folded into Step 8.4 as Phase 0 (user-chosen over a separate enabler step). One cross-package step; per-layer atomic commits (§ 6).
- **D-8.4-2 (ArchetypePicker — all 34, grouped, no disabling).** The picker renders **all 34 archetypes**, grouped by `family`. **No disabling, no "coming soon", no greyed-out state — zero availability logic in the picker.** It is a flat static render of 34 grouped entries.
- **D-8.4-3 (forms ship incrementally; unimplemented archetype = no-op).** Step 8.4 implements the param forms for **`amrap-flat`** and **`n-rounds`** only (the other 32 land in Steps 8.5-8.20). An archetype whose form is not yet implemented looks identical to every other in the picker — clicking it simply does not open the modal. No grey-out, no marker. The picker is uniform for all 34; the form **registry** is what is incomplete, not the picker.
- **D-8.4-4 (empty schema body — no placeholder text).** A created schema renders as a card with its header; the body (rows / sub-schemas) is not rendered (Step 9). **No "No exercises yet" placeholder text** — the empty body is left visually empty as-is.
- **D-8.4-5 (structural mirror of the Block UI stack).** `SchemaList` ↔ `BlockList`, `SchemaCard` ↔ `BlockCard`, `SchemaEditorModal` ↔ `BlockEditorModal` (§ 0.1). `ArchetypePicker` is net-new (no Block twin — Block create is one-tap). Each param form is its own file (`[[one-component-per-file]]`).
- **D-8.4-6 (`SchemaList` inside `BlockCard`).** `SchemaList` is rendered inside `BlockCard`, below the intensity/timeCap summary, reading `block.schemas`. The schema read-path is ready (§ 0.6) — no schema read-enabler.
- **D-8.4-7 (`n-rounds` form is `countForm`-conditional).** `archetypeRoundsSetsParamsSchema` is flat with no refine; the `countForm` value drives which fields the form shows (`exact` → `count`; `range` → `countRange`; `count_times_reps` → `count` + `repsPerSet`). This is form UX logic — the contract schema is **not** changed.
- **D-8.4-8 (toast-policy carry-forward NOT folded).** The `use-schemas` hooks toast (`successMessage`). The toast-policy carry-forward (`03-deferred.md` — drop editor-wide success toasts except session-delete) is **not** folded into 8.4 — it is a separate `/feature small` (a behavioural change to already-shipped Block/Session/Day UX). 8.4 schema mutations toast as-is.
- **D-8.4-9 (commit strategy — per-layer atomic, Phase 0 additive).** Phase 0's read-path is additive — nothing depends on the new archetype endpoint until Phase 2 consumes the hook — so per-layer atomic commits in dependency order (api-server → routes → platform api/hook → UI) leave every intermediate tree green; no cross-package squash. Confirm against `.husky` + `turbo.json` (§ 6).

---

## § 2 — Scope

### Phase 0 — archetype read-path (api-server + api-routes + platform)

New: `lmsArchetypePlatformApi` (api-server `endpoints/lms/archetype/`), `mapToArchetype` (`mappers/lms/archetype.mapper.ts`), the archetype platform route handler, the platform `createArchetypesAPI` endpoint, the `use-archetypes` query hook, an api-server endpoint test. Modified: the api-server `endpoints/lms` + `mappers/lms` barrels, the platform api `endpoints` barrel + `client` + `keys`, the platform `hooks` barrel, `@repo/api-routes` (if it carries route definitions).

### Phases 1-4 — platform UI (`apps/platform/src/modules/plan-detail/`)

New components: `SchemaList`, `SchemaCard`, `AddSchemaButton`, `ArchetypePicker`, `SchemaEditorModal`, `AmrapFlatParamsFields`, `NRoundsParamsFields`, `RestSpecFields`, plus an archetype-params summary renderer for `SchemaCard` (executor's call on file split). Modified: `block-card.tsx` (embed `SchemaList`), `components/index.ts` barrel. Platform component tests per the existing `plan-detail` test convention.

### Out of scope

- Sub-schema creation / nested archetypes — Step 8.18-8.20 (`{ blockId }` scope only here).
- The 32 archetype param forms beyond `amrap-flat` / `n-rounds` — Steps 8.5-8.20.
- The SchemaRow body editor — Step 9.
- `archetypeParams` for `amrap-flat`/`n-rounds` Zod schemas, the Prisma schema, the seed — **not changed** (8.4 is UI + a read endpoint).
- The toast-policy carry-forward (D-8.4-8).
- `apps/admin` — untouched.

---

## § 3 — Phases (spec-only — structural, no code skeletons; per `[[planner-strategic-level]]`)

No code comments (project rule). The `/feature` Plan stage details the file list; the phases below are the logical decomposition + the commit boundaries (§ 6).

### Phase 0 — archetype read-path

Build a read-only archetype list endpoint, mirroring the `lms/label` platform-read slice (§ 0.5). api-server: `lmsArchetypePlatformApi.list()` returning all 34 archetypes (`prisma.archetype.findMany`, a stable order — by `name` or `family` then `name`); authorization = an authenticated coach, **no plan-scope** (archetypes are global configuration). `mapToArchetype` maps the Prisma row to `archetypeSchema` (the two `Json` columns pass through as `z.unknown()`). The platform route handler is a top-level `app/api/platform/archetypes/route.ts` GET (non-plan-scoped). The platform `createArchetypesAPI` + `use-archetypes` hook — a `useQuery` (archetypes are immutable configuration → an aggressive `staleTime`). An api-server endpoint test asserting all 34 are returned with the right shape.

### Phase 1 — `SchemaList` + `SchemaCard`, embedded in `BlockCard`

`SchemaList` mirrors `BlockList` (§ 0.1) — `@dnd-kit` reorder over `block.schemas`, optimistic `arrayMove` + `onError` rollback via `useReorderSchemas`, `AddSchemaButton` last. `SchemaCard` mirrors `BlockCard` — `useSortable` drag handle, the schema header + an `archetypeParams` summary line, a `MoreVert` menu (Edit / Delete), `ConfirmationModal` on delete. The schema body (rows / sub-schemas) is **not** rendered — no placeholder text (D-8.4-4). `BlockCard` gets `SchemaList` below its intensity/timeCap summary (D-8.4-6). `SchemaList`/`SchemaCard` consume `block.schemas` (`SchemaWithBody[]`).

### Phase 2 — `ArchetypePicker`

A component listing **all 34** archetypes (from `use-archetypes`), grouped by `family` (D-8.4-2). Every entry is rendered identically and is clickable — no disabling, no markers, zero availability logic. `AddSchemaButton` opens the picker. Selecting an archetype hands `{ archetypeId, kind, name }` to the create flow (Phase 3). For an archetype with no implemented param form, the flow simply does not open the modal (D-8.4-3) — this is a property of the form **registry**, not a picker condition.

### Phase 3 — `SchemaEditorModal` + the two param forms + RestSpec sub-editor

`SchemaEditorModal` mirrors `BlockEditorModal` (§ 0.1) — `FormModal` + `react-hook-form` + `zodResolver`. It dispatches by archetype `name` to a param-form component. `AmrapFlatParamsFields` — one positive-integer field (`durationMin`). `NRoundsParamsFields` — a `countForm` selector that conditionally shows `count` / `countRange` / `repsPerSet` (D-8.4-7) + an optional RestSpec sub-editor. `RestSpecFields` — a standalone reusable sub-editor over `restSpecSchema` (§ 0.3): `duration.value` + `duration.unit` (with `rangeMax` shown only for the `range_*` units, per the schema's refine), `scope`, optional `qualifier` / `setIndex`. The submit assembles a `CreateSchemaRequest` (`blockId` from the card context, `kind` + `archetypeId` from the picked archetype, `archetypeParams` as the discriminated `{ archetype, params }`).

### Phase 4 — CRUD wire-up

Create via `useCreateSchema`; update (re-edit `archetypeParams` for the same archetype — `SchemaEditorModal` in edit mode) via `useUpdateSchema`; delete via `useDeleteSchema` + `ConfirmationModal`; reorder via `useReorderSchemas` (Phase 1's dnd). All hooks already exist (§ 0.7).

### Phase 5 — `db:reset` + `db:seed`

8.4 does **not** change the Prisma schema or the seed. Run `pnpm --filter @repo/api-server db:reset && db:seed` once to confirm a clean DB for the smoke-test; the 34 archetypes are already seeded. (Optional, executor's call: if the smoke-test wants a pre-seeded plan/week/block, note it — but the scenario in § 9 starts from creating those via the existing UI.)

### Phase 6 — tests

Phase 0 — the api-server archetype endpoint test. Phases 1-4 — platform component tests per the existing `plan-detail` test convention (mirror whatever `block`-UI tests exist; if `plan-detail` has no component tests, match that — do not invent a new harness). The browser smoke-test (§ 9) is the primary UI validation.

### Phase 7 — verifications

Per § 8.

---

## § 4 — Acceptance criteria

1. ✅ Phase 0 — `lmsArchetypePlatformApi.list()` returns all 34 archetypes; `mapToArchetype`, the platform route, `createArchetypesAPI`, `use-archetypes` shipped; api-server test green.
2. ✅ `BlockCard` renders `SchemaList` below the intensity/timeCap summary; an empty block shows the `AddSchemaButton` only.
3. ✅ `ArchetypePicker` lists all 34 archetypes grouped by family; every entry clickable; no disabled/greyed/"coming soon" state.
4. ✅ Selecting `amrap-flat` → a one-field form → save → a schema card renders in the block. Selecting `n-rounds` → a `countForm`-conditional form + optional RestSpec → save → a schema card. Selecting an unimplemented archetype → no modal opens, no error.
5. ✅ `SchemaCard` — drag-reorder (optimistic + rollback), Edit (re-opens the form), Delete (`ConfirmationModal`). Schema body not rendered, no placeholder text.
6. ✅ `archetypeParams` is built as the discriminated `{ archetype, params }`; `createSchema` receives the cuid `archetypeId` + `kind` from the picked archetype.
7. ✅ No Prisma schema / seed / `archetypeParams` Zod change; `apps/admin` untouched.
8. ✅ `pnpm check-types` 16/16; `pnpm lint` 16/16, 0 warnings; `pnpm test` green (api-server + platform deltas); `pnpm dep:check` 0 violations.
9. ✅ Per-layer atomic commits on `feat/training-domain`, dependency order; husky pre-commit + commit-msg + pre-push clean; zero `--no-verify` / `--no-edit` / `--no-gpg-sign`.
10. ✅ The browser smoke-test (§ 9) passes.

---

## § 5 — Adversarial pass (per `[[planner-adversarial-review]]` — UI + read-path axes)

- **Picker with 34 entries, 2 with forms.** Clicking an unimplemented archetype must be a clean no-op (D-8.4-3) — no modal, no console error, no half-open state.
- **`n-rounds` `countForm` switching.** Switching `countForm` must not submit stale fields — e.g. `exact` → fill `count` → switch to `range`: the payload must carry `countRange`, not `count`. The flat Zod schema (§ 0.3) will _accept_ an under-filled payload — the form is the only guard; `zodResolver` over a form schema that encodes the conditional requirement is the clean fix (flavour-(i) Zod-inferred axis — a form-level schema, not the contract schema).
- **RestSpec `range_*` units.** `restSpecSchema.duration` refine: `rangeMax` is required and `> value` iff `unit ∈ {range_sec, range_min}`, forbidden otherwise — the RestSpec sub-editor must show/hide `rangeMax` accordingly.
- **Concurrent create.** Two fast "add schema" submits on one block → the loser may see a P2002 (the Step 8.3.7 `Schema` constraint) — this is QA-001c, a known carry-forward, **not** folded here.
- **Reorder.** Optimistic `arrayMove` + `onError` rollback (mirror `BlockList`). A reorder racing a create is last-writer-wins — known (QA-B4), not addressed here.
- **Empty states.** A block with no schemas → `AddSchemaButton` only. A schema with an empty body → card with header, body blank, no placeholder text (D-8.4-4).
- **`use-archetypes` fetch failure.** The picker must degrade gracefully (an error/loading state) — it cannot render 34 without the fetch.
- **`archetypeId` integrity.** The form must send the cuid `archetypeId` from the fetched archetype, never the archetype `name` — `createSchema` requires the cuid (§ 0.2).

---

## § 6 — Commit strategy (per-layer atomic, verified against live hook config per `[[husky-cross-package-squash]]`)

Cross-package, but Phase 0 is **additive** — the new archetype endpoint/route/hook is dead until Phase 2 consumes it, so no intermediate tree is broken. Per-layer atomic commits in dependency order; **no squash**. Suggested boundaries (executor confirms against `.husky/{pre-commit,pre-push}` + `turbo.json`):

1. api-server archetype endpoint + mapper + barrels + test.
2. `@repo/api-routes` archetype route definition (if applicable) + the platform route handler.
3. platform archetype api endpoint + `use-archetypes` hook + barrels.
4. platform UI — `SchemaList` / `SchemaCard` / `AddSchemaButton` / `ArchetypePicker` / `SchemaEditorModal` / param forms / RestSpec + `BlockCard` embed + tests (one commit, or split by component group — executor's call).

Conventional-commits, subject ≤ 100 lowercase, body ≤ ~140. Stage by explicit names (never `git add -A`). Never `--no-verify` / `--no-edit` / `--no-gpg-sign`. The planner writes the `docs(step-08.4): …` close-out commit separately.

---

## § 7 — Out-of-scope / deferred (forward notes)

- The 32 remaining param forms — Steps 8.5-8.20; each registers its archetype's form, the picker is unchanged.
- The SchemaRow body editor + the 9 rowKinds + 7 composite VOs — Step 9.
- Sub-schema creation (nested archetypes) — Steps 8.18-8.20.
- Toast-policy (D-8.4-8) — a separate `/feature small`.
- QA-001c (`lmsSchemaApi.create` P2002 retry) / QA-B4 (`reorder` `retryOnP2034`) — codebase-wide `/fix` carry-forwards (`03-deferred.md`).

---

## § 8 — Verifications cheatsheet

```bash
pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed
pnpm --filter @repo/api-server test     # archetype endpoint test among them
pnpm check-types        # 16/16
pnpm lint               # 16/16, 0 warnings
pnpm test               # api-server + platform deltas green
pnpm dep:check          # 0 violations
```

The api-server suite is single-config serial (~10 min) per `[[api-server-serial-tests]]`. Pre-existing flake: `block/admin.test.ts:406` (QA-023) — re-run on flake, not a regression of this step.

---

## § 9 — Smoke-test scenario (executor records the run in `output.md`)

**Preconditions**: `db:reset` + `db:seed`; the platform dev server running; logged in as the seeded coach; a draft training plan open (the seed has 4 plans — pick one, or create one via the existing UI).

1. Open the plan → a week → a day → add a session → add a block. **Expected**: the block card shows label/notes/intensity affordances + an "add schema" button, no schemas.
2. Tap "add schema". **Expected**: the ArchetypePicker opens — 34 archetypes grouped by family, all clickable, none greyed.
3. Pick `amrap-flat`. **Expected**: a form with one field "duration (minutes)". Enter `12`, save. **Expected**: a schema card "AMRAP 12 min" (or the archetype's header) in the block; body empty, no placeholder text.
4. Tap "add schema" → pick `n-rounds`. **Expected**: a form with `countForm` (exact/range/count_times_reps), conditional count fields, reps-per-set, an optional rest sub-editor. Fill "5 rounds × 8 reps, rest 90 sec between rounds", save. **Expected**: a second schema card.
5. Drag the second schema above the first. **Expected**: order swaps, persists on reload.
6. Open the first schema's menu → Edit → change a param → save. **Expected**: the card updates.
7. Tap an unimplemented archetype (e.g. `ladder-spike`) in the picker. **Expected**: nothing opens, no error.
8. Delete a schema via the menu → confirm. **Expected**: the card disappears, persists on reload.

**Rollback**: delete the created block / session / day / week via their existing menus, or `db:reset` + `db:seed`.

---

## § 10 — Output report format (executor produces `implementation/step-08.4/output.md`)

Per WORKFLOW.md: `## Что сделано` · `## Изменённые/созданные файлы` · `## Принятые решения` · `## Возникшие вопросы и как решены` · `## Что отложено` · `` ## Ссылка на `.feature-dev/<ts>/` `` · `## Сценарий смоук-теста` (the § 9 run + result) · `## Verification notes` · `## Acceptance criteria self-check`.

**Escalation** (WORKFLOW.md): anything the spec did not anticipate — a § 0 verbatim quote that no longer matches, an unexpected § 0.A grep hit, a contract that rejects the assembled payload, the archetype read-path not mirroring the label slice cleanly — **STOP and surface via `AskUserQuestion`** with the verbatim evidence + a hypothesis. Do not silently adapt. In particular: do **not** add disabling/"coming soon" logic to the picker (D-8.4-2); do **not** add empty-body placeholder text (D-8.4-4); do **not** change the `archetypeParams` Zod schemas or the Prisma schema; do **not** fold in the toast-policy change.

**End of prompt.**
