# Edge cases

Все случаи, требующие явного решения / привлечения внимания основной сессии. Inventory-фаза не классифицирует и не решает — фиксирует наблюдения.

## Подозрительные дубли labels

### Basic GYMNASTICS vs GYMNASTICS

- `Basic GYMNASTICS:` (24 unique location'ов, всё на WEDNESDAY или SATURDAY) и `GYMNASTICS:` (26 location'ов, всё на SATURDAY после run).
- Содержание различается стабильно:
  - **Basic GYMNASTICS** на WED: pull-ups + bar dips + traverses (силовая база). На SAT: только в sheet-26/29/32 — короткий формат с C2B pull-ups + bar dips.
  - **GYMNASTICS** на SAT: pull-ups (neutral grip), bar dips, T2B, horizontal pull-ups, иногда HSPU.
- Решение: оставлены **отдельными** label'ами. Если в Phase 4 решат сливать — merge тривиален.

### Basic GYMNASTICS regex variants

Регистровые вариации `Basic GYMNASTICS:` (×15) / `Basic Gymnastics:` (×6) / `BASIC GYMNASTICS:` (×3) склеены в один канон молча. Решение: case-insensitive dedup, как договорено в workflow.

### STRENGTH ENDURANCE без двоеточия

8 раз без двоеточия, начиная с sheet-22 FRIDAY (`STRENGTH ENDURANCE`). Все остальные `STRENGTH ENDURANCE:`. Содержание блока в обоих случаях идентично по структуре — это, по всей видимости, опечатка тренера в позднем периоде. Решение: дедуп с `STRENGTH ENDURANCE:` молча.

### CORE MUSCLES без двоеточия

5 раз `CORE MUSCLES` без двоеточия. Все на SATURDAY 1ST SESSION после PUMP SESSION. Во всех 5 случаях **тело блока пустое** (только label, никаких упражнений после). Это не пропуск — это плейсхолдер. См. ниже про empty blocks.

### Composite block-labels с `|`

- `STRENGTH ENDURANCE | Gymnastics:` (12 occurrences) — стабильный сепаратный паттерн, не сливается с plain `STRENGTH ENDURANCE`.
- `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]:` (1 occurrence) — единственная встреча, intensity-аннотация встроена в label.
- `Warm Up before RUN | 3 sets:` (2) и `3 sets WARM UP BEFORE RUN:` (5) — два формата выражения одной сущности (warm-up перед run'ом с 3 sets).

Решение: отдельные карточки сохранены. Phase 4 решит, что является «base label» + «modifier» vs «independent label».

### YOGA TIME — session-label или block-label?

`YOGA TIME` (без двоеточия, ALLCAPS) появляется 3 раза (sheet-08, sheet-15, sheet-18 — все TUESDAY). Структурно:

```
(r3) 1ST SESSION:
(r6) 3 sets:
(r7..r10) glute bridge / hip ab/adduction (warm-up)
(r12) warm up for feet:
(r13..r14) youtube links
(r15) YOGA TIME
(r16) [ https://... ]
```

То есть `YOGA TIME` следует ПОСЛЕ warm-up'а внутри 1ST SESSION. Можно интерпретировать как:

- (a) Второй session-label дня (без явного `2ND SESSION:` маркера).
- (b) Block-label внутри 1ST SESSION (как и любой другой block).

Классифицирован как **block-label** (вариант b) — по позиции в иерархии. Раз нет явного `2ND SESSION:`, не множим session-уровень молча. Phase 4 валидирует.

### Префиксы `*` и эмодзи ⚒️ / 🔥

`* SUCCESSORY WORK: ⚒️` (×66) и `SUCCESSORY WORK: ⚒️` (×33) — `*` и эмодзи отброшены при нормализации, как договорено в workflow #6. Наблюдение:

- В sheet'ах с PUMP SESSION на WED перед SUCCESSORY обычно нет `*`. В sheet'ах с STRENGTH ENDURANCE — есть. Не правило, но коррелирует.
- ⚒️ эмодзи стабилен — только при SUCCESSORY WORK.

### Lowercase block-labels (`warm up for feet:`, `warm up BEFORE run:`)

Все примеры block-labels в workflow — ALLCAPS / Mixed. `warm up for feet:` и `warm up BEFORE run:` — полностью lowercase, но структурно ведут себя как block-labels:

- занимают позицию label-строки внутри сессии (после `1ST SESSION:`)
- содержат body (упражнения или URL'ы)
- разделяют сессию на сегменты

Решение: включены в block-labels.md, помечены. Phase 4 решит, оставить их block-label'ами или поднять на уровень «session sub-section / preparation».

## Спорные границы блоков

### Empty block bodies

- **sheet-18 / MONDAY / 1ST SESSION (r5)**: `STRENGTH ENDURANCE:` идёт без тела, сразу за ним (на r13) `* SUCCESSORY WORK: ⚒️`. Block-instance с пустым body. Версия: тренер забыл прописать содержание / интенциональная пауза.
- **sheet-18 / FRIDAY / 1ST SESSION**: нет label'а STRENGTH ENDURANCE, сразу `* SUCCESSORY WORK: ⚒️` на r16. То же что выше, но даже без label'а. Этот случай дал `(implicit)`-блок-instance с пустым body.
- **sheet-20 / SATURDAY / 1ST SESSION (r16)**: `CORE MUSCLES` (без двоеточия), пустое тело. Идентично:
  - sheet-23 / SATURDAY / r16
  - sheet-26 / SATURDAY / r19
  - sheet-29 / SATURDAY / r19
  - sheet-32 / SATURDAY / r19

Всего 6 empty-body block instances (1 STRENGTH ENDURANCE + 5 CORE MUSCLES без двоеточия). Phase 4: оставлять ли empty block-instances в модели или схлопывать как «label-only marker».

### Implicit-блоки (без label'а в начале сессии)

24 уникальных карточки в категории `(implicit)`, в сумме 75 экземпляров. Это содержимое, идущее СРАЗУ после `1ST SESSION:` до первого block-label. Типичные случаи:

- **RUN-дни** (TUE / SAT): `RUN X km` + warm-up exercises ДО `warm up for feet:`-блока. Часто warm-up в виде `3 sets:` schemas с glute bridge / hip ab/adduction.
- **MONDAY / FRIDAY** sessions с EMOM/AMRAP/CHIPPER/INTERVALS схемой directly под `1ST SESSION:` без block-label:
  - sheet-07 FRIDAY: `EMOM 16 min | 4 rounds:` directly
  - sheet-08 FRIDAY: `EMOM 9 min:` directly
  - sheet-12 MONDAY: `4 rounds:` directly (без `STRENGTH ENDURANCE:` label)
  - sheet-13 MONDAY: `AMRAP 12 min:` directly
  - sheet-15 FRIDAY: `EMOM 12 min:` directly
  - sheet-20 FRIDAY: `5 rounds:` directly
  - sheet-22 MONDAY: `3-4 rounds:` directly
  - sheet-25 MONDAY: `4 rounds:` directly
  - sheet-28 MONDAY: `30-20-10:` directly
  - sheet-31 MONDAY: `4-5 rounds:` directly
- **SUMMARY**: в части позднего периода тренер пропускает `STRENGTH ENDURANCE:` label — content всё равно strength-endurance по смыслу, но категория implicit. Phase 4: модель должна допускать optional block-label.

### Sub-section `Bulgarian split squats:` внутри блока

`Bulgarian split squats:` (lowercase mixed, с двоеточием) появляется как **под-секция** внутри:

- STRENGTH ENDURANCE block (sheet-07, sheet-10)
- `(implicit)`-блока в MONDAY 1ST SESSION (sheet-13, sheet-19, sheet-22, sheet-25, sheet-28, sheet-31)
- `Temporarily without STRENGTH ENDURANCE` block (sheet-16, sheet-19)

Содержание: `3 sets [ x5/x7 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]` + youtube-link annotation + REST-маркер.

Это явно sub-block-like структура, но не block-label (попадает внутрь parent-блока). Phase 2/3 решает, как формализовать «sub-section внутри блока» / «именованная schema внутри блока».

### Composite labels с inline-schema

- `Warm Up before RUN | 3 sets:` — label «warm up before run» с встроенным schema-маркером `3 sets:`. Phase 2: расщеплять или хранить как inline schema-anchor в label'е.

### Embedded schemas прямо под 1ST SESSION (без block-label)

Перечислены выше в implicit-блоках, но это **structural pattern**, не баг: тренер часто пишет схему без обёртки блока. Главный «implicit STRENGTH ENDURANCE» — typed conceptual block с пустым label'ом.

### `Temporarily without STRENGTH ENDURANCE` — instruction-row или block-label?

Появляется 7 раз (sheet-16/17/19 MON+FRI, sheet-20 MON r6). Структурно идёт на позиции block-label'а. Семантически — инструкция тренера «сегодня без strength endurance, переходи к следующему блоку».

Решение: классифицирован как **block-label** для целей определения границ блока, но во всех 7 случаях body состоит из Bulgarian split squats sub-section и/или нескольких rows (Body never empty for this label). Phase 4: решить, отдельная это категория ("rest-strength") или substitute для STRENGTH ENDURANCE.

## Технический шум

### `Quick Search` footer

33 occurrences, ровно по 1 на sheet. Всегда на MONDAY (потому что table-конвертер кладёт это в MONDAY как footer-link оригинальной таблицы):

- `(r58) Quick Search` — sheet-01..23, sheet-25, sheet-28, sheet-31 (26 раз)
- `(r46) Quick Search` — sheet-24, sheet-26, sheet-27, sheet-29, sheet-30, sheet-32, sheet-33 (7 раз)

Это footer-link «Quick Search», навигационный артефакт оригинального Google Sheets. Не входит ни в какой блок. Эскалирован как noise; **исключён из block-instances.md и exercise-instances.md**.

## Наблюдения о структуре

### Связь sessions ↔ blocks

В sample только **один session-label**: `1ST SESSION:`. Никогда не встречается `2ND SESSION:`. Внутри одной сессии в один день регулярно соседствуют:

- STRENGTH ENDURANCE + SUCCESSORY WORK + CORE MUSCLES (MONDAY/FRIDAY)
- Basic GYMNASTICS + PUMP SESSION + SUCCESSORY + CORE MUSCLES (WEDNESDAY)
- warm-up + GYMNASTICS + PUMP SESSION + CORE MUSCLES (SATURDAY)

→ Многоблочная сессия — норма. Не модель «1 session = 1 modality».

### Связь session-label `1ST SESSION:` с блоком PUMP SESSION

Несмотря на «SESSION» в имени, `PUMP SESSION:` — это **block** внутри `1ST SESSION:`, не отдельная сессия. Лексический сдвиг тренера. Дедуп / классификация делаются по позиции в иерархии, а не по имени.

### Compound exercise rows

Регулярные compound-строки:

- `traverses + N bar dips + traverses + N bar dips` (8 уникальных N-вариантов)
- `bar dips + traverses + turn back 180* + traverses` (8 occurrences)
- `DB Snatches + DB squats` варианты
- `hang power cleans + N front squats + N push presses [ DB 2x 15 kg ]` (varies)
- `5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ]` — мета-row, определяющий «rep = compound action»

Phase 1 хранит их как один exercise-instance со своим именем. Phase 2/3 решает, расщеплять ли на atomic exercises с rep-counters или хранить как composite.

### Sub-min headers внутри EMOM / INTERVALS

Внутри EMOM-схем регулярные sub-min маркеры:

- `1 min:`, `2 min:`, `3 min:`, `4 min:`
- `1st & 2nd min:`, `3 & 4 min:`
- `1st | 3rd | 5th sets:`, `2nd | 4th | 6th sets` (для CHIPPER-like alternation)
- `0:00-10:00 min:`, `10:00-20:00 min:` (time-range, sheet-06 MONDAY)

Phase 2: формализация EMOM-schemas с per-minute payloads.

### Sub-schema patterns внутри блоков

- `...then... | 12-9-6:` — два-этапная схема (preface + ladder)
- `...then 2 rounds:`, `...THEN 2 rounds:` — coupled с предыдущим schema-headerом
- `then:` — bare connector между двумя под-schemas

Phase 2 формализует.

### Time-range schema (`0:00-10:00 min`)

Уникальный паттерн в sheet-06 MONDAY: два time-window'а на одной linear timeline'е (chipper-stage type). Только 1 встреча. Возможно недоразвит и не повторится.

### Schema `Every 4th min new round | x4 rounds | 16 min` (sheet-02 MONDAY)

Composite-header с тремя параметрами одновременно (interval, count, total time). Также формат `EMOM 16 min | 4 rounds:` — синоним. Phase 2 распознает.

### Sub-section `*DB exercise [ 2x 15 kg ]` (sheet-11 FRIDAY)

Row с placeholder'ом упражнения, expand'ится через annotation на следующих строках:

```
*DB exercise  [ 2x 15 kg ]
[ *DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS ]
```

Это **per-set substitution** упражнения — каждый set имеет свой движение. Phase 2/3: модель должна поддерживать per-set variation одного «slot'а».

### Sub-section `* Burpee variation` (sheet-07 MONDAY)

То же самое — placeholder упражнения с annotation:

```
* Burpee variation
[ 1 set: bar facing burpees | 2 set: burpee + push ups | 3 set: burpee ]
```

Per-set variation. Тот же паттерн, что выше.

### Strength-block schema variations

Тот же block-label `STRENGTH ENDURANCE:` имеет принципиально разные schema-content от недели к неделе:

- Ladder (36-28-20)
- N rounds for time
- EMOM
- AMRAP
- 5 sets
- Composite (15-12-9 + ...then...)

→ Phase 4: BlockType и SchemaType — независимые axes. Один block-label покрывает много archetype'ов.

### Empty / dropped sessions

- sheet-08 / SATURDAY: `1ST SESSION:` без RUN content в начале — сразу `warm up for feet:`. Возможно, пропуск RUN-строки.
- sheet-09 / TUESDAY и sheet-09 / SATURDAY: тоже идут без `RUN X km` строки в начале (`3-4 sets:` warm-up идёт раньше блок-label'а).

В implicit-блоках всё это сохранено как первый row session-level content.

### Calendar gaps в источнике

Sample покрывает не подряд 33 недели; есть пропуски:

- Между sheet-09 (02–08.09.24) и sheet-10 (16–22.09.24) — пропущена неделя 09–15.09.24.
- Между sheet-15 (21–27.10.24) и sheet-16 (04–10.11.24) — пропущена неделя 28.10–03.11.24.
- Между sheet-17 (11–17.11.24) и sheet-18 (25.11–01.12.24) — пропущена неделя 18–24.11.24.
- Между sheet-19 (02–08.12.24) и sheet-20 (16–22.12.24) — пропущена неделя 09–15.12.24.
- Между sheet-20 (16–22.12.24) и sheet-21 (30.12.24–05.01.25) — пропущена неделя 23–29.12.24 (Christmas / New Year).
- Между sheet-30 (03–09.03.25) и sheet-31 (17–23.03.25) — пропущена неделя 10–16.03.25.

Итого 6 пропущенных недель в 9-месячном окне (08.07.24 → 06.04.25). Это **не** баг inventory, а характеристика источника — sheet'ы покрывают тренировочные недели, не календарные. Phase 5/6: модель должна допускать "skip week" / "non-contiguous weeks" в плане атлета.

### URL'ы как самостоятельные строки vs inline в exercise-аннотации

URL встречается в трёх формах:

1. **Inline в `[ ]` рядом с упражнением**: `10 alternative DB press [ https://www.youtube.com/watch?v=T9OFhjgXt6c ]` — типовая форма для shoulder/hamstring work.
2. **Standalone row сразу после exercise**: `[ https://www.youtube.com/watch?v=s3_W2rAbCiA ]` — пара упражнение → ссылка на demo через следующую строку. Часто `hamstring curls` ссылается так.
3. **Bare URL без скобок**: `https://youtu.be/Qt1NzbdWSmM?si=...` — только в `warm up for feet:` блоке.

Phase 3: модель URL'а — атрибут упражнения, или separate-entity «media reference», или просто инлайн-аннотация. Decision point.

### `+` connector в exercise rows

`+` внутри row выполняет роль «выполнить как один комплекс» (compound exercise):

- `5 strict DB press + 5 DB push press` — chain
- `10 burpees [ WITHOUT JUMP ] + 5 strict HSPU` — same as above
- `DB hang power clean + DB push press` — combined movement

Это **не** список из независимых упражнений, а одна compound-rep. Phase 2/3 различит compound vs sequential.

### `OR` connector в exercise rows

`5 strict bar dips OR 10 push ups` — alternative substitution (выбор атлета). Phase 3: модель должна допускать «exercise OR exercise» как degeneracy choice или per-athlete preference.

### Modifiers in `[ ]` — список наблюдённых типов

Не классификация (Phase 3), просто сырое наблюдение типов модификаторов:

- **Weight**: `[ 15 kg ]`, `[ 2x 15 kg ]`, `[ 1x 15 kg ]`, `[ 24 kg ]`, `[ 50/30 kg ]`
- **Side / per-leg**: `[ each leg ]`, `[ each arm ]`, `[ LEFT ARM ]`, `[ RIGHT ARM ]`
- **Substitute / equipment**: `[ from box/sofa ]`, `[ from sofa ]`, `[ neutral grip ]`, `[ alternative ]`, `[ WITHOUT BENCH ]`, `[ WITHOUT JUMP ]`, `[ kind of wall balls ]`
- **Tempo / pause**: `[ + 2 sec pause in UP position ]`, `[ AFTER each 5th REP - 5 sec pause ]`, `[ 2 sec SLOW down ]`
- **URL demo**: `[ https://... ]`
- **Examples / clarifications**: `[ EXAMPLE: ... ]`, `[ EXPLODE: ... ]`, `[ 5 each arm ]`
- **Effort intensity**: `[ 75-80% Effort ]`, `[ 70% EFFORT ]`
- **Composite metric**: `{ 1 push up + each arm row = 1 rep }` (фигурные скобки! только один случай: DB Renegade row)
- **Sequence indicators**: `[ before BAR DIPS complex ]`, `[ after BAR DIPS complex ]`, `[ before NEXT block ]`
- **Variant tag**: `[ ONLY ONCE before METCON ]`, `[ TOTAL ]`, `[ AFTER EACH ROUND ]`

Phase 3 решит, какие из них first-class entities vs notation.

### Кудрявые скобки `{ ... }`

Единичный случай: `30 DB Renegade row [ https://... ] { 1 push up + each arm row = 1 rep }`. Curly-brace формат для определения «rep = composite movement». Один сэмпл — не паттерн, но фиксируем.

## Summary

- **scanned**: 33 sheets, 2864 content rows
- **day-labels**: 1 (`R E S T  D A Y`), 66 occurrences
- **session-labels**: 1 (`1ST SESSION`), 165 occurrences
- **block-labels**: 17 canonical (плюс `(implicit)` как boundary-marker), 502 total block-instance occurrences
- **block-instances unique**: 198 (после дедупа по `label × body`)
- **exercise-instances unique**: 168 (после нормализации имени)
- **edge cases**: 33 quick-search footers, 6 empty-body blocks, 24 implicit-блоков (75 occurrences), 7 `Temporarily without STRENGTH ENDURANCE`, 1 единственная встреча `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]`, 1 единственный CHIPPER, 6 calendar-gaps в weeks, 3 YOGA TIME (borderline session vs block), 4 lowercase block-labels (warm-up family), 2 sub-section substitution patterns (Burpee variation / DB exercise), 1 кудрявая `{ ... }` rep-definition

**Покрытие**: 2864 source rows = 165 (session-labels) + 66 (day-labels) + 2600 (block bodies, включая label-rows) + 33 (quick-search noise). 100%, без потерь.
