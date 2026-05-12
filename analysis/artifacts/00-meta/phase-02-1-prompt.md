Задача: Phase 2.1 — определение границ schemas внутри тел блоков для проекта построения доменной модели тренировочных сессий.

КОНТЕКСТ

Ты — соседняя сессия в рамках workflow по построению доменной модели тренировочных сессий. Главная сессия — диспетчер; ты выполняешь конкретную фазу. Phase 1 (Inventory) уже выполнена, артефакты лежат в `analysis/artifacts/01-inventory/`.

ПЕРВЫМ ДЕЛОМ прочитай файл-контракт:

`/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/00-meta/workflow.md`

Там цели проекта, жёсткие правила работы, глоссарий, описание всех фаз, decision points. Не нарушать. Эта задача = Phase 2.1 (Schema boundaries).

ВАЖНО: Phase 2 раздвоена. Phase 2.1 — только разметка границ schemas внутри block bodies (эта задача). Phase 2.2 — классификация schemas в архетипы — будет отдельной сессией позже. Не лезь в архетипизацию.

INVENTORY CORRECTIONS ОТ MAIN SESSION

Принятые решения, которые ты применяешь при работе с inventory:

1. `Temporarily without STRENGTH ENDURANCE` (7 occurrences в `block-instances.md`) — это инструкция тренера, НЕ block-label. Когда обрабатываешь эти 7 блоков, label игнорируешь и работаешь с body как с `(implicit)` блоком.

2. Все остальные решения по неоднозначностям (composite labels с `|`, basic-vs-gymnastics, lowercase blocks, empty-body blocks) — оставлены на Phase 4. Inventory — ground truth. НЕ интерпретируй их сейчас.

3. Scope: ниже уровня недели. Никаких calendar/progression/weekly наблюдений. Если такие найдёшь в edge-cases.md из Phase 1 — игнорируй.

ВХОДНЫЕ ДАННЫЕ

- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/block-instances.md` — 198 карточек блоков с raw bodies. ОСНОВНОЙ материал.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/edge-cases.md` — наблюдения Phase 1 про schema-related паттерны. Используй для понимания структуры, не как ground-truth-классификацию.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/exercise-instances.md` — справочно для проверки названий упражнений. НЕ модифицировать.

Source sheets (`analysis/source/sheets/`) НЕ нужны — Phase 1 уже всё извлёк в block-instances. Если внезапно нужна перепроверка контекста — можно читать, но не основной workflow.

ЦЕЛЬ

Для каждого block-instance.raw разделить body на schemas с указанием структурного типа (`kind`). Это разметка, не классификация. Архетипизация (ladder, EMOM, AMRAP и т.п.) — следующая фаза.

КОНЦЕПЦИЯ SCHEMA

Schema — единица «как это исполняется». Внутри одного блока может быть от 0 до N schemas. В sample встречаются 5 структурных видов (`kind`):

### 1. atomic

Header + body на одном уровне. Header — явная строка-метка, body — последующие строки до конца блока или начала следующей schema.

Примеры headers:

- numeric: `3 sets:`, `5 rounds:`, `21-15-9:`, `3-5 rounds:`, `4 INTERVALS:`
- modal: `EMOM 16 min`, `AMRAP 12 min`, `CHIPPER:`
- composite (несколько параметров через `|`): `EMOM 16 min | 4 rounds:`, `3 sets | shoulders:`, `5 rounds | 2 min rest in between rounds`, `Every 4th min new round | x4 rounds | 16 min`

Пример atomic schema:

```
3-5 rounds:
50 jumping Jacks
10 DB bench presses [ 2x 15 kg ]
50 jumping Jacks
10 Incline DB Prone Row [ ... ]
```

### 2. headerless

Body без header'а. Внутри body есть собственные числовые/программные маркеры, описывающие исполнение, но они НЕ являются schema-уровневым header'ом — они часть тела составной schema.

Канонический пример — параллельные лесенки:

```
36-28-20:
DB Snatches [ 15 kg ] [ alternative ]
18-14-10:
DB squats [ 2x 15 kg ]
4-3-2:
strict HSPU
[ EXAMPLE: 36... 18... 4... then... 28... 14... 3... etc. ]
```

Это **одна** schema (составная — три параллельные лесенки), не три. `36-28-20:` / `18-14-10:` / `4-3-2:` — это шаги/параметры исполнения, не отдельные headers.

`kind: headerless`, `header: null`, body содержит всю структуру дословно.

### 3. nested

Outer container, внутри которого ОДНА ИЛИ НЕСКОЛЬКО sub-schemas. Наблюдённый случай — time-window:

```
0:00-10:00 min:
3 rounds:
100 single unders
10 power snatches [ 2x 15 kg ]
10:00-20:00 min:
15-12-9:
burpees over DB
overhead squats [ 50/30 kg ]
```

Здесь две nested schemas:

- `0:00-10:00 min:` (outer) → внутри atomic schema `3 rounds:` → exercises
- `10:00-20:00 min:` (outer) → внутри headerless schema (или atomic с header `15-12-9:` — реши по контексту) → exercises

`kind: nested`, header = строка outer container, sub-schemas — список с собственными `kind`.

EMOM-схемы с sub-min маркерами (`1 min:`, `2 min:`, `1st & 2nd min:`, `3 & 4 min:`, `1st | 3rd | 5th sets:`) — это **тоже nested**. Outer `kind: nested`, header `EMOM N min`, sub-schemas = блоки по минутам.

### 4. named

Header это собственное имя schema (обычно по теме или упражнению). Body исполняется в контексте этого имени. Примеры:

- `Bulgarian split squats:` + drop-set body
- `3 sets | shoulders:` (composite header с темой)
- `3 sets | legs & glutes:`

Граница с atomic тонкая: `3 sets | shoulders:` — это named (с темой `shoulders`) или composite atomic (с двумя параметрами)? Решай по присутствию темы:

- если правая часть `|` — это число/параметр (`4 rounds`, `2 min rest`) → composite atomic
- если правая часть — тема/категория/имя упражнения (`shoulders`, `legs & glutes`, `Gymnastics`) → named

Если сомнения — `kind: named` и пометить в edge-cases.

Пример named:

```
Bulgarian split squats:
3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]
[ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ]
- REST IN BETWEEN SETS UNTIL RECOVERY -
```

ВНИМАНИЕ: вложенная программа внутри `[ ]` (`[ x5 [...] ...then... x5 [...] ]`) — это **Phase 3**, не лезь внутрь. Body сохраняется дословно.

### 5. composite

Когда header сам сложносоставной (содержит несколько параметров через `|`), но это всё ещё ОДНА schema, не nested. Примеры:

- `EMOM 16 min | 4 rounds:` — один EMOM с заданным числом раундов, не nested. Если внутри есть sub-min markers — kind = `nested`.
- `Every 4th min new round | x4 rounds | 16 min` — composite atomic.
- `5 rounds | 2 min rest in between rounds:` — composite atomic.

Разница composite vs nested: composite — один header с несколькими параметрами в строке; nested — outer header содержит inner schema(s) на отдельных строках под ним.

CONNECTORS МЕЖДУ SCHEMAS

`then:`, `...then...`, `...THEN 2 rounds:` — соединители между schemas в одном блоке. Реши по контексту:

- если выглядит как продолжение предыдущей schema (`...THEN 2 rounds:` после atomic schema) — отнеси к той же schema, дополнив body.
- если выглядит как новая schema (`then:` + новый header) — новая schema, body начинается с `then:` и заканчивается перед следующим header'ом.
- `...then... | 12-9-6:` — это composite header новой schema, kind=atomic с header=`...then... | 12-9-6:`.

Спорные случаи — в edge-cases.

ЧТО НЕ ТРОГАТЬ

- НЕ лезть внутрь `[ ]`-аннотаций, даже если там сложная программа (drop-set в Bulgarian split squats, per-set substitution в `[ 1st set: HANG SQUAT CLEANS | 2nd set: HANG POWER CLEANS | 3rd set: FRONT SQUATS ]`). Это Phase 3.
- НЕ интерпретировать `*DB exercise` / `* Burpee variation` placeholder — это Phase 3.
- НЕ группировать schemas в архетипы — Phase 2.2.
- НЕ выводить атрибуты упражнений — Phase 3.
- НЕ модифицировать Phase 1 артефакты.
- НЕ интерпретировать composite labels блоков (`STRENGTH ENDURANCE | Gymnastics`) — это label, ты работаешь с body.
- НЕ выходить выше уровня session.

ВЫХОДНЫЕ АРТЕФАКТЫ

В `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/`:

1. `schema-boundaries.md` — основная разметка, карточка на каждый block-instance.
2. `edge-cases.md` — спорные boundaries, неоднозначные `kind`, что вызвало сомнения. Отдельный файл от `01-inventory/edge-cases.md`, чтобы Phase 1 edge-cases не путались с Phase 2.

ФОРМАТ КАРТОЧКИ schema-boundaries.md

Структура единая, поле `kind` обязательное.

Atomic:

```
### block-001 (STRENGTH ENDURANCE)
source: block-instances.md → block-001
schemas:
- schema-1:
    kind: atomic
    header: "3-5 rounds:"
    body: |
      50 jumping Jacks
      10 DB bench presses [ 2x 15 kg ]
      50 jumping Jacks
      10 Incline DB Prone Row [ ... ] [ 2x 15 kg ]
```

Headerless:

```
### block-XXX (STRENGTH ENDURANCE)
source: block-instances.md → block-XXX
schemas:
- schema-1:
    kind: headerless
    header: null
    body: |
      36-28-20:
      DB Snatches [ 15 kg ] [ alternative ]
      18-14-10:
      DB squats [ 2x 15 kg ]
      4-3-2:
      strict HSPU
      [ EXAMPLE: 36... 18... 4... then... 28... 14... 3... etc. ]
```

Nested (time-window):

```
### block-XXX (STRENGTH ENDURANCE)
source: block-instances.md → block-XXX
schemas:
- schema-1:
    kind: nested
    header: "0:00-10:00 min:"
    sub-schemas:
    - sub-1:
        kind: atomic
        header: "3 rounds:"
        body: |
          100 single unders
          10 power snatches [ 2x 15 kg ]
- schema-2:
    kind: nested
    header: "10:00-20:00 min:"
    sub-schemas:
    - sub-1:
        kind: atomic
        header: "15-12-9:"
        body: |
          burpees over DB
          overhead squats [ 50/30 kg ]
```

Nested (EMOM с sub-min):

```
schemas:
- schema-1:
    kind: nested
    header: "EMOM 16 min:"
    sub-schemas:
    - sub-1:
        kind: atomic
        header: "1st & 2nd min:"
        body: |
          ...
    - sub-2:
        kind: atomic
        header: "3 & 4 min:"
        body: |
          ...
```

Named:

```
schemas:
- schema-1:
    kind: named
    header: "Bulgarian split squats:"
    body: |
      3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]
      [ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ]
      - REST IN BETWEEN SETS UNTIL RECOVERY -
```

Composite (atomic с composite header):

```
schemas:
- schema-1:
    kind: composite
    header: "EMOM 16 min | 4 rounds:"
    body: |
      ...
```

Edge:

```
schemas:
- schema-1:
    kind: edge
    header: <если есть>
    body: |
      <дословно>
    note: <короткое описание почему edge — для cross-ref с edge-cases.md>
```

Empty body block:

```
### block-002 (STRENGTH ENDURANCE)
source: block-instances.md → block-002
schemas: []
note: empty body, см. inventory edge-cases.
```

Implicit-блоки (включая 7 переклассифицированных `Temporarily without STRENGTH ENDURANCE`) — тот же формат, label в скобках указывается как `(implicit)`. Body обрабатывается обычным образом.

ФОРМАТ edge-cases.md

```
# Phase 2.1 edge cases

## Спорные boundaries

### case-1: ...
source: block-XXX
context: <какая строка вызвала вопрос>
options: <какие интерпретации возможны>
decision: <что выбрал и почему>

## Неоднозначный kind

### case-N: composite vs nested для X
...

## Singletons

### case-M: time-range schema (только в block-003, sheet-06 MONDAY)
...

## Summary
- total schemas: N
- by kind: atomic X, headerless Y, nested Z, named W, composite V, edge E
- top spotted patterns: ...
- escalations to main session: ...
```

ACCEPTANCE

- Каждый из 198 block-instances имеет запись в `schema-boundaries.md` (включая `(implicit)` блоки и блоки с empty body).
- Никакая non-аннотационная строка body не теряется (то есть всё что выходит из inventory body должно появиться в одной из schemas, либо в edge-cases с явным обоснованием).
- `[ ]`-аннотации остаются inline в body, не выдираются.
- Никакая строка не дублируется в две schemas (за исключением legitimate sub-schemas внутри nested).
- В `edge-cases.md` финальный summary с цифрами по `kind`.

ПРАВИЛА РАБОТЫ (повтор из workflow.md)

- НЕ читать вне `analysis/`. Никакого кода проекта, ADR, контрактов.
- НЕ память, web, video.
- НЕ строить модель / Prisma / атрибуты упражнений.
- НЕ архетипизация (Phase 2.2).
- НЕ модифицировать Phase 1 артефакты.
- НЕ делегировать sub-agentам — нужен исчерпывающий проход.
- Russian для содержимого артефактов, English для идентификаторов и имён файлов.
- Без эмодзи, без `*`-Co-Authored-By, без комментариев в коде.

ОТЧЁТ ПО ОКОНЧАНИИ

В чате коротко: total schemas, распределение по kind, top-5 спорных, что эскалируешь в main session.
