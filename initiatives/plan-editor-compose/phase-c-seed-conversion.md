# S3 Phase C — seed composition-native conversion spec

Durable execution spec for **Phase C** of the 10.4 archetype sweep, promoted from the in-session discovery + conversion analysis (2026-06-04). Phases **A + B are DONE** (UI half: render-flip + authoring delete; branch `feat/compose-s3`, commits `0fe3e6c3` + `25c7080f`; platform 982 green). Phase C is the **seed re-authoring** — the single largest, most domain-sensitive task in S3 (discover proved the "mechanical sweep" framing WRONG here). **Vehicle: `/feature` full** (NOT Workflow — it is domain authoring with the arrangement back-patch crux; `/feature` review/qa de-risk it). Feed this doc as the design input.

## What Phase C must produce

A **composition-native seed**: every `CanonicalSchemaNode` carries a required `composition` (compose axes) + rows; NO `archetype`/`kind`/`alternatingGroupRef`. `db:reset` (Phase E) materializes it; the gated seed suite validates it.

## The conversion mapping (archetype → composition) — grounded in `algebra-spec.md` §2.5 + §3, verified against the 34 helper internals

The 34 helpers (`builder/archetypes/{rounds-sets,composite-nested,named-single-special}.ts`) are thin `buildArchetypeNode` wrappers — **rows come from the call-site `base.rows`** (unchanged), the helper only encodes archetype+params+kind. So conversion = replace the archetype encoding with a `composition`; rows are preserved verbatim. Collapse the 34 → a handful of axis helpers (`rounds`/`ladder`/`emom`/`interval`/`amrap`/`window`/`parallel`/`superset`/`flat`/`nested`).

**Clean axis-swaps (~44 nodes):**

| helper                                                                                                             | params                                        | → composition                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nRounds`                                                                                                          | countForm, count/countRange, repsPerSet, rest | `repetition: count(exactOrRange)` + `rest` if present. **`repsPerSet` DROPPED** — reps live on rows (confirmed vs migrated week-1-monday node).                       |
| `ladderDescending`/`ladderAscending`/`ladderVertexDownPyramid`/`ladderSpike`                                       | steps                                         | `repetition: ladder(steps)` (form = fn of the array; one primitive).                                                                                                  |
| `amrapFlat`                                                                                                        | durationMin                                   | `repetition: timeCap(cap:{min:durationMin,unit:"min"})` + `scoring: amrap`.                                                                                           |
| `emomNestedPerMinute`                                                                                              | durationMin, rounds?                          | `repetition: cadence(everyMin:1, rounds: rounds ?? durationMin)`. Children may be `window(1min)` slots (Gauntlet B).                                                  |
| `timeWindowOuter`                                                                                                  | window{start,end}                             | `repetition: window(startHhMm, endHhMm)`.                                                                                                                             |
| `compositeRoundsWithRest`                                                                                          | count, rest                                   | `repetition: count` + `rest`.                                                                                                                                         |
| `compositeIntervalsWorkRestFixed`                                                                                  | intervalsCount, workMin, restMin              | `repetition: interval(workMin, offMin:restMin, count:intervalsCount)` + `scoring: prescribed`.                                                                        |
| `compositeIntervalsWorkRestProgressive`                                                                            | sets, workMin, offMin, progressiveSeed        | `repetition: interval(workMin, offMin, count:sets)` + `scoring: progressive(seed:progressiveSeed)`.                                                                   |
| `compositeRollingRounds`                                                                                           | everyNthMin, rounds, totalMin                 | `repetition: cadence(everyMin:everyNthMin, rounds, totalMin)`.                                                                                                        |
| `namedThemedSets`                                                                                                  | count, theme                                  | `repetition: count`; `header = theme`.                                                                                                                                |
| `singleLineTotalCounter`                                                                                           | totalFlag                                     | `scoring: total` (otherwise flat).                                                                                                                                    |
| `singleLineBare`/`singleLineWithThenConnector`/`flatListHeaderless`/`placeholderBody`/`practiceList`/`urlOnlyBody` | —                                             | **flat** = `composition: {}` (deriveCompositionLabel → "flat"). `then`-connector → `arrangement: ordered` on the PARENT; **`trailingConnector` DROPPED** (see below). |

**Structural conversions (~20 nodes — need restructuring, do these carefully):**

- `namedExerciseProgram`×8 (heaviest structural) → the `program` (StagedProgram VO) + exercise **move onto a Row** (`program` is a sacred Row-VO, algebra §2.5 `Row{program: staged(...)}`); the node becomes flat. Inspect each call-site: if it already has an exercise row, attach `program` there; else author one.
- `emomSubMinuteSlot`×6 → `repetition: cadence` on the node; the `slot` (SlotSpec) moves to **row-level `slotSpec`** (D-EMOM-SLOT — row-payload concern, reuse `_shared/cap-spec slotSpecSchema`).
- `parallelLaddersDescending`/`parallelLaddersMixedDirection`/`parallelPyramids` (3 ref-carriers) → `arrangement: parallel{interleaveOrder:"round_by_round", tracks[]}`; **each ladder/pyramid becomes a CHILD container** `{repetition: ladder(steps)}` (a subSchema); `track.childSchemaId` → child ref; `ladder.pairedWithInnerRowId` → `track.pairedWithRowId`. tracks `.min(2)`.
- `alternatingSets` (alt-group fold, week-2-tuesday-archetypes:38-65, 2 nodes/1 ref) → the alt-group members become **tracks of a parent `arrangement: parallel`**; `setEnumeration` → `track.setEnumeration`. (D-ALTGROUP-FOLD; the old `alternatingGroupRef`/`alternatingGroupRelation` carriers are gone.)
- `superSet`×2 (phase-7-blocks:215,254) → `arrangement: superset{pairs[]{label, rowIds[]}}` + `repetition: count(rounds)` + `rest(restBetweenPairs)`. `schemaRows` refId → `rowIds` cuid (back-patch). **superset rows are DIRECT children** (QA-201); **`rowIds.min(2)`** — FIX the degenerate single-row pair `BLOCK_SUPER_SET_PAIR_B` (a 1-exercise "superset" is meaningless — author ≥2 or drop it).
- `nestedRoundsOverRounds`×4 / `nestedRoundsOverParallelLadder` / `nestedCompositeRoundsOverLadder` → `repetition: count(outerCount)` (+ `rest` for the composite) + **subSchemas** (children self-declare their own composition, algebra §2.5 `[child декларирует себя сам]`).
- `compositeIntervalsThenRounds` → nested: `repetition: interval(...,count:intervalsCount)` (preamble) + a rounds subSchema (innerRounds). Resolve the exact shape from the call-site.
- `compositeIntervalsOnOffMaxTail` → `repetition: interval(workMin:onMin, offMin, count:intervals)` + `scoring: max_in_remaining`; `tailExerciseId` → a tail row.
- `pullUpsDipsCycle` / `runDistance` (distance→exercise row) → inspect the call-site; likely flat with the cycle/distance expressed on rows.

**Per-node open questions** (resolve from the actual call-site + algebra §3, do NOT guess): the flat-default for run/cycle nodes, the exact nested/composite child structure, whether a flat node warrants `repetition: once` vs `{}`. The 5 ALREADY-migrated nodes are the template: `week-1-monday:66,104` (count, ladder), `week-1-tuesday:63`, `week-1-wednesday:138,199` — drop their archetype spread, keep the existing `composition`.

## `trailingConnector` — DROPPED (resolved adjudication)

Per `plan.md` §Open-design ("folds into `arrangement: ordered` / presentation; no carry", RATIFIED 10.2) **and the user's own phase-5 Prisma-drop list**, `trailingConnector` is dropped in S3. One discover agent (seed-builder) dissented ("not archetype-coupled → leave it") — OVERRIDDEN (the plan + user instruction win; it is the connector-form presentation layer the pivot subsumes, D-PHASE5). Phase C: `emitSchemaNode` stops calling `extractTrailingConnector`; drop the coverage cells `connectorForm.*`, `entity.schemaTrailingConnector`. (The Prisma column + contract field drop in D/E.)

## The back-patch re-key (THE CRUX)

`schema-emit-back-patch.ts` currently switches on the archetype discriminator to resolve `parallel-ladders`/`super-set` row refs. Re-key to `composition.arrangement`:

- Contract arrangement refs are `.cuid()` (`tracks[].childSchemaId`, `tracks[].pairedWithRowId`, `superset.pairs[].rowIds`), but the seed authors **refId strings**.
- **Two-phase / ordering trap:** `arrangement.parallel.tracks[].childSchemaId` points at a CHILD subSchema, which `emitSchemaNode` creates AFTER the parent (the `for (const sub of node.subSchemas)` loop). So the parent's `composition.arrangement` must be **back-patched after children exist** (resolve childSchemaId refId → child cuid). Mirror S2-R2's two-phase persist (D-10.4-S2-R2): author the arrangement with refIds in a side structure, emit the parent composition WITHOUT the unresolved arrangement, then patch it in after children/rows are created. `collectReferencedRowRefs` re-keys from `archetype.params.*` to `composition.arrangement.*`.
- `ref-resolver.ts`: keep the row-ref map (`setRow`/`getRow`); drop the alt-group ref map (`setAltGroup`/`getAltGroup` + `AltGroupRefMap` in block-emit) — the alt-group entity is gone.

## emit + pipeline changes

`schema-emit.ts` `emitSchemaNode` (65-106): drop `requireArchetypeId`/`archetypeId`/`kind`/`archetypeParams`/`alternatingGroupId`/`trailingConnector` writes; write `composition` (now always present). `seedCanonicalSchemas` drop the `archetypeIdByName` param. `plan-emit/index.ts` drop `buildArchetypeIdByName` (reads `db.archetype.findMany` — table going away). `load-and-validate.ts` drop `assertArchetypeSpellings`/`VALID_ARCHETYPE_NAMES`/`collectArchetypeNamesFromSeed`. **DELETE** `archetype-catalog/` (4 data files + index: `ALL_ARCHETYPES`/`seedArchetypes`); `seed.ts` drop the `seedArchetypes(prisma)` call (line 6 import + 30 call); `clear-all.ts` drop `db.archetype.deleteMany()` (line 22). `canonical-schema.ts`: `CanonicalSchemaNode` — drop `archetype`/`kind`/`alternatingGroupRef`/`alternatingGroupRelation`, make `composition` REQUIRED (type 216-229 + zod 231-246); drop the `archetypeParamsSchema`/`alternatingGroupRelationSchema` imports. `base.ts`: `buildArchetypeNode` → `buildComposeNode(base, composition, defaultHeader)`.

**Atomic note:** the `CanonicalSchemaNode` type change (composition required, archetype gone) forces ALL 64 call-sites + emit + back-patch + the 34 helpers into ONE green state. Either land Phase C as one atomic change, OR stage it (make `archetype` optional first → convert the 18 plan files file-by-file → drop archetype last) to keep `check-types` green per commit and enable file-disjoint fan-out of the 18 plan files. Staging is recommended for the `/feature` implement stage.

## Coverage gate rewrite (`plan-emit/coverage-cells/` + `src/__tests__/`)

Discover found this **~2× larger than recon listed**. Drop the archetype-era cells + tests, add per-axis cells:

- `structural.ts`: drop local `ARCHETYPE_NAMES` (6-41, a SEPARATE 34-name list from the contract one) + `archetypeCell` + spread (118); drop `SCHEMA_KINDS` + `schemaKindCell` + spread (1,73-88,121). Add per-axis cells: `repetition.kind` ×8 (once/count/range/ladder/timeCap/cadence/window/interval), `arrangement.kind` ×3 (ordered/parallel/superset), `scoring.kind` ×6, rest-present. The seed must GROW bundles to cover variants the current 5 trees don't, OR scope the gate to implemented variants (lean: honest coverage of what's seeded, per [[no-list-caps-honest-counts]]).
- `connector-position.ts`: `programKindCell` (stagedProgram) + `slotKindCell` (slotSpec) RE-POINT — they tally `archetypeParams.params.*`; re-point to the Row-VO `program` (stagedProgram on rows) + the cadence-child `slotSpec`. `connectorFormCell` (trailingConnector) → DROP.
- `misc.ts`: `entity.alternatingGroup` (117-124) → re-point to `arrangement:parallel` presence; `entity.schemaTrailingConnector` (141-148) → DROP.
- `composition.ts`: `composition.present` cell `required:5` (QA-006, brittle) → subsumed by per-axis cells; the test reads it by id at `seed-coverage.test.ts:208` so update there too.
- `types.ts`: `CoverageCategory` union — drop `'archetype'`/`'schemaKind'`; the re-pointed `'stagedProgram.kind'`/`'slotSpec.kind'`/`'composition'` stay.
- **`seed-coverage.test.ts` asserts `report.total === COVERAGE_CELLS.length` (×2, :212/:299) + a `requiredCellIds` whitelist (:302-316)** — any cell add/drop shifts the count; update atomically or these red-bar.

## Seed tests to strip (both in the GATED ~10-min DB suite)

- `_seed-coverage-helpers.ts`: drop `expectArchetypeNamesAllReferenced` (102-126), `expectArchetypeRefsResolveToRows`+`extractSuperSetRowRefs`+`extractParallelPyramidRefs`+`ArchetypeRefExtractor` (27-83). Keep the archetype-free helpers (`collectExerciseRefs` etc.).
- `seed-coverage.test.ts`: drop the `ARCHETYPE_NAMES` import (:4) + §3 34-rows (224-226) + back-patch QA-10 super-set/parallel-pyramids (155-171) + §3/§2 alt-group (136-153) + §15 trailingConnector ×2 (173-192, 375-388) + §25 connector-leak (215-222); rewrite the composition.present cell assertion (194-213) per the per-axis redesign.
- `seed-invariants.test.ts`: drop the `ARCHETYPE_NAMES` import (:4) + T6 (174-185) + T1 alternatingGroupId-FK (29-55) + T4 AltGroup-≥2 (114-133) + T5 super-set-pairs (135-172).
- **Boundary (for Phase D):** `compose-projection.mapper.test.ts` (20,33,36,38,40,200) shares the exact archetype-column fixture shape — its rewrite stays in lockstep with the Prisma cut (Phase E).

## Seed file map (64 nodes across 18 plan-synthetic files)

`plan-data/plan-synthetic/` — distribution: `nRounds`×16, `compositeRoundsWithRest`×11, `namedExerciseProgram`×8, `runDistance`×7, `emomSubMinuteSlot`×6, `nestedRoundsOverRounds`×4, `emomNestedPerMinute`×4. Ref-carriers (5): `parallelLaddersDescending` (week-1-saturday:32), `parallelLaddersMixedDirection` (week-2-tuesday-archetypes:115), `parallelPyramids` (week-2-tuesday-archetypes:224), `superSet`×2 (phase-7-blocks:215,254). Alt-group (week-2-tuesday-archetypes:38-65). The `-archetypes`-suffixed file (`week-2-tuesday-archetypes.ts`) should be renamed to compose vocabulary (its importer `week-2-tuesday.ts` follows).

## After Phase C: D + E

- **Phase D** (`/feature small` OR direct/Workflow — mechanical): contract + api-server archetype removal as ONE squash (mutually type-dependent); D-10.4-2 strip `kind` from ownership guards + abolish `assertParentKindForRow`/`assertSubSchemaInvariants`; REVIEW-004 (`marshalNullableJson` dedup). See `10-4-recon.md` §removal-surface + `decisions.md` D-10.4-2.
- **Phase E** (direct, gated): Prisma drops (`Schema.{archetypeId,archetypeParams,kind,alternatingGroupId,trailingConnector}` + models `Archetype`/`AlternatingGroup` + enums + `Block.alternatingGroups`; drop the Schema→Archetype relation BEFORE/WITH model Archetype — `onDelete:Restrict`) + `db:reset` + `db:generate` + the **gated full api-server suite** (user pre-authorized 2026-06-04; ~10 min serial live Neon — runs the author-only qa-004 cases from #244 too). Prisma site map is in `10-4-recon.md` §removal-surface + the discover prisma findings (zero line-drift vs recon, interleaving foot-gun = per-line edits not range-delete).
