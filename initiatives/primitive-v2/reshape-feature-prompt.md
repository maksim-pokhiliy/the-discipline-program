# primitive-v2 — executor `/feature` prompt (the one-wave leaf reshape)

Run this via `/feature` (full). You are the EXECUTOR with a clean context — everything load-bearing is in the repo docs below; do not work from this prompt alone.

You are extending the FROZEN session primitive to close the basket-B expressiveness gaps the coach-station timed-test found. This is ONE wave: contracts → Prisma → mappers → api-server guards → platform editor (read + write) → spec re-freeze. `db:reset` world — no migration files, aggressive bridge-free (intermediate RED trees are fine; only the final pushed tree must be green).

## Read FIRST (the design is locked — implement to it, do not re-derive)

1. `initiatives/primitive-v2/reshape-design.md` — **the design contract.** §2 has the exact from→to shape for every change + the full consumer touch-points (verified verbatim at design time). §3 the re-expressions, §4 the sacred boundaries, §5 the spec re-freeze.
2. `initiatives/primitive-v2/decisions.md` — the ratified D-V2-\* calls + their rationale (why each re-open is legitimate).
3. `initiatives/session-primitive/primitive-spec.md` — the FROZEN baseline you extend (re-frozen at wave close).
4. `initiatives/session-primitive/e2e-evil-corpus.md` — the workouts that must build (your live acceptance fixtures).
5. `docs/planner-discipline.md` — the read/verify-then-spec checklists; honor (f) consumer-pattern, (h) mutation-invariant, (i) lint/type-impact before each layer.

## Scope — five changes (exact shapes in `reshape-design.md` §2; do not invent shapes)

1. **Intensity on row + block.** Reuse `intensitySchema` unchanged; add `SchemaRow.intensity` + `Block.intensity` (Json columns) + contract fields. Render-time overlay (block→schema→row, dimension-wise, precedence row > schema > block) via ONE `resolveIntensity` helper — no storage promotion. (D-V2-INTENSITY-TRINITY)
2. **Rest on row.** Reuse `restSpecSchema` unchanged; add `SchemaRow.rest` (Json). Additive to the schema rest (different scope). (D-V2-ROW-REST)
3. **Cross-cutting cap.** `compositionSchema` gains `cap: timeCapSchema.optional()` — rides inside `Schema.composition` Json (NO Prisma column, `mapToSchema` parses it for free). The 6 repetition kinds are UNTOUCHED. UI hides the cap toggle when `kind==="timeCap"`; NO reject superRefine. (D-V2-CAP-AXIS)
4. **Sub-minute interval.** The `interval` variant's `workMin`/`offMin` → `work`/`off` `{value, unit: sec|min}`; rides inside `composition` Json. (D-V2-INTERVAL-UNIT)
5. **Nested byProfile.** `load.byProfile` flat `entries` → `{axes:{name,values[]}[] (1–2), cells:{coords[],kg}[]}` with a cartesian-cover superRefine; rides inside `SchemaRow.load` Json. (D-V2-PROFILE-NESTING)

## Layer touch-map (every site is in `reshape-design.md` §2 — this is the checklist)

| Layer             | Touch                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma            | `SchemaRow.intensity Json?`, `SchemaRow.rest Json?`, `Block.intensity Json?` — 3 new columns. `db:reset` to apply (no migration files). `db:generate` for client types.                                                                                                                                                                                                                                                                         |
| Contracts         | `schema-row.schema.ts` (+intensity, +rest on schema/create/update), `block.schema.ts` (+intensity), `composition.schema.ts` (+`cap`; interval work/off shape; check `composeRowSchema` carries +intensity/+rest if the draft path writes rows), `load.ts` (byProfile axes/cells). Add `INTERVAL_DURATION_UNITS`. Exports: verify each new const/schema is barrel-exported (`_shared/index.ts`, `composition/index.ts`).                         |
| Mappers           | `mapToSchemaRow` (+intensity, +rest parse), `mapToBlock` (+intensity parse). `mapToSchema` needs NO change (composition.parse picks up cap/interval); load byProfile parse needs no change (loadSchema.parse picks up the new shape).                                                                                                                                                                                                           |
| Handlers          | schema-row create/update + block create/update marshal the new fields via `marshalNullableJson` (mirror the existing `notes` line). Block update today handles only `notes` — add `intensity`. Schema create/update already marshals `composition` (cap/interval ride along).                                                                                                                                                                   |
| Client (platform) | `RowFormState` + `buildRowRequest` (+intensity, +rest); `SchemaDraft` + `buildComposition`/`composeContainerToComposition` (+cap, interval shape); block update request (+intensity).                                                                                                                                                                                                                                                           |
| Editor write      | row-editor-modal: add `IntensityFields` + `RestSpecFields` sections (REUSE the components; mirror `container-inspector` add/remove). Block: NEW intensity edit surface (block-card-head has only labels today). Schema axis editor: add a cap section (REUSE `TimeCapFields`). `interval-axis-field`: add a unit toggle + `{value,unit}`. `load-by-profile-fields`: rewrite to axes+cells grid; update `load-editor` `KIND_DEFAULTS.byProfile`. |
| Editor render     | `row-summary-chips` (+intensity chips via `formatIntensityChips`, +rest chip via `formatRestSpec`); `block-card-head` (+intensity chips, NEW); `schema-card-meta` (+cap chip; intensity via the overlay resolver); `format-composition-summary` (cap part; interval sub-minute format); `format-load` (byProfile grid).                                                                                                                         |
| api-server tests  | extend `schema-row/admin.test.ts`, `block/admin.test.ts`, `schema/admin.test.ts`, `schema.mapper.test.ts` with the new fields/shapes. (Do NOT run the full api-server suite — it's the owner's gated manual acceptance; write the tests, leave the run to the owner.)                                                                                                                                                                           |
| Spec              | re-freeze `primitive-spec.md` per `reshape-design.md` §5, in this same wave.                                                                                                                                                                                                                                                                                                                                                                    |

## Tricky bits (get these right)

- **Intensity overlay** is the subtle one. Store independently per level; compute effective at render via `resolveIntensity(block, schema, row)` — dimension-wise, nearest-level-wins per the 5 dimensions. Thread it once (the one-predicate rule, like `isStructurallyParallel`). Render must distinguish own vs inherited (e.g. inherited dimmer). Partial (dimension-wise), not full-replace.
- **Cap vs timeCap-kind:** orthogonal. `repetition.timeCap` = time-as-scheme (AMRAP); `composition.cap` = ceiling over any kind. Hide the cap toggle in the UI when kind is timeCap; don't validate it away.
- **byProfile superRefine:** `cells` must cover the cartesian product of `axes` (length === product of axis-value counts), `coords` length === axes length, each cell's coords valid against the axes + unique. Use `superRefine` (cross-field invariant), per planner-discipline (i) Zod sub-axis.
- **db:reset, bridge-free:** old flat byProfile + old `workMin/offMin` just go. No data migration, no compat shim (no prod data; plans are hand-built). [[aggressive-migration-no-bridge]] / [[discipline-db-non-prod]].

## Boundaries — SACRED, do not cross (owner ratification required)

- The **6 repetition kinds stay a set** — cap is orthogonal, NOT a 7th kind.
- **Channels rule D-5** — every new field is channel-Т (machine-rendered now). Do NOT add anything for #11/#20.
- **No inert field** for score / inter-schema transition (the ADR-0039 `window` discipline). #11 + #20 are OUT (D-V2-EXEC-DEFER-HOLD).
- **Structure-not-graph (D-2/D-4)** — no sibling→sibling refs; no typed relation kinds.
- **No code comments** (house rule); reuse existing components (`IntensityFields`/`RestSpecFields`/`TimeCapFields`) — don't reinvent. Editor UX (the NEW block-intensity surface + the byProfile grid) goes through the `ui-ux-pro-max` plugin; honor [[mui-floating-labels-everywhere]], [[no-hex-outside-theme]], [[one-component-per-file]], [[no-json-editor-in-ui]] (the byProfile grid is a typed form, not a JSON editor).

## Commit + acceptance

- **Commit strategy:** the cross-package change has intermediate broken trees → ONE squashed commit with a per-layer body (read `.husky/{pre-commit,pre-push}` + `turbo.json` first; [[husky-cross-package-squash]]). NEVER bypass hooks (no `--no-verify`). pre-push runs the cone (dep:check + lint + check-types + contracts/platform vitest) — all must pass.
- **Gates (must be green before the PR):** `check-types`, `lint`, `dep:check` 0, `@repo/contracts` vitest, platform vitest.
- **api-server suite = the owner's gated manual acceptance** (~10 min serial, live Neon) — do NOT run it; write/extend the tests and hand the run to the owner. ([[api-server-serial-tests]])
- **Owner acceptance:** browser-walkthrough — re-build the evil-corpus cases in `reshape-design.md` §3 (Fran-capped, Tabata, row RPE+rest, block @85%, Wall Ball grid) live in the editor; they round-trip.
- **Close-out:** land the initiative close-out docs (spec re-freeze + board/journal updates) IN this feature PR, not as a later commit ([[closeout-before-pr]]).

The orchestrator reviews via `git diff`, never your self-report (D-7).
