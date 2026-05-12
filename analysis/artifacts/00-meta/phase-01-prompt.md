Задача: Phase 1 inventory pass для проекта построения доменной модели тренировочных сессий с нуля.

КОНТЕКСТ

Ты — соседняя сессия в рамках workflow по построению доменной модели тренировочных сессий от тренировочной таблицы. Главная сессия (которая тебя запустила) выступает диспетчером; ты выполняешь конкретную фазу.

ПЕРВЫМ ДЕЛОМ прочитай файл-контракт:

`/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/00-meta/workflow.md`

Там цели проекта, жёсткие правила работы, глоссарий, описание всех фаз, decision points. Это контракт — не нарушать. Эта задача = Phase 1 (Inventory).

ВХОДНЫЕ ДАННЫЕ

- `/home/maksym/projects/contrib/the-discipline-program/analysis/source/sheets/sheet-01.md` … `sheet-33.md` — 33 markdown'а с дампом тренировочной таблицы (одна неделя на файл). Внутри 7 H2-секций (MONDAY..SUNDAY) с упорядоченными по строкам ячейками; row-номер в формате `(r{N})` в начале каждой строки.
- `quick-search.md` в той же папке — это TOC, ИГНОРИРОВАТЬ.

ЦЕЛЬ

Сырая инвентаризация без классификации. Никакой группировки по типу схемы, никакого вывода атрибутов упражнений, никакого "это похоже на X". Классификация и выводы — следующие фазы.

ВЫХОДНЫЕ АРТЕФАКТЫ

Создай в `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/`:

1. `day-labels.md` — лейблы дней (`R E S T  D A Y` и т.п.). MONDAY..SUNDAY = координата, не label, НЕ пишем.
2. `session-labels.md` — лейблы сессий (`1ST SESSION:`, `YOGA`, ...).
3. `block-labels.md` — лейблы блоков (`STRENGTH ENDURANCE:`, `* SUCCESSORY WORK: ⚒️`, `CORE MUSCLES:`, ...).
4. `block-instances.md` — карточки на каждый блок (тело целиком).
5. `exercise-instances.md` — карточки на каждое уникальное упражнение.
6. `edge-cases.md` — всё подозрительное + наблюдения + finalный summary.

ПОДХОД — два прохода

PASS 1: LABELS

Один прогон по всем 33 sheet'ам. Собери три словаря лейблов.

- **day-label** — заголовок дня поверх координаты MONDAY..SUNDAY. Пример: `R E S T  D A Y`. Сами имена дней недели НЕ являются day-labels.
- **session-label** — идёт сразу под координатой дня. Пример: `1ST SESSION:`, `YOGA`. Обычно ALLCAPS + двоеточие, но могут быть варианты.
- **block-label** — внутри сессии. Примеры: `STRENGTH ENDURANCE:`, `* SUCCESSORY WORK: ⚒️`, `CORE MUSCLES:`, `GYMNASTICS:`, `Basic GYMNASTICS:`. Обычно ALLCAPS/Mixed + двоеточие. Могут иметь префикс `*` и эмодзи (⚒️, 🔥). При нормализации label префикс и эмодзи отбрасываются: `* SUCCESSORY WORK: ⚒️` → `SUCCESSORY WORK`. Сам факт префикса/эмодзи у label фиксируется в `edge-cases.md` как наблюдение для будущей классификации (не как ошибка).

Дедуп: case-insensitive. `CORE MUSCLES` = `Core Muscles` = `core muscles` = одно. Явные опечатки сливаются с канонической формой молча; неоднозначные дубли — в edge-cases.

Формат каждого `*-labels.md`:

```
# {Day|Session|Block} labels

- `STRENGTH ENDURANCE`
  - occurrences: 24
  - raw variants: `STRENGTH ENDURANCE:`, `Strength endurance:`
  - first seen: sheet-01 / MONDAY / 1ST SESSION
- `CORE MUSCLES`
  - occurrences: 33
  - raw variants: `CORE MUSCLES:`, `Core Muscles:`
  - first seen: sheet-01 / MONDAY / 1ST SESSION
```

PASS 2: BLOCK-INSTANCES + EXERCISE-INSTANCES

Используя список block-labels из Pass 1, разбей каждый день на блоки. Блок начинается на строке-block-label и заканчивается перед следующим block-label, session-label, day-label или концом дня.

ВАЖНО: границы определяй по block-label, НЕ по пустым строкам. Пустых строк в исходнике значительно больше, чем реальных границ.

Тело блока — всё что между маркерами, ДОСЛОВНО:

- `[ ]`-аннотации (`[ 15 kg ]`, `[ alternative ]`, `[ each leg ]`, `[ EXAMPLE: ... ]`)
- URL'ы (как plain text)
- межблочные строки типа `- 5 min rest in between sets -`
- header'ы schemas (`3 sets:`, `36-28-20:`, `EMOM 16`) — НЕ выделяй отдельно, оставь в raw
- упражнения и их параметры
- инструктивные пометки

Дедуп block-instances:

- Сравнение по `(block-label-normalized, raw-content)` — точное совпадение.
- Идентичные incidence: одна карточка, несколько контекстов в списке `locations`.
- Любое различие (15 kg → 17.5 kg, +1 повтор, отличающийся URL): отдельные карточки.

Формат `block-instances.md`:

```
# Block instances

### block-001

block-label: STRENGTH ENDURANCE
locations:
- sheet-01 / MONDAY / 1ST SESSION (rows 5-13)
- sheet-04 / WEDNESDAY / 1ST SESSION (rows 5-13)
raw:
  36-28-20:
  DB Snatches [ 15 kg ] [ alternative ]
  18-14-10:
  DB squats [ 2x 15 kg ]
  4-3-2:
  strict HSPU
  [ EXAMPLE: 36... 18... 4... then... 28... 14... 3... etc. ]

### block-002
...
```

Из тел блоков выпиши уникальные упражнения в `exercise-instances.md`.

Дедуп exercises:

- Нормализованное имя — case-insensitive, без `[ ]`-модификаторов, без количества повторов и веса в начале строки.
- Примеры:
  - `10 DB seated good morning [ https://... ]` → имя `DB seated good morning`
  - `DB Snatches [ 15 kg ] [ alternative ]` → имя `DB Snatches`
  - `15 single leg GLUTE BRIDGE [ ... ] [ each leg ]` → имя `single leg GLUTE BRIDGE`
- Все варианты сырого текста — в `occurrences`.

Формат `exercise-instances.md`:

```
# Exercise instances

### DB Snatches

occurrences:
- "DB Snatches [ 15 kg ] [ alternative ]"
- "10 DB Snatches [ 17.5 kg ]"

contexts:
- sheet-01 / MON / 1ST / STRENGTH ENDURANCE
- sheet-04 / TUE / 1ST / STRENGTH ENDURANCE

### single leg GLUTE BRIDGE
...
```

EDGE CASES

В `edge-cases.md` пиши:

- Дубли с разным написанием, на которые сомневаешься сливать.
- Обрывы (label без тела, тело без label).
- Footer-links / технический шум типа `(r58) Quick Search` — НЕ в block-instances.
- Строки с неоднозначной ролью в иерархии.
- Наблюдения про префиксы `*` и эмодзи у labels.
- Любая неоднозначность — лучше эскалировать, чем тихо отбросить.

Структура `edge-cases.md`:

```
# Edge cases

## Подозрительные дубли labels
...

## Спорные границы блоков
...

## Технический шум
...

## Наблюдения о структуре
...

## Summary
- scanned: 33 sheets
- day-labels: N
- session-labels: N
- block-labels: N
- block-instances unique: N
- exercises unique: K
- edge cases: L
```

ПРАВИЛА РАБОТЫ

- НЕ читать ничего вне `analysis/`. Никакого кода проекта (`apps/`, `packages/`), никаких ADR, никаких пакетов, никакой Prisma schema, никаких контрактов.
- НЕ использовать память, web, video-ссылки. Работа в вакууме.
- НЕ строить модель, НЕ писать Prisma, НЕ выводить атрибуты упражнений.
- НЕ делить блок на schemas — это Phase 2.
- НЕ классифицировать паттерны (`36-28-20` и `21-15-9` НЕ группируй в "лесенки") — это Phase 2.
- НЕ делегируй sub-agentам (Explore/general-purpose) — работа требует исчерпывающего прохода, не sampling.
- `[ ]`-аннотации — inline в `raw` и `occurrences`, не отрываем от контекста.
- Эмодзи и `*`-маркеры — отбрасываются при нормализации labels/exercises; факт встречи фиксируется в edge-cases.
- Дедуп case-insensitive, явные опечатки сливаются молча, неоднозначные — в edge-cases.
- Russian для содержимого артефактов, English для идентификаторов и имён файлов.
- Никаких комментариев в коде / артефактах (если что-то генеришь).

ACCEPTANCE

- Все 33 sheet'а просканированы.
- Каждая non-empty строка из любого `sheet-*.md` попала либо в один из 5 inventory артефактов, либо в `edge-cases.md`. Ничего не теряется.
- `edge-cases.md` заканчивается summary с цифрами.

ОТЧЁТ ПО ОКОНЧАНИИ

В чате коротко: счётчики (sheets, labels по типам, block-instances, exercises, edge-cases), главные observations, что вызвало сомнения. Минимум воды.
