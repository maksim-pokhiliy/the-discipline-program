# Modifier scope table (Phase 3.1)

Каждая distinct `[ ]`-annotation с указанным scope (exercise / set / round / schema / block), cardinality и примерами.

Scope-уровни:

- **exercise**: модификатор привязан к конкретной exercise row.
- **set**: применяется к одному set'у (per-set substitution).
- **round**: применяется к одному round'у / round-by-round интервалу (`AFTER EACH ROUND`).
- **schema**: применяется ко всей schema (например `[ TOTAL ]` для overall-counter, или `[ 75-80% Effort ]` для AMRAP).
- **block**: применяется ко всему block-у (например `[ 70% EFFORT ]` в block-label).
- **multi-row** (внутри schema): применяется к нескольким preceding exercise rows в schema (standalone weight row).

Если scope неоднозначный или зависит от контекста — указан **ambiguous** с эскалацией в `edge-cases.md`.

Семантически 107 distinct body annotations распределены ниже по families.

---

## 1. Weight annotations

### `[ N kg ]` — single weight

distinct strings (со всеми variants):

- `[ 15 kg ]` (18 occurrences)
- `[ 24 kg ]` (19) — обычно для KB
- `[ 17.5 kg ]` (0 в sample — отсутствует, но было бы такой же scope)

scope: exercise (attached к row left of bracket).

examples:

- block-026: `12 DB Cossacs squats [ 15 kg ] [ 6 EACH leg ]` — `[ 15 kg ]` относится к DB Cossacs squats.
- block-153: `10 DB Bulgarian split squats [ 15 kg ] [ each leg ]` — `[ 15 kg ]` относится к Bulgarian split squats.
- block-007: `18 KB clean & push press [ 24 kg ] [ 9 each arm ]` — `[ 24 kg ]` относится к KB.

cardinality: 37 occurrences.

notes:

- Контекст (DB vs KB) определяется именем упражнения, не annotation.

### `[ 2x N kg ]` — dual dumbbells

distinct strings:

- `[ 2x 15 kg ]` (157)
- `[ 2x15 kg ]` (6) — typo-variant без пробела, structurally эквивалентен.

scope: exercise.

examples:

- block-001: `10 DB bench presses [ 2x 15 kg ]` — обе гантели по 15 kg.
- block-018: `10 DB lunges [ 2x 15 kg ] [ hold farm carry ]` — две гантели + position modifier.

cardinality: 163.

notes:

- Доминирующая weight annotation в sample.

### `[ 1x N kg ]` — single arm dumbbell

distinct strings:

- `[ 1x 15 kg ]` (14)

scope: exercise.

examples:

- block-033: `30 DB Snatches [ 1x 15 kg ]` — одна гантель.
- block-037: `36-28-20: / DB Snatches [ 15 kg ] [ alternative ]` — alternating snatches.

cardinality: 14.

### `[ DB 2x N kg ]` — DB-prefixed dual

distinct strings:

- `[ DB 2x 15 kg ]` (19)
- `[ DB 1x 15 kg ]` (9)

scope:

- **multi-row** when standalone: row сам по себе — применяется ко всем preceding exercise rows внутри той же schema (block-027, 028, 029).
- **exercise** when inline на той же row как exercise.

examples:

- block-027 / schema-1: `3 hang power cleans + 3 fron squats + 3 push presses [ DB 2x 15 kg ]` — inline, attached к compound row.
- block-005 / schema-2: `[ DB 2x 15 kg ]` — standalone row after both ladders, applies к всему schema body.
- block-008 / schema-2: `3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...]` — nested внутри drop-set annotation.

cardinality: 28.

### Standalone weight row `[ 2x N kg ]` — multi-row scope

distinct: 2 occurrences:

- block-077 / schema-1: `[ 2x 15 kg ]` — отдельная row после `12 DB deadlifts / 9 DB hang power cleans / 6 DB push presses`. Применяется ко всем трём.
- block-005 / schema-2: `[ DB 2x 15 kg ]` — отдельная row после двух ladder paragraphs.

scope: **multi-row** (применяется к нескольким preceding exercise rows в той же schema).

notes:

- Это singleton-стиль pattern. Per-row inline `[ 2x 15 kg ]` annotation встречается ~150x чаще.

### `[ N/M kg ]` — dual-value weight

distinct strings:

- `[ 50/30 kg ]` (1, block-003 / schema-2 / sub-1 `overhead squats [ 50/30 kg ]`)

scope: exercise (attached к row).

cardinality: 1.

notes:

- Interpretation deferred to athlete context per main-session guidance. Возможные интерпретации: RX/scaled, M/F, или иной dual-resolve. Phase 3.1 НЕ выбирает одну интерпретацию.
- См. edge-cases.md → case-dual-value-weight.

### Composite weight `[ N KB N kg + M DB M kg ]`

distinct strings:

- `[ 5 KB 24 kg + 10 DB 15 kg ]` (6 occurrences, block-119, 123, 129, 133)

scope: exercise (composite distribution внутри одного set).

examples:

- block-119: `15 DB single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ https://... ] [ each arm ]` — 5 reps с KB 24 kg, потом 10 reps с DB 15 kg.

cardinality: 6.

notes:

- Это split-tier weight: 1 set состоит из двух weight-tier стадий.

### Composite weight + arm split

distinct strings:

- `[ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]` (2)
- `[ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ]` (2)
- `[ another ARM HOLD KB 24 kg in UP ]` (1, block-133)

scope: exercise.

cardinality: 5 occurrences (3 distinct strings).

notes:

- `|` separator делит несколько параметров в `[ ]` (только этих 7 случаев со split-весом — единственное место где `|` несёт несвязанные параметры внутри annotation, см. compound-and-alternative.md §6.11).

### `[ NEGATIVE ]` (внутри exercise name)

- Не отдельная annotation, а часть imeni упражнения `strict NEGATIVE HSPU` (block-114). Не модификатор в `[ ]`.

### `[ WITHOUT WEIGHT ]`

- Не отдельная annotation, но часть `EXPLODE / WITHOUT WEIGHT` внутри drop-set program (9 occurrences). См. §10.

### `[ 24 kg | to the parallel ]` — singleton composite

distinct strings: 1 occurrence (block-189 / schema-2).

- `10 KB swings [ 24 kg | to the parallel ] [ emphasis on the gluteal muscles ]`

scope: exercise.

cardinality: 1.

notes:

- Weight + depth-modifier через `|` separator. Singleton.

---

## 2. Side / per-limb modifiers

### `[ each leg ]`

scope: exercise.
cardinality: 105 occurrences.

examples:

- block-018: `10 DB lunges [ 2x 15 kg ] [ hold farm carry ]` — без `each leg`, общий счёт.
- block-153: `10 DB Bulgarian split squats [ 15 kg ] [ each leg ]` — 10 на каждую ногу, total = 20.
- block-148: `10-15 single leg GLUTE BRIDGE [ each leg ]` — range на каждую ногу.

notes:

- Когда rep count указан с `[ each leg ]`, общий total = rep × 2.

### `[ each arm ]`

scope: exercise.
cardinality: 45 occurrences.

examples:

- block-006: `DB single arm row [ https://... ] [ each arm ]` — без leading count, наследует из ladder marker, применяется к каждой руке.
- block-118: `10 KB [ 24 kg ] single arm row [ https://... ] [ each arm ]` — 10 на каждую руку.

### `[ N each leg ]` / `[ N each arm ]` — explicit per-limb count

distinct strings:

- `[ 5 each leg ]` (1)
- `[ 6 EACH leg ]` (1)
- `[ 5 each LEG ]` (1)
- `[ 4 each leg ]` (1)
- `[ 15 reps each leg ]` (1)
- `[ 5 each arm ]` (2)
- `[ 9 each arm ]` (1)
- `[ 7 each arm ]` (1)
- `[ 10 each arm ]` (1)
- `[ 15 each arm ]` (2)

scope: exercise (clarification про rep distribution).

cardinality: 12 occurrences.

examples:

- block-007: `18 KB clean & push press [ 24 kg ] [ 9 each arm ]` — 18 total = 9 на каждую руку.
- block-026: `12 DB Cossacs squats [ 15 kg ] [ 6 EACH leg ]` — 12 total = 6 на каждую ногу.
- block-031: `10 DB farmer carry lunges [ 2x 15 kg ] [ 5 each leg ]` — 10 total = 5 на каждую ногу.
- block-033: `30 DB Bulgarian split squats [ 2x 15 kg ] [ 15 reps each leg ]` — total = 30 = 15 на каждую ногу.

notes:

- Когда leading count существует, `[ N each X ]` обычно указывает половину = N (т.е. distribution общего count'а).
- Case-sensitivity ("EACH", "each", "LEG", "leg") — стилистический разброс, structural смысл идентичен.

### `[ LEFT ARM ]` / `[ RIGHT ARM ]` / `[ LEFT arm ]` / `[ RIGHT arm ]`

distinct strings: 4 case-variants.

- `[ LEFT ARM ]` (8) / `[ LEFT arm ]` (1) — combined 9
- `[ RIGHT ARM ]` (8) / `[ RIGHT arm ]` (1) — combined 9

scope: exercise (asymmetric row, обычно paired).

cardinality: 18 occurrences (9 pairs).

examples:

- block-073: `7 DB hang snatches [ LEFT ARM ]` + `7 DB hang snatches [ RIGHT ARM ]` (paired pattern: разные rows для каждой руки).
- block-043: `10 DB snatches + DB thrusters [ 1x 15 kg ] [ LEFT arm ]` + `10 DB snatches + DB thrusters [ 1x 15 kg ] [ RIGHT arm ]` (paired with single-arm weight).

notes:

- Обычно встречается парой — две rows одного блока (LEFT + RIGHT) на ту же exercise. Каждая half — отдельный exercise row.
- Отличается от `[ each arm ]`: `each arm` — выполнить N раз на каждую руку в одной row; `LEFT/RIGHT ARM` — две отдельные rows с asymmetric distribution.

---

## 3. Equipment / position modifiers

### `[ neutral grip ]`

scope: exercise.
cardinality: 13 occurrences.

examples:

- block-101: `10 strict pull-ups [ neutral grip ]` — указание о grip.
- block-105: `5 strict pull-ups [ neutral grip ]` — то же.

### `[ from box/sofa ]` / `[ from sofa ]` / `[ from sofa/box ]`

distinct strings: 3 variants.

- `[ from box/sofa ]` (14)
- `[ from sofa ]` (10)
- `[ from sofa/box ]` (3)

scope: exercise (position для HSPU).

cardinality: 27.

examples:

- block-007: `14 strict HSPU [ from sofa ]` — HSPU выполняется со стопами на софе.
- block-010: `10 strict HSPU [ from box/sofa ]` — выбор между box и sofa.

### `[ WITHOUT BENCH ]`

scope: exercise.
cardinality: 1 (block-006 / schema-4: `DB single arm row [ WITHOUT BENCH ] [ https://... ] [ each arm ]`).

notes:

- Removal of equipment (без скамьи).

### `[ WITHOUT JUMP ]` / `[ WITHOUT jump ]`

distinct strings: 2 case-variants.

- `[ WITHOUT JUMP ]` (4)
- `[ WITHOUT jump ]` (1)

scope: exercise.
cardinality: 5 occurrences.

examples:

- block-079: `10 burpees [ WITHOUT JUMP ]` — burpee без прыжка.

### `[ kind of wall balls ]`

scope: exercise (substitution-style clarification).
cardinality: 1 (block-071 / schema-1: `DB thrusters [ 1x 15 kg ] [ kind of wall balls ]`).

notes:

- Clarification: thrusters выполняются как wall balls (вариант движения).

### `[ hold farm carry ]`

scope: exercise.
cardinality: 2 occurrences (block-018: `10 DB lunges [ 2x 15 kg ] [ hold farm carry ]`).

notes:

- Гантели держатся в farm-carry позиции.

### `[ hand on DB | neutral grip ]`

scope: exercise (composite: position + grip через `|`).
cardinality: 3 occurrences (block-015, 016, 039 — deficit HSPU).

notes:

- Один из 7 composite annotations с `|` separator (см. §1.8 в schema-content-primitives.md).

### `[ hands on DB ]`

scope: exercise.
cardinality: 1 (block-071 / schema-2: `deficit HSPU [ from sofa ] [ hands on DB ]`).

notes:

- Variant `hand on DB` (single) vs `hands on DB` (plural).

---

## 4. Tempo / pause modifiers

### `[ + N sec pause in UP position ]` / `[ + N sec pause in UP ]`

distinct strings:

- `[ + 2 sec pause in UP position ]` (15)
- `[ + 2 sec pause in UP ]` (8) — variant без `position` suffix
- `[ + 1 sec pause in UP position ]` (3)

scope: exercise (модифицирует tempo каждого rep этого row).

cardinality: 26 occurrences.

examples:

- block-153: `15 seated lateral BANDED raises [ + 2 sec pause in UP ]` — пауза 2 sec в верхней точке.
- block-155: `10 Single Leg KB Hip Thrust [ + 1 sec pause in UP position ] [ each leg ]` — комбинируется с per-leg.

### `[ AFTER each Nth REP - M sec pause ]`

distinct strings:

- `[ AFTER each 5th REP - 5 sec pause ]` (24)
- `[ AFTER each 10th REP - 10 sec pause ]` (5)
- `[ AFTER each 6th REP - 5 sec pause ]` (1)
- `[ AFTER each 9th REP - 10 sec pause ]` (1)

scope: exercise (per-rep modifier; tempo меняется каждое N-е повторение).

cardinality: 31 occurrences.

examples:

- block-153: `20 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]` — каждое 5-е повторение → пауза 5 sec.

### `[ N sec SLOW down ]`

distinct strings:

- `[ 2 sec SLOW down ]` (8)

scope: exercise (tempo modifier на whole row, all reps).

cardinality: 8.

examples:

- block-157: `7 strict DB press + 7 DB push press [ 2x 15 kg ] | [ 2 sec SLOW down ]` — slow eccentric на каждый rep.

notes:

- В block-157 (и других) появляется с inline `|` separator между `[ 2x 15 kg ]` и `[ 2 sec SLOW down ]`. `|` здесь стилистический, не структурный (annotation не одна composite — две независимые `[ ]`).

### `[ N sec HOLD after LAST ]`

distinct strings:

- `[ 15 sec HOLD after LAST ]` (2)

scope: exercise (применяется к последнему rep — hold-after).

cardinality: 2 occurrences (block-165, 190).

examples:

- block-165: `20 single leg GLUTE BRIDGE [ https://... ] [ each leg ] [ 15 sec HOLD after LAST ]` — после последнего повтора — удержать 15 sec.

---

## 5. Sequence indicators (timing / position в block topology)

### `[ before BAR DIPS complex ]`

scope: exercise (positions row в block topology — before another schema in the block).
cardinality: 5 occurrences (block-051, 052, 084, 099, 100).

### `[ after BAR DIPS complex ]`

scope: exercise.
cardinality: 5 occurrences.

### `[ after BAR DIPS complex and before NEXT block ]`

scope: exercise (composite position — sandwiched).
cardinality: 4 occurrences.

examples (для всех 3 sequence-BAR-DIPS variants):

- block-051: `12 strict pull-ups [ before BAR DIPS complex ]` (schema-1).
- block-051: `12 strict pull-ups [ after BAR DIPS complex and before NEXT block ]` (schema-3, middle).
- block-051: `12 strict pull-ups [ after BAR DIPS complex ]` (schema-5, last).

### `[ ONLY ONCE before METCON ]` / `[ ONLY ONCE ]`

distinct strings:

- `[ ONLY ONCE before METCON ]` (2 occurrences, block-006 / schema-1+3)

scope: exercise (positions row uniquely once before main work; modifies repetition rule).

cardinality: 2.

### `[ AFTER EACH ROUND ]`

distinct strings:

- `[ AFTER EACH ROUND ]` (1 occurrence, block-032 / schema-1: `** 5 strict HSPU [ from sofa ] [ AFTER EACH ROUND ]`)

scope: round (per-round modifier — executed после каждого round'а).

cardinality: 1.

### `[ after each GYMNASTICS round ]`

distinct strings:

- `[ after each GYMNASTICS round ]` (2 occurrences, block-093, 095 — внутри `*`-prefixed PLANK row)

scope: round (per-round, applied к specific block-type rounds).

cardinality: 2.

### `[ BEFORE RUN ]` (header annotation, not body)

scope: schema (modifies entire schema's positional role within block).
cardinality: 1 (block-062 / schema-2 header: `3 sets [ BEFORE RUN ]`).

notes:

- Единственная header-level `[ ]` annotation в sample. Schema-level scope (annotates whole `3 sets:` warm-up positioning).

---

## 6. Variant / counter tags

### `[ TOTAL ]`

scope: **schema** (overall counter — reps не per-round, а суммарно за всю schema).
cardinality: 4 occurrences (block-102, 104, 113, 114).

examples:

- block-102 / schema-1: `30 strict HSPU [ TOTAL ]` — 30 — total reps за всю schema (preface перед `3 sets:` GYMNASTICS work).
- block-114 / schema-1: `30 strict NEGATIVE HSPU [ TOTAL ]` — variant.

notes:

- Phase 2.1 ratified [ TOTAL ] делает row структурно отличным от внутренностей следующей `N sets:` ladder — оформлен как separate headerless schema (single-line-total-counter archetype).

### `[ alternative ]`

scope: exercise (variant indicator — упражнение выполняется в alternative форме).
cardinality: 1 occurrence (block-037 / schema-1: `DB Snatches [ 15 kg ] [ alternative ]`).

notes:

- `alternative` — clarification что DB snatches выполняются alternating-style. Различается от exercise name `alt. DB snatches` (block-038, 057, etc.) — там alternating уже в имени.

### `[ alternating ]`

scope: exercise.
cardinality: 0 distinct в `[ ]` (alternating used inside exercise name `alt. DB snatches`, not in bracket).

---

## 7. Effort intensity

### `[ N% Effort ]` / `[ N% EFFORT ]`

distinct strings:

- `[ 75-80% Effort ]` (1, body, block-078 / schema-1)
- `[ 70% EFFORT ]` (0 в body — встречается ТОЛЬКО в block-label `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]`, block-055).

scope (body):

- `[ 75-80% Effort ]` (block-078 / schema-1): **schema** — это первая body line AMRAP 12 min schema, scope = весь AMRAP.

scope (block-label, для reference):

- `[ 70% EFFORT ]`: **block**.

cardinality body: 1.

notes:

- Body-level effort modifier — singleton в sample. Scope = entire schema, наблюдается по position (first body line) и контексту AMRAP.

### `[ EASY PACE ]`

- Не отдельная `[ ]` annotation в body. Является block-label component (`STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]`, block-055). Scope: block.

---

## 8. URL demo references

### `[ https://www.youtube.com/watch?v=... ]` / `[ https://youtu.be/... ]`

distinct URLs: 37.
total inline occurrences: 322.
total `[ URL ]`-only-row occurrences: 50.
total bare-URL occurrences: 2.

scope: exercise (демонстрация техники для ближайшего exercise row — обычно предшествующая или текущая row).

cardinality: 322 inline + 50 standalone + 2 bare = ~374 references.

examples:

- block-153: `10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]` — URL inline на той же row.
- block-153 / schema-2: `[ https://www.youtube.com/watch?v=s3_W2rAbCiA ]` — standalone row, scope = предшествующий row (hamstring curls).
- block-149 / schema-1: `https://youtu.be/Qt1NzbdWSmM?si=NgjjrbU1BmXCioob` — bare URL, scope = entire schema (warm up for feet, нет concrete exercises).

notes:

- 50 standalone `[ URL ]`-only rows — 99% это reference к hamstring curls и hip thrust demos в SUCCESSORY WORK blocks (`s3_W2rAbCiA` для hamstring curls 31x, `UrmwWL1oqKk` для hip thrust 18x).
- Scope (предшествующий row) выводится позицией standalone row сразу под exercise row.

### `[ EXPLODE: URL ]`

distinct strings:

- `[ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ]` (9)

scope: **schema** (labeled URL — applies к Bulgarian split squats whole schema, объясняет explosive технику для последнего шага drop-set).

cardinality: 9 (внутри Bulgarian split squats named schemas: block-008, 021, 058, 069, 071, 072, 074, 078, 059 — всего 9 unique BSS schemas).

---

## 9. Clarifications / examples (with label inside)

### `[ EXAMPLE: ... ]`

distinct strings:

- `[ EXAMPLE: 36... 18... 4... then... 28... 14... 3... etc. ]` (2 occurrences: block-014 / schema-1, block-037 / schema-1)

scope: **schema** (explanatory text для parallel-ladder execution в этой schema).

cardinality: 2.

### EXAMPLE without label prefix

- block-140: `EXAMPLE [ 1 DB hang power clean + 1 DB squat + 1 DB STOH... 2... + 2... + 2... 3...+ 3... + 3... etc ]` — `EXAMPLE` стоит вне `[ ]`, описание progressive sequence внутри.
- block-141: `EXAMPLE [ 1 DB hang power snatches + 1 Db squats... 2 DB hang power snatches + 2 DB squats... 3...+ 3... ]` — same form.

scope: **schema** (объясняет MAX ROUNDS progressive execution).

cardinality: 2.

notes:

- 2 разных form для EXAMPLE: `[ EXAMPLE: ... ]` (annotation form) vs `EXAMPLE [ ... ]` (row form). Семантически identical.

---

## 10. Drop-set program internals

### `[ x N [ weight-1 ] ...then... x N [ weight-2 ] ...then... x N [ EXPLODE / WITHOUT WEIGHT ] ]`

distinct full strings: множество (по weight values), но pattern одинаковый.

scope: **schema** (entire drop-set program — applies к whole named Bulgarian split squats schema).

cardinality: 9 (per named-exercise-program archetype occurrences).

internal sub-annotations:

- `[ DB 2x 15 kg ]` — first-tier weight.
- `[ DB 1x 15 kg ]` — second-tier weight.
- `[ EXPLODE / WITHOUT WEIGHT ]` (9) — final-tier indicator (без веса).

notes:

- Sub-annotations внутри drop-set имеют **rep-stage** scope — каждый relates к одной rep-stage (x5 или x7).
- См. schema-content-primitives.md §9 для full structural breakdown.

---

## 11. Per-set substitution annotations

### `[ *DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS ]`

distinct strings: 1.

scope: **set** (mapping per-set: 1st set X, 2nd set Y, 3rd set Z).

cardinality: 1 (block-020).

### `[ 1 set: bar facing burpees | 2 set: burpee + push ups | 3 set: burpee ]`

distinct strings: 1.

scope: **set**.

cardinality: 1 (block-021).

notes:

- Обе аннотации paired с `*`-prefixed placeholder row выше: `*DB exercise [ 2x 15 kg ]` или `* Burpee variation`. См. schema-content-primitives.md §8.

---

## 12. Other singletons and composite annotations

### `[ 1 HS walk + 2 strict HSPU ]`

scope: exercise (rep-definition: `5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ]` — этот `[ ]` describes что constitutes 1 rep).
cardinality: 1 (block-043).

### `[ 1 ARM HOLD in UP | another ARM DO 5 reps | than opposite | AND + 5 reps BOTH arms ]`

scope: exercise (complex per-arm program annotation).
cardinality: 2 occurrences (block-168, 170).

### `[ another ARM HOLD DB in UP ]`

scope: exercise.
cardinality: 3 occurrences (block-094, 129, 165 — для single ARM bench presses).

### `[ another ARM HOLD KB 24 kg in UP ]`

scope: exercise.
cardinality: 1 (block-133).

### `[ to the parallel ]` (внутри composite `24 kg | to the parallel`)

scope: exercise (depth modifier для KB swings).
cardinality: 1.

### `[ emphasis on the gluteal muscles ]`

scope: exercise.
cardinality: 1 (block-189).

### `[ push press OR push jerk ]`

scope: exercise (alternative inside annotation — `OR` substitution для STOH).
cardinality: 1 (block-140).

---

## 13. Annotations whose scope зависит от контекста (ambiguous)

### `[ N kg ]` — single weight scope:

- Преимущественно exercise (~ 99%).
- Но в block-005 / schema-2 `[ DB 2x 15 kg ]` standalone — multi-row.
- Контекст: position в body. Inline на той же row как exercise → exercise. Standalone row (только `[ ]`-content на строке) → multi-row.

### `[ 2x 15 kg ]` (standalone) vs `[ 2x 15 kg ]` (inline):

- В подавляющем большинстве inline → exercise.
- В block-077 / schema-1: `[ 2x 15 kg ]` отдельной строкой after 3 exercise rows → multi-row scope.

### `[ AFTER each 5th REP - 5 sec pause ]` — round vs exercise:

- Все 24 occurrences — exercise scope (per-row tempo modifier).
- НЕ round-scope (несмотря на слово "each Nth REP"). Применяется в каждый rep этого row, не к round выполнения schema.

### `[ AFTER EACH ROUND ]`:

- Round scope (1 occurrence, block-032).
- Применяется в footnote-row `** 5 strict HSPU [ from sofa ] [ AFTER EACH ROUND ]` — это additional movement выполняемое после каждого round'а ladder-ascending.

### `[ after each GYMNASTICS round ]`:

- Round scope (2 occurrences).
- Footnote-row `* 30 sec PLANK + ...` выполняется после каждого gymnastics round'а.

### `[ ONLY ONCE before METCON ]`:

- Schema scope (entire single row — выполняется один раз, как opening warm-up для METCON).
- Cardinality 2 (block-006 / schema-1+3, opening pull-ups).

---

## Summary

**Total distinct body `[ ]`-annotations**: 107.
**Total occurrences**: ~620.

### Scope distribution (по distinct annotations)

| scope                     | distinct count | total occurrences                                                                                                                                                |
| ------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **exercise**              | 91             | ~480                                                                                                                                                             |
| **schema**                | 8              | ~22 (TOTAL 4 + EXPLODE 9 + EXAMPLE 2 + EXAMPLE-row 2 + 75-80% Effort 1 + drop-set whole 9 (counted under schema) + ONLY ONCE 2) — overlap по drop-set, see below |
| **round**                 | 2              | 3 (AFTER EACH ROUND 1 + after each GYMNASTICS round 2)                                                                                                           |
| **set**                   | 2              | 2 (per-set substitution: DB exercise + Burpee variation)                                                                                                         |
| **multi-row**             | 2              | 2 (standalone weight rows: block-005, 077)                                                                                                                       |
| **block** (header только) | 1              | 1 (BEFORE RUN)                                                                                                                                                   |

(URLs включены в exercise scope: ~322 inline URLs scope-exercise + 50 standalone URLs scope-exercise.)

Schema-scope occurrences (8 distinct):

- `[ TOTAL ]` (4) — overall-counter schema scope.
- `[ EXPLODE: URL ]` (9) — within drop-set program, applies к entire BSS schema.
- `[ EXAMPLE: ... ]` (2) — parallel-ladder explanation.
- `EXAMPLE [ ... ]` (2) — progressive-ladder explanation.
- `[ 75-80% Effort ]` (1) — AMRAP effort.
- `[ ONLY ONCE before METCON ]` (2) — schema timing.

(Drop-set whole program внутри annotation — counted as schema-level, но technically annotation pattern, не отдельная `[ ]` string.)

### Annotations с ambiguous scope, требующие контекстного rule

- `[ N kg ]` / `[ 2x N kg ]` / `[ DB 2x N kg ]`: inline = exercise; standalone row = multi-row.
- `[ AFTER each Nth REP - M sec pause ]`: exercise (per-rep modifier on single row), несмотря на naming "each Nth".

### Annotations с `|` separator (composite внутри одной аннотации)

7 distinct strings, см. §1, §3, §11:

- `[ hand on DB | neutral grip ]` (3)
- `[ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]` (2)
- `[ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ]` (2)
- `[ 24 kg | to the parallel ]` (1)
- `[ 1 ARM HOLD in UP | another ARM DO 5 reps | than opposite | AND + 5 reps BOTH arms ]` (2)
- `[ *DB exercise: 1st set ... | 2nd set ... | 3rd set ... ]` (1)
- `[ 1 set: ... | 2 set: ... | 3 set: ... ]` (1)

Total: 12 occurrences (7 distinct).

### Annotation-как-row (standalone `[ ... ]` row, не attached к exercise)

Total: 66 occurrences. Включает:

- 50 `[ URL ]`-only standalone (scope = previous exercise row).
- 9 `[ EXPLODE: URL ]` (scope = whole BSS schema).
- 4 `[ EXAMPLE: ... ]` (scope = whole schema).
- 2 per-set substitution annotations (scope = set).
- 1 `[ 75-80% Effort ]` (scope = whole AMRAP schema).
- 2 standalone weight rows `[ 2x 15 kg ]` / `[ DB 2x 15 kg ]` (scope = multi-row).
- 1 `[ EXPLODE: URL ]` ×9 — see drop-set program.

(Numbers reconcile при removal of duplicates через distinct: 50 URLs + 9 EXPLODE + 4 EXAMPLE + 2 substit + 1 Effort + 2 standalone weights = 68 — small overcount, raw output: 66 lines fully consist of just `[ ... ]`.)
