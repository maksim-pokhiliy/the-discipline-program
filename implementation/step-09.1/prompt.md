# Step 9.1 — SchemaRow body editor: STANDALONE_LOAD rowKind + LoadEditor + WeightEditor

**Wrapper**: `/feature` **full**. The first SchemaRow body-editor sub-step — it makes schema bodies fillable. A real coach-facing UI step + two reusable composite-VO editor surfaces (`LoadEditor` 5 kinds, `WeightEditor` 8 variants) — not `/feature small`.

**Branch**: `feat/training-domain` long-lived. **NO new branch cut** (per `[[training-domain-workflow]]` + `[[always-via-feature-skill]]` — override the `/feature` skill's default `feat/<slug>` cut; stay on `feat/training-domain`). At prompt-write the branch is at `91789af3` (1 commit ahead of `main` `be988162`); the prompt commit (`docs(step-09.1): …`) is the `git diff` baseline.

**Predecessor**: Step 8.4 shipped the first coach-visible Schema editor — `SchemaList` / `SchemaCard` / `AddSchemaButton` in `BlockCard`, `ArchetypePicker`, `SchemaEditorModal` + `SCHEMA_PARAM_FORM_REGISTRY` of self-contained `*SchemaForm` components, the `amrap-flat` / `n-rounds` forms, `RestSpecFields`. `SchemaCard` renders the schema header + an `archetypeParams` summary but **does not render the schema body** (D-8.4-4 — empty, no placeholder). The SchemaRow contracts (8.0b), api-server (8.1b), HTTP routes (8.2), client hooks (8.3) and the `SchemaWithBody.rows` read-embed (8.3.5) are all shipped. Step 9.1 makes the body fillable — starting with the simplest rowKind, `STANDALONE_LOAD`.

**This step ships a browser smoke-test** (§ 9) — it is a coach-facing UI step.

Thesis ratified in the planner-user chat 2026-05-22 (two-voice; D-9.1-1..12 below — see § 1.x).

---

## § 0 — Verbatim source reads (read-at-prompt-write-time per `[[planner-verbatim-registration]]` + `[[scope-via-existing-patterns]]`)

Reference material — the deliverable is described **structurally** in § 3, not as code skeletons (per `[[planner-strategic-level]]`). **Before executing § 3, re-Read each cited path verbatim and confirm a byte-for-byte match.** Any drift → STOP, surface via `AskUserQuestion` with the diff + a hypothesis. Project component patterns are sacred — do not import "React best-practice" instincts.

### § 0.1 — The canonical UI precedent: the Step 8.4 Schema editor stack (`apps/platform/src/modules/plan-detail/components/`)

Step 9.1 structurally mirrors the **8.4 Schema editor stack**, one nesting level deeper. The plan-editor tree is `SessionCard → BlockList → BlockCard → SchemaList → SchemaCard`; 9.1 extends it with `SchemaCard → SchemaRowList → SchemaRowCard`. Read each verbatim in Research:

- `schema-list.tsx` — `SchemaList`: `@dnd-kit` `DndContext` + `SortableContext` (`verticalListSortingStrategy`); `useState`-mirrored `sortedSchemas` synced from props via `useEffect`; `handleDragEnd` optimistic `arrayMove` → `reorderSchemas.mutate(..., { onError: () => rollback })`; renders `SchemaCard` per item + `AddSchemaButton` last. → **`SchemaRowList`** mirrors this exactly (`useReorderSchemaRows`, reading `schema.rows`).
- `schema-card.tsx` — `SchemaCard`: a bordered `Box`; `useSortable` drag handle; the header + `SchemaParamsSummary`; a `MoreVert` `Menu` → Edit / Delete; `SchemaEditorModal` + `ConfirmationModal`; `useMemo`-d editor `mode` (the 8.4 WARN-1 fix — an inline object literal re-identifies each render and clobbers form input on a week refetch). → **`SchemaRowCard`** mirrors this; 9.1 also **modifies `SchemaCard`** to render `SchemaRowList` in the body.
- `add-schema-button.tsx` — `AddSchemaButton`: a `<Button startIcon={<AddIcon/>}>` opening `ArchetypePicker`; `handleSelect` checks `SCHEMA_PARAM_FORM_REGISTRY[name] === undefined` → no-op for an unimplemented archetype; `useMemo`-d `SchemaEditorMode`. → **`AddRowButton`** mirrors this (the row-kind menu in place of `ArchetypePicker`).
- `archetype-picker.tsx` — `ArchetypePicker`: a `BaseModal` listing all 34 archetypes grouped by family, every entry clickable, zero availability logic. → the **row-kind menu** mirrors the zero-availability-logic principle (8 rowKinds; executor picks `Menu` vs modal list by item count — D-9.1-5).
- `schema-editor-modal.tsx` — `SchemaEditorModal`: a **thin dispatcher** — `SCHEMA_PARAM_FORM_REGISTRY[resolveArchetypeName(mode)]`, renders `<ParamForm>` or `null`. → **`RowEditorModal`** mirrors this.
- `schema-param-form-registry.ts` — `SCHEMA_PARAM_FORM_REGISTRY: Partial<Record<ArchetypeName, React.FC<SchemaParamFormProps>>>`. → **`ROW_KIND_FORM_REGISTRY`** mirrors this (`Partial<Record<RowKind, React.FC<RowFormProps>>>`).
- `schema-editor-types.ts` — `SchemaEditorMode` (`create` | `edit` discriminated) + `SchemaParamFormProps` (`{ mode, planId, startDate, onClose }`). → **`row-editor-types.ts`** mirrors this.
- `n-rounds-schema-form.tsx` / `amrap-flat-schema-form.tsx` — the **self-contained `*SchemaForm`** pattern (approach (A), 8.4 Design-gate ratified): each owns its `useForm({ resolver: zodResolver(...) })` + form schema + `FormModal` (`@repo/ui`) + `useCreateSchema`/`useUpdateSchema`; `toFormData(mode)` defaults; `useEffect(reset, [mode])` re-sync; `onSubmit` branches `create` vs `edit`. → **`StandaloneLoadRowForm`** mirrors this (`useCreateSchemaRow`/`useUpdateSchemaRow`).
- `rest-spec-fields.tsx` (`RestSpecFields`) + `effort-percent-field.tsx` (`EffortPercentField`) — the **controlled sub-editor** pattern: props `{ value, onChange, error?, disabled? }`, NO own `useForm`, embedded inside a parent `Controller`. `EffortPercentField` is the direct precedent for a discriminated sub-editor — `handleModeChange` **re-creates** `value` on a mode switch (`onChange({ value: 70 })` / `onChange({ range: {...} })`), never carries stale fields across. → **`LoadEditor`** / **`WeightEditor`** mirror this controlled-sub-editor shape (D-9.1-4).
- `schema-params-summary.tsx` (`SchemaParamsSummary`) — a **formatter**: `switch (archetypeParams.archetype)` → per-archetype `format*` string helpers → `<Chip size="small" label={…}>`. → **`LoadSummary`** mirrors this (`switch (load.kind)`, nested `switch (weight.variant)` for `absolute`).

### § 0.2 — SchemaRow contract (`packages/contracts/src/entities/lms/schema-row/`, verbatim)

`schema-row.constants.ts`:

```ts
export const ROW_KINDS = [
  "EXERCISE",
  "REST",
  "FOOTNOTE",
  "STANDALONE_LOAD",
  "STANDALONE_URL",
  "PLACEHOLDER",
  "INNER_LADDER_MARKER",
  "REP_DEFINITION",
  "REST_SLOT",
] as const;
export type RowKind = (typeof ROW_KINDS)[number];
```

`schema-row.schema.ts` — `schemaRowPayloadSchema` is `z.discriminatedUnion("rowKind", [...])`; the `STANDALONE_LOAD` member:

```ts
z.object({
  rowKind: z.literal("STANDALONE_LOAD"),
  load: loadSchema,
  scope: standaloneLoadScopeSchema,
}),
```

`schemaRowSchema` carries the discriminated `rowPayload` **and** a top-level modifier set, every field nullable:

```ts
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
```

**Load-bearing.** For a `STANDALONE_LOAD` row the load lives in `rowPayload.load` (inside the discriminated payload). The **top-level** `schemaRow.load` is a separate field — a per-row modifier consumed by `EXERCISE` rows (Step 9.3), not by `STANDALONE_LOAD`. 9.1 sends `{ schemaId, rowKind: "STANDALONE_LOAD", rowPayload }` only; every top-level modifier (`load` / `reps` / `side` / … / `notes`) is left absent (all `optional` in `createSchemaRowSchema`). See D-9.1-6.

`standaloneLoadScopeSchema` (`_shared/enums.ts`, verbatim) — **a single-value enum**:

```ts
export const STANDALONE_LOAD_SCOPES = ["applies_to_all_preceding_rows"] as const;
export const standaloneLoadScopeSchema = z.enum(STANDALONE_LOAD_SCOPES);
```

### § 0.3 — Load + Weight + PercentageReference contracts (`packages/contracts/src/entities/lms/_shared/`, verbatim)

`load.ts` — the `LoadEditor` contract (5 kinds):

```ts
export const LOAD_KINDS = [
  "absolute",
  "percentage",
  "bodyweight",
  "without_weight",
  "unspecified",
] as const;
export const PERCENTAGE_REFERENCE_SCOPES = ["self", "movement_family", "other_exercise"] as const;
export const WITHOUT_WEIGHT_CONTEXTS = ["drop_set_stage"] as const;

export const percentageReferenceSchema = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("self") }),
  z.object({ scope: z.literal("movement_family"), movementFamily: z.string().min(1) }),
  z.object({ scope: z.literal("other_exercise"), targetExerciseId: z.string().cuid() }),
]);

export const loadSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("absolute"), weight: weightSchema }),
    z.object({
      kind: z.literal("percentage"),
      value: z.number().min(0).max(200),
      rangeMax: z.number().min(0).max(200).optional(),
      reference: percentageReferenceSchema,
    }),
    z.object({ kind: z.literal("bodyweight") }),
    z.object({ kind: z.literal("without_weight"), context: z.enum(WITHOUT_WEIGHT_CONTEXTS) }),
    z.object({ kind: z.literal("unspecified") }),
  ])
  .superRefine((l, ctx) => {
    if (l.kind === "percentage" && l.rangeMax !== undefined && l.rangeMax <= l.value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "percentage.rangeMax must be > value when set",
      });
    }
  });
```

`weight.ts` — the `WeightEditor` contract (8 variants):

```ts
export const WEIGHT_VARIANTS = [
  "single",
  "dual",
  "single_arm",
  "compound_device",
  "split_tier",
  "dual_value",
  "with_asymmetric_arm",
  "with_depth_modifier",
] as const;
export const WEIGHT_COMPOUND_DEVICE_EQUIPMENT = [
  "BODYWEIGHT",
  "DUMBBELL",
  "KETTLEBELL",
  "BARBELL",
  "BAND",
  "PARALLEL_BARS",
  "RINGS",
  "BOX",
  "SOFA",
  "BOX_OR_SOFA",
  "MIXED",
  "UNKNOWN",
] as const;
export const WEIGHT_SPLIT_TIER_EQUIPMENT = ["DUMBBELL", "KETTLEBELL", "BARBELL", "MIXED"] as const;
export const WEIGHT_ASYMMETRIC_PASSIVE_EQUIPMENT = ["DUMBBELL", "KETTLEBELL"] as const;
export const WEIGHT_WORKING_ARMS = ["left", "right"] as const;
export const WEIGHT_PASSIVE_ARM_ACTIONS = [
  "hold_in_up",
  "hold_static",
  "hold_with_extra_weight",
] as const;
export const WEIGHT_DEPTH_MODIFIERS = ["to_parallel", "full_rom", "partial"] as const;

export const weightSchema = z.discriminatedUnion("variant", [
  z.object({ variant: z.literal("single"), valueKg: z.number().positive() }),
  z.object({ variant: z.literal("dual"), valueKg: z.number().positive() }),
  z.object({ variant: z.literal("single_arm"), valueKg: z.number().positive() }),
  z.object({
    variant: z.literal("compound_device"),
    equipment: z.enum(WEIGHT_COMPOUND_DEVICE_EQUIPMENT),
    count: z.union([z.literal(1), z.literal(2)]),
    valueKg: z.number().positive(),
  }),
  z.object({
    variant: z.literal("split_tier"),
    stages: z
      .array(
        z.object({
          reps: z.number().int().positive(),
          equipment: z.enum(WEIGHT_SPLIT_TIER_EQUIPMENT),
          valueKg: z.number().positive(),
        }),
      )
      .min(2),
  }),
  z.object({
    variant: z.literal("dual_value"),
    first: z.number().positive(),
    second: z.number().positive(),
    resolver: z.literal("athlete_profile"),
  }),
  z.object({
    variant: z.literal("with_asymmetric_arm"),
    valueKg: z.number().positive(),
    workingArm: z.enum(WEIGHT_WORKING_ARMS),
    passiveArmAction: z.enum(WEIGHT_PASSIVE_ARM_ACTIONS),
    passiveExtraWeight: z
      .object({
        equipment: z.enum(WEIGHT_ASYMMETRIC_PASSIVE_EQUIPMENT),
        valueKg: z.number().positive(),
      })
      .optional(),
  }),
  z.object({
    variant: z.literal("with_depth_modifier"),
    valueKg: z.number().positive(),
    depth: z.enum(WEIGHT_DEPTH_MODIFIERS),
  }),
]);
```

`loadSchema` / `weightSchema` are `z.discriminatedUnion` → `z.infer` yields a **narrowable** union. The `.superRefine` on `loadSchema` does not alter the inferred type. A consumer narrows via `value.kind` / `value.variant` with no `as`, no dead `throw`.

### § 0.4 — Domain source (`analysis/artifacts/06-formalization/implementation-notes.md`, verbatim — flavour (b) `[[coach-pov-first]]`)

The authoritative shapes. `§ 2.1` (Weight) / `§ 2.2` (Load) are the Zod that became the § 0.3 contract — § 0.3 is canonical. `§ 1.1` Load fixtures (13 — the concrete coach occurrences):

```jsonc
// 1. Absolute single (block-077 standalone row)
{ "kind": "absolute", "weight": { "variant": "single", "valueKg": 15 } }
// 2. Absolute dual (canonical: 157 occurrences)
{ "kind": "absolute", "weight": { "variant": "dual", "valueKg": 15 } }
// 3. Absolute single_arm (block-033)
{ "kind": "absolute", "weight": { "variant": "single_arm", "valueKg": 15 } }
// 4. Absolute compound_device (block-008 Bulgarian)
{ "kind": "absolute", "weight": { "variant": "compound_device", "equipment": "DUMBBELL", "count": 2, "valueKg": 15 } }
// 5. Absolute split_tier (block-119 single arm row)
{ "kind": "absolute", "weight": { "variant": "split_tier", "stages": [
    { "reps": 5, "equipment": "KETTLEBELL", "valueKg": 24 },
    { "reps": 10, "equipment": "DUMBBELL", "valueKg": 15 } ] } }
// 6. Absolute dual_value (block-003 singleton)
{ "kind": "absolute", "weight": { "variant": "dual_value", "first": 50, "second": 30, "resolver": "athlete_profile" } }
// 7. Absolute with_asymmetric_arm (block-123)
{ "kind": "absolute", "weight": { "variant": "with_asymmetric_arm", "valueKg": 15,
    "workingArm": "left", "passiveArmAction": "hold_in_up" } }
// 8. Absolute with_depth_modifier (block-189)
{ "kind": "absolute", "weight": { "variant": "with_depth_modifier", "valueKg": 24, "depth": "to_parallel" } }
// 9. Percentage with self reference
{ "kind": "percentage", "value": 60, "reference": { "scope": "self" } }
// 10. Percentage range + cross-movement
{ "kind": "percentage", "value": 60, "rangeMax": 70,
  "reference": { "scope": "other_exercise", "targetExerciseId": "clu123..." } }
// 11. Bodyweight
{ "kind": "bodyweight" }
// 12. Without weight (drop-set stage)
{ "kind": "without_weight", "context": "drop_set_stage" }
// 13. Unspecified
{ "kind": "unspecified" }
```

`§ 1.4` — the `STANDALONE_LOAD` `row_payload` (block-077):

```jsonc
{
  "rowKind": "STANDALONE_LOAD",
  "load": { "kind": "absolute", "weight": { "variant": "dual", "valueKg": 15 } },
  "scope": "applies_to_all_preceding_rows",
}
```

`STANDALONE_LOAD` is a row that carries **only a load annotation** and applies it to all preceding rows in the schema body — the coach wrote a set of movements, then a separate "[ 15 kg ]" line below for the weight. Both `§ 1.1 #1` and the `§ 1.4` fixture use an `absolute` load; `percentage` for a standalone-load row is not in the sample but the contract permits the full `loadSchema`.

### § 0.5 — SchemaRow client hooks + API (verbatim — already shipped Step 8.3)

`apps/platform/src/lib/hooks/use-schema-rows.ts`:

```ts
export const useCreateSchemaRow = (planId: string, startDate: string) =>
  useWeekMutation<CreateSchemaRowRequest, SchemaRow>({
    mutationFn: (data) => api.schemaRows.create(planId, data),
    planId, startDate,
    successMessage: "Schema row created",
    errorMessage: "Failed to create schema row",
  });
export const useUpdateSchemaRow = (planId: string, startDate: string) =>
  useWeekMutation<{ schemaRowId: string; data: UpdateSchemaRowRequest }, SchemaRow>({ … });
export const useDeleteSchemaRow = (planId: string, startDate: string) =>
  useWeekMutation<{ schemaRowId: string }, void>({ … });
export const useReorderSchemaRows = (planId: string, startDate: string) =>
  useWeekMutation<ReorderSchemaRowsRequest, { schemaRows: SchemaRow[] }>({
    mutationFn: (data) => api.schemaRows.reorder(planId, data), … });
```

`apps/platform/src/lib/api/endpoints/schema-rows.ts` — `createSchemaRowsAPI` exposes `create` / `update` / `delete` / `reorder` over `/api/platform/training-plans/{planId}/schema-rows[...]`. `CreateSchemaRowRequest === createSchemaRowSchema`; `ReorderSchemaRowsRequest === reorderSchemaRowsSchema.extend({ schemaId })` (the reorder body carries `schemaId` + `orderedIds`). **The SchemaRow CRUD hooks + API exist — Step 9.1 wires the UI to them, it does not create them.** Both `api.schemaRows` (`lib/api/index.ts`) and `use-schema-rows` (`hooks/index.ts`) are already registered — 9.1 touches neither barrel.

### § 0.6 — The SchemaRow read-path is ready (verbatim)

`packages/contracts/src/entities/lms/schema/schema.schema.ts`:

```ts
export type SchemaWithBody = {
  schema: z.infer<typeof schemaSchema>;
  rows: SchemaRow[];
  subSchemas: SchemaWithBody[];
};
```

`block.schema.ts` — `blockSchema.schemas: z.array(schemaWithBodySchema)`. Step 8.3.5 widened the depth-2 embed; `block.schemas[i].rows` is in the type the week response delivers. **`SchemaCard` already receives `schema: SchemaWithBody` — `schema.rows` is in hand.** No read-enabler is owed (the flavour-(g) `[[planner-read-surface-trace]]` trace is satisfied). 9.1 adds the body **rendering** + the row editor; it does not add a read-path.

### § 0.7 — Registration files (Read verbatim at execution; quote current state, state additive intent, show final state)

- `apps/platform/src/modules/plan-detail/components/index.ts` — **33 named exports** at prompt-write (`AddBlockButton`, `AddSchemaButton`, `AddSessionButton`, `AmrapFlatSchemaForm`, `ArchetypePicker`, `BlockCard`, `BlockEditorModal`, `BlockIntensitySummary`, `BlockLabelSelect`, `BlockList`, `BlockNotesField`, `BlockTimeCapSummary`, `DayLabelSelect`, `DayNotesField`, `DayRow`, `EffortPercentField`, `HrZoneField`, `NRoundsSchemaForm`, `NumericPaceField`, `PaceField`, `RestSpecFields`, `RpeField`, `SchemaCard`, `SchemaEditorModal`, `SchemaList`, `SchemaParamsSummary`, `SessionCard`, `SessionLabelSelect`, `SessionList`, `SessionNotesField`, `TimeCapFields`, `WeekGrid`, `WeekNavigator`, `WeekNotes`). 9.1 **appends** the new component exports, alphabetically sorted (per D-EXEC-4 of 8.4: component `.tsx` files are barrel-exported; non-component `.ts` files — `row-editor-types.ts`, `row-kind-form-registry.ts` — are NOT, matching `schema-editor-types.ts` / `schema-param-form-registry.ts`).
- `apps/platform/src/lib/hooks/index.ts`, `apps/platform/src/lib/api/{index.ts,endpoints/index.ts}` — **NOT touched.** `use-schema-rows` and `api.schemaRows` are already registered (Step 8.3). 9.1 adds no hook, no api endpoint.
- `packages/contracts`, `packages/api-server`, `apps/platform/src/app/api/**`, `prisma/` — **NOT touched** (D-9.1-11).

### § 0.8 — Husky / turbo / commitlint (verbatim)

- `.husky/pre-commit`: `node scripts/check-secrets.mjs` → `npx lint-staged` → `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"`.
- `.husky/pre-push`: `pnpm dep:check` → `SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"`.
- `turbo.json` — `check-types` / `lint` `dependsOn ["^…"]`; `test` uncached.
- Commitlint: subject ≤ 100, fully lowercase (no capitals, no acronyms); body lines ≤ 150 (safety ≤ 140); a line with a `#NNN` token parses as a footer → keep such lines short.
- **9.1 is single-package** (`apps/platform` only — § 0.7). No cross-package fan-out; `turbo check-types --filter="...[HEAD]"` covers `apps/platform` (a leaf). Every commit is additive within one package → no broken intermediate tree → per-layer atomic commits, no squash (§ 6).

### § 0.A — Grep enumeration (mandatory pre-execution, per `[[planner-consumer-pattern-read]]`)

Non-exhaustive — run each, confirm, surface any unexpected hit:

```bash
grep -rn "\.rows" apps/platform/src/modules/plan-detail/                       # expect: 0 — SchemaCard does not render the body yet
grep -rn "use-schema-rows\|useCreateSchemaRow\|useReorderSchemaRows" apps/platform/src/   # expect: the hook file only, 0 UI consumers
grep -rn "STANDALONE_LOAD\|standaloneLoadScope\|loadSchema\|weightSchema" apps/platform/src/   # expect: 0 — no platform consumer of these VOs yet
grep -rn "RestSpecFields\|EffortPercentField\|SchemaParamsSummary" apps/platform/src/modules/plan-detail/   # the sub-editor + formatter precedents
grep -rn "FormModal\|BaseModal\|ConfirmationModal" packages/ui/src             # the @repo/ui modal primitives the forms reuse
```

---

## § 1 — Goal & ratified decisions

### Coach view

**Walkthrough.** Денис открыл план → неделю → день → сессию → блок — внутри блока стоит карточка схемы (например `n-rounds 5×5`, создана на шаге 8.4), тело схемы пустое. Под параметрами схемы появилась кнопка **«Add row»** — Денис тапает её, открывается меню видов ряда: 8 пунктов (упражнение, отдых, сноска, отдельная нагрузка, ссылка, заполнитель, маркер лесенки, определение повтора). Выбирает **«Отдельная нагрузка»** — открывается форма ряда. Первый выбор — **как задана нагрузка**: пять вариантов (точный вес / процент / вес тела / без веса / не указано). Денис выбирает «точный вес» — раскрывается **форма веса**: восемь вариантов (одиночный / парный / одной рукой / составной снаряд / ступенчатый / два значения / асимметричная рука / с глубиной). Выбирает «одной рукой», вводит «32». Под формой — статичная строка-пояснение, что эта нагрузка применяется ко всем рядам выше (это не выбор — у отдельной нагрузки ровно один режим). Сохраняет — в теле схемы появляется ряд с пометкой «32 kg, одной рукой», у ряда есть перетаскивание / редактирование / удаление через меню, как у карточек схем. Денис добавляет второй ряд — на этот раз «процент», 60%, относительно себя — ряд рендерится «60% (от себя)». Если Денис тапнет вид ряда, который ещё не сделан (7 из 8) — модалка просто не откроется.

**Goal (coach).** 9.1 — первый шаг, где тело схемы перестаёт быть пустым: тренер кладёт внутрь схемы содержимое. Начинаем с простейшего вида ряда — отдельной нагрузки. После 8.4 + 9.1 у тренера рабочая связка «схема + ряд» для двух архетипов — первый по-настоящему пригодный продукт.

### Developer view

**Goal.** Ship the SchemaRow body editor for the `STANDALONE_LOAD` rowKind — the first fillable row-kind — plus two reusable composite-VO editors: `LoadEditor` (5 kinds) and `WeightEditor` (8 variants), each a controlled sub-editor (the `RestSpecFields` / `EffortPercentField` shape). The row-kind menu + `ROW_KIND_FORM_REGISTRY` + `RowEditorModal` + `AddRowButton` mirror the 8.4 `ArchetypePicker` + `SCHEMA_PARAM_FORM_REGISTRY` + `SchemaEditorModal` + `AddSchemaButton` stack; `SchemaRowList` / `SchemaRowCard` mirror `SchemaList` / `SchemaCard`; `SchemaCard` is modified to render the body. Platform-only — the SchemaRow contracts / api-server / routes / hooks and the read-embed are shipped (8.0b-8.3.5). `/feature` full.

### § 1.x — Ratified decisions (planner-user chat 2026-05-22)

- **D-9.1-1 (one step, `/feature` full).** 9.1 ships as one step — the `STANDALONE_LOAD` row form + `LoadEditor` (5 kinds) + `WeightEditor` (8 variants) + the row-kind dispatch infra + the `SchemaCard` body rendering. `WeightEditor` shipped without its `STANDALONE_LOAD` consumer would be orphan infrastructure (the queue's "ship-with-first-consumer" principle); the queue (D3) already fixes 9.1 as one step. Volume is close to 8.4 (~25-30 files).

- **D-9.1-2 (row-kind menu — 8 rowKinds, zero availability logic, unimplemented = no-op).** The `AddRowButton` menu renders the **8 coach-facing rowKinds** — the 9 `RowKind` values minus `REST_SLOT` (`REST_SLOT` is auto-materialized inside EMOM sub-minute-slot formats, never coach-added — per the Step 8.1b Coach-OQ-2 ratify, recorded in `01-step-queue.md` Step 9.9). All 8 are rendered identically, all clickable — **no disabling, no "coming soon", no greyed-out state**. 9.1 implements only `STANDALONE_LOAD`; picking an unimplemented rowKind (the registry has no entry) simply does not open the modal. The exact mirror of D-8.4-2 / D-8.4-3 (the `ArchetypePicker` decision the user ratified — 34 shown, 2 working).

- **D-9.1-3 (`scope` is a pinned constant, surfaced as a static caption — not a control).** `standaloneLoadScopeSchema` is a single-value enum (`["applies_to_all_preceding_rows"]`). The form does **not** render a selector for it (a one-option Select is noise, not a choice). Instead it shows a static caption — "Applies to all preceding rows" — so the coach understands what the row does. The payload always carries `scope: "applies_to_all_preceding_rows"`, set in code. Likewise `without_weight.context` is a single-value enum (`["drop_set_stage"]`) — pinned in code, no UI control.

- **D-9.1-4 (LoadEditor / WeightEditor — discriminated `switch`-dispatch, NOT a `Record`-registry). Load-bearing — flavour (i) `[[planner-lint-impact-trace]]`.** `Load` is a discriminated union on `kind`; `Weight` on `variant`. A `Record<LoadKind, FC<UniformProps>>` erases per-kind narrowing — each kind sub-editor receives `value: Load` (the widest type) and is forced into a dead-branch re-narrow (`if (value.kind !== "absolute") return null`) = compiler-appeasement, rejected per `[[type-quality]]`. That is **exactly the 8.4 prompt error mechanism** (a `Record` erasing a per-variant generic). The correct shape: `LoadEditor` does `switch (value.kind)`, `WeightEditor` does `switch (value.variant)` — control-flow narrowing gives each branch a precise `Extract<Load, { kind: K }>` / `Extract<Weight, { variant: V }>`, which it hands to a per-variant sub-component. Each variant sub-component is its **own file** (`[[one-component-per-file]]` — and `react/no-multi-comp` forbids multiple JSX-returning module-scope components in one file, flavour (i) Step 7.4). **This is NOT the 8.4 approach-(A) registry** — approach (A) worked for archetype forms because they are _self-contained_ (uniform `SchemaParamFormProps`, each owns its `useForm`). `LoadEditor` / `WeightEditor` are _controlled sub-editors_ (`{ value, onChange }` driven by a parent `useForm`, the `RestSpecFields` / `EffortPercentField` shape), with a per-variant `value` type — a registry for them reproduces the 8.4 erasure. `LoadEditor` is built reusable (Step 9.3 EXERCISE consumes it for the row-level `load` modifier).

- **D-9.1-5 (row-kind dispatch mirrors `SCHEMA_PARAM_FORM_REGISTRY`).** Here a registry **is** the right pattern (unlike D-9.1-4) — row forms are self-contained: each owns its `useForm` over its row payload + `FormModal` + `useCreateSchemaRow` / `useUpdateSchemaRow`, with uniform props (`RowFormProps`, mirroring `SchemaParamFormProps`). `ROW_KIND_FORM_REGISTRY: Partial<Record<RowKind, React.FC<RowFormProps>>>` + a thin `RowEditorModal` dispatcher + `AddRowButton` with the row-kind menu — the exact mirror of `SCHEMA_PARAM_FORM_REGISTRY` + `SchemaEditorModal` + `AddSchemaButton` + `ArchetypePicker`. 9.1 registers one entry (`STANDALONE_LOAD`); Steps 9.2-9.9 add the rest. The menu control (MUI `Menu` vs a `BaseModal` list) is the executor's call by item count (8).

- **D-9.1-6 (`STANDALONE_LOAD` writes the load into `rowPayload`; top-level modifiers absent).** The create payload is `{ schemaId, rowKind: "STANDALONE_LOAD", rowPayload: { rowKind: "STANDALONE_LOAD", load, scope: "applies_to_all_preceding_rows" } }`. The top-level `schemaRow.load` and every other top-level modifier (`reps` / `side` / `tempo` / `position` / `sequence` / `intensity` / `media` / `compoundRep` / `notes`) are left absent — all `optional` in `createSchemaRowSchema`, and they are `EXERCISE`-row / row-metadata surfaces owned by Steps 9.3 / 9.10 / 9.11.

- **D-9.1-7 (`percentage` → `other_exercise` reference scope deferred to Step 9.3).** `percentageReferenceSchema` has 3 scopes: `self`, `movement_family` (a free string), `other_exercise` (`targetExerciseId` — a cuid). `apps/platform` has no exercise read-path (no `use-exercises`, no `exercises` endpoint — verified by grep at prompt-write); Exercise is an admin-only catalog (Step 3). The exercise picker first lands in Step 9.3 (`EXERCISE` rowKind — "exerciseId picker from library"). 9.1's `LoadEditor` `percentage` kind supports the `self` and `movement_family` scopes only; `other_exercise` is added in 9.3 alongside the exercise picker — `LoadEditor` is reusable and the scope is an additive extension. Building an exercise read-path enabler in 9.1 (the Phase-0 precedent of 8.4) was weighed and rejected: it bloats 9.1 for a scope that belongs to 9.3.

- **D-9.1-8 (numeric bounds mirror the contract — QA-201 disposition).** `weightSchema.valueKg` is `z.number().positive()` with no `.max()`; `split_tier` stage `reps` is `int().positive()` with no `.max()` — the form invents no ceiling (QA-201, `03-deferred.md`). `loadSchema.percentage.value` / `.rangeMax` are **already** `z.number().min(0).max(200)` — the form's percentage inputs use `0..200` (a contract bound, not an invention). `compound_device.count` is `1 | 2` (a two-value choice).

- **D-9.1-9 (one modal, progressive disclosure — not a wizard).** The `STANDALONE_LOAD` form is one `FormModal`; the load-kind selector reveals the next level, the weight-variant selector reveals its fields — the `EffortPercentField` progressive-disclosure shape, not a multi-step wizard. `bodyweight` / `unspecified` reveal no fields at all.

- **D-9.1-10 (`SchemaCard` body — human-readable row rendering; empty body has no placeholder).** `SchemaCard` is modified to render `SchemaRowList` in its body. A `STANDALONE_LOAD` row renders via a `LoadSummary` formatter (a `switch` over `load.kind` / `weight.variant` → a readable string, the `SchemaParamsSummary` precedent) — never raw JSON. An empty schema body shows the `AddRowButton` only — **no "No rows yet" placeholder text** (the mirror of D-8.4-4).

- **D-9.1-11 (platform-only — no contracts / api-server / routes / Prisma / seed / admin change).** The SchemaRow contracts, api-server, HTTP routes, client hooks and the read-embed are shipped (8.0b-8.3.5). 9.1 touches only `apps/platform/src/modules/plan-detail/`. Per-layer atomic commits, no cross-package squash (§ 6).

- **D-9.1-12 (toast-policy carry-forward NOT folded).** The `use-schema-rows` hooks toast via `useWeekMutation` (`successMessage`). The toast-policy carry-forward (`03-deferred.md` — drop editor-wide success toasts except session-delete) is **not** folded into 9.1 — it stays a separate `/feature small`. 9.1's row mutations toast as-is, like the rest of the plan editor.

---

## § 2 — Scope

### In scope (`apps/platform/src/modules/plan-detail/`)

New — composite-VO editors (controlled sub-editors, reusable):

- `LoadEditor` — a `switch (value.kind)` dispatcher over 5 kinds; each kind a own-file sub-component (`absolute` / `percentage` / `bodyweight` / `without_weight` / `unspecified` — `bodyweight` & `unspecified` are field-less). The `percentage` sub-editor: `value` + optional `rangeMax` + a `PercentageReferenceEditor` (scopes `self` / `movement_family` only — D-9.1-7).
- `WeightEditor` — a `switch (value.variant)` dispatcher over 8 variants; each variant a own-file sub-component. `split_tier` carries a sub-array editor (stages, `min(2)`); `with_asymmetric_arm` carries a toggled nested optional (`passiveExtraWeight`).
- `LoadSummary` — the `switch`-based formatter for `SchemaRowCard` (the `SchemaParamsSummary` precedent).

New — the `STANDALONE_LOAD` row form + the row-kind dispatch infra:

- `StandaloneLoadRowForm` — a self-contained `*RowForm` (owns `useForm` + `FormModal` + `useCreateSchemaRow` / `useUpdateSchemaRow`); consumes `LoadEditor` via a `Controller`; assembles the `STANDALONE_LOAD` `rowPayload`.
- `ROW_KIND_FORM_REGISTRY` + `RowEditorModal` (thin dispatcher) + `AddRowButton` (row-kind menu) + `row-editor-types.ts` (`RowEditorMode`, `RowFormProps`).

New — the body rendering:

- `SchemaRowList` (dnd reorder, `AddRowButton` last) + `SchemaRowCard` (drag handle, `LoadSummary`, Edit / Delete menu, `RowEditorModal` + `ConfirmationModal`).

Modified:

- `schema-card.tsx` — render `SchemaRowList` in the body.
- `components/index.ts` — append the new component exports.

Tests — platform component tests per the existing `plan-detail` convention (mirror whatever `schema`-UI tests 8.4 shipped; if `plan-detail` has no component tests, match that — do not invent a harness).

The exact file split (one file per kind/variant sub-component vs. grouping) is the executor's call within D-9.1-4 (each variant its own component; `react/no-multi-comp` + the `max-lines` 300 cap apply).

### Out of scope

- The other 7 coach-facing rowKinds (`EXERCISE` / `REST` / `FOOTNOTE` / `STANDALONE_URL` / `PLACEHOLDER` / `INNER_LADDER_MARKER` / `REP_DEFINITION`) — Steps 9.2-9.9.
- `percentage` → `other_exercise` reference scope + the exercise picker + the platform exercise read-path — Step 9.3 (D-9.1-7).
- Top-level SchemaRow modifiers (`reps` / `side` / `tempo` / `position` / `sequence` / `intensity` / `media` / `compoundRep` / `notes`) — Steps 9.3 / 9.10 / 9.11.
- The composite VOs RepNotation / Side / CompoundRep / Tempo / Media / Intensity — Steps 9.2-9.11.
- Sub-schema bodies (NESTED archetypes) — Steps 8.18-8.20.
- `packages/contracts`, `packages/api-server`, the HTTP routes, the Prisma schema, the seed, `apps/admin` — **not changed** (9.1 is platform UI on a shipped backend).
- The toast-policy carry-forward (D-9.1-12).

---

## § 3 — Phases (spec-only — structural, no code skeletons; per `[[planner-strategic-level]]`)

No code comments (project rule). The `/feature` Plan stage details the file list; the phases below are the logical decomposition + the commit boundaries (§ 6).

### Phase 1 — composite-VO editors (`LoadEditor`, `WeightEditor`, `LoadSummary`)

Build the reusable controlled sub-editors. `WeightEditor` first (it is nested inside `LoadEditor`'s `absolute` kind), then `LoadEditor`, then `LoadSummary`.

`WeightEditor` — props `{ value: Weight, onChange, error?, disabled? }`. A variant selector (8 — `WEIGHT_VARIANTS`) + a `switch (value.variant)` rendering one own-file sub-component per variant, each receiving its `Extract<Weight, { variant: V }>`. On a variant switch, `onChange` is handed a freshly-built default for the next variant — never stale fields carried across (the `EffortPercentField.handleModeChange` precedent). `single` / `dual` / `single_arm` — one `valueKg` field. `compound_device` — `equipment` (12) + `count` (1 | 2) + `valueKg`. `split_tier` — a sub-array editor over `stages` (`min(2)` — add / remove with the floor enforced in the UI, each stage `reps` + `equipment` (4) + `valueKg`). `dual_value` — `first` + `second` (`resolver` pinned to `"athlete_profile"`). `with_asymmetric_arm` — `valueKg` + `workingArm` (2) + `passiveArmAction` (3) + a toggled optional `passiveExtraWeight` (`equipment` (2) + `valueKg`) — the `n-rounds` rest-toggle precedent. `with_depth_modifier` — `valueKg` + `depth` (3).

`LoadEditor` — props `{ value: Load, onChange, error?, disabled? }`. A kind selector (5 — `LOAD_KINDS`) + a `switch (value.kind)` over own-file sub-components. `absolute` — embeds `WeightEditor`. `percentage` — `value` (`0..200`) + an optional `rangeMax` (`0..200`, `> value` per the `loadSchema` superRefine) + a `PercentageReferenceEditor` with the `self` / `movement_family` scopes (a scope toggle; `movement_family` reveals a free-text `movementFamily` field — D-9.1-7). `bodyweight` / `unspecified` — no fields. `without_weight` — no fields (`context` pinned to `"drop_set_stage"` — D-9.1-3). Kind switch re-creates `value` as the next kind's default.

`LoadSummary` — props `{ load: Load }`. A `switch (load.kind)` (nested `switch (weight.variant)` for `absolute`) → a readable string in a `<Chip>` (the `SchemaParamsSummary` shape).

### Phase 2 — `StandaloneLoadRowForm`

A self-contained `*RowForm` mirroring `NRoundsSchemaForm` / `AmrapFlatSchemaForm` (§ 0.1): owns `useForm({ resolver: zodResolver(...) })` + `FormModal` + `useCreateSchemaRow` / `useUpdateSchemaRow`. The form value is the `STANDALONE_LOAD` load (a `Controller`-wrapped `LoadEditor`); the form schema validates the `load` — `loadSchema` infers a narrowable union, no `superRefine`-for-narrowing needed (flavour (i) Zod-inferred axis). `toFormData(mode)` supplies a sensible default for `create` (e.g. `{ kind: "absolute", weight: { variant: "single", valueKg: … } }`) and reads `rowPayload.load` for `edit`; `useEffect(reset, [mode])` re-sync. `onSubmit` assembles the create / update request per D-9.1-6 (`rowPayload` with the pinned `scope`). The form shows the static scope caption (D-9.1-3).

### Phase 3 — row-kind dispatch infra (`ROW_KIND_FORM_REGISTRY`, `RowEditorModal`, `AddRowButton`)

`row-editor-types.ts` — `RowEditorMode` (`{ kind: "create"; schemaId; rowKind } | { kind: "edit"; row: SchemaRow }`) + `RowFormProps` (`{ mode, planId, startDate, onClose }`) — mirroring `SchemaEditorMode` / `SchemaParamFormProps`. `ROW_KIND_FORM_REGISTRY: Partial<Record<RowKind, React.FC<RowFormProps>>>` — one entry, `STANDALONE_LOAD`. `RowEditorModal` — a thin dispatcher (registry lookup → render or `null`), mirroring `SchemaEditorModal`. `AddRowButton` — a `<Button>` opening the row-kind menu (8 entries — `ROW_KINDS` minus `REST_SLOT`, D-9.1-2), `handleSelect` no-ops for an unregistered rowKind, the `RowEditorMode` `useMemo`-d (the 8.4 WARN-1 fix). Mirrors `AddSchemaButton`.

### Phase 4 — `SchemaRowList` / `SchemaRowCard` + the `SchemaCard` body embed

`SchemaRowList` mirrors `SchemaList` — `@dnd-kit` reorder over `schema.rows`, optimistic `arrayMove` + `onError` rollback via `useReorderSchemaRows` (the reorder body carries `schemaId` + `orderedIds`), `AddRowButton` last. `SchemaRowCard` mirrors `SchemaCard` — `useSortable` drag handle, `LoadSummary` for the row, a `MoreVert` menu (Edit / Delete), `RowEditorModal` (edit mode) + `ConfirmationModal`, `useMemo`-d `mode`. `SchemaCard` is modified to render `SchemaRowList` in its body; an empty body shows `AddRowButton` only, no placeholder (D-9.1-10).

### Phase 5 — `db:reset` + `db:seed`

9.1 changes neither the Prisma schema nor the seed. Run `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed` once to confirm a clean DB for the smoke-test. The smoke-test (§ 9) creates the week / day / session / block / schema via the existing UI.

### Phase 6 — tests

Platform component tests per the existing `plan-detail` convention (match what 8.4 shipped for the Schema editor). The browser smoke-test (§ 9) is the primary UI validation.

### Phase 7 — verifications

Per § 8.

---

## § 4 — Acceptance criteria

1. ✅ `LoadEditor` — 5 kinds (`absolute` / `percentage` / `bodyweight` / `without_weight` / `unspecified`), `switch (value.kind)` dispatch, each kind a own-file sub-component receiving its `Extract<Load, …>`; no `Record`-of-`FC`, no `as`, no dead-branch re-narrow (D-9.1-4).
2. ✅ `WeightEditor` — 8 variants, `switch (value.variant)` dispatch, each variant a own-file sub-component; `split_tier` sub-array editor enforces the `min(2)` floor in the UI; `with_asymmetric_arm` toggles the nested optional `passiveExtraWeight`.
3. ✅ `percentage` supports the `self` and `movement_family` reference scopes only; `other_exercise` is absent (D-9.1-7). Percentage inputs bound `0..200`; `valueKg` / stage `reps` have no invented `.max()` (D-9.1-8).
4. ✅ `StandaloneLoadRowForm` is a self-contained `*RowForm` (owns `useForm` / `FormModal` / the mutation hooks), registered in `ROW_KIND_FORM_REGISTRY`; supports create + edit.
5. ✅ `AddRowButton` opens a row-kind menu of 8 rowKinds (no `REST_SLOT`); all clickable, no disabling / "coming soon"; picking an unimplemented rowKind opens no modal, no error (D-9.1-2).
6. ✅ `SchemaCard` renders `SchemaRowList` in the body — `SchemaRowCard` per row with a human-readable `LoadSummary`; drag-reorder (optimistic + rollback), Edit, Delete (`ConfirmationModal`); an empty body shows `AddRowButton` only, no placeholder text (D-9.1-10).
7. ✅ A `STANDALONE_LOAD` row create sends `{ schemaId, rowKind: "STANDALONE_LOAD", rowPayload: { rowKind, load, scope: "applies_to_all_preceding_rows" } }`; no top-level modifier sent (D-9.1-6). `scope` and `without_weight.context` are pinned constants with no UI control (D-9.1-3).
8. ✅ No `packages/contracts` / `packages/api-server` / HTTP-route / Prisma / seed / `apps/admin` change; `hooks` and `api` barrels untouched (D-9.1-11).
9. ✅ `pnpm check-types` 16/16; `pnpm lint` 16/16, 0 warnings; `pnpm test` green (platform delta); `pnpm dep:check` 0 violations.
10. ✅ Per-layer atomic commits on `feat/training-domain`; husky pre-commit + commit-msg + pre-push clean; zero `--no-verify` / `--no-edit` / `--no-gpg-sign`.
11. ✅ The browser smoke-test (§ 9) passes.

---

## § 5 — Adversarial pass (per `[[planner-adversarial-review]]`)

- **flavour (i) — type simulation of the dispatch.** `LoadEditor` / `WeightEditor` MUST be a `switch` over the discriminant, not a `Record<Kind, FC>` — a `Record` erases the per-variant narrowing and forces a dead-branch re-narrow in every sub-component (`[[type-quality]]` reject — the 8.4 prompt-error mechanism). Each variant sub-component takes a precise `Extract<…>` value; the `switch` branch supplies it. `loadSchema` / `weightSchema` are `discriminatedUnion` → `z.infer` is narrowable, the form's `zodResolver` needs no narrowing crutch.
- **Kind / variant switching — no stale fields.** Coach picks `absolute` → `single` → enters `32` → switches to `percentage`: the payload must be a `percentage` shape, not an `absolute` shell with leftover keys. `onChange` re-creates `value` as the next kind/variant's default on every switch (the `EffortPercentField.handleModeChange` precedent). Same for a `WeightEditor` variant switch (`compound_device` → `split_tier` must drop `equipment`/`count` and produce `stages` of length ≥ 2).
- **`split_tier` floor.** `stages` is `.min(2)` — the UI must not allow removing below 2 stages; a create starts with 2.
- **`percentage` `rangeMax > value`.** `loadSchema.superRefine` rejects `rangeMax <= value`; the form surfaces this as a field error (the 8.4 `*SchemaForm` `fieldState.error` bar — match it, per the QA-204-adjacent carry-forward).
- **`with_asymmetric_arm.passiveExtraWeight`.** A toggled nested optional — on/off must add/remove the whole sub-object cleanly (the `n-rounds` rest-toggle precedent).
- **Editor `mode` identity (the 8.4 WARN-1).** `StandaloneLoadRowForm` re-syncs via `useEffect(reset, [mode])`; an inline-object `mode` re-identifies each render and clobbers coach input on a week-query refetch. `AddRowButton` / `SchemaRowCard` must `useMemo` the `RowEditorMode` (the 8.4 fix — `3e8b89de`).
- **Concurrent row create.** Two fast "add row" submits on one schema → the loser may hit a P2002 (the Step 8.3.6 `SchemaRow @@unique([schemaId, order])` constraint) — the QA-001c-class carry-forward, **not** folded here.
- **Reorder race.** Optimistic `arrayMove` + `onError` rollback (mirror `SchemaList`). A reorder racing a create is last-writer-wins — known (QA-W2), not addressed here.
- **Unimplemented rowKind.** Picking any of the 7 non-`STANDALONE_LOAD` rowKinds → a clean no-op (registry miss → no modal), no console error, no half-open state (mirror D-8.4-3).
- **`use-weeks` fetch / empty states.** A schema with no rows → `AddRowButton` only, no placeholder. A row's `LoadSummary` must render every one of the 13 `§ 1.1` load shapes without throwing.

---

## § 6 — Commit strategy (per-layer atomic, verified against live hook config per `[[husky-cross-package-squash]]`)

9.1 is **single-package** (`apps/platform` only — § 0.7 / § 0.8). Every commit is additive within one package — no cross-package fan-out, no broken intermediate tree. Per-layer atomic commits in dependency order; **no squash**. Suggested boundaries (the executor confirms against `.husky/{pre-commit,pre-push}` + `turbo.json`):

1. The composite-VO editors — `WeightEditor` + `LoadEditor` + `PercentageReferenceEditor` + `LoadSummary` + their variant sub-components.
2. `StandaloneLoadRowForm` + `row-editor-types.ts` + `ROW_KIND_FORM_REGISTRY` + `RowEditorModal` + `AddRowButton`.
3. `SchemaRowList` + `SchemaRowCard` + the `schema-card.tsx` body embed + the `components/index.ts` barrel.
4. Tests (or folded into 1-3 — executor's call; if Review wants the diff complete, fold tests in per commit).

Conventional-commits, subject ≤ 100 lowercase, body lines ≤ ~140. Stage by explicit file names (never `git add -A`). Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — a failing hook is a root-cause fix. The planner writes the `docs(step-09.1): …` close-out commit separately.

---

## § 7 — Out-of-scope / deferred (forward notes)

- The 7 remaining coach-facing rowKinds — Steps 9.2-9.9; each registers its rowKind's form, the row-kind menu is unchanged.
- `percentage` → `other_exercise` + the exercise picker + the platform exercise read-path — Step 9.3 (D-9.1-7); `LoadEditor` extends additively.
- Top-level SchemaRow modifiers + the RepNotation / Side / Tempo / Media / Intensity / CompoundRep composite VOs — Steps 9.3 / 9.10 / 9.11.
- Toast-policy (D-9.1-12) — a separate `/feature small`.
- QA-201 (param integer upper bounds) — a deferred domain-model sub-step (`03-deferred.md`); 9.1's load numerics mirror the unbounded contract, inventing no `.max()`.
- QA-001c (concurrent-create P2002) / QA-W2 (reorder race) — codebase-wide `/fix` carry-forwards.

---

## § 8 — Verifications cheatsheet

```bash
pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed
pnpm check-types        # 16/16
pnpm lint               # 16/16, 0 warnings
pnpm test               # platform delta green
pnpm dep:check          # 0 violations
```

9.1 adds no api-server test (platform-only). The api-server suite stays single-config serial per `[[api-server-serial-tests]]`; pre-existing flake `block/admin.test.ts:406` (QA-023) — re-run on flake, not a regression of this step.

---

## § 9 — Smoke-test scenario (executor records the run in `output.md`)

**Preconditions**: `db:reset` + `db:seed`; the platform dev server running; logged in as the seeded coach; a draft training plan open; a week → day → session → block created via the existing UI, and inside the block a schema created (e.g. `n-rounds` or `amrap-flat` — the 8.4 editor).

1. Open the schema's block. **Expected**: the schema card shows its header + params summary; the body shows an "Add row" button, no rows, no placeholder text.
2. Tap "Add row". **Expected**: a row-kind menu — 8 entries (exercise / rest / footnote / standalone load / url / placeholder / inner-ladder marker / rep definition), all clickable, none greyed.
3. Pick "standalone load". **Expected**: a row form opens with a load-kind selector (5 — absolute / percentage / bodyweight / without weight / unspecified).
4. Pick "absolute". **Expected**: a weight-variant selector (8) appears.
5. Pick "single arm", enter `32`. **Expected**: a static caption "applies to all preceding rows" is visible (not a control).
6. Save. **Expected**: a row appears in the schema body — a readable load summary ("32 kg single arm" or similar), with drag / edit / delete affordances.
7. Add a second row → standalone load → "percentage" → value `60` → reference "self". Save. **Expected**: a second row, summary "60%" (with the self reference).
8. Drag the second row above the first. **Expected**: the order swaps, persists on reload.
9. Open the first row's menu → Edit → change the weight → save. **Expected**: the row summary updates.
10. Tap "Add row" → pick an unimplemented rowKind (e.g. "exercise"). **Expected**: nothing opens, no error.
11. Delete a row via its menu → confirm. **Expected**: the row disappears, persists on reload.

**Rollback**: delete the created rows / schema / block / session via their menus, or `db:reset` + `db:seed`.

---

## § 10 — Output report format (executor produces `implementation/step-09.1/output.md`)

Per WORKFLOW.md: `## Что сделано` · `## Изменённые/созданные файлы` · `## Принятые решения` · `## Возникшие вопросы и как решены` · `## Что отложено` · `` ## Ссылка на `.feature-dev/<ts>/` `` · `## Сценарий смоук-теста` (the § 9 run + result) · `## Verification notes` · `## Acceptance criteria self-check`.

**Escalation** (WORKFLOW.md): anything the spec did not anticipate — a § 0 verbatim quote that no longer matches, an unexpected § 0.A grep hit, a contract that rejects the assembled payload, the `switch`-dispatch not typing cleanly — **STOP and surface via `AskUserQuestion`** with the verbatim evidence + a hypothesis. Do not silently adapt. In particular: do **not** dispatch `LoadEditor` / `WeightEditor` via a `Record`-of-`FC` (D-9.1-4); do **not** render a control for the single-value `scope` / `without_weight.context` (D-9.1-3); do **not** add an `other_exercise` reference scope or an exercise picker (D-9.1-7); do **not** add empty-body placeholder text (D-9.1-10); do **not** change any contract / api-server / route / Prisma / seed file.

**End of prompt.**
