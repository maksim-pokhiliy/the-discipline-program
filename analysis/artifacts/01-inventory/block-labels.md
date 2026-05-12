# Block labels

Лейблы блоков внутри сессии. Дедуп case-insensitive по нормализованной форме (без `*`-префикса, без emoji, без `[ ]`-аннотаций после имени, как договорились в workflow). Все `*` и эмодзи отброшены при нормализации, но факт их появления сохранён в `raw variants`.

Композитные label'ы (`STRENGTH ENDURANCE | Gymnastics`, `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]`) — отдельные карточки: их тело принципиально отличается от plain `STRENGTH ENDURANCE`, поэтому склейка ломала бы дедуп block-instances.

- `STRENGTH ENDURANCE`

  - occurrences: 47
  - raw variants: `STRENGTH ENDURANCE:` (×39), `STRENGTH ENDURANCE` (без двоеточия, ×8)
  - first seen: sheet-01 / MONDAY / 1ST SESSION
  - notes: «без двоеточия» — поздний период, sheet-22+. Семантически тот же блок.

- `STRENGTH ENDURANCE | Gymnastics`

  - occurrences: 12
  - raw variants: `STRENGTH ENDURANCE | Gymnastics:`
  - first seen: sheet-08 / WEDNESDAY / 1ST SESSION
  - notes: композитный блок, всегда WEDNESDAY или SATURDAY. Тело — pull-ups + traverses + bar dips.

- `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]`

  - occurrences: 1
  - raw variants: `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]:`
  - first seen: sheet-12 / FRIDAY / 1ST SESSION
  - notes: единственная встреча. Аннотация `[ 70% EFFORT ]` — модификатор intensity, embed в label.

- `SUCCESSORY WORK`

  - occurrences: 99
  - raw variants: `* SUCCESSORY WORK: ⚒️` (×66), `SUCCESSORY WORK: ⚒️` (×33)
  - first seen: sheet-01 / MONDAY / 1ST SESSION
  - notes: `*`-префикс и эмодзи ⚒️ — косметика (см. правило workflow #6). Без `*` — обычно когда блок следует за `PUMP SESSION:` в WEDNESDAY (наблюдение, не правило).

- `CORE MUSCLES`

  - occurrences: 104
  - raw variants: `CORE MUSCLES:` (×99), `CORE MUSCLES` (без двоеточия, ×5)
  - first seen: sheet-01 / MONDAY / 1ST SESSION
  - notes: ×5 без двоеточия — sheet-20 SATURDAY, sheet-23 SATURDAY, sheet-26 SATURDAY, sheet-29 SATURDAY, sheet-32 SATURDAY. Все на SATURDAY после PUMP SESSION.

- `GYMNASTICS`

  - occurrences: 26
  - raw variants: `GYMNASTICS:`
  - first seen: sheet-01 / SATURDAY / 1ST SESSION
  - notes: на SATURDAY после run-warm-up. Отдельный label от `Basic GYMNASTICS` (другая позиция в дне, другое содержание — см. ниже).

- `Basic GYMNASTICS`

  - occurrences: 24
  - raw variants: `Basic GYMNASTICS:` (×15), `Basic Gymnastics:` (×6), `BASIC GYMNASTICS:` (×3)
  - first seen: sheet-01 / WEDNESDAY / 1ST SESSION
  - notes: на WEDNESDAY (типичная позиция) или SATURDAY (sheet-26/29/32). Дедуп: `Basic`/`BASIC`/`Basic` — регистронезависимый, склеены тихо.
  - возможный merge с `GYMNASTICS` — см. edge-cases (контекстуальная разница в содержимом).

- `PUMP SESSION`

  - occurrences: 39
  - raw variants: `PUMP SESSION:`
  - first seen: sheet-05 / WEDNESDAY / 1ST SESSION
  - notes: обычно WEDNESDAY (горизонтальный жим/тяга). С sheet-09 — также SATURDAY (после run).

- `INTERVALS`

  - occurrences: 5
  - raw variants: `INTERVALS:`
  - first seen: sheet-02 / MONDAY / 1ST SESSION
  - notes: header'ы `3 INTERVALS | 2 min rest in between` / `4 INTERVALS | 2 min rest in between` — НЕ block-label, это schema-header (начинается с числа). Учтены отдельно в `edge-cases.md`.

- `CHIPPER`

  - occurrences: 1
  - raw variants: `CHIPPER:`
  - first seen: sheet-06 / FRIDAY / 1ST SESSION
  - notes: единственная встреча.

- `PRACTICE [ 5-10 min ]`

  - occurrences: 2
  - raw variants: `PRACTICE [ 5-10 min ]:`
  - first seen: sheet-09 / WEDNESDAY / 1ST SESSION
  - notes: оба раза — sheet-09 и sheet-12 WEDNESDAY между Basic GYMNASTICS и PUMP SESSION. Аннотация `[ 5-10 min ]` — time-cap, embedded в label.

- `YOGA TIME`

  - occurrences: 3
  - raw variants: `YOGA TIME` (без двоеточия)
  - first seen: sheet-08 / TUESDAY / 1ST SESSION
  - notes: TUESDAY после warm-up. Тело — одна youtube-ссылка. Pattern: ALLCAPS, БЕЗ двоеточия. См. edge-cases — borderline между session-label и block-label, классифицирован как block-label по позиции в иерархии.

- `warm up for feet`

  - occurrences: 44
  - raw variants: `warm up for feet:` (×39), `warm up for feet [ BEFORE RUN ]` (×5, без двоеточия, sheet-10/13/16/19/22 SATURDAY)
  - first seen: sheet-01 / TUESDAY / 1ST SESSION
  - notes: lowercase block-label — отступление от ALLCAPS/Mixed convention. Универсально перед/после RUN. Содержит 2 youtube-ссылки на разминку стоп. См. edge-cases.

- `warm up BEFORE run`

  - occurrences: 6
  - raw variants: `warm up BEFORE run:`
  - first seen: sheet-02 / TUESDAY / 1ST SESSION
  - notes: lowercase. Только в ранних листах (sheet-02/04/06). Позднее заменяется на `3 sets WARM UP BEFORE RUN:` и `Warm Up before RUN | 3 sets:` (см. ниже).

- `3 sets WARM UP BEFORE RUN`

  - occurrences: 5
  - raw variants: `3 sets WARM UP BEFORE RUN:`
  - first seen: sheet-11 / TUESDAY / 1ST SESSION
  - notes: composite label — содержит число `3 sets` и категориальное `WARM UP BEFORE RUN`. Структурно «schema-header + категория». Эквивалент `warm up BEFORE run` со встроенным «3 sets».

- `Warm Up before RUN | 3 sets`
  - occurrences: 2
  - raw variants: `Warm Up before RUN | 3 sets:`
  - first seen: sheet-15 / TUESDAY / 1ST SESSION
  - notes: ещё один composite вариант той же сущности (mixed case, разделитель `|`).

Edge-case `Temporarily without STRENGTH ENDURANCE`: появляется 7 раз (sheet-16/17/19 MON+FRI и sheet-20 MON), на позиции, где обычно стоит block-label. Это **не** block-label — это инструкция тренера «сегодня без strength endurance». См. `edge-cases.md`.

Edge-case `then:`, `...then...:`, `...THEN 2 rounds:`: connector-строки внутри блока, вводят следующую schema. НЕ block-label.

Edge-case schema-headers, начинающиеся с числа (`3 sets:`, `4 rounds:`, `EMOM 16 min | 4 rounds:`, `AMRAP 12 min:`, `30-20-10:`, `5 rounds | 2 min rest in between rounds`, `3 INTERVALS | 2 min rest in between` и т.п.) — НЕ block-label, это schema-header. См. workflow Phase 2.
