# Load representation (Phase 3.3)

Каталог типов load notations из sample (absolute weights) + предложение conceptual модели Load representation с extension для %1RM (beyond sample).

Sample (`plan.xlsx`, 9 месяцев) содержит только absolute weights — atлет тренируется дома с фиксированным набором DB (15 kg) + KB (24 kg). Реальный продукт ориентирован на gym workouts тренера, где основная масса нагрузки задаётся через %1RM. Phase 3.3 анализирует и предлагает; финализирует main session.

Source-references:

- Sample notations: `schema-content-primitives.md` §3, `modifier-scope.md` §1.
- Per-exercise stability: `load-stability-per-exercise.md`.
- Singletons / ambiguities: `load-edge-cases.md`.

---

## 1. Absolute weight notations (from sample)

Каталог из 11 семей weight notation. Phase 3.1 §3 + Phase 3.2 evidence консолидированы. Кардинальности — occurrences (включая внутри nested annotations и standalone rows). Equipment context определяется именем exercise, если не указан явно внутри annotation.

### 1.1 Single weight `[ N kg ]`

distinct strings:

- `[ 15 kg ]` (18 occurrences)
- `[ 24 kg ]` (19 occurrences)

total occurrences: 37.

scope: exercise (inline на той же row, attached к exercise name слева от bracket).

equipment context: определяется именем exercise — `DB Cossacs squats [ 15 kg ]` → DB; `KB swings [ 24 kg ]` → KB.

examples:

- block-026 / schema-1: `12 DB Cossacs squats [ 15 kg ] [ 6 EACH leg ]` — single DB (lateral squat, single-arm hold implicit).
- block-007 / schema-1: `18 KB clean & push press [ 24 kg ] [ 9 each arm ]` — single KB clean & jerk.
- block-153 / schema-2: `10 DB Bulgarian split squats [ 15 kg ] [ each leg ]` — single DB (held by working-leg-side hand).

notes:

- `[ N kg ]` несёт abstract value "вес одного снаряда". Семантически структурно идентично паре `[ 24 kg ]` (KB) и `[ 15 kg ]` (DB) — разделение делает упражнение по имени, не notation.
- 17.5 kg в sample не встречается (доступны были бы те же scope правила).

### 1.2 Dual weight `[ 2x N kg ]`

distinct strings:

- `[ 2x 15 kg ]` (157 occurrences) — canonical.
- `[ 2x15 kg ]` (6 occurrences) — typo-вариант без пробела, structurally эквивалентен.

total occurrences: 163.

scope: exercise (inline).

equipment context: подразумевает **paired equipment** — две одинаковых единицы. По умолчанию DB (так как `[ DB 2x ... ]` explicit-prefix используется только когда нужно отличить от KB).

examples:

- block-001 / schema-1: `10 DB bench presses [ 2x 15 kg ]` — bench press с двумя 15-kg гантелями.
- block-018 / schema-1: `10 DB lunges [ 2x 15 kg ] [ hold farm carry ]` — пара DB в farm-carry hold.
- block-077 / schema-1: `12 DB deadlifts / 9 DB hang power cleans / 6 DB push presses` standalone-row `[ 2x 15 kg ]` (multi-row scope, см. §1.9).

notes:

- Доминирующая weight annotation в sample (~70% всех загруженных rows).
- `2x` semantics — "две одновременно одинаковых ноши", не "две стороны" (=`1x` notation).

### 1.3 Single-arm `[ 1x N kg ]`

distinct strings:

- `[ 1x 15 kg ]` (14 occurrences).

total occurrences: 14.

scope: exercise.

equipment context: один снаряд при alternating или single-arm execution. По умолчанию DB.

examples:

- block-033 / schema-1: `30 DB Snatches [ 1x 15 kg ]` — один DB, alternating snatches (30 = 15 per arm).
- block-037 / schema-1: `36-28-20: ... DB Snatches [ 15 kg ] [ alternative ]` — вариант где `[ 1x ]` notation отсутствует, alternating передан через `[ alternative ]` annotation + single-weight `[ 15 kg ]`.
- block-119 / schema-1: `5 KB 24 kg + 10 DB 15 kg` split-tier composite использует single-arm semantics обеих snарядов.

notes:

- `1x` явно противопоставляется `2x` — единственная пара notations различающая cardinality удержания снаряда.

### 1.4 Compound-device explicit prefix `[ DB Nx K kg ]`

distinct strings:

- `[ DB 2x 15 kg ]` (19 occurrences) — обычно standalone row.
- `[ DB 1x 15 kg ]` (9 occurrences) — внутри Bulgarian split squats drop-set program.

total occurrences: 28.

scope:

- inline (на той же row как exercise) → exercise.
- standalone row → multi-row (см. §1.9).
- внутри drop-set program → rep-stage scope (см. §1.10).

equipment context: `DB` prefix explicit — используется когда контекст требует чётко отличить DB от KB (типично — schemas где задействованы оба snарядa, или standalone rows после серии mixed exercises).

examples:

- block-027 / schema-1: `3 hang power cleans + 3 front squats + 3 push presses [ DB 2x 15 kg ]` — explicit DB-prefix потому что compound включает named-Olympic-lifts без DB prefix внутри.
- block-008 / schema-2: `3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT ] ]` — drop-set program, explicit DB-prefix для каждой стадии.
- block-005 / schema-2: standalone `[ DB 2x 15 kg ]` row после двух ladder paragraphs (DB Thrusters / DB squats / push presses sequence).

notes:

- Семантически тождественно §1.2 `[ 2x N kg ]` (paired) и §1.3 `[ 1x N kg ]` (single), но с explicit equipment qualifier — снимает контекстную неоднозначность.

### 1.5 Split-tier composite `[ A KB N kg + B DB M kg ]`

distinct strings:

- `[ 5 KB 24 kg + 10 DB 15 kg ]` (6 occurrences, block-119 / 123 / 129 / 133).

total occurrences: 6.

scope: exercise (composite distribution within one set).

equipment context: гетерогенный — set состоит из 2 stages с разным equipment и разным rep-count.

examples:

- block-119 / schema-1: `15 DB single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ each arm ]` — 1 set = 5 reps KB 24 kg + 10 reps DB 15 kg, per arm. Total reps 15 совпадает с leading count.
- block-133 / schema-1: same structure, paired modifier `[ another ARM HOLD KB 24 kg in UP ]` уточняет non-working arm action.

notes:

- Singleton-стиль composite (1 distinct pattern, 6 occurrences — все варианты `single arm row`).
- В canonical-list `single arm row` (без DB/KB prefix) трактуется как mixed-equipment exercise именно для поддержки этого split-tier (см. Phase 3.2 Group C/M).
- Семантически — это 2-stage set с разными `(weight, equipment, reps)` парами на одну row.

### 1.6 Dual-value placeholder `[ N/M kg ]`

distinct strings:

- `[ 50/30 kg ]` (1 occurrence, block-003 / schema-2 / sub-1 — `overhead squats [ 50/30 kg ]`).

total occurrences: 1.

scope: exercise.

equipment context: implied barbell (overhead squats + magnitude > typical DB range).

examples:

- block-003: `overhead squats [ 50/30 kg ]` — singleton.

notes:

- Интерпретация **deferred** per main-session guidance: M/F, RX/SC, или иной dual-resolve. Phase 3.3 НЕ выбирает.
- Структурно — слот для будущего athlete-context-resolver (Phase 5 / Phase 6).

### 1.7 Weight-with-asymmetric-arm-action `[ N kg | LEFT/RIGHT arm DO | another arm HOLD in UP ]`

distinct strings:

- `[ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]` (2 occurrences, block-123 / schema-1).
- `[ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ]` (2 occurrences, block-123 / schema-1).
- (related singleton, §1.11) `[ another ARM HOLD KB 24 kg in UP ]` (1 occurrence, block-133) — арм-холд с weighted hold (24 kg на удерживающей руке).
- (related singleton) `[ another ARM HOLD DB in UP ]` (3 occurrences, block-094, 129, 165) — арм-холд без weight specification.
- (complex variant, §1.11) `[ 1 ARM HOLD in UP | another ARM DO 5 reps | than opposite | AND + 5 reps BOTH arms ]` (2 occurrences, block-168, 170) — composite per-arm program.

total occurrences: 5 (4 simple + 1 complex distinct asymmetric-arm pattern); 8 если считать singleton variants холдов.

scope: exercise.

equipment context: DB (15 kg single).

examples:

- block-123: `5 DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]` — asymmetric arm role, weight несётся одной рукой.
- block-133 / schema-1: `5 DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ] [ another ARM HOLD KB 24 kg in UP ]` — single ARM bench press с KB 24kg-hold противоположной рукой.

notes:

- Composite annotation с `|` separator делит несколько параметров (вес + per-arm action). См. compound-and-alternative.md §6.11.
- Семантически — single-weight + asymmetric role descriptor. Working arm и holding arm — distinguishable роли в рамках одной row.

### 1.8 Weight-with-depth-modifier `[ N kg | depth-qualifier ]`

distinct strings:

- `[ 24 kg | to the parallel ]` (1 occurrence, block-189 / schema-2 — `10 KB swings [ 24 kg | to the parallel ] [ emphasis on the gluteal muscles ]`).

total occurrences: 1.

scope: exercise.

equipment context: KB (24 kg).

examples:

- block-189: KB swings с явным указанием depth-target ("свинг — до параллели полу, не overhead").

notes:

- Singleton композит. Аналогичные depth-qualifiers (`to the parallel`, `partial`, `full ROM`, etc.) могут расширяться beyond sample для barbell-lifts (squat depth, deadlift lockout).

### 1.9 Multi-row scope (standalone weight row)

distinct strings:

- `[ 2x 15 kg ]` standalone row — block-077 / schema-1 (применяется к 3 preceding exercise rows: deadlifts / hang power cleans / push presses).
- `[ DB 2x 15 kg ]` standalone row — block-005 / schema-2 (применяется ко всему body после двух ladder paragraphs).

total occurrences: 2.

scope: **multi-row** — annotation row сам по себе, без leading exercise. Применяется ко всем preceding exercise rows внутри той же schema.

equipment context: либо implicit DB (block-077), либо explicit `DB` prefix (block-005).

examples:

- block-077 / schema-1:
  ```
  12 DB deadlifts
  9 DB hang power cleans
  6 DB push presses
  [ 2x 15 kg ]
  ```
  Weight `[ 2x 15 kg ]` applies к каждой из 3 preceding rows.

notes:

- Структурно distinct от inline `[ ]` notations — занимает entire row.
- Per `modifier-scope.md` §13: scope зависит от position (inline = exercise, standalone = multi-row).
- Очень редкий pattern (2x в sample); inline-аннотация per-row доминирует.

### 1.10 Bodyweight (implicit no-load)

distinct strings: none — отсутствие weight annotation на load-capable exercise row.

total occurrences: ~614 exercise rows (~78% всех body exercise rows) **из которых**:

- ~250 — bodyweight exercises по equipment (strict pull-ups, push ups, burpees, jumping Jacks, V-ups, air squats, single unders, strict HSPU/T2B/bar dips, plyo push ups, etc.) — true bodyweight, не expects load.
- ~50 — band-resistance exercises (Hip ABduction/ADduction with band, seated lateral BANDED raises, rear delt with BANDED, Straight Arm Banded Lat Pull Down) — band-tension load, no weight notation by nature.
- ~30 — parallel_bars/rings exercises (strict bar dips, bar dips, strict ring pull-ups, traverses+) — bodyweight gymnastics.
- ~280+ — weighted exercises (DB / KB) с context-defined default weight (`DB Thrusters` без annotation в block-005 при ladder где standalone row устанавливает default).

scope: exercise.

examples:

- block-005 / schema-1: `12-9-6: DB Thrusters / DB squats / push presses` — exercise rows без inline weight; weight standalone-row внизу sets multi-row default.
- block-153 / schema-1: `10 single leg GLUTE BRIDGE [ each leg ]` — true bodyweight (canonical-list primary_equipment=bodyweight).

notes:

- "Bodyweight implicit" — это **значимое состояние**, не отсутствие данных. Атлет выполняет упражнение собственным телом (или band-tension), это семантически отличается от "не указано какой вес".
- См. Phase 3.1 §3.11. Model должна разделять (a) true bodyweight (equipment.bodyweight в Exercise intrinsic) и (b) "load underspecified, ожидается context default" (см. DP3).

### 1.11 Negative / explicit no-load `[ WITHOUT WEIGHT ]`

distinct strings:

- `[ WITHOUT WEIGHT ]` (внутри `EXPLODE / WITHOUT WEIGHT`) — 9 occurrences, все внутри Bulgarian split squats drop-set program.

total occurrences: 9.

scope: rep-stage (внутри nested drop-set annotation — третья drop-stage).

equipment context: explicit no-load на финальной стадии — drop-set ends с explosive bodyweight version.

examples:

- block-008 / schema-2: `3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT ] ]` — 3-stage drop-set:
  - stage-1: x5 reps с 2 DB 15 kg каждая
  - stage-2: x5 reps с 1 DB 15 kg
  - stage-3: x5 reps explosive без отягощения

notes:

- Отличается от §1.10 (bodyweight implicit) — `WITHOUT WEIGHT` появляется ТОЛЬКО когда соседние stages **с** весом. Семантика "explicitly drop to bodyweight after weighted stages".
- Также отличается от §1.12 (placeholder `(no annotation)`). Здесь — явный negative indicator.

### 1.12 Composite annotations и singletons summary

(перечислены отдельно в `load-edge-cases.md`)

- `[ another ARM HOLD KB 24 kg in UP ]` — singleton с встроенным weight (24 kg KB held by passive arm).
- `[ 1 ARM HOLD in UP | another ARM DO 5 reps | than opposite | AND + 5 reps BOTH arms ]` — complex per-arm program, weight не указан inline (DB implied, weight либо standalone, либо unspecified).
- Singleton dual-value `[ 50/30 kg ]` — см. §1.6.
- Singleton depth-modifier `[ 24 kg | to the parallel ]` — см. §1.8.
- Singleton arm-asymmetric (§1.7 variants).

---

## 2. Stability per canonical exercise

Полные данные — `load-stability-per-exercise.md`.

Summary:

- **stable**: 60/149 (40%) — exercise всегда несёт один и тот же weight (modulo typo variants `2x 15 kg` / `2x15 kg`).
- **variable**: 7/149 (5%) — weight меняется по контексту (DB Snatches: `15 kg` / `1x 15 kg` / `2x 15 kg`; KB swings: `24 kg` / `24 kg | to the parallel`).
- **bodyweight**: 54/149 (36%) — primary_equipment ∈ {bodyweight, band, parallel_bars, rings}; нет weight annotation by nature.
- **weighted-implicit**: 23/149 (15%) — primary_equipment ∈ {dumbbell, kettlebell, mixed}, но в occurrences НЕТ weight annotation (weight задаётся либо standalone row, либо block-default convention).
- **mixed**: 5/149 (3%) — некоторые occurrences с весом, некоторые без (DB squats, DB thrusters, DB single arm row, DB deadlifts, DB hang power cleans).

Hint для defaults (Phase 5 решает):

- 95% stable / weighted-implicit exercises имеют один dominant weight (`2x 15 kg` для DB-press семейства, `24 kg` для KB family).
- "Variable" exercises = 7 cases, типично — alternating execution меняет `1x` ↔ `2x` для одной exercise.
- Bodyweight exercises никогда не получают weight — default = `bodyweight` / null per DP3.

---

## 3. %1RM extension beyond sample

Sample (домашняя тренировка одного атлета) не использует %1RM — все веса absolute (15 kg DB, 24 kg KB). Финальный продукт основной массы — gym workouts тренера с %1RM, RPE, и derived progressions. Phase 3.3 анализирует **какие notation forms модель должна поддерживать** для gym-use.

### 3.1 Percentage notation forms (conceptual)

Out-of-sample forms (на основе common CrossFit / strength-coaching conventions, без web verification):

#### 3.1.1 Direct percentage `N% 1RM`

- pattern: `5 reps @ 60% 1RM`, `8 reps @ 70% 1RM`.
- resolution: percentage applied к атлет-specific 1RM записи для данного exercise (или family per DP1).

#### 3.1.2 Range percentage `N-M% 1RM`

- pattern: `5 reps @ 60-70% 1RM` — атлет выбирает в диапазоне (или тренер задаёт range для progression).

#### 3.1.3 Implicit reference `N%`

- pattern: short form `5 reps @ 75%` — `1RM` опущен потому что lift context implies movement-specific 1RM.
- resolution: same as 3.1.1.

#### 3.1.4 Combined prescription `K sets × R reps @ N-M%`

- pattern: `5×3 @ 80-85%` — full sets-reps-load notation.
- structurally — combines schema header (sets × reps) с load specifier.

#### 3.1.5 Cross-movement reference `N% of <other-exercise> 1RM`

- pattern: `60% of back squat 1RM` — percentage based на 1RM другого упражнения. Типично используется для accessory lifts (front squat = 80% back squat).
- resolution: requires cross-movement-1RM lookup. Адресует DP1 (per-exercise vs per-family).

#### 3.1.6 RPE-based (alternative scale)

- pattern: `5 reps @ RPE 8`, `3 reps @ RPE 9.5` — subjective rating (Reps-in-Reserve scale).
- resolution: athlete-specific, не deterministic resolve к kg.
- альтернатива %1RM, не replacement. Может быть out-of-scope для initial gym model.

#### 3.1.7 Combined percentage + absolute floor `N% 1RM, min K kg`

- pattern: `60% 1RM, min 40 kg` — coach safeguard (если 1RM низкое, минимальная нагрузка).
- edge case.

### 3.2 1RM как атрибут athlete

Conceptually 1RM — это **athlete-specific attribute**, не exercise-intrinsic. Каждый атлет имеет свой 1RM record для каждого relevant lift (back squat, bench press, deadlift, snatch, clean & jerk, etc.). Тренер при создании сессии указывает load relative (`60% 1RM`), система резолвит в абсолютный kg против athlete's stored 1RM.

Implications для модели:

- 1RM хранится outside Exercise (в Athlete profile или AthleteExerciseProgress).
- Resolution timing — open question (DP2 snapshot vs live).
- 1RM granularity — open question (DP1 per-exercise vs per-family).
- 1RM update mechanism — тренер вводит после testing, или система auto-updates на основе recorded performance.

---

## 4. Decision points (для main session)

### DP1: 1RM per-exercise vs per-movement-family

**Контекст**: атлет имеет 1RM для какой scope of "lift"? Гранулярность хранения и lookup.

**options**:

**(a) per-exercise** — каждый named exercise имеет свой 1RM запись.

- pros:
  - Granular: `DB Snatches 1RM` ≠ `KB Snatches 1RM` ≠ `DB hang power snatches 1RM` (биомеханика разная).
  - Lookup-resolver не нужен: percentage notation один-к-одному соответствует exercise.
  - Простая модель: `AthleteExerciseProgress { exercise_id, one_rm_kg }`.
- cons:
  - Плодит N значений per athlete (для тренера с 30+ named exercises — 30+ записей 1RM). Большая часть никогда не тестируется — стимирует stale data.
  - Duplicates для biomechanically-similar siblings (`DB clean & push press` vs `KB clean & push press` — same pattern, separate 1RM).
  - При добавлении нового exercise — 0 baseline; coach должен оценивать manually.

**(b) per-movement-family** — 1RM хранится на movement family (`snatch family`, `clean family`, `squat family`, `press family`, etc.), все exercises в family наследуют.

- pros:
  - Меньше значений (5-15 семейств vs 30+ exercises).
  - Aligned с Phase 3.2 movement_family soft grouping (`exercise-canonical-list.md` notes Phase 5 "movement family abstraction").
  - Новые exercises auto-inherit family-1RM без manual baseline.
- cons:
  - Требует family-resolver (`DB Snatches` → `snatch_family`).
  - Что делать если 1RM атлета для `DB clean` ≠ `KB clean` (например, atлет силён в KB swings, но не в OL lifts)? Family-level 1RM усредняет, что неточно.
  - Movement family ↔ equipment не perfectly aligned: `Bulgarian split squat family` имеет DB и KB variants, но biomechanics однотипна; `snatch family` включает DB / barbell variants с разной техникой.

**(c) hybrid** — 1RM хранится per-exercise, но movement_family field на Exercise enables UI grouping / smart defaults / "suggested 1RM from sibling exercise".

- pros:
  - Granular base (per-exercise точность) + ergonomic discovery (family для prefetch / suggestion / fallback).
  - "Сейчас 1RM DB Snatches не введён — могу подставить 90% от barbell snatch 1RM как initial estimate" — coach UX.
  - Phase 3.2 уже выявил soft groupings (Group A snatches, Group D HSPU, Group J Cossacs) — модель reuses.
- cons:
  - Сложнее (два уровня): per-exercise primary + family-level fallback rule.
  - UI должен показывать какой 1RM используется (primary vs derived).

**сила мнения**: Option (c) hybrid — рекомендуется. Granular точность + ergonomic UX. Sample не даёт прямого свидетельства (нет %1RM), но coach-side complexity argues для granular + smart-defaults вместо чистого family-aggregate.

### DP2: Snapshot vs live formula

**Контекст**: как load хранится в Session record после создания. Атлет улучшает 1RM — что происходит с уже созданными сессиями?

**options**:

**(a) snapshot** — при создании сессии тренер pickает `5×3 @ 80%`, система резолвит к `5×3 @ 60 kg` (если 1RM=75 kg) и **сохраняет абсолютный kg**. Атлет видит фиксированный вес. Прогресс 1RM не отражается в старых сессиях.

- pros:
  - Стабильно: создал сессию — атлет видит ровно что задано, не меняется ретроактивно.
  - Архивная корректность: historical records отражают actual прогрессии тренера.
  - Простой mental model для атлета.
- cons:
  - Прогресс не reflected: если 1RM улучшился, старые сессии остаются на 60 kg — coach должен manually обновлять для свежих weeks.
  - Тренеру плохо для template-based programming: template `5×3 @ 80%` после snapshot становится `5×3 @ 60 kg` для конкретного атлета — теряется reusability.

**(b) live formula** — load хранится как relative `5×3 @ 80% 1RM`. При просмотре атлетом — резолвится against current 1RM. Прогресс атлета автоматически отражается во ВСЕХ сессиях.

- pros:
  - Прогресс автоматически tracked: 1RM улучшился 75 → 80 kg, все upcoming сессии auto-scale.
  - Template-friendly: сессия = pure relative prescription; resolved per athlete per moment.
  - Меньше manual work для coach.
- cons:
  - Старые сессии меняются ретроактивно: атлет смотрит на завершённую сессию через 3 месяца — load показывается с новым 1RM, не с тем что был на момент выполнения.
  - Нет архива actual lift weight (если actual performance не recorded отдельно).
  - Может confuse атлета ("в понедельник было 60 kg, сегодня тот же план показывает 65 kg").

**(c) hybrid** — live в **active cycles** (текущая и upcoming weeks), snapshot для completed sessions (после фиксации actual performance). Или: explicit choice тренера per session (`snapshot=true` для testing weeks).

- pros:
  - Best of both: progress tracking для upcoming + archival integrity для past.
  - Coach control: для testing weeks (где load критически важен exactly) — snapshot, для accumulation weeks — live.
- cons:
  - Complexity: два режима, UI должен показывать какой active.
  - Transition logic (когда сессия считается "completed" → freeze)?
  - Coach должен понимать когда что использовать.

**сила мнения**: Option (b) live formula — рекомендуется для primary mode, но с recorded performance отдельно. Sample evidence в пользу live: тренер реально хочет template-based programming (`75-80% Effort` block-078 — applies к whole AMRAP, не сессия-specific kg). При этом записывать actual выполненный вес (`actual_load` field на Performed result) разделяет prescription от performance — снимает архивную проблему.

### DP3: Default weight для bodyweight exercises

**Контекст**: как модель representает "exercise без external load" — true bodyweight (strict pull-ups, burpees, etc.).

**options**:

**(a) `null` / `none`** — отсутствие load = bodyweight. Load field nullable, null означает "no external load".

- pros:
  - Простая модель: один nullable field.
  - Match natural language ("no weight").
- cons:
  - Ambiguous: null = "true bodyweight" или null = "weight underspecified" (см. §1.10 weighted-implicit cases)?
  - Validation для UI/api: "если equipment=bodyweight, load must be null" — implicit invariant.

**(b) explicit `bodyweight` enum value** — Load VO имеет variant `bodyweight` (alongside `absolute_weight`, `percentage`, etc.). Bodyweight — first-class case.

- pros:
  - Unambiguous: `Load = bodyweight` ≠ `Load = null/unspecified`.
  - Self-documenting в API responses, DB queries, UI rendering.
  - Эквивалентен `WITHOUT WEIGHT` (§1.11) — оба explicit no-load indicators (один — статичный flag для exercise, другой — drop-stage marker).
- cons:
  - Slightly more verbose (требует explicit value vs implicit null).
  - Один лишний variant в discriminated union.

**(c) `weight = 0`** — numeric zero indicates bodyweight.

- pros:
  - Simple numeric.
- cons:
  - Semantically wrong: 0 kg не отражает "your body mass". Multi-rep set с 0 kg математически бессмысленен.
  - Confusable с placeholder / not-yet-set value.
  - Aggregations (total tonnage, etc.) поломаются если 0 трактуется как valid load.

**сила мнения**: Option (b) explicit `bodyweight` — рекомендуется. Discriminated Load union должен иметь bodyweight как first-class variant; null остаётся для "underspecified", 0 для "valid zero" не используется. Sample показывает явное разделение между bodyweight rows (strict pull-ups never has `[ 0 kg ]`) и weighted-implicit (DB Renegade row — DB implied, no annotation; здесь "underspecified" semantics).

### DP4: Compound-row per-element weight

**Контекст**: `5 strict DB press + 5 DB push press [ 2x 15 kg ]` — `[ 2x 15 kg ]` applies к чему?

**sample evidence** (16 compound rows с trailing weight, обзор):

| compound row                                                                    | trailing weight     | apply-to interpretation                                                                    |
| ------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| `5 strict DB press + 5 DB push press [ 2x 15 kg ]` (×6 occurrences)             | `[ 2x 15 kg ]`      | оба DB-press elements, same weight                                                         |
| `5 strict DB press + 10 DB push press + 5 strict DB press [ 2x 15 kg ]` (×4)    | `[ 2x 15 kg ]`      | все 3 stages (sandwich)                                                                    |
| `3 strict DB press + 6 DB push press + 3 strict DB press [ 2x 15 kg ]` (×2)     | `[ 2x 15 kg ]`      | все 3 stages                                                                               |
| `7 strict DB press + 7 DB push press [ 2x 15 kg ]` (×4)                         | `[ 2x 15 kg ]`      | оба DB-press                                                                               |
| `30 DB hang power clean + DB push press [ 2x 15 kg ]` (1)                       | `[ 2x 15 kg ]`      | оба DB-loaded                                                                              |
| `7 DB hang power cleans + push press [ 2x 15 kg ]` (2)                          | `[ 2x 15 kg ]`      | оба DB-loaded (push press без DB prefix, но DB implied)                                    |
| `5 DB deadlifts + 5 hang power cleans + 5 DB squats [ 2x 15 kg ]` (1)           | `[ 2x 15 kg ]`      | все 3 DB-loaded                                                                            |
| `10 DB Bulgarian split squats + 10 withot DB [ 2x 15 kg ]` (2)                  | `[ 2x 15 kg ]`      | первый stage только (drop-set within row); второй stage explicit `withot DB` (без снаряда) |
| `DB squats [ 2x 15 kg ] + 10 V-ups` (1)                                         | inline на DB squats | только DB squats (V-ups bodyweight)                                                        |
| `5 DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ]` (3) | inline per-element  | per-element explicit (разные веса)                                                         |

**Convention deduced**:

- **Trailing weight** = applies к ALL loaded-equipment elements в compound (bodyweight elements типа `plyo push ups` / `V-ups` / `withot DB` остаются без load).
- **Inline per-element weight** = used когда elements имеют разные weights (`[ 2x 15 kg ]` для DB-press + `[ 1x 15 kg ]` для single-ARM bench press).
- "Last element only" pattern в sample **не наблюдается**.
- Сложные кейсы: compound с mixed DB + KB elements использует inline per-element (`strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press`) — KB inline 24 kg, DB stages implicit с default (вероятно 2x 15 kg из context).

**options**:

**(a) trailing weight = whole compound** (applies to all loaded elements; bodyweight elements skip).

- pros:
  - Match sample convention (~95% trailing-weight cases).
  - Минимальная аннотация для типового случая (один вес на весь compound).
- cons:
  - Требует knowledge какие elements "load-capable": модель должна знать что `plyo push ups` — bodyweight, `DB push press` — DB-loaded.
  - Ambiguous для truly mixed compound (`strict DB press + KB push press + strict DB press`).

**(b) trailing weight = last element only** (последний `+ element [ weight ]`).

- pros:
  - Простая parse rule: weight always attaches к immediate preceding element.
- cons:
  - **Не соответствует sample**: `5 strict DB press + 5 DB push press [ 2x 15 kg ]` явно подразумевает оба DB-press (атлет не сделает первый стрикт пресс без веса).
  - Тренер должен дублировать weight аннотацию на каждый element — verbose.

**(c) explicit per-element annotation required** (если разные веса, каждый element имеет свою `[ ]`).

- pros:
  - Unambiguous: каждый element explicit.
  - Match cases где веса разные (`[ 2x 15 kg ]` DB + `[ 1x 15 kg ]` single-arm).
- cons:
  - Verbose для случая где все elements один вес (~95% sample) — тренер должен повторять аннотацию.
  - В sample тренер этого не делает — convention "trailing implies whole" уже работает.

**сила мнения**: Option (a) trailing-applies-to-all + Option (c) per-element override как hybrid рекомендуется. Это match sample convention (trailing default) и поддерживает edge cases (per-element override когда нужно).

**Implementation сложность**:

- Parser должен различать inline vs trailing positions.
- Resolve algorithm: для каждого compound element — bodyweight по exercise.equipment? trailing weight по compound? inline override?
- В model: каждый element row имеет `load_override` optional; compound имеет `default_load` (trailing).

---

## 5. Conceptual load model proposal

Concept-уровень: variants, ownership, resolution. БЕЗ Prisma/TS projections.

### 5.1 Load VO variants

`Load` — value object с polymorphic variants (discriminated union):

**variant 1 — Absolute**: `{ kind: "absolute", weight: Weight }`

- `Weight` — composite VO:
  - **single**: `{ value_kg: N }` — один снаряд.
  - **dual** (paired): `{ value_kg: N, paired: true }` — `2x N kg`.
  - **single_arm**: `{ value_kg: N, single_arm: true }` — `1x N kg` (alternating execution).
  - **compound_device**: `{ equipment: "DB" | "KB" | ..., value_kg: N, count: 1|2 }` — explicit device prefix `[ DB 2x 15 kg ]`.
  - **split_tier**: `{ stages: [{ reps, equipment, value_kg }, ...] }` — `[ 5 KB 24 kg + 10 DB 15 kg ]`.
  - **dual_value**: `{ first: Weight, second: Weight, resolver: "athlete_profile" }` — `[ 50/30 kg ]`, resolved by athlete attribute (M/F, RX/SC — пока deferred).
  - **with_asymmetric_arm**: `{ value_kg: N, working_arm: "left"|"right", passive_arm_action: enum }` — `[ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]`.
  - **with_depth_modifier**: `{ value_kg: N, depth: "to_parallel" | "full_ROM" | ... }` — `[ 24 kg | to the parallel ]`.

**variant 2 — Percentage**: `{ kind: "percentage", value: N, range_max: N?, reference: Reference }`

- `Reference`: `{ scope: "self" | "movement_family" | "other_exercise", target: ExerciseId | FamilyId? }`.
- Examples:
  - `60% 1RM` (self) → reference.scope = "self".
  - `60% of back squat 1RM` → reference.scope = "other_exercise", target = back squat exercise id.
  - `60-70% 1RM` (range) → range_max = 70.

**variant 3 — Bodyweight**: `{ kind: "bodyweight" }`

- Explicit no-external-load. См. DP3 option (b).

**variant 4 — Negative / drop-stage**: `{ kind: "without_weight", context: "drop_set_stage" }`

- Explicit no-load indicator используемый только внутри drop-set programs (§1.11). Может быть слит с `bodyweight` variant если drop-set program моделируется первоклассно с `stages[]`.

**variant 5 — RPE-based** (deferred, beyond sample): `{ kind: "rpe", value: N }`

- Subjective load specifier. Может быть included для completeness или отложен.

**variant 6 — Unspecified** (для underspecified-context cases): `{ kind: "unspecified" }`

- Когда exercise weighted-implicit (см. classification §2) — `DB Renegade row` без annotation. Resolution через schema-default или standalone-row default.

### 5.2 1RM ownership and resolution policy

**1RM** — атрибут Athlete profile. Сущность:

```
AthleteOneRM {
  athlete_id
  reference_target  // ExerciseId (DP1 option a) | MovementFamilyId (option b) | both (option c)
  value_kg
  recorded_at
  source           // "manual", "auto_inferred", "tested"
}
```

**Resolution**:

- При запросе resolved load для percentage variant:
  - Lookup 1RM по `reference` field в Load.
  - Apply percentage.
  - Return absolute Weight (single / dual / etc. depending on exercise default device).
- Snapshot (DP2 a): резолвится при создании сессии, абсолютный kg сохраняется в Session.
- Live (DP2 b): резолвится при чтении, актуальный 1RM применяется.
- Hybrid (DP2 c): per-session flag `lock_load_at_creation`.

**1RM derivation rules** (если DP1 = hybrid c):

- Per-exercise если record exists → use direct.
- Else, resolve через movement_family → use family 1RM.
- Else (no record) → coach is asked, или fall back to "unspecified" (UI prompt).

### 5.3 Composition with Exercise and Schema

Loadattached to **what level**:

1. **Exercise row level** (most common): inline `[ ]` annotation на exercise row.

   - `10 DB bench presses [ 2x 15 kg ]` — Load на этот row instance.

2. **Compound row level** (trailing): один Load applies к compound с multiple elements.

   - Per DP4 option (a/c hybrid): trailing = whole-compound default, inline-on-element = override.
   - Element-level lookup: bodyweight exercise → `bodyweight` Load; loaded exercise without override → inherited compound default.

3. **Schema level** (multi-row standalone, §1.9): один Load applies к multiple exercise rows внутри schema.

   - Rare (2 occurrences sample), но supported.

4. **Block / session level** (effort-based, не absolute weight):

   - `[ 70% EFFORT ]` block-label — block-level effort modifier.
   - `[ 75-80% Effort ]` body-level — schema-level effort.
   - Эти не Load, но **Effort modifier** sibling structure — может быть отдельный first-class entity (ImpliedIntensity или Effort VO). Out of strict Load scope.

5. **Drop-set program** (nested, §1.10 / `schema-content-primitives.md` §9): Load sequence (stages[]) attached к named-exercise-program schema archetype.
   - `{ stages: [{ reps: 5, load: {2x 15 kg DB} }, { reps: 5, load: {1x 15 kg DB} }, { reps: 5, load: { kind: "without_weight" } }] }` — first-class drop-set structure.

### 5.4 Relation summary

```
Athlete 1—* AthleteOneRM (per exercise OR per family OR hybrid — DP1)
Athlete 1—* Session
Session 1—* Block
Block 1—* Schema
Schema 1—* SchemaContent (rows, compound rows, drop-set programs)
SchemaContent — has — Load? (optional, depends on exercise equipment)
Load — kind variant — references:
  - Absolute → static Weight VO.
  - Percentage → AthleteOneRM (resolved per DP2).
  - Bodyweight / WithoutWeight → no external dependency.
  - Unspecified → fallback chain (schema default → block default → "needs coach input").
```

**Invariants**:

- Bodyweight exercise (intrinsic equipment) → Load.kind ∈ {bodyweight, percentage-of-bodyweight (advanced)}, never absolute kg.
- Weighted exercise → Load.kind ∈ {absolute, percentage, dual_value, unspecified}.
- Drop-set program → stages[] всегда ≥ 2, последний stage может быть `without_weight`.
- Percentage Load.reference — exercise resolution policy per DP1.
- Snapshot vs live — Session-level flag, per DP2.

---

## 6. Open questions / эскалации

1. **DP1, DP2, DP3, DP4** — main session decisions.
2. **Dual-value `[ 50/30 kg ]` interpretation** — отдельная Phase 5 эскалация (RX/SC vs M/F vs other resolver).
3. **Movement family derivation** — если DP1 chose (b) or (c), main session нужно определить grouping (5-15 families? на основе Phase 3.2 Group A-M? extension от primary_equipment + movement_type?).
4. **RPE inclusion** — вариант 5 Load — должен ли быть included в initial model или отложен beyond MVP.
5. **Effort modifiers** vs Load — `75-80% Effort` body-line — это Load или sibling structure (Intensity VO)? Phase 5 решает.
6. **Schema-level vs row-level load distribution** — multi-row standalone weight rows (§1.9, 2 occurrences) — first-class или Phase 1-like artefact?
