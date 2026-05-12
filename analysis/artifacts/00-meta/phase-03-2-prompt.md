Задача: Phase 3.2 — Exercise as entity, для проекта построения доменной модели тренировочных сессий.

КОНТЕКСТ

Ты — соседняя сессия в рамках workflow по построению доменной модели тренировочных сессий. Phase 1 (Inventory), Phase 2.1 (Schema boundaries), Phase 2.2 (Archetypes), Phase 3.1 (Schema content primitives) выполнены, артефакты в `analysis/artifacts/01-inventory/`, `02-patterns/`, `03-content/`.

ПЕРВЫМ ДЕЛОМ прочитай файл-контракт:

`/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/00-meta/workflow.md`

Там цели, правила, глоссарий, фазы. Не нарушать. Эта задача = Phase 3.2 (Exercise as entity — второй из трёх sub-promptов Phase 3).

ВАЖНО: Phase 3 разбита на 3 sub-prompts. Phase 3.1 — содержимое schemas (primitives). Phase 3.2 (эта задача) — Exercise атрибуты. Phase 3.3 (позже) — Load representation. Не лезь в 3.3.

DECISIONS INHERITED ОТ MAIN SESSION

1. Phase 1, 2.1, 2.2, 3.1 артефакты — ground truth, НЕ модифицировать.
2. Все ratified эскалации Phase 1/2.1/2.2/3.1 — финальные.
3. Composite labels (`STRENGTH ENDURANCE | Gymnastics`), basic-vs-gymnastics, lowercase blocks, empty-body blocks — Phase 4.
4. Scope ниже уровня недели.

MODIFIER CLASSIFICATION ОТ MAIN SESSION (важный input для Phase 3.2)

Главная сессия проинспектировала Phase 3.1 и приняла решение по first-class vs second-class разделению modifiers. Это **input для Phase 3.2** — используй для определения какие из per-occurrence модификаторов относятся к exercise как сущности (intrinsic), а какие — use-site (контекстные).

**First-class structured fields / enums (модель будет хранить их структурированно)**:

- **Weight** — отдельный VO. Variants: single / dual / single-arm / compound-device (DB/KB/BB) / split-tier (`5 KB 24kg + 10 DB 15kg`) / dual-value (`50/30 kg`) / weight-with-asymmetric-arm-action / bodyweight (none).
- **Rep semantics**: count / range / MAX (3 sub-forms: bare / progressive / in-remaining-time) / TOTAL flag / compound-rep definition (curly + inline-equality).
- **Per-limb distribution**: enum each_leg / each_arm + explicit LEFT / RIGHT (paired-rows).
- **Tempo/pause**: pause_in_up { duration }, per_nth_rep_pause { every, duration }, slow_eccentric { duration }, hold_after_last { duration }.
- **Effort intensity**: percent (`75-80%`, `70%`) / categorical (`EASY PACE`). Scope: block / schema / row.
- **Position/equipment** — enum: neutral_grip / from_sofa / from_box / from_sofa_box / without_bench / without_jump / hold_farm_carry / hand_on_db / hands_on_db.
- **Sequence indicator** (block-topology): before_named / after_named / only_once_before / after_each_round / after_each_typed_round.
- **Media reference** — first-class link entity (url, position: inline/standalone/bare, label: optional, applies-to: previous-row/current-row/whole-schema).
- **Drop-set program** — first-class structure для named-exercise-program (rep_stages).
- **Per-set substitution** — first-class slot (placeholder_name + per_set_assignments).

**Second-class free-text notes**:

- Clarifications (`EXAMPLE: ...`, `EXPLODE: ...` без URL).
- Multi-stage arm programs (`1 ARM HOLD in UP | another ARM DO 5 reps | ...`).
- Unique movement descriptors (`kind of wall balls`, `emphasis on the gluteal muscles`, `to the parallel`).
- Composite annotations с `|` без regular pattern.

**Hybrid**: все first-class entities могут иметь optional `notes` field для расширения.

ВХОДНЫЕ ДАННЫЕ

- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/exercise-instances.md` — ОСНОВНОЙ материал. 168 unique exercises с occurrences и contexts.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/schema-boundaries.md` — контексты использования.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/schema-content-primitives.md` — типы primitives внутри schema body.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/modifier-scope.md` — таблица модификаторов с scope.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/compound-and-alternative.md` — `+` и `OR` connectors.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/edge-cases.md` — Phase 3.1 edge cases.

ЦЕЛЬ

Каталог свойств Exercise как сущности. Разделить:

- **Intrinsic** — атрибуты, присущие exercise как сущности (имя, equipment type, movement type, default demo URL если стабилен).
- **Use-site** — атрибуты, контекстные при использовании (reps, weight, side, tempo, sequence-tag, effort, URL если разный).

Плюс — дедуп близких имён, classification compound vs composite vs placeholder.

Phase 3.2 не проектирует модель. Не пишет Prisma. Не финализирует muscle groups жёстко (best-effort, описательно).

ЗАДАЧИ

### Task 1 — Intrinsic attributes

Для каждого из 168 unique exercises определи **атрибуты которые присущи exercise** независимо от use-site:

- **canonical_name** (нормализованная форма имени; уже в exercise-instances.md, но проверь).
- **primary_equipment** (enum):
  - `bodyweight` — упражнения без снарядов (strict pull-ups, burpees, jumping Jacks, HSPU без сноса).
  - `dumbbell` — DB-prefix или контекстно DB (`DB Snatches`, `DB squats`, `DB single arm row`).
  - `kettlebell` — KB-prefix (`KB clean & push press`).
  - `barbell` — BB-prefix (если встречается).
  - `band` — Banded prefix (`seated lateral BANDED raises`, `rear delt with BANDED`).
  - `box` / `sofa` / `box_or_sofa` — для HSPU вариантов где equipment стабилен (block-context определяет, но если в всех occurrences один — это intrinsic).
  - `wall` / `parallel_bars` — gymnastics (bar dips, traverses требуют bars).
  - `mixed` — если для конкретного exercise встречаются разные equipment в разных contexts.
  - `unknown` — если не выводится.
- **movement_type_tag** (best-effort enum, не для проектирования модели):
  - `squat` / `hinge` (deadlift, swing) / `press` / `pull` / `lunge` / `carry` / `locomotion` (run, walk, HS walk) / `static_hold` / `rotational` / `cardio_flow` (burpees, jumping Jacks).
  - Если несколько — primary + secondary tags.
  - Если не можешь надёжно определить — `unknown` или omit.
- **default_demo_url** — если 1-2 URL **стабильно** ассоциированы с exercise через ≥3 occurrences и без пере вариаций, это intrinsic. Иначе — none, URL контекстный.
  - Эвристика: same URL появляется в ≥80% occurrences exercise где URL присутствует → intrinsic.
- **canonical_compound_type**:
  - `atomic` — single movement (`DB Snatches`).
  - `compound_plus` — связан через `+` (e.g. `DB hang power clean + DB push press`) — compound rep.
  - `composite_named` — historical composite name через `&` (`clean & jerk`, `DB hang power clean & push press`).
  - `placeholder` — `*X exercise` без concrete movement (резолвится через per-set annotation).
- **placeholder_flag** — true если exercise — placeholder (`*DB exercise`, `* Burpee variation`).

Если для конкретного exercise один из атрибутов не выводится надёжно — none / unknown / omit с явным указанием в notes.

### Task 2 — Use-site attributes

Перечислить атрибуты которые **per-occurrence контекстуальные** (не intrinsic):

- reps (count / range / MAX / TOTAL)
- weight (single / dual / single-arm / split-tier / dual-value / asymmetric arm)
- side modifier (each leg / each arm / LEFT / RIGHT)
- tempo / pause (когда и как)
- sequence indicator (before/after named block)
- effort
- URL (если не intrinsic — site-specific demo)

Это не каталог конкретных значений (они уже в Phase 3.1) — это **список того, что отделяется от exercise**.

### Task 3 — Дедупликация близких имён

Изучи 168 имён на предмет:

- **Case variants** (`LEFT ARM` vs `LEFT arm`, `EACH leg` vs `each leg`, etc.) — должны быть уже схлопнуты Phase 1, но verify.
- **Whitespace variants** (`[ 2x 15 kg ]` vs `[ 2x15 kg ]`) — Phase 1 решил, не трогаем.
- **Abbreviation variants**:
  - `DB Snatches` vs `DB Snatch` (single)
  - `DB alt. snatches` vs `DB Snatches [ alternative ]`
  - `DB hang power clean & push press` vs `DB hang power clean + DB push press`
  - И т.д.
- **Compound-name variants** (`+` vs `&`).
- **Word order** (`DB single arm row` vs `single arm DB row`).
- **Synonym variants** (`hamstring curls` vs `nordic curls`).

Для каждой найденной пары/группы:

- предложить merge (с обоснованием structurally identical) или
- keep separate (с обоснованием structural difference)
- эскалация в edge-cases если не уверен.

### Task 4 — Compound vs Composite vs Placeholder analysis

Compound (`+` connector):

- Это compound-rep (одно "движение из двух фаз"), где каждый rep = выполнить A then B sequentially?
- Или это compound-set где A _ N + B _ N?
- Зависит от контекста (`5 strict DB press + 5 DB push press` — sequential 5+5; `DB hang power clean + DB push press` — composite movement).

Composite-named (`&`):

- Traditional naming (`clean & jerk`, `DB hang power clean & push press`) — обычно single composite movement.

Granularity decision: Phase 3.2 не финализирует, но **предлагает** для Phase 5:

- (a) Compound `+` — flatten в один Exercise (`DB hang power clean + DB push press` = единый Exercise с compound flag).
- (b) Compound `+` — decompose на отдельные Exercises с compound-rep relationship.
- (c) Composite `&` — single Exercise всегда.
- (d) Hybrid: by-name composite (`&`) atomic, by-`+` decomposed.

С обоснованием и trade-offs для каждой опции.

Placeholders:

- `*DB exercise`, `* Burpee variation` — не Exercise, это slot. Отдельный каталог.

### Task 5 — Catalog construction

Используя анализ Task 1-4, построй **canonical exercise list**:

- Уникальные exercises после ratified merge.
- Intrinsic attributes filled.
- Compound/composite/placeholder classified.

ВЫХОДНЫЕ АРТЕФАКТЫ

В `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/`:

1. **`exercise-attributes.md`** — каталог типов атрибутов: intrinsic vs use-site, с обоснованием отнесения каждого типа.

2. **`exercise-canonical-list.md`** — финальный список нормализованных exercises с предложенным intrinsic attribute filling. Формат:

   ```
   ### DB Snatches
   - canonical_name: DB Snatches
   - primary_equipment: dumbbell
   - movement_type_tag: hinge (primary) / pull (secondary)
   - default_demo_url: none (different URLs across occurrences)
   - canonical_compound_type: atomic
   - placeholder_flag: false
   - aliases: [DB Snatch (singular), DB alt. snatches (alternative variant)]
   - notes: ...
   ```

   - Для всех 168 (или после merge — меньше) exercises.

3. **`exercise-merge-candidates.md`** — список близких имён:

   ```
   ## Merge candidate 1: DB Snatches family
   - DB Snatches (canonical, X occurrences)
   - DB Snatch (1 occurrence)
   - DB alt. snatches (Y occurrences)
   - DB Snatches [ alternative ] (Z occurrences)
   options:
   - (a) merge all → single Exercise with `alternating` use-site modifier
   - (b) keep DB Snatches and DB alt. snatches separate (different default execution)
   recommendation: ...
   reasoning: ...
   ```

4. **`compound-composite-analysis.md`** — анализ `+` / `&` connectors:

   - Все `+` compound rows из exercise-instances.md
   - Все `&` composite-named exercises
   - Sub-types (compound paired / chained / repeated-pattern — из Phase 3.1)
   - Granularity options для Phase 5

5. **`edge-cases.md`** — placeholder exercises (caталог), complex names, ambiguous merge cases, эскалации в main session.

ФОРМАТ exercise-attributes.md

```
# Exercise attributes (Phase 3.2)

Каталог типов атрибутов Exercise. Intrinsic = присущие exercise как сущности. Use-site = контекстные при каждом использовании.

## Intrinsic attributes

### canonical_name
description: ...

### primary_equipment
description: тип основного снаряда. Enum: bodyweight / dumbbell / kettlebell / barbell / band / box / sofa / box_or_sofa / wall / parallel_bars / mixed / unknown.
sources: prefix имени (DB / KB / Banded), контекстное наблюдение по всем occurrences.

### movement_type_tag
description: ...

(etc.)

## Use-site attributes

### reps
description: per-occurrence rep count / range / MAX / TOTAL flag.
source: Phase 3.1 rep notations.

### weight
description: per-occurrence weight VO (см. main-session modifier classification).
source: Phase 3.1 weight notations.

(etc.)

## Decision boundary

Intrinsic vs use-site разделение основано на:
- Stability across occurrences (intrinsic = same value in 90%+ occurrences).
- Semantic — что определяет exercise as exercise (имя, основной снаряд, movement) vs что определяет конкретное выполнение (вес, повторы, скорость).
```

ФОРМАТ exercise-canonical-list.md

```
# Exercise canonical list (Phase 3.2)

Финальный список нормализованных уникальных exercises после ratified-merge. Каждый exercise с filled intrinsic attributes.

Total unique exercises после merge: N.
Placeholders отдельно (см. §placeholders).

## Exercises

### DB Snatches
- canonical_name: DB Snatches
- primary_equipment: dumbbell
- movement_type_tag: hinge (primary) / pull (secondary)
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [DB alt. snatches — see merge-candidates §1]
- notes: ~XX occurrences total.

(etc. для всех 168 или меньше после merge)

## Placeholders (отдельная категория)

### *DB exercise
- canonical_name: *DB exercise
- placeholder_flag: true
- resolution: per-set annotation
- occurrences: 1 (block-020 / schema-1)

### * Burpee variation
- canonical_name: * Burpee variation
- placeholder_flag: true
- resolution: per-set annotation
- occurrences: 1 (block-021)
```

ФОРМАТ exercise-merge-candidates.md

```
# Exercise merge candidates (Phase 3.2)

Близкие имена с обоснованием merge vs keep-separate.

## Merge candidate 1: DB Snatches family
...

## Keep-separate group: DB single arm row vs DB single ARM row
- structurally identical, case variants — schлопывается case-insensitive (Phase 1 уже сделал).

(etc.)

## Escalations to main session
- ambiguous cases где не уверен
```

ФОРМАТ compound-composite-analysis.md

```
# Compound vs Composite analysis (Phase 3.2)

## `+` Compound rows

description: ...
sub-types (from Phase 3.1):
- paired (2 elements)
- chained (3+ elements)
- repeated-pattern (A + N B + A + N B)

semantics per occurrences:
- some are compound-rep (one execution = A then B): ...
- some are compound-set (A then B as paired completion of set): ...
- ambiguous: ...

### Granularity options для Phase 5

option (a): all `+` compound flatten в один Exercise
- pros: ...
- cons: ...

option (b): decompose `+` into separate Exercises с compound-rep relationship
- pros: ...
- cons: ...

(etc.)

recommendation: ...

## `&` Composite-named exercises

description: traditional composite movements (`clean & jerk`, `DB hang power clean & push press`).

list:
- clean & jerk
- DB hang power clean & push press
- (etc. найди все в exercise-instances.md)

semantics: typically single composite movement, treated as atomic.

recommendation для Phase 5: keep composite-named as atomic Exercise (option c).

## OR-alternative analysis (3 occurrences)

description: `X OR Y` substitution (per Phase 3.1 §13.X).

list:
- 5 strict bar dips OR 10 push ups (3 occurrences)

semantics: substitution choice (per-athlete scaling).

recommendation: модель должна поддерживать exercise OR alternative at use-site level (не intrinsic property).
```

ФОРМАТ edge-cases.md

```
# Phase 3.2 edge cases

## Placeholders catalog
...

## Complex names
- exercises с длинными composite names
- exercises с inline brackets в имени (`KB [ 24 kg ] single arm row`)

## Ambiguous merges
- candidates где не уверен — эскалация main-session

## Other observations

## Summary
- total intrinsic-classified exercises: N
- placeholders: M
- merge groups ratified: K
- escalations: L
```

ACCEPTANCE

- Каждое из 168 exercises (минус merged) имеет filled intrinsic attribute set (или явное "cannot infer / unknown / none" per attribute).
- Merge candidates classified (merge / keep-separate / escalation).
- Compound `+` и composite `&` analyzed с granularity options.
- Placeholders отдельно отмечены.
- OR-alternative documented.
- Summary с цифрами.

ПРАВИЛА РАБОТЫ

- НЕ читать вне `analysis/`. Никакого кода проекта, ADR, контрактов.
- НЕ память, web, video.
- НЕ моделировать Load (Phase 3.3).
- НЕ проектировать Prisma / TS / entities (Phase 5/6).
- НЕ финализировать muscle groups / movement tags жёстко — best-effort с notes.
- НЕ модифицировать Phase 1 / 2.x / 3.1 артефакты.
- НЕ выходить выше уровня session.
- НЕ интерпретировать dual-value weight (`50/30 kg`) как RX/scaled или M/F.
- НЕ делегировать sub-agentам.
- Russian content, English identifiers/filenames.
- Без эмодзи / подписей / комментариев в коде.

ОТЧЁТ ПО ОКОНЧАНИИ

В чате коротко: total exercises после merge, intrinsic attribute coverage (% где удалось вывести primary_equipment, movement_type_tag, etc.), merge groups count, compound/composite/placeholder cardinalities, top-5 ambiguous cases, что эскалируешь.
