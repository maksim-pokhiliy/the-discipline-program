# Phase 3.3 load edge cases

Singletons, ambiguities, и эскалации связанные с load representation.

---

## 1. Singletons (≤ 6 occurrences) в weight notation

| pattern                                              | distinct strings                                                                                       | occurrences       | source / context                                                                                                                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dual-value placeholder `[ N/M kg ]`                  | `[ 50/30 kg ]`                                                                                         | 1                 | block-003 / schema-2 / sub-1 — `overhead squats [ 50/30 kg ]`. Barbell implied. Interpretation deferred (M/F vs RX/SC vs custom).                                                          |
| Split-tier composite `[ A KB N kg + B DB M kg ]`     | `[ 5 KB 24 kg + 10 DB 15 kg ]`                                                                         | 6                 | block-119 / 123 / 129 / 133 — `single arm row` exercise (mixed equipment per Phase 3.2 Group C). 5 KB-reps + 10 DB-reps per set.                                                           |
| Weight-with-asymmetric-arm-action                    | `[ 15 kg \| LEFT arm DO \| RIGHT arm HOLD in UP ]`, `[ 15 kg \| RIGHT arm DO \| LEFT arm HOLD in UP ]` | 4 (2 each mirror) | block-123 / schema-1 — DB bench presses compound с asymmetric arm role. Single 15 kg DB.                                                                                                   |
| Weight-with-depth-modifier                           | `[ 24 kg \| to the parallel ]`                                                                         | 1                 | block-189 / schema-2 — `10 KB swings [ 24 kg \| to the parallel ] [ emphasis on the gluteal muscles ]`. Depth-target qualifier inline с weight.                                            |
| Standalone weight row (multi-row scope)              | `[ 2x 15 kg ]`, `[ DB 2x 15 kg ]`                                                                      | 2                 | block-077 / schema-1 (`[ 2x 15 kg ]` row after deadlifts/cleans/push-presses), block-005 / schema-2 (`[ DB 2x 15 kg ]` row after 2 ladder paragraphs). Applies to multiple preceding rows. |
| Composite arm-action с holding-weight                | `[ another ARM HOLD KB 24 kg in UP ]`                                                                  | 1                 | block-133 / schema-1 — non-working arm holds KB 24 kg in UP position (passive load).                                                                                                       |
| Composite arm-action без holding-weight              | `[ another ARM HOLD DB in UP ]`                                                                        | 3                 | block-094 / 129 / 165 — non-working arm holds DB (weight unspecified inline).                                                                                                              |
| Complex per-arm program                              | `[ 1 ARM HOLD in UP \| another ARM DO 5 reps \| than opposite \| AND + 5 reps BOTH arms ]`             | 2                 | block-168 / 170 — multi-stage arm program embedded in annotation; weight implicit (DB context).                                                                                            |
| Negative / drop-stage indicator                      | `[ EXPLODE / WITHOUT WEIGHT ]` (внутри drop-set)                                                       | 9                 | Bulgarian split squats schemas (block-008, 021, 058, 059, 069, 071, 072, 074, 078) — final drop-set stage explosive bodyweight.                                                            |
| Effort intensity (schema-level, not absolute weight) | `[ 75-80% Effort ]` body, `[ 70% EFFORT ]` block-label                                                 | 1 body + 1 label  | block-078 AMRAP body-line, block-055 STRENGTH ENDURANCE block-label. Не absolute weight, но related — load specifier via effort.                                                           |

---

## 2. Ambiguous compound per-element weight (DP4 evidence)

`[ 2x 15 kg ]` trailing на compound row — applies к чему?

### 2.1 Sample evidence (16 compound rows с trailing weight)

| compound row example                                                                                                              | pattern                                | apply-to interpretation                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `5 strict DB press + 5 DB push press [ 2x 15 kg ]` (×6)                                                                           | 2-element, both DB-press               | both DB-press элементов получают 2x 15 kg                                                  |
| `5 strict DB press + 10 DB push press + 5 strict DB press [ 2x 15 kg ]` (×4)                                                      | 3-element sandwich, все DB             | все 3 элемента получают 2x 15 kg                                                           |
| `3 strict DB press + 6 DB push press + 3 strict DB press [ 2x 15 kg ]` (×2)                                                       | 3-element sandwich                     | все 3 элемента                                                                             |
| `30 DB hang power clean + DB push press [ 2x 15 kg ]`                                                                             | 2-element, оба DB-loaded               | оба элемента получают 2x 15 kg                                                             |
| `7 DB hang power cleans + push press [ 2x 15 kg ]` (×2)                                                                           | DB cleans + push press (DB implied)    | оба элемента; "push press" без DB prefix inherits DB equipment из first element            |
| `5 DB deadlifts + 5 hang power cleans + 5 DB squats [ 2x 15 kg ]`                                                                 | 3-element, все DB-loaded               | все 3 элемента                                                                             |
| `5 DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ]` (×3)                                                  | 2-element, per-element inline          | каждый элемент свой вес (per-element override)                                             |
| `5 DB bench presses [ 15 kg \| LEFT arm DO \| RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses [ same arm-action ]` | 3-element sandwich с bodyweight middle | DB-press элементы получают per-element inline, plyo push ups skip (bodyweight)             |
| `DB squats [ 2x 15 kg ] + 10 V-ups`                                                                                               | 2-element, weight INLINE на DB squats  | weight только DB squats; V-ups bodyweight (никаких annotation)                             |
| `10 DB Bulgarian split squats + 10 withot DB [ 2x 15 kg ] [ each leg ]` (×2)                                                      | 2-element, drop-set semantics          | первый stage `[ 2x 15 kg ]`, второй stage explicit `withot DB` (typo, "without DB") — drop |

### 2.2 Convention deduced

**Trailing weight** = applies к ALL loaded-equipment elements в compound. Bodyweight elements (plyo push ups, V-ups, burpees, push ups, withot DB) — пропускаются.

**Inline per-element weight** = used когда elements нуждаются в разных весах (`DB bench presses [ 2x 15 kg ] + single ARM bench presses [ 1x 15 kg ]`).

**"Last element only"** pattern в sample **не наблюдается** — нет cases где `+ A + B [ weight ]` означает что вес только B.

### 2.3 Эскалация в DP4

Model recommendation per DP4 (см. `load-representation.md` §4):

- Default rule: trailing applies к whole compound (loaded-only).
- Override rule: per-element inline вес есть → берёт приоритет над trailing default.
- Bodyweight rule: element с equipment=bodyweight игнорирует trailing вес.
- Edge case: "withot DB" — text-level marker, не `[ ]` annotation. Phase 5: модель должна распознавать explicit no-load text markers в element names.

---

## 3. Эскалации в main session

### 3.1 DP1: 1RM per-exercise vs per-movement-family

Sample не содержит %1RM — эскалация полностью conceptual, без sample-driven evidence. Recommended option (c) hybrid (granular base + family soft grouping).

Movement-family derivation candidates на основе Phase 3.2 Group A-M:

- snatch family: DB Snatches, DB hang snatches, DB hang power snatches, DB power snatches, DB alt. snatches.
- clean family: DB hang power cleans, DB power cleans, KB clean & push press, KB clean & jerk, DB hang power clean & push press.
- press family: DB bench presses, alt. DB bench presses, incline DB bench presses, DB STOH, DB push presses, DB halfkneeling press, alternative DB press, DB Seated Single Arm Arnold Press.
- squat family: DB squats, DB front squats, DB Cossacs squats, KB Goblet squats, Low Hold KB Cossack Squat, DB Bulgarian split squats, KB Bulgarian split squats, overhead squats.
- hinge family: DB deadlifts, KB SDHP, KB high pull, Single Leg Single Kettlebell Deadlift.
- thrust family: DB thrusters.
- row family: DB single arm row, KB single arm row, DB bent over row, DB Renegade row, Incline DB Prone Row.

Phase 5 решает — soft grouping или explicit MovementFamily entity.

### 3.2 DP2: Snapshot vs live formula

Sample evidence: блок-уровневые effort markers (`70% EFFORT`, `75-80% Effort`) — это template-style (live formula spirit), а не captured kg. Подсказка в пользу option (b) live formula. Но recorded performance отдельно — обязательно.

### 3.3 DP3: Bodyweight default

Sample evidence:

- `[ WITHOUT WEIGHT ]` (§1.11) explicit no-load — supports option (b) explicit variant.
- True bodyweight exercises (`strict pull-ups`, `burpees`) никогда не получают `[ 0 kg ]` — supports option (b), reject option (c).
- Distinguishing "true bodyweight" от "underspecified weighted" (DB Renegade row) — supports option (b) explicit variant (vs option (a) ambiguous null).

### 3.4 DP4: Compound-row per-element weight

Sample evidence — раздел 2.1 выше. Convention (a) hybrid с (c) override наиболее consistent.

### 3.5 Dual-value `[ 50/30 kg ]` interpretation

singleton (1 occurrence). Possible interpretations:

- **M/F dual** — мужской / женский вес.
- **RX / Scaled** — competition prescribed / scaled.
- **Athlete-attribute resolver** — generic mapping (athlete profile → first or second value).

Phase 3.3 НЕ выбирает. Эскалация в Phase 5 / Phase 6 — нужно дополнить sample / интервью тренера для понимания intent.

### 3.6 Multi-row standalone weight (§1.9)

2 occurrences (block-005, block-077). Possible treatments:

- **First-class standalone-load row** primitive — supports rare case explicitly.
- **Sugar для inline duplication** — parser expands `[ 2x 15 kg ]` standalone row в inline annotation на каждую preceding exercise row.
- **Schema-level default load** field — schema имеет `default_load` attribute, exercise rows без inline inherit.

Phase 5 решает — какой level model карьерится с двумя occurrences.

### 3.7 Weighted-implicit exercises (§4 load-stability)

23 exercises с primary_equipment=DB/KB но без inline weight в occurrences. Resolution rules:

- **Block-level default** — `STRENGTH ENDURANCE` block traditionally `2x 15 kg` DB; coach pre-sets.
- **Schema-level default** — schema header содержит default; exercise rows inherit.
- **Exercise-level default** — Exercise.default_load attribute (intrinsic).
- **None — explicit unspecified** — UI prompts coach to fill.

Phase 5 решает default-resolution chain.

### 3.8 Effort modifiers vs Load (`75-80% Effort` body, `70% EFFORT` block)

Single body-occurrence `[ 75-80% Effort ]` (block-078 AMRAP) + block-label `[ 70% EFFORT ]` (block-055).

Не absolute weight, но related — load specifier через subjective effort scale. Possible:

- **Part of Load VO** — variant `effort_percent`.
- **Sibling Intensity VO** — отдельная VO от Load.
- **Schema/Block attribute** — не Load, а Schema/Block intrinsic.

Phase 5 решает scope.

### 3.9 RPE-based load specifiers (out-of-sample)

RPE notation (`RPE 8`, `RPE 9.5`) не в sample, но gym-context типичен. Эскалация:

- include RPE as Load variant (variant 5 в conceptual model)?
- defer beyond MVP (atletes используют либо kg либо %1RM, RPE — advanced)?

Phase 5 решает.

### 3.10 Cross-movement percentage reference

Conceptual (out-of-sample): `60% of back squat 1RM` — percentage based на 1RM another exercise. Возможно для accessory lifts.

Зависит от DP1 — если per-exercise (a) — простой lookup; per-family (b) — может collapse в family-level; hybrid (c) — supports cross-exercise reference как override.

Phase 5 решает supported.

---

## 4. Summary

- **Singletons** в sample: 10 patterns (dual-value, split-tier, asymmetric-arm 2 mirrors, depth-modifier, multi-row 2, holding-weight, complex per-arm, WITHOUT WEIGHT, Effort).
- **Ambiguous compound per-element weight**: 16 trailing-weight rows analysed; convention (a) (trailing → whole compound, loaded-only) + (c) (per-element override) supported by sample.
- **10 эскалаций**:
  1. DP1 — 1RM granularity.
  2. DP2 — snapshot vs live.
  3. DP3 — bodyweight default representation.
  4. DP4 — compound trailing-weight scope.
  5. Dual-value `[ 50/30 kg ]` resolver interpretation.
  6. Multi-row standalone weight first-classness.
  7. Weighted-implicit default-resolution chain.
  8. Effort modifiers — Load variant vs sibling Intensity VO.
  9. RPE inclusion в Load model.
  10. Cross-movement percentage reference support.
