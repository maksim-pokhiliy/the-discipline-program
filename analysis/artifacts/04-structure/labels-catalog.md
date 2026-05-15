# Labels catalog (Phase 4)

Выбор catalog-структуры для Day / Session / Block labels + ratified composite-label decomposition rules.

---

## 1. Sample summary

| level   | distinct labels           | total occurrences        | distinct names                                                                                                                                                                                                              | overlap с другими level    |
| ------- | ------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------ | ----------------------------------- | ------------------------------------------ |
| Day     | 1 (`R E S T  D A Y`)      | 66                       | `REST DAY`                                                                                                                                                                                                                  | нет                        |
| Session | 1 (`1ST SESSION`)         | 165                      | `1ST SESSION`                                                                                                                                                                                                               | нет                        |
| Block   | 17 canonical + (implicit) | 502 instance occurrences | STRENGTH ENDURANCE, SUCCESSORY WORK, CORE MUSCLES, GYMNASTICS, Basic GYMNASTICS, PUMP SESSION, INTERVALS, CHIPPER, PRACTICE, YOGA TIME, warm up for feet, warm up BEFORE run, 3 sets WARM UP BEFORE RUN, Warm Up before RUN | 3 sets, STRENGTH ENDURANCE | Gymnastics, STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ], EASY PACE | нет (case-insensitive, no name collisions) |

Ключевые свойства:

- 0 name-overlap между уровнями (Day-label `REST DAY` не пересекается ни с одним session/block label, и т.д.).
- Multi-label на Block ratified — нужна референс-by-id semantics.
- User hint в workflow start: «возможно DayTypes/SessionTypes/BlockTypes можно как-то запихнуть в одну библиотеку» — leans toward единого catalog.

---

## 2. Chosen option: **C — Hybrid (один catalog + soft applicable_levels)**

### Specification

```
Label {
  id: UUID
  name: string                              // human-readable, unique в библиотеке (case-insensitive)
  applicable_levels: Set<"day" | "session" | "block">  // advisory metadata
  // future: description?, color?, icon? — Phase 5+
}
```

Catalog — **one global namespace** (не split по уровням).

Usage:

- `Day.label: LabelRef?` — references Label.id.
- `Session.label: LabelRef?` — references Label.id.
- `Block.labels: LabelRef[]` — references Label.id (ordered list).

`applicable_levels` — UI hint:

- Создавая Label в библиотеке, тренер указывает один или несколько applicable_levels.
- При assignment Label к Day / Session / Block — UI rendering / search filter / suggestion prioritizes labels с matching level в applicable_levels.
- **Не enforced**: технически можно назначить Label с `applicable_levels=[block]` на Session. UI выдаст warning, но не блокирует.

### Reasoning (почему C, а не A или B)

| criterion                                                                          | A (strict per-level)               | B (3 separate catalogs)                 | **C (hybrid soft)**                                |
| ---------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------- | -------------------------------------------------- |
| sample overlap (0 name collisions)                                                 | не использует свойство             | усиливает разделение                    | использует как evidence единого namespace          |
| multi-label flexibility (Block.labels[])                                           | работает                           | работает (требует только Block catalog) | работает + future-proof для cross-level reuse      |
| user hint «единая библиотека»                                                      | violates                           | violates                                | matches                                            |
| YOGA TIME borderline (session vs block)                                            | блокирует переклассификацию        | требует migration label между catalogs  | мягкий переход — просто меняется applicable_levels |
| coach experimentation (новый label «MOBILITY» подходит и для Block, и для Session) | требует дублирования или migration | требует создания в обоих catalogs       | один label, applicable_levels=[block, session]     |
| type safety                                                                        | strong (enforced)                  | strongest (separate types)              | soft (advisory) — UI warns                         |
| risk misuse                                                                        | low (blocked)                      | lowest                                  | medium (можно misassign, но warning)               |
| coach UI / library mental model                                                    | 3 separate views                   | 3 separate views с migration costs      | 1 unified view с per-level filter                  |

**Strong reasons для C**:

- **User hint explicitly leans единая библиотека** — это вес main session.
- **YOGA TIME**: Phase 1 классифицировал как block-label по позиции; Phase 4 hierarchy.md notes: если тренер захочет промоутить до session-level — в Option C просто меняем applicable_levels = `[block, session]`, без migration data.
- **Multi-label Block.labels[]** уже требует references (не enums), так что shared catalog естественен.
- **Sample mаленький**: 19 distinct names всего. Разделение по 3 catalogs — overengineering для текущей кардинальности. Если catalog вырастет до сотен labels — единый namespace проще scale, чем 3 коллекции.

**Weak reasons против C** (рассмотрены):

- «soft, не enforced» открывает дверь misuse. Mitigation: UI warning сильный. Coach всегда может откатить — это библиотека, не immutable data.
- Type-system strictness ниже A. Mitigation: Phase 6 решит — в TS можно typed-narrowed checks per usage site, а sub-validation на applicable_levels оставить opt-in.

### Library management (Phase 5 проектирует, Phase 4 фиксирует contracts)

- **Тренер CRUD**: создаёт / переименовывает / архивирует Label. Удаление — только если нет assignments (или explicit cascade с подтверждением).
- **Naming уникальность**: case-insensitive (`Strength Endurance` = `STRENGTH ENDURANCE` = `strength endurance`). Phase 1 уже делает эту дедупликацию; модель ratify.
- **Basic GYMNASTICS vs GYMNASTICS** (Phase 1 edge-case) — distinct library entries. Тренер сам решает merge / keep separate. Phase 4 не enforces (no automatic merge).
- **Lowercase labels** (`warm up for feet`, `warm up BEFORE run`) — обычные Label с любым name. Регистр сохраняется как coach написал (для presentation), но dedup case-insensitive.
- **`applicable_levels` initial values** для текущего sample:
  - `R E S T  D A Y` → `[day]`.
  - `1ST SESSION` → `[session]`.
  - 17 block-labels → `[block]`.
  - Coach потом может расширить (e.g., `YOGA TIME` → `[block, session]` если решит promote).

---

## 3. Composite-label decomposition rules

Phase 1 канонизировал 4 composite block-label strings как distinct inventory entries. Phase 4 ratifies decomposition к (`labels[]`, `intensity?`, `schema_header_prefix?`).

**Принцип**: composite-string в inventory — textual surface form. Финальная модель — multi-label assignment + optional intensity VO + optional schema-header injection. Parser (Phase 5/6) применяет правила ниже в порядке precedence.

### Inputs (Phase 1 composite block-labels)

| inventory label             | occurrences               | body shape                                  |
| --------------------------- | ------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `STRENGTH ENDURANCE         | Gymnastics`               | 12                                          | pull-ups + traverses + bar dips, multiple ladder/cycle shapes |
| `STRENGTH ENDURANCE         | EASY PACE [ 70% EFFORT ]` | 1                                           | 5-row exercise list (flat-list-headerless)                    |
| `Warm Up before RUN         | 3 sets`                   | 2                                           | 3-row warm-up exercises (без header в body)                   |
| `3 sets WARM UP BEFORE RUN` | 5                         | 3-row warm-up exercises (без header в body) |

### Rule 1 — Bracket-annotation extraction (intensity / time-cap / etc.)

**Detect**: substring matching `[ … ]` внутри label-string. Возможные содержания (per Phase 3.1 §6.8 + sample evidence):

- `[ N% EFFORT ]` / `[ N% Effort ]` / `[ N-M% Effort ]` → effort_percent intensity.
- `[ EASY PACE ]` / похожие categorical phrases в `[ ]` — out-of-sample, hypothetical.
- `[ N-M min ]` / `[ N min ]` → time-cap annotation (block-level duration hint, not Intensity). Phase 4 escalates как block-level non-intensity attribute (см. `edge-cases.md`).

**Action**:

- Извлекаем содержимое `[ ]` из label-string.
- Если содержимое — intensity expression (% Effort / RPE / pace в brackets), создаём `Block.intensity` VO.
- Если содержимое — time-cap или иное non-intensity → block-level attribute / annotation (Phase 5 решает persistence).
- Remaining label-string (без extracted bracket) переходит на Rule 2/3.

**Examples**:

| input                                                                            | extracted                                             | remaining                                       |
| -------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------- | ------------------- | ---------- |
| `STRENGTH ENDURANCE                                                              | EASY PACE [ 70% EFFORT ]`                             | intensity = `{ kind:effort_percent, value:70 }` | `STRENGTH ENDURANCE | EASY PACE` |
| `PRACTICE [ 5-10 min ]` _(out-of-scope для Rule 1 — это time-cap, не intensity)_ | time*cap = `{ min:5, max:10 }` *(см. edge-cases.md)\_ | `PRACTICE`                                      |

**Sample coverage**: 1 occurrence в 4-х composite inputs (block-055).

### Rule 2 — Schema-header extraction

**Detect**: substring matching schema-header patterns внутри label-string:

- `K sets` / `K-M sets` (`3 sets`, `3-4 sets`)
- `K rounds` / `K-M rounds`
- `K×R reps` форма
- (extendable: `EMOM N min`, `AMRAP N min`, ladder `N-M-K:`, etc., но в sample эти формы не встречаются в label-positions)

**Action**:

- Извлекаем schema-header expression из label-string.
- Inject как **schema-header on the first schema внутри блока**. Тело blocка остаётся неизменным; parser добавляет header сверху, превращая `archetype-flat-list-headerless` body в `archetype-n-rounds` body (per Phase 2.1 case-3-sets-WARM-UP-label-vs-schema observation).
- Remaining label-string (без extracted schema-header) переходит на Rule 3.

**Examples**:

| input                       | extracted schema-header | remaining            |
| --------------------------- | ----------------------- | -------------------- | -------------------- |
| `Warm Up before RUN         | 3 sets`                 | `3 sets:`            | `Warm Up before RUN` |
| `3 sets WARM UP BEFORE RUN` | `3 sets:`               | `WARM UP BEFORE RUN` |

**Sample coverage**: 7 occurrences (block-150 ×5 + block-151 ×2).

**Note**: после применения Rule 2, тела block-150 и block-151 (3 exercise rows без header) становятся семантически эквивалентными block-148 (`warm up BEFORE run` + body c явным `3 sets:` header). Это **ratification** Phase 2.1 наблюдения — все 3 inventory variants представляют одну модельную сущность.

### Rule 3 — Pure multi-label split

**Detect**: после применения Rule 1 и Rule 2, в label-string остался `|`-separator.

**Action**:

- Split label-string на компоненты по `|` separator.
- Trim whitespace вокруг каждого компонента.
- Каждый компонент — отдельный LabelRef. Order preserved (textual order).
- Если single component без `|` — single label, тривиальный случай.

**Examples**:

| input                                 | output labels[]             |
| ------------------------------------- | --------------------------- | ---------------------------------- |
| `STRENGTH ENDURANCE                   | Gymnastics`                 | `[STRENGTH ENDURANCE, Gymnastics]` |
| `STRENGTH ENDURANCE                   | EASY PACE` _(после Rule 1)_ | `[STRENGTH ENDURANCE, EASY PACE]`  |
| `Warm Up before RUN` _(после Rule 2)_ | `[Warm Up before RUN]`      |
| `WARM UP BEFORE RUN` _(после Rule 2)_ | `[WARM UP BEFORE RUN]`      |
| `STRENGTH ENDURANCE`                  | `[STRENGTH ENDURANCE]`      |

**Sample coverage**: все 4 composite inputs + 17 plain block-labels.

### Rule precedence

Правила применяются в порядке: Rule 1 → Rule 2 → Rule 3.

Обоснование: bracket annotations и schema-headers — orthogonal к multi-label split; их можно встретить в любом компоненте `|`-separated string. Сначала вычитаем bracket-ы (они «не делятся» по `|`), потом schema-headers, потом split по `|` на residual labels.

### Full decomposition examples (для 4 inventory composite inputs)

#### Input 1: `STRENGTH ENDURANCE | Gymnastics` (12 occurrences)

- Rule 1: no `[ ]` — skip.
- Rule 2: no schema-header pattern — skip.
- Rule 3: split → `[STRENGTH ENDURANCE, Gymnastics]`.
- **Result**: `labels=[STRENGTH ENDURANCE, Gymnastics]`, `intensity=null`, `schema_header_prefix=null`.

#### Input 2: `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]` (1 occurrence)

- Rule 1: extract `[ 70% EFFORT ]` → `intensity = { kind:effort_percent, value:70 }`. Remaining: `STRENGTH ENDURANCE | EASY PACE`.
- Rule 2: no schema-header — skip.
- Rule 3: split → `[STRENGTH ENDURANCE, EASY PACE]`.
- **Result**: `labels=[STRENGTH ENDURANCE, EASY PACE]`, `intensity={kind:effort_percent, value:70}`, `schema_header_prefix=null`.

#### Input 3: `Warm Up before RUN | 3 sets` (2 occurrences, block-151)

- Rule 1: no `[ ]` — skip.
- Rule 2: extract `3 sets` → `schema_header_prefix = "3 sets:"`. Remaining: `Warm Up before RUN`.
- Rule 3: split (no `|` after Rule 2 cleanup) → `[Warm Up before RUN]`.
- **Result**: `labels=[Warm Up before RUN]`, `intensity=null`, `schema_header_prefix="3 sets:"`.

#### Input 4: `3 sets WARM UP BEFORE RUN` (5 occurrences, block-150)

- Rule 1: no `[ ]` — skip.
- Rule 2: extract `3 sets` → `schema_header_prefix = "3 sets:"`. Remaining: `WARM UP BEFORE RUN`.
- Rule 3: split (no `|`) → `[WARM UP BEFORE RUN]`.
- **Result**: `labels=[WARM UP BEFORE RUN]`, `intensity=null`, `schema_header_prefix="3 sets:"`.

### Equivalence note (Inputs 3 + 4)

После decomposition tела блоков:

- block-148: label `[warm up BEFORE run]`, schema-1 имеет header `3 sets:` (явный в body).
- block-150: label `[WARM UP BEFORE RUN]`, schema-header injected from label.
- block-151: label `[Warm Up before RUN]`, schema-header injected from label.

Все 3 sources представляют **семантически идентичный block**:

- 1 label «warm-up перед run'ом».
- 1 schema `3 sets:` с body = 3 exercise rows (single leg glute bridge + hip ABduction + hip ADduction).

Library management:

- Coach может keep 3 separate labels (`warm up BEFORE run`, `WARM UP BEFORE RUN`, `Warm Up before RUN`) — case-insensitive dedup сольёт их в **один** Label.
- Final label name выбирает coach (presentation form). Phase 4 не выбирает.

### Composite-labels not in 4 listed inputs — но related

| inventory label                                           | composite?                      | Phase 4 treatment                                                                                                                                                                  |
| --------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PRACTICE [ 5-10 min ]`                                   | да (label + bracket annotation) | Rule 1 extension: extract `[ 5-10 min ]` как block-level time-cap. См. `edge-cases.md` (Phase 5 ratifies time-cap field)                                                           |
| `warm up for feet [ BEFORE RUN ]` (5 occurrences variant) | да (label + bracket annotation) | Rule 1 extension: extract `[ BEFORE RUN ]` как positional / sequence indicator. См. `edge-cases.md`. Phase 1 уже дедуплицировал с `warm up for feet:` canonical — variant artifact |

Phase 4 формально ratifies Rule 1 / Rule 2 / Rule 3 на 4 заявленных composite inputs. Расширения для bracket annotations не-intensity типа (time-cap, positional) — flagged в `edge-cases.md` для Phase 5.

---

## 4. Catalog invariants

- Name dedup — case-insensitive в рамках единого Library namespace.
- Label.id — stable UUID; name переименование не разрывает existing references.
- Removal без cascade — запрещён, если `references_count > 0`. Coach подтверждает explicit cascade удаление.
- `applicable_levels` — non-empty set (≥1 уровень); коач не создаёт «label без applicable level».
- 0 хардкода: модель не знает про литералы `STRENGTH ENDURANCE` / `1ST SESSION` / etc. Это библиотечные записи, не enum.

---

## 5. Summary

- **Chosen catalog option**: **C — Hybrid (один global namespace + soft applicable_levels metadata)**.
- **Reasoning bullets**:
  - 0 name-overlap между уровнями в sample — единый namespace работает без коллизий.
  - User hint про «единую библиотеку».
  - Multi-labels Block требуют references; shared catalog естественен.
  - YOGA TIME-стиль borderline случаи: soft applicable_levels позволяет промоутить label между уровнями без migration.
  - Strict typing (Option A) — overengineering для текущей кардинальности.
  - Three-catalog separation (Option B) — лишняя complexity, не оправдана sample evidence.
- **Composite-label decomposition rules**: 3 ratified rules с precedence Rule 1 (bracket) → Rule 2 (schema-header) → Rule 3 (split).
- **Library entity** — high-level shape зафиксирован; CRUD operations и UI semantics — Phase 5/6.
- **Открытые расширения** (вынесены в `edge-cases.md`):
  - `[ 5-10 min ]` в `PRACTICE` label — time-cap (block-level non-intensity attribute).
  - `[ BEFORE RUN ]` variant в `warm up for feet` raw variants — positional annotation.
  - Pace как label vs Intensity variant — Phase 5 может upgrade с ростом sample.
