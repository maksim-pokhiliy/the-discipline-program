# Phase 4 edge cases

Остаточные ambiguities, открытые вопросы и эскалации после ratification Day / Session / Block attributes + labels catalog choice + composite-label decomposition rules.

---

## 1. Ambiguous attribute decisions

### case-pace-as-label-vs-intensity

**Context**: `EASY PACE` присутствует только в `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]` (block-055, 1 occurrence). Phase 4 решил трактовать как label (multi-label set: `[STRENGTH ENDURANCE, EASY PACE]`), а не как Intensity variant `{ kind:pace, value:"easy" }`.

**Reasoning Phase 4**:

- Phase 1 канонизировал `EASY PACE` как label-имя (попало в block-labels.md).
- Mix pace-categorical + effort-numeric внутри одной Intensity VO усложняет discriminated union ради 1 occurrence.
- Pace как label прозрачен в UI: «теги» — отдельная axis от «intensity number».

**Альтернатива**: pace = Intensity variant с enum value. Тогда `intensity = { kind:pace, value:"easy" }` параллельно к `{ kind:effort_percent, value:70 }` → multi-axis intensity или sibling-on-block (block.pace + block.intensity).

**Эскалация Phase 5**: если в expanded sample (gym-context) pace начнёт встречаться часто вместе с numeric intensity на schema-level, рекомендуется upgrade pace в Intensity variant и убрать из labels catalog. До тех пор — оставить как label, low cost rollback.

### case-time-cap-on-label `PRACTICE [ 5-10 min ]`

**Context**: `PRACTICE [ 5-10 min ]` (2 occurrences, block-146). Label с inline `[ 5-10 min ]` time-cap annotation. Не покрывается строго 4 заявленными composite inputs Phase 4 task, но структурно — same pattern (Rule 1 extension).

**Phase 4 treatment**:

- Rule 1 extension: extract `[ 5-10 min ]` → block-level time-cap attribute.
- Remaining label: `PRACTICE`.
- Phase 4 не финализирует точное имя поля (Block.time_cap? Block.duration_hint?). Эскалация Phase 5.

**Эскалация Phase 5**:

- Принять или отвергнуть «block-level time-cap» как first-class attribute (sample 2 occurrences — singleton).
- Альтернатива: time-cap живёт на schema-level (часть Schema metadata, e.g. archetype-practice-list extension), не на block.
- Если first-class — расширить decomposition Rule 1 на time-cap extraction.

### case-positional-annotation-on-label `warm up for feet [ BEFORE RUN ]`

**Context**: 5 occurrences варианта raw `warm up for feet [ BEFORE RUN ]` (без двоеточия). Phase 1 дедуплицировал с canonical `warm up for feet:` (39 occurrences). `[ BEFORE RUN ]` — positional sequence indicator на label-level.

**Phase 4 treatment**:

- Phase 1 уже smoothed эти 5 случаев в один canonical Label.
- `[ BEFORE RUN ]` — positional annotation, аналог `[ before BAR DIPS complex ]` row-level annotation (Phase 3.1 §5).
- Phase 4 не финализирует — sequence annotation на label-level singleton (5 occurrences), low priority for first-class formalization.

**Эскалация Phase 5**: рассмотреть, нужно ли вообще persisting `[ BEFORE RUN ]` или вычитать как косметику. Возможна формализация Block.positional_hint? для presentation, но cardinality слишком низкая.

### case-day-notes-no-sample-evidence

**Context**: Phase 4 предлагает `Day.notes: string?` и `Session.notes: string?`, но в sample ни одного notes-occurrence нет.

**Phase 4 treatment**: оставлены как optional для completeness (coach-side free-text future feature).

**Эскалация Phase 5**: drop `notes` поля если main session посчитает их premature. Низкая стоимость удаления (опциональное nullable поле).

---

## 2. Open questions (для Phase 5)

### Q1: applicable_levels enforcement strength

Phase 4 ratified Option C (soft, advisory). Phase 5 / 6 решит:

- UI warning level — toast / banner / blocked dialog с override?
- API validation — strict reject, warning header, или silent accept?
- Default behavior at assign — auto-suggest matching levels, fall back to «all» если нет matching?

### Q2: label `applicable_levels` mutation policy

- Тренер меняет `applicable_levels` существующего Label с `[block]` → `[block, session]`. Existing block-assignments сохраняются?
- Тренер меняет с `[block, session]` → `[block]`. Существующие session-assignments — auto-removed, или manually unbound, или blocked migration?
- Phase 5 / 6 design decision.

### Q3: block-level intensity inheritance — partial override?

Phase 4 ratified: schema overrides block fully (no merge). Альтернатива: partial overlay (e.g., block задаёт `pace=easy`, schema overrides только `effort_percent`, pace inherits).

Sample evidence не различает — только 1 occurrence на block-level и 1 на schema-level, оба effort_percent. Phase 5 решит при росте sample.

### Q4: empty-body block — semantic placeholder vs accidental

5 из 6 occurrences empty-body — `CORE MUSCLES` без двоеточия на SATURDAY после PUMP SESSION. Stable pattern. Семантически — coach пишет название блока, но тело пустое (по контексту — coach подразумевает «делай CORE по своему усмотрению» или «forgot to fill»).

Phase 4 ratify: `schemas=[]` достаточно. Phase 5: добавить ли «placeholder explanation» поле / hint для coach UX? Или treat как 100% same as filled blocks с пустым body?

### Q5: implicit-блок presentation в UI

Modeling — `labels=[]` empty array. Presentation — UI рендерит как «Без названия» / null label / placeholder text?

Phase 5 / 6 decision. Не влияет на model.

### Q6: order semantics — sparse vs dense?

`order: integer` на Day / Session / Block — числовой sort key. Phase 4 не специфицирует:

- Sparse (allow gaps, e.g., 10/20/30 for easy insertion)?
- Dense (1, 2, 3, … always)?
- Persisted vs derived?

Не критично для Phase 4 semantics; Phase 6 (formalization) ratifies.

### Q7: Block.labels[] — set vs list semantics для duplicate detection

Phase 4 hierarchy.md ratify: «duplicate Label не может появляться дважды в одном `labels[]`». Phase 5 / 6 решает:

- Enforce database constraint (unique on (block_id, label_id))?
- Soft check в application layer?
- Allow дубликаты для exotic use case (один и тот же label дважды для emphasize)?

Sample не даёт evidence (нет дублей в composite inputs). Default — set semantics (no duplicates).

---

## 3. Эскалации в main session

1. **Pace label vs Intensity variant** (`case-pace-as-label-vs-intensity`): подтверждение Phase 4 decision (keep as label). Если main session захочет upgrade в Intensity variant сейчас, не дожидаясь Phase 5 — изменение в hierarchy.md §4 Variants + labels-catalog.md (drop `EASY PACE` из labels).

2. **Time-cap on label** (`PRACTICE [ 5-10 min ]`): принять или отвергнуть block-level time-cap как first-class attribute. Phase 4 рекомендует «не финализировать сейчас, эскалировать в Phase 5 при rocra sample». Если main session захочет ratify уже — добавить `Block.time_cap: TimeCap?` VO + extend Rule 1.

3. **Positional annotation on label** (`warm up for feet [ BEFORE RUN ]` variant): low-priority. Phase 4 эскалирует только из соображений completeness — Phase 1 уже smoothed.

4. **Multi-label semantics — confirm pure tagging** (no composition). Phase 4 ratify pure labeling/tagging. Main session: если есть intent composition («strength endurance + gymnastics семантически — это hybrid modality»), нужна другая axis модели (e.g., `Block.modality: Modality[]` first-class enum). Phase 4 recommends НЕ идти в эту сторону — labels достаточно для текущих use case.

5. **Day.notes / Session.notes** — drop или keep optional? Sample evidence: 0. Phase 4 keeps optional; main session может drop без потерь.

6. **applicable_levels enforcement** — soft (Option C) ratified. Если main session захочет strict (Option A) — переключение тривиальное (валидация в save vs warning в UI). Phase 4 рекомендует soft на основе user hint про единую библиотеку.

7. **Intensity scope hierarchy override semantics** (Q3): full override vs partial overlay. Phase 4 ratify full override (simpler). Main session может выбрать overlay при росте sample.

---

## 4. Summary

- **Ambiguous attribute decisions**: 4 documented (pace label/intensity, time-cap on label, positional on label, day.notes).
- **Open questions для Phase 5**: 7 (applicable_levels enforcement strength, mutation policy, intensity inheritance partial override, empty-body semantics, implicit-блок UI, order sparseness, set vs list для labels[]).
- **Эскалации в main session**: 7.
- **Critical для Phase 4 ratification**: ни одна. Все 4 заявленных composite inputs decompose без проблем; multi-label / implicit / empty-body / intensity scope — все ratified без блокирующих edge cases.
