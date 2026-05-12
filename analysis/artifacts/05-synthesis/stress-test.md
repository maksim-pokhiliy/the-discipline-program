# Stress test (Phase 5 synthesis, Task 7)

8 sessions из sample укладываются в model. Каждая sample-сессия (block + schemas) разбирается на entity instances + VO values. Gaps documented, либо явный success.

Coverage цель Phase 5: проверить что модель работает на репрезентативной выборке (singletons / canonical patterns / composite multi-label / nested / compound). Полная coverage всех 33 листов — Phase 6 (`stress-final.md`).

---

## §1. block-037 — STRENGTH ENDURANCE (canonical parallel-ladders-descending)

### Raw body (Phase 2.1 разметка)

```
kind: headerless
header: null
body: |
  36-28-20:
  DB Snatches [ 15 kg ] [ alternative ]
  18-14-10:
  DB squats [ 2x 15 kg ]
  4-3-2:
  strict HSPU
  [ EXAMPLE: 36... 18... 4... then... 28... 14... 3... etc. ]
```

### Model fitment

```
Day (order=N, label=null, notes=null)
  └─ Session (order=1, label="1ST SESSION")
       └─ Block (order=M, labels=["STRENGTH ENDURANCE"], intensity=null, time_cap=null)
            └─ Schema (
                  order=1,
                  kind="headerless",
                  archetype="parallel-ladders-descending",
                  header=null,
                  archetype_params={
                    ladders: [
                      { steps: [36, 28, 20], paired_with_inner_row_ref: row-2 },
                      { steps: [18, 14, 10], paired_with_inner_row_ref: row-4 },
                      { steps: [4, 3, 2],    paired_with_inner_row_ref: row-6 }
                    ]
                  },
                  intensity=null,
                  body=[
                    row-1: InnerLadderMarkerRow(steps=[36,28,20]),
                    row-2: ExerciseRow(
                      exercise=Exercise("DB Snatches"),
                      reps=implicit(inherits from row-1),
                      load=Absolute{Weight.single(value_kg=15)},
                      side=PerLimbDistribution(distribution_kind="each_arm", LEFT_RIGHT_pair=false, count_per_limb=null), // [ alternative ]
                      notes="alternative" // legacy alternative-flag captured
                    ),
                    row-3: InnerLadderMarkerRow(steps=[18,14,10]),
                    row-4: ExerciseRow(
                      exercise=Exercise("DB squats"),
                      reps=implicit(inherits from row-3),
                      load=Absolute{Weight.dual(value_kg=15)}
                    ),
                    row-5: InnerLadderMarkerRow(steps=[4,3,2]),
                    row-6: ExerciseRow(
                      exercise=Exercise("strict HSPU"),
                      reps=implicit(inherits from row-5),
                      load=Bodyweight
                    ),
                    row-7: ExampleAnnotationRow // EXAMPLE: ... — see gap below
                  ]
                )
```

### Gaps / observations

1. **`[ alternative ]` annotation для DB Snatches**: per Phase 3.2 ratified merge `DB alt. snatches` → `DB Snatches`; alternating semantics передаётся через `[ alternative ]` annotation на use-site. Модель: PerLimbDistribution с distribution_kind=`each_arm` ИЛИ отдельный `alternative` flag.

   - **Gap**: `[ alternative ]` semantically не покрывается чисто PerLimbDistribution (это alternating execution, не per-arm split). Решение Phase 5: расширить `PerLimbDistribution.variant` add `alternating` enum value (`each_leg / each_arm / explicit_split / alternating`). Phase 6 ratifies.
   - Resolution: `side: PerLimbDistribution(distribution_kind="alternating", source_annotation="alternative")`.

2. **EXAMPLE annotation row**: `[ EXAMPLE: 36... 18... 4... then... 28... 14... 3... etc. ]` — explanatory annotation describes parallel-ladder execution semantics. Per Phase 3.1 §6.10 — это clarification annotation (second-class free-text).

   - **Decision Phase 5**: добавить row_kind = `"annotation"` либо хранить в Schema.notes как explanation_text. Решение: используем `Schema.notes` field (добавляется в Schema entity). Phase 6 financialises.
   - **Add to Schema attributes** (uncovered в §1.4 domain-model): `Schema.notes: string?` для explanatory text. Add to domain-model.md edit / Phase 6 ratifies.

3. **InnerLadderMarkerRow vs archetype_params**: один и тот же `[36,28,20]` хранится дважды — в `archetype_params.ladders[0].steps` и в `body[row-1].steps`. Это **редundancy для clarity**: archetype_params — fast lookup для resolution, body retains structural order для UI rendering.
   - Resolution: ratify dual-storage. Phase 6 решит, derived ли archetype_params из body или primary source.

### Status: укладывается с 2 минорными edge cases (alternating annotation + EXAMPLE row). Both addressable through small model extension.

---

## §2. block-003 — STRENGTH ENDURANCE (time-window-outer singleton)

### Raw body

```
schema-1:
  kind: nested
  header: "0:00-10:00 min:"
  sub-schemas:
  - sub-1:
      kind: atomic
      header: "3 rounds:"
      body: |
        100 single unders
        10 power snatches [ 2x 15 kg ]
schema-2:
  kind: nested
  header: "10:00-20:00 min:"
  sub-schemas:
  - sub-1:
      kind: atomic
      header: "15-12-9:"
      body: |
        burpees over DB
        overhead squats [ 50/30 kg ]
```

### Model fitment

```
Block (order=M, labels=["STRENGTH ENDURANCE"])
  ├─ Schema (
  │     order=1,
  │     kind="nested",
  │     archetype="time-window-outer",
  │     header="0:00-10:00 min:",
  │     archetype_params={ window: { start_hh_mm: "0:00", end_hh_mm: "10:00" } },
  │     body=[
  │       SubSchema(
  │         order=1,
  │         kind="atomic",
  │         archetype="n-rounds",
  │         header="3 rounds:",
  │         archetype_params={ count_form: "exact", count: 3 },
  │         body=[
  │           ExerciseRow(exercise=Exercise("single unders"), reps=count(100), load=Bodyweight),
  │           ExerciseRow(exercise=Exercise("power snatches"), reps=count(10), load=Absolute{Weight.dual(value_kg=15)})
  │         ]
  │       )
  │     ]
  │  )
  └─ Schema (
        order=2,
        kind="nested",
        archetype="time-window-outer",
        header="10:00-20:00 min:",
        archetype_params={ window: { start_hh_mm: "10:00", end_hh_mm: "20:00" } },
        body=[
          SubSchema(
            order=1,
            kind="atomic",
            archetype="ladder-descending",
            header="15-12-9:",
            archetype_params={ steps: [15, 12, 9] },
            body=[
              ExerciseRow(exercise=Exercise("burpees over DB"), reps=implicit, load=Bodyweight), // bodyweight — burpees over DB is bodyweight movement
              ExerciseRow(
                exercise=Exercise("overhead squats"),
                reps=implicit,
                load=Absolute{Weight.dual_value(first=50, second=30, resolver="athlete_profile")}
              )
            ]
          )
        ]
     )
```

### Gaps / observations

1. **`[ 50/30 kg ]` dual-value**: singleton Phase 3.3. Resolver deferred — модель хранит first/second, runtime resolves через athlete profile attribute (sex / RX-SC tier). Phase 5 — model-ready.
2. **`burpees over DB` equipment**: name implies DB присутствует (jumping over DB), но exercise = bodyweight movement (DB как obstacle, не load). Exercise.primary_equipment=`bodyweight`. OK.
3. **Time-window-outer rendering**: эффективно — 2 sequential time-windows составляющие 20-минутный block. Phase 5 model: каждая time-window = отдельная Schema внутри Block. Alternative: одна Schema с array of windows. **Решение Phase 5**: отдельные Schemas (matches Phase 2.1 ratification, supports inheritance Schema.intensity per-window).

### Status: укладывается. Singleton dual-value корректно представлен.

---

## §3. block-009 — STRENGTH ENDURANCE (alternating-sets singleton)

### Raw body

```
schema-1:
  kind: atomic
  header: "1st | 3rd | 5th sets:"
  body: |
    36 Jumping Jacks
    12 DB lunges [ 2x 15 kg ]
    6 KB clean & jerk [ 24 kg ] [ each arm ]
schema-2:
  kind: atomic
  header: "2nd | 4th | 6th sets"
  body: |
    36 Jumping Jacks
    12 DB lunges [ 2x 15 kg ]
    6 deficit HSPU [ from sofa ]
    - 90 sec rest in between sets -
```

### Model fitment

```
Block (order=M, labels=["STRENGTH ENDURANCE"])
  ├─ Schema (
  │     order=1,
  │     kind="atomic",
  │     archetype="alternating-sets",
  │     header="1st | 3rd | 5th sets:",
  │     archetype_params={
  │       set_enumeration: [1, 3, 5],
  │       paired_with_schema_ref: schema-2_id
  │     },
  │     body=[
  │       ExerciseRow(exercise=Exercise("Jumping Jacks"), reps=count(36), load=Bodyweight),
  │       ExerciseRow(exercise=Exercise("DB lunges"), reps=count(12), load=Absolute{Weight.dual(value_kg=15)}),
  │       ExerciseRow(
  │         exercise=Exercise("KB clean & jerk"), // canonical_compound_type=composite_named
  │         reps=count(6),
  │         load=Absolute{Weight.single(value_kg=24)},
  │         side=PerLimbDistribution(distribution_kind="each_arm")
  │       )
  │     ]
  │  )
  └─ Schema (
        order=2,
        kind="atomic",
        archetype="alternating-sets",
        header="2nd | 4th | 6th sets",
        archetype_params={
          set_enumeration: [2, 4, 6],
          paired_with_schema_ref: schema-1_id
        },
        body=[
          ExerciseRow(exercise=Exercise("Jumping Jacks"), reps=count(36), load=Bodyweight),
          ExerciseRow(exercise=Exercise("DB lunges"), reps=count(12), load=Absolute{Weight.dual(value_kg=15)}),
          ExerciseRow(
            exercise=Exercise("deficit HSPU"),
            reps=count(6),
            load=Bodyweight,
            position="from_sofa"
          ),
          InlineRestRow(text="90 sec rest in between sets", scope="between_sets")
        ]
     )
```

### Gaps / observations

1. **paired_with_schema_ref**: archetype-singleton requires cross-schema reference (1st|3rd|5th paired с 2nd|4th|6th). Model: `archetype_params.paired_with_schema_ref` — bidirectional FK. Phase 6 решает: separate join-table или direct FK.
2. **`KB clean & jerk` composite-named**: Exercise.canonical_compound_type=`composite_named`, atomic. OK per Phase 3.2 Option (c).
3. **InlineRestRow scope `between_sets`**: rest применяется не между schemas, а внутри alternating execution (после каждого set из 1+2). Phase 5: scope=`between_sets` корректно покрывает (block-level rest применяется к sets across two paired schemas).

### Status: укладывается. Paired-schema reference требует Phase 6 decision на persistence shape.

---

## §4. block-080 — (implicit) EMOM nested per-minute

### Raw body

```
schema-1:
  kind: nested
  header: "EMOM 16 min | 4 rounds:"
  sub-schemas:
  - sub-1:
      kind: atomic
      header: "1 min:"
      body: |
        25 jumping Jack's
  - sub-2:
      kind: atomic
      header: "2 min:"
      body: |
        12 V-ups
  - sub-3:
      kind: atomic
      header: "3 min:"
      body: |
        MAX DB FRONT SQUATS [ 2x 15 kg ]
  - sub-4:
      kind: atomic
      header: "4 min:"
      body: |
        REST
```

### Model fitment

```
Block (order=M, labels=[]) // implicit block — labels=[]
  └─ Schema (
        order=1,
        kind="nested",
        archetype="emom-nested-per-minute",
        header="EMOM 16 min | 4 rounds:",
        archetype_params={ duration_min: 16, rounds: 4 },
        body=[
          SubSchema(
            order=1,
            kind="atomic",
            archetype="emom-sub-minute-slot",
            header="1 min:",
            archetype_params={ slot: { kind: "single", minute: 1 } },
            body=[
              ExerciseRow(exercise=Exercise("jumping Jacks"), reps=count(25), load=Bodyweight)
              // Note: Exercise canonical_name="jumping Jacks" — source has typo "Jack's"; Phase 1 inventory normalizes
            ]
          ),
          SubSchema(
            order=2,
            archetype="emom-sub-minute-slot",
            header="2 min:",
            archetype_params={ slot: { kind: "single", minute: 2 } },
            body=[
              ExerciseRow(exercise=Exercise("V-ups"), reps=count(12), load=Bodyweight)
            ]
          ),
          SubSchema(
            order=3,
            archetype="emom-sub-minute-slot",
            header="3 min:",
            archetype_params={ slot: { kind: "single", minute: 3 } },
            body=[
              ExerciseRow(
                exercise=Exercise("DB FRONT SQUATS"), // canonical_name normalized: case may differ
                reps=max(sub_form="bare", target_exercise_ref=null),
                load=Absolute{Weight.dual(value_kg=15)}
              )
            ]
          ),
          SubSchema(
            order=4,
            archetype="emom-sub-minute-slot",
            header="4 min:",
            archetype_params={ slot: { kind: "single", minute: 4 } },
            body=[
              ExerciseRow(exercise=Exercise.special("REST"), reps=null, load=null)
              // Edge: "REST" — это не упражнение, это slot-type "rest"
            ]
          )
        ]
     )
```

### Gaps / observations

1. **REST sub-schema body**: `REST` single-word body — не упражнение, а slot-marker. Решение Phase 5: добавить SchemaRow variant `kind="rest_slot"` (отличается от `kind="rest"` который inline-rest-marker между rows внутри work schema). Альтернатива: специальное Exercise "REST" с placeholder_flag. **Recommended**: SchemaRow.kind=`rest_slot` или EMOM-sub-schema body может быть пустым с `archetype_params.body_kind="rest"` flag. Phase 6 ratifies.
2. **EMOM composite header `EMOM 16 min | 4 rounds:`**: per Phase 2.1 case-composite-vs-nested-for-EMOM-with-rounds — composite-style header all the same nested (sub-min markers present). Model: `Schema.kind="nested"`, `archetype="emom-nested-per-minute"`, `archetype_params={ duration_min: 16, rounds: 4 }`. OK.
3. **`MAX DB FRONT SQUATS`**: MAX-notation bare sub-form. RepNotation.kind=`max`, sub_form=`bare`. Load — explicit `[ 2x 15 kg ]`. OK.

### Status: укладывается с одной model addition (rest_slot row kind). Otherwise clean fit.

---

## §5. block-008 — STRENGTH ENDURANCE (parallel-ladders + named-exercise-program Bulgarian)

### Raw body

```
schema-1:
  kind: headerless
  header: null
  body: |
    18-14-10:
    DB power snatches [ 2x 15 kg ]
    9-7-5:
    strict HSPU

schema-2:
  kind: named
  header: "Bulgarian split squats:"
  body: |
    3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]
    [ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ]
    - REST IN BETWEEN SETS UNTIL RECOVERY -
```

### Model fitment

```
Block (order=M, labels=["STRENGTH ENDURANCE"])
  ├─ Schema (
  │     order=1,
  │     kind="headerless",
  │     archetype="parallel-ladders-descending",
  │     header=null,
  │     archetype_params={
  │       ladders: [
  │         { steps: [18, 14, 10], paired_with_inner_row_ref: row-2 },
  │         { steps: [9, 7, 5],    paired_with_inner_row_ref: row-4 }
  │       ]
  │     },
  │     body=[
  │       InnerLadderMarkerRow(steps=[18,14,10]),
  │       ExerciseRow(exercise=Exercise("DB power snatches"), reps=implicit, load=Absolute{Weight.dual(value_kg=15)}),
  │       InnerLadderMarkerRow(steps=[9,7,5]),
  │       ExerciseRow(exercise=Exercise("strict HSPU"), reps=implicit, load=Bodyweight)
  │     ]
  │  )
  └─ Schema (
        order=2,
        kind="named",
        archetype="named-exercise-program",
        header="Bulgarian split squats:",                              // Q11 Phase 7.1: display override (bare display); fallback would be "DB Bulgarian split squats:"
        archetype_params={
          exercise_id: Exercise("DB Bulgarian split squats").id,       // Q11 Phase 7.1: any Exercise valid FK target; concrete sibling из 149 canonical-list
          program: StagedProgram(   // Phase 7 rename ex-DropSetProgram (Q19); drop-set via program_kind
            program_kind="drop_set",
            sets_count=3,
            stages=[
              { reps: 5, load: Absolute{Weight.compound_device(equipment="DB", count=2, value_kg=15)} },
              { reps: 5, load: Absolute{Weight.compound_device(equipment="DB", count=1, value_kg=15)} },
              { reps: 5, load: Negative{kind="without_weight"}, indicator: "explode", label: "EXPLODE" }
            ],
            stage_count_per_set=3,
            separator_form="...then...",
            media_per_stage={
              stage_3: MediaReference(url="https://www.youtube.com/watch?v=7kQHaxvZgIc", label="EXPLODE", applies_to="drop_stage")
            }
          )
        },
        body=[
          InlineRestRow(text="REST IN BETWEEN SETS UNTIL RECOVERY", scope="between_sets", qualifier="until_recovery")
        ]
     )
```

### Gaps / observations

1. **StagedProgram VO** (Phase 7 rename ex-DropSetProgram, Q19; `program_kind="drop_set"`): целиком encapsulates 3-stage drop-set; embedded в `archetype_params.program`. OK per §2.10 domain-model.
2. **`[ EXPLODE: URL ]` media-per-stage**: MediaReference attached к финальной stage через `media_per_stage` map (stage_index → MediaReference). Sample: 1 URL для EXPLODE stage. Model-ready.
3. **`exercise_id` FK + Schema.header override (Q11 Phase 7.1)**: archetype-named-exercise-program — `archetype_params.exercise_id` хранит FK на **любой** Exercise (concrete sibling из 149 canonical-list, no abstract entries). `Schema.header` (entity field) — optional display override. Algorithm: `displayHeader = schema.header ?? (exercise.canonicalName + ":")` (см. `06-formalization/implementation-notes.md` §3.13). Block-008: header `"Bulgarian split squats:"` (bare display) + exercise_id → `DB Bulgarian split squats`. Per-stage Load (StagedProgram.stages) overrides intrinsic equipment exercise'а.
4. **InlineRestRow `REST IN BETWEEN SETS UNTIL RECOVERY`**: scope=`between_sets`, qualifier=`until_recovery`. OK.

### Status: укладывается. StagedProgram VO (Phase 7 rename ex-DropSetProgram) покрывает 3-stage embedded program elegantly через `program_kind="drop_set"`.

---

## §6. block-145 — CHIPPER (flat-list-headerless singleton)

### Raw body

```
schema-1:
  kind: headerless
  header: null
  body: |
    10 strict HSPU
    25 DB deadlifts [ 2x 15 kg ]
    50 DB squats [ 2x 15 kg ]
    25 DB hang power cleans [ 2x 15 kg ]
    50 DB lunges [ 2x 15 kg ]
    25 DB deadlifts [ 2x 15 kg ]
    10 strict HSPU
```

### Model fitment

```
Block (order=M, labels=["CHIPPER"])
  └─ Schema (
        order=1,
        kind="headerless",
        archetype="flat-list-headerless",
        header=null,
        archetype_params={},
        body=[
          ExerciseRow(exercise=Exercise("strict HSPU"), reps=count(10), load=Bodyweight),
          ExerciseRow(exercise=Exercise("DB deadlifts"), reps=count(25), load=Absolute{Weight.dual(value_kg=15)}),
          ExerciseRow(exercise=Exercise("DB squats"), reps=count(50), load=Absolute{Weight.dual(value_kg=15)}),
          ExerciseRow(exercise=Exercise("DB hang power cleans"), reps=count(25), load=Absolute{Weight.dual(value_kg=15)}),
          ExerciseRow(exercise=Exercise("DB lunges"), reps=count(50), load=Absolute{Weight.dual(value_kg=15)}),
          ExerciseRow(exercise=Exercise("DB deadlifts"), reps=count(25), load=Absolute{Weight.dual(value_kg=15)}),
          ExerciseRow(exercise=Exercise("strict HSPU"), reps=count(10), load=Bodyweight)
        ]
     )
```

### Gaps / observations

1. **CHIPPER label**: single block-label, singleton в sample (1 occurrence). Library.label `CHIPPER` с applicable_levels=[block]. OK.
2. **Sym repetition**: первая и последняя rows одинаковы (10 strict HSPU). Это chipper-pattern semantics (down-and-back), не duplicate. Model: 2 independent ExerciseRows. OK.
3. **archetype_params={}**: пустой — flat-list-headerless не имеет structural parameters beyond order. OK.

### Status: укладывается trivially. Singleton archetype полностью покрыт.

---

## §7. block-006 — STRENGTH ENDURANCE (then-connector multi-schema, 4 schemas)

### Raw body

```
schema-1:
  kind: headerless
  body: |
    150 jumping Jacks [ ONLY ONCE before METCON ]
    ...then...:
schema-2:
  kind: atomic
  header: "15-12-9:"
  body: |
    DB bench presses [ 2x 15 kg ]
    DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
    - rest until recovery -
schema-3:
  kind: headerless
  body: |
    150 jumping Jacks [ ONLY ONCE before METCON ]
    ...then...:
schema-4:
  kind: atomic
  header: "15-12-9:"
  body: |
    incline DB bench presses [ 2x 15 kg ]
    DB single arm row [ WITHOUT BENCH ] [ https://www.youtube.com/watch?v=_LJQDmOcTbE ] [ each arm ]
```

### Model fitment

```
Block (order=M, labels=["STRENGTH ENDURANCE"])
  ├─ Schema (
  │     order=1,
  │     kind="headerless",
  │     archetype="single-line-with-then-connector",
  │     header=null,
  │     body=[
  │       ExerciseRow(
  │         exercise=Exercise("jumping Jacks"),
  │         reps=count(150),
  │         load=Bodyweight,
  │         sequence=SequenceIndicator(kind="only_once_before", target_label="METCON")
  │       ),
  │       ConnectorRow(form="...then...:")
  │     ]
  │  )
  ├─ Schema (
  │     order=2,
  │     kind="atomic",
  │     archetype="ladder-descending",
  │     header="15-12-9:",
  │     archetype_params={ steps: [15, 12, 9] },
  │     body=[
  │       ExerciseRow(exercise=Exercise("DB bench presses"), reps=implicit, load=Absolute{Weight.dual(value_kg=15)}),
  │       ExerciseRow(
  │         exercise=Exercise("DB single arm row"),
  │         reps=implicit,
  │         load=null, // use Exercise.default_load (DB) или Unspecified
  │         side=PerLimbDistribution(distribution_kind="each_arm"),
  │         media=MediaReference(url="https://www.youtube.com/watch?v=xl1YiqQY2vA", position="inline", applies_to="current_row")
  │       ),
  │       InlineRestRow(text="rest until recovery", scope="between_sets", qualifier="until_recovery")
  │     ]
  │  )
  ├─ Schema (
  │     order=3,
  │     kind="headerless",
  │     archetype="single-line-with-then-connector",
  │     header=null,
  │     body=[
  │       ExerciseRow(
  │         exercise=Exercise("jumping Jacks"),
  │         reps=count(150),
  │         load=Bodyweight,
  │         sequence=SequenceIndicator(kind="only_once_before", target_label="METCON")
  │       ),
  │       ConnectorRow(form="...then...:")
  │     ]
  │  )
  └─ Schema (
        order=4,
        kind="atomic",
        archetype="ladder-descending",
        header="15-12-9:",
        archetype_params={ steps: [15, 12, 9] },
        body=[
          ExerciseRow(exercise=Exercise("incline DB bench presses"), reps=implicit, load=Absolute{Weight.dual(value_kg=15)}),
          ExerciseRow(
            exercise=Exercise("DB single arm row"),
            reps=implicit,
            load=null,
            position="without_bench",
            side=PerLimbDistribution(distribution_kind="each_arm"),
            media=MediaReference(url="https://www.youtube.com/watch?v=_LJQDmOcTbE", position="inline", applies_to="current_row")
          )
        ]
     )
```

### Gaps / observations

1. **`[ ONLY ONCE before METCON ]` sequence indicator**: per Phase 3.1 §6.6 — SequenceIndicator.kind=`only_once_before`. METCON — label-target reference (но METCON не label в sample inventory — это inferred reference на upcoming работу). Phase 5: target_label как free-string ("METCON" в данном случае). Phase 6 решает, делать ли это reference на Label entity (с pre-condition: target label exists в catalog).
2. **`...then...:` connector trailing**: ConnectorRow в body предыдущей schema (per Phase 2.1 case-then-connector). OK.
3. **`DB single arm row` без inline weight**: weighted-implicit case (Phase 3.3 §2). Resolution chain: row.load (none) → Exercise.default_load (per Phase 3.2, soft default 2x15kg может быть на canonical exercise) → Unspecified. Phase 5 model: оставить `load=null` (or Unspecified), UI prompts coach либо resolves через default_load.
4. **Variant URLs**: row-2 / row-6 имеют разные URLs для regular vs `[ WITHOUT BENCH ]` variant. MediaReference per-occurrence intrinsic (не Exercise.default_demo_url) — variant-specific URL. OK per Phase 3.2 §URL-when-not-intrinsic.

### Status: укладывается. Multi-schema block + connector + variant-specific URLs покрыты.

---

## §8. block-047 — STRENGTH ENDURANCE | Gymnastics (composite multi-label)

### Raw body

```
schema-1:
  kind: headerless
  header: null
  body: |
    15 strict pull-ups
    traverses + 8 bar dips + traverses + 7 bar dips
    12 strict pull-ups
    traverses + 7 bar dips + traverses + 5 bar dips
    9 strict pull-ups
    traverses + 6 bar dips + traverses + 3 bar dips
```

### Composite-label decomposition (Phase 4 Rule 1-3)

Input: `STRENGTH ENDURANCE | Gymnastics`

- Rule 1 (bracket extraction): no `[ ]` — skip.
- Rule 2 (schema-header extraction): no schema-header pattern (`N sets`, `N rounds`) — skip.
- Rule 3 (`|` split): `[STRENGTH ENDURANCE, Gymnastics]`.

Result: `Block.labels = [Label("STRENGTH ENDURANCE"), Label("Gymnastics")]`. `intensity = null`. `schema_header_prefix = null`.

### Model fitment

```
Block (
  order=M,
  labels=[Label("STRENGTH ENDURANCE"), Label("Gymnastics")], // multi-label, ordered
  intensity=null,
  time_cap=null,
  notes=null,
  schemas=[...]
)
  └─ Schema (
        order=1,
        kind="headerless",
        archetype="pull-ups-dips-cycle",
        header=null,
        archetype_params={},
        body=[
          ExerciseRow(exercise=Exercise("strict pull-ups"), reps=count(15), load=Bodyweight),
          ExerciseRow(
            exercise=CyclicalCompound(
              primary_element=Exercise("traverses"),
              secondary_element=Exercise("bar dips"),
              cycles=[
                { primary_reps: implicit, secondary_reps: 8 },
                { primary_reps: implicit, secondary_reps: 7 }
              ]
            ),
            reps=null, // reps captured внутри CyclicalCompound.cycles
            load=Bodyweight
          ),
          ExerciseRow(exercise=Exercise("strict pull-ups"), reps=count(12), load=Bodyweight),
          ExerciseRow(
            exercise=CyclicalCompound(
              primary_element=Exercise("traverses"),
              secondary_element=Exercise("bar dips"),
              cycles=[
                { primary_reps: implicit, secondary_reps: 7 },
                { primary_reps: implicit, secondary_reps: 5 }
              ]
            ),
            reps=null,
            load=Bodyweight
          ),
          ExerciseRow(exercise=Exercise("strict pull-ups"), reps=count(9), load=Bodyweight),
          ExerciseRow(
            exercise=CyclicalCompound(
              primary_element=Exercise("traverses"),
              secondary_element=Exercise("bar dips"),
              cycles=[
                { primary_reps: implicit, secondary_reps: 6 },
                { primary_reps: implicit, secondary_reps: 3 }
              ]
            ),
            reps=null,
            load=Bodyweight
          )
        ]
     )
```

### Gaps / observations

1. **Composite-label decomposition Rule 3 applied**: `STRENGTH ENDURANCE | Gymnastics` → 2 separate Label refs in ordered list. ✓.
2. **CyclicalCompound VO**: row `traverses + 8 bar dips + traverses + 7 bar dips` — 2-cycle compound. Each cycle: traverses (implicit reps) + bar dips (variable secondary reps). Model OK per §2.15 domain-model.
3. **Multi-label set semantics**: 2 distinct labels на Block.labels[] — no duplicates. Ordered: `[STRENGTH ENDURANCE, Gymnastics]` matches textual order from inventory string. ✓.
4. **`traverses` Exercise**: bodyweight, primary_equipment=`parallel_bars`. `bar dips`: bodyweight, primary_equipment=`parallel_bars`. Both Load=Bodyweight. ✓.

### Status: укладывается. Composite multi-label decomposed корректно через Phase 4 Rule 3. CyclicalCompound VO покрывает repeated pattern.

---

## §9. Bonus: block-055 — STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]

### Raw body

```
schema-1:
  kind: headerless
  header: null
  body: |
    30 hang power clean & push press [ 2x 15 kg ]
    30 KB swings [ 24 kg ]
    30 strict HSPU
    30 KB SDHP [ 24 kg ]
    30 DB thrusters [ 2x 15 kg ]
```

### Composite-label decomposition (Phase 4 Rule 1-3 + Phase 5 correction)

Input: `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]`

- Rule 1 (bracket): extract `[ 70% EFFORT ]` → `intensity.effort_percent = { value: 70 }`. Remaining: `STRENGTH ENDURANCE | EASY PACE`.
- **Phase 5 correction for pace** (workflow brief override hierarchy.md): `EASY PACE` extracted из labels → `intensity.pace = "easy"`. Remaining: `STRENGTH ENDURANCE`.
- Rule 2 (schema-header): no `N sets`/`N rounds` — skip.
- Rule 3 (`|` split): remaining `[STRENGTH ENDURANCE]` — single label after extractions.

Result: `Block.labels = [Label("STRENGTH ENDURANCE")]`, `intensity = Intensity{ effort_percent: { value: 70 }, pace: "easy" }`, `schema_header_prefix = null`.

### Model fitment

```
Block (
  order=M,
  labels=[Label("STRENGTH ENDURANCE")],
  intensity=Intensity{ effort_percent: { value: 70 }, pace: "easy", rpe: null }, // partial overlay-friendly struct
  time_cap=null,
  schemas=[
    Schema(
      order=1,
      kind="headerless",
      archetype="flat-list-headerless",
      header=null,
      archetype_params={},
      intensity=null, // inherits block.intensity through partial overlay
      body=[
        ExerciseRow(
          exercise=Exercise("hang power clean & push press"), // composite_named, atomic per Phase 3.2 Option (c)
          reps=count(30),
          load=Absolute{Weight.dual(value_kg=15)}
        ),
        ExerciseRow(
          exercise=Exercise("KB swings"),
          reps=count(30),
          load=Absolute{Weight.single(value_kg=24)}
        ),
        ExerciseRow(
          exercise=Exercise("strict HSPU"),
          reps=count(30),
          load=Bodyweight
        ),
        ExerciseRow(
          exercise=Exercise("KB SDHP"), // sumo deadlift high pull
          reps=count(30),
          load=Absolute{Weight.single(value_kg=24)}
        ),
        ExerciseRow(
          exercise=Exercise("DB thrusters"),
          reps=count(30),
          load=Absolute{Weight.dual(value_kg=15)}
        )
      ]
    )
  ]
)
```

### Effective intensity per row (partial overlay)

| Row                           | row.intensity | schema.intensity | block.intensity          | effective                |
| ----------------------------- | ------------- | ---------------- | ------------------------ | ------------------------ |
| hang power clean & push press | null          | null             | { effort=70, pace=easy } | { effort=70, pace=easy } |
| KB swings                     | null          | null             | inherited                | { effort=70, pace=easy } |
| strict HSPU                   | null          | null             | inherited                | { effort=70, pace=easy } |
| KB SDHP                       | null          | null             | inherited                | { effort=70, pace=easy } |
| DB thrusters                  | null          | null             | inherited                | { effort=70, pace=easy } |

### Gaps / observations

1. **Phase 5 pace=intensity correction applied**: `EASY PACE` теперь не label, а Intensity.pace field. Phase 4 hierarchy.md ratified pace=label; Phase 5 (per workflow brief) переопределил: pace = Intensity field. **Эскалация**: см. edge-cases for tracking.
2. **Partial overlay inheritance**: все rows получают effective intensity через inheritance, не нужно дублировать на rows. ✓.
3. **`hang power clean & push press`** composite_named — atomic Exercise per Phase 3.2 Option (c). Despite `&` connector. ✓.
4. **`KB SDHP`** — Phase 3.2 canonical-list содержит это как atomic Exercise (sumo deadlift high pull). primary_equipment=kettlebell. ✓.

### Status: укладывается. Intensity partial overlay полностью работает. Phase 5 pace correction applied и trackable.

---

## §10. Coverage summary

| #         | Block     | Archetype highlight                                          | Sample-singleton?                  | Fits model? | Gaps / Notes                                                                                                   |
| --------- | --------- | ------------------------------------------------------------ | ---------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| 1         | block-037 | parallel-ladders-descending (canonical) + EXAMPLE annotation | no (15 occurrences)                | yes         | 2 minor: alternating annotation in PerLimbDistribution; EXAMPLE row needs Schema.notes field                   |
| 2         | block-003 | time-window-outer                                            | yes (block-level singleton)        | yes         | dual-value resolver deferred — model-ready                                                                     |
| 3         | block-009 | alternating-sets                                             | yes (block-level singleton)        | yes         | paired_with_schema_ref persistence — Phase 6                                                                   |
| 4         | block-080 | emom-nested-per-minute + REST sub-schema body                | no (6 wrappers)                    | yes         | rest_slot row kind addition needed                                                                             |
| 5         | block-008 | parallel-ladders + named-exercise-program (Bulgarian)        | no (named-program: 9 occurrences)  | yes         | StagedProgram VO embeds program (Phase 7 rename ex-DropSetProgram); exercise_name → maybe Exercise ref Phase 6 |
| 6         | block-145 | flat-list-headerless + CHIPPER label singleton               | yes (CHIPPER label singleton, 1)   | yes         | trivial fit                                                                                                    |
| 7         | block-006 | single-line-with-then-connector × 2 + ladder-descending × 2  | no (then-connector 11)             | yes         | SequenceIndicator.target_label="METCON" — Phase 6 may upgrade to label ref                                     |
| 8         | block-047 | pull-ups-dips-cycle + composite multi-label                  | no (multi-label 12)                | yes         | composite-label decomposition Rule 3 corrected; CyclicalCompound VO clean fit                                  |
| 9 (bonus) | block-055 | flat-list-headerless + composite label + block-intensity     | yes (intensity-on-label singleton) | yes         | Phase 5 pace=intensity correction; partial overlay works                                                       |

**Total: 9/8+ sessions stress-tested. All fit с маленькими minor gaps** (model extensions, not breakages):

- **Schema.notes field** — для EXAMPLE-style explanatory annotations (block-037).
- **`rest_slot` row kind** или специальный handling для REST body в EMOM sub-schemas (block-080).
- **`alternating` variant** в PerLimbDistribution (block-037 `[ alternative ]`).
- **`paired_with_schema_ref`** — bidirectional FK для alternating-sets archetype (block-009).
- **`exercise_name → Exercise FK`** в named-exercise-program archetype (block-008) — Phase 6 decision.
- **SequenceIndicator.target_label** — string vs Label ref (block-006 METCON).
- **Phase 5 pace=intensity correction** (block-055) — eschalation tracked.

### Critical-path gaps: none. All blocks укладываются. Model extensions identified являются minor refinements, не structural rebuild.

---

## §11. Acceptance per workflow brief

- [x] 7+ sessions stress-tested → 9 sessions (8 ratified + 1 bonus block-055).
- [x] Singletons covered: time-window-outer (block-003), alternating-sets (block-009), CHIPPER (block-145).
- [x] Canonical archetypes covered: parallel-ladders-descending (block-037), parallel-ladders + named-program (block-008), emom-nested-per-minute (block-080), flat-list-headerless (block-145), single-line-with-then-connector + ladder-descending multi-schema (block-006), pull-ups-dips-cycle + composite multi-label (block-047).
- [x] Composite multi-label decomposition verified (block-047, block-055 bonus).
- [x] Intensity inheritance partial overlay verified (block-055).
- [x] Compound `+` decomposition verified (block-047 CyclicalCompound, block-006 + others).
- [x] Drop-set program VO verified (block-008 Bulgarian split squats).
- [x] Per-row resolution chain (load fallback, intensity inheritance, MediaReference variant URLs) verified.
- [x] Gaps catalogued + addressable as small model extensions, not structural rebuild.

**Phase 5 stress test: PASS. Ready for Phase 6 (Prisma + TS formalization).**
