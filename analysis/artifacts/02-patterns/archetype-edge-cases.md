# Phase 2.2 edge cases

Спорные mappings, singletons, ambiguous archetypes и эскалации в main session.

Phase 2.1 ratified-эскалации (time-window, alternation, 30-HSPU-TOTAL preface, headerless-without-markers) разрешены в Phase 2.2 созданием конкретных архетипов; их структурный фит описан ниже + флагуются как singleton/block-singleton где уместно.

## Singletons (cardinality = 1)

### archetype-ladder-vertex-down-pyramid (1 schema, block-098)

context: `11-9-7-9-11:` — единственный atomic schema с symmetric vertex-down pyramid header в sample.
adjacency: GYMNASTICS block, body=2 exercises (pull-ups + bar dips) + per-round Cossacs squat footnote.
escalation: Phase 5 — оставлять как отдельный архетип или сливать с archetype-ladder-descending (на правах "asymmetric variant")? Структурно — pyramid НЕ ladder-descending; sequence не убывает строго. Решение Phase 2.2: отдельный архетип.

### archetype-ladder-spike (1 schema, block-106)

context: `10-8-6-4-10:` — descending sequence с финальным spike обратно к стартовому значению. Singleton.
adjacency: GYMNASTICS block, body=pull-ups + bar dips + 30 strict T2B trailing.
escalation: Phase 5 — отдельный archetype или возможная опечатка в источнике (могло быть `10-8-6-4-2:`)? Phase 1 edge-cases опечаток в этом блоке не фиксировал; Phase 2.1 сохранил буквально. Решение Phase 2.2: отдельный singleton archetype.

### archetype-amrap-flat (1 schema, block-078)

context: `AMRAP 12 min:` — единственный AMRAP в sample.
adjacency: (implicit) block с paired BSS schema (named-exercise-program).
escalation: AMRAP — устоявшийся paradigm в CrossFit-литературе. Singleton в sample, но не редкость в реальности. Решение Phase 2.2: первоклассный архетип, признак "low frequency in this sample, but established paradigm globally".

### archetype-composite-rolling-rounds (1 schema, block-144)

context: `Every 4th min new round | x4 rounds | 16 min` — header описывает rolling-EMOM cadence (rolling start каждые N минут). Singleton.
escalation: Phase 5 — отдельный архетип vs slip в archetype-emom-nested-per-minute как notation variant без sub-min дискретизации? Структурно — без sub-schemas, header полностью описывает cadence. Решение Phase 2.2: отдельный composite singleton.

### archetype-composite-intervals-work-rest-fixed (1 schema, block-142)

context: `3x 3 min WORK | 2 min REST` body=fixed exercises (3 HSPU + 6 cleans + 9 squats). Singleton.
escalation: Phase 5 — отделять от archetype-composite-intervals-work-rest-progressive (140, 141)? Они отличаются telementsh body shape: 142 — фиксированные reps, 140/141 — progressive ladder с "MAX ROUNDS in remaining time" notation + EXAMPLE annotation. Phase 2.2 решает: отдельный архетип, потому что body shape (fixed vs progressive) структурно различен.

### archetype-composite-intervals-on-off-max-tail (1 schema, block-143)

context: `5x 2 min ON | 2 min OFF` body=10 squats + 10 power cleans + `MAX strict HSPU in remaining time`. Singleton.
escalation: Phase 5 — отделять от progressive-ladder (140, 141) или fixed-body (142)? Здесь `MAX <exercise> in remaining time` tail — другая форма max-work из progressive variant (где max — это rounds через progressive sequence). Структурно: 143 — fixed reps + max-exercise tail; 140/141 — max-rounds через progressive. Решение Phase 2.2: отдельный архетип.

### archetype-parallel-pyramids (1 schema, block-087)

context: 2 параллельных symmetric pyramid sequences (`3-6-9-12-9-6-3:` ×2). Singleton.
escalation: Phase 5 — оставлять отдельный архетип или сливать с archetype-parallel-ladders-descending как pyramid-variant? Структурно: stepping не strict-descending, pyramid симметричен. Решение Phase 2.2: отдельный архетип (paired-with parallel-ladders-descending).

### archetype-practice-list (1 schema, block-146)

context: 2 строки `Exercise name [ URL ]` без rep counts. Practice-mode body.
escalation: Phase 5 — отдельный архетип или extension archetype-flat-list-headerless (с убранными reps)? Решение Phase 2.2: отдельный архетип, потому что отсутствие reps — структурная характеристика body. Phase 4 / 5 решит финальный фит.

## Block-singletons (cardinality = 2 schemas в одном block-instance)

### archetype-alternating-sets (block-009)

context: 2 schemas `1st | 3rd | 5th sets:` + `2nd | 4th | 6th sets`. Block-level alternation между schemas.
escalation: ratified в Phase 2.1 (case-alternation). Phase 2.2: 2 schemas → 1 archetype, structural connection "выполняется в чередовании" хранится на block-level (не как nested и не как composite). Main session может пожелать переоформить как nested-implicit-6-sets с 2 sub-schemas.

### archetype-time-window-outer (block-003)

context: 2 nested schemas с outer time-range header (`0:00-10:00 min:` / `10:00-20:00 min:`).
escalation: ratified в Phase 2.1 (case-time-window). Phase 2.2: отдельный archetype singleton (per block). Main session may merge into general nested-outer-container с time-range как notation variant.

### archetype-parallel-ladders-mixed-direction (block-005)

context: 2 headerless schemas, каждая содержит mixed-direction parallel ladders (descending + ascending параллельно).
escalation: ratified в Phase 2.1 (case-rest-split-parallel). Phase 2.2: отдельный archetype (paired-with parallel-ladders-descending). Main session может пожелать сливать с general parallel-ladders archetype.

## Ambiguous mappings

### block-019 / schema-1 — composite с `...then N rounds:` continuation

context: header `3 sets | 2 min rest in between sets:` + body содержит `20 burpees / ...then 2 rounds: / 5 power cleans / 3 HSPU / 5 front squats / 3 HSPU`.
options:

- (a) archetype-composite-rounds-with-rest (current decision)
- (b) archetype-composite-intervals-then-rounds (header не `INTERVALS`, но body имеет тот же `...then N rounds:` continuation, что и 015/016/039)
  decision: (a). Header form `N sets | rest:` идентична другим composite-rounds-with-rest (017/040/041/043/044); continuation `...then N rounds:` per Phase 2.1 — body-level, не выделяется в отдельный архетип. Архетип-в-архетип расщепление было бы overkill.
  implications: Если main session предпочтёт (b) — переотнести 019 в intervals-then-rounds, увеличив cardinality до 4 (3 + 019).

### block-085 / schema-2 vs block-088 / schema-1

context:

- block-085 schema-2: `3 sets:` body=2 exercises (DB A-push ups + pull overs) — pump-style schema внутри Basic GYMNASTICS блока
- block-088 schema-1: `5 sets:` body=2 exercises (bar dips + C2B pull-ups) — pure gymnastics body
  оба → archetype-n-rounds.
  decision: Phase 2.2 не разделяет по семантике (pump-like vs gymnastics-pure body) — это контекст использования, не структура. Оба остаются в archetype-n-rounds. Phase 3 / Phase 4 будут анализировать exercise-level semantics.

### block-027/028/029 — homogeneous progressions блоков подряд

context: 3 atomic schemas с idential header `3 sets:` и идентичной body structure (Jumping Jacks + DB hang power cleans + front squats + push presses sequence), различающиеся только rep counts (21→27→27 jacks, etc).
decision: все три → archetype-n-rounds. Inter-block progression (week-over-week intensification) — Phase 4+, не Phase 2.2.
implications: Если main session захочет formalize "block-instance series" — оставлять как 3 separate schemas в одной archetype-cell мапинга.

### Trailing-T2B inclusion в ladder-descending body

context: ~15 schemas с trailing `30 strict T2B` или `35 strict T2B` в body предыдущей ladder schema (case-trailing-t2b per Phase 2.1).
decision: T2B хранится inline в body schema-N, не выделен в отдельную headerless schema. Archetype assignment остаётся ladder-descending (или соседствующий — pull-ups-dips-cycle для 053/054).
implications: Phase 5 — модель должна поддерживать "trailing finisher exercise" как body property, не как separate schema/block.

### block-073 — DB hang snatches asymmetric body внутри n-rounds

context: `4 rounds:` body=`7 DB hang snatches [ LEFT ARM ] / 7 OH DB lunges [ LEFT ARM ] / 3 strict HSPU / 7 DB hang snatches [ RIGHT ARM ] / 7 OH DB lunges [ RIGHT ARM ] / 3 strict HSPU / - 2 min rest -`.
decision: archetype-n-rounds. Asymmetric LEFT/RIGHT body — modifiers, не structural difference. Same archetype.

### block-027 / block-028 / block-029 series + block-030

context: 3 schemas `3 sets:` + 1 schema `3 sets:` с `...THEN 2 rounds:` body continuation (block-030). Все 4 → archetype-n-rounds.
decision: continuation `...THEN 2 rounds:` — body-level, не делает schema другим архетипом. Phase 2.1 ratified continuation as same-schema. Phase 2.2 — same archetype.

## Архетипы которые трудно отделить

### archetype-flat-list-headerless vs archetype-pull-ups-dips-cycle

context: оба — headerless без явных `X-Y-Z:` markers, body=exercise list. Разница:

- flat-list: generic exercise sequence, разные exercises на каждой row
- pull-ups-dips-cycle: cyclical structure `pull-ups + traverses+dips` alternating с decreasing reps, без markers (но pattern явно повторяется)
  decision: Phase 2.2 разделяет, потому что cyclical pattern в pull-ups-dips имеет implicit ladder-structure без markers (это compensation за отсутствие `X-Y-Z:` notation в STRENGTH ENDURANCE | Gymnastics блоках). Pure flat-list (block-004, 033, 034 и т.п.) не имеет такого pattern.
  escalation: Main session может пожелать сливать в один archetype-flat-list с подпометкой "implicit cyclical" — это compaction решение.

### archetype-flat-list-headerless vs archetype-placeholder-body

context: оба — headerless без markers. Разница:

- flat-list: concrete exercises с rep counts
- placeholder-body: placeholder text ("ANY exercise for ABS", "biceps / triceps") + optional concrete row
  decision: Phase 2.2 разделяет, потому что absence of rep counts + presence of placeholder phrase = structural feature, не decoration. Phase 4 решит как formalize placeholder semantics.

### archetype-practice-list vs archetype-flat-list-headerless

context: оба headerless, body=exercise list. Разница:

- practice-list: 1-2 строки, exercises БЕЗ reps, только name + URL (block-146)
- flat-list: 3-8 строк с rep counts на каждой
  decision: Phase 2.2 разделяет (отсутствие reps — structural). Practice-list singleton в sample.

### archetype-url-only-body vs archetype-practice-list

context: оба headerless без rep counts. Разница:

- url-only: body — только URL(s), без exercise names (block-147, 149)
- practice-list: exercise names + URLs (block-146)
  decision: Phase 2.2 разделяет. Singletons / mini-archetypes на 1-2 schemas; могут быть merged в general "reference-body" archetype в Phase 5.

### archetype-composite-intervals-work-rest-progressive vs work-rest-fixed vs on-off-max-tail

context: 3 разных subarchetypes composite-intervals с work/rest cadence. Различаются body shape:

- progressive: `MAX ROUNDS in remaining time: <progressive sequence>` + EXAMPLE annotation
- fixed: simple exercise list с фиксированными reps
- on-off-max-tail: exercise list + `MAX <exercise> in remaining time` tail
  decision: Phase 2.2 разделяет на 3 архетипа, потому что body shape — часть structural signature. Main session может пожелать сливать в один "composite-intervals-work-rest" с body-shape-variant notation.

## Headerless-без-markers — финальное распределение

Phase 2.1 escalated case-pure-exercise-list-no-markers; Phase 2.2 распределил эти schemas по 6 разным архетипам:

- archetype-flat-list-headerless (10): block-004, 007, 033, 034, 035, 036, 055, 145, 150, 151
- archetype-pull-ups-dips-cycle (6): block-047, 048, 049, 050, 053, 054
- archetype-run-distance (11): block-060, 061, 062/1, 063/1, 064, 065, 066, 068, 075/1, 076/1, 083
- archetype-placeholder-body (6): block-152, 193, 194, 195, 196, 197
- archetype-practice-list (1): block-146
- archetype-url-only-body (2): block-147, 149

Это полностью покрывает 36 headerless schemas без явных X-Y-Z markers (отсюда: 10+6+11+6+1+2 = 36; остальные 37 headerless top-level имеют либо X-Y-Z markers (parallel-ladders/pyramids/mixed/pull-ups-cycle in part) либо connectors/TOTAL markers (single-line variants)).

## Эскалации в main session

1. **Singleton-archetypes consolidation (Phase 5)**: оставить 8 singleton-archetypes (vertex-down-pyramid, spike, amrap-flat, rolling-rounds, work-rest-fixed, on-off-max-tail, parallel-pyramids, practice-list) или мерджить как notation variants более общих? Phase 2.2 решает: keep separate, structural sigs distinct.

2. **Block-singletons (alternating, time-window, mixed-direction parallel)**: оставить как первоклассные архетипы или представлять как block-level pattern (3 архетипа = block-instance-templates)? Phase 4 / Phase 5 design decision.

3. **archetype-n-rounds dominance**: 129 из 337 schemas (~38%) попадают в один archetype. Не упустилась ли substructural разница? Notation variants внутри (rounds vs sets vs `1 set:` vs `3x 10 reps:` vs `3 sets [ BEFORE RUN ]`) — действительно equivalent execution-wise? Phase 5 / synthesis может пожелать decomposition.

4. **archetype-n-rounds vs archetype-named-themed-sets**: `3 sets | shoulders:` (named-themed-sets) и `3 sets:` (n-rounds) — отличаются только наличием theme в header. Phase 2.1 ratified kind разделение (named vs atomic), Phase 2.2 — два разных архетипа. Main session: оставлять разделение или merger как notation variant n-rounds?

5. **EMOM mixed grouping (079, 081, 082)**: внутри archetype-emom-nested-per-minute есть semantic-distinct sub-patterns:

   - uniform per-minute: block-080 (1 min, 2 min, 3 min, 4 min)
   - mixed grouped: block-079 (1st & 2nd min, 3 & 4 min), block-081 (1 min, 2 min, 3 & 4 min), block-082 (1st & 2nd min, 3 min)
     Сейчас все 6 в одном архетипе. Main session: разделять на uniform/grouped или сохранять?

6. **Composite-rounds-with-rest vs composite-intervals-then-rounds**: разница только в наличии `...then N rounds:` continuation в body. Phase 2.2 — два архетипа. Возможно: один общий "composite-rounds-with-rest" с notation variant "with-then-rounds-continuation"?

## Summary

- **Total archetypes**: 33
- **By family распределение**:
  - Rounds/Sets: 2 (n-rounds, alternating-sets)
  - Ladder: 7 (descending, ascending, vertex-down-pyramid, spike, parallel-ladders-descending, parallel-ladders-mixed-direction, parallel-pyramids)
  - Time-cap: 4 (amrap-flat, emom-nested-per-minute, emom-sub-minute-slot, time-window-outer)
  - Composite: 6 (rounds-with-rest, intervals-then-rounds, intervals-work-rest-fixed, intervals-work-rest-progressive, intervals-on-off-max-tail, rolling-rounds)
  - Nested non-EMOM/non-time-window: 3 (rounds-over-rounds, rounds-over-parallel-ladder, composite-rounds-over-ladder)
  - Named: 2 (themed-sets, exercise-program)
  - Single-line headerless: 3 (with-then-connector, bare, total-counter)
  - Flat/Parallel/Modality: 6 (flat-list, pull-ups-dips-cycle, run-distance, placeholder-body, practice-list, url-only-body)
- **Singletons (cardinality=1, only 1 schema)**: 8
- **Block-singletons (cardinality=2, обе schemas в 1 blocke)**: 3
- **Ambiguous mappings разрешённых**: 6 (block-019 then-rounds composite vs intervals, 085/088 pump-style vs gymnastics, 027/028/029 series, trailing-T2B inclusion, 073 asymmetric, 030 continuation)
- **Эскалации в main session**: 6 (singleton consolidation, block-singletons fit, n-rounds dominance, n-rounds vs named-themed-sets, EMOM mixed grouping, composite-rounds-with-rest vs intervals-then-rounds)

### Coverage verification

- 198 block-instances обработано (включая 3 с empty body — без schemas)
- 337 schemas распределены ровно в один архетип (no edge=true, no unmapped)
- 0 schemas требуют kind=edge с обоснованием — Phase 2.1 разрешил все спорные cases per ratified-эскалейшнам
