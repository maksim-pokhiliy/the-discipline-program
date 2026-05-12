# Schema content primitives (Phase 3.1)

Каталог типов structural elements, встречающихся внутри `body` schemas, выведенный из 337 schemas Phase 2.1 разметки (312 top-level + 25 sub-schemas). Phase 3.1 — inventory типов; модель / классификация first-class vs second-class — Phase 4 / Phase 5.

Source-reference: `schema-boundaries.md` → block-NNN / schema-N [/ sub-K].

Все cardinality считаются по occurrences в body (включая внутри nested sub-schemas). Header-уровень считается отдельно где это структурно различимо.

---

## 1. Exercise rows

description: основной structural element body. Строка с упражнением (имя + опциональные modifiers + опциональный URL), которой обычно (но не всегда) предшествует число повторов или unit-bound count.

sub-types по naming pattern:

- **N count + exercise + modifiers**: типовая форма, ~80% всех exercise rows.
- **range count + exercise + modifiers**: `10-15 single leg GLUTE BRIDGE [ each leg ]`.
- **N unit + exercise**: `5 km run`, `5 km RUN` — count с явной единицей.
- **distance / modality token**: `RUN 5-7 km`, `RUN 5 km`, `RUN`, `3-5 km run` — modality token с distance (см. также §7).
- **implicit count (no leading number)**: упражнение без префикса reps; rep-count извлекается из ladder marker сверху или зависит от schema header. Например `strict HSPU`, `DB Thrusters`, `bar dips + traverses + turn back 180* + traverses`, `burpees over DB`.
- **placeholder phrase**: см. §10 (semantic-free placeholders).

examples (3 разных archetype контекстa):

- block-001 / schema-1 / row 2: `10 DB bench presses [ 2x 15 kg ]` (integer count + weight)
- block-068 / schema-1: `3-5 km run` (range distance modality)
- block-005 / schema-1: `DB Thrusters` (implicit count — наследует от `12-9-6:` ladder marker сверху)
- block-153 / schema-1: `10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]` (integer + per-arm + URL)

cardinality (approximate, по rep-notation):

- integer-count rows: 684
- implicit-count rows: 141
- range-count rows: 25
- **total exercise rows**: ~850

observations:

- ~28% exercise rows имеют inline `[ ]` weight annotation; ~72% — без явного веса (либо bodyweight, либо weight указан standalone-row ниже / в header / unspecified).
- Implicit-count rows доминируют в schemas с outer ladder markers (parallel-ladders, ladder-descending sub-schemas) — там rep-count наследуется из `N-M-K:` маркеров сверху.

---

## 2. Rep notations

description: способы указания количества повторов на одну row.

sub-types:

### 2.1 Integer count

- pattern: `N exercise`
- examples: `10 DB bench presses`, `5 strict pull-ups`, `100 jumping Jacks`, `30 strict HSPU [ TOTAL ]`
- cardinality: 684

### 2.2 Range count

- pattern: `N-M exercise`
- examples: `10-15 single leg GLUTE BRIDGE`, `10-15 push ups`, `10-15 strict bar dips`, `15-20 DB leg extension`, `10-12 DB Horn Grip Shoulder Front Raise`
- cardinality: 25

### 2.3 Unit-bound count (sec / min / km)

- pattern: `N <unit> exercise` — count с явной единицей измерения (не reps, а time/distance).
- examples in body:
  - `30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK` (block-093, block-095) — внутри `*`-prefixed footnote row
  - `5 km run` (block-064), `5 km RUN` (block-075, block-076) — внутри run-distance archetype
  - `RUN 5-7 km`, `RUN 5 km`, `RUN 10 km`, `RUN 7 km`, `RUN 5-6 km`, `3-5 km run` — distance в exercise-row
- cardinality: 14 (3 km-rows variant `N km run` + 8 `RUN N km` + 3 sec-prefixed plank rows внутри `*` footnote rows)
- observation: km-prefix bodies лежат внутри dedicated run-distance archetype (см. archetype-run-distance, 11 schemas).

### 2.4 MAX-notation

- pattern: `MAX <exercise>`, `MAX ROUNDS in remaining time: <progression>`, `MAX <exercise> in remaining time`
- examples:
  - block-080 / schema-1 / sub-3: `MAX DB FRONT SQUATS [ 2x 15 kg ]` (внутри EMOM sub-min slot)
  - block-140 / schema-1: `MAX ROUNDS in remaining time: 1-2-3-4-5 etc. [ 2x 15 kg ]` (progressive ladder seed)
  - block-141 / schema-1: `MAX ROUNDS in remaining time: 1-2-3-4-5 etc. [ 2x 15 kg ]` (mirror 140)
  - block-143 / schema-1: `MAX strict HSPU in remaining time` (max-tail после fixed reps)
- cardinality: 4
- observation: 3 разных под-формы MAX:
  - bare `MAX <exercise> [ weight ]` (block-080, 1 occurrence)
  - `MAX ROUNDS in remaining time: <seed>` (block-140, 141, 2 occurrences)
  - `MAX <exercise> in remaining time` (block-143, 1 occurrence)

### 2.5 Implicit count (no leading number)

- pattern: упражнение названо без префикса reps, rep-count наследуется из outer ladder marker / schema header / композитной row выше.
- examples:
  - block-005 / schema-1: `DB Thrusters` (rep-count наследуется из `12-9-6:` ladder выше)
  - block-091 / schema-1: `bar dips`, `pull-ups` (наследуют `10-9-8-7-6-5-4-3-2-1:` outer header)
  - block-051 / schema-2: `bar dips + traverses + turn back 180* + traverses` (наследует `12-9-6:` header)
  - block-014 / schema-1: `strict HSPU` (наследует `5-4-2:` ladder marker)
- cardinality: 141

### 2.6 Range-with-per-limb

- pattern: `N-M exercise [ each leg ]` — range count, каждое значение применяется к одной ноге.
- examples: `10-15 single leg GLUTE BRIDGE [ each leg ]` (×14 occurrences через 7 warm-up-related schemas)
- cardinality: 14
- observation: общий total = 2× значения (по N-M reps на каждую ногу).

---

## 3. Weight notations (внутри `[ ]`)

description: способы указания веса в inline `[ ]`-annotation на exercise row.

sub-types:

### 3.1 Single dumbbell / single weight `[ N kg ]`

- examples: `[ 15 kg ]` (18 occurrences), `[ 17.5 kg ]` (0 — отсутствует в sample, всё 15 kg доминирует), `[ 24 kg ]` (19 occurrences, обычно KB).
- cardinality: 37 (18+19)

### 3.2 Dual dumbbells `[ 2x N kg ]`

- pattern variations:
  - `[ 2x 15 kg ]` (157 occurrences) — каноничный паттерн.
  - `[ 2x15 kg ]` (6 occurrences) — без пробела, считаем эквивалентным `[ 2x 15 kg ]` (опечатка в исходнике).
- cardinality: 163

### 3.3 Single arm `[ 1x N kg ]`

- examples: `[ 1x 15 kg ]` (14 occurrences).
- cardinality: 14
- observation: используется для single-arm движений (DB snatches alt., DB power snatches).

### 3.4 DB-prefixed standalone weight `[ DB 2x N kg ]` / `[ DB 1x N kg ]`

- examples:
  - `[ DB 2x 15 kg ]` (19 occurrences) — обычно standalone row после серии exercises (block-027, 028, 029, ...).
  - `[ DB 1x 15 kg ]` (9 occurrences) — внутри Bulgarian split squats drop-set program.
- cardinality: 28
- observation: `DB` prefix используется когда нужно явно отличить DB от KB в контексте, где может быть оба.

### 3.5 Kettlebell `[ N kg ]` (контекстуально)

- pattern совпадает с single-dumbbell `[ N kg ]`, но в контексте KB-движений (`24 kg` доминирует).
- cardinality: учтено в 3.1.
- observation: structurally не отличается от single dumbbell — оба single weight notation. Контекст (`KB swings`, `KB clean & push press`) уточняет инструмент.

### 3.6 Dual-value weight `[ X/Y kg ]`

- pattern: `[ N/M kg ]`
- examples: `[ 50/30 kg ]` (block-003 / schema-2: `overhead squats [ 50/30 kg ]`)
- cardinality: 1
- observation: см. edge-cases. Per main-session guidance: НЕ интерпретируется как RX/scaled или M/F однозначно — это dual-value notation с резолвцией откладываемой на athlete context.

### 3.7 Composite split-tier weight `[ N kg + M kg ]`

- pattern: `[ A KB N kg + B DB M kg ]` — комбинация двух весов в рамках одного сета.
- examples: `[ 5 KB 24 kg + 10 DB 15 kg ]` (6 occurrences) — для single arm row, 5 reps с KB 24 kg + 10 reps с DB 15 kg.
- cardinality: 6
- observation: composite notation, отличная от sequential weight progression (drop-set).

### 3.8 Composite weight + arm-split `[ N kg | side instruction ]`

- pattern: weight + `|` + per-arm modification.
- examples (2 distinct, 4 occurrences):
  - `[ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]` (2 occurrences в block-123)
  - `[ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ]` (2 occurrences в block-123)
- cardinality: 4
- observation: composite annotation с `|` separating параметры — единственный паттерн где `|` действительно делит несвязанные параметры в `[ ]`.

### 3.9 Standalone weight row `[ N kg ]` или `[ DB Nx K kg ]` на отдельной строке

- pattern: annotation row, применяется к преципитирующим exercise rows в той же schema.
- examples:
  - block-005 / schema-2 (тогда `[ DB 2x 15 kg ]` после ladder rows)
  - block-077 / schema-1 (`[ 2x 15 kg ]` после `12 deadlifts / 9 hang cleans / 6 push presses`)
- cardinality: 2

### 3.10 No-weight indicator `[ WITHOUT WEIGHT ]`

- pattern: явное отсутствие веса (внутри Bulgarian split squats drop-set program).
- examples: `EXPLODE / WITHOUT WEIGHT` (внутри drop-set annotation, 9 occurrences).
- cardinality: 9 (внутри vложенного drop-set, не как самостоятельная weight annotation).

### 3.11 Implicit no-weight (no annotation)

- pattern: упражнение без `[ kg ]` annotation; либо bodyweight movement (`strict pull-ups`, `burpees`, `air squats`), либо weight underspecified.
- cardinality: ~614 exercise rows без weight bracket (78% всех exercise rows).
- observation: контекстуальная интерпретация. Bodyweight движения никогда не получают `[ kg ]`. Некоторые DB-movements могут не получать annotation если контекст устанавливает default (`DB Thrusters` без weight в block-005 — weight указан standalone row ниже).

### 3.12 Singletons / non-standard weight notations

- `[ 24 kg | to the parallel ]` (1 occurrence, block-189) — composite: weight + depth-modifier через `|`.
- `[ another ARM HOLD KB 24 kg in UP ]` (1 occurrence, block-133) — weight встроен в arm-action description.

---

## 4. Compound rows (`+` connector)

description: связка двух или более elements в одну compound-rep / chain. Подробный анализ — `compound-and-alternative.md`.

cardinality: 97 distinct compound rows.

sub-types (резюме, развёрнуто в compound-and-alternative.md):

- **paired (1 `+`, 2 elements)**: 49 rows
- **chained (2 `+`, 3 elements)**: 20 rows
- **repeated/extended (3+ `+`, 4+ elements)**: 28 rows
  - 21 из них следуют pattern `traverses + N bar dips + traverses + M bar dips` (repeated-pattern)

example forms:

- `5 strict DB press + 5 DB push press`
- `30 DB hang power clean + DB push press`
- `traverses + 8 bar dips + traverses + 7 bar dips`
- `bar dips + traverses + turn back 180* + traverses`
- `5 DB bench presses [ 2x 15 kg ] + 10 plyo push ups + 5 DB bench presses [ 2x 15 kg ]`

---

## 5. Alternative rows (`OR` connector)

description: substitution choice внутри одной row — «exercise A OR exercise B».

cardinality: 3 distinct rows, все в GYMNASTICS блоках.

examples:

- block-105 / schema-2: `5 strict bar dips OR 10 push ups`
- block-112 / schema-2: `10 strict bar dips OR 20 push ups`
- block-115 / schema-2: `5 strict bar dips OR 10 push ups`

observation: alternative — substitution семантика, релевантна для будущей scaling/substitution фичи (атлет выбирает). Также 1 singleton `[ push press OR push jerk ]` внутри annotation (block-140).

---

## 6. Modifier annotations (`[ ]`-content) — общий каталог

description: inline-аннотации в квадратных скобках. Полный каталог с scope — в `modifier-scope.md`. Здесь — высокоуровневая категоризация по типу содержимого.

cardinality: 107 distinct annotation strings в body + 1 distinct в header (`BEFORE RUN`).

families:

### 6.1 Weight annotations

- См. §3. Cardinality: ~250 occurrences (доминируют `[ 2x 15 kg ]`, `[ 24 kg ]`, `[ 15 kg ]`).

### 6.2 Side / per-limb modifiers

- distinct strings: 14 (`each leg`, `each arm`, `5 each arm`, `9 each arm`, `7 each arm`, `10 each arm`, `15 each arm`, `4 each leg`, `5 each leg`, `6 EACH leg`, `5 each LEG`, `15 reps each leg`, `LEFT ARM`/`LEFT arm`, `RIGHT ARM`/`RIGHT arm`).
- Cardinality: ~180 occurrences (доминирует `each leg` — 105, `each arm` — 45).

### 6.3 Equipment / position

- distinct strings: 11 (`neutral grip`, `from sofa`, `from box/sofa`, `from sofa/box`, `WITHOUT BENCH`, `WITHOUT JUMP`/`WITHOUT jump`, `kind of wall balls`, `hold farm carry`, `hand on DB`, `hands on DB`, `hand on DB | neutral grip`).
- Cardinality: ~60 occurrences.

### 6.4 Variant / direction

- distinct strings: 3 (`alternative` 1x, `alternating` 0x в body — alternation встречается в `alt.`-prefixed exercise names, не в `[ ]`).
- Cardinality: ~3 occurrences.

### 6.5 Tempo / pause modifiers

- distinct strings: 6
  - `+ 2 sec pause in UP position` (15) / `+ 2 sec pause in UP` (8) — duplicate с `position` опускаемым.
  - `+ 1 sec pause in UP position` (3)
  - `AFTER each 5th REP - 5 sec pause` (24)
  - `AFTER each 10th REP - 10 sec pause` (5)
  - `AFTER each 6th REP - 5 sec pause` (1)
  - `AFTER each 9th REP - 10 sec pause` (1)
  - `2 sec SLOW down` (8) — applies на whole row, не на конкретную позицию.
  - `15 sec HOLD after LAST` (2) — applies к последнему повтору.
- Cardinality: ~67 occurrences.

### 6.6 Sequence indicators (position-in-block timing)

- distinct strings: 6
  - `before BAR DIPS complex` (5)
  - `after BAR DIPS complex` (5)
  - `after BAR DIPS complex and before NEXT block` (4)
  - `ONLY ONCE before METCON` (2)
  - `AFTER EACH ROUND` (1)
  - `after each GYMNASTICS round` (2)
- Cardinality: 19 occurrences.

### 6.7 Variant / counter tag

- distinct strings: 1 (`TOTAL`).
- Cardinality: 4 (block-102, 104, 113, 114).
- observation: маркер означает «reps — общий counter за всю schema, не per-round». Делает row структурно distinct prefix.

### 6.8 Effort intensity

- distinct strings: 1 в body (`75-80% Effort`).
- Cardinality: 1 occurrence (block-078 / schema-1, AMRAP-flat).
- observation: применяется к schema-level (entire AMRAP). `[ 70% EFFORT ]` — block-label level, не body (block-055 STRENGTH ENDURANCE | EASY PACE).
- `[ EASY PACE ]` отсутствует в body — встречается только в block-label `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]`.

### 6.9 URL demo links

- distinct strings: 37 distinct URLs.
- Cardinality: 322 inline + 50 standalone `[ URL ]`-only-line + 2 bare URLs (без `[ ]`) = ~374 URL references.
- observation: youtube.com/watch и youtu.be/ форматы; 1 URL имеет inline label `EXPLODE: <url>` (9 occurrences).

### 6.10 Clarifications / examples (with label inside annotation)

- distinct strings: 5
  - `EXAMPLE: 36... 18... 4... then... 28... 14... 3... etc.` (2) — explains parallel-ladder execution.
  - `EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc` (9) — labeled URL for explosive technique.
  - `1 DB hang power clean + 1 DB squat + 1 DB STOH... 2... + 2... + 2... 3...+ 3... + 3... etc` (1) — block-140 EXAMPLE annotation (но без `EXAMPLE:` префикса, просто описание).
  - `1 DB hang power snatches + 1 Db squats... 2 DB hang power snatches + 2 DB squats... 3...+ 3...` (1) — block-141.
- Cardinality: ~13 occurrences.

### 6.11 Composite annotations (с `|` внутри)

- distinct strings: 7 (см. также §3.8 и compound-and-alternative.md):
  - `hand on DB | neutral grip` (3) — equipment + grip.
  - `*DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS` (1) — per-set substitution.
  - `1 set: bar facing burpees | 2 set: burpee + push ups | 3 set: burpee` (1) — per-set substitution.
  - `15 kg | LEFT arm DO | RIGHT arm HOLD in UP` (2) — weight + arm split (block-123).
  - `15 kg | RIGHT arm DO | LEFT arm HOLD in UP` (2) — weight + arm split (block-123).
  - `1 ARM HOLD in UP | another ARM DO 5 reps | than opposite | AND + 5 reps BOTH arms` (2) — complex per-arm program.
  - `24 kg | to the parallel` (1) — weight + depth modifier.
- Cardinality: 12 occurrences.

### 6.12 Singleton annotations

- distinct strings (singletons / 1-2 occurrences с уникальной семантикой):
  - `1 HS walk + 2 strict HSPU` (1, block-043) — compound-rep definition внутри `[ ]` (см. §11).
  - `kind of wall balls` (1, block-071) — substitution clarification.
  - `another ARM HOLD DB in UP` (3, block-094, 129, 165 etc.) — per-arm action.
  - `another ARM HOLD KB 24 kg in UP` (1, block-133) — variant с weight.
  - `to the parallel` (within composite `24 kg | to the parallel`).
  - `emphasis on the gluteal muscles` (1, block-189).
  - `push press OR push jerk` (1, block-140) — `OR` внутри annotation.
  - `EXPLODE / WITHOUT WEIGHT` (9) — drop-set last-step indicator с `/` separator.
- Cardinality: ~20 occurrences across singletons.

---

## 7. Inline rest markers

description: маркеры отдыха между sets/rounds внутри body. Распознаются по pattern `^- ... -$` или `^- REST ... -$` (с `rest`/`REST` keyword).

cardinality: 71 occurrences, 17 distinct strings (после нормализации dash-trim).

distinct strings (по убыванию частоты):

- `- rest UNTIL recovery -` (15) / `- rest until recovery -` (3) — case variant. Combined: 18.
- `- 5 min rest in between sets -` (12)
- `- REST IN BETWEEN SETS UNTIL RECOVERY -` (9) / `- REST UNTIL RECOVERY -` (1)
- `- 2 min rest -` (5)
- `- 3 min rest in between sets -` (4) / `- 3 min rest in between sets-` (3, без пробела перед закрытием) = 7 combined.
- `- 5 min rest in between -` (3)
- `- 2 min rest in between rounds -` (3) / `- 3 min rest in between rounds -` (1)
- `- 2 min rest in between sets -` (2)
- `- 3 min REST -` (2)
- `- 5 min rest AFTER 3RD SET -` (2)
- `- 5 min rest -` (1)
- `- 90 sec rest in between sets -` (1)
- `- 90 sec - 2 min rest in between sets -` (1)
- `- 90 sec REST -` (1)
- `- 2 min REST -` (1)
- `- 5-7 min rest in between sets -` (1)

observations:

- Scope в большинстве случаев — между sets/rounds той же schema (in between sets/rounds variant). 2 special: `- 5 min rest AFTER 3RD SET -` (фиксированный set index).
- Variants регистра ("rest" vs "REST", "UNTIL" vs "until") сосуществуют — это writing inconsistency, не структурное различие.
- Whitespace variant `in between sets-` vs `in between sets -` — typo в источнике, считаем эквивалентным.

---

## 8. Per-set substitution placeholder + annotation

description: placeholder упражнения (row начинается с `*` или содержит `Burpee variation` etc.) + следующий row — annotation в `[ ]` с per-set mapping `1 set: ... | 2 set: ... | 3 set: ...`.

cardinality: 2 distinct patterns, 2 occurrences (block-020, block-021).

examples:

block-020 / schema-1 / sub-1:

```
*DB exercise  [ 2x 15 kg ]
[ *DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS ]
```

block-021 / schema-1 / sub-1:

```
* Burpee variation
[ 1 set: bar facing burpees | 2 set: burpee + push ups | 3 set: burpee ]
```

observation: structural primitive — 2-row composite (placeholder row + annotation row). Annotation row сам по себе body line (66 raw lines из output), но семантически это extension placeholder row. Phase 5: модель может потребовать «slot upgrade» — placeholder exercise становится first-class slot с per-set instances.

---

## 9. Drop-set program внутри annotation (`Bulgarian split squats`)

description: вложенная sets×reps×weight программа в одной `[ ]`-annotation. Появляется только внутри named-exercise-program archetype (Bulgarian split squats:).

structural form:

```
3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]
```

decomposition:

- `3 sets` — outer count.
- `[ x5 [ weight-1 ] ...then... x5 [ weight-2 ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT ] ]` — 3-этапная drop-set per set:
  - x5 с `DB 2x 15 kg`
  - drop weight → x5 с `DB 1x 15 kg`
  - drop weight → x5 explode без веса
- separator: `...then...` (specific этой annotation, не connector между schemas).

variants per occurrences:

- `x5` × 6 occurrences (block-008, 021, 058, 071, 078)
- `x7` × 3 occurrences (block-059, 069, 072, 074) — увеличенный rep count.

cardinality: 9 occurrences total.

observation: nested schema-like структура внутри `[ ]` annotation — единственный паттерн где annotation содержит вложенную programmable structure. Phase 5: модель weights должна поддерживать stepped drop-set sequence как first-class structure или как nested annotation.

---

## 10. Placeholder phrases (semantic-free rows)

description: rows без конкретного exercise / reps, обозначающие «выбери что-то из этой категории».

distinct phrases:

- `ANY exercise for ABS` (5 occurrences в block-193, 194, 195, 196, 197 — все CORE MUSCLES).
- `biceps / triceps` (1 occurrence в block-152 — SUCCESSORY WORK).

cardinality: 6 rows.

variants:

- bare `ANY exercise for ABS` (block-193, 197).
- compound с конкретным exercise: `ANY exercise for ABS + DB seated good morning` (block-194, 195, 196) — semantic-free часть + concrete row через `+` connector.

observation: 2 разных слот-семантики:

- Muscle-group reference (`biceps / triceps`) — выбор из muscle-group.
- Category-by-purpose (`ANY exercise for ABS`) — выбор из purpose-category.

Phase 4 / Phase 5: формализовать placeholder семантику (coach-choice slot или athlete-choice slot, или просто free-text reference).

---

## 11. Curly braces `{ ... }` — rep-definition

description: фигурные скобки определяют «compound-action = 1 rep».

cardinality: 2 occurrences, 1 distinct pattern (DB Renegade row).

examples:

- block-125 / schema-3: `30 DB Renegade row [ URL ] { 1 push up + each arm row = 1 rep }`
- block-138 / schema-3: `DB Renegade row [ URL ] { 1 push up + each arm row = 1 rep }` (implicit count из header `3x 10 reps:`)

observation: `{ ... = 1 rep }` — singleton structural form. Phase 5 эскалация: возможна параллель с inline-`5 reps = 1 rep` rep-definition (см. §12) — обе formalize-able как rep-definition primitive.

---

## 12. Inline rep-definition (`N reps = 1 rep`)

description: equality definition внутри body row, объясняющая что считается за 1 rep.

cardinality: 1 occurrence.

example:

- block-043 / schema-1: `5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ] [ from box/sofa ]`

observation: семантически родственно curly-brace rep-definition §11 — оба объясняют composite-action как 1 rep. Структурно различаются: `{ ... }` стоит после exercise row как trailing annotation, `N reps = 1 rep [ composite ]` сам является independent row.

---

## 13. Standalone URL rows (URL как самостоятельная row)

description: row, содержащая только URL (с `[ ]` оболочкой или без).

sub-types:

### 13.1 `[ URL ]` standalone

- cardinality: 50 lines.
- examples: `[ https://www.youtube.com/watch?v=s3_W2rAbCiA ]` после hamstring curls rows в SUCCESSORY blocks (31 occurrences для этого specific URL).
- scope: применяется к предшествующему exercise row (демонстрация техники).

### 13.2 Bare URL (без `[ ]`)

- cardinality: 2 lines.
- occurrences:
  - block-149 / schema-1: `https://youtu.be/Qt1NzbdWSmM?si=NgjjrbU1BmXCioob`
  - block-149 / schema-1: `https://youtu.be/VX1euygufcY?si=33QNST7ctqlYtxa2`
- scope: stand-alone reference rows (block-label `warm up for feet`).
- observation: bare URLs встречаются только в block-149 (warm up for feet) и block-147 (YOGA TIME — там URL в `[ ]`).

### 13.3 Labeled URL `[ EXPLODE: URL ]`

- cardinality: 9 occurrences (только в Bulgarian split squats schemas).
- example: `[ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ]`
- scope: explosive technique для Bulgarian split squats `EXPLODE / WITHOUT WEIGHT` шаг.

---

## 14. Footnote-style annotations (`*` / `**` prefix rows)

description: rows с leading `*` или `**` — footnote-style row, обычно с round-scope per-round modifier.

cardinality: 7 occurrences.

distinct rows:

- block-020 / schema-1 / sub-1: `*DB exercise  [ 2x 15 kg ]` — per-set substitution placeholder (see §8).
- block-021 / schema-1 / sub-1: `* Burpee variation` — per-set substitution placeholder.
- block-032 / schema-1: `** 5 strict HSPU [ from sofa ] [ AFTER EACH ROUND ]` — per-round modifier (`**` double-star prefix, unique).
- block-086 / schema-1: `*100 single unders AFTER each set` — per-set footnote (no `[ ]` wrap, plain text suffix).
- block-093 / schema-1: `* 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK [ after each GYMNASTICS round ]`
- block-095 / schema-1: same as 093 (mirror).
- block-096 / schema-1: `*150 single unders AFTER each set`

observations:

- 3 sub-paterns:
  - placeholder (block-020, 021): expanded через annotation на следующей row.
  - per-set/round modifier (block-032, 086, 093, 095, 096): defines что делать после каждой round/set.
- `*` prefix часто (но не всегда) сопровождается `[ ]` annotation с round-scope keyword (`AFTER EACH ROUND`, `after each GYMNASTICS round`) или inline text suffix (`AFTER each set`).

---

## 15. Inner ladder markers (внутри body)

description: строки `N-M-K:` (или N-M-K-L-...) как separate body line внутри schema. Maркируют ступени parallel-ladders archetype.

cardinality: 38 body-line occurrences (внутри ~15 schemas, обычно по 2 marker rows per schema).

distinct patterns:

- `12-9-6:`, `6-9-12:` (block-005)
- `18-14-10:`, `9-7-5:` (block-008, 010, 013)
- `20-16-12:`, `5-4-2:` (block-014)
- `14-10-6:`, `7-5-3:` (block-023)
- `36-28-20:`, `18-14-10:`, `4-3-2:` (block-037)
- `36-28-20:`, `18-14-10:`, `9-7-5:` (block-038)
- `11-9-7-5-3:`, `22-18-14-10-6:` (block-085, 092, 093, 094, 097)
- `3-6-9-12-9-6-3:` (×2, block-087)
- `10-8-6-4-2:`, `20-16-12-8-4:` (block-107, 108, 109)
- `11-9-7-5:`, `22-18-14-10:` (block-097)

observation: эти markers — structural separators внутри parallel-ladder archetype body. Они не exercise rows и не [ ] annotations — это independent inner ladder header markers.

---

## 16. Connector lines `then:` / `...then...:` / `...then N rounds:` (внутри body)

description: connector lines внутри body schema (помещённые в конец body предыдущей schema per Phase 2.1 case-then-connector).

cardinality:

- `then:` standalone: 9 occurrences (block-051, 052, 084, 099, 100 — gymnastics complexes).
- `...then...:` standalone: 2 occurrences (block-006).
- `...then N rounds:` / `...THEN N rounds:` / `...then N ROUNDS:` continuation: 5 occurrences (внутри composite-intervals-then-rounds или composite-rounds-with-rest):
  - block-015: `...then 2 rounds:`
  - block-016: `...then 3 ROUNDS:`
  - block-019: `...then 2 rounds:`
  - block-030: `...THEN 2 rounds:`
  - block-039: `...then 2 rounds:`

distinct connectors: 4 forms (`then:`, `...then...:`, `...then N rounds:`, и regex-variants по case).

observation: connector lines structurally distinct от exercise rows — они boundary marker (хотя и хранятся в body per Phase 2.1 ratified decision).

---

## 17. EMOM sub-min headers внутри body

description: НЕ применимо к Phase 3.1 — sub-min headers (`1 min:`, `1st & 2nd min:` etc.) являются `header` поле sub-schema внутри nested EMOM, не body content. Упомянуто здесь для полноты — Phase 3.1 не учитывает их как primitive в body level.

---

## 18. Unique singletons (структурные элементы с cardinality=1)

(Полный список singleton edge-cases — `edge-cases.md`.)

В body встречены следующие structural singletons:

- `[ 50/30 kg ]` — dual-value weight (1).
- `5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ] [ from box/sofa ]` — inline rep-definition row (1).
- `[ 75-80% Effort ]` — body-level effort modifier (1, block-078).
- `{ 1 push up + each arm row = 1 rep }` — curly-brace rep-definition (2 occurrences with same pattern).
- `MAX <exercise>` без `in remaining time` (1, block-080 sub-3) vs `MAX ROUNDS in remaining time:` (2) vs `MAX <exercise> in remaining time` (1) — три разных под-формы MAX.
- `[ push press OR push jerk ]` — OR внутри annotation (1, block-140).
- `EXPLODE / WITHOUT WEIGHT` — `/` separator внутри annotation (9 occurrences but only one structural pattern within drop-set program).

---

## Summary

- **Total primitive types**: 18 (Exercise rows + 6 rep notation sub-types + 12 weight sub-types + Compound `+` + Alternative `OR` + Modifier annotations + Inline rest markers + Per-set substitution placeholder + Drop-set program + Placeholder phrases + Curly braces + Inline rep-definition + Standalone URL rows + Footnote `*` rows + Inner ladder markers + Connector lines + EMOM sub-min headers + Singletons).
- **Total exercise rows**: ~850 (684 integer + 141 implicit + 25 range).
- **Total `[ ]`-annotations in body**: ~620 occurrences across 107 distinct strings.
- **Total `[ ]`-annotations in header**: 1 occurrence (`BEFORE RUN`).
- **Total compound `+` rows**: 97 (paired 49 / chained 20 / repeated-pattern 28).
- **Total alternative `OR` rows**: 3.
- **Total inline rest markers**: 71 across 17 distinct strings.
- **Total connector lines**: 16 (`then:`/`...then...:` 11 + `...then N rounds:` 5).
- **Total standalone URL rows**: 52 (`[ URL ]` 50 + bare URL 2).
- **Total inner ladder markers**: 38 body-line occurrences.
- **Total `*`/`**`-prefixed rows\*\*: 7.
- **Total `ANY exercise` placeholder rows**: 5 + 1 muscle-group reference = 6.
- **Total curly-brace rows**: 2.
- **Total inline rep-definition (`N reps = 1 rep`)**: 1.
- **Total drop-set programs внутри annotation**: 9 occurrences (1 structural pattern, 2 numeric variants x5/x7).
- **Total per-set substitution placeholder + annotation**: 2 (block-020 DB-exercise, block-021 Burpee variation).
- **Total dual-value weight `[ X/Y kg ]`**: 1.
- **Total body-level effort modifier**: 1 (`75-80% Effort`).
- **Total bodies analysed**: 321 non-empty bodies (внутри 337 schemas — некоторые sub-schemas разделяют body parsing).

Все cardinality — occurrences (не distinct schemas).
