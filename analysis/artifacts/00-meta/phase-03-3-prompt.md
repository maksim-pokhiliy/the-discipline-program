Задача: Phase 3.3 — Load representation для проекта построения доменной модели тренировочных сессий.

КОНТЕКСТ

Ты — соседняя сессия в рамках workflow по построению доменной модели тренировочных сессий. Phase 1, 2.1, 2.2, 3.1, 3.2 выполнены. Артефакты в `analysis/artifacts/01-inventory/`, `02-patterns/`, `03-content/`.

ПЕРВЫМ ДЕЛОМ прочитай файл-контракт:

`/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/00-meta/workflow.md`

Не нарушать. Эта задача = Phase 3.3 (Load representation — третий и последний sub-prompt Phase 3). После 3.3 идём в Phase 4.

DECISIONS INHERITED ОТ MAIN SESSION

1. Phase 1, 2.1, 2.2, 3.1, 3.2 артефакты — ground truth, НЕ модифицировать.
2. Все ratified эскалации финальные.
3. Composite labels / basic-vs-gymnastics / lowercase blocks / empty bodies — Phase 4.
4. Scope ниже уровня недели.

MODIFIER CLASSIFICATION (input для load model)

Weight — first-class structured VO (не строка). Variants:

- single / dual / single-arm / compound-device (DB/KB/BB) / split-tier / dual-value (`50/30 kg`) / weight-with-asymmetric-arm-action / weight-with-depth-modifier / bodyweight (none) / negative (`WITHOUT WEIGHT`).

Все first-class entities могут иметь optional `notes` field.

PHASE 3.2 RATIFIED DECISIONS (input)

10 эскалаций разрешены:

1. `DB alt. snatches` → merge into `DB Snatches` (alternating = use-site `[ alternative ]`).
2. `&` vs `+` для Olympic lifts — keep separate в каталоге; Phase 5 formalizes Option (c).
3. **KB vs Kettlebell**: ratify abbreviation `KB` как canonical naming convention. `Single Leg Kettlebell Hip Thrust` → `Single Leg KB Hip Thrust`.
4. **Movement family**: soft grouping field в Exercise, не hard relation.
5. `single arm row` (mixed) → merge into `DB single arm row`; split-tier = use-site composite weight.
6. `DB bench presses LEFT arm | RIGHT arm HOLD in UP` — extract pipe-modifier, canonical = `DB bench presses` + use-site composite weight-with-asymmetric-arm-action.
7. `Cossacs squats AFTER EACH GYMNASTICS set` — extract sequence, canonical = `Cossacs squats` + use-site `after_each_typed_round: GYMNASTICS`.
8. `3x 10 DB Jefferson curls` — extract prefix как schema header; canonical = `DB Jefferson curls`.
9. `MAX ROUNDS in remaining time...` — remove from Exercise list, move в schema-content primitive.
10. `pull overs` vs `DB pull overs` — keep separate (weak evidence).

Compound `+` = Option (b) decompose + cyclical/sandwich first-class structures. `&` composite-named = atomic. OR-alternative = first-class. Placeholders = first-class slot.

ВХОДНЫЕ ДАННЫЕ

- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/exercise-instances.md` — 168 exercises с occurrences (weights inline в occurrences).
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/schema-boundaries.md` — body rows с weights.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/schema-content-primitives.md` — Phase 3.1 weight notations primitives.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/modifier-scope.md` — weight scope rules.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/exercise-canonical-list.md` — 149 canonical exercises с primary_equipment.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/exercise-merge-candidates.md` — для понимания weight stability across merged variants.

ЦЕЛЬ

Каталог типов load notations (что есть в sample) + предложение модели load representation (с учётом extension для %1RM, beyond sample).

Sample содержит только absolute weights (юзер тренируется дома). Реальный финальный продукт должен поддерживать %1RM (для зала, основная масса работы тренера). Phase 3.3 анализирует и предлагает, не финализирует.

ЗАДАЧИ

### Task 1 — Каталог absolute weight notations (из sample)

Систематизировать все типы weight notation. Для каждого: distinct strings, cardinality, scope правила, примеры.

Семейства:

- **Single weight**: `[ 15 kg ]`, `[ 17.5 kg ]`, `[ 24 kg ]`. Equipment context определяется именем exercise (`DB ...` / `KB ...` / etc.).
- **Dual weight (paired equipment)**: `[ 2x 15 kg ]`, `[ 2x15 kg ]` (typo whitespace variant). Оба снаряда одинаковые.
- **Single-arm**: `[ 1x 15 kg ]` — один снаряд при alternating execution.
- **Compound-device explicit prefix**: `[ DB 2x 15 kg ]`, `[ DB 1x 15 kg ]` — explicit DB.
- **Split-tier composite**: `[ 5 KB 24 kg + 10 DB 15 kg ]` — per-set 2 stages с разным equipment.
- **Dual-value placeholder**: `[ 50/30 kg ]` — М/Ж или RX/SC; интерпретация **deferred** (не выбирать одну).
- **Weight + asymmetric arm-action**: `[ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]`, mirror.
- **Weight + depth modifier**: `[ 24 kg | to the parallel ]` — singleton composite.
- **Bodyweight (implicit)**: упражнение без weight annotation. Это значимое состояние, не отсутствие.
- **Negative (no-load explicit)**: `[ WITHOUT WEIGHT ]` — встречается внутри drop-set program (Bulgarian split squats).
- **Multi-row scope** standalone weight row: `[ 2x 15 kg ]` / `[ DB 2x 15 kg ]` — занимает всю row, применяется к preceding exercise rows в той же schema.

Для каждого:

- Distinct strings (с typo/case variants — см. Phase 3.1 dedup).
- Total occurrences.
- Scope rule.
- Примеры (3 occurrences from разных blocks).

### Task 2 — Stability / variability weight per canonical exercise

Для каждого из 149 canonical exercises:

- Список distinct weight notations across occurrences.
- Классификация:
  - `stable` — same weight в всех occurrences с весом.
  - `variable` — weight меняется по контексту.
  - `bodyweight` — нет weight annotation.
  - `mixed` — некоторые occurrences с весом, некоторые без.

Это hint для модели defaults (Phase 5 решит финально). НЕ финализировать defaults — только статистика.

Артефакт `load-stability-per-exercise.md` с table.

### Task 3 — %1RM extension beyond sample

Sample не содержит %1RM. Phase 3.3 анализирует **что должна поддерживать модель** для реальных gym workouts тренера.

Типы percentage notation, которые могут встретиться (на основе общеизвестных CrossFit/strength conventions, без обращения к web):

- `N% 1RM` — direct percentage of 1RM (`60% 1RM`).
- `N-M% 1RM` — range (`60-70% 1RM`).
- `N%` implicit reference — short form (`60%`).
- `N% × R reps` — combined notation (`60% × 5 reps`).
- `K sets × R reps @ N-M%` — full prescription.
- Movement-derived: `60% of back squat 1RM` — percentage с reference на другое упражнение.
- RPE (subjective): `RPE 8` — альтернатива %1RM. Может быть out of scope.

Каталог типов в conceptual form (без занимания финальной позиции).

### Task 4 — Decision points для main session

Поставь следующие 4 DP с options и trade-offs (НЕ финализировать):

**DP1: 1RM per-exercise vs per-movement-family**

- option (a) per-exercise: атлет имеет 1RM на каждый named exercise (DB Snatches 1RM, KB clean & push press 1RM, и т.д.).
  - pros: granular, не нужен resolver.
  - cons: плодит N значений (atlete = 30+ записей 1RM); duplicate для siblings (DB / KB).
- option (b) per-movement-family: 1RM хранится на movement family (`Bulgarian split squats family` 1RM), exercises наследуют.
  - pros: меньше значений; aligned с Phase 3.2 movement_family soft grouping.
  - cons: требует family-resolver; что если 1RM atlete'а для DB clean ≠ KB clean (разное equipment biomechanics)?
- option (c) hybrid: 1RM per-exercise, но soft "семьи" через movement_family для UI prefetch / suggestion.
  - pros: granular + соответствует Phase 3.2 grouping.
  - cons: complexity (два уровня).

**DP2: Snapshot vs live formula**

- option (a) snapshot: при создании сессии 1RM% резолвится в абсолютный вес и захардкоживается. Атлет улучшает 1RM, старые сессии не обновляются.
  - pros: устойчиво к изменениям, исторические данные сохраняются.
  - cons: не отражает прогресс; тренер должен обновлять веса вручную после прогресса атлета.
- option (b) live formula: load хранится как relative (`60% 1RM`), при просмотре атлетом — резолвится против актуального 1RM.
  - pros: dynamic, прогресс автоматически отражается.
  - cons: "старые" сессии меняются ретроактивно; нет архива actual lift weight.
- option (c) hybrid: live в активных циклах, snapshot в архивах (completed sessions); или explicit choice тренера per session.
  - pros: best of both.
  - cons: complexity, два режима, UI должен показывать какой используется.

**DP3: Default weight для bodyweight exercises**

- option (a) `null` / `none` — отсутствие weight = bodyweight.
- option (b) explicit `bodyweight` enum value в load VO.
- option (c) `weight = 0` — numeric zero.

**DP4: Compound-row per-element weight**

`5 strict DB press + 5 DB push press [ 2x 15 kg ]` — `[ 2x 15 kg ]` applies к чему?

- option (a) trailing weight = весь compound (applies to both `+ ` elements).
- option (b) trailing weight = только к последнему (`DB push press`).
- option (c) explicit per-element annotation required (если разные веса).

Sample evidence: examine 3-5 compound rows с trailing weight, deduce convention. Не выбирать sample-based answer как final, но flag pattern.

### Task 5 — Conceptual load model proposal

Без projecting Prisma / TS. Только conceptual:

- **Load** = VO с polymorphic variants:
  - Absolute: weight VO (single/dual/single-arm/etc.) per Task 1.
  - Percentage: `{ percent: N, reference: 1RM-of-exercise | 1RM-of-family, range_max: optional }`.
  - Dual-value: `{ first: weight, second: weight, resolver: "athlete_profile" }`.
  - Composite (split-tier / asymmetric-arm / depth-modifier): structured per Task 1.
  - Bodyweight: enum or null per DP3.
  - Negative: explicit no-load indicator (Bulgarian drop-set final stage).
- **1RM**: атрибут athlete profile (не exercise), referenced by exercise or movement_family per DP1.
- **Resolution policy**: per DP2.

Опиши conceptually how эти variants связаны, без entity diagram.

ВЫХОДНЫЕ АРТЕФАКТЫ

В `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/`:

1. **`load-representation.md`** — основной артефакт:

   - Каталог absolute weight notations (Task 1).
   - %1RM extension section (Task 3).
   - 4 DPs с options (Task 4).
   - Conceptual model proposal (Task 5).

2. **`load-stability-per-exercise.md`** — Task 2 stability/variability table.

3. **`load-edge-cases.md`** — singletons (dual-value, split-tier, composite-arm, depth-modifier), ambiguous compound per-element weight, эскалации.

ФОРМАТ load-representation.md

```
# Load representation (Phase 3.3)

## 1. Absolute weight notations (from sample)

### 1.1 Single weight `[ N kg ]`
distinct strings: `[ 15 kg ]` (X), `[ 17.5 kg ]` (Y), `[ 24 kg ]` (Z)
total occurrences: NNN
scope: exercise (inline на той же row).
equipment context: определяется именем exercise.
examples:
- block-NNN / schema-N: `12 DB Cossacs squats [ 15 kg ] [ 6 EACH leg ]`
- ...

### 1.2 Dual weight `[ 2x N kg ]`
...

(etc. для каждого type из 11 семей в Task 1)

## 2. Stability per canonical exercise

(reference to load-stability-per-exercise.md table)

## 3. %1RM extension beyond sample

### 3.1 Percentage notation forms (conceptual)
...

### 3.2 1RM как атрибут atlete
...

## 4. Decision points (для main session)

### DP1: 1RM per-exercise vs per-movement-family
options:
- (a) per-exercise — pros: ... cons: ...
- (b) per-movement-family — ...
- (c) hybrid — ...

### DP2: Snapshot vs live formula
...

### DP3: Default weight для bodyweight
...

### DP4: Compound-row per-element weight
sample evidence: ...
options:
- (a) trailing weight = whole compound — ...
- (b) trailing weight = last element only — ...
- (c) explicit per-element required — ...

## 5. Conceptual load model proposal

### Load VO variants
...

### 1RM ownership and resolution policy
...

### Composition with Exercise and Schema
...
```

ФОРМАТ load-stability-per-exercise.md

```
# Load stability per canonical exercise (Phase 3.3)

149 canonical exercises (после Phase 3.2 merges) с weight stability classification.

## Stable (X exercises)

| canonical_name | weight | occurrences |
|---|---|---|
| DB Snatches | `[ 15 kg ]` and `[ 1x 15 kg ]` | XX |
| ... | ... | ... |

## Variable (Y exercises)

| canonical_name | weight variants | occurrences per variant |
|---|---|---|
| DB squats | `[ 2x 15 kg ]` (16), `[ 2x15 kg ]` (4) | typo variants of same |
| ... | ... | ... |

## Bodyweight (Z exercises)

list: strict pull-ups, burpees, ...

## Mixed (W exercises) — some occurrences with weight, some без

list: ...

## Summary
- stable: X
- variable: Y
- bodyweight: Z
- mixed: W
- total: 149
```

ФОРМАТ load-edge-cases.md

```
# Phase 3.3 edge cases

## Singletons
- Dual-value `[ 50/30 kg ]` — 1 occurrence, deferred interpretation.
- Split-tier composite — 6 occurrences.
- Weight-with-asymmetric-arm-action — 5 occurrences.
- Weight-with-depth-modifier `[ 24 kg | to the parallel ]` — 1 occurrence.
- Standalone weight rows `[ 2x 15 kg ]` standalone — 2 occurrences.

## Ambiguous compound per-element weight
(sample evidence for DP4)

## Escalations
- DP1, DP2, DP3, DP4 — main session decisions.
- Dual-value interpretation rules (deferred — not Phase 3.3 scope).
- Movement family 1RM derivation (if DP1 chose (b) or (c)).
```

ACCEPTANCE

- Все 11 типов weight notation каталогизированы.
- Stability classification для всех 149 canonical exercises (либо bodyweight для exercises без weight).
- %1RM section с notation forms и conceptual model.
- 4 DPs ясно поставлены с options.
- Conceptual load model proposal без entity design.

ПРАВИЛА РАБОТЫ

- НЕ читать вне `analysis/`.
- НЕ память, web (даже для CrossFit %1RM conventions — генерируй из общих знаний без verification).
- НЕ проектировать Prisma / TS.
- НЕ финализировать DPs — это main session.
- НЕ интерпретировать dual-value (M/F vs RX/SC).
- НЕ модифицировать предыдущие артефакты.
- НЕ выходить выше уровня session.
- НЕ делегировать sub-agentам.
- Russian content, English identifiers/filenames.
- Без эмодзи / подписей / комментариев в коде.

ОТЧЁТ ПО ОКОНЧАНИИ

В чате коротко: total weight notation types, stability stats (X stable / Y variable / Z bodyweight / W mixed из 149), %1RM options summary, 4 DPs с recommendations (если есть мнение), эскалации.
