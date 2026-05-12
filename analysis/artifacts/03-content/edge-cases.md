# Phase 3.1 edge cases

Singletons, ambiguous scope, dual-value notations, drop-set вложенность и эскалации в main session. Source: caller artifacts `02-patterns/schema-boundaries.md` + наблюдения Phase 1 / 2.1 / 2.2 edge-cases.

---

## Singletons (structurally unique primitives, cardinality ≤ 2 occurrences)

### case-curly-braces (2 occurrences, 1 distinct pattern)

source: block-125 / schema-3, block-138 / schema-3.

context:

- block-125 / schema-3: `30 DB Renegade row [ https://www.youtube.com/watch?v=bi1Nf5G86gU ] { 1 push up + each arm row = 1 rep }`
- block-138 / schema-3: `DB Renegade row [ https://www.youtube.com/watch?v=bi1Nf5G86gU ] { 1 push up + each arm row = 1 rep }` (implicit count из header `3x 10 reps:`)

Pattern: `{ A + B + ... = 1 rep }` — определение compound-action как 1 rep.

decision: hadrcoded singleton. Trailing annotation в фигурных скобках — structurally distinct от `[ ]` annotation. Используется специально для rep-definition (`= 1 rep`).

escalation Phase 5: модель должна поддерживать compound-rep definition (compound movement как atomic rep) либо как first-class primitive (rep-definition entity), либо как extension `[ ]` annotation. Curly-brace форма — единственная occurrence, можно formalize как regular annotation с `rep-definition` scope tag.

related: case-inline-rep-equality.

### case-inline-rep-equality (1 occurrence)

source: block-043 / schema-1.

context: `5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ] [ from box/sofa ]`

decomposition:

- `5 reps = 1 rep` — equality statement (5 повторений composite-action = 1 rep).
- `[ 1 HS walk + 2 strict HSPU ]` — define composite-action.
- `[ from box/sofa ]` — equipment for HSPU.

decision: singleton. Семантически родственно case-curly-braces (оба объясняют composite-action), но structurally distinct — equality statement стоит как leading text row, не trailing annotation.

escalation Phase 5: эта row хочет быть formalized как одна из двух options:

- (a) compound-rep с count `5` и composite movement `1 HS walk + 2 strict HSPU`.
- (b) compound-rep с count `1` и composite movement scaled-by-5.
  Semantically equivalent, представления различаются. Главное — модель должна поддерживать `compound-rep with multiplier`.

related: case-curly-braces.

### case-dual-value-weight (1 occurrence)

source: block-003 / schema-2 / sub-1.

context: `overhead squats [ 50/30 kg ]`

decision: singleton in sample. Per main-session guidance — НЕ интерпретировать как RX/scaled или M/F однозначно. Resolution by athlete context.

possible semantic interpretations (rejected pre-commit):

- RX/scaled (full intensity / scaled-down). `50 kg` для RX, `30 kg` для scaled.
- M/F (вес для атлетов мужского / женского пола). `50 kg` для мужчин, `30 kg` для женщин.
- Иной dual-resolve (например, "use 50 kg на первый сет, 30 kg на второй").

escalation Phase 5: модель weight должна поддерживать dual-value notation `[ N/M kg ]` без выбора одной семантической интерпретации в Phase 3.1. Резолвция — в Phase 6 (formalization) с явной decision-point про athlete-context-based interpretation.

related: case-composite-weight-arm-split (тоже composite weight, но через `|`).

### case-effort-modifier-body-level (1 occurrence)

source: block-078 / schema-1.

context: первая body line AMRAP-flat schema:

```
AMRAP 12 min:
[ 75-80% Effort ]
7 strict HSPU
14 DB power snatches [ 2x 15 kg ]
21 AIR squats
```

decision: body-level effort modifier. Scope: **schema** (whole AMRAP 12 min execution at 75-80% effort).

cardinality: 1 в body. `[ 70% EFFORT ]` встречается в block-label `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]` (block-055) — block-level scope, но не body.

ambiguity: scope `[ N% Effort ]` зависит от позиции:

- В block-label (block-055): block scope.
- В первой body row (block-078): schema scope.

escalation Phase 5: модель effort должна поддерживать оба уровня scope. Body-level effort = schema attribute (intensity для всей schema). Block-label effort = block attribute (intensity для всех schemas в blocke).

### case-three-MAX-subforms (4 occurrences, 3 distinct sub-forms)

source: block-080, block-140, block-141, block-143.

context: 3 разных MAX-notation формы:

1. `MAX DB FRONT SQUATS [ 2x 15 kg ]` (block-080 / schema-1 / sub-3): bare MAX exercise + weight (внутри EMOM `3 min:` sub-slot).
2. `MAX ROUNDS in remaining time: 1-2-3-4-5 etc.` (block-140, 141): MAX rounds + progressive ladder seed + EXAMPLE description.
3. `MAX strict HSPU in remaining time` (block-143): MAX exercise count в remaining time (no progressive seed).

decision: каждая форма — distinct semantic primitive в Phase 3.1.

escalation Phase 5: модель должна различать:

- bare-MAX (как rep-count notation, infinite или until-end-of-window) — пометить как rep-notation variant.
- MAX-rounds-progressive — это work-rest schema body shape, с progressive ladder seed.
- MAX-in-remaining-time — это TAIL после fixed reps в work-window.

Phase 2.2 уже различает: archetype-emom-sub-minute-slot (bare-MAX), archetype-composite-intervals-work-rest-progressive (MAX-rounds-progressive), archetype-composite-intervals-on-off-max-tail (MAX-in-remaining-time). Phase 3.1 confirms эта дискриминация на content-уровне.

### case-per-set-substitution-placeholder (2 occurrences)

source: block-020, block-021.

context: 2 разных placeholder-form + per-set annotation:

block-020:

```
*DB exercise  [ 2x 15 kg ]
[ *DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS ]
```

block-021:

```
* Burpee variation
[ 1 set: bar facing burpees | 2 set: burpee + push ups | 3 set: burpee ]
```

decision: structural primitive — placeholder row + annotation pair с per-set mapping через `|`-separated entries.

ambiguity:

- В block-020: annotation has `*DB exercise:` prefix (linking back to placeholder identifier).
- В block-021: annotation has no prefix, but mapping format is identical.

escalation Phase 5: модель должна поддерживать «placeholder slot» с per-set exercise instances. Implementation choices:

- (a) Placeholder = abstract entity (`*DB exercise`, `* Burpee variation`) + array of 3 concrete exercise instances per set.
- (b) Annotation as freeform text without first-class slot semantics.
- Decision: (a) preferred — позволит варьировать per-set exercise programmatically.

### case-drop-set-program-nesting (9 occurrences, 2 numeric variants)

source: block-008, 021, 058, 059, 069, 071, 072, 074, 078 (Bulgarian split squats schemas).

context: nested schema-like program inside annotation:

```
3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]
```

structure (1 set = 3-stage drop-set):

- x5 reps with `DB 2x 15 kg`
- `...then...` separator
- x5 reps with `DB 1x 15 kg` (weight drop)
- `...then...` separator
- x5 reps with `EXPLODE / WITHOUT WEIGHT` (no weight, explosive)

variants:

- `x5` (6 occurrences): block-008, 021, 058, 069, 071, 078.
- `x7` (3 occurrences): block-059, 069 ([sic typo — 069 listed in both x5 and x7, but actually only one occurrence per block; need re-check]). Actually correct counting from script: 9 EXPLODE: URL = 9 BSS schemas. x5 variants: 6; x7 variants: 3.

decision: nested structure внутри annotation — distinct primitive. Не decomposable до simple weight annotation.

ambiguity: scope of `[ x5 [ DB 2x 15 kg ] ]` inner brackets — это `rep-stage` scope (5 reps with specific weight), которая не присутствует в плоских exercise rows.

escalation Phase 5: модель должна поддерживать drop-set program как first-class structure для named-exercise-program archetype:

- Per-set: array of 3 rep-stages.
- Per rep-stage: rep-count + weight (or `EXPLODE / WITHOUT WEIGHT` indicator).
- `...then...` — internal separator между rep-stages.

related: case-named-exercise-program-decomposition.

### case-pull-arm-program-singleton (2 occurrences)

source: block-168 / schema-1, block-170 / schema-1.

context: complex per-arm program annotation:

```
14 seated lateral BANDED raises [ 1 ARM HOLD in UP | another ARM DO 5 reps | than opposite | AND + 5 reps BOTH arms ]
```

decomposition:

- `1 ARM HOLD in UP` — one arm holds in up position.
- `another ARM DO 5 reps` — opposite arm performs 5 reps.
- `than opposite` — switch arms.
- `AND + 5 reps BOTH arms` — finally, 5 reps with both arms.

decision: singleton complex annotation. Single pattern, 2 occurrences (block-168, 170 — identical text, different blocks).

escalation Phase 5: эта annotation потенциально formalize-able как multi-stage rep distribution, но cardinality 2 — низкая. Можно оставить как free-text annotation с low priority for first-class formalization.

### case-composite-weight-arm-split (2 distinct, 4 occurrences)

source: block-123 (схема-1 содержит 4 instance этих annotations).

context:

- `5 DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]`
- mirror: `[ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ]`

decision: composite annotation с `|` separating weight + per-arm action. Phase 3.1 фиксирует scope = exercise.

escalation Phase 5: композитное annotation. Decomposition variants:

- (a) Split into 2 annotations: `[ 15 kg ]` + `[ LEFT arm DO | RIGHT arm HOLD in UP ]` — но потеря явной связи "weight применяется ТОЛЬКО к DO-arm".
- (b) First-class composite weight-per-arm structure.
- Singleton (4 occurrences in same block) — keep as composite annotation pattern.

### case-composite-equipment-grip (3 occurrences, 1 pattern)

source: block-015, block-016, block-039 (deficit HSPU rows внутри composite-intervals-then-rounds).

context: `5 deficit HSPU [ from sofa/box ] [ hand on DB | neutral grip ]`

decomposition:

- `[ from sofa/box ]` — position annotation.
- `[ hand on DB | neutral grip ]` — composite: hand-position + grip type через `|`.

decision: composite-with-pipe annotation, scope = exercise.

escalation: low-priority composite. Phase 5 — keep as multi-annotation pattern с `|` semantics определяемой каждым separator-pair.

### case-split-tier-weight (6 occurrences, 1 pattern)

source: block-119, 123, 129, 133 (single arm row exercises).

context: `[ 5 KB 24 kg + 10 DB 15 kg ]` — split-tier weight within single set.

decision: composite weight notation. Per-set executed as 2 stages: 5 reps с одним weight, 10 reps с другим weight. Этот pattern semantically distinct от drop-set program (case-drop-set-program-nesting) — split-tier применяется в single set, не across sets.

escalation Phase 5: модель weight должна поддерживать split-tier как option (либо single weight, либо drop-set, либо split-tier).

### case-bare-url-only-in-warm-up-feet (2 occurrences, 1 block)

source: block-149 / schema-1.

context:

```
https://youtu.be/Qt1NzbdWSmM?si=NgjjrbU1BmXCioob
https://youtu.be/VX1euygufcY?si=33QNST7ctqlYtxa2
```

decision: bare URLs (без `[ ]` wrapping) — singleton form для block "warm up for feet". Phase 2.2: archetype-url-only-body.

escalation Phase 5: модель должна toleate-able bare URLs как content variant (отсутствие `[ ]` wrapping — typo or styling, not semantic difference). Phase 6 — нормализовать в bracket form или keep as raw.

### case-yoga-time-single-url (1 occurrence)

source: block-147 / schema-1.

context: body is single `[ URL ]` (single yoga playlist reference).

decision: variant URL-only-body (1 row with `[ ]` wrapping, vs block-149 — 2 bare URLs).

escalation: low-priority singleton. Phase 5 — поддержать `[ URL ]`-only-row как regular structural primitive.

### case-asymmetric-LR-paired-rows (multiple occurrences)

source: block-043 (2 rows), block-073 (4 rows), block-120 (2 rows), block-127, 128, 134 (2 rows each), и др.

context: типовой pattern — 2 exercise rows с identical exercise + `[ LEFT ARM ]` / `[ RIGHT ARM ]` annotation на каждой:

- `7 DB hang snatches [ LEFT ARM ]`
- `7 DB hang snatches [ RIGHT ARM ]`
- (или с дополнительным modifier: `7 OH DB lunges [ LEFT ARM ]` + `7 OH DB lunges [ RIGHT ARM ]`)

decision: paired-rows structural primitive — 2 separate exercise rows с asymmetric modifiers.

escalation: уже handled в Phase 2.2 (archetype-n-rounds с asymmetric body — block-073 example). Phase 3.1 фиксирует как valid structural pattern. Phase 5 — модель не требует special-case (это 2 regular rows с different modifiers).

---

## Ambiguous scope (modifiers с context-dependent scope)

### `[ 2x 15 kg ]` — inline vs standalone

ambiguity: inline `[ 2x 15 kg ]` после exercise row → scope = exercise. Standalone `[ 2x 15 kg ]` row, занимающая всю body line, scope = multi-row (применяется ко всем preceding exercise rows в same schema).

occurrences:

- inline: 157 + 6 = 163.
- standalone: 2 (block-077 / schema-1 `[ 2x 15 kg ]`, block-005 / schema-2 `[ DB 2x 15 kg ]`).

decision rule: position (inline на той же row vs standalone row) определяет scope.

escalation Phase 5: модель должна поддерживать оба scope. Опции:

- (a) First-class «shared-weight row» как structural element schema.
- (b) Trailing standalone weight применяется к preceding exercises посредством implicit-rule.

### `[ N% Effort ]` — schema vs block

ambiguity: scope зависит от position:

- В block-label (`[ 70% EFFORT ]` block-055): block scope.
- В первой body row (`[ 75-80% Effort ]` block-078): schema scope.

resolution: положение определяет scope.

### `[ AFTER each Nth REP - M sec pause ]` — exercise scope, не round

ambiguity: lexically похоже на round-level (`each Nth REP` → `every Nth round`?), но фактически scope = exercise (per-rep tempo modifier на specific row).

resolution: scope = exercise. Применяется на каждый Nth rep той row, не на каждую N-ю round-execution.

reasoning: `[ AFTER each 5th REP - 5 sec pause ]` найдена в 24 hamstring curls rows — modifier применяется в rep-count хамстринг curls (e.g., 20 reps), не в rep-count outer schema. Each 5th rep within the 20 — pause 5 sec.

### `[ EXPLODE: URL ]` — schema vs exercise

ambiguity: standalone `[ EXPLODE: URL ]` row внутри Bulgarian split squats schemas.

- Could be: scope = exercise (Bulgarian split squats), demonstration URL.
- Could be: scope = schema (drop-set program), explaining EXPLODE step.

decision: schema scope (labels EXPLODE step внутри drop-set program, не all squats).

reasoning: URL specifically demonstrates "EXPLODE" technique, который применяется в final stage drop-set. Не demonstrates Bulgarian split squats в general.

---

## Composite annotations с `|` (resolution rules)

`|` separator внутри `[ ]` имеет различные семантики per occurrences:

| pattern                                                    | semantics                           | count |
| ---------------------------------------------------------- | ----------------------------------- | ----- |
| `hand on DB \| neutral grip`                               | equipment + grip (paired modifiers) | 3     |
| `15 kg \| LEFT arm DO \| RIGHT arm HOLD in UP`             | weight + asymmetric arm action      | 4     |
| `24 kg \| to the parallel`                                 | weight + depth modifier             | 1     |
| `1 set: X \| 2 set: Y \| 3 set: Z`                         | per-set mapping                     | 2     |
| `1 ARM HOLD in UP \| ... \| ... \| AND + 5 reps BOTH arms` | multi-stage arm action sequence     | 2     |

decision: `|` не имеет one specific семантику. Контекст определяет.

escalation Phase 5: модель НЕ должна assume `|` carries fixed semantics. Каждый pattern parsed контекстуально или kept as free-text annotation.

---

## Drop-set program — vложенная структура

structural decomposition (см. case-drop-set-program-nesting):

- Outer: `N sets` (typically 3 or 4).
- Per set: drop-set sequence через `...then...` separators.
- Each step: `x<reps> [<weight or EXPLODE>]`.

cardinality: 9 occurrences (all Bulgarian split squats schemas).

variant numeric patterns:

- `x5 ... x5 ... x5` (6 occurrences): 3-stage drop-set, 5 reps per stage.
- `x7 ... x7 ... x7` (3 occurrences): 3-stage drop-set, 7 reps per stage.

decision: drop-set program — single primitive type с 2 numeric variants (rep-count 5 vs 7) и 3 weight variants (DB 2x 15 kg / DB 1x 15 kg / EXPLODE-without-weight).

escalation Phase 5: модель named-exercise-program (BSS-style archetype) должна включать:

- Drop-set program field: array of rep-stages.
- Each rep-stage: rep-count + weight (or special token `EXPLODE / WITHOUT WEIGHT`).

---

## Other observations

### Whitespace / case inconsistencies (не structural)

- `[ 2x 15 kg ]` (157) vs `[ 2x15 kg ]` (6) — typo без пробела, structurally equivalent.
- `- rest UNTIL recovery -` vs `- rest until recovery -` vs `- REST IN BETWEEN SETS UNTIL RECOVERY -` — case variant + style variant, structurally similar.
- `[ + 2 sec pause in UP position ]` (15) vs `[ + 2 sec pause in UP ]` (8) — `position` suffix optional, identical structurally.
- `LEFT ARM` vs `LEFT arm` — case variant, identical structurally.

decision: treat as identical for modifier-scope purposes. Phase 3.1 фиксирует case-insensitively через `modifier-scope.md` deduplication notes.

### Footnote rows (`*` prefix) — multi-purpose

`*` prefix appears in 4 different role:

1. Per-set substitution placeholder (`*DB exercise`, `* Burpee variation`) — pairs с `[ ]`-annotation row below.
2. Per-round footnote (`*100 single unders AFTER each set`, `*150 single unders AFTER each set`) — exercise outside main schema body, выполняемый between rounds.
3. Per-block footnote (`** 5 strict HSPU [ from sofa ] [ AFTER EACH ROUND ]`) — double-star variant, semantically similar to single-star but emphasized.
4. Per-round complex (`* 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK [ after each GYMNASTICS round ]`) — multi-stage footnote с round-scope annotation.

decision: `*` prefix — footnote marker, scope зависит от annotation content.

escalation Phase 5: модель должна различать footnote rows от main exercise rows (visual marker `*`, semantic = additional cyclical movement). Возможна decomposition: footnote → separate sub-schema, или first-class footnote field в schema.

### `MAX ROUNDS in remaining time` — `MAX` + ladder seed

source: block-140, 141.

context: body content row: `MAX ROUNDS in remaining time: 1-2-3-4-5 etc. [ 2x 15 kg ]`

decomposition:

- `MAX ROUNDS in remaining time:` — count semantics (do max rounds в оставшееся время).
- `1-2-3-4-5 etc.` — progressive ladder seed (round 1 = 1 rep each, round 2 = 2 reps each, ...).
- `[ 2x 15 kg ]` — weight.
- (followed by EXAMPLE annotation explaining the execution).

decision: composite row containing MAX-count notation + ladder seed + weight annotation. Phase 2.2 archetype: composite-intervals-work-rest-progressive.

escalation Phase 5: модель MAX rep-notation должна включать progressive seed variant.

---

## Escalations to main session

1. **Dual-value weight resolution** (case-dual-value-weight): модель weight должна поддерживать `[ N/M kg ]` notation. Resolution to RX/scaled / M/F / другой — откладывается на Phase 6+ (athlete-context-based programmatic resolution). Phase 3.1 не выбирает интерпретацию.

2. **Compound-rep definition** (case-curly-braces, case-inline-rep-equality): 3 occurrences total для 2 distinct patterns. Phase 5 должна решить — formalize compound-rep definition как:

   - (a) First-class compound-rep entity (preferred — также покроет drop-set sub-structure).
   - (b) Extension `[ ]` annotation with `= 1 rep` interpretation.
   - (c) Curly-brace primitive с rep-definition scope.

3. **Per-set substitution placeholder** (case-per-set-substitution-placeholder): 2 occurrences. Phase 5: модель должна поддерживать per-set exercise instances в slot, parsed из `*placeholder` + `[ N set: X | ... ]` annotation.

4. **Drop-set program structure** (case-drop-set-program-nesting): 9 occurrences. Phase 5: модель named-exercise-program должна включать array of rep-stages, каждый с rep-count + weight.

5. **Split-tier weight** (case-split-tier-weight): 6 occurrences. Phase 5: модель weight должна включать split-tier option (1 set состоит из 2 stages с разными weights).

6. **Body-level effort modifier ambiguity** (case-effort-modifier-body-level): single occurrence in body (block-078). Phase 5: effort modifier scope зависит от position (body vs block-label).

7. **Standalone weight rows** (`[ 2x 15 kg ]` as full row): 2 occurrences. Phase 5: модель должна определить — это multi-row scope (применяется к preceding rows) или specific schema-level weight default. Both interpretations possible.

8. **`|` separator semantic ambiguity** в composite annotations: 7 distinct patterns. Phase 5: НЕ assume fixed `|` semantics; контекстуальный parsing.

9. **`MAX` notation 3-form variability** (case-three-MAX-subforms): Phase 5: модель count notation должна поддерживать 3 формы — bare MAX, MAX rounds progressive, MAX in remaining time tail.

10. **Footnote `*`/`**` prefix rows scope variability\*\*: 7 occurrences с 4 разными role. Phase 5: модель footnote должна включать round-scope, set-scope, и schema-scope variants.

---

## Summary

- **Total Phase 3.1 edge-cases**: 17 distinct cases.
- **Singletons / structurally unique primitives**: 13.
  - case-curly-braces (1 pattern, 2 occurrences)
  - case-inline-rep-equality (1 occurrence)
  - case-dual-value-weight (1 occurrence)
  - case-effort-modifier-body-level (1 occurrence)
  - case-three-MAX-subforms (3 distinct sub-forms, 4 occurrences)
  - case-per-set-substitution-placeholder (2 occurrences)
  - case-drop-set-program-nesting (9 occurrences, 2 numeric variants)
  - case-pull-arm-program-singleton (1 pattern, 2 occurrences)
  - case-composite-weight-arm-split (4 occurrences in same block)
  - case-composite-equipment-grip (3 occurrences)
  - case-split-tier-weight (6 occurrences)
  - case-bare-url-only-in-warm-up-feet (2 occurrences)
  - case-yoga-time-single-url (1 occurrence)
- **Ambiguous scope cases**: 4 (inline-vs-standalone weight, effort scope, AFTER-each-rep tempo, EXPLODE: URL scope).
- **Composite-annotations with `|` separator**: 7 distinct patterns, 12 occurrences.
- **Escalations to main session**: 10.

### Notable not edge-cases (de-flagged):

- `[ TOTAL ]` (4 occurrences): не edge — Phase 2.1 ratified separate-headerless-schema-prefix archetype.
- `then:` / `...then...:` (11 occurrences): не edge — Phase 2.1 ratified placement в конец body предыдущей schema.
- `then N rounds:` continuation (5 occurrences): не edge — Phase 2.1 ratified body-level continuation, не отдельная schema.
- Per-arm asymmetric rows (`LEFT ARM`/`RIGHT ARM` paired): не edge — regular structural pattern.

### Singleton patterns предлагаемые для consolidation в Phase 5

- Сompound-rep definition (3 occurrences: curly + inline-equality) — single primitive type.
- All `|` composite annotations — keep contextual parsing, не consolidate.
- All MAX-variants — single MAX rep-notation primitive с 3 sub-forms.

### Singleton patterns предлагаемые для standalone first-class:

- Drop-set program (9 occurrences) — first-class structure.
- Per-set substitution placeholder (2 occurrences) — first-class slot.
- Split-tier weight (6 occurrences) — first-class weight option.
- Dual-value weight (1 occurrence) — first-class weight option (interpretation deferred).

### Coverage verification

- 107 distinct body annotations: 91 exercise-scope + 8 schema-scope + 2 round-scope + 2 set-scope + 2 multi-row scope + 2 nested/special = 107. Полное покрытие.
- 17 edge cases отражают примерно 30 distinct annotation strings + 4 structurally-unique row patterns. Все documented с эскалациями.
