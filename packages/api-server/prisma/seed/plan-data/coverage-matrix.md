# Coverage matrix — Demo Plan seed

Single source of truth for **what Session B must emit** so the seeded DB
covers 100% of the training-domain discriminator space. Session A's emit
pipeline includes a runtime assertion that fails the seed run if any cell
below has zero occurrences in the resulting Prisma rows.

Cross-references:

- `canonical-schema.ts` — Zod shape the synthetic builder produces (`_canonical/plan-synthetic/`).
- `analysis/artifacts/06-formalization/stress-final.md` — verified
  archetype-instance + VO mapping; **every cell** below cites the
  `block-NNN` (sample) or `phase-7-*` (out-of-sample) source.
- `analysis/artifacts/01-inventory/block-instances.md` — 198 block cards,
  raw bodies + locations.
- `analysis/artifacts/02-patterns/schema-archetype-mapping.md` — per-block
  archetype assignment for 337 schemas.
- `analysis/artifacts/03-content/exercise-canonical-list.md` — 149 canonical
  exercises (Session B emits `catalog.exercises[]` from this).
- `analysis/artifacts/04-structure/labels-catalog.md` — labels (Day/Session/Block).
- `analysis/artifacts/06-formalization/types.ts` — typed shape source of truth.

Source key:

- `sample` — block-NNN from the 33-sheet sample (Phase 1–6).
- `phase-7` — Phase 7 conceptual session (HR Z2 / numeric pace / tempo /
  wave / cluster / super-set), injected as one synthetic week tail.

`Required` column: minimum occurrences across the seeded DB for the build
to pass. If a single block already exercises multiple cells, that's fine —
the count is per cell, not per block.

---

## 1. Catalog coverage

| Layer            | Cell                 | Required | Source                                  | Notes                                                                                                                                                                                                        |
| ---------------- | -------------------- | -------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Catalog.exercise | 149 canonical names  | 149      | `03-content/exercise-canonical-list.md` | atomic 93 + compound 47 + composite 4 + or 2 + placeholder 2 + special 1                                                                                                                                     |
| Catalog.label    | every distinct label | ≥20      | `04-structure/labels-catalog.md`        | day 1 (`REST DAY`) + session 1 (`1ST SESSION`) + block 17 canonical + composite-decomposed (`EASY PACE`, `Gymnastics`, …) + Phase 7 labels (`ENDURANCE`, `CONDITIONING`, `STRENGTH`, `OLYMPIC`, `ACCESSORY`) |

---

## 2. Entity-hierarchy invariants

| Cell                                         | Required | Source                                                                     | Notes                                       |
| -------------------------------------------- | -------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| Day with `label = REST DAY`                  | ≥1       | sample (every sheet × THU+SUN = 66)                                        | per `hierarchy.md` §1                       |
| Day with `label = null` (active day)         | ≥1       | sample (most active days)                                                  |                                             |
| Day with `sessions = []` (REST DAY)          | ≥1       | sample                                                                     |                                             |
| Session with `label = 1ST SESSION`           | ≥1       | sample (165 occurrences)                                                   |                                             |
| Session with `freezeLoadsAtCreation = true`  | ≥1       | introduce in Demo Plan tail                                                | Phase 6 Q10; pick one cluster-style session |
| Block with `labels = []` (implicit)          | ≥1       | sample 75 occurrences                                                      | `hierarchy.md` §5                           |
| Block with `labels.length === 1`             | ≥1       | sample (most active blocks)                                                |                                             |
| Block with `labels.length ≥ 2` (multi-label) | ≥1       | sample `STRENGTH ENDURANCE \| Gymnastics` (block-047..054, 12 occurrences) |                                             |
| Block with `schemas = []` (empty body)       | ≥1       | sample (block-002 `STRENGTH ENDURANCE`, sheet-18 MONDAY)                   | `hierarchy.md` §6                           |
| Block with `intensity` set                   | ≥1       | sample block-055 (`EASY PACE [ 70% EFFORT ]`)                              |                                             |
| Block with `timeCap` set                     | ≥1       | sample block-146 (`PRACTICE [ 5-10 min ]`)                                 |                                             |
| Schema with `notes` set                      | ≥1       | sample block-005 / 037 / 087 / 140 / 141 EXAMPLE annotation Q15            |                                             |
| Schema with `intensity` set (schema-level)   | ≥1       | sample block-078 / schema-1 (`[ 75-80% Effort ]`) AMRAP body               |                                             |
| Schema with `parentSchemaId` (sub-schema)    | ≥25      | sample 25 sub-schemas                                                      | from `stress-final.md` §1 aggregate         |
| Schema with `alternatingGroupRef`            | ≥2       | sample block-009 (alternating-sets)                                        | `hierarchy.md` ratifies N-ary; sample N=2   |
| Schema with `trailingConnector`              | ≥1       | sample block-006 (single-line-with-then-connector)                         |                                             |

---

## 3. Archetype coverage (33 archetypes)

All 33 archetypes must appear ≥1 time in the seeded DB. Counts below match
`stress-final.md` §2 aggregate.

| Archetype                                   | Sample occurrences | Sample anchor block         | Required |
| ------------------------------------------- | ------------------ | --------------------------- | -------- |
| `n-rounds`                                  | 125 top + 4 sub    | block-001                   | ≥1       |
| `named-themed-sets`                         | 44                 | block-153                   | ≥1       |
| `ladder-descending`                         | 21 top + 3 sub     | block-006                   | ≥1       |
| `emom-sub-minute-slot`                      | 15 sub-only        | block-080 / sub-1           | ≥1       |
| `parallel-ladders-descending`               | 12 top + 3 sub     | block-037                   | ≥1       |
| `single-line-with-then-connector`           | 11                 | block-006 / sch-1           | ≥1       |
| `run-distance`                              | 11                 | block-060                   | ≥1       |
| `flat-list-headerless`                      | 10                 | block-145                   | ≥1       |
| `named-exercise-program`                    | 9                  | block-008                   | ≥1       |
| `single-line-bare`                          | 7                  | block-046 / sch-1           | ≥1       |
| `pull-ups-dips-cycle`                       | 6                  | block-047                   | ≥1       |
| `emom-nested-per-minute`                    | 6                  | block-080                   | ≥1       |
| `placeholder-body`                          | 6                  | block-152                   | ≥1       |
| `composite-rounds-with-rest`                | 6                  | block-017                   | ≥1       |
| `ladder-ascending`                          | 5                  | block-032                   | ≥1       |
| `single-line-total-counter`                 | 4                  | block-102                   | ≥1       |
| `composite-intervals-then-rounds`           | 3                  | block-015                   | ≥1       |
| `nested-rounds-over-rounds`                 | 3                  | block-011                   | ≥1       |
| `nested-rounds-over-parallel-ladder`        | 3                  | block-010                   | ≥1       |
| `alternating-sets`                          | 2                  | block-009                   | ≥2       |
| `time-window-outer`                         | 2                  | block-003                   | ≥1       |
| `parallel-ladders-mixed-direction`          | 2                  | block-005                   | ≥1       |
| `nested-composite-rounds-over-ladder`       | 2                  | block-020                   | ≥1       |
| `composite-intervals-work-rest-progressive` | 2                  | block-140                   | ≥1       |
| `url-only-body`                             | 2                  | block-147                   | ≥1       |
| `ladder-vertex-down-pyramid`                | 1                  | block-098                   | ≥1       |
| `ladder-spike`                              | 1                  | block-106                   | ≥1       |
| `amrap-flat`                                | 1                  | block-078                   | ≥1       |
| `parallel-pyramids`                         | 1                  | block-087                   | ≥1       |
| `composite-intervals-work-rest-fixed`       | 1                  | block-142                   | ≥1       |
| `composite-intervals-on-off-max-tail`       | 1                  | block-143                   | ≥1       |
| `composite-rolling-rounds`                  | 1                  | block-144                   | ≥1       |
| `practice-list`                             | 1                  | block-146                   | ≥1       |
| `super-set` (Phase 7)                       | 0 (out-of-sample)  | phase-7-accessory-super-set | ≥1       |

`alternating-sets` requires ≥2 because the canonical block-009 has exactly
two member schemas; coverage must keep that N-ary group intact.

---

## 4. RowKind coverage (9 + REST_SLOT special)

| `rowKind`             | Sample anchor                                                   | Required | Notes                                       |
| --------------------- | --------------------------------------------------------------- | -------- | ------------------------------------------- |
| `EXERCISE`            | block-001 (all four rows)                                       | ≥1       | dominant kind                               |
| `REST`                | block-008 / row "REST IN BETWEEN SETS UNTIL RECOVERY"           | ≥1       | inline rest row, parsed RestSpec            |
| `FOOTNOTE`            | block-032 footnote `** 5 strict HSPU [ AFTER EACH ROUND ]`      | ≥1       | marker `**`, target `each_round`            |
| `STANDALONE_LOAD`     | block-005 / row `[ DB 2x 15 kg ]` (or block-077 `[ 2x 15 kg ]`) | ≥1       | scope `applies_to_all_preceding_rows`       |
| `STANDALONE_URL`      | block-147 wrapped URL + block-149 bare URL                      | ≥2       | wrapped=true and wrapped=false              |
| `PLACEHOLDER`         | block-152 (`biceps / triceps`) + block-194 (paired)             | ≥1       | placeholderKind variants                    |
| `INNER_LADDER_MARKER` | block-037 (`36-28-20` / `18-14-10` / `4-3-2`)                   | ≥1       | inside parallel-ladders-descending          |
| `REP_DEFINITION`      | block-043 (`5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ]`)      | ≥1       | inline_equality form                        |
| `REST_SLOT`           | block-080 / sub-4 (REST sub-minute in EMOM)                     | ≥1       | Q12 special; rowPayload has no other fields |

---

## 5. ExerciseForm coverage (6 forms)

| `exercise.form`   | Sample anchor                                                            | Required | Notes                                     |
| ----------------- | ------------------------------------------------------------------------ | -------- | ----------------------------------------- |
| `atomic`          | block-001 DB bench presses                                               | ≥1       |                                           |
| `compound`        | block-077 `5 strict DB press + 5 DB push press [ 2x 15 kg ]`             | ≥1       | trailing weight applies to whole compound |
| `cyclical`        | block-047 pull-ups-dips-cycle (CyclicalCompound)                         | ≥1       | rotation through pull-ups/dips            |
| `sandwich`        | sample sandwich DT (block to be identified per stress-final §2.6 / §3.6) | ≥1       | opening/middle/closing                    |
| `or_alternative`  | sample row containing `X OR Y` (per `03-content/exercise-edge-cases.md`) | ≥1       | OR-alternative purpose                    |
| `placeholder_ref` | block-152 / 194 placeholder ref via Exercise.placeholderFlag = true      | ≥1       |                                           |

---

## 6. Load (5 kinds) + Weight (8 variants) + PercentageReference (3 scopes)

### 6.1 Load.kind

| `kind`           | Sample anchor                                                                                      | Required |
| ---------------- | -------------------------------------------------------------------------------------------------- | -------- |
| `absolute`       | block-001 (`[ 2x 15 kg ]` on DB bench presses)                                                     | ≥1       |
| `percentage`     | phase-7 §7.3 tempo back squat `75% 1RM`; also block-055 (`70% EFFORT`)                             | ≥1       |
| `bodyweight`     | block-001 jumping Jacks (no weight)                                                                | ≥1       |
| `without_weight` | block-008 Bulgarian split squats drop-set final stage `EXPLODE`                                    | ≥1       |
| `unspecified`    | weighted-implicit exercise where coach hasn't filled load yet (one schema row in placeholder body) | ≥1       |

### 6.2 Weight.variant (under `Load.absolute.weight`)

| `variant`             | Sample anchor                                                                                                  | Required |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| `single`              | block-189 KB swings `[ 24 kg ]`                                                                                | ≥1       |
| `dual`                | block-001 DB bench presses `[ 2x 15 kg ]`                                                                      | ≥1       |
| `single_arm`          | block-119 single arm row `[ 1 KB 15 kg ]`                                                                      | ≥1       |
| `compound_device`     | block-119 single arm row `[ 5 KB 24 kg + 10 DB 15 kg ]` (split tier? — clarify with `load-edge-cases.md` §1.6) | ≥1       |
| `split_tier`          | block-119 stages [5 KB 24, 10 DB 15]                                                                           | ≥1       |
| `dual_value`          | block-003 / sub-2 overhead squats `[ 50/30 kg ]` (resolver `athlete_profile`)                                  | ≥1       |
| `with_asymmetric_arm` | block-123 DB bench `[ 15 kg \| LEFT arm DO \| RIGHT arm HOLD in UP ]`                                          | ≥1       |
| `with_depth_modifier` | block-189 KB swings `[ 24 kg \| to the parallel ]`                                                             | ≥1       |

### 6.3 PercentageReference.scope (under `Load.percentage.reference`)

| `scope`           | Sample anchor                                                       | Required |
| ----------------- | ------------------------------------------------------------------- | -------- |
| `self`            | phase-7 §7.3 tempo back squat `75% self 1RM`                        | ≥1       |
| `movement_family` | introduce in Demo Plan accessory work (e.g. `60% press family 1RM`) | ≥1       |
| `other_exercise`  | introduce on accessory (e.g. `back squat 1RM as reference`)         | ≥1       |

---

## 7. RepNotation (7 kinds)

| `kind`              | Sample anchor                                                            | Required                                                         |
| ------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `count`             | block-001 (`10 DB bench presses`)                                        | ≥1                                                               |
| `range`             | sample range reps (e.g. `8-12 reps`) — pick one block                    | ≥1                                                               |
| `unit_bound`        | block-060 `RUN 5-7 km` (unit=km, range), also `60 min` (unit=min, value) | ≥2 (one value-form + one range-form)                             |
| `max`               | block-080 / sub-3 (`max in remaining time`), block-143 tail (max)        | ≥3 (bare + progressive + in_remaining_time) — all three subForms |
| `implicit`          | block-006 `15-12-9:` ladder body rows inherit steps                      | ≥1                                                               |
| `total_flag`        | block-102 (`30 strict HSPU [ TOTAL ]`)                                   | ≥1                                                               |
| `compound_rep_unit` | block-043 with `REP_DEFINITION` reference                                | ≥1                                                               |

`max.subForm`: all three (`bare` + `progressive` + `in_remaining_time`)
must appear at least once. `bare` = block-080 / sub-3, `progressive` =
phase-7 wave (or named-exercise-program progressive seed),
`in_remaining_time` = block-143 tail.

---

## 8. PerLimbDistribution (4 kinds)

| `kind`           | Sample anchor                                                            | Required          |
| ---------------- | ------------------------------------------------------------------------ | ----------------- |
| `each_leg`       | block-008 Bulgarian split squats `[ each leg ]`                          | ≥1                |
| `each_arm`       | block-094 single arm row `[ each arm ]`                                  | ≥1                |
| `explicit_split` | block-123 DB bench `[ … \| LEFT arm DO … ]` (side="left") + mirror right | ≥2 (left + right) |
| `alternating`    | block-037 DB Snatches `[ alternative ]`                                  | ≥1                |

---

## 9. TempoModifier (5 axes — additive, can combine)

| Axis             | Sample anchor                                                     | Required |
| ---------------- | ----------------------------------------------------------------- | -------- |
| `fullTempo`      | phase-7 §7.3 back squat `3-1-2-0`                                 | ≥1       |
| `slowEccentric`  | sample slow-eccentric `[ slow ecc 4s ]` (per `modifier-scope.md`) | ≥1       |
| `pauseInUp`      | sample `[ pause up 2s ]` (per `modifier-scope.md`)                | ≥1       |
| `holdAfterLast`  | sample `[ hold last 10s ]` (per `modifier-scope.md`)              | ≥1       |
| `perNthRepPause` | sample `[ AFTER each Nth REP - M sec pause ]`                     | ≥1       |

---

## 10. SequenceIndicator (6 kinds)

| `kind`                               | Sample anchor                                                          | Required |
| ------------------------------------ | ---------------------------------------------------------------------- | -------- |
| `before_named`                       | sample row `[ before METCON ]`                                         | ≥1       |
| `after_named`                        | sample row `[ after BAR DIPS complex ]` (block-051)                    | ≥1       |
| `before_named_after_named_composite` | sample row `[ before X after Y ]` (per `modifier-scope.md` if present) | ≥1       |
| `only_once_before`                   | block-006 jumping Jacks `[ ONLY ONCE before METCON ]` (Q14)            | ≥1       |
| `after_each_round`                   | block-032 footnote `AFTER EACH ROUND`                                  | ≥1       |
| `after_each_typed_round`             | block-098 footnote `AFTER EACH GYMNASTICS set`                         | ≥1       |

---

## 11. Intensity (5 dims — additive)

| Dim             | Sample anchor                                                        | Required                                                                                     |
| --------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `effortPercent` | block-055 (`70% EFFORT`, single value) + block-078 (`75-80%`, range) | ≥2 (single + range)                                                                          |
| `rpe`           | phase-7 — out-of-sample (no occurrences in sheets)                   | ≥1                                                                                           |
| `pace`          | block-055 (`EASY PACE`) — pace=easy                                  | ≥1 + remaining 3 values (`moderate`/`hard`/`recovery`) injected via phase-7 examples         |
| `hrZone`        | phase-7 §7.1 (Z2)                                                    | ≥1 + remaining 4 zones (`Z1`/`Z3`/`Z4`/`Z5`) injected via phase-7 examples                   |
| `numericPace`   | phase-7 §7.2 (`1:50/m`)                                              | ≥1 covering both `min_per_distance` AND `distance_per_min` paceType + multiple distanceUnits |

---

## 12. RestSpec (scope × unit × qualifier)

| Cell                                | Sample anchor                                     | Required |
| ----------------------------------- | ------------------------------------------------- | -------- |
| `scope = between_sets`              | block-008 `REST IN BETWEEN SETS UNTIL RECOVERY`   | ≥1       |
| `scope = between_rounds`            | block-017 `3 min rest in between rounds`          | ≥1       |
| `scope = between_intervals`         | phase-7 §7.5 (15 sec intra-cluster rest)          | ≥1       |
| `scope = after_specific_set`        | introduce in Demo Plan (e.g. `2 min after set 3`) | ≥1       |
| `duration.unit = sec`               | phase-7 §7.5 (15 sec)                             | ≥1       |
| `duration.unit = min`               | block-017 (3 min)                                 | ≥1       |
| `duration.unit = range_sec`         | sample range-sec `[ 90-120 sec ]`                 | ≥1       |
| `duration.unit = range_min`         | sample range-min `[ 2-3 min ]`                    | ≥1       |
| `qualifier = until_recovery`        | block-008 `UNTIL RECOVERY`                        | ≥1       |
| `qualifier = fixed`                 | block-017 `3 min rest`                            | ≥1       |
| `qualifier = range`                 | sample range qualifier                            | ≥1       |
| `setIndex` set (after_specific_set) | introduce in Demo Plan                            | ≥1       |

---

## 13. TimeCap (unit + range vs single)

| Cell                    | Sample anchor                              | Required |
| ----------------------- | ------------------------------------------ | -------- |
| `unit = min`, no `max`  | introduce on a single-bound time-cap block | ≥1       |
| `unit = min` with `max` | block-146 `PRACTICE [ 5-10 min ]`          | ≥1       |
| `unit = sec`            | introduce on a short interval              | ≥1       |

---

## 14. SchemaKind × header presence

| `SchemaKind` | Sample anchor                           | header? | Required |
| ------------ | --------------------------------------- | ------- | -------- |
| `ATOMIC`     | block-001 (n-rounds)                    | yes     | ≥1       |
| `HEADERLESS` | block-037 (parallel-ladders-descending) | null    | ≥1       |
| `NESTED`     | block-003 (time-window-outer)           | yes     | ≥1       |
| `NAMED`      | block-008 (named-exercise-program)      | yes     | ≥1       |
| `COMPOSITE`  | block-017 (composite-rounds-with-rest)  | yes     | ≥1       |

---

## 15. ConnectorForm (trailingConnector)

| `form`          | Sample anchor                       | Required |
| --------------- | ----------------------------------- | -------- |
| `then`          | block-006 schema-1 trailing `then:` | ≥1       |
| `then_dots`     | block-006 trailing `...then...:`    | ≥1       |
| `then_n_rounds` | block-030 `...THEN 2 rounds:`       | ≥1       |

---

## 16. Position enum (rare)

| `Position`                | Sample anchor                 | Required |
| ------------------------- | ----------------------------- | -------- |
| `NEUTRAL_GRIP`            | sample `[ neutral grip ]`     | ≥1       |
| `FROM_SOFA`               | block-032 `[ from sofa ]`     | ≥1       |
| `FROM_BOX`                | sample `[ from box ]`         | ≥1       |
| `FROM_BOX_OR_SOFA`        | sample `[ from box or sofa ]` | ≥1       |
| `FROM_SOFA_BOX`           | sample composite              | ≥1       |
| `WITHOUT_BENCH`           | sample `[ without bench ]`    | ≥1       |
| `WITHOUT_JUMP`            | sample `[ without jump ]`     | ≥1       |
| `HOLD_FARM_CARRY`         | sample `[ farm carry hold ]`  | ≥1       |
| `HAND_ON_DB`              | sample `[ hand on DB ]`       | ≥1       |
| `HANDS_ON_DB`             | sample `[ hands on DB ]`      | ≥1       |
| `HAND_ON_DB_NEUTRAL_GRIP` | sample composite              | ≥1       |

Note: Position enum values come from `03-content/modifier-scope.md` / `01-inventory/edge-cases.md`. Some entries may be rare singletons — Session B emits them where attested in sample; if absent, Session A's emit injects a synthetic occurrence on a Phase 7 accessory row (flag in coverage matrix v2).

---

## 17. StagedProgram (Phase 7 + sample drop-set)

| `programKind` | Sample anchor                       | Required |
| ------------- | ----------------------------------- | -------- |
| `drop_set`    | block-008 Bulgarian split squats    | ≥1       |
| `wave`        | phase-7 §7.4 snatch wave loading    | ≥1       |
| `cluster`     | phase-7 §7.5 strict pull-up cluster | ≥1       |

---

## 18. SlotSpec (under `emom-sub-minute-slot`)

| Cell             | Sample anchor                                | Required |
| ---------------- | -------------------------------------------- | -------- |
| `kind = single`  | block-080 / sub-1 (`1 min:`)                 | ≥1       |
| `kind = grouped` | block-079 (`1st & 2nd min:` → minutes=[1,2]) | ≥1       |

---

## 19. MediaReference (under SchemaRow.media + StagedProgram.stages)

| `position` / `appliesTo`    | Sample anchor                                   | Required |
| --------------------------- | ----------------------------------------------- | -------- |
| `position = inline`         | block-001 Incline DB Prone Row demo link inline | ≥1       |
| `position = standalone_row` | block-147 (url-only-body wrapped URL)           | ≥1       |
| `position = bare`           | block-149 bare URL                              | ≥1       |
| `appliesTo = previous_row`  | block-001 demo link after exercise              | ≥1       |
| `appliesTo = current_row`   | inline demo                                     | ≥1       |
| `appliesTo = whole_schema`  | block-147                                       | ≥1       |
| `appliesTo = drop_stage`    | block-008 final stage `EXPLODE` media reference | ≥1       |

---

## 20. PerSetSubstitution (placeholder Q11)

| Cell                                   | Sample anchor                                                                                                              | Required          |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| placeholder + per-set assignments      | block-020 / sub-1 (`*DB exercise` placeholder + PerSetSubstitution)                                                        | ≥1                |
| placeholder `placeholderKind` variants | `muscle_group_reference` (block-152), `purpose_category` (block-193 `ABS`), `coach_choice_slot` (block-020 `*DB exercise`) | ≥3 (one per kind) |

---

## 21. CompoundRow / CyclicalCompound / SandwichCompound / OrAlternative

| Form                          | Sample anchor                                                     | Required |
| ----------------------------- | ----------------------------------------------------------------- | -------- |
| `CompoundRow`                 | block-077 (`5 strict DB press + 5 DB push press`)                 | ≥1       |
| `CompoundRow.sharedModifiers` | trailing-weight cases (block-077 et al)                           | ≥1       |
| `CyclicalCompound`            | block-047 pull-ups-dips-cycle                                     | ≥1       |
| `SandwichCompound`            | sample `DT-style` sandwich (`5 X + 10 Y + 5 X`)                   | ≥1       |
| `OrAlternative.purpose`       | 3 purposes (`scale_down`, `equipment_substitute`, `coach_choice`) | ≥3       |

---

## 22. CompoundRepDefinition (REP_DEFINITION row)

| `form`            | Sample anchor                                                            | Required |
| ----------------- | ------------------------------------------------------------------------ | -------- |
| `inline_equality` | block-043 (`5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ]`)               | ≥1       |
| `curly_brace`     | sample `{X + Y}` notation (per `03-content/compound-and-alternative.md`) | ≥1       |

---

## 23. Footnote (target × marker)

| Cell                        | Sample anchor                                    | Required |
| --------------------------- | ------------------------------------------------ | -------- |
| `marker = *`                | sample single-asterisk footnote                  | ≥1       |
| `marker = **`               | block-032 (`** 5 strict HSPU AFTER EACH ROUND`)  | ≥1       |
| `target = each_round`       | block-032                                        | ≥1       |
| `target = each_set`         | sample `AFTER EACH SET` footnote                 | ≥1       |
| `target = each_typed_round` | block-098 footnote (`AFTER EACH GYMNASTICS set`) | ≥1       |

---

## 24. Phase 7 examples (out-of-sample, one synthetic week tail)

| Example                              | Carrier(s)                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `phase-7-hr-z2-base-run`             | Intensity.hrZone `Z2` + run 60 min                                         |
| `phase-7-numeric-pace-row-intervals` | Intensity.numericPace + Equipment `ROW_ERG`                                |
| `phase-7-tempo-back-squat`           | TempoModifier.fullTempo `3-1-2-0` + Load.percentage.reference.self         |
| `phase-7-snatch-wave`                | StagedProgram.programKind `wave` + Load.percentage (3 stages)              |
| `phase-7-strict-pull-up-cluster`     | StagedProgram.programKind `cluster` + RestSpec scope `between_intervals`   |
| `phase-7-accessory-super-set`        | Archetype `super-set` + SuperSetPair × 2 + RestSpec scope `between_rounds` |

Coverage assertion treats Phase 7 sessions as filling cells that the
33-sheet sample doesn't reach.

---

## 25. Edge-case observations Session B must record

These are not coverage cells but invariants Session B is expected to
preserve verbatim per `analysis/artifacts/03-content/edge-cases.md` and
`exercise-edge-cases.md`. Session A's emit code rejects JSON that drops
them silently.

- Empty-body block-002 (`STRENGTH ENDURANCE` sheet-18 MONDAY) — `schemas = []`, `labels = ["STRENGTH ENDURANCE"]`. Coach intentionally left content blank.
- Empty-body `CORE MUSCLES` × 5 (sheet-20 / 23 / 26 / 29 / 32 SATURDAY) — same pattern.
- Lowercase block-labels (`warm up for feet`, `warm up BEFORE run`) — no normalisation, stored verbatim.
- Multi-label composite decomposition: `STRENGTH ENDURANCE | Gymnastics` → `labels = ["STRENGTH ENDURANCE", "Gymnastics"]` (order preserved per `labels-catalog.md`).
- Intensity inline annotation extraction: `[ 70% EFFORT ]` from block-label string → `Block.intensity.effortPercent.value = 70`; remaining label parts → `labels[]`.
- EXAMPLE annotations (`EXAMPLE: ... etc.`): stored in `Schema.notes` verbatim, NOT as separate row (Q15).
- `[ alternative ]` annotation on DB Snatches: `PerLimbDistribution.kind = "alternating"` (Q13), NOT `each_arm`.
- Sequence indicator extraction: `[ ONLY ONCE before METCON ]` → `SequenceIndicator.kind = "only_once_before"` + `targetLabel = "METCON"` (Q14).
- Connector rows: `then:` / `...then...:` standalone lines → `Schema.trailingConnector` on the PRECEDING schema, not a separate row.
- Migration weeks with calendar gaps (per `01-inventory/edge-cases.md`): emit as `Week` rows with `days = []` and a `notes` string explaining the gap (e.g. "sheet absent, training paused for travel").

---

## 26. Coverage assertion (Session A enforces)

Session A's emit pipeline builds an in-memory occurrence map keyed by
canonical cell descriptors (e.g. `Load.kind:percentage`,
`RowKind:STANDALONE_LOAD`, `archetype:super-set`). After all Prisma rows
have been created, it asserts every cell from this matrix has count ≥
`Required`. Failure prints the missing cells and aborts the seed run
non-zero. Test file: `packages/api-server/src/__tests__/seed-coverage.test.ts`
(created in /feature C8.5).
