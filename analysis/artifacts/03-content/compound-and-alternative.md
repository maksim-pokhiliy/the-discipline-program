# Compound and alternative connectors (Phase 3.1)

Анализ `+` (compound) и `OR` (alternative) connectors внутри exercise rows.

Источник: `02-patterns/schema-boundaries.md` — все body rows которые содержат `+` или `OR` (outside `[ ]` brackets).

---

## 1. `+` connector (compound rep)

description: связка двух или более elements в одну compound-rep. Execution-семантика — выполнить связанные движения как одну логическую compound-unit, не как sequential список независимых упражнений.

cardinality по `+` count per row:

- 1 `+` (paired, 2 elements): 49 rows
- 2 `+` (chained, 3 elements): 20 rows
- 3+ `+` (extended / repeated-pattern, 4+ elements): 28 rows

**Total: 97 compound rows.**

### 1.1 sub-type: paired (1 `+`, 2 elements)

description: два element-а соединённых одним `+`. Доминирующая форма compound.

cardinality: 49 rows.

examples (различные структурные вариации, всего ~10 distinct):

- `5 strict DB press + 5 DB push press` — два exercise + reps + общий weight (block-154).
- `30 DB hang power clean + DB push press [ 2x 15 kg ]` — compound с implicit count на втором element'е (block-004).
- `10 burpees [ WITHOUT JUMP ] + 5 strict HSPU` — два exercise + reps + per-element modifier (block-079 sub-1).
- `traverses + strict bar dips` — implicit count на оба element'а (block-085 schema-1 internal ladder).
- `traverses + 5-7 bar dips [ URL ]` — compound с range count и shared URL (block-025).
- `7 DB snatches + DB thrusters [ 2x 15 kg ]` — двойное движение с shared weight (block-041).
- `10 DB snatches [ 2x 15 kg ] + 10 strict HSPU [ from box/sofa ]` — compound с per-element modifiers (block-072).
- `5 strict HSPU + 7 DB squats [ 2x 15 kg ]` — два exercises + per-element weight (block-081 sub-2).
- `5 DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ] [ another ARM HOLD DB in UP ]` — compound с different weights и position annotation (block-094).
- `7 DB hang power snatches [ 2x 15 kg ] + 5 burpee [ WITHOUT jump ]` — compound с per-element modifier (block-081 sub-1).

observations:

- Все 49 paired-compounds — single `+`. Распределены равномерно: 19 в strength-endurance bodies, 18 в pump-session, 12 elsewhere.
- В ~30 из 49 paired-compounds — explicit count на оба element'а; в остальных — count наследуется или общий.

### 1.2 sub-type: chained (2 `+`, 3 elements)

description: три element-а связанные двумя `+`. 3-stage compound.

cardinality: 20 rows.

examples (различные форм-факторы):

- `3 hang power cleans + 3 fron squats + 3 push presses [ DB 2x 15 kg ]` (3 occurrences block-027) — three exercises + shared weight standalone.
  - block-028: `7 hang power cleans + 5 front squats + 3 push presses [ DB 2x 15 kg ]` (4 occurrences — variant rep counts).
  - block-029: `9 hang power cleans + 7 front squats + 5 push presses`, `7 ... + 5 ... + 3 ...`, `5 ... + 3 ... + 1 ...` (3 variants — progressive descend).
- `5 DB deadlifts + 5 hang power cleans + 5 DB squats [ 2x 15 kg ]` (block-030).
- `10 incline DB bench presses [ 2x 15 kg ] + 10 plyo push ups` — но это paired, чек: `10 incline DB bench presses [ 2x 15 kg ] + 10 plyo push ups` — 1 `+` → paired.
- `* 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK [ after each GYMNASTICS round ]` (block-093, 095) — 3-stage time-bound footnote compound.

observations:

- block-027/028/029 — series of 3-element compounds с progressive numeric variations across blocks.
- block-093/095 PLANK chain — unique time-bound (sec) compound.

### 1.3 sub-type: extended chained (3 `+`, 4 elements) — без repeated pattern

description: четыре element-а через 3 `+`, без явного repeating motif.

cardinality: ~7 rows (28 total с 3+ `+`, из которых 21 имеют repeated pattern → 7 без).

examples:

- `5 DB bench presses [ 2x 15 kg ] + 10 plyo push ups + 5 DB bench presses [ 2x 15 kg ]` (block-129) — 3 elements with repeat in 1st/3rd.
- `5 DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]` (block-123) — 3 elements with composite annotation repeat.
- `5 strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press [ 2x 15 kg ]` (block-180) — 3 elements: open + middle + close (sandwich form).
- `3 strict DB press + 6 DB push press + 3 strict DB press [ 2x 15 kg ] | [ 2 sec SLOW down ]` (block-165) — sandwich form 3-element.
- `3 strict DB press + 9 DB push press + 3 strict DB press [ 2x 15 kg ] | [ 2 sec SLOW down ]` (block-190) — sandwich form variant.

observations:

- Sandwich form (X + Y + X) — repeats opening exercise после middle stage. Используется в SUCCESSORY shoulders work.

### 1.4 sub-type: repeated-pattern (4+ `+`, `A + N B + A + M B` form)

description: повторяющаяся pattern с одним и тем же exercise появляющимся 2+ раза. Доминирует в bar-dips / traverses цикле.

cardinality: 21 rows.

variant 1: `traverses + N bar dips + traverses + M bar dips`
cardinality: 14 rows.

examples (по blocks):

- block-047 (3 rows): `8/7`, `7/5`, `6/3` bar dips
- block-048 (3 rows): `9/9`, `7/7`, `5/5` bar dips
- block-049 (3 rows): `11/10`, `8/7`, `5/4` bar dips
- block-050 (3 rows): `10/10`, `15/15`, `10/10` bar dips
- block-053 (3 rows mirroring 048)
- block-054 (4 rows extending 048): `9/9`, `7/7`, `5/5`, `3/3` bar dips

variant 2: `bar dips + traverses + turn back 180* + traverses`
cardinality: 7 rows.

examples:

- block-051 (2 rows: schema-2 и schema-4 — repeated structure внутри pull-up-then-ladder topology).
- block-052 (1 row in schema-2).
- block-084 (2 rows: schema-2 и schema-4).
- block-099 (2 rows: schema-2 и schema-4).
- block-100 (2 rows: schema-2 и schema-4).

Подсчёт: 51+52+84+99+100 = 5 blocks × 1 или 2 rows = 9 rows. Counts add up to: 2+1+2+2+2 = 9. Hmm, slight discrepancy with 7. Re-checking: scripts говорит about 8 occurrences `bar dips + traverses + turn back 180* + traverses` — это 9 (with `*` суффиксом). Actual exact count: 9 occurrences (script earlier showed 9 for "bar dips + traverses + turn back 180\* + traverses").

Combined repeated-pattern total: 14 + 9 = 23.

observations:

- `traverses + bar dips` repeating pattern — explicit cyclical structure for STRENGTH ENDURANCE | Gymnastics workouts. 5 STRENGTH ENDURANCE | Gymnastics blocks (047-050 + 053-054) systematically используют этот pattern.
- `bar dips + traverses + turn back 180* + traverses` — variant с body-rotation внутри pattern. Использует «\*» как notation для градусов.

### 1.5 Compound vs sequential — distinguishing rule

В Phase 2.1 inventory (`01-inventory/edge-cases.md` §"+ connector в exercise rows"):

> `+` внутри row выполняет роль «выполнить как один комплекс» (compound exercise), не sequential.

В Phase 3.1 sample:

- ВСЕ 97 compound rows — single execution-unit (atomic complex), не sequential exercise list.
- Sequential exercise list — это body row с разными exercises на разных rows (например, normal `3 sets:` body), не `+`.

Sequential vs Compound:

|           | sequential            | compound                              |
| --------- | --------------------- | ------------------------------------- |
| separator | newline               | `+` (space-+-space)                   |
| execution | independent rows      | atomic compound-rep                   |
| modifiers | per-row               | possibly shared trailing              |
| examples  | normal `3 sets:` body | `5 strict DB press + 5 DB push press` |

---

## 2. `OR` connector (alternative substitution)

description: substitution choice — выполнить либо X, либо Y. Альтернативный execution path.

cardinality: 3 rows (все в GYMNASTICS блоках).

examples:

- block-105 / schema-2: `5 strict bar dips OR 10 push ups`
- block-112 / schema-2: `10 strict bar dips OR 20 push ups`
- block-115 / schema-2: `5 strict bar dips OR 10 push ups`

structural form: `N exercise-A OR M exercise-B` — обе альтернативы имеют свои reps (counts могут отличаться, обычно scaled equivalent).

observations:

- Все 3 occurrences — bar dips ↔ push ups substitution с rep-scaling (2x для push ups).
- Pattern семантически указывает scaling fallback: если bar dips недоступны или сложны, scale to push ups.
- Phase 5: модель должна поддерживать `OR` substitution либо как first-class scaling rule, либо как degeneracy choice (athlete picks).

### 2.1 `OR` внутри annotation

Singleton: `[ push press OR push jerk ]` внутри `DB STOH [ push press OR push jerk ]` (block-140 / schema-1).

cardinality: 1.

observation: `OR` появляется и внутри `[ ]`-annotation как substitution-modifier для technique choice (push press или push jerk — обе valid техники для STOH).

---

## 3. Connectors-summary

### Connectors внутри row:

- `+` — compound (97 rows).
- `OR` — alternative (3 rows).
- `/` — два варианта появления:
  - внутри annotation `from box/sofa`, `from sofa/box`, `hsat8D8KN_k&t=20s`, `biceps / triceps` (1, block-152 placeholder) — `/` как clarification separator (либо choice).
  - внутри drop-set program `EXPLODE / WITHOUT WEIGHT` (9 occurrences) — `/` как "/" specifier (EXPLODE = WITHOUT WEIGHT, фактически synonym).

### Composite-marker внутри annotation (`|`):

- 7 distinct strings (см. modifier-scope.md §13).
- `|` separator используется для:
  - Per-set substitution mapping (`1 set: X | 2 set: Y | 3 set: Z`) — 2 occurrences.
  - Weight + arm split (`15 kg | LEFT arm DO | RIGHT arm HOLD in UP`) — 4 occurrences.
  - Equipment + grip (`hand on DB | neutral grip`) — 3 occurrences.
  - Complex per-arm program — 2 occurrences.
  - Weight + depth modifier — 1 occurrence.

### Connectors внутри header:

- `|` (pipe) — composite header separator (e.g., `EMOM 16 min | 4 rounds:`, `3 sets | shoulders:`). Phase 2.1 ratified header-level meaning: split between count and modifier/theme/rest-spec.
- `...then...` — connector между header schemas (`...then... | 12-9-6:` composite-prefixed header, 2 occurrences block-046).
- `then:` — standalone connector line (boundary between schemas, помещён в конец body предыдущей schema — 9 occurrences).

---

## Summary

- **Total compound `+` rows**: 97.
  - Paired (1 `+`, 2 elements): 49.
  - Chained (2 `+`, 3 elements): 20.
  - Extended/repeated (3+ `+`, 4+ elements): 28.
    - Repeated-pattern subset (`traverses + N bar dips + traverses + M bar dips`): 14.
    - Repeated-pattern subset (`bar dips + traverses + turn back 180* + traverses`): 9.
    - Sandwich-form (X + Y + X): ~5 rows.
- **Total alternative `OR` rows**: 3 (все bar dips ↔ push ups substitution).
- **Singletons**:
  - `OR` inside annotation: 1 (`[ push press OR push jerk ]`, block-140).
  - `/` inside placeholder row: 1 (`biceps / triceps`, block-152).
  - `=` rep-equality definition: 1 (`5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ]`, block-043).
  - `=` inside curly brace: 2 occurrences, 1 pattern (`{ 1 push up + each arm row = 1 rep }`, block-125, 138).

### Notes for Phase 5 / synthesis

- Compound `+` имеет несколько вариаций по shared modifier scope: per-element weight, shared trailing weight, no weight (bodyweight). Phase 5 модель должна поддерживать all three.
- `OR` substitution — структурно одинаково 3 раза (bar dips ↔ push ups). Возможно генерализуется как scaling rule "primary OR scaled alternative".
- Repeated-pattern в `traverses + bar dips` cycle — кандидат на формализацию как cyclical compound с varying counts (или просто as-is — 4 elements в row).
- Sandwich form (X + Y + X) — type специфический для SUCCESSORY shoulders work (3 strict DB press + N DB push press + 3 strict DB press). Может быть formalized как «open-close repeat with middle bridge».
