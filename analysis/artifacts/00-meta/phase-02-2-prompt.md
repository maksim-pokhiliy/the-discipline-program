Задача: Phase 2.2 — каталогизация архетипов schemas для проекта построения доменной модели тренировочных сессий.

КОНТЕКСТ

Ты — соседняя сессия в рамках workflow по построению доменной модели тренировочных сессий. Phase 1 (Inventory) и Phase 2.1 (Schema boundaries) уже выполнены, артефакты лежат в `analysis/artifacts/01-inventory/` и `analysis/artifacts/02-patterns/` соответственно.

ПЕРВЫМ ДЕЛОМ прочитай файл-контракт:

`/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/00-meta/workflow.md`

Там цели проекта, правила работы, глоссарий, описание фаз. Не нарушать. Эта задача = Phase 2.2 (Schema archetypes).

DECISIONS INHERITED ОТ MAIN SESSION (после ревью Phase 2.1)

Главная сессия проинспектировала Phase 2.1 и ratified следующие решения:

1. **Connector convention**: `then:` / `...then...:` помещены в конец body предыдущей schema. Это окончательно. НЕ переразмечать.
2. **Alternation block-009**: `1st | 3rd | 5th sets:` + `2nd | 4th | 6th sets` = 2 atomic schemas. Связь между ними структурно архетипальная (alternation-pattern), не nested и не composite. Реализуется на уровне archetype, не структурно.
3. **`...then... | N-M-L:`** (block-046) = atomic. `...then...` это connector (не параметр), `N-M-L` — основная структурная нагрузка. Отличается от composite headers где обе стороны `|` — параметры.
4. **30-HSPU-TOTAL preface** = отдельная headerless schema. `[ TOTAL ]` маркер делает row структурно отличным от внутренностей следующей `4 sets:` ladder. Архетип "preface + work" — задача Phase 2.2.
5. **Headerless без internal markers** (block-004, 033, 034, 036, 145 и др) = headerless как зонтичный kind. В Phase 2.2 они должны разойтись в разные архетипы (parallel-ladder vs flat-list / chipper / for-time), но Phase 2.1 разметка остаётся как есть.
6. **case-rest-split-parallel** (block-005, 035) = 2 headerless schemas — оставлено.

INVENTORY CORRECTIONS (те же, что в Phase 2.1)

- `Temporarily without STRENGTH ENDURANCE` (7 occurrences) — это инструкция тренера, не block-label. Phase 2.1 уже обработал их как `(implicit)` блоки.
- Composite labels (`STRENGTH ENDURANCE | Gymnastics`), basic-vs-gymnastics, lowercase blocks, empty bodies — Phase 4.
- Scope: ниже уровня недели. Никаких calendar / progression / weekly наблюдений.

ВХОДНЫЕ ДАННЫЕ

- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/schema-boundaries.md` — ОСНОВНОЙ материал. 198 cards, 337 schemas. Ground truth для архетипизации.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/edge-cases.md` — Phase 2.1 observations про спорные решения. Используй для понимания структуры.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/block-instances.md` — справочно (raw bodies, contexts).
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/exercise-instances.md` — справочно (имена упражнений).

ЦЕЛЬ

Сгруппировать 337 schemas в каталог архетипов по структуре исполнения. Каждый архетип — это класс эквивалентности schemas с одинаковой структурой. Параметры внутри архетипа варьируются, инварианты — нет.

КОНЦЕПЦИЯ АРХЕТИПА

Архетип — это **класс эквивалентности schemas по форме исполнения**. Не семантика, не цель тренировки, не интенсивность — только структурная форма "как это делается".

Каждый архетип содержит:

- **Имя** (English, kebab-case): `ladder-descending`, `parallel-ladders`, `emom-sub-min`, `for-time-flat-list`, `alternating-sets`, и т.п.
- **Структурная инвариантa** — что обязательно одинаково между instances:
  - `kind` schemas в этом архетипе (atomic / headerless / nested / named / composite)
  - форма header'а (например `N-M-...-K:` для ladder; `EMOM N min` для EMOM; null для headerless flat-list)
  - layout body (например "одно упражнение под header" / "exercise list" / "compound rows")
  - наличие/отсутствие nesting и его форма
- **Параметры** — что варьируется между instances:
  - числа (rounds, sets, steps, time, weights)
  - упражнения и их imports
  - modifiers (annotation contents)
  - время / интенсивность
- **Примеры** — 3-7 instances в формате `block-NNN / schema-N` со ссылкой на `schema-boundaries.md`. Для singleton — `cardinality: 1` + 1 пример.
- **Связи** с другими архетипами:
  - **specialization-of** — этот архетип специализация более общего
  - **extension-of** — добавляет nesting или modifier поверх базового
  - **paired-with** — обычно встречается рядом с другим архетипом (например ladder-descending + ladder-ascending как пара "12-9-6: / 6-9-12:")
  - **continuation-of** — продолжение другого архетипа через `...THEN N rounds:`
- **Cardinality** — сколько schemas принадлежит архетипу (точное число).
- **Notes** (опционально) — наблюдения, особенности, явные ограничения.

ПОДХОД — два прохода

**Pass 1: Agglomerative grouping.** Проходишь все 337 schemas из `schema-boundaries.md`. Для каждой определяешь её структурную сигнатуру (kind + header form + body layout) и относишь к существующему архетипу или создаёшь новый.

Не лимитируй число архетипов. Лучше fine-grained (больше архетипов с тонкими различиями), чем потерять различия слепой агрегацией.

**Pass 2: Stabilization.** Проходишь созданный каталог архетипов:

- Объединяешь архетипы с **идентичной структурной сигнатурой** (если разные header notations дают одинаковую форму исполнения — это один архетип с notation variants).
- Не объединяешь архетипы с разной структурой, даже если они "семантически близки" (`ladder-descending` и `ladder-ascending` — разные архетипы; они paired-with, но не merged).
- Singletons (cardinality=1) оставляешь как отдельные архетипы, помечая `singleton: true`.

EXPECTED FAMILIES (ХИНТ, НЕ ПРЕДПИСАНИЕ)

Это namespace ожидаемых семейств, чтобы тебя сориентировать. Реальные имена и точные различия — определяешь сам по данным.

- **Ladder family**: `ladder-descending` (`21-15-9:`, `36-28-20:`), `ladder-ascending` (`6-9-12:`), pyramid вверх-вниз, pit вниз-вверх, `parallel-ladders` (3+ parallel ladders с разными exercises).
- **Sets/rounds family**: `n-sets`, `n-rounds`, `n-rounds-for-time`, sets с темой (`3 sets | shoulders:`).
- **Time-cap family**: `amrap`, `for-time-flat-list` (chipper-like flat sequence), `emom-flat` (без sub-min), `emom-sub-min` (с per-min payloads), `intervals` (`3 INTERVALS | 2 min rest in between`), `time-window-staged` (`0:00-10:00 min:` — singleton).
- **Composite family**: `composite-with-rest` (`5 rounds | 2 min rest in between`), `composite-with-rounds` (`EMOM N | M rounds`), и т.п.
- **Continuation family**: `then-continuation` (`...THEN N rounds:` — продолжение, оформленное Phase 2.1 как часть предыдущей schema). Это паттерн на уровне archetype, не отдельная schema.
- **Alternation family**: `alternating-sets` (singleton block-009 — 2 atomic schemas, выполняемых в чередовании).
- **Named family**: `named-themed-sets` (`3 sets | shoulders:`, `3 sets | legs & glutes:`), `named-exercise-program` (`Bulgarian split squats:` с drop-set программой в `[ ]`).
- **Flat-list / Chipper family**: `for-time-chipper` или `flat-exercise-list` (headerless без internal markers — block-004, 034, 036, 145).
- **Preface family**: `preface-then-work` (`30 HSPU [ TOTAL ]` + следующая schema).

Это хинт. Возможны дополнительные семейства или иные расщепления. Структурное обоснование первично.

ЧТО НЕ ДЕЛАЕТ Phase 2.2

- НЕ проектирует модель / entities / Prisma / атрибуты упражнений.
- НЕ модифицирует Phase 1 / 2.1 артефакты.
- НЕ перенарезает schemas в boundaries.
- НЕ выходит выше уровня session.
- НЕ интерпретирует семантику ("это для силы" / "это для кардио") — только структуру.
- НЕ делегирует sub-agentам — нужен исчерпывающий проход.
- НЕ создаёт kind'ов (это Phase 2.1).

ВЫХОДНЫЕ АРТЕФАКТЫ

В `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/`:

1. `schema-archetypes.md` — основной каталог архетипов. Сгруппирован по семействам.
2. `schema-archetype-mapping.md` — обратная карта `schema → archetype` для верификации coverage. Формат: список всех 337 schemas с указанием их архетипа.
3. `archetype-edge-cases.md` — singletons, ambiguous mappings, архетипы которые трудно отделить друг от друга, эскалации в main session.

ФОРМАТ schema-archetypes.md

```
# Schema archetypes

Каталог структурных архетипов schemas, выведенных из 337 schemas Phase 2.1 разметки.

## Ladder family

### archetype-ladder-descending

structural-invariant:
- kind: atomic
- header: `N1-N2-...-Nk:` где N_i убывает строго (k=3..7)
- body: одно упражнение или compound row
parameters:
- steps: убывающая последовательность чисел
- exercise: имя + modifiers
examples:
- block-NNN / schema-1 (header `21-15-9:`, body `DB Thrusters`)
- block-MMM / schema-2 (header `12-9-6:`, body `bench presses + row`)
- ... (3-7 примеров)
cardinality: 28
related:
- paired-with: archetype-ladder-ascending
- specialization-of: archetype-parallel-ladders (когда несколько ladders в headerless)
notes:
- встречается в STRENGTH ENDURANCE, Basic GYMNASTICS, STRENGTH ENDURANCE | Gymnastics

### archetype-parallel-ladders

structural-invariant:
- kind: headerless
- header: null
- body: 2..5 пар (числовая последовательность `:` + упражнение), параллельно исполняемых
parameters:
- ladders count
- per-ladder steps
- per-ladder exercise
examples:
- block-037 / schema-1 (3 параллельные `36-28-20 / 18-14-10 / 4-3-2` + Snatches / squats / HSPU)
- ...
cardinality: 12
notes:
- canonical пример sample: block-037. Может включать trailing `[ EXAMPLE: ... ]`-аннотацию.

## Sets/rounds family
...
```

ФОРМАТ schema-archetype-mapping.md

```
# Schema → archetype mapping

Полная карта всех 337 schemas (top-level 312 + sub-schemas 25) с указанием их архетипа.

## Block-instances mapping

### block-001
- schema-1 → archetype-n-rounds (cardinality block: 1 schema)

### block-002
- (empty body, no schemas)

### block-003
- schema-1 → archetype-time-window-staged
  - sub-1 → archetype-n-rounds
- schema-2 → archetype-time-window-staged
  - sub-1 → archetype-ladder-descending
- (cardinality block: 2 nested schemas + 2 sub-schemas)

### block-008
- schema-1 → archetype-parallel-ladders
- schema-2 → archetype-named-exercise-program
- (cardinality block: 2 schemas)

...
```

ФОРМАТ archetype-edge-cases.md

```
# Phase 2.2 edge cases

## Singletons

### archetype-time-window-staged (cardinality 1, block-003)
context: только один блок в sample.
escalation: Phase 5 — оставлять отдельный архетип или сливать с другим nested?

### archetype-alternating-sets (cardinality 1, block-009)
...

## Ambiguous mappings

### schema-X / block-NNN — atomic с composite header `K rounds | M min rest`
options:
- (a) archetype-n-rounds с modifier `rest in between`
- (b) archetype-composite-with-rest
decision: ...

## Archetypes которые трудно отделить
...

## Summary
- total archetypes: N
- by family: ...
- singletons: M
- ambiguous: K
- escalations: ...
```

ACCEPTANCE

- Все 337 schemas (312 top-level + 25 sub-schemas) размечены ровно в один архетип. Не маппится в один — kind=edge с обоснованием в archetype-edge-cases.md.
- Каждый ratified эскалейшн Phase 2.1 имеет свой архетип:
  - block-003 time-window → singleton archetype (например `archetype-time-window-staged`).
  - block-009 alternation → `archetype-alternating-sets` (singleton).
  - 30-HSPU-TOTAL preface → archetype типа `archetype-preface-then-work` или подобный.
- Все singletons (cardinality=1) сохранены как отдельные архетипы, не выброшены.
- `schema-archetype-mapping.md` покрывает все 198 block-instances (включая 3 с empty body).
- В `archetype-edge-cases.md` финальный summary с цифрами.

ПРАВИЛА РАБОТЫ

- НЕ читать вне `analysis/`. Никакого кода проекта, ADR, контрактов.
- НЕ память, web, video.
- НЕ строить модель / Prisma / атрибуты упражнений.
- НЕ модифицировать Phase 1 / 2.1 артефакты.
- НЕ перенарезать schemas.
- НЕ делегировать sub-agentам.
- Russian для содержимого артефактов, English для идентификаторов и имён файлов.
- Без эмодзи, без подписей, без комментариев в коде.

ОТЧЁТ ПО ОКОНЧАНИИ

В чате коротко: total archetypes по семействам, top-10 архетипов по cardinality, singletons, ambiguous mappings (top-5), что эскалируешь в main session.
