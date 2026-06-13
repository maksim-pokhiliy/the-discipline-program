# catalog-pass — recon (the next wave's design input)

**Status: RECON CAPTURED 2026-06-13 (post-W4-editor merge, PR #265).** The catalog pass is the next roadmap step (`plan.md`): reshape the **Exercise catalog** — a `concrete | placeholder | rest` NATURE enum (CATALOG-NATURE), an equipment LIBRARY with multi-refs (EQUIPMENT-LIBRARY), the loose-`exerciseId` FK (W4R-EXID-FK), the dead `getExercise` cleanup (W4R-GETEX-DEAD); then e2e. **It touches Prisma + seed → NOT platform-only → it needs a reseed + the gated api-server suite** (the W4-model ritual, unlike W4-editor). This doc is the VERIFIED recon (two parallel agents over main, 2026-06-13) so the planner session doesn't re-run it; §8 is the planner→owner fork agenda.

**Scope framing (resolve first — F-INIT):** the Exercise catalog is OUT of the session-primitive grid (charter non-goal). The primitive's own acceptance is MET (W1→W4-editor shipped; full suite green on live DB). So: run the catalog pass as a session-primitive TAIL, or `/initiative-close` session-primitive and spin a fresh `catalog` initiative. Owner's call.

## 1. The current Exercise model (verbatim-verified)

`model Exercise` (`packages/api-server/prisma/schema.prisma:698-720`): `id` · `canonicalName` · `canonicalNameLower @unique` (natural key, P2002 dup) · `primaryEquipment Equipment` · `movementTypeTagPrimary MovementType` · `movementTypeTagSecondary MovementType?` · `defaultDemoUrls String[]` · `canonicalCompoundType CanonicalCompoundType` · `placeholderFlag Boolean @default(false)` · `movementFamily String?` (loose, `@@index`) · `defaultLoad Json?` (**ORPHAN — unread/unwritten, not in contract/mapper/seed; drop**) · `aliases Json?` (contract treats as `string[]` — Prisma↔contract type mismatch) · `notes String?`. Only relation: `oneRMRecords`.

Enums: **`Equipment` (19** incl. `BOX`/`SOFA`/`BOX_OR_SOFA`/`MIXED`/`UNKNOWN`) · **`MovementType` (15)** · **`CanonicalCompoundType` (5**: `ATOMIC`/`COMPOUND_PLUS`/`COMPOSITE_NAMED`/`PLACEHOLDER`/`ALTERNATIVE_OR`) · `OneRMRecordSource` (3).

**⚠ enum values are duplicated 4×** — the Prisma enum · the contract const (`EXERCISE_EQUIPMENT`/`EXERCISE_MOVEMENT_TYPE`/`EXERCISE_CANONICAL_COMPOUND_TYPE` in `exercise.constants.ts`) · the mapper enum-maps (`equipmentToPrisma`/… in `mappers/lms/exercise.enum-maps.ts`) · the seed (`canonical-schema.ts` `equipmentEnum`/`movementTypeEnum`). Any reshape must sync ALL FOUR or silent drift.

## 2. The `exerciseId` FK table (W4R-EXID-FK)

| Site                                                                                        | Field                                                                                 | FK?                                                                                                             |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `SchemaRow.exerciseId` (`schema.prisma:675`)                                                | `exerciseId String`                                                                   | **LOOSE — no `@relation`/FK.** The main plan→exercise path; integrity only via the seed `load-and-validate.ts`. |
| `OneRMRecord.exerciseId` (`:786`)                                                           | `@relation(... onDelete: Restrict)` + `@@unique([userId,exerciseId])`                 | **REAL FK — the ONLY one.**                                                                                     |
| `load.percentage.reference.other_exercise.targetExerciseId` (`contracts/_shared/load.ts:9`) | inside `Schema.intensity`/`SchemaRow.load` **Json**, zod-cuid only                    | **LOOSE** (a Json field can't be a Prisma FK).                                                                  |
| `PerformedExerciseInstance` (`:823`)                                                        | FK → `SchemaRow` (Restrict), reaches exercise transitively via the loose `exerciseId` | indirect.                                                                                                       |
| `movementFamily` (`:708`)                                                                   | `String?`                                                                             | **LOOSE string, NOT an entity** ("library" = `SELECT DISTINCT`).                                                |

**TRAP:** `deleteExercise` maps P2003 → `"referenced by … schema rows"`, but `SchemaRow` has no FK, so P2003 never fires for rows — the message misleads. Fix in this pass.

## 3. NATURE (CATALOG-NATURE)

Nature today is **SMEARED across two fields**: `canonicalCompoundType` (5-enum) **+** a redundant `placeholderFlag` boolean, kept in sync by a create/update **refine** (`placeholderFlag === (canonicalCompoundType === "PLACEHOLDER")`). Reshape → a single `nature: concrete | placeholder | rest` (D-ROW-GRAMMAR — render-kind INFERRED from nature, never picked).

**3 load-bearing `placeholderFlag` readers to preserve** (all `apps/platform`): `format-row-builders.ts` — placeholder rows render **dashed** + the **demo-link is suppressed**; `exercise-picker.tsx` — the `placeholderOnly` **filter**. Plus the cross-field refine (migrate or drop deliberately — it's enforced on every write).

**Today rest & placeholder are INDISTINGUISHABLE at the data layer** — the W4 interim bridge is a `placeholderFlag:true` "rest-slot" exercise. The pass splits them into a real 3-value nature + decides rest's distinct render. Meanings (analysis `03-content/exercise-attributes.md`, `05-synthesis/domain-model.md:259-261`): concrete = real movement (default) · placeholder = coach-choice slot (`biceps/triceps`, `ANY exercise for ABS`, `*DB exercise`) · rest = a rest "exercise" (rest = тоже задание).

## 4. EQUIPMENT (EQUIPMENT-LIBRARY)

Owner (verbatim, `deferred.md`): "equipment → its own coach-managed library; Exercise carries **MULTIPLE equipment refs** (today: single `primaryEquipment` enum); movement tags — снести." Model = a new entity + join table mirroring `Label`/`BlockLabelAssignment`.

**Naming-fork rationale:** equipment fanned into NAMES ("Squat (Barbell)") collides with genuinely-distinct movements (Front/Back/Goblet Squat) → multi-ref keeps ONE exercise identity carrying a SET of implements; dissolves today's `MIXED` escape-hatch (the analysis's `mixed` = "встречается с разными equipment" — exactly what multi-ref replaces).

**Implement-type tie-in (D-LOAD-FINAL):** implement TYPE → the exercise (equipment lib) · count → an explicit ROW field (**already authored as of W4-editor**) · kg → load. So the row's count is done; the catalog only needs to supply the type.

**Blast radius = DISPLAY + PLUMBING only, ZERO logic.** 8 display sites (admin list chip/filter/form-select; platform picker meta + row-modal chip), the mapper, the seed. No equipment-based substitution/scoring/filter-as-logic anywhere. → going multi-ref = entity + join + reshape the display sites to a list + admin multi-select + mapper + seed.

**Decide:** fate of the position-ish / catch-all enum values `BOX`/`SOFA`/`BOX_OR_SOFA` (D-LOAD-FINAL already trimmed them from the weight VO but they still live in the `Equipment` enum), `MIXED`, `UNKNOWN`.

## 5. MOVEMENT-TYPE KILL — confirmed safe

`movementTypeTagPrimary/Secondary` have **ZERO machine reader** (verified exhaustively): only display label-maps (admin list chip + filter + form selects; platform picker meta-line + row-modal chip) + plumbing (schema/mapper/seed). No 1RM resolution, scoring, grouping, substitution. Analysis itself calls them "best-effort … НЕ финальная taxonomy" (`exercise-attributes.md`). Owner: "снести."

**Kill touch-points:** `MovementType` Prisma enum + `EXERCISE_MOVEMENT_TYPE` const + `exerciseMovementTypeSchema` + the 2 entity fields + the form fields + `MOVEMENT_TYPE_MAP`/`movementTypeToPrisma` + `MOVEMENT_TYPE_LABELS` (both apps) + admin filter/column/`basic-info-card`/`secondary-movement-select` + the 2 platform meta sites + the seed columns.

**KEEP `movementFamily`** (SEPARATE, loose String) — display/ordering only (picker meta · list `orderBy` · admin distinct-autocomplete). The `movement_family` % scope was already DROPPED (`load.ts` = `self|other_exercise`; `load.test.ts` asserts rejection). It survives the tag kill untouched; a real movement-family library is a later, separate call if ever.

## 6. Dead code + orphans (cleanup riders)

- **W4R-GETEX-DEAD:** `RefResolver.getExercise` + the exercise resolver-map (the `setExercise` write at `catalog-emit.ts:50`) are DEAD (0 callers; exercise ids are content-addressed `exerciseCuid(canonicalName)`). **Bonus dead** in `ref-resolver.ts`: `stats()` + `getRow` (0 callers). Cleanup: `ref-resolver.ts` (the exercise map + `get/setExercise` + `exerciseCount`; + `stats`/`getRow`) + `catalog-emit.ts:50` (drop the call, then the now-unused `resolver` param). **Keep** `getLabel`/`getModifier` — those resolve DB-generated ids (live).
- **Orphan `Exercise.defaultLoad Json?`** — in the DB, never read/written. Drop.
- **`canonicalName` limit mismatch:** contract `200` vs seed `canonical-schema.ts` `120`. Reconcile.
- **Count drift:** 152 seeded exercises vs the coverage-doc's stated 149.

## 7. Seed touch surface

**152 exercises** (80 equipment + 72 bodyweight = 55 atomic / 11 compound / 6 placeholder) authored via **3 POSITIONAL factories** in `catalog-exercises-helpers.ts` (`atomic`/`compound`/`placeholder`) — nature is baked into the factory choice, not passed per-entry. **Nature reshape = rewrite the 3 factories (ONE file).** **Equipment-as-entity = touch the 3rd positional arg in all 152 entries + the entry type + `canonical-schema.ts`.** Ids content-addressed (`exerciseCuid(canonicalName)`).

## 8. Design forks for the planner session (resolve WITH the owner → then write the catalog-pass `/feature` prompt)

- **F-INIT** — session-primitive tail vs a fresh `catalog` initiative (the primitive's acceptance is met; see the scope framing up top).
- **F-NATURE** — the `nature` enum shape: does `canonicalCompoundType` DIE entirely (folded into `nature`), or do `COMPOUND_PLUS`/`COMPOSITE_NAMED`/`ALTERNATIVE_OR` survive somewhere? (W4 already moved compound/OR → row-groups, so those values look vestigial.) Drop the redundant `placeholderFlag` + its refine. Decide rest's distinct render (vs placeholder's dash).
- **F-EQUIP** — the equipment library entity + join shape (mirror `Label`) · multi-ref on `Exercise` · which `Equipment` values survive as real equipment (`BOX`/`SOFA`/`BOX_OR_SOFA`/`MIXED`/`UNKNOWN` fate) · admin equipment-CRUD + coach create-on-the-fly (reuse the W4 `ModifierPicker` / the planned LABEL-FLOW-UX creatable picker?).
- **F-FK** — add the `SchemaRow.exerciseId` FK (`onDelete: Restrict`, mirror `OneRMRecord`); `targetExerciseId` stays Json (guard at write/seed only); fix the misleading `deleteExercise` P2003 message.
- **F-KILL-SCOPE** — movement-type kill (confirmed) + the orphan/dead-code riders (§6) + the limit/count reconciliations — all in this pass, or split.
- **F-GATE** — this is a Prisma+seed wave → the W4-model ritual (reseed + gated suite), NOT platform-only. The W4-editor server fast-follows (W4R-001-SERVER, DR-W4E-ROWREORDER-CONTIG-SERVER) can ride this wave's gated-suite re-arm.
- **Independent, owner-paced (not this pass):** the scheduled `W3-TRACK-DRAG + W3-DND-POLISH` `/feature small`.

**Recon agents (2026-06-13):** model+flags map + the consumer kill/keep + the domain-truth citations. Key files: `packages/contracts/.../exercise/{exercise.schema.ts,exercise.constants.ts}` · `packages/api-server/prisma/schema.prisma` (Exercise 698-720, enums 480-525) · `mappers/lms/exercise.{mapper,enum-maps}.ts` · `endpoints/lms/exercise/{admin,platform}.ts` · `apps/platform/.../lib/format-row-builders.ts` · `apps/platform/.../components/{exercise-picker,row-editor-modal}.tsx` · `apps/admin/src/modules/exercises/**` · seed `plan-data/plan-synthetic/catalog-exercises*.ts` + `canonical-schema.ts` + `plan-emit/{ref-resolver,catalog-emit}.ts`. Domain SSOT: `decisions.md` (D-ROW-GRAMMAR, D-LOAD-FINAL, DR-W4-3) · `deferred.md` (EQUIPMENT-LIBRARY, CATALOG-NATURE, W4R-EXID-FK) · `analysis/artifacts/03-content/exercise-attributes.md` + `05-synthesis/domain-model.md:259-261`.
