Задача: Phase 4 — Top-level structure (Day / Session / Block) для проекта построения доменной модели тренировочных сессий.

КОНТЕКСТ

Ты — соседняя сессия в рамках workflow по построению доменной модели тренировочных сессий. Phase 1, 2.1, 2.2, 3.1, 3.2, 3.3 выполнены. Артефакты в `analysis/artifacts/01-inventory/`, `02-patterns/`, `03-content/`.

ПЕРВЫМ ДЕЛОМ прочитай файл-контракт:

`/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/00-meta/workflow.md`

Не нарушать. Эта задача = Phase 4 (Top-level structure). После Phase 4 идём в Phase 5 (Synthesis).

DECISIONS INHERITED ОТ MAIN SESSION (важные input — закрытые deferred decisions)

Главная сессия ratified следующие решения, которые ты применяешь как ground truth:

### 1. Multi-labels on block (КРИТИЧЕСКОЕ изменение модели)

**Block может иметь 0..N labels** (массив, не один). Composite block-labels с `|` separator в inventory — это **textual representation of multi-label assignment** + optional inline schema header.

Decomposition rules:

- `STRENGTH ENDURANCE | Gymnastics` → block имеет 2 labels: `STRENGTH ENDURANCE` + `Gymnastics`.
- `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]` → block имеет 2 labels: `STRENGTH ENDURANCE` + `EASY PACE`; intensity modifier `[ 70% EFFORT ]` — block-level Intensity VO (effort_percent: 70).
- `Warm Up before RUN | 3 sets` → block имеет 1 label `Warm Up before RUN`; `3 sets` — это **schema header внутри блока** (не label, не second label). Schema body starts с этого header.
- `3 sets WARM UP BEFORE RUN` → block имеет 1 label `WARM UP BEFORE RUN`; `3 sets` — это **schema header** на schema внутри блока.

Phase 1 классифицировал эти composite-strings как distinct block-labels — это **inventory artifact**, не финальная истина. Phase 4 ratifies decomposition rules.

НЕ модифицировать Phase 1 артефакты. Phase 4 documents decomposition rules в hierarchy.md / labels-catalog.md.

### 2. Empty-body blocks — valid state

Block может иметь empty schemas array. Не collapse, не placeholder marker. UI рендерит block с label без content. Это валидно.

### 3. Lowercase block labels — обычные labels

`warm up for feet`, `warm up BEFORE run` и подобные — обычные block-labels. Модель не различает регистр. Не sub-section, не special case.

### 4. Basic GYMNASTICS vs GYMNASTICS — library, не model

Оба — distinct library примитивы. Модель не знает про литерал. Тренер сам создаёт labels в библиотеке и называет как хочет. Phase 4 ratify keep separate; merge — library-managed.

### 5. `Temporarily without STRENGTH ENDURANCE` — instruction-row

Ratified в Phase 2: это **не block-label**, это инструкция тренера. Body этих 7 occurrences обрабатывается как `(implicit)` блок. Phase 4 не повторяет classification.

### 6. Phase 3.3 DPs (1RM / load / bodyweight / compound) — финальные

- DP1 (c) hybrid: 1RM per-exercise + movement_family soft grouping.
- DP2 (b) live formula + actual_load recorded performance.
- DP3 (b) explicit `bodyweight` variant.
- DP4 (a)+(c) hybrid: trailing applies to whole compound + per-element override.

### 7. Intensity sibling VO

Effort / RPE / pace — sibling VO к Load, не variant. Variants:

- `effort_percent` (`75-80% Effort`, `70% EFFORT`) — single или range.
- `rpe` (out-of-sample, future) — RPE 1-10.
- `pace` (`EASY PACE`) — categorical enum.
  Scope: block / schema / row.

### 8. Connector в schema — body of preceding (Phase 2.1)

`then:`, `...then...` — в конец body предыдущей schema. Phase 4 не пересматривает.

### 9. Movement family — soft grouping

Phase 3.2 ratified: `movement_family: string` поле на Exercise. Soft grouping для UX, не hard relation.

### 10. Scope ниже недели

Workflow.md правило: ничего выше Day. Day = pure container с order и optional label. Никаких calendar / progression / week references.

ВХОДНЫЕ ДАННЫЕ

- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/day-labels.md` — 1 label (REST DAY).
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/session-labels.md` — 1 label (1ST SESSION).
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/block-labels.md` — 17 canonical + `(implicit)`. Содержит composite labels.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/block-instances.md` — 198 cards с context.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/01-inventory/edge-cases.md` — Phase 1 observations.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/schema-archetypes.md`, `schema-boundaries.md`, `schema-archetype-mapping.md` — для понимания composition.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/02-patterns/edge-cases.md`, `archetype-edge-cases.md` — Phase 2 observations.
- `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/03-content/*` — Phase 3 артефакты для context.

ЦЕЛЬ

1. Каталогизировать атрибуты Day / Session / Block помимо children-collection (Task 1).
2. Финализировать Labels catalog (один общий vs три раздельных vs hybrid) на основе sample и decisions (Task 2).
3. Финализировать Intensity VO structure (Task 3).
4. Документировать composite-label decomposition rules как ratified (Task 4).

ЗАДАЧИ

### Task 1 — Hierarchy attributes per level

**Day** (контейнер sessions):

- `order` (sortable within parent context — мы ниже недели, но order значим).
- `label` (optional, single label reference): `REST DAY` only в sample.
- `notes` (optional free-text).
- `sessions[]` (children, 0..N).

**Session** (контейнер blocks):

- `order` (sortable within Day).
- `label` (optional, single label reference): `1ST SESSION` only в sample.
- `notes` (optional free-text).
- `blocks[]` (children, 0..N).

**Block** (контейнер schemas):

- `order` (sortable within Session).
- `labels[]` (multi-label, 0..N references) — **массив, не одно значение**. Composite `|`-strings из Phase 1 decompose к multi-label assignment + inline schema-header (см. inheritance §1).
- `intensity` (optional Intensity VO) — на block-level если intensity marker присутствует в label/composite.
- `notes` (optional free-text).
- `schemas[]` (children, 0..N) — may be empty (per inheritance §2).

Для каждого level: подтвердить attributes от sample, найти дополнительные observations (если есть), описать invariants.

**Question per Day**: есть ли в sample evidence для notes / additional metadata? Workflow.md правило: НЕТ дата / timestamp / calendar. Только order + label + notes (optional).

**Question per Session**: similar — additional metadata beyond order/label/notes?

**Question per Block**: additional attributes (intensity, notes, multi-label) + interaction с composite labels.

### Task 2 — Labels catalog

Три option:

**Option A — Один общий polymorphic catalog**:

```
Label {
  id, name,
  applicable_levels: [day | session | block]  // hint for UI
}
```

- Один глобальный namespace.
- Reuse: одно `WARMUP` может использоваться на любом уровне.
- Per-instance assignment includes level scope.

**Option B — Три раздельных catalogs**:

```
DayTypeLabel { id, name }
SessionTypeLabel { id, name }
BlockTypeLabel { id, name }
```

- Strong typing per level.
- Имена могут дублироваться между catalogs.

**Option C — Hybrid (soft applicable_levels)**:

```
Label { id, name, applicable_levels: [day | session | block] }
```

- Один catalog с метаданными applicable_levels (suggestion для UI).
- Но не enforced — label с applicable_levels=[block] можно теоретически назначить session, UI just warns.

**Sample evidence**:

- 1 day-label, 1 session-label, 17 block-labels. NO overlap по именам.
- Multi-labels per block — ratified (block.labels[]) ⇒ flexibility important.
- User hint в workflow start: "возможно DayTypes/SessionTypes/BlockTypes можно как-то запихнуть в одну библиотеку" — leans toward Option A или C.

Phase 4 анализирует и **предлагает один из вариантов с reasoning** на основе sample + ratified multi-labels + user hint.

### Task 3 — Intensity VO structure

Финализируй Intensity VO:

```
Intensity =
  | EffortPercent { value: N | range: [N, M] }
  | Rpe { value: N }  // out-of-sample, future
  | Pace { categorical: "easy" | "moderate" | "hard" | ... }  // enum
```

Scope: block / schema / row. Optional (intensity может отсутствовать).

Phase 4 documents:

- Полный variant list (на основе Phase 3.3 conceptual proposal).
- Scope hierarchy: если block has intensity, schemas inherit (или override на schema-level).
- Sample evidence: `[ 75-80% Effort ]` — schema-level (AMRAP body); `[ 70% EFFORT ]` — block-level (block-label).
- Categorical pace: `EASY PACE` — single occurrence, enum value.

### Task 4 — Composite-label decomposition rules

Документировать как ratified decomposition rules (для будущего parser / library):

Input Phase 1 composite labels:

1. `STRENGTH ENDURANCE | Gymnastics` (12 occ).
2. `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]` (1).
3. `Warm Up before RUN | 3 sets` (2).
4. `3 sets WARM UP BEFORE RUN` (5).

Rules:

- Detect schema-spec inside (`3 sets`, `N rounds`, etc.) — выделить как schema header в body of block.
- Detect intensity marker (`EASY PACE [ ... ]`, `[ ... % EFFORT ]`) — block-level Intensity VO.
- Remaining `|`-separated labels — multiple label assignment на block.

Document rules с примерами decomposition (input string → output: labels[], intensity, schema-header-prefix).

### Task 5 — Implicit blocks finalization

Phase 1 ratified 75 implicit-block instances (block без label). Phase 4 finalizes:

- Block.labels[] = empty array — valid state.
- No special "implicit" marker required (модель просто labels.length === 0).
- Inventory category `(implicit)` — это **inventory artifact** для группировки, не model class.

Document in hierarchy.md.

### Task 6 — Multi-labels semantics

С учётом block.labels[]:

- Что значит "STRENGTH ENDURANCE + Gymnastics"? Просто labeling (тренер addressed обоим), или composition semantic ("this is strength + gymnastics combined")?
- Phase 4 stance: pure labeling/tagging. Semantic interpretation — UI/coach responsibility.
- Order of labels — significant or not? Phase 4 propose: ordered list (preserves textual order from composite source).

ВЫХОДНЫЕ АРТЕФАКТЫ

В `/home/maksym/projects/contrib/the-discipline-program/analysis/artifacts/04-structure/`:

1. **`hierarchy.md`** — attributes Day / Session / Block с обоснованием, multi-labels semantics, implicit-blocks rule, empty-body valid state, Intensity VO scope hierarchy.

2. **`labels-catalog.md`** — chosen catalog option (A/B/C) с reasoning, sample evidence, future flexibility consideration. Composite-label decomposition rules с примерами.

3. **`edge-cases.md`** — оставшиеся ambiguities, эскалации в main session.

ФОРМАТ hierarchy.md

```
# Top-level hierarchy (Phase 4)

## Day

attributes:
- order: integer (sortable in parent context)
- label: LabelRef? (optional, single)
- notes: string? (optional free-text)
- sessions: Session[] (children, 0..N)

invariants:
- Day NOT containing time / date / calendar reference (per workflow rule).
- Empty sessions array valid (day без sessions = REST DAY pattern).

sample observations:
- 1 day-label observed (REST DAY).
- Day без label — общий случай (active days).

## Session

attributes: ...

## Block

attributes:
- order: integer
- labels: LabelRef[] (multi-label, 0..N)
- intensity: Intensity? (optional VO)
- notes: string?
- schemas: Schema[] (0..N, may be empty)

invariants:
- Empty labels array valid (implicit-block pattern, ~75 instances в sample).
- Empty schemas array valid (empty-body block, 6 instances).
- intensity scope: block-level applies to all schemas inside unless schema overrides.

sample observations:
- 17 distinct block-labels + 75 implicit (label-less).
- 1 block с composite intensity marker (block-055 `EASY PACE [ 70% EFFORT ]` → 2 labels + intensity).

## Intensity VO

(per Task 3, structured variants)

## Implicit blocks

(per Task 5, no special marker required)
```

ФОРМАТ labels-catalog.md

```
# Labels catalog (Phase 4)

## Chosen option: A / B / C

reasoning:
- Sample evidence: no overlap по именам, 1 day + 1 session + 17 block labels.
- Multi-labels on block ratified — needs flexible catalog reference model.
- User hint: единая библиотека labels.
- ...

(option specification with attributes, invariants)

## Composite-label decomposition rules

input: Phase 1 inventory composite labels.

### Rule 1: Schema-spec embedded in composite
detect: `K sets` / `N rounds` / `N-M-L:` etc. within composite string.
action: extract schema-spec as schema-header (body of block); remaining = label(s).
examples:
- `Warm Up before RUN | 3 sets` → labels: [`Warm Up before RUN`], schemas: starts with `3 sets:` header.
- `3 sets WARM UP BEFORE RUN` → labels: [`WARM UP BEFORE RUN`], schemas: starts with `3 sets:` header.

### Rule 2: Intensity marker embedded
detect: `[ N% EFFORT ]` / `EASY PACE [ ... ]` / etc.
action: extract intensity → block.intensity VO; clean label remains.
examples:
- `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]` → labels: [`STRENGTH ENDURANCE`, `EASY PACE`], intensity: `{ effort_percent: 70 }`.

### Rule 3: Pure multi-label
detect: `|`-separated label names без schema-spec / intensity.
action: split labels.
examples:
- `STRENGTH ENDURANCE | Gymnastics` → labels: [`STRENGTH ENDURANCE`, `Gymnastics`].

(rules ordered by precedence)

## Library management

- Тренер создаёт labels в library (CRUD).
- Phase 4 не финализирует library entity — это Phase 5.
- Library decisions (merge Basic GYMNASTICS / GYMNASTICS, naming conventions, applicable_levels enum) — library-side, не model.
```

ФОРМАТ edge-cases.md

```
# Phase 4 edge cases

## Ambiguous attribute decisions
...

## Open questions
- ...

## Эскалации в main session
1. ...
```

ACCEPTANCE

- Каждый уровень иерархии имеет attributes list с обоснованием.
- Labels catalog option chosen с reasoning.
- Composite-label decomposition rules documented (3 rules с примерами).
- Intensity VO structure финализирована.
- Multi-labels semantics articulated.
- Implicit blocks treatment ratified (no special marker).
- Empty-body blocks ratified valid.

ЧТО НЕ ДЕЛАЕТ PHASE 4

- НЕ выходит выше Day (no week / calendar attributes).
- НЕ проектирует Prisma / TS / Zod (Phase 5/6).
- НЕ модифицирует Phase 1/2/3 артефакты.
- НЕ финализирует Exercise / Schema / Load / Intensity entity design (Phase 5 synthesis).
- НЕ интерпретирует dual-value resolver, RPE inclusion, cross-movement reference — это уже ratified в Phase 3.3.
- НЕ делегирует sub-agentам.

ПРАВИЛА РАБОТЫ

- НЕ читать вне `analysis/`.
- НЕ память, web, video.
- Russian content, English identifiers/filenames.
- Без эмодзи / подписей / комментариев в коде.

ОТЧЁТ ПО ОКОНЧАНИИ

В чате коротко: chosen labels catalog option (A/B/C) с reasoning, attributes finalized per level, composite decomposition rules count, intensity scope hierarchy, multi-labels statement, эскалации (если есть).
