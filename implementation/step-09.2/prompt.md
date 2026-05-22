# Step 9.2 — SchemaRow body editor: REST + INNER_LADDER_MARKER + STANDALONE_URL rowKinds

**Wrapper**: `/feature` **full**. Three more SchemaRow body-editor rowKinds — a coach-facing UI step, three new self-contained `*RowForm` components + one reusable chip-array editor + a browser smoke-test. Not `/feature small`.

**Branch**: `feat/training-domain` long-lived. **NO new branch cut** (per `[[training-domain-workflow]]` + `[[always-via-feature-skill]]` — override the `/feature` skill's default `feat/<slug>` cut; stay on `feat/training-domain`). At prompt-write the branch is at `24d4d4db` (8 commits ahead of `main` `be988162` — the Step 9.1 work + close-out, kept local); the prompt commit (`docs(step-09.2): …`) is the `git diff` baseline.

**Predecessor**: Step 9.1 shipped the SchemaRow body editor for the `STANDALONE_LOAD` rowKind — the row-kind dispatch infra (`ROW_KIND_FORM_REGISTRY` + `RowEditorModal` + `AddRowButton` — an 8-rowKind menu, an unimplemented pick = no-op), `SchemaRowList` / `SchemaRowCard` embedded in `SchemaCard`, and the `LoadEditor` / `WeightEditor` / `LoadSummary` composites. The add-row menu shows 8 rowKinds; only `STANDALONE_LOAD` has a form — the other 7 are no-ops. Step 9.2 implements three of them: `REST`, `INNER_LADDER_MARKER`, `STANDALONE_URL` — three simple rowKinds, each one `*RowForm` + one `ROW_KIND_FORM_REGISTRY` entry + one `SchemaRowCard` body-summary branch, mirroring the 9.1 `StandaloneLoadRowForm` pattern.

**This step ships a browser smoke-test** (§ 9) — it is a coach-facing UI step.

Thesis ratified in the planner-user chat 2026-05-22 (two-voice; D-9.2-1..8 below — see § 1.x). OQ-C3 (`wrapped` semantics) was resolved by the planner from `analysis/` verbatim — see D-9.2-3.

---

## § 0 — Verbatim source reads (read-at-prompt-write-time per `[[planner-verbatim-registration]]` + `[[scope-via-existing-patterns]]`)

Reference material — the deliverable is described **structurally** in § 3, not as code skeletons (per `[[planner-strategic-level]]`). **Before executing § 3, re-Read each cited path verbatim and confirm a byte-for-byte match.** Any drift → STOP, surface via `AskUserQuestion` with the diff + a hypothesis. Project component patterns are sacred — do not import "React best-practice" instincts.

### § 0.1 — The canonical precedent: the Step 9.1 row-editor stack (`apps/platform/src/modules/plan-detail/components/`)

Step 9.2 adds three rowKinds to the dispatch infra 9.1 built. Read each verbatim in Research:

- `standalone-load-row-form.tsx` — `StandaloneLoadRowForm`: a **self-contained `*RowForm`** — owns `useForm({ resolver: zodResolver(...) })` + the form schema + `FormModal` (`@repo/ui`) + `useCreateSchemaRow` / `useUpdateSchemaRow`; an exported `toFormData(mode)` (`create` default vs `edit` reading `mode.row.rowPayload`); `useEffect(reset, [mode])`; `onSubmit` assembles `rowPayload` `as const` and branches `create` (`{ schemaId, rowKind, rowPayload }`) vs `edit` (`{ schemaRowId, data: { rowPayload } }`). → the three new `*RowForm` mirror this exactly.
- `row-kind-form-registry.ts` — `ROW_KIND_FORM_REGISTRY: Partial<Record<RowKind, React.FC<RowFormProps>>>` — currently `{ STANDALONE_LOAD: StandaloneLoadRowForm }`. → 9.2 adds three entries.
- `row-editor-types.ts` — `RowEditorMode` (`{ kind: "create"; schemaId; rowKind } | { kind: "edit"; row }`) + `RowFormProps` (`{ mode, planId, startDate, onClose }`). → unchanged; the three new forms consume `RowFormProps` verbatim.
- `row-editor-modal.tsx` — `RowEditorModal`: a thin dispatcher (`rowKind` from `mode`, registry lookup, render or `null`). → unchanged; it dispatches the new rowKinds the moment the registry has entries.
- `add-row-button.tsx` — `AddRowButton`: the `COACH_ROW_KINDS` 8-element menu, `handleSelect` registry-miss `return`, `useMemo`-d `RowEditorMode`. → **unchanged** — the menu is already complete; 9.2 only populates the registry, and three more rowKinds stop being no-ops.
- `schema-row-card.tsx` — `SchemaRowCard`: a `useSortable` drag card; `renderBody()` is a `switch (row.rowPayload.rowKind)` — `STANDALONE_LOAD → <LoadSummary>`, `default → <Chip variant="outlined" label={rowKind}>`; an Edit/Delete menu; `RowEditorModal` + `ConfirmationModal`; `useMemo`-d `editorMode`. → 9.2 **adds three `case` arms** to `renderBody`.
- `schema-row-list.tsx` — `SchemaRowList`: dnd reorder over `rows`, `AddRowButton` last. → **unchanged** (rowKind-agnostic).
- `load-summary.tsx` — `LoadSummary` + the exported `formatLoad` — a `switch`-based formatter rendering a `<Chip>`. → the precedent for the three new body summaries.
- `rest-spec-fields.tsx` — `RestSpecFields`: a **controlled sub-editor** (props `{ value: RestSpecFormValue, onChange, error?, disabled? }`) over `restSpecFormSchema` (`duration` value/unit/`rangeMax`, `scope`, optional `qualifier`/`setIndex`). Shipped in 8.4, consumed by `NRoundsSchemaForm`. → **reused verbatim** by the `REST` row form.
- `n-rounds-schema-form.tsx` / `n-rounds-form-schema.ts` — the `RestSpecFields`-in-a-form precedent: `NRoundsSchemaForm` wraps `RestSpecFields` in a `Controller`, the form schema embeds `restSpecFormSchema`. → the `REST` row form mirrors this `RestSpecFields` wiring.

### § 0.2 — SchemaRow contract (`packages/contracts/src/entities/lms/schema-row/`, verbatim)

`schema-row.constants.ts` — `ROW_KINDS` (9, the 8 coach-facing + `REST_SLOT`), `URL_APPLIES_TO`:

```ts
export const URL_APPLIES_TO = ["previous_exercise_row", "whole_schema"] as const;
export type UrlAppliesTo = (typeof URL_APPLIES_TO)[number];
```

`schema-row.schema.ts` — the three `schemaRowPayloadSchema` discriminated-union members 9.2 implements:

```ts
z.object({
  rowKind: z.literal("REST"),
  raw: z.string().min(1),
  parsed: restSpecSchema,
}),
z.object({
  rowKind: z.literal("INNER_LADDER_MARKER"),
  steps: z.array(z.number().int().positive()).min(1),
}),
z.object({
  rowKind: z.literal("STANDALONE_URL"),
  url: z.string().url(),
  wrapped: z.boolean(),
  appliesTo: urlAppliesToSchema,
}),
```

`createSchemaRowSchema` = `{ schemaId, rowKind, rowPayload, + 10 optional top-level modifiers }` (verbatim in the Step 9.1 prompt § 0.2). 9.2 — like 9.1 — sends `{ schemaId, rowKind, rowPayload }` only; no top-level modifier (all `optional`).

### § 0.3 — `restSpecSchema` (`_shared/cap-spec.ts`, verbatim — the `REST.parsed` shape)

```ts
export const REST_SCOPES = [
  "between_sets",
  "between_rounds",
  "between_intervals",
  "after_specific_set",
] as const;
export const REST_QUALIFIERS = ["until_recovery", "fixed", "range"] as const;
export const REST_DURATION_UNITS = ["sec", "min", "range_sec", "range_min"] as const;

export const restSpecSchema = z.object({
  duration: z
    .object({
      value: z.number().positive(),
      unit: z.enum(REST_DURATION_UNITS),
      rangeMax: z.number().positive().optional(),
    })
    .refine(/* rangeMax required & > value iff unit is range_*, forbidden otherwise */),
  scope: z.enum(REST_SCOPES),
  qualifier: z.enum(REST_QUALIFIERS).optional(),
  setIndex: z.number().int().positive().optional(),
});
```

`RestSpecFields` (8.4) edits a structurally-identical `restSpecFormValue` (its own `restSpecFormSchema` with the same shape + a path-bearing `superRefine` on `duration`). The `REST` row form reuses `RestSpecFields` for `parsed`.

### § 0.4 — Domain source (`analysis/`, verbatim — flavour (b) `[[coach-pov-first]]`)

`implementation-notes.md` § 1.4 — the three row-payload fixtures:

```jsonc
// REST
{
  "rowKind": "REST",
  "raw": "- 90 sec rest in between sets -",
  "parsed": { "duration": { "value": 90, "unit": "sec" }, "scope": "between_sets" }
}
// INNER_LADDER_MARKER (block-037)
{ "rowKind": "INNER_LADDER_MARKER", "steps": [36, 28, 20] }
// STANDALONE_URL
{
  "rowKind": "STANDALONE_URL",
  "url": "https://www.youtube.com/watch?v=...",
  "wrapped": true,
  "appliesTo": "previous_exercise_row"
}
```

`05-synthesis/domain-model.md` § 1.6.5 `StandaloneUrlRow` + § 1.6.7 `InnerLadderMarkerRow` (verbatim):

```
#### 1.6.5 StandaloneUrlRow
- kind = "standalone_url".
- url — string.
- wrapped — bool ([ URL ] vs bare URL).
- applies_to — previous_exercise_row (default) | whole_schema (для block-149 / block-147 YOGA TIME).
Sample evidence: 52 lines (50 [ URL ] + 2 bare).

#### 1.6.7 InnerLadderMarkerRow
- kind = "inner_ladder_marker".
- steps — array of integers (e.g., [36, 28, 20]).
- pairs_with_next_row — semantic flag (marker всегда associated с следующей exercise row в parallel-ladders archetype).
Note: эта row-type существует только внутри archetype-parallel-ladders-* и archetype-parallel-pyramids body.
```

`03-content/edge-cases.md` — the load-bearing `wrapped` finding (`case-bare-url-only-in-warm-up-feet`):

> «bare URLs (без `[ ]` wrapping) … escalation Phase 5: модель должна toleate-able bare URLs как content variant (**отсутствие `[ ]` wrapping — typo or styling, not semantic difference**).»

`wrapped` is a **non-semantic notation artifact** — `[ URL ]` (50/52 occurrences) vs a bare URL (2/52). It carries no functional meaning; the domain explicitly classes it as styling, not a semantic difference. See D-9.2-3 — the coach form pins it, no control. `STANDALONE_URL` appears in two archetype contexts (`stress-final.md` § 2.25): `url-only-body` (body = the URL alone — block-147 **YOGA TIME**, `appliesTo: whole_schema`) and `practice-list` (`<exercise> [ URL ]` — `appliesTo: previous_exercise_row`, a demo link). `appliesTo` IS functional — it is a real coach choice.

### § 0.5 — SchemaRow client hooks + API (verbatim — already shipped Step 8.3, consumed by 9.1)

`use-schema-rows.ts` — `useCreateSchemaRow` / `useUpdateSchemaRow` / `useDeleteSchemaRow` / `useReorderSchemaRows`, all on `useWeekMutation`. `createSchemaRowsAPI` over `/api/platform/training-plans/{planId}/schema-rows[...]`. **9.2 wires the three new forms to these existing hooks — it creates no hook, no api endpoint.** Both `api.schemaRows` and `use-schema-rows` are registered (Step 8.3) — 9.2 touches neither barrel.

### § 0.6 — The SchemaRow read-path is ready (verbatim)

`SchemaWithBody.rows: SchemaRow[]` is in the type (Step 8.3.5 depth-2 embed); `block.schemas[i].rows` is delivered by the week response; `SchemaCard` → `SchemaRowList` renders it (Step 9.1). No read-enabler is owed — the flavour-(g) `[[planner-read-surface-trace]]` trace is satisfied. 9.2 adds rowKind handling, not a read-path.

### § 0.7 — Registration files (Read verbatim at execution; quote current state, state additive intent, show final state)

- `apps/platform/src/modules/plan-detail/components/index.ts` — **56 named exports** at prompt-write (`AddBlockButton` … `WeightSplitTierFields`, alphabetical). 9.2 **appends** the new component exports, alphabetically sorted. Non-component `.ts` files (the new row-form schemas, if any are extracted) are NOT barrel-exported — matching `row-editor-types.ts` / `row-kind-form-registry.ts` / `n-rounds-form-schema.ts`.
- `apps/platform/src/modules/plan-detail/components/row-kind-form-registry.ts` — currently `{ STANDALONE_LOAD: StandaloneLoadRowForm }`; 9.2 adds `REST`, `INNER_LADDER_MARKER`, `STANDALONE_URL` entries (final: 4).
- `apps/platform/src/lib/hooks/index.ts`, `apps/platform/src/lib/api/**` — **NOT touched** (the hooks + api are shipped).
- `packages/contracts`, `packages/api-server`, `apps/platform/src/app/api/**`, `prisma/` — **NOT touched** (D-9.2-7).

### § 0.8 — Husky / turbo / commitlint (verbatim)

- `.husky/pre-commit`: `node scripts/check-secrets.mjs` → `npx lint-staged` → `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"`.
- `.husky/pre-push`: `pnpm dep:check` → `SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"`.
- `turbo.json` — `check-types` / `lint` `dependsOn ["^…"]`; `test` uncached.
- Commitlint: subject ≤ 100, fully lowercase; body lines ≤ 150 (safety ≤ 140).
- **9.2 is single-package** (`apps/platform` only). Per-layer atomic commits, no squash (§ 6).

### § 0.A — Grep enumeration (mandatory pre-execution, per `[[planner-consumer-pattern-read]]`)

Non-exhaustive — run each, confirm, surface any unexpected hit:

```bash
grep -rn "ROW_KIND_FORM_REGISTRY" apps/platform/src/                              # the registry + its 2 consumers (AddRowButton, RowEditorModal)
grep -rn "renderBody\|rowPayload.rowKind" apps/platform/src/modules/plan-detail/   # the SchemaRowCard switch 9.2 extends
grep -rn "RestSpecFields\|restSpecFormSchema" apps/platform/src/                   # the 8.4 sub-editor reused for REST.parsed
grep -rn "STANDALONE_URL\|INNER_LADDER_MARKER\|\"REST\"" apps/platform/src/        # expect: 0 platform consumers beyond the registry-miss path
grep -rn "FormModal" packages/ui/src                                              # the @repo/ui modal primitive the forms reuse
```

---

## § 1 — Goal & ratified decisions

### Coach view

**Walkthrough.** Денис внутри схемы, в теле которой уже стоят ряды отдельной нагрузки (созданы на 9.1). Жмёт «Add row» — меню видов ряда, 8 пунктов; теперь рабочих четыре. Выбирает **«Отдых»** — форма: длительность (число + единица — секунды / минуты / диапазон), где отдыхать (между сетами / раундами / интервалами / после конкретного сета), по желанию квалификатор. Заполняет «90 секунд между сетами», сохраняет — в теле схемы ряд «rest 90 sec between sets». Затем **«Маркер лесенки»** — поле для ступеней: печатает «21», «15», «9», каждое число становится чипом; ряд рендерится цепочкой «21 → 15 → 9». Затем **«Ссылка»** — поле URL и выбор «к чему относится» (предыдущий ряд упражнения / вся схема); вставляет ссылку на разминочное видео, сохраняет — ряд со ссылкой. У всех трёх — перетаскивание / редактирование / удаление, как у рядов нагрузки.

**Goal (coach).** Набор видов ряда расширяется тремя простыми — отдых, маркер лесенки, ссылка. После 9.2 у тренера четыре рабочих вида ряда; тело схемы наполняется разнообразнее (главный вид — упражнение — это Step 9.3).

### Developer view

**Goal.** Ship three simple rowKinds — `REST`, `INNER_LADDER_MARKER`, `STANDALONE_URL` — each a self-contained `*RowForm` registered in `ROW_KIND_FORM_REGISTRY`, mirroring the 9.1 `StandaloneLoadRowForm` pattern. `REST` reuses the 8.4 `RestSpecFields` sub-editor; `INNER_LADDER_MARKER` introduces a reusable chip-array number editor; `STANDALONE_URL` is a flat form. Plus three `SchemaRowCard.renderBody` summary branches. Platform-only on the shipped 8.0b-8.3.5 backend. `/feature` full.

### § 1.x — Ratified decisions (planner-user chat 2026-05-22)

- **D-9.2-1 (one step, `/feature` full).** 9.2 ships the three rowKinds + the reusable chip-array editor + the three body summaries as one step. The chip-array editor without its `INNER_LADDER_MARKER` consumer would be orphan infrastructure (the queue's ship-with-first-consumer principle). Three new forms + a sub-editor + a browser smoke-test exceed the `/feature small` carve-out → `/feature` full.

- **D-9.2-2 (three self-contained `*RowForm`, the 9.1 mirror).** `RestRowForm` / `InnerLadderMarkerRowForm` / `StandaloneUrlRowForm` — each owns its `useForm` + `zodResolver` + `FormModal` + `useCreateSchemaRow` / `useUpdateSchemaRow`, with an exported `toFormData(mode)` and `useEffect(reset, [mode])`, exactly as `StandaloneLoadRowForm`. `ROW_KIND_FORM_REGISTRY` gains three entries (final: 4). `RowEditorModal` / `AddRowButton` / `RowEditorMode` / `RowFormProps` are unchanged — the dispatch infra is rowKind-agnostic; 9.2 only populates the registry.

- **D-9.2-3 (`STANDALONE_URL.wrapped` is pinned, not a control; `appliesTo` is a control).** Planner-resolved from `analysis/` verbatim (the ratified OQ-C3): `wrapped` is a **non-semantic notation artifact** — `[ URL ]` vs a bare URL — `03-content/edge-cases.md` explicitly classes the absence of bracket-wrapping as "typo or styling, **not semantic difference**". The coach form does **not** render a control for `wrapped`; the payload pins `wrapped: true` (the canonical bracket form — 50/52 occurrences; the domain's normalize-to-bracket recommendation). The mirror of D-9.1-3 (a non-coach-decision field pinned in code). `appliesTo` **is** a functional coach choice (`previous_exercise_row` = a demo link for the row above — the default; `whole_schema` = a resource for the schema — the YOGA case) → a `Select` of the two `URL_APPLIES_TO` values, default `previous_exercise_row`.

- **D-9.2-4 (`REST` — structured `parsed`, derived `raw`).** The `REST` payload is `{ rowKind: "REST", raw: string, parsed: restSpec }`. The coach fills the **structured** `parsed` via the reused `RestSpecFields` (8.4 verbatim) — never types rest text. `raw` (required `z.string().min(1)`) is **derived** from `parsed` by a formatter (`formatRestRaw(parsed)` — the `formatLoad` precedent), assembled in `onSubmit`; it is not a form field. The formatter is shared between `RestRowForm`'s `onSubmit` (the `raw` value) and the `SchemaRowCard` `REST` body summary (the same readable string).

- **D-9.2-5 (`INNER_LADDER_MARKER` — a reusable chip-array number editor).** `steps: z.array(z.number().int().positive()).min(1)` — a chip-array input (type a positive integer → a chip; remove a chip; a UI `.min(1)` floor — the last chip cannot be removed). Built as a **reusable controlled sub-editor** (`{ value: number[], onChange, error?, disabled? }` — the `RestSpecFields` / `LoadEditor` controlled shape): `INNER_LADDER_MARKER` is its first consumer, and the Ladder-family (Step 8.5) + parallel-ladders (8.6) archetype param forms need the identical `steps: array<positiveInt>` shape — they will reuse it. `steps` may contain repeats (`11-9-7-9-11` vertex pyramid) — no de-dup. Domain note: `INNER_LADDER_MARKER` semantically belongs inside parallel-ladders / parallel-pyramids archetype bodies (`domain-model.md` § 1.6.7), but the row editor is archetype-agnostic — the add-row menu offers all 8 rowKinds in every schema with zero availability logic (D-9.1-2); placing a marker sensibly is the coach's editorial responsibility, not a UI gate.

- **D-9.2-6 (`SchemaRowCard.renderBody` — three new summary branches).** `renderBody` currently switches `STANDALONE_LOAD → <LoadSummary>`, `default → inert kind chip`. 9.2 adds `REST` / `INNER_LADDER_MARKER` / `STANDALONE_URL` arms, each a readable summary (the `LoadSummary` formatter precedent — `REST` → "rest 90 sec between sets" via the shared `formatRestRaw`; `INNER_LADDER_MARKER` → "21 → 15 → 9"; `STANDALONE_URL` → the url, readably). The `default` inert chip stays for the 5 still-unimplemented rowKinds (`EXERCISE` / `FOOTNOTE` / `PLACEHOLDER` / `REP_DEFINITION` + `REST_SLOT`).

- **D-9.2-7 (platform-only — no contracts / api-server / routes / Prisma / seed / admin change).** 9.2 touches only `apps/platform/src/modules/plan-detail/`. Per-layer atomic commits, no squash (§ 6).

- **D-9.2-8 (toast-policy carry-forward NOT folded; QA-305 carry-forward NOT fixed).** Row mutations toast via `useWeekMutation` as-is (the toast-policy carry-forward stays a separate `/feature small`). The three new `*RowForm` inherit the `useEffect(reset, [mode])` + `useMemo`-d-mode shape — they carry the QA-305 refetch-clobber residual (identical to 9.1 `SchemaRowCard` / 8.4 `SchemaCard`); **not** a 9.2 fix (codebase-wide UX-polish).

---

## § 2 — Scope

### In scope (`apps/platform/src/modules/plan-detail/`)

New:

- A reusable **chip-array number editor** (controlled `{ value: number[], onChange, error?, disabled? }`; UI `.min(1)` floor; allows repeats) — `INNER_LADDER_MARKER`'s first consumer, built for Step 8.5/8.6 reuse.
- `RestRowForm` — a self-contained `*RowForm`; reuses `RestSpecFields` for `parsed`; derives `raw` via a shared `formatRestRaw` formatter.
- `InnerLadderMarkerRowForm` — a self-contained `*RowForm` over the chip-array editor.
- `StandaloneUrlRowForm` — a self-contained `*RowForm`; `url` field + `appliesTo` `Select` (2); `wrapped` pinned `true` in `onSubmit`, no control.
- Three `SchemaRowCard.renderBody` summary branches (the `formatRestRaw` / `INNER_LADDER_MARKER` / `STANDALONE_URL` readable summaries — the `LoadSummary` formatter precedent; the exact file split is the executor's call).

Modified:

- `row-kind-form-registry.ts` — three new entries.
- `schema-row-card.tsx` — three new `renderBody` `case` arms.
- `components/index.ts` — append the new component exports.

Tests — platform component / pure-logic tests per the Step 9.1 convention (the `formatRestRaw` formatter, the chip-array editor logic, the three row-form schemas — pure-function tests, the 9.1 `.test.ts` precedent).

### Out of scope

- The 5 remaining coach-facing rowKinds (`EXERCISE` / `FOOTNOTE` / `PLACEHOLDER` / `REP_DEFINITION`) — Steps 9.3-9.9.
- Top-level SchemaRow modifiers + the RepNotation / Side / CompoundRep / Tempo / Media / Intensity composite VOs — Steps 9.3-9.11.
- The parallel-ladders / Ladder archetype param forms (which reuse the chip-array editor) — Steps 8.5-8.6.
- `packages/contracts`, `packages/api-server`, the HTTP routes, the Prisma schema, the seed, `apps/admin` — not changed.
- The toast-policy carry-forward; the QA-305 refetch-clobber (D-9.2-8).

---

## § 3 — Phases (spec-only — structural, no code skeletons; per `[[planner-strategic-level]]`)

No code comments (project rule). The `/feature` Plan stage details the file list; the phases below are the logical decomposition + the commit boundaries (§ 6).

### Phase 1 — the reusable chip-array number editor + the `formatRestRaw` formatter

The chip-array editor — a controlled sub-editor (`{ value: number[], onChange, error?, disabled? }`, the `RestSpecFields` shape): a coach types a positive integer and it becomes a chip; chips render in order; a chip is removable; a UI `.min(1)` floor (the last chip cannot be removed — the `split_tier` `.min(2)` floor precedent from 9.1); repeats allowed. `formatRestRaw(restSpec) → string` — a pure formatter producing a readable rest string (e.g. "rest 90 sec between sets") for the `REST` payload's `raw` and the `SchemaRowCard` summary (the `formatLoad` precedent).

### Phase 2 — the three `*RowForm` + the registry entries

Each mirrors `StandaloneLoadRowForm` (§ 0.1) — `useForm` + `zodResolver` + `FormModal` + the create/update hooks + `toFormData(mode)` + `useEffect(reset, [mode])` + an `onSubmit` assembling the `rowPayload`. `RestRowForm` — wraps `RestSpecFields` in a `Controller` (the `NRoundsSchemaForm` wiring); `onSubmit` builds `{ rowKind: "REST", parsed, raw: formatRestRaw(parsed) }`. `InnerLadderMarkerRowForm` — wraps the Phase-1 chip-array editor; `onSubmit` builds `{ rowKind: "INNER_LADDER_MARKER", steps }`. `StandaloneUrlRowForm` — a `url` `TextField` + an `appliesTo` `Select` (the 2 `URL_APPLIES_TO` values); `onSubmit` builds `{ rowKind: "STANDALONE_URL", url, wrapped: true, appliesTo }`. Each form is registered in `ROW_KIND_FORM_REGISTRY`.

### Phase 3 — `SchemaRowCard.renderBody` summaries

Add the three `case` arms to the `renderBody` `switch` — `REST` (the `formatRestRaw` string), `INNER_LADDER_MARKER` (the steps chain), `STANDALONE_URL` (the url, readably). The `default` inert kind chip stays for the still-unimplemented rowKinds.

### Phase 4 — `db:reset` + `db:seed`

9.2 changes neither the Prisma schema nor the seed. Run `pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed` once to confirm a clean DB for the smoke-test.

### Phase 5 — tests

Pure-function / pure-zod tests per the Step 9.1 convention: `formatRestRaw`, the chip-array editor logic, the three row-form schemas (`toFormData` branches + the payload assembly). The browser smoke-test (§ 9) is the primary UI validation.

### Phase 6 — verifications

Per § 8.

---

## § 4 — Acceptance criteria

1. ✅ A reusable chip-array number editor — controlled (`{ value: number[], onChange, error?, disabled? }`); type-a-number-→-chip, remove-chip, a UI `.min(1)` floor (the last chip is not removable); repeats allowed.
2. ✅ `RestRowForm` — a self-contained `*RowForm`; reuses `RestSpecFields` for the structured `parsed`; `raw` derived via a shared `formatRestRaw` (not a form field); registered.
3. ✅ `InnerLadderMarkerRowForm` — a self-contained `*RowForm` over the chip-array editor; `steps` `.min(1)`; registered.
4. ✅ `StandaloneUrlRowForm` — a self-contained `*RowForm`; `url` field + `appliesTo` `Select` (2 values, default `previous_exercise_row`); `wrapped` pinned `true` in the payload with **no UI control** (D-9.2-3); registered.
5. ✅ `ROW_KIND_FORM_REGISTRY` has 4 entries (`STANDALONE_LOAD` + the 3 new); the `AddRowButton` menu is unchanged (8 rowKinds) — 4 now open a form, the other 4 stay no-ops.
6. ✅ `SchemaRowCard.renderBody` renders a readable summary for `REST` / `INNER_LADDER_MARKER` / `STANDALONE_URL`; the `default` inert chip stays for the 5 unimplemented rowKinds.
7. ✅ Payload shapes exact — `REST`: `{ rowKind, raw, parsed }` (`raw` non-empty, derived); `INNER_LADDER_MARKER`: `{ rowKind, steps }`; `STANDALONE_URL`: `{ rowKind, url, wrapped: true, appliesTo }`. No top-level modifier sent.
8. ✅ No `packages/contracts` / `packages/api-server` / HTTP-route / Prisma / seed / `apps/admin` change; `hooks` / `api` barrels untouched (D-9.2-7).
9. ✅ `pnpm check-types` 16/16; `pnpm lint` 16/16, 0 warnings; `vitest --project platform` green; `pnpm dep:check` 0 violations.
10. ✅ Per-layer atomic commits on `feat/training-domain`; husky clean; zero `--no-verify` / `--no-edit` / `--no-gpg-sign`.
11. ✅ The browser smoke-test (§ 9) passes.

---

## § 5 — Adversarial pass (per `[[planner-adversarial-review]]`)

- **`REST.raw` non-empty.** `raw` is `z.string().min(1)` — `formatRestRaw` must produce a non-empty string for **every** `restSpec` shape (all `REST_DURATION_UNITS`, all `REST_SCOPES`, with/without `qualifier`/`setIndex`, the `range_*` units). A formatter returning `""` for any branch → a contract-rejected payload.
- **`REST` `range_*` units.** `restSpecFormSchema.duration` refine: `rangeMax` is required and `> value` iff `unit ∈ {range_sec, range_min}`. `RestSpecFields` already shows/hides `rangeMax` accordingly (8.4-shipped) — the `REST` form inherits it; `formatRestRaw` must render the range form ("rest 60-90 sec …").
- **chip-array — bad input.** A non-numeric / empty / zero / negative / decimal entry must not produce a chip (`z.number().int().positive()` — the editor rejects pre-chip or the form schema rejects on submit). The `.min(1)` floor — removing down to one chip disables further removal; a fresh `INNER_LADDER_MARKER` create starts with ≥1 chip.
- **chip-array repeats.** `11, 9, 7, 9, 11` (a vertex pyramid) is valid — no de-dup; the editor must not collapse repeats.
- **`STANDALONE_URL` url validation.** `z.string().url()` rejects a non-URL string → a clean field error; the form blocks submit. `wrapped` is never user-set — confirm the payload always carries `wrapped: true` (D-9.2-3), assembled in `onSubmit`, not from a control.
- **Editor `mode` identity.** Each `*RowForm` re-syncs via `useEffect(reset, [mode])`; `AddRowButton` / `SchemaRowCard` `useMemo` the `RowEditorMode` (the 8.4 WARN-1 mirror — already shipped). The QA-305 refetch-clobber residual carries (D-9.2-8) — not fixed here.
- **Concurrent create / reorder race.** `useCreateSchemaRow` / `useReorderSchemaRows` are the shipped 9.1-consumed hooks — QA-001c (P2002) / QA-W2 (reorder race) carry-forwards, not worsened, not folded.
- **Unimplemented rowKind.** After 9.2, 4 of 8 menu rowKinds have forms; picking one of the 4 still-unimplemented (`EXERCISE` / `FOOTNOTE` / `PLACEHOLDER` / `REP_DEFINITION`) → a clean no-op (registry miss → no modal), mirror of 9.1.
- **flavour (i) type-sim.** The three rowKinds are simple — no discriminated runtime dispatch (the `LoadEditor` / `WeightEditor` shape). `INNER_LADDER_MARKER.steps` is `number[]`, not a union. `restSpecFormSchema` / the form schemas infer cleanly (the 9.1 + 8.4 precedent). Low type-risk; no `Record`-erasure surface.

---

## § 6 — Commit strategy (per-layer atomic, verified against live hook config per `[[husky-cross-package-squash]]`)

9.2 is **single-package** (`apps/platform` only). Every commit is additive within one package — no cross-package fan-out, no broken intermediate tree. Per-layer atomic commits; **no squash**. Suggested boundaries (the executor confirms against `.husky/{pre-commit,pre-push}` + `turbo.json`):

1. The reusable chip-array number editor + the `formatRestRaw` formatter.
2. The three `*RowForm` + the `ROW_KIND_FORM_REGISTRY` entries.
3. The `SchemaRowCard.renderBody` summary branches + the `components/index.ts` barrel.
4. Tests (or folded into 1-3 — executor's call).

Conventional-commits, subject ≤ 100 lowercase, body lines ≤ ~140. Stage by explicit file names (never `git add -A`). Never `--no-verify` / `--no-edit` / `--no-gpg-sign`. The planner writes the `docs(step-09.2): …` close-out commit separately.

---

## § 7 — Out-of-scope / deferred (forward notes)

- The 4 remaining coach-facing rowKinds (`EXERCISE` 9.3-9.6, `REP_DEFINITION` 9.7, `FOOTNOTE` 9.8, `PLACEHOLDER` 9.9) — each registers its rowKind's form.
- The chip-array editor is reused by the Ladder (8.5) + parallel-ladders (8.6) archetype param forms.
- QA-307 (`toRestrictedReference`) — a hard Step 9.3 prerequisite (`03-deferred.md`); not 9.2 scope (9.2 touches no `percentage` surface).
- QA-301 / QA-303 — deferred-domain / contract-hardening carry-forwards.
- QA-305 (the edit-form refetch-clobber) — codebase-wide UX-polish; the three new forms carry the residual (D-9.2-8).
- Toast-policy — a separate `/feature small`.

---

## § 8 — Verifications cheatsheet

```bash
pnpm --filter @repo/api-server db:reset && pnpm --filter @repo/api-server db:seed
pnpm check-types        # 16/16
pnpm lint               # 16/16, 0 warnings
npx vitest run --project platform   # platform delta green
pnpm dep:check          # 0 violations
```

9.2 adds no api-server test (platform-only). `apps/platform` has no own `test` script — the platform suite runs from the root single `vitest.config.ts` via `--project platform`. The api-server suite stays single-config serial per `[[api-server-serial-tests]]`; pre-existing flake `block/admin.test.ts:406` (QA-023) is unrelated.

---

## § 9 — Smoke-test scenario (executor records the run in `output.md`)

**Preconditions**: `db:reset` + `db:seed`; the platform dev server running; logged in as the seeded coach; a draft plan open; a week → day → session → block → schema created via the existing UI.

1. Open the schema's block. **Expected**: the schema body shows the "Add row" button (and any 9.1 `STANDALONE_LOAD` rows if added).
2. Tap "Add row". **Expected**: the row-kind menu — 8 entries, all clickable.
3. Pick "rest". **Expected**: a form with the structured rest fields (duration value + unit, placement, optional qualifier) — the 8.4 rest editor.
4. Fill "90 sec, between sets", save. **Expected**: a row in the body with a readable rest summary ("rest 90 sec between sets" or similar).
5. Tap "Add row" → "inner ladder marker". **Expected**: a chip-array field. Type `21`, `15`, `9` — each becomes a chip. Save. **Expected**: a row rendering the steps chain ("21 → 15 → 9").
6. Try to remove chips down to one — **Expected**: the last chip cannot be removed (the `.min(1)` floor).
7. Tap "Add row" → "url". **Expected**: a url field + an "applies to" select (2 options); no "wrapped" control. Enter a URL, pick "whole schema", save. **Expected**: a row with the url summary.
8. Enter an invalid URL in a new url row → **Expected**: a field error, save blocked.
9. Drag a row to reorder. **Expected**: order swaps, persists on reload.
10. Edit a rest row → change the duration → save. **Expected**: the summary updates.
11. Delete a row via its menu → confirm. **Expected**: the row disappears, persists on reload.

**Rollback**: delete the created rows / schema / block / session via their menus, or `db:reset` + `db:seed`.

---

## § 10 — Output report format (executor produces `implementation/step-09.2/output.md`)

Per WORKFLOW.md: `## Что сделано` · `## Изменённые/созданные файлы` · `## Принятые решения` · `## Возникшие вопросы и как решены` · `## Что отложено` · `` ## Ссылка на `.feature-dev/<ts>/` `` · `## Сценарий смоук-теста` (the § 9 run + result) · `## Verification notes` · `## Acceptance criteria self-check`.

**Escalation** (WORKFLOW.md): anything the spec did not anticipate — a § 0 verbatim quote that no longer matches, an unexpected § 0.A grep hit, a contract that rejects the assembled payload, `formatRestRaw` unable to cover a `restSpec` branch — **STOP and surface via `AskUserQuestion`** with the verbatim evidence + a hypothesis. Do not silently adapt. In particular: do **not** render a `wrapped` control (D-9.2-3 — it is pinned `true`); do **not** make `raw` a coach-typed field (D-9.2-4 — it is derived); do **not** add availability logic to the add-row menu (D-9.1-2); do **not** change any contract / api-server / route / Prisma / seed file.

**End of prompt.**
