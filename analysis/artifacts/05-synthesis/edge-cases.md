# Edge cases (Phase 5 synthesis, Task 8)

Каталог edge cases доменной модели: singletons handling, deferred decisions, abstraction choices, escalations к main session. После Phase 5 ratification — переход в Phase 6 (Prisma + TS formalization).

---

## §1. Singletons handling

Per Phase 2.2 — 8 archetype-singletons (cardinality=1 в sample) + 3 block-singletons (cardinality=2 в одном blocke).

### 1.1 Archetype singletons (8 штук)

| Archetype                           | Block                             | Decision Phase 5                                                                                                                                                                                                                       |
| ----------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ladder-vertex-down-pyramid          | block-098 (`11-9-7-9-11:`)        | **first-class** archetype в catalog. Структурно отличается от ladder-descending mirror-pair pattern. Phase 6 ratify.                                                                                                                   |
| ladder-spike                        | block-106 (`10-8-6-4-10:`)        | **first-class**, но **flag as anomalous**. Возможно typo в источнике (могло быть `10-8-6-4-2:`). Phase 6: оставить archetype, но Library notes у archetype могут содержать "anomalous, verify source". Не сливать с ladder-descending. |
| amrap-flat                          | block-078 (`AMRAP 12 min:`)       | **first-class**. Time-cap paradigm важен beyond sample (conditioning standard CrossFit). Singleton в sample = artifact домашней тренировки.                                                                                            |
| composite-intervals-work-rest-fixed | block-142                         | **first-class**. Generic work-rest-fixed schema — distinct от progressive variant.                                                                                                                                                     |
| composite-intervals-on-off-max-tail | block-143                         | **first-class**. MAX-tail семантика combined с fixed работой — отдельный paradigm.                                                                                                                                                     |
| composite-rolling-rounds            | block-144                         | **first-class**. Rolling-EMOM cadence — special variant без sub-min discretization.                                                                                                                                                    |
| parallel-pyramids                   | block-087 (`3-6-9-12-9-6-3:` × 2) | **first-class**. Pyramid headerless body — distinct от parallel-ladders-descending (asymmetric stepping pattern).                                                                                                                      |
| practice-list                       | block-146 (PRACTICE 5-10 min)     | **first-class**. Practice/skill-work schema без rep prescription — concept полезный beyond sample (mobility / skill work).                                                                                                             |

**Сводное решение**: все 8 singletons остаются first-class в Archetype catalog. **Не сливать.** Resason: модель устанавливает barrier бары для разнообразия sample. Sample мал (9 месяцев одного атлета); beyond sample (gym programs, multiple modalities) — singletons могут оказаться обычными archetypes.

### 1.2 Block-singletons (3 штук, cardinality=2 в одном blocke)

| Archetype                        | Block     | Decision Phase 5                                                                                                                                                                                    |
| -------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| alternating-sets                 | block-009 | **first-class archetype**. Member schemas объединяются в `AlternatingGroup` — block-scoped N-ary grouping entity (D14, 2026-05-20). block-009 — 2 schemas, но модель поддерживает 2..N без потолка. |
| time-window-outer                | block-003 | **first-class archetype**. Структурно отличается от count-outer (nested-rounds-over-rounds). 2 windows в одном blocke = 2 separate Schemas (matches Phase 2.1 ratification).                        |
| parallel-ladders-mixed-direction | block-005 | **first-class archetype**. Mixed-direction differs from pure descending parallel-ladders archetype. Phase 2.1 case-rest-split-parallel — 2 schemas разделены rest-marker.                           |

**Note**: block-singletons имеют cardinality=2 потому что обе schemas внутри ONE block paired. Это не cardinality=2 distinct blocks. Phase 5 keeps as separate archetypes с paired-schema relations.

### 1.3 Эскалация: monitoring growth

Beyond sample (Phase 6 stress-test всех 33 листов + post-launch real data):

- Если archetype-singleton остаётся singleton после 100+ блоков → consider merging с related archetype (e.g., ladder-spike → ladder-descending с "tail-anomaly" notation).
- Если block-singleton (alternating-sets) appears в новом blocke → cardinality растёт, archetype validates как general-purpose.

Phase 5 не финализирует merge — это data-driven decision для Phase 6+.

---

## §2. Deferred decisions

### 2.1 Dual-value resolver `[ 50/30 kg ]`

**Source**: block-003 / schema-2 / sub-1 `overhead squats [ 50/30 kg ]` (1 occurrence).

**Phase 3.3 §1.6 ratify**: Weight.dual_value variant с `resolver="athlete_profile"`. Concrete profile attribute deferred.

**Phase 5 status**: model stores `{ first: 50, second: 30, resolver: "athlete_profile" }`. UI/api resolves через runtime lookup на Athlete.profile_attributes (sex / RX-SC / level).

**Escalation Phase 6**: финализировать concrete resolver attribute name + lookup logic. Options:

- (a) `Athlete.sex` → male=first, female=second.
- (b) `Athlete.crossfit_tier` → RX=first, SC=second.
- (c) Custom `Athlete.profile["weight_tier"]` enum, coach-controlled.

**Recommended**: (c) — flexible, не bake-in domain-specific assumption.

### 2.2 RPE inclusion

**Source**: 0 sample occurrences. Phase 3.3 §3.1.6 lists RPE как conceptual variant.

**Phase 5 ratify**: `Intensity.rpe: { value: number }` — optional field в Intensity struct. Model-ready, не блокирует Phase 6.

**Phase 6 decision**: keep or drop. Recommendation: **keep** — minimal cost, high upside for gym programs.

### 2.3 Cross-movement percentage reference

**Source**: 0 sample occurrences. Phase 3.3 §3.1.5 lists conceptual case (`60% of back squat 1RM` для accessory lifts).

**Phase 5 ratify**: `Load.Percentage.reference.scope = "other_exercise"` с `target_exercise_id` FK. Model-ready.

**Phase 6 decision**: confirm persistence shape. Recommendation: **keep** — common gym programming pattern.

### 2.4 Snapshot vs live Load (DP2 hybrid)

**Phase 3.3 DP2 b ratified**: live formula default. Snapshot mode (option c) — deferred.

**Phase 5 status**: model supports live; snapshot mode (per-session `lock_load_at_creation` flag) — может быть added Phase 6 если требуется coach control для testing weeks.

**Phase 6 escalation**: проверить, требует ли gym use case mode-switch. Recommendation: **keep flexibility** — добавить session-level boolean `freeze_loads_at_creation`, default false.

### 2.5 Snapshot для actual_load в PerformedSession

**Phase 5 ratify**: PerformedExerciseInstance.actual_load — Load VO, всегда concrete kg (post-resolution). Это **snapshot of performance**, не prescription mode.

Coach просматривает: prescribed Load (live, может меняться с 1RM updates) vs actual Load (immutable, recorded at performance time).

---

## §3. Abstraction choices

### 3.1 MovementFamily abstraction

**Sample evidence**: weak. Phase 3.2 группирует exercises в ~10-15 soft groups (Group A snatches, Group D HSPU, Group J Cossacs, ...) на основе demo URLs и canonical names. Не hard taxonomy.

**Decision Phase 5**: **string field на Exercise** (`movement_family: string?`), не отдельная entity.

**Reasoning**:

- Sample мал (149 exercises, families ~10-15) → entity overengineering.
- DP1 c uses movement_family для fallback в OneRMRecord smart-default, не для query-heavy operations.
- Coach UX: family — descriptive tag, не tracked relation.
- Phase 6 / future — upgrade в entity если sample >> 15 families либо если family attributes (description, demo, default exercises in family) появляются.

**Phase 6 status**: implement как `text` column. Indexes optional.

### 3.2 MediaReference как embedded VO vs entity

**Sample evidence**: ~374 URL references, 37 distinct URLs.

**Phase 5 decision**: **embedded VO в SchemaRow + Exercise.default_demo_url**, не entity.

**Reasoning**:

- 37 distinct URLs — small catalog.
- Если bug в URL → coach edit Exercise.default_demo_url централизованно.
- Variant URLs (`DB single arm row [ WITHOUT BENCH ]` имеет own URL) — embedded per-row OK.

**Phase 6 consideration**: если post-launch library URL dedup становится pain — extract в `MEDIA_REFERENCE` entity. Phase 5 не блокирует upgrade.

### 3.3 Connector как row vs Schema field

**Phase 5 ratified**: `ConnectorRow` (row_kind=`connector`) в body предыдущей schema, **не** `Schema.trailing_connector` field.

**Reasoning**:

- Phase 2.1 case-then-connector ratified: connector в конце body предыдущей schema.
- Symmetric с `...then N rounds:` continuation в body composite-intervals schemas.
- Iteration UI simpler — single body[] containing все markers + rows + connectors.
- Persistence Phase 6 — Row entity с polymorphic payload.

**Alternative считается**: `Schema.trailing_connector: ConnectorMarker?` (nullable field). Phase 5 reject — добавляет separate concept, нарушает body uniformity.

### 3.4 PlaceholderRow + PerSetSubstitution composition

**Phase 5 ratify**: PerSetSubstitution — **embedded VO внутри PlaceholderRow** (через `per_set_assignments` field), не отдельная row.

**Reasoning**:

- В sample (block-020, 021) — placeholder row сопровождается annotation row на следующей позиции. Phase 5: parse-time собирает 2 rows в single PlaceholderRow с embedded VO.
- Alternative: 2 separate rows (PlaceholderRow + AnnotationRow). Reject — фрагментация одной concept.

**Phase 6 ratifies**: persistence — single row с embedded JSON.

### 3.5 Staged program — first-class structure (Phase 7 rename, ex-DropSetProgram)

**Phase 5 ratify**: VO embedded в `archetype_params.program` для archetype-named-exercise-program. **Не** separate Schema kind.

**Phase 7 update (Q19)**: clean rename `DropSetProgram` → `StagedProgram`. Generalize через discriminator `programKind: "drop_set" | "wave" | "cluster"`. Adds `restBetweenStages?: RestSpec` + Stage shape recall (см. `domain-model.md` §2.10). Phase 5/6 naming was tentative; Phase 7 finalizes.

**Reasoning**:

- StagedProgram tightly coupled с named-exercise-program archetype (drop-set Bulgarian split squats в sample; wave / cluster — professional CrossFit beyond sample).
- Embedded VO simplifies — schema body может содержать только `InlineRestRow` (rest-spec), program — в archetype_params.
- Generalization (Phase 7): один embedded VO покрывает 3 staged paradigms (drop_set / wave / cluster) через discriminator.

**Alternative**: представить StagedProgram как nested Schema (3 sub-schemas — по одной на stage). Reject — overengineering для tightly-coupled stable shape, особенно после Phase 7 generalization (3 program kinds в одном VO).

### 3.6 OrAlternative — first-class VO

**Phase 5 ratify**: OrAlternative VO embedded в ExerciseRow.exercise polymorphic body. **Не** separate row kind.

**Reasoning**:

- `OR` — substitution choice для ОДНОЙ row, не альтернативный path всей schema.
- Embedded VO matches semantic: 2 exercises с reps + purpose-flag, выбор runtime athlete.

### 3.7 PerformedSession vs Session

**Phase 5 ratify**: separate entity PerformedSession + child PerformedExerciseInstance.

**Reasoning**:

- Sample не моделирует performance (just plans). Phase 5 проектирует extension beyond sample.
- DP2 b: prescription = live formula, performance = recorded отдельно. Это разделение требует separate entity для actuals.
- Audit trail: planned Session — immutable history of coach decisions; PerformedSession — immutable history of actuals.

**Alternative**: log-table (event-sourcing style). Reject — overengineering для current requirements. Separate entity matches user mental model.

**Phase 6 escalation**: versioning of PerformedSession (если athlete repeats session) — see Phase 5 Open Q9.

---

## §4. Pace label vs Intensity field (CRITICAL escalation)

### 4.1 Conflict

Phase 4 hierarchy.md ratified: `EASY PACE` остаётся как label (case-pace-as-label-vs-intensity).

Phase 5 workflow brief override: "Intensity = struct с optional fields effort_percent / rpe / pace". Подразумевает pace = Intensity field, не label.

### 4.2 Resolution Phase 5

**Phase 5 accepts workflow brief override**: pace = Intensity field.

**Implications**:

- block-055 decomposition: `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]` → `labels=[STRENGTH ENDURANCE]`, `intensity={effort_percent:{value:70}, pace:"easy"}`.
- Labels catalog: `EASY PACE` **NOT** в labels library. Drop из applicable_levels=[block].
- Composite-label decomposition Rule 1 extends: extract not only `[ ... ]` brackets but also categorical pace keywords (`EASY PACE`, future `MODERATE PACE`, etc.).

### 4.3 Эскалация main session

**Status**: Phase 5 принял override. Main session должна явно подтвердить:

1. Pace = Intensity field (не label). Drop `EASY PACE` из labels-catalog.md applicable_levels list. **Action**: update Phase 4 labels-catalog.md либо обозначить Phase 5 override.

2. Decomposition Rule 1 extension: parser определяет categorical pace keywords без `[ ]` brackets. **Implementation**: add `pace_keywords` enum to Rule 1.

3. Если main session reverts (keep pace как label): откатить Intensity struct shape (drop `pace` field), block-055 decomposition reverts.

**Recommended Phase 5 path**: keep override (matches workflow brief, cleaner abstraction).

---

## §5. Open questions Phase 5 → Phase 6 → Phase 7

Inherited Phase 4 Q1-Q7 + Phase 5 Q8-Q15 + Phase 7 Q16-Q21:

| ID                          | Question                                                 | Phase 5 default                                                                                                                            | Status                                                                                                        |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Q1                          | applicable_levels enforcement                            | soft (Option C ratified)                                                                                                                   | implement UI warning + soft validation; strict — optional config                                              |
| Q2                          | Label.applicable_levels mutation policy                  | keep existing assignments                                                                                                                  | implement migration check on mutation                                                                         |
| Q3                          | Intensity inheritance — full override vs partial overlay | **partial overlay** (Phase 5 correction)                                                                                                   | implement per-field merge logic                                                                               |
| Q4                          | Empty-body block semantic placeholder                    | no explanation field needed                                                                                                                | keep simple `schemas: []`                                                                                     |
| Q5                          | Implicit-блок UI presentation                            | "Без названия" placeholder                                                                                                                 | UI decision, no model impact                                                                                  |
| Q6                          | Order semantics — sparse vs dense                        | sparse (allow gaps) for easy insertion                                                                                                     | implement integer with gap-friendly conventions                                                               |
| Q7                          | Block.labels[] set vs list semantics                     | set semantics for dedup, list for order                                                                                                    | DB unique constraint on (block_id, label_id)                                                                  |
| Q8 (Phase 5)                | Pace = label или Intensity field                         | **Intensity field** (Phase 5 override)                                                                                                     | confirm main session, update labels-catalog.md                                                                |
| Q9 (Phase 5)                | PerformedSession versioning                              | latest-only per (Session, Athlete)                                                                                                         | TBD: versioned vs replaced                                                                                    |
| Q10 (Phase 5)               | Snapshot mode для Load                                   | optional flag `freeze_loads_at_creation`                                                                                                   | implement как session-level boolean                                                                           |
| Q11 (Phase 5 → refined 7.1) | exercise_name in named-exercise-program — FK or string   | **CLOSED Phase 7.1** — Any Exercise valid FK target. `Schema.header String?` optional override для display. No abstract entries в catalog. | resolver: `displayHeader = schema.header ?? (exercise.canonicalName + ":")` (`implementation-notes.md` §3.13) |
| Q12 (Phase 5)               | rest_slot row kind для REST body в EMOM sub              | add new row_kind variant                                                                                                                   | implement                                                                                                     |
| Q13 (Phase 5)               | `alternating` variant в PerLimbDistribution              | add to distribution_kind enum                                                                                                              | implement                                                                                                     |
| Q14 (Phase 5)               | SequenceIndicator.target_label — string или Label ref    | string (free-text)                                                                                                                         | optional upgrade to Label ref Phase 6+                                                                        |
| Q15 (Phase 5)               | Schema.notes field для EXAMPLE/explanatory rows          | add Schema.notes string?                                                                                                                   | implement                                                                                                     |
| Q16 (Phase 7)               | HR zone reference shape                                  | **categorical zone** (Z1-Z5); BPM via `Athlete.profileAttributes.hrMax`                                                                    | **CLOSED Phase 7** — `Intensity.hrZone = { zone: HrZone }`                                                    |
| Q17 (Phase 7)               | Numeric pace distance unit + paceType                    | enum km/mi/m/yd/lap; default `min_per_distance`                                                                                            | **CLOSED Phase 7** — `Intensity.numericPace` struct                                                           |
| Q18 (Phase 7)               | Full tempo notation                                      | 4-digit (eccentric-pauseBottom-concentric-pauseTop) seconds; "X" → 0                                                                       | **CLOSED Phase 7** — `TempoModifier.fullTempo` struct                                                         |
| Q19 (Phase 7)               | StagedProgram migration                                  | clean rename DropSetProgram → StagedProgram (не alias) + generalize via `programKind`                                                      | **CLOSED Phase 7** — `StagedProgram { programKind, stages, restBetweenStages?, ... }`                         |
| Q20 (Phase 7)               | super-set vs alternating-sets-link reuse                 | archetype params (не the alternating-sets link entity); the link entity (`AlternatingGroup` per D14) stays для alternating-sets            | **CLOSED Phase 7** — archetype `super-set` + `ArchetypeSuperSetParams`                                        |
| Q21 (Phase 7)               | Equipment enum extensions                                | ratify 7 additions (YOKE / ATLAS_STONE / SLED / ASSAULT_BIKE / SKI_ERG / ROW_ERG / JUMP_ROPE)                                              | **CLOSED Phase 7** — Equipment enum +7 alphabetical                                                           |

---

## §6. Эскалации к main session

Priority-sorted (critical → optional):

### 6.1 CRITICAL — pace conflict resolution

**Q8**: Phase 4 hierarchy.md (pace=label) vs Phase 5 workflow brief (pace=Intensity field). Phase 5 accepted override.

**Action**: main session confirms:

- Keep override → update Phase 4 labels-catalog.md to drop `EASY PACE` from labels; ensure parser supports pace keyword extraction in Rule 1.
- Revert → drop `pace` field from Intensity struct; keep `EASY PACE` as label; revert block-055 decomposition.

**Recommended**: **keep override** (cleaner abstraction, matches Phase 5 partial overlay inheritance design).

### 6.2 HIGH — dual-value resolver concrete attribute

**Q (deferred)**: `Athlete.sex` vs `Athlete.crossfit_tier` vs `Athlete.profile["weight_tier"]` для `[ 50/30 kg ]` resolution.

**Action**: main session pickает attribute (или подтверждает deferred-to-Phase-6).

**Recommended**: defer further until concrete gym use case demands it.

### 6.3 HIGH — exercise_name в named-exercise-program

**Q11**: `Bulgarian split squats:` header — string vs FK; refined Phase 7.1.

**Resolution (Phase 7.1)**: Any Exercise — valid FK target для `archetypeParams.exerciseId` (concrete sibling из 149-list, no abstract entries). `Schema.header String?` (ratified Phase 4 Q15-context) — optional display override. Algorithm: `displayHeader = schema.header ?? (exercise.canonicalName + ":")` (см. `implementation-notes.md` §3.13).

**Sample (block-008)**: `exerciseId → DB Bulgarian split squats`, `Schema.header = "Bulgarian split squats:"` (bare display override). Per-stage Load (StagedProgram.stages) overrides intrinsic equipment exercise'а.

### 6.4 MEDIUM — model extensions for stress test gaps

Aggregated:

- Q12: `rest_slot` row kind для EMOM REST body.
- Q13: `alternating` variant в PerLimbDistribution.
- Q15: Schema.notes field.

**Action**: confirm all 3 additions are non-breaking. Implement в Phase 6.

**Recommended**: implement all (small, additive).

### 6.5 MEDIUM — alternating-sets group membership persistence

**Q (Phase 5)**: alternating-sets archetype requires a persisted link между member schemas (block-009).

**Resolved (D14, 2026-05-20)**: Phase 6 first shipped `SchemaPairing` — a 2-FK pair table (`schemaAId` + `schemaBId`). D14 superseded it: `alternating-sets` is an **N-ary** relation (a coach links 2..N schemas into one alternating cycle, no upper bound), and a 2-FK pair table cannot express N>2. Replaced by `AlternatingGroup` — a block-scoped grouping entity; membership via single nullable FK `Schema.alternatingGroupId` (a schema belongs to at most one group — single FK, no junction table). `onDelete`: Block → Cascade, `Schema.alternatingGroup` → SetNull. See `06-formalization/implementation-notes.md` §4.9 + D14.

### 6.6 LOW — RPE / cross-movement percentage / snapshot mode

**Q (Phase 5)**: keep all 3 as model-ready optional. No immediate sample need.

**Action**: confirm keep. Phase 6 implements minimal scaffolding.

### 6.7 LOW — Day.notes / Session.notes

**Q (Phase 4)**: 0 sample evidence для notes на Day/Session levels.

**Phase 5 ratify**: keep optional, low cost.

**Action**: confirm keep.

### 6.8 LOW — MovementFamily upgrade trigger

**Q (Phase 5)**: when to upgrade string field → entity.

**Action**: defer to post-launch monitoring. No Phase 6 work.

---

## §7. Decisions NOT taken in Phase 5

Out-of-scope per workflow:

- Calendar / Week / Plan entities (above Day).
- Order semantics finalization (sparse vs dense numeric).
- DB constraints / indices / migrations.
- UI / api shape, query patterns.
- Permissions / multi-tenant / access control.
- Versioning / audit trails (beyond PerformedSession entity).
- Templates / copy semantics.

Phase 6 + future will address.

---

## §8. Summary

### Decisions ratified Phase 5

1. **Singletons**: all 8 archetype-singletons + 3 block-singletons stay first-class. No mergers.
2. **Movement family**: string field on Exercise. Not entity (yet).
3. **MediaReference**: embedded VO. Not entity (yet).
4. **Connector**: ConnectorRow в body. Not separate field.
5. **PlaceholderRow + PerSetSubstitution**: single row with embedded VO.
6. **StagedProgram** (Phase 7 rename ex-DropSetProgram, Q19): embedded VO в archetype_params, not separate Schema kind. Phase 7 generalize via `programKind: drop_set | wave | cluster`.
7. **OrAlternative**: embedded VO, не separate row.
8. **PerformedSession + PerformedExerciseInstance**: separate entities.
9. **Pace**: Intensity field (Phase 4 override). **Эскалация Q8.**
10. **Intensity inheritance**: partial overlay (Phase 4 correction).

### Deferred decisions

1. Dual-value resolver concrete attribute (Phase 6+).
2. RPE inclusion final (Phase 6 — recommended keep).
3. Cross-movement percentage reference (Phase 6 — recommended keep).
4. Snapshot mode Load (Phase 6 — recommended keep flexibility).
5. MovementFamily upgrade trigger (post-launch).

### Open questions

7 inherited from Phase 4 + 8 new Phase 5 = 15 total. All non-blocking для Phase 6 entry.

### Critical escalation

**Q8 pace**: Phase 5 accepted workflow brief override (pace = Intensity field, не label). Main session должна явно confirm либо revert. Recommended: confirm override.

### Readiness for Phase 6

**Domain model готова**. Model extensions identified в stress test — minor refinements, не structural rebuild. Phase 6 (Prisma + TS) может стартовать с этих artifacts:

- `domain-model.md` — entities + VOs + Schema kinds + relations.
- `er-diagram.md` — mermaid ER.
- `stress-test.md` — 9 sessions fitment + gaps catalogued.
- `edge-cases.md` (this file) — singletons + deferred + escalations.

---

## §9. Phase 6 closeout (post-formalization)

Phase 6 (Prisma + TS) завершена. См. `06-formalization/` для:

- `schema.prisma` — финальная Prisma schema.
- `types.ts` — TS-типы (DTO для CRUD).
- `er-final.md` — финальная ER mermaid.
- `stress-final.md` — 198/198 block instances fit, 0 gaps.
- `implementation-notes.md` — JSON fixtures, Zod schemas, resolution algorithms.

Все Q1-Q15 closed в Phase 6 (см. `stress-final.md` §5).

---

## §10. Phase 7 extensions (professional CrossFit coverage)

Phase 7 — точечное расширение модели под подготовку профессионального CrossFit атлета. 6 additive extensions, никаких structural rebuilds. Все Phase 1-6 ratified decisions preserved.

### §10.1 Motivation

Текущая модель (Phase 1-6) была построена на основе 9-месячного sample-плана домашней тренировки одного атлета. Sample не покрывал:

- HR zone-based endurance prescriptions (Z1-Z5 base building).
- Numeric pace targets для interval running / rowing / swimming.
- Full 4-digit Olympic / accessory tempo notation (`3-1-2-0`).
- Wave loading + cluster sets (drop-set был единственным staged program kind в sample).
- Bodybuilding-style super-sets (A1/A2 ordered pair sequences).
- Strongman / CrossFit competition equipment (yoke, atlas stone, sled, assault bike, ski erg, row erg, jump rope).

Phase 7 закрывает gaps **через JSON-column extensions** (Intensity / TempoModifier / archetype_params) + **single Prisma enum extension** (Equipment). Никаких structural table additions.

### §10.2 Q-resolutions

| Q   | Question                                 | Resolution Phase 7                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q16 | HR zone reference shape                  | **Categorical zone only**. `Intensity.hrZone = { zone: "Z1" \| "Z2" \| "Z3" \| "Z4" \| "Z5" }`. Athlete-specific BPM резолвится через `Athlete.profileAttributes.hrMax` (placeholder). Модель не хранит absolute BPM.                                                                                                                                                                                                                                            |
| Q17 | Numeric pace distance unit + paceType    | `Intensity.numericPace = { value: "MM:SS", distanceUnit: "km" \| "mi" \| "m" \| "yd" \| "lap", paceType: "min_per_distance" \| "distance_per_min" }`. Default `paceType = "min_per_distance"` (running / rowing standard).                                                                                                                                                                                                                                       |
| Q18 | Full tempo notation                      | 4-digit (`eccentric-pauseBottom-concentric-pauseTop`) в seconds. `"X"` (eXplosive) → 0 sec. `TempoModifier.fullTempo = { eccentric, pauseBottom, concentric, pauseTop }`.                                                                                                                                                                                                                                                                                        |
| Q19 | StagedProgram migration                  | **Clean rename** `DropSetProgram` → `StagedProgram` везде (types.ts, references в archetype params, implementation-notes.md algorithms). НЕ alias. Phase 5/6 naming was tentative; Phase 7 finalizes. Generalize через discriminator `programKind: "drop_set" \| "wave" \| "cluster"`. Adds `restBetweenStages?: RestSpec`. Stage shape adds optional `indicator?: "explode" \| "without_weight"`.                                                               |
| Q20 | super-set vs alternating-sets-link reuse | **Archetype params** (NOT the alternating-sets link entity). Archetype `super-set` (kind=ATOMIC, family=ROUNDS_SETS) с `ArchetypeSuperSetParams { pairs: SuperSetPair[], restBetweenPairs?: RestSpec, rounds: number }`. `SuperSetPair = { label, schemaRows: SchemaRowRef[] }`. The alternating-sets link entity (`AlternatingGroup` per D14) is NOT reused — it is an N-ary cross-schema group; super-set is an ordered exercise sequence внутри одной schema. |
| Q21 | Equipment enum extensions                | Ratify **7 additions** (alphabetical в schema.prisma): `ASSAULT_BIKE`, `ATLAS_STONE`, `JUMP_ROPE`, `ROW_ERG`, `SKI_ERG`, `SLED`, `YOKE`. Final Equipment enum cardinality = **19** values (12 Phase 1-6 + 7 Phase 7).                                                                                                                                                                                                                                            |

### §10.3 Six extensions catalog

| #     | Extension                           | Carrier (DB)                                                       | Carrier (TS)                                                     | Stress test session                                           |
| ----- | ----------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| Ext 1 | HR zones                            | `Block.intensity / Schema.intensity / SchemaRow.intensity` JSON    | `Intensity.hrZone?: { zone: HrZone }`                            | `stress-final.md` §7.1 (Z2 base run)                          |
| Ext 2 | Numeric pace                        | `Block.intensity / Schema.intensity / SchemaRow.intensity` JSON    | `Intensity.numericPace?: NumericPace`                            | `stress-final.md` §7.2 (Row 500m @ 1:50)                      |
| Ext 3 | Full 4-digit tempo                  | `SchemaRow.tempo` JSON                                             | `TempoModifier.fullTempo?: FullTempo`                            | `stress-final.md` §7.3 (Back squat 5×5 @ 3-1-2-0)             |
| Ext 4 | StagedProgram (rename + generalize) | `Schema.archetypeParams.program` JSON для `named-exercise-program` | `StagedProgram { programKind, stages, restBetweenStages?, ... }` | `stress-final.md` §7.4 (Snatch wave), §7.5 (Cluster pull-ups) |
| Ext 5 | super-set archetype                 | `Schema.archetypeParams` JSON (archetype=`super-set`)              | `ArchetypeSuperSetParams { pairs, restBetweenPairs?, rounds }`   | `stress-final.md` §7.6 (Accessory super-set)                  |
| Ext 6 | Equipment enum +7                   | Prisma `Equipment` enum                                            | `Equipment` Prisma generated                                     | `stress-final.md` §7.2 (ROW_ERG used inline)                  |

### §10.4 Preserved decisions

Phase 7 — **strictly additive**:

- Intensity 5 fields (was 3): existing effort_percent / rpe / pace preserved + hrZone / numericPace added.
- TempoModifier 5 fields (was 4): existing pauseInUp / perNthRepPause / slowEccentric / holdAfterLast preserved + fullTempo added.
- StagedProgram rename: clean (no alias). `programKind="drop_set"` сохраняет Phase 1-6 Bulgarian split squats semantic — все legacy fields (`setsCount`, `stageCountPerSet`, `separatorForm`, `mediaPerStage`) сохранены, `restBetweenStages` добавлен.
- Stage shape additive: `reps` extended `number | RepNotation`; `load` optional (was required); `indicator?` enum added (was free-text label only); `label`/`media` preserved.
- 33 Phase 1-6 archetypes preserved; `super-set` = 34th. Family `ROUNDS_SETS` (close family, не новая).
- Equipment enum: 12 Phase 1-6 values preserved; 7 Phase 7 additions; final alphabetical sort (consistent with kebab-case discipline).
- Никаких structural Prisma table additions / removals / renames кроме Equipment enum.

### §10.5 Coverage stress test

Phase 7 stress test: 6/6 hypothetical professional CrossFit sessions fit (см. `stress-final.md` §7). 0 gaps. Все extensions used in at least one session; Equipment additions used inline (ROW_ERG в §7.2).

### §10.6 Closed in Phase 7

Q16, Q17, Q18, Q19, Q20, Q21 — closed in Phase 7. См. §10.2 для resolutions, §5 для consolidated open questions table.

### §10.7 Open after Phase 7

Открытые items, не закрытые Phase 7:

- Q1-Q7 (Phase 4 inherited) — implementation-level.
- Q8-Q15 (Phase 5) — closed in Phase 6 (см. `stress-final.md` §5).
- `Athlete.profileAttributes.hrMax` финализация (concrete shape профайла athlete) — Phase 7+ при добавлении athlete management UI.
- Dual-value resolver (Phase 5 §2.1) — deferred.
- RPE practical sample (Phase 5 §2.2) — deferred.
- Cross-movement percentage practical sample (Phase 5 §2.3) — deferred.
- MovementFamily entity upgrade trigger (Phase 5 §3.1) — post-launch monitoring.
- Calendar / Week / Plan entities — Phase 8+ / future.
- Template / cloning model — future feature.

### §10.8 Readiness for UI implementation

Phase 7 closes the domain model для подготовки атлета на professional CrossFit уровне. Следующий шаг — UI implementation на основе artifacts:

- `06-formalization/schema.prisma` — Prisma schema (Equipment enum +7).
- `06-formalization/types.ts` — TS-типы.
- `06-formalization/er-final.md` — final ER mermaid.
- `06-formalization/stress-final.md` — 198 Phase 1-6 + 6 Phase 7 sessions, 204/204 fit, 0 gaps.
- `06-formalization/implementation-notes.md` — JSON fixtures, Zod, resolution algorithms (HR zone, numeric pace, full tempo, StagedProgram, super-set).
- `05-synthesis/domain-model.md` — entities + VOs + Schema kinds + relations (Phase 7 backfilled).
- `05-synthesis/edge-cases.md` (this file) — Phase 7 §10.

**Status (Phase 7): READY for UI implementation.**

### §10.9 Phase 7.1 refinement (Q11)

Точечный patch одного ratified решения: Q11 был over-restrictive (equipment-stripped canonical catalog entry на одно sample-упражнение — не масштабируется на другие named-program movements).

**Refined resolution**: Любой Exercise — valid FK target для `archetypeParams.exerciseId`. `Schema.header String?` (ratified Phase 4 Q15-context) — optional display override. Algorithm: `displayHeader = schema.header ?? (exercise.canonicalName + ":")` (см. `implementation-notes.md` §3.13). Catalog seed = 149 canonical exercises, без abstract entries.

**Block-008 sample-case**: `exerciseId → DB Bulgarian split squats`, `Schema.header = "Bulgarian split squats:"` (bare display override). Per-stage Load (StagedProgram.stages, programKind=drop_set) overrides intrinsic equipment.

**Preserved**: все Phase 1-7 другие ratified decisions; structural Prisma / types.ts — no changes (`Schema.header String?` уже exists Phase 4-6).

**Status (Phase 7.1): READY for UI implementation.**
