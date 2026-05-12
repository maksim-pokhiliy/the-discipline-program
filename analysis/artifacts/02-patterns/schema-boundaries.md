# Schema boundaries (Phase 2.1)

Разметка границ schemas внутри тел блоков. На каждый из 198 уникальных block-instance.

Концепты `kind`:

- `atomic` — один header + body
- `headerless` — body без header'а (внутри могут быть числовые/программные маркеры как часть составной структуры, либо просто список упражнений)
- `nested` — outer container, внутри которого одна или несколько sub-schemas
- `named` — header это имя/тема (`Bulgarian split squats:`, `3 sets | shoulders:`)
- `composite` — header сам сложносоставной (несколько параметров через `|`)
- `edge` — спорные случаи, перекрёстная ссылка с `edge-cases.md`

Архетипизация (ladder / EMOM / AMRAP / for-time / ...) — задача Phase 2.2; здесь не делается.

Source-reference для каждой карточки — точка входа в `01-inventory/block-instances.md` по `block-XXX` ID.

`[ ]`-аннотации сохраняются inline в body дословно — не расщепляются, не нормализуются.

`(implicit)` — блок без label'а в начале сессии (см. inventory). Также применяется к 7 экземплярам `Temporarily without STRENGTH ENDURANCE` (block-056..059) per main-session inventory correction.

---

## STRENGTH ENDURANCE

### block-001 (STRENGTH ENDURANCE)

source: block-instances.md → block-001
schemas:

- schema-1:
  kind: atomic
  header: "3-5 rounds:"
  body: |
  50 jumping Jacks
  10 DB bench presses [ 2x 15 kg ]
  50 jumping Jacks
  10 Incline DB Prone Row [ https://www.youtube.com/watch?v=7fxY8buPV0Q ] [ 2x 15 kg ]

### block-002 (STRENGTH ENDURANCE)

source: block-instances.md → block-002
schemas: []
note: empty body, см. inventory edge-cases.

### block-003 (STRENGTH ENDURANCE)

source: block-instances.md → block-003
schemas:

- schema-1:
  kind: nested
  header: "0:00-10:00 min:"
  sub-schemas:
  - sub-1:
    kind: atomic
    header: "3 rounds:"
    body: |
    100 single unders
    10 power snatches [ 2x 15 kg ]
- schema-2:
  kind: nested
  header: "10:00-20:00 min:"
  sub-schemas: - sub-1:
  kind: atomic
  header: "15-12-9:"
  body: |
  burpees over DB
  overhead squats [ 50/30 kg ]
  note: time-window outer container — singleton pattern (см. edge-cases case-time-window).

### block-004 (STRENGTH ENDURANCE)

source: block-instances.md → block-004
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  100 jumping Jacks
  30 DB hang power clean + DB push press [ 2x 15 kg ]
  15 lateral DB over burpees
  100 jumping Jacks
  15 lateral DB over burpees
  30 DB thrusters [ 2x 15 kg ]
  100 jumping Jacks

### block-005 (STRENGTH ENDURANCE)

source: block-instances.md → block-005
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  12-9-6:
  DB Thrusters
  6-9-12:
  DB hang power cleans - 5 min rest -
- schema-2:
  kind: headerless
  header: null
  body: |
  12-9-6:
  DB hang power cleans
  6-9-12:
  DB Thrusters
  [ DB 2x 15 kg ]
  note: две параллельные лесенки, разделённые rest-маркером (см. edge-cases case-rest-split-parallel).

### block-006 (STRENGTH ENDURANCE)

source: block-instances.md → block-006
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  150 jumping Jacks [ ONLY ONCE before METCON ]
  ...then...:
- schema-2:
  kind: atomic
  header: "15-12-9:"
  body: |
  DB bench presses [ 2x 15 kg ]
  DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ] - rest until recovery -
- schema-3:
  kind: headerless
  header: null
  body: |
  150 jumping Jacks [ ONLY ONCE before METCON ]
  ...then...:
- schema-4:
  kind: atomic
  header: "15-12-9:"
  body: |
  incline DB bench presses [ 2x 15 kg ]
  DB single arm row [ WITHOUT BENCH ] [ https://www.youtube.com/watch?v=_LJQDmOcTbE ] [ each arm ]
  note: `...then...:` connector помещён в конец body предыдущей schema (см. edge-cases case-then-connector).

### block-007 (STRENGTH ENDURANCE)

source: block-instances.md → block-007
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  18 KB clean & push press [ 24 kg ] [ 9 each arm ]
  14 strict HSPU [ from sofa ]
  10 DB squats[ 2x15 kg ] - 2 min rest -
  18 strict HSPU [ from sofa ]
  14 DB squats [ 2x15 kg ]
  10 KB clean & push press [ 24 kg ] [ 5 each arm ] - 2 min rest -
  18 DB squats [ 2x15 kg ]
  14 KB clean & push press [ 24 kg ] [ 7 each arm ]
  10 strict HSPU [ from sofa ]

### block-008 (STRENGTH ENDURANCE)

source: block-instances.md → block-008
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  18-14-10:
  DB power snatches [ 2x 15 kg ]
  9-7-5:
  strict HSPU
- schema-2:
  kind: named
  header: "Bulgarian split squats:"
  body: |
  3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]
  [ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ] - REST IN BETWEEN SETS UNTIL RECOVERY -

### block-009 (STRENGTH ENDURANCE)

source: block-instances.md → block-009
schemas:

- schema-1:
  kind: atomic
  header: "1st | 3rd | 5th sets:"
  body: |
  36 Jumping Jacks
  12 DB lunges [ 2x 15 kg ]
  6 KB clean & jerk [ 24 kg ] [ each arm ]
- schema-2:
  kind: atomic
  header: "2nd | 4th | 6th sets"
  body: |
  36 Jumping Jacks
  12 DB lunges [ 2x 15 kg ]
  6 deficit HSPU [ from sofa ] - 90 sec rest in between sets -
  note: alternation-паттерн между двумя schemas (нечётные/чётные sets) — см. edge-cases case-alternation.

### block-010 (STRENGTH ENDURANCE)

source: block-instances.md → block-010
schemas:

- schema-1:
  kind: nested
  header: "2 sets:"
  sub-schemas:
  - sub-1:
    kind: headerless
    header: null
    body: |
    18-14-10:
    DB snatch + DB squats [ 2x 15 kg ]
    9-7-5:
    10 strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ] - 5 min rest in between sets -

### block-011 (STRENGTH ENDURANCE)

source: block-instances.md → block-011
schemas:

- schema-1:
  kind: nested
  header: "2 sets:"
  sub-schemas:
  - sub-1:
    kind: atomic
    header: "3 rounds:"
    body: |
    2 strict HSPU
    4 DB hang power cleans [ 2x 15 kg ]
    8 DB farmer carry lunges [ 2x 15 kg ] [ 4 each leg ] - 5 min rest in between sets -

### block-012 (STRENGTH ENDURANCE)

source: block-instances.md → block-012
schemas:

- schema-1:
  kind: nested
  header: "2 sets:"
  sub-schemas:
  - sub-1:
    kind: atomic
    header: "3 rounds:"
    body: |
    3 strict HSPU
    5 DB snatches [ 2x 15 kg ]
    7 DB squats [ 2x 15 kg ] - 5 min rest in between sets -

### block-013 (STRENGTH ENDURANCE)

source: block-instances.md → block-013
schemas:

- schema-1:
  kind: nested
  header: "2-3 sets:"
  sub-schemas:
  - sub-1:
    kind: headerless
    header: null
    body: |
    18-14-10:
    DB snatch + DB squats [ 2x 15 kg ]
    9-7-5:
    strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ] - 5 min rest in between sets -

### block-014 (STRENGTH ENDURANCE)

source: block-instances.md → block-014
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  20-16-12:
  DB Snatches [ 2x 15 kg ]
  DB squats [ 2x 15 kg ]
  5-4-2:
  strict HSPU
  [ EXAMPLE: 36... 18... 4... then... 28... 14... 3... etc. ]

### block-015 (STRENGTH ENDURANCE)

source: block-instances.md → block-015
schemas:

- schema-1:
  kind: composite
  header: "3 INTERVALS | 2 min rest in between"
  body: |
  50 jumping Jacks
  ...then 2 rounds:
  5 deficit HSPU [ from sofa/box ] [ hand on DB | neutral grip ]
  7 DB hang power cleans + push press [ 2x 15 kg ]
  9 DB squats [ 2x 15 kg ]
  note: `...then 2 rounds:` — continuation в той же schema (см. workflow rule про connectors).

### block-016 (STRENGTH ENDURANCE)

source: block-instances.md → block-016
schemas:

- schema-1:
  kind: composite
  header: "3 INTERVALS | 2 min rest in between"
  body: |
  50 jumping Jacks
  ...then 3 ROUNDS:
  3 deficit HSPU [ from sofa/box ] [ hand on DB | neutral grip ]
  5 DB hang power cleans [ 2x 15 kg ]
  7 DB squats [ 2x 15 kg ]

### block-017 (STRENGTH ENDURANCE)

source: block-instances.md → block-017
schemas:

- schema-1:
  kind: composite
  header: "3 rounds | 3 min rest in between rounds"
  body: |
  12 DB snatches [ 2x 15 kg ]
  9 DB squats [ 2x 15 kg ]
  6 strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ]
  9 DB squats [ 2x 15 kg ]
  12 KB Swings [ 24 kg ]

### block-018 (STRENGTH ENDURANCE)

source: block-instances.md → block-018
schemas:

- schema-1:
  kind: atomic
  header: "3 rounds:"
  body: |
  15 KB swings [ 24 kg ]
  5 DB Thrusters [ 2x 15 kg ]
  10 DB lunges [ 2x 15 kg ] [ hold farm carry ]
  5 DB Thrusters [ 2x 15 kg ]
  10 DB lunges [ 2x 15 kg ] [ hold farm carry ] - 3 min rest in between sets -

### block-019 (STRENGTH ENDURANCE)

source: block-instances.md → block-019
schemas:

- schema-1:
  kind: composite
  header: "3 sets | 2 min rest in between sets:"
  body: |
  20 burpees
  ...then 2 rounds:
  5 DB power cleans [ 2x 15 kg ]
  3 strict HSPU
  5 DB front squats [ 2x 15 kg ]
  3 strict HSPU

### block-020 (STRENGTH ENDURANCE)

source: block-instances.md → block-020
schemas:

- schema-1:
  kind: nested
  header: "3 sets | 2 min rest in between sets:"
  sub-schemas: - sub-1:
  kind: atomic
  header: "7-5-3:"
  body: |
  strict HSPU
  *DB exercise [ 2x 15 kg ]
  [ *DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS ]
  note: composite-style outer header c вложенной atomic schema — kind=nested per spec. Per-set substitution `*DB exercise` остаётся inline в body.

### block-021 (STRENGTH ENDURANCE)

source: block-instances.md → block-021
schemas:

- schema-1:
  kind: nested
  header: "3 sets | 2 min rest in between sets:"
  sub-schemas:
  - sub-1:
    kind: atomic
    header: "9-7-5:"
    body: |
    DB power snatches [ 2x 15 kg ] \* Burpee variation
    [ 1 set: bar facing burpees | 2 set: burpee + push ups | 3 set: burpee ]
- schema-2:
  kind: named
  header: "Bulgarian split squats:"
  body: |
  3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]
  [ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ] - REST IN BETWEEN SETS UNTIL RECOVERY -

### block-022 (STRENGTH ENDURANCE)

source: block-instances.md → block-022
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  100 jumping Jacks
  10 DB bench presses [ 2x 15 kg ]
  10 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 incline DB bench presses [ 2x 15 kg ]
  100 jumping Jacks - 3 min rest in between sets -

### block-023 (STRENGTH ENDURANCE)

source: block-instances.md → block-023
schemas:

- schema-1:
  kind: nested
  header: "3 sets:"
  sub-schemas:
  - sub-1:
    kind: headerless
    header: null
    body: |
    14-10-6:
    DB snatch + DB squats [ 2x 15 kg ]
    7-5-3:
    strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ] - 5 min rest in between sets -

### block-024 (STRENGTH ENDURANCE)

source: block-instances.md → block-024
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  150 single unders
  5 strict ring pull-ups
  10 strict bar dips
  5 strict pull-ups
  150 single unders - 2 min rest in between sets -

### block-025 (STRENGTH ENDURANCE)

source: block-instances.md → block-025
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  150 single unders
  traverses + 5-7 bar dips [ https://www.youtube.com/watch?v=hsat8D8KN_k&t=20s ]
  10 strict pull-ups
  traverses + 5-7 bar dips [ https://www.youtube.com/watch?v=hsat8D8KN_k&t=20s ]
  150 single unders - 2 min rest in between sets -

### block-026 (STRENGTH ENDURANCE)

source: block-instances.md → block-026
schemas:

- schema-1:
  kind: nested
  header: "3 sets:"
  sub-schemas:
  - sub-1:
    kind: atomic
    header: "2 rounds:"
    body: |
    4 strict HSPU
    8 DB snatches [ 2x 15 kg ]
    12 DB Cossacs squats [ 15 kg ] [ 6 EACH leg ] - 3 min rest in between sets -

### block-027 (STRENGTH ENDURANCE)

source: block-instances.md → block-027
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  21 Jumping Jacks
  3 hang power cleans + 3 fron squats + 3 push presses [ DB 2x 15 kg ]
  15 Jumping Jacks
  3 hang power cleans + 3 fron squats + 3 push presses [ DB 2x 15 kg ]
  9 Jumping Jacks
  3 hang power cleans + 3 fron squats + 3 push presses [ DB 2x 15 kg ] - 3 min rest in between sets-

### block-028 (STRENGTH ENDURANCE)

source: block-instances.md → block-028
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  27 Jumping Jacks
  7 hang power cleans + 5 front squats + 3 push presses [ DB 2x 15 kg ]
  21 Jumping Jacks
  7 hang power cleans + 5 front squats + 3 push presses [ DB 2x 15 kg ]
  15 Jumping Jacks
  7 hang power cleans + 5 front squats + 3 push presses [ DB 2x 15 kg ] - 3 min rest in between sets-

### block-029 (STRENGTH ENDURANCE)

source: block-instances.md → block-029
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  27 Jumping Jacks
  9 hang power cleans + 7 front squats + 5 push presses [ DB 2x 15 kg ]
  21 Jumping Jacks
  7 hang power cleans + 5 front squats + 3 push presses [ DB 2x 15 kg ]
  15 Jumping Jacks
  5 hang power cleans + 3 front squats + 1 push presses [ DB 2x 15 kg ] - 3 min rest in between sets-

### block-030 (STRENGTH ENDURANCE)

source: block-instances.md → block-030
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  30 jumping Jacks
  ...THEN 2 rounds:
  5 DB deadlifts + 5 hang power cleans + 5 DB squats [ 2x 15 kg ]
  5 strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ] - 3 min rest in between sets -
  note: `...THEN 2 rounds:` — continuation в той же schema (см. spec rule).

### block-031 (STRENGTH ENDURANCE)

source: block-instances.md → block-031
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  25 jumping Jacks
  5 DB hang power cleans [ 2x 15 kg ]
  10 DB farmer carry lunges [ 2x 15 kg ] [ 5 each leg ]
  15 KB Goblet squats [ 24 kg ] - 90 sec - 2 min rest in between sets -

### block-032 (STRENGTH ENDURANCE)

source: block-instances.md → block-032
schemas:

- schema-1:
  kind: atomic
  header: "3-6-9-12-15:"
  body: |
  DB snatch [ 2x 15 kg ]
  DB squats [ 2x 15 kg ]
  \*\* 5 strict HSPU [ from sofa ] [ AFTER EACH ROUND ]

### block-033 (STRENGTH ENDURANCE)

source: block-instances.md → block-033
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  30 DB Snatches [ 1x 15 kg ]
  5 strict HSPU
  30 DB squats [ 2x 15 kg ]
  5 strict HSPU
  30 DB Snatches [ 1x 15 kg ]
  5 strict HSPU
  30 DB Bulgarian split squats [ 2x 15 kg ] [ 15 reps each leg ]
  5 strict HSPU

### block-034 (STRENGTH ENDURANCE)

source: block-instances.md → block-034
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  30 DB hang power clean & push press [ 2x 15 kg ]
  60 jumping Jacks
  30 strict HSPU [ from box/sofa ]
  60 jumping Jacks
  30 DB thrusters [ 2x 15 kg ]
  60 jumping Jacks

### block-035 (STRENGTH ENDURANCE)

source: block-instances.md → block-035
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  30 KB clean & push press [ 24 kg ] [ 15 each arm ]
  20 strict HSPU [ from sofa ]
  10 DB squats[ 2x15 kg ] - 2 min rest -
  30 strict HSPU [ from sofa ]
  20 DB squats [ 2x15 kg ]
  10 KB clean & push press [ 24 kg ] [ 5 each arm ] - 2 min rest -
  30 DB squats [ 2x15 kg ]
  20 KB clean & push press [ 24 kg ] [ 10 each arm ]
  10 strict HSPU [ from sofa ]

### block-036 (STRENGTH ENDURANCE)

source: block-instances.md → block-036
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  30 KB clean & push press [ 24 kg ] [ 15 each arm ]
  50 jumping Jacks
  45 strict HSPU [ from box/sofa ]
  75 jumping Jacks
  60 DB squats [ 2x 15 kg ]
  100 jumping Jacks

### block-037 (STRENGTH ENDURANCE)

source: block-instances.md → block-037
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  36-28-20:
  DB Snatches [ 15 kg ] [ alternative ]
  18-14-10:
  DB squats [ 2x 15 kg ]
  4-3-2:
  strict HSPU
  [ EXAMPLE: 36... 18... 4... then... 28... 14... 3... etc. ]

### block-038 (STRENGTH ENDURANCE)

source: block-instances.md → block-038
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  36-28-20:
  DB alt. snatches [ 1x 15 kg ]
  18-14-10:
  DB squats [ 2x 15 kg ]
  9-7-5:
  10 strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ]

### block-039 (STRENGTH ENDURANCE)

source: block-instances.md → block-039
schemas:

- schema-1:
  kind: composite
  header: "4 INTERVALS | 2 min rest in between"
  body: |
  50 jumping Jacks
  ...then 2 rounds:
  5 deficit HSPU [ from sofa/box ] [ hand on DB | neutral grip ]
  7 DB hang power cleans + push press [ 2x 15 kg ]
  9 DB squats [ 2x 15 kg ]

### block-040 (STRENGTH ENDURANCE)

source: block-instances.md → block-040
schemas:

- schema-1:
  kind: composite
  header: "4 rounds | 2 min REST after each round:"
  body: |
  12 EXPLODE bulgarian squats [ each leg ] [ https://www.youtube.com/watch?v=4XvvvqSg-ds ]
  9 DB hang power cleans [ 2x 15 kg ]
  6 strict HSPU

### block-041 (STRENGTH ENDURANCE)

source: block-instances.md → block-041
schemas:

- schema-1:
  kind: composite
  header: "4 rounds | 2 min rest in between rounds"
  body: |
  7 DB snatches + DB thrusters [ 2x 15 kg ]
  14 strict HSPU [ from sofa ]
  21 V-ups

### block-042 (STRENGTH ENDURANCE)

source: block-instances.md → block-042
schemas:

- schema-1:
  kind: atomic
  header: "4 rounds:"
  body: |
  5 strict HSPU
  10 DB snatches [ 2x 15 kg ]
  15 DB squats [ 2x 15 kg ] - 90 sec REST -

### block-043 (STRENGTH ENDURANCE)

source: block-instances.md → block-043
schemas:

- schema-1:
  kind: composite
  header: "5 rounds | 2 min rest in between rounds"
  body: |
  10 DB snatches + DB thrusters [ 1x 15 kg ] [ LEFT arm ]
  10 DB snatches + DB thrusters [ 1x 15 kg ] [ RIGHT arm ]
  5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ] [ from box/sofa ]

### block-044 (STRENGTH ENDURANCE)

source: block-instances.md → block-044
schemas:

- schema-1:
  kind: composite
  header: "5 rounds | 2 min rest in between rounds"
  body: |
  20 DB snatches [ 2x 15 kg ]
  15 DB squats [ 2x 15 kg ]
  10 strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ]

### block-045 (STRENGTH ENDURANCE)

source: block-instances.md → block-045
schemas:

- schema-1:
  kind: atomic
  header: "5 rounds:"
  body: |
  5 strict HSPU
  10 DB snatches [ 2x 15 kg ]
  20 DB squats [ 2x 15 kg ] - 2 min REST -

### block-046 (STRENGTH ENDURANCE)

source: block-instances.md → block-046
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  50 jumping Jacks
- schema-2:
  kind: atomic
  header: "...then... | 12-9-6:"
  body: |
  bench presses [ 2x 15 kg ]
  DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ] - 5 min rest in between -
- schema-3:
  kind: headerless
  header: null
  body: |
  50 jumping Jacks
- schema-4:
  kind: atomic
  header: "...then... | 12-9-6:"
  body: |
  incline DB bench presses [ 2x 15 kg ]
  DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  note: `...then... | 12-9-6:` — composite-style header, kind=atomic per spec rule.

---

## STRENGTH ENDURANCE | Gymnastics

### block-047 (STRENGTH ENDURANCE | Gymnastics)

source: block-instances.md → block-047
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  15 strict pull-ups
  traverses + 8 bar dips + traverses + 7 bar dips
  12 strict pull-ups
  traverses + 7 bar dips + traverses + 5 bar dips
  9 strict pull-ups
  traverses + 6 bar dips + traverses + 3 bar dips

### block-048 (STRENGTH ENDURANCE | Gymnastics)

source: block-instances.md → block-048
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  18 strict pull-ups
  traverses + 9 bar dips + traverses + 9 bar dips
  14 strict pull-ups
  traverses + 7 bar dips + traverses + 7 bar dips
  10 strict pull-ups
  traverses + 5 bar dips + traverses + 5 bar dips

### block-049 (STRENGTH ENDURANCE | Gymnastics)

source: block-instances.md → block-049
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  21 strict pull-ups
  traverses + 11 bar dips + traverses + 10 bar dips
  15 strict pull-ups
  traverses + 8 bar dips + traverses + 7 bar dips
  9 strict pull-ups
  traverses + 5 bar dips + traverses + 4 bar dips

### block-050 (STRENGTH ENDURANCE | Gymnastics)

source: block-instances.md → block-050
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  10 strict pull-ups
  traverses + 10 bar dips + traverses + 10 bar dips
  20 strict pull-ups
  traverses + 15 bar dips + traverses + 15 bar dips
  10 strict pull-ups
  traverses + 10 bar dips + traverses + 10 bar dips

### block-051 (STRENGTH ENDURANCE | Gymnastics)

source: block-instances.md → block-051
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  12 strict pull-ups [ before BAR DIPS complex ]
  then:
- schema-2:
  kind: atomic
  header: "12-9-6:"
  body: |
  bar dips + traverses + turn back 180\* + traverses
- schema-3:
  kind: headerless
  header: null
  body: |
  12 strict pull-ups [ after BAR DIPS complex and before NEXT block ]
  then:
- schema-4:
  kind: atomic
  header: "12-9-6:"
  body: |
  bar dips + traverses + turn back 180\* + traverses
- schema-5:
  kind: headerless
  header: null
  body: |
  12 strict pull-ups [ after BAR DIPS complex ]
  note: `then:` standalone connector — boundary marker between schemas. Помещён в конец body предыдущей schema (см. edge-cases case-then-connector).

### block-052 (STRENGTH ENDURANCE | Gymnastics)

source: block-instances.md → block-052
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  15 strict pull-ups [ before BAR DIPS complex ]
  then:
- schema-2:
  kind: atomic
  header: "10-8-6-4-2:"
  body: |
  bar dips + traverses + turn back 180\* + traverses
- schema-3:
  kind: headerless
  header: null
  body: |
  15 strict pull-ups [ after BAR DIPS complex ]

### block-053 (STRENGTH ENDURANCE | Gymnastics)

source: block-instances.md → block-053
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  18 strict pull-ups
  traverses + 9 bar dips + traverses + 9 bar dips
  14 strict pull-ups
  traverses + 7 bar dips + traverses + 7 bar dips
  10 strict pull-ups
  traverses + 5 bar dips + traverses + 5 bar dips
  30 strict T2B

### block-054 (STRENGTH ENDURANCE | Gymnastics)

source: block-instances.md → block-054
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  18 strict pull-ups
  traverses + 9 bar dips + traverses + 9 bar dips
  14 strict pull-ups
  traverses + 7 bar dips + traverses + 7 bar dips
  10 strict pull-ups
  traverses + 5 bar dips + traverses + 5 bar dips
  6 strict pull-ups
  traverses + 3 bar dips + traverses + 3 bar dips
  30 strict T2B

---

## STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]

### block-055 (STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ])

source: block-instances.md → block-055
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  30 hang power clean & push press [ 2x 15 kg ]
  30 KB swings [ 24 kg ]
  30 strict HSPU
  30 KB SDHP [ 24 kg ]
  30 DB thrusters [ 2x 15 kg ]

---

## Temporarily without STRENGTH ENDURANCE → (implicit)

Per main-session inventory correction #1: 7 instances переклассифицированы из label `Temporarily without STRENGTH ENDURANCE` в `(implicit)` для целей boundary-разметки. Body обрабатывается обычным образом, label в карточке указан как `(implicit)`.

### block-056 ((implicit))

source: block-instances.md → block-056
schemas: []
note: empty body. Original label `Temporarily without STRENGTH ENDURANCE` (4 locations) — see main-session inventory correction.

### block-057 ((implicit))

source: block-instances.md → block-057
schemas:

- schema-1:
  kind: atomic
  header: "3 rounds:"
  body: |
  20 alt. DB snatches [ 1x 15 kg ]
  15 DB squats [ 2x 15 kg ]
  10 strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ] - rest until recovery -
  note: Original label `Temporarily without STRENGTH ENDURANCE`.

### block-058 ((implicit))

source: block-instances.md → block-058
schemas:

- schema-1:
  kind: named
  header: "Bulgarian split squats:"
  body: |
  3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]
  [ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ] - REST IN BETWEEN SETS UNTIL RECOVERY -
  note: Original label `Temporarily without STRENGTH ENDURANCE`.

### block-059 ((implicit))

source: block-instances.md → block-059
schemas:

- schema-1:
  kind: named
  header: "Bulgarian split squats:"
  body: |
  3 sets [ x7 [ DB 2x 15 kg ] ...then... x7 [ DB 1x 15 kg ] ...then... x7 [ EXPLODE / WITHOUT WEIGHT] ]
  [ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ] - REST IN BETWEEN SETS UNTIL RECOVERY -
  note: Original label `Temporarily without STRENGTH ENDURANCE`.

---

## (implicit)

### block-060 ((implicit))

source: block-instances.md → block-060
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  RUN 5-7 km

### block-061 ((implicit))

source: block-instances.md → block-061
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  RUN 5 km

### block-062 ((implicit))

source: block-instances.md → block-062
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  RUN 5-6 km
- schema-2:
  kind: atomic
  header: "3 sets [ BEFORE RUN ]"
  body: |
  10-15 single leg GLUTE BRIDGE [ each leg ]
  10 Hip ABduction with band
  10 Hip ADduction with band [ https://www.youtube.com/watch?v=rq8tHYwBAOY ]
  note: `3 sets [ BEFORE RUN ]` без двоеточия — header с timing-аннотацией, kind=atomic.

### block-063 ((implicit))

source: block-instances.md → block-063
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  RUN 5-6 km
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10-15 single leg GLUTE BRIDGE [ each leg ]
  10 Hip ABduction with band
  10 Hip ADduction with band [ https://www.youtube.com/watch?v=rq8tHYwBAOY ]

### block-064 ((implicit))

source: block-instances.md → block-064
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  5 km run

### block-065 ((implicit))

source: block-instances.md → block-065
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  RUN

### block-066 ((implicit))

source: block-instances.md → block-066
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  RUN 7 km

### block-067 ((implicit))

source: block-instances.md → block-067
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10-15 single leg GLUTE BRIDGE [ each leg ]
  10 Hip ABduction with band
  10 Hip ADduction with band [ https://www.youtube.com/watch?v=rq8tHYwBAOY ]

### block-068 ((implicit))

source: block-instances.md → block-068
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  3-5 km run

### block-069 ((implicit))

source: block-instances.md → block-069
schemas:

- schema-1:
  kind: atomic
  header: "3-4 rounds:"
  body: |
  10 DB snatches [ 1x 15 kg ] + 10 strict HSPU [ from box/sofa ]
  10 DB squats [ 2x 15 kg ] + 10 V-ups
  50 Jumping Jacks - 2 min rest in between rounds -
- schema-2:
  kind: named
  header: "Bulgarian split squats:"
  body: |
  3 sets [ x7 [ DB 2x 15 kg ] ...then... x7 [ DB 1x 15 kg ] ...then... x7 [ EXPLODE / WITHOUT WEIGHT] ]
  [ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ] - REST IN BETWEEN SETS UNTIL RECOVERY -

### block-070 ((implicit))

source: block-instances.md → block-070
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10-15 single leg GLUTE BRIDGE [ each leg ]
  10 Hip ABduction with band
  10 Hip ADduction with band [ https://www.youtube.com/watch?v=rq8tHYwBAOY ]

### block-071 ((implicit))

source: block-instances.md → block-071
schemas:

- schema-1:
  kind: atomic
  header: "30-20-10:"
  body: |
  DB thrusters [ 1x 15 kg ] [ kind of wall balls ]
  DB snatches [ 1x 15 kg ] - 3 min rest in between rounds -
- schema-2:
  kind: atomic
  header: "15-10-5:"
  body: |
  DB squats [ 2x 15 kg ]
  deficit HSPU [ from sofa ] [ hands on DB ]
- schema-3:
  kind: named
  header: "Bulgarian split squats:"
  body: |
  4 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]
  [ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ] - REST IN BETWEEN SETS UNTIL RECOVERY -

### block-072 ((implicit))

source: block-instances.md → block-072
schemas:

- schema-1:
  kind: atomic
  header: "4 rounds:"
  body: |
  10 DB snatches [ 2x 15 kg ] + 10 strict HSPU [ from box/sofa ]
  10 DB squats [ 2x 15 kg ] + 10 V-ups
  50 Jumping Jacks - 2 min rest in between rounds -
- schema-2:
  kind: named
  header: "Bulgarian split squats:"
  body: |
  3 sets [ x7 [ DB 2x 15 kg ] ...then... x7 [ DB 1x 15 kg ] ...then... x7 [ EXPLODE / WITHOUT WEIGHT] ]
  [ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ] - REST IN BETWEEN SETS UNTIL RECOVERY -

### block-073 ((implicit))

source: block-instances.md → block-073
schemas:

- schema-1:
  kind: atomic
  header: "4 rounds:"
  body: |
  7 DB hang snatches [ LEFT ARM ]
  7 OH DB lunges [ LEFT ARM ]
  3 strict HSPU
  7 DB hang snatches [ RIGHT ARM ]
  7 OH DB lunges [ RIGHT ARM ]
  3 strict HSPU - 2 min rest -

### block-074 ((implicit))

source: block-instances.md → block-074
schemas:

- schema-1:
  kind: atomic
  header: "4-5 rounds:"
  body: |
  7 DB snatches [ 2x 15 kg ] + 7 strict HSPU [ from box/sofa ]
  7 DB squats [ 2x 15 kg ] + 7 V-ups
  50 Jumping Jacks - 2 min rest in between rounds -
- schema-2:
  kind: named
  header: "Bulgarian split squats:"
  body: |
  3 sets [ x7 [ DB 2x 15 kg ] ...then... x7 [ DB 1x 15 kg ] ...then... x7 [ EXPLODE / WITHOUT WEIGHT] ]
  [ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ] - REST IN BETWEEN SETS UNTIL RECOVERY -

### block-075 ((implicit))

source: block-instances.md → block-075
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  5 km RUN
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10-15 single leg GLUTE BRIDGE [ each leg ]
  10 Hip ABduction with band
  10 Hip ADduction with band [ https://www.youtube.com/watch?v=rq8tHYwBAOY ]

### block-076 ((implicit))

source: block-instances.md → block-076
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  5 km RUN
- schema-2:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10-15 single leg GLUTE BRIDGE [ each leg ]
  10 Hip ABduction with band
  10 Hip ADduction with band [ https://www.youtube.com/watch?v=rq8tHYwBAOY ]

### block-077 ((implicit))

source: block-instances.md → block-077
schemas:

- schema-1:
  kind: atomic
  header: "5 rounds:"
  body: |
  12 DB deadlifts
  9 DB hang power cleans
  6 DB push presses
  [ 2x 15 kg ]

### block-078 ((implicit))

source: block-instances.md → block-078
schemas:

- schema-1:
  kind: atomic
  header: "AMRAP 12 min:"
  body: |
  [ 75-80% Effort ]
  7 strict HSPU
  14 DB power snatches [ 2x 15 kg ]
  21 AIR squats
- schema-2:
  kind: named
  header: "Bulgarian split squats:"
  body: |
  3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT] ]
  [ EXPLODE: https://www.youtube.com/watch?v=7kQHaxvZgIc ] - REST IN BETWEEN SETS UNTIL RECOVERY -

### block-079 ((implicit))

source: block-instances.md → block-079
schemas:

- schema-1:
  kind: nested
  header: "EMOM 12 min:"
  sub-schemas:
  - sub-1:
    kind: atomic
    header: "1st & 2nd min:"
    body: |
    10 burpees [ WITHOUT JUMP ]
  - sub-2:
    kind: atomic
    header: "3 & 4 min:"
    body: |
    12-9-6 DB thrusters [ 2x 15 kg ] - 3 min REST -
- schema-2:
  kind: nested
  header: "EMOM 12 min:"
  sub-schemas: - sub-1:
  kind: atomic
  header: "1st & 2nd min:"
  body: |
  10 burpees [ WITHOUT JUMP ] - sub-2:
  kind: atomic
  header: "3 & 4 min:"
  body: |
  12-9-6 hang power cleans [ 2x 15 kg ]
  note: trailing `- 3 min REST -` помещён в body последней sub-schema первой EMOM как rest-после-цикла.

### block-080 ((implicit))

source: block-instances.md → block-080
schemas:

- schema-1:
  kind: nested
  header: "EMOM 16 min | 4 rounds:"
  sub-schemas:
  - sub-1:
    kind: atomic
    header: "1 min:"
    body: |
    25 jumping Jack's
  - sub-2:
    kind: atomic
    header: "2 min:"
    body: |
    12 V-ups
  - sub-3:
    kind: atomic
    header: "3 min:"
    body: |
    MAX DB FRONT SQUATS [ 2x 15 kg ]
  - sub-4:
    kind: atomic
    header: "4 min:"
    body: |
    REST

### block-081 ((implicit))

source: block-instances.md → block-081
schemas:

- schema-1:
  kind: nested
  header: "EMOM 16 min | 4 rounds:"
  sub-schemas:
  - sub-1:
    kind: atomic
    header: "1 min:"
    body: |
    7 DB hang power snatches [ 2x 15 kg ] + 5 burpee [ WITHOUT jump ]
  - sub-2:
    kind: atomic
    header: "2 min:"
    body: |
    5 strict HSPU + 7 DB squats [ 2x 15 kg ]
  - sub-3:
    kind: atomic
    header: "3 & 4 min:"
    body: |
    REST

### block-082 ((implicit))

source: block-instances.md → block-082
schemas:

- schema-1:
  kind: nested
  header: "EMOM 9 min:"
  sub-schemas:
  - sub-1:
    kind: atomic
    header: "1st & 2nd min:"
    body: |
    10 burpees [ WITHOUT JUMP ]
  - sub-2:
    kind: atomic
    header: "3 min:"
    body: |
    12-9-6 DB thrusters [ 2x 15 kg ] - 3 min REST -
- schema-2:
  kind: nested
  header: "EMOM 9 min:"
  sub-schemas:
  - sub-1:
    kind: atomic
    header: "1st & 2nd min:"
    body: |
    10 burpees [ WITHOUT JUMP ]
  - sub-2:
    kind: atomic
    header: "3 min:"
    body: |
    12-9-6 hang power cleans [ 2x 15 kg ]

### block-083 ((implicit))

source: block-instances.md → block-083
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  RUN 10 km

---

## Basic GYMNASTICS

### block-084 (Basic GYMNASTICS)

source: block-instances.md → block-084
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  15 strict pull-ups [ before BAR DIPS complex ]
  then:
- schema-2:
  kind: atomic
  header: "15-12-9:"
  body: |
  bar dips + traverses + turn back 180\* + traverses
- schema-3:
  kind: headerless
  header: null
  body: |
  15 strict pull-ups [ after BAR DIPS complex and before NEXT block ]
  then:
- schema-4:
  kind: atomic
  header: "9-12-15:"
  body: |
  bar dips + traverses + turn back 180\* + traverses
- schema-5:
  kind: headerless
  header: null
  body: |
  15 strict pull-ups [ after BAR DIPS complex ]

### block-085 (Basic GYMNASTICS)

source: block-instances.md → block-085
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  11-9-7-5-3:
  strict pull-ups
  22-18-14-10-6:
  traverses + strict bar dips
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB A-push ups [ https://www.youtube.com/watch?v=zjEHDw569b0 ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-086 (Basic GYMNASTICS)

source: block-instances.md → block-086
schemas:

- schema-1:
  kind: atomic
  header: "13-11-9-7-5:"
  body: |
  strict pull-ups
  strict bar dips
  \*100 single unders AFTER each set
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10-15 push ups
  10-15 Straight Arm Banded Lat Pull Down [ https://www.youtube.com/watch?v=LfGyMCw_Zd0 ]

### block-087 (Basic GYMNASTICS)

source: block-instances.md → block-087
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  3-6-9-12-9-6-3:
  strict pull-ups
  3-6-9-12-9-6-3:
  traverses + strict bar dips
  note: две лесенки с одинаковыми ступенями. Трактованы как одна headerless schema (параллельная structure), но возможна интерпретация как 2 sequential atomic — см. edge-cases case-same-ladder-numbers.

### block-088 (Basic GYMNASTICS)

source: block-instances.md → block-088
schemas:

- schema-1:
  kind: atomic
  header: "5 sets:"
  body: |
  10 bar dips
  5 C2B pull-ups

### block-089 (Basic GYMNASTICS)

source: block-instances.md → block-089
schemas:

- schema-1:
  kind: atomic
  header: "10-8-6-4-2:"
  body: |
  strict pull-ups
  strict bar dips - rest until recovery -
- schema-2:
  kind: atomic
  header: "5-4-3-2-1:"
  body: |
  strict chin pull-ups
  strict bar dips

### block-090 (Basic GYMNASTICS)

source: block-instances.md → block-090
schemas:

- schema-1:
  kind: atomic
  header: "10-8-6-4-2:"
  body: |
  strict pull-ups
  strict bar dips
  30 strict T2B
  note: trailing `30 strict T2B` без отдельного header — оставлено в body schema-1 (см. edge-cases case-trailing-t2b).

### block-091 (Basic GYMNASTICS)

source: block-instances.md → block-091
schemas:

- schema-1:
  kind: atomic
  header: "10-9-8-7-6-5-4-3-2-1:"
  body: |
  bar dips
  pull-ups

### block-092 (Basic GYMNASTICS)

source: block-instances.md → block-092
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  11-9-7-5-3:
  strict pull-ups
  22-18-14-10-6:
  traverses + strict bar dips

### block-093 (Basic GYMNASTICS)

source: block-instances.md → block-093
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  11-9-7-5-3:
  strict pull-ups
  22-18-14-10-6:
  traverses + strict bar dips \* 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK [ after each GYMNASTICS round ]

### block-094 (Basic GYMNASTICS)

source: block-instances.md → block-094
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  11-9-7-5-3:
  strict pull-ups
  22-18-14-10-6:
  traverses + strict bar dips
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  5 DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ] [ another ARM HOLD DB in UP ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-095 (Basic GYMNASTICS)

source: block-instances.md → block-095
schemas:

- schema-1:
  kind: atomic
  header: "11-9-7-5-3:"
  body: |
  strict pull-ups
  strict bar dips \* 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK [ after each GYMNASTICS round ]

### block-096 (Basic GYMNASTICS)

source: block-instances.md → block-096
schemas:

- schema-1:
  kind: atomic
  header: "11-9-7-5-3:"
  body: |
  strict pull-ups
  strict bar dips
  \*150 single unders AFTER each set
  30 strict T2B

### block-097 (Basic GYMNASTICS)

source: block-instances.md → block-097
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  11-9-7-5:
  strict pull-ups
  22-18-14-10:
  traverses + strict bar dips
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB A-push ups [ https://www.youtube.com/watch?v=zjEHDw569b0 ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-098 (Basic GYMNASTICS)

source: block-instances.md → block-098
schemas:

- schema-1:
  kind: atomic
  header: "11-9-7-9-11:"
  body: |
  strict pull-ups
  strict bar dips
  10 [ 5 each LEG ] Cossacs squats AFTER EACH GYMNASTICS set

### block-099 (Basic GYMNASTICS)

source: block-instances.md → block-099
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  15 strict pull-ups [ before BAR DIPS complex ]
  then:
- schema-2:
  kind: atomic
  header: "11-9-7:"
  body: |
  bar dips + traverses + turn back 180\* + traverses
- schema-3:
  kind: headerless
  header: null
  body: |
  12 strict pull-ups [ after BAR DIPS complex and before NEXT block ]
  then:
- schema-4:
  kind: atomic
  header: "7-9-11:"
  body: |
  bar dips + traverses + turn back 180\* + traverses
- schema-5:
  kind: headerless
  header: null
  body: |
  9 strict pull-ups [ after BAR DIPS complex ]

### block-100 (Basic GYMNASTICS)

source: block-instances.md → block-100
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  21 strict pull-ups [ before BAR DIPS complex ]
  then:
- schema-2:
  kind: atomic
  header: "15-12-9:"
  body: |
  bar dips + traverses + turn back 180\* + traverses
- schema-3:
  kind: headerless
  header: null
  body: |
  15 strict pull-ups [ after BAR DIPS complex and before NEXT block ]
  then:
- schema-4:
  kind: atomic
  header: "9-12-15:"
  body: |
  bar dips + traverses + turn back 180\* + traverses
- schema-5:
  kind: headerless
  header: null
  body: |
  9 strict pull-ups [ after BAR DIPS complex ]

---

## GYMNASTICS

### block-101 (GYMNASTICS)

source: block-instances.md → block-101
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 strict pull-ups [ neutral grip ]
  10 strict HSPU

### block-102 (GYMNASTICS)

source: block-instances.md → block-102
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  30 strict HSPU [ TOTAL ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  7 strict pull-ups [ neutral grip ]
  14 strict bar dips - 5 min rest in between sets -
- schema-3:
  kind: atomic
  header: "4 sets:"
  body: |
  15 horizontal pull-ups
  15 push ups
  30 strict T2B

### block-103 (GYMNASTICS)

source: block-instances.md → block-103
schemas:

- schema-1:
  kind: atomic
  header: "10-8-6-4-2:"
  body: |
  strict pull-ups
  strict bar dips - REST UNTIL RECOVERY -
- schema-2:
  kind: atomic
  header: "1-2-3-4-5:"
  body: |
  strict pull-ups
  strict bar dips
  30 strict T2B

### block-104 (GYMNASTICS)

source: block-instances.md → block-104
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  30 strict HSPU [ TOTAL ]
- schema-2:
  kind: atomic
  header: "4 sets:"
  body: |
  7 strict pull-ups [ neutral grip ]
  14 strict bar dips - 5 min rest in between sets -
- schema-3:
  kind: atomic
  header: "4 sets:"
  body: |
  15 horizontal pull-ups
  15 push ups
  30 strict T2B

### block-105 (GYMNASTICS)

source: block-instances.md → block-105
schemas:

- schema-1:
  kind: atomic
  header: "5 sets:"
  body: |
  5 strict pull-ups [ neutral grip ]
  10 strict bar dips - 5 min rest in between sets -
- schema-2:
  kind: atomic
  header: "5 sets:"
  body: |
  10 horizontal pull-ups
  5 strict bar dips OR 10 push ups
  30 strict T2B

### block-106 (GYMNASTICS)

source: block-instances.md → block-106
schemas:

- schema-1:
  kind: atomic
  header: "10-8-6-4-10:"
  body: |
  strict pull-ups
  strict bar dips
  30 strict T2B

### block-107 (GYMNASTICS)

source: block-instances.md → block-107
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  10-8-6-4-2:
  strict pull-ups [ neutral grip ]
  20-16-12-8-4:
  bar dips
  30 strict T2B

### block-108 (GYMNASTICS)

source: block-instances.md → block-108
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  10-8-6-4-2:
  strict pull-ups [ neutral grip ]
  20-16-12-8-4:
  bar dips
  35 strict T2B

### block-109 (GYMNASTICS)

source: block-instances.md → block-109
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  10-8-6-4-2:
  strict pull-ups [ neutral grip ]
  20-16-12-8-4:
  traverses + bar dips
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 push ups
  15 horizontal pull-ups
  30 strict T2B

### block-110 (GYMNASTICS)

source: block-instances.md → block-110
schemas:

- schema-1:
  kind: atomic
  header: "12-9-6:"
  body: |
  strict pull-ups
  strict bar dips - 5 min rest in between sets -
- schema-2:
  kind: atomic
  header: "9-6-3:"
  body: |
  strict pull-ups
  strict bar dips
  30 strict T2B

### block-111 (GYMNASTICS)

source: block-instances.md → block-111
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 strict pull-ups [ neutral grip ]
  10 strict HSPU - 5 min rest in between -
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 horizontal pull-ups
  10-15 strict bar dips
  30 strict T2B

### block-112 (GYMNASTICS)

source: block-instances.md → block-112
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 strict pull-ups [ neutral grip ]
  10 strict bar dips - 5-7 min rest in between sets -
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 horizontal pull-ups
  10 strict bar dips OR 20 push ups
  30 strict T2B

### block-113 (GYMNASTICS)

source: block-instances.md → block-113
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  30 strict HSPU [ TOTAL ]
- schema-2:
  kind: atomic
  header: "3-4 sets:"
  body: |
  7 strict pull-ups [ neutral grip ]
  14 strict bar dips - 5 min rest in between sets -
- schema-3:
  kind: atomic
  header: "4 sets:"
  body: |
  15 horizontal pull-ups
  15 push ups
  30 strict T2B

### block-114 (GYMNASTICS)

source: block-instances.md → block-114
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  30 strict NEGATIVE HSPU [ TOTAL ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 strict pull-ups [ neutral grip ]
  15 strict bar dips - 5 min rest in between sets -
- schema-3:
  kind: atomic
  header: "3 sets:"
  body: |
  10 horizontal pull-ups
  15 push ups
  30 strict T2B

### block-115 (GYMNASTICS)

source: block-instances.md → block-115
schemas:

- schema-1:
  kind: atomic
  header: "4 sets:"
  body: |
  7 strict pull-ups [ neutral grip ]
  14 strict bar dips - 5 min rest in between sets -
- schema-2:
  kind: atomic
  header: "4 sets:"
  body: |
  10 horizontal pull-ups
  5 strict bar dips OR 10 push ups
  35 strict T2B

### block-116 (GYMNASTICS)

source: block-instances.md → block-116
schemas:

- schema-1:
  kind: atomic
  header: "5 sets:"
  body: |
  5 strict pull-ups [ neutral grip ]
  5 strict HSPU - 5 min rest in between -
- schema-2:
  kind: atomic
  header: "5 sets:"
  body: |
  10 horizontal pull-ups
  10 strict bar dips
  30 strict T2B

---

## PUMP SESSION

### block-117 (PUMP SESSION)

source: block-instances.md → block-117
schemas:

- schema-1:
  kind: atomic
  header: "3 rounds:"
  body: |
  20 alt. DB bench presses [ 2x 15 kg ] [ https://www.youtube.com/watch?v=7CHPqVxJOUE ]
  10 DB bent over row [ 2x 15 kg ]
  10 deficit DB push ups
  10 DB pull overs

### block-118 (PUMP SESSION)

source: block-instances.md → block-118
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  10 KB [ 24 kg ] single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 plyo push ups
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ] - rest UNTIL recovery -

### block-119 (PUMP SESSION)

source: block-instances.md → block-119
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ] [ another ARM HOLD DB in UP ]
  15 DB single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 incline DB bench presses [ 2x 15 kg ] + 10 plyo push ups
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-120 (PUMP SESSION)

source: block-instances.md → block-120
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  10 DB single arm row [ LEFT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 incline DB bench presses [ 2x 15 kg ]
  10 DB single arm row [ RIGHT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ] - rest UNTIL recovery -

### block-121 (PUMP SESSION)

source: block-instances.md → block-121
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  10 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 incline DB bench presses [ 2x 15 kg ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ] - rest UNTIL recovery - - 5 min rest AFTER 3RD SET -
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB bench presses LEFT arm | RIGHT arm HOLD in UP [ 2x 15 kg ]
  10 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 DB bench presses RIGHT arm | LEFT arm HOLD in UP [ 2x 15 kg ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-122 (PUMP SESSION)

source: block-instances.md → block-122
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  15 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 incline DB bench presses [ 2x 15 kg ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-123 (PUMP SESSION)

source: block-instances.md → block-123
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  5 DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]
  15 single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ LEFT ARM ]
  5 DB bench presses [ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses [ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ]
  15 single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ RIGHT ARM ] - rest UNTIL recovery -
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB INCLINE bench presses [ 2x 15 kg ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-124 (PUMP SESSION)

source: block-instances.md → block-124
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  12 DB bench presses [ 2x 15 kg ]
  12 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
- schema-2:
  kind: atomic
  header: "3-4 sets:"
  body: |
  12 incline DB bench presses [ 2x 15 kg ]
  12 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-125 (PUMP SESSION)

source: block-instances.md → block-125
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB Glute Bridge Bench Press [ 2x 15 kg ] [ https://www.youtube.com/watch?v=CyHxva5XYYY ]
  10-15 Straight Arm Banded Lat Pull Down [ https://www.youtube.com/watch?v=LfGyMCw_Zd0 ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB floor Fly [ 2x 15 kg ] [ https://www.youtube.com/watch?v=bgC53-J-6gA ]
  10 Incline DB Prone Row [ https://www.youtube.com/watch?v=7fxY8buPV0Q ] [ 2x 15 kg ]
- schema-3:
  kind: atomic
  header: "1 set:"
  body: |
  30 DB Renegade row [ https://www.youtube.com/watch?v=bi1Nf5G86gU ] { 1 push up + each arm row = 1 rep }

### block-126 (PUMP SESSION)

source: block-instances.md → block-126
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  10 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 incline DB bench presses [ 2x 15 kg ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ] - rest UNTIL recovery - - 5 min rest AFTER 3RD SET -
- schema-2:
  kind: atomic
  header: "1 sets:"
  body: |
  30 DB bench presses [ 2x 15 kg ]
  30 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  30 incline DB bench presses [ 2x 15 kg ]
  30 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-127 (PUMP SESSION)

source: block-instances.md → block-127
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ] + 10 plyo push ups
  10 DB single arm row [ LEFT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 plyo push ups + 10 incline DB bench presses [ 2x 15 kg ]
  10 DB single arm row [ RIGHT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ] - rest UNTIL recovery -

### block-128 (PUMP SESSION)

source: block-instances.md → block-128
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ] + 5 plyo push ups
  10 DB single arm row [ LEFT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  5 plyo push ups + 10 incline DB bench presses [ 2x 15 kg ]
  10 DB single arm row [ RIGHT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ] - rest UNTIL recovery -

### block-129 (PUMP SESSION)

source: block-instances.md → block-129
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  5 DB bench presses [ 2x 15 kg ] + 10 plyo push ups + 5 DB bench presses [ 2x 15 kg ]
  15 single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ LEFT ARM ]
  5 DB bench presses [ 2x 15 kg ] + 10 plyo push ups + 5 DB bench presses [ 2x 15 kg ]
  15 single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ RIGHT ARM ] - rest UNTIL recovery -
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  5 DB INCLINE bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ] [ another ARM HOLD DB in UP ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-130 (PUMP SESSION)

source: block-instances.md → block-130
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  10 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
- schema-2:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 incline DB bench presses [ 2x 15 kg ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-131 (PUMP SESSION)

source: block-instances.md → block-131
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  12 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 incline DB bench presses [ 2x 15 kg ]
  12 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ] - rest UNTIL recovery -

### block-132 (PUMP SESSION)

source: block-instances.md → block-132
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  15 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 incline DB bench presses [ 2x 15 kg ]
  15 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ] - rest UNTIL recovery -

### block-133 (PUMP SESSION)

source: block-instances.md → block-133
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ] [ another ARM HOLD KB 24 kg in UP ]
  15 DB single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
- schema-2:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 incline DB bench presses [ 2x 15 kg ] + 10 plyo push ups
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-134 (PUMP SESSION)

source: block-instances.md → block-134
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  7 DB bench presses [ 2x 15 kg ]
  14 DB single arm row [ LEFT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  7 incline DB bench presses [ 2x 15 kg ]
  14 DB single arm row [ RIGHT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ] - rest UNTIL recovery -
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]

### block-135 (PUMP SESSION)

source: block-instances.md → block-135
schemas:

- schema-1:
  kind: atomic
  header: "4 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  10 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 incline DB bench presses [ 2x 15 kg ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ] - rest UNTIL recovery -

### block-136 (PUMP SESSION)

source: block-instances.md → block-136
schemas:

- schema-1:
  kind: atomic
  header: "4 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  10 KB single arm row [ 24 kg ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 incline DB bench presses [ 2x 15 kg ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]
  10 plyo push ups - rest UNTIL recovery -

### block-137 (PUMP SESSION)

source: block-instances.md → block-137
schemas:

- schema-1:
  kind: atomic
  header: "4 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  15 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 incline DB bench presses [ 2x 15 kg ]
  15 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ] - rest UNTIL recovery -

### block-138 (PUMP SESSION)

source: block-instances.md → block-138
schemas:

- schema-1:
  kind: atomic
  header: "4 sets:"
  body: |
  12 DB Glute Bridge Bench Press [ 2x 15 kg ] [ https://www.youtube.com/watch?v=CyHxva5XYYY ]
  12 Straight Arm Banded Lat Pull Down [ https://www.youtube.com/watch?v=LfGyMCw_Zd0 ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB floor Fly [ 2x 15 kg ] [ https://www.youtube.com/watch?v=bgC53-J-6gA ]
  15 Incline DB Prone Row [ https://www.youtube.com/watch?v=7fxY8buPV0Q ] [ 2x 15 kg ]
- schema-3:
  kind: atomic
  header: "3x 10 reps:"
  body: |
  DB Renegade row [ https://www.youtube.com/watch?v=bi1Nf5G86gU ] { 1 push up + each arm row = 1 rep }

### block-139 (PUMP SESSION)

source: block-instances.md → block-139
schemas:

- schema-1:
  kind: atomic
  header: "5 sets:"
  body: |
  10 DB bench presses [ 2x 15 kg ]
  10 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]
  10 incline DB bench presses [ 2x 15 kg ]
  10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ] - rest UNTIL recovery -

---

## INTERVALS

### block-140 (INTERVALS)

source: block-instances.md → block-140
schemas:

- schema-1:
  kind: composite
  header: "3 sets | 2 min WORK | 2 min OFF:"
  body: |
  25 jumping Jack's
  MAX ROUNDS in remaining time: 1-2-3-4-5 etc. [ 2x 15 kg ]
  DB hang power cleans
  DB squats
  DB STOH [ push press OR push jerk ]
  EXAMPLE [ 1 DB hang power clean + 1 DB squat + 1 DB STOH... 2... + 2... + 2... 3...+ 3... + 3... etc ]

### block-141 (INTERVALS)

source: block-instances.md → block-141
schemas:

- schema-1:
  kind: composite
  header: "3 sets | 2 min WORK | 2 min OFF:"
  body: |
  50 jumping Jack's
  MAX ROUNDS in remaining time: 1-2-3-4-5 etc. [ 2x 15 kg ]
  DB hang power snatches
  DB squats
  EXAMPLE [ 1 DB hang power snatches + 1 Db squats... 2 DB hang power snatches + 2 DB squats... 3...+ 3... ]

### block-142 (INTERVALS)

source: block-instances.md → block-142
schemas:

- schema-1:
  kind: composite
  header: "3x 3 min WORK | 2 min REST"
  body: |
  3 strict HSPU
  6 DB hang power cleans [ 2x 15 kg ]
  9 air squats

### block-143 (INTERVALS)

source: block-instances.md → block-143
schemas:

- schema-1:
  kind: composite
  header: "5x 2 min ON | 2 min OFF"
  body: |
  10 DB squats [ 2x 15 kg ]
  10 power cleans [ 2x 15 kg ]
  MAX strict HSPU in remaining time

### block-144 (INTERVALS)

source: block-instances.md → block-144
schemas:

- schema-1:
  kind: composite
  header: "Every 4th min new round | x4 rounds | 16 min"
  body: |
  36 jumping Jacks
  18 DB snatches [ 1x 15 kg ]
  6 strict HSPU

---

## CHIPPER

### block-145 (CHIPPER)

source: block-instances.md → block-145
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  10 strict HSPU
  25 DB deadlifts [ 2x 15 kg ]
  50 DB squats [ 2x 15 kg ]
  25 DB hang power cleans [ 2x 15 kg ]
  50 DB lunges [ 2x 15 kg ]
  25 DB deadlifts [ 2x 15 kg ]
  10 strict HSPU

---

## PRACTICE [ 5-10 min ]

### block-146 (PRACTICE [ 5-10 min ])

source: block-instances.md → block-146
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  Lateral HS walk near wall [ https://www.youtube.com/watch?v=N2QNWiQie-A ]
  Handstand Plate Walk [ https://www.youtube.com/watch?v=wLTv_uUVcRw ]

---

## YOGA TIME

### block-147 (YOGA TIME)

source: block-instances.md → block-147
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  [ https://www.youtube.com/watch?v=iQ5oNZdu0rE&list=PLGfo-TF4uycPfxTRGEGICKc_S0PtVzPYH&index=9 ]

---

## warm up BEFORE run

### block-148 (warm up BEFORE run)

source: block-instances.md → block-148
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10-15 single leg GLUTE BRIDGE [ each leg ]
  10 Hip ABduction with band
  10 Hip ADduction with band [ https://www.youtube.com/watch?v=rq8tHYwBAOY ]

---

## warm up for feet

### block-149 (warm up for feet)

source: block-instances.md → block-149
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  https://youtu.be/Qt1NzbdWSmM?si=NgjjrbU1BmXCioob
  https://youtu.be/VX1euygufcY?si=33QNST7ctqlYtxa2

---

## 3 sets WARM UP BEFORE RUN

### block-150 (3 sets WARM UP BEFORE RUN)

source: block-instances.md → block-150
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  10-15 single leg GLUTE BRIDGE [ each leg ]
  10 Hip ABduction with band
  10 Hip ADduction with band [ https://www.youtube.com/watch?v=rq8tHYwBAOY ]
  note: `3 sets` уже embedded в block-label; внутри body нет повторного schema-header → headerless.

---

## Warm Up before RUN | 3 sets

### block-151 (Warm Up before RUN | 3 sets)

source: block-instances.md → block-151
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  10-15 single leg GLUTE BRIDGE [ each leg ]
  10 Hip ABduction with band
  10 Hip ADduction with band [ https://www.youtube.com/watch?v=rq8tHYwBAOY ]
  note: `3 sets` уже embedded в block-label.

---

## SUCCESSORY WORK

### block-152 (SUCCESSORY WORK)

source: block-instances.md → block-152
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  biceps / triceps

### block-153 (SUCCESSORY WORK)

source: block-instances.md → block-153
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  15 seated lateral BANDED raises [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  20 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  15 Glute Loop DB Hip Thrust [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=YdhYJv9ccPQ ]
  20 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-154 (SUCCESSORY WORK)

source: block-instances.md → block-154
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  5 strict DB press + 10 DB push press + 5 strict DB press [ 2x 15 kg ]
  15 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  20 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]
  15 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  20 hamstring curls [ AFTER each 10th REP - 10 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-155 (SUCCESSORY WORK)

source: block-instances.md → block-155
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB Seated Single Arm Arnold Press [ each arm ] [ https://www.youtube.com/watch?v=3Lhln4TspkU ]
  10 KB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  15-20 DB leg extension [ https://www.youtube.com/watch?v=vyZuR5deqE8 ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]
- schema-3:
  kind: atomic
  header: "3 sets:"
  body: |
  10 Single Leg KB Hip Thrust [ + 1 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]

### block-156 (SUCCESSORY WORK)

source: block-instances.md → block-156
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  5 KB push press [ 24 kg ] + 10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  15 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  20 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]
  10 Hip ABduction with band

### block-157 (SUCCESSORY WORK)

source: block-instances.md → block-157
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  7 strict DB press + 7 DB push press [ 2x 15 kg ] | [ 2 sec SLOW down ]
  14 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  14 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB Bulgarian split squats + 10 withot DB [ 2x 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  20 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  10 Low Hold KB Cossack Squat [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=ZclBW2lK-lY ]
  20 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-158 (SUCCESSORY WORK)

source: block-instances.md → block-158
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 DB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]
  15 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  20 TWO ARMS rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 KB Single Leg RDL to Reverse Lunge [ each leg ] [ https://www.youtube.com/watch?v=CpYyGD2hlv4 ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-159 (SUCCESSORY WORK)

source: block-instances.md → block-159
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 DB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]
  15 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  20 TWO ARMS rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3-4 sets:"
  body: |
  15 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 KB Single Leg RDL to Reverse Lunge [ each leg ] [ https://www.youtube.com/watch?v=CpYyGD2hlv4 ]
  20 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-160 (SUCCESSORY WORK)

source: block-instances.md → block-160
schemas:

- schema-1:
  kind: atomic
  header: "4 sets:"
  body: |
  10 DB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]
  15 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  20 TWO ARMS rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "4 sets:"
  body: |
  15 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 KB Single Leg RDL to Reverse Lunge [ each leg ] [ https://www.youtube.com/watch?v=CpYyGD2hlv4 ]
  20 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-161 (SUCCESSORY WORK)

source: block-instances.md → block-161
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 alternative DB press [ https://www.youtube.com/watch?v=T9OFhjgXt6c ]
  10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  10 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-162 (SUCCESSORY WORK)

source: block-instances.md → block-162
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 alternative DB press [ https://www.youtube.com/watch?v=T9OFhjgXt6c ]
  10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]
  15 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-163 (SUCCESSORY WORK)

source: block-instances.md → block-163
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  10 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  12 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  12 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]
  12 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]

### block-164 (SUCCESSORY WORK)

source: block-instances.md → block-164
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10-12 DB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]
  10-12 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  10-12 TWO ARMS rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  15 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 KB Single Leg RDL to Reverse Lunge [ each leg ] [ https://www.youtube.com/watch?v=CpYyGD2hlv4 ]
  10 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-165 (SUCCESSORY WORK)

source: block-instances.md → block-165
schemas:

- schema-1:
  kind: named
  header: "3-4 sets | shoulders:"
  body: |
  3 strict DB press + 6 DB push press + 3 strict DB press [ 2x 15 kg ] | [ 2 sec SLOW down ]
  12 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  12 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3-4 sets | legs & glutes:"
  body: |
  10 DB Bulgarian split squats + 10 withot DB [ 2x 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  20 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ] [ 15 sec HOLD after LAST ]
  10 Low Hold KB Cossack Squat [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=ZclBW2lK-lY ]
  20 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-166 (SUCCESSORY WORK)

source: block-instances.md → block-166
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 DB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]
  15 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  10 TWO ARMS rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 KB Single Leg RDL to Reverse Lunge [ each leg ] [ https://www.youtube.com/watch?v=CpYyGD2hlv4 ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-167 (SUCCESSORY WORK)

source: block-instances.md → block-167
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  10 seated lateral BANDED raises [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  10 Glute Loop DB Hip Thrust [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=YdhYJv9ccPQ ]
  10 Low Hold KB Cossack Squat [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=ZclBW2lK-lY ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-168 (SUCCESSORY WORK)

source: block-instances.md → block-168
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  14 seated lateral BANDED raises [ 1 ARM HOLD in UP | another ARM DO 5 reps | than opposite | AND + 5 reps BOTH arms ]
  18 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 KB Bulgarian split squats [ 24 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  14 Glute Loop DB Hip Thrust [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=YdhYJv9ccPQ ]
  18 hamstring curls [ AFTER each 9th REP - 10 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-169 (SUCCESSORY WORK)

source: block-instances.md → block-169
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  15 seated lateral BANDED raises [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  15 Glute Loop DB Hip Thrust [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=YdhYJv9ccPQ ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-170 (SUCCESSORY WORK)

source: block-instances.md → block-170
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  15 seated lateral BANDED raises [ 1 ARM HOLD in UP | another ARM DO 5 reps | than opposite | AND + 5 reps BOTH arms ]
  20 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 KB Bulgarian split squats [ 24 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  15 Glute Loop DB Hip Thrust [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=YdhYJv9ccPQ ]
  20 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-171 (SUCCESSORY WORK)

source: block-instances.md → block-171
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 alternative DB press [ https://www.youtube.com/watch?v=T9OFhjgXt6c ]
  10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  15 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-172 (SUCCESSORY WORK)

source: block-instances.md → block-172
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 alternative DB press [ https://www.youtube.com/watch?v=T9OFhjgXt6c ]
  10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]
  10 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-173 (SUCCESSORY WORK)

source: block-instances.md → block-173
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 alternative DB press [ https://www.youtube.com/watch?v=T9OFhjgXt6c ]
  10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  6 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  12 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  18 hamstring curls [ AFTER each 6th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-174 (SUCCESSORY WORK)

source: block-instances.md → block-174
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 alternative DB press [ https://www.youtube.com/watch?v=T9OFhjgXt6c ]
  10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  9 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  12 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-175 (SUCCESSORY WORK)

source: block-instances.md → block-175
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  10 alternative DB press [ https://www.youtube.com/watch?v=T9OFhjgXt6c ]
  10-15 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  15 DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]
  15 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-176 (SUCCESSORY WORK)

source: block-instances.md → block-176
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  5 strict DB press + 10 DB push press [ 2x 15 kg ] | [ 2 sec SLOW down ]
  10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  15 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]
  15 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  20 hamstring curls [ AFTER each 10th REP - 10 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-177 (SUCCESSORY WORK)

source: block-instances.md → block-177
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  5 strict DB press + 5 DB push press [ 2x 15 kg ] | [ 2 sec SLOW down ]
  10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  10 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  10 Low Hold KB Cossack Squat [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=ZclBW2lK-lY ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-178 (SUCCESSORY WORK)

source: block-instances.md → block-178
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  5 strict DB press + 5 DB push press [ 2x 15 kg ] | [ 2 sec SLOW down ]
  10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]
  15 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  20 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-179 (SUCCESSORY WORK)

source: block-instances.md → block-179
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  5 strict DB press + 5 DB push press [ 2x 15 kg ] | [ 2 sec SLOW down ]
  10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  10 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  5 DB Bulgarian split squats [ 2x 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  10 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  10 Low Hold KB Cossack Squat [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=ZclBW2lK-lY ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-180 (SUCCESSORY WORK)

source: block-instances.md → block-180
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  5 strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press [ 2x 15 kg ]
  15 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  20 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]
  15 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  10-15 DB leg extension [ https://youtube.com/shorts/7mvLB5aq3fc?si=Hzy4Kur8ISirBJgv ]
  20 hamstring curls [ AFTER each 10th REP - 10 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-181 (SUCCESSORY WORK)

source: block-instances.md → block-181
schemas:

- schema-1:
  kind: named
  header: "3 sets | shoulders:"
  body: |
  5 strict DB press + 7 DB push press [ 2x 15 kg ] | [ 2 sec SLOW down ]
  10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  15 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3 sets | legs & glutes:"
  body: |
  10 DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]
  15 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]
  20 hamstring curls [ AFTER each 10th REP - 10 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-182 (SUCCESSORY WORK)

source: block-instances.md → block-182
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]
  15 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  20 TWO ARMS rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 KB Single Leg RDL to Reverse Lunge [ each leg ] [ https://www.youtube.com/watch?v=CpYyGD2hlv4 ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-183 (SUCCESSORY WORK)

source: block-instances.md → block-183
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB Seated Single Arm Arnold Press [ each arm ] [ https://www.youtube.com/watch?v=3Lhln4TspkU ]
  10 KB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  15 Single Leg KB Hip Thrust [ + 1 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]
  10 Hip abduction with band [ https://www.youtube.com/watch?v=k0oEjtPIsXI ]

### block-184 (SUCCESSORY WORK)

source: block-instances.md → block-184
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  10 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 Single Leg Kettlebell Hip Thrust [ + 1 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]
  10 DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]

### block-185 (SUCCESSORY WORK)

source: block-instances.md → block-185
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  10 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  15-20 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  15-20 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]

### block-186 (SUCCESSORY WORK)

source: block-instances.md → block-186
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  15 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  20 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]
  10 Hip ABduction with band

### block-187 (SUCCESSORY WORK)

source: block-instances.md → block-187
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  10-12 DB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]
  10-12 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  10-12 TWO ARMS rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  10 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 KB Single Leg RDL to Reverse Lunge [ each leg ] [ https://www.youtube.com/watch?v=CpYyGD2hlv4 ]
  15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-188 (SUCCESSORY WORK)

source: block-instances.md → block-188
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  7 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  14 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  21 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  15 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]

### block-189 (SUCCESSORY WORK)

source: block-instances.md → block-189
schemas:

- schema-1:
  kind: atomic
  header: "3 sets:"
  body: |
  7 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  14 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  21 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3 sets:"
  body: |
  15 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]
  10 KB swings [ 24 kg | to the parallel ] [ emphasis on the gluteal muscles ]

### block-190 (SUCCESSORY WORK)

source: block-instances.md → block-190
schemas:

- schema-1:
  kind: named
  header: "3-4 sets | shoulders:"
  body: |
  3 strict DB press + 9 DB push press + 3 strict DB press [ 2x 15 kg ] | [ 2 sec SLOW down ]
  15 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]
  15 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: named
  header: "3-4 sets | legs & glutes:"
  body: |
  10 DB Bulgarian split squats + 10 withot DB [ 2x 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]
  20 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ] [ 15 sec HOLD after LAST ]
  10 Low Hold KB Cossack Squat [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=ZclBW2lK-lY ]
  20 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-191 (SUCCESSORY WORK)

source: block-instances.md → block-191
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 DB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]
  10 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  10 TWO ARMS rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 KB Single Leg RDL to Reverse Lunge [ each leg ] [ https://www.youtube.com/watch?v=CpYyGD2hlv4 ]
  30 hamstring curls [ AFTER each 10th REP - 10 sec pause ] [ each leg ]
  [ https://www.youtube.com/watch?v=s3_W2rAbCiA ]

### block-192 (SUCCESSORY WORK)

source: block-instances.md → block-192
schemas:

- schema-1:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]
  15 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]
  20 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]
- schema-2:
  kind: atomic
  header: "3-4 sets:"
  body: |
  10 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]
  [ https://www.youtube.com/watch?v=UrmwWL1oqKk ]
  10 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]
  10 Hip ABduction with band

---

## CORE MUSCLES

### block-193 (CORE MUSCLES)

source: block-instances.md → block-193
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  ANY exercise for ABS

### block-194 (CORE MUSCLES)

source: block-instances.md → block-194
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  ANY exercise for ABS + DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]

### block-195 (CORE MUSCLES)

source: block-instances.md → block-195
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  ANY exercise for ABS + seated Good morning
  DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]

### block-196 (CORE MUSCLES)

source: block-instances.md → block-196
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  ANY exercise for ABS + DB seated good morning

### block-197 (CORE MUSCLES)

source: block-instances.md → block-197
schemas:

- schema-1:
  kind: headerless
  header: null
  body: |
  ANY exercise for ABS
  3x 10 DB Jefferson curls [ 15 kg ] [ https://www.youtube.com/watch?v=YGlAdtSKQaU ]

### block-198 (CORE MUSCLES)

source: block-instances.md → block-198
schemas: []
note: empty body, см. inventory edge-cases.

---

End of schema-boundaries.md (Phase 2.1).
