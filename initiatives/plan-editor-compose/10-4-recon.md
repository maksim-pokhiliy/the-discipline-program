# 10.4 — blast-radius recon + sequenced plan (promoted from a recon pass, 2026-06-03)

Durable promotion of the 10.4 RECON+PLANNING pass. Source: 5 parallel read-only agents over the 3 apps + packages + the seed + the write-guard surface, plus direct verification of the load-bearing claims. **No code was written** — this is the map the execution sessions resume from. Open forks live in `decisions.md` (D-10.4-1/2/3); WARNINGs in `deferred.md`.

## The removal set (what 10.4 deletes)

`Archetype` model + `lms/archetype` contract/endpoint/mapper · `Schema.archetypeId` (FK, `onDelete:Restrict`) + `archetypeParams` (Json) + `Schema.kind` (enum) · `archetypeParamsSchema` (34-variant union) · `ArchetypeFamily`/`ARCHETYPE_NAMES` · `AlternatingGroup` + `alternatingGroupId` + the alternating-group entity/endpoint/guards · `trailingConnector` · the platform picker + ~18 `*-schema-form.tsx` + `formatSchemaHeader`/`formatArchetypeParams`. Replacement = `composition` + `deriveCompositionLabel` (shipped 10.3) + the productionized compose-write UI (S2).

## Three non-mechanical mines (verified — these break the "mechanical sweep" framing)

### MINE 1 — `Schema.kind` is NOT a pure-archetype field

- `verifySchemaOwnership` (`api-server/src/authz/lms-guards.ts:169,176,216,231`) and `verifySchemaRowOwnership` (`:244,258,296`) select + return `kind`/`schemaKind`.
- `assertParentKindForRow(owner.kind)` (`schema-row/admin.ts:43` + `schema-row/assertions.ts`) — "no rows on NESTED".
- `assertSubSchemaInvariants(parent.kind, data.kind)` (`schema/assertions.ts:37-52`) — "sub-schema only under NESTED, only ATOMIC/HEADERLESS".
- Resolution: D-CONTAINER-VS-ROW + algebra §2.4 abolish these. Drop `kind`, drop both assertions, strip `kind`/`schemaKind` from the ownership-guard results. **Behavior change — D-10.4-2 (OPEN).**

### MINE 2 — the production compose-write UI does not exist (prototype ≠ product)

- The 10.1 prototype (`apps/platform/src/modules/plan-detail/compose/`, route `app/coach/compose-prototype/page.tsx`) is walkthrough-VALIDATED UX (all 7 axes inspector + canvas + DnD + leaf editors + duplication) — but verified gaps: **zero persistence** (`useState(MOCK_SEED)`, no `useCreateSchema`/`useMutation`/`@repo/query`), **local types ≠ frozen contract** (`compose-tree.types.ts` `ComposeContainer`, diverges on scoring `condition` + `range`-folded-into-`count`), **no draft→`Composition` converter**, mocks not `useCatalog`.
- Resolution: S2 productionizes (converter + persistence + type-align + mounts). NOT greenfield — UX-design risk retired. **D-10.4-1 (OPEN).**

### MINE 3 — folds without a 1:1 home

- **AlternatingGroup** ripples: `block.schema.ts:4,19` embeds `alternatingGroupSchema` in `blockSchema`; `block.mapper.ts:78` maps it; platform `group-schemas-by-alt-group.ts:18` + `block-card-body.tsx` read `alternatingGroupId`. All die/rewire to `arrangement:parallel` render. (Agent D's "survives" was wrong — verified it breaks.)
- **Coverage cells** `stagedProgram.{drop_set,wave,cluster}` + `slotSpec.{single,grouped}` (`coverage-cells/connector-position.ts:55-81`) tally `archetypeParams.params.*` — no composition axis equivalent. The data has a compose home (`program` is a sacred Row-VO; slots = cadence-container `window` children) → re-point the cells, don't delete the coverage.

## Removal surface by package (file:line)

**Prisma** (`api-server/prisma/schema.prisma`): `model Schema` 687-717 — drop `archetypeId`(694)+`@relation archetype`(707, `onDelete:Restrict`)+`@@index([archetypeId])`(714), `archetypeParams`(696), `kind`(693), `alternatingGroupId`(691)+`@relation`(708)+`@@index`(715), `trailingConnector`(699); `composition`(697) STAYS. Drop `model AlternatingGroup` 719-731 + `model Archetype` 802-818 + enums `SchemaKind` 535-541 / `ArchetypeFamily` 555-565 / `AlternatingGroupRelation` 587-589. **The one back-ref on a surviving model to cut: `Block.alternatingGroups` (665).** No training-history cascade (Performed\* hang off Session/SchemaRow). `onDelete:Restrict` ⇒ drop the Schema relation before/with the Archetype model or `prisma validate` fails on a dangling relation.

**Contracts** (`packages/contracts/src/entities/lms/`): delete `archetype/` dir (8 files) + barrel line `lms/index.ts:3`; delete `schema/archetype-params.schema.ts` + barrel `schema/index.ts:1`; cut `schema/schema.schema.ts` `SchemaShape`/`schemaSchema`/`createSchemaSchema` fields (`archetypeId`/`archetypeParams`/`kind`/`trailingConnector`/`alternatingGroupId`) + `archetypeFamilySchema`/`archetypeNameSchema`/`trailingConnectorSchema` + the `schemaSchemaWithInvariants` superRefine (references `kind`+`alternatingGroupId`); `schema.constants.ts` lose `ARCHETYPE_FAMILIES`/`ARCHETYPE_NAMES` (+ `SCHEMA_KINDS` if D-10.4-2 drops kind); delete `alternating-group/` dir + `lms/index.ts:2` + `block.schema.ts:4,19`; delete 3 `__tests__/lms-vo-parity-params*.test.ts`. **`package.json` `exports` map** has `./lms/archetype` + `./lms/alternating-group` (confirm before editing). The FROZEN `lms/composition` module is archetype-free (grep-proven) — do NOT touch it. `schemaSchema` is NOT `.strict()` → no satisfies/exhaustive breakage; legacy fixtures strip silently.

**api-server src**: `mappers/lms/schema.mapper.ts` drop `archetypeParams`/`kind`/`trailingConnector` reads (composition+label stay); delete `endpoints/lms/archetype/` + `mappers/lms/archetype.mapper.ts` + the platform route `apps/platform/.../api/platform/archetypes/route.ts`; delete `endpoints/lms/alternating-group/` + `mappers/lms/alternating-group.mapper.ts` + `authz/alternating-group-guards.ts` + barrel lines; `schema/admin.ts` drop `assertArchetypeConsistency` (`schema/assertions.ts`) + the archetypeParams write/update lines (116-121, 139, 141, 182-201, 207-208); `schema-row/admin.ts` is NOT archetype-coupled (only the QA-001 guard lands there). `__tests__/_seed-coverage-helpers.ts:60,68` selects `archetypeParams`/`archetype` — dies with the seed redesign.

**platform** (`apps/platform/src/modules/plan-detail/`): ~18 `*-schema-form.tsx` + `schema-param-form-registry.tsx` + `schema-param-form-dispatch.tsx` + `archetype-picker.tsx`/`-tile.tsx` + `add-schema-button.tsx` (mount) + `schema-editor-modal.tsx` + `n-rounds-form-schema.ts`; `formatSchemaHeader`(`lib/format-schema-header.ts`)/`formatArchetypeParams`(`lib/format-archetype-params.ts`) + call sites `schema-card-head.tsx:95`, `schema-card.tsx:179`, `schema-card-meta.tsx:30`; `lib/hooks/use-archetypes.ts` + `catalog-provider` `archetypeById`; `group-schemas-by-alt-group.ts` + `block-card-body.tsx` (alt-group render). Render rewires to `label` + the prototype's `axes-summary.ts` (re-pointed at the contract `Composition`). admin/marketing: ZERO consumers (clean).

## SEED redesign (the biggest non-mechanical piece — 10.4 S3)

Current: **64 archetype-carrying nodes** via 34 thin helpers → `buildArchetypeNode` (`prisma/seed/plan-data/builder/archetypes/base.ts`) → one Schema row with `archetypeId`+`archetypeParams`+`kind`. `CanonicalSchemaNode` (`canonical-schema.ts:216-246`) has **required** `archetype` (composition-only node not constructible today — atomic change across type+zod+`schemaNode()` validator+34 helpers ⇒ ONE squash). `emitSchemaNode` (`schema-emit.ts:65-106`) writes archetype; `requireArchetypeId`/`buildArchetypeIdByName`/`assertArchetypeSpellings` die. 4 `archetype-catalog/*.ts` + `seedArchetypes` (`seed.ts:30`) die. Back-patch (`schema-emit-back-patch.ts`, `collectReferencedRowRefs`) switches on the archetype discriminator → re-key to `composition.arrangement.kind` (`parallel.tracks[].pairedWithRowId`, `superset.pairs[].rowIds`); these refs are `.cuid()` in the contract but the seed authors `refId` strings → need emit-time ref→cuid resolution (mirror the existing back-patch).

Becomes: `buildComposeNode(base, composition, header)` (drop `archetype` param, `composition` required); 34 helpers → a handful of axis-keyed helpers (`rounds`/`ladder`/`emom`/`interval`/`amrap`/`parallel`/`superset`). Coverage gate: drop `expectArchetypeNamesAllReferenced` + the 34 `archetype.*` cells (`coverage-cells/structural.ts:6-122`) + the `ARCHETYPE_NAMES` imports in `seed-coverage.test.ts:4`/`seed-invariants.test.ts:4` (T6 `:174-185`); replace with per-axis cells (`repetition.kind` ×8, `arrangement.kind` ×3, `scoring.kind` ×6, rest-present) — the seed must GROW bundles to cover variants the current 5 don't (window/range/once/for_time/total/progressive/superset/parallel-with-tracks) OR scope the gate to implemented variants. Re-point `stagedProgram.*`/`slotSpec.*` cells to the Row-VO / cadence-child homes. Both seed test files are in the GATED ~10-min DB suite + import `ARCHETYPE_NAMES` → the contract removal and this seed redesign are coupled (same atomic step).

## WRITE-GUARD design (QA-001 — 10.4 S1)

- `assertComposeTreeValid` (`mappers/lms/compose-projection.mapper.ts`) throws `InternalServerError` 500 — WRONG for write. Add a sibling `assertComposeTreeValidForWrite` reusing the pure `projectSchemaWithBody` + `composeContainerSchema.safeParse` + `throw BadRequestError` (400). The 400-vs-500 split is clean: `handlePrismaError` re-throws `AppError` first (`prisma-error-handler.ts:16-18`), so a `BadRequestError` survives the `catch` untouched.
- Hooks: **schema-row create** — clean tx-callback (`retryOnP2034 + $transaction(Serializable)`); insert the guard INSIDE the tx AFTER `tx.schemaRow.create`, re-fetch parent + children (extend the `:62-75` fetch to a body-include), project the post-write tree, validate, throw → tx rollback. **schema-row update** + **schema update-of-composition** are bare `prisma.update` (no tx) → pre-write construct-and-validate (collision is deterministic from `repetition.kind` + child rowKinds; no tx-promotion needed).
- Test flip: `week/admin.test.ts:766-789` (read-500 → marker create now 400, week read succeeds). The `:791-812` QA-002 sibling test becomes un-provisionable via API → re-point to raw-corruption or delete. The unit `compose-projection.mapper.test.ts:214-231` (500 read) STAYS (read-path 500 still correct); the 400-sibling gets its own unit.
- Both endpoint test files are GATED DB suite (no env-skip; live Neon).

## Sequenced plan (keeps the 18-workspace husky cone green per commit)

Green-keeping is reverse-dependency: pre-rewire consumers while the symbol still exists (each commit green), then drop the now-unconsumed symbol. The tightly-coupled core (Prisma column + its sole mapper producer + the contract type + that type's remaining consumers) is mutually type-dependent → ONE squashed atomic commit per `[[husky-cross-package-squash]]`.

- **S1** (api-server, additive + test flip): QA-001 write-guard (400-sibling + 3 hooks) + QA-003 fold (week read `handlePrismaError`) + nullable-archetype expand (`archetypeId`/`archetypeParams`/`kind` → nullable, `createSchemaSchema` → optional, `assertArchetypeConsistency` conditional) so composition-only writes become possible. Vehicle: `/feature small`. 1 gated DB run.
- **S2** (platform, UI-first, coach re-walkthrough gate): productionize the prototype — draft→`Composition` converter, persistence (`useCreateSchema`/`useUpdateSchema`), type-alignment (adapter or re-point to contract — resolve scoring `condition`/`range`), mocks→`useCatalog`, validation surfacing + QA-001 client feedback, mount in the real editor. Runs ALONGSIDE the old forms (both write Schema; new path composition-only via the S1 nullable expand). Vehicle: `/feature` full. (Scope per D-10.4-3.)
- **S3** (ultracode workflow + gated `db:reset`): delete old authoring (picker/forms/`SchemaEditorModal`/`use-archetypes`) → render-flip (card → `label` + re-pointed `axes-summary`) → seed composition-native + coverage-gate rewrite → contract archetype removal + api-server mapper/endpoint removal (atomic) → Prisma model/column/enum drops + `db:reset` + full suite. The ~40-consumer fan-out — mechanical because authoring already migrated. 1 gated DB run.

Session budget: ≤1 heavy pipeline/session ⇒ S1 (~1 session), S2 (~1), S3 (~1). 2 gated DB runs total (S1, S3).

## Doc surface consulted (where the migration plan lives)

`initiatives/plan-editor-compose/` (charter/plan/state/journal/algebra-spec + now decisions/deferred/this) · `docs/adr/0037` · `analysis/` (domain reference; `source/` sacred, archetype taxonomy superseded-as-target) · `.feature-dev/{1780402567=10.1, 1780426624=10.2, 1780482955=10.3}` (gitignored, ephemeral — the richest reasoning; promote out of here) · `implementation/` (superseded history; D14/D-A\* migrated to `decisions.md`).
