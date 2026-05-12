# Phase 2.1 edge cases

Спорные граничные решения, неоднозначные `kind`-классификации, singleton-паттерны и эскалации в main session. Отдельный файл от `01-inventory/edge-cases.md` (Phase 1 — наблюдения о структуре inventory; здесь — решения о разметке schemas).

## Спорные boundaries

### case-then-connector: `then:` / `...then...:` standalone connector

source: block-006, block-051, block-052, block-084, block-099, block-100
context: `then:` или `...then...:` появляется на отдельной строке между двумя smiles schemas (например `15 strict pull-ups → then: → 12-9-6: bar dips...`).
options:

- (a) Connector в конец body предыдущей schema (как trailing transition marker).
- (b) Connector в начало body следующей schema (как leading prefix). Близко к spec text: "новая schema, body начинается с then:".
- (c) Connector — отдельная micro-schema (kind=edge с body `then:`).
- (d) Connector полностью игнорируется (не сохраняется в body, является чистым separator-маркером).
  decision: (a) — connector помещён в конец body предыдущей schema. Аргументы: (1) семантически `then:` завершает предыдущий шаг ("сделай это, then..."), (2) следующая schema получает чистый body без posthoc-сюрприза в первой строке, (3) сохраняет all content (анти-loss). Однажды я отступил от этого в block-006 и потом нормализовал.
  implications: Если main session предпочтёт (b) — переместить все `then:` строки на 1 schema вперёд. Trivial rewrite.

### case-then-connector-composite: `...then... | N-M-L:` единым composite header'ом

source: block-046
context: `...then... | 12-9-6:` — composite-формированный header, объединяющий connector и ladder.
options:

- (a) Per spec literal: `kind=atomic` с header `...then... | 12-9-6:` (применено в block-046).
- (b) `kind=composite` так как header содержит `|`.
  decision: (a) — следуем буквальной spec rule. `...then...` это connector, не самостоятельный параметр; `12-9-6:` несёт всю структурную нагрузку (ladder). Отличается от `5 rounds | 2 min rest:` где обе стороны `|` — реальные параметры (count + rest).

### case-rest-split-parallel: rest-маркер разделяет два структурно-полных полу-блока

source: block-005, block-035
context:

```
12-9-6:
DB Thrusters
6-9-12:
DB hang power cleans
- 5 min rest -
12-9-6:
DB hang power cleans
6-9-12:
DB Thrusters
```

options:

- (a) 2 headerless schemas (каждая — параллельная лесенка), rest как separator → trailing в первой.
- (b) 1 headerless schema со всем body внутри (rest как internal pause, аналогично block-007).
  decision: (a) для блоков с внутренними `X-Y-Z:` маркерами. Каждая половина — самостоятельная составная structure (две параллельные лесенки). Rest 5 min слишком длинный для "internal pause", это смена round'а.
  implications: block-007 (без внутренних маркеров) остался 1 headerless т.к. нет структурного различия между половинами; в block-005/035 структура чётко повторяется по 2-3 раза.

### case-trailing-t2b: `30 strict T2B` (или 35, или 30 T2B variant) после ladder/sets schema

source: block-090, block-096, block-102 (schema-3), block-103 (schema-2), block-106, block-107, block-108, block-109 (schema-2), block-110 (schema-2), block-111 (schema-2), block-112 (schema-2), block-113 (schema-3), block-114 (schema-3), block-115 (schema-2), block-116 (schema-2)
context: trailing exercise `30 strict T2B` (или вариант) после ladder/sets schema без отдельного header или separator.
options:

- (a) Inline в body предыдущей schema (current decision).
- (b) Отдельная headerless schema (1 exercise body).
- (c) Edge case.
  decision: (a) — без отдельного separator или header нет структурного основания вводить новую schema. Семантически это finisher, но семантика → Phase 2.2 archetype. Phase 2.1 ограничивается structural boundaries.
  implications: ~15 occurrences. Если main session предпочтёт treat T2B как finisher — split в отдельную schema, trivial rewrite.

### case-pull-ups-trailing: `N strict pull-ups [ after BAR DIPS complex ]` после ladder

source: block-051, block-052, block-084, block-099, block-100
context: `15 strict pull-ups [ before BAR DIPS complex ]` → `then:` → `12-9-6: bar dips...` → `15 strict pull-ups [ after BAR DIPS complex ]` (иногда `then:` → ладдер → `pull-ups [ after BAR DIPS complex ]`).
decision: trailing pull-ups помещены в отдельную headerless schema (последнюю), т.к. они структурно равноправны с лидирующими pull-ups (тоже отдельный schema). Получилось 3-5 schemas в блоке: pull-ups → ladder → pull-ups → (ladder → pull-ups).
implications: 5 occurrences.

## Неоднозначный kind

### case-alternation: `1st | 3rd | 5th sets:` vs `2nd | 4th | 6th sets`

source: block-009
context:

```
1st | 3rd | 5th sets:
36 Jumping Jacks
12 DB lunges [ 2x 15 kg ]
6 KB clean & jerk [ 24 kg ] [ each arm ]
2nd | 4th | 6th sets
36 Jumping Jacks
12 DB lunges [ 2x 15 kg ]
6 deficit HSPU [ from sofa ]
- 90 sec rest in between sets -
```

options:

- (a) 2 atomic schemas (по одной на каждый header). `|` трактуется как enumeration set-индексов, не как separator параметров.
- (b) 2 composite schemas (так как header содержит `|`).
- (c) 1 nested schema с implicit outer `6 sets:` и 2 sub-schemas (`odd sets`, `even sets`).
- (d) edge.
  decision: (a) — atomic. `1st | 3rd | 5th` — единое перечисление одной размерности (set index), не разные параметры. Аналог spec example `EMOM 16 min` где space разделяет элементы единой modal-header. `|` здесь играет роль "or"/list-enumeration.
  implications: alternation pattern требует Phase 2.2 archetype (alternating-sets). Структурно остаются 2 atomic schemas со связью "выполняется в чередовании". Escalation flag: main session может пожелать composite или nested.

### case-same-ladder-numbers: две лесенки с одинаковыми ступенями

source: block-087
context:

```
3-6-9-12-9-6-3:
strict pull-ups
3-6-9-12-9-6-3:
traverses + strict bar dips
```

options:

- (a) 1 headerless schema (parallel ladder, по аналогии с canonical block-037).
- (b) 2 atomic schemas (sequential ladder для каждого упражнения).
  decision: (a) — headerless. Identical ladder steps в обоих rows наводят на parallel-ladder pattern, consistent с canonical headerless example. Если sequential — был бы rest-маркер или явный separator.

### case-30-HSPU-TOTAL-prefix: `30 strict HSPU [ TOTAL ]` (или NEGATIVE) как standalone leading row

source: block-102, block-104, block-113, block-114
context: блок открывается одной строкой `30 strict HSPU [ TOTAL ]` (или `30 strict NEGATIVE HSPU [ TOTAL ]`), потом идёт `3 sets:` или `4 sets:` ladder.
options:

- (a) Separate headerless schema (1-line body).
- (b) Inline в body следующей schema (но какой её header? не подходит).
  decision: (a) — headerless preface. `[ TOTAL ]` маркер показывает, что эти reps — общий counter (не per-round), что делает row структурно отличным от внутренностей `3 sets:` ladder ниже.
  implications: 4 occurrences.

### case-3-sets-bracket-without-colon: `3 sets [ BEFORE RUN ]`

source: block-062
context: header `3 sets [ BEFORE RUN ]` без двоеточия (но с count + bracket-annotation).
options:

- (a) atomic header с annotation inline (как трактовано).
- (b) atomic с переименованным header `3 sets:` + annotation `[ BEFORE RUN ]` в body.
- (c) edge.
  decision: (a) — header `3 sets [ BEFORE RUN ]` сохраняется дословно. Иначе теряется структурная разница между `3 sets [ BEFORE RUN ]` и просто `3 sets:`.

### case-3-sets-WARM-UP-label-vs-schema: `3 sets WARM UP BEFORE RUN:` как block-label

source: block-150, block-151
context: `3 sets WARM UP BEFORE RUN:` и `Warm Up before RUN | 3 sets:` — block-labels из inventory, в которых `3 sets` уже embedded. Body содержит только упражнения, без отдельного header.
decision: schema внутри блока — kind=headerless (так как `3 sets` уже учтён на уровне label, schema-header не нужен). При формализации модели Phase 4 решит: schema "поднимать" с label, или label остаётся "metadata about schema".

### case-composite-vs-nested-for-EMOM-with-rounds

source: block-080, block-081
context: `EMOM 16 min | 4 rounds:` — header composite-style (interval + count), с sub-min markers (`1 min:`, `2 min:`, `3 min:`, `4 min:`) underneath.
options:

- (a) composite (header has `|`).
- (b) nested (есть sub-schemas underneath).
  decision: (b) — nested. Per spec: "Если внутри есть sub-min markers — kind = `nested`." Composite-style header сохраняется как `header` поле nested schema.

### case-INTERVALS-composite-with-then-rounds

source: block-015, block-016, block-039
context:

```
3 INTERVALS | 2 min rest in between
50 jumping Jacks
...then 2 rounds:
5 deficit HSPU [ ... ]
7 DB hang power cleans + push press [ ... ]
9 DB squats [ ... ]
```

options:

- (a) 1 composite schema (header `3 INTERVALS | 2 min rest in between`), body содержит `50 jumping Jacks` + `...then 2 rounds:` + exercises.
- (b) Nested: outer composite `3 INTERVALS | 2 min rest in between`, inner atomic `...then 2 rounds:`.
  decision: (a) — composite single schema. `...then N rounds:` — continuation per spec rule (см. также case-then-rounds-continuation ниже).

### case-then-rounds-continuation: `...THEN N rounds:` после atomic schema

source: block-015 (...then 2 rounds:), block-016 (...then 3 ROUNDS:), block-019 (...then 2 rounds:), block-030 (...THEN 2 rounds:), block-039 (...then 2 rounds:)
context: `...THEN N rounds:` появляется как continuation INSIDE того же schema body, не как boundary.
decision: per spec rule "продолжение предыдущей schema" → отнесено к той же schema, дополнило body. НЕ создаёт новой schema.

## Singletons

### case-time-window-outer (block-003)

context: уникальный блок с outer container в виде time-range:

```
0:00-10:00 min:
3 rounds:
...
10:00-20:00 min:
15-12-9:
...
```

decision: 2 nested schemas, outer header — time-range (`0:00-10:00 min:` / `10:00-20:00 min:`), inner atomic.
escalation: Только 1 встреча в sample (sheet-06 MONDAY). Main session should валидировать: оставить как separate kind в архетипах (Phase 2.2)?

### case-3x-10-reps-header (block-138 schema-3)

context: `3x 10 reps:` — header в формате "count × reps". Singleton.
decision: kind=atomic, header сохранён дословно. `1 set:` (block-125) и `1 sets:` (block-126) — родственные паттерны, тоже atomic.

### case-bulgarian-as-named (множество occurrences)

source: block-008, block-021, block-058, block-059, block-069, block-071, block-072, block-074, block-078
context: `Bulgarian split squats:` — header это имя упражнения (не количество/режим), body — drop-set program.
decision: kind=named для всех 9 occurrences. Distinctive паттерн (single named schema внутри другого блока). Phase 4 решит, как формализовать "named sub-section" в модели.

### case-yoga-url-only (block-147)

context: body = одна строка с URL в `[ ]`. Schema-1 kind=headerless с этим URL'ом как body.
note: Phase 1 edge-cases уже отметил borderline session-label vs block-label для YOGA TIME; здесь — только schema-разметка.

### case-warm-up-feet-bare-urls (block-149)

context: body = 2 bare-URL'а БЕЗ `[ ]` оболочки.
decision: kind=headerless. URL'ы сохранены дословно.

### case-burpee-variation-placeholder (block-021)

context: `* Burpee variation` + `[ 1 set: bar facing burpees | 2 set: burpee + push ups | 3 set: burpee ]` — placeholder упражнения с per-set substitution.
decision: оставлено inline в body inner schema (`9-7-5:` sub-schema), не расщеплено. Per spec rule про `[ ]`-аннотации — Phase 3 будет разбирать эту вложенность.

### case-DB-exercise-placeholder (block-020)

context: `*DB exercise` + `[ *DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS ]` — placeholder + per-set substitution.
decision: оставлено inline в body inner schema. Phase 3.

## Headerless с пустыми внутренними маркерами

### case-pure-exercise-list-no-markers

source: block-004, block-033, block-034, block-036, block-145 (CHIPPER), и др.
context: body — sequence упражнений с rep counts, БЕЗ header и без внутренних program-маркеров (`X-Y-Z:`, time-windows и т.п.).
decision: kind=headerless. Спецификация headerless обычно подразумевает наличие внутренних маркеров, но формально определена через "Body без header'а". Чистые sequence — частный случай.
implications: Phase 2.2 решит, какой archetype соответствует (chipper, for-time, ladder-by-rep-count, etc).

## Connectors и rest markers — итоговый summary

Rest-markers `- X min rest -`, `- rest until recovery -`, `- 5 min rest in between sets -`:

- Внутри schema body (между sets/rounds) → остаются inline, не разделяют schemas.
- Между schemas (когда обе стороны имеют независимую structure) → placed at end of preceding schema's body.

Connector lines `then:`, `...then...:`:

- На отдельной строке → placed at end of preceding schema body (см. case-then-connector).
- Сросшийся с header (`...then... | N-M-L:`) → header of new schema, kind=atomic.

Continuation markers `...THEN N rounds:`:

- Внутри body предыдущей schema, не отдельная schema.

EMOM sub-min markers `1 min:`, `2 min:`, `1st & 2nd min:`, `3 & 4 min:`, `1st | 3rd | 5th sets:`:

- При наличии outer EMOM header — sub-schemas внутри nested schema.
- При самостоятельном появлении (block-009: `1st | 3rd | 5th sets:` без EMOM-обёртки) — kind=atomic для каждой, с alternation-pattern на уровне block (escalation).

## Эскалации в main session

1. **Connector convention validation**: моё решение — `then:`/`...then...:` в конец предыдущего body. Если main session предпочтёт другое (например, отдельная micro-schema или leading in next), batch rewrite ~5-6 блоков.

2. **Alternation kind (block-009)**: моё решение — 2 atomic schemas (`1st | 3rd | 5th sets:` и `2nd | 4th | 6th sets`). Альтернативы: composite (literally `|` в header) или nested (implicit `6 sets:` outer). Singleton, потенциально первый-класс kind для архетипа.

3. **Time-window outer (block-003)**: моё решение — nested. Singleton. Phase 2.2: оставлять отдельный archetype `time-window/chipper-staged` или сливать с nested-rounds?

4. **30-strict-HSPU-TOTAL preface**: моё решение — separate headerless schema. 4 occurrences в GYMNASTICS. Phase 4: модель должна допускать "single-exercise prefix" внутри блока?

5. **Headerless без внутренних маркеров** (block-004, 033, 034, 036, 145 и др): classification headerless — тонкая натяжка спецификации (которая по канонике подразумевает внутренние маркеры). Phase 2.2 archetype скорее всего "chipper" / "for-time" / "interval-circuit". Main session может пожелать выделить отдельный kind (`flat-list`?).

6. **`...then... | N-M-L:` kind**: per spec kind=atomic (block-046). Парадокс: имея `|` в header, должен быть composite по общему правилу. Inconsistent treatment между connector-+-ladder и param-+-param composite headers требует main-session ratification.

## Summary

- **Total block-instances processed**: 198 (включая 3 с empty body)
- **Block-instances с empty body**: 3 (block-002 STRENGTH ENDURANCE, block-056 (implicit) ex-Temporarily, block-198 CORE MUSCLES)
- **Top-level schemas total**: 312
- **Sub-schemas (внутри nested) total**: 25
- **Grand total schema entries**: 337

### Top-level schemas by kind

| kind       | count   | % of top-level |
| ---------- | ------- | -------------- |
| atomic     | 156     | 50.0%          |
| headerless | 73      | 23.4%          |
| named      | 53      | 17.0%          |
| nested     | 16      | 5.1%           |
| composite  | 14      | 4.5%           |
| edge       | 0       | 0.0%           |
| **total**  | **312** | **100%**       |

### Sub-schemas by kind (внутри 16 nested)

| kind       | count  |
| ---------- | ------ |
| atomic     | 22     |
| headerless | 3      |
| **total**  | **25** |

### Top spotted patterns

1. **`3 sets | shoulders:` + `3 sets | legs & glutes:` (named pair)** — ~22 named schemas в 11+ SUCCESSORY blocks. Стабильный двух-block pattern в SUCCESSORY WORK на MONDAY.
2. **Parallel ladders (headerless)** — каноничный pattern (block-037 prototype). Встречается в STRENGTH ENDURANCE, Basic GYMNASTICS, STRENGTH ENDURANCE | Gymnastics.
3. **`Bulgarian split squats:` named** — 9 occurrences, drop-set body. Появляется как trailing schema в (implicit) MONDAY-блоках и в STRENGTH ENDURANCE.
4. **EMOM nested c sub-min schemas** — 4 EMOM containers (block-079, 080, 081, 082) с разными вариантами sub-headers (`1 min:`/`2 min:`/`3 min:`/`4 min:` или `1st & 2nd min:`/`3 & 4 min:`).
5. **`3 INTERVALS | 2 min rest in between` + `...then N rounds:` continuation** — composite с continuation, 3 occurrences (block-015, 016, 039).
6. **30 strict HSPU [ TOTAL ] preface + sets-pair** — GYMNASTICS на SATURDAY с этой topology, 4 occurrences (block-102, 104, 113, 114).
7. **`...then... | 12-9-6:` composite-style atomic** — block-046, 2 schemas с этим header'ом в одном block.
8. **`then:` / `...then...:` standalone connector** — 6 блоков (block-006, 051, 052, 084, 099, 100) с этим разделителем.

### Escalations to main session (короткий список)

1. Connector convention (`then:` ─ trailing-prev vs leading-next vs micro-schema).
2. Alternation kind (block-009 `1st | 3rd | 5th sets:`).
3. Time-window outer (block-003) — singleton archetype.
4. 30-strict-HSPU-TOTAL preface — отдельный structural element vs body-prefix.
5. Headerless без markers — natural kind или edge?
6. `...then... | N-M-L:` kind=atomic per spec vs composite по общему правилу.
