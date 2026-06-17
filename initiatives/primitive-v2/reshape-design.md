# primitive-v2 — reshape design (the ratified leaf changes)

**Status: RATIFIED (2026-06-17, owner "ОК х5" + one-wave directive).** This is the design lock (plan step 0). It turns basket-B (`session-primitive/e2e-findings.md`) into one `/feature` (full) wave that extends the FROZEN `primitive-spec.md`. Read alongside `decisions.md` (the superseding D-V2-\* calls) and the frozen spec (the baseline). The executor reads THIS doc + the frozen spec + the verbatim source — it does not re-derive the model.

## 0. What research changed (before any code)

Verified verbatim against live contracts / Prisma / editor at design time:

- **P-6 is already closed.** `REP_UNITS = ["sec", "min", "m", "km", "cal"]` (`reps.ts:3`). Meters + calories already express; `unit_bound {unit:"min", value:2}` already gives "Row 2:00". So **#12 collapses to its Zone-2 = row-intensity remnant → folds into #3.** No standalone #12 work.
- **#4 is owner-directed, not open.** GAP-1 in `e2e-evil-corpus.md` already ruled: _"make cap a separate optional axis on the composition, orthogonal to repetition.kind."_ We confirm the form; we do not re-open.
- **Intensity re-open = restoring the spec's own original intent.** `primitive-spec.md` Grid B `intensity` row says verbatim _"scopes block/schema/row; partial-overlay inheritance is render-time, no storage cost"_ — then `D-FLOORS` (same day, later) cut it to schema-only. The spec contradicts itself. The re-open resolves it toward Grid B; `D-FLOORS` over-corrected (it feared block→child promotion; the real need is each-level-own-value + render overlay).
- **#13 (Clean Complex) and BASKET-C-19 (per-round rotation) already express** (compound row-group / per-set row-group — evil-corpus S3 builds both ✅). Not gaps; no fold needed.

## 1. Ratified dispositions

| #   | Gap (owner words)               | Disposition                                   | Decision                               |
| --- | ------------------------------- | --------------------------------------------- | -------------------------------------- |
| 3   | rest + RPE at the ROW level     | RE-OPEN D-FLOORS+D-PLAQUE                     | D-V2-INTENSITY-TRINITY + D-V2-ROW-REST |
| 16  | effort at the BLOCK level       | RE-OPEN D-FLOORS                              | D-V2-INTENSITY-TRINITY                 |
| 12  | row duration / Zone 2           | duration EXISTS; Zone2 → #3                   | (folds into #3)                        |
| 4   | time cap on ANY schema          | NEW cross-cutting axis (owner-directed GAP-1) | D-V2-CAP-AXIS                          |
| 6   | sub-minute interval             | EXTEND interval work/off                      | D-V2-INTERVAL-UNIT                     |
| 17  | nested profiles (RX/SC × ♂/♀) | EXTEND byProfile → axes/cells                 | D-V2-PROFILE-NESTING                   |
| 11  | score / time-windowed effort    | DEFER (no inert field)                        | D-V2-EXEC-DEFER-HOLD                   |
| 20  | rest between schemas            | DEFER; 1st half already = schema rest         | D-V2-EXEC-DEFER-HOLD                   |

**Process:** ONE `/feature` (full), no floor-split (owner-directed; mirrors `DR-W4-5 ONE-WAVE`). `db:reset` world — no migration files, aggressive bridge-free, only the final pushed tree green (ADR-0019 / [[discipline-db-non-prod]] / [[aggressive-migration-no-bridge]]).

## 2. The five changes — exact shapes + touch-points

All "current" shapes are verbatim from the design-time verify. New shapes are the design contract — the executor implements to them, does not re-invent.

### 2.1 Intensity on row + block (one axis, three carriers, render-time overlay)

**Channel Т.** `intensitySchema` already exists (`_shared/intensity.ts`) and is rich (`effortPercent | rpe | pace | hrZone | numericPace`, ≥1 required). It is **reused unchanged** — we only add two new carriers.

- **Prisma:** `SchemaRow.intensity Json?` + `Block.intensity Json?` (new columns). `Schema.intensity` already exists.
- **Contracts:**
  - `schema-row.schema.ts` → `schemaRowSchema` gains `intensity: intensitySchema.nullable()`; `createSchemaRowSchema` gains `intensity: intensitySchema.nullable().optional()`; `updateSchemaRowSchema` inherits via `.partial()`.
  - `block.schema.ts` → `blockSchema` gains `intensity: intensitySchema.nullable()`; `createBlockSchema` gains `intensity: intensitySchema.nullable().optional()`; `updateBlockSchema = createBlockSchema` inherits.
  - **Check `composeRowSchema`** (`composition.schema.ts`) — if the compose/draft authoring path writes rows, it gains `intensity` too (it carries the row leaf today: reps/load/side/tempo/media/notes).
- **Mappers:** `mapToSchemaRow` (+`intensity: r.intensity===null?null:intensitySchema.parse(r.intensity)`); `mapToBlock` (+ same). `mapToBlockWithLabels/WithSchemas` inherit via spread.
- **Handlers:** schema-row `create`/`update` + block `create`/`update` marshal `intensity` via `marshalNullableJson` (mirror the existing `notes` line). Block `update` today only handles `notes` — add `intensity`.
- **Client:** `RowFormState` + `buildRowRequest` gain `intensity`; block update request gains `intensity` (the block edit surface is NEW — see editor). `SchemaDraft` already has `intensity`; `composeContainerToComposition` does not need it (intensity is a sibling column, not inside `composition`).
- **Editor (write):** row-editor-modal adds an `IntensityFields` section (reuse the component verbatim; mirror the rest add/remove pattern in `container-inspector.tsx:147-149`). Block gets a NEW intensity edit surface — `block-card-head.tsx` renders only labels today; add a block inspector affordance (UX → ui-ux-pro-max stage). Schema intensity edit is unchanged (`container-inspector`).
- **Editor (render):** `row-summary-chips.tsx` adds intensity chips (reuse `formatIntensityChips`); `block-card-head.tsx` adds intensity chips (NEW); `schema-card-meta.tsx` already renders schema intensity.

**Overlay semantics (ratified — owner: "ближний перебивает дальнего"; partial dimension-wise, the lean I flagged):** intensity is stored independently at each level; the **render** computes the effective intensity per node as a dimension-wise merge with precedence **row > schema > block** — each of the 5 dimensions resolves to the nearest level that set it. No storage promotion. The render visually distinguishes own vs inherited (e.g. inherited dimmer). A `resolveIntensity(block, schema, row)` helper is the single source of the merge (one-predicate rule, mirror `isStructurallyParallel`'s threaded-once pattern). Partial-vs-full was left as a UX sub-question; partial is the lean and is what "ближний перебивает дальний per dimension" means.

### 2.2 Row rest (per-exercise rest, alongside schema rest)

**Channel Т.** `restSpecSchema` already exists (`_shared/cap-spec.ts`: `{duration{value,unit,rangeMax?}, scope, qualifier?, setIndex?}`). Reused unchanged.

- **Prisma:** `SchemaRow.rest Json?` (new column).
- **Contracts:** `schema-row.schema.ts` → `schemaRowSchema` gains `rest: restSpecSchema.nullable()`; create gains optional; update inherits. (`composeRowSchema` check as above.)
- **Mappers:** `mapToSchemaRow` (+ `rest: r.rest===null?null:restSpecSchema.parse(r.rest)`).
- **Handlers:** schema-row create/update marshal `rest`.
- **Client/editor:** `RowFormState` + `buildRowRequest` gain `rest`; row-editor-modal adds a `RestSpecFields` section (reuse; same add/remove pattern as the schema rest). Render: a rest chip in `row-summary-chips` (reuse `formatRestSpec`).
- **Scope note:** row rest reuses the full `restSpecSchema`; on a row the natural scope is `between_sets` (rest between this exercise's sets). Don't over-validate scope (it's render/coach meaning, not an invariant). Schema rest stays as the round-rest of the whole schema — row rest is **additive**, not a replacement. This re-opens ONE-rest-per-schema (D-PLAQUE) by **scope** (row vs schema), NOT by adding a second rest to one schema (the thing the owner rejected).

### 2.3 Cross-cutting cap (the #4 call)

**Channel Т.** `timeCapSchema` already exists (`_shared/time-cap.ts`: `{min, max?, unit: min|sec}`). Reused unchanged.

- **Prisma:** none — `cap` rides inside `Schema.composition` Json.
- **Contracts:** `composition.schema.ts` → `compositionSchema` gains `cap: timeCapSchema.optional()`. The 6 `repetitionAxisSchema` kinds are **untouched** (sacred) — the `timeCap` kind stays for AMRAP / pure time-bound ("the time IS the scheme"). `composition.cap` = a ceiling over ANY kind ("21-15-9 capped at 12 min").
- **Mappers:** none — `mapToSchema`'s `compositionSchema.parse(s.composition)` picks `cap` up automatically.
- **Handlers:** none — schema create/update already marshals `composition`.
- **Client/editor:** `buildComposition` / `composeContainerToComposition` carry `cap`; `SchemaDraft` gains `cap?: TimeCap | null`. Add a cap section to the schema axis editor (`container-inspector` or `axis-editor-modal`) — **reuse `TimeCapFields`** (already used for the timeCap kind), add/remove pattern like rest.
- **Render:** `format-composition-summary.ts` adds a cap part (reuse the `timeCap`-kind cap formatter); a cap chip on the schema head (`schema-card-meta`).
- **No reject superRefine.** `cap` when `repetition.kind === "timeCap"` is redundant but not invalid — the **UI hides the cap toggle** for the timeCap kind. Don't add a `compositionSchema.superRefine` for it (cost > value; it's not an invariant violation).

### 2.4 Sub-minute interval (#6)

**Channel Т.** Current: `interval {workMin: int>0, offMin: int≥0, count: int>0}`.

- **Prisma:** none — interval rides inside `Schema.composition` Json.
- **Contracts:** `composition.schema.ts` → the `interval` variant becomes:
  ```
  z.object({
    kind: z.literal("interval"),
    work: z.object({ value: z.number().positive(), unit: z.enum(INTERVAL_DURATION_UNITS) }),
    off:  z.object({ value: z.number().nonnegative(), unit: z.enum(INTERVAL_DURATION_UNITS) }),
    count: z.number().int().positive(),
  }).strict()
  ```
  with `INTERVAL_DURATION_UNITS = ["sec", "min"] as const`. (`value` is `.positive()`/`.nonnegative()`, NOT `.int()` — `:20 sec` is the point; off can be 0.) This mirrors the existing `{value, unit}` duration pattern (`restSpecSchema.duration`, `timeCapSchema`). Field rename `workMin/offMin → work/off`.
- **Mappers:** none (inside composition Json).
- **Editor:** `interval-axis-field.tsx` — the two raw NumberFields become `{value, unit}` editors; add a unit toggle (reuse `TimeCapFields`'s unit ToggleButtonGroup pattern). `composeContainerToComposition` / `mapRepetition` carry the new shape.
- **Render:** `format-composition-summary.ts:31-32` interval formatter updates: `8×:20/:10` for sec, `8×1'/1'` for min.

### 2.5 Nested profiles (#17)

**Channel Т — but no live reader (the byProfile resolver is Phase 3 per D-LOAD-FINAL).** So nesting serves **authoring + render**, legitimately (byProfile is already typed + rendered — this is doing the existing axis right, not an inert field). Current: `byProfile {entries: {label, kg}[]}` (flat).

- **Prisma:** none — byProfile rides inside `SchemaRow.load` Json.
- **Contracts:** `load.ts` → the `byProfile` variant becomes:
  ```
  z.object({
    kind: z.literal("byProfile"),
    axes: z.array(z.object({
      name: z.string().trim().min(1),
      values: z.array(z.string().trim().min(1)).min(1),
    })).min(1).max(2),                       // 1–2 axes (ratified cap)
    cells: z.array(z.object({
      coords: z.array(z.string().trim().min(1)).min(1).max(2),
      kg: z.number().positive(),
    })).min(1),
  }).superRefine(/* cells cover the cartesian product of axes; coords valid + unique */)
  ```
  `coords` holds one value per axis, in axis order. 1 axis → a list (RX/SC, or ♂/♀); 2 axes → a grid (RX/SC × ♂/♀).
- **Max 2 axes — RATIFIED** (my rec inside Call 4, owner "ОК х5"; flagged explicitly here so the owner can catch it at prompt review if he meant N).
- **db:reset, no data migration** — old flat `entries` shape just goes (no prod data; plans are hand-built).
- **Editor:** `load-by-profile-fields.tsx` is rewritten — an axes editor (name + values) that generates the cell grid for kg entry. Parent `load-editor.tsx` `KIND_DEFAULTS.byProfile` updates to the new seed.
- **Render:** `format-load.ts:34-35` byProfile branch renders 1-axis as a list, 2-axis as a grid (the garbled "RX (M):9 / …" string dies).

## 3. Re-expression of the hardest evil-corpus cases (mirror spec §8)

The cases the reshape changes — confirm each builds cleanly post-reshape:

1. **Fran capped** (S1-C, was ❌ GAP-1): `repetition.ladder [21,15,9]` + `composition.cap {min:12, unit:"min"}`. "FOR TIME" stays a note (D-EXEC-DEFER). Cap is now typed, not a note.
2. **Tabata** (S1-D, was ❌ GAP-2): `repetition.interval { work:{20,sec}, off:{10,sec}, count:8 }`. Builds.
3. **Back Squat 5×5 @75% RPE 8 rest 2–3'** (S1-B): now the leaf carries it — Row `intensity.rpe=8` + `rest {range 2–3 min, between_sets}` ON THE ROW (was forced onto the schema). Cleaner when the strength block holds several movements.
4. **Metcon @85% effort** (S3-B, was schema-only): `block.intensity.effortPercent=85`; member schemas inherit via render overlay; a harder schema overrides.
5. **Wall Ball RX♂9/RX♀6/SC♂6/SC♀4** (S3): `byProfile { axes:[{level,[RX,SC]},{sex,[♂,♀]}], cells:[…4…] }` → renders as a 2×2 grid, not a garbled line.
6. **Row 2:00 @ Zone 2** (S2): Row `reps.unit_bound{min,2}` (exists) + `intensity.hrZone=Z2` ON THE ROW.
7. **"score = rounds+reps, last 3 min @90%"** (S2-C, #11): still schema notes — DEFER, no inert field.
8. **":20 between the two ladders"** (S3, #20): "2 min between rounds" = `schema.rest{between_rounds}` (expressible); the ":20 between ladders" remnant stays a note — DEFER (group transition).

## 4. Sacred / out-of-scope / deferred (do NOT cross)

- **6 repetition kinds stay a set** (D-V2-CAP-AXIS preserves the algebra — cap is orthogonal, NOT a 7th kind).
- **Channels rule D-5** governs every field (all five new surfaces are channel Т — machine-rendered; #17 flagged: typed but render/author-serving until the Phase-3 resolver).
- **Structure-not-graph (D-2/D-4):** untouched. #20's "between ladders" is NOT a sibling→sibling ref — that's why it defers.
- **No inert field** for #11/#20 (the ADR-0039 `window` discipline).
- **DEFERRED:** #11 (score), #20 (inter-schema transition) → Phase-4 executor; BASKET-C-2 (build-to-1RM) → Phase 3. All in `deferred.md`.

## 5. Spec re-freeze checklist (in the same wave)

`primitive-spec.md` updates (re-frozen at wave close):

- Grid B `intensity`: scope trinity restored (block/schema/row + render overlay) — the line that already says this is now TRUE.
- Grid B add `rest` as a row carrier (alongside the schema rest axis).
- Grid C `Block intensity`: returns (D-FLOORS reversal noted, superseded by D-V2-INTENSITY-TRINITY).
- Grid C `composition`: gains the `cap` cross-cutting axis.
- Grid C / repetition `interval`: work/off carry a unit.
- Grid B `load.byProfile`: flat → axes/cells.
- §6 kill-list: "intensity is schema-only" + "row-level intensity override removed" reversed; "ONE rest per schema" scoped (row rest added).
- §8: fold in the re-expressions above.
- §9: cross-check the new shapes against the live contracts post-build.
