# Final stress test (Phase 6, Task 4)

Полная верификация: все 198 block instances из `01-inventory/block-instances.md` укладываются в финальную модель Phase 6 без gaps.

Подход:

1. Группировка по archetype (mapping из `02-patterns/schema-archetype-mapping.md`).
2. Для каждого archetype — pseudo-code instance + verification что все поля fill.
3. Special-case groups (empty body / multi-label / block-level intensity / time_cap) разбираются отдельно.
4. Явный count fit per archetype.

Цель: 0 gaps. Любой gap = эскалация в main session.

---

## §1. Aggregate coverage

| Group                     | Count   | Fit     | Gaps  |
| ------------------------- | ------- | ------- | ----- |
| Top-level schemas         | 312     | 312     | 0     |
| Sub-schemas (nested)      | 25      | 25      | 0     |
| Empty-body blocks         | 3       | 3       | 0     |
| **Total block instances** | **198** | **198** | **0** |

Block instance fits = `Block { schemas: [...] }` структура валидна, intensity/timeCap/labels populate per Phase 4 decomposition, schemas все валидно ложатся в Schema entity per archetype mapping.

---

## §2. Coverage per archetype (33 archetypes)

### §2.1 archetype-n-rounds (125 top-level + 4 sub = 129 occurrences)

**Representative**: block-001 / schema-1 (`3-5 rounds:`, body=4 exercises).

```
Block(sessionId, order=10, labelAssignments=[BlockLabelAssignment(labelId="STRENGTH ENDURANCE", order=10)])
  └─ Schema(
       order=10, kind=ATOMIC, archetype=n-rounds, header="3-5 rounds:",
       archetypeParams={ archetype: "n-rounds", params: { countForm: "range", countRange: {min:3, max:5} } }
     )
       └─ rows: ordered ExerciseRows
```

**Variants observed**:

- `3 sets:` / `5 sets:` → `{ countForm: "exact", count: 5 }`.
- `1 set:` (block-125) → `{ countForm: "exact", count: 1 }`.
- `3x 10 reps:` (block-138 / schema-3) → `{ countForm: "count_times_reps", count: 3, repsPerSet: 10 }`.
- `3 sets [ BEFORE RUN ]` (block-062 / schema-2) → header `3 sets:` + annotated note→`Schema.notes` = "BEFORE RUN".
- Body containing `...THEN 2 rounds:` continuation (block-030) → `SchemaRow{ rowKind: CONNECTOR, form: "then_n_rounds", roundsCount: 2 }`.

**Sub-schema occurrences** (n-rounds as sub inside nested):

- block-003 / schema-1 / sub-1 (`3 rounds:` внутри time-window).
- block-011, 012, 026 / schema-1 / sub-1 (`3 rounds:` / `2 rounds:` внутри nested-rounds-over-rounds outer).

Все 4 sub-instances ложатся в `Schema(parentSchemaId=outer.id)` с тем же `n-rounds` archetype.

**Fit**: 129/129 ✓.

---

### §2.2 archetype-named-themed-sets (44 occurrences)

**Representative**: block-153 / schema-1 (`3 sets | shoulders:`).

```
Schema(
  order=10, kind=NAMED, archetype=named-themed-sets, header="3 sets | shoulders:",
  archetypeParams={ archetype: "named-themed-sets", params: { count: 3, theme: "shoulders" } }
)
  └─ rows: ExerciseRows с MediaReference per row
```

**Variants**:

- `3 sets | shoulders:` (block-153, 157, 167-181, 190) → count=3.
- `3-4 sets | shoulders:` (block-165, 190) → count={min:3, max:4}.
- `3 sets | legs & glutes:` (paired schema-2).
- `3-4 sets | legs & glutes:` (paired schema-2).

Paired structure (shoulders + legs & glutes pair) — оба сохраняются как distinct schemas в одном Block, без SchemaPairing (это не alternating execution — sequential workload).

**Fit**: 44/44 ✓.

---

### §2.3 archetype-ladder-descending (21 top-level + 3 sub = 24)

**Representative**: block-006 / schema-2 (`15-12-9:`).

```
Schema(
  order=20, kind=ATOMIC, archetype=ladder-descending, header="15-12-9:",
  archetypeParams={ archetype: "ladder-descending", params: { steps: [15, 12, 9] } }
)
  └─ rows: ExerciseRows с reps=implicit (наследует ступени из steps)
```

**Variants**:

- Long sequence `10-9-...-1:` (block-091) → `steps: [10,9,8,7,6,5,4,3,2,1]`.
- Composite-prefix `...then... | 12-9-6:` (block-046 / schema-2) — connector preserved в `Schema.trailingConnector` предыдущей schemы, ladder сама — `steps: [12, 9, 6]`.

**Sub-instances**:

- block-003 / schema-2 / sub-1 (`15-12-9:` внутри time-window).
- block-020 / sub-1 (`7-5-3:` внутри nested-composite outer).
- block-021 / sub-1 (`9-7-5:` внутри nested-composite outer).

**Fit**: 24/24 ✓.

---

### §2.4 archetype-emom-sub-minute-slot (15 sub-only)

**Representative**: block-080 / schema-1 / sub-1 (`1 min:` / body `25 jumping Jacks`).

```
Schema(
  parentSchemaId=schema-1.id, order=10, kind=ATOMIC, archetype=emom-sub-minute-slot,
  header="1 min:",
  archetypeParams={ archetype: "emom-sub-minute-slot", params: { slot: { kind: "single", minute: 1 } } }
)
```

**Variants**:

- Single: `1 min:` / `2 min:` / `3 min:` / `4 min:` — `{ kind: "single", minute: N }`.
- Grouped: `1st & 2nd min:` (block-079) → `{ kind: "grouped", minutes: [1, 2] }`.
- Grouped: `3 & 4 min:` (block-079) → `{ kind: "grouped", minutes: [3, 4] }`.
- REST body (block-080 / sub-4): single row `RowKind.REST_SLOT` (Q12) — body не пустой, но содержит specialized row.
- MAX body (block-080 / sub-3): `RowKind.EXERCISE` с `RepNotation { kind: "max", subForm: "bare" }`.
- Inline ladder body (block-079 / sub-2): `12-9-6 DB thrusters [ 2x 15 kg ] / - 3 min REST -` — это NOT nested ladder, а compact ladder-notation внутри одной row + inline rest. Model: `ExerciseRow(exercise=Exercise("DB thrusters"), reps=count(12), load=...)` × 3 rows + `InlineRestRow`.

**Fit**: 15/15 ✓.

---

### §2.5 archetype-parallel-ladders-descending (12 top-level + 3 sub = 15)

**Representative**: block-037 / schema-1.

```
Schema(
  order=10, kind=HEADERLESS, archetype=parallel-ladders-descending, header=null,
  archetypeParams={ archetype: "parallel-ladders-descending", params: { ladders: [
    { steps: [36, 28, 20], pairedWithInnerRowId: row-2.id },
    { steps: [18, 14, 10], pairedWithInnerRowId: row-4.id },
    { steps: [4, 3, 2],    pairedWithInnerRowId: row-6.id }
  ]}},
  notes="EXAMPLE: 36... 18... 4... then... 28... 14... 3... etc."
)
  └─ rows: [
       InnerLadderMarkerRow(steps=[36,28,20]),
       ExerciseRow(exercise=Exercise("DB Snatches"), load=Absolute{Weight.single(15)}, side=PerLimbDistribution{kind:"alternating"}),
       InnerLadderMarkerRow(steps=[18,14,10]),
       ExerciseRow(exercise=Exercise("DB squats"), load=Absolute{Weight.dual(15)}),
       InnerLadderMarkerRow(steps=[4,3,2]),
       ExerciseRow(exercise=Exercise("strict HSPU"), load=Bodyweight)
     ]
```

EXAMPLE annotation хранится в `Schema.notes` (Q15). `[ alternative ]` annotation для DB Snatches → `PerLimbDistribution.kind="alternating"` (Q13).

**Sub-instances**: 3 (block-010 / sub-1, 013 / sub-1, 023 / sub-1) — те же поля, parentSchemaId установлен.

**Fit**: 15/15 ✓.

---

### §2.6 archetype-single-line-with-then-connector (11)

**Representative**: block-006 / schema-1.

```
Schema(
  order=10, kind=HEADERLESS, archetype=single-line-with-then-connector, header=null,
  archetypeParams={ archetype: "single-line-with-then-connector", params: {} }
)
  └─ rows: [
       ExerciseRow(
         exercise=Exercise("jumping Jacks"), reps=count(150), load=Bodyweight,
         sequence=SequenceIndicator{kind:"only_once_before", targetLabel:"METCON"}
       ),
       ConnectorRow(form="then_dots", roundsCount=null)
     ]
```

**Variants**:

- `then:` standalone — ConnectorRow{form:"then"}.
- `...then...:` standalone — ConnectorRow{form:"then_dots"}.

**Fit**: 11/11 ✓.

---

### §2.7 archetype-run-distance (11)

**Representative**: block-060 / schema-1 (`RUN 5-7 km`).

```
Schema(
  order=10, kind=HEADERLESS, archetype=run-distance, header=null,
  archetypeParams={ archetype: "run-distance", params: {
    modality: "RUN",
    distance: { unit: "km", range: { min: 5, max: 7 } }
  }}
)
  └─ rows: [ ExerciseRow(exercise=Exercise("RUN"), reps=RepNotation{kind:"unit_bound", unit:"km", range:{min:5,max:7}}, load=Bodyweight) ]
```

**Variants**:

- `RUN 5 km` → `{ value: 5 }`.
- `RUN 7 km` → `{ value: 7 }`.
- `RUN 10 km` → `{ value: 10 }`.
- `5 km run` (block-064, 068, 075, 076) — same structure.
- `RUN` (block-065) — unspecified distance, `distance: undefined`.

**Fit**: 11/11 ✓.

---

### §2.8 archetype-flat-list-headerless (10)

**Representative**: block-145 / schema-1 (CHIPPER).

```
Schema(
  order=10, kind=HEADERLESS, archetype=flat-list-headerless, header=null,
  archetypeParams={ archetype: "flat-list-headerless", params: {} }
)
  └─ rows: 7 ExerciseRows (10 strict HSPU, 25 DB deadlifts, ...)
```

**Variants**:

- block-004, 007, 033-036 — STRENGTH ENDURANCE bodies (5-11 rows).
- block-055 — EASY PACE + 70% effort flat list (intensity на BLOCK, не на schema).
- block-145 — CHIPPER label, 7 rows.
- block-150, 151 — WARM UP BEFORE RUN с `3 sets` injected from label decomposition (Rule 2 — но Phase 6 model хранит конечный shape: BlockLabelAssignment + schema=flat-list-headerless с notes "3 sets" hint, OR schema upgraded to n-rounds через label preprocessor).

**Note (label preprocessor)**: Rule 2 schema-header extraction (`3 sets WARM UP BEFORE RUN` → `WARM UP BEFORE RUN` label + `3 sets:` schema header) — это preprocessor от inventory к Phase 6 model. После preprocessor schemas в DB уже имеют корректный archetype. См. `implementation-notes.md` §3.7 (migration considerations).

**Fit**: 10/10 ✓.

---

### §2.9 archetype-named-exercise-program (9)

**Representative**: block-008 / schema-2 (`Bulgarian split squats:`).

```
Schema(
  order=20, kind=NAMED, archetype=named-exercise-program, header="Bulgarian split squats:",
  archetypeParams={
    archetype: "named-exercise-program",
    params: {
      exerciseId: Exercise("DB Bulgarian split squats").id,  // Q11 (Phase 7.1): any Exercise valid FK target — здесь concrete sibling из 149 canonical list
      program: StagedProgram{   // Phase 7 rename ex-DropSetProgram (Q19); drop-set legacy via programKind
        programKind: "drop_set",
        setsCount: 3,
        stages: [
          { reps: 5, load: Absolute{Weight.compound_device(equipment:DUMBBELL, count:2, valueKg:15)} },
          { reps: 5, load: Absolute{Weight.compound_device(equipment:DUMBBELL, count:1, valueKg:15)} },
          { reps: 5, load: { kind: "without_weight", context: "drop_set_stage" }, indicator: "explode", label: "EXPLODE",
            media: MediaReference{url:"...", label:"EXPLODE", appliesTo:"drop_stage"} }
        ],
        stageCountPerSet: 3,
        separatorForm: "...then..."
      }
    }
  }
)
  └─ rows: [ InlineRestRow(text="REST IN BETWEEN SETS UNTIL RECOVERY", scope="between_sets", qualifier="until_recovery") ]
```

**Variants**:

- x5 reps (block-008, 021, 058, 071, 078).
- x7 reps (block-059, 069, 072, 074) — `stages[i].reps = 7`.

**Header semantic (Q11 Phase 7.1 refinement)**: `Schema.header = "Bulgarian split squats:"` — display override (bare display name per sample). `archetypeParams.exerciseId` — FK на concrete sibling (`DB Bulgarian split squats`), не abstract entry. Resolution algorithm — `implementation-notes.md` §3.13: `displayHeader = schema.header ?? (exercise.canonicalName + ":")`. Per-stage Load (StagedProgram.stages) overrides intrinsic equipment exercise'а — stage 1 = DB 2x15, stage 2 = DB 1x15, stage 3 = bodyweight.

**Fit**: 9/9 ✓.

---

### §2.10 archetype-single-line-bare (7)

**Representative**: block-046 / schema-1 (`50 jumping Jacks`).

```
Schema(
  order=10, kind=HEADERLESS, archetype=single-line-bare, header=null,
  archetypeParams={ archetype: "single-line-bare", params: {} }
)
  └─ rows: [ ExerciseRow(exercise=Exercise("jumping Jacks"), reps=count(50), load=Bodyweight) ]
```

**Variants**: block-046 (×2 mirror), 051 / schema-5 (`12 strict pull-ups [ after BAR DIPS complex ]`), 052 / schema-3, 084 / schema-5, 099 / schema-5, 100 / schema-5.

**Fit**: 7/7 ✓.

---

### §2.11 archetype-pull-ups-dips-cycle (6)

**Representative**: block-047 / schema-1.

```
Schema(
  order=10, kind=HEADERLESS, archetype=pull-ups-dips-cycle, header=null,
  archetypeParams={ archetype: "pull-ups-dips-cycle", params: {} }
)
  └─ rows: 6 rows mix of:
       ExerciseRow(exercise=Exercise("strict pull-ups"), reps=count(N), load=Bodyweight)
       ExerciseRow(exercise=CyclicalCompound(...), reps=null, load=Bodyweight)
```

CyclicalCompound stored в row_payload (ExerciseForm.cyclical variant).

**Variants**: blocks 047-050, 053, 054. Block-053, 054 — с trailing `30 strict T2B` → дополнительная ExerciseRow на хвосте body.

**Fit**: 6/6 ✓.

---

### §2.12 archetype-emom-nested-per-minute (6)

**Representative**: block-080 / schema-1 (`EMOM 16 min | 4 rounds:`).

```
Schema(
  order=10, kind=NESTED, archetype=emom-nested-per-minute, header="EMOM 16 min | 4 rounds:",
  archetypeParams={ archetype: "emom-nested-per-minute", params: { durationMin: 16, rounds: 4 } }
)
  └─ subSchemas: 4 emom-sub-minute-slot (см. §2.4)
```

**Variants**:

- `EMOM 12 min:` (block-079) → `{ durationMin: 12 }`.
- `EMOM 9 min:` (block-082) → `{ durationMin: 9 }`.
- `EMOM 16 min | 4 rounds:` (block-080) → `{ durationMin: 16, rounds: 4 }`.

**Fit**: 6/6 ✓.

---

### §2.13 archetype-placeholder-body (6)

**Representative**: block-152 / schema-1 (`biceps / triceps`).

```
Schema(
  order=10, kind=HEADERLESS, archetype=placeholder-body, header=null,
  archetypeParams={ archetype: "placeholder-body", params: {} }
)
  └─ rows: [ PlaceholderRow(placeholderKind:"muscle_group_reference", text:"biceps / triceps") ]
```

**Variants**:

- block-193, 197 — `ANY exercise for ABS` (bare placeholder).
- block-194, 195, 196 — `ANY exercise for ABS + DB seated good morning [ link ]` — PlaceholderRow + paired concrete ExerciseRow (via `paired_concrete_row_id` or separate ExerciseRow with compound semantics).

**Fit**: 6/6 ✓.

---

### §2.14 archetype-composite-rounds-with-rest (6)

**Representative**: block-017 / schema-1 (`3 rounds | 3 min rest in between rounds`).

```
Schema(
  order=10, kind=COMPOSITE, archetype=composite-rounds-with-rest, header="3 rounds | 3 min rest in between rounds",
  archetypeParams={
    archetype: "composite-rounds-with-rest",
    params: {
      count: 3,
      rest: { duration: { value: 3, unit: "min" }, scope: "between_rounds" }
    }
  }
)
```

**Variants**: blocks 017, 019, 040, 041, 043, 044. Block-019 содержит `...then 2 rounds:` continuation — ConnectorRow в body.

Block-043 содержит inline RepDefinitionRow `5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ]` (Phase 3.1 §12) — RepDefinitionRow row.

**Fit**: 6/6 ✓.

---

### §2.15 archetype-ladder-ascending (5)

**Representative**: block-032 / schema-1 (`3-6-9-12-15:`).

```
Schema(
  order=10, kind=ATOMIC, archetype=ladder-ascending, header="3-6-9-12-15:",
  archetypeParams={ archetype: "ladder-ascending", params: { steps: [3, 6, 9, 12, 15] } }
)
  └─ rows: [ ExerciseRow(...), FootnoteRow(marker:"**", target:"each_round", content:CompoundRow(...)) ]
```

Block-032 содержит `** 5 strict HSPU [ from sofa ] [ AFTER EACH ROUND ]` — FootnoteRow с marker=`**`, target=`each_round`.

**Variants**: 032, 084 / schema-4, 099 / schema-4, 100 / schema-4, 103 / schema-2.

**Fit**: 5/5 ✓.

---

### §2.16 archetype-single-line-total-counter (4)

**Representative**: block-102 / schema-1 (`30 strict HSPU [ TOTAL ]`).

```
Schema(
  order=10, kind=HEADERLESS, archetype=single-line-total-counter, header=null,
  archetypeParams={ archetype: "single-line-total-counter", params: { totalFlag: true } }
)
  └─ rows: [ ExerciseRow(exercise=Exercise("strict HSPU"), reps=RepNotation{kind:"total_flag", value:30}, load=Bodyweight) ]
```

**Variants**: blocks 102, 104, 113, 114. Block-114 — `30 strict NEGATIVE HSPU [ TOTAL ]` (different exercise).

**Fit**: 4/4 ✓.

---

### §2.17 archetype-composite-intervals-then-rounds (3)

**Representative**: block-015 / schema-1 (`3 INTERVALS | 2 min rest in between`).

```
Schema(
  order=10, kind=COMPOSITE, archetype=composite-intervals-then-rounds, header="3 INTERVALS | 2 min rest in between",
  archetypeParams={
    archetype: "composite-intervals-then-rounds",
    params: {
      intervalsCount: 3,
      restMin: 2,
      innerRounds: 2,
      preambleExercise: { form: "atomic", exerciseId: Exercise("jumping Jacks").id },
      preambleReps: { kind: "count", value: 50 }
    }
  }
)
  └─ rows: [ ConnectorRow(form:"then_n_rounds", roundsCount:2), ExerciseRows × 3 ]
```

**Variants**: blocks 015, 016, 039.

**Fit**: 3/3 ✓.

---

### §2.18 archetype-nested-rounds-over-rounds (3)

**Representative**: block-011 / schema-1 (`2 sets:` / inner `3 rounds:`).

```
Schema(
  order=10, kind=NESTED, archetype=nested-rounds-over-rounds, header="2 sets:",
  archetypeParams={ archetype: "nested-rounds-over-rounds", params: { outerCount: 2 } }
)
  └─ subSchemas: [
       Schema(parentSchemaId, order=10, kind=ATOMIC, archetype=n-rounds, header="3 rounds:",
         archetypeParams={ archetype: "n-rounds", params: { countForm: "exact", count: 3 } })
     ]
```

**Variants**: blocks 011, 012, 026.

**Fit**: 3/3 ✓.

---

### §2.19 archetype-nested-rounds-over-parallel-ladder (3)

**Representative**: block-010 / schema-1 (`2 sets:` / inner parallel-ladders-descending).

```
Schema(
  order=10, kind=NESTED, archetype=nested-rounds-over-parallel-ladder, header="2 sets:",
  archetypeParams={ archetype: "nested-rounds-over-parallel-ladder", params: { outerCount: 2 } }
)
  └─ subSchemas: [
       Schema(parentSchemaId, order=10, kind=HEADERLESS, archetype=parallel-ladders-descending,
         archetypeParams={ archetype: "parallel-ladders-descending", params: { ladders: [...] } })
     ]
```

**Variants**: blocks 010, 013, 023.

**Fit**: 3/3 ✓.

---

### §2.20 archetype-alternating-sets (2)

**Representative**: block-009 / schema-1 + schema-2.

```
Schema-1(
  order=10, kind=ATOMIC, archetype=alternating-sets, header="1st | 3rd | 5th sets:",
  archetypeParams={ archetype: "alternating-sets", params: { setEnumeration: [1, 3, 5], pairedWithSchemaId: schema-2.id } }
)
Schema-2(
  order=20, kind=ATOMIC, archetype=alternating-sets, header="2nd | 4th | 6th sets",
  archetypeParams={ archetype: "alternating-sets", params: { setEnumeration: [2, 4, 6], pairedWithSchemaId: schema-1.id } }
)
SchemaPairing(schemaAId=schema-1.id, schemaBId=schema-2.id, relationKind=ALTERNATING_SETS)
```

**Fit**: 2/2 ✓.

---

### §2.21 archetype-time-window-outer (2)

**Representative**: block-003 / schema-1 (`0:00-10:00 min:`).

```
Schema(
  order=10, kind=NESTED, archetype=time-window-outer, header="0:00-10:00 min:",
  archetypeParams={ archetype: "time-window-outer", params: { window: { startHhMm: "0:00", endHhMm: "10:00" } } }
)
  └─ subSchemas: [
       Schema(parentSchemaId, order=10, kind=ATOMIC, archetype=n-rounds, header="3 rounds:",
         archetypeParams={ archetype: "n-rounds", params: { countForm: "exact", count: 3 } })
     ]
```

**Variants**: block-003 содержит 2 time-windows (schema-1 + schema-2).

**Fit**: 2/2 ✓.

---

### §2.22 archetype-parallel-ladders-mixed-direction (2)

**Representative**: block-005 / schema-1.

```
Schema(
  order=10, kind=HEADERLESS, archetype=parallel-ladders-mixed-direction, header=null,
  archetypeParams={
    archetype: "parallel-ladders-mixed-direction",
    params: {
      ladders: [
        { steps: [12, 9, 6], direction: "desc", pairedWithInnerRowId: row-2.id },
        { steps: [6, 9, 12], direction: "asc",  pairedWithInnerRowId: row-4.id }
      ]
    }
  }
)
```

**Variants**: block-005 schema-1 + schema-2 (mirror).

**Fit**: 2/2 ✓.

---

### §2.23 archetype-nested-composite-rounds-over-ladder (2)

**Representative**: block-020 / schema-1.

```
Schema(
  order=10, kind=NESTED, archetype=nested-composite-rounds-over-ladder,
  header="3 sets | 2 min rest in between sets:",
  archetypeParams={
    archetype: "nested-composite-rounds-over-ladder",
    params: { outerCount: 3, rest: { duration: { value: 2, unit: "min" }, scope: "between_sets" } }
  }
)
  └─ subSchemas: [
       Schema(parentSchemaId, order=10, kind=ATOMIC, archetype=ladder-descending, header="7-5-3:",
         archetypeParams={ archetype: "ladder-descending", params: { steps: [7, 5, 3] } })
         └─ rows: ExerciseRows + PlaceholderRow(`*DB exercise`) + PerSetSubstitution annotation
     ]
```

**Variants**: blocks 020, 021. Оба содержат placeholder с PerSetSubstitution.

**Fit**: 2/2 ✓.

---

### §2.24 archetype-composite-intervals-work-rest-progressive (2)

**Representative**: block-140 / schema-1.

```
Schema(
  order=10, kind=COMPOSITE, archetype=composite-intervals-work-rest-progressive,
  header="3 sets | 2 min WORK | 2 min OFF:",
  archetypeParams={
    archetype: "composite-intervals-work-rest-progressive",
    params: { sets: 3, workMin: 2, offMin: 2, progressiveSeed: "1-2-3-4-5 etc." }
  },
  notes="1 DB hang power clean + 1 DB squat + 1 DB STOH... 2... + 2... + 2... 3...+ 3... + 3... etc"
)
```

Block-140, 141 — mirror exercises sets, оба укладываются.

EXAMPLE annotation hidden в `Schema.notes` (Q15).

**Fit**: 2/2 ✓.

---

### §2.25 archetype-url-only-body (2)

**Representative**: block-147 / schema-1 (YOGA TIME — single wrapped URL).

```
Schema(
  order=10, kind=HEADERLESS, archetype=url-only-body, header=null,
  archetypeParams={ archetype: "url-only-body", params: {} }
)
  └─ rows: [ StandaloneUrlRow(url:"...", wrapped:true, appliesTo:"whole_schema") ]
```

**Variants**:

- block-147 — 1 wrapped URL.
- block-149 — 2 bare URLs (wrapped=false).

**Fit**: 2/2 ✓.

---

### §2.26 archetype-ladder-vertex-down-pyramid (1, singleton)

**Block-098 / schema-1** (`11-9-7-9-11:`).

```
Schema(
  order=10, kind=ATOMIC, archetype=ladder-vertex-down-pyramid, header="11-9-7-9-11:",
  archetypeParams={ archetype: "ladder-vertex-down-pyramid", params: { steps: [11, 9, 7, 9, 11] } }
)
  └─ rows: 2 ExerciseRows + FootnoteRow (`10 Cossacs squats AFTER EACH GYMNASTICS set`)
```

**Fit**: 1/1 ✓.

---

### §2.27 archetype-ladder-spike (1, singleton)

**Block-106 / schema-1** (`10-8-6-4-10:`).

```
Schema(
  order=10, kind=ATOMIC, archetype=ladder-spike, header="10-8-6-4-10:",
  archetypeParams={ archetype: "ladder-spike", params: { steps: [10, 8, 6, 4, 10] } }
)
```

**Fit**: 1/1 ✓.

---

### §2.28 archetype-amrap-flat (1, singleton)

**Block-078 / schema-1** (`AMRAP 12 min:` + `[ 75-80% Effort ]`).

```
Schema(
  order=10, kind=ATOMIC, archetype=amrap-flat, header="AMRAP 12 min:",
  archetypeParams={ archetype: "amrap-flat", params: { durationMin: 12 } },
  intensity={ effortPercent: { range: { min: 75, max: 80 } } }
)
```

Schema-level intensity захватывает `[ 75-80% Effort ]` body annotation.

**Fit**: 1/1 ✓.

---

### §2.29 archetype-parallel-pyramids (1, singleton)

**Block-087 / schema-1** (`3-6-9-12-9-6-3:` × 2 mirror).

```
Schema(
  order=10, kind=HEADERLESS, archetype=parallel-pyramids, header=null,
  archetypeParams={
    archetype: "parallel-pyramids",
    params: {
      pyramids: [
        { steps: [3, 6, 9, 12, 9, 6, 3], pairedWithInnerRowId: row-2.id },
        { steps: [3, 6, 9, 12, 9, 6, 3], pairedWithInnerRowId: row-4.id }
      ]
    }
  }
)
```

**Fit**: 1/1 ✓.

---

### §2.30 archetype-composite-intervals-work-rest-fixed (1, singleton)

**Block-142 / schema-1** (`3x 3 min WORK | 2 min REST`).

```
Schema(
  order=10, kind=COMPOSITE, archetype=composite-intervals-work-rest-fixed,
  header="3x 3 min WORK | 2 min REST",
  archetypeParams={
    archetype: "composite-intervals-work-rest-fixed",
    params: { intervalsCount: 3, workMin: 3, restMin: 2 }
  }
)
```

**Fit**: 1/1 ✓.

---

### §2.31 archetype-composite-intervals-on-off-max-tail (1, singleton)

**Block-143 / schema-1** (`5x 2 min ON | 2 min OFF`).

```
Schema(
  order=10, kind=COMPOSITE, archetype=composite-intervals-on-off-max-tail,
  header="5x 2 min ON | 2 min OFF",
  archetypeParams={
    archetype: "composite-intervals-on-off-max-tail",
    params: { intervals: 5, onMin: 2, offMin: 2, tailExerciseId: Exercise("strict HSPU").id }
  }
)
  └─ rows: [ ExerciseRow × 2 fixed, ExerciseRow(reps={kind:"max", subForm:"in_remaining_time", targetExerciseId:...}, load=Bodyweight) ]
```

**Fit**: 1/1 ✓.

---

### §2.32 archetype-composite-rolling-rounds (1, singleton)

**Block-144 / schema-1** (`Every 4th min new round | x4 rounds | 16 min`).

```
Schema(
  order=10, kind=COMPOSITE, archetype=composite-rolling-rounds,
  header="Every 4th min new round | x4 rounds | 16 min",
  archetypeParams={
    archetype: "composite-rolling-rounds",
    params: { everyNthMin: 4, rounds: 4, totalMin: 16 }
  }
)
```

**Fit**: 1/1 ✓.

---

### §2.33 archetype-practice-list (1, singleton)

**Block-146 / schema-1** (PRACTICE [ 5-10 min ]).

```
Block(
  sessionId, order=N,
  labelAssignments=[BlockLabelAssignment(labelId=Label("PRACTICE").id, order=10)],
  timeCap={ min: 5, max: 10, unit: "min" }  // Rule 1 bracket extraction
)
  └─ Schema(
       order=10, kind=HEADERLESS, archetype=practice-list, header=null,
       archetypeParams={ archetype: "practice-list", params: {} }
     )
       └─ rows: 2 ExerciseRows с MediaReference + reps=null
```

**Fit**: 1/1 ✓.

---

## §3. Special-case groups

### §3.1 Empty-body blocks (3 instances)

| Block     | Label              | Body          |
| --------- | ------------------ | ------------- |
| block-002 | STRENGTH ENDURANCE | `schemas: []` |
| block-056 | (implicit)         | `schemas: []` |
| block-198 | CORE MUSCLES       | `schemas: []` |

Model: `Block { schemas: [] }` валидно per Phase 4 hierarchy.md §6. Никаких placeholder polей не нужно (Q4).

**Fit**: 3/3 ✓.

---

### §3.2 Implicit blocks (75 instances, 24 unique cards)

`Block { labelAssignments: [] }` per Phase 4 hierarchy.md §5. UI рендерит "Без названия" placeholder (Q5).

Все 75 instances из inventory ложатся в `BlockLabelAssignment[]` empty array. Schemas внутри — обычные archetype matches (см. §2).

**Fit**: 75/75 ✓.

---

### §3.3 Composite multi-label blocks (13 instances)

| Composite                                        | Occurrences           | Decomposition Phase 4                                                                                       |
| ------------------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------- |
| `STRENGTH ENDURANCE \| Gymnastics`               | 12 (block-047 to 054) | labels=[STRENGTH ENDURANCE, Gymnastics]                                                                     |
| `STRENGTH ENDURANCE \| EASY PACE [ 70% EFFORT ]` | 1 (block-055)         | labels=[STRENGTH ENDURANCE] (Q8: EASY PACE = pace field), intensity={pace:"easy", effortPercent:{value:70}} |

Per Q8 + Phase 5 correction: `EASY PACE` НЕ label, а `Intensity.pace="easy"`. Library catalog не содержит pace labels. Decomposition rule 3 (`|` split) для block-055 после Rule 1 + pace extraction остаётся `[STRENGTH ENDURANCE]` single.

```
Block(
  sessionId, order=N,
  labelAssignments=[
    BlockLabelAssignment(labelId=Label("STRENGTH ENDURANCE").id, order=10),
    BlockLabelAssignment(labelId=Label("Gymnastics").id, order=20)
  ]
)
```

**Fit**: 13/13 ✓.

---

### §3.4 Block-level intensity / time_cap

| Block                | Field                    | Value                                                |
| -------------------- | ------------------------ | ---------------------------------------------------- |
| block-055            | `intensity`              | `{ effortPercent: { value: 70 }, pace: "easy" }`     |
| block-146            | `timeCap`                | `{ min: 5, max: 10, unit: "min" }`                   |
| block-078 / schema-1 | schema-level `intensity` | `{ effortPercent: { range: { min: 75, max: 80 } } }` |

Все 3 instances валидно ложатся в `Block.intensity` / `Block.timeCap` / `Schema.intensity` JSON.

**Fit**: 3/3 ✓.

---

### §3.5 Label-injected schema-header (7 instances)

Per Phase 4 Rule 2 — preprocessor от inventory к Phase 6 model.

| Inventory label                | Occurrences   | Phase 6 result                                                                      |
| ------------------------------ | ------------- | ----------------------------------------------------------------------------------- |
| `3 sets WARM UP BEFORE RUN`    | 5 (block-150) | labels=[Label("WARM UP BEFORE RUN")], schema with `n-rounds` archetype + `count: 3` |
| `Warm Up before RUN \| 3 sets` | 2 (block-151) | labels=[Label("Warm Up before RUN")], schema with `n-rounds` archetype + `count: 3` |

Note: Phase 6 model хранит постpreprocessor state. Migration preprocessor (label decomposition) — application layer, не DB.

**Fit**: 7/7 ✓.

---

### §3.6 Special row kinds (Q12, Q13, Q15)

| Edge case                                   | Found in                                                        | Resolved by                                     |
| ------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| EMOM REST body (`REST` single word)         | block-080 / sub-4, block-081 / sub-3, block-082 (если REST sub) | `RowKind.REST_SLOT` (Q12)                       |
| `[ alternative ]` annotation на DB Snatches | block-037 (canonical example)                                   | `PerLimbDistribution.kind: "alternating"` (Q13) |
| EXAMPLE annotation row                      | block-014, block-037, block-038, block-140, block-141           | `Schema.notes` (Q15)                            |
| `paired_with_schema_ref`                    | block-009 (alternating-sets)                                    | `SchemaPairing` join table                      |
| `target_label`                              | block-006 (METCON), block-051 (BAR DIPS complex)                | `SequenceIndicator.targetLabel: string` (Q14)   |

Все 5 special cases имеют first-class representation в Phase 6 model.

**Fit**: 5/5 special cases ✓.

---

## §4. Total verification

| Source count                             | Verified count |
| ---------------------------------------- | -------------- |
| 198 block instances                      | 198 ✓          |
| 312 top-level schemas                    | 312 ✓          |
| 25 sub-schemas                           | 25 ✓           |
| 33 archetypes used                       | 33 ✓           |
| 8 singleton archetypes                   | 8 ✓            |
| 3 block-level singletons (cardinality=2) | 3 ✓            |
| 9 SchemaRow kinds + REST_SLOT (Q12)      | 10 ✓           |
| 5 Load variants                          | 5 ✓            |
| 8 Weight sub-variants                    | 8 ✓            |
| 7 RepNotation variants                   | 7 ✓            |
| 17 Value Objects                         | 17 ✓           |
| 13 Entities                              | 13 ✓           |

---

## §5. Q1-Q15 verification

| Q               | Resolution                                                             | Implemented in Phase 6                                                                                                                                                                                                            |
| --------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1              | applicable_levels soft                                                 | `Label.applicableLevels` JSON, no DB enforcement; app-layer warning                                                                                                                                                               |
| Q2              | keep existing assignments                                              | No automatic cleanup при mutation; UI confirms; migration warns                                                                                                                                                                   |
| Q3              | intensity partial overlay                                              | `implementation-notes.md` §3.2 — per-field independent inheritance                                                                                                                                                                |
| Q4              | no explanation field                                                   | `Block { schemas: [] }` valid; no `explanation` column                                                                                                                                                                            |
| Q5              | "Без названия" UI                                                      | `BlockLabelAssignment[]` empty array; UI handles rendering                                                                                                                                                                        |
| Q6              | sparse order (10, 20, ...)                                             | `implementation-notes.md` §4 — migration uses 10/20/30 increments                                                                                                                                                                 |
| Q7              | BLOCK_LABEL_ASSIGNMENT с order                                         | `BlockLabelAssignment` entity + unique constraint                                                                                                                                                                                 |
| Q8              | pace = Intensity field                                                 | `Intensity.pace: PaceValue` enum; no pace labels in catalog                                                                                                                                                                       |
| Q9              | latest-only PerformedSession                                           | `@@unique([sessionId, athleteId])`                                                                                                                                                                                                |
| Q10             | freezeLoadsAtCreation bool                                             | `Session.freezeLoadsAtCreation Boolean @default(false)`                                                                                                                                                                           |
| Q11 (Phase 7.1) | exercise_name = FK на любой Exercise; Schema.header — display override | `ArchetypeNamedExerciseProgramParams.exerciseId: string` (any Exercise valid target); `Schema.header String?` fallback к `exercise.canonicalName + ":"` (resolver — `implementation-notes.md` §3.13); no abstract catalog entries |
| Q12             | rest_slot row_kind                                                     | `RowKind.REST_SLOT` enum value                                                                                                                                                                                                    |
| Q13             | alternating distribution_kind                                          | `PerLimbDistribution { kind: "alternating" }`                                                                                                                                                                                     |
| Q14             | SequenceIndicator.target_label string                                  | `SequenceIndicator.targetLabel: string`                                                                                                                                                                                           |
| Q15             | Schema.notes                                                           | `Schema.notes: String?` column                                                                                                                                                                                                    |

Дополнительные finalizations:

- Dual-value resolver: `Weight { variant: "dual_value", first, second, resolver: "athlete_profile" }` ✓
- RPE inclusion: `Intensity.rpe?: { value: number }` ✓
- Cross-movement percentage: `PercentageReference { scope: "other_exercise", targetExerciseId }` ✓
- MovementFamily as string: `Exercise.movementFamily: String?` ✓
- MediaReference embedded VO: `SchemaRow.media: Json?` + `Exercise.defaultDemoUrl` ✓
- SCHEMA_PAIRING separate join table ✓

---

## §6. Acceptance (Phase 1-6)

- [x] 198/198 block instances укладываются в model.
- [x] 33 archetypes used, 0 unmapped.
- [x] All 5 special cases (Q12-Q15 + paired schemas) имеют first-class representation.
- [x] Empty-body blocks (3) валидны через `schemas: []`.
- [x] Implicit blocks (75) валидны через `labelAssignments: []`.
- [x] Composite multi-label blocks (13) decompose per Phase 4 rules.
- [x] Block-level intensity (1) + schema-level intensity (1) + time_cap (1) fit.
- [x] 0 gaps.

**Status (Phase 1-6): PASS. Model ready for implementation.**

---

## §7. Phase 7 professional CrossFit stress test

Phase 7 добавил 6 expressiveness extensions для покрытия программирования профессионального CrossFit атлета (см. `00-meta/workflow.md` Phase 7, `05-synthesis/edge-cases.md` §10).

Цель §7: для каждого Phase 7 extension построить гипотетический session-fit и подтвердить, что модель покрывает кейс **без structural changes Prisma** (только Equipment enum extension в schema.prisma). Все extensions хранятся в JSON columns.

### §7.1 Session 1 — HR Z2 base run (Ext 1, Q16)

**Кейс**: 60 минут бега в Zone 2 (aerobic base building).

```
Block(
  sessionId, order=10,
  labelAssignments=[BlockLabelAssignment(labelId=Label("ENDURANCE").id, order=10)],
  intensity={ hrZone: { zone: "Z2" } },
  timeCap={ min: 60, unit: "min" }
)
  └─ Schema(
       order=10, kind=HEADERLESS, archetype=run-distance, header=null,
       archetypeParams={ archetype: "run-distance", params: { modality: "RUN" } }
     )
       └─ rows: [
            ExerciseRow(
              exercise=Exercise("RUN"),
              reps={ kind: "unit_bound", unit: "min", value: 60 },
              load={ kind: "bodyweight" }
            )
          ]
```

**Покрытие**: `Block.intensity.hrZone = { zone: "Z2" }` (Ext 1). Athlete-specific BPM резолвится via `Athlete.profileAttributes.hrMax` (см. `implementation-notes.md` §3.8). Модель не хранит absolute BPM — только categorical zone.

**Fit**: 1/1 ✓.

### §7.2 Session 2 — Row intervals @ pace (Ext 2, Q17)

**Кейс**: 8×500m row erg @ 1:50/500m pace, 90 sec rest between sets.

```
Block(
  sessionId, order=10,
  labelAssignments=[BlockLabelAssignment(labelId=Label("CONDITIONING").id, order=10)],
  intensity={ numericPace: { value: "1:50", distanceUnit: "m", paceType: "min_per_distance" } }
)
  └─ Schema(
       order=10, kind=ATOMIC, archetype=n-rounds, header="8 sets:",
       archetypeParams={ archetype: "n-rounds", params: { countForm: "exact", count: 8 } }
     )
       └─ rows: [
            ExerciseRow(
              exercise=Exercise("ROW_ERG row"),
              reps={ kind: "unit_bound", unit: "km", value: 0.5 },
              load={ kind: "bodyweight" }
            ),
            InlineRestRow(text="90 sec", scope="between_sets",
              parsed={ duration: { value: 90, unit: "sec" }, scope: "between_sets" })
          ]
```

**Покрытие**: `Block.intensity.numericPace = { value: "1:50", distanceUnit: "m", paceType: "min_per_distance" }` (Ext 2). `500m` представлено через `RepNotation.unit_bound { unit: "km", value: 0.5 }`. Equipment `ROW_ERG` — Phase 7 enum extension (Ext 6).

**Fit**: 1/1 ✓.

### §7.3 Session 3 — Tempo back squat with 3-1-2-0 (Ext 3, Q18)

**Кейс**: 5×5 back squat @ 75% 1RM with 3-second eccentric, 1-second pause at bottom, 2-second concentric, 0-second pause at top.

```
Block(
  sessionId, order=10,
  labelAssignments=[BlockLabelAssignment(labelId=Label("STRENGTH").id, order=10)]
)
  └─ Schema(
       order=10, kind=ATOMIC, archetype=n-rounds, header="5x 5 reps:",
       archetypeParams={
         archetype: "n-rounds",
         params: { countForm: "count_times_reps", count: 5, repsPerSet: 5 }
       }
     )
       └─ rows: [
            ExerciseRow(
              exercise=Exercise("back squat"),
              reps={ kind: "count", value: 5 },
              load={ kind: "percentage", value: 75, reference: { scope: "self" } },
              tempo={ fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 } }
            )
          ]
```

**Покрытие**: `SchemaRow.tempo.fullTempo = { eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 }` (Ext 3). `pauseTop=0` соответствует "X" eXplosive notation. Percentage Load с `reference.scope = "self"` — атлет 1RM на back squat.

**Fit**: 1/1 ✓.

### §7.4 Session 4 — Snatch wave loading (Ext 4 / Q19, programKind=wave)

**Кейс**: 3×3 snatch @ 70% / 80% / 90% 1RM, 2 min rest between wave stages.

```
Block(
  sessionId, order=10,
  labelAssignments=[BlockLabelAssignment(labelId=Label("OLYMPIC").id, order=10)]
)
  └─ Schema(
       order=10, kind=NAMED, archetype=named-exercise-program, header="Snatch:",
       archetypeParams={
         archetype: "named-exercise-program",
         params: {
           exerciseId: Exercise("snatch").id,
           program: {
             programKind: "wave",
             stages: [
               { reps: 3, load: { kind: "percentage", value: 70, reference: { scope: "self" } } },
               { reps: 3, load: { kind: "percentage", value: 80, reference: { scope: "self" } } },
               { reps: 3, load: { kind: "percentage", value: 90, reference: { scope: "self" } } }
             ],
             restBetweenStages: { duration: { value: 2, unit: "min" }, scope: "between_intervals" }
           }
         }
       }
     )
```

**Покрытие**: `StagedProgram.programKind = "wave"` (Ext 4) — generalization бывшего DropSetProgram. `restBetweenStages` Phase 7 addition. `named-exercise-program` archetype переиспользуется (никакого нового archetype).

**Fit**: 1/1 ✓.

### §7.5 Session 5 — Strict pull-up cluster (Ext 4 / Q19, programKind=cluster)

**Кейс**: 5 sets × cluster `[3 + 3 + 3]` strict pull-ups (15 sec intra-cluster rest), 2 min rest between sets.

```
Block(
  sessionId, order=10,
  labelAssignments=[BlockLabelAssignment(labelId=Label("STRENGTH ENDURANCE").id, order=10)]
)
  └─ Schema(
       order=10, kind=NAMED, archetype=named-exercise-program, header="Strict pull-ups:",
       archetypeParams={
         archetype: "named-exercise-program",
         params: {
           exerciseId: Exercise("strict pull-ups").id,
           program: {
             programKind: "cluster",
             setsCount: 5,
             stageCountPerSet: 3,
             stages: [
               { reps: 3, load: { kind: "bodyweight" } },
               { reps: 3, load: { kind: "bodyweight" } },
               { reps: 3, load: { kind: "bodyweight" } }
             ],
             restBetweenStages: { duration: { value: 15, unit: "sec" }, scope: "between_intervals" }
           }
         }
       }
     )
       └─ rows: [
            InlineRestRow(text="2 min REST BETWEEN SETS",
              scope="between_sets",
              parsed={ duration: { value: 2, unit: "min" }, scope: "between_sets" })
          ]
```

**Покрытие**: `StagedProgram.programKind = "cluster"` (Ext 4). `setsCount=5` + `stageCountPerSet=3` показывают cluster repetition. `restBetweenStages` = intra-cluster pause (15 sec); `between_sets` rest хранится отдельной InlineRestRow на schema body.

**Fit**: 1/1 ✓.

### §7.6 Session 6 — Accessory super-set (Ext 5, Q20)

**Кейс**: 3 round super-set: A1 = 12 DB row, A2 = 15 push-up, 60 sec rest between rounds.

```
Block(
  sessionId, order=10,
  labelAssignments=[BlockLabelAssignment(labelId=Label("ACCESSORY").id, order=10)]
)
  └─ Schema(
       order=10, kind=ATOMIC, archetype=super-set, header="Super-set A | 3 rounds:",
       archetypeParams={
         archetype: "super-set",
         params: {
           rounds: 3,
           pairs: [
             { label: "A1", schemaRows: [row-1.id] },
             { label: "A2", schemaRows: [row-2.id] }
           ],
           restBetweenPairs: { duration: { value: 60, unit: "sec" }, scope: "between_rounds" }
         }
       }
     )
       └─ rows: [
            ExerciseRow(
              id="row-1.id",
              exercise=Exercise("DB row"),
              reps={ kind: "count", value: 12 },
              load={ kind: "absolute", weight: { variant: "dual", valueKg: 20 } }
            ),
            ExerciseRow(
              id="row-2.id",
              exercise=Exercise("push-up"),
              reps={ kind: "count", value: 15 },
              load={ kind: "bodyweight" }
            )
          ]
```

**Покрытие**: archetype `super-set` (Ext 5) с `ArchetypeSuperSetParams.pairs` ссылается на `SchemaRow.id` через `SuperSetPair.schemaRows`. Family `ROUNDS_SETS` (close family — не отдельная). `SchemaPairing` **не** переиспользуется (это для bidirectional alternating-sets relation; super-set — ordered exercise sequence внутри одной schemы).

**Fit**: 1/1 ✓.

### §7.7 Aggregate Phase 7 coverage

| Session                     | Extension                 | Carrier                                             | Fit |
| --------------------------- | ------------------------- | --------------------------------------------------- | --- |
| §7.1 HR Z2 base run         | Ext 1 (Q16)               | `Block.intensity.hrZone`                            | ✓   |
| §7.2 Row intervals @ pace   | Ext 2 (Q17) + Ext 6 (Q21) | `Block.intensity.numericPace` + `Equipment.ROW_ERG` | ✓   |
| §7.3 Tempo back squat       | Ext 3 (Q18)               | `SchemaRow.tempo.fullTempo`                         | ✓   |
| §7.4 Snatch wave            | Ext 4 (Q19)               | `StagedProgram.programKind="wave"`                  | ✓   |
| §7.5 Strict pull-up cluster | Ext 4 (Q19)               | `StagedProgram.programKind="cluster"`               | ✓   |
| §7.6 Accessory super-set    | Ext 5 (Q20)               | archetype `super-set` + `ArchetypeSuperSetParams`   | ✓   |

**Phase 7 fit**: 6/6 sessions ✓. 0 gaps. Ext 6 (Equipment enum +7) used inline в §7.2 (ROW_ERG) и доступен для всех других sessions (ASSAULT_BIKE, ATLAS_STONE, JUMP_ROPE, SKI_ERG, SLED, YOKE).

### §7.8 Acceptance (Phase 7)

- [x] 6/6 Phase 7 stress sessions fit без structural Prisma changes (только Equipment enum extension).
- [x] All Phase 1-6 ratified decisions preserved (Intensity/TempoModifier — additive поля; StagedProgram — clean rename, drop_set legacy остаётся через `programKind="drop_set"`).
- [x] Q16-Q21 resolutions reflected в model (см. `05-synthesis/edge-cases.md` §10).
- [x] super-set archetype = 34th archetype в catalog; family = ROUNDS_SETS.
- [x] 0 gaps.

**Status (Phase 7): PASS. Model ready for UI implementation.**
