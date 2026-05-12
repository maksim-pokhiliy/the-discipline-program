Задача: Phase 3.1 — каталогизация structural primitives внутри schema body для проекта построения доменной модели тренировочных сессий.

КОНТЕКСТ

Ты — соседняя сессия в рамках workflow по построению доменной модели тренировочных сессий. Phase 1 (Inventory), Phase 2.1 (Schema boundaries) и Phase 2.2 (Archetypes) выполнены, артефакты в `analysis/artifacts/01-inventory/` и `analysis/artifacts/02-patterns/`.

ПЕРВЫМ ДЕЛОМ прочитай файл-контракт:

`/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/00-meta/workflow.md`

Там цели, правила, глоссарий, фазы. Не нарушать. Эта задача = Phase 3.1 (Schema content primitives — первый из трёх sub-promptов Phase 3).

ВАЖНО: Phase 3 разбита на 3 sub-prompts с моими ревью между ними:

- 3.1 (эта задача) — каталог structural primitives внутри schema body.
- 3.2 (позже) — Exercise как сущность (атрибуты).
- 3.3 (позже) — Load representation (абсолютные веса + %1RM).

Не лезь в 3.2 и 3.3.

DECISIONS INHERITED ОТ MAIN SESSION

1. Phase 1, 2.1, 2.2 артефакты — ground truth, НЕ модифицировать.
2. Все ratified эскалации Phase 2.1 / 2.2 — финальные. В частности:
   - `then:` connector в конец предыдущего body.
   - block-009 alternation = 2 atomic schemas.
   - block-046 `...then... | N-M-L:` = atomic.
   - 30-HSPU-TOTAL preface = отдельная headerless schema.
   - block-005 rest-split parallel = 2 headerless schemas.
   - Headerless без markers распределены по 6 архетипам в Phase 2.2.
   - 33 архетипа в Phase 2.2 — окончательный каталог.
3. Composite labels (`STRENGTH ENDURANCE | Gymnastics`), basic-vs-gymnastics, lowercase blocks, empty-body blocks — Phase 4.
4. Scope ниже уровня недели.

КОНТЕКСТНОЕ НАБЛЮДЕНИЕ ОТ MAIN SESSION (не задача, расширение контекста)

`[ 50/30 kg ]` notation (и подобные dual-value записи) НЕ интерпретируй жёстко как RX/scaled. В реальности это может означать:

- M/F (вес для атлетов мужского / женского пола)
- RX/scaled (full intensity / scaled)
- иной dual-resolve

Финальная интерпретация будет программной в будущем по контексту атлета (далеко за пределами Phase 3). Phase 3.1 каталогизирует такие notations как "dual-value weight notation" с пометкой "interpretation deferred to athlete context" — без выбора одной интерпретации.

ВХОДНЫЕ ДАННЫЕ

- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/schema-boundaries.md` — ОСНОВНОЙ материал (198 cards, 337 schemas с raw bodies).
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/schema-archetypes.md` — для понимания контекста архетипа при анализе body.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/schema-archetype-mapping.md` — карта schema → archetype.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/exercise-instances.md` — справочно (168 уникальных упражнений с их modifiers).
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/edge-cases.md` — Phase 1 observations про modifiers, compound rows, drop-sets.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/edge-cases.md` — Phase 2.1 observations.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/archetype-edge-cases.md` — Phase 2.2 observations.

ЦЕЛЬ

Каталог structural primitives которые встречаются внутри schema body. Это inventory типов атомарных элементов с примерами и cardinality. Phase 3.1 не проектирует модель, не классифицирует упражнения как сущности, не моделирует нагрузку — только идентифицирует types of structural elements и описывает их вариативность.

ОЖИДАЕМЫЕ СЕМЕЙСТВА PRIMITIVES (ХИНТ, НЕ ПРЕДПИСАНИЕ)

Это namespace того, что инвентаризация выявила. Уточняй / добавляй / расщепляй по данным.

### Exercise rows

Строки с упражнением + reps + modifiers + optional URL. Это основа большинства schema bodies.

### Rep notations

Способы указания числа повторов:

- Integer count: `10 X`, `5 X`.
- Range: `5-10 X`, `10-15 X`.
- MAX-указатель: `MAX strict HSPU`, `MAX DB FRONT SQUATS`, `MAX <exercise> in remaining time`.
- Unit-bound (time/distance): `30 sec PLANK`, `5 min run`, `100 single unders` (если single unders это движение, то 100 — count).
- Implicit (count отсутствует, упражнение названо как title): `Lateral HS walk near wall [ URL ]`, `strict pull-ups` без префикса.
- Range-with-rest: `10-15 single leg GLUTE BRIDGE [ each leg ]` — range на каждую ногу.

### Weight notations

Способы указания веса:

- Single dumbbell: `[ 15 kg ]`, `[ 17.5 kg ]`.
- Dual dumbbells: `[ 2x 15 kg ]`, `[ 2x15 kg ]` (с/без пробела).
- Single arm: `[ 1x 15 kg ]`.
- Kettlebell: `[ 24 kg ]`.
- **Dual-value (placeholder для будущей резолвции)**: `[ 50/30 kg ]` — НЕ интерпретируй как RX/scaled или M/F однозначно, отметь как "dual-value, interpretation deferred to athlete context".
- Implied no-weight: упражнение без `[ kg ]` annotation (`strict pull-ups`, `burpees`).
- Compound-weight: `[ DB 2x 15 kg ]` (с явным prefix), `[ 2x 15 kg ]` (без), `[ DB 1x 15 kg ]`.
- Negative weight modifier: `[ WITHOUT WEIGHT ]`.

### Compound rows (`+` connector)

`X + Y` исполняется как одна compound-rep (а не sequential):

- `5 strict DB press + 5 DB push press`
- `10 burpees [ WITHOUT JUMP ] + 5 strict HSPU`
- `DB hang power clean + DB push press`
- `traverses + N bar dips + traverses + N bar dips` (повторяющийся pattern)
- `DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses`

Каталогизируй sub-types compound: paired (2 elements), chained (3+ elements), repeated-pattern (`A + N B + A + N B`).

### Alternative rows (`OR` connector)

`X OR Y` — substitution choice:

- `5 strict bar dips OR 10 push ups`

Возможно reлевантно для будущей scaling-функции (атлет выбирает).

### Modifier annotations (`[ ]`-content) с их scope

Это ключевой раздел. Для каждого типа определи **scope** — к чему модификатор относится:

- exercise-level (применяется к конкретному exercise row)
- set-level (применяется к одному set'у)
- round-level (применяется к одному round'у)
- schema-level (применяется ко всей schema)
- block-level (применяется ко всему block-у)

Семейства модификаторов:

**Exercise-level modifiers**:

- Side / per-limb: `[ each leg ]`, `[ each arm ]`, `[ LEFT ARM ]`, `[ RIGHT ARM ]`, `[ 5 each arm ]`.
- Equipment / position: `[ neutral grip ]`, `[ from box/sofa ]`, `[ from sofa ]`, `[ WITHOUT BENCH ]`, `[ WITHOUT JUMP ]`, `[ kind of wall balls ]`.
- Variant indicator: `[ alternative ]`, `[ alternating ]`.

**Tempo / pause modifiers**:

- `[ + 2 sec pause in UP position ]`
- `[ + 1 sec pause in UP position ]`
- `[ AFTER each 5th REP - 5 sec pause ]`
- `[ 2 sec SLOW down ]`

Эти явно применяются к exercise, но могут влиять на rep counter — отметь.

**Sequence indicators**:

- `[ before BAR DIPS complex ]`, `[ after BAR DIPS complex ]`, `[ before NEXT block ]`, `[ after BAR DIPS complex and before NEXT block ]`, `[ AFTER EACH ROUND ]`.

Scope: указывают порядок выполнения относительно других elements.

**Variant tags**:

- `[ ONLY ONCE before METCON ]`, `[ TOTAL ]`, `[ AFTER EACH ROUND ]`, `[ ONLY ONCE ]`.

`[ TOTAL ]` особенно важен — указывает что reps это общий counter за всю schema, не per-round.

**Effort intensity**:

- `[ 75-80% Effort ]`, `[ 70% EFFORT ]`, `[ EASY PACE ]`.

Scope: применяются к exercise / schema / block? Уточни по occurrences.

**URL demo**:

- `[ https://www.youtube.com/watch?v=... ]`, `[ https://youtu.be/... ]`.

Scope: к ближайшему exercise (предшествующая строка чаще всего).

**Clarification / example**:

- `[ EXAMPLE: 36... 18... 4... then... 28... 14... 3... etc. ]` — example of execution.
- `[ EXPLODE: <url> ]` — clarification про explosive technique с URL.
- `[ 5 each arm ]` — clarification про распределение reps.

### Inline rests

Маркеры отдыха между sets/rounds внутри body:

- `- 5 min rest -`
- `- 3 min rest in between sets -`
- `- rest until recovery -`
- `- 90 sec rest in between sets -`
- `- 2 min rest -`
- `- 5 min rest in between -`
- `- 2 min REST after each round -` (часть composite header в block-040)
- `- REST IN BETWEEN SETS UNTIL RECOVERY -` (CAPS variant, Bulgarian context)

### Per-set substitution placeholders

Placeholder упражнения раскрывается через annotation:

- `*DB exercise` + `[ *DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS ]`
- `* Burpee variation` + `[ 1 set: bar facing burpees | 2 set: burpee + push ups | 3 set: burpee ]`

Каталогизируй структуру placeholder + annotation как один primitive type.

### Drop-set programs внутри `[ ]`

Вложенная программа в annotation, Bulgarian split squats:

```
3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]
```

`x5` — 5 повторов, потом drop weight, ещё 5, потом explode без веса. Это вложенная schema-like структура в одной аннотации.

### Curly braces (singleton)

`{ 1 push up + each arm row = 1 rep }` — определение что считается как 1 rep. Один occurrence в sample (DB Renegade row).

### Standalone URL rows

- Bare URL без `[ ]`: `https://youtu.be/Qt1NzbdWSmM?si=...` (только в warm up for feet).
- URL в `[ ]` на отдельной строке: `[ https://www.youtube.com/watch?v=s3_W2rAbCiA ]` — ссылка на demo для предыдущего exercise row.

### Placeholder phrases (semantic-free)

- `ANY exercise for ABS` — указание "выбери любое упражнение из категории".
- `biceps / triceps` — указание мышечной группы без exercise.

### Footnote-style annotations

`*` -prefix строки внутри body:

- `*100 single unders AFTER each set` (block-...)
- `10 Cossacs squats AFTER EACH GYMNASTICS set` (block-098)

ВЫХОДНЫЕ АРТЕФАКТЫ

В `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/`:

1. **`schema-content-primitives.md`** — каталог типов primitives. По каждому типу: имя, description, examples (3-7 от разных blocks), cardinality, observations.

2. **`modifier-scope.md`** — таблица каждого distinct `[ ]`-аннотации с явным scope (exercise / set / round / schema / block). Если scope зависит от контекста — указать все варианты с примерами.

3. **`compound-and-alternative.md`** — анализ `+` и `OR` connectors. Sub-types compound (paired / chained / repeated-pattern). Alternative use cases.

4. **`edge-cases.md`** — singletons (curly braces, dual-value weight unfixed interpretation, и т.п.), ambiguous scope для модификаторов, drop-set вложенность, что эскалировать.

ФОРМАТ schema-content-primitives.md

```
# Schema content primitives (Phase 3.1)

Каталог типов structural elements которые встречаются внутри schema body.

## Exercise rows

description: ...
sub-types:
- with rep count + weight: `10 DB Snatches [ 15 kg ]`
- with rep count, no weight: `5 strict pull-ups`
- ...
examples:
- block-001 / schema-1 / row 2: `10 DB bench presses [ 2x 15 kg ]`
- ...
cardinality: ~XXX rows

## Rep notations
...

## Weight notations
...

## Compound rows
...

(etc.)
```

ФОРМАТ modifier-scope.md

```
# Modifier scope table (Phase 3.1)

Каждый distinct `[ ]`-annotation тип с scope (exercise / set / round / schema / block) и cardinality.

## Side / per-limb

### `[ each leg ]`
scope: exercise
cardinality: N
examples:
- block-XXX / schema-1 / `15 single leg GLUTE BRIDGE [ each leg ]`
- ...
notes:
- применяется когда rep count указан на одну ногу, общий = rep × 2.

### `[ LEFT ARM ]` / `[ RIGHT ARM ]`
scope: exercise (paired в asymmetric body)
cardinality: N
examples: ...
notes:
- встречается парой в block-073: `7 DB hang snatches [ LEFT ARM ]` + `7 DB hang snatches [ RIGHT ARM ]`.

(etc.)

## Variant tags

### `[ TOTAL ]`
scope: schema (counter)
cardinality: N
examples:
- block-102 / schema-1: `30 strict HSPU [ TOTAL ]` (preface schema)
- ...
notes:
- указывает что reps — общий счётчик за всю schema, не per-round.

(etc.)

## Effort intensity

### `[ 70% EFFORT ]`
scope: schema или block — уточнить по occurrences
cardinality: N
examples: ...
ambiguity: scope зависит от позиции (в header или в body row)?

(etc.)
```

ФОРМАТ compound-and-alternative.md

```
# Compound and alternative connectors (Phase 3.1)

## `+` connector (compound rep)

description: связка элементов в одну compound-rep.

### sub-type: paired (2 elements)
cardinality: N
examples:
- `5 strict DB press + 5 DB push press`
- ...

### sub-type: chained (3+ elements)
cardinality: N
examples:
- `30 DB hang power clean + DB push press` (но это 2 element — реклассифицируй если нужно)
- ...

### sub-type: repeated-pattern (`A + N B + A + N B`)
cardinality: N
examples:
- `traverses + 8 bar dips + traverses + 7 bar dips`
- ...

## `OR` connector (alternative)

description: substitution choice.
cardinality: N
examples:
- `5 strict bar dips OR 10 push ups`

notes:
- релевантно для будущей scaling/substitution feature.
```

ФОРМАТ edge-cases.md

```
# Phase 3.1 edge cases

## Singletons

### case-curly-braces (1 occurrence)
source: exercise-instances.md → DB Renegade row, block-XXX
context: `{ 1 push up + each arm row = 1 rep }` — определение compound-rep.
escalation: Phase 5 — first-class compound-rep definition или edge-case primitive?

### case-dual-value-weight
source: occurrences of `[ X/Y kg ]`
context: `[ 50/30 kg ]` — placeholder с двумя значениями.
note from main session: НЕ интерпретируй как RX/scaled или M/F. Резолвция по атлету будет программной далеко после Phase 3.
escalation: Phase 5 — модель weight должна поддерживать dual-value notation.

## Ambiguous modifier scope

### `[ 70% EFFORT ]` — scope?
...

(etc.)

## Summary
- total primitive types: N
- total `[ ]`-annotation distinct strings: M
- exercise-level scope: X
- set/round/schema/block scope: Y/Z/...
- singletons: K
- escalations: ...
```

ACCEPTANCE

- Каждый тип primitive каталогизирован с examples + cardinality.
- Каждая distinct `[ ]`-annotation имеет указанный scope (или явный "ambiguous, см. edge-cases").
- Compound `+` и alternative `OR` каталогизированы с sub-types.
- Singletons (curly braces, dual-value weight, per-set substitution placeholders, drop-set programs) явно отмечены в edge-cases.
- Summary с цифрами в каждом артефакте.

ЧТО НЕ ДЕЛАЕТ PHASE 3.1

- НЕ проектирует Exercise entity (Phase 3.2).
- НЕ моделирует Load / %1RM (Phase 3.3).
- НЕ решает modifier first-class vs second-class — это финальное решение в Phase 5, Phase 3.1 готовит material.
- НЕ модифицирует Phase 1 / 2.1 / 2.2 артефакты.
- НЕ интерпретирует семантику упражнений ("это для силы" / "это для кардио").
- НЕ выходит выше уровня session.
- НЕ строит модель / Prisma / TS-типы.
- НЕ резолвит dual-value weight notation в RX/scaled или M/F.
- НЕ делегирует sub-agentам.

ПРАВИЛА (повтор)

- Russian для содержимого артефактов, English для идентификаторов / имён файлов.
- Без эмодзи, без подписей, без комментариев в коде.
- НЕ читать вне `analysis/`. Никакого кода, ADR, контрактов.
- НЕ память, web, video.

ОТЧЁТ ПО ОКОНЧАНИИ

В чате коротко: total primitive types, total distinct `[ ]`-annotations, modifier scope distribution, compound/alternative cardinality, singletons (curly braces, dual-value weight, per-set substitution, drop-set programs), что эскалируешь в main session.
