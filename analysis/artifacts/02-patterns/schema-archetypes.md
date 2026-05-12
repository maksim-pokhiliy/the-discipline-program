# Schema archetypes (Phase 2.2)

Каталог структурных архетипов schemas, выведенных из 337 schemas Phase 2.1 разметки (312 top-level + 25 sub-schemas в nested).

Архетип — класс эквивалентности schemas по форме исполнения: kind + форма header + body layout. Параметры (числа, упражнения, modifiers) варьируются внутри архетипа, инварианты — нет.

Семантика (силовая / кардио / гимнастика / yoga) НЕ участвует в группировке: только структура. Связи между архетипами (specialization-of / paired-with / continuation-of / extension-of) фиксируются явно.

Source-reference: `schema-boundaries.md` → block-NNN / schema-N. Sub-schemas — `block-NNN / schema-N / sub-K`.

---

## Rounds/Sets family

### archetype-n-rounds

structural-invariant:

- kind: atomic
- header: единый count + `:` или count + annotation. Notation variants:
  - `N rounds:` или `N-M rounds:` (`3 rounds:`, `3-5 rounds:`, `4-5 rounds:`)
  - `N sets:` или `N-M sets:` (`3 sets:`, `3-4 sets:`, `2 sets:` через nested-outer)
  - `1 set:` / `1 sets:` — single-pass variant (N=1, body с большим reps-count)
  - `3x 10 reps:` — count × reps variant
  - `3 sets [ ANNOTATION ]` — header с timing-аннотацией без `:` (block-062)
- body: 1..N exercise rows с rep counts + modifiers; опциональный trailing rest-marker (`- N min rest in between sets -`, `- rest until recovery -`).
  parameters:
- N (rounds/sets count), exact или range
- exercise list (упражнения + reps + modifiers)
- rest-spec (опционально, body-level annotation)
- body may contain `...THEN N rounds:` continuation per Phase 2.1 spec rule
  examples:
- block-001 / schema-1 (`3-5 rounds:` body=4 exercises with reps)
- block-022 / schema-1 (`3 sets:` body=5 exercises + 3 min rest)
- block-117 / schema-1 (`3 rounds:` body=4 PUMP exercises)
- block-148 / schema-1 (`3 sets:` warm-up shape)
- block-125 / schema-3 (`1 set:` single-pass с 30 reps)
- block-138 / schema-3 (`3x 10 reps:` count×reps variant)
- block-062 / schema-2 (`3 sets [ BEFORE RUN ]` annotated header)
- block-030 / schema-1 (`3 sets:` body содержит `...THEN 2 rounds:` continuation)
  cardinality: 129 (125 top-level + 4 sub в nested: блоки 003/schema-1/sub-1, 011/sub-1, 012/sub-1, 026/sub-1)
  related:
- extension-of: archetype-composite-rounds-with-rest (когда header расширяется до composite с rest-spec)
- continuation-of: archetype-composite-intervals-then-rounds (когда body содержит `...then N rounds:`)
  notes:
- Доминирующий архетип всего sample (~40% schemas).
- Notation variants однородны структурно: integer count + body-repetition. Phase 2.1 spec не отличает `rounds` от `sets` структурно — оба значат «повторить body N раз».
- Singletons-of-notation внутри: `1 set:` (block-125), `1 sets:` (block-126), `3x 10 reps:` (block-138), `3 sets [ BEFORE RUN ]` (block-062). Сохранены как notation variants, не отдельные архетипы.

### archetype-alternating-sets

structural-invariant:

- kind: atomic (×2 schemas в одном block-instance)
- header: `<set-enumeration> sets:` — перечисление через `|`, например `1st | 3rd | 5th sets:` + `2nd | 4th | 6th sets`
- body: exercise list, общий для всех перечисленных set-индексов
- pair: 2 atomic schemas, выполняемых в чередовании (odd/even sets)
  parameters:
- enumeration (какие set-индексы)
- exercise list per branch
- rest-spec (`- 90 sec rest in between sets -`)
  examples:
- block-009 / schema-1 (`1st | 3rd | 5th sets:` body=3 exercises)
- block-009 / schema-2 (`2nd | 4th | 6th sets` body=3 exercises с deficit HSPU variant)
  cardinality: 2 (block-009 only)
  related:
- paired-with: archetype-alternating-sets (две schemas всегда парные)
- specialization-of: archetype-n-rounds (логически outer = 6 sets, но Phase 2.1 ratified atomic, не nested)
  notes:
- Singleton block-level pattern. Per Phase 2.1 case-alternation решение: kind=atomic, `|` трактуется как enumeration set-индексов (не разделитель параметров).
- Структурная связь "выполняется в чередовании" хранится на block-level, не как kind=composite/nested.

---

## Ladder family

### archetype-ladder-descending

structural-invariant:

- kind: atomic
- header: `N1-N2-...-Nk:` где последовательность строго убывает (k=3..10)
  - Notation variants: bare `21-15-9:` / `10-8-6-4-2:` / `10-9-...-1:` (длинная); composite-prefix `...then... | 12-9-6:` (block-046, kind=atomic per Phase 2.1)
- body: одно упражнение или 2-3 row complex; опционально trailing footnote-annotation (`*100 single unders AFTER each set`, `30 strict T2B` trailing per Phase 2.1 case-trailing-t2b)
  parameters:
- steps (убывающая числовая sequence, длина 3-10)
- exercise (имя + modifiers + weights)
- annotations (footnote / per-round modifier)
  examples:
- block-006 / schema-2 (`15-12-9:` body=DB bench presses + row)
- block-051 / schema-2 (`12-9-6:` body=bar dips + traverses complex)
- block-071 / schema-1 (`30-20-10:` body=DB thrusters + snatches)
- block-089 / schema-2 (`5-4-3-2-1:` body=strict chin pull-ups + bar dips)
- block-091 / schema-1 (`10-9-8-7-6-5-4-3-2-1:` long 10-step descending)
- block-046 / schema-2 (`...then... | 12-9-6:` connector-prefixed notation variant)
- block-110 / schema-1 (`12-9-6:` GYMNASTICS context)
- block-003 / schema-2 / sub-1 (`15-12-9:` sub-схема внутри time-window outer)
- block-020 / sub-1 (`7-5-3:` sub-схема внутри composite-nested outer)
  cardinality: 24 (21 top-level + 3 sub: 003/2/sub-1, 020/sub-1, 021/sub-1)
  related:
- paired-with: archetype-ladder-ascending (часто соседствуют в block-099, block-100, block-084: одна schema descending, другая — ascending в том же blocke)
- specialization-of: archetype-parallel-ladders-descending (когда несколько ladder rows становятся headerless composite)
- continuation-of: archetype-single-line-with-then-connector (когда ladder следует после `then:` schema)
  notes:
- `...then... | N-M-K:` (block-046) — единственный notation-variant с composite-style prefix. Per Phase 2.1: connector в header не делает kind=composite, основная нагрузка остаётся ladder-descending.
- Long-sequence variant: block-091 (10 ступеней).

### archetype-ladder-ascending

structural-invariant:

- kind: atomic
- header: `N1-N2-...-Nk:` где последовательность строго возрастает (k=3..5)
- body: одно упражнение или compound row; опционально trailing T2B per case-trailing-t2b
  parameters:
- steps (возрастающая sequence)
- exercise
  examples:
- block-032 / schema-1 (`3-6-9-12-15:` body=DB snatch + squats + footnote)
- block-084 / schema-4 (`9-12-15:` mirror partner для schema-2 descending)
- block-099 / schema-4 (`7-9-11:` mirror partner для schema-2 `11-9-7:`)
- block-100 / schema-4 (`9-12-15:` mirror partner для schema-2 `15-12-9:`)
- block-103 / schema-2 (`1-2-3-4-5:` body=pull-ups + bar dips + 30 T2B)
  cardinality: 5
  related:
- paired-with: archetype-ladder-descending (в одном blocke с partner-mirroring: 084, 099, 100 содержат descending + ascending пару через single-line connector)
- specialization-of: общая ladder-семья (descending и ascending как 2 направления)

### archetype-ladder-vertex-down-pyramid

structural-invariant:

- kind: atomic
- header: `N1-N2-...-Nmid-...-N2-N1:` — симметричная sequence с минимумом в центре (descending→ascending pyramid)
- body: 2-3 exercise rows + опциональная per-round footnote
  parameters:
- pyramid steps (симметричная sequence)
- exercises
  examples:
- block-098 / schema-1 (`11-9-7-9-11:` body=strict pull-ups + bar dips + `10 Cossacs squats AFTER EACH GYMNASTICS set` footnote)
  cardinality: 1 (singleton)
  related:
- specialization-of: archetype-ladder-descending (как комбинация descending + ascending mirror)
- paired-with: archetype-parallel-pyramids (тоже pyramid, но parallel headerless)
  notes:
- Singleton — единственный atomic с pyramid-формой в sample. Если расширять sample — кандидат на extraction в первоклассный paradigm.

### archetype-ladder-spike

structural-invariant:

- kind: atomic
- header: descending sequence + последний step = первому или upper-spike (`N-...-K-Nupper:` или asymmetric jump)
- body: 2 exercise rows + опциональный trailing T2B
  parameters:
- spike pattern (descending body + jump-up tail)
- exercises
  examples:
- block-106 / schema-1 (`10-8-6-4-10:` body=strict pull-ups + bar dips + 30 strict T2B)
  cardinality: 1 (singleton)
  related:
- specialization-of: archetype-ladder-descending (как descending с anomalous tail-step)
  notes:
- Singleton — атипичный pattern. Возможно — опечатка в источнике (могло быть `10-8-6-4-2:` без spike). Phase 2.1 сохранил буквально.

### archetype-parallel-ladders-descending

structural-invariant:

- kind: headerless (top-level) или headerless sub (внутри nested outer)
- header: null
- body: 2..3 пары `(numerical-descending-sequence: + exercise-row)`, исполняемых параллельно (по правилу EXAMPLE-аннотации каноничного block-037 — round 1 = первые ступени из каждой ladder, round 2 = вторые, и т.д.)
- может содержать trailing footnote-annotations (`30 strict T2B`, `* 30 sec PLANK + ...`, `[ EXAMPLE: 36... 18... 4... ]`)
  parameters:
- ladders count (2..3)
- per-ladder steps (descending sequences)
- per-ladder exercise
- trailing annotations
  examples:
- block-037 / schema-1 (canonical, 3 parallel ladders: `36-28-20`/snatches + `18-14-10`/squats + `4-3-2`/HSPU)
- block-038 / schema-1 (3 parallel ladders, mirrors 037)
- block-008 / schema-1 (2 parallel: `18-14-10`/snatches + `9-7-5`/HSPU)
- block-085 / schema-1 (2 parallel: `11-9-7-5-3`/pull-ups + `22-18-14-10-6`/traverses+dips)
- block-107 / schema-1 (2 parallel + 30 strict T2B trailing)
- block-014 / schema-1 (`20-16-12` + `5-4-2` + EXAMPLE annotation)
- block-010 / sub-1 (sub-схема внутри `2 sets:` nested outer)
- block-013 / sub-1 (sub-схема внутри `2-3 sets:` nested outer)
- block-023 / sub-1 (sub-схема внутри `3 sets:` nested outer)
  cardinality: 15 (12 top-level + 3 sub-schemas)
  related:
- specialization-of: archetype-ladder-descending (composite-form: несколько ladders вместо одного)
- paired-with: archetype-parallel-ladders-mixed-direction, archetype-parallel-pyramids (parallel-ladder family с разными stepping patterns)
- extension-of: archetype-nested-rounds-over-parallel-ladder (когда parallel-ladder становится inner-схемой nested outer)
  notes:
- Каноничный prototype — block-037 с EXAMPLE annotation, явно объясняющей parallel execution.
- 4 occurrences с trailing T2B (053-style без X-Y-Z markers — нет, T2B-trailing встречается в 107/108).
- Все ladders в архетипе — descending. Pyramid-стиль (087) и mixed-direction (005) — отдельные архетипы.

### archetype-parallel-ladders-mixed-direction

structural-invariant:

- kind: headerless
- header: null
- body: 2 ladder pairs где первая descending, вторая ascending (или иной mixed pattern), параллельно
- может содержать trailing rest-marker
  parameters:
- per-ladder direction + steps + exercise
- rest-marker
  examples:
- block-005 / schema-1 (`12-9-6:`/DB Thrusters + `6-9-12:`/DB hang power cleans + `- 5 min rest -`)
- block-005 / schema-2 (mirror: `12-9-6:`/DB hang power cleans + `6-9-12:`/DB Thrusters)
  cardinality: 2
  related:
- specialization-of: archetype-parallel-ladders-descending (с инверсией одной из ladders)
  notes:
- Phase 2.1 case-rest-split-parallel: rest-marker делит блок на 2 schemas. Каждая половина — самостоятельная mixed-direction parallel-ladder composition.

### archetype-parallel-pyramids

structural-invariant:

- kind: headerless
- header: null
- body: 2 параллельные symmetric pyramid sequences (`N1-...-Nmid-...-N1:` одинаковые ступени)
  parameters:
- pyramid steps
- per-row exercise
  examples:
- block-087 / schema-1 (`3-6-9-12-9-6-3:` pull-ups + `3-6-9-12-9-6-3:` traverses+bar dips, два параллельных pyramid)
  cardinality: 1 (singleton)
  related:
- specialization-of: archetype-parallel-ladders-descending (pyramid вместо strict-descending stepping)
- paired-with: archetype-ladder-vertex-down-pyramid (та же pyramid-форма, atomic вместо parallel headerless)
  notes:
- Singleton. Identical ladder numbers (case-same-ladder-numbers per Phase 2.1).

---

## Time-cap family

### archetype-amrap-flat

structural-invariant:

- kind: atomic
- header: `AMRAP N min:` (count of minutes как time-cap)
- body: optional intensity-modifier `[ N% Effort ]` + 2-4 exercise rows с rep counts
  parameters:
- N (минуты)
- effort-modifier
- exercises
  examples:
- block-078 / schema-1 (`AMRAP 12 min:` body `[ 75-80% Effort ]` + 3 exercises)
  cardinality: 1 (singleton)
  related:
- paired-with: archetype-emom-nested-per-minute (соседний time-cap paradigm с минутной дискретизацией)
- specialization-of: archetype-n-rounds (с time-cap вместо count-cap — но Phase 2.1 распознаёт по `AMRAP` keyword)
  notes:
- Singleton в sample. Если расширять — основной paradigm для conditioning sessions.

### archetype-emom-nested-per-minute

structural-invariant:

- kind: nested
- header (outer): `EMOM N min:` или composite-style `EMOM N min | M rounds:`
- sub-schemas: 2..4 atomic с header типа `K min:`, `Kst & Lnd min:`, `K & L min:`, описывающим минутные слоты (singleton или grouped minutes)
- может содержать trailing rest body в одной из sub-schemas (`- 3 min REST -`)
  parameters:
- N (общая длительность EMOM)
- M (rounds, если composite outer)
- sub-minute structure (singleton vs grouped)
- per-slot body
  examples:
- block-080 / schema-1 (`EMOM 16 min | 4 rounds:` outer, 4 sub: `1 min:` JJ, `2 min:` V-ups, `3 min:` MAX front squats, `4 min:` REST)
- block-081 / schema-1 (`EMOM 16 min | 4 rounds:` outer, 3 sub: `1 min:`, `2 min:`, `3 & 4 min:` grouped REST)
- block-079 / schema-1 (`EMOM 12 min:` outer, 2 grouped sub: `1st & 2nd min:`, `3 & 4 min:`)
- block-079 / schema-2 (mirror второго EMOM в том же blocke)
- block-082 / schema-1 (`EMOM 9 min:` outer, mixed: `1st & 2nd min:` + `3 min:`)
- block-082 / schema-2 (mirror)
  cardinality: 6 nested wrappers
  related:
- paired-with: archetype-emom-sub-minute-slot (sub-schemas)
- specialization-of: archetype-composite-rounds-with-rest (EMOM = композиция work-window + minute-cadence)
  notes:
- Per Phase 2.1 case-composite-vs-nested-for-EMOM-with-rounds: composite-style header `EMOM N min | M rounds:` всё равно nested, потому что есть sub-min markers.

### archetype-emom-sub-minute-slot

structural-invariant:

- kind: atomic (sub-schema внутри archetype-emom-nested-per-minute)
- header: minute-slot label:
  - singleton: `1 min:`, `2 min:`, ..., `N min:`
  - paired/grouped: `1st & 2nd min:`, `3 & 4 min:`
  - per Phase 2.1: всегда atomic
- body: 1..3 exercise rows с reps + modifiers, или single line `REST`, или single line `MAX <exercise> [ in remaining time ]`
  parameters:
- slot index/range
- body kind (work / rest / max-effort)
- exercise + reps
  examples:
- block-080 / schema-1 / sub-1 (`1 min:` / `25 jumping Jack's`)
- block-080 / schema-1 / sub-3 (`3 min:` / `MAX DB FRONT SQUATS [ 2x 15 kg ]`)
- block-080 / schema-1 / sub-4 (`4 min:` / `REST`)
- block-079 / schema-1 / sub-1 (`1st & 2nd min:` / `10 burpees [ WITHOUT JUMP ]`)
- block-079 / schema-1 / sub-2 (`3 & 4 min:` / `12-9-6 DB thrusters [ 2x 15 kg ] / - 3 min REST -`)
- block-081 / schema-1 / sub-3 (`3 & 4 min:` / `REST`)
- block-082 / schema-1 / sub-2 (`3 min:` / `12-9-6 DB thrusters [ 2x 15 kg ] / - 3 min REST -`)
  cardinality: 15 (только sub-schemas)
  related:
- contained-by: archetype-emom-nested-per-minute (всегда внутри EMOM outer)
  notes:
- Sub-only архетип (никогда top-level). Body содержит inline `12-9-6 DB thrusters` notation (ladder-like sequence в одной строке), но это body content, не nested ladder.

### archetype-time-window-outer

structural-invariant:

- kind: nested
- header: time-range `Hbegin:MMbegin-Hend:MMend min:` (например `0:00-10:00 min:`)
- sub-schemas: 1 atomic (rounds или ladder), описывает что делается внутри window
  parameters:
- time window (HH:MM-HH:MM)
- inner schema
  examples:
- block-003 / schema-1 (`0:00-10:00 min:` outer / sub-1: `3 rounds:` body=100 single unders + 10 power snatches)
- block-003 / schema-2 (`10:00-20:00 min:` outer / sub-1: `15-12-9:` body=burpees over DB + overhead squats)
  cardinality: 2 (block-003 only)
  related:
- paired-with: archetype-amrap-flat (оба используют time как первичный параметр), archetype-emom-nested-per-minute (minute-cadence variant)
  notes:
- Singleton block-level pattern. Phase 2.1 escalation: оставить как отдельный archetype или сливать с nested-rounds-over-rounds?
- Решение текущей фазы: оставить отдельным архетипом — time-window outer структурно отличен от count-outer (`2 sets:`).

---

## Composite-rounds family

### archetype-composite-rounds-with-rest

structural-invariant:

- kind: composite
- header: `N rounds | X min rest in between rounds` или `N rounds | X min REST after each round:` или `N sets | X min rest in between sets:` — header содержит count + rest-spec через `|`
- body: 1..N exercise rows с reps + modifiers; может содержать `...then N rounds:` continuation per Phase 2.1
  parameters:
- N (rounds/sets count)
- rest-spec (длительность + scope: "in between", "after each", etc.)
- exercises
  examples:
- block-017 / schema-1 (`3 rounds | 3 min rest in between rounds`)
- block-019 / schema-1 (`3 sets | 2 min rest in between sets:` body содержит `...then 2 rounds:` continuation)
- block-040 / schema-1 (`4 rounds | 2 min REST after each round:`)
- block-041 / schema-1 (`4 rounds | 2 min rest in between rounds`)
- block-043 / schema-1 (`5 rounds | 2 min rest in between rounds`)
- block-044 / schema-1 (`5 rounds | 2 min rest in between rounds`)
  cardinality: 6
  related:
- extension-of: archetype-n-rounds (с явной rest-spec в header вместо body-trailing rest-marker)
- specialization-of: archetype-composite-intervals-then-rounds (когда body содержит preamble + `...then N rounds:`)
  notes:
- Phase 2.1 спецификация: header с `|` и оба параметра несущие (count + rest) → kind=composite.
- block-019 — gray zone: body имеет `...then 2 rounds:` continuation, что роднит с intervals-then-rounds. Оставлено в этом архетипе, потому что outer header `N sets | rest:` идентичен другим composite-rounds-with-rest (017/040/041/043/044), а continuation per Phase 2.1 — body-level не выделяется в отдельный архетип.

### archetype-composite-intervals-then-rounds

structural-invariant:

- kind: composite
- header: `N INTERVALS | X min rest in between` (count of intervals + rest)
- body: preamble (1 exercise row, например `50 jumping Jacks`) + `...then N rounds:` connector + 2-3 inner exercise rows
  parameters:
- N intervals
- rest length
- preamble exercise (warm-up для interval)
- inner rounds N
- inner exercises
  examples:
- block-015 / schema-1 (`3 INTERVALS | 2 min rest in between` body=`50 JJ` + `...then 2 rounds:` + 3 exercises)
- block-016 / schema-1 (`3 INTERVALS | 2 min rest in between` body=`50 JJ` + `...then 3 ROUNDS:` + 3 exercises)
- block-039 / schema-1 (`4 INTERVALS | 2 min rest in between` body=`50 JJ` + `...then 2 rounds:` + 3 exercises)
  cardinality: 3
  related:
- specialization-of: archetype-composite-rounds-with-rest (с дополнительным preamble + inner rounds)
- continuation-of: использует `...then N rounds:` per Phase 2.1 case-then-rounds-continuation
  notes:
- Phase 2.1 case-INTERVALS-composite-with-then-rounds: composite single schema (не nested), `...then N rounds:` — continuation внутри body, не отдельная sub-schema.

### archetype-composite-intervals-work-rest-fixed

structural-invariant:

- kind: composite
- header: `Nx X min WORK | Y min REST` (count of intervals × work-duration + rest)
- body: 2-3 exercise rows с фиксированными reps (без MAX-notation)
  parameters:
- N intervals
- work duration
- rest duration
- exercises с reps
  examples:
- block-142 / schema-1 (`3x 3 min WORK | 2 min REST` body=3 fixed exercises: HSPU + DB cleans + air squats)
  cardinality: 1 (singleton)
  related:
- specialization-of: archetype-composite-intervals-work-rest-progressive (с fixed reps вместо MAX-progression)

### archetype-composite-intervals-work-rest-progressive

structural-invariant:

- kind: composite
- header: `N sets | X min WORK | Y min OFF:` или похожая work-off cadence
- body: preamble (warm-up reps) + `MAX ROUNDS in remaining time: <progressive sequence>` + exercise list + EXAMPLE annotation
  parameters:
- N sets
- work/off duration
- preamble exercise
- progressive ladder seed
- exercise list для progressive execution
  examples:
- block-140 / schema-1 (`3 sets | 2 min WORK | 2 min OFF:` body=25 JJ preamble + `MAX ROUNDS in remaining time: 1-2-3-4-5 etc.` + 3 exercises + EXAMPLE annotation)
- block-141 / schema-1 (mirror 140 с другим exercise set)
  cardinality: 2
  related:
- specialization-of: archetype-composite-intervals-work-rest-fixed (с progressive ladder body вместо fixed reps)
- paired-with: archetype-composite-intervals-on-off-max-tail (общий "MAX в remaining time" motif)

### archetype-composite-intervals-on-off-max-tail

structural-invariant:

- kind: composite
- header: `Nx X min ON | Y min OFF`
- body: 2 exercise rows с фиксированными reps + tail `MAX <exercise> in remaining time`
  parameters:
- N intervals
- on/off duration
- fixed exercises
- max-tail exercise
  examples:
- block-143 / schema-1 (`5x 2 min ON | 2 min OFF` body=10 DB squats + 10 power cleans + `MAX strict HSPU in remaining time`)
  cardinality: 1 (singleton)
  related:
- paired-with: archetype-composite-intervals-work-rest-progressive (общий "MAX в remaining time" motif)

### archetype-composite-rolling-rounds

structural-invariant:

- kind: composite
- header: `Every Nth min new round | xM rounds | T min` — header описывает rolling-EMOM cadence
- body: 2-3 exercise rows с reps
  parameters:
- N (interval), M (rounds), T (total time)
- exercises
  examples:
- block-144 / schema-1 (`Every 4th min new round | x4 rounds | 16 min` body=36 JJ + 18 snatches + 6 HSPU)
  cardinality: 1 (singleton)
  related:
- paired-with: archetype-emom-nested-per-minute (rolling EMOM с фиксированной cadence)
  notes:
- Singleton — единственный schema с такой rolling-rounds нотацией. Структурно близок к EMOM, но без sub-min дискретизации.

---

## Nested family (non-EMOM, non-time-window)

### archetype-nested-rounds-over-rounds

structural-invariant:

- kind: nested
- outer header: `N sets:` или `2-3 sets:` (rounds/sets counter)
- inner: 1 atomic с header `M rounds:` (rounds-внутри-sets двойной счётчик)
- inner body: 2-3 exercise rows + trailing rest
  parameters:
- N (outer sets/rounds)
- M (inner rounds)
- exercises
  examples:
- block-011 / schema-1 (`2 sets:` outer / `3 rounds:` inner body=3 exercises + rest)
- block-012 / schema-1 (`2 sets:` outer / `3 rounds:` inner body=3 exercises)
- block-026 / schema-1 (`3 sets:` outer / `2 rounds:` inner body=3 exercises)
  cardinality: 3
  related:
- extension-of: archetype-n-rounds (с дополнительным outer counter)
- specialization-of: archetype-nested-rounds-over-parallel-ladder (когда inner — parallel-ladder вместо rounds)

### archetype-nested-rounds-over-parallel-ladder

structural-invariant:

- kind: nested
- outer header: `N sets:` или `2-3 sets:`
- inner: 1 headerless с parallel-ladder body (структурно — archetype-parallel-ladders-descending)
- inner body: 2 parallel ladders + trailing rest
  parameters:
- N (outer sets)
- per-ladder steps + exercise
  examples:
- block-010 / schema-1 (`2 sets:` outer / headerless inner с `18-14-10 / 9-7-5` parallel ladders)
- block-013 / schema-1 (`2-3 sets:` outer / headerless inner с `18-14-10 / 9-7-5` parallel ladders)
- block-023 / schema-1 (`3 sets:` outer / headerless inner с `14-10-6 / 7-5-3` parallel ladders)
  cardinality: 3
  related:
- specialization-of: archetype-nested-rounds-over-rounds (inner — parallel-ladder, не atomic rounds)
- contains: archetype-parallel-ladders-descending (как sub-schema)

### archetype-nested-composite-rounds-over-ladder

structural-invariant:

- kind: nested
- outer header: composite `N sets | X min rest in between sets:` (count + rest, как archetype-composite-rounds-with-rest, но nested потому что есть sub-schema)
- inner: 1 atomic ladder (typically descending)
  parameters:
- N sets
- rest spec
- ladder steps + exercises
  examples:
- block-020 / schema-1 (`3 sets | 2 min rest in between sets:` outer / `7-5-3:` inner ladder body=strict HSPU + \*DB exercise placeholder + per-set substitution annotation)
- block-021 / schema-1 (`3 sets | 2 min rest in between sets:` outer / `9-7-5:` inner ladder body=DB snatches + burpee variation + per-set substitution annotation)
  cardinality: 2
  related:
- extension-of: archetype-composite-rounds-with-rest (composite outer становится nested wrapper)
- contains: archetype-ladder-descending (как sub-schema)
  notes:
- 020 и 021 содержат placeholder-exercise pattern (`*DB exercise`, `* Burpee variation`) с per-set substitution annotation. Sub-schema body содержит это inline per Phase 2.1.

---

## Named family

### archetype-named-themed-sets

structural-invariant:

- kind: named
- header: `N sets | <theme>:` или `N-M sets | <theme>:` (count + body theme)
  - Notation variants: `3 sets | shoulders:`, `3 sets | legs & glutes:`, `3-4 sets | shoulders:`, `3-4 sets | legs & glutes:`
- body: 2-4 exercise rows с reps + per-exercise modifiers + URL annotations
- паттерн: schemas всегда парные в одном blocke (shoulders + legs & glutes)
  parameters:
- N (sets), exact или range
- theme (shoulders / legs & glutes)
- exercises с reps + per-exercise URLs
  examples:
- block-153 / schema-1 (`3 sets | shoulders:` body=3 exercises)
- block-153 / schema-2 (`3 sets | legs & glutes:` body=3 exercises)
- block-157 / schema-1+2 (`3 sets | shoulders:` + `3 sets | legs & glutes:`)
- block-165 / schema-1+2 (`3-4 sets | shoulders:` + `3-4 sets | legs & glutes:`)
- block-167-181 (~15 blocks): consistent shoulders + legs & glutes pair
- block-190 / schema-1+2 (`3-4 sets | shoulders:` + `3-4 sets | legs & glutes:`)
  cardinality: 44 (22 block-instances × 2 schemas)
  related:
- specialization-of: archetype-n-rounds (с named theme в header вместо bare count)
- paired-with: archetype-named-themed-sets (всегда appears в парах внутри одного block: shoulders + legs & glutes)
  notes:
- Stable two-schema pattern в SUCCESSORY WORK блоках (преимущественно MONDAY).
- Phase 2.1 case-3-sets-WARM-UP-label-vs-schema: alternative form `3 sets WARM UP BEFORE RUN:` поднимается на block-label (block-150, 151) — schema внутри становится headerless flat-list.

### archetype-named-exercise-program

structural-invariant:

- kind: named
- header: имя упражнения с `:` (например `Bulgarian split squats:`)
- body: drop-set / volume-progression program в `[ ]` brackets, например `3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]` + опциональный demo URL + `- REST IN BETWEEN SETS UNTIL RECOVERY -`
  parameters:
- exercise name
- per-set rep count
- per-set load progression (kg drops)
- demo URL
  examples:
- block-008 / schema-2 (`Bulgarian split squats:` 3 sets [ x5 progression ])
- block-021 / schema-2 (`Bulgarian split squats:` 3 sets [ x5 ])
- block-058 / schema-1, block-059 / schema-1 (стандартный BSS pattern)
- block-069 / schema-2, block-071 / schema-3, block-072 / schema-2, block-074 / schema-2, block-078 / schema-2 (multi-block BSS pattern)
  cardinality: 9
  related:
- specialization-of: archetype-n-rounds (с drop-set body + named header)
  notes:
- Каноничный pattern (case-bulgarian-as-named per Phase 2.1). Trailing schema внутри (implicit) и STRENGTH ENDURANCE блоков.

---

## Single-line headerless family

### archetype-single-line-with-then-connector

structural-invariant:

- kind: headerless
- header: null
- body: одна строка (single exercise или movement) + connector trailer `then:` или `...then...:`
  parameters:
- exercise + reps + position-marker (`[ before/after BAR DIPS complex ]`, `[ ONLY ONCE before METCON ]`)
- connector variant (`then:` / `...then...:`)
  examples:
- block-006 / schema-1 (`150 jumping Jacks [ ONLY ONCE before METCON ] / ...then...:`)
- block-006 / schema-3 (mirror)
- block-051 / schema-1 (`12 strict pull-ups [ before BAR DIPS complex ] / then:`)
- block-051 / schema-3 (`12 strict pull-ups [ after BAR DIPS complex and before NEXT block ] / then:`)
- block-052 / schema-1, block-084 / schema-1+3, block-099 / schema-1+3, block-100 / schema-1+3
  cardinality: 11
  related:
- paired-with: archetype-single-line-bare (closing position в том же blocke), archetype-ladder-descending (или ascending, следует после в block topology)
- continuation-of: archetype-single-line-bare (Phase 2.1 case-then-connector: connector в конце body предыдущей schema, но here trailing — это та же form)
  notes:
- Phase 2.1 case-then-connector ratified: connector trailer (`then:` или `...then...:`) хранится в конце body этой schema, а не следующей.

### archetype-single-line-bare

structural-invariant:

- kind: headerless
- header: null
- body: одна строка с reps + exercise + опциональным position-marker; БЕЗ trailing connector (это finisher или closing-position в block topology)
  parameters:
- exercise + reps + modifiers
  examples:
- block-046 / schema-1 (`50 jumping Jacks`)
- block-046 / schema-3 (mirror)
- block-051 / schema-5 (`12 strict pull-ups [ after BAR DIPS complex ]` — block-closing position)
- block-052 / schema-3 (mirror)
- block-084 / schema-5, block-099 / schema-5, block-100 / schema-5 (block-closing pull-ups)
  cardinality: 7
  related:
- paired-with: archetype-single-line-with-then-connector (opening и closing positions в одном blocke)
- continuation-of: archetype-ladder-descending (часто appears после ladder как closing-pull-ups)
  notes:
- Phase 2.1 case-pull-ups-trailing: trailing pull-ups помещены в отдельную headerless schema, не inline в предыдущую ladder.
- Phase 2.1 case-then-connector implications: structural form тождественна with-then-connector minus trailer line.

### archetype-single-line-total-counter

structural-invariant:

- kind: headerless
- header: null
- body: одна строка `N <exercise-variant> [ TOTAL ]` (или `[ TOTAL ]` annotation в любой форме). `TOTAL` маркер обозначает overall-counter, не per-round
  parameters:
- N (total reps)
- exercise variant (HSPU, NEGATIVE HSPU, etc.)
  examples:
- block-102 / schema-1 (`30 strict HSPU [ TOTAL ]`)
- block-104 / schema-1 (`30 strict HSPU [ TOTAL ]`)
- block-113 / schema-1 (`30 strict HSPU [ TOTAL ]`)
- block-114 / schema-1 (`30 strict NEGATIVE HSPU [ TOTAL ]`)
  cardinality: 4
  related:
- paired-with: archetype-n-rounds (следующая schema в blocke — `3 sets:` или `4 sets:` GYMNASTICS work)
- specialization-of: archetype-single-line-bare (с structural `[ TOTAL ]` marker, делающим schema самостоятельным prefix)
  notes:
- Phase 2.1 ratified separately из-за `[ TOTAL ]` маркера, который делает row структурно distinct от inner body следующей `N sets:` ladder.
- В block topology — preface перед n-rounds work.

---

## Flat / Parallel headerless family

### archetype-flat-list-headerless

structural-invariant:

- kind: headerless
- header: null
- body: 3..8 exercise rows, каждая `<reps> <exercise> [ modifiers ]`. Нет внутренних `X-Y-Z:` markers. Опциональные внутренние rest-pauses (`- N min rest -`)
  parameters:
- rows count (3..8)
- per-row exercises + reps + modifiers
- internal rest-pauses (optional)
  examples:
- block-004 / schema-1 (7 rows STRENGTH ENDURANCE)
- block-007 / schema-1 (10 rows с 2 internal rest markers — cyclical structure)
- block-033 / schema-1 (8 rows)
- block-034 / schema-1 (6 rows)
- block-035 / schema-1 (11 rows с 2 internal rests)
- block-036 / schema-1 (6 rows)
- block-055 / schema-1 (5 rows, EASY PACE)
- block-145 / schema-1 (7 rows, CHIPPER label)
- block-150 / schema-1, block-151 / schema-1 (3 rows warm-up, label-embedded `3 sets`)
  cardinality: 10
  related:
- specialization-of: archetype-pull-ups-dips-cycle (когда есть очевидная cyclical structure с descending reps)
- extension-of: archetype-placeholder-body (когда rows становятся placeholder-typed)
  notes:
- Phase 2.1 case-pure-exercise-list-no-markers: тонкая натяжка спецификации headerless (которая по канонике подразумевает внутренние маркеры). Phase 2.2 — отдельный archetype с собственной сигнатурой.

### archetype-pull-ups-dips-cycle

structural-invariant:

- kind: headerless
- header: null
- body: 6..8 строк парных rows `<N> strict pull-ups` + `traverses + <M> bar dips + traverses + <K> bar dips`, повторяемых с убывающими N/M/K (cyclical structure без `X-Y-Z:` notation)
- опциональный trailing `30 strict T2B` (case-trailing-t2b)
  parameters:
- rows count
- per-row N (pull-ups), M, K (bar dips)
- trailing T2B (optional)
  examples:
- block-047 / schema-1 (6 rows: 15-12-9 strict pull-ups + traverses+bar dips alternation)
- block-048 / schema-1 (similar, 18-14-10 start)
- block-049 / schema-1 (21-15-9 start)
- block-050 / schema-1 (3+3 grouping: 10-20-10 in 2-row units)
- block-053 / schema-1 (6 rows + 30 strict T2B trailing)
- block-054 / schema-1 (8 rows + 30 strict T2B trailing)
  cardinality: 6
  related:
- specialization-of: archetype-flat-list-headerless (с cyclical pull-ups+dips structure без явных markers)
- paired-with: archetype-parallel-ladders-descending (alternative-notation для той же idea — но here без `X-Y-Z:` markers)
  notes:
- Структурно близок к parallel-ladders, но без явной `X-Y-Z:` notation. Decreasing-reps pattern implicit в self-counted rows.

---

## Modality / Reference family

### archetype-run-distance

structural-invariant:

- kind: headerless
- header: null
- body: одна строка `RUN [N km|N-M km]` или `[N km] RUN` или просто `RUN` — single-line modality token с distance
  parameters:
- distance (km, exact или range, или unspecified)
- token order (`RUN N km` / `N km RUN`)
  examples:
- block-060 / schema-1 (`RUN 5-7 km`)
- block-061 / schema-1 (`RUN 5 km`)
- block-062 / schema-1 (`RUN 5-6 km` — schema-2 is `3 sets [ BEFORE RUN ]` warmup atomic)
- block-064 / schema-1 (`5 km run`)
- block-065 / schema-1 (`RUN` — unspecified distance)
- block-066 / schema-1 (`RUN 7 km`)
- block-068 / schema-1 (`3-5 km run`)
- block-075 / schema-1, block-076 / schema-1 (`5 km RUN`)
- block-083 / schema-1 (`RUN 10 km`)
  cardinality: 11
  related:
- paired-with: archetype-n-rounds (часто warm-up `3 sets:` в schema-1 или schema-2 для warm-up)
  notes:
- Modality token vs concrete exercise list — структурно отдельный paradigm.

### archetype-placeholder-body

structural-invariant:

- kind: headerless
- header: null
- body: 1..2 строки placeholder-текста (без конкретных reps), опционально + concrete exercise row
- placeholder examples: `biceps / triceps`, `ANY exercise for ABS`, `seated Good morning`
  parameters:
- placeholder text
- concrete row (optional)
  examples:
- block-152 / schema-1 (`biceps / triceps` — muscle-group placeholder)
- block-193 / schema-1 (`ANY exercise for ABS`)
- block-194 / schema-1 (`ANY exercise for ABS + DB seated good morning [ link ]`)
- block-195 / schema-1 (2 rows: placeholder + concrete)
- block-196 / schema-1 (`ANY exercise for ABS + DB seated good morning` compound)
- block-197 / schema-1 (2 rows: `ANY exercise for ABS` + `3x 10 DB Jefferson curls [ 15 kg ]`)
  cardinality: 6
  related:
- extension-of: archetype-flat-list-headerless (с placeholder text вместо концертного reps)
  notes:
- Phase 4 / design phase решит как формализовать placeholder semantics ("ANY exercise for X" — coach-choice slot или athlete-choice slot).

### archetype-practice-list

structural-invariant:

- kind: headerless
- header: null
- body: 1..2 строки `<exercise name> [ URL ]` БЕЗ reps (practice-mode reference)
  parameters:
- exercises names
- URLs
  examples:
- block-146 / schema-1 (2 rows: `Lateral HS walk near wall [ link ]` + `Handstand Plate Walk [ link ]`)
  cardinality: 1 (singleton)
  related:
- extension-of: archetype-flat-list-headerless (с убранным rep-count, только exercise name + URL)
  notes:
- PRACTICE [ 5-10 min ] block-label, без явной программы reps/duration.

### archetype-url-only-body

structural-invariant:

- kind: headerless
- header: null
- body: 1..2 строки только URL (BAR/wrapped) без exercise name + reps
  parameters:
- URL(s)
  examples:
- block-147 / schema-1 (single URL inside `[ ]`, YOGA TIME reference)
- block-149 / schema-1 (2 bare URLs без `[ ]` обёртки, warm up for feet)
  cardinality: 2
  related:
- specialization-of: archetype-practice-list (с убранными exercise names — body только references)
  notes:
- Block-labels (YOGA TIME, warm up for feet) сами по себе несут весь structural context; body — только pointer к ресурсу.

---

## Summary

- **Total archetypes**: 33
- **By kind распределение**:
  - atomic: 8 archetypes (n-rounds, ladder-descending, ladder-ascending, ladder-vertex-down-pyramid, ladder-spike, alternating-sets, amrap-flat, emom-sub-minute-slot)
  - composite: 6 (rounds-with-rest, intervals-then-rounds, intervals-work-rest-fixed, intervals-work-rest-progressive, intervals-on-off-max-tail, rolling-rounds)
  - named: 2 (themed-sets, exercise-program)
  - nested: 5 (time-window-outer, rounds-over-rounds, rounds-over-parallel-ladder, composite-rounds-over-ladder, emom-nested-per-minute)
  - headerless: 12 (single-line-with-then-connector, single-line-bare, single-line-total-counter, flat-list, pull-ups-dips-cycle, parallel-ladders-descending, parallel-ladders-mixed-direction, parallel-pyramids, run-distance, placeholder-body, practice-list, url-only-body)
- **Coverage**: 337 schemas → 33 archetypes (312 top-level + 25 sub).
- **Singletons (cardinality=1)**: 8 — ladder-vertex-down-pyramid (block-098), ladder-spike (block-106), amrap-flat (block-078), composite-intervals-work-rest-fixed (block-142), composite-intervals-on-off-max-tail (block-143), composite-rolling-rounds (block-144), parallel-pyramids (block-087), practice-list (block-146).
- **Block-level singletons (cardinality=2 в одном blocke)**: 3 — alternating-sets (block-009), time-window-outer (block-003), parallel-ladders-mixed-direction (block-005).
